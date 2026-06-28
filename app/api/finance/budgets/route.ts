import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - List budgets
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const roleError = requireRole(user, [...EC_ROLES, 'FACULTY_ADVISOR']);
    if (roleError) {
      return NextResponse.json(
        { error: roleError.error },
        { status: roleError.status }
      );
    }

    const { searchParams } = request.nextUrl;
    const termId = searchParams.get('termId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    const where: any = {};
    if (termId) where.term_id = termId;
    if (status) where.status = status;

    const budgets = await prisma.budgets.findMany({
      where,
      include: {
        term: {
          select: { id: true, term_number: true, start_date: true },
        },
        event: {
          select: { id: true, title: true, event_date: true },
        },
        expenditures: {
          select: {
            id: true,
            amount_bdt: true,
            category: true,
            description: true,
            expense_date: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip,
    });

    const total = await prisma.budgets.count({ where });

    return NextResponse.json(
      {
        data: budgets,
        pagination: { limit, skip, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch budgets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

// POST - Create budget
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

    const { termId, totalAmountBdt, eventId, notes } = await request.json();

    if (!termId || !totalAmountBdt) {
      return NextResponse.json(
        { error: 'termId and totalAmountBdt are required' },
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

    const budget = await prisma.budgets.create({
      data: {
        term_id: termId,
        total_amount_bdt: parseFloat(totalAmountBdt),
        event_id: eventId || null,
        notes: notes || null,
        status: 'pending',
      },
      include: {
        term: true,
        event: true,
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'CREATE_BUDGET',
        entity_type: 'budgets',
        entity_id: budget.id as any,
        payload: { termId, totalAmountBdt },
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Create budget error:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}
