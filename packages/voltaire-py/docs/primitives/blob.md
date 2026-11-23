# Blob (EIP-4844)

`Blob` (`voltaire.blob`) wraps a 128 KiB (`131072`-byte) EIP-4844 blob with payload encoding/decoding and blob fee market calculations.

## Constants

| Constant | Value | Meaning |
|----------|-------|---------|
| `BLOB_SIZE` | `131072` | Total bytes per blob (`4096 * 32`) |
| `FIELD_ELEMENTS_PER_BLOB` | `4096` | BLS12-381 scalar field elements per blob |
| `BYTES_PER_FIELD_ELEMENT` | `32` | Bytes per field element |
| `MAX_DATA_PER_BLOB` | `126972` | Maximum data bytes under field-element encoding (`4096 * 31 - 4`) |
| `GAS_PER_BLOB` | `131072` | `2**17` blob gas per blob |
| `TARGET_BLOBS_PER_BLOCK` | `3` | Target blobs per block |

## API Reference

| Method | Signature | Behavior |
|--------|-----------|----------|
| `Blob(data)` | `(data: bytes) -> Blob` | Wraps exact 131072-byte raw blob; raises `InvalidLengthError` otherwise |
| `Blob.from_data` | `(data: bytes) -> Blob` | Encodes up to `MAX_DATA_PER_BLOB` bytes via FFI (`primitives_blob_from_data`) |
| `to_data` | `() -> bytes` | Extracts original payload bytes |
| `to_bytes` / `bytes(blob)` | `() -> bytes` | Returns all 131072 raw blob bytes |
| `is_valid` | `() -> bool` | Checks blob validity via FFI |
| `Blob.calculate_gas` | `(blob_count: int) -> int` | Returns `blob_count * 131072` |
| `Blob.estimate_count` | `(data_size: int) -> int` | Estimates number of blobs needed |
| `Blob.calculate_gas_price` | `(excess_blob_gas: int) -> int` | Computes EIP-4844 blob base fee per gas |
| `Blob.calculate_excess_gas` | `(parent_excess: int, parent_used: int) -> int` | Computes next block's `excess_blob_gas` |

## Example

```python
from voltaire import Blob, BLOB_SIZE

blob = Blob.from_data(b"rollup batch payload")
assert len(blob) == BLOB_SIZE
assert blob.to_data() == b"rollup batch payload"
assert blob.is_valid() is True

count = Blob.estimate_count(200_000)
gas = Blob.calculate_gas(count)
next_excess = Blob.calculate_excess_gas(parent_excess=0, parent_used=gas)
price = Blob.calculate_gas_price(next_excess)
```
