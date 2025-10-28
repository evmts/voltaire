//! C ABI exports for Keccak256 (WASM compilation target)
//!
//! This module provides C-compatible exports for Keccak256 hashing.
//! Designed as an individual compilation unit for tree-shakable WASM builds.
//!
//! Functions:
//! - keccak256Hash: Hash arbitrary data with Keccak-256
//!
//! Memory model:
//! - Caller provides input pointer + length
//! - Caller provides output buffer (32 bytes)
//! - No allocations in WASM

const std = @import("std");

/// Hash data with Keccak-256
/// @param input_ptr Pointer to input data
/// @param input_len Length of input data in bytes
/// @param output_ptr Pointer to output buffer (must be 32 bytes)
export fn keccak256Hash(input_ptr: [*]const u8, input_len: usize, output_ptr: [*]u8) void {
    const input = input_ptr[0..input_len];
    var output: [32]u8 = undefined;
    std.crypto.hash.sha3.Keccak256.hash(input, &output, .{});
    @memcpy(output_ptr[0..32], &output);
}
