import { v2 as cloudinary, type UploadApiOptions, type UploadApiResponse } from 'cloudinary';

function hasCloudinaryConfig(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function isCloudinaryEnabled(): boolean {
  return hasCloudinaryConfig();
}

export function getCloudinary() {
  if (!hasCloudinaryConfig()) {
    throw new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
    );
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  return cloudinary;
}

export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  options: UploadApiOptions = {},
): Promise<UploadApiResponse> {
  const client = getCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = client.uploader.upload_stream(
      {
        folder: options.folder ?? 'oly-portfolio',
        resource_type: 'image',
        // We keep original-ish asset and apply transformations at delivery time via URL.
        // You can still add eager transformations here if needed.
        ...options,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Unknown Cloudinary upload error'));
        } else {
          resolve(result);
        }
      },
    );

    uploadStream.end(fileBuffer);
  });
}

