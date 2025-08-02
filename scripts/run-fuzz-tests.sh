#!/bin/bash
set -e

echo "Building and running fuzz tests in Docker..."
cd "$(dirname "$0")/.."

# Build the Docker image
docker build -f .docker/Dockerfile.fuzz -t guillotine-fuzz .

# Run the fuzz tests
echo "Running fuzz tests..."
docker run --rm -it \
  -v "$(pwd)":/app \
  -p 8080:8080 \
  guillotine-fuzz \
  zig build fuzz-compare --fuzz --port 8080

echo "Fuzz tests completed!"