import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth-utils';

const prisma = new PrismaClient();

const VALID_ROLES = ['GUEST', 'MEMBER', 'VOLUNTEER', 'EC_OFFICER', 'PRESIDENT', 'SECRETARY', 'FACULTY_ADVISOR', 'SYSTEM_ADMIN'];

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'SYSTEM_ADMIN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { role } = await request.json();
    if (!role || !VALID_ROLES.includes(role))
      return NextResponse.json({ error: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}` }, { status: 400 });

    const updated = await prisma.users.update({
      where: { id: params.id },
      data: { role },
      select: { id: true, email: true, role: true, updated_at: true },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user.userId as any,
        action: 'CHANGE_USER_ROLE',
        entity_type: 'users',
        entity_id: params.id as any,
        payload: { newRole: role },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'SYSTEM_ADMIN')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (params.id === user.userId)
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });

    // Soft delete via member if exists
    await prisma.members.updateMany({
      where: { user_id: params.id },
      data: { deleted_at: new Date(), status: 'CANCELLED' },
    });

    await prisma.audit_log.create({
      data: { actor_id: user.userId as any, action: 'DELETE_USER', entity_type: 'users', entity_id: params.id as any },
    });

    return NextResponse.json({ message: 'User deactivated' }, { status: 200 });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
