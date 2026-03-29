import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ message: "Use POST" });
}

export async function POST(request: NextRequest) {
  const results: Record<string, any> = { step: 0 };
  
  try {
    const body = await request.json();
    results.bodyReceived = !!body;
  } catch {
    results.bodyReceived = false;
  }
  
  // Test 1: Import db
  try {
    results.step = 1;
    const db = await import("@/lib/api/db");
    results.db = "ok";
  } catch (e: any) {
    results.db = { error: e.message, stack: e.stack?.split("\n").slice(0, 5) };
    return NextResponse.json(results, { status: 500 });
  }

  // Test 2: Import bcrypt directly
  try {
    results.step = 2;
    const bcrypt = await import("bcrypt");
    results.bcrypt = "ok";
  } catch (e: any) {
    results.bcrypt = { error: e.message, stack: e.stack?.split("\n").slice(0, 5) };
    return NextResponse.json(results, { status: 500 });
  }

  // Test 3: Import password module
  try {
    results.step = 3;
    const password = await import("@/lib/auth/password");
    results.password = "ok";
  } catch (e: any) {
    results.password = { error: e.message, stack: e.stack?.split("\n").slice(0, 5) };
    return NextResponse.json(results, { status: 500 });
  }

  // Test 4: Import sessions module
  try {
    results.step = 4;
    const sessions = await import("@/lib/auth/sessions");
    results.sessions = "ok";
  } catch (e: any) {
    results.sessions = { error: e.message, stack: e.stack?.split("\n").slice(0, 5) };
    return NextResponse.json(results, { status: 500 });
  }

  // Test 5: Import audit logger
  try {
    results.step = 5;
    const audit = await import("@/lib/audit/logger");
    results.audit = "ok";
  } catch (e: any) {
    results.audit = { error: e.message, stack: e.stack?.split("\n").slice(0, 5) };
    return NextResponse.json(results, { status: 500 });
  }

  return NextResponse.json(results);
}
