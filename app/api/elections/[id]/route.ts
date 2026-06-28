import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - Get election details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const election = await prisma.elections.findUnique({
      where: { id },
      include: {
        term: true,
        candidates: {
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
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: 'Election not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(election, { status: 200 });
  } catch (error) {
    console.error('Get election error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch election' },
      { status: 500 }
    );
  }
}

// PUT - Update election
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

    const { status, phase1Start, phase1End, phase2Start, phase2End } =
      await request.json();

    const election = await prisma.elections.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(phase1Start && { phase1_start: new Date(phase1Start) }),
        ...(phase1End && { phase1_end: new Date(phase1End) }),
        ...(phase2Start && { phase2_start: new Date(phase2Start) }),
        ...(phase2End && { phase2_end: new Date(phase2End) }),
      },
      include: { term: true },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'UPDATE_ELECTION',
        entity_type: 'elections',
        entity_id: election.id as any,
        payload: { status, phase1Start, phase1End },
      },
    });

    return NextResponse.json(
      { message: 'Election updated successfully', election },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update election error:', error);
    return NextResponse.json(
      { error: 'Failed to update election' },
      { status: 500 }
    );
  }
}
