/// Multi-pass SIMD-optimized bytecode analysis
/// 
/// This module implements a more efficient bytecode analysis approach using
/// multiple SIMD passes instead of sequential scanning with conditionals.
///
/// Design:
/// - Pass 1: SIMD scan for PUSH opcodes, mark ranges and fusion candidates
/// - Pass 2: SIMD scan for JUMPDEST, using push ranges for fast validation  
/// - Pass 3: SIMD scan for JUMP/JUMPI, build basic blocks
///
/// Key improvements over bytecode.zig:
/// - Vectorized opcode detection (16-32x parallelism)
/// - Push ranges instead of bitmaps for O(log n) lookup
/// - Cache-friendly linear passes
/// - Built-in fusion detection during PUSH scan
/// - Basic block construction for advanced analysis

const std = @import("std");
const builtin = @import("builtin");
const Opcode = @import("opcode.zig").Opcode;

/// Push instruction range in bytecode
pub const PushRange = struct {
    /// Start position of PUSH opcode
    start: u16,
    /// End position (exclusive) - after push data
    end: u16,
    /// Size of push data (1-32)
    size: u8,
    /// Next opcode after push data (for fusion detection)
    next_opcode: u8,
    /// Whether this push is fusable with next opcode
    is_fusion_candidate: bool,
};

/// Basic block in control flow graph
pub const BasicBlock = struct {
    /// Start PC of block (inclusive)
    start: u16,
    /// End PC of block (exclusive)
    end: u16,
    /// PCs that can jump into this block
    entries: []const u16,
    /// Jump instructions in this block
    exits: []const JumpExit,
    
    pub const JumpExit = struct {
        /// PC of JUMP/JUMPI instruction
        pc: u16,
        /// Target PC (if statically known)
        target: ?u16,
        /// Whether conditional (JUMPI)
        is_conditional: bool,
    };
};

/// Analyzed bytecode with multi-pass SIMD results
pub const AnalyzedBytecode = struct {
    /// Original bytecode
    code: []const u8,
    /// All PUSH instruction ranges
    push_ranges: []const PushRange,
    /// Valid JUMPDEST positions (sorted)
    jumpdests: []const u16,
    /// Basic blocks from control flow analysis
    basic_blocks: []const BasicBlock,
    /// Allocator for cleanup
    allocator: std.mem.Allocator,
    
    pub fn deinit(self: *AnalyzedBytecode) void {
        self.allocator.free(self.push_ranges);
        self.allocator.free(self.jumpdests);
        // TODO: Free basic blocks and their internal arrays
        for (self.basic_blocks) |block| {
            self.allocator.free(block.entries);
            self.allocator.free(block.exits);
        }
        self.allocator.free(self.basic_blocks);
    }
};

/// Analyzes bytecode using multi-pass SIMD approach
pub fn analyzeBytecode(allocator: std.mem.Allocator, code: []const u8) !AnalyzedBytecode {
    // Pass 1: Find all PUSH instructions
    const push_ranges = try findPushRanges(allocator, code);
    errdefer allocator.free(push_ranges);
    
    // Pass 2: Find valid JUMPDESTs
    const jumpdests = try findJumpdests(allocator, code, push_ranges);
    errdefer allocator.free(jumpdests);
    
    // Pass 3: Build basic blocks
    const basic_blocks = try buildBasicBlocks(allocator, code, push_ranges, jumpdests);
    errdefer {
        for (basic_blocks) |block| {
            allocator.free(block.entries);
            allocator.free(block.exits);
        }
        allocator.free(basic_blocks);
    }
    
    return AnalyzedBytecode{
        .code = code,
        .push_ranges = push_ranges,
        .jumpdests = jumpdests,
        .basic_blocks = basic_blocks,
        .allocator = allocator,
    };
}

// Pass 1: SIMD scan for PUSH instructions
fn findPushRanges(allocator: std.mem.Allocator, code: []const u8) ![]const PushRange {
    if (code.len == 0) return &.{};
    
    var ranges = std.ArrayList(PushRange){};
    defer ranges.deinit(allocator);
    
    // Get suggested vector length for this CPU
    const vector_len = std.simd.suggestVectorLengthForCpu(u8, builtin.cpu) orelse 1;
    
    if (vector_len > 1 and code.len >= vector_len) {
        try findPushRangesSimd(vector_len, allocator, &ranges, code);
    } else {
        try findPushRangesScalar(allocator, &ranges, code);
    }
    
    return try ranges.toOwnedSlice(allocator);
}

// Scalar fallback for small bytecode or platforms without SIMD
fn findPushRangesScalar(allocator: std.mem.Allocator, ranges: *std.ArrayList(PushRange), code: []const u8) !void {
    var i: usize = 0;
    
    while (i < code.len) {
        const op = code[i];
        
        if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
            const push_size = op - @intFromEnum(Opcode.PUSH1) + 1;
            const end = i + 1 + push_size;
            
            if (end > code.len) break; // Truncated push
            
            // Determine next opcode and fusion candidacy
            var next_opcode: u8 = 0;
            var is_fusion_candidate = false;
            
            if (end < code.len) {
                next_opcode = code[end];
                is_fusion_candidate = switch (next_opcode) {
                    @intFromEnum(Opcode.ADD),
                    @intFromEnum(Opcode.MUL),
                    @intFromEnum(Opcode.SUB),
                    @intFromEnum(Opcode.DIV),
                    @intFromEnum(Opcode.AND),
                    @intFromEnum(Opcode.OR),
                    @intFromEnum(Opcode.XOR),
                    @intFromEnum(Opcode.JUMP),
                    @intFromEnum(Opcode.JUMPI) => true,
                    else => false,
                };
            }
            
            try ranges.append(allocator, .{
                .start = @intCast(i),
                .end = @intCast(end),
                .size = @intCast(push_size),
                .next_opcode = next_opcode,
                .is_fusion_candidate = is_fusion_candidate,
            });
            
            i = end;
        } else {
            i += 1;
        }
    }
}

// SIMD implementation for Pass 1
fn findPushRangesSimd(comptime L: comptime_int, allocator: std.mem.Allocator, ranges: *std.ArrayList(PushRange), code: []const u8) !void {
    // Constants for PUSH detection
    const push1_vec: @Vector(L, u8) = @splat(@intFromEnum(Opcode.PUSH1));
    const push32_vec: @Vector(L, u8) = @splat(@intFromEnum(Opcode.PUSH32));
    
    var i: usize = 0;
    
    // Process L bytes at a time
    while (i + L <= code.len) {
        // Load L bytes into vector
        var bytes: [L]u8 = undefined;
        @memcpy(&bytes, code[i..i + L]);
        const v: @Vector(L, u8) = bytes;
        
        // Check which bytes are PUSH opcodes
        const is_push = (v >= push1_vec) & (v <= push32_vec);
        const is_push_array: [L]bool = is_push;
        
        // Process each potential PUSH
        for (is_push_array, 0..) |is_push_op, j| {
            if (is_push_op) {
                const pos = i + j;
                const op = code[pos];
                const push_size = op - @intFromEnum(Opcode.PUSH1) + 1;
                const end = pos + 1 + push_size;
                
                if (end <= code.len) {
                    // Check for fusion opportunity
                    var next_opcode: u8 = 0;
                    var is_fusion_candidate = false;
                    
                    if (end < code.len) {
                        next_opcode = code[end];
                        is_fusion_candidate = isFusableOpcode(next_opcode);
                    }
                    
                    try ranges.append(allocator, .{
                        .start = @intCast(pos),
                        .end = @intCast(end),
                        .size = @intCast(push_size),
                        .next_opcode = next_opcode,
                        .is_fusion_candidate = is_fusion_candidate,
                    });
                }
            }
        }
        
        i += L;
    }
    
    // Handle remaining bytes with scalar approach
    while (i < code.len) {
        const op = code[i];
        
        if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
            const push_size = op - @intFromEnum(Opcode.PUSH1) + 1;
            const end = i + 1 + push_size;
            
            if (end <= code.len) {
                var next_opcode: u8 = 0;
                var is_fusion_candidate = false;
                
                if (end < code.len) {
                    next_opcode = code[end];
                    is_fusion_candidate = isFusableOpcode(next_opcode);
                }
                
                try ranges.append(allocator, .{
                    .start = @intCast(i),
                    .end = @intCast(end),
                    .size = @intCast(push_size),
                    .next_opcode = next_opcode,
                    .is_fusion_candidate = is_fusion_candidate,
                });
            }
            
            i = end;
        } else {
            i += 1;
        }
    }
}

// Helper to check if opcode is fusable
fn isFusableOpcode(opcode: u8) bool {
    return switch (opcode) {
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.MUL),
        @intFromEnum(Opcode.SUB),
        @intFromEnum(Opcode.DIV),
        @intFromEnum(Opcode.AND),
        @intFromEnum(Opcode.OR),
        @intFromEnum(Opcode.XOR),
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.JUMPI) => true,
        else => false,
    };
}

// Pass 2: SIMD scan for JUMPDEST
fn findJumpdests(allocator: std.mem.Allocator, code: []const u8, push_ranges: []const PushRange) ![]const u16 {
    if (code.len == 0) return &.{};
    
    var jumpdests = std.ArrayList(u16){};
    defer jumpdests.deinit(allocator);
    
    // Get suggested vector length for this CPU
    const vector_len = std.simd.suggestVectorLengthForCpu(u8, builtin.cpu) orelse 1;
    
    if (vector_len > 1 and code.len >= vector_len) {
        try findJumpdestsSimd(vector_len, allocator, &jumpdests, code, push_ranges);
    } else {
        try findJumpdestsScalar(allocator, &jumpdests, code, push_ranges);
    }
    
    return try jumpdests.toOwnedSlice(allocator);
}

// Scalar fallback for JUMPDEST detection
fn findJumpdestsScalar(allocator: std.mem.Allocator, jumpdests: *std.ArrayList(u16), code: []const u8, push_ranges: []const PushRange) !void {
    for (code, 0..) |byte, i| {
        if (byte == @intFromEnum(Opcode.JUMPDEST)) {
            // Check if this JUMPDEST is in push data
            if (!isInPushData(@intCast(i), push_ranges)) {
                try jumpdests.append(allocator, @intCast(i));
            }
        }
    }
}

// SIMD implementation for Pass 2
fn findJumpdestsSimd(comptime L: comptime_int, allocator: std.mem.Allocator, jumpdests: *std.ArrayList(u16), code: []const u8, push_ranges: []const PushRange) !void {
    const jumpdest_vec: @Vector(L, u8) = @splat(@intFromEnum(Opcode.JUMPDEST));
    
    var i: usize = 0;
    
    // Process L bytes at a time
    while (i + L <= code.len) {
        // Load L bytes into vector
        var bytes: [L]u8 = undefined;
        @memcpy(&bytes, code[i..i + L]);
        const v: @Vector(L, u8) = bytes;
        
        // Compare all bytes against JUMPDEST
        const is_jumpdest = v == jumpdest_vec;
        const is_jumpdest_array: [L]bool = is_jumpdest;
        
        // Process each potential JUMPDEST
        for (is_jumpdest_array, 0..) |is_jd, j| {
            if (is_jd) {
                const pos = i + j;
                // Check if not in push data using binary search
                if (!isInPushData(@intCast(pos), push_ranges)) {
                    try jumpdests.append(allocator, @intCast(pos));
                }
            }
        }
        
        i += L;
    }
    
    // Handle remaining bytes
    while (i < code.len) : (i += 1) {
        if (code[i] == @intFromEnum(Opcode.JUMPDEST)) {
            if (!isInPushData(@intCast(i), push_ranges)) {
                try jumpdests.append(allocator, @intCast(i));
            }
        }
    }
}

// Pass 3: Build basic blocks from control flow
fn buildBasicBlocks(allocator: std.mem.Allocator, code: []const u8, push_ranges: []const PushRange, jumpdests: []const u16) ![]const BasicBlock {
    if (code.len == 0) return &.{};
    
    _ = push_ranges; // TODO: Use for finding jumps
    _ = jumpdests;   // TODO: Use for splitting blocks
    
    var blocks = std.ArrayList(BasicBlock){};
    defer blocks.deinit(allocator);
    
    // For simple linear code with no jumps, create a single block
    // TODO: This is a simplified implementation. Full implementation would:
    // 1. Find all JUMP/JUMPI instructions
    // 2. Split code at jump targets and after jumps
    // 3. Build control flow graph
    
    // For now, just create one block for the entire code
    const block = BasicBlock{
        .start = 0,
        .end = @intCast(code.len),
        .entries = &.{},
        .exits = &.{},
    };
    
    try blocks.append(allocator, block);
    
    return try blocks.toOwnedSlice(allocator);
}

// Helper: Check if PC is inside any push data range
fn isInPushData(pc: u16, push_ranges: []const PushRange) bool {
    // Binary search since push_ranges are sorted by start position
    var left: usize = 0;
    var right: usize = push_ranges.len;
    
    while (left < right) {
        const mid = (left + right) / 2;
        const range = push_ranges[mid];
        
        if (pc < range.start) {
            right = mid;
        } else if (pc >= range.end) {
            left = mid + 1;
        } else {
            // pc is between start and end
            return pc > range.start; // Not the PUSH opcode itself
        }
    }
    
    return false;
}

// ============= TESTS =============

test "Pass 1: PUSH detection - simple PUSH1" {
    const allocator = std.testing.allocator;
    
    // PUSH1 0x60 ADD
    const code = [_]u8{ 
        @intFromEnum(Opcode.PUSH1), 0x60, 
        @intFromEnum(Opcode.ADD) 
    };
    
    const ranges = try findPushRanges(allocator, &code);
    defer allocator.free(ranges);
    
    try std.testing.expectEqual(@as(usize, 1), ranges.len);
    try std.testing.expectEqual(@as(u16, 0), ranges[0].start);
    try std.testing.expectEqual(@as(u16, 2), ranges[0].end);
    try std.testing.expectEqual(@as(u8, 1), ranges[0].size);
    try std.testing.expectEqual(@intFromEnum(Opcode.ADD), ranges[0].next_opcode);
    try std.testing.expect(ranges[0].is_fusion_candidate);
}

test "Pass 1: PUSH detection - multiple PUSH instructions" {
    const allocator = std.testing.allocator;
    
    // PUSH1 0x10 PUSH2 0x20 0x30 PUSH4 0x40 0x50 0x60 0x70 STOP
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x10,
        @intFromEnum(Opcode.PUSH2), 0x20, 0x30,
        @intFromEnum(Opcode.PUSH4), 0x40, 0x50, 0x60, 0x70,
        @intFromEnum(Opcode.STOP),
    };
    
    const ranges = try findPushRanges(allocator, &code);
    defer allocator.free(ranges);
    
    try std.testing.expectEqual(@as(usize, 3), ranges.len);
    
    // First PUSH1
    try std.testing.expectEqual(@as(u16, 0), ranges[0].start);
    try std.testing.expectEqual(@as(u16, 2), ranges[0].end);
    try std.testing.expectEqual(@as(u8, 1), ranges[0].size);
    
    // Second PUSH2  
    try std.testing.expectEqual(@as(u16, 2), ranges[1].start);
    try std.testing.expectEqual(@as(u16, 5), ranges[1].end);
    try std.testing.expectEqual(@as(u8, 2), ranges[1].size);
    
    // Third PUSH4
    try std.testing.expectEqual(@as(u16, 5), ranges[2].start);
    try std.testing.expectEqual(@as(u16, 10), ranges[2].end);
    try std.testing.expectEqual(@as(u8, 4), ranges[2].size);
    try std.testing.expectEqual(@intFromEnum(Opcode.STOP), ranges[2].next_opcode);
    try std.testing.expect(!ranges[2].is_fusion_candidate); // STOP not fusable
}

test "Pass 1: PUSH detection - fusion candidates" {
    const allocator = std.testing.allocator;
    
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x05, @intFromEnum(Opcode.ADD),    // Fusable
        @intFromEnum(Opcode.PUSH1), 0x10, @intFromEnum(Opcode.MUL),    // Fusable
        @intFromEnum(Opcode.PUSH1), 0x20, @intFromEnum(Opcode.STOP),   // Not fusable
        @intFromEnum(Opcode.PUSH1), 0x30, @intFromEnum(Opcode.JUMP),   // Fusable
    };
    
    const ranges = try findPushRanges(allocator, &code);
    defer allocator.free(ranges);
    
    try std.testing.expectEqual(@as(usize, 4), ranges.len);
    try std.testing.expect(ranges[0].is_fusion_candidate);  // ADD
    try std.testing.expect(ranges[1].is_fusion_candidate);  // MUL
    try std.testing.expect(!ranges[2].is_fusion_candidate); // STOP
    try std.testing.expect(ranges[3].is_fusion_candidate);  // JUMP
}

test "isInPushData helper function" {
    const ranges = [_]PushRange{
        .{ .start = 0, .end = 2, .size = 1, .next_opcode = 0x01, .is_fusion_candidate = false },
        .{ .start = 5, .end = 8, .size = 2, .next_opcode = 0x02, .is_fusion_candidate = false },
        .{ .start = 10, .end = 15, .size = 4, .next_opcode = 0x03, .is_fusion_candidate = false },
    };
    
    // Test various positions
    try std.testing.expect(!isInPushData(0, &ranges));  // PUSH opcode itself
    try std.testing.expect(isInPushData(1, &ranges));   // Inside first range
    try std.testing.expect(!isInPushData(2, &ranges));  // Outside ranges
    try std.testing.expect(!isInPushData(5, &ranges));  // PUSH opcode itself
    try std.testing.expect(isInPushData(6, &ranges));   // Inside second range
    try std.testing.expect(isInPushData(7, &ranges));   // Inside second range
    try std.testing.expect(!isInPushData(8, &ranges));  // Outside ranges
    try std.testing.expect(isInPushData(11, &ranges));  // Inside third range
    try std.testing.expect(!isInPushData(15, &ranges)); // Outside ranges
}

test "Pass 2: JUMPDEST detection - simple case" {
    const allocator = std.testing.allocator;
    
    const code = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),                      // Valid JUMPDEST at 0
        @intFromEnum(Opcode.PUSH2), 0x00, 0x04,            // PUSH2 at 1
        @intFromEnum(Opcode.JUMPDEST),                      // Valid JUMPDEST at 4
        @intFromEnum(Opcode.PUSH1), @intFromEnum(Opcode.JUMPDEST), // Invalid - in push data at 6
        @intFromEnum(Opcode.JUMPDEST),                      // Valid JUMPDEST at 7
    };
    
    const push_ranges = [_]PushRange{
        .{ .start = 1, .end = 4, .size = 2, .next_opcode = @intFromEnum(Opcode.JUMPDEST), .is_fusion_candidate = false },
        .{ .start = 5, .end = 7, .size = 1, .next_opcode = @intFromEnum(Opcode.JUMPDEST), .is_fusion_candidate = false },
    };
    
    const jumpdests = try findJumpdests(allocator, &code, &push_ranges);
    defer allocator.free(jumpdests);
    
    try std.testing.expectEqual(@as(usize, 3), jumpdests.len);
    try std.testing.expectEqual(@as(u16, 0), jumpdests[0]);
    try std.testing.expectEqual(@as(u16, 4), jumpdests[1]);
    try std.testing.expectEqual(@as(u16, 7), jumpdests[2]);
}

test "Pass 3: Basic block construction - linear code" {
    const allocator = std.testing.allocator;
    
    // Simple linear code with no jumps
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x60,
        @intFromEnum(Opcode.PUSH1), 0x40,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    const blocks = try buildBasicBlocks(allocator, &code, &.{}, &.{});
    defer {
        for (blocks) |block| {
            allocator.free(block.entries);
            allocator.free(block.exits);
        }
        allocator.free(blocks);
    }
    
    // Should be one basic block
    try std.testing.expectEqual(@as(usize, 1), blocks.len);
    try std.testing.expectEqual(@as(u16, 0), blocks[0].start);
    try std.testing.expectEqual(@as(u16, 6), blocks[0].end);
    try std.testing.expectEqual(@as(usize, 0), blocks[0].entries.len);
    try std.testing.expectEqual(@as(usize, 0), blocks[0].exits.len);
}