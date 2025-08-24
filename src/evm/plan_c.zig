// ============================================================================
// PLAN C API - FFI interface for EVM Plan operations
// ============================================================================

const std = @import("std");
const evm = @import("evm");
const Plan = evm.Plan;
const createPlan = evm.createPlan;
const PlanConfig = evm.PlanConfig;
const JumpDestMetadata = evm.JumpDestMetadata;
// Note: InstructionElement not needed for simplified plan interface

const allocator = std.heap.c_allocator;

// Default plan configuration for C API
const DefaultPlanConfig = PlanConfig{
    .WordType = u256,
    .maxBytecodeSize = 24576,
};

// ============================================================================
// ERROR CODES
// ============================================================================

pub const EVM_PLAN_SUCCESS: c_int = 0;
pub const EVM_PLAN_ERROR_NULL_POINTER: c_int = -1;
pub const EVM_PLAN_ERROR_INVALID_BYTECODE: c_int = -2;
pub const EVM_PLAN_ERROR_OUT_OF_MEMORY: c_int = -3;
pub const EVM_PLAN_ERROR_BYTECODE_TOO_LARGE: c_int = -4;
pub const EVM_PLAN_ERROR_INVALID_JUMP: c_int = -5;

// ============================================================================
// OPAQUE HANDLE
// ============================================================================

const PlanHandle = struct {
    allocator: std.mem.Allocator,
    bytecode: []const u8,
    // For now, just store bytecode - real plans come from planner
};

// ============================================================================
// PLAN LIFECYCLE
// ============================================================================

/// Create a plan from bytecode
/// @param bytecode Pointer to bytecode
/// @param bytecode_len Length of bytecode
/// @return Opaque plan handle, or NULL on failure
pub export fn evm_plan_create(bytecode: [*]const u8, bytecode_len: usize) ?*PlanHandle {
    if (bytecode_len == 0 or bytecode_len > DefaultPlanConfig.maxBytecodeSize) {
        return null;
    }

    const handle = allocator.create(PlanHandle) catch return null;
    errdefer allocator.destroy(handle);

    // Copy bytecode
    const bytecode_slice = bytecode[0..bytecode_len];
    const owned_bytecode = allocator.dupe(u8, bytecode_slice) catch {
        allocator.destroy(handle);
        return null;
    };
    errdefer allocator.free(owned_bytecode);

    // Plans are created by planners, not directly
    // For simplicity in the C API, we'll return a simple handle
    // that just holds the bytecode for now
    // In practice, you'd use the planner_c.zig to create actual plans

    handle.* = PlanHandle{
        .allocator = allocator,
        .bytecode = owned_bytecode,
    };

    return handle;
}

/// Destroy plan and free memory
/// @param handle Plan handle
pub export fn evm_plan_destroy(handle: ?*PlanHandle) void {
    if (handle) |h| {
        h.allocator.free(h.bytecode);
        h.allocator.destroy(h);
    }
}

// ============================================================================
// PLAN INSPECTION
// ============================================================================

/// Get the number of instructions in the plan
/// @param handle Plan handle
/// @return Number of instructions, or 0 on error
pub export fn evm_plan_get_instruction_count(handle: ?*const PlanHandle) u32 {
    const h = handle orelse return 0;
    // Simple analysis: count instructions in bytecode
    var count: u32 = 0;
    var pos: usize = 0;
    while (pos < h.bytecode.len) {
        count += 1;
        const opcode_byte = h.bytecode[pos];
        // Skip data bytes for PUSH opcodes
        if (opcode_byte >= 0x60 and opcode_byte <= 0x7F) { // PUSH1-PUSH32
            const push_size = opcode_byte - 0x5F;
            pos += 1 + push_size;
        } else {
            pos += 1;
        }
    }
    return count;
}

/// Get the number of constants in the plan
/// @param handle Plan handle
/// @return Number of constants, or 0 on error
pub export fn evm_plan_get_constant_count(handle: ?*const PlanHandle) u32 {
    const h = handle orelse return 0;
    // Count PUSH constants in bytecode
    var count: u32 = 0;
    var pos: usize = 0;
    while (pos < h.bytecode.len) {
        const opcode_byte = h.bytecode[pos];
        if (opcode_byte >= 0x60 and opcode_byte <= 0x7F) { // PUSH1-PUSH32
            count += 1;
            const push_size = opcode_byte - 0x5F;
            pos += 1 + push_size;
        } else {
            pos += 1;
        }
    }
    return count;
}

/// Check if the plan has PC mapping
/// @param handle Plan handle
/// @return 1 if has PC mapping, 0 otherwise
pub export fn evm_plan_has_pc_mapping(handle: ?*const PlanHandle) c_int {
    _ = handle;
    return 0; // Simplified plan doesn't have PC mapping
}

/// Get original bytecode length
/// @param handle Plan handle
/// @return Bytecode length, or 0 on error
pub export fn evm_plan_get_bytecode_len(handle: ?*const PlanHandle) usize {
    const h = handle orelse return 0;
    return h.bytecode.len;
}

/// Copy original bytecode to buffer
/// @param handle Plan handle
/// @param buffer Output buffer
/// @param buffer_len Buffer length
/// @return Number of bytes copied, or 0 on error
pub export fn evm_plan_get_bytecode(handle: ?*const PlanHandle, buffer: [*]u8, buffer_len: usize) usize {
    const h = handle orelse return 0;
    
    const copy_len = @min(h.bytecode.len, buffer_len);
    @memcpy(buffer[0..copy_len], h.bytecode[0..copy_len]);
    return copy_len;
}

// ============================================================================
// JUMP DESTINATION QUERIES
// ============================================================================

/// Check if a PC is a valid jump destination
/// @param handle Plan handle
/// @param pc Program counter to check
/// @return 1 if valid jump destination, 0 otherwise
pub export fn evm_plan_is_valid_jump_dest(handle: ?*const PlanHandle, pc: u32) c_int {
    const h = handle orelse return 0;
    
    // Check if PC points to JUMPDEST in original bytecode
    if (pc >= h.bytecode.len) return 0;
    return if (h.bytecode[pc] == 0x5B) 1 else 0; // JUMPDEST opcode
}

/// Get instruction index for a PC (if PC mapping exists)
/// @param handle Plan handle
/// @param pc Program counter
/// @param instruction_idx_out Output for instruction index
/// @return Error code
pub export fn evm_plan_pc_to_instruction(handle: ?*const PlanHandle, pc: u32, instruction_idx_out: *u32) c_int {
    _ = handle;
    _ = pc;
    _ = instruction_idx_out;
    return EVM_PLAN_ERROR_INVALID_JUMP; // Simplified plan doesn't have PC mapping
}

// ============================================================================
// CONSTANT ACCESS
// ============================================================================

/// Get a constant by index
/// @param handle Plan handle
/// @param index Constant index
/// @param constant_out Output buffer (32 bytes for u256)
/// @return Error code
pub export fn evm_plan_get_constant(handle: ?*const PlanHandle, index: u32, constant_out: [*]u8) c_int {
    const h = handle orelse return EVM_PLAN_ERROR_NULL_POINTER;
    
    // Find the index-th PUSH constant
    var count: u32 = 0;
    var pos: usize = 0;
    while (pos < h.bytecode.len) {
        const opcode_byte = h.bytecode[pos];
        if (opcode_byte >= 0x60 and opcode_byte <= 0x7F) { // PUSH1-PUSH32
            const push_size = opcode_byte - 0x5F;
            if (count == index) {
                // Clear output buffer
                @memset(constant_out[0..32], 0);
                // Copy push data (right-aligned)
                const data_start = @min(pos + 1, h.bytecode.len);
                const data_end = @min(pos + 1 + push_size, h.bytecode.len);
                const actual_size = data_end - data_start;
                if (actual_size > 0) {
                    const offset = 32 - actual_size;
                    @memcpy(constant_out[offset..offset + actual_size], h.bytecode[data_start..data_end]);
                }
                return EVM_PLAN_SUCCESS;
            }
            count += 1;
            pos += 1 + push_size;
        } else {
            pos += 1;
        }
    }
    
    return EVM_PLAN_ERROR_INVALID_JUMP; // Index out of bounds
}

// ============================================================================
// INSTRUCTION STREAM ACCESS
// ============================================================================

/// Get instruction element at index (platform-dependent size)
/// @param handle Plan handle
/// @param index Instruction index
/// @param element_out Output for instruction element
/// @return Error code
pub export fn evm_plan_get_instruction_element(handle: ?*const PlanHandle, index: u32, element_out: *u64) c_int {
    const h = handle orelse return EVM_PLAN_ERROR_NULL_POINTER;
    
    // Find the index-th instruction
    var count: u32 = 0;
    var pos: usize = 0;
    while (pos < h.bytecode.len) {
        if (count == index) {
            element_out.* = @as(u64, h.bytecode[pos]);
            return EVM_PLAN_SUCCESS;
        }
        count += 1;
        const opcode_byte = h.bytecode[pos];
        if (opcode_byte >= 0x60 and opcode_byte <= 0x7F) { // PUSH1-PUSH32
            const push_size = opcode_byte - 0x5F;
            pos += 1 + push_size;
        } else {
            pos += 1;
        }
    }
    
    return EVM_PLAN_ERROR_INVALID_JUMP; // Index out of bounds
}

// ============================================================================
// STATISTICS AND DEBUGGING
// ============================================================================

/// C structure for plan statistics
pub const PlanStats = extern struct {
    instruction_count: u32,
    constant_count: u32,
    bytecode_length: u32,
    has_pc_mapping: c_int,
    memory_usage_bytes: usize,
};

/// Get plan statistics
/// @param handle Plan handle
/// @param stats_out Output statistics structure
/// @return Error code
pub export fn evm_plan_get_stats(handle: ?*const PlanHandle, stats_out: *PlanStats) c_int {
    const h = handle orelse return EVM_PLAN_ERROR_NULL_POINTER;
    
    stats_out.instruction_count = evm_plan_get_instruction_count(handle);
    stats_out.constant_count = evm_plan_get_constant_count(handle);
    stats_out.bytecode_length = @intCast(h.bytecode.len);
    stats_out.has_pc_mapping = 0;
    
    // Estimate memory usage (just bytecode for now)
    stats_out.memory_usage_bytes = h.bytecode.len + @sizeOf(PlanHandle);
    
    return EVM_PLAN_SUCCESS;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/// Convert error code to human-readable string
pub export fn evm_plan_error_string(error_code: c_int) [*:0]const u8 {
    return switch (error_code) {
        EVM_PLAN_SUCCESS => "Success",
        EVM_PLAN_ERROR_NULL_POINTER => "Null pointer",
        EVM_PLAN_ERROR_INVALID_BYTECODE => "Invalid bytecode",
        EVM_PLAN_ERROR_OUT_OF_MEMORY => "Out of memory",
        EVM_PLAN_ERROR_BYTECODE_TOO_LARGE => "Bytecode too large",
        EVM_PLAN_ERROR_INVALID_JUMP => "Invalid jump or index",
        else => "Unknown error",
    };
}

// ============================================================================
// TESTING
// ============================================================================

/// Basic test of plan creation and inspection
pub export fn evm_plan_test_basic() c_int {
    // Simple bytecode: PUSH1 42 PUSH1 10 ADD STOP
    const test_bytecode = [_]u8{ 0x60, 0x2A, 0x60, 0x0A, 0x01, 0x00 };
    
    const handle = evm_plan_create(&test_bytecode, test_bytecode.len) orelse return -1;
    defer evm_plan_destroy(handle);
    
    if (evm_plan_get_bytecode_len(handle) != test_bytecode.len) return -2;
    if (evm_plan_get_instruction_count(handle) == 0) return -3;
    
    var stats: PlanStats = undefined;
    if (evm_plan_get_stats(handle, &stats) != EVM_PLAN_SUCCESS) return -4;
    
    if (stats.bytecode_length != test_bytecode.len) return -5;
    
    return 0;
}

test "Plan C API compilation" {
    std.testing.refAllDecls(@This());
}