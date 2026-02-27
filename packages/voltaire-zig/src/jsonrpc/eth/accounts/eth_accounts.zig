const std = @import("std");
const types = @import("../../types.zig");

/// Returns a list of addresses owned by client.
///
/// Implements the `eth_accounts` JSON-RPC method.
pub const EthAccounts = @This();

/// The JSON-RPC method name
pub const method = "eth_accounts";

/// Parameters for `eth_accounts`
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

/// Result for `eth_accounts` — array of addresses
pub const Result = struct {
    value: []const types.Address,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        for (self.value) |addr| {
            try addr.jsonStringify(jws);
        }
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        if (source != .array) return error.UnexpectedToken;
        const items = source.array.items;
        const addrs = try allocator.alloc(types.Address, items.len);
        for (items, 0..) |item, i| {
            addrs[i] = try types.Address.jsonParseFromValue(allocator, item, options);
        }
        return Result{ .value = addrs };
    }
};
