const std = @import("std");
const PrecompileOutput = @import("precompile_result.zig").PrecompileOutput;
const PrecompileError = @import("precompile_result.zig").PrecompileError;
const gas_utils = @import("../constants/gas_constants.zig");
const primitives = @import("primitives");
const crypto = @import("crypto");

/// SHA256 precompile implementation
///
/// This module implements the SHA256 cryptographic hash function precompile at address 0x02.
/// The precompile follows the Ethereum specification:
///
/// - Address: 0x0000000000000000000000000000000000000002
/// - Gas cost: 60 + 12 * ceil(input_size / 32)
/// - Output: Always 32 bytes (SHA256 hash)
/// - Available: From Frontier hardfork onwards
///
/// ## Gas Calculation
/// The gas cost is calculated as a base cost of 60 gas plus 12 gas per 32-byte word.
/// This reflects the computational cost of hashing data.
///
/// ## Implementation
/// Uses Zig's standard library `std.crypto.hash.sha2.Sha256` for the actual cryptographic operation.
/// This ensures security, correctness, and performance while maintaining minimal code complexity.
///
/// ## Security
/// SHA256 is a cryptographically secure hash function that produces a 256-bit (32-byte) digest.
/// The implementation is resistant to length extension attacks and produces deterministic output.
/// Base gas cost for SHA256 precompile
/// This is the minimum cost regardless of input size
const SHA256_BASE_COST: u64 = 60;

/// Gas cost per 32-byte word for SHA256 precompile
/// Total cost = SHA256_BASE_COST + (word_count * SHA256_WORD_COST)
const SHA256_WORD_COST: u64 = 12;

/// SHA256 always outputs exactly 32 bytes
const SHA256_OUTPUT_SIZE: usize = crypto.HashAlgorithms.SHA256.OUTPUT_SIZE;

/// Calculate gas cost for SHA256 precompile
///
/// The gas cost follows the formula: 60 + 12 * ceil(input_size / 32)
/// This provides a base cost plus a linear cost based on the number of 32-byte words.
///
/// @param input_size Size of input data in bytes
/// @return Gas cost for processing this input
pub fn calculate_gas(input_size: usize) u64 {
    const word_count = gas_utils.wordCount(input_size);
    return SHA256_BASE_COST + SHA256_WORD_COST * word_count;
}

/// Calculate gas cost with overflow checking
///
/// Same as calculate_gas but returns an error if the calculation would overflow.
/// This is important for very large inputs that could cause arithmetic overflow.
/// Uses std.math functions for cleaner and more robust overflow handling.
///
/// @param input_size Size of input data in bytes
/// @return Gas cost or error.Overflow if calculation overflows
pub fn calculate_gas_checked(input_size: usize) !u64 {
    // Check for potential overflow in word count calculation (bytes + 31)
    const input_plus_31 = std.math.add(usize, input_size, 31) catch {
        return error.Overflow;
    };
    const word_count = input_plus_31 / 32;
    
    // Convert word_count to u64 with overflow checking
    const word_count_u64 = std.math.cast(u64, word_count) orelse {
        return error.Overflow;
    };

    // Check for potential overflow in gas calculation
    const gas_from_words = std.math.mul(u64, SHA256_WORD_COST, word_count_u64) catch {
        return error.Overflow;
    };

    // Use std.math.add for total gas calculation with overflow checking
    const total_gas = std.math.add(u64, SHA256_BASE_COST, gas_from_words) catch {
        return error.Overflow;
    };

    return total_gas;
}

/// Hash function wrapper for SHA256
///
/// Wrapper that matches the signature expected by executeHashPrecompile template.
/// This allows SHA256 to use the generic hash precompile implementation.
///
/// @param input Input data to hash
/// @param output Output buffer for hash result
fn sha256Hash(input: []const u8, output: []u8) void {
    crypto.HashAlgorithms.SHA256.hash(input, output[0..SHA256_OUTPUT_SIZE]);
}

/// Output formatter for SHA256
///
/// SHA256 outputs exactly 32 bytes which matches the expected output size,
/// so no padding is required. This directly copies the hash.
///
/// @param hash_bytes The hash to copy
/// @param output The output buffer to fill
fn sha256Format(hash_bytes: []const u8, output: []u8) void {
    @memcpy(output[0..SHA256_OUTPUT_SIZE], hash_bytes[0..SHA256_OUTPUT_SIZE]);
}

/// Execute SHA256 precompile
///
/// Computes the SHA256 hash of the input data and writes it to the output buffer.
/// Performs gas checking and validates output buffer size before execution.
///
/// This implementation now uses the shared executeHashPrecompile template for
/// consistency and potential size reduction through code reuse.
///
/// @param input Input data to hash
/// @param output Output buffer for the 32-byte hash (must be at least 32 bytes)
/// @param gas_limit Maximum gas available for execution
/// @return PrecompileOutput with success/failure status and gas usage
pub fn execute(input: []const u8, output: []u8, gas_limit: u64) PrecompileOutput {
    const precompile_utils = @import("precompile_gas.zig");
    return precompile_utils.executeHashPrecompile(
        SHA256_BASE_COST,
        SHA256_WORD_COST,
        sha256Hash,
        SHA256_OUTPUT_SIZE,
        sha256Format,
        input,
        output,
        gas_limit,
    );
}

/// Validate that sufficient gas is available for the given input size
///
/// @param input_size Size of input data in bytes
/// @param available_gas Available gas limit
/// @return true if gas is sufficient, false otherwise
pub fn validate_gas_requirement(input_size: usize, available_gas: u64) bool {
    const required_gas = calculate_gas(input_size);
    return required_gas <= available_gas;
}

/// Get the output size for SHA256 precompile
///
/// SHA256 always produces exactly 32 bytes of output regardless of input size.
/// This function is provided for consistency with other precompiles.
///
/// @param input_size Size of input data (unused for SHA256)
/// @return Always returns 32 (SHA256_OUTPUT_SIZE)
pub fn get_output_size(input_size: usize) usize {
    _ = input_size; // SHA256 output size is always 32 bytes
    return SHA256_OUTPUT_SIZE;
}
