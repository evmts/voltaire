# Uint Module

Complete 256-bit unsigned integer implementation with type safety and arithmetic operations. All types and operations namespaced under `Uint` for intuitive access.

## Overview

The Uint module provides a safe, branded bigint type for 256-bit unsigned integers (Uint256) with:
- Full arithmetic operations (add, subtract, multiply, divide, modulo, power)
- Bitwise operations (AND, OR, XOR, NOT, shifts)
- Comparison operations (equals, less than, greater than, etc.)
- Conversions (hex, bytes, number, string)
- Utilities (bit length, leading zeros, population count)
- Automatic wrapping on overflow for add/subtract/multiply
- Error handling for division by zero and invalid values

## Core Type

```typescript
import { Uint } from './uint.js';

// Branded bigint type (256-bit unsigned integer)
type Uint.Type = bigint & { __brand: Symbol("Uint256") };

// Type alias for convenience
type Uint = Uint.Type;
```

## Constants

```typescript
Uint.MAX   // 2^256 - 1 (largest 256-bit value)
Uint.MIN   // 0
Uint.ZERO  // 0
Uint.ONE   // 1
```

## Construction

### From Various Types

```typescript
// From bigint
const a = Uint.from(100n);

// From number
const b = Uint.from(255);

// From decimal string
const c = Uint.from("1000");

// From hex string
const d = Uint.from("0xff");
const e = Uint.from("0Xff"); // Case insensitive
```

### From Hex String

```typescript
// With 0x prefix
const value = Uint.fromHex.call("0xff");

// Without prefix
const value2 = Uint.fromHex.call("ff");

// Long hex
const value3 = Uint.fromHex.call("0x1234567890abcdef");
```

### From BigInt

```typescript
const value = Uint.fromBigInt.call(12345n);

// Throws on negative or overflow
// Uint.fromBigInt.call(-1n); // Error
// Uint.fromBigInt.call((Uint.MAX as bigint) + 1n); // Error
```

### From Number

```typescript
const value = Uint.fromNumber.call(255);

// Throws on float
// Uint.fromNumber.call(3.14); // Error

// Throws on negative
// Uint.fromNumber.call(-100); // Error
```

### From Bytes (Big-Endian)

```typescript
// Single byte
const bytes1 = new Uint8Array([0xff]);
const value1 = Uint.fromBytes.call(bytes1); // 255

// Multiple bytes
const bytes2 = new Uint8Array([0x01, 0x02, 0x03]);
const value2 = Uint.fromBytes.call(bytes2); // 0x010203

// Full 32 bytes
const bytes32 = new Uint8Array(32);
bytes32[31] = 0xff;
const value3 = Uint.fromBytes.call(bytes32); // 255
```

### Try From (Safe Construction)

```typescript
// Returns value or undefined
const a = Uint.tryFrom(100n); // Uint256
const b = Uint.tryFrom(-1n); // undefined
const c = Uint.tryFrom("invalid"); // undefined

// Useful for validation without try/catch
if (Uint.tryFrom(input)) {
  // Valid input
} else {
  // Invalid input
}
```

## Conversions

### To Hex String

```typescript
const value = Uint.from(255);

// Padded to 64 characters (32 bytes) by default
const hex1 = Uint.toHex.call(value); // "0x00...ff"

// Unpadded (minimal representation)
const hex2 = Uint.toHex.call(value, false); // "0xff"
```

### To BigInt

```typescript
const value = Uint.from(12345);
const bigint = Uint.toBigInt.call(value); // 12345n
```

### To Number

```typescript
const value = Uint.from(1000);
const num = Uint.toNumber.call(value); // 1000

// Throws if exceeds MAX_SAFE_INTEGER
const large = Uint.from(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
// Uint.toNumber.call(large); // Error
```

### To Bytes (Big-Endian, 32 bytes)

```typescript
const value = Uint.from(255);
const bytes = Uint.toBytes.call(value);
// Uint8Array(32) [0, 0, ..., 0, 255]

// Roundtrip
const recovered = Uint.fromBytes.call(bytes);
// recovered === value
```

### To String (Various Radixes)

```typescript
const value = Uint.from(255);

const dec = Uint.toString.call(value, 10); // "255"
const hex = Uint.toString.call(value, 16); // "ff"
const bin = Uint.toString.call(value, 2); // "11111111"
const oct = Uint.toString.call(value, 8); // "377"
```

## Arithmetic Operations

All arithmetic operations wrap on overflow (mod 2^256).

### Addition

```typescript
const a = Uint.from(100);
const b = Uint.from(50);
const sum = Uint.plus.call(a, b); // 150

// Wraps on overflow
const wrapped = Uint.plus.call(Uint.MAX, Uint.ONE); // 0
```

### Subtraction

```typescript
const a = Uint.from(100);
const b = Uint.from(50);
const diff = Uint.minus.call(a, b); // 50

// Wraps on underflow
const wrapped = Uint.minus.call(Uint.ZERO, Uint.ONE); // MAX
```

### Multiplication

```typescript
const a = Uint.from(10);
const b = Uint.from(5);
const product = Uint.times.call(a, b); // 50

// Wraps on overflow
const large = Uint.times.call(Uint.MAX, Uint.from(2)); // MAX - 1 (wrapped)
```

### Division

```typescript
const a = Uint.from(100);
const b = Uint.from(10);
const quotient = Uint.dividedBy.call(a, b); // 10

// Floor division
const floored = Uint.dividedBy.call(Uint.from(100), Uint.from(30)); // 3

// Throws on division by zero
// Uint.dividedBy.call(a, Uint.ZERO); // Error
```

### Modulo

```typescript
const a = Uint.from(100);
const b = Uint.from(30);
const remainder = Uint.modulo.call(a, b); // 10

// Throws on modulo by zero
// Uint.modulo.call(a, Uint.ZERO); // Error
```

### Exponentiation

```typescript
const base = Uint.from(2);
const exp = Uint.from(8);
const result = Uint.toPower.call(base, exp); // 256

// Wraps on overflow
const large = Uint.toPower.call(Uint.from(2), Uint.from(256)); // 0
```

## Bitwise Operations

### AND, OR, XOR

```typescript
const a = Uint.from(0xff);
const b = Uint.from(0x0f);

const and = Uint.bitwiseAnd.call(a, b); // 0x0f
const or = Uint.bitwiseOr.call(a, b); // 0xff
const xor = Uint.bitwiseXor.call(a, b); // 0xf0
```

### NOT

```typescript
const a = Uint.from(0);
const not = Uint.bitwiseNot.call(a); // MAX

// Double NOT is identity
const original = Uint.from(0xff);
const result = Uint.bitwiseNot.call(Uint.bitwiseNot.call(original)); // 0xff
```

### Shifts

```typescript
// Left shift
const a = Uint.from(1);
const left = Uint.shiftLeft.call(a, Uint.from(8)); // 256

// Right shift
const b = Uint.from(256);
const right = Uint.shiftRight.call(b, Uint.from(8)); // 1

// Wraps on overflow
const wrapped = Uint.shiftLeft.call(Uint.from(1), Uint.from(256)); // 0
```

## Comparison Operations

### Equality

```typescript
const a = Uint.from(100);
const b = Uint.from(100);
const c = Uint.from(200);

Uint.equals.call(a, b); // true
Uint.equals.call(a, c); // false

Uint.notEquals.call(a, c); // true
```

### Ordering

```typescript
const a = Uint.from(100);
const b = Uint.from(200);

Uint.lessThan.call(a, b); // true
Uint.lessThanOrEqual.call(a, b); // true
Uint.greaterThan.call(b, a); // true
Uint.greaterThanOrEqual.call(b, a); // true
```

### Zero Check

```typescript
Uint.isZero.call(Uint.ZERO); // true
Uint.isZero.call(Uint.from(100)); // false
```

### Min/Max

```typescript
const a = Uint.from(100);
const b = Uint.from(200);

const min = Uint.minimum.call(a, b); // 100
const max = Uint.maximum.call(a, b); // 200
```

## Utility Operations

### Validation

```typescript
// Type guard
Uint.isValid(100n); // true
Uint.isValid(0n); // true
Uint.isValid(Uint.MAX as bigint); // true

// Invalid cases
Uint.isValid(-1n); // false
Uint.isValid((Uint.MAX as bigint) + 1n); // false
Uint.isValid(100); // false (not bigint)
Uint.isValid("100"); // false (not bigint)
```

### Bit Length

```typescript
// Number of bits required to represent value
Uint.bitLength.call(Uint.ZERO); // 0
Uint.bitLength.call(Uint.ONE); // 1
Uint.bitLength.call(Uint.from(255)); // 8
Uint.bitLength.call(Uint.from(256)); // 9
Uint.bitLength.call(Uint.MAX); // 256
```

### Leading Zeros

```typescript
// Number of leading zero bits
Uint.leadingZeros.call(Uint.ZERO); // 256
Uint.leadingZeros.call(Uint.ONE); // 255
Uint.leadingZeros.call(Uint.from(255)); // 248
Uint.leadingZeros.call(Uint.MAX); // 0
```

### Population Count

```typescript
// Number of set bits (1s)
Uint.popCount.call(Uint.ZERO); // 0
Uint.popCount.call(Uint.ONE); // 1
Uint.popCount.call(Uint.from(0xff)); // 8
Uint.popCount.call(Uint.from(0b10101010)); // 4
Uint.popCount.call(Uint.MAX); // 256
```

## Common Patterns

### Range Validation

```typescript
function validateAmount(value: bigint): Uint {
  const amount = Uint.tryFrom(value);
  if (!amount) {
    throw new Error("Invalid amount: must be 0 <= amount <= 2^256-1");
  }
  return amount;
}
```

### Safe Arithmetic

```typescript
// Check for overflow before operation
function safeAdd(a: Uint, b: Uint): Uint | undefined {
  const sum = (a as bigint) + (b as bigint);
  return Uint.tryFrom(sum);
}

// Use wrapping arithmetic
function wrappingAdd(a: Uint, b: Uint): Uint {
  return Uint.plus.call(a, b);
}
```

### Bit Manipulation

```typescript
// Set bit at position n
function setBit(value: Uint, n: number): Uint {
  const mask = Uint.shiftLeft.call(Uint.ONE, Uint.from(n));
  return Uint.bitwiseOr.call(value, mask);
}

// Clear bit at position n
function clearBit(value: Uint, n: number): Uint {
  const mask = Uint.bitwiseNot.call(
    Uint.shiftLeft.call(Uint.ONE, Uint.from(n))
  );
  return Uint.bitwiseAnd.call(value, mask);
}

// Test bit at position n
function testBit(value: Uint, n: number): boolean {
  const mask = Uint.shiftLeft.call(Uint.ONE, Uint.from(n));
  const result = Uint.bitwiseAnd.call(value, mask);
  return !Uint.isZero.call(result);
}
```

### Format for Display

```typescript
// Display as hex with checksum-like formatting
function formatUint(value: Uint): string {
  const hex = Uint.toHex.call(value, false);
  if (hex.length > 10) {
    // Truncate long values: 0x1234...5678
    return `${hex.slice(0, 6)}...${hex.slice(-4)}`;
  }
  return hex;
}

// Display as decimal with thousands separators
function formatDecimal(value: Uint): string {
  const dec = Uint.toString.call(value, 10);
  return dec.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
```

### Ethereum Wei Conversions

```typescript
// 1 ether = 10^18 wei
const ONE_ETHER = Uint.toPower.call(Uint.from(10), Uint.from(18));

function weiToEther(wei: Uint): string {
  const quotient = Uint.dividedBy.call(wei, ONE_ETHER);
  const remainder = Uint.modulo.call(wei, ONE_ETHER);
  return `${quotient}.${remainder}`;
}

function etherToWei(ether: number): Uint {
  const etherBigInt = BigInt(Math.floor(ether * 1e18));
  return Uint.from(etherBigInt);
}
```

### Percentage Calculations

```typescript
// Calculate percentage with precision
function percentage(value: Uint, percent: number): Uint {
  const percentBig = Uint.from(Math.floor(percent * 100));
  const result = Uint.times.call(value, percentBig);
  return Uint.dividedBy.call(result, Uint.from(10000));
}

// Example: 5% of 1000
const fivePercent = percentage(Uint.from(1000), 5); // 50
```

## Error Handling

```typescript
// All construction methods throw on invalid input
try {
  const value = Uint.from(-1n);
} catch (err) {
  console.error(err.message); // "Uint256 value cannot be negative"
}

try {
  const value = Uint.from((Uint.MAX as bigint) + 1n);
} catch (err) {
  console.error(err.message); // "Uint256 value exceeds maximum"
}

try {
  const value = Uint.from(3.14);
} catch (err) {
  console.error(err.message); // "Uint256 value must be an integer"
}

// Division/modulo throw on zero divisor
try {
  const result = Uint.dividedBy.call(Uint.from(10), Uint.ZERO);
} catch (err) {
  console.error(err.message); // "Division by zero"
}

// toNumber throws on overflow
try {
  const num = Uint.toNumber.call(Uint.MAX);
} catch (err) {
  console.error(err.message); // "Uint256 value exceeds MAX_SAFE_INTEGER"
}

// Use tryFrom for safe construction
const maybeValue = Uint.tryFrom(input);
if (!maybeValue) {
  console.error("Invalid input");
} else {
  // Use maybeValue safely
}
```

## Performance Characteristics

Based on benchmark results (see `uint.bench.ts`):

### Construction
- `from(bigint)`: ~10-30M ops/sec (simple validation)
- `from(number)`: ~5-15M ops/sec (int check + conversion)
- `from(string)`: ~1-5M ops/sec (parsing overhead)
- `fromHex()`: ~1-5M ops/sec (depends on length)
- `fromBytes()`: ~500K-2M ops/sec (depends on length, loop overhead)

### Conversions
- `toBigInt()`: ~500M+ ops/sec (no-op cast)
- `toNumber()`: ~50-100M ops/sec (validation + cast)
- `toHex()` padded: ~1-3M ops/sec (string formatting)
- `toHex()` unpadded: ~3-10M ops/sec (simpler formatting)
- `toBytes()`: ~1-5M ops/sec (loop to build array)
- `toString()`: ~1-10M ops/sec (depends on radix)

### Arithmetic
- `plus/minus/times`: ~10-50M ops/sec (native bigint ops + masking)
- `dividedBy/modulo`: ~10-30M ops/sec (native bigint ops)
- `toPower()`: ~100K-1M ops/sec (iterative, depends on exponent)

### Bitwise
- `bitwiseAnd/Or/Xor/Not`: ~50-100M ops/sec (native bigint ops)
- `shiftLeft/Right`: ~20-50M ops/sec (native bigint ops + masking)

### Comparisons
- `equals/notEquals/lessThan/etc.`: ~50-200M ops/sec (native bigint comparisons)
- `isZero`: ~100-300M ops/sec (simple equality check)
- `minimum/maximum`: ~50-100M ops/sec (comparison + select)

### Utilities
- `isValid()`: ~10-50M ops/sec (type check + range check)
- `bitLength()`: ~1-5M ops/sec (toString + length)
- `leadingZeros()`: ~1-5M ops/sec (calls bitLength)
- `popCount()`: ~500K-2M ops/sec (iterative bit counting)

## Best Practices

### Use Type Guards

```typescript
function processValue(input: unknown): Uint {
  if (!Uint.isValid(input)) {
    throw new TypeError("Expected Uint256");
  }
  // TypeScript now knows input is Uint.Type
  return input;
}
```

### Prefer tryFrom for User Input

```typescript
// Instead of try/catch
function parseUserInput(input: string): Uint | null {
  return Uint.tryFrom(input) ?? null;
}
```

### Be Aware of Wrapping

```typescript
// Wrapping is intentional for overflow
const sum = Uint.plus.call(Uint.MAX, Uint.ONE); // 0 (wrapped)

// If you need to detect overflow
function addWithOverflowCheck(a: Uint, b: Uint): Uint {
  const sum = (a as bigint) + (b as bigint);
  if (sum > (Uint.MAX as bigint)) {
    throw new Error("Overflow detected");
  }
  return sum as Uint;
}
```

### Use Constants

```typescript
// Define commonly used values as constants
const ONE_GWEI = Uint.from(1_000_000_000n);
const ONE_ETHER = Uint.toPower.call(Uint.from(10), Uint.from(18));

// Reuse instead of recreating
const gasPrice = Uint.times.call(ONE_GWEI, Uint.from(20));
```

### Validate at Boundaries

```typescript
// Validate external inputs
function processTransaction(amount: bigint) {
  const validAmount = Uint.tryFrom(amount);
  if (!validAmount) {
    throw new Error("Invalid transaction amount");
  }
  // Proceed with validAmount
}
```

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - EVM 256-bit integers
- [EIP-2035](https://eips.ethereum.org/EIPS/eip-2035) - Stateless client specification
- [Solidity Documentation](https://docs.soliditylang.org/) - uint256 type usage
