---
title: TypeScript API
description: Ethereum primitives and cryptography for TypeScript/JavaScript
---

## Overview

The `@tevm/primitives` package provides TypeScript/JavaScript implementations of Ethereum primitives and utilities. All implementations are pure TypeScript with zero native dependencies required, making them work in any JavaScript environment (Node.js, Bun, Deno, browsers).

## Features

- **Pure TypeScript** - Works anywhere JavaScript runs
- **Type-safe** - Full TypeScript support with comprehensive type definitions
- **Zero native dependencies** - All TypeScript implementations work standalone
- **Optional native performance** - High-performance Zig implementations available via FFI/WASM
- **Battle-tested** - Validated against Ethereum test vectors
- **Modern** - Supports latest EIPs including EIP-1559, EIP-4844, EIP-7702

## Installation

```bash
# Using npm
npm install @tevm/primitives

# Using bun
bun add @tevm/primitives
```

## Quick Start

```typescript
import {
  keccak256,
  hexToBytes,
  bytesToHex,
  hashMessage,
  Hardfork,
  isAtLeast,
  Opcode,
} from '@tevm/primitives';

// Keccak-256 hashing (via @noble/hashes)
const data = new TextEncoder().encode('hello world');
const hash = keccak256(data);
console.log('Hash:', bytesToHex(hash));

// EIP-191 personal message hashing
const msgHash = hashMessage('Sign this message');

// Hex utilities
const bytes = hexToBytes('0xabcd1234');
const hex = bytesToHex(bytes); // "0xabcd1234"

// Hardfork comparisons
if (isAtLeast(Hardfork.CANCUN, Hardfork.LONDON)) {
  console.log('Cancun includes London features');
}

// EVM opcodes
const addOpcode = Opcode.ADD;      // 0x01
const pushOpcode = Opcode.PUSH1;   // 0x60
```

## Modules

### Core Primitives

- **Hex Utilities** - Convert between hex strings and bytes
- **Keccak-256** - Cryptographic hashing (via @noble/hashes)
- **EIP-191** - Personal message hashing
- **EIP-712** - Typed structured data hashing
- **Signers** - Private key, HD wallet, and hardware wallet signers (via @noble/curves)

### Ethereum Types

- **Transactions** - Legacy, EIP-1559 (Type 2), EIP-7702 (Type 4)
- **Blocks** - Block headers and complete blocks
- **Receipts** - Transaction receipts with logs
- **Logs** - Event log parsing and filtering
- **Filters** - Block and log filters

### EVM Features

- **Bytecode Analysis** - Jump destination analysis, validation
- **Opcodes** - Complete EVM opcode enumeration with utilities
- **Gas Calculations** - EIP-1559 fee market, intrinsic gas, memory costs
- **Hardforks** - Version comparisons, chronological ordering
- **Precompiles** - Gas cost calculations for all precompiles (0x01-0x13)

### Standards

- **SIWE (EIP-4361)** - Sign-In with Ethereum message handling
- **Event Logs** - Topic filtering, signature hashing
- **Access Lists (EIP-2930)** - Gas cost calculations

## Platform Compatibility

Works in all modern JavaScript environments:
- **Node.js** 18+ (LTS)
- **Bun** - Full support including optional FFI for native bindings
- **Deno** - Full support via npm imports
- **Browsers** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

All require BigInt support (available in all modern runtimes).

## Performance

TypeScript implementations prioritize correctness and compatibility:

- **Keccak-256**: ~2-5 MB/s (via @noble/hashes)
- **Transaction encoding**: ~1-5k tx/s
- **Hex conversions**: ~50-100 MB/s
- **Bytecode analysis**: ~10-50 MB/s

For high-performance applications requiring 10-100x faster operations, consider the optional [native Zig implementation](/zig-api/).

## Next Steps

- [Getting Started](/typescript/getting-started/) - Detailed installation and setup
- [Crypto API](/typescript/crypto/) - Cryptographic operations
- [Primitives API](/typescript/primitives/) - Core Ethereum primitives
- [Ethereum Types](/typescript/ethereum-types/) - Transaction, block, and receipt types
