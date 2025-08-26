//! Schedule-based bytecode analysis and optimization engine.
//!
//! This is an alternative implementation to planner.zig that generates
//! Schedule objects instead of Plan objects. Schedules use null-terminated
//! unbounded arrays for better cache locality and tail-call optimization.
//!
//! Key differences from planner.zig:
//! - Generates Schedule objects with unbounded handler arrays
//! - Optimized for continuation-passing style execution
//! - Uses OpcodeHandler functions instead of HandlerFn
//! - Linear memory layout for improved cache performance

const std = @import("std");
const log = @import("log.zig");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;
const stack_frame_mod = @import("stack_frame.zig");
const Hardfork = @import("hardfork.zig").Hardfork;

/// Configuration for Schedule-based planner
pub const Planner2Config = struct {
    /// Maximum bytecode size for analysis
    max_bytecode_size: usize = 24576,
    /// Word type for constants (u256, u128, etc.)
    WordType: type = u256,
    /// Maximum schedule array size
    max_schedule_size: usize = 65536,
    /// Enable aggressive tail call optimization
    enable_tail_calls: bool = true,
    /// Optimize for code size over performance
    optimize_for_size: bool = false,
    /// Stack height tracking type
    StackHeightType: type = i16,
    
    pub fn validate(self: @This()) void {
        if (self.max_bytecode_size == 0) @compileError("max_bytecode_size must be > 0");
        if (self.max_schedule_size == 0) @compileError("max_schedule_size must be > 0");
        if (@bitSizeOf(self.StackHeightType) < 16) @compileError("StackHeightType must be at least 16 bits");
    }
    
    pub fn PcType(self: @This()) type {
        if (self.max_bytecode_size <= std.math.maxInt(u16)) {
            return u16;
        } else if (self.max_bytecode_size <= std.math.maxInt(u32)) {
            return u32;
        } else {
            @compileError("max_bytecode_size too large");
        }
    }
};

/// Metadata for jump destinations with stack height tracking
pub const JumpDestMetadata = packed struct(u64) {
    gas: u32 = 0,
    min_stack: i16 = 0,
    max_stack: i16 = 0,
};

/// Metadata for inline push values (small constants)
pub const PushInlineMetadata = packed struct(u64) {
    value: u64,
};

/// Metadata for push pointer values (large constants)
pub const PushPointerMetadata = packed struct(u64) {
    value_ptr: *const u256,
};

/// Metadata for PC tracking
pub fn PcMetadata(comptime PcType: type) type {
    return packed struct {
        value: PcType,
    };
}

/// Schedule item union for different types of execution data
pub fn ScheduleItem(comptime PcType: type, comptime FrameType: type) type {
    return union(enum) {
        opcode_handler: *const fn(FrameType, Schedule(PcType, FrameType)) FrameType.Error!FrameType.Success,
        jump_dest: JumpDestMetadata,
        push_inline: PushInlineMetadata,
        push_pointer: PushPointerMetadata,
        pc: PcMetadata(PcType),
    };
}

/// Schedule data structure - unbounded array with null termination
pub fn Schedule(comptime PcType: type, comptime FrameType: type) type {
    return struct {
        const Self = @This();
        const Item = ScheduleItem(PcType, FrameType);
        
        items: [*:null]const ?*const Item,
        
        /// Extract opcode-specific data and advance schedule pointer
        pub fn getOpData(self: Self, comptime opcode: Opcode) switch (opcode) {
            .PC => struct { metadata: PcMetadata(PcType), next: Self },
            .PUSH1 => struct { metadata: PushInlineMetadata, next: Self },
            .JUMPDEST => struct { metadata: JumpDestMetadata, next: Self },
            else => struct { next: Self },
        } {
            return switch (opcode) {
                .PC => .{
                    .metadata = self.items[0].?.pc,
                    .next = Self{ .items = self.items + 2 },
                },
                .PUSH1 => .{
                    .metadata = self.items[0].?.push_inline,
                    .next = Self{ .items = self.items + 2 },
                },
                .JUMPDEST => .{
                    .metadata = self.items[0].?.jump_dest,
                    .next = Self{ .items = self.items + 2 },
                },
                else => .{
                    .next = Self{ .items = self.items + 1 },
                },
            };
        }
    };
}

/// Schedule-based planner implementation
pub fn Planner2(comptime config: Planner2Config) type {
    comptime config.validate();
    
    return struct {
        const Self = @This();
        const PcType = config.PcType();
        const FrameConfig = @import("frame_config.zig").FrameConfig{
            .WordType = config.WordType,
            .max_bytecode_size = config.max_bytecode_size,
        };
        const FrameType = stack_frame_mod.StackFrame(FrameConfig);
        const ScheduleType = Schedule(PcType, FrameType);
        const Item = ScheduleType.Item;
        
        /// Cache entry for compiled schedules
        const CacheEntry = struct {
            key_hash: u64,
            schedule: *const ScheduleType,
            items: []const ?*const Item,
            constants: []const config.WordType,
            next: ?*@This() = null,
            prev: ?*@This() = null,
        };
        
        // Cache management
        allocator: std.mem.Allocator,
        cache_capacity: usize,
        cache_map: std.AutoHashMap(u64, *CacheEntry),
        cache_head: ?*CacheEntry = null,
        cache_tail: ?*CacheEntry = null,
        cache_count: usize = 0,
        
        // Statistics
        cache_hits: usize = 0,
        cache_misses: usize = 0,
        
        /// Initialize planner with LRU cache
        pub fn init(allocator: std.mem.Allocator, cache_capacity: usize) !Self {
            return .{
                .allocator = allocator,
                .cache_capacity = cache_capacity,
                .cache_map = std.AutoHashMap(u64, *CacheEntry).init(allocator),
            };
        }
        
        /// Deinitialize planner and free cache
        pub fn deinit(self: *Self) void {
            var entry = self.cache_head;
            while (entry) |e| {
                const next = e.next;
                self.allocator.free(e.items);
                self.allocator.free(e.constants);
                self.allocator.destroy(e);
                entry = next;
            }
            self.cache_map.deinit();
        }
        
        /// Generate or retrieve cached schedule for bytecode
        pub fn getOrGenerate(
            self: *Self,
            bytecode: []const u8,
            handlers: [256]*const FrameType.OpcodeHandler,
            hardfork: Hardfork,
        ) !*const ScheduleType {
            // Generate cache key including hardfork rules
            var hasher = std.hash.Wyhash.init(0);
            hasher.update(bytecode);
            hasher.update(std.mem.asBytes(&hardfork));
            const key = hasher.final();
            
            // Check cache first
            if (self.cache_map.get(key)) |entry| {
                self.cache_hits += 1;
                self.moveToFront(entry);
                return entry.schedule;
            }
            
            // Cache miss - generate new schedule
            self.cache_misses += 1;
            const schedule_data = try self.generateSchedule(bytecode, handlers, hardfork);
            
            // Cache the result
            try self.cacheSchedule(key, schedule_data);
            
            return schedule_data.schedule;
        }
        
        /// Generate schedule from bytecode analysis
        fn generateSchedule(
            self: *Self,
            bytecode: []const u8,
            handlers: [256]*const FrameType.OpcodeHandler,
            hardfork: Hardfork,
        ) !struct {
            schedule: *const ScheduleType,
            items: []const ?*const Item,
            constants: []const config.WordType,
        } {
            _ = hardfork; // TODO: Use hardfork for gas cost calculations
            
            var items = std.ArrayList(?*const Item).init(self.allocator);
            defer items.deinit();
            
            var constants = std.ArrayList(config.WordType).init(self.allocator);
            defer constants.deinit();
            
            // Analyze bytecode and generate schedule items
            var pc: PcType = 0;
            while (pc < bytecode.len) {
                const opcode = std.meta.intToEnum(Opcode, bytecode[pc]) catch {
                    // Invalid opcode - add error handler
                    try items.append(null); // Null terminator for invalid opcodes
                    break;
                };
                
                switch (opcode) {
                    .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8,
                    .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16,
                    .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24,
                    .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => {
                        const push_size = @intFromEnum(opcode) - @intFromEnum(Opcode.PUSH1) + 1;
                        
                        // Add handler
                        const handler_item = try self.allocator.create(Item);
                        handler_item.* = .{ .opcode_handler = handlers[@intFromEnum(opcode)] };
                        try items.append(handler_item);
                        
                        // Add push data
                        if (push_size <= 8) {
                            // Small values - inline
                            var inline_value: u64 = 0;
                            const end_pc = @min(pc + 1 + push_size, bytecode.len);
                            var i: usize = 0;
                            while (pc + 1 + i < end_pc) : (i += 1) {
                                inline_value = (inline_value << 8) | bytecode[pc + 1 + i];
                            }
                            
                            const data_item = try self.allocator.create(Item);
                            data_item.* = .{ .push_inline = .{ .value = inline_value } };
                            try items.append(data_item);
                        } else {
                            // Large values - use constants array
                            var full_value: config.WordType = 0;
                            const end_pc = @min(pc + 1 + push_size, bytecode.len);
                            var i: usize = 0;
                            while (pc + 1 + i < end_pc) : (i += 1) {
                                full_value = (full_value << 8) | bytecode[pc + 1 + i];
                            }
                            
                            try constants.append(full_value);
                            const value_ptr = &constants.items[constants.items.len - 1];
                            
                            const data_item = try self.allocator.create(Item);
                            data_item.* = .{ .push_pointer = .{ .value_ptr = value_ptr } };
                            try items.append(data_item);
                        }
                        
                        pc += 1 + push_size;
                    },
                    
                    .JUMPDEST => {
                        // Add handler
                        const handler_item = try self.allocator.create(Item);
                        handler_item.* = .{ .opcode_handler = handlers[@intFromEnum(opcode)] };
                        try items.append(handler_item);
                        
                        // Add jump destination metadata
                        const metadata_item = try self.allocator.create(Item);
                        metadata_item.* = .{ .jump_dest = .{
                            .gas = 1, // Base gas cost for JUMPDEST
                            .min_stack = 0, // TODO: Proper stack analysis
                            .max_stack = 0,
                        } };
                        try items.append(metadata_item);
                        
                        pc += 1;
                    },
                    
                    else => {
                        // Regular opcode - just add handler
                        const handler_item = try self.allocator.create(Item);
                        handler_item.* = .{ .opcode_handler = handlers[@intFromEnum(opcode)] };
                        try items.append(handler_item);
                        
                        pc += 1;
                    },
                }
            }
            
            // Add null terminator
            try items.append(null);
            
            // Create final schedule
            const items_slice = try items.toOwnedSlice();
            const constants_slice = try constants.toOwnedSlice();
            
            const schedule = try self.allocator.create(ScheduleType);
            schedule.* = .{ .items = items_slice.ptr };
            
            return .{
                .schedule = schedule,
                .items = items_slice,
                .constants = constants_slice,
            };
        }
        
        /// Cache a generated schedule
        fn cacheSchedule(
            self: *Self,
            key: u64,
            data: struct {
                schedule: *const ScheduleType,
                items: []const ?*const Item,
                constants: []const config.WordType,
            },
        ) !void {
            // Evict if cache is full
            if (self.cache_count >= self.cache_capacity) {
                if (self.cache_tail) |tail| {
                    _ = self.cache_map.remove(tail.key_hash);
                    self.removeFromList(tail);
                    self.allocator.free(tail.items);
                    self.allocator.free(tail.constants);
                    self.allocator.destroy(tail);
                    self.cache_count -= 1;
                }
            }
            
            // Create new cache entry
            const entry = try self.allocator.create(CacheEntry);
            entry.* = .{
                .key_hash = key,
                .schedule = data.schedule,
                .items = data.items,
                .constants = data.constants,
            };
            
            // Add to cache
            try self.cache_map.put(key, entry);
            self.addToFront(entry);
            self.cache_count += 1;
        }
        
        /// Move cache entry to front of LRU list
        fn moveToFront(self: *Self, entry: *CacheEntry) void {
            if (self.cache_head == entry) return;
            
            self.removeFromList(entry);
            self.addToFront(entry);
        }
        
        /// Add entry to front of LRU list
        fn addToFront(self: *Self, entry: *CacheEntry) void {
            entry.next = self.cache_head;
            entry.prev = null;
            
            if (self.cache_head) |head| {
                head.prev = entry;
            } else {
                self.cache_tail = entry;
            }
            
            self.cache_head = entry;
        }
        
        /// Remove entry from LRU list
        fn removeFromList(self: *Self, entry: *CacheEntry) void {
            if (entry.prev) |prev| {
                prev.next = entry.next;
            } else {
                self.cache_head = entry.next;
            }
            
            if (entry.next) |next| {
                next.prev = entry.prev;
            } else {
                self.cache_tail = entry.prev;
            }
        }
    };
}

// Tests
test "Planner2 basic initialization" {
    const allocator = std.testing.allocator;
    
    const config = Planner2Config{};
    var planner = try Planner2(config).init(allocator, 10);
    defer planner.deinit();
    
    try std.testing.expect(planner.cache_capacity == 10);
    try std.testing.expect(planner.cache_count == 0);
}

test "Schedule getOpData functionality" {
    const allocator = std.testing.allocator;
    defer _ = allocator;
    
    const config = Planner2Config{};
    const FrameType = stack_frame_mod.StackFrame(.{});
    const ScheduleType = Schedule(u16, FrameType);
    
    // Create simple test schedule with PC metadata
    const pc_item = ScheduleType.Item{ .pc = .{ .value = 42 } };
    const null_item: ?*const ScheduleType.Item = null;
    const items = [_]?*const ScheduleType.Item{ &pc_item, null_item };
    
    const schedule = ScheduleType{ .items = items[0..].ptr };
    const result = schedule.getOpData(.PC);
    
    try std.testing.expect(result.metadata.value == 42);
}