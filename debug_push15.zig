const std = @import("std");

pub fn build_bytecode_for_push15(allocator: std.mem.Allocator) ![]u8 {
    var buf = std.ArrayList(u8){};
    
    // Generate PUSH15 bytecode: opcode 0x6e followed by 15 bytes of data
    try buf.append(allocator, 0x6e); // PUSH15
    
    // Push 15 bytes of data (0xaa, 0xab, ..., 0xb8)
    var i: u8 = 0;
    while (i < 15) : (i += 1) {
        try buf.append(allocator, 0xaa + i);
    }
    
    // Add return sequence: PUSH1 0x00, MSTORE, PUSH1 0x20, PUSH1 0x00, RETURN
    try buf.append(allocator, 0x60); // PUSH1
    try buf.append(allocator, 0x00); // offset for MSTORE
    try buf.append(allocator, 0x52); // MSTORE
    try buf.append(allocator, 0x60); // PUSH1
    try buf.append(allocator, 0x20); // size for RETURN (32 bytes)
    try buf.append(allocator, 0x60); // PUSH1  
    try buf.append(allocator, 0x00); // offset for RETURN
    try buf.append(allocator, 0xf3); // RETURN
    
    return buf.toOwnedSlice(allocator);
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    const bytecode = try build_bytecode_for_push15(allocator);
    defer allocator.free(bytecode);
    
    std.debug.print("Bytecode for PUSH15 (0x6e):\n", .{});
    for (bytecode, 0..) |b, i| {
        if (i % 16 == 0 and i > 0) std.debug.print("\n", .{});
        std.debug.print("{X:02} ", .{b});
    }
    std.debug.print("\n\nLength: {}\n", .{bytecode.len});
    
    // Decode the instruction
    std.debug.print("Instructions breakdown:\n", .{});
    std.debug.print("0x6e = PUSH15\n", .{});
    std.debug.print("PUSH15 data (15 bytes): ", .{});
    for (bytecode[1..16]) |b| {
        std.debug.print("{X:02} ", .{b});
    }
    std.debug.print("\n", .{});
    
    std.debug.print("Return sequence: ", .{});
    for (bytecode[16..]) |b| {
        std.debug.print("{X:02} ", .{b});
    }
    std.debug.print("\n", .{});
    std.debug.print("0x60 0x00 = PUSH1 0x00 (offset)\n", .{});
    std.debug.print("0x52 = MSTORE\n", .{});
    std.debug.print("0x60 0x20 = PUSH1 0x20 (size)\n", .{});
    std.debug.print("0x60 0x00 = PUSH1 0x00 (offset)\n", .{});
    std.debug.print("0xf3 = RETURN\n", .{});
}