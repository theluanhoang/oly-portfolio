# Image Optimization Testing Guide

Hướng dẫn test và đánh giá hiệu năng image optimization theo best practices của các công ty lớn.

## 📋 Mục tiêu Testing

1. **Performance Metrics**: Thời gian xử lý, throughput
2. **Quality Metrics**: Chất lượng ảnh sau optimization
3. **Size Reduction**: Tỷ lệ giảm kích thước file
4. **Load Testing**: Khả năng xử lý concurrent requests
5. **Production Readiness**: Đánh giá sẵn sàng cho production

## 🧪 Test Scripts

### 1. Image Optimization Benchmark

Test hiệu năng xử lý ảnh đơn lẻ:

```bash
# Test với 1 ảnh
npm run test:image:optimization ./test-images/photo.jpg

# Test với nhiều ảnh (concurrent processing)
tsx scripts/test-image-optimization.ts ./test-images/photo.jpg 3
```

**Metrics được đo:**
- Processing time (ms)
- Size reduction (%)
- Throughput (images/second)
- Success rate

**Benchmarks (Industry Standards):**
- ✅ Processing time < 500ms: Excellent
- ✅ Throughput > 5 img/s: Excellent
- ✅ Size reduction > 30%: Excellent

### 2. Load Testing

Test API upload dưới tải:

```bash
# Light load test
npm run test:image:load:light

# Heavy load test
npm run test:image:load:heavy

# Custom test
BASE_URL=http://localhost:3000 CONCURRENT=10 TOTAL=100 \
  tsx scripts/test-image-upload-load.ts ./test-images/photo.jpg
```

**Metrics được đo:**
- Response time (avg, min, max, P50, P95, P99)
- Throughput (requests/second)
- Error rate (%)
- Success rate

**Production Benchmarks:**
- ✅ Average response time < 1000ms
- ✅ P95 response time < 2000ms
- ✅ Error rate < 1%
- ✅ Throughput > 10 req/s

## 📊 Test Cases

### Test Case 1: Single Image Optimization

**Mục đích**: Đảm bảo mỗi ảnh được optimize đúng cách

**Test images cần có:**
- JPEG lớn (4000x3000px, ~5MB)
- PNG có transparency (2000x2000px, ~500KB)
- PNG không transparency (3000x2000px, ~2MB)
- WebP đã optimize (1600x1200px, ~200KB)
- GIF animated (nếu có)

**Kỳ vọng:**
- JPEG → WebP: giảm 30-50%
- PNG (transparency) → WebP: giảm 20-40%
- PNG (no transparency) → WebP: giảm 40-60%
- WebP → WebP: giảm 0-5% (đã optimize)
- Processing time < 500ms mỗi ảnh

### Test Case 2: Concurrent Processing

**Mục đích**: Test khả năng xử lý nhiều ảnh đồng thời

```bash
# Test với 10 ảnh, 3 concurrent
tsx scripts/test-image-optimization.ts ./test-images/*.jpg 3
```

**Kỳ vọng:**
- Tất cả ảnh được xử lý thành công
- Throughput > 5 images/second
- Không có memory leak
- Error rate = 0%

### Test Case 3: Load Testing

**Mục đích**: Test API dưới tải cao

```bash
npm run test:image:load:heavy
```

**Kỳ vọng:**
- P95 response time < 2000ms
- Error rate < 1%
- Server không crash
- Memory usage ổn định

### Test Case 4: Edge Cases

**Test các trường hợp đặc biệt:**
- Ảnh quá lớn (> 10MB)
- Ảnh có dimensions quá lớn (> 5000px)
- Ảnh corrupted
- Ảnh không phải image format
- Empty file

**Kỳ vọng:**
- Tất cả edge cases được handle đúng
- Error messages rõ ràng
- Không crash server

## 🎯 Production Readiness Checklist

Trước khi deploy lên production, đảm bảo:

- [ ] **Performance**
  - [ ] Average processing time < 1000ms
  - [ ] P95 response time < 2000ms
  - [ ] Throughput > 5 images/second
  - [ ] Memory usage ổn định (không leak)

- [ ] **Quality**
  - [ ] Average size reduction > 25%
  - [ ] Không có ảnh bị tăng size (trừ edge cases)
  - [ ] Transparency được preserve đúng
  - [ ] Chất lượng ảnh acceptable

- [ ] **Reliability**
  - [ ] Error rate < 1%
  - [ ] Có fallback khi Sharp fail
  - [ ] Có proper error handling
  - [ ] Có logging đầy đủ

- [ ] **Security**
  - [ ] File size validation
  - [ ] File type validation
  - [ ] Dimensions validation
  - [ ] Authentication required

- [ ] **Monitoring**
  - [ ] Có metrics logging
  - [ ] Có error tracking
  - [ ] Có performance monitoring

## 📈 Monitoring trong Production

### Metrics cần track:

1. **Processing Time**
   - Average, P50, P95, P99
   - Track theo format (JPEG, PNG, WebP)

2. **Size Reduction**
   - Average reduction %
   - Track theo format

3. **Error Rate**
   - Total errors
   - Errors by type

4. **Throughput**
   - Requests per second
   - Images processed per second

5. **Resource Usage**
   - CPU usage
   - Memory usage
   - Disk I/O

### Logging Format:

```typescript
{
  timestamp: "2024-01-01T00:00:00Z",
  filename: "photo.jpg",
  originalSize: 5242880,
  optimizedSize: 3145728,
  reductionPercent: 40.0,
  processingTime: 342,
  format: "webp",
  success: true
}
```

## 🔧 Tuning Performance

Nếu performance không đạt benchmark:

1. **Giảm quality** (nếu size reduction thấp)
   - WebP quality: 82 → 80
   - JPEG quality: 82 → 80

2. **Tăng concurrent processing** (nếu throughput thấp)
   - Sử dụng worker threads
   - Queue system (Bull, Agenda)

3. **Cache optimization** (nếu response time cao)
   - Cache processed images
   - CDN integration

4. **Resource optimization**
   - Tăng memory limit
   - Optimize Sharp settings

## 📚 References

- [Sharp Performance](https://sharp.pixelplumbing.com/performance)
- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Image Optimization Best Practices](https://developers.google.com/speed/docs/insights/OptimizeImages)



