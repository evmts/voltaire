//! Fee estimates from a caller-provided snapshot of recent canonical blocks.

const std = @import("std");
const FeeMarket = @import("../FeeMarket/fee_market.zig");
const Blob = @import("../Blob/blob.zig");

const FeeOracle = @This();

/// Legacy gas price quote, for example from eth_gasPrice.
legacy_gas_price: u64,
/// Consecutive blocks in oldest-to-newest order. All slices are borrowed.
blocks: []const Block = &.{},
policy: Policy = Policy.ethereum_mainnet,

pub const Policy = struct {
    /// Maximum number of recent blocks sampled for tips. Zero always uses the fallback.
    history_blocks: usize = 4,
    /// Suggested tip in wei when EIP-1559 is active and samples are unavailable.
    fallback_priority_fee: u64,

    pub const ethereum_mainnet: Policy = .{ .fallback_priority_fee = 1_000_000_000 };
    pub const ethereum_sepolia: Policy = .{ .fallback_priority_fee = 100_000_000 };
};

pub const Strategy = union(enum) {
    slow,
    standard,
    fast,
    custom_percentile: f64,

    fn percentile(self: Strategy) f64 {
        return switch (self) {
            .slow => 25,
            .standard => 50,
            .fast => 75,
            .custom_percentile => |value| value,
        };
    }

    fn baseFeeBlocks(self: Strategy) usize {
        return switch (self) {
            .slow => 1,
            .standard, .custom_percentile => 2,
            .fast => 3,
        };
    }
};

pub const Reward = struct {
    priority_fee_per_gas: u64,
    gas_used: u64,
};

pub const BlobRules = struct {
    schedule: Blob.BlobSchedule,
    eip7918: bool = false,

    fn validate(self: BlobRules) !void {
        const schedule = self.schedule;
        if (schedule.base_fee_update_fraction == 0 or schedule.max == 0 or
            schedule.target > schedule.max or
            schedule.max > std.math.maxInt(u64) / Blob.BLOB_GAS_PER_BLOB)
        {
            return error.InvalidBlobSchedule;
        }
    }
};

pub const BlobState = struct {
    excess_blob_gas: u64,
    blob_gas_used: u64,
    rules: BlobRules,
    /// Supply at a fork boundary if the next block uses different rules.
    next_rules: ?BlobRules = null,
};

pub const Block = struct {
    number: u64,
    gas_used: u64,
    gas_limit: u64,
    base_fee_per_gas: ?u64 = null,
    /// Effective tips in ascending order, weighted by receipt gas used.
    /// An empty slice represents unavailable samples or an empty block.
    rewards: []const Reward = &.{},
    blob: ?BlobState = null,

    pub fn nextBaseFee(self: Block) !?u64 {
        const base_fee = self.base_fee_per_gas orelse return null;
        const target = FeeMarket.getGasTarget(self.gas_limit);
        if (target == 0 or self.gas_used > self.gas_limit) return error.InvalidBlockGas;
        return FeeMarket.nextBaseFee(base_fee, self.gas_used, target);
    }

    /// Select a gas-weighted percentile of the known rewards.
    pub fn rewardPercentile(self: Block, percentile: f64) !?u64 {
        try validatePercentile(percentile);

        var total: u64 = 0;
        var previous_fee: u64 = 0;
        for (self.rewards) |reward| {
            if (reward.priority_fee_per_gas < previous_fee or
                reward.gas_used > self.gas_used - total)
            {
                return error.InvalidRewards;
            }
            previous_fee = reward.priority_fee_per_gas;
            total += reward.gas_used;
        }
        if (total == 0) return null;

        // Use a wide intermediate because rounding u64 to f64 can yield 2^64.
        const rounded_rank: u128 = @intFromFloat(@ceil(@as(f64, @floatFromInt(total)) * (percentile / 100)));
        const rank = if (percentile == 100) total else @min(total, @max(1, rounded_rank));
        var cumulative: u64 = 0;
        for (self.rewards) |reward| {
            cumulative += reward.gas_used;
            if (cumulative >= rank) return reward.priority_fee_per_gas;
        }
        unreachable;
    }
};

pub const FeeHistory = struct {
    blocks: []const Block,
    next_base_fee_per_gas: ?u64,
};

pub const Fees = struct {
    gas_price: u64,
    next_base_fee_per_gas: ?u64 = null,
    max_priority_fee_per_gas: ?u64 = null,
    max_fee_per_gas: ?u64 = null,
};

pub const BlobFees = struct {
    blob_base_fee: u256,
    /// Fee cap that covers the predicted next block.
    max_fee_per_blob_gas: u256,
};

pub fn getGasPrice(self: FeeOracle) u64 {
    return self.legacy_gas_price;
}

/// Return up to count recent blocks and the predicted successor base fee.
/// Each block exposes its base fee, utilization inputs, and reward percentiles.
pub fn getFeeHistory(self: FeeOracle, count: usize) !FeeHistory {
    if (count == 0) return error.InvalidBlockCount;
    const blocks = self.blocks[self.blocks.len - @min(count, self.blocks.len) ..];
    return .{
        .blocks = blocks,
        .next_base_fee_per_gas = if (blocks.len == 0) null else try blocks[blocks.len - 1].nextBaseFee(),
    };
}

/// Average the selected gas-weighted percentile across blocks with samples.
pub fn getMaxPriorityFeePerGas(self: FeeOracle, strategy: Strategy) !?u64 {
    const percentile = strategy.percentile();
    try validatePercentile(percentile);
    if (self.blocks.len == 0 or self.blocks[self.blocks.len - 1].base_fee_per_gas == null) return null;

    const blocks = self.blocks[self.blocks.len - @min(self.policy.history_blocks, self.blocks.len) ..];
    var total: u128 = 0;
    var sampled_blocks: usize = 0;
    for (blocks) |block| {
        if (block.base_fee_per_gas == null) continue;
        if (try block.rewardPercentile(percentile)) |reward| {
            total += reward;
            sampled_blocks += 1;
        }
    }
    if (sampled_blocks == 0) return self.policy.fallback_priority_fee;
    return @intCast(total / sampled_blocks);
}

pub fn getMaxFeePerGas(self: FeeOracle, strategy: Strategy) !?u64 {
    return (try self.estimateFees(strategy)).max_fee_per_gas;
}

/// Use actual utilization for the next block, then assume full blocks over
/// the strategy's remaining horizon. Legacy-only snapshots return a gas price.
pub fn estimateFees(self: FeeOracle, strategy: Strategy) !Fees {
    const priority_fee = try self.getMaxPriorityFeePerGas(strategy) orelse
        return .{ .gas_price = self.getGasPrice() };
    const latest = self.blocks[self.blocks.len - 1];
    const next_base_fee = (try latest.nextBaseFee()).?;
    var buffered_base_fee = next_base_fee;
    for (1..strategy.baseFeeBlocks()) |_| {
        buffered_base_fee = FeeMarket.nextBaseFee(buffered_base_fee, latest.gas_limit, FeeMarket.getGasTarget(latest.gas_limit));
    }
    return .{
        .gas_price = self.getGasPrice(),
        .next_base_fee_per_gas = next_base_fee,
        .max_priority_fee_per_gas = priority_fee,
        .max_fee_per_gas = buffered_base_fee +| priority_fee,
    };
}

pub fn getBlobBaseFee(self: FeeOracle) !?u256 {
    if (self.blocks.len == 0) return null;
    const state = self.blocks[self.blocks.len - 1].blob orelse return null;
    try state.rules.validate();
    return Blob.calculateBlobBaseFeeForSchedule(state.excess_blob_gas, state.rules.schedule);
}

pub fn estimateBlobFees(self: FeeOracle) !?BlobFees {
    const current = try self.getBlobBaseFee() orelse return null;
    const latest = self.blocks[self.blocks.len - 1];
    const state = latest.blob.?;
    const next = state.next_rules orelse state.rules;
    try next.validate();
    if (state.blob_gas_used > state.rules.schedule.maxBlobGas() or
        state.blob_gas_used % Blob.BLOB_GAS_PER_BLOB != 0)
    {
        return error.InvalidBlobGas;
    }
    const excess = if (next.eip7918)
        Blob.calculateExcessBlobGasEip7918(
            state.excess_blob_gas,
            state.blob_gas_used,
            latest.base_fee_per_gas orelse return error.MissingBaseFee,
            next.schedule,
        )
    else
        Blob.calculateExcessBlobGasForSchedule(state.excess_blob_gas, state.blob_gas_used, next.schedule);

    return .{
        .blob_base_fee = current,
        .max_fee_per_blob_gas = @max(current, Blob.calculateBlobBaseFeeForSchedule(excess, next.schedule)),
    };
}

fn validatePercentile(percentile: f64) !void {
    if (!(percentile >= 0 and percentile <= 100)) return error.InvalidPercentile;
}

test "FeeOracle legacy fallback" {
    const oracle: FeeOracle = .{ .legacy_gas_price = 42 };
    const fees = try oracle.estimateFees(.standard);
    try std.testing.expectEqual(@as(u64, 42), fees.gas_price);
    try std.testing.expectEqual(@as(?u64, null), fees.max_fee_per_gas);
    try std.testing.expectEqual(@as(?u256, null), try oracle.getBlobBaseFee());
}

test "FeeOracle predicts base fee and uses gas-weighted reward percentiles" {
    const blocks = [_]Block{
        .{ .number = 5, .gas_used = 100, .gas_limit = 200, .base_fee_per_gas = 800, .rewards = &.{
            .{ .priority_fee_per_gas = 12, .gas_used = 100 },
        } },
        .{ .number = 6, .gas_used = 200, .gas_limit = 200, .base_fee_per_gas = 800, .rewards = &.{
            .{ .priority_fee_per_gas = 2, .gas_used = 50 },
            .{ .priority_fee_per_gas = 8, .gas_used = 90 },
            .{ .priority_fee_per_gas = 20, .gas_used = 60 },
        } },
    };
    const oracle: FeeOracle = .{ .legacy_gas_price = 810, .blocks = &blocks };
    const history = try oracle.getFeeHistory(1);
    try std.testing.expectEqual(@as(usize, 1), history.blocks.len);
    try std.testing.expectEqual(@as(u64, 6), history.blocks[0].number);
    try std.testing.expectEqual(@as(?u64, 900), history.next_base_fee_per_gas);
    try std.testing.expectEqual(@as(?u64, 907), try oracle.getMaxFeePerGas(.slow));
    try std.testing.expectEqual(@as(?u64, 1022), try oracle.getMaxFeePerGas(.standard));
    try std.testing.expectEqual(@as(?u64, 1154), try oracle.getMaxFeePerGas(.fast));
    try std.testing.expectEqual(@as(?u64, 16), try oracle.getMaxPriorityFeePerGas(.{ .custom_percentile = 100 }));
    try std.testing.expectError(error.InvalidPercentile, oracle.estimateFees(.{ .custom_percentile = std.math.nan(f64) }));
}

test "FeeOracle preserves sampled zero tips and falls back without samples" {
    const block: Block = .{ .number = 9, .gas_used = 50, .gas_limit = 100, .base_fee_per_gas = 80 };
    var oracle: FeeOracle = .{
        .legacy_gas_price = 90,
        .blocks = &.{block},
        .policy = Policy.ethereum_sepolia,
    };
    try std.testing.expectEqual(@as(?u64, 100_000_000), try oracle.getMaxPriorityFeePerGas(.standard));

    var sampled = block;
    sampled.rewards = &.{.{ .priority_fee_per_gas = 0, .gas_used = 50 }};
    oracle.blocks = &.{sampled};
    try std.testing.expectEqual(@as(?u64, 0), try oracle.getMaxPriorityFeePerGas(.standard));
    sampled.rewards = &.{.{ .priority_fee_per_gas = 1, .gas_used = 51 }};
    oracle.blocks = &.{sampled};
    try std.testing.expectError(error.InvalidRewards, oracle.getMaxPriorityFeePerGas(.standard));
}

test "FeeOracle estimates blob fee growth from excess gas" {
    const oracle: FeeOracle = .{ .legacy_gas_price = 0, .blocks = &.{.{
        .number = 10,
        .gas_used = 15_000_000,
        .gas_limit = 30_000_000,
        .base_fee_per_gas = 1_000_000_000,
        .blob = .{
            .excess_blob_gas = 2_100_000,
            .blob_gas_used = Blob.BlobSchedule.cancun.maxBlobGas(),
            .rules = .{ .schedule = .cancun },
        },
    }} };
    try std.testing.expectEqual(@as(?u256, 1), try oracle.getBlobBaseFee());
    const fees = (try oracle.estimateBlobFees()).?;
    try std.testing.expectEqual(@as(u256, 1), fees.blob_base_fee);
    try std.testing.expectEqual(@as(u256, 2), fees.max_fee_per_blob_gas);
}
