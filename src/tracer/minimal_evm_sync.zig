/// Synchronization logic for MinimalEvm execution with Frame operations
/// Handles execution of MinimalEvm steps to match Frame's synthetic opcodes
const std = @import("std");
const log = std.log.scoped(.tracer);
const MinimalEvm = @import("minimal_evm.zig").MinimalEvm;
const UnifiedOpcode = @import("../opcodes/opcode.zig").UnifiedOpcode;
const Opcode = @import("../opcodes/opcode.zig").Opcode;
const primitives = @import("primitives");

pub fn executeMinimalEvmForOpcode(
    tracer: anytype,
    evm: *MinimalEvm,
    comptime opcode: UnifiedOpcode,
    frame: anytype,
    cursor: [*]const @TypeOf(frame.*).Dispatch.Item,
) void {
    const opcode_value = @intFromEnum(opcode);

    tracer.debug("=====================================", .{});
    tracer.debug("Frame executing: {s}", .{@tagName(opcode)});
    tracer.debug("  MinimalEvm PC: {d}", .{evm.getPC()});
    tracer.debug("  Frame stack size: {d}", .{frame.stack.size()});
    if (evm.getCurrentFrame()) |minimal_frame| tracer.debug("  MinimalEvm stack size: {d}", .{minimal_frame.stack.items.len});

    if (opcode_value <= 0xff) {
        if (evm.getCurrentFrame()) |mf| {
            const step_before = if (tracer.config.enable_step_capture) tracer.captureStep(mf, opcode_value) catch null else null;
            defer if (step_before) |step| {
                if (step.stack_before.len > 0) tracer.allocator.free(step.stack_before);
            };

            // Special handling: JUMPDEST in Frame pre-charges entire basic-block gas.
            // MinimalEvm's JUMPDEST charges only JumpdestGas, so we reconcile here.
            if (opcode_value == 0x5b) { // JUMPDEST
                const DispatchType = @TypeOf(frame.*).Dispatch;
                const dispatch = DispatchType{ .cursor = cursor };
                const op_data = dispatch.getOpData(.JUMPDEST);
                const block_gas: u64 = op_data.metadata.gas;
                const jumpdest_gas: u64 = primitives.GasConstants.JumpdestGas;
                const extra: i64 = @as(i64, @intCast(block_gas)) - @as(i64, @intCast(jumpdest_gas));
                mf.gas_remaining -= extra;
            }

            evm.step() catch |e| {
                if (step_before) |mut_step| {
                    var step = mut_step;
                    step.error_occurred = true;
                    step.error_msg = @errorName(e);
                    step.gas_after = @intCast(mf.gas_remaining);
                    step.stack_after = &[_]u256{};
                    step.memory_size_after = mf.memory_size;
                    tracer.steps.append(tracer.allocator, step) catch {};
                }

                var actual_opcode: u8 = 0;
                if (mf.pc < mf.bytecode.len) actual_opcode = mf.bytecode[mf.pc];
                tracer.panic("[EVM2] MinimalEvm exec error at PC={d}, bytecode[PC]=0x{x:0>2}, Frame expects=0x{x:0>2}: {any}", .{ mf.pc, actual_opcode, opcode_value, e });
                @panic("MinimalEvm execution error");
            };

            if (step_before) |mut_step| {
                var step = mut_step;
                step.gas_after = @intCast(mf.gas_remaining);
                step.gas_cost = @intCast(@as(i64, step.gas_before) - @as(i64, step.gas_after));

                if (mf.stack.items.len > 0) {
                    if (tracer.allocator.alloc(u256, mf.stack.items.len)) |stack_after| {
                        for (mf.stack.items, 0..) |val, i| {
                            stack_after[mf.stack.items.len - 1 - i] = val; // LIFO order
                        }
                        step.stack_after = stack_after;
                    } else |_| {
                        step.stack_after = &[_]u256{};
                    }
                } else {
                    step.stack_after = &[_]u256{};
                }

                step.memory_size_after = mf.memory_size;
                step.error_occurred = false;

                tracer.steps.append(tracer.allocator, step) catch {};
            }
        } else {
            log.err("[EVM2] MinimalEvm has no current frame when trying to execute opcode 0x{x:0>2}", .{opcode_value});
            @panic("MinimalEvm not initialized");
        }
        return;
    }

    // Handle synthetic opcodes - execute multiple MinimalEvm steps
    switch (opcode) {
        .PUSH_ADD_INLINE, .PUSH_ADD_POINTER => {
            if (evm.getPC() + 2 < evm.getBytecode().len and
                evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x01)
            {
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        tracer.panic("PUSH_ADD step failed: {any}", .{e});
                        return;
                    };
                }
            }
        },
        .PUSH_MUL_INLINE, .PUSH_MUL_POINTER => {
            if (evm.getPC() + 2 < evm.getBytecode().len and
                evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x02)
            {
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        tracer.panic("PUSH_MUL step failed: {any}", .{e});
                        return;
                    };
                }
            }
        },
        .PUSH_SUB_INLINE, .PUSH_SUB_POINTER => {
            if (evm.getPC() + 2 < evm.getBytecode().len and
                evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x03)
            {
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        tracer.panic("PUSH_SUB step failed: {any}", .{e});
                        return;
                    };
                }
            }
        },
        .PUSH_DIV_INLINE, .PUSH_DIV_POINTER => {
            if (evm.getPC() + 2 < evm.getBytecode().len and
                evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x04)
            {
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        tracer.panic("PUSH_DIV step failed: {any}", .{e});
                        return;
                    };
                }
            }
        },
        .PUSH_AND_INLINE, .PUSH_AND_POINTER => {
            if (evm.getPC() + 2 < evm.getBytecode().len and
                evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x16)
            {
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        tracer.panic("PUSH_AND step failed: {any}", .{e});
                        return;
                    };
                }
            }
        },
        .PUSH_OR_INLINE, .PUSH_OR_POINTER => {
            if (evm.getPC() + 2 < evm.getBytecode().len and
                evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x17)
            {
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        tracer.panic("PUSH_OR step failed: {any}", .{e});
                        return;
                    };
                }
            }
        },
        .PUSH_XOR_INLINE, .PUSH_XOR_POINTER => {
            if (evm.getPC() + 2 < evm.getBytecode().len and
                evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x18)
            {
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        tracer.panic("PUSH_XOR step failed: {any}", .{e});
                        return;
                    };
                }
            }
        },
        .PUSH_MLOAD_INLINE, .PUSH_MLOAD_POINTER => {
            if (evm.getPC() + 2 < evm.getBytecode().len and
                evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x51)
            {
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        tracer.panic("PUSH_MLOAD step failed: {any}", .{e});
                        return;
                    };
                }
            }
        },
        .PUSH_MSTORE_INLINE, .PUSH_MSTORE_POINTER => {
            tracer.debug("PUSH_MSTORE_INLINE: MinimalEvm PC={d}, stack_size={d}, Frame stack_size={d}", .{ evm.getPC(), (evm.getCurrentFrame() orelse unreachable).stack.items.len, frame.stack.size() });
            if (evm.getPC() + 2 < evm.getBytecode().len and
                evm.getBytecode()[evm.getPC()] == 0x60 and // PUSH1
                evm.getBytecode()[evm.getPC() + 2] == 0x52)
            {
                tracer.debug("PUSH_MSTORE_INLINE: Found PUSH1+MSTORE at PC {d}, executing 2 steps", .{evm.getPC()});
                inline for (0..2) |step_num| {
                    const current_opcode = evm.getBytecode()[evm.getPC()];
                    tracer.debug("PUSH_MSTORE step {d}: executing opcode 0x{x:0>2} at PC {d}", .{ step_num + 1, current_opcode, evm.getPC() });
                    evm.step() catch |e| {
                        tracer.panic("PUSH_MSTORE step {d} failed: opcode=0x{x:0>2}, error={any}", .{ step_num + 1, current_opcode, e });
                        return;
                    };
                }
            } else {
                tracer.debug("PUSH_MSTORE_INLINE: Not at PUSH1+MSTORE sequence at PC {d} (opcode=0x{x:0>2})", .{ evm.getPC(), if (evm.getPC() < evm.getBytecode().len) evm.getBytecode()[evm.getPC()] else 0 });
                tracer.debug("PUSH_MSTORE_INLINE: Skipping MinimalEvm execution for mis-identified synthetic opcode", .{});
            }
        },
        .PUSH_MSTORE8_INLINE, .PUSH_MSTORE8_POINTER => {
            tracer.debug("PUSH_MSTORE8_INLINE: MinimalEvm PC={d}, stack_size={d}, Frame stack_size={d}", .{ evm.getPC(), (evm.getCurrentFrame() orelse unreachable).stack.items.len, frame.stack.size() });
            if (evm.getPC() + 2 < evm.getBytecode().len and
                evm.getBytecode()[evm.getPC()] == 0x60 and // PUSH1
                evm.getBytecode()[evm.getPC() + 2] == 0x53)
            {
                tracer.debug("PUSH_MSTORE8_INLINE: Found PUSH1+MSTORE8 at PC {d}, executing 2 steps", .{evm.getPC()});

                inline for (0..2) |step_num| {
                    if (evm.getPC() >= evm.getBytecode().len) {
                        tracer.panic("PUSH_MSTORE8 step {d}: PC out of bounds: {d} >= {d}", .{ step_num + 1, evm.getPC(), evm.getBytecode().len });
                        return;
                    }

                    const current_opcode = evm.getBytecode()[evm.getPC()];
                    tracer.debug("PUSH_MSTORE8 step {d}: executing opcode 0x{x:0>2} at PC {d}", .{ step_num + 1, current_opcode, evm.getPC() });

                    evm.step() catch |e| {
                        tracer.panic("PUSH_MSTORE8 step {d} failed: opcode=0x{x:0>2}, error={any}", .{ step_num + 1, current_opcode, e });
                        return;
                    };
                }
            } else {
                tracer.debug("PUSH_MSTORE8_INLINE: Not at PUSH1+MSTORE8 sequence at PC {d} (opcode=0x{x:0>2})", .{ evm.getPC(), if (evm.getPC() < evm.getBytecode().len) evm.getBytecode()[evm.getPC()] else 0 });
                tracer.debug("PUSH_MSTORE8_INLINE: Skipping MinimalEvm execution for mis-identified synthetic opcode", .{});
            }
        },

        .JUMP_TO_STATIC_LOCATION, .JUMPI_TO_STATIC_LOCATION => {
            const pc = evm.getPC();
            const bytecode = evm.getBytecode();
            if (pc + 2 < bytecode.len and bytecode[pc] >= 0x60 and bytecode[pc] <= 0x7f) {
                const push_size = bytecode[pc] - 0x5f;
                const next_op_pc = pc + 1 + push_size;
                if (next_op_pc < bytecode.len and (bytecode[next_op_pc] == 0x56 or bytecode[next_op_pc] == 0x57)) {
                    inline for (0..2) |_| {
                        evm.step() catch |e| {
                            tracer.panic("JUMP_TO_STATIC_LOCATION step failed: {any}", .{e});
                            return;
                        };
                    }
                }
            }
        },

        .MULTI_PUSH_2 => {
            const pc = evm.getPC();
            const bytecode = evm.getBytecode();
            if (pc + 2 < bytecode.len and bytecode[pc] >= 0x60 and bytecode[pc] <= 0x7f) {
                const push_size1 = bytecode[pc] - 0x5f;
                const next_pc = pc + 1 + push_size1;
                if (next_pc < bytecode.len and bytecode[next_pc] >= 0x60 and bytecode[next_pc] <= 0x7f) {
                    inline for (0..2) |_| {
                        evm.step() catch |e| {
                            tracer.panic("MULTI_PUSH_2 step failed: {any}", .{e});
                            return;
                        };
                    }
                }
            }
        },
        .MULTI_PUSH_3 => {
            inline for (0..3) |_| {
                evm.step() catch |e| {
                    tracer.panic("MULTI_PUSH_3 step failed: {any}", .{e});
                    return;
                };
            }
        },
        .MULTI_POP_2 => {
            inline for (0..2) |_| {
                evm.step() catch |e| {
                    tracer.panic("MULTI_POP_2 step failed: {any}", .{e});
                    return;
                };
            }
        },
        .MULTI_POP_3 => {
            inline for (0..3) |_| {
                evm.step() catch |e| {
                    tracer.panic("MULTI_POP_3 step failed: {any}", .{e});
                    return;
                };
            }
        },
        .DUP2_MSTORE_PUSH, .DUP3_ADD_MSTORE, .SWAP1_DUP2_ADD, .PUSH_DUP3_ADD, .PUSH_ADD_DUP1, .MLOAD_SWAP1_DUP2, .ISZERO_JUMPI, .CALLVALUE_CHECK, .PUSH0_REVERT => {
            inline for (0..3) |_| {
                evm.step() catch |e| {
                    tracer.panic("Three-op fusion step failed: {any}", .{e});
                    return;
                };
            }
        },
        .FUNCTION_DISPATCH => {
            inline for (0..4) |_| {
                evm.step() catch |e| {
                    tracer.panic("FUNCTION_DISPATCH step failed: {any}", .{e});
                    return;
                };
            }
        },
        else => {
            // Unknown synthetic opcode should never happen in production
            tracer.panic("Unknown synthetic opcode: {x}", .{@intFromEnum(opcode)});
            @panic("Unknown synthetic opcode encountered");
        },
    }
}