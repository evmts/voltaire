const std = @import("std");

/// Modular exponentiation implementation
/// Computes base^exponent mod modulus for arbitrary-precision integers

/// Error set for modular exponentiation operations
pub const ModExpError = error{
    DivisionByZero,
    InvalidInput,
    AllocationFailed,
    NotImplemented,
};

/// Performs modular exponentiation: base^exponent mod modulus
/// 
/// @param allocator Memory allocator for big integer operations
/// @param base_bytes Base value as big-endian bytes
/// @param exp_bytes Exponent value as big-endian bytes
/// @param mod_bytes Modulus value as big-endian bytes
/// @param output Output buffer (must be at least mod_bytes.len)
pub fn modexp(allocator: std.mem.Allocator, base_bytes: []const u8, exp_bytes: []const u8, mod_bytes: []const u8, output: []u8) ModExpError!void {
    _ = allocator; // Not used in simplified implementation
    
    // Clear output first
    @memset(output, 0);
    
    // Handle special cases
    if (exp_bytes.len == 0 or isZero(exp_bytes)) {
        // exp = 0, result = 1
        if (output.len > 0) output[output.len - 1] = 1;
        return;
    }
    
    if (base_bytes.len == 0 or isZero(base_bytes)) {
        // base = 0, result = 0 (already cleared)
        return;
    }
    
    // Check for zero modulus
    if (mod_bytes.len == 0 or isZero(mod_bytes)) {
        return ModExpError.DivisionByZero;
    }
    
    // For simplicity, handle small numbers directly
    if (base_bytes.len <= 8 and exp_bytes.len <= 8 and mod_bytes.len <= 8) {
        const base = bytesToU64(base_bytes);
        const exp = bytesToU64(exp_bytes);
        const mod = bytesToU64(mod_bytes);
        
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
    
    // For larger numbers, we'll return an error for now
    // This can be extended with proper BigInt implementation later
    return ModExpError.NotImplemented;
}

/// Check if a byte array represents zero
pub fn isZero(bytes: []const u8) bool {
    for (bytes) |byte| {
        if (byte != 0) return false;
    }
    return true;
}

/// Convert bytes to u64 (big-endian)
pub fn bytesToU64(bytes: []const u8) u64 {
    var result: u64 = 0;
    for (bytes) |byte| {
        result = (result << 8) | byte;
    }
    return result;
}

/// Convert u64 to bytes (big-endian)
pub fn u64ToBytes(value: u64, output: []u8) void {
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

/// Calculates multiplication complexity for gas cost
pub fn calculateMultiplicationComplexity(x: usize) u64 {
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

/// Calculates adjusted exponent length based on leading zeros
pub fn calculateAdjustedExponentLength(exp_len: usize, exp_bytes: []const u8) u64 {
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
    
    try modexp(allocator, &base, &exp, &mod, &output);
    try std.testing.expectEqual(@as(u8, 1), output[0]);
}

test "modexp: 0^exp mod m = 0" {
    const allocator = std.testing.allocator;
    
    const base = [_]u8{0};
    const exp = [_]u8{5};
    const mod = [_]u8{7};
    var output: [1]u8 = undefined;
    
    try modexp(allocator, &base, &exp, &mod, &output);
    try std.testing.expectEqual(@as(u8, 0), output[0]);
}

test "modexp: 2^3 mod 5 = 3" {
    const allocator = std.testing.allocator;
    
    const base = [_]u8{2};
    const exp = [_]u8{3};
    const mod = [_]u8{5};
    var output: [1]u8 = undefined;
    
    try modexp(allocator, &base, &exp, &mod, &output);
    try std.testing.expectEqual(@as(u8, 3), output[0]);
}

test "modexp: division by zero" {
    const allocator = std.testing.allocator;
    
    const base = [_]u8{2};
    const exp = [_]u8{3};
    const mod = [_]u8{0};
    var output: [1]u8 = undefined;
    
    try std.testing.expectError(ModExpError.DivisionByZero, modexp(allocator, &base, &exp, &mod, &output));
}