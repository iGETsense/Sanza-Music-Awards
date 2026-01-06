import { NextRequest, NextResponse } from 'next/server';
import { makeWithdrawal } from '@/lib/mesomb';
import { adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, service, receiver } = body;

        if (!amount || !service || !receiver) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const nonce = `withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const withdrawalResult = await makeWithdrawal({
            amount,
            service,
            receiver,
            nonce
        });

        if (!withdrawalResult.success) {
            return NextResponse.json({
                success: false,
                error: withdrawalResult.error || 'Withdrawal failed'
            }, { status: 400 });
        }

        // Log withdrawal in Firebase if available
        if (adminDb) {
            await adminDb.ref(`withdrawals/${nonce}`).set({
                id: nonce,
                amount,
                service,
                receiver,
                status: 'success',
                reference: withdrawalResult.reference,
                createdAt: Date.now()
            });
        }

        return NextResponse.json(withdrawalResult);
    } catch (error: any) {
        console.error('Admin withdrawal error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
