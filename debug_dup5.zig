const std = @import("std");
const common = @import("test/evm/opcodes/common.zig");

pub fn main() !void {
    var allocator = std.heap.page_allocator;
    const bytecode = try common.build_bytecode(allocator, 0x84);
    defer allocator.free(bytecode);
    
    std.debug.print("Bytecode for DUP5 (0x84): ", .{});
    for (bytecode, 0..) |b, i| {
        std.debug.print("{x:0>2}", .{b});
        if (i < bytecode.len - 1) std.debug.print(" ", .{});
    }
    std.debug.print("\n");
    std.debug.print("Length: {}\n", .{bytecode.len});
    
    // Let's decode it step by step
    var i: usize = 0;
    std.debug.print("\nDecoded:\n", .{});
    while (i < bytecode.len) {
        const op = bytecode[i];
        std.debug.print("{}: 0x{x:0>2} ", .{i, op});
        
        if (op >= 0x60 and op <= 0x7f) {
            const push_bytes = op - 0x5f;
            std.debug.print("PUSH{} ", .{push_bytes});
            i += 1;
            if (i + push_bytes <= bytecode.len) {
                for (0..push_bytes) |j| {
                    std.debug.print("{x:0>2}", .{bytecode[i + j]});
                }
                i += push_bytes;
            }
            std.debug.print("\n", .{});
        } else {
            switch (op) {
                0x84 => std.debug.print("DUP5\n", .{}),
                0x52 => std.debug.print("MSTORE\n", .{}),
                0xf3 => std.debug.print("RETURN\n", .{}),
                0x5f => std.debug.print("PUSH0\n", .{}),
                else => std.debug.print("UNKNOWN\n", .{}),
            }
            i += 1;
        }
    }
}