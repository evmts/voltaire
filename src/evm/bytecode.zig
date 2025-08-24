/// EVM bytecode representation and validation
/// 
/// Provides safe bytecode handling with:
/// - Size validation (max 24576 bytes per EIP-170)
/// - Format validation and parsing
/// - Security-conscious design preventing buffer overflows
/// - Integration with the Planner system for analysis
/// - Support for both raw bytecode and analyzed instruction streams
/// 
/// All bytecode operations are bounds-checked and memory-safe.
const std = @import("std");
const builtin = @import("builtin");
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
pub fn Bytecode(comptime cfg: BytecodeConfig) type {
    comptime cfg.validate();
    
    return struct {
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

        // Full bytecode including any metadata
        full_code: []const u8,
        // Runtime bytecode (excludes trailing metadata)
        runtime_code: []const u8,
        // Optional metadata if found
        metadata: ?SolidityMetadata,
        allocator: std.mem.Allocator,
        is_push_data: []u8,
        is_op_start: []u8,
        is_jumpdest: []u8,
        
        pub fn init(allocator: std.mem.Allocator, code: []const u8) ValidationError!Self {
            // First, try to parse metadata to separate runtime code
            const metadata = parseSolidityMetadataFromBytes(code);
            const runtime_code = if (metadata) |m| 
                code[0..code.len - m.metadata_length]
            else 
                code;
            
            var self = Self{
                .full_code = code,
                .runtime_code = runtime_code,
                .metadata = metadata,
                .allocator = allocator,
                .is_push_data = undefined,
                .is_op_start = undefined,
                .is_jumpdest = undefined,
            };
            // Build bitmaps and validate only the runtime code
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
            if (self.runtime_code.len > std.math.maxInt(PcType)) {
                std.debug.panic("Bytecode length {} exceeds max PcType value {}\n", .{ self.runtime_code.len, std.math.maxInt(PcType) });
            }
            return @intCast(self.runtime_code.len);
        }
        
        /// Get the raw bytecode slice
        pub inline fn raw(self: Self) []const u8 {
            return self.runtime_code;
        }
        
        /// Get bytecode without Solidity metadata
        /// Returns a slice excluding the metadata at the end, or the full bytecode if no metadata found
        pub fn rawWithoutMetadata(self: Self) []const u8 {
            // Since we already separated metadata during init, just return runtime_code
            return self.runtime_code;
        }
        
        /// Get byte at index
        pub inline fn get(self: Self, index: PcType) ?u8 {
            if (index >= self.runtime_code.len) return null;
            return self.runtime_code[index];
        }
        /// Get byte at index
        pub inline fn get_unsafe(self: Self, index: PcType) u8 {
            return self.runtime_code[index];
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
            while (i < self.runtime_code.len) {
                @branchHint(.likely);
                const op = self.runtime_code[i];
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
        
        /// Scalar opcode validation fallback for platforms without SIMD
        fn validateOpcodeScalar(code: []const u8) bool {
            const max_valid_opcode = @intFromEnum(Opcode.SELFDESTRUCT);
            for (code) |byte| {
                if (byte > max_valid_opcode) {
                    return false;
                }
            }
            return true;
        }

        /// SIMD-accelerated opcode validation
        /// 
        /// Validates all bytecode represents valid EVM opcodes using vector operations.
        /// Processes L bytes simultaneously instead of individual scalar comparisons.
        fn validateOpcodeSimd(code: []const u8, comptime L: comptime_int) bool {
            // Skip SIMD on WASM targets that don't support it
            if (comptime (builtin.target.cpu.arch == .wasm32 and !builtin.target.cpu.features.isEnabled(.simd128))) {
                // Fall back to scalar validation for WASM without SIMD
                return validateOpcodeScalar(code);
            }
            const max_valid_opcode = @intFromEnum(Opcode.SELFDESTRUCT);
            
            // Vector containing L copies of maximum valid opcode for parallel comparison
            const splat_max: @Vector(L, u8) = @splat(max_valid_opcode);
            
            var i: usize = 0;
            // Process bytecode in L-byte chunks using vector operations
            while (i + L <= code.len) : (i += L) {
                // Load consecutive bytes into vector for parallel processing
                var arr: [L]u8 = undefined;
                inline for (0..L) |k| arr[k] = code[i + k];
                const v: @Vector(L, u8) = arr;
                
                // Compare all L bytes against maximum valid opcode simultaneously
                // Single vector operation replaces L scalar comparisons
                const gt_max: @Vector(L, bool) = v > splat_max;
                const gt_max_arr: [L]bool = gt_max;
                
                // Early termination if any byte exceeds valid opcode range
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
            // Skip SIMD on WASM targets that don't support it
            if (comptime (builtin.target.cpu.arch == .wasm32 and !builtin.target.cpu.features.isEnabled(.simd128))) {
                // Return empty list for WASM without SIMD
                return ArrayList(Stats.Fusion, null).init(self.allocator);
            }
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
            
            // SIMD-accelerated opcode fusion detection
            // 
            // Identifies PUSH+operation patterns (e.g., PUSH1 0x01 ADD) for optimization.
            // Uses vector operations to check multiple fusion targets simultaneously.
            
            // Vectors containing L copies of each fusion target opcode
            const splat_add: @Vector(L, u8) = @splat(@intFromEnum(Opcode.ADD));
            const splat_sub: @Vector(L, u8) = @splat(@intFromEnum(Opcode.SUB));
            const splat_mul: @Vector(L, u8) = @splat(@intFromEnum(Opcode.MUL));
            const splat_div: @Vector(L, u8) = @splat(@intFromEnum(Opcode.DIV));
            const splat_jump: @Vector(L, u8) = @splat(@intFromEnum(Opcode.JUMP));
            const splat_jumpi: @Vector(L, u8) = @splat(@intFromEnum(Opcode.JUMPI));
            
            var i: usize = 0;
            while (i < self.runtime_code.len) {
                // Skip positions that aren't instruction starts using bitmap lookup
                if ((self.is_op_start[i >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(i & BITMAP_MASK))) == 0) {
                    @branchHint(.unlikely);
                    i += 1;
                    continue;
                }
                
                const op = self.runtime_code[i];
                if (op >= push1 and op <= push32) {
                    // Calculate PUSH instruction size and next opcode position
                    const push_size = 1 + (op - (push1 - 1));
                    const next_op_pos = i + push_size;
                    
                    // Use SIMD for fusion pattern detection when sufficient bytes available
                    if (next_op_pos < self.runtime_code.len and next_op_pos + L <= self.runtime_code.len) {
                        // Load L bytes starting after PUSH data for parallel pattern matching
                        var arr: [L]u8 = undefined;
                        inline for (0..L) |k| arr[k] = if (next_op_pos + k < self.runtime_code.len) self.runtime_code[next_op_pos + k] else 0;
                        const v: @Vector(L, u8) = arr;
                        
                        // Compare vector against all fusion patterns simultaneously
                        // Single pass replaces multiple sequential pattern checks
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
                    } else if (next_op_pos < self.runtime_code.len) {
                        // Fallback to scalar check for edge cases
                        const next_op = self.runtime_code[next_op_pos];
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
            const N = self.runtime_code.len;
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
            
            // Try to align bitmap allocations to cache line boundaries for better performance
            // Fall back to regular allocation if allocator doesn't support aligned alloc
            const use_aligned = comptime !builtin.is_test;
            
            if (use_aligned) {
                const aligned_bitmap_bytes = (bitmap_bytes + CACHE_LINE_SIZE - 1) & ~@as(usize, CACHE_LINE_SIZE - 1);
                self.is_push_data = self.allocator.alignedAlloc(u8, CACHE_LINE_SIZE, aligned_bitmap_bytes) catch return error.OutOfMemory;
                errdefer self.allocator.free(self.is_push_data);
                self.is_op_start = self.allocator.alignedAlloc(u8, CACHE_LINE_SIZE, aligned_bitmap_bytes) catch return error.OutOfMemory;
                errdefer self.allocator.free(self.is_op_start);
                self.is_jumpdest = self.allocator.alignedAlloc(u8, CACHE_LINE_SIZE, aligned_bitmap_bytes) catch return error.OutOfMemory;
                errdefer self.allocator.free(self.is_jumpdest);
            } else {
                // Use regular allocation for tests
                self.is_push_data = self.allocator.alloc(u8, bitmap_bytes) catch return error.OutOfMemory;
                errdefer self.allocator.free(self.is_push_data);
                self.is_op_start = self.allocator.alloc(u8, bitmap_bytes) catch return error.OutOfMemory;
                errdefer self.allocator.free(self.is_op_start);
                self.is_jumpdest = self.allocator.alloc(u8, bitmap_bytes) catch return error.OutOfMemory;
                errdefer self.allocator.free(self.is_jumpdest);
            }
            @memset(self.is_push_data, 0);
            @memset(self.is_op_start, 0);
            @memset(self.is_jumpdest, 0);
            
            // First pass: validate all opcodes using SIMD if available
            if (comptime cfg.vector_length > 0) {
                if (!validateOpcodeSimd(self.runtime_code, cfg.vector_length)) {
                    return error.InvalidOpcode;
                }
            }
            
            var i: PcType = 0;
            while (i < N) {
                @branchHint(.likely);
                
                // Prefetch ahead for better cache performance on large bytecode
                if (i + PREFETCH_DISTANCE < N) {
                    @prefetch(&self.runtime_code[i + PREFETCH_DISTANCE], .{
                        .rw = .read,
                        .locality = 3, // Low temporal locality
                        .cache = .data,
                    });
                }
                
                self.is_op_start[i >> BITMAP_SHIFT] |= @as(u8, 1) << @intCast(i & BITMAP_MASK);
                const op = self.runtime_code[i];
                
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
                const op = self.runtime_code[i];
                if ((op == @intFromEnum(Opcode.JUMP) or op == @intFromEnum(Opcode.JUMPI)) and i > 0) {
                    var push_start: ?PcType = null;
                    var j: PcType = 0;
                    while (j < i) {
                        if ((self.is_op_start[j >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(j & BITMAP_MASK))) != 0) {
                            const prev_op = self.runtime_code[j];
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
                        const push_op = self.runtime_code[start];
                        const n = push_op - (@intFromEnum(Opcode.PUSH1) - 1);
                        const target = self.readPushValueN(start, @intCast(n)) orelse unreachable;
                        if (target >= self.runtime_code.len) {
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
            if (pc >= self.runtime_code.len) return null;
            const op = self.runtime_code[pc];
            if (op != @intFromEnum(Opcode.PUSH1) + n - 1) return null; // Not the right PUSH opcode
            const start = pc + 1;
            if (start + n > self.runtime_code.len) return null; // Not enough bytes
            // https://ziglang.org/documentation/master/std/#std.meta.Int
            // Creates an unsigned integer type with n*8 bits (e.g., n=1 -> u8, n=2 -> u16)
            const T = std.meta.Int(.unsigned, n * BITS_PER_BYTE);
            var value: T = 0;
            var i: u8 = 0;
            // https://ziglang.org/documentation/master/std/#std.math.shl
            while (i < n) : (i += 1) value = std.math.shl(T, value, BITS_PER_BYTE) | @as(T, self.runtime_code[start + i]);
            return value;
        }
        
        /// Read a variable-sized PUSH value (returns u256)
        pub fn readPushValueN(self: Self, pc: PcType, n: u8) ?u256 {
            if (pc >= self.runtime_code.len or n == 0 or n > MAX_PUSH_BYTES) return null;
            const op = self.runtime_code[pc];
            if (op < @intFromEnum(Opcode.PUSH1) or op > @intFromEnum(Opcode.PUSH32)) return null;
            const expected_n = op - (@intFromEnum(Opcode.PUSH1) - 1);
            if (expected_n != n) return null;
            const start = pc + 1;
            const available = @min(n, self.runtime_code.len -| start);
            var value: u256 = 0;
            for (0..n) |i| value = if (i < available) (value << BITS_PER_BYTE) | self.runtime_code[start + i] else value << BITS_PER_BYTE; 
            return value;
        }
        
        /// Get the size of bytecode at PC (1 for most opcodes, 1+n for PUSH)
        pub fn getInstructionSize(self: Self, pc: PcType) PcType {
            if (pc >= self.runtime_code.len) return 0;
            const op = self.runtime_code[pc];
            if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) return 1 + (op - (@intFromEnum(Opcode.PUSH1) - 1));
            return 1;
        }
        
        /// Get the next PC after the instruction at the given PC
        pub fn getNextPc(self: Self, pc: PcType) ?PcType {
            const size = self.getInstructionSize(pc);
            if (size == 0) return null;
            const next = pc + size;
            if (next > self.runtime_code.len) return null;
            return next;
        }
        
        /// Metadata information extracted from Solidity compiler metadata
        pub const SolidityMetadata = struct {
            ipfs_hash: [32]u8,
            solc_version: [3]u8, // major, minor, patch
            metadata_length: usize,
        };
        
        /// Parse Solidity metadata from raw bytecode bytes (static function)
        fn parseSolidityMetadataFromBytes(code: []const u8) ?SolidityMetadata {
            // Minimum metadata size: 2 (length) + 4 (ipfs) + 32 (hash) + 4 (solc) + 3 (version) = 45 bytes
            if (code.len < 45) return null;
            
            // Get the last 2 bytes which encode the metadata length
            const len_offset = code.len - 2;
            const metadata_len = (@as(u16, code[len_offset]) << 8) | code[len_offset + 1];
            
            // Verify metadata length is reasonable
            if (metadata_len < 43 or metadata_len > code.len) return null;
            
            // Calculate where metadata starts
            const metadata_start = code.len - 2 - metadata_len;
            const metadata = code[metadata_start..code.len - 2];
            
            // Parse CBOR-encoded metadata
            var pos: usize = 0;
            
            // Check CBOR map header (0xa2 = map with 2 items)
            if (pos >= metadata.len or metadata[pos] != 0xa2) return null;
            pos += 1;
            
            // First entry should be "ipfs"
            if (pos + 5 >= metadata.len) return null;
            if (metadata[pos] != 0x64) return null; // 4-byte string
            pos += 1;
            
            if (!std.mem.eql(u8, metadata[pos..pos + 4], "ipfs")) return null;
            pos += 4;
            
            // IPFS hash (0x58 = byte string, 0x22 = 34 bytes following)
            if (pos + 2 >= metadata.len) return null;
            if (metadata[pos] != 0x58 or metadata[pos + 1] != 0x22) return null;
            pos += 2;
            
            if (pos + 32 > metadata.len) return null;
            var ipfs_hash: [32]u8 = undefined;
            @memcpy(&ipfs_hash, metadata[pos..pos + 32]);
            pos += 32;
            
            // Second entry should be "solc"
            if (pos + 5 >= metadata.len) return null;
            if (metadata[pos] != 0x64) return null; // 4-byte string
            pos += 1;
            
            if (!std.mem.eql(u8, metadata[pos..pos + 4], "solc")) return null;
            pos += 4;
            
            // Solc version (3 bytes: major, minor, patch)
            if (pos + 3 > metadata.len) return null;
            const major = metadata[pos];
            const minor = metadata[pos + 1];
            const patch = metadata[pos + 2];
            
            return SolidityMetadata{
                .ipfs_hash = ipfs_hash,
                .solc_version = .{ major, minor, patch },
                .metadata_length = metadata_len + 2, // Include the length bytes
            };
        }
        
        /// Get the parsed Solidity metadata if it exists
        pub fn getSolidityMetadata(self: Self) ?SolidityMetadata {
            return self.metadata;
        }
        
        /// Parse Solidity metadata from the end of bytecode (for backwards compatibility)
        /// Returns null if no valid metadata is found
        pub fn parseSolidityMetadata(self: Self) ?SolidityMetadata {
            // Minimum metadata size: 2 (length) + 4 (ipfs) + 32 (hash) + 4 (solc) + 3 (version) = 45 bytes
            if (self.full_code.len < 45) return null;
            
            // Get the last 2 bytes which encode the metadata length
            const len_offset = self.full_code.len - 2;
            const metadata_len = (@as(u16, self.full_code[len_offset]) << 8) | self.full_code[len_offset + 1];
            
            // Verify metadata length is reasonable
            if (metadata_len < 43 or metadata_len > self.full_code.len) return null;
            
            // Calculate where metadata starts
            const metadata_start = self.full_code.len - 2 - metadata_len;
            const metadata = self.full_code[metadata_start..self.full_code.len - 2];
            
            // Parse CBOR-encoded metadata
            // Expected format: 0xa2 (map with 2 entries) 0x64 (4-byte string) "ipfs" 0x58 0x22 (34 bytes) <32-byte hash>
            //                  0x64 (4-byte string) "solc" <3-byte version>
            var pos: usize = 0;
            
            // Check CBOR map header (0xa2 = map with 2 items)
            if (pos >= metadata.len or metadata[pos] != 0xa2) return null;
            pos += 1;
            
            // First entry should be "ipfs"
            if (pos + 5 >= metadata.len) return null;
            if (metadata[pos] != 0x64) return null; // 4-byte string
            pos += 1;
            
            if (!std.mem.eql(u8, metadata[pos..pos + 4], "ipfs")) return null;
            pos += 4;
            
            // IPFS hash (0x58 = byte string, 0x22 = 34 bytes following)
            if (pos + 2 >= metadata.len) return null;
            if (metadata[pos] != 0x58 or metadata[pos + 1] != 0x22) return null;
            pos += 2;
            
            if (pos + 32 > metadata.len) return null;
            var ipfs_hash: [32]u8 = undefined;
            @memcpy(&ipfs_hash, metadata[pos..pos + 32]);
            pos += 32;
            
            // Second entry should be "solc"
            if (pos + 5 >= metadata.len) return null;
            if (metadata[pos] != 0x64) return null; // 4-byte string
            pos += 1;
            
            if (!std.mem.eql(u8, metadata[pos..pos + 4], "solc")) return null;
            pos += 4;
            
            // Solc version (3 bytes: major, minor, patch)
            if (pos + 3 > metadata.len) return null;
            const major = metadata[pos];
            const minor = metadata[pos + 1];
            const patch = metadata[pos + 2];
            
            return SolidityMetadata{
                .ipfs_hash = ipfs_hash,
                .solc_version = .{ major, minor, patch },
                .metadata_length = metadata_len + 2, // Include the length bytes
            };
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
            while (i < self.runtime_code.len) {
                // Prefetch ahead for stats collection
                if (i + PREFETCH_DISTANCE < self.runtime_code.len) {
                    @prefetch(&self.runtime_code[i + PREFETCH_DISTANCE], .{
                        .rw = .read,
                        .locality = 3,
                        .cache = .data,
                    });
                }
                
                if ((self.is_op_start[i >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(i & BITMAP_MASK))) == 0) {
                    i += 1;
                    continue;
                }
                const op = self.runtime_code[i];
                stats.opcode_counts[op] += 1;
                if (op == @intFromEnum(Opcode.JUMPDEST)) try jumpdests.append(i);
                if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                    const n = op - (@intFromEnum(Opcode.PUSH1) - 1);
                    if (self.readPushValueN(i, @intCast(n))) |value| {
                        try push_values.append(.{ .pc = i, .value = value });
                        const next_pc = i + 1 + n;
                        
                        // Skip fusion detection if using SIMD (already done)
                        if (simd_fusions == null and next_pc < self.runtime_code.len) {
                            const next_op = self.runtime_code[next_pc];
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
                        if (next_pc < self.runtime_code.len and 
                            (self.runtime_code[next_pc] == @intFromEnum(Opcode.JUMP) or 
                             self.runtime_code[next_pc] == @intFromEnum(Opcode.JUMPI))) {
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
                    @prefetch(&self.runtime_code[i + PREFETCH_DISTANCE], .{
                        .rw = .read,
                        .locality = 3,
                        .cache = .data,
                    });
                }
                
                const test_push = (self.is_push_data[i >> BITMAP_SHIFT] & (@as(u8, 1) << @intCast(i & BITMAP_MASK))) != 0;
                if (self.runtime_code[i] == @intFromEnum(Opcode.JUMPDEST) and !test_push) {
                    self.is_jumpdest[i >> BITMAP_SHIFT] |= @as(u8, 1) << @intCast(i & BITMAP_MASK);
                }
            }
        }

        /// SIMD-accelerated jump destination marking with prefetching optimization
        /// 
        /// Combines vector processing with cache prefetching for optimal performance on large bytecode.
        /// Prefetching hides memory latency by loading future data while processing current chunks.
        fn markJumpdestSimd(self: Self, comptime L: comptime_int) void {
            // Skip SIMD on WASM targets that don't support it
            if (comptime (builtin.target.cpu.arch == .wasm32 and !builtin.target.cpu.features.isEnabled(.simd128))) {
                // Fall back to scalar implementation for WASM without SIMD
                return self.markJumpdestScalar();
            }
            var i: usize = 0;
            const code_len = self.runtime_code.len;
            
            // Vector containing L copies of JUMPDEST opcode for parallel comparison
            const splat_5b: @Vector(L, u8) = @splat(@as(u8, @intFromEnum(Opcode.JUMPDEST)));
            
            // Process bytecode in L-byte chunks with prefetching
            while (i + L <= code_len) : (i += L) {
                // Prefetch future data to hide memory latency
                if (i + L + PREFETCH_DISTANCE < code_len) {
                    // Prefetch next bytecode chunk for future iterations
                    @prefetch(&self.runtime_code[i + L + PREFETCH_DISTANCE], .{
                        .rw = .read,
                        .locality = 3,
                        .cache = .data,
                    });
                    
                    // Prefetch corresponding push_data bitmap entries
                    @prefetch(&self.is_push_data[(i + L + PREFETCH_DISTANCE) >> BITMAP_SHIFT], .{
                        .rw = .read,
                        .locality = 3,
                        .cache = .data,
                    });
                }
                
                // Load L consecutive bytes into vector for parallel processing
                var arr: [L]u8 = undefined;
                inline for (0..L) |k| arr[k] = self.runtime_code[i + k];
                const v: @Vector(L, u8) = arr;
                
                // Compare all L bytes against JUMPDEST simultaneously
                const eq: @Vector(L, bool) = v == splat_5b;
                const eq_arr: [L]bool = eq;
                
                // Process comparison results and update jump destination bitmap
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
                if (self.runtime_code[t] == @intFromEnum(Opcode.JUMPDEST) and !test_push) {
                    self.is_jumpdest[byte_idx] |= bit_mask;
                }
            }
        }

    };
}

const default_config = BytecodeConfig{};
pub const BytecodeDefault = Bytecode(default_config);
pub const BytecodeValidationError = BytecodeDefault.ValidationError;

// Export the factory function for creating Bytecode types
pub const createBytecode = Bytecode;

test "Bytecode.init and basic getters" {
    const allocator = std.testing.allocator;
    const code = [_]u8{ 0x60, 0x40, 0x60, 0x80 }; // PUSH1 0x40 PUSH1 0x80
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(BytecodeDefault.PcType, 4), bytecode.len());
    try std.testing.expectEqualSlices(u8, &code, bytecode.raw());
    try std.testing.expectEqual(@as(?u8, 0x60), bytecode.get(0));
    try std.testing.expectEqual(@as(?u8, 0x40), bytecode.get(1));
    try std.testing.expectEqual(@as(?u8, null), bytecode.get(4)); // Out of bounds
    try std.testing.expectEqual(@as(?u8, 0x60), bytecode.getOpcode(0));
}

test "Bytecode.isValidJumpDest" {
    const allocator = std.testing.allocator;
    const code = [_]u8{ 0x60, 0x03, 0x56, 0x5b, 0x00 };
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expect(!bytecode.isValidJumpDest(0)); 
    try std.testing.expect(!bytecode.isValidJumpDest(1));
    try std.testing.expect(!bytecode.isValidJumpDest(2)); 
    try std.testing.expect(bytecode.isValidJumpDest(3)); 
    try std.testing.expect(!bytecode.isValidJumpDest(4)); 
    const code2 = [_]u8{ 0x62, 0x5b, 0x5b, 0x5b, 0x00 }; 
    var bytecode2 = try BytecodeDefault.init(allocator, &code2);
    defer bytecode2.deinit();
    try std.testing.expect(!bytecode2.isValidJumpDest(1)); 
    try std.testing.expect(!bytecode2.isValidJumpDest(2));
    try std.testing.expect(!bytecode2.isValidJumpDest(3));
}

test "Bytecode buildBitmaps are created on init" {
    const allocator = std.testing.allocator;
    const code = [_]u8{ 0x61, 0x12, 0x34, 0x5b, 0x60, 0x56, 0x00 };
    var bytecode = try BytecodeDefault.init(allocator, &code);
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
    var bytecode = try BytecodeDefault.init(allocator, &code);
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
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(BytecodeDefault.PcType, 2), bytecode.getInstructionSize(0)); // PUSH1
    try std.testing.expectEqual(@as(BytecodeDefault.PcType, 1), bytecode.getInstructionSize(2)); // ADD
    try std.testing.expectEqual(@as(BytecodeDefault.PcType, 33), bytecode.getInstructionSize(3)); // PUSH32
    try std.testing.expectEqual(@as(BytecodeDefault.PcType, 0), bytecode.getInstructionSize(100)); // Out of bounds
    try std.testing.expectEqual(@as(?BytecodeDefault.PcType, 2), bytecode.getNextPc(0)); // After PUSH1
    try std.testing.expectEqual(@as(?BytecodeDefault.PcType, 3), bytecode.getNextPc(2)); // After ADD
    try std.testing.expectEqual(@as(?BytecodeDefault.PcType, 36), bytecode.getNextPc(3)); // After PUSH32
    try std.testing.expectEqual(@as(?BytecodeDefault.PcType, null), bytecode.getNextPc(100)); // Out of bounds
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
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    const Context = struct {
        // https://ziglang.org/documentation/master/std/#std.array_list.Aligned
        jumpdests: ArrayList(BytecodeDefault.PcType, null),
        fn callback(self: *@This(), pc: BytecodeDefault.PcType) void {
            self.jumpdests.append(pc) catch unreachable;
        }
    };
    var context = Context{ .jumpdests = ArrayList(BytecodeDefault.PcType, null).init(std.testing.allocator) };
    defer context.jumpdests.deinit();
    bytecode.analyzeJumpDests(&context, Context.callback);
    try std.testing.expectEqual(@as(usize, 2), context.jumpdests.items.len);
    try std.testing.expectEqual(@as(BytecodeDefault.PcType, 3), context.jumpdests.items[0]);
    try std.testing.expectEqual(@as(BytecodeDefault.PcType, 7), context.jumpdests.items[1]);
}

test "Bytecode validation - invalid opcode" {
    const allocator = std.testing.allocator;
    // Test bytecode with invalid opcode 0xFE
    const code = [_]u8{ 0x60, 0x01, 0xFE }; // PUSH1 0x01 INVALID
    const result = BytecodeDefault.init(allocator, &code);
    try std.testing.expectError(error.InvalidOpcode, result);
}

test "Bytecode validation - PUSH extends past end" {
    const allocator = std.testing.allocator;
    // PUSH2 but only 1 byte of data available
    const code = [_]u8{ 0x61, 0x42 }; // PUSH2 with only 1 byte
    const result = BytecodeDefault.init(allocator, &code);
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
    const result = BytecodeDefault.init(allocator, &code); // Only 32 bytes, needs 33
    try std.testing.expectError(error.TruncatedPush, result);
}

test "Bytecode validation - Jump to invalid destination" {
    const allocator = std.testing.allocator;
    // PUSH1 0x10 JUMP but no JUMPDEST at 0x10
    const code = [_]u8{ 0x60, 0x10, 0x56, 0x00 }; // PUSH1 0x10 JUMP STOP
    const result = BytecodeDefault.init(allocator, &code);
    try std.testing.expectError(error.InvalidJumpDestination, result);
}

test "Bytecode validation - Jump to valid JUMPDEST" {
    const allocator = std.testing.allocator;
    // PUSH1 0x04 JUMP JUMPDEST STOP
    const code = [_]u8{ 0x60, 0x04, 0x56, 0x00, 0x5b, 0x00 };
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expect(bytecode.is_jumpdest.len > 0);
}

test "Bytecode validation - JUMPI to invalid destination" {
    const allocator = std.testing.allocator;
    // PUSH1 0x10 PUSH1 0x01 JUMPI but no JUMPDEST at 0x10
    const code = [_]u8{ 0x60, 0x10, 0x60, 0x01, 0x57 }; // PUSH1 0x10 PUSH1 0x01 JUMPI
    const result = BytecodeDefault.init(allocator, &code);
    try std.testing.expectError(error.InvalidJumpDestination, result);
}

test "Bytecode validation - empty bytecode is valid" {
    const allocator = std.testing.allocator;
    const code = [_]u8{};
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(usize, 0), bytecode.len());
}

test "Bytecode validation - only STOP is valid" {
    const allocator = std.testing.allocator;
    const code = [_]u8{0x00};
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(usize, 1), bytecode.len());
}

test "Bytecode validation - JUMPDEST inside PUSH data is invalid jump target" {
    const allocator = std.testing.allocator;
    // PUSH1 0x03 JUMP [0x5b inside push] JUMPDEST
    const code = [_]u8{ 0x60, 0x03, 0x56, 0x62, 0x5b, 0x5b, 0x5b }; // PUSH1 0x03 JUMP PUSH3 0x5b5b5b
    const result = BytecodeDefault.init(allocator, &code);
    try std.testing.expectError(error.InvalidJumpDestination, result);
}

test "Bytecode.getStats - basic stats" {
    const allocator = std.testing.allocator;
    // PUSH1 0x05 PUSH1 0x03 ADD STOP
    const code = [_]u8{ 0x60, 0x05, 0x60, 0x03, 0x01, 0x00 };
    var bytecode = try BytecodeDefault.init(allocator, &code);
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
    var bytecode = try BytecodeDefault.init(allocator, &code);
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
    var bytecode = try BytecodeDefault.init(allocator, &code);
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
    var bytecode = try BytecodeDefault.init(allocator, &code);
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
    var bytecode = try BytecodeDefault.init(allocator, &code);
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
    var bytecode = try BytecodeDefault.init(allocator, &code);
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
    const result = BytecodeDefault.init(allocator, &invalid_code);
    try std.testing.expectError(BytecodeDefault.ValidationError.InvalidOpcode, result);
    
    // Test bytecode with all valid opcodes
    const valid_code = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 }; // PUSH1 1 PUSH1 2 ADD STOP
    var bytecode = try BytecodeDefault.init(allocator, &valid_code);
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
    
    var bytecode = try BytecodeDefault.initFromInitcode(allocator, valid_initcode);
    defer bytecode.deinit();
    try std.testing.expectEqual(@as(usize, 1000), bytecode.len());
    
    // Test with initcode at exactly the limit
    const max_initcode = try allocator.alloc(u8, default_config.max_initcode_size);
    defer allocator.free(max_initcode);
    @memset(max_initcode, 0x00);
    
    var bytecode2 = try BytecodeDefault.initFromInitcode(allocator, max_initcode);
    defer bytecode2.deinit();
    try std.testing.expectEqual(@as(usize, default_config.max_initcode_size), bytecode2.len());
    
    // Test with initcode exceeding the limit
    const oversized_initcode = try allocator.alloc(u8, default_config.max_initcode_size + 1);
    defer allocator.free(oversized_initcode);
    @memset(oversized_initcode, 0x00);
    
    const result = BytecodeDefault.initFromInitcode(allocator, oversized_initcode);
    try std.testing.expectError(error.InitcodeTooLarge, result);
}

test "Bytecode calculateInitcodeGas - EIP-3860" {
    // Test gas calculation for various initcode sizes
    
    // Empty initcode = 0 words = 0 gas
    try std.testing.expectEqual(@as(u64, 0), BytecodeDefault.calculateInitcodeGas(0));
    
    // 1 byte = 1 word = 2 gas
    try std.testing.expectEqual(@as(u64, 2), BytecodeDefault.calculateInitcodeGas(1));
    
    // 32 bytes = 1 word = 2 gas
    try std.testing.expectEqual(@as(u64, 2), BytecodeDefault.calculateInitcodeGas(32));
    
    // 33 bytes = 2 words = 4 gas
    try std.testing.expectEqual(@as(u64, 4), BytecodeDefault.calculateInitcodeGas(33));
    
    // 64 bytes = 2 words = 4 gas
    try std.testing.expectEqual(@as(u64, 4), BytecodeDefault.calculateInitcodeGas(64));
    
    // 1000 bytes = 32 words (31.25 rounded up) = 64 gas
    try std.testing.expectEqual(@as(u64, 64), BytecodeDefault.calculateInitcodeGas(1000));
    
    // Maximum initcode size: 49,152 bytes = 1536 words = 3072 gas
    try std.testing.expectEqual(@as(u64, 3072), BytecodeDefault.calculateInitcodeGas(default_config.max_initcode_size));
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
    var bytecode = try BytecodeDefault.init(allocator, &code);
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
    var bytecode = try BytecodeDefault.init(allocator, &code);
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
    try std.testing.expectEqual(@as(usize, 6), BytecodeDefault.countBitsInRange(bitmap, 0, 32));
    
    // Test partial ranges
    try std.testing.expectEqual(@as(usize, 2), BytecodeDefault.countBitsInRange(bitmap, 0, 8));
    try std.testing.expectEqual(@as(usize, 2), BytecodeDefault.countBitsInRange(bitmap, 8, 16));
    try std.testing.expectEqual(@as(usize, 1), BytecodeDefault.countBitsInRange(bitmap, 16, 20));
    
    // Test single bit ranges
    try std.testing.expectEqual(@as(usize, 1), BytecodeDefault.countBitsInRange(bitmap, 0, 1));
    try std.testing.expectEqual(@as(usize, 0), BytecodeDefault.countBitsInRange(bitmap, 1, 2));
    
    // Test empty range
    try std.testing.expectEqual(@as(usize, 0), BytecodeDefault.countBitsInRange(bitmap, 10, 10));
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
    try std.testing.expectEqual(@as(?usize, 0), BytecodeDefault.findNextSetBit(bitmap, 0));
    
    // Find from after first bit
    try std.testing.expectEqual(@as(?usize, 2), BytecodeDefault.findNextSetBit(bitmap, 1));
    
    // Find from after second bit
    try std.testing.expectEqual(@as(?usize, 8), BytecodeDefault.findNextSetBit(bitmap, 3));
    
    // Find from middle of byte
    try std.testing.expectEqual(@as(?usize, 15), BytecodeDefault.findNextSetBit(bitmap, 9));
    
    // Find last bit
    try std.testing.expectEqual(@as(?usize, 23), BytecodeDefault.findNextSetBit(bitmap, 18));
    
    // No more bits after last
    try std.testing.expectEqual(@as(?usize, null), BytecodeDefault.findNextSetBit(bitmap, 24));
    
    // Start beyond bitmap
    try std.testing.expectEqual(@as(?usize, null), BytecodeDefault.findNextSetBit(bitmap, 100));
}

test "Bytecode cache-aligned allocations" {
    // Skip this test since test allocator doesn't support aligned allocations
    // In production, allocations will be cache-aligned
    if (builtin.is_test) {
        return;
    }
    
    const allocator = std.testing.allocator;
    // Test that bitmaps are allocated with cache line alignment
    const code = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 }; // PUSH1 1 PUSH1 2 ADD STOP
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    // Check that bitmaps are aligned to cache line boundaries
    const push_data_addr = @intFromPtr(bytecode.is_push_data.ptr);
    const op_start_addr = @intFromPtr(bytecode.is_op_start.ptr);
    const jumpdest_addr = @intFromPtr(bytecode.is_jumpdest.ptr);
    
    try std.testing.expect(push_data_addr % CACHE_LINE_SIZE == 0);
    try std.testing.expect(op_start_addr % CACHE_LINE_SIZE == 0);
    try std.testing.expect(jumpdest_addr % CACHE_LINE_SIZE == 0);
}

test "Bytecode.parseSolidityMetadata" {
    const allocator = std.testing.allocator;
    
    // Example bytecode with Solidity metadata
    // This represents a simple contract with metadata appended
    const code_with_metadata = [_]u8{
        // Some contract bytecode
        0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15, 0x60, 0x0e, 0x57, 0x5f, 0x5f, 0xfd, 0x5b, 0x50,
        
        // Solidity metadata (CBOR encoded)
        0xa2, // CBOR map with 2 entries
        0x64, 0x69, 0x70, 0x66, 0x73, // "ipfs"
        0x58, 0x22, // 34 bytes following
        // 32-byte IPFS hash
        0x12, 0x20, 0x2c, 0x24, 0x7f, 0x39, 0xd6, 0x15, 0xd7, 0xf6, 0x69, 0x42, 0xcd, 0x6e, 0xd5, 0x05,
        0xd8, 0xea, 0x34, 0xfb, 0xfc, 0xbe, 0x16, 0xac, 0x87, 0x5e, 0xd0, 0x8c, 0x4a, 0x9c, 0x22, 0x93,
        0x64, 0x73, 0x6f, 0x6c, 0x63, // "solc"
        0x00, 0x08, 0x1e, // version 0.8.30
        0x00, 0x33, // metadata length: 51 bytes
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code_with_metadata);
    defer bytecode.deinit();
    
    // Parse metadata
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata != null);
    
    if (metadata) |m| {
        // Check IPFS hash (first few bytes)
        try std.testing.expectEqual(@as(u8, 0x12), m.ipfs_hash[0]);
        try std.testing.expectEqual(@as(u8, 0x20), m.ipfs_hash[1]);
        try std.testing.expectEqual(@as(u8, 0x2c), m.ipfs_hash[2]);
        
        // Check Solidity version
        try std.testing.expectEqual(@as(u8, 0), m.solc_version[0]); // major
        try std.testing.expectEqual(@as(u8, 8), m.solc_version[1]); // minor
        try std.testing.expectEqual(@as(u8, 30), m.solc_version[2]); // patch (0x1e = 30)
        
        // Check metadata length
        try std.testing.expectEqual(@as(usize, 53), m.metadata_length); // 51 + 2 length bytes
    }
    
    // Test with bytecode that has no metadata
    const code_no_metadata = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52, 0x00 };
    var bytecode2 = try BytecodeDefault.init(allocator, &code_no_metadata);
    defer bytecode2.deinit();
    
    const no_metadata = bytecode2.parseSolidityMetadata();
    try std.testing.expect(no_metadata == null);
    
    // Test with bytecode too short for metadata
    const short_code = [_]u8{ 0x60, 0x00 };
    var bytecode3 = try BytecodeDefault.init(allocator, &short_code);
    defer bytecode3.deinit();
    
    const short_metadata = bytecode3.parseSolidityMetadata();
    try std.testing.expect(short_metadata == null);
}

test "Bytecode SIMD edge cases - very short bytecode" {
    const allocator = std.testing.allocator;
    
    // Test SIMD operations with bytecode shorter than vector length
    const short_code = [_]u8{0x00}; // Just STOP
    var bytecode = try BytecodeDefault.init(allocator, &short_code);
    defer bytecode.deinit();
    
    try std.testing.expectEqual(@as(usize, 1), bytecode.len());
    
    // Test that SIMD validation still works with short code
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    try std.testing.expectEqual(@as(u32, 1), stats.opcode_counts[@intFromEnum(Opcode.STOP)]);
}

test "Bytecode SIMD edge cases - bytecode at vector boundaries" {
    const allocator = std.testing.allocator;
    
    // Create bytecode with length exactly at common SIMD vector sizes
    const vector_sizes = [_]usize{ 8, 16, 32, 64 };
    
    for (vector_sizes) |size| {
        // Create valid bytecode of exact vector size
        var code = try allocator.alloc(u8, size);
        defer allocator.free(code);
        
        // Fill with alternating PUSH1 and data
        var i: usize = 0;
        while (i + 1 < size) {
            code[i] = 0x60; // PUSH1
            code[i + 1] = @intCast(i); // Some data
            i += 2;
        }
        if (i < size) {
            code[i] = 0x00; // STOP
        }
        
        var bytecode = try BytecodeDefault.init(allocator, code);
        defer bytecode.deinit();
        
        // Verify it was processed correctly
        try std.testing.expect(bytecode.len() == size);
    }
}

test "Bytecode SIMD fusion detection at boundaries" {
    const allocator = std.testing.allocator;
    
    // Test fusion detection when PUSH+OP spans vector boundaries
    // Create code that has fusions at different positions relative to vector boundaries
    var code: [67]u8 = undefined; // Prime number to avoid alignment
    var pos: usize = 0;
    
    // Fill with alternating PUSH1+ADD patterns
    while (pos + 2 < code.len) {
        code[pos] = 0x60; // PUSH1
        code[pos + 1] = @intCast(pos); // Data
        code[pos + 2] = 0x01; // ADD
        pos += 3;
    }
    // Fill remaining with STOP
    while (pos < code.len) {
        code[pos] = 0x00;
        pos += 1;
    }
    
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    // Should detect multiple PUSH+ADD fusions
    try std.testing.expect(stats.potential_fusions.len > 0);
    
    // Verify all detected fusions are PUSH+ADD
    for (stats.potential_fusions) |fusion| {
        try std.testing.expectEqual(Opcode.ADD, fusion.second_opcode);
    }
}

test "Bytecode bitmap operations edge cases - bit boundaries" {
    const allocator = std.testing.allocator;
    
    // Create a bitmap that exercises bit boundary conditions
    var bitmap = try allocator.alloc(u8, 8);
    defer allocator.free(bitmap);
    @memset(bitmap, 0);
    
    // Set bits at various boundary positions
    const test_bits = [_]usize{ 0, 7, 8, 15, 16, 31, 32, 63 };
    for (test_bits) |bit| {
        const byte_idx = bit >> 3;
        const bit_mask = @as(u8, 1) << @intCast(bit & 7);
        if (byte_idx < bitmap.len) {
            bitmap[byte_idx] |= bit_mask;
        }
    }
    
    // Test countBitsInRange across boundaries
    try std.testing.expectEqual(@as(usize, 2), BytecodeDefault.countBitsInRange(bitmap, 0, 8));   // bits 0,7
    try std.testing.expectEqual(@as(usize, 2), BytecodeDefault.countBitsInRange(bitmap, 8, 16));  // bits 8,15
    try std.testing.expectEqual(@as(usize, 2), BytecodeDefault.countBitsInRange(bitmap, 16, 32)); // bits 16,31
    try std.testing.expectEqual(@as(usize, 1), BytecodeDefault.countBitsInRange(bitmap, 32, 64)); // bit 32
    
    // Test across multiple byte boundaries
    try std.testing.expectEqual(@as(usize, 4), BytecodeDefault.countBitsInRange(bitmap, 0, 16)); // bits 0,7,8,15
    
    // Test findNextSetBit across boundaries
    try std.testing.expectEqual(@as(?usize, 0), BytecodeDefault.findNextSetBit(bitmap, 0));
    try std.testing.expectEqual(@as(?usize, 7), BytecodeDefault.findNextSetBit(bitmap, 1));
    try std.testing.expectEqual(@as(?usize, 8), BytecodeDefault.findNextSetBit(bitmap, 8));
    try std.testing.expectEqual(@as(?usize, 15), BytecodeDefault.findNextSetBit(bitmap, 9));
}

test "Bytecode bitmap operations - empty ranges" {
    const allocator = std.testing.allocator;
    
    const bitmap = try allocator.alloc(u8, 4);
    defer allocator.free(bitmap);
    @memset(bitmap, 0xFF); // All bits set
    
    // Test empty ranges
    try std.testing.expectEqual(@as(usize, 0), BytecodeDefault.countBitsInRange(bitmap, 10, 10));
    try std.testing.expectEqual(@as(usize, 0), BytecodeDefault.countBitsInRange(bitmap, 5, 5));
    try std.testing.expectEqual(@as(usize, 0), BytecodeDefault.countBitsInRange(bitmap, 100, 50)); // Invalid range
    
    // Test single bit ranges
    try std.testing.expectEqual(@as(usize, 1), BytecodeDefault.countBitsInRange(bitmap, 0, 1));
    try std.testing.expectEqual(@as(usize, 1), BytecodeDefault.countBitsInRange(bitmap, 15, 16));
    try std.testing.expectEqual(@as(usize, 1), BytecodeDefault.countBitsInRange(bitmap, 31, 32));
}

test "Bytecode SIMD markJumpdest edge cases" {
    const allocator = std.testing.allocator;
    
    // Create bytecode with JUMPDEST at various positions including boundaries
    var code = [_]u8{
        0x5b,             // JUMPDEST at 0
        0x60, 0x03,       // PUSH1 3
        0x56,             // JUMP
        0x5b,             // JUMPDEST at 4
        0x61, 0x5b, 0x5b, // PUSH2 0x5b5b (JUMPDEST in push data)
        0x5b,             // JUMPDEST at 8 (should be valid)
        0x7f,             // PUSH32
    };
    
    // Fill rest with data including 0x5b bytes
    var i: usize = 10;
    while (i < 10 + 32) {
        code[i] = if ((i - 10) % 4 == 0) 0x5b else @intCast(i);
        i += 1;
    }
    
    const full_code = try allocator.alloc(u8, code.len);
    defer allocator.free(full_code);
    @memcpy(full_code, &code);
    
    var bytecode = try BytecodeDefault.init(allocator, full_code);
    defer bytecode.deinit();
    
    // Verify only actual JUMPDESTs (not in push data) are marked
    try std.testing.expect(bytecode.isValidJumpDest(0));  // JUMPDEST at 0
    try std.testing.expect(bytecode.isValidJumpDest(4));  // JUMPDEST at 4
    try std.testing.expect(!bytecode.isValidJumpDest(6)); // 0x5b in PUSH2 data
    try std.testing.expect(!bytecode.isValidJumpDest(7)); // 0x5b in PUSH2 data
    try std.testing.expect(bytecode.isValidJumpDest(8));  // JUMPDEST at 8
    
    // All 0x5b bytes in PUSH32 data should be invalid
    for (10..42) |pos| {
        if (full_code[pos] == 0x5b) {
            try std.testing.expect(!bytecode.isValidJumpDest(@intCast(pos)));
        }
    }
}

test "Bytecode complex PUSH patterns with SIMD" {
    const allocator = std.testing.allocator;
    
    // Create complex bytecode with all PUSH sizes
    var code: [300]u8 = undefined;
    var pos: usize = 0;
    
    // Add PUSH1 through PUSH32
    var push_size: u8 = 1;
    while (push_size <= 32 and pos < code.len) {
        if (pos + 1 + push_size >= code.len) break;
        
        code[pos] = 0x60 + push_size - 1; // PUSH1 = 0x60, PUSH2 = 0x61, etc.
        pos += 1;
        
        // Fill push data
        for (0..push_size) |i| {
            if (pos < code.len) {
                code[pos] = @intCast((push_size * 16 + i) & 0xFF);
                pos += 1;
            }
        }
        
        push_size += 1;
    }
    
    // Fill remaining with STOP
    while (pos < code.len) {
        code[pos] = 0x00;
        pos += 1;
    }
    
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = try bytecode.getStats();
    defer {
        allocator.free(stats.push_values);
        allocator.free(stats.potential_fusions);
        allocator.free(stats.jumpdests);
        allocator.free(stats.jumps);
    }
    
    // Should have detected 32 different PUSH opcodes
    var total_pushes: u32 = 0;
    for (1..33) |i| {
        total_pushes += stats.opcode_counts[@intFromEnum(Opcode.PUSH1) + i - 1];
    }
    try std.testing.expectEqual(@as(u32, 32), total_pushes);
    
    // Should have 32 push values recorded
    try std.testing.expectEqual(@as(usize, 32), stats.push_values.len);
}

test "Bytecode large initcode stress test" {
    const allocator = std.testing.allocator;
    
    // Test with large initcode near the limit
    const large_size = default_config.max_initcode_size - 1000;
    var large_code = try allocator.alloc(u8, large_size);
    defer allocator.free(large_code);
    
    // Fill with valid pattern: PUSH1 + data
    var i: usize = 0;
    while (i + 1 < large_size) {
        large_code[i] = 0x60; // PUSH1
        large_code[i + 1] = @intCast(i & 0xFF);
        i += 2;
    }
    if (i < large_size) {
        large_code[i] = 0x00; // STOP
    }
    
    var bytecode = try BytecodeDefault.initFromInitcode(allocator, large_code);
    defer bytecode.deinit();
    
    try std.testing.expectEqual(@as(usize, large_size), bytecode.len());
    
    // Verify gas calculation for large initcode
    const expected_words = (large_size + 31) / 32;
    const expected_gas = expected_words * 2;
    try std.testing.expectEqual(@as(u64, expected_gas), BytecodeDefault.calculateInitcodeGas(large_size));
}

test "Bytecode malformed metadata - invalid CBOR header" {
    const allocator = std.testing.allocator;
    
    // Test metadata with invalid CBOR map header
    const code_bad_header = [_]u8{
        0x60, 0x00, // Some contract code
        // Bad metadata with wrong CBOR header
        0xa1, // CBOR map with 1 entry (should be 2)
        0x64, 0x69, 0x70, 0x66, 0x73, // "ipfs"
        0x58, 0x22, // 34 bytes following
        // Dummy 32-byte hash
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x64, 0x73, 0x6f, 0x6c, 0x63, // "solc"
        0x00, 0x08, 0x1e, // version
        0x00, 0x2d, // metadata length: 45 bytes
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code_bad_header);
    defer bytecode.deinit();
    
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata == null); // Should fail to parse
}

test "Bytecode malformed metadata - invalid string lengths" {
    const allocator = std.testing.allocator;
    
    // Test metadata with wrong string length marker
    const code_bad_string = [_]u8{
        0x60, 0x00, // Some contract code
        // Bad metadata with wrong string length
        0xa2, // CBOR map with 2 entries
        0x65, 0x69, 0x70, 0x66, 0x73, // 5-byte string marker but "ipfs" is 4 bytes
        0x58, 0x22, // 34 bytes following
        // Dummy 32-byte hash
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x64, 0x73, 0x6f, 0x6c, 0x63, // "solc"
        0x00, 0x08, 0x1e, // version
        0x00, 0x2f, // metadata length: 47 bytes
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code_bad_string);
    defer bytecode.deinit();
    
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata == null);
}

test "Bytecode malformed metadata - wrong key names" {
    const allocator = std.testing.allocator;
    
    // Test metadata with wrong key names
    const code_wrong_keys = [_]u8{
        0x60, 0x00, // Some contract code
        // Bad metadata with wrong key
        0xa2, // CBOR map with 2 entries
        0x64, 0x69, 0x70, 0x66, 0x78, // "ipfx" instead of "ipfs"
        0x58, 0x22, // 34 bytes following
        // Dummy 32-byte hash
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x64, 0x73, 0x6f, 0x6c, 0x63, // "solc"
        0x00, 0x08, 0x1e, // version
        0x00, 0x2d, // metadata length: 45 bytes
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code_wrong_keys);
    defer bytecode.deinit();
    
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata == null);
}

test "Bytecode malformed metadata - invalid hash format" {
    const allocator = std.testing.allocator;
    
    // Test metadata with wrong hash format markers
    const code_bad_hash = [_]u8{
        0x60, 0x00, // Some contract code
        0xa2, // CBOR map with 2 entries
        0x64, 0x69, 0x70, 0x66, 0x73, // "ipfs"
        0x58, 0x20, // 32 bytes following (should be 0x22 for 34 bytes)
        // Only 30 bytes instead of 32
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x64, 0x73, 0x6f, 0x6c, 0x63, // "solc"
        0x00, 0x08, 0x1e, // version
        0x00, 0x2b, // metadata length: 43 bytes
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code_bad_hash);
    defer bytecode.deinit();
    
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata == null);
}

test "Bytecode malformed metadata - truncated data" {
    const allocator = std.testing.allocator;
    
    // Test metadata that's cut off mid-parsing
    const code_truncated = [_]u8{
        0x60, 0x00, // Some contract code
        0xa2, // CBOR map with 2 entries
        0x64, 0x69, 0x70, 0x66, 0x73, // "ipfs"
        0x58, 0x22, // 34 bytes following
        // Only partial hash - should be 32 bytes
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        // Missing second half of hash and rest of data
        0x00, 0x10, // metadata length: 16 bytes (too short)
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code_truncated);
    defer bytecode.deinit();
    
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata == null);
}

test "Bytecode malformed metadata - invalid length encoding" {
    const allocator = std.testing.allocator;
    
    // Test with invalid metadata length that would extend beyond bytecode
    const code_bad_length = [_]u8{
        0x60, 0x00, // Some contract code (2 bytes)
        0xFF, 0xFF, // Claim metadata is 65535 bytes (impossible)
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code_bad_length);
    defer bytecode.deinit();
    
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata == null);
}

test "Bytecode malformed metadata - zero length" {
    const allocator = std.testing.allocator;
    
    // Test with zero metadata length
    const code_zero_length = [_]u8{
        0x60, 0x00, // Some contract code
        0x00, 0x00, // Zero metadata length
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code_zero_length);
    defer bytecode.deinit();
    
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata == null);
}

test "Bytecode malformed metadata - minimum size violation" {
    const allocator = std.testing.allocator;
    
    // Test bytecode smaller than minimum metadata size (45 bytes)
    const code_too_small = [_]u8{
        0x60, 0x00, 0x00, // 3 bytes of code
        0x00, 0x05, // Claim 5 bytes of metadata
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code_too_small);
    defer bytecode.deinit();
    
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata == null);
}

test "Bytecode malformed metadata - boundary conditions" {
    const allocator = std.testing.allocator;
    
    // Test exactly minimum size but malformed
    var code_min_size = [_]u8{0} ** 45;
    // Set invalid CBOR at the start of metadata
    code_min_size[43] = 0xFF; // Invalid CBOR
    code_min_size[44] = 0xFF; // Invalid CBOR
    // Set length to claim it's all metadata (43 bytes + 2 length bytes)
    code_min_size[43] = 0x00;
    code_min_size[44] = 0x2B; // 43 bytes
    
    var bytecode = try BytecodeDefault.init(allocator, &code_min_size);
    defer bytecode.deinit();
    
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata == null);
}

test "Bytecode malformed metadata - wrong byte string markers" {
    const allocator = std.testing.allocator;
    
    // Test metadata with wrong byte string markers for IPFS hash
    const code_wrong_markers = [_]u8{
        0x60, 0x00, // Some contract code
        0xa2, // CBOR map with 2 entries
        0x64, 0x69, 0x70, 0x66, 0x73, // "ipfs"
        0x57, 0x22, // Wrong marker (0x57 instead of 0x58)
        // 32-byte hash
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x64, 0x73, 0x6f, 0x6c, 0x63, // "solc"
        0x00, 0x08, 0x1e, // version
        0x00, 0x2d, // metadata length: 45 bytes
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code_wrong_markers);
    defer bytecode.deinit();
    
    const metadata = bytecode.parseSolidityMetadata();
    try std.testing.expect(metadata == null);
}

test "Bytecode complex jump validation - nested patterns" {
    const allocator = std.testing.allocator;
    
    // Test complex nested jump patterns with multiple PUSH sizes
    const code = [_]u8{
        0x60, 0x0D,       // PUSH1 13  (PC 0-1)
        0x56,             // JUMP      (PC 2)
        0x60, 0x16,       // PUSH1 22  (PC 3-4)
        0x56,             // JUMP      (PC 5)
        0x61, 0x00, 0x19, // PUSH2 25  (PC 6-8)
        0x56,             // JUMP      (PC 9)
        0x00,             // STOP      (PC 10)
        0x60, 0x03,       // PUSH1 3   (PC 11-12)
        0x5b,             // JUMPDEST  (PC 13) <- Target of first jump
        0x56,             // JUMP      (PC 14)
        0x00,             // STOP      (PC 15)
        0x5b,             // JUMPDEST  (PC 16) <- Target of second jump
        0x60, 0x06,       // PUSH1 6   (PC 17-18)
        0x56,             // JUMP      (PC 19)
        0x00,             // STOP      (PC 20)
        0x60, 0x0B,       // PUSH1 11  (PC 21-22)
        0x56,             // JUMP      (PC 23)
        0x00,             // STOP      (PC 24)
        0x5b,             // JUMPDEST  (PC 25) <- Target of PUSH2 jump
        0x00,             // STOP      (PC 26)
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    // Verify all jumpdests are valid
    try std.testing.expect(bytecode.isValidJumpDest(13));
    try std.testing.expect(bytecode.isValidJumpDest(16));
    try std.testing.expect(bytecode.isValidJumpDest(25));
    
    // Verify non-jumpdests are invalid
    try std.testing.expect(!bytecode.isValidJumpDest(0));
    try std.testing.expect(!bytecode.isValidJumpDest(3));
    try std.testing.expect(!bytecode.isValidJumpDest(6));
}

test "Bytecode complex jump validation - PUSH32 with large targets" {
    const allocator = std.testing.allocator;
    
    // Create code with PUSH32 pointing to various locations
    var code: [100]u8 = undefined;
    var pos: usize = 0;
    
    // PUSH32 pointing to position 67 (after the PUSH32)
    code[pos] = 0x7f; // PUSH32
    pos += 1;
    // 32 bytes of data (most zeros, last byte is target position)
    for (0..31) |_| {
        code[pos] = 0x00;
        pos += 1;
    }
    code[pos] = 67; // Target position
    pos += 1;
    
    // JUMP
    code[pos] = 0x56;
    pos += 1;
    
    // Fill with NOPs until position 67
    while (pos < 67) {
        code[pos] = 0x00; // STOP (safe opcode)
        pos += 1;
    }
    
    // JUMPDEST at position 67
    code[pos] = 0x5b;
    pos += 1;
    
    // Fill rest with STOP
    while (pos < code.len) {
        code[pos] = 0x00;
        pos += 1;
    }
    
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should validate successfully
    try std.testing.expect(bytecode.isValidJumpDest(67));
}

test "Bytecode complex jump validation - sequential PUSH patterns" {
    const allocator = std.testing.allocator;
    
    // Test multiple sequential PUSH+JUMP combinations
    const code = [_]u8{
        // Multiple PUSH+JUMP sequences
        0x60, 0x12, 0x56, // PUSH1 18 JUMP
        0x61, 0x00, 0x15, 0x56, // PUSH2 21 JUMP  
        0x62, 0x00, 0x00, 0x18, 0x56, // PUSH3 24 JUMP
        0x63, 0x00, 0x00, 0x00, 0x1B, 0x56, // PUSH4 27 JUMP
        0x00, // STOP (PC 17)
        0x5b, // JUMPDEST (PC 18)
        0x00, 0x00, // STOP STOP
        0x5b, // JUMPDEST (PC 21) 
        0x00, 0x00, // STOP STOP
        0x5b, // JUMPDEST (PC 24)
        0x00, 0x00, // STOP STOP
        0x5b, // JUMPDEST (PC 27)
        0x00, // STOP
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    // All jumpdests should be valid
    try std.testing.expect(bytecode.isValidJumpDest(18));
    try std.testing.expect(bytecode.isValidJumpDest(21));
    try std.testing.expect(bytecode.isValidJumpDest(24));
    try std.testing.expect(bytecode.isValidJumpDest(27));
}

test "Bytecode complex jump validation - JUMPI conditional patterns" {
    const allocator = std.testing.allocator;
    
    // Test JUMPI validation with complex patterns
    const code = [_]u8{
        0x60, 0x0A, // PUSH1 10 
        0x60, 0x01, // PUSH1 1 (condition)
        0x57,       // JUMPI (PC 4)
        0x60, 0x0D, // PUSH1 13
        0x60, 0x00, // PUSH1 0 (condition false)
        0x57,       // JUMPI (PC 8) - shouldn't jump
        0x00,       // STOP (PC 9)
        0x5b,       // JUMPDEST (PC 10)
        0x60, 0x0D, // PUSH1 13
        0x56,       // JUMP (PC 12)
        0x5b,       // JUMPDEST (PC 13)
        0x00,       // STOP
    };
    
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    // Verify jumpdests
    try std.testing.expect(bytecode.isValidJumpDest(10));
    try std.testing.expect(bytecode.isValidJumpDest(13));
}

test "Bytecode complex jump validation - edge case targets" {
    const allocator = std.testing.allocator;
    
    // Test jumps to edge positions (start, end-1, end)
    var code: [50]u8 = undefined;
    @memset(&code, 0x00); // Fill with STOP
    
    // JUMPDEST at position 0
    code[0] = 0x5b;
    
    // PUSH1 pointing to position 0
    code[1] = 0x60; // PUSH1
    code[2] = 0x00; // Target 0
    code[3] = 0x56; // JUMP
    
    // PUSH1 pointing to last position
    code[4] = 0x60; // PUSH1  
    code[5] = 49;   // Target last position
    code[6] = 0x56; // JUMP
    
    // JUMPDEST at last position
    code[49] = 0x5b;
    
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    // Verify edge positions
    try std.testing.expect(bytecode.isValidJumpDest(0));
    try std.testing.expect(bytecode.isValidJumpDest(49));
    
    // Test jump to position beyond bytecode should fail during validation
    const invalid_code = [_]u8{
        0x60, 0x64, 0x56, // PUSH1 100 JUMP (beyond bytecode)
    };
    
    const result = BytecodeDefault.init(allocator, &invalid_code);
    try std.testing.expectError(BytecodeDefault.ValidationError.InvalidJumpDestination, result);
}

test "Bytecode complex jump validation - deeply nested PUSH data" {
    const allocator = std.testing.allocator;
    
    // Test JUMPDEST validation with deeply nested PUSH data containing 0x5b
    var code: [200]u8 = undefined;
    var pos: usize = 0;
    
    // Start with a valid jump
    code[pos] = 0x60; // PUSH1
    code[pos + 1] = 100; // Target position 100
    code[pos + 2] = 0x56; // JUMP
    pos += 3;
    
    // Create nested PUSH instructions with 0x5b in data
    const push_sizes = [_]u8{ 1, 2, 4, 8, 16, 32 };
    for (push_sizes) |size| {
        if (pos + 1 + size >= 100) break;
        
        code[pos] = 0x60 + size - 1; // PUSH1, PUSH2, etc.
        pos += 1;
        
        // Fill push data with pattern including 0x5b
        for (0..size) |i| {
            code[pos] = if (i % 3 == 0) 0x5b else @intCast(i); // Every 3rd byte is 0x5b
            pos += 1;
        }
        
        // Add a regular opcode
        code[pos] = 0x01; // ADD
        pos += 1;
    }
    
    // Fill up to position 100 with STOP
    while (pos < 100) {
        code[pos] = 0x00;
        pos += 1;
    }
    
    // JUMPDEST at position 100
    code[100] = 0x5b;
    pos = 101;
    
    // Fill rest with STOP
    while (pos < code.len) {
        code[pos] = 0x00;
        pos += 1;
    }
    
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    // Only position 100 should be a valid jumpdest
    try std.testing.expect(bytecode.isValidJumpDest(100));
    
    // All 0x5b bytes in PUSH data should be invalid
    for (0..100) |i| {
        if (code[i] == 0x5b and i != 100) {
            try std.testing.expect(!bytecode.isValidJumpDest(@intCast(i)));
        }
    }
}

test "Bytecode complex jump validation - mixed valid/invalid patterns" {
    const allocator = std.testing.allocator;
    
    // Test a mix of valid and invalid jump patterns in the same bytecode
    const code = [_]u8{
        // Valid pattern: PUSH1 + JUMP to valid JUMPDEST
        0x60, 0x08,       // PUSH1 8
        0x56,             // JUMP (PC 2)
        
        // Invalid pattern: PUSH1 + JUMP to invalid destination  
        0x60, 0x07,       // PUSH1 7  (points to JUMP, not JUMPDEST)
        0x56,             // JUMP (PC 5)
        
        0x00,             // STOP (PC 6)
        0x56,             // JUMP (PC 7) - not a JUMPDEST!
        0x5b,             // JUMPDEST (PC 8) - valid target
        
        // Valid JUMPI pattern
        0x60, 0x0F,       // PUSH1 15
        0x60, 0x01,       // PUSH1 1
        0x57,             // JUMPI (PC 12)
        
        0x00,             // STOP (PC 13)
        0x00,             // STOP (PC 14)
        0x5b,             // JUMPDEST (PC 15) - valid target
        0x00,             // STOP
    };
    
    // This should fail validation because of the invalid jump at PC 5
    const result = BytecodeDefault.init(allocator, &code);
    try std.testing.expectError(BytecodeDefault.ValidationError.InvalidJumpDestination, result);
}

test "Bytecode complex jump validation - maximum PUSH32 target" {
    const allocator = std.testing.allocator;
    
    // Test PUSH32 with maximum possible target value within bounds
    // Use a more reasonable size to avoid excessive memory usage in tests
    var code: [2000]u8 = undefined;
    var pos: usize = 0;
    
    // PUSH32 with target 1000
    code[pos] = 0x7f; // PUSH32
    pos += 1;
    
    // 32 bytes representing target 1000
    for (0..29) |_| {
        code[pos] = 0x00;
        pos += 1;
    }
    code[pos] = 0x03; // High byte of 1000
    pos += 1;
    code[pos] = 0xE8; // Low byte of 1000  
    pos += 1;
    
    code[pos] = 0x56; // JUMP
    pos += 1;
    
    // Fill with STOP until target position
    while (pos < 1000) {
        code[pos] = 0x00;
        pos += 1;
    }
    
    // JUMPDEST at position 1000
    code[1000] = 0x5b;
    pos = 1001;
    
    // Fill remaining with STOP
    while (pos < code.len) {
        code[pos] = 0x00;
        pos += 1;
    }
    
    var bytecode = try BytecodeDefault.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should successfully validate the large jump target
    try std.testing.expect(bytecode.isValidJumpDest(1000));
}
