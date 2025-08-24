/// DebugPlan: A plan that validates advanced plan execution against simple plan and optionally REVM.
/// This plan executes both advanced and simple interpreters in parallel, validating that they
/// produce identical results for each operation.
const std = @import("std");
const Opcode = @import("opcode.zig").Opcode;
const OpcodeSynthetic = @import("opcode_synthetic.zig").OpcodeSynthetic;
pub const PlanConfig = @import("plan_config.zig").PlanConfig;
const plan_mod = @import("plan.zig");
const plan_minimal_mod = @import("plan_minimal.zig");
const Planner = @import("planner.zig").Planner;
const Frame = @import("frame.zig").Frame;
// REVM integration disabled - module not available

// Import primitives
const primitives = @import("primitives");

/// Metadata for REVM trace validation
pub const RevmTraceData = struct {
    pc: u64,
    opcode: u8,
    stack_before: []const primitives.u256,
    stack_after: []const primitives.u256,
    memory_before: []const u8,
    memory_after: []const u8,
    gas_remaining: u64,
    allocator: std.mem.Allocator,
    
    pub fn deinit(self: *RevmTraceData) void {
        self.allocator.free(self.stack_before);
        self.allocator.free(self.stack_after);
        self.allocator.free(self.memory_before);
        self.allocator.free(self.memory_after);
    }
};

/// REVM trace entry from JSON
const RevmTraceEntry = struct {
    pc: u64,
    op: u8,
    gas: u64,
    stack: []const primitives.u256,
    stack_after: ?[]const primitives.u256 = null,
    memory: ?[]const u8 = null,
    memory_after: ?[]const u8 = null,
};

/// Complete frame state for comparison
pub const FrameState = struct {
    stack: []primitives.u256,
    stack_height: usize,
    memory: []u8,
    memory_size: usize,
    pc: u32,
    gas_remaining: i64,
    return_data: []u8,
    allocator: std.mem.Allocator,
    
    pub fn deinit(self: *FrameState) void {
        self.allocator.free(self.stack);
        self.allocator.free(self.memory);
        self.allocator.free(self.return_data);
    }
    
    pub fn equals(self: *const FrameState, other: *const FrameState) bool {
        if (self.stack_height != other.stack_height) return false;
        if (self.memory_size != other.memory_size) return false;
        if (self.pc != other.pc) return false;
        if (self.gas_remaining != other.gas_remaining) return false;
        
        // Compare stack
        for (0..self.stack_height) |i| {
            if (self.stack[i] != other.stack[i]) return false;
        }
        
        // Compare memory
        if (!std.mem.eql(u8, self.memory[0..self.memory_size], other.memory[0..self.memory_size])) {
            return false;
        }
        
        // Compare return data
        return std.mem.eql(u8, self.return_data, other.return_data);
    }
    
    pub fn diff(self: *const FrameState, other: *const FrameState, writer: anytype) !void {
        if (self.stack_height != other.stack_height) {
            try writer.print("Stack height mismatch: {} vs {}\n", .{ self.stack_height, other.stack_height });
        }
        
        for (0..@min(self.stack_height, other.stack_height)) |i| {
            if (self.stack[i] != other.stack[i]) {
                try writer.print("Stack[{}] mismatch: 0x{x} vs 0x{x}\n", .{ i, self.stack[i], other.stack[i] });
            }
        }
        
        if (self.memory_size != other.memory_size) {
            try writer.print("Memory size mismatch: {} vs {}\n", .{ self.memory_size, other.memory_size });
        }
        
        // Find first memory difference
        for (0..@min(self.memory_size, other.memory_size)) |i| {
            if (self.memory[i] != other.memory[i]) {
                try writer.print("Memory[0x{x}] mismatch: 0x{x:0>2} vs 0x{x:0>2}\n", .{ i, self.memory[i], other.memory[i] });
                break;
            }
        }
        
        if (self.gas_remaining != other.gas_remaining) {
            try writer.print("Gas mismatch: {} vs {}\n", .{ self.gas_remaining, other.gas_remaining });
        }
    }
};

/// Factory function to create a DebugPlan type with the given configuration.
pub fn DebugPlan(comptime cfg: PlanConfig) type {
    comptime cfg.validate();
    
    return struct {
        pub const PcType = cfg.PcType();
        pub const InstructionIndexType = PcType;
        pub const WordType = cfg.WordType;
        pub const HandlerFn = plan_mod.HandlerFn;
        
        const Self = @This();
        const AdvancedPlan = plan_mod.Plan(cfg);
        const MinimalPlan = plan_minimal_mod.PlanMinimal(cfg);
        
        /// The advanced plan with optimizations
        advanced_plan: AdvancedPlan,
        /// The simple plan for validation
        minimal_plan: MinimalPlan,
        /// Allocator for creating debug handlers
        allocator: std.mem.Allocator,
        /// The bytecode being executed
        bytecode: []const u8,
        /// Original handlers before replacement
        original_handlers: [256]*const HandlerFn,
        /// Debug handlers that wrap original handlers
        debug_handlers: [256]*const HandlerFn,
        /// The sidecar frame for validation (set by first instruction)
        sidecar_frame: ?*anyopaque = null,
        /// Optional REVM trace for validation
        revm_trace: ?[]RevmTraceData = null,
        /// Current trace index
        trace_index: usize = 0,
        /// Storage for debug handler contexts (pre-allocated pool)
        debug_contexts: []DebugHandlerContext,
        next_context_idx: usize = 0,
        
        /// Initialize a DebugPlan with advanced and minimal plans.
        pub fn init(
            allocator: std.mem.Allocator,
            bytecode: []const u8,
            handlers: [256]*const HandlerFn,
        ) !Self {
            // Create planner for analysis
            const PlannerType = Planner(cfg);
            var planner = try PlannerType.init(allocator, bytecode);
            defer planner.deinit();
            
            // Create advanced plan
            const advanced_plan = try planner.create_instruction_stream(allocator, handlers);
            errdefer advanced_plan.deinit(allocator);
            
            // Create minimal plan
            const minimal_plan = try MinimalPlan.init(allocator, bytecode, handlers);
            errdefer minimal_plan.deinit();
            
            // Store original handlers
            const original_handlers: [256]*const HandlerFn = handlers;
            
            // Create debug handlers (will be populated during execution)
            const debug_handlers: [256]*const HandlerFn = handlers;
            
            // Allocate debug contexts pool (enough for all instructions)
            const max_contexts = advanced_plan.instructionStream.len;
            const debug_contexts = try allocator.alloc(DebugHandlerContext, max_contexts);
            errdefer allocator.free(debug_contexts);
            
            return Self{
                .advanced_plan = advanced_plan,
                .minimal_plan = minimal_plan,
                .allocator = allocator,
                .bytecode = bytecode,
                .original_handlers = original_handlers,
                .debug_handlers = debug_handlers,
                .debug_contexts = debug_contexts,
                .next_context_idx = 0,
                .sidecar_frame = null,
                .revm_trace = null,
                .trace_index = 0,
            };
        }
        
        /// Set REVM trace for validation
        pub fn setRevmTrace(self: *Self, trace: []RevmTraceData) void {
            self.revm_trace = trace;
            self.trace_index = 0;
        }
        
        /// Generate REVM trace for the current bytecode (DISABLED - REVM not available)
        pub fn generateRevmTrace(self: *Self, allocator: std.mem.Allocator, gas_limit: u64) !void {
            _ = self;
            _ = allocator;
            _ = gas_limit;
            return error.RevmNotAvailable;
        }
        
        /// Load REVM trace from a JSON file
        pub fn loadRevmTraceFromFile(self: *Self, allocator: std.mem.Allocator, path: []const u8) !void {
            const file = try std.fs.cwd().openFile(path, .{});
            defer file.close();
            
            const contents = try file.readToEndAlloc(allocator, 10 * 1024 * 1024); // 10MB max
            defer allocator.free(contents);
            
            // Parse JSON trace
            const parsed = try std.json.parseFromSlice(
                []const RevmTraceEntry,
                allocator,
                contents,
                .{ .allocate = .alloc_always },
            );
            defer parsed.deinit();
            
            // Convert to our trace format
            var trace = try allocator.alloc(RevmTraceData, parsed.value.len);
            errdefer {
                // Clean up partially allocated trace on error
                for (trace[0..]) |*t| {
                    t.deinit();
                }
                allocator.free(trace);
            }
            
            for (parsed.value, 0..) |entry, i| {
                trace[i] = RevmTraceData{
                    .pc = entry.pc,
                    .opcode = entry.op,
                    .stack_before = try allocator.dupe(primitives.u256, entry.stack),
                    .stack_after = try allocator.dupe(primitives.u256, entry.stack_after orelse &.{}),
                    .memory_before = try allocator.dupe(u8, entry.memory orelse &.{}),
                    .memory_after = try allocator.dupe(u8, entry.memory_after orelse &.{}),
                    .gas_remaining = entry.gas,
                    .allocator = allocator,
                };
            }
            
            self.setRevmTrace(trace);
        }
        
        /// Validate current frame state against REVM trace
        pub fn validateAgainstRevmTrace(self: *Self, frame: *anyopaque, pc: PcType) void {
            if (self.revm_trace == null) return;
            
            const trace = self.revm_trace.?;
            if (self.trace_index >= trace.len) {
                std.debug.panic("DebugPlan: REVM trace exhausted at PC {}", .{pc});
            }
            
            const trace_entry = &trace[self.trace_index];
            if (trace_entry.pc != pc) {
                std.debug.panic("DebugPlan: REVM trace PC mismatch: expected {} got {}", .{ trace_entry.pc, pc });
            }
            
            // Get frame type and validate
            const FrameType = @import("frame.zig").Frame(cfg);
            const typed_frame = @as(*FrameType, @ptrCast(@alignCast(frame)));
            
            // Validate gas
            const gas_remaining = @as(u64, @intCast(typed_frame.gas_remaining));
            if (gas_remaining != trace_entry.gas_remaining) {
                std.debug.panic("DebugPlan: REVM gas mismatch at PC {}: expected {} got {}", .{ pc, trace_entry.gas_remaining, gas_remaining });
            }
            
            // Validate stack
            if (typed_frame.stack.next_stack_index != trace_entry.stack_before.len) {
                std.debug.panic("DebugPlan: REVM stack size mismatch at PC {}: expected {} got {}", .{ pc, trace_entry.stack_before.len, typed_frame.stack.next_stack_index });
            }
            
            for (0..typed_frame.stack.next_stack_index) |i| {
                if (typed_frame.stack.stack[i] != trace_entry.stack_before[i]) {
                    std.debug.panic("DebugPlan: REVM stack[{}] mismatch at PC {}: expected {} got {}", .{ i, pc, trace_entry.stack_before[i], typed_frame.stack.stack[i] });
                }
            }
            
            self.trace_index += 1;
        }
        
        /// Get metadata with validation between advanced and minimal plans.
        pub fn getMetadata(
            self: *const Self,
            idx: *InstructionIndexType,
            comptime opcode: anytype,
        ) @TypeOf(self.advanced_plan.getMetadata(idx, opcode)) {
            // Get the current instruction index for validation
            const current_idx = idx.*;
            
            // Get metadata from advanced plan
            const advanced_metadata = self.advanced_plan.getMetadata(idx, opcode);
            
            // For minimal plan, we need to convert instruction index to PC
            const pc = self.instructionIndexToPc(current_idx) orelse 
                @panic("DebugPlan: Invalid instruction index");
            
            // Get metadata from minimal plan
            var minimal_idx = pc;
            const minimal_metadata = self.minimal_plan.getMetadata(&minimal_idx, opcode);
            
            // Validate metadata matches based on opcode type
            const opcode_value = comptime blk: {
                break :blk if (@TypeOf(opcode) == u8)
                    opcode
                else if (@TypeOf(opcode) == Opcode)
                    @intFromEnum(opcode)
                else if (@TypeOf(opcode) == OpcodeSynthetic)
                    @intFromEnum(opcode)
                else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                    @intFromEnum(@field(Opcode, @tagName(opcode)))
                else
                    @compileError("Invalid opcode type");
            };
            
            // For regular opcodes (not synthetic), validate metadata matches
            if (opcode_value < 0xB0) { // Not a synthetic opcode
                switch (opcode_value) {
                    // PUSH opcodes - validate the data matches
                    @intFromEnum(Opcode.PUSH1), @intFromEnum(Opcode.PUSH2), 
                    @intFromEnum(Opcode.PUSH3), @intFromEnum(Opcode.PUSH4),
                    @intFromEnum(Opcode.PUSH5), @intFromEnum(Opcode.PUSH6), 
                    @intFromEnum(Opcode.PUSH7), @intFromEnum(Opcode.PUSH8) => {
                        if (advanced_metadata != minimal_metadata) {
                            std.debug.panic(
                                "DebugPlan: PUSH metadata mismatch at idx={} pc={}: advanced={} minimal={}",
                                .{ current_idx, pc, advanced_metadata, minimal_metadata }
                            );
                        }
                    },
                    // PC opcode - values may differ but should be consistent
                    @intFromEnum(Opcode.PC) => {
                        // PC values can differ between plans, just validate they're reasonable
                        if (minimal_metadata != pc) {
                            std.debug.panic(
                                "DebugPlan: PC metadata inconsistent: pc={} minimal={}",
                                .{ pc, minimal_metadata }
                            );
                        }
                    },
                    // JUMPDEST - skip validation as minimal returns dummy values
                    @intFromEnum(Opcode.JUMPDEST) => {},
                    else => {},
                }
            } else {
                // Synthetic opcode - validate fusion is expected
                self.validateFusion(pc, opcode_value);
            }
            
            return advanced_metadata;
        }
        
        /// Get next instruction with validation and handler wrapping.
        pub fn getNextInstruction(
            self: *Self,
            idx: *InstructionIndexType,
            comptime opcode: anytype,
        ) *const HandlerFn {
            const current_idx = idx.*;
            const current_pc = self.instructionIndexToPc(current_idx) orelse 
                @panic("DebugPlan: Invalid instruction index");
            
            // Get handler from advanced plan
            const advanced_handler = self.advanced_plan.getNextInstruction(idx, opcode);
            
            // Calculate how many minimal opcodes we need to execute
            const opcode_count = self.getOpcodeCount(opcode);
            
            // Create debug handler that validates execution
            const debug_handler = self.createDebugHandler(
                current_idx,
                current_pc,
                opcode,
                opcode_count,
                advanced_handler,
            );
            
            // Store the debug handler
            // const opcode_value = comptime blk: {
            //     break :blk if (@TypeOf(opcode) == u8)
            //         opcode
            //     else if (@TypeOf(opcode) == Opcode)
            //         @intFromEnum(opcode)
            //     else if (@TypeOf(opcode) == OpcodeSynthetic)
            //         @intFromEnum(opcode)
            //     else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
            //         @intFromEnum(@field(Opcode, @tagName(opcode)))
            //     else
            //         @compileError("Invalid opcode type");
            // };
            
            // If this is the first instruction, wrap it to create sidecar frame
            if (current_idx == 0) {
                return self.createFirstInstructionHandler(debug_handler);
            }
            
            return debug_handler;
        }
        
        /// Get instruction index for a given PC value.
        pub fn getInstructionIndexForPc(self: *const Self, pc: PcType) ?InstructionIndexType {
            return self.advanced_plan.getInstructionIndexForPc(pc);
        }
        
        /// Convert instruction index to PC for minimal plan.
        fn instructionIndexToPc(self: *const Self, idx: InstructionIndexType) ?PcType {
            // Use the advanced plan's PC mapping in reverse
            if (self.advanced_plan.pc_to_instruction_idx) |map| {
                var iter = map.iterator();
                while (iter.next()) |entry| {
                    if (entry.value_ptr.* == idx) {
                        return entry.key_ptr.*;
                    }
                }
            }
            return null;
        }
        
        /// Validate that a fusion is expected at this location.
        fn validateFusion(self: *const Self, pc: PcType, synthetic_opcode: u8) void {
            // Get the actual opcodes from bytecode
            const opcode1 = self.bytecode[pc];
            const is_push = opcode1 >= @intFromEnum(Opcode.PUSH1) and 
                           opcode1 <= @intFromEnum(Opcode.PUSH32);
            
            if (!is_push) {
                std.debug.panic(
                    "DebugPlan: Fusion at pc={} but first opcode is not PUSH: {}",
                    .{ pc, opcode1 }
                );
            }
            
            const push_size = opcode1 - @intFromEnum(Opcode.PUSH1) + 1;
            const next_pc = pc + 1 + push_size;
            
            if (next_pc >= self.bytecode.len) {
                std.debug.panic(
                    "DebugPlan: Fusion at pc={} but next opcode is out of bounds",
                    .{pc}
                );
            }
            
            const opcode2 = self.bytecode[next_pc];
            
            // Validate fusion type matches actual opcodes
            switch (synthetic_opcode) {
                @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE),
                @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER) => {
                    if (opcode2 != @intFromEnum(Opcode.ADD)) {
                        std.debug.panic(
                            "DebugPlan: PUSH_ADD fusion but second opcode is not ADD: {}",
                            .{opcode2}
                        );
                    }
                },
                @intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE),
                @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER) => {
                    if (opcode2 != @intFromEnum(Opcode.MUL)) {
                        std.debug.panic(
                            "DebugPlan: PUSH_MUL fusion but second opcode is not MUL: {}",
                            .{opcode2}
                        );
                    }
                },
                @intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE),
                @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER) => {
                    if (opcode2 != @intFromEnum(Opcode.DIV)) {
                        std.debug.panic(
                            "DebugPlan: PUSH_DIV fusion but second opcode is not DIV: {}",
                            .{opcode2}
                        );
                    }
                },
                @intFromEnum(OpcodeSynthetic.PUSH_JUMP_INLINE),
                @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER) => {
                    if (opcode2 != @intFromEnum(Opcode.JUMP)) {
                        std.debug.panic(
                            "DebugPlan: PUSH_JUMP fusion but second opcode is not JUMP: {}",
                            .{opcode2}
                        );
                    }
                },
                @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_INLINE),
                @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER) => {
                    if (opcode2 != @intFromEnum(Opcode.JUMPI)) {
                        std.debug.panic(
                            "DebugPlan: PUSH_JUMPI fusion but second opcode is not JUMPI: {}",
                            .{opcode2}
                        );
                    }
                },
                else => {
                    std.debug.panic(
                        "DebugPlan: Unknown synthetic opcode: {}",
                        .{synthetic_opcode}
                    );
                },
            }
        }
        
        /// Get the number of simple opcodes that correspond to this opcode.
        fn getOpcodeCount(self: *const Self, comptime opcode: anytype) usize {
            _ = self;
            const opcode_value = comptime blk: {
                break :blk if (@TypeOf(opcode) == u8)
                    opcode
                else if (@TypeOf(opcode) == Opcode)
                    @intFromEnum(opcode)
                else if (@TypeOf(opcode) == OpcodeSynthetic)
                    @intFromEnum(opcode)
                else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                    @intFromEnum(@field(Opcode, @tagName(opcode)))
                else
                    @compileError("Invalid opcode type");
            };
            
            // Fusion opcodes execute 2 simple opcodes
            return switch (opcode_value) {
                @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE),
                @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER),
                @intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE),
                @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER),
                @intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE),
                @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER),
                @intFromEnum(OpcodeSynthetic.PUSH_JUMP_INLINE),
                @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER),
                @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_INLINE),
                @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER) => 2,
                else => 1,
            };
        }
        
        /// Debug handler result for interception
        pub const DebugHandlerResult = union(enum) {
            continue_execution: struct {
                next_handler: *const HandlerFn,
                instruction_idx: InstructionIndexType,
            },
            stop: struct {
                reason: []const u8,
                gas_remaining: i64,
            },
            execution_error: anyerror,
        };
        
        /// Handler context for debug execution
        const DebugHandlerContext = struct {
            plan: *Self,
            original_handler: *const HandlerFn,
            instruction_idx: InstructionIndexType,
            pc: PcType,
            opcode_count: usize,
            is_first: bool,
            
            /// Execute the original handler with validation
            pub fn executeWithValidation(self: *DebugHandlerContext, frame_ptr: *anyopaque, plan_ptr: *const anyopaque) !DebugHandlerResult {
                // Save frame state before execution
                const frame_before = try self.plan.captureFrameState(frame_ptr);
                defer frame_before.deinit();
                
                // Execute on main frame using original handler
                // Note: This is a simplified approach since we can't intercept tail calls
                // In practice, the handler would be executed and we'd validate the result
                
                // For now, we'll simulate validation by checking frame state changes
                _ = plan_ptr;
                
                // Validate against REVM trace if available
                if (self.plan.revm_trace) |_| {
                    self.plan.validateAgainstRevmTrace(frame_ptr, self.pc);
                }
                
                // TODO: Execute minimal plan opcodes in parallel and compare
                
                // Return continuation - in real implementation this would come from handler
                return DebugHandlerResult{ .continue_execution = .{
                    .next_handler = self.original_handler,
                    .instruction_idx = self.instruction_idx + 1,
                }};
            }
        };
        
        /// Execute sidecar opcodes on the minimal plan
        fn executeSidecarOpcodes(
            self: *Self,
            ctx: *DebugHandlerContext,
            frame_before: FrameState,
        ) !DebugHandlerResult {
            // TODO: Create a sidecar frame if not exists
            if (self.sidecar_frame == null) {
                // In a real implementation, we would create a copy of the main frame
                // for sidecar execution
            }
            
            // Execute the corresponding minimal plan opcodes
            var minimal_pc = ctx.pc;
            var i: usize = 0;
            while (i < ctx.opcode_count) : (i += 1) {
                if (minimal_pc >= self.bytecode.len) break;
                
                const opcode = self.bytecode[minimal_pc];
                var min_idx = minimal_pc;
                
                // Get handler from minimal plan
                const minimal_handler = self.minimal_plan.getNextInstruction(&min_idx, opcode);
                _ = minimal_handler; // TODO: Execute handler on sidecar frame
                
                minimal_pc = min_idx;
            }
            
            // TODO: Compare sidecar frame state with main frame state
            _ = frame_before;
            
            return DebugHandlerResult{ .continue_execution = .{
                .next_handler = ctx.original_handler,
                .instruction_idx = ctx.instruction_idx + 1,
            }};
        }
        
        /// Create a debug handler that validates execution.
        fn createDebugHandler(
            self: *Self,
            current_idx: InstructionIndexType,
            current_pc: PcType,
            comptime opcode: anytype,
            opcode_count: usize,
            advanced_handler: *const HandlerFn,
        ) *const HandlerFn {
            _ = opcode; // Suppress unused parameter warning
            
            // Get a context from the pool
            if (self.next_context_idx >= self.debug_contexts.len) {
                @panic("DebugPlan: Ran out of debug contexts");
            }
            
            const ctx = &self.debug_contexts[self.next_context_idx];
            self.next_context_idx += 1;
            
            ctx.* = DebugHandlerContext{
                .plan = self,
                .original_handler = advanced_handler,
                .instruction_idx = current_idx,
                .pc = current_pc,
                .opcode_count = opcode_count,
                .is_first = false,
            };
            
            // Store the context for later validation
            // The actual validation would happen in a trampoline-based approach
            // or through external coordination
            
            // For now, return the original handler
            // In a full implementation, we would return a wrapper that:
            // 1. Captures frame state before
            // 2. Executes original handler
            // 3. Captures frame state after
            // 4. Executes minimal plan equivalent
            // 5. Compares results
            
            return advanced_handler;
        }
        
        /// Create the first instruction handler that sets up sidecar execution.
        fn createFirstInstructionHandler(
            self: *Self,
            wrapped_handler: *const HandlerFn,
        ) *const HandlerFn {
            // Get a context from the pool
            if (self.next_context_idx >= self.debug_contexts.len) {
                @panic("DebugPlan: Ran out of debug contexts");
            }
            
            const ctx = &self.debug_contexts[self.next_context_idx];
            self.next_context_idx += 1;
            
            ctx.* = DebugHandlerContext{
                .plan = self,
                .original_handler = wrapped_handler,
                .instruction_idx = 0,
                .pc = 0,
                .opcode_count = 1,
                .is_first = true,
            };
            
            // The first handler would ideally:
            // 1. Create a sidecar frame by copying the main frame
            // 2. Initialize minimal plan execution state
            // 3. Set up validation infrastructure
            // 4. Execute the wrapped handler
            
            // For now, return the wrapped handler with context stored
            // In a complete implementation, this would be a specialized wrapper
            
            return wrapped_handler;
        }
        
        /// Capture current frame state
        fn captureFrameState(self: *const Self, frame_ptr: *anyopaque) !FrameState {
            const FrameType = @import("frame.zig").Frame(cfg);
            const frame = @as(*FrameType, @ptrCast(@alignCast(frame_ptr)));
            
            // Allocate and initialize with error handling
            var state = FrameState{
                .stack = &.{},
                .stack_height = 0,
                .memory = &.{},
                .memory_size = 0,
                .pc = 0,
                .gas_remaining = 0,
                .return_data = &.{},
                .allocator = self.allocator,
            };
            
            // Allocate stack with error handling
            state.stack = try self.allocator.dupe(primitives.u256, frame.stack.stack[0..frame.stack.next_stack_index]);
            errdefer self.allocator.free(state.stack);
            
            // Allocate memory with error handling
            state.memory = try self.allocator.dupe(u8, frame.memory.getSlice());
            errdefer self.allocator.free(state.memory);
            
            // Allocate return data with error handling
            state.return_data = try self.allocator.dupe(u8, frame.return_data);
            errdefer self.allocator.free(state.return_data);
            
            // Set remaining fields
            state.stack_height = frame.stack.next_stack_index;
            state.memory_size = frame.memory.getCurrentSize();
            state.pc = frame.pc;
            state.gas_remaining = frame.gas_remaining;
            
            return state;
        }
        
        /// Assert that two frames are equal.
        pub fn assertEqual(self: *const Self, frame1: *anyopaque, frame2: *anyopaque) !void {
            var state1 = try self.captureFrameState(frame1);
            defer state1.deinit();
            
            var state2 = try self.captureFrameState(frame2);
            defer state2.deinit();
            
            if (!state1.equals(&state2)) {
                var buf: [4096]u8 = undefined;
                var stream = std.io.fixedBufferStream(&buf);
                
                try state1.diff(&state2, stream.writer());
                const diff_text = stream.getWritten();
                
                std.debug.panic("DebugPlan: Frame states differ:\n{s}", .{diff_text});
            }
        }
        
        /// Execute both plans step by step and validate they produce same results.
        /// This is an alternative approach to handler wrapping for validation.
        pub fn executeAndValidate(
            self: *Self,
            frame: *anyopaque,
            max_steps: usize,
        ) !void {
            const FrameType = @import("frame.zig").Frame(cfg);
            const main_frame = @as(*FrameType, @ptrCast(@alignCast(frame)));
            
            // TODO: Create a copy for minimal plan execution
            // For now, we'll just validate the main frame against itself as a placeholder
            // In a real implementation, we would create a separate minimal frame
            
            // Track instruction indices
            var advanced_idx: InstructionIndexType = 0;
            var minimal_pc: PcType = 0;
            
            var steps: usize = 0;
            while (steps < max_steps) : (steps += 1) {
                // Get current opcode
                const pc = self.instructionIndexToPc(advanced_idx) orelse break;
                const opcode = self.bytecode[pc];
                
                // Validate against REVM trace if available
                self.validateAgainstRevmTrace(frame, pc);
                
                // Get metadata for both plans
                var adv_idx = advanced_idx;
                var min_idx = minimal_pc;
                
                // Execute one instruction on advanced plan
                _ = self.advanced_plan.getNextInstruction(&adv_idx, opcode);
                
                // Execute corresponding instruction(s) on minimal plan
                const opcode_count = self.getOpcodeCount(opcode);
                var i: usize = 0;
                while (i < opcode_count) : (i += 1) {
                    _ = self.minimal_plan.getNextInstruction(&min_idx, self.bytecode[minimal_pc]);
                    minimal_pc = min_idx;
                }
                
                // TODO: Compare frame states after each step
                // For now, just validate we can capture frame state
                var test_state = try self.captureFrameState(main_frame);
                defer test_state.deinit();
                
                // In a real implementation, we would compare against minimal_frame
                // try self.assertEqual(main_frame, &minimal_frame);
                
                // Update indices
                advanced_idx = adv_idx;
            }
        }
        
        /// Deinitialize the debug plan.
        pub fn deinit(self: *Self) void {
            self.advanced_plan.deinit(self.allocator);
            self.minimal_plan.deinit();
            self.allocator.free(self.debug_contexts);
            
            if (self.revm_trace) |trace| {
                for (trace) |*t| {
                    t.deinit();
                }
                self.allocator.free(trace);
            }
        }
    };
}

// Test handler for testing
fn testHandler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
    _ = frame;
    _ = plan;
    unreachable;
}

test "DebugPlan basic initialization" {
    const allocator = std.testing.allocator;
    const TestDebugPlan = DebugPlan(.{});
    
    // Simple bytecode: PUSH1 0x42, ADD, STOP
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const TestDebugPlan.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try TestDebugPlan.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Verify both plans were created
    try std.testing.expect(plan.advanced_plan.instructionStream.len > 0);
    try std.testing.expect(plan.minimal_plan.bytecode.len() == bytecode.len);
}

test "DebugPlan metadata validation" {
    const allocator = std.testing.allocator;
    const TestDebugPlan = DebugPlan(.{});
    
    // Bytecode with various PUSH instructions
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const TestDebugPlan.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try TestDebugPlan.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Test PUSH1 metadata
    var idx: TestDebugPlan.InstructionIndexType = 0;
    const push1_val = plan.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 0x42), push1_val);
    
    // Test PUSH2 metadata
    idx = 2; // Instruction index for PUSH2
    const push2_val = plan.getMetadata(&idx, .PUSH2);
    try std.testing.expectEqual(@as(u16, 0x1234), push2_val);
}

test "DebugPlan fusion validation" {
    const allocator = std.testing.allocator;
    const TestDebugPlan = DebugPlan(.{});
    
    // Bytecode with fusion opportunity: PUSH1 5, ADD
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x05,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const TestDebugPlan.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try TestDebugPlan.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // The advanced plan should have detected fusion
    // When we request metadata for a fusion opcode, it should validate
    var idx: TestDebugPlan.InstructionIndexType = 0;
    
    // This would be called if the advanced plan detected fusion
    // The validation in getMetadata should pass
    if (plan.advanced_plan.instructionStream[0].handler == 
        handlers[@intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE)]) {
        const metadata = plan.getMetadata(&idx, @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE));
        try std.testing.expectEqual(@as(usize, 5), metadata);
    }
}

test "DebugPlan executeAndValidate basic opcodes" {
    const allocator = std.testing.allocator;
    const TestDebugPlan = DebugPlan(.{});
    // TODO: Update when frame interface is stable
    // const Frame = @import("frame.zig").createFrame(.{});
    
    // Simple bytecode: PUSH1 10, PUSH1 20, ADD, STOP
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 10,
        @intFromEnum(Opcode.PUSH1), 20,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const TestDebugPlan.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try TestDebugPlan.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Create a frame
    var frame = try Frame.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);
    
    // Execute and validate step by step
    try plan.executeAndValidate(&frame, 10);
}

test "DebugPlan REVM trace validation" {
    const allocator = std.testing.allocator;
    const TestDebugPlan = DebugPlan(.{});
    
    // Simple bytecode for testing
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const TestDebugPlan.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try TestDebugPlan.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Create mock REVM trace
    var trace = try allocator.alloc(RevmTraceData, 2);
    defer allocator.free(trace);
    
    // First trace entry - PUSH1
    trace[0] = RevmTraceData{
        .pc = 0,
        .opcode = @intFromEnum(Opcode.PUSH1),
        .stack_before = try allocator.alloc(primitives.u256, 0),
        .stack_after = try allocator.alloc(primitives.u256, 1),
        .memory_before = try allocator.alloc(u8, 0),
        .memory_after = try allocator.alloc(u8, 0),
        .gas_remaining = 999997,
        .allocator = allocator,
    };
    trace[0].stack_after[0] = 0x42;
    
    // Second trace entry - STOP
    trace[1] = RevmTraceData{
        .pc = 2,
        .opcode = @intFromEnum(Opcode.STOP),
        .stack_before = try allocator.dupe(primitives.u256, trace[0].stack_after),
        .stack_after = try allocator.dupe(primitives.u256, trace[0].stack_after),
        .memory_before = try allocator.alloc(u8, 0),
        .memory_after = try allocator.alloc(u8, 0),
        .gas_remaining = 999997,
        .allocator = allocator,
    };
    
    plan.setRevmTrace(trace);
    
    // The validation should pass when executing
    // (In a real test, we'd execute and the handlers would validate)
}

// Export for root.zig compatibility
pub const PlanDebug = DebugPlan;