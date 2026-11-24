//! Contract helpers built on the typed ABI codec. Signatures use Solidity's
//! canonical types, and bytecode, call data and log data are raw bytes.

const std = @import("std");
const abi = @import("../Abi/abi_encoding.zig");

const Allocator = std.mem.Allocator;

pub const Address = @import("../Address/address.zig").Address;
pub const AbiType = abi.AbiType;
pub const AbiValue = abi.AbiValue;
pub const FunctionDefinition = abi.FunctionDefinition;
pub const EventDefinition = abi.EventDefinition;
pub const ErrorDefinition = abi.ErrorDefinition;

pub const encodeAbiParameters = abi.encodeAbiParameters;
pub const decodeAbiParameters = abi.decodeAbiParameters;
pub const freeAbiValues = abi.freeAbiValues;
pub const computeSelector = abi.computeSelector;
pub const decodeFunctionResult = abi.decodeFunctionResult;
pub const encodeEventTopics = abi.encodeEventTopicsFromDef;
pub const decodeEventLog = abi.decodeEventLog;
pub const computeEventTopic = abi.getEventSelector;

/// Parse a Solidity ABI type supported by the Zig codec.
pub fn parseAbiType(name: []const u8) error{UnsupportedType}!AbiType {
    if (std.mem.eql(u8, name, "uint")) return .uint256;
    if (std.mem.eql(u8, name, "int")) return .int256;
    return std.meta.stringToEnum(AbiType, name) orelse error.UnsupportedType;
}

/// An unsigned contract creation request. The caller supplies network-specific
/// fields such as nonce, gas and fees when preparing the transaction for signing.
pub const DeployTransaction = struct {
    to: ?Address = null,
    value: u256,
    data: []const u8,

    pub fn deinit(self: *DeployTransaction, allocator: Allocator) void {
        allocator.free(self.data);
        self.* = undefined;
    }
};

fn validateArguments(types: []const AbiType, args: []const AbiValue) abi.AbiError!void {
    if (types.len != args.len) return error.InvalidData;
    for (types, args) |expected, arg| {
        if (expected != arg.get_type()) return error.InvalidData;
    }
}

/// Return owned initcode followed by ABI-encoded constructor arguments.
pub fn encodeDeployData(
    allocator: Allocator,
    bytecode: []const u8,
    inputs: []const AbiType,
    args: []const AbiValue,
) ![]u8 {
    try validateArguments(inputs, args);
    if (args.len == 0) return allocator.dupe(u8, bytecode);

    const encoded = try encodeAbiParameters(allocator, args);
    defer allocator.free(encoded);
    return std.mem.concat(allocator, u8, &.{ bytecode, encoded });
}

/// Create a deployment request with owned data and a null recipient.
pub fn createDeployTransaction(
    allocator: Allocator,
    bytecode: []const u8,
    inputs: []const AbiType,
    args: []const AbiValue,
    value: u256,
) !DeployTransaction {
    return .{
        .value = value,
        .data = try encodeDeployData(allocator, bytecode, inputs, args),
    };
}

/// Return owned calldata for the supplied function definition.
pub fn encodeFunctionCall(allocator: Allocator, function: FunctionDefinition, args: []const AbiValue) ![]u8 {
    try validateArguments(function.inputs, args);
    return abi.encodeFunctionData(allocator, try function.get_selector(allocator), args);
}

/// Decode revert data against a known error definition and verify its selector.
/// Release the returned values with freeAbiValues.
pub fn decodeError(allocator: Allocator, definition: ErrorDefinition, data: []const u8) ![]AbiValue {
    return definition.decode_data(allocator, data);
}
