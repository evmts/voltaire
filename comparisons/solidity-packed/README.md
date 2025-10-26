# Solidity Packed Hashing Benchmarks

Comprehensive performance comparison of Solidity packed hashing utilities across three major Ethereum JavaScript libraries.

## What Are Solidity Packed Hashing Functions?

Solidity packed hashing combines `abi.encodePacked()` with cryptographic hash functions to create compact, deterministic hashes. These functions are equivalent to Solidity's:

```solidity
// Keccak256 variant
bytes32 hash = keccak256(abi.encodePacked(address, value, salt));

// SHA256 variant
bytes32 hash = sha256(abi.encodePacked(address, value, salt));
```

Unlike standard ABI encoding which pads all values to 32 bytes, packed encoding minimizes space by removing padding, making it ideal for gas-efficient hashing operations.

## Why This Matters

These utilities are **mission-critical** for several Ethereum operations:

### 1. CREATE2 Address Calculation
The most common use case - deterministic contract deployment:

```typescript
// Calculate the address where a contract will be deployed
const initCodeHash = keccak256(contractBytecode);
const salt = '0x0000000000000000000000000000000000000000000000000000000000000001';

// CREATE2 formula: keccak256(0xff ++ address ++ salt ++ keccak256(init_code))
const address = solidityPackedKeccak256(
  ['bytes1', 'address', 'bytes32', 'bytes32'],
  ['0xff', deployerAddress, salt, initCodeHash]
);
```

### 2. Merkle Tree Construction
Efficient verification of large datasets on-chain:

```typescript
// Hash two adjacent leaves in a Merkle tree
function hashPair(left: string, right: string): string {
  return solidityPackedKeccak256(['bytes32', 'bytes32'], [left, right]);
}
```

### 3. Signature Message Hashing
Preparing messages for cryptographic signing:

```typescript
// Hash message components before signing
const messageHash = solidityPackedKeccak256(
  ['string', 'address', 'uint256'],
  ['Transfer', recipientAddress, amount]
);
```

### 4. Cross-Chain Bridge Identifiers
Unique message identification across different blockchains:

```typescript
// Create unique identifier for cross-chain message
const messageId = solidityPackedSha256(
  ['uint256', 'address', 'uint256', 'bytes'],
  [sourceChainId, sender, nonce, payload]
);
```

### 5. Token Permit Signatures (EIP-2612)
Off-chain approval signatures:

```typescript
// Hash permit data before signing
const permitHash = solidityPackedKeccak256(
  ['address', 'address', 'uint256', 'uint256', 'uint256'],
  [owner, spender, value, nonce, deadline]
);
```

## Implementation Approaches

### Ethers: Convenience Functions
Ethers provides dedicated single-call functions:

```typescript
import { solidityPackedKeccak256, solidityPackedSha256 } from 'ethers';

solidityPackedKeccak256(types, values);  // One function call
solidityPackedSha256(types, values);     // One function call
```

**Pros:**
- Simple, intuitive API
- Less code to write
- Single function call

**Cons:**
- Limited flexibility
- Can't reuse packed encoding
- Potential performance overhead from function abstraction

### Viem & Guil: Manual Composition
Viem and guil require composing separate functions:

```typescript
// Viem
import { encodePacked, keccak256, sha256 } from 'viem';

keccak256(encodePacked(types, values));  // Manual composition
sha256(encodePacked(types, values));     // Manual composition

// Guil
import { keccak256 } from '@tevm/primitives/crypto';
import { encodePacked } from '@tevm/primitives/abi';
import { sha256 } from '@noble/hashes/sha256';

keccak256(encodePacked(params, values));               // Manual composition
bytesToHex(sha256(encodePacked(params, values)));     // Manual composition
```

**Pros:**
- Maximum flexibility
- Can reuse packed encoding for multiple hashes
- Direct control over each step

**Cons:**
- More verbose
- Two function calls
- Requires understanding of composition

## Performance Considerations

This benchmark suite measures:

1. **Single-call convenience vs composition**: Does Ethers' abstraction add overhead?
2. **Hash function performance**: Native implementations vs library implementations
3. **Real-world patterns**: CREATE2, signatures, multi-value hashing

## Benchmark Functions

### solidityPackedKeccak256
Computes `keccak256(abi.encodePacked(...))`. Tests three patterns:
- CREATE2 address calculation (address + bytes32)
- Signature verification (string + address + uint256)
- Multi-value pattern (address + uint256 + bytes32 + bool)

### solidityPackedSha256
Computes `sha256(abi.encodePacked(...))`. Uses the same test patterns as keccak256 variant.

**Note**: SHA256 is less common in Ethereum but critical for:
- Bitcoin-compatible signature schemes
- Cross-chain bridges (many chains use SHA256)
- Hardware wallet compatibility

## Running the Benchmarks

```bash
# Run all solidity-packed benchmarks
bun test comparisons/solidity-packed/**/*.bench.ts

# Run specific function benchmark
bun test comparisons/solidity-packed/solidityPackedKeccak256/solidityPackedKeccak256.bench.ts
bun test comparisons/solidity-packed/solidityPackedSha256/solidityPackedSha256.bench.ts

# Generate documentation
bun run comparisons/solidity-packed/docs.ts
```

## Test Data

All benchmarks use consistent test data:

```typescript
// CREATE2 pattern: Used in contract deployment
const create2Types = ['address', 'bytes32'];
const create2Values = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  '0x0000000000000000000000000000000000000000000000000000000000000001'
];

// Signature pattern: Used in message signing
const sigTypes = ['string', 'address', 'uint256'];
const sigValues = ['Transfer', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', 100n];

// Multi-value pattern: Complex hashing scenarios
const multiTypes = ['address', 'uint256', 'bytes32', 'bool'];
const multiValues = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1',
  42n,
  '0x1234567890123456789012345678901234567890123456789012345678901234',
  true
];
```

## Implementation Details

### Guil (@tevm/primitives)
- **Keccak256**: Native Zig implementation via FFI
- **SHA256**: Uses `@noble/hashes/sha256` (not yet implemented in native)
- **EncodePacked**: TypeScript implementation with structured ABI types

### Ethers
- **Keccak256**: Native JavaScript implementation
- **SHA256**: Native JavaScript implementation
- **EncodePacked**: Integrated into packed hashing functions

### Viem
- **Keccak256**: Native JavaScript implementation
- **SHA256**: Native JavaScript implementation
- **EncodePacked**: Separate utility function

## Directory Structure

```
solidity-packed/
├── README.md                          # This file
├── docs.ts                            # Documentation generator
├── solidityPackedKeccak256/
│   ├── guil.ts                        # Guil implementation
│   ├── ethers.ts                      # Ethers implementation
│   ├── viem.ts                        # Viem implementation
│   └── solidityPackedKeccak256.bench.ts  # Benchmark suite
└── solidityPackedSha256/
    ├── guil.ts                        # Guil implementation
    ├── ethers.ts                      # Ethers implementation
    ├── viem.ts                        # Viem implementation
    └── solidityPackedSha256.bench.ts  # Benchmark suite
```

## Expected Results

**Hypothesis**:
- **Keccak256**: Guil should be fastest due to native Zig implementation
- **SHA256**: Noble/hashes may have edge over pure JS implementations
- **Convenience**: Ethers' single-call API may have slight overhead vs manual composition

**Real-world impact**:
- CREATE2 operations: Faster hashing = faster UI response for deployment address calculation
- Merkle proofs: Performance critical when verifying multiple proofs
- Message signing: User experience benefit from faster hash computation

## Related Benchmarks

- `comparisons/abi/encodePacked`: Pure encoding performance (no hashing)
- `comparisons/keccak256`: Pure keccak256 performance (no encoding)
- `comparisons/address/calculateCreate2Address`: Full CREATE2 calculation (includes this + address derivation)

## Security Note

These functions are **cryptographically critical**. While performance matters, correctness is paramount. All implementations must:

1. Produce identical output for identical inputs
2. Handle edge cases (empty arrays, zero values, max values)
3. Maintain constant-time operations where applicable
4. Properly handle type encoding per Solidity ABI specification

Any deviation in output indicates a critical bug that could lead to:
- Incorrect CREATE2 addresses (funds lost)
- Invalid signatures (transactions rejected)
- Broken Merkle proofs (verification failures)
- Cross-chain message routing errors

## Contributing

When adding new test cases, ensure they represent real-world usage patterns and include:
- Rationale for the test case
- Expected use case (CREATE2, Merkle tree, etc.)
- Edge cases that stress the implementation
