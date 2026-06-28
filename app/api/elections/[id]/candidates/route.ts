import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - List candidates for an election
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const candidates = await prisma.candidates.findMany({
      where: { election_id: id },
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
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ data: candidates }, { status: 200 });
  } catch (error) {
    console.error('Fetch candidates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}

// POST - Add candidate to election
export async function POST(
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

    const { memberId, position } = await request.json();

    if (!memberId || !position) {
      return NextResponse.json(
        { error: 'memberId and position are required' },
        { status: 400 }
      );
    }

    // Verify election exists
    const election = await prisma.elections.findUnique({
      where: { id },
    });

    if (!election) {
      return NextResponse.json(
        { error: 'Election not found' },
        { status: 404 }
      );
    }

    // Check if member exists
    const member = await prisma.members.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if candidate already exists
    const existingCandidate = await prisma.candidates.findUnique({
      where: {
        election_id_member_id_position: {
          election_id: id,
          member_id: memberId,
          position,
        },
      },
    });

    if (existingCandidate) {
      return NextResponse.json(
        { error: 'Candidate already registered for this position' },
        { status: 409 }
      );
    }

    const candidate = await prisma.candidates.create({
      data: {
        election_id: id,
        member_id: memberId,
        position,
      },
      include: {
        member: {
          select: { id: true, full_name: true, student_id: true },
        },
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'CREATE_CANDIDATE',
        entity_type: 'candidates',
        entity_id: candidate.id as any,
        payload: { memberId, position },
      },
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    console.error('Create candidate error:', error);
    return NextResponse.json(
      { error: 'Failed to create candidate' },
      { status: 500 }
    );
  }
}
