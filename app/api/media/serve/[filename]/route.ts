import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Map file extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: validate filename to prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    // Ensure the file is within the uploads directory
    if (!filePath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
      const fileBuffer = await readFile(filePath);

      // Determine MIME type from file extension
      const ext = path.extname(filename).toLowerCase();
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

      // Set cache headers to cache for 1 year (immutable content)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (fileError: any) {
      if (fileError.code === 'ENOENT') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
      throw fileError;
    }
  } catch (error) {
    console.error('Media serve error:', error);
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
