const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const deployer = try primitives.Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const salt: u256 = 0x123456789abcdef0;
    const init_code = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };

    _ = try primitives.Address.calculateCreate2Address(allocator, deployer, salt, &init_code);
}
