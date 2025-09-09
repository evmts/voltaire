#!/bin/bash

set -e

# Build the static library first
echo "Building static library..."
cd ../..
zig build static

# Find the crypto libraries - get the most recent ones
BLST_LIB=$(find .zig-cache -name "libblst.a" -type f | xargs ls -t | head -1)
CKZG_LIB=$(find .zig-cache -name "libc-kzg-4844.a" -type f | xargs ls -t | head -1)
BN254_LIB=$(find .zig-cache -name "libbn254_wrapper.a" -type f | xargs ls -t | head -1)

if [ -z "$BLST_LIB" ] || [ -z "$CKZG_LIB" ]; then
    echo "Error: Could not find crypto libraries"
    exit 1
fi

echo "Found libraries:"
echo "  BLST: $BLST_LIB"
echo "  C-KZG: $CKZG_LIB"
echo "  BN254: $BN254_LIB"

# Create a temporary directory for extraction
TEMP_DIR=$(mktemp -d)
echo "Working in $TEMP_DIR"

# Extract all object files
cd "$TEMP_DIR"
ar x "$OLDPWD/zig-out/lib/libguillotine_ffi_static.a"
ar x "$OLDPWD/$BLST_LIB"
ar x "$OLDPWD/$CKZG_LIB"
if [ -n "$BN254_LIB" ]; then
    ar x "$OLDPWD/$BN254_LIB"
fi

# Create the bundled static library
ar rcs libguillotine_ffi_static_bundled.a *.o

# Copy back to the Rust SDK
cp libguillotine_ffi_static_bundled.a "$OLDPWD/sdks/rust/lib/macos-arm64/libguillotine_ffi_static.a"

# Clean up
cd "$OLDPWD"
rm -rf "$TEMP_DIR"

echo "Bundled static library created at sdks/rust/lib/macos-arm64/libguillotine_ffi_static.a"

# Verify symbols are now defined
echo ""
echo "Checking for undefined crypto symbols..."
nm sdks/rust/lib/macos-arm64/libguillotine_ffi_static.a | grep -E "U _(bls12_381|bn254_ecpairing|kzg)" | head -5 || echo "✓ No undefined crypto symbols found"