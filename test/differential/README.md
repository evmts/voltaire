# Differential Testing

This directory contains differential tests that compare the Guillotine EVM implementation against revm to ensure correctness and compatibility.

## What is Differential Testing?

Differential testing runs the same inputs through multiple implementations of a specification and verifies they produce identical outputs. Any discrepancy indicates a bug in at least one implementation.

## Test Structure

Each test file should:
1. Define bytecode to test specific opcodes or scenarios
2. Execute the bytecode on both Guillotine EVM and revm
3. Compare the results:
   - Final execution status (success/revert/etc)
   - Gas consumption
   - Stack state
   - Memory state
   - Storage changes
   - Return data
   - Logs emitted

## Running Tests

```bash
zig build test-differential
```

## Adding New Tests

Create new test files following the pattern:
- `opcodes_arithmetic.zig` - Tests for ADD, SUB, MUL, DIV, etc.
- `opcodes_comparison.zig` - Tests for LT, GT, EQ, etc.
- `opcodes_memory.zig` - Tests for MLOAD, MSTORE, etc.
- `complex_scenarios.zig` - Tests for contract calls, deployments, etc.