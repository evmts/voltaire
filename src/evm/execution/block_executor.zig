const std = @import("std");
const Vm = @import("../evm.zig");
const Frame = @import("../frame/frame.zig");
const basic_blocks = @import("../analysis/basic_blocks.zig");
const opcodes = @import("../opcodes/opcode.zig");
const operation = @import("../opcodes/operation.zig");

/// Configuration for block-based execution
pub const BlockExecutionConfig = struct {
    /// Whether to use block-based gas accounting
    enabled: bool = true,
    /// Minimum block size to use optimization (in instructions)
    min_block_size: usize = 3,
    /// Whether to cache analyzed blocks
    cache_blocks: bool = true,
    /// Maximum number of cached code analyses
    max_cache_entries: usize = 1000,
};

/// Block-based executor that optimizes gas checking
pub const BlockExecutor = struct {
    vm: *Vm,
    frame: *Frame,
    config: BlockExecutionConfig,
    block_cache: ?*basic_blocks.BlockCache,
    
    pub fn init(vm: *Vm, frame: *Frame, config: BlockExecutionConfig, block_cache: ?*basic_blocks.BlockCache) BlockExecutor {
        return .{
            .vm = vm,
            .frame = frame,
            .config = config,
            .block_cache = block_cache,
        };
    }

    /// Executes code using block-based gas accounting when beneficial
    pub fn execute(self: *BlockExecutor) !void {
        // Check if block-based execution is enabled and worthwhile
        if (!self.config.enabled or self.frame.contract.code.len < self.config.min_block_size * 3) {
            // Fall back to normal execution for small contracts
            return self.executeNormal();
        }

        // Try to get cached blocks or analyze
        const blocks = try self.getOrAnalyzeBlocks();
        defer if (!self.config.cache_blocks) self.vm.allocator.free(blocks);

        // Execute using block-based approach
        return self.executeWithBlocks(blocks);
    }

    /// Gets cached blocks or analyzes the code
    fn getOrAnalyzeBlocks(self: *BlockExecutor) ![]basic_blocks.BasicBlock {
        // Check cache first if available
        if (self.config.cache_blocks) {
            if (self.block_cache) |cache| {
                const code_hash = try self.computeCodeHash();
                if (cache.get(code_hash)) |cached_blocks| {
                    return cached_blocks;
                }

                // Analyze and cache
                const blocks = try self.analyzeCode();
                try cache.put(code_hash, blocks);
                return blocks;
            }
        }

        // No caching, just analyze
        return self.analyzeCode();
    }

    /// Computes hash of the contract code for caching
    fn computeCodeHash(self: *BlockExecutor) ![32]u8 {
        var hasher = std.crypto.hash.sha3.Keccak256.init(.{});
        hasher.update(self.frame.contract.code);
        var hash: [32]u8 = undefined;
        hasher.final(&hash);
        return hash;
    }

    /// Analyzes the contract code to find basic blocks
    fn analyzeCode(self: *BlockExecutor) ![]basic_blocks.BasicBlock {
        // Ensure contract has been analyzed for jump destinations
        self.frame.contract.analyze_jumpdests(self.vm.allocator);
        
        // Create a bitset from the jumpdest positions
        var valid_jumpdests = try std.DynamicBitSet.initEmpty(self.vm.allocator, self.frame.contract.code.len);
        defer valid_jumpdests.deinit();
        
        if (self.frame.contract.analysis) |analysis| {
            for (analysis.jumpdest_positions) |pos| {
                valid_jumpdests.set(pos);
            }
        }
        
        var analyzer = basic_blocks.BlockAnalyzer.init(
            self.vm.allocator,
            self.frame.contract.code,
            valid_jumpdests,
        );
        return analyzer.analyzeBlocks();
    }

    /// Executes using block-based gas accounting
    fn executeWithBlocks(self: *BlockExecutor, blocks: []basic_blocks.BasicBlock) !void {
        var current_block_idx: ?usize = null;

        while (self.frame.pc < self.frame.contract.code.len) {
            // Find the block containing current PC
            if (current_block_idx == null or 
                self.frame.pc < blocks[current_block_idx.?].start_pc or 
                self.frame.pc >= blocks[current_block_idx.?].end_pc) {
                current_block_idx = self.findBlockIndex(blocks, self.frame.pc);
            }

            if (current_block_idx) |block_idx| {
                const block = &blocks[block_idx];
                
                // For blocks with dynamic gas, fall back to per-instruction checking
                if (block.has_dynamic_gas) {
                    try self.executeBlockNormal(block);
                } else {
                    // Check gas for entire block at once
                    if (self.frame.gas_remaining < block.total_gas) {
                        return error.OutOfGas;
                    }
                    self.frame.gas_remaining -= block.total_gas;
                    
                    // Execute all instructions in the block without gas checks
                    try self.executeBlockOptimized(block);
                }
                
                // Handle block terminator
                switch (block.terminator) {
                    .halt, .code_end => break,
                    .jump, .jumpi, .call => {
                        // These change control flow, so we need to re-find block
                        current_block_idx = null;
                    },
                }
            } else {
                // No block found, execute single instruction
                try self.executeSingleInstruction();
            }
        }
    }

    /// Finds the block containing the given PC
    fn findBlockIndex(self: *BlockExecutor, blocks: []basic_blocks.BasicBlock, pc: usize) ?usize {
        _ = self;
        for (blocks, 0..) |block, i| {
            if (pc >= block.start_pc and pc < block.end_pc) {
                return i;
            }
        }
        return null;
    }

    /// Executes a block with per-instruction gas checking (for dynamic gas blocks)
    fn executeBlockNormal(self: *BlockExecutor, block: *const basic_blocks.BasicBlock) !void {
        while (self.frame.pc < block.end_pc) {
            try self.executeSingleInstruction();
        }
    }

    /// Executes a block without per-instruction gas checks (optimized path)
    fn executeBlockOptimized(self: *BlockExecutor, block: *const basic_blocks.BasicBlock) !void {
        const interpreter_ptr: *operation.Interpreter = @ptrCast(self.vm);
        const state_ptr: *operation.State = @ptrCast(self.frame);

        while (self.frame.pc < block.end_pc) {
            const op = self.frame.contract.code[self.frame.pc];
            const pc_before = self.frame.pc;
            
            // Execute without gas check (already checked for whole block)
            const result = try self.vm.table.execute(self.frame.pc, interpreter_ptr, state_ptr, op);
            
            if (self.frame.pc == pc_before) {
                // PC wasn't modified by instruction, advance normally
                self.frame.pc += result.bytes_consumed;
            }
            // If PC was modified (JUMP/JUMPI), it's already set correctly
        }
    }

    /// Executes a single instruction with gas checking
    fn executeSingleInstruction(self: *BlockExecutor) !void {
        const op = self.frame.contract.code[self.frame.pc];
        const op_info = self.vm.table.get_operation(op);
        
        // Check gas
        if (self.frame.gas_remaining < op_info.constant_gas) {
            return error.OutOfGas;
        }
        self.frame.gas_remaining -= op_info.constant_gas;

        // Execute
        const interpreter_ptr: *operation.Interpreter = @ptrCast(self.vm);
        const state_ptr: *operation.State = @ptrCast(self.frame);
        
        const pc_before = self.frame.pc;
        const result = try self.vm.table.execute(self.frame.pc, interpreter_ptr, state_ptr, op);
        
        if (self.frame.pc == pc_before) {
            // PC wasn't modified by instruction, advance normally
            self.frame.pc += result.bytes_consumed;
        }
        // If PC was modified (JUMP/JUMPI), it's already set correctly
    }

    /// Falls back to normal per-instruction execution
    fn executeNormal(self: *BlockExecutor) !void {
        while (self.frame.pc < self.frame.contract.code.len) {
            try self.executeSingleInstruction();
        }
    }
};

test "BlockExecutor handles simple execution" {
    std.testing.log_level = .debug;
    const allocator = std.testing.allocator;
    
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const Contract = @import("../frame/contract.zig");
    const primitives = @import("primitives");
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.toDatabaseInterface();
    var vm = try Vm.init(allocator, db_interface);
    defer vm.deinit();

    // Simple bytecode: PUSH1 0x02 PUSH1 0x03 ADD STOP
    const code = &[_]u8{ 0x60, 0x02, 0x60, 0x03, 0x01, 0x00 };
    var contract = try Contract.init(allocator, code, .{ .address = primitives.Address.ZERO });
    defer contract.deinit(allocator, null);

    var frame = try Frame.init(allocator, &vm, 1000000, contract, primitives.Address.ZERO, &.{});
    defer frame.deinit();

    const config = BlockExecutionConfig{};
    var executor = BlockExecutor.init(&vm, &frame, config, null);
    
    try executor.execute();

    // Check that execution completed and stack has result
    const result = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 5), result);
}

test "BlockExecutor optimizes linear code" {
    std.testing.log_level = .debug;
    const allocator = std.testing.allocator;
    
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const Contract = @import("../frame/contract.zig");
    const primitives = @import("primitives");
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.toDatabaseInterface();
    var vm = try Vm.init(allocator, db_interface);
    defer vm.deinit();

    // Longer linear code sequence
    const code = &[_]u8{ 
        0x60, 0x01, // PUSH1 1
        0x60, 0x02, // PUSH1 2
        0x01,       // ADD
        0x60, 0x03, // PUSH1 3
        0x01,       // ADD
        0x60, 0x04, // PUSH1 4
        0x01,       // ADD
        0x00,       // STOP
    };
    
    var contract = try Contract.init(allocator, code, .{ .address = primitives.Address.ZERO });
    defer contract.deinit(allocator, null);

    var frame = try Frame.init(allocator, &vm, 1000000, contract, primitives.Address.ZERO, &.{});
    defer frame.deinit();

    // Create cache for testing
    var cache = basic_blocks.BlockCache.init(allocator, 10);
    defer cache.deinit();

    const config = BlockExecutionConfig{
        .enabled = true,
        .cache_blocks = true,
    };
    var executor = BlockExecutor.init(&vm, &frame, config, &cache);
    
    const initial_gas = frame.gas;
    try executor.execute();
    
    // Verify execution completed correctly
    const result = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 10), result); // 1+2+3+4
    
    // Verify gas was consumed
    try std.testing.expect(frame.gas < initial_gas);
}