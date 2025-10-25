const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const deployer = try primitives.Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    _ = try primitives.Address.calculateCreateAddress(allocator, deployer, 0);
}
