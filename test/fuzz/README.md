# EVM Fuzz Testing

This directory contains fuzz testing infrastructure for the EVM implementation. 

## ⚠️ Platform Limitation

**IMPORTANT: Fuzz tests only work on macOS.**

The Zig fuzzing infrastructure (`std.testing.fuzzInput`) is currently only supported on macOS. The Docker/Linux setup in this directory is outdated and will not work with the current fuzz tests that use `std.testing.fuzzInput`.

## Prerequisites

- **macOS** (required - fuzz tests will not work on other platforms)
- Zig compiler with fuzz testing support
- Sufficient memory (fuzz tests can be memory intensive)

## Quick Start

### Run all EVM fuzz tests (macOS only)
```bash
# Run all EVM fuzz tests 
zig build test --fuzz

# Run specific fuzz test file
zig test src/evm/fuzz/evm_fuzz.zig --fuzz

# Run with specific seed for reproducibility
zig test src/evm/fuzz/evm_fuzz.zig --fuzz --seed 12345
```

## Test Philosophy

### Crash Detection, Not Correctness
Fuzz tests are designed to find:
- **Crashes** and segmentation faults
- **Infinite loops** and hangs
- **Memory leaks** and allocation failures
- **Assertion failures** in debug builds

They do NOT test:
- Functional correctness of EVM semantics
- Gas calculation accuracy
- State transition validity

### Error Handling Strategy
```zig
// All execution errors are acceptable outcomes
_ = frame.interpret() catch |err| {
    // The fuzzer tests for crashes, not correctness
    return;
};
```

Fuzz tests should handle ALL possible errors gracefully since they're testing boundary conditions with random inputs.

## Current Fuzz Test Coverage

The `evm_fuzz.zig` file contains comprehensive fuzz tests for:

### Core Components
- **Frame Execution**: Random bytecode execution with error handling
- **Stack Operations**: PUSH, POP, DUP, SWAP with boundary testing
- **Memory Operations**: Word/byte operations with expansion testing  
- **Arithmetic Operations**: ADD, SUB, MUL, DIV, MOD, EXP with overflow/underflow
- **Control Flow**: JUMP/JUMPI with invalid destinations
- **Gas Consumption**: Gas limit exhaustion and calculation edge cases
- **PUSH Operations**: All PUSH variants with invalid/truncated data
- **Bytecode Validation**: Jump destination analysis with malformed code

### Planned Enhancements
See [TODO.md](TODO.md) for comprehensive list of additional fuzz tests to implement.

## Writing New Fuzz Tests

Add new fuzz tests to `evm_fuzz.zig` following this pattern:

```zig
test "fuzz new feature" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < required_size) return;
    
    // Set up test environment
    const allocator = std.testing.allocator;
    
    // Use fuzz input to test edge cases
    // Always handle errors gracefully - the goal is to find crashes, not test correctness
    some_operation(input) catch |err| {
        // All errors are acceptable outcomes in fuzz tests
        return;
    };
}
```

## Platform-Specific Notes

### macOS
- Full fuzz testing support with `std.testing.fuzzInput`
- Recommended for comprehensive testing
- Use latest Xcode and Zig versions

### Linux/Windows  
- **Fuzz tests will NOT work** - they use macOS-only `std.testing.fuzzInput`
- Regular unit tests work normally on all platforms
- Consider macOS VM or CI runners for fuzz testing

### CI/CD Integration
```yaml
# GitHub Actions example - use macOS runner
- name: Run EVM Fuzz Tests
  runs-on: macos-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Zig
      uses: goto-bus-stop/setup-zig@v2
    - name: Run Fuzz Tests
      run: zig test src/evm/fuzz/evm_fuzz.zig --fuzz
```

## Files

- `evm_fuzz.zig` - Main fuzz test suite (uses `std.testing.fuzzInput`)
- `TODO.md` - Planned enhancements and priorities  
- `README.md` - This file
- `CLAUDE.md` - AI development guidelines for fuzz tests

**Note**: The Docker files in this directory are outdated and won't work with the current `std.testing.fuzzInput`-based fuzz tests.