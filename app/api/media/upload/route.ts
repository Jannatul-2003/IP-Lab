import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, EC_ROLES } from '@/lib/auth-utils';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
};

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!EC_ROLES.includes(user.role))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File))
      return NextResponse.json({ error: 'file is required' }, { status: 400 });

    const extension = ALLOWED_TYPES[file.type];
    if (!extension)
      return NextResponse.json({ error: 'Unsupported file type. Allowed: JPEG, PNG, WEBP, GIF, PDF' }, { status: 400 });

    if (file.size > MAX_SIZE_BYTES)
      return NextResponse.json({ error: 'File exceeds the 10 MB size limit' }, { status: 400 });

    await mkdir(UPLOAD_DIR, { recursive: true });

    const filename = `${crypto.randomUUID()}${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const mediaType = file.type === 'application/pdf' ? 'pdf' : 'image';

    return NextResponse.json({ url: `/uploads/${filename}`, mediaType }, { status: 201 });
  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
