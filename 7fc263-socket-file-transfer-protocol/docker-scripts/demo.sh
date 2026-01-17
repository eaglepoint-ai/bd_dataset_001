#!/bin/bash
# Demo Script for File Transfer System

set -e

echo "File Transfer System - Interactive Demo"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

print_header() {
    echo -e "${BLUE}[DEMO]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

print_result() {
    echo -e "${CYAN}[RESULT]${NC} $1"
}

# Function to wait for user input
wait_for_user() {
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit..."
    echo ""
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to cleanup background processes
cleanup_demo() {
    print_status "Cleaning up demo processes..."
    docker-compose down >/dev/null 2>&1 || true
    pkill -f "docker-compose" >/dev/null 2>&1 || true
}

# Trap to cleanup on exit
trap cleanup_demo EXIT

# Main demo function
run_demo() {
    local demo_type=$1
    
    case $demo_type in
        "quick")
            run_quick_demo
            ;;
        "comprehensive")
            run_comprehensive_demo
            ;;
        "comparison")
            run_comparison_demo
            ;;
        "interactive")
            run_interactive_demo
            ;;
        *)
            show_demo_menu
            ;;
    esac
}

# Quick demo (5 minutes)
run_quick_demo() {
    print_header "Quick Demo - Basic Functionality (5 minutes)"
    
    print_step "1. Setting up environment..."
    ./docker-scripts/setup.sh >/dev/null 2>&1
    
    print_step "2. Starting robust server..."
    docker-compose up -d server-after
    sleep 3
    
    print_step "3. Testing file transfer..."
    echo "Hello from quick demo!" > server_files/demo.txt
    docker-compose --profile client run --rm client-after python repository_after/client.py demo.txt server-after 9999
    
    print_result "File transferred successfully!"
    print_result "Downloaded file: $(cat client_downloads/demo.txt)"
    
    print_step "4. Running quick evaluation..."
    docker-compose --profile eval run --rm quick-eval >/dev/null 2>&1
    
    print_result "Quick demo completed!"
    print_result "Check logs: ls -la logs/"
    print_result "Check downloads: ls -la client_downloads/"
}

# Comprehensive demo (15 minutes)
run_comprehensive_demo() {
    print_header "Comprehensive Demo - Full Feature Showcase (15 minutes)"
    
    print_step "1. Environment Setup"
    print_status "Building Docker image and setting up test files..."
    ./docker-scripts/setup.sh
    wait_for_user
    
    print_step "2. Basic Implementation Demo"
    print_status "Starting basic server (repository_before)..."
    docker-compose up -d server-before
    sleep 2
    
    print_status "Testing basic file transfer..."
    echo "Basic implementation test" > server_files/basic_test.txt
    docker-compose --profile client run --rm client-before python repository_before/client.py basic_test.txt server-before 9999
    
    print_result "Basic transfer completed: $(cat client_downloads/basic_test.txt)"
    docker-compose stop server-before
    wait_for_user
    
    print_step "3. Robust Implementation Demo"
    print_status "Starting robust server (repository_after)..."
    docker-compose up -d server-after
    sleep 2
    
    print_status "Testing robust file transfer with progress tracking..."
    echo "Robust implementation with advanced features!" > server_files/robust_test.txt
    docker-compose --profile client run --rm client-after python repository_after/client.py robust_test.txt server-after 9999
    
    print_result "Robust transfer completed: $(cat client_downloads/robust_test.txt)"
    wait_for_user
    
    print_step "4. Concurrent Transfer Demo"
    print_status "Testing multiple concurrent transfers..."
    for i in {1..3}; do
        echo "Concurrent test file $i" > server_files/concurrent_$i.txt
        docker-compose --profile client run --rm -d client-after python repository_after/client.py concurrent_$i.txt server-after 9999
    done
    
    sleep 5
    print_result "Concurrent transfers completed!"
    ls -la client_downloads/concurrent_*
    wait_for_user
    
    print_step "5. Binary File Transfer Demo"
    print_status "Testing binary file transfer..."
    docker-compose --profile client run --rm client-after python repository_after/client.py large.bin server-after 9999
    
    print_result "Binary transfer completed!"
    print_result "File size: $(ls -lh client_downloads/large.bin | awk '{print $5}')"
    wait_for_user
    
    print_step "6. Error Handling Demo"
    print_status "Testing error handling with non-existent file..."
    docker-compose --profile client run --rm client-after python repository_after/client.py nonexistent.txt server-after 9999 || true
    
    print_result "Error handling demonstrated!"
    wait_for_user
    
    print_step "7. Performance Testing"
    print_status "Running performance tests..."
    docker-compose --profile test run --rm test-runner python -m unittest tests.test_performance -v
    wait_for_user
    
    print_step "8. Comprehensive Evaluation"
    print_status "Running full evaluation suite..."
    docker-compose --profile eval run --rm evaluator
    
    print_result "Comprehensive demo completed!"
    print_result "Check evaluation reports: find evaluation/reports -name 'report.json'"
}

# Comparison demo
run_comparison_demo() {
    print_header "Implementation Comparison Demo (10 minutes)"
    
    print_step "1. Setup"
    ./docker-scripts/setup.sh >/dev/null 2>&1
    
    print_step "2. Basic vs Robust Comparison"
    
    # Create test file
    echo "Comparison test - measuring performance and features" > server_files/comparison.txt
    
    print_status "Testing basic implementation..."
    docker-compose up -d server-before
    sleep 2
    
    start_time=$(date +%s)
    docker-compose --profile client run --rm client-before python repository_before/client.py comparison.txt server-before 9999
    basic_time=$(($(date +%s) - start_time))
    
    docker-compose stop server-before
    mv client_downloads/comparison.txt client_downloads/comparison_basic.txt
    
    print_status "Testing robust implementation..."
    docker-compose up -d server-after
    sleep 2
    
    start_time=$(date +%s)
    docker-compose --profile client run --rm client-after python repository_after/client.py comparison.txt server-after 9999
    robust_time=$(($(date +%s) - start_time))
    
    mv client_downloads/comparison.txt client_downloads/comparison_robust.txt
    
    print_result "Performance Comparison:"
    print_result "  Basic implementation: ${basic_time}s"
    print_result "  Robust implementation: ${robust_time}s"
    
    print_step "3. Feature Comparison"
    print_status "Basic implementation features:"
    echo "  - Simple TCP socket transfer"
    echo "  - Basic error handling"
    echo "  - Minimal logging"
    
    print_status "Robust implementation features:"
    echo "  - Multi-threaded server"
    echo "  - Progress tracking"
    echo "  - Retry logic with exponential backoff"
    echo "  - Checksum verification"
    echo "  - Comprehensive logging"
    echo "  - Graceful shutdown handling"
    
    print_step "4. Code Complexity Analysis"
    basic_lines=$(wc -l < repository_before/server.py)
    robust_lines=$(wc -l < repository_after/server.py)
    
    print_result "Code Complexity:"
    print_result "  Basic server: ${basic_lines} lines"
    print_result "  Robust server: ${robust_lines} lines"
    print_result "  Improvement ratio: $((robust_lines * 100 / basic_lines))% more comprehensive"
}

# Interactive demo menu
run_interactive_demo() {
    while true; do
        echo ""
        print_header "Interactive Demo Menu"
        echo "1. Quick functionality test"
        echo "2. Start basic server"
        echo "3. Start robust server"
        echo "4. Run client test"
        echo "5. Run performance tests"
        echo "6. Run evaluation"
        echo "7. View logs"
        echo "8. Cleanup and exit"
        echo ""
        read -p "Select option (1-8): " choice
        
        case $choice in
            1)
                print_status "Running quick functionality test..."
                docker-compose --profile test run --rm quick-test
                ;;
            2)
                print_status "Starting basic server on port 9998..."
                docker-compose up -d server-before
                print_result "Server started. Use option 4 to test."
                ;;
            3)
                print_status "Starting robust server on port 9999..."
                docker-compose up -d server-after
                print_result "Server started. Use option 4 to test."
                ;;
            4)
                echo "Available test files:"
                ls -la server_files/
                read -p "Enter filename to transfer: " filename
                if [ -f "server_files/$filename" ]; then
                    docker-compose --profile client run --rm client-after python repository_after/client.py "$filename" server-after 9999
                    print_result "Transfer completed! Check client_downloads/"
                else
                    print_error "File not found!"
                fi
                ;;
            5)
                print_status "Running performance tests..."
                docker-compose --profile test run --rm test-runner python -m unittest tests.test_performance -v
                ;;
            6)
                print_status "Running evaluation..."
                docker-compose --profile eval run --rm evaluator
                print_result "Check evaluation/reports/ for results"
                ;;
            7)
                echo "Available logs:"
                ls -la logs/ 2>/dev/null || echo "No logs found"
                echo ""
                echo "Docker logs:"
                docker-compose logs --tail=20
                ;;
            8)
                print_status "Cleaning up and exiting..."
                cleanup_demo
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-8."
                ;;
        esac
    done
}

# Show demo menu
show_demo_menu() {
    echo ""
    echo "Available demo modes:"
    echo "  quick         - Quick functionality demo (5 minutes)"
    echo "  comprehensive - Full feature showcase (15 minutes)"
    echo "  comparison    - Before/after comparison (10 minutes)"
    echo "  interactive   - Interactive demo menu"
    echo ""
    echo "Usage: $0 [quick|comprehensive|comparison|interactive]"
    echo ""
    echo "Examples:"
    echo "  $0 quick        # Quick demo"
    echo "  $0 comprehensive # Full demo"
    echo "  $0 interactive  # Interactive mode"
    exit 1
}

# Main execution
print_header "File Transfer System Demo"
echo "This demo showcases the file transfer system capabilities"
echo ""

# Check prerequisites
check_docker

# Parse arguments
DEMO_TYPE=${1:-"menu"}

# Run the selected demo
run_demo "$DEMO_TYPE"