const crypto = @import("crypto");

pub fn main() !void {
    const input = "The quick brown fox jumps over the lazy dog";
    var output: [20]u8 = undefined;
    try crypto.HashAlgorithms.RIPEMD160.hash(input, &output);
    _ = &output;
}
