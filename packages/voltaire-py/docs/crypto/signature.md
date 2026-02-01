# Signature

ECDSA signature utilities for secp256k1 curve operations.

## Overview

The `SignatureUtils` module provides utilities for working with ECDSA signatures:
- **Normalization**: Convert high-s signatures to canonical low-s form (EIP-2)
- **Validation**: Check if signatures are in canonical form
- **Parsing**: Extract r, s, v components from 64/65 byte formats
- **Serialization**: Convert components back to compact format

## Background

### Signature Malleability

ECDSA signatures have an inherent malleability: given a valid signature `(r, s)`, the signature `(r, N - s)` is also valid for the same message (where N is the curve order). This creates a security issue where attackers can modify transaction signatures without invalidating them.

### EIP-2: Low-S Normalization

[EIP-2](https://eips.ethereum.org/EIPS/eip-2) mandates that `s` must be in the lower half of the curve order:
- `s <= secp256k1_N / 2` (where N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141)

This eliminates malleability by requiring signatures to be in "canonical" or "low-s" form.

## Usage

### Basic Normalization

```python
from voltaire import SignatureUtils

# High-s signature that needs normalization
r = bytes.fromhex("79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798")
s = bytes.fromhex("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140")  # high-s

# Normalize to canonical form
r_norm, s_norm, was_normalized = SignatureUtils.normalize(r, s)
print(f"Was normalized: {was_normalized}")  # True
```

### Checking Canonical Form

```python
from voltaire import SignatureUtils

# Check if signature is already canonical
r = bytes.fromhex("79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798")
s = bytes.fromhex("483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")

is_canonical = SignatureUtils.is_canonical(r, s)
print(f"Is canonical: {is_canonical}")  # True
```

### Parsing Signatures

```python
from voltaire import SignatureUtils, SignatureComponents

# Parse 64-byte compact signature (r + s)
sig64 = bytes(64)  # r(32) + s(32)
components = SignatureUtils.parse(sig64)
print(f"r: {components.r.hex()}")
print(f"s: {components.s.hex()}")
print(f"v: {components.v}")  # 0 when not provided

# Parse 65-byte signature with recovery id (r + s + v)
sig65 = bytes(65)  # r(32) + s(32) + v(1)
components = SignatureUtils.parse(sig65)
print(f"v: {components.v}")  # 27 or 28 typically
```

### Serializing Signatures

```python
from voltaire import SignatureUtils

r = bytes.fromhex("79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798")
s = bytes.fromhex("483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")

# Serialize to 64-byte compact format (r + s)
sig64 = SignatureUtils.serialize(r, s)
print(f"Length: {len(sig64)}")  # 64

# Serialize to 65-byte format with recovery id (r + s + v)
sig65 = SignatureUtils.serialize(r, s, v=27)
print(f"Length: {len(sig65)}")  # 65
```

## API Reference

### `SignatureComponents` Dataclass

```python
@dataclass
class SignatureComponents:
    r: bytes   # 32-byte r component
    s: bytes   # 32-byte s component
    v: int     # Recovery id (0, 1, 27, or 28)
```

### `SignatureUtils.normalize(r, s) -> tuple[bytes, bytes, bool]`

Normalize signature to canonical low-s form.

**Parameters:**
- `r`: 32-byte r component
- `s`: 32-byte s component

**Returns:** Tuple of (normalized_r, normalized_s, was_normalized)

**Example:**
```python
r, s, normalized = SignatureUtils.normalize(r_bytes, s_bytes)
if normalized:
    print("Signature was in high-s form, now normalized")
```

### `SignatureUtils.is_canonical(r, s) -> bool`

Check if signature is in canonical form per EIP-2.

**Parameters:**
- `r`: 32-byte r component
- `s`: 32-byte s component

**Returns:** `True` if signature passes validation

**Validation checks:**
- r is in range [1, N-1]
- s is in range [1, N/2] (low-s)

### `SignatureUtils.parse(signature) -> SignatureComponents`

Parse signature from compact format.

**Parameters:**
- `signature`: 64 or 65 byte signature

**Returns:** `SignatureComponents` with r, s, v

**Raises:**
- `InvalidLengthError`: If signature is not 64 or 65 bytes

**Format:**
- 64 bytes: `r(32) + s(32)` (v defaults to 0)
- 65 bytes: `r(32) + s(32) + v(1)`

### `SignatureUtils.serialize(r, s, v=None) -> bytes`

Serialize signature to compact format.

**Parameters:**
- `r`: 32-byte r component
- `s`: 32-byte s component
- `v`: Optional recovery id

**Returns:** 64 bytes if v is None, 65 bytes otherwise

**Raises:**
- `InvalidLengthError`: If r or s is not 32 bytes

## Notes

- All component bytes are big-endian encoded
- Recovery id v can be 0/1 (raw) or 27/28 (Ethereum convention)
- Normalization only modifies s; r is passed through unchanged
- The secp256k1 curve order N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
