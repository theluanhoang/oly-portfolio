import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import { getCloudinary, isCloudinaryEnabled } from '@/lib/cloudinary';

interface SignUploadRequestBody {
  filename?: string;
  folder?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    const adminCheck = await checkAdminAuth(session);
    if (adminCheck) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status },
      );
    }

    if (!isCloudinaryEnabled()) {
      return NextResponse.json(
        { error: 'Cloudinary is not configured on server' },
        { status: 500 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as SignUploadRequestBody;
    const originalFilename = body.filename ?? 'image';
    const safeBaseName =
      originalFilename.replace(/\.[^/.]+$/, '').slice(0, 80) || 'image';

    const timestamp = Math.floor(Date.now() / 1000);
    const randomString = Math.random().toString(36).substring(2, 15);
    const folder =
      body.folder ||
      process.env.CLOUDINARY_UPLOAD_FOLDER ||
      'oly-portfolio';
    const publicId = `${folder}/${timestamp}-${randomString}-${safeBaseName}`;

    const client = getCloudinary();
    const paramsToSign: Record<string, string | number> = {
      timestamp,
      public_id: publicId,
      folder,
    };

    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
    if (uploadPreset) {
      paramsToSign.upload_preset = uploadPreset;
    }

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) {
      return NextResponse.json(
        { error: 'Missing CLOUDINARY_API_SECRET' },
        { status: 500 },
      );
    }

    const signature = client.utils.api_sign_request(paramsToSign, apiSecret);

    return NextResponse.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      publicId,
      uploadPreset: uploadPreset || null,
      signature,
    });
  } catch (error) {
    console.error('[UPLOAD SIGN] Error creating Cloudinary signature:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create upload signature', details: message },
      { status: 500 },
    );
  }
}

