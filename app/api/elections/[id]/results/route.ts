import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const election = await prisma.elections.findUnique({ where: { id: params.id } });
    if (!election) return NextResponse.json({ error: 'Election not found' }, { status: 404 });

    const candidates = await prisma.candidates.findMany({
      where: { election_id: params.id },
      include: { member: { select: { full_name: true, student_id: true, batch_year: true } } },
      orderBy: [{ position: 'asc' }, { phase1_votes: 'desc' }],
    });

    // Group by position
    const byPosition: Record<string, typeof candidates> = {};
    for (const c of candidates) {
      if (!byPosition[c.position]) byPosition[c.position] = [];
      byPosition[c.position].push(c);
    }

    return NextResponse.json({ election, results: byPosition }, { status: 200 });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 });
  }
}
