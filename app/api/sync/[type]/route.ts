import { NextRequest, NextResponse } from 'next/server';

// FIXME: Sync routes need proper implementation  
// Disabled until properly rebuilt

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Sync API temporarily disabled' },
    { status: 501 }
  );
}
