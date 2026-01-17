#!/bin/sh

set -e

echo "=== URL Shortener Task Setup ==="
echo ""

echo "Verifying Node.js version..."
node --version

echo ""
echo "Verifying file structure..."

check_file() {
  if [ -f "$1" ]; then
    echo "  ✓ $1"
  else
    echo "  ✗ $1 (missing)"
  fi
}

echo ""
echo "Repository After (complete implementation):"
check_file "repository_after/server/package.json"
check_file "repository_after/server/src/index.js"
check_file "repository_after/server/src/db.js"
check_file "repository_after/server/src/routes/urls.js"
check_file "repository_after/server/src/routes/redirect.js"
check_file "repository_after/server/src/utils/validation.js"
check_file "repository_after/client/package.json"
check_file "repository_after/client/src/App.jsx"
check_file "repository_after/client/src/components/UrlForm.jsx"
check_file "repository_after/client/src/components/UrlList.jsx"

echo ""
echo "Test files:"
check_file "tests/test_all.js"
check_file "evaluation/evaluation.js"

echo ""
echo "Note: repository_before is intentionally empty (this is a feature development task)"

echo ""
echo "✅ Setup complete!"
