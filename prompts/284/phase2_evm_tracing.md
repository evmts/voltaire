# Phase 2 Overview: EVM Tracing Infrastructure for Transaction Verification

## Meta-Prompt Overview
This document serves as the master overview for Phase 2, which has been broken down into **4 atomic, independently implementable prompts**. Each atomic prompt can be completed with full testing in 45-90 minutes.

## Phase 2 Architecture Strategy
Phase 2 adds comprehensive tracing capabilities to the EVM execution engine by implementing:
1. **Tracer interface and data structures** for capturing execution details
2. **Standard tracer implementation** that records all execution steps
3. **EVM integration hooks** for zero-overhead tracing when disabled
4. **State change capture utilities** for tracking stack/memory/storage changes

## Atomic Prompt Breakdown

### **Phase 2A: Tracer Interface and Data Structures**
📁 `phase2a_tracer_interface.md`
- **Scope**: Implement core tracer interface and execution trace data structures
- **Dependencies**: Phase 1C (ExecutionTrace primitives)
- **Deliverable**: Tracer interface with vtable pattern and trace data types
- **Estimated Time**: 60-75 minutes

### **Phase 2B: Standard Tracer Implementation**
📁 `phase2b_standard_tracer.md`
- **Scope**: Implement StandardTracer that captures all execution details
- **Dependencies**: Phase 2A (Tracer interface)
- **Deliverable**: Complete tracer implementation with memory management
- **Estimated Time**: 75-90 minutes

### **Phase 2C: EVM Integration and Hooks**
📁 `phase2c_evm_integration.md`
- **Scope**: Integrate tracing hooks into EVM execution loop
- **Dependencies**: Phase 2A, 2B (Tracer interface and implementation)
- **Deliverable**: EVM modifications with zero-overhead tracing
- **Estimated Time**: 60-75 minutes

### **Phase 2D: State Change Capture Utilities**
📁 `phase2d_state_capture.md`
- **Scope**: Implement utilities for capturing stack/memory/storage changes
- **Dependencies**: Phase 2A-2C (Complete tracing infrastructure)
- **Deliverable**: State change tracking with opcode string mapping
- **Estimated Time**: 45-60 minutes

## Current EVM Architecture Analysis

### Existing EVM Components
Based on codebase analysis, the current EVM system includes:

**Core Execution (`src/evm/evm.zig`)**:
- `Evm` struct with execution state management
- `init()`, `deinit()`, and `reset()` methods for lifecycle management
- Database interface integration for state persistence
- Access list management for EIP-2929 gas optimization

**Execution Flow (`src/evm/jump_table/jump_table.zig`)**:
- `JumpTable` with O(1) opcode dispatch via function pointers
- `execute()` method that calls opcode implementations
- Hardfork-specific jump tables (CANCUN is default)
- Cache-line aligned operation table for performance

**Result Types (`src/evm/evm/run_result.zig`)**:
- `RunResult` with status, gas tracking, and output data
- Status types: Success, Revert, Invalid, OutOfGas
- Comprehensive gas calculation and error handling

**Execution Context (`src/evm/execution/execution_result.zig`)**:
- `ExecutionResult` for individual opcode results
- `bytes_consumed` for program counter advancement
- `output` field for halt conditions and return data

### Current Limitations
The EVM lacks tracing infrastructure needed for verification:
1. No execution step recording during opcode execution
2. No stack/memory/storage change tracking
3. No structured trace output for comparison
4. No optional tracing hooks in the execution loop

## Implementation Requirements

### Task Overview
Add comprehensive tracing capabilities to the EVM without impacting performance when tracing is disabled. The tracing system must capture all execution details needed for comparison with network debug traces.

### Core Tracing Architecture

<details>
<summary><strong>1. Tracer Interface Design</strong></summary>

**File: `src/evm/tracing/tracer.zig`**
```zig
const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const Hash = primitives.Hash;

/// Tracer interface for capturing EVM execution details
pub const Tracer = struct {
    ptr: *anyopaque,
    vtable: *const VTable,
    
    pub const VTable = struct {
        /// Called before each opcode execution
        step_before: *const fn (ptr: *anyopaque, step_info: StepInfo) void,
        /// Called after each opcode execution
        step_after: *const fn (ptr: *anyopaque, step_result: StepResult) void,
        /// Called when execution completes
        finalize: *const fn (ptr: *anyopaque, final_result: FinalResult) void,
        /// Get the complete execution trace
        get_trace: *const fn (ptr: *anyopaque, allocator: std.mem.Allocator) anyerror!ExecutionTrace,
        /// Clean up tracer resources
        deinit: *const fn (ptr: *anyopaque, allocator: std.mem.Allocator) void,
    };
    
    pub fn stepBefore(self: Tracer, step_info: StepInfo) void {
        self.vtable.step_before(self.ptr, step_info);
    }
    
    pub fn stepAfter(self: Tracer, step_result: StepResult) void {
        self.vtable.step_after(self.ptr, step_result);
    }
    
    pub fn finalize(self: Tracer, final_result: FinalResult) void {
        self.vtable.finalize(self.ptr, final_result);
    }
    
    pub fn getTrace(self: Tracer, allocator: std.mem.Allocator) !ExecutionTrace {
        return self.vtable.get_trace(self.ptr, allocator);
    }
    
    pub fn deinit(self: Tracer, allocator: std.mem.Allocator) void {
        self.vtable.deinit(self.ptr, allocator);
    }
};
```
</details>

<details>
<summary><strong>2. Trace Data Structures</strong></summary>

```zig
/// Information available before opcode execution
pub const StepInfo = struct {
    pc: u64,
    opcode: u8,
    gas_remaining: u64,
    depth: u32,
    address: Address,
    stack_size: usize,
    memory_size: usize,
};

/// Information available after opcode execution
pub const StepResult = struct {
    gas_cost: u64,
    gas_remaining: u64,
    stack_changes: StackChanges,
    memory_changes: MemoryChanges,
    storage_changes: []StorageChange,
    logs_emitted: []LogEntry,
    error_occurred: ?ExecutionError.Error,
};

/// Complete execution trace
pub const ExecutionTrace = struct {
    gas_used: u64,
    failed: bool,
    return_value: []u8,
    struct_logs: []StructLog,
    
    pub fn deinit(self: *const ExecutionTrace, allocator: std.mem.Allocator) void {
        allocator.free(self.return_value);
        for (self.struct_logs) |*log| {
            log.deinit(allocator);
        }
        allocator.free(self.struct_logs);
    }
};

/// Individual execution step in the trace
pub const StructLog = struct {
    pc: u64,
    op: []const u8,
    gas: u64,
    gas_cost: u64,
    depth: u32,
    stack: []u256,
    memory: []u8,
    storage: std.HashMap(Hash, Hash, std.hash_map.StringContext, 80),
    
    pub fn deinit(self: *StructLog, allocator: std.mem.Allocator) void {
        allocator.free(self.op);
        allocator.free(self.stack);
        allocator.free(self.memory);
        self.storage.deinit();
    }
};

/// Stack state changes during opcode execution
pub const StackChanges = struct {
    items_pushed: []u256,
    items_popped: []u256,
    
    pub fn deinit(self: *const StackChanges, allocator: std.mem.Allocator) void {
        allocator.free(self.items_pushed);
        allocator.free(self.items_popped);
    }
};

/// Memory changes during opcode execution
pub const MemoryChanges = struct {
    offset: u64,
    data: []u8,
    
    pub fn deinit(self: *const MemoryChanges, allocator: std.mem.Allocator) void {
        allocator.free(self.data);
    }
};

/// Storage slot change
pub const StorageChange = struct {
    address: Address,
    slot: Hash,
    old_value: Hash,
    new_value: Hash,
};

/// Log entry emitted by LOG opcodes
pub const LogEntry = struct {
    address: Address,
    topics: []Hash,
    data: []u8,
    
    pub fn deinit(self: *const LogEntry, allocator: std.mem.Allocator) void {
        allocator.free(self.topics);
        allocator.free(self.data);
    }
};
```
</details>

<details>
<summary><strong>3. Standard Tracer Implementation</strong></summary>

**File: `src/evm/tracing/standard_tracer.zig`**
```zig
/// Standard tracer that captures all execution details
pub const StandardTracer = struct {
    allocator: std.mem.Allocator,
    struct_logs: std.ArrayList(StructLog),
    current_step: ?StepInfo,
    gas_used: u64,
    failed: bool,
    return_value: []u8,
    
    pub fn init(allocator: std.mem.Allocator) StandardTracer {
        return StandardTracer{
            .allocator = allocator,
            .struct_logs = std.ArrayList(StructLog).init(allocator),
            .current_step = null,
            .gas_used = 0,
            .failed = false,
            .return_value = &[_]u8{},
        };
    }
    
    pub fn toTracer(self: *StandardTracer) Tracer {
        return Tracer{
            .ptr = self,
            .vtable = &.{
                .step_before = stepBefore,
                .step_after = stepAfter,
                .finalize = finalize,
                .get_trace = getTrace,
                .deinit = deinitTracer,
            },
        };
    }
    
    fn stepBefore(ptr: *anyopaque, step_info: StepInfo) void {
        const self: *StandardTracer = @ptrCast(@alignCast(ptr));
        self.current_step = step_info;
    }
    
    fn stepAfter(ptr: *anyopaque, step_result: StepResult) void {
        const self: *StandardTracer = @ptrCast(@alignCast(ptr));
        
        if (self.current_step) |step_info| {
            // Create struct log entry
            var struct_log = StructLog{
                .pc = step_info.pc,
                .op = try self.allocator.dupe(u8, opcodeToString(step_info.opcode)),
                .gas = step_result.gas_remaining + step_result.gas_cost,
                .gas_cost = step_result.gas_cost,
                .depth = step_info.depth,
                .stack = try captureStack(self.allocator, step_result.stack_changes),
                .memory = try captureMemory(self.allocator, step_result.memory_changes),
                .storage = try captureStorage(self.allocator, step_result.storage_changes),
            };
            
            self.struct_logs.append(struct_log) catch |err| {
                std.log.err("Failed to append struct log: {}", .{err});
            };
        }
        
        self.current_step = null;
    }
    
    fn finalize(ptr: *anyopaque, final_result: FinalResult) void {
        const self: *StandardTracer = @ptrCast(@alignCast(ptr));
        self.gas_used = final_result.gas_used;
        self.failed = final_result.failed;
        self.return_value = try self.allocator.dupe(u8, final_result.return_value);
    }
    
    fn getTrace(ptr: *anyopaque, allocator: std.mem.Allocator) !ExecutionTrace {
        const self: *StandardTracer = @ptrCast(@alignCast(ptr));
        
        return ExecutionTrace{
            .gas_used = self.gas_used,
            .failed = self.failed,
            .return_value = try allocator.dupe(u8, self.return_value),
            .struct_logs = try allocator.dupe(StructLog, self.struct_logs.items),
        };
    }
    
    fn deinitTracer(ptr: *anyopaque, allocator: std.mem.Allocator) void {
        const self: *StandardTracer = @ptrCast(@alignCast(ptr));
        self.deinit();
    }
    
    pub fn deinit(self: *StandardTracer) void {
        for (self.struct_logs.items) |*log| {
            log.deinit(self.allocator);
        }
        self.struct_logs.deinit();
        self.allocator.free(self.return_value);
    }
};
```
</details>

### EVM Integration Points

<details>
<summary><strong>4. EVM Execution Loop Modifications</strong></summary>

**Modifications to `src/evm/evm.zig`**:
```zig
/// EVM with optional tracing support
const Evm = @This();

// Add tracer field to EVM struct
tracer: ?Tracer = null,

/// Set tracer for execution monitoring
pub fn setTracer(self: *Evm, tracer: Tracer) void {
    self.tracer = tracer;
}

/// Clear tracer to disable tracing
pub fn clearTracer(self: *Evm) void {
    self.tracer = null;
}

/// Execute with optional tracing
pub fn executeWithTracing(self: *Evm, contract: *Contract, input: []const u8) !RunResult {
    // Existing execution logic with tracing hooks
    
    var pc: u64 = 0;
    var gas_remaining = contract.gas_limit;
    
    while (pc < contract.code.len) {
        const opcode = contract.code[pc];
        const operation = self.table.get_operation(opcode);
        
        // Tracing: Before step
        if (self.tracer) |tracer| {
            const step_info = StepInfo{
                .pc = pc,
                .opcode = opcode,
                .gas_remaining = gas_remaining,
                .depth = self.depth,
                .address = contract.address,
                .stack_size = frame.stack.size,
                .memory_size = frame.memory.context_size(),
            };
            tracer.stepBefore(step_info);
        }
        
        // Execute opcode
        const gas_before = gas_remaining;
        const result = try self.table.execute(pc, &interpreter, &state, opcode);
        const gas_after = gas_remaining - operation.gas_cost;
        
        // Tracing: After step
        if (self.tracer) |tracer| {
            const step_result = StepResult{
                .gas_cost = operation.gas_cost,
                .gas_remaining = gas_after,
                .stack_changes = try captureStackChanges(allocator, &frame.stack),
                .memory_changes = try captureMemoryChanges(allocator, &frame.memory),
                .storage_changes = try captureStorageChanges(allocator, &self.state),
                .logs_emitted = try captureLogsEmitted(allocator, &self.state),
                .error_occurred = null,
            };
            tracer.stepAfter(step_result);
        }
        
        // Handle execution result
        if (result.output.len > 0) {
            // Execution halted
            break;
        }
        
        pc += result.bytes_consumed;
    }
    
    // Finalize tracing
    if (self.tracer) |tracer| {
        const final_result = FinalResult{
            .gas_used = contract.gas_limit - gas_remaining,
            .failed = false, // Determine from execution result
            .return_value = result.output,
        };
        tracer.finalize(final_result);
    }
    
    return RunResult.init(contract.gas_limit, gas_remaining, .Success, null, result.output);
}
```
</details>

<details>
<summary><strong>5. State Change Capture Utilities</strong></summary>

**File: `src/evm/tracing/capture_utils.zig`**
```zig
/// Capture stack changes during opcode execution
pub fn captureStackChanges(allocator: std.mem.Allocator, stack: *const Stack) !StackChanges {
    // Implementation depends on how we track stack changes
    // This might require modifications to Stack to track deltas
    return StackChanges{
        .items_pushed = &[_]u256{},
        .items_popped = &[_]u256{},
    };
}

/// Capture memory changes during opcode execution
pub fn captureMemoryChanges(allocator: std.mem.Allocator, memory: *const Memory) !MemoryChanges {
    // Capture memory modifications
    // May require memory to track dirty regions
    return MemoryChanges{
        .offset = 0,
        .data = try allocator.dupe(u8, &[_]u8{}),
    };
}

/// Capture storage changes during opcode execution
pub fn captureStorageChanges(allocator: std.mem.Allocator, state: *const EvmState) ![]StorageChange {
    // Capture storage slot modifications
    // May require state to track dirty slots
    return try allocator.alloc(StorageChange, 0);
}

/// Convert opcode byte to string representation
pub fn opcodeToString(opcode: u8) []const u8 {
    return switch (opcode) {
        0x00 => "STOP",
        0x01 => "ADD",
        0x02 => "MUL",
        0x03 => "SUB",
        0x04 => "DIV",
        0x05 => "SDIV",
        0x06 => "MOD",
        0x07 => "SMOD",
        0x08 => "ADDMOD",
        0x09 => "MULMOD",
        0x0a => "EXP",
        0x0b => "SIGNEXTEND",
        // ... continue for all opcodes
        0x60 => "PUSH1",
        0x61 => "PUSH2",
        // ... continue for all PUSH opcodes
        0x80 => "DUP1",
        0x81 => "DUP2",
        // ... continue for all DUP opcodes
        0x90 => "SWAP1",
        0x91 => "SWAP2",
        // ... continue for all SWAP opcodes
        0xf3 => "RETURN",
        0xfd => "REVERT",
        else => "UNKNOWN",
    };
}
```
</details>

### Performance Considerations

<details>
<summary><strong>6. Zero-Cost Tracing When Disabled</strong></summary>

```zig
// Use comptime checks and inline functions for zero overhead
pub inline fn maybeTrace(self: *Evm, comptime trace_fn: anytype, args: anytype) void {
    if (self.tracer) |tracer| {
        @call(.always_inline, trace_fn, .{tracer} ++ args);
    }
}

// In execution loop:
self.maybeTrace(Tracer.stepBefore, .{step_info});
```
</details>

## Implementation Steps

### Step 1: Create Tracing Infrastructure
1. Create `src/evm/tracing/tracer.zig` with interface and data structures
2. Create `src/evm/tracing/standard_tracer.zig` with default implementation
3. Create `src/evm/tracing/capture_utils.zig` with state capture utilities

### Step 2: Integrate with EVM
1. Add tracer field to `Evm` struct in `src/evm/evm.zig`
2. Add tracing hooks to execution loop
3. Implement `executeWithTracing()` method

### Step 3: Enhance State Tracking
1. Modify `Stack` to track push/pop operations when tracing
2. Modify `Memory` to track write operations when tracing
3. Modify `EvmState` to track storage changes when tracing

### Step 4: Add Opcode String Mapping
1. Create comprehensive opcode-to-string mapping
2. Handle all 256 possible opcode values
3. Include proper names for all implemented opcodes

### Step 5: Testing and Validation
1. Create unit tests for tracer interface
2. Test tracing with simple bytecode sequences
3. Validate trace output format matches network traces

## Testing Strategy

### Unit Tests Required
```zig
test "StandardTracer captures basic execution steps" {
    // Test tracer with simple ADD operation
}

test "Tracer handles stack operations correctly" {
    // Test PUSH/POP/DUP/SWAP tracing
}

test "Tracer captures memory operations" {
    // Test MSTORE/MLOAD tracing
}

test "Tracer captures storage operations" {
    // Test SSTORE/SLOAD tracing
}

test "Tracing has zero overhead when disabled" {
    // Performance test comparing traced vs untraced execution
}
```

### Integration Tests
```zig
test "Complete transaction trace matches expected format" {
    // Execute a complex transaction and validate trace structure
}

test "Trace comparison with network debug_traceTransaction" {
    // Compare our trace with actual network trace (mock data)
}
```

## Success Criteria

### Functional Requirements
- [ ] Tracer interface compiles and works with EVM
- [ ] StandardTracer captures all execution details
- [ ] Tracing can be enabled/disabled without code changes
- [ ] Trace output matches network debug trace format

### Performance Requirements
- [ ] Zero overhead when tracing is disabled
- [ ] Minimal overhead when tracing is enabled
- [ ] Memory usage is reasonable for large transactions

### Code Quality Requirements
- [ ] Follow existing EVM patterns and style
- [ ] Comprehensive test coverage
- [ ] Proper memory management with defer patterns
- [ ] Clear documentation and examples

## Integration with Other Phases
This phase provides:
- **For Phase 1**: `ExecutionTrace` data structure used by `debugTraceTransaction()`
- **For Phase 3**: Detailed execution information for state loading optimization
- **For Phase 4**: Trace comparison capabilities for the main verification test

## Notes
- Focus on accuracy over performance initially
- Ensure trace format is compatible with Geth's debug_traceTransaction
- Consider implementing multiple tracer types (minimal, full, custom)
- Plan for future extensions like custom JavaScript tracers