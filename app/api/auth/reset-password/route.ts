import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, email, newPassword, confirmPassword } = await request.json();

    if (!token || !email || !newPassword || !confirmPassword)
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });

    if (newPassword.length < 8)
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

    if (newPassword !== confirmPassword)
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });

    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        user_id: user.id,
        token_hash: tokenHash,
        used: false,
        expires_at: { gt: new Date() },
      },
    });

    if (!resetToken)
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.users.update({ where: { id: user.id }, data: { password_hash: hashedPassword } }),
      prisma.password_reset_tokens.update({ where: { id: resetToken.id }, data: { used: true } }),
    ]);

    return NextResponse.json({ message: 'Password reset successfully. You can now log in.' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
