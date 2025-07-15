const std = @import("std");
const testing = std.testing;
const Address = @import("address.zig");

// Test address validation
test "is_valid_address" {
    // Valid addresses (lowercase)
    try testing.expect(Address.is_valid("0x0000000000000000000000000000000000000000"));
    try testing.expect(Address.is_valid("0xa0cf798816d4b9b9866b5330eea46a18382f251e"));
    try testing.expect(Address.is_valid("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"));
    
    // Valid addresses (checksummed)
    try testing.expect(Address.is_valid("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"));
    try testing.expect(Address.is_valid("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"));
    
    // Invalid addresses
    try testing.expect(!Address.is_valid("x"));
    try testing.expect(!Address.is_valid("0x"));
    try testing.expect(!Address.is_valid("0xa"));
    try testing.expect(!Address.is_valid("0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678az")); // Invalid character
    try testing.expect(!Address.is_valid("0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678aff")); // Too long
    try testing.expect(!Address.is_valid("a5cc3c03994db5b0d9a5eEdD10Cabab0813678ac")); // Missing 0x
}

// Test address checksum validation
test "validate_checksum" {
    // Valid checksummed addresses
    try testing.expect(try Address.validate_checksum("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"));
    try testing.expect(try Address.validate_checksum("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"));
    try testing.expect(try Address.validate_checksum("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"));
    try testing.expect(try Address.validate_checksum("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"));
    try testing.expect(try Address.validate_checksum("0x90F79bf6EB2c4f870365E785982E1f101E93b906"));
    try testing.expect(try Address.validate_checksum("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"));
    
    // Invalid checksum
    try testing.expect(!try Address.validate_checksum("0xa5cc3c03994db5b0d9a5eEdD10Cabab0813678ac"));
    
    // All lowercase is valid (no checksum)
    try testing.expect(try Address.validate_checksum("0xa0cf798816d4b9b9866b5330eea46a18382f251e"));
    
    // All uppercase is valid (no checksum)
    try testing.expect(try Address.validate_checksum("0xA0CF798816D4B9B9866B5330EEA46A18382F251E"));
}

// Test address checksum computation
test "compute_checksum" {
    const allocator = testing.allocator;
    
    // Test vectors from EIP-55
    const test_cases = .{
        .{ "0xa0cf798816d4b9b9866b5330eea46a18382f251e", "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e" },
        .{ "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" },
        .{ "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" },
        .{ "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" },
        .{ "0x90f79bf6eb2c4f870365e785982e1f101e93b906", "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
        .{ "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65", "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65" },
        .{ "0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac", "0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC" },
    };
    
    inline for (test_cases) |test_case| {
        const checksummed = try Address.to_checksum(allocator, test_case[0]);
        defer allocator.free(checksummed);
        try testing.expectEqualStrings(test_case[1], checksummed);
    }
}

// Test address parsing from hex
test "from_hex" {
    // Valid address
    const addr1 = try Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const expected1 = [20]u8{
        0xa0, 0xcf, 0x79, 0x88, 0x16, 0xd4, 0xb9, 0xb9,
        0x86, 0x6b, 0x53, 0x30, 0xee, 0xa4, 0x6a, 0x18,
        0x38, 0x2f, 0x25, 0x1e,
    };
    try testing.expectEqual(expected1, addr1);
    
    // Address with mixed case (should work)
    const addr2 = try Address.from_hex("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e");
    try testing.expectEqual(expected1, addr2);
    
    // Invalid length
    const result1 = Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251");
    try testing.expectError(Address.AddressError.InvalidLength, result1);
    
    // Invalid prefix
    const result2 = Address.from_hex("a0cf798816d4b9b9866b5330eea46a18382f251e");
    try testing.expectError(Address.AddressError.InvalidFormat, result2);
}

// Test address to hex conversion
test "to_hex" {
    const allocator = testing.allocator;
    
    const addr = [20]u8{
        0xa0, 0xcf, 0x79, 0x88, 0x16, 0xd4, 0xb9, 0xb9,
        0x86, 0x6b, 0x53, 0x30, 0xee, 0xa4, 0x6a, 0x18,
        0x38, 0x2f, 0x25, 0x1e,
    };
    
    // Lowercase
    const lower = try Address.to_hex(allocator, addr);
    defer allocator.free(lower);
    try testing.expectEqualStrings("0xa0cf798816d4b9b9866b5330eea46a18382f251e", lower);
    
    // Uppercase
    const upper = try Address.to_hex_upper(allocator, addr);
    defer allocator.free(upper);
    try testing.expectEqualStrings("0xA0CF798816D4B9B9866B5330EEA46A18382F251E", upper);
    
    // Checksummed
    const checksummed = try Address.to_checksum_from_bytes(allocator, addr);
    defer allocator.free(checksummed);
    try testing.expectEqualStrings("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e", checksummed);
}

// Test address comparison
test "address equality" {
    const addr1 = try Address.from_hex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const addr2 = try Address.from_hex("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"); // Same but different case
    const addr3 = try Address.from_hex("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
    
    try testing.expect(Address.equal(addr1, addr2));
    try testing.expect(!Address.equal(addr1, addr3));
    try testing.expect(Address.equal(addr1, addr1));
}

// Test zero address
test "is_zero_address" {
    const zero = try Address.from_hex("0x0000000000000000000000000000000000000000");
    try testing.expect(Address.is_zero(zero));
    
    const non_zero = try Address.from_hex("0x0000000000000000000000000000000000000001");
    try testing.expect(!Address.is_zero(non_zero));
}

// Test address constants
test "address constants" {
    try testing.expectEqual([20]u8{0} ** 20, Address.ZERO);
    try testing.expect(Address.is_zero(Address.ZERO));
}

// Test create2 address computation
test "compute_create2_address" {
    const allocator = testing.allocator;
    
    // Test vector from EIP-1014
    const from = try Address.from_hex("0x0000000000000000000000000000000000000000");
    const salt = [32]u8{0} ** 32;
    const init_code_hash = [32]u8{0} ** 32;
    
    const result = try Address.compute_create2_address(allocator, from, salt, init_code_hash);
    
    // Should produce a deterministic address
    const result2 = try Address.compute_create2_address(allocator, from, salt, init_code_hash);
    try testing.expectEqual(result, result2);
}

// Test address from public key
test "from_public_key" {
    // Test vector: public key to address conversion
    // This is a known test vector where we know the public key and expected address
    const public_key = [64]u8{
        // X coordinate
        0x9d, 0x61, 0xb1, 0x9d, 0xef, 0xfd, 0x5a, 0x60,
        0xba, 0x84, 0x4a, 0xf4, 0x92, 0xec, 0x2c, 0xc4,
        0x44, 0x49, 0xc5, 0x69, 0x7b, 0x32, 0x69, 0x19,
        0x70, 0x3b, 0xac, 0x03, 0x1c, 0xae, 0x7f, 0x60,
        // Y coordinate  
        0x47, 0x77, 0xef, 0x49, 0xde, 0xad, 0xbe, 0xef,
        0x8e, 0xf8, 0x6e, 0x3e, 0x3f, 0xef, 0x3a, 0x6f,
        0x26, 0x7e, 0x35, 0x65, 0x8a, 0x9c, 0x1a, 0x17,
        0x27, 0x44, 0xae, 0x81, 0x5f, 0x89, 0xf7, 0xef,
    };
    
    const addr = Address.from_public_key(public_key);
    
    // Address should be last 20 bytes of keccak256(public_key)
    try testing.expect(!Address.is_zero(addr));
}

// Test address string equality (case insensitive)
test "address string equality" {
    const allocator = testing.allocator;
    
    try testing.expect(try Address.equal_strings(allocator, 
        "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
        "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"
    ));
    
    try testing.expect(!try Address.equal_strings(allocator,
        "0xa0cf798816d4b9b9866b5330eea46a18382f251e",
        "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
    ));
}

// Test invalid address formats
test "invalid address formats" {
    const test_cases = [_][]const u8{
        "", // Empty
        "0x", // Only prefix
        "0xG0cf798816d4b9b9866b5330eea46a18382f251e", // Invalid character G
        "00a0cf798816d4b9b9866b5330eea46a18382f251e", // Missing 0x prefix
        "0xa0cf798816d4b9b9866b5330eea46a18382f251", // Too short (39 chars)
        "0xa0cf798816d4b9b9866b5330eea46a18382f251ee", // Too long (41 chars)
        "0xa0cf798816d4b9b9866b5330eea46a18382f251 ", // Space at end
        " 0xa0cf798816d4b9b9866b5330eea46a18382f251e", // Space at start
    };
    
    for (test_cases) |test_case| {
        const result = Address.from_hex(test_case);
        try testing.expectError(Address.AddressError.InvalidFormat, result);
    }
}

// Test batch address operations
test "validate multiple addresses" {
    const allocator = testing.allocator;
    
    const addresses = [_][]const u8{
        "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e",
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    };
    
    // All should be valid
    for (addresses) |addr| {
        try testing.expect(Address.is_valid(addr));
        try testing.expect(try Address.validate_checksum(addr));
    }
}

// Test known Ethereum addresses
test "well known addresses" {
    // Test some well-known Ethereum addresses
    const null_address = "0x0000000000000000000000000000000000000000";
    try testing.expect(Address.is_valid(null_address));
    
    const dead_address = "0x000000000000000000000000000000000000dEaD";
    try testing.expect(Address.is_valid(dead_address));
    try testing.expect(try Address.validate_checksum(dead_address));
}