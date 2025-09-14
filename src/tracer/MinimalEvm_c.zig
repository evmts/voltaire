/// C wrapper for MinimalEvm - minimal interface for WASM
const std = @import("std");
const MinimalEvm = @import("MinimalEvm.zig").MinimalEvm;
const primitives = @import("primitives");
const Address = primitives.Address.Address;

// Global allocator for C interface
var gpa = std.heap.GeneralPurposeAllocator(.{}){};
var allocator = gpa.allocator();

// Opaque handle for EVM instance
const EvmHandle = opaque {};

/// Create a new MinimalEvm instance
export fn evm_create(bytecode: [*]const u8, bytecode_len: usize, gas_limit: i64) ?*EvmHandle {
    const evm = allocator.create(MinimalEvm) catch return null;

    const bytecode_slice = bytecode[0..bytecode_len];
    evm.* = MinimalEvm.init(allocator, bytecode_slice, gas_limit) catch {
        allocator.destroy(evm);
        return null;
    };

    return @ptrCast(evm);
}

/// Destroy an EVM instance
export fn evm_destroy(handle: ?*EvmHandle) void {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        evm.deinit();
        allocator.destroy(evm);
    }
}

/// Set call context (value passed as byte array for WASM compatibility)
export fn evm_set_call_context(
    handle: ?*EvmHandle,
    caller_bytes: [*]const u8,
    address_bytes: [*]const u8,
    value_bytes: [*]const u8,  // 32 bytes representing u256
    calldata: [*]const u8,
    calldata_len: usize,
) void {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));

        var caller_addr: Address = undefined;
        @memcpy(&caller_addr.bytes, caller_bytes[0..20]);

        var contract_addr: Address = undefined;
        @memcpy(&contract_addr.bytes, address_bytes[0..20]);

        // Convert bytes to u256
        var value: u256 = 0;
        var i: usize = 0;
        while (i < 32) : (i += 1) {
            value = (value << 8) | value_bytes[i];
        }

        const calldata_slice = if (calldata_len > 0) calldata[0..calldata_len] else &[_]u8{};

        evm.setCallContext(caller_addr, contract_addr, value, calldata_slice);
    }
}

/// Execute a single step
export fn evm_step(handle: ?*EvmHandle) bool {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        evm.step() catch return false;
        return true;
    }
    return false;
}

/// Execute until stopped
export fn evm_execute(handle: ?*EvmHandle) bool {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        evm.execute() catch return false;
        return true;
    }
    return false;
}

/// Get program counter
export fn evm_get_pc(handle: ?*EvmHandle) u32 {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        return evm.pc;
    }
    return 0;
}

/// Get gas remaining
export fn evm_get_gas_remaining(handle: ?*EvmHandle) i64 {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        return evm.gas_remaining;
    }
    return 0;
}

/// Get gas used
export fn evm_get_gas_used(handle: ?*EvmHandle) u64 {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        return evm.gas_used;
    }
    return 0;
}

/// Check if stopped
export fn evm_is_stopped(handle: ?*EvmHandle) bool {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        return evm.stopped;
    }
    return true;
}

/// Check if reverted
export fn evm_is_reverted(handle: ?*EvmHandle) bool {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        return evm.reverted;
    }
    return false;
}

/// Get stack size
export fn evm_get_stack_size(handle: ?*EvmHandle) usize {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        return evm.stack.items.len;
    }
    return 0;
}

/// Get stack item at index (0 is top) - writes to output buffer
export fn evm_get_stack_item(handle: ?*EvmHandle, index: usize, output: [*]u8) void {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        var value: u256 = 0;
        if (index < evm.stack.items.len) {
            value = evm.stack.items[evm.stack.items.len - 1 - index];
        }
        // Convert u256 to bytes
        var i: usize = 0;
        while (i < 32) : (i += 1) {
            output[31 - i] = @as(u8, @truncate(value & 0xFF));
            value >>= 8;
        }
    } else {
        // Zero output
        @memset(output[0..32], 0);
    }
}

/// Get memory size
export fn evm_get_memory_size(handle: ?*EvmHandle) u32 {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        return evm.memory_size;
    }
    return 0;
}

/// Read byte from memory
export fn evm_read_memory(handle: ?*EvmHandle, offset: u32) u8 {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        return evm.readMemory(offset);
    }
    return 0;
}

/// Read word from memory - writes to output buffer
export fn evm_read_memory_word(handle: ?*EvmHandle, offset: u32, output: [*]u8) void {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        var value = evm.readMemoryWord(offset);
        // Convert u256 to bytes
        var i: usize = 0;
        while (i < 32) : (i += 1) {
            output[31 - i] = @as(u8, @truncate(value & 0xFF));
            value >>= 8;
        }
    } else {
        @memset(output[0..32], 0);
    }
}

/// Push value to stack (value passed as byte array)
export fn evm_push_stack(handle: ?*EvmHandle, value_bytes: [*]const u8) bool {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        // Convert bytes to u256
        var value: u256 = 0;
        var i: usize = 0;
        while (i < 32) : (i += 1) {
            value = (value << 8) | value_bytes[i];
        }
        evm.pushStack(value) catch return false;
        return true;
    }
    return false;
}

/// Pop value from stack - writes to output buffer
export fn evm_pop_stack(handle: ?*EvmHandle, output: [*]u8) bool {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));
        var value = evm.popStack() catch return false;
        // Convert u256 to bytes
        var i: usize = 0;
        while (i < 32) : (i += 1) {
            output[31 - i] = @as(u8, @truncate(value & 0xFF));
            value >>= 8;
        }
        return true;
    }
    return false;
}

/// Write storage (slot and value passed as byte arrays)
export fn evm_write_storage(handle: ?*EvmHandle, address_bytes: [*]const u8, slot_bytes: [*]const u8, value_bytes: [*]const u8) bool {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));

        var addr: Address = undefined;
        @memcpy(&addr.bytes, address_bytes[0..20]);

        // Convert slot bytes to u256
        var slot: u256 = 0;
        var i: usize = 0;
        while (i < 32) : (i += 1) {
            slot = (slot << 8) | slot_bytes[i];
        }

        // Convert value bytes to u256
        var value: u256 = 0;
        i = 0;
        while (i < 32) : (i += 1) {
            value = (value << 8) | value_bytes[i];
        }

        evm.writeStorage(addr, slot, value) catch return false;
        return true;
    }
    return false;
}

/// Read storage (slot passed as byte array, result written to output)
export fn evm_read_storage(handle: ?*EvmHandle, address_bytes: [*]const u8, slot_bytes: [*]const u8, output: [*]u8) void {
    if (handle) |h| {
        const evm: *MinimalEvm = @ptrCast(@alignCast(h));

        var addr: Address = undefined;
        @memcpy(&addr.bytes, address_bytes[0..20]);

        // Convert slot bytes to u256
        var slot: u256 = 0;
        var i: usize = 0;
        while (i < 32) : (i += 1) {
            slot = (slot << 8) | slot_bytes[i];
        }

        var value = evm.readStorage(addr, slot) catch 0;

        // Convert u256 to bytes
        i = 0;
        while (i < 32) : (i += 1) {
            output[31 - i] = @as(u8, @truncate(value & 0xFF));
            value >>= 8;
        }
    } else {
        @memset(output[0..32], 0);
    }
}