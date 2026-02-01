const std = @import("std");
const primitives = @import("primitives");
const Hash = primitives.hash.Hash;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const a = gpa.allocator();

    std.debug.print("\n=== Basic Hash Usage ===\n\n", .{});

    // ============================================================
    // 1. Creating Hashes
    // ============================================================

    std.debug.print("1. Creating Hashes\n\n", .{});

    // From hex string (most common)
    const hash1 = try Hash.fromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    const hex1 = Hash.toHex(hash1);
    std.debug.print("From hex: 0x{s}...{s}\n", .{ hex1[2..8], hex1[hex1.len - 4 ..] });

    // From hex using slice
    const hash2 = try Hash.fromHex("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
    const hex2 = Hash.toHex(hash2);
    std.debug.print("From fromHex(): 0x{s}...{s}\n", .{ hex2[2..8], hex2[hex2.len - 4 ..] });

    // From bytes
    var bytes: [32]u8 = [_]u8{0} ** 32;
    bytes[0] = 0x12;
    bytes[1] = 0x34;
    bytes[31] = 0xff;
    const hash3 = Hash.fromBytes(&bytes);
    const hex3 = Hash.toHex(hash3);
    std.debug.print("From bytes: 0x{s}...{s}\n", .{ hex3[2..8], hex3[hex3.len - 4 ..] });

    // Random hash (cryptographically secure)
    const random_hash = Hash.random();
    const hex_random = Hash.toHex(random_hash);
    std.debug.print("Random hash: 0x{s}...{s}\n\n", .{ hex_random[2..8], hex_random[hex_random.len - 4 ..] });

    // ============================================================
    // 2. Format Conversions
    // ============================================================

    std.debug.print("2. Format Conversions\n\n", .{});

    const hash = try Hash.fromHex("0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8");

    // Convert to hex string
    const to_hex = Hash.toHex(hash);
    std.debug.print("toHex(): {s}\n", .{&to_hex});

    // Convert to bytes (returns copy)
    const hash_bytes = Hash.toBytes(hash);
    std.debug.print("toBytes(): [32]u8\n", .{});

    // Display format (shortened for UIs)
    std.debug.print("format(): 0x{s}...{s}\n", .{ to_hex[2..8], to_hex[to_hex.len - 4 ..] }); // 6 prefix + 4 suffix
    std.debug.print("format(8,6): 0x{s}...{s}\n\n", .{ to_hex[2..10], to_hex[to_hex.len - 6 ..] }); // 8 prefix + 6 suffix

    // ============================================================
    // 3. Validation
    // ============================================================

    std.debug.print("3. Validation\n\n", .{});

    // Valid hex strings
    const valid_hex1 = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const valid_hex2 = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"; // No 0x prefix
    const invalid_hex = "0x1234"; // Too short

    std.debug.print("Valid (with 0x):    {}\n", .{Hash.isValid(valid_hex1)});
    std.debug.print("Valid (without 0x): {}\n", .{Hash.isValid(valid_hex2)});
    std.debug.print("Invalid (too short): {}\n", .{Hash.isValid(invalid_hex)});

    // Safe parsing with validation
    std.debug.print("\nSafe parsing:\n", .{});
    if (Hash.isValid(valid_hex1)) {
        _ = try Hash.fromHex(valid_hex1);
        std.debug.print("  ✓ Parsed valid hash\n", .{});
    }
    if (!Hash.isValid(invalid_hex)) {
        std.debug.print("  ✗ Invalid format: {s}\n", .{invalid_hex});
    }
    std.debug.print("\n", .{});

    // ============================================================
    // 4. Type Safety (Zig Compile-Time)
    // ============================================================

    std.debug.print("4. Type Safety\n\n", .{});

    // In Zig, Hash is [32]u8 - type checked at compile time
    const typed_hash = try Hash.fromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    const typed_hex = Hash.toHex(typed_hash);
    std.debug.print("Hash type: [32]u8\n", .{});
    std.debug.print("Hash value: 0x{s}...{s}\n", .{ typed_hex[2..8], typed_hex[typed_hex.len - 4 ..] });

    // Wrong length would cause compile error
    // var wrong_len: [20]u8 = undefined; // Different type
    // _ = Hash.fromBytes(&wrong_len); // Compile error!

    std.debug.print("(Zig provides compile-time type safety)\n\n", .{});

    // ============================================================
    // 5. Basic Comparisons
    // ============================================================

    std.debug.print("5. Basic Comparisons\n\n", .{});

    // Create test hashes
    const hash_a = try Hash.keccak256String("hello");
    const hash_b = try Hash.keccak256String("hello");
    const hash_c = try Hash.keccak256String("world");
    const zero_hash = Hash.fromBytes(&([_]u8{0} ** 32));

    const hex_a = Hash.toHex(hash_a);
    const hex_b = Hash.toHex(hash_b);
    const hex_c = Hash.toHex(hash_c);

    std.debug.print("Hash A: 0x{s}...{s}\n", .{ hex_a[2..8], hex_a[hex_a.len - 4 ..] });
    std.debug.print("Hash B: 0x{s}...{s}\n", .{ hex_b[2..8], hex_b[hex_b.len - 4 ..] });
    std.debug.print("Hash C: 0x{s}...{s}\n", .{ hex_c[2..8], hex_c[hex_c.len - 4 ..] });

    // Equality (constant-time comparison)
    std.debug.print("\nA equals B: {}\n", .{Hash.equals(hash_a, hash_b)}); // true - same content
    std.debug.print("A equals C: {}\n", .{Hash.equals(hash_a, hash_c)}); // false - different content

    // Zero check
    const hex_zero = Hash.toHex(zero_hash);
    std.debug.print("\nZero hash: 0x{s}...{s}\n", .{ hex_zero[2..8], hex_zero[hex_zero.len - 4 ..] });
    std.debug.print("Zero check: {}\n", .{Hash.isZero(zero_hash)}); // true
    std.debug.print("A is zero: {}\n", .{Hash.isZero(hash_a)}); // false

    // Compare with ZERO constant
    std.debug.print("\nEquals ZERO constant: {}\n\n", .{Hash.equals(zero_hash, Hash.ZERO)});

    // ============================================================
    // 6. Working with Hash as [32]u8
    // ============================================================

    std.debug.print("6. Hash as [32]u8\n\n", .{});

    const hash4 = try Hash.keccak256String("example");

    // Direct byte access
    std.debug.print("Length: {} bytes\n", .{hash4.len});
    std.debug.print("First byte: 0x{x:0>2}\n", .{hash4[0]});
    std.debug.print("Last byte: 0x{x:0>2}\n", .{hash4[31]});

    // Iterate over bytes
    std.debug.print("\nFirst 8 bytes:\n", .{});
    for (hash4[0..8], 0..) |byte, i| {
        std.debug.print("  [{}]: 0x{x:0>2}\n", .{ i, byte });
    }
    std.debug.print("\n", .{});

    // ============================================================
    // 7. Cloning and Slicing
    // ============================================================

    std.debug.print("7. Cloning and Slicing\n\n", .{});

    const original = try Hash.keccak256String("data");

    // Clone creates independent copy
    var cloned = original;
    const hex_orig = Hash.toHex(original);
    const hex_clone = Hash.toHex(cloned);
    std.debug.print("Original: 0x{s}...{s}\n", .{ hex_orig[2..8], hex_orig[hex_orig.len - 4 ..] });
    std.debug.print("Cloned:   0x{s}...{s}\n", .{ hex_clone[2..8], hex_clone[hex_clone.len - 4 ..] });
    std.debug.print("Equal:    {}\n", .{Hash.equals(original, cloned)});

    // Modifying clone doesn't affect original
    cloned[0] = 0xff;
    std.debug.print("\nAfter modifying clone:\n", .{});
    std.debug.print("Equal:    {}\n", .{Hash.equals(original, cloned)}); // false

    // Slicing (get portion of hash)
    const function_signature = try Hash.keccak256String("transfer(address,uint256)");
    const selector = function_signature[0..4];
    std.debug.print("\nFunction selector: 0x{x:0>2}{x:0>2}{x:0>2}{x:0>2}\n\n", .{ selector[0], selector[1], selector[2], selector[3] });

    // ============================================================
    // 8. Constants
    // ============================================================

    std.debug.print("8. Hash Constants\n\n", .{});

    std.debug.print("Hash.SIZE: {} bytes\n", .{Hash.SIZE});
    const hex_zero_const = Hash.toHex(Hash.ZERO);
    std.debug.print("Hash.ZERO: 0x{s}...{s}\n", .{ hex_zero_const[2..8], hex_zero_const[hex_zero_const.len - 4 ..] });

    // Using constants for validation
    var buffer: [Hash.SIZE]u8 = undefined;
    std.debug.print("\nBuffer size: {} (matches Hash.SIZE)\n", .{buffer.len});

    // Zero hash comparison
    const test_hash = Hash.fromBytes(&([_]u8{0} ** 32));
    std.debug.print("Is zero: {}\n\n", .{Hash.equals(test_hash, Hash.ZERO)});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
