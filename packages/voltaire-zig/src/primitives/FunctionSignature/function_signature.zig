//! FunctionSignature - Function signature parsing and selector computation
//!
//! A FunctionSignature represents an Ethereum function signature like
//! "transfer(address,uint256)". It can parse the signature into components
//! (name and input types) and compute the 4-byte selector.
//!
//! ## Usage
//! ```zig
//! const FunctionSignature = @import("primitives").FunctionSignature;
//!
//! // Parse and compute selector
//! const sig = try FunctionSignature.fromSignature("transfer(address,uint256)");
//! // sig.name = "transfer"
//! // sig.inputs = ["address", "uint256"]
//! // sig.selector = [0xa9, 0x05, 0x9c, 0xbb]
//!
//! // Get selector hex
//! const hex = sig.toHex(); // "0xa9059cbb"
//! ```

const std = @import("std");
const crypto = std.crypto;

/// Selector size in bytes
pub const SELECTOR_SIZE = 4;

/// Selector type (4 bytes)
pub const SelectorType = [SELECTOR_SIZE]u8;

/// Maximum number of input parameters supported
pub const MAX_INPUTS = 32;

/// Maximum length of a single parameter type string
pub const MAX_PARAM_LEN = 256;

/// FunctionSignature type
pub const FunctionSignature = struct {
    /// 4-byte selector (keccak256 first 4 bytes)
    selector: SelectorType,

    /// Original signature string (stored as bounded array)
    signature_buf: [512]u8,
    signature_len: usize,

    /// Parsed function name
    name_end: usize, // index into signature_buf where name ends

    /// Parsed input types (indices into signature)
    input_starts: [MAX_INPUTS]usize,
    input_lens: [MAX_INPUTS]usize,
    input_count: usize,

    /// Get the signature string
    pub fn signature(self: *const FunctionSignature) []const u8 {
        return self.signature_buf[0..self.signature_len];
    }

    /// Get the function name
    pub fn name(self: *const FunctionSignature) []const u8 {
        return self.signature_buf[0..self.name_end];
    }

    /// Get an input type by index
    pub fn getInput(self: *const FunctionSignature, index: usize) ?[]const u8 {
        if (index >= self.input_count) return null;
        const start = self.input_starts[index];
        const len = self.input_lens[index];
        return self.signature_buf[start .. start + len];
    }

    /// Get selector as hex string
    pub fn toHex(self: *const FunctionSignature) [10]u8 {
        return selectorToHex(self.selector);
    }
};

/// Convert selector to hex string with 0x prefix
fn selectorToHex(sel: SelectorType) [10]u8 {
    var result: [10]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    const hex = std.fmt.bytesToHex(&sel, .lower);
    @memcpy(result[2..], &hex);
    return result;
}

/// Compute selector from signature string
fn computeSelector(sig: []const u8) SelectorType {
    var hash: [32]u8 = undefined;
    crypto.hash.sha3.Keccak256.hash(sig, &hash, .{});
    return hash[0..4].*;
}

/// Check if two selectors are equal
fn selectorsEqual(a: SelectorType, b: SelectorType) bool {
    return std.mem.eql(u8, &a, &b);
}

// ============================================================================
// Constructors
// ============================================================================

/// Parse errors
pub const ParseError = error{
    InvalidSignature,
    SignatureTooLong,
    TooManyInputs,
    MissingOpenParen,
    MissingCloseParen,
};

/// Create FunctionSignature from signature string.
/// Parses the signature and computes the selector.
pub fn fromSignature(sig: []const u8) ParseError!FunctionSignature {
    if (sig.len > 512) {
        return ParseError.SignatureTooLong;
    }

    // Find opening parenthesis
    var paren_index: ?usize = null;
    for (sig, 0..) |c, i| {
        if (c == '(') {
            paren_index = i;
            break;
        }
    }

    if (paren_index == null) {
        return ParseError.MissingOpenParen;
    }

    // Verify closing parenthesis
    if (sig[sig.len - 1] != ')') {
        return ParseError.MissingCloseParen;
    }

    var result: FunctionSignature = undefined;

    // Copy signature
    @memcpy(result.signature_buf[0..sig.len], sig);
    result.signature_len = sig.len;

    // Store name end
    result.name_end = paren_index.?;

    // Compute selector
    result.selector = computeSelector(sig);

    // Parse inputs
    const params_start = paren_index.? + 1;
    const params_end = sig.len - 1;
    const params_str = sig[params_start..params_end];

    result.input_count = 0;

    if (params_str.len == 0) {
        // No parameters
        return result;
    }

    // Split by comma, handling nested types (tuples, arrays)
    var current_start = params_start;
    var depth: usize = 0;
    var i: usize = params_start;

    while (i < params_end) : (i += 1) {
        const c = sig[i];
        if (c == ',' and depth == 0) {
            // Found parameter boundary
            if (result.input_count >= MAX_INPUTS) {
                return ParseError.TooManyInputs;
            }
            result.input_starts[result.input_count] = current_start;
            result.input_lens[result.input_count] = i - current_start;
            result.input_count += 1;
            current_start = i + 1;
        } else if (c == '(') {
            depth += 1;
        } else if (c == ')') {
            if (depth > 0) depth -= 1;
        }
    }

    // Add last parameter
    if (current_start < params_end) {
        if (result.input_count >= MAX_INPUTS) {
            return ParseError.TooManyInputs;
        }
        result.input_starts[result.input_count] = current_start;
        result.input_lens[result.input_count] = params_end - current_start;
        result.input_count += 1;
    }

    return result;
}

test "fromSignature - transfer" {
    const sig = try fromSignature("transfer(address,uint256)");
    try std.testing.expectEqualStrings("transfer", sig.name());
    try std.testing.expectEqual(@as(usize, 2), sig.input_count);
    try std.testing.expectEqualStrings("address", sig.getInput(0).?);
    try std.testing.expectEqualStrings("uint256", sig.getInput(1).?);
    try std.testing.expectEqualStrings("0xa9059cbb", &sig.toHex());
}

test "fromSignature - no params" {
    const sig = try fromSignature("totalSupply()");
    try std.testing.expectEqualStrings("totalSupply", sig.name());
    try std.testing.expectEqual(@as(usize, 0), sig.input_count);
    try std.testing.expectEqualStrings("0x18160ddd", &sig.toHex());
}

test "fromSignature - balanceOf" {
    const sig = try fromSignature("balanceOf(address)");
    try std.testing.expectEqualStrings("balanceOf", sig.name());
    try std.testing.expectEqual(@as(usize, 1), sig.input_count);
    try std.testing.expectEqualStrings("address", sig.getInput(0).?);
    try std.testing.expectEqualStrings("0x70a08231", &sig.toHex());
}

test "fromSignature - complex types" {
    const sig = try fromSignature("swap(uint256,uint256,address,bytes)");
    try std.testing.expectEqualStrings("swap", sig.name());
    try std.testing.expectEqual(@as(usize, 4), sig.input_count);
    try std.testing.expectEqualStrings("uint256", sig.getInput(0).?);
    try std.testing.expectEqualStrings("uint256", sig.getInput(1).?);
    try std.testing.expectEqualStrings("address", sig.getInput(2).?);
    try std.testing.expectEqualStrings("bytes", sig.getInput(3).?);
    try std.testing.expectEqualStrings("0x022c0d9f", &sig.toHex());
}

test "fromSignature - tuple types" {
    const sig = try fromSignature("execute((address,uint256,bytes)[])");
    try std.testing.expectEqualStrings("execute", sig.name());
    try std.testing.expectEqual(@as(usize, 1), sig.input_count);
    try std.testing.expectEqualStrings("(address,uint256,bytes)[]", sig.getInput(0).?);
}

test "fromSignature - nested tuple" {
    const sig = try fromSignature("process((uint256,address),bytes)");
    try std.testing.expectEqualStrings("process", sig.name());
    try std.testing.expectEqual(@as(usize, 2), sig.input_count);
    try std.testing.expectEqualStrings("(uint256,address)", sig.getInput(0).?);
    try std.testing.expectEqualStrings("bytes", sig.getInput(1).?);
}

test "fromSignature - invalid no paren" {
    try std.testing.expectError(ParseError.MissingOpenParen, fromSignature("invalid"));
}

test "fromSignature - invalid no close paren" {
    try std.testing.expectError(ParseError.MissingCloseParen, fromSignature("test(address"));
}

/// Create FunctionSignature from just a selector (no parsing info available)
pub fn fromSelector(sel: SelectorType) FunctionSignature {
    var result: FunctionSignature = undefined;

    result.selector = sel;

    // Convert selector to hex as the signature
    const hex = selectorToHex(sel);
    @memcpy(result.signature_buf[0..10], &hex);
    result.signature_len = 10;
    result.name_end = 0; // No name
    result.input_count = 0;

    return result;
}

test "fromSelector - creates minimal signature" {
    const sel = computeSelector("transfer(address,uint256)");
    const sig = fromSelector(sel);
    try std.testing.expectEqualStrings("0xa9059cbb", sig.signature());
    try std.testing.expectEqualStrings("", sig.name());
    try std.testing.expectEqual(@as(usize, 0), sig.input_count);
}

// ============================================================================
// Operations
// ============================================================================

/// Compute selector directly from signature string
pub fn toSelector(sig: []const u8) SelectorType {
    return computeSelector(sig);
}

test "toSelector - direct computation" {
    const sel = toSelector("transfer(address,uint256)");
    const expected = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqual(expected, sel);
}

/// Compute full 32-byte topic hash from signature string.
/// This is the full keccak256 hash (same as event topic0).
pub fn toTopic(sig: []const u8) [32]u8 {
    var hash: [32]u8 = undefined;
    crypto.hash.sha3.Keccak256.hash(sig, &hash, .{});
    return hash;
}

test "toTopic - full 32-byte hash" {
    const topic = toTopic("transfer(address,uint256)");
    // Full keccak256 hash starts with selector bytes
    try std.testing.expectEqual(@as(u8, 0xa9), topic[0]);
    try std.testing.expectEqual(@as(u8, 0x05), topic[1]);
    try std.testing.expectEqual(@as(u8, 0x9c), topic[2]);
    try std.testing.expectEqual(@as(u8, 0xbb), topic[3]);
    // Verify it's a proper 32-byte hash (not truncated)
    try std.testing.expectEqual(@as(usize, 32), topic.len);
}

/// Check if two FunctionSignatures have the same selector
pub fn equals(a: *const FunctionSignature, b: *const FunctionSignature) bool {
    return selectorsEqual(a.selector, b.selector);
}

test "equals - same signature" {
    const sig1 = try fromSignature("transfer(address,uint256)");
    const sig2 = try fromSignature("transfer(address,uint256)");
    try std.testing.expect(equals(&sig1, &sig2));
}

test "equals - different signature" {
    const sig1 = try fromSignature("transfer(address,uint256)");
    const sig2 = try fromSignature("approve(address,uint256)");
    try std.testing.expect(!equals(&sig1, &sig2));
}

/// Parsed signature result
pub const ParsedSignature = struct {
    name: []const u8,
    inputs: []const []const u8,
    inputs_backing: [MAX_INPUTS][]const u8,
    count: usize,
};

/// Parse signature into name and inputs (standalone function)
pub fn parseSignature(sig: []const u8) ParseError!ParsedSignature {
    // Find opening parenthesis
    var paren_index: ?usize = null;
    for (sig, 0..) |c, i| {
        if (c == '(') {
            paren_index = i;
            break;
        }
    }

    if (paren_index == null) {
        return ParseError.MissingOpenParen;
    }

    if (sig[sig.len - 1] != ')') {
        return ParseError.MissingCloseParen;
    }

    const fn_name = sig[0..paren_index.?];
    const params_start = paren_index.? + 1;
    const params_end = sig.len - 1;

    var result: ParsedSignature = undefined;

    result.name = fn_name;
    result.count = 0;

    if (params_start >= params_end) {
        result.inputs = result.inputs_backing[0..0];
        return result;
    }

    // Split by comma, handling nested types
    var current_start = params_start;
    var depth: usize = 0;
    var i: usize = params_start;

    while (i < params_end) : (i += 1) {
        const c = sig[i];
        if (c == ',' and depth == 0) {
            if (result.count >= MAX_INPUTS) {
                return ParseError.TooManyInputs;
            }
            result.inputs_backing[result.count] = sig[current_start..i];
            result.count += 1;
            current_start = i + 1;
        } else if (c == '(') {
            depth += 1;
        } else if (c == ')') {
            if (depth > 0) depth -= 1;
        }
    }

    // Add last parameter
    if (current_start < params_end) {
        if (result.count >= MAX_INPUTS) {
            return ParseError.TooManyInputs;
        }
        result.inputs_backing[result.count] = sig[current_start..params_end];
        result.count += 1;
    }

    result.inputs = result.inputs_backing[0..result.count];
    return result;
}

test "parseSignature - basic" {
    const parsed = try parseSignature("transfer(address,uint256)");
    try std.testing.expectEqualStrings("transfer", parsed.name);
    try std.testing.expectEqual(@as(usize, 2), parsed.count);
    try std.testing.expectEqualStrings("address", parsed.inputs[0]);
    try std.testing.expectEqualStrings("uint256", parsed.inputs[1]);
}

test "parseSignature - empty params" {
    const parsed = try parseSignature("totalSupply()");
    try std.testing.expectEqualStrings("totalSupply", parsed.name);
    try std.testing.expectEqual(@as(usize, 0), parsed.count);
}

test "parseSignature - tuple" {
    const parsed = try parseSignature("swap((uint256,address),bytes)");
    try std.testing.expectEqualStrings("swap", parsed.name);
    try std.testing.expectEqual(@as(usize, 2), parsed.count);
    try std.testing.expectEqualStrings("(uint256,address)", parsed.inputs[0]);
    try std.testing.expectEqualStrings("bytes", parsed.inputs[1]);
}
