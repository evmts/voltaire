# Number Formatting Benchmarks

Benchmarks for number formatting utilities used in Ethereum applications.

## Functions

### toQuantity
Formats a number for JSON-RPC by stripping leading zeros. This is the standard format for encoding numeric values in Ethereum JSON-RPC calls where leading zeros should be omitted (e.g., `0x42` instead of `0x0042`).

**Use cases:**
- Block numbers and transaction indices
- Gas limits and nonces
- Chain IDs and network IDs

**Implementations:**
- **Guil**: Uses native `BigInt.toString(16)` for hex conversion
- **Ethers**: `ethers.toQuantity(value)`
- **Viem**: `numberToHex(value)`

### toBeHex
Converts BigInt to big-endian hex string with optional padding to a specific width. Essential for encoding numbers as fixed-width hex strings in smart contracts and transaction data.

**Use cases:**
- 32-byte padded values for storage slots
- Address padding for CREATE2 calculations
- Fixed-size numeric encoding in ABI

**Implementations:**
- **Guil**: Uses `toString(16)` with `padStart()` for width control
- **Ethers**: `ethers.toBeHex(value, width?)`
- **Viem**: `toHex(value, { size: 32 })`

### toBeArray
Converts BigInt to big-endian byte array (Uint8Array). Used for encoding numeric values as raw bytes for cryptographic operations and EVM data structures.

**Use cases:**
- Cryptographic operations requiring raw bytes
- Merkle tree construction
- EVM memory and storage operations

**Implementations:**
- **Guil**: Manual hex-to-bytes conversion with padding
- **Ethers**: `ethers.toBeArray(value)`
- **Viem**: `toBytes(value)`

### mask
Applies a bitmask to extract specific bits from a value. Used for bit manipulation, address masking, and extracting specific bit ranges from larger values.

**Use cases:**
- Address extraction from packed data
- Type identification from combined values
- Bit field operations in smart contracts

**Implementations:**
- **Guil**: Direct bitwise operation `value & ((1n << BigInt(bits)) - 1n)`
- **Ethers**: `ethers.mask(value, bits)`
- **Viem**: Direct bitwise operation `value & ((1n << BigInt(bits)) - 1n)`

## Implementation Notes

**Guil (@tevm/primitives)** implements number formatting using native JavaScript bigint operations:
- Minimal overhead with `toString(16)` for hex conversion
- Native `padStart()` for fixed-width formatting
- Manual byte array construction for binary formats
- Direct bitwise operations for masking

**Ethers** provides comprehensive utility functions:
- Well-tested utilities with consistent behavior
- Utility functions for all common formatting needs
- Handles edge cases and validation

**Viem** offers modern functional utilities:
- Performance-focused implementations
- Explicit options for customization (e.g., `{ size: 32 }`)
- Manual bitwise operations where appropriate

## Performance Considerations

1. **toQuantity**: Simple string operations make this very fast across all libraries
2. **toBeHex**: String padding overhead varies; native `padStart()` is generally efficient
3. **toBeArray**: Manual byte array construction may have overhead; library implementations are optimized
4. **mask**: Bitwise operations are extremely fast; no significant differences expected

## Test Data

```typescript
const testCases = {
  zero: 0n,
  small: 42n,
  medium: 0x00000042n,
  large: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
  maskValue: 0xabcdef123456789n,
  maskBits: [8, 16, 32, 64, 128, 256]
};
```

## Usage

Run all number formatting benchmarks:
```bash
bun run vitest bench comparisons/number-formatting/ --run
```

Run specific benchmarks:
```bash
bun run vitest bench comparisons/number-formatting/toQuantity.bench.ts --run
bun run vitest bench comparisons/number-formatting/toBeHex.bench.ts --run
bun run vitest bench comparisons/number-formatting/toBeArray.bench.ts --run
bun run vitest bench comparisons/number-formatting/mask.bench.ts --run
```

## Results Interpretation

- **ops/sec**: Operations per second (higher is better)
- **Relative performance**: Compare implementations for the same operation
- **Use case fit**: Consider both performance and API ergonomics for your use case
