const std = @import("std");
const constants = @import("../constants/constants.zig");

/// Creates a generic BitVec type over any unsigned integer storage type
pub fn BitVec(comptime T: type) type {
    // Compile-time validation that T is an unsigned integer
    const info = @typeInfo(T);
    if (info != .int or info.int.signedness != .unsigned) {
        @compileError("BitVec storage type must be an unsigned integer, got: " ++ @typeName(T));
    }

    const bits_per_element = @bitSizeOf(T);

    return struct {
        const Self = @This();

        /// Bit array stored in T-sized chunks
        bits: []T,
        /// Total length in bits
        size: usize,
        /// Whether this bitvec owns its memory (and should free it)
        owned: bool,

        /// Error types for BitVec operations
        pub const BitVecError = error{
            /// Position is out of bounds for the bit vector
            PositionOutOfBounds,
        };

        /// Error type for BitVec initialization
        pub const BitVecInitError = std.mem.Allocator.Error;

        /// Error type for code bitmap creation
        pub const CodeBitmapError = BitVecInitError;

        /// Create a new BitVec with the given size
        pub fn init(allocator: std.mem.Allocator, size: usize) BitVecInitError!Self {
            const element_count = (size + bits_per_element - 1) / bits_per_element; // Round up
            const bits = try allocator.alloc(T, element_count);
            errdefer allocator.free(bits);
            @memset(bits, 0); // Initialize all bits to 0
            return Self{
                .bits = bits,
                .size = size,
                .owned = true,
            };
        }

        /// Create a BitVec from existing memory (not owned)
        pub fn fromMemory(bits: []T, size: usize) Self {
            return Self{
                .bits = bits,
                .size = size,
                .owned = false,
            };
        }

        /// Free allocated memory if owned
        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            if (self.owned) {
                allocator.free(self.bits);
                self.bits = &.{};
                self.size = 0;
            }
        }

        /// Set a bit at the given position
        pub fn set(self: *Self, pos: usize) BitVecError!void {
            if (pos >= self.size) return BitVecError.PositionOutOfBounds;
            const idx = pos / bits_per_element;
            const bit = @as(T, 1) << @intCast(pos % bits_per_element);
            self.bits[idx] |= bit;
        }

        /// Set a bit at the given position without bounds checking
        pub fn setUnchecked(self: *Self, pos: usize) void {
            const idx = pos / bits_per_element;
            const bit = @as(T, 1) << @intCast(pos % bits_per_element);
            self.bits[idx] |= bit;
        }

        /// Clear a bit at the given position
        pub fn clear(self: *Self, pos: usize) BitVecError!void {
            if (pos >= self.size) return BitVecError.PositionOutOfBounds;
            const idx = pos / bits_per_element;
            const bit = @as(T, 1) << @intCast(pos % bits_per_element);
            self.bits[idx] &= ~bit;
        }

        /// Clear a bit at the given position without bounds checking
        pub fn clearUnchecked(self: *Self, pos: usize) void {
            const idx = pos / bits_per_element;
            const bit = @as(T, 1) << @intCast(pos % bits_per_element);
            self.bits[idx] &= ~bit;
        }

        /// Check if a bit is set at the given position
        pub fn isSet(self: *const Self, pos: usize) BitVecError!bool {
            if (pos >= self.size) return BitVecError.PositionOutOfBounds;
            const idx = pos / bits_per_element;
            const bit = @as(T, 1) << @intCast(pos % bits_per_element);
            return (self.bits[idx] & bit) != 0;
        }

        /// Check if a bit is set at the given position without bounds checking
        pub fn isSetUnchecked(self: *const Self, pos: usize) bool {
            const idx = pos / bits_per_element;
            const bit = @as(T, 1) << @intCast(pos % bits_per_element);
            return (self.bits[idx] & bit) != 0;
        }

        /// Check if the position represents a valid code segment
        pub fn codeSegment(self: *const Self, pos: usize) BitVecError!bool {
            return self.isSet(pos);
        }

        /// Check if the position represents a valid code segment without bounds checking
        pub fn codeSegmentUnchecked(self: *const Self, pos: usize) bool {
            return self.isSetUnchecked(pos);
        }

        /// Analyze bytecode to identify valid JUMPDEST locations and code segments
        pub fn codeBitmap(allocator: std.mem.Allocator, code: []const u8) CodeBitmapError!Self {
            var bitmap = try Self.init(allocator, code.len);
            errdefer bitmap.deinit(allocator);

            // Mark all positions as valid code initially
            for (0..code.len) |i| {
                bitmap.setUnchecked(i);
            }

            var i: usize = 0;
            while (i < code.len) {
                const op = code[i];

                // If the opcode is a PUSH, skip the pushed bytes
                if (constants.is_push(op)) {
                    const push_bytes = constants.get_push_size(op); // Get number of bytes to push

                    // Mark pushed bytes as data (not code)
                    var j: usize = 1;
                    while (j <= push_bytes and i + j < code.len) : (j += 1) {
                        bitmap.clearUnchecked(i + j);
                    }

                    // Skip the pushed bytes
                    if (i + push_bytes + 1 < code.len) {
                        i += push_bytes + 1;
                    } else {
                        i = code.len;
                    }
                } else {
                    i += 1;
                }
            }

            return bitmap;
        }
    };
}

// Default BitVec type using u64 for optimal performance on 64-bit systems
pub const BitVec64 = BitVec(u64);

// Tests
test "BitVec with u8 storage" {
    const allocator = std.testing.allocator;
    const BitVec8 = BitVec(u8);
    
    var bv = try BitVec8.init(allocator, 16);
    defer bv.deinit(allocator);

    try bv.set(0);
    try bv.set(7);
    try bv.set(8);
    try bv.set(15);

    try std.testing.expect(try bv.isSet(0));
    try std.testing.expect(try bv.isSet(7));
    try std.testing.expect(try bv.isSet(8));
    try std.testing.expect(try bv.isSet(15));
    try std.testing.expect(!try bv.isSet(1));
    try std.testing.expect(!try bv.isSet(14));
}

test "BitVec with u16 storage" {
    const allocator = std.testing.allocator;
    const BitVec16 = BitVec(u16);
    
    var bv = try BitVec16.init(allocator, 32);
    defer bv.deinit(allocator);

    try bv.set(0);
    try bv.set(15);
    try bv.set(16);
    try bv.set(31);

    try std.testing.expect(try bv.isSet(0));
    try std.testing.expect(try bv.isSet(15));
    try std.testing.expect(try bv.isSet(16));
    try std.testing.expect(try bv.isSet(31));
    try std.testing.expect(!try bv.isSet(1));
    try std.testing.expect(!try bv.isSet(30));
}

test "BitVec with u32 storage" {
    const allocator = std.testing.allocator;
    const BitVec32 = BitVec(u32);
    
    var bv = try BitVec32.init(allocator, 64);
    defer bv.deinit(allocator);

    try bv.set(0);
    try bv.set(31);
    try bv.set(32);
    try bv.set(63);

    try std.testing.expect(try bv.isSet(0));
    try std.testing.expect(try bv.isSet(31));
    try std.testing.expect(try bv.isSet(32));
    try std.testing.expect(try bv.isSet(63));
    try std.testing.expect(!try bv.isSet(1));
    try std.testing.expect(!try bv.isSet(62));
}

test "BitVec with u64 storage" {
    const allocator = std.testing.allocator;
    const BitVec64Local = BitVec(u64);
    
    var bv = try BitVec64Local.init(allocator, 128);
    defer bv.deinit(allocator);

    try bv.set(0);
    try bv.set(63);
    try bv.set(64);
    try bv.set(127);

    try std.testing.expect(try bv.isSet(0));
    try std.testing.expect(try bv.isSet(63));
    try std.testing.expect(try bv.isSet(64));
    try std.testing.expect(try bv.isSet(127));
    try std.testing.expect(!try bv.isSet(1));
    try std.testing.expect(!try bv.isSet(126));
}

test "BitVec clear functionality" {
    const allocator = std.testing.allocator;
    const BitVec32 = BitVec(u32);
    
    var bv = try BitVec32.init(allocator, 64);
    defer bv.deinit(allocator);

    try bv.set(10);
    try bv.set(20);
    try bv.set(40);

    try std.testing.expect(try bv.isSet(10));
    try std.testing.expect(try bv.isSet(20));
    try std.testing.expect(try bv.isSet(40));

    try bv.clear(20);
    try std.testing.expect(try bv.isSet(10));
    try std.testing.expect(!try bv.isSet(20));
    try std.testing.expect(try bv.isSet(40));
}

test "BitVec bounds checking" {
    const allocator = std.testing.allocator;
    const BitVec16 = BitVec(u16);
    
    var bv = try BitVec16.init(allocator, 32);
    defer bv.deinit(allocator);

    // These should succeed
    try bv.set(0);
    try bv.set(31);

    // These should fail with PositionOutOfBounds
    try std.testing.expectError(BitVec16.BitVecError.PositionOutOfBounds, bv.set(32));
    try std.testing.expectError(BitVec16.BitVecError.PositionOutOfBounds, bv.clear(100));
    try std.testing.expectError(BitVec16.BitVecError.PositionOutOfBounds, bv.isSet(32));
}

test "BitVec codeBitmap with different storage types" {
    const allocator = std.testing.allocator;
    
    // Test with u32 storage
    {
        const BitVec32 = BitVec(u32);
        const code = &[_]u8{ 0x60, 0x10, 0x60, 0x20, 0x01 }; // PUSH1 0x10 PUSH1 0x20 ADD
        var bitmap = try BitVec32.codeBitmap(allocator, code);
        defer bitmap.deinit(allocator);

        try std.testing.expect(try bitmap.isSet(0)); // PUSH1
        try std.testing.expect(!try bitmap.isSet(1)); // 0x10 (data)
        try std.testing.expect(try bitmap.isSet(2)); // PUSH1
        try std.testing.expect(!try bitmap.isSet(3)); // 0x20 (data)
        try std.testing.expect(try bitmap.isSet(4)); // ADD
    }
    
    // Test with u64 storage
    {
        const code = &[_]u8{ 0x60, 0x10, 0x60, 0x20, 0x01 }; // PUSH1 0x10 PUSH1 0x20 ADD
        var bitmap = try BitVec64.codeBitmap(allocator, code);
        defer bitmap.deinit(allocator);

        try std.testing.expect(try bitmap.isSet(0)); // PUSH1
        try std.testing.expect(!try bitmap.isSet(1)); // 0x10 (data)
        try std.testing.expect(try bitmap.isSet(2)); // PUSH1
        try std.testing.expect(!try bitmap.isSet(3)); // 0x20 (data)
        try std.testing.expect(try bitmap.isSet(4)); // ADD
    }
}

test "BitVec fromMemory" {
    const BitVec32 = BitVec(u32);
    var storage = [_]u32{ 0b1010, 0b1100 };
    
    var bv = BitVec32.fromMemory(&storage, 64);
    // No defer needed since memory is not owned

    try std.testing.expect(bv.isSetUnchecked(1));
    try std.testing.expect(!bv.isSetUnchecked(0));
    try std.testing.expect(bv.isSetUnchecked(3));
    try std.testing.expect(!bv.isSetUnchecked(2));

    try std.testing.expect(bv.isSetUnchecked(34)); // bit 2 of second element
    try std.testing.expect(bv.isSetUnchecked(35)); // bit 3 of second element
}

test "BitVec compilation error for signed integers" {
    // This would cause a compile error if uncommented:
    // const BadBitVec = BitVec(i32);
}

test "BitVec compilation error for non-integer types" {
    // This would cause a compile error if uncommented:
    // const BadBitVec = BitVec(f32);
    // const BadBitVec2 = BitVec(bool);
}