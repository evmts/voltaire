const std = @import("std");
const common = @import("test/evm/opcodes/common.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Build bytecode for PUSH2 (0x61)
    const bytecode = try common.build_bytecode(allocator, 0x61);
    defer allocator.free(bytecode);
    
    std.debug.print("PUSH2 bytecode (length={}): ", .{bytecode.len});
    for (bytecode, 0..) |byte, i| {
        std.debug.print("0x{X:0>2}", .{byte});
        if (i < bytecode.len - 1) std.debug.print(" ", .{});
    }
    std.debug.print("\n", .{});
    
    // Break down the bytecode
    std.debug.print("\nBytecode breakdown:\n", .{});
    var i: usize = 0;
    while (i < bytecode.len) {
        const opcode = bytecode[i];
        switch (opcode) {
            0x61 => {
                if (i + 2 < bytecode.len) {
                    const byte1 = bytecode[i + 1];
                    const byte2 = bytecode[i + 2];
                    const value = (@as(u16, byte1) << 8) | byte2;
                    std.debug.print("  [{}] PUSH2 0x{X:0>4} ({d})\n", .{i, value, value});
                    i += 3;
                } else {
                    std.debug.print("  [{}] PUSH2 (incomplete)\n", .{i});
                    i += 1;
                }
            },
            0x5f => {
                std.debug.print("  [{}] PUSH0\n", .{i});
                i += 1;
            },
            0x52 => {
                std.debug.print("  [{}] MSTORE\n", .{i});
                i += 1;
            },
            0x60 => {
                if (i + 1 < bytecode.len) {
                    const value = bytecode[i + 1];
                    std.debug.print("  [{}] PUSH1 0x{X:0>2}\n", .{i, value});
                    i += 2;
                } else {
                    std.debug.print("  [{}] PUSH1 (incomplete)\n", .{i});
                    i += 1;
                }
            },
            0x00 => {
                std.debug.print("  [{}] STOP\n", .{i});
                i += 1;
            },
            0xf3 => {
                std.debug.print("  [{}] RETURN\n", .{i});
                i += 1;
            },
            else => {
                if (i > 0 and bytecode[i-1] == 0x60) {
                    // This is data for PUSH1, skip
                    i += 1;
                } else {
                    std.debug.print("  [{}] UNKNOWN 0x{X:0>2}\n", .{i, opcode});
                    i += 1;
                }
            },
        }
    }
}