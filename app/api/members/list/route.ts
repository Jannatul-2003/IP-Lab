import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    const decoded = jwt.verify(
      token,
      process.env.JWT_PUBLIC_KEY || 'your-secret-key',
      { algorithms: ['RS256'] }
    ) as any;
    return decoded;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only EC officers and above can list members
    if (!['EC_OFFICER', 'PRESIDENT', 'SECRETARY', 'SYSTEM_ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { page = '1', limit = '20', status } = Object.fromEntries(
      request.nextUrl.searchParams
    ) as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const members = await prisma.members.findMany({
      where: whereClause,
      include: { user: { select: { email: true, role: true } } },
      skip,
      take: parseInt(limit),
      orderBy: { created_at: 'desc' },
    });

    const total = await prisma.members.count({ where: whereClause });

    return NextResponse.json(
      {
        data: members,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('List members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
