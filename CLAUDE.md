### Communication

- Show human plan in most brief form. Prioritize plan before executing.
- BRIEF CONCISE COMMUNICATION
- Sacrifice grammar for sake of brevity
- 1 sentence answers when appropriate
- No fluff like "Congratulations" or "Success"
- Talk like we are just trying to get work done
- Efficient like air traffic controller

## MISSION CRITICAL

Every line correct. No stubs/commented tests.

LLMS ARE NEVER TO COMMENT OUT OR DISABLE TESTS

### Workflow

- Run from repo root (never `cd` unless user requests it)
- Sensitive data: abort everything immediately
- Plan ownership/deallocation when writing zig
- Think hard about typesafety when writing typescript
- As often as possible: `zig build && zig build test` (TDD). Always know early and often if build breaks
- Not obvious? Improve visibility, write unit tests
- Producing a failing minimal reproduction of the bug in a test we commit is the best way to fix a bug

## Architecture

Ethereum primitives + crypto. Multi-language: TS + Zig + Rust + C.

**Modules**: primitives/ (Address, Hex, Uint, Hash, RLP, ABI, Transaction, Log), crypto/ (Keccak, secp256k1, BLS12-381, BN254, KZG, SHA256, RIPEMD160, Blake2), precompiles/ (EVM precompile impls), content/docs/ (Astro Starlight MDX docs), wasm-loader/ (WASM infra)

**Imports**: ✅ `@import("primitives")` `@import("crypto")` `@import("precompiles")` ❌ `@import("../primitives/address.zig")`

**Colocated**: address.ts + address.zig in same folder

## Build

### Zig Commands

```bash
# Core
zig build                     # Full build (Zig + TS typecheck + C libs)
zig build test                # All Zig tests (primitives + crypto + precompiles)
zig build -Dtest-filter=[p]   # Filter tests
zig build --release=fast      # Release build

# Multi-target
zig build build-ts-native     # Native FFI (.dylib/.so) - ReleaseFast
zig build build-ts-wasm       # WASM - ReleaseSmall (size-optimized)
zig build build-ts-wasm-fast  # WASM - ReleaseFast (perf-optimized)
zig build crypto-wasm         # Individual crypto WASM (tree-shaking)

# Quality
zig build format              # Format Zig + TS
zig build format-check        # Check formatting
zig build lint                # Lint TS (auto-fix)
zig build lint-check          # Check linting
zig build check               # Quick validation (format + lint + typecheck)
zig build ci                  # Complete CI pipeline

# Testing variants
zig build test-ts             # All TS tests (vitest)
zig build test-ts-native      # Native FFI tests
zig build test-ts-wasm        # WASM tests
zig build test-integration    # Integration tests
zig build test-security       # Security tests

# Benchmarks
zig build bench               # zbench Zig benchmarks
zig build bench-ts            # TS comparison benchmarks
zig build -Dbench-filter=[p]  # Filter benchmarks

# Examples (examples/ dir)
zig build example-keccak256
zig build example-address
zig build example-secp256k1

# Utils
zig build clean               # Clean artifacts (keep node_modules)
zig build clean-all           # Deep clean + node_modules
zig build deps                # Install/update all deps
zig build generate-header     # Generate C header from c_api.zig
```

### Package Scripts

```bash
# Build
bun run build                 # Full (Zig + dist + types)
bun run build:zig             # zig build
bun run build:wasm            # Both WASM modes
bun run build:dist            # TS bundling (tsup)

# Test
bun run test                  # Vitest watch
bun run test:run              # Vitest single run
bun run test:coverage         # Coverage report
bun run test:native           # Native FFI tests
bun run test:wasm             # WASM tests

# Docs
bun run docs:dev              # Astro dev (localhost:4321)
bun run docs:build            # Build docs site
bun run docs:preview          # Preview built docs

# Quality
bun run format                # biome format
bun run lint                  # biome lint

# Analysis
bun run bench                 # Benchmarks + BENCHMARKING.md
bun run size                  # Bundle size analysis
```

## TypeScript

### Branded Types + Namespace Pattern

Data-first branded Uint8Arrays with tree-shakable namespace methods:

```typescript
// Type def (BrandedAddress.ts)
export type BrandedAddress = Uint8Array & { readonly __tag: "Address" };

// Internal method (toHex.js - NOTE .js extension!)
export function toHex(data: BrandedAddress): Hex { ... }

// Index: dual export (index.ts)
export { toHex as _toHex } from "./toHex.js";   // Internal API
export function toHex(value: AddrInput): Hex {  // Public wrapper
  return _toHex(from(value));
}

// Usage
import * as Address from './primitives/Address/index.js';
Address.toHex("0x123...")      // Public (wrapper auto-converts)
Address._toHex(addr)           // Advanced (internal, no conversion)
```

**File organization**:
```
Address/
├── BrandedAddress.ts    # Type definition
├── from.js              # Constructor (no wrapper needed)
├── toHex.js             # Internal method (this: Address)
├── equals.js            # Internal method
├── index.ts             # Dual exports (_internal + wrapper)
└── *.test.ts            # Tests (separate files, NOT inline)
```

**Key patterns**:
- `.js` extension for implementation (NOT .ts)
- JSDoc types in .js files
- Internal methods take data as first param
- Wrapper functions for public API
- Dual exports: `_internal` + wrapper
- Namespace export: `export * as Address`

**Naming**: `Type.fromFoo` (construct from Foo), `Type.toFoo` (convert to Foo), loose `Type.from` (any input)

## Zig

### Style

- Return memory to user, minimize allocation
- Use subagent to search docs for Zig 0.15.1 API issues
- Simple imperative code
- Single word vars (`n` not `number`), descriptive when needed (`top` not `a`)
- Never abstract into function unless reused
- Long imperative function bodies are good
- defer/errdefer for cleanup

### ArrayList (0.15.1 UNMANAGED)

```zig
var list = std.ArrayList(T){};
defer list.deinit(allocator);
try list.append(allocator, item);
```

❌ `.init(allocator)`, `list.deinit()`, `list.append(item)` don't exist in 0.15.1

### Module Structure

```
src/primitives/root.zig   # Module entry
src/crypto/root.zig       # Module entry
src/precompiles/root.zig  # Module entry
```

## Testing

### Organization

- **TypeScript**: Separate `*.test.ts` files (vitest, NOT inline)
- **Zig**: Inline tests in source files
- **Benchmarks**: `*.bench.zig` (zbench), `*.bench.ts` (mitata)

### Commands

```bash
# Zig
zig build test                    # All Zig tests
zig build -Dtest-filter=address   # Filter

# TypeScript
bun run test:run                  # All TS tests
bun run test -- address           # Filter
bun run test:coverage             # Coverage

# Benchmarks
zig build bench                   # zbench
bun run bench                     # mitata + generate BENCHMARKING.md
```

### Pattern

Self-contained, fix failures immediately, evidence-based debug. **No output = passed**. Debug: `std.testing.log_level = .debug;`

## Documentation

### Astro Starlight Site

- **Location**: `src/content/docs/`
- **Format**: MDX (Markdown + JSX) or MD
- **Structure**: Hybrid (centralized + colocated)
  - Centralized: `src/content/docs/primitives/{address,uint,hash,hex,transaction,bytecode,chain,denomination,base64,binarytree,bloomfilter}/` (11 primitives)
  - Colocated: `src/primitives/{Abi,AccessList,Authorization,Blob,EventLog,FeeMarket,GasConstants,Hardfork,Opcode,Rlp,Siwe,State}/*.mdx` (12 primitives, symlinked to `src/content/docs/primitives/`)
  - Overview: `src/content/docs/getting-started.mdx`, crypto docs

### Colocated Documentation Pattern

Primitives with colocated docs use symlinks for Starlight integration:
- Source: `src/primitives/{PascalCase}/index.mdx`
- Symlink: `src/content/docs/primitives/{lowercase} → ../../../primitives/{PascalCase}`
- New primitives: Create docs in `src/primitives/{Name}/` and symlink to `src/content/docs/primitives/{name}`

### Commands

```bash
bun run docs:dev      # Dev server (localhost:4321)
bun run docs:build    # Production build
bun run docs:preview  # Preview production
```

### Auto-generated

- C header: `src/primitives.h` (from c_api.zig)
- Regenerate: `zig build generate-header`

## WASM

### Build Modes

- **ReleaseSmall**: Size-optimized for production bundles
- **ReleaseFast**: Performance-optimized for benchmarking

### Commands

```bash
zig build build-ts-wasm       # ReleaseSmall
zig build build-ts-wasm-fast  # ReleaseFast
zig build crypto-wasm         # Individual modules (tree-shaking)
bun run test:wasm             # WASM-specific tests
```

### Output

- `wasm/primitives.wasm` - Main (ReleaseSmall)
- `wasm/primitives-fast.wasm` - Fast (ReleaseFast)
- `wasm/crypto/*.wasm` - Individual modules

### Notes

- Target: wasm32-wasi (requires libc for C libs)
- KZG stubbed in WASM (not supported)
- Rust crypto uses portable feature (tiny-keccak) for WASM
- Loader: `src/wasm-loader/` (instantiation, memory, errors)

## Dependencies

### C Libraries (lib/)

- **blst** - BLS12-381 signatures
- **c-kzg-4844** - KZG commitments (EIP-4844)
- **libwally-core** - Wallet utils (git submodule)
- Built automatically by `zig build`

### Rust (Cargo.toml → libcrypto_wrappers.a)

- **arkworks**: ark-bn254, ark-bls12-381, ark-ec, ark-ff
- **keccak-asm** - Assembly-optimized (native)
- **tiny-keccak** - Pure Rust (WASM)
- Features: `default = ["asm"]`, `portable = ["tiny-keccak"]`

### Zig (build.zig.zon)

- **zbench** - Performance benchmarking
- **clap** - CLI argument parsing

### Node

- **Astro + Starlight** - Docs site
- **Vitest** - Testing
- **tsup** - Bundling
- **biome** - Format/lint
- **mitata** - JS benchmarks
- **@noble/curves, @noble/hashes** - Reference crypto

### Install

```bash
bun install                        # Node deps
zig build                          # Zig deps + build C/Rust libs
git submodule update --init        # Git submodules
```

## Scripts

`scripts/` directory automation:

- `run-benchmarks.ts` - Generate BENCHMARKING.md
- `measure-bundle-sizes.ts` - Generate BUNDLE-SIZES.md
- `generate-comparisons.ts` - Compare vs ethers/viem/noble
- `generate_c_header.zig` - Auto-generate C API header
- `compare-wasm-modes.ts` - ReleaseSmall vs ReleaseFast

Run: `bun run scripts/<name>.ts`

## Crypto Security

**Constant-time**: `var result: u8 = 0; for (a,b) |x,y| result |= x^y;` ❌ Early returns leak timing
**Validate**: sig (r,s,v), curve points, hash lengths. Clear memory after.
**Test**: known vectors, edge cases (zero/max), malformed inputs, cross-validate refs

## Refs

Zig: https://ziglang.org/documentation/0.15.1/ | Yellow Paper | EIPs

## Collab

Propose→wait. Blocked: stop, explain, wait.

## GitHub

"_Note: Claude AI assistant, not @roninjin10 or @fucory_" (all issue/API ops)
