# Uint Utilities

Type-safe branded types for Uint64 and Uint256 unsigned integers with comprehensive validation and operations.

## Features

- **Type Safety**: Branded types prevent mixing regular strings with uint values
- **Range Validation**: All operations validate bounds (0 to 2^64-1 for Uint64, 0 to 2^256-1 for Uint256)
- **Pure TypeScript**: No FFI dependencies, leverages native BigInt
- **Tree-Shakable**: Import only what you need
- **Comprehensive Operations**: Arithmetic, comparison, bitwise, and conversion utilities
- **Error Handling**: Clear error messages for invalid operations

## Installation

```typescript
import * as Uint64 from './primitives/uint-utils/uint64';
import * as Uint256 from './primitives/uint-utils/uint256';

// Or import everything
import { Uint64, Uint256 } from './primitives/uint-utils';
```

## Uint64 API

### Types
- `Uint64`: Branded type `\`0x\${string}\` & { __brand: 'Uint64' }`

### Constants
- `UINT64_ZERO`: `0x0`
- `UINT64_ONE`: `0x1`
- `UINT64_MAX`: `0xffffffffffffffff` (2^64-1)

### Conversion Functions

#### `fromBigInt(value: bigint): Uint64`
Convert bigint to Uint64 with range validation.
```typescript
const value = Uint64.fromBigInt(1000n); // "0x3e8"
```

#### `toBigInt(value: Uint64): bigint`
Convert Uint64 to bigint.
```typescript
const bigInt = Uint64.toBigInt('0x3e8' as Uint64); // 1000n
```

#### `fromNumber(value: number): Uint64`
Convert number to Uint64 (must be safe integer).
```typescript
const value = Uint64.fromNumber(42); // "0x2a"
```

#### `toNumber(value: Uint64): number`
Convert Uint64 to number (throws if > MAX_SAFE_INTEGER).
```typescript
const num = Uint64.toNumber('0x2a' as Uint64); // 42
```

### Arithmetic Operations

- `add(a: Uint64, b: Uint64): Uint64` - Addition with overflow check
- `sub(a: Uint64, b: Uint64): Uint64` - Subtraction with underflow check
- `mul(a: Uint64, b: Uint64): Uint64` - Multiplication with overflow check
- `div(a: Uint64, b: Uint64): Uint64` - Integer division
- `mod(a: Uint64, b: Uint64): Uint64` - Modulo operation

```typescript
const a = Uint64.fromBigInt(100n);
const b = Uint64.fromBigInt(50n);
const sum = Uint64.add(a, b); // "0x96" (150)
```

### Comparison Operations

- `compare(a: Uint64, b: Uint64): -1 | 0 | 1` - Three-way comparison
- `eq(a: Uint64, b: Uint64): boolean` - Equality
- `lt(a: Uint64, b: Uint64): boolean` - Less than
- `gt(a: Uint64, b: Uint64): boolean` - Greater than
- `lte(a: Uint64, b: Uint64): boolean` - Less than or equal
- `gte(a: Uint64, b: Uint64): boolean` - Greater than or equal
- `min(a: Uint64, b: Uint64): Uint64` - Minimum value
- `max(a: Uint64, b: Uint64): Uint64` - Maximum value

```typescript
const a = Uint64.fromBigInt(100n);
const b = Uint64.fromBigInt(200n);
Uint64.lt(a, b); // true
```

### Type Guards

#### `isUint64(value: unknown): value is Uint64`
Check if value is a valid Uint64.
```typescript
Uint64.isUint64('0x42'); // true
Uint64.isUint64('invalid'); // false
```

## Uint256 API

### Types
- `Uint256`: Branded type `\`0x\${string}\` & { __brand: 'Uint256' }`

### Constants
- `ZERO`: `0x0`
- `ONE`: `0x1`
- `MAX_UINT256`: `0xfff...fff` (64 f's, 2^256-1)

### Conversion Functions

#### `fromBigInt(value: bigint): Uint256`
Convert bigint to Uint256 with range validation.
```typescript
const value = Uint256.fromBigInt(1000000n);
```

#### `toBigInt(value: Uint256): bigint`
Convert Uint256 to bigint.
```typescript
const bigInt = Uint256.toBigInt(value);
```

#### `fromHex(hex: string): Uint256`
Convert hex string to Uint256 (accepts with or without 0x prefix).
```typescript
const value = Uint256.fromHex('0xdeadbeef');
const value2 = Uint256.fromHex('deadbeef'); // Also works
```

#### `toHex(value: Uint256): string`
Convert Uint256 to hex string (returns as-is since already hex).
```typescript
const hex = Uint256.toHex(value);
```

#### `fromBytes(bytes: Uint8Array): Uint256`
Convert bytes to Uint256 (big-endian, up to 32 bytes).
```typescript
const bytes = new Uint8Array([0xff, 0xee, 0xdd, 0xcc]);
const value = Uint256.fromBytes(bytes);
```

#### `toBytes(value: Uint256): Uint8Array`
Convert Uint256 to 32-byte array (big-endian, zero-padded).
```typescript
const bytes = Uint256.toBytes(value); // Always 32 bytes
```

### Arithmetic Operations

- `add(a: Uint256, b: Uint256): Uint256` - Addition with overflow check
- `sub(a: Uint256, b: Uint256): Uint256` - Subtraction with underflow check
- `mul(a: Uint256, b: Uint256): Uint256` - Multiplication with overflow check
- `div(a: Uint256, b: Uint256): Uint256` - Integer division
- `mod(a: Uint256, b: Uint256): Uint256` - Modulo operation
- `pow(base: Uint256, exponent: Uint256): Uint256` - Power operation

```typescript
const a = Uint256.fromBigInt(1000n);
const b = Uint256.fromBigInt(50n);
const sum = Uint256.add(a, b);
const power = Uint256.pow(Uint256.fromBigInt(2n), Uint256.fromBigInt(10n)); // 1024
```

### Comparison Operations

Same as Uint64: `compare`, `eq`, `lt`, `gt`, `lte`, `gte`, `min`, `max`

### Bitwise Operations

- `and(a: Uint256, b: Uint256): Uint256` - Bitwise AND
- `or(a: Uint256, b: Uint256): Uint256` - Bitwise OR
- `xor(a: Uint256, b: Uint256): Uint256` - Bitwise XOR
- `not(value: Uint256): Uint256` - Bitwise NOT
- `shl(value: Uint256, bits: number): Uint256` - Left shift (0-255 bits)
- `shr(value: Uint256, bits: number): Uint256` - Right shift (0-255 bits)

```typescript
const a = Uint256.fromBigInt(0b1100n);
const b = Uint256.fromBigInt(0b1010n);
const result = Uint256.and(a, b); // 0b1000
```

### Type Guards

#### `isUint256(value: unknown): value is Uint256`
Check if value is a valid Uint256.
```typescript
Uint256.isUint256('0xdeadbeef'); // true
Uint256.isUint256('invalid'); // false
```

## Ethereum Use Cases

### Gas Calculations
```typescript
const gasPrice = Uint256.fromBigInt(50_000_000_000n); // 50 gwei
const gasLimit = Uint64.fromBigInt(21000n);
const maxFee = Uint256.mul(gasPrice, Uint256.fromBigInt(Uint64.toBigInt(gasLimit)));
```

### Token Amounts
```typescript
const oneEther = Uint256.fromBigInt(10n ** 18n);
const amount = Uint256.mul(Uint256.fromBigInt(5n), oneEther); // 5 ETH
```

### Block Numbers
```typescript
const currentBlock = Uint64.fromBigInt(18_000_000n);
const targetBlock = Uint64.fromBigInt(18_500_000n);
const remaining = Uint64.sub(targetBlock, currentBlock);
```

### Balance Operations
```typescript
const balance = Uint256.fromHex('0x1bc16d674ec80000'); // 2 ETH in wei
const transfer = Uint256.fromBigInt(1_000_000_000_000_000_000n); // 1 ETH
const remaining = Uint256.sub(balance, transfer);
```

## Error Handling

All operations validate inputs and throw descriptive errors:

```typescript
// Range validation
Uint64.fromBigInt(-1n); // Error: Value -1 is below minimum Uint64 (0)
Uint64.fromBigInt(2n ** 64n); // Error: Value exceeds maximum Uint64 (2^64-1)

// Arithmetic errors
Uint256.div(a, Uint256.ZERO); // Error: Division by zero
Uint256.add(MAX_UINT256, ONE); // Error: Addition overflow

// Conversion errors
Uint64.fromNumber(1.5); // Error: Value 1.5 is not a safe integer
Uint64.toNumber('0xffffffffffffffff' as Uint64); // Error: exceeds MAX_SAFE_INTEGER

// Invalid input
Uint256.fromHex('0xGG'); // Error: Invalid hex format
Uint256.fromBytes(new Uint8Array(33)); // Error: Byte array too large
```

## Integration with Existing U256 Type

The existing `src/types/index.ts` defines `U256` as an interface with a `bytes` field for FFI interop with the C API:

```typescript
// Existing U256 (C API compatible)
export interface U256 {
  bytes: Uint8Array;
}

// New Uint256 (TypeScript branded type)
export type Uint256 = `0x${string}` & { __brand: 'Uint256' };
```

To convert between them:

```typescript
import { U256, createU256 } from './types';
import * as Uint256Util from './primitives/uint-utils/uint256';

// Uint256 -> U256
function toU256(value: Uint256Util.Uint256): U256 {
  return createU256(Uint256Util.toBytes(value));
}

// U256 -> Uint256
function fromU256(value: U256): Uint256Util.Uint256 {
  return Uint256Util.fromBytes(value.bytes);
}
```

The two types serve different purposes:
- **U256**: For FFI/C API interop, matches C struct layout
- **Uint256**: For pure TypeScript operations, more ergonomic API

## Design Decisions

### Why Pure TypeScript?

1. **Native BigInt Support**: JavaScript/TypeScript BigInt handles arbitrary precision natively
2. **No FFI Overhead**: Direct operations without crossing language boundaries
3. **Tree-Shakable**: Smaller bundle sizes, import only what you need
4. **Type Safety**: Branded types prevent mixing regular strings with uint values
5. **Simple Hex/Bytes Conversion**: Straightforward with native APIs

### Why Branded Types?

Branded types provide compile-time type safety:

```typescript
const regularString: string = "0x42";
const uint64: Uint64 = "0x42"; // Type error! Must use fromBigInt/fromNumber

// This prevents bugs:
function processGasLimit(limit: Uint64) { ... }
processGasLimit("0x1000"); // Type error! Must create proper Uint64
```

## Performance

All operations are O(1) or O(n) where n is the number of bits:
- Arithmetic: Native BigInt operations
- Conversions: Single-pass algorithms
- Comparisons: Direct BigInt comparison
- Bitwise: Native BigInt bitwise operations

For high-performance scenarios requiring millions of operations, consider using the Zig implementation via FFI.

## Testing

Comprehensive test coverage includes:
- **Uint64**: 73 tests with 79 assertions
- **Uint256**: 80 tests with 93 assertions

Run tests:
```bash
bun test src/primitives/uint-utils/uint64.test.ts
bun test src/primitives/uint-utils/uint256.test.ts
```

## Examples

See `example.ts` for comprehensive usage examples:
```bash
bun run src/primitives/uint-utils/example.ts
```
