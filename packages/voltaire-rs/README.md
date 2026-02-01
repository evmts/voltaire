# voltaire-rs

Idiomatic Rust bindings for [Voltaire](https://github.com/roninjin10/voltaire) Ethereum primitives.

## Features

- **Type-safe primitives**: `Address`, `Hash`, `U256` with proper Rust semantics
- **Cryptography**: Keccak-256, SHA-256, RIPEMD-160, secp256k1 ECDSA
- **Zero-copy where possible**: Newtypes with `Deref` for direct byte access
- **`no_std` compatible**: Core functionality works without std (use `default-features = false`)

## Installation

```toml
[dependencies]
voltaire = "0.1"

# For native FFI (faster, requires Voltaire library):
# voltaire = { version = "0.1", features = ["native"] }
```

## Quick Start

```rust
use voltaire::prelude::*;

// Parse address
let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?;
println!("Checksum: {}", addr);

// Compute hash
let hash = keccak256(b"hello");
println!("Keccak256: {}", hash);

// Work with U256
let value = U256::from(1_000_000_000_000_000_000u64); // 1 ETH in wei
println!("Value: {}", value);
```

## Modules

### primitives

Core Ethereum types:

```rust
use voltaire::primitives::{Address, Hash, U256, Hex};

// Address (20 bytes)
let addr = Address::from_hex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")?;
assert!(!addr.is_zero());
assert_eq!(addr.to_checksum(), "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");

// Hash (32 bytes)
let hash = Hash::from_hex("0x...")?;
assert!(hash.ct_eq(&other_hash)); // constant-time comparison

// U256 (256-bit integer)
let a = U256::from(100u64);
let b = U256::from(200u64);
let sum = a.checked_add(b).unwrap();

// Hex utilities
let bytes = Hex::decode("0xdeadbeef")?;
let hex = Hex::encode(&bytes);
```

### crypto

Cryptographic operations:

```rust
use voltaire::crypto::{keccak256, sha256, ripemd160, hash_message};
use voltaire::crypto::{Secp256k1, Signature, RecoveryId};

// Hashing
let hash = keccak256(b"hello");
let sha = sha256(b"hello");
let ripe = ripemd160(b"hello");

// EIP-191 personal message
let msg_hash = hash_message(b"Hello, World!");

// ECDSA (requires "native" feature)
#[cfg(feature = "native")]
{
    let sig = Signature::new(r, s);
    let recovery_id = RecoveryId::new(0)?;
    let pubkey = Secp256k1::recover_pubkey(&msg_hash.0, &sig, recovery_id)?;
    let addr = Secp256k1::recover_address(&msg_hash.0, &sig, recovery_id)?;
}
```

### Streaming Hasher

```rust
use voltaire::crypto::Keccak256;

let mut hasher = Keccak256::new();
hasher.update(b"hello");
hasher.update(b" world");
let hash = hasher.finalize();
```

## Feature Flags

| Feature | Description |
|---------|-------------|
| `std` (default) | Standard library support |
| `native` | Link against native Voltaire FFI library for faster operations |

## no_std Usage

```toml
[dependencies]
voltaire = { version = "0.1", default-features = false }
```

## License

MIT OR Apache-2.0
