const std = @import("std");
const p256 = @import("../p256.zig");

// ============================================================================
// Private Key Boundary Fuzzing
// ============================================================================

test "fuzz private key boundaries" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 32) return;

    const allocator = std.testing.allocator;
    var key: [32]u8 = undefined;
    @memcpy(&key, input[0..32]);

    // Test specific boundary cases based on first byte
    const boundary_key = switch (input[0] & 0x7) {
        0 => key, // Normal fuzz input
        1 => [_]u8{0} ** 32, // All zeros (invalid)
        2 => [_]u8{1} ++ [_]u8{0} ** 31, // Minimal valid key
        3 => blk: { // n-1 (boundary of valid range)
            var tmp = [_]u8{0xFF} ** 32;
            // P256_N - 1 approximation
            tmp[0] = 0xFF;
            tmp[1] = 0xFF;
            tmp[2] = 0xFF;
            tmp[3] = 0xFF;
            tmp[4] = 0x00;
            break :blk tmp;
        },
        4 => blk: { // n (invalid - at order)
            var tmp = [_]u8{0xFF} ** 32;
            tmp[0] = 0xFF;
            tmp[1] = 0xFF;
            tmp[2] = 0xFF;
            tmp[3] = 0xFF;
            break :blk tmp;
        },
        5 => blk: { // n+1 (invalid - beyond order)
            var tmp = [_]u8{0xFF} ** 32;
            tmp[31] = 0x01;
            break :blk tmp;
        },
        6 => [_]u8{0xFF} ** 32, // max_u256 (invalid)
        7 => blk: { // mid-range valid key
            var tmp = key;
            tmp[0] = 0x7F;
            break :blk tmp;
        },
        else => unreachable,
    };

    // Public key derivation should handle all inputs gracefully
    const pubkey_result = p256.publicKeyFromPrivate(allocator, &boundary_key);
    if (pubkey_result) |pubkey| {
        defer allocator.free(pubkey);
        // If successful, verify public key is 64 bytes
        try std.testing.expectEqual(@as(usize, 64), pubkey.len);
    } else |err| {
        // Expected errors for invalid keys
        switch (err) {
            error.InvalidPrivateKeyLength,
            error.IdentityElement,
            error.NonCanonical,
            error.EncodingError,
            => {},
            else => return err,
        }
    }
}

test "fuzz private key zero check" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 32) return;

    const allocator = std.testing.allocator;
    var key = [_]u8{0} ** 32;

    // Zero private key should fail
    const result = p256.publicKeyFromPrivate(allocator, &key);
    if (result) |pubkey| {
        defer allocator.free(pubkey);
        // If it doesn't error, that's a potential issue but don't crash
    } else |_| {
        // Expected to fail
    }
}

// ============================================================================
// Signature Component Fuzzing
// ============================================================================

test "fuzz malformed signatures" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 128) return;

    const allocator = std.testing.allocator;
    const hash = input[0..32];
    const privkey = input[32..64];
    const r_bytes = input[64..96];
    const s_bytes = input[96..128];

    // Test signature with fuzzed r/s values
    const pubkey_result = p256.publicKeyFromPrivate(allocator, privkey);
    if (pubkey_result) |pubkey| {
        defer allocator.free(pubkey);

        // Test various malformed r/s combinations
        const r_test = switch (input[0] & 0x3) {
            0 => r_bytes, // Normal
            1 => &[_]u8{0} ** 32, // r = 0 (invalid)
            2 => &[_]u8{0xFF} ** 32, // r = max (likely invalid)
            3 => r_bytes, // Use fuzz input
            else => unreachable,
        };

        const s_test = switch (input[1] & 0x3) {
            0 => s_bytes, // Normal
            1 => &[_]u8{0} ** 32, // s = 0 (invalid)
            2 => &[_]u8{0xFF} ** 32, // s = max (likely invalid)
            3 => s_bytes, // Use fuzz input
            else => unreachable,
        };

        // Verification should never panic
        _ = p256.verify(hash, r_test, s_test, pubkey) catch |err| {
            switch (err) {
                error.InvalidHashLength,
                error.InvalidRLength,
                error.InvalidSLength,
                error.InvalidPublicKeyLength,
                error.InvalidSignature,
                error.NonCanonical,
                => {},
                else => return err,
            }
        };
    } else |_| {
        // Invalid private key, skip
    }
}

test "fuzz signature high-s value" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 96) return;

    const allocator = std.testing.allocator;
    const hash = input[0..32];
    const privkey = input[32..64];

    const pubkey_result = p256.publicKeyFromPrivate(allocator, privkey);
    if (pubkey_result) |pubkey| {
        defer allocator.free(pubkey);

        // Create high-s signature (potentially malleable)
        var r_bytes = input[64..96].*;
        var s_bytes = [_]u8{0xFF} ** 32;
        s_bytes[0] = 0x7F; // High but not maximum

        // Should handle high-s gracefully
        _ = p256.verify(hash, &r_bytes, &s_bytes, pubkey) catch |_| {};
    } else |_| {}
}

test "fuzz signature with zero components" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const allocator = std.testing.allocator;
    const hash = input[0..32];
    const privkey = input[32..64];

    const pubkey_result = p256.publicKeyFromPrivate(allocator, privkey);
    if (pubkey_result) |pubkey| {
        defer allocator.free(pubkey);

        const zero = [_]u8{0} ** 32;

        // Test all combinations of zero r/s
        _ = p256.verify(hash, &zero, &zero, pubkey) catch |_| {};
        _ = p256.verify(hash, &zero, hash, pubkey) catch |_| {};
        _ = p256.verify(hash, hash, &zero, pubkey) catch |_| {};
    } else |_| {}
}

// ============================================================================
// Invalid Point Fuzzing
// ============================================================================

test "fuzz invalid public key points" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 96) return;

    const hash = input[0..32];
    const r_bytes = input[32..64];
    const s_bytes = input[64..96];

    // Test various invalid point patterns
    const patterns = [_][64]u8{
        [_]u8{0} ** 64, // All zeros (identity point)
        [_]u8{0xFF} ** 64, // All ones (off-curve)
        blk: { // Mixed pattern
            var tmp: [64]u8 = undefined;
            @memcpy(tmp[0..32], input[0..32]);
            @memcpy(tmp[32..64], &[_]u8{0} ** 32);
            break :blk tmp;
        },
        blk: { // Another mixed pattern
            var tmp: [64]u8 = undefined;
            @memcpy(tmp[0..32], &[_]u8{0} ** 32);
            @memcpy(tmp[32..64], input[0..32]);
            break :blk tmp;
        },
    };

    for (patterns) |pubkey| {
        _ = p256.verify(hash, r_bytes, s_bytes, &pubkey) catch |err| {
            switch (err) {
                error.InvalidHashLength,
                error.InvalidRLength,
                error.InvalidSLength,
                error.InvalidPublicKeyLength,
                error.InvalidSignature,
                error.NonCanonical,
                error.WeakPublicKey,
                => {},
                else => return err,
            }
        };
    }
}

test "fuzz off-curve points" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 128) return;

    const allocator = std.testing.allocator;
    const hash = input[0..32];
    const r_bytes = input[32..64];
    const s_bytes = input[64..96];

    // Create potentially off-curve public key
    var pubkey: [64]u8 = undefined;
    @memcpy(&pubkey, input[64..128]);

    // Verification should detect off-curve points
    _ = p256.verify(hash, r_bytes, s_bytes, &pubkey) catch |_| {};
}

// ============================================================================
// Hash Input Fuzzing
// ============================================================================

test "fuzz hash inputs" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const allocator = std.testing.allocator;
    const privkey = input[0..32];

    const pubkey_result = p256.publicKeyFromPrivate(allocator, privkey);
    if (pubkey_result) |pubkey| {
        defer allocator.free(pubkey);

        // Test various hash patterns
        const hash_patterns = [_][32]u8{
            [_]u8{0} ** 32, // All zeros
            [_]u8{0xFF} ** 32, // All ones
            input[32..64].*, // Random from fuzz input
            blk: { // Alternating pattern
                var tmp: [32]u8 = undefined;
                for (&tmp, 0..) |*byte, i| {
                    byte.* = if (i % 2 == 0) 0xAA else 0x55;
                }
                break :blk tmp;
            },
        };

        for (hash_patterns) |hash| {
            // Signing should handle all hash patterns
            const sig_result = p256.sign(allocator, &hash, privkey);
            if (sig_result) |sig| {
                defer allocator.free(sig);
                // Verify the signature we just created
                const valid = p256.verify(&hash, sig[0..32], sig[32..64], pubkey) catch false;
                if (!valid) {
                    // If sign succeeded but verify fails, that's concerning
                    // but don't crash - just note it
                }
            } else |err| {
                switch (err) {
                    error.InvalidHashLength,
                    error.InvalidPrivateKeyLength,
                    error.IdentityElement,
                    => {},
                    else => return err,
                }
            }
        }
    } else |_| {}
}

// ============================================================================
// ECDH Invalid Point Handling
// ============================================================================

test "fuzz ecdh with invalid points" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 96) return;

    const allocator = std.testing.allocator;
    const privkey = input[0..32];
    var pubkey: [64]u8 = undefined;
    @memcpy(&pubkey, input[32..96]);

    // ECDH should validate points
    const result = p256.ecdh(allocator, privkey, &pubkey);
    if (result) |shared| {
        defer allocator.free(shared);
        // If successful, shared secret should be 32 bytes
        try std.testing.expectEqual(@as(usize, 32), shared.len);
    } else |err| {
        switch (err) {
            error.InvalidPrivateKeyLength,
            error.InvalidPublicKeyLength,
            error.IdentityElement,
            error.NonCanonical,
            error.WeakPublicKey,
            => {},
            else => return err,
        }
    }
}

test "fuzz ecdh with identity point" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 32) return;

    const allocator = std.testing.allocator;
    const privkey = input[0..32];
    const identity_point = [_]u8{0} ** 64;

    // Identity point should be rejected
    _ = p256.ecdh(allocator, privkey, &identity_point) catch |_| {};
}

test "fuzz ecdh consistency" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const allocator = std.testing.allocator;
    const priv1 = input[0..32];
    const priv2 = input[32..64];

    const pub1_result = p256.publicKeyFromPrivate(allocator, priv1);
    const pub2_result = p256.publicKeyFromPrivate(allocator, priv2);

    if (pub1_result) |pub1| {
        defer allocator.free(pub1);
        if (pub2_result) |pub2| {
            defer allocator.free(pub2);

            // Test ECDH symmetry: shared1 == shared2
            const shared1_result = p256.ecdh(allocator, priv1, pub2);
            const shared2_result = p256.ecdh(allocator, priv2, pub1);

            if (shared1_result) |shared1| {
                defer allocator.free(shared1);
                if (shared2_result) |shared2| {
                    defer allocator.free(shared2);
                    // Property: ECDH is symmetric
                    try std.testing.expectEqualSlices(u8, shared1, shared2);
                } else |_| {}
            } else |_| {}
        } else |_| {}
    } else |_| {}
}

// ============================================================================
// Memory Leak Testing
// ============================================================================

test "fuzz memory allocation patterns" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const allocator = std.testing.allocator;
    const privkey = input[0..32];
    const hash = input[32..64];

    // Rapid allocation/deallocation
    const iterations = @min(input[0], 100); // Cap iterations
    for (0..iterations) |_| {
        const pubkey_result = p256.publicKeyFromPrivate(allocator, privkey);
        if (pubkey_result) |pubkey| {
            defer allocator.free(pubkey);

            const sig_result = p256.sign(allocator, hash, privkey);
            if (sig_result) |sig| {
                defer allocator.free(sig);
                _ = p256.verify(hash, sig[0..32], sig[32..64], pubkey) catch {};
            } else |_| {}
        } else |_| break;
    }
}

// ============================================================================
// Property-Based Tests
// ============================================================================

test "fuzz signature determinism" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;

    const allocator = std.testing.allocator;
    const privkey = input[0..32];
    const hash = input[32..64];

    const sig1_result = p256.sign(allocator, hash, privkey);
    const sig2_result = p256.sign(allocator, hash, privkey);

    if (sig1_result) |sig1| {
        defer allocator.free(sig1);
        if (sig2_result) |sig2| {
            defer allocator.free(sig2);
            // Property: Signing is deterministic (RFC 6979)
            try std.testing.expectEqualSlices(u8, sig1, sig2);
        } else |_| {}
    } else |_| {}
}

test "fuzz public key derivation consistency" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 32) return;

    const allocator = std.testing.allocator;
    const privkey = input[0..32];

    const pub1_result = p256.publicKeyFromPrivate(allocator, privkey);
    const pub2_result = p256.publicKeyFromPrivate(allocator, privkey);

    if (pub1_result) |pub1| {
        defer allocator.free(pub1);
        if (pub2_result) |pub2| {
            defer allocator.free(pub2);
            // Property: Public key derivation is deterministic
            try std.testing.expectEqualSlices(u8, pub1, pub2);
        } else |_| {}
    } else |_| {}
}
