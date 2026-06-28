/**
 * Payment Controller - Handles SSLCommerz payment operations
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sslCommerzGateway } from '../../../../lib/sslcommerz';
import { jwtMiddleware } from '../../middleware/jwt';
import { rbacGuard } from '../../middleware/rbac';

const prisma = new PrismaClient();
const router = Router();

/**
 * POST /api/v1/payments/initiate
 * Initiate a payment session
 */
router.post(
  '/initiate',
  jwtMiddleware,
  rbacGuard(['MEMBER', 'EC_OFFICER', 'PRESIDENT', 'SECRETARY']),
  async (req: Request, res: Response) => {
    try {
      const { amount, description, type, memberId, eventId } = req.body;

      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({
          type: 'validation_error',
          title: 'Invalid Amount',
          status: 400,
          detail: 'Amount must be greater than 0',
        });
      }

      if (!description) {
        return res.status(400).json({
          type: 'validation_error',
          title: 'Missing Description',
          status: 400,
          detail: 'Payment description is required',
        });
      }

      // Generate unique transaction ID
      const transactionId = sslCommerzGateway.generateTransactionId('CSEDU');

      // Create payment record in database
      const payment = await prisma.payments.create({
        data: {
          transaction_id: transactionId,
          member_id: memberId || req.user?.id,
          amount,
          currency: 'BDT',
          status: 'initiated',
          description,
          metadata: {
            type,
            eventId,
            initiatedBy: req.user?.id,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // Get member details for payment
      const member = await prisma.members.findUnique({
        where: { id: memberId || req.user?.id },
        include: { user: true },
      });

      if (!member || !member.user) {
        return res.status(404).json({
          type: 'not_found_error',
          title: 'Member Not Found',
          status: 404,
          detail: 'Member details not found',
        });
      }

      // Prepare SSLCommerz payment
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
        notifyUrl: `${process.env.API_URL}/api/v1/payments/ipn`,
        customField1: memberId || req.user?.id,
        customField2: eventId || 'N/A',
      });

      if (paymentResponse.status !== 'success') {
        // Update payment status to failed
        await prisma.payments.update({
          where: { id: payment.id },
          data: { status: 'failed' },
        });

        return res.status(400).json({
          type: 'payment_error',
          title: 'Payment Initiation Failed',
          status: 400,
          detail: paymentResponse.error || 'Could not initiate payment',
        });
      }

      // Update payment with gateway session key
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

      // Log the payment initiation
      await prisma.audit_log.create({
        data: {
          actor_id: req.user?.id,
          action: 'PAYMENT_INITIATED',
          entity_type: 'Payment',
          entity_id: payment.id,
          payload: {
            transactionId,
            amount,
            description,
          },
        },
      });

      res.status(200).json({
        paymentId: payment.id,
        transactionId,
        gatewayUrl: paymentResponse.gateway_url,
        sessionKey: paymentResponse.sessionkey,
        amount,
      });
    } catch (error) {
      console.error('Payment Initiation Error:', error);
      res.status(500).json({
        type: 'internal_error',
        title: 'Server Error',
        status: 500,
        detail: 'Failed to initiate payment',
      });
    }
  }
);

/**
 * POST /api/v1/payments/verify
 * Verify payment after user returns from gateway
 */
router.post(
  '/verify',
  jwtMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { transactionId, amount } = req.body;

      if (!transactionId || !amount) {
        return res.status(400).json({
          type: 'validation_error',
          title: 'Missing Parameters',
          status: 400,
          detail: 'Transaction ID and amount are required',
        });
      }

      // Find payment record
      const payment = await prisma.payments.findUnique({
        where: { transaction_id: transactionId },
      });

      if (!payment) {
        return res.status(404).json({
          type: 'not_found_error',
          title: 'Payment Not Found',
          status: 404,
          detail: 'No payment found with this transaction ID',
        });
      }

      // Verify with SSLCommerz
      const verificationResponse = await sslCommerzGateway.verifyPayment({
        transactionId,
        amount,
        currency: 'BDT',
      });

      // Create payment log
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
        // Update payment status to completed
        const updatedPayment = await prisma.payments.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            completed_at: new Date(),
            gateway_response: verificationResponse.data,
          },
        });

        // Log successful payment
        await prisma.audit_log.create({
          data: {
            actor_id: payment.member_id,
            action: 'PAYMENT_COMPLETED',
            entity_type: 'Payment',
            entity_id: payment.id,
            payload: {
              transactionId,
              amount,
              validationId: verificationResponse.data?.val_id,
            },
          },
        });

        // Handle post-payment logic based on metadata
        const metadata = payment.metadata as any;
        if (metadata?.type === 'membership') {
          // Activate member if payment for membership
          if (payment.member_id) {
            await prisma.members.update({
              where: { id: payment.member_id },
              data: { status: 'ACTIVE', joined_date: new Date() },
            });
          }
        }

        res.status(200).json({
          status: 'success',
          message: 'Payment verified successfully',
          paymentId: updatedPayment.id,
          transactionId: updatedPayment.transaction_id,
          amount: updatedPayment.amount,
        });
      } else {
        // Payment verification failed
        await prisma.payments.update({
          where: { id: payment.id },
          data: { status: 'failed' },
        });

        res.status(400).json({
          type: 'payment_error',
          title: 'Payment Verification Failed',
          status: 400,
          detail:
            verificationResponse.error || 'Payment could not be verified',
        });
      }
    } catch (error) {
      console.error('Payment Verification Error:', error);
      res.status(500).json({
        type: 'internal_error',
        title: 'Server Error',
        status: 500,
        detail: 'Payment verification encountered an error',
      });
    }
  }
);

/**
 * POST /api/v1/payments/ipn
 * Instant Payment Notification from SSLCommerz (webhook)
 * This is called by SSLCommerz, NOT from the client
 */
router.post('/ipn', async (req: Request, res: Response) => {
  try {
    const {
      tran_id,
      status,
      amount,
      currency,
      card_type,
      value_a,
      value_b,
    } = req.body;

    console.log('IPN Received:', req.body);

    // Find payment by transaction ID
    const payment = await prisma.payments.findUnique({
      where: { transaction_id: tran_id },
    });

    if (!payment) {
      console.log(`Payment not found for transaction: ${tran_id}`);
      return res.status(404).send('Payment not found');
    }

    // Log the IPN
    await prisma.payment_logs.create({
      data: {
        payment_id: payment.id,
        status: status,
        response_code: req.body.card_issuer_code,
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
          gateway_response: req.body,
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
    res.status(200).send('OK');
  } catch (error) {
    console.error('IPN Error:', error);
    res.status(500).send('Error processing IPN');
  }
});

/**
 * GET /api/v1/payments/:paymentId
 * Get payment details
 */
router.get(
  '/:paymentId',
  jwtMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { paymentId } = req.params;

      const payment = await prisma.payments.findUnique({
        where: { id: paymentId },
        include: { payment_logs: true },
      });

      if (!payment) {
        return res.status(404).json({
          type: 'not_found_error',
          title: 'Payment Not Found',
          status: 404,
          detail: 'Payment not found',
        });
      }

      // Check authorization
      if (payment.member_id !== req.user?.id && req.user?.role !== 'SYSTEM_ADMIN') {
        return res.status(403).json({
          type: 'forbidden_error',
          title: 'Forbidden',
          status: 403,
          detail: 'You do not have permission to view this payment',
        });
      }

      res.status(200).json(payment);
    } catch (error) {
      console.error('Get Payment Error:', error);
      res.status(500).json({
        type: 'internal_error',
        title: 'Server Error',
        status: 500,
        detail: 'Failed to retrieve payment',
      });
    }
  }
);

/**
 * GET /api/v1/payments/member/:memberId
 * Get all payments for a member (EC officers and above)
 */
router.get(
  '/member/:memberId',
  jwtMiddleware,
  rbacGuard(['EC_OFFICER', 'PRESIDENT', 'SECRETARY', 'SYSTEM_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { memberId } = req.params;

      const payments = await prisma.payments.findMany({
        where: { member_id: memberId },
        orderBy: { created_at: 'desc' },
        take: 50,
      });

      res.status(200).json(payments);
    } catch (error) {
      console.error('Get Member Payments Error:', error);
      res.status(500).json({
        type: 'internal_error',
        title: 'Server Error',
        status: 500,
        detail: 'Failed to retrieve payments',
      });
    }
  }
);

export default router;
