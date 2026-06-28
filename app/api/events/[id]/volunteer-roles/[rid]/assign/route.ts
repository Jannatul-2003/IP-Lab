import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: { id: string; rid: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const role = await prisma.volunteer_roles.findUnique({ where: { id: params.rid } });
    if (!role || role.event_id !== params.id)
      return NextResponse.json({ error: 'Volunteer role not found' }, { status: 404 });

    const { memberId } = await request.json();
    if (!memberId)
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 });

    const member = await prisma.members.findUnique({ where: { id: memberId } });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    const updated = await prisma.volunteer_roles.update({
      where: { id: params.rid },
      data: { assigned_member_id: memberId, status: 'filled' },
    });

    await prisma.audit_log.create({
      data: { actor_id: user.userId as any, action: 'ASSIGN_VOLUNTEER_ROLE', entity_type: 'volunteer_roles', entity_id: role.id as any },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Assign volunteer role error:', error);
    return NextResponse.json({ error: 'Failed to assign volunteer role' }, { status: 500 });
  }
}
