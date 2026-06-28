import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const event = await prisma.events.findUnique({
      where: { id: params.id },
      include: {
        media: true,
        _count: { select: { event_rsvp: { where: { status: 'active' } } } },
      },
    });
    if (!event || event.deleted_at)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    return NextResponse.json({ ...event, rsvpCount: event._count.event_rsvp }, { status: 200 });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const updated = await prisma.events.update({
      where: { id: params.id },
      data: {
        title: body.title ?? undefined,
        event_type: body.eventType ?? undefined,
        event_date: body.eventDate ? new Date(body.eventDate) : undefined,
        venue: body.venue ?? undefined,
        capacity: body.capacity ?? undefined,
        rsvp_deadline: body.rsvpDeadline ? new Date(body.rsvpDeadline) : undefined,
        description: body.description ?? undefined,
        status: body.status ?? undefined,
      },
    });

    await prisma.audit_log.create({
      data: { actor_id: user.userId as any, action: 'UPDATE_EVENT', entity_type: 'events', entity_id: params.id as any },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.events.update({
      where: { id: params.id },
      data: { deleted_at: new Date() },
    });

    await prisma.audit_log.create({
      data: { actor_id: user.userId as any, action: 'DELETE_EVENT', entity_type: 'events', entity_id: params.id as any },
    });

    return NextResponse.json({ message: 'Event deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
