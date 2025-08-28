const std = @import("std");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("log.zig");
const primitives = @import("primitives");
const Address = primitives.Address;
const U256 = primitives.U256;

/// System opcode handlers for the EVM stack frame.
/// These handle calls, contract creation, and execution control.
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Success = FrameType.Success;
        pub const Dispatch = FrameType.Dispatch;
        pub const WordType = FrameType.WordType;

        /// Helper to convert WordType to Address
        fn from_u256(value: WordType) Address {
            // If WordType is smaller than u256, just zero-extend
            const value_u256: U256 = if (@bitSizeOf(WordType) < 256) @as(U256, value) else value;
            // Take the lower 160 bits (20 bytes)
            const addr_value = @as(u160, @truncate(value_u256));
            var addr_bytes: [20]u8 = undefined;
            std.mem.writeInt(u160, &addr_bytes, addr_value, .big);
            return Address.fromBytes(addr_bytes) catch unreachable;
        }

        /// Helper to convert Address to WordType
        fn to_u256(addr: Address) WordType {
            const bytes = addr.toBytes();
            var value: U256 = 0;
            for (bytes) |byte| {
                value = (value << 8) | @as(U256, byte);
            }
            return @as(WordType, @truncate(value));
        }

        /// CALL opcode (0xf1) - Message-call into an account.
        /// Stack: [gas, address, value, input_offset, input_size, output_offset, output_size] → [success]
        pub fn call(self: FrameType, dispatch: Dispatch) Error!Success {
            // Check static context - CALL with non-zero value is not allowed in static context
            const output_size = try self.stack.pop();
            const output_offset = try self.stack.pop();
            const input_size = try self.stack.pop();
            const input_offset = try self.stack.pop();
            const value = try self.stack.pop();
            const address_u256 = try self.stack.pop();
            const gas_param = try self.stack.pop();

            if (self.host.get_is_static() and value > 0) {
                return Error.WriteProtection;
            }

            // Convert address from u256
            const addr = from_u256(address_u256);

            // Bounds checking for gas parameter
            if (gas_param > std.math.maxInt(u64)) {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }
            const gas_u64 = @as(u64, @intCast(gas_param));

            // Bounds checking for memory offsets and sizes
            if (input_offset > std.math.maxInt(usize) or
                input_size > std.math.maxInt(usize) or
                output_offset > std.math.maxInt(usize) or
                output_size > std.math.maxInt(usize))
            {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }

            const input_offset_usize = @as(usize, @intCast(input_offset));
            const input_size_usize = @as(usize, @intCast(input_size));
            const output_offset_usize = @as(usize, @intCast(output_offset));
            const output_size_usize = @as(usize, @intCast(output_size));

            // Ensure memory capacity for input
            if (input_size_usize > 0) {
                const input_end = input_offset_usize + input_size_usize;
                self.memory.ensure_capacity(input_end) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Ensure memory capacity for output
            if (output_size_usize > 0) {
                const output_end = output_offset_usize + output_size_usize;
                self.memory.ensure_capacity(output_end) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Extract input data
            var input_data: []const u8 = &.{};
            if (input_size_usize > 0) {
                input_data = self.memory.get_slice(input_offset_usize, input_size_usize) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Perform the call through the host interface
            const result = self.host.call(
                self.contract_address,
                addr,
                value,
                input_data,
                gas_u64,
                false, // is_static = false for regular CALL
            ) catch |err| switch (err) {
                else => {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                },
            };

            // Write return data to memory if successful and output size > 0
            if (result.success and output_size_usize > 0 and result.output_data.len > 0) {
                const copy_size = @min(output_size_usize, result.output_data.len);
                self.memory.set_data(output_offset_usize, result.output_data[0..copy_size]) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Store return data for future RETURNDATASIZE/RETURNDATACOPY
            self.return_data.clearRetainingCapacity();
            self.return_data.appendSlice(self.allocator, result.output_data) catch {
                return Error.AllocationError;
            };

            // Update gas remaining
            self.gas_remaining = @intCast(result.gas_remaining);

            // Push success status (1 for success, 0 for failure)
            try self.stack.push(if (result.success) 1 else 0);

            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// DELEGATECALL opcode (0xf4) - Message-call with alternative account's code but current values.
        /// Stack: [gas, address, input_offset, input_size, output_offset, output_size] → [success]
        pub fn delegatecall(self: FrameType, dispatch: Dispatch) Error!Success {
            const output_size = try self.stack.pop();
            const output_offset = try self.stack.pop();
            const input_size = try self.stack.pop();
            const input_offset = try self.stack.pop();
            const address_u256 = try self.stack.pop();
            const gas_param = try self.stack.pop();

            // Convert address from u256
            const addr = from_u256(address_u256);

            // Bounds checking for gas parameter
            if (gas_param > std.math.maxInt(u64)) {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }
            const gas_u64 = @as(u64, @intCast(gas_param));

            // Bounds checking for memory offsets and sizes
            if (input_offset > std.math.maxInt(usize) or
                input_size > std.math.maxInt(usize) or
                output_offset > std.math.maxInt(usize) or
                output_size > std.math.maxInt(usize))
            {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }

            const input_offset_usize = @as(usize, @intCast(input_offset));
            const input_size_usize = @as(usize, @intCast(input_size));
            const output_offset_usize = @as(usize, @intCast(output_offset));
            const output_size_usize = @as(usize, @intCast(output_size));

            // Ensure memory capacity for input
            if (input_size_usize > 0) {
                const input_end = input_offset_usize + input_size_usize;
                self.memory.ensure_capacity(input_end) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Ensure memory capacity for output
            if (output_size_usize > 0) {
                const output_end = output_offset_usize + output_size_usize;
                self.memory.ensure_capacity(output_end) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Extract input data
            var input_data: []const u8 = &.{};
            if (input_size_usize > 0) {
                input_data = self.memory.get_slice(input_offset_usize, input_size_usize) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Perform the delegatecall through the host interface
            // DELEGATECALL preserves caller and value from current context
            const result = self.host.delegatecall(
                self.contract_address,
                addr,
                input_data,
                gas_u64,
            ) catch |err| switch (err) {
                else => {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                },
            };

            // Write return data to memory if successful and output size > 0
            if (result.success and output_size_usize > 0 and result.output_data.len > 0) {
                const copy_size = @min(output_size_usize, result.output_data.len);
                self.memory.set_data(output_offset_usize, result.output_data[0..copy_size]) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Store return data for future RETURNDATASIZE/RETURNDATACOPY
            self.return_data.clearRetainingCapacity();
            self.return_data.appendSlice(self.allocator, result.output_data) catch {
                return Error.AllocationError;
            };

            // Update gas remaining
            self.gas_remaining = @intCast(result.gas_remaining);

            // Push success status (1 for success, 0 for failure)
            try self.stack.push(if (result.success) 1 else 0);

            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// STATICCALL opcode (0xfa) - Static message-call (no state changes allowed).
        /// Stack: [gas, address, input_offset, input_size, output_offset, output_size] → [success]
        pub fn staticcall(self: FrameType, dispatch: Dispatch) Error!Success {
            const output_size = try self.stack.pop();
            const output_offset = try self.stack.pop();
            const input_size = try self.stack.pop();
            const input_offset = try self.stack.pop();
            const address_u256 = try self.stack.pop();
            const gas_param = try self.stack.pop();

            // Convert address from u256
            const addr = from_u256(address_u256);

            // Bounds checking for gas parameter
            if (gas_param > std.math.maxInt(u64)) {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }
            const gas_u64 = @as(u64, @intCast(gas_param));

            // Bounds checking for memory offsets and sizes
            if (input_offset > std.math.maxInt(usize) or
                input_size > std.math.maxInt(usize) or
                output_offset > std.math.maxInt(usize) or
                output_size > std.math.maxInt(usize))
            {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }

            const input_offset_usize = @as(usize, @intCast(input_offset));
            const input_size_usize = @as(usize, @intCast(input_size));
            const output_offset_usize = @as(usize, @intCast(output_offset));
            const output_size_usize = @as(usize, @intCast(output_size));

            // Ensure memory capacity for input
            if (input_size_usize > 0) {
                const input_end = input_offset_usize + input_size_usize;
                self.memory.ensure_capacity(input_end) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Ensure memory capacity for output
            if (output_size_usize > 0) {
                const output_end = output_offset_usize + output_size_usize;
                self.memory.ensure_capacity(output_end) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Extract input data
            var input_data: []const u8 = &.{};
            if (input_size_usize > 0) {
                input_data = self.memory.get_slice(input_offset_usize, input_size_usize) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Perform the static call through the host interface
            const result = self.host.call(
                self.contract_address,
                addr,
                0, // value is always 0 for STATICCALL
                input_data,
                gas_u64,
                true, // is_static = true
            ) catch |err| switch (err) {
                else => {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                },
            };

            // Write return data to memory if successful and output size > 0
            if (result.success and output_size_usize > 0 and result.output_data.len > 0) {
                const copy_size = @min(output_size_usize, result.output_data.len);
                self.memory.set_data(output_offset_usize, result.output_data[0..copy_size]) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Store return data for future RETURNDATASIZE/RETURNDATACOPY
            self.return_data.clearRetainingCapacity();
            self.return_data.appendSlice(self.allocator, result.output_data) catch {
                return Error.AllocationError;
            };

            // Update gas remaining
            self.gas_remaining = @intCast(result.gas_remaining);

            // Push success status (1 for success, 0 for failure)
            try self.stack.push(if (result.success) 1 else 0);

            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// CREATE opcode (0xf0) - Create a new account with associated code.
        /// Stack: [value, offset, size] → [address]
        pub fn create(self: FrameType, dispatch: Dispatch) Error!Success {
            // Check static context - CREATE is not allowed in static context
            if (self.host.get_is_static()) {
                return Error.WriteProtection;
            }

            const size = try self.stack.pop();
            const offset = try self.stack.pop();
            const value = try self.stack.pop();

            // Bounds checking for memory offset and size
            if (offset > std.math.maxInt(usize) or size > std.math.maxInt(usize)) {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }

            const offset_usize = @as(usize, @intCast(offset));
            const size_usize = @as(usize, @intCast(size));

            // Ensure memory capacity
            const memory_end = offset_usize + size_usize;
            self.memory.ensure_capacity(memory_end) catch {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            };

            // Extract initialization code
            var init_code: []const u8 = &.{};
            if (size_usize > 0) {
                init_code = self.memory.get_slice(offset_usize, size_usize) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Perform the create through the host interface
            const result = self.host.create(
                self.contract_address,
                value,
                init_code,
                self.gas_remaining,
                null, // salt = null for CREATE
            ) catch |err| switch (err) {
                else => {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                },
            };

            // Update gas remaining
            self.gas_remaining = @intCast(result.gas_remaining);

            // Push created contract address or 0 on failure
            if (result.success) {
                try self.stack.push(to_u256(result.created_address.?));
            } else {
                try self.stack.push(0);
            }

            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// CREATE2 opcode (0xf5) - Create a new account with deterministic address.
        /// Stack: [value, offset, size, salt] → [address]
        pub fn create2(self: FrameType, dispatch: Dispatch) Error!Success {
            // Check static context - CREATE2 is not allowed in static context
            if (self.host.get_is_static()) {
                return Error.WriteProtection;
            }

            const salt = try self.stack.pop();
            const size = try self.stack.pop();
            const offset = try self.stack.pop();
            const value = try self.stack.pop();

            // Bounds checking for memory offset and size
            if (offset > std.math.maxInt(usize) or size > std.math.maxInt(usize)) {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }

            const offset_usize = @as(usize, @intCast(offset));
            const size_usize = @as(usize, @intCast(size));

            // Ensure memory capacity
            const memory_end = offset_usize + size_usize;
            self.memory.ensure_capacity(memory_end) catch {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            };

            // Extract initialization code
            var init_code: []const u8 = &.{};
            if (size_usize > 0) {
                init_code = self.memory.get_slice(offset_usize, size_usize) catch {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                };
            }

            // Convert salt to U256 if needed
            const salt_u256: U256 = if (@bitSizeOf(WordType) < 256) @as(U256, salt) else salt;

            // Perform the create2 through the host interface
            const result = self.host.create(
                self.contract_address,
                value,
                init_code,
                self.gas_remaining,
                salt_u256,
            ) catch |err| switch (err) {
                else => {
                    try self.stack.push(0);
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                },
            };

            // Update gas remaining
            self.gas_remaining = @intCast(result.gas_remaining);

            // Push created contract address or 0 on failure
            if (result.success) {
                try self.stack.push(to_u256(result.created_address.?));
            } else {
                try self.stack.push(0);
            }

            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// RETURN opcode (0xf3) - Halt execution returning output data.
        /// Stack: [offset, size] → []
        pub fn @"return"(self: FrameType, dispatch: Dispatch) Error!Success {
            _ = dispatch;
            const size = try self.stack.pop();
            const offset = try self.stack.pop();

            // Bounds checking for memory offset and size
            if (offset > std.math.maxInt(usize) or size > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }

            const offset_usize = @as(usize, @intCast(offset));
            const size_usize = @as(usize, @intCast(size));

            // Ensure memory capacity
            const memory_end = offset_usize + size_usize;
            self.memory.ensure_capacity(memory_end) catch return Error.OutOfBounds;

            // Extract return data from memory and store it
            if (size_usize > 0) {
                const return_data = self.memory.get_slice(offset_usize, size_usize) catch {
                    return Error.OutOfBounds;
                };
                // Clear any existing output data
                self.output_data.clearRetainingCapacity();
                // Store the return data
                self.output_data.appendSlice(self.allocator, return_data) catch {
                    return Error.AllocationError;
                };
            } else {
                // Empty return data
                self.output_data.clearRetainingCapacity();
            }

            // Return indicates successful execution
            return Success.Return;
        }

        /// REVERT opcode (0xfd) - Halt execution reverting state changes.
        /// Stack: [offset, size] → []
        pub fn revert(self: FrameType, dispatch: Dispatch) Error!Success {
            _ = dispatch;
            const size = try self.stack.pop();
            const offset = try self.stack.pop();

            // Bounds checking for memory offset and size
            if (offset > std.math.maxInt(usize) or size > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }

            const offset_usize = @as(usize, @intCast(offset));
            const size_usize = @as(usize, @intCast(size));

            // Ensure memory capacity
            const memory_end = offset_usize + size_usize;
            self.memory.ensure_capacity(memory_end) catch return Error.OutOfBounds;

            // Extract revert data from memory and store it
            if (size_usize > 0) {
                const revert_data = self.memory.get_slice(offset_usize, size_usize) catch {
                    return Error.OutOfBounds;
                };
                // Clear any existing output data
                self.output_data.clearRetainingCapacity();
                // Store the revert data
                self.output_data.appendSlice(self.allocator, revert_data) catch {
                    return Error.AllocationError;
                };
            } else {
                // Empty revert data
                self.output_data.clearRetainingCapacity();
            }

            // Always return the Revert success type for proper handling
            return Success.Revert;
        }

        /// SELFDESTRUCT opcode (0xff) - Halt execution and mark account for later deletion.
        /// Stack: [recipient] → []
        pub fn selfdestruct(self: FrameType, dispatch: Dispatch) Error!Success {
            _ = dispatch;
            const recipient_u256 = try self.stack.pop();
            const recipient = from_u256(recipient_u256);

            // Check static context and mark for destruction if host available
            if (self.host.get_is_static()) {
                @branchHint(.unlikely);
                return Error.WriteProtection;
            }

            // Mark contract for destruction via host interface
            self.host.mark_for_destruction(self.contract_address, recipient) catch |err| switch (err) {
                else => {
                    @branchHint(.unlikely);
                    return Error.OutOfGas;
                },
            };

            // According to EIP-6780 (Cancun hardfork), SELFDESTRUCT only actually destroys
            // the contract if it was created in the same transaction. This is handled by the host.
            // SELFDESTRUCT always stops execution
            return Success.SelfDestruct;
        }

        /// STOP opcode (0x00) - Halt execution.
        /// Stack: [] → []
        pub fn stop(self: FrameType, dispatch: Dispatch) Error!Success {
            _ = self;
            _ = dispatch;
            // TODO: Apply EIP-3529 refund cap: at most 1/5th of gas used
            // Move this to EIP-3529 and figure out best way to handle it
            return Success.Stop;
        }
    };
}

// ====== TESTS ======

const testing = std.testing;
const StackFrame = @import("stack_frame.zig").StackFrame;
const dispatch_mod = @import("stack_frame_dispatch.zig");
const NoOpTracer = @import("tracer.zig").NoOpTracer;
const bytecode_mod = @import("bytecode.zig");
const host_mod = @import("host.zig");
const call_params_mod = @import("call_params.zig");

// Test configuration
const test_config = FrameConfig{
    .stack_size = 1024,
    .WordType = u256,
    .max_bytecode_size = 1024,
    .block_gas_limit = 30_000_000,
    .has_database = false,
    .TracerType = NoOpTracer,
    .memory_initial_capacity = 4096,
    .memory_limit = 0xFFFFFF,
};

const TestFrame = StackFrame(test_config);
const TestBytecode = bytecode_mod.Bytecode(.{ .max_bytecode_size = test_config.max_bytecode_size });

// Mock host for testing
const MockHost = struct {
    allocator: std.mem.Allocator,
    is_static: bool = false,
    call_result: call_params_mod.CallResult,
    create_result: call_params_mod.CreateResult,

    pub fn init(allocator: std.mem.Allocator) MockHost {
        return .{
            .allocator = allocator,
            .call_result = .{
                .success = true,
                .gas_remaining = 100_000,
                .output_data = &.{},
            },
            .create_result = .{
                .success = true,
                .gas_remaining = 100_000,
                .created_address = Address.zero(),
            },
        };
    }

    pub fn get_is_static(self: *const MockHost) bool {
        return self.is_static;
    }

    pub fn call(
        self: *MockHost,
        _: Address,
        _: Address,
        _: u256,
        _: []const u8,
        _: u64,
        _: bool,
    ) !call_params_mod.CallResult {
        return self.call_result;
    }

    pub fn delegatecall(
        self: *MockHost,
        _: Address,
        _: Address,
        _: []const u8,
        _: u64,
    ) !call_params_mod.CallResult {
        return self.call_result;
    }

    pub fn create(
        self: *MockHost,
        _: Address,
        _: u256,
        _: []const u8,
        _: i64,
        _: ?u256,
    ) !call_params_mod.CreateResult {
        return self.create_result;
    }

    pub fn mark_for_destruction(self: *MockHost, _: Address, _: Address) !void {
        _ = self;
    }

    pub fn to_host(self: *MockHost) host_mod.Host {
        return .{
            .ptr = self,
            .vtable = &.{
                .get_is_static = @ptrCast(&get_is_static),
                .call = @ptrCast(&call),
                .delegatecall = @ptrCast(&delegatecall),
                .create = @ptrCast(&create),
                .mark_for_destruction = @ptrCast(&mark_for_destruction),
                // Add other required vtable entries...
            },
        };
    }
};

fn createTestFrame(allocator: std.mem.Allocator, host: ?host_mod.Host) !TestFrame {
    const bytecode = TestBytecode.initEmpty();
    return try TestFrame.init(allocator, bytecode, 1_000_000, null, host);
}

// Mock dispatch that simulates successful execution flow
fn createMockDispatch() TestFrame.Dispatch {
    const mock_handler = struct {
        fn handler(frame: TestFrame, dispatch: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = frame;
            _ = dispatch;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    var schedule: [1]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    schedule[0] = .{ .opcode_handler = &mock_handler };
    
    return TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
}

test "STOP opcode" {
    var frame = try createTestFrame(testing.allocator, null);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    const result = try TestFrame.SystemHandlers.stop(frame, dispatch);
    try testing.expectEqual(TestFrame.Success.Stop, result);
}

test "RETURN opcode - empty return" {
    var frame = try createTestFrame(testing.allocator, null);
    defer frame.deinit(testing.allocator);

    // Test: return with offset=0, size=0
    try frame.stack.push(0); // offset
    try frame.stack.push(0); // size

    const dispatch = createMockDispatch();
    const result = try TestFrame.SystemHandlers.@"return"(frame, dispatch);
    
    try testing.expectEqual(TestFrame.Success.Return, result);
    try testing.expectEqual(@as(usize, 0), frame.output_data.items.len);
}

test "RETURN opcode - with data" {
    var frame = try createTestFrame(testing.allocator, null);
    defer frame.deinit(testing.allocator);

    // Write some data to memory
    const test_data = [_]u8{ 0xDE, 0xAD, 0xBE, 0xEF };
    try frame.memory.set_data(0, &test_data);

    // Test: return 4 bytes from offset 0
    try frame.stack.push(0); // offset
    try frame.stack.push(4); // size

    const dispatch = createMockDispatch();
    const result = try TestFrame.SystemHandlers.@"return"(frame, dispatch);
    
    try testing.expectEqual(TestFrame.Success.Return, result);
    try testing.expectEqualSlices(u8, &test_data, frame.output_data.items);
}

test "REVERT opcode - empty revert" {
    var frame = try createTestFrame(testing.allocator, null);
    defer frame.deinit(testing.allocator);

    // Test: revert with offset=0, size=0
    try frame.stack.push(0); // offset
    try frame.stack.push(0); // size

    const dispatch = createMockDispatch();
    const result = try TestFrame.SystemHandlers.revert(frame, dispatch);
    
    try testing.expectEqual(TestFrame.Success.Revert, result);
    try testing.expectEqual(@as(usize, 0), frame.output_data.items.len);
}

test "REVERT opcode - with error data" {
    var frame = try createTestFrame(testing.allocator, null);
    defer frame.deinit(testing.allocator);

    // Write error message to memory
    const error_msg = "Error: Insufficient balance";
    try frame.memory.set_data(0, error_msg);

    // Test: revert with error message
    try frame.stack.push(0); // offset
    try frame.stack.push(error_msg.len); // size

    const dispatch = createMockDispatch();
    const result = try TestFrame.SystemHandlers.revert(frame, dispatch);
    
    try testing.expectEqual(TestFrame.Success.Revert, result);
    try testing.expectEqualSlices(u8, error_msg, frame.output_data.items);
}

test "SELFDESTRUCT opcode - normal execution" {
    var mock_host = MockHost.init(testing.allocator);
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Test: selfdestruct sending balance to address 0x1234...
    const recipient = @as(u256, 0x1234);
    try frame.stack.push(recipient);

    const dispatch = createMockDispatch();
    const result = try TestFrame.SystemHandlers.selfdestruct(frame, dispatch);
    
    try testing.expectEqual(TestFrame.Success.SelfDestruct, result);
}

test "SELFDESTRUCT opcode - static context error" {
    var mock_host = MockHost.init(testing.allocator);
    mock_host.is_static = true;
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Test: selfdestruct in static context should fail
    const recipient = @as(u256, 0x1234);
    try frame.stack.push(recipient);

    const dispatch = createMockDispatch();
    const result = TestFrame.SystemHandlers.selfdestruct(frame, dispatch);
    
    try testing.expectError(TestFrame.Error.WriteProtection, result);
}

// Note: Full tests for CALL, DELEGATECALL, STATICCALL, CREATE, and CREATE2
// would require more complete host mocking. The structure is provided
// for basic validation.

test "CALL opcode - basic structure" {
    var mock_host = MockHost.init(testing.allocator);
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Stack: [gas, address, value, input_offset, input_size, output_offset, output_size]
    try frame.stack.push(100000); // gas
    try frame.stack.push(0x1234); // address
    try frame.stack.push(0); // value
    try frame.stack.push(0); // input_offset
    try frame.stack.push(0); // input_size
    try frame.stack.push(0); // output_offset
    try frame.stack.push(0); // output_size

    const dispatch = createMockDispatch();
    const result = try TestFrame.SystemHandlers.call(frame, dispatch);
    
    try testing.expect(result == TestFrame.Success.stop);
    try testing.expectEqual(@as(u256, 1), try frame.stack.pop()); // success = 1
}

test "CREATE opcode - static context error" {
    var mock_host = MockHost.init(testing.allocator);
    mock_host.is_static = true;
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Stack: [value, offset, size]
    try frame.stack.push(0); // value
    try frame.stack.push(0); // offset
    try frame.stack.push(0); // size

    const dispatch = createMockDispatch();
    const result = TestFrame.SystemHandlers.create(frame, dispatch);
    
    try testing.expectError(TestFrame.Error.WriteProtection, result);
}