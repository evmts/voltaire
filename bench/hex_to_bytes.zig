const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const result = try primitives.Hex.hexToBytes(allocator, "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    defer allocator.free(result);
}
