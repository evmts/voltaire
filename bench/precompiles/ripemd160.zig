const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const input = "Hello, World!";
    const result = try precompiles.ripemd160.execute(allocator, input, 1000000);
    defer result.deinit(allocator);
}
