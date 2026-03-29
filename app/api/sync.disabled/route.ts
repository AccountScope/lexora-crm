import { NextRequest, NextResponse } from 'next/server';

// FIXME: Sync routes need proper implementation with correct DB interface
// Current implementation uses non-existent `query` function from @/lib/api/db
// Disabled until properly rebuilt to use withDb/createClient pattern

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Sync API temporarily disabled - under reconstruction' },
    { status: 501 }
  );
}
