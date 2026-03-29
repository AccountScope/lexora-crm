import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/api/db";
import { verifyPassword } from "@/lib/auth/password";
import { ensureSession, serializeSessionCookie, serializeRememberCookie } from "@/lib/auth/sessions";
import { logAuthEvent } from "@/lib/audit/logger";

export async function POST(request: NextRequest) {
  const trace: any[] = [];
  
  try {
    trace.push({ step: 1, action: 'parse_body', status: 'start' });
    const body = await request.json();
    const { email, password } = body;
    trace.push({ step: 1, status: 'success', email_provided: !!email, password_provided: !!password });

    if (!email || !password) {
      trace.push({ step: 1, status: 'validation_failed' });
      return NextResponse.json({ trace, error: "Email and password are required" }, { status: 400 });
    }

    trace.push({ step: 2, action: 'query_user', status: 'start' });
    const result = await query(
      `SELECT id, email, password_hash, user_type as role, email_verified, two_factor_enabled
       FROM users 
       WHERE email = $1 AND deleted_at IS NULL AND status = 'ACTIVE'`,
      [email.toLowerCase()]
    );
    trace.push({ 
      step: 2, 
      status: 'success', 
      user_found: result.rows.length > 0,
      user_id: result.rows[0]?.id,
      has_password_hash: !!result.rows[0]?.password_hash 
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ trace, error: "User not found" }, { status: 401 });
    }

    const user = result.rows[0];

    trace.push({ step: 3, action: 'verify_password', status: 'start' });
    const isValidPassword = await verifyPassword(password, user.password_hash);
    trace.push({ step: 3, status: 'success', password_valid: isValidPassword });

    if (!isValidPassword) {
      return NextResponse.json({ trace, error: "Invalid password" }, { status: 401 });
    }

    trace.push({ step: 4, action: 'check_email_verified', status: 'start' });
    if (!user.email_verified) {
      trace.push({ step: 4, status: 'failed', reason: 'email_not_verified' });
      return NextResponse.json({ trace, error: "Email not verified" }, { status: 403 });
    }
    trace.push({ step: 4, status: 'success' });

    trace.push({ step: 5, action: 'create_session', status: 'start' });
    const sessionResult = await ensureSession({
      userId: user.id,
      userEmail: user.email,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
      rememberMe: true,
    });
    trace.push({ step: 5, status: 'success', token_generated: !!sessionResult.token });

    trace.push({ step: 6, action: 'serialize_cookies', status: 'start' });
    const sessionCookie = serializeSessionCookie(sessionResult.token, true);
    const rememberCookie = serializeRememberCookie(true);
    trace.push({ 
      step: 6, 
      status: 'success',
      session_cookie_name: sessionCookie.name,
      remember_cookie_name: rememberCookie.name
    });

    trace.push({ step: 7, action: 'log_auth_event', status: 'start' });
    await logAuthEvent({
      type: "auth.login",
      success: true,
      actor: { id: user.id, email: user.email },
    });
    trace.push({ step: 7, status: 'success' });

    return NextResponse.json({
      success: true,
      trace,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error: any) {
    trace.push({ 
      step: 'ERROR', 
      error_message: error.message,
      error_code: error.code,
      error_stack: error.stack,
    });
    
    return NextResponse.json({
      success: false,
      trace,
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
