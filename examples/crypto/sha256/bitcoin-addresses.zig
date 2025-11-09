const std = @import("std");
const crypto = @import("crypto");
const SHA256 = crypto.SHA256;
const Ripemd160 = crypto.Ripemd160;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Bitcoin P2PKH Address Derivation ===\n\n", .{});

    // Example 1: Bitcoin genesis block public key
    std.debug.print("Example 1: Bitcoin Genesis Block Coinbase\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    // This is the public key from Bitcoin's genesis block
    const genesis_public_key = [_]u8{
        0x04, 0x67, 0x8a, 0xfd, 0xb0, 0xfe, 0x55, 0x48,
        0x27, 0x19, 0x67, 0xf1, 0xa6, 0x71, 0x30, 0xb7,
        0x10, 0x5c, 0xd6, 0xa8, 0x28, 0xe0, 0x39, 0x09,
        0xa6, 0x79, 0x62, 0xe0, 0xea, 0x1f, 0x61, 0xde,
        0xb6, 0x49, 0xf6, 0xbc, 0x3f, 0x4c, 0xef, 0x38,
        0xc4, 0xf3, 0x55, 0x04, 0xe5, 0x1e, 0xc1, 0x12,
        0xde, 0x5c, 0x38, 0x4d, 0xf7, 0xba, 0x0b, 0x8d,
        0x57, 0x8a, 0x4c, 0x70, 0x2b, 0x6b, 0xf1, 0x1d,
        0x5f,
    };

    try publicKeyToAddress(&genesis_public_key, allocator);
    std.debug.print("Expected: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n\n", .{});

    // Example 2: Compressed public key
    std.debug.print("Example 2: Compressed Public Key\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const compressed_pub_key = [_]u8{
        0x02, 0x50, 0x86, 0x3a, 0xd6, 0x4a, 0x87, 0xae,
        0x8a, 0x2f, 0xe8, 0x3c, 0x1a, 0xf1, 0xa8, 0x40,
        0x3c, 0xb5, 0x3f, 0x53, 0xe4, 0x86, 0xd8, 0x51,
        0x1d, 0xad, 0x8a, 0x04, 0x88, 0x7e, 0x5b, 0x23,
        0x52,
    };

    try publicKeyToAddress(&compressed_pub_key, allocator);
    std.debug.print("\n", .{});

    // Example 3: Verify checksum validation
    std.debug.print("Example 3: Checksum Validation\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});
    std.debug.print("Bitcoin uses double SHA-256 for checksums to detect errors\n\n", .{});

    const test_data = [_]u8{ 0x00, 0x01, 0x02, 0x03, 0x04 };
    const checksum1 = doubleSha256(&test_data);
    std.debug.print("Data: ", .{});
    for (test_data) |b| {
        std.debug.print("{x:0>2} ", .{b});
    }
    std.debug.print("\n", .{});
    std.debug.print("Double SHA-256 checksum: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&checksum1)});

    // Change one bit
    const test_data2 = [_]u8{ 0x00, 0x01, 0x02, 0x03, 0x05 }; // Last byte changed
    const checksum2 = doubleSha256(&test_data2);
    std.debug.print("\nData (modified): ", .{});
    for (test_data2) |b| {
        std.debug.print("{x:0>2} ", .{b});
    }
    std.debug.print("\n", .{});
    std.debug.print("Double SHA-256 checksum: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&checksum2)});
    std.debug.print("Checksums match: {}\n\n", .{std.mem.eql(u8, &checksum1, &checksum2)});

    std.debug.print("=== Bitcoin Address Derivation Complete ===\n", .{});
}

// Helper: Double SHA-256 (used in Bitcoin)
fn doubleSha256(data: []const u8) [32]u8 {
    const first = SHA256.hash(data);
    return SHA256.hash(&first);
}

// Bitcoin P2PKH address derivation
fn publicKeyToAddress(public_key: []const u8, allocator: std.mem.Allocator) !void {
    std.debug.print("Step 1: SHA-256 hash of public key\n", .{});
    const sha256_hash = SHA256.hash(public_key);
    std.debug.print("  Public key (first 16 bytes): ", .{});
    for (public_key[0..@min(16, public_key.len)]) |b| {
        std.debug.print("{x:0>2} ", .{b});
    }
    std.debug.print("\n", .{});
    std.debug.print("  SHA-256: 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(&sha256_hash)});

    std.debug.print("Step 2: RIPEMD-160 hash of SHA-256 hash\n", .{});
    const ripemd160_hash = Ripemd160.hash(&sha256_hash);
    std.debug.print("  RIPEMD-160: {s}\n\n", .{std.fmt.fmtSliceHexLower(&ripemd160_hash)});

    std.debug.print("Step 3: Add version byte (0x00 for mainnet)\n", .{});
    var versioned_payload: [21]u8 = undefined;
    versioned_payload[0] = 0x00; // Mainnet P2PKH
    @memcpy(versioned_payload[1..], &ripemd160_hash);
    std.debug.print("  Versioned payload: {s}\n\n", .{std.fmt.fmtSliceHexLower(&versioned_payload)});

    std.debug.print("Step 4: Double SHA-256 for checksum\n", .{});
    const checksum = doubleSha256(&versioned_payload);
    std.debug.print("  Checksum (first 4 bytes): ", .{});
    for (checksum[0..4]) |b| {
        std.debug.print("{x:0>2}", .{b});
    }
    std.debug.print("\n\n", .{});

    std.debug.print("Step 5: Append checksum and Base58 encode\n", .{});
    var address_bytes: [25]u8 = undefined;
    @memcpy(address_bytes[0..21], &versioned_payload);
    @memcpy(address_bytes[21..25], checksum[0..4]);

    const address = try base58Encode(&address_bytes, allocator);
    defer allocator.free(address);
    std.debug.print("  Address: {s}\n", .{address});
}

// Simple Base58 encoding (Bitcoin alphabet)
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

fn base58Encode(bytes: []const u8, allocator: std.mem.Allocator) ![]u8 {
    var digits = std.ArrayList(u8){};
    defer digits.deinit(allocator);
    try digits.append(allocator, 0);

    for (bytes) |byte| {
        var carry: u32 = byte;
        var j: usize = 0;
        while (j < digits.items.len) : (j += 1) {
            carry += @as(u32, digits.items[j]) << 8;
            digits.items[j] = @intCast(carry % 58);
            carry = carry / 58;
        }
        while (carry > 0) {
            try digits.append(allocator, @intCast(carry % 58));
            carry = carry / 58;
        }
    }

    // Convert leading zeros
    var result = std.ArrayList(u8){};
    defer result.deinit(allocator);

    for (bytes) |byte| {
        if (byte != 0) break;
        try result.append(allocator, '1');
    }

    // Append base58 encoded value
    var i: usize = digits.items.len;
    while (i > 0) {
        i -= 1;
        try result.append(allocator, BASE58_ALPHABET[digits.items[i]]);
    }

    return result.toOwnedSlice(allocator);
}
