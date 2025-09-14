# CLAUDE.md - Internal Module AI Context

## MISSION CRITICAL: Infrastructure Safety and Security

The internal module provides safety mechanisms and infrastructure utilities. **ANY bug in safety counters or internal utilities can enable DoS attacks or system compromise.** Internal utilities must provide bulletproof protection against resource exhaustion.

## Critical Implementation Details

### Safety Counter Architecture
- **DoS Prevention**: Protect against infinite loops and excessive resource usage
- **Configurable Limits**: Set appropriate bounds for different operations
- **Zero-Cost Abstraction**: Compile-time enable/disable for performance
- **Platform Awareness**: Handle WASM and native execution differently
- **Graceful Failure**: Controlled panic vs unreachable based on platform

### Key Responsibilities
- **Loop Bounds Checking**: Prevent infinite loops in bytecode analysis
- **Recursion Depth Limiting**: Enforce call depth limits (1024 maximum)
- **Resource Monitoring**: Track memory allocation and gas consumption
- **Attack Prevention**: Detect and prevent resource exhaustion attacks
- **Development Safety**: Provide debugging aids during development

### Critical Safety Implementation
```zig
// CRITICAL: Must handle counter overflow safely
pub fn inc(self: *Self) void {
    if (mode == .disabled) return;

    self.count += 1;
    if (self.count >= self.limit) {
        log.err("SafetyCounter limit reached: count={d}, limit={d}",
               .{ self.count, self.limit });

        // Platform-specific failure handling
        if (builtin.target.cpu.arch == .wasm32) {
            unreachable; // Trap in WASM
        } else {
            @panic("SafetyCounter limit exceeded"); // Panic on native
        }
    }
}
```

### Usage Patterns (CRITICAL PLACEMENTS)

#### Bytecode Analysis Protection
```zig
var analysis_counter = SafetyCounter(u32, .enabled).init(10000);
while (pc < bytecode.len) {
    analysis_counter.inc(); // Prevent infinite analysis loops
    // ... bytecode analysis logic
}
```

#### Call Depth Protection
```zig
var call_counter = SafetyCounter(u16, .enabled).init(1024);
fn execute_call(frame: *Frame) !void {
    call_counter.inc(); // Enforce EVM call depth limit
    defer call_counter.count -= 1;
    // ... call execution logic
}
```

#### Memory Allocation Protection
```zig
var alloc_counter = SafetyCounter(u64, .enabled).init(1_000_000);
fn allocate_memory(size: usize) ![]u8 {
    alloc_counter.inc(); // Track allocation count
    return allocator.alloc(u8, size);
}
```

### Performance Considerations
- **Compile-Time Optimization**: `.disabled` mode has zero runtime cost
- **Branch Prediction**: Early return on disabled mode is branch-predictor friendly
- **Type Flexibility**: Generic design supports optimal integer sizes
- **Minimal Overhead**: Single comparison and increment in hot paths

### Critical Error Handling
```zig
// NEVER ignore safety counter violations
// ALWAYS log the violation for analysis
// ALWAYS fail fast to prevent damage

if (self.count >= self.limit) {
    // Log with sufficient detail for debugging
    log.err("SafetyCounter limit reached: count={d}, limit={d}, operation={s}",
           .{ self.count, self.limit, operation_name });

    // Fail appropriately for platform
    if (comptime is_wasm_target()) {
        unreachable; // WASM trap
    } else {
        @panic("Resource limit exceeded"); // Native panic
    }
}
```

### Configuration Guidelines
- **Development**: Always use `.enabled` mode
- **Testing**: Use `.enabled` with generous limits
- **Production**: Consider `.disabled` for proven stable code paths
- **Fuzzing**: Use `.enabled` with tight limits to find issues

### Limit Setting Strategy
```zig
// Base limits on realistic usage patterns
const BYTECODE_ANALYSIS_LIMIT = 50_000;  // Max instructions to analyze
const CALL_DEPTH_LIMIT = 1024;          // EVM specification limit
const MEMORY_ALLOC_LIMIT = 10_000;      // Reasonable allocation count
const LOOP_ITERATION_LIMIT = 100_000;   // Prevent runaway loops
```

### Integration Points
- **EVM Execution**: Call depth and gas calculation protection
- **Bytecode Analysis**: Loop and recursion bounds
- **Memory Management**: Allocation count tracking
- **Network Processing**: Request handling limits
- **State Processing**: Transaction count limits

### Testing Requirements
- **Unit Tests**: All counter behaviors and edge cases
- **Integration Tests**: Real-world usage patterns and limits
- **Fuzzing**: Random inputs to trigger counter violations
- **Performance Tests**: Overhead measurement in hot paths
- **Platform Tests**: WASM vs native behavior validation

### Security Considerations
- **Attack Surface**: Safety counters are first line of defense against DoS
- **Resource Exhaustion**: Prevent all forms of resource abuse
- **Timing Attacks**: Consistent behavior regardless of counter state
- **Information Leakage**: Don't leak sensitive information in error messages

### Emergency Procedures
- **Counter Violation**: Immediate analysis of violation cause and impact
- **Limit Tuning**: Adjust limits based on real-world usage patterns
- **Bug Reports**: Detailed logging and reproduction information
- **Performance Issues**: Profile and optimize counter overhead
- **Security Incidents**: Analyze whether counters prevented attacks

### Debugging and Monitoring
```zig
// Add comprehensive logging for analysis
log.debug("SafetyCounter status: count={d}, limit={d}, operation={s}",
         .{ self.count, self.limit, @tagName(operation) });

// Track counter effectiveness
var violation_stats = struct {
    total_violations: u64 = 0,
    violations_by_type: std.EnumArray(OperationType, u64) =
        std.EnumArray(OperationType, u64).initFill(0),
};
```

### Best Practices
1. **Always Enable During Development**: Use `.enabled` mode for all development work
2. **Set Conservative Limits**: Start with lower limits and increase based on evidence
3. **Monitor Violations**: Log and analyze all safety counter violations
4. **Test Limit Handling**: Verify system behaves correctly at limits
5. **Document Limits**: Explain why specific limits were chosen
6. **Regular Review**: Periodically review and adjust limits based on usage

Remember: **Safety counters are the immune system of the EVM.** They must be robust, well-tested, and appropriately configured to prevent resource exhaustion attacks while not interfering with legitimate operations.