const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Map field element to G2 (128 bytes input for Fp2)
    var input: [128]u8 = [_]u8{0} ** 128;
    const result = try precompiles.bls12_map_fp2_to_g2.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
