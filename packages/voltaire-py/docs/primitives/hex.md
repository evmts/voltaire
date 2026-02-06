# Hex

Hex encoding and decoding utilities for Ethereum data.

## Overview

The `Hex` module provides efficient hex string encoding/decoding using Voltaire's native C implementation. It handles the `0x` prefix convention used throughout Ethereum.

## Usage

### Basic Encoding/Decoding

```python
from voltaire import Hex

# Encode bytes to hex string (always includes 0x prefix)
data = b"\xde\xad\xbe\xef"
hex_str = Hex.encode(data)  # "0xdeadbeef"

# Decode hex string to bytes (0x prefix optional)
bytes_data = Hex.decode("0xdeadbeef")  # b"\xde\xad\xbe\xef"
bytes_data = Hex.decode("deadbeef")    # b"\xde\xad\xbe\xef"
```

### Validation

```python
from voltaire import Hex

# Check if string is valid hex
Hex.is_valid("0xdeadbeef")  # True
Hex.is_valid("deadbeef")    # True
Hex.is_valid("0xgg")        # False
Hex.is_valid("not hex")     # False
```

### Convenience Functions

```python
from voltaire import hex_encode, hex_decode

# Standalone functions for quick operations
hex_str = hex_encode(b"\xca\xfe")  # "0xcafe"
data = hex_decode("0xcafe")        # b"\xca\xfe"
```

## API Reference

### `Hex` Class

#### `Hex.encode(data: bytes) -> str`

Encode bytes to a hex string with `0x` prefix.

**Parameters:**
- `data`: Bytes to encode

**Returns:** Hex string with `0x` prefix

**Example:**
```python
Hex.encode(b"\x00\xff")  # "0x00ff"
Hex.encode(b"")          # "0x"
```

#### `Hex.decode(hex_str: str) -> bytes`

Decode a hex string to bytes.

**Parameters:**
- `hex_str`: Hex string (with or without `0x` prefix)

**Returns:** Decoded bytes

**Raises:**
- `InvalidHexError`: If the string contains invalid hex characters
- `InvalidLengthError`: If the string has odd length

**Example:**
```python
Hex.decode("0xdeadbeef")  # b"\xde\xad\xbe\xef"
Hex.decode("cafe")        # b"\xca\xfe"
```

#### `Hex.is_valid(hex_str: str) -> bool`

Check if a string is valid hexadecimal.

**Parameters:**
- `hex_str`: String to validate

**Returns:** `True` if valid hex, `False` otherwise

**Example:**
```python
Hex.is_valid("0x1234")  # True
Hex.is_valid("abcdef")  # True
Hex.is_valid("0xZZ")    # False
```

### Convenience Functions

#### `hex_encode(data: bytes) -> str`

Alias for `Hex.encode()`.

#### `hex_decode(hex_str: str) -> bytes`

Alias for `Hex.decode()`.

## Notes

- Output hex strings are always lowercase
- The `0x` prefix is always included in encoded output
- Decoding accepts both uppercase and lowercase hex characters
- Empty bytes encode to `"0x"`, and `"0x"` decodes to empty bytes
