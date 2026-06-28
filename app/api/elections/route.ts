import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - List all elections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const elections = await prisma.elections.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip,
      include: {
        term: {
          select: {
            id: true,
            term_number: true,
            start_date: true,
            end_date: true,
          },
        },
        _count: {
          select: {
            candidates: true,
            votes: true,
          },
        },
      },
    });

    const total = await prisma.elections.count({ where });

    return NextResponse.json(
      {
        data: elections,
        pagination: { limit, skip, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch elections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch elections' },
      { status: 500 }
    );
  }
}

// POST - Create new election
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

    const {
      termId,
      phase1Start,
      phase1End,
      phase2Start,
      phase2End,
      shortlistN,
    } = await request.json();

    if (!termId || !phase1Start || !phase1End) {
      return NextResponse.json(
        { error: 'termId, phase1Start, and phase1End are required' },
        { status: 400 }
      );
    }

    // Verify term exists
    const term = await prisma.committee_terms.findUnique({
      where: { id: termId },
    });

    if (!term) {
      return NextResponse.json(
        { error: 'Committee term not found' },
        { status: 404 }
      );
    }

    const election = await prisma.elections.create({
      data: {
        term_id: termId,
        phase1_start: new Date(phase1Start),
        phase1_end: new Date(phase1End),
        phase2_start: phase2Start ? new Date(phase2Start) : null,
        phase2_end: phase2End ? new Date(phase2End) : null,
        shortlist_n: shortlistN || 3,
        status: 'DRAFT',
      },
      include: {
        term: {
          select: { id: true, term_number: true },
        },
      },
    });

    // Log audit
    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'CREATE_ELECTION',
        entity_type: 'elections',
        entity_id: election.id as any,
      },
    });

    return NextResponse.json(election, { status: 201 });
  } catch (error) {
    console.error('Create election error:', error);
    return NextResponse.json(
      { error: 'Failed to create election' },
      { status: 500 }
    );
  }
}
