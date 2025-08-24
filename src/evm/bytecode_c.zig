// ============================================================================
// BYTECODE C API - FFI interface for bytecode analysis
// ============================================================================

const std = @import("std");
const evm = @import("evm");
const BytecodeConfig = evm.BytecodeConfig;
const createBytecode = evm.createBytecode;
const BytecodeStats = evm.BytecodeStats;
const Opcode = evm.Opcode;

const allocator = std.heap.c_allocator;

// Default bytecode configuration
const DefaultBytecodeConfig = BytecodeConfig{
    .max_bytecode_size = 24576, // EVM max contract size
};

const Bytecode = createBytecode(DefaultBytecodeConfig);

// ============================================================================
// OPAQUE HANDLE
// ============================================================================

const BytecodeHandle = struct {
    bytecode: Bytecode,
    bytecode_data: []const u8, // Keep reference to data
    is_analyzed: bool,
};

// ============================================================================
// LIFECYCLE FUNCTIONS
// ============================================================================

/// Create a new bytecode instance from raw bytes
/// @param data Pointer to bytecode data
/// @param len Length of bytecode
/// @return Opaque handle or NULL on failure
export fn evm_bytecode_create(data: [*]const u8, len: usize) ?*BytecodeHandle {
    if (len == 0 or len > DefaultBytecodeConfig.max_bytecode_size) return null;
    
    const handle = allocator.create(BytecodeHandle) catch return null;
    errdefer allocator.destroy(handle);
    
    // Copy bytecode data
    const bytecode_data = allocator.dupe(u8, data[0..len]) catch {
        allocator.destroy(handle);
        return null;
    };
    errdefer allocator.free(bytecode_data);
    
    // Create bytecode instance
    handle.* = BytecodeHandle{
        .bytecode = Bytecode.init(allocator, bytecode_data) catch {
            allocator.free(bytecode_data);
            allocator.destroy(handle);
            return null;
        },
        .bytecode_data = bytecode_data,
        .is_analyzed = true, // init already analyzes
    };
    
    return handle;
}

/// Destroy bytecode instance and free memory
/// @param handle Bytecode handle
export fn evm_bytecode_destroy(handle: ?*BytecodeHandle) void {
    const h = handle orelse return;
    allocator.free(h.bytecode_data);
    allocator.destroy(h);
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/// Analyze bytecode to identify jump destinations
/// @param handle Bytecode handle
/// @return 0 on success, error code on failure (already analyzed on creation)
export fn evm_bytecode_analyze(handle: ?*BytecodeHandle) c_int {
    const h = handle orelse return -1;
    // Bytecode is already analyzed during init
    h.is_analyzed = true;
    return 0;
}

/// Check if a PC is a valid jump destination
/// @param handle Bytecode handle
/// @param pc Program counter to check
/// @return 1 if valid JUMPDEST, 0 otherwise
export fn evm_bytecode_is_valid_jumpdest(handle: ?*const BytecodeHandle, pc: u32) c_int {
    const h = handle orelse return 0;
    if (!h.is_analyzed) return 0;
    
    return if (h.bytecode.isValidJumpDest(@intCast(pc))) 1 else 0;
}

// ============================================================================
// INSPECTION FUNCTIONS
// ============================================================================

/// Get bytecode length
/// @param handle Bytecode handle
/// @return Length in bytes, or 0 on error
export fn evm_bytecode_get_length(handle: ?*const BytecodeHandle) usize {
    const h = handle orelse return 0;
    return h.bytecode.runtime_code.len;
}

/// Get opcode at specific PC
/// @param handle Bytecode handle
/// @param pc Program counter
/// @return Opcode value, or 0xFE (INVALID) on error
export fn evm_bytecode_get_opcode(handle: ?*const BytecodeHandle, pc: u32) u8 {
    const h = handle orelse return 0xFE;
    
    if (pc >= h.bytecode.runtime_code.len) return 0xFE;
    return h.bytecode.runtime_code[@intCast(pc)];
}

/// Get raw bytecode data
/// @param handle Bytecode handle
/// @param out Buffer to write bytecode
/// @param max_len Maximum bytes to write
/// @return Number of bytes written
export fn evm_bytecode_get_data(handle: ?*const BytecodeHandle, out: [*]u8, max_len: usize) usize {
    const h = handle orelse return 0;
    
    const copy_len = @min(h.bytecode.runtime_code.len, max_len);
    @memcpy(out[0..copy_len], h.bytecode.runtime_code[0..copy_len]);
    
    return copy_len;
}

// ============================================================================
// STATISTICS FUNCTIONS
// ============================================================================

/// Bytecode statistics structure for C
pub const CBytecodeStats = extern struct {
    total_opcodes: u32,
    unique_opcodes: u32,
    push_opcodes: u32,
    jump_opcodes: u32,
    jumpdest_count: u32,
    invalid_opcodes: u32,
    max_stack_depth: u32,
    estimated_gas: u64,
};

/// Get bytecode statistics
/// @param handle Bytecode handle
/// @param stats_out Pointer to stats structure
/// @return 0 on success, error code on failure
export fn evm_bytecode_get_stats(handle: ?*const BytecodeHandle, stats_out: ?*CBytecodeStats) c_int {
    const h = handle orelse return -1;
    const stats = stats_out orelse return -2;
    
    const bytecode_stats = BytecodeStats.analyze(h.bytecode.runtime_code) catch return -3;
    
    stats.* = CBytecodeStats{
        .total_opcodes = @intCast(bytecode_stats.total_opcodes),
        .unique_opcodes = @intCast(bytecode_stats.unique_opcodes),
        .push_opcodes = @intCast(bytecode_stats.push_opcodes),
        .jump_opcodes = @intCast(bytecode_stats.jump_opcodes),
        .jumpdest_count = @intCast(bytecode_stats.jumpdest_count),
        .invalid_opcodes = @intCast(bytecode_stats.invalid_opcodes),
        .max_stack_depth = @intCast(bytecode_stats.max_stack_depth),
        .estimated_gas = bytecode_stats.estimated_gas,
    };
    
    return 0;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/// Check if bytecode contains only valid opcodes
/// @param handle Bytecode handle
/// @return 1 if all opcodes are valid, 0 otherwise
export fn evm_bytecode_is_valid(handle: ?*const BytecodeHandle) c_int {
    const h = handle orelse return 0;
    
    for (h.bytecode.runtime_code) |byte| {
        _ = std.meta.intToEnum(Opcode, byte) catch return 0;
    }
    
    return 1;
}

/// Get the size of PUSH data for an opcode
/// @param opcode Opcode value
/// @return Number of data bytes (0-32), or -1 if not a PUSH opcode
export fn evm_bytecode_get_push_size(opcode: u8) c_int {
    return switch (opcode) {
        0x60...0x7F => @as(c_int, opcode - 0x5F), // PUSH1-PUSH32
        else => -1,
    };
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/// Test function - analyze simple bytecode
export fn evm_bytecode_test_analyze() c_int {
    // PUSH1 0x80 PUSH1 0x40 MSTORE JUMPDEST STOP
    const test_bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52, 0x5B, 0x00 };
    
    const handle = evm_bytecode_create(&test_bytecode, test_bytecode.len) orelse return -1;
    defer evm_bytecode_destroy(handle);
    
    if (evm_bytecode_analyze(handle) != 0) return -2;
    
    // Check JUMPDEST at position 5
    if (evm_bytecode_is_valid_jumpdest(handle, 5) != 1) return -3;
    
    // Check non-JUMPDEST positions
    if (evm_bytecode_is_valid_jumpdest(handle, 0) != 0) return -4;
    if (evm_bytecode_is_valid_jumpdest(handle, 4) != 0) return -5;
    
    return 0;
}

/// Test function - get bytecode statistics
export fn evm_bytecode_test_stats() c_int {
    // Complex bytecode with various opcodes
    const test_bytecode = [_]u8{
        0x60, 0x01, // PUSH1 1
        0x60, 0x02, // PUSH1 2
        0x01,       // ADD
        0x56,       // JUMP
        0x5B,       // JUMPDEST
        0x00,       // STOP
        0xFE,       // INVALID
    };
    
    const handle = evm_bytecode_create(&test_bytecode, test_bytecode.len) orelse return -1;
    defer evm_bytecode_destroy(handle);
    
    var stats: CBytecodeStats = undefined;
    if (evm_bytecode_get_stats(handle, &stats) != 0) return -2;
    
    if (stats.total_opcodes != 7) return -3;
    if (stats.push_opcodes != 2) return -4;
    if (stats.jump_opcodes != 1) return -5;
    if (stats.jumpdest_count != 1) return -6;
    if (stats.invalid_opcodes != 1) return -7;
    
    return 0;
}