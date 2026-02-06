const std = @import("std");
const crypto = @import("crypto");
const SHA256 = crypto.SHA256;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== HMAC-SHA256 ===\n\n", .{});

    // Example 1: Basic HMAC
    std.debug.print("1. Basic HMAC-SHA256\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const key1 = "secret-key";
    const message1 = "Hello, World!";
    const mac1 = try hmacSha256(key1, message1, allocator);

    std.debug.print("Key: {s}\n", .{key1});
    std.debug.print("Message: {s}\n", .{message1});
    std.debug.print("HMAC: 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(&mac1)});

    // Example 2: HMAC with different keys produces different MACs
    std.debug.print("2. Key Sensitivity\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const key2a = "key-a";
    const key2b = "key-b";
    const message2 = "same message";

    const mac2a = try hmacSha256(key2a, message2, allocator);
    const mac2b = try hmacSha256(key2b, message2, allocator);

    std.debug.print("Message: {s}\n", .{message2});
    std.debug.print("Key A:   {s}\n", .{key2a});
    std.debug.print("HMAC A:  0x{s}\n", .{std.fmt.fmtSliceHexLower(&mac2a)});
    std.debug.print("Key B:   {s}\n", .{key2b});
    std.debug.print("HMAC B:  0x{s}\n", .{std.fmt.fmtSliceHexLower(&mac2b)});
    std.debug.print("MACs are different: {}\n\n", .{!std.mem.eql(u8, &mac2a, &mac2b)});

    // Example 3: HMAC verification
    std.debug.print("3. HMAC Verification (Constant-Time Comparison)\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const auth_key = "authentication-key";
    const auth_message = "authenticated message";
    const valid_mac = try hmacSha256(auth_key, auth_message, allocator);

    const is_valid = verifyHmac(auth_message, auth_key, &valid_mac, allocator);
    std.debug.print("Valid MAC verification: {}\n", .{is_valid});

    // Tampered message
    const tampered_message = "tampered message";
    const tampered_valid = verifyHmac(tampered_message, auth_key, &valid_mac, allocator);
    std.debug.print("Tampered message verification: {}\n", .{tampered_valid});

    // Tampered MAC
    var tampered_mac = valid_mac;
    tampered_mac[0] ^= 0x01; // Flip one bit
    const tampered_mac_valid = verifyHmac(auth_message, auth_key, &tampered_mac, allocator);
    std.debug.print("Tampered MAC verification: {}\n\n", .{tampered_mac_valid});

    // Example 4: INSECURE vs SECURE message authentication
    std.debug.print("4. INSECURE vs SECURE Approaches\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const secret = "secret";
    const msg = "message";

    // INSECURE: Simple concatenation
    std.debug.print("❌ INSECURE: H(secret || message)\n", .{});
    var insecure = try allocator.alloc(u8, secret.len + msg.len);
    defer allocator.free(insecure);
    @memcpy(insecure[0..secret.len], secret);
    @memcpy(insecure[secret.len..], msg);
    const insecure_hash = SHA256.hash(insecure);
    std.debug.print("   Hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&insecure_hash)});
    std.debug.print("   Vulnerable to length extension attack!\n\n", .{});

    // SECURE: HMAC
    std.debug.print("✓ SECURE: HMAC-SHA256(secret, message)\n", .{});
    const secure_mac = try hmacSha256(secret, msg, allocator);
    std.debug.print("  HMAC: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&secure_mac)});
    std.debug.print("  Resistant to length extension attack!\n\n", .{});

    // Example 5: HMAC with long keys
    std.debug.print("5. Key Length Handling\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    // Short key
    const short_key = "short";
    const short_mac = try hmacSha256(short_key, message1, allocator);
    std.debug.print("Short key (5 bytes): {s}\n", .{short_key});
    std.debug.print("HMAC: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&short_mac)});
    std.debug.print("Key padded to 64 bytes internally\n\n", .{});

    // Long key
    const long_key = "a" ** 100;
    const long_mac = try hmacSha256(long_key, message1, allocator);
    std.debug.print("Long key (100 bytes): {s}...\n", .{long_key[0..20]});
    std.debug.print("HMAC: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&long_mac)});
    std.debug.print("Key hashed to 32 bytes, then padded to 64 bytes\n\n", .{});

    // Example 6: RFC 4231 Test Vector
    std.debug.print("6. RFC 4231 Test Vector\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    const rfc_key = [_]u8{0x0b} ** 20;
    const rfc_data = "Hi There";
    const rfc_mac = try hmacSha256(&rfc_key, rfc_data, allocator);

    std.debug.print("Key (20 bytes): ", .{});
    for (rfc_key[0..10]) |b| {
        std.debug.print("0x{x:0>2} ", .{b});
    }
    std.debug.print("...\n", .{});
    std.debug.print("Data: {s}\n", .{rfc_data});
    std.debug.print("HMAC: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&rfc_mac)});
    std.debug.print("Expected: 0xb0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7\n\n", .{});

    std.debug.print("=== HMAC-SHA256 Complete ===\n", .{});
}

// HMAC-SHA256 Implementation
fn hmacSha256(key: []const u8, message: []const u8, allocator: std.mem.Allocator) ![32]u8 {
    const block_size = SHA256.block_size; // 64 bytes

    // Step 1: Key derivation
    var derived_key_buf: [32]u8 = undefined;
    const derived_key: []const u8 = if (key.len > block_size) blk: {
        derived_key_buf = SHA256.hash(key);
        break :blk &derived_key_buf;
    } else key;

    // Pad key to block size
    var padded_key: [64]u8 = [_]u8{0} ** 64;
    @memcpy(padded_key[0..derived_key.len], derived_key);

    // Step 2: Create inner and outer padding
    var opad: [64]u8 = [_]u8{0x5c} ** 64;
    var ipad: [64]u8 = [_]u8{0x36} ** 64;

    for (0..block_size) |i| {
        opad[i] ^= padded_key[i];
        ipad[i] ^= padded_key[i];
    }

    // Step 3: Compute HMAC = H(opad || H(ipad || message))
    var inner_data = try allocator.alloc(u8, ipad.len + message.len);
    defer allocator.free(inner_data);
    @memcpy(inner_data[0..ipad.len], &ipad);
    @memcpy(inner_data[ipad.len..], message);
    const inner_hash = SHA256.hash(inner_data);

    var outer_data = try allocator.alloc(u8, opad.len + inner_hash.len);
    defer allocator.free(outer_data);
    @memcpy(outer_data[0..opad.len], &opad);
    @memcpy(outer_data[opad.len..], &inner_hash);

    return SHA256.hash(outer_data);
}

// Constant-time HMAC verification
fn verifyHmac(message: []const u8, key: []const u8, provided_mac: []const u8, allocator: std.mem.Allocator) bool {
    const computed_mac = hmacSha256(key, message, allocator) catch return false;

    if (provided_mac.len != computed_mac.len) {
        return false;
    }

    var result: u8 = 0;
    for (provided_mac, 0..) |b, i| {
        result |= b ^ computed_mac[i];
    }

    return result == 0;
}
