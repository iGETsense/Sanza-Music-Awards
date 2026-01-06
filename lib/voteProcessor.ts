/**
 * Vote Processor - Ensures votes are added accurately after payment
 */

import { adminDb as database } from '@/lib/firebaseAdmin';

interface TransactionInfo {
    id: string;
    nomineeId: string;
    voteCount: number;
    amount?: number;
}

interface ProcessResult {
    success: boolean;
    error?: string;
    votesAdded?: number;
    previousStatus?: string;
}

/**
 * Process a successful payment
 */
export async function processSuccessfulPayment(
    transaction: TransactionInfo,
    mesombStatus: string
): Promise<ProcessResult> {
    const { id, nomineeId, voteCount } = transaction;
    const logPrefix = `[VoteProcessor ${id}]`;

    if (!database) {
        console.warn(`${logPrefix} No database access - skipping vote processing`);
        return { success: false, error: 'No database access' };
    }

    try {
        const transactionRef = database.ref(`transactions/${id}`);
        const transactionSnapshot = await transactionRef.once('value');

        if (!transactionSnapshot.exists()) {
            return { success: false, error: 'Transaction not found' };
        }

        const currentTransaction = transactionSnapshot.val();
        const previousStatus = currentTransaction.status;

        // Idempotency: Already completed
        if (currentTransaction.status === 'completed') {
            return {
                success: true,
                votesAdded: 0,
                previousStatus: 'completed'
            };
        }

        // Mark transaction as completed FIRST
        await transactionRef.update({
            status: 'completed',
            completedAt: Date.now(),
            processedBy: 'voteProcessor',
            mesombStatus: mesombStatus,
            votesProcessed: false,
        });

        // Add votes to nominee using atomic update
        const nomineeRef = database.ref(`nominees/${nomineeId}`);
        const nomineeSnapshot = await nomineeRef.once('value');

        if (!nomineeSnapshot.exists()) {
            await transactionRef.update({
                votesProcessed: false,
                voteError: `Nominee ${nomineeId} not found`,
            });
            return { success: false, error: 'Nominee not found' };
        }

        // Atomics
        const votesRef = database.ref(`nominees/${nomineeId}/votes`);
        await votesRef.transaction((currentVotes) => {
            return (currentVotes || 0) + voteCount;
        });

        // Add to total votes in category if needed
        // (Assuming structure)

        // Mark votes as processed
        await transactionRef.update({
            votesProcessed: true,
            votesAddedAt: Date.now(),
        });

        // UPDATE GLOBAL STATS
        const statsRef = database.ref('stats');
        await statsRef.transaction((currentStats) => {
            if (!currentStats) return currentStats;
            return {
                ...currentStats,
                totalVotes: (currentStats.totalVotes || 0) + voteCount,
                totalRevenue: (currentStats.totalRevenue || 0) + (transaction.amount || 0),
                successfulTransactions: (currentStats.successfulTransactions || 0) + 1,
                totalTransactions: (currentStats.totalTransactions || 0) + 1,
            };
        });

        return {
            success: true,
            votesAdded: voteCount,
            previousStatus
        };

    } catch (error: any) {
        console.error(`${logPrefix} ERROR:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Mark a transaction as failed
 */
export async function markTransactionFailed(
    transactionId: string,
    reason: string,
    mesombStatus: string
): Promise<void> {
    if (!database) return;
    try {
        const transactionRef = database.ref(`transactions/${transactionId}`);
        const snapshot = await transactionRef.once('value');
        if (snapshot.exists()) {
            const current = snapshot.val();
            if (current.status === 'completed') return;
        }

        await transactionRef.update({
            status: 'failed',
            failedAt: Date.now(),
            failureReason: reason,
            mesombStatus: mesombStatus,
        });
    } catch (error: any) {
        console.error(`Error marking transaction failed:`, error);
    }
}
