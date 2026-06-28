import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - Get budget details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request);
    const roleError = requireRole(user, [...EC_ROLES, 'FACULTY_ADVISOR']);
    if (roleError) {
      return NextResponse.json(
        { error: roleError.error },
        { status: roleError.status }
      );
    }

    const budget = await prisma.budgets.findUnique({
      where: { id },
      include: {
        term: true,
        event: true,
        expenditures: {
          orderBy: { expense_date: 'desc' },
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      );
    }

    // Calculate totals
    const totalExpended = budget.expenditures.reduce((sum, exp) => sum + exp.amount_bdt, 0);
    const remaining = budget.total_amount_bdt - totalExpended;

    return NextResponse.json(
      {
        ...budget,
        totalExpended,
        remaining,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get budget error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    );
  }
}

// PUT - Update budget
export async function PUT(
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

    const { totalAmountBdt, status, notes } = await request.json();

    const budget = await prisma.budgets.update({
      where: { id },
      data: {
        ...(totalAmountBdt && { total_amount_bdt: parseFloat(totalAmountBdt) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(status === 'approved' && { approved_by: user!.userId as any }),
      },
      include: {
        term: true,
        event: true,
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'UPDATE_BUDGET',
        entity_type: 'budgets',
        entity_id: budget.id as any,
        payload: { status },
      },
    });

    return NextResponse.json(
      { message: 'Budget updated successfully', budget },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update budget error:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}
