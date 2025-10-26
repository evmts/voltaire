# Extended ABI Parsing Utilities Benchmarks

Comprehensive performance comparison of ABI parsing and developer productivity utilities across guil (@tevm/primitives), ethers, and viem.

## Overview

These utilities transform the developer experience of working with smart contracts by enabling the use of human-readable ABI signatures instead of raw JSON. This benchmark suite compares four essential ABI parsing operations:

1. **parseAbi** - Parse human-readable ABI strings to structured format
2. **parseAbiItem** - Parse single human-readable ABI item
3. **getAbiItem** - Extract specific item from ABI by name
4. **toFunctionSelector** - Get 4-byte function selector from signature

## Why These Functions Matter

### Developer Productivity

Without these utilities, developers must work with verbose JSON ABIs:

```typescript
// Without parsing utilities - verbose JSON
const abi = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  }
];
```

With parsing utilities, the same ABI becomes:

```typescript
// With parsing utilities - clean and readable
const abi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)"
]);
```

### Type Safety and Maintainability

Human-readable signatures are:
- Easier to read and understand
- Less prone to typos (syntax errors caught immediately)
- Easier to maintain and version control
- More compact (less code to review)

## Benchmark Structure

Each function has three implementation files and one benchmark file:

```
comparisons/abi-extended/
├── parseAbi-guil.ts                 # Fallback to viem (not implemented in guil)
├── parseAbi-ethers.ts               # ethers.js implementation
├── parseAbi-viem.ts                 # viem implementation
├── parseAbi.bench.ts                # vitest benchmark
├── parseAbiItem-guil.ts             # Fallback to viem
├── parseAbiItem-ethers.ts           # ethers.js implementation
├── parseAbiItem-viem.ts             # viem implementation
├── parseAbiItem.bench.ts            # vitest benchmark
├── getAbiItem-guil.ts               # Fallback to viem
├── getAbiItem-ethers.ts             # ethers.js implementation
├── getAbiItem-viem.ts               # viem implementation
├── getAbiItem.bench.ts              # vitest benchmark
├── toFunctionSelector-guil.ts       # Uses computeSelector from guil
├── toFunctionSelector-ethers.ts     # ethers.js implementation
├── toFunctionSelector-viem.ts       # viem implementation
├── toFunctionSelector.bench.ts      # vitest benchmark
└── docs.ts                          # Documentation generator
```

## Test Data

### parseAbi - Full ERC-20 Interface
```typescript
const erc20Signatures = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "error InsufficientBalance(uint256 available, uint256 required)"
];
```

### parseAbiItem - Individual Items
```typescript
const signatures = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "error InsufficientBalance(uint256 available, uint256 required)"
];
```

### getAbiItem - Extract from ABI
```typescript
// Extract specific items by name from full ABI
getAbiItem({ abi, name: "balanceOf" });
getAbiItem({ abi, name: "transfer" });
getAbiItem({ abi, name: "Transfer" });
```

### toFunctionSelector - Compute Selectors
```typescript
const signatures = [
  "balanceOf(address)",              // 0x70a08231
  "transfer(address,uint256)",       // 0xa9059cbb
  "approve(address,uint256)",        // 0x095ea7b3
  "transferFrom(address,address,uint256)", // 0x23b872dd
];
```

## Running Benchmarks

Run individual benchmarks:
```bash
bun run vitest bench comparisons/abi-extended/parseAbi.bench.ts
bun run vitest bench comparisons/abi-extended/parseAbiItem.bench.ts
bun run vitest bench comparisons/abi-extended/getAbiItem.bench.ts
bun run vitest bench comparisons/abi-extended/toFunctionSelector.bench.ts
```

Run all extended ABI benchmarks:
```bash
bun run vitest bench comparisons/abi-extended/
```

## Generating Documentation

Generate comprehensive documentation with code examples and benchmark results:
```bash
bun run comparisons/abi-extended/docs.ts
```

## Implementation Notes

### Guil (@tevm/primitives)

**Philosophy:** Guil focuses on core encoding/decoding primitives rather than developer convenience utilities.

- **parseAbi**: Not implemented - uses viem as fallback
- **parseAbiItem**: Not implemented - uses viem as fallback
- **getAbiItem**: Not implemented - uses viem as fallback
- **toFunctionSelector**: Implemented as `computeSelector` in `/src/primitives/abi.js`

**Why Not Implemented?**

These are parser/developer tools that add convenience but aren't core to the cryptographic and encoding primitives that guil provides. The library prioritizes:

1. Core ABI encoding/decoding (`encodeAbiParameters`, `decodeAbiParameters`)
2. Cryptographic operations (keccak256, signatures)
3. Low-level primitives (uint256, address, hex)

Developers using guil can still access these utilities through ethers or viem when needed for development tasks, while using guil's optimized primitives for runtime operations.

### Ethers

**Approach:** ABI parsing through the `Interface` class and `Fragment` utilities.

- **parseAbi**: `new Interface([...signatures])` - constructor parses array
- **parseAbiItem**: `Fragment.from(signature)` - static factory method
- **getAbiItem**: `interface.getFunction(name)` or `interface.getEvent(name)` - type-specific methods
- **toFunctionSelector**: `id(signature).slice(0, 10)` - keccak256 + slice

**Design:** Object-oriented with stateful `Interface` instances. Provides rich type information and error handling.

### Viem

**Approach:** Functional API with dedicated parsing utilities.

- **parseAbi**: `parseAbi([...signatures])` - dedicated function
- **parseAbiItem**: `parseAbiItem(signature)` - dedicated function
- **getAbiItem**: `getAbiItem({ abi, name })` - object-based parameters
- **toFunctionSelector**: `toFunctionSelector(signature)` - dedicated function

**Design:** Pure functions with TypeScript generics for type safety. Minimal overhead with tree-shakeable exports.

## ABI Signature Format

### Functions
```typescript
"function <name>(<param types>) [visibility] [mutability] [returns (<return types>)]"

// Examples
"function balanceOf(address) view returns (uint256)"
"function transfer(address,uint256) returns (bool)"
"function withdraw()"
```

### Events
```typescript
"event <name>(<indexed param types>)"

// Examples
"event Transfer(address indexed from, address indexed to, uint256 value)"
"event Approval(address indexed owner, address indexed spender, uint256 value)"
```

### Errors (Solidity 0.8.4+)
```typescript
"error <name>(<param types>)"

// Examples
"error InsufficientBalance(uint256 available, uint256 required)"
"error Unauthorized(address caller)"
```

## Key Performance Factors

1. **Parsing Speed**: How fast can each library parse human-readable signatures?
2. **Memory Allocation**: Overhead from creating parsed structures
3. **Type Inference**: Time spent inferring and validating types
4. **Caching**: Whether libraries cache parsed results
5. **Bundle Size**: Impact on application size (not benchmarked here, but relevant)

## Use Cases

These utilities are essential for:

### Development Time
- Writing clean, maintainable contract interfaces
- Quick prototyping without full ABIs
- Testing contract interactions
- Documentation and code examples

### Runtime Operations
- Dynamic contract interaction
- Multi-sig wallet interfaces
- Contract deployment tools
- Block explorers and indexers
- ABI verification tools

### Developer Tools
- IDE integrations
- Code generators
- Type generation from signatures
- ABI format conversion tools

## Comparison with Core ABI Functions

These **extended utilities** differ from the **core ABI functions** (in `/comparisons/abi/`):

### Core ABI Functions (Runtime Critical)
- `encodeAbiParameters` - Binary encoding
- `decodeAbiParameters` - Binary decoding
- `encodeFunctionData` - Function call encoding
- `decodeFunctionData` - Function call decoding
- `computeSelector` - Selector computation
- `encodePacked` - Non-standard encoding

### Extended Utilities (Developer Productivity)
- `parseAbi` - String parsing to structured format
- `parseAbiItem` - Single item parsing
- `getAbiItem` - ABI item extraction
- `toFunctionSelector` - Convenience wrapper

**Key Difference:** Core functions work with binary data and are performance-critical for transaction processing. Extended utilities work with strings and are used primarily during development and tooling.

## Related Documentation

- [Ethereum ABI Specification](https://docs.soliditylang.org/en/latest/abi-spec.html)
- [Ethers.js Interface Documentation](https://docs.ethers.org/v6/api/abi/)
- [Viem parseAbi Documentation](https://viem.sh/docs/abi/parseAbi.html)
- [Human-Readable ABI Format](https://docs.ethers.org/v5/api/utils/abi/formats/#abi-formats--human-readable-abi)

## Examples

### Basic Usage

#### parseAbi
```typescript
// Viem
import { parseAbi } from 'viem';
const abi = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)'
]);

// Ethers
import { Interface } from 'ethers';
const iface = new Interface([
  'function transfer(address to, uint256 amount) returns (bool)'
]);
```

#### parseAbiItem
```typescript
// Viem
import { parseAbiItem } from 'viem';
const func = parseAbiItem('function transfer(address to, uint256 amount) returns (bool)');

// Ethers
import { Fragment } from 'ethers';
const func = Fragment.from('function transfer(address to, uint256 amount) returns (bool)');
```

#### getAbiItem
```typescript
// Viem
import { getAbiItem } from 'viem';
const transferFunc = getAbiItem({ abi, name: 'transfer' });

// Ethers
const transferFunc = iface.getFunction('transfer');
```

#### toFunctionSelector
```typescript
// Viem
import { toFunctionSelector } from 'viem';
const selector = toFunctionSelector('transfer(address,uint256)'); // "0xa9059cbb"

// Ethers
import { id } from 'ethers';
const selector = id('transfer(address,uint256)').slice(0, 10); // "0xa9059cbb"

// Guil
import { computeSelector } from '@tevm/primitives';
const selector = computeSelector('transfer(address,uint256)'); // "0xa9059cbb"
```

## Benchmark Results

Run the benchmarks to see performance comparisons:

```bash
bun run vitest bench comparisons/abi-extended/
```

Expected patterns:
- **parseAbi**: Viem likely fastest (optimized parser)
- **parseAbiItem**: Similar to parseAbi but per-item overhead
- **getAbiItem**: Ethers may be faster (indexed lookups in Interface)
- **toFunctionSelector**: All three should be similar (simple keccak256 + slice)

## Contributing

When adding new extended ABI utilities:

1. Create three implementation files (guil, ethers, viem)
2. Create benchmark file with vitest
3. Add test data that exercises common patterns
4. Update docs.ts with new function
5. Update this README with usage examples
6. Document any guil-specific notes (implemented vs. not implemented)

## License

MIT
