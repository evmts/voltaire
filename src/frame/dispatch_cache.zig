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

/// Global dispatch cache instance - optional because it must be explicitly initialized via initGlobalCache()
/// This is an opt-in performance optimization. When not initialized, bytecode is recompiled each time.
/// To enable caching, call initGlobalCache(allocator) at startup and deinitGlobalCache() at shutdown.
pub var global_dispatch_cache: ?DispatchCache = null;
var cache_mutex: std.Thread.Mutex = .{};

pub fn initGlobalCache(allocator: std.mem.Allocator) void {
    cache_mutex.lock();
    defer cache_mutex.unlock();
    if (global_dispatch_cache == null) global_dispatch_cache = DispatchCache.init(allocator);
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
