const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const list = [_][]const u8{ "dog", "cat", "mouse", "elephant", "lion" };
    const result = try primitives.Rlp.encode(allocator, list[0..]);
    defer allocator.free(result);
}
