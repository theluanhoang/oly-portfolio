import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isCloudinaryEnabled, uploadImageToCloudinary } from '@/lib/cloudinary';
import { buildCloudinaryImageUrl, buildLocalImageUrl } from '@/lib/media';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    console.log('[UPLOAD] Incoming request', { contentType });
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      console.warn('[UPLOAD] Invalid content type', { contentType });
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data.' },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      console.warn('[UPLOAD] No file field or invalid file instance');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    console.log('[UPLOAD] Received file', {
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!allowedTypes.includes(file.type)) {
      console.warn('[UPLOAD] Invalid mime type', { type: file.type });
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.warn('[UPLOAD] File too large', { size: file.size, maxSize });
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const safeBaseName = file.name.replace(/\.[^/.]+$/, '').slice(0, 80) || 'image';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (isCloudinaryEnabled()) {
      console.log('[UPLOAD] Using Cloudinary provider');
      const uploadResult = await uploadImageToCloudinary(buffer, {
        public_id: `${timestamp}-${randomString}-${safeBaseName}`,
        overwrite: false,
        invalidate: false,
      });
      console.log('[UPLOAD] Cloudinary upload success', {
        public_id: uploadResult.public_id,
        bytes: uploadResult.bytes,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
      });

      const asset = await prisma.mediaAsset.create({
        data: {
          provider: 'cloudinary',
          key: uploadResult.public_id,
          version: uploadResult.version?.toString() ?? String(timestamp),
          mimeType: uploadResult.resource_type === 'image' ? uploadResult.format : file.type,
          width: uploadResult.width ?? null,
          height: uploadResult.height ?? null,
          bytes: uploadResult.bytes ?? file.size,
        },
      });

      const optimizedUrl = buildCloudinaryImageUrl({
        publicId: uploadResult.public_id,
        version: asset.version,
      });

      return NextResponse.json({
        success: true,
        url: optimizedUrl,
        filename: uploadResult.public_id,
        assetId: asset.id,
      });
    }

    console.log('[UPLOAD] Using local provider (Cloudinary disabled)');
    const filename = `${timestamp}-${randomString}.${extension}`;
    const publicUrl = buildLocalImageUrl(filename);

    const asset = await prisma.mediaAsset.create({
      data: {
        provider: 'local',
        key: filename,
        version: String(timestamp),
        mimeType: file.type,
        bytes: file.size,
      },
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      assetId: asset.id,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to upload file', details: errorMessage },
      { status: 500 }
    );
  }
}

