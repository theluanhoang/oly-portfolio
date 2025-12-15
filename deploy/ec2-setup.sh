#!/bin/bash
set -e

echo "Setting up EC2 instance for deployment..."

# Update system
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    DOCKER_COMPOSE_VERSION="v2.24.0"
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create app directory
APP_DIR="/home/$USER/app"
mkdir -p $APP_DIR
cd $APP_DIR

# Set up firewall (if using UFW)
if command -v ufw &> /dev/null; then
    echo "Configuring firewall..."
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
fi

# Create .env file template
if [ ! -f .env ]; then
    echo "Creating .env template..."
    cat > .env << EOF
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=oly_portfolio
POSTGRES_PORT=5432

# Next.js
NODE_ENV=production
NEXTAUTH_SECRET=CHANGE_ME
ADMIN_USERNAME=CHANGE_ME
ADMIN_PASSWORD=CHANGE_ME

# Nginx
NGINX_PORT=80
EOF
    echo "⚠️  Please update .env file with your actual values!"
fi

echo "✅ EC2 setup completed!"
echo "📝 Next steps:"
echo "   1. Update .env file in $APP_DIR"
echo "   2. Configure GitHub Secrets"
echo "   3. Push to main branch to trigger deployment"

