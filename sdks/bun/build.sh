#!/bin/bash

# Build script for Guillotine Bun SDK

echo "🔨 Building Guillotine shared library..."
cd ../..
zig build shared -Doptimize=ReleaseFast

echo "📦 Building TypeScript bindings..."
cd sdks/bun
bun build src/index.ts --outdir dist --target bun

echo "✅ Build complete!"
echo "   Shared library: ../../zig-out/lib/libguillotine_ffi.dylib"
echo "   TypeScript: ./dist/index.js"