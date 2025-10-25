const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Example signature from test data
    const hash = [_]u8{0x47} ** 32;
    const v = [_]u8{0} ** 31 ++ [_]u8{28};
    const r = [_]u8{0x69} ** 32;
    const s = [_]u8{0x7a} ** 32;

    var input: [128]u8 = undefined;
    @memcpy(input[0..32], &hash);
    @memcpy(input[32..64], &v);
    @memcpy(input[64..96], &r);
    @memcpy(input[96..128], &s);

    const result = try precompiles.ecrecover.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
