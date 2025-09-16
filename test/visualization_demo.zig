const std = @import("std");
const evm = @import("evm");

test "pretty print visualization with jumps" {
    const allocator = std.testing.allocator;
    
    // Example bytecode that demonstrates jump connections
    const code = [_]u8{
        0x60, 0x05,  // 0: PUSH1 5
        0x60, 0x03,  // 2: PUSH1 3  
        0x01,        // 4: ADD
        0x60, 0x0d,  // 5: PUSH1 13 (decimal 13 = 0x0d)
        0x57,        // 7: JUMPI (conditional jump to 13)
        0x5B,        // 8: JUMPDEST (target)
        0x60, 0x00,  // 9: PUSH1 0
        0x60, 0x20,  // 11: PUSH1 32
        0xF3,        // 13: RETURN
        0x5B,        // 14: JUMPDEST (target at PC=14)
        0xFD,        // 15: REVERT
    };
    
    var bytecode = try evm.bytecode.BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    const formatted = try bytecode.pretty_print(allocator);
    defer allocator.free(formatted);
    
    std.debug.print("\n{s}\n", .{formatted});
    
    // Check that visualization includes expected elements
    try std.testing.expect(std.mem.indexOf(u8, formatted, "JUMPDEST") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "JUMPI") != null);
}