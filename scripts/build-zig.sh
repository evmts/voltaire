#!/usr/bin/env bash
set -e

# Build script for Zig libraries - both WASM and native C library
# This script is used for the TypeScript wrapper project

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Building Zig primitives libraries..."
echo ""

# Build WASM target for browser/WASI environments
echo "1. Building WASM target (wasm32-wasi, ReleaseSmall)..."
zig build -Dtarget=wasm32-wasi -Doptimize=ReleaseSmall

# Create wasm output directory
mkdir -p wasm

# Copy WASM artifacts to wasm/ directory
echo "   Copying WASM artifacts to wasm/..."
if [ -f "zig-out/lib/primitives_wasm.wasm" ]; then
    cp zig-out/lib/primitives_wasm.wasm wasm/
    echo "   ✓ Copied primitives_wasm.wasm"
else
    echo "   ⚠ Warning: primitives_wasm.wasm not found"
fi

# Build native C library for FFI bindings
echo ""
echo "2. Building native C library (ReleaseFast)..."
zig build -Doptimize=ReleaseFast

# Create native output directory
mkdir -p native

# Copy native artifacts to native/ directory
echo "   Copying native C library artifacts to native/..."
if [ -f "zig-out/lib/libprimitives_c.a" ]; then
    cp zig-out/lib/libprimitives_c.a native/
    echo "   ✓ Copied libprimitives_c.a"
elif [ -f "zig-out/lib/primitives_c.lib" ]; then
    cp zig-out/lib/primitives_c.lib native/
    echo "   ✓ Copied primitives_c.lib"
else
    echo "   ⚠ Warning: C library not found"
fi

if [ -f "zig-out/include/primitives.h" ]; then
    cp zig-out/include/primitives.h native/
    echo "   ✓ Copied primitives.h"
else
    echo "   ⚠ Warning: primitives.h not found"
fi

echo ""
echo "Build complete!"
echo "  WASM artifacts: wasm/"
echo "  Native artifacts: native/"
