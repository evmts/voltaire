# Bytes Branded Types Benchmarks

This directory contains comprehensive benchmarks comparing Bytes branded type operations across **guil** (@tevm/primitives), **ethers**, and **viem**.

## Overview

The Bytes branded type system provides compile-time type safety for hex-encoded byte arrays with two main types:

- **`Bytes`**: Variable-length hex-encoded byte array (pattern: `^0x[0-9a-f]*$` with even hex chars)
- **`Byte`**: Single byte (pattern: `^0x[0-9a-f]{0,2}$`)

## Benchmark Operations

### 1. Bytes Constructor (`Bytes/`)
Creates Bytes from hex strings or Uint8Array with validation.

**Test cases:**
- Small (1 byte): `0xff`
- Medium (32 bytes): Hash-sized arrays
- Large (1024 bytes): Block data
- From both hex strings and Uint8Array

### 2. Byte Constructor (`Byte/`)
Creates single Byte from hex strings or numbers (0-255).

**Test cases:**
- Boundary values: 0, 127, 128, 255
- Both hex string and numeric input

### 3. bytesToUint8Array (`bytesToUint8Array/`)
Converts hex-encoded Bytes to Uint8Array.

**Test cases:**
- Empty bytes: `0x`
- Small (1 byte), Medium (32 bytes), Large (1024 bytes)

### 4. byteToNumber (`byteToNumber/`)
Converts single Byte to number (0-255).

**Test cases:**
- Boundary values: 0, 127, 128, 255

### 5. bytesLength (`bytesLength/`)
Gets the length in bytes of a Bytes value.

**Test cases:**
- Empty, 1 byte, 32 bytes, 1024 bytes

### 6. concatBytes (`concatBytes/`)
Concatenates multiple Bytes values.

**Test cases:**
- 2 parts, 3 parts, 5 parts
- Mixed sizes (small + large arrays)

### 7. sliceBytes (`sliceBytes/`)
Extracts portion of Bytes with start/end indices.

**Test cases:**
- First 4 bytes, middle range, from position to end
- Both 32-byte and 1024-byte arrays

### 8. Type Guards (`typeGuards/`)
Runtime validation with `isBytes()` and `isByte()`.

**Test cases:**
- Valid inputs: proper hex strings
- Invalid inputs: odd length, invalid chars, wrong types

## Implementation Comparison

### Guil (@tevm/primitives)
```typescript
import { Bytes, Byte, bytesToUint8Array, concatBytes, sliceBytes } from '@tevm/primitives';

// Branded types with compile-time safety
const bytes: Bytes = Bytes('0xff');
const byte: Byte = Byte(255);

// Type-safe operations
const arr = bytesToUint8Array(bytes);
const combined = concatBytes(bytes, Bytes('0xaa'));
const sliced = sliceBytes(bytes, 0, 4);
```

**Advantages:**
- Compile-time type safety with branded types
- Invalid formats caught at compile time
- Clear API with dedicated type guards
- No runtime surprises with type enforcement

### Ethers
```typescript
import { hexlify, getBytes, concat, dataSlice, dataLength } from 'ethers';

// Utility functions without branded types
const hex = hexlify('0xff');
const arr = getBytes(hex);
const combined = concat([hex, '0xaa']);
const sliced = dataSlice(hex, 0, 4);
```

**Advantages:**
- Mature, battle-tested library
- Comprehensive utility functions
- Wide ecosystem support

### Viem
```typescript
import { toHex, hexToBytes, concat, slice, size } from 'viem';

// Performance-focused utilities
const hex = toHex('0xff');
const arr = hexToBytes(hex);
const combined = concat([hex, '0xaa']);
const sliced = slice(hex, 0, 4);
```

**Advantages:**
- High performance focus
- Modern TypeScript patterns
- Tree-shakeable exports

## Running Benchmarks

```bash
# Run all bytes benchmarks
bun vitest comparisons/bytes/*.bench.ts

# Run specific benchmark
bun vitest comparisons/bytes/Bytes.bench.ts
bun vitest comparisons/bytes/concatBytes.bench.ts

# Generate documentation
bun run comparisons/bytes/docs.ts
```

## Benchmark Files Structure

```
bytes/
├── README.md                    # This file
├── docs.ts                      # Documentation generator
│
├── Bytes/                       # Bytes constructor
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── Bytes.bench.ts
│
├── Byte/                        # Byte constructor
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── Byte.bench.ts
│
├── bytesToUint8Array/           # Conversion to Uint8Array
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── bytesToUint8Array.bench.ts
│
├── byteToNumber/                # Byte to number conversion
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── byteToNumber.bench.ts
│
├── bytesLength/                 # Get byte array length
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── bytesLength.bench.ts
│
├── concatBytes/                 # Concatenate multiple Bytes
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── concatBytes.bench.ts
│
├── sliceBytes/                  # Slice Bytes
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── sliceBytes.bench.ts
│
└── typeGuards/                  # isBytes/isByte validation
    ├── guil.ts
    ├── ethers.ts
    └── viem.ts
└── typeGuards.bench.ts
```

## Key Differences

### Type Safety
- **Guil**: Branded types prevent mixing incompatible types at compile time
- **Ethers/Viem**: String types, validation at runtime only

### API Design
- **Guil**: Separate functions for Bytes vs Byte operations
- **Ethers**: General utilities that work with any hex data
- **Viem**: Performance-optimized with modern TypeScript

### Validation
- **Guil**: Validates even-length requirement for Bytes, 0-2 chars for Byte
- **Ethers**: Flexible validation, normalizes various formats
- **Viem**: Strict validation with clear error messages

## Performance Considerations

Expected performance characteristics:

1. **Constructor overhead**: Guil has validation cost, but provides type safety
2. **Conversions**: All three should be comparable for bytesToUint8Array
3. **String operations**: concat/slice are string operations, should be similar
4. **Type guards**: Guil uses regex, ethers/viem may have optimizations

Run the benchmarks to see actual performance on your hardware!

## Implementation Details

### Guil Validation Patterns
```typescript
// Bytes: even number of hex characters
const BYTES_PATTERN = /^0x([0-9a-f]{2})*$/;

// Byte: 0-2 hex characters (0x, 0x0, 0x00)
const BYTE_PATTERN = /^0x[0-9a-f]{0,2}$/;
```

### Ethers Equivalents
- `Bytes()` → `hexlify()`
- `bytesToUint8Array()` → `getBytes()`
- `concatBytes()` → `concat()`
- `sliceBytes()` → `dataSlice()`
- `bytesLength()` → `dataLength()`

### Viem Equivalents
- `Bytes()` → `toHex()`
- `bytesToUint8Array()` → `hexToBytes()`
- `concatBytes()` → `concat()`
- `sliceBytes()` → `slice()`
- `bytesLength()` → `size()`

## Use Cases

**Choose Guil when:**
- Type safety is critical (smart contract development)
- You want compile-time guarantees
- Working with complex byte manipulations

**Choose Ethers when:**
- You need ecosystem compatibility
- Flexibility is more important than strict typing
- Working with existing ethers-based code

**Choose Viem when:**
- Performance is the top priority
- You prefer modern TypeScript patterns
- You want tree-shakeable imports
