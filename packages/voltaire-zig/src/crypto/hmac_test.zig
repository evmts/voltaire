const std = @import("std");

pub fn checkKnownTags(comptime crypto: type) !void {
    // RFC 4231, test case 6. The key exceeds each hash's block length.
    const key = @as([131]u8, @splat(0xaa));
    const message = "Test Using Larger Than Block-Size Key - Hash Key First";
    var sha256_tag: [32]u8 = undefined;
    var sha512_tag: [64]u8 = undefined;
    crypto.hmacSha256(&sha256_tag, message, &key);
    crypto.hmacSha512(&sha512_tag, message, &key);
    try expectHex("60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54", &sha256_tag);
    try expectHex("80b24263c7c1a3ebb71493c1dd7be8b49b46d1f41b4aeec1121b013783f8f352" ++
        "6b56d037e05f2598bd0fd2215d6a1e5295e64f73f63f0aec8b915a985d786598", &sha512_tag);

    const KeccakHmac = crypto.Hmac(crypto.Keccak256);
    const keccak_key = @as([137]u8, @splat(0xaa));
    var keccak_tag: [32]u8 = undefined;
    crypto.hmacKeccak256(&keccak_tag, message, &keccak_key);
    try expectHex("729e0d9f4bb07a089c0093c353f9613ef18430bc2eddb683982cf65ef5429c73", &keccak_tag);

    var streaming = KeccakHmac.init(&keccak_key);
    streaming.update(message[0..10]);
    streaming.update(message[10..]);
    var streamed_tag: [KeccakHmac.mac_length]u8 = undefined;
    streaming.final(&streamed_tag);
    try std.testing.expectEqual(keccak_tag, streamed_tag);
}

fn expectHex(comptime hex: []const u8, actual: []const u8) !void {
    var expected: [hex.len / 2]u8 = undefined;
    _ = try std.fmt.hexToBytes(&expected, hex);
    try std.testing.expectEqualSlices(u8, &expected, actual);
}
