/// Minimal Frame implementation for tracing
/// This mirrors the architecture of frame/frame.zig but simplified for validation
const std = @import("std");
const primitives = @import("primitives");
const GasConstants = primitives.GasConstants;
const Address = primitives.Address.Address;
const MinimalEvmError = @import("minimal_evm.zig").MinimalEvmError;

pub const MinimalFrame = struct {
    const Self = @This();

    // Stack
    stack: std.ArrayList(u256),

    // Memory
    memory: std.AutoHashMap(u32, u8),
    memory_size: u32,

    // Execution state
    pc: u32,
    gas_remaining: i64,
    bytecode: []const u8,

    // Call context
    caller: Address,
    address: Address,
    value: u256,
    calldata: []const u8,

    // Output
    output: []u8,
    return_data: []const u8,

    // Execution status
    stopped: bool,
    reverted: bool,

    // Reference to MinimalEvm (like Frame has evm_ptr)
    evm_ptr: *anyopaque,

    // Allocator
    allocator: std.mem.Allocator,

    /// Initialize a new frame
    pub fn init(
        allocator: std.mem.Allocator,
        bytecode: []const u8,
        gas: i64,
        caller: Address,
        address: Address,
        value: u256,
        calldata: []const u8,
        evm_ptr: *anyopaque,
    ) !Self {
        var stack = std.ArrayList(u256).initCapacity(allocator, 1024) catch return error.OutOfMemory;
        errdefer stack.deinit();

        var memory_map = std.AutoHashMap(u32, u8).init(allocator);
        errdefer memory_map.deinit();

        return Self{
            .stack = stack,
            .memory = memory_map,
            .memory_size = 0,
            .pc = 0,
            .gas_remaining = gas,
            .bytecode = bytecode,
            .caller = caller,
            .address = address,
            .value = value,
            .calldata = calldata,
            .output = &[_]u8{},
            .return_data = &[_]u8{},
            .stopped = false,
            .reverted = false,
            .evm_ptr = evm_ptr,
            .allocator = allocator,
        };
    }

    /// Clean up resources
    pub fn deinit(self: *Self) void {
        self.stack.deinit(self.allocator);
        self.memory.deinit();
        if (self.output.len > 0) {
            self.allocator.free(self.output);
        }
    }

    /// Get the MinimalEvm instance
    pub fn getEvm(self: *Self) *@import("minimal_evm.zig").MinimalEvm {
        return @as(*@import("minimal_evm.zig").MinimalEvm, @ptrCast(@alignCast(self.evm_ptr)));
    }

    /// Push value onto stack
    pub fn pushStack(self: *Self, value: u256) MinimalEvmError!void {
        if (self.stack.items.len >= 1024) {
            return error.StackOverflow;
        }
        try self.stack.append(self.allocator, value);
    }

    /// Pop value from stack
    pub fn popStack(self: *Self) MinimalEvmError!u256 {
        if (self.stack.items.len == 0) {
            return error.StackUnderflow;
        }
        const value = self.stack.items[self.stack.items.len - 1];
        self.stack.items.len -= 1;
        return value;
    }

    /// Peek at top of stack
    pub fn peekStack(self: *const Self, index: usize) MinimalEvmError!u256 {
        if (index >= self.stack.items.len) {
            return error.StackUnderflow;
        }
        return self.stack.items[self.stack.items.len - 1 - index];
    }

    /// Read byte from memory
    pub fn readMemory(self: *Self, offset: u32) u8 {
        return self.memory.get(offset) orelse 0;
    }

    /// Write byte to memory
    pub fn writeMemory(self: *Self, offset: u32, value: u8) MinimalEvmError!void {
        try self.memory.put(offset, value);
        if (offset >= self.memory_size) {
            self.memory_size = offset + 1;
        }
    }

    /// Consume gas
    pub fn consumeGas(self: *Self, amount: u64) MinimalEvmError!void {
        if (self.gas_remaining < @as(i64, @intCast(amount))) {
            self.gas_remaining = 0;
            return error.OutOfGas;
        }
        self.gas_remaining -= @intCast(amount);
    }

    /// Get current opcode
    pub fn getCurrentOpcode(self: *const Self) ?u8 {
        if (self.pc >= self.bytecode.len) {
            return null;
        }
        return self.bytecode[self.pc];
    }

    /// Read immediate data for PUSH operations
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

    /// Execute a single opcode - delegates to MinimalEvm for external ops
    pub fn executeOpcode(self: *Self, opcode: u8) MinimalEvmError!void {
        const evm = self.getEvm();

        switch (opcode) {
            // STOP
            0x00 => {
                self.stopped = true;
                return;
            },

            // ADD
            0x01 => {
                try self.consumeGas(GasConstants.GasFastestStep);
                const a = try self.popStack();
                const b = try self.popStack();
                try self.pushStack(a +% b);
                self.pc += 1;
            },

            // MUL
            0x02 => {
                try self.consumeGas(GasConstants.GasFastStep);
                const a = try self.popStack();
                const b = try self.popStack();
                try self.pushStack(a *% b);
                self.pc += 1;
            },

            // SUB
            0x03 => {
                try self.consumeGas(GasConstants.GasFastestStep);
                const a = try self.popStack();
                const b = try self.popStack();
                try self.pushStack(a -% b);
                self.pc += 1;
            },

            // ADDRESS
            0x30 => {
                try self.consumeGas(GasConstants.GasQuickStep);
                const addr_u256 = primitives.Address.to_u256(self.address);
                try self.pushStack(addr_u256);
                self.pc += 1;
            },

            // BALANCE
            0x31 => {
                const addr_int = try self.popStack();
                var addr_bytes: [20]u8 = undefined;
                var i: usize = 0;
                while (i < 20) : (i += 1) {
                    addr_bytes[19 - i] = @as(u8, @truncate(addr_int >> @intCast(i * 8)));
                }
                const addr = Address{ .bytes = addr_bytes };

                try self.consumeGas(GasConstants.WarmStorageReadCost);
                const balance = evm.get_balance(addr);
                try self.pushStack(balance);
                self.pc += 1;
            },

            // MSTORE
            0x52 => {
                try self.consumeGas(GasConstants.GasFastestStep);
                const offset = try self.popStack();
                const value = try self.popStack();

                if (offset > std.math.maxInt(u32)) {
                    return error.OutOfGas;
                }

                const off = @as(u32, @intCast(offset));

                // Write word to memory
                var idx: u32 = 0;
                while (idx < 32) : (idx += 1) {
                    const byte = @as(u8, @truncate(value >> @intCast((31 - idx) * 8)));
                    try self.writeMemory(off + idx, byte);
                }
                self.pc += 1;
            },

            // PUSH0
            0x5f => {
                try self.consumeGas(GasConstants.GasQuickStep);
                try self.pushStack(0);
                self.pc += 1;
            },

            // PUSH1-PUSH32
            0x60...0x7f => {
                try self.consumeGas(GasConstants.GasFastestStep);
                const push_size = opcode - 0x5f;
                const value = self.readImmediate(push_size) orelse return error.InvalidPush;
                try self.pushStack(value);
                self.pc += 1 + push_size;
            },

            // CALL
            0xf1 => {
                // Pop all 7 arguments
                const gas = try self.popStack();
                const address_u256 = try self.popStack();
                const value_arg = try self.popStack();
                const in_offset = try self.popStack();
                const in_length = try self.popStack();
                const out_offset = try self.popStack();
                const out_length = try self.popStack();

                // Convert address
                var addr_bytes: [20]u8 = undefined;
                var i: usize = 0;
                while (i < 20) : (i += 1) {
                    addr_bytes[19 - i] = @as(u8, @truncate(address_u256 >> @intCast(i * 8)));
                }
                const call_address = Address{ .bytes = addr_bytes };

                // Base gas cost
                var gas_cost: u64 = GasConstants.CallGas;
                if (value_arg > 0) {
                    gas_cost += GasConstants.CallValueTransferGas;
                }
                try self.consumeGas(gas_cost);

                // Read input data
                var input_data: []const u8 = &.{};
                if (in_length > 0 and in_length <= std.math.maxInt(u32)) {
                    const in_off = @as(u32, @intCast(in_offset));
                    const in_len = @as(u32, @intCast(in_length));

                    var data = try self.allocator.alloc(u8, in_len);
                    defer self.allocator.free(data);
                    var j: u32 = 0;
                    while (j < in_len) : (j += 1) {
                        data[j] = self.readMemory(in_off + j);
                    }
                    input_data = data;
                }

                // Make the call through EVM
                const available_gas = @min(gas, @as(u64, @intCast(self.gas_remaining)));
                const result = try evm.inner_call(
                    call_address,
                    value_arg,
                    input_data,
                    available_gas,
                );

                // Write output to memory
                if (result.success and out_length > 0 and result.output.len > 0) {
                    const out_off = @as(u32, @intCast(out_offset));
                    const copy_len = @min(@as(u32, @intCast(out_length)), @as(u32, @intCast(result.output.len)));

                    var k: u32 = 0;
                    while (k < copy_len) : (k += 1) {
                        try self.writeMemory(out_off + k, result.output[k]);
                    }
                }

                // Store return data
                self.return_data = result.output;

                // Push success status
                try self.pushStack(if (result.success) 1 else 0);

                // Consume gas used by call
                const gas_used = available_gas - result.gas_left;
                try self.consumeGas(gas_used);

                self.pc += 1;
            },

            // RETURN
            0xf3 => {
                const offset = try self.popStack();
                const length = try self.popStack();

                if (length > 0) {
                    const off = @as(u32, @intCast(offset));
                    const len = @as(u32, @intCast(length));

                    self.output = try self.allocator.alloc(u8, len);
                    var idx: u32 = 0;
                    while (idx < len) : (idx += 1) {
                        self.output[idx] = self.readMemory(off + idx);
                    }
                }

                self.stopped = true;
                return;
            },

            // REVERT
            0xfd => {
                self.reverted = true;
                return;
            },

            else => {
                return error.InvalidOpcode;
            },
        }
    }

    /// Execute a single step
    pub fn step(self: *Self) MinimalEvmError!void {
        if (self.stopped or self.reverted or self.pc >= self.bytecode.len) {
            return;
        }
        const opcode = self.getCurrentOpcode() orelse return;
        try self.executeOpcode(opcode);
    }

    /// Main execution loop
    pub fn execute(self: *Self) MinimalEvmError!void {
        while (!self.stopped and !self.reverted and self.pc < self.bytecode.len) {
            try self.step();
        }
    }
};