# ABI Encoding/Decoding Benchmarks

Comprehensive performance comparison of ABI encoding and decoding implementations across guil (@tevm/primitives), ethers, and viem.

## Overview

This benchmark suite compares six core ABI operations:

1. **encodeAbiParameters** - Low-level parameter encoding
2. **decodeAbiParameters** - Low-level parameter decoding
3. **computeSelector** - Function selector generation (4-byte hash)
4. **encodeFunctionData** - Complete function call encoding (selector + params)
5. **decodeFunctionData** - Function call data decoding
6. **encodePacked** - Non-standard packed encoding (no padding)

## Benchmark Structure

Each function has three implementation files and one benchmark file:

```
comparisons/abi/
├── encodeAbiParameters-guil.ts      # @tevm/primitives implementation
├── encodeAbiParameters-ethers.ts    # ethers.js implementation
├── encodeAbiParameters-viem.ts      # viem implementation
├── encodeAbiParameters.bench.ts     # vitest benchmark
├── decodeAbiParameters-guil.ts
├── decodeAbiParameters-ethers.ts
├── decodeAbiParameters-viem.ts
├── decodeAbiParameters.bench.ts
├── computeSelector-guil.ts
├── computeSelector-ethers.ts
├── computeSelector-viem.ts
├── computeSelector.bench.ts
├── encodeFunctionData-guil.ts
├── encodeFunctionData-ethers.ts
├── encodeFunctionData-viem.ts
├── encodeFunctionData.bench.ts
├── decodeFunctionData-guil.ts
├── decodeFunctionData-ethers.ts
├── decodeFunctionData-viem.ts
├── decodeFunctionData.bench.ts
├── encodePacked-guil.ts
├── encodePacked-ethers.ts
├── encodePacked-viem.ts
├── encodePacked.bench.ts
└── docs.ts                          # Documentation generator
```

## Test Data

### Simple Cases
- Single `uint256` value
- Basic ERC-20 function signatures
- Single parameter types

### Complex Cases
- Multiple parameters: `address`, `bytes32`, `uint256[]`, `string`
- Multi-parameter functions (e.g., DEX swap with 5 parameters)
- Mixed static and dynamic types
- Various integer sizes (`uint8`, `uint16`, `uint32`)

## Running Benchmarks

Run individual benchmarks:
```bash
bun run vitest bench comparisons/abi/encodeAbiParameters.bench.ts
bun run vitest bench comparisons/abi/decodeAbiParameters.bench.ts
bun run vitest bench comparisons/abi/computeSelector.bench.ts
bun run vitest bench comparisons/abi/encodeFunctionData.bench.ts
bun run vitest bench comparisons/abi/decodeFunctionData.bench.ts
bun run vitest bench comparisons/abi/encodePacked.bench.ts
```

Run all ABI benchmarks:
```bash
bun run vitest bench comparisons/abi/
```

## Generating Documentation

Generate comprehensive documentation with code examples and benchmark results:
```bash
bun run comparisons/abi/docs.ts
```

## Implementation Notes

### Guil (@tevm/primitives)
- Located in `/src/primitives/abi.ts`
- TypeScript implementation with explicit ABI types
- Direct `keccak_256` from `@noble/hashes`
- Manual encoding/decoding with proper offset handling

### Ethers
- Uses `AbiCoder.defaultAbiCoder()` for encode/decode
- `Interface` class for function data
- `id()` function for selector generation
- `solidityPacked()` for packed encoding

### Viem
- Functional API with typed parameters
- `encodeAbiParameters()` / `decodeAbiParameters()`
- `encodeFunctionData()` / `decodeFunctionData()`
- `keccak256()` + `toHex()` for selectors
- `encodePacked()` with value objects

## ABI Types Tested

### Static Types
- `uint8`, `uint16`, `uint32`, `uint64`, `uint128`, `uint256`
- `int8`, `int16`, `int32`, `int64`, `int128`, `int256`
- `address`
- `bool`
- `bytes1` through `bytes32`

### Dynamic Types
- `bytes` (variable length)
- `string`
- `uint256[]`, `bytes32[]`, `address[]`, `string[]`

## Key Performance Factors

1. **Encoding Efficiency**: How fast can each library encode parameters?
2. **Decoding Speed**: Performance when parsing ABI data
3. **Selector Computation**: Keccak256 hashing performance
4. **Memory Allocation**: Buffer management and reuse
5. **Type Validation**: Overhead from type checking
6. **Function Call Overhead**: Complete encoding/decoding pipelines

## Example Function Signatures

### Simple
- `transfer(address,uint256)`
- `balanceOf(address)`
- `approve(address,uint256)`

### Complex
- `transferFrom(address,address,uint256)`
- `swapExactTokensForTokens(uint256,uint256,address[],address,uint256)`

## Use Cases

These benchmarks are relevant for:
- Smart contract interaction
- Transaction encoding/decoding
- Event log parsing
- Off-chain signature verification
- Gas estimation
- Contract deployment
- Multi-call encoding
- Proxy contract interactions

## Related Documentation

- [Ethereum ABI Specification](https://docs.soliditylang.org/en/latest/abi-spec.html)
- [EIP-712: Typed Structured Data Hashing](https://eips.ethereum.org/EIPS/eip-712)
- [Ethers.js ABI Documentation](https://docs.ethers.org/v6/api/abi/)
- [Viem ABI Documentation](https://viem.sh/docs/abi/encodeAbiParameters.html)
