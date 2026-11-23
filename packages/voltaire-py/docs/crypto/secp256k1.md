# Secp256k1

`voltaire.secp256k1` exposes `Signature` and `Secp256k1` backed by Voltaire's native C FFI (`primitives_secp256k1_*`, `primitives_generate_private_key`, `primitives_compress_public_key`).

## `Signature` Dataclass

```python
@dataclass(frozen=True)
class Signature:
    r: bytes  # 32 bytes (big-endian)
    s: bytes  # 32 bytes (big-endian)
    v: int    # 0, 1, 27, or 28
```

## `Secp256k1` Static Methods

| Method | Signature | Raises |
|--------|-----------|--------|
| `recover_public_key` | `(message_hash: bytes, signature: Signature) -> bytes` (64 B `x \|\| y`) | `InvalidLengthError`, `InvalidSignatureError` |
| `recover_address` | `(message_hash: bytes, signature: Signature) -> Address` | `InvalidLengthError`, `InvalidSignatureError` |
| `public_key_from_private` | `(private_key: bytes) -> bytes` (64 B `x \|\| y`) | `InvalidLengthError`, `InvalidInputError` |
| `validate_signature` | `(r: bytes, s: bytes) -> bool` (checks `1 <= r < N`, `1 <= s <= N/2`) | `InvalidLengthError` |
| `generate_private_key` | `() -> bytes` (32 B CSPRNG scalar in `[1, N - 1]`) | `VoltaireError` |
| `compress_public_key` | `(uncompressed: bytes) -> bytes` (33 B SEC1 `0x02/0x03 \|\| x`) | `InvalidLengthError` |

All byte arguments must be raw `bytes` (e.g., pass `keccak256(msg).to_bytes()` rather than a `Hash` object).

## Example

```python
from voltaire import Address, Secp256k1, Signature, keccak256

# Derive public key and address from a 32-byte private key
privkey = Secp256k1.generate_private_key()
pubkey = Secp256k1.public_key_from_private(privkey)          # 64 bytes (x || y)
compressed = Secp256k1.compress_public_key(pubkey)           # 33 bytes (02/03 || x)
addr = Address.from_bytes(keccak256(pubkey).to_bytes()[12:])

# Recover public key and address from a signature
msg_hash = keccak256(b"hello").to_bytes()
sig = Signature(r=r_bytes, s=s_bytes, v=27)
assert Secp256k1.validate_signature(sig.r, sig.s)
recovered_pubkey = Secp256k1.recover_public_key(msg_hash, sig)
recovered_addr = Secp256k1.recover_address(msg_hash, sig)
```

For EIP-2 low-`s` normalization and compact parsing/serialization, see [Signature](signature.md).
