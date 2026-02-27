const std = @import("std");
const types = @import("../../types.zig");

/// Returns the information about a transaction requested by transaction hash.
///
/// Example:
/// Transaction hash: "0xa52be92809541220ee0aaaede6047d9a6c5d0cd96a517c854d944ee70a0ebb44"
/// Result: TransactionResponse or null if not found
///
/// Implements the `eth_getTransactionByHash` JSON-RPC method.
pub const EthGetTransactionByHash = @This();

/// The JSON-RPC method name
pub const method = "eth_getTransactionByHash";

/// Parameters for `eth_getTransactionByHash`
pub const Params = struct {
    /// 32 byte hex value
    transaction_hash: types.Hash,

    pub fn jsonStringify(self: Params, jws: *std.json.WriteStream) !void {
        try jws.beginArray();
        try jws.write(self.transaction_hash);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .transaction_hash = try std.json.innerParseFromValue(types.Hash, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_getTransactionByHash`
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
        // For now, we'll parse into a generic structure and create the appropriate variant
        // This is a placeholder - full parsing would need to handle all tx types
        _ = allocator;
        _ = options;
        @panic("TODO: implement TransactionResponse parsing from JSON");
    }
};
