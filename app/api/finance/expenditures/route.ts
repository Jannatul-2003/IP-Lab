import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - List expenditures
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
    const budgetId = searchParams.get('budgetId');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');

    const where: any = {};
    if (budgetId) where.budget_id = budgetId;
    if (category) where.category = category;

    const expenditures = await prisma.expenditures.findMany({
      where,
      include: {
        budget: {
          select: {
            id: true,
            total_amount_bdt: true,
            status: true,
            term: { select: { term_number: true } },
          },
        },
      },
      orderBy: { expense_date: 'desc' },
      take: limit,
      skip,
    });

    const total = await prisma.expenditures.count({ where });

    return NextResponse.json(
      {
        data: expenditures,
        pagination: { limit, skip, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch expenditures error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenditures' },
      { status: 500 }
    );
  }
}

// POST - Create expenditure
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

    const { budgetId, amountBdt, category, description, expenseDate } =
      await request.json();

    if (!budgetId || !amountBdt || !expenseDate) {
      return NextResponse.json(
        { error: 'budgetId, amountBdt, and expenseDate are required' },
        { status: 400 }
      );
    }

    // Verify budget exists
    const budget = await prisma.budgets.findUnique({
      where: { id: budgetId },
      include: { expenditures: true },
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Check if expenditure exceeds budget
    const totalExpended = budget.expenditures.reduce((sum: number, exp: any) => sum + exp.amount_bdt, 0);
    const newTotal = totalExpended + parseFloat(amountBdt);

    if (newTotal > budget.total_amount_bdt) {
      return NextResponse.json(
        {
          error: `Expenditure exceeds budget. Current: ${totalExpended}, Budget: ${budget.total_amount_bdt}, New Total: ${newTotal}`,
        },
        { status: 400 }
      );
    }

    const expenditure = await prisma.expenditures.create({
      data: {
        budget_id: budgetId,
        amount_bdt: parseFloat(amountBdt),
        category: category || null,
        description: description || null,
        expense_date: new Date(expenseDate),
        added_by: user!.userId as any,
      },
      include: {
        budget: {
          select: { id: true, total_amount_bdt: true },
        },
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'CREATE_EXPENDITURE',
        entity_type: 'expenditures',
        entity_id: expenditure.id as any,
        payload: { budgetId, amountBdt, category },
      },
    });

    return NextResponse.json(expenditure, { status: 201 });
  } catch (error) {
    console.error('Create expenditure error:', error);
    return NextResponse.json(
      { error: 'Failed to create expenditure' },
      { status: 500 }
    );
  }
}
