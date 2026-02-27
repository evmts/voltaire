const std = @import("std");
const testing = std.testing;
const types = @import("../../types.zig");
const eth_getTransactionByHash = @import("eth_getTransactionByHash.zig");

// Tests for eth_getTransactionByHash Result type

test "Result type accepts TransactionResponse" {
    const metadata = types.TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x0d} ** 32 },
    };

    const tx = types.TransactionResponse{
        .legacy = .{
            .metadata = metadata,
            .nonce = 7,
            .gas_price = 1,
            .gas = 0x5208,
            .to = .{ .bytes = [_]u8{0xed} ** 20 },
            .value = 1,
            .input = &[_]u8{},
            .v = 0x1b,
            .r = [_]u8{0xfa} ** 32,
            .s = [_]u8{0x60} ** 32,
            .chain_id = null,
        },
    };

    const result = eth_getTransactionByHash.Result{
        .value = tx,
    };

    try testing.expect(result.value != null);
    try testing.expectEqual(types.TransactionResponse.legacy, std.meta.activeTag(result.value.?));
}

test "Result type accepts null (not found)" {
    const result = eth_getTransactionByHash.Result{
        .value = null,
    };

    try testing.expect(result.value == null);
}

test "jsonStringify serializes TransactionResponse correctly" {
    const allocator = testing.allocator;

    const block_hash: [32]u8 = [_]u8{0x55} ** 32;
    const metadata = types.TransactionResponse.Metadata{
        .block_hash = .{ .bytes = block_hash },
        .block_number = 2,
        .block_timestamp = 0x14,
        .transaction_index = 3,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x0d} ** 32 },
    };

    const tx = types.TransactionResponse{
        .legacy = .{
            .metadata = metadata,
            .nonce = 7,
            .gas_price = 1,
            .gas = 0x5208,
            .to = .{ .bytes = [_]u8{0xed} ** 20 },
            .value = 1,
            .input = &[_]u8{},
            .v = 0x1b,
            .r = [_]u8{0xfa} ** 32,
            .s = [_]u8{0x60} ** 32,
            .chain_id = null,
        },
    };

    const result = eth_getTransactionByHash.Result{
        .value = tx,
    };

    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit();

    try std.json.stringify(result, .{}, buf.writer());

    const json = buf.items;
    try testing.expect(std.mem.indexOf(u8, json, "\"type\":\"0x0\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"blockHash\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"from\"") != null);
}

test "jsonStringify serializes null correctly" {
    const allocator = testing.allocator;

    const result = eth_getTransactionByHash.Result{
        .value = null,
    };

    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit();

    try std.json.stringify(result, .{}, buf.writer());

    const json = buf.items;
    try testing.expect(std.mem.eql(u8, json, "null"));
}

test "Result can represent EIP-1559 transaction" {
    const metadata = types.TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0xc7} ** 32 },
    };

    const access_list = [_]types.TransactionResponse.AccessListEntry{};

    const tx = types.TransactionResponse{
        .eip1559 = .{
            .metadata = metadata,
            .chain_id = 1,
            .nonce = 0x59,
            .max_priority_fee_per_gas = 1,
            .max_fee_per_gas = 0x3b9aca01,
            .gas = 0x186a0,
            .to = .{ .bytes = [_]u8{0x7d} ** 20 },
            .value = 2,
            .input = &[_]u8{0x1e},
            .access_list = &access_list,
            .y_parity = 0,
            .r = [_]u8{0x42} ** 32,
            .s = [_]u8{0x43} ** 32,
        },
    };

    const result = eth_getTransactionByHash.Result{
        .value = tx,
    };

    try testing.expect(result.value != null);
    try testing.expectEqual(types.TransactionResponse.eip1559, std.meta.activeTag(result.value.?));
}

test "Result can represent EIP-4844 blob transaction" {
    const metadata = types.TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x6b} ** 32 },
    };

    const access_list = [_]types.TransactionResponse.AccessListEntry{};
    const blob_hashes = [_][32]u8{[_]u8{0x01} ++ [_]u8{0x5a} ++ [_]u8{0x4c} ** 29};

    const tx = types.TransactionResponse{
        .eip4844 = .{
            .metadata = metadata,
            .chain_id = 1,
            .nonce = 0x8f,
            .max_priority_fee_per_gas = 1,
            .max_fee_per_gas = 0x822595c,
            .gas = 0x186a0,
            .to = .{ .bytes = [_]u8{0x7d} ** 20 },
            .value = 3,
            .input = &[_]u8{0x29},
            .access_list = &access_list,
            .max_fee_per_blob_gas = 0x20000,
            .blob_versioned_hashes = &blob_hashes,
            .y_parity = 1,
            .r = [_]u8{0xf8} ** 32,
            .s = [_]u8{0x34} ** 32,
        },
    };

    const result = eth_getTransactionByHash.Result{
        .value = tx,
    };

    try testing.expect(result.value != null);
    try testing.expectEqual(types.TransactionResponse.eip4844, std.meta.activeTag(result.value.?));
}

test "Result can represent EIP-7702 set code transaction" {
    const metadata = types.TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x16} ** 32 },
    };

    const access_list = [_]types.TransactionResponse.AccessListEntry{};
    const auth_list = [_]types.TransactionResponse.AuthorizationEntry{
        .{
            .chain_id = 1,
            .address = .{ .bytes = [_]u8{0x58} ** 20 },
            .nonce = 0,
            .y_parity = 1,
            .r = [_]u8{0xec} ** 32,
            .s = [_]u8{0x1d} ** 32,
        },
    };

    const tx = types.TransactionResponse{
        .eip7702 = .{
            .metadata = metadata,
            .chain_id = 1,
            .nonce = 0x9b,
            .max_priority_fee_per_gas = 1,
            .max_fee_per_gas = 0x5763d65,
            .gas = 0xb3b0,
            .to = .{ .bytes = [_]u8{0x00} ** 20 },
            .value = 0,
            .input = &[_]u8{},
            .access_list = &access_list,
            .authorization_list = &auth_list,
            .y_parity = 1,
            .r = [_]u8{0x8a} ** 32,
            .s = [_]u8{0x2e} ** 32,
        },
    };

    const result = eth_getTransactionByHash.Result{
        .value = tx,
    };

    try testing.expect(result.value != null);
    try testing.expectEqual(types.TransactionResponse.eip7702, std.meta.activeTag(result.value.?));
}

test "Result can represent pending transaction" {
    const metadata = types.TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x0d} ** 32 },
    };

    const tx = types.TransactionResponse{
        .legacy = .{
            .metadata = metadata,
            .nonce = 7,
            .gas_price = 1,
            .gas = 0x5208,
            .to = .{ .bytes = [_]u8{0xed} ** 20 },
            .value = 1,
            .input = &[_]u8{},
            .v = 0x1b,
            .r = [_]u8{0xfa} ** 32,
            .s = [_]u8{0x60} ** 32,
            .chain_id = null,
        },
    };

    const result = eth_getTransactionByHash.Result{
        .value = tx,
    };

    const allocator = testing.allocator;
    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit();

    try std.json.stringify(result, .{}, buf.writer());

    const json = buf.items;
    // Pending transactions should have null block metadata
    try testing.expect(std.mem.indexOf(u8, json, "\"blockHash\":null") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"blockNumber\":null") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"transactionIndex\":null") != null);
}
