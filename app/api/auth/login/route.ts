import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/api/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { ensureSession, serializeSessionCookie, serializeRememberCookie } from "@/lib/auth/sessions";
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
      `SELECT id, email, password_hash, user_type as role, email_verified, two_factor_enabled
       FROM users 
       WHERE email = $1 AND deleted_at IS NULL AND status = 'ACTIVE'`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Don't reveal whether user exists
      await logAuthEvent({
        type: "auth.login",
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
        type: "auth.login",
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
        type: "auth.login",
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
      const { token } = await ensureSession({
        userId: user.id,
        userEmail: user.email,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        rememberMe: false,
      });

      // Set session cookie (15 min for 2FA)
      const sessionCookie = serializeSessionCookie(token, false);
      cookies().set(sessionCookie.name, sessionCookie.value, {
        ...sessionCookie.options,
        maxAge: 60 * 15, // Override to 15 minutes for 2FA completion
      });

      await logAuthEvent({
        type: "auth.login",
        success: true,
        actor: { id: user.id, email: user.email },
      });

      return NextResponse.json({
        success: true,
        requiresTwoFactor: true,
      });
    }

    // Create full session
    const { token } = await ensureSession({
      userId: user.id,
      userEmail: user.email,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      rememberMe: true, // Default to remember me
    });

    // Set session cookie
    const sessionCookie = serializeSessionCookie(token, true);
    const rememberCookie = serializeRememberCookie(true);
    
    cookies().set(sessionCookie.name, sessionCookie.value, sessionCookie.options);
    cookies().set(rememberCookie.name, rememberCookie.value, rememberCookie.options);

    await logAuthEvent({
      type: "auth.login",
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
