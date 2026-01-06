/**
 * Mesomb Payment Service for Vercel
 * Using official SDK - Aligned with NBDanceAward and including debug logs
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { PaymentOperation } from '@hachther/mesomb';

// Initialize Mesomb client
export function getMesombClient() {
    const applicationKey = process.env.MESOMB_APPLICATION_KEY;
    const accessKey = process.env.MESOMB_ACCESS_KEY;
    const secretKey = process.env.MESOMB_SECRET_KEY;

    // Enhanced debug logging (safe)
    console.log('[MeSomb] Initialization check:', {
        hasAppKey: !!applicationKey,
        appKeyLen: applicationKey?.length,
        hasAccessKey: !!accessKey,
        accessKeyLen: accessKey?.length,
        hasSecretKey: !!secretKey,
        secretKeyLen: secretKey?.length,
    });

    if (!applicationKey || !accessKey || !secretKey) {
        throw new Error('MeSomb credentials missing in .env.local');
    }

    // Basic format validation to catch common copy-paste errors
    if (applicationKey.length < 30 || !accessKey.includes('-')) {
        console.warn('[MeSomb] WARNING: Credentials format might be invalid.');
        console.warn(' - Application Key should be a ~40 char hex string');
        console.warn(' - Access/Secret Keys should be UUIDs (with hyphens)');
    }

    return new PaymentOperation({
        applicationKey,
        accessKey,
        secretKey,
    });
}

export interface CollectPaymentParams {
    amount: number;
    service: 'MTN' | 'ORANGE';
    payer: string;
    nonce: string;
}

export interface PaymentResult {
    success: boolean;
    status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELED';
    reference?: string;
    message?: string;
    error?: string;
    transactionId?: string;
}

export async function collectPayment(params: CollectPaymentParams): Promise<PaymentResult> {
    try {
        const payment = getMesombClient();

        console.log('[MeSomb] Request details:', {
            amount: params.amount,
            service: params.service,
            payer: '***',
            nonce: params.nonce
        });

        const response = await payment.makeCollect({
            amount: params.amount,
            service: params.service as any,
            payer: params.payer,
            nonce: params.nonce,
            country: 'CM',
            currency: 'XAF',
            fees: true,
            mode: 'asynchronous', // Essential for Next.js to avoid blocking
            customer: {
                email: 'vote@sanzamusicaward.com',
                first_name: 'Voter',
                last_name: 'Sanza',
                town: 'Douala',
                region: 'Littoral',
                country: 'CM',
            },
            products: [
                {
                    name: 'Vote Sanza Music Award',
                    category: 'Voting',
                    quantity: Math.floor(params.amount / 105),
                    amount: params.amount,
                },
            ],
        });

        console.log('[MeSomb] Raw SDK Response:', JSON.stringify(response, null, 2));

        const isOpSuccess = typeof response.isOperationSuccess === 'function' ? response.isOperationSuccess() : (response as any).success;
        if (!isOpSuccess) {
            return {
                success: false,
                status: 'FAILED',
                error: response.message || 'Payment operation failed',
            };
        }

        const isTxSuccess = typeof response.isTransactionSuccess === 'function' ? response.isTransactionSuccess() : ((response as any).status === 'SUCCESS' || (response as any).status === 'PENDING');
        if (!isTxSuccess) {
            return {
                success: false,
                status: 'FAILED',
                error: response.message || 'Transaction failed',
            };
        }

        return {
            success: true,
            status: 'PENDING',
            reference: response.reference || response.transaction?.pk,
            message: 'Payment initiated. Please confirm on your phone.',
        };
    } catch (error: any) {
        console.error('[MeSomb] SDK Error Detail:', error);
        return {
            success: false,
            status: 'FAILED',
            error: error.message || 'Payment initiation failed',
        };
    }
}

export async function checkPaymentStatus(reference: string): Promise<PaymentResult> {
    try {
        const payment = getMesombClient();
        const transactions = await payment.getTransactions([reference], 'MESOMB');

        if (!transactions || transactions.length === 0) {
            return { success: false, status: 'PENDING' };
        }

        const transaction = transactions[0];
        const isSuccess = transaction.status === 'SUCCESS';

        return {
            success: isSuccess,
            status: isSuccess ? 'SUCCESS' : (transaction.status === 'FAILED' ? 'FAILED' : 'PENDING'),
            reference,
            transactionId: transaction.pk
        };
    } catch (error: any) {
        console.error('[MeSomb] Status check error:', error);
        return { success: false, status: 'PENDING' };
    }
}

export async function makeWithdrawal(params: { amount: number, service: 'MTN' | 'ORANGE', receiver: string, nonce: string }): Promise<PaymentResult> {
    try {
        const payment = getMesombClient();
        console.log('[MeSomb] Initiating withdrawal:', {
            amount: params.amount,
            service: params.service,
            receiver: '***',
            nonce: params.nonce
        });

        const response = await payment.makeDeposit({
            amount: params.amount,
            service: params.service as any,
            receiver: params.receiver,
            nonce: params.nonce,
            country: 'CM',
            currency: 'XAF',
        });

        console.log('[MeSomb] Withdrawal Raw Response:', JSON.stringify(response, null, 2));

        const isOpSuccess = typeof response.isOperationSuccess === 'function' ? response.isOperationSuccess() : (response as any).success;

        if (!isOpSuccess) {
            return {
                success: false,
                status: 'FAILED',
                error: response.message || 'Withdrawal operation failed',
            };
        }

        return {
            success: true,
            status: 'SUCCESS',
            reference: response.reference || response.transaction?.pk,
            message: 'Withdrawal completed successfully.',
        };
    } catch (error: any) {
        console.error('[MeSomb] Withdrawal Detail Error:', error);
        return {
            success: false,
            status: 'FAILED',
            error: error.message || 'Withdrawal failed',
        };
    }
}

export async function getAccountBalance(): Promise<{ success: boolean; balance?: number; balances?: any[]; error?: string }> {
    try {
        const payment = getMesombClient();
        const application = await payment.getStatus();

        console.log('[MeSomb] App Status Response:', JSON.stringify(application, null, 2));

        const rawBalances = (application as any).balances || [];

        const findBalance = (provider: string) => {
            const found = rawBalances.find((b: any) => b.provider === provider && b.country === 'CM');
            return found ? found.value : 0;
        };

        const mtnBalance = findBalance('MTN');
        const orangeBalance = findBalance('ORANGE');

        return {
            success: true,
            balance: mtnBalance + orangeBalance,
            balances: [
                { service: 'MTN', value: mtnBalance, country: 'CM' },
                { service: 'ORANGE', value: orangeBalance, country: 'CM' }
            ]
        };
    } catch (error: any) {
        console.error('[MeSomb] Balance fetch error:', error);
        return {
            success: false,
            error: error.message,
            balance: 0,
            balances: []
        };
    }
}
