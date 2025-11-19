const std = @import("std");
const primitives = @import("primitives");

/// Signature algorithm types
pub const Algorithm = enum {
    secp256k1,
    p256,
    ed25519,
};

/// Unified signature structure supporting multiple algorithms
///
/// For ECDSA (secp256k1, p256): r (32 bytes) + s (32 bytes) + optional v (recovery ID)
/// For Ed25519: signature (64 bytes)
///
/// Layout:
/// - r: [32]u8 (ECDSA) or first 32 bytes of Ed25519 signature
/// - s: [32]u8 (ECDSA) or last 32 bytes of Ed25519 signature
/// - v: ?u8 (optional recovery ID for secp256k1, 27 or 28)
/// - algorithm: Algorithm tag
pub const Signature = struct {
    r: [32]u8,
    s: [32]u8,
    v: ?u8,
    algorithm: Algorithm,

    const Self = @This();

    // Signature size constants
    pub const ECDSA_SIZE = 64;
    pub const ECDSA_WITH_V_SIZE = 65;
    pub const ED25519_SIZE = 64;
    pub const COMPONENT_SIZE = 32;
    pub const RECOVERY_ID_MIN = 27;
    pub const RECOVERY_ID_MAX = 28;

    // secp256k1 curve order / 2 for canonical check
    const SECP256K1_N_DIV_2: [32]u8 = .{
        0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0x5d, 0x57, 0x6e, 0x73, 0x57, 0xa4, 0x50, 0x1d,
        0xdf, 0xe9, 0x2f, 0x46, 0x68, 0x1b, 0x20, 0xa0,
    };

    // secp256k1 curve order for normalization
    const SECP256K1_N: [32]u8 = .{
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe,
        0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
        0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
    };

    // P-256 curve order / 2 for canonical check
    const P256_N_DIV_2: [32]u8 = .{
        0x7f, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
        0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
        0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51,
    };

    // P-256 curve order for normalization
    const P256_N: [32]u8 = .{
        0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
        0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51,
    };

    /// Create signature from secp256k1 ECDSA components
    pub fn fromSecp256k1(r: [32]u8, s: [32]u8, v: ?u8) Self {
        return Self{
            .r = r,
            .s = s,
            .v = v,
            .algorithm = .secp256k1,
        };
    }

    /// Create signature from P-256 ECDSA components
    pub fn fromP256(r: [32]u8, s: [32]u8) Self {
        return Self{
            .r = r,
            .s = s,
            .v = null,
            .algorithm = .p256,
        };
    }

    /// Create signature from Ed25519 64-byte signature
    pub fn fromEd25519(sig_bytes: [64]u8) Self {
        var r: [32]u8 = undefined;
        var s: [32]u8 = undefined;
        @memcpy(&r, sig_bytes[0..32]);
        @memcpy(&s, sig_bytes[32..64]);
        return Self{
            .r = r,
            .s = s,
            .v = null,
            .algorithm = .ed25519,
        };
    }

    /// Create signature from 64-byte compact format (r || s)
    /// Algorithm must be specified
    pub fn fromCompact(bytes: [64]u8, algorithm: Algorithm) Self {
        var r: [32]u8 = undefined;
        var s: [32]u8 = undefined;
        @memcpy(&r, bytes[0..32]);
        @memcpy(&s, bytes[32..64]);
        return Self{
            .r = r,
            .s = s,
            .v = null,
            .algorithm = algorithm,
        };
    }

    /// Decode signature from DER format
    /// Returns error if DER encoding is invalid
    pub fn fromDER(allocator: std.mem.Allocator, der_bytes: []const u8, algorithm: Algorithm) !Self {
        if (algorithm == .ed25519) {
            return error.InvalidAlgorithm; // DER only for ECDSA
        }

        var pos: usize = 0;

        // Check SEQUENCE tag (0x30)
        if (pos >= der_bytes.len or der_bytes[pos] != 0x30) {
            return error.InvalidDERFormat;
        }
        pos += 1;

        // Read SEQUENCE length
        const seq_len = try readDERLength(der_bytes, &pos);
        if (pos + seq_len != der_bytes.len) {
            return error.InvalidDERFormat;
        }

        // Read r INTEGER
        const r = try readDERInteger(der_bytes, &pos);
        defer allocator.free(r);

        // Read s INTEGER
        const s = try readDERInteger(der_bytes, &pos);
        defer allocator.free(s);

        // Convert to 32-byte arrays
        var r_bytes: [32]u8 = [_]u8{0} ** 32;
        var s_bytes: [32]u8 = [_]u8{0} ** 32;

        const r_offset = if (r.len <= 32) 32 - r.len else 0;
        const s_offset = if (s.len <= 32) 32 - s.len else 0;

        if (r.len > 32 or s.len > 32) {
            return error.InvalidDERFormat;
        }

        @memcpy(r_bytes[r_offset..], r);
        @memcpy(s_bytes[s_offset..], s);

        return Self{
            .r = r_bytes,
            .s = s_bytes,
            .v = null,
            .algorithm = algorithm,
        };
    }

    /// Convert signature to bytes (r || s || v if present)
    pub fn toBytes(self: Self, allocator: std.mem.Allocator) ![]u8 {
        const has_v = self.v != null and self.algorithm == .secp256k1;
        const len = if (has_v) ECDSA_WITH_V_SIZE else ECDSA_SIZE;

        const bytes = try allocator.alloc(u8, len);
        @memcpy(bytes[0..32], &self.r);
        @memcpy(bytes[32..64], &self.s);
        if (has_v) {
            bytes[64] = self.v.?;
        }

        return bytes;
    }

    /// Convert signature to compact format (r || s)
    pub fn toCompact(self: Self) [64]u8 {
        var result: [64]u8 = undefined;
        @memcpy(result[0..32], &self.r);
        @memcpy(result[32..64], &self.s);
        return result;
    }

    /// Encode signature to DER format
    pub fn toDER(self: Self, allocator: std.mem.Allocator) ![]u8 {
        if (self.algorithm == .ed25519) {
            return error.InvalidAlgorithm; // DER only for ECDSA
        }

        // Encode r and s as DER INTEGERs
        const r_der = try encodeDERInteger(allocator, &self.r);
        defer allocator.free(r_der);

        const s_der = try encodeDERInteger(allocator, &self.s);
        defer allocator.free(s_der);

        // Calculate total length: SEQUENCE tag (1) + length bytes + r + s
        const content_len = r_der.len + s_der.len;
        const len_bytes = try encodeDERLength(allocator, content_len);
        defer allocator.free(len_bytes);

        const total_len = 1 + len_bytes.len + content_len;

        // Build DER structure
        const result = try allocator.alloc(u8, total_len);
        result[0] = 0x30; // SEQUENCE tag
        @memcpy(result[1 .. 1 + len_bytes.len], len_bytes);
        @memcpy(result[1 + len_bytes.len .. 1 + len_bytes.len + r_der.len], r_der);
        @memcpy(result[1 + len_bytes.len + r_der.len ..], s_der);

        return result;
    }

    /// Get r component
    pub fn getR(self: Self) [32]u8 {
        return self.r;
    }

    /// Get s component
    pub fn getS(self: Self) [32]u8 {
        return self.s;
    }

    /// Get v recovery ID (if present)
    pub fn getV(self: Self) ?u8 {
        return self.v;
    }

    /// Get algorithm
    pub fn getAlgorithm(self: Self) Algorithm {
        return self.algorithm;
    }

    /// Check if ECDSA signature is canonical (s <= curve_order / 2)
    /// Ed25519 signatures are always canonical
    pub fn isCanonical(self: Self) bool {
        if (self.algorithm == .ed25519) {
            return true;
        }

        const threshold = if (self.algorithm == .secp256k1) SECP256K1_N_DIV_2 else P256_N_DIV_2;

        // Compare s with threshold
        var i: usize = 0;
        while (i < COMPONENT_SIZE) : (i += 1) {
            if (self.s[i] < threshold[i]) return true;
            if (self.s[i] > threshold[i]) return false;
        }

        return true; // Equal is canonical
    }

    /// Normalize ECDSA signature to canonical form (s = n - s if s > n/2)
    /// Returns new signature with normalized s value
    pub fn normalize(self: Self) Self {
        if (self.algorithm == .ed25519 or self.isCanonical()) {
            return self;
        }

        const curve_order = if (self.algorithm == .secp256k1) SECP256K1_N else P256_N;

        // Calculate s_normalized = n - s
        var s_normalized: [32]u8 = undefined;
        var borrow: u16 = 0;

        var i: usize = COMPONENT_SIZE;
        while (i > 0) {
            i -= 1;
            const diff: u16 = @as(u16, curve_order[i]) -% @as(u16, self.s[i]) -% borrow;
            s_normalized[i] = @truncate(diff);
            borrow = if (diff > 0xff) 1 else 0;
        }

        // Flip v if present (27 <-> 28)
        const new_v = if (self.v) |v| (if (v == 27) @as(u8, 28) else @as(u8, 27)) else null;

        return Self{
            .r = self.r,
            .s = s_normalized,
            .v = new_v,
            .algorithm = self.algorithm,
        };
    }

    /// Check equality with another signature
    pub fn equals(self: Self, other: Self) bool {
        if (self.algorithm != other.algorithm) return false;
        if (self.v != other.v) return false;
        return std.mem.eql(u8, &self.r, &other.r) and std.mem.eql(u8, &self.s, &other.s);
    }
};

// DER encoding/decoding helper functions

fn readDERLength(bytes: []const u8, pos: *usize) !usize {
    if (pos.* >= bytes.len) return error.InvalidDERFormat;

    const first = bytes[pos.*];
    pos.* += 1;

    if (first < 0x80) {
        return first;
    }

    const len_bytes = first & 0x7f;
    if (len_bytes > 4 or pos.* + len_bytes > bytes.len) {
        return error.InvalidDERFormat;
    }

    var len: usize = 0;
    var i: usize = 0;
    while (i < len_bytes) : (i += 1) {
        len = (len << 8) | bytes[pos.*];
        pos.* += 1;
    }

    return len;
}

fn readDERInteger(bytes: []const u8, pos: *usize) ![]u8 {
    if (pos.* >= bytes.len or bytes[pos.*] != 0x02) {
        return error.InvalidDERFormat;
    }
    pos.* += 1;

    const len = try readDERLength(bytes, pos);
    if (pos.* + len > bytes.len) {
        return error.InvalidDERFormat;
    }

    const allocator = std.heap.page_allocator;
    const result = try allocator.alloc(u8, len);
    @memcpy(result, bytes[pos.* .. pos.* + len]);
    pos.* += len;

    return result;
}

fn encodeDERLength(allocator: std.mem.Allocator, len: usize) ![]u8 {
    if (len < 0x80) {
        const result = try allocator.alloc(u8, 1);
        result[0] = @truncate(len);
        return result;
    }

    var temp_len = len;
    var num_bytes: usize = 0;
    while (temp_len > 0) : (temp_len >>= 8) {
        num_bytes += 1;
    }

    const result = try allocator.alloc(u8, num_bytes + 1);
    result[0] = 0x80 | @as(u8, @truncate(num_bytes));

    var i: usize = num_bytes;
    temp_len = len;
    while (i > 0) {
        i -= 1;
        result[i + 1] = @truncate(temp_len);
        temp_len >>= 8;
    }

    return result;
}

fn encodeDERInteger(allocator: std.mem.Allocator, value: []const u8) ![]u8 {
    // Skip leading zeros
    var start: usize = 0;
    while (start < value.len and value[start] == 0) : (start += 1) {}

    if (start == value.len) {
        // Value is zero
        const result = try allocator.alloc(u8, 3);
        result[0] = 0x02; // INTEGER tag
        result[1] = 0x01; // length
        result[2] = 0x00; // value
        return result;
    }

    // Check if we need padding (high bit set means negative in DER)
    const needs_padding = (value[start] & 0x80) != 0;
    const content_len = value.len - start + (if (needs_padding) @as(usize, 1) else 0);

    const len_bytes = try encodeDERLength(allocator, content_len);
    defer allocator.free(len_bytes);

    const total_len = 1 + len_bytes.len + content_len;
    const result = try allocator.alloc(u8, total_len);

    result[0] = 0x02; // INTEGER tag
    @memcpy(result[1 .. 1 + len_bytes.len], len_bytes);

    var pos = 1 + len_bytes.len;
    if (needs_padding) {
        result[pos] = 0x00;
        pos += 1;
    }
    @memcpy(result[pos..], value[start..]);

    return result;
}

// Tests

test "Signature.fromSecp256k1" {
    const r: [32]u8 = [_]u8{1} ** 32;
    const s: [32]u8 = [_]u8{2} ** 32;
    const v: u8 = 27;

    const sig = Signature.fromSecp256k1(r, s, v);

    try std.testing.expectEqual(Algorithm.secp256k1, sig.algorithm);
    try std.testing.expectEqualSlices(u8, &r, &sig.r);
    try std.testing.expectEqualSlices(u8, &s, &sig.s);
    try std.testing.expectEqual(@as(?u8, 27), sig.v);
}

test "Signature.fromP256" {
    const r: [32]u8 = [_]u8{3} ** 32;
    const s: [32]u8 = [_]u8{4} ** 32;

    const sig = Signature.fromP256(r, s);

    try std.testing.expectEqual(Algorithm.p256, sig.algorithm);
    try std.testing.expectEqualSlices(u8, &r, &sig.r);
    try std.testing.expectEqualSlices(u8, &s, &sig.s);
    try std.testing.expectEqual(@as(?u8, null), sig.v);
}

test "Signature.fromEd25519" {
    var sig_bytes: [64]u8 = undefined;
    for (0..64) |i| {
        sig_bytes[i] = @truncate(i);
    }

    const sig = Signature.fromEd25519(sig_bytes);

    try std.testing.expectEqual(Algorithm.ed25519, sig.algorithm);
    try std.testing.expectEqualSlices(u8, sig_bytes[0..32], &sig.r);
    try std.testing.expectEqualSlices(u8, sig_bytes[32..64], &sig.s);
    try std.testing.expectEqual(@as(?u8, null), sig.v);
}

test "Signature.fromCompact" {
    var bytes: [64]u8 = undefined;
    @memset(bytes[0..32], 0xaa);
    @memset(bytes[32..64], 0xbb);

    const sig = Signature.fromCompact(bytes, .secp256k1);

    try std.testing.expectEqual(Algorithm.secp256k1, sig.algorithm);
    try std.testing.expectEqualSlices(u8, bytes[0..32], &sig.r);
    try std.testing.expectEqualSlices(u8, bytes[32..64], &sig.s);
}

test "Signature.toBytes with v" {
    const r: [32]u8 = [_]u8{1} ** 32;
    const s: [32]u8 = [_]u8{2} ** 32;
    const sig = Signature.fromSecp256k1(r, s, 27);

    const allocator = std.testing.allocator;
    const bytes = try sig.toBytes(allocator);
    defer allocator.free(bytes);

    try std.testing.expectEqual(@as(usize, 65), bytes.len);
    try std.testing.expectEqualSlices(u8, &r, bytes[0..32]);
    try std.testing.expectEqualSlices(u8, &s, bytes[32..64]);
    try std.testing.expectEqual(@as(u8, 27), bytes[64]);
}

test "Signature.toBytes without v" {
    const r: [32]u8 = [_]u8{1} ** 32;
    const s: [32]u8 = [_]u8{2} ** 32;
    const sig = Signature.fromP256(r, s);

    const allocator = std.testing.allocator;
    const bytes = try sig.toBytes(allocator);
    defer allocator.free(bytes);

    try std.testing.expectEqual(@as(usize, 64), bytes.len);
    try std.testing.expectEqualSlices(u8, &r, bytes[0..32]);
    try std.testing.expectEqualSlices(u8, &s, bytes[32..64]);
}

test "Signature.toCompact" {
    const r: [32]u8 = [_]u8{1} ** 32;
    const s: [32]u8 = [_]u8{2} ** 32;
    const sig = Signature.fromSecp256k1(r, s, 27);

    const compact = sig.toCompact();

    try std.testing.expectEqual(@as(usize, 64), compact.len);
    try std.testing.expectEqualSlices(u8, &r, compact[0..32]);
    try std.testing.expectEqualSlices(u8, &s, compact[32..64]);
}

test "Signature.getR" {
    const r: [32]u8 = [_]u8{0xaa} ** 32;
    const s: [32]u8 = [_]u8{0xbb} ** 32;
    const sig = Signature.fromSecp256k1(r, s, null);

    const retrieved_r = sig.getR();
    try std.testing.expectEqualSlices(u8, &r, &retrieved_r);
}

test "Signature.getS" {
    const r: [32]u8 = [_]u8{0xaa} ** 32;
    const s: [32]u8 = [_]u8{0xbb} ** 32;
    const sig = Signature.fromSecp256k1(r, s, null);

    const retrieved_s = sig.getS();
    try std.testing.expectEqualSlices(u8, &s, &retrieved_s);
}

test "Signature.getV" {
    const r: [32]u8 = [_]u8{1} ** 32;
    const s: [32]u8 = [_]u8{2} ** 32;

    const sig_with_v = Signature.fromSecp256k1(r, s, 27);
    try std.testing.expectEqual(@as(?u8, 27), sig_with_v.getV());

    const sig_without_v = Signature.fromP256(r, s);
    try std.testing.expectEqual(@as(?u8, null), sig_without_v.getV());
}

test "Signature.isCanonical - Ed25519 always canonical" {
    const sig_bytes = [_]u8{0xff} ** 64;
    const sig = Signature.fromEd25519(sig_bytes);

    try std.testing.expect(sig.isCanonical());
}

test "Signature.isCanonical - secp256k1 canonical s" {
    const r: [32]u8 = [_]u8{1} ** 32;
    // s < SECP256K1_N_DIV_2 (canonical)
    const s: [32]u8 = [_]u8{0x10} ** 32;

    const sig = Signature.fromSecp256k1(r, s, null);
    try std.testing.expect(sig.isCanonical());
}

test "Signature.isCanonical - secp256k1 non-canonical s" {
    const r: [32]u8 = [_]u8{1} ** 32;
    // s > SECP256K1_N_DIV_2 (non-canonical)
    const s: [32]u8 = [_]u8{0xff} ** 32;

    const sig = Signature.fromSecp256k1(r, s, null);
    try std.testing.expect(!sig.isCanonical());
}

test "Signature.normalize - already canonical" {
    const r: [32]u8 = [_]u8{1} ** 32;
    const s: [32]u8 = [_]u8{0x10} ** 32;

    const sig = Signature.fromSecp256k1(r, s, 27);
    const normalized = sig.normalize();

    try std.testing.expect(normalized.equals(sig));
}

test "Signature.normalize - non-canonical" {
    const r: [32]u8 = [_]u8{1} ** 32;
    // Non-canonical s
    const s: [32]u8 = [_]u8{0xff} ** 32;

    const sig = Signature.fromSecp256k1(r, s, 27);
    const normalized = sig.normalize();

    try std.testing.expect(normalized.isCanonical());
    try std.testing.expect(!normalized.equals(sig));
    try std.testing.expectEqualSlices(u8, &r, &normalized.r);
    try std.testing.expectEqual(@as(?u8, 28), normalized.v); // v flipped
}

test "Signature.equals - same signatures" {
    const r: [32]u8 = [_]u8{1} ** 32;
    const s: [32]u8 = [_]u8{2} ** 32;

    const sig1 = Signature.fromSecp256k1(r, s, 27);
    const sig2 = Signature.fromSecp256k1(r, s, 27);

    try std.testing.expect(sig1.equals(sig2));
}

test "Signature.equals - different algorithms" {
    const r: [32]u8 = [_]u8{1} ** 32;
    const s: [32]u8 = [_]u8{2} ** 32;

    const sig1 = Signature.fromSecp256k1(r, s, null);
    const sig2 = Signature.fromP256(r, s);

    try std.testing.expect(!sig1.equals(sig2));
}

test "Signature.equals - different v values" {
    const r: [32]u8 = [_]u8{1} ** 32;
    const s: [32]u8 = [_]u8{2} ** 32;

    const sig1 = Signature.fromSecp256k1(r, s, 27);
    const sig2 = Signature.fromSecp256k1(r, s, 28);

    try std.testing.expect(!sig1.equals(sig2));
}

test "Signature.toDER and fromDER roundtrip" {
    const r: [32]u8 = [_]u8{1} ** 32;
    const s: [32]u8 = [_]u8{2} ** 32;

    const original = Signature.fromSecp256k1(r, s, null);

    const allocator = std.testing.allocator;
    const der = try original.toDER(allocator);
    defer allocator.free(der);

    const decoded = try Signature.fromDER(allocator, der, .secp256k1);

    try std.testing.expectEqualSlices(u8, &original.r, &decoded.r);
    try std.testing.expectEqualSlices(u8, &original.s, &decoded.s);
    try std.testing.expectEqual(original.algorithm, decoded.algorithm);
}

test "Signature.toDER - Ed25519 returns error" {
    const sig_bytes = [_]u8{1} ** 64;
    const sig = Signature.fromEd25519(sig_bytes);

    const allocator = std.testing.allocator;
    try std.testing.expectError(error.InvalidAlgorithm, sig.toDER(allocator));
}

test "Signature.fromDER - Ed25519 returns error" {
    const der_bytes = [_]u8{ 0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x02 };

    const allocator = std.testing.allocator;
    try std.testing.expectError(error.InvalidAlgorithm, Signature.fromDER(allocator, &der_bytes, .ed25519));
}
