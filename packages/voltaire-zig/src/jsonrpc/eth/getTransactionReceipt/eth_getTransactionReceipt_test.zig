const std = @import("std");
const types = @import("../../types.zig");
const EthGetTransactionReceipt = @import("eth_getTransactionReceipt.zig");

// Test that Result correctly parses a null response (transaction not found)
test "eth_getTransactionReceipt Result parses null" {
    const allocator = std.testing.allocator;
    const json = "null";

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const result = try EthGetTransactionReceipt.Result.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(result.value == null);
}

// Test that Result correctly parses a legacy receipt response
test "eth_getTransactionReceipt Result parses legacy receipt" {
    const allocator = std.testing.allocator;
    const json =
        \\{
        \\  "blockHash": "0x558340736256a3a431f7340546850dfd1451171a5c990308f86c47e4f41aed1a",
        \\  "blockNumber": "0x2",
        \\  "contractAddress": null,
        \\  "cumulativeGasUsed": "0x3d037",
        \\  "effectiveGasPrice": "0x1",
        \\  "from": "0x7435ed30a8b4aeb0877cef0c6e8cffe834eb865f",
        \\  "gasUsed": "0x5208",
        \\  "logs": [],
        \\  "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        \\  "root": "0x7e099d847594c44aed09000b17536bab7dbc64be4572474bae7b4dd04ce8c2df",
        \\  "to": "0xeda8645ba6948855e3b3cd596bbb07596d59c603",
        \\  "transactionHash": "0x0d6999c0e9e4bec347945593e97bdcdf7c25be08ca1a1efdc520dbe75be985f3",
        \\  "transactionIndex": "0x3",
        \\  "type": "0x0"
        \\}
    ;

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const result = try EthGetTransactionReceipt.Result.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(result.value != null);
    const receipt = result.value.?;

    // Verify key fields
    try std.testing.expectEqual(2, receipt.blockNumber);
    try std.testing.expectEqual(3, receipt.transactionIndex);
    try std.testing.expect(receipt.root != null);
    try std.testing.expect(receipt.status == null);
}

// Test that Result correctly parses an EIP-1559 receipt response
test "eth_getTransactionReceipt Result parses EIP-1559 receipt" {
    const allocator = std.testing.allocator;
    const json =
        \\{
        \\  "blockHash": "0x155ed001f7571cb6fa37e5c9c2462b4704ce9cdf53fddc39e9d9f96f92a5233c",
        \\  "blockNumber": "0x1b",
        \\  "contractAddress": null,
        \\  "cumulativeGasUsed": "0xca9c",
        \\  "effectiveGasPrice": "0x3b9aca01",
        \\  "from": "0x7435ed30a8b4aeb0877cef0c6e8cffe834eb865f",
        \\  "gasUsed": "0xca9c",
        \\  "logs": [],
        \\  "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        \\  "status": "0x1",
        \\  "to": "0x7dcd17433742f4c0ca53122ab541d0ba67fc27df",
        \\  "transactionHash": "0xc7dba25cdd5aee6ff7d27fe5422a4179f5913c664c3339c8e0440bd1c9cd8de9",
        \\  "transactionIndex": "0x0",
        \\  "type": "0x2"
        \\}
    ;

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const result = try EthGetTransactionReceipt.Result.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(result.value != null);
    const receipt = result.value.?;

    // Verify key fields
    try std.testing.expectEqual(0x1b, receipt.blockNumber);
    try std.testing.expectEqual(2, receipt.tx_type.?);
    try std.testing.expect(receipt.status != null);
    try std.testing.expectEqual(1, receipt.status.?);
    try std.testing.expect(receipt.root == null);
}

// Test that Params correctly parses
test "eth_getTransactionReceipt Params parses correctly" {
    const allocator = std.testing.allocator;
    const json = "[\"0x504ce587a65bdbdb6414a0c6c16d86a04dd79bfcc4f2950eec9634b30ce5370f\"]";

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const params = try EthGetTransactionReceipt.Params.jsonParseFromValue(allocator, parsed.value, .{});

    _ = params;
}
