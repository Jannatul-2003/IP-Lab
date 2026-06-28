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
    const budgetId = searchParams.get('budgetId');
    const where: any = {};
    if (budgetId) where.budget_id = budgetId;

    const expenditures = await prisma.expenditures.findMany({
      where,
      orderBy: { expense_date: 'desc' },
    });

    return NextResponse.json({ data: expenditures }, { status: 200 });
  } catch (error) {
    console.error('Fetch expenditures error:', error);
    return NextResponse.json({ error: 'Failed to fetch expenditures' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { budgetId, amountBdt, category, description, expenseDate } = await request.json();
    if (!budgetId || !amountBdt || !expenseDate)
      return NextResponse.json({ error: 'budgetId, amountBdt, expenseDate are required' }, { status: 400 });

    // Check budget is approved
    const budget = await prisma.budgets.findUnique({ where: { id: budgetId } });
    if (!budget) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    if (budget.status !== 'approved')
      return NextResponse.json({ error: 'Cannot log expense against a non-approved budget' }, { status: 400 });

    const expenditure = await prisma.expenditures.create({
      data: {
        budget_id: budgetId,
        amount_bdt: parseFloat(amountBdt),
        category: category || null,
        description: description || null,
        expense_date: new Date(expenseDate),
        added_by: user.userId as any,
      },
    });

    return NextResponse.json(expenditure, { status: 201 });
  } catch (error) {
    console.error('Create expenditure error:', error);
    return NextResponse.json({ error: 'Failed to log expenditure' }, { status: 500 });
  }
}
