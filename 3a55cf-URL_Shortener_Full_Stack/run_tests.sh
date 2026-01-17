#!/bin/sh

echo "=== Running Tests ==="

cd /workspace
node tests/test_all.js after
