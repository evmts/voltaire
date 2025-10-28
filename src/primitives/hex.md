# Hex

Complete hexadecimal encoding/decoding with type safety for Ethereum data.

## Overview

Hex strings are the fundamental data format in Ethereum, used for representing addresses, hashes, transaction data, and all binary data. This implementation provides type-safe hex operations with compile-time size checking and comprehensive conversion utilities.

**Key Benefits:**
- Type-safe sized hex strings (e.g., `Hex.Sized<32>` for hashes)
- Comprehensive conversion (bytes, numbers, bigints, strings, booleans)
- Validation and error handling
- Manipulation operations (concat, slice, pad, trim)
- Zero dependencies

**When to Use:**
- Converting between hex and other formats
- Validating hex string inputs
- Manipulating hex data (padding, slicing, concatenation)
- Working with Ethereum transaction data
- Encoding/decoding binary data

## Quick Start

```typescript
import { Hex } from '@tevm/primitives';

// Basic hex strings
const hex: Hex = '0x1234';
const sized: Hex.Sized<32> = '0x' + '00'.repeat(32) as Hex.Sized<32>;

// Conversions
const bytes = Hex.toBytes.call(hex);
const number = Hex.toNumber.call('0xff' as Hex);
const bigint = Hex.toBigInt.call('0x123456789abcdef' as Hex);

// Validation
if (Hex.isHex('0x1234')) {
  const validated = Hex.validate.call('0x1234');
}

// Manipulation
const concatenated = Hex.concat('0x12' as Hex, '0x34' as Hex);
const padded = Hex.pad.call('0x1234' as Hex, 4);
const trimmed = Hex.trim.call('0x00001234' as Hex);
```

## Core Types

### Hex (Hex.Unsized)

Basic hex string with 0x prefix, no size constraint.

```typescript
type Hex = `0x${string}`;
```

```typescript
const hex: Hex = '0x1234';
const hex2: Hex = '0xabcdef0123456789';
```

### Hex.Sized<N>

Hex string with specific byte size constraint.

```typescript
type Sized<TSize extends number> = `0x${string}` & {
  readonly size: TSize;
};
```

```typescript
// 20 bytes = Address
const address: Hex.Sized<20> = '0x' + '00'.repeat(20) as Hex.Sized<20>;

// 32 bytes = Hash
const hash: Hex.Sized<32> = '0x' + '00'.repeat(32) as Hex.Sized<32>;

// 4 bytes = Function selector
const selector: Hex.Sized<4> = '0x12345678' as Hex.Sized<4>;
```

### Hex.Bytes<N>

Alias for `Hex.Sized<N>`, more descriptive for byte arrays.

```typescript
type Bytes<N extends number> = Sized<N>;
```

```typescript
const bytes32: Hex.Bytes<32> = hash;
const bytes4: Hex.Bytes<4> = selector;
```

## Error Types

### InvalidFormatError

Thrown when hex string is missing 0x prefix.

```typescript
class InvalidFormatError extends Error
```

```typescript
try {
  Hex.validate.call('1234'); // Missing 0x
} catch (e) {
  if (e instanceof Hex.InvalidFormatError) {
    console.error('Missing 0x prefix');
  }
}
```

### InvalidCharacterError

Thrown when hex contains non-hexadecimal characters.

```typescript
class InvalidCharacterError extends Error
```

```typescript
try {
  Hex.validate.call('0xZZZZ'); // Invalid chars
} catch (e) {
  if (e instanceof Hex.InvalidCharacterError) {
    console.error('Invalid hex characters');
  }
}
```

### InvalidLengthError

Thrown when hex size doesn't match expected size.

```typescript
class InvalidLengthError extends Error
```

```typescript
const hex: Hex = '0x1234';
try {
  Hex.assertSize.call(hex, 4); // Expected 4 bytes, got 2
} catch (e) {
  if (e instanceof Hex.InvalidLengthError) {
    console.error('Size mismatch');
  }
}
```

### OddLengthError

Thrown when hex has odd number of hex digits (can't convert to bytes).

```typescript
class OddLengthError extends Error
```

```typescript
try {
  Hex.toBytes.call('0x123' as Hex); // Odd length
} catch (e) {
  if (e instanceof Hex.OddLengthError) {
    console.error('Hex must have even number of digits');
  }
}
```

## Type Guards

### isHex

Check if string is valid hex format.

```typescript
Hex.isHex(value: string): value is Hex
```

```typescript
const str = '0x1234';
if (Hex.isHex(str)) {
  // TypeScript knows str is Hex
  const bytes = Hex.toBytes.call(str);
}

Hex.isHex('0x1234');  // true
Hex.isHex('1234');    // false (no 0x)
Hex.isHex('0xZZZZ');  // false (invalid chars)
```

### isSized

Check if hex has specific byte size.

```typescript
Hex.isSized.call(hex: Hex, size: number): hex is Hex.Sized<size>
```

```typescript
const hex: Hex = '0x1234';

if (Hex.isSized.call(hex, 2)) {
  // TypeScript knows hex is Hex.Sized<2>
  console.log('Exactly 2 bytes');
}

Hex.isSized.call('0x1234' as Hex, 2);  // true
Hex.isSized.call('0x1234' as Hex, 4);  // false
```

## Validation

### validate

Validate and return hex string (throws on invalid).

```typescript
Hex.validate.call(str: string): Hex
```

**Validates:**
- Has 0x prefix
- Contains only valid hex characters (0-9, a-f, A-F)

```typescript
const str = '0x1234';
const hex = Hex.validate.call(str); // Returns validated Hex

// Invalid examples
Hex.validate.call('1234');    // Throws InvalidFormatError
Hex.validate.call('0xZZZZ');  // Throws InvalidCharacterError
```

**Throws:**
- `InvalidFormatError` - Missing 0x prefix
- `InvalidCharacterError` - Invalid hex characters

### assertSize

Assert hex has specific size (throws on mismatch).

```typescript
Hex.assertSize.call(hex: Hex, size: number): Hex.Sized<size>
```

```typescript
const hex: Hex = '0x1234';
const sized = Hex.assertSize.call(hex, 2); // Returns Hex.Sized<2>

// Invalid
Hex.assertSize.call(hex, 4); // Throws InvalidLengthError
```

**Throws:** `InvalidLengthError` if size doesn't match

## Conversion Operations

### fromBytes / toBytes

Convert between hex and byte arrays.

```typescript
Hex.fromBytes(bytes: Uint8Array): Hex
Hex.toBytes.call(hex: Hex): Uint8Array
```

```typescript
// Bytes to hex
const bytes = new Uint8Array([0x12, 0x34, 0xab, 0xcd]);
const hex = Hex.fromBytes(bytes); // '0x1234abcd'

// Hex to bytes
const hex2: Hex = '0x1234abcd';
const bytes2 = Hex.toBytes.call(hex2); // Uint8Array([0x12, 0x34, 0xab, 0xcd])
```

**Throws:**
- `InvalidFormatError` - Missing 0x prefix
- `OddLengthError` - Odd number of hex digits
- `InvalidCharacterError` - Invalid hex characters

### fromNumber / toNumber

Convert between hex and numbers.

```typescript
Hex.fromNumber(value: number, size?: number): Hex
Hex.toNumber.call(hex: Hex): number
```

```typescript
// Number to hex
Hex.fromNumber(255);      // '0xff'
Hex.fromNumber(255, 2);   // '0x00ff' (2 bytes)
Hex.fromNumber(0x1234);   // '0x1234'

// Hex to number
const hex: Hex = '0xff';
const num = Hex.toNumber.call(hex); // 255
```

**Note:** `toNumber()` throws `RangeError` if value exceeds `MAX_SAFE_INTEGER`

### fromBigInt / toBigInt

Convert between hex and bigints.

```typescript
Hex.fromBigInt(value: bigint, size?: number): Hex
Hex.toBigInt.call(hex: Hex): bigint
```

```typescript
// BigInt to hex
Hex.fromBigInt(255n);            // '0xff'
Hex.fromBigInt(255n, 32);        // '0x00...00ff' (32 bytes)
Hex.fromBigInt(0x123456789n);    // '0x123456789'

// Hex to bigint
const hex: Hex = '0x123456789';
const big = Hex.toBigInt.call(hex); // 0x123456789n
```

### fromString / toString

Convert between hex and UTF-8 strings.

```typescript
Hex.fromString(str: string): Hex
Hex.toString.call(hex: Hex): string
```

```typescript
// String to hex
Hex.fromString('hello'); // '0x68656c6c6f'

// Hex to string
const hex: Hex = '0x68656c6c6f';
const str = Hex.toString.call(hex); // 'hello'
```

**Throws:**
- `InvalidFormatError` - Missing 0x prefix
- `OddLengthError` - Odd number of hex digits
- `InvalidCharacterError` - Invalid hex characters

### fromBoolean / toBoolean

Convert between hex and booleans.

```typescript
Hex.fromBoolean(value: boolean): Hex.Sized<1>
Hex.toBoolean.call(hex: Hex): boolean
```

```typescript
// Boolean to hex
Hex.fromBoolean(true);   // '0x01'
Hex.fromBoolean(false);  // '0x00'

// Hex to boolean (non-zero = true)
const hex1: Hex = '0x01';
Hex.toBoolean.call(hex1); // true

const hex2: Hex = '0x00';
Hex.toBoolean.call(hex2); // false

const hex3: Hex = '0xff';
Hex.toBoolean.call(hex3); // true
```

## Size Operations

### size

Get byte size of hex string.

```typescript
Hex.size.call(hex: Hex): number
```

```typescript
const hex: Hex = '0x1234';
Hex.size.call(hex); // 2

const hash: Hex = '0x' + '00'.repeat(32);
Hex.size.call(hash); // 32
```

## Manipulation Operations

### concat

Concatenate multiple hex strings.

```typescript
Hex.concat(...hexes: Hex[]): Hex
```

```typescript
Hex.concat(
  '0x12' as Hex,
  '0x34' as Hex,
  '0x56' as Hex
); // '0x123456'

// Concatenate function selector and arguments
const selector: Hex = '0x12345678';
const arg1: Hex = '0x' + '00'.repeat(32);
const arg2: Hex = '0x' + 'ff'.repeat(32);
const calldata = Hex.concat(selector, arg1, arg2);
```

**Throws:**
- `InvalidFormatError` - Missing 0x prefix
- `OddLengthError` - Odd number of hex digits
- `InvalidCharacterError` - Invalid hex characters

### slice

Slice hex string by byte indices.

```typescript
Hex.slice.call(hex: Hex, start: number, end?: number): Hex
```

```typescript
const hex: Hex = '0x12345678';

Hex.slice.call(hex, 1);      // '0x345678'
Hex.slice.call(hex, 1, 3);   // '0x3456'
Hex.slice.call(hex, 0, 2);   // '0x1234'

// Extract function selector (first 4 bytes)
const calldata: Hex = '0x12345678' + '00'.repeat(64);
const selector = Hex.slice.call(calldata, 0, 4); // '0x12345678'
```

**Throws:**
- `InvalidFormatError` - Missing 0x prefix
- `OddLengthError` - Odd number of hex digits
- `InvalidCharacterError` - Invalid hex characters

### pad

Left-pad hex with zeros to target size.

```typescript
Hex.pad.call(hex: Hex, targetSize: number): Hex
```

```typescript
const hex: Hex = '0x1234';

Hex.pad.call(hex, 4);   // '0x00001234'
Hex.pad.call(hex, 32);  // '0x0000...001234' (32 bytes)

// Pad number to 32 bytes for ABI encoding
const num: Hex = '0xff';
const padded = Hex.pad.call(num, 32); // '0x00...00ff'
```

**Note:** If hex is already >= targetSize, returns hex unchanged.

### padRight

Right-pad hex with zeros to target size.

```typescript
Hex.padRight.call(hex: Hex, targetSize: number): Hex
```

```typescript
const hex: Hex = '0x1234';

Hex.padRight.call(hex, 4);   // '0x12340000'
Hex.padRight.call(hex, 32);  // '0x1234000...000' (32 bytes)

// Pad string for ABI encoding
const str: Hex = Hex.fromString('hello');
const padded = Hex.padRight.call(str, 32);
```

**Note:** If hex is already >= targetSize, returns hex unchanged.

### trim

Remove leading zeros from hex.

```typescript
Hex.trim.call(hex: Hex): Hex
```

```typescript
const hex: Hex = '0x00001234';
Hex.trim.call(hex); // '0x1234'

const zero: Hex = '0x00000000';
Hex.trim.call(zero); // '0x'

// Useful after ABI decoding
const padded: Hex = '0x' + '00'.repeat(28) + '1234';
const trimmed = Hex.trim.call(padded); // '0x1234'
```

## Comparison Operations

### equals

Compare two hex strings (case-insensitive).

```typescript
Hex.equals.call(hex1: Hex, hex2: Hex): boolean
```

```typescript
const hex1: Hex = '0x1234';
const hex2: Hex = '0x1234';
const hex3: Hex = '0x1234ABCD';

Hex.equals.call(hex1, hex2);  // true
Hex.equals.call(hex1, hex3);  // false

// Case insensitive
Hex.equals.call('0xabcd' as Hex, '0xABCD' as Hex); // true
```

## Bitwise Operations

### xor

XOR two hex strings of same length.

```typescript
Hex.xor.call(hex1: Hex, hex2: Hex): Hex
```

```typescript
const hex1: Hex = '0x12';
const hex2: Hex = '0x34';
Hex.xor.call(hex1, hex2); // '0x26'

// XOR two 32-byte values
const hash1: Hex.Sized<32> = '0x' + 'ff'.repeat(32) as Hex.Sized<32>;
const hash2: Hex.Sized<32> = '0x' + '00'.repeat(32) as Hex.Sized<32>;
const result = Hex.xor.call(hash1, hash2); // '0xff...ff'
```

**Throws:**
- `InvalidFormatError` - Missing 0x prefix
- `OddLengthError` - Odd number of hex digits
- `InvalidCharacterError` - Invalid hex characters
- `InvalidLengthError` - Lengths don't match

## Utility Operations

### random

Generate cryptographically secure random hex.

```typescript
Hex.random(size: number): Hex
```

```typescript
// Random 32-byte hash
const randomHash = Hex.random(32);

// Random 20-byte address
const randomAddress = Hex.random(20);

// Random nonce
const nonce = Hex.random(8);
```

### zero

Create zero-filled hex of specific size.

```typescript
Hex.zero(size: number): Hex
```

```typescript
Hex.zero(1);   // '0x00'
Hex.zero(4);   // '0x00000000'
Hex.zero(32);  // '0x' + '00'.repeat(32)

// Create empty hash
const emptyHash = Hex.zero(32);
```

## Common Patterns

### Encoding Transaction Data

```typescript
function encodeTransfer(to: Address, amount: bigint): Hex {
  // Function selector: transfer(address,uint256)
  const selector: Hex = '0xa9059cbb';

  // Encode address (20 bytes -> 32 bytes padded)
  const addressHex = Hex.fromBytes(to);
  const paddedAddress = Hex.pad.call(addressHex, 32);

  // Encode amount (uint256)
  const amountHex = Hex.fromBigInt(amount, 32);

  return Hex.concat(selector, paddedAddress, amountHex);
}

const calldata = encodeTransfer(tokenAddress, 1000000n);
```

### Decoding Transaction Data

```typescript
function decodeTransfer(data: Hex): { to: Address; amount: bigint } {
  // Extract selector (first 4 bytes)
  const selector = Hex.slice.call(data, 0, 4);
  if (!Hex.equals.call(selector, '0xa9059cbb')) {
    throw new Error('Not a transfer function');
  }

  // Extract address (bytes 4-36)
  const addressPadded = Hex.slice.call(data, 4, 36);
  const addressHex = Hex.trim.call(addressPadded);
  const to = Hex.toBytes.call(addressHex) as Address;

  // Extract amount (bytes 36-68)
  const amountHex = Hex.slice.call(data, 36, 68);
  const amount = Hex.toBigInt.call(amountHex);

  return { to, amount };
}
```

### Validating and Converting Input

```typescript
function processHexInput(input: string): Hex {
  // Validate format
  if (!Hex.isHex(input)) {
    throw new Error('Invalid hex format');
  }

  // Additional validation
  const validated = Hex.validate.call(input);

  // Check size constraints
  const size = Hex.size.call(validated);
  if (size > 32) {
    throw new Error('Hex too large');
  }

  return validated;
}

const userInput = '0x1234';
const hex = processHexInput(userInput);
```

### Working with Sized Types

```typescript
function ensureHash(hex: Hex): Hex.Sized<32> {
  if (Hex.isSized.call(hex, 32)) {
    return hex; // Already 32 bytes
  }

  // Pad to 32 bytes
  return Hex.assertSize.call(Hex.pad.call(hex, 32), 32);
}

function ensureAddress(hex: Hex): Hex.Sized<20> {
  if (Hex.isSized.call(hex, 20)) {
    return hex; // Already 20 bytes
  }

  // Trim and check
  const trimmed = Hex.trim.call(hex);
  if (Hex.size.call(trimmed) > 20) {
    throw new Error('Too large for address');
  }

  return Hex.assertSize.call(Hex.pad.call(trimmed, 20), 20);
}
```

### Batch Processing

```typescript
function batchConvert(hexStrings: string[]): Uint8Array[] {
  return hexStrings
    .filter(Hex.isHex)
    .map(hex => Hex.toBytes.call(hex));
}

function batchValidate(hexStrings: string[]): {
  valid: Hex[];
  invalid: Array<{ input: string; error: Error }>;
} {
  const valid: Hex[] = [];
  const invalid: Array<{ input: string; error: Error }> = [];

  for (const str of hexStrings) {
    try {
      valid.push(Hex.validate.call(str));
    } catch (e) {
      invalid.push({ input: str, error: e as Error });
    }
  }

  return { valid, invalid };
}
```

### Generating Test Data

```typescript
function generateTestData() {
  return {
    address: Hex.random(20),
    hash: Hex.random(32),
    signature: Hex.concat(
      Hex.random(32), // r
      Hex.random(32), // s
      Hex.fromNumber(27, 1) // v
    ),
    emptyHash: Hex.zero(32),
    emptyAddress: Hex.zero(20)
  };
}
```

## Best Practices

### 1. Use Type Guards

```typescript
// Good: Validate before using
function processHex(data: unknown) {
  if (Hex.isHex(data)) {
    return Hex.toBytes.call(data);
  }
  throw new Error('Invalid hex');
}

// Bad: Assuming types
function processHex(data: any) {
  return Hex.toBytes.call(data); // Unsafe
}
```

### 2. Handle Errors Explicitly

```typescript
// Good: Catch specific errors
try {
  const hex = Hex.validate.call(input);
  process(hex);
} catch (e) {
  if (e instanceof Hex.InvalidFormatError) {
    console.error('Missing 0x prefix');
  } else if (e instanceof Hex.InvalidCharacterError) {
    console.error('Invalid hex characters');
  }
}

// Bad: Generic error handling
try {
  process(Hex.validate.call(input));
} catch (e) {
  console.error('Something went wrong');
}
```

### 3. Use Sized Types for Type Safety

```typescript
// Good: Explicit size constraints
function hashData(data: Hex): Hex.Sized<32> {
  // Implementation ensures 32-byte output
  return Hex.assertSize.call(result, 32);
}

// Bad: Unsized return type
function hashData(data: Hex): Hex {
  // Caller doesn't know expected size
  return result;
}
```

### 4. Validate External Input

```typescript
// Good: Validate user input
function acceptUserHex(input: string): Hex {
  const validated = Hex.validate.call(input);
  const size = Hex.size.call(validated);

  if (size > 1024) {
    throw new Error('Hex too large');
  }

  return validated;
}

// Bad: Trusting external data
function acceptUserHex(input: string): Hex {
  return input as Hex; // Dangerous
}
```

### 5. Use Appropriate Conversion Methods

```typescript
// Good: Use specific conversion
const address: Hex = '0x1234...';
const bytes = Hex.toBytes.call(address);

// Bad: Manual conversion
const bytes = Buffer.from(address.slice(2), 'hex'); // Avoidable
```

### 6. Normalize Before Comparison

```typescript
// Good: Use equals for comparison
if (Hex.equals.call(hex1, hex2)) {
  // Handles case insensitivity
}

// Bad: Direct comparison
if (hex1 === hex2) {
  // Case sensitive, may fail
}
```

### 7. Mind MAX_SAFE_INTEGER

```typescript
// Good: Use BigInt for large values
const hex: Hex = '0x123456789abcdef0';
const value = Hex.toBigInt.call(hex);

// Bad: May throw RangeError
const value = Hex.toNumber.call(hex); // Unsafe for large values
```

## Performance Considerations

### Operation Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| `isHex` | O(n) | n = string length |
| `isSized` | O(1) | Length check only |
| `validate` | O(n) | Must check all chars |
| `assertSize` | O(1) | Length calculation |
| `fromBytes` | O(n) | Must convert each byte |
| `toBytes` | O(n) | Must parse each char |
| `fromNumber` | O(log n) | Based on number size |
| `toNumber` | O(n) | Must parse string |
| `fromBigInt` | O(log n) | Based on bigint size |
| `toBigInt` | O(n) | Must parse string |
| `fromString` | O(n) | Encoding each char |
| `toString` | O(n) | Decoding each byte |
| `size` | O(1) | String length |
| `concat` | O(n×m) | n = count, m = avg size |
| `slice` | O(n) | Must copy bytes |
| `pad` | O(n) | Must copy and pad |
| `padRight` | O(n) | Must copy and pad |
| `trim` | O(n) | Must scan for zeros |
| `equals` | O(n) | String comparison |
| `xor` | O(n) | Byte-by-byte operation |
| `random` | O(n) | Crypto random generation |
| `zero` | O(n) | Allocation and fill |

### Optimization Tips

1. **Cache conversions** - don't convert repeatedly
   ```typescript
   // Good
   const bytes = Hex.toBytes.call(hex);
   for (const operation of operations) {
     operation(bytes);
   }

   // Bad
   for (const operation of operations) {
     operation(Hex.toBytes.call(hex)); // Repeated conversion
   }
   ```

2. **Use sized types** - avoid repeated size checks
   ```typescript
   // Good
   const hash: Hex.Sized<32> = Hex.assertSize.call(hex, 32);
   // No further size checks needed

   // Bad
   for (const operation of operations) {
     if (Hex.isSized.call(hex, 32)) { ... } // Repeated checks
   }
   ```

3. **Batch operations** - minimize allocations
   ```typescript
   // Good
   const results = hexArray.map(Hex.toBytes.call);

   // Bad
   const results = [];
   for (const hex of hexArray) {
     results.push(Hex.toBytes.call(hex));
   }
   ```

4. **Avoid unnecessary validation** - validate once
   ```typescript
   // Good
   const validated = Hex.validate.call(input);
   process1(validated);
   process2(validated);

   // Bad
   process1(Hex.validate.call(input));
   process2(Hex.validate.call(input)); // Duplicate validation
   ```

## API Summary

### Type Guards
- `isHex(value)` - Check if string is valid hex
- `isSized.call(hex, size)` - Check if hex has specific size

### Validation
- `validate.call(str)` - Validate and return hex
- `assertSize.call(hex, size)` - Assert specific size

### Conversions (from)
- `fromBytes(bytes)` - Convert Uint8Array to hex
- `fromNumber(value, size?)` - Convert number to hex
- `fromBigInt(value, size?)` - Convert bigint to hex
- `fromString(str)` - Convert UTF-8 string to hex
- `fromBoolean(value)` - Convert boolean to hex

### Conversions (to)
- `toBytes.call(hex)` - Convert hex to Uint8Array
- `toNumber.call(hex)` - Convert hex to number
- `toBigInt.call(hex)` - Convert hex to bigint
- `toString.call(hex)` - Convert hex to UTF-8 string
- `toBoolean.call(hex)` - Convert hex to boolean

### Size
- `size.call(hex)` - Get byte size of hex

### Manipulation
- `concat(...hexes)` - Concatenate hex strings
- `slice.call(hex, start, end?)` - Slice hex by bytes
- `pad.call(hex, targetSize)` - Left-pad with zeros
- `padRight.call(hex, targetSize)` - Right-pad with zeros
- `trim.call(hex)` - Remove leading zeros

### Comparison
- `equals.call(hex1, hex2)` - Compare hex strings

### Bitwise
- `xor.call(hex1, hex2)` - XOR two hex strings

### Utilities
- `random(size)` - Generate random hex
- `zero(size)` - Create zero-filled hex

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [Ethereum JSON-RPC Specification](https://ethereum.org/en/developers/docs/apis/json-rpc/)
- [EIP-55: Mixed-case checksum address encoding](https://eips.ethereum.org/EIPS/eip-55)
