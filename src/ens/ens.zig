const std = @import("std");
const testing = std.testing;
const primitives = @import("primitives");
const Hash = primitives.Hash;
const Address = primitives.Address;
const Allocator = std.mem.Allocator;

// ENS error types
pub const EnsError = error{
    LabelTooLong,
    InvalidContentHash,
    UnknownContentHashType,
    InvalidLabel,
    OutOfMemory,
};

// Content hash types
pub const ContentHashType = enum {
    ipfs,
    ipns,
    swarm,
    onion,
    onion3,
    skynet,
    arweave,
};

// ENS namehash algorithm implementation
pub fn namehash(name: []const u8) Hash {
    var node = Hash.ZERO;
    
    if (name.len == 0) {
        return node;
    }
    
    // Split by dots and process in reverse order
    var iter = std.mem.tokenizeBackwards(u8, name, ".");
    while (iter.next()) |label| {
        const labelHash = primitives.Hash.keccak256(label);
        
        // node = keccak256(node || labelhash)
        var combined: [64]u8 = undefined;
        @memcpy(combined[0..32], &node.bytes);
        @memcpy(combined[32..64], &labelHash.bytes);
        node = primitives.Hash.keccak256(&combined);
    }
    
    return node;
}

// ENS labelhash (single label)
pub fn labelhash(label: []const u8) Hash {
    return primitives.Hash.keccak256(label);
}

// Normalize ENS name (simplified version)
pub fn normalize(allocator: Allocator, name: []const u8) ![]u8 {
    // Simplified normalization - just lowercase
    // Real implementation would use UTS-46 with IDNA2008
    var result = try allocator.alloc(u8, name.len);
    for (name, 0..) |c, i| {
        result[i] = std.ascii.toLower(c);
    }
    return result;
}

// DNS encoding for ENS
pub fn dnsEncode(allocator: Allocator, name: []const u8) ![]u8 {
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
        if (label.len > 63) return EnsError.LabelTooLong;
        
        try result.append(@intCast(label.len));
        try result.appendSlice(label);
    }
    
    // Null terminator
    try result.append(0);
    
    return result.toOwnedSlice();
}

// Reverse resolution (address to name)
pub fn reverseNode(addr: Address) Hash {
    const allocator = std.heap.page_allocator;
    
    // Convert address to hex string (without 0x)
    const hexStr = primitives.Hex.toHex(allocator, &addr.bytes) catch unreachable;
    defer allocator.free(hexStr);
    
    // Remove 0x prefix and convert to lowercase
    var addrHex: [40]u8 = undefined;
    for (hexStr[2..], 0..) |c, i| {
        addrHex[i] = std.ascii.toLower(c);
    }
    
    // Append .addr.reverse
    const reverseName = std.fmt.allocPrint(allocator, "{s}.addr.reverse", .{addrHex}) catch unreachable;
    defer allocator.free(reverseName);
    
    return namehash(reverseName);
}

// Validate ENS label
pub fn isValidLabel(label: []const u8) bool {
    // ENS label rules:
    // - Not empty
    // - Not longer than 63 characters
    // - No leading or trailing hyphens
    // - No consecutive hyphens
    
    if (label.len == 0 or label.len > 63) return false;
    if (label[0] == '-' or label[label.len - 1] == '-') return false;
    
    var prevHyphen = false;
    for (label) |c| {
        if (c == '-') {
            if (prevHyphen) return false;
            prevHyphen = true;
        } else {
            prevHyphen = false;
        }
        
        // Must be alphanumeric or hyphen
        if (!std.ascii.isAlphanumeric(c) and c != '-') return false;
    }
    
    return true;
}

// Decode content hash
pub fn decodeContentHash(data: []const u8) !struct { hashType: ContentHashType, hash: []const u8 } {
    if (data.len < 2) return EnsError.InvalidContentHash;
    
    // Check codec
    const codec = std.mem.readInt(u16, data[0..2], .big);
    
    return switch (codec) {
        0xe301 => .{ .hashType = .ipfs, .hash = data[2..] },
        0xe401 => .{ .hashType = .swarm, .hash = data[2..] },
        0xe501 => .{ .hashType = .ipns, .hash = data[2..] },
        else => EnsError.UnknownContentHashType,
    };
}

// Check if name could use wildcard resolution
pub fn hasWildcardResolution(name: []const u8) bool {
    // Names with more than one label could potentially use wildcards
    var dotCount: usize = 0;
    for (name) |c| {
        if (c == '.') dotCount += 1;
    }
    return dotCount > 0;
}

// Tests

test "ENS namehash empty name" {
    const h = namehash("");
    try testing.expectEqual(Hash.ZERO, h);
}

test "ENS namehash single label" {
    const h = namehash("eth");
    
    // eth = keccak256(0x00...00 || keccak256("eth"))
    const labelHash = primitives.Hash.keccak256("eth");
    var expectedInput: [64]u8 = undefined;
    @memcpy(expectedInput[0..32], &Hash.ZERO.bytes);
    @memcpy(expectedInput[32..64], &labelHash.bytes);
    const expected = primitives.Hash.keccak256(&expectedInput);
    
    try testing.expectEqual(expected, h);
}

test "ENS namehash vitalik.eth" {
    const h = namehash("vitalik.eth");
    
    // Known hash for vitalik.eth
    const expected = try Hash.fromHex("0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835");
    try testing.expectEqual(expected, h);
}

test "ENS namehash resolver.eth" {
    const h = namehash("resolver.eth");
    
    // Known hash for resolver.eth
    const expected = try Hash.fromHex("0xfdd5d5de6dd63db72bbc2d487944ba13bf775b50a80805fe6fcaba9b0fba88f5");
    try testing.expectEqual(expected, h);
}

test "ENS namehash with subdomains" {
    const h = namehash("ricmoo.firefly.eth");
    
    // Process: eth -> firefly.eth -> ricmoo.firefly.eth
    // This is a known test vector from ENS documentation
    const expected = try Hash.fromHex("0x0bcad17ecf260d6506c6b97768bdc2acfb6694445d27ffd3f9c1cfbee4a9bd6d");
    try testing.expectEqual(expected, h);
}

test "ENS labelhash" {
    const ethLabel = labelhash("eth");
    const expected = primitives.Hash.keccak256("eth");
    try testing.expectEqual(expected, ethLabel);
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

test "ENS DNS encoding" {
    const allocator = testing.allocator;
    
    // Empty name
    const encoded1 = try dnsEncode(allocator, "");
    defer allocator.free(encoded1);
    try testing.expectEqualSlices(u8, &[_]u8{0}, encoded1);
    
    // Single label
    const encoded2 = try dnsEncode(allocator, "eth");
    defer allocator.free(encoded2);
    try testing.expectEqualSlices(u8, &[_]u8{ 3, 'e', 't', 'h', 0 }, encoded2);
    
    // Multiple labels
    const encoded3 = try dnsEncode(allocator, "vitalik.eth");
    defer allocator.free(encoded3);
    try testing.expectEqualSlices(u8, &[_]u8{ 7, 'v', 'i', 't', 'a', 'l', 'i', 'k', 3, 'e', 't', 'h', 0 }, encoded3);
    
    // Three labels
    const encoded4 = try dnsEncode(allocator, "ricmoo.firefly.eth");
    defer allocator.free(encoded4);
    const expected4 = [_]u8{ 6, 'r', 'i', 'c', 'm', 'o', 'o', 7, 'f', 'i', 'r', 'e', 'f', 'l', 'y', 3, 'e', 't', 'h', 0 };
    try testing.expectEqualSlices(u8, &expected4, encoded4);
}

test "ENS reverse resolution node" {
    const addr = try Address.fromHex("0x1234567890123456789012345678901234567890");
    const node = reverseNode(addr);
    
    // Should produce a deterministic hash
    const node2 = reverseNode(addr);
    try testing.expectEqual(node, node2);
    
    // Should not be zero
    try testing.expect(!node.isZero());
}

test "ENS label validation" {
    // Valid labels
    try testing.expect(isValidLabel("eth"));
    try testing.expect(isValidLabel("vitalik"));
    try testing.expect(isValidLabel("foo-bar"));
    try testing.expect(isValidLabel("123"));
    try testing.expect(isValidLabel("a1b2c3"));
    
    // Invalid labels
    try testing.expect(!isValidLabel("")); // Empty
    try testing.expect(!isValidLabel("-foo")); // Leading hyphen
    try testing.expect(!isValidLabel("foo-")); // Trailing hyphen
    try testing.expect(!isValidLabel("foo--bar")); // Consecutive hyphens
    try testing.expect(!isValidLabel("foo.bar")); // Contains dot
    try testing.expect(!isValidLabel("foo bar")); // Contains space
    
    // Too long (64 characters)
    const longLabel = "a" ** 64;
    try testing.expect(!isValidLabel(longLabel));
}

test "ENS content hash decoding" {
    // IPFS hash with codec 0xe301
    const ipfsData = [_]u8{ 0xe3, 0x01 } ++ [_]u8{0x12} ** 32; // Simplified
    const ipfsResult = try decodeContentHash(&ipfsData);
    try testing.expectEqual(ContentHashType.ipfs, ipfsResult.hashType);
    try testing.expectEqual(@as(usize, 32), ipfsResult.hash.len);
    
    // Swarm hash with codec 0xe401
    const swarmData = [_]u8{ 0xe4, 0x01 } ++ [_]u8{0x34} ** 32;
    const swarmResult = try decodeContentHash(&swarmData);
    try testing.expectEqual(ContentHashType.swarm, swarmResult.hashType);
}

test "ENS wildcard resolution check" {
    try testing.expect(!hasWildcardResolution("eth"));
    try testing.expect(hasWildcardResolution("vitalik.eth"));
    try testing.expect(hasWildcardResolution("blog.vitalik.eth"));
    try testing.expect(hasWildcardResolution("foo.bar.baz.eth"));
}