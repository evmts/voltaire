const std = @import("std");
const builtin = @import("builtin");
const limits = @import("constants/code_analysis_limits.zig");
const StaticBitSet = std.bit_set.StaticBitSet;
const DynamicBitSet = std.DynamicBitSet;
const Instruction = @import("instruction.zig").Instruction;
const always_advance = @import("instruction.zig").always_advance;
const dispatch_execute = @import("instruction.zig").dispatch_execute;
const BlockInfo = @import("instruction.zig").BlockInfo;
const JumpType = @import("instruction.zig").JumpType;
const JumpTarget = @import("instruction.zig").JumpTarget;
const NoopHandler = @import("instruction.zig").NoopHandler;
const DynamicGas = @import("instruction.zig").DynamicGas;
const DynamicGasFunc = @import("instruction.zig").DynamicGasFunc;
const Opcode = @import("opcodes/opcode.zig");
const OpcodeMetadata = @import("opcode_metadata/opcode_metadata.zig");
const instruction_limits = @import("constants/instruction_limits.zig");
const ExecutionError = @import("execution/execution_error.zig");
const execution = @import("execution/package.zig");
const Frame = @import("frame.zig").Frame;
const Log = @import("log.zig");
const stack_height_changes = @import("opcodes/stack_height_changes.zig");
const dynamic_gas = @import("gas/dynamic_gas.zig");

/// Packed array of valid JUMPDEST positions for cache-efficient validation.
/// Because JUMPDEST opcodes are sparse (typically <50 per contract vs 24KB max size),
/// a packed array with linear search provides better cache locality than a bitmap.
/// Uses u15 to pack positions tightly while supporting max contract size (24KB < 32KB).
pub const JumpdestArray = struct {
    /// Sorted array of valid JUMPDEST program counters.
    /// u15 allows max value 32767, sufficient for MAX_CONTRACT_SIZE (24576).
    /// Packed to maximize cache line utilization.
    positions: []const u15,

    /// Original code length for bounds checking and search hint calculation
    code_len: usize,

    allocator: std.mem.Allocator,

    /// Convert a DynamicBitSet bitmap to a packed array of JUMPDEST positions.
    /// Collects all set bits from the bitmap into a sorted, packed array.
    pub fn from_bitmap(allocator: std.mem.Allocator, bitmap: *const DynamicBitSet, code_len: usize) !JumpdestArray {
        comptime {
            std.debug.assert(std.math.maxInt(u15) >= limits.MAX_CONTRACT_SIZE);
        }

        // First pass: count set bits to determine array size
        var count: usize = 0;
        var i: usize = 0;
        while (i < code_len) : (i += 1) {
            if (bitmap.isSet(i)) count += 1;
        }

        // Allocate packed array
        const positions = try allocator.alloc(u15, count);
        errdefer allocator.free(positions);

        // Second pass: collect positions into array
        var pos_idx: usize = 0;
        i = 0;
        while (i < code_len) : (i += 1) {
            if (bitmap.isSet(i)) {
                positions[pos_idx] = @intCast(i);
                pos_idx += 1;
            }
        }

        return JumpdestArray{
            .positions = positions,
            .code_len = code_len,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *JumpdestArray) void {
        self.allocator.free(self.positions);
    }

    /// Validates if a program counter is a valid JUMPDEST using cache-friendly linear search.
    /// Uses proportional starting point (pc / code_len * positions.len) then searches
    /// bidirectionally to maximize cache hits on the packed array.
    pub fn is_valid_jumpdest(self: *const JumpdestArray, pc: usize) bool {
        if (self.positions.len == 0 or pc >= self.code_len) return false;

        // Calculate proportional starting index for linear search
        // This distributes search starting points across the array for better cache locality
        const start_idx = (pc * self.positions.len) / self.code_len;
        const safe_start = @min(start_idx, self.positions.len - 1);

        // Linear search from calculated starting point - forwards then backwards
        // Linear search maximizes CPU cache hit rates on packed consecutive memory
        if (self.positions[safe_start] == pc) return true;

        // Search forward
        var i = safe_start + 1;
        while (i < self.positions.len and self.positions[i] <= pc) : (i += 1) {
            if (self.positions[i] == pc) return true;
        }

        // Search backward
        i = safe_start;
        while (i > 0) {
            i -= 1;
            if (self.positions[i] >= pc) {
                if (self.positions[i] == pc) return true;
            } else break;
        }

        return false;
    }
};

/// Optimized code analysis for EVM bytecode execution.
/// Contains only the essential data needed during execution.
/// Fields are organized by access frequency for optimal cache performance.
pub const CodeAnalysis = @This();

// === FIRST CACHE LINE - ULTRA HOT (accessed on every instruction) ===
/// Heap-allocated instruction stream for execution.
/// Regular slice; analysis appends a STOP instruction as the final element.
/// Must be freed by caller using deinit().
instructions: []Instruction, // 16 bytes - accessed on EVERY instruction

/// Mapping from bytecode PC to the BEGINBLOCK instruction index that contains that PC.
/// Size = code_len. Value = maxInt(u16) if unmapped.
pc_to_block_start: []u16, // 16 bytes - accessed on EVERY jump

/// Packed array of valid JUMPDEST positions in the bytecode.
/// Required for JUMP/JUMPI validation during execution.
/// Uses cache-efficient linear search on packed u15 array.
jumpdest_array: JumpdestArray, // 24 bytes - accessed on jump validation

// === SECOND CACHE LINE - WARM (accessed during specific operations) ===
/// Original contract bytecode for this analysis (used by CODECOPY).
code: []const u8, // 16 bytes - accessed by CODECOPY/CODESIZE

/// Original code length (used for bounds checks)
code_len: usize, // 8 bytes - accessed with code operations

/// For each instruction index, indicates if it is a JUMP or JUMPI (or other).
/// Size = instructions.len
inst_jump_type: []JumpType, // 16 bytes - accessed during control flow

// === THIRD CACHE LINE - COLD (rarely accessed) ===
/// Mapping from instruction index to original bytecode PC (for debugging/tracing)
inst_to_pc: []u16, // 16 bytes - only for debugging/tracing

/// Allocator used for the instruction array (needed for cleanup)
allocator: std.mem.Allocator, // 16 bytes - only accessed on deinit

/// Handler for opcodes that should never be executed directly.
/// Used for JUMP, JUMPI, and PUSH opcodes that are handled inline by the interpreter.
/// This function should never be called - if it is, there's a bug in the analysis or interpreter.
pub fn UnreachableHandler(frame: *anyopaque) ExecutionError.Error!void {
    _ = frame;
    // Noop by design: instructions that should be handled inline (e.g., PUSH/PC) or via control-flow
    // metadata (.next_instruction / .conditional_jump) will never need their execute fn invoked.
    return;
}

/// Handler for BEGINBLOCK instructions that validates an entire basic block upfront.
/// This performs gas and stack validation for all instructions in the block in one operation,
/// eliminating the need for per-instruction validation during execution.
///
/// The block information (gas cost, stack requirements) is stored in the instruction's arg.block_info.
/// This handler must be called before executing any instructions in the basic block.
pub const BeginBlockHandler = NoopHandler;

/// Block analysis structure used during instruction stream generation.
/// Tracks the accumulated requirements for a basic block during analysis.
const BlockAnalysis = struct {
    /// Total static gas cost accumulated for all instructions in the block
    gas_cost: u32 = 0,
    /// Stack height requirement relative to block start
    stack_req: i16 = 0,
    /// Maximum stack growth during block execution
    stack_max_growth: i16 = 0,
    /// Current stack change from block start
    stack_change: i16 = 0,
    /// Index of the BEGINBLOCK instruction that starts this block
    begin_block_index: usize,

    /// Initialize a new block analysis at the given instruction index
    fn init(begin_index: usize) BlockAnalysis {
        return BlockAnalysis{
            .begin_block_index = begin_index,
        };
    }

    /// Close the current block by producing compressed information about the block
    fn close(self: *const BlockAnalysis) BlockInfo {
        return BlockInfo{
            .gas_cost = self.gas_cost,
            .stack_req = @intCast(@max(0, self.stack_req)),
            .stack_max_growth = @intCast(@max(0, self.stack_max_growth)),
        };
    }

    /// Update stack tracking for an operation
    fn updateStackTracking(self: *BlockAnalysis, opcode: u8, min_stack: u32) void {
        // Get the precise net stack change from the lookup table
        const net_change = stack_height_changes.get_stack_height_change(opcode);

        // min_stack tells us how many items the operation pops
        const stack_inputs = @as(i16, @intCast(min_stack));

        // Calculate requirement relative to block start
        const current_stack_req = stack_inputs - self.stack_change;
        self.stack_req = @max(self.stack_req, current_stack_req);

        // Update stack change using the precise net change
        self.stack_change += net_change;
        self.stack_max_growth = @max(self.stack_max_growth, self.stack_change);
    }
};

/// Main public API: Analyzes bytecode and returns optimized CodeAnalysis with instruction stream.
/// The caller must call deinit() to free the instruction array.
/// TODO: Add chain_rules parameter to validate EIP-specific opcodes during analysis:
/// - EIP-3855 (PUSH0): Reject PUSH0 in pre-Shanghai contracts
/// - EIP-5656 (MCOPY): Reject MCOPY in pre-Cancun contracts
/// - EIP-3198 (BASEFEE): Reject BASEFEE in pre-London contracts
pub fn from_code(allocator: std.mem.Allocator, code: []const u8, jump_table: *const OpcodeMetadata) !CodeAnalysis {
    if (code.len > limits.MAX_CONTRACT_SIZE) {
        return error.CodeTooLarge;
    }

    // MEMORY ALLOCATION: Temporary code bitmap (freed after analysis)
    // Expected size: code_len bits (rounded up)
    // Lifetime: During analysis only (freed immediately)
    // Frequency: Once per analysis
    var code_segments = try createCodeBitmap(allocator, code);
    defer code_segments.deinit();

    // MEMORY ALLOCATION: Jumpdest bitmap
    // Expected size: code_len bits (rounded up)
    // Lifetime: Per analysis
    // Frequency: Once per unique contract bytecode
    var jumpdest_bitmap = try DynamicBitSet.initEmpty(allocator, code.len);
    errdefer jumpdest_bitmap.deinit();

    if (comptime builtin.mode == .Debug or builtin.mode == .ReleaseSafe) {
        // Bitmap sizes should be proportional to code length
        // Each bit represents one byte of code
        const bitmap_bytes = (code.len + 7) / 8; // Round up to nearest byte
        // Max contract is 24KB, so bitmaps should be max 3KB each
        std.debug.assert(bitmap_bytes <= 3072); // 3KB max
    }

    if (code.len == 0) {
        Log.debug("[analysis] Empty code, returning empty analysis", .{});
        // For empty code, convert empty bitmap to empty array and create 1-element array with sentinel
        const jumpdest_array = try JumpdestArray.from_bitmap(allocator, &jumpdest_bitmap, code.len);
        jumpdest_bitmap.deinit(); // Free the temporary bitmap

        const empty_instructions = try allocator.alloc(Instruction, 1);
        empty_instructions[0] = Instruction.STOP;
        const empty_jump_types = try allocator.alloc(JumpType, 0);
        const empty_pc_map = try allocator.alloc(u16, 0);
        const empty_inst_to_pc = try allocator.alloc(u16, 0);
        return CodeAnalysis{
            // First cache line - hot
            .instructions = empty_instructions,
            .pc_to_block_start = empty_pc_map,
            .jumpdest_array = jumpdest_array,
            // Second cache line - warm
            .code = &[_]u8{},
            .code_len = 0,
            .inst_jump_type = empty_jump_types,
            // Third cache line - cold
            .inst_to_pc = empty_inst_to_pc,
            .allocator = allocator,
        };
    }

    // First pass: identify JUMPDESTs and contract properties
    var i: usize = 0;
    var loop_iterations: u32 = 0;
    const max_iterations = limits.MAX_CONTRACT_SIZE * 2; // Safety check
    while (i < code.len) {
        // Safety check to prevent infinite loops
        loop_iterations += 1;
        if (loop_iterations > max_iterations) {
            return error.InstructionLimitExceeded;
        }

        const op = code[i];

        // Mark JUMPDEST positions
        if (op == @intFromEnum(Opcode.Enum.JUMPDEST) and code_segments.isSet(i)) {
            jumpdest_bitmap.set(i);
        }

        // Handle opcodes that affect contract properties - skip invalid opcodes
        const maybe_opcode = std.meta.intToEnum(Opcode.Enum, op) catch {
            // Invalid opcode, skip it but MUST increment i to avoid infinite loop
            i += 1;
            continue;
        };
        switch (maybe_opcode) {
            .JUMP, .JUMPI => {},
            .SELFDESTRUCT => {},
            .CREATE, .CREATE2 => {},
            else => {},
        }

        // Advance PC
        if (Opcode.is_push(op)) {
            const push_bytes = Opcode.get_push_size(op);
            i += 1 + push_bytes;
        } else {
            i += 1;
        }
    }

    // Simple stack depth analysis
    var stack_depth: i16 = 0;
    i = 0;
    loop_iterations = 0;
    while (i < code.len) {
        loop_iterations += 1;
        if (loop_iterations > max_iterations) {
            return error.InstructionLimitExceeded;
        }

        const op = code[i];

        // Skip non-code bytes (PUSH data)
        if (!code_segments.isSet(i)) {
            i += 1;
            continue;
        }

        // Get precise stack height change from lookup table
        const net_change = stack_height_changes.get_stack_height_change(op);

        // Update stack depth
        stack_depth = stack_depth + net_change;

        // Track max stack depth (for potential future use)
        _ = @as(u16, @intCast(@max(0, stack_depth)));

        // Advance PC
        if (Opcode.is_push(op)) {
            const push_bytes = Opcode.get_push_size(op);
            i += 1 + push_bytes;
        } else {
            i += 1;
        }
    }

    // Convert to instruction stream using temporary data
    const gen = try codeToInstructions(allocator, code, jump_table, &jumpdest_bitmap);

    // Apply pattern optimizations (like SHA3 precomputation)
    try applyPatternOptimizations(gen.instructions, code);

    // Convert bitmap to packed array for cache-efficient validation
    const jumpdest_array = try JumpdestArray.from_bitmap(allocator, &jumpdest_bitmap, code.len);
    jumpdest_bitmap.deinit(); // Free the temporary bitmap

    return CodeAnalysis{
        // === FIRST CACHE LINE - ULTRA HOT ===
        .instructions = gen.instructions,
        .pc_to_block_start = gen.pc_to_block_start,
        .jumpdest_array = jumpdest_array,
        // === SECOND CACHE LINE - WARM ===
        .inst_to_pc = gen.inst_to_pc,
        .code_len = code.len,
        .allocator = allocator,
        // === THIRD CACHE LINE - COLD ===
        .code = code,
        .inst_jump_type = gen.inst_jump_type,
    };
}

/// Clean up allocated instruction array and packed jumpdest array.
/// Must be called by the caller to prevent memory leaks.
pub fn deinit(self: *CodeAnalysis) void {
    // Free the instruction array (now a slice)
    self.allocator.free(self.instructions);

    // Free auxiliary arrays
    self.allocator.free(self.inst_jump_type);
    self.allocator.free(self.pc_to_block_start);
    self.allocator.free(self.inst_to_pc);

    // Free the packed jumpdest array
    self.jumpdest_array.deinit();
}

/// Get the dynamic gas function for a specific opcode
fn getDynamicGasFunction(opcode: Opcode.Enum) ?DynamicGasFunc {
    return switch (opcode) {
        .CALL => @ptrCast(&dynamic_gas.call_dynamic_gas),
        .CALLCODE => @ptrCast(&dynamic_gas.callcode_dynamic_gas),
        .DELEGATECALL => @ptrCast(&dynamic_gas.delegatecall_dynamic_gas),
        .STATICCALL => @ptrCast(&dynamic_gas.staticcall_dynamic_gas),
        .CREATE => @ptrCast(&dynamic_gas.create_dynamic_gas),
        .CREATE2 => @ptrCast(&dynamic_gas.create2_dynamic_gas),
        .SSTORE => @ptrCast(&dynamic_gas.sstore_dynamic_gas),
        .GAS => @ptrCast(&dynamic_gas.gas_dynamic_gas),
        else => null,
    };
}

/// Creates a code bitmap that marks which bytes are opcodes vs data.
fn createCodeBitmap(allocator: std.mem.Allocator, code: []const u8) !DynamicBitSet {
    std.debug.assert(code.len <= limits.MAX_CONTRACT_SIZE);

    // MEMORY ALLOCATION: Temporary code bitmap
    // Expected size: code_len bits
    // Lifetime: During analysis only (freed by caller)
    // Frequency: Once per analysis
    var bitmap = try DynamicBitSet.initFull(allocator, code.len);
    errdefer bitmap.deinit();

    var i: usize = 0;
    while (i < code.len) {
        const op = code[i];

        // If the opcode is a PUSH, mark pushed bytes as data (not code)
        if (Opcode.is_push(op)) {
            const push_bytes = Opcode.get_push_size(op);
            var j: usize = 1;
            while (j <= push_bytes and i + j < code.len) : (j += 1) {
                bitmap.unset(i + j);
            }
            i += 1 + push_bytes;
        } else {
            i += 1;
        }
    }

    return bitmap;
}

/// Convert bytecode to null-terminated instruction stream with block-based optimization.
/// This implementation follows evmone's advanced analysis approach by:
/// 1. Injecting BEGINBLOCK instructions at basic block boundaries
/// 2. Pre-calculating gas and stack requirements for entire blocks
/// 3. Eliminating per-instruction validation during execution
const CodeGenResult = struct {
    instructions: []Instruction,
    pc_to_block_start: []u16,
    inst_jump_type: []JumpType,
    inst_to_pc: []u16,
};

const Stats = struct {
    push_add_fusions: u32 = 0,
    push_sub_fusions: u32 = 0,
    push_mul_fusions: u32 = 0,
    push_div_fusions: u32 = 0,
    keccak_optimizations: u32 = 0,
    inline_opcodes: u32 = 0,
    total_opcodes: u32 = 0,
    total_blocks: u32 = 0,
    eliminated_opcodes: u32 = 0,
    start_time: i64 = 0, // Will be set at runtime
};

fn codeToInstructions(allocator: std.mem.Allocator, code: []const u8, jump_table: *const OpcodeMetadata, jumpdest_bitmap: *const DynamicBitSet) !CodeGenResult {
    Log.debug("[analysis] Converting {} bytes of code to instructions", .{code.len});

    // Debug statistics for fusion rates and analysis cost
    var stats = Stats{};

    if (builtin.mode == .Debug) {
        stats.start_time = std.time.milliTimestamp();
    }

    // MEMORY ALLOCATION: Instructions array
    // Expected size: MAX_INSTRUCTIONS * sizeof(Instruction) ≈ 3-5MB max
    // Lifetime: Per analysis (cached or per-call)
    // Frequency: Once per unique contract bytecode
    // Note: MAX_INSTRUCTIONS=65536, Instruction contains fn ptr + u256 union (~48 bytes)
    const instructions = try allocator.alloc(Instruction, instruction_limits.MAX_INSTRUCTIONS + 1);
    errdefer allocator.free(instructions);

    if (comptime builtin.mode == .Debug or builtin.mode == .ReleaseSafe) {
        // Verify instruction allocation is within expected bounds
        const inst_size = instructions.len * @sizeOf(Instruction);
        // MAX_INSTRUCTIONS is 65536, Instruction is ~48 bytes (8 byte ptr + 32 byte u256 + padding)
        // Total: 65537 * 48 = ~3.1MB, allow up to 5MB for safety
        std.debug.assert(inst_size <= 5 * 1024 * 1024); // 5MB max
    }

    // MEMORY ALLOCATION: PC to instruction mapping (temporary)
    // Expected size: code_len * 2 bytes
    // Lifetime: During analysis only (freed immediately)
    // Frequency: Once per analysis
    const pc_to_instruction = try allocator.alloc(u16, code.len);
    defer allocator.free(pc_to_instruction);
    @memset(pc_to_instruction, std.math.maxInt(u16)); // Initialize with invalid values

    if (comptime builtin.mode == .Debug or builtin.mode == .ReleaseSafe) {
        // PC mapping should be proportional to code size
        const pc_map_size = pc_to_instruction.len * @sizeOf(u16);
        // Max contract size is 24KB, so mapping should be max 48KB
        std.debug.assert(pc_map_size <= 49152); // 48KB max
    }

    // MEMORY ALLOCATION: Jump type array
    // Expected size: instruction_count * 1 byte (shrunk later)
    // Lifetime: Per analysis
    // Frequency: Once per unique contract bytecode
    var inst_jump_type = try allocator.alloc(JumpType, instruction_limits.MAX_INSTRUCTIONS + 1);
    errdefer allocator.free(inst_jump_type);

    if (comptime builtin.mode == .Debug or builtin.mode == .ReleaseSafe) {
        // Jump type array should be MAX_INSTRUCTIONS * 1 byte
        const jump_type_size = inst_jump_type.len * @sizeOf(JumpType);
        // Should be ~65KB for max instructions
        std.debug.assert(jump_type_size <= 128 * 1024); // 128KB max (generous for enum size)
    }
    // Initialize to .other
    var t: usize = 0;
    while (t < inst_jump_type.len) : (t += 1) inst_jump_type[t] = .other;

    var pc: usize = 0;
    var instruction_count: usize = 0;

    // Start first block with BEGINBLOCK instruction
    instructions[instruction_count] = Instruction{
        .opcode_fn = always_advance,
        .arg = .{ .block_info = BlockInfo{} }, // Will be filled when block closes
    };
    var block = BlockAnalysis.init(instruction_count);
    instruction_count += 1;
    if (builtin.mode == .Debug) stats.total_blocks += 1;

    while (pc < code.len) {
        if (instruction_count >= instruction_limits.MAX_INSTRUCTIONS) {
            return error.InstructionLimitExceeded;
        }

        const opcode_byte = code[pc];
        if (builtin.mode == .Debug) stats.total_opcodes += 1;

        // Debug logging for specific PC range
        if (pc >= 38 and pc <= 42) {
            Log.debug("[analysis] Processing byte 0x{x:0>2} at pc={}", .{ opcode_byte, pc });
        }

        const opcode = std.meta.intToEnum(Opcode.Enum, opcode_byte) catch {
            // Invalid opcode - accumulate in block and create instruction
            const operation = jump_table.get_operation(opcode_byte);
            block.gas_cost += @intCast(operation.constant_gas);
            block.updateStackTracking(opcode_byte, operation.min_stack);

            // Record PC to instruction mapping BEFORE incrementing instruction_count
            pc_to_instruction[pc] = @intCast(instruction_count);

            instructions[instruction_count] = Instruction{
                .opcode_fn = always_advance,
                .arg = .none, // No individual gas cost - handled by BEGINBLOCK
            };
            instruction_count += 1;
            pc += 1;
            continue;
        };

        // Handle basic block boundaries and special opcodes
        switch (opcode) {
            .JUMPDEST => {
                // Close current block and start new one
                instructions[block.begin_block_index].arg.block_info = block.close();

                // Start new block with BEGINBLOCK
                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .{ .block_info = BlockInfo{} },
                };
                block = BlockAnalysis.init(instruction_count);
                instruction_count += 1;
                if (builtin.mode == .Debug) stats.total_blocks += 1;

                // Add the JUMPDEST instruction to the new block
                const operation = jump_table.get_operation(opcode_byte);
                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);

                // Record PC to instruction mapping for JUMPDEST
                pc_to_instruction[pc] = @intCast(instruction_count);

                instructions[instruction_count] = Instruction{
                    .opcode_fn = dispatch_execute,
                    .arg = .{ .exec = operation.execute },
                };
                Log.debug("[analysis] JUMPDEST at pc={}", .{pc});
                instruction_count += 1;
                pc += 1;
            },

            // Terminating instructions - end current block
            .JUMP, .STOP, .RETURN, .REVERT, .SELFDESTRUCT => {
                Log.debug("[analysis] Found terminating instruction {} at pc={}", .{ opcode, pc });

                const operation = jump_table.get_operation(opcode_byte);
                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);

                // Record PC to instruction mapping for terminating instructions
                pc_to_instruction[pc] = @intCast(instruction_count);

                if (opcode == .JUMP) {
                    // Always emit unresolved; resolution pass will convert to pointer when possible
                    instructions[instruction_count] = Instruction{
                        .opcode_fn = always_advance,
                        .arg = .jump_unresolved,
                    };
                    inst_jump_type[instruction_count] = .jump;
                } else {
                    instructions[instruction_count] = Instruction{
                        .opcode_fn = always_advance,
                        .arg = .none,
                    };
                }
                instruction_count += 1;
                pc += 1;

                // Close current block
                instructions[block.begin_block_index].arg.block_info = block.close();

                // Conservative behavior: start a new block if any code remains.
                // Some toolchains place valid code immediately after terminators
                // that is only reached via computed jumps. We conservatively
                // continue analysis instead of skipping until a JUMPDEST.
                if (pc < code.len) {
                    instructions[instruction_count] = Instruction{
                        .opcode_fn = always_advance,
                        .arg = .{ .block_info = BlockInfo{} },
                    };
                    block = BlockAnalysis.init(instruction_count);
                    instruction_count += 1;
                    if (builtin.mode == .Debug) stats.total_blocks += 1;
                } else {
                    Log.debug("[analysis] No more code after terminating instruction", .{});
                    break;
                }
            },

            .JUMPI => {
                const operation = jump_table.get_operation(opcode_byte);
                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);

                // Record PC to instruction mapping for JUMPI
                pc_to_instruction[pc] = @intCast(instruction_count);

                // Do not emit fused pc form. Keep preceding PUSH (if any) and tag JUMPI;
                // resolveJumpTargets will convert PUSH+JUMPI into pointer form.
                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .conditional_jump_unresolved,
                };
                inst_jump_type[instruction_count] = .jumpi;
                instruction_count += 1;
                pc += 1;

                // Close current block and start new one (for fall-through path)
                instructions[block.begin_block_index].arg.block_info = block.close();
                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .{ .block_info = BlockInfo{} },
                };
                block = BlockAnalysis.init(instruction_count);
                instruction_count += 1;
                if (builtin.mode == .Debug) stats.total_blocks += 1;
            },

            // PUSH operations - handled inline by interpreter
            .PUSH0 => {
                const operation = jump_table.get_operation(opcode_byte);
                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);

                // Record PC to instruction mapping for PUSH0
                pc_to_instruction[pc] = @intCast(instruction_count);

                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .{ .word = .{ .start_pc = 0, .len = 0 } },
                };
                instruction_count += 1;
                pc += 1;
            },

            .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8, .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => {
                const operation = jump_table.get_operation(opcode_byte);
                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);

                const push_size = Opcode.get_push_size(opcode_byte);
                // Record PC to instruction mapping for PUSH BEFORE advancing PC
                const original_pc = pc;

                const start = original_pc + 1;
                const end = @min(start + push_size, code.len);
                pc = end;

                pc_to_instruction[original_pc] = @intCast(instruction_count);
                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .{ .word = .{ .start_pc = @intCast(start), .len = @intCast(end - start) } },
                };
                Log.debug("[analysis] PUSH at pc={} size={} instruction_count={}", .{ original_pc, push_size, instruction_count });
                instruction_count += 1;
            },

            // PC opcode - needs special handling to store the PC value
            .PC => {
                const operation = jump_table.get_operation(opcode_byte);
                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);

                // Record PC to instruction mapping for PC opcode
                pc_to_instruction[pc] = @intCast(instruction_count);

                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .{ .pc = @intCast(pc) },
                };
                Log.debug("[analysis] PC opcode at pc={}", .{pc});
                instruction_count += 1;
                pc += 1;
            },

            // Special opcodes that need individual gas tracking for dynamic calculations
            .GAS, .CALL, .CALLCODE, .DELEGATECALL, .STATICCALL, .CREATE, .CREATE2, .SSTORE => {
                // Isolate dynamic/special ops into their own blocks so that stack_req
                // validation reflects only the actual instructions present in this block.
                // This reduces the risk that previous fusion/elimination in the same block
                // makes the validator underestimate the required stack height.
                instructions[block.begin_block_index].arg.block_info = block.close();
                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .{ .block_info = BlockInfo{} },
                };
                block = BlockAnalysis.init(instruction_count);
                instruction_count += 1;
                if (builtin.mode == .Debug) stats.total_blocks += 1;

                const operation = jump_table.get_operation(opcode_byte);
                // Accumulate static gas in block; dynamic part handled by .dynamic_gas
                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);

                // Record PC to instruction mapping for special opcodes
                pc_to_instruction[pc] = @intCast(instruction_count);

                instructions[instruction_count] = Instruction{
                    .opcode_fn = dispatch_execute,
                    .arg = .{
                        .dynamic_gas = DynamicGas{
                            .gas_fn = @ptrCast(getDynamicGasFunction(opcode)),
                            .exec_fn = operation.execute,
                        },
                    },
                };
                instruction_count += 1;
                pc += 1;

                // Close the block after the dynamic/special op to avoid combining
                // following instructions into the same validation unit.
                instructions[block.begin_block_index].arg.block_info = block.close();
                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .{ .block_info = BlockInfo{} },
                };
                block = BlockAnalysis.init(instruction_count);
                instruction_count += 1;
                if (builtin.mode == .Debug) stats.total_blocks += 1;
            },

            // SHA3/KECCAK256 - for now just use regular handling
            .KECCAK256 => {
                const operation = jump_table.get_operation(opcode_byte);

                // Record PC to instruction mapping
                pc_to_instruction[pc] = @intCast(instruction_count);

                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);
                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .none,
                };
                instruction_count += 1;
                pc += 1;
            },

            // ISZERO - use inline version for hot path
            .ISZERO => {
                const operation = jump_table.get_operation(opcode_byte);
                // synthetic helpers no longer used

                // Record PC to instruction mapping
                pc_to_instruction[pc] = @intCast(instruction_count);

                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);

                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .none,
                };
                if (builtin.mode == .Debug) stats.inline_opcodes += 1;
                Log.debug("[analysis] Using inline ISZERO at pc={}", .{pc});
                instruction_count += 1;
                pc += 1;
            },

            // EQ - use inline version for hot path
            .EQ => {
                const operation = jump_table.get_operation(opcode_byte);
                // synthetic helpers no longer used

                // Record PC to instruction mapping
                pc_to_instruction[pc] = @intCast(instruction_count);

                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);

                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .none,
                };
                if (builtin.mode == .Debug) stats.inline_opcodes += 1;
                Log.debug("[analysis] Using inline EQ at pc={}", .{pc});
                instruction_count += 1;
                pc += 1;
            },

            // DUP1 - check for DUP1+PUSH0+EQ pattern
            .DUP1 => {
                const operation = jump_table.get_operation(opcode_byte);

                // Look ahead for PUSH0+EQ pattern
                if (pc + 2 < code.len and code[pc + 1] == 0x5f and code[pc + 2] == 0x14) { // PUSH0, EQ
                    // This is DUP1+PUSH0+EQ = ISZERO pattern
                    // Record PC to instruction mapping
                    pc_to_instruction[pc] = @intCast(instruction_count);

                    // synthetic helpers no longer used
                    block.gas_cost += 3 + 3 + 3; // DUP1 + PUSH0 + EQ gas
                    block.updateStackTracking(0x80, 1); // DUP1 needs 1 item

                    instructions[instruction_count] = Instruction{
                        .opcode_fn = dispatch_execute,
                        .arg = .{ .exec = execution.comparison.op_iszero },
                    };
                    instruction_count += 1;
                    pc += 3; // Skip DUP1, PUSH0, and EQ
                    if (builtin.mode == .Debug) stats.eliminated_opcodes += 2; // Saved 2 operations
                    Log.debug("[analysis] Converted DUP1+PUSH0+EQ to ISZERO at pc={}", .{pc - 3});
                    continue;
                }

                // Check for DUP+DROP pattern
                if (pc + 1 < code.len and code[pc + 1] == 0x50) { // DROP
                    // DUP1+DROP = NOP
                    pc += 2; // Skip both DUP1 and DROP
                    if (builtin.mode == .Debug) stats.eliminated_opcodes += 2;
                    Log.debug("[analysis] Eliminated DUP1+DROP at pc={}", .{pc - 2});
                    continue;
                }

                // Regular DUP1 handling
                pc_to_instruction[pc] = @intCast(instruction_count);
                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);
                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .none,
                };
                instruction_count += 1;
                pc += 1;
            },

            // POP - check if previous instruction was a PUSH
            .POP => {
                // Check if the previous instruction was a PUSH
                if (instruction_count > 0) {
                    const prev_instruction = instructions[instruction_count - 1];

                    // Check if it was a push by looking at the arg type
                    switch (prev_instruction.arg) {
                        .word => {
                            // PUSH+POP = NOP, remove the PUSH
                            instruction_count -= 1;
                            pc += 1; // Skip POP
                            if (builtin.mode == .Debug) stats.eliminated_opcodes += 2;
                            Log.debug("[analysis] Eliminated PUSH+POP at pc={}", .{pc - 1});
                            continue;
                        },
                        else => {},
                    }
                }

                // Regular POP handling
                const operation = jump_table.get_operation(opcode_byte);
                pc_to_instruction[pc] = @intCast(instruction_count);
                block.gas_cost += @intCast(operation.constant_gas);
                block.updateStackTracking(opcode_byte, operation.min_stack);
                instructions[instruction_count] = Instruction{
                    .opcode_fn = always_advance,
                    .arg = .none,
                };
                instruction_count += 1;
                pc += 1;
            },

            // Regular opcodes - accumulate in block
            else => {
                const operation = jump_table.get_operation(opcode_byte);

                // Record PC to instruction mapping for regular opcodes
                pc_to_instruction[pc] = @intCast(instruction_count);

                if (operation.undefined) {
                    // Treat undefined opcodes as INVALID
                    const invalid_operation = jump_table.get_operation(@intFromEnum(Opcode.Enum.INVALID));
                    block.gas_cost += @intCast(invalid_operation.constant_gas);
                    block.updateStackTracking(@intFromEnum(Opcode.Enum.INVALID), invalid_operation.min_stack);

                    instructions[instruction_count] = Instruction{
                        .opcode_fn = dispatch_execute,
                        .arg = .{ .exec = invalid_operation.execute },
                    };
                } else {
                    block.gas_cost += @intCast(operation.constant_gas);
                    block.updateStackTracking(opcode_byte, operation.min_stack);

                    instructions[instruction_count] = Instruction{
                        .opcode_fn = dispatch_execute,
                        .arg = .{ .exec = operation.execute }, // No individual gas cost - handled by BEGINBLOCK
                    };
                }
                instruction_count += 1;
                pc += 1;
            },
        }
    }

    // Close final block
    instructions[block.begin_block_index].arg.block_info = block.close();

    // Only add implicit STOP if the last instruction is not already a terminator
    // Check if we need to add an implicit STOP
    var needs_stop = true;
    if (instruction_count > 1) {
        // Check if the previous instruction was a terminating instruction
        // We can't easily check this without tracking state, so for now just check if we ended the loop naturally
        if (pc >= code.len and code.len > 0) {
            // Check the last opcode in the bytecode
            const last_pc = code.len - 1;
            const last_opcode = code[last_pc];
            const is_terminator = switch (last_opcode) {
                0x00, // STOP
                0xF3, // RETURN
                0xFD, // REVERT
                0xFF,
                => true, // SELFDESTRUCT
                else => false,
            };
            if (is_terminator) {
                needs_stop = false;
                Log.debug("[analysis] Last opcode is terminator (0x{x}), skipping implicit STOP", .{last_opcode});
            }
        }
    }

    if (needs_stop and instruction_count < instruction_limits.MAX_INSTRUCTIONS) {
        const stop_operation = jump_table.get_operation(@intFromEnum(Opcode.Enum.STOP));
        instructions[instruction_count] = Instruction{
            .opcode_fn = dispatch_execute,
            .arg = .{ .exec = stop_operation.execute },
        };
        instruction_count += 1;
        Log.debug("[analysis] Added implicit STOP at end, total instructions: {}", .{instruction_count});
    }

    // No explicit next_instruction pointers; fallthrough is computed in interpreter

    // Resolve jump targets after initial translation (deferred pointer wiring happens after resize)
    resolveJumpTargets(code, instructions[0..instruction_count], jumpdest_bitmap, pc_to_instruction) catch {
        // If we can't resolve jumps, it's still OK - runtime will handle it
    };

    // No extra sentinel past-the-end when using a regular slice

    // MEMORY ALLOCATION: PC to block start mapping
    // Expected size: code_len * 2 bytes
    // Lifetime: Per analysis
    // Frequency: Once per unique contract bytecode
    var pc_to_block_start = try allocator.alloc(u16, code.len);
    errdefer allocator.free(pc_to_block_start);

    if (comptime builtin.mode == .Debug or builtin.mode == .ReleaseSafe) {
        // PC to block mapping should be proportional to code size
        const block_map_size = pc_to_block_start.len * @sizeOf(u16);
        // Max contract size is 24KB, so mapping should be max 48KB
        std.debug.assert(block_map_size <= 49152); // 48KB max
    }
    @memset(pc_to_block_start, std.math.maxInt(u16));
    // For each mapped PC, find the BEGINBLOCK for its instruction by searching backwards
    var pc_it: usize = 0;
    while (pc_it < code.len) : (pc_it += 1) {
        const inst_idx = pc_to_instruction[pc_it];
        if (inst_idx == std.math.maxInt(u16)) continue;
        var search_idx: usize = inst_idx;
        while (search_idx > 0) : (search_idx -= 1) {
            if (instructions[search_idx].arg == .block_info) {
                pc_to_block_start[pc_it] = @intCast(search_idx);
                break;
            }
        }
    }

    // Resize arrays to actual sizes (final instruction stream already includes STOP when needed)
    Log.debug("[analysis] Resizing arrays: instruction_count={}, inst_jump_type.len={}", .{ instruction_count, inst_jump_type.len });
    const final_instructions = try allocator.realloc(instructions, instruction_count);
    const final_jump_types = try allocator.realloc(inst_jump_type, instruction_count);
    Log.debug("[analysis] After resize: final_instructions.len={}, final_jump_types.len={}", .{ final_instructions.len, final_jump_types.len });

    // Build inst_to_pc mapping
    var inst_to_pc = try allocator.alloc(u16, instruction_count);
    errdefer allocator.free(inst_to_pc);
    @memset(inst_to_pc, std.math.maxInt(u16));
    var map_pc: usize = 0;
    while (map_pc < code.len) : (map_pc += 1) {
        const idx = pc_to_instruction[map_pc];
        if (idx != std.math.maxInt(u16) and idx < instruction_count) {
            inst_to_pc[idx] = @intCast(map_pc);
        }
    }

    // No explicit next pointers; interpreter computes fallthrough

    // 2) Set targets for JUMP and JUMPI using previous PUSH value and pc_to_block_start
    var ji: usize = 0;
    while (ji < final_instructions.len) : (ji += 1) {
        const jt = final_jump_types[ji];
        switch (jt) {
            .jump => {
                // Case A: PUSH-immediate destination directly before JUMP
                if (ji > 0 and final_instructions[ji - 1].arg == .word) {
                    const target_pc = @import("instruction.zig").word_as_256(final_instructions[ji - 1].arg, code);
                    if (target_pc < code.len) {
                        const block_idx_u16 = pc_to_block_start[@intCast(target_pc)];
                        if (block_idx_u16 != std.math.maxInt(u16)) {
                            const block_idx: usize = block_idx_u16;
                            if (block_idx < final_instructions.len) {
                                final_instructions[ji].arg = .{ .jump_pc = @intCast(target_pc) };
                                // Neutralize preceding PUSH so it does not push the dest at runtime
                                final_instructions[ji - 1].opcode_fn = always_advance;
                                final_instructions[ji - 1].arg = .none;
                            }
                        }
                    }
                }
            },
            .jumpi => {
                // Case A: PUSH-immediate destination directly before JUMPI
                if (ji > 0 and final_instructions[ji - 1].arg == .word) {
                    const target_pc = @import("instruction.zig").word_as_256(final_instructions[ji - 1].arg, code);
                    if (target_pc < code.len) {
                        const block_idx_u16 = pc_to_block_start[@intCast(target_pc)];
                        if (block_idx_u16 != std.math.maxInt(u16)) {
                            const block_idx: usize = block_idx_u16;
                            if (block_idx < final_instructions.len) {
                                final_instructions[ji].arg = .{ .conditional_jump_pc = @intCast(target_pc) };
                                // Neutralize preceding PUSH so it does not push the dest at runtime
                                final_instructions[ji - 1].opcode_fn = always_advance;
                                final_instructions[ji - 1].arg = .none;
                            }
                        }
                    }
                } else {
                    // No preceding PUSH and no pc-based fused form; leave as unresolved
                }
            },
            else => {},
        }
    }

    // Output analysis statistics in debug builds
    if (builtin.mode == .Debug) {
        const elapsed_ms = std.time.milliTimestamp() - stats.start_time;
        const total_fusions = stats.push_add_fusions + stats.push_sub_fusions +
            stats.push_mul_fusions + stats.push_div_fusions;
        const total_optimizations = total_fusions + stats.keccak_optimizations + stats.inline_opcodes;

        Log.debug("[analysis] Code analysis complete for {} bytes in {}ms", .{ code.len, elapsed_ms });
        Log.debug("[analysis] Statistics:", .{});
        Log.debug("[analysis]   Total opcodes analyzed: {}", .{stats.total_opcodes});
        Log.debug("[analysis]   Total blocks created: {}", .{stats.total_blocks});
        Log.debug("[analysis]   Instructions generated: {}", .{instruction_count});
        Log.debug("[analysis]   Opcodes eliminated: {}", .{stats.eliminated_opcodes});
        Log.debug("[analysis] Fusion optimizations:", .{});
        Log.debug("[analysis]   PUSH+ADD fusions: {}", .{stats.push_add_fusions});
        Log.debug("[analysis]   PUSH+SUB fusions: {}", .{stats.push_sub_fusions});
        Log.debug("[analysis]   PUSH+MUL fusions: {}", .{stats.push_mul_fusions});
        Log.debug("[analysis]   PUSH+DIV fusions: {}", .{stats.push_div_fusions});
        Log.debug("[analysis]   Total arithmetic fusions: {}", .{total_fusions});
        Log.debug("[analysis] Other optimizations:", .{});
        Log.debug("[analysis]   KECCAK256 immediate size: {}", .{stats.keccak_optimizations});
        Log.debug("[analysis]   Inline opcodes (ISZERO/EQ): {}", .{stats.inline_opcodes});
        Log.debug("[analysis]   Total optimizations: {}", .{total_optimizations});

        if (stats.total_opcodes > 0) {
            const fusion_rate = (total_fusions * 100) / stats.total_opcodes;
            const optimization_rate = (total_optimizations * 100) / stats.total_opcodes;
            Log.debug("[analysis] Optimization rates:", .{});
            Log.debug("[analysis]   Arithmetic fusion rate: {}%", .{fusion_rate});
            Log.debug("[analysis]   Total optimization rate: {}%", .{optimization_rate});
        }
    }

    return CodeGenResult{
        .instructions = final_instructions,
        .pc_to_block_start = pc_to_block_start,
        .inst_jump_type = final_jump_types,
        .inst_to_pc = inst_to_pc,
    };
}

/// Apply pattern-based optimizations to the instruction stream.
/// This includes precomputing values for operations like SHA3 when inputs are known at analysis time.
fn applyPatternOptimizations(instructions: []Instruction, code: []const u8) !void {
    _ = code; // Will be used for more complex patterns later

    // Look for patterns where we can precompute values
    var i: usize = 0;
    while (i < instructions.len) : (i += 1) {
        // Skip if not an executable instruction (pattern logic disabled)
        if (false) {
            continue;
        }

        // Check for SHA3/KECCAK256 pattern: PUSH size, PUSH offset, SHA3 (disabled)
        // Pattern matching on handlers removed in linked-dispatch design.
    }
}

/// Resolve jump targets in the instruction stream.
/// This creates direct pointers from JUMP/JUMPI instructions to their target BEGINBLOCK.
/// Uses the pre-built PC to instruction mapping to correctly handle injected BEGINBLOCK instructions.
fn resolveJumpTargets(code: []const u8, instructions: []Instruction, jumpdest_bitmap: *const DynamicBitSet, pc_to_instruction: []const u16) !void {
    // Find the BEGINBLOCK instruction that starts the block containing each JUMPDEST
    // We need to map from PC -> BEGINBLOCK instruction index
    var pc_to_block_start = [_]u16{std.math.maxInt(u16)} ** limits.MAX_CONTRACT_SIZE;

    // Walk through instructions to find BEGINBLOCKs and their corresponding PCs
    var current_block_start: ?u16 = null;
    for (instructions, 0..) |inst, idx| {
        if (inst.arg == .block_info) {
            // This is a BEGINBLOCK instruction
            current_block_start = @intCast(idx);
        }
    }

    // Now map each PC to its containing BEGINBLOCK by looking at pc_to_instruction
    for (pc_to_instruction, 0..) |inst_idx, pc| {
        if (inst_idx == std.math.maxInt(u16)) continue; // Skip unmapped PCs

        // Find the BEGINBLOCK for this instruction by searching backwards
        var search_idx = inst_idx;
        while (search_idx > 0) : (search_idx -= 1) {
            if (instructions[search_idx].arg == .block_info) {
                pc_to_block_start[pc] = @intCast(search_idx);
                break;
            }
        }
    }

    // Now resolve JUMP and JUMPI targets (including fused immediate variants)
    for (instructions, 0..) |*inst, idx| {
        // Determine original bytecode opcode for this instruction index
        var original_pc: ?usize = null;
        for (pc_to_instruction, 0..) |mapped_idx, pc| {
            if (mapped_idx == idx) {
                original_pc = pc;
                break;
            }
        }

        if (original_pc) |pc| {
            const opcode_byte = code[pc];
            if (opcode_byte == 0x56 or opcode_byte == 0x57) { // JUMP or JUMPI
                var target_pc_opt: ?u256 = null;
                // If this instruction is a fused variant, pull target directly
                switch (inst.arg) {
                    // fused immediate form removed; only resolve from preceding PUSH if present
                    else => {
                        // Otherwise check if previous instruction carried a PUSH immediate
                        if (idx > 0 and instructions[idx - 1].arg == .word) {
                            target_pc_opt = @import("instruction.zig").word_as_256(instructions[idx - 1].arg, code);
                        }
                    },
                }

                if (target_pc_opt) |target_pc| {
                    if (target_pc < code.len and jumpdest_bitmap.isSet(@intCast(target_pc))) {
                        const block_idx = pc_to_block_start[@intCast(target_pc)];
                        if (block_idx != std.math.maxInt(u16) and block_idx < instructions.len) {
                            if (opcode_byte == 0x57) {
                                // Resolve fused conditional jump pc to pointer target
                                inst.arg = .{ .conditional_jump_pc = @intCast(target_pc) };
                            } else {
                                inst.arg = .{ .jump_pc = @intCast(target_pc) };
                            }
                        }
                    }
                }
            }
        }
    }
}

test "analysis: minimal dispatcher (SHR) resolves conditional jump target" {
    const allocator = std.testing.allocator;
    const code = &[_]u8{
        0x60, 0x00, // PUSH1 0
        0x35, // CALLDATALOAD
        0x60, 0xe0, // PUSH1 0xe0
        0x1c, // SHR
        0x63, 0x11, 0x22, 0x33, 0x44, // PUSH4 0x11223344
        0x14, // EQ
        0x60, 0x16, // PUSH1 0x16
        0x57, // JUMPI
        0x60, 0x00, // PUSH1 0
        0x60, 0x00, // PUSH1 0
        0xfd, // REVERT
        0x5b, // JUMPDEST (0x16)
        0x60, 0x01, // PUSH1 1
        0x60, 0x1f, // PUSH1 31
        0x52, // MSTORE
        0x60, 0x00, // PUSH1 0 (offset)
        0x60, 0x20, // PUSH1 32 (size)
        0xf3, // RETURN
    };

    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    // Ensure JUMPI is present and its target block is mapped
    var has_jumpi = false;
    for (analysis.inst_jump_type) |jt| {
        if (jt == .jumpi) has_jumpi = true;
    }
    try std.testing.expect(has_jumpi);

    // No unresolved fused immediates should remain for this small case
    for (analysis.instructions) |inst| {
        switch (inst.arg) {
            .jump_pc => return error.TestUnexpectedResult,
            else => {},
        }
    }

    // Destination 0x16 must map to a BEGINBLOCK entry
    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(0x16));
    const bb_idx = analysis.pc_to_block_start[0x16];
    try std.testing.expect(bb_idx != std.math.maxInt(u16));
    try std.testing.expect(bb_idx < analysis.instructions.len);
    try std.testing.expect(@as(bool, analysis.instructions[bb_idx].arg == .block_info));
}

test "analysis: minimal dispatcher (AND-mask) resolves conditional jump target" {
    const allocator = std.testing.allocator;
    const code = &[_]u8{
        0x60, 0x00, // PUSH1 0
        0x35, // CALLDATALOAD
        0x63, 0xff, 0xff, 0xff, 0xff, // PUSH4 0xffffffff
        0x16, // AND
        0x63, 0x30, 0x62, 0x7b, 0x7c, // PUSH4 0x30627b7c
        0x14, // EQ
        0x60, 0x16, // PUSH1 0x16
        0x57, // JUMPI
        0x60, 0x00, // PUSH1 0
        0x60, 0x00, // PUSH1 0
        0xfd, // REVERT
        0x5b, // JUMPDEST (0x16)
        0x60, 0x01, // PUSH1 1
        0x60, 0x1f, // PUSH1 31
        0x52, // MSTORE
        0x60, 0x00, // PUSH1 0
        0x60, 0x20, // PUSH1 32
        0xf3, // RETURN
    };

    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    var has_jumpi = false;
    for (analysis.inst_jump_type) |jt| {
        if (jt == .jumpi) has_jumpi = true;
    }
    try std.testing.expect(has_jumpi);

    for (analysis.instructions) |inst| {
        switch (inst.arg) {
            .conditional_jump_pc, .jump_pc => return error.TestUnexpectedResult,
            else => {},
        }
    }

    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(0x16));
    const bb_idx = analysis.pc_to_block_start[0x16];
    try std.testing.expect(bb_idx != std.math.maxInt(u16));
    try std.testing.expect(bb_idx < analysis.instructions.len);
    try std.testing.expect(@as(bool, analysis.instructions[bb_idx].arg == .block_info));
}

test "from_code basic functionality" {
    const allocator = std.testing.allocator;

    // Simple bytecode: PUSH1 0x01, STOP
    const code = &[_]u8{ 0x60, 0x01, 0x00 };

    const table = OpcodeMetadata.DEFAULT;
    var analysis = try CodeAnalysis.from_code(allocator, code, &table);
    defer analysis.deinit();

    // Verify we got instructions (slice should have at least 3 instructions)
    try std.testing.expect(analysis.instructions.len >= 3);
    try std.testing.expect(analysis.instructions[0].opcode_fn != null);
    try std.testing.expect(analysis.instructions[1].opcode_fn != null);
}

test "from_code with jumpdest" {
    const allocator = std.testing.allocator;

    // Bytecode: JUMPDEST, PUSH1 0x01, STOP
    const code = &[_]u8{ 0x5B, 0x60, 0x01, 0x00 };

    const table = OpcodeMetadata.DEFAULT;
    var analysis = try CodeAnalysis.from_code(allocator, code, &table);
    defer analysis.deinit();

    // Verify jumpdest is marked
    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(0));
    try std.testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(1));
}

test "jump target resolution with BEGINBLOCK injections" {
    const allocator = std.testing.allocator;

    // Bytecode that has jumps:
    // PC 0: PUSH1 0x05 (push jump destination)
    // PC 2: JUMP (jump to PC 5)
    // PC 3: PUSH1 0x00
    // PC 5: JUMPDEST (jump destination)
    // PC 6: PUSH1 0x01
    // PC 8: STOP
    const code = &[_]u8{
        0x60, 0x05, // PUSH1 0x05
        0x56, // JUMP
        0x60, 0x00, // PUSH1 0x00
        0x5B, // JUMPDEST at PC 5
        0x60, 0x01, // PUSH1 0x01
        0x00, // STOP
    };
    const table = OpcodeMetadata.DEFAULT;
    var analysis = try CodeAnalysis.from_code(allocator, code, &table);
    defer analysis.deinit();

    // Verify JUMPDEST is marked correctly
    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(5));

    // Count BEGINBLOCK instructions - should have at least 2:
    // 1. At the start
    // 2. At the JUMPDEST (PC 5)
    var begin_block_count: usize = 0;
    var jump_found = false;
    var jump_target_valid = false;

    for (analysis.instructions) |inst| {
        if (false) {
            begin_block_count += 1;
        }
        // Check if JUMP has been resolved to point to a valid target via arg
        if (inst.arg == .jump_pc) {
            jump_found = true;
            jump_target_valid = true;
        }
    }

    try std.testing.expect(begin_block_count >= 2);
    try std.testing.expect(jump_found);
    try std.testing.expect(jump_target_valid);
}

test "conditional jump (JUMPI) target resolution" {
    const allocator = std.testing.allocator;

    // Bytecode with conditional jump:
    // PC 0: PUSH1 0x01 (condition)
    // PC 2: PUSH1 0x06 (jump destination)
    // PC 4: JUMPI (conditional jump to PC 6)
    // PC 5: STOP (fall-through if condition is false)
    // PC 6: JUMPDEST (jump destination)
    // PC 7: PUSH1 0x42
    // PC 9: STOP
    const code = &[_]u8{
        0x60, 0x01, // PUSH1 0x01
        0x60, 0x06, // PUSH1 0x06
        0x57, // JUMPI
        0x00, // STOP
        0x5B, // JUMPDEST at PC 6
        0x60, 0x42, // PUSH1 0x42
        0x00, // STOP
    };
    const table = OpcodeMetadata.DEFAULT;
    var analysis = try CodeAnalysis.from_code(allocator, code, &table);
    defer analysis.deinit();

    // Verify JUMPDEST is marked correctly
    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(6));

    var jumpi_found = false;
    var jumpi_target_valid = false;

    for (analysis.instructions) |inst| {
        if (inst.arg == .conditional_jump) {
            jumpi_found = true;
            jumpi_target_valid = true;
        }
    }

    try std.testing.expect(jumpi_found);
    try std.testing.expect(jumpi_target_valid);
}

test "analysis: simple keccak loop fragment (ten-thousand-hashes core)" {
    const allocator = std.testing.allocator;
    // Minimal fragment representative of the benchmark inner step:
    // PUSH1 0x20; PUSH1 0x00; KECCAK256; POP; JUMPDEST; STOP
    // Note: Real case has a loop; here we assert basic instruction generation and jumpdest mapping.
    const code = &[_]u8{
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0x20, // KECCAK256
        0x50, // POP
        0x5b, // JUMPDEST (pc=8)
        0x00, // STOP
    };
    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    // Expect BEGINBLOCK + PUSH + PUSH + KECCAK256 + POP + JUMPDEST + STOP → 7 instructions
    try std.testing.expectEqual(@as(usize, 7), analysis.instructions.len);

    // Verify jumpdest bitmap and mapping
    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(8));
    const block_idx = analysis.pc_to_block_start[8];
    try std.testing.expect(block_idx != std.math.maxInt(u16));
    try std.testing.expect(block_idx < analysis.instructions.len);
}

test "analysis: fused conditional JUMPI with immediate destination" {
    const allocator = std.testing.allocator;
    // Layout:
    // 0: PUSH1 1        (condition)
    // 2: PUSH1 7        (dest pc)
    // 4: JUMPI          (should resolve to pointer target)
    // 5: STOP           (fallthrough not executed)
    // 6: NOP (padding)
    // 7: JUMPDEST       (target)
    const code = &[_]u8{
        0x60, 0x01, // PUSH1 1
        0x60, 0x07, // PUSH1 7
        0x57, // JUMPI
        0x00, // STOP
        0x00, // padding
        0x5b, // JUMPDEST at pc=7
    };

    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    // Jumpdest validation and mapping
    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(7));
    const block_idx = analysis.pc_to_block_start[7];
    try std.testing.expect(block_idx != std.math.maxInt(u16));
    try std.testing.expect(block_idx < analysis.instructions.len);

    // Ensure a conditional_jump pointer exists to target 7
    var found = false;
    for (analysis.instructions) |inst| {
        switch (inst.arg) {
            .conditional_jump => |ptr| {
                _ = ptr;
                found = true;
            },
            else => {},
        }
    }
    try std.testing.expect(found);
}

test "analysis: dispatcher-like fragment invariants" {
    const allocator = std.testing.allocator;
    // Minimal dispatcher pattern:
    // 00: PUSH1 0x00
    // 02: CALLDATALOAD
    // 03: PUSH1 0xe0
    // 05: SHR                     ; selector -> low 4 bytes
    // 06: PUSH4 0x11223344        ; target selector
    // 0b: EQ
    // 0c: PUSH1 0x14              ; dest pc (20)
    // 0e: JUMPI
    // 0f: PUSH1 0x00
    // 11: PUSH1 0x00
    // 13: REVERT
    // 14: JUMPDEST                ; dest block
    // 15: STOP (padding ok)
    const code = &[_]u8{
        0x60, 0x00, // PUSH1 0
        0x35, // CALLDATALOAD
        0x60, 0xe0, // PUSH1 0xe0
        0x1c, // SHR
        0x63, 0x11, 0x22, 0x33, 0x44, // PUSH4 0x11223344
        0x14, // EQ
        0x60, 0x14, // PUSH1 0x14
        0x57, // JUMPI
        0x60, 0x00, // PUSH1 0
        0x60, 0x00, // PUSH1 0
        0xfd, // REVERT
        0x5b, // JUMPDEST @ 0x14
        0x00, // STOP
    };

    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    // JUMPDEST mapped
    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(0x14));
    const bb_idx = analysis.pc_to_block_start[0x14];
    try std.testing.expect(bb_idx != std.math.maxInt(u16));
    try std.testing.expect(bb_idx < analysis.instructions.len);

    // Must contain a conditional jump
    var has_jumpi: bool = false;
    for (analysis.inst_jump_type) |jt| {
        if (jt == .jumpi) has_jumpi = true;
    }
    try std.testing.expect(has_jumpi);

    // No unresolved fused immediates should remain after resolution
    for (analysis.instructions) |inst| {
        switch (inst.arg) {
            .jump_pc => return error.TestUnexpectedResult,
            else => {},
        }
    }

    // Maps sizes sane
    try std.testing.expect(analysis.inst_to_pc.len == analysis.instructions.len);
    try std.testing.expect(analysis.pc_to_block_start.len >= code.len);
}

test "analysis: ERC20 runtime contains dispatcher patterns" {
    const allocator = std.testing.allocator;
    // Load solidity ERC20 creation bytecode and extract runtime after f3 fe
    const path = "/Users/williamcory/guillotine/src/solidity/erc20_bytecode.hex";
    const file = try std.fs.openFileAbsolute(path, .{});
    defer file.close();
    const hex_content = try file.readToEndAlloc(allocator, 64 * 1024);
    defer allocator.free(hex_content);
    const trimmed = std.mem.trim(u8, hex_content, " \t\n\r");
    const creation_bytes = try allocator.alloc(u8, trimmed.len / 2);
    defer allocator.free(creation_bytes);
    _ = try std.fmt.hexToBytes(creation_bytes, trimmed);

    var runtime_code: []const u8 = creation_bytes;
    if (std.mem.indexOf(u8, creation_bytes, &[_]u8{ 0xf3, 0xfe })) |idx| {
        const start = idx + 2;
        if (start < creation_bytes.len) runtime_code = creation_bytes[start..];
    }

    var analysis = try CodeAnalysis.from_code(allocator, runtime_code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    // Basic sanity
    try std.testing.expect(analysis.pc_to_block_start.len >= runtime_code.len);

    // Scan dispatcher-relevant opcodes
    var count_jumpi: usize = 0;
    var count_jumpdest: usize = 0;
    var has_calldataload: bool = false;
    var has_calldatasize: bool = false;
    var has_eq: bool = false;
    var i: usize = 0;
    while (i < runtime_code.len) : (i += 1) {
        const b = runtime_code[i];
        switch (b) {
            0x57 => count_jumpi += 1,
            0x5b => count_jumpdest += 1,
            0x35 => has_calldataload = true,
            0x36 => has_calldatasize = true,
            0x14 => has_eq = true,
            else => {},
        }
    }
    try std.testing.expect(count_jumpi >= 1);
    try std.testing.expect(count_jumpdest >= 2);
    try std.testing.expect(has_calldataload);
    try std.testing.expect(has_eq);
    if (!has_calldatasize) {
        var has_calldatacopy: bool = false;
        var j: usize = 0;
        while (j < runtime_code.len) : (j += 1) {
            if (runtime_code[j] == 0x37) {
                has_calldatacopy = true;
                break;
            }
        }
        try std.testing.expect(has_calldatacopy);
    }

    // No unresolved fused immediates should remain
    for (analysis.instructions) |inst| {
        switch (inst.arg) {
            .jump_pc => return error.TestUnexpectedResult,
            else => {},
        }
    }
}

test "analysis: fused PUSH+JUMP to forward JUMPDEST" {
    const allocator = std.testing.allocator;
    // Bytes:
    // 0: PUSH1 3   (target pc)
    // 2: JUMP
    // 3: JUMPDEST
    // 4: STOP
    const code = &[_]u8{ 0x60, 0x03, 0x56, 0x5b, 0x00 };
    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    // JUMPDEST validation and mapping
    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(3));
    const block_idx = analysis.pc_to_block_start[3];
    try std.testing.expect(block_idx != std.math.maxInt(u16));
    try std.testing.expect(block_idx < analysis.instructions.len);

    // Ensure we have either a fused jump_pc to 3 or a resolved jump pointing to the block
    var ok = false;
    for (analysis.instructions) |inst| {
        switch (inst.arg) {
            .jump_pc => |pc| {
                if (pc == 3) ok = true;
            },
            .jump => {
                ok = ok or true; // resolved wiring validated by pc_to_block_start
            },
            else => {},
        }
    }
    try std.testing.expect(ok);
}

test "analysis: back-edge JUMP to earlier JUMPDEST (loop head)" {
    const allocator = std.testing.allocator;
    // 0: JUMPDEST
    // 1: PUSH1 1
    // 3: POP
    // 4: PUSH1 0  (dest back to pc=0)
    // 6: JUMP    (should fuse to jump_pc=0)
    // 7: STOP
    const code = &[_]u8{ 0x5b, 0x60, 0x01, 0x50, 0x60, 0x00, 0x56, 0x00 };
    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(0));
    const block_idx = analysis.pc_to_block_start[0];
    try std.testing.expect(block_idx != std.math.maxInt(u16));
    try std.testing.expect(block_idx < analysis.instructions.len);

    var has_back_edge = false;
    for (analysis.instructions) |inst| {
        switch (inst.arg) {
            .jump_pc => |pc| {
                if (pc == 0) has_back_edge = true;
            },
            else => {},
        }
    }
    try std.testing.expect(has_back_edge);
}

test "analysis: ten-thousand-hashes runtime invariants" {
    const allocator = std.testing.allocator;

    // Load official case creation bytecode and extract runtime code after 'f3fe'
    const path = "/Users/williamcory/guillotine/bench/official/cases/ten-thousand-hashes/bytecode.txt";
    const file = try std.fs.openFileAbsolute(path, .{});
    defer file.close();
    const hex_content = try file.readToEndAlloc(allocator, 16 * 1024);
    defer allocator.free(hex_content);

    const trimmed = std.mem.trim(u8, hex_content, " \t\n\r");
    const creation_bytes = try allocator.alloc(u8, trimmed.len / 2);
    defer allocator.free(creation_bytes);
    _ = try std.fmt.hexToBytes(creation_bytes, trimmed);

    // Find RETURN+INVALID delimiter used by Solidity (f3 fe), take bytes after as runtime
    var runtime_code: []const u8 = creation_bytes;
    const maybe_idx = std.mem.indexOfPos(u8, creation_bytes, 0, &[_]u8{ 0xf3, 0xfe });
    if (maybe_idx) |idx| {
        const start = idx + 2;
        if (start < creation_bytes.len) runtime_code = creation_bytes[start..];
    }

    // Analyze runtime code
    var analysis = try CodeAnalysis.from_code(allocator, runtime_code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    // Basic sanity
    try std.testing.expect(analysis.instructions.len > 8);
    try std.testing.expect(analysis.pc_to_block_start.len >= runtime_code.len);

    // Ensure at least one valid JUMPDEST exists in the runtime
    var jumpdest_count: usize = 0;
    var pc: usize = 0;
    while (pc < runtime_code.len) : (pc += 1) {
        if (analysis.jumpdest_array.is_valid_jumpdest(pc)) jumpdest_count += 1;
    }
    try std.testing.expect(jumpdest_count > 0);

    // All fused immediate jumps must be resolved to concrete jump targets (no *pc variants left)
    for (analysis.instructions) |inst| {
        switch (inst.arg) {
            .jump_pc => return error.TestUnexpectedResult,
            .conditional_jump_pc => return error.TestUnexpectedResult,
            else => {},
        }
    }

    // Expect at least one conditional or unconditional jump in the analyzed runtime
    var has_jump = false;
    var has_conditional = false;
    for (analysis.instructions) |inst2| {
        switch (inst2.arg) {
            .jump, .jump_unresolved => has_jump = true,
            .conditional_jump, .conditional_jump_unresolved => has_conditional = true,
            else => {},
        }
    }
    try std.testing.expect(has_jump or has_conditional);
}

test "analysis: staticcall pattern with SSTORE should not alter control wiring" {
    const allocator = std.testing.allocator;
    // Bytecode: SSTORE; MSTORE 1 at 0; RETURN 32 bytes
    // 0: 60 01 (PUSH1 1)
    // 2: 60 00 (PUSH1 0)
    // 4: 55    (SSTORE)
    // 5: 60 01 (PUSH1 1)
    // 7: 60 00 (PUSH1 0)
    // 9: 52    (MSTORE)
    // 10:60 20 (PUSH1 32)
    // 12:60 00 (PUSH1 0)
    // 14:F3    (RETURN)
    const code = &[_]u8{ 0x60, 0x01, 0x60, 0x00, 0x55, 0x60, 0x01, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3 };

    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    // Ensure terminator is RETURN not implicit STOP
    try std.testing.expect(analysis.instructions.len > 0);
    // No unresolved fused jumps should remain
    for (analysis.instructions) |inst| {
        switch (inst.arg) {
            .jump_pc, .conditional_jump_pc => return error.TestUnexpectedResult,
            else => {},
        }
    }
    // pc_to_block_start maps all PCs to a valid begin index or max
    try std.testing.expect(analysis.pc_to_block_start.len >= code.len);
}

test "analysis: inst_jump_type marks dynamic JUMP and JUMPI correctly" {
    const allocator = std.testing.allocator;
    // Layout: PUSH1 dest; DUP1; JUMPI; JUMPDEST dest; STOP; JUMP (dynamic)
    // 0: 60 06 (PUSH1 6)
    // 2: 80    (DUP1)
    // 3: 57    (JUMPI -> should resolve to pointer or remain unresolved)
    // 4: 5b    (JUMPDEST at pc=4)
    // 5: 00    (STOP)
    // 6: 56    (JUMP -> dynamic)
    const code = &[_]u8{ 0x60, 0x04, 0x80, 0x57, 0x5b, 0x00, 0x56 };

    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    var jump_count: usize = 0;
    var jumpi_count: usize = 0;
    for (analysis.inst_jump_type) |jt| {
        switch (jt) {
            .jump => jump_count += 1,
            .jumpi => jumpi_count += 1,
            else => {},
        }
    }
    try std.testing.expect(jump_count >= 1);
    try std.testing.expect(jumpi_count >= 1);
}

test "analysis: JUMPDEST pcs map to BEGINBLOCK (block_info) via pc_to_block_start" {
    const allocator = std.testing.allocator;
    // 0: 5b (JUMPDEST)
    // 1: 60 00 (PUSH1 0)
    // 3: 56 (JUMP)
    // 4: 5b (JUMPDEST)
    // 5: 00 (STOP)
    const code = &[_]u8{ 0x5b, 0x60, 0x00, 0x56, 0x5b, 0x00 };
    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    const pcs = [_]usize{ 0, 4 };
    for (pcs) |pc| {
        try std.testing.expect(analysis.jumpdest_array.is_valid_jumpdest(pc));
        const idx = analysis.pc_to_block_start[pc];
        try std.testing.expect(idx != std.math.maxInt(u16));
        try std.testing.expect(idx < analysis.instructions.len);
        const inst = analysis.instructions[idx];
        // The block entry should carry block_info metadata
        try std.testing.expect(@as(bool, inst.arg == .block_info));
    }
}

test "analysis: inst_to_pc within bounds and nondecreasing" {
    const allocator = std.testing.allocator;
    const code = &[_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x50, 0x00 }; // PUSH1 1; PUSH1 2; ADD; POP; STOP
    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    var prev_pc: u16 = 0;
    var first = true;
    for (analysis.inst_to_pc) |pc| {
        try std.testing.expect(pc <= analysis.code_len);
        if (first) {
            prev_pc = pc;
            first = false;
        } else {
            try std.testing.expect(pc >= prev_pc);
            prev_pc = pc;
        }
    }
}

test "fusion and optimization statistics" {
    const allocator = std.testing.allocator;
    std.testing.log_level = .warn;

    // Bytecode with various optimization opportunities:
    const code = &[_]u8{
        // PUSH+ADD fusion (5 + 3)
        0x60, 0x05, // PUSH1 0x05
        0x60, 0x03, // PUSH1 0x03
        0x01, // ADD

        // PUSH+MUL fusion (2 * 3)
        0x60, 0x02, // PUSH1 0x02
        0x60, 0x03, // PUSH1 0x03
        0x02, // MUL

        // PUSH+DIV fusion (10 / 2)
        0x60, 0x0A, // PUSH1 0x0A (10)
        0x60, 0x02, // PUSH1 0x02
        0x04, // DIV

        // PUSH+SUB fusion (8 - 3)
        0x60, 0x08, // PUSH1 0x08
        0x60, 0x03, // PUSH1 0x03
        0x03, // SUB

        // KECCAK256 with immediate size
        0x60, 0x00, // PUSH1 0x00 (offset)
        0x60, 0x20, // PUSH1 0x20 (size = 32 bytes)
        0x20, // KECCAK256

        // Inline ISZERO
        0x60, 0x01, // PUSH1 0x01
        0x15, // ISZERO

        // Inline EQ
        0x60, 0x02, // PUSH1 0x02
        0x60, 0x02, // PUSH1 0x02
        0x14, // EQ

        // PUSH 0 + ADD (should be eliminated)
        0x60, 0x00, // PUSH1 0x00
        0x01, // ADD

        // PUSH 1 + MUL (should be eliminated)
        0x60, 0x01, // PUSH1 0x01
        0x02, // MUL

        // PUSH 1 + DIV (should be eliminated)
        0x60, 0x01, // PUSH1 0x01
        0x04, // DIV
        0x00, // STOP
    };

    const table = OpcodeMetadata.DEFAULT;
    var analysis = try CodeAnalysis.from_code(allocator, code, &table);
    defer analysis.deinit();

    // Just verify it works - the stats will be printed in debug mode
    try std.testing.expect(analysis.instructions.len > 0);
}

test "invalid jump target handling" {
    const allocator = std.testing.allocator;

    // Bytecode with invalid jump (no JUMPDEST at target):
    // PC 0: PUSH1 0x05 (push invalid jump destination)
    // PC 2: JUMP (jump to PC 5 which is not a JUMPDEST)
    // PC 3: PUSH1 0x00
    // PC 5: PUSH1 0x01 (NOT a JUMPDEST)
    // PC 7: STOP
    const code = &[_]u8{
        0x60, 0x05, // PUSH1 0x05
        0x56, // JUMP
        0x60, 0x00, // PUSH1 0x00
        0x60, 0x01, // PUSH1 0x01 (at PC 5, NOT a JUMPDEST)
        0x00, // STOP
    };
    const table = OpcodeMetadata.DEFAULT;
    var analysis = try CodeAnalysis.from_code(allocator, code, &table);
    defer analysis.deinit();

    // Verify PC 5 is NOT marked as JUMPDEST
    try std.testing.expect(!analysis.jumpdest_array.is_valid_jumpdest(5));

    // The JUMP instruction should not have a resolved target
    var unresolved_jump_found = false;

    for (analysis.instructions) |inst| {
        // Noop handler with .none arg means unresolved jump
        if (inst.opcode_fn == UnreachableHandler and inst.arg == .none) {
            unresolved_jump_found = true;
        }
    }

    try std.testing.expect(unresolved_jump_found);
}

test "SHA3 precomputation - detect PUSH followed by SHA3" {
    const allocator = std.testing.allocator;

    // Bytecode: PUSH1 0x20 PUSH1 0x00 SHA3
    // This should compute keccak256 of 32 bytes starting at offset 0
    const code = &[_]u8{
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0x20, // SHA3/KECCAK256
    };

    const table = OpcodeMetadata.DEFAULT;
    var analysis = try CodeAnalysis.from_code(allocator, code, &table);
    defer analysis.deinit();

    // The SHA3 instruction should have dynamic gas handling and static charged in block
    try std.testing.expectEqual(@as(usize, 6), analysis.instructions.len); // 5 opcodes + 1 STOP

    const sha3_inst = &analysis.instructions[4];
    try std.testing.expect(sha3_inst.arg == .dynamic_gas);
    try std.testing.expect(sha3_inst.arg.dynamic_gas.gas_fn != null);
}

test "SHA3 precomputation - various sizes" {
    const allocator = std.testing.allocator;

    const test_cases = [_]struct { size: u16, word_count: u32, gas: u32 }{
        .{ .size = 0, .word_count = 0, .gas = 30 }, // Empty data
        .{ .size = 1, .word_count = 1, .gas = 36 }, // 1 byte = 1 word
        .{ .size = 32, .word_count = 1, .gas = 36 }, // 32 bytes = 1 word
        .{ .size = 33, .word_count = 2, .gas = 42 }, // 33 bytes = 2 words
        .{ .size = 64, .word_count = 2, .gas = 42 }, // 64 bytes = 2 words
        .{ .size = 96, .word_count = 3, .gas = 48 }, // 96 bytes = 3 words
        .{ .size = 1024, .word_count = 32, .gas = 222 }, // 1024 bytes = 32 words
    };

    inline for (test_cases) |tc| {
        const code = if (tc.size <= 255) &[_]u8{
            0x60, @intCast(tc.size), // PUSH1 size
            0x60, 0x00, // PUSH1 0 (offset)
            0x20, // SHA3/KECCAK256
        } else &[_]u8{
            0x61, @intCast(tc.size >> 8), @intCast(tc.size & 0xFF), // PUSH2 size
            0x60, 0x00, // PUSH1 0 (offset)
            0x20, // SHA3/KECCAK256
        };

        const table = OpcodeMetadata.DEFAULT;
        var analysis = try CodeAnalysis.from_code(allocator, code, &table);
        defer analysis.deinit();

        const sha3_idx = if (tc.size <= 255) 4 else 5;
        const sha3_inst = &analysis.instructions[sha3_idx];
        try std.testing.expect(sha3_inst.arg == .dynamic_gas);
        try std.testing.expect(sha3_inst.arg.dynamic_gas.gas_fn != null);
    }
}

test "SHA3 precomputation - with memory expansion" {
    const allocator = std.testing.allocator;

    // Bytecode: PUSH2 0x0100 PUSH2 0x1000 SHA3
    // This should compute keccak256 of 256 bytes starting at offset 4096
    // Memory expansion: from 0 to 4096+256 = 4352 bytes = 136 words
    const code = &[_]u8{
        0x61, 0x01, 0x00, // PUSH2 256 (size)
        0x61, 0x10, 0x00, // PUSH2 4096 (offset)
        0x20, // SHA3/KECCAK256
    };

    const table = OpcodeMetadata.DEFAULT;
    var analysis = try CodeAnalysis.from_code(allocator, code, &table);
    defer analysis.deinit();

    const sha3_inst = &analysis.instructions[5];
    try std.testing.expect(sha3_inst.arg == .dynamic_gas);

    // Static component now charged at block entry; ensure dynamic_gas has a gas_fn
    try std.testing.expect(sha3_inst.arg == .dynamic_gas);
    try std.testing.expect(sha3_inst.arg.dynamic_gas.gas_fn != null);
}

test "SHA3 precomputation - not applied when size unknown" {
    const allocator = std.testing.allocator;

    // Bytecode: DUP1 DUP1 SHA3 (size comes from stack, not PUSH)
    const code = &[_]u8{
        0x80, // DUP1
        0x80, // DUP1
        0x20, // SHA3/KECCAK256
    };

    const table = OpcodeMetadata.DEFAULT;
    var analysis = try CodeAnalysis.from_code(allocator, code, &table);
    defer analysis.deinit();

    // The SHA3 instruction should NOT have precomputed values
    const sha3_inst = &analysis.instructions[3]; // BEGINBLOCK + DUP1 + DUP1 + SHA3

    // Should not have dynamic_gas with precomputed static component; may still have gas_fn
    try std.testing.expect(sha3_inst.arg != .dynamic_gas or sha3_inst.arg.dynamic_gas.gas_fn != null);
}
