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

pub const DispatchCache = struct {
    const CACHE_SIZE = 256; // Number of cached contracts
    const SMALL_BYTECODE_THRESHOLD = 256; // Compute on-demand for bytecode smaller than this

    entries: [CACHE_SIZE]?DispatchCacheEntry = [_]?DispatchCacheEntry{null} ** CACHE_SIZE,
    allocator: std.mem.Allocator,
    access_counter: u64 = 0,
    hits: u64 = 0,
    misses: u64 = 0,
    mutex: std.Thread.Mutex = .{},

    fn init(allocator: std.mem.Allocator) DispatchCache {
        return .{
            .allocator = allocator,
        };
    }

    fn deinit(self: *DispatchCache) void {
        self.mutex.lock();
        defer self.mutex.unlock();

        for (&self.entries) |*entry_opt| {
            if (entry_opt.*) |*entry| {
                self.allocator.free(entry.schedule);
                self.allocator.free(entry.jump_table_entries);
                entry_opt.* = null;
            }
        }
    }

    pub fn lookup(self: *DispatchCache, bytecode: []const u8) ?struct { schedule: []const u8, jump_table: []const u8 } {
        self.mutex.lock();
        defer self.mutex.unlock();

        self.access_counter += 1;

        // TODO: why do we have to do a linear search? This should be constant time lookup
        // Search for matching entry
        for (&self.entries) |*entry_opt| {
            if (entry_opt.*) |*entry| {
                // Direct bytecode comparison - safe from collision attacks
                if (std.mem.eql(u8, entry.bytecode_key, bytecode)) {
                    // Found a hit
                    self.hits += 1;
                    entry.last_access = self.access_counter;
                    entry.ref_count += 1;
                    return .{
                        .schedule = entry.schedule,
                        .jump_table = entry.jump_table_entries,
                    };
                }
            }
        }

        self.misses += 1;
        return null;
    }

    pub fn insert(self: *DispatchCache, bytecode: []const u8, schedule: []const u8, jump_table: []const u8) !void {
        if (bytecode.len < SMALL_BYTECODE_THRESHOLD) return;

        self.mutex.lock();
        defer self.mutex.unlock();

        var lru_idx: usize = 0;
        var lru_access: u64 = std.math.maxInt(u64);
        var empty_idx: ?usize = null;

        for (&self.entries, 0..) |*entry_opt, i| {
            if (entry_opt.* == null) {
                empty_idx = i;
                break;
            } else if (entry_opt.*.?.ref_count == 0 and entry_opt.*.?.last_access < lru_access) {
                lru_idx = i;
                lru_access = entry_opt.*.?.last_access;
            }
        }

        const target_idx = empty_idx orelse lru_idx;

        if (self.entries[target_idx]) |*old_entry| {
            if (old_entry.ref_count > 0) return;
            self.allocator.free(old_entry.schedule);
            self.allocator.free(old_entry.jump_table_entries);
        }

        const schedule_copy = try self.allocator.dupe(u8, schedule);
        errdefer self.allocator.free(schedule_copy);

        const jump_table_copy = try self.allocator.dupe(u8, jump_table);

        self.entries[target_idx] = DispatchCacheEntry{
            .bytecode_key = bytecode,
            .schedule = schedule_copy,
            .jump_table_entries = jump_table_copy,
            .last_access = self.access_counter,
            .ref_count = 0,
        };
    }

    // TODO: I wasn't able to remember what this code does and why it exists intuitively at first glance
    pub fn release(self: *DispatchCache, bytecode: []const u8) void {
        if (bytecode.len < SMALL_BYTECODE_THRESHOLD) return;

        self.mutex.lock();
        defer self.mutex.unlock();

        for (&self.entries) |*entry_opt| {
            if (entry_opt.*) |*entry| {
                if (std.mem.eql(u8, entry.bytecode_key, bytecode)) {
                    if (entry.ref_count > 0) entry.ref_count -= 1;
                    return;
                }
            }
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

        for (&self.entries) |*entry_opt| {
            if (entry_opt.*) |*entry| {
                if (entry.ref_count == 0) {
                    self.allocator.free(entry.schedule);
                    self.allocator.free(entry.jump_table_entries);
                    entry_opt.* = null;
                }
            }
        }

        self.hits = 0;
        self.misses = 0;
        self.access_counter = 0;
    }
};

// TODO: We need to properly think about threads. I think it's possible we want to handle threads via violently erroring if we detect the same EVM instance
// // is on more than 1 thread
/// Global dispatch cache instance
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
