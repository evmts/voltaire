const std = @import("std");
const types = @import("../../types.zig");

/// Transaction fee history
///
/// Example:
/// blockCount: "0x5"
/// newestblock: "latest"
/// rewardPercentiles: ...
/// Result: ...
///
/// Implements the `eth_feeHistory` JSON-RPC method.
pub const EthFeeHistory = @This();

/// The JSON-RPC method name
pub const method = "eth_feeHistory";

/// Parameters for `eth_feeHistory`
pub const Params = struct {
    /// hex encoded unsigned integer
    blockcount: types.Quantity,
    /// Block number or tag
    newestblock: types.Quantity,
    /// rewardPercentiles
    rewardpercentiles: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.blockcount);
        try jws.write(self.newestblock);
        try jws.write(self.rewardpercentiles);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 3) return error.InvalidParamCount;

        return Params{
            .blockcount = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
            .newestblock = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
            .rewardpercentiles = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[2], options),
        };
    }
};

/// Result for `eth_feeHistory`
pub const Result = struct {
    /// feeHistoryResults
    value: types.Quantity,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        try jws.write(self.value);
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        return Result{
            .value = try std.json.innerParseFromValue(types.Quantity, allocator, source, options),
        };
    }
};
