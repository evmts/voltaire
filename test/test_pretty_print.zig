const std = @import("std");
const evm = @import("evm");

test "pretty print with JUMPDEST, JUMP, JUMPI visualization" {
    const allocator = std.testing.allocator;
    
    // Example bytecode showing jump connections
    const code = [_]u8{
        0x60, 0x05,  // 0: PUSH1 5
        0x60, 0x03,  // 2: PUSH1 3  
        0x01,        // 4: ADD
        0x60, 0x0e,  // 5: PUSH1 14 (jump to JUMPDEST at PC=14)
        0x57,        // 7: JUMPI (conditional jump)
        0x5B,        // 8: JUMPDEST (first target)
        0x60, 0x00,  // 9: PUSH1 0
        0x60, 0x20,  // 11: PUSH1 32
        0xF3,        // 13: RETURN
        0x5B,        // 14: JUMPDEST (second target)
        0xFD,        // 15: REVERT
    };
    
    var bytecode = try evm.bytecode.BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    const formatted = try bytecode.pretty_print(allocator);
    defer allocator.free(formatted);
    
    // Print the formatted bytecode for visual inspection
    std.debug.print("\n{s}\n", .{formatted});
    
    // Check that the output contains expected elements
    try std.testing.expect(std.mem.indexOf(u8, formatted, "JUMPDEST") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "JUMP") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "JUMPI") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "Legend") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "PC") != null);
}