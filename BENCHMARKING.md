# Benchmarking Infrastructure

Complete benchmarking setup for comparing Zig WASM, JavaScript, ethers, and viem implementations across all primitives.

## Quick Start

```bash
# Build both WASM optimization modes
bun run build:wasm

# Run all benchmarks
bun run bench

# Measure bundle sizes
bun run size

# Check size limits (CI)
bun run bench:size
```

## WASM Optimization Modes

### ReleaseSmall (Production)
- **File:** `wasm/primitives.wasm`
- **Size:** ~286 KB
- **Use:** Production bundles, minimized file size
- **Build:** `zig build build-ts-wasm`

### ReleaseFast (Benchmarking)
- **File:** `wasm/primitives-fast.wasm`
- **Size:** ~2.3 MB (8.3x larger)
- **Use:** Performance testing, maximum speed
- **Build:** `zig build build-ts-wasm-fast`

## Architecture

### 1. WASM Loader (`src/wasm-loader/loader.ts`)

Supports loading different WASM files:

```typescript
import { loadWasm } from "./wasm-loader/loader.js";

// Load ReleaseSmall (default)
await loadWasm(new URL("./wasm/primitives.wasm", import.meta.url));

// Load ReleaseFast for benchmarking
await loadWasm(new URL("./wasm/primitives-fast.wasm", import.meta.url), true);
```

The `forceReload` parameter allows switching between WASM files during runtime (useful for benchmarking).

### 2. WASM Bindings

Each primitive can have a `.wasm.ts` file exporting WASM-backed operations:

**Example: `Address.wasm.ts`**
```typescript
import * as loader from "../../wasm-loader/loader.js";

export const Address = {
  fromHex: (hex: string) => loader.addressFromHex(hex),
  toHex: (addr) => loader.addressToHex(addr),
  toChecksummed: (addr) => loader.addressToChecksumHex(addr),
  // ... all Address methods
};
```

### 3. Benchmark Structure

Benchmarks follow this pattern (see `Address.bench.ts`):

```typescript
import { bench, run } from "mitata";
import { Address as JsAddress } from "./Address.js";
import { Address as WasmAddress } from "./Address.wasm.js";
import { loadWasm } from "../../wasm-loader/loader.js";
import { getAddress as ethersGetAddress } from "ethers";
import { getAddress as viemGetAddress } from "viem";

// Load WASM before benchmarks
await loadWasm(new URL("../../wasm-loader/primitives.wasm", import.meta.url));

// Benchmark each operation
bench("Address.fromHex - JS", () => {
  JsAddress.fromHex("0x...");
});

bench("Address.fromHex - WASM", () => {
  WasmAddress.fromHex("0x...");
});

bench("Address.fromHex - ethers", () => {
  ethersGetAddress("0x...");
});

bench("Address.fromHex - viem", () => {
  viemGetAddress("0x...");
});

await run();
```

## Current Status

### ✅ Completed
- [x] Address.wasm.ts implementation with full FFI bindings
- [x] Build system supports both ReleaseSmall and ReleaseFast
- [x] WASM loader supports switching between optimization modes
- [x] Address.bench.ts connected to WASM implementation
- [x] size-limit configured for CI bundle size tracking
- [x] Custom bundle size measurement script
- [x] npm scripts for benchmarking and size checking

### 📋 Primitives Status

| Primitive | TypeScript | WASM | Benchmark | Notes |
|-----------|-----------|------|-----------|-------|
| Address | ✅ | ✅ | ✅ | **Complete** - WASM newly added |
| Hex | ✅ | ✅ | ✅ | Complete |
| Uint | ✅ | ✅ | ✅ | Complete |
| Hash | ✅ | ✅ | ✅ | Complete |
| Rlp | ✅ | ✅ | ✅ | Complete |
| Transaction | ✅ | ✅ | ✅ | Complete |
| AccessList | ✅ | ✅ | ✅ | Complete |
| Authorization | ✅ | ✅ | ✅ | Complete |
| Blob | ✅ | ✅ | ✅ | Complete |
| Bytecode | ✅ | ✅ | ✅ | Complete |
| EventLog | ✅ | ✅ | ✅ | Complete |
| FeeMarket | ✅ | ✅ | ✅ | Complete |
| GasConstants | ✅ | ✅ | ✅ | Complete |
| Hardfork | ✅ | ✅ | ✅ | Complete |
| Opcode | ✅ | ✅ | ✅ | Complete |
| Abi | ✅ | ❌ | ✅ | Zig impl exists, needs WASM bindings |
| Siwe | ✅ | ❌ | ✅ | Zig impl exists, needs WASM bindings |
| State | ✅ | ❌ | ✅ | Zig impl exists, needs WASM bindings |

**Summary:** 18/18 primitives have benchmarks, 15/18 have WASM implementations (83%)

### 🚧 TODO

1. **Complete remaining WASM bindings** (Abi, Siwe, State)
   - These have Zig implementations but need `.wasm.ts` wrapper files
   - Follow Address.wasm.ts pattern

2. **Add dual-mode benchmarks**
   - Create benchmarks that test both ReleaseSmall and ReleaseFast
   - Document performance vs size tradeoffs per primitive

3. **Generate BENCHMARKS.md**
   - Run `scripts/run-benchmarks.ts` to generate markdown report
   - Compare JS vs WASM vs ethers vs viem across all operations

4. **Optimize size-limit config**
   - Add per-primitive size limits
   - Set up CI to fail on size regressions

## Workflow

### Adding a New Primitive

1. **Create Zig implementation** (`src/primitives/Foo/foo.zig`)
2. **Export FFI bindings** in `src/c_api.zig`
3. **Add loader functions** in `src/wasm-loader/loader.ts`
4. **Create WASM wrapper** (`src/primitives/Foo/Foo.wasm.ts`)
5. **Create benchmark** (`src/primitives/Foo/Foo.bench.ts`)

### Running Benchmarks

```bash
# Full workflow
zig build build-ts-wasm          # Build ReleaseSmall
zig build build-ts-wasm-fast     # Build ReleaseFast
bun run bench                     # Run all benchmarks

# Or use shorthand
bun run build:wasm && bun run bench
```

### Analyzing Results

The benchmark output shows:
- **Operations per second** (higher is better)
- **Latency** (lower is better)
- **Percentiles** (p50, p75, p99)

Compare:
- **JS vs WASM:** Native performance gains
- **ReleaseSmall vs ReleaseFast:** Size vs speed tradeoff
- **WASM vs ethers/viem:** Ecosystem comparison

## Bundle Size Analysis

```bash
# Measure current sizes
bun run size

# View detailed report
cat BUNDLE-SIZES.md

# Check against limits (CI)
bun run bench:size
```

### Interpreting Results

**WASM Modes:**
- ReleaseSmall: ~286 KB - use in production
- ReleaseFast: ~2.3 MB - only for benchmarking
- 8.3x size increase for marginal performance gain

**Recommendation:** Always ship ReleaseSmall to users, benchmark with ReleaseFast

## Performance Guidelines

Based on existing benchmarks:

1. **Use WASM when:**
   - Heavy computation (keccak256, RLP encoding)
   - Byte manipulation at scale
   - Cryptographic operations

2. **Use JS when:**
   - Simple property access
   - String manipulation
   - Already using JS objects

3. **Tree-shaking is critical:**
   - Import specific primitives: `import { Address } from '@tevm/voltaire/Address'`
   - Avoid barrel imports: `import { Address } from '@tevm/voltaire'`

## Files Added/Modified

### New Files
- `src/primitives/Address/Address.wasm.ts` - WASM bindings for Address
- `scripts/measure-bundle-sizes.ts` - Bundle size measurement
- `.size-limit.json` - Size limit configuration
- `BUNDLE-SIZES.md` - Generated size report
- `BENCHMARKING.md` - This file

### Modified Files
- `build.zig` - Added ReleaseFast WASM build step
- `src/wasm-loader/loader.ts` - Added forceReload parameter
- `src/primitives/Address/Address.bench.ts` - Connected to WASM
- `package.json` - Added bench/size scripts

## Next Steps

1. Run benchmarks to establish baseline: `bun run bench`
2. Generate comprehensive BENCHMARKS.md with all results
3. Add CI integration for automated benchmarking
4. Complete remaining WASM bindings (Abi, Siwe, State)
5. Consider adding Go benchmarks for comparison
