const std = @import("std");

/// A custom allocator that wraps ArenaAllocator with a configurable growth strategy.
/// This allocator preallocates memory and grows by a specified factor when more space is needed.
pub const GrowingArenaAllocator = struct {
    const Self = @This();

    /// The underlying arena allocator
    arena: std.heap.ArenaAllocator,
    /// The base allocator used by the arena
    base_allocator: std.mem.Allocator,
    /// Current capacity that we've preallocated
    current_capacity: usize,
    /// Initial capacity to start with
    initial_capacity: usize,
    /// Growth factor (as a percentage, e.g., 150 = 50% growth)
    growth_factor: u32,

    /// Initialize a new growing arena allocator
    pub fn init(base_allocator: std.mem.Allocator, initial_capacity: usize, growth_factor: u32) Self {
        var arena = std.heap.ArenaAllocator.init(base_allocator);
        
        // Preallocate the initial capacity
        if (initial_capacity > 0) {
            _ = arena.allocator().alloc(u8, initial_capacity) catch {};
            _ = arena.reset(.retain_capacity);
        }

        return Self{
            .arena = arena,
            .base_allocator = base_allocator,
            .current_capacity = initial_capacity,
            .initial_capacity = initial_capacity,
            .growth_factor = growth_factor,
        };
    }

    /// Deinitialize the allocator
    pub fn deinit(self: *Self) void {
        self.arena.deinit();
    }

    /// Get the allocator interface
    pub fn allocator(self: *Self) std.mem.Allocator {
        return .{
            .ptr = self,
            .vtable = &.{
                .alloc = alloc,
                .resize = resize,
                .free = free,
                .remap = remap,
            },
        };
    }

    /// Reset the arena while retaining capacity
    pub fn reset(self: *Self, mode: std.heap.ArenaAllocator.ResetMode) bool {
        return self.arena.reset(mode);
    }

    /// Reset the arena to initial capacity
    /// This frees all memory and then pre-allocates the initial capacity again
    pub fn resetToInitialCapacity(self: *Self) void {
        // Free all memory
        _ = self.arena.reset(.free_all);
        
        // Pre-allocate initial capacity again
        if (self.initial_capacity > 0) {
            _ = self.arena.allocator().alloc(u8, self.initial_capacity) catch {};
            _ = self.arena.reset(.retain_capacity);
        }
        
        // Reset current capacity tracker
        self.current_capacity = self.initial_capacity;
    }

    /// Query the current capacity
    pub fn queryCapacity(self: *const Self) usize {
        return self.arena.queryCapacity();
    }

    fn alloc(ctx: *anyopaque, len: usize, ptr_align: std.mem.Alignment, ret_addr: usize) ?[*]u8 {
        const self: *Self = @ptrCast(@alignCast(ctx));
        
        // First, try to allocate with the current arena
        if (self.arena.allocator().rawAlloc(len, ptr_align, ret_addr)) |ptr| {
            return ptr;
        }
        
        // If allocation failed, we might need more space
        // Check if we need to grow the arena
        const current_used = self.arena.queryCapacity();
        if (current_used + len > self.current_capacity) {
            // Calculate new capacity with growth factor
            var new_capacity = self.current_capacity;
            while (new_capacity < current_used + len) {
                new_capacity = (new_capacity * self.growth_factor) / 100;
            }
            
            // Try to preallocate more space
            const additional_capacity = new_capacity - self.current_capacity;
            if (additional_capacity > 0) {
                // Allocate a dummy block to force the arena to grow
                _ = self.arena.allocator().alloc(u8, additional_capacity) catch {};
                self.current_capacity = new_capacity;
            }
        }
        
        // Try allocation again after potential growth
        return self.arena.allocator().rawAlloc(len, ptr_align, ret_addr);
    }

    fn resize(ctx: *anyopaque, buf: []u8, buf_align: std.mem.Alignment, new_len: usize, ret_addr: usize) bool {
        const self: *Self = @ptrCast(@alignCast(ctx));
        return self.arena.allocator().rawResize(buf, buf_align, new_len, ret_addr);
    }

    fn free(ctx: *anyopaque, buf: []u8, buf_align: std.mem.Alignment, ret_addr: usize) void {
        const self: *Self = @ptrCast(@alignCast(ctx));
        // Arena allocator doesn't actually free individual allocations
        self.arena.allocator().rawFree(buf, buf_align, ret_addr);
    }

    fn remap(ctx: *anyopaque, buf: []u8, alignment: std.mem.Alignment, new_size: usize, ret_addr: usize) ?[*]u8 {
        _ = ctx;
        _ = buf;
        _ = alignment;
        _ = new_size;
        _ = ret_addr;
        // Arena allocator doesn't support remapping
        return null;
    }
};

test "GrowingArenaAllocator basic functionality" {
    var gaa = GrowingArenaAllocator.init(std.testing.allocator, 1024, 150);
    defer gaa.deinit();

    const alloc = gaa.allocator();
    
    // Test basic allocation
    const data1 = try alloc.alloc(u8, 100);
    data1[0] = 42;
    
    // Test larger allocation that might trigger growth
    const data2 = try alloc.alloc(u8, 2000);
    data2[0] = 43;
    
    // Verify data is still accessible
    try std.testing.expectEqual(@as(u8, 42), data1[0]);
    try std.testing.expectEqual(@as(u8, 43), data2[0]);
}

test "GrowingArenaAllocator growth strategy" {
    var gaa = GrowingArenaAllocator.init(std.testing.allocator, 1000, 150);
    defer gaa.deinit();

    const alloc = gaa.allocator();
    
    // Initial capacity should be around 1000
    const initial_cap = gaa.queryCapacity();
    try std.testing.expect(initial_cap >= 1000);
    
    // Allocate enough to trigger growth
    _ = try alloc.alloc(u8, 1500);
    
    // Capacity should have grown by at least 50%
    const new_cap = gaa.queryCapacity();
    try std.testing.expect(new_cap >= 1500);
}