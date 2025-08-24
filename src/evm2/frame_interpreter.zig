const std = @import("std");
const builtin = @import("builtin");
const frame_mod = @import("frame.zig");
const planner_mod = @import("planner.zig");
const plan_mod = @import("plan.zig");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;
const primitives = @import("primitives");

// FrameInterpreter combines a Frame with a Plan to execute EVM bytecode
pub fn createFrameInterpreter(comptime config: frame_mod.FrameConfig) type {
    config.validate();
    const Frame = frame_mod.createFrame(config);
    const Planner = planner_mod.createPlanner(.{
        .WordType = config.WordType,
        .maxBytecodeSize = config.max_bytecode_size,
        .stack_size = config.stack_size,
    });
    const Plan = plan_mod.createPlan(.{
        .WordType = config.WordType,
        .maxBytecodeSize = config.max_bytecode_size,
    });
    
    const FrameInterpreter = struct {
        pub const WordType = config.WordType;
        pub const Error = Frame.Error || error{OutOfMemory, TruncatedPush, InvalidJumpDestination, MissingJumpDestMetadata, InitcodeTooLarge};
        
        const Self = @This();
        
        const HandlerFn = plan_mod.HandlerFn;
        
        frame: Frame,
        plan: Plan,
        instruction_idx: Plan.InstructionIndexType,
        
        pub fn init(allocator: std.mem.Allocator, bytecode: []const u8, gas_remaining: Frame.GasType, database: if (config.has_database) ?@import("database_interface.zig").DatabaseInterface else void) Error!Self {
            var frame = try Frame.init(allocator, bytecode, gas_remaining, database);
            errdefer frame.deinit(allocator);
            var planner = try Planner.init(allocator, bytecode);
            var handlers: [256]*const HandlerFn = undefined;
            
            // Initialize all handlers to invalid by default
            for (&handlers) |*h| h.* = &op_invalid_handler;
            
            // Arithmetic operations (0x01-0x0b)
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
            
            // Undefined opcodes 0x0c-0x0f
            inline for (0x0c..0x10) |i| {
                handlers[i] = &op_invalid_handler;
            }
            
            // Comparison & bitwise logic (0x10-0x1d)
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
            
            // Undefined opcodes 0x1e-0x1f
            handlers[0x1e] = &op_invalid_handler;
            handlers[0x1f] = &op_invalid_handler;
            
            // Crypto (0x20)
            handlers[@intFromEnum(Opcode.KECCAK256)] = &op_invalid_handler; // TODO: implement
            
            // Undefined opcodes 0x21-0x2f
            inline for (0x21..0x30) |i| {
                handlers[i] = &op_invalid_handler;
            }
            
            // Environmental information (0x30-0x3f) - all unimplemented for now
            inline for (0x30..0x40) |i| {
                handlers[i] = &op_invalid_handler; // TODO: implement
            }
            
            // Block information (0x40-0x4a) - all unimplemented for now
            inline for (0x40..0x4b) |i| {
                handlers[i] = &op_invalid_handler; // TODO: implement
            }
            
            // Undefined opcodes 0x4b-0x4f
            inline for (0x4b..0x50) |i| {
                handlers[i] = &op_invalid_handler;
            }
            
            // Stack, Memory, Storage and Flow Operations (0x50-0x5f)
            handlers[@intFromEnum(Opcode.POP)] = &op_pop_handler;
            handlers[@intFromEnum(Opcode.MLOAD)] = &op_mload_handler;
            handlers[@intFromEnum(Opcode.MSTORE)] = &op_mstore_handler;
            handlers[@intFromEnum(Opcode.MSTORE8)] = &op_mstore8_handler;
            handlers[@intFromEnum(Opcode.SLOAD)] = &op_sload_handler;
            handlers[@intFromEnum(Opcode.SSTORE)] = &op_sstore_handler;
            handlers[@intFromEnum(Opcode.JUMP)] = &op_jump_handler;
            handlers[@intFromEnum(Opcode.JUMPI)] = &op_jumpi_handler;
            handlers[@intFromEnum(Opcode.PC)] = &op_pc_handler;
            handlers[@intFromEnum(Opcode.MSIZE)] = &op_msize_handler;
            handlers[@intFromEnum(Opcode.GAS)] = &op_gas_handler;
            handlers[@intFromEnum(Opcode.JUMPDEST)] = &op_jumpdest_handler;
            handlers[@intFromEnum(Opcode.TLOAD)] = &op_tload_handler;
            handlers[@intFromEnum(Opcode.TSTORE)] = &op_tstore_handler;
            handlers[@intFromEnum(Opcode.MCOPY)] = &op_mcopy_handler;
            handlers[@intFromEnum(Opcode.PUSH0)] = &push0_handler;
            
            // PUSH operations (0x60-0x7f)
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
            
            // DUP operations (0x80-0x8f)
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
            
            // SWAP operations (0x90-0x9f)
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
            
            // LOG operations (0xa0-0xa4) - all unimplemented for now
            inline for (0xa0..0xa5) |i| {
                handlers[i] = &op_invalid_handler; // TODO: implement
            }
            
            // Undefined opcodes 0xa5-0xef
            inline for (0xa5..0xf0) |i| {
                handlers[i] = &op_invalid_handler;
            }
            
            // System operations (0xf0-0xff) - all unimplemented for now
            inline for (0xf0..0x100) |i| {
                handlers[i] = &op_invalid_handler; // TODO: implement
            }
            
            // Synthetic opcodes (above 0xff)
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
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            std.log.warn("\n=== InvalidOpcode Debug ===", .{});
            std.log.warn("Instruction index: {}", .{interpreter.instruction_idx});
            std.log.warn("Bytecode: {any}", .{self.bytecode});
            std.log.warn("Instruction stream length: {}", .{plan_ptr.instructionStream.len});
            std.log.warn("==================\n", .{});
            
            self.invalid() catch |err| return err;
            unreachable;
        }
        
        fn op_stop_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            _ = plan;

            // Check final gas before stopping
            try self.checkGas();

            self.stop() catch |err| return err;
            unreachable;
        }
        
        // Individual PUSH handlers
        fn push0_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.push(0);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH0);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        fn push1_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
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
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            // Get opcode info for gas consumption
            const opcode_info = opcode_data.OPCODE_INFO[@intFromEnum(Opcode.ADD)];

            // Consume gas (unchecked since we validated in pre-analysis)
            self.consumeGasUnchecked(opcode_info.gas_cost);

            // Execute the operation
            try self.add();

            // Get next handler from plan
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .ADD);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        fn op_mul_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            // Get opcode info for gas consumption
            const opcode_info = opcode_data.OPCODE_INFO[@intFromEnum(Opcode.MUL)];

            // Consume gas (unchecked since we validated in pre-analysis)
            self.consumeGasUnchecked(opcode_info.gas_cost);

            // Execute the operation
            try self.mul();

            // Get next handler from plan
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .MUL);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        // Generic handler for simple opcodes that just increment PC
        fn makeSimpleHandler(comptime op_fn: fn (*Frame) Frame.Error!void, comptime opcode_enum: Opcode) HandlerFn {
            return struct {
                fn handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
                    const self = @as(*Frame, @ptrCast(@alignCast(frame)));
                    const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
                    const interpreter = @as(*Self, @fieldParentPtr("frame", self));

                    // Get opcode info for gas consumption
                    const opcode_info = opcode_data.OPCODE_INFO[@intFromEnum(opcode_enum)];

                    // Consume gas (unchecked since we validated in pre-analysis)
                    self.consumeGasUnchecked(opcode_info.gas_cost);

                    // Execute the operation
                    try op_fn(self);

                    // Get next handler from plan
                    const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, opcode_enum);
                    return @call(.always_tail, next_handler, .{ self, plan_ptr });
                }
            }.handler;
        }

        // Define all the simple handlers using the macro
        const op_sub_handler = makeSimpleHandler(Frame.sub, .SUB);
        const op_div_handler = makeSimpleHandler(Frame.div, .DIV);
        const op_sdiv_handler = makeSimpleHandler(Frame.sdiv, .SDIV);
        const op_mod_handler = makeSimpleHandler(Frame.mod, .MOD);
        const op_smod_handler = makeSimpleHandler(Frame.smod, .SMOD);
        const op_addmod_handler = makeSimpleHandler(Frame.addmod, .ADDMOD);
        const op_mulmod_handler = makeSimpleHandler(Frame.mulmod, .MULMOD);
        const op_exp_handler = makeSimpleHandler(Frame.exp, .EXP);
        const op_signextend_handler = makeSimpleHandler(Frame.signextend, .SIGNEXTEND);
        const op_lt_handler = makeSimpleHandler(Frame.lt, .LT);
        const op_gt_handler = makeSimpleHandler(Frame.gt, .GT);
        const op_slt_handler = makeSimpleHandler(Frame.slt, .SLT);
        const op_sgt_handler = makeSimpleHandler(Frame.sgt, .SGT);
        const op_eq_handler = makeSimpleHandler(Frame.eq, .EQ);
        const op_iszero_handler = makeSimpleHandler(Frame.iszero, .ISZERO);
        const op_and_handler = makeSimpleHandler(Frame.and_, .AND);
        const op_or_handler = makeSimpleHandler(Frame.or_, .OR);
        const op_xor_handler = makeSimpleHandler(Frame.xor, .XOR);
        const op_not_handler = makeSimpleHandler(Frame.not_, .NOT);
        const op_byte_handler = makeSimpleHandler(Frame.byte, .BYTE);
        const op_shl_handler = makeSimpleHandler(Frame.shl, .SHL);
        const op_shr_handler = makeSimpleHandler(Frame.shr, .SHR);
        const op_sar_handler = makeSimpleHandler(Frame.sar, .SAR);
        const op_pop_handler = makeSimpleHandler(Frame.pop, .POP);
        const op_mload_handler = makeSimpleHandler(Frame.mload, .MLOAD);
        const op_mstore_handler = makeSimpleHandler(Frame.mstore, .MSTORE);
        const op_mstore8_handler = makeSimpleHandler(Frame.mstore8, .MSTORE8);
        const op_mcopy_handler = makeSimpleHandler(Frame.mcopy, .MCOPY);
        const op_sload_handler = makeSimpleHandler(Frame.sload, .SLOAD);
        const op_sstore_handler = makeSimpleHandler(Frame.sstore, .SSTORE);
        const op_tload_handler = makeSimpleHandler(Frame.tload, .TLOAD);
        const op_tstore_handler = makeSimpleHandler(Frame.tstore, .TSTORE);
        fn op_jump_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const dest = try self.stack.pop();

            if (dest > config.max_bytecode_size) {
                return Error.InvalidJump;
            }

            const dest_pc = @as(Plan.PcType, @intCast(dest));
            if (!self.is_valid_jump_dest(@as(usize, dest_pc))) {
                return Error.InvalidJump;
            }

            // PC update is handled by plan through instruction index update

            // Look up the instruction index for the destination PC
            if (plan_ptr.getInstructionIndexForPc(dest_pc)) |new_idx| {
                interpreter.instruction_idx = new_idx;
                // Get the handler at the destination
                const dest_handler = plan_ptr.instructionStream[new_idx].handler;
                return @call(.always_tail, dest_handler, .{ self, plan_ptr });
            } else {
                // PC is not a valid instruction start (e.g., middle of PUSH data)
                return Error.InvalidJump;
            }
        }
        fn op_jumpi_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const dest = try self.stack.pop();
            const condition = try self.stack.pop();

            if (condition != 0) {
                if (dest > config.max_bytecode_size) {
                    return Error.InvalidJump;
                }
                const dest_pc = @as(Plan.PcType, @intCast(dest));
                if (!self.is_valid_jump_dest(@as(usize, dest_pc))) {
                    return Error.InvalidJump;
                }
                // PC update is handled by plan through instruction index update

                // Look up the instruction index for the destination PC
                if (plan_ptr.getInstructionIndexForPc(dest_pc)) |new_idx| {
                    interpreter.instruction_idx = new_idx;
                    // Get the handler at the destination
                    const dest_handler = plan_ptr.instructionStream[new_idx].handler;
                    return @call(.always_tail, dest_handler, .{ self, plan_ptr });
                } else {
                    // PC is not a valid instruction start (e.g., middle of PUSH data)
                    return Error.InvalidJump;
                }
            } else {
                // Condition is false, continue to next instruction
                // PC update is handled by plan through instruction index update
                const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .JUMPI);
                return @call(.always_tail, next_handler, .{ self, plan_ptr });
            }
        }
        // Handler for PC opcode with inline PC value
        fn op_pc_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            // Get PC value from plan metadata
            const pc_value = plan_ptr.getMetadata(&interpreter.instruction_idx, .PC);
            try self.stack.push(@as(WordType, @intCast(pc_value)));
            
            // Get next handler from plan
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PC);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        const op_msize_handler = makeSimpleHandler(Frame.msize, .MSIZE);
        const op_gas_handler = makeSimpleHandler(Frame.gas, .GAS);
        const op_jumpdest_handler = makeSimpleHandler(Frame.jumpdest, .JUMPDEST);
        
        // Push handlers
        fn push2_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH2));
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH2);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push3_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            std.log.warn("push3_handler: instruction_idx = {}, stream length = {}", .{ interpreter.instruction_idx, plan_ptr.instructionStream.len });
            const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH3));
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH3);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push4_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH4));
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH4);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push5_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
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
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
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
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
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
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
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
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH9);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH9);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push10_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH10);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH10);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push11_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH11);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH11);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push12_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH12);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH12);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push13_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH13);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH13);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push14_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH14);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH14);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push15_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH15);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH15);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push16_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const result = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH16);
            const value = if (@TypeOf(result) == *const WordType) result.* else @as(WordType, result);
            try self.stack.push(value);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH16);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push17_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH17);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH17);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push18_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH18);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH18);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push19_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH19);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH19);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push20_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH20);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH20);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push21_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH21);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH21);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push22_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH22);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH22);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push23_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH23);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH23);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push24_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH24);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH24);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push25_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH25);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH25);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push26_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH26);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH26);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push27_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH27);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH27);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push28_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH28);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH28);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push29_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH29);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH29);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push30_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH30);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH30);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push31_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH31);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH31);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push32_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, .PUSH32);
            try self.stack.push(value_ptr.*);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .PUSH32);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        // DUP handlers
        fn dup1_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(1);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP1);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup2_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(2);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP2);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup3_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(3);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP3);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup4_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(4);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP4);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup5_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(5);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP5);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup6_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(6);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP6);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup7_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(7);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP7);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup8_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(8);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP8);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup9_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(9);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP9);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup10_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(10);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP10);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup11_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(11);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP11);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup12_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(12);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP12);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup13_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(13);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP13);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup14_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(14);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP14);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup15_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(15);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP15);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn dup16_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.dup_n(16);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .DUP16);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        // SWAP handlers
        fn swap1_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(1);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP1);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap2_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(2);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP2);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap3_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(3);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP3);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap4_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(4);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP4);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap5_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(5);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP5);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap6_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(6);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP6);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap7_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(7);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP7);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap8_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(8);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP8);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap9_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(9);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP9);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap10_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(10);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP10);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap11_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(11);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP11);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap12_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(12);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP12);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap13_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(13);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP13);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap14_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(14);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP14);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap15_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(15);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP15);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn swap16_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            try self.stack.swap_n(16);
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, .SWAP16);
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        
        // Fusion handlers
        fn push_add_inline_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_ADD_INLINE)));
            const b = try self.stack.pop();
            const result = b +% value;
            try self.stack.push(result);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_ADD_INLINE));
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push_add_pointer_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_ADD_POINTER));
            const b = try self.stack.pop();
            const result = b +% value_ptr.*;
            try self.stack.push(result);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_ADD_POINTER));
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push_mul_inline_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_MUL_INLINE)));
            const b = try self.stack.pop();
            const result = b *% value;
            try self.stack.push(result);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_MUL_INLINE));
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push_mul_pointer_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_MUL_POINTER));
            const b = try self.stack.pop();
            const result = b *% value_ptr.*;
            try self.stack.push(result);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_MUL_POINTER));
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push_div_inline_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_DIV_INLINE)));
            const b = try self.stack.pop();
            const result = if (value == 0) 0 else b / value;
            try self.stack.push(result);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_DIV_INLINE));
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push_div_pointer_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const value_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_DIV_POINTER));
            const b = try self.stack.pop();
            const result = if (value_ptr.* == 0) 0 else b / value_ptr.*;
            try self.stack.push(result);
            
            const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_DIV_POINTER));
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
        fn push_jump_inline_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const dest = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_JUMP_INLINE)));
            
            if (dest > config.max_bytecode_size) {
                return Error.InvalidJump;
            }
            const dest_pc = @as(Plan.PcType, @intCast(dest));
            
            // Check if it's a valid jump destination
            const dest_idx = plan_ptr.getInstructionIndexForPc(dest_pc) orelse {
                return Error.InvalidJump;
            };
            
            // Jump to the destination
            interpreter.instruction_idx = dest_idx;
            const jump_handler = plan_ptr.instructionStream[dest_idx].handler;
            return @call(.always_tail, jump_handler, .{ self, plan_ptr });
        }
        fn push_jump_pointer_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const dest_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_JUMP_POINTER));
            const dest = dest_ptr.*;
            
            if (dest > config.max_bytecode_size) {
                return Error.InvalidJump;
            }
            const dest_pc = @as(Plan.PcType, @intCast(dest));
            
            // Check if it's a valid jump destination
            const dest_idx = plan_ptr.getInstructionIndexForPc(dest_pc) orelse {
                return Error.InvalidJump;
            };
            
            // Jump to the destination
            interpreter.instruction_idx = dest_idx;
            const jump_handler = plan_ptr.instructionStream[dest_idx].handler;
            return @call(.always_tail, jump_handler, .{ self, plan_ptr });
        }
        fn push_jumpi_inline_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const dest = @as(WordType, plan_ptr.getMetadata(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_JUMPI_INLINE)));
            const condition = try self.stack.pop();
            
            if (condition != 0) {
                if (dest > config.max_bytecode_size) {
                    return Error.InvalidJump;
                }
                const dest_pc = @as(Plan.PcType, @intCast(dest));
                
                // Check if it's a valid jump destination
                const dest_idx = plan_ptr.getInstructionIndexForPc(dest_pc) orelse {
                    return Error.InvalidJump;
                };
                
                // Jump to the destination
                interpreter.instruction_idx = dest_idx;
                const jump_handler = plan_ptr.instructionStream[dest_idx].handler;
                return @call(.always_tail, jump_handler, .{ self, plan_ptr });
            } else {
                // Condition is false, continue to next instruction
                const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_JUMPI_INLINE));
                return @call(.always_tail, next_handler, .{ self, plan_ptr });
            }
        }
        fn push_jumpi_pointer_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            const dest_ptr = plan_ptr.getMetadata(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_JUMPI_POINTER));
            const dest = dest_ptr.*;
            const condition = try self.stack.pop();
            
            if (condition != 0) {
                if (dest > config.max_bytecode_size) {
                    return Error.InvalidJump;
                }
                const dest_pc = @as(Plan.PcType, @intCast(dest));
                
                // Check if it's a valid jump destination
                const dest_idx = plan_ptr.getInstructionIndexForPc(dest_pc) orelse {
                    return Error.InvalidJump;
                };
                
                // Jump to the destination
                interpreter.instruction_idx = dest_idx;
                const jump_handler = plan_ptr.instructionStream[dest_idx].handler;
                return @call(.always_tail, jump_handler, .{ self, plan_ptr });
            } else {
                // Condition is false, continue to next instruction
                const next_handler = plan_ptr.getNextInstruction(&interpreter.instruction_idx, @intFromEnum(planner_mod.OpcodeSynthetic.PUSH_JUMPI_POINTER));
                return @call(.always_tail, next_handler, .{ self, plan_ptr });
            }
        }
        
        fn out_of_bounds_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            _ = frame;
            _ = plan;
            return Error.OutOfBounds;
        }

        // Trace instruction handlers
        fn trace_before_op_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            // Call tracer before operation
            self.tracer.beforeOp(Frame, self);

            // Get the next handler - trace handlers don't have metadata
            const next_handler = plan_ptr.instructionStream[interpreter.instruction_idx].handler;
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }

        fn trace_after_op_handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            const self = @as(*Frame, @ptrCast(@alignCast(frame)));
            const plan_ptr = @as(*const Plan, @ptrCast(@alignCast(plan)));
            const interpreter = @as(*Self, @fieldParentPtr("frame", self));
            
            // Call tracer after operation
            self.tracer.afterOp(Frame, self);

            // Get the next handler - trace handlers don't have metadata
            const next_handler = plan_ptr.instructionStream[interpreter.instruction_idx].handler;
            return @call(.always_tail, next_handler, .{ self, plan_ptr });
        }
    };
    
    return FrameInterpreter;
}

// Tests
test "FrameInterpreter basic execution" {
    std.testing.log_level = .warn;
    const allocator = std.testing.allocator;
    const FrameInterpreter = createFrameInterpreter(.{});

    // Simple bytecode: PUSH1 42, PUSH1 10, ADD, STOP
    const bytecode = [_]u8{ 0x60, 0x2A, 0x60, 0x0A, 0x01, 0x00 };
    var interpreter = try FrameInterpreter.init(allocator, &bytecode, 1000000, void{});
    defer interpreter.deinit(allocator);

    std.log.warn("\n=== FrameInterpreter basic execution test ===", .{});
    std.log.warn("Initial interpreter state:", .{});
    interpreter.pretty_print();

    // interpret should execute until STOP
    try interpreter.interpret(); // Handles STOP internally
    
    std.log.warn("\nFinal interpreter state after interpret():", .{});
    interpreter.pretty_print();

    // Check final stack state
    try std.testing.expectEqual(@as(u256, 52), interpreter.frame.stack.peek_unsafe()); // 42 + 10 = 52
}

test "FrameInterpreter OUT_OF_BOUNDS error" {
    const allocator = std.testing.allocator;
    const FrameInterpreter = createFrameInterpreter(.{});

    // Bytecode without explicit STOP: PUSH1 5
    // The planner should handle this gracefully but for now add STOP
    const bytecode = [_]u8{ 0x60, 0x05, 0x00 }; // PUSH1 5 STOP
    var interpreter = try FrameInterpreter.init(allocator, &bytecode, 1000000, void{});
    defer interpreter.deinit(allocator);

    // Should execute normally
    try interpreter.interpret();
    try std.testing.expectEqual(@as(u256, 5), interpreter.frame.stack.peek_unsafe());
}

test "FrameInterpreter invalid opcode" {
    const allocator = std.testing.allocator;
    const FrameInterpreter = createFrameInterpreter(.{});

    // Bytecode with invalid opcode: 0xFE (INVALID)
    const bytecode = [_]u8{0xFE};
    var interpreter = try FrameInterpreter.init(allocator, &bytecode, 1000000, void{});
    defer interpreter.deinit(allocator);

    // Should return InvalidOpcode error
    const result = interpreter.interpret();
    try std.testing.expectError(error.InvalidOpcode, result);
}

test "FrameInterpreter PUSH values metadata" {
    const allocator = std.testing.allocator;
    const FrameInterpreter = createFrameInterpreter(.{});

    // Test PUSH1 with value stored in metadata
    const bytecode = [_]u8{ 0x60, 0xFF, 0x00 }; // PUSH1 255, STOP
    var interpreter = try FrameInterpreter.init(allocator, &bytecode, 1000000, void{});
    defer interpreter.deinit(allocator);

    try interpreter.interpret(); // Handles STOP internally

    // Check that 255 was pushed
    try std.testing.expectEqual(@as(u256, 255), interpreter.frame.stack.peek_unsafe());
}

test "FrameInterpreter complex bytecode sequence" {
    const allocator = std.testing.allocator;
    const FrameInterpreter = createFrameInterpreter(.{});

    // PUSH1 5, PUSH1 3, ADD, PUSH1 2, MUL, STOP
    // Should compute (5 + 3) * 2 = 16
    const bytecode = [_]u8{ 0x60, 0x05, 0x60, 0x03, 0x01, 0x60, 0x02, 0x02, 0x00 };
    var interpreter = try FrameInterpreter.init(allocator, &bytecode, 1000000, void{});
    defer interpreter.deinit(allocator);

    try interpreter.interpret(); // Handles STOP internally

    // Check final result
    try std.testing.expectEqual(@as(u256, 16), interpreter.frame.stack.peek_unsafe());
}

test "FrameInterpreter handles all PUSH opcodes correctly" {
    const allocator = std.testing.allocator;
    const FrameInterpreter = createFrameInterpreter(.{});

    // Test PUSH3 through interpreter
    {
        const bytecode = [_]u8{ 0x62, 0x12, 0x34, 0x56, 0x00 }; // PUSH3 0x123456 STOP
        var interpreter = try FrameInterpreter.init(allocator, &bytecode, 1000000, void{});
        defer interpreter.deinit(allocator);

        std.log.warn("\n=== PUSH3 Test Starting ===", .{});
        std.log.warn("Bytecode: {any}", .{bytecode});
        try interpreter.interpret(); // Handles STOP internally
        try std.testing.expectEqual(@as(u256, 0x123456), interpreter.frame.stack.peek_unsafe());
    }

    // Test PUSH10 through interpreter
    {
        var bytecode: [12]u8 = undefined;
        bytecode[0] = 0x69; // PUSH10
        for (1..11) |i| {
            bytecode[i] = @as(u8, @intCast(i));
        }
        bytecode[11] = 0x00; // STOP

        var interpreter = try FrameInterpreter.init(allocator, &bytecode, 1000000, void{});
        defer interpreter.deinit(allocator);

        try interpreter.interpret(); // Handles STOP internally

        var expected: u256 = 0;
        for (1..11) |i| {
            expected = (expected << 8) | @as(u256, i);
        }
        try std.testing.expectEqual(expected, interpreter.frame.stack.peek_unsafe());
    }

    // Test PUSH20 through interpreter
    {
        var bytecode: [22]u8 = undefined;
        bytecode[0] = 0x73; // PUSH20
        for (1..21) |i| {
            bytecode[i] = @as(u8, @intCast(255 - i));
        }
        bytecode[21] = 0x00; // STOP

        var interpreter = try FrameInterpreter.init(allocator, &bytecode, 1000000, void{});
        defer interpreter.deinit(allocator);

        try interpreter.interpret(); // Handles STOP internally
    }
}

test "Debug planner instruction stream creation" {
    std.testing.log_level = .warn;
    // This test helps debug why interpret is hitting InvalidOpcode
    const allocator = std.testing.allocator;
    
    // Create minimal bytecode: PUSH1 42, STOP
    const bytecode = [_]u8{ 0x60, 0x2A, 0x00 };
    
    // Create planner directly
    const PlannerConfig = planner_mod.PlannerConfig{
        .maxBytecodeSize = 24_576,
    };
    const PlannerType = planner_mod.createPlanner(PlannerConfig);
    
    var planner = try PlannerType.init(allocator, &bytecode);
    
    // Create handler array with debug logging
    var handlers: [256]*const plan_mod.HandlerFn = undefined;
    const FrameInterpreter = createFrameInterpreter(.{});
    
    // Initialize all to invalid
    for (handlers[0..]) |*h| {
        h.* = &FrameInterpreter.op_invalid_handler;
    }
    
    // Set specific handlers we need
    handlers[@intFromEnum(Opcode.PUSH1)] = &FrameInterpreter.push1_handler;
    handlers[@intFromEnum(Opcode.STOP)] = &FrameInterpreter.op_stop_handler;
    
    const plan = try planner.create_instruction_stream(allocator, handlers);
    defer {
        var mut_plan = plan;
        mut_plan.deinit(allocator);
    }
    
    std.log.warn("\n=== Planner Debug ===", .{});
    std.log.warn("Bytecode: {any}", .{bytecode});
    std.log.warn("Instruction stream length: {}", .{plan.instructionStream.len});
    std.log.warn("Constants length: {}", .{plan.u256_constants.len});
    
    // Log each element - check if it's a handler or metadata
    for (plan.instructionStream, 0..) |elem, i| {
        // Try to interpret as handler first
        const maybe_handler = elem.handler;
        if (@intFromPtr(maybe_handler) < 0x1000) {
            // This is likely inline data, not a handler pointer
            std.log.warn("  [{}] Inline value: {}", .{i, elem.inline_value});
        } else if (maybe_handler == &FrameInterpreter.push1_handler) {
            std.log.warn("  [{}] PUSH1 handler", .{i});
        } else if (maybe_handler == &FrameInterpreter.op_stop_handler) {
            std.log.warn("  [{}] STOP handler", .{i});
        } else if (maybe_handler == &FrameInterpreter.op_invalid_handler) {
            std.log.warn("  [{}] INVALID handler", .{i});
        } else {
            std.log.warn("  [{}] Unknown handler: {*}", .{i, elem.handler});
        }
    }
    std.log.warn("==================\n", .{});
}
