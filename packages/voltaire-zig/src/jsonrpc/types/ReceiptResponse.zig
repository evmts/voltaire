const std = @import("std");
const types = @import("../types.zig");

/// Log entry within a transaction receipt
/// Uses LogEntry type from types.zig for consistency
pub const Log = types.LogEntry;

/// Transaction receipt response per execution-apis ReceiptInfo schema
pub const ReceiptResponse = struct {
    // Required fields
    transactionHash: types.Hash,
    transactionIndex: u64,
    blockHash: types.Hash,
    blockNumber: u64,
    from: types.Address,
    cumulativeGasUsed: u64,
    gasUsed: u64,
    logs: []const Log,
    logsBloom: [256]u8,
    effectiveGasPrice: u64,

    // Optional/nullable fields
    /// Transaction type: 0x0 (legacy), 0x1 (EIP-2930), 0x2 (EIP-1559), 0x3 (EIP-4844), 0x4 (EIP-7702)
    tx_type: ?u8 = null,
    /// Recipient address, null for contract creation
    to: ?types.Address = null,
    /// Contract address created, null if not a deployment
    contractAddress: ?types.Address = null,
    /// EIP-4844: Blob gas used (only for blob transactions)
    blobGasUsed: ?u64 = null,
    /// EIP-4844: Blob gas price (only for blob transactions)
    blobGasPrice: ?u64 = null,
    /// Pre-Byzantium: State root (EIP-658)
    /// Mutually exclusive with `status`
    root: ?types.Hash = null,
    /// Post-Byzantium: 1 = success, 0 = failure (EIP-658)
    /// Mutually exclusive with `root`
    status: ?u8 = null,

    pub fn jsonStringify(self: ReceiptResponse, jws: *std.json.Stringify) !void {
        try jws.beginObject();

        // transactionHash (required)
        try jws.objectField("transactionHash");
        try jws.write(self.transactionHash);

        // transactionIndex (required)
        try jws.objectField("transactionIndex");
        try jws.print("\"0x{x}\"", .{self.transactionIndex});

        // blockHash (required)
        try jws.objectField("blockHash");
        try jws.write(self.blockHash);

        // blockNumber (required)
        try jws.objectField("blockNumber");
        try jws.print("\"0x{x}\"", .{self.blockNumber});

        // from (required)
        try jws.objectField("from");
        try jws.write(self.from);

        // to (optional, can be null for contract creation)
        try jws.objectField("to");
        if (self.to) |to| {
            try jws.write(to);
        } else {
            try jws.write(null);
        }

        // cumulativeGasUsed (required)
        try jws.objectField("cumulativeGasUsed");
        try jws.print("\"0x{x}\"", .{self.cumulativeGasUsed});

        // gasUsed (required)
        try jws.objectField("gasUsed");
        try jws.print("\"0x{x}\"", .{self.gasUsed});

        // contractAddress (optional)
        try jws.objectField("contractAddress");
        if (self.contractAddress) |addr| {
            try jws.write(addr);
        } else {
            try jws.write(null);
        }

        // logs (required)
        try jws.objectField("logs");
        try jws.write(self.logs);

        // logsBloom (required) - 256 bytes as hex string
        try jws.objectField("logsBloom");
        {
            var buf: [514]u8 = undefined; // 2 for 0x + 512 for hex
            buf[0] = '0';
            buf[1] = 'x';
            const hex = std.fmt.bytesToHex(&self.logsBloom, .lower);
            @memcpy(buf[2..], &hex);
            try jws.print("\"{s}\"", .{buf});
        }

        // root (optional - pre-Byzantium)
        if (self.root) |r| {
            try jws.objectField("root");
            try jws.write(r);
        }

        // status (optional - post-Byzantium)
        if (self.status) |s| {
            try jws.objectField("status");
            try jws.print("\"0x{x}\"", .{s});
        }

        // effectiveGasPrice (required)
        try jws.objectField("effectiveGasPrice");
        try jws.print("\"0x{x}\"", .{self.effectiveGasPrice});

        // type (optional)
        if (self.tx_type) |t| {
            try jws.objectField("type");
            try jws.print("\"0x{x}\"", .{t});
        }

        // blobGasUsed (optional - EIP-4844)
        if (self.blobGasUsed) |bgu| {
            try jws.objectField("blobGasUsed");
            try jws.print("\"0x{x}\"", .{bgu});
        }

        // blobGasPrice (optional - EIP-4844)
        if (self.blobGasPrice) |bgp| {
            try jws.objectField("blobGasPrice");
            try jws.print("\"0x{x}\"", .{bgp});
        }

        try jws.endObject();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !ReceiptResponse {
        if (source != .object) return error.UnexpectedToken;

        var receipt: ReceiptResponse = undefined;

        // transactionHash (required)
        if (source.object.get("transactionHash")) |th| {
            receipt.transactionHash = try std.json.innerParseFromValue(types.Hash, allocator, th, options);
        } else {
            return error.MissingField;
        }

        // transactionIndex (required)
        if (source.object.get("transactionIndex")) |ti| {
            receipt.transactionIndex = try parseQuantity(ti);
        } else {
            return error.MissingField;
        }

        // blockHash (required)
        if (source.object.get("blockHash")) |bh| {
            receipt.blockHash = try std.json.innerParseFromValue(types.Hash, allocator, bh, options);
        } else {
            return error.MissingField;
        }

        // blockNumber (required)
        if (source.object.get("blockNumber")) |bn| {
            receipt.blockNumber = try parseQuantity(bn);
        } else {
            return error.MissingField;
        }

        // from (required)
        if (source.object.get("from")) |f| {
            receipt.from = try std.json.innerParseFromValue(types.Address, allocator, f, options);
        } else {
            return error.MissingField;
        }

        // to (optional, can be null for contract creation)
        if (source.object.get("to")) |t| {
            if (t == .null) {
                receipt.to = null;
            } else {
                receipt.to = try std.json.innerParseFromValue(types.Address, allocator, t, options);
            }
        } else {
            receipt.to = null;
        }

        // cumulativeGasUsed (required)
        if (source.object.get("cumulativeGasUsed")) |cgu| {
            receipt.cumulativeGasUsed = try parseQuantity(cgu);
        } else {
            return error.MissingField;
        }

        // gasUsed (required)
        if (source.object.get("gasUsed")) |gu| {
            receipt.gasUsed = try parseQuantity(gu);
        } else {
            return error.MissingField;
        }

        // contractAddress (optional)
        if (source.object.get("contractAddress")) |ca| {
            if (ca == .null) {
                receipt.contractAddress = null;
            } else {
                receipt.contractAddress = try std.json.innerParseFromValue(types.Address, allocator, ca, options);
            }
        } else {
            receipt.contractAddress = null;
        }

        // logs (required)
        if (source.object.get("logs")) |l| {
            receipt.logs = try std.json.innerParseFromValue([]const Log, allocator, l, options);
        } else {
            receipt.logs = &[_]Log{};
        }

        // logsBloom (required)
        if (source.object.get("logsBloom")) |lb| {
            receipt.logsBloom = try parseLogsBloom(lb);
        } else {
            return error.MissingField;
        }

        // root (optional - pre-Byzantium)
        if (source.object.get("root")) |r| {
            receipt.root = try std.json.innerParseFromValue(types.Hash, allocator, r, options);
        } else {
            receipt.root = null;
        }

        // status (optional - post-Byzantium)
        if (source.object.get("status")) |s| {
            receipt.status = @intCast(try parseQuantity(s));
        } else {
            receipt.status = null;
        }

        // effectiveGasPrice (required)
        if (source.object.get("effectiveGasPrice")) |egp| {
            receipt.effectiveGasPrice = try parseQuantity(egp);
        } else {
            return error.MissingField;
        }

        // type (optional)
        if (source.object.get("type")) |t| {
            receipt.tx_type = @intCast(try parseQuantity(t));
        } else {
            receipt.tx_type = null;
        }

        // blobGasUsed (optional - EIP-4844)
        if (source.object.get("blobGasUsed")) |bgu| {
            receipt.blobGasUsed = try parseQuantity(bgu);
        } else {
            receipt.blobGasUsed = null;
        }

        // blobGasPrice (optional - EIP-4844)
        if (source.object.get("blobGasPrice")) |bgp| {
            receipt.blobGasPrice = try parseQuantity(bgp);
        } else {
            receipt.blobGasPrice = null;
        }

        // EIP-658 validation: root and status are mutually exclusive
        if (receipt.root != null and receipt.status != null) {
            return error.UnexpectedToken;
        }

        return receipt;
    }
};

/// Parse a hex quantity string (0x-prefixed) into u64
fn parseQuantity(value: std.json.Value) !u64 {
    switch (value) {
        .string => |s| {
            if (s.len < 3 or s[0] != '0' or (s[1] != 'x' and s[1] != 'X')) {
                return error.InvalidCharacter;
            }
            return std.fmt.parseInt(u64, s[2..], 16) catch return error.InvalidCharacter;
        },
        .integer => |i| {
            if (i < 0) return error.InvalidNumber;
            return @intCast(i);
        },
        else => return error.InvalidCharacter,
    }
}

/// Parse a logsBloom hex string into [256]u8
fn parseLogsBloom(value: std.json.Value) ![256]u8 {
    switch (value) {
        .string => |s| {
            // logsBloom is 256 bytes = 512 hex chars + 0x prefix = 514 chars
            if (s.len != 514 or s[0] != '0' or (s[1] != 'x' and s[1] != 'X')) {
                return error.InvalidCharacter;
            }
            var out: [256]u8 = undefined;
            _ = std.fmt.hexToBytes(&out, s[2..]) catch return error.InvalidCharacter;
            return out;
        },
        else => return error.InvalidCharacter,
    }
}

// ============================================================================
// Tests
// ============================================================================

test "ReceiptResponse: Legacy (Pre-Byzantium)" {
    // Pre-Byzantium receipt has `root` field (state root), no `status` field
    const legacy_json =
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

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, legacy_json, .{});
    defer parsed.deinit();

    const receipt = try ReceiptResponse.jsonParseFromValue(allocator, parsed.value, .{});

    // Verify required fields
    try std.testing.expectEqual(2, receipt.blockNumber);
    try std.testing.expectEqual(3, receipt.transactionIndex);
    try std.testing.expectEqual(0x3d037, receipt.cumulativeGasUsed);
    try std.testing.expectEqual(0x5208, receipt.gasUsed);
    try std.testing.expectEqual(1, receipt.effectiveGasPrice);
    try std.testing.expectEqual(0, receipt.tx_type.?);

    // Verify logs is empty array
    try std.testing.expectEqual(0, receipt.logs.len);

    // Verify root is present (pre-Byzantium)
    try std.testing.expect(receipt.root != null);
    try std.testing.expect(receipt.status == null);

    // Verify optional addresses
    try std.testing.expect(receipt.to != null);
    try std.testing.expect(receipt.contractAddress == null);

    // Verify blob fields are null
    try std.testing.expect(receipt.blobGasUsed == null);
    try std.testing.expect(receipt.blobGasPrice == null);
}

test "ReceiptResponse: EIP-1559 (Post-Byzantium)" {
    // Post-Byzantium receipt has `status` field, no `root` field
    const eip1559_json =
        \\{
        \\  "blockHash": "0x155ed001f7571cb6fa37e5c9c2462b4704ce9cdf53fddc39e9d9f96f92a5233c",
        \\  "blockNumber": "0x1b",
        \\  "contractAddress": null,
        \\  "cumulativeGasUsed": "0xca9c",
        \\  "effectiveGasPrice": "0x3b9aca01",
        \\  "from": "0x7435ed30a8b4aeb0877cef0c6e8cffe834eb865f",
        \\  "gasUsed": "0xca9c",
        \\  "logs": [
        \\    {
        \\      "address": "0x7dcd17433742f4c0ca53122ab541d0ba67fc27df",
        \\      "topics": ["0x0000000000000000000000000000000000000000000000000000000000000001", "0xf4da19d6c17928e683661a52829cf391d3dc26d581152b81ce595a1207944f09"],
        \\      "data": "0x0000000000000000000000000000000000000000000000000000000000000000",
        \\      "blockNumber": "0x1b",
        \\      "transactionHash": "0xc7dba25cdd5aee6ff7d27fe5422a4179f5913c664c3339c8e0440bd1c9cd8de9",
        \\      "transactionIndex": "0x0",
        \\      "blockHash": "0x155ed001f7571cb6fa37e5c9c2462b4704ce9cdf53fddc39e9d9f96f92a5233c",
        \\      "blockTimestamp": "0x10e",
        \\      "logIndex": "0x0",
        \\      "removed": false
        \\    }
        \\  ],
        \\  "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        \\  "status": "0x1",
        \\  "to": "0x7dcd17433742f4c0ca53122ab541d0ba67fc27df",
        \\  "transactionHash": "0xc7dba25cdd5aee6ff7d27fe5422a4179f5913c664c3339c8e0440bd1c9cd8de9",
        \\  "transactionIndex": "0x0",
        \\  "type": "0x2"
        \\}
    ;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, eip1559_json, .{});
    defer parsed.deinit();

    const receipt = try ReceiptResponse.jsonParseFromValue(allocator, parsed.value, .{});

    // Verify required fields
    try std.testing.expectEqual(0x1b, receipt.blockNumber);
    try std.testing.expectEqual(0, receipt.transactionIndex);
    try std.testing.expectEqual(0xca9c, receipt.cumulativeGasUsed);
    try std.testing.expectEqual(0xca9c, receipt.gasUsed);
    try std.testing.expectEqual(0x3b9aca01, receipt.effectiveGasPrice);
    try std.testing.expectEqual(2, receipt.tx_type.?);

    // Verify status is present (post-Byzantium)
    try std.testing.expect(receipt.status != null);
    try std.testing.expectEqual(1, receipt.status.?);
    try std.testing.expect(receipt.root == null);

    // Verify logs
    try std.testing.expectEqual(1, receipt.logs.len);
    const log = receipt.logs[0];
    try std.testing.expectEqual(false, log.removed);
    try std.testing.expectEqual(2, log.topics.len);
}

test "ReceiptResponse: EIP-4844 Blob Tx" {
    // Blob transaction receipt includes blobGasUsed and blobGasPrice
    const blob_tx_json =
        \\{
        \\  "blobGasPrice": "0x1",
        \\  "blobGasUsed": "0x20000",
        \\  "blockHash": "0x60d8d4c8d64367b4436e63f43addb9e3bd99a5a4176b84429fc4f22e27a7ee63",
        \\  "blockNumber": "0x2a",
        \\  "contractAddress": null,
        \\  "cumulativeGasUsed": "0xca9c",
        \\  "effectiveGasPrice": "0x822595c",
        \\  "from": "0x7435ed30a8b4aeb0877cef0c6e8cffe834eb865f",
        \\  "gasUsed": "0xca9c",
        \\  "logs": [],
        \\  "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        \\  "status": "0x1",
        \\  "to": "0x7dcd17433742f4c0ca53122ab541d0ba67fc27df",
        \\  "transactionHash": "0x6bcea0da8e703d3283c8f1124377a63023290cd188de3274d12441e15dc14794",
        \\  "transactionIndex": "0x0",
        \\  "type": "0x3"
        \\}
    ;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, blob_tx_json, .{});
    defer parsed.deinit();

    const receipt = try ReceiptResponse.jsonParseFromValue(allocator, parsed.value, .{});

    // Verify EIP-4844 blob fields
    try std.testing.expect(receipt.blobGasUsed != null);
    try std.testing.expectEqual(0x20000, receipt.blobGasUsed.?);
    try std.testing.expect(receipt.blobGasPrice != null);
    try std.testing.expectEqual(1, receipt.blobGasPrice.?);

    // Verify transaction type
    try std.testing.expectEqual(3, receipt.tx_type.?);

    // Verify status
    try std.testing.expectEqual(1, receipt.status.?);
}

test "ReceiptResponse: Validation Errors - both root and status" {
    // Receipt with both root and status should be rejected per EIP-658
    const invalid_json =
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
        \\  "status": "0x1",
        \\  "to": "0xeda8645ba6948855e3b3cd596bbb07596d59c603",
        \\  "transactionHash": "0x0d6999c0e9e4bec347945593e97bdcdf7c25be08ca1a1efdc520dbe75be985f3",
        \\  "transactionIndex": "0x3",
        \\  "type": "0x0"
        \\}
    ;

    var arena = std.heap.ArenaAllocator.init(std.testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, invalid_json, .{});
    defer parsed.deinit();

    const result = ReceiptResponse.jsonParseFromValue(allocator, parsed.value, .{});
    try std.testing.expectError(error.UnexpectedToken, result);
}
