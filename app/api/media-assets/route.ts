import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildCloudinaryImageUrl } from '@/lib/media';

interface CreateMediaAssetBody {
  provider: 'cloudinary' | 'local';
  publicId: string;
  version?: string | number | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
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

    const body = (await request.json()) as CreateMediaAssetBody;

    if (!body.publicId || !body.provider) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, publicId' },
        { status: 400 },
      );
    }

    const version =
      body.version !== undefined && body.version !== null
        ? String(body.version)
        : String(Date.now());

    const asset = await prisma.mediaAsset.create({
      data: {
        provider: body.provider,
        key: body.publicId,
        version,
        mimeType: body.mimeType ?? null,
        width: body.width ?? null,
        height: body.height ?? null,
        bytes: body.bytes ?? null,
      },
    });

    let url: string | null = null;
    if (asset.provider === 'cloudinary') {
      try {
        url = buildCloudinaryImageUrl({
          publicId: asset.key,
          version: asset.version,
        });
      } catch {
        url = null;
      }
    }

    return NextResponse.json({
      success: true,
      assetId: asset.id,
      url,
    });
  } catch (error) {
    console.error('[MEDIA ASSET] Error creating media asset:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create media asset', details: message },
      { status: 500 },
    );
  }
}

