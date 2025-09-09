#!/bin/bash

# Build Guillotine static libraries for all major platforms
# Run this from the Guillotine root directory (not sdks/rust)

set -e

echo "========================================="
echo "Building Guillotine for all platforms"
echo "========================================="
echo ""

# Create lib directories for all platforms
echo "Creating library directories..."
mkdir -p sdks/rust/lib/{linux-x64,linux-arm64,macos-x64,macos-arm64,windows-x64}

# Define platforms (Zig target triple : output directory)
declare -a platforms=(
    "x86_64-linux-gnu:linux-x64:libguillotine_ffi_static.a"
    "aarch64-linux-gnu:linux-arm64:libguillotine_ffi_static.a"
    "x86_64-macos:macos-x64:libguillotine_ffi_static.a"
    "aarch64-macos:macos-arm64:libguillotine_ffi_static.a"
    "x86_64-windows-gnu:windows-x64:libguillotine_ffi_static.a"
)

# Track successes and failures
successful=()
failed=()

# Build for each platform
for platform_spec in "${platforms[@]}"; do
    IFS=':' read -r target dir lib_name <<< "$platform_spec"
    
    echo ""
    echo "Building for $target..."
    echo "  Target: $target"
    echo "  Output: sdks/rust/lib/$dir/$lib_name"
    
    if zig build static -Dtarget=$target -Doptimize=ReleaseFast 2>&1 | tee build.log; then
        # Copy the built library
        if [ -f "zig-out/lib/$lib_name" ]; then
            cp "zig-out/lib/$lib_name" "sdks/rust/lib/$dir/"
            echo "  ✅ Successfully built and copied library for $target"
            successful+=("$target")
        else
            echo "  ❌ Build succeeded but library not found at zig-out/lib/$lib_name"
            failed+=("$target (library not found)")
        fi
    else
        echo "  ❌ Failed to build for $target"
        failed+=("$target (build failed)")
    fi
done

# Summary
echo ""
echo "========================================="
echo "Build Summary"
echo "========================================="
echo ""

if [ ${#successful[@]} -gt 0 ]; then
    echo "✅ Successfully built for:"
    for target in "${successful[@]}"; do
        echo "   - $target"
    done
fi

if [ ${#failed[@]} -gt 0 ]; then
    echo ""
    echo "❌ Failed platforms:"
    for target in "${failed[@]}"; do
        echo "   - $target"
    done
fi

# Check total size
echo ""
echo "Library sizes:"
du -sh sdks/rust/lib/*/* 2>/dev/null || echo "No libraries found"

echo ""
echo "Total package size:"
du -sh sdks/rust/lib 2>/dev/null || echo "No lib directory"

# Next steps
echo ""
echo "========================================="
echo "Next Steps"
echo "========================================="
echo ""
echo "1. Test the package locally:"
echo "   cd sdks/rust"
echo "   cargo test"
echo ""
echo "2. Check what will be published:"
echo "   cargo package --list"
echo ""
echo "3. Do a dry run:"
echo "   cargo publish --dry-run"
echo ""
echo "4. Publish to crates.io:"
echo "   cargo publish"
echo ""

# Exit with error if any platform failed
if [ ${#failed[@]} -gt 0 ]; then
    echo "⚠️  Warning: Some platforms failed to build"
    echo "   You may want to fix these before publishing"
    exit 1
fi

echo "✅ All platforms built successfully!"