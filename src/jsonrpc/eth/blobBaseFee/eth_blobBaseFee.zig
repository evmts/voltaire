const std = @import("std");
const types = @import("../../types.zig");

/// Returns the base fee per blob gas in wei.
///
/// Example:
/// Result: "0x3f5694c1f"
///
/// Implements the `eth_blobBaseFee` JSON-RPC method.
pub const EthBlobBaseFee = @This();

/// The JSON-RPC method name
pub const method = "eth_blobBaseFee";

/// Parameters for `eth_blobBaseFee`
pub const Params = struct {

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        _ = self;
        try jws.write(.{});
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        _ = allocator;
        _ = source;
        _ = options;
        return Params{};
    }
};

/// Result for `eth_blobBaseFee`
pub const Result = struct {
    /// Blob gas base fee
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
