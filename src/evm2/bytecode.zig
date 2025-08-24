const std = @import("std");
const Opcode = @import("opcode.zig").Opcode;
const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;

pub const BytecodeValidationError = error{
    InvalidOpcode,
    TruncatedPush,
    InvalidJumpDestination,
    OutOfMemory,
};

pub const Stats = struct {
    opcode_counts: [256]u32,
    push_values: []const PushValue,
    potential_fusions: []const Fusion,
    jumpdests: []const usize,
    jumps: []const Jump,
    backwards_jumps: usize,
    is_create_code: bool,
    
    pub const PushValue = struct {
        pc: usize,
        value: u256,
    };
    
    pub const Fusion = struct {
        pc: usize,
        second_opcode: Opcode,
    };
    
    pub const Jump = struct {
        pc: usize,
        target: u256,
    };
};

/// Factory function to create a Bytecode type with the given configuration
pub fn createBytecode(comptime cfg: BytecodeConfig) type {
    comptime cfg.validate();
    
    return struct {
        code: []const u8,
        allocator: std.mem.Allocator,
        is_push_data: []u8,
        is_op_start: []u8,
        is_jumpdest: []u8,
        
        const Self = @This();
        pub const PcType = cfg.PcType();
        
        pub fn init(allocator: std.mem.Allocator, code: []const u8) BytecodeValidationError!Self {
            var self = Self{
                .code = code,
                .allocator = allocator,
                .is_push_data = undefined,
                .is_op_start = undefined,
                .is_jumpdest = undefined,
            };
            
            // Build bitmaps and validate
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
        pub inline fn len(self: Self) usize {
            return self.code.len;
        }
        
        /// Get the raw bytecode slice
        pub inline fn raw(self: Self) []const u8 {
            return self.code;
        }
        
        /// Get byte at index
        pub inline fn get(self: Self, index: usize) ?u8 {
            if (index >= self.code.len) return null;
            return self.code[index];
        }
        
        /// Get opcode at position (doesn't check if it's actually an opcode start)
        pub inline fn getOpcode(self: Self, pc: usize) ?u8 {
            return self.get(pc);
        }
        
        /// Check if a position is a valid jump destination
        /// This scans the bytecode each time it's called
        pub fn isValidJumpDest(self: Self, pc: usize) bool {
            if (pc >= self.code.len) return false;
            if (self.code[pc] != @intFromEnum(Opcode.JUMPDEST)) return false;
            
            // Check if this byte is part of PUSH data
            var i: usize = 0;
            while (i < pc) {
                const op = self.code[i];
                if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                    const push_size = op - (@intFromEnum(Opcode.PUSH1) - 1);
                    const push_end = i + 1 + push_size;
                    if (pc >= i + 1 and pc < push_end) {
                        return false; // This JUMPDEST is inside PUSH data
                    }
                    i = push_end;
                } else {
                    i += 1;
                }
            }
            
            return true;
        }
        
        /// Analyze bytecode and call callbacks for jump destinations
        /// This allows callers to build their own data structures
        pub fn analyzeJumpDests(
            self: Self,
            context: anytype,
            callback: fn (@TypeOf(context), pc: usize) void,
        ) void {
            var i: usize = 0;
            while (i < self.code.len) {
                const op = self.code[i];
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
        fn buildBitmapsAndValidate(self: *Self) BytecodeValidationError!void {
            const N = self.code.len;
            if (N == 0) {
                // Empty bytecode is valid, allocate minimal bitmaps
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
            
            // First pass: build bitmaps and validate opcodes
            var i: usize = 0;
            while (i < N) {
                self.is_op_start[i >> 3] |= @as(u8, 1) << @intCast(i & 7);
                const op = self.code[i];
                
                // Validate opcode
                if (op == 0xFE) return error.InvalidOpcode; // INVALID opcode
                
                if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                    const n: usize = op - (@intFromEnum(Opcode.PUSH1) - 1);
                    
                    // Check if PUSH extends past end
                    if (i + n >= N) return error.TruncatedPush;
                    
                    var j: usize = 0;
                    while (j < n) : (j += 1) {
                        const idx = i + 1 + j;
                        self.is_push_data[idx >> 3] |= @as(u8, 1) << @intCast(idx & 7);
                    }
                    i += n + 1;
                } else {
                    i += 1;
                }
            }
            
            // Mark JUMPDEST positions
            markJumpdestScalar(self.code, self.is_push_data, self.is_jumpdest);
            
            // Second pass: validate jump destinations
            i = 0;
            while (i < N) {
                if ((self.is_op_start[i >> 3] & (@as(u8, 1) << @intCast(i & 7))) == 0) {
                    i += 1;
                    continue;
                }
                
                const op = self.code[i];
                
                // Check for JUMP/JUMPI with constant destination
                if ((op == @intFromEnum(Opcode.JUMP) or op == @intFromEnum(Opcode.JUMPI)) and i > 0) {
                    // Check if previous instruction was a PUSH
                    var push_start: ?usize = null;
                    var j: usize = 0;
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
                        // Extract jump target
                        const push_op = self.code[start];
                        const n = push_op - (@intFromEnum(Opcode.PUSH1) - 1);
                        const target = self.readPushValueN(start, @intCast(n)) orelse unreachable;
                        
                        // Validate jump destination
                        if (target < self.code.len) {
                            const target_pc = @as(usize, @intCast(target));
                            if ((self.is_jumpdest[target_pc >> 3] & (@as(u8, 1) << @intCast(target_pc & 7))) == 0) {
                                return error.InvalidJumpDestination;
                            }
                        }
                    }
                }
                
                i += self.getInstructionSize(i);
            }
        }
        
        /// Read a PUSH value at the given PC
        /// Based on plan_minimal.zig's getMetadata implementation
        pub fn readPushValue(self: Self, pc: usize, comptime n: u8) ?std.meta.Int(.unsigned, n * 8) {
            if (pc >= self.code.len) return null;
            const op = self.code[pc];
            if (op != @intFromEnum(Opcode.PUSH1) + n - 1) return null; // Not the right PUSH opcode
            
            const start = pc + 1;
            if (start + n > self.code.len) return null; // Not enough bytes
            
            const T = std.meta.Int(.unsigned, n * 8);
            var value: T = 0;
            var i: u8 = 0;
            while (i < n) : (i += 1) {
                value = std.math.shl(T, value, 8) | @as(T, self.code[start + i]);
            }
            return value;
        }
        
        /// Read a variable-sized PUSH value (returns u256)
        pub fn readPushValueN(self: Self, pc: usize, n: u8) ?u256 {
            if (pc >= self.code.len or n == 0 or n > 32) return null;
            const op = self.code[pc];
            if (op < @intFromEnum(Opcode.PUSH1) or op > @intFromEnum(Opcode.PUSH32)) return null;
            const expected_n = op - (@intFromEnum(Opcode.PUSH1) - 1);
            if (expected_n != n) return null;
            
            const start = pc + 1;
            const available = @min(n, self.code.len -| start);
            
            var value: u256 = 0;
            for (0..n) |i| {
                if (i < available) {
                    value = (value << 8) | self.code[start + i];
                } else {
                    value = value << 8; // Pad with zeros
                }
            }
            return value;
        }
        
        /// Get the size of bytecode at PC (1 for most opcodes, 1+n for PUSH)
        pub fn getInstructionSize(self: Self, pc: usize) usize {
            if (pc >= self.code.len) return 0;
            const op = self.code[pc];
            if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                return 1 + (op - (@intFromEnum(Opcode.PUSH1) - 1));
            }
            return 1;
        }
        
        /// Get the next PC after the instruction at the given PC
        pub fn getNextPc(self: Self, pc: usize) ?usize {
            const size = self.getInstructionSize(pc);
            if (size == 0) return null;
            const next = pc + size;
            if (next > self.code.len) return null;
            return next;
        }
        
        /// Get statistics about the bytecode
        pub fn getStats(self: Self) Stats {
            var stats = Stats{
                .opcode_counts = [_]u32{0} ** 256,
                .push_values = &.{},
                .potential_fusions = &.{},
                .jumpdests = &.{},
                .jumps = &.{},
                .backwards_jumps = 0,
                .is_create_code = false,
            };
            
            // Count opcodes and collect data
            var push_values = std.ArrayList(Stats.PushValue).init(self.allocator);
            defer push_values.deinit();
            var fusions = std.ArrayList(Stats.Fusion).init(self.allocator);
            defer fusions.deinit();
            var jumpdests = std.ArrayList(usize).init(self.allocator);
            defer jumpdests.deinit();
            var jumps = std.ArrayList(Stats.Jump).init(self.allocator);
            defer jumps.deinit();
            
            var i: usize = 0;
            while (i < self.code.len) {
                if ((self.is_op_start[i >> 3] & (@as(u8, 1) << @intCast(i & 7))) == 0) {
                    i += 1;
                    continue;
                }
                
                const op = self.code[i];
                stats.opcode_counts[op] += 1;
                
                // Collect JUMPDEST locations
                if (op == @intFromEnum(Opcode.JUMPDEST)) {
                    jumpdests.append(i) catch {};
                }
                
                // Collect PUSH values
                if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                    const n = op - (@intFromEnum(Opcode.PUSH1) - 1);
                    if (const value = self.readPushValueN(i, @intCast(n))) {
                        push_values.append(.{ .pc = i, .value = value }) catch {};
                        
                        // Check for potential fusions
                        const next_pc = i + 1 + n;
                        if (next_pc < self.code.len) {
                            const next_op = self.code[next_pc];
                            // Common fusions: PUSH+JUMP, PUSH+ADD, PUSH+MUL, PUSH+SUB, etc.
                            if (next_op == @intFromEnum(Opcode.JUMP) or
                                next_op == @intFromEnum(Opcode.JUMPI) or
                                next_op == @intFromEnum(Opcode.ADD) or
                                next_op == @intFromEnum(Opcode.MUL) or
                                next_op == @intFromEnum(Opcode.SUB) or
                                next_op == @intFromEnum(Opcode.DIV)) {
                                fusions.append(.{ 
                                    .pc = i, 
                                    .second_opcode = @as(Opcode, @enumFromInt(next_op))
                                }) catch {};
                            }
                        }
                        
                        // Collect jump targets
                        if (next_pc < self.code.len and 
                            (self.code[next_pc] == @intFromEnum(Opcode.JUMP) or 
                             self.code[next_pc] == @intFromEnum(Opcode.JUMPI))) {
                            jumps.append(.{ .pc = next_pc, .target = value }) catch {};
                            
                            // Check for backwards jumps
                            if (value < i) {
                                stats.backwards_jumps += 1;
                            }
                        }
                    }
                }
                
                // Check for create code pattern (CODECOPY + RETURN)
                if (op == @intFromEnum(Opcode.CODECOPY)) {
                    stats.is_create_code = true;
                }
                
                i += self.getInstructionSize(i);
            }
            
            // Convert to slices (leak memory for simplicity in stats)
            stats.push_values = self.allocator.dupe(Stats.PushValue, push_values.items) catch &.{};
            stats.potential_fusions = self.allocator.dupe(Stats.Fusion, fusions.items) catch &.{};
            stats.jumpdests = self.allocator.dupe(usize, jumpdests.items) catch &.{};
            stats.jumps = self.allocator.dupe(Stats.Jump, jumps.items) catch &.{};
            
            return stats;
        }
    };
}

/// Linear scan: set jumpdest bit at i when bytecode[i]==0x5b and the push-data bit is not set.
/// Copied from planner.zig
fn markJumpdestScalar(bytecode: []const u8, is_push_data: []const u8, is_jumpdest: []u8) void {
    var i: usize = 0;
    while (i < bytecode.len) : (i += 1) {
        const test_push = (is_push_data[i >> 3] & (@as(u8, 1) << @intCast(i & 7))) != 0;
        if (bytecode[i] == @intFromEnum(Opcode.JUMPDEST) and !test_push) {
            is_jumpdest[i >> 3] |= @as(u8, 1) << @intCast(i & 7);
        }
    }
}

/// Vector scan: compare @Vector(L,u8) chunks to 0x5b, mask out push-data lanes, set jumpdest bits
/// Copied from planner.zig
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

// Create a default Bytecode type for convenience
pub const Bytecode = createBytecode(.{});

// Tests copied and adapted from existing test patterns
test "Bytecode.init and basic getters" {
    const code = [_]u8{ 0x60, 0x40, 0x60, 0x80 }; // PUSH1 0x40 PUSH1 0x80
    const bytecode = Bytecode.init(&code);
    
    try std.testing.expectEqual(@as(usize, 4), bytecode.len());
    try std.testing.expectEqualSlices(u8, &code, bytecode.raw());
    try std.testing.expectEqual(@as(?u8, 0x60), bytecode.get(0));
    try std.testing.expectEqual(@as(?u8, 0x40), bytecode.get(1));
    try std.testing.expectEqual(@as(?u8, null), bytecode.get(4)); // Out of bounds
    try std.testing.expectEqual(@as(?u8, 0x60), bytecode.getOpcode(0));
}

test "Bytecode.isValidJumpDest" {
    // PUSH1 0x04 JUMP JUMPDEST STOP
    const code = [_]u8{ 0x60, 0x04, 0x56, 0x5b, 0x00 };
    const bytecode = Bytecode.init(&code);
    
    try std.testing.expect(!bytecode.isValidJumpDest(0)); // PUSH1
    try std.testing.expect(!bytecode.isValidJumpDest(1)); // push data
    try std.testing.expect(!bytecode.isValidJumpDest(2)); // JUMP
    try std.testing.expect(bytecode.isValidJumpDest(3)); // JUMPDEST
    try std.testing.expect(!bytecode.isValidJumpDest(4)); // STOP
    
    // Test JUMPDEST inside PUSH data
    const code2 = [_]u8{ 0x62, 0x5b, 0x5b, 0x5b, 0x00 }; // PUSH3 0x5b5b5b STOP
    const bytecode2 = Bytecode.init(&code2);
    
    try std.testing.expect(!bytecode2.isValidJumpDest(1)); // Inside PUSH data
    try std.testing.expect(!bytecode2.isValidJumpDest(2)); // Inside PUSH data
    try std.testing.expect(!bytecode2.isValidJumpDest(3)); // Inside PUSH data
}

test "Bytecode.buildBitmaps" {
    const allocator = std.testing.allocator;
    
    // PUSH2 0x1234 JUMPDEST PUSH1 0x56 STOP
    const code = [_]u8{ 0x61, 0x12, 0x34, 0x5b, 0x60, 0x56, 0x00 };
    const bytecode = Bytecode.init(&code);
    
    const bitmaps = try bytecode.buildBitmaps(allocator);
    defer allocator.free(bitmaps.is_push_data);
    defer allocator.free(bitmaps.is_op_start);
    defer allocator.free(bitmaps.is_jumpdest);
    
    // Check is_op_start bitmap
    try std.testing.expect((bitmaps.is_op_start[0] & (1 << 0)) != 0); // PC 0: PUSH2
    try std.testing.expect((bitmaps.is_op_start[0] & (1 << 1)) == 0); // PC 1: push data
    try std.testing.expect((bitmaps.is_op_start[0] & (1 << 2)) == 0); // PC 2: push data
    try std.testing.expect((bitmaps.is_op_start[0] & (1 << 3)) != 0); // PC 3: JUMPDEST
    try std.testing.expect((bitmaps.is_op_start[0] & (1 << 4)) != 0); // PC 4: PUSH1
    try std.testing.expect((bitmaps.is_op_start[0] & (1 << 5)) == 0); // PC 5: push data
    try std.testing.expect((bitmaps.is_op_start[0] & (1 << 6)) != 0); // PC 6: STOP
    
    // Check is_push_data bitmap
    try std.testing.expect((bitmaps.is_push_data[0] & (1 << 0)) == 0); // PC 0: not push data
    try std.testing.expect((bitmaps.is_push_data[0] & (1 << 1)) != 0); // PC 1: push data
    try std.testing.expect((bitmaps.is_push_data[0] & (1 << 2)) != 0); // PC 2: push data
    try std.testing.expect((bitmaps.is_push_data[0] & (1 << 3)) == 0); // PC 3: not push data
    try std.testing.expect((bitmaps.is_push_data[0] & (1 << 4)) == 0); // PC 4: not push data
    try std.testing.expect((bitmaps.is_push_data[0] & (1 << 5)) != 0); // PC 5: push data
    try std.testing.expect((bitmaps.is_push_data[0] & (1 << 6)) == 0); // PC 6: not push data
    
    // Check is_jumpdest bitmap
    try std.testing.expect((bitmaps.is_jumpdest[0] & (1 << 3)) != 0); // PC 3: JUMPDEST
}

test "Bytecode.readPushValue" {
    // PUSH1 0x42 PUSH2 0x1234 PUSH4 0xDEADBEEF
    const code = [_]u8{ 
        0x60, 0x42,                 // PUSH1
        0x61, 0x12, 0x34,          // PUSH2
        0x63, 0xDE, 0xAD, 0xBE, 0xEF // PUSH4
    };
    const bytecode = Bytecode.init(&code);
    
    // Test typed push values
    try std.testing.expectEqual(@as(?u8, 0x42), bytecode.readPushValue(0, 1));
    try std.testing.expectEqual(@as(?u16, 0x1234), bytecode.readPushValue(2, 2));
    try std.testing.expectEqual(@as(?u32, 0xDEADBEEF), bytecode.readPushValue(5, 4));
    
    // Test wrong opcode
    try std.testing.expectEqual(@as(?u8, null), bytecode.readPushValue(2, 1)); // Not PUSH1
    
    // Test variable-sized push
    try std.testing.expectEqual(@as(?u256, 0x42), bytecode.readPushValueN(0, 1));
    try std.testing.expectEqual(@as(?u256, 0x1234), bytecode.readPushValueN(2, 2));
    try std.testing.expectEqual(@as(?u256, 0xDEADBEEF), bytecode.readPushValueN(5, 4));
}

test "Bytecode.getInstructionSize and getNextPc" {
    // PUSH1 0x42 ADD PUSH32 <32 bytes> STOP
    var code: [36]u8 = undefined;
    code[0] = 0x60; // PUSH1
    code[1] = 0x42;
    code[2] = 0x01; // ADD
    code[3] = 0x7f; // PUSH32
    // Fill 32 bytes of push data
    for (4..36) |i| {
        code[i] = @intCast(i);
    }
    
    const bytecode = Bytecode.init(&code);
    
    try std.testing.expectEqual(@as(usize, 2), bytecode.getInstructionSize(0)); // PUSH1
    try std.testing.expectEqual(@as(usize, 1), bytecode.getInstructionSize(2)); // ADD
    try std.testing.expectEqual(@as(usize, 33), bytecode.getInstructionSize(3)); // PUSH32
    try std.testing.expectEqual(@as(usize, 0), bytecode.getInstructionSize(100)); // Out of bounds
    
    try std.testing.expectEqual(@as(?usize, 2), bytecode.getNextPc(0)); // After PUSH1
    try std.testing.expectEqual(@as(?usize, 3), bytecode.getNextPc(2)); // After ADD
    try std.testing.expectEqual(@as(?usize, 36), bytecode.getNextPc(3)); // After PUSH32
    try std.testing.expectEqual(@as(?usize, null), bytecode.getNextPc(100)); // Out of bounds
}

test "Bytecode.analyzeJumpDests" {
    // PUSH1 0x04 JUMP JUMPDEST PUSH1 0x08 JUMP JUMPDEST STOP
    const code = [_]u8{ 
        0x60, 0x04, 0x56, // PUSH1 0x04 JUMP
        0x5b,             // JUMPDEST at PC 3
        0x60, 0x08, 0x56, // PUSH1 0x08 JUMP
        0x5b,             // JUMPDEST at PC 7
        0x00              // STOP
    };
    const bytecode = Bytecode.init(&code);
    
    const Context = struct {
        jumpdests: std.ArrayList(usize),
        
        fn callback(self: *@This(), pc: usize) void {
            self.jumpdests.append(pc) catch unreachable;
        }
    };
    
    var context = Context{ .jumpdests = std.ArrayList(usize).init(std.testing.allocator) };
    defer context.jumpdests.deinit();
    
    bytecode.analyzeJumpDests(&context, Context.callback);
    
    try std.testing.expectEqual(@as(usize, 2), context.jumpdests.items.len);
    try std.testing.expectEqual(@as(usize, 3), context.jumpdests.items[0]);
    try std.testing.expectEqual(@as(usize, 7), context.jumpdests.items[1]);
}
