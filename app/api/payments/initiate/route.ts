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

    const { amount, description, type, eventId } = await request.json();

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (!description) {
      return NextResponse.json(
        { error: 'Payment description is required' },
        { status: 400 }
      );
    }

    // Get member details
    const member = await prisma.members.findUnique({
      where: { user_id: user.userId },
      include: { user: true },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member profile not found' },
        { status: 404 }
      );
    }

    // Generate transaction ID
    const transactionId = sslCommerzGateway.generateTransactionId('CSEDU');

    // Create payment record
    const payment = await prisma.payments.create({
      data: {
        transaction_id: transactionId,
        member_id: member.id,
        amount,
        currency: 'BDT',
        status: 'initiated',
        description,
        metadata: {
          type,
          eventId,
          initiatedBy: user.userId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Initiate SSLCommerz payment
    const paymentResponse = await sslCommerzGateway.initiatePayment({
      transactionId,
      amount,
      currency: 'BDT',
      customerName: member.full_name,
      customerEmail: member.user.email,
      customerPhone: member.phone || '+88001700000000',
      productName: description,
      productCategory: type === 'membership' ? 'service' : 'event',
      returnUrl: `${process.env.FRONTEND_URL}/payment/success?txn=${transactionId}`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel?txn=${transactionId}`,
      notifyUrl: `${process.env.API_URL}/api/payments/ipn`,
      customField1: member.id,
      customField2: eventId || 'N/A',
    });

    if (paymentResponse.status !== 'success') {
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });

      return NextResponse.json(
        { error: paymentResponse.error || 'Could not initiate payment' },
        { status: 400 }
      );
    }

    // Update payment with gateway response
    await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'pending',
        gateway_response: {
          sessionkey: paymentResponse.sessionkey,
          gateway_url: paymentResponse.gateway_url,
        },
      },
    });

    return NextResponse.json(
      {
        paymentId: payment.id,
        transactionId,
        gatewayUrl: paymentResponse.gateway_url,
        sessionKey: paymentResponse.sessionkey,
        amount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
