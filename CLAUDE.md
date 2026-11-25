### Communication

- Show human plan in most brief form. Prioritize plan before executing.
- BRIEF CONCISE COMMUNICATION
- Sacrifice grammar for sake of brevity
- 1 sentence answers when appropriate
- No fluff like "Congratulations" or "Success"
- Talk like we are just trying to get work done
- Efficient like air traffic controller

### Personality

You are a ruthless mentor. You never sugarcoat anything. And you challenge ideas or assumptions until they are bulletproof.

## MISSION CRITICAL

Every line correct. No stubs/commented tests.

LLMS ARE NEVER TO COMMENT OUT OR DISABLE TESTS

Never make time or work estimates of how long work will take it is not useful context

### Ownership Mindset

**Treat this codebase as YOUR codebase.** You are not a visitor making drive-by changes—you are a maintainer with full responsibility. Every file you touch, every test you run, every error you see is YOUR problem to solve.

### Test Failure Policy

**ALL test failures are P0.** If tests were passing before your changes and fail after, YOU caused the regression regardless of whether the failure appears related. Fix it.

- Never dismiss failures as "pre-existing" or "unrelated"
- Never blame other code, dependencies, or flaky tests
- If main was green and now it's red, your change broke it
- Run full test suite before and after changes
- No excuses—fix every failure you introduce

### Type Error Policy

**ALL type errors are absolutely unacceptable.** TypeScript errors are not warnings—they are failures that block shipping.

- Type errors indicate broken contracts and potential runtime bugs
- Never dismiss type errors as "pre-existing" or "unrelated to my changes"
- If you see type errors after your changes, YOU fix them
- Run `pnpm typecheck` or `tsc --noEmit` to verify before considering work complete
- Zero type errors is the only acceptable state

### Console Policy

**NO console.log/warn/error in library code.** This is a library - users control their own logging.

- Never use `console.*` in src/ (except tests)
- Throw errors instead of logging warnings
- If something is worth warning about, it's worth throwing for

**Status**: Alpha release. Expect frequent refactors/renames. Coordinate changes that affect published exports.

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

**Packages**: `packages/voltaire-zig` (Zig core + C ABI, package `@tevm/zig`), `packages/voltaire-ts` (`@tevm/voltaire`), `packages/voltaire-effect` (`voltaire-effect`, VibeLang + Effect 4), `packages/voltaire-{c,rs,go,py,swift}` (bindings), `apps/playground`.

**Modules** (`packages/voltaire-zig/src/`, mirrored by name in `packages/voltaire-ts/src/`): primitives/ (Address, Hex, Uint, Hash, RLP, ABI, Transaction, Log), crypto/ (Keccak, secp256k1, BLS12-381, BN254, KZG, SHA256, RIPEMD160, Blake2), precompiles/ (EVM precompile impls), evm/, state-manager/, blockchain/, jsonrpc/. TS-only: wasm-loader/ (WASM infra), native-loader/ (Bun FFI / Node-API).

**Docs**: Mintlify sites in `packages/voltaire-ts/docs`, `packages/voltaire-effect/docs`, `packages/voltaire-c/docs`.

**Imports**: ✅ `@import("primitives")` `@import("crypto")` `@import("precompiles")` ❌ `@import("../primitives/address.zig")`

## Build

### Zig Commands

Run from the repo root. `zig build -l` lists every step.

```bash
# Core
zig build                     # Zig libraries (default install step)
zig build test                # All Zig tests (primitives + crypto + precompiles + state-manager + blockchain)
zig build -Doptimize=ReleaseFast # Release build
# No test-filter option exists in build.zig; run the full suite.

# Multi-target
zig build build-ts-native -Dwith-c-api=true  # Native FFI (.dylib/.so) - ReleaseFast; needs libwally-core submodule
zig build build-ts-wasm       # WASM - ReleaseSmall (size-optimized)
zig build build-ts-wasm-fast  # WASM - ReleaseFast (perf-optimized)
zig build crypto-wasm         # Individual crypto WASM (tree-shaking)
zig build -Dwith-c-api=true   # Also build libprimitives_c (zig-out/lib) for C/Rust

# Formatting (CI runs this with --check)
zig fmt build.zig packages/voltaire-zig/src packages/voltaire-zig/lib packages/voltaire-zig/examples

# Benchmarks
zig build bench -Dwith-benches=true                  # zbench Zig benchmarks
zig build bench -Dwith-benches=true -Dfilter=[p]     # Filter zbench benchmarks
cd packages/voltaire-ts && bun run src/crypto/keccak256.bench.ts  # One colocated mitata *.bench.ts suite

# Examples (packages/voltaire-zig/examples)
zig build example-keccak256
zig build example-address
zig build example-secp256k1

# Bindings
zig build test-go -Dwith-c-api=true   # Go tests
zig build test-c-api -Dwith-c-api=true # C API tests

# Utils
zig build clean               # Clean zig-out, .zig-cache, target (keep node_modules)
zig build generate-header     # Regenerate packages/voltaire-zig/src/primitives.h from c_api.zig
```

Broken `zig build` TS wrappers (they call root `bun run` scripts that don't exist, or recurse): `format`, `format-check`, `lint-check`, `lint-deps`, `lint-pkg`, `check`, `ci`, `pre-commit`, `build-ts`, `build-ts-full`, `test-ts-native`, `test-ts-wasm`, `test-integration`, `test-security`. Use the pnpm scripts below.

### Package Scripts

Root scripts fan out with `pnpm -r`; target one package with `--filter`.

```bash
# Build
pnpm --filter @tevm/voltaire build       # tsup dist/ + types/
pnpm --filter @tevm/zig build:wasm       # Build all WASM + stage in packages/voltaire-zig/wasm
pnpm --filter voltaire-effect build      # VibeLang compile to dist/

# Test
pnpm --filter @tevm/voltaire test        # Vitest watch
pnpm --filter @tevm/voltaire test:run    # Vitest single run
pnpm --filter @tevm/voltaire test:coverage # Coverage report
pnpm --filter @tevm/voltaire test:wasm   # WASM tests
pnpm --filter voltaire-effect test:run   # voltaire-effect tests
pnpm test:run                            # Every package

# Docs
cd packages/voltaire-ts/docs && npx mint dev   # Mintlify dev (localhost:3000)

# Quality
pnpm --filter @tevm/voltaire format      # biome format
pnpm --filter @tevm/voltaire lint        # biome check --write
pnpm -r run lint:check                   # CI lint check
pnpm -r run format:check                 # CI format check
pnpm typecheck                           # Every package (tsc / vibelang --noEmit)
```

## TypeScript

### Branded Types + Namespace Pattern

Data-first branded Uint8Arrays with tree-shakable namespace methods:

```typescript
// Type def (AddressType.ts)
export type AddressType = Uint8Array & { readonly __tag: "Address" };

// Internal method (toHex.js - NOTE .js extension!)
export function toHex(data: AddressType): Hex { ... }

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
├── AddressType.ts    # Type definition
├── from.js              # Constructor (no wrapper needed)
├── toHex.js             # Internal method (this: Address)
├── equals.js            # Internal method
├── index.ts             # Dual exports (_internal + wrapper)
└── *.test.ts            # Tests (separate files, NOT inline)
```

### One Function Per File

**Rule**: Each exported function gets its own file. This enables tree-shaking and clear ownership.

**When to split**:
- Every public/exported function → separate file
- Complex private helpers (40+ lines) → separate file with tests
- Simple private helpers (<40 lines, used once) → inline in consumer file
- Constants → colocate with the single function that uses them

**When NOT to split**:
- Tiny utilities like `sleep()` (5 lines) used in one place → inline
- Constants used by only one function → keep in that function's file
- Private helper that's clearly coupled to one function → inline

**Example split**:
```
BlockStream/
├── BlockStream.js           # Main factory, imports from below
├── fetchBlock.js            # 50+ lines, retry logic
├── fetchBlockByHash.js      # 50+ lines, retry logic
├── fetchBlockReceipts.js    # 90+ lines, fallback logic
├── toLightBlock.js          # Small but reused
├── sleep.js                 # Tiny utility (shared)
├── isBlockRangeTooLargeError.js  # Error detection
├── BlockStreamType.ts       # Type definitions
├── index.ts                 # Public exports
└── *.test.ts                # Tests per function
```

**Key patterns**:

- `.js` extension for implementation (NOT .ts)
- JSDoc types in .js files
- Internal methods take data as first param
- Wrapper functions for public API
- Dual exports: `_internal` + wrapper
- Namespace export: `export * as Address`

**Naming**: `Type.fromFoo` (construct from Foo), `Type.toFoo` (convert to Foo), `Type()` preferred over `Type.from()` for main constructor

**Constructor preference**: Use `Address()`, `Frame()`, `Bytes32()` not `Address.from()`, `Frame.from()`, `Bytes32.from()`

## Zig

### Style

- Return memory to user, minimize allocation
- Use subagent to search docs for Zig 0.17.1 API issues
- Simple imperative code
- Single word vars (`n` not `number`), descriptive when needed (`top` not `a`)
- Never abstract into function unless reused
- Long imperative function bodies are good
- defer/errdefer for cleanup

### ArrayList (0.17.1 UNMANAGED)

```zig
var list = std.ArrayList(T).empty;
defer list.deinit(allocator);
try list.append(allocator, item);
```

❌ `.init(allocator)`, `std.ArrayList(T){}`, `list.deinit()`, `list.append(item)` don't exist in 0.17.1

### Module Structure

```
packages/voltaire-zig/src/primitives/root.zig   # Module entry
packages/voltaire-zig/src/crypto/root.zig       # Module entry
packages/voltaire-zig/src/evm/precompiles/root.zig  # Module entry
```

## Testing

### Organization

- **TypeScript**: Separate `*.test.ts` files (vitest, NOT inline)
- **Zig**: Inline tests in source files
- **Benchmarks**: `*.bench.zig` (zbench), `*.bench.ts` (mitata)

### Commands

```bash
# Zig
zig build test                    # All Zig tests (no filter option)

# TypeScript
pnpm test:run                                                # All TS packages
pnpm --filter @tevm/voltaire test:run src/primitives/Address # Filter by path
pnpm --filter @tevm/voltaire test:coverage                   # Coverage

# Benchmarks
zig build bench -Dwith-benches=true       # zbench
cd packages/voltaire-ts && bun run src/<path>.bench.ts   # mitata
```

### Pattern

Self-contained, fix failures immediately, evidence-based debug. **No output = passed**. Debug: `std.testing.log_level = .debug;`

## Documentation

### Mintlify Site

- **Location**: `packages/voltaire-ts/docs/` (also `packages/voltaire-effect/docs/`, `packages/voltaire-c/docs/`)
- **Config**: `docs.json` (Mintlify v4 navigation)
- **Format**: MDX (Markdown + JSX) with YAML frontmatter
- **Guidelines**: `packages/voltaire-ts/docs/CLAUDE.md`
- **Tests**: `docs/docs-index.test.ts`, `docs/docs-samples.test.ts` (run by `pnpm --filter @tevm/voltaire test:run`)

### Commands

```bash
cd packages/voltaire-ts/docs && npx mint dev   # Dev server (localhost:3000)
```

### Auto-generated

- C header: `packages/voltaire-zig/src/primitives.h` (from c_api.zig)
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
pnpm --filter @tevm/zig build:wasm       # All of the above + stage in packages/voltaire-zig/wasm
pnpm --filter @tevm/voltaire test:wasm   # WASM-specific tests
```

### Output (repo root)

- `wasm/primitives.wasm` - Main (ReleaseSmall)
- `wasm/primitives-fast.wasm` - Fast (ReleaseFast)
- `wasm/crypto/*.wasm` - Individual modules

### Notes

- Target: wasm32-wasi (requires libc for C libs)
- HD wallet (libwally-core) calls are stubs that fail in WASM; state-manager and blockchain C APIs are native-only
- Rust crypto uses portable feature (tiny-keccak) for WASM
- Loader: `packages/voltaire-ts/src/wasm-loader/` (instantiation, memory, errors)

## Dependencies

### C Libraries (packages/voltaire-zig/lib/)

- **blst** - BLS12-381 signatures
- **c-kzg-4844** - KZG commitments (EIP-4844)
- **libwally-core** - Wallet utils (git submodule; only built with `-Dwith-c-api=true`)
- blst and c-kzg-4844 are built automatically by `zig build`

### Rust (Cargo.toml → libcrypto_wrappers.a)

- **arkworks**: ark-bn254, ark-bls12-381, ark-ec, ark-ff
- **keccak-asm** - Assembly-optimized (native)
- **tiny-keccak** - Pure Rust (WASM)
- Features: `default = ["asm"]`, `portable = ["tiny-keccak"]`

### Zig (build.zig.zon)

- **zbench** - Performance benchmarking
- **clap** - CLI argument parsing

### Node

- **Mintlify** - Docs site
- **Vitest** - Testing
- **tsup** - Bundling
- **biome** - Format/lint
- **mitata** - JS benchmarks
- **@noble/curves, @noble/hashes** - Reference crypto
- **ox** - Ethereum utilities

### Install

```bash
git submodule update --init --recursive  # Git submodules (libwally-core, execution-apis, skills)
pnpm install                             # Node deps
zig build                                # Zig deps + build C/Rust libs
```

## Scripts

`scripts/` directory automation:

- `run-benchmarks.ts` - Generate BENCHMARKS.md (bun; broken: reads a `comparisons/` dir that no longer exists)
- `measure-bundle-sizes.ts` - Generate BUNDLE-SIZES.md (bun)
- `generate-comparisons.ts` - Compare vs ethers/viem/noble (node)
- `compare-wasm-modes.ts` - ReleaseSmall vs ReleaseFast (bun)
- `packages/voltaire-zig/scripts/generate_c_header.zig` - C API header (`zig build generate-header`)

Run with the runtime in each script's shebang, e.g. `bun scripts/run-benchmarks.ts`.

## Crypto Security

**Constant-time**: `var result: u8 = 0; for (a,b) |x,y| result |= x^y;` ❌ Early returns leak timing
**Validate**: sig (r,s,v), curve points, hash lengths. Clear memory after.
**Test**: known vectors, edge cases (zero/max), malformed inputs, cross-validate refs

## Refs

Zig: https://ziglang.org/documentation/0.17.1/ | Yellow Paper | EIPs

## Collab

Propose→wait. Blocked: stop, explain, wait.

## Git Safety

❌ `git reset --hard` - NEVER use. Destructive, loses work.
❌ `git push --force` - NEVER use without explicit user permission. Always ask first.
❌ Submodule changes - NEVER commit submodule changes without explicit user direction.
✅ `git revert` - Use for reverting commits safely.

## GitHub

"_Note: Claude AI assistant, not @roninjin10 or @fucory_" (all issue/API ops)
