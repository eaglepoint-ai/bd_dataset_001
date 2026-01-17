#!/bin/bash
# Simple script to generate report.json for CI/CD pipeline

set -e

echo "Generating evaluation report..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Run the evaluation
docker compose run --rm tests sh -c "cd ../evaluation && go run evaluation.go"

# Verify the report was created
if [ -f "report.json" ]; then
    echo "✅ report.json created successfully"
    echo "File size: $(stat -c%s report.json 2>/dev/null || wc -c < report.json) bytes"
else
    echo "❌ Failed to create report.json"
    exit 1
fi