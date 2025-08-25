const std = @import("std");

/// ⚠️ UNAUDITED CUSTOM CRYPTO IMPLEMENTATION - NOT SECURITY AUDITED ⚠️
///
/// This module contains CUSTOM modular exponentiation implementations
/// that have NOT been security audited or verified against known attacks.
/// These implementations are provided for educational/testing purposes only.
/// DO NOT USE IN PRODUCTION without proper security audit and testing.
///
/// Known risks:
/// - Potential timing attacks in big integer operations
/// - Unvalidated against side-channel vulnerabilities
/// - Custom algorithms may have edge case bugs
/// - Memory safety not guaranteed under all conditions
///
/// Modular exponentiation implementation
/// Computes base^exponent mod modulus for arbitrary-precision integers
/// Error set for modular exponentiation operations
pub const ModExpError = error{
    DivisionByZero,
    InvalidInput,
    AllocationFailed,
    NotImplemented,
    OutOfMemory,
    InvalidBase,
    InvalidCharacter,
    NoSpaceLeft,
    InvalidLength,
};

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Performs modular exponentiation: base^exponent mod modulus
/// WARNING: This is a custom crypto implementation that has not been security audited.
/// May be vulnerable to timing attacks and other side-channel attacks.
/// Do not use in production without proper security review.
///
/// @param allocator Memory allocator for big integer operations
/// @param base_bytes Base value as big-endian bytes
/// @param exp_bytes Exponent value as big-endian bytes
/// @param mod_bytes Modulus value as big-endian bytes
/// @param output Output buffer (must be at least mod_bytes.len)
pub fn unaudited_modexp(allocator: std.mem.Allocator, base_bytes: []const u8, exp_bytes: []const u8, mod_bytes: []const u8, output: []u8) ModExpError!void {
    // Clear output first
    @memset(output, 0);

    // Handle special cases
    if (exp_bytes.len == 0 or unaudited_isZero(exp_bytes)) {
        // exp = 0, result = 1
        if (output.len > 0) output[output.len - 1] = 1;
        return;
    }

    if (base_bytes.len == 0 or unaudited_isZero(base_bytes)) {
        // base = 0, result = 0 (already cleared)
        return;
    }

    // Check for zero modulus
    if (mod_bytes.len == 0 or unaudited_isZero(mod_bytes)) {
        return ModExpError.DivisionByZero;
    }

    // For simplicity, handle small numbers directly
    if (base_bytes.len <= 8 and exp_bytes.len <= 8 and mod_bytes.len <= 8) {
        const base = unaudited_bytesToU64(base_bytes);
        const exp = unaudited_bytesToU64(exp_bytes);
        const mod = unaudited_bytesToU64(mod_bytes);

        if (mod == 0) return ModExpError.DivisionByZero;

        var result: u64 = 1;
        var base_mod = base % mod;
        var exp_remaining = exp;

        // Square and multiply algorithm
        while (exp_remaining > 0) {
            if (exp_remaining & 1 == 1) {
                result = (result * base_mod) % mod;
            }
            base_mod = (base_mod * base_mod) % mod;
            exp_remaining >>= 1;
        }

        // Write result to output (big-endian)
        const result_bytes = @min(output.len, 8);
        var i: usize = 0;
        while (i < result_bytes) : (i += 1) {
            const shift: u6 = @intCast((result_bytes - 1 - i) * 8);
            output[output.len - result_bytes + i] = @intCast((result >> shift) & 0xFF);
        }
        return;
    }

    // For larger numbers, use big integer implementation
    const Managed = std.math.big.int.Managed;

    // Initialize big integers
    var base = try Managed.init(allocator);
    defer base.deinit();
    var exp = try Managed.init(allocator);
    defer exp.deinit();
    var mod = try Managed.init(allocator);
    defer mod.deinit();

    // Parse inputs from big-endian bytes
    try read_big_endian(&base, base_bytes);
    try read_big_endian(&exp, exp_bytes);
    try read_big_endian(&mod, mod_bytes);

    // Check if modulus is zero
    var zero = try Managed.init(allocator);
    defer zero.deinit();
    try zero.set(0);
    if (mod.eql(zero)) {
        return ModExpError.DivisionByZero;
    }

    // Perform modular exponentiation using square-and-multiply
    var result = try Managed.init(allocator);
    defer result.deinit();
    try result.set(1); // result = 1

    var base_mod = try Managed.init(allocator);
    defer base_mod.deinit();

    // base_mod = base % mod
    var quotient = try Managed.init(allocator);
    defer quotient.deinit();
    try quotient.divFloor(&base_mod, &base, &mod);

    // Temporary variables for operations
    var temp = try Managed.init(allocator);
    defer temp.deinit();
    var exp_copy = try exp.clone();
    defer exp_copy.deinit();

    // Square and multiply algorithm
    while (!exp_copy.eql(zero)) {
        // Check if exp is odd (exp & 1 == 1)
        if (exp_copy.isOdd()) {
            // result = (result * base_mod) % mod
            try temp.mul(&result, &base_mod);
            try quotient.divFloor(&result, &temp, &mod);
        }

        // base_mod = (base_mod * base_mod) % mod
        try temp.sqr(&base_mod);
        try quotient.divFloor(&base_mod, &temp, &mod);

        // exp >>= 1
        try exp_copy.shiftRight(&exp_copy, 1);
    }

    // Write result to output (big-endian)
    try write_big_endian(&result, output);
}

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Check if a byte array represents zero
/// WARNING: May be vulnerable to timing attacks
pub fn unaudited_isZero(bytes: []const u8) bool {
    for (bytes) |byte| {
        if (byte != 0) return false;
    }
    return true;
}

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Convert bytes to u64 (big-endian)
/// WARNING: May be vulnerable to timing attacks
pub fn unaudited_bytesToU64(bytes: []const u8) u64 {
    var result: u64 = 0;
    for (bytes) |byte| {
        result = (result << 8) | byte;
    }
    return result;
}

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Convert u64 to bytes (big-endian)
/// WARNING: May be vulnerable to timing attacks
pub fn unaudited_u64ToBytes(value: u64, output: []u8) void {
    const len = output.len;
    var i: usize = 0;
    while (i < len) : (i += 1) {
        const shift: u6 = @intCast((len - 1 - i) * 8);
        output[i] = @intCast((value >> shift) & 0xFF);
    }
}

/// Gas calculation constants (per EIP-198)
pub const GAS_QUADRATIC_THRESHOLD: usize = 64;
pub const GAS_LINEAR_THRESHOLD: usize = 1024;

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Calculates multiplication complexity for gas cost
/// WARNING: Custom gas calculation logic not audited
pub fn unaudited_calculateMultiplicationComplexity(x: usize) u64 {
    const x64: u64 = @intCast(x);

    if (x <= GAS_QUADRATIC_THRESHOLD) {
        return x64 * x64;
    } else if (x <= GAS_LINEAR_THRESHOLD) {
        // x^2/4 + 96*x - 3072
        return (x64 * x64) / 4 + 96 * x64 - 3072;
    } else {
        // x^2/16 + 480*x - 199680
        return (x64 * x64) / 16 + 480 * x64 - 199680;
    }
}

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Calculates adjusted exponent length based on leading zeros
/// WARNING: Custom exponent length calculation not audited
pub fn unaudited_calculateAdjustedExponentLength(exp_len: usize, exp_bytes: []const u8) u64 {
    if (exp_len == 0) return 0;

    // Find first non-zero byte
    var leading_zeros: usize = 0;
    for (exp_bytes) |byte| {
        if (byte != 0) break;
        leading_zeros += 1;
    }

    // If all zeros, adjusted length is 0
    if (leading_zeros == exp_bytes.len) return 0;

    // Get the first non-zero byte and count its leading zero bits
    const first_non_zero = exp_bytes[leading_zeros];
    const bit_length = 8 - @clz(first_non_zero);

    // Adjusted length = (exp_len - leading_zeros - 1) * 8 + bit_length
    const adj_len = (exp_len - leading_zeros - 1) * 8 + bit_length;

    return @intCast(adj_len);
}

test "modexp: base^0 mod m = 1" {
    const allocator = std.testing.allocator;

    const base = [_]u8{5};
    const exp = [_]u8{0};
    const mod = [_]u8{7};
    var output: [1]u8 = undefined;

    try unaudited_modexp(allocator, &base, &exp, &mod, &output);
    try std.testing.expectEqual(@as(u8, 1), output[0]);
}

test "modexp: 0^exp mod m = 0" {
    const allocator = std.testing.allocator;

    const base = [_]u8{0};
    const exp = [_]u8{5};
    const mod = [_]u8{7};
    var output: [1]u8 = undefined;

    try unaudited_modexp(allocator, &base, &exp, &mod, &output);
    try std.testing.expectEqual(@as(u8, 0), output[0]);
}

test "modexp: 2^3 mod 5 = 3" {
    const allocator = std.testing.allocator;

    const base = [_]u8{2};
    const exp = [_]u8{3};
    const mod = [_]u8{5};
    var output: [1]u8 = undefined;

    try unaudited_modexp(allocator, &base, &exp, &mod, &output);
    try std.testing.expectEqual(@as(u8, 3), output[0]);
}

test "modexp: division by zero" {
    const allocator = std.testing.allocator;

    const base = [_]u8{2};
    const exp = [_]u8{3};
    const mod = [_]u8{0};
    var output: [1]u8 = undefined;

    try std.testing.expectError(ModExpError.DivisionByZero, unaudited_modexp(allocator, &base, &exp, &mod, &output));
}

/// Read big-endian bytes into a Managed big integer
fn read_big_endian(big: *std.math.big.int.Managed, bytes: []const u8) !void {
    if (bytes.len == 0) {
        try big.set(0);
        return;
    }

    // Convert bytes to hex string and use setString
    const hex_string = try std.fmt.allocPrint(big.allocator, "{X}", .{bytes});
    defer big.allocator.free(hex_string);

    try big.setString(16, hex_string);
}

/// Write a Managed big integer to big-endian bytes
fn write_big_endian(big: *const std.math.big.int.Managed, output: []u8) !void {
    @memset(output, 0);

    // Check if the big integer is zero
    if (big.bitCountTwosComp() == 0) {
        return;
    }

    // Convert to hex string and then to bytes
    const hex_string = try big.toString(big.allocator, 16, .upper);
    defer big.allocator.free(hex_string);

    // Parse hex string back to bytes
    const hex_bytes = try big.allocator.alloc(u8, hex_string.len / 2);
    defer big.allocator.free(hex_bytes);
    _ = try std.fmt.hexToBytes(hex_bytes, hex_string);

    // Copy to output buffer (right-aligned)
    const copy_len = @min(output.len, hex_bytes.len);
    const offset = output.len - copy_len;
    @memcpy(output[offset..], hex_bytes[0..copy_len]);
}

test "modexp: large numbers - 2^255 mod 2^128" {
    const allocator = std.testing.allocator;

    // base = 2
    const base = [_]u8{2};

    // exp = 255
    const exp = [_]u8{0xFF};

    // mod = 2^128 = 0x100000000000000000000000000000000
    const mod = [_]u8{1} ++ ([_]u8{0} ** 16);

    var output: [17]u8 = undefined;

    try unaudited_modexp(allocator, &base, &exp, &mod, &output);

    // 2^255 mod 2^128 = 2^127
    var expected: [17]u8 = .{0} ** 17;
    expected[9] = 0x80; // 2^127 in big-endian

    try std.testing.expectEqualSlices(u8, &expected, &output);
}

test "modexp: large base and modulus" {
    const allocator = std.testing.allocator;

    // base = 0xDEADBEEFDEADBEEFDEADBEEFDEADBEEF (16 bytes)
    const base = [_]u8{ 0xDE, 0xAD, 0xBE, 0xEF } ** 4;

    // exp = 3
    const exp = [_]u8{3};

    // mod = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF (16 bytes)
    const mod = [_]u8{0xFF} ** 16;

    var output: [16]u8 = undefined;

    try unaudited_modexp(allocator, &base, &exp, &mod, &output);

    // Verify the result is less than the modulus
    for (output, 0..) |byte, i| {
        if (byte < mod[i]) break;
        if (byte > mod[i]) {
            std.debug.print("Output greater than modulus at byte {}\n", .{i});
            try std.testing.expect(false);
        }
    }
}

test "modexp: very large exponent" {
    const allocator = std.testing.allocator;

    // base = 3
    const base = [_]u8{3};

    // exp = 0x010000000000000000 (2^64)
    const exp = [_]u8{1} ++ ([_]u8{0} ** 8);

    // mod = 1000000007 (large prime)
    const mod = [_]u8{ 0x3B, 0x9A, 0xCA, 0x07 };

    var output: [4]u8 = undefined;

    try unaudited_modexp(allocator, &base, &exp, &mod, &output);

    // Verify result is less than modulus
    const result = unaudited_bytesToU64(&output);
    const modulus = unaudited_bytesToU64(&mod);
    try std.testing.expect(result < modulus);
}
