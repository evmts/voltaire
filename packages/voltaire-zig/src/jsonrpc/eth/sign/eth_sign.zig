const std = @import("std");
const types = @import("../../types.zig");

/// Returns an EIP-191 signature over the provided data.
///
/// Example:
/// Address: "0x9b2055d370f73ec7d8a03e965129118dc8f5bf83"
/// Message: "0xdeadbeaf"
/// Result: "0xa3f20717a250c2b0b729b7e5becbff67fdaef7e0699da4de7ca5895b02a170a12d887fd3b17bfdce3481f10bea41f45ba9f709d39ce8325427b57afcfc994cee1b"
///
/// Implements the `eth_sign` JSON-RPC method.
pub const EthSign = @This();

/// The JSON-RPC method name
pub const method = "eth_sign";

/// Parameters for `eth_sign`
pub const Params = struct {
    /// hex encoded address
    address: types.Address,
    /// hex encoded bytes
    message: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.address);
        try jws.write(self.message);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .address = try std.json.innerParseFromValue(types.Address, allocator, source.array.items[0], options),
            .message = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_sign`
pub const Result = struct {
    /// 65 hex encoded bytes
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
