#!/bin/bash

set -e

echo "Building release-optimized static library with bundled dependencies..."
cd ../..

# Build the static library in release mode
echo "Building Zig library with ReleaseFast..."
zig build static -Doptimize=ReleaseFast

# Build Rust dependencies in release mode
echo "Building Rust dependencies in release mode..."
cargo build --release

# Find the crypto libraries - get the most recent ones
BLST_LIB=$(find .zig-cache -name "libblst.a" -type f | xargs ls -t | head -1)
CKZG_LIB=$(find .zig-cache -name "libc-kzg-4844.a" -type f | xargs ls -t | head -1)

# Release-built Rust libraries with crypto implementations
RUST_BN254_LIB="target/release/libbn254_wrapper.a"
RUST_REVM_LIB="target/release/librevm_wrapper.a"

if [ -z "$BLST_LIB" ] || [ -z "$CKZG_LIB" ]; then
    echo "Error: Could not find crypto libraries"
    exit 1
fi

if [ ! -f "$RUST_BN254_LIB" ] || [ ! -f "$RUST_REVM_LIB" ]; then
    echo "Error: Rust release libraries not found. Please run 'cargo build --release' first"
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

echo "Creating bundled release library at $OUTPUT_LIB"
libtool -static -o "$OUTPUT_LIB" \
    zig-out/lib/libguillotine_ffi_static.a \
    "$BLST_LIB" \
    "$CKZG_LIB" \
    "$RUST_BN254_LIB" \
    "$RUST_REVM_LIB" 2>/dev/null || true

echo "Bundled release library created"

# Check library size
SIZE=$(ls -lh "$OUTPUT_LIB" | awk '{print $5}')
echo "Library size: $SIZE"

# Verify key symbols are present
echo ""
echo "Verifying symbols..."
nm "$OUTPUT_LIB" 2>/dev/null | grep -E "T _guillotine_evm_create" | head -1 && echo "✓ EVM creation functions present"
nm "$OUTPUT_LIB" 2>/dev/null | grep -E "T _guillotine_call" | head -1 && echo "✓ Call execution functions present"
nm "$OUTPUT_LIB" 2>/dev/null | grep -E "T _(bls12_381_g1_add|bn254_ecpairing)" | head -2 && echo "✓ Crypto functions present"