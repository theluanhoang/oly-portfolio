import { prisma } from '@/lib/prisma';

export type ImageDeliveryProfile = 'default';

const DEFAULT_CLOUDINARY_TRANSFORM =
  // 1 optimized “original” (cap 2048) strategy:
  // - c_limit,w_2048,h_2048: cap long edge, preserve aspect
  // - f_auto: best format (AVIF/WebP/JPEG/PNG)
  // - q_auto: automatic quality
  // - dpr_auto: retina-friendly
  'c_limit,w_2048,h_2048,f_auto,q_auto,dpr_auto';

function getCloudinaryCloudName(): string | null {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || null;
}

export function buildCloudinaryImageUrl(args: {
  publicId: string;
  version?: string | null;
  transform?: string;
}): string {
  const cloudName = getCloudinaryCloudName();
  if (!cloudName) {
    throw new Error('Missing Cloudinary cloud name (set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or CLOUDINARY_CLOUD_NAME)');
  }

  const transform = args.transform || DEFAULT_CLOUDINARY_TRANSFORM;
  const versionSegment = args.version ? `v${args.version}` : undefined;
  const path = ['image/upload', transform, versionSegment, args.publicId].filter(Boolean).join('/');
  return `https://res.cloudinary.com/${cloudName}/${path}`;
}

export function buildLocalImageUrl(storageKey: string): string {
  return `/uploads/${storageKey}`;
}

export async function getImageUrlByAssetId(assetId: string, _profile: ImageDeliveryProfile = 'default'): Promise<string> {
  const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });
  if (!asset) {
    throw new Error(`MediaAsset not found: ${assetId}`);
  }

  if (asset.provider === 'cloudinary') {
    return buildCloudinaryImageUrl({
      publicId: asset.key,
      version: asset.version,
    });
  }

  if (asset.provider === 'local') {
    return buildLocalImageUrl(asset.key);
  }

  throw new Error(`Unsupported media provider: ${asset.provider}`);
}

