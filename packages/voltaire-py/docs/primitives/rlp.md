# RLP

Recursive Length Prefix (RLP) encoding/decoding for Ethereum serialization.

## Overview

RLP is Ethereum's canonical serialization format for encoding arbitrarily nested arrays of binary data. It's used throughout Ethereum for transactions, blocks, state, and other data structures.

See: [Ethereum Yellow Paper, Appendix B](https://ethereum.github.io/yellowpaper/paper.pdf)

## Encoding Rules

### Bytes Encoding
- **Single byte [0x00, 0x7f]**: Encoded as itself
- **Bytes [0-55 bytes]**: `0x80 + len` prefix, followed by data
- **Bytes [56+ bytes]**: `0xb7 + len(len)` prefix, followed by length, then data

### List Encoding
- **List [0-55 bytes payload]**: `0xc0 + len` prefix, followed by concatenated encoded items
- **List [56+ bytes payload]**: `0xf7 + len(len)` prefix, followed by length, then items

## Usage

### Encoding Bytes

```python
from voltaire import Rlp

# Single byte < 0x80 (encoded as itself)
Rlp.encode_bytes(b"\x0f")  # b"\x0f"

# Short bytes (0-55 bytes)
Rlp.encode_bytes(b"dog")   # b"\x83dog"

# Empty bytes
Rlp.encode_bytes(b"")      # b"\x80"
```

### Encoding Integers

```python
from voltaire import Rlp

# Zero (encoded as empty bytes)
Rlp.encode_uint(0)     # b"\x80"

# Small integer < 128
Rlp.encode_uint(15)    # b"\x0f"

# Larger integer
Rlp.encode_uint(1024)  # b"\x82\x04\x00"

# Large integer
Rlp.encode_uint(0xFFFFFFFFFFFFFFFF)  # 8 bytes + prefix
```

### High-Level Encoding

```python
from voltaire import Rlp, rlp_encode

# Encode any supported type
rlp_encode(b"hello")     # bytes
rlp_encode(42)           # integer
rlp_encode([b"a", b"b"]) # list of bytes
rlp_encode([1, 2, 3])    # list of integers (recursively encoded)

# Nested lists
rlp_encode([[b"a"], [b"b", b"c"]])
```

### Hex Conversion

```python
from voltaire import Rlp

# Convert RLP bytes to hex
rlp_data = Rlp.encode_bytes(b"dog")
hex_str = Rlp.to_hex(rlp_data)  # "0x83646f67"

# Convert hex to RLP bytes
rlp_bytes = Rlp.from_hex("0x83646f67")  # b"\x83dog"
```

## API Reference

### `Rlp` Class

#### `Rlp.encode_bytes(data: bytes) -> bytes`

Encode bytes as RLP.

**Parameters:**
- `data`: Bytes to encode

**Returns:** RLP-encoded bytes

**Example:**
```python
Rlp.encode_bytes(b"cat")  # b"\x83cat"
Rlp.encode_bytes(b"")     # b"\x80"
```

#### `Rlp.encode_uint(value: int) -> bytes`

Encode unsigned integer as RLP.

**Parameters:**
- `value`: Non-negative integer to encode

**Returns:** RLP-encoded bytes

**Raises:**
- `ValueError`: If value is negative

**Example:**
```python
Rlp.encode_uint(0)      # b"\x80"
Rlp.encode_uint(127)    # b"\x7f"
Rlp.encode_uint(128)    # b"\x81\x80"
Rlp.encode_uint(1024)   # b"\x82\x04\x00"
```

#### `Rlp.encode(item: bytes | int | list) -> bytes`

Encode item as RLP (recursive for lists).

**Parameters:**
- `item`: Bytes, integer, or list of encodable items

**Returns:** RLP-encoded bytes

**Example:**
```python
Rlp.encode(b"hello")           # bytes
Rlp.encode(42)                 # integer
Rlp.encode([b"a", b"b"])       # list
Rlp.encode([[1], [2, 3]])      # nested list
```

#### `Rlp.to_hex(rlp_data: bytes) -> str`

Convert RLP bytes to hex string.

**Parameters:**
- `rlp_data`: RLP-encoded bytes

**Returns:** Hex string with `0x` prefix

**Example:**
```python
Rlp.to_hex(b"\x83dog")  # "0x83646f67"
```

#### `Rlp.from_hex(hex_str: str) -> bytes`

Convert hex string to bytes.

**Parameters:**
- `hex_str`: Hex string (with or without `0x` prefix)

**Returns:** Decoded bytes

**Raises:**
- `InvalidHexError`: If the string contains invalid hex characters

**Example:**
```python
Rlp.from_hex("0x83646f67")  # b"\x83dog"
```

### Convenience Functions

#### `rlp_encode(item: bytes | int | list) -> bytes`

Alias for `Rlp.encode()`.

## Test Vectors

From the Ethereum specification:

| Input | RLP Encoding |
|-------|--------------|
| `""` (empty string) | `0x80` |
| `"dog"` | `0x83646f67` |
| `["cat", "dog"]` | `0xc88363617483646f67` |
| `""` (empty list) | `0xc0` |
| `15` (integer) | `0x0f` |
| `1024` (integer) | `0x820400` |

## Notes

- All encodings are canonical (minimal length)
- Integers use big-endian, no leading zeros
- Single bytes < 0x80 encode as themselves (no prefix)
- Python implementation uses Voltaire's native C library for performance
