const std = @import("std");
const primitives = @import("primitives");

pub const EXTRA_DATA_MAX_BYTES: usize = 32;
const DENEB_FIELD_COUNT: usize = 17;

pub const ExecutionPayloadHeader = struct {
    parent_hash: [32]u8,
    fee_recipient: [20]u8,
    state_root: [32]u8,
    receipts_root: [32]u8,
    logs_bloom: [256]u8,
    prev_randao: [32]u8,
    block_number: u64,
    gas_limit: u64,
    gas_used: u64,
    timestamp: u64,
    extra_data: []const u8,
    base_fee_per_gas: u256,
    block_hash: [32]u8,
    transactions_root: [32]u8,
    withdrawals_root: [32]u8,
    blob_gas_used: u64,
    excess_blob_gas: u64,

    pub fn from(
        parent_hash: [32]u8,
        fee_recipient: [20]u8,
        state_root: [32]u8,
        receipts_root: [32]u8,
        logs_bloom: [256]u8,
        prev_randao: [32]u8,
        block_number: u64,
        gas_limit: u64,
        gas_used: u64,
        timestamp: u64,
        extra_data: []const u8,
        base_fee_per_gas: u256,
        block_hash: [32]u8,
        transactions_root: [32]u8,
        withdrawals_root: [32]u8,
        blob_gas_used: u64,
        excess_blob_gas: u64,
    ) !ExecutionPayloadHeader {
        if (extra_data.len > EXTRA_DATA_MAX_BYTES) return error.ExtraDataTooLong;

        return .{
            .parent_hash = parent_hash,
            .fee_recipient = fee_recipient,
            .state_root = state_root,
            .receipts_root = receipts_root,
            .logs_bloom = logs_bloom,
            .prev_randao = prev_randao,
            .block_number = block_number,
            .gas_limit = gas_limit,
            .gas_used = gas_used,
            .timestamp = timestamp,
            .extra_data = extra_data,
            .base_fee_per_gas = base_fee_per_gas,
            .block_hash = block_hash,
            .transactions_root = transactions_root,
            .withdrawals_root = withdrawals_root,
            .blob_gas_used = blob_gas_used,
            .excess_blob_gas = excess_blob_gas,
        };
    }

    pub fn init(
        parent_hash: [32]u8,
        fee_recipient: [20]u8,
        state_root: [32]u8,
        receipts_root: [32]u8,
        logs_bloom: [256]u8,
        prev_randao: [32]u8,
        block_number: u64,
        gas_limit: u64,
        gas_used: u64,
        timestamp: u64,
        extra_data: []const u8,
        base_fee_per_gas: u256,
        block_hash: [32]u8,
        transactions_root: [32]u8,
        withdrawals_root: [32]u8,
        blob_gas_used: u64,
        excess_blob_gas: u64,
    ) !ExecutionPayloadHeader {
        return from(
            parent_hash,
            fee_recipient,
            state_root,
            receipts_root,
            logs_bloom,
            prev_randao,
            block_number,
            gas_limit,
            gas_used,
            timestamp,
            extra_data,
            base_fee_per_gas,
            block_hash,
            transactions_root,
            withdrawals_root,
            blob_gas_used,
            excess_blob_gas,
        );
    }

    pub fn equals(self: ExecutionPayloadHeader, other: ExecutionPayloadHeader) bool {
        return std.mem.eql(u8, self.parent_hash[0..], other.parent_hash[0..]) and
            std.mem.eql(u8, self.fee_recipient[0..], other.fee_recipient[0..]) and
            std.mem.eql(u8, self.state_root[0..], other.state_root[0..]) and
            std.mem.eql(u8, self.receipts_root[0..], other.receipts_root[0..]) and
            std.mem.eql(u8, self.logs_bloom[0..], other.logs_bloom[0..]) and
            std.mem.eql(u8, self.prev_randao[0..], other.prev_randao[0..]) and
            self.block_number == other.block_number and
            self.gas_limit == other.gas_limit and
            self.gas_used == other.gas_used and
            self.timestamp == other.timestamp and
            std.mem.eql(u8, self.extra_data, other.extra_data) and
            self.base_fee_per_gas == other.base_fee_per_gas and
            std.mem.eql(u8, self.block_hash[0..], other.block_hash[0..]) and
            std.mem.eql(u8, self.transactions_root[0..], other.transactions_root[0..]) and
            std.mem.eql(u8, self.withdrawals_root[0..], other.withdrawals_root[0..]) and
            self.blob_gas_used == other.blob_gas_used and
            self.excess_blob_gas == other.excess_blob_gas;
    }

    pub fn blockNumber(self: ExecutionPayloadHeader) u64 {
        return self.block_number;
    }

    pub fn hashTreeRoot(self: ExecutionPayloadHeader, allocator: std.mem.Allocator) ![32]u8 {
        if (self.extra_data.len > EXTRA_DATA_MAX_BYTES) return error.ExtraDataTooLong;

        var field_roots: [DENEB_FIELD_COUNT][32]u8 = undefined;
        field_roots[0] = self.parent_hash;
        field_roots[1] = fixedBytesRoot(self.fee_recipient[0..]);
        field_roots[2] = self.state_root;
        field_roots[3] = self.receipts_root;
        field_roots[4] = try primitives.Ssz.hashTreeRoot(allocator, self.logs_bloom[0..]);
        field_roots[5] = self.prev_randao;
        field_roots[6] = primitives.Ssz.hashTreeRootBasic(u64, self.block_number);
        field_roots[7] = primitives.Ssz.hashTreeRootBasic(u64, self.gas_limit);
        field_roots[8] = primitives.Ssz.hashTreeRootBasic(u64, self.gas_used);
        field_roots[9] = primitives.Ssz.hashTreeRootBasic(u64, self.timestamp);
        field_roots[10] = byteListRoot(self.extra_data);
        field_roots[11] = primitives.Ssz.hashTreeRootBasic(u256, self.base_fee_per_gas);
        field_roots[12] = self.block_hash;
        field_roots[13] = self.transactions_root;
        field_roots[14] = self.withdrawals_root;
        field_roots[15] = primitives.Ssz.hashTreeRootBasic(u64, self.blob_gas_used);
        field_roots[16] = primitives.Ssz.hashTreeRootBasic(u64, self.excess_blob_gas);

        var container_leaves: [DENEB_FIELD_COUNT * 32]u8 = undefined;
        for (field_roots, 0..) |field_root, i| {
            @memcpy(container_leaves[(i * 32)..][0..32], field_root[0..]);
        }

        return primitives.Ssz.hashTreeRoot(allocator, container_leaves[0..]);
    }
};

fn fixedBytesRoot(bytes: []const u8) [32]u8 {
    var root: [32]u8 = @as([32]u8, @splat(0));
    @memcpy(root[0..bytes.len], bytes);
    return root;
}

fn mixInLength(root: [32]u8, length: u64) [32]u8 {
    var length_chunk: [32]u8 = @as([32]u8, @splat(0));
    const length_encoded = primitives.Ssz.encodeUint64(length);
    @memcpy(length_chunk[0..8], length_encoded[0..]);

    var hasher = std.crypto.hash.sha2.Sha256.init(.{});
    hasher.update(root[0..]);
    hasher.update(length_chunk[0..]);

    var mixed: [32]u8 = undefined;
    hasher.final(&mixed);
    return mixed;
}

fn byteListRoot(extra_data: []const u8) [32]u8 {
    std.debug.assert(extra_data.len <= EXTRA_DATA_MAX_BYTES);

    var data_root: [32]u8 = @as([32]u8, @splat(0));
    @memcpy(data_root[0..extra_data.len], extra_data);
    return mixInLength(data_root, @intCast(extra_data.len));
}

fn sampleHeader(extra_data: []const u8) !ExecutionPayloadHeader {
    return ExecutionPayloadHeader.from(
        @as([32]u8, @splat(0x11)),
        @as([20]u8, @splat(0x22)),
        @as([32]u8, @splat(0x33)),
        @as([32]u8, @splat(0x44)),
        @as([256]u8, @splat(0x55)),
        @as([32]u8, @splat(0x66)),
        1_234_567,
        30_000_000,
        15_000_000,
        1_700_000_000,
        extra_data,
        1_000_000_000,
        @as([32]u8, @splat(0x77)),
        @as([32]u8, @splat(0x88)),
        @as([32]u8, @splat(0x99)),
        393_216,
        786_432,
    );
}

test "ExecutionPayloadHeader: construction and field access" {
    const header = try sampleHeader("deneb");

    try std.testing.expectEqual(@as(u64, 1_234_567), header.block_number);
    try std.testing.expectEqual(@as(u64, 30_000_000), header.gas_limit);
    try std.testing.expectEqual(@as(u64, 15_000_000), header.gas_used);
    try std.testing.expectEqual(@as(u64, 1_700_000_000), header.timestamp);
    try std.testing.expectEqual(@as(usize, 5), header.extra_data.len);
    try std.testing.expectEqual(@as(u64, 1_234_567), header.blockNumber());
}

test "ExecutionPayloadHeader: equals positive and negative" {
    const a = try sampleHeader("deneb");
    const b = try sampleHeader("deneb");
    const c = try ExecutionPayloadHeader.from(
        a.parent_hash,
        a.fee_recipient,
        a.state_root,
        a.receipts_root,
        a.logs_bloom,
        a.prev_randao,
        a.block_number + 1,
        a.gas_limit,
        a.gas_used,
        a.timestamp,
        a.extra_data,
        a.base_fee_per_gas,
        a.block_hash,
        a.transactions_root,
        a.withdrawals_root,
        a.blob_gas_used,
        a.excess_blob_gas,
    );

    try std.testing.expect(a.equals(b));
    try std.testing.expect(!a.equals(c));
}

test "ExecutionPayloadHeader: hashTreeRoot consistency" {
    const header = try sampleHeader("deneb");
    const root_a = try header.hashTreeRoot(std.testing.allocator);
    const root_b = try header.hashTreeRoot(std.testing.allocator);

    try std.testing.expectEqual(root_a, root_b);
}

test "ExecutionPayloadHeader: hashTreeRoot differs for different headers" {
    const a = try sampleHeader("deneb");
    const b = try sampleHeader("deneb-v2");

    const root_a = try a.hashTreeRoot(std.testing.allocator);
    const root_b = try b.hashTreeRoot(std.testing.allocator);

    try std.testing.expect(!std.mem.eql(u8, root_a[0..], root_b[0..]));
}

test "ExecutionPayloadHeader: from rejects extra_data larger than 32 bytes" {
    const too_long = @as([33]u8, @splat(0xaa));

    try std.testing.expectError(
        error.ExtraDataTooLong,
        ExecutionPayloadHeader.from(
            @as([32]u8, @splat(0x11)),
            @as([20]u8, @splat(0x22)),
            @as([32]u8, @splat(0x33)),
            @as([32]u8, @splat(0x44)),
            @as([256]u8, @splat(0x55)),
            @as([32]u8, @splat(0x66)),
            1_234_567,
            30_000_000,
            15_000_000,
            1_700_000_000,
            too_long[0..],
            1_000_000_000,
            @as([32]u8, @splat(0x77)),
            @as([32]u8, @splat(0x88)),
            @as([32]u8, @splat(0x99)),
            393_216,
            786_432,
        ),
    );
}
