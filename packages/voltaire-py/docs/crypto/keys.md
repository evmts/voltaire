# Key Generation and Compression

Cryptographic key generation and public key compression for secp256k1.

## Overview

The `Secp256k1` module provides key operations:
- **generate_private_key**: Generate cryptographically secure random private key
- **compress_public_key**: Compress 64-byte public key to 33 bytes
- **public_key_from_private**: Derive public key from private key (already documented in secp256k1.md)

## Usage

### Generate Private Key

```python
from voltaire import Secp256k1

# Generate cryptographically secure 32-byte private key
private_key = Secp256k1.generate_private_key()
print(f"Private key: {private_key.hex()}")
print(f"Length: {len(private_key)} bytes")  # 32

# Key is guaranteed to be valid (non-zero, < curve order)
```

### Compress Public Key

```python
from voltaire import Secp256k1

# 64-byte uncompressed public key (x || y coordinates)
uncompressed = bytes.fromhex(
    "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"  # x
    "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"  # y
)

# Compress to 33 bytes (prefix + x coordinate)
compressed = Secp256k1.compress_public_key(uncompressed)
print(f"Compressed: {compressed.hex()}")  # 02 + x coordinate
print(f"Length: {len(compressed)} bytes")  # 33

# Prefix is 0x02 for even y, 0x03 for odd y
print(f"Prefix: {compressed[0]:02x}")  # 02 (y is even)
```

### Full Workflow: Generate Keys and Derive Address

```python
from voltaire import Secp256k1, Address

# Generate new keypair
private_key = Secp256k1.generate_private_key()

# Derive uncompressed public key (64 bytes)
public_key = Secp256k1.public_key_from_private(private_key)

# Compress for storage/transmission (33 bytes)
compressed_pubkey = Secp256k1.compress_public_key(public_key)

# Derive Ethereum address from public key
address = Address.from_public_key(public_key)

print(f"Private key: {private_key.hex()}")
print(f"Public key (uncompressed): {public_key.hex()}")
print(f"Public key (compressed): {compressed_pubkey.hex()}")
print(f"Address: {address.to_checksum()}")
```

## API Reference

### `Secp256k1.generate_private_key() -> bytes`

Generate a cryptographically secure random private key.

**Returns:** 32-byte private key suitable for secp256k1

**Security:**
- Uses OS-provided CSPRNG (cryptographically secure random number generator)
- Key is guaranteed to be in valid range (1 to N-1, where N is curve order)
- Never returns zero or values >= curve order

```python
private_key = Secp256k1.generate_private_key()
assert len(private_key) == 32
```

### `Secp256k1.compress_public_key(uncompressed) -> bytes`

Compress a 64-byte uncompressed public key to 33 bytes.

**Parameters:**
- `uncompressed`: 64-byte public key (x || y coordinates)

**Returns:** 33-byte compressed key (prefix byte + x coordinate)

**Raises:**
- `InvalidLengthError`: If input is not 64 bytes

**Format:**
- Prefix `0x02` if y coordinate is even
- Prefix `0x03` if y coordinate is odd
- Followed by 32-byte x coordinate

```python
compressed = Secp256k1.compress_public_key(uncompressed)
assert len(compressed) == 33
assert compressed[0] in (0x02, 0x03)
```

### `Secp256k1.public_key_from_private(private_key) -> bytes`

Derive uncompressed public key from private key.

See [secp256k1.md](./secp256k1.md) for details.

## Notes

- Private keys must be in range [1, N-1] where N is the secp256k1 curve order
- N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
- Compressed format saves 31 bytes over uncompressed (33 vs 64)
- The y coordinate can be recovered from x and parity prefix during decompression

## Security Considerations

- **Private key storage**: Never expose private keys in logs or user-facing output
- **Randomness**: `generate_private_key()` uses OS CSPRNG, suitable for production
- **Key validation**: All generated keys are validated to be in the valid range
