//! C ABI wrapper for Guillotine EVM
//! Provides FFI-compatible exports for Bun and other language bindings

const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");

// Import types from evm module
const DefaultEvm = evm.DefaultEvm;
const Database = evm.Database;
const BlockInfo = evm.BlockInfo;
const TransactionContext = evm.TransactionContext;
const Hardfork = evm.Hardfork;
const Account = evm.Account;

// Opaque handle for EVM instance
pub const EvmHandle = opaque {};

// Result structure for FFI
pub const EvmResult = extern struct {
    success: bool,
    gas_left: u64,
    output: [*]const u8,
    output_len: usize,
    error_message: [*:0]const u8,
};

// Call parameters for FFI
pub const CallParams = extern struct {
    caller: [20]u8,
    to: [20]u8,
    value: [32]u8, // u256 as bytes
    input: [*]const u8,
    input_len: usize,
    gas: u64,
    call_type: u8, // 0=CALL, 1=DELEGATECALL, 2=STATICCALL, 3=CREATE, 4=CREATE2
    salt: [32]u8, // For CREATE2
};

// Block info for FFI
pub const BlockInfoFFI = extern struct {
    number: u64,
    timestamp: u64,
    gas_limit: u64,
    coinbase: [20]u8,
    base_fee: u64,
    chain_id: u64,
    difficulty: u64,
    prev_randao: [32]u8,
};

// Thread-local allocator for FFI
threadlocal var ffi_allocator: ?std.mem.Allocator = null;
threadlocal var last_error: [256]u8 = undefined;
threadlocal var last_error_z: [257]u8 = undefined;

fn setError(comptime fmt: []const u8, args: anytype) void {
    const slice = std.fmt.bufPrint(&last_error, fmt, args) catch "Unknown error";
    @memcpy(last_error_z[0..slice.len], slice);
    last_error_z[slice.len] = 0;
}

// Initialize FFI allocator
export fn guillotine_init() void {
    if (ffi_allocator == null) {
        ffi_allocator = std.heap.c_allocator;
    }
}

// Cleanup FFI allocator
export fn guillotine_cleanup() void {
    ffi_allocator = null;
}

// Create a new EVM instance
export fn guillotine_evm_create(block_info_ptr: *const BlockInfoFFI) ?*EvmHandle {
    const allocator = ffi_allocator orelse {
        setError("FFI not initialized. Call guillotine_init() first", .{});
        return null;
    };

    // Create database
    const db = allocator.create(Database) catch {
        setError("Failed to allocate database", .{});
        return null;
    };
    db.* = Database.init(allocator);

    // Convert FFI block info to internal format
    const block_info = BlockInfo{
        .number = block_info_ptr.number,
        .timestamp = block_info_ptr.timestamp,
        .gas_limit = block_info_ptr.gas_limit,
        .coinbase = primitives.Address{ .bytes = block_info_ptr.coinbase },
        .base_fee = block_info_ptr.base_fee,
        .difficulty = block_info_ptr.difficulty,
        .prev_randao = block_info_ptr.prev_randao,
        .chain_id = @intCast(block_info_ptr.chain_id),
        .blob_base_fee = 0,
        .blob_versioned_hashes = &.{},
    };

    // Create transaction context
    const tx_context = TransactionContext{
        .gas_limit = block_info_ptr.gas_limit,
        .coinbase = primitives.Address{ .bytes = block_info_ptr.coinbase },
        .chain_id = @intCast(block_info_ptr.chain_id),
        .blob_versioned_hashes = &.{},
        .blob_base_fee = 0,
    };

    // Create EVM instance
    const evm_ptr = allocator.create(DefaultEvm) catch {
        setError("Failed to allocate EVM", .{});
        db.deinit();
        allocator.destroy(db);
        return null;
    };

    evm_ptr.* = DefaultEvm.init(
        allocator,
        db,
        block_info,
        tx_context,
        0, // gas_price
        primitives.Address.ZERO_ADDRESS, // origin
        .CANCUN, // Latest hardfork
    ) catch {
        setError("Failed to initialize EVM", .{});
        db.deinit();
        allocator.destroy(db);
        allocator.destroy(evm_ptr);
        return null;
    };

    return @ptrCast(evm_ptr);
}

// Destroy an EVM instance
export fn guillotine_evm_destroy(handle: *EvmHandle) void {
    const allocator = ffi_allocator orelse return;
    const evm_ptr: *DefaultEvm = @ptrCast(@alignCast(handle));
    
    // Save database pointer before deinit
    const db = evm_ptr.database;
    
    evm_ptr.deinit();
    db.deinit();
    allocator.destroy(db);
    allocator.destroy(evm_ptr);
}

// Set account balance
export fn guillotine_set_balance(handle: *EvmHandle, address: *const [20]u8, balance: *const [32]u8) bool {
    const evm_ptr: *DefaultEvm = @ptrCast(@alignCast(handle));
    
    // Convert balance bytes to u256
    const balance_value = std.mem.readInt(u256, balance, .big);
    
    // Get or create account
    var account = evm_ptr.database.get_account(address.*) catch {
        setError("Failed to get account", .{});
        return false;
    } orelse Account.zero();
    
    account.balance = balance_value;
    
    evm_ptr.database.set_account(address.*, account) catch {
        setError("Failed to set account balance", .{});
        return false;
    };
    
    return true;
}

// Set contract code
export fn guillotine_set_code(handle: *EvmHandle, address: *const [20]u8, code: [*]const u8, code_len: usize) bool {
    const evm_ptr: *DefaultEvm = @ptrCast(@alignCast(handle));
    
    const code_slice = code[0..code_len];
    
    // Store code in database
    const code_hash = evm_ptr.database.set_code(code_slice) catch {
        setError("Failed to store code", .{});
        return false;
    };
    
    // Get or create account
    var account = evm_ptr.database.get_account(address.*) catch {
        setError("Failed to get account", .{});
        return false;
    } orelse Account.zero();
    
    account.code_hash = code_hash;
    
    evm_ptr.database.set_account(address.*, account) catch {
        setError("Failed to update account code hash", .{});
        return false;
    };
    
    return true;
}

// Execute a call
export fn guillotine_call(handle: *EvmHandle, params: *const CallParams) ?*EvmResult {
    const evm_ptr: *DefaultEvm = @ptrCast(@alignCast(handle));
    const allocator = ffi_allocator orelse {
        setError("FFI not initialized", .{});
        return null;
    };
    
    // Convert input slice
    const input_slice = if (params.input_len > 0) params.input[0..params.input_len] else &[_]u8{};
    
    // Convert value from bytes to u256
    const value = std.mem.readInt(u256, &params.value, .big);
    
    // Create appropriate call params based on type
    const call_params = switch (params.call_type) {
        0 => DefaultEvm.CallParams{ // CALL
            .call = .{
                .caller = primitives.Address{ .bytes = params.caller },
                .to = primitives.Address{ .bytes = params.to },
                .value = value,
                .input = input_slice,
                .gas = params.gas,
            },
        },
        1 => DefaultEvm.CallParams{ // DELEGATECALL
            .delegatecall = .{
                .caller = primitives.Address{ .bytes = params.caller },
                .to = primitives.Address{ .bytes = params.to },
                .input = input_slice,
                .gas = params.gas,
            },
        },
        2 => DefaultEvm.CallParams{ // STATICCALL
            .staticcall = .{
                .caller = primitives.Address{ .bytes = params.caller },
                .to = primitives.Address{ .bytes = params.to },
                .input = input_slice,
                .gas = params.gas,
            },
        },
        3 => DefaultEvm.CallParams{ // CREATE
            .create = .{
                .caller = primitives.Address{ .bytes = params.caller },
                .value = value,
                .init_code = input_slice,
                .gas = params.gas,
            },
        },
        4 => DefaultEvm.CallParams{ // CREATE2
            .create2 = .{
                .caller = primitives.Address{ .bytes = params.caller },
                .value = value,
                .init_code = input_slice,
                .salt = std.mem.readInt(u256, &params.salt, .big),
                .gas = params.gas,
            },
        },
        else => {
            setError("Invalid call type: {}", .{params.call_type});
            return null;
        },
    };
    
    // Execute the call
    const result = evm_ptr.call(call_params);
    
    // Allocate result structure on heap
    const evm_result = allocator.create(EvmResult) catch {
        setError("Failed to allocate result", .{});
        return null;
    };
    
    // Copy output if present (caller must free)
    if (result.output.len > 0) {
        const output_copy = allocator.alloc(u8, result.output.len) catch {
            setError("Failed to allocate output buffer", .{});
            allocator.destroy(evm_result);
            return null;
        };
        @memcpy(output_copy, result.output);
        evm_result.output = output_copy.ptr;
        evm_result.output_len = output_copy.len;
    } else {
        evm_result.output = undefined;
        evm_result.output_len = 0;
    }
    
    evm_result.success = result.success;
    evm_result.gas_left = result.gas_left;
    evm_result.error_message = if (result.success) undefined else @ptrCast(&last_error_z);
    
    return evm_result;
}

// Free output buffer
export fn guillotine_free_output(output: [*]u8, len: usize) void {
    const allocator = ffi_allocator orelse return;
    allocator.free(output[0..len]);
}

// Free result structure
export fn guillotine_free_result(result: ?*EvmResult) void {
    const allocator = ffi_allocator orelse return;
    if (result) |r| {
        if (r.output_len > 0) {
            allocator.free(r.output[0..r.output_len]);
        }
        allocator.destroy(r);
    }
}

// Get last error message
export fn guillotine_get_last_error() [*:0]const u8 {
    return @ptrCast(&last_error_z);
}

// Simulate a call (doesn't commit state)
export fn guillotine_simulate(handle: *EvmHandle, params: *const CallParams) ?*EvmResult {
    const evm_ptr: *DefaultEvm = @ptrCast(@alignCast(handle));
    const allocator = ffi_allocator orelse {
        setError("FFI not initialized", .{});
        return null;
    };
    
    // Convert input slice
    const input_slice = if (params.input_len > 0) params.input[0..params.input_len] else &[_]u8{};
    
    // Convert value from bytes to u256
    const value = std.mem.readInt(u256, &params.value, .big);
    
    // Create appropriate call params based on type
    const call_params = switch (params.call_type) {
        0 => DefaultEvm.CallParams{ // CALL
            .call = .{
                .caller = primitives.Address{ .bytes = params.caller },
                .to = primitives.Address{ .bytes = params.to },
                .value = value,
                .input = input_slice,
                .gas = params.gas,
            },
        },
        else => {
            setError("Simulate only supports CALL type", .{});
            return null;
        },
    };
    
    // Simulate the call
    const result = evm_ptr.simulate(call_params);
    
    // Allocate result structure on heap
    const evm_result = allocator.create(EvmResult) catch {
        setError("Failed to allocate result", .{});
        return null;
    };
    
    // Copy output if present
    if (result.output.len > 0) {
        const output_copy = allocator.alloc(u8, result.output.len) catch {
            setError("Failed to allocate output buffer", .{});
            allocator.destroy(evm_result);
            return null;
        };
        @memcpy(output_copy, result.output);
        evm_result.output = output_copy.ptr;
        evm_result.output_len = output_copy.len;
    } else {
        evm_result.output = undefined;
        evm_result.output_len = 0;
    }
    
    evm_result.success = result.success;
    evm_result.gas_left = result.gas_left;
    evm_result.error_message = if (result.success) undefined else @ptrCast(&last_error_z);
    
    return evm_result;
}