# Crypto

⚠️ **WARNING: UNAUDITED - USE AT YOUR OWN RISK** ⚠️

Cryptographic implementations for the Guillotine EVM. All implementations are considered unaudited for safety.

## Implementations

### Hash Functions
- `keccak256_accel.zig` - Keccak256 with hardware acceleration support
- `sha256_accel.zig` - SHA256 with hardware acceleration support
- `blake2.zig` - Blake2 hash function
- `ripemd160.zig` - RIPEMD160 hash function
- `hash.zig`, `hash_algorithms.zig`, `hash_utils.zig` - Hash function utilities

### Elliptic Curve
- `secp256k1.zig` - secp256k1 operations (wraps Zig std lib)
- BN254 operations (via Rust wrapper in `../bn254_wrapper`)

### Other
- `modexp.zig` - Modular exponentiation
- `eip712.zig` - EIP-712 structured data hashing
- `cpu_features.zig` - CPU feature detection for hardware acceleration

## Usage

These implementations are used by:
- EVM precompiles (ecrecover, sha256, ripemd160, blake2f, modexp)
- Transaction signing and verification
- State root calculations

## Security Notice

All cryptographic code should be considered experimental and unaudited. Do not use in production without proper security review.