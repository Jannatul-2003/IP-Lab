import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { title, content, noticeType } = await request.json();
    if (!title || !content || !noticeType)
      return NextResponse.json({ error: 'title, content, noticeType are required' }, { status: 400 });

    const notice = await prisma.notices.create({
      data: {
        title,
        content,
        notice_type: noticeType,
        author_id: user.userId as any,
        author_role: user.role,
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error('Create notice error:', error);
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const type = searchParams.get('type');

    const where: any = {};
    if (type) where.notice_type = type;

    const notices = await prisma.notices.findMany({
      where,
      orderBy: { published_at: 'desc' },
      take: limit,
      skip,
    });

    const total = await prisma.notices.count({ where });

    return NextResponse.json(
      {
        data: notices,
        pagination: { limit, skip, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch notices error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}
