# Bytecode

EVM bytecode analysis and validation utilities.

## Overview

The `Bytecode` class provides tools for analyzing EVM bytecode, including:

- JUMPDEST location analysis (identifying valid jump targets)
- Instruction boundary detection (distinguishing opcodes from PUSH data)
- Bytecode validation (checking structural correctness)
- Program counter navigation (skipping PUSH immediate data)

This is essential for EVM implementations, static analysis tools, and security auditing.

## API Reference

### Constructors

#### `Bytecode(code: bytes)`

Create a bytecode analyzer from raw bytecode bytes.

```python
from voltaire import Bytecode

# From raw bytes
code = bytes([0x60, 0x00, 0x5b, 0x00])  # PUSH1 0x00, JUMPDEST, STOP
bytecode = Bytecode(code)
```

#### `Bytecode.from_hex(hex_str: str) -> Bytecode`

Create a bytecode analyzer from a hex string.

```python
from voltaire import Bytecode

# With 0x prefix
bytecode = Bytecode.from_hex("0x6000600060005b0100")

# Without prefix
bytecode = Bytecode.from_hex("6000600060005b0100")
```

**Raises:**
- `InvalidHexError` - Invalid hex characters or odd length

### Instance Methods

#### `analyze_jumpdests() -> bytes`

Analyze bytecode and return positions of all valid JUMPDEST instructions.

The returned bytes contain the positions as 4-byte little-endian integers.
Results are cached for efficiency on repeated calls.

```python
# PUSH1 0x00, PUSH1 0x00, JUMPDEST, ADD, STOP
bytecode = Bytecode(bytes([0x60, 0x00, 0x60, 0x00, 0x5b, 0x01, 0x00]))

# Get JUMPDEST positions
jumpdests = bytecode.analyze_jumpdests()
# Position 4 is a valid JUMPDEST
```

**Note:** JUMPDEST bytes appearing inside PUSH data are NOT valid jump destinations.

```python
# PUSH1 0x5b (0x5b is JUMPDEST opcode, but here it's data)
# JUMPDEST (actual valid jump destination)
bytecode = Bytecode(bytes([0x60, 0x5b, 0x5b]))
assert bytecode.is_valid_jumpdest(1) is False  # Inside PUSH data
assert bytecode.is_valid_jumpdest(2) is True   # Actual JUMPDEST
```

#### `is_boundary(position: int) -> bool`

Check if a position is at an instruction boundary (not inside PUSH data).

```python
# PUSH1 0x00, JUMPDEST, STOP
bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))

assert bytecode.is_boundary(0) is True   # PUSH1 opcode
assert bytecode.is_boundary(1) is False  # Inside PUSH1 data
assert bytecode.is_boundary(2) is True   # JUMPDEST opcode
assert bytecode.is_boundary(3) is True   # STOP opcode
```

#### `is_valid_jumpdest(position: int) -> bool`

Check if a position is a valid JUMPDEST instruction.

A valid JUMPDEST must:
1. Be at an instruction boundary (not inside PUSH data)
2. Contain the JUMPDEST opcode (0x5b)

```python
# PUSH1 0x5b, JUMPDEST, STOP
bytecode = Bytecode(bytes([0x60, 0x5b, 0x5b, 0x00]))

assert bytecode.is_valid_jumpdest(0) is False  # PUSH1, not JUMPDEST
assert bytecode.is_valid_jumpdest(1) is False  # 0x5b inside PUSH data
assert bytecode.is_valid_jumpdest(2) is True   # Valid JUMPDEST
assert bytecode.is_valid_jumpdest(3) is False  # STOP, not JUMPDEST
```

#### `validate() -> bool`

Validate bytecode for structural correctness.

Checks that all PUSH instructions have complete immediate data.

```python
# Valid bytecode: PUSH1 0x00, STOP
valid = Bytecode(bytes([0x60, 0x00, 0x00]))
assert valid.validate() is True

# Invalid bytecode: PUSH1 with no data
invalid = Bytecode(bytes([0x60]))  # Incomplete PUSH1
assert invalid.validate() is False
```

#### `get_next_pc(current_pc: int) -> int`

Get the next program counter position after the instruction at current_pc.

For PUSH instructions, this skips over the immediate data bytes.
Returns -1 if at end of bytecode or if position is invalid.

```python
# PUSH1 0x00, PUSH2 0x0102, STOP
bytecode = Bytecode(bytes([0x60, 0x00, 0x61, 0x01, 0x02, 0x00]))

assert bytecode.get_next_pc(0) == 2   # After PUSH1: skip opcode + 1 byte
assert bytecode.get_next_pc(2) == 5   # After PUSH2: skip opcode + 2 bytes
assert bytecode.get_next_pc(5) == 6   # After STOP: just +1
assert bytecode.get_next_pc(6) == -1  # At end
```

#### `to_bytes() -> bytes`

Return the raw bytecode bytes.

```python
code = bytes([0x60, 0x00, 0x5b, 0x00])
bytecode = Bytecode(code)
assert bytecode.to_bytes() == code
```

### Python Protocol Support

#### `len()`

```python
bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))
assert len(bytecode) == 4
```

#### `bytes()` conversion

```python
bytecode = Bytecode(bytes([0x60, 0x00, 0x5b, 0x00]))
raw = bytes(bytecode)  # Same as bytecode.to_bytes()
```

## EVM Bytecode Basics

### PUSH Instructions

PUSH1 (0x60) through PUSH32 (0x7f) push 1-32 bytes onto the stack.
The bytes following the opcode are immediate data, not instructions.

```
0x60 0xff 0x00       # PUSH1 0xff, STOP
     ^^^^
     This is data, not an opcode!
```

### JUMPDEST (0x5b)

The JUMPDEST opcode marks a valid jump destination. The EVM only allows
JUMP/JUMPI to target positions with a valid JUMPDEST instruction.

**Critical:** A 0x5b byte inside PUSH data is NOT a valid jump destination.

```
0x60 0x5b 0x5b 0x00  # PUSH1 0x5b, JUMPDEST, STOP
     ^^^^            # Data (invalid jump target)
          ^^^^       # Instruction (valid jump target)
```

## Examples

### Basic Bytecode Analysis

```python
from voltaire import Bytecode

# Simple contract: PUSH1 0x00, JUMPDEST, STOP
code = bytes([0x60, 0x00, 0x5b, 0x00])
bytecode = Bytecode(code)

print(f"Length: {len(bytecode)} bytes")
print(f"Valid: {bytecode.validate()}")

# Walk through instructions
pc = 0
while pc < len(bytecode):
    print(f"Instruction at PC {pc}")
    if bytecode.is_valid_jumpdest(pc):
        print("  (JUMPDEST)")
    next_pc = bytecode.get_next_pc(pc)
    if next_pc == -1:
        break
    pc = next_pc
```

### Security Analysis

```python
from voltaire import Bytecode

def find_all_jumpdests(bytecode: Bytecode) -> list[int]:
    """Find all valid JUMPDEST positions in bytecode."""
    positions = []
    pc = 0
    while pc < len(bytecode):
        if bytecode.is_valid_jumpdest(pc):
            positions.append(pc)
        next_pc = bytecode.get_next_pc(pc)
        if next_pc == -1:
            break
        pc = next_pc
    return positions

# Analyze contract bytecode
bytecode = Bytecode.from_hex("0x6080604052600080...")
jumpdests = find_all_jumpdests(bytecode)
print(f"Found {len(jumpdests)} valid jump destinations")
```

### Validating Bytecode Before Execution

```python
from voltaire import Bytecode, InvalidInputError

def safe_load_bytecode(hex_code: str) -> Bytecode | None:
    """Load and validate bytecode, returning None if invalid."""
    try:
        bytecode = Bytecode.from_hex(hex_code)
        if not bytecode.validate():
            print("Warning: Bytecode has truncated PUSH instructions")
            return None
        return bytecode
    except InvalidInputError as e:
        print(f"Invalid bytecode: {e}")
        return None
```

## Opcode Reference

| Opcode | Name | Description |
|--------|------|-------------|
| 0x00 | STOP | Halt execution |
| 0x5b | JUMPDEST | Valid jump destination |
| 0x56 | JUMP | Unconditional jump |
| 0x57 | JUMPI | Conditional jump |
| 0x60-0x7f | PUSH1-PUSH32 | Push 1-32 bytes |
| 0x80-0x8f | DUP1-DUP16 | Duplicate stack item |
| 0x90-0x9f | SWAP1-SWAP16 | Swap stack items |
