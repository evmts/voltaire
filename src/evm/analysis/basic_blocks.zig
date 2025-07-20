const std = @import("std");
const opcodes = @import("../opcodes/opcode.zig");
const operation = @import("../opcodes/operation.zig");

/// Represents a basic block - a sequence of instructions that execute linearly
/// without jumps or branches. Gas is checked once at the beginning of the block.
pub const BasicBlock = struct {
    /// Starting program counter for this block
    start_pc: usize,
    /// Ending program counter (exclusive)
    end_pc: usize,
    /// Total gas cost for executing all instructions in the block
    total_gas: u64,
    /// Whether this block contains dynamic gas operations (SSTORE, etc)
    has_dynamic_gas: bool,
    /// The terminating instruction type
    terminator: Terminator,

    pub const Terminator = enum {
        /// Block ends with JUMP
        jump,
        /// Block ends with JUMPI
        jumpi,
        /// Block ends with STOP, RETURN, REVERT, or similar
        halt,
        /// Block ends at code boundary
        code_end,
        /// Block ends with CALL or similar
        call,
    };
};

/// Analyzes bytecode to identify basic blocks and their gas costs
pub const BlockAnalyzer = struct {
    allocator: std.mem.Allocator,
    code: []const u8,
    valid_jumpdests: std.DynamicBitSet,

    pub fn init(allocator: std.mem.Allocator, code: []const u8, valid_jumpdests: std.DynamicBitSet) BlockAnalyzer {
        return .{
            .allocator = allocator,
            .code = code,
            .valid_jumpdests = valid_jumpdests,
        };
    }

    /// Analyzes the bytecode and returns all basic blocks
    pub fn analyzeBlocks(self: *BlockAnalyzer) ![]BasicBlock {
        var blocks = std.ArrayList(BasicBlock).init(self.allocator);
        defer blocks.deinit();

        var pc: usize = 0;
        var visited = try std.DynamicBitSet.initEmpty(self.allocator, self.code.len);
        defer visited.deinit();

        // Find all block entry points (targets of jumps and start of code)
        var entry_points = try std.DynamicBitSet.initEmpty(self.allocator, self.code.len);
        defer entry_points.deinit();
        
        entry_points.set(0); // First instruction is always an entry point
        
        // First pass: identify all entry points
        pc = 0;
        while (pc < self.code.len) {
            const op = self.code[pc];
            const opcode_enum = std.meta.intToEnum(opcodes.Enum, op) catch opcodes.Enum.INVALID;
            
            switch (opcode_enum) {
                .JUMP, .JUMPI => {
                    // Next instruction after JUMPI is an entry point
                    if (opcode_enum == .JUMPI and pc + 1 < self.code.len) {
                        entry_points.set(pc + 1);
                    }
                },
                else => {},
            }

            // Skip push data
            if (opcodes.is_push(op)) {
                const push_size = opcodes.get_push_size(op);
                pc += push_size + 1;
            } else {
                pc += 1;
            }
        }

        // Also mark all valid jump destinations as entry points
        var jumpdest_iter = self.valid_jumpdests.iterator(.{});
        while (jumpdest_iter.next()) |jumpdest| {
            entry_points.set(jumpdest);
        }

        // Second pass: build blocks starting from each entry point
        var entry_iter = entry_points.iterator(.{});
        while (entry_iter.next()) |start_pc| {
            if (visited.isSet(start_pc)) continue;
            
            const block = try self.analyzeBlockFrom(start_pc, &visited);
            try blocks.append(block);
        }

        return blocks.toOwnedSlice();
    }

    /// Analyzes a single basic block starting from the given PC
    fn analyzeBlockFrom(self: *BlockAnalyzer, start_pc: usize, visited: *std.DynamicBitSet) !BasicBlock {
        var pc = start_pc;
        var total_gas: u64 = 0;
        var has_dynamic_gas = false;
        var terminator: BasicBlock.Terminator = .code_end;

        while (pc < self.code.len) {
            if (pc != start_pc and self.valid_jumpdests.isSet(pc)) {
                // Hit another block's entry point
                terminator = .code_end;
                break;
            }

            visited.set(pc);
            
            const op = self.code[pc];
            const opcode_enum = std.meta.intToEnum(opcodes.Enum, op) catch opcodes.Enum.INVALID;

            // For now, use a simple gas cost model
            // TODO: Get actual gas costs from jump table
            const gas_cost: u64 = switch (opcode_enum) {
                .STOP, .ADD, .MUL, .SUB, .DIV, .SDIV, .MOD, .SMOD, .LT, .GT, .SLT, .SGT, .EQ, .ISZERO, .AND, .OR, .XOR, .NOT, .BYTE, .SHL, .SHR, .SAR => 3,
                .ADDMOD, .MULMOD => 8,
                .SIGNEXTEND => 5,
                .EXP => 10, // Base cost, dynamic cost not included
                .KECCAK256 => 30, // Base cost, dynamic cost not included
                .PUSH0, .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8, .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => 3,
                .DUP1, .DUP2, .DUP3, .DUP4, .DUP5, .DUP6, .DUP7, .DUP8, .DUP9, .DUP10, .DUP11, .DUP12, .DUP13, .DUP14, .DUP15, .DUP16 => 3,
                .SWAP1, .SWAP2, .SWAP3, .SWAP4, .SWAP5, .SWAP6, .SWAP7, .SWAP8, .SWAP9, .SWAP10, .SWAP11, .SWAP12, .SWAP13, .SWAP14, .SWAP15, .SWAP16 => 3,
                .POP => 2,
                .MLOAD, .MSTORE, .MSTORE8 => 3,
                .JUMP, .JUMPI => 8,
                .JUMPDEST => 1,
                .PC, .MSIZE, .GAS => 2,
                .ADDRESS, .ORIGIN, .CALLER, .CALLVALUE, .CALLDATASIZE, .CODESIZE, .GASPRICE, .RETURNDATASIZE => 2,
                .BALANCE, .SELFBALANCE => 400,
                .BLOCKHASH => 20,
                .COINBASE, .TIMESTAMP, .NUMBER, .PREVRANDAO, .GASLIMIT, .CHAINID, .BASEFEE => 2,
                .SLOAD => 800,
                .SSTORE => 5000, // Base cost, actual cost is dynamic
                else => 3, // Default for unknown opcodes
            };

            // Add base gas cost
            total_gas += gas_cost;

            // Check if this operation has dynamic gas costs
            switch (opcode_enum) {
                .SSTORE, .SLOAD, .BALANCE, .EXTCODESIZE, .EXTCODECOPY,
                .EXTCODEHASH, .CALL, .CALLCODE, .DELEGATECALL, .STATICCALL,
                .CREATE, .CREATE2, .SELFDESTRUCT => {
                    has_dynamic_gas = true;
                },
                else => {},
            }

            // Check if this is a terminating instruction
            switch (opcode_enum) {
                .JUMP => {
                    terminator = .jump;
                    pc += 1;
                    break;
                },
                .JUMPI => {
                    terminator = .jumpi;
                    pc += 1;
                    break;
                },
                .STOP, .RETURN, .REVERT, .INVALID, .SELFDESTRUCT => {
                    terminator = .halt;
                    pc += 1;
                    break;
                },
                .CALL, .CALLCODE, .DELEGATECALL, .STATICCALL => {
                    terminator = .call;
                    pc += 1;
                    break;
                },
                else => {},
            }

            // Advance PC
            if (opcodes.is_push(op)) {
                const push_size = opcodes.get_push_size(op);
                pc += push_size + 1;
            } else {
                pc += 1;
            }
        }

        return BasicBlock{
            .start_pc = start_pc,
            .end_pc = pc,
            .total_gas = total_gas,
            .has_dynamic_gas = has_dynamic_gas,
            .terminator = terminator,
        };
    }
};

/// Cache for storing analyzed blocks to avoid re-analysis
pub const BlockCache = struct {
    allocator: std.mem.Allocator,
    /// Maps code hash to analyzed blocks
    cache: std.AutoHashMap([32]u8, []BasicBlock),
    /// Maximum number of entries in the cache
    max_entries: usize,

    pub fn init(allocator: std.mem.Allocator, max_entries: usize) BlockCache {
        return .{
            .allocator = allocator,
            .cache = std.AutoHashMap([32]u8, []BasicBlock).init(allocator),
            .max_entries = max_entries,
        };
    }

    pub fn deinit(self: *BlockCache) void {
        var iter = self.cache.iterator();
        while (iter.next()) |entry| {
            self.allocator.free(entry.value_ptr.*);
        }
        self.cache.deinit();
    }

    /// Gets cached blocks for the given code hash
    pub fn get(self: *BlockCache, code_hash: [32]u8) ?[]BasicBlock {
        return self.cache.get(code_hash);
    }

    /// Stores analyzed blocks in the cache
    pub fn put(self: *BlockCache, code_hash: [32]u8, blocks: []BasicBlock) !void {
        // Simple eviction: clear cache if it's full
        if (self.cache.count() >= self.max_entries) {
            var iter = self.cache.iterator();
            while (iter.next()) |entry| {
                self.allocator.free(entry.value_ptr.*);
            }
            self.cache.clearAndFree();
        }

        // Clone the blocks for cache storage
        const cached_blocks = try self.allocator.alloc(BasicBlock, blocks.len);
        @memcpy(cached_blocks, blocks);
        
        try self.cache.put(code_hash, cached_blocks);
    }
};

test "BasicBlock analysis identifies simple blocks" {
    std.testing.log_level = .debug;
    const allocator = std.testing.allocator;

    // Simple bytecode: PUSH1 0x02 PUSH1 0x03 ADD STOP
    const code = &[_]u8{ 0x60, 0x02, 0x60, 0x03, 0x01, 0x00 };
    
    var valid_jumpdests = try std.DynamicBitSet.initEmpty(allocator, code.len);
    defer valid_jumpdests.deinit();

    var analyzer = BlockAnalyzer.init(allocator, code, valid_jumpdests);
    const blocks = try analyzer.analyzeBlocks();
    defer allocator.free(blocks);

    try std.testing.expectEqual(@as(usize, 1), blocks.len);
    try std.testing.expectEqual(@as(usize, 0), blocks[0].start_pc);
    try std.testing.expectEqual(@as(usize, 6), blocks[0].end_pc);
    try std.testing.expectEqual(BasicBlock.Terminator.halt, blocks[0].terminator);
    try std.testing.expect(blocks[0].total_gas > 0);
    try std.testing.expect(!blocks[0].has_dynamic_gas);
}

test "BasicBlock analysis handles jumps" {
    std.testing.log_level = .debug;
    const allocator = std.testing.allocator;

    // Bytecode with jump: PUSH1 0x05 JUMP INVALID JUMPDEST STOP
    const code = &[_]u8{ 0x60, 0x05, 0x56, 0xfe, 0x5b, 0x00 };
    
    var valid_jumpdests = try std.DynamicBitSet.initEmpty(allocator, code.len);
    defer valid_jumpdests.deinit();
    valid_jumpdests.set(4); // JUMPDEST at position 4

    var analyzer = BlockAnalyzer.init(allocator, code, valid_jumpdests);
    const blocks = try analyzer.analyzeBlocks();
    defer allocator.free(blocks);

    // Should have 2 blocks: one ending at JUMP, one starting at JUMPDEST
    try std.testing.expectEqual(@as(usize, 2), blocks.len);
    
    // First block ends with JUMP
    try std.testing.expectEqual(@as(usize, 0), blocks[0].start_pc);
    try std.testing.expectEqual(@as(usize, 3), blocks[0].end_pc);
    try std.testing.expectEqual(BasicBlock.Terminator.jump, blocks[0].terminator);
    
    // Second block starts at JUMPDEST
    try std.testing.expectEqual(@as(usize, 4), blocks[1].start_pc);
    try std.testing.expectEqual(@as(usize, 6), blocks[1].end_pc);
    try std.testing.expectEqual(BasicBlock.Terminator.halt, blocks[1].terminator);
}

test "BlockCache stores and retrieves blocks" {
    std.testing.log_level = .debug;
    const allocator = std.testing.allocator;

    var cache = BlockCache.init(allocator, 10);
    defer cache.deinit();

    const test_blocks = &[_]BasicBlock{
        .{
            .start_pc = 0,
            .end_pc = 10,
            .total_gas = 100,
            .has_dynamic_gas = false,
            .terminator = .halt,
        },
    };

    const code_hash = [_]u8{0x42} ** 32;
    try cache.put(code_hash, test_blocks);

    const cached = cache.get(code_hash);
    try std.testing.expect(cached != null);
    try std.testing.expectEqual(@as(usize, 1), cached.?.len);
    try std.testing.expectEqual(@as(usize, 0), cached.?[0].start_pc);
    try std.testing.expectEqual(@as(usize, 10), cached.?[0].end_pc);
}