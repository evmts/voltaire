//! BIP-32/44 Hierarchical Deterministic Wallet
//!
//! Implementation powered by eth.zig.
//! Supports BIP-32 key derivation, BIP-44 Ethereum paths, and BIP-39 mnemonics.
//!
//! ## Usage
//!
//! ```zig
//! const hdwallet = @import("crypto").hdwallet;
//!
//! // From mnemonic
//! const words = [_][]const u8{ "abandon", "abandon", ... , "about" };
//! const seed = try hdwallet.Mnemonic.toSeed(&words, "");
//! const wallet = try hdwallet.HDWallet.fromSeed(seed);
//! const eth_wallet = try wallet.deriveEthereum(0);
//! const addr = eth_wallet.getAddress();
//! ```

const std = @import("std");
const eth = @import("eth_zig");

/// BIP-32 Hierarchical Deterministic wallet.
/// Wraps a BIP-32 extended key (private key + chain code).
pub const HDWallet = struct {
    extended_key: eth.hd_wallet.ExtendedKey,

    /// Create a master HD wallet from a 64-byte BIP-39 seed.
    pub fn fromSeed(seed: [64]u8) !HDWallet {
        const key = eth.hd_wallet.masterKeyFromSeed(seed) catch return error.InvalidSeed;
        return .{ .extended_key = key };
    }

    /// Derive a child key at the given BIP-32 index.
    /// Use `index | HARDENED` for hardened derivation.
    pub fn deriveChild(self: HDWallet, index: u32) !HDWallet {
        const child = eth.hd_wallet.deriveChild(self.extended_key, index) catch return error.DerivationFailed;
        return .{ .extended_key = child };
    }

    /// Derive a key from a BIP-32 path string (e.g., "m/44'/60'/0'/0/0").
    pub fn derivePath(seed: [64]u8, path: []const u8) !HDWallet {
        const key = eth.hd_wallet.derivePath(seed, path) catch return error.InvalidPath;
        return .{ .extended_key = key };
    }

    /// Derive an Ethereum account at BIP-44 path m/44'/60'/0'/0/{account_index}
    /// from the current key. Assumes self is the master key.
    pub fn deriveEthereum(self: HDWallet, account_index: u32) !HDWallet {
        var key = self.extended_key;
        key = eth.hd_wallet.deriveChild(key, 44 | HARDENED) catch return error.DerivationFailed;
        key = eth.hd_wallet.deriveChild(key, ETH_COIN_TYPE | HARDENED) catch return error.DerivationFailed;
        key = eth.hd_wallet.deriveChild(key, 0 | HARDENED) catch return error.DerivationFailed;
        key = eth.hd_wallet.deriveChild(key, 0) catch return error.DerivationFailed;
        key = eth.hd_wallet.deriveChild(key, account_index) catch return error.DerivationFailed;
        return .{ .extended_key = key };
    }

    /// Convenience: derive Ethereum account directly from seed.
    pub fn deriveEthereumFromSeed(seed: [64]u8, account_index: u32) !HDWallet {
        const key = eth.hd_wallet.deriveEthAccount(seed, account_index) catch return error.DerivationFailed;
        return .{ .extended_key = key };
    }

    /// Get the raw 32-byte private key.
    pub fn getPrivateKey(self: HDWallet) [32]u8 {
        return self.extended_key.key;
    }

    /// Get the compressed 33-byte public key (SEC1 format).
    pub fn getPublicKey(self: HDWallet) [33]u8 {
        const Secp256k1 = std.crypto.ecc.Secp256k1;
        const privkey_scalar = Secp256k1.scalar.Scalar.fromBytes(self.extended_key.key, .big) catch return std.mem.zeroes([33]u8);
        const pubkey_point = Secp256k1.basePoint.mul(privkey_scalar.toBytes(.big), .big) catch return std.mem.zeroes([33]u8);
        return pubkey_point.toCompressedSec1();
    }

    /// Get the 20-byte Ethereum address derived from the private key.
    pub fn getAddress(self: HDWallet) [20]u8 {
        return self.extended_key.toAddress();
    }

    /// Get the 32-byte chain code.
    pub fn getChainCode(self: HDWallet) [32]u8 {
        return self.extended_key.chain_code;
    }

    /// Check if a derivation index is hardened.
    pub fn isHardened(index: u32) bool {
        return (index & HARDENED) != 0;
    }
};

/// Hardened derivation flag (BIP-32).
pub const HARDENED: u32 = eth.hd_wallet.HARDENED;

/// BIP-44 Ethereum coin type.
pub const ETH_COIN_TYPE: u32 = eth.hd_wallet.ETH_COIN_TYPE;

/// BIP-39 mnemonic phrase utilities.
pub const Mnemonic = struct {
    /// Generate a random 12-word mnemonic.
    pub fn generate() [12][]const u8 {
        return eth.mnemonic.generate(.@"128");
    }

    /// Generate a random 24-word mnemonic.
    pub fn generate24() [24][]const u8 {
        return eth.mnemonic.generate(.@"256");
    }

    /// Derive a 64-byte seed from mnemonic words and optional passphrase.
    /// Uses PBKDF2-HMAC-SHA512 with 2048 iterations per BIP-39.
    pub fn toSeed(words: []const []const u8, passphrase: []const u8) ![64]u8 {
        return eth.mnemonic.toSeed(words, passphrase);
    }

    /// Validate a mnemonic phrase (word count + checksum).
    pub fn validate(words: []const []const u8) !void {
        eth.mnemonic.validate(words) catch return error.InvalidMnemonic;
    }

    /// Convert entropy bytes to a 12-word mnemonic.
    pub fn fromEntropy128(entropy: *const [16]u8) [12][]const u8 {
        return eth.mnemonic.entropyToMnemonic(.@"128", entropy);
    }

    /// Convert entropy bytes to a 24-word mnemonic.
    pub fn fromEntropy256(entropy: *const [32]u8) [24][]const u8 {
        return eth.mnemonic.entropyToMnemonic(.@"256", entropy);
    }
};

// ============================================================================
// Tests
// ============================================================================

test "HDWallet: fromSeed produces deterministic results" {
    const seed = [_]u8{0x01} ** 64;
    const w1 = try HDWallet.fromSeed(seed);
    const w2 = try HDWallet.fromSeed(seed);
    try std.testing.expectEqualSlices(u8, &w1.getPrivateKey(), &w2.getPrivateKey());
    try std.testing.expectEqualSlices(u8, &w1.getChainCode(), &w2.getChainCode());
}

test "HDWallet: deriveChild produces different keys for different indices" {
    const seed = [_]u8{0x42} ** 64;
    const master = try HDWallet.fromSeed(seed);
    const child0 = try master.deriveChild(HARDENED);
    const child1 = try master.deriveChild(1 | HARDENED);
    try std.testing.expect(!std.mem.eql(u8, &child0.getPrivateKey(), &child1.getPrivateKey()));
}

test "HDWallet: derivePath matches deriveEthereumFromSeed" {
    const seed = [_]u8{0xab} ** 64;
    const key_path = try HDWallet.derivePath(seed, "m/44'/60'/0'/0/0");
    const key_eth = try HDWallet.deriveEthereumFromSeed(seed, 0);
    try std.testing.expectEqualSlices(u8, &key_path.getPrivateKey(), &key_eth.getPrivateKey());
}

test "HDWallet: deriveEthereum matches deriveEthereumFromSeed" {
    const seed = [_]u8{0xab} ** 64;
    const master = try HDWallet.fromSeed(seed);
    const from_master = try master.deriveEthereum(0);
    const from_seed = try HDWallet.deriveEthereumFromSeed(seed, 0);
    try std.testing.expectEqualSlices(u8, &from_seed.getPrivateKey(), &from_master.getPrivateKey());
    try std.testing.expectEqualSlices(u8, &from_seed.getAddress(), &from_master.getAddress());
}

test "HDWallet: getAddress produces 20-byte non-zero address" {
    const seed = [_]u8{0xef} ** 64;
    const wallet = try HDWallet.deriveEthereumFromSeed(seed, 0);
    const addr = wallet.getAddress();
    var all_zero = true;
    for (addr) |b| {
        if (b != 0) {
            all_zero = false;
            break;
        }
    }
    try std.testing.expect(!all_zero);
}

test "HDWallet: different accounts produce different addresses" {
    const seed = [_]u8{0x11} ** 64;
    const w0 = try HDWallet.deriveEthereumFromSeed(seed, 0);
    const w1 = try HDWallet.deriveEthereumFromSeed(seed, 1);
    try std.testing.expect(!std.mem.eql(u8, &w0.getAddress(), &w1.getAddress()));
}

test "HDWallet: getPublicKey returns compressed 33-byte key" {
    const seed = [_]u8{0x33} ** 64;
    const wallet = try HDWallet.fromSeed(seed);
    const pubkey = wallet.getPublicKey();
    // Compressed SEC1 starts with 0x02 or 0x03
    try std.testing.expect(pubkey[0] == 0x02 or pubkey[0] == 0x03);
}

test "HDWallet: known mnemonic abandon...about to exact address" {
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "about",
    };
    const seed = try Mnemonic.toSeed(&words, "");
    const wallet = try HDWallet.deriveEthereumFromSeed(seed, 0);
    const addr = wallet.getAddress();

    // Well-known address for "abandon...about" mnemonic, account 0
    const expected = [20]u8{ 0x98, 0x58, 0xEf, 0xFD, 0x23, 0x2B, 0x40, 0x33, 0xE4, 0x7d, 0x90, 0x00, 0x3D, 0x41, 0xEC, 0x34, 0xEc, 0xaE, 0xda, 0x94 };
    try std.testing.expectEqualSlices(u8, &expected, &addr);
}

test "HDWallet: BIP-39 TREZOR passphrase exact seed vector" {
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "about",
    };
    const seed = try Mnemonic.toSeed(&words, "TREZOR");
    // First 32 bytes of the known BIP-39 test vector
    const expected_first32 = [32]u8{
        0xc5, 0x52, 0x57, 0xc3, 0x60, 0xc0, 0x7c, 0x72,
        0x02, 0x9a, 0xeb, 0xc1, 0xb5, 0x3c, 0x05, 0xed,
        0x03, 0x62, 0xad, 0xa3, 0x8e, 0xad, 0x3e, 0x3e,
        0x7e, 0x24, 0x05, 0x2f, 0x0b, 0x7c, 0x87, 0xc2,
    };
    try std.testing.expectEqualSlices(u8, &expected_first32, seed[0..32]);
}

test "Mnemonic: validate accepts known valid mnemonic" {
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "about",
    };
    try Mnemonic.validate(&words);
}

test "Mnemonic: validate rejects bad checksum" {
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon",
    };
    try std.testing.expectError(error.InvalidMnemonic, Mnemonic.validate(&words));
}

test "Mnemonic: fromEntropy128 known vector" {
    const entropy = [_]u8{0} ** 16;
    const words = Mnemonic.fromEntropy128(&entropy);
    for (0..11) |i| {
        try std.testing.expectEqualStrings("abandon", words[i]);
    }
    try std.testing.expectEqualStrings("about", words[11]);
}

test "isHardened" {
    try std.testing.expect(HDWallet.isHardened(0x80000000));
    try std.testing.expect(HDWallet.isHardened(44 | HARDENED));
    try std.testing.expect(!HDWallet.isHardened(0));
    try std.testing.expect(!HDWallet.isHardened(44));
}
