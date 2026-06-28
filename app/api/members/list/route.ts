import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - List members
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status');
    const batchYear = searchParams.get('batchYear');
    const search = searchParams.get('search');

    const where: any = {};
    if (status) where.status = status;
    if (batchYear) where.batch_year = parseInt(batchYear);
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { student_id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const members = await prisma.members.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip,
    });

    const total = await prisma.members.count({ where });

    return NextResponse.json(
      {
        data: members,
        pagination: { limit, skip, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
