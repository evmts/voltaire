//! TopicFilter - Log topic filter for event filtering
//!
//! Topic filters support up to 4 indexed event parameters with:
//! - topic0 is typically the event signature hash
//! - null entries match any value (wildcard)
//! - Array entries match any of the values (OR logic)
//! - Positions use AND logic: all non-null positions must match
//!
//! ## Usage
//! ```zig
//! const TopicFilter = @import("primitives").TopicFilter;
//! const Hash = @import("primitives").Hash;
//!
//! // Match specific event signature
//! const filter1 = try TopicFilter.from(&[_]?TopicFilter.TopicEntry{
//!     TopicFilter.single(eventSig),
//! });
//!
//! // Match with wildcard
//! const filter2 = try TopicFilter.from(&[_]?TopicFilter.TopicEntry{
//!     TopicFilter.single(eventSig),
//!     null, // wildcard
//!     TopicFilter.single(recipient),
//! });
//!
//! // Match any of multiple events (OR)
//! const filter3 = try TopicFilter.from(&[_]?TopicFilter.TopicEntry{
//!     TopicFilter.multi(&[_]Hash.Hash{eventSig1, eventSig2}),
//! });
//! ```

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");

/// Maximum number of topics (Ethereum spec)
pub const MAX_TOPICS = 4;

/// Maximum hashes per topic entry for OR matching
pub const MAX_HASHES_PER_ENTRY = 16;

/// Single topic entry - either a specific hash, array of hashes (OR), or null (wildcard)
pub const TopicEntry = struct {
    /// Hashes for this entry (OR logic if multiple)
    hashes: [MAX_HASHES_PER_ENTRY]Hash.Hash,
    /// Number of valid hashes (0 = wildcard)
    count: usize,

    pub const WILDCARD: TopicEntry = .{
        .hashes = [_]Hash.Hash{Hash.ZERO} ** MAX_HASHES_PER_ENTRY,
        .count = 0,
    };
};

/// TopicFilter - array of up to 4 topic entries
pub const TopicFilter = struct {
    entries: [MAX_TOPICS]TopicEntry,
    len: usize,
};

// ============================================================================
// Errors
// ============================================================================

pub const TopicFilterError = error{
    TooManyTopics,
    TooManyHashes,
    EmptyHashArray,
};

// ============================================================================
// Helper Functions
// ============================================================================

/// Create a single-hash topic entry
pub fn single(hash: Hash.Hash) TopicEntry {
    var entry = TopicEntry{
        .hashes = [_]Hash.Hash{Hash.ZERO} ** MAX_HASHES_PER_ENTRY,
        .count = 1,
    };
    entry.hashes[0] = hash;
    return entry;
}

test "single - creates entry with one hash" {
    const h = [_]u8{0xab} ** Hash.SIZE;
    const entry = single(h);
    try std.testing.expectEqual(@as(usize, 1), entry.count);
    try std.testing.expect(Hash.equals(&entry.hashes[0], &h));
}

/// Create a multi-hash topic entry (OR logic)
pub fn multi(hashes: []const Hash.Hash) TopicFilterError!TopicEntry {
    if (hashes.len == 0) {
        return TopicFilterError.EmptyHashArray;
    }
    if (hashes.len > MAX_HASHES_PER_ENTRY) {
        return TopicFilterError.TooManyHashes;
    }

    var entry = TopicEntry{
        .hashes = [_]Hash.Hash{Hash.ZERO} ** MAX_HASHES_PER_ENTRY,
        .count = hashes.len,
    };
    for (hashes, 0..) |h, i| {
        entry.hashes[i] = h;
    }
    return entry;
}

test "multi - creates entry with multiple hashes" {
    const h1 = [_]u8{0xaa} ** Hash.SIZE;
    const h2 = [_]u8{0xbb} ** Hash.SIZE;
    const entry = try multi(&[_]Hash.Hash{ h1, h2 });
    try std.testing.expectEqual(@as(usize, 2), entry.count);
    try std.testing.expect(Hash.equals(&entry.hashes[0], &h1));
    try std.testing.expect(Hash.equals(&entry.hashes[1], &h2));
}

test "multi - empty returns error" {
    try std.testing.expectError(TopicFilterError.EmptyHashArray, multi(&[_]Hash.Hash{}));
}

test "multi - too many hashes returns error" {
    const hashes = [_]Hash.Hash{Hash.ZERO} ** (MAX_HASHES_PER_ENTRY + 1);
    try std.testing.expectError(TopicFilterError.TooManyHashes, multi(&hashes));
}

/// Create a wildcard entry (matches any topic)
pub fn wildcard() TopicEntry {
    return TopicEntry.WILDCARD;
}

test "wildcard - creates entry with count 0" {
    const entry = wildcard();
    try std.testing.expectEqual(@as(usize, 0), entry.count);
}

// ============================================================================
// Constructors
// ============================================================================

/// Create TopicFilter from array of optional entries
/// null = wildcard, TopicEntry = specific filter
pub fn from(entries: []const ?TopicEntry) TopicFilterError!TopicFilter {
    if (entries.len > MAX_TOPICS) {
        return TopicFilterError.TooManyTopics;
    }

    var filter = TopicFilter{
        .entries = [_]TopicEntry{TopicEntry.WILDCARD} ** MAX_TOPICS,
        .len = entries.len,
    };

    for (entries, 0..) |entry_opt, i| {
        if (entry_opt) |entry| {
            filter.entries[i] = entry;
        } else {
            filter.entries[i] = TopicEntry.WILDCARD;
        }
    }

    return filter;
}

test "from - empty filter" {
    const filter = try from(&[_]?TopicEntry{});
    try std.testing.expectEqual(@as(usize, 0), filter.len);
}

test "from - single topic" {
    const h = [_]u8{0x11} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{single(h)});
    try std.testing.expectEqual(@as(usize, 1), filter.len);
    try std.testing.expectEqual(@as(usize, 1), filter.entries[0].count);
}

test "from - with wildcards" {
    const h1 = [_]u8{0x11} ** Hash.SIZE;
    const h2 = [_]u8{0x22} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{ single(h1), null, single(h2) });
    try std.testing.expectEqual(@as(usize, 3), filter.len);
    try std.testing.expectEqual(@as(usize, 1), filter.entries[0].count);
    try std.testing.expectEqual(@as(usize, 0), filter.entries[1].count); // wildcard
    try std.testing.expectEqual(@as(usize, 1), filter.entries[2].count);
}

test "from - with OR entry" {
    const h1 = [_]u8{0x11} ** Hash.SIZE;
    const h2 = [_]u8{0x22} ** Hash.SIZE;
    const entry = try multi(&[_]Hash.Hash{ h1, h2 });
    const filter = try from(&[_]?TopicEntry{entry});
    try std.testing.expectEqual(@as(usize, 1), filter.len);
    try std.testing.expectEqual(@as(usize, 2), filter.entries[0].count);
}

test "from - all 4 positions" {
    const h = [_]u8{0x11} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{ single(h), single(h), single(h), null });
    try std.testing.expectEqual(@as(usize, 4), filter.len);
}

test "from - too many topics returns error" {
    const h = [_]u8{0x11} ** Hash.SIZE;
    const entries = [_]?TopicEntry{ single(h), single(h), single(h), single(h), single(h) };
    try std.testing.expectError(TopicFilterError.TooManyTopics, from(&entries));
}

/// Create empty filter (matches all logs)
pub fn empty() TopicFilter {
    return TopicFilter{
        .entries = [_]TopicEntry{TopicEntry.WILDCARD} ** MAX_TOPICS,
        .len = 0,
    };
}

test "empty - creates filter with length 0" {
    const filter = empty();
    try std.testing.expectEqual(@as(usize, 0), filter.len);
}

// ============================================================================
// Matching
// ============================================================================

/// Check if a topic array matches this filter
/// Uses AND logic across positions and OR logic within arrays
pub fn matches(filter: *const TopicFilter, log_topics: []const Hash.Hash) bool {
    // Check each filter position
    for (0..filter.len) |i| {
        const entry = &filter.entries[i];

        // Wildcard - matches anything
        if (entry.count == 0) {
            continue;
        }

        // If filter has more topics than log, no match
        if (i >= log_topics.len) {
            return false;
        }

        const log_topic = &log_topics[i];

        // Check if log topic matches any hash in entry (OR logic)
        var matched = false;
        for (0..entry.count) |j| {
            if (Hash.equals(log_topic, &entry.hashes[j])) {
                matched = true;
                break;
            }
        }
        if (!matched) {
            return false;
        }
    }

    return true;
}

test "matches - empty filter matches anything" {
    const filter = empty();
    const h1 = [_]u8{0x11} ** Hash.SIZE;
    const h2 = [_]u8{0x22} ** Hash.SIZE;
    try std.testing.expect(matches(&filter, &[_]Hash.Hash{ h1, h2 }));
}

test "matches - all wildcards match anything" {
    const filter = try from(&[_]?TopicEntry{ null, null, null });
    const h1 = [_]u8{0x11} ** Hash.SIZE;
    const h2 = [_]u8{0x22} ** Hash.SIZE;
    const h3 = [_]u8{0x33} ** Hash.SIZE;
    try std.testing.expect(matches(&filter, &[_]Hash.Hash{ h1, h2, h3 }));
}

test "matches - specific topic at position 0" {
    const h1 = [_]u8{0x11} ** Hash.SIZE;
    const h2 = [_]u8{0x22} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{single(h1)});
    try std.testing.expect(matches(&filter, &[_]Hash.Hash{ h1, h2 }));
    try std.testing.expect(!matches(&filter, &[_]Hash.Hash{ h2, h1 }));
}

test "matches - with wildcard in middle" {
    const h1 = [_]u8{0x11} ** Hash.SIZE;
    const h2 = [_]u8{0x22} ** Hash.SIZE;
    const h3 = [_]u8{0x33} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{ single(h1), null, single(h3) });
    try std.testing.expect(matches(&filter, &[_]Hash.Hash{ h1, h2, h3 }));
    try std.testing.expect(matches(&filter, &[_]Hash.Hash{ h1, h1, h3 }));
    try std.testing.expect(!matches(&filter, &[_]Hash.Hash{ h2, h2, h3 }));
    try std.testing.expect(!matches(&filter, &[_]Hash.Hash{ h1, h2, h2 }));
}

test "matches - array entry (OR logic)" {
    const h1 = [_]u8{0x11} ** Hash.SIZE;
    const h2 = [_]u8{0x22} ** Hash.SIZE;
    const h3 = [_]u8{0x33} ** Hash.SIZE;
    const entry = try multi(&[_]Hash.Hash{ h1, h2 });
    const filter = try from(&[_]?TopicEntry{entry});
    try std.testing.expect(matches(&filter, &[_]Hash.Hash{h1}));
    try std.testing.expect(matches(&filter, &[_]Hash.Hash{h2}));
    try std.testing.expect(!matches(&filter, &[_]Hash.Hash{h3}));
}

test "matches - log has fewer topics" {
    const h1 = [_]u8{0x11} ** Hash.SIZE;
    const h2 = [_]u8{0x22} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{ single(h1), single(h2) });
    try std.testing.expect(!matches(&filter, &[_]Hash.Hash{h1}));
}

test "matches - complex filter" {
    const h1 = [_]u8{0x11} ** Hash.SIZE;
    const h2 = [_]u8{0x22} ** Hash.SIZE;
    const h3 = [_]u8{0x33} ** Hash.SIZE;
    const entry = try multi(&[_]Hash.Hash{ h2, h3 });
    const filter = try from(&[_]?TopicEntry{ single(h1), entry, null });
    try std.testing.expect(matches(&filter, &[_]Hash.Hash{ h1, h2, h1 }));
    try std.testing.expect(matches(&filter, &[_]Hash.Hash{ h1, h3, h1 }));
    try std.testing.expect(!matches(&filter, &[_]Hash.Hash{ h1, h1, h1 }));
}

// ============================================================================
// Validation
// ============================================================================

/// Check if topic filter is empty (all wildcards)
pub fn isEmpty(filter: *const TopicFilter) bool {
    if (filter.len == 0) return true;

    for (0..filter.len) |i| {
        if (filter.entries[i].count != 0) {
            return false;
        }
    }
    return true;
}

test "isEmpty - empty array" {
    const filter = empty();
    try std.testing.expect(isEmpty(&filter));
}

test "isEmpty - all nulls" {
    const filter = try from(&[_]?TopicEntry{ null, null, null });
    try std.testing.expect(isEmpty(&filter));
}

test "isEmpty - has topic" {
    const h = [_]u8{0x11} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{single(h)});
    try std.testing.expect(!isEmpty(&filter));
}

test "isEmpty - topic at any position" {
    const h = [_]u8{0x22} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{ null, single(h), null });
    try std.testing.expect(!isEmpty(&filter));
}

// ============================================================================
// Serialization
// ============================================================================

/// Serialize to JSON array
pub fn toJson(filter: *const TopicFilter, allocator: std.mem.Allocator) ![]const u8 {
    var list = std.ArrayList(u8).init(allocator);
    errdefer list.deinit();

    try list.append('[');

    for (0..filter.len) |i| {
        if (i > 0) try list.append(',');

        const entry = &filter.entries[i];
        if (entry.count == 0) {
            try list.appendSlice("null");
        } else if (entry.count == 1) {
            try list.append('"');
            const hex = try Hash.toHex(&entry.hashes[0], allocator);
            defer allocator.free(hex);
            try list.appendSlice(hex);
            try list.append('"');
        } else {
            try list.append('[');
            for (0..entry.count) |j| {
                if (j > 0) try list.append(',');
                try list.append('"');
                const hex = try Hash.toHex(&entry.hashes[j], allocator);
                defer allocator.free(hex);
                try list.appendSlice(hex);
                try list.append('"');
            }
            try list.append(']');
        }
    }

    try list.append(']');
    return list.toOwnedSlice();
}

test "toJson - empty filter" {
    const filter = empty();
    const json = try toJson(&filter, std.testing.allocator);
    defer std.testing.allocator.free(json);
    try std.testing.expect(std.mem.eql(u8, json, "[]"));
}

test "toJson - single topic" {
    const h = [_]u8{0x11} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{single(h)});
    const json = try toJson(&filter, std.testing.allocator);
    defer std.testing.allocator.free(json);
    try std.testing.expect(std.mem.startsWith(u8, json, "[\"0x"));
    try std.testing.expect(std.mem.endsWith(u8, json, "\"]"));
}

test "toJson - with null" {
    const h = [_]u8{0x11} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{ single(h), null });
    const json = try toJson(&filter, std.testing.allocator);
    defer std.testing.allocator.free(json);
    try std.testing.expect(std.mem.indexOf(u8, json, "null") != null);
}

test "toJson - with OR entry" {
    const h1 = [_]u8{0x11} ** Hash.SIZE;
    const h2 = [_]u8{0x22} ** Hash.SIZE;
    const entry = try multi(&[_]Hash.Hash{ h1, h2 });
    const filter = try from(&[_]?TopicEntry{entry});
    const json = try toJson(&filter, std.testing.allocator);
    defer std.testing.allocator.free(json);
    // Should have nested array
    try std.testing.expect(std.mem.indexOf(u8, json, "[[") != null);
}

// ============================================================================
// Utilities
// ============================================================================

/// Clone a TopicFilter
pub fn clone(filter: *const TopicFilter) TopicFilter {
    return filter.*;
}

test "clone - creates copy" {
    const h = [_]u8{0x11} ** Hash.SIZE;
    const filter1 = try from(&[_]?TopicEntry{single(h)});
    const filter2 = clone(&filter1);
    try std.testing.expectEqual(filter1.len, filter2.len);
    try std.testing.expectEqual(filter1.entries[0].count, filter2.entries[0].count);
}

/// Get the number of defined topic positions
pub fn length(filter: *const TopicFilter) usize {
    return filter.len;
}

test "length - returns filter length" {
    const h = [_]u8{0x11} ** Hash.SIZE;
    const filter = try from(&[_]?TopicEntry{ single(h), null, single(h) });
    try std.testing.expectEqual(@as(usize, 3), length(&filter));
}
