import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        members: {
          select: {
            id: true,
            full_name: true,
            student_id: true,
            batch_year: true,
            phone: true,
            status: true,
            constitution_acknowledged: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token using RS256 (asymmetric)
    const accessToken = generateAccessToken(user.id, user.email, user.role);

    // Set token in HttpOnly cookie
    const response = NextResponse.json(
      {
        message: 'Login successful',
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          member: user.members,
        },
      },
      { status: 200 }
    );

    response.cookies.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
