#!/bin/bash
set -e

# Disable LTO to avoid LLVM version issues
export CARGO_PROFILE_RELEASE_LTO="off"

# Build Guillotine (this also builds Rust libraries)
echo "Building Guillotine..."
zig build

# Determine architecture
ARCH=$(uname -m)
if [ "$ARCH" = "aarch64" ]; then
    RUST_TARGET="aarch64-unknown-linux-gnu"
else
    RUST_TARGET="x86_64-unknown-linux-gnu"
fi

# Build bn254_wrapper as shared library to avoid Rust std linking issues
echo "Building bn254_wrapper as shared library..."
# Temporarily change to cdylib
sed -i 's/crate-type = \["cdylib", "staticlib"\]/crate-type = ["cdylib"]/' lib/ark/Cargo.toml 2>/dev/null || \
sed -i 's/crate-type = \["staticlib"\]/crate-type = ["cdylib"]/' lib/ark/Cargo.toml 2>/dev/null || true
cargo build --release --target $RUST_TARGET --manifest-path lib/ark/Cargo.toml
# Copy the shared library
if [ -f "target/$RUST_TARGET/release/libbn254_wrapper.so" ]; then
    cp "target/$RUST_TARGET/release/libbn254_wrapper.so" zig-out/lib/
fi
# Also keep the static library if it exists
if [ -f "target/$RUST_TARGET/release/libbn254_wrapper.a" ]; then
    cp "target/$RUST_TARGET/release/libbn254_wrapper.a" zig-out/lib/
fi

# Build foundry_wrapper as shared library
echo "Building foundry_wrapper as shared library..."
sed -i 's/crate-type = \["staticlib"\]/crate-type = ["cdylib"]/' lib/foundry-compilers/Cargo.toml 2>/dev/null || true
cargo build --release --target $RUST_TARGET --manifest-path lib/foundry-compilers/Cargo.toml
if [ -f "target/$RUST_TARGET/release/libfoundry_wrapper.so" ]; then
    cp "target/$RUST_TARGET/release/libfoundry_wrapper.so" zig-out/lib/
fi

# Export Rust library path for Go linker
export RUST_LIB_PATH=$(rustc --print sysroot)/lib/rustlib/$RUST_TARGET/lib
export CGO_LDFLAGS="-L$RUST_LIB_PATH $CGO_LDFLAGS"

# Build CLI
cd apps/cli
echo "Building CLI..."
go build -o guillotine-cli .
cd ../..

# Run the command
if [ "$#" -eq 0 ]; then
    exec apps/cli/guillotine-cli --help
else
    exec "$@"
fi