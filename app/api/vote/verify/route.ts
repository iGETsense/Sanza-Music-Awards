import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { checkPaymentStatus } from '@/lib/mesomb';
import { processSuccessfulPayment, markTransactionFailed } from '@/lib/voteProcessor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { transactionId } = body;

        if (!transactionId) {
            return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
        }

        if (!adminDb) {
            // Mock mode
            return NextResponse.json({ success: true, status: 'completed', message: 'Mock verification' });
        }

        const transactionRef = adminDb.ref(`transactions/${transactionId}`);
        const snapshot = await transactionRef.once('value');

        if (!snapshot.exists()) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        const transaction = snapshot.val();

        if (transaction.status === 'completed') {
            return NextResponse.json({
                success: true,
                status: 'completed',
                message: 'Payment confirmed! Votes added.'
            });
        }

        if (transaction.status === 'failed') {
            return NextResponse.json({
                success: false,
                status: 'failed',
                message: transaction.failureReason || 'Payment failed'
            });
        }

        if (!transaction.mesombReference) {
            return NextResponse.json({
                success: false,
                status: 'creating',
                message: 'Initializing...'
            });
        }

        // Check with MeSomb
        const result = await checkPaymentStatus(transaction.mesombReference);

        if (result.status === 'SUCCESS') {
            const processResult = await processSuccessfulPayment({
                id: transactionId,
                nomineeId: transaction.nomineeId,
                voteCount: transaction.voteCount,
                amount: transaction.amount
            }, 'SUCCESS_VERIFY');

            if (processResult.success) {
                return NextResponse.json({
                    success: true,
                    status: 'completed',
                    message: 'Payment confirmed! Votes added.'
                });
            }
        } else if (result.status === 'FAILED' || result.status === 'CANCELED') {
            await markTransactionFailed(transactionId, `MeSomb: ${result.status}`, result.status);
            return NextResponse.json({
                success: false,
                status: 'failed',
                message: 'Payment failed'
            });
        }

        return NextResponse.json({
            success: false,
            status: 'pending',
            message: 'Please complete payment on your phone'
        });

    } catch (error: any) {
        console.error('Verify error:', error);
        return NextResponse.json({ error: 'Verification error' }, { status: 500 });
    }
}
