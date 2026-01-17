#!/bin/bash
# Run Evaluation Suite

set -e

echo "File Transfer System - Evaluation Suite"
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[EVAL]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_result() {
    echo -e "${PURPLE}[RESULT]${NC} $1"
}

# Parse command line arguments
EVAL_TYPE=${1:-"comprehensive"}

case $EVAL_TYPE in
    "quick")
        print_header "Running Quick Evaluation (2-3 minutes)..."
        docker-compose --profile eval up --abort-on-container-exit quick-eval
        ;;
    "comprehensive"|"full")
        print_header "Running Comprehensive Evaluation (10-15 minutes)..."
        docker-compose --profile eval up --abort-on-container-exit evaluator
        ;;
    "requirements")
        print_header "Running Requirements Compliance Evaluation..."
        docker run --rm \
            -v $(pwd)/evaluation:/app/evaluation \
            -v $(pwd)/repository_before:/app/repository_before \
            -v $(pwd)/repository_after:/app/repository_after \
            -v $(pwd)/tests:/app/tests \
            file-transfer-system python evaluation/run_evaluation.py --custom requirements
        ;;
    "functionality")
        print_header "Running Functionality Evaluation..."
        docker run --rm \
            -v $(pwd)/evaluation:/app/evaluation \
            -v $(pwd)/repository_before:/app/repository_before \
            -v $(pwd)/repository_after:/app/repository_after \
            -v $(pwd)/tests:/app/tests \
            file-transfer-system python evaluation/run_evaluation.py --custom functionality
        ;;
    "performance")
        print_header "Running Performance Evaluation..."
        docker run --rm \
            -v $(pwd)/evaluation:/app/evaluation \
            -v $(pwd)/repository_before:/app/repository_before \
            -v $(pwd)/repository_after:/app/repository_after \
            -v $(pwd)/tests:/app/tests \
            file-transfer-system python evaluation/run_evaluation.py --custom performance
        ;;
    "reliability")
        print_header "Running Reliability Evaluation..."
        docker run --rm \
            -v $(pwd)/evaluation:/app/evaluation \
            -v $(pwd)/repository_before:/app/repository_before \
            -v $(pwd)/repository_after:/app/repository_after \
            -v $(pwd)/tests:/app/tests \
            file-transfer-system python evaluation/run_evaluation.py --custom reliability
        ;;
    "comparison")
        print_header "Running Implementation Comparison..."
        docker run --rm \
            -v $(pwd)/evaluation:/app/evaluation \
            -v $(pwd)/repository_before:/app/repository_before \
            -v $(pwd)/repository_after:/app/repository_after \
            -v $(pwd)/tests:/app/tests \
            file-transfer-system python evaluation/run_evaluation.py --custom comparison
        ;;
    *)
        echo "Usage: $0 [quick|comprehensive|requirements|functionality|performance|reliability|comparison]"
        echo ""
        echo "Evaluation types:"
        echo "  quick          - Quick validation (2-3 minutes)"
        echo "  comprehensive  - Complete evaluation (10-15 minutes)"
        echo "  requirements   - Requirements compliance only"
        echo "  functionality  - Core functionality evaluation"
        echo "  performance    - Performance benchmarking"
        echo "  reliability    - Reliability assessment"
        echo "  comparison     - Before/after comparison"
        exit 1
        ;;
esac

print_status "Evaluation completed!"
echo ""
echo "Check evaluation reports:"
echo "  ls -la evaluation/reports/"
echo ""
echo "View latest report:"
echo "  find evaluation/reports -name 'report.json' -exec cat {} \; | jq '.overall_score'"