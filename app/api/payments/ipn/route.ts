import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tran_id, status } = body;

    console.log('IPN Received:', body);

    // Find payment by transaction ID
    const payment = await prisma.payments.findUnique({
      where: { transaction_id: tran_id },
    });

    if (!payment) {
      console.log(`Payment not found for transaction: ${tran_id}`);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Log the IPN
    await prisma.payment_logs.create({
      data: {
        payment_id: payment.id,
        status: status,
        response_code: body.card_issuer_code,
        response_message: `IPN received - Status: ${status}`,
      },
    });

    // Update payment based on IPN status
    if (status === 'VALID' || status === 'VALIDATED') {
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'completed',
          completed_at: new Date(),
          gateway_response: body,
        },
      });

      // Handle post-payment logic
      const metadata = payment.metadata as any;
      if (metadata?.type === 'membership' && payment.member_id) {
        await prisma.members.update({
          where: { id: payment.member_id },
          data: { status: 'ACTIVE', joined_date: new Date() },
        });
      }
    } else if (status === 'FAILED') {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
    } else {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'pending' },
      });
    }

    // Always return 200 OK to SSLCommerz
    return NextResponse.json({ message: 'IPN processed' }, { status: 200 });
  } catch (error) {
    console.error('IPN Error:', error);
    return NextResponse.json(
      { error: 'Error processing IPN' },
      { status: 500 }
    );
  }
}
