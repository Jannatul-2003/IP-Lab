import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, PRESIDENT_ROLES, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();

    const existing = await prisma.budgets.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });

    // Approve action — only PRESIDENT/ADMIN
    if (body.action === 'approve') {
      if (!PRESIDENT_ROLES.includes(user.role) && user.role !== 'SECRETARY')
        return NextResponse.json({ error: 'Only PRESIDENT/SECRETARY/ADMIN can approve budgets' }, { status: 403 });
      if (existing.status === 'approved')
        return NextResponse.json({ error: 'Budget is already approved' }, { status: 422 });

      const budget = await prisma.budgets.update({
        where: { id: params.id },
        data: { status: 'approved', approved_by: user.userId as any },
      });

      await prisma.audit_log.create({
        data: { actor_id: user.userId as any, action: 'APPROVE_BUDGET', entity_type: 'budgets', entity_id: params.id as any },
      });

      return NextResponse.json(budget, { status: 200 });
    }

    // Approved financial records are immutable — reject and general edits are
    // only allowed while the budget is still pending.
    if (existing.status === 'approved')
      return NextResponse.json({ error: 'Approved budgets are immutable and cannot be modified' }, { status: 422 });

    if (body.action === 'reject') {
      const budget = await prisma.budgets.update({
        where: { id: params.id },
        data: { status: 'rejected' },
      });
      return NextResponse.json(budget, { status: 200 });
    }

    // General update
    const budget = await prisma.budgets.update({
      where: { id: params.id },
      data: {
        total_amount_bdt: body.totalAmountBdt ? parseFloat(body.totalAmountBdt) : undefined,
        notes: body.notes ?? undefined,
      },
    });

    return NextResponse.json(budget, { status: 200 });
  } catch (error) {
    console.error('Update budget error:', error);
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!PRESIDENT_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const existing = await prisma.budgets.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    if (existing.status === 'approved')
      return NextResponse.json({ error: 'Approved budgets are immutable and cannot be deleted' }, { status: 422 });

    await prisma.budgets.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Budget deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete budget error:', error);
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
  }
}
