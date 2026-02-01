const std = @import("std");
const types = @import("../../types.zig");

/// Returns an array of EIP-2718 binary-encoded transactions.
///
/// Example:
/// Transaction hash: "0x3a2fd1a5ea9ffee477f449be53a49398533d2c006a5815023920d1c397298df3"
/// Result: "0xf8678084342770c182520894658bdf435d810c91414ec09147daa6db624063798203e880820a95a0af5fc351b9e457a31f37c84e5cd99dd3c5de60af3de33c6f4160177a2c786a60a0201da7a21046af55837330a2c52fc1543cd4d9ead00ddf178dd96935b607ff9b"
///
/// Implements the `debug_getRawTransaction` JSON-RPC method.
pub const DebugGetRawTransaction = @This();

/// The JSON-RPC method name
pub const method = "debug_getRawTransaction";

/// Parameters for `debug_getRawTransaction`
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

/// Result for `debug_getRawTransaction`
pub const Result = struct {
    /// hex encoded bytes
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
