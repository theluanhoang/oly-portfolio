#!/bin/bash
set -e

echo "Rolling back to previous deployment..."

APP_DIR="/home/$USER/app"
cd $APP_DIR

echo "Stopping current containers..."
sudo docker compose -f docker-compose.prod.yml down

echo "Available images:"
sudo docker images | grep oly-studio-portfolio-ts

if [ -d "backup" ]; then
    echo "Restoring from backup..."
    cp -r backup/. .
    sudo docker compose -f docker-compose.prod.yml up -d
    echo "✅ Rollback completed!"
else
    echo "❌ No backup found. Cannot rollback."
    exit 1
fi

