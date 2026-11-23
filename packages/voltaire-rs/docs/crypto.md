# Cryptography

Cryptographic hash functions, MACs, message digests, and elliptic curve primitives in `voltaire::crypto`.

## Feature Availability Matrix

| Primitive | Export | Pure Rust (default) | `native` FFI |
|-----------|--------|---------------------|--------------|
| Keccak-256 | `keccak256`, `Keccak256` | Yes | Accelerated |
| SHA-256 | `sha256` | Yes | Accelerated |
| RIPEMD-160 | `ripemd160` | Yes | Accelerated |
| BLAKE2b / BLAKE2s | `blake2b`, `blake2s`, `Blake2b`, `Blake2s` | Yes | Yes |
| HMAC-SHA256 / SHA512 | `hmac_sha256`, `hmac_sha512`, `HmacSha256`, `HmacSha512` | Yes | Yes |
| EIP-191 | `hash_message` | Yes | Yes |
| EIP-712 | `eip712::*` | Yes | Yes |
| secp256k1 Signature types & EIP-2 normalization | `Signature`, `CompactSignature`, `RsvSignature`, `RecoveryId` | Yes | Yes |
| secp256k1 `recover_pubkey`, `recover_address`, `pubkey_from_private` | `Secp256k1` | Returns `Err` | Yes |
| NIST P-256 (ECDSA + ECDH) | `P256` | Yes (`p256` crate) | Yes |
| BLS12-381 | `Bls12381`, `bls12_381::*` | Yes | Yes |

## Keccak-256

Ethereum's pre-NIST Keccak-256 sponge (`0x01` domain padding, distinct from NIST SHA3-256).

```rust
use voltaire::crypto::{keccak256, Keccak256};

let hash = keccak256(b"hello");
assert_eq!(
    hash.to_hex(),
    "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
);

// Streaming API
let mut hasher = Keccak256::new();
hasher.update(b"hello");
hasher.update(b" world");
let streamed = hasher.finalize();
assert_eq!(streamed, keccak256(b"hello world"));
```

## SHA-256 and RIPEMD-160

```rust
use voltaire::crypto::{sha256, ripemd160};

let sha: [u8; 32] = sha256(b"hello");
let hash160: [u8; 20] = ripemd160(&sha); // Bitcoin HASH160
```

## EIP-191 Personal Message Hashing

Computes `keccak256("\x19Ethereum Signed Message:\n" || decimal(message.len()) || message)`:

```rust
use voltaire::crypto::hash_message;

let digest = hash_message(b"Hello, World!");
```

## secp256k1 (ECDSA)

`Secp256k1` provides public-key derivation and signature recovery backed by Voltaire's Zig FFI when the `native` feature is enabled. Without `native`, `recover_pubkey`, `recover_address`, and `pubkey_from_private` return `Err(Error::InvalidInput(_))`.

```rust
use voltaire::crypto::{Secp256k1, Signature, RecoveryId};

let mut sig = Signature::new(r, s);
sig.normalize(); // pure Rust EIP-2 low-s normalization

#[cfg(feature = "native")]
{
    let recid = RecoveryId::from_v(27)?;
    let pubkey: [u8; 64] = Secp256k1::recover_pubkey(&msg_hash, &sig, recid)?;
    let signer = Secp256k1::recover_address(&msg_hash, &sig, recid)?;

    let derived_pub = Secp256k1::pubkey_from_private(&private_key)?;
    let derived_addr = Secp256k1::address_from_private(&private_key)?;
    let _ = (pubkey, signer, derived_pub, derived_addr);
}
# Ok::<(), voltaire::Error>(())
```

See [Signatures](signatures.md) for `Signature`, `CompactSignature`, `RsvSignature`, and `RecoveryId`.

## NIST P-256 (`secp256r1`)

WebAuthn/passkey and RIP-7212 curve operations (`P256SecretKey = [u8; 32]`, `P256PublicKey = [u8; 64]`, `P256CompressedPublicKey = [u8; 33]`, `P256Signature = [u8; 64]`).

```rust
use voltaire::crypto::{P256, sha256};

let (sk, pk) = P256::generate_keypair();
let msg_hash = sha256(b"passkey challenge");

let sig = P256::sign(&msg_hash, &sk)?;
assert!(P256::verify(&msg_hash, &sig, &pk)?);

let compressed = P256::compress_public_key(&pk);
assert_eq!(P256::decompress_public_key(&compressed)?, pk);

// ECDH shared secret
let (bob_sk, bob_pk) = P256::generate_keypair();
assert_eq!(P256::ecdh(&sk, &bob_pk)?, P256::ecdh(&bob_sk, &pk)?);
# Ok::<(), voltaire::Error>(())
```

## BLS12-381 (`voltaire::crypto::bls12_381`)

Consensus-layer signatures, key/signature aggregation, G1/G2 curve arithmetic, and pairing checks:

- Types: `BlsSecretKey` (`[u8; 32]`), `BlsPublicKey` (`[u8; 48]`), `BlsSignature` (`[u8; 96]`), `G1Point` (`[u8; 96]`), `G2Point` (`[u8; 192]`)
- Methods on `Bls12381`: `generate_keypair`, `derive_public_key`, `sign`, `verify`, `aggregate_signatures`, `aggregate_public_keys`, `verify_aggregate`, `fast_aggregate_verify`, `g1_add`, `g1_mul`, `g2_add`, `g2_mul`, `pairing_check`

## Related Guides

- [Signatures](signatures.md)
- [EIP-712 Typed Data](eip712.md)
- [BLAKE2](blake2.md)
- [HMAC](hmac.md)
