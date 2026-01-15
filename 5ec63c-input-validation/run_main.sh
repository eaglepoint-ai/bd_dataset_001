#!/bin/bash
set -e

IMAGE_NAME="input-validation"
CONTAINER_NAME="input-validation"

# Ensure image exists
if [[ "$(docker images -q $IMAGE_NAME 2> /dev/null)" == "" ]]; then
  ./build.sh
fi

echo "Running main demo..."
docker compose run --rm input-validation python repository_after/main.py