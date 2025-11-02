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
