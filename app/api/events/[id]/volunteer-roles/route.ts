import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const roles = await prisma.volunteer_roles.findMany({
      where: { event_id: params.id },
      include: { assigned_member: { select: { id: true, full_name: true, student_id: true } } },
    });
    return NextResponse.json({ data: roles }, { status: 200 });
  } catch (error) {
    console.error('Fetch volunteer roles error:', error);
    return NextResponse.json({ error: 'Failed to fetch volunteer roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const event = await prisma.events.findUnique({ where: { id: params.id } });
    if (!event || event.deleted_at)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const { roleName, description } = await request.json();
    if (!roleName)
      return NextResponse.json({ error: 'roleName is required' }, { status: 400 });

    const role = await prisma.volunteer_roles.create({
      data: { event_id: params.id, role_name: roleName, description, status: 'open' },
    });

    await prisma.audit_log.create({
      data: { actor_id: user.userId as any, action: 'CREATE_VOLUNTEER_ROLE', entity_type: 'volunteer_roles', entity_id: role.id as any },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Create volunteer role error:', error);
    return NextResponse.json({ error: 'Failed to create volunteer role' }, { status: 500 });
  }
}
