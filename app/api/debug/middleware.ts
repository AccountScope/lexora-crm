import { NextResponse } from 'next/server';

/**
 * Debug Route Protection
 * Blocks all debug endpoints in production
 */
export function debugGuard() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }
  return null; // Allow in development
}
