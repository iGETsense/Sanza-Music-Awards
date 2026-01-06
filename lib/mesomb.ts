/**
 * Mesomb Payment Service for Vercel
 * Using official SDK - Aligned with NBDanceAward and including debug logs
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { PaymentOperation } from '@hachther/mesomb';
import crypto from 'crypto';

// Initialize Mesomb client
export function getMesombClient() {
    const rawAppKey = process.env.MESOMB_APPLICATION_KEY || '';
    const rawAccessKey = process.env.MESOMB_ACCESS_KEY || '';
    const rawSecretKey = process.env.MESOMB_SECRET_KEY || '';

    const applicationKey = rawAppKey.trim();
    const accessKey = rawAccessKey.trim();
    const secretKey = rawSecretKey.trim();

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

        console.log('[MeSomb] Initiating collection (SDK):', {
            amount: params.amount,
            service: params.service,
            payer: '***',
            nonce: params.nonce
        });

        const response = await payment.makeCollect({
            amount: params.amount,
            service: params.service,
            payer: params.payer,
            nonce: params.nonce,
            country: 'CM',
            currency: 'XAF',
            fees: true,
            mode: 'asynchronous',
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

        console.log('[MeSomb] Collection Response:', JSON.stringify(response, null, 2));

        // Check if operation succeeded using SDK methods or fallback to plain object
        const isOpSuccess = typeof response.isOperationSuccess === 'function'
            ? response.isOperationSuccess()
            : (response as any).success;

        if (!isOpSuccess) {
            return {
                success: false,
                status: 'FAILED',
                error: response.message || 'Payment operation failed',
            };
        }

        return {
            success: true,
            status: 'PENDING',
            reference: response.reference || response.transaction?.pk,
            message: 'Payment initiated. Please confirm on your phone.',
        };
    } catch (error: any) {
        console.error('[MeSomb] collectPayment Error:', error.message, {
            cause: error.cause,
            stack: error.stack
        });
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
        const isFailed = transaction.status === 'FAILED';

        return {
            success: isSuccess,
            status: isSuccess ? 'SUCCESS' : (isFailed ? 'FAILED' : 'PENDING'),
            reference,
            transactionId: transaction.pk
        };
    } catch (error: any) {
        console.error('[MeSomb] Status check error:', error.message, {
            cause: error.cause,
            stack: error.stack
        });
        return { success: false, status: 'PENDING' };
    }
}

export async function makeWithdrawal(params: { amount: number, service: 'MTN' | 'ORANGE', receiver: string, nonce: string }): Promise<PaymentResult> {
    try {
        const payment = getMesombClient();

        console.log('[MeSomb] Initiating withdrawal (SDK):', {
            amount: params.amount,
            service: params.service,
            receiver: '***',
            nonce: params.nonce
        });

        const response = await payment.makeDeposit({
            amount: params.amount,
            service: params.service,
            receiver: params.receiver,
            nonce: params.nonce,
            country: 'CM',
            currency: 'XAF',
            location: {
                town: 'Douala',
                region: 'Littoral',
                country: 'CM',
            }
        });

        console.log('[MeSomb] Withdrawal Response:', JSON.stringify(response, null, 2));

        const isOpSuccess = typeof response.isOperationSuccess === 'function'
            ? response.isOperationSuccess()
            : (response as any).success;

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
        console.error('[MeSomb] makeWithdrawal Error:', error.message, {
            cause: error.cause,
            stack: error.stack
        });
        return {
            success: false,
            status: 'FAILED',
            error: error.message || 'Withdrawal failed',
        };
    }
}


export async function getAccountBalance(): Promise<{ success: boolean; balance?: number; balances?: any[]; error?: string }> {
    try {
        // Use the official SDK which handles signature generation correctly
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
        console.error('[MeSomb] Balance fetch error:', error.message, {
            cause: error.cause,
            stack: error.stack
        });
        return {
            success: false,
            error: error.message,
            balance: 0,
            balances: []
        };
    }
}
