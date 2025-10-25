const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const value: u64 = 1024;
    const result = try primitives.Rlp.encode(allocator, value);
    defer allocator.free(result);
}
