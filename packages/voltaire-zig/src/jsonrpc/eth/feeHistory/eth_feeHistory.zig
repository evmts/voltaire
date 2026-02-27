const std = @import("std");
const types = @import("../../types.zig");

/// Transaction fee history
///
/// Implements the `eth_feeHistory` JSON-RPC method.
pub const EthFeeHistory = @This();

/// The JSON-RPC method name
pub const method = "eth_feeHistory";

/// Parameters for `eth_feeHistory`
pub const Params = struct {
    /// Number of blocks in the requested range (hex quantity)
    block_count: types.Quantity,
    /// Highest block of the requested range (block number or tag)
    newest_block: types.BlockSpec,
    /// Reward percentiles to sample from each block (float array, optional)
    reward_percentiles: ?std.json.Value = null,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block_count);
        try jws.write(self.newest_block);
        if (self.reward_percentiles) |rp| {
            try jws.write(rp);
        } else {
            try jws.write(.{});
        }
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        const items = source.array.items;
        if (items.len < 2 or items.len > 3) return error.InvalidParamCount;

        return Params{
            .block_count = try std.json.innerParseFromValue(types.Quantity, allocator, items[0], options),
            .newest_block = try std.json.innerParseFromValue(types.BlockSpec, allocator, items[1], options),
            .reward_percentiles = if (items.len > 2) items[2] else null,
        };
    }
};

/// Result for `eth_feeHistory` — structured object per execution-apis spec
pub const Result = struct {
    /// Lowest number block of the returned range (hex quantity)
    oldest_block: types.Quantity,
    /// Array of block base fees per gas (includes next block after newest, len = block_count + 1)
    base_fee_per_gas: []const types.Quantity,
    /// Array of gas used ratios (floats 0..1, len = block_count)
    gas_used_ratio: []const f64,
    /// Optional nested array of effective priority fees per gas at requested percentiles
    reward: ?[]const []const types.Quantity = null,
    /// Optional array of base fee per blob gas (EIP-4844, len = block_count + 1)
    base_fee_per_blob_gas: ?[]const types.Quantity = null,
    /// Optional array of blob gas used ratios (EIP-4844, len = block_count)
    blob_gas_used_ratio: ?[]const f64 = null,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        try jws.beginObject();

        try jws.objectField("oldestBlock");
        try self.oldest_block.jsonStringify(jws);

        try jws.objectField("baseFeePerGas");
        try jws.beginArray();
        for (self.base_fee_per_gas) |fee| {
            try fee.jsonStringify(jws);
        }
        try jws.endArray();

        try jws.objectField("gasUsedRatio");
        try jws.beginArray();
        for (self.gas_used_ratio) |ratio| {
            try jws.write(ratio);
        }
        try jws.endArray();

        if (self.reward) |reward| {
            try jws.objectField("reward");
            try jws.beginArray();
            for (reward) |block_rewards| {
                try jws.beginArray();
                for (block_rewards) |r| {
                    try r.jsonStringify(jws);
                }
                try jws.endArray();
            }
            try jws.endArray();
        }

        if (self.base_fee_per_blob_gas) |blob_fees| {
            try jws.objectField("baseFeePerBlobGas");
            try jws.beginArray();
            for (blob_fees) |fee| {
                try fee.jsonStringify(jws);
            }
            try jws.endArray();
        }

        if (self.blob_gas_used_ratio) |blob_ratios| {
            try jws.objectField("blobGasUsedRatio");
            try jws.beginArray();
            for (blob_ratios) |ratio| {
                try jws.write(ratio);
            }
            try jws.endArray();
        }

        try jws.endObject();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        if (source != .object) return error.UnexpectedToken;

        const obj = source.object;

        const oldest = try std.json.innerParseFromValue(
            types.Quantity,
            allocator,
            obj.get("oldestBlock") orelse return error.MissingField,
            options,
        );

        const base_fee_val = obj.get("baseFeePerGas") orelse return error.MissingField;
        if (base_fee_val != .array) return error.UnexpectedToken;
        const base_fees = try allocator.alloc(types.Quantity, base_fee_val.array.items.len);
        for (base_fee_val.array.items, 0..) |item, i| {
            base_fees[i] = try std.json.innerParseFromValue(types.Quantity, allocator, item, options);
        }

        const gas_ratio_val = obj.get("gasUsedRatio") orelse return error.MissingField;
        if (gas_ratio_val != .array) return error.UnexpectedToken;
        const gas_ratios = try allocator.alloc(f64, gas_ratio_val.array.items.len);
        for (gas_ratio_val.array.items, 0..) |item, i| {
            gas_ratios[i] = switch (item) {
                .float => item.float,
                .integer => @floatFromInt(item.integer),
                else => return error.UnexpectedToken,
            };
        }

        return Result{
            .oldest_block = oldest,
            .base_fee_per_gas = base_fees,
            .gas_used_ratio = gas_ratios,
        };
    }
};
