# Address

`Address` (`voltaire.address`) wraps a 20-byte `PrimitivesAddress` struct with EIP-55 checksum formatting/validation, CREATE/CREATE2 contract address derivation, and Python value semantics (`==`, `hash()`, `bytes()`, `str()`).

## Constructors and Static Methods

| Method | Signature | Behavior |
|--------|-----------|----------|
| `Address.from_hex` | `(hex_str: str) -> Address` | Parses 40 hex digits (with or without `0x`); raises `InvalidHexError` or `InvalidLengthError` |
| `Address.from_bytes` | `(data: bytes) -> Address` | Copies exactly 20 bytes; raises `InvalidLengthError` otherwise |
| `Address.zero` | `() -> Address` | Returns `0x0000000000000000000000000000000000000000` |
| `Address.validate_checksum` | `(hex_str: str) -> bool` | Validates EIP-55 mixed-case checksum |
| `Address.calculate_create_address` | `(sender: Address, nonce: int) -> Address` | Computes `keccak256(rlp([sender, nonce]))[12:]` |
| `Address.calculate_create2_address` | `(sender: Address, salt: bytes, init_code: bytes) -> Address` | Computes `keccak256(0xff \|\| sender \|\| salt \|\| keccak256(init_code))[12:]` (`len(salt) == 32`) |

## Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `to_hex()` | `str` | Lowercase `"0x"` + 40 hex chars |
| `to_checksum()` / `str(addr)` | `str` | EIP-55 checksummed `"0x"` + 40 hex chars |
| `to_bytes()` / `bytes(addr)` | `bytes` | 20 raw bytes |
| `is_zero()` | `bool` | True iff all 20 bytes are zero |

## Example

```python
from voltaire import Address

addr = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e")
assert addr.to_checksum() == "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"
assert Address.validate_checksum(addr.to_checksum())
assert Address.zero().is_zero()

# Contract address derivation
created = Address.calculate_create_address(addr, nonce=0)
created2 = Address.calculate_create2_address(addr, salt=bytes(32), init_code=b"\x60\x00")
assert addr in {addr, created, created2}  # hashable
```
