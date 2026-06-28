import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, requireRole, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

// GET - List notices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const noticeType = searchParams.get('noticeType');

    const where: any = {};
    if (noticeType) where.notice_type = noticeType;

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

// POST - Create notice
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

    const { title, content, noticeType } = await request.json();

    if (!title || !content || !noticeType) {
      return NextResponse.json(
        { error: 'title, content, and noticeType are required' },
        { status: 400 }
      );
    }

    const notice = await prisma.notices.create({
      data: {
        title,
        content,
        notice_type: noticeType,
        author_id: user!.userId as any,
        author_role: user!.role,
      },
    });

    await prisma.audit_log.create({
      data: {
        actor_id: user!.userId as any,
        action: 'CREATE_NOTICE',
        entity_type: 'notices',
        entity_id: notice.id as any,
        payload: { title, noticeType },
      },
    });

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error('Create notice error:', error);
    return NextResponse.json(
      { error: 'Failed to create notice' },
      { status: 500 }
    );
  }
}
