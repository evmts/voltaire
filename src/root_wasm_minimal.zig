/// Minimal WASM build for Guillotine EVM
/// Optimized for size - only includes core EVM execution functionality

const std = @import("std");
const evm_root = @import("evm");
const Address = @import("Address");

// WASM-optimized allocator (smaller than GeneralPurposeAllocator)
var buffer: [64 * 1024]u8 = undefined;  // 64KB static buffer
var fba = std.heap.FixedBufferAllocator.init(&buffer);
const allocator = fba.allocator();

// Error codes for WASM interface
const WasmError = enum(c_int) {
    OK = 0,
    MEMORY = 1,
    INVALID_PARAM = 2,
    EXECUTION_FAILED = 3,
};

/// Execute EVM bytecode
/// @param bytecode_ptr Pointer to bytecode
/// @param bytecode_len Length of bytecode
/// @param gas_limit Gas limit for execution
/// @return Gas used (success) or negative error code
export fn evm_execute(bytecode_ptr: [*]const u8, bytecode_len: usize, gas_limit: u64) i64 {
    const bytecode = bytecode_ptr[0..bytecode_len];
    
    // Create minimal database
    var memory_db = evm_root.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    // Create VM
    var vm = evm_root.Evm.init(allocator, db_interface, null, null) catch {
        return -@intFromEnum(WasmError.MEMORY);
    };
    defer vm.deinit();

    // Create minimal contract
    var contract = evm_root.Contract.init(allocator, bytecode, .{ .address = Address.Address.ZERO }) catch {
        return -@intFromEnum(WasmError.MEMORY);
    };
    defer contract.deinit(allocator, null);

    // Create execution frame
    var frame = evm_root.Frame.init(allocator, &vm, gas_limit, contract, Address.Address.ZERO, &.{}) catch {
        return -@intFromEnum(WasmError.MEMORY);
    };
    defer frame.deinit();

    // Execute
    const result = vm.run(&frame);
    
    return switch (result) {
        .success => |gas_used| @intCast(gas_used),
        .revert => |gas_used| @intCast(gas_used),
        .failure => -@intFromEnum(WasmError.EXECUTION_FAILED),
    };
}

/// Get version string
export fn evm_version() [*:0]const u8 {
    return "Guillotine-WASM-0.1.0";
}

/// Reset allocator (free all memory)
export fn evm_reset() void {
    fba.reset();
}