const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const bytes = [_]u8{ 0x12, 0x34 };
    const result = try primitives.Hex.padLeft(allocator, &bytes, 32);
    defer allocator.free(result);
}
