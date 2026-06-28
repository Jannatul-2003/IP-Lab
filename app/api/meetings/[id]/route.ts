import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role) && user.role !== 'FACULTY_ADVISOR')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const meeting = await prisma.meetings.findUnique({
      where: { id: params.id },
      include: {
        attendance: {
          include: { member: { select: { full_name: true, student_id: true } } },
        },
      },
    });
    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    return NextResponse.json(meeting, { status: 200 });
  } catch (error) {
    console.error('Get meeting error:', error);
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();

    const updated = await prisma.meetings.update({
      where: { id: params.id },
      data: {
        title: body.title ?? undefined,
        agenda: body.agenda ?? undefined,
        scheduled_at: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        venue: body.venue ?? undefined,
        status: body.status ?? undefined,
        called_by: body.calledBy ?? undefined,
        minutes_url: body.minutesUrl ?? undefined,
      },
    });

    // Upsert attendance records if provided
    if (Array.isArray(body.attendance)) {
      for (const { memberId, present } of body.attendance) {
        await prisma.meeting_attendance.upsert({
          where: { meeting_id_member_id: { meeting_id: params.id, member_id: memberId } },
          update: { present },
          create: { meeting_id: params.id, member_id: memberId, present },
        });
      }
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Update meeting error:', error);
    return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.meeting_attendance.deleteMany({ where: { meeting_id: params.id } });
    await prisma.meetings.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Meeting deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete meeting error:', error);
    return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
  }
}
