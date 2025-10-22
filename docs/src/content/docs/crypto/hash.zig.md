# hash.zig - Hash Types and Utilities Module

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code and official specifications.**

## Overview

The `hash.zig` module provides a comprehensive hash type system and utilities for Ethereum. It serves as the main entry point for hash-related operations, re-exporting core types and functions from the underlying `hash_utils.zig` module. This module is based on Alloy's hash implementation with Zig optimizations.

## Module Location

`/Users/williamcory/primitives/src/crypto/hash.zig`

## Core Types

The module re-exports the following types from `hash_utils.zig`:

### Hash

```zig
pub const Hash = hash.Hash;
```

A 32-byte (256-bit) hash value, typically a Keccak256 digest.

### B256

```zig
pub const B256 = hash.B256;
```

Alias for 32-byte array `[32]u8`, representing a 256-bit value.

### BlockHash

```zig
pub const BlockHash = hash.BlockHash;
```

Type alias for block hash values (32 bytes).

### TxHash

```zig
pub const TxHash = hash.TxHash;
```

Type alias for transaction hash values (32 bytes).

### StorageKey

```zig
pub const StorageKey = hash.StorageKey;
```

Type alias for storage key values (32 bytes).

### StorageValue

```zig
pub const StorageValue = hash.StorageValue;
```

Type alias for storage value hashes (32 bytes).

### Selector

```zig
pub const Selector = hash.Selector;
```

A 4-byte function selector, typically the first 4 bytes of a function signature hash.

## Constants

### ZERO_HASH

```zig
pub const ZERO_HASH = hash.ZERO_HASH;
```

A hash consisting of all zero bytes: `0x0000...0000`.

### EMPTY_KECCAK256

```zig
pub const EMPTY_KECCAK256 = hash.EMPTY_KECCAK256;
```

The Keccak256 hash of an empty byte array.

## Core Functions

### Hash Creation

#### zero()

```zig
pub const zero = hash.zero;
```

Creates a zero-initialized hash (all bytes set to 0x00).

**Example:**
```zig
const zero_hash = hash.zero();
```

#### fromBytes()

```zig
pub const fromBytes = hash.fromBytes;
```

Creates a hash from a 32-byte array.

**Example:**
```zig
const bytes: [32]u8 = ...;
const h = hash.fromBytes(bytes);
```

#### fromSlice()

```zig
pub const fromSlice = hash.fromSlice;
```

Creates a hash from a byte slice. Slice must be exactly 32 bytes.

**Example:**
```zig
const slice: []const u8 = ...;
const h = try hash.fromSlice(slice);
```

#### fromHex()

```zig
pub const fromHex = hash.fromHex;
```

Creates a hash from a hexadecimal string (with or without "0x" prefix).

**Example:**
```zig
const h = try hash.fromHex("0x1234...abcd");
```

#### fromHexComptime()

```zig
pub const fromHexComptime = hash.fromHexComptime;
```

Creates a hash from a hexadecimal string at compile time.

**Example:**
```zig
const h = comptime hash.fromHexComptime("0x1234...abcd");
```

### Hash Conversion

#### toHex()

```zig
pub const toHex = hash.toHex;
```

Converts a hash to a lowercase hexadecimal string with "0x" prefix.

**Example:**
```zig
const hex_str = hash.toHex(h);
```

#### toHexUpper()

```zig
pub const toHexUpper = hash.toHexUpper;
```

Converts a hash to an uppercase hexadecimal string with "0x" prefix.

**Example:**
```zig
const hex_str = hash.toHexUpper(h);
```

#### toU256()

```zig
pub const toU256 = hash.toU256;
```

Converts a hash to a u256 integer (big-endian).

**Example:**
```zig
const value: u256 = hash.toU256(h);
```

#### fromU256()

```zig
pub const fromU256 = hash.fromU256;
```

Creates a hash from a u256 integer (big-endian).

**Example:**
```zig
const value: u256 = 12345;
const h = hash.fromU256(value);
```

### Hash Comparison

#### isZero()

```zig
pub const isZero = hash.isZero;
```

Checks if a hash is all zeros.

**Example:**
```zig
if (hash.isZero(h)) {
    // Handle zero hash
}
```

#### equal()

```zig
pub const equal = hash.equal;
```

Checks if two hashes are equal.

**Example:**
```zig
if (hash.equal(h1, h2)) {
    // Hashes are equal
}
```

#### compare()

```zig
pub const compare = hash.compare;
```

Compares two hashes lexicographically. Returns -1, 0, or 1.

**Example:**
```zig
const result = hash.compare(h1, h2);
// result < 0: h1 < h2
// result = 0: h1 == h2
// result > 0: h1 > h2
```

#### lessThan()

```zig
pub const lessThan = hash.lessThan;
```

Checks if first hash is less than second hash.

**Example:**
```zig
if (hash.lessThan(h1, h2)) {
    // h1 < h2
}
```

#### greaterThan()

```zig
pub const greaterThan = hash.greaterThan;
```

Checks if first hash is greater than second hash.

**Example:**
```zig
if (hash.greaterThan(h1, h2)) {
    // h1 > h2
}
```

### Bitwise Operations

#### xor()

```zig
pub const xor = hash.xor;
```

Performs bitwise XOR on two hashes.

**Example:**
```zig
const result = hash.xor(h1, h2);
```

#### bitAnd()

```zig
pub const bitAnd = hash.bitAnd;
```

Performs bitwise AND on two hashes.

**Example:**
```zig
const result = hash.bitAnd(h1, h2);
```

#### bitOr()

```zig
pub const bitOr = hash.bitOr;
```

Performs bitwise OR on two hashes.

**Example:**
```zig
const result = hash.bitOr(h1, h2);
```

#### bitNot()

```zig
pub const bitNot = hash.bitNot;
```

Performs bitwise NOT on a hash.

**Example:**
```zig
const result = hash.bitNot(h);
```

### Cryptographic Operations

#### keccak256()

```zig
pub const keccak256 = hash.keccak256;
```

Computes the Keccak256 hash of input data.

**Parameters:**
- `data` - Byte slice to hash

**Returns:** 32-byte hash

**Example:**
```zig
const data = "Hello, Ethereum!";
const h = hash.keccak256(data);
```

#### keccak256Empty()

```zig
pub const keccak256Empty = hash.keccak256Empty;
```

Returns the Keccak256 hash of an empty byte array (precomputed constant).

**Example:**
```zig
const empty_hash = hash.keccak256Empty();
```

#### eip191HashMessage()

```zig
pub const eip191HashMessage = hash.eip191HashMessage;
```

Creates an EIP-191 prefixed hash for a message.

**Format:** `keccak256("\x19Ethereum Signed Message:\n" || len(message) || message)`

**Example:**
```zig
const message = "Hello, Ethereum!";
const h = hash.eip191HashMessage(message);
```

#### selectorFromSignature()

```zig
pub const selectorFromSignature = hash.selectorFromSignature;
```

Creates a 4-byte function selector from a function signature string.

**Algorithm:** First 4 bytes of `keccak256(signature)`

**Example:**
```zig
const selector = hash.selectorFromSignature("transfer(address,uint256)");
// Returns: [4]u8{ 0xa9, 0x05, 0x9c, 0xbb }
```

## Testing

The module includes integration tests to verify correct module setup and function exports.

### Test Example

```zig
test "hash module integration" {
    // Test basic hash creation
    const test_hash = keccak256("test");
    try std.testing.expect(!isZero(test_hash));

    // Test selector creation
    const sel = selectorFromSignature("transfer(address,uint256)");
    const expected = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqual(expected, sel);
}
```

## Usage Examples

### Creating and Comparing Hashes

```zig
const hash = @import("hash");

// Create hashes
const h1 = hash.keccak256("data1");
const h2 = hash.keccak256("data2");
const zero = hash.zero();

// Compare hashes
if (hash.equal(h1, h2)) {
    // Hashes are equal
}

if (hash.isZero(zero)) {
    // Hash is zero
}

// Convert to hex
const hex_str = hash.toHex(h1);
```

### Function Selectors

```zig
const hash = @import("hash");

// Create selectors for common functions
const transfer_selector = hash.selectorFromSignature("transfer(address,uint256)");
const approve_selector = hash.selectorFromSignature("approve(address,uint256)");
const balanceOf_selector = hash.selectorFromSignature("balanceOf(address)");
```

### EIP-191 Message Signing

```zig
const hash = @import("hash");

// Hash a message with EIP-191 prefix
const message = "I agree to the terms";
const message_hash = hash.eip191HashMessage(message);

// Sign the hash (using crypto module)
const signature = try crypto.unaudited_signHash(message_hash, private_key);
```

## Architecture

The hash module follows a clean architecture pattern:

```
hash.zig (Public API)
    └─> hash_utils.zig (Implementation)
         └─> Keccak256 (std.crypto.hash.sha3)
```

This design provides:
- **Clean separation** between API and implementation
- **Easy testing** with clear module boundaries
- **Flexibility** to swap implementations if needed
- **Type safety** with strongly-typed hash variants

## Best Practices

1. **Use typed hash variants** (`BlockHash`, `TxHash`, etc.) for type safety
2. **Use compile-time conversion** with `fromHexComptime()` when possible
3. **Check for zero hashes** before processing important data
4. **Use constant-time comparison** for security-critical contexts (not provided by default equal())
5. **Validate hex strings** before conversion
6. **Use EIP-191 prefix** for message signing to prevent replay attacks

## Related Modules

- `hash_utils.zig` - Implementation of hash utilities
- `hash_algorithms.zig` - Additional hash algorithm implementations
- `crypto.zig` - Cryptographic operations using hashes
- `primitives` - Core Ethereum types using hashes

## References

- [Keccak/SHA-3 Specification](https://keccak.team/keccak.html)
- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)
- [Ethereum Contract ABI Specification](https://docs.soliditylang.org/en/latest/abi-spec.html)
- [Alloy Hash Types](https://github.com/alloy-rs/alloy)

## Known Issues

- Standard `equal()` comparison is not constant-time
- No built-in constant-time comparison for security-critical contexts
- Consider adding timing-safe comparison utilities
