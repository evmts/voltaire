const std = @import("std");
const limits = @import("constants/code_analysis_limits.zig");
const DynamicBitSet = std.DynamicBitSet;

/// Packed array of valid JUMPDEST positions for cache-efficient validation.
/// Because JUMPDEST opcodes are sparse (typically <50 per contract vs 24KB max size),
/// a packed array with linear search provides better cache locality than a bitmap.
/// Uses u15 to pack positions tightly while supporting max contract size (24KB < 32KB).
pub const JumpdestArray = struct {
    /// Sorted array of valid JUMPDEST program counters.
    /// u15 allows max value 32767, sufficient for MAX_CONTRACT_SIZE (24576).
    /// Packed to maximize cache line utilization.
    positions: []const u15,

    /// Original code length for bounds checking and search hint calculation
    code_len: usize,


    /// Convert a DynamicBitSet bitmap to a packed array of JUMPDEST positions.
    /// Collects all set bits from the bitmap into a sorted, packed array.
    pub fn from_bitmap(allocator: std.mem.Allocator, bitmap: *const DynamicBitSet, code_len: usize) !JumpdestArray {
        comptime {
            std.debug.assert(std.math.maxInt(u15) >= limits.MAX_CONTRACT_SIZE);
        }

        // First pass: count set bits to determine array size
        var count: usize = 0;
        var i: usize = 0;
        while (i < code_len) : (i += 1) {
            if (bitmap.isSet(i)) count += 1;
        }

        // Allocate packed array
        const positions = try allocator.alloc(u15, count);
        errdefer allocator.free(positions);

        // Second pass: collect positions into array
        var pos_idx: usize = 0;
        i = 0;
        while (i < code_len) : (i += 1) {
            if (bitmap.isSet(i)) {
                positions[pos_idx] = @intCast(i);
                pos_idx += 1;
            }
        }

        return JumpdestArray{
            .positions = positions,
            .code_len = code_len,
        };
    }

    pub fn deinit(self: *JumpdestArray, allocator: std.mem.Allocator) void {
        allocator.free(self.positions);
    }

    /// Validates if a program counter is a valid JUMPDEST using cache-friendly linear search.
    /// Uses proportional starting point (pc / code_len * positions.len) then searches
    /// bidirectionally to maximize cache hits on the packed array.
    pub fn is_valid_jumpdest(self: *const JumpdestArray, pc: usize) bool {
        if (self.positions.len == 0 or pc >= self.code_len) return false;

        // Calculate proportional starting index for linear search
        // This distributes search starting points across the array for better cache locality
        const start_idx = (pc * self.positions.len) / self.code_len;
        const safe_start = @min(start_idx, self.positions.len - 1);

        // Linear search from calculated starting point - forwards then backwards
        // Linear search maximizes CPU cache hit rates on packed consecutive memory
        if (self.positions[safe_start] == pc) return true;

        // Search forward
        var i = safe_start + 1;
        while (i < self.positions.len and self.positions[i] <= pc) : (i += 1) {
            if (self.positions[i] == pc) return true;
        }

        // Search backward
        i = safe_start;
        while (i > 0) {
            i -= 1;
            if (self.positions[i] >= pc) {
                if (self.positions[i] == pc) return true;
            } else break;
        }

        return false;
    }
};