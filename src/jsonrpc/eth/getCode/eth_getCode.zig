const std = @import("std");
const types = @import("../../types.zig");

/// Returns code at a given address.
///
/// Example:
/// Address: "0xa50a51c09a5c451c52bb714527e1974b686d8e77"
/// Block: "latest"
/// Result: "0x60806040526004361060485763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416633fa4f2458114604d57806355241077146071575b600080fd5b348015605857600080fd5b50605f6088565b60408051918252519081900360200190f35b348015607c57600080fd5b506086600435608e565b005b60005481565b60008190556040805182815290517f199cd93e851e4c78c437891155e2112093f8f15394aa89dab09e38d6ca0727879181900360200190a1505600a165627a7a723058209d8929142720a69bde2ab3bfa2da6217674b984899b62753979743c0470a2ea70029"
///
/// Implements the `eth_getCode` JSON-RPC method.
pub const EthGetCode = @This();

/// The JSON-RPC method name
pub const method = "eth_getCode";

/// Parameters for `eth_getCode`
pub const Params = struct {
    /// hex encoded address
    address: types.Address,
    /// Block number, tag, or block hash
    block: types.BlockSpec,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.address);
        try jws.write(self.block);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .address = try std.json.innerParseFromValue(types.Address, allocator, source.array.items[0], options),
            .block = try std.json.innerParseFromValue(types.BlockSpec, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_getCode`
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
