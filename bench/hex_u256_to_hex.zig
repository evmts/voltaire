const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const value: u256 = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
    const result = try primitives.Hex.u256ToHex(allocator, value);
    defer allocator.free(result);
}
