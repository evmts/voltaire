//! RuntimeCode - Runtime bytecode portion of deployed contracts
//!
//! Represents the runtime code section of a contract, which is the
//! executable portion that runs during contract calls. This excludes
//! constructor/init code and metadata.
//!
//! ## Usage
//! ```zig
//! const RuntimeCode = @import("primitives").RuntimeCode;
//!
//! // From bytes
//! const code = RuntimeCode.from(&bytecode);
//!
//! // Hash the code
//! const codeHash = code.hash();
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");
const Hash = @import("../Hash/Hash.zig");
const crypto = @import("crypto");

/// RuntimeCode wraps runtime bytecode
pub const RuntimeCode = struct {
    /// Raw bytecode bytes
    bytes: []const u8,

    /// Create RuntimeCode from raw bytes
    pub fn from(bytes: []const u8) RuntimeCode {
        return RuntimeCode{ .bytes = bytes };
    }

    /// Create RuntimeCode from hex string (with or without 0x prefix)
    pub fn fromHex(allocator: std.mem.Allocator, hex: []const u8) !struct { code: RuntimeCode, bytes: []u8 } {
        const bytes = try Hex.fromHex(allocator, hex);
        return .{ .code = RuntimeCode{ .bytes = bytes }, .bytes = bytes };
    }

    /// Get length of bytecode
    pub fn len(self: RuntimeCode) usize {
        return self.bytes.len;
    }

    /// Check if bytecode is empty
    pub fn isEmpty(self: RuntimeCode) bool {
        return self.bytes.len == 0;
    }

    /// Convert to hex string with 0x prefix
    /// Caller owns returned memory
    pub fn toHex(self: RuntimeCode, allocator: std.mem.Allocator) ![]u8 {
        return Hex.bytesToHex(allocator, self.bytes);
    }

    /// Compute keccak256 hash of the bytecode
    pub fn hash(self: RuntimeCode) Hash.Hash {
        return Hash.keccak256(self.bytes);
    }

    /// Check equality with another RuntimeCode
    pub fn equals(self: RuntimeCode, other: RuntimeCode) bool {
        return std.mem.eql(u8, self.bytes, other.bytes);
    }

    /// Get opcode at given position
    pub fn getOpcode(self: RuntimeCode, pc: usize) ?u8 {
        if (pc >= self.bytes.len) return null;
        return self.bytes[pc];
    }

    /// Check if position is within code bounds
    pub fn inBounds(self: RuntimeCode, pc: usize) bool {
        return pc < self.bytes.len;
    }
};

// ============================================================================
// Tests
// ============================================================================

test "RuntimeCode.from - creates from bytes" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };
    const code = RuntimeCode.from(&bytecode);

    try std.testing.expectEqual(@as(usize, 5), code.len());
    try std.testing.expect(!code.isEmpty());
}

test "RuntimeCode.from - empty bytecode" {
    const bytecode = [_]u8{};
    const code = RuntimeCode.from(&bytecode);

    try std.testing.expectEqual(@as(usize, 0), code.len());
    try std.testing.expect(code.isEmpty());
}

test "RuntimeCode.fromHex - valid hex" {
    const result = try RuntimeCode.fromHex(std.testing.allocator, "0x6080604052");
    defer std.testing.allocator.free(result.bytes);

    try std.testing.expectEqual(@as(usize, 5), result.code.len());
    try std.testing.expectEqual(@as(u8, 0x60), result.code.bytes[0]);
}

test "RuntimeCode.toHex - converts to hex string" {
    const bytecode = [_]u8{ 0x60, 0x80 };
    const code = RuntimeCode.from(&bytecode);

    const hex = try code.toHex(std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expectEqualStrings("0x6080", hex);
}

test "RuntimeCode.hash - computes keccak256" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40 };
    const code = RuntimeCode.from(&bytecode);

    const code_hash = code.hash();

    try std.testing.expectEqual(@as(usize, 32), code_hash.len);

    // Verify non-zero
    var all_zero = true;
    for (code_hash) |b| {
        if (b != 0) {
            all_zero = false;
            break;
        }
    }
    try std.testing.expect(!all_zero);
}

test "RuntimeCode.equals - same bytecode" {
    const bytecode1 = [_]u8{ 0x60, 0x80 };
    const bytecode2 = [_]u8{ 0x60, 0x80 };

    const code1 = RuntimeCode.from(&bytecode1);
    const code2 = RuntimeCode.from(&bytecode2);

    try std.testing.expect(code1.equals(code2));
}

test "RuntimeCode.equals - different bytecode" {
    const bytecode1 = [_]u8{ 0x60, 0x80 };
    const bytecode2 = [_]u8{ 0x60, 0x40 };

    const code1 = RuntimeCode.from(&bytecode1);
    const code2 = RuntimeCode.from(&bytecode2);

    try std.testing.expect(!code1.equals(code2));
}

test "RuntimeCode.getOpcode - valid position" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40 };
    const code = RuntimeCode.from(&bytecode);

    try std.testing.expectEqual(@as(u8, 0x60), code.getOpcode(0).?);
    try std.testing.expectEqual(@as(u8, 0x80), code.getOpcode(1).?);
    try std.testing.expectEqual(@as(u8, 0x40), code.getOpcode(3).?);
}

test "RuntimeCode.getOpcode - out of bounds" {
    const bytecode = [_]u8{ 0x60, 0x80 };
    const code = RuntimeCode.from(&bytecode);

    try std.testing.expect(code.getOpcode(2) == null);
    try std.testing.expect(code.getOpcode(100) == null);
}

test "RuntimeCode.inBounds - checks bounds correctly" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60 };
    const code = RuntimeCode.from(&bytecode);

    try std.testing.expect(code.inBounds(0));
    try std.testing.expect(code.inBounds(2));
    try std.testing.expect(!code.inBounds(3));
    try std.testing.expect(!code.inBounds(100));
}
