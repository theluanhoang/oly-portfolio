# Domain Configuration Guide

Hướng dẫn cấu hình tên miền `olystudio.vn` cho dự án.

## 🌐 Tên miền đã được cấu hình

Dự án đã được cấu hình để sử dụng tên miền: **olystudio.vn**

## 📋 Các file đã được cập nhật

1. **`docker/nginx/nginx.conf`**: Đã cấu hình `server_name olystudio.vn www.olystudio.vn`
2. **`docker/nginx/nginx-ssl.conf.example`**: Đã cập nhật ví dụ SSL config với tên miền mới
3. **`deploy/README.md`**: Đã cập nhật ví dụ về tên miền trong hướng dẫn deploy

## 🔧 Cấu hình Environment Variables

Khi deploy production, cần cấu hình các biến môi trường sau:

### Trong file `.env` hoặc GitHub Secrets:

```env
# Base URL cho ứng dụng
NEXT_PUBLIC_BASE_URL=https://olystudio.vn
NEXT_PUBLIC_APP_URL=https://olystudio.vn

# NextAuth URL (nếu sử dụng NextAuth)
NEXTAUTH_URL=https://olystudio.vn

# HTTPS Configuration
NEXT_PUBLIC_HTTPS=true
```

### Email Configuration

Các email được gửi từ ứng dụng sẽ sử dụng domain mặc định:

```env
FROM_EMAIL=noreply@olystudio.vn
FROM_NAME=Oly Studio
```

## 🔒 Cấu hình SSL/HTTPS

### Sử dụng Let's Encrypt (Khuyến nghị)

1. Copy file cấu hình SSL:
   ```bash
   cp docker/nginx/nginx-ssl.conf.example docker/nginx/nginx.conf
   ```

2. Cài đặt Certbot:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   ```

3. Lấy SSL certificate:
   ```bash
   sudo certbot --nginx -d olystudio.vn -d www.olystudio.vn
   ```

4. Certbot sẽ tự động cấu hình nginx và renew certificate.

### Sử dụng AWS Certificate Manager (Nếu deploy trên AWS)

1. Tạo certificate trong AWS Certificate Manager
2. Cấu hình Load Balancer với certificate
3. Update nginx config để sử dụng certificate từ AWS

## 🌍 DNS Configuration

Đảm bảo DNS records được cấu hình đúng:

### A Record
```
olystudio.vn → [IP của server]
```

### CNAME Record (nếu muốn hỗ trợ www)
```
www.olystudio.vn → olystudio.vn
```

### Hoặc A Record cho www
```
www.olystudio.vn → [IP của server]
```

## 🚀 Deploy với tên miền mới

1. **Cấu hình DNS**: Trỏ domain về IP server
2. **Cập nhật GitHub Secrets**: Thêm `NEXT_PUBLIC_BASE_URL=https://olystudio.vn`
3. **Deploy**: Push code lên branch `prod`
4. **Cấu hình SSL**: Sau khi deploy, cấu hình SSL certificate

## ✅ Kiểm tra sau khi deploy

```bash
# Kiểm tra HTTP
curl http://olystudio.vn/api/health

# Kiểm tra HTTPS (sau khi cấu hình SSL)
curl https://olystudio.vn/api/health

# Kiểm tra redirect www
curl -I http://www.olystudio.vn
```

## 📝 Lưu ý

- Đảm bảo firewall cho phép port 80 (HTTP) và 443 (HTTPS)
- Sau khi cấu hình SSL, nên redirect HTTP sang HTTPS
- Kiểm tra email links hoạt động đúng với domain mới
- Cập nhật các service bên ngoài (nếu có) với domain mới
