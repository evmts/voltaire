# Publishing guillotine-rs to crates.io

This document describes how to publish the Guillotine Rust SDK to crates.io.

## Prerequisites

1. **Build the Zig library** for all target platforms
2. **Place pre-compiled libraries** in the appropriate directories
3. **Have a crates.io account** with publishing rights

## Directory Structure for Pre-compiled Libraries

The package expects pre-compiled libraries in the following structure:

```
sdks/rust/
├── lib/
│   ├── linux-x64/
│   │   └── libguillotine_ffi_static.a
│   ├── linux-arm64/
│   │   └── libguillotine_ffi_static.a
│   ├── macos-x64/
│   │   └── libguillotine_ffi_static.a
│   ├── macos-arm64/
│   │   └── libguillotine_ffi_static.a
│   └── windows-x64/
│       └── guillotine_ffi_static.lib
```

## Building Libraries for Each Platform

### macOS (ARM64)
```bash
zig build static -Dtarget=aarch64-macos
cp zig-out/lib/libguillotine_ffi_static.a sdks/rust/lib/macos-arm64/
```

### macOS (x64)
```bash
zig build static -Dtarget=x86_64-macos
cp zig-out/lib/libguillotine_ffi_static.a sdks/rust/lib/macos-x64/
```

### Linux (x64)
```bash
zig build static -Dtarget=x86_64-linux-gnu
cp zig-out/lib/libguillotine_ffi_static.a sdks/rust/lib/linux-x64/
```

### Linux (ARM64)
```bash
zig build static -Dtarget=aarch64-linux-gnu
cp zig-out/lib/libguillotine_ffi_static.a sdks/rust/lib/linux-arm64/
```

### Windows (x64)
```bash
zig build static -Dtarget=x86_64-windows
cp zig-out/lib/guillotine_ffi_static.lib sdks/rust/lib/windows-x64/
```

## Publishing Steps

1. **Update version** in `Cargo.toml`
   ```toml
   version = "0.1.1"  # increment as needed
   ```

2. **Verify package contents**:
   ```bash
   cd sdks/rust
   cargo package --list
   ```

3. **Run tests**:
   ```bash
   cargo test
   ```

4. **Dry run** (recommended):
   ```bash
   cargo publish --dry-run
   ```

5. **Publish**:
   ```bash
   cargo publish
   ```

## Alternative: Source-only Package

If you prefer users to build from source, you can publish without pre-compiled libraries:

1. Update `Cargo.toml` to note build requirements:
   ```toml
   [package.metadata]
   build-from-source = true
   zig-version = "0.15.0"
   ```

2. Update README with clear build instructions

3. Consider using a `build.rs` that downloads and builds the Zig code

## Important Notes

- Package names on crates.io are unique and first-come, first-served
- Once published, versions cannot be deleted (only yanked)
- The package size limit is 10MB (compressed)
- Consider using GitHub releases for pre-compiled binaries if they're too large

## Yanking a Version

If you need to prevent a broken version from being used:
```bash
cargo yank --version 0.1.0
```

To un-yank:
```bash
cargo yank --version 0.1.0 --undo
```