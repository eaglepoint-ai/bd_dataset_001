#!/bin/bash

# Test runner script for Redux behavior tests
# Runs tests against both repository_before and repository_after

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "=========================================="
echo "Redux Behavior Test Suite"
echo "=========================================="
echo ""

# Function to run tests for a specific target
run_tests_for_target() {
  local target=$1
  echo "Running tests for repository_${target}..."
  echo "----------------------------------------"
  
  export TARGET=$target
  node tests/test_redux_behavior.js
  
  if [ $? -eq 0 ]; then
    echo "✅ Tests passed for ${target}"
  else
    echo "❌ Tests failed for ${target}"
    return 1
  fi
  echo ""
}

# Check if specific target requested
if [ -n "$1" ]; then
  if [ "$1" == "before" ] || [ "$1" == "after" ]; then
    run_tests_for_target "$1"
  else
    echo "Error: Invalid target '$1'. Use 'before' or 'after'."
    exit 1
  fi
else
  # Run both by default
  echo "Running tests for both versions..."
  echo ""
  
  run_tests_for_target "before"
  BEFORE_RESULT=$?
  
  run_tests_for_target "after"
  AFTER_RESULT=$?
  
  echo "=========================================="
  echo "Final Summary"
  echo "=========================================="
  
  if [ $BEFORE_RESULT -eq 0 ] && [ $AFTER_RESULT -eq 0 ]; then
    echo "✅ All tests passed for both versions"
    exit 0
  else
    echo "❌ Some tests failed"
    exit 1
  fi
fi
