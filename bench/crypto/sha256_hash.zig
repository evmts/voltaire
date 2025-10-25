const crypto = @import("crypto");

pub fn main() !void {
    const input = "The quick brown fox jumps over the lazy dog";
    var output: [32]u8 = undefined;
    crypto.HashAlgorithms.SHA256.hash(input, &output);
    _ = output;
}
