const std = @import("std");
const address = @import("address.zig");
const crypto_pkg = @import("crypto");
const hash = crypto_pkg.Hash;

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
        return bytes[0..32].*;
    }

    pub fn at_position(self: *const Cursor, pos: usize) Cursor {
        return Cursor{
            .data = self.data,
            .position = pos,
        };
    }
};

pub const AbiType = enum {
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
            .string, .bytes, .array => true,
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
    address: address.Address,
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
    address_array: []const address.Address,
    string_array: []const []const u8,

    pub fn get_type(self: AbiValue) AbiType {
        return switch (self) {
            .uint8 => .uint8,
            .uint16 => .uint16,
            .uint32 => .uint32,
            .uint64 => .uint64,
            .uint256 => .uint256,
            .int8 => .int8,
            .int16 => .int16,
            .int32 => .int32,
            .int64 => .int64,
            .int256 => .int256,
            .bool => .bool,
            .address => .address,
            .bytes1 => .bytes1,
            .bytes4 => .bytes4,
            .bytes8 => .bytes8,
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

pub fn uint256_value(val: u256) AbiValue {
    return .{ .uint256 = val };
}
pub fn bool_value(val: bool) AbiValue {
    return .{ .bool = val };
}
pub fn address_value(val: address.Address) AbiValue {
    return .{ .address = val };
}
pub fn string_value(val: []const u8) AbiValue {
    return .{ .string = val };
}
pub fn bytes_value(val: []const u8) AbiValue {
    return .{ .bytes = val };
}

pub const Selector = [4]u8;

pub fn compute_selector(signature: []const u8) Selector {
    var hash_result: [32]u8 = undefined;
    std.crypto.hash.sha3.Keccak256.hash(signature, &hash_result, .{});
    return hash_result[0..4].*;
}

pub fn create_function_signature(allocator: std.mem.Allocator, name: []const u8, types: []const AbiType) ![]u8 {
    var signature = std.array_list.AlignedManaged(u8, null).init(allocator);
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

fn decode_address(cursor: *Cursor) AbiError!address.Address {
    const word = try cursor.read_word();
    var address_result: address.Address = undefined;
    @memcpy(&address_result, word[12..32]);
    return address_result;
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

fn decode_bytes_dynamic(allocator: std.mem.Allocator, cursor: *Cursor, static_position: usize) AbiError![]u8 {
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

fn decode_string(allocator: std.mem.Allocator, cursor: *Cursor, static_position: usize) AbiError![]u8 {
    const bytes = try decode_bytes_dynamic(allocator, cursor, static_position);
    // Validate UTF-8
    if (!std.unicode.utf8ValidateSlice(bytes)) {
        allocator.free(bytes);
        return AbiError.InvalidUtf8;
    }
    return bytes;
}

fn decode_array(allocator: std.mem.Allocator, cursor: *Cursor, element_type: AbiType, static_position: usize) AbiError![]AbiValue {
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

fn decode_parameter(allocator: std.mem.Allocator, cursor: *Cursor, abi_type: AbiType, static_position: usize) AbiError!AbiValue {
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
pub fn decode_abi_parameters(allocator: std.mem.Allocator, data: []const u8, types: []const AbiType) ![]AbiValue {
    if (data.len == 0 and types.len == 0) {
        return try allocator.alloc(AbiValue, 0);
    }

    if (data.len < types.len * 32) {
        return AbiError.DataTooSmall;
    }

    var cursor = Cursor.init(data);
    const result = try allocator.alloc(AbiValue, types.len);

    var consumed: usize = 0;
    for (types, 0..) |abi_type, i| {
        cursor.set_position(consumed);
        result[i] = try decode_parameter(allocator, &cursor, abi_type, 0);
        consumed += 32; // Each parameter takes 32 bytes in the static part
    }

    return result;
}

pub fn decode_function_data(allocator: std.mem.Allocator, data: []const u8, types: []const AbiType) AbiError!struct { selector: Selector, parameters: []AbiValue } {
    if (data.len < 4) return AbiError.DataTooSmall;

    const selector: Selector = data[0..4].*;
    const parameters = if (data.len > 4)
        try decode_abi_parameters(allocator, data[4..], types)
    else
        try allocator.alloc(AbiValue, 0);

    return .{
        .selector = selector,
        .parameters = parameters,
    };
}

// ABI Encoding Functions

// Helper to determine if a type is dynamic
fn is_dynamic(abi_type: AbiType) bool {
    return switch (abi_type) {
        .string, .bytes, .uint256_array, .bytes32_array, .address_array, .string_array => true,
        else => false,
    };
}

// Helper to get static size for static types
fn get_static_size(abi_type: AbiType) ?usize {
    return switch (abi_type) {
        .uint8, .uint16, .uint32, .uint64, .uint128, .uint256, .int8, .int16, .int32, .int64, .int128, .int256, .address, .bool, .bytes1, .bytes2, .bytes3, .bytes4, .bytes8, .bytes16, .bytes32 => 32,
        .string, .bytes, .uint256_array, .bytes32_array, .address_array, .string_array => null,
    };
}

// Encode a single static parameter
fn encode_static_parameter(allocator: std.mem.Allocator, value: AbiValue) ![]u8 {
    var result = try allocator.alloc(u8, 32);
    @memset(result, 0);

    switch (value) {
        .uint8 => |val| {
            result[31] = val;
        },
        .uint16 => |val| {
            var bytes: [2]u8 = undefined;
            std.mem.writeInt(u16, &bytes, val, .big);
            @memcpy(result[30..32], &bytes);
        },
        .uint32 => |val| {
            var bytes: [4]u8 = undefined;
            std.mem.writeInt(u32, &bytes, val, .big);
            @memcpy(result[28..32], &bytes);
        },
        .uint64 => |val| {
            var bytes: [8]u8 = undefined;
            std.mem.writeInt(u64, &bytes, val, .big);
            @memcpy(result[24..32], &bytes);
        },
        .uint128 => |val| {
            var bytes: [16]u8 = undefined;
            std.mem.writeInt(u128, &bytes, val, .big);
            @memcpy(result[16..32], &bytes);
        },
        .uint256 => |val| {
            var bytes: [32]u8 = undefined;
            std.mem.writeInt(u256, &bytes, val, .big);
            @memcpy(result, &bytes);
        },
        .int8 => |val| {
            const unsigned = @as(u8, @bitCast(val));
            result[31] = unsigned;
            // Sign extend for negative numbers
            if (val < 0) {
                @memset(result[0..31], 0xff);
            }
        },
        .int16 => |val| {
            const unsigned = @as(u16, @bitCast(val));
            var bytes: [2]u8 = undefined;
            std.mem.writeInt(u16, &bytes, unsigned, .big);
            @memcpy(result[30..32], &bytes);
            // Sign extend for negative numbers
            if (val < 0) {
                @memset(result[0..30], 0xff);
            }
        },
        .int32 => |val| {
            const unsigned = @as(u32, @bitCast(val));
            var bytes: [4]u8 = undefined;
            std.mem.writeInt(u32, &bytes, unsigned, .big);
            @memcpy(result[28..32], &bytes);
            // Sign extend for negative numbers
            if (val < 0) {
                @memset(result[0..28], 0xff);
            }
        },
        .int64 => |val| {
            const unsigned = @as(u64, @bitCast(val));
            var bytes: [8]u8 = undefined;
            std.mem.writeInt(u64, &bytes, unsigned, .big);
            @memcpy(result[24..32], &bytes);
            // Sign extend for negative numbers
            if (val < 0) {
                @memset(result[0..24], 0xff);
            }
        },
        .int128 => |val| {
            const unsigned = @as(u128, @bitCast(val));
            var bytes: [16]u8 = undefined;
            std.mem.writeInt(u128, &bytes, unsigned, .big);
            @memcpy(result[16..32], &bytes);
            // Sign extend for negative numbers
            if (val < 0) {
                @memset(result[0..16], 0xff);
            }
        },
        .int256 => {
            return AbiError.NotImplemented; // i256 not supported in Zig
        },
        .address => |val| {
            // Address is 20 bytes, right-aligned (left-padded with zeros)
            @memcpy(result[12..32], &val);
        },
        .bool => |val| {
            result[31] = if (val) 1 else 0;
        },
        .bytes1 => |val| {
            @memcpy(result[0..1], &val);
        },
        .bytes2 => |val| {
            @memcpy(result[0..2], &val);
        },
        .bytes3 => |val| {
            @memcpy(result[0..3], &val);
        },
        .bytes4 => |val| {
            @memcpy(result[0..4], &val);
        },
        .bytes8 => |val| {
            @memcpy(result[0..8], &val);
        },
        .bytes16 => |val| {
            @memcpy(result[0..16], &val);
        },
        .bytes32 => |val| {
            @memcpy(result, &val);
        },
        else => {
            allocator.free(result);
            return AbiError.InvalidType;
        },
    }

    return result;
}

// Encode a dynamic parameter
fn encode_dynamic_parameter(allocator: std.mem.Allocator, value: AbiValue) ![]u8 {
    switch (value) {
        .string => |val| {
            // Length + data, padded to 32-byte boundary
            const length = val.len;
            const padded_length = ((length + 31) / 32) * 32;

            var result = try allocator.alloc(u8, 32 + padded_length);
            @memset(result, 0);

            // Encode length
            var length_bytes: [32]u8 = undefined;
            @memset(length_bytes, 0);
            std.mem.writeInt(u64, length_bytes[24..32], @as(u64, @intCast(length)), .big);
            @memcpy(result[0..32], &length_bytes);

            // Encode data
            @memcpy(result[32 .. 32 + length], val);

            return result;
        },
        .bytes => |val| {
            // Same as string
            const length = val.len;
            const padded_length = ((length + 31) / 32) * 32;

            var result = try allocator.alloc(u8, 32 + padded_length);
            @memset(result, 0);

            // Encode length
            var length_bytes: [32]u8 = undefined;
            @memset(length_bytes, 0);
            std.mem.writeInt(u64, length_bytes[24..32], @as(u64, @intCast(length)), .big);
            @memcpy(result[0..32], &length_bytes);

            // Encode data
            @memcpy(result[32 .. 32 + length], val);

            return result;
        },
        .uint256_array => |val| {
            // Length + array elements
            const length = val.len;

            var result = try allocator.alloc(u8, 32 + (length * 32));
            @memset(result, 0);

            // Encode length
            var length_bytes: [32]u8 = undefined;
            @memset(length_bytes, 0);
            std.mem.writeInt(u64, length_bytes[24..32], @as(u64, @intCast(length)), .big);
            @memcpy(result[0..32], &length_bytes);

            // Encode elements
            for (val, 0..) |elem, i| {
                var elem_bytes: [32]u8 = undefined;
                std.mem.writeInt(u256, &elem_bytes, elem, .big);
                @memcpy(result[32 + (i * 32) .. 32 + ((i + 1) * 32)], &elem_bytes);
            }

            return result;
        },
        .address_array => |val| {
            const length = val.len;

            var result = try allocator.alloc(u8, 32 + (length * 32));
            @memset(result, 0);

            // Encode length
            var length_bytes: [32]u8 = undefined;
            @memset(length_bytes, 0);
            std.mem.writeInt(u64, length_bytes[24..32], @as(u64, @intCast(length)), .big);
            @memcpy(result[0..32], &length_bytes);

            // Encode elements
            for (val, 0..) |elem, i| {
                @memcpy(result[32 + (i * 32) + 12 .. 32 + ((i + 1) * 32)], &elem);
            }

            return result;
        },
        .string_array => |val| {
            const length = val.len;

            // First pass: calculate total size needed
            var total_size: usize = 32; // For array length
            total_size += length * 32; // For offset pointers

            var string_sizes = try allocator.alloc(usize, length);
            defer allocator.free(string_sizes);

            for (val, 0..) |str, i| {
                const str_len = str.len;
                const padded_len = ((str_len + 31) / 32) * 32;
                string_sizes[i] = 32 + padded_len; // Length + data
                total_size += string_sizes[i];
            }

            var result = try allocator.alloc(u8, total_size);
            @memset(result, 0);

            // Encode array length
            var length_bytes: [32]u8 = undefined;
            @memset(length_bytes, 0);
            std.mem.writeInt(u64, length_bytes[24..32], @as(u64, @intCast(length)), .big);
            @memcpy(result[0..32], &length_bytes);

            // Calculate offsets and encode offset pointers
            var current_offset: usize = length * 32;
            for (0..length) |i| {
                var offset_bytes: [32]u8 = undefined;
                @memset(offset_bytes, 0);
                std.mem.writeInt(u64, offset_bytes[24..32], @as(u64, @intCast(current_offset)), .big);
                @memcpy(result[32 + (i * 32) .. 32 + ((i + 1) * 32)], &offset_bytes);
                current_offset += string_sizes[i];
            }

            // Encode string data
            var data_offset: usize = 32 + (length * 32);
            for (val, 0..) |str, i| {
                const str_len = str.len;

                // String length
                var str_length_bytes: [32]u8 = undefined;
                @memset(str_length_bytes, 0);
                std.mem.writeInt(u64, str_length_bytes[24..32], @as(u64, @intCast(str_len)), .big);
                @memcpy(result[data_offset .. data_offset + 32], &str_length_bytes);

                // String data
                @memcpy(result[data_offset + 32 .. data_offset + 32 + str_len], str);

                data_offset += string_sizes[i];
            }

            return result;
        },
        else => {
            return AbiError.InvalidType;
        },
    }
}

// Main ABI encoding function
pub fn encode_abi_parameters(allocator: std.mem.Allocator, values: []const AbiValue) ![]u8 {
    if (values.len == 0) return try allocator.alloc(u8, 0);

    var static_parts = std.array_list.AlignedManaged([]u8, null).init(allocator);
    defer {
        for (static_parts.items) |part| {
            allocator.free(part);
        }
        static_parts.deinit();
    }

    var dynamic_parts = std.array_list.AlignedManaged([]u8, null).init(allocator);
    defer {
        for (dynamic_parts.items) |part| {
            allocator.free(part);
        }
        dynamic_parts.deinit();
    }

    // First pass: compute static size and prepare static/dynamic parts
    var static_size: usize = 0;
    var dynamic_size: usize = 0;

    for (values) |value| {
        const abi_type = value.get_type();

        if (is_dynamic(abi_type)) {
            // Dynamic type: add 32 bytes for offset pointer in static part
            static_size += 32;

            // Encode the dynamic data
            const dynamic_data = try encode_dynamic_parameter(allocator, value);
            try dynamic_parts.append(dynamic_data);
            dynamic_size += dynamic_data.len;

            // Create offset pointer for static part
            const offset_pointer = try allocator.alloc(u8, 32);
            @memset(offset_pointer, 0);
            // Offset will be calculated in second pass
            try static_parts.append(offset_pointer);
        } else {
            // Static type: encode directly
            const static_data = try encode_static_parameter(allocator, value);
            try static_parts.append(static_data);
            static_size += 32;
        }
    }

    // Second pass: update offset pointers
    var current_dynamic_offset: usize = static_size;
    var dynamic_index: usize = 0;

    for (values, 0..) |value, i| {
        const abi_type = value.get_type();

        if (is_dynamic(abi_type)) {
            // Update the offset pointer
            var offset_bytes: [32]u8 = undefined;
            @memset(offset_bytes, 0);
            std.mem.writeInt(u64, offset_bytes[24..32], @as(u64, @intCast(current_dynamic_offset)), .big);
            @memcpy(static_parts.items[i], &offset_bytes);

            current_dynamic_offset += dynamic_parts.items[dynamic_index].len;
            dynamic_index += 1;
        }
    }

    // Concatenate all parts
    const total_size = static_size + dynamic_size;
    var result = try allocator.alloc(u8, total_size);

    var offset: usize = 0;

    // Copy static parts
    for (static_parts.items) |part| {
        @memcpy(result[offset .. offset + part.len], part);
        offset += part.len;
    }

    // Copy dynamic parts
    for (dynamic_parts.items) |part| {
        @memcpy(result[offset .. offset + part.len], part);
        offset += part.len;
    }

    return result;
}

pub fn encode_function_data(allocator: std.mem.Allocator, selector: Selector, parameters: []const AbiValue) ![]u8 {
    const encoded_params = try encode_abi_parameters(allocator, parameters);
    defer allocator.free(encoded_params);

    const result = try allocator.alloc(u8, 4 + encoded_params.len);
    @memcpy(result[0..4], &selector);
    @memcpy(result[4..], encoded_params);
    return result;
}

pub fn encode_event_topics(allocator: std.mem.Allocator, event_signature: []const u8, indexed_values: []const AbiValue) ![][]u8 {
    var topics = std.array_list.AlignedManaged([]u8, null).init(allocator);
    defer topics.deinit();

    // First topic is the event signature hash
    var signature_hash: [32]u8 = undefined;
    std.crypto.hash.sha3.Keccak256.hash(event_signature, &signature_hash, .{});
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
pub fn encode_packed(allocator: std.mem.Allocator, values: []const AbiValue) ![]u8 {
    var result = std.array_list.AlignedManaged(u8, null).init(allocator);
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

// Gas estimation for call data using std.mem.count for efficiency
pub fn estimate_gas_for_data(data: []const u8) u64 {
    const base_gas: u64 = 21000; // Base transaction cost

    const zero_bytes = std.mem.count(u8, data, &[_]u8{0});
    const non_zero_bytes = data.len - zero_bytes;

    return base_gas + (zero_bytes * 4) + (non_zero_bytes * 16);
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
    state_mutability: StateMutability,

    pub fn get_selector(self: FunctionDefinition, allocator: std.mem.Allocator) !Selector {
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
            .state_mutability = .nonpayable,
        };
    }

    pub fn erc20_balance_of() FunctionDefinition {
        return FunctionDefinition{
            .name = "balanceOf",
            .inputs = &[_]AbiType{.address},
            .outputs = &[_]AbiType{.uint256},
            .state_mutability = .view,
        };
    }
};

// Tests
test "basic ABI encoding" {
    const allocator = std.testing.allocator;

    const values = [_]AbiValue{
        uint256_value(42),
        bool_value(true),
    };

    const encoded = try encode_abi_parameters(allocator, &values);
    defer allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 64), encoded.len); // 2 * 32 bytes
}

test "basic ABI decoding" {
    const allocator = std.testing.allocator;

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

    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expectEqual(@as(u256, 42), decoded[0].uint256);
}

test "function selector computation" {
    const selector = compute_selector("transfer(address,uint256)");

    // This should match the known ERC20 transfer selector
    const expected = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqualSlices(u8, &expected, &selector);
}

test "function data encoding" {
    const allocator = std.testing.allocator;

    const selector = compute_selector("transfer(address,uint256)");
    const params = [_]AbiValue{
        address_value([_]u8{0x12} ** 20),
        uint256_value(1000),
    };

    const encoded = try encode_function_data(allocator, selector, &params);
    defer allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 68), encoded.len); // 4 + 64 bytes
    try std.testing.expectEqualSlices(u8, &selector, encoded[0..4]);
}

test "packed encoding" {
    const allocator = std.testing.allocator;

    const values = [_]AbiValue{
        AbiValue{ .uint8 = 0x12 },
        AbiValue{ .uint16 = 0x3456 },
        string_value("test"),
    };

    const packed_data = try encode_packed(allocator, &values);
    defer allocator.free(packed_data);

    try std.testing.expectEqual(@as(usize, 7), packed_data.len); // 1 + 2 + 4 bytes
    try std.testing.expectEqual(@as(u8, 0x12), packed_data[0]);
    try std.testing.expectEqual(@as(u8, 0x34), packed_data[1]);
    try std.testing.expectEqual(@as(u8, 0x56), packed_data[2]);
    try std.testing.expectEqualSlices(u8, "test", packed_data[3..7]);
}

test "gas estimation" {
    const data = &[_]u8{ 0x00, 0x01, 0x02, 0x00, 0x03 };
    const gas = estimate_gas_for_data(data);

    // 21000 + 4 + 16 + 16 + 4 + 16 = 21056
    try std.testing.expectEqual(@as(u64, 21056), gas);
}

test "common selectors" {
    const transfer_selector = CommonSelectors.ERC20_TRANSFER;
    const expected_transfer = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqualSlices(u8, &expected_transfer, &transfer_selector);

    const balance_selector = CommonSelectors.ERC20_BALANCE_OF;
    const expected_balance = [_]u8{ 0x70, 0xa0, 0x82, 0x31 };
    try std.testing.expectEqualSlices(u8, &expected_balance, &balance_selector);
}

// Encode function result (return values)
pub fn encode_function_result(allocator: std.mem.Allocator, return_values: []const AbiValue) ![]u8 {
    return encode_abi_parameters(allocator, return_values);
}

// Decode function result (return values)
pub fn decode_function_result(allocator: std.mem.Allocator, data: []const u8, output_types: []const AbiType) ![]AbiValue {
    return decode_abi_parameters(allocator, data, output_types);
}

// Encode error result (selector + error parameters)
pub fn encode_error_result(allocator: std.mem.Allocator, error_selector: Selector, error_params: []const AbiValue) ![]u8 {
    const encoded_params = try encode_abi_parameters(allocator, error_params);
    defer allocator.free(encoded_params);

    const result = try allocator.alloc(u8, 4 + encoded_params.len);
    @memcpy(result[0..4], &error_selector);
    @memcpy(result[4..], encoded_params);

    return result;
}

// Helper structs for function execution results
pub const FunctionResult = struct {
    success: bool,
    return_data: []const u8,
    gas_used: ?u64 = null,

    pub fn deinit(self: *FunctionResult, allocator: std.mem.Allocator) void {
        allocator.free(self.return_data);
    }
};

pub const ErrorResult = struct {
    selector: Selector,
    error_data: []const u8,
    decoded_params: ?[]AbiValue = null,

    pub fn deinit(self: *ErrorResult, allocator: std.mem.Allocator) void {
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

// Helper functions for creating results
pub fn create_function_result(allocator: std.mem.Allocator, success: bool, return_data: []const u8, gas_used: ?u64) !FunctionResult {
    const owned_data = try allocator.dupe(u8, return_data);
    return FunctionResult{
        .success = success,
        .return_data = owned_data,
        .gas_used = gas_used,
    };
}

pub fn decode_function_result_with_types(allocator: std.mem.Allocator, result: FunctionResult, output_types: []const AbiType) ![]AbiValue {
    return decode_function_result(allocator, result.return_data, output_types);
}

pub fn create_error_result(allocator: std.mem.Allocator, selector: Selector, error_data: []const u8) !ErrorResult {
    const owned_data = try allocator.dupe(u8, error_data);
    return ErrorResult{
        .selector = selector,
        .error_data = owned_data,
    };
}

pub fn decode_error_result_with_types(allocator: std.mem.Allocator, error_result: *ErrorResult, error_types: []const AbiType) !void {
    error_result.decoded_params = try decode_abi_parameters(allocator, error_result.error_data[4..], error_types);
}

// Test ABI encoding of uint types
test "encode uint256" {
    // Test encoding 69420n (0x10f2c)
    const values = [_]AbiValue{
        uint256_value(69420),
    };

    const encoded = try encode_abi_parameters(std.testing.allocator, &values);
    defer std.testing.allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 32), encoded.len);

    const expected = [_]u8{0} ** 28 ++ [_]u8{ 0x00, 0x00, 0x10, 0xf2, 0xc };
    try std.testing.expectEqualSlices(u8, &expected, encoded);
}

test "encode uint8" {
    // Test encoding 32
    const values = [_]AbiValue{
        .{ .uint8 = 32 },
    };

    const encoded = try encode_abi_parameters(std.testing.allocator, &values);
    defer std.testing.allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 32), encoded.len);

    const expected = [_]u8{0} ** 31 ++ [_]u8{0x20};
    try std.testing.expectEqualSlices(u8, &expected, encoded);
}

test "encode multiple uint types" {
    const values = [_]AbiValue{
        .{ .uint8 = 255 },
        .{ .uint32 = 69420 },
        uint256_value(0xdeadbeef),
    };

    const encoded = try encode_abi_parameters(std.testing.allocator, &values);
    defer std.testing.allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 96), encoded.len); // 3 * 32 bytes
}

// Test ABI encoding of int types with two's complement
test "encode int32 positive" {
    const values = [_]AbiValue{
        .{ .int32 = 2147483647 }, // Max int32
    };

    const encoded = try encode_abi_parameters(std.testing.allocator, &values);
    defer std.testing.allocator.free(encoded);

    const expected = [_]u8{0} ** 28 ++ [_]u8{ 0x7f, 0xff, 0xff, 0xff };
    try std.testing.expectEqualSlices(u8, &expected, encoded);
}

test "encode int32 negative two's complement" {
    const values = [_]AbiValue{
        .{ .int32 = -2147483648 }, // Min int32
    };

    const encoded = try encode_abi_parameters(std.testing.allocator, &values);
    defer std.testing.allocator.free(encoded);

    // Two's complement representation
    const expected = [_]u8{0xff} ** 28 ++ [_]u8{ 0x80, 0x00, 0x00, 0x00 };
    try std.testing.expectEqualSlices(u8, &expected, encoded);
}

// Test ABI encoding of addresses
test "encode address" {
    const addr: address.Address = [_]u8{
        0x14, 0xdC, 0x79, 0x96, 0x4d, 0xa2, 0xC0, 0x8b,
        0x23, 0x69, 0x8B, 0x3D, 0x3c, 0xc7, 0xCa, 0x32,
        0x19, 0x3d, 0x99, 0x55,
    };

    const values = [_]AbiValue{
        address_value(addr),
    };

    const encoded = try encode_abi_parameters(std.testing.allocator, &values);
    defer std.testing.allocator.free(encoded);

    // Address should be right-padded with zeros
    const expected = [_]u8{0} ** 12 ++ addr;
    try std.testing.expectEqualSlices(u8, &expected, encoded);
}

// Test ABI encoding of bool
test "encode bool" {
    // Test true
    {
        const values = [_]AbiValue{
            bool_value(true),
        };

        const encoded = try encode_abi_parameters(std.testing.allocator, &values);
        defer std.testing.allocator.free(encoded);

        const expected = [_]u8{0} ** 31 ++ [_]u8{0x01};
        try std.testing.expectEqualSlices(u8, &expected, encoded);
    }

    // Test false
    {
        const values = [_]AbiValue{
            bool_value(false),
        };

        const encoded = try encode_abi_parameters(std.testing.allocator, &values);
        defer std.testing.allocator.free(encoded);

        const expected = [_]u8{0} ** 32;
        try std.testing.expectEqualSlices(u8, &expected, encoded);
    }
}

// Test ABI decoding
test "decode uint256" {
    const data = [_]u8{0} ** 28 ++ [_]u8{ 0x00, 0x00, 0x10, 0xf2, 0xc };
    const types = [_]AbiType{.uint256};

    const decoded = try decode_abi_parameters(std.testing.allocator, &data, &types);
    defer {
        for (decoded) |value| {
            switch (value) {
                .string, .bytes => |slice| std.testing.allocator.free(slice),
                .uint256_array => |arr| std.testing.allocator.free(arr),
                .bytes32_array => |arr| std.testing.allocator.free(arr),
                .address_array => |arr| std.testing.allocator.free(arr),
                .string_array => |arr| {
                    for (arr) |str| std.testing.allocator.free(str);
                    std.testing.allocator.free(arr);
                },
                else => {},
            }
        }
        std.testing.allocator.free(decoded);
    }

    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expectEqual(@as(u256, 69420), decoded[0].uint256);
}

test "decode int32 negative" {
    // Two's complement representation of -2147483648
    const data = [_]u8{0xff} ** 28 ++ [_]u8{ 0x80, 0x00, 0x00, 0x00 };
    const types = [_]AbiType{.int32};

    const decoded = try decode_abi_parameters(std.testing.allocator, &data, &types);
    defer std.testing.allocator.free(decoded);

    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expectEqual(@as(i32, -2147483648), decoded[0].int32);
}

test "decode address" {
    const expectedAddr: address.Address = [_]u8{
        0x14, 0xdC, 0x79, 0x96, 0x4d, 0xa2, 0xC0, 0x8b,
        0x23, 0x69, 0x8B, 0x3D, 0x3c, 0xc7, 0xCa, 0x32,
        0x19, 0x3d, 0x99, 0x55,
    };

    const data = [_]u8{0} ** 12 ++ expectedAddr;
    const types = [_]AbiType{.address};

    const decoded = try decode_abi_parameters(std.testing.allocator, &data, &types);
    defer std.testing.allocator.free(decoded);

    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expectEqualSlices(u8, &expectedAddr, &decoded[0].address);
}

test "decode bool" {
    // Test true
    {
        const data = [_]u8{0} ** 31 ++ [_]u8{0x01};
        const types = [_]AbiType{.bool};

        const decoded = try decode_abi_parameters(std.testing.allocator, &data, &types);
        defer std.testing.allocator.free(decoded);

        try std.testing.expectEqual(@as(usize, 1), decoded.len);
        try std.testing.expectEqual(true, decoded[0].bool);
    }

    // Test false
    {
        const data = [_]u8{0} ** 32;
        const types = [_]AbiType{.bool};

        const decoded = try decode_abi_parameters(std.testing.allocator, &data, &types);
        defer std.testing.allocator.free(decoded);

        try std.testing.expectEqual(@as(usize, 1), decoded.len);
        try std.testing.expectEqual(false, decoded[0].bool);
    }
}

// Test function selector computation
test "compute selector" {
    // Test "transfer(address,uint256)" selector
    const transfer_sig = "transfer(address,uint256)";
    const selector = compute_selector(transfer_sig);

    // This should match the known ERC20 transfer selector
    const expected_selector = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqualSlices(u8, &expected_selector, &selector);
}

test "encode function data" {
    const selector = compute_selector("transfer(address,uint256)");

    const recipient: address.Address = [_]u8{0x12} ** 20;
    const params = [_]AbiValue{
        address_value(recipient),
        uint256_value(1000),
    };

    const encoded = try encode_function_data(std.testing.allocator, selector, &params);
    defer std.testing.allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 68), encoded.len); // 4 + 64 bytes
    try std.testing.expectEqualSlices(u8, &selector, encoded[0..4]);
}

// Test dynamic types (strings and bytes)
test "decode string" {
    // Encoded "hello" string
    // offset (32 bytes) + length (32 bytes) + data (32 bytes padded)
    const data = [_]u8{
        // Offset to string data (32)
        0,   0,   0,   0,   0,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0,   0,   0,   0,   0,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x20,
        // Length of string (5)
        0,   0,   0,   0,   0,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0,   0,   0,   0,   0,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x05,
        // String data "hello" padded to 32 bytes
        'h', 'e', 'l', 'l', 'o', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0,   0,   0,   0,   0,   0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    };

    const types = [_]AbiType{.string};

    const decoded = try decode_abi_parameters(std.testing.allocator, &data, &types);
    defer {
        std.testing.allocator.free(decoded[0].string);
        std.testing.allocator.free(decoded);
    }

    try std.testing.expectEqual(@as(usize, 1), decoded.len);
    try std.testing.expectEqualStrings("hello", decoded[0].string);
}

// Test packed encoding
test "encode packed" {
    const values = [_]AbiValue{
        .{ .uint8 = 0x12 },
        .{ .uint16 = 0x3456 },
        string_value("test"),
    };

    const packed_data = try encode_packed(std.testing.allocator, &values);
    defer std.testing.allocator.free(packed_data);

    try std.testing.expectEqual(@as(usize, 7), packed_data.len); // 1 + 2 + 4 bytes
    try std.testing.expectEqual(@as(u8, 0x12), packed_data[0]);
    try std.testing.expectEqual(@as(u8, 0x34), packed_data[1]);
    try std.testing.expectEqual(@as(u8, 0x56), packed_data[2]);
    try std.testing.expectEqualStrings("test", packed_data[3..7]);
}

// Test gas estimation
test "gas estimation for data" {
    // Test with mix of zero and non-zero bytes
    const data = &[_]u8{ 0x00, 0x01, 0x02, 0x00, 0x03 };
    const gas = estimate_gas_for_data(data);

    // Base cost: 21000
    // Zero bytes (2): 2 * 4 = 8
    // Non-zero bytes (3): 3 * 16 = 48
    // Total: 21000 + 8 + 48 = 21056
    try std.testing.expectEqual(@as(u64, 21056), gas);
}

// Test edge cases
test "decode empty parameters" {
    const decoded = try decode_abi_parameters(std.testing.allocator, "", &[_]AbiType{});
    defer std.testing.allocator.free(decoded);

    try std.testing.expectEqual(@as(usize, 0), decoded.len);
}

test "decode with insufficient data" {
    const data = [_]u8{ 0x01, 0x02, 0x03 }; // Only 3 bytes
    const types = [_]AbiType{.uint256}; // Expects 32 bytes

    const result = decode_abi_parameters(std.testing.allocator, &data, &types);
    try std.testing.expectError(AbiError.DataTooSmall, result);
}

// Test complex types
test "encode and decode multiple types" {
    const addr: address.Address = [_]u8{0xaa} ** 20;
    const originalValues = [_]AbiValue{
        uint256_value(42),
        bool_value(true),
        address_value(addr),
    };

    const encoded = try encode_abi_parameters(std.testing.allocator, &originalValues);
    defer std.testing.allocator.free(encoded);

    const types = [_]AbiType{ .uint256, .bool, .address };
    const decoded = try decode_abi_parameters(std.testing.allocator, encoded, &types);
    defer std.testing.allocator.free(decoded);

    try std.testing.expectEqual(@as(u256, 42), decoded[0].uint256);
    try std.testing.expectEqual(true, decoded[1].bool);
    try std.testing.expectEqualSlices(u8, &addr, &decoded[2].address);
}

// Test ABI encoding with ox and viem test cases
test "encode_abi_parameters - comprehensive test cases from ox and viem" {
    const allocator = std.testing.allocator;

    // Test uint256 (value 69420n)
    {
        const values = [_]AbiValue{uint256_value(69420)};
        const encoded = try encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);

        const expected = "0000000000000000000000000000000000000000000000000000000000010f2c";
        const actual_hex = try std.fmt.allocPrint(allocator, "{}", .{std.fmt.fmtSliceHexLower(encoded)});
        defer allocator.free(actual_hex);

        try std.testing.expectEqualStrings(expected, actual_hex);
    }

    // Test uint8 (value 32)
    {
        const values = [_]AbiValue{AbiValue{ .uint8 = 32 }};
        const encoded = try encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);

        const expected = "0000000000000000000000000000000000000000000000000000000000000020";
        const actual_hex = try std.fmt.allocPrint(allocator, "{}", .{std.fmt.fmtSliceHexLower(encoded)});
        defer allocator.free(actual_hex);

        try std.testing.expectEqualStrings(expected, actual_hex);
    }

    // Test address
    {
        const addr: address.Address = [_]u8{
            0x14, 0xdC, 0x79, 0x96, 0x4d, 0xa2, 0xC0, 0x8b,
            0x23, 0x69, 0x8B, 0x3D, 0x3c, 0xc7, 0xCa, 0x32,
            0x19, 0x3d, 0x99, 0x55,
        };
        const values = [_]AbiValue{address_value(addr)};
        const encoded = try encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);

        const expected = "00000000000000000000000014dc79964da2c08b23698b3d3cc7ca32193d9955";
        const actual_hex = try std.fmt.allocPrint(allocator, "{}", .{std.fmt.fmtSliceHexLower(encoded)});
        defer allocator.free(actual_hex);

        try std.testing.expectEqualStrings(expected, actual_hex);
    }

    // Test bool true
    {
        const values = [_]AbiValue{bool_value(true)};
        const encoded = try encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);

        const expected = "0000000000000000000000000000000000000000000000000000000000000001";
        const actual_hex = try std.fmt.allocPrint(allocator, "{}", .{std.fmt.fmtSliceHexLower(encoded)});
        defer allocator.free(actual_hex);

        try std.testing.expectEqualStrings(expected, actual_hex);
    }

    // Test bool false
    {
        const values = [_]AbiValue{bool_value(false)};
        const encoded = try encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);

        const expected = "0000000000000000000000000000000000000000000000000000000000000000";
        const actual_hex = try std.fmt.allocPrint(allocator, "{}", .{std.fmt.fmtSliceHexLower(encoded)});
        defer allocator.free(actual_hex);

        try std.testing.expectEqualStrings(expected, actual_hex);
    }

    // Test int32 positive
    {
        const values = [_]AbiValue{AbiValue{ .int32 = 2147483647 }};
        const encoded = try encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);

        const expected = "000000000000000000000000000000000000000000000000000000007fffffff";
        const actual_hex = try std.fmt.allocPrint(allocator, "{}", .{std.fmt.fmtSliceHexLower(encoded)});
        defer allocator.free(actual_hex);

        try std.testing.expectEqualStrings(expected, actual_hex);
    }

    // Test int32 negative (two's complement)
    {
        const values = [_]AbiValue{AbiValue{ .int32 = -2147483648 }};
        const encoded = try encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);

        const expected = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffff80000000";
        const actual_hex = try std.fmt.allocPrint(allocator, "{}", .{std.fmt.fmtSliceHexLower(encoded)});
        defer allocator.free(actual_hex);

        try std.testing.expectEqualStrings(expected, actual_hex);
    }

    // Test multiple static types (uint256, bool, address)
    {
        const addr: address.Address = [_]u8{
            0xc9, 0x61, 0x14, 0x5a, 0x54, 0xC9, 0x6E, 0x3a,
            0xE9, 0xbA, 0xA0, 0x48, 0xc4, 0xF4, 0xD6, 0xb0,
            0x4C, 0x13, 0x91, 0x6b,
        };
        const values = [_]AbiValue{
            uint256_value(420),
            bool_value(true),
            address_value(addr),
        };
        const encoded = try encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);

        const expected = "00000000000000000000000000000000000000000000000000000000000001a40000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c961145a54c96e3ae9baa048c4f4d6b04c13916b";
        const actual_hex = try std.fmt.allocPrint(allocator, "{}", .{std.fmt.fmtSliceHexLower(encoded)});
        defer allocator.free(actual_hex);

        try std.testing.expectEqualStrings(expected, actual_hex);
    }

    // Test string encoding
    {
        const values = [_]AbiValue{string_value("wagmi")};
        const encoded = try encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);

        const expected = "000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000";
        const actual_hex = try std.fmt.allocPrint(allocator, "{}", .{std.fmt.fmtSliceHexLower(encoded)});
        defer allocator.free(actual_hex);

        try std.testing.expectEqualStrings(expected, actual_hex);
    }

    // Test mixed static and dynamic types (string, uint256, bool)
    {
        const values = [_]AbiValue{
            string_value("wagmi"),
            uint256_value(420),
            bool_value(true),
        };
        const encoded = try encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);

        const expected = "000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000001a4000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000057761676d69000000000000000000000000000000000000000000000000000000";
        const actual_hex = try std.fmt.allocPrint(allocator, "{}", .{std.fmt.fmtSliceHexLower(encoded)});
        defer allocator.free(actual_hex);

        try std.testing.expectEqualStrings(expected, actual_hex);
    }
}
