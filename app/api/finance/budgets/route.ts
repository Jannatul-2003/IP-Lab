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
    const termId = searchParams.get('termId');
    const where: any = {};
    if (termId) where.term_id = termId;

    const budgets = await prisma.budgets.findMany({
      where,
      include: {
        term: { select: { id: true, term_number: true } },
        event: { select: { id: true, title: true } },
        expenditures: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ data: budgets }, { status: 200 });
  } catch (error) {
    console.error('Fetch budgets error:', error);
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { termId, totalAmountBdt, eventId, notes } = await request.json();
    if (!termId || !totalAmountBdt)
      return NextResponse.json({ error: 'termId and totalAmountBdt are required' }, { status: 400 });

    const term = await prisma.committee_terms.findUnique({ where: { id: termId } });
    if (!term) return NextResponse.json({ error: 'Committee term not found' }, { status: 404 });

    const budget = await prisma.budgets.create({
      data: {
        term_id: termId,
        total_amount_bdt: parseFloat(totalAmountBdt),
        event_id: eventId || null,
        notes: notes || null,
        status: 'pending',
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Create budget error:', error);
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
}
