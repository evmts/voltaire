# Uint256

256-bit unsigned integer for Ethereum values (balances, amounts, storage).

## Overview

The `Uint256` class represents a 256-bit (32-byte) unsigned integer, the fundamental numeric type in Ethereum. It provides:

- Parsing from hex strings and Python integers
- Conversion to various formats (hex, int, bytes)
- Big-endian byte representation (Ethereum standard)
- Comparison and arithmetic operations
- Python protocol support (`int()`, `==`, `<`, hash)

## API Reference

### Constructors

#### `Uint256.from_hex(hex_str: str) -> Uint256`

Create from a hex string.

```python
from voltaire import Uint256

# With 0x prefix
value = Uint256.from_hex("0x1234")

# Full 32-byte representation
value = Uint256.from_hex("0x0000000000000000000000000000000000000000000000000000000000001234")

# Without prefix
value = Uint256.from_hex("ff")
```

**Raises:**
- `InvalidHexError` - Invalid hex characters
- `InvalidLengthError` - Exceeds 32 bytes (64 hex chars)

#### `Uint256.from_int(value: int) -> Uint256`

Create from a Python integer.

```python
value = Uint256.from_int(1000000000000000000)  # 1 ETH in wei
value = Uint256.from_int(0)
value = Uint256.from_int(2**256 - 1)  # Maximum value
```

**Raises:**
- `ValueError` - Negative number or exceeds 2^256 - 1

#### `Uint256.from_bytes(data: bytes) -> Uint256`

Create from big-endian bytes.

```python
# Big-endian: most significant byte first
value = Uint256.from_bytes(b'\x00' * 31 + b'\x01')  # = 1
value = Uint256.from_bytes(b'\xff' * 32)  # = MAX
```

**Raises:**
- `InvalidLengthError` - Exceeds 32 bytes

#### `Uint256.zero() -> Uint256`

Create zero value.

```python
zero = Uint256.zero()
assert int(zero) == 0
```

### Instance Methods

#### `to_hex() -> str`

Return hex string with `0x` prefix, zero-padded to 64 characters.

```python
value = Uint256.from_int(255)
print(value.to_hex())  # "0x00000000000000000000000000000000000000000000000000000000000000ff"
```

#### `to_int() -> int`

Return Python integer.

```python
value = Uint256.from_hex("0xff")
print(value.to_int())  # 255
```

#### `to_bytes() -> bytes`

Return 32-byte big-endian representation.

```python
value = Uint256.from_int(256)
raw = value.to_bytes()
assert len(raw) == 32
assert raw == b'\x00' * 30 + b'\x01\x00'  # 256 in big-endian
```

### Class Attributes

#### `Uint256.MAX`

Maximum value (2^256 - 1).

```python
print(Uint256.MAX)  # 115792089237316195423570985008687907853269984665640564039457584007913129639935
```

### Python Protocol Support

#### `int()` conversion

```python
value = Uint256.from_hex("0x1234")
n = int(value)  # 4660
```

#### Equality (`==`)

```python
a = Uint256.from_int(100)
b = Uint256.from_hex("0x64")
assert a == b
```

#### Comparison (`<`, `<=`, `>`, `>=`)

```python
a = Uint256.from_int(100)
b = Uint256.from_int(200)
assert a < b
assert b > a
```

#### Hashing

```python
value = Uint256.from_int(42)
value_set = {value}
value_dict = {value: "meaning of life"}
```

#### String representation

```python
value = Uint256.from_int(255)
print(repr(value))  # Uint256(0x00000000...00ff)
print(str(value))   # 0x00000000...00ff
```

## Big-Endian Representation

Uint256 uses big-endian byte order (most significant byte first), matching Ethereum's ABI encoding and storage format.

```python
# Integer 256 = 0x100
value = Uint256.from_int(256)
raw = value.to_bytes()

# Big-endian: [0x00, ..., 0x01, 0x00]
#             MSB          LSB
assert raw[-2] == 1   # 0x01
assert raw[-1] == 0   # 0x00
```

## Examples

### Working with ETH Values

```python
from voltaire import Uint256

# 1 ETH = 10^18 wei
ONE_ETH = Uint256.from_int(10**18)

# Parse balance from hex
balance = Uint256.from_hex("0x0de0b6b3a7640000")  # 1 ETH
print(f"Balance: {int(balance) / 10**18} ETH")
```

### Storage Slots

```python
from voltaire import Uint256

# Storage slot values
slot_value = Uint256.from_hex("0x0000000000000000000000000000000000000000000000000000000000000001")

# Convert to integer for logic
if int(slot_value) > 0:
    print("Non-zero storage value")
```

### Comparisons

```python
from voltaire import Uint256

min_amount = Uint256.from_int(10**18)
user_balance = Uint256.from_hex("0x1bc16d674ec80000")  # 2 ETH

if user_balance >= min_amount:
    print("Sufficient balance")
```

### Edge Cases

```python
from voltaire import Uint256

# Zero
zero = Uint256.zero()
assert int(zero) == 0

# Maximum value
max_val = Uint256.from_int(Uint256.MAX)
assert int(max_val) == 2**256 - 1

# Overflow raises error
try:
    Uint256.from_int(2**256)  # Too large
except ValueError:
    print("Overflow detected")
```
