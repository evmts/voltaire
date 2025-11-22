# Native Bindings

Voltaire provides native bindings for maximum performance via Bun FFI and Node-API.

## Architecture

**WASM (ReleaseSmall)**: Optimized for bundle size (~368KB)
**Native (ReleaseFast)**: Optimized for performance (2-10x faster than WASM)

### Supported Platforms

- `darwin-arm64` - macOS Apple Silicon
- `darwin-x64` - macOS Intel
- `linux-arm64` - Linux ARM64
- `linux-x64` - Linux x64
- `win32-x64` - Windows x64

### Runtime Support

- **Bun**: Uses Bun FFI (`dlopen`) - fastest
- **Node.js**: Uses Node-API (native addons) - compatible
- **Browsers**: Falls back to WASM

## Usage

### Default (Pure TypeScript)

```typescript
import * as Keccak256 from '@tevm/voltaire/Keccak256';

const hash = Keccak256.hash(data);
```

### Explicit Native (ReleaseFast)

```typescript
import * as Keccak256 from '@tevm/voltaire/Keccak256/native';

// Async API (auto-loads native library)
const hash = await Keccak256.hash(data);
const hexHash = await Keccak256.hashHex('0x1234');
const strHash = await Keccak256.hashString('hello');

// Sync API (requires library already loaded)
await Keccak256.ensureLoaded();
const hash = Keccak256.hashSync(data);
```

### Explicit WASM (ReleaseSmall)

```typescript
import * as Keccak256 from '@tevm/voltaire/Keccak256/wasm';

const hash = Keccak256.hash(data);
```

## Building

### Build Current Platform

```bash
zig build build-ts-native    # Native FFI (.dylib/.so/.dll) - ReleaseFast
zig build build-ts-wasm      # WASM - ReleaseSmall (size-optimized)
```

### Build All Platforms (Cross-compile)

```bash
# All platforms
zig build build-native-all

# Specific platforms
zig build build-native-darwin-arm64
zig build build-native-darwin-x64
zig build build-native-linux-arm64
zig build build-native-linux-x64
zig build build-native-win32-x64
```

### Package for Distribution

```bash
# Package native binaries
bun run scripts/package-native.ts

# Package specific platform
bun run scripts/package-native.ts darwin-arm64
```

## Distribution

Native binaries are distributed via optional dependencies:

```json
{
  "optionalDependencies": {
    "@tevm/voltaire-darwin-arm64": "0.1.0",
    "@tevm/voltaire-darwin-x64": "0.1.0",
    "@tevm/voltaire-linux-arm64": "0.1.0",
    "@tevm/voltaire-linux-x64": "0.1.0",
    "@tevm/voltaire-win32-x64": "0.1.0"
  }
}
```

Users automatically get the right platform package for their system.

## CI/CD

GitHub Actions workflow builds all platforms:

```yaml
# .github/workflows/build-native.yml
- Matrix builds for all platforms
- Uploads platform-specific artifacts
- Packages for distribution
```

## Testing

### Parity Tests

Ensure native implementations match pure TypeScript:

```bash
bun test src/crypto/Keccak256/Keccak256.parity.test.ts
```

### Platform-Specific Tests

```bash
zig build test-ts-native     # Native FFI tests
zig build test-ts-wasm       # WASM tests
```

## Performance

Native (ReleaseFast) vs WASM (ReleaseSmall):

- **Keccak256 (1KB)**: ~5-10x faster
- **Keccak256 (1MB)**: ~2-5x faster
- **secp256k1 operations**: ~3-8x faster

WASM optimized for bundle size (~368KB vs ~4.5MB ReleaseFast).

## Fallback Strategy

1. Try native binding for current platform
2. Fall back to WASM if native unavailable
3. Fall back to pure TS if WASM unavailable

Users import explicitly - no automatic fallback:

```typescript
// Explicit control
import * as K1 from '@tevm/voltaire/Keccak256';        // Pure TS
import * as K2 from '@tevm/voltaire/Keccak256/native'; // Native
import * as K3 from '@tevm/voltaire/Keccak256/wasm';   // WASM
```

## Implementation Details

### Platform Detection

```typescript
import { getPlatform, isNativeSupported } from '@tevm/voltaire/native-loader';

const platform = getPlatform(); // "darwin-arm64"
const supported = isNativeSupported(); // true/false
```

### Loaders

- **Bun FFI**: `src/native-loader/bun-ffi.ts` - Uses `dlopen`
- **Node-API**: `src/native-loader/node-api.ts` - Uses `require`
- **Unified**: `src/native-loader/index.ts` - Auto-detects runtime

### Build System

- **Source**: `src/c_api.zig` - C API exports
- **Build**: `build.zig:addCrossPlatformNativeBuilds()` - Cross-compile
- **Output**: `zig-out/native/{platform}/libvoltaire_native.{ext}`

## Troubleshooting

### Native library not found

```bash
# Build for your platform
zig build build-ts-native

# Or install platform package
npm install @tevm/voltaire-darwin-arm64
```

### Cross-compilation fails

```bash
# Install Zig cross-compile dependencies
zig build

# Build Rust dependencies first
cargo build --release
```

### Wrong architecture

```typescript
import { getPlatform } from '@tevm/voltaire/native-loader';

console.log(getPlatform()); // Check detected platform
```

## Future Work

- Individual crypto module native builds (tree-shaking)
- Benchmark suite for native vs WASM
- Auto-fallback loader (native → WASM → pure TS)
- Windows ARM64 support
- Android/iOS support
