const std = @import("std");
const ArrayList = std.ArrayListAligned;
const Opcode = @import("opcode.zig").Opcode;
const bytecode_config = @import("bytecode_config.zig");
const BytecodeConfig = bytecode_config.BytecodeConfig;

// SECURITY MODEL: Untrusted Bytecode Validation
// ==============================================
// This module implements a two-phase security model for handling untrusted EVM bytecode:
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

/// Factory function to create a Bytecode type with the given configuration
pub fn createBytecode(comptime cfg: BytecodeConfig) type {
    comptime cfg.validate();
    
    const BytecodeType = struct {
        pub const ValidationError = error{
            InvalidOpcode,
            TruncatedPush,
            InvalidJumpDestination,
            OutOfMemory,
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
            return (self.is_jumpdest[pc >> 3] & (@as(u8, 1) << @intCast(pc & 7))) != 0;
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
            
            const bitmap_bytes = (N + 7) >> 3;
            
            self.is_push_data = self.allocator.alloc(u8, bitmap_bytes) catch return error.OutOfMemory;
            errdefer self.allocator.free(self.is_push_data);
            self.is_op_start = self.allocator.alloc(u8, bitmap_bytes) catch return error.OutOfMemory;
            errdefer self.allocator.free(self.is_op_start);
            self.is_jumpdest = self.allocator.alloc(u8, bitmap_bytes) catch return error.OutOfMemory;
            errdefer self.allocator.free(self.is_jumpdest);
            @memset(self.is_push_data, 0);
            @memset(self.is_op_start, 0);
            @memset(self.is_jumpdest, 0);
            
            var i: PcType = 0;
            while (i < N) {
                self.is_op_start[i >> 3] |= @as(u8, 1) << @intCast(i & 7);
                const op = self.code[i];
                
                // SECURITY: Validate opcode using safe enum conversion
                // We need to ensure this is a valid opcode before using it
                const opcode_enum = std.meta.intToEnum(Opcode, op) catch {
                    // Invalid opcode found
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
                        self.is_push_data[idx >> 3] |= @as(u8, 1) << @intCast(idx & 7);
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
                if ((self.is_op_start[i >> 3] & (@as(u8, 1) << @intCast(i & 7))) == 0) {
                    i += 1;
                    continue;
                }
                const op = self.code[i];
                if ((op == @intFromEnum(Opcode.JUMP) or op == @intFromEnum(Opcode.JUMPI)) and i > 0) {
                    var push_start: ?PcType = null;
                    var j: PcType = 0;
                    while (j < i) {
                        if ((self.is_op_start[j >> 3] & (@as(u8, 1) << @intCast(j & 7))) != 0) {
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
                        if ((self.is_jumpdest[target_pc >> 3] & (@as(u8, 1) << @intCast(target_pc & 7))) == 0) {
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
            const T = std.meta.Int(.unsigned, n * 8);
            var value: T = 0;
            var i: u8 = 0;
            // https://ziglang.org/documentation/master/std/#std.math.shl
            while (i < n) : (i += 1) value = std.math.shl(T, value, 8) | @as(T, self.code[start + i]);
            return value;
        }
        
        /// Read a variable-sized PUSH value (returns u256)
        pub fn readPushValueN(self: Self, pc: PcType, n: u8) ?u256 {
            if (pc >= self.code.len or n == 0 or n > 32) return null;
            const op = self.code[pc];
            if (op < @intFromEnum(Opcode.PUSH1) or op > @intFromEnum(Opcode.PUSH32)) return null;
            const expected_n = op - (@intFromEnum(Opcode.PUSH1) - 1);
            if (expected_n != n) return null;
            const start = pc + 1;
            const available = @min(n, self.code.len -| start);
            var value: u256 = 0;
            for (0..n) |i| value = if (i < available) (value << 8) | self.code[start + i] else value << 8; 
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
                .opcode_counts = [_]u32{0} ** 256,
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
                if ((self.is_op_start[i >> 3] & (@as(u8, 1) << @intCast(i & 7))) == 0) {
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
                        if (next_pc < self.code.len) {
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
            stats.potential_fusions = try self.allocator.dupe(Stats.Fusion, fusions.items);
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
                const test_push = (self.is_push_data[i >> 3] & (@as(u8, 1) << @intCast(i & 7))) != 0;
                if (self.code[i] == @intFromEnum(Opcode.JUMPDEST) and !test_push) self.is_jumpdest[i >> 3] |= @as(u8, 1) << @intCast(i & 7);
            }
        }

        /// Vector scan: compare @Vector(L,u8) chunks to 0x5b, mask out push-data lanes, set jumpdest bits
        /// Copied from planner.zig
        fn markJumpdestSimd(self: Self, comptime L: comptime_int) void {
            var i: usize = 0;
            const code_len = self.code.len;
            const splat_5b: @Vector(L, u8) = @splat(@as(u8, @intFromEnum(Opcode.JUMPDEST)));
            while (i + L <= code_len) : (i += L) {
                var arr: [L]u8 = undefined;
                inline for (0..L) |k| arr[k] = self.code[i + k];
                const v: @Vector(L, u8) = arr;
                const eq: @Vector(L, bool) = v == splat_5b;
                const eq_arr: [L]bool = eq;
                inline for (0..L) |j| {
                    const idx = i + j;
                    const test_push = (self.is_push_data[idx >> 3] & (@as(u8, 1) << @intCast(idx & 7))) != 0;
                    if (eq_arr[j] and !test_push) {
                        self.is_jumpdest[idx >> 3] |= @as(u8, 1) << @intCast(idx & 7);
                    }
                }
            }
            var t: usize = i;
            while (t < code_len) : (t += 1) {
                const test_push = (self.is_push_data[t >> 3] & (@as(u8, 1) << @intCast(t & 7))) != 0;
                if (self.code[t] == @intFromEnum(Opcode.JUMPDEST) and !test_push) {
                    self.is_jumpdest[t >> 3] |= @as(u8, 1) << @intCast(t & 7);
                }
            }
        }

    };
    return BytecodeType;
}

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
        jumpdests: std.ArrayList(Bytecode.PcType),
        fn callback(self: *@This(), pc: Bytecode.PcType) void {
            self.jumpdests.append(pc) catch unreachable;
        }
    };
    var context = Context{ .jumpdests = std.ArrayList(Bytecode.PcType).init(std.testing.allocator) };
    defer context.jumpdests.deinit();
    bytecode.analyzeJumpDests(&context, Context.callback);
    try std.testing.expectEqual(@as(usize, 2), context.jumpdests.items.len);
    try std.testing.expectEqual(@as(Bytecode.PcType, 3), context.jumpdests.items[0]);
    try std.testing.expectEqual(@as(Bytecode.PcType, 7), context.jumpdests.items[1]);
}
