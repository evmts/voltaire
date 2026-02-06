//! ERC-1167 Minimal Proxy Implementation
//!
//! Provides utilities for generating and parsing ERC-1167 minimal proxy bytecode.
//! The minimal proxy pattern creates a lightweight proxy contract that delegates
//! all calls to a fixed implementation address.
//!
//! @see https://eips.ethereum.org/EIPS/eip-1167

const std = @import("std");

/// Generate ERC-1167 minimal proxy bytecode
/// Creates the 55-byte creation code for a minimal proxy
///
/// @param implementation_address 20-byte implementation address
/// @return 55-byte creation code
pub fn generateErc1167(implementation_address: [20]u8) [55]u8 {
    var bytecode: [55]u8 = undefined;

    // Creation code (10 bytes): 3d602d80600a3d3981f3
    bytecode[0] = 0x3d; // RETURNDATASIZE
    bytecode[1] = 0x60; // PUSH1
    bytecode[2] = 0x2d; // 45 (runtime code length)
    bytecode[3] = 0x80; // DUP1
    bytecode[4] = 0x60; // PUSH1
    bytecode[5] = 0x0a; // 10 (creation code length)
    bytecode[6] = 0x3d; // RETURNDATASIZE
    bytecode[7] = 0x39; // CODECOPY
    bytecode[8] = 0x81; // DUP2
    bytecode[9] = 0xf3; // RETURN

    // Runtime code prefix (9 bytes): 363d3d373d3d3d363d73
    bytecode[10] = 0x36; // CALLDATASIZE
    bytecode[11] = 0x3d; // RETURNDATASIZE
    bytecode[12] = 0x3d; // RETURNDATASIZE
    bytecode[13] = 0x37; // CALLDATACOPY
    bytecode[14] = 0x3d; // RETURNDATASIZE
    bytecode[15] = 0x3d; // RETURNDATASIZE
    bytecode[16] = 0x3d; // RETURNDATASIZE
    bytecode[17] = 0x36; // CALLDATASIZE
    bytecode[18] = 0x3d; // RETURNDATASIZE
    bytecode[19] = 0x73; // PUSH20

    // Implementation address (20 bytes)
    for (implementation_address, 0..) |byte, i| {
        bytecode[20 + i] = byte;
    }

    // Runtime code suffix (15 bytes): 5af43d82803e903d91602b57fd5bf3
    bytecode[40] = 0x5a; // GAS
    bytecode[41] = 0xf4; // DELEGATECALL
    bytecode[42] = 0x3d; // RETURNDATASIZE
    bytecode[43] = 0x82; // DUP3
    bytecode[44] = 0x80; // DUP1
    bytecode[45] = 0x3e; // RETURNDATACOPY
    bytecode[46] = 0x90; // SWAP1
    bytecode[47] = 0x3d; // RETURNDATASIZE
    bytecode[48] = 0x91; // SWAP2
    bytecode[49] = 0x60; // PUSH1
    bytecode[50] = 0x2b; // 43
    bytecode[51] = 0x57; // JUMPI
    bytecode[52] = 0xfd; // REVERT
    bytecode[53] = 0x5b; // JUMPDEST
    bytecode[54] = 0xf3; // RETURN

    return bytecode;
}

/// Parse implementation address from ERC-1167 minimal proxy bytecode
/// Extracts the 20-byte implementation address from the proxy bytecode
///
/// @param bytecode Proxy bytecode (45 or 55 bytes)
/// @return Implementation address or null if invalid
pub fn parseErc1167(bytecode: []const u8) ?[20]u8 {
    // Can be either runtime code (45 bytes) or creation code (55 bytes)
    if (bytecode.len != 45 and bytecode.len != 55) {
        return null;
    }

    // Determine offset based on bytecode length
    const offset: usize = if (bytecode.len == 55) 20 else 10;

    // Verify prefix pattern
    if (bytecode.len == 55) {
        // Creation code prefix check
        if (bytecode[0] != 0x3d or bytecode[1] != 0x60 or
            bytecode[2] != 0x2d or bytecode[19] != 0x73)
        {
            return null;
        }
    } else {
        // Runtime code prefix check
        if (bytecode[0] != 0x36 or bytecode[1] != 0x3d or
            bytecode[2] != 0x3d or bytecode[9] != 0x73)
        {
            return null;
        }
    }

    // Extract implementation address (20 bytes)
    var address: [20]u8 = undefined;
    @memcpy(&address, bytecode[offset .. offset + 20]);
    return address;
}

/// Check if bytecode is a valid ERC-1167 minimal proxy
///
/// @param bytecode Bytecode to check
/// @return True if valid ERC-1167 proxy
pub fn isErc1167(bytecode: []const u8) bool {
    // Must be either 45 bytes (runtime) or 55 bytes (creation)
    if (bytecode.len != 45 and bytecode.len != 55) {
        return false;
    }

    if (bytecode.len == 55) {
        // Creation code validation
        // Prefix: 3d602d80600a3d3981f3
        if (bytecode[0] != 0x3d or bytecode[1] != 0x60 or
            bytecode[2] != 0x2d or bytecode[3] != 0x80 or
            bytecode[4] != 0x60 or bytecode[5] != 0x0a or
            bytecode[6] != 0x3d or bytecode[7] != 0x39 or
            bytecode[8] != 0x81 or bytecode[9] != 0xf3)
        {
            return false;
        }

        // Runtime prefix within creation code
        if (bytecode[10] != 0x36 or bytecode[11] != 0x3d or
            bytecode[12] != 0x3d or bytecode[13] != 0x37 or
            bytecode[14] != 0x3d or bytecode[15] != 0x3d or
            bytecode[16] != 0x3d or bytecode[17] != 0x36 or
            bytecode[18] != 0x3d or bytecode[19] != 0x73)
        {
            return false;
        }

        // Suffix: 5af43d82803e903d91602b57fd5bf3
        return bytecode[40] == 0x5a and bytecode[41] == 0xf4 and
            bytecode[42] == 0x3d and bytecode[43] == 0x82 and
            bytecode[44] == 0x80 and bytecode[45] == 0x3e and
            bytecode[46] == 0x90 and bytecode[47] == 0x3d and
            bytecode[48] == 0x91 and bytecode[49] == 0x60 and
            bytecode[50] == 0x2b and bytecode[51] == 0x57 and
            bytecode[52] == 0xfd and bytecode[53] == 0x5b and
            bytecode[54] == 0xf3;
    }

    // Runtime code validation (45 bytes)
    // Prefix: 363d3d373d3d3d363d73
    if (bytecode[0] != 0x36 or bytecode[1] != 0x3d or
        bytecode[2] != 0x3d or bytecode[3] != 0x37 or
        bytecode[4] != 0x3d or bytecode[5] != 0x3d or
        bytecode[6] != 0x3d or bytecode[7] != 0x36 or
        bytecode[8] != 0x3d or bytecode[9] != 0x73)
    {
        return false;
    }

    // Suffix: 5af43d82803e903d91602b57fd5bf3
    return bytecode[30] == 0x5a and bytecode[31] == 0xf4 and
        bytecode[32] == 0x3d and bytecode[33] == 0x82 and
        bytecode[34] == 0x80 and bytecode[35] == 0x3e and
        bytecode[36] == 0x90 and bytecode[37] == 0x3d and
        bytecode[38] == 0x91 and bytecode[39] == 0x60 and
        bytecode[40] == 0x2b and bytecode[41] == 0x57 and
        bytecode[42] == 0xfd and bytecode[43] == 0x5b and
        bytecode[44] == 0xf3;
}

// ============================================================================
// Tests
// ============================================================================

test "generateErc1167 - generates valid 55-byte creation code" {
    const test_address = [_]u8{0x11} ** 20;
    const bytecode = generateErc1167(test_address);

    try std.testing.expectEqual(@as(usize, 55), bytecode.len);
}

test "generateErc1167 - embeds implementation address at correct offset" {
    const test_address = [_]u8{
        0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa,
        0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11, 0x22, 0x33, 0x44,
    };
    const bytecode = generateErc1167(test_address);

    // Address should be at offset 20
    for (test_address, 0..) |byte, i| {
        try std.testing.expectEqual(byte, bytecode[20 + i]);
    }
}

test "generateErc1167 - has correct creation code prefix" {
    const test_address = [_]u8{0x11} ** 20;
    const bytecode = generateErc1167(test_address);

    // 3d602d80600a3d3981f3
    try std.testing.expectEqual(@as(u8, 0x3d), bytecode[0]);
    try std.testing.expectEqual(@as(u8, 0x60), bytecode[1]);
    try std.testing.expectEqual(@as(u8, 0x2d), bytecode[2]);
    try std.testing.expectEqual(@as(u8, 0xf3), bytecode[9]);
}

test "parseErc1167 - extracts implementation address from creation code" {
    const test_address = [_]u8{
        0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa,
        0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11, 0x22, 0x33, 0x44,
    };
    const bytecode = generateErc1167(test_address);
    const extracted = parseErc1167(&bytecode);

    try std.testing.expect(extracted != null);
    try std.testing.expectEqual(test_address, extracted.?);
}

test "parseErc1167 - extracts implementation address from runtime code" {
    const test_address = [_]u8{
        0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa,
        0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00, 0x11, 0x22, 0x33, 0x44,
    };
    const bytecode = generateErc1167(test_address);
    // Extract runtime portion (bytes 10-54, which is 45 bytes)
    const runtime_code = bytecode[10..];

    const extracted = parseErc1167(runtime_code);
    try std.testing.expect(extracted != null);
    try std.testing.expectEqual(test_address, extracted.?);
}

test "parseErc1167 - returns null for invalid bytecode length" {
    const invalid_bytecode = [_]u8{0xff} ** 30;
    const extracted = parseErc1167(&invalid_bytecode);

    try std.testing.expect(extracted == null);
}

test "isErc1167 - validates creation code" {
    const test_address = [_]u8{0x11} ** 20;
    const bytecode = generateErc1167(test_address);

    try std.testing.expect(isErc1167(&bytecode));
}

test "isErc1167 - validates runtime code" {
    const test_address = [_]u8{0x11} ** 20;
    const bytecode = generateErc1167(test_address);
    const runtime_code = bytecode[10..];

    try std.testing.expect(isErc1167(runtime_code));
}

test "isErc1167 - rejects invalid length" {
    const invalid_bytecode = [_]u8{0xff} ** 30;

    try std.testing.expect(!isErc1167(&invalid_bytecode));
}

test "isErc1167 - rejects corrupted creation code" {
    const test_address = [_]u8{0x11} ** 20;
    var bytecode = generateErc1167(test_address);
    bytecode[0] = 0xff; // Corrupt first byte

    try std.testing.expect(!isErc1167(&bytecode));
}

test "round-trip - generate -> parse -> validate" {
    const test_address = [_]u8{
        0xd9, 0xe1, 0x45, 0x9a, 0x7a, 0x48, 0x21, 0xad, 0xb4, 0x99,
        0xd9, 0xad, 0x3a, 0x96, 0x02, 0xec, 0x80, 0x62, 0x16, 0xec,
    };

    const bytecode = generateErc1167(test_address);
    const extracted = parseErc1167(&bytecode);
    const valid = isErc1167(&bytecode);

    try std.testing.expect(extracted != null);
    try std.testing.expectEqual(test_address, extracted.?);
    try std.testing.expect(valid);
}
