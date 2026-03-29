import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/api/db";
import { verifyPassword } from "@/lib/auth/password";
import { ensureSession, serializeSessionCookie, serializeRememberCookie } from "@/lib/auth/sessions";
import { logAuthEvent } from "@/lib/audit/logger";

export async function GET(request: NextRequest) {
  const steps: any[] = [];
  
  try {
    const email = 'sabrina@test.com';
    const password = 'TestPassword123!';

    // Step 1: Get user
    steps.push({ step: 1, name: 'query_user', status: 'started' });
    const result = await query(
      `SELECT id, email, password_hash, user_type as role, email_verified, two_factor_enabled
       FROM users 
       WHERE email = $1 AND deleted_at IS NULL AND status = 'ACTIVE'`,
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      steps.push({ step: 1, status: 'failed', reason: 'user_not_found' });
      return NextResponse.json({ ok: false, steps });
    }
    steps.push({ step: 1, status: 'success', user_id: result.rows[0].id });

    const user = result.rows[0];

    // Step 2: Verify password
    steps.push({ step: 2, name: 'verify_password', status: 'started' });
    const isValidPassword = await verifyPassword(password, user.password_hash);
    
    if (!isValidPassword) {
      steps.push({ step: 2, status: 'failed', reason: 'invalid_password' });
      return NextResponse.json({ ok: false, steps });
    }
    steps.push({ step: 2, status: 'success' });

    // Step 3: Check email verified
    steps.push({ step: 3, name: 'check_email_verified', status: 'started' });
    if (!user.email_verified) {
      steps.push({ step: 3, status: 'failed', reason: 'email_not_verified' });
      return NextResponse.json({ ok: false, steps });
    }
    steps.push({ step: 3, status: 'success' });

    // Step 4: Create session
    steps.push({ step: 4, name: 'create_session', status: 'started' });
    try {
      const { token } = await ensureSession({
        userId: user.id,
        userEmail: user.email,
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        rememberMe: true,
      });
      steps.push({ step: 4, status: 'success', token_length: token.length });
    } catch (e: any) {
      steps.push({ step: 4, status: 'failed', error: e.message, stack: e.stack });
      return NextResponse.json({ ok: false, steps }, { status: 500 });
    }

    // Step 5: Serialize cookies
    steps.push({ step: 5, name: 'serialize_cookies', status: 'started' });
    try {
      const sessionCookie = serializeSessionCookie('test_token_123', true);
      const rememberCookie = serializeRememberCookie(true);
      steps.push({ 
        step: 5, 
        status: 'success',
        session_cookie: sessionCookie.name,
        remember_cookie: rememberCookie.name,
      });
    } catch (e: any) {
      steps.push({ step: 5, status: 'failed', error: e.message });
      return NextResponse.json({ ok: false, steps }, { status: 500 });
    }

    // Step 6: Log auth event
    steps.push({ step: 6, name: 'log_auth_event', status: 'started' });
    try {
      await logAuthEvent({
        type: "auth.login",
        success: true,
        actor: { id: user.id, email: user.email },
      });
      steps.push({ step: 6, status: 'success' });
    } catch (e: any) {
      steps.push({ step: 6, status: 'failed', error: e.message });
      return NextResponse.json({ ok: false, steps }, { status: 500 });
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'All login steps passed!',
      steps 
    });

  } catch (error: any) {
    steps.push({ 
      step: 'unknown', 
      status: 'fatal_error', 
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json({ ok: false, steps }, { status: 500 });
  }
}
