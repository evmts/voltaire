const std = @import("std");
const testing = std.testing;
const Hash = @import("hash_utils.zig");
const Address = @import("address/address.zig");
const Hex = @import("hex.zig");

// ENS namehash algorithm implementation
pub fn namehash(name: []const u8) Hash.Hash {
    var node = Hash.ZERO_HASH;
    
    if (name.len == 0) {
        return node;
    }
    
    // Split by dots and process in reverse order
    var iter = std.mem.tokenizeBackwards(u8, name, ".");
    while (iter.next()) |label| {
        const label_hash = Hash.keccak256(label);
        
        // node = keccak256(node || labelhash)
        var combined: [64]u8 = undefined;
        @memcpy(combined[0..32], &node);
        @memcpy(combined[32..64], &label_hash);
        node = Hash.keccak256(&combined);
    }
    
    return node;
}

// ENS labelhash (single label)
pub fn labelhash(label: []const u8) Hash.Hash {
    return Hash.keccak256(label);
}

// Test namehash algorithm
test "ENS namehash empty name" {
    const hash = namehash("");
    try testing.expectEqual(Hash.ZERO_HASH, hash);
}

test "ENS namehash single label" {
    const hash = namehash("eth");
    
    // eth = keccak256(0x00...00 || keccak256("eth"))
    const label_hash = Hash.keccak256("eth");
    var expected_input: [64]u8 = undefined;
    @memcpy(expected_input[0..32], &Hash.ZERO_HASH);
    @memcpy(expected_input[32..64], &label_hash);
    const expected = Hash.keccak256(&expected_input);
    
    try testing.expectEqual(expected, hash);
}

test "ENS namehash vitalik.eth" {
    const hash = namehash("vitalik.eth");
    
    // Known hash for vitalik.eth
    const expected = Hash.from_hex_comptime("0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835");
    try testing.expectEqual(expected, hash);
}

test "ENS namehash resolver.eth" {
    const hash = namehash("resolver.eth");
    
    // Known hash for resolver.eth
    const expected = Hash.from_hex_comptime("0xfdd5d5de6dd63db72bbc2d487944ba13bf775b50a80805fe6fcaba9b0fba88f5");
    try testing.expectEqual(expected, hash);
}

test "ENS namehash with subdomains" {
    const hash = namehash("ricmoo.firefly.eth");
    
    // Process: eth -> firefly.eth -> ricmoo.firefly.eth
    // This is a known test vector from ENS documentation
    const expected = Hash.from_hex_comptime("0x0bcad17ecf260d6506c6b97768bdc2acfb6694445d27ffd3f9c1cfbee4a9bd6d");
    try testing.expectEqual(expected, hash);
}

test "ENS labelhash" {
    const eth_label = labelhash("eth");
    const expected = Hash.keccak256("eth");
    try testing.expectEqual(expected, eth_label);
}

// Test normalize function (simplified version)
pub fn normalize(allocator: std.mem.Allocator, name: []const u8) ![]u8 {
    // Simplified normalization - just lowercase
    // Real implementation would use UTS-46 with IDNA2008
    var result = try allocator.alloc(u8, name.len);
    for (name, 0..) |c, i| {
        result[i] = std.ascii.toLower(c);
    }
    return result;
}

test "ENS normalize" {
    const allocator = testing.allocator;
    
    // Basic ASCII normalization
    const normalized1 = try normalize(allocator, "VITALIK.ETH");
    defer allocator.free(normalized1);
    try testing.expectEqualStrings("vitalik.eth", normalized1);
    
    const normalized2 = try normalize(allocator, "VitaLiK.eTh");
    defer allocator.free(normalized2);
    try testing.expectEqualStrings("vitalik.eth", normalized2);
    
    // Already normalized
    const normalized3 = try normalize(allocator, "vitalik.eth");
    defer allocator.free(normalized3);
    try testing.expectEqualStrings("vitalik.eth", normalized3);
}

// Test DNS encoding for ENS
pub fn dns_encode(allocator: std.mem.Allocator, name: []const u8) ![]u8 {
    var result = std.ArrayList(u8).init(allocator);
    defer result.deinit();
    
    // Empty name encodes to single zero byte
    if (name.len == 0) {
        try result.append(0);
        return result.toOwnedSlice();
    }
    
    // Split by dots and encode each label
    var iter = std.mem.tokenizeScalar(u8, name, '.');
    while (iter.next()) |label| {
        if (label.len > 63) return error.LabelTooLong;
        
        try result.append(@intCast(label.len));
        try result.appendSlice(label);
    }
    
    // Null terminator
    try result.append(0);
    
    return result.toOwnedSlice();
}

test "ENS DNS encoding" {
    const allocator = testing.allocator;
    
    // Empty name
    const encoded1 = try dns_encode(allocator, "");
    defer allocator.free(encoded1);
    try testing.expectEqualSlices(u8, &[_]u8{0}, encoded1);
    
    // Single label
    const encoded2 = try dns_encode(allocator, "eth");
    defer allocator.free(encoded2);
    try testing.expectEqualSlices(u8, &[_]u8{ 3, 'e', 't', 'h', 0 }, encoded2);
    
    // Multiple labels
    const encoded3 = try dns_encode(allocator, "vitalik.eth");
    defer allocator.free(encoded3);
    try testing.expectEqualSlices(u8, &[_]u8{ 7, 'v', 'i', 't', 'a', 'l', 'i', 'k', 3, 'e', 't', 'h', 0 }, encoded3);
    
    // Three labels
    const encoded4 = try dns_encode(allocator, "ricmoo.firefly.eth");
    defer allocator.free(encoded4);
    const expected4 = [_]u8{ 6, 'r', 'i', 'c', 'm', 'o', 'o', 7, 'f', 'i', 'r', 'e', 'f', 'l', 'y', 3, 'e', 't', 'h', 0 };
    try testing.expectEqualSlices(u8, &expected4, encoded4);
}

// Test reverse resolution (address to name)
pub fn reverse_node(address: primitives.Address) Hash.Hash {
    const allocator = std.heap.page_allocator;
    
    // Convert address to hex string (without 0x)
    const hex = Hex.to_hex(allocator, &address) catch unreachable;
    defer allocator.free(hex);
    
    // Remove 0x prefix and convert to lowercase
    var addr_hex: [40]u8 = undefined;
    for (hex[2..], 0..) |c, i| {
        addr_hex[i] = std.ascii.toLower(c);
    }
    
    // Append .addr.reverse
    const reverse_name = std.fmt.allocPrint(allocator, "{s}.addr.reverse", .{addr_hex}) catch unreachable;
    defer allocator.free(reverse_name);
    
    return namehash(reverse_name);
}

test "ENS reverse resolution node" {
    const address = try primitives.Address.from_hex("0x1234567890123456789012345678901234567890");
    const node = reverse_node(address);
    
    // Should produce a deterministic hash
    const node2 = reverse_node(address);
    try testing.expectEqual(node, node2);
    
    // Should not be zero
    try testing.expect(!Hash.is_zero(node));
}

// Test subdomain validation
pub fn is_valid_label(label: []const u8) bool {
    // ENS label rules:
    // - Not empty
    // - Not longer than 63 characters
    // - No leading or trailing hyphens
    // - No consecutive hyphens
    
    if (label.len == 0 or label.len > 63) return false;
    if (label[0] == '-' or label[label.len - 1] == '-') return false;
    
    var prev_hyphen = false;
    for (label) |c| {
        if (c == '-') {
            if (prev_hyphen) return false;
            prev_hyphen = true;
        } else {
            prev_hyphen = false;
        }
        
        // Must be alphanumeric or hyphen
        if (!std.ascii.isAlphanumeric(c) and c != '-') return false;
    }
    
    return true;
}

test "ENS label validation" {
    // Valid labels
    try testing.expect(is_valid_label("eth"));
    try testing.expect(is_valid_label("vitalik"));
    try testing.expect(is_valid_label("foo-bar"));
    try testing.expect(is_valid_label("123"));
    try testing.expect(is_valid_label("a1b2c3"));
    
    // Invalid labels
    try testing.expect(!is_valid_label("")); // Empty
    try testing.expect(!is_valid_label("-foo")); // Leading hyphen
    try testing.expect(!is_valid_label("foo-")); // Trailing hyphen
    try testing.expect(!is_valid_label("foo--bar")); // Consecutive hyphens
    try testing.expect(!is_valid_label("foo.bar")); // Contains dot
    try testing.expect(!is_valid_label("foo bar")); // Contains space
    
    // Too long (64 characters)
    const long_label = "a" ** 64;
    try testing.expect(!is_valid_label(long_label));
}

// Test content hash decoding
pub const ContentHashType = enum {
    ipfs,
    ipns,
    swarm,
    onion,
    onion3,
    skynet,
    arweave,
};

pub fn decode_content_hash(data: []const u8) !struct { hash_type: ContentHashType, hash: []const u8 } {
    if (data.len < 2) return error.InvalidContentHash;
    
    // Check codec
    const codec = std.mem.readInt(u16, data[0..2], .big);
    
    return switch (codec) {
        0xe301 => .{ .hash_type = .ipfs, .hash = data[2..] },
        0xe401 => .{ .hash_type = .swarm, .hash = data[2..] },
        0xe501 => .{ .hash_type = .ipns, .hash = data[2..] },
        else => error.UnknownContentHashType,
    };
}

test "ENS content hash decoding" {
    // IPFS hash with codec 0xe301
    const ipfs_data = [_]u8{ 0xe3, 0x01 } ++ [_]u8{0x12} ** 32; // Simplified
    const ipfs_result = try decode_content_hash(&ipfs_data);
    try testing.expectEqual(ContentHashType.ipfs, ipfs_result.hash_type);
    try testing.expectEqual(@as(usize, 32), ipfs_result.hash.len);
    
    // Swarm hash with codec 0xe401
    const swarm_data = [_]u8{ 0xe4, 0x01 } ++ [_]u8{0x34} ** 32;
    const swarm_result = try decode_content_hash(&swarm_data);
    try testing.expectEqual(ContentHashType.swarm, swarm_result.hash_type);
}

// Test wildcard resolution support
pub fn has_wildcard_resolution(name: []const u8) bool {
    // Check if name could use wildcard resolution
    // Names with more than one label could potentially use wildcards
    var dot_count: usize = 0;
    for (name) |c| {
        if (c == '.') dot_count += 1;
    }
    return dot_count > 0;
}

test "ENS wildcard resolution check" {
    try testing.expect(!has_wildcard_resolution("eth"));
    try testing.expect(has_wildcard_resolution("vitalik.eth"));
    try testing.expect(has_wildcard_resolution("blog.vitalik.eth"));
    try testing.expect(has_wildcard_resolution("foo.bar.baz.eth"));
}