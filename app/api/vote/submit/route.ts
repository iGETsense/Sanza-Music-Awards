import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { collectPayment } from '@/lib/mesomb';
import { paymentQueue } from '@/lib/paymentQueue';
import { VOTE_PRICE } from '@/lib/config';
import { validatePhoneNumber, detectOperator } from '@/lib/phoneValidation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nomineeId, voteCount, phoneNumber, paymentMethod, nomineeName } = body;

        // 1. Validation
        if (!nomineeId || !voteCount || !phoneNumber) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const phoneValidation = validatePhoneNumber(phoneNumber);
        if (!phoneValidation.isValid) {
            return NextResponse.json({ error: phoneValidation.warning || 'Invalid phone number' }, { status: 400 });
        }

        const cleanPhone = phoneValidation.formattedNumber.replace(/\D/g, '');
        const operator = phoneValidation.operator;
        const amount = parseInt(voteCount) * VOTE_PRICE;
        const transactionId = `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Map operator to service code
        const serviceCode = operator.toUpperCase() as 'MTN' | 'ORANGE';

        // 2. Create Transaction Record FIRST
        const initialTransactionData = {
            id: transactionId,
            nomineeId,
            nominee_name: nomineeName || 'Unknown', // Store name for display
            voteCount: parseInt(voteCount),
            phoneNumber: cleanPhone,
            payer: cleanPhone, // Explicit display field
            paymentMethod: serviceCode,
            operator: serviceCode,
            amount,
            status: 'creating',
            createdAt: Date.now(),
        };

        if (adminDb) {
            await adminDb.ref(`transactions/${transactionId}`).set(initialTransactionData);
        } else {
            console.log('MOCK MODE: Transaction created (no DB access)', initialTransactionData);
        }

        // 3. Initiate payment via queue
        try {
            const paymentResult = await paymentQueue.add(() =>
                collectPayment({
                    amount,
                    service: serviceCode,
                    payer: '237' + cleanPhone.replace(/^237/, ''),
                    nonce: transactionId,
                })
            );

            console.log(`[Payment] Result for ${transactionId}:`, paymentResult);

            if (!paymentResult.success) {
                console.error(`[Payment] Failed for ${operator}:`, paymentResult);
                if (adminDb) {
                    await adminDb.ref(`transactions/${transactionId}`).update({
                        status: 'failed',
                        error: paymentResult.error,
                        failedAt: Date.now()
                    });
                }
                return NextResponse.json({
                    success: false,
                    error: paymentResult.error,
                    operator: operator
                }, { status: 400 });
            }

            // 4. Update Transaction Status to Pending
            if (adminDb) {
                await adminDb.ref(`transactions/${transactionId}`).update({
                    status: 'pending',
                    mesombReference: paymentResult.reference,
                });
            }

            return NextResponse.json({
                success: true,
                status: 'pending',
                transactionId,
                reference: paymentResult.reference,
                amount,
                message: 'Merci de valider. Veuillez patienter, nous finissons le paiement.',
            });

        } catch (paymentError: any) {
            console.error('Payment initiation error:', paymentError);
            if (adminDb) {
                await adminDb.ref(`transactions/${transactionId}`).update({
                    status: 'failed',
                    error: paymentError.message,
                    failedAt: Date.now()
                });
            }
            return NextResponse.json({ success: false, error: 'Payment failed to initiate' }, { status: 500 });
        }

    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
