const std = @import("std");
const builtin = @import("builtin");

/// ⚠️ UNAUDITED CUSTOM CRYPTO IMPLEMENTATION - NOT SECURITY AUDITED ⚠️
///
/// This module contains a CUSTOM RIPEMD160 hash function implementation
/// that has NOT been security audited or verified against known attacks.
/// These implementations are provided for educational/testing purposes only.
/// DO NOT USE IN PRODUCTION without proper security audit and testing.
///
/// Known risks:
/// - Potential timing attacks in hash computation
/// - Unvalidated against known hash function vulnerabilities
/// - Custom implementation may have edge case bugs
/// - Memory safety not guaranteed under all conditions
///
/// RIPEMD160 implementation based on Bitcoin Core reference
/// This implementation follows the RIPEMD160 specification and matches Bitcoin Core's implementation
pub const RIPEMD160 = struct {
    s: [5]u32,
    buf: [64]u8,
    bytes: u64,

    /// Initialize RIPEMD160 state with standard initial values
    pub fn init() RIPEMD160 {
        return .{
            .s = [_]u32{
                0x67452301,
                0xEFCDAB89,
                0x98BADCFE,
                0x10325476,
                0xC3D2E1F0,
            },
            .buf = undefined,
            .bytes = 0,
        };
    }

    /// Process input data
    pub fn update(self: *RIPEMD160, data: []const u8) void {
        var input = data;

        // Handle partial block from previous update
        const buf_used: usize = @intCast(self.bytes % 64);
        if (buf_used > 0) {
            const to_copy = @min(64 - buf_used, input.len);
            @memcpy(self.buf[buf_used .. buf_used + to_copy], input[0..to_copy]);
            self.bytes += to_copy;
            input = input[to_copy..];

            // Process complete block if we filled the buffer
            if (self.bytes % 64 == 0) {
                transform(&self.s, &self.buf);
            }
        }

        // Process complete 64-byte blocks
        while (input.len >= 64) {
            var block: [64]u8 = undefined;
            @memcpy(&block, input[0..64]);
            transform(&self.s, &block);
            self.bytes += 64;
            input = input[64..];
        }

        // Store remaining bytes in buffer
        if (input.len > 0) {
            const buf_start: usize = @intCast(self.bytes % 64);
            @memcpy(self.buf[buf_start .. buf_start + input.len], input);
            self.bytes += input.len;
        }
    }

    /// Finalize and return hash
    pub fn final(self: *RIPEMD160) [20]u8 {
        // Add padding
        const msg_len = self.bytes;
        const buf_used: usize = @intCast(msg_len % 64);

        // Pad with 0x80 followed by zeros
        self.buf[buf_used] = 0x80;

        if (buf_used < 56) {
            // Enough room for length in this block
            @memset(self.buf[buf_used + 1 .. 56], 0);
        } else {
            // Need an extra block
            @memset(self.buf[buf_used + 1 .. 64], 0);
            transform(&self.s, &self.buf);
            @memset(self.buf[0..56], 0);
        }

        // Append length in bits as 64-bit little-endian
        const bits = msg_len * 8;
        self.buf[56] = @truncate(bits);
        self.buf[57] = @truncate(bits >> 8);
        self.buf[58] = @truncate(bits >> 16);
        self.buf[59] = @truncate(bits >> 24);
        self.buf[60] = @truncate(bits >> 32);
        self.buf[61] = @truncate(bits >> 40);
        self.buf[62] = @truncate(bits >> 48);
        self.buf[63] = @truncate(bits >> 56);

        transform(&self.s, &self.buf);

        // Convert state to bytes (little-endian)
        var result: [20]u8 = undefined;
        for (self.s, 0..) |word, i| {
            result[i * 4] = @truncate(word);
            result[i * 4 + 1] = @truncate(word >> 8);
            result[i * 4 + 2] = @truncate(word >> 16);
            result[i * 4 + 3] = @truncate(word >> 24);
        }

        return result;
    }

    /// Reset to initial state
    pub fn reset(self: *RIPEMD160) void {
        self.* = init();
    }
};

// RIPEMD160 round functions
fn f(round_num: u32, x: u32, y: u32, z: u32) u32 {
    return switch (round_num) {
        0 => x ^ y ^ z,
        1 => (x & y) | (~x & z),
        2 => (x | ~y) ^ z,
        3 => (x & z) | (y & ~z),
        4 => x ^ (y | ~z),
        else => unreachable,
    };
}

// Left rotate
fn rol(x: u32, n: u5) u32 {
    const shift: u5 = @intCast(32 -% @as(u32, n));
    return (x << n) | (x >> shift);
}

// Lookup tables for dynamic version (ReleaseSmall mode)
const LEFT_X_INDICES = [80]u8{
    // Rounds 0-15
    0, 1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
    // Rounds 16-31
    7, 4,  13, 1,  10, 6,  15, 3,  12, 0, 9,  5,  2,  14, 11, 8,
    // Rounds 32-47
    3, 10, 14, 4,  9,  15, 8,  1,  2,  7, 0,  6,  13, 11, 5,  12,
    // Rounds 48-63
    1, 9,  11, 10, 0,  8,  12, 4,  13, 3, 7,  15, 14, 5,  6,  2,
    // Rounds 64-79
    4, 0,  5,  9,  7,  12, 2,  10, 14, 1, 3,  8,  11, 6,  15, 13,
};

const RIGHT_X_INDICES = [80]u8{
    // Rounds 0-15
    5,  14, 7,  0, 9, 2,  11, 4,  13, 6,  15, 8,  1,  10, 3,  12,
    // Rounds 16-31
    6,  11, 3,  7, 0, 13, 5,  10, 14, 15, 8,  12, 4,  9,  1,  2,
    // Rounds 32-47
    15, 5,  1,  3, 7, 14, 6,  9,  11, 8,  12, 2,  10, 0,  4,  13,
    // Rounds 48-63
    8,  6,  4,  1, 3, 11, 15, 0,  5,  12, 2,  13, 9,  7,  10, 14,
    // Rounds 64-79
    12, 15, 10, 4, 1, 5,  8,  7,  6,  2,  13, 14, 0,  3,  9,  11,
};

const LEFT_ROTATIONS = [80]u5{
    // Rounds 0-15
    11, 14, 15, 12, 5,  8,  7,  9,  11, 13, 14, 15, 6,  7,  9,  8,
    // Rounds 16-31
    7,  6,  8,  13, 11, 9,  7,  15, 7,  12, 15, 9,  11, 7,  13, 12,
    // Rounds 32-47
    11, 13, 6,  7,  14, 9,  13, 15, 14, 8,  13, 6,  5,  12, 7,  5,
    // Rounds 48-63
    11, 12, 14, 15, 14, 15, 9,  8,  9,  14, 5,  6,  8,  6,  5,  12,
    // Rounds 64-79
    9,  15, 5,  11, 6,  8,  13, 12, 5,  12, 13, 14, 11, 8,  5,  6,
};

const RIGHT_ROTATIONS = [80]u5{
    // Rounds 0-15
    8,  9,  9,  11, 13, 15, 15, 5,  7,  7,  8,  11, 14, 14, 12, 6,
    // Rounds 16-31
    9,  13, 15, 7,  12, 8,  9,  11, 7,  7,  12, 7,  6,  15, 13, 11,
    // Rounds 32-47
    9,  7,  15, 11, 8,  6,  6,  14, 12, 13, 5,  14, 13, 13, 7,  5,
    // Rounds 48-63
    15, 5,  8,  11, 14, 14, 6,  14, 6,  9,  12, 9,  12, 5,  15, 8,
    // Rounds 64-79
    8,  5,  12, 9,  12, 5,  14, 6,  8,  13, 6,  5,  15, 13, 11, 11,
};

const ROUND_CONSTANTS = [5]u32{
    0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E,
};

const RIGHT_ROUND_CONSTANTS = [5]u32{
    0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000,
};

// RIPEMD160 transform function
fn transform(s: *[5]u32, chunk: *const [64]u8) void {
    // Load message block into array X (little-endian)
    const X: [16]u32 = blk: {
        var x: [16]u32 = undefined;
        for (&x, 0..) |*word, i| {
            word.* = @as(u32, chunk[i * 4]) |
                (@as(u32, chunk[i * 4 + 1]) << 8) |
                (@as(u32, chunk[i * 4 + 2]) << 16) |
                (@as(u32, chunk[i * 4 + 3]) << 24);
        }
        break :blk x;
    };

    // Initialize working variables
    var al = s[0];
    var bl = s[1];
    var cl = s[2];
    var dl = s[3];
    var el = s[4];
    var ar = al;
    var br = bl;
    var cr = cl;
    var dr = dl;
    var er = el;

    if (comptime builtin.mode == .ReleaseSmall) {
        // Dynamic version for size optimization
        // Process both left and right lines in parallel
        var i: usize = 0;
        while (i < 80) : (i += 1) {
            // Left line
            const left_f_idx = i / 16;
            const left_x_idx = LEFT_X_INDICES[i];
            const left_rot = LEFT_ROTATIONS[i];
            const left_k = ROUND_CONSTANTS[left_f_idx];

            round(&al, &bl, &cl, &dl, &el, f(@intCast(left_f_idx), bl, cl, dl) +% X[left_x_idx] +% left_k, left_rot);

            // Rotate left line variables: (al,bl,cl,dl,el) = (el,al,bl,cl,dl)
            const temp_l = al;
            al = el;
            el = dl;
            dl = cl;
            cl = bl;
            bl = temp_l;

            // Right line
            const right_f_idx = 4 - (i / 16); // Right line uses reverse order: 4,3,2,1,0
            const right_x_idx = RIGHT_X_INDICES[i];
            const right_rot = RIGHT_ROTATIONS[i];
            const right_k = RIGHT_ROUND_CONSTANTS[i / 16];

            round(&ar, &br, &cr, &dr, &er, f(@intCast(right_f_idx), br, cr, dr) +% X[right_x_idx] +% right_k, right_rot);

            // Rotate right line variables
            const temp_r = ar;
            ar = er;
            er = dr;
            dr = cr;
            cr = br;
            br = temp_r;
        }
    } else {
        // Original unrolled version for performance

        // Left line
        round(&al, &bl, &cl, &dl, &el, f(0, bl, cl, dl) +% X[0] +% 0x00000000, 11);
        round(&el, &al, &bl, &cl, &dl, f(0, al, bl, cl) +% X[1] +% 0x00000000, 14);
        round(&dl, &el, &al, &bl, &cl, f(0, el, al, bl) +% X[2] +% 0x00000000, 15);
        round(&cl, &dl, &el, &al, &bl, f(0, dl, el, al) +% X[3] +% 0x00000000, 12);
        round(&bl, &cl, &dl, &el, &al, f(0, cl, dl, el) +% X[4] +% 0x00000000, 5);
        round(&al, &bl, &cl, &dl, &el, f(0, bl, cl, dl) +% X[5] +% 0x00000000, 8);
        round(&el, &al, &bl, &cl, &dl, f(0, al, bl, cl) +% X[6] +% 0x00000000, 7);
        round(&dl, &el, &al, &bl, &cl, f(0, el, al, bl) +% X[7] +% 0x00000000, 9);
        round(&cl, &dl, &el, &al, &bl, f(0, dl, el, al) +% X[8] +% 0x00000000, 11);
        round(&bl, &cl, &dl, &el, &al, f(0, cl, dl, el) +% X[9] +% 0x00000000, 13);
        round(&al, &bl, &cl, &dl, &el, f(0, bl, cl, dl) +% X[10] +% 0x00000000, 14);
        round(&el, &al, &bl, &cl, &dl, f(0, al, bl, cl) +% X[11] +% 0x00000000, 15);
        round(&dl, &el, &al, &bl, &cl, f(0, el, al, bl) +% X[12] +% 0x00000000, 6);
        round(&cl, &dl, &el, &al, &bl, f(0, dl, el, al) +% X[13] +% 0x00000000, 7);
        round(&bl, &cl, &dl, &el, &al, f(0, cl, dl, el) +% X[14] +% 0x00000000, 9);
        round(&al, &bl, &cl, &dl, &el, f(0, bl, cl, dl) +% X[15] +% 0x00000000, 8);

        round(&el, &al, &bl, &cl, &dl, f(1, al, bl, cl) +% X[7] +% 0x5A827999, 7);
        round(&dl, &el, &al, &bl, &cl, f(1, el, al, bl) +% X[4] +% 0x5A827999, 6);
        round(&cl, &dl, &el, &al, &bl, f(1, dl, el, al) +% X[13] +% 0x5A827999, 8);
        round(&bl, &cl, &dl, &el, &al, f(1, cl, dl, el) +% X[1] +% 0x5A827999, 13);
        round(&al, &bl, &cl, &dl, &el, f(1, bl, cl, dl) +% X[10] +% 0x5A827999, 11);
        round(&el, &al, &bl, &cl, &dl, f(1, al, bl, cl) +% X[6] +% 0x5A827999, 9);
        round(&dl, &el, &al, &bl, &cl, f(1, el, al, bl) +% X[15] +% 0x5A827999, 7);
        round(&cl, &dl, &el, &al, &bl, f(1, dl, el, al) +% X[3] +% 0x5A827999, 15);
        round(&bl, &cl, &dl, &el, &al, f(1, cl, dl, el) +% X[12] +% 0x5A827999, 7);
        round(&al, &bl, &cl, &dl, &el, f(1, bl, cl, dl) +% X[0] +% 0x5A827999, 12);
        round(&el, &al, &bl, &cl, &dl, f(1, al, bl, cl) +% X[9] +% 0x5A827999, 15);
        round(&dl, &el, &al, &bl, &cl, f(1, el, al, bl) +% X[5] +% 0x5A827999, 9);
        round(&cl, &dl, &el, &al, &bl, f(1, dl, el, al) +% X[2] +% 0x5A827999, 11);
        round(&bl, &cl, &dl, &el, &al, f(1, cl, dl, el) +% X[14] +% 0x5A827999, 7);
        round(&al, &bl, &cl, &dl, &el, f(1, bl, cl, dl) +% X[11] +% 0x5A827999, 13);
        round(&el, &al, &bl, &cl, &dl, f(1, al, bl, cl) +% X[8] +% 0x5A827999, 12);

        round(&dl, &el, &al, &bl, &cl, f(2, el, al, bl) +% X[3] +% 0x6ED9EBA1, 11);
        round(&cl, &dl, &el, &al, &bl, f(2, dl, el, al) +% X[10] +% 0x6ED9EBA1, 13);
        round(&bl, &cl, &dl, &el, &al, f(2, cl, dl, el) +% X[14] +% 0x6ED9EBA1, 6);
        round(&al, &bl, &cl, &dl, &el, f(2, bl, cl, dl) +% X[4] +% 0x6ED9EBA1, 7);
        round(&el, &al, &bl, &cl, &dl, f(2, al, bl, cl) +% X[9] +% 0x6ED9EBA1, 14);
        round(&dl, &el, &al, &bl, &cl, f(2, el, al, bl) +% X[15] +% 0x6ED9EBA1, 9);
        round(&cl, &dl, &el, &al, &bl, f(2, dl, el, al) +% X[8] +% 0x6ED9EBA1, 13);
        round(&bl, &cl, &dl, &el, &al, f(2, cl, dl, el) +% X[1] +% 0x6ED9EBA1, 15);
        round(&al, &bl, &cl, &dl, &el, f(2, bl, cl, dl) +% X[2] +% 0x6ED9EBA1, 14);
        round(&el, &al, &bl, &cl, &dl, f(2, al, bl, cl) +% X[7] +% 0x6ED9EBA1, 8);
        round(&dl, &el, &al, &bl, &cl, f(2, el, al, bl) +% X[0] +% 0x6ED9EBA1, 13);
        round(&cl, &dl, &el, &al, &bl, f(2, dl, el, al) +% X[6] +% 0x6ED9EBA1, 6);
        round(&bl, &cl, &dl, &el, &al, f(2, cl, dl, el) +% X[13] +% 0x6ED9EBA1, 5);
        round(&al, &bl, &cl, &dl, &el, f(2, bl, cl, dl) +% X[11] +% 0x6ED9EBA1, 12);
        round(&el, &al, &bl, &cl, &dl, f(2, al, bl, cl) +% X[5] +% 0x6ED9EBA1, 7);
        round(&dl, &el, &al, &bl, &cl, f(2, el, al, bl) +% X[12] +% 0x6ED9EBA1, 5);

        round(&cl, &dl, &el, &al, &bl, f(3, dl, el, al) +% X[1] +% 0x8F1BBCDC, 11);
        round(&bl, &cl, &dl, &el, &al, f(3, cl, dl, el) +% X[9] +% 0x8F1BBCDC, 12);
        round(&al, &bl, &cl, &dl, &el, f(3, bl, cl, dl) +% X[11] +% 0x8F1BBCDC, 14);
        round(&el, &al, &bl, &cl, &dl, f(3, al, bl, cl) +% X[10] +% 0x8F1BBCDC, 15);
        round(&dl, &el, &al, &bl, &cl, f(3, el, al, bl) +% X[0] +% 0x8F1BBCDC, 14);
        round(&cl, &dl, &el, &al, &bl, f(3, dl, el, al) +% X[8] +% 0x8F1BBCDC, 15);
        round(&bl, &cl, &dl, &el, &al, f(3, cl, dl, el) +% X[12] +% 0x8F1BBCDC, 9);
        round(&al, &bl, &cl, &dl, &el, f(3, bl, cl, dl) +% X[4] +% 0x8F1BBCDC, 8);
        round(&el, &al, &bl, &cl, &dl, f(3, al, bl, cl) +% X[13] +% 0x8F1BBCDC, 9);
        round(&dl, &el, &al, &bl, &cl, f(3, el, al, bl) +% X[3] +% 0x8F1BBCDC, 14);
        round(&cl, &dl, &el, &al, &bl, f(3, dl, el, al) +% X[7] +% 0x8F1BBCDC, 5);
        round(&bl, &cl, &dl, &el, &al, f(3, cl, dl, el) +% X[15] +% 0x8F1BBCDC, 6);
        round(&al, &bl, &cl, &dl, &el, f(3, bl, cl, dl) +% X[14] +% 0x8F1BBCDC, 8);
        round(&el, &al, &bl, &cl, &dl, f(3, al, bl, cl) +% X[5] +% 0x8F1BBCDC, 6);
        round(&dl, &el, &al, &bl, &cl, f(3, el, al, bl) +% X[6] +% 0x8F1BBCDC, 5);
        round(&cl, &dl, &el, &al, &bl, f(3, dl, el, al) +% X[2] +% 0x8F1BBCDC, 12);

        round(&bl, &cl, &dl, &el, &al, f(4, cl, dl, el) +% X[4] +% 0xA953FD4E, 9);
        round(&al, &bl, &cl, &dl, &el, f(4, bl, cl, dl) +% X[0] +% 0xA953FD4E, 15);
        round(&el, &al, &bl, &cl, &dl, f(4, al, bl, cl) +% X[5] +% 0xA953FD4E, 5);
        round(&dl, &el, &al, &bl, &cl, f(4, el, al, bl) +% X[9] +% 0xA953FD4E, 11);
        round(&cl, &dl, &el, &al, &bl, f(4, dl, el, al) +% X[7] +% 0xA953FD4E, 6);
        round(&bl, &cl, &dl, &el, &al, f(4, cl, dl, el) +% X[12] +% 0xA953FD4E, 8);
        round(&al, &bl, &cl, &dl, &el, f(4, bl, cl, dl) +% X[2] +% 0xA953FD4E, 13);
        round(&el, &al, &bl, &cl, &dl, f(4, al, bl, cl) +% X[10] +% 0xA953FD4E, 12);
        round(&dl, &el, &al, &bl, &cl, f(4, el, al, bl) +% X[14] +% 0xA953FD4E, 5);
        round(&cl, &dl, &el, &al, &bl, f(4, dl, el, al) +% X[1] +% 0xA953FD4E, 12);
        round(&bl, &cl, &dl, &el, &al, f(4, cl, dl, el) +% X[3] +% 0xA953FD4E, 13);
        round(&al, &bl, &cl, &dl, &el, f(4, bl, cl, dl) +% X[8] +% 0xA953FD4E, 14);
        round(&el, &al, &bl, &cl, &dl, f(4, al, bl, cl) +% X[11] +% 0xA953FD4E, 11);
        round(&dl, &el, &al, &bl, &cl, f(4, el, al, bl) +% X[6] +% 0xA953FD4E, 8);
        round(&cl, &dl, &el, &al, &bl, f(4, dl, el, al) +% X[15] +% 0xA953FD4E, 5);
        round(&bl, &cl, &dl, &el, &al, f(4, cl, dl, el) +% X[13] +% 0xA953FD4E, 6);

        // Right line
        round(&ar, &br, &cr, &dr, &er, f(4, br, cr, dr) +% X[5] +% 0x50A28BE6, 8);
        round(&er, &ar, &br, &cr, &dr, f(4, ar, br, cr) +% X[14] +% 0x50A28BE6, 9);
        round(&dr, &er, &ar, &br, &cr, f(4, er, ar, br) +% X[7] +% 0x50A28BE6, 9);
        round(&cr, &dr, &er, &ar, &br, f(4, dr, er, ar) +% X[0] +% 0x50A28BE6, 11);
        round(&br, &cr, &dr, &er, &ar, f(4, cr, dr, er) +% X[9] +% 0x50A28BE6, 13);
        round(&ar, &br, &cr, &dr, &er, f(4, br, cr, dr) +% X[2] +% 0x50A28BE6, 15);
        round(&er, &ar, &br, &cr, &dr, f(4, ar, br, cr) +% X[11] +% 0x50A28BE6, 15);
        round(&dr, &er, &ar, &br, &cr, f(4, er, ar, br) +% X[4] +% 0x50A28BE6, 5);
        round(&cr, &dr, &er, &ar, &br, f(4, dr, er, ar) +% X[13] +% 0x50A28BE6, 7);
        round(&br, &cr, &dr, &er, &ar, f(4, cr, dr, er) +% X[6] +% 0x50A28BE6, 7);
        round(&ar, &br, &cr, &dr, &er, f(4, br, cr, dr) +% X[15] +% 0x50A28BE6, 8);
        round(&er, &ar, &br, &cr, &dr, f(4, ar, br, cr) +% X[8] +% 0x50A28BE6, 11);
        round(&dr, &er, &ar, &br, &cr, f(4, er, ar, br) +% X[1] +% 0x50A28BE6, 14);
        round(&cr, &dr, &er, &ar, &br, f(4, dr, er, ar) +% X[10] +% 0x50A28BE6, 14);
        round(&br, &cr, &dr, &er, &ar, f(4, cr, dr, er) +% X[3] +% 0x50A28BE6, 12);
        round(&ar, &br, &cr, &dr, &er, f(4, br, cr, dr) +% X[12] +% 0x50A28BE6, 6);

        round(&er, &ar, &br, &cr, &dr, f(3, ar, br, cr) +% X[6] +% 0x5C4DD124, 9);
        round(&dr, &er, &ar, &br, &cr, f(3, er, ar, br) +% X[11] +% 0x5C4DD124, 13);
        round(&cr, &dr, &er, &ar, &br, f(3, dr, er, ar) +% X[3] +% 0x5C4DD124, 15);
        round(&br, &cr, &dr, &er, &ar, f(3, cr, dr, er) +% X[7] +% 0x5C4DD124, 7);
        round(&ar, &br, &cr, &dr, &er, f(3, br, cr, dr) +% X[0] +% 0x5C4DD124, 12);
        round(&er, &ar, &br, &cr, &dr, f(3, ar, br, cr) +% X[13] +% 0x5C4DD124, 8);
        round(&dr, &er, &ar, &br, &cr, f(3, er, ar, br) +% X[5] +% 0x5C4DD124, 9);
        round(&cr, &dr, &er, &ar, &br, f(3, dr, er, ar) +% X[10] +% 0x5C4DD124, 11);
        round(&br, &cr, &dr, &er, &ar, f(3, cr, dr, er) +% X[14] +% 0x5C4DD124, 7);
        round(&ar, &br, &cr, &dr, &er, f(3, br, cr, dr) +% X[15] +% 0x5C4DD124, 7);
        round(&er, &ar, &br, &cr, &dr, f(3, ar, br, cr) +% X[8] +% 0x5C4DD124, 12);
        round(&dr, &er, &ar, &br, &cr, f(3, er, ar, br) +% X[12] +% 0x5C4DD124, 7);
        round(&cr, &dr, &er, &ar, &br, f(3, dr, er, ar) +% X[4] +% 0x5C4DD124, 6);
        round(&br, &cr, &dr, &er, &ar, f(3, cr, dr, er) +% X[9] +% 0x5C4DD124, 15);
        round(&ar, &br, &cr, &dr, &er, f(3, br, cr, dr) +% X[1] +% 0x5C4DD124, 13);
        round(&er, &ar, &br, &cr, &dr, f(3, ar, br, cr) +% X[2] +% 0x5C4DD124, 11);

        round(&dr, &er, &ar, &br, &cr, f(2, er, ar, br) +% X[15] +% 0x6D703EF3, 9);
        round(&cr, &dr, &er, &ar, &br, f(2, dr, er, ar) +% X[5] +% 0x6D703EF3, 7);
        round(&br, &cr, &dr, &er, &ar, f(2, cr, dr, er) +% X[1] +% 0x6D703EF3, 15);
        round(&ar, &br, &cr, &dr, &er, f(2, br, cr, dr) +% X[3] +% 0x6D703EF3, 11);
        round(&er, &ar, &br, &cr, &dr, f(2, ar, br, cr) +% X[7] +% 0x6D703EF3, 8);
        round(&dr, &er, &ar, &br, &cr, f(2, er, ar, br) +% X[14] +% 0x6D703EF3, 6);
        round(&cr, &dr, &er, &ar, &br, f(2, dr, er, ar) +% X[6] +% 0x6D703EF3, 6);
        round(&br, &cr, &dr, &er, &ar, f(2, cr, dr, er) +% X[9] +% 0x6D703EF3, 14);
        round(&ar, &br, &cr, &dr, &er, f(2, br, cr, dr) +% X[11] +% 0x6D703EF3, 12);
        round(&er, &ar, &br, &cr, &dr, f(2, ar, br, cr) +% X[8] +% 0x6D703EF3, 13);
        round(&dr, &er, &ar, &br, &cr, f(2, er, ar, br) +% X[12] +% 0x6D703EF3, 5);
        round(&cr, &dr, &er, &ar, &br, f(2, dr, er, ar) +% X[2] +% 0x6D703EF3, 14);
        round(&br, &cr, &dr, &er, &ar, f(2, cr, dr, er) +% X[10] +% 0x6D703EF3, 13);
        round(&ar, &br, &cr, &dr, &er, f(2, br, cr, dr) +% X[0] +% 0x6D703EF3, 13);
        round(&er, &ar, &br, &cr, &dr, f(2, ar, br, cr) +% X[4] +% 0x6D703EF3, 7);
        round(&dr, &er, &ar, &br, &cr, f(2, er, ar, br) +% X[13] +% 0x6D703EF3, 5);

        round(&cr, &dr, &er, &ar, &br, f(1, dr, er, ar) +% X[8] +% 0x7A6D76E9, 15);
        round(&br, &cr, &dr, &er, &ar, f(1, cr, dr, er) +% X[6] +% 0x7A6D76E9, 5);
        round(&ar, &br, &cr, &dr, &er, f(1, br, cr, dr) +% X[4] +% 0x7A6D76E9, 8);
        round(&er, &ar, &br, &cr, &dr, f(1, ar, br, cr) +% X[1] +% 0x7A6D76E9, 11);
        round(&dr, &er, &ar, &br, &cr, f(1, er, ar, br) +% X[3] +% 0x7A6D76E9, 14);
        round(&cr, &dr, &er, &ar, &br, f(1, dr, er, ar) +% X[11] +% 0x7A6D76E9, 14);
        round(&br, &cr, &dr, &er, &ar, f(1, cr, dr, er) +% X[15] +% 0x7A6D76E9, 6);
        round(&ar, &br, &cr, &dr, &er, f(1, br, cr, dr) +% X[0] +% 0x7A6D76E9, 14);
        round(&er, &ar, &br, &cr, &dr, f(1, ar, br, cr) +% X[5] +% 0x7A6D76E9, 6);
        round(&dr, &er, &ar, &br, &cr, f(1, er, ar, br) +% X[12] +% 0x7A6D76E9, 9);
        round(&cr, &dr, &er, &ar, &br, f(1, dr, er, ar) +% X[2] +% 0x7A6D76E9, 12);
        round(&br, &cr, &dr, &er, &ar, f(1, cr, dr, er) +% X[13] +% 0x7A6D76E9, 9);
        round(&ar, &br, &cr, &dr, &er, f(1, br, cr, dr) +% X[9] +% 0x7A6D76E9, 12);
        round(&er, &ar, &br, &cr, &dr, f(1, ar, br, cr) +% X[7] +% 0x7A6D76E9, 5);
        round(&dr, &er, &ar, &br, &cr, f(1, er, ar, br) +% X[10] +% 0x7A6D76E9, 15);
        round(&cr, &dr, &er, &ar, &br, f(1, dr, er, ar) +% X[14] +% 0x7A6D76E9, 8);

        round(&br, &cr, &dr, &er, &ar, f(0, cr, dr, er) +% X[12] +% 0x00000000, 8);
        round(&ar, &br, &cr, &dr, &er, f(0, br, cr, dr) +% X[15] +% 0x00000000, 5);
        round(&er, &ar, &br, &cr, &dr, f(0, ar, br, cr) +% X[10] +% 0x00000000, 12);
        round(&dr, &er, &ar, &br, &cr, f(0, er, ar, br) +% X[4] +% 0x00000000, 9);
        round(&cr, &dr, &er, &ar, &br, f(0, dr, er, ar) +% X[1] +% 0x00000000, 12);
        round(&br, &cr, &dr, &er, &ar, f(0, cr, dr, er) +% X[5] +% 0x00000000, 5);
        round(&ar, &br, &cr, &dr, &er, f(0, br, cr, dr) +% X[8] +% 0x00000000, 14);
        round(&er, &ar, &br, &cr, &dr, f(0, ar, br, cr) +% X[7] +% 0x00000000, 6);
        round(&dr, &er, &ar, &br, &cr, f(0, er, ar, br) +% X[6] +% 0x00000000, 8);
        round(&cr, &dr, &er, &ar, &br, f(0, dr, er, ar) +% X[2] +% 0x00000000, 13);
        round(&br, &cr, &dr, &er, &ar, f(0, cr, dr, er) +% X[13] +% 0x00000000, 6);
        round(&ar, &br, &cr, &dr, &er, f(0, br, cr, dr) +% X[14] +% 0x00000000, 5);
        round(&er, &ar, &br, &cr, &dr, f(0, ar, br, cr) +% X[0] +% 0x00000000, 15);
        round(&dr, &er, &ar, &br, &cr, f(0, er, ar, br) +% X[3] +% 0x00000000, 13);
        round(&cr, &dr, &er, &ar, &br, f(0, dr, er, ar) +% X[9] +% 0x00000000, 11);
        round(&br, &cr, &dr, &er, &ar, f(0, cr, dr, er) +% X[11] +% 0x00000000, 11);
    }

    // Combine results
    const t = s[1] +% cl +% dr;
    s[1] = s[2] +% dl +% er;
    s[2] = s[3] +% el +% ar;
    s[3] = s[4] +% al +% br;
    s[4] = s[0] +% bl +% cr;
    s[0] = t;
}

// RIPEMD160 round operation
fn round(a: *u32, _: *u32, c: *u32, _: *u32, e: *u32, x: u32, s: u5) void {
    a.* = a.* +% x;
    a.* = rol(a.*, s) +% e.*;
    c.* = rol(c.*, 10);
}

/// ⚠️ UNAUDITED - NOT SECURITY AUDITED ⚠️
/// Compute RIPEMD160 hash of input data
/// WARNING: This is a custom crypto implementation that has not been security audited.
/// May be vulnerable to timing attacks and other cryptographic vulnerabilities.
/// Do not use in production without proper security review.
pub fn unaudited_hash(data: []const u8) [20]u8 {
    var h = RIPEMD160.init();
    h.update(data);
    return h.final();
}
