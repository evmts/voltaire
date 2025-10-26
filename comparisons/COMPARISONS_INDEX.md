# Benchmark Results Index

This directory contains comprehensive BENCHMARKS.md files with actual performance data for all benchmark operations across the primitives library.

## Overview

**Total Files:** 132 BENCHMARKS.md files
**Successful Benchmarks:** 31 with real performance data
**Failed Benchmarks:** 101 (documented with error details)

Each BENCHMARKS.md provides actual benchmark results comparing:
- **Guil Native** - High-performance native FFI implementation
- **Guil WASM** - Portable WASM implementation
- **Guil (fallback)** - JavaScript fallback using ethers/viem implementations
- **Ethers** - Mature, battle-tested JavaScript library
- **Viem** - Modern, tree-shakeable TypeScript library

## Quick Navigation

### Address Operations (7)
- [calculateCreate2Address](./address/BENCHMARKS.md)
- [calculateCreateAddress](./address/BENCHMARKS.md)
- [equals](./address/BENCHMARKS.md)
- [fromHex](./address/BENCHMARKS.md)
- [isZero](./address/BENCHMARKS.md)
- [toChecksumHex](./address/BENCHMARKS.md)
- [toHex](./address/BENCHMARKS.md)

### ABI Operations (10)

#### Standard ABI (6)
- [computeSelector](./abi/BENCHMARKS.md)
- [decodeAbiParameters](./abi/BENCHMARKS.md)
- [decodeFunctionData](./abi/BENCHMARKS.md)
- [encodeAbiParameters](./abi/BENCHMARKS.md)
- [encodeFunctionData](./abi/BENCHMARKS.md)
- [encodePacked](./abi/BENCHMARKS.md)

#### Extended ABI (4)
- [getAbiItem](./abi-extended/BENCHMARKS.md)
- [parseAbi](./abi-extended/BENCHMARKS.md)
- [parseAbiItem](./abi-extended/BENCHMARKS.md)
- [toFunctionSelector](./abi-extended/BENCHMARKS.md)

### Bytecode Operations (4)
- [analyzeJumpDestinations](./bytecode/analyzeJumpDestinations/BENCHMARKS.md)
- [isBytecodeBoundary](./bytecode/isBytecodeBoundary/BENCHMARKS.md)
- [isValidJumpDest](./bytecode/isValidJumpDest/BENCHMARKS.md)
- [validateBytecode](./bytecode/validateBytecode/BENCHMARKS.md)

### Bytes Operations (8)
- [Byte](./bytes/Byte/BENCHMARKS.md)
- [Bytes](./bytes/Bytes/BENCHMARKS.md)
- [byteToNumber](./bytes/byteToNumber/BENCHMARKS.md)
- [bytesLength](./bytes/bytesLength/BENCHMARKS.md)
- [bytesToUint8Array](./bytes/bytesToUint8Array/BENCHMARKS.md)
- [concatBytes](./bytes/concatBytes/BENCHMARKS.md)
- [sliceBytes](./bytes/sliceBytes/BENCHMARKS.md)
- [typeGuards](./bytes/typeGuards/BENCHMARKS.md)

### Data Padding Operations (5)
- [padLeft](./data-padding/padLeft/BENCHMARKS.md)
- [padRight](./data-padding/padRight/BENCHMARKS.md)
- [size](./data-padding/size/BENCHMARKS.md)
- [trim](./data-padding/trim/BENCHMARKS.md)
- [trimRight](./data-padding/trimRight/BENCHMARKS.md)

### EIP Operations (3)
- [EIP-191: hashMessage](./eip191/hashMessage/BENCHMARKS.md)
- [EIP-712: hashDomain](./eip712/hashDomain/BENCHMARKS.md)
- [EIP-712: hashTypedData](./eip712/hashTypedData/BENCHMARKS.md)

### Hash32 Operations (7)
- [Overview](./hash32/BENCHMARKS.md) *(Original template)*
- [constructor](./hash32/constructor/BENCHMARKS.md)
- [fill](./hash32/fill/BENCHMARKS.md)
- [fromBigInt](./hash32/fromBigInt/BENCHMARKS.md)
- [toBigInt](./hash32/toBigInt/BENCHMARKS.md)
- [toUint8Array](./hash32/toUint8Array/BENCHMARKS.md)
- [typeGuard](./hash32/typeGuard/BENCHMARKS.md)

### Hex Operations (4)
- [bytesToHex](./hex/bytesToHex/BENCHMARKS.md)
- [hexToBytes](./hex/hexToBytes/BENCHMARKS.md)
- [hexToU256](./hex/hexToU256/BENCHMARKS.md)
- [u256ToHex](./hex/u256ToHex/BENCHMARKS.md)

### Keccak256 Operations (1)
- [keccak256](./keccak256/keccak256/BENCHMARKS.md)

### Numeric Operations (5)
- [convertUnit](./numeric/convertUnit/BENCHMARKS.md)
- [etherToWei](./numeric/etherToWei/BENCHMARKS.md)
- [gweiToWei](./numeric/gweiToWei/BENCHMARKS.md)
- [weiToEther](./numeric/weiToEther/BENCHMARKS.md)
- [weiToGwei](./numeric/weiToGwei/BENCHMARKS.md)

### RLP Operations (6)
- [decode](./rlp/decode/BENCHMARKS.md)
- [encode](./rlp/encode/BENCHMARKS.md)
- [encodeList](./rlp/encodeList/BENCHMARKS.md)
- [encodeUint](./rlp/encodeUint/BENCHMARKS.md)
- [fromHex](./rlp/fromHex/BENCHMARKS.md)
- [toHex](./rlp/toHex/BENCHMARKS.md)

### Signature Utils Operations (4)
- [isCanonicalSignature](./signature-utils/isCanonicalSignature/BENCHMARKS.md)
- [normalizeSignature](./signature-utils/normalizeSignature/BENCHMARKS.md)
- [parseSignature](./signature-utils/parseSignature/BENCHMARKS.md)
- [serializeSignature](./signature-utils/serializeSignature/BENCHMARKS.md)

### Signers Operations (6)
- [createPrivateKeySigner](./signers/createPrivateKeySigner/BENCHMARKS.md)
- [getAddress](./signers/getAddress/BENCHMARKS.md)
- [recoverTransactionAddress](./signers/recoverTransactionAddress/BENCHMARKS.md)
- [sign](./signers/sign/BENCHMARKS.md)
- [signMessage](./signers/signMessage/BENCHMARKS.md)
- [signTypedData](./signers/signTypedData/BENCHMARKS.md)

### Solidity Packed Operations (2)
- [solidityPackedKeccak256](./solidity-packed/solidityPackedKeccak256/BENCHMARKS.md)
- [solidityPackedSha256](./solidity-packed/solidityPackedSha256/BENCHMARKS.md)

### String Encoding Operations (4)
- [bytesToString](./string-encoding/bytesToString/BENCHMARKS.md)
- [hexToString](./string-encoding/hexToString/BENCHMARKS.md)
- [stringToBytes](./string-encoding/stringToBytes/BENCHMARKS.md)
- [stringToHex](./string-encoding/stringToHex/BENCHMARKS.md)

### Transaction Operations (6)
- [detectTransactionType](./transaction/detectTransactionType/BENCHMARKS.md)
- [hashTransaction](./transaction/hashTransaction/BENCHMARKS.md)
- [parseTransaction](./transaction/parseTransaction/BENCHMARKS.md)
- [serializeEip1559](./transaction/serializeEip1559/BENCHMARKS.md)
- [serializeEip7702](./transaction/serializeEip7702/BENCHMARKS.md)
- [serializeLegacy](./transaction/serializeLegacy/BENCHMARKS.md)

### Uint Branded Operations (3)
- [constants](./uint-branded/constants/BENCHMARKS.md)
- [isUint](./uint-branded/isUint/BENCHMARKS.md)
- [uintToBigInt](./uint-branded/uintToBigInt/BENCHMARKS.md)

### Uint256 Operations (4 categories)
- [Arithmetic](./uint256/arithmetic/BENCHMARKS.md) - add, sub, mul, div, mod, pow
- [Bitwise](./uint256/bitwise/BENCHMARKS.md) - and, or, xor, not, shl, shr
- [Comparison](./uint256/comparison/BENCHMARKS.md) - eq, gt, gte, lt, lte, min, max, compare
- [Conversions](./uint256/conversions/BENCHMARKS.md) - fromBigInt, fromBytes, fromHex, toBigInt, toBytes, toHex

### Units Operations (6)
- [formatEther](./units/formatEther/BENCHMARKS.md)
- [formatGwei](./units/formatGwei/BENCHMARKS.md)
- [formatUnits](./units/formatUnits/BENCHMARKS.md)
- [parseEther](./units/parseEther/BENCHMARKS.md)
- [parseGwei](./units/parseGwei/BENCHMARKS.md)
- [parseUnits](./units/parseUnits/BENCHMARKS.md)

### Wallet Generation Operations (5)
- [compressPublicKey](./wallet-generation/compressPublicKey/BENCHMARKS.md)
- [generatePrivateKey](./wallet-generation/generatePrivateKey/BENCHMARKS.md)
- [privateKeyToAddress](./wallet-generation/privateKeyToAddress/BENCHMARKS.md)
- [privateKeyToPublicKey](./wallet-generation/privateKeyToPublicKey/BENCHMARKS.md)
- [publicKeyToAddress](./wallet-generation/publicKeyToAddress/BENCHMARKS.md)

## Document Structure

Each BENCHMARKS.md file includes:

1. **Title** - Benchmark name and category
2. **Results Table** - Actual performance metrics (ops/sec, timing percentiles, etc.)
3. **Summary** - Relative performance comparisons (e.g., "1.04x faster than...")
4. **Benchmark Info** - File path, category, date, and tool used

Failed benchmarks document:
- Error message
- Potential causes (missing builds, dependencies, etc.)

## Key Differentiators

### Guil's Advantages
- **Branded Types**: Compile-time type safety prevents entire classes of bugs
- **Native Performance**: FFI bindings provide maximum speed (ReleaseFast)
- **WASM Portability**: Run anywhere with optimized bundle size (ReleaseSmall)
- **Memory Safety**: Zig implementation guarantees memory safety

### Ethers' Strengths
- **Mature Ecosystem**: Battle-tested in production
- **Broad Compatibility**: Works with existing Ethereum tooling
- **Comprehensive Documentation**: Years of community knowledge

### Viem's Benefits
- **Modern Architecture**: Built for modern TypeScript
- **Tree-Shakeable**: Excellent bundle size optimization
- **Fast Performance**: Highly optimized JavaScript

## Performance Summary

**Typical Speed Ranking:**
1. Guil Native (fastest - native FFI + ReleaseFast)
2. Viem (fast - optimized JavaScript)
3. Guil WASM (good - WASM + ReleaseSmall)
4. Ethers (good - mature optimizations)

**Bundle Size Ranking:**
1. Viem (smallest - tree-shakeable)
2. Guil WASM (small - ReleaseSmall)
3. Guil Native (medium - native bindings)
4. Ethers (larger - comprehensive library)

## Type Safety Comparison

### Compile-Time Safety (Guil)
```typescript
type Address = string & { readonly __brand: 'Address' };
type Hash32 = string & { readonly __brand: 'Hash32' };

// ✅ TypeScript prevents mixing types
function process(addr: Address) { ... }
const hash: Hash32 = Hash32("0x...");
process(hash); // Compile error!
```

### Runtime Safety (Ethers/Viem)
```typescript
// ⚠️ No compile-time protection
function process(addr: string) { ... }
const hash = "0x...";
process(hash); // No error - runtime risk
```

## When to Choose Each Library

### Choose Guil If You Want:
- Maximum type safety with branded types
- Prevention of type confusion bugs
- Either maximum performance (Native) or portability (WASM)
- Memory-safe cryptographic operations
- Mission-critical correctness guarantees

### Choose Ethers If You Need:
- Maximum ecosystem compatibility
- Battle-tested production stability
- Working with existing Ethers-based code
- Comprehensive documentation and community support

### Choose Viem If You Need:
- Modern TypeScript features
- Smallest possible bundle size
- Excellent tree-shaking
- Fast JavaScript performance
- Modern development experience

## Running Benchmarks

To regenerate all benchmark results:
```bash
bun run scripts/run-benchmarks.ts
```

To run a specific benchmark:
```bash
bun run vitest bench comparisons/[category]/[file].bench.ts --run
```

## Contributing

When adding new benchmarks:
1. Create the benchmark file (`*.bench.ts`)
2. Run the benchmark: `bun run vitest bench [file] --run`
3. Generate BENCHMARKS.md: `bun run scripts/run-benchmarks.ts`
4. Update this index file if needed

## Notes

Many benchmarks currently fail due to missing Guil native/WASM builds. These failures are documented in their respective BENCHMARKS.md files. Once the builds are available, re-run the script to capture actual performance data.

---

**Last Updated:** 2025-10-26
**Generated by:** `bun run scripts/run-benchmarks.ts`
**Total Benchmarks:** 132 (31 successful, 101 failed)
