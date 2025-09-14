# CLAUDE.md - Frame Module

## MISSION CRITICAL: Execution Context Integrity

**Frame bugs cause execution errors, consensus failures, fund loss.**

### EVM Frame Specs

- **Call Depth**: Max 1024 nested calls
- **Context**: Isolated stack/memory/storage per frame
- **Gas**: Precise accounting and forwarding
- **Return Data**: Proper call return handling
- **Exceptions**: Correct revert/failure propagation

### Core Files

- **`frame.zig`** - Main execution frame
- **`call_params.zig`** - Call parameters/validation
- **`call_result.zig`** - Call result handling
- **`frame_handlers.zig`** - Opcode dispatch
- **`frame_config.zig`** - Configuration/limits

## Frame Lifecycle Management

### Frame Creation (CRITICAL SAFETY)
```zig
pub fn create_frame(
    allocator: std.mem.Allocator,
    call_params: CallParams,
    parent_frame: ?*Frame,
) !*Frame {
    // CRITICAL: Check call depth limit
    const depth = if (parent_frame) |parent| parent.depth + 1 else 0;
    if (depth >= MAX_CALL_DEPTH) {
        return FrameError.CallDepthExceeded;
    }

    const frame = try allocator.create(Frame);
    errdefer allocator.destroy(frame);

    frame.* = Frame{
        .depth = depth,
        .call_params = call_params,
        .stack = try Stack.init(allocator),
        .memory = try Memory.init(allocator),
        .gas_remaining = call_params.gas_limit,
        .pc = 0,
        .parent = parent_frame,
    };

    return frame;
}
```

### Frame Destruction and Cleanup
```zig
pub fn destroy_frame(allocator: std.mem.Allocator, frame: *Frame) void {
    // CRITICAL: Cleanup all owned resources
    frame.stack.deinit(allocator);
    frame.memory.deinit(allocator);

    // Clear sensitive data
    frame.* = undefined;
    allocator.destroy(frame);
}
```

## Call Parameter Management

### Call Types and Validation
```zig
pub const CallType = enum {
    CALL,      // Regular external call
    CALLCODE,  // Call with caller's context
    DELEGATECALL, // Call with caller's context and value
    STATICCALL,   // Read-only call
    CREATE,    // Contract creation
    CREATE2,   // Deterministic contract creation
};

pub const CallParams = struct {
    call_type: CallType,
    caller: Address,
    to: Address,
    value: u256,
    input_data: []const u8,
    gas_limit: u64,
    is_static: bool, // No state changes allowed
};
```

### Gas Forwarding Rules
```zig
pub fn forward_gas(available_gas: u64, requested_gas: u64) u64 {
    // EIP-150: Forward at most 63/64 of available gas
    const max_forward = available_gas - (available_gas / 64);
    return @min(requested_gas, max_forward);
}
```

## Opcode Execution Engine

### Dispatch Table Architecture
```zig
pub const OpcodeHandler = *const fn (*Frame) FrameError!void;

pub const OPCODE_TABLE = [256]?OpcodeHandler{
    // Arithmetic operations
    0x01 => handle_add,
    0x02 => handle_mul,
    0x03 => handle_sub,
    // ... all 256 opcodes
};

pub fn execute_opcode(frame: *Frame, opcode: u8) !void {
    const handler = OPCODE_TABLE[opcode] orelse {
        return FrameError.InvalidOpcode;
    };

    // Check gas before execution
    const gas_cost = get_opcode_gas_cost(opcode, frame);
    if (frame.gas_remaining < gas_cost) {
        return FrameError.OutOfGas;
    }

    frame.gas_remaining -= gas_cost;
    try handler(frame);
}
```

### Program Counter Management
```zig
pub fn advance_pc(frame: *Frame, offset: u32) FrameError!void {
    if (frame.pc + offset >= frame.bytecode.len) {
        return FrameError.InvalidJump;
    }
    frame.pc += offset;
}

pub fn jump_to(frame: *Frame, destination: u32) FrameError!void {
    // CRITICAL: Validate jump destination
    if (!is_valid_jump_destination(frame.bytecode, destination)) {
        return FrameError.InvalidJump;
    }
    frame.pc = destination;
}
```

## Gas Accounting (CONSENSUS CRITICAL)

### Gas Cost Calculation
```zig
pub fn calculate_call_gas(
    frame: *Frame,
    call_type: CallType,
    to: Address,
    value: u256,
) u64 {
    var gas_cost: u64 = 0;

    // Base call cost
    gas_cost += if (frame.storage.access_list.contains_address(to))
        WARM_ACCOUNT_ACCESS else COLD_ACCOUNT_ACCESS;

    // Value transfer cost
    if (value > 0) {
        gas_cost += CALL_VALUE_TRANSFER_GAS;

        // New account creation cost
        if (!frame.storage.account_exists(to)) {
            gas_cost += NEW_ACCOUNT_GAS;
        }
    }

    // Static call has no additional costs
    if (call_type == .STATICCALL) {
        return gas_cost;
    }

    return gas_cost;
}
```

### Gas Refund Tracking
```zig
pub fn track_gas_refund(frame: *Frame, refund_amount: u64) void {
    // EIP-3529: Limit refunds to 1/5 of gas used
    const max_refund = (frame.initial_gas - frame.gas_remaining) / 5;
    frame.gas_refund = @min(frame.gas_refund + refund_amount, max_refund);
}
```

## Return Data Management

### Call Result Handling
```zig
pub const CallResult = struct {
    success: bool,
    return_data: []const u8,
    gas_used: u64,
    gas_refund: u64,
    logs: []const Log,
    created_address: ?Address, // For CREATE/CREATE2
};

pub fn handle_call_return(
    frame: *Frame,
    result: CallResult,
) FrameError!void {
    // Update gas accounting
    if (result.success) {
        frame.gas_remaining += result.gas_refund;
    }

    // Set return data for RETURNDATASIZE/RETURNDATACOPY
    frame.return_data = try frame.allocator.dupe(u8, result.return_data);
    errdefer frame.allocator.free(frame.return_data);

    // Push success flag to stack
    try frame.stack.push(if (result.success) 1 else 0);
}
```

## Static Call Enforcement

### State Change Prevention
```zig
pub fn enforce_static_context(frame: *Frame) FrameError!void {
    if (frame.is_static) {
        return FrameError.StateChangeInStaticContext;
    }
}

// Check before any state-modifying operation
pub fn check_static_violation(frame: *Frame, opcode: u8) FrameError!void {
    if (frame.is_static) {
        switch (opcode) {
            0x54 => return FrameError.StateChangeInStaticContext, // SSTORE
            0xA0...0xA4 => return FrameError.StateChangeInStaticContext, // LOG*
            0xF1, 0xF2 => return FrameError.StateChangeInStaticContext, // CALL/CALLCODE with value
            0xFF => return FrameError.StateChangeInStaticContext, // SELFDESTRUCT
            else => {},
        }
    }
}
```

## Exception Handling and Reversion

### Revert Processing
```zig
pub fn handle_revert(frame: *Frame) FrameError!void {
    // Get revert data from memory
    const offset = try frame.stack.pop();
    const size = try frame.stack.pop();

    if (offset + size > frame.memory.size()) {
        return FrameError.OutOfBounds;
    }

    // Set return data
    frame.return_data = try frame.allocator.dupe(
        u8,
        frame.memory.get_slice(offset, size)
    );

    return FrameError.Revert;
}
```

### Error Propagation
```zig
pub fn propagate_error(
    parent: *Frame,
    child_result: CallResult,
) FrameError!void {
    if (!child_result.success) {
        // Restore gas on child failure
        parent.gas_remaining += child_result.gas_used;

        // Set return data from child
        parent.return_data = try parent.allocator.dupe(
            u8,
            child_result.return_data
        );
    }
}
```

## Critical Safety Checks

### Stack Overflow Prevention
```zig
pub fn check_call_depth(frame: *Frame) FrameError!void {
    if (frame.depth >= MAX_CALL_DEPTH) {
        return FrameError.CallDepthExceeded;
    }
}
```

### Gas Limit Validation
```zig
pub fn validate_gas_limit(requested: u64, available: u64) FrameError!void {
    if (requested > available) {
        return FrameError.InsufficientGas;
    }
}
```

## Performance Optimization

### Hot Path Optimization
- Minimize allocations in opcode handlers
- Cache frequently accessed data
- Use jump tables for O(1) dispatch
- Optimize stack/memory operations

### Memory Management
- Pool frame allocations
- Reuse temporary buffers
- Minimize copying of large data structures

## Testing Requirements

### Unit Tests MUST Cover
- Frame creation/destruction with all call types
- Gas forwarding and accounting accuracy
- Call depth limit enforcement
- Static context violation detection
- Return data handling for all scenarios

### Integration Tests
- Complex call chains with various depths
- Gas accounting across multiple frames
- Error propagation through call stack
- Memory isolation between frames

## Emergency Procedures

### Frame Corruption Detection
1. **Stack Validation**: Check stack pointer bounds and contents
2. **Memory Consistency**: Verify memory state integrity
3. **Gas Accounting**: Validate gas calculations
4. **Context Isolation**: Ensure frame isolation maintained

### Execution Failure Recovery
1. **State Rollback**: Restore to last known good state
2. **Frame Cleanup**: Properly destroy corrupted frames
3. **Error Analysis**: Determine root cause of failure
4. **Reference Check**: Compare with other EVM implementations

Remember: **Frame management is the backbone of EVM execution.** Any error in frame handling can cascade through the entire execution engine. Always maintain strict bounds checking, proper resource cleanup, and accurate gas accounting.