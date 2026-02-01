# Secp256k1 Hash-Level API

This document describes the hash-level API for secp256k1 operations in Voltaire.

## Overview

Voltaire now provides two levels of API for secp256k1 operations:

1. **Message-Level API** (existing): `sign()`, `verify()`, `recoverPublicKey()`
   - Operates on pre-hashed messages
   - Convenience API for standard use cases

2. **Hash-Level API** (new): `signHash()`, `verifyHash()`, `recoverPublicKeyFromHash()`
   - Operates directly on 32-byte hashes
   - Required for interoperability with libraries like OX/viem
   - Useful for custom hashing schemes or cross-chain compatibility

## Why Hash-Level API?

The hash-level API was added to match the behavior of other Ethereum libraries like OX and viem, which operate at the hash level. This enables:

- **Interoperability**: Signatures created with Voltaire can be verified by OX/viem and vice versa
- **Custom hashing**: Use any 32-byte hash, not just Keccak256
- **Cross-chain**: Support chains with different hashing requirements
- **Pre-computed hashes**: Sign hashes computed elsewhere without knowing the original message

## API Reference

### signHash(hash, privateKey)

Sign a pre-hashed 32-byte message.

```typescript
import * as Secp256k1 from './crypto/Secp256k1/index.js';
import * as Hash from './primitives/Hash/index.js';
import * as PrivateKey from './primitives/PrivateKey/index.js';

const hash = Hash.keccak256String('Hello!');
const privateKey = PrivateKey.from('0x...');
const signature = Secp256k1.signHash(hash, privateKey);
// { r: Uint8Array(32), s: Uint8Array(32), v: 27 }
```

**Parameters:**
- `hash`: 32-byte hash (must be exactly 32 bytes)
- `privateKey`: 32-byte private key

**Returns:** Signature with `{ r, s, v }` components

**Throws:**
- `CryptoError` if hash is not exactly 32 bytes
- `InvalidPrivateKeyError` if private key is invalid

### verifyHash(signature, hash, publicKey)

Verify a signature against a pre-hashed message.

```typescript
const isValid = Secp256k1.verifyHash(signature, hash, publicKey);
// true or false
```

**Parameters:**
- `signature`: Signature with `{ r, s, v }` components
- `hash`: 32-byte hash (must be exactly 32 bytes)
- `publicKey`: 64-byte uncompressed public key

**Returns:** `boolean` - true if signature is valid

**Throws:**
- `CryptoError` if hash is not exactly 32 bytes

### recoverPublicKeyFromHash(signature, hash)

Recover the public key from a signature and pre-hashed message.

```typescript
const publicKey = Secp256k1.recoverPublicKeyFromHash(signature, hash);
// Uint8Array(64)
```

**Parameters:**
- `signature`: Signature with `{ r, s, v }` components
- `hash`: 32-byte hash (must be exactly 32 bytes)

**Returns:** 64-byte uncompressed public key

**Throws:**
- `CryptoError` if hash is not exactly 32 bytes
- `InvalidSignatureError` if signature is invalid or recovery fails

## Comparison: Hash-Level vs Message-Level

```typescript
// Hash-Level API (new)
const hash = Hash.keccak256String('Hello!');
const sig1 = Secp256k1.signHash(hash, privateKey);
const valid1 = Secp256k1.verifyHash(sig1, hash, publicKey);
const recovered1 = Secp256k1.recoverPublicKeyFromHash(sig1, hash);

// Message-Level API (existing)
const sig2 = Secp256k1.sign(hash, privateKey);
const valid2 = Secp256k1.verify(sig2, hash, publicKey);
const recovered2 = Secp256k1.recoverPublicKey(sig2, hash);

// Both produce identical results for the same hash
assert(sig1.r === sig2.r && sig1.s === sig2.s && sig1.v === sig2.v);
```

## Use Cases

### 1. Custom Hashing Schemes

```typescript
import * as SHA256 from './crypto/SHA256/index.js';

// Use SHA256 instead of Keccak256
const message = "Custom hashing";
const hash = SHA256.hash(message); // Any 32-byte hash works
const signature = Secp256k1.signHash(hash, privateKey);
```

### 2. Pre-computed Hashes

```typescript
// Hash already computed elsewhere
const preComputedHash = Hash.from('0x4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41');
const signature = Secp256k1.signHash(preComputedHash, privateKey);
```

### 3. Interoperability with OX

```typescript
// Voltaire signs
const hash = Hash.keccak256String('Message');
const signature = Secp256k1.signHash(hash, privateKey);

// OX verifies (same hash-level API)
// import { Secp256k1 as OxSecp256k1 } from 'ox';
// const isValid = OxSecp256k1.verify({ hash, signature, publicKey });
```

### 4. EIP-191 Personal Signatures

```typescript
const message = "Hello, Ethereum!";
const prefix = "\x19Ethereum Signed Message:\n";
const prefixedMessage = `${prefix}${message.length}${message}`;
const hash = Hash.keccak256String(prefixedMessage);
const signature = Secp256k1.signHash(hash, privateKey);
```

## Error Handling

All hash-level API functions validate that the hash is exactly 32 bytes:

```typescript
const invalidHash = new Uint8Array(16); // Wrong length

try {
  Secp256k1.signHash(invalidHash, privateKey);
} catch (error) {
  console.log(error.message);
  // "Hash must be exactly 32 bytes, got 16"
}
```

## Security Notes

1. **Hash Validation**: All functions strictly enforce 32-byte hash length
2. **Deterministic Signatures**: Uses RFC 6979 for deterministic ECDSA
3. **Malleability Protection**: Enforces low-s values to prevent signature malleability
4. **Caller Responsibility**: With hash-level API, the caller is responsible for proper hashing

## Implementation Details

- Built on `@noble/curves/secp256k1` for security
- Same cryptographic operations as message-level API
- Full compatibility with Ethereum's v = 27/28 recovery IDs
- Supports both v formats: 0/1 and 27/28
- Deterministic signatures (RFC 6979)
- Constant-time operations where possible

## Related Documentation

- [Secp256k1 Module Documentation](https://voltaire.tevm.sh/crypto/secp256k1)
- [Hash Module Documentation](https://voltaire.tevm.sh/primitives/hash)
- [OX Secp256k1 Documentation](https://oxlib.sh/core/Secp256k1)
- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)
- [RFC 6979: Deterministic ECDSA](https://tools.ietf.org/html/rfc6979)
