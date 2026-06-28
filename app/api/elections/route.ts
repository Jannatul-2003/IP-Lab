import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const elections = await prisma.elections.findMany({
      orderBy: { created_at: 'desc' },
      include: { term: { select: { id: true, term_number: true, status: true } } },
    });
    return NextResponse.json({ data: elections }, { status: 200 });
  } catch (error) {
    console.error('Fetch elections error:', error);
    return NextResponse.json({ error: 'Failed to fetch elections' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { termId, phase1Start, phase1End, phase2Start, phase2End, shortlistN } =
      await request.json();

    if (!termId || !phase1Start || !phase1End)
      return NextResponse.json({ error: 'termId, phase1Start, phase1End are required' }, { status: 400 });

    const term = await prisma.committee_terms.findUnique({ where: { id: termId } });
    if (!term) return NextResponse.json({ error: 'Committee term not found' }, { status: 404 });

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
    });

    await prisma.audit_log.create({
      data: { actor_id: user.userId as any, action: 'CREATE_ELECTION', entity_type: 'elections', entity_id: election.id as any },
    });

    return NextResponse.json(election, { status: 201 });
  } catch (error) {
    console.error('Create election error:', error);
    return NextResponse.json({ error: 'Failed to create election' }, { status: 500 });
  }
}
