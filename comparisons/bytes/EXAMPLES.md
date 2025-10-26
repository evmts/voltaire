# Bytes Benchmarks - Usage Examples

## Quick Start

### Run All Bytes Benchmarks

```bash
bun vitest comparisons/bytes/*.bench.ts
```

### Run Specific Benchmark

```bash
# Bytes constructor benchmark
bun vitest comparisons/bytes/Bytes.bench.ts

# Concatenation benchmark
bun vitest comparisons/bytes/concatBytes.bench.ts

# Type guards benchmark
bun vitest comparisons/bytes/typeGuards.bench.ts
```

### Run with Verbose Output

```bash
bun vitest comparisons/bytes/*.bench.ts --reporter=verbose
```

## Example Output

```
✓ comparisons/bytes/Bytes.bench.ts (3)
  ✓ Bytes constructor (3)
    name               hz     min     max    mean     p75     p99    p995    p999     rme  samples
    · guil      1,234,567  0.0008  0.0012  0.0008  0.0009  0.0011  0.0011  0.0012  ±0.50%   617284
    · ethers    1,123,456  0.0009  0.0013  0.0009  0.0010  0.0012  0.0012  0.0013  ±0.55%   561729
    · viem      1,456,789  0.0007  0.0011  0.0007  0.0008  0.0010  0.0010  0.0011  ±0.45%   728395
```

## Testing Individual Implementations

### Guil Implementation

```bash
# Test Bytes constructor
bun run comparisons/bytes/Bytes/guil.ts

# Test concat
bun run comparisons/bytes/concatBytes/guil.ts

# Test type guards
bun run comparisons/bytes/typeGuards/guil.ts
```

### Ethers Implementation

```bash
# Test bytesToUint8Array
bun run comparisons/bytes/bytesToUint8Array/ethers.ts

# Test slice
bun run comparisons/bytes/sliceBytes/ethers.ts
```

### Viem Implementation

```bash
# Test length
bun run comparisons/bytes/bytesLength/viem.ts

# Test byte to number
bun run comparisons/bytes/byteToNumber/viem.ts
```

## Code Examples

### 1. Bytes Constructor Comparison

#### Guil (@tevm/primitives)
```typescript
import { Bytes } from '@tevm/primitives';

// Type-safe branded type
const bytes: Bytes = Bytes('0xff'); // ✓ Compile-time type safety
const fromArray: Bytes = Bytes(new Uint8Array([0xff, 0xaa])); // ✓

// Will fail at compile time if used incorrectly
const invalid: Bytes = '0xff'; // ✗ Type error
```

#### Ethers
```typescript
import { hexlify } from 'ethers';

// Flexible utility function
const hex = hexlify('0xff'); // Returns string
const fromArray = hexlify(new Uint8Array([0xff, 0xaa]));

// No compile-time type safety
const anything = hexlify('0xff'); // Just a string
```

#### Viem
```typescript
import { toHex } from 'viem';

// Modern utility with TypeScript refinements
const hex = toHex('0xff'); // Returns Hex type
const fromArray = toHex(new Uint8Array([0xff, 0xaa]));
```

### 2. Concatenation Comparison

#### Guil (@tevm/primitives)
```typescript
import { Bytes, concatBytes } from '@tevm/primitives';

const part1 = Bytes('0xff');
const part2 = Bytes('0xaa');
const part3 = Bytes('0x1234');

// Variadic function, type-safe
const result: Bytes = concatBytes(part1, part2, part3);
// result: Bytes = "0xffaa1234"
```

#### Ethers
```typescript
import { concat } from 'ethers';

const part1 = '0xff';
const part2 = '0xaa';
const part3 = '0x1234';

// Takes array of BytesLike
const result = concat([part1, part2, part3]);
// result: string = "0xffaa1234"
```

#### Viem
```typescript
import { concat } from 'viem';

const part1 = '0xff';
const part2 = '0xaa';
const part3 = '0x1234';

// Takes array, optimized implementation
const result = concat([part1, part2, part3]);
// result: Hex = "0xffaa1234"
```

### 3. Slicing Comparison

#### Guil (@tevm/primitives)
```typescript
import { Bytes, sliceBytes } from '@tevm/primitives';

const bytes = Bytes('0x' + '00'.repeat(32)); // 32 bytes

// Extract first 4 bytes
const first4: Bytes = sliceBytes(bytes, 0, 4);

// Extract from position to end
const fromPosition: Bytes = sliceBytes(bytes, 16);

// Type-safe: can only slice Bytes, returns Bytes
```

#### Ethers
```typescript
import { dataSlice } from 'ethers';

const bytes = '0x' + '00'.repeat(32);

// Extract first 4 bytes
const first4 = dataSlice(bytes, 0, 4);

// Extract from position to end
const fromPosition = dataSlice(bytes, 16);
```

#### Viem
```typescript
import { slice } from 'viem';

const bytes = '0x' + '00'.repeat(32);

// Extract first 4 bytes
const first4 = slice(bytes, 0, 4);

// Extract from position to end
const fromPosition = slice(bytes, 16);
```

### 4. Type Guards Comparison

#### Guil (@tevm/primitives)
```typescript
import { isBytes, isByte, Bytes, Byte } from '@tevm/primitives';

// Separate type guards for Bytes and Byte
if (isBytes(value)) {
  const bytes: Bytes = value; // Type narrowed to Bytes
}

if (isByte(value)) {
  const byte: Byte = value; // Type narrowed to Byte
}

// Validates even-length hex for Bytes
isBytes('0x1234'); // true
isBytes('0x123');  // false (odd length)

// Validates 0-2 hex chars for Byte
isByte('0xff');   // true
isByte('0x100');  // false (too long)
```

#### Ethers
```typescript
import { isHexString } from 'ethers';

// General hex validation
if (isHexString(value)) {
  // value is a valid hex string
}

// With length constraint
if (isHexString(value, 1)) {
  // value is exactly 1 byte
}

// No type narrowing to branded types
```

#### Viem
```typescript
import { isHex } from 'viem';

// Simple hex validation
if (isHex(value)) {
  // value is valid hex format
}

// With size constraint
if (isHex(value, { size: 1 })) {
  // value is exactly 1 byte
}
```

## Benchmarking Tips

### 1. Warm-up Runs
```bash
# Run once to warm up, then run again for accurate results
bun vitest comparisons/bytes/*.bench.ts
bun vitest comparisons/bytes/*.bench.ts
```

### 2. Isolate Operations
```bash
# Benchmark one operation at a time for clearer results
bun vitest comparisons/bytes/Bytes.bench.ts
bun vitest comparisons/bytes/concatBytes.bench.ts
```

### 3. Compare Specific Operations
```bash
# Focus on operations relevant to your use case
bun vitest comparisons/bytes/bytesToUint8Array.bench.ts
bun vitest comparisons/bytes/sliceBytes.bench.ts
```

### 4. Monitor System Load
- Close other applications
- Disable CPU throttling
- Run multiple times for statistical significance

## Interpreting Results

### Performance Metrics

- **hz**: Operations per second (higher is better)
- **mean**: Average time per operation (lower is better)
- **p99**: 99th percentile latency (consistency metric)
- **rme**: Relative margin of error (lower is better)

### What to Look For

1. **Throughput**: Which library has highest hz?
2. **Consistency**: Which has lowest p99 and rme?
3. **Trade-offs**: Performance vs type safety

### Expected Patterns

- **Constructor overhead**: Guil may be slower due to validation
- **String operations**: Should be comparable across libraries
- **Type guards**: Regex-based validation may vary
- **Conversions**: Byte array operations should be similar

## Generate Documentation

```bash
# Generate comprehensive markdown documentation
bun run comparisons/bytes/docs.ts > bytes-benchmark-results.md

# View documentation
cat bytes-benchmark-results.md
```

## Integration with CI/CD

```yaml
# Example GitHub Actions workflow
name: Benchmark Bytes Operations

on:
  push:
    paths:
      - 'src/primitives/branded-types/bytes.ts'
      - 'comparisons/bytes/**'

jobs:
  benchmark:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun vitest comparisons/bytes/*.bench.ts --reporter=json > results.json
      - uses: actions/upload-artifact@v3
        with:
          name: benchmark-results
          path: results.json
```

## Troubleshooting

### Import Errors

If you see import errors:
```bash
# Ensure dependencies are installed
bun install

# Check that the bytes module exists
ls -l src/primitives/branded-types/bytes.ts
```

### Benchmark Not Running

```bash
# Verify vitest is installed
bun vitest --version

# Run with debug output
bun vitest comparisons/bytes/Bytes.bench.ts --reporter=verbose
```

### Performance Outliers

- Clear Bun cache: `bun pm cache rm`
- Restart shell to clear environment
- Run on dedicated hardware without background tasks

## Next Steps

1. Run benchmarks and collect data
2. Analyze performance characteristics
3. Document findings in project README
4. Use results to guide optimization efforts
5. Set up continuous benchmarking in CI/CD
