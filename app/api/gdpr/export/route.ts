import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { requestDataExport, getUserExportRequests } from '@/lib/gdpr/export';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await getUserExportRequests(auth.user.id);
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const request = await requestDataExport(auth.user.id);
    
    // TODO: Queue background job to generate export
    // For now, just create the request
    
    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
