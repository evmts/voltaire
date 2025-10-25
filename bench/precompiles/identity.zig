const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const input = [_]u8{1} ** 1024;
    const result = try precompiles.identity.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
}
