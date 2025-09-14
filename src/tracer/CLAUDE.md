# CLAUDE.md - Tracer Module AI Context

## MISSION CRITICAL: Execution Monitoring and Debugging

The tracer module provides detailed execution monitoring, debugging, and analysis capabilities. **Tracer bugs can hide critical issues or provide incorrect debugging information.** Tracing must be accurate without affecting execution correctness.

## Module Components

### Core Files
- **`tracer.zig`** - Main tracer implementation with DefaultTracer and interfaces
- **`MinimalEvm.zig`** - Standalone minimal EVM implementation for testing/verification (65KB)
- **`MinimalEvm_c.zig`** - C FFI wrapper for WASM compilation and cross-language integration
- **`pc_tracker.zig`** - Program counter tracking and execution flow analysis
- **`spec.md`** - Detailed tracer specification and interface documentation

## Recent Major Changes (2024)

### Tracer Assertion System
- Replaced all `std.debug.assert` calls with `tracer.assert()` for better debugging
- Added descriptive assertion messages throughout dispatch validation
- Integrated assertion tracking into tracer for failure analysis

### Enhanced Tracer Interface
- Added bytecode analysis lifecycle methods:
  - `onBytecodeAnalysisStart/Complete`
  - `onInvalidOpcode`, `onJumpdestFound`
  - `onScheduleBuildStart/Complete`
  - `onFusionDetected`, `onStaticJumpResolved`
- Improved gas tracking accuracy with detailed comparison methods
- Added cursor-aware sidecar synchronization for dispatch tracking

### MinimalEvm Implementation
- **CRITICAL BUG FIX**: Corrected stack operand order for all binary operations
- Fixed LIFO semantics: first pop = top of stack (affects ADD, SUB, DIV, etc.)
- Added complete WASM C FFI interface for browser/embedded usage
- Supports full EVM execution with accurate gas accounting

### WASM Integration
- New C wrapper (`MinimalEvm_c.zig`) providing:
  - Opaque handle pattern for safe memory management
  - Complete EVM lifecycle: create, destroy, execute, step
  - State inspection: stack, memory, storage, gas, PC
  - Byte array conversion for u256 values (WASM compatibility)

## Critical Implementation Details

### Tracing Architecture
- **EIP-2929 Access Tracking**: Monitor cold/warm storage access with access lists
- **Opcode-Level Tracing**: Record every instruction execution with full state
- **Stack/Memory Monitoring**: Track state changes at each step with validation
- **Gas Consumption Analysis**: Precise gas usage tracking with differential comparison
- **Call Frame Tracing**: Monitor call depth and context switches with frame isolation
- **Bytecode Analysis**: Track preprocessing, optimization, and fusion detection

### Key Responsibilities
- **Execution Tracing**: Record instruction-by-instruction execution with cursor tracking
- **State Change Monitoring**: Track all state modifications with before/after snapshots
- **Performance Analysis**: Identify gas usage patterns and optimization opportunities
- **Debug Information**: Provide detailed execution context with assertion messages
- **Error Analysis**: Capture failure conditions and contexts with stack traces
- **Validation**: Ensure execution correctness through comprehensive state validation

### Tracer Types
- **DefaultTracer**: Production tracer with minimal overhead and assertion support
- **MinimalEvm**: Standalone EVM for differential testing and verification
- **Structural Tracer**: Basic execution flow and state changes
- **Call Tracer**: Focus on call/return patterns and gas usage
- **Custom Tracers**: User-defined tracing logic via interface compliance

### Critical Safety Requirements
- NEVER modify execution state during tracing
- Maintain perfect isolation between tracer and EVM
- Handle tracer failures gracefully without affecting execution
- Ensure tracing overhead doesn't change gas calculations
- Validate all assertions with descriptive error messages
- Properly handle WASM memory boundaries in C FFI

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

### Performance Optimization
- Conditional tracing (enable/disable per opcode type)
- Efficient data structure for trace storage
- Memory pooling for trace objects
- Lazy evaluation of expensive trace data
- Zero-cost abstractions in DefaultTracer
- Optimized WASM builds with ReleaseSmall mode

### Testing and Validation
- Differential testing against revm implementation
- MinimalEvm provides ground truth for opcode behavior
- Comprehensive assertion coverage with descriptive messages
- WASM testing via C FFI interface
- Gas accuracy verification to Yellow Paper specification

### Emergency Procedures
- Disable tracing on memory exhaustion
- Handle tracer crashes without stopping EVM execution
- Validate trace data integrity
- Fallback to minimal tracing on errors
- Assert with clear error messages for debugging
- Safe cleanup of WASM resources via opaque handles

## Integration Points

### With Dispatch System
- Tracer assertions replace debug assertions in dispatch validation
- Cursor-aware tracking of dispatch schedule execution
- Fusion detection and optimization tracking
- Jump table validation and static jump resolution

### With Bytecode Analysis
- Track Solidity metadata detection and trimming
- Monitor JUMPDEST analysis and validation
- Record fusion opportunities and optimizations
- Validate bytecode preprocessing correctness

### With Frame Execution
- Pass tracer through bytecode initialization
- Track frame lifecycle and gas accounting
- Monitor stack operations with LIFO validation
- Ensure proper error propagation

Remember: **Tracers are observers, never participants.** They must not influence execution while providing accurate debugging information. The MinimalEvm serves as both a tracer and a reference implementation for testing correctness.