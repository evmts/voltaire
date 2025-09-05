const std = @import("std");
const keccak_asm = @import("keccak_asm.zig");
const dispatch_mod = @import("dispatch.zig");
const bytecode_mod = @import("bytecode.zig");
const frame_mod = @import("frame.zig");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("log.zig");

/// Cached analysis for a specific bytecode - generic over frame config
pub fn CachedAnalysis(comptime config: FrameConfig) type {
    return struct {
        const Self = @This();
        const FrameType = frame_mod.Frame(config);
        const Dispatch = dispatch_mod.Dispatch(FrameType);
        const Bytecode = bytecode_mod.Bytecode(.{
            .max_bytecode_size = config.max_bytecode_size,
            .fusions_enabled = true,
        });

        /// The analyzed bytecode
        bytecode: *Bytecode,
        /// The dispatch schedule (owned by cache)
        schedule: []const Dispatch.Item,
        /// The jump table (owned by cache)
        jump_table: Dispatch.JumpTable,
        /// Reference count for this entry
        ref_count: u32,

        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            self.bytecode.deinit();
            allocator.destroy(self.bytecode);
            allocator.free(self.schedule);
            allocator.free(self.jump_table.entries);
        }
    };
}

/// LRU cache for bytecode analysis
pub fn AnalysisCache(comptime config: FrameConfig) type {
    return struct {
        const Self = @This();
        const FrameType = frame_mod.Frame(config);
        const Dispatch = dispatch_mod.Dispatch(FrameType);
        const Bytecode = bytecode_mod.Bytecode(.{
            .max_bytecode_size = config.max_bytecode_size,
            // TODO we should get this from evm config
            .fusions_enabled = true,
        });
        const CachedAnalysisType = CachedAnalysis(config);

        /// Cache entry in the linked list
        const CacheEntry = struct {
            /// Hash of the bytecode
            hash: [32]u8,
            /// The cached analysis
            analysis: CachedAnalysisType,
            /// Previous entry in LRU list
            prev: ?*CacheEntry,
            /// Next entry in LRU list
            next: ?*CacheEntry,
        };

        /// Maximum number of cached entries
        max_entries: usize,
        /// Current number of entries
        entry_count: usize,
        /// Hash map for O(1) lookup
        map: std.hash_map.HashMap([32]u8, *CacheEntry, HashContext, 80),
        /// Head of LRU list (most recently used)
        head: ?*CacheEntry,
        /// Tail of LRU list (least recently used)
        tail: ?*CacheEntry,
        /// Allocator for cache operations
        allocator: std.mem.Allocator,
        /// Statistics
        hits: u64,
        misses: u64,
        evictions: u64,

        const HashContext = struct {
            pub fn hash(_: HashContext, key: [32]u8) u64 {
                // Use first 8 bytes of hash as the map key
                return std.mem.readInt(u64, key[0..8], .big);
            }

            pub fn eql(_: HashContext, a: [32]u8, b: [32]u8) bool {
                return std.mem.eql(u8, &a, &b);
            }
        };

        /// Initialize the cache with a maximum number of entries
        pub fn init(allocator: std.mem.Allocator, max_entries: usize) !Self {
            return Self{
                .max_entries = max_entries,
                .entry_count = 0,
                .map = std.hash_map.HashMap([32]u8, *CacheEntry, HashContext, 80).init(allocator),
                .head = null,
                .tail = null,
                .allocator = allocator,
                .hits = 0,
                .misses = 0,
                .evictions = 0,
            };
        }

        /// Clean up the cache and all cached entries
        pub fn deinit(self: *Self) void {
            // Free all cache entries
            var current = self.head;
            while (current) |entry| {
                const next = entry.next;
                entry.analysis.deinit(self.allocator);
                self.allocator.destroy(entry);
                current = next;
            }
            self.map.deinit();

            log.debug("AnalysisCache stats: hits={}, misses={}, evictions={}", .{ self.hits, self.misses, self.evictions });
        }

        /// Get or create analysis for the given bytecode
        /// Returns analysis that matches the current frame config
        pub fn getOrCreate(
            self: *Self,
            bytecode_raw: []const u8,
        ) !CachedAnalysisType {
            // Always use the frame's handlers for this config
            const handlers = &FrameType.opcode_handlers;
            // Hash the bytecode
            var hash: [32]u8 = undefined;
            try keccak_asm.keccak256(bytecode_raw, &hash);

            // Check if we have it cached
            if (self.map.get(hash)) |entry| {
                self.hits += 1;
                // Move to front of LRU list
                self.moveToFront(entry);
                entry.analysis.ref_count += 1;
                log.debug("Cache hit for bytecode hash: {x}", .{hash[0..8].*});
                return entry.analysis;
            }

            self.misses += 1;
            log.debug("Cache miss for bytecode hash: {x}, creating new analysis", .{hash[0..8].*});

            // Create new analysis
            var bytecode = try self.allocator.create(Bytecode);
            errdefer self.allocator.destroy(bytecode);

            bytecode.* = try Bytecode.init(self.allocator, bytecode_raw);
            errdefer bytecode.deinit();

            // Create dispatch schedule
            var schedule_raii = try Dispatch.DispatchSchedule.init(self.allocator, bytecode, handlers);
            defer schedule_raii.deinit();

            // Copy schedule to owned memory
            const schedule = try self.allocator.alloc(Dispatch.Item, schedule_raii.items.len);
            errdefer self.allocator.free(schedule);
            @memcpy(schedule, schedule_raii.items);

            // Create jump table
            const jump_table = try Dispatch.createJumpTable(self.allocator, schedule, bytecode);
            errdefer self.allocator.free(jump_table.entries);

            // Create cache entry
            const entry = try self.allocator.create(CacheEntry);
            errdefer self.allocator.destroy(entry);

            entry.* = CacheEntry{
                .hash = hash,
                .analysis = CachedAnalysisType{
                    .bytecode = bytecode,
                    .schedule = schedule,
                    .jump_table = jump_table,
                    .ref_count = 1,
                },
                .prev = null,
                .next = null,
            };

            // Add to cache
            try self.addEntry(entry);

            return entry.analysis;
        }

        /// Release a reference to a cached analysis
        pub fn release(self: *Self, bytecode_raw: []const u8) void {
            // Hash the bytecode
            var hash: [32]u8 = undefined;
            keccak_asm.keccak256(bytecode_raw, &hash) catch return;

            if (self.map.get(hash)) |entry| {
                if (entry.analysis.ref_count > 0) {
                    entry.analysis.ref_count -= 1;
                }
            }
        }

        /// Add an entry to the cache
        fn addEntry(self: *Self, entry: *CacheEntry) !void {
            // Check if we need to evict
            if (self.entry_count >= self.max_entries) {
                self.evictLRU();
            }

            // Add to map
            try self.map.put(entry.hash, entry);

            // Add to front of LRU list
            entry.next = self.head;
            entry.prev = null;

            if (self.head) |head| {
                head.prev = entry;
            }
            self.head = entry;

            if (self.tail == null) {
                self.tail = entry;
            }

            self.entry_count += 1;
        }

        /// Move an entry to the front of the LRU list
        fn moveToFront(self: *Self, entry: *CacheEntry) void {
            // If already at front, nothing to do
            if (self.head == entry) return;

            // Remove from current position
            if (entry.prev) |prev| {
                prev.next = entry.next;
            }
            if (entry.next) |next| {
                next.prev = entry.prev;
            }
            if (self.tail == entry) {
                self.tail = entry.prev;
            }

            // Add to front
            entry.next = self.head;
            entry.prev = null;
            if (self.head) |head| {
                head.prev = entry;
            }
            self.head = entry;
        }

        /// Evict the least recently used entry
        fn evictLRU(self: *Self) void {
            if (self.tail) |tail| {
                // Don't evict if it's still referenced
                if (tail.analysis.ref_count > 0) {
                    log.debug("Warning: Evicting entry with ref_count={}", .{tail.analysis.ref_count});
                }

                // Remove from map
                _ = self.map.remove(tail.hash);

                // Remove from list
                if (tail.prev) |prev| {
                    prev.next = null;
                    self.tail = prev;
                } else {
                    self.head = null;
                    self.tail = null;
                }

                // Free the entry
                tail.analysis.deinit(self.allocator);
                self.allocator.destroy(tail);

                self.entry_count -= 1;
                self.evictions += 1;

                log.debug("Evicted LRU entry, cache size now: {}", .{self.entry_count});
            }
        }

        /// Clear the entire cache
        pub fn clear(self: *Self) void {
            var current = self.head;
            while (current) |entry| {
                const next = entry.next;
                _ = self.map.remove(entry.hash);
                entry.analysis.deinit(self.allocator);
                self.allocator.destroy(entry);
                current = next;
            }
            self.head = null;
            self.tail = null;
            self.entry_count = 0;
        }
    };
}
