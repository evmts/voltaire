const std = @import("std");
const primitives = @import("primitives");

comptime {
    _ = primitives;
}

pub const Fork = enum {
    bellatrix,
    capella,
    deneb,
    electra,

    pub fn hasWithdrawalsRoot(self: Fork) bool {
        return switch (self) {
            .bellatrix => false,
            .capella, .deneb, .electra => true,
        };
    }

    pub fn hasBlobGasFields(self: Fork) bool {
        return switch (self) {
            .bellatrix, .capella => false,
            .deneb, .electra => true,
        };
    }

    pub fn isElectraOrLater(self: Fork) bool {
        return switch (self) {
            .bellatrix, .capella, .deneb => false,
            .electra => true,
        };
    }
};

pub const LightClientHeader = struct {
    pub const BeaconBlockHeader = struct {
        slot: u64,
        proposer_index: u64,
        parent_root: [32]u8,
        state_root: [32]u8,
        body_root: [32]u8,

        pub fn from(
            slot: u64,
            proposer_index: u64,
            parent_root: [32]u8,
            state_root: [32]u8,
            body_root: [32]u8,
        ) BeaconBlockHeader {
            return .{
                .slot = slot,
                .proposer_index = proposer_index,
                .parent_root = parent_root,
                .state_root = state_root,
                .body_root = body_root,
            };
        }

        pub fn equals(self: BeaconBlockHeader, other: BeaconBlockHeader) bool {
            return self.slot == other.slot and
                self.proposer_index == other.proposer_index and
                std.mem.eql(u8, self.parent_root[0..], other.parent_root[0..]) and
                std.mem.eql(u8, self.state_root[0..], other.state_root[0..]) and
                std.mem.eql(u8, self.body_root[0..], other.body_root[0..]);
        }
    };

    pub const ExecutionPayloadHeaderFields = struct {
        fork: Fork = .deneb,
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
        extra_data: [32]u8 = [_]u8{0} ** 32,
        extra_data_len: u8 = 0,
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
            base_fee_per_gas: u256,
            block_hash: [32]u8,
            transactions_root: [32]u8,
            withdrawals_root: [32]u8,
            blob_gas_used: u64,
            excess_blob_gas: u64,
        ) ExecutionPayloadHeaderFields {
            return .{
                .fork = .deneb,
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
                .base_fee_per_gas = base_fee_per_gas,
                .block_hash = block_hash,
                .transactions_root = transactions_root,
                .withdrawals_root = withdrawals_root,
                .blob_gas_used = blob_gas_used,
                .excess_blob_gas = excess_blob_gas,
            };
        }

        pub fn fromWithExtraData(
            fork: Fork,
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
        ) !ExecutionPayloadHeaderFields {
            if (extra_data.len > 32) return error.ExtraDataTooLong;

            var extra_data_bytes: [32]u8 = [_]u8{0} ** 32;
            @memcpy(extra_data_bytes[0..extra_data.len], extra_data);

            return .{
                .fork = fork,
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
                .extra_data = extra_data_bytes,
                .extra_data_len = @intCast(extra_data.len),
                .base_fee_per_gas = base_fee_per_gas,
                .block_hash = block_hash,
                .transactions_root = transactions_root,
                .withdrawals_root = withdrawals_root,
                .blob_gas_used = blob_gas_used,
                .excess_blob_gas = excess_blob_gas,
            };
        }

        pub fn extraData(self: *const ExecutionPayloadHeaderFields) []const u8 {
            return self.extra_data[0..self.extra_data_len];
        }

        pub fn equals(self: ExecutionPayloadHeaderFields, other: ExecutionPayloadHeaderFields) bool {
            return self.fork == other.fork and
                std.mem.eql(u8, self.parent_hash[0..], other.parent_hash[0..]) and
                std.mem.eql(u8, self.fee_recipient[0..], other.fee_recipient[0..]) and
                std.mem.eql(u8, self.state_root[0..], other.state_root[0..]) and
                std.mem.eql(u8, self.receipts_root[0..], other.receipts_root[0..]) and
                std.mem.eql(u8, self.logs_bloom[0..], other.logs_bloom[0..]) and
                std.mem.eql(u8, self.prev_randao[0..], other.prev_randao[0..]) and
                self.block_number == other.block_number and
                self.gas_limit == other.gas_limit and
                self.gas_used == other.gas_used and
                self.timestamp == other.timestamp and
                self.extra_data_len == other.extra_data_len and
                std.mem.eql(u8, self.extraData(), other.extraData()) and
                self.base_fee_per_gas == other.base_fee_per_gas and
                std.mem.eql(u8, self.block_hash[0..], other.block_hash[0..]) and
                std.mem.eql(u8, self.transactions_root[0..], other.transactions_root[0..]) and
                std.mem.eql(u8, self.withdrawals_root[0..], other.withdrawals_root[0..]) and
                self.blob_gas_used == other.blob_gas_used and
                self.excess_blob_gas == other.excess_blob_gas;
        }
    };

    fork: Fork = .deneb,
    beacon: BeaconBlockHeader,
    execution: ExecutionPayloadHeaderFields,
    execution_branch: [4][32]u8,

    pub fn from(
        beacon: BeaconBlockHeader,
        execution: ExecutionPayloadHeaderFields,
        execution_branch: [4][32]u8,
    ) LightClientHeader {
        return .{
            .fork = execution.fork,
            .beacon = beacon,
            .execution = execution,
            .execution_branch = execution_branch,
        };
    }

    pub fn fromWithFork(
        fork: Fork,
        beacon: BeaconBlockHeader,
        execution: ExecutionPayloadHeaderFields,
        execution_branch: [4][32]u8,
    ) LightClientHeader {
        return .{
            .fork = fork,
            .beacon = beacon,
            .execution = execution,
            .execution_branch = execution_branch,
        };
    }

    pub fn equals(self: LightClientHeader, other: LightClientHeader) bool {
        return self.fork == other.fork and
            self.beacon.equals(other.beacon) and
            self.execution.equals(other.execution) and
            std.mem.eql(
                u8,
                std.mem.asBytes(&self.execution_branch),
                std.mem.asBytes(&other.execution_branch),
            );
    }
};

fn fixtureLightClientHeader(slot: u64, marker: u8) LightClientHeader {
    return LightClientHeader.from(
        LightClientHeader.BeaconBlockHeader.from(
            slot,
            slot + 1,
            [_]u8{marker} ** 32,
            [_]u8{marker +% 1} ** 32,
            [_]u8{marker +% 2} ** 32,
        ),
        LightClientHeader.ExecutionPayloadHeaderFields.from(
            [_]u8{marker +% 3} ** 32,
            [_]u8{marker +% 4} ** 20,
            [_]u8{marker +% 5} ** 32,
            [_]u8{marker +% 6} ** 32,
            [_]u8{marker +% 7} ** 256,
            [_]u8{marker +% 8} ** 32,
            slot + 10,
            30_000_000,
            15_000_000,
            1_700_000_000 + slot,
            @as(u256, marker) + 1,
            [_]u8{marker +% 9} ** 32,
            [_]u8{marker +% 10} ** 32,
            [_]u8{marker +% 11} ** 32,
            slot + 12,
            slot + 13,
        ),
        [_][32]u8{[_]u8{marker +% 12} ** 32} ** 4,
    );
}

test "LightClientHeader: from creates header and exposes fields" {
    const header = fixtureLightClientHeader(42, 9);

    try std.testing.expectEqual(@as(u64, 42), header.beacon.slot);
    try std.testing.expectEqual(@as(u64, 43), header.beacon.proposer_index);
    try std.testing.expectEqual(@as(u64, 52), header.execution.block_number);
    try std.testing.expectEqual(@as(u64, 54), header.execution.excess_blob_gas);
    try std.testing.expectEqual(@as(u8, 21), header.execution_branch[0][0]);
}

test "LightClientHeader: equals returns true for identical headers" {
    const left = fixtureLightClientHeader(7, 3);
    const right = fixtureLightClientHeader(7, 3);

    try std.testing.expect(left.equals(right));
}

test "LightClientHeader: equals returns false for different headers" {
    const left = fixtureLightClientHeader(7, 3);
    const right = fixtureLightClientHeader(8, 3);

    try std.testing.expect(!left.equals(right));
}
