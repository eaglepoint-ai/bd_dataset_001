#!/bin/bash
# End-to-End Docker Workflow Testing Script

set -e

echo "File Transfer System - Docker Workflow Testing"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_result() {
    echo -e "${PURPLE}[RESULT]${NC} $1"
}

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    print_test "Running: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        if [ "$expected_result" = "success" ]; then
            print_result "✓ PASSED: $test_name"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_result "✗ FAILED: $test_name (expected failure but succeeded)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        if [ "$expected_result" = "failure" ]; then
            print_result "✓ PASSED: $test_name (expected failure)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            print_result "✗ FAILED: $test_name"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    fi
}

# Function to cleanup between tests
cleanup_test() {
    print_status "Cleaning up test environment..."
    docker-compose down >/dev/null 2>&1 || true
    sleep 2
}

# Main testing function
main() {
    print_status "Starting Docker workflow tests..."
    echo ""
    
    # Test 1: Docker and Docker Compose availability
    print_test "Testing Docker availability..."
    run_test "Docker installation" "docker --version" "success"
    run_test "Docker Compose installation" "docker-compose --version" "success"
    run_test "Docker daemon running" "docker info" "success"
    
    echo ""
    
    # Test 2: Setup script
    print_test "Testing setup script..."
    run_test "Setup script execution" "./docker-scripts/setup.sh" "success"
    run_test "Test files created" "test -f server_files/test.txt" "success"
    run_test "Binary file created" "test -f server_files/large.bin" "success"
    run_test "Directories created" "test -d client_downloads && test -d logs" "success"
    
    echo ""
    
    # Test 3: Docker image build
    print_test "Testing Docker image..."
    run_test "Docker image exists" "docker images file-transfer-system | grep -q file-transfer-system" "success"
    run_test "Docker image runnable" "docker run --rm file-transfer-system python --version" "success"
    
    echo ""
    
    # Test 4: Basic server functionality
    print_test "Testing basic server..."
    cleanup_test
    
    # Start basic server in background
    docker-compose up -d server-before >/dev/null 2>&1
    sleep 5
    
    run_test "Basic server container running" "docker-compose ps server-before | grep -q Up" "success"
    run_test "Basic server port accessible" "nc -z localhost 9998" "success"
    
    cleanup_test
    
    echo ""
    
    # Test 5: Robust server functionality
    print_test "Testing robust server..."
    
    # Start robust server in background
    docker-compose up -d server-after >/dev/null 2>&1
    sleep 5
    
    run_test "Robust server container running" "docker-compose ps server-after | grep -q Up" "success"
    run_test "Robust server port accessible" "nc -z localhost 9999" "success"
    run_test "Robust server health check" "docker-compose ps server-after | grep -q healthy" "success"
    
    cleanup_test
    
    echo ""
    
    # Test 6: Client functionality
    print_test "Testing client functionality..."
    
    # Start server and test client
    docker-compose up -d server-after >/dev/null 2>&1
    sleep 5
    
    # Create test file
    echo "Client test file" > server_files/client_test.txt
    
    # Run client
    run_test "Client file transfer" "timeout 30 docker-compose --profile client run --rm client-after python repository_after/client.py client_test.txt server-after 9999" "success"
    run_test "File downloaded successfully" "test -f client_downloads/client_test.txt" "success"
    run_test "File content correct" "grep -q 'Client test file' client_downloads/client_test.txt" "success"
    
    cleanup_test
    
    echo ""
    
    # Test 7: Test suite
    print_test "Testing test suite..."
    run_test "Quick test execution" "timeout 180 docker-compose --profile test run --rm quick-test" "success"
    
    echo ""
    
    # Test 8: Evaluation suite
    print_test "Testing evaluation suite..."
    run_test "Quick evaluation execution" "timeout 180 docker-compose --profile eval run --rm quick-eval" "success"
    run_test "Evaluation report generated" "find evaluation/reports -name 'report.json' | head -1 | xargs test -f" "success"
    
    echo ""
    
    # Test 9: Cleanup functionality
    print_test "Testing cleanup functionality..."
    run_test "Light cleanup" "./docker-scripts/cleanup.sh light" "success"
    run_test "Standard cleanup" "./docker-scripts/cleanup.sh standard" "success"
    
    echo ""
    
    # Test 10: Error handling
    print_test "Testing error handling..."
    run_test "Invalid Docker command" "docker run --rm file-transfer-system python nonexistent_script.py" "failure"
    run_test "Client without server" "timeout 10 docker run --rm file-transfer-system python repository_after/client.py test.txt nonexistent-server 9999" "failure"
    
    echo ""
    
    # Final results
    print_status "Test Results Summary"
    echo "===================="
    print_result "Total Tests: $TOTAL_TESTS"
    print_result "Passed: $TESTS_PASSED"
    print_result "Failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_result "🎉 All tests passed!"
        echo ""
        print_status "Docker workflows are working correctly!"
        print_status "You can now use the system with confidence."
        echo ""
        echo "Quick start commands:"
        echo "  ./docker-scripts/setup.sh         # Setup environment"
        echo "  ./docker-scripts/run-after.sh     # Start robust server"
        echo "  ./docker-scripts/run-tests.sh     # Run tests"
        echo "  ./docker-scripts/run-evaluation.sh # Run evaluation"
        return 0
    else
        print_error "❌ Some tests failed!"
        echo ""
        print_error "Please check the following:"
        echo "  - Docker and Docker Compose are properly installed"
        echo "  - Docker daemon is running"
        echo "  - Ports 9998 and 9999 are available"
        echo "  - Sufficient disk space and memory"
        echo "  - Network connectivity for Docker"
        return 1
    fi
}

# Cleanup function
cleanup_all() {
    print_status "Performing final cleanup..."
    ./docker-scripts/cleanup.sh light >/dev/null 2>&1 || true
}

# Trap to cleanup on exit
trap cleanup_all EXIT

# Check prerequisites
if ! command -v docker >/dev/null 2>&1; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
fi

if ! command -v nc >/dev/null 2>&1; then
    print_warning "netcat (nc) not available, skipping port tests"
fi

# Run main test suite
main