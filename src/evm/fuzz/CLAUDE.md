# CLAUDE.md - EVM Fuzz Testing Development Guide

This file provides AI agents with specific guidelines for developing and maintaining fuzz tests for the Guillotine EVM implementation.

## ⚠️ Critical Platform Limitation

**MANDATORY: Fuzz tests only work on macOS.**

The agent MUST understand this fundamental constraint:
- `std.testing.fuzzInput(.{})` only works on macOS
- Linux/Windows will cause test failures or compilation errors
- All fuzz test development must assume macOS environment
- CI/CD pipelines must use macOS runners for fuzz testing
- Docker/Linux approach is obsolete for current implementation

## Fuzz Testing Philosophy

### Primary Goal: Crash Detection
Fuzz tests are NOT correctness tests. They are designed to find:
- **Segmentation faults** and crashes
- **Infinite loops** that hang execution
- **Memory leaks** and allocation failures 
- **Assertion failures** in debug builds
- **Stack overflows** and buffer overruns

### What Fuzz Tests Do NOT Test
- Functional correctness of EVM semantics
- Accurate gas calculation
- Proper state transitions
- Compliance with Ethereum specifications

### Error Handling Mandate
**ALL execution errors must be handled gracefully:**
```zig
test "fuzz example" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < minimum_bytes) return;
    
    // ALL operations must have error handling
    frame.execute_operation(input) catch |err| {
        // This is acceptable - we're testing for crashes, not correctness
        return;
    };
}
```

**FORBIDDEN**: Allowing any operation to panic or crash without a catch block.

## Implementation Requirements

### Mandatory Structure
```zig
test "fuzz [component] [specific aspect]" {
    const input = std.testing.fuzzInput(.{});
    
    // Input validation
    if (input.len < minimum_required_size) return;
    
    // Resource limits to prevent OOM
    const safe_input = input[0..@min(input.len, MAX_SAFE_SIZE)];
    
    const allocator = std.testing.allocator;
    
    // Component setup with proper cleanup
    var component = Component.init(allocator, config) catch return;
    defer component.deinit();
    
    // Fuzz testing with comprehensive error handling
    component.operation(safe_input) catch |err| {
        // All errors are acceptable outcomes
        return;
    };
}
```

### Resource Management Rules

1. **Memory Limits**: Always cap input sizes to prevent OOM
   ```zig
   const MAX_BYTECODE_SIZE = 64 * 1024; // 64KB limit
   const safe_bytecode = input[0..@min(input.len, MAX_BYTECODE_SIZE)];
   ```

2. **Gas Limits**: Use reasonable gas limits to prevent infinite execution
   ```zig
   frame.gas_remaining = @min(extracted_gas, 1_000_000); // 1M gas max
   ```

3. **Stack Limits**: Respect EVM stack size constraints
   ```zig
   const stack_config = StackConfig{ .stack_size = 1024 }; // EVM standard
   ```

4. **Timeout Prevention**: Avoid operations that could hang indefinitely

### Input Processing Patterns

**Extract Multiple Values from Input**:
```zig
test "fuzz multi-value operation" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return; // Need space for multiple u256 values
    
    const value_a = std.mem.readInt(u256, input[0..32], .big);
    const value_b = std.mem.readInt(u256, input[32..64], .big);
    
    // Use values for testing...
}
```

**Create Bytecode from Input**:
```zig
test "fuzz bytecode execution" {
    const input = std.testing.fuzzInput(.{});
    if (input.len == 0) return;
    
    // Limit bytecode size
    const bytecode_size = @min(input.len, 1024);
    const bytecode = input[0..bytecode_size];
    
    // Execute with error handling...
}
```

## Component-Specific Guidelines

### Planner System Fuzzing
**Highest Priority** - Not currently fuzzed but critical:
```zig
test "fuzz planner bytecode analysis" {
    // Test malformed bytecode, invalid PUSH lengths, jump analysis edge cases
    // Focus on: cache collisions, SIMD vs scalar parity, opcode fusion failures
}
```

### Journal/Snapshot System
**High Priority** - Complex state management:
```zig
test "fuzz journal operations" {
    // Test random snapshot/revert sequences, nested scenarios
    // Handle allocation failures during journaling gracefully
}
```

### Database Interface
**High Priority** - State storage foundation:
```zig
test "fuzz database operations" {
    // Test extreme storage keys/values, account balance edge cases
    // Include transient storage (TLOAD/TSTORE) operations
}
```

### Host Interface
**Medium Priority** - External operation boundaries:
```zig
test "fuzz host calls" {
    // Test CALL/DELEGATECALL/STATICCALL with random parameters
    // Include CREATE/CREATE2 edge cases, environment queries
}
```

## Error Categories to Handle

### Expected Errors (Handle with `catch`)
- `OutOfGas` - Gas exhaustion during execution
- `StackOverflow`/`StackUnderflow` - Stack boundary violations
- `OutOfMemory` - Memory allocation failures
- `InvalidJump` - Jump to invalid destinations
- `InvalidOpcode` - Undefined opcodes in bytecode
- `AllocationError` - System allocation failures

### Acceptable Outcomes
- Early return due to invalid input
- Graceful error handling and cleanup
- Successful execution (rare but valid)

### Unacceptable Outcomes
- **Crashes** or segmentation faults
- **Panics** or assertion failures
- **Infinite loops** or hangs
- **Memory leaks** (detected by allocator)

## Testing Methodology

### Input Generation Strategy
1. **Random Bytes**: Pure random data for boundary testing
2. **Semi-Valid Data**: Partially correct structures with random corruption
3. **Edge Cases**: Maximum values, zero values, boundary conditions
4. **Malformed Structures**: Invalid but parseable data

### Coverage Goals
- **Planner**: 90%+ of bytecode analysis paths
- **Journal**: 95%+ of state management operations
- **Database**: 85%+ of storage interface methods
- **Host**: 80%+ of external operation handlers
- **Integration**: 70%+ of cross-component interactions

### Performance Considerations
- **Execution Time**: Each test should complete in seconds, not minutes
- **Memory Usage**: Limit to prevent system OOM
- **Iteration Count**: Balance coverage with CI/CD time constraints

## Development Workflow

### Adding New Fuzz Tests
1. **Identify Gap**: Use TODO.md priority ranking
2. **Write Test**: Follow mandatory structure and error handling
3. **Validate on macOS**: Ensure test runs without crashes
4. **Document**: Update TODO.md checklist when complete
5. **Integration**: Ensure test integrates with existing suite

### Debugging Fuzz Failures
1. **Capture Seed**: Use `--seed` flag to reproduce failures
2. **Minimal Case**: Reduce input to smallest failing case
3. **Root Cause**: Identify the actual bug, not test issue
4. **Regression Test**: Add unit test for the specific failure
5. **Fix**: Implement proper fix in EVM code
6. **Verify**: Re-run fuzz test to confirm fix

## Quality Assurance

### Code Review Checklist
- [ ] All operations have error handling (`catch` blocks)
- [ ] Input sizes are limited to prevent OOM
- [ ] Resource cleanup is handled (`defer` statements)
- [ ] Test name follows convention: `test "fuzz [component] [aspect]"`
- [ ] macOS-only limitation is acknowledged in comments
- [ ] No assumption about input validity or EVM correctness

### Performance Review
- [ ] Test completes quickly (< 30 seconds typical)
- [ ] Memory usage is bounded and reasonable
- [ ] No infinite loops or blocking operations
- [ ] Appropriate limits on computation complexity

## Integration with Main EVM Development

### Relationship to Unit Tests
- **Fuzz tests**: Find crashes and edge cases
- **Unit tests**: Verify correct EVM behavior
- **Integration tests**: Test cross-component correctness
- **Each serves different purpose** - all are necessary

### Relationship to CLAUDE.md (main)
Fuzz testing follows the same principles:
- Memory management awareness
- Error handling patterns
- Performance considerations
- Platform-specific constraints

But with different goals:
- **Main EVM**: Correctness and performance
- **Fuzz tests**: Crash detection and robustness

### CI/CD Integration
Fuzz tests should be:
- Run on macOS CI runners only
- Executed regularly but not on every commit (too slow)
- Used as quality gates for releases
- Integrated with performance monitoring

## Future Considerations

### Platform Portability
As Zig's fuzz testing evolves:
- Monitor Zig releases for multi-platform support
- Consider alternative fuzzing approaches for non-macOS
- Evaluate libFuzzer or other tooling integration
- Plan migration strategy when platform support expands

### Tooling Evolution
- Integration with coverage tools
- Automated fuzz test generation
- Corpus management and sharing
- Performance regression detection

---

*This document ensures AI agents understand the critical constraints and methodologies for effective EVM fuzz testing development.*