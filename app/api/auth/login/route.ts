import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/api/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/sessions";
import { logAuthEvent } from "@/lib/audit/logger";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get user from database
    const result = await query(
      `SELECT id, email, password_hash, role, email_verified, two_factor_enabled
       FROM users 
       WHERE email = $1 AND active = true`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Don't reveal whether user exists
      await logAuthEvent({
        type: "auth.login.failed",
        success: false,
        details: { reason: "invalid_credentials", email },
      });
      
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      await logAuthEvent({
        type: "auth.login.failed",
        success: false,
        actor: { id: user.id, email: user.email },
        details: { reason: "invalid_password" },
      });

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.email_verified) {
      await logAuthEvent({
        type: "auth.login.blocked",
        success: false,
        actor: { id: user.id, email: user.email },
        details: { reason: "email_not_verified" },
      });

      return NextResponse.json(
        { 
          error: "Email not verified",
          requiresEmailVerification: true 
        },
        { status: 403 }
      );
    }

    // Check if 2FA is required
    if (user.two_factor_enabled) {
      // Create temporary session for 2FA challenge
      const session = await createSession({
        userId: user.id,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        twoFactorVerified: false,
      });

      // Set session cookie
      cookies().set("lexora-session", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 15, // 15 minutes for 2FA completion
        path: "/",
      });

      await logAuthEvent({
        type: "auth.login.2fa_required",
        success: true,
        actor: { id: user.id, email: user.email },
      });

      return NextResponse.json({
        success: true,
        requiresTwoFactor: true,
      });
    }

    // Create full session
    const session = await createSession({
      userId: user.id,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      twoFactorVerified: false,
    });

    // Set session cookie
    cookies().set("lexora-session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    await logAuthEvent({
      type: "auth.login.success",
      success: true,
      actor: { id: user.id, email: user.email },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[LOGIN_ERROR]", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
