const primitives = @import("primitives");
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const tx = primitives.Transaction.Eip1559Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 1_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21000,
        .to = try primitives.Address.fromHex("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"),
        .value = 1_000_000_000_000_000,
        .data = &[_]u8{},
        .access_list = &[_]primitives.Transaction.AccessListItem{},
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const result = try primitives.Transaction.encodeEip1559ForSigning(allocator, tx);
    defer allocator.free(result);
}
