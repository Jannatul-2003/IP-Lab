import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, ADMIN_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const terms = await prisma.committee_terms.findMany({
      orderBy: { term_number: 'desc' },
    });
    return NextResponse.json({ data: terms }, { status: 200 });
  } catch (error) {
    console.error('Fetch terms error:', error);
    return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    const roleError = requireRole(user, ADMIN_ROLES);
    if (roleError) return NextResponse.json({ error: roleError.error }, { status: roleError.status });

    const { termNumber, startDate, endDate } = await request.json();
    if (!termNumber || !startDate)
      return NextResponse.json({ error: 'termNumber and startDate are required' }, { status: 400 });

    const term = await prisma.committee_terms.create({
      data: {
        term_number: termNumber,
        start_date: new Date(startDate),
        end_date: endDate ? new Date(endDate) : null,
        status: 'active',
      },
    });

    await prisma.audit_log.create({
      data: { actor_id: user!.userId as any, action: 'CREATE_TERM', entity_type: 'committee_terms', entity_id: term.id as any },
    });

    return NextResponse.json(term, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002')
      return NextResponse.json({ error: 'Term number already exists' }, { status: 409 });
    console.error('Create term error:', error);
    return NextResponse.json({ error: 'Failed to create term' }, { status: 500 });
  }
}
