# Continue FFI Implementation - Agent Prompt

Copy the content below and provide it to the next agent to continue this work.

---

# FFI Implementation Continuation - Phases 5-6

## Context: What's Been Completed

You're continuing work on a mission-critical Ethereum primitives library that's implementing FFI (Foreign Function Interface) bindings to replace JavaScript crypto libraries with native Zig implementations.

### ✅ Phases 1-4 Complete (~2,800 lines of code)

**Phase 1 - C API Extension**: Extended `/Users/williamcory/primitives/src/c_api.zig` with 23+ exported C functions covering:
- Address operations (8 functions)
- Keccak-256 hashing (4 functions)
- RLP encoding (4 functions)
- Signature utilities (4 functions)
- Bytecode operations (4 functions)
- Wallet generation (2 functions)
- Hash algorithms (3 functions)
- Transaction operations (1 function)

**Phase 2 - Native Node.js Bindings**: Complete napi-rs wrapper
- Rust FFI wrapper: `native/napi/src/lib.rs` (900+ lines)
- 10 TypeScript modules in `src/typescript/native/primitives/` (856 lines total)
- Native addon built: `native/napi/index.node` (382KB)
- Exports: 33 functions + 2 classes (Address, Hash)

**Phase 3 - WASM Browser Bindings**: Complete WASM infrastructure
- WASM build target added to `build.zig` (wasm32-wasi)
- JavaScript loader: `wasm/loader.js` (635 lines)
- 5 TypeScript WASM modules in `src/typescript/wasm/primitives/` (420 lines)
- WASM binary: `zig-out/wasm/primitives_ts_wasm.wasm` (79KB)
- 100% API parity with native modules

**Phase 4 - Integration**: Updated 20 comparison files
- Address comparisons (8 files) - All working
- Bytecode comparisons (4 files) - All working
- Keccak256 comparisons (2 files) - Working
- RLP comparisons (4 files) - Partial

### Current Status

**Build Status**:
- Zig: `zig build` (153/160 steps succeed - 3 pre-existing benchmark failures)
- Native: `cargo build --release` in `native/napi/` (✅ Success)
- WASM: `zig build build-ts-wasm` (✅ Success)

**Test Status**:
- Native addon verified working with `native/napi/test.js`
- Comparison files use real FFI instead of placeholders

**Documentation**:
- See `/Users/williamcory/primitives/FFI_IMPLEMENTATION_STATUS.md` for detailed status
- See `/Users/williamcory/primitives/PHASE_2-4_COMPLETION_SUMMARY.md` for implementation details

---

## 🎯 Your Mission: Complete Phases 5-6

### Phase 5: Comprehensive Benchmarking

**Objective**: Validate that FFI implementations meet performance targets (10-50x faster than @noble/hashes for native, 2-5x for WASM)

#### Tasks:

1. **Create Benchmark Suite**
   - Location: `benchmarks/` directory (create if needed)
   - Test all operations with small (5B), medium (1KB), and large (10KB-1MB) inputs
   - Compare against:
     - @noble/hashes (for keccak256)
     - ethers.js (for address, utils)
     - viem (for primitives)
     - Pure TypeScript implementations

2. **Operations to Benchmark**:
   - **Keccak-256**: Hash 5B, 1KB, 10KB, 100KB, 1MB
   - **Address operations**: fromHex, toChecksumHex, equals, calculateCreateAddress
   - **Bytecode analysis**: analyzeJumpDestinations on simple/complex/large bytecode
   - **RLP encoding**: encodeBytes, encodeUint with various sizes
   - **Signature operations**: recover, validate, normalize
   - **Compare**: Native vs WASM vs third-party libraries

3. **Documentation**:
   - Create `BENCHMARK_RESULTS.md` with:
     - Performance tables (operations/second, ms per operation)
     - Charts comparing native vs WASM vs libraries
     - Memory usage comparison
     - Bundle size comparison
   - Update `FFI_IMPLEMENTATION_STATUS.md` with results

### Phase 6: Testing & Validation

**Objective**: Ensure all implementations are correct, secure, and cross-platform compatible

#### Tasks:

1. **Unit Tests for Native Modules**
   - Location: `src/typescript/native/primitives/*.test.ts`
   - Test all 33 functions + 2 classes
   - Test cases:
     - Known test vectors (EIP test cases, NIST vectors)
     - Edge cases (empty input, max values, boundary conditions)
     - Error handling (invalid hex, wrong lengths)
     - Memory safety (large allocations)

2. **Unit Tests for WASM Modules**
   - Location: `src/typescript/wasm/primitives/*.test.ts`
   - Same test cases as native (verify identical behavior)
   - Test memory management (allocation/deallocation)
   - Test error propagation from WASM to JavaScript

3. **Integration Tests**
   - Test that comparison files run without errors
   - Cross-validate outputs match between:
     - Native implementation
     - WASM implementation
     - ethers.js outputs
     - viem outputs
     - @noble/hashes outputs

4. **Security Testing**:
   - **Constant-time operations**: Verify hash comparisons don't leak timing info
   - **Memory leaks**: Test long-running operations don't leak memory
   - **Fuzzing**: Test cryptographic operations with random inputs
   - **Known attack vectors**: Test with malformed signatures, invalid addresses

5. **Cross-Platform Testing**:
   - macOS (ARM64 & x86_64)
   - Linux (x86_64 & ARM64)
   - Windows (x86_64)
   - Browser WASM (Chrome, Firefox, Safari)

6. **Documentation**:
   - Create `TEST_RESULTS.md` with:
     - Test coverage report
     - Platform compatibility matrix
     - Security audit results
   - Update `README.md` with usage examples and API docs

---

## 🐛 Known Issues to Fix

### Issue 1: Hash Constructor Private (PRIORITY: HIGH)
**File**: `/Users/williamcory/primitives/src/typescript/native/primitives/keccak.native.ts:107`

**Problem**: `eip191HashMessage()` tries to call `new Hash()` but constructor is private

**Solution**: Either:
- Make Hash constructor protected, or
- Create a static factory method `Hash.fromBytes()`

```typescript
// Current (broken):
export function eip191HashMessage(message: string | Uint8Array | Buffer): Hash {
    const input = typeof message === "string" ? Buffer.from(message, "utf8") : Buffer.from(message);
    const hashBytes: Buffer = napi.eip191HashMessage(input);
    return new Hash(hashBytes); // ❌ Constructor is private
}

// Fix option 1: Protected constructor
private constructor(bytes: Buffer) { ... }
// Change to:
protected constructor(bytes: Buffer) { ... }

// Fix option 2: Static factory
static fromBytes(bytes: Buffer): Hash {
    return new Hash(bytes);
}
// Then use: return Hash.fromBytes(hashBytes);
```

### Issue 2: RLP Decode Missing (PRIORITY: MEDIUM)
**Files**: `src/c_api.zig`, `native/napi/src/lib.rs`, TypeScript modules

**Problem**: RLP encoding exists but decoding is not implemented

**Solution**:
1. Add to C API: `primitives_rlp_decode_bytes()`, `primitives_rlp_decode_uint()`
2. Add to Rust wrapper: `rlp_decode_bytes()`, `rlp_decode_uint()`
3. Add to TypeScript: `decode()` methods in rlp.native.ts and rlp.wasm.ts
4. Update comparison files that need decode functionality

### Issue 3: WASM Crypto Dependencies (PRIORITY: LOW)
**Problem**: Keccak-256 and secp256k1 don't work in WASM because C/Rust libs aren't compiled for wasm32-wasi

**Solution** (if needed):
1. Compile Rust `crypto_wrappers` crate for wasm32-wasi target
2. Compile `blst` with `__BLST_PORTABLE__` and `__BLST_NO_ASM__` flags
3. Compile `c-kzg-4844` for WASM target

**Note**: Pure Zig functions (Address, RLP, bytecode) work fully in WASM. Crypto functions are optional enhancement.

---

## 📂 Important File Locations

### Source Code
```
/Users/williamcory/primitives/
├── src/
│   ├── c_api.zig                           # C API functions
│   └── typescript/
│       ├── native/primitives/              # 10 native modules (856 lines)
│       └── wasm/primitives/                # 5 WASM modules (420 lines)
├── native/napi/                            # napi-rs bindings
│   ├── src/lib.rs                          # Rust wrapper (900+ lines)
│   ├── Cargo.toml
│   └── index.node                          # Built addon (382KB)
├── wasm/
│   └── loader.js                           # WASM loader (635 lines)
├── zig-out/
│   ├── lib/
│   │   ├── libprimitives_c.a              # Static lib (51MB)
│   │   └── libprimitives_c.dylib          # Dynamic lib (1.4MB)
│   └── wasm/
│       └── primitives_ts_wasm.wasm        # WASM binary (79KB)
└── comparisons/                            # 20 files updated to use FFI
    ├── address/
    ├── bytecode/
    ├── keccak256/
    └── rlp/
```

### Documentation
- `FFI_IMPLEMENTATION_STATUS.md` - Overall status tracker
- `PHASE_2-4_COMPLETION_SUMMARY.md` - Detailed completion report
- `CLAUDE.md` - Project guidelines and protocols
- `build.zig` - Build configuration (lines 497-534 for WASM)

---

## 🔨 Build & Test Commands

### Build Commands
```bash
# Build Zig library and C API
zig build

# Build native addon (from repo root)
cd native/napi && cargo build --release && cd ../..

# Build WASM
zig build build-ts-wasm

# Run Zig tests
zig build test
```

### Test Commands
```bash
# Test native addon
cd native/napi && DYLD_LIBRARY_PATH=../../zig-out/lib node test.js

# Run comparison tests (example)
bun test comparisons/address/fromHex/*.test.ts

# Run benchmarks (to be created)
bun run benchmarks/keccak256.bench.ts
```

### Verification
```bash
# Check native addon exists
ls -lh native/napi/index.node

# Check WASM binary exists
ls -lh zig-out/wasm/primitives_ts_wasm.wasm

# Check C library exists
ls -lh zig-out/lib/libprimitives_c.dylib
```

---

## 📋 Task Checklist for Phases 5-6

### Phase 5: Benchmarking
- [ ] Fix Issue #1 (Hash constructor) before benchmarking
- [ ] Create `benchmarks/` directory structure
- [ ] Implement keccak256 benchmarks (native vs WASM vs @noble/hashes)
- [ ] Implement address operation benchmarks (vs ethers/viem)
- [ ] Implement bytecode analysis benchmarks
- [ ] Implement RLP encoding benchmarks
- [ ] Implement signature operation benchmarks
- [ ] Test with small/medium/large inputs
- [ ] Measure memory usage
- [ ] Create `BENCHMARK_RESULTS.md` with tables and charts
- [ ] Update `FFI_IMPLEMENTATION_STATUS.md` with results
- [ ] Verify performance targets met (10-50x native, 2-5x WASM)

### Phase 6: Testing
- [ ] Create test files for all 10 native modules
- [ ] Create test files for all 5 WASM modules
- [ ] Implement known test vector validation
- [ ] Implement edge case testing
- [ ] Implement error handling tests
- [ ] Test cross-platform compatibility (macOS, Linux, Windows)
- [ ] Test browser WASM (Chrome, Firefox, Safari)
- [ ] Implement security tests (timing attacks, memory leaks)
- [ ] Run fuzzing tests on crypto operations
- [ ] Create `TEST_RESULTS.md` with coverage report
- [ ] Update `README.md` with API documentation
- [ ] Fix Issue #2 (RLP decode) if tests require it

---

## 🎯 Success Criteria

### Phase 5 Complete When:
- [ ] All benchmarks show native is 10-50x faster than JavaScript libraries
- [ ] WASM benchmarks show 2-5x improvement
- [ ] Performance documented with tables and charts
- [ ] Memory usage is acceptable (no excessive allocations)
- [ ] Bundle sizes documented

### Phase 6 Complete When:
- [ ] All 33 native functions have passing tests
- [ ] All 22 WASM functions have passing tests
- [ ] Test coverage >90% for critical paths
- [ ] All platforms verified working (macOS, Linux, Windows, browsers)
- [ ] Security audit shows no timing attacks or memory leaks
- [ ] Documentation complete with examples

### Overall Success When:
- [ ] All comparison files run without errors
- [ ] Performance targets achieved
- [ ] Cross-platform compatibility verified
- [ ] Security validated
- [ ] Documentation complete
- [ ] No critical bugs remaining

---

## 💡 Tips for Implementation

### For Benchmarking:
- Use `Bun.bench()` or `vitest.bench()` for consistent timing
- Run each benchmark multiple times (10,000+ iterations for small operations)
- Warm up the JIT before measuring (run 1000 iterations first)
- Use `performance.now()` for high-resolution timing
- Test both cold start and hot path performance

### For Testing:
- Use known test vectors from EIPs and NIST
- Test boundary conditions (empty, zero, max values)
- Use property-based testing for cryptographic operations
- Validate that native and WASM produce identical outputs
- Test memory usage with large allocations

### For Cross-Platform:
- Use GitHub Actions for CI testing across platforms
- Test on real hardware, not just VMs
- Browser testing: use Playwright or Puppeteer for automation

---

## 📚 Reference Documentation

### APIs to Test/Benchmark

**Native Modules (33 functions + 2 classes)**:

**Address** (8 operations):
- `Address.fromHex(hex: string): Address`
- `address.toHex(): string`
- `address.toChecksumHex(): string`
- `address.isZero(): boolean`
- `address.equals(other: Address): boolean`
- `Address.validateChecksum(hex: string): boolean`
- `Address.calculateCreateAddress(sender: Address, nonce: number): Address`
- `Address.calculateCreate2Address(sender: Address, salt: Uint8Array, initCode: Uint8Array): Address`

**Keccak-256** (2 operations):
- `keccak256(data: string | Uint8Array | Buffer): string`
- `eip191HashMessage(message: string | Uint8Array | Buffer): Hash`

**Bytecode** (4 operations):
- `analyzeJumpDestinations(code: Uint8Array): JumpDestination[]`
- `isBytecodeBoundary(code: Uint8Array, position: number): boolean`
- `isValidJumpDest(code: Uint8Array, position: number): boolean`
- `validateBytecode(code: Uint8Array): void`

**RLP** (5 operations):
- `rlpEncodeBytes(data: Uint8Array): Uint8Array`
- `rlpEncodeUint(value: Uint8Array): Uint8Array`
- `rlpEncodeUintFromBigInt(value: bigint): Uint8Array`
- `rlpToHex(rlpData: Uint8Array): string`
- `rlpFromHex(hex: string): Uint8Array`

**Signatures** (8 operations):
- `secp256k1RecoverPubkey(messageHash: Buffer, r: Buffer, s: Buffer, v: number): Buffer`
- `secp256k1RecoverAddress(messageHash: Buffer, r: Buffer, s: Buffer, v: number): Buffer`
- `secp256k1PubkeyFromPrivate(privateKey: Buffer): Buffer`
- `secp256k1ValidateSignature(r: Buffer, s: Buffer): boolean`
- `signatureNormalize(r: Buffer, s: Buffer): Buffer[]`
- `signatureIsCanonical(r: Buffer, s: Buffer): boolean`
- `signatureParse(sigData: Buffer): ParsedSignature`
- `signatureSerialize(r: Buffer, s: Buffer, v: number, includeV: boolean): Buffer`

**Wallet** (2 operations):
- `generatePrivateKey(): Buffer`
- `compressPublicKey(uncompressed: Buffer): Buffer`

**Hash Algorithms** (5 operations):
- `sha256(data: Buffer): Buffer`
- `ripemd160(data: Buffer): Buffer`
- `blake2b(data: Buffer): Buffer`
- `solidityKeccak256(packedData: Buffer): Buffer`
- `soliditySha256(packedData: Buffer): Buffer`

**Transaction** (1 operation):
- `detectTransactionType(data: Buffer): number` (0-4)

**Hex** (2 operations):
- `hexToBytes(hex: string): Uint8Array`
- `bytesToHex(data: Buffer): string`

**U256** (4 operations):
- `u256FromHex(hex: string): Buffer`
- `u256ToHex(value: Buffer): string`
- `u256FromBigInt(value: bigint): Buffer`
- `u256ToBigInt(value: Buffer): bigint`

---

## 🚀 Getting Started

1. **Read the context** above to understand what's been completed
2. **Fix Issue #1** (Hash constructor) before starting benchmarks
3. **Start with Phase 5** (benchmarking) to validate performance
4. **Then Phase 6** (testing) to ensure correctness and security
5. **Update documentation** as you complete each task
6. **Use the checklist** to track progress

### First Commands to Run:
```bash
# Verify builds work
zig build
cd native/napi && cargo build --release && cd ../..
zig build build-ts-wasm

# Fix Hash constructor issue
# Edit: src/typescript/native/primitives/keccak.native.ts

# Create benchmark directory
mkdir -p benchmarks

# Start implementing benchmarks
# Create: benchmarks/keccak256.bench.ts
```

---

## 📞 Questions to Consider

While implementing, think about:
1. Should we use Bun or vitest for benchmarking?
2. What test framework do we prefer (Bun, vitest, Jest)?
3. Do we need GitHub Actions CI for cross-platform testing?
4. Should we add more comparison files beyond the current 20?
5. Do we need to implement RLP decode for Phase 6 tests?
6. Should we pursue WASM crypto dependencies or mark as "future work"?

---

**Good luck! The foundation is solid - now validate it performs and works correctly across all platforms.**
