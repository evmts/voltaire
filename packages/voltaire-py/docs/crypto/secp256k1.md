# Secp256k1

secp256k1 elliptic curve cryptography for Ethereum signatures and key derivation.

## Overview

The `Secp256k1` module provides core cryptographic operations for Ethereum:
- **Public key recovery**: Recover the signer's public key from a signature
- **Address recovery**: Recover the signer's Ethereum address from a signature
- **Key derivation**: Derive public key from private key
- **Signature validation**: Check if signature components are valid

## Types

### Signature

```python
@dataclass(frozen=True)
class Signature:
    """ECDSA signature with recovery id."""
    r: bytes  # 32 bytes
    s: bytes  # 32 bytes
    v: int    # recovery id (0-1 or 27-28)
```

## Usage

### Recover Public Key

```python
from voltaire import Secp256k1, Signature

# Signature from signing a message
signature = Signature(
    r=bytes.fromhex("79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
    s=bytes.fromhex("483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"),
    v=27
)

# Message hash that was signed
message_hash = bytes.fromhex("0x...")  # 32 bytes

# Recover 64-byte uncompressed public key (x || y)
pubkey = Secp256k1.recover_public_key(message_hash, signature)
print(f"Public key: {pubkey.hex()}")
```

### Recover Address

```python
from voltaire import Secp256k1, Signature

signature = Signature(r=r_bytes, s=s_bytes, v=27)
message_hash = bytes(32)  # The hash that was signed

# Recover Ethereum address directly
address = Secp256k1.recover_address(message_hash, signature)
print(f"Signer: {address.to_checksum()}")
```

### Derive Public Key from Private Key

```python
from voltaire import Secp256k1

# 32-byte private key
private_key = bytes.fromhex("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")

# Derive 64-byte uncompressed public key
public_key = Secp256k1.public_key_from_private(private_key)
print(f"Public key: {public_key.hex()}")
```

### Validate Signature Components

```python
from voltaire import Secp256k1

r = bytes.fromhex("79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798")
s = bytes.fromhex("483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")

# Check if r and s are valid (non-zero, within curve order)
is_valid = Secp256k1.validate_signature(r, s)
print(f"Valid signature: {is_valid}")
```

## API Reference

### `Signature` Dataclass

```python
@dataclass(frozen=True)
class Signature:
    r: bytes   # 32-byte r component (big-endian)
    s: bytes   # 32-byte s component (big-endian)
    v: int     # Recovery id (0, 1, 27, or 28)
```

### `Secp256k1.recover_public_key(message_hash, signature) -> bytes`

Recover uncompressed public key from ECDSA signature.

**Parameters:**
- `message_hash`: 32-byte message hash that was signed
- `signature`: Signature with r, s, v components

**Returns:** 64-byte uncompressed public key (x || y)

**Raises:**
- `InvalidLengthError`: If message_hash, r, or s is not 32 bytes
- `InvalidSignatureError`: If signature is invalid or recovery fails

### `Secp256k1.recover_address(message_hash, signature) -> Address`

Recover Ethereum address from ECDSA signature.

**Parameters:**
- `message_hash`: 32-byte message hash that was signed
- `signature`: Signature with r, s, v components

**Returns:** `Address` of the signer

**Raises:**
- `InvalidLengthError`: If message_hash, r, or s is not 32 bytes
- `InvalidSignatureError`: If signature is invalid or recovery fails

### `Secp256k1.public_key_from_private(private_key) -> bytes`

Derive public key from private key.

**Parameters:**
- `private_key`: 32-byte private key

**Returns:** 64-byte uncompressed public key (x || y)

**Raises:**
- `InvalidLengthError`: If private_key is not 32 bytes
- `InvalidInputError`: If private key is invalid (zero or >= curve order)

### `Secp256k1.validate_signature(r, s) -> bool`

Validate signature components are within valid range.

Checks that:
- r is in range [1, N-1]
- s is in range [1, N/2] (EIP-2 low-s requirement)

**Parameters:**
- `r`: 32-byte r component
- `s`: 32-byte s component

**Returns:** `True` if both r and s are valid

**Raises:**
- `InvalidLengthError`: If r or s is not 32 bytes

**Note:** This function enforces EIP-2's low-s requirement to prevent signature malleability. Use `SignatureUtils.normalize()` to convert high-s signatures to canonical form before validation.

## Notes

- Recovery id `v` can be 0/1 (raw) or 27/28 (Ethereum convention)
- All components use big-endian byte encoding
- The secp256k1 curve order N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
- Public keys are uncompressed format (64 bytes: x || y)
- For signature normalization (low-s), use `SignatureUtils.normalize()`
