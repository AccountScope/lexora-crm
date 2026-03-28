import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/api/db";
import { hashPassword } from "@/lib/auth/password";
import { logAuthEvent } from "@/lib/audit/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await withDb(async (client) => {
      // Check if user already exists
      const existing = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email.toLowerCase()]
      );

      if (existing.rows.length > 0) {
        throw new Error("User already exists");
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, first_name, last_name, role`,
        [email.toLowerCase(), passwordHash, firstName, lastName, "lawyer", true, true]
      );

      return result.rows[0];
    });

    await logAuthEvent({
      type: "auth.session.created",
      success: true,
      actor: { id: user.id, email: user.email },
    });

    return NextResponse.json({
      success: true,
      message: "User registered successfully. Please log in.",
      user: {
        id: user.id,
        email: user.email,
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("[REGISTER_ERROR]", error);
    
    const message = error.message === "User already exists" 
      ? "User already exists" 
      : "An error occurred during registration";
    
    const status = error.message === "User already exists" ? 409 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
