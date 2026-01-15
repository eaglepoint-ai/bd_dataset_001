#!/bin/bash
set -e

IMAGE_NAME="input-validation"

echo "Building Docker image: $IMAGE_NAME..."
docker build -t $IMAGE_NAME .

echo "Build complete."
