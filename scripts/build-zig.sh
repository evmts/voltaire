#!/usr/bin/env bash

# Build script for Zig libraries - native C library for FFI bindings
# This script is used for the TypeScript wrapper project
#
# NOTE: WASM target is currently not supported due to dependencies on
# Rust and C libraries (blst, c-kzg-4844, crypto_wrappers) that cannot
# be compiled to WASM. Future work could involve:
# - Porting dependencies to WASM-compatible versions
# - Using emscripten for C libraries
# - Creating pure Zig implementations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "Building Zig primitives library..."
echo ""

# Build native C library for FFI bindings
# Ignore benchmark build failures - they don't affect the library build
echo "Building native C library (ReleaseFast)..."
zig build -Doptimize=ReleaseFast 2>&1 || true

# Verify the library was built (exit code doesn't matter if libs exist)
if [ ! -f "zig-out/lib/libprimitives_c.a" ] && [ ! -f "zig-out/lib/libprimitives_c.dylib" ] && [ ! -f "zig-out/lib/primitives_c.lib" ]; then
    echo ""
    echo "✗ Build failed - no library artifacts found!"
    exit 1
fi

# Create native output directory
mkdir -p native

# Copy native artifacts to native/ directory
echo ""
echo "Copying native C library artifacts to native/..."

# Static library
if [ -f "zig-out/lib/libprimitives_c.a" ]; then
    cp zig-out/lib/libprimitives_c.a native/
    echo "  ✓ libprimitives_c.a"
elif [ -f "zig-out/lib/primitives_c.lib" ]; then
    cp zig-out/lib/primitives_c.lib native/
    echo "  ✓ primitives_c.lib (Windows)"
fi

# Dynamic library
if [ -f "zig-out/lib/libprimitives_c.dylib" ]; then
    cp zig-out/lib/libprimitives_c.dylib native/
    echo "  ✓ libprimitives_c.dylib (macOS)"
elif [ -f "zig-out/lib/libprimitives_c.so" ]; then
    cp zig-out/lib/libprimitives_c.so native/
    echo "  ✓ libprimitives_c.so (Linux)"
elif [ -f "zig-out/lib/primitives_c.dll" ]; then
    cp zig-out/lib/primitives_c.dll native/
    echo "  ✓ primitives_c.dll (Windows)"
fi

# Header file
if [ -f "zig-out/include/primitives.h" ]; then
    cp zig-out/include/primitives.h native/
    echo "  ✓ primitives.h"
else
    echo "  ✗ primitives.h not found!"
    exit 1
fi

echo ""
echo "Build complete!"
echo "  Output directory: native/"
