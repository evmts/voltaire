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

/// Metadata for inline PUSH values (fits in usize).
pub const PushInlineMetadata = struct {
    value: usize,
};

/// Metadata for PUSH values that require pointer (larger than usize).
pub const PushPointerMetadata = struct {
    ptr: usize,
};

/// Metadata for JUMP instructions with padding to ensure usize alignment.
pub fn JumpMetadata(comptime PcType: type) type {
    return struct {
        dest_idx: PcType,
        _padding: [@sizeOf(usize) - @sizeOf(PcType)]u8,
    };
}

/// Metadata for JUMPDEST instructions.
/// On 64-bit systems this fits in usize, on 32-bit it requires pointer.
pub const JumpDestMetadata = struct {
    gas: u32,
    min_stack: i16,
    max_stack: i16,
};

/// Handler function type for instruction execution.
pub const HandlerFn = fn () void;

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
    const StackHeightType = Cfg.StackHeightType();
    const VectorLength = Cfg.vector_length;

    // Per-basic-block metadata (entry is blocks[0], then one per JUMPDEST).
    const AnalyzerBlock = struct {
        /// Bytecode PC of the block start (0 for entry, else JUMPDEST PC).
        pc: PcType,
        /// IR instruction index where this block begins in the stream.
        instructionIndex: usize,
        /// Sum of fixed gas costs inside the block (u32).
        staticGasCharge: u32,
        /// Minimum stack height observed while walking the block.
        minStackHeight: StackHeightType,
        /// Maximum stack height observed while walking the block.
        maxStackHeight: StackHeightType,
    };

    // Jump table entry type
    const JumpTableEntry = struct {
        pc: PcType,
        instruction_idx: PcType,
    };
    
    // Minimal data the interpreter needs at runtime.
    const AnalyzerPlan = struct {
        instructionStream: []usize,
        u256_constants: []Cfg.WordType,
        jump_table: []JumpTableEntry,
        jumpDestMetadata: []AnalyzerBlock,

        /// Find the stream instruction index for a JUMPDEST at `pc`.
        /// Uses binary search over jump_table; returns null if `pc` is not a JUMPDEST.
        pub fn lookupInstructionIdx(self: *const @This(), pc: PcType) ?usize {
            var lo: usize = 0;
            var hi: usize = self.jump_table.len;
            while (lo < hi) {
                const mid = lo + (hi - lo) / 2;
                if (self.jump_table[mid].pc < pc) {
                    lo = mid + 1;
                } else {
                    hi = mid;
                }
            }
            if (lo >= self.jump_table.len or self.jump_table[lo].pc != pc) return null;
            return @intCast(self.jump_table[lo].instruction_idx);
        }
        
        /// Get metadata at a specific instruction pointer.
        pub fn getMetadata(self: *const @This(), ip: usize) usize {
            return self.instructionStream[ip];
        }
        
        /// Get next instruction and advance instruction pointer.
        pub fn getNextInstruction(self: *const @This(), ip: *usize) usize {
            const inst = self.instructionStream[ip.*];
            ip.* += 1;
            return inst;
        }

        /// Free Plan-owned slices.
        pub fn deinit(self: *@This(), allocator: std.mem.Allocator) void {
            if (self.instructionStream.len > 0) allocator.free(self.instructionStream);
            if (self.u256_constants.len > 0) allocator.free(self.u256_constants);
            if (self.jump_table.len > 0) allocator.free(self.jump_table);
            if (self.jumpDestMetadata.len > 0) allocator.free(self.jumpDestMetadata);
            self.instructionStream = &.{};
            self.u256_constants = &.{};
            self.jump_table = &.{};
            self.jumpDestMetadata = &.{};
        }

    };

    const Analysis = struct {
        const Self = @This();
        // Expose types for callers/tests.
        pub const BlockMeta = AnalyzerBlock;
        pub const Plan = AnalyzerPlan;
        pub const PcTypeT = PcType;

        bytecode: []const u8,

        /// Create an analyzer instance over immutable bytecode.
        pub fn init(bytecode: []const u8) Self {
            return .{ .bytecode = bytecode };
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
            var blocks = try allocator.alloc(AnalyzerBlock, num_blocks);
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
            blocks[0] = .{ .pc = 0, .instructionIndex = 0, .staticGasCharge = 0, .minStackHeight = 0, .maxStackHeight = 0 };
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
                    blocks[block_idx].staticGasCharge = @as(u32, @intCast(@min(static_gas_accum, @as(u64, std.math.maxInt(u32)))));
                    blocks[block_idx].minStackHeight = min_stack_height;
                    blocks[block_idx].maxStackHeight = max_stack_height;
                    // start new block
                    block_idx += 1;
                    blocks[block_idx] = .{ .pc = @as(PcType, @intCast(i)), .instructionIndex = stream_idx, .staticGasCharge = 0, .minStackHeight = 0, .maxStackHeight = 0 };
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
            blocks[block_idx].staticGasCharge = @as(u32, @intCast(@min(static_gas_accum, @as(u64, std.math.maxInt(u32)))));
            blocks[block_idx].minStackHeight = min_stack_height;
            blocks[block_idx].maxStackHeight = max_stack_height;
            std.debug.assert(block_idx + 1 == num_blocks);

            // Free unused jump_list
            allocator.free(jump_list);

            // Build instruction stream
            var stream = std.ArrayList(usize).init(allocator);
            errdefer stream.deinit();
            
            var constants = std.ArrayList(Cfg.WordType).init(allocator);
            errdefer constants.deinit();
            
            var jump_table_list = std.ArrayList(JumpTableEntry).init(allocator);
            errdefer jump_table_list.deinit();
            
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
                        // Check for PUSH+JUMP fusion
                        else if (next_op == @intFromEnum(Opcode.JUMP)) {
                            // Use appropriate fusion opcode
                            handler_op = if (n <= @sizeOf(usize)) PUSH_JUMP_INLINE else PUSH_JUMP_POINTER;
                            fused = true;
                        }
                    }
                    
                    // Add handler pointer (normal or fused)
                    try stream.append(@intFromPtr(handlers[handler_op]));
                    
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
                            try stream.append(value);
                        } else {
                            // Too large - store in constants array
                            var value: Cfg.WordType = 0;
                            var j: usize = 0;
                            while (j < n) : (j += 1) {
                                value = (value << 8) | self.bytecode[i + 1 + j];
                            }
                            const const_idx = constants.items.len;
                            try constants.append(value);
                            try stream.append(const_idx);
                        }
                    }
                    
                    // Skip the next instruction if we fused
                    if (fused and next_pc < N) {
                        i = next_pc + 1;
                    } else {
                        i += 1 + n;
                    }
                } else if (op == @intFromEnum(Opcode.JUMPDEST)) {
                    // Add to jump table
                    try jump_table_list.append(.{
                        .pc = @intCast(i),
                        .instruction_idx = @intCast(stream.items.len),
                    });
                    
                    // JUMPDEST needs metadata
                    try stream.append(@intFromPtr(handlers[op]));
                    
                    // Find the block metadata for this JUMPDEST
                    var metadata_found = false;
                    for (blocks) |block| {
                        if (block.pc == i) {
                            // Found the metadata for this JUMPDEST
                            const jd_metadata = JumpDestMetadata{
                                .gas = block.staticGasCharge,
                                .min_stack = block.minStackHeight,
                                .max_stack = block.maxStackHeight,
                            };
                            
                            // On 64-bit systems, pack inline
                            if (@sizeOf(usize) >= 8) {
                                // Pack the metadata into a usize
                                const metadata_bytes = std.mem.asBytes(&jd_metadata);
                                var packed_value: usize = 0;
                                @memcpy(std.mem.asBytes(&packed_value)[0..@sizeOf(JumpDestMetadata)], metadata_bytes);
                                try stream.append(packed_value);
                            } else {
                                // On 32-bit systems, store in constants array
                                const const_idx = constants.items.len;
                                // Store metadata as bytes in a u256
                                var value: Cfg.WordType = 0;
                                const metadata_bytes = std.mem.asBytes(&jd_metadata);
                                var j: usize = 0;
                                while (j < @sizeOf(JumpDestMetadata)) : (j += 1) {
                                    value = (value << 8) | metadata_bytes[@sizeOf(JumpDestMetadata) - 1 - j];
                                }
                                try constants.append(value);
                                try stream.append(const_idx);
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
                    try stream.append(@intFromPtr(handlers[op]));
                    i += 1;
                }
            }

            return AnalyzerPlan{
                .instructionStream = try stream.toOwnedSlice(),
                .u256_constants = try constants.toOwnedSlice(),
                .jump_table = try jump_table_list.toOwnedSlice(),
                .jumpDestMetadata = blocks,
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
fn testMockHandler() void {}

// Test fusion handler
fn testFusionHandler() void {}

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

    // Expect one jumpdest at pc=3
    // TODO: Update when create_instruction_stream is implemented
    try std.testing.expectEqual(@as(usize, 1), plan.jumpDestMetadata.len - 1); // -1 for entry block
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

    // blocks: entry + one at JUMPDEST
    try std.testing.expectEqual(@as(usize, 2), plan.jumpDestMetadata.len);
    // instructionIndex parity: PUSH1 -> +2, so block at pc=2 should have instructionIndex 2
    try std.testing.expectEqual(@as(usize, 2), plan.jumpDestMetadata[1].instructionIndex);

    // TODO: Update when create_instruction_stream fills jump_table
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

    try std.testing.expectEqual(plan_scalar.jumpDestMetadata.len, plan_simd.jumpDestMetadata.len);
    // Spot-check instructionIndex alignment for blocks beyond entry
    var bi: usize = 1;
    while (bi < plan_scalar.jumpDestMetadata.len) : (bi += 1) {
        try std.testing.expectEqual(plan_scalar.jumpDestMetadata[bi].instructionIndex, plan_simd.jumpDestMetadata[bi].instructionIndex);
    }
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

    // Expect two blocks: entry and one at JUMPDEST
    try std.testing.expectEqual(@as(usize, 2), plan.jumpDestMetadata.len);
    // Entry block static gas = PUSH1 + PUSH1 + ADD
    const g_push = opcode_data.OPCODE_INFO[@intFromEnum(Opcode.PUSH1)].gas_cost;
    const g_add = opcode_data.OPCODE_INFO[@intFromEnum(Opcode.ADD)].gas_cost;
    const expected_entry_gas: u32 = @intCast(g_push + g_push + g_add);
    try std.testing.expectEqual(expected_entry_gas, plan.jumpDestMetadata[0].staticGasCharge);
    // Stack height through PUSH1, PUSH1, ADD => deltas +1, +1, -1 → min=0, max=2
    const SHT = @TypeOf(plan.jumpDestMetadata[0].minStackHeight);
    try std.testing.expectEqual(@as(SHT, 0), plan.jumpDestMetadata[0].minStackHeight);
    try std.testing.expectEqual(@as(SHT, 2), plan.jumpDestMetadata[0].maxStackHeight);
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
    try std.testing.expectEqual(@as(usize, 0), plan.jump_table.len);
    try std.testing.expect(plan.lookupInstructionIdx(@as(Analyzer.PcTypeT, 0)) == null);
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
    const Analyzer = createAnalyzer(.{});
    const PcType = Analyzer.PcTypeT;
    
    // Test PushInlineMetadata size and fields
    const inline_meta = PushInlineMetadata{ .value = 42 };
    try std.testing.expectEqual(@sizeOf(usize), @sizeOf(PushInlineMetadata));
    try std.testing.expectEqual(@as(usize, 42), inline_meta.value);
    
    // Test PushPointerMetadata size and fields
    const ptr_meta = PushPointerMetadata{ .ptr = 0xDEADBEEF };
    try std.testing.expectEqual(@sizeOf(usize), @sizeOf(PushPointerMetadata));
    try std.testing.expectEqual(@as(usize, 0xDEADBEEF), ptr_meta.ptr);
    
    // Test JumpMetadata with proper padding
    const jump_meta = JumpMetadata(PcType){ .dest_idx = 100, ._padding = undefined };
    try std.testing.expectEqual(@sizeOf(usize), @sizeOf(JumpMetadata(PcType)));
    try std.testing.expectEqual(@as(PcType, 100), jump_meta.dest_idx);
    
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
    
    // Create a simple plan with minimal setup
    const stream = [_]usize{ 0x01, 42, 0x02 };
    
    var plan = Analyzer.Plan{
        .instructionStream = try allocator.dupe(usize, &stream),
        .u256_constants = &.{},
        .jump_table = &.{},
        .jumpDestMetadata = &.{},
    };
    defer plan.deinit(allocator);
    
    // Test fields exist and have correct values
    try std.testing.expectEqual(@as(usize, 3), plan.instructionStream.len);
    try std.testing.expectEqual(@as(usize, 0), plan.u256_constants.len);
    try std.testing.expectEqual(@as(usize, 0), plan.jump_table.len);
    
    // Test getMetadata method
    const metadata = plan.getMetadata(1);
    try std.testing.expectEqual(@as(usize, 42), metadata);
    
    // Test getNextInstruction method  
    var ip: usize = 0;
    const inst1 = plan.getNextInstruction(&ip);
    try std.testing.expectEqual(@as(usize, 0x01), inst1);
    try std.testing.expectEqual(@as(usize, 1), ip);
    
    const inst2 = plan.getNextInstruction(&ip);
    try std.testing.expectEqual(@as(usize, 42), inst2);
    try std.testing.expectEqual(@as(usize, 2), ip);
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
    try std.testing.expectEqual(@intFromPtr(&testMockHandler), plan.instructionStream[0]);
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
    try std.testing.expectEqual(expected_value, plan.instructionStream[1]);
    
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
    try std.testing.expectEqual(@as(usize, 0), plan.instructionStream[1]);
    
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
    try std.testing.expectEqual(@intFromPtr(&testFusionHandler), plan.instructionStream[0]);
    
    // Second should be inline value
    try std.testing.expectEqual(@as(usize, 5), plan.instructionStream[1]);
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
    try std.testing.expectEqual(@intFromPtr(&testFusionHandler), plan.instructionStream[0]);
    
    // Second should be pointer (index 0)
    try std.testing.expectEqual(@as(usize, 0), plan.instructionStream[1]);
    
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
    try std.testing.expectEqual(@intFromPtr(&testFusionHandler), plan.instructionStream[0]);
    
    // Second should be inline destination
    try std.testing.expectEqual(@as(usize, 4), plan.instructionStream[1]);
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
    try std.testing.expectEqual(@intFromPtr(&testFusionHandler), plan.instructionStream[0]);
    
    // Second should be pointer to constant
    try std.testing.expectEqual(@as(usize, 0), plan.instructionStream[1]);
    
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
        const handler = plan.instructionStream[i];
        
        // Check if this is a JUMPDEST handler
        if (handler == @intFromPtr(handlers[@intFromEnum(Opcode.JUMPDEST)])) {
            // Check next slot - it should be metadata but currently isn't
            if (i + 1 < plan.instructionStream.len) {
                const next_value = plan.instructionStream[i + 1];
                // If next is a handler pointer, then no metadata was added
                if (next_value == @intFromPtr(handlers[@intFromEnum(Opcode.PUSH1)]) or
                    next_value == @intFromPtr(handlers[@intFromEnum(Opcode.STOP)])) {
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
    
    // The jump table should have entries for both JUMPDESTs
    try std.testing.expect(plan.jump_table.len >= 2);
    
    // Test binary search - lookup instruction index for PC 6
    const instruction_idx = plan.lookupInstructionIdx(6);
    try std.testing.expect(instruction_idx != null);
    
    // The instruction at that index should be JUMPDEST handler
    if (instruction_idx) |idx| {
        try std.testing.expect(idx < plan.instructionStream.len);
        const handler = plan.instructionStream[idx];
        try std.testing.expectEqual(@intFromPtr(handlers[@intFromEnum(Opcode.JUMPDEST)]), handler);
    }
}
