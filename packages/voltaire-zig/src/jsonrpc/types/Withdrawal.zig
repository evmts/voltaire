const std = @import("std");
const Address = @import("Address.zig").Address;
const Quantity = @import("Quantity.zig").Quantity;

// Import tests
test {
    _ = @import("Withdrawal_test.zig");
}

/// Withdrawal - JSON-RPC response type for validator withdrawals (EIP-4895)
///
/// Per EIP-1474, fields are:
/// - index: QUANTITY - withdrawal index
/// - validatorIndex: QUANTITY - validator index on beacon chain
/// - address: DATA (20 bytes) - recipient address
/// - amount: QUANTITY - amount in Gwei
pub const Withdrawal = struct {
    index: Quantity,
    validatorIndex: Quantity,
    address: Address,
    amount: Quantity,

    pub fn jsonStringify(self: Withdrawal, jws: *std.json.Stringify) !void {
        try jws.beginObject();
        try jws.objectField("index");
        try jws.write(self.index);
        try jws.objectField("validatorIndex");
        try jws.write(self.validatorIndex);
        try jws.objectField("address");
        try jws.write(self.address);
        try jws.objectField("amount");
        try jws.write(self.amount);
        try jws.endObject();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Withdrawal {
        if (source != .object) return error.UnexpectedToken;
        const obj = source.object;

        var result: Withdrawal = undefined;

        // Parse index
        const index_val = obj.get("index") orelse return error.MissingField;
        result.index = try std.json.innerParseFromValue(Quantity, allocator, index_val, options);

        // Parse validatorIndex
        const validator_index_val = obj.get("validatorIndex") orelse return error.MissingField;
        result.validatorIndex = try std.json.innerParseFromValue(Quantity, allocator, validator_index_val, options);

        // Parse address
        const address_val = obj.get("address") orelse return error.MissingField;
        result.address = try std.json.innerParseFromValue(Address, allocator, address_val, options);

        // Parse amount
        const amount_val = obj.get("amount") orelse return error.MissingField;
        result.amount = try std.json.innerParseFromValue(Quantity, allocator, amount_val, options);

        return result;
    }
};
