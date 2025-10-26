# Hash32/Bytes32 Benchmarks - Complete Index

## Overview

Comprehensive benchmark suite for Hash32/Bytes32 branded type operations across three Ethereum libraries:
- **guil** (@tevm/primitives) - Type-safe branded types
- **ethers** (v6) - Traditional approach with plain types
- **viem** (v2) - Modern approach with generic Hex type

## Documentation Files

### 1. [README.md](./README.md)
Primary documentation covering:
- Directory structure and organization
- All benchmarked functions with signatures
- Type safety benefits and examples
- Key differences between libraries
- Running benchmarks
- Best practices for each library

### 2. [SUMMARY.md](./SUMMARY.md)
Quick reference including:
- Complete file listing
- Test verification results
- Next steps for benchmarking
- Files structure overview

### 3. [COMPARISON.md](./COMPARISON.md)
Detailed side-by-side comparisons:
- Quick reference table
- Seven operations compared in detail
- Code examples for each library
- Type safety deep dive
- Performance considerations
- Library selection guide

### 4. [docs.ts](./docs.ts)
Automated documentation generator:
- Generates markdown from benchmark results
- Includes type safety examples
- Creates comprehensive comparison tables
- Run after benchmarks complete

## Benchmark Implementations

### Constructor Operations
**Path**: `./constructor/`

Tests Hash32/Bytes32 construction from hex strings and Uint8Array.

- **guil.ts**: Branded type with automatic validation
- **ethers.ts**: Manual validation with getBytes/hexlify
- **viem.ts**: Hex type with manual length checking

**Test Data**:
- Hex: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- Bytes: 32-byte Uint8Array with sequential values (0-31)

### Conversion to Uint8Array
**Path**: `./toUint8Array/`

Tests conversion from Hash32 to byte array.

- **guil.ts**: `hash32ToUint8Array(hash: Hash32)`
- **ethers.ts**: `getBytes(hex: string)`
- **viem.ts**: `hexToBytes(hex: Hex)`

### Conversion to BigInt
**Path**: `./toBigInt/`

Tests conversion from Hash32 to bigint (big-endian unsigned integer).

- **guil.ts**: `hash32ToBigInt(hash: Hash32)`
- **ethers.ts**: `toBigInt(hex: string)`
- **viem.ts**: `hexToBigInt(hex: Hex)`

### Conversion from BigInt
**Path**: `./fromBigInt/`

Tests creating 32-byte Hash32 from bigint value.

- **guil.ts**: `bigIntToHash32(value: bigint)`
- **ethers.ts**: `zeroPadValue(toBeHex(value), 32)`
- **viem.ts**: `toHex(value, { size: 32 })`

**Test Data**: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn`

### Fill Operations
**Path**: `./fill/`

Tests creating Hash32 filled with specific byte value.

- **guil.ts**: `fillHash32(byte: number)`
- **ethers.ts**: `hexlify(new Uint8Array(32).fill(byte))`
- **viem.ts**: `bytesToHex(new Uint8Array(32).fill(byte))`

**Test Values**: 0x00, 0xff, 0x42

### Type Guards
**Path**: `./typeGuard/`

Tests validation of Hash32/Bytes32 format.

- **guil.ts**: `isHash32(value)` / `isBytes32(value)` with type narrowing
- **ethers.ts**: `isHexString(value, 32)` boolean validation
- **viem.ts**: `isHex(value, { size: 32 })` boolean validation

**Test Cases**:
- Valid: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- Invalid: `0x1234` (too short)
- Invalid: `not a hash` (not hex)

## File Tree

```
comparisons/hash32/
├── Documentation
│   ├── INDEX.md          (this file)
│   ├── README.md         (comprehensive guide)
│   ├── SUMMARY.md        (quick reference)
│   ├── COMPARISON.md     (detailed comparisons)
│   └── docs.ts           (auto-generator)
│
├── constructor/
│   ├── guil.ts           (Hash32 constructor)
│   ├── ethers.ts         (manual validation)
│   └── viem.ts           (Hex type validation)
│
├── toUint8Array/
│   ├── guil.ts           (hash32ToUint8Array)
│   ├── ethers.ts         (getBytes)
│   └── viem.ts           (hexToBytes)
│
├── toBigInt/
│   ├── guil.ts           (hash32ToBigInt)
│   ├── ethers.ts         (toBigInt)
│   └── viem.ts           (hexToBigInt)
│
├── fromBigInt/
│   ├── guil.ts           (bigIntToHash32)
│   ├── ethers.ts         (toBeHex + zeroPadValue)
│   └── viem.ts           (toHex with size)
│
├── fill/
│   ├── guil.ts           (fillHash32)
│   ├── ethers.ts         (hexlify + fill)
│   └── viem.ts           (bytesToHex + fill)
│
└── typeGuard/
    ├── guil.ts           (isHash32/isBytes32)
    ├── ethers.ts         (isHexString)
    └── viem.ts           (isHex)
```

## Statistics

- **Total Files**: 22 files
  - 18 benchmark implementations (6 operations × 3 libraries)
  - 4 documentation files
  - 1 documentation generator

- **Operations Tested**: 6
  1. Constructor (from hex and bytes)
  2. To Uint8Array
  3. To BigInt
  4. From BigInt
  5. Fill with byte pattern
  6. Type guards

- **Libraries Compared**: 3
  - guil (@tevm/primitives)
  - ethers (v6)
  - viem (v2)

## Quick Start

### 1. Run a Single Implementation
```bash
bun run comparisons/hash32/constructor/guil.ts
```

### 2. Run All Implementations for an Operation
```bash
bun run comparisons/hash32/constructor/guil.ts
bun run comparisons/hash32/constructor/ethers.ts
bun run comparisons/hash32/constructor/viem.ts
```

### 3. Run Benchmarks (requires vitest bench setup)
```bash
vitest bench comparisons/hash32/constructor.bench.ts
```

### 4. Generate Documentation (after benchmarks)
```bash
bun run comparisons/hash32/docs.ts
```

## Key Insights

### Type Safety Comparison

| Aspect | Guil | Ethers | Viem |
|--------|------|--------|------|
| **Type System** | Branded Hash32/Bytes32 | Plain string/Uint8Array | Generic Hex type |
| **Compile Safety** | ✅ Strong | ❌ None | ⚠️ Weak |
| **Runtime Validation** | ✅ Automatic | ⚠️ Manual | ⚠️ Manual |
| **Type Narrowing** | ✅ Yes | ❌ No | ⚠️ Limited |
| **Auto-complete** | ✅ Specific | ❌ Generic | ⚠️ Generic |
| **Prevents Mixing Types** | ✅ Yes | ❌ No | ❌ No |

### Performance Expectations

Based on similar benchmarks in this repository:

1. **Constructor**: Guil slightly slower due to validation (acceptable tradeoff)
2. **Conversions**: All libraries similar performance
3. **Type Guards**: All libraries use similar validation logic
4. **Overall**: Type safety benefits outweigh minimal overhead

### When to Use Each Library

**Use Guil when**:
- Type safety is critical
- Preventing bugs is priority #1
- Working on large codebases
- Need self-documenting code
- Want better IDE support

**Use Ethers when**:
- Maximum ecosystem compatibility needed
- Working with existing ethers codebase
- Need mature, battle-tested library
- Performance is not critical

**Use Viem when**:
- Maximum performance required
- Tree-shaking is important
- Modern TypeScript features needed
- Working with existing viem codebase

## Testing Status

All implementations have been tested and verified:

```
✓ All constructor implementations work
✓ All toUint8Array implementations work
✓ All toBigInt implementations work
✓ All fromBigInt implementations work
✓ All fill implementations work
✓ All type guard implementations work
```

## Next Steps

1. **Run Benchmarks**: Execute with vitest to measure actual performance
2. **Analyze Results**: Compare execution times across implementations
3. **Generate Docs**: Run docs.ts to create comprehensive reports
4. **CI Integration**: Add to continuous integration pipeline
5. **Performance Monitoring**: Track performance over time

## Related Benchmarks

Other benchmark suites in this repository:
- `/comparisons/address/` - Address operations
- `/comparisons/hex/` - Hex conversion utilities
- `/comparisons/rlp/` - RLP encoding/decoding
- `/comparisons/keccak256/` - Keccak hashing
- `/comparisons/transaction/` - Transaction operations

## Contributing

When adding new Hash32 operations:

1. Create new subdirectory: `comparisons/hash32/operation-name/`
2. Implement for all three libraries: `guil.ts`, `ethers.ts`, `viem.ts`
3. Each exports `main(): void` function
4. Use consistent test data
5. Update docs.ts to include new operation
6. Test all implementations

## References

- [Hash32 Source Code](../../../src/primitives/branded-types/hash.ts)
- [Guil Documentation](https://github.com/evmts/primitives)
- [Ethers Documentation](https://docs.ethers.org/)
- [Viem Documentation](https://viem.sh/)

## License

MIT - Same as parent project

---

**Status**: ✅ Complete and Ready for Benchmarking

All implementations are tested, documented, and ready for performance benchmarking.
