/**
 * Mesomb Payment Service for Vercel
 * Using official SDK - Aligned with NBDanceAward and including debug logs
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { PaymentOperation } from '@hachther/mesomb';
import crypto from 'crypto';

// MeSomb API constants
const MESOMB_API_BASE = 'https://mesomb.hachther.com/api/v1.1';
const MESOMB_HOST = 'mesomb.hachther.com';

/**
 * Generic Direct API request handler for MeSomb
 * Manually handles signing to bypass SDK issues in serverless environments
 */
async function mesombRequestDirect(endpoint: string, method: string, body: any = null): Promise<any> {
    const applicationKey = process.env.MESOMB_APPLICATION_KEY;
    const accessKey = process.env.MESOMB_ACCESS_KEY;
    const secretKey = process.env.MESOMB_SECRET_KEY;

    if (!applicationKey || !accessKey || !secretKey) {
        throw new Error('MeSomb credentials missing');
    }

    const date = new Date().toISOString();
    const nonce = crypto.randomBytes(16).toString('hex');
    const bodyString = body ? JSON.stringify(body) : '{}';

    const canonicalRequest = [method, endpoint, date, nonce, bodyString].join('\n');
    const signature = crypto.createHmac('sha1', secretKey).update(canonicalRequest).digest('hex');
    const authorization = `HMAC-SHA1 Credential=${accessKey}, SignedHeaders=content-type;host;x-mesomb-date;x-mesomb-nonce, Signature=${signature}`;

    const url = `${MESOMB_API_BASE}${endpoint}`;

    console.log(`[MeSomb] Direct Request: ${method} ${url}`);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-MeSomb-Application': applicationKey,
        'X-MeSomb-Date': date,
        'X-MeSomb-Nonce': nonce,
        'Authorization': authorization,
    };

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: method !== 'GET' ? bodyString : undefined,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[MeSomb] Direct API Error Response:', {
                status: response.status,
                text: errorText,
                url
            });
            throw new Error(`MeSomb Direct API error: ${response.status} ${errorText}`);
        }

        return await response.json();
    } catch (error: any) {
        console.error('[MeSomb] Direct Request Exception:', error.message);
        throw error;
    }
}

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
        console.log('[MeSomb] Initiating collection (Direct):', {
            amount: params.amount,
            service: params.service,
            payer: '***',
            nonce: params.nonce
        });

        const body = {
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
        };

        const result = await mesombRequestDirect('/payment/collect/', 'POST', body);
        console.log('[MeSomb] Collection Response:', JSON.stringify(result, null, 2));

        // SDK expected isOperationSuccess, but direct API returns simple success or result.status
        const isOpSuccess = result.success || result.status === 'SUCCESS' || result.status === 'PENDING';

        if (!isOpSuccess) {
            return {
                success: false,
                status: 'FAILED',
                error: result.message || 'Payment operation failed',
            };
        }

        return {
            success: true,
            status: 'PENDING',
            reference: result.reference || result.transaction?.pk,
            message: 'Payment initiated. Please confirm on your phone.',
        };
    } catch (error: any) {
        console.error('[MeSomb] collectPayment Error:', error.message);
        return {
            success: false,
            status: 'FAILED',
            error: error.message || 'Payment initiation failed',
        };
    }
}

export async function checkPaymentStatus(reference: string): Promise<PaymentResult> {
    try {
        const result = await mesombRequestDirect(`/payment/transactions/?ids=${reference}&source=MESOMB`, 'GET');

        if (!result.transactions || result.transactions.length === 0) {
            return { success: false, status: 'PENDING' };
        }

        const transaction = result.transactions[0];
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
        console.log('[MeSomb] Initiating withdrawal (Direct):', {
            amount: params.amount,
            service: params.service,
            receiver: '***',
            nonce: params.nonce
        });

        const body = {
            amount: params.amount,
            service: params.service,
            receiver: params.receiver,
            nonce: params.nonce,
            country: 'CM',
            currency: 'XAF',
        };

        const result = await mesombRequestDirect('/payment/deposit/', 'POST', body);
        console.log('[MeSomb] Withdrawal Response:', JSON.stringify(result, null, 2));

        if (!result.success) {
            return {
                success: false,
                status: 'FAILED',
                error: result.message || 'Withdrawal operation failed',
            };
        }

        return {
            success: true,
            status: 'SUCCESS',
            reference: result.reference || result.transaction?.pk,
            message: 'Withdrawal completed successfully.',
        };
    } catch (error: any) {
        console.error('[MeSomb] makeWithdrawal Error:', error.message);
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
        console.error('[MeSomb] Balance fetch error:', error);
        return {
            success: false,
            error: error.message,
            balance: 0,
            balances: []
        };
    }
}
