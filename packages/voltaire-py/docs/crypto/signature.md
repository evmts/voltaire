# Signature Utilities

`voltaire.signature` provides `SignatureComponents` and `SignatureUtils` for EIP-2 low-`s` normalization, canonical checks, and 64/65-byte compact serialization.

## `SignatureComponents` Dataclass

```python
@dataclass
class SignatureComponents:
    r: bytes  # 32 bytes (big-endian)
    s: bytes  # 32 bytes (big-endian)
    v: int    # recovery id (0 if parsed from 64 bytes)
```

## `SignatureUtils` Static Methods

| Method | Signature | Behavior |
|--------|-----------|----------|
| `normalize` | `(r: bytes, s: bytes) -> tuple[bytes, bytes, bool]` | Replaces `s` with `N - s` if `s > N / 2`; returns `(r, s_norm, was_normalized)` |
| `is_canonical` | `(r: bytes, s: bytes) -> bool` | True iff `1 <= r < N` and `1 <= s <= N / 2` (EIP-2) |
| `parse` | `(signature: bytes) -> SignatureComponents` | Parses 64-byte (`r \|\| s`, `v=0`) or 65-byte (`r \|\| s \|\| v`) compact signature |
| `serialize` | `(r: bytes, s: bytes, v: int \| None = None) -> bytes` | Serializes to 64 bytes (`v is None`) or 65 bytes (`v` appended) |

All methods validate byte lengths and raise `InvalidLengthError` on malformed inputs.

## Example

```python
from voltaire import SignatureUtils

r = bytes.fromhex("79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798")
s_high = bytes.fromhex("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140")

r_norm, s_norm, changed = SignatureUtils.normalize(r, s_high)
assert changed is True
assert SignatureUtils.is_canonical(r_norm, s_norm) is True

# Round-trip 65-byte compact format
raw65 = SignatureUtils.serialize(r_norm, s_norm, v=27)
assert len(raw65) == 65
parts = SignatureUtils.parse(raw65)
assert (parts.r, parts.s, parts.v) == (r_norm, s_norm, 27)
```

When `normalize` returns `was_normalized == True`, flip your recovery ID parity (`0 <-> 1` or `27 <-> 28`) so `ecrecover` recovers the same signer.
