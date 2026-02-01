# Blob

EIP-4844 blob handling for data availability.

## Overview

The `Blob` class represents a 128KB (131072 bytes) blob used for rollup data availability in Ethereum. It provides:

- Encoding arbitrary data into blob format (with length prefix)
- Decoding blob data back to original bytes
- Blob size validation
- Gas calculations for blob transactions
- Estimation of blob count for data size

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `BLOB_SIZE` | 131072 | Blob size in bytes (128KB) |
| `FIELD_ELEMENTS_PER_BLOB` | 4096 | Field elements per blob |
| `BYTES_PER_FIELD_ELEMENT` | 32 | Bytes per field element |
| `MAX_DATA_PER_BLOB` | 126972 | Max data bytes per blob |
| `GAS_PER_BLOB` | 131072 | Gas per blob (2^17) |
| `TARGET_BLOBS_PER_BLOCK` | 3 | Target blobs per block |

## API Reference

### Constructor

#### `Blob(data: bytes)`

Create a blob from raw 131072 bytes.

```python
from voltaire import Blob

# From raw blob bytes
raw_blob = bytes(131072)
blob = Blob(raw_blob)
```

**Raises:**
- `InvalidLengthError` - Not exactly 131072 bytes

### Class Methods

#### `Blob.from_data(data: bytes) -> Blob`

Create a blob from arbitrary data with length prefix encoding.

```python
from voltaire import Blob

# Encode text into a blob
data = b"Hello, rollup world!"
blob = Blob.from_data(data)

# Empty data is valid
blob = Blob.from_data(b"")
```

**Raises:**
- `InvalidLengthError` - Data exceeds maximum (126972 bytes)

### Instance Methods

#### `to_data() -> bytes`

Extract original data from blob.

```python
blob = Blob.from_data(b"Hello")
original = blob.to_data()
assert original == b"Hello"
```

**Raises:**
- `InvalidInputError` - Invalid length prefix in blob

#### `to_bytes() -> bytes`

Return raw 131072-byte blob.

```python
blob = Blob.from_data(b"Hello")
raw = blob.to_bytes()
assert len(raw) == 131072
```

#### `is_valid() -> bool`

Check if blob has valid size.

```python
blob = Blob.from_data(b"Hello")
assert blob.is_valid()
```

### Static Methods

#### `Blob.calculate_gas(blob_count: int) -> int`

Calculate total blob gas for N blobs.

```python
from voltaire import Blob

# Single blob
gas = Blob.calculate_gas(1)  # 131072

# Three blobs (target per block)
gas = Blob.calculate_gas(3)  # 393216
```

#### `Blob.estimate_count(data_size: int) -> int`

Estimate number of blobs needed for data size.

```python
from voltaire import Blob

# Small data fits in one blob
count = Blob.estimate_count(1000)  # 1

# Large data needs multiple blobs
count = Blob.estimate_count(200000)  # 2
```

#### `Blob.calculate_gas_price(excess_blob_gas: int) -> int`

Calculate blob gas price from excess blob gas using EIP-4844 formula.

```python
from voltaire import Blob

# Zero excess = minimum price (1 wei)
price = Blob.calculate_gas_price(0)  # 1

# Higher excess = higher price (exponential)
price = Blob.calculate_gas_price(393216)  # ~2 wei
```

#### `Blob.calculate_excess_gas(parent_excess: int, parent_used: int) -> int`

Calculate new excess blob gas for next block.

```python
from voltaire import Blob

# Below target: excess decreases
excess = Blob.calculate_excess_gas(393216, 131072)  # 131072

# Above target: excess increases
excess = Blob.calculate_excess_gas(0, 524288)  # 131072
```

### Python Protocol Support

#### `bytes()` conversion

```python
blob = Blob.from_data(b"Hello")
raw = bytes(blob)  # Same as blob.to_bytes()
assert len(raw) == 131072
```

#### `len()` support

```python
blob = Blob.from_data(b"Hello")
assert len(blob) == 131072
```

#### String representation

```python
blob = Blob.from_data(b"Hello")
print(repr(blob))  # Blob(131072 bytes, data_len=5)
```

## EIP-4844 Blob Format

Blobs use field element encoding where each 32-byte field element has:
- Byte 0: Always 0x00 (BLS field constraint)
- Bytes 1-31: Data bytes

The first 4 data bytes (field 0, bytes 1-4) store a big-endian length prefix.
Remaining data fills bytes 5-31 of field 0, then bytes 1-31 of subsequent fields.

Maximum usable data per blob: 4096 * 31 - 4 = 126972 bytes

## Examples

### Basic Usage

```python
from voltaire import Blob

# Encode data into blob
data = b"Transaction calldata for my rollup"
blob = Blob.from_data(data)

# Decode back
decoded = blob.to_data()
assert decoded == data
```

### Gas Estimation

```python
from voltaire import Blob

# Estimate blobs and gas for data
data_size = 500000  # 500KB
blob_count = Blob.estimate_count(data_size)
total_gas = Blob.calculate_gas(blob_count)

print(f"Data: {data_size} bytes")
print(f"Blobs needed: {blob_count}")
print(f"Blob gas: {total_gas}")
```

### Fee Calculation

```python
from voltaire import Blob

def estimate_blob_fee(data_size: int, excess_blob_gas: int) -> int:
    """Estimate total blob fee for data."""
    blob_count = Blob.estimate_count(data_size)
    gas_per_blob = Blob.calculate_gas(1)
    gas_price = Blob.calculate_gas_price(excess_blob_gas)
    return blob_count * gas_per_blob * gas_price
```

### Validating Blobs

```python
from voltaire import Blob, InvalidLengthError

def validate_blob_data(raw_bytes: bytes) -> bytes | None:
    """Validate and extract data from raw blob."""
    try:
        blob = Blob(raw_bytes)
        return blob.to_data()
    except InvalidLengthError:
        print("Invalid blob size")
        return None
```
