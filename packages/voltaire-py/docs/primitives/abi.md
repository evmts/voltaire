# ABI

ABI (Application Binary Interface) encoding and decoding for Ethereum smart contract interaction.

## Overview

The `Abi` module provides functions for encoding and decoding data according to the Ethereum ABI specification:

- Encoding parameters to ABI format
- Encoding function calldata (selector + parameters)
- Packed encoding (non-standard, like Solidity's `abi.encodePacked`)
- Decoding ABI-encoded parameters to Python values
- Decoding function calldata (selector + parameters)
- Computing function selectors
- Gas estimation for calldata

## Usage

### Encoding Parameters

```python
from voltaire import Abi

# Encode a single uint256
encoded = Abi.encode_parameters(["uint256"], [42])
print(len(encoded))  # 32 bytes

# Encode multiple parameters
encoded = Abi.encode_parameters(
    ["address", "uint256", "bool"],
    ["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000, True]
)
print(len(encoded))  # 96 bytes (3 * 32)
```

### Encoding Function Data

```python
from voltaire import Abi

# Encode ERC20 transfer call
calldata = Abi.encode_function_data(
    "transfer(address,uint256)",
    ["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000000000000000000]
)
print(calldata[:4].hex())  # "a9059cbb" (selector)
print(len(calldata))       # 68 bytes (4 + 32 + 32)
```

### Packed Encoding

```python
from voltaire import Abi

# Packed encoding (no padding)
packed = Abi.encode_packed(
    ["address", "uint256"],
    ["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000]
)
print(len(packed))  # 52 bytes (20 + 32)

# Pack multiple bools
packed = Abi.encode_packed(["bool", "bool", "bool"], [True, False, True])
print(packed.hex())  # "010001"
```

### Decoding Parameters

```python
from voltaire import Abi

# Decode a single uint256
data = bytes.fromhex("000000000000000000000000000000000000000000000000000000000000002a")
values = Abi.decode_parameters(["uint256"], data)
print(values)  # [42]

# Decode multiple parameters
data = bytes.fromhex(
    "000000000000000000000000000000000000000000000000000000000000002a"  # uint256: 42
    "000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3"  # address
)
values = Abi.decode_parameters(["uint256", "address"], data)
print(values)  # [42, "0x742d35cc6634c0532925a3b844bc9e7595f251e3"]
```

### Computing Function Selectors

```python
from voltaire import Abi

# ERC20 transfer selector
selector = Abi.compute_selector("transfer(address,uint256)")
print(selector.hex())  # "a9059cbb"

# ERC20 balanceOf selector
selector = Abi.compute_selector("balanceOf(address)")
print(selector.hex())  # "70a08231"
```

### Gas Estimation

```python
from voltaire import Abi

# Estimate gas for calldata
calldata = Abi.encode_function_data(
    "transfer(address,uint256)",
    ["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000]
)
gas = Abi.estimate_gas(calldata)
print(gas)  # Includes 21000 base + calldata cost
```

## Supported Types

### Static Types

| Type | Python Input | Notes |
|------|--------------|-------|
| `uint8` - `uint256` | `int` | Encoded to 32 bytes |
| `address` | `str` | 0x-prefixed hex string |
| `bool` | `bool` | True/False |
| `bytes4`, `bytes32` | `bytes` or `str` | Fixed-size bytes |

### Dynamic Types

| Type | Python Input | Notes |
|------|--------------|-------|
| `bytes` | `bytes` or `str` | Dynamic-length bytes |
| `string` | `str` | UTF-8 string |

### Limitations

- **Signed integers** (`int8`, `int16`, etc.): Not fully supported by underlying C API
- **Small bytes types** (`bytes1`, `bytes2`, `bytes3`): Only `bytes4` and `bytes32` supported
- **Packed encoding for small uints**: Returns 32 bytes instead of minimal

## API Reference

### `Abi` Class

#### `Abi.encode_parameters(types: list[str], values: list) -> bytes`

ABI-encode parameters given types and values.

**Parameters:**
- `types`: List of ABI type strings (e.g., `["address", "uint256"]`)
- `values`: List of values corresponding to the types

**Returns:** ABI-encoded bytes (32 bytes per parameter for static types)

**Raises:**
- `InvalidInputError`: Type/value count mismatch or unsupported type

**Example:**
```python
encoded = Abi.encode_parameters(["uint256", "bool"], [42, True])
# 64 bytes (32 + 32)
```

#### `Abi.encode_function_data(signature: str, values: list) -> bytes`

Encode complete function call data (selector + encoded parameters).

**Parameters:**
- `signature`: Function signature (e.g., `"transfer(address,uint256)"`)
- `values`: List of parameter values

**Returns:** Function calldata (4-byte selector + encoded params)

**Raises:**
- `InvalidInputError`: Type/value count mismatch or invalid signature

**Example:**
```python
calldata = Abi.encode_function_data(
    "transfer(address,uint256)",
    ["0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000]
)
# calldata[:4] is selector, rest is params
```

#### `Abi.encode_packed(types: list[str], values: list) -> bytes`

Non-standard packed encoding (like Solidity's `abi.encodePacked`).

Unlike standard ABI encoding, packed encoding:
- Does not pad values to 32 bytes (for address, bool)
- Concatenates values directly
- Does not include length prefixes for dynamic types

**Parameters:**
- `types`: List of ABI type strings
- `values`: List of values corresponding to the types

**Returns:** Packed encoded bytes

**Example:**
```python
packed = Abi.encode_packed(["address", "bool"], [addr, True])
# 21 bytes (20 + 1)
```

#### `Abi.estimate_gas(data: bytes) -> int`

Estimate calldata gas cost based on EVM pricing rules.

Zero bytes cost 4 gas each, non-zero bytes cost 16 gas each.
Includes 21000 base transaction cost.

**Parameters:**
- `data`: Calldata bytes

**Returns:** Estimated gas cost

**Example:**
```python
gas = Abi.estimate_gas(calldata)
# 21000 base + 4*zeros + 16*nonzeros
```

#### `Abi.decode_parameters(types: list[str], data: bytes) -> list`

Decode ABI-encoded parameters back to Python values.

**Parameters:**
- `types`: List of ABI type strings
- `data`: ABI-encoded bytes to decode

**Returns:** List of decoded Python values

**Raises:**
- `InvalidInputError`: If types or data are invalid
- `InvalidLengthError`: If data is too short

#### `Abi.decode_function_data(types: list[str], data: bytes) -> tuple[bytes, list]`

Decode function calldata (4-byte selector + ABI-encoded parameters).

**Parameters:**
- `types`: List of ABI type strings for the function parameters
- `data`: Function calldata (selector + encoded params)

**Returns:** Tuple of (selector bytes, list of decoded values)

**Raises:**
- `InvalidInputError`: If types or data are invalid
- `InvalidLengthError`: If data is too short (< 4 bytes)

#### `Abi.compute_selector(signature: str) -> bytes`

Compute the 4-byte function selector from a function signature.

**Parameters:**
- `signature`: Function signature string (e.g., `"transfer(address,uint256)"`)

**Returns:** 4-byte selector

## Type Conversion Reference

### Encoding (Python to ABI)

- **Integers** (`int`): Encoded as big-endian, left-padded to 32 bytes
- **Addresses** (`str`): Must be 0x-prefixed, encoded as 20 bytes, left-padded
- **Booleans** (`bool`): `True` = 1, `False` = 0, left-padded to 32 bytes
- **Bytes** (`bytes` or `str`): Right-padded for fixed sizes

### Decoding (ABI to Python)

- **Integers**: Python `int` (handles arbitrary precision)
- **Addresses**: Lowercase hex string with `0x` prefix
- **Booleans**: Python `bool`
- **Bytes**: Python `bytes`
- **Strings**: Python `str` (UTF-8)

## Notes

- All integer types are encoded/decoded to 32-byte ABI words
- Addresses are returned as lowercase hex strings with `0x` prefix
- Empty parameter list returns empty bytes (encoding) or empty list (decoding)
- Function selectors are exactly 4 bytes (Keccak-256 hash of signature, first 4 bytes)
- Gas estimation includes 21000 base transaction cost
