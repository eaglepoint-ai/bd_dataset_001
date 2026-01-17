#!/bin/bash
# Run Test Suite

set -e

echo "File Transfer System - Test Suite"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Parse command line arguments
TEST_TYPE=${1:-"all"}

case $TEST_TYPE in
    "quick")
        print_header "Running Quick Tests..."
        docker-compose --profile test up --abort-on-container-exit quick-test
        ;;
    "full"|"all")
        print_header "Running Full Test Suite..."
        docker-compose --profile test up --abort-on-container-exit test-runner
        ;;
    "functionality")
        print_header "Running Functionality Tests..."
        docker run --rm file-transfer-system python -m unittest tests.test_file_transfer -v
        ;;
    "performance")
        print_header "Running Performance Tests..."
        docker run --rm file-transfer-system python -m unittest tests.test_performance -v
        ;;
    "error")
        print_header "Running Error Handling Tests..."
        docker run --rm file-transfer-system python -m unittest tests.test_error_handling -v
        ;;
    *)
        echo "Usage: $0 [quick|full|functionality|performance|error]"
        echo ""
        echo "Test types:"
        echo "  quick        - Quick validation tests (2-3 minutes)"
        echo "  full/all     - Complete test suite (10-15 minutes)"
        echo "  functionality - Core functionality tests only"
        echo "  performance  - Performance tests only"
        echo "  error        - Error handling tests only"
        exit 1
        ;;
esac

print_status "Test execution completed!"
echo ""
echo "Check logs directory for detailed test logs:"
echo "  ls -la logs/"