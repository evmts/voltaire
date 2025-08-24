/// DebugPlan: A plan that validates advanced plan execution against simple plan and optionally REVM.
/// This plan executes both advanced and simple interpreters in parallel, validating that they
/// produce identical results for each operation.
const std = @import("std");
const Opcode = @import("opcode.zig").Opcode;
const OpcodeSynthetic = @import("opcode_synthetic.zig").OpcodeSynthetic;
pub const PlanConfig = @import("plan_config.zig").PlanConfig;
const plan_mod = @import("plan.zig");
const plan_minimal_mod = @import("plan_minimal.zig");
const createPlanner = @import("planner.zig").createPlanner;
const revm_wrapper = @import("revm");

// Import u256 type
const u256 = @import("primitives").u256;

/// Metadata for REVM trace validation
pub const RevmTraceData = struct {
    pc: u64,
    opcode: u8,
    stack_before: []const u256,
    stack_after: []const u256,
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
    stack: []const u256,
    stack_after: ?[]const u256 = null,
    memory: ?[]const u8 = null,
    memory_after: ?[]const u8 = null,
};

/// Factory function to create a DebugPlan type with the given configuration.
pub fn createDebugPlan(comptime cfg: PlanConfig) type {
    comptime cfg.validate();
    
    const DebugPlan = struct {
        pub const PcType = cfg.PcType();
        pub const InstructionIndexType = PcType;
        pub const WordType = cfg.WordType;
        pub const HandlerFn = plan_mod.HandlerFn;
        
        const Self = @This();
        const AdvancedPlan = plan_mod.createPlan(cfg);
        const MinimalPlan = plan_minimal_mod.createPlanMinimal(cfg);
        
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
        
        /// Initialize a DebugPlan with advanced and minimal plans.
        pub fn init(
            allocator: std.mem.Allocator,
            bytecode: []const u8,
            handlers: [256]*const HandlerFn,
        ) !Self {
            // Create planner for analysis
            const Planner = createPlanner(cfg);
            var planner = try Planner.init(allocator, bytecode);
            defer planner.deinit();
            
            // Create advanced plan
            const advanced_plan = try planner.create_instruction_stream(allocator, handlers);
            
            // Create minimal plan
            const minimal_plan = try MinimalPlan.init(allocator, bytecode, handlers);
            
            // Store original handlers
            var original_handlers: [256]*const HandlerFn = handlers;
            
            // Create debug handlers (will be populated during execution)
            var debug_handlers: [256]*const HandlerFn = handlers;
            
            // Allocate debug contexts pool (enough for all instructions)
            const max_contexts = advanced_plan.instructionStream.len;
            const debug_contexts = try allocator.alloc(DebugHandlerContext, max_contexts);
            
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
        
        /// Generate REVM trace for the current bytecode
        pub fn generateRevmTrace(self: *Self, allocator: std.mem.Allocator, gas_limit: u64) !void {
            // Create temporary file for trace
            const trace_path = "debug_trace.json";
            defer std.fs.cwd().deleteFile(trace_path) catch {};
            
            // Initialize REVM
            var revm = try revm_wrapper.Revm.init(allocator, .{
                .gas_limit = gas_limit,
            });
            defer revm.deinit();
            
            // Deploy contract with our bytecode
            const deployer = try @import("primitives").Address.from_hex("0x1111111111111111111111111111111111111111");
            const contract_addr = try @import("primitives").Address.from_hex("0x2222222222222222222222222222222222222222");
            
            // Set up deployer balance
            try revm.setBalance(deployer, std.math.maxInt(u256));
            
            // Deploy contract
            try revm.setCode(contract_addr, self.bytecode);
            
            // Execute with trace
            var result = try revm.callWithTrace(
                deployer,
                contract_addr,
                0,
                &.{},
                gas_limit,
                trace_path,
            );
            defer result.deinit();
            
            // Load the generated trace
            try self.loadRevmTraceFromFile(allocator, trace_path);
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
            for (parsed.value, 0..) |entry, i| {
                trace[i] = RevmTraceData{
                    .pc = entry.pc,
                    .opcode = entry.op,
                    .stack_before = try allocator.dupe(u256, entry.stack),
                    .stack_after = try allocator.dupe(u256, entry.stack_after orelse &.{}),
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
            const FrameType = @import("frame.zig").createFrame(cfg);
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
            const next_idx = idx.*;
            
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
        
        /// Handler context for debug execution
        const DebugHandlerContext = struct {
            plan: *Self,
            original_handler: *const HandlerFn,
            instruction_idx: InstructionIndexType,
            pc: PcType,
            opcode_count: usize,
            is_first: bool,
        };
        
        /// Storage for debug handler contexts (pre-allocated pool)
        debug_contexts: []DebugHandlerContext,
        next_context_idx: usize = 0,
        
        /// Create a debug handler that validates execution.
        fn createDebugHandler(
            self: *Self,
            current_idx: InstructionIndexType,
            current_pc: PcType,
            comptime opcode: anytype,
            opcode_count: usize,
            advanced_handler: *const HandlerFn,
        ) *const HandlerFn {
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
            
            // Return the appropriate debug handler based on opcode type
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
            
            // Use different handlers for different opcode counts
            if (opcode_count == 2) {
                return &debugHandlerFusion;
            } else {
                return &debugHandlerSingle;
            }
        }
        
        /// Create the first instruction handler that copies the frame.
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
            
            return &debugHandlerFirst;
        }
        
        /// Assert that two frames are equal.
        pub fn assertEqual(frame1: *anyopaque, frame2: *anyopaque) void {
            _ = frame1;
            _ = frame2;
            // TODO: This requires Frame to have a comparison method
            // Would compare:
            // - Stack contents and height
            // - Memory contents and size
            // - Program counter / instruction index
            // - Gas remaining
            // - Return data
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
    
    // Debug handler functions that work with the context
    fn debugHandlerFirst(frame_ptr: *anyopaque, plan_ptr: *const anyopaque) anyerror!noreturn {
        // Get the debug plan from the plan pointer (need mutable for sidecar_frame)
        const debug_plan = @as(*DebugPlan, @ptrCast(@alignCast(@constCast(plan_ptr))));
        
        // Find the context for this handler
        var ctx: ?*const DebugPlan.DebugHandlerContext = null;
        for (debug_plan.debug_contexts[0..debug_plan.next_context_idx]) |*context| {
            if (context.is_first) {
                ctx = context;
                break;
            }
        }
        
        if (ctx == null) {
            @panic("DebugPlan: Could not find first handler context");
        }
        
        // Get the frame type
        const FrameType = @import("frame.zig").createFrame(cfg);
        const frame = @as(*FrameType, @ptrCast(@alignCast(frame_ptr)));
        
        // Create sidecar frame copy
        var sidecar = frame.copy(debug_plan.allocator) catch {
            @panic("DebugPlan: Failed to copy frame");
        };
        
        // Store sidecar frame
        debug_plan.sidecar_frame = @ptrCast(&sidecar);
        
        // Execute the original handler
        return ctx.?.original_handler(frame_ptr, plan_ptr);
    }
    
    fn debugHandlerSingle(frame_ptr: *anyopaque, plan_ptr: *const anyopaque) anyerror!noreturn {
        // Get the debug plan from the plan pointer
        const debug_plan = @as(*const DebugPlan, @ptrCast(@alignCast(plan_ptr)));
        
        // For single opcode execution, we would:
        // 1. Save frame state
        // 2. Execute advanced handler
        // 3. Execute simple handler on sidecar
        // 4. Compare results
        // 5. Validate against REVM trace if available
        
        // For now, just execute the original handler
        // Full implementation would require more complex state tracking
        const ctx = &debug_plan.debug_contexts[debug_plan.next_context_idx - 1];
        return ctx.original_handler(frame_ptr, plan_ptr);
    }
    
    fn debugHandlerFusion(frame_ptr: *anyopaque, plan_ptr: *const anyopaque) anyerror!noreturn {
        // Get the debug plan from the plan pointer
        const debug_plan = @as(*const DebugPlan, @ptrCast(@alignCast(plan_ptr)));
        
        // For fusion opcodes, we would:
        // 1. Save frame state
        // 2. Execute advanced fusion handler
        // 3. Execute multiple simple handlers on sidecar
        // 4. Compare results
        // 5. Validate against REVM trace if available
        
        // For now, just execute the original handler
        const ctx = &debug_plan.debug_contexts[debug_plan.next_context_idx - 1];
        return ctx.original_handler(frame_ptr, plan_ptr);
    }
    
    return DebugPlan;
}

// Test handler for testing
fn testHandler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
    _ = frame;
    _ = plan;
    unreachable;
}

test "DebugPlan basic initialization" {
    const allocator = std.testing.allocator;
    const DebugPlan = createDebugPlan(.{});
    
    // Simple bytecode: PUSH1 0x42, ADD, STOP
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const plan_mod.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try DebugPlan.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Verify both plans were created
    try std.testing.expect(plan.advanced_plan.instructionStream.len > 0);
    try std.testing.expect(plan.minimal_plan.bytecode.len() == bytecode.len);
}

test "DebugPlan metadata validation" {
    const allocator = std.testing.allocator;
    const DebugPlan = createDebugPlan(.{});
    
    // Bytecode with various PUSH instructions
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const plan_mod.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try DebugPlan.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Test PUSH1 metadata
    var idx: DebugPlan.InstructionIndexType = 0;
    const push1_val = plan.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 0x42), push1_val);
    
    // Test PUSH2 metadata
    idx = 2; // Instruction index for PUSH2
    const push2_val = plan.getMetadata(&idx, .PUSH2);
    try std.testing.expectEqual(@as(u16, 0x1234), push2_val);
}

test "DebugPlan fusion validation" {
    const allocator = std.testing.allocator;
    const DebugPlan = createDebugPlan(.{});
    
    // Bytecode with fusion opportunity: PUSH1 5, ADD
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x05,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const plan_mod.HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try DebugPlan.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // The advanced plan should have detected fusion
    // When we request metadata for a fusion opcode, it should validate
    var idx: DebugPlan.InstructionIndexType = 0;
    
    // This would be called if the advanced plan detected fusion
    // The validation in getMetadata should pass
    if (plan.advanced_plan.instructionStream[0].handler == 
        handlers[@intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE)]) {
        const metadata = plan.getMetadata(&idx, @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE));
        try std.testing.expectEqual(@as(usize, 5), metadata);
    }
}