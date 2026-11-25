//! Fuzz tests for the BIP-32 HDWallet module.
//!
//! `zig build test` runs each target once per corpus entry.
//! `zig build test --fuzz` mutates inputs continuously.

const std = @import("std");
const HDWallet = @import("hdwallet.zig");

const testing = std.testing;
const HARDENED = HDWallet.HARDENED_OFFSET;

const vector1_seed = [_]u8{ 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f };

fn vector1Root() !HDWallet.ExtendedKey {
    return HDWallet.fromSeed(&vector1_seed);
}

fn readIndex(input: []const u8) u32 {
    var bytes = @as([4]u8, @splat(0));
    const n = @min(input.len, 4);
    @memcpy(bytes[0..n], input[0..n]);
    return std.mem.readInt(u32, &bytes, .big);
}

fn fuzzInput(smith: *testing.Smith, buf: []u8) []const u8 {
    if (smith.in) |raw| return raw;
    return buf[0..smith.slice(buf)];
}

fn seedLength(_: void, smith: *testing.Smith) anyerror!void {
    var input_buf: [128]u8 = undefined;
    const input = fuzzInput(smith, &input_buf);
    const valid = input.len >= HDWallet.MIN_SEED_LENGTH and input.len <= HDWallet.MAX_SEED_LENGTH;
    var a = HDWallet.fromSeed(input) catch |err| {
        // Invalid master keys occur with probability < 2^-127.
        try testing.expect(!valid or err == error.InvalidDerivedKey);
        try testing.expect(valid or err == error.InvalidSeedLength);
        return;
    };
    defer a.zeroize();
    try testing.expect(valid);

    var b = try HDWallet.fromSeed(input);
    defer b.zeroize();
    try testing.expectEqualDeep(a, b);
    try testing.expectEqual(@as(u8, 0), a.depth);
    try testing.expectEqual(@as(u32, 0), a.index);
}

test "fuzz seed length and determinism" {
    try testing.fuzz({}, seedLength, .{ .corpus = &.{
        "",
        &(@as([15]u8, @splat(0))),
        &(@as([16]u8, @splat(0))),
        &(@as([16]u8, @splat(0xff))),
        &(@as([32]u8, @splat(0))),
        &(@as([64]u8, @splat(0xff))),
        &(@as([65]u8, @splat(0))),
        &vector1_seed,
    } });
}

fn pathParsing(_: void, smith: *testing.Smith) anyerror!void {
    var input_buf: [256]u8 = undefined;
    const input = fuzzInput(smith, &input_buf);
    var buf: [HDWallet.MAX_DEPTH]u32 = undefined;
    const parsed = HDWallet.parsePath(input, &buf);
    try testing.expectEqual(HDWallet.isValidPath(input), if (parsed) |_| true else |_| false);

    const indices = parsed catch |err| {
        try testing.expect(err == error.InvalidPath);
        return;
    };

    // A valid path derives exactly like the equivalent deriveChild chain.
    var root = try vector1Root();
    defer root.zeroize();
    var by_path = try HDWallet.derivePath(root, input);
    defer by_path.zeroize();
    var by_child = root;
    for (indices) |index| by_child = try HDWallet.deriveChild(by_child, index);
    defer by_child.zeroize();
    try testing.expectEqualDeep(by_path, by_child);
    try testing.expectEqual(@as(u8, @intCast(indices.len)), by_path.depth);
}

test "fuzz derivation path parsing" {
    try testing.fuzz({}, pathParsing, .{ .corpus = &.{
        "m",
        "M",
        "m/0",
        "m/0'",
        "m/0h/1H/2'",
        "m/44'/60'/0'/0/0",
        "m/44'/0'/0'/0/0",
        "m/2147483647'",
        "m/2147483648'",
        "m/4294967296",
        "",
        "m/",
        "/0",
        "m/a",
        "m/-1",
        "m/1//2",
        "m/0/1/2/3/4/5/6/7/8/9",
    } });
}

fn childIndex(_: void, smith: *testing.Smith) anyerror!void {
    var input_buf: [16]u8 = undefined;
    const input = fuzzInput(smith, &input_buf);
    const index = readIndex(input);
    var root = try vector1Root();
    defer root.zeroize();

    var child = try HDWallet.deriveChild(root, index);
    defer child.zeroize();
    try testing.expectEqual(index, child.index);
    try testing.expectEqual(@as(u8, 1), child.depth);
    try testing.expectEqual(HDWallet.fingerprint(root), child.parent_fingerprint);

    const watch = HDWallet.toPublic(root);
    if (index >= HARDENED) {
        try testing.expectError(error.HardenedFromPublic, HDWallet.deriveChild(watch, index));
        var h = try HDWallet.deriveHardened(root, index & ~HARDENED);
        defer h.zeroize();
        try testing.expectEqualDeep(child, h);
    } else {
        // CKDpub(N(k)) == N(CKDpriv(k)).
        const public_child = try HDWallet.deriveChild(watch, index);
        try testing.expectEqualDeep(HDWallet.toPublic(child), public_child);
        try testing.expectError(error.InvalidIndex, HDWallet.deriveHardened(root, index | HARDENED));

        // Hardened and normal children at the same offset differ.
        var hardened = try HDWallet.deriveChild(root, index | HARDENED);
        defer hardened.zeroize();
        try testing.expect(!std.mem.eql(u8, &child.public_key, &hardened.public_key));
    }
}

test "fuzz child index boundaries" {
    try testing.fuzz({}, childIndex, .{ .corpus = &.{
        &.{ 0x00, 0x00, 0x00, 0x00 },
        &.{ 0x00, 0x00, 0x00, 0x01 },
        &.{ 0x7f, 0xff, 0xff, 0xff },
        &.{ 0x80, 0x00, 0x00, 0x00 },
        &.{ 0x80, 0x00, 0x00, 0x01 },
        &.{ 0xff, 0xff, 0xff, 0xff },
    } });
}

fn extendedKeyParsing(_: void, smith: *testing.Smith) anyerror!void {
    var input_buf: [256]u8 = undefined;
    const input = fuzzInput(smith, &input_buf);
    var key = HDWallet.fromExtendedKey(input) catch return;
    defer key.zeroize();

    // Anything accepted re-encodes to the same string.
    var buf: [HDWallet.MAX_ENCODED_LENGTH]u8 = undefined;
    const encoded = if (key.private_key != null)
        try HDWallet.toExtendedPrivateKey(key, &buf)
    else
        try HDWallet.toExtendedPublicKey(key, &buf);
    try testing.expectEqualStrings(input, encoded);
}

test "fuzz extended key parsing" {
    try testing.fuzz({}, extendedKeyParsing, .{ .corpus = &.{
        "",
        "xprv",
        "xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi",
        "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8",
        "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet9",
        "0OIl+/=",
        "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111",
    } });
}

fn serializationRoundTrip(_: void, smith: *testing.Smith) anyerror!void {
    var input_buf: [128]u8 = undefined;
    const input = fuzzInput(smith, &input_buf);
    if (input.len < 32) return;
    var root = HDWallet.fromSeed(input[0..@min(input.len, HDWallet.MAX_SEED_LENGTH)]) catch return;
    defer root.zeroize();
    var key = try HDWallet.deriveChild(root, readIndex(input));
    defer key.zeroize();

    var buf: [HDWallet.MAX_ENCODED_LENGTH]u8 = undefined;
    var parsed = try HDWallet.fromExtendedKey(try HDWallet.toExtendedPrivateKey(key, &buf));
    defer parsed.zeroize();
    try testing.expectEqualDeep(key, parsed);

    const public = try HDWallet.fromPublicExtendedKey(try HDWallet.toExtendedPublicKey(key, &buf));
    try testing.expectEqualDeep(HDWallet.toPublic(key), public);
    try testing.expectEqual(try HDWallet.getAddress(key), try HDWallet.getAddress(public));
}

test "fuzz extended key round trip" {
    try testing.fuzz({}, serializationRoundTrip, .{ .corpus = &.{
        &(@as([32]u8, @splat(0))),
        &(@as([64]u8, @splat(0xff))),
        &([_]u8{0x80} ++ @as([47]u8, @splat(0x42))),
    } });
}
