const std = @import("std");
const testing = std.testing;
const crypto = std.crypto;
const Allocator = std.mem.Allocator;

// Simple type definitions that we need - avoiding complex imports
pub const Address = [20]u8;
pub const Hash = [32]u8;

// Error types for ABI operations
pub const AbiError = error{
    InvalidLength,
    InvalidType,
    InvalidData,
    InvalidSelector,
    DataTooSmall,
    ZeroData,
    OutOfBounds,
    InvalidAddress,
    InvalidUtf8,
    NotImplemented,
    OutOfMemory,
};

// Cursor for reading bytes
const Cursor = struct {
    data: []const u8,
    position: usize,

    pub fn init(data: []const u8) Cursor {
        return Cursor{
            .data = data,
            .position = 0,
        };
    }

    pub fn set_position(self: *Cursor, pos: usize) void {
        self.position = pos;
    }

    pub fn read_bytes(self: *Cursor, len: usize) AbiError![]const u8 {
        if (self.position + len > self.data.len) return AbiError.OutOfBounds;
        const result = self.data[self.position .. self.position + len];
        self.position += len;
        return result;
    }

    pub fn read_u32_word(self: *Cursor) AbiError!u32 {
        const bytes = try self.read_bytes(32);
        return std.mem.readInt(u32, bytes[28..32], .big);
    }

    pub fn read_u64_word(self: *Cursor) AbiError!u64 {
        const bytes = try self.read_bytes(32);
        return std.mem.readInt(u64, bytes[24..32], .big);
    }

    pub fn read_u256_word(self: *Cursor) AbiError!u256 {
        const bytes = try self.read_bytes(32);
        return std.mem.readInt(u256, bytes[0..32], .big);
    }

    pub fn read_word(self: *Cursor) AbiError![32]u8 {
        const bytes = try self.read_bytes(32);
        var result: [32]u8 = undefined;
        @memcpy(&result, bytes);
        return result;
    }

    pub fn at_position(self: *const Cursor, pos: usize) Cursor {
        return Cursor{
            .data = self.data,
            .position = pos,
        };
    }
};

// ABI Types
pub const AbiType = enum {
    // Elementary types
    uint8,
    uint16,
    uint32,
    uint64,
    uint128,
    uint256,
    int8,
    int16,
    int32,
    int64,
    int128,
    int256,
    address,
    bool,
    bytes1,
    bytes2,
    bytes3,
    bytes4,
    bytes8,
    bytes16,
    bytes32,
    // Dynamic types
    bytes,
    string,
    // Array types
    uint256_array,
    bytes32_array,
    address_array,
    string_array,

    pub fn is_dynamic(self: AbiType) bool {
        return switch (self) {
            .bytes, .string, .uint256_array, .bytes32_array, .address_array, .string_array => true,
            else => false,
        };
    }

    pub fn size(self: AbiType) ?usize {
        return switch (self) {
            .uint8, .int8 => 1,
            .uint16, .int16 => 2,
            .uint32, .int32 => 4,
            .uint64, .int64 => 8,
            .uint128, .int128 => 16,
            .uint256, .int256 => 32,
            .address => 20,
            .bool => 1,
            .bytes1 => 1,
            .bytes2 => 2,
            .bytes3 => 3,
            .bytes4 => 4,
            .bytes8 => 8,
            .bytes16 => 16,
            .bytes32 => 32,
            .bytes, .string, .uint256_array, .bytes32_array, .address_array, .string_array => null,
        };
    }

    pub fn get_type(self: AbiType) []const u8 {
        return switch (self) {
            .uint8 => "uint8",
            .uint16 => "uint16",
            .uint32 => "uint32",
            .uint64 => "uint64",
            .uint128 => "uint128",
            .uint256 => "uint256",
            .int8 => "int8",
            .int16 => "int16",
            .int32 => "int32",
            .int64 => "int64",
            .int128 => "int128",
            .int256 => "int256",
            .address => "address",
            .bool => "bool",
            .bytes1 => "bytes1",
            .bytes2 => "bytes2",
            .bytes3 => "bytes3",
            .bytes4 => "bytes4",
            .bytes8 => "bytes8",
            .bytes16 => "bytes16",
            .bytes32 => "bytes32",
            .bytes => "bytes",
            .string => "string",
            .uint256_array => "uint256[]",
            .bytes32_array => "bytes32[]",
            .address_array => "address[]",
            .string_array => "string[]",
        };
    }
};

// ABI Value union
pub const AbiValue = union(AbiType) {
    uint8: u8,
    uint16: u16,
    uint32: u32,
    uint64: u64,
    uint128: u128,
    uint256: u256,
    int8: i8,
    int16: i16,
    int32: i32,
    int64: i64,
    int128: i128,
    int256: i256,
    address: Address,
    bool: bool,
    bytes1: [1]u8,
    bytes2: [2]u8,
    bytes3: [3]u8,
    bytes4: [4]u8,
    bytes8: [8]u8,
    bytes16: [16]u8,
    bytes32: [32]u8,
    bytes: []const u8,
    string: []const u8,
    uint256_array: []const u256,
    bytes32_array: []const [32]u8,
    address_array: []const Address,
    string_array: []const []const u8,

    pub fn get_type(self: AbiValue) AbiType {
        return switch (self) {
            .uint8 => .uint8,
            .uint16 => .uint16,
            .uint32 => .uint32,
            .uint64 => .uint64,
            .uint128 => .uint128,
            .uint256 => .uint256,
            .int8 => .int8,
            .int16 => .int16,
            .int32 => .int32,
            .int64 => .int64,
            .int128 => .int128,
            .int256 => .int256,
            .address => .address,
            .bool => .bool,
            .bytes1 => .bytes1,
            .bytes2 => .bytes2,
            .bytes3 => .bytes3,
            .bytes4 => .bytes4,
            .bytes8 => .bytes8,
            .bytes16 => .bytes16,
            .bytes32 => .bytes32,
            .bytes => .bytes,
            .string => .string,
            .uint256_array => .uint256_array,
            .bytes32_array => .bytes32_array,
            .address_array => .address_array,
            .string_array => .string_array,
        };
    }
};

// Helper functions to create AbiValue instances
pub fn uint256_value(val: u256) AbiValue {
    return AbiValue{ .uint256 = val };
}

pub fn bool_value(val: bool) AbiValue {
    return AbiValue{ .bool = val };
}

pub fn address_value(val: Address) AbiValue {
    return AbiValue{ .address = val };
}

pub fn string_value(val: []const u8) AbiValue {
    return AbiValue{ .string = val };
}

pub fn bytes_value(val: []const u8) AbiValue {
    return AbiValue{ .bytes = val };
}

// Function selector type
pub const Selector = [4]u8;

// Compute function selector from signature
pub fn compute_selector(signature: []const u8) Selector {
    var hash: [32]u8 = undefined;
    crypto.hash.sha3.Keccak256.hash(signature, &hash, .{});
    return hash[0..4].*;
}

// Create function signature from name and types
pub fn create_function_signature(allocator: Allocator, name: []const u8, types: []const AbiType) ![]u8 {
    var signature = std.ArrayList(u8).init(allocator);
    defer signature.deinit();

    try signature.appendSlice(name);
    try signature.append('(');

    for (types, 0..) |abi_type, i| {
        if (i > 0) try signature.append(',');
        try signature.appendSlice(abi_type.get_type());
    }

    try signature.append(')');
    return signature.toOwnedSlice();
}

// ABI Decoding Functions

// Decode individual parameter types
fn decode_uint(cursor: *Cursor, comptime T: type, comptime bits: u16) AbiError!T {
    if (bits > 256 or bits % 8 != 0) return AbiError.InvalidType;

    const word = try cursor.read_word();
    const bytes_len = bits / 8;
    const start_offset = 32 - bytes_len;

    if (T == u256) {
        return std.mem.readInt(u256, &word, .big);
    } else {
        return std.mem.readInt(T, word[start_offset..32], .big);
    }
}

fn decode_int(cursor: *Cursor, comptime T: type, comptime bits: u16) AbiError!T {
    if (bits > 256 or bits % 8 != 0) return AbiError.InvalidType;

    const word = try cursor.read_word();
    const bytes_len = bits / 8;
    const start_offset = 32 - bytes_len;

    if (T == i256) {
        // For i256, we need special handling since Zig doesn't have i256
        return AbiError.NotImplemented;
    } else {
        const unsigned = std.mem.readInt(std.meta.Int(.unsigned, @bitSizeOf(T)), word[start_offset..32], .big);
        return @bitCast(unsigned);
    }
}

fn decode_address(cursor: *Cursor) AbiError!Address {
    const word = try cursor.read_word();
    var address: Address = undefined;
    @memcpy(&address, word[12..32]);
    return address;
}

fn decode_bool(cursor: *Cursor) AbiError!bool {
    const word = try cursor.read_word();
    return word[31] != 0;
}

fn decode_bytes_fixed(cursor: *Cursor, comptime size: usize) AbiError![size]u8 {
    const word = try cursor.read_word();
    var result: [size]u8 = undefined;
    @memcpy(&result, word[0..size]);
    return result;
}

fn decode_bytes_dynamic(allocator: Allocator, cursor: *Cursor, static_position: usize) AbiError![]u8 {
    const offset = try cursor.read_u256_word();
    var offset_cursor = cursor.at_position(static_position + @as(usize, @intCast(offset)));

    const length = try offset_cursor.read_u256_word();
    const length_usize = @as(usize, @intCast(length));

    if (length_usize == 0) {
        return try allocator.alloc(u8, 0);
    }

    // Calculate padded length (round up to 32-byte boundary)
    const padded_length = ((length_usize + 31) / 32) * 32;
    const data = try offset_cursor.read_bytes(padded_length);

    // Only return the actual data, not the padding
    const result = try allocator.alloc(u8, length_usize);
    @memcpy(result, data[0..length_usize]);
    return result;
}

fn decode_string(allocator: Allocator, cursor: *Cursor, static_position: usize) AbiError![]u8 {
    const bytes = try decode_bytes_dynamic(allocator, cursor, static_position);
    // Validate UTF-8
    if (!std.unicode.utf8ValidateSlice(bytes)) {
        allocator.free(bytes);
        return AbiError.InvalidUtf8;
    }
    return bytes;
}

fn decode_array(allocator: Allocator, cursor: *Cursor, element_type: AbiType, static_position: usize) AbiError![]AbiValue {
    const offset = try cursor.read_u256_word();
    var offset_cursor = cursor.at_position(static_position + @as(usize, @intCast(offset)));

    const length = try offset_cursor.read_u256_word();
    const length_usize = @as(usize, @intCast(length));

    var result = try allocator.alloc(AbiValue, length_usize);
    errdefer allocator.free(result);

    for (0..length_usize) |i| {
        result[i] = try decode_parameter(allocator, &offset_cursor, element_type, static_position);
    }

    return result;
}

fn decode_parameter(allocator: Allocator, cursor: *Cursor, abi_type: AbiType, static_position: usize) AbiError!AbiValue {
    return switch (abi_type) {
        .uint8 => AbiValue{ .uint8 = try decode_uint(cursor, u8, 8) },
        .uint16 => AbiValue{ .uint16 = try decode_uint(cursor, u16, 16) },
        .uint32 => AbiValue{ .uint32 = try decode_uint(cursor, u32, 32) },
        .uint64 => AbiValue{ .uint64 = try decode_uint(cursor, u64, 64) },
        .uint128 => AbiValue{ .uint128 = try decode_uint(cursor, u128, 128) },
        .uint256 => AbiValue{ .uint256 = try decode_uint(cursor, u256, 256) },
        .int8 => AbiValue{ .int8 = try decode_int(cursor, i8, 8) },
        .int16 => AbiValue{ .int16 = try decode_int(cursor, i16, 16) },
        .int32 => AbiValue{ .int32 = try decode_int(cursor, i32, 32) },
        .int64 => AbiValue{ .int64 = try decode_int(cursor, i64, 64) },
        .int128 => AbiValue{ .int128 = try decode_int(cursor, i128, 128) },
        .int256 => return AbiError.NotImplemented, // i256 not supported in Zig
        .address => AbiValue{ .address = try decode_address(cursor) },
        .bool => AbiValue{ .bool = try decode_bool(cursor) },
        .bytes1 => AbiValue{ .bytes1 = try decode_bytes_fixed(cursor, 1) },
        .bytes2 => AbiValue{ .bytes2 = try decode_bytes_fixed(cursor, 2) },
        .bytes3 => AbiValue{ .bytes3 = try decode_bytes_fixed(cursor, 3) },
        .bytes4 => AbiValue{ .bytes4 = try decode_bytes_fixed(cursor, 4) },
        .bytes8 => AbiValue{ .bytes8 = try decode_bytes_fixed(cursor, 8) },
        .bytes16 => AbiValue{ .bytes16 = try decode_bytes_fixed(cursor, 16) },
        .bytes32 => AbiValue{ .bytes32 = try decode_bytes_fixed(cursor, 32) },
        .bytes => AbiValue{ .bytes = try decode_bytes_dynamic(allocator, cursor, static_position) },
        .string => AbiValue{ .string = try decode_string(allocator, cursor, static_position) },
        .uint256_array => {
            const array_values = try decode_array(allocator, cursor, .uint256, static_position);
            defer allocator.free(array_values);

            var result = try allocator.alloc(u256, array_values.len);
            for (array_values, 0..) |value, i| {
                result[i] = value.uint256;
            }
            return AbiValue{ .uint256_array = result };
        },
        else => AbiError.NotImplemented,
    };
}

// Main ABI decoding function
pub fn decode_abi_parameters(allocator: Allocator, data: []const u8, types: []const AbiType) ![]AbiValue {
    if (data.len == 0 and types.len > 0) return AbiError.ZeroData;
    if (data.len > 0 and data.len < 32) return AbiError.DataTooSmall;
    if (types.len == 0) return try allocator.alloc(AbiValue, 0);

    var cursor = Cursor.init(data);
    var result = try allocator.alloc(AbiValue, types.len);
    errdefer allocator.free(result);

    var consumed: usize = 0;
    for (types, 0..) |abi_type, i| {
        cursor.set_position(consumed);
        result[i] = try decode_parameter(allocator, &cursor, abi_type, 0);
        consumed += 32; // Each parameter takes 32 bytes in the static part
    }

    return result;
}

// Decode function data (selector + parameters)
pub fn decode_function_data(allocator: Allocator, data: []const u8, types: []const AbiType) AbiError!struct { selector: Selector, parameters: []AbiValue } {
    if (data.len < 4) return AbiError.InvalidLength;

    const selector: Selector = data[0..4].*;
    const parameters = try decode_abi_parameters(allocator, data[4..], types);

    return .{
        .selector = selector,
        .parameters = parameters,
    };
}

// Simple ABI encoding for basic types
pub fn encode_abi_parameters(allocator: Allocator, values: []const AbiValue) ![]u8 {
    if (values.len == 0) return try allocator.alloc(u8, 0);

    var result = std.ArrayList(u8).init(allocator);
    defer result.deinit();

    // Simple implementation - just encode each value as 32 bytes
    for (values) |value| {
        var encoded_value = try allocator.alloc(u8, 32);
        defer allocator.free(encoded_value);
        @memset(encoded_value, 0);

        switch (value) {
            .uint256 => |val| {
                // Convert u256 to bytes (big-endian)
                var bytes: [32]u8 = undefined;
                std.mem.writeInt(u256, &bytes, val, .big);
                @memcpy(encoded_value, &bytes);
            },
            .uint64 => |val| {
                // Convert u64 to bytes (big-endian, padded to 32 bytes)
                var bytes: [8]u8 = undefined;
                std.mem.writeInt(u64, &bytes, val, .big);
                @memcpy(encoded_value[24..32], &bytes);
            },
            .uint32 => |val| {
                // Convert u32 to bytes (big-endian, padded to 32 bytes)
                var bytes: [4]u8 = undefined;
                std.mem.writeInt(u32, &bytes, val, .big);
                @memcpy(encoded_value[28..32], &bytes);
            },
            .bool => |val| {
                encoded_value[31] = if (val) 1 else 0;
            },
            .address => |val| {
                // Address is 20 bytes, padded to 32 bytes
                @memcpy(encoded_value[12..32], &val);
            },
            .string => |val| {
                // For strings, we'll just copy the first 32 bytes
                const copy_len = @min(val.len, 32);
                @memcpy(encoded_value[0..copy_len], val[0..copy_len]);
            },
            else => {
                // For other types, leave as zeros
            },
        }

        try result.appendSlice(encoded_value);
    }

    return result.toOwnedSlice();
}

// Encode function data (selector + parameters)
pub fn encode_function_data(allocator: Allocator, selector: Selector, parameters: []const AbiValue) ![]u8 {
    const encoded_params = try encode_abi_parameters(allocator, parameters);
    defer allocator.free(encoded_params);

    var result = try allocator.alloc(u8, 4 + encoded_params.len);
    @memcpy(result[0..4], &selector);
    @memcpy(result[4..], encoded_params);

    return result;
}

// Encode event topics
pub fn encode_event_topics(allocator: Allocator, event_signature: []const u8, indexed_values: []const AbiValue) ![][]u8 {
    var topics = std.ArrayList([]u8).init(allocator);
    defer topics.deinit();

    // First topic is the event signature hash
    var signature_hash: [32]u8 = undefined;
    crypto.hash.sha3.Keccak256.hash(event_signature, &signature_hash, .{});
    const first_topic = try allocator.alloc(u8, 32);
    @memcpy(first_topic, &signature_hash);
    try topics.append(first_topic);

    // Add indexed parameters as topics
    for (indexed_values) |value| {
        var topic = try allocator.alloc(u8, 32);
        @memset(topic, 0);

        switch (value) {
            .address => |addr| {
                @memcpy(topic[12..32], &addr);
            },
            .uint256 => |val| {
                var bytes: [32]u8 = undefined;
                std.mem.writeInt(u256, &bytes, val, .big);
                @memcpy(topic, &bytes);
            },
            else => {
                // For other types, leave as zeros
            },
        }

        try topics.append(topic);
    }

    return topics.toOwnedSlice();
}

// Simple packed encoding
pub fn encode_packed(allocator: Allocator, values: []const AbiValue) ![]u8 {
    var result = std.ArrayList(u8).init(allocator);
    defer result.deinit();

    for (values) |value| {
        switch (value) {
            .uint8 => |val| {
                try result.append(val);
            },
            .uint16 => |val| {
                var bytes: [2]u8 = undefined;
                std.mem.writeInt(u16, &bytes, val, .big);
                try result.appendSlice(&bytes);
            },
            .uint32 => |val| {
                var bytes: [4]u8 = undefined;
                std.mem.writeInt(u32, &bytes, val, .big);
                try result.appendSlice(&bytes);
            },
            .string => |val| {
                try result.appendSlice(val);
            },
            else => {
                // For other types, skip or handle as needed
            },
        }
    }

    return result.toOwnedSlice();
}

// Gas estimation for call data
pub fn estimate_gas_for_data(data: []const u8) u64 {
    var gas: u64 = 21000; // Base transaction cost

    for (data) |byte| {
        if (byte == 0) {
            gas += 4; // Zero bytes cost 4 gas
        } else {
            gas += 16; // Non-zero bytes cost 16 gas
        }
    }

    return gas;
}

// Common selectors
pub const CommonSelectors = struct {
    pub const ERC20_TRANSFER = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    pub const ERC20_BALANCE_OF = [_]u8{ 0x70, 0xa0, 0x82, 0x31 };
    pub const ERC20_APPROVE = [_]u8{ 0x09, 0x5e, 0xa7, 0xb3 };
    pub const ERC20_TOTAL_SUPPLY = [_]u8{ 0x18, 0x16, 0x0d, 0xdd };
};

// Function definition structure
pub const FunctionDefinition = struct {
    name: []const u8,
    inputs: []const AbiType,
    outputs: []const AbiType,
    stateMutability: StateMutability,

    pub fn get_selector(self: FunctionDefinition, allocator: Allocator) !Selector {
        const signature = try create_function_signature(allocator, self.name, self.inputs);
        defer allocator.free(signature);
        return compute_selector(signature);
    }
};

pub const StateMutability = enum {
    pure,
    view,
    nonpayable,
    payable,
};

// Common patterns
pub const CommonPatterns = struct {
    pub fn erc20_transfer() FunctionDefinition {
        return FunctionDefinition{
            .name = "transfer",
            .inputs = &[_]AbiType{ .address, .uint256 },
            .outputs = &[_]AbiType{.bool},
            .stateMutability = .nonpayable,
        };
    }

    pub fn erc20_balance_of() FunctionDefinition {
        return FunctionDefinition{
            .name = "balanceOf",
            .inputs = &[_]AbiType{.address},
            .outputs = &[_]AbiType{.uint256},
            .stateMutability = .view,
        };
    }
};

// Tests
test "basic ABI encoding" {
    const allocator = testing.allocator;

    const values = [_]AbiValue{
        uint256_value(42),
        bool_value(true),
    };

    const encoded = try encode_abi_parameters(allocator, &values);
    defer allocator.free(encoded);

    try testing.expectEqual(@as(usize, 64), encoded.len); // 2 * 32 bytes
}

test "basic ABI decoding" {
    const allocator = testing.allocator;

    // Test decoding uint256
    const uint256_data = [_]u8{0} ** 28 ++ [_]u8{ 0x00, 0x00, 0x00, 0x2A }; // 42 in big-endian
    const types = [_]AbiType{.uint256};

    const decoded = try decode_abi_parameters(allocator, &uint256_data, &types);
    defer {
        for (decoded) |value| {
            switch (value) {
                .string, .bytes => |slice| allocator.free(slice),
                else => {},
            }
        }
        allocator.free(decoded);
    }

    try testing.expectEqual(@as(usize, 1), decoded.len);
    try testing.expectEqual(@as(u256, 42), decoded[0].uint256);
}

test "function selector computation" {
    const selector = compute_selector("transfer(address,uint256)");

    // This should match the known ERC20 transfer selector
    const expected = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try testing.expectEqualSlices(u8, &expected, &selector);
}

test "function data encoding" {
    const allocator = testing.allocator;

    const selector = compute_selector("transfer(address,uint256)");
    const params = [_]AbiValue{
        address_value([_]u8{0x12} ** 20),
        uint256_value(1000),
    };

    const encoded = try encode_function_data(allocator, selector, &params);
    defer allocator.free(encoded);

    try testing.expectEqual(@as(usize, 68), encoded.len); // 4 + 64 bytes
    try testing.expectEqualSlices(u8, &selector, encoded[0..4]);
}

test "packed encoding" {
    const allocator = testing.allocator;

    const values = [_]AbiValue{
        AbiValue{ .uint8 = 0x12 },
        AbiValue{ .uint16 = 0x3456 },
        string_value("test"),
    };

    const packed_data = try encode_packed(allocator, &values);
    defer allocator.free(packed_data);

    try testing.expectEqual(@as(usize, 7), packed_data.len); // 1 + 2 + 4 bytes
    try testing.expectEqual(@as(u8, 0x12), packed_data[0]);
    try testing.expectEqual(@as(u8, 0x34), packed_data[1]);
    try testing.expectEqual(@as(u8, 0x56), packed_data[2]);
    try testing.expectEqualSlices(u8, "test", packed_data[3..7]);
}

test "gas estimation" {
    const data = &[_]u8{ 0x00, 0x01, 0x02, 0x00, 0x03 };
    const gas = estimate_gas_for_data(data);

    // 21000 + 4 + 16 + 16 + 4 + 16 = 21056
    try testing.expectEqual(@as(u64, 21056), gas);
}

test "common selectors" {
    const transfer_selector = CommonSelectors.ERC20_TRANSFER;
    const expected_transfer = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try testing.expectEqualSlices(u8, &expected_transfer, &transfer_selector);

    const balance_selector = CommonSelectors.ERC20_BALANCE_OF;
    const expected_balance = [_]u8{ 0x70, 0xa0, 0x82, 0x31 };
    try testing.expectEqualSlices(u8, &expected_balance, &balance_selector);
}

// Encode function result (return values)
pub fn encode_function_result(allocator: Allocator, return_values: []const AbiValue) ![]u8 {
    return encode_abi_parameters(allocator, return_values);
}

// Decode function result (return values)
pub fn decode_function_result(allocator: Allocator, data: []const u8, output_types: []const AbiType) ![]AbiValue {
    return decode_abi_parameters(allocator, data, output_types);
}

// Encode error result (selector + error parameters)
pub fn encode_error_result(allocator: Allocator, error_selector: Selector, error_params: []const AbiValue) ![]u8 {
    const encoded_params = try encode_abi_parameters(allocator, error_params);
    defer allocator.free(encoded_params);

    var result = try allocator.alloc(u8, 4 + encoded_params.len);
    @memcpy(result[0..4], &error_selector);
    @memcpy(result[4..], encoded_params);

    return result;
}

// Function result structure
pub const FunctionResult = struct {
    success: bool,
    return_data: []const u8,
    gas_used: ?u64 = null,

    pub fn deinit(self: *FunctionResult, allocator: Allocator) void {
        allocator.free(self.return_data);
    }
};

// Error result structure
pub const ErrorResult = struct {
    selector: Selector,
    error_data: []const u8,
    decoded_params: ?[]AbiValue = null,

    pub fn deinit(self: *ErrorResult, allocator: Allocator) void {
        allocator.free(self.error_data);
        if (self.decoded_params) |params| {
            for (params) |param| {
                switch (param) {
                    .string, .bytes => |slice| allocator.free(slice),
                    .uint256_array => |arr| allocator.free(arr),
                    .bytes32_array => |arr| allocator.free(arr),
                    .address_array => |arr| allocator.free(arr),
                    .string_array => |arr| {
                        for (arr) |str| allocator.free(str);
                        allocator.free(arr);
                    },
                    else => {},
                }
            }
            allocator.free(params);
        }
    }
};

// Helper function to create a function result from raw data
pub fn create_function_result(allocator: Allocator, success: bool, return_data: []const u8, gas_used: ?u64) !FunctionResult {
    return FunctionResult{
        .success = success,
        .return_data = try allocator.dupe(u8, return_data),
        .gas_used = gas_used,
    };
}

// Helper function to decode a function result
pub fn decode_function_result_with_types(allocator: Allocator, result: FunctionResult, output_types: []const AbiType) ![]AbiValue {
    if (!result.success) {
        return AbiError.InvalidData;
    }

    return decode_function_result(allocator, result.return_data, output_types);
}

// Helper function to create an error result
pub fn create_error_result(allocator: Allocator, selector: Selector, error_data: []const u8) !ErrorResult {
    return ErrorResult{
        .selector = selector,
        .error_data = try allocator.dupe(u8, error_data),
        .decoded_params = null,
    };
}

// Helper function to decode an error result
pub fn decode_error_result_with_types(allocator: Allocator, error_result: *ErrorResult, error_types: []const AbiType) !void {
    if (error_result.error_data.len < 4) return AbiError.InvalidLength;

    const selector: Selector = error_result.error_data[0..4].*;
    if (!std.mem.eql(u8, &selector, &error_result.selector)) {
        return AbiError.InvalidSelector;
    }

    error_result.decoded_params = try decode_abi_parameters(allocator, error_result.error_data[4..], error_types);
}

test "encode function result" {
    const allocator = testing.allocator;

    const return_values = [_]AbiValue{
        bool_value(true),
        uint256_value(1000),
    };

    const encoded = try encode_function_result(allocator, &return_values);
    defer allocator.free(encoded);

    try testing.expectEqual(@as(usize, 64), encoded.len); // 2 * 32 bytes
}

test "decode function result" {
    const allocator = testing.allocator;

    // Encode first
    const return_values = [_]AbiValue{
        bool_value(true),
        uint256_value(1000),
    };

    const encoded = try encode_function_result(allocator, &return_values);
    defer allocator.free(encoded);

    // Then decode
    const output_types = [_]AbiType{ .bool, .uint256 };
    const decoded = try decode_function_result(allocator, encoded, &output_types);
    defer {
        for (decoded) |value| {
            switch (value) {
                .string, .bytes => |slice| allocator.free(slice),
                else => {},
            }
        }
        allocator.free(decoded);
    }

    try testing.expectEqual(@as(usize, 2), decoded.len);
    try testing.expectEqual(true, decoded[0].bool);
    try testing.expectEqual(@as(u256, 1000), decoded[1].uint256);
}

test "encode error result" {
    const allocator = testing.allocator;

    const error_selector = compute_selector("InsufficientBalance(uint256,uint256)");
    const error_params = [_]AbiValue{
        uint256_value(100), // requested
        uint256_value(50), // available
    };

    const encoded = try encode_error_result(allocator, error_selector, &error_params);
    defer allocator.free(encoded);

    try testing.expectEqual(@as(usize, 68), encoded.len); // 4 + 64 bytes
    try testing.expectEqualSlices(u8, &error_selector, encoded[0..4]);
}

test "function result roundtrip" {
    const allocator = testing.allocator;

    const return_data = "Hello, World!";
    const result = try create_function_result(allocator, true, return_data, 21000);
    defer {
        var mut_result = result;
        mut_result.deinit(allocator);
    }

    try testing.expect(result.success);
    try testing.expectEqualSlices(u8, return_data, result.return_data);
    try testing.expectEqual(@as(u64, 21000), result.gas_used.?);
}

test "error result roundtrip" {
    const allocator = testing.allocator;

    const error_selector = compute_selector("CustomError(string)");
    const error_data = "Something went wrong";

    var error_result = try create_error_result(allocator, error_selector, error_data);
    defer error_result.deinit(allocator);

    try testing.expectEqualSlices(u8, &error_selector, &error_result.selector);
    try testing.expectEqualSlices(u8, error_data, error_result.error_data);
}
