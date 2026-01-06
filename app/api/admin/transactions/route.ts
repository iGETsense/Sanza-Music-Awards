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

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!adminDb) {
            // Mock transactions
            return NextResponse.json({
                transactions: [
                    {
                        id: 'tx_1',
                        nominee_name: 'Charlotte Dipanda',
                        amount: 1050,
                        status: 'success',
                        payment_method: 'MOMO',
                        votes_count: 10,
                        created_at: new Date().toISOString()
                    },
                    {
                        id: 'tx_2',
                        nominee_name: 'Fally Ipupa',
                        amount: 525,
                        status: 'pending',
                        payment_method: 'OM',
                        votes_count: 5,
                        created_at: new Date(Date.now() - 3600000).toISOString()
                    }
                ]
            });
        }

        const snapshot = await adminDb.ref('transactions')
            .orderByChild('createdAt')
            .limitToLast(limit)
            .once('value');

        const transactions: any[] = [];
        snapshot.forEach(child => {
            transactions.unshift({ id: child.key, ...child.val() });
            return false;
        });

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error('Admin transactions error:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}
