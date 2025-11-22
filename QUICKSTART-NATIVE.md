# Native Bindings Quick Start

## Build Native Libraries

```bash
# Build for current platform
zig build build-ts-native

# Build all platforms (cross-compile)
zig build build-native-all

# Build specific platform
zig build build-native-darwin-arm64
```

## Use Native Keccak256

```typescript
// Import native version
import * as Keccak256 from '@tevm/voltaire/Keccak256/native';

// Async API (recommended)
const hash = await Keccak256.hash(new Uint8Array([1, 2, 3]));
const hexHash = await Keccak256.hashHex('0x1234');
const strHash = await Keccak256.hashString('hello world');
const sel = await Keccak256.selector('transfer(address,uint256)');
const topic = await Keccak256.topic('Transfer(address,address,uint256)');

// Sync API (after loading)
await Keccak256.ensureLoaded();
const hash2 = Keccak256.hashSync(data);
```

## Compare Implementations

```typescript
// Pure TypeScript (default, always available)
import * as Pure from '@tevm/voltaire/Keccak256';

// Native (ReleaseFast, 2-10x faster)
import * as Native from '@tevm/voltaire/Keccak256/native';

// WASM (ReleaseSmall, smallest bundle)
import * as Wasm from '@tevm/voltaire/Keccak256/wasm';

const data = new Uint8Array([1, 2, 3]);

const pureHash = Pure.hash(data);           // Sync, ~100ns
const nativeHash = await Native.hash(data); // Async, ~10ns
const wasmHash = Wasm.hash(data);           // Sync, ~50ns
```

## Test Parity

```bash
# Run parity tests
bun test src/crypto/Keccak256/Keccak256.parity.test.ts

# Test all implementations match
bun test --run
```

## Package for Distribution

```bash
# After building all platforms
bun run scripts/package-native.ts

# Check output
ls -lh native/*/voltaire.*.node
```

## Available Zig Commands

```bash
# Build
zig build build-native-all           # All platforms
zig build build-native-darwin-arm64  # macOS ARM64
zig build build-native-darwin-x64    # macOS Intel
zig build build-native-linux-arm64   # Linux ARM64
zig build build-native-linux-x64     # Linux x64
zig build build-native-win32-x64     # Windows x64

# Test
zig build test-ts-native            # Native FFI tests
zig build test                      # All Zig tests
bun test                            # All TypeScript tests
```

## Runtime Detection

```typescript
import { isBun, isNode, getPlatform } from '@tevm/voltaire/native-loader';

console.log('Runtime:', isBun() ? 'Bun' : isNode() ? 'Node' : 'Unknown');
console.log('Platform:', getPlatform()); // "darwin-arm64"
```

## Performance Tips

1. **Use native for hot paths**: 2-10x faster than WASM
2. **Use WASM for browsers**: Smallest bundle (~368KB)
3. **Use pure TS for fallback**: Zero native deps
4. **Preload native library**: Call `ensureLoaded()` at startup
5. **Use sync API after load**: Avoid async overhead in loops

## Common Issues

### Native library not found
```bash
# Solution: Build native library
zig build build-ts-native
```

### Platform not supported
```typescript
import { isNativeSupported } from '@tevm/voltaire/native-loader';

if (!isNativeSupported()) {
  // Fall back to WASM or pure TS
  const { hash } = await import('@tevm/voltaire/Keccak256');
}
```

### Async overhead
```typescript
// Bad: Async in tight loop
for (let i = 0; i < 1000; i++) {
  await Keccak256.hash(data);
}

// Good: Use sync after preload
await Keccak256.ensureLoaded();
for (let i = 0; i < 1000; i++) {
  Keccak256.hashSync(data);
}
```

## Next Steps

See [NATIVE-BINDINGS.md](./NATIVE-BINDINGS.md) for complete documentation.
