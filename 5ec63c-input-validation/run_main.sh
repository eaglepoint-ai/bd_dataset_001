#!/bin/bash
set -e

IMAGE_NAME="input-validation"
CONTAINER_NAME="input-validation"

# Ensure image exists
if [[ "$(docker images -q $IMAGE_NAME 2> /dev/null)" == "" ]]; then
  ./build.sh
fi

echo "Running main demo..."
docker rm -f $CONTAINER_NAME 2>/dev/null || true
docker run -d --name $CONTAINER_NAME $IMAGE_NAME
docker exec $CONTAINER_NAME python repository_after/main.py