#!/bin/sh

set -e

echo "=== Running Tests on BEFORE (Buggy) Version ==="
echo ""

cd tests
node test.js before

echo ""
echo "✅ Before version test completed!"

