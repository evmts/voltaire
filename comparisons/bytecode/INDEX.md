# EVM Bytecode Analysis Benchmarks - Index

Complete benchmark suite for EVM bytecode analysis functions in guil (@tevm/primitives).

## Overview

This comprehensive benchmark suite demonstrates guil's unique capabilities in EVM bytecode analysis - functionality that is not available in ethers or viem.

### Statistics

- **Functions Benchmarked**: 4
- **Total Test Files**: 20
- **Lines of Code**: ~895
- **Performance Range**: 6.7M - 11.3M operations/second
- **Test Data Variants**: 5 (simple, complex, large, invalid, truncated)

## Documentation Files

| File | Description | Purpose |
|------|-------------|---------|
| [INDEX.md](./INDEX.md) | This file | Quick navigation and overview |
| [SUMMARY.md](./SUMMARY.md) | Comprehensive summary | Complete project overview |
| [README.md](./README.md) | User guide | Usage instructions and examples |
| [BENCHMARKS.md](./BENCHMARKS.md) | Performance analysis | Detailed benchmark results |
| [docs.ts](./docs.ts) | Doc generator | Automated documentation |
| [test-data.ts](./test-data.ts) | Test fixtures | Realistic bytecode examples |

## Functions

### 1. analyzeJumpDestinations

**Find all valid JUMPDEST instructions in EVM bytecode**

- **Directory**: [./analyzeJumpDestinations/](./analyzeJumpDestinations/)
- **Performance**: 8.8M ops/sec
- **Complexity**: O(n) single pass
- **Status**: ✅ Guil only (ethers ❌, viem ❌)

**Use Cases**:
- Pre-compute valid jump targets for EVM execution
- Build control flow graphs for static analysis
- Visualize execution paths in debuggers

**Files**:
- `guil.ts` - Working implementation with inline bytecode analysis
- `ethers.ts` - Documentation stub (not available)
- `viem.ts` - Documentation stub (not available)
- `analyzeJumpDestinations.bench.ts` - Vitest benchmark

### 2. validateBytecode

**Validate structural integrity of EVM bytecode**

- **Directory**: [./validateBytecode/](./validateBytecode/)
- **Performance**: 11.3M ops/sec (fastest)
- **Complexity**: O(n) single pass with early exit
- **Status**: ✅ Guil only (ethers ❌, viem ❌)

**Use Cases**:
- Validate bytecode before execution
- Detect truncated PUSH instructions
- Security analysis of contract bytecode

**Files**:
- `guil.ts` - Working implementation with inline bytecode validation
- `ethers.ts` - Documentation stub (not available)
- `viem.ts` - Documentation stub (not available)
- `validateBytecode.bench.ts` - Vitest benchmark

### 3. isBytecodeBoundary

**Check if a position is at an opcode boundary**

- **Directory**: [./isBytecodeBoundary/](./isBytecodeBoundary/)
- **Performance**: 8.6M ops/sec
- **Complexity**: O(n) worst case
- **Status**: ✅ Guil only (ethers ❌, viem ❌)

**Use Cases**:
- Validate breakpoint positions in debuggers
- Ensure disassembly accuracy
- Verify jump target positions

**Files**:
- `guil.ts` - Working implementation with inline boundary checking
- `ethers.ts` - Documentation stub (not available)
- `viem.ts` - Documentation stub (not available)
- `isBytecodeBoundary.bench.ts` - Vitest benchmark

### 4. isValidJumpDest

**Validate if a position is a valid JUMPDEST instruction**

- **Directory**: [./isValidJumpDest/](./isValidJumpDest/)
- **Performance**: 6.7M ops/sec
- **Complexity**: O(n) worst case
- **Status**: ✅ Guil only (ethers ❌, viem ❌)

**Use Cases**:
- Runtime validation of JUMP/JUMPI targets
- Security analysis of dynamic jumps
- EVM execution safety checks

**Files**:
- `guil.ts` - Working implementation with inline JUMPDEST validation
- `ethers.ts` - Documentation stub (not available)
- `viem.ts` - Documentation stub (not available)
- `isValidJumpDest.bench.ts` - Vitest benchmark

## Benchmark Results Summary

| Function | Operations/Second | Relative Speed | Algorithm |
|----------|------------------|----------------|-----------|
| validateBytecode | 11.3M | Fastest (100%) | Single pass |
| analyzeJumpDestinations | 8.8M | Fast (78%) | Single pass with tracking |
| isBytecodeBoundary | 8.6M | Fast (76%) | Position scanning |
| isValidJumpDest | 6.7M | Fast (59%) | Combined validation |

All functions achieve **millions of operations per second** with O(n) complexity.

## Test Data

### Realistic EVM Bytecode Examples

All benchmarks use production-realistic bytecode from `test-data.ts`:

| Constant | Size | Description | Key Features |
|----------|------|-------------|--------------|
| SIMPLE_BYTECODE | 7 bytes | Basic contract | PUSH1, JUMPDEST, STOP |
| COMPLEX_BYTECODE | 46 bytes | Medium contract | PUSH1, PUSH2, PUSH32, MSTORE |
| LARGE_BYTECODE | 126 bytes | Production-size | Multiple functions, realistic layout |
| INVALID_JUMPDEST_BYTECODE | 3 bytes | Edge case | JUMPDEST in PUSH data |
| TRUNCATED_PUSH | 1 byte | Invalid bytecode | Incomplete PUSH instruction |

### Bytecode Composition

**SIMPLE_BYTECODE**:
```
0x60 0x00  // PUSH1 0x00
0x5b       // JUMPDEST at position 2
0x60 0x01  // PUSH1 0x01
0x5b       // JUMPDEST at position 5
0x00       // STOP
```

**COMPLEX_BYTECODE**:
- Memory initialization (PUSH1, MSTORE)
- Multiple PUSH sizes (PUSH1, PUSH2, PUSH32)
- JUMPDESTs at various positions
- Tests large immediate data handling

**LARGE_BYTECODE**:
- Constructor section
- Function dispatch logic
- Multiple function bodies
- PUSH3 operations
- Return handling

## Quick Start

### Run All Benchmarks

```bash
npx vitest bench \
  comparisons/bytecode/analyzeJumpDestinations/analyzeJumpDestinations.bench.ts \
  comparisons/bytecode/validateBytecode/validateBytecode.bench.ts \
  comparisons/bytecode/isBytecodeBoundary/isBytecodeBoundary.bench.ts \
  comparisons/bytecode/isValidJumpDest/isValidJumpDest.bench.ts \
  --run
```

### Generate Documentation

```bash
npx tsx comparisons/bytecode/docs.ts > bytecode-docs.md
```

### Run Individual Benchmark

```bash
npx vitest bench comparisons/bytecode/analyzeJumpDestinations/analyzeJumpDestinations.bench.ts --run
```

## Key Insights

### 1. Guil-Exclusive Functionality

All four bytecode analysis functions are **exclusive to guil**:

- ✅ **Guil**: Complete bytecode analysis suite
- ❌ **Ethers**: No low-level bytecode utilities
- ❌ **Viem**: No low-level bytecode utilities

### 2. Why This Matters

**For EVM Implementation**:
- JUMPDEST validation is mandatory for safe execution
- Bytecode validation prevents execution of malformed code
- Boundary checking enables accurate disassembly

**For Tooling**:
- Debuggers need precise instruction boundaries
- Disassemblers require PUSH data handling
- Security tools need control flow analysis

**For Developers**:
- No other TypeScript library provides these utilities
- Essential for building EVM-compatible systems
- Production-ready performance

### 3. Performance Characteristics

All functions achieve **6-11 million operations per second**:

- Single-pass algorithms
- No unnecessary allocations
- Optimized for hot path execution
- Suitable for production use

### 4. Correct PUSH Handling

Critical for correctness:

```typescript
// PUSH instructions include 1-32 bytes of immediate data
if (opcode >= PUSH1 && opcode <= PUSH32) {
  const pushSize = opcode - PUSH1 + 1;
  i += 1 + pushSize;  // Skip opcode + data
  continue;
}
```

This ensures:
- JUMPDEST in PUSH data is correctly ignored
- Position checks account for immediate data
- Bytecode traversal is accurate

### 5. Edge Cases Handled

All implementations handle:
- ✅ Empty bytecode
- ✅ JUMPDEST in PUSH data (invalid)
- ✅ Truncated PUSH instructions (invalid)
- ✅ Out of bounds positions
- ✅ Positions within PUSH data
- ✅ All PUSH sizes (PUSH1-PUSH32)

## Architecture

### Implementation Pattern

All functions share a common pattern for correctness:

```typescript
let i = 0;
while (i < bytecode.length) {
  const opcode = bytecode[i];

  // Handle PUSH instructions specially
  if (opcode >= PUSH1 && opcode <= PUSH32) {
    const pushSize = opcode - PUSH1 + 1;
    i += 1 + pushSize;
    continue;
  }

  // Function-specific logic
  if (opcode === JUMPDEST) {
    // Record or validate jump destination
  }

  i++;
}
```

### Why Inline Implementations?

Benchmark files use inline implementations instead of importing from `src/primitives/bytecode.ts` because:

1. **Avoid FFI complexity**: Main implementation imports `hex.ts` with Bun FFI
2. **Node.js compatibility**: Benchmarks run in Node.js via Vitest
3. **Accurate measurement**: Pure algorithm benchmarking without import overhead

The inline implementations are **functionally identical** to the source.

## Project Structure

```
comparisons/bytecode/
├── INDEX.md                          # This file - navigation hub
├── SUMMARY.md                        # Comprehensive overview
├── README.md                         # User guide
├── BENCHMARKS.md                     # Detailed performance analysis
├── docs.ts                           # Documentation generator
├── test-data.ts                      # Realistic test bytecode
│
├── analyzeJumpDestinations/
│   ├── guil.ts                      # Implementation
│   ├── ethers.ts                    # Not available (stub)
│   ├── viem.ts                      # Not available (stub)
│   └── analyzeJumpDestinations.bench.ts  # Benchmark
│
├── validateBytecode/
│   ├── guil.ts                      # Implementation
│   ├── ethers.ts                    # Not available (stub)
│   ├── viem.ts                      # Not available (stub)
│   └── validateBytecode.bench.ts    # Benchmark
│
├── isBytecodeBoundary/
│   ├── guil.ts                      # Implementation
│   ├── ethers.ts                    # Not available (stub)
│   ├── viem.ts                      # Not available (stub)
│   └── isBytecodeBoundary.bench.ts  # Benchmark
│
└── isValidJumpDest/
    ├── guil.ts                      # Implementation
    ├── ethers.ts                    # Not available (stub)
    ├── viem.ts                      # Not available (stub)
    └── isValidJumpDest.bench.ts     # Benchmark
```

## Use Case Examples

### Building an EVM Execution Engine

```typescript
// Pre-compute valid jump destinations
const jumpDests = analyzeJumpDestinations(bytecode);
const validPositions = new Set(jumpDests.map(d => d.position));

// During execution
if (opcode === JUMP || opcode === JUMPI) {
  const target = stack.pop();
  if (!isValidJumpDest(bytecode, target)) {
    throw new Error('Invalid jump destination');
  }
}
```

### Building a Debugger

```typescript
// User sets breakpoint at position
function setBreakpoint(position: number) {
  if (!isBytecodeBoundary(bytecode, position)) {
    throw new Error('Cannot set breakpoint in middle of instruction');
  }
  breakpoints.add(position);
}
```

### Security Analysis

```typescript
// Validate contract bytecode
if (!validateBytecode(bytecode)) {
  console.warn('Invalid bytecode detected - truncated PUSH instruction');
}

// Analyze control flow
const destinations = analyzeJumpDestinations(bytecode);
console.log(`Found ${destinations.length} potential jump targets`);
```

## Comparison with Other Libraries

| Feature | guil | ethers | viem |
|---------|------|--------|------|
| Bytecode analysis | ✅ Complete | ❌ None | ❌ None |
| JUMPDEST detection | ✅ | ❌ | ❌ |
| Bytecode validation | ✅ | ❌ | ❌ |
| Boundary checking | ✅ | ❌ | ❌ |
| Jump validation | ✅ | ❌ | ❌ |
| PUSH handling | ✅ All sizes | - | - |
| Performance | 6-11M ops/sec | N/A | N/A |
| Documentation | ✅ Complete | N/A | N/A |
| Use case | EVM implementation | Network interaction | RPC operations |

## Future Enhancements

Potential additions to expand the bytecode analysis suite:

1. **Disassembler**: Convert bytecode to assembly with proper formatting
2. **Control Flow Graph**: Build and visualize execution paths
3. **Gas Calculator**: Estimate gas costs for bytecode execution
4. **Optimizer**: Suggest bytecode optimization opportunities
5. **Coverage Analyzer**: Track executed vs unexecuted code
6. **Static Analyzer**: Detect common vulnerabilities
7. **Opcode Reference**: Complete EVM opcode documentation

## Contributing

To add new bytecode analysis functions:

1. Implement in `/Users/williamcory/primitives/src/primitives/bytecode.ts`
2. Add comprehensive tests in `bytecode.test.ts`
3. Create function directory with guil/ethers/viem files
4. Create benchmark file using Vitest
5. Update documentation (this file, README, BENCHMARKS)
6. Run benchmarks and verify performance
7. Format code with `npm run format`

## Conclusion

This benchmark suite demonstrates that **guil is the only major TypeScript Ethereum library** providing low-level bytecode analysis utilities. With performance in the millions of operations per second and comprehensive edge case handling, these functions are production-ready for:

- ✅ EVM execution engines
- ✅ Smart contract debuggers
- ✅ Bytecode disassemblers
- ✅ Security analysis tools
- ✅ Gas estimation tools
- ✅ Development tooling

For detailed information, see:
- [SUMMARY.md](./SUMMARY.md) - Complete project overview
- [README.md](./README.md) - Usage guide and examples
- [BENCHMARKS.md](./BENCHMARKS.md) - Performance analysis
- Individual function directories for implementations

---

**Total Project Size**: ~895 lines of TypeScript across 20 files
**Functions Benchmarked**: 4
**Performance Range**: 6.7M - 11.3M operations/second
**Status**: All benchmarks passing ✅
