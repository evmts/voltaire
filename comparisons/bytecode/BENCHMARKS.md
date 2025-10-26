# EVM Bytecode Analysis - Benchmark Results

Comprehensive benchmarks comparing EVM bytecode analysis functions across guil, ethers, and viem.

## Key Findings

**All bytecode analysis functions are guil-exclusive features.** Neither ethers nor viem provide low-level bytecode analysis utilities, as they focus on higher-level interactions with the Ethereum network.

## Benchmark Results

All benchmarks were run using Vitest on realistic EVM bytecode examples including:
- Simple bytecode with JUMPDEST instructions
- Complex bytecode with PUSH1, PUSH2, and PUSH32 operations
- Large bytecode simulating realistic contract deployment

### 1. analyzeJumpDestinations

**Purpose**: Finds all valid JUMPDEST instructions in bytecode

**Performance**: ~9.5M operations/second

```
name            hz     min     max    mean     p75     p99    p995    p999     rme  samples
guil  9,491,175.49  0.0000  2.3970  0.0001  0.0001  0.0002  0.0002  0.0005  ±1.25%  4745588
```

**Implementation Status**:
- ✅ guil: Full implementation
- ❌ ethers: Not available
- ❌ viem: Not available

### 2. validateBytecode

**Purpose**: Validates structural integrity of bytecode (checks for truncated PUSH instructions)

**Performance**: ~12.8M operations/second

```
name             hz     min     max    mean     p75     p99    p995    p999     rme  samples
guil  12,783,155.95  0.0000  0.2567  0.0001  0.0001  0.0001  0.0002  0.0002  ±0.24%  6391579
```

**Implementation Status**:
- ✅ guil: Full implementation
- ❌ ethers: Not available
- ❌ viem: Not available

### 3. isBytecodeBoundary

**Purpose**: Checks if a position is at an opcode boundary (not in PUSH data)

**Performance**: ~8.9M operations/second

```
name            hz     min     max    mean     p75     p99    p995    p999     rme  samples
guil  8,931,473.34  0.0000  0.1695  0.0001  0.0001  0.0002  0.0002  0.0003  ±0.15%  4465737
```

**Implementation Status**:
- ✅ guil: Full implementation
- ❌ ethers: Not available
- ❌ viem: Not available

### 4. isValidJumpDest

**Purpose**: Validates if a position is a valid JUMPDEST instruction

**Performance**: ~6.8M operations/second

```
name            hz     min     max    mean     p75     p99    p995    p999     rme  samples
guil  6,800,330.00  0.0001  0.1613  0.0001  0.0002  0.0002  0.0002  0.0003  ±0.12%  3400166
```

**Implementation Status**:
- ✅ guil: Full implementation
- ❌ ethers: Not available
- ❌ viem: Not available

## Performance Analysis

### Relative Performance

1. **validateBytecode** - Fastest (12.8M ops/sec)
   - Simple validation checking PUSH instruction lengths
   - No destination tracking needed

2. **analyzeJumpDestinations** - Very Fast (9.5M ops/sec)
   - Single pass through bytecode
   - Builds array of jump destinations

3. **isBytecodeBoundary** - Fast (8.9M ops/sec)
   - May scan entire bytecode to reach target position
   - Worst case O(n) where n is bytecode length

4. **isValidJumpDest** - Fast (6.8M ops/sec)
   - Combines boundary check + opcode validation
   - Slightly slower due to double validation

### Algorithm Complexity

All functions use optimized single-pass algorithms:

- **analyzeJumpDestinations**: O(n) - single pass
- **validateBytecode**: O(n) - single pass with early exit on error
- **isBytecodeBoundary**: O(n) worst case - stops at target position
- **isValidJumpDest**: O(n) worst case - boundary check + opcode check

Where n is the bytecode length in bytes.

## Test Data Characteristics

### Simple Bytecode (7 bytes)
```
0x60 0x00  // PUSH1 0x00
0x5b       // JUMPDEST at position 2
0x60 0x01  // PUSH1 0x01
0x5b       // JUMPDEST at position 5
0x00       // STOP
```

### Complex Bytecode (46 bytes)
- Contains PUSH1, PUSH2, and PUSH32 instructions
- Multiple JUMPDESTs at various positions
- Tests handling of large immediate data

### Large Bytecode (126 bytes)
- Simulates realistic contract deployment
- Multiple functions with different PUSH operations
- Tests performance on production-size bytecode

## Why These Functions Matter

### For EVM Execution Engines
- **JUMPDEST validation** prevents execution of invalid jump targets
- **Bytecode validation** ensures structural integrity before execution
- **Boundary checking** enables safe bytecode traversal

### For Debugging Tools
- **analyzeJumpDestinations** helps visualize control flow
- **isBytecodeBoundary** enables accurate breakpoint placement
- **isValidJumpDest** validates user-specified jump targets

### For Security Analysis
- **validateBytecode** detects malformed bytecode
- **analyzeJumpDestinations** identifies all possible execution paths
- Combined functions enable comprehensive static analysis

## Comparison with Other Libraries

### ethers.js
- Focus: High-level Ethereum interactions (providers, contracts, wallets)
- Bytecode support: Basic deployment and contract interaction
- Analysis utilities: **Not available**

### viem
- Focus: Type-safe Ethereum interactions and RPC operations
- Bytecode support: Contract deployment and calls
- Analysis utilities: **Not available**

### guil (@tevm/primitives)
- Focus: Low-level Ethereum primitives and EVM operations
- Bytecode support: **Comprehensive analysis utilities**
- Analysis utilities: **Full suite of tools for EVM execution**

## Use Cases

1. **EVM Implementation**: Building execution engines that need to validate jumps
2. **Smart Contract Debuggers**: Stepping through bytecode with accurate boundaries
3. **Disassemblers**: Converting bytecode to human-readable assembly
4. **Security Auditing**: Analyzing control flow and detecting anomalies
5. **Gas Estimation**: Accurately tracing execution paths for gas calculations
6. **Bytecode Optimization**: Understanding instruction layout for optimization

## Running the Benchmarks

```bash
# Run individual benchmarks
npx vitest bench comparisons/bytecode/analyzeJumpDestinations/analyzeJumpDestinations.bench.ts --run
npx vitest bench comparisons/bytecode/validateBytecode/validateBytecode.bench.ts --run
npx vitest bench comparisons/bytecode/isBytecodeBoundary/isBytecodeBoundary.bench.ts --run
npx vitest bench comparisons/bytecode/isValidJumpDest/isValidJumpDest.bench.ts --run
```

## Implementation Notes

### Correct PUSH Handling

All functions correctly handle PUSH1-PUSH32 instructions:

```typescript
if (opcode >= PUSH1 && opcode <= PUSH32) {
  const pushSize = opcode - PUSH1 + 1;
  i += 1 + pushSize; // Skip opcode + immediate data
  continue;
}
```

### Edge Cases Handled

1. **JUMPDEST in PUSH data**: Correctly ignored as invalid jump target
2. **Truncated PUSH instructions**: Detected as invalid bytecode
3. **Empty bytecode**: Handled gracefully
4. **Position out of bounds**: Returns false/invalid
5. **Position in PUSH data**: Correctly identified as non-boundary

## Future Enhancements

Potential additions to the bytecode analysis suite:

1. **Disassembler**: Convert bytecode to human-readable assembly
2. **Control flow graph**: Build CFG from bytecode
3. **Gas estimator**: Calculate gas costs for execution paths
4. **Optimization detector**: Identify optimization opportunities
5. **Coverage analyzer**: Track executed vs unexecuted code paths

## Conclusion

Guil provides a comprehensive suite of bytecode analysis utilities that are not available in ethers or viem. These functions are essential for building EVM execution engines, debuggers, and security analysis tools.

With performance ranging from 6.8M to 12.8M operations per second, these implementations are suitable for production use in performance-critical applications.

The single-pass algorithms and careful PUSH instruction handling ensure both correctness and efficiency when working with real-world EVM bytecode.
