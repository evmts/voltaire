const std = @import("std");
const types = @import("../../types.zig");
const EthGetBlockReceipts = @import("eth_getBlockReceipts.zig");

// Test that Result correctly parses a null response (block not found)
test "eth_getBlockReceipts Result parses null" {
    const allocator = std.testing.allocator;
    const json = "null";

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const result = try EthGetBlockReceipts.Result.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(result.value == null);
}

// Test that Result correctly parses an empty array response
test "eth_getBlockReceipts Result parses empty array" {
    const allocator = std.testing.allocator;
    const json = "[]";

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const result = try EthGetBlockReceipts.Result.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(result.value != null);
    try std.testing.expectEqual(0, result.value.?.len);
}

// Test that Result correctly parses an array with multiple receipts
test "eth_getBlockReceipts Result parses multiple receipts" {
    const allocator = std.testing.allocator;
    const json =
        \\[
        \\  {
        \\    "blockHash": "0x558340736256a3a431f7340546850dfd1451171a5c990308f86c47e4f41aed1a",
        \\    "blockNumber": "0x2",
        \\    "contractAddress": null,
        \\    "cumulativeGasUsed": "0x5208",
        \\    "effectiveGasPrice": "0x1",
        \\    "from": "0x7435ed30a8b4aeb0877cef0c6e8cffe834eb865f",
        \\    "gasUsed": "0x5208",
        \\    "logs": [],
        \\    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        \\    "status": "0x1",
        \\    "to": "0xeda8645ba6948855e3b3cd596bbb07596d59c603",
        \\    "transactionHash": "0x0d6999c0e9e4bec347945593e97bdcdf7c25be08ca1a1efdc520dbe75be985f3",
        \\    "transactionIndex": "0x0",
        \\    "type": "0x2"
        \\  },
        \\  {
        \\    "blockHash": "0x558340736256a3a431f7340546850dfd1451171a5c990308f86c47e4f41aed1a",
        \\    "blockNumber": "0x2",
        \\    "contractAddress": null,
        \\    "cumulativeGasUsed": "0xa410",
        \\    "effectiveGasPrice": "0x1",
        \\    "from": "0x7435ed30a8b4aeb0877cef0c6e8cffe834eb865f",
        \\    "gasUsed": "0x5208",
        \\    "logs": [],
        \\    "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        \\    "status": "0x1",
        \\    "to": "0xeda8645ba6948855e3b3cd596bbb07596d59c603",
        \\    "transactionHash": "0x1d6999c0e9e4bec347945593e97bdcdf7c25be08ca1a1efdc520dbe75be985f4",
        \\    "transactionIndex": "0x1",
        \\    "type": "0x2"
        \\  }
        \\]
    ;

    var arena = std.heap.ArenaAllocator.init(allocator);
    defer arena.deinit();
    const arena_allocator = arena.allocator();

    const parsed = try std.json.parseFromSlice(std.json.Value, arena_allocator, json, .{});
    defer parsed.deinit();

    const result = try EthGetBlockReceipts.Result.jsonParseFromValue(arena_allocator, parsed.value, .{});

    try std.testing.expect(result.value != null);
    const receipts = result.value.?;
    try std.testing.expectEqual(2, receipts.len);

    // Verify first receipt
    try std.testing.expectEqual(2, receipts[0].blockNumber);
    try std.testing.expectEqual(0, receipts[0].transactionIndex);

    // Verify second receipt
    try std.testing.expectEqual(2, receipts[1].blockNumber);
    try std.testing.expectEqual(1, receipts[1].transactionIndex);
    try std.testing.expectEqual(0xa410, receipts[1].cumulativeGasUsed);
}

// Test that Params correctly parses
test "eth_getBlockReceipts Params parses block number" {
    const allocator = std.testing.allocator;
    const json = "[\"0x1234\"]";

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const params = try EthGetBlockReceipts.Params.jsonParseFromValue(allocator, parsed.value, .{});

    _ = params;
}

// Test that Params correctly parses block tag
test "eth_getBlockReceipts Params parses block tag" {
    const allocator = std.testing.allocator;
    const json = "[\"latest\"]";

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const params = try EthGetBlockReceipts.Params.jsonParseFromValue(allocator, parsed.value, .{});

    _ = params;
}
