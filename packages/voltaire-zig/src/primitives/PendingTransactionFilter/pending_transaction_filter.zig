//! PendingTransactionFilter - Filter for pending transaction notifications
//!
//! Created by eth_newPendingTransactionFilter, notifies of new pending
//! transactions when polled with eth_getFilterChanges. Returns array of
//! transaction hashes.
//!
//! ## Usage
//! ```zig
//! const PendingTransactionFilter = @import("primitives").PendingTransactionFilter;
//! const FilterId = @import("primitives").FilterId;
//!
//! // Create from filter ID
//! const id = FilterId.fromU64(1);
//! const filter = PendingTransactionFilter.from(&id);
//!
//! // Serialize
//! const json = try PendingTransactionFilter.toJson(&filter, allocator);
//! ```

const std = @import("std");
const filter_id = @import("../FilterId/filter_id.zig");
const FilterId = filter_id.FilterId;

/// PendingTransactionFilter type discriminator
pub const FilterType = enum {
    pending_transaction,
};

/// PendingTransactionFilter - filter for pending transaction notifications
pub const PendingTransactionFilter = struct {
    /// Filter identifier
    filter_id: FilterId,
    /// Filter type (always .pending_transaction)
    filter_type: FilterType = .pending_transaction,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create PendingTransactionFilter from FilterId
pub fn from(id: *const FilterId) PendingTransactionFilter {
    return PendingTransactionFilter{
        .filter_id = id.*,
        .filter_type = .pending_transaction,
    };
}

test "from - creates pending transaction filter" {
    const id = filter_id.fromU64(1);
    const f = from(&id);
    try std.testing.expect(filter_id.equals(&f.filter_id, &id));
    try std.testing.expectEqual(FilterType.pending_transaction, f.filter_type);
}

test "from - different ids create distinct filters" {
    const id1 = filter_id.fromU64(1);
    const id2 = filter_id.fromU64(2);
    const f1 = from(&id1);
    const f2 = from(&id2);
    try std.testing.expect(!filter_id.equals(&f1.filter_id, &f2.filter_id));
}

/// Create PendingTransactionFilter from hex string
pub fn fromHex(hex: []const u8) filter_id.FilterIdError!PendingTransactionFilter {
    const id = try filter_id.fromHex(hex);
    return from(&id);
}

test "fromHex - creates pending transaction filter" {
    const f = try fromHex("0x1");
    try std.testing.expectEqual(FilterType.pending_transaction, f.filter_type);
}

/// Create PendingTransactionFilter from u64
pub fn fromU64(value: u64) PendingTransactionFilter {
    const id = filter_id.fromU64(value);
    return from(&id);
}

test "fromU64 - creates pending transaction filter" {
    const f = fromU64(42);
    try std.testing.expectEqual(FilterType.pending_transaction, f.filter_type);
    try std.testing.expectEqual(@as(u8, 42), f.filter_id.data[0]);
}

// ============================================================================
// Converters
// ============================================================================

/// Get the filter ID
pub fn getFilterId(f: *const PendingTransactionFilter) *const FilterId {
    return &f.filter_id;
}

test "getFilterId - returns filter id" {
    const f = fromU64(123);
    const id = getFilterId(&f);
    const expected = filter_id.fromU64(123);
    try std.testing.expect(filter_id.equals(id, &expected));
}

/// Convert to hex string
pub fn toHex(f: *const PendingTransactionFilter, allocator: std.mem.Allocator) ![]const u8 {
    return filter_id.toHex(&f.filter_id, allocator);
}

test "toHex - returns filter id hex" {
    const f = try fromHex("0xabcd");
    const hex = try toHex(&f, std.testing.allocator);
    defer std.testing.allocator.free(hex);
    try std.testing.expect(std.mem.eql(u8, hex, "0xabcd"));
}

/// Serialize to JSON object
pub fn toJson(f: *const PendingTransactionFilter, allocator: std.mem.Allocator) ![]const u8 {
    const id_hex = try filter_id.toHex(&f.filter_id, allocator);
    defer allocator.free(id_hex);

    // {"filterId":"0x...","type":"pendingTransaction"}
    const template = "{\"filterId\":\"";
    const middle = "\",\"type\":\"pendingTransaction\"}";
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
    try std.testing.expect(std.mem.indexOf(u8, json, "\"type\":\"pendingTransaction\"") != null);
}

// ============================================================================
// Comparison
// ============================================================================

/// Compare two PendingTransactionFilters for equality
pub fn equals(a: *const PendingTransactionFilter, b: *const PendingTransactionFilter) bool {
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

/// Clone a PendingTransactionFilter
pub fn clone(f: *const PendingTransactionFilter) PendingTransactionFilter {
    return f.*;
}

test "clone - creates copy" {
    const f1 = fromU64(42);
    const f2 = clone(&f1);
    try std.testing.expect(equals(&f1, &f2));
}

/// Check if filter type is pending transaction
pub fn isPendingTransactionFilter(f: *const PendingTransactionFilter) bool {
    return f.filter_type == .pending_transaction;
}

test "isPendingTransactionFilter - always true for PendingTransactionFilter" {
    const f = fromU64(1);
    try std.testing.expect(isPendingTransactionFilter(&f));
}
