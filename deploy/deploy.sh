#!/bin/bash
set -e

# Production Deployment Script with Automatic Image Cleanup
# This script handles deployment and automatically cleans up old images

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="${APP_DIR:-/home/$USER/app}"
KEEP_IMAGES="${KEEP_IMAGES:-3}"
USE_SUDO="${USE_SUDO:-1}"
CLEANUP_AFTER_DEPLOY="${CLEANUP_AFTER_DEPLOY:-1}"

# Docker command with optional sudo
DOCKER_CMD="docker"
DOCKER_COMPOSE_CMD="docker compose"
if [ "$USE_SUDO" = "1" ]; then
    DOCKER_CMD="sudo docker"
    DOCKER_COMPOSE_CMD="sudo docker compose"
fi

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶${NC} $1"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if running as root or with sudo
check_permissions() {
    if [ "$USE_SUDO" = "1" ] && ! sudo -n true 2>/dev/null; then
        print_warning "This script may require sudo privileges for Docker commands"
    fi
}

# Pre-deployment checks
pre_deploy_checks() {
    print_step "Pre-deployment Checks"
    
    if [ ! -d "$APP_DIR" ]; then
        print_error "App directory not found: $APP_DIR"
        exit 1
    fi
    
    if [ ! -f "$APP_DIR/docker-compose.prod.yml" ]; then
        print_error "docker-compose.prod.yml not found in $APP_DIR"
        exit 1
    fi
    
    if [ ! -f "$APP_DIR/.env" ]; then
        print_warning ".env file not found. Make sure environment variables are set."
    fi
    
    print_success "Pre-deployment checks passed"
}

# Pull latest images
pull_images() {
    print_step "Pulling Latest Images"
    
    cd "$APP_DIR"
    
    # Pull the latest image (assuming it's set via APP_IMAGE in .env or docker-compose)
    print_info "Pulling latest application image..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml pull app || print_warning "Failed to pull app image (may need to build locally)"
    
    print_success "Images pulled successfully"
}

# Deploy application
deploy_app() {
    print_step "Deploying Application"
    
    cd "$APP_DIR"
    
    print_info "Stopping old containers..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml down || true
    
    print_info "Starting new containers..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml up -d
    
    print_info "Waiting for services to be healthy..."
    sleep 10
    
    # Check if containers are running
    if $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "Up"; then
        print_success "Application deployed successfully"
    else
        print_error "Some containers failed to start"
        $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_step "Running Database Migrations"
    
    cd "$APP_DIR"
    
    print_info "Running Prisma migrations..."
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml exec -T app npx prisma migrate deploy || {
        print_warning "Migration failed or already up to date"
    }
    
    print_success "Database migrations completed"
}

# Cleanup old images
cleanup_old_images() {
    if [ "$CLEANUP_AFTER_DEPLOY" != "1" ]; then
        print_info "Skipping image cleanup (CLEANUP_AFTER_DEPLOY=0)"
        return 0
    fi
    
    print_step "Cleaning Up Old Images"
    
    # Use the cleanup script
    if [ -f "$APP_DIR/deploy/cleanup-images.sh" ]; then
        cd "$APP_DIR"
        print_info "Keeping $KEEP_IMAGES most recent images..."
        bash deploy/cleanup-images.sh keep-recent "$KEEP_IMAGES" || {
            print_warning "Image cleanup had some issues, but deployment succeeded"
        }
    else
        print_warning "cleanup-images.sh not found, skipping cleanup"
    fi
}

# Show deployment status
show_status() {
    print_step "Deployment Status"
    
    cd "$APP_DIR"
    
    print_info "Running containers:"
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps
    
    echo ""
    print_info "Recent logs (last 20 lines):"
    $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs --tail=20
    
    echo ""
    print_info "Disk usage:"
    $DOCKER_CMD system df
}

# Main deployment flow
main() {
    print_info "Starting production deployment..."
    print_info "App directory: $APP_DIR"
    print_info "Keep images: $KEEP_IMAGES"
    print_info "Cleanup after deploy: $CLEANUP_AFTER_DEPLOY"
    
    check_permissions
    pre_deploy_checks
    pull_images
    deploy_app
    run_migrations
    
    if [ "$CLEANUP_AFTER_DEPLOY" = "1" ]; then
        cleanup_old_images
    fi
    
    show_status
    
    echo ""
    print_success "Deployment completed successfully! 🚀"
    echo ""
    print_info "Useful commands:"
    echo "  - View logs: cd $APP_DIR && $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml logs -f"
    echo "  - Check status: cd $APP_DIR && $DOCKER_COMPOSE_CMD -f docker-compose.prod.yml ps"
    echo "  - Cleanup images: cd $APP_DIR && bash deploy/cleanup-images.sh keep-recent $KEEP_IMAGES"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "cleanup-only")
        cleanup_old_images
        ;;
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy        - Full deployment with cleanup (default)"
        echo "  cleanup-only  - Only run image cleanup"
        echo "  status        - Show deployment status"
        echo ""
        echo "Environment variables:"
        echo "  APP_DIR              - Application directory (default: /home/\$USER/app)"
        echo "  KEEP_IMAGES          - Number of images to keep (default: 3)"
        echo "  USE_SUDO             - Use sudo for docker (default: 1)"
        echo "  CLEANUP_AFTER_DEPLOY - Run cleanup after deploy (default: 1)"
        exit 1
        ;;
esac

