const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Map field element to G1 (64 bytes input)
    var input: [64]u8 = [_]u8{0} ** 64;
    const result = try precompiles.bls12_map_fp_to_g1.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
