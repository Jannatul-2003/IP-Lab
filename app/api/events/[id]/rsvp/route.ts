import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const member = await prisma.members.findUnique({ where: { user_id: user.userId } });
    if (!member) return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });

    // Capacity is enforced inside a Serializable transaction: if two
    // concurrent RSVPs would both read room for the last spot, Postgres
    // detects the conflict and aborts one — we retry it a few times rather
    // than risk an overbooked event (count-then-write alone has a race).
    const MAX_RETRIES = 3;
    let lastError: any;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const rsvp = await prisma.$transaction(
          async (tx) => {
            const event = await tx.events.findUnique({ where: { id: params.id } });
            if (!event || event.deleted_at) throw new Error('EVENT_NOT_FOUND');

            const existing = await tx.event_rsvp.findUnique({
              where: { event_id_member_id: { event_id: params.id, member_id: member.id } },
            });
            if (existing?.status === 'active') return existing;

            const activeCount = await tx.event_rsvp.count({
              where: { event_id: params.id, status: 'active' },
            });
            if (activeCount >= event.capacity) throw new Error('CAPACITY_FULL');

            return tx.event_rsvp.upsert({
              where: { event_id_member_id: { event_id: params.id, member_id: member.id } },
              update: { status: 'active' },
              create: { event_id: params.id, member_id: member.id, status: 'active' },
            });
          },
          { isolationLevel: 'Serializable' }
        );
        return NextResponse.json({ message: 'RSVP confirmed', rsvp }, { status: 200 });
      } catch (err: any) {
        if (err.message === 'EVENT_NOT_FOUND')
          return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        if (err.message === 'CAPACITY_FULL')
          return NextResponse.json({ error: 'Event is at full capacity' }, { status: 409 });
        lastError = err;
      }
    }
    throw lastError;
  } catch (error) {
    console.error('RSVP error:', error);
    return NextResponse.json({ error: 'Failed to RSVP' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const member = await prisma.members.findUnique({ where: { user_id: user.userId } });
    if (!member) return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });

    await prisma.event_rsvp.updateMany({
      where: { event_id: params.id, member_id: member.id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ message: 'RSVP cancelled' }, { status: 200 });
  } catch (error) {
    console.error('Cancel RSVP error:', error);
    return NextResponse.json({ error: 'Failed to cancel RSVP' }, { status: 500 });
  }
}
