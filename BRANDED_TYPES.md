# Voltaire Branded Types Reference

Complete type system for Ethereum primitives with compile-time safety and zero runtime overhead.

## Type Hierarchy

### Unsigned Integers

| Type | Range | Representation | Use Cases |
|------|-------|----------------|-----------|
| `Uint8` | 0 - 255 | `number` | Opcodes, small counters, byte values |
| `Uint16` | 0 - 65,535 | `number` | Port numbers, small indices |
| `Uint32` | 0 - 4,294,967,295 | `number` | Gas limits, timestamps, block numbers |
| `Uint64` | 0 - 2^64-1 | `bigint` | Large counters, nonces |
| `Uint128` | 0 - 2^128-1 | `bigint` | Very large values |
| `Uint256` | 0 - 2^256-1 | `bigint` | EVM values, balances, storage |

### Signed Integers (Two's Complement)

| Type | Range | Representation | Use Cases |
|------|-------|----------------|-----------|
| `Int8` | -128 to 127 | `number` | Small signed values |
| `Int16` | -32,768 to 32,767 | `number` | Signed indices |
| `Int32` | -2^31 to 2^31-1 | `number` | Signed counters |
| `Int128` | -2^127 to 2^127-1 | `bigint` | Large signed values |
| `Int256` | -2^255 to 2^255-1 | `bigint` | EVM SIGNEXTEND, signed arithmetic |

### Bytes Types

| Type | Length | Representation | Use Cases |
|------|--------|----------------|-----------|
| `Bytes` | Variable | `Uint8Array` | Generic byte arrays |
| `Bytes1` - `Bytes8` | 1-8 bytes | `Uint8Array` | Fixed-size data |
| `Bytes16` | 16 bytes | `Uint8Array` | UUIDs, short hashes |
| `Bytes32` | 32 bytes | `Uint8Array` | Hashes, storage slots |
| `Bytes64` | 64 bytes | `Uint8Array` | Signatures, large data |

### Core Types

| Type | Representation | Description |
|------|----------------|-------------|
| `Address` | `Uint8Array` (20 bytes) | EIP-55 checksummed Ethereum addresses |
| `Hash` | `Uint8Array` (32 bytes) | Keccak256 hashes |
| `Hex` | `string` | 0x-prefixed hex strings |
| `Base64` | `string` | Base64-encoded strings |

## Conversion Table

### Between Integer Types

```typescript
// Upcasting (safe)
const u8 = Uint8.from(100);
const u16 = Uint16.fromNumber(Number(u8));
const u32 = Uint32.fromNumber(Number(u16));
const u64 = Uint64.fromBigInt(u32);
const u128 = Uint128.fromBigInt(u64);
const u256 = Uint256.from(u128);

// Downcasting (requires validation)
const back = Uint8.from(Number(u256)); // Throws if > 255
```

### To/From Hex

```typescript
// All integer types support hex conversion
const u8Hex = Uint8.toHex(Uint8.from(42));        // "0x2a"
const u16Hex = Uint16.toHex(Uint16.from(42));      // "0x002a"
const u32Hex = Uint32.toHex(Uint32.from(42));      // "0x0000002a"
const u64Hex = Uint64.toHex(Uint64.from(42n));     // "0x000000000000002a"
const u256Hex = Uint256.toHex(Uint256.from(42n));  // "0x000...2a" (64 chars)
```

### To/From Bytes

```typescript
// Integer to bytes (big-endian)
const bytes = Uint256.toBytes(Uint256.from(1000n));

// Bytes to integer
const value = Uint256.fromBytes(bytes);

// Bytes32 ↔ Hash
const hash = Hash.fromBytes(Bytes32.random());
const bytes32 = Hash.toBytes(hash);
```

### Signed/Unsigned Conversion

```typescript
// Unsigned to signed (interpret bits as two's complement)
const unsigned = Uint256.from(1000n);
const signed = Int256.fromBigInt(unsigned);

// Signed to unsigned (requires positive)
const positive = Int256.from(500n);
const toUnsigned = Uint256.from(positive);

// Negative values throw when converting to unsigned
const negative = Int256.from(-100n);
// Uint256.from(negative); // ❌ Throws
```

## Common Patterns

### Type Guards

```typescript
// All types have isValid/is validators
if (Uint8.isValid(value)) {
  // value is valid Uint8
}

// Zero checks
if (Uint256.isZero(value)) {
  // value is zero
}

// Address validation
if (Address.isValid(addr)) {
  // addr is valid address
}
```

### Arithmetic Operations

```typescript
// All integer types support: plus, minus, times, dividedBy, modulo
const a = Uint256.from(100n);
const b = Uint256.from(50n);

const sum = Uint256.plus(a, b);        // 150n
const diff = Uint256.minus(a, b);      // 50n
const prod = Uint256.times(a, 2n);     // 200n
const quot = Uint256.dividedBy(a, 2n); // 50n
const rem = Uint256.modulo(a, 30n);    // 10n
```

### Bitwise Operations

```typescript
// All integer types support: bitwiseAnd, bitwiseOr, bitwiseXor, bitwiseNot
const a = Uint8.from(0b11110000);
const b = Uint8.from(0b00001111);

const and = Uint8.bitwiseAnd(a, b);  // 0
const or = Uint8.bitwiseOr(a, b);    // 255
const xor = Uint8.bitwiseXor(a, b);  // 255
const not = Uint8.bitwiseNot(a);     // 15

// Shifts
const left = Uint8.shiftLeft(a, 1);   // Overflow wraps
const right = Uint8.shiftRight(a, 1);
```

### Comparison Operations

```typescript
// All types support: equals, lessThan, greaterThan
if (Uint256.equals(a, b)) { /* ... */ }
if (Uint256.lessThan(a, b)) { /* ... */ }
if (Uint256.greaterThan(a, b)) { /* ... */ }

// Min/max
const min = Uint256.minimum(a, b);
const max = Uint256.maximum(a, b);
```

## When to Use Which Type

### Use Uint8/16/32 when:
- Values fit in 32-bit range
- Performance-critical operations
- Interfacing with standard JS numbers
- Small data structures (opcodes, flags)

### Use Uint64/128/256 when:
- EVM compatibility required
- Large values (balances, timestamps in wei)
- Cryptographic operations
- Exact precision needed

### Use Int8/16/32/128/256 when:
- Signed arithmetic required
- EVM SIGNEXTEND operations
- Two's complement representation needed
- Negative values possible

### Use Bytes types when:
- Raw binary data
- Hash digests (Bytes32)
- Signatures (Bytes64)
- Fixed-size data structures

## Architecture

### Branded Types Pattern

```typescript
// Type definition (compile-time only)
export type BrandedUint8 = number & { readonly __tag: "Uint8" };

// Runtime value is plain number
const value: BrandedUint8 = 42; // Actually just 42

// But TypeScript prevents mixing
const u8: BrandedUint8 = Uint8.from(42);
const u16: BrandedUint16 = u8; // ❌ Type error

// Explicit conversion required
const u16 = Uint16.from(Number(u8)); // ✅
```

### Tree-Shaking

All methods are exported as individual functions for optimal tree-shaking:

```typescript
// Import only what you use
import { from, toHex, plus } from '@tevm/primitives/Uint256';

// Or use namespace import
import * as Uint256 from '@tevm/primitives/Uint256';
```

## Implementation Details

### Number vs BigInt

- **Uint8, Uint16, Uint32**: Use `number` (53-bit precision, fits all values)
- **Int8, Int16, Int32**: Use `number` (53-bit precision, fits all values)
- **Uint64+, Int64+**: Use `bigint` (arbitrary precision required)

### Two's Complement

Signed integers use two's complement representation:

```typescript
// Int8: -128 is 0x80, -1 is 0xFF, 0 is 0x00, 127 is 0x7F
Int8.toHex(Int8.from(-1));   // "0xff"
Int8.toHex(Int8.from(-128)); // "0x80"
Int8.toHex(Int8.from(127));  // "0x7f"

// Sign bit is MSB
Int8.isNegative(Int8.from(-1));   // true
Int8.isNegative(Int8.from(127));  // false
```

### Constants

All types export standard constants:

```typescript
Uint8.ZERO    // 0
Uint8.ONE     // 1
Uint8.MIN     // 0
Uint8.MAX     // 255
Uint8.SIZE    // 1 (bytes)
Uint8.BITS    // 8

Int8.ZERO     // 0
Int8.ONE      // 1
Int8.NEG_ONE  // -1
Int8.MIN      // -128
Int8.MAX      // 127
Int8.SIZE     // 1 (bytes)
Int8.BITS     // 8
```

## Testing

All branded types include comprehensive test suites:

- Boundary value testing (min, max, zero, one)
- Overflow/underflow validation
- Conversion correctness
- Arithmetic operation tests
- Bitwise operation tests
- Two's complement validation (signed types)
- Cross-type conversion tests

## Documentation

Each type has comprehensive documentation in `/docs/primitives/`:

- **Unsigned**: `uint8/`, `uint16/`, `uint32/`, `uint64/`, `uint128/`, `uint256/`
- **Signed**: `int8/`, `int16/`, `int32/`, `int128/`, `int256/`
- **Bytes**: `bytes/`, with subpages for fixed-size variants

Navigate via Mintlify docs at https://voltaire.tevm.sh
