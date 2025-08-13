# EVM Test Migration to Frame-based Execution

## Overview
This document tracks the migration of tests from the old EVM API to the new Frame-based execution model.

## Migration Status

### ✅ Completed
1. **evm_new_tests.zig** - New comprehensive test suite for Frame-based execution
   - EVM initialization tests
   - Frame initialization and configuration
   - Call-based execution (CALL, CREATE)
   - State persistence and management
   - Access list tracking
   - Gas consumption tracking
   - Edge cases (stack underflow, out of gas)
   - Memory management and cleanup

2. **frame_tests.zig** - Frame-specific tests
   - Frame memory layout optimization
   - Chain rules and hardfork detection
   - Gas consumption
   - Depth tracking
   - Static call restrictions
   - Block context
   - CREATE and DELEGATECALL contexts
   - Memory and stack access through Frame
   - Cleanup and deinitialization

3. **execution/*.zig** - Already using Frame-based patterns
   - arithmetic.zig - Uses Frame for stack and gas
   - block.zig - Uses minimal context for testing opcodes
   - Other execution files follow similar patterns

### ⚠️ Deprecated (To Be Removed)
- **evm.zig tests (lines 415-1403)** - Old tests still present but marked as deprecated
  - These test old fields like `return_data`, direct `depth` and `read_only` access
  - Should be removed once new API is fully validated

### 📋 Migration Guidelines

#### Old Pattern (Deprecated)
```zig
var evm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
// Direct field access
evm.depth = 5;
evm.read_only = true;
evm.return_data = &data;
```

#### New Pattern (Frame-based)
```zig
// Initialize EVM
var evm = try Evm.Evm.init(allocator, db_interface, null, null, null, 0, false, null);

// Use CallParams for execution
const call_params = CallParams{ .call = .{
    .caller = caller_addr,
    .to = contract_addr,
    .value = 0,
    .input = &[_]u8{},
    .gas = 100_000,
}};
const result = try evm.call(call_params);

// Or work directly with Frame for low-level testing
var frame = try Frame.init(
    gas_remaining,
    static_call,
    call_depth,
    contract_address,
    caller,
    value,
    // ... other parameters
);
```

## Key Changes

### 1. Execution Model
- **Old**: Direct manipulation of EVM fields
- **New**: Frame encapsulates execution context
- **Benefit**: Better cache locality, clearer separation of concerns

### 2. Gas Management
- **Old**: Gas tracked in various places
- **New**: `frame.gas_remaining` centralized in Frame
- **Benefit**: Simpler gas accounting, fewer cache misses

### 3. State Access
- **Old**: Direct state manipulation through EVM
- **New**: State accessed through Frame's database interface
- **Benefit**: Better transaction isolation, cleaner rollback

### 4. Memory Layout
- **Old**: Scattered fields across EVM struct
- **New**: Frame organized by access patterns (hot/warm/cold)
- **Benefit**: Optimized for CPU cache, better performance

## Testing Strategy

### Unit Tests
- Test individual opcodes with minimal Frame context
- Focus on correctness of operations
- Use mock/stub components where possible

### Integration Tests
- Test full contract execution through `evm.call()`
- Verify state changes persist correctly
- Test interaction between components

### Performance Tests
- Measure gas consumption
- Verify memory layout optimizations
- Test with large contracts and deep call stacks

## Next Steps

1. **Validate New Tests**: Run full test suite to ensure coverage
2. **Remove Old Tests**: Once validated, remove deprecated tests from evm.zig
3. **Update Documentation**: Ensure all examples use new API
4. **Performance Benchmarks**: Compare old vs new implementation

## Notes

- The compatibility layer (InterprResult, interpretCompat) is temporary
- Tests should gradually migrate to use Frame directly or CallParams
- Focus on testing behavior, not implementation details