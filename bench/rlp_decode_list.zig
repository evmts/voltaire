const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const encoded = [_]u8{ 0xcc, 0x83, 'd', 'o', 'g', 0x83, 'c', 'a', 't', 0x85, 'm', 'o', 'u', 's', 'e' };
    const decoded = try primitives.Rlp.decode(allocator, &encoded, false);
    defer decoded.data.deinit(allocator);
}
