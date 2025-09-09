#!/bin/bash

set -e

echo "Building static library with bundled dependencies..."
cd ../..

# Build the static library first
zig build static

# Find the crypto libraries - get the most recent ones
BLST_LIB=$(find .zig-cache -name "libblst.a" -type f | xargs ls -t | head -1)
CKZG_LIB=$(find .zig-cache -name "libc-kzg-4844.a" -type f | xargs ls -t | head -1)

# Rust-built libraries with crypto implementations
RUST_BN254_LIB="target/debug/libbn254_wrapper.a"
RUST_REVM_LIB="target/debug/librevm_wrapper.a"

if [ -z "$BLST_LIB" ] || [ -z "$CKZG_LIB" ]; then
    echo "Error: Could not find crypto libraries"
    exit 1
fi

if [ ! -f "$RUST_BN254_LIB" ] || [ ! -f "$RUST_REVM_LIB" ]; then
    echo "Error: Rust libraries not found. Please run 'cargo build' first"
    exit 1
fi

echo "Found libraries:"
echo "  BLST: $BLST_LIB"
echo "  C-KZG: $CKZG_LIB"
echo "  Rust BN254: $RUST_BN254_LIB"
echo "  Rust REVM: $RUST_REVM_LIB"

# Use libtool on macOS to combine archives
OUTPUT_LIB="sdks/rust/lib/macos-arm64/libguillotine_ffi_static.a"
mkdir -p "$(dirname "$OUTPUT_LIB")"

echo "Creating bundled library at $OUTPUT_LIB"
libtool -static -o "$OUTPUT_LIB" \
    zig-out/lib/libguillotine_ffi_static.a \
    "$BLST_LIB" \
    "$CKZG_LIB" \
    "$RUST_BN254_LIB" \
    "$RUST_REVM_LIB"

echo "Bundled static library created"

# Verify symbols are now defined
echo ""
echo "Checking for undefined crypto symbols..."
nm "$OUTPUT_LIB" | grep -E "U _(bls12_381|bn254_ecpairing|kzg)" | head -5 || echo "✓ No undefined crypto symbols found"

echo ""
echo "Checking that crypto symbols are now defined..."
nm "$OUTPUT_LIB" | grep -E "T _(bls12_381|kzg|blst)" | head -10