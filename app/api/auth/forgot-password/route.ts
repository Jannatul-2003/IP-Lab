import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email)
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const user = await prisma.users.findUnique({ where: { email } });

    // Always return 200 to avoid leaking which emails exist
    if (!user) {
      return NextResponse.json(
        { message: 'If that email is registered, a reset link has been sent.' },
        { status: 200 }
      );
    }

    // Invalidate any existing tokens for this user
    await prisma.password_reset_tokens.updateMany({
      where: { user_id: user.id, used: false },
      data: { used: true },
    });

    // Generate a secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.password_reset_tokens.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject: 'Password Reset — CSEDU Portal',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. It expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="background:#2E75B6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Reset Password</a></p>
        <p>If you did not request this, ignore this email.</p>
      `,
    });

    return NextResponse.json(
      { message: 'If that email is registered, a reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process reset request' }, { status: 500 });
  }
}
