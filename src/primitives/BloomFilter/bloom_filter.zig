const std = @import("std");
const testing = std.testing;

/// Bloom filter for probabilistic set membership testing
/// False positives possible, false negatives impossible
pub const BloomFilter = struct {
    bits: []u8,
    k: usize, // num hash functions
    m: usize, // num bits

    pub fn init(allocator: std.mem.Allocator, m: usize, k: usize) !BloomFilter {
        const bytes = (m + 7) / 8;
        const bits = try allocator.alloc(u8, bytes);
        @memset(bits, 0);
        return .{
            .bits = bits,
            .k = k,
            .m = m,
        };
    }

    pub fn deinit(self: *BloomFilter, allocator: std.mem.Allocator) void {
        allocator.free(self.bits);
    }

    pub fn add(self: *BloomFilter, item: []const u8) void {
        var i: usize = 0;
        while (i < self.k) : (i += 1) {
            const h = self.hash(item, i);
            const idx = h / 8;
            const bit = @as(u3, @intCast(h % 8));
            self.bits[idx] |= @as(u8, 1) << bit;
        }
    }

    pub fn contains(self: *const BloomFilter, item: []const u8) bool {
        var i: usize = 0;
        while (i < self.k) : (i += 1) {
            const h = self.hash(item, i);
            const idx = h / 8;
            const bit = @as(u3, @intCast(h % 8));
            if ((self.bits[idx] & (@as(u8, 1) << bit)) == 0) {
                return false;
            }
        }
        return true;
    }

    fn hash(self: *const BloomFilter, item: []const u8, seed: usize) usize {
        const h = std.hash.Wyhash.hash(seed, item);
        return @as(usize, @intCast(h % self.m));
    }

    /// Check if filter is empty (all bits are 0)
    pub fn isEmpty(self: *const BloomFilter) bool {
        for (self.bits) |byte| {
            if (byte != 0) {
                return false;
            }
        }
        return true;
    }

    /// Calculate density (percentage of bits set) in bloom filter
    /// Returns value between 0 and 1
    pub fn density(self: *const BloomFilter) f64 {
        var bits_set: usize = 0;
        for (self.bits) |byte| {
            var b = byte;
            while (b > 0) {
                bits_set += b & 1;
                b >>= 1;
            }
        }
        return @as(f64, @floatFromInt(bits_set)) / @as(f64, @floatFromInt(self.m));
    }

    /// Calculate expected false positive rate for a bloom filter
    /// Formula: (1 - e^(-k*n/m))^k
    /// where k = number of hash functions, n = number of items, m = number of bits
    pub fn expectedFalsePositiveRate(self: *const BloomFilter, item_count: usize) f64 {
        const k = @as(f64, @floatFromInt(self.k));
        const m = @as(f64, @floatFromInt(self.m));
        const n = @as(f64, @floatFromInt(item_count));

        // (1 - e^(-k*n/m))^k
        const exponent = (-k * n) / m;
        const base = 1.0 - @exp(exponent);
        return std.math.pow(f64, base, k);
    }

    /// Merge two bloom filters using bitwise OR
    /// Both filters must have same size and hash count
    /// Returns error if filters have different parameters
    pub fn merge(allocator: std.mem.Allocator, filter1: *const BloomFilter, filter2: *const BloomFilter) !BloomFilter {
        if (filter1.m != filter2.m or filter1.k != filter2.k) {
            return error.MismatchedParameters;
        }
        if (filter1.bits.len != filter2.bits.len) {
            return error.MismatchedSize;
        }

        var result = try BloomFilter.init(allocator, filter1.m, filter1.k);
        for (filter1.bits, filter2.bits, 0..) |b1, b2, i| {
            result.bits[i] = b1 | b2;
        }
        return result;
    }

    /// Combine multiple bloom filters using bitwise OR
    /// All filters must have same size and hash count
    /// Returns error if filters have different parameters or if no filters provided
    pub fn combine(allocator: std.mem.Allocator, filters: []const *const BloomFilter) !BloomFilter {
        if (filters.len == 0) {
            return error.EmptyFilterList;
        }

        const first = filters[0];
        // Validate all filters have same parameters
        for (filters[1..]) |filter| {
            if (filter.m != first.m or filter.k != first.k) {
                return error.MismatchedParameters;
            }
            if (filter.bits.len != first.bits.len) {
                return error.MismatchedSize;
            }
        }

        var result = try BloomFilter.init(allocator, first.m, first.k);
        for (0..first.bits.len) |i| {
            var combined: u8 = 0;
            for (filters) |filter| {
                combined |= filter.bits[i];
            }
            result.bits[i] = combined;
        }
        return result;
    }

    /// Convert bloom filter to hex string with 0x prefix
    /// Caller owns returned memory
    pub fn toHex(self: *const BloomFilter, allocator: std.mem.Allocator) ![]u8 {
        // "0x" + 2 chars per byte
        const hex_len = 2 + (self.bits.len * 2);
        const result = try allocator.alloc(u8, hex_len);
        result[0] = '0';
        result[1] = 'x';

        const hex_chars = "0123456789abcdef";
        for (self.bits, 0..) |byte, i| {
            const offset = 2 + (i * 2);
            result[offset] = hex_chars[byte >> 4];
            result[offset + 1] = hex_chars[byte & 0x0F];
        }
        return result;
    }

    /// Create bloom filter from hex string (with or without 0x prefix)
    pub fn fromHex(allocator: std.mem.Allocator, hex: []const u8, m: usize, k: usize) !BloomFilter {
        const clean_hex = if (std.mem.startsWith(u8, hex, "0x")) hex[2..] else hex;
        const expected_bytes = (m + 7) / 8;
        const expected_hex_len = expected_bytes * 2;

        if (clean_hex.len != expected_hex_len) {
            return error.InvalidHexLength;
        }

        var bf = try BloomFilter.init(allocator, m, k);
        errdefer bf.deinit(allocator);

        for (0..expected_bytes) |i| {
            const hi = charToHex(clean_hex[i * 2]) catch return error.InvalidHexChar;
            const lo = charToHex(clean_hex[i * 2 + 1]) catch return error.InvalidHexChar;
            bf.bits[i] = (hi << 4) | lo;
        }

        return bf;
    }

    fn charToHex(c: u8) !u8 {
        return switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => error.InvalidHexChar,
        };
    }
};

test "create bloom filter" {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);
}

test "add and contains" {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);

    bf.add("foo");
    try testing.expect(bf.contains("foo"));
    try testing.expect(!bf.contains("bar"));
}

test "multiple items" {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);

    bf.add("foo");
    bf.add("bar");
    bf.add("baz");

    try testing.expect(bf.contains("foo"));
    try testing.expect(bf.contains("bar"));
    try testing.expect(bf.contains("baz"));
    try testing.expect(!bf.contains("qux"));
}

test "no false negatives" {
    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);

    const items = [_][]const u8{ "a", "b", "c", "test", "hello", "world", "zig", "ethereum" };

    for (items) |item| {
        bf.add(item);
    }

    for (items) |item| {
        try testing.expect(bf.contains(item));
    }
}

test "isEmpty - new filter" {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);
    try testing.expect(bf.isEmpty());
}

test "isEmpty - after adding item" {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);
    bf.add("test");
    try testing.expect(!bf.isEmpty());
}

test "isEmpty - single bit set" {
    var bf = try BloomFilter.init(testing.allocator, 1000, 3);
    defer bf.deinit(testing.allocator);
    bf.bits[0] = 1;
    try testing.expect(!bf.isEmpty());
}

test "density - empty filter" {
    var bf = try BloomFilter.init(testing.allocator, 2048, 3);
    defer bf.deinit(testing.allocator);
    const d = bf.density();
    try testing.expect(d == 0.0);
}

test "density - after adding items" {
    var bf = try BloomFilter.init(testing.allocator, 2048, 3);
    defer bf.deinit(testing.allocator);
    bf.add("test");
    const d = bf.density();
    try testing.expect(d > 0.0);
    try testing.expect(d < 0.01);
}

test "density - increases with more items" {
    var bf = try BloomFilter.init(testing.allocator, 2048, 3);
    defer bf.deinit(testing.allocator);
    bf.add("test1");
    const d1 = bf.density();

    bf.add("test2");
    bf.add("test3");
    const d2 = bf.density();

    try testing.expect(d2 > d1);
}

test "expectedFalsePositiveRate - calculates FPR" {
    var bf = try BloomFilter.init(testing.allocator, 2048, 3);
    defer bf.deinit(testing.allocator);
    const fpr = bf.expectedFalsePositiveRate(100);
    try testing.expect(fpr > 0.0);
    try testing.expect(fpr < 0.01);
}

test "expectedFalsePositiveRate - increases with more items" {
    var bf = try BloomFilter.init(testing.allocator, 2048, 3);
    defer bf.deinit(testing.allocator);
    const fpr1 = bf.expectedFalsePositiveRate(10);
    const fpr2 = bf.expectedFalsePositiveRate(100);
    try testing.expect(fpr2 > fpr1);
}

test "expectedFalsePositiveRate - well-sized filter" {
    var bf = try BloomFilter.init(testing.allocator, 10000, 5);
    defer bf.deinit(testing.allocator);
    const fpr = bf.expectedFalsePositiveRate(100);
    try testing.expect(fpr < 0.001);
}

test "merge - two filters" {
    var f1 = try BloomFilter.init(testing.allocator, 2048, 3);
    defer f1.deinit(testing.allocator);
    var f2 = try BloomFilter.init(testing.allocator, 2048, 3);
    defer f2.deinit(testing.allocator);

    f1.add("test1");
    f2.add("test2");

    var merged = try BloomFilter.merge(testing.allocator, &f1, &f2);
    defer merged.deinit(testing.allocator);

    try testing.expect(merged.contains("test1"));
    try testing.expect(merged.contains("test2"));
}

test "merge - does not mutate source filters" {
    var f1 = try BloomFilter.init(testing.allocator, 2048, 3);
    defer f1.deinit(testing.allocator);
    var f2 = try BloomFilter.init(testing.allocator, 2048, 3);
    defer f2.deinit(testing.allocator);

    f1.add("test1");
    f2.add("test2");

    var merged = try BloomFilter.merge(testing.allocator, &f1, &f2);
    defer merged.deinit(testing.allocator);

    try testing.expect(f1.contains("test1"));
    try testing.expect(!f1.contains("test2"));
    try testing.expect(!f2.contains("test1"));
    try testing.expect(f2.contains("test2"));
}

test "merge - mismatched m" {
    var f1 = try BloomFilter.init(testing.allocator, 2048, 3);
    defer f1.deinit(testing.allocator);
    var f2 = try BloomFilter.init(testing.allocator, 4096, 3);
    defer f2.deinit(testing.allocator);

    const result = BloomFilter.merge(testing.allocator, &f1, &f2);
    try testing.expectError(error.MismatchedParameters, result);
}

test "merge - mismatched k" {
    var f1 = try BloomFilter.init(testing.allocator, 2048, 3);
    defer f1.deinit(testing.allocator);
    var f2 = try BloomFilter.init(testing.allocator, 2048, 5);
    defer f2.deinit(testing.allocator);

    const result = BloomFilter.merge(testing.allocator, &f1, &f2);
    try testing.expectError(error.MismatchedParameters, result);
}

test "combine - multiple filters" {
    var f1 = try BloomFilter.init(testing.allocator, 2048, 3);
    defer f1.deinit(testing.allocator);
    var f2 = try BloomFilter.init(testing.allocator, 2048, 3);
    defer f2.deinit(testing.allocator);
    var f3 = try BloomFilter.init(testing.allocator, 2048, 3);
    defer f3.deinit(testing.allocator);

    f1.add("test1");
    f2.add("test2");
    f3.add("test3");

    const filters = [_]*const BloomFilter{ &f1, &f2, &f3 };
    var combined = try BloomFilter.combine(testing.allocator, &filters);
    defer combined.deinit(testing.allocator);

    try testing.expect(combined.contains("test1"));
    try testing.expect(combined.contains("test2"));
    try testing.expect(combined.contains("test3"));
}

test "combine - empty input" {
    const filters: []const *const BloomFilter = &.{};
    const result = BloomFilter.combine(testing.allocator, filters);
    try testing.expectError(error.EmptyFilterList, result);
}

test "combine - mismatched parameters" {
    var f1 = try BloomFilter.init(testing.allocator, 2048, 3);
    defer f1.deinit(testing.allocator);
    var f2 = try BloomFilter.init(testing.allocator, 4096, 3);
    defer f2.deinit(testing.allocator);

    const filters = [_]*const BloomFilter{ &f1, &f2 };
    const result = BloomFilter.combine(testing.allocator, &filters);
    try testing.expectError(error.MismatchedParameters, result);
}

test "toHex - empty filter" {
    var bf = try BloomFilter.init(testing.allocator, 64, 3);
    defer bf.deinit(testing.allocator);
    const hex = try bf.toHex(testing.allocator);
    defer testing.allocator.free(hex);

    // 64 bits = 8 bytes = 16 hex chars + "0x" = 18 chars
    try testing.expectEqual(@as(usize, 18), hex.len);
    try testing.expect(std.mem.startsWith(u8, hex, "0x"));
    try testing.expectEqualStrings("0x0000000000000000", hex);
}

test "toHex - filter with items" {
    var bf = try BloomFilter.init(testing.allocator, 64, 3);
    defer bf.deinit(testing.allocator);
    bf.add("test");
    const hex = try bf.toHex(testing.allocator);
    defer testing.allocator.free(hex);

    try testing.expectEqual(@as(usize, 18), hex.len);
    try testing.expect(std.mem.startsWith(u8, hex, "0x"));
    // Should not be all zeros
    try testing.expect(!std.mem.eql(u8, hex, "0x0000000000000000"));
}

test "toHex - lowercase hex" {
    var bf = try BloomFilter.init(testing.allocator, 64, 3);
    defer bf.deinit(testing.allocator);
    bf.bits[0] = 0xff;
    const hex = try bf.toHex(testing.allocator);
    defer testing.allocator.free(hex);

    // First byte should be "ff" (lowercase)
    try testing.expectEqualStrings("ff", hex[2..4]);
}

test "fromHex - creates filter from hex string" {
    const hex = "0x0000000000000000";
    var bf = try BloomFilter.fromHex(testing.allocator, hex, 64, 3);
    defer bf.deinit(testing.allocator);

    try testing.expectEqual(@as(usize, 8), bf.bits.len);
    try testing.expectEqual(@as(usize, 64), bf.m);
    try testing.expectEqual(@as(usize, 3), bf.k);
}

test "fromHex - recreates filter with data" {
    var original = try BloomFilter.init(testing.allocator, 64, 3);
    defer original.deinit(testing.allocator);
    original.add("test");

    const hex = try original.toHex(testing.allocator);
    defer testing.allocator.free(hex);

    var restored = try BloomFilter.fromHex(testing.allocator, hex, 64, 3);
    defer restored.deinit(testing.allocator);

    try testing.expect(restored.contains("test"));
}

test "fromHex - round-trips through hex" {
    var original = try BloomFilter.init(testing.allocator, 64, 3);
    defer original.deinit(testing.allocator);
    original.add("test1");
    original.add("test2");
    original.add("test3");

    const hex = try original.toHex(testing.allocator);
    defer testing.allocator.free(hex);

    var restored = try BloomFilter.fromHex(testing.allocator, hex, 64, 3);
    defer restored.deinit(testing.allocator);

    const hex2 = try restored.toHex(testing.allocator);
    defer testing.allocator.free(hex2);

    try testing.expectEqualStrings(hex, hex2);
}

test "fromHex - handles uppercase hex" {
    const hex = "0xFFFFFFFFFFFFFFFF";
    var bf = try BloomFilter.fromHex(testing.allocator, hex, 64, 3);
    defer bf.deinit(testing.allocator);

    for (bf.bits) |byte| {
        try testing.expectEqual(@as(u8, 0xff), byte);
    }
}

test "fromHex - handles hex without 0x prefix" {
    const hex = "0000000000000000";
    var bf = try BloomFilter.fromHex(testing.allocator, hex, 64, 3);
    defer bf.deinit(testing.allocator);

    try testing.expectEqual(@as(usize, 8), bf.bits.len);
}
