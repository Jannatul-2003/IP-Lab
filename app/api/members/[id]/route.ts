import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// PUT /api/members/[id] — approve / reject / suspend / cancel
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { action } = await request.json();
    const validActions: Record<string, { status: string; joinedDate?: Date }> = {
      approve: { status: 'ACTIVE', joinedDate: new Date() },
      reject: { status: 'SUSPENDED' },
      cancel: { status: 'CANCELLED' },
      suspend: { status: 'SUSPENDED' },
    };

    if (!validActions[action])
      return NextResponse.json({ error: 'Invalid action. Use: approve | reject | cancel | suspend' }, { status: 400 });

    const updateData: any = { status: validActions[action].status };
    if (validActions[action].joinedDate) updateData.joined_date = validActions[action].joinedDate;

    const member = await prisma.members.update({
      where: { id: params.id },
      data: updateData,
      include: { user: { select: { email: true, role: true } } },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user.userId as any,
        action: `MEMBER_${action.toUpperCase()}`,
        entity_type: 'members',
        entity_id: params.id as any,
        payload: { newStatus: updateData.status },
      },
    });

    return NextResponse.json({ message: `Member ${action}d successfully`, member }, { status: 200 });
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/members/[id] — soft delete
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['PRESIDENT', 'SYSTEM_ADMIN'].includes(user.role))
      return NextResponse.json({ error: 'Forbidden — only PRESIDENT/ADMIN' }, { status: 403 });

    await prisma.members.update({
      where: { id: params.id },
      data: { deleted_at: new Date(), status: 'CANCELLED' },
    });

    await prisma.audit_log.create({
      data: { actor_id: user.userId as any, action: 'DELETE_MEMBER', entity_type: 'members', entity_id: params.id as any },
    });

    return NextResponse.json({ message: 'Member removed' }, { status: 200 });
  } catch (error) {
    console.error('Delete member error:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
