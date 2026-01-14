#!/usr/bin/env tsx
/**
 * Upload & Image Optimization Performance Test
 *
 * Script này đo:
 * - Thời gian upload ảnh lên Cloudinary (dùng hàm `uploadImageToCloudinary`)
 * - Thời gian tải ảnh đã tối ưu (URL build từ `buildCloudinaryImageUrl`)
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 tsx scripts/test-upload-performance.ts
 *   IMAGE_PATH=public/assets/window.png UPLOADS=20 CONCURRENT=5 tsx scripts/test-upload-performance.ts
 */

import { performance } from 'perf_hooks';
import path from 'path';
import { readFile, readdir } from 'fs/promises';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { buildCloudinaryImageUrl } from '@/lib/media';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Cấu hình test (có thể override bằng env)
// Ưu tiên:
// 1. IMAGE_PATH (path tới file cụ thể)
// 2. IMAGE_DIR (thư mục chứa ảnh, mặc định: public/@test-images) và tự chọn file đầu tiên
const IMAGE_PATH_ENV = process.env.IMAGE_PATH;
const IMAGE_DIR_ENV =
  process.env.IMAGE_DIR || path.join('', 'test-images');
const TOTAL_UPLOADS = parseInt(process.env.UPLOADS || '10', 10);
const CONCURRENT_UPLOADS = Math.max(
  1,
  parseInt(process.env.CONCURRENT || '3', 10),
);

interface UploadResult {
  index: number;
  uploadTime: number;
  deliveryTime: number | null;
  status: 'success' | 'error';
  error?: string;
  bytes?: number | null;
}

function logSection(title: string) {
  const line = '='.repeat(80);
  console.log(`\n${line}`);
  console.log(title);
  console.log(line);
}

async function runSingleUpload(index: number, fileBuffer: Buffer): Promise<UploadResult> {
  try {
    const uploadStart = performance.now();

    const upload = await uploadImageToCloudinary(fileBuffer, {
      public_id: `perf-test-${Date.now()}-${index}`,
      folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'oly-portfolio-perf',
      overwrite: false,
      invalidate: false,
    });

    const uploadTime = performance.now() - uploadStart;

    let deliveryTime: number | null = null;
    let bytes: number | null | undefined = upload.bytes;

    try {
      const url = buildCloudinaryImageUrl({
        publicId: upload.public_id,
        version: upload.version?.toString(),
      });

      const deliveryStart = performance.now();
      const res = await fetch(url, {
        method: 'GET',
        // Cloudinary CDN sẽ cache, nên lần đầu thường chậm hơn
      });
      deliveryTime = performance.now() - deliveryStart;

      const contentLength = res.headers.get('content-length');
      if (contentLength) {
        bytes = parseInt(contentLength, 10);
      }
    } catch (err) {
      console.warn(`[Upload #${index}] Lỗi khi đo thời gian tải ảnh tối ưu:`, err);
    }

    return {
      index,
      uploadTime,
      deliveryTime,
      status: 'success',
      bytes: bytes ?? null,
    };
  } catch (error) {
    return {
      index,
      uploadTime: 0,
      deliveryTime: null,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      bytes: null,
    };
  }
}

async function runUploads(): Promise<UploadResult[]> {
  logSection('🚀 BẮT ĐẦU TEST HIỆU NĂNG UPLOAD ẢNH & TỐI ƯU ẢNH');
  console.log(`Base URL (chỉ để tham chiếu): ${BASE_URL}`);
  console.log(`Số lần upload: ${TOTAL_UPLOADS}`);
  console.log(`Số upload đồng thời: ${CONCURRENT_UPLOADS}`);

  // Xác định file ảnh test
  let resolvedImagePath: string;

  if (IMAGE_PATH_ENV) {
    // Nếu truyền IMAGE_PATH thì dùng trực tiếp (có thể là absolute hoặc relative)
    resolvedImagePath = path.isAbsolute(IMAGE_PATH_ENV)
      ? IMAGE_PATH_ENV
      : path.join(process.cwd(), IMAGE_PATH_ENV);
  } else {
    // Nếu không truyền IMAGE_PATH, lấy file đầu tiên trong IMAGE_DIR
    const dirPath = path.isAbsolute(IMAGE_DIR_ENV)
      ? IMAGE_DIR_ENV
      : path.join(process.cwd(), IMAGE_DIR_ENV);

    const entries = await readdir(dirPath, { withFileTypes: true });
    const firstFile = entries.find((e) => e.isFile());

    if (!firstFile) {
      throw new Error(
        `Không tìm thấy file nào trong thư mục test ảnh: ${dirPath}`,
      );
    }

    resolvedImagePath = path.join(dirPath, firstFile.name);
  }

  console.log(`Thư mục test ảnh: ${IMAGE_DIR_ENV}`);
  console.log(`File test đang dùng: ${resolvedImagePath}`);

  const fileBuffer = await readFile(resolvedImagePath);

  const results: UploadResult[] = [];
  let currentIndex = 0;

  async function worker(workerId: number) {
    while (true) {
      const index = currentIndex++;
      if (index >= TOTAL_UPLOADS) break;

      console.log(`[Worker ${workerId}] Upload #${index + 1}/${TOTAL_UPLOADS}...`);
      const result = await runSingleUpload(index, fileBuffer);
      results.push(result);
    }
  }

  const workers = Array.from({ length: CONCURRENT_UPLOADS }, (_, i) =>
    worker(i + 1),
  );

  await Promise.all(workers);

  return results.sort((a, b) => a.index - b.index);
}

function printSummary(results: UploadResult[]) {
  logSection('📊 KẾT QUẢ TEST HIỆU NĂNG');

  const success = results.filter((r) => r.status === 'success');
  const errors = results.filter((r) => r.status === 'error');

  console.log(`Tổng uploads: ${results.length}`);
  console.log(`Thành công: ${success.length}`);
  console.log(`Lỗi: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nChi tiết lỗi:');
    for (const err of errors) {
      console.log(
        `  #${err.index}: ${err.error ?? 'Unknown error'}`,
      );
    }
  }

  if (success.length === 0) {
    console.log('\nKhông có upload nào thành công, kiểm tra cấu hình Cloudinary (.env).');
    return;
  }

  const uploadTimes = success.map((r) => r.uploadTime);
  const deliveryTimes = success
    .map((r) => r.deliveryTime)
    .filter((t): t is number => t !== null);
  const byteSizes = success
    .map((r) => r.bytes)
    .filter((b): b is number => b !== null);

  const avg = (list: number[]) =>
    list.length === 0
      ? 0
      : list.reduce((a, b) => a + b, 0) / list.length;

  console.log('\n⏱ Upload lên Cloudinary:');
  console.log(`  Trung bình: ${avg(uploadTimes).toFixed(2)} ms`);
  console.log(
    `  Nhanh nhất / Chậm nhất: ${Math.min(...uploadTimes).toFixed(
      2,
    )} ms / ${Math.max(...uploadTimes).toFixed(2)} ms`,
  );

  if (deliveryTimes.length > 0) {
    console.log('\n🌐 Tải ảnh đã tối ưu (Cloudinary URL):');
    console.log(`  Trung bình: ${avg(deliveryTimes).toFixed(2)} ms`);
    console.log(
      `  Nhanh nhất / Chậm nhất: ${Math.min(
        ...deliveryTimes,
      ).toFixed(2)} ms / ${Math.max(
        ...deliveryTimes,
      ).toFixed(2)} ms`,
    );
  } else {
    console.log(
      '\nKhông đo được thời gian tải ảnh tối ưu (có thể do fetch lỗi hoặc mạng).',
    );
  }

  if (byteSizes.length > 0) {
    console.log('\n📦 Kích thước ảnh trả về (sau tối ưu Cloudinary):');
    console.log(
      `  Trung bình: ${(avg(byteSizes) / 1024).toFixed(2)} KB`,
    );
    console.log(
      `  Nhỏ nhất / Lớn nhất: ${(Math.min(...byteSizes) / 1024).toFixed(
        2,
      )} KB / ${(Math.max(...byteSizes) / 1024).toFixed(2)} KB`,
    );
  }

  console.log('\n✅ Hoàn thành test hiệu năng upload & tối ưu ảnh.');
}

async function main() {
  try {
    const results = await runUploads();
    printSummary(results);
  } catch (error) {
    console.error('❌ Lỗi khi chạy test upload performance:', error);
    process.exit(1);
  }
}

void main();

