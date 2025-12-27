//! SourceMap - Solidity source map parsing
//!
//! Maps bytecode positions to source code locations.
//! Format: s:l:f:j:m (start:length:fileIndex:jump:modifierDepth)
//!
//! See: https://docs.soliditylang.org/en/latest/internals/source_mappings.html

const std = @import("std");
const testing = std.testing;
const Allocator = std.mem.Allocator;

/// Jump type for source map entries
pub const JumpType = enum {
    /// Jump into function
    into,
    /// Jump out of function
    out,
    /// Regular (no jump)
    regular,

    pub fn fromChar(c: u8) JumpType {
        return switch (c) {
            'i' => .into,
            'o' => .out,
            else => .regular,
        };
    }

    pub fn toChar(self: JumpType) u8 {
        return switch (self) {
            .into => 'i',
            .out => 'o',
            .regular => '-',
        };
    }
};

/// Single source map entry
pub const SourceMapEntry = struct {
    /// Byte offset in source code
    start: i32,
    /// Length in source code
    length: i32,
    /// Source file index
    file_index: i32,
    /// Jump type
    jump: JumpType,
    /// Modifier depth (optional, -1 if not present)
    modifier_depth: i32,

    const Self = @This();

    /// Create entry with defaults
    pub fn init() Self {
        return .{
            .start = 0,
            .length = 0,
            .file_index = 0,
            .jump = .regular,
            .modifier_depth = -1,
        };
    }

    /// Create entry from values
    pub fn from(start: i32, length: i32, file_index: i32, jump: JumpType, modifier_depth: i32) Self {
        return .{
            .start = start,
            .length = length,
            .file_index = file_index,
            .jump = jump,
            .modifier_depth = modifier_depth,
        };
    }

    /// Check equality
    pub fn equals(self: Self, other: Self) bool {
        return self.start == other.start and
            self.length == other.length and
            self.file_index == other.file_index and
            self.jump == other.jump and
            self.modifier_depth == other.modifier_depth;
    }

    /// Check if entry is in a specific file
    pub fn inFile(self: Self, file_idx: i32) bool {
        return self.file_index == file_idx;
    }

    /// Check if this is a jump into a function
    pub fn isJumpIn(self: Self) bool {
        return self.jump == .into;
    }

    /// Check if this is a jump out of a function
    pub fn isJumpOut(self: Self) bool {
        return self.jump == .out;
    }
};

/// Parsed source map
pub const SourceMap = struct {
    /// Raw source map string (not owned)
    raw: []const u8,
    /// Parsed entries
    entries: []SourceMapEntry,
    /// Allocator used for entries
    allocator: Allocator,

    const Self = @This();

    /// Parse source map from raw string
    pub fn from(allocator: Allocator, raw: []const u8) !Self {
        return parse(allocator, raw);
    }

    /// Parse source map string into entries
    pub fn parse(allocator: Allocator, raw: []const u8) !Self {
        var entries = std.ArrayList(SourceMapEntry){};
        defer entries.deinit(allocator);

        if (raw.len == 0) {
            return .{
                .raw = raw,
                .entries = try entries.toOwnedSlice(allocator),
                .allocator = allocator,
            };
        }

        // Previous values for compression
        var prev = SourceMapEntry.init();

        var parts_iter = std.mem.splitScalar(u8, raw, ';');

        while (parts_iter.next()) |part| {
            if (part.len == 0) {
                // Empty entry: inherit all from previous
                if (entries.items.len > 0) {
                    try entries.append(allocator, prev);
                }
                continue;
            }

            var entry = prev;
            var field_idx: usize = 0;
            var fields_iter = std.mem.splitScalar(u8, part, ':');

            while (fields_iter.next()) |field| : (field_idx += 1) {
                if (field.len == 0) continue; // Empty field inherits from previous

                switch (field_idx) {
                    0 => entry.start = try parseI32(field),
                    1 => entry.length = try parseI32(field),
                    2 => entry.file_index = try parseI32(field),
                    3 => entry.jump = JumpType.fromChar(field[0]),
                    4 => entry.modifier_depth = try parseI32(field),
                    else => {},
                }
            }

            try entries.append(allocator, entry);
            prev = entry;
        }

        return .{
            .raw = raw,
            .entries = try entries.toOwnedSlice(allocator),
            .allocator = allocator,
        };
    }

    /// Free allocated entries
    pub fn deinit(self: *Self) void {
        self.allocator.free(self.entries);
    }

    /// Get entry count
    pub fn len(self: Self) usize {
        return self.entries.len;
    }

    /// Check if empty
    pub fn isEmpty(self: Self) bool {
        return self.entries.len == 0;
    }

    /// Get entry at index
    pub fn getEntryAt(self: Self, index: usize) ?SourceMapEntry {
        if (index >= self.entries.len) return null;
        return self.entries[index];
    }

    /// Get entries for a specific file
    pub fn getEntriesForFile(self: Self, allocator: Allocator, file_idx: i32) ![]SourceMapEntry {
        var result = std.ArrayList(SourceMapEntry){};
        defer result.deinit(allocator);

        for (self.entries) |entry| {
            if (entry.file_index == file_idx) {
                try result.append(allocator, entry);
            }
        }

        return result.toOwnedSlice(allocator);
    }

    /// Encode back to string
    pub fn toString(self: Self, allocator: Allocator) ![]u8 {
        var buf = std.ArrayList(u8){};
        defer buf.deinit(allocator);

        // Use sentinel values so first entry always outputs all fields
        var prev = SourceMapEntry{
            .start = -999999,
            .length = -999999,
            .file_index = -999999,
            .jump = .regular,
            .modifier_depth = -999999,
        };
        var first_entry = true;

        for (self.entries, 0..) |entry, i| {
            if (i > 0) try buf.append(allocator, ';');

            // Only encode fields that differ from previous (compression)
            var num_buf: [16]u8 = undefined;

            if (first_entry or entry.start != prev.start) {
                const s = try std.fmt.bufPrint(&num_buf, "{d}", .{entry.start});
                try buf.appendSlice(allocator, s);
            }
            try buf.append(allocator, ':');

            if (first_entry or entry.length != prev.length) {
                const s = try std.fmt.bufPrint(&num_buf, "{d}", .{entry.length});
                try buf.appendSlice(allocator, s);
            }
            try buf.append(allocator, ':');

            if (first_entry or entry.file_index != prev.file_index) {
                const s = try std.fmt.bufPrint(&num_buf, "{d}", .{entry.file_index});
                try buf.appendSlice(allocator, s);
            }
            try buf.append(allocator, ':');

            if (first_entry or entry.jump != prev.jump) {
                try buf.append(allocator, entry.jump.toChar());
            }

            if (entry.modifier_depth >= 0 and (first_entry or entry.modifier_depth != prev.modifier_depth)) {
                try buf.append(allocator, ':');
                const s = try std.fmt.bufPrint(&num_buf, "{d}", .{entry.modifier_depth});
                try buf.appendSlice(allocator, s);
            }

            prev = entry;
            first_entry = false;
        }

        return buf.toOwnedSlice(allocator);
    }
};

fn parseI32(s: []const u8) !i32 {
    if (s.len == 0) return 0;

    var negative = false;
    var start: usize = 0;

    if (s[0] == '-') {
        negative = true;
        start = 1;
    }

    var result: i32 = 0;
    for (s[start..]) |c| {
        if (c < '0' or c > '9') return error.InvalidNumber;
        result = result * 10 + @as(i32, @intCast(c - '0'));
    }

    return if (negative) -result else result;
}

// Tests
test "SourceMapEntry: init" {
    const entry = SourceMapEntry.init();

    try testing.expectEqual(@as(i32, 0), entry.start);
    try testing.expectEqual(@as(i32, 0), entry.length);
    try testing.expectEqual(@as(i32, 0), entry.file_index);
    try testing.expectEqual(JumpType.regular, entry.jump);
    try testing.expectEqual(@as(i32, -1), entry.modifier_depth);
}

test "SourceMapEntry: from" {
    const entry = SourceMapEntry.from(100, 50, 1, .into, 2);

    try testing.expectEqual(@as(i32, 100), entry.start);
    try testing.expectEqual(@as(i32, 50), entry.length);
    try testing.expectEqual(@as(i32, 1), entry.file_index);
    try testing.expectEqual(JumpType.into, entry.jump);
    try testing.expectEqual(@as(i32, 2), entry.modifier_depth);
}

test "SourceMapEntry: equality" {
    const entry1 = SourceMapEntry.from(100, 50, 1, .into, 2);
    const entry2 = SourceMapEntry.from(100, 50, 1, .into, 2);
    const entry3 = SourceMapEntry.from(100, 50, 1, .out, 2);

    try testing.expect(entry1.equals(entry2));
    try testing.expect(!entry1.equals(entry3));
}

test "SourceMapEntry: jump checks" {
    const into = SourceMapEntry.from(0, 0, 0, .into, -1);
    try testing.expect(into.isJumpIn());
    try testing.expect(!into.isJumpOut());

    const out = SourceMapEntry.from(0, 0, 0, .out, -1);
    try testing.expect(!out.isJumpIn());
    try testing.expect(out.isJumpOut());
}

test "JumpType: char conversion" {
    try testing.expectEqual(JumpType.into, JumpType.fromChar('i'));
    try testing.expectEqual(JumpType.out, JumpType.fromChar('o'));
    try testing.expectEqual(JumpType.regular, JumpType.fromChar('-'));
    try testing.expectEqual(JumpType.regular, JumpType.fromChar('x'));

    try testing.expectEqual(@as(u8, 'i'), JumpType.into.toChar());
    try testing.expectEqual(@as(u8, 'o'), JumpType.out.toChar());
    try testing.expectEqual(@as(u8, '-'), JumpType.regular.toChar());
}

test "SourceMap: parse empty" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "");
    defer map.deinit();

    try testing.expect(map.isEmpty());
    try testing.expectEqual(@as(usize, 0), map.len());
}

test "SourceMap: parse simple" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:50:0:-");
    defer map.deinit();

    try testing.expectEqual(@as(usize, 1), map.len());

    const entry = map.getEntryAt(0).?;
    try testing.expectEqual(@as(i32, 0), entry.start);
    try testing.expectEqual(@as(i32, 50), entry.length);
    try testing.expectEqual(@as(i32, 0), entry.file_index);
    try testing.expectEqual(JumpType.regular, entry.jump);
}

test "SourceMap: parse multiple" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:50:0:-;51:100:0:-;151:25:0:o");
    defer map.deinit();

    try testing.expectEqual(@as(usize, 3), map.len());

    try testing.expectEqual(@as(i32, 0), map.getEntryAt(0).?.start);
    try testing.expectEqual(@as(i32, 51), map.getEntryAt(1).?.start);
    try testing.expectEqual(@as(i32, 151), map.getEntryAt(2).?.start);
    try testing.expectEqual(JumpType.out, map.getEntryAt(2).?.jump);
}

test "SourceMap: parse with compression" {
    const allocator = testing.allocator;
    // Second entry inherits length and file_index
    var map = try SourceMap.from(allocator, "0:50:0:-;100:::-");
    defer map.deinit();

    try testing.expectEqual(@as(usize, 2), map.len());

    const e0 = map.getEntryAt(0).?;
    try testing.expectEqual(@as(i32, 0), e0.start);
    try testing.expectEqual(@as(i32, 50), e0.length);

    const e1 = map.getEntryAt(1).?;
    try testing.expectEqual(@as(i32, 100), e1.start);
    try testing.expectEqual(@as(i32, 50), e1.length); // Inherited
    try testing.expectEqual(@as(i32, 0), e1.file_index); // Inherited
}

test "SourceMap: parse with modifier depth" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:50:0:-:2");
    defer map.deinit();

    const entry = map.getEntryAt(0).?;
    try testing.expectEqual(@as(i32, 2), entry.modifier_depth);
}

test "SourceMap: parse with jump types" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:10:0:i;10:20:0:o;30:40:0:-");
    defer map.deinit();

    try testing.expectEqual(JumpType.into, map.getEntryAt(0).?.jump);
    try testing.expectEqual(JumpType.out, map.getEntryAt(1).?.jump);
    try testing.expectEqual(JumpType.regular, map.getEntryAt(2).?.jump);
}

test "SourceMap: getEntryAt out of bounds" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:50:0:-");
    defer map.deinit();

    try testing.expect(map.getEntryAt(0) != null);
    try testing.expect(map.getEntryAt(1) == null);
    try testing.expect(map.getEntryAt(100) == null);
}

test "SourceMap: getEntriesForFile" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:10:0:-;10:20:1:-;20:30:0:-;30:40:2:-");
    defer map.deinit();

    const file0_entries = try map.getEntriesForFile(allocator, 0);
    defer allocator.free(file0_entries);

    try testing.expectEqual(@as(usize, 2), file0_entries.len);
    try testing.expectEqual(@as(i32, 0), file0_entries[0].start);
    try testing.expectEqual(@as(i32, 20), file0_entries[1].start);
}

test "SourceMap: toString basic" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:50:0:-");
    defer map.deinit();

    const str = try map.toString(allocator);
    defer allocator.free(str);

    try testing.expectEqualStrings("0:50:0:-", str);
}

test "SourceMap: multiple files" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:10:0:-;0:20:1:-;0:30:2:-");
    defer map.deinit();

    try testing.expectEqual(@as(i32, 0), map.getEntryAt(0).?.file_index);
    try testing.expectEqual(@as(i32, 1), map.getEntryAt(1).?.file_index);
    try testing.expectEqual(@as(i32, 2), map.getEntryAt(2).?.file_index);
}

test "SourceMap: real solc output - simple contract" {
    // Real source map from a simple "contract A { function foo() public {} }"
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "26:74:0:-:0;;;;;;;;;;;;;;;;;;;");
    defer map.deinit();

    try testing.expect(map.len() > 0);
    const first = map.getEntryAt(0).?;
    try testing.expectEqual(@as(i32, 26), first.start);
    try testing.expectEqual(@as(i32, 74), first.length);
    try testing.expectEqual(@as(i32, 0), first.file_index);
    try testing.expectEqual(JumpType.regular, first.jump);
    try testing.expectEqual(@as(i32, 0), first.modifier_depth);
}

test "SourceMap: negative file index (-1 for generated code)" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:0:-1:-");
    defer map.deinit();

    try testing.expectEqual(@as(usize, 1), map.len());
    const entry = map.getEntryAt(0).?;
    try testing.expectEqual(@as(i32, -1), entry.file_index);
}

test "SourceMap: toString with compression" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:50:0:-;100:::;200:::");
    defer map.deinit();

    try testing.expectEqual(@as(usize, 3), map.len());

    // Second entry inherits length, file_index, jump
    const e1 = map.getEntryAt(1).?;
    try testing.expectEqual(@as(i32, 100), e1.start);
    try testing.expectEqual(@as(i32, 50), e1.length); // inherited
    try testing.expectEqual(@as(i32, 0), e1.file_index); // inherited

    // Third entry also inherits
    const e2 = map.getEntryAt(2).?;
    try testing.expectEqual(@as(i32, 200), e2.start);
    try testing.expectEqual(@as(i32, 50), e2.length); // inherited

    // Round-trip test
    const str = try map.toString(allocator);
    defer allocator.free(str);

    // Should compress back (may not be exact same string due to compression rules)
    var map2 = try SourceMap.from(allocator, str);
    defer map2.deinit();

    try testing.expectEqual(map.len(), map2.len());
    for (map.entries, map2.entries) |a, b| {
        try testing.expect(a.equals(b));
    }
}

test "SourceMap: toString with multiple entries" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:10:0:i;10:20:0:o;20:30:0:-");
    defer map.deinit();

    const str = try map.toString(allocator);
    defer allocator.free(str);

    // Re-parse and verify
    var map2 = try SourceMap.from(allocator, str);
    defer map2.deinit();

    try testing.expectEqual(@as(usize, 3), map2.len());

    try testing.expectEqual(JumpType.into, map2.getEntryAt(0).?.jump);
    try testing.expectEqual(JumpType.out, map2.getEntryAt(1).?.jump);
    try testing.expectEqual(JumpType.regular, map2.getEntryAt(2).?.jump);
}

test "SourceMap: complex real-world example" {
    // More complex source map with multiple files and jump types
    const allocator = testing.allocator;
    const raw = "26:74:0:-:0;;;;;98:39:1;117:11;;129:8;146:23;167:7:2:i;176:15;193:12:0:o";
    var map = try SourceMap.from(allocator, raw);
    defer map.deinit();

    // Verify we got all entries (9 non-empty + some empty)
    try testing.expect(map.len() >= 9);

    // Check specific entries
    const entry0 = map.getEntryAt(0).?;
    try testing.expectEqual(@as(i32, 26), entry0.start);
    try testing.expectEqual(@as(i32, 0), entry0.file_index);

    // Find jump into (file 2)
    var found_jump_in = false;
    for (map.entries) |e| {
        if (e.jump == .into and e.file_index == 2) {
            found_jump_in = true;
            try testing.expectEqual(@as(i32, 167), e.start);
            break;
        }
    }
    try testing.expect(found_jump_in);

    // Find jump out (back to file 0)
    var found_jump_out = false;
    for (map.entries) |e| {
        if (e.jump == .out and e.file_index == 0) {
            found_jump_out = true;
            try testing.expectEqual(@as(i32, 193), e.start);
            break;
        }
    }
    try testing.expect(found_jump_out);
}

test "SourceMap: find instruction by source location" {
    const allocator = testing.allocator;
    var map = try SourceMap.from(allocator, "0:10:0:-;10:20:0:-;30:15:0:-");
    defer map.deinit();

    // Find all instructions that map to source offset 10 (second entry)
    var found_at_10 = false;
    for (map.entries, 0..) |entry, idx| {
        if (entry.start == 10) {
            try testing.expectEqual(@as(usize, 1), idx);
            found_at_10 = true;
        }
    }
    try testing.expect(found_at_10);
}

test "SourceMap: getSourceLocation (by PC)" {
    const allocator = testing.allocator;
    // Each entry corresponds to one instruction (PC = index)
    var map = try SourceMap.from(allocator, "100:50:0:-;150:30:0:-;180:20:1:i");
    defer map.deinit();

    // PC 0 -> first instruction, source offset 100
    const loc0 = map.getEntryAt(0).?;
    try testing.expectEqual(@as(i32, 100), loc0.start);
    try testing.expectEqual(@as(i32, 50), loc0.length);

    // PC 1 -> second instruction, source offset 150
    const loc1 = map.getEntryAt(1).?;
    try testing.expectEqual(@as(i32, 150), loc1.start);

    // PC 2 -> third instruction, different file
    const loc2 = map.getEntryAt(2).?;
    try testing.expectEqual(@as(i32, 180), loc2.start);
    try testing.expectEqual(@as(i32, 1), loc2.file_index);
    try testing.expect(loc2.isJumpIn());

    // PC out of bounds
    try testing.expect(map.getEntryAt(3) == null);
}
