const std = @import("std");
const Tag = @import("instruction.zig").Tag;
const InstructionType = @import("instruction.zig").InstructionType;
const DynamicBitSet = std.DynamicBitSet;
const limits = @import("constants/code_analysis_limits.zig");

// Aligned bucket element types for size-based instruction storage
pub const Bucket8 = extern struct { bytes: [8]u8 align(8) };
pub const Bucket16 = extern struct { bytes: [16]u8 align(8) };
pub const Bucket24 = extern struct { bytes: [24]u8 align(8) };

// Shared count types to keep struct identity stable
pub const Size8Counts = struct {
    noop: u24 = 0,
    jump_pc: u24 = 0,
    conditional_jump_unresolved: u24 = 0,
    conditional_jump_invalid: u24 = 0,
};
pub const Size16Counts = struct {
    exec: u24 = 0,
    conditional_jump_pc: u24 = 0,
    pc: u24 = 0,
    block_info: u24 = 0,
};
pub const Size24Counts = struct {
    word: u24 = 0,
    dynamic_gas: u24 = 0,
};

/// Generic function to get instruction parameters from size-based arrays
pub fn getInstructionParams(
    size8_instructions: []Bucket8,
    size16_instructions: []Bucket16,
    size24_instructions: []Bucket24,
    comptime tag: Tag,
    id: u24,
) InstructionType(tag) {
    const InstType = InstructionType(tag);
    const size = comptime @sizeOf(InstType);
    return switch (size) {
        8 => blk: {
            const base_ptr: *const u8 = &size8_instructions[id].bytes[0];
            break :blk (@as(*const InstType, @ptrCast(@alignCast(base_ptr)))).*;
        },
        16 => blk: {
            const base_ptr: *const u8 = &size16_instructions[id].bytes[0];
            break :blk (@as(*const InstType, @ptrCast(@alignCast(base_ptr)))).*;
        },
        24 => blk: {
            const base_ptr: *const u8 = &size24_instructions[id].bytes[0];
            break :blk (@as(*const InstType, @ptrCast(@alignCast(base_ptr)))).*;
        },
        else => {
            const Log = @import("log.zig");
            Log.debug("Unexpected instruction size: {} for tag: {}", .{ size, tag });
            unreachable;
        },
    };
}

/// Packed array of valid JUMPDEST positions for cache-efficient validation.
/// Because JUMPDEST opcodes are sparse (typically <50 per contract vs 24KB max size),
/// a packed array with linear search provides better cache locality than a bitmap.
/// Uses u15 to pack positions tightly while supporting max contract size (24KB < 32KB).
pub const JumpdestArray = struct {
    /// Sorted array of valid JUMPDEST program counters.
    /// u15 allows max value 32767, sufficient for MAX_CONTRACT_SIZE (24576).
    /// Packed to maximize cache line utilization.
    positions: []const u15,
    /// Original code length for bounds checking
    code_len: usize,
    /// Allocator used for array allocation (needed for cleanup)
    allocator: std.mem.Allocator,
    
    /// Convert a DynamicBitSet bitmap to a packed array of JUMPDEST positions.
    /// Collects all set bits from the bitmap into a sorted, packed array.
    pub fn from_bitmap(allocator: std.mem.Allocator, bitmap: *const DynamicBitSet, code_len: usize) !JumpdestArray {
        comptime {
            std.debug.assert(std.math.maxInt(u15) >= limits.MAX_CONTRACT_SIZE);
        }
        // First pass: count set bits to determine array size
        var count: usize = 0;
        for (0..code_len) |i| {
            if (bitmap.isSet(i)) count += 1;
        }
        // Allocate exact-sized array for JUMPDEST positions
        const positions = try allocator.alloc(u15, count);
        errdefer allocator.free(positions);
        // Second pass: collect positions into packed array
        var pos_idx: usize = 0;
        for (0..code_len) |i| {
            if (bitmap.isSet(i)) {
                positions[pos_idx] = @intCast(i);
                pos_idx += 1;
            }
        }
        return JumpdestArray{
            .positions = positions,
            .code_len = code_len,
            .allocator = allocator,
        };
    }
    
    pub fn deinit(self: *JumpdestArray) void {
        self.allocator.free(self.positions);
    }
    
    /// Validates if a program counter is a valid JUMPDEST using cache-friendly linear search.
    /// Uses proportional starting point (pc / code_len * positions.len) then searches
    /// bidirectionally to maximize cache hits on the packed array.
    pub fn is_valid_jumpdest(self: *const JumpdestArray, pc: usize) bool {
        if (self.positions.len == 0 or pc >= self.code_len) return false;
        // Calculate proportional starting index for linear search
        // This distributes search starting points across the array for better cache locality
        const start_idx = (pc * self.positions.len) / self.code_len;
        // Binary search would be O(log n) but worse cache performance
        // Linear search from proportional start is typically faster for small arrays
        
        // Search forward from start position
        if (start_idx < self.positions.len) {
            for (self.positions[start_idx..]) |pos| {
                if (pos == pc) return true;
                if (pos > pc) break; // Positions are sorted
            }
        }
        
        // Search backward from start position
        if (start_idx > 0) {
            var i = start_idx - 1;
            while (true) : (i -= 1) {
                if (self.positions[i] == pc) return true;
                if (self.positions[i] < pc) break; // Positions are sorted
                if (i == 0) break;
            }
        }
        
        return false;
    }
};
