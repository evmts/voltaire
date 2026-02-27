const std = @import("std");
const testing = std.testing;

/// TransactionResponse for JSON-RPC transaction queries.
/// Wraps primitives.Transaction with block context metadata.
pub const TransactionResponse = union(enum) {
    legacy: LegacyResponse,
    eip2930: Eip2930Response,
    eip1559: Eip1559Response,
    eip4844: Eip4844Response,
    eip7702: Eip7702Response,

    /// Common metadata fields present in all transaction responses
    pub const Metadata = struct {
        /// Block hash (null for pending)
        block_hash: ?Hash,
        /// Block number (null for pending)
        block_number: ?u64,
        /// Block timestamp (null for pending)
        block_timestamp: ?u64,
        /// Transaction index in block (null for pending)
        transaction_index: ?u64,
        /// Sender address (recovered from signature)
        from: Address,
        /// Transaction hash
        hash: Hash,
    };

    pub const LegacyResponse = struct {
        metadata: Metadata,
        nonce: u64,
        gas_price: u256,
        gas: u64,
        to: ?Address,
        value: u256,
        input: []const u8,
        v: u64,
        r: [32]u8,
        s: [32]u8,
        chain_id: ?u64,
    };

    pub const Eip2930Response = struct {
        metadata: Metadata,
        chain_id: u64,
        nonce: u64,
        gas_price: u256,
        gas: u64,
        to: ?Address,
        value: u256,
        input: []const u8,
        access_list: []const AccessListEntry,
        y_parity: u8,
        r: [32]u8,
        s: [32]u8,
    };

    pub const Eip1559Response = struct {
        metadata: Metadata,
        chain_id: u64,
        nonce: u64,
        max_priority_fee_per_gas: u256,
        max_fee_per_gas: u256,
        gas: u64,
        to: ?Address,
        value: u256,
        input: []const u8,
        access_list: []const AccessListEntry,
        y_parity: u8,
        r: [32]u8,
        s: [32]u8,
    };

    pub const Eip4844Response = struct {
        metadata: Metadata,
        chain_id: u64,
        nonce: u64,
        max_priority_fee_per_gas: u256,
        max_fee_per_gas: u256,
        gas: u64,
        to: Address,
        value: u256,
        input: []const u8,
        access_list: []const AccessListEntry,
        max_fee_per_blob_gas: u256,
        blob_versioned_hashes: []const [32]u8,
        y_parity: u8,
        r: [32]u8,
        s: [32]u8,
    };

    pub const Eip7702Response = struct {
        metadata: Metadata,
        chain_id: u64,
        nonce: u64,
        max_priority_fee_per_gas: u256,
        max_fee_per_gas: u256,
        gas: u64,
        to: ?Address,
        value: u256,
        input: []const u8,
        access_list: []const AccessListEntry,
        authorization_list: []const AuthorizationEntry,
        y_parity: u8,
        r: [32]u8,
        s: [32]u8,
    };

    pub const AccessListEntry = struct {
        address: Address,
        storage_keys: []const [32]u8,
    };

    pub const AuthorizationEntry = struct {
        chain_id: u64,
        address: Address,
        nonce: u64,
        y_parity: u8,
        r: [32]u8,
        s: [32]u8,
    };

    /// Serialize to JSON-RPC format per execution-apis spec
    pub fn jsonStringify(self: TransactionResponse, jws: *std.json.WriteStream) !void {
        try jws.beginObject();

        // Write type field
        try jws.objectField("type");
        const type_str = switch (self) {
            .legacy => "0x0",
            .eip2930 => "0x1",
            .eip1559 => "0x2",
            .eip4844 => "0x3",
            .eip7702 => "0x4",
        };
        try jws.write(type_str);

        // Write metadata fields
        switch (self) {
            inline else => |tx| {
                try jws.objectField("blockHash");
                if (tx.metadata.block_hash) |bh| {
                    try jws.write(bh);
                } else {
                    try jws.writeNull();
                }

                try jws.objectField("blockNumber");
                if (tx.metadata.block_number) |bn| {
                    try jws.print("\"0x{x}\"", .{bn});
                } else {
                    try jws.writeNull();
                }

                try jws.objectField("blockTimestamp");
                if (tx.metadata.block_timestamp) |bt| {
                    try jws.print("\"0x{x}\"", .{bt});
                } else {
                    try jws.writeNull();
                }

                try jws.objectField("from");
                try jws.write(tx.metadata.from);

                try jws.objectField("hash");
                try jws.write(tx.metadata.hash);

                try jws.objectField("transactionIndex");
                if (tx.metadata.transaction_index) |ti| {
                    try jws.print("\"0x{x}\"", .{ti});
                } else {
                    try jws.writeNull();
                }
            },
        }

        // Write transaction-specific fields
        switch (self) {
            .legacy => |tx| {
                try jws.objectField("nonce");
                try jws.print("\"0x{x}\"", .{tx.nonce});
                try jws.objectField("gasPrice");
                try jws.print("\"0x{x}\"", .{tx.gas_price});
                try jws.objectField("gas");
                try jws.print("\"0x{x}\"", .{tx.gas});
                try jws.objectField("to");
                if (tx.to) |to_addr| {
                    try jws.write(to_addr);
                } else {
                    try jws.writeNull();
                }
                try jws.objectField("value");
                try jws.print("\"0x{x}\"", .{tx.value});
                try jws.objectField("input");
                try writeHexData(jws, tx.input);
                try jws.objectField("v");
                try jws.print("\"0x{x}\"", .{tx.v});
                try jws.objectField("r");
                try writeHexBytes32(jws, &tx.r);
                try jws.objectField("s");
                try writeHexBytes32(jws, &tx.s);
                if (tx.chain_id) |cid| {
                    try jws.objectField("chainId");
                    try jws.print("\"0x{x}\"", .{cid});
                }
            },
            .eip2930 => |tx| {
                try jws.objectField("chainId");
                try jws.print("\"0x{x}\"", .{tx.chain_id});
                try jws.objectField("nonce");
                try jws.print("\"0x{x}\"", .{tx.nonce});
                try jws.objectField("gasPrice");
                try jws.print("\"0x{x}\"", .{tx.gas_price});
                try jws.objectField("gas");
                try jws.print("\"0x{x}\"", .{tx.gas});
                try jws.objectField("to");
                if (tx.to) |to_addr| {
                    try jws.write(to_addr);
                } else {
                    try jws.writeNull();
                }
                try jws.objectField("value");
                try jws.print("\"0x{x}\"", .{tx.value});
                try jws.objectField("input");
                try writeHexData(jws, tx.input);
                try jws.objectField("accessList");
                try writeAccessList(jws, tx.access_list);
                try jws.objectField("yParity");
                try jws.print("\"0x{x}\"", .{tx.y_parity});
                try jws.objectField("v");
                try jws.print("\"0x{x}\"", .{tx.y_parity}); // v = yParity for typed txs
                try jws.objectField("r");
                try writeHexBytes32(jws, &tx.r);
                try jws.objectField("s");
                try writeHexBytes32(jws, &tx.s);
            },
            .eip1559 => |tx| {
                try jws.objectField("chainId");
                try jws.print("\"0x{x}\"", .{tx.chain_id});
                try jws.objectField("nonce");
                try jws.print("\"0x{x}\"", .{tx.nonce});
                try jws.objectField("maxPriorityFeePerGas");
                try jws.print("\"0x{x}\"", .{tx.max_priority_fee_per_gas});
                try jws.objectField("maxFeePerGas");
                try jws.print("\"0x{x}\"", .{tx.max_fee_per_gas});
                try jws.objectField("gas");
                try jws.print("\"0x{x}\"", .{tx.gas});
                try jws.objectField("to");
                if (tx.to) |to_addr| {
                    try jws.write(to_addr);
                } else {
                    try jws.writeNull();
                }
                try jws.objectField("value");
                try jws.print("\"0x{x}\"", .{tx.value});
                try jws.objectField("input");
                try writeHexData(jws, tx.input);
                try jws.objectField("accessList");
                try writeAccessList(jws, tx.access_list);
                try jws.objectField("yParity");
                try jws.print("\"0x{x}\"", .{tx.y_parity});
                try jws.objectField("v");
                try jws.print("\"0x{x}\"", .{tx.y_parity});
                try jws.objectField("r");
                try writeHexBytes32(jws, &tx.r);
                try jws.objectField("s");
                try writeHexBytes32(jws, &tx.s);
            },
            .eip4844 => |tx| {
                try jws.objectField("chainId");
                try jws.print("\"0x{x}\"", .{tx.chain_id});
                try jws.objectField("nonce");
                try jws.print("\"0x{x}\"", .{tx.nonce});
                try jws.objectField("maxPriorityFeePerGas");
                try jws.print("\"0x{x}\"", .{tx.max_priority_fee_per_gas});
                try jws.objectField("maxFeePerGas");
                try jws.print("\"0x{x}\"", .{tx.max_fee_per_gas});
                try jws.objectField("gas");
                try jws.print("\"0x{x}\"", .{tx.gas});
                try jws.objectField("to");
                try jws.write(tx.to);
                try jws.objectField("value");
                try jws.print("\"0x{x}\"", .{tx.value});
                try jws.objectField("input");
                try writeHexData(jws, tx.input);
                try jws.objectField("accessList");
                try writeAccessList(jws, tx.access_list);
                try jws.objectField("maxFeePerBlobGas");
                try jws.print("\"0x{x}\"", .{tx.max_fee_per_blob_gas});
                try jws.objectField("blobVersionedHashes");
                try writeBlobVersionedHashes(jws, tx.blob_versioned_hashes);
                try jws.objectField("yParity");
                try jws.print("\"0x{x}\"", .{tx.y_parity});
                try jws.objectField("v");
                try jws.print("\"0x{x}\"", .{tx.y_parity});
                try jws.objectField("r");
                try writeHexBytes32(jws, &tx.r);
                try jws.objectField("s");
                try writeHexBytes32(jws, &tx.s);
            },
            .eip7702 => |tx| {
                try jws.objectField("chainId");
                try jws.print("\"0x{x}\"", .{tx.chain_id});
                try jws.objectField("nonce");
                try jws.print("\"0x{x}\"", .{tx.nonce});
                try jws.objectField("maxPriorityFeePerGas");
                try jws.print("\"0x{x}\"", .{tx.max_priority_fee_per_gas});
                try jws.objectField("maxFeePerGas");
                try jws.print("\"0x{x}\"", .{tx.max_fee_per_gas});
                try jws.objectField("gas");
                try jws.print("\"0x{x}\"", .{tx.gas});
                try jws.objectField("to");
                if (tx.to) |to_addr| {
                    try jws.write(to_addr);
                } else {
                    try jws.writeNull();
                }
                try jws.objectField("value");
                try jws.print("\"0x{x}\"", .{tx.value});
                try jws.objectField("input");
                try writeHexData(jws, tx.input);
                try jws.objectField("accessList");
                try writeAccessList(jws, tx.access_list);
                try jws.objectField("authorizationList");
                try writeAuthorizationList(jws, tx.authorization_list);
                try jws.objectField("yParity");
                try jws.print("\"0x{x}\"", .{tx.y_parity});
                try jws.objectField("v");
                try jws.print("\"0x{x}\"", .{tx.y_parity});
                try jws.objectField("r");
                try writeHexBytes32(jws, &tx.r);
                try jws.objectField("s");
                try writeHexBytes32(jws, &tx.s);
            },
        }

        try jws.endObject();
    }

    fn writeHexData(jws: *std.json.WriteStream, data: []const u8) !void {
        if (data.len == 0) {
            try jws.write("0x");
            return;
        }
        var buf = try std.ArrayList(u8).initCapacity(jws.allocator, 2 + data.len * 2);
        defer buf.deinit();
        try buf.appendSlice("0x");
        try buf.appendSlice(try std.fmt.allocPrint(jws.allocator, "{s}", .{std.fmt.fmtSliceHexLower(data)}));
        try jws.write(buf.items);
    }

    fn writeHexBytes32(jws: *std.json.WriteStream, bytes: *const [32]u8) !void {
        var buf: [66]u8 = undefined;
        buf[0] = '0';
        buf[1] = 'x';
        const hex = std.fmt.bytesToHex(bytes, .lower);
        @memcpy(buf[2..], &hex);
        try jws.write(&buf);
    }

    fn writeAccessList(jws: *std.json.WriteStream, list: []const AccessListEntry) !void {
        try jws.beginArray();
        for (list) |entry| {
            try jws.beginObject();
            try jws.objectField("address");
            try jws.write(entry.address);
            try jws.objectField("storageKeys");
            try jws.beginArray();
            for (entry.storage_keys) |key| {
                var buf: [66]u8 = undefined;
                buf[0] = '0';
                buf[1] = 'x';
                const hex = std.fmt.bytesToHex(&key, .lower);
                @memcpy(buf[2..], &hex);
                try jws.write(&buf);
            }
            try jws.endArray();
            try jws.endObject();
        }
        try jws.endArray();
    }

    fn writeBlobVersionedHashes(jws: *std.json.WriteStream, hashes: []const [32]u8) !void {
        try jws.beginArray();
        for (hashes) |h| {
            var buf: [66]u8 = undefined;
            buf[0] = '0';
            buf[1] = 'x';
            const hex = std.fmt.bytesToHex(&h, .lower);
            @memcpy(buf[2..], &hex);
            try jws.write(&buf);
        }
        try jws.endArray();
    }

    fn writeAuthorizationList(jws: *std.json.WriteStream, list: []const AuthorizationEntry) !void {
        try jws.beginArray();
        for (list) |auth| {
            try jws.beginObject();
            try jws.objectField("chainId");
            try jws.print("\"0x{x}\"", .{auth.chain_id});
            try jws.objectField("address");
            try jws.write(auth.address);
            try jws.objectField("nonce");
            try jws.print("\"0x{x}\"", .{auth.nonce});
            try jws.objectField("yParity");
            try jws.print("\"0x{x}\"", .{auth.y_parity});
            try jws.objectField("r");
            try writeHexBytes32(jws, &auth.r);
            try jws.objectField("s");
            try writeHexBytes32(jws, &auth.s);
            try jws.endObject();
        }
        try jws.endArray();
    }
};

// Type aliases to match the rest of the codebase
const Address = @import("Address.zig").Address;
const Hash = @import("Hash.zig").Hash;

// Tests

test "TransactionResponse can represent legacy transaction" {
    const metadata = TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x0d} ** 32 },
    };

    const tx = TransactionResponse{
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

    try testing.expectEqual(TransactionResponse.legacy, std.meta.activeTag(tx));
}

test "TransactionResponse can represent EIP-2930 transaction" {
    const metadata = TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0xd8} ** 32 },
    };

    const access_list = [_]TransactionResponse.AccessListEntry{};

    const tx = TransactionResponse{
        .eip2930 = .{
            .metadata = metadata,
            .chain_id = 1,
            .nonce = 0x4e,
            .gas_price = 1,
            .gas = 0x186a0,
            .to = .{ .bytes = [_]u8{0x7d} ** 20 },
            .value = 2,
            .input = &[_]u8{0x0e},
            .access_list = &access_list,
            .y_parity = 1,
            .r = [_]u8{0x6e} ** 32,
            .s = [_]u8{0x3f} ** 32,
        },
    };

    try testing.expectEqual(TransactionResponse.eip2930, std.meta.activeTag(tx));
}

test "TransactionResponse can represent EIP-1559 transaction" {
    const metadata = TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0xc7} ** 32 },
    };

    const access_list = [_]TransactionResponse.AccessListEntry{};

    const tx = TransactionResponse{
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

    try testing.expectEqual(TransactionResponse.eip1559, std.meta.activeTag(tx));
}

test "TransactionResponse can represent EIP-4844 transaction" {
    const metadata = TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x6b} ** 32 },
    };

    const access_list = [_]TransactionResponse.AccessListEntry{};
    const blob_hashes = [_][32]u8{[_]u8{0x01} ++ [_]u8{0x5a} ++ [_]u8{0xab} ** 30};

    const tx = TransactionResponse{
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

    try testing.expectEqual(TransactionResponse.eip4844, std.meta.activeTag(tx));
}

test "TransactionResponse can represent EIP-7702 transaction" {
    const metadata = TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x16} ** 32 },
    };

    const access_list = [_]TransactionResponse.AccessListEntry{};
    const auth_list = [_]TransactionResponse.AuthorizationEntry{
        .{
            .chain_id = 1,
            .address = .{ .bytes = [_]u8{0x58} ** 20 },
            .nonce = 0,
            .y_parity = 1,
            .r = [_]u8{0xec} ** 32,
            .s = [_]u8{0x1d} ** 32,
        },
    };

    const tx = TransactionResponse{
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

    try testing.expectEqual(TransactionResponse.eip7702, std.meta.activeTag(tx));
}

test "TransactionResponse with block metadata (mined tx)" {
    const block_hash: [32]u8 = [_]u8{0x55} ** 32;
    const metadata = TransactionResponse.Metadata{
        .block_hash = .{ .bytes = block_hash },
        .block_number = 2,
        .block_timestamp = 0x14,
        .transaction_index = 3,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x0d} ** 32 },
    };

    const tx = TransactionResponse{
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

    try testing.expectEqual(@as(?u64, 2), tx.legacy.metadata.block_number);
    try testing.expectEqual(@as(?u64, 3), tx.legacy.metadata.transaction_index);
}

test "TransactionResponse without block metadata (pending tx)" {
    const metadata = TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x0d} ** 32 },
    };

    const tx = TransactionResponse{
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

    try testing.expectEqual(@as(?u64, null), tx.legacy.metadata.block_number);
    try testing.expectEqual(@as(?u64, null), tx.legacy.metadata.transaction_index);
}

test "TransactionResponse jsonStringify outputs correct RPC format for legacy" {
    const allocator = testing.allocator;

    const block_hash: [32]u8 = [_]u8{0x55} ** 32;
    const metadata = TransactionResponse.Metadata{
        .block_hash = .{ .bytes = block_hash },
        .block_number = 2,
        .block_timestamp = 0x14,
        .transaction_index = 3,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x0d} ** 32 },
    };

    const tx = TransactionResponse{
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

    var buf = std.ArrayList(u8).init(allocator, .{});
    defer buf.deinit();

    try std.json.stringify(tx, .{}, buf.writer());

    const json = buf.items;
    try testing.expect(std.mem.indexOf(u8, json, "\"type\":\"0x0\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"blockHash\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"blockNumber\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"from\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"v\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"r\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"s\"") != null);
}

test "TransactionResponse jsonStringify outputs correct RPC format for EIP-1559" {
    const allocator = testing.allocator;

    const block_hash: [32]u8 = [_]u8{0x15} ** 32;
    const metadata = TransactionResponse.Metadata{
        .block_hash = .{ .bytes = block_hash },
        .block_number = 0x1b,
        .block_timestamp = 0x10e,
        .transaction_index = 0,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0xc7} ** 32 },
    };

    const access_list = [_]TransactionResponse.AccessListEntry{};

    const tx = TransactionResponse{
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

    var buf = std.ArrayList(u8).init(allocator, .{});
    defer buf.deinit();

    try std.json.stringify(tx, .{}, buf.writer());

    const json = buf.items;
    try testing.expect(std.mem.indexOf(u8, json, "\"type\":\"0x2\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"maxFeePerGas\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"maxPriorityFeePerGas\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"yParity\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"accessList\"") != null);
}

test "TransactionResponse jsonStringify outputs correct RPC format for EIP-4844" {
    const allocator = testing.allocator;

    const block_hash: [32]u8 = [_]u8{0x60} ** 32;
    const metadata = TransactionResponse.Metadata{
        .block_hash = .{ .bytes = block_hash },
        .block_number = 0x2a,
        .block_timestamp = 0x1a4,
        .transaction_index = 0,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x6b} ** 32 },
    };

    const access_list = [_]TransactionResponse.AccessListEntry{};
    const blob_hashes = [_][32]u8{[_]u8{0x01} ++ [_]u8{0x5a} ++ [_]u8{0xab} ** 30};

    const tx = TransactionResponse{
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

    var buf = std.ArrayList(u8).init(allocator, .{});
    defer buf.deinit();

    try std.json.stringify(tx, .{}, buf.writer());

    const json = buf.items;
    try testing.expect(std.mem.indexOf(u8, json, "\"type\":\"0x3\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"maxFeePerBlobGas\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"blobVersionedHashes\"") != null);
}

test "TransactionResponse jsonStringify outputs correct RPC format for EIP-7702" {
    const allocator = testing.allocator;

    const block_hash: [32]u8 = [_]u8{0xe2} ** 32;
    const metadata = TransactionResponse.Metadata{
        .block_hash = .{ .bytes = block_hash },
        .block_number = 0x2d,
        .block_timestamp = 0x1c2,
        .transaction_index = 1,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x16} ** 32 },
    };

    const access_list = [_]TransactionResponse.AccessListEntry{};
    const auth_list = [_]TransactionResponse.AuthorizationEntry{
        .{
            .chain_id = 1,
            .address = .{ .bytes = [_]u8{0x58} ** 20 },
            .nonce = 0,
            .y_parity = 1,
            .r = [_]u8{0xec} ** 32,
            .s = [_]u8{0x1d} ** 32,
        },
    };

    const tx = TransactionResponse{
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

    var buf = std.ArrayList(u8).init(allocator, .{});
    defer buf.deinit();

    try std.json.stringify(tx, .{}, buf.writer());

    const json = buf.items;
    try testing.expect(std.mem.indexOf(u8, json, "\"type\":\"0x4\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"authorizationList\"") != null);
}

test "TransactionResponse jsonStringify includes accessList for typed txs" {
    const allocator = testing.allocator;

    const metadata = TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0xd8} ** 32 },
    };

    const storage_key = [_]u8{0x00} ** 32;
    const access_list = [_]TransactionResponse.AccessListEntry{
        .{
            .address = .{ .bytes = [_]u8{0x7d} ** 20 },
            .storage_keys = &[_][32]u8{storage_key},
        },
    };

    const tx = TransactionResponse{
        .eip2930 = .{
            .metadata = metadata,
            .chain_id = 1,
            .nonce = 0x4e,
            .gas_price = 1,
            .gas = 0x186a0,
            .to = .{ .bytes = [_]u8{0x7d} ** 20 },
            .value = 2,
            .input = &[_]u8{0x0e},
            .access_list = &access_list,
            .y_parity = 1,
            .r = [_]u8{0x6e} ** 32,
            .s = [_]u8{0x3f} ** 32,
        },
    };

    var buf = std.ArrayList(u8).init(allocator, .{});
    defer buf.deinit();

    try std.json.stringify(tx, .{}, buf.writer());

    const json = buf.items;
    try testing.expect(std.mem.indexOf(u8, json, "\"accessList\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"address\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"storageKeys\"") != null);
}

test "TransactionResponse jsonStringify includes blob fields for EIP-4844" {
    const allocator = testing.allocator;

    const metadata = TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x6b} ** 32 },
    };

    const access_list = [_]TransactionResponse.AccessListEntry{};
    const blob_hashes = [_][32]u8{
        [_]u8{0x01} ++ [_]u8{0x5a} ++ [_]u8{0x4c} ** 29,
        [_]u8{0x02} ++ [_]u8{0xab} ++ [_]u8{0xde} ** 29,
    };

    const tx = TransactionResponse{
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

    var buf = std.ArrayList(u8).init(allocator, .{});
    defer buf.deinit();

    try std.json.stringify(tx, .{}, buf.writer());

    const json = buf.items;
    try testing.expect(std.mem.indexOf(u8, json, "\"maxFeePerBlobGas\":\"0x20000\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"blobVersionedHashes\"") != null);
}

test "TransactionResponse jsonStringify includes authorizationList for EIP-7702" {
    const allocator = testing.allocator;

    const metadata = TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x16} ** 32 },
    };

    const access_list = [_]TransactionResponse.AccessListEntry{};
    const auth_list = [_]TransactionResponse.AuthorizationEntry{
        .{
            .chain_id = 0xc72dd9d5e883e,
            .address = .{ .bytes = [_]u8{0x58} ** 20 },
            .nonce = 0,
            .y_parity = 1,
            .r = [_]u8{0xec} ** 32,
            .s = [_]u8{0x1d} ** 32,
        },
    };

    const tx = TransactionResponse{
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

    var buf = std.ArrayList(u8).init(allocator, .{});
    defer buf.deinit();

    try std.json.stringify(tx, .{}, buf.writer());

    const json = buf.items;
    try testing.expect(std.mem.indexOf(u8, json, "\"authorizationList\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"chainId\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"yParity\"") != null);
}

test "TransactionResponse jsonStringify handles pending transaction" {
    const allocator = testing.allocator;

    const metadata = TransactionResponse.Metadata{
        .block_hash = null,
        .block_number = null,
        .block_timestamp = null,
        .transaction_index = null,
        .from = .{ .bytes = [_]u8{0x74} ** 20 },
        .hash = .{ .bytes = [_]u8{0x0d} ** 32 },
    };

    const tx = TransactionResponse{
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

    var buf = std.ArrayList(u8).init(allocator, .{});
    defer buf.deinit();

    try std.json.stringify(tx, .{}, buf.writer());

    const json = buf.items;
    // Pending transactions should have null block metadata
    try testing.expect(std.mem.indexOf(u8, json, "\"blockHash\":null") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"blockNumber\":null") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"transactionIndex\":null") != null);
}
