import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { sslCommerzGateway } from '@/lib/sslcommerz';

const prisma = new PrismaClient();

function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(
      token,
      process.env.JWT_PUBLIC_KEY || 'your-secret-key',
      { algorithms: ['RS256'] }
    ) as any;
    return decoded;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { transactionId, amount } = await request.json();

    if (!transactionId || !amount) {
      return NextResponse.json(
        { error: 'Transaction ID and amount are required' },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await prisma.payments.findUnique({
      where: { transaction_id: transactionId },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify payment with SSLCommerz
    const verificationResponse = await sslCommerzGateway.verifyPayment({
      transactionId,
      amount,
      currency: 'BDT',
    });

    // Log the verification
    await prisma.payment_logs.create({
      data: {
        payment_id: payment.id,
        status: verificationResponse.status,
        response_code: verificationResponse.data?.response_code,
        response_message:
          verificationResponse.data?.response_reason ||
          verificationResponse.error ||
          'Verification completed',
      },
    });

    if (verificationResponse.status === 'success') {
      // Update payment status
      const updatedPayment = await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'completed',
          completed_at: new Date(),
          gateway_response: verificationResponse.data,
        },
      });

      // Handle post-payment logic based on type
      const metadata = payment.metadata as any;
      if (metadata?.type === 'membership' && payment.member_id) {
        await prisma.members.update({
          where: { id: payment.member_id },
          data: { status: 'ACTIVE', joined_date: new Date() },
        });
      }

      return NextResponse.json(
        {
          status: 'success',
          message: 'Payment verified successfully',
          paymentId: updatedPayment.id,
          transactionId: updatedPayment.transaction_id,
          amount: updatedPayment.amount,
        },
        { status: 200 }
      );
    } else {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      return NextResponse.json(
        { error: verificationResponse.error || 'Payment verification failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
