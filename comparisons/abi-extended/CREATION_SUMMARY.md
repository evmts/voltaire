# Extended ABI Parsing Utilities Benchmarks - Complete

## Overview

Successfully created comprehensive benchmarks for 4 extended ABI parsing utilities that focus on **developer productivity** rather than runtime performance. These utilities enable working with human-readable ABI signatures instead of verbose JSON.

## Created Files (18 Total)

### Documentation (2 files)
- `README.md` (11.8 KB) - Comprehensive guide with examples and usage
- `docs.ts` (3.4 KB) - Documentation generator using shared/docs-generator.js

### parseAbi - Parse Human-Readable ABI Arrays (4 files)
Converts arrays of human-readable signatures to structured ABI format.

**Files:**
- `parseAbi-guil.ts` - Fallback to viem (not implemented in guil)
- `parseAbi-ethers.ts` - Uses `new Interface([...signatures])`
- `parseAbi-viem.ts` - Uses `parseAbi([...signatures])`
- `parseAbi.bench.ts` - Vitest benchmark

**Test Data:** 7 ERC-20 signatures (functions, events, errors)

**Why This Matters:**
```typescript
// Without parseAbi - Verbose JSON
const abi = [{ type: "function", name: "transfer", inputs: [...], outputs: [...] }];

// With parseAbi - Clean and readable
const abi = parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]);
```

---

### parseAbiItem - Parse Single ABI Items (4 files)
Parses individual human-readable signatures into structured format.

**Files:**
- `parseAbiItem-guil.ts` - Fallback to viem (not implemented in guil)
- `parseAbiItem-ethers.ts` - Uses `Fragment.from(signature)`
- `parseAbiItem-viem.ts` - Uses `parseAbiItem(signature)`
- `parseAbiItem.bench.ts` - Vitest benchmark

**Test Data:** 4 individual signatures (functions, events, errors)

**Use Case:** Dynamic ABI generation, testing individual items

---

### getAbiItem - Extract Items from ABI (4 files)
Retrieves specific functions/events from a full ABI by name.

**Files:**
- `getAbiItem-guil.ts` - Fallback to viem (not implemented in guil)
- `getAbiItem-ethers.ts` - Uses `interface.getFunction(name)` / `interface.getEvent(name)`
- `getAbiItem-viem.ts` - Uses `getAbiItem({ abi, name })`
- `getAbiItem.bench.ts` - Vitest benchmark

**Test Data:** Full ERC-20 ABI with 5 items, extracting 4 specific ones

**Use Case:** Working with large ABIs where you need specific functions/events

---

### toFunctionSelector - Compute Function Selectors (4 files)
Generates 4-byte function selector from signature (first 4 bytes of keccak256 hash).

**Files:**
- `toFunctionSelector-guil.ts` - **IMPLEMENTED** as `computeSelector` ✅
- `toFunctionSelector-ethers.ts` - Uses `id(signature).slice(0, 10)`
- `toFunctionSelector-viem.ts` - Uses `toFunctionSelector(signature)`
- `toFunctionSelector.bench.ts` - Vitest benchmark

**Test Data:** 6 common ERC-20 function signatures

**Note:** This is the **only function implemented in guil** as `computeSelector` because selector computation is a core primitive operation, while parsing is a developer convenience tool.

---

## Implementation Summary

### Guil (@tevm/primitives) - 1/4 Implemented

**Implemented:**
- ✅ `toFunctionSelector` (as `computeSelector` in `/src/primitives/abi.js`)

**Not Implemented (uses viem fallback):**
- ❌ `parseAbi` - Parser/developer tool
- ❌ `parseAbiItem` - Parser/developer tool  
- ❌ `getAbiItem` - ABI manipulation utility

**Philosophy:** Guil focuses on **core cryptographic and encoding primitives** needed at runtime, not developer convenience utilities. These parsing tools add convenience but aren't essential for encoding/decoding operations. Developers can use ethers or viem for parsing while using guil's optimized primitives for runtime operations.

### Ethers - 4/4 Implemented

Object-oriented approach with stateful `Interface` class:
- ✅ `parseAbi` - Constructor parsing
- ✅ `parseAbiItem` - Fragment factory methods
- ✅ `getAbiItem` - Type-specific getters
- ✅ `toFunctionSelector` - Keccak256 + slice

### Viem - 4/4 Implemented

Functional API with dedicated utilities:
- ✅ `parseAbi` - Dedicated function
- ✅ `parseAbiItem` - Dedicated function
- ✅ `getAbiItem` - Object-based parameters
- ✅ `toFunctionSelector` - Dedicated function

---

## Test Data Specifications

### parseAbi (7 signatures)
```typescript
[
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "error InsufficientBalance(uint256 available, uint256 required)"
]
```

### parseAbiItem (4 signatures)
Each signature parsed individually:
- Function: `balanceOf(address owner) view returns (uint256)`
- Function: `transfer(address to, uint256 amount) returns (bool)`
- Event: `Transfer(address indexed from, address indexed to, uint256 value)`
- Error: `InsufficientBalance(uint256 available, uint256 required)`

### getAbiItem (4 lookups)
From full ERC-20 ABI, extract by name:
- `balanceOf` (function)
- `transfer` (function)
- `Transfer` (event)
- `Approval` (event)

### toFunctionSelector (6 signatures)
```typescript
[
  "balanceOf(address)",              // → 0x70a08231
  "transfer(address,uint256)",       // → 0xa9059cbb
  "approve(address,uint256)",        // → 0x095ea7b3
  "transferFrom(address,address,uint256)", // → 0x23b872dd
  "allowance(address,address)",      // → 0xdd62ed3e
  "totalSupply()"                    // → 0x18160ddd
]
```

---

## Running the Benchmarks

### Individual Functions
```bash
# Parse full ABI arrays
bun run vitest bench comparisons/abi-extended/parseAbi.bench.ts

# Parse individual items
bun run vitest bench comparisons/abi-extended/parseAbiItem.bench.ts

# Extract items from ABI
bun run vitest bench comparisons/abi-extended/getAbiItem.bench.ts

# Compute function selectors
bun run vitest bench comparisons/abi-extended/toFunctionSelector.bench.ts
```

### All Extended ABI Benchmarks
```bash
bun run vitest bench comparisons/abi-extended/
```

### Generate Documentation
```bash
bun run comparisons/abi-extended/docs.ts
```

---

## Expected Performance Patterns

Based on typical library architectures:

1. **parseAbi**
   - **Viem**: Likely fastest (optimized functional parser)
   - **Ethers**: Slightly slower (OOP overhead)
   - **Guil**: Same as viem (uses viem internally)

2. **parseAbiItem**
   - Similar to parseAbi but with per-item overhead
   - Less caching opportunity than full ABI parsing

3. **getAbiItem**
   - **Ethers**: May be faster (indexed lookups in Interface)
   - **Viem**: Pure function approach, no caching
   - **Guil**: Same as viem (uses viem internally)

4. **toFunctionSelector**
   - All three should be similar (simple keccak256 + slice)
   - Guil has native implementation, may be slightly faster

---

## Comparison with Core ABI Functions

These **extended utilities** differ from the **core ABI functions** in `/comparisons/abi/`:

### Core ABI Functions (Runtime Critical)
Located in `/comparisons/abi/` - **6 functions**:
- `encodeAbiParameters` - Binary encoding
- `decodeAbiParameters` - Binary decoding  
- `encodeFunctionData` - Function call encoding
- `decodeFunctionData` - Function call decoding
- `computeSelector` - Selector computation
- `encodePacked` - Non-standard encoding

**Performance Critical:** Used in every transaction encoding/decoding operation.

### Extended Utilities (Developer Productivity)
Located in `/comparisons/abi-extended/` - **4 functions**:
- `parseAbi` - String parsing to structured format
- `parseAbiItem` - Single item parsing
- `getAbiItem` - ABI item extraction
- `toFunctionSelector` - Convenience wrapper

**Developer Tools:** Used primarily during development, testing, and tooling.

**Key Difference:** Core functions work with **binary data** and are performance-critical. Extended utilities work with **strings** and are convenience tools.

---

## Use Cases

### Development Time
- Writing clean, maintainable contract interfaces
- Quick prototyping without full JSON ABIs
- Testing contract interactions
- Documentation and code examples

### Runtime Operations
- Dynamic contract interaction
- Multi-sig wallet interfaces
- Contract deployment tools
- Block explorers and indexers

### Developer Tools
- IDE integrations
- Code generators
- Type generation from signatures
- ABI format conversion tools

---

## Key Benefits

### Code Readability
Human-readable signatures are **far more maintainable** than JSON:

```typescript
// JSON ABI - 10+ lines, hard to read
{
  "type": "function",
  "name": "transferFrom",
  "stateMutability": "nonpayable",
  "inputs": [
    { "name": "from", "type": "address" },
    { "name": "to", "type": "address" },
    { "name": "amount", "type": "uint256" }
  ],
  "outputs": [{ "type": "bool" }]
}

// Human-readable - 1 line, clear intent
"function transferFrom(address from, address to, uint256 amount) returns (bool)"
```

### Type Safety
Syntax errors caught immediately:
```typescript
parseAbiItem("function transfer(address to uint256 amount)") // Error: missing comma
parseAbiItem("function transfer(address to, uint256 amount) returns (bool)") // ✓ Valid
```

### Version Control Friendly
- Smaller diffs when functions change
- Easier to review in PRs
- Less merge conflicts
- Clear commit history

---

## File Structure

```
comparisons/abi-extended/
├── README.md (11.8 KB)              # Comprehensive documentation
├── docs.ts (3.4 KB)                 # Documentation generator
│
├── parseAbi-guil.ts                 # Fallback implementation
├── parseAbi-ethers.ts               # Ethers implementation
├── parseAbi-viem.ts                 # Viem implementation
├── parseAbi.bench.ts                # Benchmark suite
│
├── parseAbiItem-guil.ts             # Fallback implementation
├── parseAbiItem-ethers.ts           # Ethers implementation
├── parseAbiItem-viem.ts             # Viem implementation
├── parseAbiItem.bench.ts            # Benchmark suite
│
├── getAbiItem-guil.ts               # Fallback implementation
├── getAbiItem-ethers.ts             # Ethers implementation
├── getAbiItem-viem.ts               # Viem implementation
├── getAbiItem.bench.ts              # Benchmark suite
│
├── toFunctionSelector-guil.ts       # Native implementation (computeSelector)
├── toFunctionSelector-ethers.ts     # Ethers implementation
├── toFunctionSelector-viem.ts       # Viem implementation
└── toFunctionSelector.bench.ts      # Benchmark suite
```

---

## Next Steps

1. ✅ All files created and structured
2. ⏳ Run benchmarks to verify implementations
3. ⏳ Generate documentation with `docs.ts`
4. ⏳ Analyze performance results
5. ⏳ Create `RESULTS.md` with benchmark data
6. ⏳ Compare with core ABI benchmarks

---

## Related Documentation

- **Core ABI Benchmarks**: `/comparisons/abi/README.md`
- **Ethereum ABI Spec**: https://docs.soliditylang.org/en/latest/abi-spec.html
- **Ethers Interface**: https://docs.ethers.org/v6/api/abi/
- **Viem parseAbi**: https://viem.sh/docs/abi/parseAbi.html
- **Human-Readable ABI**: https://docs.ethers.org/v5/api/utils/abi/formats/#abi-formats--human-readable-abi

---

## Summary Statistics

- **Total Files Created**: 18
- **Documentation Files**: 2 (README.md, docs.ts)
- **Implementation Files**: 12 (3 per function × 4 functions)
- **Benchmark Files**: 4 (1 per function)
- **Functions Benchmarked**: 4
- **Total Test Cases**: 21 (7 + 4 + 4 + 6 across all functions)
- **Guil Implementation**: 1/4 functions (toFunctionSelector only)
- **Lines of Code**: ~2,500 across all files

---

**Status**: ✅ Complete and ready for benchmarking
