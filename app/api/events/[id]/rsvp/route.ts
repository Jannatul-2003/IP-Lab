import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireAuth } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// POST - RSVP to an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member profile not found' },
        { status: 404 }
      );
    }

    const event = await prisma.events.findUnique({
      where: { id },
    });

    if (!event || event.deleted_at) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check RSVP deadline
    if (event.rsvp_deadline && new Date() > event.rsvp_deadline) {
      return NextResponse.json(
        { error: 'RSVP deadline has passed' },
        { status: 400 }
      );
    }

    // Check current RSVPs count
    const rsvpCount = await prisma.event_rsvp.count({
      where: {
        event_id: id,
        status: 'active',
      },
    });

    if (rsvpCount >= event.capacity) {
      return NextResponse.json(
        { error: 'Event is at full capacity' },
        { status: 400 }
      );
    }

    // Check if already RSVP'd
    const existingRsvp = await prisma.event_rsvp.findUnique({
      where: {
        event_id_member_id: {
          event_id: id,
          member_id: member.id,
        },
      },
    });

    if (existingRsvp) {
      return NextResponse.json(
        { error: 'You have already RSVP\'d to this event' },
        { status: 409 }
      );
    }

    const rsvp = await prisma.event_rsvp.create({
      data: {
        event_id: id,
        member_id: member.id,
        status: 'active',
      },
      include: {
        event: { select: { title: true } },
        member: { select: { full_name: true } },
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'RSVP_EVENT',
        entity_type: 'event_rsvp',
        entity_id: rsvp.id as any,
      },
    });

    return NextResponse.json(
      { message: 'RSVP recorded successfully', rsvp },
      { status: 201 }
    );
  } catch (error) {
    console.error('RSVP error:', error);
    return NextResponse.json(
      { error: 'Failed to RSVP to event' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel RSVP
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member profile not found' },
        { status: 404 }
      );
    }

    const rsvp = await prisma.event_rsvp.delete({
      where: {
        event_id_member_id: {
          event_id: id,
          member_id: member.id,
        },
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'CANCEL_RSVP',
        entity_type: 'event_rsvp',
        entity_id: rsvp.id as any,
      },
    });

    return NextResponse.json(
      { message: 'RSVP cancelled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel RSVP' },
      { status: 500 }
    );
  }
}

// GET - Get RSVP list for event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rsvps = await prisma.event_rsvp.findMany({
      where: {
        event_id: id,
        status: 'active',
      },
      include: {
        member: {
          select: {
            id: true,
            full_name: true,
            student_id: true,
            batch_year: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return NextResponse.json(
      { data: rsvps, count: rsvps.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get RSVPs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    );
  }
}
