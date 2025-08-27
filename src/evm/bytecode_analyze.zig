const std = @import("std");
const builtin = @import("builtin");
const Opcode = @import("opcode.zig").Opcode;

/// Single-pass bytecode analyzer extracted from bytecode.zig
/// Renamed to bytecodeAnalyze but otherwise identical behavior/signature.
pub fn bytecodeAnalyze(
    comptime PcType: type,
    comptime BasicBlock: type,
    comptime FusionInfo: type,
    allocator: std.mem.Allocator,
    code: []const u8,
) !struct {
    push_pcs: []PcType,
    jumpdests: []PcType,
    basic_blocks: []const BasicBlock,
    jump_fusions: std.AutoHashMap(PcType, PcType),
    advanced_fusions: std.AutoHashMap(PcType, FusionInfo),
} {
    const checkConstantFoldingPatternWithFusion = struct {
        fn check(bytecode: []const u8, position: PcType) ?FusionInfo {
            if (position + 4 >= bytecode.len) return null;

            if (bytecode[position] != @intFromEnum(Opcode.PUSH1)) return null;
            const value1 = bytecode[position + 1];

            if (bytecode[position + 2] != @intFromEnum(Opcode.PUSH1)) return null;
            const value2 = bytecode[position + 3];

            const arith_op = bytecode[position + 4];
            var folded_value: u256 = undefined;
            var sequence_length: PcType = 5;

            switch (arith_op) {
                @intFromEnum(Opcode.ADD) => {
                    folded_value = @as(u256, value1) +% @as(u256, value2);
                },
                @intFromEnum(Opcode.SUB) => {
                    folded_value = @as(u256, value1) -% @as(u256, value2);
                },
                @intFromEnum(Opcode.MUL) => {
                    folded_value = @as(u256, value1) *% @as(u256, value2);
                },
                @intFromEnum(Opcode.SHL) => {
                    if (position + 7 < bytecode.len and 
                        bytecode[position + 4] == @intFromEnum(Opcode.PUSH1) and
                        bytecode[position + 6] == @intFromEnum(Opcode.SHL) and
                        bytecode[position + 7] == @intFromEnum(Opcode.SUB)) {
                        const shift_amount = bytecode[position + 5];
                        const shifted: u256 = if (shift_amount < 256)
                            @as(u256, value2) << @as(u8, @intCast(shift_amount))
                        else
                            0;
                        folded_value = @as(u256, value1) -% shifted;
                        sequence_length = 8;
                    } else {
                        return null;
                    }
                },
                else => return null,
            }

            return FusionInfo{
                .fusion_type = .constant_fold,
                .original_length = sequence_length,
                .folded_value = folded_value,
            };
        }
    }.check;

    const checkNPushPattern = struct {
        fn check(bytecode: []const u8, position: PcType, n: u8) ?FusionInfo {
            if (position + n > bytecode.len) return null;

            var current_pc = position;
            var total_length: PcType = 0;

            var i: u8 = 0;
            while (i < n) : (i += 1) {
                if (current_pc >= bytecode.len) return null;
                const op = bytecode[current_pc];
                if (op < @intFromEnum(Opcode.PUSH1) or op > @intFromEnum(Opcode.PUSH32)) {
                    return null;
                }
                const push_size = op - @intFromEnum(Opcode.PUSH1) + 1;
                current_pc += 1 + push_size;
                total_length += 1 + push_size;
            }

            return FusionInfo{
                .fusion_type = .multi_push,
                .original_length = total_length,
                .count = n,
            };
        }
    }.check;

    const checkNPopPattern = struct {
        fn check(bytecode: []const u8, position: PcType, n: u8) ?FusionInfo {
            if (position + n > bytecode.len) return null;

            var i: u8 = 0;
            while (i < n) : (i += 1) {
                if (bytecode[position + i] != @intFromEnum(Opcode.POP)) {
                    return null;
                }
            }

            return FusionInfo{
                .fusion_type = .multi_pop,
                .original_length = n,
                .count = n,
            };
        }
    }.check;

    const checkIszeroJumpiFusion = struct {
        fn check(bytecode: []const u8, position: PcType) ?FusionInfo {
            if (position + 2 >= bytecode.len) return null;
            if (bytecode[position] != @intFromEnum(Opcode.ISZERO)) return null;

            const push_pc = position + 1;
            const push_op = bytecode[push_pc];
            if (push_op < @intFromEnum(Opcode.PUSH1) or push_op > @intFromEnum(Opcode.PUSH32)) {
                return null;
            }

            const push_size = push_op - @intFromEnum(Opcode.PUSH1) + 1;
            const jumpi_pc = push_pc + 1 + push_size;

            if (jumpi_pc >= bytecode.len or bytecode[jumpi_pc] != @intFromEnum(Opcode.JUMPI)) {
                return null;
            }

            return FusionInfo{
                .fusion_type = .iszero_jumpi,
                .original_length = jumpi_pc + 1 - position,
            };
        }
    }.check;

    const checkDup2MstorePushFusion = struct {
        fn check(bytecode: []const u8, position: PcType) ?FusionInfo {
            if (position + 3 >= bytecode.len) return null;
            if (bytecode[position] != @intFromEnum(Opcode.DUP2)) return null;
            if (bytecode[position + 1] != @intFromEnum(Opcode.MSTORE)) return null;

            const push_pc = position + 2;
            const push_op = bytecode[push_pc];
            if (push_op < @intFromEnum(Opcode.PUSH1) or push_op > @intFromEnum(Opcode.PUSH32)) {
                return null;
            }

            const push_size = push_op - @intFromEnum(Opcode.PUSH1) + 1;

            return FusionInfo{
                .fusion_type = .dup2_mstore_push,
                .original_length = 3 + push_size,
            };
        }
    }.check;

    var push_list = std.ArrayList(PcType){};
    defer push_list.deinit(allocator);

    var jumpdest_list = std.ArrayList(PcType){};
    defer jumpdest_list.deinit(allocator);

    var jump_fusions = std.AutoHashMap(PcType, PcType).init(allocator);
    errdefer jump_fusions.deinit();

    var advanced_fusions = std.AutoHashMap(PcType, FusionInfo).init(allocator);
    errdefer advanced_fusions.deinit();

    var pc: PcType = 0;
    while (pc < code.len) {
        const opcode = code[pc];

        if (checkConstantFoldingPatternWithFusion(code, pc)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        if (checkNPushPattern(code, pc, 3)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        if (checkNPopPattern(code, pc, 3)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        if (checkIszeroJumpiFusion(code, pc)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        if (checkDup2MstorePushFusion(code, pc)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        if (checkNPushPattern(code, pc, 2)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        if (checkNPopPattern(code, pc, 2)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }

        if (opcode >= @intFromEnum(Opcode.PUSH1) and opcode <= @intFromEnum(Opcode.PUSH32)) {
            try push_list.append(allocator, pc);
            const push_size = opcode - @intFromEnum(Opcode.PUSH1) + 1;
            pc += 1 + push_size;
        } else if (opcode == @intFromEnum(Opcode.JUMPDEST)) {
            try jumpdest_list.append(allocator, pc);

            if (pc + 1 < code.len) {
                const next_opcode = code[pc + 1];
                if (next_opcode >= @intFromEnum(Opcode.PUSH1) and next_opcode <= @intFromEnum(Opcode.PUSH32)) {
                    const push_size = next_opcode - @intFromEnum(Opcode.PUSH1) + 1;
                    const jump_pc = pc + 2 + push_size;

                    if (jump_pc < code.len and code[jump_pc] == @intFromEnum(Opcode.JUMP)) {
                        if (pc + 2 + push_size <= code.len) {
                            var target: PcType = 0;
                            for (code[pc + 2..pc + 2 + push_size]) |byte| {
                                target = (target << 8) | byte;
                            }
                            if (target <= std.math.maxInt(PcType)) {
                                try jump_fusions.put(pc, @intCast(target));
                            }
                        }
                    } else if (jump_pc + 1 < code.len) {
                        const next_next_opcode = code[jump_pc];
                        if (next_next_opcode >= @intFromEnum(Opcode.PUSH1) and next_next_opcode <= @intFromEnum(Opcode.PUSH32)) {
                            const push2_size = next_next_opcode - @intFromEnum(Opcode.PUSH1) + 1;
                            const jumpi_pc = jump_pc + 1 + push2_size;

                            if (jumpi_pc < code.len and code[jumpi_pc] == @intFromEnum(Opcode.JUMPI)) {
                                if (pc + 2 + push_size <= code.len) {
                                    var target: PcType = 0;
                                    for (code[pc + 2..pc + 2 + push_size]) |byte| {
                                        target = (target << 8) | byte;
                                    }
                                    if (target <= std.math.maxInt(PcType)) {
                                        try jump_fusions.put(pc, @intCast(target));
                                    }
                                }
                            }
                        }
                    }
                }
            }
            pc += 1;
        } else {
            pc += 1;
        }
    }

    const push_pcs = try push_list.toOwnedSlice(allocator);
    errdefer allocator.free(push_pcs);

    const jumpdests = try jumpdest_list.toOwnedSlice(allocator);
    errdefer allocator.free(jumpdests);

    var iter = jump_fusions.iterator();
    var to_remove = std.ArrayList(PcType){};
    defer to_remove.deinit(allocator);
    while (iter.next()) |entry| {
        const target = entry.value_ptr.*;
        var valid = false;
        for (jumpdests) |jd| {
            if (jd == target) { valid = true; break; }
        }
        if (!valid) try to_remove.append(allocator, entry.key_ptr.*);
    }
    for (to_remove.items) |key| { _ = jump_fusions.remove(key); }

    var blocks = std.ArrayList(BasicBlock){};
    defer blocks.deinit(allocator);
    var block_start: PcType = 0;
    for (jumpdests) |jd| {
        if (jd > block_start) {
            try blocks.append(allocator, .{ .start = block_start, .end = jd });
            block_start = jd;
        }
    }
    if (block_start < code.len) {
        try blocks.append(allocator, .{ .start = block_start, .end = @intCast(code.len) });
    }
    const basic_blocks = try blocks.toOwnedSlice(allocator);

    return .{
        .push_pcs = push_pcs,
        .jumpdests = jumpdests,
        .basic_blocks = basic_blocks,
        .jump_fusions = jump_fusions,
        .advanced_fusions = advanced_fusions,
    };
}

const testing = std.testing;

test "bytecode analyze - single-pass analyzer" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH2), 0x02, 0x03,
        @intFromEnum(Opcode.ADD),
    };

    const BytecodeType = @import("bytecode.zig").Bytecode(@import("bytecode_config.zig").BytecodeConfig{});
    const analysis = try bytecodeAnalyze(BytecodeType.PcType, BytecodeType.BasicBlock, BytecodeType.FusionInfo, allocator, &code);
    defer {
        allocator.free(analysis.push_pcs);
        allocator.free(analysis.jumpdests);
        allocator.free(analysis.basic_blocks);
        analysis.jump_fusions.deinit();
        analysis.advanced_fusions.deinit();
    }

    try testing.expectEqual(@as(usize, 2), analysis.push_pcs.len);
    try testing.expectEqual(@as(BytecodeType.PcType, 0), analysis.push_pcs[0]);
    try testing.expectEqual(@as(BytecodeType.PcType, 2), analysis.push_pcs[1]);
}

