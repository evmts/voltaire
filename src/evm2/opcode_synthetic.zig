const std = @import("std");
const Opcode = @import("opcode.zig").Opcode;

/// Synthetic opcodes for fused operations.
/// These values are chosen to avoid conflicts with standard EVM opcodes.
/// The compile-time check below ensures no conflicts exist.
pub const OpcodeSynthetic = enum(u8) {
    PUSH_ADD_INLINE = 0xB0,
    PUSH_ADD_POINTER = 0xB1,
    PUSH_MUL_INLINE = 0xB2,
    PUSH_MUL_POINTER = 0xB3,
    PUSH_DIV_INLINE = 0xB4,
    PUSH_DIV_POINTER = 0xB5,
    PUSH_JUMP_INLINE = 0xB6,
    PUSH_JUMP_POINTER = 0xB7,
    PUSH_JUMPI_INLINE = 0xB8,
    PUSH_JUMPI_POINTER = 0xB9,
};

// Compile-time check to ensure synthetic opcodes don't overlap with normal opcodes
comptime {
    @setEvalBranchQuota(10000);
    for (@typeInfo(OpcodeSynthetic).@"enum".fields) |syn_field| {
        // Try to convert the synthetic opcode value to a regular Opcode
        if (std.meta.intToEnum(Opcode, syn_field.value) catch null) |conflicting_opcode| {
            @compileError(std.fmt.comptimePrint(
                "Synthetic opcode {s} (0x{X}) conflicts with normal opcode {s}",
                .{ syn_field.name, syn_field.value, @tagName(conflicting_opcode) }
            ));
        } 
    }
}

test "OpcodeSynthetic values are unique and non-conflicting" {
    const opcodes = [_]u8{
        @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE),
        @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER),
        @intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE),
        @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER),
        @intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE),
        @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER),
        @intFromEnum(OpcodeSynthetic.PUSH_JUMP_INLINE),
        @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER),
        @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_INLINE),
        @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER),
    };
    for (opcodes, 0..) |op1, i| {
        for (opcodes[i+1..]) |op2| {
            try std.testing.expect(op1 != op2);
        }
    }
    try std.testing.expectEqual(@as(u8, 0xB0), @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE));
    try std.testing.expectEqual(@as(u8, 0xB1), @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER));
    try std.testing.expectEqual(@as(u8, 0xB2), @intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE));
    try std.testing.expectEqual(@as(u8, 0xB3), @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER));
    try std.testing.expectEqual(@as(u8, 0xB4), @intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE));
    try std.testing.expectEqual(@as(u8, 0xB5), @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER));
    try std.testing.expectEqual(@as(u8, 0xB6), @intFromEnum(OpcodeSynthetic.PUSH_JUMP_INLINE));
    try std.testing.expectEqual(@as(u8, 0xB7), @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER));
    try std.testing.expectEqual(@as(u8, 0xB8), @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_INLINE));
    try std.testing.expectEqual(@as(u8, 0xB9), @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER));
}

