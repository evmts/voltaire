const std = @import("std");
const Hash = @import("Hash.zig").Hash;
const Address = @import("Address.zig").Address;
const Quantity = @import("Quantity.zig").Quantity;

pub const Nonce = struct {
    bytes: [8]u8,

    pub fn jsonStringify(self: Nonce, jws: *std.json.Stringify) !void {
        var buf: [18]u8 = undefined;
        buf[0] = '0';
        buf[1] = 'x';
        const hex = std.fmt.bytesToHex(&self.bytes, .lower);
        @memcpy(buf[2..], &hex);
        try jws.print("\"{s}\"", .{buf});
    }
};

pub const Bloom = struct {
    bytes: [256]u8,

    pub fn jsonStringify(self: Bloom, jws: *std.json.Stringify) !void {
        var buf: [514]u8 = undefined;
        buf[0] = '0';
        buf[1] = 'x';
        const hex = std.fmt.bytesToHex(&self.bytes, .lower);
        @memcpy(buf[2..], &hex);
        try jws.print("\"{s}\"", .{buf});
    }
};

pub const LogEntry = struct {
    removed: bool,
    logIndex: ?Quantity = null,
    transactionIndex: ?Quantity = null,
    transactionHash: Hash,
    blockHash: Hash,
    blockNumber: ?Quantity = null,
    address: Address,
    data: Quantity,
    topics: []const Hash,
};

pub const TransactionType = enum {
    legacy,
    eip2930,
    eip1559,
    eip4844,
    eip7702,

    pub fn jsonStringify(self: TransactionType, jws: *std.json.Stringify) !void {
        switch (self) {
            .legacy => try jws.print("\"0x0\"", .{}),
            .eip2930 => try jws.print("\"0x1\"", .{}),
            .eip1559 => try jws.print("\"0x2\"", .{}),
            .eip4844 => try jws.print("\"0x3\"", .{}),
            .eip7702 => try jws.print("\"0x4\"", .{}),
        }
    }
};

pub const AccessListEntry = struct {
    address: Address,
    storageKeys: []const Hash,
};

pub const AuthorizationEntry = struct {
    chainId: Quantity,
    nonce: Quantity,
    address: Address,
    yParity: Quantity,
    r: Quantity,
    s: Quantity,
};

pub const TransactionResponse = struct {
    type: TransactionType = .legacy,
    hash: Hash,
    nonce: Quantity,
    blockHash: Hash,
    blockNumber: Quantity,
    transactionIndex: Quantity,
    from: Address,
    to: ?Address = null,
    value: Quantity,
    gas: Quantity,
    input: Quantity,
    gasPrice: ?Quantity = null,
    maxPriorityFeePerGas: ?Quantity = null,
    maxFeePerGas: ?Quantity = null,
    maxFeePerBlobGas: ?Quantity = null,
    accessList: ?[]const AccessListEntry = null,
    blobVersionedHashes: ?[]const Hash = null,
    chainId: ?Quantity = null,
    authorizationList: ?[]const AuthorizationEntry = null,
    yParity: ?Quantity = null,
    v: ?Quantity = null,
    r: ?Quantity = null,
    s: ?Quantity = null,
};

pub const TransactionInfo = union(enum) {
    hash: Hash,
    full: TransactionResponse,

    pub fn jsonStringify(self: TransactionInfo, jws: *std.json.Stringify) !void {
        switch (self) {
            .hash => |h| try jws.write(h),
            .full => |tx| try jws.write(tx),
        }
    }
};

pub const ReceiptResponse = struct {
    transactionHash: Hash,
    transactionIndex: Quantity,
    blockHash: Hash,
    blockNumber: Quantity,
    from: Address,
    to: ?Address = null,
    cumulativeGasUsed: Quantity,
    gasUsed: Quantity,
    contractAddress: ?Address = null,
    logs: []const LogEntry,
    logsBloom: Bloom,
    status: ?Quantity = null,
    root: ?Hash = null,
    effectiveGasPrice: Quantity,
    type: Quantity,
    blobGasUsed: ?Quantity = null,
    blobGasPrice: ?Quantity = null,
};

pub const Filter = struct {
    value: std.json.Value,

    pub fn jsonStringify(self: Filter, jws: *std.json.Stringify) !void {
        try jws.write(self.value);
    }

    pub fn jsonParseFromValue(_: std.mem.Allocator, source: std.json.Value, _: std.json.ParseOptions) !Filter {
        return .{ .value = source };
    }
};

pub const FilterResults = union(enum) {
    logs: []const LogEntry,
    hashes: []const Hash,

    pub fn jsonStringify(self: FilterResults, jws: *std.json.Stringify) !void {
        switch (self) {
            .logs => |logs| try jws.write(logs),
            .hashes => |hashes| try jws.write(hashes),
        }
    }
};

pub const BlockResponse = struct {
    hash: Hash,
    parentHash: Hash,
    sha3Uncles: Hash,
    miner: Address,
    stateRoot: Hash,
    transactionsRoot: Hash,
    receiptsRoot: Hash,
    logsBloom: Bloom,
    number: Quantity,
    gasLimit: Quantity,
    gasUsed: Quantity,
    timestamp: Quantity,
    extraData: Quantity,
    mixHash: Hash,
    nonce: Nonce,
    size: Quantity,
    transactions: []const TransactionInfo,
    uncles: []const Hash,
    difficulty: ?Quantity = null,
    totalDifficulty: ?Quantity = null,
    baseFeePerGas: ?Quantity = null,
    withdrawalsRoot: ?Hash = null,
    blobGasUsed: ?Quantity = null,
    excessBlobGas: ?Quantity = null,
    parentBeaconBlockRoot: ?Hash = null,
};
