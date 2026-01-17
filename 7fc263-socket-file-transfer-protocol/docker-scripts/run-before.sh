#!/bin/bash
# Run Basic Implementation (repository_before)

set -e

echo "File Transfer System - Basic Implementation"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if setup was run
if [ ! -f "server_files/test.txt" ]; then
    print_warning "Test files not found. Running setup first..."
    ./docker-scripts/setup.sh
fi

print_status "Starting basic implementation server..."
print_status "Server will be available on port 9998"
print_status "Press Ctrl+C to stop the server"
echo ""

# Start the basic server
docker-compose up server-before