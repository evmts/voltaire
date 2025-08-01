# CLAUDE.md - AI Assistant Context for EVM Benchmarking

This document provides comprehensive context for AI assistants working with the Guillotine EVM benchmarking system. It ensures consistent and effective assistance when developing, modifying, or analyzing benchmarks.

## System Architecture

The benchmarking system is a multi-layered architecture designed to compare EVM implementations fairly:

### Core Components

1. **Orchestrator** (`src/Orchestrator.zig`)
   - Discovers test cases automatically from `cases/` directory
   - Executes benchmarks using hyperfine
   - Parses JSON results from hyperfine
   - Exports results in multiple formats (JSON, Markdown)
   - Manages comparison across multiple EVM implementations

2. **CLI Interface** (`src/main.zig`)
   - Argument parsing with clap
   - Single EVM mode vs comparison mode
   - Export format selection
   - Help system

3. **EVM Runners** (`evms/*/`)
   - Standardized command-line interface
   - Each runner implements: `--contract-code-path`, `--calldata`, `--num-runs`
   - Output format: One timing per line in milliseconds
   - Exit code 0 on success, non-zero on failure

### Test Case Format

Each test case requires:
- `bytecode.txt`: Hex-encoded contract bytecode (with or without 0x prefix)
- `calldata.txt`: Hex-encoded function selector and arguments

### Execution Flow

1. **Contract Deployment**: Runner deploys the bytecode to get contract address
2. **Contract Execution**: Runner calls the contract with provided calldata
3. **Timing**: Measure execution time excluding I/O operations
4. **Output**: Print execution time in milliseconds

## Key Implementation Details

### Memory Management Patterns

When working with the orchestrator:
```zig
// Always use proper cleanup
defer allocator.free(allocated_memory);
errdefer allocator.free(on_error_cleanup);

// Test case discovery allocates paths
for (test_cases) |tc| {
    allocator.free(tc.name);
    allocator.free(tc.bytecode_path);
    allocator.free(tc.calldata_path);
}
```

### Error Handling

- File operations use explicit error handling
- Runner failures should exit with non-zero code
- Benchmark failures are reported but don't stop other tests

### Path Handling

CRITICAL: Use absolute paths for reliability:
```zig
const cases_path = "/Users/williamcory/Guillotine/bench/official/cases";
```

### JSON Parsing

The orchestrator uses simple string parsing for hyperfine JSON:
- Extract: mean, min, max, median, stddev
- Convert seconds to milliseconds
- Store results in BenchmarkResult struct

## Adding Opcode Benchmarks

When implementing comprehensive opcode benchmarks:

### Design Principles

1. **Group Related Opcodes**: Combine complementary operations (PUSH/POP, MSTORE/MLOAD)
2. **Consistent Iteration Count**: 1000 iterations per opcode for statistical significance
3. **Minimal Overhead**: Reduce loop and setup overhead to measure opcode performance
4. **Gas Efficiency**: Ensure contracts don't run out of gas during benchmarks

### Bytecode Generation Strategy

For opcode benchmarks, generate bytecode programmatically:
1. Use assembly or direct bytecode construction
2. Include minimal deployment code
3. Focus on the target opcode(s) in a tight loop
4. Return after completion to measure total time

### Example Structure

```solidity
// Pseudo-assembly for PUSH/POP benchmark
PUSH1 0x00        // Loop counter
loop:
  DUP1            // Duplicate counter
  PUSH2 0x03E8    // 1000 iterations
  LT              // Check if counter < 1000
  PUSH2 loop_end  
  JUMPI           // Exit if done
  
  // Benchmark operations (repeated pattern)
  PUSH1 0x01      // Test PUSH1
  POP             // Test POP
  PUSH2 0x1234    // Test PUSH2
  POP
  // ... continue pattern
  
  PUSH1 0x01      // Increment counter
  ADD
  PUSH2 loop
  JUMP
  
loop_end:
  STOP
```

### File Organization

Create test cases following naming convention:
```
cases/
├── opcodes-arithmetic/     # ADD, SUB, MUL, DIV, etc.
├── opcodes-stack/         # PUSH*, POP, DUP*, SWAP*
├── opcodes-memory/        # MLOAD, MSTORE, MSTORE8
├── opcodes-storage/       # SLOAD, SSTORE
├── opcodes-control/       # JUMP, JUMPI, PC, STOP
├── opcodes-comparison/    # LT, GT, EQ, ISZERO
├── opcodes-bitwise/       # AND, OR, XOR, NOT, SHL, SHR
├── opcodes-environmental/ # ADDRESS, BALANCE, CALLER
└── opcodes-crypto/        # KECCAK256
```

### Testing Considerations

1. **Warm vs Cold**: Some opcodes (SLOAD/SSTORE) have different costs for first access
2. **Stack Depth**: Ensure sufficient stack space for operations
3. **Memory Expansion**: Account for memory growth costs in MLOAD/MSTORE tests
4. **Gas Limits**: Set appropriate gas limits for intensive operations

## Benchmark Analysis

When analyzing results:

1. **Statistical Significance**: Use sufficient runs (50+) for reliable measurements
2. **Outlier Detection**: Check min/max vs median for anomalies
3. **Standard Deviation**: High values indicate inconsistent performance
4. **Relative Performance**: Compare implementations as ratios, not absolute times

## Common Pitfalls

1. **Bytecode Parsing**: Always trim whitespace from hex strings
2. **Hex Prefix**: Handle both "0x" prefixed and non-prefixed hex
3. **Memory Leaks**: Ensure all allocations are freed
4. **Path Resolution**: Use absolute paths or proper path joining
5. **Gas Estimation**: Provide sufficient gas for benchmark completion

## Debugging Runner Issues

When a runner fails:
1. Check runner executable exists and is executable
2. Verify bytecode and calldata files are valid hex
3. Test runner manually with known-good inputs
4. Check for adequate gas limits
5. Verify contract deployment succeeds before execution

## Performance Optimization Tips

1. **Minimize Allocations**: Reuse buffers where possible
2. **Batch Operations**: Run multiple iterations in single execution
3. **Avoid I/O in Timing**: Exclude file operations from measurements
4. **Warmup Runs**: Use hyperfine's warmup feature for JIT languages

## Integration with CI/CD

The benchmark system can be integrated into CI:
1. Run benchmarks on consistent hardware
2. Compare against baseline performance
3. Flag significant regressions (>5% slowdown)
4. Generate performance trend reports

Remember: The goal is accurate, reproducible performance measurement across diverse EVM implementations.