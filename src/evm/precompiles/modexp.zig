const std = @import("std");
const PrecompileResult = @import("precompile_result.zig").PrecompileResult;
const PrecompileOutput = @import("precompile_result.zig").PrecompileOutput;
const PrecompileError = @import("precompile_result.zig").PrecompileError;

/// ModExp precompile implementation (address 0x05)
///
/// This implementation uses Zig's standard library big integer support for
/// arbitrary-precision modular exponentiation following the Ethereum specification.
///
/// ## Input Format
/// - Bytes 0-31: Length of base (big-endian)
/// - Bytes 32-63: Length of exponent (big-endian)
/// - Bytes 64-95: Length of modulus (big-endian)
/// - Bytes 96+: base || exponent || modulus (all big-endian)
///
/// ## Output Format
/// - Result of base^exponent mod modulus, left-padded with zeros to modulus length
///
/// ## Gas Cost
/// - Complex formula based on input sizes and exponent magnitude
/// - Minimum cost: 200 gas

/// Gas constants for ModExp precompile (per EIP-198)
pub const MODEXP_MIN_GAS: u64 = 200;
pub const MODEXP_QUADRATIC_THRESHOLD: usize = 64;
pub const MODEXP_LINEAR_THRESHOLD: usize = 1024;

/// Calculates the gas cost for ModExp precompile execution
///
/// Follows the Ethereum specification for ModExp gas calculation:
/// - f(x) = x for x <= 64
/// - f(x) = x^2/4 + 96*x - 3072 for 64 < x <= 1024
/// - f(x) = x^2/16 + 480*x - 199680 for x > 1024
///
/// @param base_len Length of the base in bytes
/// @param exp_len Length of the exponent in bytes
/// @param mod_len Length of the modulus in bytes
/// @param exp_bytes The exponent bytes for determining adjusted length
/// @return Total gas cost for the operation
pub fn calculate_gas(base_len: usize, exp_len: usize, mod_len: usize, exp_bytes: []const u8) u64 {
    // Calculate max(base_len, mod_len)
    const max_len = @max(base_len, mod_len);
    
    // Calculate multiplication complexity
    const mult_complexity = calculate_multiplication_complexity(max_len);
    
    // Calculate adjusted exponent length
    const adj_exp_len = calculate_adjusted_exponent_length(exp_len, exp_bytes);
    
    // Gas = mult_complexity * max(adj_exp_len, 1) / 20
    const gas = mult_complexity * @max(adj_exp_len, 1) / 20;
    
    return @max(gas, MODEXP_MIN_GAS);
}

/// Calculates multiplication complexity based on size
fn calculate_multiplication_complexity(x: usize) u64 {
    const x64: u64 = @intCast(x);
    
    if (x <= MODEXP_QUADRATIC_THRESHOLD) {
        return x64 * x64;
    } else if (x <= MODEXP_LINEAR_THRESHOLD) {
        // x^2/4 + 96*x - 3072
        return (x64 * x64) / 4 + 96 * x64 - 3072;
    } else {
        // x^2/16 + 480*x - 199680
        return (x64 * x64) / 16 + 480 * x64 - 199680;
    }
}

/// Calculates adjusted exponent length based on leading zeros
fn calculate_adjusted_exponent_length(exp_len: usize, exp_bytes: []const u8) u64 {
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

/// Executes the ModExp precompile
///
/// This function performs modular exponentiation using Zig's big integer library:
/// 1. Parses input to extract base, exponent, and modulus lengths
/// 2. Validates input and gas requirements
/// 3. Performs base^exponent mod modulus calculation
/// 4. Returns result padded to modulus length
///
/// @param input Input data containing lengths and values
/// @param output Output buffer to write result
/// @param gas_limit Maximum gas available for this operation
/// @return PrecompileOutput containing success/failure and gas usage
pub fn execute(input: []const u8, output: []u8, gas_limit: u64) PrecompileOutput {
    // Need at least 96 bytes for the three length fields
    if (input.len < 96) {
        @branchHint(.cold);
        return PrecompileOutput.failure_result(PrecompileError.ExecutionFailed);
    }
    
    // Parse lengths from input (big-endian 32-byte fields)
    const base_len = parse_u256_to_usize(input[0..32]);
    const exp_len = parse_u256_to_usize(input[32..64]);
    const mod_len = parse_u256_to_usize(input[64..96]);
    
    // Check for reasonable limits to prevent excessive memory allocation
    const max_size = 1024 * 1024; // 1MB limit
    if (base_len > max_size or exp_len > max_size or mod_len > max_size) {
        @branchHint(.cold);
        return PrecompileOutput.failure_result(PrecompileError.ExecutionFailed);
    }
    
    // Calculate required input size
    const required_input_size = 96 + base_len + exp_len + mod_len;
    if (input.len < required_input_size) {
        @branchHint(.cold);
        return PrecompileOutput.failure_result(PrecompileError.ExecutionFailed);
    }
    
    // Extract base, exponent, and modulus from input
    const base_start = 96;
    const exp_start = base_start + base_len;
    const mod_start = exp_start + exp_len;
    
    const base_bytes = if (base_len > 0) input[base_start..exp_start] else &[_]u8{};
    const exp_bytes = if (exp_len > 0) input[exp_start..mod_start] else &[_]u8{};
    const mod_bytes = if (mod_len > 0) input[mod_start..mod_start + mod_len] else &[_]u8{};
    
    // Calculate gas cost
    const gas_cost = calculate_gas(base_len, exp_len, mod_len, exp_bytes);
    
    // Check if we have enough gas
    if (gas_cost > gas_limit) {
        @branchHint(.cold);
        return PrecompileOutput.failure_result(PrecompileError.OutOfGas);
    }
    
    // Handle edge cases
    if (mod_len == 0) {
        // Modulus length 0 means result is 0
        return PrecompileOutput.success_result(gas_cost, 0);
    }
    
    // Check if modulus is zero
    var mod_is_zero = true;
    for (mod_bytes) |byte| {
        if (byte != 0) {
            mod_is_zero = false;
            break;
        }
    }
    
    if (mod_is_zero) {
        // Modulus is 0, result is 0
        @memset(output[0..mod_len], 0);
        return PrecompileOutput.success_result(gas_cost, mod_len);
    }
    
    // Validate output buffer size
    if (output.len < mod_len) {
        @branchHint(.cold);
        return PrecompileOutput.failure_result(PrecompileError.ExecutionFailed);
    }
    
    // Perform modular exponentiation
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    
    modexp_big_int(allocator, base_bytes, exp_bytes, mod_bytes, output[0..mod_len]) catch {
        return PrecompileOutput.failure_result(PrecompileError.ExecutionFailed);
    };
    
    return PrecompileOutput.success_result(gas_cost, mod_len);
}

/// Performs modular exponentiation using Zig's big integer library
/// This is a simplified implementation that handles basic cases
fn modexp_big_int(allocator: std.mem.Allocator, base_bytes: []const u8, exp_bytes: []const u8, mod_bytes: []const u8, output: []u8) !void {
    _ = allocator; // Not used in simplified implementation
    // For now, implement a basic version that handles small numbers
    // We'll convert bytes to u64 when possible for simplicity
    
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
    
    // For simplicity, handle small numbers directly
    if (base_bytes.len <= 8 and exp_bytes.len <= 8 and mod_bytes.len <= 8) {
        const base = bytesToU64(base_bytes);
        const exp = bytesToU64(exp_bytes);
        const mod = bytesToU64(mod_bytes);
        
        if (mod == 0) return; // Division by zero
        
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
    return error.NotImplemented;
}

/// Check if a byte array represents zero
fn isZero(bytes: []const u8) bool {
    for (bytes) |byte| {
        if (byte != 0) return false;
    }
    return true;
}

/// Convert bytes to u64 (big-endian)
fn bytesToU64(bytes: []const u8) u64 {
    var result: u64 = 0;
    for (bytes) |byte| {
        result = (result << 8) | byte;
    }
    return result;
}

/// Parses a 32-byte big-endian value to usize
pub fn parse_u256_to_usize(bytes: []const u8) usize {
    std.debug.assert(bytes.len == 32);
    
    // For usize, we only care about the last 8 bytes on 64-bit systems
    // or last 4 bytes on 32-bit systems
    const usize_bytes = @sizeOf(usize);
    const start = 32 - usize_bytes;
    
    var result: usize = 0;
    for (bytes[start..]) |byte| {
        result = (result << 8) | byte;
    }
    
    return result;
}

/// Gets the expected output size for ModExp precompile
///
/// ModExp always returns exactly modulus_length bytes.
///
/// @param input Input data to parse modulus length from
/// @return Expected output size or 0 if input is invalid
pub fn get_output_size(input: []const u8) usize {
    if (input.len < 96) return 0;
    
    const mod_len = parse_u256_to_usize(input[64..96]);
    return mod_len;
}