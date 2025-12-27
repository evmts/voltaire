//! RevertReason - Decoded revert information from contract execution
//!
//! Decodes revert data into typed structures:
//! - Error(string): Standard Solidity error
//! - Panic(uint256): Solidity 0.8+ panic codes
//! - Custom: Custom errors with selector and data
//! - Unknown: Unrecognized revert data
//!
//! ## Usage
//! ```zig
//! const RevertReason = @import("primitives").RevertReason;
//!
//! // Decode from return data
//! const reason = RevertReason.decode(return_data);
//!
//! switch (reason) {
//!     .Error => |msg| std.debug.print("Error: {s}\n", .{msg}),
//!     .Panic => |p| std.debug.print("Panic: {s}\n", .{p.description}),
//!     ...
//! }
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");

// ============================================================================
// Constants
// ============================================================================

/// Error(string) selector: keccak256("Error(string)")[:4]
pub const ERROR_SELECTOR = [_]u8{ 0x08, 0xc3, 0x79, 0xa0 };

/// Panic(uint256) selector: keccak256("Panic(uint256)")[:4]
pub const PANIC_SELECTOR = [_]u8{ 0x4e, 0x48, 0x7b, 0x71 };

/// Solidity panic code descriptions
pub const PanicCode = enum(u8) {
    generic = 0,
    assertion_failed = 1,
    arithmetic_overflow = 17,
    division_by_zero = 18,
    invalid_enum = 33,
    invalid_storage_encoding = 34,
    array_pop_empty = 49,
    array_out_of_bounds = 50,
    out_of_memory = 65,
    invalid_internal_function = 81,
    _,

    pub fn description(self: PanicCode) []const u8 {
        return switch (self) {
            .generic => "Generic panic",
            .assertion_failed => "Assertion failed",
            .arithmetic_overflow => "Arithmetic overflow/underflow",
            .division_by_zero => "Division by zero",
            .invalid_enum => "Invalid enum value",
            .invalid_storage_encoding => "Invalid storage encoding",
            .array_pop_empty => "Array pop on empty array",
            .array_out_of_bounds => "Array out of bounds",
            .out_of_memory => "Out of memory",
            .invalid_internal_function => "Invalid internal function",
            _ => "Unknown panic code",
        };
    }
};

// ============================================================================
// RevertReason Types
// ============================================================================

/// Standard Error(string) revert
pub const ErrorReason = struct {
    message: []const u8,
};

/// Solidity Panic(uint256) revert
pub const PanicReason = struct {
    code: u256,
    description: []const u8,
};

/// Custom error with selector
pub const CustomReason = struct {
    selector: [4]u8,
    data: []const u8,
};

/// Unknown/unrecognized revert
pub const UnknownReason = struct {
    data: []const u8,
};

/// RevertReason tagged union
pub const RevertReason = union(enum) {
    Error: ErrorReason,
    Panic: PanicReason,
    Custom: CustomReason,
    Unknown: UnknownReason,

    /// Create an Error reason
    pub fn err(message: []const u8) RevertReason {
        return RevertReason{ .Error = .{ .message = message } };
    }

    /// Create a Panic reason
    pub fn panic(code: u256) RevertReason {
        const panic_code: PanicCode = if (code <= 255) @enumFromInt(@as(u8, @intCast(code))) else .generic;
        return RevertReason{ .Panic = .{
            .code = code,
            .description = panic_code.description(),
        } };
    }

    /// Create a Custom error reason
    pub fn custom(selector: [4]u8, data: []const u8) RevertReason {
        return RevertReason{ .Custom = .{
            .selector = selector,
            .data = data,
        } };
    }

    /// Create an Unknown reason
    pub fn unknown(data: []const u8) RevertReason {
        return RevertReason{ .Unknown = .{ .data = data } };
    }

    /// Check if this is an Error reason
    pub fn isError(self: RevertReason) bool {
        return self == .Error;
    }

    /// Check if this is a Panic reason
    pub fn isPanic(self: RevertReason) bool {
        return self == .Panic;
    }

    /// Check if this is a Custom reason
    pub fn isCustom(self: RevertReason) bool {
        return self == .Custom;
    }

    /// Check if this is an Unknown reason
    pub fn isUnknown(self: RevertReason) bool {
        return self == .Unknown;
    }

    /// Get message if this is an Error reason
    pub fn getMessage(self: RevertReason) ?[]const u8 {
        return switch (self) {
            .Error => |e| e.message,
            else => null,
        };
    }

    /// Get panic code if this is a Panic reason
    pub fn getPanicCode(self: RevertReason) ?u256 {
        return switch (self) {
            .Panic => |p| p.code,
            else => null,
        };
    }
};

// ============================================================================
// Decoding
// ============================================================================

/// Decode revert reason from return data bytes
pub fn decode(data: []const u8) RevertReason {
    // Empty data
    if (data.len == 0) {
        return RevertReason.unknown(data);
    }

    // Need at least 4 bytes for selector
    if (data.len < 4) {
        return RevertReason.unknown(data);
    }

    // Check for Error(string)
    if (std.mem.eql(u8, data[0..4], &ERROR_SELECTOR)) {
        return decodeErrorString(data) orelse RevertReason.unknown(data);
    }

    // Check for Panic(uint256)
    if (std.mem.eql(u8, data[0..4], &PANIC_SELECTOR)) {
        return decodePanic(data) orelse RevertReason.unknown(data);
    }

    // Custom error
    var selector: [4]u8 = undefined;
    @memcpy(&selector, data[0..4]);
    return RevertReason.custom(selector, data[4..]);
}

/// Decode Error(string) from ABI-encoded data
fn decodeErrorString(data: []const u8) ?RevertReason {
    // Minimum length: selector(4) + offset(32) + length(32) = 68
    if (data.len < 68) return null;

    // Read string length from bytes 36-68 (big-endian)
    const length = readU256BigEndian(data[36..68]);

    // Sanity check
    if (length > 0xFFFF) return null; // String too long

    const str_len: usize = @intCast(length);

    // Check we have enough data
    if (data.len < 68 + str_len) return null;

    // Extract string bytes
    const message = data[68 .. 68 + str_len];

    return RevertReason.err(message);
}

/// Decode Panic(uint256) from ABI-encoded data
fn decodePanic(data: []const u8) ?RevertReason {
    // Minimum length: selector(4) + code(32) = 36
    if (data.len < 36) return null;

    // Read panic code from bytes 4-36 (big-endian)
    const code = readU256BigEndian(data[4..36]);

    return RevertReason.panic(code);
}

/// Read big-endian u256 from 32 bytes
fn readU256BigEndian(bytes: []const u8) u256 {
    std.debug.assert(bytes.len >= 32);
    var result: u256 = 0;
    for (bytes[0..32]) |b| {
        result = (result << 8) | b;
    }
    return result;
}

/// Decode from hex string
pub fn decodeHex(allocator: std.mem.Allocator, hex: []const u8) !RevertReason {
    const bytes = try Hex.fromHex(allocator, hex);
    defer allocator.free(bytes);
    return decode(bytes);
}

// ============================================================================
// String formatting
// ============================================================================

/// Format revert reason as human-readable string
/// Caller owns returned memory
pub fn toString(allocator: std.mem.Allocator, reason: RevertReason) ![]u8 {
    return switch (reason) {
        .Error => |e| try std.fmt.allocPrint(allocator, "Error: {s}", .{e.message}),
        .Panic => |p| try std.fmt.allocPrint(allocator, "Panic({d}): {s}", .{ p.code, p.description }),
        .Custom => |c| blk: {
            const hex = try Hex.bytesToHex(allocator, &c.selector);
            defer allocator.free(hex);
            break :blk try std.fmt.allocPrint(allocator, "Custom({s}): {d} bytes data", .{ hex, c.data.len });
        },
        .Unknown => |u| try std.fmt.allocPrint(allocator, "Unknown: {d} bytes", .{u.data.len}),
    };
}

// ============================================================================
// Tests
// ============================================================================

test "decode - empty data" {
    const data = [_]u8{};
    const reason = decode(&data);

    try std.testing.expect(reason.isUnknown());
}

test "decode - too short for selector" {
    const data = [_]u8{ 0x08, 0xc3, 0x79 };
    const reason = decode(&data);

    try std.testing.expect(reason.isUnknown());
}

test "decode - Error(string) basic" {
    // Error("hello") ABI encoded
    const data = [_]u8{
        // Selector
        0x08, 0xc3, 0x79, 0xa0,
        // Offset to string (32)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x20,
        // String length (5)
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x05,
        // "hello"
        0x68, 0x65, 0x6c, 0x6c, 0x6f,
    };

    const reason = decode(&data);

    try std.testing.expect(reason.isError());
    try std.testing.expectEqualStrings("hello", reason.getMessage().?);
}

test "decode - Panic(uint256) assertion failed" {
    // Panic(1) - assertion failed
    const data = [_]u8{
        // Selector
        0x4e, 0x48, 0x7b, 0x71,
        // Code = 1
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
    };

    const reason = decode(&data);

    try std.testing.expect(reason.isPanic());
    try std.testing.expectEqual(@as(u256, 1), reason.getPanicCode().?);

    switch (reason) {
        .Panic => |p| try std.testing.expectEqualStrings("Assertion failed", p.description),
        else => unreachable,
    }
}

test "decode - Panic(uint256) arithmetic overflow" {
    // Panic(17) - arithmetic overflow
    const data = [_]u8{
        // Selector
        0x4e, 0x48, 0x7b, 0x71,
        // Code = 17
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x11,
    };

    const reason = decode(&data);

    try std.testing.expect(reason.isPanic());
    try std.testing.expectEqual(@as(u256, 17), reason.getPanicCode().?);

    switch (reason) {
        .Panic => |p| try std.testing.expectEqualStrings("Arithmetic overflow/underflow", p.description),
        else => unreachable,
    }
}

test "decode - Custom error" {
    const data = [_]u8{
        // Custom selector
        0xaa, 0xbb, 0xcc, 0xdd,
        // Some data
        0x01, 0x02, 0x03, 0x04,
    };

    const reason = decode(&data);

    try std.testing.expect(reason.isCustom());

    switch (reason) {
        .Custom => |c| {
            try std.testing.expectEqual([_]u8{ 0xaa, 0xbb, 0xcc, 0xdd }, c.selector);
            try std.testing.expectEqual(@as(usize, 4), c.data.len);
        },
        else => unreachable,
    }
}

test "PanicCode.description - known codes" {
    try std.testing.expectEqualStrings("Generic panic", PanicCode.generic.description());
    try std.testing.expectEqualStrings("Assertion failed", PanicCode.assertion_failed.description());
    try std.testing.expectEqualStrings("Division by zero", PanicCode.division_by_zero.description());
    try std.testing.expectEqualStrings("Array out of bounds", PanicCode.array_out_of_bounds.description());
}

test "PanicCode.description - unknown code" {
    const unknown_code: PanicCode = @enumFromInt(255);
    try std.testing.expectEqualStrings("Unknown panic code", unknown_code.description());
}

test "RevertReason.err - creates error reason" {
    const reason = RevertReason.err("test message");

    try std.testing.expect(reason.isError());
    try std.testing.expectEqualStrings("test message", reason.getMessage().?);
}

test "RevertReason.panic - creates panic reason" {
    const reason = RevertReason.panic(18);

    try std.testing.expect(reason.isPanic());
    try std.testing.expectEqual(@as(u256, 18), reason.getPanicCode().?);
}

test "RevertReason.custom - creates custom reason" {
    const selector = [_]u8{ 0x01, 0x02, 0x03, 0x04 };
    const data = [_]u8{ 0xaa, 0xbb };
    const reason = RevertReason.custom(selector, &data);

    try std.testing.expect(reason.isCustom());
}

test "RevertReason.unknown - creates unknown reason" {
    const data = [_]u8{ 0x01, 0x02 };
    const reason = RevertReason.unknown(&data);

    try std.testing.expect(reason.isUnknown());
}

test "toString - Error" {
    const reason = RevertReason.err("test error");
    const str = try toString(std.testing.allocator, reason);
    defer std.testing.allocator.free(str);

    try std.testing.expectEqualStrings("Error: test error", str);
}

test "toString - Panic" {
    const reason = RevertReason.panic(1);
    const str = try toString(std.testing.allocator, reason);
    defer std.testing.allocator.free(str);

    try std.testing.expectEqualStrings("Panic(1): Assertion failed", str);
}

test "toString - Unknown" {
    const data = [_]u8{ 0x01, 0x02, 0x03 };
    const reason = RevertReason.unknown(&data);
    const str = try toString(std.testing.allocator, reason);
    defer std.testing.allocator.free(str);

    try std.testing.expectEqualStrings("Unknown: 3 bytes", str);
}

test "ERROR_SELECTOR constant" {
    try std.testing.expectEqual([_]u8{ 0x08, 0xc3, 0x79, 0xa0 }, ERROR_SELECTOR);
}

test "PANIC_SELECTOR constant" {
    try std.testing.expectEqual([_]u8{ 0x4e, 0x48, 0x7b, 0x71 }, PANIC_SELECTOR);
}
