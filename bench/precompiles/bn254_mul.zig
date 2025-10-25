const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Multiply point by zero
    const input = [_]u8{0} ** 96;
    const result = try precompiles.bn254_mul.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
