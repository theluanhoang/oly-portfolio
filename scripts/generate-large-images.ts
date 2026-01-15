/**
 * Script tạo ảnh rất lớn (~50MB) để test tối ưu hóa ảnh.
 *
 * Chạy với:
 *   npm run test:image:large
 *
 * Script sẽ:
 *   - Tạo ảnh lớn cho nhiều định dạng (JPEG, PNG, WebP)
 *   - Lưu bản gốc vào ./public/test-large-images/original
 *   - Chạy optimizeImage và lưu bản tối ưu vào ./public/test-large-images/optimized
 *   - In ra kích thước file trước/sau để so sánh
 */

import { mkdir, writeFile, stat } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { optimizeImage } from '../lib/imageOptimization';

const OUTPUT_BASE_DIR = join(process.cwd(), 'public', 'test-large-images');
const ORIGINAL_DIR = join(OUTPUT_BASE_DIR, 'original');
const OPTIMIZED_DIR = join(OUTPUT_BASE_DIR, 'optimized');

interface LargeImageConfig {
  name: string;
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
}

const LARGE_IMAGES: LargeImageConfig[] = [
  {
    name: 'large-photo-like',
    width: 9000,
    height: 6000,
    format: 'jpeg',
  },
  {
    name: 'large-illustration',
    width: 8000,
    height: 8000,
    format: 'png',
  },
  {
    name: 'large-web-asset',
    width: 10000,
    height: 6000,
    format: 'webp',
  },
];

async function ensureDirs() {
  await mkdir(ORIGINAL_DIR, { recursive: true });
  await mkdir(OPTIMIZED_DIR, { recursive: true });
}

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(2)} ${sizes[i]}`;
}

async function createLargeImage(config: LargeImageConfig): Promise<Buffer> {
  // Dùng noise để file khó nén hơn -> kích thước lớn
  const base = sharp({
    create: {
      width: config.width,
      height: config.height,
      channels: 3,
      background: { r: 120, g: 70, b: 40 },
    },
  });

  let pipeline = base;

  if (config.format === 'jpeg') {
    pipeline = pipeline.jpeg({
      quality: 100,
      chromaSubsampling: '4:4:4', // ít mất mát hơn, file to hơn
      mozjpeg: false,
    });
  } else if (config.format === 'png') {
    pipeline = pipeline.png({
      compressionLevel: 0, // ít nén, file to hơn
      palette: false,
    });
  } else if (config.format === 'webp') {
    pipeline = pipeline.webp({
      quality: 100,
      lossless: false,
    });
  }

  return pipeline.toBuffer();
}

async function generateAndOptimizeOne(config: LargeImageConfig) {
  console.log(`\n=== ${config.name} (${config.format.toUpperCase()}) ===`);
  console.log(`Kích thước ảnh: ${config.width} x ${config.height}`);

  const originalBuffer = await createLargeImage(config);

  const originalExt =
    config.format === 'jpeg'
      ? 'jpg'
      : config.format === 'png'
      ? 'png'
      : 'webp';

  const originalPath = join(ORIGINAL_DIR, `${config.name}.${originalExt}`);
  await writeFile(originalPath, originalBuffer);

  const origStats = await stat(originalPath);
  console.log(`File gốc:     ${originalPath}`);
  console.log(`Kích thước gốc: ${formatBytes(origStats.size)} (~${(origStats.size / (1024 * 1024)).toFixed(1)} MB)`);

  // Chạy tối ưu hóa với config giống production
  const optimizedBuffer = await optimizeImage(originalBuffer, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 80,
  });

  const optimizedPath = join(OPTIMIZED_DIR, `${config.name}-optimized.${originalExt}`);
  await writeFile(optimizedPath, optimizedBuffer);

  const optStats = await stat(optimizedPath);
  console.log(`File tối ưu:  ${optimizedPath}`);
  console.log(`Kích thước mới: ${formatBytes(optStats.size)} (~${(optStats.size / (1024 * 1024)).toFixed(1)} MB)`);

  const ratio = (optStats.size / origStats.size) * 100;
  console.log(`Giảm dung lượng: ~${(100 - ratio).toFixed(1)}%`);
}

async function run() {
  console.log('🖼️  Tạo ảnh rất lớn để test tối ưu hóa\n');
  console.log('Output directory:', OUTPUT_BASE_DIR);
  console.log('Có thể mất một chút thời gian và RAM do kích thước ảnh rất lớn.');

  await ensureDirs();

  for (const cfg of LARGE_IMAGES) {
    await generateAndOptimizeOne(cfg);
  }

  console.log('\nHoàn tất. Hãy mở thư mục:');
  console.log(`- Gốc:      ${ORIGINAL_DIR}`);
  console.log(`- Đã tối ưu: ${OPTIMIZED_DIR}`);
}

if (require.main === module) {
  run().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

