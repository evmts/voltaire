# Data Padding Utilities Comparison

Comprehensive benchmarks comparing data padding and trimming operations across three Ethereum libraries: guil (manual implementation), ethers, and viem.

## Operations Benchmarked

### 1. padLeft
Pad hex/bytes on the left to 32 bytes (zero-pad the beginning).

**Test Cases:**
- Empty string (`0x`)
- Short value (`0x01`)
- Already 32-byte value
- Value with existing leading zeros

**Implementations:**
- **ethers**: `zeroPadValue(value, 32)`
- **viem**: `pad(value, { size: 32 })`
- **guil**: Manual string concatenation with leading zeros

### 2. padRight
Pad hex/bytes on the right to 32 bytes (zero-pad the end).

**Test Cases:**
- Empty string (`0x`)
- Short value (`0x01`)
- Already 32-byte value
- Value with existing trailing zeros

**Implementations:**
- **ethers**: `zeroPadBytes(getBytes(value), 32)`
- **viem**: `pad(value, { dir: 'right', size: 32 })`
- **guil**: Manual string concatenation with trailing zeros

### 3. trim
Remove leading zeros from hex string.

**Test Cases:**
- Empty string
- No leading zeros
- Value with leading zeros (`0x000000abcd`)
- All zeros (`0x000000`)
- 32-byte value with leading zeros

**Implementations:**
- **ethers**: `stripZerosLeft(value)`
- **viem**: `trim(value)` or `trim(value, { dir: 'left' })`
- **guil**: Regex-based leading zero removal

### 4. trimRight
Remove trailing zeros from hex string.

**Test Cases:**
- Empty string
- No trailing zeros
- Value with trailing zeros (`0xabcd000000`)
- All zeros (`0x000000`)
- 32-byte value with trailing zeros

**Implementations:**
- **ethers**: Manual implementation (no built-in)
- **viem**: `trim(value, { dir: 'right' })`
- **guil**: Regex-based trailing zero removal

### 5. size
Get the byte size of a hex string or byte array.

**Test Cases:**
- Empty string
- Short value (1 byte)
- Medium value (2 bytes)
- 32-byte value
- Long value (128 bytes)

**Implementations:**
- **ethers**: `dataLength(value)`
- **viem**: `size(value)`
- **guil**: Calculate from hex string length

## Running Benchmarks

```bash
# Run all data-padding benchmarks
npm run bench -- comparisons/data-padding

# Run specific benchmark
npm run bench -- comparisons/data-padding/padLeft.bench.ts
npm run bench -- comparisons/data-padding/padRight.bench.ts
npm run bench -- comparisons/data-padding/trim.bench.ts
npm run bench -- comparisons/data-padding/trimRight.bench.ts
npm run bench -- comparisons/data-padding/size.bench.ts
```

## Implementation Notes

### guil (Manual Implementation)
- Uses direct string manipulation
- No external dependencies for basic operations
- Regex-based for trim operations
- Simple arithmetic for size calculation

### ethers
- Comprehensive utility functions for most operations
- `zeroPadValue` for left padding
- `zeroPadBytes` for right padding (requires conversion to bytes first)
- `stripZerosLeft` for trimming leading zeros
- No built-in `trimRight` (requires manual implementation)
- `dataLength` for size calculation

### viem
- Unified `pad()` function with directional options
- Unified `trim()` function with directional options
- Consistent API with `dir` parameter
- Direct `size()` function for byte length

## Key Differences

1. **API Design**: Viem uses a unified API with direction parameters, while ethers has separate functions for different operations.

2. **Type Safety**: All libraries support both hex strings and Uint8Array, but with different conversion requirements.

3. **Edge Cases**: Different handling of empty strings and all-zero values.

4. **Performance**: Manual implementations (guil) may have performance advantages for simple operations, while library implementations include additional validation and type checking.

## Use Cases

### padLeft
- Preparing data for EVM storage slots
- Creating properly sized function selectors
- Normalizing numeric values to 32 bytes

### padRight
- Padding strings for ABI encoding
- Preparing dynamic byte arrays
- Creating fixed-size buffers

### trim
- Normalizing numeric representations
- Removing redundant leading zeros
- Preparing compact data representations

### trimRight
- Removing padding from decoded strings
- Cleaning up right-padded data
- Normalizing byte array endings

### size
- Validating data length
- Calculating gas costs
- Ensuring proper data sizing for operations

## Related Comparisons

- [Bytes Operations](../bytes/) - Core byte manipulation utilities
- [Hex Operations](../hex/) - Hex string encoding/decoding
- [ABI Encoding](../abi/) - ABI encoding with padding

## References

- [Ethers.js Documentation](https://docs.ethers.org/)
- [Viem Documentation](https://viem.sh/)
- [EVM Data Encoding](https://ethereum.org/en/developers/docs/data-structures-and-encoding/)
