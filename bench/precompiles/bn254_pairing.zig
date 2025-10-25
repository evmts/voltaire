const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Empty input (pairing of zero points)
    const input = [_]u8{};
    const result = try precompiles.bn254_pairing.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
