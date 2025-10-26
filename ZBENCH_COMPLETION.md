# zbench Integration - Completion Task

## Context

zbench has been successfully integrated into the build system and 10 benchmark files have been created colocated with source code in `src/**/*.bench.zig`. The build system discovers and compiles these benchmarks automatically. However, some benchmark files reference APIs that don't match the actual implementation signatures.

## What's Already Complete ✅

1. **build.zig updated** - zbench dependency integrated, `buildZBenchmarks()` function added
2. **Benchmark discovery** - Automatically finds all `src/**/*.bench.zig` files recursively
3. **Build command** - `zig build bench` discovers and runs all benchmarks
4. **Filtering support** - `zig build bench --filter <pattern>` for selective execution
5. **Stdout API fixed** - All files use correct Zig 0.15.1 API (with buffer and interface)
6. **10 benchmark files created**:
   - `src/primitives/address.bench.zig`
   - `src/primitives/hex.bench.zig`
   - `src/primitives/rlp.bench.zig`
   - `src/primitives/numeric.bench.zig`
   - `src/crypto/hash.bench.zig`
   - `src/crypto/secp256k1.bench.zig`
   - `src/crypto/eip712.bench.zig`
   - `src/precompiles/ecrecover.bench.zig`
   - `src/precompiles/sha256.bench.zig`
   - `src/precompiles/bn254_add.bench.zig`

## What Needs to be Done 🔧

### Task: Fix API Mismatches in Benchmark Files

The benchmark files were created based on expected APIs, but some don't match the actual implementation. You need to:

1. **Read each source file** to understand the actual API
2. **Update benchmark files** to use correct function signatures
3. **Remove benchmarks** for functions that don't exist
4. **Verify build** with `zig build bench --summary failures`
5. **Run at least one benchmark** to verify zbench output works

## Specific Errors to Fix

### 1. `src/primitives/numeric.bench.zig` (9 errors)

**Issue**: Functions don't exist or have wrong signatures
- `Numeric.etherToWei` - doesn't exist
- `Numeric.weiToEther` - doesn't exist
- `Numeric.safeAdd` - returns `?u256` not error union (remove `catch unreachable`)
- `Numeric.safeSub` - returns `?u256` not error union (remove `catch unreachable`)
- `Numeric.safeMul` - returns `?u256` not error union (remove `catch unreachable`)
- `Numeric.safeDiv` - returns `?u256` not error union (remove `catch unreachable`)
- `Numeric.calculatePercentageOf` - returns `u256` not error union (remove `catch unreachable`)

**Action**: Read `src/primitives/numeric.zig` to find actual function names and signatures, then update benchmark file.

### 2. `src/crypto/secp256k1.bench.zig` (3 errors)

**Issue**: Functions don't exist
- `secp256k1.isValidSignatureComponent` - doesn't exist
- `secp256k1.isMalleableSignature` - doesn't exist

**Action**: Read `src/crypto/secp256k1.zig` to see what validation functions exist, then either:
- Update to use correct function names, OR
- Remove these benchmarks if no equivalent exists

### 3. `src/primitives/hex.bench.zig` (6 errors)

**Issue**: API mismatch (likely function names or signatures)

**Action**: Read `src/primitives/hex.zig` to verify:
- Correct function names
- Parameter signatures
- Return types
Then update benchmark file.

### 4. `src/primitives/rlp.bench.zig` (2 errors)

**Issue**: API mismatch

**Action**: Read `src/primitives/rlp.zig` to verify API, then fix benchmark calls.

### 5. `src/primitives/address.bench.zig` (2 errors)

**Issue**: API mismatch

**Action**: Read `src/primitives/address.zig` to verify API, then fix benchmark calls.

### 6. `src/crypto/hash.bench.zig` (3 errors)

**Issue**: API mismatch (likely HashUtils functions)

**Action**: Read `src/crypto/hash.zig` and `src/crypto/hash_utils.zig` to verify API.

### 7. `src/crypto/eip712.bench.zig` (1 error)

**Issue**: API mismatch

**Action**: Read `src/crypto/eip712.zig` to verify API.

### 8. Precompile benchmarks (1 error each: ecrecover, sha256, bn254_add)

**Issue**: Pre-existing issue in `src/precompiles/bn254_pairing.zig:157` - unused variable
```zig
const allocator = testing.allocator;  // Line 157
```

**Action**: Fix the unused variable in `bn254_pairing.zig` by either using it or removing it.

## Verification Steps

After fixing all errors:

```bash
# 1. Clean build
zig build bench --summary failures

# Expected: All benchmarks compile successfully

# 2. Run a single benchmark to test
./zig-out/bin/zbench-address

# Expected output: Performance metrics with avg, min, max, p75, p99, p995

# 3. Run all benchmarks
zig build bench

# Expected: All benchmarks execute and output metrics
```

## Example Fix Pattern

**Before (incorrect):**
```zig
fn benchSafeAdd(allocator: std.mem.Allocator) void {
    const result = Numeric.safeAdd(a, b) catch unreachable;  // ❌ Error: returns ?u256
    _ = result;
}
```

**After (correct):**
```zig
fn benchSafeAdd(allocator: std.mem.Allocator) void {
    const result = Numeric.safeAdd(a, b) orelse 0;  // ✅ Handle optional
    _ = result;
}
```

## Success Criteria

✅ All 10 benchmark files compile without errors
✅ `zig build bench` completes successfully
✅ At least one benchmark runs and outputs zbench metrics
✅ No compilation errors related to benchmarks

## Project Context

- **Zig version**: 0.15.1
- **zbench**: Already in `build.zig.zon`, version 0.11.2
- **Project standards**: Follow CLAUDE.md - No stub implementations, proper error handling
- **Location**: `/Users/williamcory/primitives/`

## Tips

1. **Read the source file first** - Don't guess APIs, always verify
2. **Check return types** - Error unions vs optionals vs plain types
3. **Look for similar existing benchmarks** - `src/crypto/bn254/benchmarks.zig` has examples
4. **Use grep to find functions**: `grep -n "pub fn functionName" src/path/file.zig`
5. **Test incrementally** - Fix one file, verify it compiles, move to next

## Command to Start

```bash
cd /Users/williamcory/primitives
zig build bench --summary failures 2>&1 | grep "error:" | head -20
```

This will show you the first 20 errors to fix. Start with the easiest (numeric.bench.zig has clear error messages).
