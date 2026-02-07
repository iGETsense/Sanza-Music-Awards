/**
 * Mesomb Payment Service - Official SDK Implementation
 * Using @hachther/mesomb for proper authentication
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { PaymentOperation } from '@hachther/mesomb';

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

function getMeSombClient(): PaymentOperation {
    const applicationKey = process.env.MESOMB_APPLICATION_KEY?.trim() || '';
    const accessKey = process.env.MESOMB_ACCESS_KEY?.trim() || '';
    const secretKey = process.env.MESOMB_SECRET_KEY?.trim() || '';

    if (!applicationKey || !accessKey || !secretKey) {
        throw new Error('MeSomb credentials missing in environment variables');
    }

    return new PaymentOperation({
        applicationKey,
        accessKey,
        secretKey,
    });
}

// 1. Collect Payment
export async function collectPayment(params: CollectPaymentParams): Promise<PaymentResult> {
    try {
        console.log('[MeSomb SDK] Initiating collection:', {
            amount: params.amount,
            service: params.service,
            payer: '***',
            nonce: params.nonce
        });

        const client = getMeSombClient();

        const result = await client.makeCollect({
            amount: params.amount,
            service: params.service,
            payer: params.payer,
            nonce: params.nonce,
            country: 'CM',
            currency: 'XAF',
            fees: false,
            mode: 'asynchronous',
            customer: {
                email: 'vote@african-singing-awards.com',
                first_name: 'African Singing',
                last_name: 'Awards',
                town: 'Douala',
                region: 'Littoral',
                country: 'CM',
            },
            products: [
                {
                    name: 'VOTE SANZA MUSIC AWARDS',
                    category: 'Voting',
                    quantity: 1,
                    amount: params.amount,
                },
            ],
        });

        console.log('[MeSomb SDK] Collection Response:', JSON.stringify(result, null, 2));

        if (result.success || result.status === 'SUCCESS' || result.status === 'PENDING') {
            return {
                success: true,
                status: 'PENDING',
                reference: result.transaction?.pk || result.reference,
                message: 'Payment initiated. Please confirm on your phone.',
            };
        }

        return {
            success: false,
            status: 'FAILED',
            error: result.message || 'Payment operation failed',
        };

    } catch (error: any) {
        console.error('[MeSomb SDK] collectPayment Error:', error.message);
        return {
            success: false,
            status: 'FAILED',
            error: error.message || 'Payment initiation failed',
        };
    }
}

// 2. Check Payment Status
export async function checkPaymentStatus(reference: string): Promise<PaymentResult> {
    try {
        const client = getMeSombClient();
        const transactions = await client.getTransactions([reference]);

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
        console.error('[MeSomb SDK] Status check error:', error.message);
        return { success: false, status: 'PENDING' };
    }
}

// 3. Make Withdrawal
export async function makeWithdrawal(params: { amount: number, service: 'MTN' | 'ORANGE', receiver: string, nonce: string }): Promise<PaymentResult> {
    try {
        console.log('[MeSomb SDK] Initiating withdrawal:', {
            amount: params.amount,
            service: params.service,
            receiver: '***',
            nonce: params.nonce
        });

        const client = getMeSombClient();

        const result = await client.makeDeposit({
            amount: params.amount,
            service: params.service,
            receiver: params.receiver,
            nonce: params.nonce,
            country: 'CM',
            currency: 'XAF',
        });

        console.log('[MeSomb SDK] Withdrawal Response:', JSON.stringify(result, null, 2));

        if (result.success || result.status === 'SUCCESS') {
            return {
                success: true,
                status: 'SUCCESS',
                reference: result.transaction?.pk || result.reference,
                message: 'Withdrawal completed successfully.',
            };
        }

        return {
            success: false,
            status: 'FAILED',
            error: result.message || 'Withdrawal operation failed',
        };
    } catch (error: any) {
        console.error('[MeSomb SDK] makeWithdrawal Error:', error.message);
        return {
            success: false,
            status: 'FAILED',
            error: error.message || 'Withdrawal failed',
        };
    }
}

// 4. Get Account Balance
export async function getAccountBalance(): Promise<{ success: boolean; balance?: number; balances?: any[]; error?: string }> {
    try {
        const client = getMeSombClient();
        const application = await client.getStatus();

        console.log('[MeSomb SDK] App Status Response:', JSON.stringify(application, null, 2));

        const rawBalances = application.balances || [];
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
        console.error('[MeSomb SDK] Balance fetch error (returning 0):', error.message);
        return {
            success: true,
            balance: 0,
            balances: [],
            error: error.message
        };
    }
}
