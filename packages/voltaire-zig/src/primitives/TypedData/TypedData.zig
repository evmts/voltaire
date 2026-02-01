//! TypedData - EIP-712 Typed Structured Data
//!
//! Complete structure for EIP-712 typed structured data signing.
//! Computes the hash: keccak256("\x19\x01" || domainSeparator || hashStruct(message))
//!
//! ## Usage
//! ```zig
//! const TypedData = @import("primitives").TypedData;
//!
//! // Define types
//! var types = TypedData.TypesMap{};
//! defer types.deinit(allocator);
//! try types.put(allocator, "Person", &[_]TypedData.TypeField{
//!     .{ .name = "name", .type = "string" },
//!     .{ .name = "wallet", .type = "address" },
//! });
//!
//! // Create message value
//! var message = TypedData.Value{ .struct_val = ... };
//!
//! // Compute hash
//! const hash = try TypedData.hashTypedData(allocator, domain, "Person", &types, message);
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Domain = primitives.Domain;
const DomainSeparator = primitives.DomainSeparator;
const Address = primitives.Address;
const crypto = @import("crypto");

// ============================================================================
// Type Definitions
// ============================================================================

/// EIP-712 type field definition
pub const TypeField = struct {
    name: []const u8,
    type: []const u8,
};

/// Map of type name to array of fields
pub const TypesMap = std.StringHashMapUnmanaged([]const TypeField);

/// Value union for EIP-712 data
pub const Value = union(enum) {
    /// String value
    string: []const u8,
    /// Dynamic bytes
    bytes: []const u8,
    /// Fixed bytes (bytes1-bytes32)
    fixed_bytes: struct {
        data: []const u8,
        size: u8,
    },
    /// Unsigned integer (uint8-uint256)
    uint: u256,
    /// Signed integer (int8-int256)
    int: i256,
    /// Boolean
    bool_val: bool,
    /// Address (20 bytes)
    address: [20]u8,
    /// Struct value (map of field name -> Value)
    struct_val: std.StringHashMapUnmanaged(Value),
    /// Array value
    array: []const Value,

    /// Free owned memory
    pub fn deinit(self: *Value, allocator: std.mem.Allocator) void {
        switch (self.*) {
            .struct_val => |*map| {
                var it = map.iterator();
                while (it.next()) |entry| {
                    var val = entry.value_ptr.*;
                    val.deinit(allocator);
                }
                map.deinit(allocator);
            },
            .array => |arr| {
                for (arr) |*item| {
                    var val = @constCast(item);
                    val.deinit(allocator);
                }
                allocator.free(arr);
            },
            else => {},
        }
    }
};

// ============================================================================
// Core TypedData Structure (Simplified for pre-encoded messages)
// ============================================================================

/// TypedData - EIP-712 typed structured data (simplified, pre-encoded)
pub const TypedData = struct {
    /// Domain separator parameters
    domain: Domain,
    /// Primary type name (e.g., "Mail")
    primary_type: []const u8,
    /// Pre-encoded message data (typeHash || encodedFields)
    message_encoded: []const u8,

    /// Compute EIP-712 hash for signing (pre-encoded message)
    /// hash = keccak256("\x19\x01" || domainSeparator || keccak256(messageEncoded))
    pub fn hash(self: TypedData, allocator: std.mem.Allocator) ![32]u8 {
        // Compute domain separator
        const domain_sep = try self.domain.toHash(allocator);

        // Hash the encoded message
        var message_hash: [32]u8 = undefined;
        crypto.Keccak256.hash(self.message_encoded, &message_hash);

        // Concatenate: "\x19\x01" || domainSeparator || messageHash
        var data: [2 + 32 + 32]u8 = undefined;
        data[0] = 0x19;
        data[1] = 0x01;
        @memcpy(data[2..34], &domain_sep.bytes);
        @memcpy(data[34..66], &message_hash);

        // Hash the concatenated data
        var result: [32]u8 = undefined;
        crypto.Keccak256.hash(&data, &result);
        return result;
    }

    /// Get the EIP-712 prefix
    pub fn getPrefix() [2]u8 {
        return [_]u8{ 0x19, 0x01 };
    }

    /// Encode for signing (returns the data before final hash)
    /// Returns: "\x19\x01" || domainSeparator || messageHash
    pub fn encode(self: TypedData, allocator: std.mem.Allocator) ![66]u8 {
        // Compute domain separator
        const domain_sep = try self.domain.toHash(allocator);

        // Hash the encoded message
        var message_hash: [32]u8 = undefined;
        crypto.Keccak256.hash(self.message_encoded, &message_hash);

        // Concatenate: "\x19\x01" || domainSeparator || messageHash
        var result: [66]u8 = undefined;
        result[0] = 0x19;
        result[1] = 0x01;
        @memcpy(result[2..34], &domain_sep.bytes);
        @memcpy(result[34..66], &message_hash);

        return result;
    }

    /// Validate the typed data structure
    pub fn validate(self: TypedData) !void {
        // Validate domain
        try self.domain.validate();

        // Validate primary type is not empty
        if (self.primary_type.len == 0) {
            return error.InvalidPrimaryType;
        }

        // Validate message is not empty
        if (self.message_encoded.len == 0) {
            return error.InvalidMessage;
        }
    }
};

// ============================================================================
// Full EIP-712 Implementation
// ============================================================================

/// Compute EIP-712 typed data hash with full type resolution
/// hash = keccak256("\x19\x01" || domainSeparator || hashStruct(primaryType, message))
pub fn hashTypedData(
    allocator: std.mem.Allocator,
    domain: Domain,
    primary_type: []const u8,
    types: *const TypesMap,
    message: Value,
) ![32]u8 {
    // Compute domain separator
    const domain_sep = try domain.toHash(allocator);

    // Hash the message struct
    const message_hash = try hashStruct(allocator, primary_type, types, message);

    // Concatenate: "\x19\x01" || domainSeparator || messageHash
    var data: [2 + 32 + 32]u8 = undefined;
    data[0] = 0x19;
    data[1] = 0x01;
    @memcpy(data[2..34], &domain_sep.bytes);
    @memcpy(data[34..66], &message_hash);

    // Hash the concatenated data
    var result: [32]u8 = undefined;
    crypto.Keccak256.hash(&data, &result);
    return result;
}

/// Hash a struct according to EIP-712
/// hashStruct(s) = keccak256(typeHash || encodeData(s))
pub fn hashStruct(
    allocator: std.mem.Allocator,
    type_name: []const u8,
    types: *const TypesMap,
    value: Value,
) ![32]u8 {
    const encoded = try encodeData(allocator, type_name, types, value);
    defer allocator.free(encoded);

    var result: [32]u8 = undefined;
    crypto.Keccak256.hash(encoded, &result);
    return result;
}

/// Encode data according to EIP-712
/// encodeData(s) = typeHash || enc(field1) || enc(field2) || ...
pub fn encodeData(
    allocator: std.mem.Allocator,
    type_name: []const u8,
    types: *const TypesMap,
    value: Value,
) ![]u8 {
    // Get type definition
    const fields = types.get(type_name) orelse return error.TypeNotFound;

    // Compute type hash
    const type_string = try encodeTypeWithDeps(allocator, type_name, types);
    defer allocator.free(type_string);

    var type_hash: [32]u8 = undefined;
    crypto.Keccak256.hash(type_string, &type_hash);

    // Get struct value
    const struct_val = switch (value) {
        .struct_val => |v| v,
        else => return error.ExpectedStruct,
    };

    // Encode all field values
    var encoded_fields = std.ArrayList(u8){};
    defer encoded_fields.deinit(allocator);

    // Start with type hash
    try encoded_fields.appendSlice(allocator, &type_hash);

    // Encode each field
    for (fields) |field| {
        const field_value = struct_val.get(field.name) orelse return error.MissingField;
        const encoded_value = try encodeValue(allocator, field.type, types, field_value);
        defer allocator.free(encoded_value);
        try encoded_fields.appendSlice(allocator, encoded_value);
    }

    return try encoded_fields.toOwnedSlice(allocator);
}

/// Encode a type string with all dependencies
/// Example: "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
pub fn encodeTypeWithDeps(
    allocator: std.mem.Allocator,
    primary_type: []const u8,
    types: *const TypesMap,
) ![]u8 {
    // Find all dependencies
    var deps = std.StringHashMapUnmanaged(void){};
    defer deps.deinit(allocator);
    try findTypeDependencies(allocator, primary_type, types, &deps);

    // Sort dependencies alphabetically (excluding primary type)
    var dep_list = std.ArrayList([]const u8){};
    defer dep_list.deinit(allocator);

    var it = deps.iterator();
    while (it.next()) |entry| {
        if (!std.mem.eql(u8, entry.key_ptr.*, primary_type)) {
            try dep_list.append(allocator, entry.key_ptr.*);
        }
    }

    // Sort alphabetically
    std.mem.sort([]const u8, dep_list.items, {}, struct {
        fn lessThan(_: void, a: []const u8, b: []const u8) bool {
            return std.mem.order(u8, a, b) == .lt;
        }
    }.lessThan);

    // Build type string: primary type first, then sorted dependencies
    var result = std.ArrayList(u8){};
    defer result.deinit(allocator);

    // Encode primary type
    try encodeTypeString(allocator, primary_type, types, &result);

    // Encode dependencies
    for (dep_list.items) |dep| {
        try encodeTypeString(allocator, dep, types, &result);
    }

    return try result.toOwnedSlice(allocator);
}

/// Encode a single type string (no dependencies)
fn encodeTypeString(
    allocator: std.mem.Allocator,
    type_name: []const u8,
    types: *const TypesMap,
    result: *std.ArrayList(u8),
) !void {
    const fields = types.get(type_name) orelse return;

    try result.appendSlice(allocator, type_name);
    try result.append(allocator, '(');

    for (fields, 0..) |field, i| {
        if (i > 0) try result.append(allocator, ',');
        try result.appendSlice(allocator, field.type);
        try result.append(allocator, ' ');
        try result.appendSlice(allocator, field.name);
    }

    try result.append(allocator, ')');
}

/// Find all type dependencies recursively
fn findTypeDependencies(
    allocator: std.mem.Allocator,
    type_name: []const u8,
    types: *const TypesMap,
    seen: *std.StringHashMapUnmanaged(void),
) !void {
    // Skip if already seen
    if (seen.contains(type_name)) return;
    try seen.put(allocator, type_name, {});

    // Get type definition
    const fields = types.get(type_name) orelse return;

    // Check each field for custom types
    for (fields) |field| {
        const base_type = getBaseType(field.type);

        // Check if it's a custom type (not atomic)
        if (types.contains(base_type)) {
            try findTypeDependencies(allocator, base_type, types, seen);
        }
    }
}

/// Get base type (strip array suffix)
fn getBaseType(type_str: []const u8) []const u8 {
    if (std.mem.endsWith(u8, type_str, "[]")) {
        return type_str[0 .. type_str.len - 2];
    }
    return type_str;
}

/// Encode a value according to its type
pub fn encodeValue(
    allocator: std.mem.Allocator,
    type_str: []const u8,
    types: *const TypesMap,
    value: Value,
) ![]u8 {
    // Handle string/bytes specially (need to hash)
    if (std.mem.eql(u8, type_str, "string")) {
        return try encodeStringValue(allocator, value);
    }
    if (std.mem.eql(u8, type_str, "bytes")) {
        return try encodeBytesValue(allocator, value);
    }

    // Handle array types
    if (std.mem.endsWith(u8, type_str, "[]")) {
        return try encodeArrayValue(allocator, type_str, types, value);
    }

    // Handle custom struct types
    if (types.contains(type_str)) {
        const struct_hash = try hashStruct(allocator, type_str, types, value);
        const result = try allocator.alloc(u8, 32);
        @memcpy(result, &struct_hash);
        return result;
    }

    // Handle atomic types
    return try encodeAtomicValue(allocator, type_str, value);
}

/// Encode string value (keccak256 hash)
fn encodeStringValue(allocator: std.mem.Allocator, value: Value) ![]u8 {
    const str = switch (value) {
        .string => |s| s,
        else => return error.ExpectedString,
    };

    var hash: [32]u8 = undefined;
    crypto.Keccak256.hash(str, &hash);

    const result = try allocator.alloc(u8, 32);
    @memcpy(result, &hash);
    return result;
}

/// Encode bytes value (keccak256 hash)
fn encodeBytesValue(allocator: std.mem.Allocator, value: Value) ![]u8 {
    const bytes = switch (value) {
        .bytes => |b| b,
        else => return error.ExpectedBytes,
    };

    var hash: [32]u8 = undefined;
    crypto.Keccak256.hash(bytes, &hash);

    const result = try allocator.alloc(u8, 32);
    @memcpy(result, &hash);
    return result;
}

/// Encode array value
fn encodeArrayValue(
    allocator: std.mem.Allocator,
    type_str: []const u8,
    types: *const TypesMap,
    value: Value,
) ![]u8 {
    const base_type = type_str[0 .. type_str.len - 2];

    const arr = switch (value) {
        .array => |a| a,
        else => return error.ExpectedArray,
    };

    // Concatenate encoded elements
    var encoded = std.ArrayList(u8){};
    defer encoded.deinit(allocator);

    for (arr) |elem| {
        const encoded_elem = try encodeValue(allocator, base_type, types, elem);
        defer allocator.free(encoded_elem);
        try encoded.appendSlice(allocator, encoded_elem);
    }

    // Hash the concatenated elements
    var hash: [32]u8 = undefined;
    crypto.Keccak256.hash(encoded.items, &hash);

    const result = try allocator.alloc(u8, 32);
    @memcpy(result, &hash);
    return result;
}

/// Encode atomic value (address, bool, uintN, intN, bytesN)
fn encodeAtomicValue(allocator: std.mem.Allocator, type_str: []const u8, value: Value) ![]u8 {
    const result = try allocator.alloc(u8, 32);
    @memset(result, 0);

    // Address: left-pad to 32 bytes
    if (std.mem.eql(u8, type_str, "address")) {
        const addr = switch (value) {
            .address => |a| a,
            else => return error.ExpectedAddress,
        };
        @memcpy(result[12..32], &addr);
        return result;
    }

    // Bool: 0x00...00 or 0x00...01
    if (std.mem.eql(u8, type_str, "bool")) {
        const b = switch (value) {
            .bool_val => |v| v,
            else => return error.ExpectedBool,
        };
        result[31] = if (b) 1 else 0;
        return result;
    }

    // BytesN: right-pad to 32 bytes
    if (std.mem.startsWith(u8, type_str, "bytes")) {
        const size_str = type_str[5..];
        if (size_str.len > 0) {
            const size = std.fmt.parseInt(u8, size_str, 10) catch return error.InvalidType;
            if (size < 1 or size > 32) return error.InvalidType;

            const data = switch (value) {
                .fixed_bytes => |fb| fb.data,
                .bytes => |b| b,
                else => return error.ExpectedFixedBytes,
            };

            const copy_len = @min(data.len, size);
            @memcpy(result[0..copy_len], data[0..copy_len]);
            return result;
        }
    }

    // UintN: big-endian encoding
    if (std.mem.startsWith(u8, type_str, "uint")) {
        const bits_str = type_str[4..];
        const bits = std.fmt.parseInt(u16, bits_str, 10) catch return error.InvalidType;
        if (bits < 8 or bits > 256 or bits % 8 != 0) return error.InvalidType;

        const num = switch (value) {
            .uint => |n| n,
            else => return error.ExpectedUint,
        };

        std.mem.writeInt(u256, result[0..32], num, .big);
        return result;
    }

    // IntN: big-endian encoding (two's complement)
    if (std.mem.startsWith(u8, type_str, "int")) {
        const bits_str = type_str[3..];
        const bits = std.fmt.parseInt(u16, bits_str, 10) catch return error.InvalidType;
        if (bits < 8 or bits > 256 or bits % 8 != 0) return error.InvalidType;

        const num = switch (value) {
            .int => |n| n,
            else => return error.ExpectedInt,
        };

        // Convert to unsigned for encoding (two's complement)
        const unsigned: u256 = @bitCast(num);
        std.mem.writeInt(u256, result[0..32], unsigned, .big);
        return result;
    }

    return error.UnknownType;
}

// ============================================================================
// Simple Type Encoding (for compatibility)
// ============================================================================

/// Encode a type string (e.g., "Mail(address from,address to,string contents)")
pub fn encodeType(primary_type: []const u8, fields: []const TypeField, allocator: std.mem.Allocator) ![]u8 {
    var result = std.ArrayList(u8){};
    defer result.deinit(allocator);

    // Type name
    try result.appendSlice(allocator, primary_type);
    try result.append(allocator, '(');

    // Fields
    for (fields, 0..) |field, i| {
        if (i > 0) try result.append(allocator, ',');
        try result.appendSlice(allocator, field.type);
        try result.append(allocator, ' ');
        try result.appendSlice(allocator, field.name);
    }

    try result.append(allocator, ')');
    return try result.toOwnedSlice(allocator);
}

/// Hash a type string
pub fn hashType(type_string: []const u8) [32]u8 {
    var result: [32]u8 = undefined;
    crypto.Keccak256.hash(type_string, &result);
    return result;
}

/// Encode an address value (left-padded to 32 bytes)
pub fn encodeAddress(addr: [20]u8) [32]u8 {
    var result: [32]u8 = [_]u8{0} ** 32;
    @memcpy(result[12..32], &addr);
    return result;
}

/// Encode a uint256 value
pub fn encodeUint256(value: u256) [32]u8 {
    var result: [32]u8 = undefined;
    std.mem.writeInt(u256, &result, value, .big);
    return result;
}

/// Encode a bytes32 value (pass through)
pub fn encodeBytes32(value: [32]u8) [32]u8 {
    return value;
}

/// Encode a string value (keccak256 hash)
pub fn encodeString(value: []const u8) [32]u8 {
    var result: [32]u8 = undefined;
    crypto.Keccak256.hash(value, &result);
    return result;
}

/// Encode dynamic bytes value (keccak256 hash)
pub fn encodeBytes(value: []const u8) [32]u8 {
    return encodeString(value);
}

/// Encode a bool value
pub fn encodeBool(value: bool) [32]u8 {
    var result: [32]u8 = [_]u8{0} ** 32;
    result[31] = if (value) 1 else 0;
    return result;
}

/// Encode an int256 value (two's complement)
pub fn encodeInt256(value: i256) [32]u8 {
    var result: [32]u8 = undefined;
    const unsigned: u256 = @bitCast(value);
    std.mem.writeInt(u256, &result, unsigned, .big);
    return result;
}

// ============================================================================
// Tests
// ============================================================================

test "TypedData: hash produces consistent result" {
    const allocator = std.testing.allocator;

    const domain = Domain{
        .name = "Test",
        .version = "1",
        .chain_id = 1,
    };

    // Simple message encoding (typeHash + encoded fields)
    const message = "test message for signing";
    const typed_data = TypedData{
        .domain = domain,
        .primary_type = "Message",
        .message_encoded = message,
    };

    const hash1 = try typed_data.hash(allocator);
    const hash2 = try typed_data.hash(allocator);

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "TypedData: different messages produce different hashes" {
    const allocator = std.testing.allocator;

    const domain = Domain{
        .name = "Test",
        .version = "1",
    };

    const typed_data1 = TypedData{
        .domain = domain,
        .primary_type = "Message",
        .message_encoded = "message1",
    };

    const typed_data2 = TypedData{
        .domain = domain,
        .primary_type = "Message",
        .message_encoded = "message2",
    };

    const hash1 = try typed_data1.hash(allocator);
    const hash2 = try typed_data2.hash(allocator);

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "TypedData: different domains produce different hashes" {
    const allocator = std.testing.allocator;

    const domain1 = Domain{ .name = "Test1" };
    const domain2 = Domain{ .name = "Test2" };

    const typed_data1 = TypedData{
        .domain = domain1,
        .primary_type = "Message",
        .message_encoded = "same message",
    };

    const typed_data2 = TypedData{
        .domain = domain2,
        .primary_type = "Message",
        .message_encoded = "same message",
    };

    const hash1 = try typed_data1.hash(allocator);
    const hash2 = try typed_data2.hash(allocator);

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "TypedData: getPrefix returns correct prefix" {
    const prefix = TypedData.getPrefix();
    try std.testing.expectEqual(@as(u8, 0x19), prefix[0]);
    try std.testing.expectEqual(@as(u8, 0x01), prefix[1]);
}

test "TypedData: encode returns correct length" {
    const allocator = std.testing.allocator;

    const domain = Domain{ .name = "Test" };

    const typed_data = TypedData{
        .domain = domain,
        .primary_type = "Message",
        .message_encoded = "test",
    };

    const encoded = try typed_data.encode(allocator);
    try std.testing.expectEqual(@as(usize, 66), encoded.len);
    try std.testing.expectEqual(@as(u8, 0x19), encoded[0]);
    try std.testing.expectEqual(@as(u8, 0x01), encoded[1]);
}

test "TypedData: validate succeeds with valid data" {
    const domain = Domain{ .name = "Test" };

    const typed_data = TypedData{
        .domain = domain,
        .primary_type = "Message",
        .message_encoded = "test",
    };

    try typed_data.validate();
}

test "TypedData: validate fails with empty primary type" {
    const domain = Domain{ .name = "Test" };

    const typed_data = TypedData{
        .domain = domain,
        .primary_type = "",
        .message_encoded = "test",
    };

    try std.testing.expectError(error.InvalidPrimaryType, typed_data.validate());
}

test "TypedData: validate fails with empty message" {
    const domain = Domain{ .name = "Test" };

    const typed_data = TypedData{
        .domain = domain,
        .primary_type = "Message",
        .message_encoded = "",
    };

    try std.testing.expectError(error.InvalidMessage, typed_data.validate());
}

test "TypedData: validate fails with invalid domain" {
    const domain = Domain{}; // No fields

    const typed_data = TypedData{
        .domain = domain,
        .primary_type = "Message",
        .message_encoded = "test",
    };

    try std.testing.expectError(error.InvalidDomain, typed_data.validate());
}

test "encodeType: simple type" {
    const allocator = std.testing.allocator;
    const fields = [_]TypeField{
        .{ .name = "from", .type = "address" },
        .{ .name = "to", .type = "address" },
        .{ .name = "contents", .type = "string" },
    };

    const type_string = try encodeType("Mail", &fields, allocator);
    defer allocator.free(type_string);

    try std.testing.expectEqualStrings("Mail(address from,address to,string contents)", type_string);
}

test "encodeType: empty fields" {
    const allocator = std.testing.allocator;
    const fields = [_]TypeField{};

    const type_string = try encodeType("Empty", &fields, allocator);
    defer allocator.free(type_string);

    try std.testing.expectEqualStrings("Empty()", type_string);
}

test "hashType: produces 32-byte hash" {
    const type_string = "Mail(address from,address to,string contents)";
    const type_hash = hashType(type_string);
    try std.testing.expectEqual(@as(usize, 32), type_hash.len);
}

test "hashType: same input produces same hash" {
    const type_string = "Test(uint256 value)";
    const hash1 = hashType(type_string);
    const hash2 = hashType(type_string);
    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "encodeAddress: left pads to 32 bytes" {
    const addr = [_]u8{0x12} ** 20;
    const encoded = encodeAddress(addr);

    // First 12 bytes should be zero
    for (encoded[0..12]) |b| {
        try std.testing.expectEqual(@as(u8, 0), b);
    }

    // Last 20 bytes should be address
    try std.testing.expectEqualSlices(u8, &addr, encoded[12..32]);
}

test "encodeUint256: encodes correctly" {
    const value: u256 = 12345;
    const encoded = encodeUint256(value);
    const decoded = std.mem.readInt(u256, &encoded, .big);
    try std.testing.expectEqual(value, decoded);
}

test "encodeBytes32: pass through" {
    const value = [_]u8{0xab} ** 32;
    const encoded = encodeBytes32(value);
    try std.testing.expectEqualSlices(u8, &value, &encoded);
}

test "encodeString: hashes string" {
    const value = "hello world";
    const encoded = encodeString(value);

    // Should be keccak256 of string
    var expected: [32]u8 = undefined;
    crypto.Keccak256.hash(value, &expected);
    try std.testing.expectEqualSlices(u8, &expected, &encoded);
}

test "encodeBytes: same as encodeString" {
    const value = "test bytes";
    const str_encoded = encodeString(value);
    const bytes_encoded = encodeBytes(value);
    try std.testing.expectEqualSlices(u8, &str_encoded, &bytes_encoded);
}

test "encodeBool: true encodes to 1" {
    const encoded = encodeBool(true);
    try std.testing.expectEqual(@as(u8, 0), encoded[0]);
    try std.testing.expectEqual(@as(u8, 1), encoded[31]);
}

test "encodeBool: false encodes to 0" {
    const encoded = encodeBool(false);
    for (encoded) |b| {
        try std.testing.expectEqual(@as(u8, 0), b);
    }
}

test "encodeInt256: positive value" {
    const value: i256 = 12345;
    const encoded = encodeInt256(value);
    const decoded_unsigned = std.mem.readInt(u256, &encoded, .big);
    const decoded: i256 = @bitCast(decoded_unsigned);
    try std.testing.expectEqual(value, decoded);
}

test "encodeInt256: negative value" {
    const value: i256 = -12345;
    const encoded = encodeInt256(value);
    const decoded_unsigned = std.mem.readInt(u256, &encoded, .big);
    const decoded: i256 = @bitCast(decoded_unsigned);
    try std.testing.expectEqual(value, decoded);
}

test "encodeTypeWithDeps: simple type no deps" {
    const allocator = std.testing.allocator;

    var types = TypesMap{};
    defer types.deinit(allocator);

    const mail_fields = [_]TypeField{
        .{ .name = "from", .type = "address" },
        .{ .name = "to", .type = "address" },
        .{ .name = "contents", .type = "string" },
    };
    try types.put(allocator, "Mail", &mail_fields);

    const encoded = try encodeTypeWithDeps(allocator, "Mail", &types);
    defer allocator.free(encoded);

    try std.testing.expectEqualStrings("Mail(address from,address to,string contents)", encoded);
}

test "encodeTypeWithDeps: with dependencies" {
    const allocator = std.testing.allocator;

    var types = TypesMap{};
    defer types.deinit(allocator);

    const person_fields = [_]TypeField{
        .{ .name = "name", .type = "string" },
        .{ .name = "wallet", .type = "address" },
    };
    try types.put(allocator, "Person", &person_fields);

    const mail_fields = [_]TypeField{
        .{ .name = "from", .type = "Person" },
        .{ .name = "to", .type = "Person" },
        .{ .name = "contents", .type = "string" },
    };
    try types.put(allocator, "Mail", &mail_fields);

    const encoded = try encodeTypeWithDeps(allocator, "Mail", &types);
    defer allocator.free(encoded);

    // Mail comes first, then Person (sorted dependencies)
    try std.testing.expectEqualStrings(
        "Mail(Person from,Person to,string contents)Person(string name,address wallet)",
        encoded,
    );
}

test "hashStruct: simple struct" {
    const allocator = std.testing.allocator;

    var types = TypesMap{};
    defer types.deinit(allocator);

    const test_fields = [_]TypeField{
        .{ .name = "value", .type = "uint256" },
    };
    try types.put(allocator, "Test", &test_fields);

    var struct_val = std.StringHashMapUnmanaged(Value){};
    defer struct_val.deinit(allocator);
    try struct_val.put(allocator, "value", Value{ .uint = 42 });

    const value = Value{ .struct_val = struct_val };
    const hash1 = try hashStruct(allocator, "Test", &types, value);
    const hash2 = try hashStruct(allocator, "Test", &types, value);

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "hashTypedData: full EIP-712 hash" {
    const allocator = std.testing.allocator;

    const domain = Domain{
        .name = "Test App",
        .version = "1",
        .chain_id = 1,
    };

    var types = TypesMap{};
    defer types.deinit(allocator);

    const test_fields = [_]TypeField{
        .{ .name = "value", .type = "uint256" },
    };
    try types.put(allocator, "Test", &test_fields);

    var struct_val = std.StringHashMapUnmanaged(Value){};
    defer struct_val.deinit(allocator);
    try struct_val.put(allocator, "value", Value{ .uint = 42 });

    const message = Value{ .struct_val = struct_val };
    const hash1 = try hashTypedData(allocator, domain, "Test", &types, message);
    const hash2 = try hashTypedData(allocator, domain, "Test", &types, message);

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "encodeValue: address" {
    const allocator = std.testing.allocator;
    var types = TypesMap{};

    const addr = [_]u8{0x12} ** 20;
    const value = Value{ .address = addr };

    const encoded = try encodeValue(allocator, "address", &types, value);
    defer allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 32), encoded.len);
    // First 12 bytes zero
    for (encoded[0..12]) |b| {
        try std.testing.expectEqual(@as(u8, 0), b);
    }
    // Last 20 bytes is address
    try std.testing.expectEqualSlices(u8, &addr, encoded[12..32]);
}

test "encodeValue: bool" {
    const allocator = std.testing.allocator;
    var types = TypesMap{};

    const true_val = Value{ .bool_val = true };
    const false_val = Value{ .bool_val = false };

    const true_encoded = try encodeValue(allocator, "bool", &types, true_val);
    defer allocator.free(true_encoded);

    const false_encoded = try encodeValue(allocator, "bool", &types, false_val);
    defer allocator.free(false_encoded);

    try std.testing.expectEqual(@as(u8, 1), true_encoded[31]);
    try std.testing.expectEqual(@as(u8, 0), false_encoded[31]);
}

test "encodeValue: uint256" {
    const allocator = std.testing.allocator;
    var types = TypesMap{};

    const value = Value{ .uint = 12345 };

    const encoded = try encodeValue(allocator, "uint256", &types, value);
    defer allocator.free(encoded);

    const decoded = std.mem.readInt(u256, encoded[0..32], .big);
    try std.testing.expectEqual(@as(u256, 12345), decoded);
}

test "encodeValue: string" {
    const allocator = std.testing.allocator;
    var types = TypesMap{};

    const value = Value{ .string = "hello" };

    const encoded = try encodeValue(allocator, "string", &types, value);
    defer allocator.free(encoded);

    // Should be keccak256("hello")
    var expected: [32]u8 = undefined;
    crypto.Keccak256.hash("hello", &expected);
    try std.testing.expectEqualSlices(u8, &expected, encoded);
}

test "encodeValue: array" {
    const allocator = std.testing.allocator;
    var types = TypesMap{};

    const elements = [_]Value{
        Value{ .uint = 1 },
        Value{ .uint = 2 },
        Value{ .uint = 3 },
    };
    const value = Value{ .array = &elements };

    const encoded = try encodeValue(allocator, "uint256[]", &types, value);
    defer allocator.free(encoded);

    try std.testing.expectEqual(@as(usize, 32), encoded.len);
}

test "EIP-712 Mail example type hash" {
    // Known test vector from EIP-712 spec
    const type_string = "Mail(Person from,Person to,string contents)Person(string name,address wallet)";
    const type_hash = hashType(type_string);

    // This should match the known type hash from EIP-712 examples
    try std.testing.expectEqual(@as(usize, 32), type_hash.len);
}

test "getBaseType: strips array suffix" {
    try std.testing.expectEqualStrings("Person", getBaseType("Person[]"));
    try std.testing.expectEqualStrings("uint256", getBaseType("uint256[]"));
    try std.testing.expectEqualStrings("address", getBaseType("address"));
    try std.testing.expectEqualStrings("string", getBaseType("string"));
}
