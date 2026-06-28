import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - List meetings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const meetings = await prisma.meetings.findMany({
      where,
      include: {
        _count: {
          select: {
            attendance: {
              where: { present: true },
            },
          },
        },
      },
      orderBy: { scheduled_at: 'desc' },
      take: limit,
      skip,
    });

    const total = await prisma.meetings.count({ where });

    return NextResponse.json(
      {
        data: meetings,
        pagination: { limit, skip, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch meetings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

// POST - Create meeting
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const roleError = requireRole(user, EC_ROLES);
    if (roleError) {
      return NextResponse.json(
        { error: roleError.error },
        { status: roleError.status }
      );
    }

    const { title, agenda, scheduledAt, venue, calledBy, status } =
      await request.json();

    if (!title || !agenda || !scheduledAt || !venue || !calledBy) {
      return NextResponse.json(
        {
          error: 'title, agenda, scheduledAt, venue, and calledBy are required',
        },
        { status: 400 }
      );
    }

    const meeting = await prisma.meetings.create({
      data: {
        title,
        agenda,
        scheduled_at: new Date(scheduledAt),
        venue,
        called_by: calledBy,
        status: status || 'upcoming',
        created_by: user!.userId as any,
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'CREATE_MEETING',
        entity_type: 'meetings',
        entity_id: meeting.id as any,
        payload: { title, venue },
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('Create meeting error:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}
