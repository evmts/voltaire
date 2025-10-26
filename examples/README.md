# Examples

This directory contains comprehensive examples demonstrating the usage of Ethereum primitives and cryptographic operations in both Zig and TypeScript.

## Quick Start

### Running Zig Examples

```bash
# Build the project first
zig build

# Run examples directly with zig
zig build run -- examples/address.zig
zig build run -- examples/hex.zig
zig build run -- examples/transaction.zig
```

### Running TypeScript Examples

```bash
# Install dependencies
bun install

# Run TypeScript examples
bun run examples/eip191-eip712-usage.ts

# Run organized TypeScript examples
bun run examples/typescript/01-hex-and-hashing.ts
bun run examples/typescript/02-rlp-encoding.ts
bun run examples/typescript/03-transactions.ts
```

## Zig Examples

### Core Primitives

#### `address.zig` - Address Operations
Demonstrates Ethereum address handling:
- Creating addresses from hex strings
- EIP-55 checksum validation and encoding
- Converting addresses to different formats
- Computing CREATE and CREATE2 contract addresses
- Deriving addresses from public keys

```bash
zig build run -- examples/address.zig
```

#### `hex.zig` - Hex Encoding/Decoding
Shows hex utility functions:
- Converting between hex strings and byte arrays
- Validating hex format
- Padding and trimming hex values
- Converting between hex and uint256

```bash
zig build run -- examples/hex.zig
```

#### `rlp.zig` - RLP Encoding/Decoding
Covers Recursive Length Prefix encoding:
- Encoding single values (strings, numbers, bytes)
- Encoding nested lists
- Decoding RLP data
- Handling complex nested structures

```bash
zig build run -- examples/rlp.zig
```

### ABI Encoding

#### `abi.zig` - Basic ABI Encoding/Decoding
Basic ABI functionality:
- Function selector computation
- Parameter encoding and decoding
- Type handling (address, uint256, bytes, etc.)
- Event topic encoding

```bash
zig build run -- examples/abi.zig
```

#### `abi_workflow.zig` - Complete ABI Workflow
End-to-end ABI example:
- Encoding function calls with complex types
- Decoding function results
- Handling arrays and structs
- Error handling and validation

```bash
zig build run -- examples/abi_workflow.zig
```

### Cryptography

#### `keccak256.zig` - Keccak-256 Hashing
Keccak-256 hash function usage:
- Hashing strings and byte arrays
- Computing function selectors
- Event signature hashing
- EIP-191 personal message hashing

```bash
zig build run -- examples/keccak256.zig
```

#### `secp256k1.zig` - secp256k1 Signatures
ECDSA signature operations:
- Generating private/public key pairs
- Signing messages and hashes
- Verifying signatures
- Recovering addresses from signatures
- Key serialization

```bash
zig build run -- examples/secp256k1.zig
```

#### `eip712.zig` - EIP-712 Typed Data Signing
Structured data signing (EIP-712):
- Creating typed data domains
- Defining type structures
- Hashing typed data
- Signing and verifying typed data
- Real-world permit example

```bash
zig build run -- examples/eip712.zig
```

#### `signature_recovery.zig` - ECRECOVER Signature Recovery
Advanced signature recovery:
- Using the ecrecover precompile
- Extracting v, r, s components
- Handling different v values (27/28)
- Chain-specific signatures (EIP-155)
- Address recovery from message hashes

```bash
zig build run -- examples/signature_recovery.zig
```

### Transactions

#### `transaction.zig` - Transaction Encoding
Transaction creation and encoding:
- Legacy transactions
- EIP-1559 transactions (Type 2)
- Transaction signing
- Computing transaction hashes
- Access lists (EIP-2930)

```bash
zig build run -- examples/transaction.zig
```

#### `eip4844_blob_transaction.zig` - Blob Transactions (EIP-4844)
Blob transaction support for data availability:
- Creating blob transactions
- Computing blob versioned hashes
- KZG commitments and proofs
- Blob fee market calculations
- Full EIP-4844 workflow

```bash
zig build run -- examples/eip4844_blob_transaction.zig
```

#### `eip7702_authorization.zig` - Authorization Lists (EIP-7702)
Account abstraction authorization:
- Creating authorization tuples
- Signing authorizations
- Encoding authorization lists
- Chain ID handling
- Nonce management

```bash
zig build run -- examples/eip7702_authorization.zig
```

### Advanced Cryptography

#### `bls_operations.zig` - BLS12-381 Operations
BLS12-381 elliptic curve operations:
- G1 and G2 point operations
- Point addition and scalar multiplication
- Pairing checks
- Multi-scalar multiplication (MSM)
- Signature aggregation concepts

```bash
zig build run -- examples/bls_operations.zig
```

## TypeScript Examples

### Main TypeScript Example

#### `eip191-eip712-usage.ts` - EIP-191 and EIP-712 in TypeScript
Demonstrates TypeScript/JavaScript usage:
- EIP-191 personal message signing
- EIP-712 typed data signing
- Integration with browser wallets
- Signature verification

```bash
bun run examples/eip191-eip712-usage.ts
```

### Organized TypeScript Examples

The `typescript/` subdirectory contains a structured learning path. See [typescript/README.md](./typescript/README.md) for details.

#### `01-hex-and-hashing.ts`
- Hex encoding/decoding utilities
- Keccak-256 hashing
- EIP-191 message hashing

#### `02-rlp-encoding.ts`
- RLP encoding for simple types
- RLP encoding for lists
- RLP decoding

#### `03-transactions.ts`
- Transaction types and structures
- Transaction encoding
- Transaction hashing

#### `04-gas-calculations.ts`
- EIP-1559 fee calculations
- Intrinsic gas costs
- Memory expansion costs

#### `05-bytecode-analysis.ts`
- JUMPDEST analysis
- Bytecode validation
- Opcode utilities

#### `06-siwe-and-logs.ts`
- Sign-In with Ethereum (SIWE)
- Event log parsing
- Log filtering

## Example Categories

### By Difficulty

**Beginner:**
- `hex.zig` - Simple conversions
- `address.zig` - Address basics
- `keccak256.zig` - Hashing

**Intermediate:**
- `rlp.zig` - Encoding/decoding
- `transaction.zig` - Transaction basics
- `abi.zig` - ABI encoding

**Advanced:**
- `eip712.zig` - Typed data signing
- `eip4844_blob_transaction.zig` - Blob transactions
- `bls_operations.zig` - Advanced cryptography

### By Use Case

**Building Wallets:**
- `address.zig` - Address management
- `secp256k1.zig` - Key management
- `transaction.zig` - Transaction signing
- `signature_recovery.zig` - Signature verification

**Smart Contract Interaction:**
- `abi.zig` / `abi_workflow.zig` - Function encoding
- `hex.zig` - Data formatting
- `keccak256.zig` - Event signatures

**Data Availability:**
- `eip4844_blob_transaction.zig` - Blob transactions
- `rlp.zig` - Data encoding

**Authentication:**
- `eip191-eip712-usage.ts` - Message signing
- `signature_recovery.zig` - Signature verification

## Building and Running

### Prerequisites

**For Zig examples:**
- Zig 0.15.1+ ([download](https://ziglang.org/download/))
- Rust/Cargo for crypto dependencies

**For TypeScript examples:**
- Node.js 18+ or Bun
- Built native library (for FFI examples)

### Build Commands

```bash
# Build everything
zig build

# Build with examples (if configured)
zig build examples

# Test examples (if tests exist)
zig build test
```

### Debugging Examples

Add print statements for debugging:

```zig
const std = @import("std");

// In your example
std.debug.print("Value: {any}\n", .{my_value});
```

## Contributing Examples

We welcome new examples! When contributing:

1. **Pick a focused topic** - One concept per example
2. **Add comments** - Explain what each section does
3. **Include error handling** - Show proper error handling patterns
4. **Add to this README** - Document your example in the appropriate section
5. **Follow conventions** - Match the style of existing examples

See [CONTRIBUTING.md](../CONTRIBUTING.md) for full guidelines.

## Example Template

### Zig Example Template

```zig
const std = @import("std");
const primitives = @import("primitives");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Your example code here
    std.debug.print("Example output\n", .{});
}
```

### TypeScript Example Template

```typescript
import { someFunction } from '@tevm/primitives';

// Your example code here
const result = someFunction(input);
console.log('Result:', result);
```

## Common Issues

### "Cannot find module 'primitives'"
Ensure you're running from the project root with a proper build:
```bash
zig build
```

### "Undefined symbols" errors
Link required C artifacts in your build configuration. See [ZIG_API.md](../ZIG_API.md#using-as-a-dependency).

### "Module not found" in TypeScript
Install dependencies:
```bash
bun install
```

## Related Documentation

- [README.md](../README.md) - Main project documentation
- [ZIG_API.md](../ZIG_API.md) - Complete Zig API reference
- [TYPESCRIPT_API.md](../docs/TYPESCRIPT_API.md) - TypeScript API documentation
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines

## Questions?

- Open a [GitHub issue](https://github.com/evmts/primitives/issues)
- Check existing examples for similar use cases
- Review API documentation linked above

---

**Happy coding!** 🚀
