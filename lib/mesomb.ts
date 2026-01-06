/**
 * Mesomb Payment Service - Direct API Implementation
 * Bypasses SDK to avoid header issues in Vercel serverless environment
 * Ported from NBDanceAward implementation
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'crypto';

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

const MESOMB_API_BASE = 'https://mesomb.hachther.com/api/v1.1';


// Helper: Generate MeSomb Signature
function generateSignature(
    method: string,
    endpoint: string,
    date: string,
    nonce: string,
    body: string,
    secretKey: string,
    accessKey: string,
    contentType?: string
): string {
    const canonicalRequest = [
        method,
        endpoint,
        date,
        nonce,
        body
    ].join('\n');

    const signature = crypto
        .createHmac('sha1', secretKey)
        .update(canonicalRequest)
        .digest('hex');

    // Explicitly define SignedHeaders to ensure exact match
    // Removing 'host' as it can cause issues behind proxies (Vercel) if modified
    let signedHeaders = 'x-mesomb-date;x-mesomb-nonce';
    if (contentType) {
        signedHeaders = 'content-type;x-mesomb-date;x-mesomb-nonce';
    }

    return `HMAC-SHA1 Credential=${accessKey}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

// Helper: Generic MeSomb Request
async function mesombRequest(
    endpoint: string,
    method: string,
    body: any = null
): Promise<any> {
    const rawAppKey = process.env.MESOMB_APPLICATION_KEY || '';
    const rawAccessKey = process.env.MESOMB_ACCESS_KEY || '';
    const rawSecretKey = process.env.MESOMB_SECRET_KEY || '';

    const applicationKey = rawAppKey.trim();
    const accessKey = rawAccessKey.trim();
    const secretKey = rawSecretKey.trim();


    if (!applicationKey || !accessKey || !secretKey) {
        throw new Error('MeSomb credentials missing in .env.local');
    }

    const date = new Date().toISOString();
    const nonce = crypto.randomBytes(16).toString('hex');

    // Determine content type and body
    let bodyString = '';
    let contentType: string | undefined = undefined;

    if (method !== 'GET') {
        contentType = 'application/json';
        bodyString = body ? JSON.stringify(body) : '{}';
    } else {
        // For GET, standard is empty body.
        // NBDance used '{}' but sending body in GET is risky (502s).
        bodyString = '';
    }

    const signature = generateSignature(
        method,
        endpoint,
        date,
        nonce,
        bodyString,
        secretKey,
        accessKey,
        contentType
    );

    const url = `${MESOMB_API_BASE}${endpoint}`;

    console.log(`[MeSomb] Direct Request: ${method} ${url}`, {
        nonce,
        date,
        hasBody: !!bodyString,
        contentType,
        authHeaderLength: signature.length
    });

    const headers: Record<string, string> = {
        'X-MeSomb-Application': applicationKey,
        'X-MeSomb-Date': date,
        'X-MeSomb-Nonce': nonce,
        'Authorization': signature,
    };

    if (contentType) {
        headers['Content-Type'] = contentType;
    }


    try {
        const response = await fetch(url, {
            method,
            headers,
            body: method !== 'GET' ? bodyString : undefined,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[MeSomb] API Error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });

            // Try to parse error json if possible
            let errorMessage = `API error: ${response.status}`;
            try {
                const errJson = JSON.parse(errorText);
                errorMessage = errJson.detail || errJson.message || errorMessage;
            } catch (e) {
                errorMessage = errorText;
            }

            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error: any) {
        console.error('[MeSomb] Request failed:', error.message, {
            cause: error.cause,
            stack: error.stack
        });
        throw error;
    }
}

// 1. Collect Payment
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
            mode: 'asynchronous', // Async is safer
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

        const result = await mesombRequest('/payment/collect/', 'POST', body);
        console.log('[MeSomb] Collection Response:', JSON.stringify(result, null, 2));

        // Direct API returns { success: true, status: 'SUCCESS'/'PENDING', ... }
        if (result.success || result.status === 'SUCCESS' || result.status === 'PENDING') {
            return {
                success: true,
                status: 'PENDING', // Usually pending for async
                reference: result.reference || result.transaction?.pk,
                message: 'Payment initiated. Please confirm on your phone.',
            };
        }

        return {
            success: false,
            status: 'FAILED',
            error: result.message || 'Payment operation failed',
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

// 2. Check Payment Status
export async function checkPaymentStatus(reference: string): Promise<PaymentResult> {
    try {
        // According to NBDanceAward and docs
        const result = await mesombRequest(`/payment/transactions/?ids=${reference}&source=MESOMB`, 'GET');

        if (!result.transactions || result.transactions.length === 0) {
            return { success: false, status: 'PENDING' };
        }

        const transaction = result.transactions[0];
        const isSuccess = transaction.status === 'SUCCESS';
        const isFailed = transaction.status === 'FAILED';

        return {
            success: isSuccess,
            status: isSuccess ? 'SUCCESS' : (isFailed ? 'FAILED' : 'PENDING'),
            reference,
            transactionId: transaction.pk
        };
    } catch (error: any) {
        console.error('[MeSomb] Status check error:', error.message);
        // If fetch fails, assume pending/processing
        return { success: false, status: 'PENDING' };
    }
}

// 3. Make Withdrawal
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
            location: {
                town: 'Douala',
                region: 'Littoral',
                country: 'CM',
            }
        };

        const result = await mesombRequest('/payment/deposit/', 'POST', body);
        console.log('[MeSomb] Withdrawal Response:', JSON.stringify(result, null, 2));

        if (result.success || result.status === 'SUCCESS') {
            return {
                success: true,
                status: 'SUCCESS',
                reference: result.reference || result.transaction?.pk,
                message: 'Withdrawal completed successfully.',
            };
        }

        return {
            success: false,
            status: 'FAILED',
            error: result.message || 'Withdrawal operation failed',
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

// 4. Get Account Balance
export async function getAccountBalance(): Promise<{ success: boolean; balance?: number; balances?: any[]; error?: string }> {
    try {
        const application = await mesombRequest('/payment/status/', 'GET');
        console.log('[MeSomb] App Status Response:', JSON.stringify(application, null, 2));

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
        console.error('[MeSomb] Balance fetch error (returning 0):', error.message);
        // Fallback to success=true with 0 balance to unblock dashboard
        return {
            success: true,
            balance: 0,
            balances: [],
            error: error.message
        };
    }
}

// Keep getMesombClient for backward compatibility if imported elsewhere, but it's unused in this file
// Effectively, we can mock it or remove it. But some other files might import it?
// Search didn't show external usage except via these exported functions. 
// Step 30 showed getAccountBalance usages.
// I'll leave it out to clean up.
