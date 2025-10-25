const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const result = try primitives.Numeric.formatEther(allocator, primitives.Numeric.ETHER);
    defer allocator.free(result);
}
