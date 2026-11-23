# Hex

`voltaire.hex` provides hexadecimal encoding, decoding, and validation via the `Hex` static namespace and top-level aliases `hex_encode` / `hex_decode`.

## API Reference

| Symbol | Signature | Behavior |
|--------|-----------|----------|
| `Hex.encode` / `hex_encode` | `(data: bytes) -> str` | Encodes bytes to lowercase `"0x"`-prefixed hex |
| `Hex.decode` / `hex_decode` | `(hex_str: str) -> bytes` | Decodes hex string (with or without `"0x"`); raises `InvalidHexError` or `InvalidLengthError` |
| `Hex.is_valid` | `(hex_str: str) -> bool` | Returns `True` if string is valid even-length hex |

## Example

```python
from voltaire import Hex, hex_encode, hex_decode

encoded = Hex.encode(b"\xde\xad\xbe\xef")
assert encoded == "0xdeadbeef"
assert hex_encode(b"\xde\xad\xbe\xef") == encoded

raw = Hex.decode("0xdeadbeef")
assert raw == b"\xde\xad\xbe\xef"
assert hex_decode("deadbeef") == raw

assert Hex.is_valid("0xdeadbeef") is True
assert Hex.is_valid("0xxyz") is False
```
