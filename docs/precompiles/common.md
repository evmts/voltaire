# Common Types and Errors

**WARNING: This documentation was AI-generated and may contain inaccuracies. Always verify against the source code.**

## Overview

The `common.zig` module defines shared types and error handling for all Ethereum precompile contracts. These types provide a consistent interface across all precompile implementations.

## Source Code

**Location:** `/Users/williamcory/primitives/src/precompiles/common.zig`

## Types

### PrecompileResult

Result structure returned by all precompile execution functions.

```zig
pub const PrecompileResult = struct {
    output: []u8,
    gas_used: u64,

    pub fn deinit(self: PrecompileResult, allocator: std.mem.Allocator) void {
        allocator.free(self.output);
    }
};
```

**Fields:**
- `output: []u8` - The output data from the precompile execution. Must be freed by the caller.
- `gas_used: u64` - The actual gas consumed by the precompile execution.

**Methods:**
- `deinit(allocator: std.mem.Allocator)` - Frees the allocated output buffer.

### PrecompileError

Error set for all possible precompile execution errors.

```zig
pub const PrecompileError = error{
    // Input validation
    InvalidInput,
    InvalidSignature,
    InvalidPoint,
    InvalidPairing,
    InvalidOutputSize,

    // Resource errors
    OutOfGas,

    // Keccak-specific errors (from keccak_asm implementation)
    ExecutionError,     // Keccak execution failed
    StateError,         // Invalid Keccak state
    MemoryError,        // Keccak memory allocation/access error

    // General errors
    NotImplemented,
    Unknown,            // Unknown/unexpected error
} || std.mem.Allocator.Error;
```

### Error Categories

**Input Validation:** InvalidInput, InvalidSignature, InvalidPoint, InvalidPairing, InvalidOutputSize
- Returned when input data doesn't meet precompile requirements
- Always check input lengths and formats

**Resource Errors:** OutOfGas
- Insufficient gas provided for operation
- Check gas costs before calling precompiles

**Keccak Errors:** ExecutionError, StateError, MemoryError
- Specific to keccak_asm implementation
- Indicate internal cryptographic operation failures

**General Errors:** NotImplemented, Unknown
- NotImplemented: Feature not yet implemented
- Unknown: Unexpected error condition

**Memory Errors:** Via std.mem.Allocator.Error
- OutOfMemory: Allocation failed
- Handle memory errors appropriately

## Usage

All precompile modules return `PrecompileError!PrecompileResult` and should be used with error handling:

```zig
const result = try precompile.execute(allocator, input, gas_limit);
defer result.deinit(allocator);

// Use result.output and result.gas_used
```

## Memory Management

All precompile functions allocate the output buffer using the provided allocator. Callers are responsible for freeing this memory by calling `result.deinit(allocator)`.

**Important:** Always use `defer result.deinit(allocator)` immediately after successfully obtaining a result to ensure proper cleanup.

## Error Handling Examples

### Basic Error Handling

```zig
const result = precompile.execute(allocator, input, gas_limit) catch |err| {
    switch (err) {
        error.OutOfGas => std.log.err("Insufficient gas", .{}),
        error.InvalidInput => std.log.err("Invalid input format", .{}),
        error.OutOfMemory => std.log.err("Memory allocation failed", .{}),
        else => std.log.err("Unexpected error: {}", .{err}),
    }
    return err;
};
defer result.deinit(allocator);
```

### Specific Error Handling

```zig
// ECRECOVER example - invalid signatures don't error, they return zeros
const result = try ecrecover.execute(allocator, input, gas_limit);
defer result.deinit(allocator);

// Check if recovery succeeded by examining output
const is_zero = blk: {
    for (result.output) |byte| {
        if (byte != 0) break :blk false;
    }
    break :blk true;
};

if (is_zero) {
    std.log.warn("Signature recovery failed", .{});
}
```

## Thread Safety

The types themselves are thread-safe, but callers must ensure that:
1. Concurrent access to the same allocator is properly synchronized
2. Result output buffers are not shared between threads without synchronization
3. Each thread uses its own result instance

## Testing

When testing precompiles, always verify:
- Memory is properly freed (no leaks)
- Errors are handled correctly
- Gas calculations are accurate
- Output format matches specification

Example test pattern:

```zig
test "precompile - memory cleanup" {
    const testing = std.testing;
    const allocator = testing.allocator;

    const result = try precompile.execute(allocator, input, gas_limit);
    defer result.deinit(allocator);

    // Test assertions here
    try testing.expectEqual(expected_gas, result.gas_used);
}
```

## Best Practices

1. **Always use defer:** Call `result.deinit(allocator)` immediately after getting a result
2. **Check gas first:** Validate gas limits before attempting expensive operations
3. **Validate input:** Check input format before processing
4. **Handle errors gracefully:** Provide meaningful error messages
5. **Use testing allocator:** In tests, use `testing.allocator` to detect leaks

## Related Files

- All precompile implementations in `/src/precompiles/`
- Root precompile module: `/src/precompiles/root.zig`
