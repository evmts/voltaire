const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

/// DebuggingTracer provides comprehensive debugging capabilities for the Go CLI debugger
/// Features:
/// - Step-by-step execution control
/// - Breakpoint support  
/// - State capture at each instruction
/// - Memory/stack/gas tracking
/// - Error reporting
pub const DebuggingTracer = struct {
    const Self = @This();
    
    allocator: std.mem.Allocator,
    
    // Control state
    step_mode: bool = false,          // true = step through each instruction
    paused: bool = false,             // true = execution is paused
    breakpoints: std.AutoHashMap(u32, void),    // Set of PC values to break on
    
    // Execution history
    steps: std.ArrayList(ExecutionStep),
    max_history: usize = 10000,       // Limit history to prevent memory issues
    
    // State snapshots for debugging
    state_snapshots: std.ArrayList(StateSnapshot),
    
    // Statistics
    total_instructions: u64 = 0,
    total_gas_used: u64 = 0,
    
    pub const ExecutionStep = struct {
        step_number: u64,
        pc: u32,
        opcode: u8,
        opcode_name: []const u8,
        gas_before: i32,
        gas_after: i32,
        gas_cost: u32,
        stack_before: []u256,    // Owned slice
        stack_after: []u256,     // Owned slice
        memory_size_before: usize,
        memory_size_after: usize,
        depth: u32,
        error_occurred: bool,
        error_msg: ?[]const u8,
    };
    
    pub const StateSnapshot = struct {
        pc: u32,
        gas_remaining: i32,
        stack: []u256,           // Owned slice
        memory_size: usize,
        depth: u32,
        timestamp: i64,
    };
    
    pub fn init() Self {
        // Use a global allocator for debugging tracer
        // This is acceptable for debugging scenarios
        const allocator = std.heap.c_allocator;
        return .{
            .allocator = allocator,
            .breakpoints = std.AutoHashMap(u32, void).init(allocator),
            .steps = std.ArrayList(ExecutionStep).init(allocator),
            .state_snapshots = std.ArrayList(StateSnapshot).init(allocator),
        };
    }
    
    pub fn deinit(self: *Self) void {
        // Free execution step memory
        for (self.steps.items) |*step| {
            self.allocator.free(step.stack_before);
            self.allocator.free(step.stack_after);
            if (step.error_msg) |msg| {
                self.allocator.free(msg);
            }
        }
        self.steps.deinit();
        
        // Free state snapshots
        for (self.state_snapshots.items) |*snapshot| {
            self.allocator.free(snapshot.stack);
        }
        self.state_snapshots.deinit();
        
        self.breakpoints.deinit();
    }
    
    /// Enable or disable step-by-step execution mode
    pub fn setStepMode(self: *Self, enabled: bool) void {
        self.step_mode = enabled;
    }
    
    /// Check if execution should pause (breakpoint or step mode)
    pub fn shouldPause(self: *Self, pc: u32) bool {
        return self.step_mode or self.breakpoints.get(pc) != null;
    }
    
    /// Pause execution
    pub fn pause(self: *Self) void {
        self.paused = true;
    }
    
    /// Resume execution
    pub fn resumeExecution(self: *Self) void {
        self.paused = false;
    }
    
    /// Add a breakpoint at the given PC
    pub fn addBreakpoint(self: *Self, pc: u32) !void {
        try self.breakpoints.put(pc, {});
    }
    
    /// Remove a breakpoint at the given PC
    pub fn removeBreakpoint(self: *Self, pc: u32) bool {
        return self.breakpoints.remove(pc);
    }
    
    /// Check if there's a breakpoint at the given PC
    pub fn hasBreakpoint(self: *Self, pc: u32) bool {
        return self.breakpoints.get(pc) != null;
    }
    
    /// Clear all breakpoints
    pub fn clearBreakpoints(self: *Self) void {
        self.breakpoints.clearRetainingCapacity();
    }
    
    /// Get the current execution step count
    pub fn getStepCount(self: *Self) u64 {
        return self.total_instructions;
    }
    
    /// Get the most recent execution steps
    pub fn getRecentSteps(self: *Self, count: usize) []const ExecutionStep {
        const start = if (self.steps.items.len > count) self.steps.items.len - count else 0;
        return self.steps.items[start..];
    }
    
    /// Get a specific execution step by index
    pub fn getStep(self: *Self, index: usize) ?*const ExecutionStep {
        if (index >= self.steps.items.len) return null;
        return &self.steps.items[index];
    }
    
    /// Create a snapshot of the current state
    pub fn captureState(self: *Self, comptime FrameType: type, frame: *const FrameType) !void {
        // Get current stack contents
        const stack_copy = try self.allocator.alloc(u256, frame.next_stack_index);
        for (0..frame.next_stack_index) |i| {
            // Access stack items from bottom to top for consistent ordering
            stack_copy[i] = frame.stack[i];
        }
        
        const snapshot = StateSnapshot{
            .pc = @as(u32, @intCast(frame.pc)),
            .gas_remaining = frame.gas_remaining,
            .stack = stack_copy,
            .memory_size = if (@hasField(FrameType, "memory")) frame.memory.size() else 0,
            .depth = if (@hasField(FrameType, "depth")) frame.depth else 0,
            .timestamp = std.time.milliTimestamp(),
        };
        
        try self.state_snapshots.append(snapshot);
        
        // Limit snapshots to prevent memory growth
        if (self.state_snapshots.items.len > self.max_history) {
            const old = self.state_snapshots.orderedRemove(0);
            self.allocator.free(old.stack);
        }
    }
    
    /// Required tracer interface: called before each operation
    pub fn beforeOp(self: *Self, comptime FrameType: type, frame: *const FrameType) void {
        // Check if we should pause execution
        const pc = @as(u32, @intCast(frame.pc));
        if (self.shouldPause(pc)) {
            self.paused = true;
        }
        
        // While paused, we would need to implement a mechanism to wait
        // In the C API, this could be handled by returning a "paused" status
        // and requiring explicit resume calls
        
        // Capture state before operation for step recording
        self.captureStateForStep(FrameType, frame, true) catch |err| {
            std.log.warn("Failed to capture before state: {}", .{err});
        };
    }
    
    /// Required tracer interface: called after each operation
    pub fn afterOp(self: *Self, comptime FrameType: type, frame: *const FrameType) void {
        // Update statistics
        self.total_instructions += 1;
        
        // Capture state after operation to complete the step record
        self.captureStateForStep(FrameType, frame, false) catch |err| {
            std.log.warn("Failed to capture after state: {}", .{err});
        };
        
        // Create state snapshot if configured
        self.captureState(FrameType, frame) catch |err| {
            std.log.warn("Failed to capture state snapshot: {}", .{err});
        };
    }
    
    /// Required tracer interface: called when an error occurs
    pub fn onError(self: *Self, comptime FrameType: type, frame: *const FrameType, err: anyerror) void {
        
        // Record error in current step if we have one
        if (self.steps.items.len > 0) {
            const current_step = &self.steps.items[self.steps.items.len - 1];
            current_step.error_occurred = true;
            
            // Store error message
            const error_name = @errorName(err);
            current_step.error_msg = self.allocator.dupe(u8, error_name) catch null;
        }
        
        // Always pause on error for debugging
        self.paused = true;
        
        std.log.debug("DebuggingTracer: Error occurred at PC {} in frame type {s}: {}", .{ frame.pc, @typeName(FrameType), err });
    }
    
    /// Helper function to capture state for step recording
    fn captureStateForStep(self: *Self, comptime FrameType: type, frame: *const FrameType, is_before: bool) !void {
        const pc = @as(u32, @intCast(frame.pc));
        const gas = frame.gas_remaining;
        
        // Create stack copy
        const stack_copy = try self.allocator.alloc(u256, frame.next_stack_index);
        for (0..frame.next_stack_index) |i| {
            stack_copy[i] = frame.stack[i];
        }
        
        if (is_before) {
            // Start a new execution step
            const opcode = if (frame.pc < frame.bytecode.len) frame.bytecode[frame.pc] else 0x00;
            
            const step = ExecutionStep{
                .step_number = self.total_instructions,
                .pc = pc,
                .opcode = opcode,
                .opcode_name = getOpcodeName(opcode),
                .gas_before = gas,
                .gas_after = gas, // Will be updated in afterOp
                .gas_cost = 0,    // Will be calculated in afterOp
                .stack_before = stack_copy,
                .stack_after = &[_]u256{}, // Will be updated in afterOp
                .memory_size_before = if (@hasField(FrameType, "memory")) frame.memory.size() else 0,
                .memory_size_after = 0, // Will be updated in afterOp
                .depth = if (@hasField(FrameType, "depth")) frame.depth else 0,
                .error_occurred = false,
                .error_msg = null,
            };
            
            try self.steps.append(step);
            
            // Limit history size
            if (self.steps.items.len > self.max_history) {
                const old = self.steps.orderedRemove(0);
                self.allocator.free(old.stack_before);
                self.allocator.free(old.stack_after);
                if (old.error_msg) |msg| {
                    self.allocator.free(msg);
                }
            }
        } else {
            // Update the current step with after state
            if (self.steps.items.len > 0) {
                const current_step = &self.steps.items[self.steps.items.len - 1];
                current_step.gas_after = gas;
                current_step.gas_cost = @intCast(@max(0, current_step.gas_before - gas));
                current_step.stack_after = stack_copy;
                current_step.memory_size_after = if (@hasField(FrameType, "memory")) frame.memory.size() else 0;
            } else {
                // No current step, free the stack copy
                self.allocator.free(stack_copy);
            }
        }
    }
    
    /// Get human-readable opcode name
    fn getOpcodeName(opcode: u8) []const u8 {
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
            0x10 => "LT",
            0x11 => "GT",
            0x12 => "SLT",
            0x13 => "SGT",
            0x14 => "EQ",
            0x15 => "ISZERO",
            0x16 => "AND",
            0x17 => "OR",
            0x18 => "XOR",
            0x19 => "NOT",
            0x1a => "BYTE",
            0x1b => "SHL",
            0x1c => "SHR",
            0x1d => "SAR",
            0x20 => "KECCAK256",
            0x30 => "ADDRESS",
            0x31 => "BALANCE",
            0x32 => "ORIGIN",
            0x33 => "CALLER",
            0x34 => "CALLVALUE",
            0x35 => "CALLDATALOAD",
            0x36 => "CALLDATASIZE",
            0x37 => "CALLDATACOPY",
            0x38 => "CODESIZE",
            0x39 => "CODECOPY",
            0x3a => "GASPRICE",
            0x3b => "EXTCODESIZE",
            0x3c => "EXTCODECOPY",
            0x3d => "RETURNDATASIZE",
            0x3e => "RETURNDATACOPY",
            0x3f => "EXTCODEHASH",
            0x40 => "BLOCKHASH",
            0x41 => "COINBASE",
            0x42 => "TIMESTAMP",
            0x43 => "NUMBER",
            0x44 => "PREVRANDAO",
            0x45 => "GASLIMIT",
            0x46 => "CHAINID",
            0x47 => "SELFBALANCE",
            0x48 => "BASEFEE",
            0x50 => "POP",
            0x51 => "MLOAD",
            0x52 => "MSTORE",
            0x53 => "MSTORE8",
            0x54 => "SLOAD",
            0x55 => "SSTORE",
            0x56 => "JUMP",
            0x57 => "JUMPI",
            0x58 => "PC",
            0x59 => "MSIZE",
            0x5a => "GAS",
            0x5b => "JUMPDEST",
            0x60 => "PUSH1",
            0x61 => "PUSH2",
            0x62 => "PUSH3",
            0x63 => "PUSH4",
            0x64 => "PUSH5",
            0x65 => "PUSH6",
            0x66 => "PUSH7",
            0x67 => "PUSH8",
            0x68 => "PUSH9",
            0x69 => "PUSH10",
            0x6a => "PUSH11",
            0x6b => "PUSH12",
            0x6c => "PUSH13",
            0x6d => "PUSH14",
            0x6e => "PUSH15",
            0x6f => "PUSH16",
            0x70 => "PUSH17",
            0x71 => "PUSH18",
            0x72 => "PUSH19",
            0x73 => "PUSH20",
            0x74 => "PUSH21",
            0x75 => "PUSH22",
            0x76 => "PUSH23",
            0x77 => "PUSH24",
            0x78 => "PUSH25",
            0x79 => "PUSH26",
            0x7a => "PUSH27",
            0x7b => "PUSH28",
            0x7c => "PUSH29",
            0x7d => "PUSH30",
            0x7e => "PUSH31",
            0x7f => "PUSH32",
            0x80 => "DUP1",
            0x81 => "DUP2",
            0x82 => "DUP3",
            0x83 => "DUP4",
            0x84 => "DUP5",
            0x85 => "DUP6",
            0x86 => "DUP7",
            0x87 => "DUP8",
            0x88 => "DUP9",
            0x89 => "DUP10",
            0x8a => "DUP11",
            0x8b => "DUP12",
            0x8c => "DUP13",
            0x8d => "DUP14",
            0x8e => "DUP15",
            0x8f => "DUP16",
            0x90 => "SWAP1",
            0x91 => "SWAP2",
            0x92 => "SWAP3",
            0x93 => "SWAP4",
            0x94 => "SWAP5",
            0x95 => "SWAP6",
            0x96 => "SWAP7",
            0x97 => "SWAP8",
            0x98 => "SWAP9",
            0x99 => "SWAP10",
            0x9a => "SWAP11",
            0x9b => "SWAP12",
            0x9c => "SWAP13",
            0x9d => "SWAP14",
            0x9e => "SWAP15",
            0x9f => "SWAP16",
            0xa0 => "LOG0",
            0xa1 => "LOG1",
            0xa2 => "LOG2",
            0xa3 => "LOG3",
            0xa4 => "LOG4",
            0xf0 => "CREATE",
            0xf1 => "CALL",
            0xf2 => "CALLCODE",
            0xf3 => "RETURN",
            0xf4 => "DELEGATECALL",
            0xf5 => "CREATE2",
            0xfa => "STATICCALL",
            0xfd => "REVERT",
            0xfe => "INVALID",
            0xff => "SELFDESTRUCT",
            else => "UNKNOWN",
        };
    }
    
    /// Reset all debugging state
    pub fn reset(self: *Self) void {
        // Clear execution history
        for (self.steps.items) |*step| {
            self.allocator.free(step.stack_before);
            self.allocator.free(step.stack_after);
            if (step.error_msg) |msg| {
                self.allocator.free(msg);
            }
        }
        self.steps.clearRetainingCapacity();
        
        // Clear state snapshots
        for (self.state_snapshots.items) |*snapshot| {
            self.allocator.free(snapshot.stack);
        }
        self.state_snapshots.clearRetainingCapacity();
        
        // Reset statistics
        self.total_instructions = 0;
        self.total_gas_used = 0;
        
        // Keep breakpoints but reset execution state
        self.paused = false;
    }
    
    /// Get debugging statistics
    pub fn getStats(self: *Self) struct {
        total_instructions: u64,
        total_gas_used: u64,
        breakpoint_count: usize,
        history_size: usize,
        snapshot_count: usize,
    } {
        return .{
            .total_instructions = self.total_instructions,
            .total_gas_used = self.total_gas_used,
            .breakpoint_count = self.breakpoints.count(),
            .history_size = self.steps.items.len,
            .snapshot_count = self.state_snapshots.items.len,
        };
    }
};

// Test the debugging tracer
test "DebuggingTracer basic functionality" {
    const allocator = std.testing.allocator;
    
    var tracer = DebuggingTracer.init(allocator);
    defer tracer.deinit();
    
    // Test breakpoint management
    try tracer.addBreakpoint(10);
    try tracer.addBreakpoint(20);
    
    try std.testing.expect(tracer.hasBreakpoint(10));
    try std.testing.expect(tracer.hasBreakpoint(20));
    try std.testing.expect(!tracer.hasBreakpoint(15));
    
    // Test step mode
    tracer.setStepMode(true);
    try std.testing.expect(tracer.shouldPause(5)); // Should pause in step mode
    
    tracer.setStepMode(false);
    try std.testing.expect(tracer.shouldPause(10)); // Should pause on breakpoint
    try std.testing.expect(!tracer.shouldPause(5)); // Should not pause on regular instruction
    
    // Test removal
    try std.testing.expect(tracer.removeBreakpoint(10));
    try std.testing.expect(!tracer.hasBreakpoint(10));
    try std.testing.expect(!tracer.removeBreakpoint(10)); // Already removed
    
    // Test clear
    tracer.clearBreakpoints();
    try std.testing.expect(!tracer.hasBreakpoint(20));
}

test "DebuggingTracer memory management" {
    const allocator = std.testing.allocator;
    
    var tracer = DebuggingTracer.init(allocator);
    defer tracer.deinit();
    
    // This test verifies that the tracer properly manages memory
    // when used with a mock frame
    const MockFrame = struct {
        pc: usize,
        gas_remaining: i32,
        bytecode: []const u8,
        stack: struct {
            items: []u256,
            
            fn depth(self: @This()) usize {
                return self.items.len;
            }
        },
        
        fn init() @This() {
            return .{
                .pc = 0,
                .gas_remaining = 1000,
                .bytecode = &[_]u8{0x60, 0x05}, // PUSH1 5
                .stack = .{ .items = &[_]u256{} },
            };
        }
    };
    
    var frame = MockFrame.init();
    
    // Test beforeOp and afterOp
    tracer.beforeOp(MockFrame, &frame);
    tracer.afterOp(MockFrame, &frame);
    
    // Verify step was recorded
    try std.testing.expectEqual(@as(usize, 1), tracer.steps.items.len);
    try std.testing.expectEqual(@as(u64, 1), tracer.total_instructions);
    
    const step = &tracer.steps.items[0];
    try std.testing.expectEqual(@as(u32, 0), step.pc);
    try std.testing.expectEqual(@as(u8, 0x60), step.opcode);
    try std.testing.expectEqualStrings("PUSH1", step.opcode_name);
}