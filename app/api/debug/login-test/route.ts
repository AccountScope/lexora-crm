import { debugGuard } from "../middleware";
import { NextResponse } from "next/server";
import { query } from "@/lib/api/db";
import { verifyPassword } from "@/lib/auth/password";

export async function GET() {
  const guard = debugGuard();
  if (guard) return guard;
  try {
    const email = 'sabrina@test.com';
    const password = 'TestPassword123!';
    const res = await query(
      `SELECT id, email, password_hash, email_verified, status FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ ok: false, reason: 'user_not_found' }, { status: 404 });
    }
    const user = res.rows[0] as any;
    const valid = await verifyPassword(password, user.password_hash);
    return NextResponse.json({
      ok: true,
      valid,
      email_verified: user.email_verified,
      status: user.status,
      userId: user.id,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
