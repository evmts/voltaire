const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Event Topics Example ===\n\n", .{});
    const sig = "Transfer(address,address,uint256)";

    // topic0 = keccak256("Transfer(address,address,uint256)")
    const topic0 = try primitives.Hash.keccak256String(allocator, sig);
    defer allocator.free(topic0);
    std.debug.print("topic0: 0x{s}\n", .{std.fmt.fmtSliceHexLower(topic0)});

    // Indexed address topics are 32-byte left-padded values
    const from = try Address.fromHex("0x742d35cc6632c0532925a3b8d39c0e6cfc8c74e4");
    const to = try Address.fromHex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");

    var topic1: [32]u8 = .{0} ** 32;
    var topic2: [32]u8 = .{0} ** 32;
    // copy last 20 bytes
    @memcpy(topic1[12..], &from.bytes);
    @memcpy(topic2[12..], &to.bytes);

    std.debug.print("topic1(from): 0x{s}\n", .{std.fmt.fmtSliceHexLower(&topic1)});
    std.debug.print("topic2(to):   0x{s}\n", .{std.fmt.fmtSliceHexLower(&topic2)});

    std.debug.print("\nUse topic0 in the first log topic, and topic1/topic2 for indexed address filters.\n\n", .{});
}
