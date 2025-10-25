const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Single point MSM (point at infinity * scalar 0)
    var input: [288]u8 = [_]u8{0} ** 288;
    const result = try precompiles.bls12_g2_msm.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
