# Docker Setup Guide

Hướng dẫn sử dụng Docker cho dự án Oly Studio Portfolio TypeScript.

## Yêu cầu

- Docker và Docker Compose đã được cài đặt
- Node.js 20+ (nếu chạy local không dùng Docker)

## Cấu hình

### 1. Tạo file `.env`

Tạo file `.env` ở thư mục gốc với nội dung:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=oly_portfolio
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# Database URL (for Prisma)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/oly_portfolio?schema=public

# Application Configuration
APP_PORT=3000
NODE_ENV=development
```

**Lưu ý**: Khi chạy trong Docker, `POSTGRES_HOST` phải là `postgres` (tên service trong docker-compose.yml), không phải `localhost`.

## Sử dụng

### Development Mode

Chạy tất cả services (PostgreSQL + Next.js):

```bash
docker-compose up
```

Hoặc chạy ở background:

```bash
docker-compose up -d
```

Xem logs:

```bash
docker-compose logs -f app
```

Dừng services:

```bash
docker-compose down
```

Dừng và xóa volumes (xóa dữ liệu database):

```bash
docker-compose down -v
```

### Chạy migrations

Sau khi services đã chạy, migrations sẽ tự động chạy. Nếu cần chạy thủ công:

```bash
docker-compose exec app npx prisma migrate dev
```

### Seed database

```bash
docker-compose exec app npx prisma db seed
```

### Prisma Studio

Mở Prisma Studio để xem và quản lý dữ liệu:

```bash
docker-compose exec app npx prisma studio
```

Sau đó truy cập: http://localhost:5555

### Production Build

Để build production image:

```bash
docker build -t oly-portfolio-ts:latest .
```

Chạy production container:

```bash
docker run -p 3000:3000 --env-file .env oly-portfolio-ts:latest
```

## Services

### PostgreSQL

- **Port**: 5432 (mặc định, có thể thay đổi trong `.env`)
- **Database**: `oly_portfolio` (mặc định)
- **User**: `postgres` (mặc định)
- **Password**: `postgres` (mặc định - **nên thay đổi trong production**)

### Next.js App

- **Port**: 3000 (mặc định, có thể thay đổi trong `.env`)
- **URL**: http://localhost:3000

## Troubleshooting

### Lỗi kết nối database

Nếu gặp lỗi kết nối database, kiểm tra:

1. PostgreSQL service đã chạy: `docker-compose ps`
2. DATABASE_URL trong `.env` đúng với cấu hình
3. Đợi PostgreSQL sẵn sàng (có healthcheck)

### Reset database

```bash
docker-compose down -v
docker-compose up -d
```

### Xem logs

```bash
# Tất cả logs
docker-compose logs

# Logs của app
docker-compose logs app

# Logs của postgres
docker-compose logs postgres

# Follow logs
docker-compose logs -f app
```

### Rebuild containers

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Volumes

- `postgres_data`: Lưu trữ dữ liệu PostgreSQL
- Mount volumes cho development: code được sync real-time

## Networks

Tất cả services chạy trong network `oly-network` để có thể giao tiếp với nhau.

