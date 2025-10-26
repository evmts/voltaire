# Batch 5: Extended API Coverage - Implementation Plan

## Overview

Based on comprehensive API audits, we've identified **40-50 additional high-value utility functions** that should be benchmarked. This batch focuses on frequently-used helper functions that exist in ethers/viem.

## Current Status
- ✅ 101 benchmarks completed across 20 categories
- ✅ Core primitives fully covered
- 🎯 Next: Extended utilities and convenience functions

---

## Batch 5 Tasks (8 Agents in Parallel)

### Agent 1: Data Padding & Trimming
**Category**: `comparisons/data-padding/`

**Functions to Benchmark** (5 total):
1. **padLeft** - Pad hex/bytes on left to specific size
   - Ethers: `zeroPadValue(value, length)`
   - Viem: `pad(value, { size: 32 })` or `padHex(value, { size: 32 })`
   - Guil: Check if exists, otherwise use Bytes.padLeft or implement

2. **padRight** - Pad hex/bytes on right to specific size
   - Ethers: `zeroPadBytes(value, length)`
   - Viem: `pad(value, { dir: 'right', size: 32 })`
   - Guil: Bytes.padRight or implement

3. **trim** - Remove leading zeros
   - Ethers: `stripZerosLeft(value)` (deprecated but still works)
   - Viem: `trim(value)` or `trim(value, { dir: 'left' })`
   - Guil: Bytes.trimLeft or implement

4. **trimRight** - Remove trailing zeros
   - Ethers: Not directly available
   - Viem: `trim(value, { dir: 'right' })`
   - Guil: Bytes.trimRight or implement

5. **size** - Get byte size of hex or bytes
   - Ethers: `dataLength(value)`
   - Viem: `size(value)`
   - Guil: Bytes.size or .length

**Test Data**:
- Empty: `0x`
- Short: `0x01`
- 32 bytes: `0x0000000000000000000000000000000000000000000000000000000000000001`
- Leading zeros: `0x000000abcd`
- Trailing zeros: `0xabcd000000`

**Structure**: Follow keccak256 pattern with guil.ts, ethers.ts, viem.ts, bench.ts, docs.ts

---

### Agent 2: ENS Utilities
**Category**: `comparisons/ens/`

**Functions to Benchmark** (3 total):
1. **namehash** - Compute ENS namehash
   - Ethers: `ethers.namehash(name)`
   - Viem: `namehash(name)` from `viem/ens`
   - Guil: Not available, document as missing

2. **labelhash** - Compute single label hash
   - Ethers: Not directly available (use `ethers.id(label)`)
   - Viem: `labelhash(label)` from `viem/ens`
   - Guil: Not available

3. **normalize** - Normalize ENS name (ENSIP-15)
   - Ethers: `ethers.ensNormalize(name)`
   - Viem: `normalize(name)` from `viem/ens`
   - Guil: Not available

**Test Data**:
- Simple: `'vitalik.eth'`
- Subdomain: `'sub.vitalik.eth'`
- Unicode: `'Āгрой.eth'` (should normalize)
- Empty: `''`
- Root: `'eth'`

**Note**: For guil, create docs.md explaining these are not implemented, show ethers/viem examples only.

---

### Agent 3: String Encoding
**Category**: `comparisons/string-encoding/`

**Functions to Benchmark** (4 total):
1. **stringToBytes** - UTF-8 string to Uint8Array
   - Ethers: `ethers.toUtf8Bytes(str)`
   - Viem: `stringToBytes(str)` from `viem/utils`
   - Guil: Use TextEncoder or implement

2. **bytesToString** - Uint8Array to UTF-8 string
   - Ethers: `ethers.toUtf8String(bytes)`
   - Viem: `bytesToString(bytes)` from `viem/utils`
   - Guil: Use TextDecoder or implement

3. **stringToHex** - UTF-8 string to hex
   - Ethers: `ethers.hexlify(ethers.toUtf8Bytes(str))`
   - Viem: `stringToHex(str)` from `viem/utils`
   - Guil: Combine string to bytes + bytes to hex

4. **hexToString** - Hex to UTF-8 string
   - Ethers: `ethers.toUtf8String(ethers.getBytes(hex))`
   - Viem: `hexToString(hex)` from `viem/utils`
   - Guil: Combine hex to bytes + bytes to string

**Test Data**:
- Simple: `'Hello, World!'`
- Empty: `''`
- Unicode: `'Hello 世界 🌍'`
- Long: 1000 character string

---

### Agent 4: Solidity Packed Hashing
**Category**: `comparisons/solidity-packed/`

**Functions to Benchmark** (2 total):
1. **solidityPackedKeccak256** - keccak256(abi.encodePacked(...))
   - Ethers: `ethers.solidityPackedKeccak256(types, values)`
   - Viem: Manual: `keccak256(encodePacked(types, values))`
   - Guil: Manual composition

2. **solidityPackedSha256** - sha256(abi.encodePacked(...))
   - Ethers: `ethers.solidityPackedSha256(types, values)`
   - Viem: Manual: `sha256(encodePacked(types, values))`
   - Guil: Manual composition (if sha256 available)

**Test Data**:
```typescript
// For CREATE2 address calculation
types: ['address', 'bytes32']
values: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1', '0x0000...0001']

// For signature verification
types: ['string', 'address', 'uint256']
values: ['Transfer', '0x...', 100n]
```

**Note**: These are convenience functions wrapping encodePacked + hash

---

### Agent 5: ABI Extensions (Part 1)
**Category**: `comparisons/abi-extended/`

**Functions to Benchmark** (4 total):
1. **parseAbi** - Parse human-readable ABI to structured format
   - Ethers: `new ethers.Interface([...signatures])` (constructor parses)
   - Viem: `parseAbi([...signatures])`
   - Guil: Not available

2. **parseAbiItem** - Parse single ABI item
   - Ethers: `ethers.Fragment.from(signature)`
   - Viem: `parseAbiItem(signature)`
   - Guil: Not available

3. **getAbiItem** - Extract specific item from ABI
   - Ethers: `interface.getFunction(nameOrSelector)`
   - Viem: `getAbiItem({ abi, name })`
   - Guil: Not available

4. **toFunctionSelector** - Get 4-byte selector from signature
   - Ethers: `interface.getFunction(name).selector` or `ethers.id(sig).slice(0, 10)`
   - Viem: `toFunctionSelector(signature)`
   - Guil: May already exist as `computeSelector`

**Test Data**:
- Simple function: `'function balanceOf(address owner) view returns (uint256)'`
- Overloaded: `'function transfer(address to, uint256 amount)'`
- Event: `'event Transfer(address indexed from, address indexed to, uint256 value)'`
- Error: `'error InsufficientBalance(uint256 available, uint256 required)'`

---

### Agent 6: ABI Extensions (Part 2) - Events & Errors
**Category**: `comparisons/abi-events/`

**Functions to Benchmark** (4 total):
1. **encodeEventTopics** - Encode event parameters to topics array
   - Ethers: `interface.encodeFilterTopics(eventName, values)`
   - Viem: `encodeEventTopics({ abi, eventName, args })`
   - Guil: Not available

2. **decodeEventLog** - Decode event log data and topics
   - Ethers: `interface.parseLog({ data, topics })`
   - Viem: `decodeEventLog({ abi, data, topics })`
   - Guil: Not available

3. **encodeErrorResult** - Encode custom error
   - Ethers: `interface.encodeErrorResult(errorName, values)`
   - Viem: `encodeErrorResult({ abi, errorName, args })`
   - Guil: Not available

4. **decodeErrorResult** - Decode custom error from revert data
   - Ethers: `interface.parseError(data)`
   - Viem: `decodeErrorResult({ abi, data })`
   - Guil: Not available

**Test Data**:
```typescript
// Transfer event
abi: [{ type: 'event', name: 'Transfer', inputs: [...] }]
data: '0x...' (uint256 value)
topics: ['0x...', '0x...from', '0x...to']

// Custom error
abi: [{ type: 'error', name: 'InsufficientBalance', inputs: [...] }]
data: '0x...' (encoded error)
```

---

### Agent 7: Wallet Generation
**Category**: `comparisons/wallet-generation/`

**Functions to Benchmark** (5 total):
1. **generatePrivateKey** - Generate random private key
   - Ethers: `ethers.Wallet.createRandom().privateKey` or `ethers.randomBytes(32)`
   - Viem: `generatePrivateKey()`
   - Guil: Use @noble/curves: `secp256k1.utils.randomPrivateKey()`

2. **privateKeyToPublicKey** - Derive public key from private key
   - Ethers: `new ethers.SigningKey(privateKey).publicKey`
   - Viem: Not directly exposed (use @noble/curves)
   - Guil: Use @noble/curves: `secp256k1.getPublicKey(privateKey)`

3. **publicKeyToAddress** - Derive address from public key
   - Ethers: `ethers.computeAddress(publicKey)`
   - Viem: `publicKeyToAddress(publicKey)`
   - Guil: keccak256(publicKey)[12:]

4. **privateKeyToAddress** - Derive address from private key (convenience)
   - Ethers: `new ethers.Wallet(privateKey).address`
   - Viem: `privateKeyToAccount(privateKey).address`
   - Guil: Combine above operations

5. **compressPublicKey** - Convert uncompressed to compressed
   - Ethers: `SigningKey.computePublicKey(publicKey, true)`
   - Viem: Not exposed
   - Guil: Use @noble/curves: `Point.fromHex(pubkey).toHex(true)`

**Test Data**:
- Test private key: `0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`
- Expected address: Derive and verify
- Test public keys: Compressed and uncompressed formats

**Note**: Use @noble libraries for guil since native implementations are unaudited.

---

### Agent 8: Number Formatting & Utilities
**Category**: `comparisons/number-formatting/`

**Functions to Benchmark** (4 total):
1. **toQuantity** - Format for JSON-RPC (strip leading zeros)
   - Ethers: `ethers.toQuantity(value)`
   - Viem: `numberToHex(value)` or `toHex(value)`
   - Guil: Custom implementation

2. **toBeHex** - BigInt to big-endian hex with padding
   - Ethers: `ethers.toBeHex(value, width?)`
   - Viem: `toHex(value, { size: 32 })`
   - Guil: Custom implementation

3. **toBeArray** - BigInt to big-endian byte array
   - Ethers: `ethers.toBeArray(value)`
   - Viem: `toBytes(value)` or `numberToBytes(value)`
   - Guil: Custom implementation

4. **mask** - Apply bitmask to value
   - Ethers: `ethers.mask(value, bits)`
   - Viem: Manual: `value & ((1n << BigInt(bits)) - 1n)`
   - Guil: Manual bitwise operation

**Test Data**:
- Zero: `0n`
- Small: `42n`
- Large: `0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn`
- Negative (for mask): Test various bit widths (8, 16, 32, 64, 128, 256)

---

## Implementation Guidelines (All Agents)

### File Structure (Follow keccak256 pattern):
```
comparisons/category-name/
├── function-name/
│   ├── guil.ts          # Export main(): void
│   ├── ethers.ts        # Export main(): void
│   └── viem.ts          # Export main(): void
├── function-name.bench.ts
├── docs.ts              # Documentation generator
└── README.md            # Category overview
```

### Each Implementation File:
```typescript
// Import the function
import { functionName } from 'library';

// Define test data (consistent across all 3 implementations)
const testData = ...;

// Export main function
export function main(): void {
  functionName(testData);
}
```

### Each Benchmark File:
```typescript
import { bench, describe } from 'vitest';
import * as guil from './function-name/guil.js';
import * as ethers from './function-name/ethers.js';
import * as viem from './function-name/viem.js';

describe('functionName', () => {
  bench('guil', () => { guil.main(); });
  bench('ethers', () => { ethers.main(); });
  bench('viem', () => { viem.main(); });
});
```

### When Guil Implementation Missing:
1. Check if functionality exists in @noble libraries (hashes, curves, ciphers)
2. If yes, use @noble directly (like keccak256 example)
3. If no, create simple TypeScript implementation
4. Document in README.md that native implementation pending

### Test Data Guidelines:
- Use identical data across all 3 implementations
- Include edge cases: empty, zero, max values
- Use realistic Ethereum values (addresses, hashes, etc.)
- Pre-define constants to avoid allocation in benchmark loop

---

## Verification Checklist (Each Agent)

Before marking complete:
- [ ] All functions have guil.ts, ethers.ts, viem.ts files
- [ ] All functions have .bench.ts files
- [ ] Test data is identical across implementations
- [ ] Each implementation exports `main(): void`
- [ ] Imports use correct paths (.js extension for ESM)
- [ ] Created docs.ts with documentation generator
- [ ] Created README.md with category overview
- [ ] Verified at least one benchmark runs successfully
- [ ] Documented any missing guil implementations

---

## Expected Output (Each Agent)

1. **File Count**: 4-5 functions × 4 files each = 16-20 new files per agent
2. **Benchmark Count**: 4-5 new benchmarks per category
3. **Documentation**: 1 README.md + 1 docs.ts per category
4. **Total for Batch 5**: ~40 new benchmarks across 8 categories

---

## Running the Benchmarks

After completion:
```bash
# Run single category
bun run vitest bench comparisons/data-padding/ --run

# Run all new categories
bun run vitest bench comparisons/data-padding/ comparisons/ens/ comparisons/string-encoding/ --run

# Run everything
bun run vitest bench --run
```

---

## Success Criteria

✅ All 8 categories created
✅ 40+ new benchmarks implemented
✅ All benchmarks follow established pattern
✅ Documentation complete for each category
✅ At least 1 benchmark per category verified working
✅ Missing guil implementations clearly documented

---

## Priority Order (If Time Limited)

1. **HIGHEST**: Data Padding (Agent 1) - Most frequently used
2. **HIGH**: String Encoding (Agent 3) - Essential for messages
3. **HIGH**: Solidity Packed (Agent 4) - Common in contracts
4. **MEDIUM**: Wallet Generation (Agent 7) - Core wallet ops
5. **MEDIUM**: ABI Extensions (Agents 5-6) - Developer tools
6. **LOW**: ENS (Agent 2) - Niche but important
7. **LOW**: Number Formatting (Agent 8) - Nice to have

---

## Notes

- **Async Operations**: Some wallet generation functions may be async, handle with async main()
- **@noble Libraries**: Available as dependencies, use freely
- **Import Paths**: Remember .js extension for ESM imports
- **Test Validation**: Verify outputs match across libraries when possible
- **Performance**: Focus on correctness first, optimization later

---

Total Estimated New Benchmarks: **~40-45**
Total Estimated New Files: **~160-180**
Batch Completion Time: **2-4 hours** (with 8 parallel agents)
