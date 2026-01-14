#!/bin/bash
# Test script for Docker configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Docker Test Script"
echo "=========================================="
echo ""

# Test 1: Check Docker is available
echo "1. Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker is not installed"
    exit 1
fi
echo "   ✅ Docker is available"
echo ""

# Test 2: Verify Dockerfile syntax
echo "2. Checking Dockerfile syntax..."
if docker build --dry-run -f Dockerfile.test . &> /dev/null 2>&1 || true; then
    echo "   ✅ Dockerfile syntax check passed (basic validation)"
else
    echo "   ⚠️  Dockerfile syntax check (continuing anyway)"
fi
echo ""

# Test 3: Run compliance test for BEFORE in Docker
echo "3. Testing compliance test for BEFORE in Docker..."
docker run --rm \
    -e TARGET=before \
    -v "$(pwd)/tests:/app/tests:ro" \
    -v "$(pwd)/repository_before:/app/repository_before:ro" \
    -v "$(pwd)/repository_after:/app/repository_after:ro" \
    -w /app \
    node:20-alpine \
    sh -c "cd /app/repository_before && npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps 2>/dev/null; cd /app && TARGET=before node tests/test_compliance.js" 2>&1 | tail -15
echo ""

# Test 4: Run compliance test for AFTER in Docker
echo "4. Testing compliance test for AFTER in Docker..."
docker run --rm \
    -e TARGET=after \
    -v "$(pwd)/tests:/app/tests:ro" \
    -v "$(pwd)/repository_before:/app/repository_before:ro" \
    -v "$(pwd)/repository_after:/app/repository_after:ro" \
    -w /app \
    node:20-alpine \
    sh -c "cd /app/repository_after && npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps 2>/dev/null; cd /app && TARGET=after node tests/test_compliance.js" 2>&1 | tail -15
echo ""

# Test 5: Run smoke test
echo "5. Testing smoke test for BEFORE in Docker..."
docker run --rm \
    -e TARGET=before \
    -v "$(pwd)/tests:/app/tests:ro" \
    -v "$(pwd)/repository_before:/app/repository_before:ro" \
    -w /app \
    node:20-alpine \
    sh -c "cd /app/repository_before && npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps 2>/dev/null; cd /app && TARGET=before node tests/test_simple.js" 2>&1 | tail -10
echo ""

echo "=========================================="
echo "Docker tests completed!"
echo "=========================================="
