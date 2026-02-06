//! ContractResult - Result of contract call (success or failure)
//!
//! Union type representing the outcome of a contract call:
//! - Success: Call succeeded with return data
//! - Failure: Call reverted with revert reason
//!
//! ## Usage
//! ```zig
//! const ContractResult = @import("primitives").ContractResult;
//!
//! // Create success result
//! var result = ContractResult.success(allocator, &return_data);
//!
//! // Check result
//! if (result.isSuccess()) {
//!     const data = result.unwrap();
//! }
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");

/// ContractResult error types
pub const Error = error{
    UnwrapOnFailure,
    OutOfMemory,
    InvalidRevertData,
};

/// Revert reason type
pub const RevertReason = union(enum) {
    /// Standard Error(string) revert
    error_message: []const u8,
    /// Custom error (selector + encoded data)
    custom_error: struct {
        selector: [4]u8,
        data: []const u8,
    },
    /// Panic(uint256) revert
    panic: u256,
    /// Unknown/raw revert data
    raw: []const u8,

    /// Get the error message (for Error(string) reverts)
    pub fn getMessage(self: RevertReason) ?[]const u8 {
        return switch (self) {
            .error_message => |msg| msg,
            else => null,
        };
    }

    /// Get the panic code (for Panic(uint256) reverts)
    pub fn getPanicCode(self: RevertReason) ?u256 {
        return switch (self) {
            .panic => |code| code,
            else => null,
        };
    }

    /// Check if this is an Error(string) revert
    pub fn isErrorMessage(self: RevertReason) bool {
        return switch (self) {
            .error_message => true,
            else => false,
        };
    }

    /// Check if this is a Panic revert
    pub fn isPanic(self: RevertReason) bool {
        return switch (self) {
            .panic => true,
            else => false,
        };
    }
};

/// ContractResult type - success or failure
pub const ContractResult = struct {
    success: bool,
    /// Return data (for success) or raw revert data (for failure)
    data: []u8,
    /// Parsed revert reason (only set for failures)
    revert_reason: ?RevertReason,
    allocator: std.mem.Allocator,

    const Self = @This();

    /// Free the result memory
    pub fn deinit(self: *Self) void {
        if (self.data.len > 0) {
            self.allocator.free(self.data);
        }
        self.data = &[_]u8{};
        self.revert_reason = null;
    }

    /// Check if the result is a success
    pub fn isSuccess(self: *const Self) bool {
        return self.success;
    }

    /// Check if the result is a failure
    pub fn isFailure(self: *const Self) bool {
        return !self.success;
    }

    /// Get return data (only valid for success)
    pub fn getData(self: *const Self) []const u8 {
        return self.data;
    }

    /// Get revert reason (only valid for failure)
    pub fn getRevertReason(self: *const Self) ?RevertReason {
        return self.revert_reason;
    }
};

// Error(string) selector: keccak256("Error(string)")[:4] = 0x08c379a0
const ERROR_SELECTOR = [_]u8{ 0x08, 0xc3, 0x79, 0xa0 };

// Panic(uint256) selector: keccak256("Panic(uint256)")[:4] = 0x4e487b71
const PANIC_SELECTOR = [_]u8{ 0x4e, 0x48, 0x7b, 0x71 };

// ============================================================================
// Constructors
// ============================================================================

/// Create a successful ContractResult
pub fn success(allocator: std.mem.Allocator, data: []const u8) Error!ContractResult {
    var result_data: []u8 = &[_]u8{};
    if (data.len > 0) {
        result_data = allocator.alloc(u8, data.len) catch return Error.OutOfMemory;
        @memcpy(result_data, data);
    }

    return ContractResult{
        .success = true,
        .data = result_data,
        .revert_reason = null,
        .allocator = allocator,
    };
}

test "success - with data" {
    const allocator = std.testing.allocator;
    const data = [_]u8{ 0x00, 0x00, 0x00, 0x01 };
    var result = try success(allocator, &data);
    defer result.deinit();

    try std.testing.expect(result.isSuccess());
    try std.testing.expect(!result.isFailure());
    try std.testing.expectEqualSlices(u8, &data, result.getData());
}

test "success - empty data" {
    const allocator = std.testing.allocator;
    var result = try success(allocator, &[_]u8{});
    defer result.deinit();

    try std.testing.expect(result.isSuccess());
    try std.testing.expectEqual(@as(usize, 0), result.getData().len);
}

/// Create a failed ContractResult with raw revert data
pub fn failure(allocator: std.mem.Allocator, revert_data: []const u8) Error!ContractResult {
    var result_data: []u8 = &[_]u8{};
    if (revert_data.len > 0) {
        result_data = allocator.alloc(u8, revert_data.len) catch return Error.OutOfMemory;
        @memcpy(result_data, revert_data);
    }

    // Parse revert reason
    const reason = parseRevertReason(revert_data);

    return ContractResult{
        .success = false,
        .data = result_data,
        .revert_reason = reason,
        .allocator = allocator,
    };
}

test "failure - empty data" {
    const allocator = std.testing.allocator;
    var result = try failure(allocator, &[_]u8{});
    defer result.deinit();

    try std.testing.expect(result.isFailure());
    try std.testing.expect(!result.isSuccess());
}

test "failure - with panic selector" {
    const allocator = std.testing.allocator;
    // Panic(uint256) with code 0x01 (assert failure)
    var data: [36]u8 = undefined;
    @memcpy(data[0..4], &PANIC_SELECTOR);
    @memset(data[4..35], 0);
    data[35] = 0x01;

    var result = try failure(allocator, &data);
    defer result.deinit();

    try std.testing.expect(result.isFailure());
    const reason = result.getRevertReason().?;
    try std.testing.expect(reason.isPanic());
    try std.testing.expectEqual(@as(?u256, 0x01), reason.getPanicCode());
}

/// Create ContractResult from success flag and data
pub fn from(allocator: std.mem.Allocator, is_success: bool, data: []const u8) Error!ContractResult {
    if (is_success) {
        return success(allocator, data);
    }
    return failure(allocator, data);
}

test "from - success" {
    const allocator = std.testing.allocator;
    var result = try from(allocator, true, &[_]u8{ 0x01, 0x02 });
    defer result.deinit();

    try std.testing.expect(result.isSuccess());
}

test "from - failure" {
    const allocator = std.testing.allocator;
    var result = try from(allocator, false, &[_]u8{});
    defer result.deinit();

    try std.testing.expect(result.isFailure());
}

/// Create a failed ContractResult with error message
pub fn failureWithMessage(allocator: std.mem.Allocator, message: []const u8) Error!ContractResult {
    // We don't ABI-encode here, just store the message as raw
    var data: []u8 = &[_]u8{};
    if (message.len > 0) {
        data = allocator.alloc(u8, message.len) catch return Error.OutOfMemory;
        @memcpy(data, message);
    }

    return ContractResult{
        .success = false,
        .data = data,
        .revert_reason = .{ .error_message = message },
        .allocator = allocator,
    };
}

test "failureWithMessage - basic" {
    const allocator = std.testing.allocator;
    var result = try failureWithMessage(allocator, "Insufficient balance");
    defer result.deinit();

    try std.testing.expect(result.isFailure());
    const reason = result.getRevertReason().?;
    try std.testing.expect(reason.isErrorMessage());
    try std.testing.expectEqualStrings("Insufficient balance", reason.getMessage().?);
}

/// Create a failed ContractResult with panic code
pub fn failureWithPanic(allocator: std.mem.Allocator, panic_code: u256) Error!ContractResult {
    // Create Panic(uint256) encoded data
    var data = allocator.alloc(u8, 36) catch return Error.OutOfMemory;
    @memcpy(data[0..4], &PANIC_SELECTOR);
    std.mem.writeInt(u256, data[4..36], panic_code, .big);

    return ContractResult{
        .success = false,
        .data = data,
        .revert_reason = .{ .panic = panic_code },
        .allocator = allocator,
    };
}

test "failureWithPanic - basic" {
    const allocator = std.testing.allocator;
    var result = try failureWithPanic(allocator, 0x11); // Overflow
    defer result.deinit();

    try std.testing.expect(result.isFailure());
    const reason = result.getRevertReason().?;
    try std.testing.expect(reason.isPanic());
    try std.testing.expectEqual(@as(?u256, 0x11), reason.getPanicCode());
}

// ============================================================================
// Unwrap Operations
// ============================================================================

/// Unwrap the result, returning the data or error
pub fn unwrap(result: *const ContractResult) Error![]const u8 {
    if (!result.success) {
        return Error.UnwrapOnFailure;
    }
    return result.data;
}

test "unwrap - success" {
    const allocator = std.testing.allocator;
    const data = [_]u8{ 0x01, 0x02, 0x03 };
    var result = try success(allocator, &data);
    defer result.deinit();

    const unwrapped = try unwrap(&result);
    try std.testing.expectEqualSlices(u8, &data, unwrapped);
}

test "unwrap - failure returns error" {
    const allocator = std.testing.allocator;
    var result = try failure(allocator, &[_]u8{});
    defer result.deinit();

    try std.testing.expectError(Error.UnwrapOnFailure, unwrap(&result));
}

/// Unwrap the result, returning the data or a default value
pub fn unwrapOr(result: *const ContractResult, default: []const u8) []const u8 {
    if (!result.success) {
        return default;
    }
    return result.data;
}

test "unwrapOr - success" {
    const allocator = std.testing.allocator;
    const data = [_]u8{ 0x01, 0x02, 0x03 };
    var result = try success(allocator, &data);
    defer result.deinit();

    const unwrapped = unwrapOr(&result, &[_]u8{});
    try std.testing.expectEqualSlices(u8, &data, unwrapped);
}

test "unwrapOr - failure returns default" {
    const allocator = std.testing.allocator;
    var result = try failure(allocator, &[_]u8{});
    defer result.deinit();

    const default = [_]u8{ 0xff, 0xff };
    const unwrapped = unwrapOr(&result, &default);
    try std.testing.expectEqualSlices(u8, &default, unwrapped);
}

// ============================================================================
// Revert Parsing
// ============================================================================

/// Parse revert reason from raw revert data
fn parseRevertReason(data: []const u8) ?RevertReason {
    if (data.len < 4) {
        if (data.len == 0) {
            return null;
        }
        return .{ .raw = data };
    }

    const selector = data[0..4].*;

    // Check for Panic(uint256)
    if (std.mem.eql(u8, &selector, &PANIC_SELECTOR)) {
        if (data.len >= 36) {
            const code = std.mem.readInt(u256, data[4..36], .big);
            return .{ .panic = code };
        }
        return .{ .raw = data };
    }

    // Check for Error(string)
    if (std.mem.eql(u8, &selector, &ERROR_SELECTOR)) {
        // Try to decode the string
        // ABI encoding: offset (32 bytes) + length (32 bytes) + string data
        if (data.len >= 68) { // 4 + 32 + 32
            const offset = std.mem.readInt(u32, data[32..36], .big);
            if (offset == 32 and data.len >= 68) {
                const str_len = std.mem.readInt(u32, data[64..68], .big);
                if (data.len >= 68 + str_len) {
                    return .{ .error_message = data[68 .. 68 + str_len] };
                }
            }
        }
        return .{ .raw = data };
    }

    // Custom error
    return .{ .custom_error = .{
        .selector = selector,
        .data = data[4..],
    } };
}

test "parseRevertReason - panic" {
    var data: [36]u8 = undefined;
    @memcpy(data[0..4], &PANIC_SELECTOR);
    @memset(data[4..35], 0);
    data[35] = 0x12; // Division by zero

    const reason = parseRevertReason(&data).?;
    try std.testing.expect(reason.isPanic());
    try std.testing.expectEqual(@as(?u256, 0x12), reason.getPanicCode());
}

test "parseRevertReason - empty" {
    const reason = parseRevertReason(&[_]u8{});
    try std.testing.expect(reason == null);
}

test "parseRevertReason - short data" {
    const data = [_]u8{ 0x01, 0x02 };
    const reason = parseRevertReason(&data).?;
    switch (reason) {
        .raw => {},
        else => try std.testing.expect(false),
    }
}

test "parseRevertReason - custom error" {
    const data = [_]u8{ 0xaa, 0xbb, 0xcc, 0xdd, 0x01, 0x02 };
    const reason = parseRevertReason(&data).?;
    switch (reason) {
        .custom_error => |ce| {
            try std.testing.expectEqual([4]u8{ 0xaa, 0xbb, 0xcc, 0xdd }, ce.selector);
            try std.testing.expectEqualSlices(u8, &[_]u8{ 0x01, 0x02 }, ce.data);
        },
        else => try std.testing.expect(false),
    }
}

// ============================================================================
// Conversion
// ============================================================================

/// Convert return data to hex string
pub fn toHex(result: *const ContractResult, allocator: std.mem.Allocator) ![]u8 {
    if (result.data.len == 0) {
        const hex = try allocator.alloc(u8, 2);
        hex[0] = '0';
        hex[1] = 'x';
        return hex;
    }
    return try Hex.encode(allocator, result.data);
}

test "toHex - success with data" {
    const allocator = std.testing.allocator;
    var result = try success(allocator, &[_]u8{ 0x12, 0x34 });
    defer result.deinit();

    const hex = try toHex(&result, allocator);
    defer allocator.free(hex);

    try std.testing.expectEqualStrings("0x1234", hex);
}

test "toHex - empty" {
    const allocator = std.testing.allocator;
    var result = try success(allocator, &[_]u8{});
    defer result.deinit();

    const hex = try toHex(&result, allocator);
    defer allocator.free(hex);

    try std.testing.expectEqualStrings("0x", hex);
}

// ============================================================================
// Cloning
// ============================================================================

/// Clone the contract result
pub fn clone(allocator: std.mem.Allocator, result: *const ContractResult) Error!ContractResult {
    return from(allocator, result.success, result.data);
}

test "clone - success" {
    const allocator = std.testing.allocator;
    var original = try success(allocator, &[_]u8{ 0x01, 0x02 });
    defer original.deinit();

    var copy = try clone(allocator, &original);
    defer copy.deinit();

    try std.testing.expect(copy.isSuccess());
    try std.testing.expectEqualSlices(u8, original.getData(), copy.getData());
    try std.testing.expect(original.data.ptr != copy.data.ptr);
}

test "clone - failure" {
    const allocator = std.testing.allocator;
    var original = try failure(allocator, &[_]u8{});
    defer original.deinit();

    var copy = try clone(allocator, &original);
    defer copy.deinit();

    try std.testing.expect(copy.isFailure());
}
