# crypto.zig - Ethereum Cryptography Primitives

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code and official specifications.**

## Overview

The `crypto.zig` module provides comprehensive cryptographic operations for Ethereum, including digital signatures (ECDSA), key management, address derivation, and hash functions. This module serves as the foundation for transaction signing, account management, and cryptographic verification in Ethereum applications.

## Module Location

`/Users/williamcory/primitives/src/crypto/crypto.zig`

## Security Status

**UNAUDITED**: This module contains custom cryptographic implementations that have NOT been security audited. Many functions are prefixed with `unaudited_` to indicate this status. Use at your own risk in production systems.

### Known Security Risks

- Potential timing attacks in modular arithmetic operations
- Unvalidated against known ECC vulnerabilities
- Custom point arithmetic may have edge case bugs
- Memory safety not guaranteed under all conditions
- Non-constant-time operations may leak information through timing channels

## Core Type Definitions

### PrivateKey

```zig
pub const PrivateKey = [32]u8;
```

A 256-bit (32-byte) private key used for ECDSA signing on the secp256k1 curve.

### PublicKey

```zig
pub const PublicKey = struct {
    x: u256,
    y: u256,

    pub fn to_address(self: PublicKey) Address
    pub fn to_affine_point(self: PublicKey) secp256k1.AffinePoint
    pub fn from_affine_point(point: secp256k1.AffinePoint) PublicKey
    pub fn isValid(self: PublicKey) bool
};
```

Represents an ECDSA public key on the secp256k1 curve with x and y coordinates.

**Methods:**
- `to_address()` - Convert public key to Ethereum address
- `to_affine_point()` - Convert to secp256k1 affine point representation
- `from_affine_point()` - Create from secp256k1 affine point
- `isValid()` - Verify the public key is on the curve and not at infinity

### Signature

```zig
pub const Signature = struct {
    r: u256,
    s: u256,
    v: u8, // recovery id + 27 (Ethereum convention)

    pub fn recovery_id(self: Signature) u8
    pub fn y_parity(self: Signature) u8
    pub fn to_bytes(self: Signature) [65]u8
    pub fn from_bytes(bytes: [65]u8) Signature
    pub fn to_hex(self: Signature) [132]u8
    pub fn from_hex(hex_str: []const u8) !Signature
    pub fn isValid(self: Signature) bool
};
```

ECDSA signature with recovery ID following Ethereum conventions.

**Fields:**
- `r` - First component of the signature
- `s` - Second component of the signature (must be in lower half to prevent malleability)
- `v` - Recovery ID + 27 (or + 35/36 for EIP-155)

**Methods:**
- `recovery_id()` - Extract recovery ID (0 or 1)
- `y_parity()` - Alias for recovery_id()
- `to_bytes()` - Serialize to 65 bytes (r || s || v)
- `from_bytes()` - Deserialize from 65 bytes
- `to_hex()` - Convert to hex string with 0x prefix
- `from_hex()` - Parse from hex string
- `isValid()` - Validate signature parameters (r, s in valid range, s in lower half)

## Error Types

```zig
pub const CryptoError = error{
    InvalidPrivateKey,
    InvalidPublicKey,
    InvalidSignature,
    InvalidRecoveryId,
    InvalidHashLength,
    InvalidLength,
    SigningFailed,
    RecoveryFailed,
    OutOfMemory,
    NotImplemented,
};
```

## secp256k1 Constants

```zig
pub const SECP256K1_P: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F;
pub const SECP256K1_N: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
pub const SECP256K1_B: u256 = 7;
pub const SECP256K1_GX: u256 = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798;
pub const SECP256K1_GY: u256 = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8;
```

- `SECP256K1_P` - Field modulus
- `SECP256K1_N` - Curve order (number of points)
- `SECP256K1_B` - Curve parameter b (y² = x³ + 7)
- `SECP256K1_GX`, `SECP256K1_GY` - Generator point coordinates

## Key Functions

### Private Key Generation

```zig
pub fn unaudited_randomPrivateKey() !PrivateKey
```

**WARNING: UNAUDITED** - Generates a cryptographically secure random private key.

**Returns:** A valid secp256k1 private key (non-zero and less than curve order)

**Security Considerations:**
- Uses `std.crypto.random` for randomness
- Recursively generates until a valid key is found
- May reveal information through timing if many rejections occur

**Example:**
```zig
const private_key = try unaudited_randomPrivateKey();
```

### Public Key Derivation

```zig
pub fn unaudited_getPublicKey(private_key: PrivateKey) !PublicKey
```

**WARNING: UNAUDITED** - Derives the public key from a private key using scalar multiplication.

**Parameters:**
- `private_key` - The private key to derive from

**Returns:** The corresponding public key point

**Errors:**
- `InvalidPrivateKey` - If private key is zero or >= curve order

**Security Considerations:**
- Uses secure memory zeroing for intermediate values
- Not constant-time (may leak private key through timing)

**Example:**
```zig
const public_key = try unaudited_getPublicKey(private_key);
const address = public_key.to_address();
```

### Address Derivation

```zig
pub fn public_key_to_address(public_key: PublicKey) Address
```

Converts a public key to an Ethereum address using Keccak256.

**Algorithm:**
1. Serialize public key as 64 bytes (x || y)
2. Compute Keccak256 hash
3. Take last 20 bytes of hash

**Example:**
```zig
const address = public_key_to_address(public_key);
```

### Message Hashing (EIP-191)

```zig
pub fn hash_message(message: []const u8) Hash.Hash
```

Creates an EIP-191 prefixed hash for a message.

**Format:** `"\x19Ethereum Signed Message:\n" || len(message) || message`

**Parameters:**
- `message` - The message to hash

**Returns:** 32-byte Keccak256 hash

**Example:**
```zig
const message_hash = hash_message("Hello, Ethereum!");
```

### Signature Creation

```zig
pub fn unaudited_signHash(hash: Hash.Hash, private_key: PrivateKey) !Signature
```

**WARNING: UNAUDITED** - Signs a 32-byte hash with a private key using ECDSA.

**Parameters:**
- `hash` - The 32-byte message hash to sign
- `private_key` - The signing key

**Returns:** ECDSA signature with recovery ID

**Errors:**
- `InvalidPrivateKey` - Invalid private key
- `SigningFailed` - Could not generate valid signature after 1000 attempts

**Security Considerations:**
- Uses random k values (NOT RFC 6979 deterministic signatures)
- Ensures s is in lower half to prevent signature malleability
- Verifies signature by recovery before returning
- Not constant-time

**Example:**
```zig
const signature = try unaudited_signHash(message_hash, private_key);
```

```zig
pub fn unaudited_signMessage(message: []const u8, private_key: PrivateKey) !Signature
```

**WARNING: UNAUDITED** - Signs a message with EIP-191 prefix.

**Parameters:**
- `message` - The message to sign
- `private_key` - The signing key

**Returns:** ECDSA signature

**Example:**
```zig
const signature = try unaudited_signMessage("Hello, Ethereum!", private_key);
```

### Signature Verification

```zig
pub fn unaudited_recoverAddress(hash: Hash.Hash, signature: Signature) !Address
```

**WARNING: UNAUDITED** - Recovers the Ethereum address from a signature and hash.

**Parameters:**
- `hash` - The 32-byte message hash
- `signature` - The ECDSA signature with recovery ID

**Returns:** The Ethereum address of the signer

**Errors:**
- `InvalidSignature` - Invalid signature parameters
- `InvalidRecoveryId` - Recovery ID not 0 or 1
- `RecoveryFailed` - Could not recover public key

**Algorithm:**
1. Validate signature parameters
2. Reconstruct R point from r and recovery_id
3. Calculate Q = r⁻¹(sR - eG)
4. Verify signature with recovered key
5. Derive address from Q

**Example:**
```zig
const recovered_address = try unaudited_recoverAddress(message_hash, signature);
```

```zig
pub fn unaudited_recoverMessageAddress(message: []const u8, signature: Signature) !Address
```

**WARNING: UNAUDITED** - Recovers address from an EIP-191 signed message.

**Example:**
```zig
const recovered_address = try unaudited_recoverMessageAddress("Hello", signature);
```

```zig
pub fn unaudited_verifySignature(hash: Hash.Hash, signature: Signature, address: Address) !bool
```

**WARNING: UNAUDITED** - Verifies a signature against a hash and expected address.

**Returns:** `true` if signature is valid and matches address

**Example:**
```zig
const is_valid = try unaudited_verifySignature(hash, signature, expected_address);
```

```zig
pub fn unaudited_verifyMessage(message: []const u8, signature: Signature, address: Address) !bool
```

**WARNING: UNAUDITED** - Verifies an EIP-191 signed message.

**Example:**
```zig
const is_valid = try unaudited_verifyMessage("Hello", signature, expected_address);
```

### Signature Validation

```zig
pub fn is_valid_signature(signature: Signature) bool
```

Validates signature parameters according to secp256k1 and EIP-2 requirements.

**Validation Rules:**
- r must be in range [1, n-1]
- s must be in range [1, n-1]
- s must be ≤ n/2 (EIP-2 malleability protection)

**Example:**
```zig
if (!is_valid_signature(signature)) {
    return error.InvalidSignature;
}
```

## Security Utilities

### Secure Memory Zeroing

```zig
pub fn secureZeroMemory(ptr: anytype) void
```

Securely zeros sensitive memory to prevent leakage.

**Features:**
- Uses `@memset` with compiler fence
- Prevents compiler optimization
- Sequential consistency memory ordering

**Example:**
```zig
var private_key_u256: u256 = std.mem.readInt(u256, &private_key, .big);
defer secureZeroMemory(&private_key_u256);
```

## BLS12-381 Operations

The module also provides FFI bindings to BLS12-381 elliptic curve operations for advanced cryptography (used in Ethereum 2.0):

```zig
pub const bls12_381 = struct {
    pub fn g1_add(input: []const u8, output: []u8) Error!void
    pub fn g1_mul(input: []const u8, output: []u8) Error!void
    pub fn g1_multiexp(input: []const u8, output: []u8) Error!void
    pub fn pairing(input: []const u8, output: []u8) Error!void
    pub fn g1_output_size() u32
    pub fn pairing_output_size() u32
};
```

These functions interface with external C libraries (blst) for BLS12-381 operations.

## Testing

The module includes comprehensive test coverage:

- Private key generation tests
- Public key derivation tests
- Address derivation tests
- Message hashing tests (EIP-191)
- Signature creation and verification tests
- Signature serialization tests
- Invalid signature rejection tests
- Edge case tests for signature validation

## Implementation Notes

### Signature Generation

The current implementation uses **random k values** for ECDSA signature generation, not RFC 6979 deterministic signatures. This means:

- Same message + key can produce different valid signatures
- Requires good randomness source
- TODO: Implement RFC 6979 for deterministic signatures

### Malleability Protection

All signatures enforce EIP-2 malleability protection:
- s must be ≤ n/2
- Signatures with high s values are rejected
- Prevents signature malleability attacks

### Memory Safety

The module uses `secureZeroMemory()` to clear sensitive data:
- Private key values
- Intermediate computation results
- Random nonce values (k)

However, complete memory safety is not guaranteed under all conditions.

## Usage Example

Complete example of signing and verifying a message:

```zig
const std = @import("std");
const crypto = @import("crypto");

// Generate a new key pair
const private_key = try crypto.unaudited_randomPrivateKey();
const public_key = try crypto.unaudited_getPublicKey(private_key);
const address = public_key.to_address();

// Sign a message
const message = "Hello, Ethereum!";
const signature = try crypto.unaudited_signMessage(message, private_key);

// Verify signature
const is_valid = try crypto.unaudited_verifyMessage(message, signature, address);
std.debug.assert(is_valid);

// Recover address from signature
const recovered_address = try crypto.unaudited_recoverMessageAddress(message, signature);
std.debug.assert(std.mem.eql(u8, &address.bytes, &recovered_address.bytes));
```

## Best Practices

1. **Never reuse private keys** across different applications or chains
2. **Verify signatures** before processing signed data
3. **Use EIP-191 prefixes** for message signing to prevent replay attacks
4. **Check signature validity** with `isValid()` before verification
5. **Clear sensitive data** from memory after use
6. **Use constant-time comparisons** for cryptographic values
7. **Validate recovery IDs** are 0 or 1 before use
8. **Audit custom crypto code** before production use

## Related Modules

- `secp256k1.zig` - Lower-level secp256k1 curve operations
- `hash.zig` - Hash function wrappers (Keccak256, SHA256, etc.)
- `eip712.zig` - Typed structured data signing (EIP-712)
- `primitives.Address` - Ethereum address type

## References

- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)
- [EIP-2: Signature Validation](https://eips.ethereum.org/EIPS/eip-2)
- [EIP-155: Simple Replay Attack Protection](https://eips.ethereum.org/EIPS/eip-155)
- [secp256k1 Curve Parameters](https://en.bitcoin.it/wiki/Secp256k1)
- [RFC 6979: Deterministic ECDSA](https://tools.ietf.org/html/rfc6979) (not yet implemented)

## Changelog

### Known Issues

- TODO: Implement RFC 6979 deterministic ECDSA signatures
- TODO: Add constant-time operations to prevent timing attacks
- TODO: Complete security audit of all cryptographic functions
- TODO: Add batch signature verification for performance
