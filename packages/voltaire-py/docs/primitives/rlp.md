# RLP

`voltaire.rlp` implements Recursive Length Prefix encoding for bytes, non-negative integers, and arbitrarily nested lists via `Rlp` and `rlp_encode`.

## API Reference

| Symbol | Signature | Behavior |
|--------|-----------|----------|
| `Rlp.encode_bytes` | `(data: bytes) -> bytes` | RLP-encodes a raw byte string via native FFI |
| `Rlp.encode_uint` | `(value: int) -> bytes` | Encodes non-negative integer as minimal big-endian RLP (`0 -> b"\x80"`) |
| `Rlp.encode` / `rlp_encode` | `(item: bytes \| int \| list) -> bytes` | Recursively encodes bytes, ints, and nested lists |
| `Rlp.to_hex` | `(rlp_data: bytes) -> str` | Formats RLP bytes as `"0x"`-prefixed lowercase hex |
| `Rlp.from_hex` | `(hex_str: str) -> bytes` | Decodes hex string into raw RLP bytes |

## Example

```python
from voltaire import Rlp, rlp_encode

assert Rlp.encode_bytes(b"dog") == b"\x83dog"
assert Rlp.encode_uint(0) == b"\x80"
assert Rlp.encode_uint(1024) == b"\x82\x04\x00"

nested = rlp_encode([b"cat", [b"dog"], 15])
hex_str = Rlp.to_hex(nested)
assert Rlp.from_hex(hex_str) == nested
```
