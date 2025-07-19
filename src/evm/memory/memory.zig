const std = @import("std");
const constants = @import("constants.zig");

/// Memory implementation for EVM execution contexts.
pub const Memory = @This();

// Re-export error types and constants for convenience
pub const MemoryError = @import("errors.zig").MemoryError;
pub const INITIAL_CAPACITY = constants.INITIAL_CAPACITY;
pub const DEFAULT_MEMORY_LIMIT = constants.DEFAULT_MEMORY_LIMIT;
pub const calculate_num_words = constants.calculate_num_words;

// Core memory struct fields optimized for cache locality and minimal padding
/// Memory checkpoint for child memory isolation
/// Frequently accessed during memory operations
my_checkpoint: usize,

/// Maximum memory size limit
/// Used for bounds checking, frequently accessed
memory_limit: u64,

/// Reference to shared buffer for all memory contexts
/// Frequently accessed for actual memory operations
shared_buffer_ref: *std.ArrayList(u8),

/// Memory allocator for dynamic allocations
/// Less frequently accessed
allocator: std.mem.Allocator,

/// Whether this Memory instance owns the buffer
/// Small bool field placed last to minimize padding
owns_buffer: bool,

/// Cache for memory expansion gas cost calculations
/// Stores the last expansion calculation to avoid redundant quadratic computations
cached_expansion: struct {
    /// Last calculated memory size in bytes
    last_size: u64,
    /// Gas cost for the last calculated size
    last_cost: u64,
} = .{ .last_size = 0, .last_cost = 0 },

/// Initializes the root Memory context that owns the shared buffer.
/// This is the safe API that eliminates the undefined pointer footgun.
pub fn init(
    allocator: std.mem.Allocator,
    initial_capacity: usize,
    memory_limit: u64,
) !Memory {
    const shared_buffer = try allocator.create(std.ArrayList(u8));
    errdefer allocator.destroy(shared_buffer);
    
    shared_buffer.* = std.ArrayList(u8).init(allocator);
    errdefer shared_buffer.deinit();
    try shared_buffer.ensureTotalCapacity(initial_capacity);

    return Memory{
        .my_checkpoint = 0,
        .memory_limit = memory_limit,
        .shared_buffer_ref = shared_buffer,
        .allocator = allocator,
        .owns_buffer = true,
    };
}

/// Creates a child Memory that shares the buffer with a different checkpoint.
/// Child memory has a view of the shared buffer starting from its checkpoint.
pub fn init_child_memory(self: *Memory, checkpoint: usize) !Memory {
    return Memory{
        .my_checkpoint = checkpoint,
        .memory_limit = self.memory_limit,
        .shared_buffer_ref = self.shared_buffer_ref,
        .allocator = self.allocator,
        .owns_buffer = false,
    };
}

pub fn init_default(allocator: std.mem.Allocator) !Memory {
    return try init(allocator, INITIAL_CAPACITY, DEFAULT_MEMORY_LIMIT);
}

/// Deinitializes the Memory. Only root Memory instances clean up the shared buffer.
pub fn deinit(self: *Memory) void {
    if (self.owns_buffer) {
        self.shared_buffer_ref.deinit();
        self.allocator.destroy(self.shared_buffer_ref);
    }
}

// Import and re-export all method implementations
const context_ops = @import("context.zig");
const read_ops = @import("read.zig");
const write_ops = @import("write.zig");
const slice_ops = @import("slice.zig");

// Context operations
pub const context_size = context_ops.context_size;
pub const ensure_context_capacity = context_ops.ensure_context_capacity;
pub const resize_context = context_ops.resize_context;
pub const size = context_ops.size;
pub const total_size = context_ops.total_size;

// Read operations
pub const get_u256 = read_ops.get_u256;
pub const get_slice = read_ops.get_slice;
pub const get_byte = read_ops.get_byte;

// Write operations
pub const set_data = write_ops.set_data;
pub const set_data_bounded = write_ops.set_data_bounded;
pub const set_u256 = write_ops.set_u256;

// Slice operations
pub const slice = slice_ops.slice;

/// Get memory expansion gas cost with caching optimization
/// Returns the gas cost for expanding memory from current size to new_size.
/// Uses cached values when possible to avoid redundant quadratic calculations.
pub fn get_expansion_cost(self: *Memory, new_size: u64) u64 {
    const current_size = @as(u64, @intCast(self.context_size()));
    
    // No expansion needed if new size is not larger than current
    if (new_size <= current_size) {
        return 0;
    }
    
    // Check if we can use cached calculation
    if (new_size == self.cached_expansion.last_size) {
        // Return cached cost minus cost for current size
        const current_cost = if (current_size == 0) 0 else calculate_memory_total_cost(current_size);
        return self.cached_expansion.last_cost -| current_cost;
    }
    
    // Calculate new cost and update cache
    const new_cost = calculate_memory_total_cost(new_size);
    const current_cost = if (current_size == 0) 0 else calculate_memory_total_cost(current_size);
    const expansion_cost = new_cost - current_cost;
    
    // Update cache
    self.cached_expansion.last_size = new_size;
    self.cached_expansion.last_cost = new_cost;
    
    return expansion_cost;
}

/// Calculate total memory cost for a given size (internal helper)
inline fn calculate_memory_total_cost(size_bytes: u64) u64 {
    const words = (size_bytes + 31) / 32;
    return 3 * words + (words * words) / 512;
}

// Import fuzz tests to ensure they are compiled and run
test {
    _ = @import("fuzz_tests.zig");
}

