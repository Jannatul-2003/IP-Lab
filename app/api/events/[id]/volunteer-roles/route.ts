import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - List volunteer roles for event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roles = await prisma.volunteer_roles.findMany({
      where: { event_id: id },
      include: {
        assigned_member: {
          select: {
            id: true,
            full_name: true,
            student_id: true,
          },
        },
      },
      orderBy: { role_name: 'asc' },
    });

    return NextResponse.json({ data: roles }, { status: 200 });
  } catch (error) {
    console.error('Fetch volunteer roles error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch volunteer roles' },
      { status: 500 }
    );
  }
}

// POST - Create volunteer role
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request);
    const roleError = requireRole(user, EC_ROLES);
    if (roleError) {
      return NextResponse.json(
        { error: roleError.error },
        { status: roleError.status }
      );
    }

    const { roleName, description, status } = await request.json();

    if (!roleName) {
      return NextResponse.json(
        { error: 'roleName is required' },
        { status: 400 }
      );
    }

    // Verify event exists
    const event = await prisma.events.findUnique({
      where: { id },
    });

    if (!event || event.deleted_at) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const role = await prisma.volunteer_roles.create({
      data: {
        event_id: id,
        role_name: roleName,
        description: description || null,
        status: status || 'open',
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'CREATE_VOLUNTEER_ROLE',
        entity_type: 'volunteer_roles',
        entity_id: role.id as any,
        payload: { roleName },
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Create volunteer role error:', error);
    return NextResponse.json(
      { error: 'Failed to create volunteer role' },
      { status: 500 }
    );
  }
}
