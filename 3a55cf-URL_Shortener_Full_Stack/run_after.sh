#!/bin/sh

set -e

echo "=== Running Tests on AFTER (Complete) Version ==="
echo ""

node tests/test_all.js after

echo ""
echo "✅ After version test completed!"
