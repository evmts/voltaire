//! CallData - ABI-encoded function call data for EVM transactions
//!
//! CallData consists of a 4-byte function selector (first 4 bytes of keccak256 hash
//! of function signature) followed by ABI-encoded parameters.
//!
//! ## Usage
//! ```zig
//! const CallData = @import("primitives").CallData;
//!
//! // From hex string
//! const calldata = try CallData.fromHex(allocator, "0xa9059cbb...");
//!
//! // From bytes
//! const calldata2 = try CallData.fromBytes(allocator, &bytes);
//!
//! // Get function selector
//! const selector = CallData.getSelector(calldata);
//! ```

const std = @import("std");
const Hex = @import("../Hex/Hex.zig");
const crypto = @import("crypto");

/// Minimum size for calldata (4 bytes for function selector)
pub const MIN_SIZE: usize = 4;

/// Size of function selector in bytes
pub const SELECTOR_SIZE: usize = 4;

/// CallData error types
pub const Error = error{
    InvalidCallDataLength,
    InvalidHexFormat,
    OutOfMemory,
    InvalidHexCharacter,
};

/// CallData type - variable length bytes with at least 4 bytes (selector)
pub const CallData = struct {
    data: []u8,
    allocator: std.mem.Allocator,

    const Self = @This();

    /// Free the calldata memory
    pub fn deinit(self: *Self) void {
        self.allocator.free(self.data);
        self.data = &[_]u8{};
    }

    /// Get the underlying bytes
    pub fn bytes(self: *const Self) []const u8 {
        return self.data;
    }

    /// Get the length of the calldata
    pub fn len(self: *const Self) usize {
        return self.data.len;
    }
};

// ============================================================================
// Constructors
// ============================================================================

/// Create CallData from bytes or hex string (auto-detect)
/// For explicit control, use fromBytes or fromHex directly
pub fn from(allocator: std.mem.Allocator, input: []const u8) Error!CallData {
    // Check if it looks like a hex string (starts with 0x or contains only hex chars)
    if (input.len >= 2 and input[0] == '0' and (input[1] == 'x' or input[1] == 'X')) {
        return fromHex(allocator, input);
    }
    // If all chars are valid hex and length suggests hex encoding, try hex first
    if (input.len >= MIN_SIZE * 2 and isAllHex(input)) {
        return fromHex(allocator, input);
    }
    // Otherwise treat as raw bytes
    return fromBytes(allocator, input);
}

fn isAllHex(input: []const u8) bool {
    for (input) |c| {
        if (!std.ascii.isHex(c)) {
            return false;
        }
    }
    return true;
}

test "from - hex with prefix" {
    const allocator = std.testing.allocator;
    var calldata = try from(allocator, "0xa9059cbb");
    defer calldata.deinit();
    try std.testing.expectEqual(@as(usize, 4), calldata.len());
}

test "from - hex without prefix" {
    const allocator = std.testing.allocator;
    var calldata = try from(allocator, "a9059cbb");
    defer calldata.deinit();
    try std.testing.expectEqual(@as(usize, 4), calldata.len());
}

test "from - raw bytes" {
    const allocator = std.testing.allocator;
    const bytes = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    var calldata = try from(allocator, &bytes);
    defer calldata.deinit();
    try std.testing.expectEqual(@as(usize, 4), calldata.len());
}

/// Create CallData from raw bytes (copies the data)
pub fn fromBytes(allocator: std.mem.Allocator, bytes: []const u8) Error!CallData {
    if (bytes.len < MIN_SIZE) {
        return Error.InvalidCallDataLength;
    }

    const data = allocator.alloc(u8, bytes.len) catch return Error.OutOfMemory;
    @memcpy(data, bytes);

    return CallData{
        .data = data,
        .allocator = allocator,
    };
}

test "fromBytes - valid calldata" {
    const allocator = std.testing.allocator;
    const bytes = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb } ++ [_]u8{0} ** 64;
    var calldata = try fromBytes(allocator, &bytes);
    defer calldata.deinit();

    try std.testing.expectEqual(@as(usize, 68), calldata.len());
    try std.testing.expectEqual(@as(u8, 0xa9), calldata.bytes()[0]);
}

test "fromBytes - minimum size" {
    const allocator = std.testing.allocator;
    const bytes = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    var calldata = try fromBytes(allocator, &bytes);
    defer calldata.deinit();

    try std.testing.expectEqual(SELECTOR_SIZE, calldata.len());
}

test "fromBytes - too short" {
    const allocator = std.testing.allocator;
    const bytes = [_]u8{ 0xa9, 0x05, 0x9c };
    try std.testing.expectError(Error.InvalidCallDataLength, fromBytes(allocator, &bytes));
}

/// Create CallData from hex string (with or without 0x prefix)
pub fn fromHex(allocator: std.mem.Allocator, hex: []const u8) Error!CallData {
    const bytes = Hex.decode(allocator, hex) catch |err| switch (err) {
        error.InvalidHexCharacter => return Error.InvalidHexCharacter,
        error.OutOfMemory => return Error.OutOfMemory,
        else => return Error.InvalidHexFormat,
    };
    errdefer allocator.free(bytes);

    if (bytes.len < MIN_SIZE) {
        allocator.free(bytes);
        return Error.InvalidCallDataLength;
    }

    return CallData{
        .data = bytes,
        .allocator = allocator,
    };
}

test "fromHex - with 0x prefix" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb" ++ "00" ** 64);
    defer calldata.deinit();

    try std.testing.expectEqual(@as(usize, 68), calldata.len());
    try std.testing.expectEqual(@as(u8, 0xa9), calldata.bytes()[0]);
}

test "fromHex - without 0x prefix" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "a9059cbb" ++ "00" ** 64);
    defer calldata.deinit();

    try std.testing.expectEqual(@as(usize, 68), calldata.len());
}

test "fromHex - minimum size" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    try std.testing.expectEqual(SELECTOR_SIZE, calldata.len());
}

test "fromHex - too short" {
    const allocator = std.testing.allocator;
    try std.testing.expectError(Error.InvalidCallDataLength, fromHex(allocator, "0xa9059c"));
}

test "fromHex - invalid hex" {
    const allocator = std.testing.allocator;
    try std.testing.expectError(Error.InvalidHexCharacter, fromHex(allocator, "0xzzzzzzzz"));
}

// ============================================================================
// Converters
// ============================================================================

/// Convert CallData to hex string with 0x prefix
pub fn toHex(calldata: *const CallData, allocator: std.mem.Allocator) ![]u8 {
    return try Hex.encode(allocator, calldata.data);
}

test "toHex - basic" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    const hex = try toHex(&calldata, allocator);
    defer allocator.free(hex);

    try std.testing.expectEqualStrings("0xa9059cbb", hex);
}

/// Get raw bytes (alias for bytes())
pub fn toBytes(calldata: *const CallData) []const u8 {
    return calldata.data;
}

test "toBytes - returns slice" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    const bytes = toBytes(&calldata);
    try std.testing.expectEqual(SELECTOR_SIZE, bytes.len);
    try std.testing.expectEqual(@as(u8, 0xa9), bytes[0]);
}

// ============================================================================
// Selectors
// ============================================================================

/// Extract 4-byte function selector from CallData
pub fn getSelector(calldata: *const CallData) [SELECTOR_SIZE]u8 {
    var selector: [SELECTOR_SIZE]u8 = undefined;
    @memcpy(&selector, calldata.data[0..SELECTOR_SIZE]);
    return selector;
}

test "getSelector - basic" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb" ++ "00" ** 64);
    defer calldata.deinit();

    const selector = getSelector(&calldata);
    try std.testing.expectEqual(@as(u8, 0xa9), selector[0]);
    try std.testing.expectEqual(@as(u8, 0x05), selector[1]);
    try std.testing.expectEqual(@as(u8, 0x9c), selector[2]);
    try std.testing.expectEqual(@as(u8, 0xbb), selector[3]);
}

/// Check if calldata has a specific selector
pub fn hasSelector(calldata: *const CallData, selector: [SELECTOR_SIZE]u8) bool {
    return std.mem.eql(u8, calldata.data[0..SELECTOR_SIZE], &selector);
}

test "hasSelector - matching" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    try std.testing.expect(hasSelector(&calldata, .{ 0xa9, 0x05, 0x9c, 0xbb }));
}

test "hasSelector - not matching" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    try std.testing.expect(!hasSelector(&calldata, .{ 0x00, 0x00, 0x00, 0x00 }));
}

/// Compute function selector from signature string
pub fn computeSelector(signature: []const u8) [SELECTOR_SIZE]u8 {
    var hash: [32]u8 = undefined;
    crypto.Keccak256.hash(signature, &hash);
    return hash[0..SELECTOR_SIZE].*;
}

test "computeSelector - transfer" {
    // transfer(address,uint256) selector = 0xa9059cbb
    const selector = computeSelector("transfer(address,uint256)");
    try std.testing.expectEqual(@as(u8, 0xa9), selector[0]);
    try std.testing.expectEqual(@as(u8, 0x05), selector[1]);
    try std.testing.expectEqual(@as(u8, 0x9c), selector[2]);
    try std.testing.expectEqual(@as(u8, 0xbb), selector[3]);
}

test "computeSelector - approve" {
    // approve(address,uint256) selector = 0x095ea7b3
    const selector = computeSelector("approve(address,uint256)");
    try std.testing.expectEqual(@as(u8, 0x09), selector[0]);
    try std.testing.expectEqual(@as(u8, 0x5e), selector[1]);
    try std.testing.expectEqual(@as(u8, 0xa7), selector[2]);
    try std.testing.expectEqual(@as(u8, 0xb3), selector[3]);
}

test "computeSelector - balanceOf" {
    // balanceOf(address) selector = 0x70a08231
    const selector = computeSelector("balanceOf(address)");
    try std.testing.expectEqual(@as(u8, 0x70), selector[0]);
    try std.testing.expectEqual(@as(u8, 0xa0), selector[1]);
    try std.testing.expectEqual(@as(u8, 0x82), selector[2]);
    try std.testing.expectEqual(@as(u8, 0x31), selector[3]);
}

// ============================================================================
// Equality
// ============================================================================

/// Check if two CallData instances are equal (constant-time comparison)
pub fn equals(a: *const CallData, b: *const CallData) bool {
    if (a.data.len != b.data.len) {
        return false;
    }

    // Constant-time comparison to prevent timing attacks
    var result: u8 = 0;
    for (a.data, b.data) |x, y| {
        result |= x ^ y;
    }

    return result == 0;
}

test "equals - identical" {
    const allocator = std.testing.allocator;
    var calldata1 = try fromHex(allocator, "0xa9059cbb" ++ "00" ** 64);
    defer calldata1.deinit();
    var calldata2 = try fromHex(allocator, "0xa9059cbb" ++ "00" ** 64);
    defer calldata2.deinit();

    try std.testing.expect(equals(&calldata1, &calldata2));
}

test "equals - different" {
    const allocator = std.testing.allocator;
    var calldata1 = try fromHex(allocator, "0xa9059cbb");
    defer calldata1.deinit();
    var calldata2 = try fromHex(allocator, "0x095ea7b3");
    defer calldata2.deinit();

    try std.testing.expect(!equals(&calldata1, &calldata2));
}

test "equals - different lengths" {
    const allocator = std.testing.allocator;
    var calldata1 = try fromHex(allocator, "0xa9059cbb");
    defer calldata1.deinit();
    var calldata2 = try fromHex(allocator, "0xa9059cbb00000000");
    defer calldata2.deinit();

    try std.testing.expect(!equals(&calldata1, &calldata2));
}

// ============================================================================
// Parameters
// ============================================================================

/// Get encoded parameters (everything after the selector)
pub fn getParams(calldata: *const CallData) []const u8 {
    if (calldata.data.len <= SELECTOR_SIZE) {
        return &[_]u8{};
    }
    return calldata.data[SELECTOR_SIZE..];
}

test "getParams - with params" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb" ++ "00" ** 64);
    defer calldata.deinit();

    const params = getParams(&calldata);
    try std.testing.expectEqual(@as(usize, 64), params.len);
}

test "getParams - no params" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    const params = getParams(&calldata);
    try std.testing.expectEqual(@as(usize, 0), params.len);
}

// ============================================================================
// Validation
// ============================================================================

/// Check if a hex string is valid calldata format
pub fn isValidHex(hex: []const u8) bool {
    var start: usize = 0;
    if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) {
        start = 2;
    }

    const hex_len = hex.len - start;

    // Must have at least 8 hex chars (4 bytes)
    if (hex_len < MIN_SIZE * 2) {
        return false;
    }

    // Must have even number of hex chars
    if (hex_len % 2 != 0) {
        return false;
    }

    // Check all chars are hex
    for (hex[start..]) |c| {
        if (!std.ascii.isHex(c)) {
            return false;
        }
    }

    return true;
}

test "isValidHex - valid with 0x" {
    try std.testing.expect(isValidHex("0xa9059cbb"));
}

test "isValidHex - valid without 0x" {
    try std.testing.expect(isValidHex("a9059cbb"));
}

test "isValidHex - too short" {
    try std.testing.expect(!isValidHex("0xa905"));
}

test "isValidHex - odd length" {
    try std.testing.expect(!isValidHex("0xa9059cb"));
}

test "isValidHex - invalid chars" {
    try std.testing.expect(!isValidHex("0xzzzzzzzz"));
}

// ============================================================================
// Cloning
// ============================================================================

/// Clone calldata (creates new allocation)
pub fn clone(allocator: std.mem.Allocator, calldata: *const CallData) Error!CallData {
    return fromBytes(allocator, calldata.data);
}

test "clone - creates independent copy" {
    const allocator = std.testing.allocator;
    var original = try fromHex(allocator, "0xa9059cbb");
    defer original.deinit();

    var copy = try clone(allocator, &original);
    defer copy.deinit();

    try std.testing.expect(equals(&original, &copy));
    try std.testing.expect(original.data.ptr != copy.data.ptr);
}

// ============================================================================
// Additional Utilities
// ============================================================================

/// Get arguments (alias for getParams - everything after selector)
pub fn getArgs(calldata: *const CallData) []const u8 {
    return getParams(calldata);
}

test "getArgs - with args" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb" ++ "00" ** 32);
    defer calldata.deinit();

    const args = getArgs(&calldata);
    try std.testing.expectEqual(@as(usize, 32), args.len);
}

test "getArgs - no args" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    const args = getArgs(&calldata);
    try std.testing.expectEqual(@as(usize, 0), args.len);
}

/// Check if calldata is empty (only has selector, no params)
pub fn isEmpty(calldata: *const CallData) bool {
    return calldata.data.len == SELECTOR_SIZE;
}

test "isEmpty - true for selector only" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    try std.testing.expect(isEmpty(&calldata));
}

test "isEmpty - false with params" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb00000000");
    defer calldata.deinit();

    try std.testing.expect(!isEmpty(&calldata));
}

/// Get a slice of calldata bytes
pub fn slice(calldata: *const CallData, start: usize, end: usize) []const u8 {
    if (start >= calldata.data.len) {
        return &[_]u8{};
    }
    const actual_end = @min(end, calldata.data.len);
    if (start >= actual_end) {
        return &[_]u8{};
    }
    return calldata.data[start..actual_end];
}

test "slice - valid range" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb" ++ "00" ** 32);
    defer calldata.deinit();

    const s = slice(&calldata, 0, 4);
    try std.testing.expectEqual(@as(usize, 4), s.len);
    try std.testing.expectEqual(@as(u8, 0xa9), s[0]);
}

test "slice - out of bounds clamped" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    const s = slice(&calldata, 0, 100);
    try std.testing.expectEqual(@as(usize, 4), s.len);
}

test "slice - start beyond end" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    const s = slice(&calldata, 10, 20);
    try std.testing.expectEqual(@as(usize, 0), s.len);
}

/// Concatenate two CallData instances (returns new allocation)
pub fn concat(allocator: std.mem.Allocator, a: *const CallData, b: *const CallData) Error!CallData {
    const total_len = a.data.len + b.data.len - SELECTOR_SIZE;
    if (total_len < MIN_SIZE) {
        return Error.InvalidCallDataLength;
    }

    const data = allocator.alloc(u8, total_len) catch return Error.OutOfMemory;
    errdefer allocator.free(data);

    // Copy first calldata entirely
    @memcpy(data[0..a.data.len], a.data);
    // Append second calldata's params (skip its selector)
    @memcpy(data[a.data.len..], b.data[SELECTOR_SIZE..]);

    return CallData{
        .data = data,
        .allocator = allocator,
    };
}

test "concat - two calldatas" {
    const allocator = std.testing.allocator;
    var calldata1 = try fromHex(allocator, "0xa9059cbb" ++ "00" ** 32);
    defer calldata1.deinit();
    var calldata2 = try fromHex(allocator, "0x095ea7b3" ++ "11" ** 32);
    defer calldata2.deinit();

    var result = try concat(allocator, &calldata1, &calldata2);
    defer result.deinit();

    // First selector + first params + second params
    try std.testing.expectEqual(@as(usize, 4 + 32 + 32), result.len());
    // Verify first selector preserved
    try std.testing.expectEqual(@as(u8, 0xa9), result.data[0]);
    // Verify first params
    try std.testing.expectEqual(@as(u8, 0x00), result.data[4]);
    // Verify second params appended
    try std.testing.expectEqual(@as(u8, 0x11), result.data[36]);
}

/// Concatenate raw bytes to calldata (returns new allocation)
pub fn concatBytes(allocator: std.mem.Allocator, calldata: *const CallData, extra: []const u8) Error!CallData {
    const total_len = calldata.data.len + extra.len;

    const data = allocator.alloc(u8, total_len) catch return Error.OutOfMemory;
    errdefer allocator.free(data);

    @memcpy(data[0..calldata.data.len], calldata.data);
    @memcpy(data[calldata.data.len..], extra);

    return CallData{
        .data = data,
        .allocator = allocator,
    };
}

test "concatBytes - append raw bytes" {
    const allocator = std.testing.allocator;
    var calldata = try fromHex(allocator, "0xa9059cbb");
    defer calldata.deinit();

    const extra = [_]u8{ 0x00, 0x11, 0x22, 0x33 };
    var result = try concatBytes(allocator, &calldata, &extra);
    defer result.deinit();

    try std.testing.expectEqual(@as(usize, 8), result.len());
    try std.testing.expectEqual(@as(u8, 0xa9), result.data[0]);
    try std.testing.expectEqual(@as(u8, 0x00), result.data[4]);
}
