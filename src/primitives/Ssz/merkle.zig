const std = @import("std");
const sha256 = std.crypto.hash.sha2.Sha256;

/// SSZ Merkleization
/// See: https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md
///
/// Hash tree root computation for Merkle proofs
const CHUNK_SIZE = 32;
const ZERO_HASH = [_]u8{0} ** 32;

/// Chunks data into 32-byte leaves, padding the last chunk with zeros if needed
fn chunkify(allocator: std.mem.Allocator, data: []const u8) ![][CHUNK_SIZE]u8 {
    const chunk_count = (data.len + CHUNK_SIZE - 1) / CHUNK_SIZE;
    const chunks = try allocator.alloc([CHUNK_SIZE]u8, chunk_count);
    errdefer allocator.free(chunks);

    var i: usize = 0;
    while (i < chunk_count) : (i += 1) {
        const start = i * CHUNK_SIZE;
        const end = @min(start + CHUNK_SIZE, data.len);
        const len = end - start;

        @memcpy(chunks[i][0..len], data[start..end]);
        if (len < CHUNK_SIZE) {
            @memset(chunks[i][len..], 0);
        }
    }

    return chunks;
}

/// Hashes two 32-byte values together
fn hashPair(left: [32]u8, right: [32]u8) [32]u8 {
    var hasher = sha256.init(.{});
    hasher.update(&left);
    hasher.update(&right);
    var result: [32]u8 = undefined;
    hasher.final(&result);
    return result;
}

/// Computes the next power of 2 >= n
fn nextPowerOfTwo(n: usize) usize {
    if (n == 0) return 1;
    var result: usize = 1;
    while (result < n) {
        result *= 2;
    }
    return result;
}

/// Merkleizes a list of chunks into a single root hash
fn merkleizeChunks(allocator: std.mem.Allocator, chunks: [][CHUNK_SIZE]u8) ![32]u8 {
    if (chunks.len == 0) return ZERO_HASH;
    if (chunks.len == 1) return chunks[0];

    // Pad to next power of 2
    const target_len = nextPowerOfTwo(chunks.len);
    var layer = try allocator.alloc([CHUNK_SIZE]u8, target_len);
    defer allocator.free(layer);

    // Copy chunks and pad with zero hashes
    @memcpy(layer[0..chunks.len], chunks);
    for (chunks.len..target_len) |i| {
        layer[i] = ZERO_HASH;
    }

    // Build Merkle tree bottom-up
    while (layer.len > 1) {
        const next_len = layer.len / 2;
        const next_layer = try allocator.alloc([CHUNK_SIZE]u8, next_len);
        errdefer allocator.free(next_layer);

        var i: usize = 0;
        while (i < next_len) : (i += 1) {
            next_layer[i] = hashPair(layer[i * 2], layer[i * 2 + 1]);
        }

        allocator.free(layer);
        layer = next_layer;
    }

    const result = layer[0];
    return result;
}

/// Computes the hash tree root of raw data
/// Caller does not own returned memory (it's a value type)
pub fn hashTreeRoot(allocator: std.mem.Allocator, data: []const u8) ![32]u8 {
    const chunks = try chunkify(allocator, data);
    defer allocator.free(chunks);

    return try merkleizeChunks(allocator, chunks);
}

/// Computes the hash tree root of a basic type (u8, u16, u32, u64, u256, bool)
pub fn hashTreeRootBasic(comptime T: type, value: T) [32]u8 {
    var result = ZERO_HASH;

    switch (@typeInfo(T)) {
        .Int => |int| {
            const bytes = std.mem.asBytes(&value);
            const len = int.bits / 8;
            @memcpy(result[0..len], bytes);
        },
        .Bool => {
            result[0] = if (value) 1 else 0;
        },
        else => @compileError("Unsupported type for hashTreeRootBasic"),
    }

    return result;
}

test "chunkify single chunk" {
    const allocator = std.testing.allocator;
    const data = [_]u8{1} ** 16; // Half chunk
    const chunks = try chunkify(allocator, &data);
    defer allocator.free(chunks);

    try std.testing.expectEqual(@as(usize, 1), chunks.len);
    try std.testing.expectEqual(@as(u8, 1), chunks[0][0]);
    try std.testing.expectEqual(@as(u8, 1), chunks[0][15]);
    try std.testing.expectEqual(@as(u8, 0), chunks[0][16]); // padding
    try std.testing.expectEqual(@as(u8, 0), chunks[0][31]); // padding
}

test "chunkify multiple chunks" {
    const allocator = std.testing.allocator;
    const data = [_]u8{0xAA} ** 64; // Two full chunks
    const chunks = try chunkify(allocator, &data);
    defer allocator.free(chunks);

    try std.testing.expectEqual(@as(usize, 2), chunks.len);
    try std.testing.expectEqual(@as(u8, 0xAA), chunks[0][0]);
    try std.testing.expectEqual(@as(u8, 0xAA), chunks[1][31]);
}

test "hashPair" {
    const left = ZERO_HASH;
    const right = ZERO_HASH;
    const result = hashPair(left, right);

    // Hash of two zero hashes should be deterministic
    try std.testing.expect(result[0] != 0 or result[1] != 0); // Not all zeros
}

test "nextPowerOfTwo" {
    try std.testing.expectEqual(@as(usize, 1), nextPowerOfTwo(0));
    try std.testing.expectEqual(@as(usize, 1), nextPowerOfTwo(1));
    try std.testing.expectEqual(@as(usize, 2), nextPowerOfTwo(2));
    try std.testing.expectEqual(@as(usize, 4), nextPowerOfTwo(3));
    try std.testing.expectEqual(@as(usize, 4), nextPowerOfTwo(4));
    try std.testing.expectEqual(@as(usize, 8), nextPowerOfTwo(5));
    try std.testing.expectEqual(@as(usize, 16), nextPowerOfTwo(15));
}

test "hashTreeRoot empty" {
    const allocator = std.testing.allocator;
    const data = [_]u8{};
    const root = try hashTreeRoot(allocator, &data);
    try std.testing.expectEqual(ZERO_HASH, root);
}

test "hashTreeRoot single byte" {
    const allocator = std.testing.allocator;
    const data = [_]u8{42};
    const root = try hashTreeRoot(allocator, &data);

    // Should be a 32-byte hash (not all zeros)
    try std.testing.expect(root[0] != 0 or root[1] != 0);
}

test "hashTreeRootBasic u8" {
    const root = hashTreeRootBasic(u8, 42);
    try std.testing.expectEqual(@as(u8, 42), root[0]);
    try std.testing.expectEqual(@as(u8, 0), root[1]);
}

test "hashTreeRootBasic bool" {
    const root_true = hashTreeRootBasic(bool, true);
    const root_false = hashTreeRootBasic(bool, false);
    try std.testing.expectEqual(@as(u8, 1), root_true[0]);
    try std.testing.expectEqual(@as(u8, 0), root_false[0]);
}

test "hashTreeRootBasic u64" {
    const root = hashTreeRootBasic(u64, 0x0102030405060708);
    try std.testing.expectEqual(@as(u8, 0x08), root[0]); // little-endian
    try std.testing.expectEqual(@as(u8, 0x07), root[1]);
    try std.testing.expectEqual(@as(u8, 0x01), root[7]);
    try std.testing.expectEqual(@as(u8, 0), root[8]); // padding
}
