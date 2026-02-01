//! Metadata - Solidity Compiler Metadata
//!
//! Represents Solidity compiler metadata encoded in CBOR format at the end
//! of contract bytecode. Contains compiler version and source verification hashes.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const Metadata = primitives.Metadata;
//!
//! // Create metadata
//! const meta = Metadata.from(.{
//!     .raw = raw_cbor_bytes,
//!     .solc = "0.8.19",
//! });
//! ```

const std = @import("std");

/// Metadata type - Solidity compiler metadata
pub const Metadata = struct {
    /// Raw CBOR-encoded bytes
    raw: []const u8,

    /// Solidity compiler version (e.g., "0.8.19")
    solc: ?[]const u8 = null,

    /// IPFS content hash
    ipfs: ?[]const u8 = null,

    /// Swarm hash (legacy)
    bzzr0: ?[]const u8 = null,

    /// Swarm hash v1
    bzzr1: ?[]const u8 = null,

    /// Experimental features enabled
    experimental: ?bool = null,
};

/// CBOR major types
const CborMajorType = enum(u3) {
    unsigned_int = 0,
    negative_int = 1,
    byte_string = 2,
    text_string = 3,
    array = 4,
    map = 5,
    tag = 6,
    simple = 7,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create Metadata from struct
pub fn from(data: Metadata) Metadata {
    return data;
}

/// Create Metadata from raw CBOR bytes
pub fn fromRaw(raw: []const u8) Metadata {
    return .{
        .raw = raw,
    };
}

/// Create Metadata with all fields
pub fn fromFields(
    raw: []const u8,
    solc: ?[]const u8,
    ipfs: ?[]const u8,
    bzzr0: ?[]const u8,
    bzzr1: ?[]const u8,
    experimental: ?bool,
) Metadata {
    return .{
        .raw = raw,
        .solc = solc,
        .ipfs = ipfs,
        .bzzr0 = bzzr0,
        .bzzr1 = bzzr1,
        .experimental = experimental,
    };
}

// ============================================================================
// Accessors
// ============================================================================

/// Get raw CBOR bytes
pub fn getRaw(meta: Metadata) []const u8 {
    return meta.raw;
}

/// Get Solidity compiler version
pub fn getSolc(meta: Metadata) ?[]const u8 {
    return meta.solc;
}

/// Get IPFS hash
pub fn getIpfs(meta: Metadata) ?[]const u8 {
    return meta.ipfs;
}

/// Get Swarm hash (legacy)
pub fn getBzzr0(meta: Metadata) ?[]const u8 {
    return meta.bzzr0;
}

/// Get Swarm hash v1
pub fn getBzzr1(meta: Metadata) ?[]const u8 {
    return meta.bzzr1;
}

/// Check if experimental features are enabled
pub fn isExperimental(meta: Metadata) bool {
    return meta.experimental orelse false;
}

// ============================================================================
// Bytecode Extraction
// ============================================================================

/// Extract metadata from bytecode
/// Metadata is encoded at the end of bytecode with a 2-byte length suffix
/// Returns null if metadata cannot be extracted
pub fn fromBytecode(bytecode: []const u8) ?Metadata {
    if (bytecode.len < 2) return null;

    // Last 2 bytes are the metadata length (big-endian)
    const metadata_len = @as(u16, bytecode[bytecode.len - 2]) << 8 | bytecode[bytecode.len - 1];

    // Check if bytecode contains enough data for metadata
    if (bytecode.len < metadata_len + 2) return null;

    // Extract raw metadata (excluding length suffix)
    const start = bytecode.len - metadata_len - 2;
    const raw = bytecode[start .. bytecode.len - 2];

    return fromRaw(raw);
}

/// Get metadata length from bytecode
pub fn getMetadataLength(bytecode: []const u8) ?u16 {
    if (bytecode.len < 2) return null;
    return @as(u16, bytecode[bytecode.len - 2]) << 8 | bytecode[bytecode.len - 1];
}

/// Get bytecode without metadata
pub fn stripMetadata(bytecode: []const u8) ?[]const u8 {
    const metadata_len = getMetadataLength(bytecode) orelse return null;
    if (bytecode.len < metadata_len + 2) return null;
    return bytecode[0 .. bytecode.len - metadata_len - 2];
}

// ============================================================================
// Predicates
// ============================================================================

/// Check if metadata has Solidity version
pub fn hasSolc(meta: Metadata) bool {
    return meta.solc != null;
}

/// Check if metadata has IPFS hash
pub fn hasIpfs(meta: Metadata) bool {
    return meta.ipfs != null;
}

/// Check if metadata has any Swarm hash
pub fn hasSwarm(meta: Metadata) bool {
    return meta.bzzr0 != null or meta.bzzr1 != null;
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two Metadata are equal (by raw bytes)
pub fn equals(a: Metadata, b: Metadata) bool {
    return std.mem.eql(u8, a.raw, b.raw);
}

// ============================================================================
// Tests
// ============================================================================

test "Metadata.from creates metadata" {
    const raw = [_]u8{ 0xa2, 0x65, 0x73, 0x6f, 0x6c, 0x63 };
    const meta = from(.{
        .raw = &raw,
        .solc = "0.8.19",
    });

    try std.testing.expectEqualStrings("0.8.19", meta.solc.?);
}

test "Metadata.fromRaw creates metadata from raw bytes" {
    const raw = [_]u8{ 0xa1, 0x64, 0x69, 0x70, 0x66, 0x73 };
    const meta = fromRaw(&raw);

    try std.testing.expectEqualSlices(u8, &raw, meta.raw);
    try std.testing.expect(meta.solc == null);
}

test "Metadata accessors work correctly" {
    const raw = [_]u8{ 0xa2, 0x65, 0x73, 0x6f, 0x6c, 0x63 };
    const meta = from(.{
        .raw = &raw,
        .solc = "0.8.19",
        .ipfs = "QmTest",
        .experimental = true,
    });

    try std.testing.expectEqualSlices(u8, &raw, getRaw(meta));
    try std.testing.expectEqualStrings("0.8.19", getSolc(meta).?);
    try std.testing.expectEqualStrings("QmTest", getIpfs(meta).?);
    try std.testing.expect(isExperimental(meta));
}

test "Metadata.hasSolc" {
    const raw = [_]u8{0xa0};
    const with_solc = from(.{
        .raw = &raw,
        .solc = "0.8.19",
    });

    const without_solc = from(.{
        .raw = &raw,
    });

    try std.testing.expect(hasSolc(with_solc));
    try std.testing.expect(!hasSolc(without_solc));
}

test "Metadata.hasIpfs" {
    const raw = [_]u8{0xa0};
    const with_ipfs = from(.{
        .raw = &raw,
        .ipfs = "QmTest",
    });

    const without_ipfs = from(.{
        .raw = &raw,
    });

    try std.testing.expect(hasIpfs(with_ipfs));
    try std.testing.expect(!hasIpfs(without_ipfs));
}

test "Metadata.hasSwarm" {
    const raw = [_]u8{0xa0};
    const with_bzzr0 = from(.{
        .raw = &raw,
        .bzzr0 = "0x123",
    });

    const with_bzzr1 = from(.{
        .raw = &raw,
        .bzzr1 = "0x456",
    });

    const without_swarm = from(.{
        .raw = &raw,
    });

    try std.testing.expect(hasSwarm(with_bzzr0));
    try std.testing.expect(hasSwarm(with_bzzr1));
    try std.testing.expect(!hasSwarm(without_swarm));
}

test "Metadata.equals compares metadata" {
    const raw1 = [_]u8{ 0xa1, 0x65, 0x73, 0x6f, 0x6c, 0x63 };
    const raw2 = [_]u8{ 0xa1, 0x65, 0x73, 0x6f, 0x6c, 0x63 };
    const raw3 = [_]u8{ 0xa2, 0x65, 0x73, 0x6f, 0x6c, 0x64 };

    const meta1 = fromRaw(&raw1);
    const meta2 = fromRaw(&raw2);
    const meta3 = fromRaw(&raw3);

    try std.testing.expect(equals(meta1, meta2));
    try std.testing.expect(!equals(meta1, meta3));
}

test "Metadata.getMetadataLength" {
    // Bytecode with metadata length 0x0033 (51 bytes)
    var bytecode: [100]u8 = undefined;
    bytecode[98] = 0x00;
    bytecode[99] = 0x33;

    const len = getMetadataLength(&bytecode);
    try std.testing.expect(len != null);
    try std.testing.expectEqual(@as(u16, 0x33), len.?);
}

test "Metadata.getMetadataLength with short bytecode" {
    const bytecode = [_]u8{0x60};
    const len = getMetadataLength(&bytecode);
    try std.testing.expect(len == null);
}

test "Metadata.fromBytecode extracts metadata" {
    // Simulate bytecode: [code...][metadata (5 bytes)][length (0x0005)]
    var bytecode: [10]u8 = undefined;
    bytecode[0] = 0x60; // code
    bytecode[1] = 0x80; // code
    bytecode[2] = 0x60; // code
    bytecode[3] = 0xa2; // metadata start
    bytecode[4] = 0x65;
    bytecode[5] = 0x73;
    bytecode[6] = 0x6f;
    bytecode[7] = 0x6c;
    bytecode[8] = 0x00; // length high byte
    bytecode[9] = 0x05; // length low byte (5)

    const meta = fromBytecode(&bytecode);
    try std.testing.expect(meta != null);
    try std.testing.expectEqual(@as(usize, 5), meta.?.raw.len);
}

test "Metadata.stripMetadata removes metadata" {
    // Simulate bytecode: [code (3 bytes)][metadata (5 bytes)][length (0x0005)]
    var bytecode: [10]u8 = undefined;
    bytecode[0] = 0x60; // code
    bytecode[1] = 0x80; // code
    bytecode[2] = 0x60; // code
    bytecode[3] = 0xa2; // metadata
    bytecode[4] = 0x65;
    bytecode[5] = 0x73;
    bytecode[6] = 0x6f;
    bytecode[7] = 0x6c;
    bytecode[8] = 0x00; // length high byte
    bytecode[9] = 0x05; // length low byte

    const stripped = stripMetadata(&bytecode);
    try std.testing.expect(stripped != null);
    try std.testing.expectEqual(@as(usize, 3), stripped.?.len);
    try std.testing.expectEqual(@as(u8, 0x60), stripped.?[0]);
    try std.testing.expectEqual(@as(u8, 0x80), stripped.?[1]);
    try std.testing.expectEqual(@as(u8, 0x60), stripped.?[2]);
}

test "Metadata.isExperimental default false" {
    const raw = [_]u8{0xa0};
    const meta = from(.{
        .raw = &raw,
    });

    try std.testing.expect(!isExperimental(meta));
}
