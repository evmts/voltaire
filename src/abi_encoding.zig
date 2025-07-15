const std = @import("std");
const testing = std.testing;
const Allocator = std.mem.Allocator;
const hash = std.crypto.hash;

// ============================================================================
// Core Types and Constants
// ============================================================================

/// Common Ethereum address type (20 bytes)
pub const Address = [20]u8;

/// Common Ethereum hash type (32 bytes)
pub const Hash = [32]u8;

/// Function selector type (4 bytes)
pub const Selector = [4]u8;

/// ABI error types
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
    LengthMismatch,
    ArrayLengthMismatch,
    BytesSizeMismatch,
    InvalidArrayError,
    PositionOutOfBounds,
};

// ============================================================================
// ABI Type System
// ============================================================================

/// Comprehensive ABI type enumeration covering all Ethereum ABI types
pub const AbiType = enum {
    // Elementary integer types
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

    // Fixed point types (not implemented in this version)
    // ufixed, fixed,

    // Address type
    address,

    // Boolean type
    bool,

    // Fixed-size byte arrays
    bytes1,
    bytes2,
    bytes3,
    bytes4,
    bytes5,
    bytes6,
    bytes7,
    bytes8,
    bytes9,
    bytes10,
    bytes11,
    bytes12,
    bytes13,
    bytes14,
    bytes15,
    bytes16,
    bytes17,
    bytes18,
    bytes19,
    bytes20,
    bytes21,
    bytes22,
    bytes23,
    bytes24,
    bytes25,
    bytes26,
    bytes27,
    bytes28,
    bytes29,
    bytes30,
    bytes31,
    bytes32,

    // Dynamic types
    bytes, // Dynamic byte array
    string, // Dynamic string

    // Array types (handled via metadata)
    array, // Dynamic array T[]
    fixed_array, // Fixed array T[k]

    // Tuple type (handled via components)
    tuple,

    /// Get the canonical string representation of this ABI type
    pub fn toString(self: AbiType) []const u8 {
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
            .bytes5 => "bytes5",
            .bytes6 => "bytes6",
            .bytes7 => "bytes7",
            .bytes8 => "bytes8",
            .bytes9 => "bytes9",
            .bytes10 => "bytes10",
            .bytes11 => "bytes11",
            .bytes12 => "bytes12",
            .bytes13 => "bytes13",
            .bytes14 => "bytes14",
            .bytes15 => "bytes15",
            .bytes16 => "bytes16",
            .bytes17 => "bytes17",
            .bytes18 => "bytes18",
            .bytes19 => "bytes19",
            .bytes20 => "bytes20",
            .bytes21 => "bytes21",
            .bytes22 => "bytes22",
            .bytes23 => "bytes23",
            .bytes24 => "bytes24",
            .bytes25 => "bytes25",
            .bytes26 => "bytes26",
            .bytes27 => "bytes27",
            .bytes28 => "bytes28",
            .bytes29 => "bytes29",
            .bytes30 => "bytes30",
            .bytes31 => "bytes31",
            .bytes32 => "bytes32",
            .bytes => "bytes",
            .string => "string",
            .array => "array",
            .fixed_array => "fixed_array",
            .tuple => "tuple",
        };
    }

    /// Check if this type is dynamic (requires offset pointer in encoding)
    pub fn isDynamic(self: AbiType) bool {
        return switch (self) {
            .bytes, .string, .array => true,
            else => false,
        };
    }

    /// Check if this type is static (fixed size)
    pub fn isStatic(self: AbiType) bool {
        return !self.isDynamic();
    }

    /// Get the static size in bytes for static types (returns 32 for all static types per ABI spec)
    pub fn getStaticSize(self: AbiType) u32 {
        return if (self.isStatic()) 32 else 0;
    }
};

/// ABI parameter definition with type and optional metadata
pub const AbiParameter = struct {
    /// The ABI type
    type: AbiType,
    /// Optional parameter name
    name: ?[]const u8 = null,
    /// For array types: array length (null for dynamic arrays)
    array_length: ?u32 = null,
    /// For tuple types: component parameters
    components: ?[]const AbiParameter = null,
    /// For array types: the inner type
    inner_type: ?*const AbiParameter = null,

    /// Check if this parameter represents a dynamic type
    pub fn isDynamic(self: *const AbiParameter) bool {
        switch (self.type) {
            .bytes, .string, .array => return true,
            .fixed_array => {
                // Fixed arrays are dynamic if their inner type is dynamic
                if (self.inner_type) |inner| {
                    return inner.isDynamic();
                }
                return false;
            },
            .tuple => {
                // Tuples are dynamic if any component is dynamic
                if (self.components) |comps| {
                    for (comps) |comp| {
                        if (comp.isDynamic()) return true;
                    }
                }
                return false;
            },
            else => return false,
        }
    }
};

/// ABI value union type that can hold any ABI-encodable value
pub const AbiValue = union(enum) {
    // Integer types
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

    // Address and boolean
    address: Address,
    bool: bool,

    // Fixed-size byte arrays
    bytes1: [1]u8,
    bytes2: [2]u8,
    bytes3: [3]u8,
    bytes4: [4]u8,
    bytes5: [5]u8,
    bytes6: [6]u8,
    bytes7: [7]u8,
    bytes8: [8]u8,
    bytes9: [9]u8,
    bytes10: [10]u8,
    bytes11: [11]u8,
    bytes12: [12]u8,
    bytes13: [13]u8,
    bytes14: [14]u8,
    bytes15: [15]u8,
    bytes16: [16]u8,
    bytes17: [17]u8,
    bytes18: [18]u8,
    bytes19: [19]u8,
    bytes20: [20]u8,
    bytes21: [21]u8,
    bytes22: [22]u8,
    bytes23: [23]u8,
    bytes24: [24]u8,
    bytes25: [25]u8,
    bytes26: [26]u8,
    bytes27: [27]u8,
    bytes28: [28]u8,
    bytes29: [29]u8,
    bytes30: [30]u8,
    bytes31: [31]u8,
    bytes32: [32]u8,

    // Dynamic types
    bytes: []const u8,
    string: []const u8,

    // Array types
    array: []const AbiValue,

    // Tuple type
    tuple: []const AbiValue,

    /// Get the ABI type for this value
    pub fn getType(self: AbiValue) AbiType {
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
            .bytes5 => .bytes5,
            .bytes6 => .bytes6,
            .bytes7 => .bytes7,
            .bytes8 => .bytes8,
            .bytes9 => .bytes9,
            .bytes10 => .bytes10,
            .bytes11 => .bytes11,
            .bytes12 => .bytes12,
            .bytes13 => .bytes13,
            .bytes14 => .bytes14,
            .bytes15 => .bytes15,
            .bytes16 => .bytes16,
            .bytes17 => .bytes17,
            .bytes18 => .bytes18,
            .bytes19 => .bytes19,
            .bytes20 => .bytes20,
            .bytes21 => .bytes21,
            .bytes22 => .bytes22,
            .bytes23 => .bytes23,
            .bytes24 => .bytes24,
            .bytes25 => .bytes25,
            .bytes26 => .bytes26,
            .bytes27 => .bytes27,
            .bytes28 => .bytes28,
            .bytes29 => .bytes29,
            .bytes30 => .bytes30,
            .bytes31 => .bytes31,
            .bytes32 => .bytes32,
            .bytes => .bytes,
            .string => .string,
            .array => .array,
            .tuple => .tuple,
        };
    }

    /// Check if this value represents a dynamic type
    pub fn isDynamic(self: AbiValue) bool {
        return switch (self) {
            .bytes, .string, .array, .tuple => true,
            else => false,
        };
    }

    /// Free memory for dynamic values
    pub fn deinit(self: AbiValue, allocator: Allocator) void {
        switch (self) {
            .bytes => |slice| allocator.free(slice),
            .string => |slice| allocator.free(slice),
            .array => |arr| {
                for (arr) |item| {
                    item.deinit(allocator);
                }
                allocator.free(arr);
            },
            .tuple => |tup| {
                for (tup) |item| {
                    item.deinit(allocator);
                }
                allocator.free(tup);
            },
            else => {},
        }
    }
};

// ============================================================================
// Cursor for Reading Encoded Data
// ============================================================================

/// Cursor for reading ABI-encoded data with bounds checking
pub const Cursor = struct {
    data: []const u8,
    position: usize,

    pub fn init(data: []const u8) Cursor {
        return Cursor{
            .data = data,
            .position = 0,
        };
    }

    pub fn setPosition(self: *Cursor, pos: usize) void {
        self.position = pos;
    }

    pub fn readBytes(self: *Cursor, len: usize) AbiError![]const u8 {
        if (self.position + len > self.data.len) return AbiError.OutOfBounds;
        const result = self.data[self.position .. self.position + len];
        self.position += len;
        return result;
    }

    /// Read exactly 32 bytes (one word)
    pub fn readWord(self: *Cursor) AbiError![32]u8 {
        const bytes = try self.readBytes(32);
        var result: [32]u8 = undefined;
        @memcpy(&result, bytes);
        return result;
    }

    /// Read a u256 from a 32-byte word
    pub fn readU256Word(self: *Cursor) AbiError!u256 {
        const word = try self.readWord();
        return std.mem.readInt(u256, &word, .big);
    }

    /// Create a new cursor at a specific position
    pub fn atPosition(self: *const Cursor, pos: usize) Cursor {
        return Cursor{
            .data = self.data,
            .position = pos,
        };
    }

    /// Get remaining bytes from current position
    pub fn remaining(self: *const Cursor) []const u8 {
        if (self.position >= self.data.len) return &[_]u8{};
        return self.data[self.position..];
    }
};

// ============================================================================
// Helper Value Constructor Functions
// ============================================================================

pub fn uint8Value(val: u8) AbiValue {
    return AbiValue{ .uint8 = val };
}
pub fn uint16Value(val: u16) AbiValue {
    return AbiValue{ .uint16 = val };
}
pub fn uint32Value(val: u32) AbiValue {
    return AbiValue{ .uint32 = val };
}
pub fn uint64Value(val: u64) AbiValue {
    return AbiValue{ .uint64 = val };
}
pub fn uint128Value(val: u128) AbiValue {
    return AbiValue{ .uint128 = val };
}
pub fn uint256Value(val: u256) AbiValue {
    return AbiValue{ .uint256 = val };
}

pub fn int8Value(val: i8) AbiValue {
    return AbiValue{ .int8 = val };
}
pub fn int16Value(val: i16) AbiValue {
    return AbiValue{ .int16 = val };
}
pub fn int32Value(val: i32) AbiValue {
    return AbiValue{ .int32 = val };
}
pub fn int64Value(val: i64) AbiValue {
    return AbiValue{ .int64 = val };
}
pub fn int128Value(val: i128) AbiValue {
    return AbiValue{ .int128 = val };
}
pub fn int256Value(val: i256) AbiValue {
    return AbiValue{ .int256 = val };
}

pub fn addressValue(val: Address) AbiValue {
    return AbiValue{ .address = val };
}
pub fn boolValue(val: bool) AbiValue {
    return AbiValue{ .bool = val };
}

pub fn bytesValue(val: []const u8) AbiValue {
    return AbiValue{ .bytes = val };
}
pub fn stringValue(val: []const u8) AbiValue {
    return AbiValue{ .string = val };
}
pub fn arrayValue(val: []const AbiValue) AbiValue {
    return AbiValue{ .array = val };
}
pub fn tupleValue(val: []const AbiValue) AbiValue {
    return AbiValue{ .tuple = val };
}

// Fixed-size bytes constructors
pub fn bytes4Value(val: [4]u8) AbiValue {
    return AbiValue{ .bytes4 = val };
}
pub fn bytes8Value(val: [8]u8) AbiValue {
    return AbiValue{ .bytes8 = val };
}
pub fn bytes16Value(val: [16]u8) AbiValue {
    return AbiValue{ .bytes16 = val };
}
pub fn bytes32Value(val: [32]u8) AbiValue {
    return AbiValue{ .bytes32 = val };
}

// ============================================================================
// Function Selector Utilities
// ============================================================================

/// Compute function selector from signature using Keccak256
pub fn computeSelector(signature: []const u8) Selector {
    var digest: [32]u8 = undefined;
    hash.sha3.Keccak256.hash(signature, &digest, .{});
    return digest[0..4].*;
}

/// Create function signature from name and parameter types
pub fn createFunctionSignature(allocator: Allocator, name: []const u8, param_types: []const AbiType) ![]u8 {
    var signature = std.ArrayList(u8).init(allocator);
    defer signature.deinit();

    try signature.appendSlice(name);
    try signature.append('(');

    for (param_types, 0..) |param_type, i| {
        if (i > 0) try signature.append(',');
        try signature.appendSlice(param_type.toString());
    }

    try signature.append(')');
    return signature.toOwnedSlice();
}

// ============================================================================
// Core ABI Encoding Implementation
// ============================================================================

/// Prepared parameter for encoding with static/dynamic information
const PreparedParameter = struct {
    /// Whether this parameter is dynamic
    dynamic: bool,
    /// The encoded data
    encoded: []const u8,

    pub fn deinit(self: PreparedParameter, allocator: Allocator) void {
        allocator.free(self.encoded);
    }
};

/// Encode a single ABI value to prepared parameter
fn prepareParameter(allocator: Allocator, value: AbiValue) AbiError!PreparedParameter {
    switch (value) {
        // Static integer types
        .uint8 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memset(encoded, 0);
            encoded[31] = val;
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .uint16 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memset(encoded, 0);
            std.mem.writeInt(u16, encoded[30..32], val, .big);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .uint32 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memset(encoded, 0);
            std.mem.writeInt(u32, encoded[28..32], val, .big);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .uint64 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memset(encoded, 0);
            std.mem.writeInt(u64, encoded[24..32], val, .big);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .uint128 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memset(encoded, 0);
            std.mem.writeInt(u128, encoded[16..32], val, .big);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .uint256 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            std.mem.writeInt(u256, encoded[0..32], val, .big);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },

        // Signed integer types (using two's complement)
        .int8 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            if (val < 0) {
                @memset(encoded, 0xFF); // Sign extend
            } else {
                @memset(encoded, 0);
            }
            encoded[31] = @bitCast(val);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .int16 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            if (val < 0) {
                @memset(encoded, 0xFF); // Sign extend
            } else {
                @memset(encoded, 0);
            }
            std.mem.writeInt(u16, encoded[30..32], @bitCast(val), .big);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .int32 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            if (val < 0) {
                @memset(encoded, 0xFF); // Sign extend
            } else {
                @memset(encoded, 0);
            }
            std.mem.writeInt(u32, encoded[28..32], @bitCast(val), .big);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .int64 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            if (val < 0) {
                @memset(encoded, 0xFF); // Sign extend
            } else {
                @memset(encoded, 0);
            }
            std.mem.writeInt(u64, encoded[24..32], @bitCast(val), .big);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .int128 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            if (val < 0) {
                @memset(encoded, 0xFF); // Sign extend
            } else {
                @memset(encoded, 0);
            }
            std.mem.writeInt(u128, encoded[16..32], @bitCast(val), .big);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .int256 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            std.mem.writeInt(u256, encoded[0..32], @bitCast(val), .big);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },

        // Address type (20 bytes, left-padded to 32 bytes)
        .address => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memset(encoded, 0);
            @memcpy(encoded[12..32], &val);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },

        // Boolean type
        .bool => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memset(encoded, 0);
            encoded[31] = if (val) 1 else 0;
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },

        // Fixed-size byte arrays (right-padded to 32 bytes)
        .bytes4 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memset(encoded, 0);
            @memcpy(encoded[0..4], &val);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .bytes8 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memset(encoded, 0);
            @memcpy(encoded[0..8], &val);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .bytes16 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memset(encoded, 0);
            @memcpy(encoded[0..16], &val);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },
        .bytes32 => |val| {
            var encoded = try allocator.alloc(u8, 32);
            @memcpy(encoded[0..32], &val);
            return PreparedParameter{ .dynamic = false, .encoded = encoded };
        },

        // Dynamic types (bytes, string)
        .bytes => |val| {
            // Dynamic bytes: length + data (padded to 32-byte boundary)
            const padded_length = ((val.len + 31) / 32) * 32;
            var encoded = try allocator.alloc(u8, 32 + padded_length);

            // Write length
            var length_bytes: [32]u8 = undefined;
            std.mem.writeInt(u256, &length_bytes, val.len, .big);
            @memcpy(encoded[0..32], &length_bytes);

            // Write data and pad
            @memset(encoded[32..], 0);
            @memcpy(encoded[32 .. 32 + val.len], val);

            return PreparedParameter{ .dynamic = true, .encoded = encoded };
        },
        .string => |val| {
            // String is encoded the same as bytes
            const padded_length = ((val.len + 31) / 32) * 32;
            var encoded = try allocator.alloc(u8, 32 + padded_length);

            // Write length
            var length_bytes: [32]u8 = undefined;
            std.mem.writeInt(u256, &length_bytes, val.len, .big);
            @memcpy(encoded[0..32], &length_bytes);

            // Write data and pad
            @memset(encoded[32..], 0);
            @memcpy(encoded[32 .. 32 + val.len], val);

            return PreparedParameter{ .dynamic = true, .encoded = encoded };
        },

        // Array type
        .array => |arr| {
            // Dynamic array: length + encoded elements
            var static_parts = std.ArrayList([]const u8).init(allocator);
            defer static_parts.deinit();
            var dynamic_parts = std.ArrayList([]const u8).init(allocator);
            defer dynamic_parts.deinit();

            var static_size: usize = 0;
            var dynamic_size: usize = 0;

            // Prepare all elements
            for (arr) |item| {
                const prepared = try prepareParameter(allocator, item);
                defer prepared.deinit(allocator);

                if (prepared.dynamic) {
                    // Add offset pointer to static part
                    const offset_bytes = try allocator.alloc(u8, 32);
                    const offset = static_size + dynamic_size;
                    var temp_bytes: [32]u8 = undefined;
                    std.mem.writeInt(u256, &temp_bytes, offset, .big);
                    @memcpy(offset_bytes, &temp_bytes);
                    try static_parts.append(offset_bytes);
                    static_size += 32;

                    // Add encoded data to dynamic part
                    const dynamic_data = try allocator.dupe(u8, prepared.encoded);
                    try dynamic_parts.append(dynamic_data);
                    dynamic_size += prepared.encoded.len;
                } else {
                    // Add directly to static part
                    const static_data = try allocator.dupe(u8, prepared.encoded);
                    try static_parts.append(static_data);
                    static_size += 32;
                }
            }

            // Calculate total size: length + static_size + dynamic_size
            const total_size = 32 + static_size + dynamic_size;
            var encoded = try allocator.alloc(u8, total_size);

            // Write array length
            var length_bytes: [32]u8 = undefined;
            std.mem.writeInt(u256, &length_bytes, arr.len, .big);
            @memcpy(encoded[0..32], &length_bytes);

            // Write static parts
            var pos: usize = 32;
            for (static_parts.items) |part| {
                @memcpy(encoded[pos .. pos + part.len], part);
                pos += part.len;
                allocator.free(part);
            }

            // Write dynamic parts
            for (dynamic_parts.items) |part| {
                @memcpy(encoded[pos .. pos + part.len], part);
                pos += part.len;
                allocator.free(part);
            }

            return PreparedParameter{ .dynamic = true, .encoded = encoded };
        },

        // Tuple type
        .tuple => |tup| {
            var static_parts = std.ArrayList([]const u8).init(allocator);
            defer static_parts.deinit();
            var dynamic_parts = std.ArrayList([]const u8).init(allocator);
            defer dynamic_parts.deinit();

            var static_size: usize = 0;
            var dynamic_size: usize = 0;
            var has_dynamic = false;

            // Prepare all tuple elements
            for (tup) |item| {
                const prepared = try prepareParameter(allocator, item);
                defer prepared.deinit(allocator);

                if (prepared.dynamic) {
                    has_dynamic = true;
                    // Add offset pointer to static part
                    const offset_bytes = try allocator.alloc(u8, 32);
                    const offset = static_size + dynamic_size;
                    var temp_bytes: [32]u8 = undefined;
                    std.mem.writeInt(u256, &temp_bytes, offset, .big);
                    @memcpy(offset_bytes, &temp_bytes);
                    try static_parts.append(offset_bytes);
                    static_size += 32;

                    // Add encoded data to dynamic part
                    const dynamic_data = try allocator.dupe(u8, prepared.encoded);
                    try dynamic_parts.append(dynamic_data);
                    dynamic_size += prepared.encoded.len;
                } else {
                    // Add directly to static part
                    const static_data = try allocator.dupe(u8, prepared.encoded);
                    try static_parts.append(static_data);
                    static_size += 32;
                }
            }

            // Calculate total size
            const total_size = static_size + dynamic_size;
            var encoded = try allocator.alloc(u8, total_size);

            // Write static parts
            var pos: usize = 0;
            for (static_parts.items) |part| {
                @memcpy(encoded[pos .. pos + part.len], part);
                pos += part.len;
                allocator.free(part);
            }

            // Write dynamic parts
            for (dynamic_parts.items) |part| {
                @memcpy(encoded[pos .. pos + part.len], part);
                pos += part.len;
                allocator.free(part);
            }

            return PreparedParameter{ .dynamic = has_dynamic, .encoded = encoded };
        },

        else => return AbiError.NotImplemented,
    }
}

/// Main ABI parameter encoding function
pub fn encodeAbiParameters(allocator: Allocator, values: []const AbiValue) ![]u8 {
    if (values.len == 0) return try allocator.alloc(u8, 0);

    var prepared_params = std.ArrayList(PreparedParameter).init(allocator);
    defer {
        for (prepared_params.items) |param| {
            param.deinit(allocator);
        }
        prepared_params.deinit();
    }

    // Prepare all parameters
    for (values) |value| {
        const prepared = try prepareParameter(allocator, value);
        try prepared_params.append(prepared);
    }

    // Calculate static and dynamic sizes
    var static_size: usize = 0;
    var dynamic_size: usize = 0;

    for (prepared_params.items) |param| {
        if (param.dynamic) {
            static_size += 32; // Offset pointer
            dynamic_size += param.encoded.len;
        } else {
            static_size += param.encoded.len;
        }
    }

    // Allocate result
    const total_size = static_size + dynamic_size;
    var result = try allocator.alloc(u8, total_size);

    // Write static and dynamic parts
    var static_pos: usize = 0;
    var dynamic_pos: usize = static_size;

    for (prepared_params.items) |param| {
        if (param.dynamic) {
            // Write offset pointer
            var offset_bytes: [32]u8 = undefined;
            std.mem.writeInt(u256, &offset_bytes, dynamic_pos, .big);
            @memcpy(result[static_pos .. static_pos + 32], &offset_bytes);
            static_pos += 32;

            // Write data to dynamic section
            @memcpy(result[dynamic_pos .. dynamic_pos + param.encoded.len], param.encoded);
            dynamic_pos += param.encoded.len;
        } else {
            // Write directly to static section
            @memcpy(result[static_pos .. static_pos + param.encoded.len], param.encoded);
            static_pos += param.encoded.len;
        }
    }

    return result;
}

/// Encode function data (selector + parameters)
pub fn encodeFunctionData(allocator: Allocator, selector: Selector, parameters: []const AbiValue) ![]u8 {
    const encoded_params = try encodeAbiParameters(allocator, parameters);
    defer allocator.free(encoded_params);

    var result = try allocator.alloc(u8, 4 + encoded_params.len);
    @memcpy(result[0..4], &selector);
    @memcpy(result[4..], encoded_params);

    return result;
}

// ============================================================================
// Core ABI Decoding Implementation
// ============================================================================

/// Decode a single ABI parameter
fn decodeParameter(allocator: Allocator, cursor: *Cursor, abi_type: AbiType, static_position: usize) AbiError!AbiValue {
    switch (abi_type) {
        // Unsigned integers
        .uint8 => {
            const word = try cursor.readWord();
            return uint8Value(word[31]);
        },
        .uint16 => {
            const word = try cursor.readWord();
            return uint16Value(std.mem.readInt(u16, word[30..32], .big));
        },
        .uint32 => {
            const word = try cursor.readWord();
            return uint32Value(std.mem.readInt(u32, word[28..32], .big));
        },
        .uint64 => {
            const word = try cursor.readWord();
            return uint64Value(std.mem.readInt(u64, word[24..32], .big));
        },
        .uint128 => {
            const word = try cursor.readWord();
            return uint128Value(std.mem.readInt(u128, word[16..32], .big));
        },
        .uint256 => {
            const word = try cursor.readWord();
            return uint256Value(std.mem.readInt(u256, &word, .big));
        },

        // Signed integers (two's complement)
        .int8 => {
            const word = try cursor.readWord();
            return int8Value(@bitCast(word[31]));
        },
        .int16 => {
            const word = try cursor.readWord();
            return int16Value(@bitCast(std.mem.readInt(u16, word[30..32], .big)));
        },
        .int32 => {
            const word = try cursor.readWord();
            return int32Value(@bitCast(std.mem.readInt(u32, word[28..32], .big)));
        },
        .int64 => {
            const word = try cursor.readWord();
            return int64Value(@bitCast(std.mem.readInt(u64, word[24..32], .big)));
        },
        .int128 => {
            const word = try cursor.readWord();
            return int128Value(@bitCast(std.mem.readInt(u128, word[16..32], .big)));
        },
        .int256 => {
            const word = try cursor.readWord();
            return int256Value(@bitCast(std.mem.readInt(u256, &word, .big)));
        },

        // Address
        .address => {
            const word = try cursor.readWord();
            var addr: Address = undefined;
            @memcpy(&addr, word[12..32]);
            return addressValue(addr);
        },

        // Boolean
        .bool => {
            const word = try cursor.readWord();
            return boolValue(word[31] != 0);
        },

        // Fixed-size byte arrays
        .bytes4 => {
            const word = try cursor.readWord();
            var bytes: [4]u8 = undefined;
            @memcpy(&bytes, word[0..4]);
            return bytes4Value(bytes);
        },
        .bytes8 => {
            const word = try cursor.readWord();
            var bytes: [8]u8 = undefined;
            @memcpy(&bytes, word[0..8]);
            return bytes8Value(bytes);
        },
        .bytes16 => {
            const word = try cursor.readWord();
            var bytes: [16]u8 = undefined;
            @memcpy(&bytes, word[0..16]);
            return bytes16Value(bytes);
        },
        .bytes32 => {
            const word = try cursor.readWord();
            return bytes32Value(word);
        },

        // Dynamic bytes
        .bytes => {
            const offset = try cursor.readU256Word();
            var offset_cursor = cursor.atPosition(static_position + @as(usize, @intCast(offset)));

            const length = try offset_cursor.readU256Word();
            const length_usize = @as(usize, @intCast(length));

            if (length_usize == 0) {
                return bytesValue(try allocator.alloc(u8, 0));
            }

            // Calculate padded length (round up to 32-byte boundary)
            const padded_length = ((length_usize + 31) / 32) * 32;
            const data = try offset_cursor.readBytes(padded_length);

            // Only return the actual data, not the padding
            const result = try allocator.alloc(u8, length_usize);
            @memcpy(result, data[0..length_usize]);
            return bytesValue(result);
        },

        // Dynamic string
        .string => {
            const offset = try cursor.readU256Word();
            var offset_cursor = cursor.atPosition(static_position + @as(usize, @intCast(offset)));

            const length = try offset_cursor.readU256Word();
            const length_usize = @as(usize, @intCast(length));

            if (length_usize == 0) {
                return stringValue(try allocator.alloc(u8, 0));
            }

            // Calculate padded length (round up to 32-byte boundary)
            const padded_length = ((length_usize + 31) / 32) * 32;
            const data = try offset_cursor.readBytes(padded_length);

            // Only return the actual data, not the padding
            const result = try allocator.alloc(u8, length_usize);
            @memcpy(result, data[0..length_usize]);

            // Validate UTF-8 for strings
            if (!std.unicode.utf8ValidateSlice(result)) {
                allocator.free(result);
                return AbiError.InvalidUtf8;
            }

            return stringValue(result);
        },

        else => return AbiError.NotImplemented,
    }
}

/// Main ABI parameter decoding function
pub fn decodeAbiParameters(allocator: Allocator, data: []const u8, types: []const AbiType) ![]AbiValue {
    if (data.len == 0 and types.len > 0) return AbiError.ZeroData;
    if (data.len > 0 and data.len < 32 and types.len > 0) return AbiError.DataTooSmall;
    if (types.len == 0) return try allocator.alloc(AbiValue, 0);

    var cursor = Cursor.init(data);
    var result = try allocator.alloc(AbiValue, types.len);
    errdefer {
        for (result[0..types.len]) |value| {
            value.deinit(allocator);
        }
        allocator.free(result);
    }

    var consumed: usize = 0;
    for (types, 0..) |abi_type, i| {
        cursor.setPosition(consumed);
        result[i] = try decodeParameter(allocator, &cursor, abi_type, 0);
        consumed += 32; // Each parameter takes 32 bytes in the static part
    }

    return result;
}

/// Decode function data (selector + parameters)
pub fn decodeFunctionData(allocator: Allocator, data: []const u8, types: []const AbiType) AbiError!struct { selector: Selector, parameters: []AbiValue } {
    if (data.len < 4) return AbiError.InvalidLength;

    const selector: Selector = data[0..4].*;
    const parameters = try decodeAbiParameters(allocator, data[4..], types);

    return .{
        .selector = selector,
        .parameters = parameters,
    };
}

// ============================================================================
// Common Function Selectors and Utilities
// ============================================================================

/// Common ERC-20 function selectors
pub const CommonSelectors = struct {
    pub const transfer: Selector = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    pub const transferFrom: Selector = [_]u8{ 0x23, 0xb8, 0x72, 0xdd };
    pub const approve: Selector = [_]u8{ 0x09, 0x5e, 0xa7, 0xb3 };
    pub const balanceOf: Selector = [_]u8{ 0x70, 0xa0, 0x82, 0x31 };
    pub const allowance: Selector = [_]u8{ 0xdd, 0x62, 0xed, 0x3e };
    pub const totalSupply: Selector = [_]u8{ 0x18, 0x16, 0x0d, 0xdd };
    pub const name: Selector = [_]u8{ 0x06, 0xfd, 0xde, 0x03 };
    pub const symbol: Selector = [_]u8{ 0x95, 0xd8, 0x9b, 0x41 };
    pub const decimals: Selector = [_]u8{ 0x31, 0x3c, 0xe5, 0x67 };

    // ERC-721
    pub const safeTransferFrom: Selector = [_]u8{ 0x42, 0x84, 0x2e, 0x0e };
    pub const safeTransferFromWithData: Selector = [_]u8{ 0xb8, 0x8d, 0x4f, 0xde };
    pub const setApprovalForAll: Selector = [_]u8{ 0xa2, 0x2c, 0xb4, 0x65 };
    pub const getApproved: Selector = [_]u8{ 0x08, 0x1d, 0x12, 0x63 };
    pub const isApprovedForAll: Selector = [_]u8{ 0xe9, 0x85, 0xe9, 0xc5 };
    pub const ownerOf: Selector = [_]u8{ 0x63, 0x52, 0x21, 0x1e };
    pub const tokenURI: Selector = [_]u8{ 0xc8, 0x7b, 0x56, 0xdd };

    // Common events
    pub const transferEvent: Selector = [_]u8{ 0xdd, 0xf2, 0x52, 0xad };
    pub const approvalEvent: Selector = [_]u8{ 0x8c, 0x5b, 0xe1, 0xe5 };
    pub const approvalForAllEvent: Selector = [_]u8{ 0x17, 0x30, 0x7e, 0xab };
};

/// Estimate gas cost for calldata
pub fn estimateGasForCalldata(data: []const u8) u64 {
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

// ============================================================================
// Tests
// ============================================================================

test "basic ABI encoding - static types" {
    const allocator = testing.allocator;

    // Test encoding basic static types
    const values = [_]AbiValue{
        uint256Value(42),
        boolValue(true),
        addressValue([_]u8{0x12} ** 20),
    };

    const encoded = try encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    try testing.expectEqual(@as(usize, 96), encoded.len); // 3 * 32 bytes

    // Verify the encoded data
    try testing.expectEqual(@as(u256, 42), std.mem.readInt(u256, encoded[0..32], .big));
    try testing.expectEqual(@as(u8, 1), encoded[63]); // bool true

    // Check address (last 20 bytes of the third word)
    const addr_start = 64 + 12; // Third word + 12 bytes padding
    for (0..20) |i| {
        try testing.expectEqual(@as(u8, 0x12), encoded[addr_start + i]);
    }
}

test "basic ABI decoding - static types" {
    const allocator = testing.allocator;

    // Test decoding the data we just encoded
    const values = [_]AbiValue{
        uint256Value(42),
        boolValue(true),
        addressValue([_]u8{0x12} ** 20),
    };

    const encoded = try encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    const types = [_]AbiType{ .uint256, .bool, .address };
    const decoded = try decodeAbiParameters(allocator, encoded, &types);
    defer {
        for (decoded) |value| {
            value.deinit(allocator);
        }
        allocator.free(decoded);
    }

    try testing.expectEqual(@as(usize, 3), decoded.len);
    try testing.expectEqual(@as(u256, 42), decoded[0].uint256);
    try testing.expectEqual(true, decoded[1].bool);

    // Check address
    for (0..20) |i| {
        try testing.expectEqual(@as(u8, 0x12), decoded[2].address[i]);
    }
}

test "dynamic type encoding - string" {
    const allocator = testing.allocator;

    const test_string = "hello world";
    const values = [_]AbiValue{
        stringValue(test_string),
    };

    const encoded = try encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Should have: offset (32 bytes) + length (32 bytes) + data (32 bytes padded)
    try testing.expectEqual(@as(usize, 96), encoded.len);

    // Check offset points to position 32
    try testing.expectEqual(@as(u256, 32), std.mem.readInt(u256, encoded[0..32], .big));

    // Check length
    try testing.expectEqual(@as(u256, 11), std.mem.readInt(u256, encoded[32..64], .big));

    // Check data
    try testing.expectEqualSlices(u8, test_string, encoded[64..75]);
}

test "dynamic type decoding - string" {
    const allocator = testing.allocator;

    const test_string = "hello world";
    const values = [_]AbiValue{
        stringValue(test_string),
    };

    const encoded = try encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    const types = [_]AbiType{.string};
    const decoded = try decodeAbiParameters(allocator, encoded, &types);
    defer {
        for (decoded) |value| {
            value.deinit(allocator);
        }
        allocator.free(decoded);
    }

    try testing.expectEqual(@as(usize, 1), decoded.len);
    try testing.expectEqualSlices(u8, test_string, decoded[0].string);
}

test "mixed static and dynamic types" {
    const allocator = testing.allocator;

    const test_string = "wagmi";
    const values = [_]AbiValue{
        stringValue(test_string),
        uint256Value(420),
        boolValue(true),
    };

    const encoded = try encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    const types = [_]AbiType{ .string, .uint256, .bool };
    const decoded = try decodeAbiParameters(allocator, encoded, &types);
    defer {
        for (decoded) |value| {
            value.deinit(allocator);
        }
        allocator.free(decoded);
    }

    try testing.expectEqual(@as(usize, 3), decoded.len);
    try testing.expectEqualSlices(u8, test_string, decoded[0].string);
    try testing.expectEqual(@as(u256, 420), decoded[1].uint256);
    try testing.expectEqual(true, decoded[2].bool);
}

test "function selector computation" {
    const transfer_selector = computeSelector("transfer(address,uint256)");
    const expected = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try testing.expectEqualSlices(u8, &expected, &transfer_selector);

    // Test ERC20 common selectors
    try testing.expectEqualSlices(u8, &transfer_selector, &CommonSelectors.transfer);
}

test "function data encoding" {
    const allocator = testing.allocator;

    const selector = computeSelector("transfer(address,uint256)");
    const params = [_]AbiValue{
        addressValue([_]u8{0x12} ** 20),
        uint256Value(1000),
    };

    const encoded = try encodeFunctionData(allocator, selector, &params);
    defer allocator.free(encoded);

    try testing.expectEqual(@as(usize, 68), encoded.len); // 4 + 64 bytes
    try testing.expectEqualSlices(u8, &selector, encoded[0..4]);
}

test "function data decoding" {
    const allocator = testing.allocator;

    const selector = computeSelector("transfer(address,uint256)");
    const params = [_]AbiValue{
        addressValue([_]u8{0x12} ** 20),
        uint256Value(1000),
    };

    const encoded = try encodeFunctionData(allocator, selector, &params);
    defer allocator.free(encoded);

    const types = [_]AbiType{ .address, .uint256 };
    const decoded = try decodeFunctionData(allocator, encoded, &types);
    defer {
        for (decoded.parameters) |value| {
            value.deinit(allocator);
        }
        allocator.free(decoded.parameters);
    }

    try testing.expectEqualSlices(u8, &selector, &decoded.selector);
    try testing.expectEqual(@as(usize, 2), decoded.parameters.len);
    try testing.expectEqual(@as(u256, 1000), decoded.parameters[1].uint256);
}

test "signed integer encoding" {
    const allocator = testing.allocator;

    const values = [_]AbiValue{
        int256Value(-42),
        int8Value(-1),
    };

    const encoded = try encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    // Decode to verify
    const types = [_]AbiType{ .int256, .int8 };
    const decoded = try decodeAbiParameters(allocator, encoded, &types);
    defer {
        for (decoded) |value| {
            value.deinit(allocator);
        }
        allocator.free(decoded);
    }

    try testing.expectEqual(@as(i256, -42), decoded[0].int256);
    try testing.expectEqual(@as(i8, -1), decoded[1].int8);
}

test "fixed bytes encoding" {
    const allocator = testing.allocator;

    const test_bytes4: [4]u8 = [_]u8{ 0xde, 0xad, 0xbe, 0xef };
    const test_bytes32: [32]u8 = [_]u8{0x12} ** 32;

    const values = [_]AbiValue{
        bytes4Value(test_bytes4),
        bytes32Value(test_bytes32),
    };

    const encoded = try encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    const types = [_]AbiType{ .bytes4, .bytes32 };
    const decoded = try decodeAbiParameters(allocator, encoded, &types);
    defer {
        for (decoded) |value| {
            value.deinit(allocator);
        }
        allocator.free(decoded);
    }

    try testing.expectEqualSlices(u8, &test_bytes4, &decoded[0].bytes4);
    try testing.expectEqualSlices(u8, &test_bytes32, &decoded[1].bytes32);
}

test "empty data handling" {
    const allocator = testing.allocator;

    // Empty parameters
    const encoded_empty = try encodeAbiParameters(allocator, &[_]AbiValue{});
    defer allocator.free(encoded_empty);
    try testing.expectEqual(@as(usize, 0), encoded_empty.len);

    const decoded_empty = try decodeAbiParameters(allocator, &[_]u8{}, &[_]AbiType{});
    defer allocator.free(decoded_empty);
    try testing.expectEqual(@as(usize, 0), decoded_empty.len);

    // Empty string
    const empty_string_values = [_]AbiValue{stringValue("")};
    const encoded_string = try encodeAbiParameters(allocator, &empty_string_values);
    defer allocator.free(encoded_string);

    const string_types = [_]AbiType{.string};
    const decoded_string = try decodeAbiParameters(allocator, encoded_string, &string_types);
    defer {
        for (decoded_string) |value| {
            value.deinit(allocator);
        }
        allocator.free(decoded_string);
    }

    try testing.expectEqual(@as(usize, 0), decoded_string[0].string.len);
}

test "gas estimation" {
    const data = [_]u8{ 0x00, 0x00, 0xFF, 0xAB };
    const gas = estimateGasForCalldata(&data);
    const expected = 21000 + 4 + 4 + 16 + 16; // base + 2 zeros + 2 non-zeros
    try testing.expectEqual(expected, gas);
}

test "multiple integer sizes" {
    const allocator = testing.allocator;

    const values = [_]AbiValue{
        uint8Value(255),
        uint16Value(65535),
        uint32Value(4294967295),
        uint64Value(18446744073709551615),
        uint128Value(340282366920938463463374607431768211455),
    };

    const encoded = try encodeAbiParameters(allocator, &values);
    defer allocator.free(encoded);

    const types = [_]AbiType{ .uint8, .uint16, .uint32, .uint64, .uint128 };
    const decoded = try decodeAbiParameters(allocator, encoded, &types);
    defer {
        for (decoded) |value| {
            value.deinit(allocator);
        }
        allocator.free(decoded);
    }

    try testing.expectEqual(@as(u8, 255), decoded[0].uint8);
    try testing.expectEqual(@as(u16, 65535), decoded[1].uint16);
    try testing.expectEqual(@as(u32, 4294967295), decoded[2].uint32);
    try testing.expectEqual(@as(u64, 18446744073709551615), decoded[3].uint64);
    try testing.expectEqual(@as(u128, 340282366920938463463374607431768211455), decoded[4].uint128);
}
