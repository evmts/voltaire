const std = @import("std");
const Address = @import("address.zig");

// Fuzz tests for Address operations

test "fuzz fromHex parsing" {
    const input = std.testing.fuzzInput(.{});

    // Test with various input lengths and formats
    _ = Address.fromHex(input) catch |err| {
        try std.testing.expect(
            err == error.InvalidHexFormat or
                err == error.InvalidHexString,
        );
        return;
    };
}

test "fuzz fromHex with 0x prefix" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 2) return;

    // Construct input with 0x prefix
    var buf: [256]u8 = undefined;
    if (input.len > 254) return;

    buf[0] = '0';
    buf[1] = 'x';
    @memcpy(buf[2 .. 2 + input.len], input);

    _ = Address.fromHex(buf[0 .. 2 + input.len]) catch |err| {
        try std.testing.expect(
            err == error.InvalidHexFormat or
                err == error.InvalidHexString,
        );
        return;
    };
}

test "fuzz fromBytes validation" {
    const input = std.testing.fuzzInput(.{});

    const result = Address.fromBytes(input) catch |err| {
        try std.testing.expect(err == error.InvalidAddressLength);
        return;
    };

    // If successful, verify length invariant
    try std.testing.expectEqual(@as(usize, 20), result.bytes.len);
}

test "fuzz toU256 and fromU256 roundtrip" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);
    const u256_val = Address.toU256(addr);
    const roundtrip = Address.fromU256(u256_val);

    try std.testing.expect(Address.equals(addr, roundtrip));
}

test "fuzz fromNumber conversions" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = std.mem.readInt(u256, input[0..32], .big);
    const addr = Address.fromNumber(value);

    // Verify length invariant
    try std.testing.expectEqual(@as(usize, 20), addr.bytes.len);

    // Verify roundtrip
    const back = Address.toU256(addr);
    const addr2 = Address.fromU256(back);
    try std.testing.expect(Address.equals(addr, addr2));
}

test "fuzz addressToHex formatting" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);
    const hex = Address.toHex(addr);

    // Verify hex format
    try std.testing.expectEqual(@as(usize, 42), hex.len);
    try std.testing.expectEqual(@as(u8, '0'), hex[0]);
    try std.testing.expectEqual(@as(u8, 'x'), hex[1]);

    // Verify all hex chars
    for (hex[2..]) |c| {
        const valid = switch (c) {
            '0'...'9', 'a'...'f' => true,
            else => false,
        };
        try std.testing.expect(valid);
    }
}

test "fuzz checksumming" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);
    const checksum = Address.toChecksummed(addr);

    // Verify format
    try std.testing.expectEqual(@as(usize, 42), checksum.len);
    try std.testing.expectEqual(@as(u8, '0'), checksum[0]);
    try std.testing.expectEqual(@as(u8, 'x'), checksum[1]);

    // Verify mixed case is valid
    for (checksum[2..]) |c| {
        const valid = switch (c) {
            '0'...'9', 'a'...'f', 'A'...'F' => true,
            else => false,
        };
        try std.testing.expect(valid);
    }

    // Verify checksum validation
    try std.testing.expect(Address.isValidChecksum(&checksum));
}

test "fuzz hex encoding roundtrip" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);
    const hex = Address.toHex(addr);
    const parsed = try Address.fromHex(&hex);

    try std.testing.expect(Address.equals(addr, parsed));
}

test "fuzz checksum roundtrip" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);
    const checksum = Address.toChecksummed(addr);
    const parsed = try Address.fromHex(&checksum);

    try std.testing.expect(Address.equals(addr, parsed));
}

test "fuzz isValid validation" {
    const input = std.testing.fuzzInput(.{});

    const valid = Address.isValid(input);

    // If valid, should be parseable
    if (valid) {
        _ = try Address.fromHex(input);
    }
}

test "fuzz isValidChecksum validation" {
    const input = std.testing.fuzzInput(.{});

    const valid = Address.isValidChecksum(input);

    // If valid checksum, must be valid address
    if (valid) {
        try std.testing.expect(Address.isValid(input));
        _ = try Address.fromHex(input);
    }
}

test "fuzz equality comparison" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 40) return;

    const addr1 = try Address.fromBytes(input[0..20]);
    const addr2 = try Address.fromBytes(input[20..40]);

    // Test equality is reflexive
    try std.testing.expect(Address.equals(addr1, addr1));
    try std.testing.expect(Address.eql(addr1, addr1));

    // Test equality is symmetric
    const eq = Address.equals(addr1, addr2);
    try std.testing.expectEqual(eq, Address.equals(addr2, addr1));
    try std.testing.expectEqual(eq, Address.eql(addr1, addr2));
    try std.testing.expectEqual(eq, Address.eql(addr2, addr1));
}

test "fuzz compare ordering" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 40) return;

    const addr1 = try Address.fromBytes(input[0..20]);
    const addr2 = try Address.fromBytes(input[20..40]);

    const cmp = Address.compare(addr1, addr2);

    // Verify compare is reflexive
    try std.testing.expectEqual(@as(i8, 0), Address.compare(addr1, addr1));

    // Verify compare is antisymmetric
    const cmp_rev = Address.compare(addr2, addr1);
    if (cmp < 0) {
        try std.testing.expect(cmp_rev > 0);
    } else if (cmp > 0) {
        try std.testing.expect(cmp_rev < 0);
    } else {
        try std.testing.expectEqual(@as(i8, 0), cmp_rev);
    }

    // Verify lessThan/greaterThan consistency
    try std.testing.expectEqual(cmp < 0, Address.lessThan(addr1, addr2));
    try std.testing.expectEqual(cmp > 0, Address.greaterThan(addr1, addr2));
}

test "fuzz isZero function" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);
    const zero = Address.isZero(addr);

    // Verify consistency with ZERO_ADDRESS
    const equals_zero = Address.equals(addr, Address.ZERO_ADDRESS);
    try std.testing.expectEqual(equals_zero, zero);

    // If zero, all bytes must be 0
    if (zero) {
        for (addr.bytes) |byte| {
            try std.testing.expectEqual(@as(u8, 0), byte);
        }
    }
}

test "fuzz toUppercase and toLowercase" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);
    const lower = Address.toLowercase(addr);
    const upper = Address.toUppercase(addr);

    // Verify format
    try std.testing.expectEqual(@as(usize, 42), lower.len);
    try std.testing.expectEqual(@as(usize, 42), upper.len);

    // Verify lowercase only contains lowercase hex
    for (lower[2..]) |c| {
        const valid = switch (c) {
            '0'...'9', 'a'...'f' => true,
            else => false,
        };
        try std.testing.expect(valid);
    }

    // Verify uppercase only contains uppercase hex
    for (upper[2..]) |c| {
        const valid = switch (c) {
            '0'...'9', 'A'...'F' => true,
            else => false,
        };
        try std.testing.expect(valid);
    }

    // Both should parse to same address
    const from_lower = try Address.fromHex(&lower);
    const from_upper = try Address.fromHex(&upper);
    try std.testing.expect(Address.equals(from_lower, from_upper));
    try std.testing.expect(Address.equals(addr, from_lower));
}

test "fuzz toShortHex format" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);
    const short = Address.toShortHex(addr);

    // Verify format: "0x" + 6 chars + "..." + 3 chars = 14 chars
    try std.testing.expectEqual(@as(usize, 14), short.len);
    try std.testing.expectEqual(@as(u8, '0'), short[0]);
    try std.testing.expectEqual(@as(u8, 'x'), short[1]);
    try std.testing.expectEqual(@as(u8, '.'), short[8]);
    try std.testing.expectEqual(@as(u8, '.'), short[9]);
    try std.testing.expectEqual(@as(u8, '.'), short[10]);

    // Verify hex chars
    const full_hex = Address.toHex(addr);
    for (short[2..8], 0..) |c, i| {
        try std.testing.expectEqual(full_hex[2 + i], c);
    }
    for (short[11..14], 0..) |c, i| {
        try std.testing.expectEqual(full_hex[39 + i], c);
    }
}

test "fuzz toAbiEncoded and fromAbiEncoded roundtrip" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);
    const encoded = Address.toAbiEncoded(addr);

    // Verify ABI encoding format: 12 zero bytes + 20 address bytes
    try std.testing.expectEqual(@as(usize, 32), encoded.len);
    for (encoded[0..12]) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }

    // Verify roundtrip
    const decoded = try Address.fromAbiEncoded(&encoded);
    try std.testing.expect(Address.equals(addr, decoded));
}

test "fuzz fromAbiEncoded invalid lengths" {
    const input = std.testing.fuzzInput(.{});

    const result = Address.fromAbiEncoded(input) catch |err| {
        try std.testing.expect(err == error.InvalidAbiEncodedLength);
        return;
    };

    // If successful, input must be exactly 32 bytes
    try std.testing.expectEqual(@as(usize, 32), input.len);
    try std.testing.expectEqual(@as(usize, 20), result.bytes.len);
}

test "fuzz areAddressesEqual string comparison" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 84) return; // Need "0x" + 40 + "0x" + 40

    // Try to compare two hex strings
    const mid = input.len / 2;
    const result = Address.areAddressesEqual(input[0..mid], input[mid..]) catch |err| {
        try std.testing.expect(err == error.InvalidAddress);
        return;
    };

    // If successful, should be same as parsing and comparing
    const addr1 = try Address.fromHex(input[0..mid]);
    const addr2 = try Address.fromHex(input[mid..]);
    try std.testing.expectEqual(result, Address.equals(addr1, addr2));
}

test "fuzz calculateCreateAddress determinism" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 28) return; // 20 bytes + 8 bytes for nonce

    const allocator = std.testing.allocator;
    const creator = try Address.fromBytes(input[0..20]);
    const nonce = std.mem.readInt(u64, input[20..28], .big);

    const addr1 = try Address.calculateCreateAddress(allocator, creator, nonce);
    const addr2 = try Address.calculateCreateAddress(allocator, creator, nonce);

    // Should be deterministic
    try std.testing.expect(Address.equals(addr1, addr2));

    // Should produce valid address
    try std.testing.expectEqual(@as(usize, 20), addr1.bytes.len);
}

test "fuzz calculateCreateAddress nonce variations" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 36) return; // 20 bytes + 8 + 8 for two nonces

    const allocator = std.testing.allocator;
    const creator = try Address.fromBytes(input[0..20]);
    const nonce1 = std.mem.readInt(u64, input[20..28], .big);
    const nonce2 = std.mem.readInt(u64, input[28..36], .big);

    const addr1 = try Address.calculateCreateAddress(allocator, creator, nonce1);
    const addr2 = try Address.calculateCreateAddress(allocator, creator, nonce2);

    // Same nonce must produce same address
    if (nonce1 == nonce2) {
        try std.testing.expect(Address.equals(addr1, addr2));
    }
    // Different nonces usually produce different addresses, but collisions theoretically possible
    // Just verify both are valid addresses
    try std.testing.expectEqual(@as(usize, 20), addr1.bytes.len);
    try std.testing.expectEqual(@as(usize, 20), addr2.bytes.len);
}

test "fuzz calculateCreate2Address determinism" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 52) return; // 20 bytes creator + 32 bytes salt

    const allocator = std.testing.allocator;
    const creator = try Address.fromBytes(input[0..20]);
    const salt = std.mem.readInt(u256, input[20..52], .big);

    // Use remaining bytes as init code (if any)
    const init_code = if (input.len > 52) input[52..] else "";

    const addr1 = try Address.calculateCreate2Address(allocator, creator, salt, init_code);
    const addr2 = try Address.calculateCreate2Address(allocator, creator, salt, init_code);

    // Should be deterministic
    try std.testing.expect(Address.equals(addr1, addr2));

    // Should produce valid address
    try std.testing.expectEqual(@as(usize, 20), addr1.bytes.len);
}

test "fuzz calculateCreate2Address with getCreate2Address" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 52) return;

    const allocator = std.testing.allocator;
    const creator = try Address.fromBytes(input[0..20]);
    const salt_u256 = std.mem.readInt(u256, input[20..52], .big);
    const salt_bytes: [32]u8 = @bitCast(salt_u256);

    const init_code = if (input.len > 52) input[52..] else "";

    // Calculate using allocator version
    const addr1 = try Address.calculateCreate2Address(allocator, creator, salt_u256, init_code);

    // Calculate using stack version with pre-hashed code
    var init_code_hash: [32]u8 = undefined;
    std.crypto.hash.sha3.Keccak256.hash(init_code, &init_code_hash, .{});
    const addr2 = Address.getCreate2Address(creator, salt_bytes, init_code_hash);

    // Should produce same result
    try std.testing.expect(Address.equals(addr1, addr2));
}

test "fuzz fromPublicKey consistency" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return; // Need 2 u256 values

    const x = std.mem.readInt(u256, input[0..32], .big);
    const y = std.mem.readInt(u256, input[32..64], .big);

    const addr = Address.fromPublicKey(x, y);

    // Should produce valid address
    try std.testing.expectEqual(@as(usize, 20), addr.bytes.len);

    // Should be deterministic
    const addr2 = Address.fromPublicKey(x, y);
    try std.testing.expect(Address.equals(addr, addr2));
}

test "fuzz PublicKey parsing" {
    const input = std.testing.fuzzInput(.{});

    const result = Address.PublicKey.fromHex(input) catch |err| {
        try std.testing.expect(
            err == error.InvalidPublicKeyFormat or
                err == error.InvalidPublicKeyLength or
                err == error.InvalidPublicKeyPrefix or
                err == error.InvalidHexString,
        );
        return;
    };

    // If successful, verify invariants
    try std.testing.expectEqual(@as(usize, 32), result.x.len);
    try std.testing.expectEqual(@as(usize, 32), result.y.len);
    try std.testing.expect(result.prefix == 0x04);
}

test "fuzz formatWithCase consistency" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);

    const lower = Address.formatWithCase(addr, false);
    const upper = Address.formatWithCase(addr, true);

    // Both should parse back to same address
    const from_lower = try Address.fromHex(&lower);
    const from_upper = try Address.fromHex(&upper);

    try std.testing.expect(Address.equals(addr, from_lower));
    try std.testing.expect(Address.equals(addr, from_upper));
    try std.testing.expect(Address.equals(from_lower, from_upper));
}

test "fuzz address comparison transitivity" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 60) return;

    const addr1 = try Address.fromBytes(input[0..20]);
    const addr2 = try Address.fromBytes(input[20..40]);
    const addr3 = try Address.fromBytes(input[40..60]);

    const cmp12 = Address.compare(addr1, addr2);
    const cmp23 = Address.compare(addr2, addr3);
    const cmp13 = Address.compare(addr1, addr3);

    // Verify transitivity: if a < b and b < c, then a < c
    if (cmp12 < 0 and cmp23 < 0) {
        try std.testing.expect(cmp13 < 0);
    }

    // Verify transitivity: if a > b and b > c, then a > c
    if (cmp12 > 0 and cmp23 > 0) {
        try std.testing.expect(cmp13 > 0);
    }

    // Verify transitivity: if a == b and b == c, then a == c
    if (cmp12 == 0 and cmp23 == 0) {
        try std.testing.expectEqual(@as(i8, 0), cmp13);
    }
}

test "fuzz u256 overflow handling" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 32) return;

    const large_value = std.mem.readInt(u256, input[0..32], .big);

    // fromU256 should handle all u256 values without panic
    const addr = Address.fromU256(large_value);
    try std.testing.expectEqual(@as(usize, 20), addr.bytes.len);

    // toU256 should only use lower 160 bits
    const back = Address.toU256(addr);

    // If original value fits in 160 bits, should roundtrip
    if (large_value < (@as(u256, 1) << 160)) {
        try std.testing.expectEqual(large_value, back);
    }

    // back value should always fit in 160 bits
    try std.testing.expect(back < (@as(u256, 1) << 160));
}

test "fuzz hex string case insensitivity" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);
    const lower_hex = Address.toLowercase(addr);
    const upper_hex = Address.toUppercase(addr);
    const checksum_hex = Address.toChecksummed(addr);

    // All should parse to same address
    const from_lower = try Address.fromHex(&lower_hex);
    const from_upper = try Address.fromHex(&upper_hex);
    const from_checksum = try Address.fromHex(&checksum_hex);

    try std.testing.expect(Address.equals(addr, from_lower));
    try std.testing.expect(Address.equals(addr, from_upper));
    try std.testing.expect(Address.equals(addr, from_checksum));
}

// Run fuzz tests with: zig build test --fuzz
