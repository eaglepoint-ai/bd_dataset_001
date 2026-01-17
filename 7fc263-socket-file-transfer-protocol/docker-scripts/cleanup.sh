#!/bin/bash
# Cleanup Script for File Transfer System

set -e

echo "File Transfer System - Cleanup"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
CLEANUP_TYPE=${1:-"standard"}

case $CLEANUP_TYPE in
    "light")
        print_status "Light cleanup - stopping containers only..."
        docker-compose down
        ;;
    "standard")
        print_status "Standard cleanup - containers, volumes, and generated files..."
        
        # Stop and remove containers
        print_status "Stopping Docker containers..."
        docker-compose down --volumes --remove-orphans
        
        # Clean up generated files
        print_status "Cleaning up generated files..."
        rm -rf client_downloads/* 2>/dev/null || true
        rm -rf logs/* 2>/dev/null || true
        rm -rf evaluation/reports/* 2>/dev/null || true
        
        # Keep test files but clean downloads
        print_status "Preserving server test files, cleaning downloads..."
        ;;
    "deep")
        print_status "Deep cleanup - everything including Docker images..."
        
        # Stop and remove containers
        print_status "Stopping Docker containers..."
        docker-compose down --volumes --remove-orphans
        
        # Remove Docker images
        print_status "Removing Docker images..."
        docker rmi file-transfer-system 2>/dev/null || print_warning "Image not found or in use"
        
        # Clean up all generated files
        print_status "Cleaning up all generated files..."
        rm -rf client_downloads/* 2>/dev/null || true
        rm -rf logs/* 2>/dev/null || true
        rm -rf evaluation/reports/* 2>/dev/null || true
        rm -rf server_files/* 2>/dev/null || true
        
        # Clean up Docker system
        print_status "Cleaning up Docker system..."
        docker system prune -f
        ;;
    "reset")
        print_status "Complete reset - everything including Docker system..."
        
        # Stop and remove containers
        print_status "Stopping Docker containers..."
        docker-compose down --volumes --remove-orphans
        
        # Remove Docker images
        print_status "Removing Docker images..."
        docker rmi file-transfer-system 2>/dev/null || print_warning "Image not found or in use"
        
        # Clean up all files
        print_status "Removing all generated files and directories..."
        rm -rf client_downloads logs evaluation/reports server_files 2>/dev/null || true
        
        # Recreate directories
        print_status "Recreating clean directories..."
        mkdir -p client_downloads logs evaluation/reports server_files
        
        # Clean up Docker system aggressively
        print_status "Aggressive Docker cleanup..."
        docker system prune -a -f --volumes
        ;;
    *)
        echo "Usage: $0 [light|standard|deep|reset]"
        echo ""
        echo "Cleanup types:"
        echo "  light     - Stop containers only"
        echo "  standard  - Stop containers, clean downloads/logs (default)"
        echo "  deep      - Remove images, clean all generated files"
        echo "  reset     - Complete reset, remove everything"
        echo ""
        echo "Examples:"
        echo "  $0              # Standard cleanup"
        echo "  $0 light        # Just stop containers"
        echo "  $0 deep         # Remove images and files"
        echo "  $0 reset        # Complete reset"
        exit 1
        ;;
esac

print_status "Cleanup completed!"

# Show remaining resources
echo ""
echo "Remaining Docker resources:"
echo "  Images: $(docker images -q file-transfer-system | wc -l)"
echo "  Containers: $(docker ps -a -q --filter ancestor=file-transfer-system | wc -l)"
echo "  Networks: $(docker network ls -q --filter name=file-transfer | wc -l)"

# Show disk usage
echo ""
echo "Directory sizes:"
if [ -d "server_files" ]; then
    echo "  server_files: $(du -sh server_files 2>/dev/null | cut -f1)"
fi
if [ -d "client_downloads" ]; then
    echo "  client_downloads: $(du -sh client_downloads 2>/dev/null | cut -f1)"
fi
if [ -d "logs" ]; then
    echo "  logs: $(du -sh logs 2>/dev/null | cut -f1)"
fi
if [ -d "evaluation/reports" ]; then
    echo "  evaluation/reports: $(du -sh evaluation/reports 2>/dev/null | cut -f1)"
fi