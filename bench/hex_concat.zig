const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const bytes1 = [_]u8{ 0x12, 0x34 };
    const bytes2 = [_]u8{ 0xab, 0xcd };
    const arrays = [_][]const u8{ &bytes1, &bytes2 };

    const result = try primitives.Hex.concat(allocator, &arrays);
    defer allocator.free(result);
}
