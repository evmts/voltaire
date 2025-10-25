const std = @import("std");
const precompiles = @import("precompiles");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // 2^3 mod 5 = 3
    var input: [99]u8 = [_]u8{0} ** 99;

    // base_len = 1
    input[31] = 1;
    // exp_len = 1
    input[63] = 1;
    // mod_len = 1
    input[95] = 1;

    // base = 2
    input[96] = 2;
    // exp = 3
    input[97] = 3;
    // mod = 5
    input[98] = 5;

    const result = try precompiles.modexp.execute(allocator, &input, 1000000, .CANCUN);
    defer result.deinit(allocator);
}
