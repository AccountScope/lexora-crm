import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { requestAccountDeletion, getUserDeletionRequest } from '@/lib/gdpr/deletion';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    if (!auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const request = await getUserDeletionRequest(auth.user.id);
    return NextResponse.json({ success: true, request });
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

    const { password } = await req.json();
    
    // TODO: Verify password before allowing deletion
    
    const request = await requestAccountDeletion(auth.user.id);
    
    // TODO: Send cancellation email with token
    
    return NextResponse.json({ success: true, request });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
