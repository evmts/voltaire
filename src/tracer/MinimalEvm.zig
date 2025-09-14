/// Minimal EVM implementation for tracing and validation
/// This is a simplified, unoptimized EVM that executes opcodes in a straightforward
/// while loop with a single switch statement. It's designed for correctness validation
/// and debugging, not performance.
const std = @import("std");
const primitives = @import("primitives");
const GasConstants = primitives.GasConstants;

const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.ZERO_ADDRESS;

/// Host interface for system operations
pub const HostInterface = struct {
    ptr: *anyopaque,
    vtable: *const VTable,

    pub const VTable = struct {
        inner_call: *const fn (ptr: *anyopaque, gas: u64, address: primitives.Address.Address, value: u256, input: []const u8, call_type: CallType) CallResult,
        get_balance: *const fn (ptr: *anyopaque, address: primitives.Address.Address) u256,
        get_code: *const fn (ptr: *anyopaque, address: primitives.Address.Address) []const u8,
        get_storage: *const fn (ptr: *anyopaque, address: primitives.Address.Address, slot: u256) u256,
        set_storage: *const fn (ptr: *anyopaque, address: primitives.Address.Address, slot: u256, value: u256) void,
    };

    pub const CallType = enum {
        Call,
        CallCode,
        DelegateCall,
        StaticCall,
        Create,
        Create2,
    };

    pub const CallResult = struct {
        success: bool,
        gas_left: u64,
        output: []const u8,
    };

    pub fn innerCall(self: HostInterface, gas: u64, address: primitives.Address.Address, value: u256, input: []const u8, call_type: CallType) CallResult {
        return self.vtable.inner_call(self.ptr, gas, address, value, input, call_type);
    }

    pub fn getBalance(self: HostInterface, address: primitives.Address.Address) u256 {
        return self.vtable.get_balance(self.ptr, address);
    }

    pub fn getCode(self: HostInterface, address: primitives.Address.Address) []const u8 {
        return self.vtable.get_code(self.ptr, address);
    }

    pub fn getStorage(self: HostInterface, address: primitives.Address.Address, slot: u256) u256 {
        return self.vtable.get_storage(self.ptr, address, slot);
    }

    pub fn setStorage(self: HostInterface, address: primitives.Address.Address, slot: u256, value: u256) void {
        self.vtable.set_storage(self.ptr, address, slot, value);
    }
};

/// Mock host implementation for testing
pub const MockHost = struct {
    const Self = @This();
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) Self {
        return .{ .allocator = allocator };
    }

    pub fn innerCall(ptr: *anyopaque, gas: u64, address: primitives.Address.Address, value: u256, input: []const u8, call_type: HostInterface.CallType) HostInterface.CallResult {
        _ = ptr;
        _ = address;
        _ = value;
        _ = input;
        _ = call_type;
        // Mock implementation: always return success
        return .{
            .success = true,
            .gas_left = gas,
            .output = &.{},
        };
    }

    pub fn getBalance(ptr: *anyopaque, address: primitives.Address.Address) u256 {
        _ = ptr;
        _ = address;
        // Mock implementation: return 0 balance
        return 0;
    }

    pub fn getCode(ptr: *anyopaque, address: primitives.Address.Address) []const u8 {
        _ = ptr;
        _ = address;
        // Mock implementation: return empty code
        return &.{};
    }

    pub fn getStorage(ptr: *anyopaque, address: primitives.Address.Address, slot: u256) u256 {
        _ = ptr;
        _ = address;
        _ = slot;
        // Mock implementation: return 0 for all storage
        return 0;
    }

    pub fn setStorage(ptr: *anyopaque, address: primitives.Address.Address, slot: u256, value: u256) void {
        _ = ptr;
        _ = address;
        _ = slot;
        _ = value;
        // Mock implementation: no-op
    }

    pub fn hostInterface(self: *Self) HostInterface {
        return .{
            .ptr = @ptrCast(self),
            .vtable = &.{
                .inner_call = innerCall,
                .get_balance = getBalance,
                .get_code = getCode,
                .get_storage = getStorage,
                .set_storage = setStorage,
            },
        };
    }
};

pub const MinimalEvm = struct {
    const Self = @This();

    // Configuration constants
    pub const STACK_SIZE = 1024;
    pub const MAX_MEMORY_SIZE = 16 * 1024 * 1024; // 16MB max memory
    pub const MAX_CODE_SIZE = 24 * 1024; // 24KB max code size

    // Simple stack using ArrayList
    stack: std.ArrayList(u256),

    // Memory as a hashmap for sparse storage
    memory: std.AutoHashMap(u32, u8),
    memory_size: u32,

    // Storage as nested hashmaps: address -> (slot -> value)
    storage: std.AutoHashMap(Address, std.AutoHashMap(u256, u256)),

    // Access list tracking for EIP-2929 (cold/warm storage)
    accessed_storage_slots: std.AutoHashMap(StorageSlotKey, void),
    accessed_addresses: std.AutoHashMap(Address, void),

    // Original storage values for gas refund calculations
    original_storage: std.AutoHashMap(StorageSlotKey, u256),

    // Execution state
    pc: u32,
    gas_remaining: i64,
    gas_used: u64,
    bytecode: []const u8,

    // Call context
    caller: Address,
    address: Address,
    origin: Address,
    value: u256,
    calldata: []const u8,

    // Return data
    return_data: []const u8,

    // Execution status
    stopped: bool,
    reverted: bool,

    // Allocator
    allocator: std.mem.Allocator,

    // Host interface for system operations
    host: ?HostInterface,

    // Storage slot key for access tracking
    pub const StorageSlotKey = struct {
        address: Address,
        slot: u256,
    };

    /// Initialize a new MinimalEvm instance with optional host interface
    pub fn init(allocator: std.mem.Allocator, bytecode: []const u8, gas_limit: i64) !Self {
        return initWithHost(allocator, bytecode, gas_limit, null);
    }

    /// Initialize a new MinimalEvm instance with a host interface
    pub fn initWithHost(allocator: std.mem.Allocator, bytecode: []const u8, gas_limit: i64, host: ?HostInterface) !Self {
        var storage_map = std.AutoHashMap(Address, std.AutoHashMap(u256, u256)).init(allocator);
        errdefer storage_map.deinit();

        var stack = try std.ArrayList(u256).initCapacity(allocator, STACK_SIZE);
        errdefer stack.deinit(allocator);

        var memory_map = std.AutoHashMap(u32, u8).init(allocator);
        errdefer memory_map.deinit();

        var accessed_storage = std.AutoHashMap(StorageSlotKey, void).init(allocator);
        errdefer accessed_storage.deinit();

        var accessed_addrs = std.AutoHashMap(Address, void).init(allocator);
        errdefer accessed_addrs.deinit();

        var original_storage = std.AutoHashMap(StorageSlotKey, u256).init(allocator);
        errdefer original_storage.deinit();

        return Self{
            .stack = stack,
            .memory = memory_map,
            .memory_size = 0,
            .storage = storage_map,
            .pc = 0,
            .gas_remaining = @intCast(gas_limit),
            .gas_used = 0,
            .bytecode = bytecode,
            .caller = ZERO_ADDRESS,
            .address = ZERO_ADDRESS,
            .origin = Address{ .bytes = [_]u8{0x10} ++ [_]u8{0x00} ** 18 ++ [_]u8{0x01} }, // Default test origin
            .value = 0,
            .calldata = &[_]u8{},
            .return_data = &[_]u8{},
            .stopped = false,
            .reverted = false,
            .accessed_storage_slots = accessed_storage,
            .accessed_addresses = accessed_addrs,
            .original_storage = original_storage,
            .allocator = allocator,
            .host = host,
        };
    }

    /// Deinitialize and free all resources
    pub fn deinit(self: *Self) void {
        self.stack.deinit(self.allocator);
        self.memory.deinit();

        // Clean up nested storage hashmaps
        var storage_iter = self.storage.iterator();
        while (storage_iter.next()) |entry| {
            entry.value_ptr.deinit();
        }
        self.storage.deinit();

        self.accessed_storage_slots.deinit();
        self.accessed_addresses.deinit();
        self.original_storage.deinit();

        if (self.return_data.len > 0) {
            self.allocator.free(self.return_data);
        }
    }

    /// Set call context
    pub fn setCallContext(
        self: *Self,
        caller: Address,
        address: Address,
        origin: Address,
        value: u256,
        calldata: []const u8,
    ) void {
        self.caller = caller;
        self.address = address;
        self.origin = origin;
        self.value = value;
        self.calldata = calldata;
    }

    /// Validate stack doesn't overflow or underflow
    pub fn validateStack(self: *const Self, required_items: usize, max_growth: usize) !void {
        // Check underflow
        if (self.stack.items.len < required_items) {
            return error.StackUnderflow;
        }

        // Check overflow
        if (self.stack.items.len + max_growth > STACK_SIZE) {
            return error.StackOverflow;
        }
    }

    /// Push value onto stack
    pub fn pushStack(self: *Self, value: u256) !void {
        try self.validateStack(0, 1);
        try self.stack.append(self.allocator, value);
    }

    /// Pop value from stack
    pub fn popStack(self: *Self) !u256 {
        try self.validateStack(1, 0);
        return self.stack.pop() orelse unreachable; // validateStack already checked
    }

    /// Peek at top of stack without popping
    pub fn peekStack(self: *const Self, index: usize) !u256 {
        if (index >= self.stack.items.len) {
            return error.StackUnderflow;
        }
        return self.stack.items[self.stack.items.len - 1 - index];
    }

    /// Duplicate stack item
    pub fn dupStack(self: *Self, index: usize) !void {
        const value = try self.peekStack(index);
        try self.pushStack(value);
    }

    /// Swap stack items
    pub fn swapStack(self: *Self, index: usize) !void {
        if (index + 1 >= self.stack.items.len) {
            return error.StackUnderflow;
        }
        const top_idx = self.stack.items.len - 1;
        const swap_idx = top_idx - index - 1;
        std.mem.swap(u256, &self.stack.items[top_idx], &self.stack.items[swap_idx]);
    }

    /// Read byte from memory
    pub fn readMemory(self: *Self, offset: u32) u8 {
        return self.memory.get(offset) orelse 0;
    }

    /// Write byte to memory
    pub fn writeMemory(self: *Self, offset: u32, value: u8) !void {
        if (offset >= MAX_MEMORY_SIZE) {
            return error.MemoryOverflow;
        }

        try self.memory.put(offset, value);

        // Update memory size if needed
        if (offset >= self.memory_size) {
            self.memory_size = offset + 1;
        }
    }

    /// Read word from memory
    pub fn readMemoryWord(self: *Self, offset: u32) u256 {
        var result: u256 = 0;
        var i: u32 = 0;
        while (i < 32) : (i += 1) {
            const byte = self.readMemory(offset + i);
            result = (result << 8) | byte;
        }
        return result;
    }

    /// Write word to memory
    pub fn writeMemoryWord(self: *Self, offset: u32, value: u256) !void {
        var i: u32 = 0;
        const val = value;
        while (i < 32) : (i += 1) {
            const byte = @as(u8, @truncate(val >> @intCast((31 - i) * 8)));
            try self.writeMemory(offset + i, byte);
        }
    }

    /// Access a storage slot and return the gas cost (cold vs warm)
    pub fn accessStorageSlot(self: *Self, address: Address, slot: u256) !u64 {
        const key = StorageSlotKey{ .address = address, .slot = slot };

        // Check if already accessed (warm)
        if (self.accessed_storage_slots.contains(key)) {
            return GasConstants.WarmStorageReadCost; // 100 gas for warm access
        }

        // Mark as accessed for future warm access
        try self.accessed_storage_slots.put(key, {});
        return GasConstants.ColdSloadCost; // 2100 gas for cold access
    }

    /// Access an address and return the gas cost (cold vs warm)
    pub fn accessAddress(self: *Self, address: Address) !u64 {
        // Check if already accessed (warm)
        if (self.accessed_addresses.contains(address)) {
            return GasConstants.WarmStorageReadCost; // 100 gas for warm access
        }

        // Mark as accessed for future warm access
        try self.accessed_addresses.put(address, {});
        return GasConstants.ColdAccountAccessCost; // 2600 gas for cold access
    }

    /// Read from storage
    pub fn readStorage(self: *Self, address: Address, slot: u256) !u256 {
        const account_storage = self.storage.get(address) orelse return 0;
        return account_storage.get(slot) orelse 0;
    }

    /// Write to storage
    pub fn writeStorage(self: *Self, address: Address, slot: u256, value: u256) !void {
        // Record original value if this is the first write to this slot
        const key = StorageSlotKey{ .address = address, .slot = slot };
        if (!self.original_storage.contains(key)) {
            const current = try self.readStorage(address, slot);
            try self.original_storage.put(key, current);
        }

        var account_storage = self.storage.getPtr(address) orelse blk: {
            const new_storage = std.AutoHashMap(u256, u256).init(self.allocator);
            try self.storage.put(address, new_storage);
            break :blk self.storage.getPtr(address).?;
        };

        try account_storage.put(slot, value);
    }

    /// Get original storage value (for gas calculation)
    pub fn getOriginalStorage(self: *Self, address: Address, slot: u256) ?u256 {
        const key = StorageSlotKey{ .address = address, .slot = slot };
        return self.original_storage.get(key);
    }

    /// Consume gas
    pub fn consumeGas(self: *Self, amount: u64) !void {
        if (self.gas_remaining < @as(i64, @intCast(amount))) {
            self.gas_remaining = 0;
            return error.OutOfGas;
        }
        self.gas_remaining -= @intCast(amount);
        self.gas_used += amount;
    }

    /// Get current opcode
    pub fn getCurrentOpcode(self: *const Self) ?u8 {
        if (self.pc >= self.bytecode.len) {
            return null;
        }
        return self.bytecode[self.pc];
    }

    /// Read immediate data (for PUSH operations)
    pub fn readImmediate(self: *const Self, size: u8) ?u256 {
        if (self.pc + 1 + size > self.bytecode.len) {
            return null;
        }

        var result: u256 = 0;
        var i: u8 = 0;
        while (i < size) : (i += 1) {
            result = (result << 8) | self.bytecode[self.pc + 1 + i];
        }
        return result;
    }

    /// Execute a single opcode
    pub fn executeOpcode(self: *Self, opcode: u8) !void {

        // Giant switch statement for all opcodes
        switch (opcode) {
                // STOP
                0x00 => {
                    // STOP has no gas cost beyond the intrinsic transaction cost
                    self.stopped = true;
                    return;
                },

                // ADD
                0x01 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const top = try self.popStack();
                    const second = try self.popStack();
                    const result = top +% second; // Wrapping addition
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // MUL
                0x02 => {
                    try self.consumeGas(GasConstants.GasFastStep);
                    const top = try self.popStack();
                    const second = try self.popStack();
                    const result = top *% second; // Wrapping multiplication
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SUB
                0x03 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const top = try self.popStack();     // µs[0] (first popped)
                    const second = try self.popStack();  // µs[1] (second popped)
                    const result = top -% second;       // SUB: µs[0] - µs[1] = top - second
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // DIV
                0x04 => {
                    try self.consumeGas(GasConstants.GasFastStep);
                    const a = try self.popStack();     // First operand (dividend)
                    const b = try self.popStack();     // Second operand (divisor)
                    const result = if (b == 0) 0 else a / b;  // a / b, division by zero = 0
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SDIV - Signed division
                0x05 => {
                    try self.consumeGas(GasConstants.GasFastStep);
                    const a = try self.popStack();     // First operand (dividend)
                    const b = try self.popStack();     // Second operand (divisor)

                    if (b == 0) {
                        try self.pushStack(0);
                    } else {
                        const MIN_SIGNED: u256 = 1 << 255;
                        const NEG_ONE = std.math.maxInt(u256); // -1 in two's complement

                        // Special case: MIN_SIGNED / -1 would overflow
                        if (a == MIN_SIGNED and b == NEG_ONE) {
                            try self.pushStack(MIN_SIGNED);
                        } else {
                            // Convert to signed and perform a / b
                            const a_signed = @as(i256, @bitCast(a));
                            const b_signed = @as(i256, @bitCast(b));
                            const result_signed = @divTrunc(a_signed, b_signed);
                            const result = @as(u256, @bitCast(result_signed));
                            try self.pushStack(result);
                        }
                    }
                    self.pc += 1;
                },

                // MOD
                0x06 => {
                    try self.consumeGas(GasConstants.GasFastStep);
                    const a = try self.popStack();     // First operand
                    const b = try self.popStack();     // Second operand (modulus)
                    const result = if (b == 0) 0 else a % b;  // a % b
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SMOD - Signed modulo
                0x07 => {
                    try self.consumeGas(GasConstants.GasFastStep);
                    const a = try self.popStack();     // First operand
                    const b = try self.popStack();     // Second operand (modulus)

                    if (b == 0) {
                        try self.pushStack(0);
                    } else {
                        const a_signed = @as(i256, @bitCast(a));
                        const b_signed = @as(i256, @bitCast(b));
                        const result_signed = @rem(a_signed, b_signed);  // a % b
                        const result = @as(u256, @bitCast(result_signed));
                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // ADDMOD
                0x08 => {
                    try self.consumeGas(GasConstants.GasMidStep);
                    const a = try self.popStack();
                    const b = try self.popStack();
                    const N = try self.popStack();

                    if (N == 0) {
                        try self.pushStack(0);
                    } else {
                        // Use 512-bit arithmetic to avoid overflow
                        const a_wide = @as(u512, a);
                        const b_wide = @as(u512, b);
                        const sum = a_wide + b_wide;
                        const result = @as(u256, @truncate(sum % N));
                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // MULMOD
                0x09 => {
                    try self.consumeGas(GasConstants.GasMidStep);
                    const a = try self.popStack();
                    const b = try self.popStack();
                    const N = try self.popStack();

                    if (N == 0) {
                        try self.pushStack(0);
                    } else {
                        // Use 512-bit arithmetic to avoid overflow
                        const a_wide = @as(u512, a);
                        const b_wide = @as(u512, b);
                        const product = a_wide * b_wide;
                        const result = @as(u256, @truncate(product % N));
                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // EXP - Exponential
                0x0a => {
                    const base = try self.popStack();
                    const exponent = try self.popStack();

                    // Calculate gas cost for EXP: 10 + 50 * byte_size_of_exponent
                    const byte_size: u64 = if (exponent == 0) 0 else @as(u64, (256 - @as(u16, @clz(exponent)) + 7) / 8);
                    try self.consumeGas(10 + 50 * byte_size);

                    var result: u256 = 1;
                    var b = base;
                    var e = exponent;

                    while (e > 0) : (e >>= 1) {
                        if (e & 1 == 1) {
                            result *%= b;
                        }
                        b *%= b;
                    }

                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SIGNEXTEND
                0x0b => {
                    try self.consumeGas(GasConstants.GasFastStep);
                    const byte_num = try self.popStack();
                    const value = try self.popStack();

                    if (byte_num >= 31) {
                        // No extension needed
                        try self.pushStack(value);
                    } else {
                        const bit_index = byte_num * 8 + 7;
                        const bit = (value >> @intCast(bit_index)) & 1;

                        if (bit == 1) {
                            // Sign bit is 1, extend with 1s
                            const mask = ((@as(u256, 1) << @intCast(bit_index + 1)) - 1);
                            const result = value | ~mask;
                            try self.pushStack(result);
                        } else {
                            // Sign bit is 0, extend with 0s
                            const mask = ((@as(u256, 1) << @intCast(bit_index + 1)) - 1);
                            const result = value & mask;
                            try self.pushStack(result);
                        }
                    }
                    self.pc += 1;
                },

                // Comparison operations (0x10-0x15)
                // LT - Less than
                0x10 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const a = try self.popStack();
                    const b = try self.popStack();
                    const result: u256 = if (b < a) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // GT - Greater than
                0x11 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const a = try self.popStack();
                    const b = try self.popStack();
                    const result: u256 = if (b > a) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SLT - Signed less than
                0x12 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const a = try self.popStack();
                    const b = try self.popStack();
                    const a_signed = @as(i256, @bitCast(a));
                    const b_signed = @as(i256, @bitCast(b));
                    const result: u256 = if (b_signed < a_signed) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SGT - Signed greater than
                0x13 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const a = try self.popStack();
                    const b = try self.popStack();
                    const a_signed = @as(i256, @bitCast(a));
                    const b_signed = @as(i256, @bitCast(b));
                    const result: u256 = if (b_signed > a_signed) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // EQ - Equal
                0x14 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const a = try self.popStack();
                    const b = try self.popStack();
                    const result: u256 = if (a == b) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // ISZERO
                0x15 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const a = try self.popStack();
                    const result: u256 = if (a == 0) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // Bitwise operations (0x16-0x1d)
                // AND
                0x16 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const a = try self.popStack();
                    const b = try self.popStack();
                    const result = a & b;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // OR
                0x17 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const a = try self.popStack();
                    const b = try self.popStack();
                    const result = a | b;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // XOR
                0x18 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const a = try self.popStack();
                    const b = try self.popStack();
                    const result = a ^ b;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // NOT
                0x19 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const a = try self.popStack();
                    const result = ~a;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // BYTE
                0x1a => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const x = try self.popStack();
                    const i = try self.popStack();

                    if (x >= 32) {
                        try self.pushStack(0);
                    } else {
                        // Get the x-th byte from the left (big-endian)
                        const byte_val = (i >> @intCast((31 - x) * 8)) & 0xFF;
                        try self.pushStack(byte_val);
                    }
                    self.pc += 1;
                },

                // SHL - Shift left
                0x1b => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const value = try self.popStack();
                    const shift = try self.popStack();

                    if (value >= 256) {
                        try self.pushStack(0);
                    } else {
                        const result = shift << @intCast(value);
                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // SHR - Logical shift right
                0x1c => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const value = try self.popStack();
                    const shift = try self.popStack();

                    if (value >= 256) {
                        try self.pushStack(0);
                    } else {
                        const result = shift >> @intCast(value);
                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // SAR - Arithmetic shift right
                0x1d => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const value = try self.popStack();
                    const shift = try self.popStack();

                    if (value >= 256) {
                        // If negative, result is all 1s, else 0
                        const sign_bit = shift >> 255;
                        const result: u256 = if (sign_bit == 1) std.math.maxInt(u256) else 0;
                        try self.pushStack(result);
                    } else {
                        const shift_signed = @as(i256, @bitCast(shift));
                        const result_signed = shift_signed >> @intCast(value);
                        const result = @as(u256, @bitCast(result_signed));
                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // SHA3 / KECCAK256
                0x20 => {
                    const length = try self.popStack();
                    const offset = try self.popStack();

                    // Calculate gas cost: base + word cost
                    const word_count = @as(u64, @intCast((length + 31) / 32));
                    try self.consumeGas(GasConstants.Keccak256Gas + word_count * GasConstants.Keccak256WordGas);

                    // Read data from memory
                    if (length > std.math.maxInt(u32)) {
                        return error.OutOfGas; // Too much memory
                    }

                    const len = @as(u32, @intCast(length));
                    const off = @as(u32, @intCast(offset));

                    // Calculate memory expansion cost
                    const new_mem_size = off + len;
                    if (new_mem_size > self.memory_size) {
                        const expansion = new_mem_size - self.memory_size;
                        const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                        try self.consumeGas(gas_cost);
                    }

                    // Read bytes from memory
                    var data = try self.allocator.alloc(u8, len);
                    defer self.allocator.free(data);

                    var i: u32 = 0;
                    while (i < len) : (i += 1) {
                        data[i] = self.readMemory(off + i);
                    }

                    // Calculate keccak256
                    var hash: [32]u8 = undefined;
                    std.crypto.hash.sha3.Keccak256.hash(data, &hash, .{});

                    // Convert hash to u256
                    var result: u256 = 0;
                    for (hash) |byte| {
                        result = (result << 8) | byte;
                    }

                    try self.pushStack(result);
                    self.pc += 1;
                },

                // Environmental operations (0x30-0x3f)
                // ADDRESS
                0x30 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    const addr_int = @as(u256, @bitCast(@as([32]u8, self.address.bytes ++ [_]u8{0} ** 12)));
                    try self.pushStack(addr_int);
                    self.pc += 1;
                },

                // BALANCE - For simplicity, return 0 (would need host interface in real implementation)
                0x31 => {
                    const addr_int = try self.popStack();
                    // Convert u256 to address by taking the lower 20 bytes
                    var addr_bytes: [20]u8 = undefined;
                    var i: usize = 0;
                    while (i < 20) : (i += 1) {
                        addr_bytes[19 - i] = @as(u8, @truncate(addr_int >> @intCast(i * 8)));
                    }
                    const addr = Address{ .bytes = addr_bytes };

                    // Access address and get gas cost (cold vs warm)
                    const access_cost = try self.accessAddress(addr);
                    try self.consumeGas(access_cost);

                    try self.pushStack(0); // Return 0 balance
                    self.pc += 1;
                },

                // ORIGIN
                0x32 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    const origin_int = @as(u256, @bitCast(@as([32]u8, self.origin.bytes ++ [_]u8{0} ** 12)));
                    try self.pushStack(origin_int);
                    self.pc += 1;
                },

                // CALLER
                0x33 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    const caller_int = @as(u256, @bitCast(@as([32]u8, self.caller.bytes ++ [_]u8{0} ** 12)));
                    try self.pushStack(caller_int);
                    self.pc += 1;
                },

                // CALLVALUE
                0x34 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(self.value);
                    self.pc += 1;
                },

                // CALLDATALOAD
                0x35 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const offset = try self.popStack();

                    if (offset > std.math.maxInt(u32)) {
                        try self.pushStack(0);
                    } else {
                        const off = @as(u32, @intCast(offset));
                        var result: u256 = 0;

                        // Read 32 bytes from calldata
                        var i: u32 = 0;
                        while (i < 32) : (i += 1) {
                            const byte = if (off + i < self.calldata.len) self.calldata[off + i] else 0;
                            result = (result << 8) | byte;
                        }

                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // CALLDATASIZE
                0x36 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(self.calldata.len);
                    self.pc += 1;
                },

                // CALLDATACOPY
                0x37 => {
                    const length = try self.popStack();
                    const offset = try self.popStack();
                    const dest_offset = try self.popStack();

                    // Static gas cost: 3 + 3 * word_count
                    const word_count = @as(u64, @intCast((length + 31) / 32));
                    try self.consumeGas(GasConstants.GasFastestStep + GasConstants.GasFastestStep * word_count);

                    if (length > std.math.maxInt(u32)) {
                        return error.OutOfGas;
                    }

                    const len = @as(u32, @intCast(length));
                    const src_off = @as(u32, @intCast(offset));
                    const dst_off = @as(u32, @intCast(dest_offset));

                    // Memory expansion
                    const new_mem_size = dst_off + len;
                    if (new_mem_size > self.memory_size) {
                        const expansion = new_mem_size - self.memory_size;
                        const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                        try self.consumeGas(gas_cost);
                    }

                    // Copy data
                    var i: u32 = 0;
                    while (i < len) : (i += 1) {
                        const byte = if (src_off + i < self.calldata.len) self.calldata[src_off + i] else 0;
                        try self.writeMemory(dst_off + i, byte);
                    }

                    self.pc += 1;
                },

                // CODESIZE
                0x38 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(self.bytecode.len);
                    self.pc += 1;
                },

                // CODECOPY
                0x39 => {
                    const length = try self.popStack();
                    const offset = try self.popStack();
                    const dest_offset = try self.popStack();

                    // Static gas cost: 3 + 3 * word_count
                    const word_count = @as(u64, @intCast((length + 31) / 32));
                    try self.consumeGas(GasConstants.GasFastestStep + GasConstants.GasFastestStep * word_count);

                    if (length > std.math.maxInt(u32)) {
                        return error.OutOfGas;
                    }

                    const len = @as(u32, @intCast(length));
                    const src_off = @as(u32, @intCast(offset));
                    const dst_off = @as(u32, @intCast(dest_offset));

                    // Memory expansion
                    const new_mem_size = dst_off + len;
                    if (new_mem_size > self.memory_size) {
                        const expansion = new_mem_size - self.memory_size;
                        const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                        try self.consumeGas(gas_cost);
                    }

                    // Copy code
                    var i: u32 = 0;
                    while (i < len) : (i += 1) {
                        const byte = if (src_off + i < self.bytecode.len) self.bytecode[src_off + i] else 0;
                        try self.writeMemory(dst_off + i, byte);
                    }

                    self.pc += 1;
                },

                // GASPRICE - Return 0 for simplicity
                0x3a => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // EXTCODESIZE - Return 0 for simplicity
                0x3b => {
                    const addr_int = try self.popStack();
                    // Convert u256 to address by taking the lower 20 bytes
                    var addr_bytes: [20]u8 = undefined;
                    var i: usize = 0;
                    while (i < 20) : (i += 1) {
                        addr_bytes[19 - i] = @as(u8, @truncate(addr_int >> @intCast(i * 8)));
                    }
                    const addr = Address{ .bytes = addr_bytes };

                    // Access address and get gas cost (cold vs warm)
                    const access_cost = try self.accessAddress(addr);
                    try self.consumeGas(access_cost);

                    try self.pushStack(0);
                    self.pc += 1;
                },

                // EXTCODECOPY - No-op for simplicity
                0x3c => {
                    const addr_int = try self.popStack();
                    const dest_offset = try self.popStack();
                    const offset = try self.popStack();
                    const length = try self.popStack();

                    // Convert u256 to address by taking the lower 20 bytes
                    var addr_bytes: [20]u8 = undefined;
                    var i: usize = 0;
                    while (i < 20) : (i += 1) {
                        addr_bytes[19 - i] = @as(u8, @truncate(addr_int >> @intCast(i * 8)));
                    }
                    const addr = Address{ .bytes = addr_bytes };

                    // Access address and get gas cost (cold vs warm)
                    const access_cost = try self.accessAddress(addr);

                    // Gas cost: address access + 3 * word_count
                    const word_count = @as(u64, @intCast((length + 31) / 32));
                    try self.consumeGas(access_cost + GasConstants.GasFastestStep * word_count);

                    _ = dest_offset;
                    _ = offset;
                    self.pc += 1;
                },

                // RETURNDATASIZE
                0x3d => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(self.return_data.len);
                    self.pc += 1;
                },

                // RETURNDATACOPY
                0x3e => {
                    const length = try self.popStack();
                    const offset = try self.popStack();
                    const dest_offset = try self.popStack();

                    // Static gas cost: 3 + 3 * word_count
                    const word_count = @as(u64, @intCast((length + 31) / 32));
                    try self.consumeGas(GasConstants.GasFastestStep + GasConstants.GasFastestStep * word_count);

                    if (length > std.math.maxInt(u32)) {
                        return error.OutOfGas;
                    }

                    const len = @as(u32, @intCast(length));
                    const src_off = @as(u32, @intCast(offset));
                    const dst_off = @as(u32, @intCast(dest_offset));

                    // Check bounds
                    if (src_off + len > self.return_data.len) {
                        return error.InvalidMemoryAccess;
                    }

                    // Memory expansion
                    const new_mem_size = dst_off + len;
                    if (new_mem_size > self.memory_size) {
                        const expansion = new_mem_size - self.memory_size;
                        const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                        try self.consumeGas(gas_cost);
                    }

                    // Copy return data
                    var i: u32 = 0;
                    while (i < len) : (i += 1) {
                        const byte = self.return_data[src_off + i];
                        try self.writeMemory(dst_off + i, byte);
                    }

                    self.pc += 1;
                },

                // EXTCODEHASH - Return 0 for simplicity
                0x3f => {
                    const addr_int = try self.popStack();
                    // Convert u256 to address by taking the lower 20 bytes
                    var addr_bytes: [20]u8 = undefined;
                    var i: usize = 0;
                    while (i < 20) : (i += 1) {
                        addr_bytes[19 - i] = @as(u8, @truncate(addr_int >> @intCast(i * 8)));
                    }
                    const addr = Address{ .bytes = addr_bytes };

                    // Access address and get gas cost (cold vs warm)
                    const access_cost = try self.accessAddress(addr);
                    try self.consumeGas(access_cost);

                    try self.pushStack(0);
                    self.pc += 1;
                },

                // Block operations (0x40-0x48)
                // BLOCKHASH - Return 0 for simplicity
                0x40 => {
                    try self.consumeGas(GasConstants.GasExtStep);
                    _ = try self.popStack(); // Pop block number
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // COINBASE - Return zero address
                0x41 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // TIMESTAMP - Return 0
                0x42 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // NUMBER - Return 0
                0x43 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // DIFFICULTY/PREVRANDAO - Return 0
                0x44 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // GASLIMIT - Return max gas
                0x45 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(30_000_000);
                    self.pc += 1;
                },

                // CHAINID - Return 1 (mainnet)
                0x46 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(1);
                    self.pc += 1;
                },

                // SELFBALANCE - Return 0
                0x47 => {
                    try self.consumeGas(GasConstants.GasFastStep);
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // BASEFEE - Return 0
                0x48 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // BLOBHASH - Return 0
                0x49 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    _ = try self.popStack(); // Pop index
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // BLOBBASEFEE - Return 0
                0x4a => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // Stack, Memory, Storage operations (0x50-0x5b)
                0x50 => { // POP
                    try self.consumeGas(GasConstants.GasQuickStep);
                    _ = try self.popStack();
                    self.pc += 1;
                },

                // MLOAD
                0x51 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const offset = try self.popStack();

                    if (offset > std.math.maxInt(u32)) {
                        return error.OutOfGas;
                    }

                    const off = @as(u32, @intCast(offset));

                    // Memory expansion
                    const new_mem_size = off + 32;
                    if (new_mem_size > self.memory_size) {
                        const expansion = new_mem_size - self.memory_size;
                        const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                        try self.consumeGas(gas_cost);
                    }

                    const word = self.readMemoryWord(off);
                    try self.pushStack(word);
                    self.pc += 1;
                },

                // MSTORE
                0x52 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    // EVM expects offset first, then value on stack
                    const offset = try self.popStack();
                    const value = try self.popStack();

                    if (offset > std.math.maxInt(u32)) {
                        return error.OutOfGas;
                    }

                    const off = @as(u32, @intCast(offset));

                    // Memory expansion
                    const new_mem_size = off + 32;
                    if (new_mem_size > self.memory_size) {
                        const expansion = new_mem_size - self.memory_size;
                        const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                        try self.consumeGas(gas_cost);
                    }

                    try self.writeMemoryWord(off, value);
                    self.pc += 1;
                },

                // MSTORE8
                0x53 => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    // EVM expects offset first, then value on stack
                    const offset = try self.popStack();
                    const value = try self.popStack();

                    if (offset > std.math.maxInt(u32)) {
                        return error.OutOfGas;
                    }

                    const off = @as(u32, @intCast(offset));
                    const byte_val = @as(u8, @truncate(value & 0xFF));

                    // Memory expansion
                    const new_mem_size = off + 1;
                    if (new_mem_size > self.memory_size) {
                        const expansion = new_mem_size - self.memory_size;
                        const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                        try self.consumeGas(gas_cost);
                    }

                    try self.writeMemory(off, byte_val);
                    self.pc += 1;
                },

                // SLOAD
                0x54 => {
                    const slot = try self.popStack();

                    // Access storage slot and get gas cost (cold vs warm)
                    const access_cost = try self.accessStorageSlot(self.address, slot);
                    try self.consumeGas(access_cost);

                    const value = try self.readStorage(self.address, slot);
                    try self.pushStack(value);
                    self.pc += 1;
                },

                // SSTORE
                0x55 => {
                    const slot = try self.popStack();
                    const value = try self.popStack();

                    // Get current value for gas calculation
                    const current_value = try self.readStorage(self.address, slot);

                    // Access storage slot to warm it and get cost
                    const access_cost = try self.accessStorageSlot(self.address, slot);
                    const is_cold = access_cost == GasConstants.ColdSloadCost;

                    // Get original value (or use current if not set)
                    const original_value = self.getOriginalStorage(self.address, slot) orelse current_value;

                    // Calculate SSTORE gas cost using proper EIP-2200 logic
                    const total_gas_cost = GasConstants.sstore_gas_cost(current_value, original_value, value, is_cold);
                    try self.consumeGas(total_gas_cost);

                    // Write the new value
                    try self.writeStorage(self.address, slot, value);
                    self.pc += 1;
                },

                // TLOAD - Transient storage load
                0x5c => {
                    try self.consumeGas(GasConstants.WarmStorageReadCost);
                    const slot = try self.popStack();
                    // For MinimalEvm, transient storage always returns 0 (simplified)
                    _ = slot;
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // TSTORE - Transient storage store
                0x5d => {
                    try self.consumeGas(GasConstants.WarmStorageReadCost);
                    const slot = try self.popStack();
                    const value = try self.popStack();
                    // For MinimalEvm, transient storage is no-op (simplified)
                    _ = slot;
                    _ = value;
                    self.pc += 1;
                },

                // JUMP
                0x56 => {
                    try self.consumeGas(GasConstants.GasMidStep);
                    const dest = try self.popStack();

                    if (dest > std.math.maxInt(u32)) {
                        return error.InvalidJump;
                    }

                    const destination = @as(u32, @intCast(dest));

                    // Verify JUMPDEST at destination
                    if (destination >= self.bytecode.len or self.bytecode[destination] != 0x5b) {
                        return error.InvalidJump;
                    }

                    self.pc = destination;
                },

                // JUMPI
                0x57 => {
                    try self.consumeGas(GasConstants.GasSlowStep);
                    const condition = try self.popStack();
                    const dest = try self.popStack();

                    if (condition != 0) {
                        if (dest > std.math.maxInt(u32)) {
                            return error.InvalidJump;
                        }

                        const destination = @as(u32, @intCast(dest));

                        // Verify JUMPDEST at destination
                        if (destination >= self.bytecode.len or self.bytecode[destination] != 0x5b) {
                            return error.InvalidJump;
                        }

                        self.pc = destination;
                    } else {
                        self.pc += 1;
                    }
                },

                // PC
                0x58 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(self.pc);
                    self.pc += 1;
                },

                // MSIZE
                0x59 => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    // Round up to nearest multiple of 32
                    const msize = ((self.memory_size + 31) / 32) * 32;
                    try self.pushStack(msize);
                    self.pc += 1;
                },

                // GAS
                0x5a => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    const gas = @max(self.gas_remaining, 0);
                    try self.pushStack(@intCast(gas));
                    self.pc += 1;
                },
                0x5b => { // JUMPDEST
                    try self.consumeGas(1); // JUMPDEST has a cost of 1 gas
                    self.pc += 1;
                },

                // MCOPY - Memory copy (EIP-5656)
                0x5e => {
                    try self.consumeGas(GasConstants.GasFastestStep); // Base cost
                    const dest_offset = try self.popStack();  // Top of stack
                    const src_offset = try self.popStack();   // Second
                    const size = try self.popStack();         // Third

                    // Check if size is 0 (no-op)
                    if (size == 0) {
                        self.pc += 1;
                        return;
                    }

                    // Calculate dynamic gas cost
                    const words = (size + 31) / 32;
                    const copy_gas = words * GasConstants.CopyGas;
                    try self.consumeGas(@intCast(copy_gas));

                    // Calculate memory expansion for both source and destination
                    const src_end = src_offset + size;
                    const dest_end = dest_offset + size;

                    // Check bounds
                    if (src_end > MAX_MEMORY_SIZE or dest_end > MAX_MEMORY_SIZE) {
                        return error.OutOfBounds;
                    }

                    // Expand memory if needed and charge gas
                    const max_end = @max(src_end, dest_end);
                    if (max_end > self.memory_size) {
                        const old_size_words = (self.memory_size + 31) / 32;
                        const new_size_words = (max_end + 31) / 32;

                        // Memory expansion gas cost
                        const old_cost = old_size_words * GasConstants.MemoryGas + (old_size_words * old_size_words) / 512;
                        const new_cost = new_size_words * GasConstants.MemoryGas + (new_size_words * new_size_words) / 512;
                        const expansion_cost = new_cost - old_cost;
                        try self.consumeGas(@intCast(expansion_cost));

                        self.memory_size = @intCast(max_end);
                    }

                    // Copy memory (handle overlapping regions correctly)
                    // First, read all source bytes into a temporary buffer
                    var temp_buffer = std.ArrayList(u8){};
                    defer temp_buffer.deinit(self.allocator);

                    var i: u256 = 0;
                    while (i < size) : (i += 1) {
                        const src_addr = @as(u32, @intCast((src_offset + i) & 0xFFFFFFFF));
                        const byte = self.memory.get(src_addr) orelse 0;
                        try temp_buffer.append(self.allocator, byte);
                    }

                    // Then write to destination
                    i = 0;
                    while (i < size) : (i += 1) {
                        const dest_addr = @as(u32, @intCast((dest_offset + i) & 0xFFFFFFFF));
                        try self.memory.put(dest_addr, temp_buffer.items[@intCast(i)]);
                    }

                    self.pc += 1;
                },

                // PUSH0
                0x5f => {
                    try self.consumeGas(GasConstants.GasQuickStep);
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // PUSH operations (0x60-0x7f)
                0x60...0x7f => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const push_size = opcode - 0x5f;
                    const value = self.readImmediate(push_size) orelse return error.InvalidPush;
                    try self.pushStack(value);
                    self.pc += 1 + push_size;
                },

                // DUP operations (0x80-0x8f)
                0x80...0x8f => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const dup_index = opcode - 0x7f; // DUP1 = 0x80, so index should be 1
                    try self.dupStack(dup_index - 1); // -1 because we use 0-based indexing
                    self.pc += 1;
                },

                // SWAP operations (0x90-0x9f)
                0x90...0x9f => {
                    try self.consumeGas(GasConstants.GasFastestStep);
                    const swap_index = opcode - 0x8f; // SWAP1 = 0x90, so index should be 1
                    try self.swapStack(swap_index - 1); // -1 because we use 0-based indexing
                    self.pc += 1;
                },

                // LOG operations (0xa0-0xa4)
                0xa0...0xa4 => {
                    const topic_count = opcode - 0xa0;
                    const offset = try self.popStack();
                    const length = try self.popStack();

                    // Pop topics
                    var topics: [4]u256 = [_]u256{0} ** 4;
                    for (0..topic_count) |i| {
                        topics[i] = try self.popStack();
                    }

                    // Read data from memory if length > 0
                    if (length > 0) {
                        if (offset > std.math.maxInt(u32) or length > std.math.maxInt(u32)) {
                            return error.OutOfGas;
                        }

                        const off = @as(u32, @intCast(offset));
                        const len = @as(u32, @intCast(length));

                        // Memory expansion
                        const new_mem_size = off + len;
                        if (new_mem_size > self.memory_size) {
                            const expansion = new_mem_size - self.memory_size;
                            const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                        try self.consumeGas(gas_cost);
                        }

                        // Note: In a real implementation, we'd emit the log event here
                        // For this minimal tracer, we just consume gas and continue
                    }

                    // Gas cost: 375 + 375*topic_count + 8*length
                    const gas_cost: u64 = 375 + (375 * @as(u64, topic_count)) + (8 * @min(length, 1000000));
                    try self.consumeGas(gas_cost);

                    self.pc += 1;
                },

                // System operations (0xf0-0xff)
                0xf0 => { // CREATE
                    const value = try self.popStack();
                    const offset = try self.popStack();
                    const length = try self.popStack();

                    _ = value;
                    _ = offset;
                    _ = length;

                    // Simplified: push 0 address for failed creation
                    try self.pushStack(0);
                    try self.consumeGas(32000);
                    self.pc += 1;
                },
                0xf1 => { // CALL
                    const gas = try self.popStack();
                    const address_u256 = try self.popStack();
                    const value = try self.popStack();
                    const in_offset = try self.popStack();
                    const in_length = try self.popStack();
                    const out_offset = try self.popStack();
                    const out_length = try self.popStack();

                    // Convert address from u256 to Address
                    var addr_bytes: [20]u8 = undefined;
                    var i: usize = 0;
                    while (i < 20) : (i += 1) {
                        addr_bytes[19 - i] = @as(u8, @truncate(address_u256 >> @intCast(i * 8)));
                    }
                    const address = Address{ .bytes = addr_bytes };

                    // If host is available, use it for the call
                    if (self.host) |host| {
                        // Read input data from memory
                        var input_data: []const u8 = &.{};
                        if (in_length > 0 and in_length <= std.math.maxInt(u32)) {
                            const in_off = @as(u32, @intCast(in_offset));
                            const in_len = @as(u32, @intCast(in_length));
                            // Ensure memory expansion
                            const new_mem_size = in_off + in_len;
                            if (new_mem_size > self.memory_size) {
                                const expansion = new_mem_size - self.memory_size;
                                const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                                try self.consumeGas(gas_cost);
                            }
                            // Read bytes from memory
                            var data = try self.allocator.alloc(u8, in_len);
                            defer self.allocator.free(data);
                            var j: u32 = 0;
                            while (j < in_len) : (j += 1) {
                                data[j] = self.readMemory(in_off + j);
                            }
                            input_data = data;
                        }

                        // Make the call through host
                        const result = host.innerCall(@intCast(gas), address, value, input_data, .Call);

                        // Write output to memory if requested
                        if (result.success and out_length > 0 and result.output.len > 0) {
                            const out_off = @as(u32, @intCast(out_offset));
                            const copy_len = @min(@as(u32, @intCast(out_length)), @as(u32, @intCast(result.output.len)));
                            // Ensure memory expansion for output
                            const new_mem_size = out_off + copy_len;
                            if (new_mem_size > self.memory_size) {
                                const expansion = new_mem_size - self.memory_size;
                                const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                                try self.consumeGas(gas_cost);
                            }
                            // Write output to memory
                            var k: u32 = 0;
                            while (k < copy_len) : (k += 1) {
                                try self.writeMemory(out_off + k, result.output[k]);
                            }
                        }

                        // Store return data
                        if (self.return_data.len > 0) {
                            self.allocator.free(self.return_data);
                        }
                        self.return_data = try self.allocator.dupe(u8, result.output);

                        // Push success status
                        try self.pushStack(if (result.success) 1 else 0);

                        // Consume gas
                        const gas_used = @as(u64, @intCast(gas)) - result.gas_left;
                        try self.consumeGas(gas_used);
                    } else {
                        // Fallback to mock behavior
                        try self.pushStack(1);
                        try self.consumeGas(700);
                    }
                    self.pc += 1;
                },
                0xf2 => { // CALLCODE
                    const gas = try self.popStack();
                    const address = try self.popStack();
                    const value = try self.popStack();
                    const in_offset = try self.popStack();
                    const in_length = try self.popStack();
                    const out_offset = try self.popStack();
                    const out_length = try self.popStack();

                    _ = gas;
                    _ = address;
                    _ = value;
                    _ = in_offset;
                    _ = in_length;
                    _ = out_offset;
                    _ = out_length;

                    // Simplified: push 1 for success
                    try self.pushStack(1);
                    try self.consumeGas(700);
                    self.pc += 1;
                },
                0xf3 => { // RETURN
                    const offset = try self.popStack();
                    const length = try self.popStack();

                    if (offset > std.math.maxInt(u32) or length > std.math.maxInt(u32)) {
                        return error.OutOfGas;
                    }

                    const off = @as(u32, @intCast(offset));
                    const len = @as(u32, @intCast(length));

                    // Memory expansion if needed
                    if (len > 0) {
                        const new_mem_size = off + len;
                        if (new_mem_size > self.memory_size) {
                            const expansion = new_mem_size - self.memory_size;
                            const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                        try self.consumeGas(gas_cost);
                        }
                    }

                    self.stopped = true;
                    return;
                },
                0xf4 => { // DELEGATECALL
                    const gas = try self.popStack();
                    const address_u256 = try self.popStack();
                    const in_offset = try self.popStack();
                    const in_length = try self.popStack();
                    const out_offset = try self.popStack();
                    const out_length = try self.popStack();

                    // Convert address from u256 to Address
                    var addr_bytes: [20]u8 = undefined;
                    var i: usize = 0;
                    while (i < 20) : (i += 1) {
                        addr_bytes[19 - i] = @as(u8, @truncate(address_u256 >> @intCast(i * 8)));
                    }
                    const address = Address{ .bytes = addr_bytes };

                    // If host is available, use it for the call
                    if (self.host) |host| {
                        // Read input data from memory
                        var input_data: []const u8 = &.{};
                        if (in_length > 0 and in_length <= std.math.maxInt(u32)) {
                            const in_off = @as(u32, @intCast(in_offset));
                            const in_len = @as(u32, @intCast(in_length));
                            // Ensure memory expansion
                            const new_mem_size = in_off + in_len;
                            if (new_mem_size > self.memory_size) {
                                const expansion = new_mem_size - self.memory_size;
                                const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                                try self.consumeGas(gas_cost);
                            }
                            // Read bytes from memory
                            var data = try self.allocator.alloc(u8, in_len);
                            defer self.allocator.free(data);
                            var j: u32 = 0;
                            while (j < in_len) : (j += 1) {
                                data[j] = self.readMemory(in_off + j);
                            }
                            input_data = data;
                        }

                        // Make the delegatecall through host (no value parameter)
                        const result = host.innerCall(@intCast(gas), address, 0, input_data, .DelegateCall);

                        // Write output to memory if requested
                        if (result.success and out_length > 0 and result.output.len > 0) {
                            const out_off = @as(u32, @intCast(out_offset));
                            const copy_len = @min(@as(u32, @intCast(out_length)), @as(u32, @intCast(result.output.len)));
                            // Ensure memory expansion for output
                            const new_mem_size = out_off + copy_len;
                            if (new_mem_size > self.memory_size) {
                                const expansion = new_mem_size - self.memory_size;
                                const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                                try self.consumeGas(gas_cost);
                            }
                            // Write output to memory
                            var k: u32 = 0;
                            while (k < copy_len) : (k += 1) {
                                try self.writeMemory(out_off + k, result.output[k]);
                            }
                        }

                        // Store return data
                        if (self.return_data.len > 0) {
                            self.allocator.free(self.return_data);
                        }
                        self.return_data = try self.allocator.dupe(u8, result.output);

                        // Push success status
                        try self.pushStack(if (result.success) 1 else 0);

                        // Consume gas
                        const gas_used = @as(u64, @intCast(gas)) - result.gas_left;
                        try self.consumeGas(gas_used);
                    } else {
                        // Fallback to mock behavior
                        try self.pushStack(1);
                        try self.consumeGas(700);
                    }
                    self.pc += 1;
                },
                0xf5 => { // CREATE2
                    const value = try self.popStack();
                    const offset = try self.popStack();
                    const length = try self.popStack();
                    const salt = try self.popStack();

                    _ = value;
                    _ = offset;
                    _ = length;
                    _ = salt;

                    // Simplified: push 0 address for failed creation
                    try self.pushStack(0);
                    try self.consumeGas(32000);
                    self.pc += 1;
                },
                0xfa => { // STATICCALL
                    const gas = try self.popStack();
                    const address_u256 = try self.popStack();
                    const in_offset = try self.popStack();
                    const in_length = try self.popStack();
                    const out_offset = try self.popStack();
                    const out_length = try self.popStack();

                    // Convert address from u256 to Address
                    var addr_bytes: [20]u8 = undefined;
                    var i: usize = 0;
                    while (i < 20) : (i += 1) {
                        addr_bytes[19 - i] = @as(u8, @truncate(address_u256 >> @intCast(i * 8)));
                    }
                    const address = Address{ .bytes = addr_bytes };

                    // If host is available, use it for the call
                    if (self.host) |host| {
                        // Read input data from memory
                        var input_data: []const u8 = &.{};
                        if (in_length > 0 and in_length <= std.math.maxInt(u32)) {
                            const in_off = @as(u32, @intCast(in_offset));
                            const in_len = @as(u32, @intCast(in_length));
                            // Ensure memory expansion
                            const new_mem_size = in_off + in_len;
                            if (new_mem_size > self.memory_size) {
                                const expansion = new_mem_size - self.memory_size;
                                const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                                try self.consumeGas(gas_cost);
                            }
                            // Read bytes from memory
                            var data = try self.allocator.alloc(u8, in_len);
                            defer self.allocator.free(data);
                            var j: u32 = 0;
                            while (j < in_len) : (j += 1) {
                                data[j] = self.readMemory(in_off + j);
                            }
                            input_data = data;
                        }

                        // Make the static call through host (no value, read-only)
                        const result = host.innerCall(@intCast(gas), address, 0, input_data, .StaticCall);

                        // Write output to memory if requested
                        if (result.success and out_length > 0 and result.output.len > 0) {
                            const out_off = @as(u32, @intCast(out_offset));
                            const copy_len = @min(@as(u32, @intCast(out_length)), @as(u32, @intCast(result.output.len)));
                            // Ensure memory expansion for output
                            const new_mem_size = out_off + copy_len;
                            if (new_mem_size > self.memory_size) {
                                const expansion = new_mem_size - self.memory_size;
                                const gas_cost = std.math.mul(u64, expansion, 3) catch return error.OutOfGas;
                                try self.consumeGas(gas_cost);
                            }
                            // Write output to memory
                            var k: u32 = 0;
                            while (k < copy_len) : (k += 1) {
                                try self.writeMemory(out_off + k, result.output[k]);
                            }
                        }

                        // Store return data
                        if (self.return_data.len > 0) {
                            self.allocator.free(self.return_data);
                        }
                        self.return_data = try self.allocator.dupe(u8, result.output);

                        // Push success status
                        try self.pushStack(if (result.success) 1 else 0);

                        // Consume gas
                        const gas_used = @as(u64, @intCast(gas)) - result.gas_left;
                        try self.consumeGas(gas_used);
                    } else {
                        // Fallback to mock behavior
                        try self.pushStack(1);
                        try self.consumeGas(700);
                    }
                    self.pc += 1;
                },
                0xfd => { // REVERT
                    self.reverted = true;
                    return;
                },
                0xfe => { // INVALID
                    return error.InvalidOpcode;
                },
                0xff => { // SELFDESTRUCT
                    const beneficiary = try self.popStack();
                    _ = beneficiary;

                    // Mark as stopped
                    self.stopped = true;
                    try self.consumeGas(5000);
                    return;
                },

                // Unknown opcode
                else => {
                    return error.InvalidOpcode;
                },
        }
    }

    /// Execute a single step (one opcode)
    pub fn step(self: *Self) !void {
        if (self.stopped or self.reverted or self.pc >= self.bytecode.len) {
            return;
        }
        const opcode = self.getCurrentOpcode() orelse return;
        try self.executeOpcode(opcode);
    }

    /// Main execution loop
    pub fn execute(self: *Self) !void {
        while (!self.stopped and !self.reverted and self.pc < self.bytecode.len) {
            try self.step();
        }
    }

    /// Get execution state for debugging
    pub fn getState(self: *const Self) ExecutionState {
        return .{
            .pc = self.pc,
            .gas_remaining = self.gas_remaining,
            .gas_used = self.gas_used,
            .stack_size = self.stack.items.len,
            .memory_size = self.memory_size,
            .stopped = self.stopped,
            .reverted = self.reverted,
        };
    }

    pub const ExecutionState = struct {
        pc: u32,
        gas_remaining: i64,
        gas_used: u64,
        stack_size: usize,
        memory_size: u32,
        stopped: bool,
        reverted: bool,
    };
};

// Tests
test "MinimalEvm: basic initialization" {
    const allocator = std.testing.allocator;
    const bytecode = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 }; // PUSH1 1 PUSH1 2 ADD STOP

    var evm = try MinimalEvm.init(allocator, &bytecode, 100000);
    defer evm.deinit();

    try std.testing.expectEqual(@as(u32, 0), evm.pc);
    try std.testing.expectEqual(@as(i64, 100000), evm.gas_remaining);
    try std.testing.expectEqual(@as(usize, 0), evm.stack.items.len);
    try std.testing.expect(evm.host == null);
}

test "MinimalEvm: with host interface" {
    const allocator = std.testing.allocator;
    const bytecode = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01, 0x00 }; // PUSH1 1 PUSH1 2 ADD STOP

    var mock_host = MockHost.init(allocator);
    const host_interface = mock_host.hostInterface();

    var evm = try MinimalEvm.initWithHost(allocator, &bytecode, 100000, host_interface);
    defer evm.deinit();

    try std.testing.expectEqual(@as(u32, 0), evm.pc);
    try std.testing.expectEqual(@as(i64, 100000), evm.gas_remaining);
    try std.testing.expectEqual(@as(usize, 0), evm.stack.items.len);
    try std.testing.expect(evm.host != null);
}

test "MinimalEvm: stack operations" {
    const allocator = std.testing.allocator;
    const bytecode = [_]u8{0x00};

    var evm = try MinimalEvm.init(allocator, &bytecode, 100000);
    defer evm.deinit();

    // Test push
    try evm.pushStack(42);
    try std.testing.expectEqual(@as(usize, 1), evm.stack.items.len);
    try std.testing.expectEqual(@as(u256, 42), try evm.peekStack(0));

    // Test pop
    const value = try evm.popStack();
    try std.testing.expectEqual(@as(u256, 42), value);
    try std.testing.expectEqual(@as(usize, 0), evm.stack.items.len);

    // Test underflow
    try std.testing.expectError(error.StackUnderflow, evm.popStack());
}

test "MinimalEvm: memory operations" {
    const allocator = std.testing.allocator;
    const bytecode = [_]u8{0x00};

    var evm = try MinimalEvm.init(allocator, &bytecode, 100000);
    defer evm.deinit();

    // Test write and read
    try evm.writeMemory(100, 0xAB);
    try std.testing.expectEqual(@as(u8, 0xAB), evm.readMemory(100));
    try std.testing.expectEqual(@as(u32, 101), evm.memory_size);

    // Test uninitialized memory returns 0
    try std.testing.expectEqual(@as(u8, 0), evm.readMemory(200));
}

test "MinimalEvm: gas consumption" {
    const allocator = std.testing.allocator;
    const bytecode = [_]u8{0x00};

    var evm = try MinimalEvm.init(allocator, &bytecode, 100);
    defer evm.deinit();

    try evm.consumeGas(50);
    try std.testing.expectEqual(@as(i64, 50), evm.gas_remaining);
    try std.testing.expectEqual(@as(u64, 50), evm.gas_used);

    try evm.consumeGas(40);
    try std.testing.expectEqual(@as(i64, 10), evm.gas_remaining);
    try std.testing.expectEqual(@as(u64, 90), evm.gas_used);

    // Test out of gas
    try std.testing.expectError(error.OutOfGas, evm.consumeGas(20));
}
