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

    const { url, mediaType, tags, eventId } = await request.json();
    if (!url || !mediaType)
      return NextResponse.json({ error: 'url and mediaType are required' }, { status: 400 });

    const media = await prisma.media.create({
      data: {
        url,
        media_type: mediaType,
        tags: tags || [],
        event_id: eventId || null,
        uploaded_by: user.userId as any,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error) {
    console.error('Create media error:', error);
    return NextResponse.json({ error: 'Failed to create media record' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const mediaType = searchParams.get('type') || 'image';
    const eventId = searchParams.get('eventId');

    const where: any = { media_type: mediaType };
    if (eventId) where.event_id = eventId;

    const media = await prisma.media.findMany({
      where,
      orderBy: { uploaded_at: 'desc' },
      take: limit,
      skip,
    });

    const total = await prisma.media.count({ where });

    return NextResponse.json(
      {
        data: media,
        pagination: { limit, skip, total },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch media error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}
