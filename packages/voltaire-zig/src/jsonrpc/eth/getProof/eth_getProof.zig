const std = @import("std");
const types = @import("../../types.zig");

/// Returns the merkle proof for a given account and optionally some storage keys.
///
/// Example:
/// Address: "0xe5cB067E90D5Cd1F8052B83562Ae670bA4A211a8"
/// StorageKeys: ...
/// Block: "latest"
/// Result: ...
///
/// Implements the `eth_getProof` JSON-RPC method.
pub const EthGetProof = @This();

/// The JSON-RPC method name
pub const method = "eth_getProof";

/// Parameters for `eth_getProof`
pub const Params = struct {
    /// hex encoded address
    address: types.Address,
    /// Storage keys
    storagekeys: types.Quantity,
    /// Block number, tag, or block hash
    block: types.BlockSpec,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.address);
        try jws.write(self.storagekeys);
        try jws.write(self.block);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 3) return error.InvalidParamCount;

        return Params{
            .address = try std.json.innerParseFromValue(types.Address, allocator, source.array.items[0], options),
            .storagekeys = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
            .block = try std.json.innerParseFromValue(types.BlockSpec, allocator, source.array.items[2], options),
        };
    }
};

/// Result for `eth_getProof`
pub const Result = struct {
    /// Account proof
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
