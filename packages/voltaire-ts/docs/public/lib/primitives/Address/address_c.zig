//! C ABI exports for Address (WASM compilation target)
//!
//! Minimal standalone WASM module for Address operations.
//! Designed for bundle size comparison vs JavaScript implementation.
//!
//! Functions:
//! - addressFromHex: Parse hex string to address
//! - addressToHex: Convert address to hex string
//! - addressIsValid: Validate address format
//! - addressEquals: Compare two addresses
//! - addressIsZero: Check if address is zero
//!
//! Memory model:
//! - Caller provides input pointers + lengths
//! - Caller provides output buffers
//! - No allocations in WASM

const std = @import("std");

/// Parse hex string to address (20 bytes)
/// @param hex_ptr Pointer to hex string (with or without 0x prefix)
/// @param hex_len Length of hex string
/// @param output_ptr Pointer to output buffer (must be 20 bytes)
/// @return 0 on success, 1 on error
export fn addressFromHex(hex_ptr: [*]const u8, hex_len: usize, output_ptr: [*]u8) u8 {
    const hex_str = hex_ptr[0..hex_len];

    // Handle 0x prefix
    var slice = hex_str;
    if (slice.len >= 2 and slice[0] == '0' and (slice[1] == 'x' or slice[1] == 'X')) {
        if (slice.len != 42) return 1; // Invalid length
        slice = slice[2..];
    } else {
        if (slice.len != 40) return 1; // Invalid length
    }

    // Parse hex to bytes
    var output: [20]u8 = undefined;
    _ = std.fmt.hexToBytes(&output, slice) catch return 1;

    @memcpy(output_ptr[0..20], &output);
    return 0;
}

/// Convert address to hex string (with 0x prefix)
/// @param addr_ptr Pointer to address bytes (20 bytes)
/// @param output_ptr Pointer to output buffer (must be 42 bytes)
export fn addressToHex(addr_ptr: [*]const u8, output_ptr: [*]u8) void {
    const addr = addr_ptr[0..20];
    const hex = std.fmt.bytesToHex(addr, .lower);

    output_ptr[0] = '0';
    output_ptr[1] = 'x';
    @memcpy(output_ptr[2..42], &hex);
}

/// Validate hex string is valid address format
/// @param hex_ptr Pointer to hex string
/// @param hex_len Length of hex string
/// @return 1 if valid, 0 if invalid
export fn addressIsValid(hex_ptr: [*]const u8, hex_len: usize) u8 {
    const hex_str = hex_ptr[0..hex_len];

    // Check length
    if (hex_str.len == 42) {
        if (hex_str[0] != '0' or (hex_str[1] != 'x' and hex_str[1] != 'X')) return 0;
    } else if (hex_str.len != 40) {
        return 0;
    }

    // Try to parse
    const slice = if (hex_str.len == 42) hex_str[2..] else hex_str;
    var temp: [20]u8 = undefined;
    _ = std.fmt.hexToBytes(&temp, slice) catch return 0;

    return 1;
}

/// Compare two addresses for equality
/// @param addr1_ptr Pointer to first address (20 bytes)
/// @param addr2_ptr Pointer to second address (20 bytes)
/// @return 1 if equal, 0 if not equal
export fn addressEquals(addr1_ptr: [*]const u8, addr2_ptr: [*]const u8) u8 {
    const addr1 = addr1_ptr[0..20];
    const addr2 = addr2_ptr[0..20];

    for (addr1, addr2) |a, b| {
        if (a != b) return 0;
    }
    return 1;
}

/// Check if address is zero address
/// @param addr_ptr Pointer to address (20 bytes)
/// @return 1 if zero, 0 if not zero
export fn addressIsZero(addr_ptr: [*]const u8) u8 {
    const addr = addr_ptr[0..20];

    for (addr) |byte| {
        if (byte != 0) return 0;
    }
    return 1;
}
