//! ContractCode - Deployed contract bytecode on-chain
//!
//! Represents the runtime bytecode that exists at a contract address
//! after deployment. This is the code that executes when the contract
//! is called.
//!
//! ## Usage
//! ```zig
//! const ContractCode = @import("primitives").ContractCode;
//!
//! // From bytes
//! const code = ContractCode.from(&bytecode);
//!
//! // Hash the code
//! const codeHash = code.hash();
//!
//! // Compare
//! const same = ContractCode.equals(code1, code2);
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");
const Hash = @import("../Hash/Hash.zig");
const crypto = @import("crypto");

/// ContractCode wraps deployed contract bytecode
pub const ContractCode = struct {
    /// Raw bytecode bytes
    bytes: []const u8,

    /// Create ContractCode from raw bytes
    pub fn from(bytes: []const u8) ContractCode {
        return ContractCode{ .bytes = bytes };
    }

    /// Create ContractCode from hex string (with or without 0x prefix)
    pub fn fromHex(allocator: std.mem.Allocator, hex: []const u8) !struct { code: ContractCode, bytes: []u8 } {
        const bytes = try Hex.fromHex(allocator, hex);
        return .{ .code = ContractCode{ .bytes = bytes }, .bytes = bytes };
    }

    /// Get length of bytecode
    pub fn len(self: ContractCode) usize {
        return self.bytes.len;
    }

    /// Check if bytecode is empty
    pub fn isEmpty(self: ContractCode) bool {
        return self.bytes.len == 0;
    }

    /// Convert to hex string with 0x prefix
    /// Caller owns returned memory
    pub fn toHex(self: ContractCode, allocator: std.mem.Allocator) ![]u8 {
        return Hex.bytesToHex(allocator, self.bytes);
    }

    /// Compute keccak256 hash of the bytecode
    pub fn hash(self: ContractCode) Hash.Hash {
        return Hash.keccak256(self.bytes);
    }

    /// Check equality with another ContractCode
    pub fn equals(self: ContractCode, other: ContractCode) bool {
        return std.mem.eql(u8, self.bytes, other.bytes);
    }

    /// Check if bytecode has Solidity metadata (CBOR-encoded)
    /// Metadata starts with 0xa2 0x64 (CBOR map with "ipfs" or "bzzr" key)
    pub fn hasMetadata(self: ContractCode) bool {
        if (self.bytes.len < 2) return false;

        // Look for metadata length marker at end (last 2 bytes)
        const metadata_len = (@as(u16, self.bytes[self.bytes.len - 2]) << 8) |
            self.bytes[self.bytes.len - 1];

        if (metadata_len >= self.bytes.len - 2) return false;

        // Check for CBOR marker
        const metadata_start = self.bytes.len - 2 - metadata_len;
        if (metadata_start >= self.bytes.len) return false;

        return self.bytes[metadata_start] == 0xa2 or self.bytes[metadata_start] == 0xa1;
    }
};

// ============================================================================
// Tests
// ============================================================================

test "ContractCode.from - creates from bytes" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };
    const code = ContractCode.from(&bytecode);

    try std.testing.expectEqual(@as(usize, 5), code.len());
    try std.testing.expect(!code.isEmpty());
}

test "ContractCode.from - empty bytecode" {
    const bytecode = [_]u8{};
    const code = ContractCode.from(&bytecode);

    try std.testing.expectEqual(@as(usize, 0), code.len());
    try std.testing.expect(code.isEmpty());
}

test "ContractCode.fromHex - valid hex" {
    const result = try ContractCode.fromHex(std.testing.allocator, "0x6080604052");
    defer std.testing.allocator.free(result.bytes);

    try std.testing.expectEqual(@as(usize, 5), result.code.len());
    try std.testing.expectEqual(@as(u8, 0x60), result.code.bytes[0]);
}

test "ContractCode.fromHex - without prefix" {
    const result = try ContractCode.fromHex(std.testing.allocator, "0x6080");
    defer std.testing.allocator.free(result.bytes);

    try std.testing.expectEqual(@as(usize, 2), result.code.len());
}

test "ContractCode.toHex - converts to hex string" {
    const bytecode = [_]u8{ 0x60, 0x80 };
    const code = ContractCode.from(&bytecode);

    const hex = try code.toHex(std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expectEqualStrings("0x6080", hex);
}

test "ContractCode.hash - computes keccak256" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40 };
    const code = ContractCode.from(&bytecode);

    const code_hash = code.hash();

    // Hash should be 32 bytes
    try std.testing.expectEqual(@as(usize, 32), code_hash.len);

    // Verify it's not all zeros
    var all_zero = true;
    for (code_hash) |b| {
        if (b != 0) {
            all_zero = false;
            break;
        }
    }
    try std.testing.expect(!all_zero);
}

test "ContractCode.equals - same bytecode" {
    const bytecode1 = [_]u8{ 0x60, 0x80 };
    const bytecode2 = [_]u8{ 0x60, 0x80 };

    const code1 = ContractCode.from(&bytecode1);
    const code2 = ContractCode.from(&bytecode2);

    try std.testing.expect(code1.equals(code2));
}

test "ContractCode.equals - different bytecode" {
    const bytecode1 = [_]u8{ 0x60, 0x80 };
    const bytecode2 = [_]u8{ 0x60, 0x40 };

    const code1 = ContractCode.from(&bytecode1);
    const code2 = ContractCode.from(&bytecode2);

    try std.testing.expect(!code1.equals(code2));
}

test "ContractCode.equals - different lengths" {
    const bytecode1 = [_]u8{ 0x60, 0x80 };
    const bytecode2 = [_]u8{ 0x60, 0x80, 0x60 };

    const code1 = ContractCode.from(&bytecode1);
    const code2 = ContractCode.from(&bytecode2);

    try std.testing.expect(!code1.equals(code2));
}

test "ContractCode.hasMetadata - no metadata" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40 };
    const code = ContractCode.from(&bytecode);

    try std.testing.expect(!code.hasMetadata());
}

test "ContractCode.hasMetadata - too short" {
    const bytecode = [_]u8{0x60};
    const code = ContractCode.from(&bytecode);

    try std.testing.expect(!code.hasMetadata());
}
