import { NextResponse } from "next/server";
import { query } from "@/lib/api/db";
import { debugGuard } from "../middleware";

export async function GET() {
  // Block in production
  const guard = debugGuard();
  if (guard) return guard;
  
  try {
    // Test basic connection
    const pingResult = await query("SELECT 1 as ping");
    
    // Test user query
    const userResult = await query(
      `SELECT id, email, password_hash IS NOT NULL as has_password, status, email_verified, deleted_at
       FROM users 
       WHERE email = $1`,
      ["sabrina@test.com"]
    );

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        ping: pingResult.rows[0],
      },
      user: userResult.rows[0] || null,
      connectionString: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || "NOT SET",
      supabaseDbUrl: process.env.SUPABASE_DB_URL?.replace(/:[^:@]+@/, ':****@') || "NOT SET",
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      connectionString: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || "NOT SET",
      supabaseDbUrl: process.env.SUPABASE_DB_URL?.replace(/:[^:@]+@/, ':****@') || "NOT SET",
    }, { status: 500 });
  }
}
