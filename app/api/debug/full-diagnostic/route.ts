import { NextResponse } from "next/server";
import { query } from "@/lib/api/db";
import { verifyPassword } from "@/lib/auth/password";
import { debugGuard } from "../middleware";

export async function GET() {
  // Block in production
  const guard = debugGuard();
  if (guard) return guard;
  
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // 1. Database connection
    try {
      await query("SELECT 1");
      results.checks.database = { ok: true };
    } catch (e: any) {
      results.checks.database = { ok: false, error: e.message };
    }

    // 2. User exists
    try {
      const userRes = await query(
        `SELECT id, email, password_hash IS NOT NULL as has_password, email_verified, status, deleted_at 
         FROM users WHERE email = $1`,
        ['sabrina@test.com']
      );
      results.checks.user = {
        ok: userRes.rows.length > 0,
        data: userRes.rows[0] || null,
      };
    } catch (e: any) {
      results.checks.user = { ok: false, error: e.message };
    }

    // 3. Password verification
    try {
      const userRes = await query(
        `SELECT password_hash FROM users WHERE email = $1`,
        ['sabrina@test.com']
      );
      if (userRes.rows[0]?.password_hash) {
        const valid = await verifyPassword('TestPassword123!', userRes.rows[0].password_hash);
        results.checks.password_verify = { ok: true, valid };
      } else {
        results.checks.password_verify = { ok: false, error: 'No password hash' };
      }
    } catch (e: any) {
      results.checks.password_verify = { ok: false, error: e.message };
    }

    // 4. Sessions table exists
    try {
      const sessRes = await query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'sessions'`
      );
      results.checks.sessions_table = {
        ok: parseInt(sessRes.rows[0].count) > 0,
        count: sessRes.rows[0].count,
      };
    } catch (e: any) {
      results.checks.sessions_table = { ok: false, error: e.message };
    }

    // 5. Audit logs table exists
    try {
      const auditRes = await query(
        `SELECT COUNT(*) as count FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'audit_logs'`
      );
      results.checks.audit_logs_table = {
        ok: parseInt(auditRes.rows[0].count) > 0,
        count: auditRes.rows[0].count,
      };
    } catch (e: any) {
      results.checks.audit_logs_table = { ok: false, error: e.message };
    }

    // 6. Test session creation (dry run)
    try {
      const testToken = 'test_' + Math.random().toString(36);
      const sessInsert = await query(
        `INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '1 hour', NOW(), NOW())
         RETURNING id`,
        ['3aa8cbb3-0293-4171-ba56-a02e3e9ca54e', testToken]
      );
      // Clean up test session
      await query(`DELETE FROM sessions WHERE token = $1`, [testToken]);
      results.checks.session_insert = { ok: true };
    } catch (e: any) {
      results.checks.session_insert = { ok: false, error: e.message, code: (e as any).code };
    }

    // 7. Test audit log insert
    try {
      const auditInsert = await query(
        `INSERT INTO audit_logs (event_type, success, details, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id`,
        ['test.diagnostic', true, JSON.stringify({ test: true })]
      );
      // Clean up test audit log
      await query(`DELETE FROM audit_logs WHERE id = $1`, [auditInsert.rows[0].id]);
      results.checks.audit_log_insert = { ok: true };
    } catch (e: any) {
      results.checks.audit_log_insert = { ok: false, error: e.message, code: (e as any).code };
    }

    // 8. Environment variables
    results.checks.env_vars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      SUPABASE_DB_URL: !!process.env.SUPABASE_DB_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // Summary
    const failures = Object.entries(results.checks)
      .filter(([_, v]: any) => !v.ok)
      .map(([k]) => k);

    results.summary = {
      total: Object.keys(results.checks).length,
      passed: Object.keys(results.checks).length - failures.length,
      failed: failures.length,
      failures,
    };

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      ...results,
      fatal_error: error.message,
    }, { status: 500 });
  }
}
