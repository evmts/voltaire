<div align="center">
  <h1>
    <br/>
    <br/>
    ⚡
    <br />
    primitives
    <br />
    <br />
    <br />
    <br />
  </h1>
  <sup>
    <br />
    <br />
    <a href="https://github.com/evmts/primitives">
       <img src="https://img.shields.io/badge/zig-0.15.1+-orange.svg" alt="zig version" />
    </a>
    <a href="https://github.com/evmts/primitives/actions">
      <img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="build status" />
    </a>
    <a href="https://github.com/evmts/primitives">
      <img src="https://img.shields.io/badge/tests-passing-brightgreen.svg" alt="tests" />
    </a>
    <br />
    <em>Ethereum primitives and cryptography for Zig.</em>
    <br />
    <em>Production-grade types and operations for blockchain development.</em>
  </sup>
  <br />
  <br />
  <br />
  <br />
  <pre>git clone https://github.com/evmts/primitives.git</pre>
  <br />
  <br />
  <br />
  <br />
  <br />
</div>

- [**Primitives**](#primitives)
  - [`uint256`](#uint256) &mdash; 256-bit unsigned integer with overflow-checked arithmetic
  - [`Address`](#address) &mdash; Ethereum address type with EIP-55 checksumming
  - [`Hex`](#hex) &mdash; hexadecimal encoding and decoding utilities
  - [`RLP`](#rlp) &mdash; Recursive Length Prefix serialization
  - [`ABI`](#abi) &mdash; Application Binary Interface encoding/decoding
  - [`Transactions`](#transactions) &mdash; all transaction types (Legacy, EIP-1559, EIP-2930, EIP-4844, EIP-7702)
  - [`Logs`](#logs) &mdash; event log structures with topic handling
    <br/>
    <br/>
- [**Cryptography**](#cryptography)
  - [`keccak256`](#keccak256) &mdash; Ethereum's primary hash function
  - [`secp256k1`](#secp256k1) &mdash; ECDSA signatures for transaction signing
  - [`BLS12-381`](#bls12-381) &mdash; pairing-friendly curve operations (via BLST)
  - [`BN254`](#bn254) &mdash; alt_bn128 curve for zkSNARK verification
  - [`KZG`](#kzg) &mdash; polynomial commitments for EIP-4844 blobs
  - [`SHA256`](#sha256) &mdash; standard SHA-256 hashing
  - [`RIPEMD160`](#ripemd160) &mdash; legacy hash function
  - [`Blake2`](#blake2) &mdash; high-performance hashing
    <br/>
    <br/>
- [**External Libraries**](#external-libraries)
  - [`lib/blst`](#libblst) &mdash; BLS12-381 C implementation
  - [`lib/c-kzg-4844`](#libc-kzg-4844) &mdash; KZG commitments (Ethereum Foundation)
  - [`lib/ark`](#libark) &mdash; BN254 curve via arkworks ecosystem
    <br/>
    <br/>

---

<br />

## Features

✨ **Zero EVM Dependencies** - Pure primitives and crypto, no execution engine

🔒 **Production Grade** - Memory-safe with comprehensive test coverage

⚡ **High Performance** - Minimal allocations, cache-conscious design

🎯 **Type Safe** - Strong typing throughout, compile-time guarantees

📦 **Minimal** - Only what you need, nothing more

🧪 **Well Tested** - Every operation tested against specifications

<br />

---

<br />

## Quick Start

```bash
# Clone repository
git clone https://github.com/evmts/primitives.git
cd primitives

# Initialize submodules (required for crypto libraries)
git submodule update --init --recursive

# Build
zig build

# Run tests
zig build test
```

<br />

---

<br />

## Usage Examples

### Primitives

#### uint256

```zig
const primitives = @import("primitives");

// Create from integer
const value = primitives.uint256.fromInt(42);

// Arithmetic with overflow detection
const a = primitives.uint256.max();
const b = primitives.uint256.fromInt(1);
const result = a.addWithOverflow(b);
if (result.overflow) {
    // Handle overflow
}

// Conversion
const bytes = value.toBytes();
const hex_string = value.toHexString();
```

#### Address

```zig
const addr = try primitives.Address.fromString("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");

// EIP-55 checksum validation
const is_valid = addr.isChecksumValid();

// Contract address derivation
const deployer = primitives.Address.fromString("0x...");
const nonce: u64 = 1;
const contract_addr = primitives.Address.deriveContractAddress(deployer, nonce);
```

#### RLP Encoding

```zig
// Encode data
var rlp_encoder = primitives.RLP.encoder(allocator);
try rlp_encoder.encodeString("hello");
try rlp_encoder.encodeUint(42);
const encoded = try rlp_encoder.finish();

// Decode data
var decoder = primitives.RLP.decoder(encoded);
const string_val = try decoder.decodeString();
const uint_val = try decoder.decodeUint(u64);
```

#### Transactions

```zig
// EIP-1559 transaction
const tx = primitives.Transaction{
    .type = .EIP1559,
    .chain_id = 1,
    .nonce = 0,
    .max_fee_per_gas = 50_000_000_000,
    .max_priority_fee_per_gas = 2_000_000_000,
    .gas_limit = 21000,
    .to = recipient_address,
    .value = primitives.uint256.fromInt(1_000_000_000_000_000_000), // 1 ETH
    .data = &.{},
};

// Sign transaction
const signature = try tx.sign(private_key);

// Verify signature
const recovered_address = try tx.recoverSigner(signature);
```

### Cryptography

#### Keccak-256

```zig
const crypto = @import("crypto");

// Hash data
const data = "hello world";
const hash = crypto.keccak256(data);

// Hash with streaming
var hasher = crypto.Keccak256.init();
hasher.update("hello ");
hasher.update("world");
const result = hasher.final();
```

#### secp256k1 Signatures

```zig
// Generate key pair
const private_key = crypto.secp256k1.generatePrivateKey();
const public_key = crypto.secp256k1.derivePublicKey(private_key);

// Sign message
const message_hash = crypto.keccak256("important message");
const signature = try crypto.secp256k1.sign(message_hash, private_key);

// Verify signature
const is_valid = crypto.secp256k1.verify(message_hash, signature, public_key);

// Recover public key from signature
const recovered_key = try crypto.secp256k1.recover(message_hash, signature);
```

#### KZG Commitments (EIP-4844)

```zig
// Compute commitment for blob
const blob: [131072]u8 = /* blob data */;
const commitment = try crypto.c_kzg.blobToKZGCommitment(&blob);

// Generate proof
const z: [32]u8 = /* evaluation point */;
const proof_data = try crypto.c_kzg.computeKZGProof(&blob, &z);

// Verify proof
const is_valid = try crypto.c_kzg.verifyKZGProof(
    &commitment,
    &z,
    &proof_data.y,
    &proof_data.proof
);
```

<br />

---

<br />

## Architecture

### Design Principles

1. **Memory Safety** - Explicit ownership, no undefined behavior
2. **Correctness** - Spec compliance over performance shortcuts
3. **Zero Dependencies** - Only vetted cryptographic libraries
4. **No Logging** - Library code, not application code

### Module Organization

```
src/
├── primitives/        # Core Ethereum types
│   ├── uint256.zig   # 256-bit integers
│   ├── address.zig   # Ethereum addresses
│   ├── hex.zig       # Hex encoding/decoding
│   ├── rlp.zig       # RLP serialization
│   ├── abi.zig       # ABI encoding/decoding
│   ├── transaction.zig # Transaction types
│   └── logs.zig      # Event logs
│
├── crypto/           # Cryptographic operations
│   ├── hash.zig      # Keccak-256, SHA256, etc.
│   ├── secp256k1.zig # ECDSA signatures
│   ├── bls12_381.zig # BLS operations
│   ├── bn254.zig     # zkSNARK curve
│   └── modexp.zig    # Modular exponentiation
│
└── root.zig          # Public API exports

lib/
├── blst/             # BLS12-381 (C library)
├── c-kzg-4844/       # KZG commitments (C library)
└── ark/              # BN254 curve (Rust library)
```

<br />

---

<br />

## Testing

All code is thoroughly tested:

```bash
# Run all tests
zig build test

# Filter specific tests
zig build test -Dtest-filter='uint256'
zig build test -Dtest-filter='keccak'

# Release builds for performance testing
zig build -Doptimize=ReleaseFast
```

Tests include:
- Unit tests for every operation
- Known test vectors from Ethereum specifications
- Edge case testing (overflow, underflow, boundary conditions)
- Cross-validation against reference implementations

<br />

---

<br />

## Requirements

- **Zig 0.15.1+** - [Download Zig](https://ziglang.org/download/)
- **Git** - For submodule management
- **C Compiler** - For building external libraries (automatically handled)

### Platform Support

- ✅ macOS (arm64, x86_64)
- ✅ Linux (arm64, x86_64)
- ✅ Windows (x86_64)
- 🚧 WASM (partial support, KZG operations not available)

<br />

---

<br />

## Security

### Cryptographic Safety

This library handles sensitive cryptographic operations. We follow strict security practices:

- ✅ Constant-time operations where required
- ✅ Input validation on all operations
- ✅ Memory is securely cleared after use
- ✅ No timing side-channels in crypto code
- ✅ External libraries are security-audited

### External Library Audits

- **BLST** (BLS12-381) - Production-grade, widely deployed
- **c-kzg-4844** - Audited by Sigma Prime (June 2023)
- **arkworks** - Production-tested cryptographic library

### Reporting Security Issues

Please report security vulnerabilities to [security contact]. Do not open public issues for security concerns.

<br />

---

<br />

## Performance

Optimized for production use:

- Minimal allocations (arena allocation where possible)
- Cache-conscious data structures
- Zero-copy operations where feasible
- Compile-time optimization via Zig's comptime

Benchmark against other implementations:
```bash
zig build -Doptimize=ReleaseFast
# Run your benchmarks
```

<br />

---

<br />

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Key Requirements:**
- All tests must pass (`zig build test`)
- Follow coding standards in [CLAUDE.md](./CLAUDE.md)
- Memory safety is non-negotiable
- No logging in library code

<br />

---

<br />

## Documentation

- [CLAUDE.md](./CLAUDE.md) - Development guidelines and coding standards
- [CONTRIBUTING.md](./CONTRIBUTING.md) - How to contribute
- [src/README.md](./src/README.md) - Source code organization
- [lib/README.md](./lib/README.md) - External library documentation
- [src/primitives/README.md](./src/primitives/README.md) - Primitives module details
- [src/crypto/README.md](./src/crypto/README.md) - Cryptography module details

<br />

---

<br />

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Ethereum specification
- [EIP Standards](https://eips.ethereum.org/) - Ethereum Improvement Proposals
- [Zig Language](https://ziglang.org/documentation/0.15.1/) - Zig documentation

<br />

---

<br />

## License

[Include your license here]

<br />
<br />
<br />

<p align="center">
  <strong>Made with ⚡ by the EVMts team</strong>
</p>

<br />
<br />
