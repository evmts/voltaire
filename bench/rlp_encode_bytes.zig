const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const data = "hello world this is a test string for RLP encoding";
    const result = try primitives.Rlp.encode(allocator, data);
    defer allocator.free(result);
}
