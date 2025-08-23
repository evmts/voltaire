/// Analysis module: scans EVM bytecode and produces a minimal runtime Plan.
/// The Plan contains only what the interpreter needs for fast jumps and
/// per-block checks: a sorted list of JUMPDEST PCs (jumpList) and block
/// metadata (instructionIndex, staticGasCharge, min/max stack height).
/// All other intermediates (bitmaps, counters) are ephemeral and freed.
const std = @import("std");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;

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

    // Minimal data the interpreter needs at runtime.
    const AnalyzerPlan = struct {
        jumpList: []PcType,
        blocks: []AnalyzerBlock,
        /// Bytecode length typed to PcType for portability.
        bytecodeLen: PcType,

        /// Find the stream instruction index for a JUMPDEST at `pc`.
        /// Uses binary search over jumpList; returns null if `pc` is not a JUMPDEST.
        pub fn lookupInstructionIdx(self: *const @This(), pc: PcType) ?usize {
            const idx = lb(self.jumpList, pc);
            if (idx >= self.jumpList.len or self.jumpList[idx] != pc) return null;
            return self.blocks[1 + idx].instructionIndex;
        }

        /// Free Plan-owned slices (jumpList, blocks).
        pub fn deinit(self: *@This(), allocator: std.mem.Allocator) void {
            if (self.jumpList.len > 0) allocator.free(self.jumpList);
            if (self.blocks.len > 0) allocator.free(self.blocks);
            self.jumpList = &[_]PcType{};
            self.blocks = &[_]AnalyzerBlock{};
            self.bytecodeLen = 0;
        }

        /// Lower-bound binary search helper on PcType slices.
        inline fn lb(list: []const PcType, key: PcType) usize {
            var lo: usize = 0;
            var hi: usize = list.len;
            while (lo < hi) {
                const mid = lo + (hi - lo) / 2;
                if (list[mid] < key) {
                    lo = mid + 1;
                } else {
                    hi = mid;
                }
            }
            return lo;
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

        /// Analyze the bytecode and build a Plan.
        /// Pass 1: build temporary bitmaps (push-data, opcode-start, jumpdest).
        /// Pass 2: allocate exact outputs and fill jumpList + blocks.
        /// All temporaries are freed before returning.
        pub fn run(self: *Self, allocator: std.mem.Allocator) !AnalyzerPlan {
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

            return AnalyzerPlan{
                .jumpList = jump_list,
                .blocks = blocks,
                .bytecodeLen = @as(PcType, @intCast(N)),
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

test "analysis: bitmaps mark push-data and jumpdest correctly" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});

    // Bytecode: PUSH2 0xAA 0xBB; JUMPDEST; STOP
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH2), 0xAA, 0xBB, @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.STOP) };
    var analysis = Analyzer.init(&bytecode);

    var plan = try analysis.run(allocator);
    defer plan.deinit(allocator);

    // Expect one jumpdest at pc=3
    try std.testing.expectEqual(@as(usize, 1), plan.jumpList.len);
    try std.testing.expectEqual(@as(Analyzer.PcTypeT, 3), plan.jumpList[0]);
}

test "analysis: blocks and lookupInstrIdx basic" {
    const allocator = std.testing.allocator;
    const Analyzer = createAnalyzer(.{});
    // Bytecode: PUSH1 0x01; JUMPDEST; STOP
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x01, @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.STOP) };
    var analysis = Analyzer.init(&bytecode);

    var plan = try analysis.run(allocator);
    defer plan.deinit(allocator);

    // blocks: entry + one at JUMPDEST
    try std.testing.expectEqual(@as(usize, 2), plan.blocks.len);
    try std.testing.expectEqual(@as(usize, 1), plan.jumpList.len);
    try std.testing.expectEqual(@as(Analyzer.PcTypeT, 2), plan.jumpList[0]);
    // instructionIndex parity: PUSH1 -> +2, so block at pc=2 should have instructionIndex 2
    try std.testing.expectEqual(@as(usize, 2), plan.blocks[1].instructionIndex);

    const idx_opt = plan.lookupInstructionIdx(@as(Analyzer.PcTypeT, 2));
    try std.testing.expect(idx_opt != null);
    try std.testing.expectEqual(@as(usize, 2), idx_opt.?);
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

    var plan_simd = try a.run(allocator);
    defer plan_simd.deinit(allocator);
    var plan_scalar = try b.run(allocator);
    defer plan_scalar.deinit(allocator);

    try std.testing.expectEqual(plan_scalar.jumpList.len, plan_simd.jumpList.len);
    var i: usize = 0;
    while (i < plan_scalar.jumpList.len) : (i += 1) {
        try std.testing.expectEqual(plan_scalar.jumpList[i], plan_simd.jumpList[i]);
    }
    try std.testing.expectEqual(plan_scalar.blocks.len, plan_simd.blocks.len);
    // Spot-check instructionIndex alignment for blocks beyond entry
    var bi: usize = 1;
    while (bi < plan_scalar.blocks.len) : (bi += 1) {
        try std.testing.expectEqual(plan_scalar.blocks[bi].instructionIndex, plan_simd.blocks[bi].instructionIndex);
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
    var plan = try analysis.run(allocator);
    defer plan.deinit(allocator);

    // Expect two blocks: entry and one at JUMPDEST
    try std.testing.expectEqual(@as(usize, 2), plan.blocks.len);
    // Entry block static gas = PUSH1 + PUSH1 + ADD
    const g_push = opcode_data.OPCODE_INFO[@intFromEnum(Opcode.PUSH1)].gas_cost;
    const g_add = opcode_data.OPCODE_INFO[@intFromEnum(Opcode.ADD)].gas_cost;
    const expected_entry_gas: u32 = @intCast(g_push + g_push + g_add);
    try std.testing.expectEqual(expected_entry_gas, plan.blocks[0].staticGasCharge);
    // Stack height through PUSH1, PUSH1, ADD => deltas +1, +1, -1 → min=0, max=2
    const SHT = @TypeOf(plan.blocks[0].minStackHeight);
    try std.testing.expectEqual(@as(SHT, 0), plan.blocks[0].minStackHeight);
    try std.testing.expectEqual(@as(SHT, 2), plan.blocks[0].maxStackHeight);
}

test "analysis: lookupInstructionIdx returns null for non-dest" {
    const allocator = std.testing.allocator;
    // No JUMPDESTs at all
    const bc = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x01, @intFromEnum(Opcode.STOP) };
    const Analyzer = createAnalyzer(.{});
    var analysis = Analyzer.init(&bc);
    var plan = try analysis.run(allocator);
    defer plan.deinit(allocator);
    try std.testing.expectEqual(@as(usize, 0), plan.jumpList.len);
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
