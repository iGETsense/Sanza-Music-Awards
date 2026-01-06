import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!adminDb) {
            return NextResponse.json({ success: true, withdrawals: [] });
        }

        const snapshot = await adminDb.ref('withdrawals').orderByChild('createdAt').limitToLast(100).once('value');
        const withdrawals: any[] = [];

        snapshot.forEach((child) => {
            withdrawals.push({
                id: child.key,
                ...child.val()
            });
        });

        // Sort by date descending
        withdrawals.sort((a, b) => b.createdAt - a.createdAt);

        return NextResponse.json({ success: true, withdrawals });
    } catch (error: any) {
        console.error('Withdrawal history error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
