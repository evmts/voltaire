const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Point at infinity + point at infinity
    var input: [256]u8 = [_]u8{0} ** 256;
    const result = try precompiles.bls12_g1_add.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
