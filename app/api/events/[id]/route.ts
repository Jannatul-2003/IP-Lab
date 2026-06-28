import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - Get event details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prisma.events.findUnique({
      where: { id },
      include: {
        media: true,
        _count: {
          select: {
            event_rsvp: {
              where: { status: 'active' },
            },
            volunteer_roles: true,
          },
        },
      },
    });

    if (!event || event.deleted_at) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(event, { status: 200 });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PUT - Update event
export async function PUT(
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

    const { title, eventType, eventDate, venue, capacity, description, status } =
      await request.json();

    const event = await prisma.events.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(eventType && { event_type: eventType }),
        ...(eventDate && { event_date: new Date(eventDate) }),
        ...(venue !== undefined && { venue }),
        ...(capacity && { capacity: parseInt(capacity) }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'UPDATE_EVENT',
        entity_type: 'events',
        entity_id: event.id as any,
        payload: { title, status },
      },
    });

    return NextResponse.json(
      { message: 'Event updated successfully', event },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE - Delete event
export async function DELETE(
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

    const event = await prisma.events.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'DELETE_EVENT',
        entity_type: 'events',
        entity_id: event.id as any,
      },
    });

    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
