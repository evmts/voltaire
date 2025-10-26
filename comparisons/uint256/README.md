# Uint256 Operations Benchmark

Comprehensive comparison of 256-bit unsigned integer operations across three TypeScript/JavaScript libraries:
- **guil** (@tevm/primitives) - Type-safe branded Uint256 with overflow protection
- **ethers** - Uses native bigint with utility functions
- **viem** - Uses native bigint with utility functions

## Key Differences

### Type Safety
- **guil**: Branded type `Uint256` provides compile-time type safety and prevents mixing with regular hex strings
- **ethers/viem**: Use plain bigint and hex strings - no type-level protection

### Safety Features
- **guil**: Built-in overflow/underflow detection for all arithmetic operations
- **ethers/viem**: Native bigint has no bounds checking - can exceed uint256 range

### API Design
- **guil**: Rich API with explicit functions for all operations
- **ethers/viem**: Minimal API - relies on native bigint operators

## Benchmark Categories

### Conversions

Converting between different representations of 256-bit unsigned integers

#### fromBigInt

Convert native bigint to Uint256 with range validation

**guil (@tevm/primitives)**

```typescript
import { fromBigInt } from '@tevm/primitives/uint256';

const value = fromBigInt(42n);
// Returns: Uint256 branded type with overflow protection
```

**ethers**

```typescript
import { toBeHex } from 'ethers';

const value = toBeHex(42n);
// Returns: hex string
```

**viem**

```typescript
import { toHex } from 'viem';

const value = toHex(42n);
// Returns: hex string
```

---

#### toBigInt

Convert Uint256 to native bigint

**guil (@tevm/primitives)**

```typescript
import { toBigInt } from '@tevm/primitives/uint256';
import type { Uint256 } from '@tevm/primitives/uint256';

const value: Uint256 = '0x2a' as Uint256;
const bigInt = toBigInt(value);
// Returns: 42n
```

**ethers**

```typescript
import { toBigInt } from 'ethers';

const value = '0x2a';
const bigInt = toBigInt(value);
// Returns: 42n
```

**viem**

```typescript
import { hexToBigInt } from 'viem';

const value = '0x2a';
const bigInt = hexToBigInt(value);
// Returns: 42n
```

---

#### fromHex

Convert hex string to Uint256 with validation

**guil (@tevm/primitives)**

```typescript
import { fromHex } from '@tevm/primitives/uint256';

const value = fromHex('0x2a');
// Returns: Uint256 branded type with validation
```

**ethers**

```typescript
import { toBigInt, toBeHex } from 'ethers';

const value = '0x2a';
const validated = toBeHex(toBigInt(value));
// Ethers validates through conversion
```

**viem**

```typescript
import { hexToBigInt, toHex } from 'viem';

const value = '0x2a';
const validated = toHex(hexToBigInt(value));
// Viem validates through conversion
```

---

#### toHex

Convert Uint256 to hex string

**guil (@tevm/primitives)**

```typescript
import { toHex } from '@tevm/primitives/uint256';
import type { Uint256 } from '@tevm/primitives/uint256';

const value: Uint256 = '0x2a' as Uint256;
const hex = toHex(value);
// Returns: '0x2a' (already hex, returns as-is)
```

**ethers**

```typescript
import { toBigInt, toBeHex } from 'ethers';

const value = '0x2a';
const hex = toBeHex(toBigInt(value));
// Returns: '0x2a'
```

**viem**

```typescript
import { hexToBigInt, toHex } from 'viem';

const value = '0x2a';
const hex = toHex(hexToBigInt(value));
// Returns: '0x2a'
```

---

#### fromBytes

Convert byte array to Uint256 (big-endian)

**guil (@tevm/primitives)**

```typescript
import { fromBytes } from '@tevm/primitives/uint256';

const bytes = new Uint8Array([0, 0, 0, 42]);
const value = fromBytes(bytes);
// Returns: Uint256 branded type
```

**ethers**

```typescript
import { hexlify } from 'ethers';

const bytes = new Uint8Array([0, 0, 0, 42]);
const value = hexlify(bytes);
// Returns: hex string
```

**viem**

```typescript
import { bytesToHex } from 'viem';

const bytes = new Uint8Array([0, 0, 0, 42]);
const value = bytesToHex(bytes);
// Returns: hex string
```

---

#### toBytes

Convert Uint256 to 32-byte array (big-endian)

**guil (@tevm/primitives)**

```typescript
import { toBytes } from '@tevm/primitives/uint256';
import type { Uint256 } from '@tevm/primitives/uint256';

const value: Uint256 = '0x2a' as Uint256;
const bytes = toBytes(value);
// Returns: 32-byte Uint8Array (zero-padded)
```

**ethers**

```typescript
import { toBeArray } from 'ethers';

const value = '0x2a';
const bytes = toBeArray(value);
// Returns: Uint8Array
```

**viem**

```typescript
import { hexToBytes } from 'viem';

const value = '0x2a';
const bytes = hexToBytes(value, { size: 32 });
// Returns: 32-byte Uint8Array
```

---

### Arithmetic

Safe arithmetic operations with overflow/underflow protection

#### add

Addition with overflow detection

**guil (@tevm/primitives)**

```typescript
import { add, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = add(a, b);
// Returns: Uint256, throws on overflow
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a + b;
// Returns: bigint, no overflow check
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a + b;
// Returns: bigint, no overflow check
```

---

#### sub

Subtraction with underflow detection

**guil (@tevm/primitives)**

```typescript
import { sub, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(100n);
const b = fromBigInt(42n);
const result = sub(a, b);
// Returns: Uint256, throws on underflow
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 100n;
const b = 42n;
const result = a - b;
// Returns: bigint, no underflow check
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 100n;
const b = 42n;
const result = a - b;
// Returns: bigint, no underflow check
```

---

#### mul

Multiplication with overflow detection

**guil (@tevm/primitives)**

```typescript
import { mul, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = mul(a, b);
// Returns: Uint256, throws on overflow
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a * b;
// Returns: bigint, no overflow check
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a * b;
// Returns: bigint, no overflow check
```

---

#### div

Integer division with zero check

**guil (@tevm/primitives)**

```typescript
import { div, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(100n);
const b = fromBigInt(2n);
const result = div(a, b);
// Returns: Uint256, throws on division by zero
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 100n;
const b = 2n;
const result = a / b;
// Returns: bigint, throws on division by zero
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 100n;
const b = 2n;
const result = a / b;
// Returns: bigint, throws on division by zero
```

---

#### mod

Modulo operation with zero check

**guil (@tevm/primitives)**

```typescript
import { mod, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(100n);
const b = fromBigInt(7n);
const result = mod(a, b);
// Returns: Uint256, throws on modulo by zero
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 100n;
const b = 7n;
const result = a % b;
// Returns: bigint, throws on modulo by zero
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 100n;
const b = 7n;
const result = a % b;
// Returns: bigint, throws on modulo by zero
```

---

#### pow

Exponentiation with overflow detection

**guil (@tevm/primitives)**

```typescript
import { pow, fromBigInt } from '@tevm/primitives/uint256';

const base = fromBigInt(2n);
const exponent = fromBigInt(10n);
const result = pow(base, exponent);
// Returns: Uint256, throws on overflow
```

**ethers**

```typescript
// Ethers uses native bigint operators
const base = 2n;
const exponent = 10n;
const result = base ** exponent;
// Returns: bigint, no overflow check
```

**viem**

```typescript
// Viem uses native bigint operators
const base = 2n;
const exponent = 10n;
const result = base ** exponent;
// Returns: bigint, no overflow check
```

---

### Comparison

Value comparison operations

#### compare

Three-way comparison (-1, 0, 1)

**guil (@tevm/primitives)**

```typescript
import { compare, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = compare(a, b);
// Returns: -1 (a < b)
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b ? -1 : a > b ? 1 : 0;
// Returns: -1 (a < b)
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b ? -1 : a > b ? 1 : 0;
// Returns: -1 (a < b)
```

---

#### eq

Equality comparison

**guil (@tevm/primitives)**

```typescript
import { eq, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(42n);
const result = eq(a, b);
// Returns: true
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 42n;
const b = 42n;
const result = a === b;
// Returns: true
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 42n;
const b = 42n;
const result = a === b;
// Returns: true
```

---

#### lt

Less than comparison

**guil (@tevm/primitives)**

```typescript
import { lt, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = lt(a, b);
// Returns: true
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b;
// Returns: true
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b;
// Returns: true
```

---

#### gt

Greater than comparison

**guil (@tevm/primitives)**

```typescript
import { gt, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(100n);
const b = fromBigInt(42n);
const result = gt(a, b);
// Returns: true
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 100n;
const b = 42n;
const result = a > b;
// Returns: true
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 100n;
const b = 42n;
const result = a > b;
// Returns: true
```

---

#### lte

Less than or equal comparison

**guil (@tevm/primitives)**

```typescript
import { lte, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = lte(a, b);
// Returns: true
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a <= b;
// Returns: true
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a <= b;
// Returns: true
```

---

#### gte

Greater than or equal comparison

**guil (@tevm/primitives)**

```typescript
import { gte, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(100n);
const b = fromBigInt(42n);
const result = gte(a, b);
// Returns: true
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 100n;
const b = 42n;
const result = a >= b;
// Returns: true
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 100n;
const b = 42n;
const result = a >= b;
// Returns: true
```

---

#### min

Return minimum of two values

**guil (@tevm/primitives)**

```typescript
import { min, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = min(a, b);
// Returns: Uint256 representing 42n
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b ? a : b;
// Returns: 42n
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a < b ? a : b;
// Returns: 42n
```

---

#### max

Return maximum of two values

**guil (@tevm/primitives)**

```typescript
import { max, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(42n);
const b = fromBigInt(100n);
const result = max(a, b);
// Returns: Uint256 representing 100n
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 42n;
const b = 100n;
const result = a > b ? a : b;
// Returns: 100n
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 42n;
const b = 100n;
const result = a > b ? a : b;
// Returns: 100n
```

---

### Bitwise

Bitwise operations on 256-bit values

#### and

Bitwise AND operation

**guil (@tevm/primitives)**

```typescript
import { and, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(0xffn);
const b = fromBigInt(0x0fn);
const result = and(a, b);
// Returns: Uint256 representing 0x0f
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 0xffn;
const b = 0x0fn;
const result = a & b;
// Returns: 0x0fn
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 0xffn;
const b = 0x0fn;
const result = a & b;
// Returns: 0x0fn
```

---

#### or

Bitwise OR operation

**guil (@tevm/primitives)**

```typescript
import { or, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(0xf0n);
const b = fromBigInt(0x0fn);
const result = or(a, b);
// Returns: Uint256 representing 0xff
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 0xf0n;
const b = 0x0fn;
const result = a | b;
// Returns: 0xffn
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 0xf0n;
const b = 0x0fn;
const result = a | b;
// Returns: 0xffn
```

---

#### xor

Bitwise XOR operation

**guil (@tevm/primitives)**

```typescript
import { xor, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(0xffn);
const b = fromBigInt(0x0fn);
const result = xor(a, b);
// Returns: Uint256 representing 0xf0
```

**ethers**

```typescript
// Ethers uses native bigint operators
const a = 0xffn;
const b = 0x0fn;
const result = a ^ b;
// Returns: 0xf0n
```

**viem**

```typescript
// Viem uses native bigint operators
const a = 0xffn;
const b = 0x0fn;
const result = a ^ b;
// Returns: 0xf0n
```

---

#### not

Bitwise NOT operation (within 256-bit range)

**guil (@tevm/primitives)**

```typescript
import { not, fromBigInt } from '@tevm/primitives/uint256';

const a = fromBigInt(0n);
const result = not(a);
// Returns: Uint256 representing MAX_UINT256
```

**ethers**

```typescript
// Ethers uses XOR with MAX_UINT256
const MAX_UINT256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
const a = 0n;
const result = MAX_UINT256 ^ a;
// Returns: MAX_UINT256
```

**viem**

```typescript
// Viem uses XOR with MAX_UINT256
const MAX_UINT256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
const a = 0n;
const result = MAX_UINT256 ^ a;
// Returns: MAX_UINT256
```

---

#### shl

Left shift operation with overflow detection

**guil (@tevm/primitives)**

```typescript
import { shl, fromBigInt } from '@tevm/primitives/uint256';

const value = fromBigInt(0x1n);
const result = shl(value, 8);
// Returns: Uint256 representing 0x100, throws on overflow
```

**ethers**

```typescript
// Ethers uses native bigint operators
const value = 0x1n;
const result = value << 8n;
// Returns: 0x100n, no overflow check
```

**viem**

```typescript
// Viem uses native bigint operators
const value = 0x1n;
const result = value << 8n;
// Returns: 0x100n, no overflow check
```

---

#### shr

Right shift operation

**guil (@tevm/primitives)**

```typescript
import { shr, fromBigInt } from '@tevm/primitives/uint256';

const value = fromBigInt(0x100n);
const result = shr(value, 8);
// Returns: Uint256 representing 0x1
```

**ethers**

```typescript
// Ethers uses native bigint operators
const value = 0x100n;
const result = value >> 8n;
// Returns: 0x1n
```

**viem**

```typescript
// Viem uses native bigint operators
const value = 0x100n;
const result = value >> 8n;
// Returns: 0x1n
```

---

## Running Benchmarks

### Run All Benchmarks
```bash
# Run all uint256 benchmarks
bun run vitest bench comparisons/uint256

# Run specific category
bun run vitest bench comparisons/uint256/conversions
bun run vitest bench comparisons/uint256/arithmetic
bun run vitest bench comparisons/uint256/comparison
bun run vitest bench comparisons/uint256/bitwise
```

### Run Individual Benchmarks
```bash
# Conversion benchmarks
bun run vitest bench comparisons/uint256/conversions/fromBigInt.bench.ts
bun run vitest bench comparisons/uint256/conversions/toBigInt.bench.ts
bun run vitest bench comparisons/uint256/conversions/fromHex.bench.ts
bun run vitest bench comparisons/uint256/conversions/toHex.bench.ts
bun run vitest bench comparisons/uint256/conversions/fromBytes.bench.ts
bun run vitest bench comparisons/uint256/conversions/toBytes.bench.ts

# Arithmetic benchmarks
bun run vitest bench comparisons/uint256/arithmetic/add.bench.ts
bun run vitest bench comparisons/uint256/arithmetic/sub.bench.ts
bun run vitest bench comparisons/uint256/arithmetic/mul.bench.ts
bun run vitest bench comparisons/uint256/arithmetic/div.bench.ts
bun run vitest bench comparisons/uint256/arithmetic/mod.bench.ts
bun run vitest bench comparisons/uint256/arithmetic/pow.bench.ts

# Comparison benchmarks
bun run vitest bench comparisons/uint256/comparison/compare.bench.ts
bun run vitest bench comparisons/uint256/comparison/eq.bench.ts
bun run vitest bench comparisons/uint256/comparison/lt.bench.ts
bun run vitest bench comparisons/uint256/comparison/gt.bench.ts
bun run vitest bench comparisons/uint256/comparison/lte.bench.ts
bun run vitest bench comparisons/uint256/comparison/gte.bench.ts
bun run vitest bench comparisons/uint256/comparison/min.bench.ts
bun run vitest bench comparisons/uint256/comparison/max.bench.ts

# Bitwise benchmarks
bun run vitest bench comparisons/uint256/bitwise/and.bench.ts
bun run vitest bench comparisons/uint256/bitwise/or.bench.ts
bun run vitest bench comparisons/uint256/bitwise/xor.bench.ts
bun run vitest bench comparisons/uint256/bitwise/not.bench.ts
bun run vitest bench comparisons/uint256/bitwise/shl.bench.ts
bun run vitest bench comparisons/uint256/bitwise/shr.bench.ts
```

## Implementation Notes

### guil (@tevm/primitives)
- Branded type system prevents mixing Uint256 with plain strings
- All operations validate inputs and check for overflow/underflow
- Returns Uint256 branded type from all operations
- Throws descriptive errors on invalid operations

### ethers
- Uses native bigint for all numeric operations
- Provides utility functions for conversions (toBeHex, toBigInt, etc.)
- No bounds checking - can exceed uint256 range
- Minimal API surface - relies on language features

### viem
- Uses native bigint for all numeric operations
- Provides utility functions for conversions (toHex, hexToBigInt, etc.)
- No bounds checking - can exceed uint256 range
- Minimal API surface - relies on language features

## When to Use Each

**Use guil when:**
- You need type safety and want to prevent bugs at compile time
- You want overflow/underflow protection
- You're building mission-critical applications handling user funds
- You prefer explicit APIs over operators

**Use ethers/viem when:**
- You want minimal abstractions over native bigint
- Performance is critical (native operators are fastest)
- You're comfortable managing bounds checking yourself
- You prefer concise code using language operators

## Architecture

```
comparisons/uint256/
├── conversions/          # Conversion operations
│   ├── fromBigInt-*.ts
│   ├── toBigInt-*.ts
│   ├── fromHex-*.ts
│   ├── toHex-*.ts
│   ├── fromBytes-*.ts
│   └── toBytes-*.ts
├── arithmetic/           # Arithmetic operations
│   ├── add-*.ts
│   ├── sub-*.ts
│   ├── mul-*.ts
│   ├── div-*.ts
│   ├── mod-*.ts
│   └── pow-*.ts
├── comparison/           # Comparison operations
│   ├── compare-*.ts
│   ├── eq-*.ts
│   ├── lt-*.ts
│   ├── gt-*.ts
│   ├── lte-*.ts
│   ├── gte-*.ts
│   ├── min-*.ts
│   └── max-*.ts
├── bitwise/              # Bitwise operations
│   ├── and-*.ts
│   ├── or-*.ts
│   ├── xor-*.ts
│   ├── not-*.ts
│   ├── shl-*.ts
│   └── shr-*.ts
└── docs.ts               # This documentation generator
```

## Related Documentation

- [Uint256 API Documentation](../../src/primitives/uint-utils/README.md)
- [Ethers Documentation](https://docs.ethers.org/)
- [Viem Documentation](https://viem.sh/)
