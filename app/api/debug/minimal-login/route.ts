import { debugGuard } from "../middleware";
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/api/db";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Step 1: Get user
    const result = await query(
      `SELECT id, email, password_hash, email_verified, status 
       FROM users 
       WHERE email = $1 AND deleted_at IS NULL`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ ok: false, step: 1, reason: 'user_not_found' }, { status: 401 });
    }

    const user = result.rows[0];

    // Step 2: Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json({ ok: false, step: 2, reason: 'invalid_password' }, { status: 401 });
    }

    // Step 3: Check email verified
    if (!user.email_verified) {
      return NextResponse.json({ ok: false, step: 3, reason: 'email_not_verified' }, { status: 403 });
    }

    // Step 4: Check status
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ ok: false, step: 4, reason: 'not_active', status: user.status }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      message: 'All checks passed! (session creation skipped in this test)',
      user_id: user.id,
      email: user.email,
    });

  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      code: error.code,
      stack: error.stack,
    }, { status: 500 });
  }
}
