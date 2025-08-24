// ============================================================================
// PLANNER C API - Simplified FFI interface for EVM bytecode planner
// ============================================================================

const std = @import("std");
const allocator = std.heap.c_allocator;

// ============================================================================
// ERROR CODES
// ============================================================================

pub const EVM_PLANNER_SUCCESS: c_int = 0;
pub const EVM_PLANNER_ERROR_NULL_POINTER: c_int = -1;
pub const EVM_PLANNER_ERROR_INVALID_BYTECODE: c_int = -2;
pub const EVM_PLANNER_ERROR_OUT_OF_MEMORY: c_int = -3;
pub const EVM_PLANNER_ERROR_BYTECODE_TOO_LARGE: c_int = -4;
pub const EVM_PLANNER_ERROR_PLAN_FAILED: c_int = -5;
pub const EVM_PLANNER_ERROR_CACHE_MISS: c_int = -6;

// ============================================================================
// OPAQUE HANDLES
// ============================================================================

const SimplePlannerHandle = struct {
    allocator: std.mem.Allocator,
    cache_size: u32,
};

const SimplePlanHandle = struct {
    allocator: std.mem.Allocator,
    bytecode: []const u8,
};

// ============================================================================
// PLANNER LIFECYCLE
// ============================================================================

/// Create a new planner instance
/// @return Opaque planner handle, or NULL on failure
pub export fn evm_planner_create() ?*SimplePlannerHandle {
    const handle = allocator.create(SimplePlannerHandle) catch return null;
    
    handle.* = SimplePlannerHandle{
        .allocator = allocator,
        .cache_size = 256,
    };
    
    return handle;
}

/// Destroy planner and free memory
/// @param handle Planner handle
pub export fn evm_planner_destroy(handle: ?*SimplePlannerHandle) void {
    if (handle) |h| {
        h.allocator.destroy(h);
    }
}

// ============================================================================
// PLAN CREATION
// ============================================================================

/// Create a plan from bytecode using the planner
/// @param planner_handle Planner handle
/// @param bytecode Pointer to bytecode
/// @param bytecode_len Length of bytecode
/// @return Opaque plan handle, or NULL on failure
pub export fn evm_planner_plan_bytecode(
    planner_handle: ?*SimplePlannerHandle, 
    bytecode: [*]const u8, 
    bytecode_len: usize
) ?*SimplePlanHandle {
    const planner = planner_handle orelse return null;
    _ = planner; // Unused in simplified version
    
    if (bytecode_len == 0 or bytecode_len > 24576) {
        return null;
    }

    const handle = allocator.create(SimplePlanHandle) catch return null;
    errdefer allocator.destroy(handle);

    // Copy bytecode
    const bytecode_slice = bytecode[0..bytecode_len];
    const owned_bytecode = allocator.dupe(u8, bytecode_slice) catch {
        allocator.destroy(handle);
        return null;
    };

    handle.* = SimplePlanHandle{
        .allocator = allocator,
        .bytecode = owned_bytecode,
    };

    return handle;
}

/// Destroy plan and free memory
/// @param handle Plan handle
pub export fn evm_planner_plan_destroy(handle: ?*SimplePlanHandle) void {
    if (handle) |h| {
        h.allocator.free(h.bytecode);
        h.allocator.destroy(h);
    }
}

// ============================================================================
// SIMPLIFIED STUBS FOR COMPATIBILITY
// ============================================================================

/// Check if planner has cached plan for bytecode
pub export fn evm_planner_has_cached_plan(
    planner_handle: ?*const SimplePlannerHandle,
    bytecode: [*]const u8,
    bytecode_len: usize
) c_int {
    _ = planner_handle;
    _ = bytecode;
    _ = bytecode_len;
    return 0; // No caching in simplified version
}

/// Get cached plan for bytecode (always returns null)
pub export fn evm_planner_get_cached_plan(
    planner_handle: ?*SimplePlannerHandle,
    bytecode: [*]const u8,
    bytecode_len: usize
) ?*SimplePlanHandle {
    _ = planner_handle;
    _ = bytecode;
    _ = bytecode_len;
    return null; // No caching in simplified version
}

/// Clear all cached plans (no-op)
pub export fn evm_planner_clear_cache(planner_handle: ?*SimplePlannerHandle) c_int {
    _ = planner_handle;
    return EVM_PLANNER_SUCCESS;
}

/// Get cache statistics
pub export fn evm_planner_get_cache_stats(
    planner_handle: ?*const SimplePlannerHandle,
    hits_out: ?*u64,
    misses_out: ?*u64,
    size_out: ?*u32,
    capacity_out: ?*u32
) c_int {
    _ = planner_handle;
    
    if (hits_out) |out| out.* = 0;
    if (misses_out) |out| out.* = 0;
    if (size_out) |out| out.* = 0;
    if (capacity_out) |out| out.* = 256;
    
    return EVM_PLANNER_SUCCESS;
}

/// Get the number of instructions in the plan (simplified count)
pub export fn evm_planner_plan_get_instruction_count(handle: ?*const SimplePlanHandle) u32 {
    const h = handle orelse return 0;
    
    // Simple instruction count
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

/// Get the number of constants in the plan (simplified count)
pub export fn evm_planner_plan_get_constant_count(handle: ?*const SimplePlanHandle) u32 {
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

/// Check if the plan has PC mapping (always returns 0)
pub export fn evm_planner_plan_has_pc_mapping(handle: ?*const SimplePlanHandle) c_int {
    _ = handle;
    return 0; // Simplified plan doesn't have PC mapping
}

/// Check if a PC is a valid jump destination
pub export fn evm_planner_plan_is_valid_jump_dest(handle: ?*const SimplePlanHandle, pc: u32) c_int {
    const h = handle orelse return 0;
    
    // Check if PC points to JUMPDEST in original bytecode
    if (pc >= h.bytecode.len) return 0;
    return if (h.bytecode[pc] == 0x5B) 1 else 0; // JUMPDEST opcode
}

/// Convert error code to human-readable string
pub export fn evm_planner_error_string(error_code: c_int) [*:0]const u8 {
    return switch (error_code) {
        EVM_PLANNER_SUCCESS => "Success",
        EVM_PLANNER_ERROR_NULL_POINTER => "Null pointer",
        EVM_PLANNER_ERROR_INVALID_BYTECODE => "Invalid bytecode",
        EVM_PLANNER_ERROR_OUT_OF_MEMORY => "Out of memory",
        EVM_PLANNER_ERROR_BYTECODE_TOO_LARGE => "Bytecode too large",
        EVM_PLANNER_ERROR_PLAN_FAILED => "Plan creation failed",
        EVM_PLANNER_ERROR_CACHE_MISS => "Cache miss",
        else => "Unknown error",
    };
}

/// Basic test of planner creation and planning
pub export fn evm_planner_test_basic() c_int {
    // Create planner
    const planner_handle = evm_planner_create() orelse return -1;
    defer evm_planner_destroy(planner_handle);
    
    // Simple bytecode: PUSH1 42 PUSH1 10 ADD STOP
    const test_bytecode = [_]u8{ 0x60, 0x2A, 0x60, 0x0A, 0x01, 0x00 };
    
    // Create plan
    const plan_handle = evm_planner_plan_bytecode(planner_handle, &test_bytecode, test_bytecode.len) orelse return -2;
    defer evm_planner_plan_destroy(plan_handle);
    
    // Check plan properties
    if (evm_planner_plan_get_instruction_count(plan_handle) == 0) return -3;
    
    return 0;
}

test "Planner C API compilation" {
    std.testing.refAllDecls(@This());
}