# Hash32/Bytes32 Benchmarks - Implementation Complete

## Summary

Comprehensive benchmarks have been created for Hash32/Bytes32 branded type operations comparing guil, ethers, and viem. All implementations are complete and ready for benchmarking.

## Created Files

### Benchmark Implementations (18 files)

#### 1. Constructor (3 files)
- `comparisons/hash32/constructor/guil.ts` - Hash32 constructor with branded type validation
- `comparisons/hash32/constructor/ethers.ts` - Manual validation with getBytes/hexlify
- `comparisons/hash32/constructor/viem.ts` - Hex type with manual length checking

#### 2. toUint8Array (3 files)
- `comparisons/hash32/toUint8Array/guil.ts` - hash32ToUint8Array conversion
- `comparisons/hash32/toUint8Array/ethers.ts` - getBytes conversion
- `comparisons/hash32/toUint8Array/viem.ts` - hexToBytes conversion

#### 3. toBigInt (3 files)
- `comparisons/hash32/toBigInt/guil.ts` - hash32ToBigInt conversion
- `comparisons/hash32/toBigInt/ethers.ts` - toBigInt conversion
- `comparisons/hash32/toBigInt/viem.ts` - hexToBigInt conversion

#### 4. fromBigInt (3 files)
- `comparisons/hash32/fromBigInt/guil.ts` - bigIntToHash32 conversion
- `comparisons/hash32/fromBigInt/ethers.ts` - toBeHex + zeroPadValue
- `comparisons/hash32/fromBigInt/viem.ts` - toHex with size parameter

#### 5. fill (3 files)
- `comparisons/hash32/fill/guil.ts` - fillHash32 utility
- `comparisons/hash32/fill/ethers.ts` - Uint8Array.fill + hexlify
- `comparisons/hash32/fill/viem.ts` - Uint8Array.fill + bytesToHex

#### 6. typeGuard (3 files)
- `comparisons/hash32/typeGuard/guil.ts` - isHash32/isBytes32 type guards
- `comparisons/hash32/typeGuard/ethers.ts` - isHexString with length parameter
- `comparisons/hash32/typeGuard/viem.ts` - isHex with size parameter

### Documentation (2 files)
- `comparisons/hash32/docs.ts` - Documentation generator
- `comparisons/hash32/README.md` - Comprehensive benchmark guide

## Test Results

All implementations have been tested and verified:
- ✓ All constructor implementations work
- ✓ All toUint8Array implementations work
- ✓ All toBigInt implementations work
- ✓ All fromBigInt implementations work
- ✓ All fill implementations work
- ✓ All type guard implementations work

## Key Features

### Test Data
All benchmarks use consistent test data:
- **Hex string**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- **BigInt**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn`
- **Uint8Array**: 32-byte array with sequential values (0-31)

### Functions Benchmarked

1. **Hash32(value)** - Construct from hex string or Uint8Array
2. **hash32ToUint8Array(hash)** - Convert to bytes
3. **hash32ToBigInt(hash)** - Convert to bigint
4. **bigIntToHash32(value)** - Create from bigint
5. **fillHash32(byte)** - Generate filled hash
6. **isHash32/isBytes32(value)** - Type validation

### Type Safety Comparison

| Feature | Guil | Ethers | Viem |
|---------|------|--------|------|
| Branded Types | ✅ Hash32, Bytes32 | ❌ Plain strings | ⚠️ Generic `Hex` type |
| Compile-time Safety | ✅ Type errors | ❌ No protection | ⚠️ Minimal protection |
| Runtime Validation | ✅ Constructor validates | ⚠️ Manual validation needed | ⚠️ Manual validation needed |
| Type Guards | ✅ Type narrowing | ⚠️ Boolean only | ⚠️ Boolean only |
| Auto-complete | ✅ Type-specific | ❌ Generic string | ⚠️ Generic Hex |

## Type Safety Benefits

Guil's branded types provide compile-time type safety that prevents bugs:

```typescript
// Guil - Type-safe (prevents mixing incompatible types)
import { Hash32, Address } from "@tevm/primitives";

const hash: Hash32 = Hash32("0x1234...");
const addr: Address = Address("0xabcd...");

function processHash(h: Hash32) { ... }
processHash(hash);  // ✅ OK
processHash(addr);  // ❌ TypeScript error - Address is not Hash32!

// Ethers/Viem - No compile-time safety
const hash = "0x1234...";  // Just a string
const addr = "0xabcd...";  // Also just a string

function processHash(h: string) { ... }
processHash(hash);  // ✅ OK
processHash(addr);  // ✅ OK (but might be logically wrong!)
```

## Implementation Patterns

### Guil Pattern
```typescript
import { Hash32, hash32ToUint8Array } from '@tevm/primitives';

// Constructor with validation
const hash = Hash32('0x1234567890abcdef...');

// Type-safe conversions
const bytes = hash32ToUint8Array(hash);
const bigInt = hash32ToBigInt(hash);

// Type guards with narrowing
if (isHash32(value)) {
  // TypeScript knows value is Hash32 here
}
```

### Ethers Pattern
```typescript
import { getBytes, toBigInt, hexlify } from 'ethers';

// Manual validation needed
const hash = '0x1234567890abcdef...';
if (!isHexString(hash, 32)) {
  throw new Error('Invalid hash');
}

// Conversions (no type safety)
const bytes = getBytes(hash);
const bigInt = toBigInt(hash);
```

### Viem Pattern
```typescript
import { hexToBytes, hexToBigInt, isHex } from 'viem';

// Hex type (generic, not length-specific)
const hash: Hex = '0x1234567890abcdef...';
if (!isHex(hash, { size: 32 })) {
  throw new Error('Invalid hash');
}

// Conversions (minimal type safety)
const bytes = hexToBytes(hash);
const bigInt = hexToBigInt(hash);
```

## Next Steps

The benchmark implementations are complete and ready for:

1. **Running Benchmarks**: Execute with vitest bench to measure performance
2. **Generating Documentation**: Run `docs.ts` after benchmarks complete to generate comprehensive docs
3. **Performance Analysis**: Compare execution times across implementations
4. **Integration**: Add to CI/CD pipeline for continuous performance monitoring

## Files Structure

```
comparisons/hash32/
├── constructor/
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── toUint8Array/
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── toBigInt/
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── fromBigInt/
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── fill/
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── typeGuard/
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── docs.ts
├── README.md
└── SUMMARY.md
```

## Conclusion

All Hash32/Bytes32 benchmark implementations are complete, tested, and ready for benchmarking. The implementations demonstrate the type safety advantages of guil's branded types while providing fair performance comparisons against ethers and viem.
