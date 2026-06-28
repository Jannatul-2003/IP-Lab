import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role) && user.role !== 'FACULTY_ADVISOR')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const where: any = {};
    if (status) where.status = status;

    const meetings = await prisma.meetings.findMany({
      where,
      include: {
        attendance: {
          include: { member: { select: { full_name: true, student_id: true } } },
        },
      },
      orderBy: { scheduled_at: 'desc' },
    });

    return NextResponse.json({ data: meetings }, { status: 200 });
  } catch (error) {
    console.error('Fetch meetings error:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { title, agenda, scheduledAt, venue, calledBy } = await request.json();
    if (!title || !agenda || !scheduledAt || !venue || !calledBy)
      return NextResponse.json({ error: 'title, agenda, scheduledAt, venue, calledBy are required' }, { status: 400 });

    const meeting = await prisma.meetings.create({
      data: {
        title,
        agenda,
        scheduled_at: new Date(scheduledAt),
        venue,
        called_by: calledBy,
        status: 'upcoming',
        created_by: user.userId as any,
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('Create meeting error:', error);
    return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
  }
}
