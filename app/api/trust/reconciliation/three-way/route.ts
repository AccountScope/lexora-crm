/**
 * Three-Way Reconciliation Report API
 * GET - Generate three-way reconciliation report
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generateThreeWayReport } from '@/lib/trust/reports';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const report = await generateThreeWayReport(accountId);

    if (!report) {
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error('[THREE_WAY_REPORT_GET]', error);
    return NextResponse.json(
      { error: 'Failed to generate three-way report' },
      { status: 500 }
    );
  }
}
