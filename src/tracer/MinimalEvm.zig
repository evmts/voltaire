/// Minimal EVM implementation for tracing and validation
/// This is a simplified, unoptimized EVM that executes opcodes in a straightforward
/// while loop with a single switch statement. It's designed for correctness validation
/// and debugging, not performance.
const std = @import("std");
const primitives = @import("primitives");

const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.ZERO_ADDRESS;

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

    // Execution state
    pc: u32,
    gas_remaining: i64,
    gas_used: u64,
    bytecode: []const u8,

    // Call context
    caller: Address,
    address: Address,
    value: u256,
    calldata: []const u8,

    // Return data
    return_data: std.ArrayList(u8),

    // Execution status
    stopped: bool,
    reverted: bool,

    // Allocator
    allocator: std.mem.Allocator,

    /// Initialize a new MinimalEvm instance
    pub fn init(allocator: std.mem.Allocator, bytecode: []const u8, gas_limit: i64) !Self {
        var storage_map = std.AutoHashMap(Address, std.AutoHashMap(u256, u256)).init(allocator);
        errdefer storage_map.deinit();

        var stack = try std.ArrayList(u256).initCapacity(allocator, STACK_SIZE);
        errdefer stack.deinit(allocator);

        var memory_map = std.AutoHashMap(u32, u8).init(allocator);
        errdefer memory_map.deinit();

        var return_data = std.ArrayList(u8).initCapacity(allocator, 0) catch unreachable;
        errdefer return_data.deinit(allocator);

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
            .value = 0,
            .calldata = &[_]u8{},
            .return_data = return_data,
            .stopped = false,
            .reverted = false,
            .allocator = allocator,
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

        self.return_data.deinit(self.allocator);
    }

    /// Set call context
    pub fn setCallContext(
        self: *Self,
        caller: Address,
        address: Address,
        value: u256,
        calldata: []const u8,
    ) void {
        self.caller = caller;
        self.address = address;
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

    /// Read from storage
    pub fn readStorage(self: *Self, address: Address, slot: u256) !u256 {
        const account_storage = self.storage.get(address) orelse return 0;
        return account_storage.get(slot) orelse 0;
    }

    /// Write to storage
    pub fn writeStorage(self: *Self, address: Address, slot: u256, value: u256) !void {
        var account_storage = self.storage.getPtr(address) orelse blk: {
            const new_storage = std.AutoHashMap(u256, u256).init(self.allocator);
            try self.storage.put(address, new_storage);
            break :blk self.storage.getPtr(address).?;
        };

        try account_storage.put(slot, value);
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
        // Base gas cost (will be refined per opcode)
        try self.consumeGas(3);

        // Giant switch statement for all opcodes
        switch (opcode) {
                // STOP
                0x00 => {
                    self.stopped = true;
                    return;
                },

                // ADD
                0x01 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result = a +% b; // Wrapping addition
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // MUL
                0x02 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result = a *% b; // Wrapping multiplication
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SUB
                0x03 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result = a -% b; // Wrapping subtraction
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // DIV
                0x04 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result = if (b == 0) 0 else a / b;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SDIV - Signed division
                0x05 => {
                    const b = try self.popStack();
                    const a = try self.popStack();

                    if (b == 0) {
                        try self.pushStack(0);
                    } else {
                        const MIN_SIGNED: u256 = 1 << 255;
                        const NEG_ONE = std.math.maxInt(u256); // -1 in two's complement

                        // Special case: MIN_SIGNED / -1 would overflow
                        if (a == MIN_SIGNED and b == NEG_ONE) {
                            try self.pushStack(MIN_SIGNED);
                        } else {
                            // Convert to signed
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
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result = if (b == 0) 0 else a % b;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SMOD - Signed modulo
                0x07 => {
                    const b = try self.popStack();
                    const a = try self.popStack();

                    if (b == 0) {
                        try self.pushStack(0);
                    } else {
                        const a_signed = @as(i256, @bitCast(a));
                        const b_signed = @as(i256, @bitCast(b));
                        const result_signed = @rem(a_signed, b_signed);
                        const result = @as(u256, @bitCast(result_signed));
                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // ADDMOD
                0x08 => {
                    const N = try self.popStack();
                    const b = try self.popStack();
                    const a = try self.popStack();

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
                    const N = try self.popStack();
                    const b = try self.popStack();
                    const a = try self.popStack();

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
                    const exponent = try self.popStack();
                    const base = try self.popStack();

                    // Calculate gas cost for EXP
                    const byte_size = (256 - @clz(exponent)) / 8 + 1;
                    try self.consumeGas(50 * byte_size);

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
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result: u256 = if (a < b) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // GT - Greater than
                0x11 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result: u256 = if (a > b) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SLT - Signed less than
                0x12 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const a_signed = @as(i256, @bitCast(a));
                    const b_signed = @as(i256, @bitCast(b));
                    const result: u256 = if (a_signed < b_signed) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // SGT - Signed greater than
                0x13 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const a_signed = @as(i256, @bitCast(a));
                    const b_signed = @as(i256, @bitCast(b));
                    const result: u256 = if (a_signed > b_signed) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // EQ - Equal
                0x14 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result: u256 = if (a == b) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // ISZERO
                0x15 => {
                    const a = try self.popStack();
                    const result: u256 = if (a == 0) 1 else 0;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // Bitwise operations (0x16-0x1d)
                // AND
                0x16 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result = a & b;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // OR
                0x17 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result = a | b;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // XOR
                0x18 => {
                    const b = try self.popStack();
                    const a = try self.popStack();
                    const result = a ^ b;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // NOT
                0x19 => {
                    const a = try self.popStack();
                    const result = ~a;
                    try self.pushStack(result);
                    self.pc += 1;
                },

                // BYTE
                0x1a => {
                    const i = try self.popStack();
                    const x = try self.popStack();

                    if (i >= 32) {
                        try self.pushStack(0);
                    } else {
                        // Get the i-th byte from the left (big-endian)
                        const byte_val = (x >> @intCast((31 - i) * 8)) & 0xFF;
                        try self.pushStack(byte_val);
                    }
                    self.pc += 1;
                },

                // SHL - Shift left
                0x1b => {
                    const shift = try self.popStack();
                    const value = try self.popStack();

                    if (shift >= 256) {
                        try self.pushStack(0);
                    } else {
                        const result = value << @intCast(shift);
                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // SHR - Logical shift right
                0x1c => {
                    const shift = try self.popStack();
                    const value = try self.popStack();

                    if (shift >= 256) {
                        try self.pushStack(0);
                    } else {
                        const result = value >> @intCast(shift);
                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // SAR - Arithmetic shift right
                0x1d => {
                    const shift = try self.popStack();
                    const value = try self.popStack();

                    if (shift >= 256) {
                        // If negative, result is all 1s, else 0
                        const sign_bit = value >> 255;
                        const result: u256 = if (sign_bit == 1) std.math.maxInt(u256) else 0;
                        try self.pushStack(result);
                    } else {
                        const value_signed = @as(i256, @bitCast(value));
                        const result_signed = value_signed >> @intCast(shift);
                        const result = @as(u256, @bitCast(result_signed));
                        try self.pushStack(result);
                    }
                    self.pc += 1;
                },

                // SHA3 / KECCAK256
                0x20 => {
                    const length = try self.popStack();
                    const offset = try self.popStack();

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
                    const addr_int = @as(u256, @bitCast(@as([32]u8, self.address.bytes ++ [_]u8{0} ** 12)));
                    try self.pushStack(addr_int);
                    self.pc += 1;
                },

                // BALANCE - For simplicity, return 0 (would need host interface in real implementation)
                0x31 => {
                    _ = try self.popStack(); // Pop address
                    try self.pushStack(0); // Return 0 balance
                    self.pc += 1;
                },

                // ORIGIN - For simplicity, return zero address
                0x32 => {
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // CALLER
                0x33 => {
                    const caller_int = @as(u256, @bitCast(@as([32]u8, self.caller.bytes ++ [_]u8{0} ** 12)));
                    try self.pushStack(caller_int);
                    self.pc += 1;
                },

                // CALLVALUE
                0x34 => {
                    try self.pushStack(self.value);
                    self.pc += 1;
                },

                // CALLDATALOAD
                0x35 => {
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
                    try self.pushStack(self.calldata.len);
                    self.pc += 1;
                },

                // CALLDATACOPY
                0x37 => {
                    const length = try self.popStack();
                    const offset = try self.popStack();
                    const dest_offset = try self.popStack();

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
                    try self.pushStack(self.bytecode.len);
                    self.pc += 1;
                },

                // CODECOPY
                0x39 => {
                    const length = try self.popStack();
                    const offset = try self.popStack();
                    const dest_offset = try self.popStack();

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
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // EXTCODESIZE - Return 0 for simplicity
                0x3b => {
                    _ = try self.popStack(); // Pop address
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // EXTCODECOPY - No-op for simplicity
                0x3c => {
                    _ = try self.popStack(); // address
                    _ = try self.popStack(); // dest_offset
                    _ = try self.popStack(); // offset
                    _ = try self.popStack(); // length
                    self.pc += 1;
                },

                // RETURNDATASIZE
                0x3d => {
                    try self.pushStack(self.return_data.items.len);
                    self.pc += 1;
                },

                // RETURNDATACOPY
                0x3e => {
                    const length = try self.popStack();
                    const offset = try self.popStack();
                    const dest_offset = try self.popStack();

                    if (length > std.math.maxInt(u32)) {
                        return error.OutOfGas;
                    }

                    const len = @as(u32, @intCast(length));
                    const src_off = @as(u32, @intCast(offset));
                    const dst_off = @as(u32, @intCast(dest_offset));

                    // Check bounds
                    if (src_off + len > self.return_data.items.len) {
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
                        const byte = self.return_data.items[src_off + i];
                        try self.writeMemory(dst_off + i, byte);
                    }

                    self.pc += 1;
                },

                // EXTCODEHASH - Return 0 for simplicity
                0x3f => {
                    _ = try self.popStack(); // Pop address
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // Block operations (0x40-0x48)
                // BLOCKHASH - Return 0 for simplicity
                0x40 => {
                    _ = try self.popStack(); // Pop block number
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // COINBASE - Return zero address
                0x41 => {
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // TIMESTAMP - Return 0
                0x42 => {
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // NUMBER - Return 0
                0x43 => {
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // DIFFICULTY/PREVRANDAO - Return 0
                0x44 => {
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // GASLIMIT - Return max gas
                0x45 => {
                    try self.pushStack(30_000_000);
                    self.pc += 1;
                },

                // CHAINID - Return 1 (mainnet)
                0x46 => {
                    try self.pushStack(1);
                    self.pc += 1;
                },

                // SELFBALANCE - Return 0
                0x47 => {
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // BASEFEE - Return 0
                0x48 => {
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // BLOBHASH - Return 0
                0x49 => {
                    _ = try self.popStack(); // Pop index
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // BLOBBASEFEE - Return 0
                0x4a => {
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // Stack, Memory, Storage operations (0x50-0x5b)
                0x50 => { // POP
                    _ = try self.popStack();
                    self.pc += 1;
                },

                // MLOAD
                0x51 => {
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
                    const value = try self.popStack();
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

                    try self.writeMemoryWord(off, value);
                    self.pc += 1;
                },

                // MSTORE8
                0x53 => {
                    const value = try self.popStack();
                    const offset = try self.popStack();

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
                    const value = try self.readStorage(self.address, slot);
                    try self.pushStack(value);
                    try self.consumeGas(100); // Simplified gas cost
                    self.pc += 1;
                },

                // SSTORE
                0x55 => {
                    const value = try self.popStack();
                    const slot = try self.popStack();
                    try self.writeStorage(self.address, slot, value);
                    try self.consumeGas(20000); // Simplified gas cost
                    self.pc += 1;
                },

                // JUMP
                0x56 => {
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
                    try self.pushStack(self.pc);
                    self.pc += 1;
                },

                // MSIZE
                0x59 => {
                    // Round up to nearest multiple of 32
                    const msize = ((self.memory_size + 31) / 32) * 32;
                    try self.pushStack(msize);
                    self.pc += 1;
                },

                // GAS
                0x5a => {
                    const gas = @max(self.gas_remaining, 0);
                    try self.pushStack(@intCast(gas));
                    self.pc += 1;
                },
                0x5b => { // JUMPDEST
                    // No operation, just a jump target
                    self.pc += 1;
                },

                // PUSH0
                0x5f => {
                    try self.pushStack(0);
                    self.pc += 1;
                },

                // PUSH operations (0x60-0x7f)
                0x60...0x7f => {
                    const push_size = opcode - 0x5f;
                    const value = self.readImmediate(push_size) orelse return error.InvalidPush;
                    try self.pushStack(value);
                    self.pc += 1 + push_size;
                },

                // DUP operations (0x80-0x8f)
                0x80...0x8f => {
                    const dup_index = opcode - 0x80;
                    try self.dupStack(dup_index);
                    self.pc += 1;
                },

                // SWAP operations (0x90-0x9f)
                0x90...0x9f => {
                    const swap_index = opcode - 0x90;
                    try self.swapStack(swap_index);
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
                    const address = try self.popStack();
                    const in_offset = try self.popStack();
                    const in_length = try self.popStack();
                    const out_offset = try self.popStack();
                    const out_length = try self.popStack();

                    _ = gas;
                    _ = address;
                    _ = in_offset;
                    _ = in_length;
                    _ = out_offset;
                    _ = out_length;

                    // Simplified: push 1 for success
                    try self.pushStack(1);
                    try self.consumeGas(700);
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
                    const address = try self.popStack();
                    const in_offset = try self.popStack();
                    const in_length = try self.popStack();
                    const out_offset = try self.popStack();
                    const out_length = try self.popStack();

                    _ = gas;
                    _ = address;
                    _ = in_offset;
                    _ = in_length;
                    _ = out_offset;
                    _ = out_length;

                    // Simplified: push 1 for success
                    try self.pushStack(1);
                    try self.consumeGas(700);
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

    /// Main execution loop
    pub fn execute(self: *Self) !void {
        while (!self.stopped and !self.reverted and self.pc < self.bytecode.len) {
            const opcode = self.getCurrentOpcode() orelse break;
            try self.executeOpcode(opcode);
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