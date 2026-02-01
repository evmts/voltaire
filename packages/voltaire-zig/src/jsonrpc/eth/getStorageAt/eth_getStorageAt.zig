const std = @import("std");
const types = @import("../../types.zig");

/// Returns the value from a storage position at a given address.
///
/// Example:
/// Address: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
/// Storage slot: "0x0"
/// Block: "latest"
/// Result: "0x0000000000000000000000000000000000000000000000000000000000000000"
///
/// Implements the `eth_getStorageAt` JSON-RPC method.
pub const EthGetStorageAt = @This();

/// The JSON-RPC method name
pub const method = "eth_getStorageAt";

/// Parameters for `eth_getStorageAt`
pub const Params = struct {
    /// hex encoded address
    address: types.Address,
    /// 32 hex encoded bytes
    storage_slot: types.Quantity,
    /// Block number, tag, or block hash
    block: types.BlockSpec,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.address);
        try jws.write(self.storage_slot);
        try jws.write(self.block);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 3) return error.InvalidParamCount;

        return Params{
            .address = try std.json.innerParseFromValue(types.Address, allocator, source.array.items[0], options),
            .storage_slot = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
            .block = try std.json.innerParseFromValue(types.BlockSpec, allocator, source.array.items[2], options),
        };
    }
};

/// Result for `eth_getStorageAt`
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
