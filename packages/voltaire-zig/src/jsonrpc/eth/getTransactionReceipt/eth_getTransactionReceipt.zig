const std = @import("std");
const types = @import("../../types.zig");

/// Returns the receipt of a transaction by transaction hash.
///
/// Example:
/// Transaction hash: "0x504ce587a65bdbdb6414a0c6c16d86a04dd79bfcc4f2950eec9634b30ce5370f"
/// Result: ReceiptResponse object or null if not found
///
/// Implements the `eth_getTransactionReceipt` JSON-RPC method.
pub const EthGetTransactionReceipt = @This();

/// The JSON-RPC method name
pub const method = "eth_getTransactionReceipt";

/// Parameters for `eth_getTransactionReceipt`
pub const Params = struct {
    /// 32 byte hex value
    transaction_hash: types.Hash,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
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

/// Result for `eth_getTransactionReceipt`
/// Returns null if transaction is not found, otherwise returns ReceiptResponse
pub const Result = struct {
    value: ?types.ReceiptResponse,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        if (self.value) |receipt| {
            try jws.write(receipt);
        } else {
            try jws.write(null);
        }
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        if (source == .null) {
            return Result{ .value = null };
        }
        return Result{
            .value = try std.json.innerParseFromValue(types.ReceiptResponse, allocator, source, options),
        };
    }
};

// Import tests
test {
    _ = @import("eth_getTransactionReceipt_test.zig");
}
