# DDoS Test Script

Script test DDoS mạnh mẽ để kiểm tra rate limiting cho tất cả API endpoints trong dự án.

## Mục đích

Script này được thiết kế để:
- ✅ Test rate limiting có hoạt động đúng không
- ✅ Phát hiện các lỗ hổng bảo mật
- ✅ Đảm bảo hệ thống an toàn trước khi deploy production
- ✅ Test với nhiều loại attacks: burst, sustained, concurrent

## Cách sử dụng

### 1. Test cơ bản (Light Test)
```bash
npm run test:ddos:light
```
- 20 requests đồng thời
- 100 requests mỗi endpoint
- 20 requests trong burst attack

### 2. Test mặc định (Medium Test)
```bash
npm run test:ddos
```
- 100 requests đồng thời
- 500 requests mỗi endpoint
- 50 requests trong burst attack

### 3. Test mạnh tay (Heavy Test)
```bash
npm run test:ddos:heavy
```
- 200 requests đồng thời
- 1000 requests mỗi endpoint
- 100 requests trong burst attack

### 4. Custom test
```bash
BASE_URL=http://localhost:3000 \
CONCURRENT=150 \
TOTAL=800 \
BURST=75 \
tsx scripts/test-ddos.ts
```

## Environment Variables

- `BASE_URL`: URL của server (mặc định: `http://localhost:3000`)
- `CONCURRENT`: Số requests đồng thời (mặc định: `100`)
- `TOTAL`: Tổng số requests mỗi endpoint (mặc định: `500`)
- `BURST`: Số requests trong burst attack (mặc định: `50`)
- `BURST_DELAY`: Delay giữa các burst attacks (ms, mặc định: `100`)

## Các loại test được thực hiện

### Phase 1: Normal Load Test
- Test tất cả endpoints với concurrent requests
- Kiểm tra rate limiting có hoạt động không
- Đo response time và error rate

### Phase 2: Burst Attack Test
- Gửi nhiều requests đồng thời trong thời gian ngắn
- Test các endpoints quan trọng (auth, contact, admin)
- Kiểm tra burst limit có hoạt động không

### Phase 3: Sustained Attack Test
- Gửi requests liên tục trong thời gian dài
- Test các endpoints nhạy cảm
- Kiểm tra rate limiting có duy trì được không

## Kết quả mong đợi

### ✅ Rate Limiting hoạt động tốt:
- **GET requests**: ~300 requests/phút được phép, sau đó bị rate limit
- **POST/PUT/DELETE**: ~100 requests/phút được phép, sau đó bị rate limit
- **Auth endpoints**: ~30 requests/phút được phép, sau đó bị rate limit
- **Burst limit**: 20-50 requests trong 10 giây đầu bị block ngay

### ⚠️ Cảnh báo nếu:
- Tỷ lệ rate limited < 20%: Rate limiting có thể không hoạt động đúng
- Tỷ lệ rate limited > 80%: Có thể quá nghiêm ngặt (kiểm tra config)
- Error rate cao: Server có thể bị quá tải hoặc có lỗi

## Endpoints được test

### Public Endpoints
- `GET /api/health`
- `GET /api/products`
- `GET /api/projects`
- `GET /api/products/[slug]`
- `GET /api/projects/[slug]`

### Auth Endpoints
- `POST /api/auth/[...nextauth]` (Login)
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Contact
- `POST /api/contact`

### Admin Endpoints (sẽ fail auth nhưng vẫn test rate limit)
- `POST /api/admin/change-password`
- `GET /api/admin/translations`
- `POST /api/admin/translations`
- `GET /api/admin/translations/export`
- `POST /api/admin/translations/import`
- `POST /api/admin/translations/sync`

### Products/Projects
- `POST /api/products/save`
- `POST /api/projects/save`
- `POST /api/projects/reorder`

## Lưu ý

⚠️ **QUAN TRỌNG**: 
- Chỉ chạy test này trên môi trường development/staging
- KHÔNG chạy trên production server đang phục vụ users thật
- Test này sẽ tạo rất nhiều requests và có thể làm server quá tải
- Đảm bảo server có đủ resources trước khi chạy test

## Troubleshooting

### Server không phản hồi
- Giảm `CONCURRENT` và `TOTAL`
- Kiểm tra server logs
- Đảm bảo server có đủ memory/CPU

### Rate limiting không hoạt động
- Kiểm tra middleware có được load không
- Kiểm tra logs của rate limiting
- Verify config trong `lib/rateLimit.ts`

### Test chạy quá lâu
- Giảm `TOTAL` requests
- Giảm số endpoints được test
- Tăng `BURST_DELAY`

## Output Example

```
🚀 Starting DDoS Test Suite
Base URL: http://localhost:3000
Configuration:
  - Concurrent requests: 100
  - Total requests per endpoint: 500
  - Burst size: 50
  - Total endpoints to test: 20

================================================================================
PHASE 1: NORMAL LOAD TEST
================================================================================

Testing: GET /api/health
Total requests: 500, Concurrent: 100, Batches: 5
Batch 1/5: 100 requests, 0 rate limited, 0 errors
...

================================================================================
TEST RESULTS SUMMARY
================================================================================

[1] GET /api/health
  Total Requests: 500
  Success: 500 (100.0%)
  Rate Limited: 0 (0.0%)
  Errors: 0 (0.0%)
  Avg Response Time: 12.34ms

...

================================================================================
SECURITY ASSESSMENT
================================================================================

✅ Rate limiting is WORKING EFFECTIVELY
   65.3% of requests were rate limited
```

## Kết luận

Sau khi chạy test, bạn sẽ biết:
1. Rate limiting có hoạt động đúng không
2. Các endpoints nào cần điều chỉnh
3. Hệ thống có sẵn sàng cho production không

Nếu rate limiting hoạt động tốt (>50% requests bị rate limit), hệ thống đã an toàn cho production! 🎉

