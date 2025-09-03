const std = @import("std");

pub fn main() !void {
    // Simulate the PUSH15 data extraction like the bytecode parser does
    const push15_data = [_]u8{ 0xAA, 0xAB, 0xAC, 0xAD, 0xAE, 0xAF, 0xB0, 0xB1, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8 };
    
    var value: u256 = 0;
    for (push15_data) |byte| {
        value = (value << 8) | byte;
    }
    
    std.debug.print("PUSH15 raw bytes: ", .{});
    for (push15_data) |b| {
        std.debug.print("{X:02} ", .{b});
    }
    std.debug.print("\n", .{});
    
    std.debug.print("PUSH15 parsed value: 0x{X}\n", .{value});
    std.debug.print("PUSH15 decimal: {}\n", .{value});
    
    // When this u256 value is stored in 32 bytes (right-aligned), what would it look like?
    var bytes: [32]u8 = [_]u8{0} ** 32;
    std.mem.writeInt(u256, &bytes, value, .big);
    
    std.debug.print("As 32-byte value (big-endian): ", .{});
    for (bytes) |b| {
        std.debug.print("{X:02} ", .{b});
    }
    std.debug.print("\n", .{});
}