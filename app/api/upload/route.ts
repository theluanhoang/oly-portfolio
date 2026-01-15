import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, checkAdminAuth } from '@/lib/auth';
import { optimizeImage, getOutputFormat } from '@/lib/imageOptimization';
import { validateImageUpload } from '@/lib/validations/imageUploadValidation';
import sharp from 'sharp';

export const maxDuration = 300;

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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('Error parsing FormData:', error);
      return NextResponse.json(
        { error: 'Failed to parse request body. File may be too large or request timed out.' },
        { status: 413 }
      );
    }
    
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    const validation = await validateImageUpload(file, originalBuffer, {
      maxFileSize: 50 * 1024 * 1024,
      maxWidth: 10000,
      maxHeight: 10000,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'File validation failed' },
        { status: 400 }
      );
    }

    let optimizedBuffer: Buffer;
    let outputFormat: string;
    try {
      const metadata = await sharp(originalBuffer).metadata();
      const originalFormat = metadata.format || 'jpeg';
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      const fileSizeMB = originalBuffer.length / (1024 * 1024);
      
      const isAlreadyOptimized = 
        width <= 2048 && 
        height <= 2048 && 
        fileSizeMB < 5 && 
        (originalFormat === 'webp' || originalFormat === 'jpeg' || originalFormat === 'jpg');
      
      if (isAlreadyOptimized) {
        console.log(`✅ Using client-optimized image: ${width}x${height}px, ${fileSizeMB.toFixed(2)}MB, ${originalFormat.toUpperCase()}`);
        optimizedBuffer = originalBuffer;
        outputFormat = originalFormat === 'jpg' ? 'jpeg' : originalFormat;
      } else {
        console.log(`🔄 Server optimizing: ${width}x${height}px, ${fileSizeMB.toFixed(2)}MB, ${originalFormat.toUpperCase()}`);
        optimizedBuffer = await optimizeImage(originalBuffer, {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 80,
          convertToWebP: true,
        });
        outputFormat = getOutputFormat(originalFormat, true);
        const optimizedSizeMB = optimizedBuffer.length / (1024 * 1024);
        console.log(`✅ Server optimization: ${optimizedSizeMB.toFixed(2)}MB, ${outputFormat.toUpperCase()}`);
      }
    } catch (optimizationError) {
      console.error('Error optimizing image:', optimizationError);
      optimizedBuffer = originalBuffer;
      outputFormat = file.name.split('.').pop() || 'jpg';
    }

    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      console.warn('Failed to create uploads directory:', error);
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
    const filename = `${timestamp}-${randomString}.${extension}`;
    const filepath = join(uploadsDir, filename);

    await writeFile(filepath, optimizedBuffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
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

