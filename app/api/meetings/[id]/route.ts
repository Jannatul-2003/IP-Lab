import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - Get meeting details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const meeting = await prisma.meetings.findUnique({
      where: { id },
      include: {
        attendance: {
          include: {
            member: {
              select: {
                id: true,
                full_name: true,
                student_id: true,
              },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(meeting, { status: 200 });
  } catch (error) {
    console.error('Get meeting error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
}

// PUT - Update meeting
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

    const { title, agenda, scheduledAt, venue, status, minutesUrl } =
      await request.json();

    const meeting = await prisma.meetings.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(agenda && { agenda }),
        ...(scheduledAt && { scheduled_at: new Date(scheduledAt) }),
        ...(venue && { venue }),
        ...(status && { status }),
        ...(minutesUrl && { minutes_url: minutesUrl }),
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'UPDATE_MEETING',
        entity_type: 'meetings',
        entity_id: meeting.id as any,
        payload: { status },
      },
    });

    return NextResponse.json(
      { message: 'Meeting updated successfully', meeting },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update meeting error:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    );
  }
}
