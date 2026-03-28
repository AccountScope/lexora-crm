import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { getLoginHistory } from '@/lib/auth/rate-limiting';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const attempts = await getLoginHistory({
      email: auth.user.email || '',
      limit,
      offset,
    });

    return NextResponse.json({ success: true, attempts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
