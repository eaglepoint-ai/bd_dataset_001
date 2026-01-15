#!/bin/bash
set -e

IMAGE_NAME="input-validation"
CONTAINER_NAME="input-validation"
REPORT_DIR="evaluation/reports"

# Ensure image exists
if [[ "$(docker images -q $IMAGE_NAME 2> /dev/null)" == "" ]]; then
  ./build.sh
fi

echo "Running Unit Tests..."
docker compose run --rm input-validation python -m pytest tests/

echo "Running Evaluation..."
docker compose run --rm input-validation python evaluation/evaluation.py

echo "Evaluation complete. Report saved in evaluation directory."