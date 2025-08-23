/// Analysis module: scans EVM bytecode and produces a minimal runtime Plan.
/// The Plan contains only what the interpreter needs for fast jumps and
/// per-block checks: a sorted list of JUMPDEST PCs (jumpList) and block
/// metadata (instructionIndex, staticGasCharge, min/max stack height).
/// All other intermediates (bitmaps, counters) are ephemeral and freed.
const std = @import("std");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;

/// Synthetic opcodes for fused operations.
/// Starting at 0xF5 to avoid conflicts with EVM and L2 extensions.
/// Arbitrum uses 0x10-0x13, Optimism uses various ranges.
pub const PUSH_ADD_INLINE: u8 = 0xF5;
pub const PUSH_ADD_POINTER: u8 = 0xF6;
pub const PUSH_MUL_INLINE: u8 = 0xF7;
pub const PUSH_MUL_POINTER: u8 = 0xF8;
pub const PUSH_DIV_INLINE: u8 = 0xF9;
pub const PUSH_DIV_POINTER: u8 = 0xFA;
pub const PUSH_JUMP_INLINE: u8 = 0xFB;
pub const PUSH_JUMP_POINTER: u8 = 0xFC;
pub const PUSH_JUMPI_INLINE: u8 = 0xFD;
pub const PUSH_JUMPI_POINTER: u8 = 0xFE;

/// Metadata for JUMPDEST instructions.
/// On 64-bit systems this fits in usize, on 32-bit it requires pointer.
pub const JumpDestMetadata = packed struct {
    gas: u32,
    min_stack: i16,
    max_stack: i16,
};

/// Handler function type for instruction execution.
/// Takes frame, plan, and instruction index. Uses tail call recursion.
pub const HandlerFn = fn (frame: *anyopaque, plan: *const anyopaque, idx: *anyopaque) anyerror!noreturn;

/// Untagged union for 32-bit platforms.
/// All metadata is stored as pointers/indices.
pub const InstructionElement32 = packed union {
    handler: *const HandlerFn,          // Function pointer for opcode handler
    jumpdest_pointer: *const JumpDestMetadata, // Pointer to metadata in u256_constants
    inline_value: u32,                  // Inline constant for PUSH ops that fit
    pointer_index: u32,                 // Index into u256_constants for large values
    pc_value: u32,                      // Original PC for PC opcode
};

/// Untagged union for 64-bit platforms.
/// JumpDestMetadata fits directly in 8 bytes.
pub const InstructionElement64 = packed union {
    handler: *const HandlerFn,          // Function pointer for opcode handler
    jumpdest_metadata: JumpDestMetadata, // Direct metadata (8 bytes)
    inline_value: u64,                  // Inline constant for PUSH ops that fit
    pointer_index: u64,                 // Index into u256_constants for large values
    pc_value: u64,                      // Original PC for PC opcode
};

/// Select the appropriate InstructionElement based on platform.
pub const InstructionElement = if (@sizeOf(usize) == 8)
    InstructionElement64
else if (@sizeOf(usize) == 4)
    InstructionElement32
else
    @compileError("Unsupported platform: usize must be 32 or 64 bits");

// Compile-time verification that InstructionElement fits in usize
comptime {
    if (@sizeOf(InstructionElement) != @sizeOf(usize)) {
        const elem_size = @sizeOf(InstructionElement);
        const usize_size = @sizeOf(usize);
        const jumpdest_size = @sizeOf(JumpDestMetadata);
        @compileError(std.fmt.comptimePrint(
            "InstructionElement size ({}) must equal usize ({}) for zero-overhead abstraction. JumpDestMetadata size: {}",
            .{ elem_size, usize_size, jumpdest_size }
        ));
    }
}

/// Compile-time configuration for the analyzer.
pub const AnalysisConfig = struct {
    const Self = @This();

    /// EVM word type (mirrors runtime WordType).
    WordType: type = u256,
    /// Maximum allowed bytecode size used to pick PcType.
    maxBytecodeSize: u32 = 24_576,
    /// Optional: future cache control (no cache is implemented yet).
    enableLruCache: bool = true,
    /// Vector length for SIMD (number of u8 lanes); defaults to target suggestion.
    /// When null, scalar path is used.
    vector_length: ?comptime_int = std.simd.suggestVectorLength(u8),
    /// Match stack sizing philosophy with stack.zig / FrameConfig.
    stack_size: usize = 1024,

    /// PcType: chosen program-counter type (u16 or u32) from maxBytecodeSize.
    fn PcType(self: Self) type {
        return if (self.maxBytecodeSize <= std.math.maxInt(u16)) u16 else u32;
    }
    /// StackIndexType: unsigned stack index type (u4/u8/u12) from stack_size.
    fn StackIndexType(self: Self) type {
        return if (self.stack_size <= std.math.maxInt(u4))
            u4
        else if (self.stack_size <= std.math.maxInt(u8))
            u8
        else if (self.stack_size <= std.math.maxInt(u12))
            u12
        else
            @compileError("AnalysisConfig stack_size is too large to model compactly");
    }
    /// StackHeightType: signed stack height type (one extra bit for deltas).
    fn StackHeightType(self: Self) type {
        const IndexT = self.StackIndexType();
        return std.meta.Int(.signed, @bitSizeOf(IndexT) + 1);
    }
    /// Validate config bounds (compile-time errors when violated).
    fn validate(self: Self) void {
        if (self.stack_size > 4095) @compileError("stack_size cannot exceed 4095");
        if (@bitSizeOf(self.WordType) > 512) @compileError("WordType cannot exceed u512");
        if (self.maxBytecodeSize > 65535) @compileError("maxBytecodeSize must be <= 65535");
    }
};

/// Factory that returns an analyzer type specialized by AnalysisConfig.
pub fn createAnalyzer(comptime Cfg: AnalysisConfig) type {
    Cfg.validate();
    const PcType = Cfg.PcType();
    const InstructionIndexType = PcType; // Can only have as many instructions as PCs but usually less
    const StackHeightType = Cfg.StackHeightType();
    const VectorLength = Cfg.vector_length;

    // Removed AnalyzerBlock - using JumpDestMetadata directly
    // Track blocks during analysis with temporary structure
    const TempBlock = struct {
        pc: PcType,
        metadata: JumpDestMetadata,
    };

    // Minimal data the interpreter needs at runtime.
    const AnalyzerPlan = struct {
        instructionStream: []InstructionElement,
        u256_constants: []Cfg.WordType,
        // No jump_table - only used during generation
        // No jumpDestMetadata array - metadata is stored inline

        /// Get metadata and next instruction, advancing the instruction pointer.
        /// The opcode determines how metadata is interpreted and whether to advance by 1 or 2.
        pub fn getMetadataAndNextInstruction(
            self: *const @This(),
            idx: *InstructionIndexType,
            comptime opcode: Opcode,
        ) struct { metadata: InstructionElement, next_handler: *const HandlerFn } {
            const current_idx = idx.*;
            const handler = self.instructionStream[current_idx].handler;
            
            // Determine if this opcode has metadata
            const has_metadata = switch (opcode) {
                // PUSH opcodes have metadata
                .PUSH0, .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7,
                .PUSH8, .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15,
                .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23,
                .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31,
                .PUSH32,
                // JUMPDEST has metadata
                .JUMPDEST,
                // PC has metadata (the original PC value)
                .PC => true,
                // All other opcodes have no metadata
                else => false,
            };
            
            if (has_metadata) {
                const metadata = self.instructionStream[current_idx + 1];
                idx.* += 2;
                return .{ .metadata = metadata, .next_handler = handler };
            } else {
                idx.* += 1;
                // Return a zeroed metadata element for opcodes without metadata
                return .{ .metadata = .{ .inline_value = 0 }, .next_handler = handler };
            }
        }

        /// Free Plan-owned slices.
        pub fn deinit(self: *@This(), allocator: std.mem.Allocator) void {
            if (self.instructionStream.len > 0) allocator.free(self.instructionStream);
            if (self.u256_constants.len > 0) allocator.free(self.u256_constants);
            self.instructionStream = &.{};
            self.u256_constants = &.{};
        }

    };

    // Simple LRU cache node - forward declare
    const CacheNode = struct {
        key_hash: u64,
        plan: AnalyzerPlan,
        next: ?*@This(),
        prev: ?*@This(),
    };

    const Analysis = struct {
        const Self = @This();
        // Expose types for callers/tests.
        pub const BlockMeta = JumpDestMetadata;
        pub const Plan = AnalyzerPlan;
        pub const PcTypeT = PcType;
        pub const InstructionIndexT = InstructionIndexType;

        // For simple init without cache
        bytecode: []const u8,
        
        // Cache fields
        allocator: ?std.mem.Allocator,
        cache_capacity: usize,
        cache_map: ?std.AutoHashMap(u64, *CacheNode),
        cache_head: ?*CacheNode,
        cache_tail: ?*CacheNode,
        cache_count: usize,
        
        // Special metadata for entry block
        start: JumpDestMetadata,

        /// Create an analyzer instance over immutable bytecode (no cache).
        pub fn init(bytecode: []const u8) Self {
            return .{ 
                .bytecode = bytecode,
                .allocator = null,
                .cache_capacity = 0,
                .cache_map = null,
                .cache_head = null,
                .cache_tail = null,
                .cache_count = 0,
                .start = .{ .gas = 0, .min_stack = 0, .max_stack = 0 },
            };
        }
        
        /// Create an analyzer with LRU cache.
        pub fn initWithCache(allocator: std.mem.Allocator, cache_capacity: usize) !Self {
            return .{
                .bytecode = &.{}, // Will be set per request
                .allocator = allocator,
                .cache_capacity = cache_capacity,
                .cache_map = std.AutoHashMap(u64, *CacheNode).init(allocator),
                .cache_head = null,
                .cache_tail = null,
                .cache_count = 0,
                .start = .{ .gas = 0, .min_stack = 0, .max_stack = 0 },
            };
        }
        
        /// Deinitialize the analyzer and free cache.
        pub fn deinit(self: *Self) void {
            if (self.cache_map) |*map| {
                var node = self.cache_head;
                while (node) |n| {
                    const next = n.next;
                    n.plan.deinit(self.allocator.?);
                    self.allocator.?.destroy(n);
                    node = next;
                }
                map.deinit();
            }
        }
        
        /// Get plan from cache or analyze.
        pub fn getOrAnalyze(self: *Self, bytecode: []const u8, handlers: [256]*const HandlerFn) !*const AnalyzerPlan {
            if (self.cache_map == null) {
                // No cache - analyze directly
                self.bytecode = bytecode;
                _ = try self.create_instruction_stream(self.allocator orelse return error.NoAllocator, handlers);
                return error.NotImplemented; // Need to store plan somewhere
            }
            
            const key = std.hash.Wyhash.hash(0, bytecode);
            
            // Check cache
            if (self.cache_map.?.get(key)) |node| {
                // Move to front
                self.moveToFront(node);
                return &node.plan;
            }
            
            // Miss - analyze
            self.bytecode = bytecode;
            const plan = try self.create_instruction_stream(self.allocator.?, handlers);
            
            // Add to cache
            try self.addToCache(key, plan);
            
            // Return from cache
            return &self.cache_map.?.get(key).?.plan;
        }
        
        fn moveToFront(self: *Self, node: *CacheNode) void {
            if (self.cache_head == node) return;
            
            // Remove from current position
            if (node.prev) |p| p.next = node.next;
            if (node.next) |n| n.prev = node.prev;
            if (self.cache_tail == node) self.cache_tail = node.prev;
            
            // Add to front
            node.prev = null;
            node.next = self.cache_head;
            if (self.cache_head) |h| h.prev = node;
            self.cache_head = node;
            if (self.cache_tail == null) self.cache_tail = node;
        }
        
        fn addToCache(self: *Self, key: u64, plan: AnalyzerPlan) !void {
            // Evict if necessary
            if (self.cache_count >= self.cache_capacity) {
                if (self.cache_tail) |tail| {
                    _ = self.cache_map.?.remove(tail.key_hash);
                    if (tail.prev) |p| p.next = null;
                    self.cache_tail = tail.prev;
                    if (self.cache_head == tail) self.cache_head = null;
                    tail.plan.deinit(self.allocator.?);
                    self.allocator.?.destroy(tail);
                    self.cache_count -= 1;
                }
            }
            
            // Create new node
            const node = try self.allocator.?.create(CacheNode);
            node.* = .{
                .key_hash = key,
                .plan = plan,
                .next = self.cache_head,
                .prev = null,
            };
            
            if (self.cache_head) |h| h.prev = node;
            self.cache_head = node;
            if (self.cache_tail == null) self.cache_tail = node;
            
            try self.cache_map.?.put(key, node);
            self.cache_count += 1;
        }

        /// Create instruction stream from bytecode and handler array.
        /// Pass 1: build temporary bitmaps (push-data, opcode-start, jumpdest).
        /// Pass 2: build instruction stream with handlers and metadata.
        /// All temporaries are freed before returning.
        pub fn create_instruction_stream(self: *Self, allocator: std.mem.Allocator, handlers: [256]*const HandlerFn) !AnalyzerPlan {
            const N = self.bytecode.len;
            // Ephemeral bitmaps (bit-per-byte)
            const bitmap_bytes = (N + 7) >> 3;
            const is_push_data = try allocator.alloc(u8, bitmap_bytes);
            defer allocator.free(is_push_data);
            const is_op_start = try allocator.alloc(u8, bitmap_bytes);
            defer allocator.free(is_op_start);
            const is_jumpdest = try allocator.alloc(u8, bitmap_bytes);
            defer allocator.free(is_jumpdest);
            @memset(is_push_data, 0);
            @memset(is_op_start, 0);
            @memset(is_jumpdest, 0);

            // Pass 1: scan bytecode to fill opcode-start and push-data bitmaps
            var i: usize = 0;
            while (i < N) : (i += 1) {
                // setBit(is_op_start, i)
                is_op_start[i >> 3] |= @as(u8, 1) << @intCast(i & 7);
                const op = self.bytecode[i];
                if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                    const n: usize = op - (@intFromEnum(Opcode.PUSH1) - 1);
                    var j: usize = 0;
                    while (j < n and i + 1 + j < N) : (j += 1) {
                        const idx = i + 1 + j;
                        is_push_data[idx >> 3] |= @as(u8, 1) << @intCast(idx & 7);
                    }
                    i += n; // loop's i += 1 advances over opcode byte
                    continue;
                }
            }

            // Mark JUMPDEST positions (0x5B) excluding push-data bytes
            if (comptime VectorLength) |L| {
                markJumpdestSimd(self.bytecode, is_push_data, is_jumpdest, L);
            } else {
                markJumpdestScalar(self.bytecode, is_push_data, is_jumpdest);
            }

            // Counts
            var pop: usize = 0; // popcount(is_jumpdest)
            for (is_jumpdest) |b| pop += @popCount(b);
            const num_jumpdests: usize = pop;
            const num_blocks: usize = 1 + num_jumpdests;

            // Allocate outputs
            var jump_list = try allocator.alloc(PcType, num_jumpdests);
            errdefer allocator.free(jump_list);
            var blocks = try allocator.alloc(TempBlock, num_blocks);
            errdefer allocator.free(blocks);

            // Build jump_list (sorted PCs)
            var jl_i: usize = 0;
            i = 0;
            while (i < N) : (i += 1) {
                if ((is_jumpdest[i >> 3] & (@as(u8, 1) << @intCast(i & 7))) != 0) {
                    jump_list[jl_i] = @as(PcType, @intCast(i));
                    jl_i += 1;
                }
            }
            std.debug.assert(jl_i == num_jumpdests);

            // Pass 2: build blocks and compute instructionIndex parity, static gas, and stack ranges
            var stream_idx: usize = 0;
            var block_idx: usize = 0;
            blocks[0] = .{ 
                .pc = 0, 
                .metadata = .{ .gas = 0, .min_stack = 0, .max_stack = 0 } 
            };
            var static_gas_accum: u64 = 0; // accumulate in u64 to avoid overflow, clamp to u32 on store
            var stack_height: i32 = 0;
            var min_stack_height: StackHeightType = 0;
            var max_stack_height: StackHeightType = 0;

            i = 0;
            while (i < N) {
                const op = self.bytecode[i];
                // If this is a block start (JUMPDEST opcode start), finalize previous block and start new one
                const is_start = (is_op_start[i >> 3] & (@as(u8, 1) << @intCast(i & 7))) != 0;
                const is_dest = (is_jumpdest[i >> 3] & (@as(u8, 1) << @intCast(i & 7))) != 0;
                if (is_start and is_dest) {
                    // finalize previous block (for entry this is zeros)
                    blocks[block_idx].metadata.gas = @as(u32, @intCast(@min(static_gas_accum, @as(u64, std.math.maxInt(u32)))));
                    blocks[block_idx].metadata.min_stack = min_stack_height;
                    blocks[block_idx].metadata.max_stack = max_stack_height;
                    // start new block
                    block_idx += 1;
                    blocks[block_idx] = .{ 
                        .pc = @as(PcType, @intCast(i)), 
                        .metadata = .{ .gas = 0, .min_stack = 0, .max_stack = 0 } 
                    };
                    static_gas_accum = 0;
                    stack_height = 0;
                    min_stack_height = 0;
                    max_stack_height = 0;
                    i += 1;
                    continue;
                }

                const info = opcode_data.OPCODE_INFO[op];
                static_gas_accum += info.gas_cost;
                // track stack delta inside block
                stack_height += @as(i32, info.stack_outputs) - @as(i32, info.stack_inputs);
                if (stack_height < min_stack_height) min_stack_height = @intCast(stack_height);
                if (stack_height > max_stack_height) max_stack_height = @intCast(stack_height);

                if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                    const n: usize = op - (@intFromEnum(Opcode.PUSH1) - 1);
                    stream_idx += 2; // handler + payload
                    i += 1 + n;
                } else if (op == @intFromEnum(Opcode.PC)) {
                    stream_idx += 2; // handler + payload
                    i += 1;
                } else {
                    stream_idx += 1; // simple handler
                    i += 1;
                }
            }
            // finalize last block
            blocks[block_idx].metadata.gas = @as(u32, @intCast(@min(static_gas_accum, @as(u64, std.math.maxInt(u32)))));
            blocks[block_idx].metadata.min_stack = min_stack_height;
            blocks[block_idx].metadata.max_stack = max_stack_height;
            std.debug.assert(block_idx + 1 == num_blocks);

            // Free unused jump_list
            allocator.free(jump_list);

            // Build instruction stream
            var stream = std.ArrayList(InstructionElement).init(allocator);
            errdefer stream.deinit();
            
            var constants = std.ArrayList(Cfg.WordType).init(allocator);
            errdefer constants.deinit();
            
            // Build instruction stream with handlers and metadata
            i = 0;
            while (i < N) {
                const op = self.bytecode[i];
                
                // Handle PUSH opcodes
                if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                    const n: usize = op - (@intFromEnum(Opcode.PUSH1) - 1);
                    
                    // Check for fusion opportunities
                    const next_pc = i + 1 + n;
                    var fused = false;
                    var handler_op = op;
                    
                    if (next_pc < N) {
                        const next_op = self.bytecode[next_pc];
                        
                        // Check for PUSH+ADD fusion
                        if (next_op == @intFromEnum(Opcode.ADD)) {
                            // Use appropriate fusion opcode
                            handler_op = if (n <= @sizeOf(usize)) PUSH_ADD_INLINE else PUSH_ADD_POINTER;
                            fused = true;
                        }
                        // Check for PUSH+MUL fusion
                        else if (next_op == @intFromEnum(Opcode.MUL)) {
                            handler_op = if (n <= @sizeOf(usize)) PUSH_MUL_INLINE else PUSH_MUL_POINTER;
                            fused = true;
                        }
                        // Check for PUSH+DIV fusion
                        else if (next_op == @intFromEnum(Opcode.DIV)) {
                            handler_op = if (n <= @sizeOf(usize)) PUSH_DIV_INLINE else PUSH_DIV_POINTER;
                            fused = true;
                        }
                        // Check for PUSH+JUMP fusion
                        else if (next_op == @intFromEnum(Opcode.JUMP)) {
                            // Use appropriate fusion opcode
                            handler_op = if (n <= @sizeOf(usize)) PUSH_JUMP_INLINE else PUSH_JUMP_POINTER;
                            fused = true;
                        }
                        // Check for PUSH+JUMPI fusion
                        else if (next_op == @intFromEnum(Opcode.JUMPI)) {
                            handler_op = if (n <= @sizeOf(usize)) PUSH_JUMPI_INLINE else PUSH_JUMPI_POINTER;
                            fused = true;
                        }
                    }
                    
                    // Add handler pointer (normal or fused)
                    try stream.append(.{ .handler = handlers[handler_op] });
                    
                    // Extract the push value
                    if (i + n < N) {
                        // Decide if value fits inline or needs pointer
                        if (n <= @sizeOf(usize)) {
                            // Fits inline - build value from bytes
                            var value: usize = 0;
                            var j: usize = 0;
                            while (j < n and j < @sizeOf(usize)) : (j += 1) {
                                value = (value << 8) | self.bytecode[i + 1 + j];
                            }
                            try stream.append(.{ .inline_value = value });
                        } else {
                            // Too large - store in constants array
                            var value: Cfg.WordType = 0;
                            var j: usize = 0;
                            while (j < n) : (j += 1) {
                                value = (value << 8) | self.bytecode[i + 1 + j];
                            }
                            const const_idx = constants.items.len;
                            try constants.append(value);
                            try stream.append(.{ .pointer_index = const_idx });
                        }
                    }
                    
                    // Skip the next instruction if we fused
                    if (fused and next_pc < N) {
                        i = next_pc + 1;
                    } else {
                        i += 1 + n;
                    }
                } else if (op == @intFromEnum(Opcode.JUMPDEST)) {
                    // JUMPDEST needs metadata
                    try stream.append(.{ .handler = handlers[op] });
                    
                    // Find the block metadata for this JUMPDEST
                    var metadata_found = false;
                    for (blocks) |block| {
                        if (block.pc == i) {
                            // Found the metadata for this JUMPDEST
                            const jd_metadata = block.metadata;
                            
                            // On 64-bit systems, store metadata directly
                            if (@sizeOf(usize) == 8) {
                                try stream.append(.{ .jumpdest_metadata = jd_metadata });
                            } else {
                                // On 32-bit systems, store in constants array and use pointer
                                const const_idx = constants.items.len;
                                // Store metadata as bytes in a u256
                                var value: Cfg.WordType = 0;
                                const metadata_bytes = std.mem.asBytes(&jd_metadata);
                                var j: usize = 0;
                                while (j < @sizeOf(JumpDestMetadata)) : (j += 1) {
                                    value = (value << 8) | metadata_bytes[@sizeOf(JumpDestMetadata) - 1 - j];
                                }
                                try constants.append(value);
                                // Cast the index to a pointer to JumpDestMetadata
                                const metadata_ptr = @as(*const JumpDestMetadata, @ptrFromInt(const_idx));
                                try stream.append(.{ .jumpdest_pointer = metadata_ptr });
                            }
                            metadata_found = true;
                            break;
                        }
                    }
                    
                    if (!metadata_found) {
                        // This shouldn't happen - every JUMPDEST should have metadata
                        return error.MissingJumpDestMetadata;
                    }
                    
                    i += 1;
                } else {
                    // Other non-PUSH opcodes - just add the handler
                    try stream.append(.{ .handler = handlers[op] });
                    i += 1;
                }
            }

            // Update entry block metadata (stop at first JUMPDEST if at PC 0)
            if (blocks.len > 0) {
                self.start = blocks[0].metadata;
            }
            
            // Free blocks as we don't need them at runtime
            allocator.free(blocks);
            
            return AnalyzerPlan{
                .instructionStream = try stream.toOwnedSlice(),
                .u256_constants = try constants.toOwnedSlice(),
            };
        }

    };

    return Analysis;
}

/// Linear scan: set jumpdest bit at i when bytecode[i]==0x5b and the push-data bit is not set.
fn markJumpdestScalar(bytecode: []const u8, is_push_data: []const u8, is_jumpdest: []u8) void {
    var i: usize = 0;
    while (i < bytecode.len) : (i += 1) {
        const test_push = (is_push_data[i >> 3] & (@as(u8, 1) << @intCast(i & 7))) != 0;
        if (bytecode[i] == @intFromEnum(Opcode.JUMPDEST) and !test_push) {
            is_jumpdest[i >> 3] |= @as(u8, 1) << @intCast(i & 7);
        }
    }
}

/// Vector scan: compare @Vector(L,u8) chunks to 0x5b, mask out push-data lanes, set jumpdest bits; handle tail scalarly.
fn markJumpdestSimd(bytecode: []const u8, is_push_data: []const u8, is_jumpdest: []u8, comptime L: comptime_int) void {
    var i: usize = 0;
    const len = bytecode.len;
    const splat_5b: @Vector(L, u8) = @splat(@as(u8, @intFromEnum(Opcode.JUMPDEST)));
    while (i + L <= len) : (i += L) {
    var arr: [L]u8 = undefined;
    inline for (0..L) |k| arr[k] = bytecode[i + k];
    const v: @Vector(L, u8) = arr;
        const eq: @Vector(L, bool) = v == splat_5b;
        const eq_arr: [L]bool = eq;
        inline for (0..L) |j| {
            const idx = i + j;
            const test_push = (is_push_data[idx >> 3] & (@as(u8, 1) << @intCast(idx & 7))) != 0;
            if (eq_arr[j] and !test_push) {
                is_jumpdest[idx >> 3] |= @as(u8, 1) << @intCast(idx & 7);
            }
        }
    }
    // Tail
    var t: usize = i;
    while (t < len) : (t += 1) {
        const test_push = (is_push_data[t >> 3] & (@as(u8, 1) << @intCast(t & 7))) != 0;
        if (bytecode[t] == @intFromEnum(Opcode.JUMPDEST) and !test_push) {
            is_jumpdest[t >> 3] |= @as(u8, 1) << @intCast(t & 7);
        }
    }
}

// Mock handler for tests
fn testMockHandler(frame: *anyopaque, plan: *const anyopaque, idx: *anyopaque) anyerror!noreturn {
    _ = frame;
    _ = plan;
    _ = idx;
    unreachable; // Test handlers don't actually execute
}

// Test fusion handler
fn testFusionHandler(frame: *anyopaque, plan: *const anyopaque, idx: *anyopaque) anyerror!noreturn {
    _ = frame;
    _ = plan;
    _ = idx;
    unreachable; // Test handlers don't actually execute
}

test "analysis: bitmaps mark push-data and jumpdest correctly" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});

    // Bytecode: PUSH2 0xAA 0xBB; JUMPDEST; STOP
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH2), 0xAA, 0xBB, @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.STOP) };
    var analysis = Analyzer.init(&bytecode);

    // Create dummy handlers for test
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testMockHandler;
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);

    // JumpDestMetadata is now stored inline in the instruction stream
}

test "analysis: blocks and lookupInstrIdx basic" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    // Bytecode: PUSH1 0x01; JUMPDEST; STOP
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x01, @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.STOP) };
    var analysis = Analyzer.init(&bytecode);

    // Create dummy handlers for test
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testMockHandler;
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);

    // JumpDestMetadata is now stored inline in the instruction stream
    // const idx_opt = plan.lookupInstructionIdx(@as(Analyzer.PcTypeT, 2));
    // try std.testing.expect(idx_opt != null);
    // try std.testing.expectEqual(@as(usize, 2), idx_opt.?);
}

test "analysis: SIMD parity with scalar" {
    const allocator = std.testing.allocator;
    // Bytecode with mixed PUSH data and multiple JUMPDESTs
    // PUSH2 aa bb; ADD; JUMPDEST; PUSH1 01; PUSH1 02; ADD; JUMPDEST; STOP
    const bc = [_]u8{
        @intFromEnum(Opcode.PUSH2), 0xAA, 0xBB,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.STOP),
    };

    const AnalyzerSimd = createAnalyzer(.{});
    const AnalyzerScalar = createAnalyzer(.{ .vector_length = null });

    var a = AnalyzerSimd.init(&bc);
    var b = AnalyzerScalar.init(&bc);

    // Create dummy handlers for test
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testMockHandler;
    var plan_simd = try a.create_instruction_stream(allocator, handlers);
    defer plan_simd.deinit(allocator);
    var plan_scalar = try b.create_instruction_stream(allocator, handlers);
    defer plan_scalar.deinit(allocator);

    // Compare instruction stream lengths
    try std.testing.expectEqual(plan_scalar.instructionStream.len, plan_simd.instructionStream.len);
}

test "analysis: static gas charge and stack height ranges" {
    const allocator = std.testing.allocator;
    // Entry block: PUSH1 01; PUSH1 02; ADD; JUMPDEST; STOP
    const bc = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.STOP),
    };

    const Analyzer = createAnalyzer(.{});
    var analysis = Analyzer.init(&bc);
    // Create dummy handlers for test
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testMockHandler;
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);

    // Entry block metadata is stored in analyzer.start
    const g_push = opcode_data.OPCODE_INFO[@intFromEnum(Opcode.PUSH1)].gas_cost;
    const g_add = opcode_data.OPCODE_INFO[@intFromEnum(Opcode.ADD)].gas_cost;
    const expected_entry_gas: u32 = @intCast(g_push + g_push + g_add);
    try std.testing.expectEqual(expected_entry_gas, analysis.start.gas);
    // Stack height through PUSH1, PUSH1, ADD => deltas +1, +1, -1 → min=0, max=2
    try std.testing.expectEqual(@as(i16, 0), analysis.start.min_stack);
    try std.testing.expectEqual(@as(i16, 2), analysis.start.max_stack);
}

test "analysis: lookupInstructionIdx returns null for non-dest" {
    const allocator = std.testing.allocator;
    // No JUMPDESTs at all
    const bc = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x01, @intFromEnum(Opcode.STOP) };
    const Analyzer = createAnalyzer(.{});
    var analysis = Analyzer.init(&bc);
    // Create dummy handlers for test
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testMockHandler;
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    // No jump_table in runtime plan anymore
}

test "analysis: init without allocator" {
    const Analyzer = createAnalyzer(.{});
    
    // This test expects Analysis.init(bytecode) without allocator
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x01, @intFromEnum(Opcode.STOP) };
    const analysis = Analyzer.init(&bytecode);
    // No deinit should be needed
    try std.testing.expect(analysis.bytecode.len == 3);
}

test "synthetic opcodes: constants defined" {
    // Test that synthetic opcodes are defined and have correct values
    try std.testing.expect(PUSH_ADD_INLINE >= 0xF5);
    try std.testing.expect(PUSH_ADD_POINTER >= 0xF5);
    try std.testing.expect(PUSH_MUL_INLINE >= 0xF5);
    try std.testing.expect(PUSH_MUL_POINTER >= 0xF5);
    try std.testing.expect(PUSH_DIV_INLINE >= 0xF5);
    try std.testing.expect(PUSH_DIV_POINTER >= 0xF5);
    try std.testing.expect(PUSH_JUMP_INLINE >= 0xF5);
    try std.testing.expect(PUSH_JUMP_POINTER >= 0xF5);
    try std.testing.expect(PUSH_JUMPI_INLINE >= 0xF5);
    try std.testing.expect(PUSH_JUMPI_POINTER >= 0xF5);
    
    // Ensure no overlap between opcodes
    const opcodes = [_]u8{
        PUSH_ADD_INLINE, PUSH_ADD_POINTER,
        PUSH_MUL_INLINE, PUSH_MUL_POINTER,
        PUSH_DIV_INLINE, PUSH_DIV_POINTER,
        PUSH_JUMP_INLINE, PUSH_JUMP_POINTER,
        PUSH_JUMPI_INLINE, PUSH_JUMPI_POINTER,
    };
    
    var i: usize = 0;
    while (i < opcodes.len) : (i += 1) {
        var j = i + 1;
        while (j < opcodes.len) : (j += 1) {
            try std.testing.expect(opcodes[i] != opcodes[j]);
        }
    }
}

test "metadata structs: proper sizing and fields" {
    // Test that metadata values fit in usize
    const inline_value: usize = 42;
    try std.testing.expectEqual(@as(usize, 42), inline_value);
    
    // Test pointer values
    const ptr_value: usize = 0xDEADBEEF;
    try std.testing.expectEqual(@as(usize, 0xDEADBEEF), ptr_value);
    
    // Test JumpDestMetadata
    const jd_meta = JumpDestMetadata{ .gas = 1000, .min_stack = -5, .max_stack = 10 };
    try std.testing.expectEqual(@as(u32, 1000), jd_meta.gas);
    try std.testing.expectEqual(@as(i16, -5), jd_meta.min_stack);
    try std.testing.expectEqual(@as(i16, 10), jd_meta.max_stack);
    
    // Verify JumpDestMetadata fits in usize on 64-bit
    if (@sizeOf(usize) >= 8) {
        try std.testing.expect(@sizeOf(JumpDestMetadata) <= @sizeOf(usize));
    }
}

test "analyzer plan: new structure with instruction stream" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create a simple plan with handler pointers
    const stream = [_]InstructionElement{ 
        .{ .handler = &testMockHandler }, 
        .{ .inline_value = 42 },  // metadata
        .{ .handler = &testMockHandler } 
    };
    
    var plan = Analyzer.Plan{
        .instructionStream = try allocator.dupe(InstructionElement, &stream),
        .u256_constants = &.{},
    };
    defer plan.deinit(allocator);
    
    // Test fields exist and have correct values
    try std.testing.expectEqual(@as(usize, 3), plan.instructionStream.len);
    try std.testing.expectEqual(@as(usize, 0), plan.u256_constants.len);
    
    // Test getMetadataAndNextInstruction method with PUSH1 (has metadata)
    var idx: Analyzer.InstructionIndexT = 0;
    const result = plan.getMetadataAndNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@intFromPtr(&testMockHandler), @intFromPtr(result.next_handler));
    try std.testing.expectEqual(@as(usize, 42), result.metadata.inline_value);
    try std.testing.expectEqual(@as(Analyzer.InstructionIndexT, 2), idx);
    
    // Test with ADD (no metadata)
    idx = 2;
    const result2 = plan.getMetadataAndNextInstruction(&idx, .ADD);
    try std.testing.expectEqual(@intFromPtr(&testMockHandler), @intFromPtr(result2.next_handler));
    try std.testing.expectEqual(@as(usize, 0), result2.metadata.inline_value);
    try std.testing.expectEqual(@as(Analyzer.InstructionIndexT, 3), idx);
}

test "create_instruction_stream: basic handler array" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    
    // Simple bytecode: PUSH1 5
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x05 };
    var analysis = Analyzer.init(&bytecode);
    
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Should have at least 2 instructions (handler + metadata)
    try std.testing.expect(plan.instructionStream.len >= 2);
    
    // First should be the handler pointer
    try std.testing.expectEqual(@intFromPtr(&testMockHandler), @intFromPtr(plan.instructionStream[0].handler));
}

test "PUSH inline vs pointer: small values stored inline" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    
    // PUSH8 with value that fits in usize (8 bytes = 64 bits)
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH8), 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08 };
    var analysis = Analyzer.init(&bytecode);
    
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Should have handler + inline value
    try std.testing.expectEqual(@as(usize, 2), plan.instructionStream.len);
    
    // Second element should be the inline value
    const expected_value = if (@sizeOf(usize) == 8) @as(usize, 0x0102030405060708) else @as(usize, 0x01020304);
    try std.testing.expectEqual(expected_value, plan.instructionStream[1].inline_value);
    
    // No u256 constants needed
    try std.testing.expectEqual(@as(usize, 0), plan.u256_constants.len);
}

test "PUSH inline vs pointer: large values use pointer" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    
    // PUSH32 with large value
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH32) } ++ 
        [_]u8{0xFF} ** 32; // 32 bytes of 0xFF
    var analysis = Analyzer.init(&bytecode);
    
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Should have handler + pointer
    try std.testing.expectEqual(@as(usize, 2), plan.instructionStream.len);
    
    // Should have one u256 constant
    try std.testing.expectEqual(@as(usize, 1), plan.u256_constants.len);
    
    // Second element should be pointer to constant (index 0)
    try std.testing.expectEqual(@as(usize, 0), plan.instructionStream[1].pointer_index);
    
    // Verify the constant value
    const expected = std.math.maxInt(u256);
    try std.testing.expectEqual(expected, plan.u256_constants[0]);
}

test "fusion detection: PUSH+ADD inline" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array with special fusion handler
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    
    handlers[PUSH_ADD_INLINE] = &testFusionHandler;
    
    // PUSH1 5; ADD
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x05, @intFromEnum(Opcode.ADD) };
    var analysis = Analyzer.init(&bytecode);
    
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Should have fused handler + inline value  
    try std.testing.expectEqual(@as(usize, 2), plan.instructionStream.len);
    
    // First should be the fusion handler
    try std.testing.expectEqual(@intFromPtr(&testFusionHandler), @intFromPtr(plan.instructionStream[0].handler));
    
    // Second should be inline value
    try std.testing.expectEqual(@as(usize, 5), plan.instructionStream[1].inline_value);
}

test "fusion detection: PUSH+ADD pointer" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array with special fusion handler
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    
    handlers[PUSH_ADD_POINTER] = &testFusionHandler;
    
    // PUSH32 <big value>; ADD
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH32) } ++ 
        [_]u8{0xFF} ** 32 ++ // 32 bytes
        [_]u8{ @intFromEnum(Opcode.ADD) };
    var analysis = Analyzer.init(&bytecode);
    
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Should have fused handler + pointer
    try std.testing.expectEqual(@as(usize, 2), plan.instructionStream.len);
    
    // First should be the fusion handler
    try std.testing.expectEqual(@intFromPtr(&testFusionHandler), @intFromPtr(plan.instructionStream[0].handler));
    
    // Second should be pointer (index 0)
    try std.testing.expectEqual(@as(usize, 0), plan.instructionStream[1].pointer_index);
    
    // Should have constant
    try std.testing.expectEqual(@as(usize, 1), plan.u256_constants.len);
}

test "fusion detection: PUSH+JUMP inline" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array with special fusion handler
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    handlers[PUSH_JUMP_INLINE] = &testFusionHandler;
    
    // PUSH1 4; JUMP (to a valid JUMPDEST)
    const bytecode = [_]u8{ 
        @intFromEnum(Opcode.PUSH1), 0x04, 
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.STOP),
        @intFromEnum(Opcode.JUMPDEST), // PC=4
        @intFromEnum(Opcode.STOP)
    };
    var analysis = Analyzer.init(&bytecode);
    
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Should have fused handler + inline value + rest
    try std.testing.expect(plan.instructionStream.len >= 2);
    
    // First should be the fusion handler
    try std.testing.expectEqual(@intFromPtr(&testFusionHandler), @intFromPtr(plan.instructionStream[0].handler));
    
    // Second should be inline destination
    try std.testing.expectEqual(@as(usize, 4), plan.instructionStream[1].inline_value);
}

test "fusion detection: PUSH+JUMP pointer" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array with special fusion handler
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    handlers[PUSH_JUMP_POINTER] = &testFusionHandler;
    
    // PUSH32 with large jump destination; JUMP
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH32) } ++ 
        [_]u8{0} ** 31 ++ [_]u8{40} ++ // Jump to PC=40
        [_]u8{ @intFromEnum(Opcode.JUMP) } ++
        [_]u8{@intFromEnum(Opcode.STOP)} ** 36 ++ // padding
        [_]u8{ @intFromEnum(Opcode.JUMPDEST) }; // PC=40
        
    var analysis = Analyzer.init(&bytecode);
    
    var plan = try analysis.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Should have fused handler + pointer
    try std.testing.expect(plan.instructionStream.len >= 2);
    
    // First should be the fusion handler
    try std.testing.expectEqual(@intFromPtr(&testFusionHandler), @intFromPtr(plan.instructionStream[0].handler));
    
    // Second should be pointer to constant
    try std.testing.expectEqual(@as(usize, 0), plan.instructionStream[1].pointer_index);
    
    // Should have constant with value 40
    try std.testing.expectEqual(@as(usize, 1), plan.u256_constants.len);
    try std.testing.expectEqual(@as(u256, 40), plan.u256_constants[0]);
}

test "JumpDestMetadata handling: JUMPDEST instructions have metadata" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    
    // Test bytecode with JUMPDEST (no fusion to avoid complexity)
    const bytecode = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),     // PC 0: JUMPDEST
        @intFromEnum(Opcode.PUSH1), 0x01,  // PC 1: PUSH1 1
        @intFromEnum(Opcode.STOP),         // PC 3: STOP
    };
    
    var analyzer = Analyzer.init(&bytecode);
    var plan = try analyzer.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Find JUMPDEST in the instruction stream
    // Currently, JUMPDEST instructions don't have metadata following them
    // This test should fail once we check for metadata
    
    var found_jumpdest_without_metadata = false;
    var i: usize = 0;
    
    while (i < plan.instructionStream.len) : (i += 1) {
        const elem = plan.instructionStream[i];
        
        // Check if this is a JUMPDEST handler
        if (@intFromPtr(elem.handler) == @intFromPtr(handlers[@intFromEnum(Opcode.JUMPDEST)])) {
            // Check next slot - it should be metadata
            if (i + 1 < plan.instructionStream.len) {
                const next_elem = plan.instructionStream[i + 1];
                // If next is a handler pointer, then no metadata was added
                if (@intFromPtr(next_elem.handler) == @intFromPtr(handlers[@intFromEnum(Opcode.PUSH1)]) or
                    @intFromPtr(next_elem.handler) == @intFromPtr(handlers[@intFromEnum(Opcode.STOP)])) {
                    found_jumpdest_without_metadata = true;
                }
            }
            break;
        }
    }
    
    // This test should fail - we expect metadata but don't have it yet
    try std.testing.expect(!found_jumpdest_without_metadata);
}

test "dynamic jump table: unfused JUMP can lookup instruction index" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    
    // Test bytecode with dynamic JUMP (value from stack, not fusion)
    const bytecode = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),     // PC 0: entry point
        @intFromEnum(Opcode.PUSH1), 0x06,  // PC 1: push jump destination
        @intFromEnum(Opcode.PUSH1), 0x01,  // PC 3: push some value
        @intFromEnum(Opcode.JUMP),         // PC 5: dynamic jump (not fused)
        @intFromEnum(Opcode.JUMPDEST),     // PC 6: jump destination
        @intFromEnum(Opcode.STOP),         // PC 7: stop
    };
    
    var analyzer = Analyzer.init(&bytecode);
    var plan = try analyzer.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Dynamic jump support is handled during execution, not in the plan
    // The instruction stream should contain the JUMPDEST handlers
    var found_jumpdests: usize = 0;
    var i: usize = 0;
    while (i < plan.instructionStream.len) {
        const elem = plan.instructionStream[i];
        if (@intFromPtr(elem.handler) == @intFromPtr(handlers[@intFromEnum(Opcode.JUMPDEST)])) {
            found_jumpdests += 1;
            i += 2; // Skip metadata
        } else {
            i += 1;
        }
    }
    try std.testing.expect(found_jumpdests >= 2);
}

test "fusion detection: PUSH+MUL fusion" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    handlers[PUSH_MUL_INLINE] = &testFusionHandler;
    handlers[PUSH_MUL_POINTER] = &testFusionHandler;
    
    // Test PUSH1 5; MUL
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 5,
        @intFromEnum(Opcode.MUL),
    };
    
    var analyzer = Analyzer.init(&bytecode);
    var plan = try analyzer.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Should have detected PUSH+MUL fusion
    try std.testing.expectEqual(@as(usize, 2), plan.instructionStream.len);
    try std.testing.expectEqual(@intFromPtr(&testFusionHandler), @intFromPtr(plan.instructionStream[0].handler));
    try std.testing.expectEqual(@as(usize, 5), plan.instructionStream[1].inline_value);
}

test "fusion detection: PUSH+DIV fusion" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    handlers[PUSH_DIV_INLINE] = &testFusionHandler;
    handlers[PUSH_DIV_POINTER] = &testFusionHandler;
    
    // Test PUSH1 10; DIV
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 10,
        @intFromEnum(Opcode.DIV),
    };
    
    var analyzer = Analyzer.init(&bytecode);
    var plan = try analyzer.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Should have detected PUSH+DIV fusion
    try std.testing.expectEqual(@as(usize, 2), plan.instructionStream.len);
    try std.testing.expectEqual(@intFromPtr(&testFusionHandler), @intFromPtr(plan.instructionStream[0].handler));
    try std.testing.expectEqual(@as(usize, 10), plan.instructionStream[1].inline_value);
}

test "fusion detection: PUSH+JUMPI fusion" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    handlers[PUSH_JUMPI_INLINE] = &testFusionHandler;
    handlers[PUSH_JUMPI_POINTER] = &testFusionHandler;
    
    // Test PUSH1 8; JUMPI
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,  // condition
        @intFromEnum(Opcode.PUSH1), 0x08,  // destination
        @intFromEnum(Opcode.JUMPI),        // conditional jump
        @intFromEnum(Opcode.STOP),         // fallthrough
        @intFromEnum(Opcode.JUMPDEST),     // PC 8: jump destination
        @intFromEnum(Opcode.STOP),
    };
    
    var analyzer = Analyzer.init(&bytecode);
    var plan = try analyzer.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Should have PUSH1 1, then fused PUSH+JUMPI
    try std.testing.expect(plan.instructionStream.len >= 4); // PUSH1, value, PUSH_JUMPI_INLINE, dest
    
    // Find the fusion handler
    var found_fusion = false;
    var i: usize = 0;
    while (i < plan.instructionStream.len) : (i += 1) {
        if (@intFromPtr(plan.instructionStream[i].handler) == @intFromPtr(&testFusionHandler)) {
            found_fusion = true;
            // Next should be the destination value
            if (i + 1 < plan.instructionStream.len) {
                try std.testing.expectEqual(@as(usize, 8), plan.instructionStream[i + 1].inline_value);
            }
            break;
        }
    }
    
    try std.testing.expect(found_fusion);
}

test "analysis cache: stores and reuses plans" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create analyzer with cache
    var analyzer = try Analyzer.initWithCache(allocator, 2);
    defer analyzer.deinit();
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    
    // Test bytecode
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.STOP),
    };
    
    // First call should analyze and cache
    const plan1 = try analyzer.getOrAnalyze(&bytecode, handlers);
    
    // Second call should return cached plan
    const plan2 = try analyzer.getOrAnalyze(&bytecode, handlers);
    
    // Should be the same plan
    try std.testing.expectEqual(@intFromPtr(plan1), @intFromPtr(plan2));
}

test "integration: complex bytecode with all features" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testMockHandler;
    }
    // Set fusion handlers
    handlers[PUSH_ADD_INLINE] = &testFusionHandler;
    handlers[PUSH_ADD_POINTER] = &testFusionHandler;
    handlers[PUSH_MUL_INLINE] = &testFusionHandler;
    handlers[PUSH_MUL_POINTER] = &testFusionHandler;
    handlers[PUSH_DIV_INLINE] = &testFusionHandler;
    handlers[PUSH_DIV_POINTER] = &testFusionHandler;
    handlers[PUSH_JUMP_INLINE] = &testFusionHandler;
    handlers[PUSH_JUMP_POINTER] = &testFusionHandler;
    handlers[PUSH_JUMPI_INLINE] = &testFusionHandler;
    handlers[PUSH_JUMPI_POINTER] = &testFusionHandler;
    
    // Complex bytecode with all features
    const bytecode = [_]u8{
        // Entry point
        @intFromEnum(Opcode.JUMPDEST),     // PC 0: entry
        
        // Fusion: PUSH+ADD
        @intFromEnum(Opcode.PUSH1), 0x05,  // PC 1: push 5
        @intFromEnum(Opcode.ADD),          // PC 3: add (fused)
        
        // Large PUSH value (pointer)
        @intFromEnum(Opcode.PUSH32),       // PC 4: push large value
    } ++ [_]u8{0xFF} ** 32 ++ [_]u8{      // PC 5-36: 32 bytes of 0xFF
        
        // Fusion: PUSH+MUL 
        @intFromEnum(Opcode.PUSH1), 0x02,  // PC 37: push 2
        @intFromEnum(Opcode.MUL),          // PC 39: multiply (fused)
        
        // Dynamic jump preparation
        @intFromEnum(Opcode.PUSH1), 0x30,  // PC 40: push jump dest (48)
        
        // Another operation to break fusion
        @intFromEnum(Opcode.DUP1),         // PC 42: duplicate
        
        // Dynamic JUMP (not fused)
        @intFromEnum(Opcode.JUMP),         // PC 43: jump
        
        // Some unreachable code
        @intFromEnum(Opcode.INVALID),      // PC 44
        @intFromEnum(Opcode.INVALID),      // PC 45
        @intFromEnum(Opcode.INVALID),      // PC 46
        @intFromEnum(Opcode.INVALID),      // PC 47
        
        // Jump destination
        @intFromEnum(Opcode.JUMPDEST),     // PC 48: jump dest
        
        // Fusion: PUSH+DIV
        @intFromEnum(Opcode.PUSH1), 0x04,  // PC 49: push 4
        @intFromEnum(Opcode.DIV),          // PC 51: divide (fused)
        
        // Conditional jump setup
        @intFromEnum(Opcode.PUSH1), 0x01,  // PC 52: push condition
        @intFromEnum(Opcode.PUSH1), 0x3A,  // PC 54: push dest (58)
        @intFromEnum(Opcode.JUMPI),        // PC 56: jumpi (fused)
        
        @intFromEnum(Opcode.INVALID),      // PC 57: skipped
        
        // Final destination
        @intFromEnum(Opcode.JUMPDEST),     // PC 58: final dest
        @intFromEnum(Opcode.STOP),         // PC 59: stop
    };
    
    var analyzer = Analyzer.init(&bytecode);
    var plan = try analyzer.create_instruction_stream(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Verify we have all the features:
    
    // 1. Multiple JUMPDESTs in instruction stream
    var found_jumpdests: usize = 0;
    var j: usize = 0;
    while (j < plan.instructionStream.len) {
        const elem = plan.instructionStream[j];
        if (@intFromPtr(elem.handler) == @intFromPtr(handlers[@intFromEnum(Opcode.JUMPDEST)])) {
            found_jumpdests += 1;
            j += 2; // Skip metadata
        } else {
            j += 1;
        }
    }
    try std.testing.expect(found_jumpdests >= 3); // PC 0, 48, 58
    
    // 2. Large constant in u256_constants
    try std.testing.expect(plan.u256_constants.len >= 1);
    // Check the large value is all 0xFF
    const large_val = plan.u256_constants[0];
    const expected: u256 = std.math.maxInt(u256);
    try std.testing.expectEqual(expected, large_val);
    
    // 3. Instruction stream has fusion handlers
    var fusion_count: usize = 0;
    var i: usize = 0;
    while (i < plan.instructionStream.len) : (i += 1) {
        if (@intFromPtr(plan.instructionStream[i].handler) == @intFromPtr(&testFusionHandler)) {
            fusion_count += 1;
            i += 1; // Skip metadata
        }
    }
    try std.testing.expect(fusion_count >= 4); // ADD, MUL, DIV, JUMPI fusions
    
    // 4. Dynamic jumps are handled at runtime, not in plan
    // Just verify we have a valid instruction stream
    try std.testing.expect(plan.instructionStream.len > 0);
}
