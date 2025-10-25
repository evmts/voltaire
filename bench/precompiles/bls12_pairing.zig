const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Single pair pairing check (384 bytes per pair)
    var input: [384]u8 = [_]u8{0} ** 384;
    const result = try precompiles.bls12_pairing.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
