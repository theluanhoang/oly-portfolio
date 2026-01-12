import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import sharp from 'sharp';

const IMAGE_CONFIG = {
  maxWidth: 1920,
  maxHeight: 1920,
  webpQuality: 82,
  jpegQuality: 82,
  pngQuality: 82,
  maxFileSizeBefore: 100 * 1024 * 1024, // 100MB - support RAW camera images
  maxFileSizeAfter: 5 * 1024 * 1024, // 5MB - allow larger optimized files
  maxDimensions: 10000, // Support high-resolution camera images
  minSizeForOptimization: 50 * 1024, // Skip optimization for files < 50KB
  stripMetadata: true,
  progressive: true,
  // Timeout for large file processing (30 seconds)
  processingTimeout: 30000,
};

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

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Support common image formats including high-quality formats
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/tiff',
      'image/tif',
      // Note: RAW formats (CR2, NEF, ARW, etc.) are not directly supported by browsers
      // Users should convert RAW to JPEG/TIFF before upload
    ];
    
    // Also check file extension for additional format support
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'tiff', 'tif'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Supported formats: JPEG, PNG, WebP, GIF, TIFF. RAW formats (CR2, NEF, ARW) must be converted to JPEG/TIFF first.',
          supportedFormats: ['JPEG', 'PNG', 'WebP', 'GIF', 'TIFF'],
        },
        { status: 400 }
      );
    }

    // Check file size before processing
    if (file.size > IMAGE_CONFIG.maxFileSizeBefore) {
      const maxSizeMB = IMAGE_CONFIG.maxFileSizeBefore / (1024 * 1024);
      return NextResponse.json(
        { error: `File size exceeds ${maxSizeMB}MB limit. Maximum allowed: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`[Image Upload] Starting optimization for: ${file.name} (${(buffer.length / 1024).toFixed(1)}KB, ${file.type})`);

    // Skip optimization for small files (overhead may increase size)
    if (buffer.length < IMAGE_CONFIG.minSizeForOptimization) {
      console.log(`[Image Upload] Skipping optimization for small file (< ${IMAGE_CONFIG.minSizeForOptimization / 1024}KB), keeping original`);
      
      const uploadsDir = join(process.cwd(), 'public', 'uploads');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (error) {
        console.warn('Failed to create uploads directory:', error);
      }

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${timestamp}-${randomString}.${extension}`;
      const filepath = join(uploadsDir, filename);

      await writeFile(filepath, buffer);

      const publicUrl = `/uploads/${filename}`;

      return NextResponse.json({
        success: true,
        url: publicUrl,
        filename: filename,
        size: buffer.length,
        format: extension,
        optimized: false, // Flag to indicate no optimization was performed
      });
    }

    let processedBuffer: Buffer;
    let outputExtension: string;

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      if (metadata.width && metadata.width > IMAGE_CONFIG.maxDimensions) {
        return NextResponse.json(
          { error: `Image width exceeds ${IMAGE_CONFIG.maxDimensions}px limit` },
          { status: 400 }
        );
      }
      if (metadata.height && metadata.height > IMAGE_CONFIG.maxDimensions) {
        return NextResponse.json(
          { error: `Image height exceeds ${IMAGE_CONFIG.maxDimensions}px limit` },
          { status: 400 }
        );
      }
      const isPng = file.type === 'image/png';
      const isGif = file.type === 'image/gif';
      const isTiff = file.type === 'image/tiff' || file.type === 'image/tif' || 
                     fileExtension === 'tiff' || fileExtension === 'tif';
      const hasTransparency = metadata.hasAlpha;

      let pipeline = image;

      if (
        metadata.width &&
        metadata.height &&
        (metadata.width > IMAGE_CONFIG.maxWidth || metadata.height > IMAGE_CONFIG.maxHeight)
      ) {
        pipeline = pipeline.resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      if (IMAGE_CONFIG.stripMetadata) {
        pipeline = pipeline.withMetadata({});
      }

      if (isGif) {
        outputExtension = 'gif';
        processedBuffer = await pipeline.gif().toBuffer();
      } else if (isTiff) {
        // TIFF files (often exported from RAW cameras) - convert to WebP for web
        outputExtension = 'webp';
        processedBuffer = await pipeline
          .webp({ quality: IMAGE_CONFIG.webpQuality })
          .toBuffer();
        
        // For very large TIFF files, reduce quality if needed
        if (processedBuffer.length > IMAGE_CONFIG.maxFileSizeAfter) {
          processedBuffer = await pipeline
            .webp({ quality: 75 })
            .toBuffer();
          
          if (processedBuffer.length > IMAGE_CONFIG.maxFileSizeAfter) {
            processedBuffer = await pipeline
              .webp({ quality: 65 })
              .toBuffer();
          }
        }
      } else if (hasTransparency) {
        outputExtension = 'webp';
        
        const losslessBuffer = await pipeline.webp({ lossless: true }).toBuffer();
        
        if (losslessBuffer.length < 500 * 1024) {
          processedBuffer = losslessBuffer;
        } else {
          processedBuffer = await pipeline
            .webp({ quality: 90, effort: 6 })
            .toBuffer();
          
          if (processedBuffer.length > IMAGE_CONFIG.maxFileSizeAfter) {
            processedBuffer = await pipeline
              .webp({ quality: 85, effort: 6 })
              .toBuffer();
          }
        }
      } else if (isPng && !hasTransparency) {
        outputExtension = 'webp';
        processedBuffer = await pipeline
          .webp({ quality: IMAGE_CONFIG.webpQuality })
          .toBuffer();
      } else {
        outputExtension = 'webp';
        processedBuffer = await pipeline
          .webp({ quality: IMAGE_CONFIG.webpQuality })
          .toBuffer();

        if (processedBuffer.length > IMAGE_CONFIG.maxFileSizeAfter) {
          const reducedImage = image
            .resize(IMAGE_CONFIG.maxWidth, IMAGE_CONFIG.maxHeight, {
              fit: 'inside',
              withoutEnlargement: true,
            })
            .withMetadata({});

          processedBuffer = await reducedImage
            .webp({ quality: 75 })
            .toBuffer();

          if (processedBuffer.length > IMAGE_CONFIG.maxFileSizeAfter) {
            processedBuffer = await reducedImage
              .webp({ quality: 65 })
              .toBuffer();
          }
        }
      }
    } catch (sharpError) {
      console.error('Sharp processing error:', sharpError);
      processedBuffer = buffer;
      outputExtension = file.name.split('.').pop() || 'jpg';
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create uploads directory:', error);
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${randomString}.${outputExtension}`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, processedBuffer);

    const publicUrl = `/uploads/${filename}`;

    const originalSize = buffer.length;
    const optimizedSize = processedBuffer.length;
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
    console.log(
      `Image optimized: ${file.name} - ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${reduction}% reduction)`
    );

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
      size: optimizedSize,
      format: outputExtension,
      optimized: true, // Flag to indicate optimization was performed
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

