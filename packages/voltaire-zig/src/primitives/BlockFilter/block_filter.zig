//! BlockFilter - Filter for new block notifications
//!
//! Created by eth_newBlockFilter, notifies of new blocks when polled
//! with eth_getFilterChanges. Returns array of block hashes.
//!
//! ## Usage
//! ```zig
//! const BlockFilter = @import("primitives").BlockFilter;
//! const FilterId = @import("primitives").FilterId;
//!
//! // Create from filter ID
//! const id = FilterId.fromU64(1);
//! const filter = BlockFilter.from(&id);
//!
//! // Serialize
//! const json = try BlockFilter.toJson(&filter, allocator);
//! ```

const std = @import("std");
const filter_id = @import("../FilterId/filter_id.zig");
const FilterId = filter_id.FilterId;

/// BlockFilter type discriminator
pub const FilterType = enum {
    block,
};

/// BlockFilter - filter for new block notifications
pub const BlockFilter = struct {
    /// Filter identifier
    filter_id: FilterId,
    /// Filter type (always .block)
    filter_type: FilterType = .block,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create BlockFilter from FilterId
pub fn from(id: *const FilterId) BlockFilter {
    return BlockFilter{
        .filter_id = id.*,
        .filter_type = .block,
    };
}

test "from - creates block filter" {
    const id = filter_id.fromU64(1);
    const f = from(&id);
    try std.testing.expect(filter_id.equals(&f.filter_id, &id));
    try std.testing.expectEqual(FilterType.block, f.filter_type);
}

test "from - different ids create distinct filters" {
    const id1 = filter_id.fromU64(1);
    const id2 = filter_id.fromU64(2);
    const f1 = from(&id1);
    const f2 = from(&id2);
    try std.testing.expect(!filter_id.equals(&f1.filter_id, &f2.filter_id));
}

/// Create BlockFilter from hex string
pub fn fromHex(hex: []const u8) filter_id.FilterIdError!BlockFilter {
    const id = try filter_id.fromHex(hex);
    return from(&id);
}

test "fromHex - creates block filter" {
    const f = try fromHex("0x1");
    try std.testing.expectEqual(FilterType.block, f.filter_type);
}

/// Create BlockFilter from u64
pub fn fromU64(value: u64) BlockFilter {
    const id = filter_id.fromU64(value);
    return from(&id);
}

test "fromU64 - creates block filter" {
    const f = fromU64(42);
    try std.testing.expectEqual(FilterType.block, f.filter_type);
    try std.testing.expectEqual(@as(u8, 42), f.filter_id.data[0]);
}

// ============================================================================
// Converters
// ============================================================================

/// Get the filter ID
pub fn getFilterId(f: *const BlockFilter) *const FilterId {
    return &f.filter_id;
}

test "getFilterId - returns filter id" {
    const f = fromU64(123);
    const id = getFilterId(&f);
    const expected = filter_id.fromU64(123);
    try std.testing.expect(filter_id.equals(id, &expected));
}

/// Convert to hex string
pub fn toHex(f: *const BlockFilter, allocator: std.mem.Allocator) ![]const u8 {
    return filter_id.toHex(&f.filter_id, allocator);
}

test "toHex - returns filter id hex" {
    const f = try fromHex("0xabcd");
    const hex = try toHex(&f, std.testing.allocator);
    defer std.testing.allocator.free(hex);
    try std.testing.expect(std.mem.eql(u8, hex, "0xabcd"));
}

/// Serialize to JSON object
pub fn toJson(f: *const BlockFilter, allocator: std.mem.Allocator) ![]const u8 {
    const id_hex = try filter_id.toHex(&f.filter_id, allocator);
    defer allocator.free(id_hex);

    // {"filterId":"0x...","type":"block"}
    const template = "{\"filterId\":\"";
    const middle = "\",\"type\":\"block\"}";
    const total_len = template.len + id_hex.len + middle.len;

    const json = try allocator.alloc(u8, total_len);
    var offset: usize = 0;

    @memcpy(json[offset .. offset + template.len], template);
    offset += template.len;

    @memcpy(json[offset .. offset + id_hex.len], id_hex);
    offset += id_hex.len;

    @memcpy(json[offset .. offset + middle.len], middle);

    return json;
}

test "toJson - returns JSON object" {
    const f = try fromHex("0x1");
    const json = try toJson(&f, std.testing.allocator);
    defer std.testing.allocator.free(json);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"filterId\":\"0x01\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"type\":\"block\"") != null);
}

// ============================================================================
// Comparison
// ============================================================================

/// Compare two BlockFilters for equality
pub fn equals(a: *const BlockFilter, b: *const BlockFilter) bool {
    return filter_id.equals(&a.filter_id, &b.filter_id);
}

test "equals - same filters" {
    const f1 = fromU64(1);
    const f2 = fromU64(1);
    try std.testing.expect(equals(&f1, &f2));
}

test "equals - different filters" {
    const f1 = fromU64(1);
    const f2 = fromU64(2);
    try std.testing.expect(!equals(&f1, &f2));
}

// ============================================================================
// Utilities
// ============================================================================

/// Clone a BlockFilter
pub fn clone(f: *const BlockFilter) BlockFilter {
    return f.*;
}

test "clone - creates copy" {
    const f1 = fromU64(42);
    const f2 = clone(&f1);
    try std.testing.expect(equals(&f1, &f2));
}

/// Check if filter type is block
pub fn isBlockFilter(f: *const BlockFilter) bool {
    return f.filter_type == .block;
}

test "isBlockFilter - always true for BlockFilter" {
    const f = fromU64(1);
    try std.testing.expect(isBlockFilter(&f));
}
