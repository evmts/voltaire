const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Point at infinity + point at infinity
    const input = [_]u8{0} ** 128;
    const result = try precompiles.bn254_add.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
