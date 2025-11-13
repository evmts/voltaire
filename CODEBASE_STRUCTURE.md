# Voltaire Codebase Structure Comprehensive Map

## 1. Directory Structure & Organization

### Root-Level Layout
```
/Users/williamcory/voltaire/
├── .git/                    # Git repository
├── .claude/                 # Claude-specific configuration
├── .github/                 # GitHub workflows & config
├── .cursor/                 # Cursor IDE configuration
├── .zig-cache/             # Zig build cache
├── src/                    # Main source code (TypeScript + Zig + Rust)
├── lib/                    # C libraries (blst, c-kzg-4844, libwally-core)
├── dist/                   # Compiled JS/CJS bundles (from tsup)
├── wasm/                   # WASM artifacts
├── zig-out/                # Zig build output
├── target/                 # Rust build output
├── examples/               # 29 example projects
├── docs/                   # Mintlify documentation (764 pages)
├── scripts/                # 27 utility scripts (benchmarks, comparisons)
├── tools/                  # Tools directory
├── vendor/                 # Vendored dependencies
├── build.zig              # Main Zig build configuration (1194 lines)
├── build.zig.zon          # Zig dependencies lock file (78 lines)
├── Cargo.toml             # Rust crypto dependencies
├── package.json           # Node.js dependencies & exports
└── tsconfig.json          # TypeScript configuration
```

---

## 2. Source Code Organization (src/)

### 2.1 Language Breakdown
```
Total Source Files: 1,001
├── TypeScript (.ts):  776 files  (77.5%)
│   ├── Test files (.test.ts):     290 files
│   ├── Benchmark files (.bench.ts): 40 files
│   └── WASM files (.wasm.ts):      25 files
├── Zig (.zig):         222 files  (22.2%)
│   ├── Test inline (.test in source)
│   ├── Fuzz tests (.fuzz.zig)
│   └── Benchmarks (.bench.zig)
└── Rust (.rs):          3 files   (0.3%)
    └── lib.rs, *_wrapper.rs files
```

### 2.2 Core Modules

#### A. Primitives Module (32 subdirectories, ~400 files)
Ethereum data types & encoding - mostly TypeScript with Zig implementations

**Primitives Modules (A-Z):**
- Abi (ABI encoding/decoding) - 31 files, includes BrandedAbi, parameter types, functions, events, constructors, error handling
- AccessList (EIP-2930 access lists) - 38 files, includes gas optimization, deduplication, validation
- Address (Ethereum addresses) - 25+ files, EIP-55 checksumming, contract address generation, validation
- Authorization (EIP-7702) - 12 files, EIP-7702 authorization handling, signing, validation
- Base64 (Base64 encoding) - 10+ files, standard & URL-safe variants
- BinaryTree - 8+ files, Merkle tree implementations
- Blob (EIP-4844 blobs) - 8+ files, blob commitment & proof handling
- BloomFilter (Bloom filters) - 10+ files, fast membership testing
- Bytecode (EVM bytecode) - 12+ files, bytecode analysis & manipulation
- Bytes (Raw bytes) - 8+ files, byte array utilities
- Chain (Chain definitions) - 8+ files, chain metadata
- ChainId (Chain IDs) - 6+ files, chain ID validation
- Denomination (Wei, Gwei, Ether) - 10+ files, unit conversions
- Ens (ENS names) - 8+ files, ENS name handling
- EventLog (EVM logs) - 10+ files, log parsing & validation
- FeeMarket (Fee calculations) - 10+ files, EIP-1559 & legacy fee handling
- Gas (Gas calculations) - 8+ files, GasPrice, GasLimit types
- GasConstants (Gas cost constants) - 8+ files, Hardfork-specific gas costs
- Hardfork (EVM hardforks) - 10+ files, fork definitions (Frontier through Dencun)
- Hash (Keccak256 hashes) - 12+ files, 32-byte hash type
- Hex (Hex encoding) - 12+ files, 0x-prefixed strings
- Nonce (Account nonce) - 6+ files, transaction nonce type
- Opcode (EVM opcodes) - 10+ files, opcode definitions & analysis
- PrivateKey (Private keys) - 6+ files, ECDSA key handling
- PublicKey (Public keys) - 6+ files, derived public keys
- Rlp (RLP encoding) - 12+ files, RLP serialization
- Signature (Signatures) - 8+ files, signature types (r, s, v)
- Siwe (Sign-in with Ethereum) - 8+ files, SIWE message handling
- State (Account state) - 8+ files, storage & code state
- Transaction (Transactions) - 50+ files, includes Legacy, EIP1559, EIP2930, EIP4844, EIP7702 types
- Uint (Uint256) - 12+ files, 256-bit unsigned integers

**File Patterns:**
- `BrandedX/BrandedX.ts` - Branded type definition
- `from.ts`, `toHex.ts`, `equals.ts` - Utility functions
- `X.test.ts` - Test suite
- `X.bench.ts` - Performance benchmark
- `X.wasm.ts` - WASM variant
- `index.ts` - Main export
- `X.zig` - Zig implementation

#### B. Crypto Module (15 subdirectories, ~380 files)
Cryptographic primitives - TypeScript + Zig + Rust

**Crypto Modules:**
- AesGcm - AES-256-GCM encryption (2 files)
- Bip39 - BIP-39 mnemonics (4 files: Entropy, Mnemonic, Seed)
- Blake2 - BLAKE2 hashing (3 files + bench, wasm)
- Bn254 - BN254 elliptic curve (15 subdirs: Fp, Fp2, Fr, G1, G2, Pairing, 24 files)
  - FpMont.zig, Fp2Mont.zig, Fp4Mont.zig, Fp6Mont.zig, Fp12Mont.zig (Montgomery arithmetic)
  - NAF.zig (Non-Adjacent Form scalar multiplication)
  - Pairing.zig (Optimal ate pairing)
- Ed25519 - EdDSA signatures (5 files: PublicKey, SecretKey, Seed, Signature)
- EIP712 - EIP-712 typed data (4 files + bench, wasm, Domain subdirectory)
- HDWallet - HD key derivation (4 files + bench)
- KZG - KZG commitments for blobs (8 files)
- Keccak256 - SHA3/Keccak hash (8 files + bench, wasm)
- P256 - NIST P-256/secp256r1 (5 files: PrivateKey, PublicKey, Signature types)
- Ripemd160 - RIPEMD-160 hash (2 files + bench, wasm)
- Secp256k1 - ECDSA signatures (15+ files: PublicKey/, Signature/, + standalone funcs)
- SHA256 - SHA-256 hashing (2 files + bench, wasm)
- Sha3 - SHA3-256/512 (3 files)
- Sha512 - SHA-512 hashing (2 files + bench, wasm)
- X25519 - Elliptic Curve Diffie-Hellman (3 files: PublicKey, SecretKey, SharedSecret)

**Crypto Implementation Files:**
- Root-level Zig FFI: `keccak256.zig`, `blake2.zig`, `secp256k1.zig`, `p256.zig`, `ed25519.zig`, `x25519.zig`, `ripemd160.zig`, `eip712.zig`
- C wrappers: `keccak256_c.zig`, `blake2_c.zig`, `keccak_asm.zig` (hardware-accelerated)
- Rust FFI: `lib.rs`, `keccak_wrapper.rs`, `bn254_wrapper.rs`
- Test files: 78 root .ts/.zig test files
- Benchmark files: 40+ benchmark files (zbench, mitata)
- WASM variants: 25 .wasm.ts files for WASM compatibility

#### C. EVM Module (14 subdirectories, ~130 files)
EVM execution environment & precompiles

**EVM Instruction Categories:**
- Arithmetic (11 files) - 0x01-0x0b: ADD, MUL, DIV, MOD, MULMOD, EXP, SIGNEXTEND, ADDMOD, SUB
- Bitwise (1+ files) - 0x16-0x1a: AND, OR, XOR, NOT, BYTE
- Comparison (10 files) - 0x10-0x15: LT, GT, SLT, SGT, EQ, ISZERO
- Context (12 files) - 0x30-0x3f: ADDRESS, CALLER, CALLDATALOAD, CALLDATACOPY, CALLDATASIZE, CODESIZE, CODECOPY, GASPRICE, EXTCODESIZE, EXTCODECOPY, RETURNDATASIZE, RETURNDATACOPY
- Control Flow (12 files) - 0x50-0x61: JUMP, JUMPI, PC, JUMPDEST, PUSH, DUP, SWAP, REVERT, RETURN, STOP, CALL, CALLCODE, DELEGATECALL, STATICCALL, RETURNDATACOPY
- Block (10 files) - 0x40-0x49: BLOCKHASH, COINBASE, TIMESTAMP, NUMBER, DIFFICULTY, GASLIMIT, CHAINID, GASPRICE, BASEFEE
- Keccak (10 files) - 0x20: SHA3 (Keccak256)
- Log (12 files) - 0xa0-0xa4: LOG0-LOG4 (event logging)
- Memory (10 files) - 0x51-0x53: MLOAD, MSTORE, MSTORE8, MCOPY
- Stack (15 files) - Stack manipulation
- Storage (12 files) - 0x54-0x55: SLOAD, SSTORE
- System (12 files) - System operations
- Precompiles (53 files) - See below
- Frame/Host (12 files) - Execution context
- `evm.zig` - Main EVM implementation

**Precompiles (53 files):**
- Identity (0x01) - `identity.zig`, fuzz tests
- Ecrecover (0x01) - Secp256k1 recovery (ecrecover.zig, .test.ts, .bench.zig)
- SHA256 (0x02) - SHA256 precompile (sha256.zig, .bench.zig)
- RIPEMD160 (0x03) - RIPEMD160 precompile (ripemd160.zig)
- ModExp (0x05) - Modular exponentiation (modexp.zig, .test.ts)
- Blake2f (0x09) - BLAKE2b compression (blake2f.zig, .test.ts)
- BN254 Precompiles (0x06-0x08):
  - bn254_add.zig, bn254_mul.zig, bn254_pairing.zig
  - With .test.ts, .bench.zig variants
- BLS12-381 Precompiles (0x0a-0x12):
  - bls12_g1_add.zig, bls12_g1_mul.zig, bls12_g1_msm.zig
  - bls12_g2_add.zig, bls12_g2_mul.zig, bls12_g2_msm.zig
  - bls12_pairing.zig, bls12_map_fp_to_g1.zig, bls12_map_fp2_to_g2.zig
- KZG Point Evaluation (0x14) - `point_evaluation.zig`
- Shared: `common.zig`, `utils.zig`, `root.zig`

#### D. Precompiles Module (8 files)
Fuzz testing for precompiles - Not for execution, just testing coverage

**Files:**
- blake2f.fuzz.zig, bls12.fuzz.zig, bn254.fuzz.zig, ecrecover.fuzz.zig
- identity.fuzz.zig, modexp.fuzz.zig, ripemd160.fuzz.zig, sha256.fuzz.zig
- bls12_g2_operations.test.ts, etc.

#### E. JSON-RPC Module (64 directories, ~67 files)
Ethereum JSON-RPC API implementations

**JSON-RPC Method Categories:**
- eth/ (47 methods) - Standard Ethereum API
  - accounts, blockNumber, blobBaseFee, call, chainId, coinbase
  - createAccessList, estimateGas, feeHistory, gasPrice
  - getBalance, getBlockByHash, getBlockByNumber, getBlockReceipts
  - getBlockTransactionCountByHash/Number
  - getCode, getFilterChanges, getFilterLogs, getLogs, getProof
  - getStorageAt, getTransactionByBlockHashAndIndex/ByBlockNumberAndIndex/ByHash
  - getTransactionCount, getTransactionReceipt
  - getUncleCountByBlockHash/Number
  - maxPriorityFeePerGas, newBlockFilter, newFilter, newPendingTransactionFilter
  - sendRawTransaction, sendTransaction, sign, signTransaction
  - simulateV1, syncing, uninstallFilter

- engine/ (20 methods) - Engine API (consensus layer)
  - exchangeCapabilities, exchangeTransitionConfigurationV1
  - forkchoiceUpdatedV1/V2/V3
  - getBlobsV1/V2
  - getPayloadBodiesByHashV1/ByRangeV1
  - getPayloadV1-V6
  - newPayloadV1-V5

- debug/ (5 methods) - Debug API
  - getBadBlocks, getRawBlock, getRawHeader, getRawReceipts, getRawTransaction

**File Structure:**
- `methods.zig` per category (eth/methods.zig, engine/methods.zig, debug/methods.zig)
- Each method: `method_name/method_name.zig`
- `index.ts`, `root.zig` for coordination
- `types.zig` for shared types

#### F. Provider Module
Ethereum provider abstraction (3+ files) - Adapters for different provider backends

#### G. Wallet Module
HD wallet derivation & key management (3+ files)

#### H. WASM Loader Module
WASM instantiation & memory management (3+ files in src/wasm-loader/)

---

## 3. Key Modules Deep Dive

### 3.1 Primitives - File Pattern Example

For each primitive (e.g., Address):
```
Address/
├── BrandedAddress/
│   ├── BrandedAddress.ts        # Type definition
│   ├── ChecksumAddress.test.ts   # Checksummed variant tests
│   ├── LowercaseAddress.test.ts  # Lowercase variant tests
│   ├── UppercaseAddress.test.ts  # Uppercase variant tests
│   ├── batch.test.ts             # Batch operation tests
│   ├── calculateCreate2Address.test.ts
│   ├── calculateCreateAddress.test.ts
│   ├── clone.test.ts
│   ├── compare.test.ts
│   ├── constants.test.ts
│   ├── equals.test.ts
│   ├── from.test.ts
│   ├── fromBytes.test.ts
│   ├── ...
│   └── toHex.test.ts
├── AddressConstructor.ts         # Constructor types
├── Address.bench.ts              # Performance benchmarks
├── Address.test.ts               # Main test suite
├── Address.wasm.ts               # WASM variant
├── Address.wasm.test.ts          # WASM tests
└── index.ts                      # Main export

Zig equivalent:
├── address.zig                   # Zig implementation (colocated)
└── address.fuzz.zig              # Fuzz tests
```

### 3.2 Crypto - Implementation Variants

**Example: Keccak256**
```
Keccak256/
├── BrandedKeccak256.ts           # Branded type
├── hash.test.ts                  # Direct hash tests
├── hashHex.test.ts               # Hex string hashing
├── hashMultiple.test.ts          # Multi-input hashing
├── hashString.test.ts            # String hashing
├── contractAddress.test.ts       # Create contract address
├── create2Address.test.ts        # CREATE2 address generation
├── selector.test.ts              # Function selector generation
├── topic.test.ts                 # Event topic generation

Implementations:
├── keccak256.zig                 # Zig core implementation
├── keccak256_c.zig               # C FFI wrapper
├── keccak256_accel.zig           # Hardware-accelerated (AVX, NEON)
├── keccak_asm.zig                # Assembly optimization
├── keccak_wrapper.rs             # Rust wrapper for WASM
├── keccak256.bench.ts            # TS benchmarks
├── keccak256.wasm.ts             # WASM variant
└── keccak256.wasm.test.ts        # WASM tests
```

### 3.3 Branded Types Pattern

**TypeScript Pattern:**
```typescript
// BrandedAddress.ts
export type BrandedAddress = Uint8Array & { readonly __tag: "Address" };

// from.ts - Constructor (no wrapper needed)
export function from(value: string | Uint8Array): BrandedAddress {
  // Implementation
}

// toHex.ts - Internal method
export function toHex(data: BrandedAddress): Hex {
  // Implementation
}

// index.ts - Dual export
export { toHex as _toHex } from "./toHex.js";
export function toHex(value: AddrInput): Hex {
  return _toHex(from(value));  // Public wrapper
}
```

---

## 4. Language Breakdown & Architecture

### 4.1 TypeScript
- **Type-First**: Branded types for zero-runtime overhead type safety
- **Namespace Pattern**: Tree-shakeable functional API via namespace exports
- **File Extensions**: `.ts` for types, `.js` for implementations (enables tree-shaking)
- **Dual API**: Both OOP (class-like) and functional (namespace) variants
- **Test Organization**: Separate `*.test.ts` files (NOT inline tests)

### 4.2 Zig (v0.15.1)
- **Root Modules**: `src/primitives/root.zig`, `src/crypto/root.zig`, `src/evm/precompiles/root.zig`
- **No Late Binding**: Import modules directly: `@import("primitives")`, not `@import("../primitives/address.zig")`
- **Colocated**: address.ts + address.zig in same folder
- **Unmanaged ArrayList** (0.15.1): `std.ArrayList(T){}` without `.init()` 
- **Test Location**: Inline via `test { ... }` in source
- **Fuzz Tests**: Separate `*.fuzz.zig` files
- **Benchmarks**: Separate `*.bench.zig` files with zbench

### 4.3 Rust (Minimal)
- **Location**: `src/crypto/lib.rs` + specific `*_wrapper.rs` files
- **Purpose**: BN254 elliptic curve ops, Keccak FFI for WASM
- **Build**: Cargo compiles to static lib, linked into Zig
- **Features**: 
  - `asm` (default): keccak-asm for native
  - `portable`: tiny-keccak for WASM compatibility

### 4.4 C (Vendored)
- **Blst** - BLS12-381 signatures (lib/blst/)
- **c-kzg-4844** - KZG commitments (lib/c-kzg-4844/)
- **libwally-core** - Wallet utilities (lib/libwally-core/, git submodule)

---

## 5. Test File Organization

### 5.1 TypeScript Tests (290 files, vitest)
```
*.test.ts                          # Standard unit tests
*.wasm.test.ts                    # WASM-specific tests
*.integration.test.ts             # Integration tests
*.test-d.ts                       # Type-level tests (tsd)
```

Examples:
- Address.test.ts
- Address.wasm.test.ts
- bn254.wasm.test.ts
- keccak256.bench.ts
- eip712.bench.ts

### 5.2 Zig Tests (inline + separate)
```
test "feature description" { ... }  # Inline in .zig files
*.fuzz.zig                          # Fuzz testing with Zig fuzzer
*.bench.zig                         # Benchmarks with zbench
```

Examples:
- address.fuzz.zig
- blake2.fuzz.zig
- bn254/benchmarks.zig
- secp256k1.bench.zig

### 5.3 Test Stats
- TypeScript tests: 290 `.test.ts` + 25 `.wasm.test.ts`
- Benchmarks: 40 `.bench.ts` + many `.bench.zig`
- WASM tests: Run separately: `bun run test:wasm`
- Security tests: `zig build test-security`
- Fuzz tests: `zig build -Dtest-filter=fuzz`

---

## 6. Build & Artifact Locations

### 6.1 Zig Build Output
```
zig-out/
├── lib/
│   ├── libblst.a                    # BLS12-381
│   ├── libc_kzg.a                   # KZG commitments
│   └── libcrypto_wrappers.a         # Rust crypto (Cargo)
├── bin/                             # Executables
│   ├── primitives-tests
│   ├── crypto-tests
│   ├── precompiles-tests
│   ├── evm-tests
│   └── examples
└── wasm/                            # WASM artifacts
    ├── primitives.wasm              # ReleaseSmall (~369KB)
    ├── primitives-fast.wasm         # ReleaseFast (~4.5MB)
    └── crypto/                      # Individual modules
```

### 6.2 TypeScript Build Output
```
dist/                               # tsup bundled output
├── index.js / index.cjs             # Main entry point
├── index.d.ts                       # Type definitions
├── primitives/
│   ├── Address/ ├── index.js        # Namespace export
│   ├── Abi/
│   ├── Hex/
│   └── ... (26 more primitive modules)
├── crypto/
│   ├── Keccak256/
│   ├── Secp256k1/
│   ├── Blake2/
│   ├── Bn254/
│   └── ... (16 more crypto modules)
├── primitives.d.ts                  # TypeScript definitions
└── source maps (.js.map)
```

### 6.3 WASM Output
```
wasm/
├── primitives.wasm                  # ReleaseSmall (size-optimized, ~369KB)
├── primitives-fast.wasm             # ReleaseFast (speed-optimized, ~4.5MB)
└── crypto/                          # Individual modules for tree-shaking
    ├── keccak256.wasm
    ├── secp256k1.wasm
    ├── blake2.wasm
    ├── ripemd160.wasm
    ├── ed25519.wasm
    ├── p256.wasm
    └── x25519.wasm
```

### 6.4 Rust Build Output
```
target/
├── release/
│   ├── libcrypto_wrappers.a         # Static library
│   └── build artifacts
└── cache for builds
```

---

## 7. File Naming Conventions

### 7.1 TypeScript
```
Type.ts                            # Type definitions (rarely used, usually BrandedX.ts)
BrandedX.ts                        # Branded type definition
from.ts / fromHex.ts              # Constructor functions
toHex.ts / toBytes.ts             # Conversion functions
equals.ts / validate.ts            # Utility functions
index.ts                          # Main module export (dual API)
X.test.ts                         # Test suite
X.bench.ts                        # Performance benchmark
X.wasm.ts                         # WASM compatibility layer
X.wasm.test.ts                    # WASM-specific tests
X.integration.test.ts             # Integration tests
X.test-d.ts                       # Type-level tests (tsd)
```

### 7.2 Zig
```
module_name.zig                   # Main implementation
module_name_c.zig                 # C FFI wrapper
module_name_accel.zig             # Hardware acceleration (AVX, NEON)
module_name.fuzz.zig              # Fuzz tests
module_name.bench.zig             # Benchmarks (zbench)
constants.zig                     # Constants definitions
utils.zig / common.zig            # Shared utilities
root.zig                          # Module entry point
handlers_category.zig             # Handler groupings (EVM)
```

### 7.3 Rust
```
lib.rs                            # Main library root
module_wrapper.rs                 # FFI wrapper for specific module
mod.rs                            # Submodule definition
```

### 7.4 C/Headers
```
module_wrapper.h                  # C header for Zig FFI
primitives.h                      # Auto-generated from c_api.zig
```

---

## 8. Dependencies & External Libraries

### 8.1 C Libraries (lib/)
```
lib/
├── blst/                          # BLS12-381 signatures
│   └── (BLST repository)
├── c-kzg-4844/                    # KZG commitments for EIP-4844
│   ├── src/
│   ├── blst/                      # Bundled BLST
│   └── bindings/zig/root.zig      # Zig FFI
└── libwally-core/                 # Wallet utilities (git submodule)
    └── (secp256k1, BIP39, BIP32 support)
```

**Build Integration:**
- Auto-compiled by `zig build` via lib/build.zig
- Linked into primitives/crypto tests & binaries
- FFI bindings in Zig

### 8.2 Rust Dependencies (Cargo.toml)
```
arkworks:
  - ark-bn254 0.5.0               # BN254 elliptic curve
  - ark-bls12-381 0.5.0           # BLS12-381 curve
  - ark-ec 0.5.0                  # Elliptic curve operations
  - ark-ff 0.5.0                  # Finite field arithmetic
  - ark-serialize 0.5.0           # Serialization

Keccak:
  - keccak-asm 0.1.4 (default)    # Assembly-optimized (native)
  - tiny-keccak 2.0 (portable)    # Pure Rust (WASM)

Features:
  - default = ["asm"]             # Use optimized version
  - portable = ["tiny-keccak"]    # Use WASM-safe version
```

**Build Output:** `target/release/libcrypto_wrappers.a` → Linked into Zig

### 8.3 Zig Dependencies (build.zig.zon)
```
z_ens_normalize                   # ENS name normalization (Zig)
zbench                            # Benchmarking framework
clap                              # CLI argument parsing
```

### 8.4 Node.js Dependencies (package.json - key ones)
```
Dev Dependencies:
  - @types/node, typescript, vitest # Testing & types
  - biome ^2.0                      # Format/lint (replaces prettier/eslint)
  - tsup                            # Bundling
  - mitata                          # JavaScript benchmarking
  - @noble/curves, @noble/hashes    # Reference crypto
  
Runtime (optional):
  - ox                              # Ethereum utilities
  - whatsabi                        # ABI detection
```

### 8.5 C API Build (libwally-core dependency, optional)
```
Requires:
  - secp256k1 source in libwally-core/src/secp256k1/
  - Build flag: -Dwith-c-api=true
  - Links: libwally.a (built from libwally-core)
```

---

## 9. Examples Directory (29 projects)

```
examples/
├── getting-started/               # Intro examples
├── addresses/                     # Address operations
├── hashing/                       # Hashing examples
├── hex-and-bytes/                # Hex/bytes conversions
├── crypto/                        # Cryptography examples (multiple)
└── (24 more...)

Each example typically:
├── [example].zig                  # Zig implementation
├── [example].ts                   # TypeScript implementation
└── README.md                      # Documentation
```

---

## 10. Build Artifact Locations Summary

| Artifact | Location | Size | Purpose |
|----------|----------|------|---------|
| Main WASM (optimized) | wasm/primitives.wasm | 369 KB | Production (ReleaseSmall) |
| Main WASM (fast) | wasm/primitives-fast.wasm | 4.5 MB | Benchmarking (ReleaseFast) |
| Crypto WASM modules | wasm/crypto/*.wasm | Varies | Tree-shaking support |
| Bundled JS | dist/index.js | 731 KB | ESM export |
| Bundled CJS | dist/index.cjs | 735 KB | CommonJS export |
| Type definitions | types/**/*.d.ts | - | TypeScript types |
| BLS12-381 lib | zig-out/lib/libblst.a | - | Native linking |
| KZG lib | zig-out/lib/libc_kzg.a | - | Native linking |
| Rust crypto | zig-out/lib/libcrypto_wrappers.a | - | Native linking |

---

## 11. Documentation (docs/, 764 pages)

### 11.1 Structure (Mintlify)
```
docs/
├── mint.json                      # Navigation & config (150+ lines)
├── introduction.mdx               # Intro page
├── getting-started.mdx            # Quick start
├── getting-started/               # Getting started guides (8 pages)
│   ├── branded-types.mdx
│   ├── effect.mdx
│   ├── wasm.mdx
│   ├── tree-shaking.mdx
│   ├── llm-optimized.mdx
│   ├── multiplatform.mdx
│   └── powerful-features.mdx
├── primitives/                    # 215 pages, 23 modules
│   ├── abi/
│   ├── accesslist/
│   ├── address/
│   ├── authorization/
│   ├── base64/
│   ├── binarytree/
│   ├── blob/
│   ├── bloomfilter/
│   ├── bytecode/
│   ├── chain/
│   ├── denomination/
│   ├── eventlog/
│   ├── feemarket/
│   ├── gascontants/
│   ├── hardfork/
│   ├── hash/
│   ├── hex/
│   ├── opcode/
│   ├── rlp/
│   ├── siwe/
│   ├── state/
│   ├── transaction/
│   └── uint/
├── crypto/                        # 76 pages, 17 modules
│   ├── blake2/
│   ├── bn254/
│   ├── ed25519/
│   ├── keccak256/
│   ├── kzg/
│   ├── p256/
│   ├── ripemd160/
│   ├── secp256k1/
│   ├── sha256/
│   ├── x25519/
│   └── (7 more)
├── precompiles/                   # 21 pages
│   ├── identity.mdx
│   ├── ecrecover.mdx
│   ├── sha256.mdx
│   ├── ripemd160.mdx
│   ├── modexp.mdx
│   ├── blake2f.mdx
│   ├── bn254_add.mdx
│   ├── bn254_mul.mdx
│   ├── bn254_pairing.mdx
│   ├── bls12_*.mdx (9 more)
│   ├── kzg_point_evaluation.mdx
│   └── (and more)
├── jsonrpc/                       # JSON-RPC docs
├── provider/                      # Provider abstraction
├── evm/                           # EVM execution
└── examples-navigation.json       # Example links
```

### 11.2 Documentation Stats
- **Total Pages**: 764 MDX/Markdown files
- **Getting Started**: 2 pages + 8 guide pages
- **Primitives**: 215 pages (23 modules)
- **Cryptography**: 76 pages (17 modules)
- **Precompiles**: 21 pages
- **Other**: JSON-RPC, Provider, EVM sections
- **Format**: MDX with YAML frontmatter
- **Build**: Mintlify dev server (localhost:3000)

---

## 12. Scripts Directory (27 utilities)

```
scripts/
├── run-benchmarks.ts              # Generate BENCHMARKING.md
├── measure-bundle-sizes.ts        # Generate BUNDLE-SIZES.md
├── generate-comparisons.ts        # Compare vs ethers/viem/noble
├── compare-wasm-modes.ts          # ReleaseSmall vs ReleaseFast
├── generate_c_header.zig          # Auto-generate C API header
└── (22 more utility scripts)
```

Run: `bun run scripts/<name>.ts`

---

## 13. Module Export Pattern

### 13.1 Index Export (index.ts)
```typescript
// Primitives
export * as Address from "./primitives/Address/index.js";
export * as Hex from "./primitives/Hex/index.js";
export * as Hash from "./primitives/Hash/index.js";
export * as Rlp from "./primitives/Rlp/index.js";
export * as Abi from "./primitives/Abi/index.js";
// ... 28 more

// Crypto
export * as Keccak256 from "./crypto/Keccak256/index.js";
export * as Secp256k1 from "./crypto/Secp256k1/index.js";
export * as Bn254 from "./crypto/Bn254/index.js";
// ... 16 more

// EVM
export * as Evm from "./evm/index.js";

// Precompiles
export * as Precompiles from "./evm/precompiles/precompiles.js";
```

### 13.2 Package.json Exports
```json
{
  "./Address": "./dist/primitives/Address/index.js",
  "./Keccak256": "./dist/crypto/Keccak256/index.js",
  "./Hex": "./dist/primitives/Hex/index.js",
  // ... 60+ module entries
}
```

---

## 14. Key Patterns & Conventions

### 14.1 Branded Type Pattern
- **Zero Runtime Overhead**: Type-only branding via TypeScript
- **Tree-Shaking**: `.js` implementation files (not `.ts`) → Allows bundlers to eliminate unused code
- **Dual API**: 
  - Class-like: `new Address(hex)`
  - Namespace: `Address.from(hex)`
  - Both equally performant

### 14.2 Colocated Implementation
- TypeScript (.ts) + Zig (.zig) in same directory
- Example: `Address.ts` + `address.zig` (snake_case for Zig)
- Maintains logical grouping across languages

### 14.3 FFI/WASM Strategy
- **Native**: Zig → Compiled to .dylib/.so via Bun FFI
- **WASM**: Zig → WASM via wasm32-wasi target
- **Fallback**: TypeScript pure implementations (@noble packages)
- **Rust Wrapper**: For performance-critical ops (BN254, Keccak)

### 14.4 Test Organization
- **TypeScript**: Separate files (vitest)
- **Zig**: Inline + separate .fuzz.zig/.bench.zig
- **No Test Stubs**: Every test is real, runs in CI
- **Coverage**: Unit + Integration + Security + Fuzz tests

### 14.5 Build Variants
- **ReleaseSmall**: WASM (size-optimized, ~369KB)
- **ReleaseFast**: Benchmarking (speed, ~4.5MB)
- **Debug**: Development (includes symbols)

---

## 15. Notable File Statistics

| Category | Count | Notes |
|----------|-------|-------|
| Total Source Files | 1,001 | Across TS/Zig/Rust |
| TypeScript Files | 776 | Including tests, benchmarks |
| Zig Files | 222 | Including tests, benchmarks, fuzz |
| Rust Files | 3 | Crypto wrapper implementations |
| Primitive Modules | 32 | A-Z coverage (Abi to Uint) |
| Crypto Modules | 15 | Hash, signatures, curves |
| EVM Categories | 14 | Arithmetic, memory, storage, etc. |
| Precompile Implementations | 21+ | EVM precompiles 0x01-0x14 |
| JSON-RPC Methods | 72+ | ETH, Engine, Debug namespaces |
| Test Files | 290 | .test.ts files |
| Benchmark Files | 40+ | .bench.ts files |
| WASM Variants | 25 | .wasm.ts files |
| Documentation Pages | 764 | MDX files |
| Example Projects | 29 | Zig + TS implementations |
| Build Config Lines | 1,272 | build.zig (1194) + build.zig.zon (78) |
| C Libraries | 3 | Blst, c-kzg-4844, libwally-core |
| Rust Dependencies | 8 | Arkworks (4), Keccak variants (2), Serialize (1) |
| Zig Dependencies | 3 | z_ens_normalize, zbench, clap |

---

## 16. Code Colocation Examples

### Example 1: Address Primitive
```
/src/primitives/Address/
├── BrandedAddress/BrandedAddress.ts      # Type definition
├── from.ts                                # Constructor
├── toHex.ts                               # Conversion
├── equals.ts                              # Comparison
├── validate.ts                            # Validation
├── index.ts                               # Dual API export
├── Address.test.ts                        # Unit tests
├── Address.bench.ts                       # Benchmarks
├── Address.wasm.ts                        # WASM variant
├── address.zig                            # Zig implementation (colocated)
└── address.fuzz.zig                       # Fuzz tests
```

### Example 2: Keccak256 Crypto
```
/src/crypto/Keccak256/
├── BrandedKeccak256.ts                    # Type definition
├── hash.ts                                # Direct hash
├── hashHex.ts                             # Hex string hash
├── selector.ts                            # Function selector
├── topic.ts                               # Event topic
├── index.ts                               # Export
├── Keccak256.test.ts                      # Unit tests
├── Keccak256.bench.ts                     # Benchmarks
├── Keccak256.wasm.ts                      # WASM variant

Implementations:
├── keccak256.zig                          # Main Zig
├── keccak256_c.zig                        # C FFI wrapper
├── keccak256_accel.zig                    # Hardware acceleration
└── keccak_wrapper.rs                      # Rust WASM wrapper
```

---

## 17. Build Pipeline

### Build Steps
1. **Verify Dependencies**: Check vendored C libs exist
2. **Verify Cargo**: Ensure Rust toolchain installed
3. **Build Rust**: `cargo build` → libcrypto_wrappers.a
4. **Build C Libraries**: 
   - blst → libblst.a
   - c-kzg-4844 → libc_kzg.a
5. **Build Zig**: Compile source, link C/Rust libs
6. **Run Tests**: 
   - Zig tests (inline)
   - TypeScript tests (vitest)
7. **Build TypeScript**: tsup bundling → dist/
8. **Generate Types**: Generate .d.ts from source
9. **Build WASM**: 
   - ReleaseSmall (primitives.wasm)
   - ReleaseFast (primitives-fast.wasm)
   - Individual modules

### Build Commands
```bash
# Full build
zig build                                   # Everything

# Language-specific
bun run build:zig                          # Zig only
bun run build:wasm                         # WASM only
bun run build:dist                         # TypeScript bundling

# Testing
zig build test                             # All Zig tests
bun run test:run                           # All TS tests
bun run test:wasm                          # WASM tests
zig build test-security                    # Security tests
```

---

## Summary

Voltaire is a **multi-language Ethereum primitives & cryptography library** with:

- **1,001 source files** across TypeScript (776), Zig (222), and Rust (3)
- **32 primitive modules** providing Ethereum data types
- **15 crypto modules** with multiple algorithm implementations
- **14 EVM execution categories** + 21 precompile implementations
- **Zero-cost TypeScript abstractions** via branded types
- **Native + WASM support** with separate optimization modes
- **Colocated implementations** (TS + Zig side-by-side)
- **Comprehensive test coverage**: 290 unit tests, 40+ benchmarks, fuzz tests
- **764 pages of documentation** across Mintlify
- **29 example projects** demonstrating usage
- **Vendored C libraries**: Blst, c-kzg-4844, libwally-core
- **Tree-shakeable exports** for minimal bundle size

The architecture prioritizes **type safety**, **performance**, and **cross-platform support** (native + WASM).

