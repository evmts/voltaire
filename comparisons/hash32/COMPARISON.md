# Hash32/Bytes32 Operations - Library Comparison

A detailed comparison of how each library handles Hash32/Bytes32 operations.

## Quick Reference Table

| Operation | Guil | Ethers | Viem |
|-----------|------|--------|------|
| **Create from hex** | `Hash32("0x...")` | `getBytes("0x...")` + validate | `hexToBytes("0x...")` + validate |
| **Create from bytes** | `Hash32(uint8Array)` | `hexlify(uint8Array)` + validate | `bytesToHex(uint8Array)` + validate |
| **Create from bigint** | `bigIntToHash32(n)` | `zeroPadValue(toBeHex(n), 32)` | `toHex(n, { size: 32 })` |
| **To bytes** | `hash32ToUint8Array(hash)` | `getBytes(hex)` | `hexToBytes(hex)` |
| **To bigint** | `hash32ToBigInt(hash)` | `toBigInt(hex)` | `hexToBigInt(hex)` |
| **Fill pattern** | `fillHash32(0xff)` | `hexlify(new Uint8Array(32).fill(0xff))` | `bytesToHex(new Uint8Array(32).fill(0xff))` |
| **Type check** | `isHash32(value)` | `isHexString(value, 32)` | `isHex(value, { size: 32 })` |

## Detailed Comparisons

### 1. Constructor - Creating Hash32 from Hex String

#### Guil
```typescript
import { Hash32 } from '@tevm/primitives';

// ✅ Branded type with runtime validation
const hash: Hash32 = Hash32('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
// ❌ Throws error for invalid length
const bad = Hash32('0x1234'); // Error: Must be exactly 64 hex characters
```

**Benefits:**
- Branded type prevents mixing with other types
- Automatic validation
- Type-safe at compile time
- Single function call

#### Ethers
```typescript
import { getBytes, isHexString } from 'ethers';

// ⚠️ Manual validation required
const hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
if (!isHexString(hex, 32)) {
  throw new Error('Invalid hash32 length');
}
const hash = getBytes(hex);
```

**Drawbacks:**
- No branded type (just Uint8Array or string)
- Manual validation required
- No type safety (can pass any string)
- Multiple function calls

#### Viem
```typescript
import { type Hex, isHex, hexToBytes } from 'viem';

// ⚠️ Generic Hex type, manual validation
const hash: Hex = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
if (!isHex(hash, { size: 32 })) {
  throw new Error('Invalid hash32 format');
}
const bytes = hexToBytes(hash);
```

**Drawbacks:**
- Generic Hex type (works for any length)
- Manual validation required
- No length-specific type
- Multiple function calls

---

### 2. Constructor - Creating Hash32 from Uint8Array

#### Guil
```typescript
import { Hash32 } from '@tevm/primitives';

// ✅ Validates and converts to branded type
const bytes = new Uint8Array(32);
const hash: Hash32 = Hash32(bytes);
```

#### Ethers
```typescript
import { hexlify } from 'ethers';

// ⚠️ Manual validation
const bytes = new Uint8Array(32);
if (bytes.length !== 32) {
  throw new Error('Invalid hash32 length');
}
const hex = hexlify(bytes);
```

#### Viem
```typescript
import { bytesToHex } from 'viem';

// ⚠️ Manual validation
const bytes = new Uint8Array(32);
if (bytes.length !== 32) {
  throw new Error('Invalid hash32 length');
}
const hex = bytesToHex(bytes);
```

---

### 3. Converting Hash32 to Uint8Array

#### Guil
```typescript
import { Hash32, hash32ToUint8Array } from '@tevm/primitives';

const hash: Hash32 = Hash32('0x1234...');
const bytes: Uint8Array = hash32ToUint8Array(hash);
// ✅ Type-safe conversion
```

#### Ethers
```typescript
import { getBytes } from 'ethers';

const hex = '0x1234...';
const bytes = getBytes(hex);
// ⚠️ No type safety
```

#### Viem
```typescript
import { hexToBytes } from 'viem';

const hex = '0x1234...';
const bytes = hexToBytes(hex);
// ⚠️ No type safety
```

---

### 4. Converting Hash32 to BigInt

#### Guil
```typescript
import { Hash32, hash32ToBigInt } from '@tevm/primitives';

const hash: Hash32 = Hash32('0x1234...');
const n: bigint = hash32ToBigInt(hash);
// ✅ Type-safe conversion
```

#### Ethers
```typescript
import { toBigInt } from 'ethers';

const hex = '0x1234...';
const n = toBigInt(hex);
// ⚠️ Works with any hex string
```

#### Viem
```typescript
import { hexToBigInt } from 'viem';

const hex = '0x1234...';
const n = hexToBigInt(hex);
// ⚠️ Works with any hex string
```

---

### 5. Converting BigInt to Hash32

#### Guil
```typescript
import { bigIntToHash32 } from '@tevm/primitives';

const n = 0x1234567890abcdefn;
const hash: Hash32 = bigIntToHash32(n);
// ✅ Validates and pads to 32 bytes
// ❌ Throws if value > 256 bits
```

#### Ethers
```typescript
import { toBeHex, zeroPadValue } from 'ethers';

const n = 0x1234567890abcdefn;
const hex = toBeHex(n);
const padded = zeroPadValue(hex, 32);
// ⚠️ Two function calls
// ⚠️ No type safety
```

#### Viem
```typescript
import { toHex } from 'viem';

const n = 0x1234567890abcdefn;
const hex = toHex(n, { size: 32 });
// ✅ Single call with size parameter
// ⚠️ No type safety
```

---

### 6. Filling Hash32 with Byte Pattern

#### Guil
```typescript
import { fillHash32 } from '@tevm/primitives';

const zeros: Hash32 = fillHash32(0x00);
const ones: Hash32 = fillHash32(0xff);
// ✅ Type-safe, single call
// ✅ Returns branded Hash32
```

#### Ethers
```typescript
import { hexlify } from 'ethers';

const zeros = hexlify(new Uint8Array(32).fill(0x00));
const ones = hexlify(new Uint8Array(32).fill(0xff));
// ⚠️ Manual array creation
// ⚠️ No type safety
```

#### Viem
```typescript
import { bytesToHex } from 'viem';

const zeros = bytesToHex(new Uint8Array(32).fill(0x00));
const ones = bytesToHex(new Uint8Array(32).fill(0xff));
// ⚠️ Manual array creation
// ⚠️ No type safety
```

---

### 7. Type Guards and Validation

#### Guil
```typescript
import { isHash32, type Hash32 } from '@tevm/primitives';

function processHash(value: unknown) {
  if (isHash32(value)) {
    // ✅ TypeScript narrows type to Hash32
    const bytes = hash32ToUint8Array(value);
  }
}
```

**Benefits:**
- Type narrowing in TypeScript
- Runtime and compile-time safety

#### Ethers
```typescript
import { isHexString } from 'ethers';

function processHash(value: unknown) {
  if (isHexString(value, 32)) {
    // ⚠️ TypeScript knows it's a string, but not that it's 32 bytes
    const bytes = getBytes(value);
  }
}
```

**Drawbacks:**
- No type narrowing to specific length
- Just validates as string

#### Viem
```typescript
import { isHex, type Hex } from 'viem';

function processHash(value: unknown) {
  if (isHex(value, { size: 32 })) {
    // ⚠️ TypeScript knows it's Hex, but not the specific size
    const bytes = hexToBytes(value);
  }
}
```

**Drawbacks:**
- No size-specific type narrowing
- Generic Hex type

---

## Type Safety Deep Dive

### Compile-time Prevention of Bugs

#### Problem: Mixing Different Hash Types

```typescript
// Common bug: Mixing transaction hash with block hash
function getTransaction(txHash: string) { ... }
function getBlock(blockHash: string) { ... }

const txHash = "0x1234...";
const blockHash = "0x5678...";

// ❌ No compiler error - but might be wrong!
getTransaction(blockHash); // Oops! Passed block hash instead of tx hash
```

#### Guil Solution: Branded Types

```typescript
import { Hash32, type TransactionHash, type BlockHash } from '@tevm/primitives';

// Define domain-specific hash types
type TransactionHash = Hash32 & { readonly __brand: 'TransactionHash' };
type BlockHash = Hash32 & { readonly __brand: 'BlockHash' };

function getTransaction(txHash: TransactionHash) { ... }
function getBlock(blockHash: BlockHash) { ... }

const txHash = Hash32("0x1234...") as TransactionHash;
const blockHash = Hash32("0x5678...") as BlockHash;

// ✅ Compiler error prevents the bug!
getTransaction(blockHash); // TypeScript error: BlockHash is not assignable to TransactionHash
```

### Runtime Validation Guarantees

#### Guil
```typescript
// If you have a Hash32, it's GUARANTEED to be valid
function processHash(hash: Hash32) {
  // No validation needed - type guarantees it's valid
  const bytes = hash32ToUint8Array(hash);
}
```

#### Ethers/Viem
```typescript
// No guarantees - validation needed everywhere
function processHash(hex: string) {
  // Always need to validate
  if (!isHexString(hex, 32)) {
    throw new Error('Invalid hash');
  }
  const bytes = getBytes(hex);
}
```

---

## Performance Considerations

While performance varies by operation, the key tradeoffs are:

### Guil
- **Constructor**: Slightly slower due to validation (negligible)
- **Conversions**: Similar performance to other libraries
- **Type Guards**: Fast regex validation
- **Overall**: Type safety benefits far outweigh minimal overhead

### Ethers
- **Constructor**: Fast (no validation unless you add it)
- **Conversions**: Well-optimized
- **Risk**: Easy to forget validation, leading to runtime errors

### Viem
- **Constructor**: Fast (minimal validation)
- **Conversions**: Very fast (optimized for performance)
- **Risk**: Generic types don't prevent length mismatches

---

## Best Practices by Library

### Guil Best Practices
```typescript
// ✅ Use branded types everywhere
const hash: Hash32 = Hash32("0x...");

// ✅ Type guards for unknown values
if (isHash32(value)) {
  processHash(value);
}

// ✅ Domain-specific types for clarity
type StorageSlot = Hash32 & { readonly __brand: 'StorageSlot' };
```

### Ethers Best Practices
```typescript
// ⚠️ Always validate before using
if (!isHexString(hex, 32)) {
  throw new Error('Invalid hash32');
}

// ⚠️ Create wrapper types for safety
interface ValidatedHash32 {
  readonly hex: string;
  readonly bytes: Uint8Array;
}
```

### Viem Best Practices
```typescript
// ⚠️ Validate size explicitly
if (!isHex(value, { size: 32 })) {
  throw new Error('Invalid hash32');
}

// ⚠️ Use constants for sizes
const HASH32_SIZE = 32;
```

---

## Conclusion

### Choose Guil If You Want:
- ✅ Compile-time type safety
- ✅ Prevention of type confusion bugs
- ✅ Self-documenting code
- ✅ Better IDE support
- ✅ Validation guarantees

### Choose Ethers If You Need:
- ⚠️ Broad ecosystem compatibility
- ⚠️ Mature, battle-tested library
- ❌ Manual validation acceptable

### Choose Viem If You Need:
- ⚠️ Maximum performance
- ⚠️ Tree-shaking optimization
- ⚠️ Modern TypeScript features
- ❌ Manual validation acceptable

**Recommendation**: For new projects prioritizing correctness and maintainability, Guil's branded types provide significant safety benefits with minimal performance cost.
