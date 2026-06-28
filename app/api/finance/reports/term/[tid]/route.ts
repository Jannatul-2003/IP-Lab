import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: { tid: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const term = await prisma.committee_terms.findUnique({ where: { id: params.tid } });
    if (!term) return NextResponse.json({ error: 'Committee term not found' }, { status: 404 });

    const budgets = await prisma.budgets.findMany({
      where: { term_id: params.tid },
      include: {
        event: { select: { id: true, title: true } },
        expenditures: true,
      },
    });

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.total_amount_bdt, 0);
    const approvedBudgeted = budgets
      .filter((b) => b.status === 'approved')
      .reduce((sum, b) => sum + b.total_amount_bdt, 0);

    const categoryTotals: Record<string, number> = {};
    let totalSpent = 0;
    for (const budget of budgets) {
      for (const exp of budget.expenditures) {
        totalSpent += exp.amount_bdt;
        const category = exp.category || 'Uncategorized';
        categoryTotals[category] = (categoryTotals[category] || 0) + exp.amount_bdt;
      }
    }

    const byBudget = budgets.map((b) => {
      const spent = b.expenditures.reduce((s, e) => s + e.amount_bdt, 0);
      return {
        budgetId: b.id,
        event: b.event?.title || 'General',
        status: b.status,
        totalAmountBdt: b.total_amount_bdt,
        spentBdt: spent,
        remainingBdt: b.total_amount_bdt - spent,
      };
    });

    return NextResponse.json(
      {
        term: { id: term.id, termNumber: term.term_number, status: term.status },
        totalBudgetedBdt: totalBudgeted,
        approvedBudgetedBdt: approvedBudgeted,
        totalSpentBdt: totalSpent,
        remainingBdt: approvedBudgeted - totalSpent,
        spendByCategory: categoryTotals,
        budgets: byBudget,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Term financial report error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
