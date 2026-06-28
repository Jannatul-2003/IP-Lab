import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['SYSTEM_ADMIN', 'PRESIDENT'].includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const entityType = searchParams.get('entityType');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (entityType) where.entity_type = entityType;

    const [logs, total] = await Promise.all([
      prisma.audit_log.findMany({
        where,
        orderBy: { logged_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.audit_log.count({ where }),
    ]);

    return NextResponse.json(
      { data: logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch audit log error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
  }
}
