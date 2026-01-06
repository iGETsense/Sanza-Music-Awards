import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { checkPaymentStatus } from '@/lib/mesomb';
import { processSuccessfulPayment } from '@/lib/voteProcessor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { transactionId } = await request.json();

        if (!transactionId) {
            return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
        }

        if (!adminDb) {
            return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
        }

        // 1. Get transaction from Firebase
        const txSnapshot = await adminDb.ref(`transactions/${transactionId}`).once('value');
        if (!txSnapshot.exists()) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        const transaction = txSnapshot.val();

        // Only allow verifying pending transactions
        if (transaction.status !== 'pending' && transaction.status !== 'processing') {
            return NextResponse.json({
                error: `Transaction is already ${transaction.status}`,
                status: transaction.status
            }, { status: 400 });
        }

        // 2. Check status on MeSomb
        const mesombId = transaction.mesomb_id || transaction.id;
        const statusResult = await checkPaymentStatus(mesombId);

        console.log(`Manual Verify for ${transactionId}:`, statusResult);

        // 3. Process if successful
        if (statusResult.status === 'SUCCESS') {
            const processResult = await processSuccessfulPayment({
                id: transactionId,
                nomineeId: transaction.nomineeId || transaction.nominee_id,
                voteCount: transaction.voteCount || transaction.votes || 1,
                amount: transaction.amount
            }, statusResult.status);

            return NextResponse.json({
                success: true,
                message: 'Transaction vérifiée et complétée avec succès',
                status: 'success',
                processResult
            });
        }

        // 4. Update if failed on MeSomb
        if (statusResult.status === 'FAILED') {
            await adminDb.ref(`transactions/${transactionId}`).update({
                status: 'failed',
                error: statusResult.message || 'Échec confirmé par MeSomb',
                verifiedAt: Date.now()
            });

            return NextResponse.json({
                success: true,
                message: 'Transaction marquée comme échouée (confirmé par MeSomb)',
                status: 'failed'
            });
        }

        // Still pending or error
        return NextResponse.json({
            success: false,
            message: statusResult.message || 'La transaction est toujours en attente sur MeSomb',
            status: transaction.status,
            mesombStatus: statusResult.status
        });

    } catch (error: any) {
        console.error('Admin manual verify error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
