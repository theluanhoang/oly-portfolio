/**
 * Script so sánh chất lượng ảnh ở các mức quality khác nhau
 * Tạo ảnh test và so sánh WebP với các quality levels
 * 
 * Chạy: npm run test:image:quality
 */

import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { optimizeImage } from '../lib/imageOptimization';

async function createTestImage(): Promise<Buffer> {
  // Tạo ảnh test với nhiều chi tiết để dễ thấy sự khác biệt
  const width = 3000;
  const height = 2000;
  
  // Tạo ảnh với gradient, text patterns, và sharp edges
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
          <stop offset="50%" style="stop-color:rgb(0,255,0);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
        </linearGradient>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="black" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad1)"/>
      <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3"/>
      <circle cx="1500" cy="1000" r="400" fill="white" opacity="0.8"/>
      <text x="1500" y="1000" font-size="200" text-anchor="middle" fill="black" font-family="Arial" font-weight="bold">TEST</text>
      <rect x="500" y="500" width="2000" height="1000" fill="none" stroke="black" stroke-width="10"/>
    </svg>
  `;
  
  return await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

async function compareQuality() {
  console.log('🖼️  So sánh chất lượng ảnh WebP ở các mức quality khác nhau\n');
  console.log('='.repeat(80));
  
  const outputDir = join(process.cwd(), 'public', 'test-quality-comparison');
  await mkdir(outputDir, { recursive: true });
  
  // Tạo ảnh test
  console.log('\n📸 Tạo ảnh test (3000x2000px với nhiều chi tiết)...');
  const testImage = await createTestImage();
  const originalSize = testImage.length;
  console.log(`✅ Ảnh test: ${(originalSize / 1024 / 1024).toFixed(2)} MB\n`);
  
  // Test các quality levels
  const qualityLevels = [70, 75, 80, 85, 90, 95];
  const results: Array<{
    quality: number;
    size: number;
    sizeKB: string;
    reduction: string;
  }> = [];
  
  console.log('🔍 So sánh các mức quality:\n');
  console.log('-'.repeat(80));
  
  for (const quality of qualityLevels) {
    const optimized = await optimizeImage(testImage, {
      maxWidth: 1920,
      maxHeight: 1920,
      quality,
      convertToWebP: true,
    });
    
    const size = optimized.length;
    const sizeKB = (size / 1024).toFixed(2);
    const reduction = ((1 - size / originalSize) * 100).toFixed(1);
    
    results.push({ quality, size, sizeKB, reduction });
    
    // Lưu file để bạn có thể mở và so sánh
    const filename = `quality-${quality}.webp`;
    const filepath = join(outputDir, filename);
    await writeFile(filepath, optimized);
    
    console.log(
      `Quality ${quality}: ${sizeKB.padStart(8)} KB (giảm ${reduction.padStart(6)}%) → ${filename}`
    );
  }
  
  console.log('-'.repeat(80));
  
  // So sánh với PNG gốc (sau resize)
  console.log('\n📊 So sánh với PNG (không convert):');
  const pngOptimized = await optimizeImage(testImage, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 80,
    convertToWebP: false,
  });
  const pngSize = pngOptimized.length;
  const pngSizeKB = (pngSize / 1024).toFixed(2);
  const pngFilepath = join(outputDir, 'png-optimized.png');
  await writeFile(pngFilepath, pngOptimized);
  console.log(`PNG (optimized): ${pngSizeKB.padStart(8)} KB → png-optimized.png`);
  
  // So sánh với JPEG
  const jpegOptimized = await optimizeImage(testImage, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 80,
    convertToWebP: false,
  });
  // Force JPEG format
  const jpegBuffer = await sharp(jpegOptimized)
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  const jpegSize = jpegBuffer.length;
  const jpegSizeKB = (jpegSize / 1024).toFixed(2);
  const jpegFilepath = join(outputDir, 'jpeg-optimized.jpg');
  await writeFile(jpegFilepath, jpegBuffer);
  console.log(`JPEG (optimized): ${jpegSizeKB.padStart(8)} KB → jpeg-optimized.jpg`);
  
  // Tìm quality level tốt nhất (balance giữa size và quality)
  const quality80 = results.find(r => r.quality === 80);
  if (quality80) {
    console.log('\n💡 Kết luận:');
    console.log(`   Quality 80 (hiện tại): ${quality80.sizeKB} KB`);
    console.log(`   - So với PNG: nhỏ hơn ~${((1 - quality80.size / pngSize) * 100).toFixed(1)}%`);
    console.log(`   - So với JPEG: nhỏ hơn ~${((1 - quality80.size / jpegSize) * 100).toFixed(1)}%`);
    console.log(`   - Chất lượng: Rất tốt, khó phân biệt với gốc ở kích thước hiển thị bình thường`);
  }
  
  console.log('\n📁 Các file đã được lưu tại:');
  console.log(`   ${outputDir}`);
  console.log('\n💡 Hãy mở các file và so sánh bằng mắt để đánh giá chất lượng!');
  console.log('   - Quality 70-75: Có thể thấy một chút khác biệt nếu zoom 100%');
  console.log('   - Quality 80-85: Rất nét, khó phân biệt với gốc');
  console.log('   - Quality 90-95: Gần như không phân biệt được, nhưng file lớn hơn');
  console.log('\n' + '='.repeat(80));
}

if (require.main === module) {
  compareQuality().catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  });
}

export { compareQuality };
