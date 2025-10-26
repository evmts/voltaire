# Library Comparison Documentation Index

This directory contains comprehensive COMPARISON.md files for all benchmark operations across the primitives library.

## Overview

**Total Files:** 100 COMPARISON.md files
**Template:** Based on `/comparisons/hash32/COMPARISON.md`

Each COMPARISON.md provides a detailed analysis comparing:
- **Guil Native** - High-performance native FFI implementation (ReleaseFast)
- **Guil WASM** - Portable WASM implementation (ReleaseSmall)
- **Ethers** - Mature, battle-tested JavaScript library
- **Viem** - Modern, tree-shakeable TypeScript library

## Quick Navigation

### Address Operations (7)
- [calculateCreate2Address](./address/calculateCreate2Address/COMPARISON.md)
- [calculateCreateAddress](./address/calculateCreateAddress/COMPARISON.md)
- [equals](./address/equals/COMPARISON.md)
- [fromHex](./address/fromHex/COMPARISON.md)
- [isZero](./address/isZero/COMPARISON.md)
- [toChecksumHex](./address/toChecksumHex/COMPARISON.md)
- [toHex](./address/toHex/COMPARISON.md)

### ABI Operations (10)

#### Standard ABI (6)
- [computeSelector](./abi/computeSelector/COMPARISON.md)
- [decodeAbiParameters](./abi/decodeAbiParameters/COMPARISON.md)
- [decodeFunctionData](./abi/decodeFunctionData/COMPARISON.md)
- [encodeAbiParameters](./abi/encodeAbiParameters/COMPARISON.md)
- [encodeFunctionData](./abi/encodeFunctionData/COMPARISON.md)
- [encodePacked](./abi/encodePacked/COMPARISON.md)

#### Extended ABI (4)
- [getAbiItem](./abi-extended/getAbiItem/COMPARISON.md)
- [parseAbi](./abi-extended/parseAbi/COMPARISON.md)
- [parseAbiItem](./abi-extended/parseAbiItem/COMPARISON.md)
- [toFunctionSelector](./abi-extended/toFunctionSelector/COMPARISON.md)

### Bytecode Operations (4)
- [analyzeJumpDestinations](./bytecode/analyzeJumpDestinations/COMPARISON.md)
- [isBytecodeBoundary](./bytecode/isBytecodeBoundary/COMPARISON.md)
- [isValidJumpDest](./bytecode/isValidJumpDest/COMPARISON.md)
- [validateBytecode](./bytecode/validateBytecode/COMPARISON.md)

### Bytes Operations (8)
- [Byte](./bytes/Byte/COMPARISON.md)
- [Bytes](./bytes/Bytes/COMPARISON.md)
- [byteToNumber](./bytes/byteToNumber/COMPARISON.md)
- [bytesLength](./bytes/bytesLength/COMPARISON.md)
- [bytesToUint8Array](./bytes/bytesToUint8Array/COMPARISON.md)
- [concatBytes](./bytes/concatBytes/COMPARISON.md)
- [sliceBytes](./bytes/sliceBytes/COMPARISON.md)
- [typeGuards](./bytes/typeGuards/COMPARISON.md)

### Data Padding Operations (5)
- [padLeft](./data-padding/padLeft/COMPARISON.md)
- [padRight](./data-padding/padRight/COMPARISON.md)
- [size](./data-padding/size/COMPARISON.md)
- [trim](./data-padding/trim/COMPARISON.md)
- [trimRight](./data-padding/trimRight/COMPARISON.md)

### EIP Operations (3)
- [EIP-191: hashMessage](./eip191/hashMessage/COMPARISON.md)
- [EIP-712: hashDomain](./eip712/hashDomain/COMPARISON.md)
- [EIP-712: hashTypedData](./eip712/hashTypedData/COMPARISON.md)

### Hash32 Operations (7)
- [Overview](./hash32/COMPARISON.md) *(Original template)*
- [constructor](./hash32/constructor/COMPARISON.md)
- [fill](./hash32/fill/COMPARISON.md)
- [fromBigInt](./hash32/fromBigInt/COMPARISON.md)
- [toBigInt](./hash32/toBigInt/COMPARISON.md)
- [toUint8Array](./hash32/toUint8Array/COMPARISON.md)
- [typeGuard](./hash32/typeGuard/COMPARISON.md)

### Hex Operations (4)
- [bytesToHex](./hex/bytesToHex/COMPARISON.md)
- [hexToBytes](./hex/hexToBytes/COMPARISON.md)
- [hexToU256](./hex/hexToU256/COMPARISON.md)
- [u256ToHex](./hex/u256ToHex/COMPARISON.md)

### Keccak256 Operations (1)
- [keccak256](./keccak256/keccak256/COMPARISON.md)

### Numeric Operations (5)
- [convertUnit](./numeric/convertUnit/COMPARISON.md)
- [etherToWei](./numeric/etherToWei/COMPARISON.md)
- [gweiToWei](./numeric/gweiToWei/COMPARISON.md)
- [weiToEther](./numeric/weiToEther/COMPARISON.md)
- [weiToGwei](./numeric/weiToGwei/COMPARISON.md)

### RLP Operations (6)
- [decode](./rlp/decode/COMPARISON.md)
- [encode](./rlp/encode/COMPARISON.md)
- [encodeList](./rlp/encodeList/COMPARISON.md)
- [encodeUint](./rlp/encodeUint/COMPARISON.md)
- [fromHex](./rlp/fromHex/COMPARISON.md)
- [toHex](./rlp/toHex/COMPARISON.md)

### Signature Utils Operations (4)
- [isCanonicalSignature](./signature-utils/isCanonicalSignature/COMPARISON.md)
- [normalizeSignature](./signature-utils/normalizeSignature/COMPARISON.md)
- [parseSignature](./signature-utils/parseSignature/COMPARISON.md)
- [serializeSignature](./signature-utils/serializeSignature/COMPARISON.md)

### Signers Operations (6)
- [createPrivateKeySigner](./signers/createPrivateKeySigner/COMPARISON.md)
- [getAddress](./signers/getAddress/COMPARISON.md)
- [recoverTransactionAddress](./signers/recoverTransactionAddress/COMPARISON.md)
- [sign](./signers/sign/COMPARISON.md)
- [signMessage](./signers/signMessage/COMPARISON.md)
- [signTypedData](./signers/signTypedData/COMPARISON.md)

### Solidity Packed Operations (2)
- [solidityPackedKeccak256](./solidity-packed/solidityPackedKeccak256/COMPARISON.md)
- [solidityPackedSha256](./solidity-packed/solidityPackedSha256/COMPARISON.md)

### String Encoding Operations (4)
- [bytesToString](./string-encoding/bytesToString/COMPARISON.md)
- [hexToString](./string-encoding/hexToString/COMPARISON.md)
- [stringToBytes](./string-encoding/stringToBytes/COMPARISON.md)
- [stringToHex](./string-encoding/stringToHex/COMPARISON.md)

### Transaction Operations (6)
- [detectTransactionType](./transaction/detectTransactionType/COMPARISON.md)
- [hashTransaction](./transaction/hashTransaction/COMPARISON.md)
- [parseTransaction](./transaction/parseTransaction/COMPARISON.md)
- [serializeEip1559](./transaction/serializeEip1559/COMPARISON.md)
- [serializeEip7702](./transaction/serializeEip7702/COMPARISON.md)
- [serializeLegacy](./transaction/serializeLegacy/COMPARISON.md)

### Uint Branded Operations (3)
- [constants](./uint-branded/constants/COMPARISON.md)
- [isUint](./uint-branded/isUint/COMPARISON.md)
- [uintToBigInt](./uint-branded/uintToBigInt/COMPARISON.md)

### Uint256 Operations (4 categories)
- [Arithmetic](./uint256/arithmetic/COMPARISON.md) - add, sub, mul, div, mod, pow
- [Bitwise](./uint256/bitwise/COMPARISON.md) - and, or, xor, not, shl, shr
- [Comparison](./uint256/comparison/COMPARISON.md) - eq, gt, gte, lt, lte, min, max, compare
- [Conversions](./uint256/conversions/COMPARISON.md) - fromBigInt, fromBytes, fromHex, toBigInt, toBytes, toHex

### Units Operations (6)
- [formatEther](./units/formatEther/COMPARISON.md)
- [formatGwei](./units/formatGwei/COMPARISON.md)
- [formatUnits](./units/formatUnits/COMPARISON.md)
- [parseEther](./units/parseEther/COMPARISON.md)
- [parseGwei](./units/parseGwei/COMPARISON.md)
- [parseUnits](./units/parseUnits/COMPARISON.md)

### Wallet Generation Operations (5)
- [compressPublicKey](./wallet-generation/compressPublicKey/COMPARISON.md)
- [generatePrivateKey](./wallet-generation/generatePrivateKey/COMPARISON.md)
- [privateKeyToAddress](./wallet-generation/privateKeyToAddress/COMPARISON.md)
- [privateKeyToPublicKey](./wallet-generation/privateKeyToPublicKey/COMPARISON.md)
- [publicKeyToAddress](./wallet-generation/publicKeyToAddress/COMPARISON.md)

## Document Structure

Each COMPARISON.md file includes:

1. **Title** - Operation name and category
2. **Quick Reference Table** - Side-by-side comparison
3. **Implementation Details** - Deep dive for each library
   - Guil Native (ReleaseFast optimization)
   - Guil WASM (ReleaseSmall optimization)
   - Ethers (battle-tested JavaScript)
   - Viem (modern TypeScript)
4. **Type Safety Deep Dive** - Branded types vs generic types
5. **Performance Considerations** - Speed and bundle size analysis
6. **Best Practices** - Recommended patterns per library
7. **When to Choose Each Library** - Decision guide
8. **Conclusion** - Summary and recommendations

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

## Generation

These files were generated using `/scripts/generate-comparisons.ts` to ensure consistency across all operations. The template is based on the manually crafted `/comparisons/hash32/COMPARISON.md` file.

To regenerate or add new comparisons:
```bash
npx tsx scripts/generate-comparisons.ts
```

## Contributing

When adding new benchmark operations:
1. Create the operation directory structure
2. Add benchmark files (`*.bench.ts`)
3. Run the generation script to create COMPARISON.md
4. Review and customize the generated comparison if needed
5. Update this index file

---

**Last Updated:** Generated October 25, 2025
**Script:** `/scripts/generate-comparisons.ts`
**Template:** `/comparisons/hash32/COMPARISON.md`
