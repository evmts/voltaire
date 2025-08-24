const std = @import("std");
const ArrayList = std.ArrayListAligned;
const Opcode = @import("opcode.zig").Opcode;
const bytecode_config = @import("bytecode_config.zig");
const BytecodeConfig = bytecode_config.BytecodeConfig;

// SECURITY MODEL: Untrusted Bytecode Validation
// ==============================================
// This module implements a two-phase security model for handling untrusted EVM bytecode:
//
// NOTE: This implementation does not support EOF (Ethereum Object Format) EIPs including:
// - EIP-3540: EOF - EVM Object Format v1
// - EIP-3670: EOF - Code Validation
// - EIP-4750: EOF - Functions
// - EIP-5450: EOF - Stack Validation
//
// Phase 1 - Validation (in init/buildBitmapsAndValidate):
// - Treat ALL bytecode as untrusted and potentially malicious
// - Use safe std library functions (e.g., std.meta.intToEnum) that perform runtime checks
// - Validate ALL assumptions about bytecode structure
// - Check for invalid opcodes, truncated PUSH instructions, invalid jump destinations
// - Build validated bitmaps that mark safe regions of code
//
// Phase 2 - Execution (after successful validation):
// - Once bytecode passes validation, we can use unsafe builtins for performance
// - @intFromEnum and @enumFromInt have no safety checks in release mode
// - We can use these because we've already validated all opcodes are valid
// - Bitmap lookups ensure we only execute at valid positions
//
// CRITICAL: Never use unsafe builtins during validation phase!
// CRITICAL: Never trust bytecode indices without checking bitmaps first!

// Constants for magic numbers used throughout the bytecode module
// These constants replace magic numbers to improve code readability and maintainability
const BITS_PER_BYTE = 8;
const BITMAP_SHIFT = 3; // log2(BITS_PER_BYTE) for efficient division by 8
const BITMAP_MASK = 7; // BITS_PER_BYTE - 1 for modulo 8
const INITCODE_GAS_PER_WORD = 2; // EIP-3860: 2 gas per 32-byte word
const BYTES_PER_WORD = 32; // EVM word size in bytes
const MAX_PUSH_BYTES = 32; // Maximum bytes for PUSH32
const OPCODE_TABLE_SIZE = 256; // Total possible opcode values (0x00-0xFF)
const CACHE_LINE_SIZE = 64; // Common cache line size for x86-64 and ARM64
const PREFETCH_DISTANCE = 256; // How far ahead to prefetch in bytes

/// Factory function to create a Bytecode type with the given configuration
pub fn createBytecode(comptime cfg: BytecodeConfig) type {
    comptime cfg.validate();
    
    const BytecodeType = struct {
        pub const ValidationError = error{
            InvalidOpcode,
            TruncatedPush,
            InvalidJumpDestination,
            OutOfMemory,
            InitcodeTooLarge,
        };

        pub const Stats = @import("bytecode_stats.zig").BytecodeStats;
        pub const PcType = cfg.PcType();

        const Self = @This();

        code: []const u8,
        allocator: std.mem.Allocator,
        is_push_data: []u8,
        is_op_start: []u8,
        is_jumpdest: []u8,
        
        pub fn init(allocator: std.mem.Allocator, code: []const u8) ValidationError!Self {
            var self = Self{
                .code = code,
                .allocator = allocator,
                .is_push_data = undefined,
                .is_op_start = undefined,
                .is_jumpdest = undefined,
            };
            // Build bitmaps and validate
            // This must run in constructor in order to populate the currently undefined bitmaps and guarantee the bytecode is valid
            try self.buildBitmapsAndValidate();
            return self;
        }
        
        /// Initialize bytecode from initcode (EIP-3860)
        /// Validates that initcode size doesn't exceed the maximum allowed
        pub fn initFromInitcode(allocator: std.mem.Allocator, initcode: []const u8) ValidationError!Self {
            if (initcode.len > cfg.max_initcode_size) {
                return error.InitcodeTooLarge;
            }
            return init(allocator, initcode);
        }
        
        /// Calculate the gas cost for initcode (EIP-3860)
        /// Returns 2 gas per 32-byte word of initcode
        pub fn calculateInitcodeGas(initcode_len: usize) u64 {
            // Gas cost is 2 per 32-byte word, rounding up
            const words = (initcode_len + BYTES_PER_WORD - 1) / BYTES_PER_WORD;
            return words * INITCODE_GAS_PER_WORD;
        }
        
        pub fn deinit(self: *Self) void {
            self.allocator.free(self.is_push_data);
            self.allocator.free(self.is_op_start);
            self.allocator.free(self.is_jumpdest);
            self.* = undefined;
        }
        
        /// Get the length of the bytecode
        pub inline fn len(self: Self) PcType {
            // https://ziglang.org/documentation/master/#intCast
            // @intCast converts between integer types, runtime safety-checked
            return @intCast(self.code.len);
        }
        
        /// Get the raw bytecode slice
        pub inline fn raw(self: Self) []const u8 {
            return self.code;
        }
        
        /// Get byte at index
        pub inline fn get(self: Self, index: PcType) ?u8 {
            if (index >= self.code.len) return null;
            return self.code[index];
        }
        /// Get byte at index
        pub inline fn get_unsafe(self: Self, index: PcType) u8 {
            return self.code[index];
        }

        /// Get opcode at position (doesn't check if it's actually an opcode start)
        pub inline fn getOpcode(self: Self, pc: PcType) ?u8 {
            return self.get(pc);
        }
        /// Get opcode at position (doesn't check if it's actually an opcode start)
        pub inline fn getOpcodeUnsafe(self: Self, pc: PcType) u8 {
            return self.get_unsafe(pc);
        }
        
        /// Check if a position is a valid jump destination
        /// Uses precomputed bitmap for O(1) lookup
        pub fn isValidJumpDest(self: Self, pc: PcType) bool {
            if (pc >= self.len()) return false;
            // https://ziglang.org/documentation/master/#as
            // @as performs type coercion, ensuring the value fits the target type
            return (self.is_jumpdest[pc >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(pc & BITMAP_MASK))) != 0;
        }
        
        /// Count the number of set bits in a byte range of a bitmap
        /// Uses hardware popcount instruction when available
        pub fn countBitsInRange(bitmap: []const u8, start_bit: usize, end_bit: usize) usize {
            if (start_bit >= end_bit) return 0;
            
            const start_byte = start_bit >> BITMAP_SHIFT;
            const end_byte = (end_bit + BITMAP_MASK) >> BITMAP_SHIFT;
            
            var count: usize = 0;
            
            // Handle partial first byte
            if (start_byte < bitmap.len) {
                const start_offset = start_bit & BITMAP_MASK;
                var mask: u8 = @as(u8, 0xFF) << @as(u3, @intCast(start_offset));
                if (start_byte == end_byte - 1) {
                    const end_offset = end_bit & BITMAP_MASK;
                    if (end_offset != 0) {
                        mask &= @as(u8, 0xFF) >> @as(u3, @intCast(BITS_PER_BYTE - end_offset));
                    }
                }
                count += @popCount(bitmap[start_byte] & mask);
            }
            
            // Handle full bytes in the middle
            var i = start_byte + 1;
            while (i < end_byte - 1 and i < bitmap.len) : (i += 1) {
                count += @popCount(bitmap[i]);
            }
            
            // Handle partial last byte
            if (i < end_byte and i < bitmap.len and i != start_byte) {
                const end_offset = end_bit & BITMAP_MASK;
                if (end_offset != 0) {
                    const mask = @as(u8, 0xFF) >> @as(u3, @intCast(BITS_PER_BYTE - end_offset));
                    count += @popCount(bitmap[i] & mask);
                }
            }
            
            return count;
        }
        
        /// Find the next set bit in a bitmap starting from a given position
        /// Uses hardware ctz (count trailing zeros) when available
        pub fn findNextSetBit(bitmap: []const u8, start_bit: usize) ?usize {
            const start_byte = start_bit >> BITMAP_SHIFT;
            if (start_byte >= bitmap.len) return null;
            
            // Check the starting byte (with offset)
            const start_offset = start_bit & BITMAP_MASK;
            const first_byte = bitmap[start_byte] & (@as(u8, 0xFF) << @as(u3, @intCast(start_offset)));
            if (first_byte != 0) {
                const bit_pos = @ctz(first_byte);
                return (start_byte << BITMAP_SHIFT) + bit_pos;
            }
            
            // Check subsequent bytes
            var i = start_byte + 1;
            while (i < bitmap.len) : (i += 1) {
                if (bitmap[i] != 0) {
                    const bit_pos = @ctz(bitmap[i]);
                    return (i << BITMAP_SHIFT) + bit_pos;
                }
            }
            
            return null;
        }
        
        /// Analyze bytecode and call callbacks for jump destinations
        /// This allows callers to build their own data structures
        pub fn analyzeJumpDests(
            self: Self,
            context: anytype,
            callback: fn (@TypeOf(context), pc: PcType) void,
        ) void {
            var i: PcType = 0;
            while (i < self.code.len) {
                @branchHint(.likely);
                const op = self.code[i];
                // https://ziglang.org/documentation/master/#intFromEnum
                // @intFromEnum converts an enum value to its integer representation
                if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                    const n = op - (@intFromEnum(Opcode.PUSH1) - 1);
                    i += 1 + n;
                } else {
                    if (op == @intFromEnum(Opcode.JUMPDEST)) {
                        callback(context, i);
                    }
                    i += 1;
                }
            }
        }
        
        /// Validate opcode range using SIMD
        fn validateOpcodeSimd(code: []const u8, comptime L: comptime_int) bool {
            const max_valid_opcode = @intFromEnum(Opcode.SELFDESTRUCT);
            const splat_max: @Vector(L, u8) = @splat(max_valid_opcode);
            
            var i: usize = 0;
            while (i + L <= code.len) : (i += L) {
                var arr: [L]u8 = undefined;
                inline for (0..L) |k| arr[k] = code[i + k];
                const v: @Vector(L, u8) = arr;
                // Check if any byte exceeds max valid opcode
                const gt_max: @Vector(L, bool) = v > splat_max;
                const gt_max_arr: [L]bool = gt_max;
                inline for (gt_max_arr) |exceeds| {
                    if (exceeds) {
                        @branchHint(.unlikely);
                        return false;
                    }
                }
            }
            // Check remaining bytes
            while (i < code.len) : (i += 1) {
                if (code[i] > max_valid_opcode) {
                    @branchHint(.unlikely);
                    return false;
                }
            }
            return true;
        }

        /// Set bits in bitmap using SIMD operations
        fn setBitmapBitsSimd(bitmap: []u8, indices: []const usize, comptime L: comptime_int) void {
            // Group indices by their byte positions for better cache efficiency
            var i: usize = 0;
            
            // Process L indices at a time
            while (i + L <= indices.len) : (i += L) {
                // Create vectors for byte indices and bit masks
                var byte_indices: [L]usize = undefined;
                var bit_masks: [L]u8 = undefined;
                
                inline for (0..L) |j| {
                    const idx = indices[i + j];
                    byte_indices[j] = idx >> BITMAP_SHIFT;
                    bit_masks[j] = @as(u8, 1) << @intCast(idx & BITMAP_MASK);
                }
                
                // Apply all masks (still sequential but with better locality)
                inline for (0..L) |j| {
                    if (byte_indices[j] < bitmap.len) {
                        bitmap[byte_indices[j]] |= bit_masks[j];
                    }
                }
            }
            
            // Handle remaining indices
            while (i < indices.len) : (i += 1) {
                const idx = indices[i];
                const byte_idx = idx >> BITMAP_SHIFT;
                if (byte_idx < bitmap.len) {
                    bitmap[byte_idx] |= @as(u8, 1) << @intCast(idx & BITMAP_MASK);
                }
            }
        }

        /// Pattern match for PUSH+OP fusion opportunities using SIMD
        fn findFusionPatternsSimd(self: Self, comptime L: comptime_int) !ArrayList(Stats.Fusion, null) {
            var fusions = ArrayList(Stats.Fusion, null).init(self.allocator);
            errdefer fusions.deinit();
            
            const push1 = @intFromEnum(Opcode.PUSH1);
            const push32 = @intFromEnum(Opcode.PUSH32);
            
            // Fusion targets
            const fusion_ops = [_]u8{
                @intFromEnum(Opcode.ADD),
                @intFromEnum(Opcode.SUB),
                @intFromEnum(Opcode.MUL),
                @intFromEnum(Opcode.DIV),
                @intFromEnum(Opcode.JUMP),
                @intFromEnum(Opcode.JUMPI),
            };
            
            // Create vectors for each fusion target
            const splat_add: @Vector(L, u8) = @splat(@intFromEnum(Opcode.ADD));
            const splat_sub: @Vector(L, u8) = @splat(@intFromEnum(Opcode.SUB));
            const splat_mul: @Vector(L, u8) = @splat(@intFromEnum(Opcode.MUL));
            const splat_div: @Vector(L, u8) = @splat(@intFromEnum(Opcode.DIV));
            const splat_jump: @Vector(L, u8) = @splat(@intFromEnum(Opcode.JUMP));
            const splat_jumpi: @Vector(L, u8) = @splat(@intFromEnum(Opcode.JUMPI));
            
            var i: usize = 0;
            while (i < self.code.len) {
                // Skip if not an operation start
                if ((self.is_op_start[i >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(i & BITMAP_MASK))) == 0) {
                    @branchHint(.unlikely);
                    i += 1;
                    continue;
                }
                
                const op = self.code[i];
                if (op >= push1 and op <= push32) {
                    const push_size = 1 + (op - (push1 - 1));
                    const next_op_pos = i + push_size;
                    
                    // Use SIMD to check multiple fusion opportunities at once if we have enough bytes
                    if (next_op_pos < self.code.len and next_op_pos + L <= self.code.len) {
                        // Load next L bytes starting from next_op_pos
                        var arr: [L]u8 = undefined;
                        inline for (0..L) |k| arr[k] = if (next_op_pos + k < self.code.len) self.code[next_op_pos + k] else 0;
                        const v: @Vector(L, u8) = arr;
                        
                        // Check all fusion patterns
                        const eq_add: @Vector(L, bool) = v == splat_add;
                        const eq_sub: @Vector(L, bool) = v == splat_sub;
                        const eq_mul: @Vector(L, bool) = v == splat_mul;
                        const eq_div: @Vector(L, bool) = v == splat_div;
                        const eq_jump: @Vector(L, bool) = v == splat_jump;
                        const eq_jumpi: @Vector(L, bool) = v == splat_jumpi;
                        
                        // Check if the first position matches any fusion op
                        const eq_add_arr: [L]bool = eq_add;
                        const eq_sub_arr: [L]bool = eq_sub;
                        const eq_mul_arr: [L]bool = eq_mul;
                        const eq_div_arr: [L]bool = eq_div;
                        const eq_jump_arr: [L]bool = eq_jump;
                        const eq_jumpi_arr: [L]bool = eq_jumpi;
                        
                        if (eq_add_arr[0] or eq_sub_arr[0] or eq_mul_arr[0] or eq_div_arr[0] or eq_jump_arr[0] or eq_jumpi_arr[0]) {
                            const target_op = if (eq_add_arr[0]) Opcode.ADD
                                else if (eq_sub_arr[0]) Opcode.SUB
                                else if (eq_mul_arr[0]) Opcode.MUL
                                else if (eq_div_arr[0]) Opcode.DIV
                                else if (eq_jump_arr[0]) Opcode.JUMP
                                else Opcode.JUMPI;
                            
                            try fusions.append(.{
                                .pc = i,
                                .second_opcode = target_op,
                            });
                        }
                    } else if (next_op_pos < self.code.len) {
                        // Fallback to scalar check for edge cases
                        const next_op = self.code[next_op_pos];
                        for (fusion_ops) |fusion_op| {
                            if (next_op == fusion_op) {
                                const target_op = std.meta.intToEnum(Opcode, fusion_op) catch unreachable;
                                try fusions.append(.{
                                    .pc = i,
                                    .second_opcode = target_op,
                                });
                                break;
                            }
                        }
                    }
                    i = next_op_pos;
                } else {
                    i += 1;
                }
            }
            
            return fusions;
        }

        /// Build bitmaps and validate bytecode
        fn buildBitmapsAndValidate(self: *Self) ValidationError!void {
            const N = self.code.len;
            // Empty bytecode is valid, allocate minimal bitmaps
            if (N == 0) {
                self.is_push_data = try self.allocator.alloc(u8, 1);
                self.is_op_start = try self.allocator.alloc(u8, 1);
                self.is_jumpdest = try self.allocator.alloc(u8, 1);
                self.is_push_data[0] = 0;
                self.is_op_start[0] = 0;
                self.is_jumpdest[0] = 0;
                return;
            }
            
            const bitmap_bytes = (N + BITMAP_MASK) >> BITMAP_SHIFT;
            // Align bitmap allocations to cache line boundaries for better performance
            const aligned_bitmap_bytes = (bitmap_bytes + CACHE_LINE_SIZE - 1) & ~@as(usize, CACHE_LINE_SIZE - 1);
            
            self.is_push_data = self.allocator.alignedAlloc(u8, CACHE_LINE_SIZE, aligned_bitmap_bytes) catch return error.OutOfMemory;
            errdefer self.allocator.free(self.is_push_data);
            self.is_op_start = self.allocator.alignedAlloc(u8, CACHE_LINE_SIZE, aligned_bitmap_bytes) catch return error.OutOfMemory;
            errdefer self.allocator.free(self.is_op_start);
            self.is_jumpdest = self.allocator.alignedAlloc(u8, CACHE_LINE_SIZE, aligned_bitmap_bytes) catch return error.OutOfMemory;
            errdefer self.allocator.free(self.is_jumpdest);
            @memset(self.is_push_data, 0);
            @memset(self.is_op_start, 0);
            @memset(self.is_jumpdest, 0);
            
            // First pass: validate all opcodes using SIMD if available
            if (comptime cfg.vector_length > 0) {
                if (!validateOpcodeSimd(self.code, cfg.vector_length)) {
                    return error.InvalidOpcode;
                }
            }
            
            var i: PcType = 0;
            while (i < N) {
                @branchHint(.likely);
                
                // Prefetch ahead for better cache performance on large bytecode
                if (i + PREFETCH_DISTANCE < N) {
                    @prefetch(&self.code[i + PREFETCH_DISTANCE], .{
                        .rw = .read,
                        .locality = 3, // Low temporal locality
                        .cache = .data,
                    });
                }
                
                self.is_op_start[i >> BITMAP_SHIFT] |= @as(u8, 1) << @intCast(i & BITMAP_MASK);
                const op = self.code[i];
                
                // SECURITY: Validate opcode using safe enum conversion
                // We need to ensure this is a valid opcode before using it
                // Note: If SIMD validation passed, this should never fail, but we still check for defense in depth
                const opcode_enum = std.meta.intToEnum(Opcode, op) catch {
                    // Invalid opcode found (unlikely after SIMD validation)
                    @branchHint(.unlikely);
                    return error.InvalidOpcode;
                };
                
                // Now we can safely check if it's a PUSH opcode
                if (@intFromEnum(opcode_enum) >= @intFromEnum(Opcode.PUSH1) and 
                    @intFromEnum(opcode_enum) <= @intFromEnum(Opcode.PUSH32)) {
                    const n: PcType = op - (@intFromEnum(Opcode.PUSH1) - 1);
                    if (i + n >= N) return error.TruncatedPush;
                    var j: PcType = 0;
                    while (j < n) : (j += 1) {
                        const idx = i + 1 + j;
                        self.is_push_data[idx >> BITMAP_SHIFT] |= @as(u8, 1) << @intCast(idx & BITMAP_MASK);
                    }
                    i += n + 1;
                } else {
                    i += 1;
                }
            }
            
            if (comptime cfg.vector_length > 0) {
                self.markJumpdestSimd(cfg.vector_length);
            } else {
                self.markJumpdestScalar();
            }
            
            i = 0;
            while (i < N) {
                @branchHint(.likely);
                if ((self.is_op_start[i >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(i & BITMAP_MASK))) == 0) {
                    @branchHint(.unlikely);
                    i += 1;
                    continue;
                }
                const op = self.code[i];
                if ((op == @intFromEnum(Opcode.JUMP) or op == @intFromEnum(Opcode.JUMPI)) and i > 0) {
                    var push_start: ?PcType = null;
                    var j: PcType = 0;
                    while (j < i) {
                        if ((self.is_op_start[j >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(j & BITMAP_MASK))) != 0) {
                            const prev_op = self.code[j];
                            if (prev_op >= @intFromEnum(Opcode.PUSH1) and prev_op <= @intFromEnum(Opcode.PUSH32)) {
                                const size = self.getInstructionSize(j);
                                if (j + size == i) {
                                    push_start = j;
                                    break;
                                }
                            }
                        }
                        j += 1;
                    }
                    if (push_start) |start| {
                        const push_op = self.code[start];
                        const n = push_op - (@intFromEnum(Opcode.PUSH1) - 1);
                        const target = self.readPushValueN(start, @intCast(n)) orelse unreachable;
                        if (target >= self.code.len) {
                            return error.InvalidJumpDestination;
                        }
                        const target_pc = @as(PcType, @intCast(target));
                        if ((self.is_jumpdest[target_pc >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(target_pc & BITMAP_MASK))) == 0) {
                            return error.InvalidJumpDestination;
                        }
                    }
                }
                i += self.getInstructionSize(i);
            }
        }
        
        /// Read a PUSH value at the given PC
        /// Based on plan_minimal.zig's getMetadata implementation
        // https://ziglang.org/documentation/master/std/#std.meta.Int
        pub fn readPushValue(self: Self, pc: PcType, comptime n: u8) ?std.meta.Int(.unsigned, n * 8) {
            if (pc >= self.code.len) return null;
            const op = self.code[pc];
            if (op != @intFromEnum(Opcode.PUSH1) + n - 1) return null; // Not the right PUSH opcode
            const start = pc + 1;
            if (start + n > self.code.len) return null; // Not enough bytes
            // https://ziglang.org/documentation/master/std/#std.meta.Int
            // Creates an unsigned integer type with n*8 bits (e.g., n=1 -> u8, n=2 -> u16)
            const T = std.meta.Int(.unsigned, n * BITS_PER_BYTE);
            var value: T = 0;
            var i: u8 = 0;
            // https://ziglang.org/documentation/master/std/#std.math.shl
            while (i < n) : (i += 1) value = std.math.shl(T, value, BITS_PER_BYTE) | @as(T, self.code[start + i]);
            return value;
        }
        
        /// Read a variable-sized PUSH value (returns u256)
        pub fn readPushValueN(self: Self, pc: PcType, n: u8) ?u256 {
            if (pc >= self.code.len or n == 0 or n > MAX_PUSH_BYTES) return null;
            const op = self.code[pc];
            if (op < @intFromEnum(Opcode.PUSH1) or op > @intFromEnum(Opcode.PUSH32)) return null;
            const expected_n = op - (@intFromEnum(Opcode.PUSH1) - 1);
            if (expected_n != n) return null;
            const start = pc + 1;
            const available = @min(n, self.code.len -| start);
            var value: u256 = 0;
            for (0..n) |i| value = if (i < available) (value << BITS_PER_BYTE) | self.code[start + i] else value << BITS_PER_BYTE; 
            return value;
        }
        
        /// Get the size of bytecode at PC (1 for most opcodes, 1+n for PUSH)
        pub fn getInstructionSize(self: Self, pc: PcType) PcType {
            if (pc >= self.code.len) return 0;
            const op = self.code[pc];
            if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) return 1 + (op - (@intFromEnum(Opcode.PUSH1) - 1));
            return 1;
        }
        
        /// Get the next PC after the instruction at the given PC
        pub fn getNextPc(self: Self, pc: PcType) ?PcType {
            const size = self.getInstructionSize(pc);
            if (size == 0) return null;
            const next = pc + size;
            if (next > self.code.len) return null;
            return next;
        }
        
        /// Get statistics about the bytecode
        pub fn getStats(self: Self) !Stats {
            var stats = Stats{
                .opcode_counts = [_]u32{0} ** OPCODE_TABLE_SIZE,
                .push_values = &.{},
                .potential_fusions = &.{},
                .jumpdests = &.{},
                .jumps = &.{},
                .backwards_jumps = 0,
                .is_create_code = false,
            };
            // https://ziglang.org/documentation/master/std/#std.array_list.Aligned
            var push_values = ArrayList(Stats.PushValue, null).init(self.allocator);
            defer push_values.deinit();
            // Use SIMD fusion detection if available
            var simd_fusions: ?ArrayList(Stats.Fusion, null) = null;
            if (comptime cfg.vector_length > 0) {
                simd_fusions = try self.findFusionPatternsSimd(cfg.vector_length);
            }
            defer if (simd_fusions) |*f| f.deinit();
            
            // https://ziglang.org/documentation/master/std/#std.array_list.Aligned
            var fusions = ArrayList(Stats.Fusion, null).init(self.allocator);
            defer fusions.deinit();
            // https://ziglang.org/documentation/master/std/#std.array_list.Aligned
            var jumpdests = ArrayList(PcType, null).init(self.allocator);
            defer jumpdests.deinit();
            // https://ziglang.org/documentation/master/std/#std.array_list.Aligned
            var jumps = ArrayList(Stats.Jump, null).init(self.allocator);
            defer jumps.deinit();
            var i: PcType = 0;
            while (i < self.code.len) {
                // Prefetch ahead for stats collection
                if (i + PREFETCH_DISTANCE < self.code.len) {
                    @prefetch(&self.code[i + PREFETCH_DISTANCE], .{
                        .rw = .read,
                        .locality = 3,
                        .cache = .data,
                    });
                }
                
                if ((self.is_op_start[i >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(i & BITMAP_MASK))) == 0) {
                    i += 1;
                    continue;
                }
                const op = self.code[i];
                stats.opcode_counts[op] += 1;
                if (op == @intFromEnum(Opcode.JUMPDEST)) try jumpdests.append(i);
                if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                    const n = op - (@intFromEnum(Opcode.PUSH1) - 1);
                    if (self.readPushValueN(i, @intCast(n))) |value| {
                        try push_values.append(.{ .pc = i, .value = value });
                        const next_pc = i + 1 + n;
                        
                        // Skip fusion detection if using SIMD (already done)
                        if (simd_fusions == null and next_pc < self.code.len) {
                            const next_op = self.code[next_pc];
                            if (next_op == @intFromEnum(Opcode.JUMP) or
                                next_op == @intFromEnum(Opcode.JUMPI) or
                                next_op == @intFromEnum(Opcode.ADD) or
                                next_op == @intFromEnum(Opcode.MUL) or
                                next_op == @intFromEnum(Opcode.SUB) or
                                next_op == @intFromEnum(Opcode.DIV)) {
                                try fusions.append(.{ 
                                    .pc = i, 
                                    .second_opcode = @as(Opcode, @enumFromInt(next_op))
                                });
                            }
                        }
                        if (next_pc < self.code.len and 
                            (self.code[next_pc] == @intFromEnum(Opcode.JUMP) or 
                             self.code[next_pc] == @intFromEnum(Opcode.JUMPI))) {
                            try jumps.append(.{ .pc = next_pc, .target = value });
                            if (value < i) {
                                stats.backwards_jumps += 1;
                            }
                        }
                    }
                }
                if (op == @intFromEnum(Opcode.CODECOPY)) {
                    stats.is_create_code = true;
                }
                i += self.getInstructionSize(i);
            }
            
            stats.push_values = try self.allocator.dupe(Stats.PushValue, push_values.items);
            
            // Use SIMD fusions if available, otherwise use scalar detected fusions
            if (simd_fusions) |simd_f| {
                stats.potential_fusions = try self.allocator.dupe(Stats.Fusion, simd_f.items);
            } else {
                stats.potential_fusions = try self.allocator.dupe(Stats.Fusion, fusions.items);
            }
            const jumpdests_usize = try self.allocator.alloc(usize, jumpdests.items.len);
            for (jumpdests.items, 0..) |pc, idx| {
                jumpdests_usize[idx] = @intCast(pc);
            }
            stats.jumpdests = jumpdests_usize;
            stats.jumps = try self.allocator.dupe(Stats.Jump, jumps.items);
            return stats;
        }

        /// Linear scan: set jumpdest bit at i when bytecode[i]==0x5b and the push-data bit is not set.
        fn markJumpdestScalar(self: Self) void {
            var i: usize = 0;
            while (i < self.len()) : (i += 1) {
                // Prefetch for sequential access
                if (i + PREFETCH_DISTANCE < self.len()) {
                    @prefetch(&self.code[i + PREFETCH_DISTANCE], .{
                        .rw = .read,
                        .locality = 3,
                        .cache = .data,
                    });
                }
                
                const test_push = (self.is_push_data[i >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(i & BITMAP_MASK))) != 0;
                if (self.code[i] == @intFromEnum(Opcode.JUMPDEST) and !test_push) {
                    self.is_jumpdest[i >> BITMAP_SHIFT] |= @as(u8, 1) << @intCast(i & BITMAP_MASK);
                }
            }
        }

        /// Vector scan: compare @Vector(L,u8) chunks to 0x5b, mask out push-data lanes, set jumpdest bits
        /// Optimized with prefetching and better SIMD utilization
        fn markJumpdestSimd(self: Self, comptime L: comptime_int) void {
            var i: usize = 0;
            const code_len = self.code.len;
            const splat_5b: @Vector(L, u8) = @splat(@as(u8, @intFromEnum(Opcode.JUMPDEST)));
            
            while (i + L <= code_len) : (i += L) {
                // Prefetch next iteration's data
                if (i + L + PREFETCH_DISTANCE < code_len) {
                    @prefetch(&self.code[i + L + PREFETCH_DISTANCE], .{
                        .rw = .read,
                        .locality = 3,
                        .cache = .data,
                    });
                    @prefetch(&self.is_push_data[(i + L + PREFETCH_DISTANCE) >> BITMAP_SHIFT], .{
                        .rw = .read,
                        .locality = 3,
                        .cache = .data,
                    });
                }
                
                // Load and compare bytecode chunk
                var arr: [L]u8 = undefined;
                inline for (0..L) |k| arr[k] = self.code[i + k];
                const v: @Vector(L, u8) = arr;
                const eq: @Vector(L, bool) = v == splat_5b;
                const eq_arr: [L]bool = eq;
                
                // Process matches in batches for better cache efficiency
                inline for (0..L) |j| {
                    const idx = i + j;
                    const byte_idx = idx >> BITMAP_SHIFT;
                    const bit_mask = @as(u8, 1) << @intCast(idx & BITMAP_MASK);
                    
                    // Check if it's a JUMPDEST and not push data
                    if (eq_arr[j]) {
                        const test_push = (self.is_push_data[byte_idx] & bit_mask) != 0;
                        if (!test_push) {
                            self.is_jumpdest[byte_idx] |= bit_mask;
                        }
                    }
                }
            }
            
            // Handle remaining bytes
            var t: usize = i;
            while (t < code_len) : (t += 1) {
                const byte_idx = t >> BITMAP_SHIFT;
                const bit_mask = @as(u8, 1) << @intCast(t & BITMAP_MASK);
                const test_push = (self.is_push_data[byte_idx] & bit_mask) != 0;
                if (self.code[t] == @intFromEnum(Opcode.JUMPDEST) and !test_push) {
                    self.is_jumpdest[byte_idx] |= bit_mask;
                }
            }
        }

    };
    return BytecodeType;
}

// Default configuration with EIP-3860 initcode limit of 49,152 bytes (2 * max contract size)
const default_config = BytecodeConfig{};
pub const Bytecode = createBytecode(default_config);
pub const BytecodeValidationError = Bytecode.ValidationError;

test "Bytecode.init and basic getters" {
    const allocator = std.testing.allocator;
    const code = [_]u8{ 0x60, 0x40, 0x60, 0x80 }; // PUSH1 0x40 PUSH1 0x80
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(Bytecode.PcType, 4), bytecode.len());
    try std.testing.expectEqualSlices(u8, &code, bytecode.raw());
    try std.testing.expectEqual(@as(?u8, 0x60), bytecode.get(0));
    try std.testing.expectEqual(@as(?u8, 0x40), bytecode.get(1));
    try std.testing.expectEqual(@as(?u8, null), bytecode.get(4)); // Out of bounds
    try std.testing.expectEqual(@as(?u8, 0x60), bytecode.getOpcode(0));
}

test "Bytecode.isValidJumpDest" {
    const allocator = std.testing.allocator;
    const code = [_]u8{ 0x60, 0x03, 0x56, 0x5b, 0x00 };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expect(!bytecode.isValidJumpDest(0)); 
    try std.testing.expect(!bytecode.isValidJumpDest(1));
    try std.testing.expect(!bytecode.isValidJumpDest(2)); 
    try std.testing.expect(bytecode.isValidJumpDest(3)); 
    try std.testing.expect(!bytecode.isValidJumpDest(4)); 
    const code2 = [_]u8{ 0x62, 0x5b, 0x5b, 0x5b, 0x00 }; 
    var bytecode2 = try Bytecode.init(allocator, &code2);
    defer bytecode2.deinit();
    try std.testing.expect(!bytecode2.isValidJumpDest(1)); 
    try std.testing.expect(!bytecode2.isValidJumpDest(2));
    try std.testing.expect(!bytecode2.isValidJumpDest(3));
}

test "Bytecode buildBitmaps are created on init" {
    const allocator = std.testing.allocator;
    const code = [_]u8{ 0x61, 0x12, 0x34, 0x5b, 0x60, 0x56, 0x00 };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expect((bytecode.is_op_start[0] & (1 << 0)) != 0); 
    try std.testing.expect((bytecode.is_op_start[0] & (1 << 1)) == 0);
    try std.testing.expect((bytecode.is_op_start[0] & (1 << 2)) == 0);
    try std.testing.expect((bytecode.is_op_start[0] & (1 << 3)) != 0);
    try std.testing.expect((bytecode.is_op_start[0] & (1 << 4)) != 0);
    try std.testing.expect((bytecode.is_op_start[0] & (1 << 5)) == 0);
    try std.testing.expect((bytecode.is_op_start[0] & (1 << 6)) != 0);
    try std.testing.expect((bytecode.is_push_data[0] & (1 << 0)) == 0); 
    try std.testing.expect((bytecode.is_push_data[0] & (1 << 1)) != 0);
    try std.testing.expect((bytecode.is_push_data[0] & (1 << 2)) != 0);
    try std.testing.expect((bytecode.is_push_data[0] & (1 << 3)) == 0);
    try std.testing.expect((bytecode.is_push_data[0] & (1 << 4)) == 0);
    try std.testing.expect((bytecode.is_push_data[0] & (1 << 5)) != 0);
    try std.testing.expect((bytecode.is_push_data[0] & (1 << 6)) == 0);
    try std.testing.expect((bytecode.is_jumpdest[0] & (1 << 3)) != 0); 
}

test "Bytecode.readPushValue" {
    const allocator = std.testing.allocator;
    const code = [_]u8{ 
        0x60, 0x42,                 // PUSH1
        0x61, 0x12, 0x34,          // PUSH2
        0x63, 0xDE, 0xAD, 0xBE, 0xEF // PUSH4
    };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(?u8, 0x42), bytecode.readPushValue(0, 1));
    try std.testing.expectEqual(@as(?u16, 0x1234), bytecode.readPushValue(2, 2));
    try std.testing.expectEqual(@as(?u32, 0xDEADBEEF), bytecode.readPushValue(5, 4));
    try std.testing.expectEqual(@as(?u8, null), bytecode.readPushValue(2, 1)); // Not PUSH1
    try std.testing.expectEqual(@as(?u256, 0x42), bytecode.readPushValueN(0, 1));
    try std.testing.expectEqual(@as(?u256, 0x1234), bytecode.readPushValueN(2, 2));
    try std.testing.expectEqual(@as(?u256, 0xDEADBEEF), bytecode.readPushValueN(5, 4));
}

test "Bytecode.getInstructionSize and getNextPc" {
    const allocator = std.testing.allocator;
    var code: [36]u8 = undefined;
    code[0] = 0x60; // PUSH1
    code[1] = 0x42;
    code[2] = 0x01; // ADD
    code[3] = 0x7f; // PUSH32
    for (4..36) |i| code[i] = @intCast(i);
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(Bytecode.PcType, 2), bytecode.getInstructionSize(0)); // PUSH1
    try std.testing.expectEqual(@as(Bytecode.PcType, 1), bytecode.getInstructionSize(2)); // ADD
    try std.testing.expectEqual(@as(Bytecode.PcType, 33), bytecode.getInstructionSize(3)); // PUSH32
    try std.testing.expectEqual(@as(Bytecode.PcType, 0), bytecode.getInstructionSize(100)); // Out of bounds
    try std.testing.expectEqual(@as(?Bytecode.PcType, 2), bytecode.getNextPc(0)); // After PUSH1
    try std.testing.expectEqual(@as(?Bytecode.PcType, 3), bytecode.getNextPc(2)); // After ADD
    try std.testing.expectEqual(@as(?Bytecode.PcType, 36), bytecode.getNextPc(3)); // After PUSH32
    try std.testing.expectEqual(@as(?Bytecode.PcType, null), bytecode.getNextPc(100)); // Out of bounds
}

test "Bytecode.analyzeJumpDests" {
    const allocator = std.testing.allocator;
    const code = [_]u8{ 
        0x60, 0x03, 0x56, // PUSH1 0x03 JUMP
        0x5b,             // JUMPDEST at PC 3
        0x60, 0x07, 0x56, // PUSH1 0x07 JUMP
        0x5b,             // JUMPDEST at PC 7
        0x00              // STOP
    };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    const Context = struct {
        // https://ziglang.org/documentation/master/std/#std.array_list.Aligned
        jumpdests: ArrayList(Bytecode.PcType, null),
        fn callback(self: *@This(), pc: Bytecode.PcType) void {
            self.jumpdests.append(pc) catch unreachable;
        }
    };
    var context = Context{ .jumpdests = ArrayList(Bytecode.PcType, null).init(std.testing.allocator) };
    defer context.jumpdests.deinit();
    bytecode.analyzeJumpDests(&context, Context.callback);
    try std.testing.expectEqual(@as(usize, 2), context.jumpdests.items.len);
    try std.testing.expectEqual(@as(Bytecode.PcType, 3), context.jumpdests.items[0]);
    try std.testing.expectEqual(@as(Bytecode.PcType, 7), context.jumpdests.items[1]);
}

test "Bytecode validation - invalid opcode" {
    const allocator = std.testing.allocator;
    // Test bytecode with invalid opcode 0xFE
    const code = [_]u8{ 0x60, 0x01, 0xFE }; // PUSH1 0x01 INVALID
    const result = Bytecode.init(allocator, &code);
    try std.testing.expectError(error.InvalidOpcode, result);
}

test "Bytecode validation - PUSH extends past end" {
    const allocator = std.testing.allocator;
    // PUSH2 but only 1 byte of data available
    const code = [_]u8{ 0x61, 0x42 }; // PUSH2 with only 1 byte
    const result = Bytecode.init(allocator, &code);
    try std.testing.expectError(error.TruncatedPush, result);
}

test "Bytecode validation - PUSH32 extends past end" {
    const allocator = std.testing.allocator;
    // PUSH32 but not enough data
    var code: [32]u8 = undefined;
    code[0] = 0x7f; // PUSH32
    for (1..32) |i| {
        code[i] = @intCast(i);
    }
    const result = Bytecode.init(allocator, &code); // Only 32 bytes, needs 33
    try std.testing.expectError(error.TruncatedPush, result);
}

test "Bytecode validation - Jump to invalid destination" {
    const allocator = std.testing.allocator;
    // PUSH1 0x10 JUMP but no JUMPDEST at 0x10
    const code = [_]u8{ 0x60, 0x10, 0x56, 0x00 }; // PUSH1 0x10 JUMP STOP
    const result = Bytecode.init(allocator, &code);
    try std.testing.expectError(error.InvalidJumpDestination, result);
}

test "Bytecode validation - Jump to valid JUMPDEST" {
    const allocator = std.testing.allocator;
    // PUSH1 0x04 JUMP JUMPDEST STOP
    const code = [_]u8{ 0x60, 0x04, 0x56, 0x00, 0x5b, 0x00 };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expect(bytecode.is_jumpdest.len > 0);
}

test "Bytecode validation - JUMPI to invalid destination" {
    const allocator = std.testing.allocator;
    // PUSH1 0x10 PUSH1 0x01 JUMPI but no JUMPDEST at 0x10
    const code = [_]u8{ 0x60, 0x10, 0x60, 0x01, 0x57 }; // PUSH1 0x10 PUSH1 0x01 JUMPI
    const result = Bytecode.init(allocator, &code);
    try std.testing.expectError(error.InvalidJumpDestination, result);
}

test "Bytecode validation - empty bytecode is valid" {
    const allocator = std.testing.allocator;
    const code = [_]u8{};
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(usize, 0), bytecode.len());
}

test "Bytecode validation - only STOP is valid" {
    const allocator = std.testing.allocator;
    const code = [_]u8{0x00};
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(usize, 1), bytecode.len());
}

test "Bytecode validation - JUMPDEST inside PUSH data is invalid jump target" {
    const allocator = std.testing.allocator;
    // PUSH1 0x03 JUMP [0x5b inside push] JUMPDEST
    const code = [_]u8{ 0x60, 0x03, 0x56, 0x62, 0x5b, 0x5b, 0x5b }; // PUSH1 0x03 JUMP PUSH3 0x5b5b5b
    const result = Bytecode.init(allocator, &code);
    try std.testing.expectError(error.InvalidJumpDestination, result);
}

test "Bytecode.getStats - basic stats" {
    const allocator = std.testing.allocator;
    // PUSH1 0x05 PUSH1 0x03 ADD STOP
    const code = [_]u8{ 0x60, 0x05, 0x60, 0x03, 0x01, 0x00 };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    // Check opcode counts
    try std.testing.expectEqual(@as(u32, 2), stats.opcode_counts[@intFromEnum(Opcode.PUSH1)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(Opcode.ADD)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(Opcode.STOP)]);
    
    // Check push values
    try std.testing.expectEqual(@as(usize, 2), stats.push_values.len);
    try std.testing.expectEqual(@as(u256, 0x05), stats.push_values[0].value);
    try std.testing.expectEqual(@as(usize, 0), stats.push_values[0].pc);
    try std.testing.expectEqual(@as(u256, 0x03), stats.push_values[1].value);
    try std.testing.expectEqual(@as(usize, 2), stats.push_values[1].pc);
    
    // Test formatStats
    const output = try stats.formatStats(allocator);
    defer allocator.free(output);
    
    // Verify it contains expected content
    try std.testing.expect(std.mem.indexOf(u8, output, "Bytecode Statistics") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PUSH1: 2") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "ADD: 1") != null);
}

test "Bytecode.getStats - potential fusions" {
    const allocator = std.testing.allocator;
    // PUSH1 0x04 JUMP JUMPDEST PUSH1 0x10 ADD STOP
    const code = [_]u8{ 0x60, 0x04, 0x56, 0x00, 0x5b, 0x60, 0x10, 0x01, 0x00 };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    // Check for PUSH+JUMP fusion
    try std.testing.expectEqual(@as(usize, 2), stats.potential_fusions.len);
    try std.testing.expectEqual(@as(usize, 0), stats.potential_fusions[0].pc); // PUSH1 at 0
    try std.testing.expectEqual(Opcode.JUMP, stats.potential_fusions[0].second_opcode);
    
    // Check for PUSH+ADD fusion
    try std.testing.expectEqual(@as(usize, 5), stats.potential_fusions[1].pc); // PUSH1 at 5
    try std.testing.expectEqual(Opcode.ADD, stats.potential_fusions[1].second_opcode);
}

test "Bytecode.getStats - jumpdests and jumps" {
    const allocator = std.testing.allocator;
    // PUSH1 0x08 JUMP PUSH1 0x00 PUSH1 0x00 REVERT JUMPDEST PUSH1 0x0C JUMP JUMPDEST STOP
    const code = [_]u8{ 
        0x60, 0x08, 0x56,       // PUSH1 0x08 JUMP
        0x60, 0x00, 0x60, 0x00, 0xfd, // PUSH1 0x00 PUSH1 0x00 REVERT
        0x5b,                   // JUMPDEST at PC 8
        0x60, 0x0C, 0x56,       // PUSH1 0x0C JUMP
        0x5b,                   // JUMPDEST at PC 12
        0x00                    // STOP
    };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    // Check jumpdests
    try std.testing.expectEqual(@as(usize, 2), stats.jumpdests.len);
    try std.testing.expectEqual(@as(usize, 8), stats.jumpdests[0]);
    try std.testing.expectEqual(@as(usize, 12), stats.jumpdests[1]);
    
    // Check jumps
    try std.testing.expectEqual(@as(usize, 2), stats.jumps.len);
    try std.testing.expectEqual(@as(usize, 2), stats.jumps[0].pc); // JUMP at PC 2
    try std.testing.expectEqual(@as(u256, 0x08), stats.jumps[0].target);
    try std.testing.expectEqual(@as(usize, 11), stats.jumps[1].pc); // JUMP at PC 11
    try std.testing.expectEqual(@as(u256, 0x0C), stats.jumps[1].target);
    
    // Check backwards jumps (none in this example)
    try std.testing.expectEqual(@as(usize, 0), stats.backwards_jumps);
}

test "Bytecode.getStats - backwards jumps (loops)" {
    const allocator = std.testing.allocator;
    // JUMPDEST PUSH1 0x01 PUSH1 0x00 JUMP (infinite loop)
    const code = [_]u8{ 
        0x5b,             // JUMPDEST at PC 0
        0x60, 0x01,       // PUSH1 0x01
        0x60, 0x00,       // PUSH1 0x00
        0x56              // JUMP (back to 0)
    };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    // Check backwards jumps
    try std.testing.expectEqual(@as(usize, 1), stats.backwards_jumps);
    try std.testing.expectEqual(@as(usize, 1), stats.jumps.len);
    try std.testing.expectEqual(@as(u256, 0x00), stats.jumps[0].target);
    try std.testing.expectEqual(@as(usize, 5), stats.jumps[0].pc);
}

test "Bytecode.getStats - create code detection" {
    const allocator = std.testing.allocator;
    // Bytecode that starts with constructor pattern (returns runtime code)
    // PUSH1 0x10 PUSH1 0x20 PUSH1 0x00 CODECOPY PUSH1 0x10 PUSH1 0x00 RETURN
    const code = [_]u8{ 
        0x60, 0x10,       // PUSH1 0x10 (size)
        0x60, 0x20,       // PUSH1 0x20 (offset in code)
        0x60, 0x00,       // PUSH1 0x00 (dest in memory)
        0x39,             // CODECOPY
        0x60, 0x10,       // PUSH1 0x10 (size)
        0x60, 0x00,       // PUSH1 0x00 (offset in memory)
        0xf3              // RETURN
    };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    // Check if identified as create code
    try std.testing.expect(stats.is_create_code);
}

test "Bytecode.getStats - runtime code detection" {
    const allocator = std.testing.allocator;
    // Normal runtime code (no CODECOPY + RETURN pattern)
    const code = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 }; // PUSH1 1 PUSH1 2 ADD STOP
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    // Should not be identified as create code
    try std.testing.expect(!stats.is_create_code);
}

test "Bytecode SIMD opcode validation" {
    const allocator = std.testing.allocator;
    
    // Test bytecode with invalid opcode (0xFF is not a valid opcode)
    const invalid_code = [_]u8{ 0x60, 0x01, 0xFF, 0x00 }; // PUSH1 1 INVALID STOP
    const result = Bytecode.init(allocator, &invalid_code);
    try std.testing.expectError(Bytecode.ValidationError.InvalidOpcode, result);
    
    // Test bytecode with all valid opcodes
    const valid_code = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 }; // PUSH1 1 PUSH1 2 ADD STOP
    var bytecode = try Bytecode.init(allocator, &valid_code);
    defer bytecode.deinit();
    
    // Should pass validation
    try std.testing.expectEqual(@as(usize, 6), bytecode.len());
}

test "Bytecode initcode validation - EIP-3860" {
    const allocator = std.testing.allocator;
    
    // Test with valid initcode size (under limit)
    const valid_initcode = try allocator.alloc(u8, 1000);
    defer allocator.free(valid_initcode);
    @memset(valid_initcode, 0x00); // Fill with STOP opcodes
    
    var bytecode = try Bytecode.initFromInitcode(allocator, valid_initcode);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(usize, 1000), bytecode.len());
    
    // Test with initcode at exactly the limit
    const max_initcode = try allocator.alloc(u8, default_config.max_initcode_size);
    defer allocator.free(max_initcode);
    @memset(max_initcode, 0x00);
    
    var bytecode2 = try Bytecode.initFromInitcode(allocator, max_initcode);
    defer bytecode2.deinit();
    try std.testing.expectEqual(@as(usize, default_config.max_initcode_size), bytecode2.len());
    
    // Test with initcode exceeding the limit
    const oversized_initcode = try allocator.alloc(u8, default_config.max_initcode_size + 1);
    defer allocator.free(oversized_initcode);
    @memset(oversized_initcode, 0x00);
    
    const result = Bytecode.initFromInitcode(allocator, oversized_initcode);
    try std.testing.expectError(error.InitcodeTooLarge, result);
}

test "Bytecode calculateInitcodeGas - EIP-3860" {
    // Test gas calculation for various initcode sizes
    
    // Empty initcode = 0 words = 0 gas
    try std.testing.expectEqual(@as(u64, 0), Bytecode.calculateInitcodeGas(0));
    
    // 1 byte = 1 word = 2 gas
    try std.testing.expectEqual(@as(u64, 2), Bytecode.calculateInitcodeGas(1));
    
    // 32 bytes = 1 word = 2 gas
    try std.testing.expectEqual(@as(u64, 2), Bytecode.calculateInitcodeGas(32));
    
    // 33 bytes = 2 words = 4 gas
    try std.testing.expectEqual(@as(u64, 4), Bytecode.calculateInitcodeGas(33));
    
    // 64 bytes = 2 words = 4 gas
    try std.testing.expectEqual(@as(u64, 4), Bytecode.calculateInitcodeGas(64));
    
    // 1000 bytes = 32 words (31.25 rounded up) = 64 gas
    try std.testing.expectEqual(@as(u64, 64), Bytecode.calculateInitcodeGas(1000));
    
    // Maximum initcode size: 49,152 bytes = 1536 words = 3072 gas
    try std.testing.expectEqual(@as(u64, 3072), Bytecode.calculateInitcodeGas(default_config.max_initcode_size));
}

test "Bytecode SIMD fusion pattern detection" {
    const allocator = std.testing.allocator;
    
    // Test all fusion patterns: PUSH + ADD/SUB/MUL/DIV/JUMP/JUMPI
    const code = [_]u8{
        0x60, 0x01, 0x01, // PUSH1 1 ADD
        0x60, 0x02, 0x03, // PUSH1 2 SUB
        0x60, 0x03, 0x02, // PUSH1 3 MUL
        0x60, 0x04, 0x04, // PUSH1 4 DIV
        0x60, 0x0F, 0x56, // PUSH1 15 JUMP
        0x60, 0x12, 0x57, // PUSH1 18 JUMPI
        0x00              // STOP
    };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    // Check that all 6 fusion opportunities were detected
    try std.testing.expectEqual(@as(usize, 6), stats.potential_fusions.len);
    
    // Verify each fusion
    try std.testing.expectEqual(@as(usize, 0), stats.potential_fusions[0].pc);
    try std.testing.expectEqual(Opcode.ADD, stats.potential_fusions[0].second_opcode);
    
    try std.testing.expectEqual(@as(usize, 3), stats.potential_fusions[1].pc);
    try std.testing.expectEqual(Opcode.SUB, stats.potential_fusions[1].second_opcode);
    
    try std.testing.expectEqual(@as(usize, 6), stats.potential_fusions[2].pc);
    try std.testing.expectEqual(Opcode.MUL, stats.potential_fusions[2].second_opcode);
    
    try std.testing.expectEqual(@as(usize, 9), stats.potential_fusions[3].pc);
    try std.testing.expectEqual(Opcode.DIV, stats.potential_fusions[3].second_opcode);
    
    try std.testing.expectEqual(@as(usize, 12), stats.potential_fusions[4].pc);
    try std.testing.expectEqual(Opcode.JUMP, stats.potential_fusions[4].second_opcode);
    
    try std.testing.expectEqual(@as(usize, 15), stats.potential_fusions[5].pc);
    try std.testing.expectEqual(Opcode.JUMPI, stats.potential_fusions[5].second_opcode);
}

test "Bytecode.getStats - all opcode types counted" {
    const allocator = std.testing.allocator;
    // Use various opcodes
    const code = [_]u8{ 
        0x60, 0x01,   // PUSH1 1
        0x80,         // DUP1
        0x01,         // ADD
        0x60, 0x20,   // PUSH1 32
        0x52,         // MSTORE
        0x60, 0x20,   // PUSH1 32
        0x51,         // MLOAD
        0x00          // STOP
    };
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    // Verify counts
    try std.testing.expectEqual(@as(u32, 3), stats.opcode_counts[@intFromEnum(Opcode.PUSH1)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(Opcode.DUP1)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(Opcode.ADD)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(Opcode.MSTORE)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(Opcode.MLOAD)]);
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(Opcode.STOP)]);
}

test "Bytecode.countBitsInRange - basic functionality" {
    const allocator = std.testing.allocator;
    // Create a simple bitmap for testing
    var bitmap = try allocator.alloc(u8, 4);
    defer allocator.free(bitmap);
    @memset(bitmap, 0);
    
    // Set some bits: bit 0, 2, 8, 15, 17, 23
    bitmap[0] = 0b00000101; // bits 0 and 2
    bitmap[1] = 0b10000001; // bits 8 and 15
    bitmap[2] = 0b00000010; // bit 17
    bitmap[3] = 0b10000000; // bit 23
    
    // Test full range
    try std.testing.expectEqual(@as(usize, 6), Bytecode.countBitsInRange(bitmap, 0, 32));
    
    // Test partial ranges
    try std.testing.expectEqual(@as(usize, 2), Bytecode.countBitsInRange(bitmap, 0, 8));
    try std.testing.expectEqual(@as(usize, 2), Bytecode.countBitsInRange(bitmap, 8, 16));
    try std.testing.expectEqual(@as(usize, 1), Bytecode.countBitsInRange(bitmap, 16, 20));
    
    // Test single bit ranges
    try std.testing.expectEqual(@as(usize, 1), Bytecode.countBitsInRange(bitmap, 0, 1));
    try std.testing.expectEqual(@as(usize, 0), Bytecode.countBitsInRange(bitmap, 1, 2));
    
    // Test empty range
    try std.testing.expectEqual(@as(usize, 0), Bytecode.countBitsInRange(bitmap, 10, 10));
}

test "Bytecode.findNextSetBit - basic functionality" {
    const allocator = std.testing.allocator;
    // Create a simple bitmap for testing
    var bitmap = try allocator.alloc(u8, 4);
    defer allocator.free(bitmap);
    @memset(bitmap, 0);
    
    // Set some bits: bit 0, 2, 8, 15, 17, 23
    bitmap[0] = 0b00000101; // bits 0 and 2
    bitmap[1] = 0b10000001; // bits 8 and 15
    bitmap[2] = 0b00000010; // bit 17
    bitmap[3] = 0b10000000; // bit 23
    
    // Find from start
    try std.testing.expectEqual(@as(?usize, 0), Bytecode.findNextSetBit(bitmap, 0));
    
    // Find from after first bit
    try std.testing.expectEqual(@as(?usize, 2), Bytecode.findNextSetBit(bitmap, 1));
    
    // Find from after second bit
    try std.testing.expectEqual(@as(?usize, 8), Bytecode.findNextSetBit(bitmap, 3));
    
    // Find from middle of byte
    try std.testing.expectEqual(@as(?usize, 15), Bytecode.findNextSetBit(bitmap, 9));
    
    // Find last bit
    try std.testing.expectEqual(@as(?usize, 23), Bytecode.findNextSetBit(bitmap, 18));
    
    // No more bits after last
    try std.testing.expectEqual(@as(?usize, null), Bytecode.findNextSetBit(bitmap, 24));
    
    // Start beyond bitmap
    try std.testing.expectEqual(@as(?usize, null), Bytecode.findNextSetBit(bitmap, 100));
}

test "Bytecode cache-aligned allocations" {
    const allocator = std.testing.allocator;
    // Test that bitmaps are allocated with cache line alignment
    const code = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 }; // PUSH1 1 PUSH1 2 ADD STOP
    var bytecode = try Bytecode.init(allocator, &code);
    defer bytecode.deinit();
    
    // Check that bitmaps are aligned to cache line boundaries
    const push_data_addr = @intFromPtr(bytecode.is_push_data.ptr);
    const op_start_addr = @intFromPtr(bytecode.is_op_start.ptr);
    const jumpdest_addr = @intFromPtr(bytecode.is_jumpdest.ptr);
    
    try std.testing.expect(push_data_addr % CACHE_LINE_SIZE == 0);
    try std.testing.expect(op_start_addr % CACHE_LINE_SIZE == 0);
    try std.testing.expect(jumpdest_addr % CACHE_LINE_SIZE == 0);
}
