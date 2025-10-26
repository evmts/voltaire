# Hash32/Bytes32 Branded Type Benchmarks

Comprehensive benchmarks comparing Hash32/Bytes32 branded type operations across three popular Ethereum libraries:
- **guil** (@tevm/primitives) - Type-safe branded types
- **ethers** - Plain string/Uint8Array operations
- **viem** - Hex type with utilities

## Directory Structure

```
hash32/
├── constructor/       # Hash32(value) - Create from hex or bytes
├── toUint8Array/      # hash32ToUint8Array(hash) - Convert to bytes
├── toBigInt/          # hash32ToBigInt(hash) - Convert to bigint
├── fromBigInt/        # bigIntToHash32(value) - Create from bigint
├── fill/              # fillHash32(byte) - Generate filled hash
├── typeGuard/         # isHash32/isBytes32 - Type validation
└── docs.ts            # Documentation generator
```

Each subdirectory contains three implementations:
- `guil.ts` - @tevm/primitives implementation
- `ethers.ts` - ethers.js implementation
- `viem.ts` - viem implementation

## Test Data

All benchmarks use consistent test data:
- **Hex string**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- **BigInt**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn`
- **Uint8Array**: 32-byte array with sequential values

## Functions Benchmarked

### 1. Hash32 Constructor
**guil**: `Hash32(value: '0x${string}' | Uint8Array): Hash32`
- Branded type with runtime validation
- Ensures exactly 32 bytes (66 hex chars)
- Type safety at compile time

**ethers**: Manual validation with `getBytes()/hexlify()`
- No branded type
- Length check required

**viem**: `Hex` type with manual validation
- `isHex()` + length check
- No branded type

### 2. hash32ToUint8Array
Convert Hash32 to Uint8Array representation.

**guil**: `hash32ToUint8Array(hash: Hash32): Uint8Array`
**ethers**: `getBytes(hex: string): Uint8Array`
**viem**: `hexToBytes(hex: Hex): Uint8Array`

### 3. hash32ToBigInt
Convert Hash32 to bigint (big-endian unsigned integer).

**guil**: `hash32ToBigInt(hash: Hash32): bigint`
**ethers**: `toBigInt(hex: string): bigint`
**viem**: `hexToBigInt(hex: Hex): bigint`

### 4. bigIntToHash32
Convert bigint to 32-byte Hash32 representation.

**guil**: `bigIntToHash32(value: bigint): Hash32`
**ethers**: `zeroPadValue(toBeHex(value), 32)`
**viem**: `toHex(value, { size: 32 })`

### 5. fillHash32
Create Hash32 filled with a specific byte value.

**guil**: `fillHash32(byte: number): Hash32`
**ethers**: `hexlify(new Uint8Array(32).fill(byte))`
**viem**: `bytesToHex(new Uint8Array(32).fill(byte))`

### 6. isHash32/isBytes32
Type guard for validating Hash32 format.

**guil**: `isHash32(value: unknown): value is Hash32`
- Type narrowing in TypeScript
- Validates 32-byte format

**ethers**: `isHexString(value, 32): boolean`
**viem**: `isHex(value, { size: 32 }): boolean`

## Type Safety Benefits

Guil's branded types provide compile-time type safety:

```typescript
// Guil - Prevents mixing incompatible types
import { Hash32, Address } from "@tevm/primitives";

const hash: Hash32 = Hash32("0x1234...");
const addr: Address = Address("0xabcd...");

function processHash(h: Hash32) { ... }
processHash(hash);  // ✅ OK
processHash(addr);  // ❌ TypeScript error - Address is not Hash32!

// Ethers/Viem - No type safety
const hash = "0x1234...";  // Just a string
const addr = "0xabcd...";  // Also just a string

function processHash(h: string) { ... }
processHash(hash);  // ✅ OK
processHash(addr);  // ✅ OK (but might be wrong!)
```

## Key Differences

| Feature | Guil | Ethers | Viem |
|---------|------|--------|------|
| Branded Types | ✅ Hash32, Bytes32 | ❌ Plain strings | ⚠️ Generic `Hex` type |
| Compile-time Safety | ✅ Type errors | ❌ No protection | ⚠️ Minimal protection |
| Runtime Validation | ✅ Constructor | ⚠️ Manual | ⚠️ Manual |
| Type Guards | ✅ Type narrowing | ⚠️ Boolean only | ⚠️ Boolean only |
| Auto-complete | ✅ Type-specific | ❌ Generic string | ⚠️ Generic Hex |

## Running Benchmarks

Each implementation exports a `main(): void` function that can be benchmarked:

```typescript
import { main } from './constructor/guil.js';
main(); // Runs the benchmark
```

## Documentation

Generate comprehensive documentation:

```bash
node comparisons/hash32/docs.ts
```

This produces markdown documentation with:
- Function signatures
- Implementation comparisons
- Performance analysis
- Type safety examples
- Best practices

## Why Branded Types Matter

Branded types prevent entire classes of bugs:

1. **Type Confusion**: Can't accidentally pass an Address where a Hash32 is expected
2. **Validation Guarantees**: If you have a Hash32, it's guaranteed to be valid
3. **Self-Documenting**: Function signatures clearly show what type of hash is needed
4. **IDE Support**: Better auto-complete and type hints
5. **Refactoring Safety**: Type changes are caught at compile time

## Best Practices

### Guil
```typescript
// ✅ Type-safe construction
const hash = Hash32("0x1234...");

// ✅ Type narrowing with guards
if (isHash32(value)) {
  // TypeScript knows value is Hash32
}

// ✅ Conversions maintain type safety
const bigIntValue = hash32ToBigInt(hash);
const backToHash = bigIntToHash32(bigIntValue);
```

### Ethers
```typescript
// ⚠️ Manual validation required
const hash = "0x1234...";
if (!isHexString(hash, 32)) {
  throw new Error("Invalid hash");
}

// ⚠️ No type guarantees
const bytes = getBytes(hash);
```

### Viem
```typescript
// ⚠️ Hex type is generic (works for any length)
const hash: Hex = "0x1234...";
if (!isHex(hash, { size: 32 })) {
  throw new Error("Invalid hash");
}

// ⚠️ No length-specific types
const bytes = hexToBytes(hash);
```

## Conclusion

While all three libraries provide hash operations, Guil's branded types offer superior type safety and developer experience. The performance differences are typically negligible compared to the correctness benefits of compile-time type checking.
