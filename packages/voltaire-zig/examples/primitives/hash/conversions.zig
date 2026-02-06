const std = @import("std");
const primitives = @import("primitives");

/// Hash Conversions and Formatting Example
///
/// Demonstrates:
/// - Converting between hex, bytes, and string formats
/// - Display formatting for UIs
/// - Cloning and slicing hashes
/// - Working with hash as byte array
const Hash = primitives.hash.Hash;

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("\n=== Hash Conversions and Formatting Example ===\n\n", .{});

    // ============================================================
    // Creating Hashes from Different Sources
    // ============================================================

    try stdout.print("--- Creating Hashes ---\n\n", .{});

    // From hex string
    const hash_from_hex = Hash.fromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    var display_buf: [20]u8 = undefined;
    try stdout.print("From hex: {s}\n", .{Hash.format(hash_from_hex, 6, 4, &display_buf)});

    // From bytes
    var bytes: [32]u8 = undefined;
    for (&bytes, 0..) |*b, i| {
        b.* = @intCast(i);
    }
    const hash_from_bytes = Hash.fromBytes(&bytes);
    try stdout.print("From bytes: {s}\n", .{Hash.format(hash_from_bytes, 6, 4, &display_buf)});

    // From Keccak-256 hash
    const hash_from_keccak = Hash.keccak256String("hello");
    try stdout.print("From keccak256: {s}\n", .{Hash.format(hash_from_keccak, 6, 4, &display_buf)});

    // ============================================================
    // Converting to Different Formats
    // ============================================================

    try stdout.print("\n--- Converting to Formats ---\n\n", .{});

    const hash = Hash.keccak256String("example");

    // To hex string (lowercase with 0x prefix)
    var hex_buf: [66]u8 = undefined;
    const hex = Hash.toHex(hash, &hex_buf);
    try stdout.print("toHex(): {s}\n", .{hex});

    // To bytes (returns copy)
    const hash_bytes = Hash.toBytes(hash);
    try stdout.print("toBytes(): [32]u8\n", .{});
    try stdout.print("  First 8 bytes: ", .{});
    for (hash_bytes[0..8]) |byte| {
        try stdout.print("0x{x:0>2} ", .{byte});
    }
    try stdout.print("\n", .{});

    // ============================================================
    // Display Formatting
    // ============================================================

    try stdout.print("\n--- Display Formatting ---\n\n", .{});

    const display_hash = Hash.keccak256String("This is a long message that will be hashed");

    // Different format lengths
    var fmt_buf: [30]u8 = undefined;

    try stdout.print("Default format(6, 4): {s}\n", .{Hash.format(display_hash, 6, 4, &fmt_buf)});
    try stdout.print("format(4, 4):         {s}\n", .{Hash.format(display_hash, 4, 4, &fmt_buf)});
    try stdout.print("format(8, 6):         {s}\n", .{Hash.format(display_hash, 8, 6, &fmt_buf)});
    try stdout.print("format(10, 8):        {s}\n", .{Hash.format(display_hash, 10, 8, &fmt_buf)});
    try stdout.print("format(2, 2):         {s}\n", .{Hash.format(display_hash, 2, 2, &fmt_buf)});

    // Full hash
    try stdout.print("Full hash:            {s}\n", .{Hash.toHex(display_hash, &hex_buf)});

    // ============================================================
    // Format Comparison
    // ============================================================

    try stdout.print("\n--- Format Comparison ---\n\n", .{});

    const sample_hash = Hash.keccak256String("sample data");

    try stdout.print("Sample hash in different formats:\n", .{});
    try stdout.print("  Full hex:            {s}\n", .{Hash.toHex(sample_hash, &hex_buf)});
    try stdout.print("  Short (4+4):         {s}\n", .{Hash.format(sample_hash, 4, 4, &fmt_buf)});
    try stdout.print("  Default (6+4):       {s}\n", .{Hash.format(sample_hash, 6, 4, &fmt_buf)});
    try stdout.print("  Medium (8+6):        {s}\n", .{Hash.format(sample_hash, 8, 6, &fmt_buf)});
    try stdout.print("  Long (12+8):         {s}\n", .{Hash.format(sample_hash, 12, 8, &fmt_buf)});

    // ============================================================
    // Cloning Hashes
    // ============================================================

    try stdout.print("\n--- Cloning Hashes ---\n\n", .{});

    const original = Hash.keccak256String("original");
    var cloned = Hash.clone(original);

    try stdout.print("Original: {s}\n", .{Hash.format(original, 6, 4, &display_buf)});
    try stdout.print("Cloned:   {s}\n", .{Hash.format(cloned, 6, 4, &display_buf)});
    try stdout.print("Are equal: {}\n", .{Hash.equals(original, cloned)});

    // Modifying clone doesn't affect original
    cloned[0] = 0xff;
    try stdout.print("\nAfter modifying clone:\n", .{});
    try stdout.print("Original first byte: 0x{x:0>2}\n", .{original[0]});
    try stdout.print("Cloned first byte:   0x{x:0>2}\n", .{cloned[0]});
    try stdout.print("Still equal: {}\n", .{Hash.equals(original, cloned)});

    // ============================================================
    // Slicing Hashes
    // ============================================================

    try stdout.print("\n--- Slicing Hashes ---\n\n", .{});

    const full_hash = Hash.keccak256String("transfer(address,uint256)");

    // Get function selector (first 4 bytes)
    const selector = full_hash[0..4];
    try stdout.print("Function selector: 0x", .{});
    for (selector) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    // Get last 4 bytes
    const suffix = full_hash[28..32];
    try stdout.print("Last 4 bytes: 0x", .{});
    for (suffix) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    // Get middle bytes
    const middle = full_hash[8..24];
    try stdout.print("Middle bytes (8-24): {d} bytes\n", .{middle.len});

    // Slice examples
    try stdout.print("\nSlice examples:\n", .{});

    try stdout.print("  First 8 bytes:     0x", .{});
    for (full_hash[0..8]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  Bytes 8-16:        0x", .{});
    for (full_hash[8..16]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    try stdout.print("  Last 8 bytes:      0x", .{});
    for (full_hash[24..32]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n", .{});

    // ============================================================
    // Working with Hash as Byte Array
    // ============================================================

    try stdout.print("\n--- Hash as Byte Array ---\n\n", .{});

    const hash1 = Hash.keccak256String("data1");

    // Direct byte access
    try stdout.print("First byte: 0x{x:0>2}\n", .{hash1[0]});
    try stdout.print("Last byte:  0x{x:0>2}\n", .{hash1[31]});

    // Iterate over bytes
    try stdout.print("\nFirst 8 bytes:\n", .{});
    for (hash1[0..8], 0..) |byte, i| {
        try stdout.print("  [{d}]: 0x{x:0>2}\n", .{ i, byte });
    }

    // Check if all zero
    var all_zero = true;
    for (hash1) |byte| {
        if (byte != 0) {
            all_zero = false;
            break;
        }
    }
    try stdout.print("\nAll bytes zero: {}\n", .{all_zero});

    // Check if has non-zero
    var has_nonzero = false;
    for (hash1) |byte| {
        if (byte != 0) {
            has_nonzero = true;
            break;
        }
    }
    try stdout.print("Has non-zero byte: {}\n", .{has_nonzero});

    // ============================================================
    // Combining Hashes
    // ============================================================

    try stdout.print("\n--- Combining Hashes ---\n\n", .{});

    const left = Hash.keccak256String("left");
    const right = Hash.keccak256String("right");

    // Concatenate two hashes
    var combined: [64]u8 = undefined;
    @memcpy(combined[0..32], &left);
    @memcpy(combined[32..64], &right);

    // Hash the combination
    const merkle_node = Hash.keccak256(&combined);

    try stdout.print("Left hash:   {s}\n", .{Hash.format(left, 6, 4, &display_buf)});
    try stdout.print("Right hash:  {s}\n", .{Hash.format(right, 6, 4, &display_buf)});
    try stdout.print("Merkle node: {s}\n", .{Hash.format(merkle_node, 6, 4, &display_buf)});

    // ============================================================
    // Different Representations
    // ============================================================

    try stdout.print("\n--- Different Representations ---\n\n", .{});

    const data_hash = Hash.keccak256String("data");

    // Hex string
    const hex_rep = Hash.toHex(data_hash, &hex_buf);
    try stdout.print("Hex: {s}\n", .{hex_rep});

    // Uppercase hex
    try stdout.print("Uppercase hex: 0x", .{});
    for (data_hash) |byte| {
        try stdout.print("{X:0>2}", .{byte});
    }
    try stdout.print("\n", .{});

    // Decimal bytes (first 8)
    try stdout.print("First 8 bytes (decimal): ", .{});
    for (data_hash[0..8]) |byte| {
        try stdout.print("{d} ", .{byte});
    }
    try stdout.print("\n", .{});

    // ============================================================
    // Context-Specific Formatting
    // ============================================================

    try stdout.print("\n--- Context-Specific Formatting ---\n\n", .{});

    const context_hash = Hash.random();

    // For logs
    try stdout.print("Log format: Hash: {s}\n", .{Hash.format(context_hash, 8, 8, &fmt_buf)});

    // For UI display (table)
    try stdout.print("\nUI table format:\n", .{});
    try stdout.print("┌──────────────────┬───────────────┐\n", .{});
    try stdout.print("│ Field            │ Value         │\n", .{});
    try stdout.print("├──────────────────┼───────────────┤\n", .{});
    try stdout.print("│ Transaction Hash │ {s} │\n", .{Hash.format(context_hash, 6, 4, &fmt_buf)});
    try stdout.print("└──────────────────┴───────────────┘\n", .{});

    // For sharing (full hash)
    try stdout.print("\nShare format: {s}\n", .{Hash.toHex(context_hash, &hex_buf)});

    // ============================================================
    // Byte Order
    // ============================================================

    try stdout.print("\n--- Byte Order ---\n\n", .{});

    const hash2 = Hash.fromHex("0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20");

    try stdout.print("Hash bytes in order:\n", .{});
    try stdout.print("  Hex: {s}\n", .{Hash.toHex(hash2, &hex_buf)});
    try stdout.print("  Bytes:\n", .{});
    for (hash2[0..8], 0..) |byte, i| {
        try stdout.print("    [{d}]: 0x{x:0>2}\n", .{ i, byte });
    }

    try stdout.print("\nNote: Hashes are stored in big-endian byte order\n", .{});
    try stdout.print("  First byte in hex: 0x01\n", .{});
    try stdout.print("  First byte in array: hash[0] = 0x{x:0>2}\n", .{hash2[0]});

    // ============================================================
    // Size Constants
    // ============================================================

    try stdout.print("\n--- Size Constants ---\n\n", .{});

    try stdout.print("Hash size: {d} bytes\n", .{Hash.SIZE});
    try stdout.print("Zero hash: {s}\n", .{Hash.format(Hash.ZERO, 6, 4, &display_buf)});

    try stdout.print("\n=== Example Complete ===\n\n", .{});
}
