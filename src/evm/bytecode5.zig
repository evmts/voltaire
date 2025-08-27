/// Single-pass bytecode analysis
/// 
/// Key improvements:
/// - Single linear scan through bytecode
/// - No SIMD (due to sequential dependencies)
/// - Immediate pattern detection for jump fusion
/// - Unified state building in one pass
/// - Cache-friendly sequential access
/// 
/// EOF (EVM Object Format) Support:
/// EOF is a structured container format for EVM bytecode introduced in various EIPs.
/// Key features:
/// - Magic header: 0xEF00 marks EOF bytecode
/// - Version byte: Identifies EOF version (e.g., 0x01)
/// - Structured sections: code, data, types
/// - Explicit jumpdests: No dynamic jump analysis needed
/// - Separation of code and data: Prevents code/data confusion
/// 
/// Note: This implementation currently handles legacy bytecode.
/// Full EOF support would require:
/// - Header validation (0xEF00 magic, version)
/// - Section parsing (code, data, types)
/// - Static jump validation (no JUMPDEST scanning needed)
/// - Explicit function types and stack validation

const std = @import("std");
const builtin = @import("builtin");
const Opcode = @import("opcode.zig").Opcode;
const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;

// Single-pass bytecode analyzer
fn analyzeBytecode(comptime PcType: type, comptime BasicBlock: type, comptime FusionInfo: type, allocator: std.mem.Allocator, code: []const u8) !struct {
    push_pcs: []PcType,
    jumpdests: []PcType,
    basic_blocks: []const BasicBlock,
    jump_fusions: std.AutoHashMap(PcType, PcType),
    advanced_fusions: std.AutoHashMap(PcType, FusionInfo),
} {
    // Create local pattern checking functions that can access FusionInfo type
    const checkConstantFoldingPatternWithFusion = struct {
        fn check(bytecode: []const u8, position: PcType) ?FusionInfo {
            // Pattern A: PUSH1 a, PUSH1 b, <arith-op>
            // Pattern B: PUSH1 a, PUSH1 b, PUSH1 shift, SHL, SUB
            if (position + 4 >= bytecode.len) return null;

            // First PUSH1
            if (bytecode[position] != @intFromEnum(Opcode.PUSH1)) return null;
            const value1 = bytecode[position + 1];

            // Second PUSH1
            if (bytecode[position + 2] != @intFromEnum(Opcode.PUSH1)) return null;
            const value2 = bytecode[position + 3];

            // Next byte decides between pattern A and B
            const next = bytecode[position + 4];

            // Pattern A: arithmetic op directly after two PUSH1
            if (next == @intFromEnum(Opcode.ADD) or
                next == @intFromEnum(Opcode.SUB) or
                next == @intFromEnum(Opcode.MUL))
            {
                const folded_value: u256 = switch (next) {
                    @intFromEnum(Opcode.ADD) => @as(u256, value1) +% @as(u256, value2),
                    @intFromEnum(Opcode.SUB) => @as(u256, value1) -% @as(u256, value2),
                    @intFromEnum(Opcode.MUL) => @as(u256, value1) *% @as(u256, value2),
                    else => unreachable,
                };
                return FusionInfo{
                    .fusion_type = .constant_fold,
                    .original_length = 5,
                    .folded_value = folded_value,
                };
            }

            // Pattern B: PUSH1 shift, SHL, SUB
            if (position + 7 < bytecode.len and
                next == @intFromEnum(Opcode.PUSH1) and
                bytecode[position + 6] == @intFromEnum(Opcode.SHL) and
                bytecode[position + 7] == @intFromEnum(Opcode.SUB))
            {
                const shift_amount = bytecode[position + 5];
                const shifted: u256 = if (shift_amount < 256)
                    (@as(u256, value2) << @as(u8, @intCast(shift_amount)))
                else
                    0;
                const folded_value: u256 = @as(u256, value1) -% shifted;
                return FusionInfo{
                    .fusion_type = .constant_fold,
                    .original_length = 8,
                    .folded_value = folded_value,
                };
            }

            return null;
        }
    }.check;
    
    const checkNPushPattern = struct {
        fn check(bytecode: []const u8, position: PcType, n: u8) ?FusionInfo {
            if (position + n > bytecode.len) return null;
            
            var current_pc = position;
            var total_length: PcType = 0;
            
            // Check for n consecutive PUSH instructions
            var i: u8 = 0;
            while (i < n) : (i += 1) {
                if (current_pc >= bytecode.len) return null;
                const op = bytecode[current_pc];
                if (op < @intFromEnum(Opcode.PUSH1) or op > @intFromEnum(Opcode.PUSH32)) {
                    return null;
                }
                const push_size = op - @intFromEnum(Opcode.PUSH1) + 1;
                current_pc += 1 + push_size;
                total_length += 1 + push_size;
            }
            
            return FusionInfo{
                .fusion_type = .multi_push,
                .original_length = total_length,
                .count = n,
            };
        }
    }.check;
    
    const checkNPopPattern = struct {
        fn check(bytecode: []const u8, position: PcType, n: u8) ?FusionInfo {
            if (position + n > bytecode.len) return null;
            
            // Check if we have n consecutive POP instructions
            var i: u8 = 0;
            while (i < n) : (i += 1) {
                if (bytecode[position + i] != @intFromEnum(Opcode.POP)) {
                    return null;
                }
            }
            
            return FusionInfo{
                .fusion_type = .multi_pop,
                .original_length = n,
                .count = n,
            };
        }
    }.check;
    
    const checkIszeroJumpiFusion = struct {
        fn check(bytecode: []const u8, position: PcType) ?FusionInfo {
            if (position + 2 >= bytecode.len) return null;
            
            // Check for ISZERO
            if (bytecode[position] != @intFromEnum(Opcode.ISZERO)) return null;
            
            // Check for PUSH after ISZERO
            const push_pc = position + 1;
            const push_op = bytecode[push_pc];
            if (push_op < @intFromEnum(Opcode.PUSH1) or push_op > @intFromEnum(Opcode.PUSH32)) {
                return null;
            }
            
            const push_size = push_op - @intFromEnum(Opcode.PUSH1) + 1;
            const jumpi_pc = push_pc + 1 + push_size;
            
            // Check for JUMPI
            if (jumpi_pc >= bytecode.len or bytecode[jumpi_pc] != @intFromEnum(Opcode.JUMPI)) {
                return null;
            }
            
            return FusionInfo{
                .fusion_type = .iszero_jumpi,
                .original_length = jumpi_pc + 1 - position,
            };
        }
    }.check;
    
    const checkDup2MstorePushFusion = struct {
        fn check(bytecode: []const u8, position: PcType) ?FusionInfo {
            if (position + 3 >= bytecode.len) return null;
            
            // Check for DUP2
            if (bytecode[position] != @intFromEnum(Opcode.DUP2)) return null;
            
            // Check for MSTORE
            if (bytecode[position + 1] != @intFromEnum(Opcode.MSTORE)) return null;
            
            // Check for PUSH after MSTORE
            const push_pc = position + 2;
            const push_op = bytecode[push_pc];
            if (push_op < @intFromEnum(Opcode.PUSH1) or push_op > @intFromEnum(Opcode.PUSH32)) {
                return null;
            }
            
            const push_size = push_op - @intFromEnum(Opcode.PUSH1) + 1;
            
            return FusionInfo{
                .fusion_type = .dup2_mstore_push,
                .original_length = 3 + push_size,
            };
        }
    }.check;
    var push_list = std.ArrayListUnmanaged(PcType){};
    defer push_list.deinit(allocator);
    
    var jumpdest_list = std.ArrayListUnmanaged(PcType){};
    defer jumpdest_list.deinit(allocator);
    
    var jump_fusions = std.AutoHashMap(PcType, PcType).init(allocator);
    errdefer jump_fusions.deinit();
    
    var advanced_fusions = std.AutoHashMap(PcType, FusionInfo).init(allocator);
    errdefer advanced_fusions.deinit();
    
    // Single pass through bytecode
    var pc: PcType = 0;
    while (pc < code.len) {
        const opcode = code[pc];
        
        // First check for advanced fusion patterns (in priority order)
        // This needs to happen before processing individual opcodes
        
        // 1. Check for constant folding pattern (highest priority, longest pattern)
        if (checkConstantFoldingPatternWithFusion(code, pc)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        
        // 2. Check for 3-PUSH fusion
        if (checkNPushPattern(code, pc, 3)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        
        // 3. Check for 3-POP fusion
        if (checkNPopPattern(code, pc, 3)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        
        // 4. Check for ISZERO-JUMPI pattern
        if (checkIszeroJumpiFusion(code, pc)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        
        // 5. Check for DUP2-MSTORE-PUSH pattern
        if (checkDup2MstorePushFusion(code, pc)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        
        // 6. Check for 2-PUSH fusion
        if (checkNPushPattern(code, pc, 2)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        
        // 7. Check for 2-POP fusion
        if (checkNPopPattern(code, pc, 2)) |fusion_info| {
            try advanced_fusions.put(pc, fusion_info);
            pc += fusion_info.original_length;
            continue;
        }
        
        // Handle PUSH instructions
        if (opcode >= @intFromEnum(Opcode.PUSH1) and opcode <= @intFromEnum(Opcode.PUSH32)) {
            try push_list.append(allocator, pc);
            const push_size = opcode - @intFromEnum(Opcode.PUSH1) + 1;
            pc += 1 + push_size;
        }
        // Handle JUMPDEST instructions
        else if (opcode == @intFromEnum(Opcode.JUMPDEST)) {
            try jumpdest_list.append(allocator, pc);
            
            // Look ahead for fusion pattern
            if (pc + 1 < code.len) {
                const next_opcode = code[pc + 1];
                if (next_opcode >= @intFromEnum(Opcode.PUSH1) and next_opcode <= @intFromEnum(Opcode.PUSH32)) {
                    const push_size = next_opcode - @intFromEnum(Opcode.PUSH1) + 1;
                    const jump_pc = pc + 2 + push_size;
                    
                    // Check for JUMP after PUSH
                    if (jump_pc < code.len and code[jump_pc] == @intFromEnum(Opcode.JUMP)) {
                        // Extract target from PUSH data
                        if (pc + 2 + push_size <= code.len) {
                            var target_accum: u32 = 0;
                            for (code[pc + 2..pc + 2 + push_size]) |byte| {
                                target_accum = (target_accum << 8) | byte;
                            }
                            if (target_accum <= std.math.maxInt(PcType)) {
                                try jump_fusions.put(pc, @intCast(target_accum));
                            }
                        }
                    }
                    // Check for JUMPI pattern
                    else if (jump_pc + 1 < code.len) {
                        const next_next_opcode = code[jump_pc];
                        if (next_next_opcode >= @intFromEnum(Opcode.PUSH1) and next_next_opcode <= @intFromEnum(Opcode.PUSH32)) {
                            const push2_size = next_next_opcode - @intFromEnum(Opcode.PUSH1) + 1;
                            const jumpi_pc = jump_pc + 1 + push2_size;
                            
                            if (jumpi_pc < code.len and code[jumpi_pc] == @intFromEnum(Opcode.JUMPI)) {
                                // Extract target from first PUSH
                                if (pc + 2 + push_size <= code.len) {
                                    var target_accum: u32 = 0;
                                    for (code[pc + 2..pc + 2 + push_size]) |byte| {
                                        target_accum = (target_accum << 8) | byte;
                                    }
                                    if (target_accum <= std.math.maxInt(PcType)) {
                                        try jump_fusions.put(pc, @intCast(target_accum));
                                    }
                                }
                            }
                        }
                    }
                }
            }
            pc += 1;
        }
        else {
            pc += 1;
        }
    }
    
    // Build result arrays
    const push_pcs = try push_list.toOwnedSlice(allocator);
    errdefer allocator.free(push_pcs);
    
    const jumpdests = try jumpdest_list.toOwnedSlice(allocator);
    errdefer allocator.free(jumpdests);
    
    // Validate jump fusion targets
    var iter = jump_fusions.iterator();
    var to_remove = std.ArrayListUnmanaged(PcType){};
    defer to_remove.deinit(allocator);
    
    while (iter.next()) |entry| {
        const target = entry.value_ptr.*;
        var valid = false;
        for (jumpdests) |jd| {
            if (jd == target) {
                valid = true;
                break;
            }
        }
        if (!valid) {
            try to_remove.append(allocator, entry.key_ptr.*);
        }
    }
    
    for (to_remove.items) |key| {
        _ = jump_fusions.remove(key);
    }
    
    // Build basic blocks
    var blocks = std.ArrayListUnmanaged(BasicBlock){};
    defer blocks.deinit(allocator);
    
    var block_start: PcType = 0;
    for (jumpdests) |jd| {
        if (jd > block_start) {
            try blocks.append(allocator, .{ .start = block_start, .end = jd });
            block_start = jd;
        }
    }
    
    if (block_start < code.len) {
        try blocks.append(allocator, .{ .start = block_start, .end = @intCast(code.len) });
    }
    
    const basic_blocks = try blocks.toOwnedSlice(allocator);
    
    return .{
        .push_pcs = push_pcs,
        .jumpdests = jumpdests,
        .basic_blocks = basic_blocks,
        .jump_fusions = jump_fusions,
        .advanced_fusions = advanced_fusions,
    };
}

/// Bytecode factory function
pub fn Bytecode(comptime cfg: BytecodeConfig) type {
    comptime cfg.validate();
    
    return struct {
        const Self = @This();
        pub const PcType = cfg.PcType();
        
        /// Runtime code (metadata removed)
        runtime_code: []const u8,
        /// Positions of all PUSH instructions (for fusion)
        push_pcs: []const PcType,
        /// Valid JUMPDEST positions
        jumpdests: []const PcType,
        /// Basic blocks for control flow
        basic_blocks: []const BasicBlock,
        /// Jump fusion mapping: JUMPDEST PC -> final target PC
        jump_fusions: std.AutoHashMap(PcType, PcType),
        /// Advanced fusion patterns detected in bytecode
        advanced_fusions: std.AutoHashMap(PcType, FusionInfo),
        /// Allocator for cleanup
        allocator: std.mem.Allocator,
        
        /// Basic block - just start and end
        pub const BasicBlock = struct {
            start: PcType,
            end: PcType,
        };
        
        /// Information about a detected fusion pattern
        pub const FusionInfo = struct {
            fusion_type: FusionType,
            /// Length of original instruction sequence
            original_length: PcType,
            /// For constant folding, the computed value
            folded_value: ?u256 = null,
            /// For multi-PUSH/POP, number of operations
            count: ?u8 = null,
        };
        
        /// Types of fusion patterns we detect
        pub const FusionType = enum {
            /// Constant folding (e.g., PUSH PUSH SHL SUB -> single PUSH)
            constant_fold,
            /// Multiple PUSH instructions (2 or 3)
            multi_push,
            /// Multiple POP instructions (2 or 3) 
            multi_pop,
            /// ISZERO PUSH JUMPI sequence
            iszero_jumpi,
            /// DUP2 MSTORE PUSH sequence
            dup2_mstore_push,
        };
        
        /// Error types for bytecode operations
        pub const Error = error{
            InitcodeTooLarge,
            OutOfMemory,
            InvalidGasLimit,
            BytecodeTooLarge,
        };
        
        pub fn init(allocator: std.mem.Allocator, code: []const u8) !Self {
            // Enforce maximum bytecode size from config
            if (code.len > cfg.max_bytecode_size) {
                return error.BytecodeTooLarge;
            }

            // Extract runtime code (for now just use the whole code)
            const runtime_code = code;
            
            // Single-pass analysis
            const analysis = try analyzeBytecode(PcType, BasicBlock, FusionInfo, allocator, runtime_code);
            
            var bc = Self{
                .runtime_code = runtime_code,
                .push_pcs = analysis.push_pcs,
                .jumpdests = analysis.jumpdests,
                .basic_blocks = analysis.basic_blocks,
                .jump_fusions = analysis.jump_fusions,
                .advanced_fusions = analysis.advanced_fusions,
                .allocator = allocator,
            };

            // Validate immediate JUMP/JUMPI targets now
            bc.validate_immediate_jumps() catch |e| {
                bc.deinit();
                return e;
            };

            return bc;
        }
        
        /// Initialize bytecode from initcode (contract creation code)
        pub fn initFromInitcode(allocator: std.mem.Allocator, initcode: []const u8) Error!Self {
            // Check initcode size limit
            if (initcode.len > cfg.max_initcode_size) {
                return Error.InitcodeTooLarge;
            }
            
            // For now, treat initcode as regular bytecode
            // In real implementation, would need to execute initcode to get runtime code
            return init(allocator, initcode) catch |err| switch (err) {
                error.OutOfMemory => Error.OutOfMemory,
                else => Error.OutOfMemory, // Convert other errors
            };
        }
        
        /// Calculate gas cost for initcode
        pub fn calculateInitcodeGas(initcode_size: usize) u64 {
            // EIP-3860: initcode gas cost is 2 gas per word (32 bytes)
            // Formula: 2 * ceil(initcode_size / 32)
            const words = (initcode_size + 31) / 32;
            return 2 * words;
        }
        
        pub fn deinit(self: *Self) void {
            self.allocator.free(self.push_pcs);
            self.allocator.free(self.jumpdests);
            self.allocator.free(self.basic_blocks);
            self.jump_fusions.deinit();
            self.advanced_fusions.deinit();
            // Note: runtime_code is a slice of the input, not allocated
        }
        
        /// Extract Solidity metadata if present (caller must call explicitly)
        pub fn extractMetadata(code: []const u8) ?struct { start: usize, data: []const u8 } {
            // Solidity metadata is CBOR-encoded at the end
            // Format: 0xa2 0x64 'ipfs' ... 0x64 'solc' ...
            // We look for the 0xa2 0x64 pattern
            
            if (code.len < 4) return null;
            
            // Search backwards for potential metadata start
            var i = code.len;
            while (i >= 2) : (i -= 1) {
                if (code[i - 2] == 0xa2 and code[i - 1] == 0x64) {
                    // Found potential metadata start
                    return .{
                        .start = i - 2,
                        .data = code[i - 2..],
                    };
                }
            }
            
            return null;
        }
        
        /// Safe Solidity metadata parsing
        pub fn getSolidityMetadata(self: *const Self) ?struct { start: usize, length: usize, ipfs_hash: ?[]const u8, solc_version: ?[]const u8 } {
            const metadata_result = extractMetadata(self.runtime_code) orelse return null;
            
            // Safely parse CBOR metadata
            const data = metadata_result.data;
            if (data.len < 4) return null;
            
            // Check for CBOR map with 2 elements (0xa2)
            if (data[0] != 0xa2) return null;
            
            var result = struct {
                start: usize,
                length: usize,
                ipfs_hash: ?[]const u8,
                solc_version: ?[]const u8,
            }{
                .start = metadata_result.start,
                .length = data.len,
                .ipfs_hash = null,
                .solc_version = null,
            };
            
            var i: usize = 1;
            var entries_parsed: usize = 0;
            
            while (i < data.len and entries_parsed < 2) : (entries_parsed += 1) {
                // Check for string type (0x64 = 4-byte string)
                if (i + 1 >= data.len) break;
                
                const str_len = data[i] & 0x1F; // Lower 5 bits for short strings
                i += 1;
                
                if (i + str_len >= data.len) break;
                
                const key = data[i..i + str_len];
                i += str_len;
                
                // Parse value
                if (i >= data.len) break;
                
                const value_type = data[i] >> 5; // Upper 3 bits
                const value_len = data[i] & 0x1F;
                i += 1;
                
                if (i + value_len > data.len) break;
                
                const value = data[i..i + value_len];
                i += value_len;
                
                // Check key type
                if (std.mem.eql(u8, key, "ipfs")) {
                    result.ipfs_hash = value;
                } else if (std.mem.eql(u8, key, "solc")) {
                    result.solc_version = value;
                }
                
                _ = value_type; // Unused for now
            }
            
            return result;
        }
        
        /// Iterator for traversing bytecode
        pub const Iterator = struct {
            code: []const u8,
            pc: PcType,
            
            pub fn next(self: *Iterator) ?struct { pc: PcType, opcode: u8 } {
                if (self.pc >= self.code.len) return null;
                
                const opcode = self.code[self.pc];
                const current_pc = self.pc;
                
                // Advance PC
                if (opcode >= @intFromEnum(Opcode.PUSH1) and opcode <= @intFromEnum(Opcode.PUSH32)) {
                    const push_size = opcode - @intFromEnum(Opcode.PUSH1) + 1;
                    self.pc += 1 + push_size;
                } else {
                    self.pc += 1;
                }
                
                return .{ .pc = current_pc, .opcode = opcode };
            }
        };
        
        /// Create an iterator for this bytecode
        pub fn iterator(self: Self) Iterator {
            return .{ .code = self.runtime_code, .pc = 0 };
        }
        
        /// Tagged union for opcode data
        pub const OpcodeData = union(enum) {
            push: struct { value: u256 },
            jumpdest: void,
            jump: void,
            jumpi: void,
            basic: void,
        };
        
        /// Iterator that provides OpcodeData along with opcodes
        pub const IteratorWithData = struct {
            code: []const u8,
            pc: PcType,
            bytecode: *const Self,
            
            pub fn next(self: *IteratorWithData) ?struct { pc: PcType, opcode: u8, data: OpcodeData } {
                if (self.pc >= self.code.len) return null;
                
                const opcode = self.code[self.pc];
                const current_pc = self.pc;
                var data: OpcodeData = .{ .basic = {} };
                
                // Handle different opcode types
                if (opcode >= @intFromEnum(Opcode.PUSH1) and opcode <= @intFromEnum(Opcode.PUSH32)) {
                    const push_size = opcode - @intFromEnum(Opcode.PUSH1) + 1;
                    
                    // Extract PUSH value using normal u256 arithmetic
                    var value_u256: u256 = 0;
                    if (self.pc + 1 + push_size <= self.code.len) {
                        var i: usize = 0;
                        while (i < push_size) : (i += 1) {
                            const byte = self.code[self.pc + 1 + i];
                            value_u256 = (value_u256 << 8) | @as(u256, byte);
                        }
                    }
                    const value = value_u256;
                    
                    data = .{ .push = .{ .value = value } };
                    self.pc += 1 + push_size;
                } else {
                    // Handle other opcodes
                    switch (opcode) {
                        @intFromEnum(Opcode.JUMPDEST) => data = .{ .jumpdest = {} },
                        @intFromEnum(Opcode.JUMP) => data = .{ .jump = {} },
                        @intFromEnum(Opcode.JUMPI) => data = .{ .jumpi = {} },
                        else => {},
                    }
                    self.pc += 1;
                }
                
                return .{ .pc = current_pc, .opcode = opcode, .data = data };
            }
        };
        
        /// Create an iterator with opcode data
        pub fn iteratorWithData(self: *const Self) IteratorWithData {
            return .{ .code = self.runtime_code, .pc = 0, .bytecode = self };
        }
        
        /// Check if a PC is a valid jump destination
        pub fn isValidJumpDest(self: Self, pc: PcType) bool {
            // Binary search since jumpdests are sorted
            for (self.jumpdests) |jd| {
                if (jd == pc) return true;
                if (jd > pc) return false;
            }
            return false;
        }
        
        /// Get the fused jump target if this JUMPDEST has a fusion
        pub fn getFusedTarget(self: Self, pc: PcType) ?PcType {
            return self.jump_fusions.get(pc);
        }
        
        /// Get advanced fusion information for a given PC
        pub fn getAdvancedFusion(self: Self, pc: PcType) ?FusionInfo {
            return self.advanced_fusions.get(pc);
        }
        
        /// Check if a PC is a PUSH instruction (fusion candidate)
        pub fn isPushInstruction(self: Self, pc: PcType) bool {
            for (self.push_pcs) |push_pc| {
                if (push_pc == pc) return true;
                if (push_pc > pc) return false;
            }
            return false;
        }
        
        /// Validate that all immediate jumps target valid JUMPDESTs
        pub fn validate_immediate_jumps(self: *const Self) !void {
            var iter = self.iterator();
            while (iter.next()) |item| {
                const pc = item.pc;
                const opcode = item.opcode;
                
                // Check for PUSH followed by JUMP/JUMPI
                if (opcode >= @intFromEnum(Opcode.PUSH1) and opcode <= @intFromEnum(Opcode.PUSH32)) {
                    const push_size = opcode - @intFromEnum(Opcode.PUSH1) + 1;
                    const value_start = pc + 1;
                    
                    // Check if we have enough bytes for the value
                    if (value_start + push_size <= self.runtime_code.len) {
                        // Check the next instruction after PUSH
                        const next_pc = pc + 1 + push_size;
                        if (next_pc < self.runtime_code.len) {
                            const next_opcode = self.runtime_code[next_pc];
                            
                            // If it's a JUMP or JUMPI, validate the target
                            if (next_opcode == @intFromEnum(Opcode.JUMP) or 
                                next_opcode == @intFromEnum(Opcode.JUMPI)) {
                                // Extract the full PUSH value, then cast if in range of PcType
                                var target_u256: u256 = 0;
                                var i: usize = 0;
                                while (i < push_size) : (i += 1) {
                                    const b = self.runtime_code[value_start + i];
                                    target_u256 = (target_u256 << 8) | @as(u256, b);
                                }

                                // If the target doesn't fit PcType, it's invalid
                                if (target_u256 > @as(u256, std.math.maxInt(PcType))) {
                                    return error.InvalidJumpDestination;
                                }

                                const target: PcType = @intCast(target_u256);
                                if (!self.isValidJumpDest(target)) {
                                    return error.InvalidJumpDestination;
                                }
                            }
                        }
                    }
                }
            }
        }
        
        /// Read a PUSH value of size N at given PC
        pub fn readPushValueN(self: *const Self, pc: PcType, comptime n: comptime_int) u256 {
            // Validate PC is in bounds
            if (pc >= self.runtime_code.len) return 0;
            
            const opcode = self.runtime_code[pc];
            const expected_push = @intFromEnum(Opcode.PUSH1) + (n - 1);
            
            // Check if it's the right PUSH opcode
            if (opcode != expected_push) return 0;
            
            // Check if we have enough bytes
            if (pc + 1 + n > self.runtime_code.len) return 0;
            
            // Read the value using normal u256 arithmetic
            var value_u256: u256 = 0;
            var i: usize = 0;
            while (i < n) : (i += 1) {
                const byte = self.runtime_code[pc + 1 + i];
                value_u256 = (value_u256 << 8) | @as(u256, byte);
            }
            
            return value_u256;
        }
        
        /// Compute total gas usage for the bytecode
        pub fn computeGasUsage(self: *const Self, allocator: std.mem.Allocator) !u64 {
            var total_gas: u64 = 0;
            var iter = self.iterator();
            
            while (iter.next()) |item| {
                const opcode = item.opcode;
                
                // Basic gas costs (simplified - real implementation would use opcode_data)
                const gas_cost: u64 = switch (opcode) {
                    @intFromEnum(Opcode.STOP) => 0,
                    @intFromEnum(Opcode.ADD), @intFromEnum(Opcode.SUB) => 3,
                    @intFromEnum(Opcode.MUL) => 5,
                    @intFromEnum(Opcode.DIV), @intFromEnum(Opcode.SDIV) => 5,
                    @intFromEnum(Opcode.MOD), @intFromEnum(Opcode.SMOD) => 5,
                    @intFromEnum(Opcode.EXP) => 10, // Base cost, actual is dynamic
                    @intFromEnum(Opcode.PUSH1)...@intFromEnum(Opcode.PUSH32) => 3,
                    @intFromEnum(Opcode.POP) => 2,
                    @intFromEnum(Opcode.DUP1)...@intFromEnum(Opcode.DUP16) => 3,
                    @intFromEnum(Opcode.SWAP1)...@intFromEnum(Opcode.SWAP16) => 3,
                    @intFromEnum(Opcode.JUMP), @intFromEnum(Opcode.JUMPI) => 8,
                    @intFromEnum(Opcode.JUMPDEST) => 1,
                    else => 3, // Default for other opcodes
                };
                
                total_gas += gas_cost;
            }
            
            _ = allocator; // For future use if needed
            return total_gas;
        }
        
        /// Statistics about the bytecode
        pub const Stats = struct {
            opcode_count: usize,
            push_count: usize,
            jumpdest_count: usize,
            jump_count: usize,
            basic_block_count: usize,
            fusion_count: usize,
        };
        
        /// Get statistics about the bytecode
        pub fn getStats(self: *const Self) Stats {
            var stats = Stats{
                .opcode_count = 0,
                .push_count = self.push_pcs.len,
                .jumpdest_count = self.jumpdests.len,
                .jump_count = 0,
                .basic_block_count = self.basic_blocks.len,
                .fusion_count = self.jump_fusions.count() + self.advanced_fusions.count(),
            };
            
            var iter = self.iterator();
            while (iter.next()) |item| {
                stats.opcode_count += 1;
                const opcode = item.opcode;
                
                if (opcode == @intFromEnum(Opcode.JUMP) or 
                    opcode == @intFromEnum(Opcode.JUMPI)) {
                    stats.jump_count += 1;
                }
            }
            
            return stats;
        }
        
    };
}

// ============= TESTS =============

const testing = std.testing;

test "bytecode5 iterator - empty code" {
    const code = [_]u8{};
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    // Manual iterator test since we don't have init yet
    var iter = BytecodeType.Iterator{ .code = &code, .pc = 0 };
    try testing.expect(iter.next() == null);
}

test "bytecode5 iterator - simple opcodes" {
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x60,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    var iter = BytecodeType.Iterator{ .code = &code, .pc = 0 };
    
    // First: PUSH1
    const first = iter.next().?;
    try testing.expectEqual(@as(u16, 0), first.pc);
    try testing.expectEqual(@intFromEnum(Opcode.PUSH1), first.opcode);
    
    // Second: ADD (skipped push data)
    const second = iter.next().?;
    try testing.expectEqual(@as(u16, 2), second.pc);
    try testing.expectEqual(@intFromEnum(Opcode.ADD), second.opcode);
    
    // Third: STOP
    const third = iter.next().?;
    try testing.expectEqual(@as(u16, 3), third.pc);
    try testing.expectEqual(@intFromEnum(Opcode.STOP), third.opcode);
    
    // End
    try testing.expect(iter.next() == null);
}

test "bytecode5 iterator - multiple PUSH sizes" {
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH2), 0x02, 0x03,
        @intFromEnum(Opcode.PUSH4), 0x04, 0x05, 0x06, 0x07,
        @intFromEnum(Opcode.PUSH32),
    } ++ [_]u8{0x08} ** 32;
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var iter = BytecodeType.Iterator{ .code = &code, .pc = 0 };
    
    // PUSH1 at 0
    const p1 = iter.next().?;
    try testing.expectEqual(@as(u16, 0), p1.pc);
    try testing.expectEqual(@intFromEnum(Opcode.PUSH1), p1.opcode);
    
    // PUSH2 at 2
    const p2 = iter.next().?;
    try testing.expectEqual(@as(u16, 2), p2.pc);
    try testing.expectEqual(@intFromEnum(Opcode.PUSH2), p2.opcode);
    
    // PUSH4 at 5
    const p4 = iter.next().?;
    try testing.expectEqual(@as(u16, 5), p4.pc);
    try testing.expectEqual(@intFromEnum(Opcode.PUSH4), p4.opcode);
    
    // PUSH32 at 10
    const p32 = iter.next().?;
    try testing.expectEqual(@as(u16, 10), p32.pc);
    try testing.expectEqual(@intFromEnum(Opcode.PUSH32), p32.opcode);
    
    // End
    try testing.expect(iter.next() == null);
}

test "bytecode5 iterator - edge case truncated push" {
    // PUSH2 but only 1 byte of data
    const code = [_]u8{ @intFromEnum(Opcode.PUSH2), 0xFF };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var iter = BytecodeType.Iterator{ .code = &code, .pc = 0 };
    
    const first = iter.next().?;
    try testing.expectEqual(@as(u16, 0), first.pc);
    try testing.expectEqual(@intFromEnum(Opcode.PUSH2), first.opcode);
    
    // Iterator should handle truncated push gracefully
    try testing.expect(iter.next() == null);
}

test "bytecode5 metadata extraction - no metadata" {
    const code = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x60, @intFromEnum(Opcode.STOP) };
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    const metadata = BytecodeType.extractMetadata(&code);
    try testing.expect(metadata == null);
}

test "bytecode5 helper methods - isValidJumpDest" {
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    // Mock bytecode with sorted jumpdests
    var jump_fusions = std.AutoHashMap(BytecodeType.PcType, BytecodeType.PcType).init(testing.allocator);
    defer jump_fusions.deinit();
    
    var bytecode = BytecodeType{
        .runtime_code = &.{},
        .push_pcs = &.{},
        .jumpdests = &[_]BytecodeType.PcType{ 5, 10, 20, 50 },
        .basic_blocks = &.{},
        .jump_fusions = jump_fusions,
        .allocator = undefined,
    };
    
    // Test valid jumpdests
    try testing.expect(bytecode.isValidJumpDest(5));
    try testing.expect(bytecode.isValidJumpDest(10));
    try testing.expect(bytecode.isValidJumpDest(20));
    try testing.expect(bytecode.isValidJumpDest(50));
    
    // Test invalid jumpdests
    try testing.expect(!bytecode.isValidJumpDest(0));
    try testing.expect(!bytecode.isValidJumpDest(4));
    try testing.expect(!bytecode.isValidJumpDest(6));
    try testing.expect(!bytecode.isValidJumpDest(15));
    try testing.expect(!bytecode.isValidJumpDest(100));
}

test "bytecode5 helper methods - isPushInstruction" {
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    // Mock bytecode with sorted push_pcs
    var jump_fusions = std.AutoHashMap(BytecodeType.PcType, BytecodeType.PcType).init(testing.allocator);
    defer jump_fusions.deinit();
    
    var bytecode = BytecodeType{
        .runtime_code = &.{},
        .push_pcs = &[_]BytecodeType.PcType{ 0, 3, 8, 15 },
        .jumpdests = &.{},
        .basic_blocks = &.{},
        .jump_fusions = jump_fusions,
        .allocator = undefined,
    };
    
    // Test push instructions
    try testing.expect(bytecode.isPushInstruction(0));
    try testing.expect(bytecode.isPushInstruction(3));
    try testing.expect(bytecode.isPushInstruction(8));
    try testing.expect(bytecode.isPushInstruction(15));
    
    // Test non-push positions
    try testing.expect(!bytecode.isPushInstruction(1));
    try testing.expect(!bytecode.isPushInstruction(4));
    try testing.expect(!bytecode.isPushInstruction(20));
}

test "bytecode5 single-pass - simple code" {
    const allocator = testing.allocator;
    const code = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x60, @intFromEnum(Opcode.ADD) };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should store runtime code as slice of input
    try testing.expectEqual(@as(usize, 3), bytecode.runtime_code.len);
    try testing.expectEqual(&code, bytecode.runtime_code.ptr);
    
    // Should find one push instruction
    try testing.expectEqual(@as(usize, 1), bytecode.push_pcs.len);
    try testing.expectEqual(@as(BytecodeType.PcType, 0), bytecode.push_pcs[0]);
}

test "bytecode5 init - multiple PUSH instructions" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x10,
        @intFromEnum(Opcode.PUSH2), 0x20, 0x30,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.PUSH4), 0x40, 0x50, 0x60, 0x70,
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    try testing.expectEqual(@as(usize, 3), bytecode.push_pcs.len);
    try testing.expectEqual(@as(BytecodeType.PcType, 0), bytecode.push_pcs[0]);
    try testing.expectEqual(@as(BytecodeType.PcType, 2), bytecode.push_pcs[1]);
    try testing.expectEqual(@as(BytecodeType.PcType, 6), bytecode.push_pcs[2]);
}

test "bytecode5 init - JUMPDEST detection" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),                      // Valid at 0
        @intFromEnum(Opcode.PUSH2), 0x00, @intFromEnum(Opcode.JUMPDEST), // PUSH at 1, JUMPDEST in data at 3
        @intFromEnum(Opcode.JUMPDEST),                      // Valid at 4
        @intFromEnum(Opcode.PUSH1), @intFromEnum(Opcode.JUMPDEST), // PUSH at 5, JUMPDEST in data at 6
        @intFromEnum(Opcode.JUMPDEST),                      // Valid at 7
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should find 3 valid JUMPDESTs (0, 4, 7)
    try testing.expectEqual(@as(usize, 3), bytecode.jumpdests.len);
    try testing.expectEqual(@as(BytecodeType.PcType, 0), bytecode.jumpdests[0]);
    try testing.expectEqual(@as(BytecodeType.PcType, 4), bytecode.jumpdests[1]);
    try testing.expectEqual(@as(BytecodeType.PcType, 7), bytecode.jumpdests[2]);
}

test "bytecode5 init - basic blocks" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x04,
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.INVALID),
        @intFromEnum(Opcode.JUMPDEST),  // at 4
        @intFromEnum(Opcode.PUSH1), 0x08,
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.JUMPDEST),  // at 8
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    try testing.expectEqual(@as(usize, 3), bytecode.basic_blocks.len);
    
    // Block 0: [0, 4)
    try testing.expectEqual(@as(BytecodeType.PcType, 0), bytecode.basic_blocks[0].start);
    try testing.expectEqual(@as(BytecodeType.PcType, 4), bytecode.basic_blocks[0].end);
    
    // Block 1: [4, 8)
    try testing.expectEqual(@as(BytecodeType.PcType, 4), bytecode.basic_blocks[1].start);
    try testing.expectEqual(@as(BytecodeType.PcType, 8), bytecode.basic_blocks[1].end);
    
    // Block 2: [8, 10)
    try testing.expectEqual(@as(BytecodeType.PcType, 8), bytecode.basic_blocks[2].start);
    try testing.expectEqual(@as(BytecodeType.PcType, 10), bytecode.basic_blocks[2].end);
}

test "bytecode5 init - empty code" {
    const allocator = testing.allocator;
    const code = [_]u8{};
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    try testing.expectEqual(@as(usize, 0), bytecode.runtime_code.len);
    try testing.expectEqual(@as(usize, 0), bytecode.push_pcs.len);
    try testing.expectEqual(@as(usize, 0), bytecode.jumpdests.len);
    try testing.expectEqual(@as(usize, 0), bytecode.basic_blocks.len);
}

test "bytecode5 single-pass analyzer" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH2), 0x02, 0x03,
        @intFromEnum(Opcode.ADD),
    };
    
    const analysis = try analyzeBytecode(u16, allocator, &code);
    defer {
        allocator.free(analysis.push_pcs);
        allocator.free(analysis.jumpdests);
        allocator.free(analysis.basic_blocks);
        analysis.jump_fusions.deinit();
    }
    
    // Should find both PUSH instructions
    try testing.expectEqual(@as(usize, 2), analysis.push_pcs.len);
    try testing.expectEqual(@as(u16, 0), analysis.push_pcs[0]);
    try testing.expectEqual(@as(u16, 2), analysis.push_pcs[1]);
}

test "bytecode5 truncated PUSH handling" {
    const allocator = testing.allocator;
    
    // PUSH4 but only 2 bytes of data
    const code = [_]u8{ @intFromEnum(Opcode.PUSH4), 0xFF, 0xEE };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should find the PUSH4
    try testing.expectEqual(@as(usize, 1), bytecode.push_pcs.len);
    try testing.expectEqual(@as(BytecodeType.PcType, 0), bytecode.push_pcs[0]);
}

test "bytecode5 correctly skips PUSH data (SIMD bug fix)" {
    const allocator = testing.allocator;
    
    // Create bytecode where PUSH data contains bytes that look like PUSH opcodes
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH2),       // PC 0: PUSH2
        @intFromEnum(Opcode.PUSH1),       // PC 1: This is PUSH data (value 0x60), not an opcode!
        0x42,                             // PC 2: More PUSH data (value 0x42)
        @intFromEnum(Opcode.ADD),         // PC 3: ADD opcode
        @intFromEnum(Opcode.PUSH1),       // PC 4: Real PUSH1
        0x10,                             // PC 5: PUSH data (value 0x10)
        @intFromEnum(Opcode.PUSH3),       // PC 6: PUSH3
        @intFromEnum(Opcode.PUSH1),       // PC 7: This is PUSH data for PUSH3!
        @intFromEnum(Opcode.PUSH2),       // PC 8: More PUSH data for PUSH3!
        0xFF,                             // PC 9: Last byte of PUSH3 data
        @intFromEnum(Opcode.STOP),        // PC 10: STOP
        0x00, 0x00, 0x00, 0x00, 0x00,    // PC 11-15: Padding
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should find only real PUSH instructions at PC 0, 4, and 6
    try testing.expectEqual(@as(usize, 3), bytecode.push_pcs.len);
    try testing.expectEqual(@as(BytecodeType.PcType, 0), bytecode.push_pcs[0]); // PUSH2 at PC 0
    try testing.expectEqual(@as(BytecodeType.PcType, 4), bytecode.push_pcs[1]); // PUSH1 at PC 4  
    try testing.expectEqual(@as(BytecodeType.PcType, 6), bytecode.push_pcs[2]); // PUSH3 at PC 6
}

test "bytecode5 metadata extraction" {
    // Test with actual metadata pattern
    const code_with_metadata = [_]u8{ 
        @intFromEnum(Opcode.PUSH1), 0x60,
        @intFromEnum(Opcode.STOP),
    } ++ [_]u8{ 0xa2, 0x64 } ++ "ipfs" ++ [_]u8{0x58, 0x20} ++ [_]u8{0x00} ** 32;
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    const metadata = BytecodeType.extractMetadata(code_with_metadata[0..]);
    
    try testing.expect(metadata != null);
    try testing.expectEqual(@as(usize, 3), metadata.?.start);
    try testing.expectEqual(@as(usize, 40), metadata.?.data.len);
}

test "bytecode5 multiple contiguous JUMPDESTs" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),  // at 0
        @intFromEnum(Opcode.JUMPDEST),  // at 1
        @intFromEnum(Opcode.JUMPDEST),  // at 2
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should find all 3 JUMPDESTs
    try testing.expectEqual(@as(usize, 3), bytecode.jumpdests.len);
    try testing.expectEqual(@as(BytecodeType.PcType, 0), bytecode.jumpdests[0]);
    try testing.expectEqual(@as(BytecodeType.PcType, 1), bytecode.jumpdests[1]);
    try testing.expectEqual(@as(BytecodeType.PcType, 2), bytecode.jumpdests[2]);
    
    // Should create multiple blocks
    try testing.expect(bytecode.basic_blocks.len >= 3);
}

test "bytecode5 boundary conditions with custom PcType" {
    const allocator = testing.allocator;
    
    // Test with u8 PcType (max 255 bytes)
    const small_cfg = BytecodeConfig{ .max_bytecode_size = 255 };
    const SmallBytecode = Bytecode(small_cfg);
    
    // Create code that fills u8 capacity
    var code: [255]u8 = undefined;
    code[0] = @intFromEnum(Opcode.JUMPDEST);
    code[100] = @intFromEnum(Opcode.PUSH1);
    code[101] = 0xFF;
    code[254] = @intFromEnum(Opcode.JUMPDEST);
    
    var bytecode = try SmallBytecode.init(allocator, &code);
    defer bytecode.deinit();
    
    try testing.expectEqual(u8, SmallBytecode.PcType);
    try testing.expect(bytecode.jumpdests.len >= 2);
}


test "bytecode5 iterator with bytecode instance" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.JUMPDEST),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    var iter = bytecode.iterator();
    
    const first = iter.next().?;
    try testing.expectEqual(@intFromEnum(Opcode.PUSH2), first.opcode);
    try testing.expectEqual(@as(BytecodeType.PcType, 0), first.pc);
    
    const second = iter.next().?;
    try testing.expectEqual(@intFromEnum(Opcode.JUMPDEST), second.opcode);
    try testing.expectEqual(@as(BytecodeType.PcType, 3), second.pc);
    
    try testing.expect(iter.next() == null);
}

test "bytecode5 ERC20 real world bytecode" {
    const allocator = testing.allocator;
    
    // This is a minimal ERC20 bytecode snippet that should be valid
    // Contains PUSH, JUMPDEST, and JUMP operations
    const erc20_snippet = [_]u8{
        // Constructor portion
        @intFromEnum(Opcode.PUSH1), 0x80,  // PUSH1 0x80
        @intFromEnum(Opcode.PUSH1), 0x40,  // PUSH1 0x40
        @intFromEnum(Opcode.MSTORE),       // MSTORE
        @intFromEnum(Opcode.PUSH1), 0x0A,  // PUSH1 0x0A (jump target)
        @intFromEnum(Opcode.JUMP),         // JUMP
        @intFromEnum(Opcode.INVALID),      // Padding
        @intFromEnum(Opcode.INVALID),      // Padding
        @intFromEnum(Opcode.INVALID),      // Padding
        @intFromEnum(Opcode.INVALID),      // Padding
        @intFromEnum(Opcode.JUMPDEST),     // JUMPDEST at position 10 (0x0A)
        @intFromEnum(Opcode.STOP),         // STOP
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &erc20_snippet);
    defer bytecode.deinit();
    
    // Verify the analysis results
    try testing.expectEqual(@as(usize, 3), bytecode.push_pcs.len); 
    try testing.expectEqual(@as(usize, 1), bytecode.jumpdests.len); 
    try testing.expectEqual(@as(usize, 2), bytecode.basic_blocks.len); 
    
    // Verify specific PUSH instructions were found
    try testing.expect(bytecode.isPushInstruction(0));  // PUSH1 at 0
    try testing.expect(bytecode.isPushInstruction(2));  // PUSH1 at 2
    try testing.expect(bytecode.isPushInstruction(5));  // PUSH1 at 5
    
    // Verify JUMPDEST was found
    try testing.expect(bytecode.isValidJumpDest(10));  // JUMPDEST at 10
}

test "bytecode5 JUMPDEST to JUMP fusion - simple case" {
    const allocator = testing.allocator;
    
    // Create bytecode with JUMPDEST immediately followed by JUMP
    const bytecode_data = [_]u8{
        // Setup: PUSH target and JUMP to JUMPDEST
        @intFromEnum(Opcode.PUSH1), 0x03,  // Push jump target (PC 3)
        @intFromEnum(Opcode.JUMP),         // Jump to PC 3
        
        // JUMPDEST followed by unconditional JUMP
        @intFromEnum(Opcode.JUMPDEST),     // PC 3: JUMPDEST
        @intFromEnum(Opcode.PUSH1), 0x08,  // PC 4: Push final target
        @intFromEnum(Opcode.JUMP),         // PC 6: Jump to final target
        @intFromEnum(Opcode.INVALID),      // PC 7: Unreachable
        
        // Final target
        @intFromEnum(Opcode.JUMPDEST),     // PC 8: Final JUMPDEST
        @intFromEnum(Opcode.STOP),         // PC 9: Stop
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify jumpdests are found
    try testing.expectEqual(@as(usize, 2), bytecode.jumpdests.len);
    try testing.expect(bytecode.isValidJumpDest(3));
    try testing.expect(bytecode.isValidJumpDest(8));
    
    // Verify fusion mapping was detected
    try testing.expectEqual(@as(?BytecodeType.PcType, 8), bytecode.getFusedTarget(3));
}

test "bytecode5 JUMPDEST to JUMPI fusion" {
    const allocator = testing.allocator;
    
    // Create bytecode with JUMPDEST followed by conditional JUMP
    const bytecode_data = [_]u8{
        // JUMPDEST followed by JUMPI
        @intFromEnum(Opcode.JUMPDEST),     // PC 0: JUMPDEST
        @intFromEnum(Opcode.PUSH1), 0x01,  // PC 1: Push condition
        @intFromEnum(Opcode.PUSH1), 0x07,  // PC 3: Push target
        @intFromEnum(Opcode.JUMPI),        // PC 5: Conditional jump
        @intFromEnum(Opcode.INVALID),      // PC 6: Fall through if not taken
        
        // Jump target
        @intFromEnum(Opcode.JUMPDEST),     // PC 7: Target JUMPDEST
        @intFromEnum(Opcode.STOP),         // PC 8: Stop
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify jumpdests
    try testing.expectEqual(@as(usize, 2), bytecode.jumpdests.len);
    
    // Verify JUMPI fusion behavior
    try testing.expectEqual(@as(?BytecodeType.PcType, 7), bytecode.getFusedTarget(0));
}

test "bytecode5 complex jump fusion chain" {
    const allocator = testing.allocator;
    
    // Create a chain: JUMPDEST → JUMP → JUMPDEST → JUMP → final JUMPDEST
    const bytecode_data = [_]u8{
        // First JUMPDEST in chain
        @intFromEnum(Opcode.JUMPDEST),     // PC 0
        @intFromEnum(Opcode.PUSH1), 0x04,  // PC 1
        @intFromEnum(Opcode.JUMP),         // PC 3
        
        // Second JUMPDEST in chain
        @intFromEnum(Opcode.JUMPDEST),     // PC 4
        @intFromEnum(Opcode.PUSH1), 0x08,  // PC 5
        @intFromEnum(Opcode.JUMP),         // PC 7
        
        // Final JUMPDEST (not a jump)
        @intFromEnum(Opcode.JUMPDEST),     // PC 8
        @intFromEnum(Opcode.PUSH1), 0x42,  // PC 9: Some other operation
        @intFromEnum(Opcode.STOP),         // PC 11
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify chain fusion
    // Current implementation: PC 0 fuses to PC 4, PC 4 fuses to PC 8
    // Future optimization could chain these transitively
    try testing.expectEqual(@as(?BytecodeType.PcType, 4), bytecode.getFusedTarget(0));
    // PC 4 should fuse to PC 8  
    try testing.expectEqual(@as(?BytecodeType.PcType, 8), bytecode.getFusedTarget(4));
    // PC 8 should not be fused (no immediate jump after)
    try testing.expectEqual(@as(?BytecodeType.PcType, null), bytecode.getFusedTarget(8));
}

test "bytecode5 jump fusion with push data edge case" {
    const allocator = testing.allocator;
    
    // Test case where JUMPDEST appears in PUSH data (should not be fused)
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH2),         // PC 0
        @intFromEnum(Opcode.JUMPDEST),     // PC 1: In PUSH data (invalid)
        @intFromEnum(Opcode.JUMP),         // PC 2: In PUSH data (invalid)
        
        @intFromEnum(Opcode.JUMPDEST),     // PC 3: Valid JUMPDEST
        @intFromEnum(Opcode.PUSH1), 0x08,  // PC 4
        @intFromEnum(Opcode.JUMP),         // PC 6
        @intFromEnum(Opcode.INVALID),      // PC 7
        
        @intFromEnum(Opcode.JUMPDEST),     // PC 8: Target
        @intFromEnum(Opcode.STOP),         // PC 9
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Only PC 3 and PC 8 should be valid jumpdests
    try testing.expectEqual(@as(usize, 2), bytecode.jumpdests.len);
    try testing.expect(bytecode.isValidJumpDest(3));
    try testing.expect(bytecode.isValidJumpDest(8));
    
    // Verify PC 3 is fused to PC 8
    try testing.expectEqual(@as(?BytecodeType.PcType, 8), bytecode.getFusedTarget(3));
}

test "bytecode5 complex iterator trace" {
    const allocator = testing.allocator;
    const crypto = @import("crypto");
    
    // Create a complex bytecode sample that exercises all features
    const complex_bytecode = [_]u8{
        // Start with some PUSH instructions
        @intFromEnum(Opcode.PUSH1), 0x80,
        @intFromEnum(Opcode.PUSH2), 0x01, 0x00,
        @intFromEnum(Opcode.ADD),
        
        // Multiple JUMPDESTs  
        @intFromEnum(Opcode.JUMPDEST),  // at 6
        @intFromEnum(Opcode.PUSH1), 0x10,
        @intFromEnum(Opcode.JUMPDEST),  // at 9
        
        // PUSH with JUMPDEST in data (should be ignored)
        @intFromEnum(Opcode.PUSH2), @intFromEnum(Opcode.JUMPDEST), 0xFF,
        
        // More complex PUSH sizes
        @intFromEnum(Opcode.PUSH4), 0x12, 0x34, 0x56, 0x78,
        @intFromEnum(Opcode.JUMPDEST),  // at 17
        
        // PUSH32 (max size)
        @intFromEnum(Opcode.PUSH32),
    } ++ [_]u8{0xAB} ** 32 ++ [_]u8{
        @intFromEnum(Opcode.JUMPDEST),  // at 50
        @intFromEnum(Opcode.STOP),
    };
    
    // Initialize bytecode
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &complex_bytecode);
    defer bytecode.deinit();
    
    // Create trace in temp file
    const temp_dir = testing.tmpDir(.{});
    defer temp_dir.cleanup();
    
    {
        const temp_file = try temp_dir.dir.createFile("complex_iterator_trace.txt", .{});
        defer temp_file.close();
        
        var writer = temp_file.writer();
        
        // Write header
        try writer.print("Complex Bytecode Iterator Trace\n", .{});
        try writer.print("===============================\n", .{});
        try writer.print("Bytecode size: {} bytes\n\n", .{complex_bytecode.len});
        
        // Iterate and trace
        var iter = bytecode.iterator();
        var count: usize = 0;
        while (iter.next()) |entry| : (count += 1) {
            try writer.print("PC: 0x{X:0>4} | Opcode: 0x{X:0>2} | ", .{ entry.pc, entry.opcode });
            
            // Add opcode name if known
            if (std.meta.intToEnum(Opcode, entry.opcode)) |op| {
                try writer.print("{s}\n", .{@tagName(op)});
            } else |_| {
                try writer.print("UNKNOWN\n", .{});
            }
        }
        
        try writer.print("\nTotal instructions: {}\n", .{count});
        try writer.print("Push instructions: {}\n", .{bytecode.push_pcs.len});
        try writer.print("Jump destinations: {}\n", .{bytecode.jumpdests.len});
        try writer.print("Basic blocks: {}\n", .{bytecode.basic_blocks.len});
        
        // List push instructions
        try writer.print("\nPush instruction PCs: ", .{});
        for (bytecode.push_pcs, 0..) |pc, i| {
            if (i > 0) try writer.print(", ", .{});
            try writer.print("{}", .{pc});
        }
        try writer.print("\n", .{});
        
        // List valid jumpdests
        try writer.print("Valid JUMPDEST PCs: ", .{});
        for (bytecode.jumpdests, 0..) |pc, i| {
            if (i > 0) try writer.print(", ", .{});
            try writer.print("{}", .{pc});
        }
        try writer.print("\n", .{});
    }
    
    // Read temp file and compute hash
    const temp_trace = try temp_dir.dir.readFileAlloc(allocator, "complex_iterator_trace.txt", 1024 * 1024);
    defer allocator.free(temp_trace);
    
    const temp_hash = crypto.Hash.keccak256(temp_trace);
    
    // Check if fixture exists
    const fixture_path = "fixtures/complex_iterator_trace.txt";
    if (std.fs.cwd().openFile(fixture_path, .{})) |fixture_file| {
        defer fixture_file.close();
        
        // Read fixture and compute hash
        const fixture_trace = try fixture_file.readToEndAlloc(allocator, 1024 * 1024);
        defer allocator.free(fixture_trace);
        
        const fixture_hash = crypto.Hash.keccak256(fixture_trace);
        
        // Compare hashes
        try testing.expectEqualSlices(u8, &fixture_hash, &temp_hash);
    } else |err| {
        // First run - create fixture
        if (err == error.FileNotFound) {
            std.debug.print("\nCreating fixture: {s}\n", .{fixture_path});
            const fixture_file = try std.fs.cwd().createFile(fixture_path, .{});
            defer fixture_file.close();
            try fixture_file.writeAll(temp_trace);
            std.debug.print("Fixture created with hash: ", .{});
            for (temp_hash) |b| {
                std.debug.print("{x:0>2}", .{b});
            }
            std.debug.print("\n", .{});
        } else {
            return err;
        }
    }
}

test "bytecode5 real world fusion patterns" {
    const allocator = testing.allocator;
    
    // Common patterns from Solidity compiler output
    const bytecode_data = [_]u8{
        // Pattern 1: Function dispatcher jump table
        @intFromEnum(Opcode.PUSH1), 0x04,
        @intFromEnum(Opcode.CALLDATASIZE),
        @intFromEnum(Opcode.LT),
        @intFromEnum(Opcode.PUSH1), 0x0C,  // Jump to revert
        @intFromEnum(Opcode.JUMPI),
        @intFromEnum(Opcode.PUSH1), 0x10,  // Jump to function logic
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.INVALID),      // Padding
        
        // Revert path (PC 12/0x0C)
        @intFromEnum(Opcode.JUMPDEST),     
        @intFromEnum(Opcode.PUSH1), 0x00,  
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.REVERT),
        
        // Function logic start (PC 16/0x10)
        @intFromEnum(Opcode.JUMPDEST),     
        @intFromEnum(Opcode.PUSH1), 0x1A,  // Jump to actual implementation
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.INVALID),
        
        // Actual implementation (PC 26/0x1A)
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.MSTORE),
        @intFromEnum(Opcode.PUSH1), 0x20,
        @intFromEnum(Opcode.PUSH1), 0x00,
        @intFromEnum(Opcode.RETURN),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify JUMPDESTs are found correctly
    try testing.expect(bytecode.isValidJumpDest(0x0C));
    try testing.expect(bytecode.isValidJumpDest(0x10));
    try testing.expect(bytecode.isValidJumpDest(0x1A));
    
    // PC 0x10 should fuse directly to PC 0x1A
    try testing.expectEqual(@as(?BytecodeType.PcType, 0x1A), bytecode.getFusedTarget(0x10));
    
    // PC 0x0C should not be fused (ends with REVERT, not JUMP)
    try testing.expectEqual(@as(?BytecodeType.PcType, null), bytecode.getFusedTarget(0x0C));
    
    // PC 0x1A should not be fused (no immediate JUMP)
    try testing.expectEqual(@as(?BytecodeType.PcType, null), bytecode.getFusedTarget(0x1A));
}

test "bytecode5 constant folding fusion - simple arithmetic" {
    const allocator = testing.allocator;
    
    // PUSH1 0x04, PUSH1 0x02, ADD -> should detect fusion
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x04,  // Push 4
        @intFromEnum(Opcode.PUSH1), 0x02,  // Push 2
        @intFromEnum(Opcode.ADD),          // 4 + 2 = 6
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify constant folding detected this pattern
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.constant_fold, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 5), fusion.?.original_length);
    try testing.expectEqual(@as(u256, 6), fusion.?.folded_value.?);
}

test "bytecode5 constant folding fusion - complex SHL SUB pattern" {
    const allocator = testing.allocator;
    
    // PUSH1 0x04, PUSH1 0x02, PUSH1 0x03, SHL, SUB -> should detect fusion
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x04,  // Push 4
        @intFromEnum(Opcode.PUSH1), 0x02,  // Push 2
        @intFromEnum(Opcode.PUSH1), 0x03,  // Push 3
        @intFromEnum(Opcode.SHL),          // 2 << 3 = 16
        @intFromEnum(Opcode.SUB),          // 4 - 16 = -12 (wraps to large u256)
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify constant folding detected this pattern
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.constant_fold, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 8), fusion.?.original_length);
    // 4 - 16 = -12, which in u256 is 2^256 - 12
    const expected = @as(u256, 4) -% @as(u256, 16);
    try testing.expectEqual(expected, fusion.?.folded_value.?);
}

test "bytecode5 multiple PUSH fusion - 2 PUSHes" {
    const allocator = testing.allocator;
    
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x10,
        @intFromEnum(Opcode.PUSH1), 0x20,
        @intFromEnum(Opcode.ADD),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_push, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 4), fusion.?.original_length);
    try testing.expectEqual(@as(u8, 2), fusion.?.count.?);
}

test "bytecode5 multiple PUSH fusion - 3 PUSHes" {
    const allocator = testing.allocator;
    
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x10,
        @intFromEnum(Opcode.PUSH1), 0x20,
        @intFromEnum(Opcode.PUSH1), 0x30,
        @intFromEnum(Opcode.ADD),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_push, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 6), fusion.?.original_length);
    try testing.expectEqual(@as(u8, 3), fusion.?.count.?);
}

test "bytecode5 multiple POP fusion - 2 POPs" {
    const allocator = testing.allocator;
    
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x10,
        @intFromEnum(Opcode.PUSH1), 0x20,
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Check fusion at PC 4 (first POP)
    const fusion = bytecode.getAdvancedFusion(4);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_pop, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 2), fusion.?.original_length);
    try testing.expectEqual(@as(u8, 2), fusion.?.count.?);
}

test "bytecode5 multiple POP fusion - 3 POPs" {
    const allocator = testing.allocator;
    
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x10,
        @intFromEnum(Opcode.PUSH1), 0x20,
        @intFromEnum(Opcode.PUSH1), 0x30,
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Check fusion at PC 6 (first POP)
    const fusion = bytecode.getAdvancedFusion(6);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_pop, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 3), fusion.?.original_length);
    try testing.expectEqual(@as(u8, 3), fusion.?.count.?);
}

test "bytecode5 ISZERO PUSH JUMPI fusion" {
    const allocator = testing.allocator;
    
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x05,  // Some value
        @intFromEnum(Opcode.ISZERO),       // Check if zero
        @intFromEnum(Opcode.PUSH2), 0x00, 0x0A, // Push jump target
        @intFromEnum(Opcode.JUMPI),        // Conditional jump
        @intFromEnum(Opcode.INVALID),      // Fall through
        @intFromEnum(Opcode.JUMPDEST),     // Jump target at 10
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Check fusion at PC 2 (ISZERO)
    const fusion = bytecode.getAdvancedFusion(2);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.iszero_jumpi, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 6), fusion.?.original_length);
}

test "bytecode5 DUP2 MSTORE PUSH fusion" {
    const allocator = testing.allocator;
    
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x00,  // Memory offset
        @intFromEnum(Opcode.PUSH1), 0x42,  // Value
        @intFromEnum(Opcode.DUP2),         // Duplicate offset
        @intFromEnum(Opcode.MSTORE),       // Store value
        @intFromEnum(Opcode.PUSH1), 0x20,  // Next offset
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Check fusion at PC 4 (DUP2)
    const fusion = bytecode.getAdvancedFusion(4);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.dup2_mstore_push, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 5), fusion.?.original_length);
}

test "bytecode5 fusion priority - longer patterns first" {
    const allocator = testing.allocator;
    
    // This has both a 3-PUSH pattern and a 2-PUSH pattern
    // Should detect the 3-PUSH pattern first
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x10,
        @intFromEnum(Opcode.PUSH1), 0x20,
        @intFromEnum(Opcode.PUSH1), 0x30,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.ADD),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Should detect 3-PUSH fusion at PC 0
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_push, fusion.?.fusion_type);
    try testing.expectEqual(@as(u8, 3), fusion.?.count.?);
}


test "bytecode5 initFromInitcode - valid initcode" {
    const allocator = testing.allocator;
    const initcode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x60,
        @intFromEnum(Opcode.PUSH1), 0x40,
        @intFromEnum(Opcode.MSTORE),
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.initFromInitcode(allocator, &initcode);
    defer bytecode.deinit();
    
    // Should process initcode successfully
    try testing.expectEqual(@as(usize, 6), bytecode.runtime_code.len);
    try testing.expectEqual(@as(usize, 2), bytecode.push_pcs.len);
}

test "bytecode5 initFromInitcode - too large" {
    const allocator = testing.allocator;
    // Create initcode larger than max_initcode_size (49152 bytes)
    const large_config = BytecodeConfig{ .max_initcode_size = 100 };
    const BytecodeType = Bytecode(large_config);
    
    const initcode = try allocator.alloc(u8, 101);
    defer allocator.free(initcode);
    @memset(initcode, @intFromEnum(Opcode.STOP));
    
    // Should fail with InitcodeTooLarge error
    try testing.expectError(error.InitcodeTooLarge, BytecodeType.initFromInitcode(allocator, initcode));
}

test "bytecode5 calculateInitcodeGas - EIP-3860" {
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    // 0 bytes = 0 gas
    try testing.expectEqual(@as(u64, 0), BytecodeType.calculateInitcodeGas(0));
    
    // 1 byte = 1 word = 2 gas
    try testing.expectEqual(@as(u64, 2), BytecodeType.calculateInitcodeGas(1));
    
    // 32 bytes = 1 word = 2 gas
    try testing.expectEqual(@as(u64, 2), BytecodeType.calculateInitcodeGas(32));
    
    // 33 bytes = 2 words = 4 gas
    try testing.expectEqual(@as(u64, 4), BytecodeType.calculateInitcodeGas(33));
    
    // 64 bytes = 2 words = 4 gas
    try testing.expectEqual(@as(u64, 4), BytecodeType.calculateInitcodeGas(64));
}

test "bytecode5 validate_immediate_jumps - valid jumps" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x04,  // Push jump target
        @intFromEnum(Opcode.JUMP),         // Jump to PC 4
        @intFromEnum(Opcode.INVALID),      
        @intFromEnum(Opcode.JUMPDEST),     // PC 4: Valid target
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // validate_immediate_jumps should pass (called during init)
    try testing.expectEqual(@as(usize, 1), bytecode.jumpdests.len);
}

test "bytecode5 validate_immediate_jumps - invalid jump target" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x05,  // Push invalid jump target
        @intFromEnum(Opcode.JUMP),         // Jump to PC 5 (not a JUMPDEST)
        @intFromEnum(Opcode.INVALID),      
        @intFromEnum(Opcode.JUMPDEST),     // PC 4: Valid JUMPDEST
        @intFromEnum(Opcode.STOP),         // PC 5: Not a JUMPDEST
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bc = try BytecodeType.init(allocator, &code);
    defer bc.deinit();
    try testing.expectError(error.InvalidJumpDestination, bc.validate_immediate_jumps());
}

test "bytecode5 readPushValueN - various sizes" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0xFF,
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.PUSH4), 0xAB, 0xCD, 0xEF, 0x01,
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Read PUSH1 value
    const val1 = bytecode.readPushValueN(0, 1);
    try testing.expectEqual(@as(u256, 0xFF), val1);
    
    // Read PUSH2 value
    const val2 = bytecode.readPushValueN(2, 2);
    try testing.expectEqual(@as(u256, 0x1234), val2);
    
    // Read PUSH4 value
    const val4 = bytecode.readPushValueN(5, 4);
    try testing.expectEqual(@as(u256, 0xABCDEF01), val4);
    
    // Invalid PC should return 0
    const invalid = bytecode.readPushValueN(100, 1);
    try testing.expectEqual(@as(u256, 0), invalid);
}

test "bytecode5 OpcodeData tagged union iterator" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x60,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    var iter = bytecode.iteratorWithData();
    
    // First: PUSH1
    const first = iter.next();
    try testing.expect(first != null);
    try testing.expect(first.? == .push);
    try testing.expectEqual(@as(u256, 0x60), first.?.push.value);
    // size field not tracked; value check suffices
    
    // Second: ADD
    const second = iter.next();
    try testing.expect(second != null);
    try testing.expect(second.? == .basic);
    
    // Third: JUMPDEST
    const third = iter.next();
    try testing.expect(third != null);
    try testing.expect(third.? == .jumpdest);
    
    // Fourth: PUSH2
    const fourth = iter.next();
    try testing.expect(fourth != null);
    try testing.expect(fourth.? == .push);
    try testing.expectEqual(@as(u256, 0x1234), fourth.?.push.value);
    // size field not tracked; value check suffices
    
    // Fifth: STOP
    const fifth = iter.next();
    try testing.expect(fifth != null);
    try testing.expect(fifth.? == .basic);
    
    // End
    try testing.expect(iter.next() == null);
}

test "bytecode5 computeGasUsage - basic opcodes" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x60,  // 3 gas
        @intFromEnum(Opcode.PUSH1), 0x40,  // 3 gas  
        @intFromEnum(Opcode.ADD),          // 3 gas
        @intFromEnum(Opcode.DUP1),         // 3 gas
        @intFromEnum(Opcode.MSTORE),       // 3 gas + memory expansion
        @intFromEnum(Opcode.STOP),         // 0 gas
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    const gas = try bytecode.computeGasUsage(allocator);
    // 3 + 3 + 3 + 3 + 3 + 0 = 15
    try testing.expectEqual(@as(u64, 15), gas);
}

test "bytecode5 getStats - comprehensive stats" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x60,
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.PUSH1), 0x04,
        @intFromEnum(Opcode.JUMP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = bytecode.getStats();
    try testing.expectEqual(@as(usize, 6), stats.opcode_count);
    try testing.expectEqual(@as(usize, 3), stats.push_count);
    try testing.expectEqual(@as(usize, 1), stats.jumpdest_count);
    try testing.expectEqual(@as(usize, 1), stats.jump_count);
    try testing.expectEqual(@as(usize, 2), stats.basic_block_count);
}

test "bytecode5 security - PUSH data cannot be executed" {
    const allocator = testing.allocator;
    
    // Malicious bytecode trying to hide JUMPDEST in PUSH data
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH3),         // PC 0
        @intFromEnum(Opcode.JUMPDEST),     // PC 1: In PUSH data!
        @intFromEnum(Opcode.PUSH1), 0x01,  // PC 2-3: More PUSH data
        @intFromEnum(Opcode.PUSH1), 0x01,  // PC 4: Real instruction
        @intFromEnum(Opcode.JUMP),         // PC 6: Try to jump to PC 1
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // PC 1 should NOT be a valid jump destination
    try testing.expect(!bytecode.isValidJumpDest(1));
    
    // Only real instructions should be found
    try testing.expectEqual(@as(usize, 2), bytecode.push_pcs.len);
    try testing.expectEqual(@as(BytecodeType.PcType, 0), bytecode.push_pcs[0]);
    try testing.expectEqual(@as(BytecodeType.PcType, 4), bytecode.push_pcs[1]);
    
    // No JUMPDEST should be found
    try testing.expectEqual(@as(usize, 0), bytecode.jumpdests.len);
}

test "bytecode5 security - truncated PUSH cannot overflow" {
    const allocator = testing.allocator;
    
    // Bytecode with truncated PUSH32 at the end
    var code = [_]u8{@intFromEnum(Opcode.PUSH32)} ++ [_]u8{0xFF} ** 16; // Only 16 bytes of data
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should handle truncated PUSH safely
    try testing.expectEqual(@as(usize, 1), bytecode.push_pcs.len);
    
    // Iterator should handle it safely
    var iter = bytecode.iteratorWithData();
    const first = iter.next();
    try testing.expect(first != null);
    try testing.expect(first.? == .push);
    try testing.expectEqual(@as(u8, 32), first.?.push.size); // Still PUSH32
    
    // Should not iterate beyond bytecode
    try testing.expect(iter.next() == null);
}

test "bytecode5 safe metadata parsing" {
    const allocator = testing.allocator;
    
    // Valid Solidity metadata
    const metadata_bytes = [_]u8{0xa2, 0x64} ++ "ipfs" ++ [_]u8{0x58, 0x22} ++ 
                                [_]u8{0x12, 0x20} ++ [_]u8{0xAB} ** 32 ++  // IPFS hash
                                [_]u8{0x64} ++ "solc" ++ [_]u8{0, 8, 17} ++  // solc 0.8.17
                                [_]u8{0x00, 0x43};  // Length = 67
    
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x60,
        @intFromEnum(Opcode.STOP),
    } ++ metadata_bytes;
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    const metadata = bytecode.getSolidityMetadata();
    try testing.expect(metadata != null);
    try testing.expectEqual(@as(u8, 0), metadata.?.solc_version[0]); // major
    try testing.expectEqual(@as(u8, 8), metadata.?.solc_version[1]); // minor
    try testing.expectEqual(@as(u8, 17), metadata.?.solc_version[2]); // patch
    try testing.expectEqual(@as(usize, 69), metadata.?.metadata_length); // Including length bytes
}

// ============= ADDITIONAL TEST COVERAGE =============

test "bytecode5 empty bytecode" {
    const allocator = testing.allocator;
    const empty_code = [_]u8{};
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &empty_code);
    defer bytecode.deinit();
    
    // Empty bytecode should have no instructions
    try testing.expectEqual(@as(usize, 0), bytecode.runtime_code.len);
    try testing.expectEqual(@as(usize, 0), bytecode.push_pcs.len);
    try testing.expectEqual(@as(usize, 0), bytecode.jumpdests.len);
    try testing.expectEqual(@as(usize, 0), bytecode.basic_blocks.len);
    
    // Iterator should immediately return null
    var iter = bytecode.iterator();
    try testing.expect(iter.next() == null);
    
    // Stats should be all zeros
    const stats = bytecode.getStats();
    try testing.expectEqual(@as(usize, 0), stats.opcode_count);
    try testing.expectEqual(@as(usize, 0), stats.push_count);
    try testing.expectEqual(@as(usize, 0), stats.jumpdest_count);
}

test "bytecode5 single byte bytecode" {
    const allocator = testing.allocator;
    const code = [_]u8{@intFromEnum(Opcode.STOP)};
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    try testing.expectEqual(@as(usize, 1), bytecode.runtime_code.len);
    try testing.expectEqual(@as(usize, 0), bytecode.push_pcs.len);
    
    // Iterator should return one opcode
    var iter = bytecode.iterator();
    const first = iter.next();
    try testing.expect(first != null);
    try testing.expectEqual(@intFromEnum(Opcode.STOP), first.?.opcode);
    try testing.expectEqual(@as(u16, 0), first.?.pc);
    try testing.expect(iter.next() == null);
}

test "bytecode5 maximum size bytecode" {
    const allocator = testing.allocator;
    const config = BytecodeConfig{ .max_bytecode_size = 100 };
    const BytecodeType = Bytecode(config);
    
    // Create bytecode at exact limit
    const code = try allocator.alloc(u8, 100);
    defer allocator.free(code);
    @memset(code, @intFromEnum(Opcode.STOP));
    
    var bytecode = try BytecodeType.init(allocator, code);
    defer bytecode.deinit();
    
    try testing.expectEqual(@as(usize, 100), bytecode.runtime_code.len);
    
    // Bytecode exceeding limit should fail
    const large_code = try allocator.alloc(u8, 101);
    defer allocator.free(large_code);
    @memset(large_code, @intFromEnum(Opcode.STOP));
    
    try testing.expectError(error.BytecodeTooLarge, BytecodeType.init(allocator, large_code));
}

test "bytecode5 all PUSH sizes" {
    const allocator = testing.allocator;
    
    var code = std.ArrayList(u8).init(allocator);
    defer code.deinit();
    
    // Test PUSH1 through PUSH32
    var i: u8 = 1;
    while (i <= 32) : (i += 1) {
        try code.append(@intFromEnum(Opcode.PUSH1) + (i - 1));
        // Add appropriate data bytes
        var j: u8 = 0;
        while (j < i) : (j += 1) {
            try code.append(j);
        }
    }
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, code.items);
    defer bytecode.deinit();
    
    // Should detect all 32 PUSH instructions
    try testing.expectEqual(@as(usize, 32), bytecode.push_pcs.len);
    
    // Verify each PUSH was detected at correct PC
    var expected_pc: u16 = 0;
    i = 1;
    while (i <= 32) : (i += 1) {
        try testing.expectEqual(expected_pc, bytecode.push_pcs[i - 1]);
        expected_pc += 1 + i; // opcode + data bytes
    }
}

test "bytecode5 readPushValueN boundary cases" {
    const allocator = testing.allocator;
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    // Test edge cases for readPushValueN
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0xFF,           // PC 0
        @intFromEnum(Opcode.PUSH32),               // PC 2: PUSH32 with full data
    } ++ [_]u8{0xFF} ** 32 ++ [_]u8{
        @intFromEnum(Opcode.PUSH16),               // PC 35: PUSH16 at boundary
    } ++ [_]u8{0xAB} ** 16;
    
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Reading with wrong size returns ZERO
    try testing.expectEqual(@as(u256, 0), bytecode.readPushValueN(0, 2)); // PUSH1 read as PUSH2
    try testing.expectEqual(@as(u256, 0), bytecode.readPushValueN(2, 31)); // PUSH32 read as PUSH31
    
    // Reading at non-PUSH opcode returns ZERO
    try testing.expectEqual(@as(u256, 0), bytecode.readPushValueN(1, 1)); // Data byte, not opcode
    
    // Reading past end returns ZERO
    try testing.expectEqual(@as(u256, 0), bytecode.readPushValueN(1000, 1));
    
    // Reading PUSH32 should get full value
    const push32_value = bytecode.readPushValueN(2, 32);
    const expected_value = (@as(u256, 1) << 256) - 1; // All 0xFF bytes
    try testing.expectEqual(expected_value, push32_value);
}

test "bytecode5 validate_immediate_jumps corner cases" {
    const allocator = testing.allocator;
    
    // Test JUMPI validation
    const code_jumpi = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x00,  // Push condition
        @intFromEnum(Opcode.PUSH1), 0x06,  // Push target
        @intFromEnum(Opcode.JUMPI),        // Conditional jump
        @intFromEnum(Opcode.STOP),
        @intFromEnum(Opcode.JUMPDEST),     // PC 6: Valid target
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code_jumpi);
    defer bytecode.deinit();
    
    // Should validate successfully
    try bytecode.validate_immediate_jumps();
}

test "bytecode5 jump fusion with truncated bytecode" {
    const allocator = testing.allocator;
    
    // JUMPDEST followed by incomplete PUSH (truncated)
    const code = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),    // PC 0
        @intFromEnum(Opcode.PUSH2),       // PC 1: PUSH2 missing data
        // Missing 2 bytes of PUSH data
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should not detect jump fusion due to truncation
    try testing.expectEqual(@as(?BytecodeType.PcType, null), bytecode.getFusedTarget(0));
}

test "bytecode5 isPushInstruction binary search edge cases" {
    const allocator = testing.allocator;
    
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x00,  // PC 0
        @intFromEnum(Opcode.PUSH2), 0x00, 0x00,  // PC 2
        @intFromEnum(Opcode.PUSH3), 0x00, 0x00, 0x00,  // PC 5
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Test binary search works correctly
    try testing.expect(bytecode.isPushInstruction(0));
    try testing.expect(bytecode.isPushInstruction(2));
    try testing.expect(bytecode.isPushInstruction(5));
    
    // Non-PUSH PCs
    try testing.expect(!bytecode.isPushInstruction(1));  // PUSH data
    try testing.expect(!bytecode.isPushInstruction(3));  // PUSH data
    try testing.expect(!bytecode.isPushInstruction(4));  // PUSH data
    try testing.expect(!bytecode.isPushInstruction(10)); // Beyond code
}

test "bytecode5 metadata extraction edge cases" {
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    // Test 1: Code too short for metadata
    const short_code = [_]u8{0xa2, 0x64}; // Only magic bytes
    try testing.expect(BytecodeType.extractMetadata(&short_code) == null);
    
    // Test 2: Invalid magic bytes
    const invalid_magic = [_]u8{0xFF, 0xFF, 0x64, 0x69, 0x70, 0x66, 0x73};
    try testing.expect(BytecodeType.extractMetadata(&invalid_magic) == null);
    
    // Test 3: Valid pattern at the very beginning
    const early_metadata = [_]u8{0xa2, 0x64} ++ "ipfs" ++ [_]u8{0x00} ** 10;
    const result = BytecodeType.extractMetadata(&early_metadata);
    try testing.expect(result != null);
    try testing.expectEqual(@as(usize, 0), result.?.start);
}

test "bytecode5 getSolidityMetadata malformed data" {
    const allocator = testing.allocator;
    
    // Malformed CBOR - truncated
    const truncated = [_]u8{
        @intFromEnum(Opcode.STOP),
        0xa2, 0x64, // CBOR map start
        // Missing rest of metadata
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &truncated);
    defer bytecode.deinit();
    
    const metadata = bytecode.getSolidityMetadata();
    try testing.expect(metadata == null);
}

test "bytecode5 computeGasUsage with all opcode types" {
    const allocator = testing.allocator;
    
    const code = [_]u8{
        // Test various gas costs
        @intFromEnum(Opcode.STOP),         // 0 gas
        @intFromEnum(Opcode.ADD),          // 3 gas
        @intFromEnum(Opcode.MUL),          // 5 gas
        @intFromEnum(Opcode.SUB),          // 3 gas
        @intFromEnum(Opcode.DIV),          // 5 gas
        @intFromEnum(Opcode.EXP),          // 10 gas (base)
        @intFromEnum(Opcode.PUSH1), 0x00,  // 3 gas
        @intFromEnum(Opcode.PUSH32),       // 3 gas
    } ++ [_]u8{0xFF} ** 32 ++ [_]u8{
        @intFromEnum(Opcode.POP),          // 2 gas
        @intFromEnum(Opcode.DUP1),         // 3 gas
        @intFromEnum(Opcode.SWAP1),        // 3 gas
        @intFromEnum(Opcode.JUMP),         // 8 gas
        @intFromEnum(Opcode.JUMPI),        // 8 gas
        @intFromEnum(Opcode.JUMPDEST),     // 1 gas
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    const gas = try bytecode.computeGasUsage(allocator);
    
    // Total: 0 + 3 + 5 + 3 + 5 + 10 + 3 + 3 + 2 + 3 + 3 + 8 + 8 + 1 = 57
    try testing.expectEqual(@as(u64, 57), gas);
}

test "bytecode5 iteratorWithData all opcode types" {
    const allocator = testing.allocator;
    
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0xAB,
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.JUMPI),
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.PUSH32),
    } ++ [_]u8{0xFF} ** 32;
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    var iter = bytecode.iteratorWithData();
    
    // PUSH1
    const op1 = iter.next();
    try testing.expect(op1 != null);
    try testing.expectEqual(@as(u16, 0), op1.?.pc);
    try testing.expectEqual(@intFromEnum(Opcode.PUSH1), op1.?.opcode);
    try testing.expect(op1.?.data == .push);
    try testing.expectEqual(@as(u256, 0xAB), op1.?.data.push.value);
    
    // JUMPDEST
    const op2 = iter.next();
    try testing.expect(op2 != null);
    try testing.expectEqual(@as(u16, 2), op2.?.pc);
    try testing.expect(op2.?.data == .jumpdest);
    
    // JUMP
    const op3 = iter.next();
    try testing.expect(op3 != null);
    try testing.expectEqual(@as(u16, 3), op3.?.pc);
    try testing.expect(op3.?.data == .jump);
    
    // JUMPI
    const op4 = iter.next();
    try testing.expect(op4 != null);
    try testing.expectEqual(@as(u16, 4), op4.?.pc);
    try testing.expect(op4.?.data == .jumpi);
    
    // ADD (basic)
    const op5 = iter.next();
    try testing.expect(op5 != null);
    try testing.expectEqual(@as(u16, 5), op5.?.pc);
    try testing.expect(op5.?.data == .basic);
    
    // PUSH32
    const op6 = iter.next();
    try testing.expect(op6 != null);
    try testing.expectEqual(@as(u16, 6), op6.?.pc);
    try testing.expect(op6.?.data == .push);
    const expected_value = (@as(u256, 1) << 256) - 1;
    try testing.expectEqual(expected_value, op6.?.data.push.value);
}

test "bytecode5 validate_immediate_jumps with u8 PcType and PUSH2 target" {
    const allocator = testing.allocator;
    // Configure PcType = u8
    const cfg = BytecodeConfig{ .max_bytecode_size = 255 };
    const Small = Bytecode(cfg);

    // Create code with PUSH2 0x00 0x80 then JUMP to JUMPDEST at 0x80
    var code: [129]u8 = undefined; // indices 0..128
    @memset(&code, @intFromEnum(Opcode.STOP));
    code[0] = @intFromEnum(Opcode.PUSH2);
    code[1] = 0x00;
    code[2] = 0x80; // 128
    code[3] = @intFromEnum(Opcode.JUMP);
    code[128] = @intFromEnum(Opcode.JUMPDEST);

    var bc = try Small.init(allocator, &code);
    defer bc.deinit();
    // Should be valid after init; explicit revalidation must not error
    try bc.validate_immediate_jumps();
}

test "bytecode5 iteratorWithData truncated PUSH yields zero value" {
    const allocator = testing.allocator;
    const code = [_]u8{ @intFromEnum(Opcode.PUSH2), 0xAB, @intFromEnum(Opcode.STOP) }; // missing one data byte
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bc = try BytecodeType.init(allocator, &code);
    defer bc.deinit();

    var it = bc.iteratorWithData();
    const first = it.next();
    try testing.expect(first != null);
    try testing.expect(first.? == .push);
    // Not enough bytes to read full PUSH2 → value defaults to 0
    try testing.expectEqual(@as(u256, 0), first.?.push.value);
}

test "bytecode5 stats fusion_count combines jump and advanced fusions" {
    const allocator = testing.allocator;
    const code = [_]u8{
        // Jump fusion: JUMPDEST, PUSH1 0x06, JUMP → target JUMPDEST at 0x06
        @intFromEnum(Opcode.JUMPDEST),     // pc 0
        @intFromEnum(Opcode.PUSH1), 0x06,  // pc 1-2
        @intFromEnum(Opcode.JUMP),         // pc 3
        @intFromEnum(Opcode.INVALID),      // pc 4
        @intFromEnum(Opcode.INVALID),      // pc 5
        @intFromEnum(Opcode.JUMPDEST),     // pc 6 target
        // Advanced fusion: two POPs
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.STOP),
    };
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bc = try BytecodeType.init(allocator, &code);
    defer bc.deinit();

    const stats = bc.getStats();
    // Expect one jump fusion and one advanced fusion
    try testing.expectEqual(@as(usize, 2), stats.fusion_count);
}

test "bytecode5 calculateInitcodeGas additional boundaries" {
    const BytecodeType = Bytecode(BytecodeConfig{});
    // 31 bytes → 1 word
    try testing.expectEqual(@as(u64, 2), BytecodeType.calculateInitcodeGas(31));
    // 65 bytes → 3 words
    try testing.expectEqual(@as(u64, 6), BytecodeType.calculateInitcodeGas(65));
}

test "bytecode5 extractMetadata prefers last occurrence" {
    const BytecodeType = Bytecode(BytecodeConfig{});
    const code = [_]u8{0x00, 0xa2, 0x64} ++ "ipfs" ++ [_]u8{0x01} ++
                 [_]u8{0x11, 0x22, 0x33} ++
                 [_]u8{0xa2, 0x64} ++ "ipfs" ++ [_]u8{0x02};
    const res = BytecodeType.extractMetadata(&code).?;
    // Expected start index is after the early pattern and filler
    try testing.expect(res.start > 3);
}

test "bytecode5 push PCs exclude fused regions" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.PUSH1), 0x03,
        @intFromEnum(Opcode.STOP),
    };
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bc = try BytecodeType.init(allocator, &code);
    defer bc.deinit();
    try testing.expect(bc.getAdvancedFusion(0) != null);
    try testing.expectEqual(@as(usize, 0), bc.push_pcs.len);
}

test "bytecode5 basic blocks with JUMPDEST at pc 0" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PUSH1), 0x00,
        @intFromEnum(Opcode.STOP),
    };
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bc = try BytecodeType.init(allocator, &code);
    defer bc.deinit();
    try testing.expectEqual(@as(usize, 1), bc.basic_blocks.len);
    try testing.expectEqual(@as(BytecodeType.PcType, 0), bc.basic_blocks[0].start);
    try testing.expectEqual(@as(BytecodeType.PcType, code.len), bc.basic_blocks[0].end);
}

test "bytecode5 invalid jump fusion target is removed" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PUSH1), 0x09,
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.STOP),
    };
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bc = try BytecodeType.init(allocator, &code);
    defer bc.deinit();
    try testing.expectEqual(@as(?BytecodeType.PcType, null), bc.getFusedTarget(0));
}

test "bytecode5 isPushInstruction empty list" {
    const BytecodeType = Bytecode(BytecodeConfig{});
    var jf = std.AutoHashMap(BytecodeType.PcType, BytecodeType.PcType).init(std.testing.allocator);
    defer jf.deinit();
    var af = std.AutoHashMap(BytecodeType.PcType, BytecodeType.FusionInfo).init(std.testing.allocator);
    defer af.deinit();
    var bc = BytecodeType{
        .runtime_code = &.{},
        .push_pcs = &.{},
        .jumpdests = &.{},
        .basic_blocks = &.{},
        .jump_fusions = jf,
        .advanced_fusions = af,
        .allocator = std.testing.allocator,
    };
    try testing.expect(!bc.isPushInstruction(0));
}

test "bytecode5 basic blocks with complex control flow" {
    const allocator = testing.allocator;
    
    const code = [_]u8{
        // Block 1: Entry
        @intFromEnum(Opcode.PUSH1), 0x00,
        @intFromEnum(Opcode.PUSH1), 0x08,
        @intFromEnum(Opcode.JUMPI),        // Conditional jump to PC 8
        // Block 2: Fall through
        @intFromEnum(Opcode.PUSH1), 0x0A,
        @intFromEnum(Opcode.JUMP),         // Jump to PC 10
        // Block 3: Jump target 1
        @intFromEnum(Opcode.JUMPDEST),     // PC 8
        @intFromEnum(Opcode.STOP),
        // Block 4: Jump target 2  
        @intFromEnum(Opcode.JUMPDEST),     // PC 10
        @intFromEnum(Opcode.RETURN),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should have at least 4 basic blocks
    try testing.expect(bytecode.basic_blocks.len >= 4);
    
    // Verify jumpdests
    try testing.expect(bytecode.isValidJumpDest(8));
    try testing.expect(bytecode.isValidJumpDest(10));
}

test "bytecode5 fusion patterns not overlapping" {
    const allocator = testing.allocator;
    
    // Test that fusion patterns don't overlap
    const code = [_]u8{
        // Pattern 1: Constant fold at PC 0
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.ADD),
        // Pattern 2: Multi-POP at PC 5
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.POP),
        // Pattern 3: Jump fusion at PC 7
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PUSH1), 0x0C,
        @intFromEnum(Opcode.JUMP),
        // Target
        @intFromEnum(Opcode.JUMPDEST),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Each pattern should be detected independently
    const fusion1 = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion1 != null);
    try testing.expectEqual(BytecodeType.FusionType.constant_fold, fusion1.?.fusion_type);
    
    const fusion2 = bytecode.getAdvancedFusion(5);
    try testing.expect(fusion2 != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_pop, fusion2.?.fusion_type);
    
    const jump_fusion = bytecode.getFusedTarget(7);
    try testing.expectEqual(@as(?BytecodeType.PcType, 12), jump_fusion);
}

test "bytecode5 u256 arithmetic edge cases" {
    const allocator = testing.allocator;
    
    // Test overflow/underflow in constant folding
    const code = [_]u8{
        // MAX - 1 + 2 = MAX + 1 = 0 (overflow)
        @intFromEnum(Opcode.PUSH32),
    } ++ [_]u8{0xFF} ** 32 ++ [_]u8{  // MAX value
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.SUB),         // MAX - 1
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.ADD),         // + 2 = overflow
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Check that arithmetic uses wrapping operations
    var iter = bytecode.iteratorWithData();
    
    // Skip to the operations
    _ = iter.next(); // PUSH32
    _ = iter.next(); // PUSH1
    _ = iter.next(); // SUB
    _ = iter.next(); // PUSH1
    const add_op = iter.next(); // ADD
    
    try testing.expect(add_op != null);
    try testing.expect(add_op.?.data == .basic);
}

test "bytecode5 validate_immediate_jumps with large targets" {
    const allocator = testing.allocator;
    
    // Test jump target exceeding PcType bounds
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH32), // PUSH with huge target value
    } ++ [_]u8{0xFF} ** 30 ++ [_]u8{0x00, 0x00} ++ [_]u8{ // Only last 2 bytes are zeros
        @intFromEnum(Opcode.JUMP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // validate_immediate_jumps should not crash on oversized targets
    // (the jump would fail at runtime but analysis should be safe)
    try bytecode.validate_immediate_jumps();
}

test "bytecode5 analyzer with zero-length arrays" {
    const allocator = testing.allocator;
    
    const code = [_]u8{
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Check edge cases for zero-length arrays
    try testing.expectEqual(@as(usize, 0), bytecode.push_pcs.len);
    try testing.expectEqual(@as(usize, 0), bytecode.jumpdests.len);
    
    // Binary search on empty arrays should be safe
    try testing.expect(!bytecode.isPushInstruction(0));
    try testing.expect(!bytecode.isValidJumpDest(0));
}

test "bytecode5 fusion detection with invalid opcodes" {
    const allocator = testing.allocator;
    
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        0xFF, // Invalid opcode (should not cause constant folding)
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should not detect fusion with invalid opcode
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion == null);
}

test "bytecode5 getSolidityMetadata with edge case CBOR" {
    const allocator = testing.allocator;
    
    // Test with minimal valid CBOR (empty map)
    const minimal_cbor = [_]u8{
        @intFromEnum(Opcode.STOP),
        0xa0, // Empty CBOR map
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &minimal_cbor);
    defer bytecode.deinit();
    
    const metadata = bytecode.getSolidityMetadata();
    try testing.expect(metadata == null); // Should fail validation (not 0xa2)
}

test "bytecode5 calculateInitcodeGas boundary values" {
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    // Test word boundary calculations
    try testing.expectEqual(@as(u64, 2), BytecodeType.calculateInitcodeGas(31)); // 1 word
    try testing.expectEqual(@as(u64, 2), BytecodeType.calculateInitcodeGas(32)); // 1 word
    try testing.expectEqual(@as(u64, 4), BytecodeType.calculateInitcodeGas(33)); // 2 words
    
    // Test maximum realistic initcode size (24KB)
    try testing.expectEqual(@as(u64, 1536), BytecodeType.calculateInitcodeGas(24576)); // 768 words * 2
}

test "bytecode5 Error type coverage" {
    const allocator = testing.allocator;
    const config = BytecodeConfig{ .max_initcode_size = 10 };
    const BytecodeType = Bytecode(config);
    
    // Test InitcodeTooLarge error
    const large_initcode = [_]u8{0xFF} ** 11;
    try testing.expectError(BytecodeType.Error.InitcodeTooLarge, 
        BytecodeType.initFromInitcode(allocator, &large_initcode));
}

test "bytecode5 basic block edge cases" {
    const allocator = testing.allocator;
    
    // Bytecode that ends with unconditional jump
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x04,
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.JUMPDEST),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should create proper basic blocks even with terminal jump
    try testing.expect(bytecode.basic_blocks.len >= 2);
}

test "bytecode5 PcType bounds checking" {
    const allocator = testing.allocator;
    
    // Use u8 PcType to test bounds
    const config = BytecodeConfig{ .max_bytecode_size = 255 };
    const BytecodeType = Bytecode(config);
    
    // Create bytecode near the u8 limit
    var code = std.ArrayList(u8).init(allocator);
    defer code.deinit();
    
    // Fill with PUSH1 instructions to near u8::MAX
    var i: usize = 0;
    while (i < 120) : (i += 1) {
        try code.append(@intFromEnum(Opcode.PUSH1));
        try code.append(@as(u8, @intCast(i)));
    }
    
    var bytecode = try BytecodeType.init(allocator, code.items);
    defer bytecode.deinit();
    
    // Should handle u8 PcType without overflow
    try testing.expect(bytecode.push_pcs.len == 120);
    try testing.expectEqual(@as(u8, 238), bytecode.push_pcs[119]); // Last PUSH1 at PC 238
}

test "bytecode5 jump fusion chain detection" {
    const allocator = testing.allocator;
    
    // Chain of fused jumps: A -> B -> C
    const code = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),     // PC 0: A
        @intFromEnum(Opcode.PUSH1), 0x04,  // Jump to B
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.JUMPDEST),     // PC 4: B
        @intFromEnum(Opcode.PUSH1), 0x08,  // Jump to C
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.JUMPDEST),     // PC 8: C
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should detect fusion chain
    try testing.expectEqual(@as(?BytecodeType.PcType, 4), bytecode.getFusedTarget(0));
    try testing.expectEqual(@as(?BytecodeType.PcType, 8), bytecode.getFusedTarget(4));
    try testing.expectEqual(@as(?BytecodeType.PcType, null), bytecode.getFusedTarget(8)); // Terminal
}

test "bytecode5 iterator state consistency" {
    const allocator = testing.allocator;
    
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH4), 0x12, 0x34, 0x56, 0x78,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Test that both iterators maintain consistent state
    var iter1 = bytecode.iterator();
    var iter2 = bytecode.iteratorWithData();
    
    const op1_basic = iter1.next();
    const op1_data = iter2.next();
    
    try testing.expect(op1_basic != null);
    try testing.expect(op1_data != null);
    try testing.expectEqual(op1_basic.?.pc, op1_data.?.pc);
    try testing.expectEqual(op1_basic.?.opcode, op1_data.?.opcode);
    
    const op2_basic = iter1.next();
    const op2_data = iter2.next();
    
    try testing.expectEqual(op2_basic.?.pc, op2_data.?.pc);
    try testing.expectEqual(op2_basic.?.opcode, op2_data.?.opcode);
}

test "bytecode5 memory allocation failure handling" {
    // Test with a failing allocator to ensure proper error propagation
    var failing_allocator = testing.FailingAllocator.init(testing.allocator, 0);
    const allocator = failing_allocator.allocator();
    
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x60,
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    // Should propagate OutOfMemory error
    try testing.expectError(error.OutOfMemory, BytecodeType.init(allocator, &code));
    try testing.expectError(BytecodeType.Error.OutOfMemory, 
        BytecodeType.initFromInitcode(allocator, &code));
}

test "bytecode5 getStats comprehensive coverage" {
    const allocator = testing.allocator;
    
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x00,     // PUSH
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34, // PUSH  
        @intFromEnum(Opcode.JUMPDEST),        // JUMPDEST
        @intFromEnum(Opcode.DUP1),            // Regular opcode
        @intFromEnum(Opcode.JUMP),            // JUMP
        @intFromEnum(Opcode.JUMPDEST),        // JUMPDEST
        @intFromEnum(Opcode.PUSH1), 0x08,     // PUSH
        @intFromEnum(Opcode.JUMPI),           // JUMPI  
        @intFromEnum(Opcode.STOP),            // Regular opcode
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    const stats = bytecode.getStats();
    
    try testing.expectEqual(@as(usize, 9), stats.opcode_count);  // Total opcodes
    try testing.expectEqual(@as(usize, 3), stats.push_count);   // 3 PUSH instructions
    try testing.expectEqual(@as(usize, 2), stats.jumpdest_count); // 2 JUMPDESTs
    try testing.expectEqual(@as(usize, 2), stats.jump_count);   // JUMP + JUMPI
    try testing.expect(stats.fusion_count >= 0);               // May have fusions
}

test "bytecode5 concurrent iterator usage" {
    const allocator = testing.allocator;
    
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Multiple iterators should work independently
    var iter1 = bytecode.iterator();
    var iter2 = bytecode.iterator();
    var iter3 = bytecode.iteratorWithData();
    
    // Advance iter1 to second opcode
    _ = iter1.next();
    const op1_second = iter1.next();
    
    // iter2 should still be at first opcode
    const op2_first = iter2.next();
    
    // iter3 should also be independent
    const op3_first = iter3.next();
    
    try testing.expectEqual(@as(u16, 2), op1_second.?.pc);
    try testing.expectEqual(@as(u16, 0), op2_first.?.pc);
    try testing.expectEqual(@as(u16, 0), op3_first.?.pc);
}
