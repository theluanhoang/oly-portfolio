/**
 * Generate 5 test images with sizes ranging from 45MB to 50MB
 * 
 * Chạy: npm run test:image:generate
 */

import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

interface ImageSpec {
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
  quality: number;
  targetSizeMB: number;
}

/**
 * Generate image with target file size
 */
async function generateImageWithTargetSize(
  spec: ImageSpec,
  outputPath: string
): Promise<{ actualSizeMB: number; actualSizeBytes: number }> {
  const { width, height, format, quality, targetSizeMB } = spec;
  
  // Create a very large image with high detail
  // For 30-50MB files, we need very high resolution with complex patterns
  let buffer: Buffer | null = null;
  let currentSize = 0;
  let attempts = 0;
  const maxAttempts = 8;
  let currentQuality = quality;

  // Create base image with complex pattern
  const createComplexImage = async (q: number): Promise<Buffer> => {
    // Create SVG with many elements for complexity
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})"/>
            <stop offset="50%" style="stop-color:rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})"/>
            <stop offset="100%" style="stop-color:rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})"/>
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        ${Array.from({ length: 200 }).map((_, i) => {
          const x = (i % 20) * (width / 20);
          const y = Math.floor(i / 20) * (height / 10);
          const size = 100 + Math.random() * 200;
          return `<circle cx="${x}" cy="${y}" r="${size}" fill="rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.5)"/>`;
        }).join('')}
        <text x="50%" y="50%" font-size="${width / 15}" text-anchor="middle" fill="rgba(0,0,0,0.8)" font-family="Arial" font-weight="bold">
          TEST ${targetSizeMB.toFixed(1)}MB
        </text>
      </svg>
    `;

    const svgBuffer = Buffer.from(svg);
    const pipeline = sharp(svgBuffer).resize(width, height);

    if (format === 'jpeg') {
      return await pipeline.jpeg({ quality: q, mozjpeg: false }).toBuffer();
    } else if (format === 'png') {
      // PNG with no compression for maximum size
      return await pipeline.png({ compressionLevel: 0, quality: 100 }).toBuffer();
    } else {
      return await pipeline.webp({ quality: q, effort: 1 }).toBuffer();
    }
  };

  while (attempts < maxAttempts) {
    buffer = await createComplexImage(currentQuality);
    currentSize = buffer.length / 1024 / 1024;
    const sizeDiff = currentSize - targetSizeMB;
    const diffPercent = Math.abs(sizeDiff / targetSizeMB);

    // If within 20% of target, we're good
    if (diffPercent <= 0.2) {
      break;
    }

    // Adjust quality
    if (sizeDiff > 0) {
      currentQuality = Math.max(50, currentQuality - 10);
    } else {
      currentQuality = Math.min(100, currentQuality + 10);
    }

    attempts++;
  }

  if (!buffer) {
    throw new Error('Failed to generate image');
  }

  await writeFile(outputPath, buffer);

  return {
    actualSizeMB: currentSize,
    actualSizeBytes: buffer.length,
  };
}

async function generateTestImages() {
  console.log('🖼️  Tạo 5 file ảnh test với kích thước 45-50MB\n');
  console.log('='.repeat(80));

  const outputDir = join(process.cwd(), 'public', 'test-upload-images');
  await mkdir(outputDir, { recursive: true });

  // Generate 5 images with sizes from 45MB to 50MB
  const images: ImageSpec[] = [];
  for (let i = 0; i < 5; i++) {
    const targetSizeMB = 45 + (i * (50 - 45) / 4); // Distribute evenly from 45 to 50MB
    const format = i % 3 === 0 ? 'jpeg' : i % 3 === 1 ? 'png' : 'webp';
    
    // Calculate dimensions needed for target size
    // Rough estimate: for PNG uncompressed, 1MP ≈ 4MB (RGBA)
    // For JPEG/WebP compressed, need much larger resolution
    const baseWidth = format === 'png' ? 9000 : 11000;
    const baseHeight = format === 'png' ? 7000 : 9000;
    const scaleFactor = 1 + (targetSizeMB - 45) / 10; // Scale from 1.0 to 1.5
    
    images.push({
      width: Math.floor(baseWidth * scaleFactor),
      height: Math.floor(baseHeight * scaleFactor),
      format,
      quality: format === 'png' ? 100 : (95 + Math.floor(Math.random() * 5)), // PNG: 100, others: 95-100
      targetSizeMB,
    });
  }

  console.log('📋 Specs cho 5 images:\n');
  images.forEach((img, i) => {
    console.log(`   ${i + 1}. ${img.format.toUpperCase()} - ${img.width}x${img.height}px - Target: ${img.targetSizeMB.toFixed(1)}MB`);
  });

  console.log('\n⏳ Đang tạo images...\n');
  console.log('-'.repeat(80));

  const results: Array<{
    filename: string;
    targetMB: number;
    actualMB: number;
    diff: number;
  }> = [];

  for (let i = 0; i < images.length; i++) {
    const spec = images[i];
    const extension = spec.format === 'jpeg' ? 'jpg' : spec.format;
    const filename = `test-image-${i + 1}-${spec.targetSizeMB.toFixed(1)}mb.${extension}`;
    const filepath = join(outputDir, filename);

    process.stdout.write(`   [${i + 1}/5] Đang tạo ${filename}... `);

    try {
      const result = await generateImageWithTargetSize(spec, filepath);
      const diff = result.actualSizeMB - spec.targetSizeMB;
      const diffPercent = ((diff / spec.targetSizeMB) * 100).toFixed(1);

      results.push({
        filename,
        targetMB: spec.targetSizeMB,
        actualMB: result.actualSizeMB,
        diff,
      });

      const status = Math.abs(diff) < spec.targetSizeMB * 0.1 ? '✅' : '⚠️';
      console.log(
        `${status} ${result.actualSizeMB.toFixed(2)}MB (target: ${spec.targetSizeMB.toFixed(1)}MB, diff: ${diffPercent}%)`
      );
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log('-'.repeat(80));
  console.log('\n📊 Tổng kết:\n');

  const totalTargetMB = results.reduce((sum, r) => sum + r.targetMB, 0);
  const totalActualMB = results.reduce((sum, r) => sum + r.actualMB, 0);
  const avgDiff = results.reduce((sum, r) => sum + Math.abs(r.diff), 0) / results.length;

  console.log(`   📁 Tổng số files: ${results.length}`);
  console.log(`   📦 Tổng dung lượng target: ${totalTargetMB.toFixed(2)}MB`);
  console.log(`   📦 Tổng dung lượng thực tế: ${totalActualMB.toFixed(2)}MB`);
  console.log(`   📈 Độ lệch trung bình: ${avgDiff.toFixed(2)}MB`);
  console.log(`\n   📂 Files được lưu tại: ${outputDir}`);

  console.log('\n💡 Các file này có thể được dùng để test:');
  console.log('   - Upload limit validation (50MB)');
  console.log('   - Background job processing');
  console.log('   - Image optimization performance');
  console.log('   - Concurrent upload handling');

  console.log('\n' + '='.repeat(80));
}

if (require.main === module) {
  generateTestImages().catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  });
}

export { generateTestImages };
