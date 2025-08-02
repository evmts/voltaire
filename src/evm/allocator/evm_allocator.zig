const std = @import("std");
const mem = std.mem;
const Allocator = mem.Allocator;
// FixedBufferAllocator provides the optimized bump allocation logic.
const FixedBufferAllocator = std.heap.FixedBufferAllocator;

/// Manages memory for a single EVM transaction lifecycle.
pub const EVMAllocator = struct {
    // The allocator used to obtain the main buffer (e.g., GPA or Wasm allocator).
    backing_allocator: Allocator,
    // The allocator responsible for managing the buffer internals.
    fba: FixedBufferAllocator,
    // The memory buffer allocated upfront.
    buffer: []u8,

    const Self = @This();

    // Recommended default size - 16MB provides best performance based on benchmarks
    pub const DEFAULT_CAPACITY = 16 * 1024 * 1024; // 16 MiB

    /// Initialize the allocator by allocating the arena upfront.
    pub fn init(backing_allocator: Allocator, capacity: usize) !Self {
        // 1. Allocate the entire buffer upfront
        const buffer = try backing_allocator.alloc(u8, capacity);
        errdefer backing_allocator.free(buffer);

        // 2. Initialize the FBA with the buffer
        const fba = FixedBufferAllocator.init(buffer);

        return Self{
            .backing_allocator = backing_allocator,
            .fba = fba,
            .buffer = buffer,
        };
    }

    /// Frees the entire arena back to the backing allocator.
    pub fn deinit(self: *Self) void {
        self.backing_allocator.free(self.buffer);
        // Poison the state for safety against use-after-free.
        self.* = undefined;
    }

    /// Provides the Allocator interface for the EVM to use.
    pub fn allocator(self: *Self) Allocator {
        // The FBA handles the fast bump allocation.
        return self.fba.allocator();
    }

    /// Resets the bump pointer, allowing the memory to be reused instantly
    /// for the next transaction without releasing the buffer to the OS.
    pub fn reset(self: *Self) void {
        self.fba.reset();
    }
};

test "EVMAllocator basic functionality" {
    const testing = std.testing;
    const allocator = testing.allocator;

    var evm_allocator = try EVMAllocator.init(allocator, 1024 * 1024); // 1MB for testing
    defer evm_allocator.deinit();

    const evm_alloc = evm_allocator.allocator();

    // Test basic allocation
    const data = try evm_alloc.alloc(u8, 100);
    data[0] = 42;
    try testing.expectEqual(@as(u8, 42), data[0]);

    // Test multiple allocations
    const data2 = try evm_alloc.alloc(u256, 10);
    data2[0] = 0xDEADBEEF;
    try testing.expectEqual(@as(u256, 0xDEADBEEF), data2[0]);

    // Test reset functionality
    evm_allocator.reset();

    // Can allocate again after reset
    const data3 = try evm_alloc.alloc(u8, 50);
    data3[0] = 99;
    try testing.expectEqual(@as(u8, 99), data3[0]);
}

test "EVMAllocator stress test" {
    const testing = std.testing;
    const allocator = testing.allocator;

    var evm_allocator = try EVMAllocator.init(allocator, EVMAllocator.DEFAULT_CAPACITY);
    defer evm_allocator.deinit();

    const evm_alloc = evm_allocator.allocator();

    // Simulate heavy allocation pattern
    var total_allocated: usize = 0;
    var i: usize = 0;
    while (i < 1000) : (i += 1) {
        const size = (i % 100) + 1;
        const data = try evm_alloc.alloc(u8, size);
        @memset(data, @as(u8, @intCast(i % 256)));
        total_allocated += size;
    }

    // Reset and reuse
    evm_allocator.reset();

    // Allocate again to verify reset worked
    const large_alloc = try evm_alloc.alloc(u256, 1000);
    large_alloc[0] = std.math.maxInt(u256);
    try testing.expectEqual(std.math.maxInt(u256), large_alloc[0]);
}