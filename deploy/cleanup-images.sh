#!/bin/bash
set -e

# Docker Image Cleanup Script
# Best practices inspired by large tech companies (Google, Netflix, AWS)
# 
# This script provides multiple cleanup strategies:
# 1. Keep only N most recent images (recommended for production)
# 2. Remove images older than X days
# 3. Remove all unused/dangling images
# 4. Remove all images for a specific repository

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
REPO_NAME="${REPO_NAME:-luantrum27/oly-studio-portfolio}"
KEEP_COUNT="${KEEP_COUNT:-3}"
USE_SUDO="${USE_SUDO:-1}"
DRY_RUN="${DRY_RUN:-0}"

# Docker command with optional sudo
DOCKER_CMD="docker"
if [ "$USE_SUDO" = "1" ]; then
    DOCKER_CMD="sudo docker"
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

# Function to check if image is being used by any container
is_image_in_use() {
    local image_id=$1
    local containers=$($DOCKER_CMD ps -a --filter "ancestor=$image_id" --format "{{.ID}}")
    if [ -z "$containers" ]; then
        return 1  # Not in use
    else
        return 0  # In use
    fi
}

# Strategy 1: Keep only N most recent images (recommended)
cleanup_keep_recent() {
    local keep=$1
    print_info "Cleaning up images for repository: $REPO_NAME"
    print_info "Strategy: Keep $keep most recent images"
    
    # Get all images for the repository, sorted by creation time (newest first)
    # Format: IMAGE_ID CREATED_AT
    local images=$($DOCKER_CMD images --format "{{.ID}} {{.CreatedAt}}" "$REPO_NAME" | sort -k2 -r)
    
    if [ -z "$images" ]; then
        print_warning "No images found for repository: $REPO_NAME"
        return 0
    fi
    
    # Count total images
    local total=$(echo "$images" | wc -l | tr -d ' ')
    print_info "Total images found: $total"
    
    if [ "$total" -le "$keep" ]; then
        print_success "Only $total images found, keeping all (limit: $keep)"
        return 0
    fi
    
    # Get images to keep (first N)
    local images_to_keep=$(echo "$images" | head -n "$keep" | awk '{print $1}')
    
    # Get images to delete (rest)
    local images_to_delete=$(echo "$images" | tail -n +$((keep + 1)) | awk '{print $1}')
    
    local delete_count=$(echo "$images_to_delete" | grep -v '^$' | wc -l | tr -d ' ')
    
    if [ "$delete_count" -eq 0 ]; then
        print_success "No images to delete"
        return 0
    fi
    
    print_warning "Images to be deleted: $delete_count"
    
    if [ "$DRY_RUN" = "1" ]; then
        print_info "DRY RUN - Would delete the following images:"
        echo "$images_to_delete" | while read -r img_id; do
            if [ -n "$img_id" ]; then
                local img_info=$($DOCKER_CMD images --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}} {{.Size}}" | grep "$img_id" | head -1)
                echo "  - $img_info"
            fi
        done
        return 0
    fi
    
    # Delete images one by one, checking if they're in use
    local deleted=0
    local skipped=0
    
    echo "$images_to_delete" | while read -r img_id; do
        if [ -z "$img_id" ]; then
            continue
        fi
        
        # Check if image is in use
        if is_image_in_use "$img_id"; then
            print_warning "Skipping $img_id (in use by container)"
            skipped=$((skipped + 1))
            continue
        fi
        
        # Get image info before deletion
        local img_info=$($DOCKER_CMD images --format "{{.Repository}}:{{.Tag}}" | grep "$img_id" | head -1)
        
        if [ -z "$img_info" ]; then
            img_info="$img_id"
        fi
        
        print_info "Deleting: $img_info"
        
        if $DOCKER_CMD rmi -f "$img_id" 2>/dev/null; then
            print_success "Deleted: $img_info"
            deleted=$((deleted + 1))
        else
            print_error "Failed to delete: $img_info"
        fi
    done
    
    print_success "Cleanup completed. Deleted: $deleted, Skipped: $skipped"
}

# Strategy 2: Remove images older than X days
cleanup_by_age() {
    local days=$1
    print_info "Cleaning up images older than $days days"
    
    # Calculate cutoff date
    local cutoff_date=$(date -d "$days days ago" -u +"%Y-%m-%dT%H:%M:%S" 2>/dev/null || date -v-${days}d -u +"%Y-%m-%dT%H:%M:%S" 2>/dev/null)
    
    if [ -z "$cutoff_date" ]; then
        print_error "Failed to calculate cutoff date. This may not work on all systems."
        return 1
    fi
    
    # Get images older than cutoff
    local old_images=$($DOCKER_CMD images --format "{{.ID}} {{.CreatedAt}}" "$REPO_NAME" | \
        awk -v cutoff="$cutoff_date" '$2 < cutoff {print $1}')
    
    if [ -z "$old_images" ]; then
        print_success "No old images found"
        return 0
    fi
    
    local delete_count=$(echo "$old_images" | grep -v '^$' | wc -l | tr -d ' ')
    print_warning "Found $delete_count images older than $days days"
    
    if [ "$DRY_RUN" = "1" ]; then
        print_info "DRY RUN - Would delete:"
        echo "$old_images" | while read -r img_id; do
            if [ -n "$img_id" ]; then
                local img_info=$($DOCKER_CMD images --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | grep "$img_id" | head -1)
                echo "  - $img_info"
            fi
        done
        return 0
    fi
    
    # Delete old images
    echo "$old_images" | while read -r img_id; do
        if [ -z "$img_id" ]; then
            continue
        fi
        
        if is_image_in_use "$img_id"; then
            print_warning "Skipping $img_id (in use)"
            continue
        fi
        
        $DOCKER_CMD rmi -f "$img_id" 2>/dev/null && print_success "Deleted: $img_id" || print_error "Failed: $img_id"
    done
}

# Strategy 3: Remove all unused/dangling images
cleanup_unused() {
    print_info "Cleaning up unused/dangling images"
    
    if [ "$DRY_RUN" = "1" ]; then
        print_info "DRY RUN - Would remove:"
        $DOCKER_CMD images -f "dangling=true" --format "{{.ID}} {{.Repository}}:{{.Tag}}"
        return 0
    fi
    
    local freed_space=$($DOCKER_CMD system prune -af --filter "label!=keep" 2>&1 | grep -oP 'Total reclaimed space: \K[0-9.]+[A-Z]+' || echo "unknown")
    print_success "Cleaned up unused images. Freed space: $freed_space"
}

# Strategy 4: Remove all images for a specific repository (use with caution!)
cleanup_all_repo() {
    print_warning "This will delete ALL images for repository: $REPO_NAME"
    
    if [ "$DRY_RUN" = "1" ]; then
        print_info "DRY RUN - Would delete all images:"
        $DOCKER_CMD images "$REPO_NAME" --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}} {{.Size}}"
        return 0
    fi
    
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        print_info "Cancelled"
        return 0
    fi
    
    $DOCKER_CMD rmi -f $($DOCKER_CMD images "$REPO_NAME" -q) 2>/dev/null
    print_success "Deleted all images for $REPO_NAME"
}

# Show disk usage
show_disk_usage() {
    print_info "Current Docker disk usage:"
    $DOCKER_CMD system df
    echo ""
    print_info "Images for $REPO_NAME:"
    $DOCKER_CMD images "$REPO_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}"
}

# Main function
main() {
    local strategy="${1:-keep-recent}"
    
    case "$strategy" in
        "keep-recent")
            cleanup_keep_recent "$KEEP_COUNT"
            ;;
        "by-age")
            local days="${2:-7}"
            cleanup_by_age "$days"
            ;;
        "unused")
            cleanup_unused
            ;;
        "all-repo")
            cleanup_all_repo
            ;;
        "usage")
            show_disk_usage
            ;;
        *)
            echo "Usage: $0 [strategy] [options]"
            echo ""
            echo "Strategies:"
            echo "  keep-recent [count]  - Keep N most recent images (default: 3)"
            echo "  by-age [days]       - Remove images older than X days (default: 7)"
            echo "  unused              - Remove all unused/dangling images"
            echo "  all-repo            - Remove ALL images for repository (dangerous!)"
            echo "  usage               - Show disk usage and image list"
            echo ""
            echo "Environment variables:"
            echo "  REPO_NAME           - Repository name (default: luantrum27/oly-studio-portfolio)"
            echo "  KEEP_COUNT          - Number of images to keep (default: 3)"
            echo "  USE_SUDO            - Use sudo for docker (default: 1)"
            echo "  DRY_RUN             - Dry run mode (default: 0)"
            echo ""
            echo "Examples:"
            echo "  $0 keep-recent 5              # Keep 5 most recent images"
            echo "  $0 by-age 14                  # Remove images older than 14 days"
            echo "  DRY_RUN=1 $0 keep-recent      # Dry run to see what would be deleted"
            echo "  USE_SUDO=0 $0 unused          # Clean unused without sudo"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

