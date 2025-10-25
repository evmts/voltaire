const std = @import("std");
const primitives = @import("primitives");
const crypto = @import("crypto");

// Error codes for C API
pub const PRIMITIVES_SUCCESS: c_int = 0;
pub const PRIMITIVES_ERROR_INVALID_HEX: c_int = -1;
pub const PRIMITIVES_ERROR_INVALID_LENGTH: c_int = -2;
pub const PRIMITIVES_ERROR_INVALID_CHECKSUM: c_int = -3;
pub const PRIMITIVES_ERROR_OUT_OF_MEMORY: c_int = -4;
pub const PRIMITIVES_ERROR_INVALID_INPUT: c_int = -5;
pub const PRIMITIVES_ERROR_INVALID_SIGNATURE: c_int = -6;

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
    const hex = addr.toChecksumHex();
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

    var stack_buf: [256]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
    const allocator = fba.allocator();

    const hex = primitives.Hex.u256ToHex(allocator, value) catch {
        return PRIMITIVES_ERROR_OUT_OF_MEMORY;
    };
    defer allocator.free(hex);

    @memcpy(buf[0..hex.len], hex);
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

    var stack_buf: [1024]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&stack_buf);
    const allocator = fba.allocator();

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
// Version info
// ============================================================================

export fn primitives_version_string() [*:0]const u8 {
    return "primitives-0.1.0";
}
