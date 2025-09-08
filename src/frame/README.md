# Frame Module

## Overview

The Frame module provides the lightweight execution context for EVM operations in Guillotine. It serves as the core orchestrator for opcode execution, handling direct instruction dispatch including stack manipulation, arithmetic operations, memory access, and storage operations.

The Frame is designed with clear separation of concerns:
- **Frame**: Handles opcode execution and state management
- **Plan**: Manages program counter (PC) tracking and jumps (external)  
- **Host/EVM**: Manages CALL/CREATE operations (external)
- **Environment**: Provides context queries (external)

## Core Components

### Primary Files

- **`frame.zig`** - Main Frame implementation with opcode dispatch and execution context
- **`frame_config.zig`** - Configuration options for stack size, memory limits, and gas tracking
- **`frame_handlers.zig`** - Handler registration and opcode dispatch management
- **`call_params.zig`** - Parameter structures for EVM calls (CALL, STATICCALL, etc.)
- **`call_result.zig`** - Result structures for EVM call returns
- **`block_info_config.zig`** - Block-level configuration and environment data

### Testing and Integration

- `frame_tests.zig` — Comprehensive test suite covering frame operations
- `frame_c.zig` — C interface bindings for external integration

## Key Data Structures

### Frame Structure
```zig
pub const Frame = struct {
    // Core execution components
    stack: StackType,
    memory: MemoryType, 
    storage: Database,
    
    // Execution state
    gas_remaining: u64,
    return_data: []const u8,
    logs: LogList,
    
    // Dispatch optimization
    dispatch_cache: DispatchCache,
    jump_table_cache: JumpTableCache,
    
    // Configuration
    config: FrameConfig,
};
```

### Call Parameters
The module defines comprehensive parameter structures for all EVM call types:
- `CallParams` - Standard contract calls
- `CreateParams` - Contract creation
- `StaticCallParams` - Read-only calls
- `DelegateCallParams` - Delegate execution

### Call Results
Standardized result structures capturing:
- Execution status (success/revert/error)
- Gas consumption
- Return data
- Generated logs
- State changes

## Performance Considerations

### Dispatch Optimization
- Global LRU cache for dispatch schedules
- Jump table generation for fast JUMP/JUMPI validation
- Tail‑call chaining via `getTailCallModifier()`

### Memory Layout
- **Cache-conscious Design**: Components arranged for optimal CPU cache utilization
- **Aligned Allocations**: Critical data structures use 64-byte alignment
- **Minimal Copying**: Zero-copy operations where possible

### Gas Tracking
- **Lazy Calculation**: Gas costs computed only when needed
- **Batch Operations**: Multiple gas deductions handled efficiently
- **Overflow Protection**: Safe arithmetic with proper error handling

## Usage Examples

### Basic Frame Initialization
```zig
const FrameConfig = @import("frame_config.zig").FrameConfig;
const Frame = @import("frame.zig").Frame;

// Configure frame with custom limits
const config = FrameConfig{
    .stack_size = 1024,
    .memory_limit = 1024 * 1024, // 1MB
    .gas_limit = 30_000_000,
};

// Initialize frame with database
var frame = try Frame.init(allocator, database, config);
defer frame.deinit();
```

### Executing Bytecode
```zig
// Prepare call parameters
const call_params = CallParams{
    .caller = caller_address,
    .contract = contract_address,
    .input = call_data,
    .gas_limit = 21000,
    .value = 0,
};

// Execute contract call
const result = try frame.execute_call(call_params);

// Handle results
switch (result.status) {
    .success => {
        // Process return data and logs
        const return_data = result.return_data;
        const logs = result.logs;
    },
    .revert => {
        // Handle revert with reason
        const revert_reason = result.return_data;
    },
    .error => {
        // Handle execution error
        return result.error_code;
    },
}
```

### Custom Handler Registration
```zig
// Register custom opcode handlers
var handlers = frame_handlers.HandlerRegistry.init(allocator);
try handlers.register(0x01, custom_add_handler);
try handlers.register(0x20, custom_keccak_handler);

// Apply handlers to frame
frame.set_handlers(handlers);
```

## Integration Notes

### With EVM Module
The Frame integrates tightly with the main EVM module for:
- Context switching between execution frames
- Cross-frame communication for CALL operations
- Shared resource management (gas, storage)

### With Storage Module  
Frame coordinates with storage for:
- Account state management
- Contract storage access
- Transaction journaling
- Snapshot/revert operations

### With Memory/Stack Modules
Direct integration provides:
- Zero-copy memory operations
- Optimized stack manipulation
- Bounds checking coordination

## Error Handling

The Frame uses Zig's error union system with comprehensive error types:
- `StackOverflow`/`StackUnderflow` - Stack limit violations
- `MemoryOverflow` - Memory expansion limits exceeded
- `OutOfGas` - Insufficient gas for operation
- `InvalidOpcode` - Unrecognized or disabled opcodes
- `StaticViolation` - Write operation in static context

All errors propagate cleanly through the execution chain with proper cleanup via defer patterns.
