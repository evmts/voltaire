/// BN254 Rust Wrapper for Zig Integration
///
/// This module provides Zig bindings for the Rust BN254 library,
/// enabling ECMUL and ECPAIRING precompile implementations using 
/// the arkworks ecosystem for production-grade elliptic curve operations.
///
/// The Rust library is compiled as a static library and linked with Zig.

const std = @import("std");

/// C API bindings for the Rust BN254 library
const c = @cImport({
    @cInclude("bn254_wrapper.h");
});

/// BN254 operation error types
pub const Bn254Error = error{
    InitializationFailed,
    InvalidInput,
    InvalidPoint,
    InvalidScalar,
    ComputationFailed,
};

/// Convert Rust result code to Zig error
fn result_to_error(result: c_int) Bn254Error!void {
    return switch (result) {
        0 => {}, // BN254_SUCCESS
        1 => Bn254Error.InvalidInput,
        2 => Bn254Error.InvalidPoint, 
        3 => Bn254Error.InvalidScalar,
        4 => Bn254Error.ComputationFailed,
        else => Bn254Error.ComputationFailed,
    };
}

/// Initialize the BN254 library
/// This function is thread-safe and can be called multiple times
pub fn init() Bn254Error!void {
    const result = c.bn254_init();
    try result_to_error(result);
}

/// Perform elliptic curve scalar multiplication (ECMUL)
/// 
/// Input format (96 bytes):
/// - Bytes 0-31: x coordinate (big-endian)
/// - Bytes 32-63: y coordinate (big-endian)  
/// - Bytes 64-95: scalar (big-endian)
///
/// Output format (64 bytes):
/// - Bytes 0-31: result x coordinate (big-endian)
/// - Bytes 32-63: result y coordinate (big-endian)
///
/// @param input Input data buffer (must be >= 96 bytes)
/// @param output Output data buffer (must be >= 64 bytes)
/// @return Bn254Error on failure
pub fn ecmul(input: []const u8, output: []u8) Bn254Error!void {
    if (input.len < 96 or output.len < 64) {
        return Bn254Error.InvalidInput;
    }

    const result = c.bn254_ecmul(
        input.ptr,
        @intCast(input.len),
        output.ptr,
        @intCast(output.len)
    );
    
    try result_to_error(result);
}

/// Perform elliptic curve pairing check (ECPAIRING)
/// 
/// Input format (multiple of 192 bytes):
/// Each 192-byte group contains:
/// - Bytes 0-63: G1 point (x, y coordinates, 32 bytes each)
/// - Bytes 64-191: G2 point (x and y in Fp2, 64 bytes each)
///
/// Output format (32 bytes):
/// - 32-byte boolean result (0x00...00 for false, 0x00...01 for true)
///
/// @param input Input data buffer (must be multiple of 192 bytes)
/// @param output Output data buffer (must be >= 32 bytes)
/// @return Bn254Error on failure
pub fn ecpairing(input: []const u8, output: []u8) Bn254Error!void {
    if (input.len % 192 != 0 or output.len < 32) {
        return Bn254Error.InvalidInput;
    }

    const result = c.bn254_ecpairing(
        input.ptr,
        @intCast(input.len),
        output.ptr,
        @intCast(output.len)
    );
    
    try result_to_error(result);
}

/// Get expected output size for ECMUL
pub fn ecmul_output_size() usize {
    return c.bn254_ecmul_output_size();
}

/// Get expected output size for ECPAIRING
pub fn ecpairing_output_size() usize {
    return c.bn254_ecpairing_output_size();
}

/// Validate ECMUL input format
pub fn validate_ecmul_input(input: []const u8) Bn254Error!void {
    const result = c.bn254_ecmul_validate_input(
        input.ptr,
        @intCast(input.len)
    );
    try result_to_error(result);
}

/// Validate ECPAIRING input format  
pub fn validate_ecpairing_input(input: []const u8) Bn254Error!void {
    const result = c.bn254_ecpairing_validate_input(
        input.ptr,
        @intCast(input.len)
    );
    try result_to_error(result);
}

// Tests
const testing = std.testing;

test "BN254 wrapper initialization" {
    try init();
    // Should be safe to call multiple times
    try init();
}

test "BN254 output sizes" {
    try testing.expectEqual(@as(usize, 64), ecmul_output_size());
    try testing.expectEqual(@as(usize, 32), ecpairing_output_size());
}

test "BN254 input validation" {
    // Test ECMUL validation
    var ecmul_input = [_]u8{0} ** 96;
    try validate_ecmul_input(&ecmul_input);
    
    // Test invalid ECMUL input
    var short_input = [_]u8{0} ** 50;
    try testing.expectError(Bn254Error.InvalidInput, validate_ecmul_input(&short_input));
    
    // Test ECPAIRING validation  
    var ecpairing_input = [_]u8{0} ** 192;
    try validate_ecpairing_input(&ecpairing_input);
    
    // Test invalid ECPAIRING input (not multiple of 192)
    var invalid_pairing_input = [_]u8{0} ** 100;
    try testing.expectError(Bn254Error.InvalidInput, validate_ecpairing_input(&invalid_pairing_input));
}