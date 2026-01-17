#!/bin/sh

echo "=== Running Evaluation ==="

cd /workspace
mkdir -p evaluation/reports
node evaluation/evaluation.js

echo ""
echo "Reports saved in: evaluation/reports/"
ls -la evaluation/reports/
