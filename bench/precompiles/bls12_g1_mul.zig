const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Point at infinity * scalar 0
    var input: [160]u8 = [_]u8{0} ** 160;
    const result = try precompiles.bls12_g1_mul.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
