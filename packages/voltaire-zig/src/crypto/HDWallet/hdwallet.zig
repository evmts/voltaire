//! BIP-32 hierarchical deterministic wallets over secp256k1.
//!
//! Pure Zig, allocation-free. An `ExtendedKey` is a plain value: copy it,
//! derive from it, and call `zeroize` when a private key is no longer needed.
//!
//! ```zig
//! const HDWallet = @import("crypto").HDWallet;
//! var root = try HDWallet.fromSeed(&seed);
//! defer root.zeroize();
//! var account = try HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
//! defer account.zeroize();
//! const address = try HDWallet.getAddress(account);
//! ```
//!
//! Spec: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
//!
//! An invalid child (IL >= n, or a zero key / identity point) has probability
//! below 2^-127. BIP-32 says to skip to the next index; this module returns
//! `error.InvalidDerivedKey` and leaves that choice to the caller.

const std = @import("std");
const primitives = @import("primitives");
const Ripemd160 = @import("../ripemd160.zig").Ripemd160;

const Secp256k1 = std.crypto.ecc.Secp256k1;
const HmacSha512 = std.crypto.auth.hmac.sha2.HmacSha512;
const Sha256 = std.crypto.hash.sha2.Sha256;
const Keccak256 = std.crypto.hash.sha3.Keccak256;

/// First hardened child index (2^31).
pub const HARDENED_OFFSET: u32 = 0x80000000;
/// Largest depth an extended key can encode.
pub const MAX_DEPTH: u8 = 255;
/// Smallest seed BIP-32 accepts (128 bits).
pub const MIN_SEED_LENGTH = 16;
/// Largest seed BIP-32 accepts (512 bits).
pub const MAX_SEED_LENGTH = 64;
/// Serialized extended key length before Base58Check.
pub const SERIALIZED_LENGTH = 78;
/// Upper bound on a Base58Check-encoded extended key.
pub const MAX_ENCODED_LENGTH = 112;

/// Mainnet `xprv` version bytes.
pub const VERSION_XPRV: u32 = 0x0488ADE4;
/// Mainnet `xpub` version bytes.
pub const VERSION_XPUB: u32 = 0x0488B21E;

pub const Error = error{
    InvalidSeedLength,
    InvalidPath,
    InvalidIndex,
    InvalidDerivedKey,
    HardenedFromPublic,
    MissingPrivateKey,
    MaxDepthExceeded,
    InvalidBase58,
    InvalidChecksum,
    InvalidExtendedKey,
    InvalidVersion,
    InvalidPrivateKey,
    InvalidPublicKey,
};

pub const ExtendedKey = struct {
    depth: u8,
    parent_fingerprint: [4]u8,
    index: u32,
    chain_code: [32]u8,
    /// Null for public-only (neutered) keys.
    private_key: ?[32]u8,
    /// SEC1 compressed public key.
    public_key: [33]u8,

    /// Overwrite secret material. The key is unusable afterwards.
    pub fn zeroize(self: *ExtendedKey) void {
        if (self.private_key) |*k| std.crypto.secureZero(u8, k);
        std.crypto.secureZero(u8, &self.chain_code);
        self.private_key = null;
    }
};

/// Create the master key from a 16-64 byte seed (HMAC-SHA512 keyed with "Bitcoin seed").
pub fn fromSeed(seed: []const u8) Error!ExtendedKey {
    if (seed.len < MIN_SEED_LENGTH or seed.len > MAX_SEED_LENGTH) return error.InvalidSeedLength;

    var i: [64]u8 = undefined;
    defer std.crypto.secureZero(u8, &i);
    HmacSha512.create(&i, seed, "Bitcoin seed");

    const priv = i[0..32].*;
    const public_key = publicFromPrivate(priv) catch return error.InvalidDerivedKey;
    return .{
        .depth = 0,
        .parent_fingerprint = .{ 0, 0, 0, 0 },
        .index = 0,
        .chain_code = i[32..64].*,
        .private_key = priv,
        .public_key = public_key,
    };
}

/// CKDpriv / CKDpub. Indices >= `HARDENED_OFFSET` need a private key.
pub fn deriveChild(key: ExtendedKey, index: u32) Error!ExtendedKey {
    if (key.depth == MAX_DEPTH) return error.MaxDepthExceeded;

    var data: [37]u8 = undefined;
    defer std.crypto.secureZero(u8, &data);
    if (index >= HARDENED_OFFSET) {
        const priv = key.private_key orelse return error.HardenedFromPublic;
        data[0] = 0;
        data[1..33].* = priv;
    } else {
        data[0..33].* = key.public_key;
    }
    std.mem.writeInt(u32, data[33..37], index, .big);

    var i: [64]u8 = undefined;
    defer std.crypto.secureZero(u8, &i);
    HmacSha512.create(&i, &data, &key.chain_code);

    const il = i[0..32].*;
    Secp256k1.scalar.rejectNonCanonical(il, .big) catch return error.InvalidDerivedKey;

    var child: ExtendedKey = .{
        .depth = key.depth + 1,
        .parent_fingerprint = fingerprint(key),
        .index = index,
        .chain_code = i[32..64].*,
        .private_key = null,
        .public_key = undefined,
    };

    if (key.private_key) |priv| {
        const k = Secp256k1.scalar.add(il, priv, .big) catch return error.InvalidDerivedKey;
        child.public_key = publicFromPrivate(k) catch return error.InvalidDerivedKey;
        child.private_key = k;
    } else {
        const parent = Secp256k1.fromSec1(&key.public_key) catch return error.InvalidPublicKey;
        const tweak = Secp256k1.basePoint.mul(il, .big) catch return error.InvalidDerivedKey;
        const point = tweak.add(parent);
        point.rejectIdentity() catch return error.InvalidDerivedKey;
        child.public_key = point.toCompressedSec1();
    }
    return child;
}

/// Derive hardened child `index'`. `index` must be below `HARDENED_OFFSET`.
pub fn deriveHardened(key: ExtendedKey, index: u32) Error!ExtendedKey {
    if (index >= HARDENED_OFFSET) return error.InvalidIndex;
    return deriveChild(key, index | HARDENED_OFFSET);
}

/// Derive along a BIP-32 path such as `m/44'/60'/0'/0/0`, relative to `key`.
///
/// Accepts `m` or `M`, then `/`-separated decimal indices below 2^31, each
/// optionally hardened with `'`, `h`, or `H`. `m` alone returns `key`.
pub fn derivePath(key: ExtendedKey, path: []const u8) Error!ExtendedKey {
    var it = try PathIterator.init(path);
    var current = key;
    var first = true;
    while (try it.next()) |index| {
        const next = deriveChild(current, index);
        if (!first) current.zeroize();
        current = try next;
        first = false;
    }
    return current;
}

/// Parse `path` into `out`, returning the used prefix.
pub fn parsePath(path: []const u8, out: []u32) Error![]u32 {
    var it = try PathIterator.init(path);
    var n: usize = 0;
    while (try it.next()) |index| {
        if (n == out.len) return error.InvalidPath;
        out[n] = index;
        n += 1;
    }
    return out[0..n];
}

/// True when `parsePath` would accept `path`.
pub fn isValidPath(path: []const u8) bool {
    var it = PathIterator.init(path) catch return false;
    while (it.next() catch return false) |_| {}
    return true;
}

/// Parse one path component (`44`, `44'`, `44h`, `44H`) into a child index.
pub fn parseIndex(component: []const u8) Error!u32 {
    var digits = component;
    var hardened = false;
    if (digits.len > 0) switch (digits[digits.len - 1]) {
        '\'', 'h', 'H' => {
            hardened = true;
            digits = digits[0 .. digits.len - 1];
        },
        else => {},
    };
    if (digits.len == 0) return error.InvalidPath;
    var value: u64 = 0;
    for (digits) |c| {
        if (c < '0' or c > '9') return error.InvalidPath;
        value = value * 10 + (c - '0');
        if (value >= HARDENED_OFFSET) return error.InvalidPath;
    }
    const index: u32 = @intCast(value);
    return if (hardened) index | HARDENED_OFFSET else index;
}

const PathIterator = struct {
    rest: []const u8,
    depth: usize = 0,

    fn init(path: []const u8) Error!PathIterator {
        if (path.len == 0 or (path[0] != 'm' and path[0] != 'M')) return error.InvalidPath;
        if (path.len == 1) return .{ .rest = "" };
        if (path[1] != '/' or path.len == 2) return error.InvalidPath;
        return .{ .rest = path[2..] };
    }

    fn next(self: *PathIterator) Error!?u32 {
        if (self.rest.len == 0) return null;
        const end = std.mem.indexOfScalar(u8, self.rest, '/');
        const component = self.rest[0 .. end orelse self.rest.len];
        if (end) |e| {
            // Trailing slash leaves an empty final component.
            if (e + 1 == self.rest.len) return error.InvalidPath;
            self.rest = self.rest[e + 1 ..];
        } else {
            self.rest = "";
        }
        if (self.depth == MAX_DEPTH) return error.InvalidPath;
        self.depth += 1;
        return try parseIndex(component);
    }
};

/// Ethereum account key at `m/44'/60'/account'/0/index` relative to `key`.
pub fn deriveEthereum(key: ExtendedKey, account: u32, index: u32) Error!ExtendedKey {
    return deriveBip44(key, 60, account, index);
}

/// Bitcoin account key at `m/44'/0'/account'/0/index` relative to `key`.
pub fn deriveBitcoin(key: ExtendedKey, account: u32, index: u32) Error!ExtendedKey {
    return deriveBip44(key, 0, account, index);
}

fn deriveBip44(key: ExtendedKey, coin: u32, account: u32, index: u32) Error!ExtendedKey {
    if (account >= HARDENED_OFFSET or index >= HARDENED_OFFSET) return error.InvalidIndex;
    const path = [_]u32{ 44 | HARDENED_OFFSET, coin | HARDENED_OFFSET, account | HARDENED_OFFSET, 0, index };
    var current = key;
    for (path, 0..) |child, n| {
        const next = deriveChild(current, child);
        if (n != 0) current.zeroize();
        current = try next;
    }
    return current;
}

/// True when `key` holds a private key.
pub fn canDeriveHardened(key: ExtendedKey) bool {
    return key.private_key != null;
}

/// 32-byte private key, or null for public-only keys.
pub fn getPrivateKey(key: ExtendedKey) ?[32]u8 {
    return key.private_key;
}

/// 33-byte SEC1 compressed public key.
pub fn getPublicKey(key: ExtendedKey) [33]u8 {
    return key.public_key;
}

/// 32-byte chain code.
pub fn getChainCode(key: ExtendedKey) [32]u8 {
    return key.chain_code;
}

/// Ethereum address: last 20 bytes of keccak256 of the uncompressed public key.
pub fn getAddress(key: ExtendedKey) Error!primitives.Address {
    const point = Secp256k1.fromSec1(&key.public_key) catch return error.InvalidPublicKey;
    const uncompressed = point.toUncompressedSec1();
    var hash: [32]u8 = undefined;
    Keccak256.hash(uncompressed[1..], &hash, .{});
    var address: primitives.Address = undefined;
    @memcpy(&address.bytes, hash[12..32]);
    return address;
}

/// First four bytes of HASH160(public key).
pub fn fingerprint(key: ExtendedKey) [4]u8 {
    var sha: [32]u8 = undefined;
    Sha256.hash(&key.public_key, &sha, .{});
    var ripe: [20]u8 = undefined;
    Ripemd160.hash(&sha, &ripe);
    return ripe[0..4].*;
}

/// Copy of `key` without its private key.
pub fn toPublic(key: ExtendedKey) ExtendedKey {
    var public = key;
    public.private_key = null;
    return public;
}

/// 78-byte BIP-32 serialization. `private` selects xprv; it needs a private key.
pub fn serialize(key: ExtendedKey, private: bool) Error![SERIALIZED_LENGTH]u8 {
    var out: [SERIALIZED_LENGTH]u8 = undefined;
    std.mem.writeInt(u32, out[0..4], if (private) VERSION_XPRV else VERSION_XPUB, .big);
    out[4] = key.depth;
    out[5..9].* = key.parent_fingerprint;
    std.mem.writeInt(u32, out[9..13], key.index, .big);
    out[13..45].* = key.chain_code;
    if (private) {
        const priv = key.private_key orelse return error.MissingPrivateKey;
        out[45] = 0;
        out[46..78].* = priv;
    } else {
        out[45..78].* = key.public_key;
    }
    return out;
}

/// Base58Check `xprv...` string written into `out`.
pub fn toExtendedPrivateKey(key: ExtendedKey, out: *[MAX_ENCODED_LENGTH]u8) Error![]const u8 {
    var raw = try serialize(key, true);
    defer std.crypto.secureZero(u8, &raw);
    return base58CheckEncode(&raw, out);
}

/// Base58Check `xpub...` string written into `out`.
pub fn toExtendedPublicKey(key: ExtendedKey, out: *[MAX_ENCODED_LENGTH]u8) Error![]const u8 {
    const raw = try serialize(key, false);
    return base58CheckEncode(&raw, out);
}

/// Parse an `xprv` or `xpub` string.
pub fn fromExtendedKey(encoded: []const u8) Error!ExtendedKey {
    var raw: [SERIALIZED_LENGTH + 4]u8 = undefined;
    defer std.crypto.secureZero(u8, &raw);
    try base58CheckDecode(encoded, &raw);

    const version = std.mem.readInt(u32, raw[0..4], .big);
    var key: ExtendedKey = .{
        .depth = raw[4],
        .parent_fingerprint = raw[5..9].*,
        .index = std.mem.readInt(u32, raw[9..13], .big),
        .chain_code = raw[13..45].*,
        .private_key = null,
        .public_key = undefined,
    };
    if (key.depth == 0 and (key.index != 0 or !std.mem.allEqual(u8, &key.parent_fingerprint, 0)))
        return error.InvalidExtendedKey;

    const material = raw[45..78];
    switch (version) {
        VERSION_XPRV => {
            if (material[0] != 0) return error.InvalidPrivateKey;
            const priv = material[1..33].*;
            key.public_key = publicFromPrivate(priv) catch return error.InvalidPrivateKey;
            key.private_key = priv;
        },
        VERSION_XPUB => {
            if (material[0] != 0x02 and material[0] != 0x03) return error.InvalidPublicKey;
            _ = Secp256k1.fromSec1(material) catch return error.InvalidPublicKey;
            key.public_key = material.*;
        },
        else => return error.InvalidVersion,
    }
    return key;
}

/// Parse an `xpub` string. Rejects `xprv`.
pub fn fromPublicExtendedKey(encoded: []const u8) Error!ExtendedKey {
    var key = try fromExtendedKey(encoded);
    if (key.private_key != null) {
        key.zeroize();
        return error.InvalidVersion;
    }
    return key;
}

/// Rejects zero and keys >= n.
fn publicFromPrivate(priv: [32]u8) Error![33]u8 {
    if (std.mem.allEqual(u8, &priv, 0)) return error.InvalidPrivateKey;
    Secp256k1.scalar.rejectNonCanonical(priv, .big) catch return error.InvalidPrivateKey;
    const point = Secp256k1.basePoint.mul(priv, .big) catch return error.InvalidPrivateKey;
    return point.toCompressedSec1();
}

const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

fn checksum(data: []const u8) [4]u8 {
    var first: [32]u8 = undefined;
    Sha256.hash(data, &first, .{});
    var second: [32]u8 = undefined;
    Sha256.hash(&first, &second, .{});
    return second[0..4].*;
}

fn base58CheckEncode(raw: *const [SERIALIZED_LENGTH]u8, out: *[MAX_ENCODED_LENGTH]u8) []const u8 {
    var data: [SERIALIZED_LENGTH + 4]u8 = undefined;
    defer std.crypto.secureZero(u8, &data);
    data[0..SERIALIZED_LENGTH].* = raw.*;
    data[SERIALIZED_LENGTH..].* = checksum(raw);

    // Little-endian base-58 digits.
    var digits: [MAX_ENCODED_LENGTH]u8 = undefined;
    defer std.crypto.secureZero(u8, &digits);
    var len: usize = 0;
    for (data) |byte| {
        var carry: u32 = byte;
        for (digits[0..len]) |*d| {
            carry += @as(u32, d.*) << 8;
            d.* = @intCast(carry % 58);
            carry /= 58;
        }
        while (carry > 0) {
            digits[len] = @intCast(carry % 58);
            len += 1;
            carry /= 58;
        }
    }

    var n: usize = 0;
    for (data) |byte| {
        if (byte != 0) break;
        out[n] = '1';
        n += 1;
    }
    var d = len;
    while (d > 0) {
        d -= 1;
        out[n] = alphabet[digits[d]];
        n += 1;
    }
    return out[0..n];
}

fn base58CheckDecode(encoded: []const u8, out: *[SERIALIZED_LENGTH + 4]u8) Error!void {
    if (encoded.len == 0 or encoded.len > MAX_ENCODED_LENGTH) return error.InvalidExtendedKey;

    // Little-endian bytes.
    var bytes: [SERIALIZED_LENGTH + 4]u8 = undefined;
    defer std.crypto.secureZero(u8, &bytes);
    var len: usize = 0;
    for (encoded) |c| {
        const value = std.mem.indexOfScalar(u8, alphabet, c) orelse return error.InvalidBase58;
        var carry: u32 = @intCast(value);
        for (bytes[0..len]) |*b| {
            carry += @as(u32, b.*) * 58;
            b.* = @truncate(carry);
            carry >>= 8;
        }
        while (carry > 0) {
            if (len == bytes.len) return error.InvalidExtendedKey;
            bytes[len] = @truncate(carry);
            len += 1;
            carry >>= 8;
        }
    }

    var zeros: usize = 0;
    while (zeros < encoded.len and encoded[zeros] == '1') zeros += 1;
    if (zeros + len != out.len) return error.InvalidExtendedKey;
    @memset(out[0..zeros], 0);
    for (0..len) |n| out[zeros + n] = bytes[len - 1 - n];

    const expected = checksum(out[0..SERIALIZED_LENGTH]);
    if (!std.mem.eql(u8, &expected, out[SERIALIZED_LENGTH..])) return error.InvalidChecksum;
}

// ============================================================================
// Tests
// ============================================================================

const testing = std.testing;

fn expectXprv(root: ExtendedKey, path: []const u8, expected: []const u8) !void {
    var key = try derivePath(root, path);
    defer key.zeroize();
    var buf: [MAX_ENCODED_LENGTH]u8 = undefined;
    try testing.expectEqualStrings(expected, try toExtendedPrivateKey(key, &buf));

    // Round trip.
    var parsed = try fromExtendedKey(expected);
    defer parsed.zeroize();
    try testing.expectEqualDeep(key, parsed);
}

fn expectXpub(root: ExtendedKey, path: []const u8, expected: []const u8) !void {
    const key = try derivePath(root, path);
    var buf: [MAX_ENCODED_LENGTH]u8 = undefined;
    try testing.expectEqualStrings(expected, try toExtendedPublicKey(key, &buf));
    const parsed = try fromPublicExtendedKey(expected);
    try testing.expectEqualDeep(toPublic(key), parsed);
}

test "BIP-32 test vector 1" {
    var seed: [16]u8 = undefined;
    _ = try std.fmt.hexToBytes(&seed, "000102030405060708090a0b0c0d0e0f");
    var root = try fromSeed(&seed);
    defer root.zeroize();

    try expectXprv(root, "m", "xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi");
    try expectXpub(root, "m", "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8");
    try expectXprv(root, "m/0'", "xprv9uHRZZhk6KAJC1avXpDAp4MDc3sQKNxDiPvvkX8Br5ngLNv1TxvUxt4cV1rGL5hj6KCesnDYUhd7oWgT11eZG7XnxHrnYeSvkzY7d2bhkJ7");
    try expectXpub(root, "m/0H", "xpub68Gmy5EdvgibQVfPdqkBBCHxA5htiqg55crXYuXoQRKfDBFA1WEjWgP6LHhwBZeNK1VTsfTFUHCdrfp1bgwQ9xv5ski8PX9rL2dZXvgGDnw");
    try expectXprv(root, "m/0'/1", "xprv9wTYmMFdV23N2TdNG573QoEsfRrWKQgWeibmLntzniatZvR9BmLnvSxqu53Kw1UmYPxLgboyZQaXwTCg8MSY3H2EU4pWcQDnRnrVA1xe8fs");
    try expectXpub(root, "m/0h/1", "xpub6ASuArnXKPbfEwhqN6e3mwBcDTgzisQN1wXN9BJcM47sSikHjJf3UFHKkNAWbWMiGj7Wf5uMash7SyYq527Hqck2AxYysAA7xmALppuCkwQ");
    try expectXprv(root, "m/0'/1/2'", "xprv9z4pot5VBttmtdRTWfWQmoH1taj2axGVzFqSb8C9xaxKymcFzXBDptWmT7FwuEzG3ryjH4ktypQSAewRiNMjANTtpgP4mLTj34bhnZX7UiM");
    try expectXprv(root, "m/0'/1/2'/2", "xprvA2JDeKCSNNZky6uBCviVfJSKyQ1mDYahRjijr5idH2WwLsEd4Hsb2Tyh8RfQMuPh7f7RtyzTtdrbdqqsunu5Mm3wDvUAKRHSC34sJ7in334");
    try expectXprv(root, "m/0'/1/2'/2/1000000000", "xprvA41z7zogVVwxVSgdKUHDy1SKmdb533PjDz7J6N6mV6uS3ze1ai8FHa8kmHScGpWmj4WggLyQjgPie1rFSruoUihUZREPSL39UNdE3BBDu76");
}

test "BIP-32 test vector 2" {
    var seed: [64]u8 = undefined;
    _ = try std.fmt.hexToBytes(&seed, "fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542");
    var root = try fromSeed(&seed);
    defer root.zeroize();

    try expectXprv(root, "m", "xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U");
    try expectXprv(root, "m/0", "xprv9vHkqa6EV4sPZHYqZznhT2NPtPCjKuDKGY38FBWLvgaDx45zo9WQRUT3dKYnjwih2yJD9mkrocEZXo1ex8G81dwSM1fwqWpWkeS3v86pgKt");
    try expectXprv(root, "m/0/2147483647'", "xprv9wSp6B7kry3Vj9m1zSnLvN3xH8RdsPP1Mh7fAaR7aRLcQMKTR2vidYEeEg2mUCTAwCd6vnxVrcjfy2kRgVsFawNzmjuHc2YmYRmagcEPdU9");
    try expectXprv(root, "m/0/2147483647'/1", "xprv9zFnWC6h2cLgpmSA46vutJzBcfJ8yaJGg8cX1e5StJh45BBciYTRXSd25UEPVuesF9yog62tGAQtHjXajPPdbRCHuWS6T8XA2ECKADdw4Ef");
    try expectXprv(root, "m/0/2147483647'/1/2147483646'", "xprvA1RpRA33e1JQ7ifknakTFpgNXPmW2YvmhqLQYMmrj4xJXXWYpDPS3xz7iAxn8L39njGVyuoseXzU6rcxFLJ8HFsTjSyQbLYnMpCqE2VbFWc");
    try expectXprv(root, "m/0/2147483647'/1/2147483646'/2", "xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j");
}

test "BIP-32 test vector 3 keeps leading zeros" {
    var seed: [64]u8 = undefined;
    _ = try std.fmt.hexToBytes(&seed, "4b381541583be4423346c643850da4b320e46a87ae3d2a4e6da11eba819cd4acba45d239319ac14f863b8d5ab5a0d0c64d2e8a1e7d1457df2e5a3c51c73235be");
    var root = try fromSeed(&seed);
    defer root.zeroize();

    try expectXprv(root, "m", "xprv9s21ZrQH143K25QhxbucbDDuQ4naNntJRi4KUfWT7xo4EKsHt2QJDu7KXp1A3u7Bi1j8ph3EGsZ9Xvz9dGuVrtHHs7pXeTzjuxBrCmmhgC6");
    try expectXprv(root, "m/0'", "xprv9uPDJpEQgRQfDcW7BkF7eTya6RPxXeJCqCJGHuCJ4GiRVLzkTXBAJMu2qaMWPrS7AANYqdq6vcBcBUdJCVVFceUvJFjaPdGZ2y9WACViL4L");
}

test "public derivation matches private derivation" {
    var seed: [16]u8 = undefined;
    _ = try std.fmt.hexToBytes(&seed, "000102030405060708090a0b0c0d0e0f");
    var root = try fromSeed(&seed);
    defer root.zeroize();

    var account = try derivePath(root, "m/44'/60'/0'");
    defer account.zeroize();
    const watch = toPublic(account);
    try testing.expect(!canDeriveHardened(watch));
    try testing.expectError(error.HardenedFromPublic, deriveChild(watch, HARDENED_OFFSET));
    try testing.expectError(error.HardenedFromPublic, derivePath(watch, "m/0'"));

    var private_child = try derivePath(account, "m/0/7");
    defer private_child.zeroize();
    const public_child = try derivePath(watch, "m/0/7");
    try testing.expect(getPrivateKey(public_child) == null);
    try testing.expectEqualDeep(toPublic(private_child), public_child);
    try testing.expectEqual(try getAddress(private_child), try getAddress(public_child));
}

test "Ethereum addresses from BIP-39 mnemonics" {
    const bip39 = @import("../bip39.zig");
    const cases = [_]struct { mnemonic: []const u8, address: []const u8, private_key: ?[]const u8 }{
        .{
            .mnemonic = "test test test test test test test test test test test junk",
            .address = "f39fd6e51aad88f6f4ce6ab8827279cfffb92266",
            .private_key = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
        },
        .{
            .mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
            .address = "9858effd232b4033e47d90003d41ec34ecaeda94",
            .private_key = null,
        },
    };
    for (cases) |case| {
        var seed: [64]u8 = undefined;
        try bip39.mnemonicStringToSeed(case.mnemonic, "", &seed);
        var root = try fromSeed(&seed);
        defer root.zeroize();

        var by_path = try derivePath(root, "m/44'/60'/0'/0/0");
        defer by_path.zeroize();
        var by_helper = try deriveEthereum(root, 0, 0);
        defer by_helper.zeroize();
        try testing.expectEqualDeep(by_path, by_helper);

        const address = try getAddress(by_path);
        try testing.expectEqualStrings(case.address, &std.fmt.bytesToHex(address.bytes, .lower));
        if (case.private_key) |expected| {
            try testing.expectEqualStrings(expected, &std.fmt.bytesToHex(getPrivateKey(by_path).?, .lower));
        }
    }
}

test "deriveBitcoin and deriveHardened" {
    var seed: [16]u8 = undefined;
    _ = try std.fmt.hexToBytes(&seed, "000102030405060708090a0b0c0d0e0f");
    var root = try fromSeed(&seed);
    defer root.zeroize();

    var a = try deriveBitcoin(root, 2, 5);
    defer a.zeroize();
    var b = try derivePath(root, "m/44'/0'/2'/0/5");
    defer b.zeroize();
    try testing.expectEqualDeep(a, b);
    try testing.expectEqual(@as(u8, 5), a.depth);
    try testing.expectEqual(@as(u32, 5), a.index);

    var h = try deriveHardened(root, 0);
    defer h.zeroize();
    var p = try derivePath(root, "m/0'");
    defer p.zeroize();
    try testing.expectEqualDeep(h, p);
    try testing.expectEqual(HARDENED_OFFSET, h.index);
    try testing.expectEqual(fingerprint(root), h.parent_fingerprint);

    try testing.expectError(error.InvalidIndex, deriveHardened(root, HARDENED_OFFSET));
    try testing.expectError(error.InvalidIndex, deriveEthereum(root, HARDENED_OFFSET, 0));
    try testing.expectError(error.InvalidIndex, deriveBitcoin(root, 0, HARDENED_OFFSET));
}

test "fromSeed rejects seed lengths outside 16..64" {
    const big = @as([65]u8, @splat(1));
    try testing.expectError(error.InvalidSeedLength, fromSeed(big[0..0]));
    try testing.expectError(error.InvalidSeedLength, fromSeed(big[0..15]));
    try testing.expectError(error.InvalidSeedLength, fromSeed(big[0..65]));
    _ = try fromSeed(big[0..16]);
    _ = try fromSeed(big[0..64]);
}

test "path parsing" {
    var buf: [8]u32 = undefined;
    try testing.expectEqualSlices(u32, &.{}, try parsePath("m", &buf));
    try testing.expectEqualSlices(u32, &.{ 0x7fffffff, 0xffffffff, 0x80000000, 0x80000001 }, try parsePath("M/2147483647/2147483647'/0h/1H", &buf));
    try testing.expectEqualSlices(u32, &.{ 44 | HARDENED_OFFSET, 60 | HARDENED_OFFSET, HARDENED_OFFSET, 0, 0 }, try parsePath("m/44'/60'/0'/0/0", &buf));
    try testing.expectError(error.InvalidPath, parsePath("m/1/2/3", buf[0..2]));

    const invalid = [_][]const u8{
        "",                       "m/",   "/0",           "0",             "44'/60'", "m/a",
        "m/-1",                   "m/+1", "m/1e3",        "m/0x10",        "m/12abc", "m/1//2",
        "m//1",                   "m/1/", "m/2147483648", "m/2147483648'", "m/'",     "m/0''",
        "m/99999999999999999999", "mm/0", "m0",           "m/ 1",
    };
    for (invalid) |path| {
        try testing.expect(!isValidPath(path));
        try testing.expectError(error.InvalidPath, parsePath(path, &buf));
    }
    try testing.expect(isValidPath("m/0/1/2/3/4/5/6/7/8/9"));

    var deep: [2 + 4 * 256]u8 = undefined;
    deep[0..2].* = "m/".*;
    var n: usize = 2;
    for (0..256) |level| {
        if (level != 0) {
            deep[n] = '/';
            n += 1;
        }
        deep[n..][0..1].* = "0".*;
        n += 1;
    }
    try testing.expect(!isValidPath(deep[0..n]));
    try testing.expect(isValidPath(deep[0 .. n - 2]));
}

test "derivation stops at depth 255" {
    var seed: [16]u8 = undefined;
    _ = try std.fmt.hexToBytes(&seed, "000102030405060708090a0b0c0d0e0f");
    var key = toPublic(try fromSeed(&seed));
    key.depth = MAX_DEPTH;
    try testing.expectError(error.MaxDepthExceeded, deriveChild(key, 0));
}

test "fromExtendedKey rejects malformed input" {
    const xprv = "xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi";
    const xpub = "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8";

    try testing.expectError(error.InvalidVersion, fromPublicExtendedKey(xprv));
    try testing.expectError(error.InvalidExtendedKey, fromExtendedKey(""));
    try testing.expectError(error.InvalidExtendedKey, fromExtendedKey(xprv[0 .. xprv.len - 1]));
    try testing.expectError(error.InvalidExtendedKey, fromExtendedKey(xprv ++ "1"));
    try testing.expectError(error.InvalidBase58, fromExtendedKey("xprv0" ++ xprv[5..]));

    var corrupt = xpub.*;
    corrupt[corrupt.len - 1] = if (corrupt[corrupt.len - 1] == '8') '9' else '8';
    try testing.expectError(error.InvalidChecksum, fromExtendedKey(&corrupt));

    // Re-encode tampered payloads with a valid checksum.
    var seed: [16]u8 = undefined;
    _ = try std.fmt.hexToBytes(&seed, "000102030405060708090a0b0c0d0e0f");
    var root = try fromSeed(&seed);
    defer root.zeroize();
    var buf: [MAX_ENCODED_LENGTH]u8 = undefined;

    const Tamper = struct { private: bool, offset: usize, bytes: []const u8, err: Error };
    const cases = [_]Tamper{
        .{ .private = true, .offset = 0, .bytes = &.{ 0x04, 0x35, 0x83, 0x94 }, .err = error.InvalidVersion }, // tprv
        .{ .private = true, .offset = 5, .bytes = &.{1}, .err = error.InvalidExtendedKey }, // depth 0, nonzero fingerprint
        .{ .private = false, .offset = 12, .bytes = &.{1}, .err = error.InvalidExtendedKey }, // depth 0, nonzero index
        .{ .private = true, .offset = 45, .bytes = &.{1}, .err = error.InvalidPrivateKey }, // missing 0x00 prefix
        .{ .private = true, .offset = 46, .bytes = &(@as([32]u8, @splat(0))), .err = error.InvalidPrivateKey }, // k = 0
        .{ .private = true, .offset = 46, .bytes = &(@as([32]u8, @splat(0xff))), .err = error.InvalidPrivateKey }, // k >= n
        .{ .private = false, .offset = 45, .bytes = &.{0x04}, .err = error.InvalidPublicKey }, // bad prefix
        .{ .private = false, .offset = 45, .bytes = &.{0x00}, .err = error.InvalidPublicKey },
        .{ .private = false, .offset = 46, .bytes = &(@as([32]u8, @splat(0xff))), .err = error.InvalidPublicKey }, // x >= p
    };
    for (cases) |case| {
        var raw = try serialize(root, case.private);
        @memcpy(raw[case.offset..][0..case.bytes.len], case.bytes);
        try testing.expectError(case.err, fromExtendedKey(base58CheckEncode(&raw, &buf)));
    }

    const public = toPublic(root);
    try testing.expectError(error.MissingPrivateKey, toExtendedPrivateKey(public, &buf));
}
