//! StateDiff - State Changes Across All Accounts
//!
//! Represents complete state changes from transaction execution.
//! Maps addresses to their account-level changes (balance, nonce, code, storage).
//! Used extensively by debug_traceTransaction with prestateTracer.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const StateDiff = primitives.StateDiff;
//!
//! // Create state diff
//! var diff = StateDiff.init(allocator);
//! defer diff.deinit();
//!
//! try diff.setBalanceChange(address, old_balance, new_balance);
//! ```

const std = @import("std");
const Address = @import("../Address/address.zig");
const Hash = @import("../Hash/Hash.zig");

/// Balance change (before/after)
pub const BalanceChange = struct {
    from: ?u256 = null,
    to: ?u256 = null,
};

/// Nonce change (before/after)
pub const NonceChange = struct {
    from: ?u64 = null,
    to: ?u64 = null,
};

/// Code change (before/after)
pub const CodeChange = struct {
    from: ?[]const u8 = null,
    to: ?[]const u8 = null,
};

/// Storage slot change (before/after)
pub const StorageChange = struct {
    from: ?[32]u8 = null,
    to: ?[32]u8 = null,
};

/// Account state changes during transaction execution
pub const AccountDiff = struct {
    balance: ?BalanceChange = null,
    nonce: ?NonceChange = null,
    code: ?CodeChange = null,
    storage: std.AutoHashMap([32]u8, StorageChange),

    pub fn init(allocator: std.mem.Allocator) AccountDiff {
        return .{
            .storage = std.AutoHashMap([32]u8, StorageChange).init(allocator),
        };
    }

    pub fn deinit(self: *AccountDiff) void {
        self.storage.deinit();
    }

    pub fn hasChanges(self: AccountDiff) bool {
        return self.balance != null or
            self.nonce != null or
            self.code != null or
            self.storage.count() > 0;
    }
};

/// StateDiff type - complete state changes across all accounts
pub const StateDiff = struct {
    accounts: std.AutoHashMap([20]u8, AccountDiff),
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) StateDiff {
        return .{
            .accounts = std.AutoHashMap([20]u8, AccountDiff).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *StateDiff) void {
        var it = self.accounts.valueIterator();
        while (it.next()) |account_diff| {
            account_diff.deinit();
        }
        self.accounts.deinit();
    }
};

// ============================================================================
// Constructors
// ============================================================================

/// Create empty StateDiff
pub fn init(allocator: std.mem.Allocator) StateDiff {
    return StateDiff.init(allocator);
}

// ============================================================================
// Accessors
// ============================================================================

/// Get account diff for an address
pub fn getAccount(diff: *StateDiff, address: Address.Address) ?*AccountDiff {
    return diff.accounts.getPtr(address.bytes);
}

/// Get all addresses with changes
pub fn getAddresses(diff: *StateDiff, allocator: std.mem.Allocator) ![]Address.Address {
    var addresses = std.ArrayList(Address.Address).init(allocator);
    errdefer addresses.deinit();

    var it = diff.accounts.keyIterator();
    while (it.next()) |key| {
        try addresses.append(Address.Address{ .bytes = key.* });
    }

    return addresses.toOwnedSlice();
}

/// Get number of accounts with changes
pub fn accountCount(diff: *StateDiff) usize {
    return diff.accounts.count();
}

// ============================================================================
// Mutations
// ============================================================================

/// Ensure account diff exists for address
fn ensureAccount(diff: *StateDiff, address: Address.Address) !*AccountDiff {
    const result = try diff.accounts.getOrPut(address.bytes);
    if (!result.found_existing) {
        result.value_ptr.* = AccountDiff.init(diff.allocator);
    }
    return result.value_ptr;
}

/// Set balance change for an address
pub fn setBalanceChange(diff: *StateDiff, address: Address.Address, from: ?u256, to: ?u256) !void {
    const account = try ensureAccount(diff, address);
    account.balance = .{ .from = from, .to = to };
}

/// Set nonce change for an address
pub fn setNonceChange(diff: *StateDiff, address: Address.Address, from: ?u64, to: ?u64) !void {
    const account = try ensureAccount(diff, address);
    account.nonce = .{ .from = from, .to = to };
}

/// Set code change for an address
pub fn setCodeChange(diff: *StateDiff, address: Address.Address, from: ?[]const u8, to: ?[]const u8) !void {
    const account = try ensureAccount(diff, address);
    account.code = .{ .from = from, .to = to };
}

/// Set storage change for an address
pub fn setStorageChange(diff: *StateDiff, address: Address.Address, slot: [32]u8, from: ?[32]u8, to: ?[32]u8) !void {
    const account = try ensureAccount(diff, address);
    try account.storage.put(slot, .{ .from = from, .to = to });
}

// ============================================================================
// Predicates
// ============================================================================

/// Check if diff is empty (no changes)
pub fn isEmpty(diff: *StateDiff) bool {
    return diff.accounts.count() == 0;
}

/// Check if address has changes
pub fn hasAccount(diff: *StateDiff, address: Address.Address) bool {
    return diff.accounts.contains(address.bytes);
}

/// Check if address has balance change
pub fn hasBalanceChange(diff: *StateDiff, address: Address.Address) bool {
    const account = getAccount(diff, address) orelse return false;
    return account.balance != null;
}

/// Check if address has nonce change
pub fn hasNonceChange(diff: *StateDiff, address: Address.Address) bool {
    const account = getAccount(diff, address) orelse return false;
    return account.nonce != null;
}

/// Check if address has code change
pub fn hasCodeChange(diff: *StateDiff, address: Address.Address) bool {
    const account = getAccount(diff, address) orelse return false;
    return account.code != null;
}

/// Check if address has storage changes
pub fn hasStorageChanges(diff: *StateDiff, address: Address.Address) bool {
    const account = getAccount(diff, address) orelse return false;
    return account.storage.count() > 0;
}

// ============================================================================
// JSON Serialization
// ============================================================================

const json = std.json;
const Hex = @import("../Hex/Hex.zig");

/// Parse prestateTracer diffMode output
/// Format: { "pre": { addr: {...} }, "post": { addr: {...} } }
pub fn fromPrestateJson(allocator: std.mem.Allocator, json_str: []const u8) !StateDiff {
    const parsed = try json.parseFromSlice(json.Value, allocator, json_str, .{});
    defer parsed.deinit();

    const obj = parsed.value.object;
    var diff = init(allocator);
    errdefer diff.deinit();

    const pre = obj.get("pre").?.object;
    const post = obj.get("post").?.object;

    // Process pre-state (before values)
    var pre_it = pre.iterator();
    while (pre_it.next()) |entry| {
        const addr_hex = entry.key_ptr.*;
        const account_obj = entry.value_ptr.object;

        var addr_bytes: [20]u8 = undefined;
        _ = try Hex.hexToBytes(&addr_bytes, addr_hex);
        const address = Address.Address{ .bytes = addr_bytes };

        // Balance
        if (account_obj.get("balance")) |bal| {
            const bal_hex = bal.string;
            const from_balance = try parseHexU256(bal_hex);
            const to_balance = if (post.get(addr_hex)) |p| blk: {
                if (p.object.get("balance")) |pb| {
                    break :blk try parseHexU256(pb.string);
                }
                break :blk from_balance; // unchanged
            } else null; // deleted
            try setBalanceChange(&diff, address, from_balance, to_balance);
        }

        // Nonce
        if (account_obj.get("nonce")) |n| {
            const from_nonce: u64 = @intCast(n.integer);
            const to_nonce: ?u64 = if (post.get(addr_hex)) |p| blk: {
                if (p.object.get("nonce")) |pn| {
                    break :blk @intCast(pn.integer);
                }
                break :blk from_nonce; // unchanged
            } else null; // deleted
            try setNonceChange(&diff, address, from_nonce, to_nonce);
        }

        // Code
        if (account_obj.get("code")) |c| {
            const from_code = try Hex.hexToBytes(allocator, c.string);
            const to_code: ?[]const u8 = if (post.get(addr_hex)) |p| blk: {
                if (p.object.get("code")) |pc| {
                    break :blk try Hex.hexToBytes(allocator, pc.string);
                }
                break :blk from_code; // unchanged
            } else null; // deleted
            try setCodeChange(&diff, address, from_code, to_code);
        }

        // Storage
        if (account_obj.get("storage")) |s| {
            var storage_it = s.object.iterator();
            while (storage_it.next()) |storage_entry| {
                const slot_hex = storage_entry.key_ptr.*;
                const from_val_hex = storage_entry.value_ptr.string;

                var slot: [32]u8 = undefined;
                _ = try Hex.hexToBytes(&slot, slot_hex);

                var from_val: [32]u8 = undefined;
                _ = try Hex.hexToBytes(&from_val, from_val_hex);

                var to_val: ?[32]u8 = null;
                if (post.get(addr_hex)) |p| {
                    if (p.object.get("storage")) |ps| {
                        if (ps.object.get(slot_hex)) |pv| {
                            _ = try Hex.hexToBytes(&to_val.?, pv.string);
                        }
                    }
                }

                try setStorageChange(&diff, address, slot, from_val, to_val);
            }
        }
    }

    // Process post-state for new accounts/slots (not in pre)
    var post_it = post.iterator();
    while (post_it.next()) |entry| {
        const addr_hex = entry.key_ptr.*;
        const account_obj = entry.value_ptr.object;

        // Skip if already processed in pre
        if (pre.contains(addr_hex)) {
            // Check for new storage slots
            if (account_obj.get("storage")) |s| {
                const pre_account = pre.get(addr_hex).?.object;
                const pre_storage = pre_account.get("storage");

                var storage_it = s.object.iterator();
                while (storage_it.next()) |storage_entry| {
                    const slot_hex = storage_entry.key_ptr.*;

                    // Skip if slot existed in pre
                    if (pre_storage) |ps| {
                        if (ps.object.contains(slot_hex)) continue;
                    }

                    var addr_bytes: [20]u8 = undefined;
                    _ = try Hex.hexToBytes(&addr_bytes, addr_hex);
                    const address = Address.Address{ .bytes = addr_bytes };

                    var slot: [32]u8 = undefined;
                    _ = try Hex.hexToBytes(&slot, slot_hex);

                    var to_val: [32]u8 = undefined;
                    _ = try Hex.hexToBytes(&to_val, storage_entry.value_ptr.string);

                    try setStorageChange(&diff, address, slot, null, to_val);
                }
            }
            continue;
        }

        // New account (not in pre)
        var addr_bytes: [20]u8 = undefined;
        _ = try Hex.hexToBytes(&addr_bytes, addr_hex);
        const address = Address.Address{ .bytes = addr_bytes };

        if (account_obj.get("balance")) |bal| {
            const to_balance = try parseHexU256(bal.string);
            try setBalanceChange(&diff, address, null, to_balance);
        }

        if (account_obj.get("nonce")) |n| {
            const to_nonce: u64 = @intCast(n.integer);
            try setNonceChange(&diff, address, null, to_nonce);
        }

        if (account_obj.get("code")) |c| {
            const to_code = try Hex.hexToBytes(allocator, c.string);
            try setCodeChange(&diff, address, null, to_code);
        }

        if (account_obj.get("storage")) |s| {
            var storage_it = s.object.iterator();
            while (storage_it.next()) |storage_entry| {
                const slot_hex = storage_entry.key_ptr.*;
                const to_val_hex = storage_entry.value_ptr.string;

                var slot: [32]u8 = undefined;
                _ = try Hex.hexToBytes(&slot, slot_hex);

                var to_val: [32]u8 = undefined;
                _ = try Hex.hexToBytes(&to_val, to_val_hex);

                try setStorageChange(&diff, address, slot, null, to_val);
            }
        }
    }

    return diff;
}

/// Parse hex string to u256
fn parseHexU256(hex: []const u8) !u256 {
    const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
    var result: u256 = 0;
    for (hex[start..]) |c| {
        const digit: u256 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return error.InvalidHexCharacter,
        };
        result = result * 16 + digit;
    }
    return result;
}

/// Encode StateDiff to prestateTracer diffMode JSON format
pub fn toJson(diff: *StateDiff, allocator: std.mem.Allocator) ![]u8 {
    var buf = std.ArrayList(u8){};
    defer buf.deinit(allocator);

    try buf.appendSlice(allocator, "{\"pre\":{");

    var first_addr = true;
    var it = diff.accounts.iterator();
    while (it.next()) |entry| {
        if (!first_addr) try buf.append(allocator, ',');
        first_addr = false;

        // Address key
        try buf.append(allocator, '"');
        const addr_hex = try Hex.bytesToHex(allocator, &entry.key_ptr.*);
        defer allocator.free(addr_hex);
        try buf.appendSlice(allocator, addr_hex);
        try buf.appendSlice(allocator, "\":{");

        const account = entry.value_ptr;
        var first_field = true;

        // Balance (from)
        if (account.balance) |bal| {
            if (bal.from) |from| {
                if (!first_field) try buf.append(allocator, ',');
                first_field = false;
                try buf.appendSlice(allocator, "\"balance\":\"");
                try appendU256Hex(&buf, allocator, from);
                try buf.append(allocator, '"');
            }
        }

        // Nonce (from)
        if (account.nonce) |n| {
            if (n.from) |from| {
                if (!first_field) try buf.append(allocator, ',');
                first_field = false;
                try buf.appendSlice(allocator, "\"nonce\":");
                var nonce_buf: [20]u8 = undefined;
                const nonce_str = try std.fmt.bufPrint(&nonce_buf, "{d}", .{from});
                try buf.appendSlice(allocator, nonce_str);
            }
        }

        // Code (from)
        if (account.code) |c| {
            if (c.from) |from| {
                if (!first_field) try buf.append(allocator, ',');
                first_field = false;
                try buf.appendSlice(allocator, "\"code\":\"");
                const code_hex = try Hex.bytesToHex(allocator, from);
                defer allocator.free(code_hex);
                try buf.appendSlice(allocator, code_hex);
                try buf.append(allocator, '"');
            }
        }

        // Storage (from values)
        if (account.storage.count() > 0) {
            if (!first_field) try buf.append(allocator, ',');
            try buf.appendSlice(allocator, "\"storage\":{");

            var first_slot = true;
            var storage_it = account.storage.iterator();
            while (storage_it.next()) |storage_entry| {
                if (storage_entry.value_ptr.from) |from| {
                    if (!first_slot) try buf.append(allocator, ',');
                    first_slot = false;

                    try buf.append(allocator, '"');
                    const slot_hex = try Hex.bytesToHex(allocator, storage_entry.key_ptr);
                    defer allocator.free(slot_hex);
                    try buf.appendSlice(allocator, slot_hex);
                    try buf.appendSlice(allocator, "\":\"");
                    const val_hex = try Hex.bytesToHex(allocator, &from);
                    defer allocator.free(val_hex);
                    try buf.appendSlice(allocator, val_hex);
                    try buf.append(allocator, '"');
                }
            }
            try buf.append(allocator, '}');
        }

        try buf.append(allocator, '}');
    }

    try buf.appendSlice(allocator, "},\"post\":{");

    // Post state (to values)
    first_addr = true;
    it = diff.accounts.iterator();
    while (it.next()) |entry| {
        const account = entry.value_ptr;

        // Check if any field has a 'to' value different from 'from'
        var has_changes = false;
        if (account.balance) |bal| {
            if (bal.to != null and (bal.from == null or bal.to.? != bal.from.?)) has_changes = true;
        }
        if (account.nonce) |n| {
            if (n.to != null and (n.from == null or n.to.? != n.from.?)) has_changes = true;
        }
        if (account.code) |c| {
            if (c.to != null) has_changes = true;
        }
        var storage_it = account.storage.iterator();
        while (storage_it.next()) |storage_entry| {
            if (storage_entry.value_ptr.to != null) has_changes = true;
        }

        if (!has_changes) continue;

        if (!first_addr) try buf.append(allocator, ',');
        first_addr = false;

        try buf.append(allocator, '"');
        const addr_hex = try Hex.bytesToHex(allocator, &entry.key_ptr.*);
        defer allocator.free(addr_hex);
        try buf.appendSlice(allocator, addr_hex);
        try buf.appendSlice(allocator, "\":{");

        var first_field = true;

        if (account.balance) |bal| {
            if (bal.to) |to| {
                if (bal.from == null or to != bal.from.?) {
                    if (!first_field) try buf.append(allocator, ',');
                    first_field = false;
                    try buf.appendSlice(allocator, "\"balance\":\"");
                    try appendU256Hex(&buf, allocator, to);
                    try buf.append(allocator, '"');
                }
            }
        }

        if (account.nonce) |n| {
            if (n.to) |to| {
                if (n.from == null or to != n.from.?) {
                    if (!first_field) try buf.append(allocator, ',');
                    first_field = false;
                    try buf.appendSlice(allocator, "\"nonce\":");
                    var nonce_buf: [20]u8 = undefined;
                    const nonce_str = try std.fmt.bufPrint(&nonce_buf, "{d}", .{to});
                    try buf.appendSlice(allocator, nonce_str);
                }
            }
        }

        if (account.code) |c| {
            if (c.to) |to| {
                if (!first_field) try buf.append(allocator, ',');
                first_field = false;
                try buf.appendSlice(allocator, "\"code\":\"");
                const code_hex = try Hex.bytesToHex(allocator, to);
                defer allocator.free(code_hex);
                try buf.appendSlice(allocator, code_hex);
                try buf.append(allocator, '"');
            }
        }

        if (account.storage.count() > 0) {
            var has_post_storage = false;
            var storage_it2 = account.storage.iterator();
            while (storage_it2.next()) |storage_entry| {
                if (storage_entry.value_ptr.to != null) {
                    has_post_storage = true;
                    break;
                }
            }

            if (has_post_storage) {
                if (!first_field) try buf.append(allocator, ',');
                try buf.appendSlice(allocator, "\"storage\":{");

                var first_slot = true;
                storage_it = account.storage.iterator();
                while (storage_it.next()) |storage_entry| {
                    if (storage_entry.value_ptr.to) |to| {
                        if (!first_slot) try buf.append(allocator, ',');
                        first_slot = false;

                        try buf.append(allocator, '"');
                        const slot_hex = try Hex.bytesToHex(allocator, storage_entry.key_ptr);
                        defer allocator.free(slot_hex);
                        try buf.appendSlice(allocator, slot_hex);
                        try buf.appendSlice(allocator, "\":\"");
                        const val_hex = try Hex.bytesToHex(allocator, &to);
                        defer allocator.free(val_hex);
                        try buf.appendSlice(allocator, val_hex);
                        try buf.append(allocator, '"');
                    }
                }
                try buf.append(allocator, '}');
            }
        }

        try buf.append(allocator, '}');
    }

    try buf.appendSlice(allocator, "}}");

    return buf.toOwnedSlice(allocator);
}

fn appendU256Hex(buf: *std.ArrayList(u8), allocator: std.mem.Allocator, value: u256) !void {
    try buf.appendSlice(allocator, "0x");
    if (value == 0) {
        try buf.append(allocator, '0');
        return;
    }

    var temp: [64]u8 = undefined;
    var len: usize = 0;
    var v = value;
    while (v > 0) : (len += 1) {
        const digit: u8 = @truncate(v & 0xf);
        temp[63 - len] = if (digit < 10) '0' + digit else 'a' + digit - 10;
        v >>= 4;
    }
    try buf.appendSlice(allocator, temp[64 - len ..]);
}

/// Check equality between two StateDiffs
pub fn equals(a: *StateDiff, b: *StateDiff) bool {
    if (a.accounts.count() != b.accounts.count()) return false;

    var it = a.accounts.iterator();
    while (it.next()) |entry| {
        const b_account = b.accounts.getPtr(entry.key_ptr.*) orelse return false;
        const a_account = entry.value_ptr;

        // Compare balance
        if (a_account.balance) |a_bal| {
            if (b_account.balance) |b_bal| {
                if (a_bal.from != b_bal.from or a_bal.to != b_bal.to) return false;
            } else return false;
        } else if (b_account.balance != null) return false;

        // Compare nonce
        if (a_account.nonce) |a_n| {
            if (b_account.nonce) |b_n| {
                if (a_n.from != b_n.from or a_n.to != b_n.to) return false;
            } else return false;
        } else if (b_account.nonce != null) return false;

        // Compare code
        if (a_account.code) |a_c| {
            if (b_account.code) |b_c| {
                const a_from = a_c.from;
                const b_from = b_c.from;
                if (a_from) |af| {
                    if (b_from) |bf| {
                        if (!std.mem.eql(u8, af, bf)) return false;
                    } else return false;
                } else if (b_from != null) return false;

                const a_to = a_c.to;
                const b_to = b_c.to;
                if (a_to) |at| {
                    if (b_to) |bt| {
                        if (!std.mem.eql(u8, at, bt)) return false;
                    } else return false;
                } else if (b_to != null) return false;
            } else return false;
        } else if (b_account.code != null) return false;

        // Compare storage
        if (a_account.storage.count() != b_account.storage.count()) return false;
    }

    return true;
}

// ============================================================================
// Tests
// ============================================================================

test "StateDiff.init creates empty diff" {
    var diff = init(std.testing.allocator);
    defer diff.deinit();

    try std.testing.expect(isEmpty(&diff));
    try std.testing.expectEqual(@as(usize, 0), accountCount(&diff));
}

test "StateDiff.setBalanceChange adds balance change" {
    var diff = init(std.testing.allocator);
    defer diff.deinit();

    const address = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    try setBalanceChange(&diff, address, 1000, 2000);

    try std.testing.expect(!isEmpty(&diff));
    try std.testing.expect(hasAccount(&diff, address));
    try std.testing.expect(hasBalanceChange(&diff, address));

    const account = getAccount(&diff, address);
    try std.testing.expect(account != null);
    try std.testing.expectEqual(@as(u256, 1000), account.?.balance.?.from.?);
    try std.testing.expectEqual(@as(u256, 2000), account.?.balance.?.to.?);
}

test "StateDiff.setNonceChange adds nonce change" {
    var diff = init(std.testing.allocator);
    defer diff.deinit();

    const address = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };
    try setNonceChange(&diff, address, 0, 1);

    try std.testing.expect(hasNonceChange(&diff, address));

    const account = getAccount(&diff, address);
    try std.testing.expect(account != null);
    try std.testing.expectEqual(@as(u64, 0), account.?.nonce.?.from.?);
    try std.testing.expectEqual(@as(u64, 1), account.?.nonce.?.to.?);
}

test "StateDiff.setCodeChange adds code change" {
    var diff = init(std.testing.allocator);
    defer diff.deinit();

    const address = Address.Address{ .bytes = [_]u8{0xcc} ** 20 };
    const new_code = [_]u8{ 0x60, 0x80, 0x60, 0x40 };
    try setCodeChange(&diff, address, null, &new_code);

    try std.testing.expect(hasCodeChange(&diff, address));

    const account = getAccount(&diff, address);
    try std.testing.expect(account != null);
    try std.testing.expect(account.?.code.?.from == null);
    try std.testing.expectEqualSlices(u8, &new_code, account.?.code.?.to.?);
}

test "StateDiff.setStorageChange adds storage change" {
    var diff = init(std.testing.allocator);
    defer diff.deinit();

    const address = Address.Address{ .bytes = [_]u8{0xdd} ** 20 };
    const slot: [32]u8 = [_]u8{0x00} ** 32;
    const value: [32]u8 = [_]u8{0xff} ** 32;
    try setStorageChange(&diff, address, slot, null, value);

    try std.testing.expect(hasStorageChanges(&diff, address));

    const account = getAccount(&diff, address);
    try std.testing.expect(account != null);
    const storage_change = account.?.storage.get(slot);
    try std.testing.expect(storage_change != null);
    try std.testing.expect(storage_change.?.from == null);
    try std.testing.expectEqualSlices(u8, &value, &storage_change.?.to.?);
}

test "StateDiff.getAddresses returns all addresses" {
    var diff = init(std.testing.allocator);
    defer diff.deinit();

    const address1 = Address.Address{ .bytes = [_]u8{0x11} ** 20 };
    const address2 = Address.Address{ .bytes = [_]u8{0x22} ** 20 };

    try setBalanceChange(&diff, address1, 100, 200);
    try setNonceChange(&diff, address2, 0, 1);

    const addresses = try getAddresses(&diff, std.testing.allocator);
    defer std.testing.allocator.free(addresses);

    try std.testing.expectEqual(@as(usize, 2), addresses.len);
}

test "StateDiff multiple changes for same account" {
    var diff = init(std.testing.allocator);
    defer diff.deinit();

    const address = Address.Address{ .bytes = [_]u8{0xee} ** 20 };

    try setBalanceChange(&diff, address, 1000, 2000);
    try setNonceChange(&diff, address, 0, 1);

    try std.testing.expectEqual(@as(usize, 1), accountCount(&diff));
    try std.testing.expect(hasBalanceChange(&diff, address));
    try std.testing.expect(hasNonceChange(&diff, address));
}

test "StateDiff.isEmpty" {
    var diff = init(std.testing.allocator);
    defer diff.deinit();

    try std.testing.expect(isEmpty(&diff));

    const address = Address.Address{ .bytes = [_]u8{0xff} ** 20 };
    try setBalanceChange(&diff, address, 100, 200);

    try std.testing.expect(!isEmpty(&diff));
}

test "AccountDiff.hasChanges" {
    var account = AccountDiff.init(std.testing.allocator);
    defer account.deinit();

    try std.testing.expect(!account.hasChanges());

    account.balance = .{ .from = 100, .to = 200 };
    try std.testing.expect(account.hasChanges());
}

test "StateDiff.fromPrestateJson parses nonce increment" {
    // Real prestateTracer diffMode output format
    const json_input =
        \\{"pre":{"0x35a9f94af726f07b5162df7e828cc9dc8439e7d0":{"balance":"0x7a48429e177130a","nonce":1134}},"post":{"0x35a9f94af726f07b5162df7e828cc9dc8439e7d0":{"nonce":1135}}}
    ;

    var diff = try fromPrestateJson(std.testing.allocator, json_input);
    defer diff.deinit();

    try std.testing.expect(!isEmpty(&diff));
    try std.testing.expectEqual(@as(usize, 1), accountCount(&diff));

    // Check the address was parsed correctly
    var expected_addr: [20]u8 = undefined;
    _ = try Hex.hexToBytes(&expected_addr, "0x35a9f94af726f07b5162df7e828cc9dc8439e7d0");
    const address = Address.Address{ .bytes = expected_addr };

    try std.testing.expect(hasAccount(&diff, address));
    try std.testing.expect(hasBalanceChange(&diff, address));
    try std.testing.expect(hasNonceChange(&diff, address));

    const account = getAccount(&diff, address);
    try std.testing.expect(account != null);

    // Nonce: 1134 -> 1135
    try std.testing.expectEqual(@as(u64, 1134), account.?.nonce.?.from.?);
    try std.testing.expectEqual(@as(u64, 1135), account.?.nonce.?.to.?);
}

test "StateDiff.fromPrestateJson parses storage changes" {
    const json_input =
        \\{"pre":{"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa":{"storage":{"0x0000000000000000000000000000000000000000000000000000000000000001":"0x0000000000000000000000000000000000000000000000000000000000000064"}}},"post":{"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa":{"storage":{"0x0000000000000000000000000000000000000000000000000000000000000001":"0x00000000000000000000000000000000000000000000000000000000000000c8"}}}}
    ;

    var diff = try fromPrestateJson(std.testing.allocator, json_input);
    defer diff.deinit();

    var addr_bytes: [20]u8 = undefined;
    _ = try Hex.hexToBytes(&addr_bytes, "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const address = Address.Address{ .bytes = addr_bytes };

    try std.testing.expect(hasStorageChanges(&diff, address));

    const account = getAccount(&diff, address);
    try std.testing.expect(account != null);

    var slot: [32]u8 = undefined;
    _ = try Hex.hexToBytes(&slot, "0x0000000000000000000000000000000000000000000000000000000000000001");

    const change = account.?.storage.get(slot);
    try std.testing.expect(change != null);

    // 0x64 = 100, 0xc8 = 200
    var expected_from: [32]u8 = [_]u8{0} ** 32;
    expected_from[31] = 0x64;
    try std.testing.expectEqualSlices(u8, &expected_from, &change.?.from.?);

    var expected_to: [32]u8 = [_]u8{0} ** 32;
    expected_to[31] = 0xc8;
    try std.testing.expectEqualSlices(u8, &expected_to, &change.?.to.?);
}

test "StateDiff.fromPrestateJson parses new account" {
    const json_input =
        \\{"pre":{},"post":{"0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb":{"balance":"0x1000","nonce":1}}}
    ;

    var diff = try fromPrestateJson(std.testing.allocator, json_input);
    defer diff.deinit();

    var addr_bytes: [20]u8 = undefined;
    _ = try Hex.hexToBytes(&addr_bytes, "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    const address = Address.Address{ .bytes = addr_bytes };

    try std.testing.expect(hasAccount(&diff, address));

    const account = getAccount(&diff, address);
    try std.testing.expect(account != null);

    // New account: from = null
    try std.testing.expect(account.?.balance.?.from == null);
    try std.testing.expectEqual(@as(u256, 0x1000), account.?.balance.?.to.?);

    try std.testing.expect(account.?.nonce.?.from == null);
    try std.testing.expectEqual(@as(u64, 1), account.?.nonce.?.to.?);
}

test "StateDiff.toJson roundtrip" {
    var diff = init(std.testing.allocator);
    defer diff.deinit();

    const address = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    try setBalanceChange(&diff, address, 1000, 2000);
    try setNonceChange(&diff, address, 5, 6);

    const json_output = try toJson(&diff, std.testing.allocator);
    defer std.testing.allocator.free(json_output);

    // Verify it contains expected structure
    try std.testing.expect(std.mem.indexOf(u8, json_output, "\"pre\":{") != null);
    try std.testing.expect(std.mem.indexOf(u8, json_output, "\"post\":{") != null);
}

test "StateDiff.equals compares diffs" {
    var diff1 = init(std.testing.allocator);
    defer diff1.deinit();

    var diff2 = init(std.testing.allocator);
    defer diff2.deinit();

    const address = Address.Address{ .bytes = [_]u8{0xcc} ** 20 };

    try setBalanceChange(&diff1, address, 100, 200);
    try setBalanceChange(&diff2, address, 100, 200);

    try std.testing.expect(equals(&diff1, &diff2));

    // Different value
    var diff3 = init(std.testing.allocator);
    defer diff3.deinit();
    try setBalanceChange(&diff3, address, 100, 300);

    try std.testing.expect(!equals(&diff1, &diff3));
}

test "parseHexU256 parses various formats" {
    try std.testing.expectEqual(@as(u256, 0), try parseHexU256("0x0"));
    try std.testing.expectEqual(@as(u256, 255), try parseHexU256("0xff"));
    try std.testing.expectEqual(@as(u256, 255), try parseHexU256("0xFF"));
    try std.testing.expectEqual(@as(u256, 4096), try parseHexU256("0x1000"));
    try std.testing.expectEqual(@as(u256, 0x7a48429e177130a), try parseHexU256("0x7a48429e177130a"));
}
