const primitives = @import("primitives");
const Address = primitives.Address.Address;

// TODO: Currently used in host which is unused
/// Call operation parameters for different call types
pub const CallParams = union(enum) {
    /// Regular CALL operation
    call: struct {
        caller: Address,
        to: Address,
        value: u256,
        input: []const u8,
        gas: u64,
    },
    /// CALLCODE operation: execute external code with current storage/context
    /// Executes code at `to`, but uses caller's storage and address context
    callcode: struct {
        caller: Address,
        to: Address,
        value: u256,
        input: []const u8,
        gas: u64,
    },
    /// DELEGATECALL operation (preserves caller context)
    delegatecall: struct {
        caller: Address, // Original caller, not current contract
        to: Address,
        input: []const u8,
        gas: u64,
    },
    /// STATICCALL operation (read-only)
    staticcall: struct {
        caller: Address,
        to: Address,
        input: []const u8,
        gas: u64,
    },
    /// CREATE operation
    create: struct {
        caller: Address,
        value: u256,
        init_code: []const u8,
        gas: u64,
    },
    /// CREATE2 operation
    create2: struct {
        caller: Address,
        value: u256,
        init_code: []const u8,
        salt: u256,
        gas: u64,
    },

    const ValidationError = error{
        GasZeroError,
    };

    /// TODO we need to validate input!
    pub fn validate(self: CallParams) ValidationError!void {
        if (self.getGas() == 0) return ValidationError.GasZeroError;
    }

    /// Get the gas limit for this call operation
    pub fn getGas(self: CallParams) u64 {
        return switch (self) {
            .call => |params| params.gas,
            .callcode => |params| params.gas,
            .delegatecall => |params| params.gas,
            .staticcall => |params| params.gas,
            .create => |params| params.gas,
            .create2 => |params| params.gas,
        };
    }

    /// Get the caller address for this call operation
    pub fn getCaller(self: CallParams) Address {
        return switch (self) {
            .call => |params| params.caller,
            .callcode => |params| params.caller,
            .delegatecall => |params| params.caller,
            .staticcall => |params| params.caller,
            .create => |params| params.caller,
            .create2 => |params| params.caller,
        };
    }

    /// Get the input data for this call operation (empty for CREATE operations)
    pub fn getInput(self: CallParams) []const u8 {
        return switch (self) {
            .call => |params| params.input,
            .callcode => |params| params.input,
            .delegatecall => |params| params.input,
            .staticcall => |params| params.input,
            .create => |params| params.init_code,
            .create2 => |params| params.init_code,
        };
    }

    /// Check if this call operation transfers value
    pub fn hasValue(self: CallParams) bool {
        return switch (self) {
            .call => |params| params.value > 0,
            .callcode => |params| params.value > 0,
            .delegatecall => false, // DELEGATECALL preserves value from parent context
            .staticcall => false, // STATICCALL cannot transfer value
            .create => |params| params.value > 0,
            .create2 => |params| params.value > 0,
        };
    }

    /// Check if this is a read-only operation
    pub fn isReadOnly(self: CallParams) bool {
        return switch (self) {
            .staticcall => true,
            else => false,
        };
    }

    /// Check if this is a contract creation operation
    pub fn isCreate(self: CallParams) bool {
        return switch (self) {
            .create, .create2 => true,
            else => false,
        };
    }
};

const std = @import("std");

test "call params gas access" {
    const caller = primitives.ZERO_ADDRESS;
    const to: Address = [_]u8{1} ++ [_]u8{0} ** 19;
    const input = &[_]u8{0x42};

    const call_op = CallParams{ .call = .{
        .caller = caller,
        .to = to,
        .value = 100,
        .input = input,
        .gas = 21000,
    } };
    try std.testing.expectEqual(@as(u64, 21000), call_op.getGas());

    const delegatecall_op = CallParams{ .delegatecall = .{
        .caller = caller,
        .to = to,
        .input = input,
        .gas = 15000,
    } };
    try std.testing.expectEqual(@as(u64, 15000), delegatecall_op.getGas());
}

test "call params caller access" {
    const caller: Address = [_]u8{0xaa} ++ [_]u8{0} ** 19;
    const to: Address = [_]u8{1} ++ [_]u8{0} ** 19;

    const call_op = CallParams{ .call = .{
        .caller = caller,
        .to = to,
        .value = 0,
        .input = &.{},
        .gas = 21000,
    } };
    try std.testing.expectEqual(caller, call_op.getCaller());

    const create_op = CallParams{ .create = .{
        .caller = caller,
        .value = 50,
        .init_code = &[_]u8{ 0x60, 0x00, 0x60, 0x00, 0xf3 },
        .gas = 53000,
    } };
    try std.testing.expectEqual(caller, create_op.getCaller());
}

test "call params input access" {
    const caller = primitives.ZERO_ADDRESS;
    const to: Address = [_]u8{1} ++ [_]u8{0} ** 19;
    const input_data = &[_]u8{ 0xa9, 0x05, 0x9c, 0xbb }; // transfer(address,uint256) selector

    const call_op = CallParams{ .call = .{
        .caller = caller,
        .to = to,
        .value = 0,
        .input = input_data,
        .gas = 21000,
    } };
    try std.testing.expectEqualSlices(u8, input_data, call_op.getInput());

    const init_code = &[_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };
    const create_op = CallParams{ .create = .{
        .caller = caller,
        .value = 0,
        .init_code = init_code,
        .gas = 53000,
    } };
    try std.testing.expectEqualSlices(u8, init_code, create_op.getInput());
}

test "call params has value checks" {
    const caller = primitives.ZERO_ADDRESS;
    const to: Address = [_]u8{1} ++ [_]u8{0} ** 19;
    const input = &[_]u8{};

    // CALL with value
    const call_with_value = CallParams{ .call = .{
        .caller = caller,
        .to = to,
        .value = 1000,
        .input = input,
        .gas = 21000,
    } };
    try std.testing.expect(call_with_value.hasValue());

    // CALL without value
    const call_no_value = CallParams{ .call = .{
        .caller = caller,
        .to = to,
        .value = 0,
        .input = input,
        .gas = 21000,
    } };
    try std.testing.expect(!call_no_value.hasValue());

    // DELEGATECALL never has value
    const delegatecall_op = CallParams{ .delegatecall = .{
        .caller = caller,
        .to = to,
        .input = input,
        .gas = 21000,
    } };
    try std.testing.expect(!delegatecall_op.hasValue());

    // STATICCALL never has value
    const staticcall_op = CallParams{ .staticcall = .{
        .caller = caller,
        .to = to,
        .input = input,
        .gas = 21000,
    } };
    try std.testing.expect(!staticcall_op.hasValue());

    // CREATE with value
    const create_with_value = CallParams{ .create = .{
        .caller = caller,
        .value = 500,
        .init_code = &[_]u8{0x00},
        .gas = 53000,
    } };
    try std.testing.expect(create_with_value.hasValue());
}

test "call params read only checks" {
    const caller = primitives.ZERO_ADDRESS;
    const to: Address = [_]u8{1} ++ [_]u8{0} ** 19;
    const input = &[_]u8{};

    // Only STATICCALL is read-only
    const staticcall_op = CallParams{ .staticcall = .{
        .caller = caller,
        .to = to,
        .input = input,
        .gas = 21000,
    } };
    try std.testing.expect(staticcall_op.isReadOnly());

    // Regular CALL is not read-only
    const call_op = CallParams{ .call = .{
        .caller = caller,
        .to = to,
        .value = 0,
        .input = input,
        .gas = 21000,
    } };
    try std.testing.expect(!call_op.isReadOnly());

    // DELEGATECALL is not read-only
    const delegatecall_op = CallParams{ .delegatecall = .{
        .caller = caller,
        .to = to,
        .input = input,
        .gas = 21000,
    } };
    try std.testing.expect(!delegatecall_op.isReadOnly());
}

test "call params create checks" {
    const caller = primitives.ZERO_ADDRESS;
    const to: Address = [_]u8{1} ++ [_]u8{0} ** 19;
    const init_code = &[_]u8{ 0x60, 0x00, 0x60, 0x00, 0xf3 };

    // CREATE operations
    const create_op = CallParams{ .create = .{
        .caller = caller,
        .value = 0,
        .init_code = init_code,
        .gas = 53000,
    } };
    try std.testing.expect(create_op.isCreate());

    const create2_op = CallParams{ .create2 = .{
        .caller = caller,
        .value = 0,
        .init_code = init_code,
        .salt = 0x123456789abcdef,
        .gas = 53000,
    } };
    try std.testing.expect(create2_op.isCreate());

    // Non-CREATE operations
    const call_op = CallParams{ .call = .{
        .caller = caller,
        .to = to,
        .value = 0,
        .input = &[_]u8{},
        .gas = 21000,
    } };
    try std.testing.expect(!call_op.isCreate());
}

test "call params edge cases" {
    const caller: Address = [_]u8{0xff} ** 20; // Maximum address
    const to: Address = [_]u8{1} ++ [_]u8{0} ** 19;

    // Maximum gas
    const max_gas_call = CallParams{ .call = .{
        .caller = caller,
        .to = to,
        .value = std.math.maxInt(u256),
        .input = &[_]u8{},
        .gas = std.math.maxInt(u64),
    } };
    try std.testing.expectEqual(std.math.maxInt(u64), max_gas_call.getGas());
    try std.testing.expect(max_gas_call.hasValue());

    // CREATE2 with maximum salt
    const create2_max_salt = CallParams{ .create2 = .{
        .caller = caller,
        .value = 0,
        .init_code = &[_]u8{0x00},
        .salt = std.math.maxInt(u256),
        .gas = 100000,
    } };
    try std.testing.expect(create2_max_salt.isCreate());
    try std.testing.expect(!create2_max_salt.hasValue());

    // Empty input data
    const call_empty_input = CallParams{
        .call = .{
            .caller = caller,
            .to = to,
            .value = 0,
            .input = &[_]u8{}, // Empty slice
            .gas = 21000,
        },
    };
    try std.testing.expectEqual(@as(usize, 0), call_empty_input.getInput().len);
}
