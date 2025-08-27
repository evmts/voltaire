/// Optimized multi-pass SIMD bytecode analysis
/// 
/// Key improvements:
/// - Only stores runtime code (caller keeps full code)
/// - Metadata extraction on demand via method call
/// - Inline main logic, separate only SIMD/scalar for testing
/// - Iterator abstraction for bytecode traversal
/// - Comprehensive test coverage

const std = @import("std");
const builtin = @import("builtin");
const Opcode = @import("opcode.zig").Opcode;
const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;

// Helper function to check if PC is inside PUSH data
fn isInPushData(pc: anytype, code: []const u8, push_pcs: []const @TypeOf(pc)) bool {
    // Binary search for nearest push before this PC
    var left: usize = 0;
    var right: usize = push_pcs.len;
    
    while (left < right) {
        const mid = (left + right) / 2;
        if (push_pcs[mid] >= pc) {
            right = mid;
        } else {
            left = mid + 1;
        }
    }
    
    // Check previous PUSH instructions
    if (left > 0) {
        const push_pc = push_pcs[left - 1];
        if (push_pc < pc and push_pc < code.len) {
            const push_op = code[push_pc];
            if (push_op >= @intFromEnum(Opcode.PUSH1) and push_op <= @intFromEnum(Opcode.PUSH32)) {
                const push_size = push_op - @intFromEnum(Opcode.PUSH1) + 1;
                // Check if pc falls within the PUSH data range
                if (pc > push_pc and pc <= push_pc + push_size) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Scalar implementation for finding PUSH instructions
fn findPushInstructionsScalar(comptime PcType: type, allocator: std.mem.Allocator, push_list: *std.ArrayList(PcType), code: []const u8) !void {
    var i: PcType = 0;
    while (i < code.len) {
        const op = code[i];
        if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
            try push_list.append(allocator, i);
            const push_size = op - @intFromEnum(Opcode.PUSH1) + 1;
            i += 1 + push_size;
        } else {
            i += 1;
        }
    }
}

// SIMD implementation for finding PUSH instructions
fn findPushInstructionsSimd(comptime L: comptime_int, comptime PcType: type, allocator: std.mem.Allocator, push_list: *std.ArrayList(PcType), code: []const u8) !void {
    // SIMD doesn't handle skipping PUSH data well, so we'll use a hybrid approach:
    // 1. Use SIMD to find candidate PUSH positions
    // 2. Post-process to validate and skip PUSH data
    
    const push1_vec: @Vector(L, u8) = @splat(@intFromEnum(Opcode.PUSH1));
    const push32_vec: @Vector(L, u8) = @splat(@intFromEnum(Opcode.PUSH32));
    
    // First pass: collect all potential PUSH positions using SIMD
    var candidates = std.ArrayList(PcType){};
    defer candidates.deinit(allocator);
    
    var i: usize = 0;
    
    // SIMD scan for full chunks
    while (i + L <= code.len) {
        var bytes: [L]u8 = undefined;
        @memcpy(&bytes, code[i..i + L]);
        const v: @Vector(L, u8) = bytes;
        
        const is_push = (v >= push1_vec) & (v <= push32_vec);
        const is_push_array: [L]bool = is_push;
        
        for (is_push_array, 0..) |is_push_op, j| {
            if (is_push_op) {
                try candidates.append(allocator, @intCast(i + j));
            }
        }
        
        i += L;
    }
    
    // Handle remaining bytes
    while (i < code.len) : (i += 1) {
        const op = code[i];
        if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
            try candidates.append(allocator, @intCast(i));
        }
    }
    
    // Second pass: filter out PUSH instructions that are actually in PUSH data
    i = 0;
    for (candidates.items) |candidate_pc| {
        // Skip candidates that are before our current position (they're in PUSH data)
        if (candidate_pc < i) continue;
        
        // This is a real PUSH instruction
        try push_list.append(allocator, candidate_pc);
        
        // Skip over the PUSH data
        const push_size = code[candidate_pc] - @intFromEnum(Opcode.PUSH1) + 1;
        i = candidate_pc + 1 + push_size;
    }
}

// Scalar implementation for finding JUMPDESTs
fn findJumpdestsScalar(comptime PcType: type, allocator: std.mem.Allocator, jumpdest_list: *std.ArrayList(PcType), code: []const u8, push_pcs: []const PcType) !void {
    var i: PcType = 0;
    while (i < code.len) : (i += 1) {
        if (code[i] == @intFromEnum(Opcode.JUMPDEST)) {
            if (!isInPushData(i, code, push_pcs)) {
                try jumpdest_list.append(allocator, i);
            }
        }
    }
}

// SIMD implementation for finding JUMPDESTs
fn findJumpdestsSimd(comptime L: comptime_int, comptime PcType: type, allocator: std.mem.Allocator, jumpdest_list: *std.ArrayList(PcType), code: []const u8, push_pcs: []const PcType) !void {
    const jumpdest_vec: @Vector(L, u8) = @splat(@intFromEnum(Opcode.JUMPDEST));
    
    var i: usize = 0;
    
    // Process full chunks
    while (i + L <= code.len) {
        var bytes: [L]u8 = undefined;
        @memcpy(&bytes, code[i..i + L]);
        const v: @Vector(L, u8) = bytes;
        
        const is_jumpdest = v == jumpdest_vec;
        const is_jumpdest_array: [L]bool = is_jumpdest;
        
        for (is_jumpdest_array, 0..) |is_jd, j| {
            if (is_jd) {
                const pc: PcType = @intCast(i + j);
                if (!isInPushData(pc, code, push_pcs)) {
                    try jumpdest_list.append(allocator, pc);
                }
            }
        }
        
        i += L;
    }
    
    // Handle remaining bytes with SIMD by processing the last L bytes
    if (i < code.len and code.len >= L) {
        // Back up to process the last L bytes
        i = code.len - L;
        
        var bytes: [L]u8 = undefined;
        @memcpy(&bytes, code[i..i + L]);
        const v: @Vector(L, u8) = bytes;
        
        const is_jumpdest = v == jumpdest_vec;
        const is_jumpdest_array: [L]bool = is_jumpdest;
        
        for (is_jumpdest_array, 0..) |is_jd, j| {
            if (is_jd) {
                const pc: PcType = @intCast(i + j);
                if (!isInPushData(pc, code, push_pcs)) {
                    // Check if we haven't already processed this PC
                    // Since we might overlap with the previous chunk
                    var already_added = false;
                    for (jumpdest_list.items) |existing_pc| {
                        if (existing_pc == pc) {
                            already_added = true;
                            break;
                        }
                    }
                    if (!already_added) {
                        try jumpdest_list.append(allocator, pc);
                    }
                }
            }
        }
    }
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
        
        /// Basic block - just start and end
        pub const BasicBlock = struct {
            start: PcType,
            end: PcType,
        };
        
        pub fn init(allocator: std.mem.Allocator, code: []const u8) !Self {
            // Extract runtime code (for now just use the whole code)
            // TODO: Implement proper metadata stripping
            const runtime_code = code;
            
            // Pass 1: Find PUSH instructions inline
            var push_list = std.ArrayList(PcType){};
            defer push_list.deinit(allocator);
            try push_list.ensureTotalCapacity(allocator, code.len); // Pre-allocate worst case
            
            if (comptime (cfg.vector_length > 1)) {
                if (code.len >= cfg.vector_length) {
                    try findPushInstructionsSimd(cfg.vector_length, PcType, allocator, &push_list, runtime_code);
                } else {
                    try findPushInstructionsScalar(PcType, allocator, &push_list, runtime_code);
                }
            } else {
                try findPushInstructionsScalar(PcType, allocator, &push_list, runtime_code);
            }
            
            const push_pcs = try push_list.toOwnedSlice(allocator);
            errdefer allocator.free(push_pcs);
            
            // Pass 2: Find JUMPDESTs inline
            var jumpdest_list = std.ArrayList(PcType){};
            defer jumpdest_list.deinit(allocator);
            try jumpdest_list.ensureTotalCapacity(allocator, code.len); // Pre-allocate worst case
            
            if (comptime (cfg.vector_length > 1)) {
                if (code.len >= cfg.vector_length) {
                    try findJumpdestsSimd(cfg.vector_length, PcType, allocator, &jumpdest_list, runtime_code, push_pcs);
                } else {
                    try findJumpdestsScalar(PcType, allocator, &jumpdest_list, runtime_code, push_pcs);
                }
            } else {
                try findJumpdestsScalar(PcType, allocator, &jumpdest_list, runtime_code, push_pcs);
            }
            
            const jumpdests = try jumpdest_list.toOwnedSlice(allocator);
            errdefer allocator.free(jumpdests);
            
            // Pass 3: Build basic blocks inline
            var blocks = std.ArrayList(BasicBlock){};
            defer blocks.deinit(allocator);
            try blocks.ensureTotalCapacity(allocator, jumpdests.len + 1); // Pre-allocate
            
            // Entry block starts at 0
            var current_start: PcType = 0;
            
            // Each JUMPDEST starts a new block
            for (jumpdests) |jumpdest| {
                if (jumpdest > current_start) {
                    try blocks.append(allocator, .{
                        .start = current_start,
                        .end = jumpdest,
                    });
                    current_start = jumpdest;
                }
            }
            
            // Final block
            if (current_start < code.len) {
                try blocks.append(allocator, .{
                    .start = current_start,
                    .end = @intCast(code.len),
                });
            }
            
            const basic_blocks = try blocks.toOwnedSlice(allocator);
            errdefer allocator.free(basic_blocks);
            
            var jump_fusions = std.AutoHashMap(PcType, PcType).init(allocator);
            errdefer jump_fusions.deinit();
            
            var advanced_fusions = std.AutoHashMap(PcType, FusionInfo).init(allocator);
            errdefer advanced_fusions.deinit();
            
            var result = Self{
                .runtime_code = runtime_code,
                .push_pcs = push_pcs,
                .jumpdests = jumpdests,
                .basic_blocks = basic_blocks,
                .jump_fusions = jump_fusions,
                .advanced_fusions = advanced_fusions,
                .allocator = allocator,
            };
            
            // Detect and populate jump fusions
            try result.detectJumpFusion();
            
            // Detect advanced fusion patterns
            try result.detectAdvancedFusions();
            
            return result;
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
        
        /// Detect jump fusion patterns and populate the jump_fusions map
        fn detectJumpFusion(self: *Self) !void {
            // Iterate through all valid jumpdests
            for (self.jumpdests) |jumpdest_pc| {
                // Check if there's enough code after the JUMPDEST
                if (jumpdest_pc + 1 >= self.runtime_code.len) continue;
                
                const next_pc = jumpdest_pc + 1;
                const next_opcode = self.runtime_code[next_pc];
                
                // Check for JUMPDEST → PUSH → JUMP pattern
                if (next_opcode >= @intFromEnum(Opcode.PUSH1) and next_opcode <= @intFromEnum(Opcode.PUSH32)) {
                    const push_size = next_opcode - @intFromEnum(Opcode.PUSH1) + 1;
                    const jump_pc = next_pc + 1 + push_size;
                    
                    // Check if there's a JUMP after the PUSH
                    if (jump_pc < self.runtime_code.len and self.runtime_code[jump_pc] == @intFromEnum(Opcode.JUMP)) {
                        // Extract the jump target from PUSH data
                        var target: PcType = 0;
                        const data_start = next_pc + 1;
                        const data_end = data_start + push_size;
                        
                        // Convert bytes to target PC (big-endian)
                        if (data_end <= self.runtime_code.len) {
                            for (self.runtime_code[data_start..data_end]) |byte| {
                                target = (target << 8) | byte;
                            }
                            
                            // Only fuse if target fits in PcType and is valid
                            if (target <= std.math.maxInt(PcType)) {
                                // Verify the target is a valid jumpdest
                                if (self.isValidJumpDest(@intCast(target))) {
                                    try self.jump_fusions.put(jumpdest_pc, @intCast(target));
                                }
                            }
                        }
                    }
                    // Check for JUMPDEST → PUSH → PUSH → JUMPI pattern
                    else if (jump_pc + 1 < self.runtime_code.len and 
                             self.runtime_code[jump_pc] >= @intFromEnum(Opcode.PUSH1) and 
                             self.runtime_code[jump_pc] <= @intFromEnum(Opcode.PUSH32)) {
                        // Second PUSH instruction
                        const push2_size = self.runtime_code[jump_pc] - @intFromEnum(Opcode.PUSH1) + 1;
                        const jumpi_pc = jump_pc + 1 + push2_size;
                        
                        if (jumpi_pc < self.runtime_code.len and self.runtime_code[jumpi_pc] == @intFromEnum(Opcode.JUMPI)) {
                            // Extract jump target from first PUSH (the one after JUMPDEST)
                            var target: PcType = 0;
                            const data_start = next_pc + 1;
                            const data_end = data_start + push_size;
                            
                            if (data_end <= self.runtime_code.len) {
                                for (self.runtime_code[data_start..data_end]) |byte| {
                                    target = (target << 8) | byte;
                                }
                                
                                if (target <= std.math.maxInt(PcType)) {
                                    if (self.isValidJumpDest(@intCast(target))) {
                                        // For JUMPI, we still fuse to the target
                                        // The interpreter will handle the conditional logic
                                        try self.jump_fusions.put(jumpdest_pc, @intCast(target));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        /// Detect advanced fusion patterns in bytecode
        fn detectAdvancedFusions(self: *Self) !void {
            var pc: PcType = 0;
            
            while (pc < self.runtime_code.len) {
                // Check patterns in priority order (longer patterns first)
                
                // 1. Check for 3-PUSH fusion
                if (try self.checkMultiPushFusion(pc, 3)) |fusion_info| {
                    try self.advanced_fusions.put(pc, fusion_info);
                    pc += fusion_info.original_length;
                    continue;
                }
                
                // 2. Check for 3-POP fusion
                if (try self.checkMultiPopFusion(pc, 3)) |fusion_info| {
                    try self.advanced_fusions.put(pc, fusion_info);
                    pc += fusion_info.original_length;
                    continue;
                }
                
                // 3. Check for ISZERO-PUSH-JUMPI fusion
                if (try self.checkIszeroJumpiFusion(pc)) |fusion_info| {
                    try self.advanced_fusions.put(pc, fusion_info);
                    pc += fusion_info.original_length;
                    continue;
                }
                
                // 4. Check for DUP2-MSTORE-PUSH fusion
                if (try self.checkDup2MstorePushFusion(pc)) |fusion_info| {
                    try self.advanced_fusions.put(pc, fusion_info);
                    pc += fusion_info.original_length;
                    continue;
                }
                
                // 5. Check for constant folding patterns
                if (try self.checkConstantFolding(pc)) |fusion_info| {
                    try self.advanced_fusions.put(pc, fusion_info);
                    pc += fusion_info.original_length;
                    continue;
                }
                
                // 6. Check for 2-PUSH fusion
                if (try self.checkMultiPushFusion(pc, 2)) |fusion_info| {
                    try self.advanced_fusions.put(pc, fusion_info);
                    pc += fusion_info.original_length;
                    continue;
                }
                
                // 7. Check for 2-POP fusion
                if (try self.checkMultiPopFusion(pc, 2)) |fusion_info| {
                    try self.advanced_fusions.put(pc, fusion_info);
                    pc += fusion_info.original_length;
                    continue;
                }
                
                // No fusion found, advance by 1
                if (pc < self.runtime_code.len) {
                    const op = self.runtime_code[pc];
                    if (op >= @intFromEnum(Opcode.PUSH1) and op <= @intFromEnum(Opcode.PUSH32)) {
                        const push_size = op - @intFromEnum(Opcode.PUSH1) + 1;
                        pc += 1 + push_size;
                    } else {
                        pc += 1;
                    }
                }
            }
        }
        
        /// Check for multiple consecutive PUSH instructions
        fn checkMultiPushFusion(self: *Self, start_pc: PcType, count: u8) !?FusionInfo {
            if (start_pc + count > self.runtime_code.len) return null;
            
            var total_length: PcType = 0;
            var current_pc = start_pc;
            
            // Check if we have 'count' consecutive PUSH instructions
            var i: u8 = 0;
            while (i < count) : (i += 1) {
                if (current_pc >= self.runtime_code.len) return null;
                
                const op = self.runtime_code[current_pc];
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
                .count = count,
            };
        }
        
        /// Check for multiple consecutive POP instructions
        fn checkMultiPopFusion(self: *Self, start_pc: PcType, count: u8) !?FusionInfo {
            if (start_pc + count > self.runtime_code.len) return null;
            
            // Check if we have 'count' consecutive POP instructions
            var i: u8 = 0;
            while (i < count) : (i += 1) {
                if (self.runtime_code[start_pc + i] != @intFromEnum(Opcode.POP)) {
                    return null;
                }
            }
            
            return FusionInfo{
                .fusion_type = .multi_pop,
                .original_length = count,
                .count = count,
            };
        }
        
        /// Check for ISZERO-PUSH-JUMPI pattern
        fn checkIszeroJumpiFusion(self: *Self, start_pc: PcType) !?FusionInfo {
            if (start_pc + 2 >= self.runtime_code.len) return null;
            
            // Check for ISZERO
            if (self.runtime_code[start_pc] != @intFromEnum(Opcode.ISZERO)) return null;
            
            // Check for PUSH after ISZERO
            const push_pc = start_pc + 1;
            const push_op = self.runtime_code[push_pc];
            if (push_op < @intFromEnum(Opcode.PUSH1) or push_op > @intFromEnum(Opcode.PUSH32)) {
                return null;
            }
            
            const push_size = push_op - @intFromEnum(Opcode.PUSH1) + 1;
            const jumpi_pc = push_pc + 1 + push_size;
            
            // Check for JUMPI
            if (jumpi_pc >= self.runtime_code.len or self.runtime_code[jumpi_pc] != @intFromEnum(Opcode.JUMPI)) {
                return null;
            }
            
            return FusionInfo{
                .fusion_type = .iszero_jumpi,
                .original_length = jumpi_pc + 1 - start_pc,
            };
        }
        
        /// Check for DUP2-MSTORE-PUSH pattern
        fn checkDup2MstorePushFusion(self: *Self, start_pc: PcType) !?FusionInfo {
            if (start_pc + 3 >= self.runtime_code.len) return null;
            
            // Check for DUP2
            if (self.runtime_code[start_pc] != @intFromEnum(Opcode.DUP2)) return null;
            
            // Check for MSTORE
            if (self.runtime_code[start_pc + 1] != @intFromEnum(Opcode.MSTORE)) return null;
            
            // Check for PUSH after MSTORE
            const push_pc = start_pc + 2;
            const push_op = self.runtime_code[push_pc];
            if (push_op < @intFromEnum(Opcode.PUSH1) or push_op > @intFromEnum(Opcode.PUSH32)) {
                return null;
            }
            
            const push_size = push_op - @intFromEnum(Opcode.PUSH1) + 1;
            
            return FusionInfo{
                .fusion_type = .dup2_mstore_push,
                .original_length = 3 + push_size,
            };
        }
        
        /// Check for constant folding opportunities
        fn checkConstantFolding(self: *Self, start_pc: PcType) !?FusionInfo {
            // This is a simplified implementation that handles basic cases
            // A full implementation would need a stack simulator
            
            // Look for patterns like: PUSH, PUSH, arithmetic_op
            if (start_pc + 3 >= self.runtime_code.len) return null;
            
            // Check first PUSH
            const op1 = self.runtime_code[start_pc];
            if (op1 != @intFromEnum(Opcode.PUSH1)) return null;
            const value1 = self.runtime_code[start_pc + 1];
            
            // Check second PUSH
            const op2 = self.runtime_code[start_pc + 2];
            if (op2 != @intFromEnum(Opcode.PUSH1)) return null;
            const value2 = self.runtime_code[start_pc + 3];
            
            // Check for arithmetic operation
            const arith_pc = start_pc + 4;
            if (arith_pc >= self.runtime_code.len) return null;
            
            const arith_op = self.runtime_code[arith_pc];
            
            // Calculate folded value based on operation
            var folded_value: u256 = undefined;
            var sequence_length: PcType = 5; // Default for binary operations
            
            switch (arith_op) {
                @intFromEnum(Opcode.ADD) => {
                    folded_value = @as(u256, value1) +% @as(u256, value2);
                },
                @intFromEnum(Opcode.SUB) => {
                    folded_value = @as(u256, value1) -% @as(u256, value2);
                },
                @intFromEnum(Opcode.MUL) => {
                    folded_value = @as(u256, value1) *% @as(u256, value2);
                },
                @intFromEnum(Opcode.SHL) => {
                    // For SHL, we might have 3 PUSHes
                    if (arith_pc + 1 < self.runtime_code.len and 
                        self.runtime_code[arith_pc] == @intFromEnum(Opcode.PUSH1)) {
                        // Pattern: PUSH1 a, PUSH1 b, PUSH1 shift, SHL, SUB
                        const shift_amount = self.runtime_code[arith_pc + 1];
                        if (arith_pc + 2 < self.runtime_code.len) {
                            const next_op = self.runtime_code[arith_pc + 2];
                            if (next_op == @intFromEnum(Opcode.SHL)) {
                                // Now check if there's a SUB after
                                if (arith_pc + 3 < self.runtime_code.len and 
                                    self.runtime_code[arith_pc + 3] == @intFromEnum(Opcode.SUB)) {
                                    // Calculate: value1 - (value2 << shift_amount)
                                    const shifted = if (shift_amount < 256) 
                                        @as(u256, value2) << @intCast(shift_amount)
                                    else 
                                        0;
                                    folded_value = @as(u256, value1) -% shifted;
                                    sequence_length = 8; // Full sequence length
                                } else {
                                    return null;
                                }
                            } else {
                                return null;
                            }
                        } else {
                            return null;
                        }
                    } else {
                        return null;
                    }
                },
                else => return null,
            }
            
            return FusionInfo{
                .fusion_type = .constant_fold,
                .original_length = sequence_length,
                .folded_value = folded_value,
            };
        }
    };
}

// ============= TESTS =============

const testing = std.testing;

test "bytecode4 iterator - empty code" {
    const code = [_]u8{};
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    // Manual iterator test since we don't have init yet
    var iter = BytecodeType.Iterator{ .code = &code, .pc = 0 };
    try testing.expect(iter.next() == null);
}

test "bytecode4 iterator - simple opcodes" {
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

test "bytecode4 iterator - multiple PUSH sizes" {
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

test "bytecode4 iterator - edge case truncated push" {
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

test "bytecode4 metadata extraction - no metadata" {
    const code = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x60, @intFromEnum(Opcode.STOP) };
    const BytecodeType = Bytecode(BytecodeConfig{});
    
    const metadata = BytecodeType.extractMetadata(&code);
    try testing.expect(metadata == null);
}

test "bytecode4 helper methods - isValidJumpDest" {
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

test "bytecode4 helper methods - isPushInstruction" {
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

test "bytecode4 init - simple code" {
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

test "bytecode4 init - multiple PUSH instructions" {
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

test "bytecode4 init - JUMPDEST detection" {
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

test "bytecode4 init - basic blocks" {
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

test "bytecode4 init - empty code" {
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

test "bytecode4 scalar push finding" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH2), 0x02, 0x03,
        @intFromEnum(Opcode.ADD),
    };
    
    var push_list = std.ArrayList(u16){};
    defer push_list.deinit(allocator);
    
    try findPushInstructionsScalar(u16, allocator, &push_list, &code);
    
    const pushes = push_list.items;
    try testing.expectEqual(@as(usize, 2), pushes.len);
    try testing.expectEqual(@as(u16, 0), pushes[0]);
    try testing.expectEqual(@as(u16, 2), pushes[1]);
}

test "bytecode4 scalar jumpdest finding" {
    const allocator = testing.allocator;
    const code = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),  // Valid at 0
        @intFromEnum(Opcode.PUSH1), @intFromEnum(Opcode.JUMPDEST),  // Invalid at 2
        @intFromEnum(Opcode.JUMPDEST),  // Valid at 3
    };
    const push_pcs = [_]u16{1};  // PUSH1 at position 1
    
    var jumpdest_list = std.ArrayList(u16){};
    defer jumpdest_list.deinit(allocator);
    
    try findJumpdestsScalar(u16, allocator, &jumpdest_list, &code, &push_pcs);
    
    const jumpdests = jumpdest_list.items;
    try testing.expectEqual(@as(usize, 2), jumpdests.len);
    try testing.expectEqual(@as(u16, 0), jumpdests[0]);
    try testing.expectEqual(@as(u16, 3), jumpdests[1]);
}

test "bytecode4 isInPushData edge cases" {
    // Test with empty push_pcs
    try testing.expect(!isInPushData(@as(u16, 5), &[_]u8{}, &[_]u16{}));
    
    // Test PUSH32 at end of code
    const code = [_]u8{@intFromEnum(Opcode.PUSH32)} ++ [_]u8{0xFF} ** 32;
    const push_pcs = [_]u16{0};
    
    try testing.expect(!isInPushData(@as(u16, 0), &code, &push_pcs));  // The PUSH opcode itself
    try testing.expect(isInPushData(@as(u16, 1), &code, &push_pcs));   // First data byte
    try testing.expect(isInPushData(@as(u16, 32), &code, &push_pcs));  // Last data byte
    try testing.expect(!isInPushData(@as(u16, 33), &code, &push_pcs)); // After push data
}

test "bytecode4 truncated PUSH handling" {
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

test "bytecode4 metadata extraction" {
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

test "bytecode4 multiple contiguous JUMPDESTs" {
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

test "bytecode4 boundary conditions with custom PcType" {
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

test "bytecode4 SIMD paths" {
    const allocator = testing.allocator;
    
    // Force SIMD path with larger code
    var code: [256]u8 = undefined;
    for (0..256) |i| {
        if (i % 10 == 0) {
            code[i] = @intFromEnum(Opcode.PUSH1);
        } else if (i % 10 == 2) {
            code[i] = @intFromEnum(Opcode.JUMPDEST);
        } else {
            code[i] = @intFromEnum(Opcode.ADD);
        }
    }
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &code);
    defer bytecode.deinit();
    
    // Should find multiple PUSH and JUMPDEST instructions
    try testing.expect(bytecode.push_pcs.len > 10);
    try testing.expect(bytecode.jumpdests.len > 10);
}

test "bytecode4 iterator with bytecode instance" {
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

test "bytecode4 ERC20 real world bytecode" {
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

test "bytecode4 JUMPDEST to JUMP fusion - simple case" {
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

test "bytecode4 JUMPDEST to JUMPI fusion" {
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

test "bytecode4 complex jump fusion chain" {
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

test "bytecode4 jump fusion with push data edge case" {
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

test "bytecode4 complex iterator trace" {
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

test "bytecode4 real world fusion patterns" {
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

test "bytecode4 constant folding fusion - simple arithmetic" {
    const allocator = testing.allocator;
    
    // PUSH1 0x04, PUSH1 0x02, PUSH1 0x03, SHL, SUB -> should become PUSH1 0xFC (252)
    // 0x04 - (0x02 << 0x03) = 4 - (2 << 3) = 4 - 16 = -12 = 0xF4 (in u8)
    // But EVM uses u256, so -12 = 2^256 - 12 = 0xFFFF...FFF4
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x04,  // Push 4
        @intFromEnum(Opcode.PUSH1), 0x02,  // Push 2
        @intFromEnum(Opcode.PUSH1), 0x03,  // Push 3
        @intFromEnum(Opcode.SHL),          // 2 << 3 = 16
        @intFromEnum(Opcode.SUB),          // 4 - 16 = -12 (0xFF...F4 in u256)
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
    
    // Verify the folded value is correct
    // 4 - (2 << 3) = 4 - 16 = -12 in two's complement
    const expected: u256 = @as(u256, 4) -% (@as(u256, 2) << 3);
    try testing.expectEqual(expected, fusion.?.folded_value.?);
}

test "bytecode4 constant folding fusion - complex expression" {
    const allocator = testing.allocator;
    
    // More complex: PUSH1 0x10, PUSH1 0x02, ADD, PUSH1 0x03, MUL -> should fold to PUSH1 0x36 (54)
    // (0x10 + 0x02) * 0x03 = (16 + 2) * 3 = 18 * 3 = 54
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x10,  // Push 16
        @intFromEnum(Opcode.PUSH1), 0x02,  // Push 2
        @intFromEnum(Opcode.ADD),          // 16 + 2 = 18
        @intFromEnum(Opcode.PUSH1), 0x03,  // Push 3
        @intFromEnum(Opcode.MUL),          // 18 * 3 = 54
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify this complex expression was folded
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.constant_fold, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 5), fusion.?.original_length);
    
    // Verify the folded value: (16 + 2) * 3 = 54
    try testing.expectEqual(@as(u256, 54), fusion.?.folded_value.?);
}

test "bytecode4 multiple PUSH fusion - 2 PUSHes" {
    const allocator = testing.allocator;
    
    // Two consecutive PUSH1 instructions
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,  // Push 0x42
        @intFromEnum(Opcode.PUSH1), 0x84,  // Push 0x84
        @intFromEnum(Opcode.ADD),          // Consume both values
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify 2-PUSH fusion detected
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_push, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 4), fusion.?.original_length);
    try testing.expectEqual(@as(u8, 2), fusion.?.count.?);
}

test "bytecode4 multiple PUSH fusion - 3 PUSHes" {
    const allocator = testing.allocator;
    
    // Three consecutive PUSH instructions
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,  
        @intFromEnum(Opcode.PUSH1), 0x02,  
        @intFromEnum(Opcode.PUSH1), 0x03,  
        @intFromEnum(Opcode.ADDMOD),       // Consumes 3 values
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify 3-PUSH fusion detected
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_push, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 6), fusion.?.original_length);
    try testing.expectEqual(@as(u8, 3), fusion.?.count.?);
}

test "bytecode4 multiple POP fusion - 2 POPs" {
    const allocator = testing.allocator;
    
    // Two consecutive POP instructions
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.PUSH1), 0x84,
        @intFromEnum(Opcode.POP),          // Pop first value
        @intFromEnum(Opcode.POP),          // Pop second value
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify 2-POP fusion detected  
    const fusion = bytecode.getAdvancedFusion(4);  // POPs start at PC 4
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_pop, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 2), fusion.?.original_length);
    try testing.expectEqual(@as(u8, 2), fusion.?.count.?);
}

test "bytecode4 multiple POP fusion - 3 POPs" {
    const allocator = testing.allocator;
    
    // Three consecutive POP instructions
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.PUSH1), 0x03,
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.POP),
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify 3-POP fusion detected
    const fusion = bytecode.getAdvancedFusion(6);  // POPs start at PC 6
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_pop, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 3), fusion.?.original_length);
    try testing.expectEqual(@as(u8, 3), fusion.?.count.?);
}

test "bytecode4 ISZERO PUSH JUMPI fusion" {
    const allocator = testing.allocator;
    
    // Common pattern: check if zero then jump
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x00,  // Push value to check
        @intFromEnum(Opcode.ISZERO),       // Check if zero
        @intFromEnum(Opcode.PUSH2), 0x00, 0x0A, // Push jump target
        @intFromEnum(Opcode.JUMPI),        // Conditional jump
        @intFromEnum(Opcode.STOP),
        @intFromEnum(Opcode.JUMPDEST),     // Jump target at 0x0A
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify ISZERO-PUSH-JUMPI fusion detected
    const fusion = bytecode.getAdvancedFusion(2);  // ISZERO starts at PC 2
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.iszero_jumpi, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 6), fusion.?.original_length);
}

test "bytecode4 DUP2 MSTORE PUSH fusion" {
    const allocator = testing.allocator;
    
    // Common memory store pattern
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,  // Value to store
        @intFromEnum(Opcode.PUSH1), 0x00,  // Memory offset
        @intFromEnum(Opcode.DUP2),         // Duplicate value
        @intFromEnum(Opcode.MSTORE),       // Store to memory
        @intFromEnum(Opcode.PUSH1), 0x20,  // Next offset
        @intFromEnum(Opcode.RETURN),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify DUP2-MSTORE-PUSH fusion detected
    const fusion = bytecode.getAdvancedFusion(4);  // DUP2 starts at PC 4
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.dup2_mstore_push, fusion.?.fusion_type);
    try testing.expectEqual(@as(BytecodeType.PcType, 5), fusion.?.original_length);
}

test "bytecode4 fusion priority - longer patterns first" {
    const allocator = testing.allocator;
    
    // Test that we prefer longer fusions over shorter ones
    // This has both a 3-PUSH pattern and 2-PUSH patterns within it
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,  
        @intFromEnum(Opcode.PUSH1), 0x02,  
        @intFromEnum(Opcode.PUSH1), 0x03,  
        @intFromEnum(Opcode.PUSH1), 0x04,  // 4th PUSH (not part of 3-PUSH fusion)
        @intFromEnum(Opcode.ADDMOD),       // Uses 3 values
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify that the 3-PUSH fusion was detected (not multiple 2-PUSH fusions)
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_push, fusion.?.fusion_type);
    try testing.expectEqual(@as(u8, 3), fusion.?.count.?);
    
    // Make sure we didn't detect a 2-PUSH fusion at PC 0
    // (which would have been wrong since we should prefer the longer 3-PUSH)
}

test "bytecode4 constant folding with non-foldable interruption" {
    const allocator = testing.allocator;
    
    // Pattern that cannot be folded due to non-constant operation
    const bytecode_data = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x10,  
        @intFromEnum(Opcode.PUSH1), 0x02,  
        @intFromEnum(Opcode.CALLDATALOAD), // Non-constant operation interrupts folding
        @intFromEnum(Opcode.ADD),          
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify no constant folding detected (due to CALLDATALOAD)
    const fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(fusion == null);
}

test "bytecode4 comprehensive fusion priority test" {
    const allocator = testing.allocator;
    
    // This bytecode contains multiple fusion opportunities to test priority
    const bytecode_data = [_]u8{
        // Section 1: 3-PUSH fusion (should take priority over 2-PUSH)
        @intFromEnum(Opcode.PUSH1), 0x01,  // PC 0
        @intFromEnum(Opcode.PUSH1), 0x02,  // PC 2
        @intFromEnum(Opcode.PUSH1), 0x03,  // PC 4
        @intFromEnum(Opcode.ADDMOD),       // PC 6 - consumes 3 values
        
        // Section 2: Complex constant folding 
        @intFromEnum(Opcode.PUSH1), 0x10,  // PC 7
        @intFromEnum(Opcode.PUSH1), 0x04,  // PC 9
        @intFromEnum(Opcode.PUSH1), 0x02,  // PC 11
        @intFromEnum(Opcode.SHL),          // PC 13 - 4 << 2 = 16
        @intFromEnum(Opcode.SUB),          // PC 14 - 16 - 16 = 0
        
        // Section 3: ISZERO-PUSH-JUMPI (should take priority over individual ops)
        @intFromEnum(Opcode.ISZERO),       // PC 15 - check if zero (should be 1/true)
        @intFromEnum(Opcode.PUSH2), 0x00, 0x20, // PC 16 - jump target
        @intFromEnum(Opcode.JUMPI),        // PC 19
        
        // Section 4: DUP2-MSTORE-PUSH pattern
        @intFromEnum(Opcode.PUSH1), 0x42,  // PC 20
        @intFromEnum(Opcode.PUSH1), 0x00,  // PC 22
        @intFromEnum(Opcode.DUP2),         // PC 24
        @intFromEnum(Opcode.MSTORE),       // PC 25
        @intFromEnum(Opcode.PUSH1), 0x20,  // PC 26
        
        // Section 5: 3-POP fusion (should take priority over 2-POP)
        @intFromEnum(Opcode.POP),          // PC 28
        @intFromEnum(Opcode.POP),          // PC 29
        @intFromEnum(Opcode.POP),          // PC 30
        
        // Section 6: JUMPDEST target
        @intFromEnum(Opcode.INVALID),      // PC 31
        @intFromEnum(Opcode.JUMPDEST),     // PC 32 (0x20)
        
        // Section 7: JUMPDEST→JUMP fusion
        @intFromEnum(Opcode.PUSH1), 0x26,  // PC 33
        @intFromEnum(Opcode.JUMP),         // PC 35
        @intFromEnum(Opcode.INVALID),      // PC 36
        @intFromEnum(Opcode.JUMPDEST),     // PC 37 (0x25)
        
        // Section 8: Simple 2-PUSH fusion (no 3-PUSH available)
        @intFromEnum(Opcode.PUSH1), 0xAA,  // PC 38 (0x26)
        @intFromEnum(Opcode.PUSH1), 0xBB,  // PC 40
        @intFromEnum(Opcode.ADD),          // PC 42
        
        // Section 9: Another constant fold opportunity
        @intFromEnum(Opcode.PUSH1), 0x08,  // PC 43
        @intFromEnum(Opcode.PUSH1), 0x03,  // PC 45
        @intFromEnum(Opcode.MUL),          // PC 47 - 8 * 3 = 24
        
        // Section 10: 2-POP fusion (only 2 available)
        @intFromEnum(Opcode.POP),          // PC 48
        @intFromEnum(Opcode.POP),          // PC 49
        
        @intFromEnum(Opcode.STOP),         // PC 50
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Verify Section 1: 3-PUSH fusion detected (not 2-PUSH)
    {
        const fusion = bytecode.getAdvancedFusion(0);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.multi_push, fusion.?.fusion_type);
        try testing.expectEqual(@as(u8, 3), fusion.?.count.?);
        try testing.expectEqual(@as(BytecodeType.PcType, 6), fusion.?.original_length);
    }
    
    // Verify Section 2: Complex constant folding
    {
        const fusion = bytecode.getAdvancedFusion(7);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.constant_fold, fusion.?.fusion_type);
        try testing.expectEqual(@as(BytecodeType.PcType, 8), fusion.?.original_length);
        // 0x10 - (0x04 << 0x02) = 16 - (4 << 2) = 16 - 16 = 0
        try testing.expectEqual(@as(u256, 0), fusion.?.folded_value.?);
    }
    
    // Verify Section 3: ISZERO-PUSH-JUMPI fusion
    {
        const fusion = bytecode.getAdvancedFusion(15);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.iszero_jumpi, fusion.?.fusion_type);
        try testing.expectEqual(@as(BytecodeType.PcType, 6), fusion.?.original_length);
    }
    
    // Verify Section 4: DUP2-MSTORE-PUSH fusion
    {
        const fusion = bytecode.getAdvancedFusion(24);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.dup2_mstore_push, fusion.?.fusion_type);
        try testing.expectEqual(@as(BytecodeType.PcType, 5), fusion.?.original_length);
    }
    
    // Verify Section 5: 3-POP fusion
    {
        const fusion = bytecode.getAdvancedFusion(28);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.multi_pop, fusion.?.fusion_type);
        try testing.expectEqual(@as(u8, 3), fusion.?.count.?);
        try testing.expectEqual(@as(BytecodeType.PcType, 3), fusion.?.original_length);
    }
    
    // Verify Section 7: JUMPDEST→JUMP fusion
    {
        const jump_fusion = bytecode.getFusedTarget(32);
        try testing.expectEqual(@as(?BytecodeType.PcType, 0x26), jump_fusion);
    }
    
    // Verify Section 8: 2-PUSH fusion (when 3 not available)
    {
        const fusion = bytecode.getAdvancedFusion(38);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.multi_push, fusion.?.fusion_type);
        try testing.expectEqual(@as(u8, 2), fusion.?.count.?);
        try testing.expectEqual(@as(BytecodeType.PcType, 4), fusion.?.original_length);
    }
    
    // Verify Section 9: Simple constant fold
    {
        const fusion = bytecode.getAdvancedFusion(43);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.constant_fold, fusion.?.fusion_type);
        try testing.expectEqual(@as(BytecodeType.PcType, 5), fusion.?.original_length);
        try testing.expectEqual(@as(u256, 24), fusion.?.folded_value.?);
    }
    
    // Verify Section 10: 2-POP fusion (when 3 not available)
    {
        const fusion = bytecode.getAdvancedFusion(48);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.multi_pop, fusion.?.fusion_type);
        try testing.expectEqual(@as(u8, 2), fusion.?.count.?);
        try testing.expectEqual(@as(BytecodeType.PcType, 2), fusion.?.original_length);
    }
    
    // Verify no false positives - check some PCs that shouldn't have fusions
    try testing.expect(bytecode.getAdvancedFusion(6) == null);   // ADDMOD
    try testing.expect(bytecode.getAdvancedFusion(14) == null);  // SUB (part of fold)
    try testing.expect(bytecode.getAdvancedFusion(31) == null);  // INVALID
    try testing.expect(bytecode.getAdvancedFusion(50) == null);  // STOP
}

test "bytecode4 overlapping fusion patterns - priority verification" {
    const allocator = testing.allocator;
    
    // Test case where multiple patterns could match - verify we pick the best one
    const bytecode_data = [_]u8{
        // This could be interpreted as:
        // - One 3-PUSH fusion (best choice)
        // - One 2-PUSH fusion + separate PUSH
        // - Three separate PUSHes
        @intFromEnum(Opcode.PUSH1), 0x10,
        @intFromEnum(Opcode.PUSH1), 0x20,
        @intFromEnum(Opcode.PUSH1), 0x30,
        
        // This could be constant folded OR seen as part of multi-push
        // Constant fold should win because it's checked first
        @intFromEnum(Opcode.PUSH1), 0x05,
        @intFromEnum(Opcode.PUSH1), 0x03,
        @intFromEnum(Opcode.ADD),          // 5 + 3 = 8
        
        // Ambiguous pattern that looks like PUSH but is actually in a constant fold
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.PUSH1), 0x03,
        @intFromEnum(Opcode.PUSH1), 0x01,  // shift amount
        @intFromEnum(Opcode.SHL),          // 3 << 1 = 6
        @intFromEnum(Opcode.SUB),          // 2 - 6 = -4 (wraps to large number)
        
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // First pattern should be 3-PUSH (not 2-PUSH)
    {
        const fusion = bytecode.getAdvancedFusion(0);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.multi_push, fusion.?.fusion_type);
        try testing.expectEqual(@as(u8, 3), fusion.?.count.?);
    }
    
    // Second pattern should be constant fold (not 2-PUSH)
    {
        const fusion = bytecode.getAdvancedFusion(6);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.constant_fold, fusion.?.fusion_type);
        try testing.expectEqual(@as(u256, 8), fusion.?.folded_value.?);
    }
    
    // Third pattern should be complex constant fold
    {
        const fusion = bytecode.getAdvancedFusion(11);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.constant_fold, fusion.?.fusion_type);
        try testing.expectEqual(@as(BytecodeType.PcType, 8), fusion.?.original_length);
        // 2 - (3 << 1) = 2 - 6 = -4, which wraps around in u256
        const expected: u256 = @as(u256, 2) -% (@as(u256, 3) << 1);
        try testing.expectEqual(expected, fusion.?.folded_value.?);
    }
}

test "bytecode4 fusion edge cases and priority conflicts" {
    const allocator = testing.allocator;
    
    // Edge cases that test fusion detection robustness
    const bytecode_data = [_]u8{
        // Edge case 1: Constant fold that ends with PUSH (shouldn't interfere with next fusion)
        @intFromEnum(Opcode.PUSH1), 0xFF,  // PC 0
        @intFromEnum(Opcode.PUSH1), 0x01,  // PC 2
        @intFromEnum(Opcode.ADD),          // PC 4 - FF + 1 = 100 (wraps to 0 in u8, but u256 = 256)
        
        // Edge case 2: 3 PUSHes but not consecutive due to different sizes
        @intFromEnum(Opcode.PUSH1), 0x11,  // PC 5
        @intFromEnum(Opcode.PUSH2), 0x22, 0x33, // PC 7
        @intFromEnum(Opcode.PUSH1), 0x44,  // PC 10
        
        // Edge case 3: ISZERO without following PUSH-JUMPI
        @intFromEnum(Opcode.ISZERO),       // PC 12
        @intFromEnum(Opcode.DUP1),         // PC 13 - Not a PUSH!
        
        // Edge case 4: DUP2-MSTORE without following PUSH
        @intFromEnum(Opcode.DUP2),         // PC 14
        @intFromEnum(Opcode.MSTORE),       // PC 15
        @intFromEnum(Opcode.DUP1),         // PC 16 - Not a PUSH!
        
        // Edge case 5: Truncated pattern at end of bytecode
        @intFromEnum(Opcode.PUSH1), 0xAB,  // PC 17
        @intFromEnum(Opcode.PUSH1), 0xCD,  // PC 19
        // Bytecode ends - no operation to complete a pattern
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &bytecode_data);
    defer bytecode.deinit();
    
    // Edge case 1: Constant fold should be detected
    {
        const fusion = bytecode.getAdvancedFusion(0);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.constant_fold, fusion.?.fusion_type);
        try testing.expectEqual(@as(u256, 256), fusion.?.folded_value.?); // 0xFF + 1 = 256
    }
    
    // Edge case 2: Should NOT detect 3-PUSH fusion (different sizes)
    {
        const fusion1 = bytecode.getAdvancedFusion(5);
        _ = bytecode.getAdvancedFusion(7);  // Just checking these don't crash
        _ = bytecode.getAdvancedFusion(10);
        
        // Each should be treated separately or in pairs at most
        try testing.expect(fusion1 == null or fusion1.?.fusion_type != .multi_push or fusion1.?.count.? != 3);
    }
    
    // Edge case 3: ISZERO alone should not create fusion
    {
        const fusion = bytecode.getAdvancedFusion(12);
        try testing.expect(fusion == null);
    }
    
    // Edge case 4: DUP2-MSTORE alone should not create fusion
    {
        const fusion = bytecode.getAdvancedFusion(14);
        try testing.expect(fusion == null);
    }
    
    // Edge case 5: 2-PUSH at end should still be detected
    {
        const fusion = bytecode.getAdvancedFusion(17);
        try testing.expect(fusion != null);
        try testing.expectEqual(BytecodeType.FusionType.multi_push, fusion.?.fusion_type);
        try testing.expectEqual(@as(u8, 2), fusion.?.count.?);
    }
}

test "bytecode4 real world - snailtracer bytecode analysis" {
    const allocator = testing.allocator;
    
    // Read the snailtracer bytecode
    const bytecode_path = "/Users/williamcory/guillotine/bench/cases/snailtracer/bytecode.txt";
    const file = try std.fs.openFileAbsolute(bytecode_path, .{});
    defer file.close();
    
    const hex_data = try file.readToEndAlloc(allocator, 1024 * 1024);
    defer allocator.free(hex_data);
    
    // Parse hex to bytes
    const trimmed = std.mem.trim(u8, hex_data, " \t\n\r");
    const has_prefix = std.mem.startsWith(u8, trimmed, "0x");
    const hex_start = if (has_prefix) 2 else 0;
    
    const bytecode_data = try allocator.alloc(u8, (trimmed.len - hex_start) / 2);
    defer allocator.free(bytecode_data);
    
    _ = try std.fmt.hexToBytes(bytecode_data, trimmed[hex_start..]);
    
    // Analyze the bytecode
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, bytecode_data);
    defer bytecode.deinit();
    
    // Verify we found jumpdests
    try testing.expect(bytecode.jumpdests.len > 0);
    
    // Verify we found push instructions
    try testing.expect(bytecode.push_pcs.len > 0);
    
    // Check for some fusions in the real bytecode
    var fusion_count: usize = 0;
    var constant_fold_count: usize = 0;
    var multi_push_count: usize = 0;
    var multi_pop_count: usize = 0;
    
    var iter = bytecode.advanced_fusions.iterator();
    while (iter.next()) |entry| {
        fusion_count += 1;
        switch (entry.value_ptr.fusion_type) {
            .constant_fold => constant_fold_count += 1,
            .multi_push => multi_push_count += 1,
            .multi_pop => multi_pop_count += 1,
            else => {},
        }
    }
    
    // Real bytecode should have some fusions
    try testing.expect(fusion_count > 0);
    
    // Iterator should work through the entire bytecode
    var iterator = bytecode.iterator();
    var instruction_count: usize = 0;
    while (iterator.next()) |_| {
        instruction_count += 1;
    }
    
    // Should have processed many instructions
    try testing.expect(instruction_count > 100);
}

test "bytecode4 real world - erc20-mint bytecode analysis" {
    const allocator = testing.allocator;
    
    // Read the ERC20 mint bytecode
    const bytecode_path = "/Users/williamcory/guillotine/bench/cases/erc20-mint/bytecode.txt";
    const file = try std.fs.openFileAbsolute(bytecode_path, .{});
    defer file.close();
    
    const hex_data = try file.readToEndAlloc(allocator, 1024 * 1024);
    defer allocator.free(hex_data);
    
    // Parse hex to bytes
    const trimmed = std.mem.trim(u8, hex_data, " \t\n\r");
    const has_prefix = std.mem.startsWith(u8, trimmed, "0x");
    const hex_start = if (has_prefix) 2 else 0;
    
    const bytecode_data = try allocator.alloc(u8, (trimmed.len - hex_start) / 2);
    defer allocator.free(bytecode_data);
    
    _ = try std.fmt.hexToBytes(bytecode_data, trimmed[hex_start..]);
    
    // Analyze the bytecode
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, bytecode_data);
    defer bytecode.deinit();
    
    // Track specific fusion patterns common in ERC20
    var push_push_add_count: usize = 0;
    var iszero_jumpi_count: usize = 0;
    
    var iter = bytecode.advanced_fusions.iterator();
    while (iter.next()) |entry| {
        switch (entry.value_ptr.fusion_type) {
            .constant_fold => {
                // ERC20 often has address calculations
                if (entry.value_ptr.folded_value != null) {
                    push_push_add_count += 1;
                }
            },
            .iszero_jumpi => iszero_jumpi_count += 1,
            else => {},
        }
    }
    
    // ERC20 contracts typically have conditional jumps
    try testing.expect(bytecode.jumpdests.len > 5);
    
    // Verify iterator completes successfully
    var iterator = bytecode.iterator();
    var instruction_count: usize = 0;
    var last_pc: BytecodeType.PcType = 0;
    
    while (iterator.next()) |entry| {
        // Verify PC is advancing
        try testing.expect(entry.pc >= last_pc);
        last_pc = entry.pc;
        instruction_count += 1;
    }
    
    // ERC20 contracts are substantial
    try testing.expect(instruction_count > 50);
}

test "bytecode4 real world - erc20-approval-transfer analysis" {
    const allocator = testing.allocator;
    
    // Read the ERC20 approval-transfer bytecode
    const bytecode_path = "/Users/williamcory/guillotine/bench/cases/erc20-approval-transfer/bytecode.txt";
    const file = try std.fs.openFileAbsolute(bytecode_path, .{});
    defer file.close();
    
    const hex_data = try file.readToEndAlloc(allocator, 1024 * 1024);
    defer allocator.free(hex_data);
    
    // Parse hex to bytes
    const trimmed = std.mem.trim(u8, hex_data, " \t\n\r");
    const has_prefix = std.mem.startsWith(u8, trimmed, "0x");
    const hex_start = if (has_prefix) 2 else 0;
    
    const bytecode_data = try allocator.alloc(u8, (trimmed.len - hex_start) / 2);
    defer allocator.free(bytecode_data);
    
    _ = try std.fmt.hexToBytes(bytecode_data, trimmed[hex_start..]);
    
    // Analyze the bytecode
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, bytecode_data);
    defer bytecode.deinit();
    
    // Collect statistics about the bytecode
    var push_count: usize = 0;
    var jump_count: usize = 0;
    var memory_op_count: usize = 0;
    
    var iterator = bytecode.iterator();
    while (iterator.next()) |entry| {
        switch (@as(Opcode, @enumFromInt(entry.opcode))) {
            .PUSH1, .PUSH2, .PUSH3, .PUSH4 => push_count += 1,
            .JUMP, .JUMPI => jump_count += 1,
            .MLOAD, .MSTORE, .MSTORE8 => memory_op_count += 1,
            else => {},
        }
    }
    
    // Approval and transfer operations involve significant logic
    try testing.expect(push_count > 20);
    try testing.expect(jump_count > 5);
    try testing.expect(memory_op_count > 0);
    
    // Check jump fusion effectiveness
    var jump_fusion_count: usize = 0;
    var jump_iter = bytecode.jump_fusions.iterator();
    while (jump_iter.next()) |_| {
        jump_fusion_count += 1;
    }
    
    // Complex contracts should have some jump fusions
    if (bytecode.jumpdests.len > 10) {
        try testing.expect(jump_fusion_count > 0);
    }
}

test "bytecode4 iterator fusion handling verification" {
    const allocator = testing.allocator;
    
    // Create bytecode with known fusion patterns
    const test_bytecode = [_]u8{
        // Multi-push pattern
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.PUSH1), 0x03,
        
        // Some operation
        @intFromEnum(Opcode.ADD),
        
        // Constant folding pattern
        @intFromEnum(Opcode.PUSH1), 0x10,
        @intFromEnum(Opcode.PUSH1), 0x20,
        @intFromEnum(Opcode.ADD),
        
        // Jump pattern
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PUSH1), 0x20,
        @intFromEnum(Opcode.JUMP),
        
        // End
        @intFromEnum(Opcode.STOP),
    };
    
    const BytecodeType = Bytecode(BytecodeConfig{});
    var bytecode = try BytecodeType.init(allocator, &test_bytecode);
    defer bytecode.deinit();
    
    // Verify fusions were detected
    const multi_push_fusion = bytecode.getAdvancedFusion(0);
    try testing.expect(multi_push_fusion != null);
    try testing.expectEqual(BytecodeType.FusionType.multi_push, multi_push_fusion.?.fusion_type);
    
    const constant_fold = bytecode.getAdvancedFusion(7);
    try testing.expect(constant_fold != null);
    try testing.expectEqual(BytecodeType.FusionType.constant_fold, constant_fold.?.fusion_type);
    
    // Verify iterator still processes all opcodes correctly
    var iterator = bytecode.iterator();
    var pc_sequence = std.ArrayList(BytecodeType.PcType).init(allocator);
    defer pc_sequence.deinit();
    
    while (iterator.next()) |entry| {
        try pc_sequence.append(entry.pc);
    }
    
    // Check that we visit all the expected PCs
    // Note: The iterator should skip over PUSH data automatically
    const expected_pcs = [_]BytecodeType.PcType{
        0,  // PUSH1
        2,  // PUSH1
        4,  // PUSH1
        6,  // ADD
        7,  // PUSH1
        9,  // PUSH1
        11, // ADD
        12, // JUMPDEST
        13, // PUSH1
        15, // JUMP
        16, // STOP
    };
    
    try testing.expectEqualSlices(BytecodeType.PcType, &expected_pcs, pc_sequence.items);
}

test "SIMD correctly skips PUSH data (bug fix)" {
    
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
        0x00, 0x00, 0x00, 0x00, 0x00,    // PC 11-15: Padding to enable SIMD testing
    };
    
    // Test with scalar implementation (known correct)
    {
        const scalar_config = BytecodeConfig{ .vector_length = 1 };
        var bytecode = try Bytecode(scalar_config).init(testing.allocator, &code);
        defer bytecode.deinit();
        
        // Should find only real PUSH instructions at PC 0, 4, and 6
        try testing.expectEqual(3, bytecode.push_pcs.len);
        try testing.expectEqual(0, bytecode.push_pcs[0]); // PUSH2 at PC 0
        try testing.expectEqual(4, bytecode.push_pcs[1]); // PUSH1 at PC 4  
        try testing.expectEqual(6, bytecode.push_pcs[2]); // PUSH3 at PC 6
    }
    
    // Test with SIMD implementation (must match scalar)
    if (code.len >= 16) { // Only test SIMD if bytecode is long enough
        const simd_config = BytecodeConfig{ .vector_length = 16 };
        var bytecode = try Bytecode(simd_config).init(testing.allocator, &code);
        defer bytecode.deinit();
        
        
        // Should find the same PUSH instructions as scalar
        try testing.expectEqual(3, bytecode.push_pcs.len);
        try testing.expectEqual(0, bytecode.push_pcs[0]); // PUSH2 at PC 0
        try testing.expectEqual(4, bytecode.push_pcs[1]); // PUSH1 at PC 4
        try testing.expectEqual(6, bytecode.push_pcs[2]); // PUSH3 at PC 6
    }
}