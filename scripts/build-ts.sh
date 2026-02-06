#!/usr/bin/env bash
set -e

# Build script for TypeScript wrapper
# Compiles TypeScript and generates type declarations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Building TypeScript wrapper..."
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "Error: bun is not installed"
    echo "Install from: https://bun.sh"
    exit 1
fi

# Clean previous build
echo "1. Cleaning previous build..."
rm -rf dist/

# Create dist directory
mkdir -p dist

# Build TypeScript with bun
echo ""
echo "2. Compiling TypeScript..."
bun build --target=node --outdir=dist --minify src/index.ts

# Generate type declarations
echo ""
echo "3. Generating type declarations..."
bun x tsc --emitDeclarationOnly --declaration --outDir dist

echo ""
echo "Build complete!"
echo "  Output: dist/"
