import { NextResponse } from "next/server";
import { query } from "@/lib/api/db";

export async function GET() {
  try {
    const testData = {
      user_id: '3aa8cbb3-0293-4171-ba56-a02e3e9ca54e',
      token: 'test_token_' + Date.now(),
      device: 'Test Device',
      browser: 'Chrome',
      os: 'Windows',
      user_agent: 'Mozilla/5.0',
      fingerprint: 'test_fingerprint',
      remember_me: true,
      ip_address: '127.0.0.1',
      location: 'Test Location',
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    };

    const result = await query(
      `INSERT INTO sessions (
        user_id, token, device, browser, os, user_agent, 
        fingerprint, remember_me, ip_address, location, 
        last_activity, expires_at, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),$11,NOW(),NOW())
      RETURNING id`,
      [
        testData.user_id,
        testData.token,
        testData.device,
        testData.browser,
        testData.os,
        testData.user_agent,
        testData.fingerprint,
        testData.remember_me,
        testData.ip_address,
        testData.location,
        testData.expires_at,
      ]
    );

    // Clean up test session
    await query(`DELETE FROM sessions WHERE id = $1`, [result.rows[0].id]);

    return NextResponse.json({
      ok: true,
      message: 'Session insert works!',
      session_id: result.rows[0].id,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack,
    }, { status: 500 });
  }
}
