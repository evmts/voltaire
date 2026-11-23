# Bytecode

`Bytecode` (`voltaire.bytecode`) analyzes raw EVM bytecode via Voltaire's C FFI (`primitives_bytecode_*`), skipping `PUSH1` (`0x60`)–`PUSH32` (`0x7f`) immediate payloads so `0x5b` bytes inside push data are never treated as valid `JUMPDEST` targets.

## API Reference

| Method | Signature | Behavior |
|--------|-----------|----------|
| `Bytecode(code)` | `(code: bytes) -> Bytecode` | Wraps raw EVM bytecode bytes |
| `Bytecode.from_hex` | `(hex_str: str) -> Bytecode` | Parses hex string (optional `0x`); raises `InvalidHexError` |
| `analyze_jumpdests` | `() -> bytes` | Returns cached packed 4-byte little-endian `uint32` offsets of valid `JUMPDEST`s |
| `is_boundary` | `(position: int) -> bool` | True if `position` is an opcode boundary (not inside `PUSH` immediate data) |
| `is_valid_jumpdest` | `(position: int) -> bool` | True if `position` is an opcode boundary and `code[position] == 0x5b` |
| `validate` | `() -> bool` | True if every `PUSH1`–`PUSH32` instruction has complete immediate bytes |
| `get_next_pc` | `(current_pc: int) -> int` | Returns next instruction offset or `-1` at end of bytecode |
| `to_bytes` / `bytes(bc)` | `() -> bytes` | Returns underlying bytecode bytes |

Supports `len(bc)`, `bytes(bc)`, `str(bc)`, and `repr(bc)`.

## Example

```python
import struct
from voltaire import Bytecode

# PUSH1 0x5b (data, not JUMPDEST), JUMPDEST (pc=2), ADD, STOP
bc = Bytecode.from_hex("0x605b5b0100")

assert bc.validate() is True
assert bc.is_boundary(1) is False
assert bc.is_valid_jumpdest(1) is False
assert bc.is_valid_jumpdest(2) is True
assert bc.get_next_pc(0) == 2

# Unpack 4-byte little-endian JUMPDEST offsets
raw_jd = bc.analyze_jumpdests()
jumpdests = [pos for (pos,) in struct.iter_unpack("<I", raw_jd)]
assert jumpdests == [2]
```
