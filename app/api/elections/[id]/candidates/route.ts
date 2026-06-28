import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const candidates = await prisma.candidates.findMany({
      where: { election_id: params.id },
      include: {
        member: { select: { full_name: true, student_id: true, batch_year: true } },
      },
      orderBy: [{ position: 'asc' }, { phase1_votes: 'desc' }],
    });
    return NextResponse.json({ data: candidates }, { status: 200 });
  } catch (error) {
    console.error('Get candidates error:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { memberId, position } = await request.json();
    if (!memberId || !position)
      return NextResponse.json({ error: 'memberId and position are required' }, { status: 400 });

    const election = await prisma.elections.findUnique({ where: { id: params.id } });
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });
    if (election.status !== 'DRAFT')
      return NextResponse.json({ error: 'Candidate registration is closed' }, { status: 400 });

    const candidate = await prisma.candidates.create({
      data: {
        election_id: params.id,
        member_id: memberId,
        position,
      },
      include: { member: { select: { full_name: true, student_id: true } } },
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002')
      return NextResponse.json({ error: 'Already registered for this position' }, { status: 409 });
    console.error('Register candidate error:', error);
    return NextResponse.json({ error: 'Failed to register candidate' }, { status: 500 });
  }
}
