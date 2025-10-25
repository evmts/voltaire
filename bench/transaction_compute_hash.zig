const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const tx = primitives.Transaction.LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = try primitives.Address.fromHex("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"),
        .value = 1_000_000_000_000_000,
        .data = &[_]u8{},
        .v = 37,
        .r = [_]u8{0x12} ** 32,
        .s = [_]u8{0x34} ** 32,
    };

    _ = try primitives.Transaction.computeLegacyTransactionHash(allocator, tx);
}
