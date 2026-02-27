const std = @import("std");
const types = @import("../../types.zig");

/// Returns the receipts of a block by number or hash.
///
/// Example:
/// Block: "latest"
/// Result: Array of ReceiptResponse objects or null if block not found
///
/// Implements the `eth_getBlockReceipts` JSON-RPC method.
pub const EthGetBlockReceipts = @This();

/// The JSON-RPC method name
pub const method = "eth_getBlockReceipts";

/// Parameters for `eth_getBlockReceipts`
pub const Params = struct {
    /// Block number, tag, or block hash
    block: types.BlockSpec,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .block = try std.json.innerParseFromValue(types.BlockSpec, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_getBlockReceipts`
/// Returns null if block is not found, otherwise returns array of ReceiptResponse
pub const Result = struct {
    value: ?[]const types.ReceiptResponse,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        if (self.value) |receipts| {
            try jws.write(receipts);
        } else {
            try jws.write(null);
        }
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        if (source == .null) {
            return Result{ .value = null };
        }
        const receipts = try std.json.innerParseFromValue([]const types.ReceiptResponse, allocator, source, options);
        return Result{ .value = receipts };
    }
};

// Import tests
test {
    _ = @import("eth_getBlockReceipts_test.zig");
}
