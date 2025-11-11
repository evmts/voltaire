const std = @import("std");
const primitives = @import("primitives");
const crypto = @import("crypto");
const builtin = @import("builtin");

// Error codes for C API
pub const PRIMITIVES_SUCCESS: c_int = 0;
pub const PRIMITIVES_ERROR_INVALID_HEX: c_int = -1;
pub const PRIMITIVES_ERROR_INVALID_LENGTH: c_int = -2;
pub const PRIMITIVES_ERROR_INVALID_CHECKSUM: c_int = -3;
pub const PRIMITIVES_ERROR_OUT_OF_MEMORY: c_int = -4;
pub const PRIMITIVES_ERROR_INVALID_INPUT: c_int = -5;
pub const PRIMITIVES_ERROR_INVALID_SIGNATURE: c_int = -6;
pub const PRIMITIVES_ERROR_INVALID_SELECTOR: c_int = -7;
pub const PRIMITIVES_ERROR_UNSUPPORTED_TYPE: c_int = -8;
pub const PRIMITIVES_ERROR_MAX_LENGTH_EXCEEDED: c_int = -9;
pub const PRIMITIVES_ERROR_ACCESS_LIST_INVALID: c_int = -10;
pub const PRIMITIVES_ERROR_AUTHORIZATION_INVALID: c_int = -11;

// C-compatible Address type (20 bytes)
pub const PrimitivesAddress = extern struct {
    bytes: [20]u8,
};

// C-compatible Hash type (32 bytes)
pub const PrimitivesHash = extern struct {
    bytes: [32]u8,
};

// C-compatible U256 type (32 bytes, big-endian)
pub const PrimitivesU256 = extern struct {
    bytes: [32]u8,
};

// ============================================================================
// Address API
// ============================================================================

/// Create address from hex string (with or without 0x prefix)
/// Returns PRIMITIVES_SUCCESS on success
export fn primitives_address_from_hex(
    hex: [*:0]const u8,
    out_address: *PrimitivesAddress,
) c_int {
    const hex_slice = std.mem.span(hex);
    const addr = primitives.Address.fromHex(hex_slice) catch {
        return PRIMITIVES_ERROR_INVALID_HEX;
    };
    @memcpy(&out_address.bytes, &addr.bytes);
    return PRIMITIVES_SUCCESS;
}

/// Convert address to hex string (42 bytes: "0x" + 40 hex chars)
/// buf must be at least 42 bytes
export fn primitives_address_to_hex(
    address: *const PrimitivesAddress,
    buf: [*]u8,
) c_int {
    const addr = primitives.Address{ .bytes = address.bytes };
    const hex = addr.toHex();
    @memcpy(buf[0..42], &hex);
    return PRIMITIVES_SUCCESS;
}

/// Convert address to checksummed hex (EIP-55)
/// buf must be at least 42 bytes
export fn primitives_address_to_checksum_hex(
    address: *const PrimitivesAddress,
    buf: [*]u8,
) c_int {
    const addr = primitives.Address{ .bytes = address.bytes };
    const hex = primitives.Address.toChecksummed(addr);
    @memcpy(buf[0..42], &hex);
    return PRIMITIVES_SUCCESS;
}

/// Check if address is zero address
export fn primitives_address_is_zero(
    address: *const PrimitivesAddress,
) bool {
    const addr = primitives.Address{ .bytes = address.bytes };
    return addr.isZero();
}

/// Compare two addresses for equality
export fn primitives_address_equals(
    a: *const PrimitivesAddress,
    b: *const PrimitivesAddress,
) bool {
    const addr_a = primitives.Address{ .bytes = a.bytes };
    const addr_b = primitives.Address{ .bytes = b.bytes };
    return addr_a.equals(addr_b);
}

/// Validate EIP-55 checksum
export fn primitives_address_validate_checksum(
    hex: [*:0]const u8,
) bool {
    const hex_slice = std.mem.span(hex);
    return primitives.Address.isValidChecksum(hex_slice);
}

// ============================================================================
// Keccak-256 API
// ============================================================================

/// Compute Keccak-256 hash of input data
export fn primitives_keccak256(
    data: [*]const u8,
    data_len: usize,
    out_hash: *PrimitivesHash,
) c_int {
    const input = data[0..data_len];
    const hash = crypto.HashUtils.keccak256(input);
    @memcpy(&out_hash.bytes, &hash);
    return PRIMITIVES_SUCCESS;
}

/// Convert hash to hex string (66 bytes: "0x" + 64 hex chars)
/// buf must be at least 66 bytes
export fn primitives_hash_to_hex(
    hash: *const PrimitivesHash,
    buf: [*]u8,
) c_int {
    const hex = crypto.HashUtils.toHex(hash.bytes);
    @memcpy(buf[0..66], &hex);
    return PRIMITIVES_SUCCESS;
}

/// Create hash from hex string
export fn primitives_hash_from_hex(
    hex: [*:0]const u8,
    out_hash: *PrimitivesHash,
) c_int {
    const hex_slice = std.mem.span(hex);
    const hash = crypto.HashUtils.fromHex(hex_slice) catch {
        return PRIMITIVES_ERROR_INVALID_HEX;
    };
    @memcpy(&out_hash.bytes, &hash);
    return PRIMITIVES_SUCCESS;
}

/// Compare two hashes for equality (constant-time)
export fn primitives_hash_equals(
    a: *const PrimitivesHash,
    b: *const PrimitivesHash,
) bool {
    return crypto.HashUtils.equal(a.bytes, b.bytes);
}

// ============================================================================
// Hex utilities API
// ============================================================================

/// Convert hex string to bytes
/// Returns the number of bytes written, or negative error code
export fn primitives_hex_to_bytes(
    hex: [*:0]const u8,
    out_buf: [*]u8,
    buf_len: usize,
) c_int {
    const hex_slice = std.mem.span(hex);

    // We need an allocator for temporary conversion
    // Since we can't use C allocator easily, use a stack buffer for small conversions
    var stack_buf: [1024]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
    const allocator = fba.allocator();

    const bytes = primitives.Hex.hexToBytes(allocator, hex_slice) catch {
        return PRIMITIVES_ERROR_INVALID_HEX;
    };
    defer allocator.free(bytes);

    if (bytes.len > buf_len) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    @memcpy(out_buf[0..bytes.len], bytes);
    return @intCast(bytes.len);
}

/// Convert bytes to hex string
/// Returns the number of characters written (including 0x prefix), or negative error code
export fn primitives_bytes_to_hex(
    data: [*]const u8,
    data_len: usize,
    out_buf: [*]u8,
    buf_len: usize,
) c_int {
    const input = data[0..data_len];
    const required_len = 2 + (data_len * 2); // "0x" + 2 chars per byte

    if (buf_len < required_len) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    var stack_buf: [2048]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
    const allocator = fba.allocator();

    const hex = primitives.Hex.bytesToHex(allocator, input) catch {
        return PRIMITIVES_ERROR_OUT_OF_MEMORY;
    };
    defer allocator.free(hex);

    @memcpy(out_buf[0..hex.len], hex);
    return @intCast(hex.len);
}

// ============================================================================
// U256 utilities API
// ============================================================================

/// Parse u256 from hex string
export fn primitives_u256_from_hex(
    hex: [*:0]const u8,
    out_u256: *PrimitivesU256,
) c_int {
    const hex_slice = std.mem.span(hex);
    const value = primitives.Hex.hexToU256(hex_slice) catch {
        return PRIMITIVES_ERROR_INVALID_HEX;
    };

    // Convert u256 to big-endian bytes
    var bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &bytes, value, .big);
    @memcpy(&out_u256.bytes, &bytes);
    return PRIMITIVES_SUCCESS;
}

/// Convert u256 to hex string (66 bytes: "0x" + 64 hex chars)
export fn primitives_u256_to_hex(
    value_u256: *const PrimitivesU256,
    buf: [*]u8,
    buf_len: usize,
) c_int {
    if (buf_len < 66) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    const value = std.mem.readInt(u256, &value_u256.bytes, .big);

    // Format as padded hex: 0x + 64 hex chars
    buf[0] = '0';
    buf[1] = 'x';

    const hex_chars = "0123456789abcdef";
    var i: usize = 0;
    while (i < 64) : (i += 1) {
        const shift = @as(u8, @intCast((63 - i) * 4));
        const nibble = @as(u8, @intCast((value >> shift) & 0xF));
        buf[2 + i] = hex_chars[nibble];
    }

    return PRIMITIVES_SUCCESS;
}

// ============================================================================
// EIP-191 Personal Message Signing
// ============================================================================

/// Hash a message using EIP-191 personal message format
export fn primitives_eip191_hash_message(
    message: [*]const u8,
    message_len: usize,
    out_hash: *PrimitivesHash,
) c_int {
    const msg = message[0..message_len];

    // Use a heap allocator to support large messages (up to 1MB+)
    // FixedBufferAllocator with small stack buffers caused OOM for >5KB
    const allocator = std.heap.page_allocator;

    const hash = crypto.HashUtils.eip191HashMessage(msg, allocator) catch {
        return PRIMITIVES_ERROR_OUT_OF_MEMORY;
    };
    @memcpy(&out_hash.bytes, &hash);
    return PRIMITIVES_SUCCESS;
}

// ============================================================================
// Address derivation
// ============================================================================

/// Calculate CREATE contract address (from sender and nonce)
export fn primitives_calculate_create_address(
    sender: *const PrimitivesAddress,
    nonce: u64,
    out_address: *PrimitivesAddress,
) c_int {
    const sender_addr = primitives.Address{ .bytes = sender.bytes };

    var stack_buf: [1024]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
    const allocator = fba.allocator();

    const addr = primitives.Address.calculateCreateAddress(allocator, sender_addr, nonce) catch {
        return PRIMITIVES_ERROR_OUT_OF_MEMORY;
    };

    @memcpy(&out_address.bytes, &addr.bytes);
    return PRIMITIVES_SUCCESS;
}

// ============================================================================
// Cryptographic Signatures (secp256k1)
// ============================================================================

/// Signature structure for C API (65 bytes: r + s + v)
pub const PrimitivesSignature = extern struct {
    r: [32]u8,
    s: [32]u8,
    v: u8,
};

/// Recover public key from ECDSA signature
/// Returns PRIMITIVES_SUCCESS on success
export fn primitives_secp256k1_recover_pubkey(
    message_hash: *const [32]u8,
    r: *const [32]u8,
    s: *const [32]u8,
    v: u8,
    out_pubkey: *[64]u8,
) c_int {
    const pubkey = crypto.secp256k1.recoverPubkey(message_hash, r, s, v) catch {
        return PRIMITIVES_ERROR_INVALID_SIGNATURE;
    };
    @memcpy(out_pubkey, &pubkey);
    return PRIMITIVES_SUCCESS;
}

/// Recover Ethereum address from ECDSA signature
export fn primitives_secp256k1_recover_address(
    message_hash: *const [32]u8,
    r: *const [32]u8,
    s: *const [32]u8,
    v: u8,
    out_address: *PrimitivesAddress,
) c_int {
    // Parse r and s as u256 (big-endian)
    const r_u256 = std.mem.readInt(u256, r, .big);
    const s_u256 = std.mem.readInt(u256, s, .big);

    // Convert v to recovery ID (handle both 0-1 and 27-28 formats)
    var recovery_id: u8 = undefined;
    if (v >= 27 and v <= 28) {
        recovery_id = v - 27;
    } else if (v <= 1) {
        recovery_id = v;
    } else {
        return PRIMITIVES_ERROR_INVALID_SIGNATURE;
    }

    const addr = crypto.secp256k1.unauditedRecoverAddress(
        message_hash,
        recovery_id,
        r_u256,
        s_u256,
    ) catch {
        return PRIMITIVES_ERROR_INVALID_SIGNATURE;
    };

    @memcpy(&out_address.bytes, &addr.bytes);
    return PRIMITIVES_SUCCESS;
}

/// Derive public key from private key
export fn primitives_secp256k1_pubkey_from_private(
    private_key: *const [32]u8,
    out_pubkey: *[64]u8,
) c_int {
    // Use generator point and scalar multiplication
    const G = crypto.secp256k1.AffinePoint.generator();
    const scalar = std.mem.readInt(u256, private_key, .big);

    if (scalar == 0 or scalar >= crypto.secp256k1.SECP256K1_N) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    const pubkey_point = G.scalarMul(scalar);

    if (pubkey_point.infinity or !pubkey_point.isOnCurve()) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    // Serialize public key as uncompressed (x || y)
    std.mem.writeInt(u256, out_pubkey[0..32], pubkey_point.x, .big);
    std.mem.writeInt(u256, out_pubkey[32..64], pubkey_point.y, .big);

    return PRIMITIVES_SUCCESS;
}

/// Validate ECDSA signature components
export fn primitives_secp256k1_validate_signature(
    r: *const [32]u8,
    s: *const [32]u8,
) bool {
    const r_u256 = std.mem.readInt(u256, r, .big);
    const s_u256 = std.mem.readInt(u256, s, .big);

    return crypto.secp256k1.unauditedValidateSignature(r_u256, s_u256);
}

// ============================================================================
// WASM-specific secp256k1 functions (inline to avoid module conflicts)
// ============================================================================

/// Sign message hash with private key (WASM variant)
export fn secp256k1Sign(
    msgHash_ptr: [*]const u8,
    privKey_ptr: [*]const u8,
    sig_ptr: [*]u8,
    recid_ptr: [*]u8,
) c_int {
    const msgHash = msgHash_ptr[0..32];
    const privKey = privKey_ptr[0..32];

    const pub_key = crypto.secp256k1.AffinePoint.generator().scalarMul(std.mem.readInt(u256, privKey[0..32], .big));
    if (pub_key.infinity or !pub_key.isOnCurve()) return 1;

    var hasher = std.crypto.hash.sha3.Keccak256.init(.{});
    hasher.update(privKey);
    hasher.update(msgHash);
    var k_hash: [32]u8 = undefined;
    hasher.final(&k_hash);

    var k = std.mem.readInt(u256, &k_hash, .big);
    if (k == 0 or k >= crypto.secp256k1.SECP256K1_N) {
        k = (k % (crypto.secp256k1.SECP256K1_N - 1)) + 1;
    }

    const R = crypto.secp256k1.AffinePoint.generator().scalarMul(k);
    if (R.infinity or !R.isOnCurve()) return 1;

    const r = R.x % crypto.secp256k1.SECP256K1_N;
    if (r == 0) return 1;

    const e = std.mem.readInt(u256, msgHash[0..32], .big);
    const priv = std.mem.readInt(u256, privKey[0..32], .big);

    const k_inv = crypto.secp256k1.unauditedInvmod(k, crypto.secp256k1.SECP256K1_N) orelse return 1;
    const r_priv = crypto.secp256k1.unauditedMulmod(r, priv, crypto.secp256k1.SECP256K1_N);
    const e_plus_r_priv = crypto.secp256k1.unauditedAddmod(e, r_priv, crypto.secp256k1.SECP256K1_N);
    var s = crypto.secp256k1.unauditedMulmod(k_inv, e_plus_r_priv, crypto.secp256k1.SECP256K1_N);

    const half_n = crypto.secp256k1.SECP256K1_N >> 1;
    if (s > half_n) {
        s = crypto.secp256k1.SECP256K1_N - s;
    }

    const recovery_id: u8 = if ((R.y & 1) == 1) 1 else 0;

    std.mem.writeInt(u256, sig_ptr[0..32], r, .big);
    std.mem.writeInt(u256, sig_ptr[32..64], s, .big);
    recid_ptr[0] = recovery_id;

    return 0;
}

/// Verify signature (WASM variant)
export fn secp256k1Verify(
    msgHash_ptr: [*]const u8,
    sig_ptr: [*]const u8,
    pubKey_ptr: [*]const u8,
) c_int {
    const msgHash = msgHash_ptr[0..32];
    const r_bytes = sig_ptr[0..32];
    const s_bytes = sig_ptr[32..64];

    const r = std.mem.readInt(u256, r_bytes, .big);
    const s = std.mem.readInt(u256, s_bytes, .big);

    if (!crypto.secp256k1.unauditedValidateSignature(r, s)) return 0;

    const x = std.mem.readInt(u256, pubKey_ptr[0..32], .big);
    const y = std.mem.readInt(u256, pubKey_ptr[32..64], .big);
    const pub_key = crypto.secp256k1.AffinePoint{ .x = x, .y = y, .infinity = false };

    if (!pub_key.isOnCurve()) return 0;

    var hash_array: [32]u8 = undefined;
    @memcpy(&hash_array, msgHash);

    // Inline signature verification
    const e = std.mem.readInt(u256, &hash_array, .big);
    const s_inv = crypto.secp256k1.unauditedInvmod(s, crypto.secp256k1.SECP256K1_N) orelse return 0;
    const u_1 = crypto.secp256k1.unauditedMulmod(e, s_inv, crypto.secp256k1.SECP256K1_N);
    const u_2 = crypto.secp256k1.unauditedMulmod(r, s_inv, crypto.secp256k1.SECP256K1_N);
    const u1G = crypto.secp256k1.AffinePoint.generator().scalarMul(u_1);
    const u2Q = pub_key.scalarMul(u_2);
    const R_prime = u1G.add(u2Q);

    if (R_prime.infinity) return 0;
    if ((R_prime.x % crypto.secp256k1.SECP256K1_N) == r) {
        return 1;
    }
    return 0;
}

/// Recover public key from signature (WASM variant)
export fn secp256k1Recover(
    msgHash_ptr: [*]const u8,
    sig_ptr: [*]const u8,
    recid: u8,
    pubKey_ptr: [*]u8,
) c_int {
    const msgHash = msgHash_ptr[0..32];
    const r_bytes = sig_ptr[0..32];
    const s_bytes = sig_ptr[32..64];

    const pub_key = crypto.secp256k1.recoverPubkey(msgHash, r_bytes, s_bytes, recid + 27) catch {
        return 1;
    };

    @memcpy(pubKey_ptr[0..64], &pub_key);
    return 0;
}

/// Derive public key from private key (WASM variant)
export fn secp256k1DerivePublicKey(
    privKey_ptr: [*]const u8,
    pubKey_ptr: [*]u8,
) c_int {
    const privKey = privKey_ptr[0..32];
    const priv = std.mem.readInt(u256, privKey[0..32], .big);

    if (priv == 0 or priv >= crypto.secp256k1.SECP256K1_N) return 1;

    const pub_key = crypto.secp256k1.AffinePoint.generator().scalarMul(priv);

    if (pub_key.infinity or !pub_key.isOnCurve()) return 1;

    std.mem.writeInt(u256, pubKey_ptr[0..32], pub_key.x, .big);
    std.mem.writeInt(u256, pubKey_ptr[32..64], pub_key.y, .big);

    return 0;
}

// ============================================================================
// Hash Algorithms (SHA256, RIPEMD160)
// ============================================================================

/// Compute SHA256 hash of input data
export fn primitives_sha256(
    data: [*]const u8,
    data_len: usize,
    out_hash: *[32]u8,
) c_int {
    const input = data[0..data_len];
    crypto.HashAlgorithms.SHA256.hash(input, out_hash) catch {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    };
    return PRIMITIVES_SUCCESS;
}

/// Compute RIPEMD160 hash of input data
export fn primitives_ripemd160(
    data: [*]const u8,
    data_len: usize,
    out_hash: *[20]u8,
) c_int {
    const input = data[0..data_len];
    crypto.HashAlgorithms.RIPEMD160.hash(input, out_hash) catch {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    };
    return PRIMITIVES_SUCCESS;
}

// ============================================================================
// RLP Encoding/Decoding
// ============================================================================

/// Encode bytes as RLP
/// Returns the number of bytes written, or negative error code
export fn primitives_rlp_encode_bytes(
    data: [*]const u8,
    data_len: usize,
    out_buf: [*]u8,
    buf_len: usize,
) c_int {
    const input = data[0..data_len];

    // Use larger stack buffer for WASM (2MB) since web environments have more memory
    // Native C builds use smaller 4KB buffer for embedded/constrained environments
    const is_wasm = builtin.target.cpu.arch == .wasm32 or builtin.target.cpu.arch == .wasm64;
    if (is_wasm) {
        var stack_buf: [2 * 1024 * 1024]u8 = undefined;
        var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
        const allocator = fba.allocator();

        const encoded = primitives.Rlp.encodeBytes(allocator, input) catch {
            return PRIMITIVES_ERROR_OUT_OF_MEMORY;
        };
        defer allocator.free(encoded);

        if (encoded.len > buf_len) {
            return PRIMITIVES_ERROR_INVALID_LENGTH;
        }

        @memcpy(out_buf[0..encoded.len], encoded);
        return @intCast(encoded.len);
    } else {
        var stack_buf: [4096]u8 = undefined;
        var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
        const allocator = fba.allocator();

        const encoded = primitives.Rlp.encodeBytes(allocator, input) catch {
            return PRIMITIVES_ERROR_OUT_OF_MEMORY;
        };
        defer allocator.free(encoded);

        if (encoded.len > buf_len) {
            return PRIMITIVES_ERROR_INVALID_LENGTH;
        }

        @memcpy(out_buf[0..encoded.len], encoded);
        return @intCast(encoded.len);
    }
}

/// Encode unsigned integer as RLP
/// value_bytes must be 32 bytes (big-endian u256)
export fn primitives_rlp_encode_uint(
    value_bytes: *const [32]u8,
    out_buf: [*]u8,
    buf_len: usize,
) c_int {
    const value = std.mem.readInt(u256, value_bytes, .big);

    var stack_buf: [512]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
    const allocator = fba.allocator();

    // Convert u256 to minimal bytes
    var value_buf: [32]u8 = undefined;
    std.mem.writeInt(u256, &value_buf, value, .big);

    // Find first non-zero byte
    var start: usize = 0;
    while (start < 32 and value_buf[start] == 0) : (start += 1) {}

    const minimal_bytes = if (start == 32) &[_]u8{} else value_buf[start..];

    const encoded = primitives.Rlp.encodeBytes(allocator, minimal_bytes) catch {
        return PRIMITIVES_ERROR_OUT_OF_MEMORY;
    };
    defer allocator.free(encoded);

    if (encoded.len > buf_len) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    @memcpy(out_buf[0..encoded.len], encoded);
    return @intCast(encoded.len);
}

/// Convert RLP bytes to hex string
export fn primitives_rlp_to_hex(
    rlp_data: [*]const u8,
    rlp_len: usize,
    out_buf: [*]u8,
    buf_len: usize,
) c_int {
    const input = rlp_data[0..rlp_len];

    var stack_buf: [8192]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
    const allocator = fba.allocator();

    const hex = primitives.Rlp.bytesToHex(allocator, input) catch {
        return PRIMITIVES_ERROR_OUT_OF_MEMORY;
    };
    defer allocator.free(hex);

    if (hex.len > buf_len) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    @memcpy(out_buf[0..hex.len], hex);
    return @intCast(hex.len);
}

/// Convert hex string to RLP bytes
export fn primitives_rlp_from_hex(
    hex: [*:0]const u8,
    out_buf: [*]u8,
    buf_len: usize,
) c_int {
    const hex_slice = std.mem.span(hex);

    var stack_buf: [8192]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
    const allocator = fba.allocator();

    const bytes = primitives.Rlp.hexToBytes(allocator, hex_slice) catch {
        return PRIMITIVES_ERROR_INVALID_HEX;
    };
    defer allocator.free(bytes);

    if (bytes.len > buf_len) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    @memcpy(out_buf[0..bytes.len], bytes);
    return @intCast(bytes.len);
}

// ============================================================================
// Transaction Operations
// ============================================================================

/// Detect transaction type from serialized data
/// Returns type (0-4) or negative error code
export fn primitives_tx_detect_type(
    data: [*]const u8,
    data_len: usize,
) c_int {
    const input = data[0..data_len];
    const tx_type = primitives.Transaction.detectTransactionType(input);

    return switch (tx_type) {
        .legacy => 0,
        .eip2930 => 1,
        .eip1559 => 2,
        .eip4844 => 3,
        .eip7702 => 4,
    };
}

// ============================================================================
// Signature Utilities
// ============================================================================

/// Normalize signature to canonical form (low-s)
/// Modifies signature in-place if needed
/// Returns true if normalization was performed
export fn primitives_signature_normalize(
    r: *[32]u8,
    s: *[32]u8,
) bool {
    _ = r; // r is not needed for normalization, only s
    const s_u256 = std.mem.readInt(u256, s, .big);

    // Check if s is in the upper half of the curve order
    const half_n = crypto.secp256k1.SECP256K1_N / 2;

    if (s_u256 > half_n) {
        // Normalize: s' = N - s
        const normalized_s = crypto.secp256k1.SECP256K1_N - s_u256;
        std.mem.writeInt(u256, s, normalized_s, .big);
        return true;
    }

    return false;
}

/// Check if signature is in canonical form
export fn primitives_signature_is_canonical(
    r: *const [32]u8,
    s: *const [32]u8,
) bool {
    const r_u256 = std.mem.readInt(u256, r, .big);
    const s_u256 = std.mem.readInt(u256, s, .big);

    return crypto.secp256k1.unauditedValidateSignature(r_u256, s_u256);
}

/// Parse signature from DER or compact format
/// Input: 64 or 65 byte signature (r + s + optional v)
/// Output: r, s, v components
export fn primitives_signature_parse(
    sig_data: [*]const u8,
    sig_len: usize,
    out_r: *[32]u8,
    out_s: *[32]u8,
    out_v: *u8,
) c_int {
    if (sig_len == 64) {
        // Compact format: r(32) + s(32)
        @memcpy(out_r, sig_data[0..32]);
        @memcpy(out_s, sig_data[32..64]);
        out_v.* = 0; // No v provided
        return PRIMITIVES_SUCCESS;
    } else if (sig_len == 65) {
        // Compact format with v: r(32) + s(32) + v(1)
        @memcpy(out_r, sig_data[0..32]);
        @memcpy(out_s, sig_data[32..64]);
        out_v.* = sig_data[64];
        return PRIMITIVES_SUCCESS;
    } else {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }
}

/// Serialize signature to compact format (64 or 65 bytes)
/// include_v: if true, append v byte to create 65-byte signature
export fn primitives_signature_serialize(
    r: *const [32]u8,
    s: *const [32]u8,
    v: u8,
    include_v: bool,
    out_buf: [*]u8,
) c_int {
    @memcpy(out_buf[0..32], r);
    @memcpy(out_buf[32..64], s);

    if (include_v) {
        out_buf[64] = v;
        return 65;
    }

    return 64;
}

// ============================================================================
// Wallet Generation
// ============================================================================

/// Generate a cryptographically secure random private key
export fn primitives_generate_private_key(
    out_private_key: *[32]u8,
) c_int {
    var rng = std.crypto.random;

    // Generate random 32 bytes
    rng.bytes(out_private_key);

    // Ensure the key is valid (< secp256k1 curve order)
    const key_value = std.mem.readInt(u256, out_private_key, .big);
    if (key_value == 0 or key_value >= crypto.secp256k1.SECP256K1_N) {
        // Invalid key, regenerate (extremely rare)
        return primitives_generate_private_key(out_private_key);
    }

    return PRIMITIVES_SUCCESS;
}

/// Compress public key from uncompressed format (64 bytes) to compressed (33 bytes)
export fn primitives_compress_public_key(
    uncompressed: *const [64]u8,
    out_compressed: *[33]u8,
) c_int {
    const x_bytes = uncompressed[0..32];
    const y_bytes = uncompressed[32..64];

    const y = std.mem.readInt(u256, y_bytes, .big);

    // Prefix: 0x02 if y is even, 0x03 if y is odd
    out_compressed[0] = if (y & 1 == 0) 0x02 else 0x03;

    // Copy x coordinate
    @memcpy(out_compressed[1..33], x_bytes);

    return PRIMITIVES_SUCCESS;
}

// ============================================================================
// Bytecode Operations
// ============================================================================

/// Analyze bytecode to find valid JUMPDEST locations
/// Returns the number of valid jump destinations found
/// out_jumpdests must have space for at least max_jumpdests u32 values
export fn primitives_bytecode_analyze_jumpdests(
    code: [*]const u8,
    code_len: usize,
    out_jumpdests: [*]u32,
    max_jumpdests: usize,
) c_int {
    const bytecode = code[0..code_len];

    var count: usize = 0;
    var pc: u32 = 0;

    while (pc < bytecode.len and count < max_jumpdests) {
        const opcode = bytecode[pc];

        // Check if this is a JUMPDEST (0x5b)
        if (opcode == 0x5b) {
            out_jumpdests[count] = pc;
            count += 1;
            pc += 1;
        } else if (opcode >= 0x60 and opcode <= 0x7f) {
            // PUSH1-PUSH32: skip immediate data
            const push_size = opcode - 0x5f;
            pc += 1 + push_size;
        } else {
            pc += 1;
        }
    }

    return @intCast(count);
}

/// Check if a position is at a bytecode boundary (not inside PUSH data)
export fn primitives_bytecode_is_boundary(
    code: [*]const u8,
    code_len: usize,
    position: u32,
) bool {
    const bytecode = code[0..code_len];

    if (position >= bytecode.len) {
        return false;
    }

    var pc: u32 = 0;
    while (pc < position) {
        const opcode = bytecode[pc];

        if (opcode >= 0x60 and opcode <= 0x7f) {
            // PUSH1-PUSH32
            const push_size = opcode - 0x5f;
            pc += 1 + push_size;

            // If we jumped past the position, it's inside PUSH data
            if (pc > position) {
                return false;
            }
        } else {
            pc += 1;
        }
    }

    return pc == position;
}

/// Check if a position is a valid JUMPDEST
export fn primitives_bytecode_is_valid_jumpdest(
    code: [*]const u8,
    code_len: usize,
    position: u32,
) bool {
    const bytecode = code[0..code_len];

    // Must be at a boundary
    if (!primitives_bytecode_is_boundary(code, code_len, position)) {
        return false;
    }

    // Must be within bounds and be JUMPDEST opcode
    if (position >= bytecode.len) {
        return false;
    }

    return bytecode[position] == 0x5b;
}

/// Validate bytecode for basic correctness
/// Returns PRIMITIVES_SUCCESS if valid, error code otherwise
export fn primitives_bytecode_validate(
    code: [*]const u8,
    code_len: usize,
) c_int {
    const bytecode = code[0..code_len];

    var pc: usize = 0;
    while (pc < bytecode.len) {
        const opcode = bytecode[pc];

        if (opcode >= 0x60 and opcode <= 0x7f) {
            // PUSH1-PUSH32
            const push_size: usize = opcode - 0x5f;

            // Check if we have enough bytes for the PUSH data
            if (pc + 1 + push_size > bytecode.len) {
                return PRIMITIVES_ERROR_INVALID_INPUT;
            }

            pc += 1 + push_size;
        } else {
            pc += 1;
        }
    }

    return PRIMITIVES_SUCCESS;
}

// ============================================================================
// Solidity Packed Hashing
// ============================================================================

/// Compute keccak256 of tightly packed arguments
/// This mimics Solidity's abi.encodePacked followed by keccak256
export fn primitives_solidity_keccak256(
    packed_data: [*]const u8,
    data_len: usize,
    out_hash: *PrimitivesHash,
) c_int {
    const input = packed_data[0..data_len];
    const hash = crypto.HashUtils.keccak256(input);
    @memcpy(&out_hash.bytes, &hash);
    return PRIMITIVES_SUCCESS;
}

/// Compute SHA256 of tightly packed arguments
export fn primitives_solidity_sha256(
    packed_data: [*]const u8,
    data_len: usize,
    out_hash: *[32]u8,
) c_int {
    const input = packed_data[0..data_len];
    crypto.HashAlgorithms.SHA256.hash(input, out_hash) catch {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    };
    return PRIMITIVES_SUCCESS;
}

// ============================================================================
// Additional Hash Algorithms
// ============================================================================

/// Compute Blake2b hash (for EIP-152)
export fn primitives_blake2b(
    data: [*]const u8,
    data_len: usize,
    out_hash: *[64]u8,
) c_int {
    const input = data[0..data_len];
    std.crypto.hash.blake2.Blake2b512.hash(input, out_hash, .{});
    return PRIMITIVES_SUCCESS;
}

// ============================================================================
// CREATE2 Address Calculation
// ============================================================================

/// Calculate CREATE2 contract address
/// Formula: keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
export fn primitives_calculate_create2_address(
    sender: *const PrimitivesAddress,
    salt: *const [32]u8,
    init_code: [*]const u8,
    init_code_len: usize,
    out_address: *PrimitivesAddress,
) c_int {
    const sender_addr = primitives.Address{ .bytes = sender.bytes };
    const salt_u256 = std.mem.readInt(u256, salt, .big);
    const code = init_code[0..init_code_len];

    var stack_buf: [4096]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
    const allocator = fba.allocator();

    const addr = primitives.Address.calculateCreate2Address(
        allocator,
        sender_addr,
        salt_u256,
        code,
    ) catch {
        return PRIMITIVES_ERROR_OUT_OF_MEMORY;
    };

    @memcpy(&out_address.bytes, &addr.bytes);
    return PRIMITIVES_SUCCESS;
}

// ============================================================================
// ABI Encoding/Decoding API
// ============================================================================

/// Compute function selector from signature
/// signature: null-terminated string (e.g., "transfer(address,uint256)")
/// out_selector: 4-byte buffer for selector output
export fn primitives_abi_compute_selector(
    signature: [*:0]const u8,
    out_selector: *[4]u8,
) c_int {
    const sig_slice = std.mem.span(signature);
    const selector = primitives.Abi.computeSelector(sig_slice);
    @memcpy(out_selector, &selector);
    return PRIMITIVES_SUCCESS;
}

/// Parse ABI type from string representation
/// Returns AbiType or error
fn parseAbiType(allocator: std.mem.Allocator, type_str: []const u8) !primitives.Abi.AbiType {
    _ = allocator;

    // Basic types
    if (std.mem.eql(u8, type_str, "address")) return .address;
    if (std.mem.eql(u8, type_str, "bool")) return .bool;
    if (std.mem.eql(u8, type_str, "string")) return .string;
    if (std.mem.eql(u8, type_str, "bytes")) return .bytes;

    // Check for uint types (uint8, uint16, ..., uint256)
    if (std.mem.startsWith(u8, type_str, "uint")) {
        const bits_str = type_str[4..];
        if (bits_str.len == 0) return .uint256; // default uint = uint256
        const bits = std.fmt.parseInt(u16, bits_str, 10) catch return error.InvalidType;
        return switch (bits) {
            8 => .uint8,
            16 => .uint16,
            32 => .uint32,
            64 => .uint64,
            128 => .uint128,
            256 => .uint256,
            else => error.InvalidType,
        };
    }

    // Check for int types (int8, int16, ..., int256)
    if (std.mem.startsWith(u8, type_str, "int")) {
        const bits_str = type_str[3..];
        if (bits_str.len == 0) return .int256; // default int = int256
        const bits = std.fmt.parseInt(u16, bits_str, 10) catch return error.InvalidType;
        return switch (bits) {
            8 => .int8,
            16 => .int16,
            32 => .int32,
            64 => .int64,
            128 => .int128,
            256 => .int256,
            else => error.InvalidType,
        };
    }

    // Check for bytesN (bytes1, bytes2, ..., bytes32)
    if (std.mem.startsWith(u8, type_str, "bytes")) {
        const n_str = type_str[5..];
        if (n_str.len > 0) {
            const n = std.fmt.parseInt(u8, n_str, 10) catch return error.InvalidType;
            return switch (n) {
                1 => .bytes1,
                2 => .bytes2,
                3 => .bytes3,
                4 => .bytes4,
                8 => .bytes8,
                16 => .bytes16,
                32 => .bytes32,
                else => error.InvalidType,
            };
        }
    }

    // Check for array types (supported: uint256[], bytes32[], address[], string[])
    if (std.mem.eql(u8, type_str, "uint256[]")) return .@"uint256[]";
    if (std.mem.eql(u8, type_str, "bytes32[]")) return .@"bytes32[]";
    if (std.mem.eql(u8, type_str, "address[]")) return .@"address[]";
    if (std.mem.eql(u8, type_str, "string[]")) return .@"string[]";

    return error.UnsupportedType;
}

/// Helper to parse ABI value from JSON-like string format
/// Format examples:
/// - address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
/// - uint256: "42" or "0x2a"
/// - bool: "true" or "false"
/// - string: "hello world"
/// - bytes: "0x1234"
fn parseAbiValue(allocator: std.mem.Allocator, abi_type: primitives.Abi.AbiType, value_str: []const u8) !primitives.Abi.AbiValue {
    switch (abi_type) {
        .address => {
            const addr = primitives.Address.fromHex(value_str) catch return error.InvalidData;
            return .{ .address = addr };
        },
        .bool => {
            if (std.mem.eql(u8, value_str, "true")) return .{ .bool = true };
            if (std.mem.eql(u8, value_str, "false")) return .{ .bool = false };
            return error.InvalidData;
        },
        .uint8, .uint16, .uint32, .uint64, .uint128, .uint256 => {
            // Parse as hex or decimal
            const val = if (std.mem.startsWith(u8, value_str, "0x"))
                std.fmt.parseInt(u256, value_str[2..], 16) catch return error.InvalidData
            else
                std.fmt.parseInt(u256, value_str, 10) catch return error.InvalidData;
            return .{ .uint256 = val };
        },
        .int8, .int16, .int32, .int64, .int128, .int256 => {
            // Parse as hex or decimal (supporting negative for int types)
            const val = if (std.mem.startsWith(u8, value_str, "0x"))
                std.fmt.parseInt(i256, value_str[2..], 16) catch return error.InvalidData
            else
                std.fmt.parseInt(i256, value_str, 10) catch return error.InvalidData;
            return .{ .int256 = val };
        },
        .string => {
            return .{ .string = value_str };
        },
        .bytes => {
            var stack_buf: [1024]u8 = undefined;
            var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
            const temp_allocator = fba.allocator();

            const bytes = primitives.Hex.hexToBytes(temp_allocator, value_str) catch return error.InvalidData;
            defer temp_allocator.free(bytes);

            // Copy to provided allocator
            const bytes_copy = try allocator.alloc(u8, bytes.len);
            @memcpy(bytes_copy, bytes);
            return .{ .bytes = bytes_copy };
        },
        .bytes1, .bytes2, .bytes3, .bytes4, .bytes8, .bytes16, .bytes32 => {
            var stack_buf: [1024]u8 = undefined;
            var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
            const temp_allocator = fba.allocator();

            const bytes = primitives.Hex.hexToBytes(temp_allocator, value_str) catch return error.InvalidData;
            defer temp_allocator.free(bytes);

            // Return appropriate fixed bytes type
            return switch (abi_type) {
                .bytes32 => blk: {
                    if (bytes.len != 32) return error.InvalidData;
                    var arr: [32]u8 = undefined;
                    @memcpy(&arr, bytes);
                    break :blk .{ .bytes32 = arr };
                },
                .bytes4 => blk: {
                    if (bytes.len != 4) return error.InvalidData;
                    var arr: [4]u8 = undefined;
                    @memcpy(&arr, bytes);
                    break :blk .{ .bytes4 = arr };
                },
                else => error.UnsupportedType,
            };
        },
        else => return error.UnsupportedType,
    }
}

/// Encode ABI parameters
/// types_json: JSON array of type strings, e.g., ["address","uint256","bool"]
/// values_json: JSON array of value strings, e.g., ["0x...", "42", "true"]
/// out_buf: output buffer for encoded data
/// buf_len: size of output buffer
/// Returns: number of bytes written, or negative error code
export fn primitives_abi_encode_parameters(
    types_json: [*:0]const u8,
    values_json: [*:0]const u8,
    out_buf: [*]u8,
    buf_len: usize,
) c_int {
    const types_str = std.mem.span(types_json);
    const values_str = std.mem.span(values_json);

    const is_wasm = builtin.target.cpu.arch == .wasm32 or builtin.target.cpu.arch == .wasm64;
    if (is_wasm) {
        var stack_buf: [2 * 1024 * 1024]u8 = undefined;
        var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
        const allocator = fba.allocator();

        return abiEncodeParametersImpl(allocator, types_str, values_str, out_buf, buf_len);
    } else {
        var stack_buf: [8192]u8 = undefined;
        var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
        const allocator = fba.allocator();

        return abiEncodeParametersImpl(allocator, types_str, values_str, out_buf, buf_len);
    }
}

fn abiEncodeParametersImpl(
    allocator: std.mem.Allocator,
    types_str: []const u8,
    values_str: []const u8,
    out_buf: [*]u8,
    buf_len: usize,
) c_int {
    // Simple JSON parsing for array of strings
    // Expected format: ["type1","type2",...] and ["value1","value2",...]

    // Parse types array
    var types_list = std.array_list.AlignedManaged(primitives.Abi.AbiType, null).init(allocator);
    defer types_list.deinit();

    if (!parseJsonTypeArray(allocator, types_str, &types_list)) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    // Parse values array
    var values_strs = std.array_list.AlignedManaged([]const u8, null).init(allocator);
    defer values_strs.deinit();

    if (!parseJsonStringValueArray(values_str, &values_strs)) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    if (types_list.items.len != values_strs.items.len) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    // Parse ABI values
    var abi_values = std.array_list.AlignedManaged(primitives.Abi.AbiValue, null).init(allocator);
    defer {
        for (abi_values.items) |*v| {
            freeAbiValue(allocator, v);
        }
        abi_values.deinit();
    }

    for (types_list.items, values_strs.items) |abi_type, value_str| {
        const abi_value = parseAbiValue(allocator, abi_type, value_str) catch {
            return PRIMITIVES_ERROR_INVALID_INPUT;
        };
        abi_values.append(abi_value) catch {
            return PRIMITIVES_ERROR_OUT_OF_MEMORY;
        };
    }

    // Encode
    const encoded = primitives.Abi.encodeAbiParameters(allocator, abi_values.items) catch |err| {
        return switch (err) {
            error.OutOfMemory => PRIMITIVES_ERROR_OUT_OF_MEMORY,
            error.MaxLengthExceeded => PRIMITIVES_ERROR_MAX_LENGTH_EXCEEDED,
            else => PRIMITIVES_ERROR_INVALID_INPUT,
        };
    };
    defer allocator.free(encoded);

    if (encoded.len > buf_len) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    @memcpy(out_buf[0..encoded.len], encoded);
    return @intCast(encoded.len);
}

/// Decode ABI parameters
/// data: encoded ABI data
/// data_len: length of encoded data
/// types_json: JSON array of type strings
/// out_buf: output buffer for JSON-encoded values
/// buf_len: size of output buffer
/// Returns: number of bytes written to out_buf, or negative error code
export fn primitives_abi_decode_parameters(
    data: [*]const u8,
    data_len: usize,
    types_json: [*:0]const u8,
    out_buf: [*]u8,
    buf_len: usize,
) c_int {
    const data_slice = data[0..data_len];
    const types_str = std.mem.span(types_json);

    const is_wasm = builtin.target.cpu.arch == .wasm32 or builtin.target.cpu.arch == .wasm64;
    if (is_wasm) {
        var stack_buf: [2 * 1024 * 1024]u8 = undefined;
        var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
        const allocator = fba.allocator();

        return abiDecodeParametersImpl(allocator, data_slice, types_str, out_buf, buf_len);
    } else {
        var stack_buf: [8192]u8 = undefined;
        var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
        const allocator = fba.allocator();

        return abiDecodeParametersImpl(allocator, data_slice, types_str, out_buf, buf_len);
    }
}

fn abiDecodeParametersImpl(
    allocator: std.mem.Allocator,
    data: []const u8,
    types_str: []const u8,
    out_buf: [*]u8,
    buf_len: usize,
) c_int {
    // Parse types array
    var types_list = std.array_list.AlignedManaged(primitives.Abi.AbiType, null).init(allocator);
    defer types_list.deinit();

    if (!parseJsonTypeArray(allocator, types_str, &types_list)) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    // Decode
    const decoded = primitives.Abi.decodeAbiParameters(allocator, data, types_list.items) catch |err| {
        return switch (err) {
            error.OutOfMemory => PRIMITIVES_ERROR_OUT_OF_MEMORY,
            error.InvalidData => PRIMITIVES_ERROR_INVALID_INPUT,
            error.DataTooSmall => PRIMITIVES_ERROR_INVALID_LENGTH,
            else => PRIMITIVES_ERROR_INVALID_INPUT,
        };
    };
    defer {
        for (decoded) |*v| {
            freeAbiValue(allocator, v);
        }
        allocator.free(decoded);
    }

    // Convert decoded values to JSON string array
    const json_result = formatAbiValuesToJson(allocator, decoded) catch {
        return PRIMITIVES_ERROR_OUT_OF_MEMORY;
    };
    defer allocator.free(json_result);

    if (json_result.len > buf_len) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    @memcpy(out_buf[0..json_result.len], json_result);
    return @intCast(json_result.len);
}

/// Helper: Parse JSON string array into ArrayList of AbiType
fn parseJsonTypeArray(
    allocator: std.mem.Allocator,
    json_str: []const u8,
    list: *std.array_list.AlignedManaged(primitives.Abi.AbiType, null),
) bool {
    var str = json_str;
    // Trim whitespace
    while (str.len > 0 and std.mem.indexOfScalar(u8, " \t\n\r", str[0]) != null) {
        str = str[1..];
    }

    if (str.len < 2 or str[0] != '[') return false;
    str = str[1..]; // Skip '['

    while (true) {
        // Trim whitespace
        while (str.len > 0 and std.mem.indexOfScalar(u8, " \t\n\r", str[0]) != null) {
            str = str[1..];
        }

        if (str.len == 0) return false;
        if (str[0] == ']') break;

        // Parse string element
        if (str[0] != '"') return false;
        str = str[1..]; // Skip opening quote

        const end_quote = std.mem.indexOfScalar(u8, str, '"') orelse return false;
        const element = str[0..end_quote];
        str = str[end_quote + 1 ..]; // Skip element and closing quote

        // Parse and append AbiType
        const abi_type = parseAbiType(allocator, element) catch return false;
        list.append(abi_type) catch return false;

        // Trim whitespace
        while (str.len > 0 and std.mem.indexOfScalar(u8, " \t\n\r", str[0]) != null) {
            str = str[1..];
        }

        if (str.len == 0) return false;
        if (str[0] == ',') {
            str = str[1..]; // Skip comma
            continue;
        }
        if (str[0] == ']') break;
        return false;
    }

    return true;
}

/// Helper: Parse JSON string array into ArrayList of string slices
fn parseJsonStringValueArray(
    json_str: []const u8,
    list: *std.array_list.AlignedManaged([]const u8, null),
) bool {
    var str = json_str;
    // Trim whitespace
    while (str.len > 0 and std.mem.indexOfScalar(u8, " \t\n\r", str[0]) != null) {
        str = str[1..];
    }

    if (str.len < 2 or str[0] != '[') return false;
    str = str[1..]; // Skip '['

    while (true) {
        // Trim whitespace
        while (str.len > 0 and std.mem.indexOfScalar(u8, " \t\n\r", str[0]) != null) {
            str = str[1..];
        }

        if (str.len == 0) return false;
        if (str[0] == ']') break;

        // Parse string element
        if (str[0] != '"') return false;
        str = str[1..]; // Skip opening quote

        const end_quote = std.mem.indexOfScalar(u8, str, '"') orelse return false;
        const element = str[0..end_quote];
        str = str[end_quote + 1 ..]; // Skip element and closing quote

        // Append string slice
        list.append(element) catch return false;

        // Trim whitespace
        while (str.len > 0 and std.mem.indexOfScalar(u8, " \t\n\r", str[0]) != null) {
            str = str[1..];
        }

        if (str.len == 0) return false;
        if (str[0] == ',') {
            str = str[1..]; // Skip comma
            continue;
        }
        if (str[0] == ']') break;
        return false;
    }

    return true;
}

/// Helper: Format ABI values to JSON string array
fn formatAbiValuesToJson(allocator: std.mem.Allocator, values: []const primitives.Abi.AbiValue) ![]u8 {
    var result = std.array_list.AlignedManaged(u8, null).init(allocator);
    defer result.deinit();

    try result.append('[');

    for (values, 0..) |value, i| {
        if (i > 0) try result.append(',');
        try result.append('"');

        switch (value) {
            .uint256 => |val| {
                var buf: [66]u8 = undefined;
                const hex = std.fmt.bufPrint(&buf, "0x{x}", .{val}) catch return error.OutOfMemory;
                try result.appendSlice(hex);
            },
            .address => |addr| {
                const hex = addr.toHex();
                try result.appendSlice(&hex);
            },
            .bool => |b| {
                const str = if (b) "true" else "false";
                try result.appendSlice(str);
            },
            .string => |s| {
                try result.appendSlice(s);
            },
            .bytes => |b| {
                var temp_buf: [2048]u8 = undefined;
                var temp_fba = std.heap.FixedBufferAllocator.init(&temp_buf);
                const temp_allocator = temp_fba.allocator();

                const hex = primitives.Hex.bytesToHex(temp_allocator, b) catch return error.OutOfMemory;
                defer temp_allocator.free(hex);
                try result.appendSlice(hex);
            },
            else => {
                // For other types, just return "unsupported"
                try result.appendSlice("unsupported");
            },
        }

        try result.append('"');
    }

    try result.append(']');
    return result.toOwnedSlice();
}

/// Helper: Free ABI type (no-op for enum-based AbiType)
fn freeAbiType(allocator: std.mem.Allocator, abi_type: *primitives.Abi.AbiType) void {
    _ = allocator;
    _ = abi_type;
    // AbiType is a simple enum with no heap allocations
}

/// Helper: Free ABI value (if it has allocations)
fn freeAbiValue(allocator: std.mem.Allocator, value: *primitives.Abi.AbiValue) void {
    switch (value.*) {
        .string => |s| allocator.free(s),
        .bytes => |b| allocator.free(b),
        .@"uint256[]" => |arr| allocator.free(arr),
        .@"bytes32[]" => |arr| allocator.free(arr),
        .@"address[]" => |arr| allocator.free(arr),
        .@"string[]" => |arr| {
            for (arr) |s| {
                allocator.free(s);
            }
            allocator.free(arr);
        },
        else => {},
    }
}

// ============================================================================
// Blob Operations (EIP-4844)
// ============================================================================

/// Encode data as blob (with length prefix)
/// Returns PRIMITIVES_SUCCESS on success
export fn primitives_blob_from_data(
    data: [*]const u8,
    data_len: usize,
    out_blob: [*]u8,
) c_int {
    const blob_module = @import("primitives").Blob;

    if (data_len > blob_module.BYTES_PER_BLOB - 8) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    var blob: blob_module.Blob = [_]u8{0x00} ** blob_module.BYTES_PER_BLOB;

    // Length prefix (8 bytes, little-endian u64)
    const len_u64: u64 = @intCast(data_len);
    const len_bytes = std.mem.toBytes(len_u64);
    @memcpy(blob[0..8], &len_bytes);

    // Copy data
    @memcpy(blob[8 .. 8 + data_len], data[0..data_len]);

    @memcpy(out_blob[0..blob_module.BYTES_PER_BLOB], &blob);
    return PRIMITIVES_SUCCESS;
}

/// Decode blob to extract original data
/// Returns length of data or negative error code
export fn primitives_blob_to_data(
    blob: [*]const u8,
    out_data: [*]u8,
    out_len: *usize,
) c_int {
    const blob_module = @import("primitives").Blob;

    // Read length prefix (u64, little-endian)
    const len_u64 = std.mem.bytesToValue(u64, blob[0..8]);
    const len: usize = @intCast(len_u64);

    if (len > blob_module.BYTES_PER_BLOB - 8) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    // Copy data
    @memcpy(out_data[0..len], blob[8 .. 8 + len]);
    out_len.* = len;

    return PRIMITIVES_SUCCESS;
}

/// Validate blob size
/// Returns 1 if valid, 0 if invalid
export fn primitives_blob_is_valid(
    blob_len: usize,
) c_int {
    const blob_module = @import("primitives").Blob;
    return if (blob_len == blob_module.BYTES_PER_BLOB) 1 else 0;
}

/// Calculate blob gas for number of blobs
/// Returns total blob gas
export fn primitives_blob_calculate_gas(
    blob_count: u32,
) u64 {
    const blob_module = @import("primitives").Blob;
    return @as(u64, blob_count) * blob_module.BLOB_GAS_PER_BLOB;
}

/// Estimate number of blobs needed for data size
/// Returns number of blobs required
export fn primitives_blob_estimate_count(
    data_size: usize,
) u32 {
    const blob_module = @import("primitives").Blob;
    const max_data_per_blob = blob_module.BYTES_PER_BLOB - 8;
    const count = (data_size + max_data_per_blob - 1) / max_data_per_blob;
    return @intCast(count);
}

/// Calculate blob gas price from excess blob gas
/// Returns blob gas price
export fn primitives_blob_calculate_gas_price(
    excess_blob_gas: u64,
) u64 {
    const blob_module = @import("primitives").Blob;
    return blob_module.calculateBlobGasPrice(excess_blob_gas);
}

/// Calculate excess blob gas for next block
/// Returns excess blob gas
export fn primitives_blob_calculate_excess_gas(
    parent_excess: u64,
    parent_used: u64,
) u64 {
    const blob_module = @import("primitives").Blob;
    return blob_module.calculateExcessBlobGas(parent_excess, parent_used);
}

// ============================================================================
// Event Log Operations
// ============================================================================

/// Check if event log matches address filter
/// Returns 1 if matches, 0 if not
export fn primitives_eventlog_matches_address(
    log_address: *const [20]u8,
    filter_addresses: [*]const [20]u8,
    filter_count: usize,
) c_int {
    if (filter_count == 0) {
        return 1; // No filter means match all
    }

    for (0..filter_count) |i| {
        const filter_addr = filter_addresses[i];
        if (std.mem.eql(u8, log_address, &filter_addr)) {
            return 1;
        }
    }

    return 0;
}

/// Check if event log matches single topic filter
/// null_topic: 1 if topic filter is null (match any), 0 otherwise
/// Returns 1 if matches, 0 if not
export fn primitives_eventlog_matches_topic(
    log_topic: *const [32]u8,
    filter_topic: *const [32]u8,
    null_topic: c_int,
) c_int {
    if (null_topic != 0) {
        return 1; // Null filter matches any
    }

    return if (std.mem.eql(u8, log_topic, filter_topic)) 1 else 0;
}

/// Check if log matches topic array filter
/// Returns 1 if matches, 0 if not
export fn primitives_eventlog_matches_topics(
    log_topics: [*]const [32]u8,
    log_topic_count: usize,
    filter_topics: [*]const [32]u8,
    filter_nulls: [*]const c_int,
    filter_count: usize,
) c_int {
    for (0..filter_count) |i| {
        if (filter_nulls[i] != 0) {
            continue; // Null filter matches any
        }

        if (i >= log_topic_count) {
            return 0; // Log doesn't have enough topics
        }

        const log_topic = log_topics[i];
        const filter_topic = filter_topics[i];

        if (!std.mem.eql(u8, &log_topic, &filter_topic)) {
            return 0;
        }
    }

    return 1;
}

// ============================================================================
// Version info
// ============================================================================

export fn primitives_version_string() [*:0]const u8 {
    return "primitives-0.1.0";
}

// ============================================================================
// Access List API (EIP-2930)
// ============================================================================

/// Calculate gas cost for access list
/// Input: JSON array of access list items
/// Output: u64 gas cost
export fn primitives_access_list_gas_cost(
    json_ptr: [*:0]const u8,
    out_cost: *u64,
) c_int {
    const json_str = std.mem.span(json_ptr);

    const is_wasm = builtin.target.cpu.arch == .wasm32 or builtin.target.cpu.arch == .wasm64;
    if (is_wasm) {
        var stack_buf: [2 * 1024 * 1024]u8 = undefined;
        var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
        const allocator = fba.allocator();

        return accessListGasCostImpl(allocator, json_str, out_cost);
    } else {
        var stack_buf: [8192]u8 = undefined;
        var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
        const allocator = fba.allocator();

        return accessListGasCostImpl(allocator, json_str, out_cost);
    }
}

fn accessListGasCostImpl(
    allocator: std.mem.Allocator,
    json_str: []const u8,
    out_cost: *u64,
) c_int {
    _ = allocator;
    _ = json_str;

    // Simplified: count addresses and keys from JSON
    // JSON format: [{"address":"0x...","storageKeys":["0x...","0x..."]}]
    // For now, return basic calculation
    // TODO: Parse JSON properly when needed
    out_cost.* = 0;

    return PRIMITIVES_SUCCESS;
}

/// Calculate gas savings for access list
export fn primitives_access_list_gas_savings(
    json_ptr: [*:0]const u8,
    out_savings: *u64,
) c_int {
    const json_str = std.mem.span(json_ptr);
    _ = json_str;

    // Simplified implementation
    out_savings.* = 0;

    return PRIMITIVES_SUCCESS;
}

/// Check if address is in access list
/// Returns 1 if found, 0 if not found
export fn primitives_access_list_includes_address(
    json_ptr: [*:0]const u8,
    address_ptr: *const PrimitivesAddress,
) c_int {
    const json_str = std.mem.span(json_ptr);
    _ = json_str;
    _ = address_ptr;

    // Simplified implementation
    return 0;
}

/// Check if storage key is in access list for address
/// Returns 1 if found, 0 if not found
export fn primitives_access_list_includes_storage_key(
    json_ptr: [*:0]const u8,
    address_ptr: *const PrimitivesAddress,
    key_ptr: *const PrimitivesHash,
) c_int {
    const json_str = std.mem.span(json_ptr);
    _ = json_str;
    _ = address_ptr;
    _ = key_ptr;

    // Simplified implementation
    return 0;
}

// ============================================================================
// Authorization API (EIP-7702)
// ============================================================================

/// C-compatible Authorization structure
pub const PrimitivesAuthorization = extern struct {
    chain_id: u64,
    address: PrimitivesAddress,
    nonce: u64,
    v: u64,
    r: [32]u8,
    s: [32]u8,
};

/// Validate authorization structure
export fn primitives_authorization_validate(
    auth_ptr: *const PrimitivesAuthorization,
) c_int {
    const auth_module = @import("primitives").Authorization;
    const auth = auth_module.Authorization{
        .chain_id = auth_ptr.chain_id,
        .address = primitives.Address{ .bytes = auth_ptr.address.bytes },
        .nonce = auth_ptr.nonce,
        .v = auth_ptr.v,
        .r = auth_ptr.r,
        .s = auth_ptr.s,
    };

    auth.validate() catch {
        return PRIMITIVES_ERROR_AUTHORIZATION_INVALID;
    };

    return PRIMITIVES_SUCCESS;
}

/// Calculate authorization signing hash
export fn primitives_authorization_signing_hash(
    chain_id: u64,
    address_ptr: *const PrimitivesAddress,
    nonce: u64,
    out_hash: *PrimitivesHash,
) c_int {
    const auth_module = @import("primitives").Authorization;
    const auth = auth_module.Authorization{
        .chain_id = chain_id,
        .address = primitives.Address{ .bytes = address_ptr.bytes },
        .nonce = nonce,
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const hash = auth.signingHash() catch {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    };

    @memcpy(&out_hash.bytes, &hash);
    return PRIMITIVES_SUCCESS;
}

/// Recover authority (signer) from authorization
export fn primitives_authorization_authority(
    auth_ptr: *const PrimitivesAuthorization,
    out_address: *PrimitivesAddress,
) c_int {
    const auth_module = @import("primitives").Authorization;
    const auth = auth_module.Authorization{
        .chain_id = auth_ptr.chain_id,
        .address = primitives.Address{ .bytes = auth_ptr.address.bytes },
        .nonce = auth_ptr.nonce,
        .v = auth_ptr.v,
        .r = auth_ptr.r,
        .s = auth_ptr.s,
    };

    const authority = auth.authority() catch {
        return PRIMITIVES_ERROR_INVALID_SIGNATURE;
    };

    @memcpy(&out_address.bytes, &authority.bytes);
    return PRIMITIVES_SUCCESS;
}

/// Calculate gas cost for authorization list
export fn primitives_authorization_gas_cost(
    count: usize,
    empty_accounts: usize,
) u64 {
    const auth_module = @import("primitives").Authorization;
    return auth_module.calculateAuthorizationGasCost(&[_]auth_module.Authorization{}, empty_accounts) + (auth_module.PER_AUTH_BASE_COST * count);
}

// ============================================================================
// ============================================================================
// AES-GCM API
// ============================================================================

/// Encrypt with AES-128-GCM
export fn aesGcm128Encrypt(
    plaintext_ptr: [*]const u8,
    plaintext_len: usize,
    key_ptr: [*]const u8,
    nonce_ptr: [*]const u8,
    ad_ptr: [*]const u8,
    ad_len: usize,
    out_ptr: [*]u8,
) c_int {
    const plaintext = plaintext_ptr[0..plaintext_len];
    const key = key_ptr[0..16];
    const nonce = nonce_ptr[0..12];
    const additional_data = ad_ptr[0..ad_len];
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const ciphertext = crypto.aes_gcm.encrypt128(allocator, plaintext, key, nonce, additional_data) catch return 1;
    defer allocator.free(ciphertext);

    @memcpy(out_ptr[0..ciphertext.len], ciphertext);
    return 0;
}

/// Decrypt with AES-128-GCM
export fn aesGcm128Decrypt(
    ciphertext_ptr: [*]const u8,
    ciphertext_len: usize,
    key_ptr: [*]const u8,
    nonce_ptr: [*]const u8,
    ad_ptr: [*]const u8,
    ad_len: usize,
    out_ptr: [*]u8,
) c_int {
    const ciphertext = ciphertext_ptr[0..ciphertext_len];
    const key = key_ptr[0..16];
    const nonce = nonce_ptr[0..12];
    const additional_data = ad_ptr[0..ad_len];
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const plaintext = crypto.aes_gcm.decrypt128(allocator, ciphertext, key, nonce, additional_data) catch return 1;
    defer allocator.free(plaintext);

    @memcpy(out_ptr[0..plaintext.len], plaintext);
    return 0;
}

/// Encrypt with AES-256-GCM
export fn aesGcm256Encrypt(
    plaintext_ptr: [*]const u8,
    plaintext_len: usize,
    key_ptr: [*]const u8,
    nonce_ptr: [*]const u8,
    ad_ptr: [*]const u8,
    ad_len: usize,
    out_ptr: [*]u8,
) c_int {
    const plaintext = plaintext_ptr[0..plaintext_len];
    const key = key_ptr[0..32];
    const nonce = nonce_ptr[0..12];
    const additional_data = ad_ptr[0..ad_len];
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const ciphertext = crypto.aes_gcm.encrypt256(allocator, plaintext, key, nonce, additional_data) catch return 1;
    defer allocator.free(ciphertext);

    @memcpy(out_ptr[0..ciphertext.len], ciphertext);
    return 0;
}

/// Decrypt with AES-256-GCM
export fn aesGcm256Decrypt(
    ciphertext_ptr: [*]const u8,
    ciphertext_len: usize,
    key_ptr: [*]const u8,
    nonce_ptr: [*]const u8,
    ad_ptr: [*]const u8,
    ad_len: usize,
    out_ptr: [*]u8,
) c_int {
    const ciphertext = ciphertext_ptr[0..ciphertext_len];
    const key = key_ptr[0..32];
    const nonce = nonce_ptr[0..12];
    const additional_data = ad_ptr[0..ad_len];
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const plaintext = crypto.aes_gcm.decrypt256(allocator, ciphertext, key, nonce, additional_data) catch return 1;
    defer allocator.free(plaintext);

    @memcpy(out_ptr[0..plaintext.len], plaintext);
    return 0;
}

// ============================================================================
// X25519 API
// ============================================================================

/// Derive X25519 public key from secret key
export fn x25519DerivePublicKey(
    secret_ptr: [*]const u8,
    pub_ptr: [*]u8,
) c_int {
    const secret = secret_ptr[0..32];
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const public_key = crypto.x25519.publicKeyFromSecret(allocator, secret) catch return 1;
    defer allocator.free(public_key);

    @memcpy(pub_ptr[0..32], public_key);
    return 0;
}

/// Perform X25519 scalar multiplication (ECDH)
export fn x25519Scalarmult(
    secret_ptr: [*]const u8,
    pub_ptr: [*]const u8,
    shared_ptr: [*]u8,
) c_int {
    const secret = secret_ptr[0..32];
    const public_key = pub_ptr[0..32];
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    const shared = crypto.x25519.scalarmult(allocator, secret, public_key) catch return 1;
    defer allocator.free(shared);

    @memcpy(shared_ptr[0..32], shared);
    return 0;
}

/// Generate X25519 keypair from seed
export fn x25519KeypairFromSeed(
    seed_ptr: [*]const u8,
    secret_ptr: [*]u8,
    pub_ptr: [*]u8,
) c_int {
    const seed = seed_ptr[0..32];

    const keypair = crypto.x25519.keypairFromSeed(seed) catch return 1;

    @memcpy(secret_ptr[0..32], &keypair.secret_key);
    @memcpy(pub_ptr[0..32], &keypair.public_key);
    return 0;
}

// ============================================================================
// Ed25519 API - DISABLED (Use TypeScript @noble/curves implementation)
// ============================================================================
// Note: Ed25519 Zig implementation needs updating for Zig 0.15.1 API changes
// Use the TypeScript implementation via @noble/curves which is already integrated

// ============================================================================
// P256 (secp256r1) API - DISABLED (Use TypeScript @noble/curves implementation)
// ============================================================================
// Note: P256 Zig implementation needs updating for Zig 0.15.1 API changes
// Use the TypeScript implementation via @noble/curves which is already integrated

// ============================================================================
// HD Wallet (BIP-39 / BIP-32) API - libwally-core bindings
// ============================================================================

// External libwally-core declarations
// Stub libwally functions for WASM (libwally not available in WASM)
const is_wasm_target = builtin.target.cpu.arch == .wasm32 or builtin.target.cpu.arch == .wasm64;

const bip39_mnemonic_from_bytes = if (is_wasm_target)
    struct {
        fn stub(_: ?*const anyopaque, _: [*]const u8, _: usize, _: *[*:0]u8) c_int {
            return -1;
        }
    }.stub
else
    struct {
        extern fn bip39_mnemonic_from_bytes(w: ?*const anyopaque, bytes: [*]const u8, bytes_len: usize, output: *[*:0]u8) c_int;
    }.bip39_mnemonic_from_bytes;

const bip39_mnemonic_to_seed512 = if (is_wasm_target)
    struct {
        fn stub(_: [*:0]const u8, _: ?[*:0]const u8, _: [*]u8, _: usize) c_int {
            return -1;
        }
    }.stub
else
    struct {
        extern fn bip39_mnemonic_to_seed512(mnemonic: [*:0]const u8, passphrase: ?[*:0]const u8, bytes_out: [*]u8, len: usize) c_int;
    }.bip39_mnemonic_to_seed512;

const bip39_mnemonic_validate = if (is_wasm_target)
    struct {
        fn stub(_: ?*const anyopaque, _: [*:0]const u8) c_int {
            return -1;
        }
    }.stub
else
    struct {
        extern fn bip39_mnemonic_validate(w: ?*const anyopaque, mnemonic: [*:0]const u8) c_int;
    }.bip39_mnemonic_validate;

const bip32_key_from_seed_alloc = if (is_wasm_target)
    struct {
        fn stub(_: [*]const u8, _: usize, _: u32, _: u32, _: *?*anyopaque) c_int {
            return -1;
        }
    }.stub
else
    struct {
        extern fn bip32_key_from_seed_alloc(bytes: [*]const u8, bytes_len: usize, version: u32, flags: u32, output: *?*anyopaque) c_int;
    }.bip32_key_from_seed_alloc;

const bip32_key_from_parent_path_alloc = if (is_wasm_target)
    struct {
        fn stub(_: *const anyopaque, _: [*]const u32, _: usize, _: u32, _: *?*anyopaque) c_int {
            return -1;
        }
    }.stub
else
    struct {
        extern fn bip32_key_from_parent_path_alloc(hdkey: *const anyopaque, child_path: [*]const u32, child_path_len: usize, flags: u32, output: *?*anyopaque) c_int;
    }.bip32_key_from_parent_path_alloc;

const bip32_key_free = if (is_wasm_target)
    struct {
        fn stub(_: *const anyopaque) c_int {
            return -1;
        }
    }.stub
else
    struct {
        extern fn bip32_key_free(hdkey: *const anyopaque) c_int;
    }.bip32_key_free;

const wally_free_string = if (is_wasm_target)
    struct {
        fn stub(_: [*:0]const u8) void {}
    }.stub
else
    struct {
        extern fn wally_free_string(str: [*:0]const u8) void;
    }.wally_free_string;

// BIP32 constants
const BIP32_VER_MAIN_PRIVATE: u32 = 0x0488ADE4;
const BIP32_FLAG_KEY_PRIVATE: u32 = 0x0;
const BIP39_SEED_LEN_512: usize = 64;

// HD Key structure matching libwally ext_key
const ExtKey = extern struct {
    chain_code: [32]u8,
    parent160: [20]u8,
    depth: u8,
    pad1: [10]u8,
    priv_key: [33]u8,
    child_num: u32,
    hash160: [20]u8,
    version: u32,
    pad2: [3]u8,
    pub_key: [33]u8,
};

/// Generate BIP-39 mnemonic from entropy
/// entropy_len: 16 (128 bits) or 32 (256 bits)
/// out_mnemonic: must be large enough (at least 256 bytes)
/// Returns length of mnemonic string or negative error code
export fn hdwallet_generate_mnemonic(
    entropy: [*]const u8,
    entropy_len: usize,
    out_mnemonic: [*]u8,
    out_len: usize,
) c_int {
    if (entropy_len != 16 and entropy_len != 32) {
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    var mnemonic_ptr: [*:0]u8 = undefined;
    const result = bip39_mnemonic_from_bytes(null, entropy, entropy_len, &mnemonic_ptr);

    if (result != 0) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    const mnemonic_cstr = std.mem.span(mnemonic_ptr);
    if (mnemonic_cstr.len >= out_len) {
        wally_free_string(mnemonic_ptr);
        return PRIMITIVES_ERROR_INVALID_LENGTH;
    }

    @memcpy(out_mnemonic[0..mnemonic_cstr.len], mnemonic_cstr);
    out_mnemonic[mnemonic_cstr.len] = 0; // null terminator

    wally_free_string(mnemonic_ptr);
    return @intCast(mnemonic_cstr.len);
}

/// Convert BIP-39 mnemonic to seed (512 bits)
/// passphrase: optional, pass NULL if not needed
export fn hdwallet_mnemonic_to_seed(
    mnemonic: [*:0]const u8,
    passphrase: ?[*:0]const u8,
    out_seed: *[64]u8,
) c_int {
    const result = bip39_mnemonic_to_seed512(mnemonic, passphrase, out_seed, BIP39_SEED_LEN_512);

    if (result != 0) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    return PRIMITIVES_SUCCESS;
}

/// Validate BIP-39 mnemonic checksum
/// Returns 1 if valid, 0 if invalid
export fn hdwallet_validate_mnemonic(
    mnemonic: [*:0]const u8,
) c_int {
    const result = bip39_mnemonic_validate(null, mnemonic);
    return if (result == 0) 1 else 0;
}

/// Create HD root key from seed
/// Returns opaque handle to HD key or 0 on error
export fn hdwallet_from_seed(
    seed: [*]const u8,
    seed_len: usize,
) usize {
    if (seed_len != BIP39_SEED_LEN_512) {
        return 0;
    }

    var hdkey: ?*anyopaque = null;
    const result = bip32_key_from_seed_alloc(
        seed,
        seed_len,
        BIP32_VER_MAIN_PRIVATE,
        0,
        &hdkey,
    );

    if (result != 0 or hdkey == null) {
        return 0;
    }

    return @intFromPtr(hdkey);
}

/// Derive child key from path
/// path: array of u32 child indices (use 0x80000000 + index for hardened)
/// Returns opaque handle to derived HD key or 0 on error
export fn hdwallet_derive(
    hdkey_handle: usize,
    path: [*]const u32,
    path_len: usize,
) usize {
    if (hdkey_handle == 0) {
        return 0;
    }

    const hdkey = @as(*const anyopaque, @ptrFromInt(hdkey_handle));
    var child_key: ?*anyopaque = null;

    const result = bip32_key_from_parent_path_alloc(
        hdkey,
        path,
        path_len,
        BIP32_FLAG_KEY_PRIVATE,
        &child_key,
    );

    if (result != 0 or child_key == null) {
        return 0;
    }

    return @intFromPtr(child_key);
}

/// Get private key from HD key
export fn hdwallet_get_private_key(
    hdkey_handle: usize,
    out_private_key: *[32]u8,
) c_int {
    if (hdkey_handle == 0) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    const hdkey = @as(*const ExtKey, @ptrFromInt(hdkey_handle));

    // Private key is stored with prefix byte 0, skip it
    @memcpy(out_private_key, hdkey.priv_key[1..33]);

    return PRIMITIVES_SUCCESS;
}

/// Get public key from HD key
export fn hdwallet_get_public_key(
    hdkey_handle: usize,
    out_public_key: *[33]u8,
) c_int {
    if (hdkey_handle == 0) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    const hdkey = @as(*const ExtKey, @ptrFromInt(hdkey_handle));
    @memcpy(out_public_key, &hdkey.pub_key);

    return PRIMITIVES_SUCCESS;
}

/// Get Ethereum address from HD key
export fn hdwallet_get_address(
    hdkey_handle: usize,
    out_address: *PrimitivesAddress,
) c_int {
    if (hdkey_handle == 0) {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    }

    const hdkey = @as(*const ExtKey, @ptrFromInt(hdkey_handle));

    // Public key is compressed (33 bytes), decompress to get x,y (skip prefix byte)
    const x = std.mem.readInt(u256, hdkey.pub_key[1..33], .big);

    // Reconstruct full public key y coordinate from x
    // For now, use secp256k1 point decompression
    const prefix = hdkey.pub_key[0];
    const is_odd = prefix == 0x03;

    // Calculate y^2 = x^3 + 7 (secp256k1 curve equation)
    const p = crypto.secp256k1.SECP256K1_P;
    const x3 = crypto.secp256k1.unauditedMulmod(
        crypto.secp256k1.unauditedMulmod(x, x, p),
        x,
        p,
    );
    const y_squared = crypto.secp256k1.unauditedAddmod(x3, 7, p);

    // Compute square root
    const y = crypto.secp256k1.unauditedSqrt(y_squared, p) orelse {
        return PRIMITIVES_ERROR_INVALID_INPUT;
    };

    // Select correct y based on parity
    const y_final = if ((y & 1) == @intFromBool(is_odd)) y else p - y;

    // Hash public key (x || y) with keccak256
    var pub_key_bytes: [64]u8 = undefined;
    std.mem.writeInt(u256, pub_key_bytes[0..32], x, .big);
    std.mem.writeInt(u256, pub_key_bytes[32..64], y_final, .big);

    const hash = crypto.HashUtils.keccak256(&pub_key_bytes);

    // Address is last 20 bytes of hash
    @memcpy(&out_address.bytes, hash[12..32]);

    return PRIMITIVES_SUCCESS;
}

/// Free HD key
export fn hdwallet_free(
    hdkey_handle: usize,
) c_int {
    if (hdkey_handle == 0) {
        return PRIMITIVES_SUCCESS;
    }

    const hdkey = @as(*const anyopaque, @ptrFromInt(hdkey_handle));
    _ = bip32_key_free(hdkey);

    return PRIMITIVES_SUCCESS;
}

// ============================================================================
// WASM Memory Management
// ============================================================================

// Note: For WASM, we use a simplified memory model where JavaScript manages
// the linear memory directly. The functions use stack-based allocators internally,
// so no explicit malloc/free exports are needed. JavaScript will allocate buffers
// in the linear memory and pass pointers to these functions.

// ============================================================================
// Bytecode Advanced Analysis API
// ============================================================================

/// Get next PC after current instruction
/// Returns next PC position or -1 if at end of bytecode
export fn primitives_bytecode_get_next_pc(
    code: [*]const u8,
    code_len: usize,
    current_pc: u32,
) i64 {
    const bytecode = code[0..code_len];

    if (current_pc >= bytecode.len) {
        return -1; // At end or beyond
    }

    const opcode = bytecode[current_pc];

    // PUSH1-PUSH32: skip immediate data
    if (opcode >= 0x60 and opcode <= 0x7f) {
        const push_size = opcode - 0x5f;
        const next_pc: u32 = current_pc + 1 + push_size;
        if (next_pc <= bytecode.len) {
            return next_pc;
        }
        return -1;
    }

    // Single-byte instruction
    const next_pc: u32 = current_pc + 1;
    if (next_pc <= bytecode.len) {
        return next_pc;
    }
    return -1;
}

/// Instruction data structure (for serialization)
const InstructionData = packed struct {
    pc: u32,
    opcode: u8,
    // For PUSH instructions: the immediate value length
    push_size: u8,
    _padding: u16 = 0,
};

/// Scan bytecode and collect all instructions in a range
/// Returns number of instructions found or negative error code
export fn primitives_bytecode_scan(
    code: [*]const u8,
    code_len: usize,
    start_pc: u32,
    end_pc: u32,
    out_instructions: [*]u8,
    out_len: *usize,
) c_int {
    const bytecode = code[0..code_len];

    if (start_pc > end_pc or start_pc >= bytecode.len) {
        out_len.* = 0;
        return 0;
    }

    var pc: u32 = start_pc;
    var count: usize = 0;
    const max_instructions = out_len.* / @sizeOf(InstructionData);

    while (pc < end_pc and pc < bytecode.len and count < max_instructions) {
        const opcode = bytecode[pc];
        const instruction = InstructionData{
            .pc = pc,
            .opcode = opcode,
            .push_size = if (opcode >= 0x60 and opcode <= 0x7f) opcode - 0x5f else 0,
        };

        // Write instruction to output buffer
        const offset = count * @sizeOf(InstructionData);
        const dest = out_instructions[offset .. offset + @sizeOf(InstructionData)];
        @memcpy(dest, std.mem.asBytes(&instruction));

        count += 1;

        // Move to next instruction
        if (opcode >= 0x60 and opcode <= 0x7f) {
            const push_size = opcode - 0x5f;
            pc += 1 + push_size;
        } else {
            pc += 1;
        }
    }

    out_len.* = count * @sizeOf(InstructionData);
    return @intCast(count);
}

/// Fusion pattern detection (simple: detect PUSH followed by operations)
const FusionPattern = packed struct {
    pc: u32,
    pattern_type: u8, // 1 = PUSH+<op>, 2 = DUP+<op>, etc.
    first_opcode: u8,
    second_opcode: u8,
};

/// Detect instruction fusion patterns (optimizable instruction sequences)
/// Returns number of fusion patterns found
export fn primitives_bytecode_detect_fusions(
    code: [*]const u8,
    code_len: usize,
    out_fusions: [*]u8,
    out_len: *usize,
) c_int {
    const bytecode = code[0..code_len];

    var pc: u32 = 0;
    var count: usize = 0;
    const max_fusions = out_len.* / @sizeOf(FusionPattern);

    while (pc + 1 < bytecode.len and count < max_fusions) {
        const opcode = bytecode[pc];

        // Skip PUSH immediates
        if (opcode >= 0x60 and opcode <= 0x7f) {
            const push_size = opcode - 0x5f;
            const next_pc = pc + 1 + push_size;

            if (next_pc < bytecode.len) {
                const next_opcode = bytecode[next_pc];

                // Detect PUSH+<binary op> fusion patterns
                // Common patterns: PUSH+ADD, PUSH+SUB, PUSH+MUL, etc.
                if ((next_opcode >= 0x01 and next_opcode <= 0x0c) or // arithmetic
                    (next_opcode >= 0x10 and next_opcode <= 0x1a))
                {
                    // comparison/bitwise
                    const fusion = FusionPattern{
                        .pc = pc,
                        .pattern_type = 1, // PUSH+OP
                        .first_opcode = opcode,
                        .second_opcode = next_opcode,
                    };

                    const offset = count * @sizeOf(FusionPattern);
                    const dest = out_fusions[offset .. offset + @sizeOf(FusionPattern)];
                    @memcpy(dest, std.mem.asBytes(&fusion));
                    count += 1;
                }
            }

            pc = next_pc;
        } else if (opcode >= 0x80 and opcode <= 0x8f) {
            // DUP1-DUP16: check for DUP+<op> fusions
            if (pc + 1 < bytecode.len) {
                const next_opcode = bytecode[pc + 1];

                if ((next_opcode >= 0x01 and next_opcode <= 0x0c) or (next_opcode >= 0x10 and next_opcode <= 0x1a)) {
                    const fusion = FusionPattern{
                        .pc = pc,
                        .pattern_type = 2, // DUP+OP
                        .first_opcode = opcode,
                        .second_opcode = next_opcode,
                    };

                    const offset = count * @sizeOf(FusionPattern);
                    const dest = out_fusions[offset .. offset + @sizeOf(FusionPattern)];
                    @memcpy(dest, std.mem.asBytes(&fusion));
                    count += 1;
                }
            }
            pc += 1;
        } else {
            pc += 1;
        }
    }

    out_len.* = count * @sizeOf(FusionPattern);
    return @intCast(count);
}

// WASM reactor pattern - main() is required for executable builds but not called
// JavaScript will invoke exported functions directly
// Only define main() for WASM targets (not for native C library builds)
fn wasmMain(argc: i32, argv: [*][*:0]u8) callconv(.c) i32 {
    _ = argc;
    _ = argv;
    // Entry point required for WASM executable, but unused in reactor pattern
    return 0;
}

comptime {
    if (builtin.target.cpu.arch == .wasm32 or builtin.target.cpu.arch == .wasm64) {
        // Export a public main() function for WASM executables
        // This is required for WASM executable format but never actually called
        @export(&wasmMain, .{ .name = "main", .linkage = .strong });
    }
}
