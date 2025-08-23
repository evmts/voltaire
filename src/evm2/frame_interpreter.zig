const std = @import("std");
const builtin = @import("builtin");
const frame_mod = @import("frame.zig");
const planner_mod = @import("planner.zig");
const plan_mod = @import("plan.zig");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;

// FrameInterpreter combines a Frame with a Plan to execute EVM bytecode
pub fn createFrameInterpreter(comptime config: frame_mod.FrameConfig) type {
    config.validate();
    
    // Create frame type
    const Frame = frame_mod.createFrame(config);
    
    // Create planner and plan types with matching configuration
    const PlannerConfig = planner_mod.PlannerConfig{
        .WordType = config.WordType,
        .maxBytecodeSize = config.max_bytecode_size,
        .stack_size = config.stack_size,
    };
    const Planner = planner_mod.createPlanner(PlannerConfig);
    
    const PlanConfig = plan_mod.PlanConfig{
        .WordType = config.WordType,
        .maxBytecodeSize = config.max_bytecode_size,
    };
    const Plan = plan_mod.createPlan(PlanConfig);
    
    const FrameInterpreter = struct {
        pub const WordType = config.WordType;
        pub const Error = Frame.Error;
        
        const Self = @This();
        
        // Use the plan's handler function type
        const HandlerFn = plan_mod.HandlerFn;
        
        // The interpreter owns both the frame and the plan
        frame: Frame,
        plan: Plan,
        instruction_idx: Plan.InstructionIndexType,
        
        pub fn init(allocator: std.mem.Allocator, bytecode: []const u8, gas_remaining: Frame.GasType, database: if (config.has_database) ?@import("database_interface.zig").DatabaseInterface else void) Error!Self {
            var frame = try Frame.init(allocator, bytecode, gas_remaining, database);
            errdefer frame.deinit(allocator);
            
            // Create the planner and analyze the bytecode
            var planner = Planner.init(bytecode);
            
            // Create handler array - all handlers will be updated to match plan's signature
            var handlers: [256]*const HandlerFn = undefined;
            
            // Initialize all handlers to invalid by default
            for (&handlers) |*h| {
                h.* = &op_invalid_handler;
            }
            
            // Map opcodes to their handlers
            handlers[@intFromEnum(Opcode.STOP)] = &op_stop_handler;
            handlers[@intFromEnum(Opcode.ADD)] = &op_add_handler;
            handlers[@intFromEnum(Opcode.MUL)] = &op_mul_handler;
            handlers[@intFromEnum(Opcode.SUB)] = &op_sub_handler;
            handlers[@intFromEnum(Opcode.DIV)] = &op_div_handler;
            handlers[@intFromEnum(Opcode.SDIV)] = &op_sdiv_handler;
            handlers[@intFromEnum(Opcode.MOD)] = &op_mod_handler;
            handlers[@intFromEnum(Opcode.SMOD)] = &op_smod_handler;
            handlers[@intFromEnum(Opcode.ADDMOD)] = &op_addmod_handler;
            handlers[@intFromEnum(Opcode.MULMOD)] = &op_mulmod_handler;
            handlers[@intFromEnum(Opcode.EXP)] = &op_exp_handler;
            handlers[@intFromEnum(Opcode.SIGNEXTEND)] = &op_signextend_handler;
            handlers[@intFromEnum(Opcode.LT)] = &op_lt_handler;
            handlers[@intFromEnum(Opcode.GT)] = &op_gt_handler;
            handlers[@intFromEnum(Opcode.SLT)] = &op_slt_handler;
            handlers[@intFromEnum(Opcode.SGT)] = &op_sgt_handler;
            handlers[@intFromEnum(Opcode.EQ)] = &op_eq_handler;
            handlers[@intFromEnum(Opcode.ISZERO)] = &op_iszero_handler;
            handlers[@intFromEnum(Opcode.AND)] = &op_and_handler;
            handlers[@intFromEnum(Opcode.OR)] = &op_or_handler;
            handlers[@intFromEnum(Opcode.XOR)] = &op_xor_handler;
            handlers[@intFromEnum(Opcode.NOT)] = &op_not_handler;
            handlers[@intFromEnum(Opcode.BYTE)] = &op_byte_handler;
            handlers[@intFromEnum(Opcode.SHL)] = &op_shl_handler;
            handlers[@intFromEnum(Opcode.SHR)] = &op_shr_handler;
            handlers[@intFromEnum(Opcode.SAR)] = &op_sar_handler;
            handlers[@intFromEnum(Opcode.POP)] = &op_pop_handler;
            handlers[@intFromEnum(Opcode.MLOAD)] = &op_mload_handler;
            handlers[@intFromEnum(Opcode.MSTORE)] = &op_mstore_handler;
            handlers[@intFromEnum(Opcode.MSTORE8)] = &op_mstore8_handler;
            handlers[@intFromEnum(Opcode.MCOPY)] = &op_mcopy_handler;
            handlers[@intFromEnum(Opcode.SLOAD)] = &op_sload_handler;
            handlers[@intFromEnum(Opcode.SSTORE)] = &op_sstore_handler;
            handlers[@intFromEnum(Opcode.TLOAD)] = &op_tload_handler;
            handlers[@intFromEnum(Opcode.TSTORE)] = &op_tstore_handler;
            handlers[@intFromEnum(Opcode.JUMP)] = &op_jump_handler;
            handlers[@intFromEnum(Opcode.JUMPI)] = &op_jumpi_handler;
            handlers[@intFromEnum(Opcode.PC)] = &op_pc_handler;
            handlers[@intFromEnum(Opcode.MSIZE)] = &op_msize_handler;
            handlers[@intFromEnum(Opcode.GAS)] = &op_gas_handler;
            handlers[@intFromEnum(Opcode.JUMPDEST)] = &op_jumpdest_handler;
            handlers[@intFromEnum(Opcode.PUSH0)] = &push0_handler;
            
            // PUSH1-PUSH32 handlers
            handlers[@intFromEnum(Opcode.PUSH1)] = &push1_handler;
            handlers[@intFromEnum(Opcode.PUSH2)] = &push2_handler;
            handlers[@intFromEnum(Opcode.PUSH3)] = &push3_handler;
            handlers[@intFromEnum(Opcode.PUSH4)] = &push4_handler;
            handlers[@intFromEnum(Opcode.PUSH5)] = &push5_handler;
            handlers[@intFromEnum(Opcode.PUSH6)] = &push6_handler;
            handlers[@intFromEnum(Opcode.PUSH7)] = &push7_handler;
            handlers[@intFromEnum(Opcode.PUSH8)] = &push8_handler;
            handlers[@intFromEnum(Opcode.PUSH9)] = &push9_handler;
            handlers[@intFromEnum(Opcode.PUSH10)] = &push10_handler;
            handlers[@intFromEnum(Opcode.PUSH11)] = &push11_handler;
            handlers[@intFromEnum(Opcode.PUSH12)] = &push12_handler;
            handlers[@intFromEnum(Opcode.PUSH13)] = &push13_handler;
            handlers[@intFromEnum(Opcode.PUSH14)] = &push14_handler;
            handlers[@intFromEnum(Opcode.PUSH15)] = &push15_handler;
            handlers[@intFromEnum(Opcode.PUSH16)] = &push16_handler;
            handlers[@intFromEnum(Opcode.PUSH17)] = &push17_handler;
            handlers[@intFromEnum(Opcode.PUSH18)] = &push18_handler;
            handlers[@intFromEnum(Opcode.PUSH19)] = &push19_handler;
            handlers[@intFromEnum(Opcode.PUSH20)] = &push20_handler;
            handlers[@intFromEnum(Opcode.PUSH21)] = &push21_handler;
            handlers[@intFromEnum(Opcode.PUSH22)] = &push22_handler;
            handlers[@intFromEnum(Opcode.PUSH23)] = &push23_handler;
            handlers[@intFromEnum(Opcode.PUSH24)] = &push24_handler;
            handlers[@intFromEnum(Opcode.PUSH25)] = &push25_handler;
            handlers[@intFromEnum(Opcode.PUSH26)] = &push26_handler;
            handlers[@intFromEnum(Opcode.PUSH27)] = &push27_handler;
            handlers[@intFromEnum(Opcode.PUSH28)] = &push28_handler;
            handlers[@intFromEnum(Opcode.PUSH29)] = &push29_handler;
            handlers[@intFromEnum(Opcode.PUSH30)] = &push30_handler;
            handlers[@intFromEnum(Opcode.PUSH31)] = &push31_handler;
            handlers[@intFromEnum(Opcode.PUSH32)] = &push32_handler;
            
            // DUP handlers
            handlers[@intFromEnum(Opcode.DUP1)] = &dup1_handler;
            handlers[@intFromEnum(Opcode.DUP2)] = &dup2_handler;
            handlers[@intFromEnum(Opcode.DUP3)] = &dup3_handler;
            handlers[@intFromEnum(Opcode.DUP4)] = &dup4_handler;
            handlers[@intFromEnum(Opcode.DUP5)] = &dup5_handler;
            handlers[@intFromEnum(Opcode.DUP6)] = &dup6_handler;
            handlers[@intFromEnum(Opcode.DUP7)] = &dup7_handler;
            handlers[@intFromEnum(Opcode.DUP8)] = &dup8_handler;
            handlers[@intFromEnum(Opcode.DUP9)] = &dup9_handler;
            handlers[@intFromEnum(Opcode.DUP10)] = &dup10_handler;
            handlers[@intFromEnum(Opcode.DUP11)] = &dup11_handler;
            handlers[@intFromEnum(Opcode.DUP12)] = &dup12_handler;
            handlers[@intFromEnum(Opcode.DUP13)] = &dup13_handler;
            handlers[@intFromEnum(Opcode.DUP14)] = &dup14_handler;
            handlers[@intFromEnum(Opcode.DUP15)] = &dup15_handler;
            handlers[@intFromEnum(Opcode.DUP16)] = &dup16_handler;
            
            // SWAP handlers
            handlers[@intFromEnum(Opcode.SWAP1)] = &swap1_handler;
            handlers[@intFromEnum(Opcode.SWAP2)] = &swap2_handler;
            handlers[@intFromEnum(Opcode.SWAP3)] = &swap3_handler;
            handlers[@intFromEnum(Opcode.SWAP4)] = &swap4_handler;
            handlers[@intFromEnum(Opcode.SWAP5)] = &swap5_handler;
            handlers[@intFromEnum(Opcode.SWAP6)] = &swap6_handler;
            handlers[@intFromEnum(Opcode.SWAP7)] = &swap7_handler;
            handlers[@intFromEnum(Opcode.SWAP8)] = &swap8_handler;
            handlers[@intFromEnum(Opcode.SWAP9)] = &swap9_handler;
            handlers[@intFromEnum(Opcode.SWAP10)] = &swap10_handler;
            handlers[@intFromEnum(Opcode.SWAP11)] = &swap11_handler;
            handlers[@intFromEnum(Opcode.SWAP12)] = &swap12_handler;
            handlers[@intFromEnum(Opcode.SWAP13)] = &swap13_handler;
            handlers[@intFromEnum(Opcode.SWAP14)] = &swap14_handler;
            handlers[@intFromEnum(Opcode.SWAP15)] = &swap15_handler;
            handlers[@intFromEnum(Opcode.SWAP16)] = &swap16_handler;
            
            // Fusion handlers
            handlers[@intFromEnum(planner_mod.OpcodeSynthetic.PUSH_ADD_INLINE)] = &push_add_inline_handler;
            handlers[@intFromEnum(planner_mod.OpcodeSynthetic.PUSH_ADD_POINTER)] = &push_add_pointer_handler;
            handlers[@intFromEnum(planner_mod.OpcodeSynthetic.PUSH_MUL_INLINE)] = &push_mul_inline_handler;
            handlers[@intFromEnum(planner_mod.OpcodeSynthetic.PUSH_MUL_POINTER)] = &push_mul_pointer_handler;
            handlers[@intFromEnum(planner_mod.OpcodeSynthetic.PUSH_DIV_INLINE)] = &push_div_inline_handler;
            handlers[@intFromEnum(planner_mod.OpcodeSynthetic.PUSH_DIV_POINTER)] = &push_div_pointer_handler;
            handlers[@intFromEnum(planner_mod.OpcodeSynthetic.PUSH_JUMP_INLINE)] = &push_jump_inline_handler;
            handlers[@intFromEnum(planner_mod.OpcodeSynthetic.PUSH_JUMP_POINTER)] = &push_jump_pointer_handler;
            handlers[@intFromEnum(planner_mod.OpcodeSynthetic.PUSH_JUMPI_INLINE)] = &push_jumpi_inline_handler;
            handlers[@intFromEnum(planner_mod.OpcodeSynthetic.PUSH_JUMPI_POINTER)] = &push_jumpi_pointer_handler;
            
            // Create the plan using our planner
            const plan = try planner.create_instruction_stream(allocator, handlers);
            
            return Self{
                .frame = frame,
                .plan = plan,
                .instruction_idx = 0,
            };
        }
        
        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            self.frame.deinit(allocator);
            self.plan.deinit(allocator);
        }
        
        pub fn interpret(self: *Self) !void {
            // Debug print the plan in debug builds
            if (builtin.mode == .Debug) {
                self.plan.debugPrint();
            }
            
            // Start execution with the first handler
            const first_handler = self.plan.instructionStream[0].handler;
            
            // Start execution - handlers will throw STOP when done
            first_handler(&self.frame, &self.plan) catch |err| {
                if (err == Error.STOP) return; // Normal termination
                return err;
            };
            unreachable;
        }
        
        /// Pretty print the interpreter state for debugging.
        pub fn pretty_print(self: *const Self) void {
            std.log.warn("\n=== Frame Interpreter State ===\n", .{});
            std.log.warn("Instruction Index: {}\n", .{self.instruction_idx});
            
            // Print frame state
            self.frame.pretty_print();
            
            // Plan info
            std.log.warn("\nPlan: Present (use plan.debugPrint() for details)\n", .{});
            // Get current PC if possible
            if (self.plan.pc_to_instruction_idx) |map| {
                // Find PC for current instruction index
                var iter = map.iterator();
                while (iter.next()) |entry| {
                    if (entry.value_ptr.* == self.instruction_idx) {
                        std.log.warn("Current PC: {} (instruction index: {})\n", .{ 
                            entry.key_ptr.*, 
                            self.instruction_idx 
                        });
                        break;
                    }
                }
            }
            
            std.log.warn("===================\n\n", .{});
        }
        
        // Handler functions follow...
        // These have been moved from frame.zig
        
        fn op_invalid_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            std.log.warn("\n=== InvalidOpcode Debug ===", .{});
            std.log.warn("Instruction index: {}", .{interpreter.instruction_idx});
            std.log.warn("Bytecode: {any}", .{self.bytecode});
            std.log.warn("Instruction stream length: {}", .{plan_ptr.instructionStream.len});
            std.log.warn("==================\n", .{});
            
            self.op_invalid() catch |err| return err;
            unreachable;
        }
        
        fn op_stop_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            _ = plan;

            // Check final gas before stopping
            try self.checkGas();

            self.op_stop() catch |err| return err;
            unreachable;
        }
        
        // Individual PUSH handlers
        fn push0_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            try self.stack.push(0);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH0);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        fn push1_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH1));
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH1);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        // TODO: Add all other handler functions here...
        // For now, let's just add a few more to show the pattern
        
        fn op_add_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            // Get opcode info for gas consumption
            const opcode_info = opcode_data.OPCODE_INFO[@intFromEnum(Opcode.ADD)];

            // Consume gas (unchecked since we validated in pre-analysis)
            self.consumeGasUnchecked(opcode_info.gas_cost);

            // Execute the operation
            try self.op_add();

            // Get next handler from plan
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .ADD);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        fn op_mul_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            // Get opcode info for gas consumption
            const opcode_info = opcode_data.OPCODE_INFO[@intFromEnum(Opcode.MUL)];

            // Consume gas (unchecked since we validated in pre-analysis)
            self.consumeGasUnchecked(opcode_info.gas_cost);

            // Execute the operation
            try self.op_mul();

            // Get next handler from plan
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .MUL);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        // Generic handler for simple opcodes that just increment PC
        fn makeSimpleHandler(comptime op_fn: fn (*Frame) Frame.Error!void, comptime opcode: Opcode) HandlerFn {
            return struct {
                fn handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
                    const self = @as(*Frame, @ptrCast(@alignCast(frame)));
                    const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
                    const interpreter = @fieldParentPtr(Self, "frame", self);

                    // Get opcode info for gas consumption
                    const opcode_info = opcode_data.OPCODE_INFO[@intFromEnum(opcode)];

                    // Consume gas (unchecked since we validated in pre-analysis)
                    self.consumeGasUnchecked(opcode_info.gas_cost);

                    // Execute the operation
                    try op_fn(self);

                    // Get next handler from plan
                    const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, opcode);
                    return @call(.always_tail, next_handler, .{ self, plan_ptr });
                }
            }.handler;
        }

        // Define all the simple handlers using the macro
        const op_sub_handler = makeSimpleHandler(Frame.op_sub, .SUB);
        const op_div_handler = makeSimpleHandler(Frame.op_div, .DIV);
        const op_sdiv_handler = makeSimpleHandler(Frame.op_sdiv, .SDIV);
        const op_mod_handler = makeSimpleHandler(Frame.op_mod, .MOD);
        const op_smod_handler = makeSimpleHandler(Frame.op_smod, .SMOD);
        const op_addmod_handler = makeSimpleHandler(Frame.op_addmod, .ADDMOD);
        const op_mulmod_handler = makeSimpleHandler(Frame.op_mulmod, .MULMOD);
        const op_exp_handler = makeSimpleHandler(Frame.op_exp, .EXP);
        const op_signextend_handler = makeSimpleHandler(Frame.op_signextend, .SIGNEXTEND);
        const op_lt_handler = makeSimpleHandler(Frame.op_lt, .LT);
        const op_gt_handler = makeSimpleHandler(Frame.op_gt, .GT);
        const op_slt_handler = makeSimpleHandler(Frame.op_slt, .SLT);
        const op_sgt_handler = makeSimpleHandler(Frame.op_sgt, .SGT);
        const op_eq_handler = makeSimpleHandler(Frame.op_eq, .EQ);
        const op_iszero_handler = makeSimpleHandler(Frame.op_iszero, .ISZERO);
        const op_and_handler = makeSimpleHandler(Frame.op_and, .AND);
        const op_or_handler = makeSimpleHandler(Frame.op_or, .OR);
        const op_xor_handler = makeSimpleHandler(Frame.op_xor, .XOR);
        const op_not_handler = makeSimpleHandler(Frame.op_not, .NOT);
        const op_byte_handler = makeSimpleHandler(Frame.op_byte, .BYTE);
        const op_shl_handler = makeSimpleHandler(Frame.op_shl, .SHL);
        const op_shr_handler = makeSimpleHandler(Frame.op_shr, .SHR);
        const op_sar_handler = makeSimpleHandler(Frame.op_sar, .SAR);
        const op_pop_handler = makeSimpleHandler(Frame.op_pop, .POP);
        const op_mload_handler = makeSimpleHandler(Frame.op_mload, .MLOAD);
        const op_mstore_handler = makeSimpleHandler(Frame.op_mstore, .MSTORE);
        const op_mstore8_handler = makeSimpleHandler(Frame.op_mstore8, .MSTORE8);
        const op_mcopy_handler = makeSimpleHandler(Frame.op_mcopy, .MCOPY);
        const op_sload_handler = makeSimpleHandler(Frame.op_sload, .SLOAD);
        const op_sstore_handler = makeSimpleHandler(Frame.op_sstore, .SSTORE);
        const op_tload_handler = makeSimpleHandler(Frame.op_tload, .TLOAD);
        const op_tstore_handler = makeSimpleHandler(Frame.op_tstore, .TSTORE);
        fn op_jump_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn op_jumpi_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        // Handler for PC opcode with inline PC value
        fn op_pc_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            // Get PC value from plan metadata
            const pc_value = plan_ptr.getMetadata(&interpreter.instruction_idx, .PC);
            try self.stack.push(@as(WordType, @intCast(pc_value)));
            
            // Get next handler from plan
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PC);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        const op_msize_handler = makeSimpleHandler(Frame.op_msize, .MSIZE);
        const op_gas_handler = makeSimpleHandler(Frame.op_gas, .GAS);
        const op_jumpdest_handler = makeSimpleHandler(Frame.op_jumpdest, .JUMPDEST);
        
        // Push handlers
        fn push2_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH2));
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH2);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push3_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            std.log.warn("push3_handler: instruction_idx = {}, stream length = {}", .{ interpreter.instruction_idx, plan_ptr.instructionStream.len });
            const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH3));
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH3);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push4_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH4));
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH4);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push5_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            if (comptime @sizeOf(plan_mod.InstructionElement) == @sizeOf(u64)) {
                // 64-bit platform - fits inline
                const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH5));
                try self.stack.push(value);
            } else {
                // 32-bit platform - need pointer
                const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH5);
                const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
                try self.stack.push(value);
            }
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH5);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push6_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            if (comptime @sizeOf(plan_mod.InstructionElement) == @sizeOf(u64)) {
                // 64-bit platform - fits inline
                const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH6));
                try self.stack.push(value);
            } else {
                // 32-bit platform - need pointer
                const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH6);
                const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
                try self.stack.push(value);
            }
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH6);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push7_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            if (comptime @sizeOf(plan_mod.InstructionElement) == @sizeOf(u64)) {
                // 64-bit platform - fits inline
                const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH7));
                try self.stack.push(value);
            } else {
                // 32-bit platform - need pointer
                const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH7);
                const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
                try self.stack.push(value);
            }
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH7);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push8_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            if (comptime @sizeOf(plan_mod.InstructionElement) == @sizeOf(u64)) {
                // 64-bit platform - fits inline
                const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH8));
                try self.stack.push(value);
            } else {
                // 32-bit platform - need pointer
                const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH8);
                const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
                try self.stack.push(value);
            }
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH8);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push9_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH9);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH9);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push10_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH10);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH10);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push11_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH11);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH11);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push12_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH12);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH12);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push13_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH13);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH13);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push14_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH14);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH14);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push15_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH15);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH15);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push16_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH16);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH16);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push17_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH17);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH17);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push18_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH18);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH18);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push19_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH19);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH19);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push20_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH20);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH20);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push21_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH21);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH21);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push22_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH22);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH22);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push23_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH23);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH23);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push24_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH24);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH24);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push25_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH25);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH25);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push26_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH26);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH26);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push27_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH27);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH27);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push28_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH28);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH28);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push29_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH29);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH29);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push30_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH30);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH30);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push31_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH31);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH31);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push32_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @fieldParentPtr(Self, "frame", self);
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH32);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH32);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        // DUP handlers
        fn dup1_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup2_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup3_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup4_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup5_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup6_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup7_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup8_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup9_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup10_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup11_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup12_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup13_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup14_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup15_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn dup16_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        
        // SWAP handlers
        fn swap1_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap2_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap3_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap4_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap5_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap6_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap7_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap8_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap9_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap10_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap11_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap12_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap13_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap14_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap15_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn swap16_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        
        // Fusion handlers
        fn push_add_inline_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn push_add_pointer_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn push_mul_inline_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn push_mul_pointer_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn push_div_inline_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn push_div_pointer_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn push_jump_inline_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn push_jump_pointer_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn push_jumpi_inline_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
        fn push_jumpi_pointer_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn { _ = frame; _ = plan; unreachable; }
    };
    
    return FrameInterpreter;
}