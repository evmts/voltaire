# Primitives

Low-level Ethereum utilities for Zig - like Ethers.js but without provider functionality (see `src/provider` for that).

## Overview

Fundamental types and utilities used throughout Guillotine. Cryptographic primitives are separated into `src/crypto`.

## API

### Core Types
- `address.zig` - 20-byte Ethereum addresses with checksumming
- `transaction.zig` - Transaction types (legacy, EIP-2930, EIP-1559, EIP-4844)
- `authorization.zig` - EIP-7702 authorization lists
- `access_list.zig` - EIP-2930 access list structures
- `blob.zig` - EIP-4844 blob transaction types
- `state.zig` - Account state representations

### Encoding/Decoding
- `rlp.zig` - Recursive Length Prefix encoding/decoding
- `abi.zig` - ABI type definitions
- `abi_encoding.zig` - ABI encoding/decoding implementation
- `hex.zig` - Hexadecimal encoding utilities

### Utilities
- `numeric.zig` - Numeric type conversions and utilities
- `event_log.zig` - Event/log structures
- `fee_market.zig` - EIP-1559 fee market calculations
- `gas_constants.zig` - Gas cost constants
- `siwe.zig` - Sign-In with Ethereum message parsing

### Module Export
- `root.zig` - Public API exports

## Usage

```zig
const primitives = @import("primitives");

// Create an address
const addr = primitives.Address.from_hex("0x742d35Cc6634C0532925a3b844Bc9e7595f6E97b");

// RLP encode data
const encoded = try primitives.rlp.encode(allocator, data);

// Parse a transaction
const tx = try primitives.Transaction.decode(raw_tx_bytes);
```