#!/bin/bash
set -e

IMAGE_NAME="input-validation"
CONTAINER_NAME="input-validation"
REPORT_DIR="evaluation/reports"

# Ensure image exists
if [[ "$(docker images -q $IMAGE_NAME 2> /dev/null)" == "" ]]; then
  ./build.sh
fi

echo "Starting container..."
docker rm -f $CONTAINER_NAME 2>/dev/null || true
docker run -d --name $CONTAINER_NAME $IMAGE_NAME

echo "Running Unit Tests..."
docker exec $CONTAINER_NAME python -m pytest tests/

echo "Running Evaluation..."
docker exec $CONTAINER_NAME python evaluation/evaluation.py

echo "Use 'docker cp $CONTAINER_NAME:/app/evaluation/report.json .' to calculate results locally if needed."