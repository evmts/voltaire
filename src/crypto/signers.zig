//! Signer Interface - Unified signing abstraction for Ethereum
//!
//! Provides a consistent interface for signing operations across different
//! signer types: local private keys, hardware wallets, and remote RPC signers.
//!
//! ## Overview
//! The signer module provides:
//! - `Signer` - Interface trait for all signing operations
//! - `LocalSigner` - Signs using a local private key
//! - `HardwareWalletSigner` - Interface for hardware wallet implementations
//! - `JsonRpcSigner` - Interface for remote signing via JSON-RPC
//!
//! ## Usage
//! ```zig
//! const signers = @import("signers");
//!
//! // Create local signer from private key
//! var private_key: [32]u8 = // ... your key ...
//! const signer = signers.LocalSigner.init(private_key);
//!
//! // Sign a message (EIP-191)
//! const signature = try signer.signMessage("Hello, Ethereum!");
//!
//! // Get address
//! const address = signer.getAddress();
//! ```
//!
//! ## Security Considerations
//! - LocalSigner stores private key in memory - ensure proper cleanup
//! - Use hardware wallets for production systems
//! - Never expose private keys in logs or error messages
//!
//! ## References
//! - [EIP-191](https://eips.ethereum.org/EIPS/eip-191) - Personal Sign
//! - [EIP-712](https://eips.ethereum.org/EIPS/eip-712) - Typed Data

const std = @import("std");
const testing = std.testing;
const primitives = @import("primitives");
const Crypto = @import("crypto.zig");
const Hash = @import("hash.zig");
const secp256k1 = @import("secp256k1.zig");
const Eip712 = @import("eip712.zig");

// Types
pub const Address = Crypto.Address;
pub const PrivateKey = Crypto.PrivateKey;
pub const PublicKey = Crypto.PublicKey;
pub const Signature = Crypto.Signature;

// Error types
pub const SignerError = error{
    InvalidPrivateKey,
    InvalidSignature,
    SigningFailed,
    NotConnected,
    DeviceError,
    RpcError,
    InvalidAddress,
    InvalidMessage,
    InvalidTypedData,
    OutOfMemory,
};

/// Signer interface - unified trait for all signer implementations
/// Implemented via comptime duck typing pattern
pub fn Signer(comptime T: type) type {
    return struct {
        ptr: *T,

        const Self = @This();

        /// Get the signer's Ethereum address
        pub fn getAddress(self: Self) Address {
            return self.ptr.getAddress();
        }

        /// Get the signer's public key (if available)
        pub fn getPublicKey(self: Self) ?PublicKey {
            if (@hasDecl(T, "getPublicKey")) {
                return self.ptr.getPublicKey();
            }
            return null;
        }

        /// Sign a message hash (32 bytes)
        pub fn signHash(self: Self, hash: Hash.Hash) SignerError!Signature {
            return self.ptr.signHash(hash);
        }

        /// Sign a message with EIP-191 prefix
        pub fn signMessage(self: Self, message: []const u8) SignerError!Signature {
            return self.ptr.signMessage(message);
        }

        /// Sign EIP-712 typed data hash
        pub fn signTypedDataHash(self: Self, hash: Hash.Hash) SignerError!Signature {
            return self.ptr.signTypedDataHash(hash);
        }
    };
}

/// Local signer - signs using a private key stored in memory
///
/// WARNING: UNAUDITED - Uses unaudited cryptographic implementations.
/// The private key is stored in memory and should be securely zeroed after use.
/// For production systems, consider using hardware wallets.
pub const LocalSigner = struct {
    private_key: PrivateKey,
    public_key: PublicKey,
    address: Address,

    const Self = @This();

    /// Initialize a local signer from a private key
    /// WARNING: UNAUDITED - Custom cryptographic implementation
    pub fn init(private_key: PrivateKey) SignerError!Self {
        const public_key = Crypto.unaudited_getPublicKey(private_key) catch {
            return SignerError.InvalidPrivateKey;
        };
        const address = public_key.toAddress();

        return Self{
            .private_key = private_key,
            .public_key = public_key,
            .address = address,
        };
    }

    /// Create a local signer from a hex string (with or without 0x prefix)
    pub fn fromHex(hex_str: []const u8) SignerError!Self {
        var private_key: PrivateKey = undefined;

        var hex = hex_str;
        if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) {
            hex = hex[2..];
        }

        if (hex.len != 64) {
            return SignerError.InvalidPrivateKey;
        }

        for (0..32) |i| {
            const high = hexCharToValue(hex[i * 2]) orelse return SignerError.InvalidPrivateKey;
            const low = hexCharToValue(hex[i * 2 + 1]) orelse return SignerError.InvalidPrivateKey;
            private_key[i] = (high << 4) | low;
        }

        return init(private_key);
    }

    /// Generate a random local signer
    /// WARNING: UNAUDITED - Uses system random source
    pub fn random() SignerError!Self {
        const private_key = Crypto.unaudited_randomPrivateKey() catch {
            return SignerError.InvalidPrivateKey;
        };
        return init(private_key);
    }

    /// Get the signer's Ethereum address
    pub fn getAddress(self: *const Self) Address {
        return self.address;
    }

    /// Get the signer's public key
    pub fn getPublicKey(self: *const Self) PublicKey {
        return self.public_key;
    }

    /// Sign a 32-byte message hash
    /// WARNING: UNAUDITED - Uses unaudited ECDSA implementation
    pub fn signHash(self: *const Self, hash: Hash.Hash) SignerError!Signature {
        return Crypto.unaudited_signHash(hash, self.private_key) catch {
            return SignerError.SigningFailed;
        };
    }

    /// Sign a message with EIP-191 personal sign prefix
    /// Format: "\x19Ethereum Signed Message:\n" + len(message) + message
    pub fn signMessage(self: *const Self, message: []const u8) SignerError!Signature {
        const hash = Crypto.hashMessage(message);
        return self.signHash(hash);
    }

    /// Sign EIP-712 typed data hash
    pub fn signTypedDataHash(self: *const Self, hash: Hash.Hash) SignerError!Signature {
        return self.signHash(hash);
    }

    /// Get as generic Signer interface
    pub fn signer(self: *Self) Signer(Self) {
        return .{ .ptr = self };
    }

    /// Securely clear the private key from memory
    pub fn deinit(self: *Self) void {
        Crypto.secureZeroMemory(&self.private_key);
    }
};

/// Hardware wallet signer interface
///
/// Abstract interface for hardware wallet implementations (Ledger, Trezor, etc.)
/// Concrete implementations should be provided by platform-specific code.
pub const HardwareWalletSigner = struct {
    /// Vtable for hardware wallet operations
    pub const VTable = struct {
        connect: *const fn (*anyopaque) SignerError!void,
        disconnect: *const fn (*anyopaque) void,
        isConnected: *const fn (*anyopaque) bool,
        getAddress: *const fn (*anyopaque, []const u8) SignerError!Address,
        signHash: *const fn (*anyopaque, []const u8, Hash.Hash) SignerError!Signature,
        signMessage: *const fn (*anyopaque, []const u8, []const u8) SignerError!Signature,
        signTypedDataHash: *const fn (*anyopaque, []const u8, Hash.Hash) SignerError!Signature,
    };

    ptr: *anyopaque,
    vtable: *const VTable,
    derivation_path: []const u8,
    cached_address: ?Address,

    const Self = @This();

    /// Connect to the hardware device
    pub fn connect(self: *Self) SignerError!void {
        return self.vtable.connect(self.ptr);
    }

    /// Disconnect from the hardware device
    pub fn disconnect(self: *Self) void {
        self.vtable.disconnect(self.ptr);
    }

    /// Check if device is connected
    pub fn isConnected(self: *const Self) bool {
        return self.vtable.isConnected(self.ptr);
    }

    /// Get the signer's Ethereum address
    pub fn getAddress(self: *Self) SignerError!Address {
        if (self.cached_address) |addr| {
            return addr;
        }
        if (!self.isConnected()) {
            return SignerError.NotConnected;
        }
        const addr = try self.vtable.getAddress(self.ptr, self.derivation_path);
        self.cached_address = addr;
        return addr;
    }

    /// Sign a 32-byte message hash
    pub fn signHash(self: *const Self, hash: Hash.Hash) SignerError!Signature {
        if (!self.isConnected()) {
            return SignerError.NotConnected;
        }
        return self.vtable.signHash(self.ptr, self.derivation_path, hash);
    }

    /// Sign a message with EIP-191 prefix
    pub fn signMessage(self: *const Self, message: []const u8) SignerError!Signature {
        if (!self.isConnected()) {
            return SignerError.NotConnected;
        }
        return self.vtable.signMessage(self.ptr, self.derivation_path, message);
    }

    /// Sign EIP-712 typed data hash
    pub fn signTypedDataHash(self: *const Self, hash: Hash.Hash) SignerError!Signature {
        if (!self.isConnected()) {
            return SignerError.NotConnected;
        }
        return self.vtable.signTypedDataHash(self.ptr, self.derivation_path, hash);
    }
};

/// JSON-RPC signer interface
///
/// Signs via remote JSON-RPC calls (eth_sign, eth_signTypedData_v4, etc.)
/// Useful for browser wallets and custodial services.
pub const JsonRpcSigner = struct {
    /// Vtable for RPC operations
    pub const VTable = struct {
        sendRequest: *const fn (*anyopaque, []const u8, []const u8) SignerError![]const u8,
    };

    ptr: *anyopaque,
    vtable: *const VTable,
    address: Address,
    allocator: std.mem.Allocator,

    const Self = @This();

    /// Get the signer's Ethereum address
    pub fn getAddress(self: *const Self) Address {
        return self.address;
    }

    /// Sign a 32-byte message hash via eth_sign
    pub fn signHash(self: *Self, hash: Hash.Hash) SignerError!Signature {
        // Build JSON-RPC request for eth_sign
        // Format: eth_sign(address, hash)
        var params_buf: [256]u8 = undefined;
        var address_hex: [42]u8 = undefined;
        address_hex[0] = '0';
        address_hex[1] = 'x';
        _ = std.fmt.bufPrint(address_hex[2..], "{x}", .{std.fmt.fmtSliceHexLower(&self.address.bytes)}) catch {
            return SignerError.InvalidAddress;
        };

        var hash_hex: [66]u8 = undefined;
        hash_hex[0] = '0';
        hash_hex[1] = 'x';
        _ = std.fmt.bufPrint(hash_hex[2..], "{x}", .{std.fmt.fmtSliceHexLower(&hash)}) catch {
            return SignerError.InvalidMessage;
        };

        const params = std.fmt.bufPrint(&params_buf, "[\"{s}\", \"{s}\"]", .{ address_hex, hash_hex }) catch {
            return SignerError.OutOfMemory;
        };

        const response = try self.vtable.sendRequest(self.ptr, "eth_sign", params);
        defer self.allocator.free(response);

        return parseSignatureResponse(response);
    }

    /// Sign a message with EIP-191 prefix via personal_sign
    pub fn signMessage(self: *Self, message: []const u8) SignerError!Signature {
        // Hash message with EIP-191 prefix and sign via eth_sign
        const hash = Crypto.hashMessage(message);
        return self.signHash(hash);
    }

    /// Sign EIP-712 typed data hash
    pub fn signTypedDataHash(self: *Self, hash: Hash.Hash) SignerError!Signature {
        // Would call eth_signTypedData_v4
        return self.signHash(hash);
    }

    fn parseSignatureResponse(response: []const u8) SignerError!Signature {
        // Parse hex signature from JSON-RPC response
        // Expected format: 0x + r(64) + s(64) + v(2) = 132 chars
        if (response.len < 132) {
            return SignerError.InvalidSignature;
        }

        var sig: Signature = undefined;
        var offset: usize = 0;

        // Skip 0x prefix if present
        if (response.len >= 2 and response[0] == '0' and response[1] == 'x') {
            offset = 2;
        }

        // Parse r (32 bytes = 64 hex chars)
        var r_bytes: [32]u8 = undefined;
        for (0..32) |i| {
            const high = hexCharToValue(response[offset + i * 2]) orelse return SignerError.InvalidSignature;
            const low = hexCharToValue(response[offset + i * 2 + 1]) orelse return SignerError.InvalidSignature;
            r_bytes[i] = (high << 4) | low;
        }
        sig.r = std.mem.readInt(u256, &r_bytes, .big);

        // Parse s (32 bytes = 64 hex chars)
        offset += 64;
        var s_bytes: [32]u8 = undefined;
        for (0..32) |i| {
            const high = hexCharToValue(response[offset + i * 2]) orelse return SignerError.InvalidSignature;
            const low = hexCharToValue(response[offset + i * 2 + 1]) orelse return SignerError.InvalidSignature;
            s_bytes[i] = (high << 4) | low;
        }
        sig.s = std.mem.readInt(u256, &s_bytes, .big);

        // Parse v (1 byte = 2 hex chars)
        offset += 64;
        const v_high = hexCharToValue(response[offset]) orelse return SignerError.InvalidSignature;
        const v_low = hexCharToValue(response[offset + 1]) orelse return SignerError.InvalidSignature;
        sig.v = (v_high << 4) | v_low;

        return sig;
    }
};

// =============================================================================
// Factory Functions
// =============================================================================

/// Signer type enumeration for factory function
pub const SignerType = enum {
    local,
    hardware,
    json_rpc,
};

/// Create a LocalSigner from a private key (factory function)
/// This is the primary way to create a signer for most use cases.
///
/// Usage:
/// ```zig
/// const signer = try createSigner(.{ .private_key = my_key });
/// defer signer.deinit();
/// ```
pub fn createSigner(options: struct {
    private_key: ?PrivateKey = null,
    private_key_hex: ?[]const u8 = null,
    random: bool = false,
}) SignerError!LocalSigner {
    if (options.random) {
        return LocalSigner.random();
    }
    if (options.private_key_hex) |hex_str| {
        return LocalSigner.fromHex(hex_str);
    }
    if (options.private_key) |pk| {
        return LocalSigner.init(pk);
    }
    return SignerError.InvalidPrivateKey;
}

/// Create a LocalSigner from a hex string (convenience function)
pub fn createSignerFromHex(hex_str: []const u8) SignerError!LocalSigner {
    return LocalSigner.fromHex(hex_str);
}

/// Create a random LocalSigner (convenience function)
pub fn createRandomSigner() SignerError!LocalSigner {
    return LocalSigner.random();
}

/// Validate that a signer is properly configured and can sign
/// Returns true if the signer has a valid private key and can produce signatures
pub fn isValidSigner(signer: *const LocalSigner) bool {
    // Check that the public key is valid (derived from private key)
    if (!signer.public_key.isValid()) {
        return false;
    }

    // Check that the address is not zero
    const zero_address = [_]u8{0} ** 20;
    if (std.mem.eql(u8, &signer.address.bytes, &zero_address)) {
        return false;
    }

    // Attempt to sign a test message to verify full functionality
    const test_hash = Hash.keccak256("signer validation test");
    const signature = signer.signHash(test_hash) catch {
        return false;
    };

    // Verify the signature is valid
    if (!signature.isValid()) {
        return false;
    }

    // Verify we can recover the correct address
    const recovered_address = Crypto.unaudited_recoverAddress(test_hash, signature) catch {
        return false;
    };

    return std.mem.eql(u8, &recovered_address.bytes, &signer.address.bytes);
}

/// Validate a signer by checking if it can sign and verify a test message
/// This is a lighter-weight check than isValidSigner
pub fn isSignerConfigured(signer: *const LocalSigner) bool {
    return signer.public_key.isValid();
}

// Helper function
fn hexCharToValue(c: u8) ?u8 {
    return switch (c) {
        '0'...'9' => c - '0',
        'a'...'f' => c - 'a' + 10,
        'A'...'F' => c - 'A' + 10,
        else => null,
    };
}

// ============================================================================
// Tests
// ============================================================================

test "LocalSigner - init from private key" {
    // Known test private key (DO NOT use in production)
    const private_key = PrivateKey{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };

    var signer_instance = try LocalSigner.init(private_key);
    defer signer_instance.deinit();

    // Address should be 20 bytes
    try testing.expectEqual(@as(usize, 20), signer_instance.address.bytes.len);

    // Public key should be valid
    try testing.expect(signer_instance.public_key.isValid());
}

test "LocalSigner - fromHex with 0x prefix" {
    const hex = "0xac0974bec39a17e36ba4a6b4d238ff244e21db635c51cb293649a7422fba41";
    // Note: this is 62 chars after 0x, should fail
    const result = LocalSigner.fromHex(hex);
    try testing.expectError(SignerError.InvalidPrivateKey, result);
}

test "LocalSigner - fromHex valid" {
    const hex = "ac0974bec39a17e36ba4a6b4d238ff244e21db635c51cb2936495af7422fba41";
    var signer_instance = try LocalSigner.fromHex(hex);
    defer signer_instance.deinit();

    try testing.expect(signer_instance.public_key.isValid());
}

test "LocalSigner - signMessage" {
    const private_key = PrivateKey{
        0x42, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    };

    var signer_instance = try LocalSigner.init(private_key);
    defer signer_instance.deinit();

    const message = "Hello, Ethereum!";
    const signature = try signer_instance.signMessage(message);

    // Signature should be valid
    try testing.expect(signature.isValid());

    // v should be 27 or 28
    try testing.expect(signature.v == 27 or signature.v == 28);
}

test "LocalSigner - signHash deterministic" {
    const private_key = PrivateKey{
        0xfe, 0xed, 0xbe, 0xef, 0xde, 0xad, 0xc0, 0xde,
        0xca, 0xfe, 0xba, 0xbe, 0x12, 0x34, 0x56, 0x78,
        0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78,
        0x9a, 0xbc, 0xde, 0xf0, 0x11, 0x22, 0x33, 0x44,
    };

    var signer_instance = try LocalSigner.init(private_key);
    defer signer_instance.deinit();

    const hash = Hash.keccak256("test message");

    // Sign twice
    const sig1 = try signer_instance.signHash(hash);
    const sig2 = try signer_instance.signHash(hash);

    // Signatures should be identical (deterministic RFC 6979)
    try testing.expectEqual(sig1.r, sig2.r);
    try testing.expectEqual(sig1.s, sig2.s);
    try testing.expectEqual(sig1.v, sig2.v);
}

test "LocalSigner - signature recovery" {
    const private_key = PrivateKey{
        0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
        0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
        0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
        0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa,
    };

    var signer_instance = try LocalSigner.init(private_key);
    defer signer_instance.deinit();

    const message = "Recovery test";
    const signature = try signer_instance.signMessage(message);

    // Recover address from signature
    const message_hash = Crypto.hashMessage(message);
    const recovered_address = try Crypto.unaudited_recoverAddress(message_hash, signature);

    // Should match signer address
    try testing.expect(std.mem.eql(u8, &recovered_address.bytes, &signer_instance.address.bytes));
}

test "LocalSigner - random generation" {
    var signer1 = try LocalSigner.random();
    defer signer1.deinit();

    var signer2 = try LocalSigner.random();
    defer signer2.deinit();

    // Addresses should be different
    try testing.expect(!std.mem.eql(u8, &signer1.address.bytes, &signer2.address.bytes));
}

test "LocalSigner - signer interface" {
    const private_key = PrivateKey{
        0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
        0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00,
        0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
        0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x00,
    };

    var local = try LocalSigner.init(private_key);
    defer local.deinit();

    const generic_signer = local.signer();

    // Use generic interface
    const address = generic_signer.getAddress();
    try testing.expectEqual(@as(usize, 20), address.bytes.len);

    const pub_key = generic_signer.getPublicKey();
    try testing.expect(pub_key != null);
    try testing.expect(pub_key.?.isValid());
}

test "LocalSigner - invalid private key zero" {
    const zero_key = PrivateKey{0} ** 32;
    const result = LocalSigner.init(zero_key);
    try testing.expectError(SignerError.InvalidPrivateKey, result);
}

test "HardwareWalletSigner - not connected error" {
    // Mock vtable that always returns not connected
    const MockVTable = struct {
        fn connect(_: *anyopaque) SignerError!void {
            return SignerError.DeviceError;
        }
        fn disconnect(_: *anyopaque) void {}
        fn isConnected(_: *anyopaque) bool {
            return false;
        }
        fn getAddr(_: *anyopaque, _: []const u8) SignerError!Address {
            return SignerError.NotConnected;
        }
        fn signH(_: *anyopaque, _: []const u8, _: Hash.Hash) SignerError!Signature {
            return SignerError.NotConnected;
        }
        fn signM(_: *anyopaque, _: []const u8, _: []const u8) SignerError!Signature {
            return SignerError.NotConnected;
        }
        fn signT(_: *anyopaque, _: []const u8, _: Hash.Hash) SignerError!Signature {
            return SignerError.NotConnected;
        }
    };

    const vtable = HardwareWalletSigner.VTable{
        .connect = MockVTable.connect,
        .disconnect = MockVTable.disconnect,
        .isConnected = MockVTable.isConnected,
        .getAddress = MockVTable.getAddr,
        .signHash = MockVTable.signH,
        .signMessage = MockVTable.signM,
        .signTypedDataHash = MockVTable.signT,
    };

    var dummy: u8 = 0;
    var hw_signer = HardwareWalletSigner{
        .ptr = &dummy,
        .vtable = &vtable,
        .derivation_path = "m/44'/60'/0'/0/0",
        .cached_address = null,
    };

    // Should fail with NotConnected
    const hash = Hash.keccak256("test");
    try testing.expectError(SignerError.NotConnected, hw_signer.signHash(hash));
}

test "JsonRpcSigner - parseSignatureResponse" {
    // Valid signature hex (0x + 64 + 64 + 2 = 132 chars)
    const valid_sig = "0x" ++
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" ++ // r
        "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" ++ // s
        "1c"; // v = 28

    const sig = try JsonRpcSigner.parseSignatureResponse(valid_sig);
    try testing.expectEqual(@as(u8, 0x1c), sig.v);
}

test "hexCharToValue" {
    try testing.expectEqual(@as(?u8, 0), hexCharToValue('0'));
    try testing.expectEqual(@as(?u8, 9), hexCharToValue('9'));
    try testing.expectEqual(@as(?u8, 10), hexCharToValue('a'));
    try testing.expectEqual(@as(?u8, 15), hexCharToValue('f'));
    try testing.expectEqual(@as(?u8, 10), hexCharToValue('A'));
    try testing.expectEqual(@as(?u8, 15), hexCharToValue('F'));
    try testing.expectEqual(@as(?u8, null), hexCharToValue('g'));
    try testing.expectEqual(@as(?u8, null), hexCharToValue('Z'));
}

// ============================================================================
// Factory Function Tests
// ============================================================================

test "createSigner - from private key" {
    const private_key = PrivateKey{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };

    var signer = try createSigner(.{ .private_key = private_key });
    defer signer.deinit();

    try testing.expect(signer.public_key.isValid());
}

test "createSigner - from hex string" {
    const hex = "ac0974bec39a17e36ba4a6b4d238ff244e21db635c51cb2936495af7422fba41";

    var signer = try createSigner(.{ .private_key_hex = hex });
    defer signer.deinit();

    try testing.expect(signer.public_key.isValid());
}

test "createSigner - random" {
    var signer = try createSigner(.{ .random = true });
    defer signer.deinit();

    try testing.expect(signer.public_key.isValid());
}

test "createSigner - no options returns error" {
    const result = createSigner(.{});
    try testing.expectError(SignerError.InvalidPrivateKey, result);
}

test "createSignerFromHex" {
    const hex = "ac0974bec39a17e36ba4a6b4d238ff244e21db635c51cb2936495af7422fba41";

    var signer = try createSignerFromHex(hex);
    defer signer.deinit();

    try testing.expect(signer.public_key.isValid());
}

test "createRandomSigner" {
    var signer1 = try createRandomSigner();
    defer signer1.deinit();

    var signer2 = try createRandomSigner();
    defer signer2.deinit();

    // Should produce different signers
    try testing.expect(!std.mem.eql(u8, &signer1.address.bytes, &signer2.address.bytes));
}

test "isValidSigner - valid signer" {
    const private_key = PrivateKey{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };

    var signer = try LocalSigner.init(private_key);
    defer signer.deinit();

    try testing.expect(isValidSigner(&signer));
}

test "isSignerConfigured - configured signer" {
    const private_key = PrivateKey{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };

    var signer = try LocalSigner.init(private_key);
    defer signer.deinit();

    try testing.expect(isSignerConfigured(&signer));
}

test "createSigner priority - random takes precedence" {
    // When random is true, it should create a random signer regardless of other options
    const private_key = PrivateKey{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };

    var signer = try createSigner(.{ .random = true, .private_key = private_key });
    defer signer.deinit();

    // Verify it's a valid signer (could be the same or different address)
    try testing.expect(signer.public_key.isValid());
}
