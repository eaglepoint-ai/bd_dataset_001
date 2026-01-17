#!/bin/bash
# Docker Setup Script for File Transfer System

set -e

echo "File Transfer System - Docker Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p server_files
mkdir -p client_downloads
mkdir -p logs
mkdir -p evaluation/reports

# Create test files
print_status "Creating test files..."
echo "Hello, World! This is a test file for the basic implementation." > server_files/test.txt
echo "This is a small test file." > server_files/small.txt
echo "This is a medium-sized test file with more content to test the file transfer system capabilities." > server_files/medium.txt

# Create binary test file
print_status "Creating binary test file..."
if command -v dd &> /dev/null; then
    dd if=/dev/zero of=server_files/large.bin bs=1024 count=1024 2>/dev/null
    print_status "Created 1MB binary test file"
else
    python3 -c "
import os
with open('server_files/large.bin', 'wb') as f:
    f.write(os.urandom(1024*1024))
print('Created 1MB binary test file using Python')
"
fi

# Create JSON test file
print_status "Creating JSON test file..."
cat > server_files/data.json << EOF
{
  "test": true,
  "message": "This is a JSON test file",
  "data": {
    "numbers": [1, 2, 3, 4, 5],
    "strings": ["hello", "world", "test"],
    "nested": {
      "key": "value",
      "array": [10, 20, 30]
    }
  },
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Build Docker image
print_status "Building Docker image..."
if docker-compose build; then
    print_status "Docker image built successfully"
else
    print_error "Failed to build Docker image"
    exit 1
fi

# Set proper permissions
print_status "Setting proper permissions..."
chmod -R 755 server_files client_downloads logs evaluation 2>/dev/null || true

print_status "Setup completed successfully!"
echo ""
echo "Available commands:"
echo "  ./docker-scripts/run-before.sh     - Run basic implementation"
echo "  ./docker-scripts/run-after.sh      - Run robust implementation"
echo "  ./docker-scripts/run-tests.sh      - Run test suite"
echo "  ./docker-scripts/run-evaluation.sh - Run evaluation"
echo "  ./docker-scripts/cleanup.sh        - Clean up resources"
echo ""
echo "Or use Docker Compose directly:"
echo "  docker-compose up server-after     - Start robust server"
echo "  docker-compose --profile test up   - Run tests"
echo "  docker-compose --profile eval up   - Run evaluation"