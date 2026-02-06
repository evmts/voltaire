# Cryptography

Cryptographic operations for Ethereum.

## Keccak-256

Ethereum's primary hash function (original Keccak, not SHA-3).

```rust
use voltaire::crypto::{keccak256, Keccak256};

// One-shot hashing
let hash = keccak256(b"hello");
assert_eq!(
    hash.to_hex(),
    "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
);

// Streaming
let mut hasher = Keccak256::new();
hasher.update(b"hello");
hasher.update(b" world");
let hash = hasher.finalize();

// Function selector
let hash = keccak256(b"transfer(address,uint256)");
let selector = &hash[..4]; // 0xa9059cbb
```

## SHA-256

Standard SHA-256 hash.

```rust
use voltaire::crypto::sha256;

let hash = sha256(b"hello");
```

## RIPEMD-160

Used for Bitcoin address derivation (HASH160 = RIPEMD160(SHA256(x))).

```rust
use voltaire::crypto::{sha256, ripemd160};

// Bitcoin-style HASH160
let hash160 = ripemd160(&sha256(pubkey));
```

## EIP-191 Personal Message

Hash message for `eth_sign` / personal_sign.

```rust
use voltaire::crypto::hash_message;

let hash = hash_message(b"Hello, World!");
// Prepends "\x19Ethereum Signed Message:\n" + len
```

## secp256k1 (ECDSA)

Elliptic curve operations for Ethereum signatures.

Requires the `native` feature for key recovery.

```rust
use voltaire::crypto::{Secp256k1, Signature, RecoveryId};

// Parse signature
let sig = Signature::new(r, s);
let (sig, v) = Signature::from_bytes_with_recovery(&bytes_65);

// Validate
assert!(sig.is_valid());

// Normalize to low-s (EIP-2)
sig.normalize();

// Recovery (requires native feature)
#[cfg(feature = "native")]
{
    // Recover public key
    let recovery_id = RecoveryId::from_v(27)?;
    let pubkey = Secp256k1::recover_pubkey(&msg_hash, &sig, recovery_id)?;

    // Recover address directly
    let addr = Secp256k1::recover_address(&msg_hash, &sig, recovery_id)?;

    // Derive from private key
    let pubkey = Secp256k1::pubkey_from_private(&private_key)?;
    let addr = Secp256k1::address_from_private(&private_key)?;
}
```

### Recovery ID

The recovery ID (v value) indicates which of two possible public keys to use.

```rust
use voltaire::crypto::RecoveryId;

// Create from 0/1
let id = RecoveryId::new(0)?;

// Create from Ethereum v (27/28)
let id = RecoveryId::from_v(27)?;

// Convert to Ethereum v
assert_eq!(id.to_v(), 27);
```

### Signature Normalization

Ethereum (EIP-2) requires signatures to have s in the lower half of the curve order.

```rust
use voltaire::crypto::Signature;

let mut sig = Signature::new(r, s);
let was_high = sig.normalize(); // true if s was in upper half
```
