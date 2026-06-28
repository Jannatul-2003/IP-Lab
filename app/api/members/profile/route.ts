import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireAuth } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const authError = requireAuth(user);
    if (authError) {
      return NextResponse.json(
        { error: authError.error },
        { status: authError.status }
      );
    }

    const member = await prisma.members.findUnique({
      where: { user_id: user!.userId },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            created_at: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ...member,
        user: member.user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const authError = requireAuth(user);
    if (authError) {
      return NextResponse.json(
        { error: authError.error },
        { status: authError.status }
      );
    }

    const { fullName, phone } = await request.json();

    if (!fullName && !phone) {
      return NextResponse.json(
        { error: 'At least one field (fullName or phone) must be provided' },
        { status: 400 }
      );
    }

    const updatedMember = await prisma.members.update({
      where: { user_id: user!.userId },
      data: {
        ...(fullName && { full_name: fullName }),
        ...(phone && { phone }),
      },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    // Log audit
    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'UPDATE_PROFILE',
        entity_type: 'members',
        entity_id: updatedMember.id as any,
        payload: { fullName, phone },
      },
    });

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        member: updatedMember,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
