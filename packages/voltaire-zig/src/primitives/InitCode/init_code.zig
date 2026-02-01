//! InitCode - Contract initialization code (constructor bytecode + args)
//!
//! Represents the initialization bytecode sent in contract creation
//! transactions. This includes the constructor code and any encoded
//! constructor arguments appended at the end.
//!
//! ## Usage
//! ```zig
//! const InitCode = @import("primitives").InitCode;
//!
//! // From bytes
//! const code = InitCode.from(&bytecode);
//!
//! // Extract runtime code at offset
//! const runtime = code.extractRuntime(offset);
//!
//! // Estimate deployment gas
//! const gas = code.estimateGas();
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");
const Hash = @import("../Hash/Hash.zig");
const crypto = @import("crypto");

/// Gas cost per zero byte in calldata (EIP-2028)
const GAS_PER_ZERO_BYTE: u64 = 4;

/// Gas cost per non-zero byte in calldata (EIP-2028)
const GAS_PER_NONZERO_BYTE: u64 = 16;

/// InitCode wraps contract initialization bytecode
pub const InitCode = struct {
    /// Raw bytecode bytes
    bytes: []const u8,

    /// Create InitCode from raw bytes
    pub fn from(bytes: []const u8) InitCode {
        return InitCode{ .bytes = bytes };
    }

    /// Create InitCode from hex string (with or without 0x prefix)
    pub fn fromHex(allocator: std.mem.Allocator, hex: []const u8) !struct { code: InitCode, bytes: []u8 } {
        const bytes = try Hex.fromHex(allocator, hex);
        return .{ .code = InitCode{ .bytes = bytes }, .bytes = bytes };
    }

    /// Get length of bytecode
    pub fn len(self: InitCode) usize {
        return self.bytes.len;
    }

    /// Check if bytecode is empty
    pub fn isEmpty(self: InitCode) bool {
        return self.bytes.len == 0;
    }

    /// Convert to hex string with 0x prefix
    /// Caller owns returned memory
    pub fn toHex(self: InitCode, allocator: std.mem.Allocator) ![]u8 {
        return Hex.bytesToHex(allocator, self.bytes);
    }

    /// Compute keccak256 hash of the bytecode
    pub fn hash(self: InitCode) Hash.Hash {
        return Hash.keccak256(self.bytes);
    }

    /// Check equality with another InitCode
    pub fn equals(self: InitCode, other: InitCode) bool {
        return std.mem.eql(u8, self.bytes, other.bytes);
    }

    /// Extract runtime code from init code starting at given offset
    /// Returns slice into original bytes (no allocation)
    pub fn extractRuntime(self: InitCode, offset: usize) ?[]const u8 {
        if (offset >= self.bytes.len) return null;
        return self.bytes[offset..];
    }

    /// Estimate gas cost for deployment calldata
    /// Uses EIP-2028 gas costs: 4 per zero byte, 16 per non-zero byte
    pub fn estimateGas(self: InitCode) u64 {
        var gas: u64 = 0;
        for (self.bytes) |byte| {
            if (byte == 0) {
                gas += GAS_PER_ZERO_BYTE;
            } else {
                gas += GAS_PER_NONZERO_BYTE;
            }
        }
        return gas;
    }

    /// Get opcode at given position
    pub fn getOpcode(self: InitCode, pc: usize) ?u8 {
        if (pc >= self.bytes.len) return null;
        return self.bytes[pc];
    }

    /// Count zero bytes (useful for gas estimation)
    pub fn countZeroBytes(self: InitCode) usize {
        var count: usize = 0;
        for (self.bytes) |byte| {
            if (byte == 0) count += 1;
        }
        return count;
    }

    /// Count non-zero bytes
    pub fn countNonZeroBytes(self: InitCode) usize {
        return self.bytes.len - self.countZeroBytes();
    }
};

// ============================================================================
// Tests
// ============================================================================

test "InitCode.from - creates from bytes" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };
    const code = InitCode.from(&bytecode);

    try std.testing.expectEqual(@as(usize, 5), code.len());
    try std.testing.expect(!code.isEmpty());
}

test "InitCode.from - empty bytecode" {
    const bytecode = [_]u8{};
    const code = InitCode.from(&bytecode);

    try std.testing.expectEqual(@as(usize, 0), code.len());
    try std.testing.expect(code.isEmpty());
}

test "InitCode.fromHex - valid hex" {
    const result = try InitCode.fromHex(std.testing.allocator, "0x6080604052");
    defer std.testing.allocator.free(result.bytes);

    try std.testing.expectEqual(@as(usize, 5), result.code.len());
    try std.testing.expectEqual(@as(u8, 0x60), result.code.bytes[0]);
}

test "InitCode.toHex - converts to hex string" {
    const bytecode = [_]u8{ 0x60, 0x80 };
    const code = InitCode.from(&bytecode);

    const hex = try code.toHex(std.testing.allocator);
    defer std.testing.allocator.free(hex);

    try std.testing.expectEqualStrings("0x6080", hex);
}

test "InitCode.hash - computes keccak256" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40 };
    const code = InitCode.from(&bytecode);

    const code_hash = code.hash();

    try std.testing.expectEqual(@as(usize, 32), code_hash.len);

    var all_zero = true;
    for (code_hash) |b| {
        if (b != 0) {
            all_zero = false;
            break;
        }
    }
    try std.testing.expect(!all_zero);
}

test "InitCode.equals - same bytecode" {
    const bytecode1 = [_]u8{ 0x60, 0x80 };
    const bytecode2 = [_]u8{ 0x60, 0x80 };

    const code1 = InitCode.from(&bytecode1);
    const code2 = InitCode.from(&bytecode2);

    try std.testing.expect(code1.equals(code2));
}

test "InitCode.equals - different bytecode" {
    const bytecode1 = [_]u8{ 0x60, 0x80 };
    const bytecode2 = [_]u8{ 0x60, 0x40 };

    const code1 = InitCode.from(&bytecode1);
    const code2 = InitCode.from(&bytecode2);

    try std.testing.expect(!code1.equals(code2));
}

test "InitCode.extractRuntime - valid offset" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };
    const code = InitCode.from(&bytecode);

    const runtime = code.extractRuntime(2);
    try std.testing.expect(runtime != null);
    try std.testing.expectEqual(@as(usize, 3), runtime.?.len);
    try std.testing.expectEqual(@as(u8, 0x60), runtime.?[0]);
}

test "InitCode.extractRuntime - offset at end" {
    const bytecode = [_]u8{ 0x60, 0x80 };
    const code = InitCode.from(&bytecode);

    const runtime = code.extractRuntime(2);
    try std.testing.expect(runtime == null);
}

test "InitCode.extractRuntime - offset beyond end" {
    const bytecode = [_]u8{ 0x60, 0x80 };
    const code = InitCode.from(&bytecode);

    const runtime = code.extractRuntime(10);
    try std.testing.expect(runtime == null);
}

test "InitCode.estimateGas - all non-zero bytes" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40 };
    const code = InitCode.from(&bytecode);

    const gas = code.estimateGas();
    try std.testing.expectEqual(@as(u64, 4 * GAS_PER_NONZERO_BYTE), gas);
}

test "InitCode.estimateGas - mixed bytes" {
    const bytecode = [_]u8{ 0x60, 0x00, 0x60, 0x00 };
    const code = InitCode.from(&bytecode);

    const gas = code.estimateGas();
    try std.testing.expectEqual(@as(u64, 2 * GAS_PER_NONZERO_BYTE + 2 * GAS_PER_ZERO_BYTE), gas);
}

test "InitCode.estimateGas - all zero bytes" {
    const bytecode = [_]u8{ 0x00, 0x00, 0x00, 0x00 };
    const code = InitCode.from(&bytecode);

    const gas = code.estimateGas();
    try std.testing.expectEqual(@as(u64, 4 * GAS_PER_ZERO_BYTE), gas);
}

test "InitCode.estimateGas - empty" {
    const bytecode = [_]u8{};
    const code = InitCode.from(&bytecode);

    const gas = code.estimateGas();
    try std.testing.expectEqual(@as(u64, 0), gas);
}

test "InitCode.countZeroBytes - counts correctly" {
    const bytecode = [_]u8{ 0x60, 0x00, 0x00, 0x40 };
    const code = InitCode.from(&bytecode);

    try std.testing.expectEqual(@as(usize, 2), code.countZeroBytes());
    try std.testing.expectEqual(@as(usize, 2), code.countNonZeroBytes());
}

test "InitCode.getOpcode - valid position" {
    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40 };
    const code = InitCode.from(&bytecode);

    try std.testing.expectEqual(@as(u8, 0x60), code.getOpcode(0).?);
    try std.testing.expectEqual(@as(u8, 0x80), code.getOpcode(1).?);
}

test "InitCode.getOpcode - out of bounds" {
    const bytecode = [_]u8{ 0x60, 0x80 };
    const code = InitCode.from(&bytecode);

    try std.testing.expect(code.getOpcode(2) == null);
}
