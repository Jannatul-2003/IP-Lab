import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { title, eventType, eventDate, venue, capacity, rsvpDeadline, description, status } =
      await request.json();

    if (!title || !eventType || !eventDate || !capacity)
      return NextResponse.json({ error: 'title, eventType, eventDate, capacity are required' }, { status: 400 });

    const event = await prisma.events.create({
      data: {
        title,
        event_type: eventType,
        event_date: new Date(eventDate),
        venue: venue || null,
        capacity: parseInt(capacity),
        rsvp_deadline: rsvpDeadline ? new Date(rsvpDeadline) : null,
        description: description || null,
        status: status || 'DRAFT',
        organizer_id: user.userId as any,
      },
    });

    await prisma.audit_log.create({
      data: { actor_id: user.userId as any, action: 'CREATE_EVENT', entity_type: 'events', entity_id: event.id as any },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status') || 'PUBLISHED';

    const where: any = { status, deleted_at: null };

    const events = await prisma.events.findMany({
      where,
      orderBy: { event_date: 'desc' },
      take: limit,
      skip,
      include: { _count: { select: { event_rsvp: { where: { status: 'active' } } } } },
    });

    const total = await prisma.events.count({ where });

    return NextResponse.json(
      {
        data: events,
        pagination: { limit, skip, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch events error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
