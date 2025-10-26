# RLP Encoding/Decoding Benchmarks

Comprehensive performance comparison of RLP (Recursive Length Prefix) encoding and decoding functions across three popular Ethereum libraries: **guil** (@tevm/primitives), **ethers**, and **viem**.

## Overview

RLP is Ethereum's primary serialization format for encoding arbitrarily nested arrays and binary data. These benchmarks test the performance characteristics of various RLP operations across different implementations.

## Benchmark Categories

### 1. **encode** - Basic RLP Encoding
Tests encoding of various data types:
- Hex strings (`'0x1234'`)
- Byte arrays (`Uint8Array([1, 2, 3, 4, 5])`)
- Numbers (`42`)

**Files:**
- `/Users/williamcory/primitives/comparisons/rlp/encode/`

### 2. **decode** - Basic RLP Decoding
Tests decoding of RLP-encoded byte arrays:
- Short strings
- Medium byte arrays
- Single bytes

**Files:**
- `/Users/williamcory/primitives/comparisons/rlp/decode/`

### 3. **encodeList** - Array Encoding
Tests encoding of arrays and nested structures:
- Mixed-type arrays
- Numeric arrays
- Nested arrays with empty lists

**Files:**
- `/Users/williamcory/primitives/comparisons/rlp/encodeList/`

### 4. **encodeUint** - Unsigned Integer Encoding
Tests encoding of various integer sizes:
- Zero values
- Small integers (< 128)
- Medium integers (1024)
- Large 32-bit values
- BigInt values (> 64 bits)

**Files:**
- `/Users/williamcory/primitives/comparisons/rlp/encodeUint/`

### 5. **toHex** - Encode to Hex String
Tests encoding data to RLP format and returning as hex string:
- Strings, bytes, numbers, and arrays
- Direct hex output without intermediate steps

**Files:**
- `/Users/williamcory/primitives/comparisons/rlp/toHex/`

### 6. **fromHex** - Decode from Hex String
Tests decoding RLP-encoded hex strings:
- Simple values
- Lists
- Various data structures

**Files:**
- `/Users/williamcory/primitives/comparisons/rlp/fromHex/`

## Library Implementations

### Guil (@tevm/primitives)
- **API:** `encode()`, `decode()`, `encodeList()`, `encodeUint()`, `toHex()`, `fromHex()`
- **Input Format:** Flexible - accepts strings, numbers, bigints, Uint8Array, and arrays
- **Output Format:** Uint8Array for encoding functions, hex string with `0x` prefix for toHex

### Ethers
- **API:** `encodeRlp()`, `decodeRlp()`
- **Input Format:** Hex strings (with `0x` prefix) or Uint8Array
- **Output Format:** Hex string with `0x` prefix

### Viem
- **API:** `toRlp()`, `fromRlp()`
- **Input Format:** Hex strings (with `0x` prefix) or Uint8Array
- **Output Format:** Hex string by default, can specify `'bytes'` for Uint8Array

## Key Differences

### Data Type Handling

**Guil:**
```typescript
encode(42)                    // Direct number support
encode('0x1234')              // Hex strings
encode(new Uint8Array([1,2])) // Byte arrays
encodeUint(123456789n)        // BigInt support
```

**Ethers:**
```typescript
encodeRlp('0x2a')             // Requires hex string
encodeRlp('0x1234')           // Hex strings
encodeRlp(new Uint8Array([1,2])) // Byte arrays
encodeRlp(toBeHex(123456789n)) // BigInt needs conversion
```

**Viem:**
```typescript
toRlp('0x2a')                 // Requires hex string
toRlp('0x1234')               // Hex strings
toRlp(new Uint8Array([1,2]))  // Byte arrays
toRlp(toHex(123456789n))      // BigInt needs conversion
```

### Array/List Handling

**Guil:** Has dedicated `encodeList()` function for arrays
```typescript
encodeList(['0x1234', 42, new Uint8Array([1,2,3])])
```

**Ethers & Viem:** Handle arrays automatically in main encode function
```typescript
encodeRlp(['0x1234', '0x2a', new Uint8Array([1,2,3])])
toRlp(['0x1234', '0x2a', new Uint8Array([1,2,3])])
```

## Running Benchmarks

### Run Individual Benchmarks
```bash
# Run specific benchmark
npm run bench -- comparisons/rlp/encode/encode.bench.ts
npm run bench -- comparisons/rlp/decode/decode.bench.ts
npm run bench -- comparisons/rlp/encodeList/encodeList.bench.ts
npm run bench -- comparisons/rlp/encodeUint/encodeUint.bench.ts
npm run bench -- comparisons/rlp/toHex/toHex.bench.ts
npm run bench -- comparisons/rlp/fromHex/fromHex.bench.ts
```

### Run All RLP Benchmarks
```bash
npm run bench -- comparisons/rlp
```

### Generate Documentation
```bash
tsx comparisons/rlp/docs.ts
```

## Test Data

All benchmarks use consistent test data across implementations:

**Basic Types:**
- String: `'0x1234'`
- Bytes: `Uint8Array([1, 2, 3, 4, 5])`
- Number: `42` (guil) or `'0x2a'` (ethers/viem)

**Arrays:**
- Mixed: `['0x1234', new Uint8Array([1,2,3]), 42]`
- Numeric: `[1, 2, 3, 4, 5]`
- Nested: `['0x42', ['0x43'], '0x12345678', []]`

**Integers:**
- Zero: `0`
- Small: `127`
- Medium: `1024`
- Large: `0xffffffffff`
- BigInt: `123456789012345678901234567890n`

**Encoded Data (for decode tests):**
- `0x821234` - encoded string
- `0x850102030405` - encoded bytes
- `0x2a` - single byte
- `0xc67f7f838081e8` - encoded list

## Performance Considerations

### Guil Advantages:
- Native number/bigint support (no conversion needed)
- Flexible input types
- TypeScript-first implementation

### Ethers Considerations:
- Requires hex string conversion for numbers
- Well-tested and widely used
- Part of comprehensive ethereum library

### Viem Considerations:
- Modern TypeScript implementation
- Tree-shakeable utilities
- Optimized for bundle size

## Implementation Notes

Each implementation file exports a `main()` function that performs the benchmark operations. This allows consistent benchmarking across all libraries using the same test runner (vitest).

The benchmarks focus on real-world usage patterns, testing the full pipeline from input to output rather than isolated internal functions.

## Contributing

When adding new benchmarks:
1. Create a new directory under `comparisons/rlp/[function-name]/`
2. Implement `guil.ts`, `ethers.ts`, and `viem.ts` with `main()` exports
3. Create `[function-name].bench.ts` following the pattern
4. Update `docs.ts` to include the new benchmark
5. Update this README with the new benchmark description

## References

- [Ethereum Yellow Paper - RLP Specification](https://ethereum.github.io/yellowpaper/paper.pdf)
- [Ethers Documentation - RLP](https://docs.ethers.org/v6/api/utils/rlp/)
- [Viem Documentation - toRlp](https://viem.sh/docs/utilities/toRlp.html)
- [Viem Documentation - fromRlp](https://viem.sh/docs/utilities/fromRlp.html)
