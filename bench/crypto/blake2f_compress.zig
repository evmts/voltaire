const crypto = @import("crypto");

pub fn main() !void {
    var h = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };

    const m = [_]u64{0} ** 16;
    const t = [2]u64{ 0, 0 };

    crypto.HashAlgorithms.BLAKE2F.unauditedCompress(&h, &m, t, true, 12);
}
