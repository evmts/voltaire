const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Point at infinity + point at infinity (G2 points are 512 bytes total)
    var input: [512]u8 = [_]u8{0} ** 512;
    const result = try precompiles.bls12_g2_add.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
