# Signatures

ECDSA signature types and utilities for Ethereum.

## Overview

Voltaire provides three signature representations:

- `Signature` - Core type with r, s components
- `CompactSignature` - 64-byte packed format (r || s)
- `RsvSignature` - 65-byte Ethereum format (r || s || v)

## Signature Types

### Signature

Core signature with r and s components as 32-byte arrays.

```rust
use voltaire::crypto::Signature;

// Create from components
let sig = Signature::new(r, s);

// Parse from 64 bytes
let sig = Signature::from_bytes(&bytes_64);

// Parse from 65 bytes (extracts v separately)
let (sig, v) = Signature::from_bytes_with_recovery(&bytes_65);

// Serialize
let bytes_64 = sig.to_bytes();
let bytes_65 = sig.to_bytes_with_recovery(v);
```

### CompactSignature

64-byte packed format, used when recovery ID is stored separately.

```rust
use voltaire::crypto::CompactSignature;

// Create from bytes
let compact = CompactSignature::new(bytes_64);

// Create from r, s components
let compact = CompactSignature::from_rs(r, s);

// Access components
let r: &[u8; 32] = compact.r();
let s: &[u8; 32] = compact.s();

// Convert to Signature
let sig: Signature = compact.into();
```

### RsvSignature

65-byte Ethereum signature format with embedded recovery ID.

```rust
use voltaire::crypto::{RsvSignature, RecoveryId};

// Create from components
let rsv = RsvSignature::from_rsv(r, s, 27)?;

// Parse from 65 bytes
let rsv = RsvSignature::from_bytes(&bytes)?;

// Access components
let r: &[u8; 32] = rsv.r();
let s: &[u8; 32] = rsv.s();
let v: u8 = rsv.v();  // 27 or 28

// Serialize
let bytes: [u8; 65] = rsv.into();
```

## Recovery ID

The recovery ID indicates which of two possible public keys corresponds to the signature.

```rust
use voltaire::crypto::RecoveryId;

// Create from raw value (0 or 1)
let id = RecoveryId::new(0)?;

// Create from Ethereum v value (27 or 28, or 0 or 1)
let id = RecoveryId::from_v(27)?;

// Convert to Ethereum v
assert_eq!(id.to_v(), 27);
```

## Normalization (EIP-2)

Ethereum requires signatures to have s in the lower half of the curve order to prevent signature malleability.

```rust
use voltaire::crypto::Signature;

let mut sig = Signature::new(r, s);

// Check if already normalized
if !sig.is_normalized() {
    // Normalize in-place, returns true if changed
    sig.normalize();
}

// For RsvSignature, normalization also flips v
let mut rsv = RsvSignature::from_rsv(r, s, 27)?;
rsv.normalize();
// If s was high, v is now 28
```

## Canonical Signatures

A canonical signature has:
- r in range [1, N-1]
- s in range [1, N-1]
- s <= N/2 (normalized)

```rust
let sig = Signature::new(r, s);

// Check all conditions
if sig.is_canonical() {
    // Safe to use
}

// For RsvSignature
if rsv.is_canonical() {
    // Signature is valid and normalized
}
```

## Key Recovery

Recover public key or address from signature (requires `native` feature).

```rust
use voltaire::crypto::{Secp256k1, Signature, RecoveryId};

let sig = Signature::new(r, s);
let v = RecoveryId::from_v(27)?;

// Recover public key (64 bytes, uncompressed without 0x04 prefix)
#[cfg(feature = "native")]
let pubkey = Secp256k1::recover_pubkey(&msg_hash, &sig, v)?;

// Recover Ethereum address directly
#[cfg(feature = "native")]
let addr = Secp256k1::recover_address(&msg_hash, &sig, v)?;
```

## Conversions

All signature types implement conversion traits:

```rust
use voltaire::crypto::{Signature, CompactSignature, RsvSignature, RecoveryId};

let sig = Signature::new(r, s);

// Signature -> CompactSignature
let compact: CompactSignature = sig.into();

// CompactSignature -> Signature
let sig: Signature = compact.into();

// Signature + RecoveryId -> RsvSignature
let rsv = RsvSignature::new(sig, RecoveryId::new(0)?);

// RsvSignature -> [u8; 65]
let bytes: [u8; 65] = rsv.into();

// [u8; 65] -> RsvSignature (fallible)
let rsv: RsvSignature = bytes.try_into()?;
```

## Security Notes

1. **Always normalize signatures** before broadcasting transactions
2. **Validate canonical form** when accepting signatures from untrusted sources
3. **Use constant-time comparisons** (already implemented in the library)
4. **Clear sensitive data** after use when possible
