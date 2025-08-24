const std = @import("std");
const builtin = @import("builtin");
pub const MemoryConfig = @import("memory_config.zig").MemoryConfig;

pub const MemoryError = error{
    OutOfMemory,
    MemoryOverflow,
    OutOfBounds,
};

// Factory function to create Memory type
pub fn createMemory(comptime config: MemoryConfig) type {
    config.validate();
    
    const Memory = struct {
        const Self = @This();
        
        pub const INITIAL_CAPACITY = config.initial_capacity;
        pub const MEMORY_LIMIT = config.memory_limit;
        
        checkpoint: usize,
        buffer_ptr: *std.ArrayList(u8),
        allocator: std.mem.Allocator,
        owns_buffer: bool,
        cached_expansion: struct {
            last_size: u64,
            last_words: u64,
            last_cost: u64,
        } = .{ .last_size = 0, .last_words = 0, .last_cost = 0 },
        
        pub fn init(allocator: std.mem.Allocator) !Self {
            const buffer_ptr = try allocator.create(std.ArrayList(u8));
            errdefer allocator.destroy(buffer_ptr);
            buffer_ptr.* = std.ArrayList(u8).init(allocator);
            errdefer buffer_ptr.deinit();
            try buffer_ptr.ensureTotalCapacity(INITIAL_CAPACITY);
            return Self{
                .checkpoint = 0,
                .buffer_ptr = buffer_ptr,
                .allocator = allocator,
                .owns_buffer = true,
            };
        }
        
        pub fn init_borrowed(allocator: std.mem.Allocator, buffer_ptr: *std.ArrayList(u8), checkpoint: usize) !Self {
            return Self{
                .checkpoint = checkpoint,
                .buffer_ptr = buffer_ptr,
                .allocator = allocator,
                .owns_buffer = false,
            };
        }
        
        pub fn deinit(self: *Self) void {
            if (self.owns_buffer) {
                self.buffer_ptr.deinit();
                self.allocator.destroy(self.buffer_ptr);
            }
        }
        
        pub fn init_child(self: *Self) !Self {
            return try Self.init_borrowed(self.allocator, self.buffer_ptr, self.buffer_ptr.items.len);
        }
        
        pub fn size(self: *const Self) usize {
            const total = self.buffer_ptr.items.len;
            if (total <= self.checkpoint) return 0;
            return total - self.checkpoint;
        }
        
        pub fn ensure_capacity(self: *Self, new_size: usize) !void {
            const required_total = self.checkpoint + new_size;
            if (required_total > MEMORY_LIMIT) return MemoryError.MemoryOverflow;
            if (required_total > self.buffer_ptr.items.len) {
                const old_len = self.buffer_ptr.items.len;
                try self.buffer_ptr.resize(required_total);
                @memset(self.buffer_ptr.items[old_len..], 0);
            }
        }
        
        // EVM-compliant memory operations that expand to word boundaries
        pub fn set_data_evm(self: *Self, offset: usize, data: []const u8) !void {
            const end = offset + data.len;
            // Round up to next 32-byte word boundary for EVM compliance
            const word_aligned_end = ((end + 31) / 32) * 32;
            try self.ensure_capacity(word_aligned_end);
            const start_idx = self.checkpoint + offset;
            @memcpy(self.buffer_ptr.items[start_idx..start_idx + data.len], data);
        }
        
        pub fn set_byte_evm(self: *Self, offset: usize, value: u8) !void {
            const bytes = [_]u8{value};
            try self.set_data_evm(offset, &bytes);
        }
        
        pub fn set_u256_evm(self: *Self, offset: usize, value: u256) !void {
            var bytes: [32]u8 = undefined;
            var temp = value;
            var i: usize = 32;
            while (i > 0) {
                i -= 1;
                bytes[i] = @truncate(temp);
                temp >>= 8;
            }
            try self.set_data_evm(offset, &bytes);
        }
        
        pub fn get_slice(self: *const Self, offset: usize, len: usize) MemoryError![]const u8 {
            const end = offset + len;
            if (end > self.size()) return MemoryError.OutOfBounds;
            const start_idx = self.checkpoint + offset;
            return self.buffer_ptr.items[start_idx..start_idx + len];
        }
        
        pub fn set_data(self: *Self, offset: usize, data: []const u8) !void {
            const end = offset + data.len;
            try self.ensure_capacity(end);
            const start_idx = self.checkpoint + offset;
            @memcpy(self.buffer_ptr.items[start_idx..start_idx + data.len], data);
        }
        
        pub fn clear(self: *Self) void {
            if (self.owns_buffer) {
                self.buffer_ptr.items.len = 0;
                self.checkpoint = 0;
            } else {
                self.checkpoint = self.buffer_ptr.items.len;
            }
            self.cached_expansion = .{ .last_size = 0, .last_words = 0, .last_cost = 0 };
        }
        
        pub fn get_u256(self: *const Self, offset: usize) !u256 {
            const slice = try self.get_slice(offset, 32);
            var result: u256 = 0;
            for (slice) |byte| result = (result << 8) | byte;
            return result;
        }
        
        // EVM-compliant read that expands memory if needed
        pub fn get_u256_evm(self: *Self, offset: usize) !u256 {
            const word_aligned_end = ((offset + 32 + 31) / 32) * 32;
            try self.ensure_capacity(word_aligned_end);
            const slice = try self.get_slice(offset, 32);
            var result: u256 = 0;
            for (slice) |byte| result = (result << 8) | byte;
            return result;
        }
        
        pub fn set_u256(self: *Self, offset: usize, value: u256) !void {
            var bytes: [32]u8 = undefined;
            var temp = value;
            var i: usize = 32;
            while (i > 0) {
                i -= 1;
                bytes[i] = @truncate(temp);
                temp >>= 8;
            }
            try self.set_data(offset, &bytes);
        }
        
        pub fn get_byte(self: *const Self, offset: usize) !u8 {
            const slice = try self.get_slice(offset, 1);
            return slice[0];
        }
        
        pub fn set_byte(self: *Self, offset: usize, value: u8) !void {
            const bytes = [_]u8{value};
            try self.set_data(offset, &bytes);
        }
        
        fn calculate_memory_cost(words: u64) u64 {
            return 3 * words + (words * words) / 512;
        }
        pub fn get_expansion_cost(self: *Self, new_size: u64) u64 {
            const current_size = @as(u64, @intCast(self.size()));
            if (new_size <= current_size) return 0;
            const new_words = (new_size + 31) / 32;
            const current_words = (current_size + 31) / 32;
            if (new_size <= self.cached_expansion.last_size) return 0;
            const new_cost = calculate_memory_cost(new_words);
            const current_cost = calculate_memory_cost(current_words);
            const expansion_cost = new_cost - current_cost;
            self.cached_expansion.last_size = new_size;
            self.cached_expansion.last_words = new_words;
            self.cached_expansion.last_cost = new_cost;
            return expansion_cost;
        }
        
        pub fn get_buffer_ref(self: *Self) *std.ArrayList(u8) {
            return self.buffer_ptr;
        }
    };
    return Memory;
}

test "Memory owner basic operations" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var memory = try Memory.init(allocator);
    defer memory.deinit();
    try std.testing.expectEqual(@as(usize, 0), memory.size());
    const data = [_]u8{0x01, 0x02, 0x03, 0x04};
    try memory.set_data(0, &data);
    try std.testing.expectEqual(@as(usize, 4), memory.size());
    const slice = try memory.get_slice(0, 4);
    try std.testing.expectEqualSlices(u8, &data, slice);
    memory.clear();
    try std.testing.expectEqual(@as(usize, 0), memory.size());
}

test "Memory borrowed operations" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var owner = try Memory.init(allocator);
    defer owner.deinit();
    const data1 = [_]u8{0xAA, 0xBB, 0xCC};
    try owner.set_data(0, &data1);
    var borrowed = try Memory.init_borrowed(allocator, owner.buffer_ptr, owner.buffer_ptr.items.len);
    defer borrowed.deinit();
    try std.testing.expectEqual(@as(usize, 0), borrowed.size());
    const data2 = [_]u8{0xDD, 0xEE, 0xFF};
    try borrowed.set_data(0, &data2);
    try std.testing.expectEqual(@as(usize, 3), borrowed.size());
    try std.testing.expectEqual(@as(usize, 6), owner.buffer_ptr.items.len);
    try std.testing.expectEqualSlices(u8, &data1, owner.buffer_ptr.items[0..3]);
    try std.testing.expectEqualSlices(u8, &data2, owner.buffer_ptr.items[3..6]);
}

test "Memory capacity limits" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{ .initial_capacity = 50, .memory_limit = 100 });
    var memory = try Memory.init(allocator);
    defer memory.deinit();
    try memory.ensure_capacity(50);
    try std.testing.expectEqual(@as(usize, 50), memory.buffer_ptr.items.len);
    try memory.ensure_capacity(100);
    try std.testing.expectEqual(@as(usize, 100), memory.buffer_ptr.items.len);
    try std.testing.expectError(MemoryError.MemoryOverflow, memory.ensure_capacity(101));
}

test "Memory child creation" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var parent = try Memory.init(allocator);
    defer parent.deinit();
    const data1 = [_]u8{0x11, 0x22, 0x33};
    try parent.set_data(0, &data1);
    try std.testing.expectEqual(@as(usize, 3), parent.size());
    var child = try parent.init_child();
    defer child.deinit();
    try std.testing.expectEqual(@as(usize, 0), child.size());
    const data2 = [_]u8{0x44, 0x55};
    try child.set_data(0, &data2);
    try std.testing.expectEqual(@as(usize, 0), parent.checkpoint);
    try std.testing.expectEqual(@as(usize, 3), child.checkpoint);
    try std.testing.expectEqual(@as(usize, 5), parent.buffer_ptr.items.len);
    try std.testing.expectEqual(@as(usize, 5), parent.size());
    try std.testing.expectEqual(@as(usize, 2), child.size());
    try std.testing.expectEqual(@as(usize, 5), parent.buffer_ptr.items.len);
}

test "Memory zero initialization on expansion" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var memory = try Memory.init(allocator);
    defer memory.deinit();
    try memory.ensure_capacity(10);
    const slice = try memory.get_slice(0, 10);
    for (slice) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }
}

test "Memory out of bounds access" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var memory = try Memory.init(allocator);
    defer memory.deinit();
    const data = [_]u8{0x01, 0x02, 0x03};
    try memory.set_data(0, &data);
    _ = try memory.get_slice(0, 3);
    try std.testing.expectError(MemoryError.OutOfBounds, memory.get_slice(0, 4));
    try std.testing.expectError(MemoryError.OutOfBounds, memory.get_slice(2, 2));
}

test "Memory configuration validation" {
    _ = createMemory(.{});
    _ = createMemory(.{ .initial_capacity = 1024, .memory_limit = 2048 });
}

test "Memory u256 operations" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var memory = try Memory.init(allocator);
    defer memory.deinit();
    const value1: u256 = 0x123456789ABCDEF0;
    try memory.set_u256(0, value1);
    const read1 = try memory.get_u256(0);
    try std.testing.expectEqual(value1, read1);
    const max_value = std.math.maxInt(u256);
    try memory.set_u256(32, max_value);
    const read2 = try memory.get_u256(32);
    try std.testing.expectEqual(max_value, read2);
    try memory.set_u256(64, 0);
    const read3 = try memory.get_u256(64);
    try std.testing.expectEqual(@as(u256, 0), read3);
}

test "Memory byte operations" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var memory = try Memory.init(allocator);
    defer memory.deinit();
    try memory.set_byte(0, 0xFF);
    const byte1 = try memory.get_byte(0);
    try std.testing.expectEqual(@as(u8, 0xFF), byte1);
    try memory.set_byte(10, 0x42);
    const byte2 = try memory.get_byte(10);
    try std.testing.expectEqual(@as(u8, 0x42), byte2);
    const byte3 = try memory.get_byte(5);
    try std.testing.expectEqual(@as(u8, 0), byte3);
}

test "Memory gas expansion cost" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var memory = try Memory.init(allocator);
    defer memory.deinit();
    var cost = memory.get_expansion_cost(0);
    try std.testing.expectEqual(@as(u64, 0), cost);
    cost = memory.get_expansion_cost(32);
    try std.testing.expectEqual(@as(u64, 3), cost); 
    try memory.ensure_capacity(32);
    cost = memory.get_expansion_cost(64);
    const expected = (3 * 2 + (2 * 2) / 512) - (3 * 1 + (1 * 1) / 512);
    try std.testing.expectEqual(expected, cost);
    cost = memory.get_expansion_cost(32);
    try std.testing.expectEqual(@as(u64, 0), cost);
}

test "Memory gas expansion cost caching" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var memory = try Memory.init(allocator);
    defer memory.deinit();
    const cost1 = memory.get_expansion_cost(256);
    const expected_cost = 3 * 8 + (8 * 8) / 512;
    try std.testing.expectEqual(expected_cost, cost1);
    try std.testing.expectEqual(@as(u64, 0), memory.get_expansion_cost(256));
    try std.testing.expectEqual(@as(u64, 0), memory.get_expansion_cost(128));
}

test "Memory clear resets cache" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var memory = try Memory.init(allocator);
    defer memory.deinit();
    const cost1 = memory.get_expansion_cost(256);
    try std.testing.expect(cost1 > 0);
    memory.clear();
    const cost2 = memory.get_expansion_cost(256);
    try std.testing.expectEqual(cost1, cost2);
}

test "Memory large data operations" {
    const allocator = std.testing.allocator;
    const Memory = createMemory(.{});
    var memory = try Memory.init(allocator);
    defer memory.deinit();
    var large_data: [1024]u8 = undefined;
    for (&large_data, 0..) |*byte, i| {
        byte.* = @truncate(i);
    }
    try memory.set_data(0, &large_data);
    try std.testing.expectEqual(@as(usize, 1024), memory.size());
    const chunk1 = try memory.get_slice(0, 256);
    const chunk2 = try memory.get_slice(256, 256);
    const chunk3 = try memory.get_slice(512, 256);
    const chunk4 = try memory.get_slice(768, 256);
    try std.testing.expectEqualSlices(u8, large_data[0..256], chunk1);
    try std.testing.expectEqualSlices(u8, large_data[256..512], chunk2);
    try std.testing.expectEqualSlices(u8, large_data[512..768], chunk3);
    try std.testing.expectEqualSlices(u8, large_data[768..1024], chunk4);
}
