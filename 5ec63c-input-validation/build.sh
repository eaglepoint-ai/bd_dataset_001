#!/bin/bash
set -e

IMAGE_NAME="input-validation"

echo "Building Docker image using Docker Compose..."
docker compose build input-validation

echo "Build complete."
