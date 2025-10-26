# Zig Benchmark Results

**Test Environment:**
- **CPU**: Apple M4 Pro
- **Memory**: 64 GB
- **OS**: macOS Darwin 24.3.0
- **Zig Version**: 0.15.1
- **Benchmark Tool**: zbench
- **Date**: October 26, 2025

## Overview

This document presents performance benchmark results for native Zig implementations of Ethereum primitives and cryptographic operations. Benchmarks are co-located with source code in `src/**/*.bench.zig` files and use the [zbench](https://github.com/hendriknielaender/zbench) framework.

## Running Benchmarks

```bash
# Build and run all benchmarks
zig build -Dwith-benches=true bench

# Filter by category
zig build -Dwith-benches=true bench --filter primitives
zig build -Dwith-benches=true bench --filter crypto

# Run specific benchmark binaries
./zig-out/bin/zbench-numeric
./zig-out/bin/zbench-rlp
./zig-out/bin/zbench-eip712
```

## Available Benchmarks

### Primitives Module

#### 1. Address Operations (`src/primitives/address.bench.zig`)

Tests fundamental Ethereum address operations:

- **fromHex**: Parse hex string to address (20 bytes)
- **toChecksumHex**: Convert address to EIP-55 checksummed hex
- **equals**: Compare two addresses for equality
- **isZero**: Check if address is zero (0x0000...0000)

**Key Operations:**
- Input validation (42-character hex strings)
- EIP-55 checksum calculation (Keccak-256 based)
- Constant-time comparisons

#### 2. Hex Encoding/Decoding (`src/primitives/hex.bench.zig`)

Benchmark hex string conversions:

- **encodeBytes**: Encode bytes to hex string with `0x` prefix
- **decodeBytes**: Decode hex string to bytes
- **encodeNibbles**: Low-level nibble encoding
- **decodeNibbles**: Low-level nibble decoding

**Workload:**
- Small inputs: 4-32 bytes
- Large inputs: 1KB+ bytes
- Edge cases: Empty strings, single bytes

#### 3. Numeric Operations (`src/primitives/numeric.bench.zig`)

Tests u256 arithmetic and formatting:

- **parseUnits**: Parse decimal string to u256 (e.g., "1.5 ETH" → wei)
- **formatUnits**: Format u256 to decimal string with custom decimals
- **safeAdd/safeSub/safeMul/safeDiv**: Overflow-checked arithmetic
- **toHex/fromHex**: u256 ↔ hex string conversions

**Key Features:**
- Overflow detection for safe arithmetic
- Decimal precision handling (up to 77 digits)
- Efficient string formatting

#### 4. RLP Encoding/Decoding (`src/primitives/rlp.bench.zig`)

Recursive Length Prefix encoding operations:

**Encoding:**
- **encodeBytes (4 bytes)**: Small byte string encoding
- **encodeBytes (100 bytes)**: Large byte string encoding (>55 bytes)
- **encodeBytes (single byte)**: Single-byte optimization
- **encodeBytes (empty)**: Empty string encoding
- **encodeInteger (u64)**: 64-bit integer encoding
- **encodeInteger (u256)**: 256-bit integer encoding
- **encodeList (3 items)**: List encoding with multiple items

**Decoding:**
- **decodeBytes (4 bytes)**: Small byte string decoding
- **decodeList (3 items)**: List decoding with validation

**Recent Fix:** Corrected canonical list encoding (prefix byte) to ensure compliance with Ethereum RLP specification.

### Crypto Module

#### 5. Hash Operations (`src/crypto/hash.bench.zig`)

Keccak-256 hashing performance:

- **keccak256 (small)**: Hash 32-byte inputs
- **keccak256 (medium)**: Hash 256-byte inputs
- **keccak256 (large)**: Hash 1KB+ inputs

**Implementation:**
- Hardware-accelerated when available (ARM NEON, x86-64 SHA3)
- Optimized for Ethereum's 32-byte hash outputs
- Streaming interface for large inputs

#### 6. secp256k1 Operations (`src/crypto/secp256k1.bench.zig`)

Elliptic curve cryptography benchmarks:

- **sign**: Create ECDSA signature from message hash and private key
- **verify**: Verify signature against message hash and public key
- **recover**: Recover public key from signature and message hash
- **publicKeyToAddress**: Derive Ethereum address from public key

**Key Operations:**
- 256-bit scalar multiplication
- Point addition and doubling
- Signature normalization (low-s enforcement)
- Public key compression/decompression

#### 7. EIP-712 Typed Data Signing (`src/crypto/eip712.bench.zig`)

Structured data signing benchmarks:

- **hashTypedData**: Hash EIP-712 structured data (domain + message)
- **signTypedData**: Sign typed data with private key
- **verifyTypedData**: Verify typed data signature

**Test Setup:**
- Simple message type: `{ name: string, age: uint256 }`
- Domain: `MyDApp` version `1` on chain ID `1`
- **Deterministic testing**: Uses fixed Hardhat test key for reproducible results

**Recent Fix:** Replaced random private key generation with fixed test key (`0xac0974...`) for deterministic benchmark results.

**Note**: These functions are marked `unaudited` and should not be used in production without security review.

### Precompiles Module

#### 8. BN254 Addition (`src/precompiles/bn254_add.bench.zig`)

EIP-196 alt_bn128 addition precompile (address 0x06):

- **bn254Add**: Point addition on BN254 elliptic curve
- **Workload**: G1 point addition operations
- **Gas Cost**: 150 gas (EIP-1108)

#### 9. ecrecover (`src/precompiles/ecrecover.bench.zig`)

EIP precompile for ECDSA public key recovery (address 0x01):

- **ecrecover**: Recover signer address from message hash and signature
- **Workload**: secp256k1 point recovery with v, r, s components
- **Gas Cost**: 3000 gas

**Validation:**
- Signature malleability checks (EIP-2)
- Range validation for r, s, v values
- Chain ID handling for EIP-155

#### 10. SHA-256 (`src/precompiles/sha256.bench.zig`)

SHA-256 precompile (address 0x02):

- **sha256**: Hash arbitrary-length inputs
- **Workload**: Various input sizes (32 bytes, 256 bytes, 1KB+)
- **Gas Cost**: 60 base + 12 per word

## Performance Characteristics

### Memory Usage

- **Address operations**: Fixed 20-byte allocations
- **Numeric operations**: u256 stack allocation (32 bytes)
- **RLP encoding**: Dynamic buffer growth with allocator
- **Hash operations**: Fixed output (32 bytes for Keccak-256)
- **Crypto operations**: Temporary allocations for intermediate values

### Optimization Strategies

1. **Stack allocation** for small, fixed-size data (addresses, hashes)
2. **Arena allocators** for benchmark iterations (batch cleanup)
3. **Pre-allocated buffers** for encoding operations
4. **Constant-time operations** for cryptographic safety
5. **Hardware acceleration** when available (SHA3, NEON instructions)

## Comparison with TypeScript Implementations

For detailed comparisons against ethers.js, viem, @noble/hashes, and @ethereumjs libraries, see:

- [BENCHMARK_RESULTS.md](./BENCHMARK_RESULTS.md) - TypeScript FFI comparison results
- [comparisons/](./comparisons/) - Individual benchmark categories

**Key Findings:**
- **Native Zig**: 1-10x faster for compute-intensive operations
- **WASM Zig**: Competitive with or faster than pure JavaScript
- **Bytecode operations**: 100-1000x faster (no JS equivalent)
- **ABI decoding**: 4-39x faster than ethers.js

## Notes

### Deterministic Testing

All benchmarks use fixed test data to ensure reproducible results:

- **EIP-712**: Fixed Hardhat test private key
- **Crypto operations**: Known test vectors from EIP specifications
- **RLP**: Canonical encoding with validated test cases

### Build Configuration

Benchmarks are built with:
- **Optimization**: Debug mode for development, ReleaseFast for production measurements
- **Target**: Native CPU features enabled
- **Allocator**: Page allocator for consistent measurements

### Known Limitations

1. **macOS zbench output**: Benchmarks run successfully but produce no console output by default when invoked via `zig build bench`. Run individual binaries (`./zig-out/bin/zbench-*`) for detailed results.

2. **Old bench/ directory**: Legacy benchmarks in `bench/` may have API compatibility issues. Active development focuses on zbench benchmarks in `src/**/*.bench.zig`.

## Contributing

To add new benchmarks:

1. Create a `*.bench.zig` file next to the module you're benchmarking
2. Import zbench: `const zbench = @import("zbench");`
3. Follow existing benchmark patterns (see `src/primitives/rlp.bench.zig`)
4. Use fixed test data for deterministic results
5. Document workload characteristics and edge cases

## See Also

- [zbench documentation](https://github.com/hendriknielaender/zbench)
- [ZIG_API.md](./ZIG_API.md) - Complete Zig API reference
- [CLAUDE.md](./CLAUDE.md) - Development standards and coding patterns
