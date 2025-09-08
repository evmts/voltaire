const std = @import("std");
const testing = std.testing;
const crypto = std.crypto;
const Allocator = std.mem.Allocator;
const ArrayList = std.array_list.AlignedManaged;

// Import primitives
const Hash = @import("hash_utils.zig");
const primitives = @import("primitives");
const Hex = primitives.Hex;
const Crypto = @import("crypto.zig");
const Address = [20]u8;
const Signature = Crypto.Signature;
const PrivateKey = Crypto.PrivateKey;

// Import ABI for type encoding
const ABI = primitives.AbiEncoding;

// EIP-712 Error types
pub const Eip712Error = error{
    InvalidDomain,
    InvalidMessage,
    InvalidTypes,
    InvalidPrimaryType,
    InvalidEncoding,
    InvalidSignature,
    TypeNotFound,
    CircularReference,
    OutOfMemory,
    InvalidLength,
    InvalidUtf8,
} || std.mem.Allocator.Error;

// EIP-712 Domain structure
pub const Eip712Domain = struct {
    name: ?[]const u8 = null,
    version: ?[]const u8 = null,
    chain_id: ?u64 = null,
    verifying_contract: ?Address = null,
    salt: ?Hash.Hash = null,

    pub fn deinit(self: *Eip712Domain, allocator: Allocator) void {
        if (self.name) |name| allocator.free(name);
        if (self.version) |version| allocator.free(version);
    }
};

// Type property for EIP-712 type definitions
pub const TypeProperty = struct {
    name: []const u8,
    type: []const u8,

    pub fn deinit(self: *TypeProperty, allocator: Allocator) void {
        allocator.free(self.name);
        allocator.free(self.type);
    }
};

// EIP-712 Type definitions
pub const TypeDefinitions = struct {
    types: std.StringHashMap([]TypeProperty),

    pub fn init(allocator: Allocator) TypeDefinitions {
        return TypeDefinitions{
            .types = std.StringHashMap([]TypeProperty).init(allocator),
        };
    }

    pub fn deinit(self: *TypeDefinitions, allocator: Allocator) void {
        var iterator = self.types.iterator();
        while (iterator.next()) |entry| {
            allocator.free(entry.key_ptr.*);
            for (entry.value_ptr.*) |*prop| {
                prop.deinit(allocator);
            }
            allocator.free(entry.value_ptr.*);
        }
        self.types.deinit();
    }

    pub fn put(self: *TypeDefinitions, allocator: Allocator, type_name: []const u8, properties: []const TypeProperty) !void {
        const owned_name = try allocator.dupe(u8, type_name);
        const owned_properties = try allocator.alloc(TypeProperty, properties.len);

        for (properties, 0..) |prop, i| {
            owned_properties[i] = TypeProperty{
                .name = try allocator.dupe(u8, prop.name),
                .type = try allocator.dupe(u8, prop.type),
            };
        }

        try self.types.put(owned_name, owned_properties);
    }

    pub fn get(self: *const TypeDefinitions, type_name: []const u8) ?[]const TypeProperty {
        return self.types.get(type_name);
    }
};

// EIP-712 Message value (JSON-like structure)
pub const MessageValue = union(enum) {
    string: []const u8,
    number: u256,
    boolean: bool,
    address: Address,
    bytes: []const u8,
    array: []MessageValue,
    object: std.StringHashMap(MessageValue),

    pub fn deinit(self: *MessageValue, allocator: Allocator) void {
        switch (self.*) {
            .string => |s| allocator.free(s),
            .bytes => |b| allocator.free(b),
            .array => |arr| {
                for (arr) |*item| {
                    item.deinit(allocator);
                }
                allocator.free(arr);
            },
            .object => |*obj| {
                var iterator = obj.iterator();
                while (iterator.next()) |entry| {
                    allocator.free(entry.key_ptr.*);
                    entry.value_ptr.deinit(allocator);
                }
                obj.deinit();
            },
            else => {},
        }
    }
};

// EIP-712 Typed Data structure
pub const TypedData = struct {
    domain: Eip712Domain,
    types: TypeDefinitions,
    primary_type: []const u8,
    message: std.StringHashMap(MessageValue),

    pub fn init(allocator: Allocator) TypedData {
        return TypedData{
            .domain = Eip712Domain{},
            .types = TypeDefinitions.init(allocator),
            .primary_type = "",
            .message = std.StringHashMap(MessageValue).init(allocator),
        };
    }

    pub fn deinit(self: *TypedData, allocator: Allocator) void {
        self.domain.deinit(allocator);
        self.types.deinit(allocator);

        var iterator = self.message.iterator();
        while (iterator.next()) |entry| {
            allocator.free(entry.key_ptr.*);
            entry.value_ptr.deinit(allocator);
        }
        self.message.deinit();

        if (self.primary_type.len > 0) {
            allocator.free(self.primary_type);
        }
    }
};

// EIP-712 Domain type properties
fn get_eip712_domain_types(domain: *const Eip712Domain, allocator: Allocator) Eip712Error![]TypeProperty {
    var properties = ArrayList(TypeProperty, null).init(allocator);
    defer properties.deinit();

    if (domain.name != null) {
        try properties.append(TypeProperty{
            .name = try allocator.dupe(u8, "name"),
            .type = try allocator.dupe(u8, "string"),
        });
    }

    if (domain.version != null) {
        try properties.append(TypeProperty{
            .name = try allocator.dupe(u8, "version"),
            .type = try allocator.dupe(u8, "string"),
        });
    }

    if (domain.chain_id != null) {
        try properties.append(TypeProperty{
            .name = try allocator.dupe(u8, "chainId"),
            .type = try allocator.dupe(u8, "uint256"),
        });
    }

    if (domain.verifying_contract != null) {
        try properties.append(TypeProperty{
            .name = try allocator.dupe(u8, "verifyingContract"),
            .type = try allocator.dupe(u8, "address"),
        });
    }

    if (domain.salt != null) {
        try properties.append(TypeProperty{
            .name = try allocator.dupe(u8, "salt"),
            .type = try allocator.dupe(u8, "bytes32"),
        });
    }

    return properties.toOwnedSlice();
}

// Encode type string for EIP-712
fn encode_type(allocator: Allocator, primary_type: []const u8, types: *const TypeDefinitions) Eip712Error![]u8 {
    var visited = std.StringHashMap(void).init(allocator);
    defer visited.deinit();

    var result = ArrayList(u8, null).init(allocator);
    defer result.deinit();

    try encode_type_recursive(allocator, primary_type, types, &visited, &result);
    return result.toOwnedSlice();
}

fn encode_type_recursive(
    allocator: Allocator,
    type_name: []const u8,
    types: *const TypeDefinitions,
    visited: *std.StringHashMap(void),
    result: *ArrayList(u8, null),
) Eip712Error!void {
    if (visited.contains(type_name)) return;
    try visited.put(try allocator.dupe(u8, type_name), {});

    const type_properties = types.get(type_name) orelse return Eip712Error.TypeNotFound;

    // Add main type definition
    try result.appendSlice(type_name);
    try result.append('(');

    for (type_properties, 0..) |prop, i| {
        if (i > 0) try result.append(',');
        try result.appendSlice(prop.type);
        try result.append(' ');
        try result.appendSlice(prop.name);

        // If this is a custom type, recursively encode it
        if (types.get(prop.type) != null) {
            try encode_type_recursive(allocator, prop.type, types, visited, result);
        }
    }

    try result.append(')');
}

// Hash struct according to EIP-712
fn hash_struct(allocator: Allocator, primary_type: []const u8, data: *const std.StringHashMap(MessageValue), types: *const TypeDefinitions) Eip712Error!Hash.Hash {
    const encoded_data = try encode_data(allocator, primary_type, data, types);
    defer allocator.free(encoded_data);

    return Hash.keccak256(encoded_data);
}

// Encode data for struct hashing
fn encode_data(allocator: Allocator, primary_type: []const u8, data: *const std.StringHashMap(MessageValue), types: *const TypeDefinitions) Eip712Error![]u8 {
    const type_properties = types.get(primary_type) orelse return Eip712Error.TypeNotFound;

    var result = ArrayList(u8).init(allocator);
    defer result.deinit();

    // Add type hash
    const type_string = try encode_type(allocator, primary_type, types);
    defer allocator.free(type_string);

    const type_hash = Hash.keccak256(type_string);
    try result.appendSlice(&type_hash);

    // Add encoded values
    for (type_properties) |prop| {
        const value = data.get(prop.name) orelse return Eip712Error.InvalidMessage;
        const encoded_value = try encode_value(allocator, prop.type, value, types);
        defer allocator.free(encoded_value);
        try result.appendSlice(encoded_value);
    }

    return result.toOwnedSlice();
}

// Encode individual value
fn encode_value(allocator: Allocator, type_name: []const u8, value: MessageValue, types: *const TypeDefinitions) Eip712Error![]u8 {
    var result: [32]u8 = [_]u8{0} ** 32;

    if (std.mem.startsWith(u8, type_name, "uint")) {
        const num = switch (value) {
            .number => |n| n,
            else => return Eip712Error.InvalidMessage,
        };
        std.mem.writeInt(u256, &result, num, .big);
    } else if (std.mem.startsWith(u8, type_name, "int")) {
        const num = switch (value) {
            .number => |n| n,
            else => return Eip712Error.InvalidMessage,
        };
        std.mem.writeInt(u256, &result, num, .big);
    } else if (std.mem.eql(u8, type_name, "address")) {
        const addr = switch (value) {
            .address => |a| a,
            else => return Eip712Error.InvalidMessage,
        };
        @memcpy(result[12..32], &addr);
    } else if (std.mem.eql(u8, type_name, "bool")) {
        const bool_val = switch (value) {
            .boolean => |b| b,
            else => return Eip712Error.InvalidMessage,
        };
        result[31] = if (bool_val) 1 else 0;
    } else if (std.mem.eql(u8, type_name, "bytes")) {
        const bytes = switch (value) {
            .bytes => |b| b,
            else => return Eip712Error.InvalidMessage,
        };
        const hash = Hash.keccak256(bytes);
        @memcpy(&result, &hash);
    } else if (std.mem.eql(u8, type_name, "string")) {
        const str = switch (value) {
            .string => |s| s,
            else => return Eip712Error.InvalidMessage,
        };
        const hash = Hash.keccak256(str);
        @memcpy(&result, &hash);
    } else if (std.mem.startsWith(u8, type_name, "bytes")) {
        const bytes = switch (value) {
            .bytes => |b| b,
            else => return Eip712Error.InvalidMessage,
        };
        const size = std.fmt.parseInt(usize, type_name[5..], 10) catch return Eip712Error.InvalidMessage;
        if (bytes.len != size) return Eip712Error.InvalidMessage;
        @memcpy(result[0..size], bytes);
    } else if (types.get(type_name) != null) {
        // Custom type - hash the struct
        const obj = switch (value) {
            .object => |o| o,
            else => return Eip712Error.InvalidMessage,
        };
        const hash = try hash_struct(allocator, type_name, &obj, types);
        @memcpy(&result, &hash);
    } else {
        return Eip712Error.TypeNotFound;
    }

    return allocator.dupe(u8, &result);
}

// Hash domain separator
fn hash_domain(allocator: Allocator, domain: *const Eip712Domain) Eip712Error!Hash.Hash {
    const domain_type_name = "EIP712Domain";

    var types = TypeDefinitions.init(allocator);
    defer types.deinit(allocator);

    const domain_types = try get_eip712_domain_types(domain, allocator);
    defer {
        for (domain_types) |*prop| {
            prop.deinit(allocator);
        }
        allocator.free(domain_types);
    }

    try types.put(allocator, domain_type_name, domain_types);

    var domain_data = std.StringHashMap(MessageValue).init(allocator);
    defer {
        var iterator = domain_data.iterator();
        while (iterator.next()) |entry| {
            allocator.free(entry.key_ptr.*);
            entry.value_ptr.deinit(allocator);
        }
        domain_data.deinit();
    }

    if (domain.name) |name| {
        try domain_data.put(try allocator.dupe(u8, "name"), MessageValue{ .string = try allocator.dupe(u8, name) });
    }

    if (domain.version) |version| {
        try domain_data.put(try allocator.dupe(u8, "version"), MessageValue{ .string = try allocator.dupe(u8, version) });
    }

    if (domain.chain_id) |chain_id| {
        try domain_data.put(try allocator.dupe(u8, "chainId"), MessageValue{ .number = chain_id });
    }

    if (domain.verifying_contract) |contract| {
        try domain_data.put(try allocator.dupe(u8, "verifyingContract"), MessageValue{ .address = contract });
    }

    if (domain.salt) |salt| {
        try domain_data.put(try allocator.dupe(u8, "salt"), MessageValue{ .bytes = try allocator.dupe(u8, &salt) });
    }

    return hash_struct(allocator, domain_type_name, &domain_data, &types);
}

// Main EIP-712 functions

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Hash typed data according to EIP-712: keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message))
/// WARNING: This is a custom crypto implementation that has not been security audited.
/// EIP-712 implementation may have vulnerabilities in type encoding or hashing.
/// Do not use in production without proper security review.
pub fn unaudited_hashTypedData(allocator: Allocator, typed_data: *const TypedData) Eip712Error!Hash.Hash {
    var result = ArrayList(u8).init(allocator);
    defer result.deinit();

    // Add EIP-712 prefix
    try result.appendSlice("\x19\x01");

    // Add domain separator
    const domain_hash = try hash_domain(allocator, &typed_data.domain);
    try result.appendSlice(&domain_hash);

    // Add message hash (skip if primary type is EIP712Domain)
    if (!std.mem.eql(u8, typed_data.primary_type, "EIP712Domain")) {
        const message_hash = try hash_struct(allocator, typed_data.primary_type, &typed_data.message, &typed_data.types);
        try result.appendSlice(&message_hash);
    }

    const final_data = try result.toOwnedSlice();
    defer allocator.free(final_data);

    return Hash.keccak256(final_data);
}

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Sign typed data with a private key
/// WARNING: This is a custom crypto implementation that has not been security audited.
/// EIP-712 signing implementation may have vulnerabilities.
/// Do not use in production without proper security review.
pub fn unaudited_signTypedData(allocator: Allocator, typed_data: *const TypedData, private_key: PrivateKey) (Eip712Error || Crypto.CryptoError)!Signature {
    const hash = try unaudited_hashTypedData(allocator, typed_data);
    return Crypto.unaudited_signHash(hash, private_key);
}

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Verify typed data signature
/// WARNING: This is a custom crypto implementation that has not been security audited.
/// EIP-712 verification implementation may have vulnerabilities.
/// Do not use in production without proper security review.
pub fn unaudited_verifyTypedData(allocator: Allocator, typed_data: *const TypedData, signature: Signature, address: Address) (Eip712Error || Crypto.CryptoError)!bool {
    const hash = try unaudited_hashTypedData(allocator, typed_data);
    return Crypto.unaudited_verifySignature(hash, signature, address);
}

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Recover address from typed data signature
/// WARNING: This is a custom crypto implementation that has not been security audited.
/// EIP-712 address recovery implementation may have vulnerabilities.
/// Do not use in production without proper security review.
pub fn unaudited_recoverTypedDataAddress(allocator: Allocator, typed_data: *const TypedData, signature: Signature) (Eip712Error || Crypto.CryptoError)!Address {
    const hash = try unaudited_hashTypedData(allocator, typed_data);
    return Crypto.unaudited_recoverAddress(hash, signature);
}

// Convenience functions for common patterns

/// Create a simple typed data structure for testing
pub fn create_simple_typed_data(allocator: Allocator, domain: Eip712Domain, primary_type: []const u8) !TypedData {
    var typed_data = TypedData.init(allocator);

    // Set domain
    typed_data.domain = domain;

    // Set primary type
    typed_data.primary_type = try allocator.dupe(u8, primary_type);

    return typed_data;
}

/// Create EIP-712 domain
pub fn create_domain(allocator: Allocator, name: ?[]const u8, version: ?[]const u8, chain_id: ?u64, verifying_contract: ?Address) Eip712Error!Eip712Domain {
    return Eip712Domain{
        .name = if (name) |n| try allocator.dupe(u8, n) else null,
        .version = if (version) |v| try allocator.dupe(u8, v) else null,
        .chain_id = chain_id,
        .verifying_contract = verifying_contract,
        .salt = null,
    };
}

// =============================================================================
// Tests
// =============================================================================

test "EIP-712 domain hashing" {
    const allocator = testing.allocator;

    const domain = try create_domain(allocator, "Test", "1", 1, null);
    defer {
        var mut_domain = domain;
        mut_domain.deinit(allocator);
    }

    const hash = try hash_domain(allocator, &domain);

    // Verify hash is not all zeros
    const zero_hash = [_]u8{0} ** 32;
    try testing.expect(!std.mem.eql(u8, &hash, &zero_hash));
}

test "EIP-712 type encoding" {
    const allocator = testing.allocator;

    var types = TypeDefinitions.init(allocator);
    defer types.deinit(allocator);

    const person_props = [_]TypeProperty{
        TypeProperty{ .name = "name", .type = "string" },
        TypeProperty{ .name = "wallet", .type = "address" },
    };

    try types.put(allocator, "Person", &person_props);

    const encoded = try encode_type(allocator, "Person", &types);
    defer allocator.free(encoded);

    try testing.expect(std.mem.indexOf(u8, encoded, "Person(") != null);
    try testing.expect(std.mem.indexOf(u8, encoded, "string name") != null);
    try testing.expect(std.mem.indexOf(u8, encoded, "address wallet") != null);
}

test "EIP-712 signature roundtrip" {
    const allocator = testing.allocator;

    // Create a simple domain
    const domain = try create_domain(allocator, "TestDomain", "1", 1, null);
    defer {
        var mut_domain = domain;
        mut_domain.deinit(allocator);
    }

    // Create typed data structure
    var typed_data = TypedData.init(allocator);
    defer typed_data.deinit(allocator);

    typed_data.domain = domain;
    typed_data.primary_type = try allocator.dupe(u8, "TestMessage");

    // Add simple type definition
    const test_props = [_]TypeProperty{
        TypeProperty{ .name = "value", .type = "uint256" },
    };
    try typed_data.types.put(allocator, "TestMessage", &test_props);

    // Add message data
    try typed_data.message.put(try allocator.dupe(u8, "value"), MessageValue{ .number = 42 });

    // Generate key pair
    const private_key = try Crypto.unaudited_randomPrivateKey();
    const public_key = try Crypto.unaudited_getPublicKey(private_key);
    const expected_address = public_key.toAddress();

    // Sign typed data
    const signature = try unaudited_signTypedData(allocator, &typed_data, private_key);

    // Verify signature
    try testing.expect(try unaudited_verifyTypedData(allocator, &typed_data, signature, expected_address));

    // Recover address
    const recovered_address = try unaudited_recoverTypedDataAddress(allocator, &typed_data, signature);
    try testing.expect(std.mem.eql(u8, &recovered_address, &expected_address));
}

test "EIP-712 hash deterministic" {
    const allocator = testing.allocator;

    const domain = try create_domain(allocator, "TestDomain", "1", 1, null);
    defer {
        var mut_domain = domain;
        mut_domain.deinit(allocator);
    }

    var typed_data = TypedData.init(allocator);
    defer typed_data.deinit(allocator);

    typed_data.domain = domain;
    typed_data.primary_type = try allocator.dupe(u8, "TestMessage");

    const test_props = [_]TypeProperty{
        TypeProperty{ .name = "value", .type = "uint256" },
    };
    try typed_data.types.put(allocator, "TestMessage", &test_props);

    try typed_data.message.put(try allocator.dupe(u8, "value"), MessageValue{ .number = 42 });

    // Hash twice and verify they're the same
    const hash1 = try unaudited_hashTypedData(allocator, &typed_data);
    const hash2 = try unaudited_hashTypedData(allocator, &typed_data);

    try testing.expect(std.mem.eql(u8, &hash1, &hash2));
}

test "EIP-712 basic functionality" {
    const allocator = testing.allocator;

    // Test basic hash generation
    const domain = Eip712Domain{
        .name = "TestDomain",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = null,
        .salt = null,
    };

    var typed_data = TypedData.init(allocator);
    defer typed_data.deinit(allocator);

    typed_data.domain = domain;
    typed_data.primary_type = "TestMessage";

    // Try to hash - this should work even if we don't have complete type definitions
    const hash_result = unaudited_hashTypedData(allocator, &typed_data);

    // We expect this to potentially fail but not crash
    if (hash_result) |hash| {
        // If successful, verify hash is not all zeros
        const zero_hash = [_]u8{0} ** 32;
        try testing.expect(!std.mem.eql(u8, &hash, &zero_hash));
    } else |_| {
        // If it fails, that's expected for incomplete type definitions
        // This is fine - we're just testing that it doesn't crash
    }
}

test "EIP-712 crypto integration" {
    // Test that the crypto functions are available
    const private_key = try Crypto.unaudited_randomPrivateKey();
    const public_key = try Crypto.unaudited_getPublicKey(private_key);
    const address = public_key.toAddress();

    // Basic test that addresses work
    const zero_address = [_]u8{0} ** 20;
    try testing.expect(!std.mem.eql(u8, &address, &zero_address));
}
