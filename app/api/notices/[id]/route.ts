import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { title, content, noticeType } = await request.json();
    const updated = await prisma.notices.update({
      where: { id },
      data: {
        title: title ?? undefined,
        content: content ?? undefined,
        notice_type: noticeType ?? undefined,
      },
    });
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Update notice error:', error);
    return NextResponse.json({ error: 'Failed to update notice' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await prisma.notices.delete({ where: { id } });
    return NextResponse.json({ message: 'Notice deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete notice error:', error);
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
}
