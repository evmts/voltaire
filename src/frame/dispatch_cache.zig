const std = @import("std");
const builtin = @import("builtin");
const memory_mod = @import("../memory/memory.zig");
const stack_mod = @import("../stack/stack.zig");
const opcode_data = @import("../opcodes/opcode_data.zig");
const Opcode = opcode_data.Opcode;
const OpcodeSynthetic = @import("../opcodes/opcode_synthetic.zig").OpcodeSynthetic;
pub const FrameConfig = @import("frame_config.zig").FrameConfig;
const Database = @import("../storage/database.zig").Database;
const Account = @import("../storage/database.zig").Account;
const MemoryDatabase = @import("../storage/memory_database.zig").MemoryDatabase;
const bytecode_mod = @import("../bytecode/bytecode.zig");
const BytecodeConfig = @import("../bytecode/bytecode_config.zig").BytecodeConfig;
const primitives = @import("primitives");
const GasConstants = primitives.GasConstants;
const Address = primitives.Address.Address;
const to_u256 = primitives.Address.to_u256;
const from_u256 = primitives.Address.from_u256;
const frame_handlers = @import("frame_handlers.zig");
const SelfDestruct = @import("../storage/self_destruct.zig").SelfDestruct;
const DefaultEvm = @import("../evm.zig").Evm(.{});
const call_params_mod = @import("call_params.zig");
const call_result_mod = @import("call_result.zig");
const dispatch_mod = @import("../preprocessor/dispatch.zig");

/// LRU cache for dispatch schedules to avoid recompiling bytecode
pub const DispatchCacheEntry = struct {
    /// Full bytecode used as key (points to bytecode directly)
    bytecode_key: []const u8,
    /// Cached dispatch schedule (owned by cache)
    schedule: []const u8, // Store as raw bytes
    /// Cached jump table (owned by cache)
    jump_table_entries: []const u8, // Store as raw bytes
    /// Last access timestamp for LRU eviction
    last_access: u64,
    ref_count: u32,
};

/// Context for hashing bytecode pointers in HashMap
const BytecodeContext = struct {
    pub fn hash(self: @This(), key: []const u8) u64 {
        _ = self;
        // Hash the bytecode pointer address for O(1) lookup
        // This is safe because we use pointer comparison in eql
        const ptr_int = @intFromPtr(key.ptr);
        return std.hash.Wyhash.hash(0, std.mem.asBytes(&ptr_int));
    }
    pub fn eql(self: @This(), a: []const u8, b: []const u8) bool {
        _ = self;
        // Direct pointer comparison for bytecode keys
        // This is safe because we store pointers to the original bytecode
        return a.ptr == b.ptr and a.len == b.len;
    }
};

pub const DispatchCache = struct {
    const CACHE_SIZE = 256; // Number of cached contracts
    const SMALL_BYTECODE_THRESHOLD = 256; // Compute on-demand for bytecode smaller than this

    // Use HashMap for O(1) lookups instead of linear search
    entries: std.hash_map.HashMap([]const u8, DispatchCacheEntry, BytecodeContext, 80),
    allocator: std.mem.Allocator,
    access_counter: u64 = 0,
    hits: u64 = 0,
    misses: u64 = 0,
    mutex: std.Thread.Mutex = .{},

    fn init(allocator: std.mem.Allocator) DispatchCache {
        return .{
            .entries = std.hash_map.HashMap([]const u8, DispatchCacheEntry, BytecodeContext, 80).init(allocator),
            .allocator = allocator,
        };
    }

    fn deinit(self: *DispatchCache) void {
        self.mutex.lock();
        defer self.mutex.unlock();

        var iter = self.entries.iterator();
        while (iter.next()) |kv| {
            self.allocator.free(kv.value_ptr.schedule);
            self.allocator.free(kv.value_ptr.jump_table_entries);
        }
        self.entries.deinit();
    }

    pub fn lookup(self: *DispatchCache, bytecode: []const u8) ?struct { schedule: []const u8, jump_table: []const u8 } {
        self.mutex.lock();
        defer self.mutex.unlock();

        self.access_counter += 1;

        // O(1) HashMap lookup using bytecode pointer as key
        if (self.entries.getPtr(bytecode)) |entry| {
            // Found a hit
            self.hits += 1;
            entry.last_access = self.access_counter;
            entry.ref_count += 1;
            return .{
                .schedule = entry.schedule,
                .jump_table = entry.jump_table_entries,
            };
        }

        self.misses += 1;
        return null;
    }

    pub fn insert(self: *DispatchCache, bytecode: []const u8, schedule: []const u8, jump_table: []const u8) !void {
        if (bytecode.len < SMALL_BYTECODE_THRESHOLD) return;

        self.mutex.lock();
        defer self.mutex.unlock();

        // Check if cache is at capacity
        if (self.entries.count() >= CACHE_SIZE) {
            // Find LRU entry to evict
            var lru_key: ?[]const u8 = null;
            var lru_access: u64 = std.math.maxInt(u64);

            var iter = self.entries.iterator();
            while (iter.next()) |kv| {
                if (kv.value_ptr.ref_count == 0 and kv.value_ptr.last_access < lru_access) {
                    lru_key = kv.key_ptr.*;
                    lru_access = kv.value_ptr.last_access;
                }
            }

            // Evict LRU entry if found
            if (lru_key) |key| {
                if (self.entries.fetchRemove(key)) |removed| {
                    self.allocator.free(removed.value.schedule);
                    self.allocator.free(removed.value.jump_table_entries);
                }
            } else {
                // All entries are in use, cannot insert
                return;
            }
        }

        const schedule_copy = try self.allocator.dupe(u8, schedule);
        errdefer self.allocator.free(schedule_copy);

        const jump_table_copy = try self.allocator.dupe(u8, jump_table);
        errdefer self.allocator.free(jump_table_copy);

        try self.entries.put(bytecode, DispatchCacheEntry{
            .bytecode_key = bytecode,
            .schedule = schedule_copy,
            .jump_table_entries = jump_table_copy,
            .last_access = self.access_counter,
            .ref_count = 0,
        });
    }

    /// Decrements the reference count for a cached bytecode entry.
    /// Called when a frame is done using a cached dispatch schedule.
    pub fn release(self: *DispatchCache, bytecode: []const u8) void {
        if (bytecode.len < SMALL_BYTECODE_THRESHOLD) return;

        self.mutex.lock();
        defer self.mutex.unlock();

        if (self.entries.getPtr(bytecode)) |entry| {
            if (entry.ref_count > 0) entry.ref_count -= 1;
        }
    }

    fn getStatistics(self: *const DispatchCache) struct { hits: u64, misses: u64, hit_rate: f64 } {
        const total = self.hits + self.misses;
        const hit_rate = if (total > 0) @as(f64, @floatFromInt(self.hits)) / @as(f64, @floatFromInt(total)) else 0.0;
        return .{
            .hits = self.hits,
            .misses = self.misses,
            .hit_rate = hit_rate,
        };
    }

    fn clear(self: *DispatchCache) void {
        self.mutex.lock();
        defer self.mutex.unlock();

        // Collect keys to remove (can't modify while iterating)
        var keys_to_remove = std.ArrayList([]const u8){};
        defer keys_to_remove.deinit(self.allocator);

        var iter = self.entries.iterator();
        while (iter.next()) |kv| {
            if (kv.value_ptr.ref_count == 0) {
                keys_to_remove.append(self.allocator, kv.key_ptr.*) catch continue;
            }
        }

        // Remove collected entries
        for (keys_to_remove.items) |key| {
            if (self.entries.fetchRemove(key)) |removed| {
                self.allocator.free(removed.value.schedule);
                self.allocator.free(removed.value.jump_table_entries);
            }
        }

        self.hits = 0;
        self.misses = 0;
        self.access_counter = 0;
    }
};

// TODO: We need to properly think about threads. I think it's possible we want to handle threads via violently erroring if we detect the same EVM instance
// is on more than 1 thread

/// Global dispatch cache instance - initialized by Evm.init()
/// This is required for performance optimization. Bytecode is compiled once and cached.
var global_dispatch_cache: ?DispatchCache = null;
var cache_mutex: std.Thread.Mutex = .{};

/// Initialize the global cache if not already initialized.
/// Called by Evm.init() to ensure cache is available.
/// Safe to call multiple times - will only initialize once.
pub fn initGlobalCache(allocator: std.mem.Allocator) void {
    cache_mutex.lock();
    defer cache_mutex.unlock();
    if (global_dispatch_cache == null) {
        global_dispatch_cache = DispatchCache.init(allocator);
        if (builtin.mode == .Debug) {
            std.debug.print("DispatchCache: Initialized global cache\n", .{});
        }
    }
}

/// Get the global cache. Panics if not initialized.
/// Frame.interpret() uses this to get the required cache.
pub fn getGlobalCacheUnsafe() *DispatchCache {
    cache_mutex.lock();
    defer cache_mutex.unlock();
    return &(global_dispatch_cache orelse unreachable);
}

pub fn deinitGlobalCache() void {
    cache_mutex.lock();
    defer cache_mutex.unlock();
    if (global_dispatch_cache) |*cache| {
        cache.deinit();
        global_dispatch_cache = null;
    }
}

pub fn getCacheStatistics() ?struct { hits: u64, misses: u64, hit_rate: f64 } {
    cache_mutex.lock();
    defer cache_mutex.unlock();
    if (global_dispatch_cache) |*cache| return cache.getStatistics();
    return null;
}

pub fn clearGlobalCache() void {
    cache_mutex.lock();
    defer cache_mutex.unlock();
    if (global_dispatch_cache) |*cache| cache.clear();
}

test "dispatch cache basic functionality" {
    const allocator = std.testing.allocator;

    // Initialize the cache
    initGlobalCache(allocator);
    defer deinitGlobalCache();

    // Get the cache
    const cache = getGlobalCacheUnsafe();

    // Create some test bytecode
    const bytecode: []const u8 = &[_]u8{0x60, 0x01, 0x60, 0x02, 0x01}; // PUSH1 1 PUSH1 2 ADD
    const schedule: []const u8 = &[_]u8{1, 2, 3, 4, 5, 6, 7, 8};
    const jump_table: []const u8 = &[_]u8{10, 20, 30, 40};

    // Should not be in cache initially
    const initial_lookup = cache.lookup(bytecode);
    try std.testing.expect(initial_lookup == null);

    // Insert into cache (only works for bytecode > 256 bytes, so this should be a no-op)
    try cache.insert(bytecode, schedule, jump_table);

    // Should still not be in cache (too small)
    const after_insert = cache.lookup(bytecode);
    try std.testing.expect(after_insert == null);

    // Create larger bytecode that will be cached
    const large_bytecode = try allocator.alloc(u8, 300);
    defer allocator.free(large_bytecode);
    @memset(large_bytecode, 0x60); // Fill with PUSH1

    // Insert large bytecode
    try cache.insert(large_bytecode, schedule, jump_table);

    // Should now be in cache
    const cached = cache.lookup(large_bytecode);
    try std.testing.expect(cached != null);
    try std.testing.expectEqualSlices(u8, cached.?.schedule, schedule);
    try std.testing.expectEqualSlices(u8, cached.?.jump_table, jump_table);

    // Release the cached entry
    cache.release(large_bytecode);

    // Check statistics
    const stats = getCacheStatistics();
    try std.testing.expect(stats != null);
    try std.testing.expect(stats.?.hits == 1);
    try std.testing.expect(stats.?.misses == 2); // Two misses for small bytecode
}
