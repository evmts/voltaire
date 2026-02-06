//! StorageDiff - Storage Changes for an Account
//!
//! Represents storage slot changes for a single account during transaction execution.
//! Maps storage slots to their before/after values.
//! Used for state diff analysis, particularly with debug_traceTransaction.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const StorageDiff = primitives.StorageDiff;
//!
//! // Create storage diff
//! var diff = StorageDiff.init(allocator, address);
//! defer diff.deinit();
//!
//! try diff.setChange(slot, old_value, new_value);
//! ```

const std = @import("std");
const Address = @import("../Address/address.zig");

/// Storage slot change (before/after)
pub const StorageChange = struct {
    from: ?[32]u8 = null,
    to: ?[32]u8 = null,
};

/// StorageDiff type - storage changes for an account
pub const StorageDiff = struct {
    /// Contract address for these storage changes
    address: Address.Address,

    /// Map of storage slot changes
    /// Key: storage slot (32 bytes)
    /// Value: before/after values
    changes: std.AutoHashMap([32]u8, StorageChange),

    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, address: Address.Address) StorageDiff {
        return .{
            .address = address,
            .changes = std.AutoHashMap([32]u8, StorageChange).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *StorageDiff) void {
        self.changes.deinit();
    }
};

// ============================================================================
// Constructors
// ============================================================================

/// Create StorageDiff for an address
pub fn init(allocator: std.mem.Allocator, address: Address.Address) StorageDiff {
    return StorageDiff.init(allocator, address);
}

/// Create StorageDiff from existing struct
pub fn from(data: StorageDiff) StorageDiff {
    return data;
}

// ============================================================================
// Accessors
// ============================================================================

/// Get the contract address
pub fn getAddress(diff: *const StorageDiff) Address.Address {
    return diff.address;
}

/// Get change for a specific slot
pub fn getChange(diff: *const StorageDiff, slot: [32]u8) ?StorageChange {
    return diff.changes.get(slot);
}

/// Get all changed slots
pub fn getKeys(diff: *const StorageDiff, allocator: std.mem.Allocator) ![][32]u8 {
    var keys = std.ArrayList([32]u8).init(allocator);
    errdefer keys.deinit();

    var it = diff.changes.keyIterator();
    while (it.next()) |key| {
        try keys.append(key.*);
    }

    return keys.toOwnedSlice();
}

/// Get number of changed slots
pub fn size(diff: *const StorageDiff) usize {
    return diff.changes.count();
}

// ============================================================================
// Mutations
// ============================================================================

/// Set change for a storage slot
pub fn setChange(diff: *StorageDiff, slot: [32]u8, old_value: ?[32]u8, new_value: ?[32]u8) !void {
    try diff.changes.put(slot, .{ .from = old_value, .to = new_value });
}

/// Remove change for a storage slot
pub fn removeChange(diff: *StorageDiff, slot: [32]u8) void {
    _ = diff.changes.remove(slot);
}

/// Clear all changes
pub fn clear(diff: *StorageDiff) void {
    diff.changes.clearAndFree();
}

// ============================================================================
// Predicates
// ============================================================================

/// Check if diff is empty (no changes)
pub fn isEmpty(diff: *const StorageDiff) bool {
    return diff.changes.count() == 0;
}

/// Check if slot has a change
pub fn hasSlot(diff: *const StorageDiff, slot: [32]u8) bool {
    return diff.changes.contains(slot);
}

/// Check if slot was created (from null to value)
pub fn isCreated(diff: *const StorageDiff, slot: [32]u8) bool {
    const change = diff.changes.get(slot) orelse return false;
    return change.from == null and change.to != null;
}

/// Check if slot was deleted (from value to null)
pub fn isDeleted(diff: *const StorageDiff, slot: [32]u8) bool {
    const change = diff.changes.get(slot) orelse return false;
    return change.from != null and change.to == null;
}

/// Check if slot was modified (both from and to are non-null)
pub fn isModified(diff: *const StorageDiff, slot: [32]u8) bool {
    const change = diff.changes.get(slot) orelse return false;
    return change.from != null and change.to != null;
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two StorageDiffs are equal (by address and changes)
pub fn equals(a: *const StorageDiff, b: *const StorageDiff) bool {
    // Check address
    if (!std.mem.eql(u8, &a.address.bytes, &b.address.bytes)) return false;

    // Check same number of changes
    if (a.changes.count() != b.changes.count()) return false;

    // Check all changes match
    var it = a.changes.iterator();
    while (it.next()) |entry| {
        const b_change = b.changes.get(entry.key_ptr.*) orelse return false;
        const a_change = entry.value_ptr.*;

        // Compare from values
        if (a_change.from) |a_from| {
            if (b_change.from) |b_from| {
                if (!std.mem.eql(u8, &a_from, &b_from)) return false;
            } else return false;
        } else if (b_change.from != null) return false;

        // Compare to values
        if (a_change.to) |a_to| {
            if (b_change.to) |b_to| {
                if (!std.mem.eql(u8, &a_to, &b_to)) return false;
            } else return false;
        } else if (b_change.to != null) return false;
    }

    return true;
}

// ============================================================================
// JSON Serialization
// ============================================================================

const json = std.json;
const Hex = @import("../Hex/Hex.zig");

/// Parse storage diff from JSON object (subset of prestateTracer format)
/// Format: { "storage": { slot: value, ... } }
pub fn fromJson(allocator: std.mem.Allocator, address: Address.Address, json_str: []const u8) !StorageDiff {
    const parsed = try json.parseFromSlice(json.Value, allocator, json_str, .{});
    defer parsed.deinit();

    var diff = init(allocator, address);
    errdefer diff.deinit();

    const obj = parsed.value.object;

    // Pre storage (from values)
    if (obj.get("pre")) |pre| {
        if (pre.object.get("storage")) |storage| {
            var storage_it = storage.object.iterator();
            while (storage_it.next()) |entry| {
                const slot_hex = entry.key_ptr.*;
                const from_val_hex = entry.value_ptr.string;

                var slot: [32]u8 = undefined;
                _ = try Hex.hexToBytes(&slot, slot_hex);

                var from_val: [32]u8 = undefined;
                _ = try Hex.hexToBytes(&from_val, from_val_hex);

                // Check for 'to' value in post
                var to_val: ?[32]u8 = null;
                if (obj.get("post")) |post| {
                    if (post.object.get("storage")) |post_storage| {
                        if (post_storage.object.get(slot_hex)) |pv| {
                            _ = try Hex.hexToBytes(&to_val.?, pv.string);
                        }
                    }
                }

                try setChange(&diff, slot, from_val, to_val);
            }
        }
    }

    // Post storage for new slots
    if (obj.get("post")) |post| {
        if (post.object.get("storage")) |storage| {
            var storage_it = storage.object.iterator();
            while (storage_it.next()) |entry| {
                const slot_hex = entry.key_ptr.*;

                // Skip if already processed from pre
                var slot: [32]u8 = undefined;
                _ = try Hex.hexToBytes(&slot, slot_hex);
                if (diff.changes.contains(slot)) continue;

                var to_val: [32]u8 = undefined;
                _ = try Hex.hexToBytes(&to_val, entry.value_ptr.string);

                try setChange(&diff, slot, null, to_val);
            }
        }
    }

    return diff;
}

/// Encode StorageDiff to JSON
pub fn toJson(diff: *const StorageDiff, allocator: std.mem.Allocator) ![]u8 {
    var buf = std.ArrayList(u8){};
    defer buf.deinit(allocator);

    try buf.appendSlice(allocator, "{\"address\":\"");
    const addr_hex = try Hex.bytesToHex(allocator, &diff.address.bytes);
    defer allocator.free(addr_hex);
    try buf.appendSlice(allocator, addr_hex);
    try buf.appendSlice(allocator, "\",\"pre\":{\"storage\":{");

    // Pre (from values)
    var first = true;
    var it = diff.changes.iterator();
    while (it.next()) |entry| {
        if (entry.value_ptr.from) |from_val| {
            if (!first) try buf.append(allocator, ',');
            first = false;

            try buf.append(allocator, '"');
            const slot_hex = try Hex.bytesToHex(allocator, entry.key_ptr);
            defer allocator.free(slot_hex);
            try buf.appendSlice(allocator, slot_hex);
            try buf.appendSlice(allocator, "\":\"");
            const val_hex = try Hex.bytesToHex(allocator, &from_val);
            defer allocator.free(val_hex);
            try buf.appendSlice(allocator, val_hex);
            try buf.append(allocator, '"');
        }
    }

    try buf.appendSlice(allocator, "}},\"post\":{\"storage\":{");

    // Post (to values)
    first = true;
    it = diff.changes.iterator();
    while (it.next()) |entry| {
        if (entry.value_ptr.to) |to_val| {
            if (!first) try buf.append(allocator, ',');
            first = false;

            try buf.append(allocator, '"');
            const slot_hex = try Hex.bytesToHex(allocator, entry.key_ptr);
            defer allocator.free(slot_hex);
            try buf.appendSlice(allocator, slot_hex);
            try buf.appendSlice(allocator, "\":\"");
            const val_hex = try Hex.bytesToHex(allocator, &to_val);
            defer allocator.free(val_hex);
            try buf.appendSlice(allocator, val_hex);
            try buf.append(allocator, '"');
        }
    }

    try buf.appendSlice(allocator, "}}}");

    return buf.toOwnedSlice(allocator);
}

// ============================================================================
// Tests
// ============================================================================

test "StorageDiff.init creates empty diff" {
    const address = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    var diff = init(std.testing.allocator, address);
    defer diff.deinit();

    try std.testing.expect(isEmpty(&diff));
    try std.testing.expectEqual(@as(usize, 0), size(&diff));
    try std.testing.expectEqualSlices(u8, &address.bytes, &getAddress(&diff).bytes);
}

test "StorageDiff.setChange adds change" {
    const address = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };
    var diff = init(std.testing.allocator, address);
    defer diff.deinit();

    const slot: [32]u8 = [_]u8{0x00} ** 32;
    const old_value: [32]u8 = [_]u8{0x11} ** 32;
    const new_value: [32]u8 = [_]u8{0x22} ** 32;

    try setChange(&diff, slot, old_value, new_value);

    try std.testing.expect(!isEmpty(&diff));
    try std.testing.expectEqual(@as(usize, 1), size(&diff));
    try std.testing.expect(hasSlot(&diff, slot));

    const change = getChange(&diff, slot);
    try std.testing.expect(change != null);
    try std.testing.expectEqualSlices(u8, &old_value, &change.?.from.?);
    try std.testing.expectEqualSlices(u8, &new_value, &change.?.to.?);
}

test "StorageDiff.getKeys returns all slots" {
    const address = Address.Address{ .bytes = [_]u8{0xcc} ** 20 };
    var diff = init(std.testing.allocator, address);
    defer diff.deinit();

    const slot1: [32]u8 = [_]u8{0x01} ** 32;
    const slot2: [32]u8 = [_]u8{0x02} ** 32;
    const value: [32]u8 = [_]u8{0xff} ** 32;

    try setChange(&diff, slot1, null, value);
    try setChange(&diff, slot2, null, value);

    const keys = try getKeys(&diff, std.testing.allocator);
    defer std.testing.allocator.free(keys);

    try std.testing.expectEqual(@as(usize, 2), keys.len);
}

test "StorageDiff.isCreated detects slot creation" {
    const address = Address.Address{ .bytes = [_]u8{0xdd} ** 20 };
    var diff = init(std.testing.allocator, address);
    defer diff.deinit();

    const slot: [32]u8 = [_]u8{0x00} ** 32;
    const value: [32]u8 = [_]u8{0xff} ** 32;

    try setChange(&diff, slot, null, value);

    try std.testing.expect(isCreated(&diff, slot));
    try std.testing.expect(!isDeleted(&diff, slot));
    try std.testing.expect(!isModified(&diff, slot));
}

test "StorageDiff.isDeleted detects slot deletion" {
    const address = Address.Address{ .bytes = [_]u8{0xee} ** 20 };
    var diff = init(std.testing.allocator, address);
    defer diff.deinit();

    const slot: [32]u8 = [_]u8{0x00} ** 32;
    const value: [32]u8 = [_]u8{0xff} ** 32;

    try setChange(&diff, slot, value, null);

    try std.testing.expect(!isCreated(&diff, slot));
    try std.testing.expect(isDeleted(&diff, slot));
    try std.testing.expect(!isModified(&diff, slot));
}

test "StorageDiff.isModified detects slot modification" {
    const address = Address.Address{ .bytes = [_]u8{0xff} ** 20 };
    var diff = init(std.testing.allocator, address);
    defer diff.deinit();

    const slot: [32]u8 = [_]u8{0x00} ** 32;
    const old_value: [32]u8 = [_]u8{0x11} ** 32;
    const new_value: [32]u8 = [_]u8{0x22} ** 32;

    try setChange(&diff, slot, old_value, new_value);

    try std.testing.expect(!isCreated(&diff, slot));
    try std.testing.expect(!isDeleted(&diff, slot));
    try std.testing.expect(isModified(&diff, slot));
}

test "StorageDiff.removeChange removes change" {
    const address = Address.Address{ .bytes = [_]u8{0x11} ** 20 };
    var diff = init(std.testing.allocator, address);
    defer diff.deinit();

    const slot: [32]u8 = [_]u8{0x00} ** 32;
    const value: [32]u8 = [_]u8{0xff} ** 32;

    try setChange(&diff, slot, null, value);
    try std.testing.expect(hasSlot(&diff, slot));

    removeChange(&diff, slot);
    try std.testing.expect(!hasSlot(&diff, slot));
}

test "StorageDiff.clear removes all changes" {
    const address = Address.Address{ .bytes = [_]u8{0x22} ** 20 };
    var diff = init(std.testing.allocator, address);
    defer diff.deinit();

    const slot1: [32]u8 = [_]u8{0x01} ** 32;
    const slot2: [32]u8 = [_]u8{0x02} ** 32;
    const value: [32]u8 = [_]u8{0xff} ** 32;

    try setChange(&diff, slot1, null, value);
    try setChange(&diff, slot2, null, value);
    try std.testing.expectEqual(@as(usize, 2), size(&diff));

    clear(&diff);
    try std.testing.expect(isEmpty(&diff));
}

test "StorageDiff.equals compares diffs" {
    const address = Address.Address{ .bytes = [_]u8{0x33} ** 20 };

    var diff1 = init(std.testing.allocator, address);
    defer diff1.deinit();

    var diff2 = init(std.testing.allocator, address);
    defer diff2.deinit();

    const slot: [32]u8 = [_]u8{0x00} ** 32;
    const value: [32]u8 = [_]u8{0xff} ** 32;

    try setChange(&diff1, slot, null, value);
    try setChange(&diff2, slot, null, value);

    try std.testing.expect(equals(&diff1, &diff2));

    // Different value
    var diff3 = init(std.testing.allocator, address);
    defer diff3.deinit();

    const other_value: [32]u8 = [_]u8{0xee} ** 32;
    try setChange(&diff3, slot, null, other_value);

    try std.testing.expect(!equals(&diff1, &diff3));
}

test "StorageDiff.equals different addresses" {
    const address1 = Address.Address{ .bytes = [_]u8{0x44} ** 20 };
    const address2 = Address.Address{ .bytes = [_]u8{0x55} ** 20 };

    var diff1 = init(std.testing.allocator, address1);
    defer diff1.deinit();

    var diff2 = init(std.testing.allocator, address2);
    defer diff2.deinit();

    try std.testing.expect(!equals(&diff1, &diff2));
}

test "StorageDiff.fromJson parses storage changes" {
    const json_input =
        \\{"pre":{"storage":{"0x0000000000000000000000000000000000000000000000000000000000000001":"0x0000000000000000000000000000000000000000000000000000000000000064"}},"post":{"storage":{"0x0000000000000000000000000000000000000000000000000000000000000001":"0x00000000000000000000000000000000000000000000000000000000000000c8"}}}
    ;

    const address = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    var diff = try fromJson(std.testing.allocator, address, json_input);
    defer diff.deinit();

    try std.testing.expect(!isEmpty(&diff));
    try std.testing.expectEqual(@as(usize, 1), size(&diff));

    var slot: [32]u8 = [_]u8{0} ** 32;
    slot[31] = 0x01;

    const change = getChange(&diff, slot);
    try std.testing.expect(change != null);

    // 0x64 = 100 (from), 0xc8 = 200 (to)
    var expected_from: [32]u8 = [_]u8{0} ** 32;
    expected_from[31] = 0x64;
    try std.testing.expectEqualSlices(u8, &expected_from, &change.?.from.?);

    var expected_to: [32]u8 = [_]u8{0} ** 32;
    expected_to[31] = 0xc8;
    try std.testing.expectEqualSlices(u8, &expected_to, &change.?.to.?);
}

test "StorageDiff.fromJson parses new slot" {
    const json_input =
        \\{"pre":{},"post":{"storage":{"0x0000000000000000000000000000000000000000000000000000000000000002":"0x00000000000000000000000000000000000000000000000000000000000003e8"}}}
    ;

    const address = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };
    var diff = try fromJson(std.testing.allocator, address, json_input);
    defer diff.deinit();

    var slot: [32]u8 = [_]u8{0} ** 32;
    slot[31] = 0x02;

    try std.testing.expect(isCreated(&diff, slot));

    const change = getChange(&diff, slot);
    try std.testing.expect(change != null);
    try std.testing.expect(change.?.from == null);

    // 0x3e8 = 1000
    var expected_to: [32]u8 = [_]u8{0} ** 32;
    expected_to[30] = 0x03;
    expected_to[31] = 0xe8;
    try std.testing.expectEqualSlices(u8, &expected_to, &change.?.to.?);
}

test "StorageDiff.toJson produces valid output" {
    const address = Address.Address{ .bytes = [_]u8{0xcc} ** 20 };
    var diff = init(std.testing.allocator, address);
    defer diff.deinit();

    var slot: [32]u8 = [_]u8{0} ** 32;
    slot[31] = 0x05;

    var old_val: [32]u8 = [_]u8{0} ** 32;
    old_val[31] = 0x0a; // 10

    var new_val: [32]u8 = [_]u8{0} ** 32;
    new_val[31] = 0x14; // 20

    try setChange(&diff, slot, old_val, new_val);

    const json_output = try toJson(&diff, std.testing.allocator);
    defer std.testing.allocator.free(json_output);

    // Verify structure
    try std.testing.expect(std.mem.indexOf(u8, json_output, "\"address\":\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json_output, "\"pre\":{\"storage\":{") != null);
    try std.testing.expect(std.mem.indexOf(u8, json_output, "\"post\":{\"storage\":{") != null);
}
