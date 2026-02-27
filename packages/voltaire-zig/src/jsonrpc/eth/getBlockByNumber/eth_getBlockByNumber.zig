const std = @import("std");
const types = @import("../../types.zig");

/// Returns information about a block by number.
///
/// Example:
/// block: "0x68b3"
/// Hydrated transactions: false
/// Result: BlockResponse
///
/// Implements the `eth_getBlockByNumber` JSON-RPC method.
pub const EthGetBlockByNumber = @This();

/// The JSON-RPC method name
pub const method = "eth_getBlockByNumber";

/// Parameters for `eth_getBlockByNumber`
pub const Params = struct {
    /// Block number or tag
    block: types.BlockSpec,
    /// Whether to return full transaction objects (true) or just hashes (false)
    hydrated_transactions: bool,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block);
        try jws.write(self.hydrated_transactions);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .block = try std.json.innerParseFromValue(types.BlockSpec, allocator, source.array.items[0], options),
            .hydrated_transactions = try std.json.innerParseFromValue(bool, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_getBlockByNumber`
/// Returns a BlockResponse or null if the block is not found.
pub const Result = struct {
    block: ?types.BlockResponse.BlockResponse,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        if (self.block) |b| {
            try jws.write(b);
        } else {
            try jws.writeNull();
        }
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        if (source == .null) {
            return Result{ .block = null };
        }
        return Result{
            .block = try std.json.innerParseFromValue(types.BlockResponse.BlockResponse, allocator, source, options),
        };
    }
};
