const std = @import("std");
const types = @import("../../types.zig");

/// Returns information about a transaction by block number and transaction index position.
///
/// Example:
/// Block: "0x1442e"
/// Transaction index: "0x2"
/// Result: TransactionResponse or null if not found
///
/// Implements the `eth_getTransactionByBlockNumberAndIndex` JSON-RPC method.
pub const EthGetTransactionByBlockNumberAndIndex = @This();

/// The JSON-RPC method name
pub const method = "eth_getTransactionByBlockNumberAndIndex";

/// Parameters for `eth_getTransactionByBlockNumberAndIndex`
pub const Params = struct {
    /// Block number or tag
    block: types.Quantity,
    /// hex encoded unsigned integer
    transaction_index: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.WriteStream) !void {
        try jws.beginArray();
        try jws.write(self.block);
        try jws.write(self.transaction_index);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .block = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
            .transaction_index = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_getTransactionByBlockNumberAndIndex`
/// Returns TransactionResponse for found transactions, null for not found.
pub const Result = struct {
    value: ?types.TransactionResponse,

    pub fn jsonStringify(self: Result, jws: *std.json.WriteStream) !void {
        if (self.value) |tx| {
            try tx.jsonStringify(jws);
        } else {
            try jws.writeNull();
        }
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        if (source == .null) {
            return Result{ .value = null };
        }

        // Parse TransactionResponse from JSON
        _ = allocator;
        _ = options;
        @panic("TODO: implement TransactionResponse parsing from JSON");
    }
};
