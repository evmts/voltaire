const std = @import("std");
const Withdrawal = @import("Withdrawal.zig").Withdrawal;
const Address = @import("Address.zig").Address;
const Quantity = @import("Quantity.zig").Quantity;

// Test JSON serialization of Withdrawal type
// Per EIP-1474: fields should be serialized as QUANTITY (hex without leading zeros)
// except address which is DATA (20 byte hex)

test "Withdrawal: JSON serialization basic" {
    const withdrawal = Withdrawal{
        .index = .{ .value = .{ .string = "0x1a" } },
        .validatorIndex = .{ .value = .{ .string = "0x5" } },
        .address = .{ .bytes = .{0x3a, 0xe7, 0x5c, 0x08, 0xb4, 0xc9, 0x07, 0xeb, 0x63, 0xa8, 0x96, 0x0c, 0x45, 0xb8, 0x6e, 0x1e, 0x9a, 0xb6, 0x12, 0x3c} },
        .amount = .{ .value = .{ .string = "0x64" } },
    };

    var buf: [1024]u8 = undefined;
    var fbs = std.io.fixedBufferStream(&buf);
    try std.json.stringify(withdrawal, .{}, fbs.writer());
    const json = fbs.getWritten();

    // Verify all required fields are present
    try std.testing.expect(std.mem.indexOf(u8, json, "\"index\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"validatorIndex\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"address\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"amount\"") != null);
}

test "Withdrawal: matches Shanghai fork test vector" {
    // From execution-apis/tests/eth_getBlockByNumber/get-block-shanghai-fork.io
    // {"index":"0x0","validatorIndex":"0x5","address":"0x3ae75c08b4c907eb63a8960c45b86e1e9ab6123c","amount":"0x64"}
    const withdrawal = Withdrawal{
        .index = .{ .value = .{ .string = "0x0" } },
        .validatorIndex = .{ .value = .{ .string = "0x5" } },
        .address = .{ .bytes = .{0x3a, 0xe7, 0x5c, 0x08, 0xb4, 0xc9, 0x07, 0xeb, 0x63, 0xa8, 0x96, 0x0c, 0x45, 0xb8, 0x6e, 0x1e, 0x9a, 0xb6, 0x12, 0x3c} },
        .amount = .{ .value = .{ .string = "0x64" } },
    };

    var buf: [1024]u8 = undefined;
    var fbs = std.io.fixedBufferStream(&buf);
    try std.json.stringify(withdrawal, .{}, fbs.writer());
    const json = fbs.getWritten();

    // Verify field names match EIP-1474 spec (camelCase)
    try std.testing.expect(std.mem.indexOf(u8, json, "\"index\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"validatorIndex\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"address\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"amount\"") != null);

    // Verify the address is properly serialized as hex
    try std.testing.expect(std.mem.indexOf(u8, json, "0x3ae75c08b4c907eb63a8960c45b86e1e9ab6123c") != null);
}

test "Withdrawal: JSON parse from value" {
    const allocator = std.testing.allocator;

    const json_str =
        \\{
        \\  "index": "0x1a",
        \\  "validatorIndex": "0x5",
        \\  "address": "0x3ae75c08b4c907eb63a8960c45b86e1e9ab6123c",
        \\  "amount": "0x64"
        \\}
    ;

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json_str, .{});
    defer parsed.deinit();

    const withdrawal = try Withdrawal.jsonParseFromValue(allocator, parsed.value, .{});

    // Verify fields were parsed correctly
    try std.testing.expectEqualStrings("0x1a", withdrawal.index.value.string);
    try std.testing.expectEqualStrings("0x5", withdrawal.validatorIndex.value.string);
    try std.testing.expectEqualStrings("0x64", withdrawal.amount.value.string);
}

test "Withdrawal: address serialization" {
    const withdrawal = Withdrawal{
        .index = .{ .value = .{ .string = "0x0" } },
        .validatorIndex = .{ .value = .{ .string = "0x0" } },
        .address = .{ .bytes = [_]u8{0} ** 20 },
        .amount = .{ .value = .{ .string = "0x0" } },
    };

    var buf: [1024]u8 = undefined;
    var fbs = std.io.fixedBufferStream(&buf);
    try std.json.stringify(withdrawal, .{}, fbs.writer());
    const json = fbs.getWritten();

    // Zero address should be serialized as 0x000...000 (42 chars including 0x)
    try std.testing.expect(std.mem.indexOf(u8, json, "0x0000000000000000000000000000000000000000") != null);
}

test "Withdrawal: roundtrip serialization" {
    const allocator = std.testing.allocator;

    const original = Withdrawal{
        .index = .{ .value = .{ .string = "0x1a" } },
        .validatorIndex = .{ .value = .{ .string = "0x5" } },
        .address = .{ .bytes = .{0x3a, 0xe7, 0x5c, 0x08, 0xb4, 0xc9, 0x07, 0xeb, 0x63, 0xa8, 0x96, 0x0c, 0x45, 0xb8, 0x6e, 0x1e, 0x9a, 0xb6, 0x12, 0x3c} },
        .amount = .{ .value = .{ .string = "0x64" } },
    };

    // Serialize
    var buf: [1024]u8 = undefined;
    var fbs = std.io.fixedBufferStream(&buf);
    try std.json.stringify(original, .{}, fbs.writer());
    const json = fbs.getWritten();

    // Parse back
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const restored = try Withdrawal.jsonParseFromValue(allocator, parsed.value, .{});

    // Verify roundtrip
    try std.testing.expectEqualStrings(original.index.value.string, restored.index.value.string);
    try std.testing.expectEqualStrings(original.validatorIndex.value.string, restored.validatorIndex.value.string);
    try std.testing.expectEqualStrings(original.amount.value.string, restored.amount.value.string);
    try std.testing.expectEqualSlices(u8, &original.address.bytes, &restored.address.bytes);
}
