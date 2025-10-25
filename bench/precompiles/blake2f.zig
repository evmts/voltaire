const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Blake2f requires exactly 213 bytes: 4 byte rounds + 209 bytes of data
    var input: [213]u8 = [_]u8{0} ** 213;
    // Set rounds to 12 (standard)
    input[3] = 12;

    const result = try precompiles.blake2f.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
