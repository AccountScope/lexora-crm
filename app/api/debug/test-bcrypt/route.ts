import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const results: Record<string, any> = {};
  
  // Test bcryptjs
  try {
    const bcrypt = require("bcryptjs");
    results.bcrypt = { loaded: true };
    const hash = await bcrypt.hash("test", 10);
    results.bcrypt.hashWorks = true;
    results.bcrypt.sampleHash = hash;
  } catch (e: any) {
    results.bcrypt = { loaded: false, error: e.message };
  }

  return NextResponse.json(results);
}
