# CLAUDE.md - Tracer Module

## MISSION CRITICAL: Execution Monitoring

**Tracer bugs hide critical issues.** Tracing must be accurate without affecting execution.

## How MinimalEvm Validation Works

The tracer validates Frame execution using a **parallel MinimalEvm** that executes the same logical operations:

### Execution Flow
1. **before_instruction()** - Called before every Frame handler executes
2. **executeMinimalEvmForOpcode()** - Executes equivalent operations in MinimalEvm
3. **after_instruction()** - Validates Frame and MinimalEvm states match
4. **validateMinimalEvmState()** - Compares stack, memory, gas between implementations

### Opcode Mapping
- **Regular opcodes (0x00-0xFF)**: Execute exactly 1 operation in MinimalEvm using `executeOpcode()`
- **Synthetic opcodes (>0xFF)**: Execute N sequential operations using `step()` where N = fusion count

### Synthetic Opcode Examples
```zig
// Frame executes PUSH_ADD_INLINE (single fused operation)
// MinimalEvm executes 2 steps: PUSH + ADD
.PUSH_ADD_INLINE => {
    inline for (0..2) |_| {
        evm.step() catch |e| { ... };
    }
}

// Frame executes FUNCTION_DISPATCH (complex fusion)
// MinimalEvm executes 4 steps: PUSH4 + EQ + PUSH + JUMPI
.FUNCTION_DISPATCH => {
    inline for (0..4) |_| {
        evm.step() catch |e| { ... };
    }
}
```

### Key Principle
**Frame uses optimized dispatch, MinimalEvm uses sequential bytecode execution.** The tracer ensures both reach the same logical state by executing the correct number of equivalent operations.

## Module Components

### Core Files
- **`tracer.zig`** - Main tracer with DefaultTracer
- **`MinimalEvm.zig`** - Standalone EVM (65KB)
- **`MinimalEvm_c.zig`** - C FFI wrapper for WASM
- **`pc_tracker.zig`** - Program counter tracking
- **`spec.md`** - Tracer spec

## Recent Changes

### Tracer Assertion System
- Replaced `std.debug.assert` with `tracer.assert()`
- Added descriptive assertion messages
- Integrated assertion tracking

### Enhanced Interface
- Bytecode analysis lifecycle methods
- Improved gas tracking
- Cursor-aware dispatch synchronization

### MinimalEvm
- **CRITICAL FIX**: Stack operand order for binary ops
- Fixed LIFO semantics (first pop = top)
- Complete WASM C FFI interface

### WASM Integration
- Opaque handle pattern
- Complete EVM lifecycle
- State inspection
- u256 byte array conversion

## Critical Implementation Details

### Architecture
- EIP-2929 access tracking
- Opcode-level tracing
- Stack/memory monitoring
- Gas consumption analysis
- Call frame tracing
- Bytecode analysis

### Responsibilities
- Execution tracing
- State change monitoring
- Performance analysis
- Debug information
- Error analysis
- Validation

### Tracer Types
- **DefaultTracer**: Production minimal overhead
- **MinimalEvm**: Standalone for differential testing
- **Structural**: Basic flow and state
- **Call**: Call/return patterns
- **Custom**: User-defined via interface

### Safety Requirements
- NEVER modify execution state during tracing
- Perfect isolation between tracer and EVM
- Handle failures gracefully
- No tracing overhead on gas calculations
- Descriptive assertion messages
- Proper WASM memory boundaries

### MinimalEvm Stack Semantics (CRITICAL)
```zig
// CORRECT - Stack is LIFO, first pop gets top
pub fn add(self: *MinimalEvm) !void {
    const a = try self.popStack(); // Top of stack
    const b = try self.popStack(); // Second item
    try self.pushStack(a +% b);
}

// CORRECT - For SUB: a - b where a is top
pub fn sub(self: *MinimalEvm) !void {
    const a = try self.popStack(); // Top (subtrahend)
    const b = try self.popStack(); // Second (minuend)
    try self.pushStack(b -% a);    // b - a
}
```

### WASM C Interface Pattern
```c
// Create EVM instance
void* evm = evm_create(bytecode, bytecode_len, gas_limit);

// Set call context
evm_set_call_context(evm, caller, address, value, calldata, calldata_len);

// Execute
bool success = evm_execute(evm);

// Inspect state
uint64_t gas_used = evm_get_gas_used(evm);
uint32_t pc = evm_get_pc(evm);

// Cleanup
evm_destroy(evm);
```

### Performance
- Conditional tracing per opcode type
- Efficient data structures
- Memory pooling
- Lazy evaluation
- Zero-cost abstractions
- Optimized WASM builds

### Testing
- Differential testing against revm
- MinimalEvm ground truth
- Comprehensive assertions
- WASM via C FFI
- Gas accuracy verification

### Emergency Procedures
- Disable on memory exhaustion
- Handle crashes gracefully
- Validate trace data
- Fallback to minimal tracing
- Clear error messages

## Integration

### Dispatch System
- Assertions replace debug assertions
- Cursor-aware dispatch tracking
- Fusion detection
- Jump table validation

### Bytecode Analysis
- Track metadata detection
- Monitor JUMPDEST analysis
- Record fusion opportunities
- Validate preprocessing

### With Frame Execution
- Pass tracer through bytecode initialization
- Track frame lifecycle and gas accounting
- Monitor stack operations with LIFO validation
- Ensure proper error propagation

Remember: **Tracers are observers, never participants.** They must not influence execution while providing accurate debugging information. The MinimalEvm serves as both a tracer and a reference implementation for testing correctness.