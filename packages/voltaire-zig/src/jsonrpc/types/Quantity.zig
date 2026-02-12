const std = @import("std");

/// QUANTITY per EIP-1474 (0x-prefixed hex without leading zeros, case-insensitive).
pub const Quantity = struct {
    value: std.json.Value,

    pub fn jsonStringify(self: Quantity, jws: *std.json.Stringify) !void {
        try jws.write(self.value);
    }

    pub fn jsonParseFromValue(_: std.mem.Allocator, source: std.json.Value, _: std.json.ParseOptions) !Quantity {
        // Trust upstream OpenRPC shapes; accept string or number JSON values.
        return .{ .value = source };
    }
};
