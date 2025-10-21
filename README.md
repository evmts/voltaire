# Primitives - Ethereum Core Types & Cryptography

**A focused Zig library providing Ethereum's foundational types and cryptographic operations**

---

## 📦 What's Inside

This library provides the essential building blocks for Ethereum development:

### **Primitives Module** (`src/primitives/`)
Core Ethereum types and encoding:
- **uint256** - 256-bit arithmetic operations
- **Address** - Ethereum address handling and derivation
- **Hex** - Hexadecimal encoding/decoding
- **RLP** - Recursive Length Prefix encoding/decoding
- **ABI** - Application Binary Interface encoding/decoding
- **Transactions** - Transaction types (Legacy, EIP-1559, EIP-2930, EIP-4844)
- **Logs** - Event log structures

### **Cryptography Module** (`src/crypto/`)
Production-grade cryptographic operations:
- **Keccak-256** - Ethereum's primary hash function
- **secp256k1** - ECDSA signatures for transactions
- **BLS12-381** - Pairing-friendly curve operations (via BLST)
- **BN254** - Alt-BN128 for zkSNARK verification
- **KZG Commitments** - EIP-4844 blob commitments
- **SHA256, RIPEMD160, Blake2** - Additional hash functions

---

## 🔨 Building

**Requirements:**
- Zig 0.15.1+
- Git (for submodules)

**Setup:**
```bash
git clone <repository-url>
cd primitives
git submodule update --init --recursive
zig build
```

**Run Tests:**
```bash
zig build test
```

---

## 📚 Usage

```zig
const primitives = @import("primitives");
const crypto = @import("crypto");

// Use uint256
const value = primitives.uint256.fromInt(42);

// Hash with Keccak-256
const hash = crypto.keccak256("hello");

// Work with addresses
const addr = primitives.Address.fromString("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
```

---

## 🏗️ Architecture

**Zero EVM Dependencies** - This library contains ONLY primitives and cryptography. No EVM execution engine, no bytecode processing, no state management.

**External C Libraries:**
- `lib/blst/` - BLS12-381 implementation
- `lib/c-kzg-4844/` - KZG commitments
- `lib/ark/` - BN254 curve operations

**Design Principles:**
- Memory safety with explicit ownership
- Strong typing and comprehensive testing
- Minimal allocations and cache-conscious data structures
- Zero tolerance for undefined behavior

---

## 📖 Documentation

- [src/README.md](src/README.md) - Source code overview
- [src/primitives/README.md](src/primitives/README.md) - Primitives module details
- [src/crypto/README.md](src/crypto/README.md) - Crypto module details
- [CLAUDE.md](CLAUDE.md) - Development guidelines

---

## 🧪 Testing

All code is thoroughly tested:
- Unit tests embedded in source files
- Comprehensive test coverage for all operations
- All tests must pass before any commit

Run tests: `zig build test`

---

## 🤝 Contributing

See [CLAUDE.md](CLAUDE.md) for development guidelines and coding standards.

**Key Rules:**
- Every code change must include tests
- Build must succeed: `zig build && zig build test`
- Follow memory safety protocols
- Zero tolerance for broken builds or failing tests

---

## 📜 License

[Include your license here]

---

## 🔗 Links

- [Zig Language](https://ziglang.org/)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [EIP Standards](https://eips.ethereum.org/)
