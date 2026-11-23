# Uint256

`Uint256` (`voltaire.uint256`) represents an immutable, big-endian 256-bit unsigned integer (`0 <= value < 2**256`) backed by `PrimitivesU256`.

## Constructors and Methods

| Method | Signature | Behavior |
|--------|-----------|----------|
| `Uint256(data)` | `(data: bytes) -> Uint256` | Validates `len(data) == 32` |
| `Uint256.from_hex` | `(hex_str: str) -> Uint256` | Parses hex string (with or without `0x`); raises `InvalidHexError` |
| `Uint256.from_int` | `(value: int) -> Uint256` | Converts Python `int` in `[0, 2**256 - 1]`; raises `InvalidInputError` if negative or `>= 2**256` |
| `Uint256.from_bytes` | `(data: bytes) -> Uint256` | Copies 32 big-endian bytes; raises `InvalidLengthError` otherwise |
| `Uint256.zero` | `() -> Uint256` | Returns zero (`0x00...00`) |
| `to_hex()` | `() -> str` | Zero-padded 66-char `"0x"` + 64 lowercase hex digits |
| `to_int()` / `int(u)` | `() -> int` | Converts to Python `int` |
| `to_bytes()` | `() -> bytes` | Returns 32 big-endian bytes |

Supports full rich comparisons (`==`, `<`, `<=`, `>`, `>=`), `hash()`, `repr()`, and `str()`.

## Example

```python
from voltaire import Uint256

one_eth = Uint256.from_int(10**18)
from_hex = Uint256.from_hex("0xde0b6b3a7640000")

assert one_eth == from_hex
assert int(one_eth) == 10**18
assert len(one_eth.to_bytes()) == 32
assert Uint256.zero() < one_eth
```
