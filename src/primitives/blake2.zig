const std = @import("std");

/// BLAKE2b initialization vectors
pub const BLAKE2B_IV = [8]u64{
    0x6a09e667f3bcc908, 0xbb67ae8584caa73b, 0x3c6ef372fe94f82b, 0xa54ff53a5f1d36f1,
    0x510e527fade682d1, 0x9b05688c2b3e6c1f, 0x1f83d9abfb41bd6b, 0x5be0cd19137e2179,
};

/// BLAKE2b message schedule (sigma)
pub const BLAKE2B_SIGMA = [12][16]u8{
    .{ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 },
    .{ 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3 },
    .{ 11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4 },
    .{ 7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8 },
    .{ 9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13 },
    .{ 2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9 },
    .{ 12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11 },
    .{ 13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10 },
    .{ 6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5 },
    .{ 10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0 },
    .{ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 },
    .{ 14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3 },
};

/// BLAKE2b mixing function (G function)
pub fn blake2bG(v: *[16]u64, a: usize, b: usize, c: usize, d: usize, x: u64, y: u64) void {
    v[a] = v[a] +% v[b] +% x;
    v[d] = std.math.rotr(u64, v[d] ^ v[a], 32);
    v[c] = v[c] +% v[d];
    v[b] = std.math.rotr(u64, v[b] ^ v[c], 24);
    v[a] = v[a] +% v[b] +% y;
    v[d] = std.math.rotr(u64, v[d] ^ v[a], 16);
    v[c] = v[c] +% v[d];
    v[b] = std.math.rotr(u64, v[b] ^ v[c], 63);
}

/// BLAKE2b compression round
pub fn blake2bRound(v: *[16]u64, message: *const [16]u64, round: u32) void {
    const s = &BLAKE2B_SIGMA[round % 12];
    
    // Column mixing
    blake2bG(v, 0, 4, 8, 12, message[s[0]], message[s[1]]);
    blake2bG(v, 1, 5, 9, 13, message[s[2]], message[s[3]]);
    blake2bG(v, 2, 6, 10, 14, message[s[4]], message[s[5]]);
    blake2bG(v, 3, 7, 11, 15, message[s[6]], message[s[7]]);
    
    // Diagonal mixing
    blake2bG(v, 0, 5, 10, 15, message[s[8]], message[s[9]]);
    blake2bG(v, 1, 6, 11, 12, message[s[10]], message[s[11]]);
    blake2bG(v, 2, 7, 8, 13, message[s[12]], message[s[13]]);
    blake2bG(v, 3, 4, 9, 14, message[s[14]], message[s[15]]);
}

/// BLAKE2b compression function
/// Performs the BLAKE2b compression function F as specified in RFC 7693
pub fn blake2bCompress(state: *[8]u64, message: *const [16]u64, offset: [2]u64, final_block: bool, rounds: u32) void {
    // Working variables
    var v: [16]u64 = undefined;
    
    // Initialize working variables
    for (0..8) |i| {
        v[i] = state[i];
        v[i + 8] = BLAKE2B_IV[i];
    }
    
    // Mix in offset counters
    v[12] ^= offset[0];
    v[13] ^= offset[1];
    
    // Mix in final block flag
    if (final_block) {
        v[14] = ~v[14];
    }
    
    // Perform compression rounds
    for (0..rounds) |round| {
        blake2bRound(&v, message, @intCast(round));
    }
    
    // Finalize state
    for (0..8) |i| {
        state[i] ^= v[i] ^ v[i + 8];
    }
}

/// BLAKE2F compression function wrapper
/// This is the interface used by EIP-152 for the BLAKE2F precompile
pub fn blake2fCompress(h: *[8]u64, m: *const [16]u64, t: [2]u64, f: bool, rounds: u32) void {
    blake2bCompress(h, m, t, f, rounds);
}