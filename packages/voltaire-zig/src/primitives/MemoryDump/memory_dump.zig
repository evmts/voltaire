//! MemoryDump - EVM memory state snapshot
//!
//! Represents the complete memory state at a point in EVM execution.
//! EVM memory is byte-addressable and grows dynamically in 32-byte words.

const std = @import("std");
const testing = std.testing;
const Allocator = std.mem.Allocator;
const Hex = @import("../Hex/Hex.zig");

/// EVM memory state snapshot
pub const MemoryDump = struct {
    /// Raw memory bytes
    data: []const u8,

    const Self = @This();

    /// Word size in bytes (EVM memory is organized in 32-byte words)
    pub const WORD_SIZE: usize = 32;

    /// Create MemoryDump from raw bytes
    pub fn from(data: []const u8) Self {
        return .{
            .data = data,
        };
    }

    /// Create empty MemoryDump
    pub fn empty() Self {
        return .{
            .data = &[_]u8{},
        };
    }

    /// Get total memory size in bytes
    pub fn length(self: Self) usize {
        return self.data.len;
    }

    /// Get memory size in words (32-byte units)
    pub fn wordCount(self: Self) usize {
        return (self.data.len + WORD_SIZE - 1) / WORD_SIZE;
    }

    /// Check if memory is empty
    pub fn isEmpty(self: Self) bool {
        return self.data.len == 0;
    }

    /// Check equality
    pub fn equals(self: Self, other: Self) bool {
        return std.mem.eql(u8, self.data, other.data);
    }

    /// Read a 32-byte word at offset
    /// Returns zero-padded word if offset + 32 exceeds memory
    pub fn readWord(self: Self, offset: usize) [32]u8 {
        var result: [32]u8 = undefined;
        @memset(&result, 0);

        if (offset >= self.data.len) {
            return result;
        }

        const available = @min(32, self.data.len - offset);
        @memcpy(result[0..available], self.data[offset .. offset + available]);

        return result;
    }

    /// Read a single byte at offset
    /// Returns 0 if offset exceeds memory
    pub fn readByte(self: Self, offset: usize) u8 {
        if (offset >= self.data.len) {
            return 0;
        }
        return self.data[offset];
    }

    /// Slice memory region
    /// Returns empty slice if out of bounds
    pub fn slice(self: Self, offset: usize, len: usize) []const u8 {
        if (offset >= self.data.len) {
            return &[_]u8{};
        }
        const end = @min(offset + len, self.data.len);
        return self.data[offset..end];
    }

    /// Get memory as 32-byte chunks (hex strings format like Geth)
    pub fn toChunks(self: Self, allocator: Allocator) ![]const [32]u8 {
        const count = self.wordCount();
        if (count == 0) {
            return &[_][32]u8{};
        }

        const chunks = try allocator.alloc([32]u8, count);
        errdefer allocator.free(chunks);

        for (0..count) |i| {
            chunks[i] = self.readWord(i * WORD_SIZE);
        }

        return chunks;
    }

    /// Encode to hex string
    pub fn toHex(self: Self, allocator: Allocator) ![]u8 {
        return Hex.bytesToHex(allocator, self.data);
    }

    /// Encode to JSON
    pub fn toJson(self: Self, allocator: Allocator) ![]u8 {
        var buf = std.ArrayList(u8){};
        defer buf.deinit(allocator);

        try buf.appendSlice(allocator, "{\"data\":\"");
        const hex = try Hex.bytesToHex(allocator, self.data);
        defer allocator.free(hex);
        try buf.appendSlice(allocator, hex);
        try buf.append(allocator, '"');

        try buf.appendSlice(allocator, ",\"length\":");
        var len_buf: [20]u8 = undefined;
        const len_str = try std.fmt.bufPrint(&len_buf, "{d}", .{self.data.len});
        try buf.appendSlice(allocator, len_str);

        try buf.append(allocator, '}');

        return buf.toOwnedSlice(allocator);
    }

    /// Create from hex string
    pub fn fromHex(allocator: Allocator, hex: []const u8) !Self {
        const data = try Hex.hexToBytes(allocator, hex);
        return .{ .data = data };
    }

    /// Parse from JSON (format: {"data":"0x...","length":N})
    pub fn fromJson(allocator: Allocator, json_str: []const u8) !Self {
        const json = std.json;
        const parsed = try json.parseFromSlice(json.Value, allocator, json_str, .{});
        defer parsed.deinit();

        const obj = parsed.value.object;
        const hex_data = obj.get("data").?.string;

        const data = try Hex.hexToBytes(allocator, hex_data);
        return .{ .data = data };
    }
};

// Tests
test "MemoryDump: basic creation" {
    const data = [_]u8{ 0x00, 0x01, 0x02, 0x03 };
    const dump = MemoryDump.from(&data);

    try testing.expectEqual(@as(usize, 4), dump.length());
    try testing.expectEqual(@as(usize, 1), dump.wordCount());
    try testing.expect(!dump.isEmpty());
}

test "MemoryDump: empty" {
    const dump = MemoryDump.empty();

    try testing.expectEqual(@as(usize, 0), dump.length());
    try testing.expectEqual(@as(usize, 0), dump.wordCount());
    try testing.expect(dump.isEmpty());
}

test "MemoryDump: wordCount" {
    const data1 = [_]u8{0} ** 32;
    try testing.expectEqual(@as(usize, 1), MemoryDump.from(&data1).wordCount());

    const data2 = [_]u8{0} ** 33;
    try testing.expectEqual(@as(usize, 2), MemoryDump.from(&data2).wordCount());

    const data3 = [_]u8{0} ** 64;
    try testing.expectEqual(@as(usize, 2), MemoryDump.from(&data3).wordCount());

    const data4 = [_]u8{0} ** 65;
    try testing.expectEqual(@as(usize, 3), MemoryDump.from(&data4).wordCount());
}

test "MemoryDump: equality" {
    const data1 = [_]u8{ 0x00, 0x01, 0x02, 0x03 };
    const data2 = [_]u8{ 0x00, 0x01, 0x02, 0x03 };
    const data3 = [_]u8{ 0x00, 0x01, 0x02, 0x04 };

    try testing.expect(MemoryDump.from(&data1).equals(MemoryDump.from(&data2)));
    try testing.expect(!MemoryDump.from(&data1).equals(MemoryDump.from(&data3)));
}

test "MemoryDump: readWord" {
    var data: [64]u8 = undefined;
    @memset(&data, 0);
    data[0] = 0xaa;
    data[31] = 0xbb;
    data[32] = 0xcc;
    data[63] = 0xdd;

    const dump = MemoryDump.from(&data);

    const word0 = dump.readWord(0);
    try testing.expectEqual(@as(u8, 0xaa), word0[0]);
    try testing.expectEqual(@as(u8, 0xbb), word0[31]);

    const word1 = dump.readWord(32);
    try testing.expectEqual(@as(u8, 0xcc), word1[0]);
    try testing.expectEqual(@as(u8, 0xdd), word1[31]);

    // Read beyond bounds returns zeros
    const word_oob = dump.readWord(64);
    try testing.expectEqual(@as(u8, 0), word_oob[0]);
    try testing.expectEqual(@as(u8, 0), word_oob[31]);
}

test "MemoryDump: readWord partial" {
    const data = [_]u8{ 0xaa, 0xbb, 0xcc };
    const dump = MemoryDump.from(&data);

    const word = dump.readWord(0);
    try testing.expectEqual(@as(u8, 0xaa), word[0]);
    try testing.expectEqual(@as(u8, 0xbb), word[1]);
    try testing.expectEqual(@as(u8, 0xcc), word[2]);
    try testing.expectEqual(@as(u8, 0), word[3]); // Zero-padded
}

test "MemoryDump: readByte" {
    const data = [_]u8{ 0xaa, 0xbb, 0xcc };
    const dump = MemoryDump.from(&data);

    try testing.expectEqual(@as(u8, 0xaa), dump.readByte(0));
    try testing.expectEqual(@as(u8, 0xbb), dump.readByte(1));
    try testing.expectEqual(@as(u8, 0xcc), dump.readByte(2));
    try testing.expectEqual(@as(u8, 0), dump.readByte(3)); // Out of bounds
    try testing.expectEqual(@as(u8, 0), dump.readByte(100)); // Way out of bounds
}

test "MemoryDump: slice" {
    const data = [_]u8{ 0x00, 0x01, 0x02, 0x03, 0x04 };
    const dump = MemoryDump.from(&data);

    const s1 = dump.slice(0, 3);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x00, 0x01, 0x02 }, s1);

    const s2 = dump.slice(2, 2);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x02, 0x03 }, s2);

    // Slice beyond bounds
    const s3 = dump.slice(3, 10);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x03, 0x04 }, s3);

    // Start beyond bounds
    const s4 = dump.slice(10, 5);
    try testing.expectEqual(@as(usize, 0), s4.len);
}

test "MemoryDump: toChunks" {
    const allocator = testing.allocator;

    var data: [65]u8 = undefined;
    @memset(&data, 0);
    data[0] = 0xaa;
    data[32] = 0xbb;
    data[64] = 0xcc;

    const dump = MemoryDump.from(&data);
    const chunks = try dump.toChunks(allocator);
    defer allocator.free(chunks);

    try testing.expectEqual(@as(usize, 3), chunks.len);
    try testing.expectEqual(@as(u8, 0xaa), chunks[0][0]);
    try testing.expectEqual(@as(u8, 0xbb), chunks[1][0]);
    try testing.expectEqual(@as(u8, 0xcc), chunks[2][0]);
}

test "MemoryDump: toHex" {
    const allocator = testing.allocator;
    const data = [_]u8{ 0xaa, 0xbb, 0xcc };
    const dump = MemoryDump.from(&data);

    const hex = try dump.toHex(allocator);
    defer allocator.free(hex);

    try testing.expectEqualStrings("0xaabbcc", hex);
}

test "MemoryDump: toJson" {
    const allocator = testing.allocator;
    const data = [_]u8{ 0x12, 0x34 };
    const dump = MemoryDump.from(&data);

    const json_str = try dump.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expect(std.mem.indexOf(u8, json_str, "\"data\":\"0x1234\"") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"length\":2") != null);
}

test "MemoryDump: fromHex" {
    const allocator = testing.allocator;

    const dump = try MemoryDump.fromHex(allocator, "0xaabbcc");
    defer allocator.free(@constCast(dump.data));

    try testing.expectEqual(@as(usize, 3), dump.length());
    try testing.expectEqual(@as(u8, 0xaa), dump.data[0]);
    try testing.expectEqual(@as(u8, 0xbb), dump.data[1]);
    try testing.expectEqual(@as(u8, 0xcc), dump.data[2]);
}

test "MemoryDump: WORD_SIZE constant" {
    try testing.expectEqual(@as(usize, 32), MemoryDump.WORD_SIZE);
}

test "MemoryDump: fromJson" {
    const allocator = testing.allocator;
    const json_input = "{\"data\":\"0xaabbcc\",\"length\":3}";

    const dump = try MemoryDump.fromJson(allocator, json_input);
    defer allocator.free(@constCast(dump.data));

    try testing.expectEqual(@as(usize, 3), dump.length());
    try testing.expectEqual(@as(u8, 0xaa), dump.data[0]);
    try testing.expectEqual(@as(u8, 0xbb), dump.data[1]);
    try testing.expectEqual(@as(u8, 0xcc), dump.data[2]);
}

test "MemoryDump: toJson/fromJson roundtrip" {
    const allocator = testing.allocator;
    const original_data = [_]u8{ 0xde, 0xad, 0xbe, 0xef };
    const original = MemoryDump.from(&original_data);

    const json_str = try original.toJson(allocator);
    defer allocator.free(json_str);

    const parsed = try MemoryDump.fromJson(allocator, json_str);
    defer allocator.free(@constCast(parsed.data));

    try testing.expect(original.equals(parsed));
}
