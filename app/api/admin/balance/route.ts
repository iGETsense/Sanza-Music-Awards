import { NextRequest, NextResponse } from 'next/server';
import { getAccountBalance } from '@/lib/mesomb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Debug: Log credential info (safe - no actual values)
        const appKey = process.env.MESOMB_APPLICATION_KEY || '';
        const accessKey = process.env.MESOMB_ACCESS_KEY || '';
        const secretKey = process.env.MESOMB_SECRET_KEY || '';

        console.log('[Admin Balance] Credential check:', {
            appKeyLen: appKey.trim().length,
            appKeyFirstChars: appKey.trim().substring(0, 4),
            accessKeyLen: accessKey.trim().length,
            accessKeyHasHyphens: accessKey.includes('-'),
            secretKeyLen: secretKey.trim().length,
            secretKeyHasHyphens: secretKey.includes('-'),
        });

        const balanceResult = await getAccountBalance();

        if (!balanceResult.success) {
            return NextResponse.json({ error: balanceResult.error || 'Failed to fetch balance' }, { status: 500 });
        }

        return NextResponse.json(balanceResult);
    } catch (error: any) {
        console.error('Admin balance error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
