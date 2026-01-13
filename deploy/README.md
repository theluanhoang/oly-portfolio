# CI/CD Deployment Guide

Hướng dẫn thiết lập CI/CD với GitHub Actions để deploy lên EC2 AWS cho production.

## 📋 Yêu cầu

1. EC2 instance đã được tạo và cấu hình
2. SSH key pair cho EC2
3. GitHub repository với quyền truy cập Actions

## 🚀 Bước 1: Setup EC2 Instance

### 1.1. Chạy setup script trên EC2

```bash
# SSH vào EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone repository hoặc upload setup script
# Chạy setup script
chmod +x deploy/ec2-setup.sh
./deploy/ec2-setup.sh
```

Script sẽ tự động:
- Cài đặt Docker và Docker Compose
- Cấu hình firewall
- Tạo thư mục app

### 1.2. Cấu hình Security Group

Đảm bảo Security Group của EC2 cho phép:
- **Port 22 (SSH)** - từ IP của bạn hoặc GitHub Actions IPs
- **Port 80 (HTTP)** - từ mọi nơi (0.0.0.0/0)
- **Port 443 (HTTPS)** - từ mọi nơi (nếu dùng SSL)

**Lưu ý**: Để bảo mật hơn, chỉ cho phép SSH từ IP cụ thể của bạn.

### 1.3. Environment Variables

**Không cần tạo .env file thủ công!** Workflow sẽ tự động tạo từ GitHub Secrets khi deploy.

Chỉ cần cấu hình các GitHub Secrets (xem Bước 2).

## 🔐 Bước 2: Cấu hình GitHub Secrets

Vào **GitHub Repository → Settings → Secrets and variables → Actions → New repository secret**

### 2.1. Secrets cho EC2 Connection

| Secret Name | Description | Example | Required |
|------------|-------------|---------|----------|
| `EC2_HOST` | EC2 Public IP hoặc Domain | `54.123.45.67` hoặc `olystudio.vn` | ✅ Yes |
| `EC2_USER` | EC2 Username | `ubuntu` (cho Ubuntu) hoặc `ec2-user` (cho Amazon Linux) | ✅ Yes |
| `EC2_SSH_KEY` | Private SSH Key | Nội dung file `.pem` key | ✅ Yes |
| `EC2_SSH_PORT` | SSH Port | `22` (default) | ❌ No |

### 2.2. Secrets cho Environment Variables

| Secret Name | Description | Example | Required |
|------------|-------------|---------|----------|
| `POSTGRES_USER` | Database username | `postgres` | ❌ No (default: postgres) |
| `POSTGRES_PASSWORD` | Database password | `your_secure_password` | ✅ Yes |
| `POSTGRES_DB` | Database name | `oly_portfolio` | ❌ No (default: oly_portfolio) |
| `POSTGRES_PORT` | Database port | `5432` | ❌ No (default: 5432) |
| `NEXTAUTH_SECRET` | NextAuth secret key | Generate với `openssl rand -base64 32` | ✅ Yes |
| `ADMIN_USERNAME` | Admin username | `admin` | ✅ Yes |
| `ADMIN_PASSWORD` | Admin password | `your_secure_password` | ✅ Yes |
| `NGINX_PORT` | Nginx port | `80` | ❌ No (default: 80) |
| `NEXT_PUBLIC_APP_URL` | Public app URL (optional) | `https://olystudio.vn` | ❌ No |
| `NEXT_PUBLIC_BASE_URL` | Base URL cho email links | `https://olystudio.vn` | ❌ No |

### 2.3. Tạo SSH Key cho GitHub Actions

**Cách 1: Tạo SSH key mới (Khuyến nghị)**

```bash
# Tạo SSH key pair (không đặt passphrase để GitHub Actions có thể dùng)
ssh-keygen -t rsa -b 4096 -C "github-actions" -f github-actions-key -N ""

# Copy public key vào EC2
ssh-copy-id -i github-actions-key.pub ubuntu@your-ec2-ip

# Hoặc thêm public key vào ~/.ssh/authorized_keys trên EC2
cat github-actions-key.pub | ssh ubuntu@your-ec2-ip "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

**Cách 2: Sử dụng EC2 key pair hiện có (Khuyến nghị)**

Nếu bạn đã có EC2 key pair (file `.pem`) từ AWS, có thể dùng trực tiếp:

```bash
# Xem nội dung file .pem (EC2 key pair)
cat your-ec2-key.pem

# Hoặc nếu file có tên khác
cat ~/.ssh/your-key-name.pem
```

**Lưu ý về EC2 key pair:**
- EC2 key pair thường là RSA format: `-----BEGIN RSA PRIVATE KEY-----`
- Hoặc có thể là OpenSSH format: `-----BEGIN OPENSSH PRIVATE KEY-----`
- Cả 2 format đều được hỗ trợ

### 2.4. Thêm EC2 Key Pair vào GitHub Secrets

**QUAN TRỌNG**: Khi copy EC2 key pair vào GitHub Secret, phải bao gồm **TOÀN BỘ** nội dung:

```bash
# Copy TOÀN BỘ nội dung file .pem (bao gồm header và footer)
cat your-ec2-key.pem
```

**Format đúng của EC2 key pair trong GitHub Secret:**

**RSA format (phổ biến nhất):**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
... (nhiều dòng base64) ...
-----END RSA PRIVATE KEY-----
```

**OpenSSH format:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
... (nhiều dòng base64) ...
-----END OPENSSH PRIVATE KEY-----
```

**⚠️ LƯU Ý QUAN TRỌNG:**
1. Phải copy **TOÀN BỘ** từ `-----BEGIN` đến `-----END`
2. Không được thiếu bất kỳ dòng nào
3. Giữ nguyên format (không thêm/xóa spaces)
4. Mỗi dòng base64 phải được giữ nguyên

**Các bước:**

1. Copy **TOÀN BỘ** nội dung private key (bao gồm `-----BEGIN...` và `-----END...`)
2. Vào GitHub → Repository → Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `EC2_SSH_KEY`
5. Value: Paste **TOÀN BỘ** nội dung private key
6. Click "Add secret"

**Kiểm tra SSH key:**

```bash
# Test SSH connection từ local
ssh -i github-actions-key ubuntu@your-ec2-ip

# Nếu connect được, SSH key đã đúng
```

### 2.5. Lưu ý cho Amazon Linux 2023 (EC2)

- OS dùng `yum`/`dnf`.
- Docker engine: `sudo yum install -y docker` và `sudo systemctl enable --now docker`.
- Docker Compose:
  - Thử plugin: `sudo yum install -y docker-compose-plugin` (có thể không sẵn trong repo).
  - Nếu không có plugin, cài binary Compose vào đường dẫn plugin:
    ```bash
    sudo mkdir -p /usr/libexec/docker/cli-plugins
    COMPOSE_URL="https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)"
    sudo curl -fL --retry 3 --retry-delay 2 "$COMPOSE_URL" -o /usr/libexec/docker/cli-plugins/docker-compose
    sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose
    ```
  - Nếu vẫn chưa chạy được, fallback binary standalone:
    ```bash
    sudo curl -fL --retry 3 --retry-delay 2 "$COMPOSE_URL" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    ```
  - Kiểm tra: `docker compose version` hoặc `docker-compose version`.

### 2.5. Generate NEXTAUTH_SECRET

```bash
# Generate secret key
openssl rand -base64 32

# Copy và paste vào GitHub Secret: NEXTAUTH_SECRET
```

## 🔄 Bước 3: Workflow Files

Workflow files đã được tạo trong `.github/workflows/`:

- **`ci.yml`**: Chạy lint và test trên mỗi PR và push vào branch `prod`
- **`deploy-production.yml`**: Deploy lên EC2 khi push vào branch `prod`

### Workflow tự động làm gì:

1. ✅ Checkout code từ branch `prod`
2. ✅ Build và push Docker image lên Docker Hub
3. ✅ Tạo `.env` file từ GitHub Secrets
4. ✅ Copy files lên EC2 qua rsync (bao gồm cả script cleanup)
5. ✅ Pull và start containers với Docker Compose
6. ✅ Health check để đảm bảo app hoạt động
7. ✅ **Tự động cleanup old images** - giữ lại N images mới nhất (default: 3)

## 📝 Bước 4: Deploy

### 4.1. Manual Deploy

Vào **GitHub → Actions → "Deploy to Production (EC2)" → Run workflow**

### 4.2. Automatic Deploy

Push code vào branch `prod`:

```bash
# Tạo branch prod nếu chưa có
git checkout -b prod

# Hoặc checkout branch prod nếu đã có
git checkout prod

# Merge code từ branch khác (nếu cần)
git merge main

# Push để trigger deployment
git push origin prod
```

GitHub Actions sẽ tự động:
1. Build Docker images
2. Copy files lên EC2
3. Tạo `.env` từ secrets và copy lên EC2
4. Restart containers
5. Health check

## 🔍 Monitoring

### Xem logs trên EC2

```bash
# SSH vào EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Xem container logs
cd /home/ubuntu/app
sudo docker compose -f docker-compose.prod.yml logs -f

# Xem logs của từng service
sudo docker compose -f docker-compose.prod.yml logs -f app
sudo docker compose -f docker-compose.prod.yml logs -f postgres
sudo docker compose -f docker-compose.prod.yml logs -f nginx
```

### Xem deployment status

Vào **GitHub → Actions** để xem trạng thái deployment

### Kiểm tra containers

```bash
# Xem trạng thái containers
sudo docker compose -f docker-compose.prod.yml ps

# Xem resource usage
sudo docker stats
```

## 🛠️ Troubleshooting

### Deployment fails

1. **Kiểm tra GitHub Actions logs**:
   - Vào GitHub → Actions → Click vào workflow run
   - Xem logs từng step để tìm lỗi

2. **SSH vào EC2 và kiểm tra**:
   ```bash
   cd /home/ubuntu/app
   sudo docker compose -f docker-compose.prod.yml ps
   sudo docker compose -f docker-compose.prod.yml logs
   ```

3. **Kiểm tra .env file**:
   ```bash
   cat .env
   # Đảm bảo tất cả variables đã được set
   ```

### Health check fails

1. **Kiểm tra containers có đang chạy không**:
   ```bash
   sudo docker compose -f docker-compose.prod.yml ps
   ```

2. **Kiểm tra health endpoint**:
   ```bash
   curl http://localhost/api/health
   ```

3. **Kiểm tra logs**:
   ```bash
   sudo docker compose -f docker-compose.prod.yml logs app
   ```

### Permission denied

```bash
# Thêm user vào docker group
sudo usermod -aG docker $USER
newgrp docker

# Hoặc dùng sudo cho docker commands
sudo docker compose ...
```

### Database connection fails

1. **Kiểm tra database container**:
   ```bash
   sudo docker compose -f docker-compose.prod.yml ps postgres
   sudo docker compose -f docker-compose.prod.yml logs postgres
   ```

2. **Kiểm tra DATABASE_URL trong .env**:
   ```bash
   grep DATABASE_URL .env
   ```

3. **Test connection**:
   ```bash
   sudo docker compose -f docker-compose.prod.yml exec app npx prisma db pull
   ```

### .env file không được tạo

1. **Kiểm tra GitHub Secrets**:
   - Đảm bảo tất cả required secrets đã được set
   - Kiểm tra tên secrets có đúng không

2. **Kiểm tra workflow logs**:
   - Xem step "Create .env file from secrets" có chạy thành công không

## 🧹 Docker Image Cleanup

Sau nhiều lần deploy, server sẽ tích lũy nhiều Docker images cũ, chiếm dung lượng đĩa. **Cleanup tự động chạy sau mỗi lần deploy thành công** qua GitHub Actions workflow.

### ✅ Tự động Cleanup (Mặc định)

**GitHub Actions workflow tự động cleanup images sau mỗi lần deploy thành công!**

- ✅ Tự động chạy sau khi deploy và health check thành công
- ✅ Giữ lại **3 images mới nhất** (có thể config qua GitHub Secret `KEEP_IMAGES`)
- ✅ Tự động skip images đang được sử dụng
- ✅ Không cần làm gì thêm - hoàn toàn tự động!

### Cấu hình số lượng images muốn giữ lại

Thêm GitHub Secret `KEEP_IMAGES` để thay đổi số lượng images muốn giữ lại:

1. Vào **GitHub Repository → Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `KEEP_IMAGES`
4. Value: Số lượng images muốn giữ lại (ví dụ: `5`)
5. Click **Add secret**

Nếu không set, mặc định sẽ giữ lại **3 images mới nhất**.

### Cleanup thủ công

#### 1. Sử dụng Makefile (từ local machine)

```bash
# Cleanup images, giữ lại 3 images mới nhất (default)
make prod-cleanup-images

# Giữ lại 5 images mới nhất
KEEP_COUNT=5 make prod-cleanup-images

# Dry run - xem những images nào sẽ bị xóa (không xóa thật)
make prod-cleanup-images-dry

# Xóa tất cả unused/dangling images
make prod-cleanup-unused

# Xóa images cũ hơn 14 ngày
DAYS=14 make prod-cleanup-by-age

# Xem disk usage và danh sách images
make prod-images-usage
```

#### 2. Sử dụng script trực tiếp trên EC2

```bash
# SSH vào EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

cd /home/ubuntu/app

# Cleanup - giữ lại 3 images mới nhất (default)
bash deploy/cleanup-images.sh keep-recent

# Giữ lại 5 images mới nhất
KEEP_COUNT=5 bash deploy/cleanup-images.sh keep-recent 5

# Dry run - xem sẽ xóa gì (không xóa thật)
DRY_RUN=1 bash deploy/cleanup-images.sh keep-recent

# Xóa images cũ hơn 7 ngày
bash deploy/cleanup-images.sh by-age 7

# Xóa tất cả unused/dangling images
bash deploy/cleanup-images.sh unused

# Xem disk usage
bash deploy/cleanup-images.sh usage
```

### Các chiến lược cleanup

Script hỗ trợ nhiều chiến lược cleanup khác nhau:

1. **Keep Recent (Khuyến nghị)**: Giữ lại N images mới nhất
   ```bash
   bash deploy/cleanup-images.sh keep-recent 3
   ```

2. **By Age**: Xóa images cũ hơn X ngày
   ```bash
   bash deploy/cleanup-images.sh by-age 14
   ```

3. **Unused**: Xóa tất cả unused/dangling images
   ```bash
   bash deploy/cleanup-images.sh unused
   ```

4. **All Repo**: Xóa TẤT CẢ images của repository (nguy hiểm!)
   ```bash
   bash deploy/cleanup-images.sh all-repo
   ```

### Environment Variables

```bash
# Repository name (default: luantrum27/oly-studio-portfolio)
REPO_NAME="your-repo/image-name"

# Số lượng images muốn giữ lại (default: 3)
KEEP_COUNT=5

# Sử dụng sudo (default: 1)
USE_SUDO=1

# Dry run mode - chỉ xem, không xóa (default: 0)
DRY_RUN=1
```

### Best Practices

1. **Giữ lại ít nhất 2-3 images mới nhất** để có thể rollback nhanh
2. **Chạy dry run trước** để xem sẽ xóa gì: `DRY_RUN=1 bash deploy/cleanup-images.sh keep-recent`
3. **Cleanup định kỳ**: Tự động cleanup sau mỗi deploy hoặc chạy cron job hàng tuần
4. **Monitor disk usage**: Chạy `bash deploy/cleanup-images.sh usage` để theo dõi

### Cron Job (Tự động cleanup hàng tuần)

Thêm vào crontab để tự động cleanup mỗi tuần:

```bash
# SSH vào EC2
crontab -e

# Thêm dòng sau (cleanup mỗi Chủ nhật lúc 2 giờ sáng)
0 2 * * 0 cd /home/ubuntu/app && bash deploy/cleanup-images.sh keep-recent 3 >> /var/log/docker-cleanup.log 2>&1
```

### Troubleshooting Cleanup

**Lỗi: "Image is in use"**
- Image đang được sử dụng bởi container đang chạy
- Script sẽ tự động skip các images này
- Để xóa, cần dừng container trước: `sudo docker compose -f docker-compose.prod.yml down`

**Lỗi: "Permission denied"**
- Cần quyền sudo: `USE_SUDO=1 bash deploy/cleanup-images.sh keep-recent`
- Hoặc thêm user vào docker group: `sudo usermod -aG docker $USER`

**Không đủ dung lượng sau cleanup**
- Chạy cleanup unused: `bash deploy/cleanup-images.sh unused`
- Xóa tất cả unused resources: `sudo docker system prune -af`

## 🔄 Rollback

Nếu deployment có vấn đề, có thể rollback về version trước:

```bash
# SSH vào EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

cd /home/ubuntu/app

# Chạy rollback script
chmod +x deploy/rollback.sh
./deploy/rollback.sh
```

Hoặc rollback thủ công:

```bash
cd /home/ubuntu/app

# Restore từ backup
if [ -d "backup" ]; then
  sudo docker compose -f docker-compose.prod.yml down
  cp -r backup/. .
  sudo docker compose -f docker-compose.prod.yml up -d
fi
```

## 🔒 Security Best Practices

1. **Rotate secrets regularly**: Đổi mật khẩu và keys định kỳ (mỗi 3-6 tháng)
2. **Use strong passwords**: Sử dụng mật khẩu mạnh cho database và admin
3. **Restrict SSH access**: Chỉ cho phép SSH từ IP cụ thể trong Security Group
4. **Use SSL/TLS**: Cấu hình HTTPS với Let's Encrypt hoặc AWS Certificate Manager
5. **Monitor logs**: Theo dõi logs để phát hiện bất thường
6. **Keep dependencies updated**: Cập nhật Docker images và dependencies định kỳ
7. **Backup regularly**: Backup database và uploaded files định kỳ
8. **Use IAM roles**: Nếu có thể, dùng IAM roles thay vì access keys

## 📊 Data Persistence

### Database Data

Database data được lưu trong Docker volume `postgres_data_prod` và **không bị mất** khi:
- Rebuild containers
- Restart containers
- Update code

Data chỉ bị mất nếu:
- Xóa volume: `sudo docker volume rm oly-studio-portfolio-ts_postgres_data_prod`
- Xóa toàn bộ Docker data

### Uploaded Files

Uploaded files được lưu trong Docker volume `uploads_data_prod` và **không bị mất** khi rebuild.

### Backup Database

```bash
# SSH vào EC2
cd /home/ubuntu/app

# Backup database
sudo docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres oly_portfolio > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
sudo docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres oly_portfolio < backup_20241212_120000.sql
```

## 🚀 Quick Start

1. **Setup EC2**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   chmod +x deploy/ec2-setup.sh && ./deploy/ec2-setup.sh
   ```

2. **Cấu hình GitHub Secrets** (xem Bước 2)

3. **Deploy**:
   ```bash
   git checkout prod
   git push origin prod
   ```

4. **Kiểm tra**:
   ```bash
   curl http://your-ec2-ip/api/health
   ```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

## ❓ FAQ

### Q: Làm sao để update environment variables?

A: Cập nhật GitHub Secrets, sau đó push lại vào branch `prod`. Workflow sẽ tự động tạo `.env` mới và deploy.

### Q: Data có bị mất khi rebuild không?

A: Không. Database và uploaded files được lưu trong Docker volumes và không bị mất khi rebuild.

### Q: Làm sao để deploy lại version cũ?

A: Sử dụng rollback script hoặc checkout commit cũ và push lại.

### Q: Có thể deploy từ branch khác không?

A: Có thể trigger manual workflow hoặc thay đổi branch trong workflow file.

### Q: Làm sao để thêm SSL/HTTPS?

A: Cấu hình Nginx với Let's Encrypt hoặc AWS Certificate Manager. Xem `docker/nginx/nginx-ssl.conf.example`.
