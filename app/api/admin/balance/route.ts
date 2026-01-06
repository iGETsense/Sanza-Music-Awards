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

        const balanceResult = await getAccountBalance();

        if (!balanceResult.success) {
            return NextResponse.json({ error: balanceResult.error || 'Failed to fetch balance' }, { status: 500 });
        }

        return NextResponse.json(balanceResult);
    } catch (error: any) {
        console.error('Admin balance error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
