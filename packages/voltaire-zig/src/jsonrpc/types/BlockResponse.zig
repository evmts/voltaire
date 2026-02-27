const std = @import("std");
const Address = @import("Address.zig").Address;
const Hash = @import("Hash.zig").Hash;
const Quantity = @import("Quantity.zig").Quantity;
const Withdrawal = @import("Withdrawal.zig").Withdrawal;
const TransactionInfo = @import("TransactionInfo.zig").TransactionInfo;

/// BlockResponse for JSON-RPC eth_getBlockByHash/Number responses.
///
/// Per EIP-1474 and execution-apis spec, this includes:
/// - Required fields present in all blocks
/// - Optional fields that depend on the fork (London, Shanghai, Cancun, etc.)
///
/// The transactions field can be either:
/// - An array of transaction hashes (if hydrated=false)
/// - An array of TransactionInfo objects (if hydrated=true)
pub const BlockResponse = struct {
    // Required fields
    hash: Hash,
    parentHash: Hash,
    sha3Uncles: Hash,
    miner: Address,
    stateRoot: Hash,
    transactionsRoot: Hash,
    receiptsRoot: Hash,
    logsBloom: LogsBloom,
    number: Quantity,
    gasLimit: Quantity,
    gasUsed: Quantity,
    timestamp: Quantity,
    extraData: Quantity, // DATA variable bytes
    mixHash: Hash,
    nonce: Nonce, // 8 bytes
    size: Quantity,
    transactions: []const TransactionInfo,
    uncles: []const Hash,

    // Optional fields (by fork)
    difficulty: ?Quantity = null,
    totalDifficulty: ?Quantity = null, // Pre-merge only
    baseFeePerGas: ?Quantity = null, // Post-London/EIP-1559
    withdrawalsRoot: ?Hash = null, // Post-Shanghai/EIP-4895
    withdrawals: ?[]const Withdrawal = null, // Post-Shanghai
    blobGasUsed: ?Quantity = null, // Post-Cancun/EIP-4844
    excessBlobGas: ?Quantity = null, // Post-Cancun
    parentBeaconBlockRoot: ?Hash = null, // Post-Cancun/EIP-4788
    requestsHash: ?Hash = null, // Post-Prague/EIP-7685

    pub fn jsonStringify(self: BlockResponse, jws: *std.json.Stringify) !void {
        try jws.beginObject();

        // Required fields
        try jws.objectField("hash");
        try jws.write(self.hash);
        try jws.objectField("parentHash");
        try jws.write(self.parentHash);
        try jws.objectField("sha3Uncles");
        try jws.write(self.sha3Uncles);
        try jws.objectField("miner");
        try jws.write(self.miner);
        try jws.objectField("stateRoot");
        try jws.write(self.stateRoot);
        try jws.objectField("transactionsRoot");
        try jws.write(self.transactionsRoot);
        try jws.objectField("receiptsRoot");
        try jws.write(self.receiptsRoot);
        try jws.objectField("logsBloom");
        try jws.write(self.logsBloom);
        try jws.objectField("number");
        try jws.write(self.number);
        try jws.objectField("gasLimit");
        try jws.write(self.gasLimit);
        try jws.objectField("gasUsed");
        try jws.write(self.gasUsed);
        try jws.objectField("timestamp");
        try jws.write(self.timestamp);
        try jws.objectField("extraData");
        try jws.write(self.extraData);
        try jws.objectField("mixHash");
        try jws.write(self.mixHash);
        try jws.objectField("nonce");
        try jws.write(self.nonce);
        try jws.objectField("size");
        try jws.write(self.size);
        try jws.objectField("transactions");
        try jws.beginArray();
        for (self.transactions) |tx| {
            try jws.write(tx);
        }
        try jws.endArray();
        try jws.objectField("uncles");
        try jws.beginArray();
        for (self.uncles) |uncle| {
            try jws.write(uncle);
        }
        try jws.endArray();

        // Optional fields - only serialize if present
        if (self.difficulty) |d| {
            try jws.objectField("difficulty");
            try jws.write(d);
        }
        if (self.totalDifficulty) |td| {
            try jws.objectField("totalDifficulty");
            try jws.write(td);
        }
        if (self.baseFeePerGas) |bfpg| {
            try jws.objectField("baseFeePerGas");
            try jws.write(bfpg);
        }
        if (self.withdrawalsRoot) |wr| {
            try jws.objectField("withdrawalsRoot");
            try jws.write(wr);
        }
        if (self.withdrawals) |w| {
            try jws.objectField("withdrawals");
            try jws.beginArray();
            for (w) |withdrawal| {
                try jws.write(withdrawal);
            }
            try jws.endArray();
        }
        if (self.blobGasUsed) |bgu| {
            try jws.objectField("blobGasUsed");
            try jws.write(bgu);
        }
        if (self.excessBlobGas) |ebg| {
            try jws.objectField("excessBlobGas");
            try jws.write(ebg);
        }
        if (self.parentBeaconBlockRoot) |pbbr| {
            try jws.objectField("parentBeaconBlockRoot");
            try jws.write(pbbr);
        }
        if (self.requestsHash) |rh| {
            try jws.objectField("requestsHash");
            try jws.write(rh);
        }

        try jws.endObject();
    }
};

/// LogsBloom is a 256-byte bloom filter
pub const LogsBloom = struct {
    bytes: [256]u8,

    pub fn jsonStringify(self: LogsBloom, jws: *std.json.Stringify) !void {
        var buf: [518]u8 = undefined; // 0x + 512 hex chars + null
        buf[0] = '0';
        buf[1] = 'x';
        const hex = std.fmt.bytesToHex(&self.bytes, .lower);
        @memcpy(buf[2..], &hex);
        try jws.print("\"{s}\"", .{buf[0..514]});
    }

    pub fn jsonParseFromValue(_: std.mem.Allocator, source: std.json.Value, _: std.json.ParseOptions) !LogsBloom {
        switch (source) {
            .string => |s| {
                if (s.len != 514 or s[0] != '0' or (s[1] != 'x' and s[1] != 'X'))
                    return error.InvalidLogsBloom;
                var out: [256]u8 = undefined;
                _ = std.fmt.hexToBytes(&out, s[2..]) catch return error.InvalidLogsBloom;
                return .{ .bytes = out };
            },
            else => return error.InvalidLogsBloom,
        }
    }
};

/// Nonce is an 8-byte PoW nonce
pub const Nonce = struct {
    bytes: [8]u8,

    pub fn jsonStringify(self: Nonce, jws: *std.json.Stringify) !void {
        var buf: [18]u8 = undefined; // 0x + 16 hex chars
        buf[0] = '0';
        buf[1] = 'x';
        const hex = std.fmt.bytesToHex(&self.bytes, .lower);
        @memcpy(buf[2..], &hex);
        try jws.print("\"{s}\"", .{buf[0..18]});
    }

    pub fn jsonParseFromValue(_: std.mem.Allocator, source: std.json.Value, _: std.json.ParseOptions) !Nonce {
        switch (source) {
            .string => |s| {
                if (s.len != 18 or s[0] != '0' or (s[1] != 'x' and s[1] != 'X'))
                    return error.InvalidNonce;
                var out: [8]u8 = undefined;
                _ = std.fmt.hexToBytes(&out, s[2..]) catch return error.InvalidNonce;
                return .{ .bytes = out };
            },
            else => return error.InvalidNonce,
        }
    }
};
