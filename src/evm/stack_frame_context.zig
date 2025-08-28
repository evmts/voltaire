const std = @import("std");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("log.zig");
const primitives = @import("primitives");
const Address = primitives.Address;
const U256 = primitives.U256;

/// Context opcode handlers for the EVM stack frame.
/// These handle execution context queries (caller, value, gas, etc).
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Success = FrameType.Success;
        pub const Dispatch = FrameType.Dispatch;
        pub const WordType = FrameType.WordType;

        /// Helper to convert Address to WordType
        fn to_u256(addr: Address) WordType {
            const bytes = addr.toBytes();
            var value: U256 = 0;
            for (bytes) |byte| {
                value = (value << 8) | @as(U256, byte);
            }
            return @as(WordType, @truncate(value));
        }

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

        /// ADDRESS opcode (0x30) - Get address of currently executing account.
        /// Stack: [] → [address]
        pub fn address(self: FrameType, dispatch: Dispatch) Error!Success {
            const addr_u256 = to_u256(self.contract_address);
            try self.stack.push(addr_u256);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// BALANCE opcode (0x31) - Get balance of the given account.
        /// Stack: [address] → [balance]
        pub fn balance(self: FrameType, dispatch: Dispatch) Error!Success {
            const address_u256 = try self.stack.pop();
            const addr = from_u256(address_u256);

            // Access the address for warm/cold accounting (EIP-2929)
            // This returns the gas cost but the frame interpreter handles gas consumption
            _ = self.host.access_address(addr) catch |err| switch (err) {
                else => return Error.AllocationError,
            };

            const bal = self.host.get_balance(addr);
            const balance_word = @as(WordType, @truncate(bal));
            try self.stack.push(balance_word);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// ORIGIN opcode (0x32) - Get execution origination address.
        /// Stack: [] → [origin]
        pub fn origin(self: FrameType, dispatch: Dispatch) Error!Success {
            const tx_origin = self.host.get_tx_origin();
            const origin_u256 = to_u256(tx_origin);
            try self.stack.push(origin_u256);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// CALLER opcode (0x33) - Get caller address.
        /// Stack: [] → [caller]
        pub fn caller(self: FrameType, dispatch: Dispatch) Error!Success {
            const caller_addr = self.host.get_caller();
            const caller_u256 = to_u256(caller_addr);
            try self.stack.push(caller_u256);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// CALLVALUE opcode (0x34) - Get deposited value by the instruction/transaction responsible for this execution.
        /// Stack: [] → [value]
        pub fn callvalue(self: FrameType, dispatch: Dispatch) Error!Success {
            const value = self.host.get_call_value();
            try self.stack.push(value);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// CALLDATALOAD opcode (0x35) - Get input data of current environment.
        /// Stack: [offset] → [data]
        pub fn calldataload(self: FrameType, dispatch: Dispatch) Error!Success {
            const offset = try self.stack.pop();
            // Convert u256 to usize, checking for overflow
            if (offset > std.math.maxInt(usize)) {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }
            const offset_usize = @as(usize, @intCast(offset));

            const calldata = self.host.get_input();
            // Load 32 bytes from calldata, zero-padding if needed
            var word: u256 = 0;
            for (0..32) |i| {
                const byte_index = offset_usize + i;
                if (byte_index < calldata.len) {
                    const byte_val = calldata[byte_index];
                    word = (word << 8) | @as(u256, byte_val);
                } else {
                    word = word << 8; // Zero padding
                }
            }
            // Convert to WordType (truncate if necessary for smaller word types)
            const word_typed = @as(WordType, @truncate(word));
            try self.stack.push(word_typed);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// CALLDATASIZE opcode (0x36) - Get size of input data in current environment.
        /// Stack: [] → [size]
        pub fn calldatasize(self: FrameType, dispatch: Dispatch) Error!Success {
            const calldata = self.host.get_input();
            const calldata_len = @as(WordType, @truncate(@as(u256, @intCast(calldata.len))));
            try self.stack.push(calldata_len);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// CALLDATACOPY opcode (0x37) - Copy input data in current environment to memory.
        /// Stack: [destOffset, offset, length] → []
        pub fn calldatacopy(self: FrameType, dispatch: Dispatch) Error!Success {
            const dest_offset = try self.stack.pop();
            const offset = try self.stack.pop();
            const length = try self.stack.pop();

            // Check for overflow
            if (dest_offset > std.math.maxInt(usize) or
                offset > std.math.maxInt(usize) or
                length > std.math.maxInt(usize))
            {
                return Error.OutOfBounds;
            }

            const dest_offset_usize = @as(usize, @intCast(dest_offset));
            const offset_usize = @as(usize, @intCast(offset));
            const length_usize = @as(usize, @intCast(length));

            if (length_usize == 0) {
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }

            // Ensure memory capacity
            const new_size = dest_offset_usize + length_usize;
            self.memory.ensure_capacity(new_size) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };

            const calldata = self.host.get_input();

            // Copy calldata to memory with proper zero-padding
            var i: usize = 0;
            while (i < length_usize) : (i += 1) {
                const src_index = offset_usize + i;
                const byte_val = if (src_index < calldata.len) calldata[src_index] else 0;
                self.memory.set_byte(dest_offset_usize + i, byte_val) catch return Error.OutOfBounds;
            }

            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// CODESIZE opcode (0x38) - Get size of code running in current environment.
        /// Stack: [] → [size]
        pub fn codesize(self: FrameType, dispatch: Dispatch) Error!Success {
            const bytecode_len = @as(WordType, @truncate(@as(u256, @intCast(self.bytecode.len()))));
            try self.stack.push(bytecode_len);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// CODECOPY opcode (0x39) - Copy code running in current environment to memory.
        /// Stack: [destOffset, offset, length] → []
        pub fn codecopy(self: FrameType, dispatch: Dispatch) Error!Success {
            const dest_offset = try self.stack.pop();
            const offset = try self.stack.pop();
            const length = try self.stack.pop();

            // Check for overflow
            if (dest_offset > std.math.maxInt(usize) or
                offset > std.math.maxInt(usize) or
                length > std.math.maxInt(usize))
            {
                return Error.OutOfBounds;
            }

            const dest_offset_usize = @as(usize, @intCast(dest_offset));
            const offset_usize = @as(usize, @intCast(offset));
            const length_usize = @as(usize, @intCast(length));

            if (length_usize == 0) {
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }

            // Ensure memory capacity
            const new_size = dest_offset_usize + length_usize;
            self.memory.ensure_capacity(new_size) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };

            const code_data = self.bytecode.raw_bytecode();

            // Copy code to memory with proper zero-padding
            var i: usize = 0;
            while (i < length_usize) : (i += 1) {
                const src_index = offset_usize + i;
                const byte_val = if (src_index < code_data.len) code_data[src_index] else 0;
                self.memory.set_byte(dest_offset_usize + i, byte_val) catch return Error.OutOfBounds;
            }

            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// GASPRICE opcode (0x3A) - Get price of gas in current environment.
        /// Stack: [] → [gas_price]
        pub fn gasprice(self: FrameType, dispatch: Dispatch) Error!Success {
            const gas_price = self.host.get_gas_price();
            const gas_price_truncated = @as(WordType, @truncate(gas_price));
            try self.stack.push(gas_price_truncated);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// EXTCODESIZE opcode (0x3B) - Get size of an account's code.
        /// Stack: [address] → [size]
        pub fn extcodesize(self: FrameType, dispatch: Dispatch) Error!Success {
            const address_u256 = try self.stack.pop();
            const addr = from_u256(address_u256);
            const code = self.host.get_code(addr);
            const code_len = @as(WordType, @truncate(@as(u256, @intCast(code.len))));
            try self.stack.push(code_len);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// EXTCODECOPY opcode (0x3C) - Copy an account's code to memory.
        /// Stack: [address, destOffset, offset, length] → []
        pub fn extcodecopy(self: FrameType, dispatch: Dispatch) Error!Success {
            const address_u256 = try self.stack.pop();
            const dest_offset = try self.stack.pop();
            const offset = try self.stack.pop();
            const length = try self.stack.pop();

            // Check for overflow
            if (dest_offset > std.math.maxInt(usize) or
                offset > std.math.maxInt(usize) or
                length > std.math.maxInt(usize))
            {
                return Error.OutOfBounds;
            }

            const addr = from_u256(address_u256);
            const dest_offset_usize = @as(usize, @intCast(dest_offset));
            const offset_usize = @as(usize, @intCast(offset));
            const length_usize = @as(usize, @intCast(length));

            if (length_usize == 0) {
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }

            // Ensure memory capacity
            const new_size = dest_offset_usize + length_usize;
            self.memory.ensure_capacity(new_size) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };

            const code = self.host.get_code(addr);

            // Copy external code to memory with proper zero-padding
            var i: usize = 0;
            while (i < length_usize) : (i += 1) {
                const src_index = offset_usize + i;
                const byte_val = if (src_index < code.len) code[src_index] else 0;
                self.memory.set_byte(dest_offset_usize + i, byte_val) catch return Error.OutOfBounds;
            }

            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// RETURNDATASIZE opcode (0x3D) - Get size of output data from the previous call.
        /// Stack: [] → [size]
        pub fn returndatasize(self: FrameType, dispatch: Dispatch) Error!Success {
            const return_data = self.host.get_return_data();
            const return_data_len = @as(WordType, @truncate(@as(u256, @intCast(return_data.len))));
            try self.stack.push(return_data_len);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// RETURNDATACOPY opcode (0x3E) - Copy output data from the previous call to memory.
        /// Stack: [destOffset, offset, length] → []
        pub fn returndatacopy(self: FrameType, dispatch: Dispatch) Error!Success {
            const dest_offset = try self.stack.pop();
            const offset = try self.stack.pop();
            const length = try self.stack.pop();

            // Check for overflow
            if (dest_offset > std.math.maxInt(usize) or
                offset > std.math.maxInt(usize) or
                length > std.math.maxInt(usize))
            {
                return Error.OutOfBounds;
            }

            const dest_offset_usize = @as(usize, @intCast(dest_offset));
            const offset_usize = @as(usize, @intCast(offset));
            const length_usize = @as(usize, @intCast(length));

            const return_data = self.host.get_return_data();

            // Check if we're trying to read past the end of return data
            if (offset_usize > return_data.len or
                (length_usize > 0 and offset_usize + length_usize > return_data.len))
            {
                return Error.OutOfBounds;
            }

            if (length_usize == 0) {
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }

            // Ensure memory capacity
            const new_size = dest_offset_usize + length_usize;
            self.memory.ensure_capacity(new_size) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };

            // Copy return data to memory (no zero-padding needed since bounds are checked)
            const src_slice = return_data[offset_usize..][0..length_usize];
            self.memory.set_data(dest_offset_usize, src_slice) catch return Error.OutOfBounds;

            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// BLOCKHASH opcode (0x40) - Get the hash of one of the 256 most recent complete blocks.
        /// Stack: [block_number] → [hash]
        pub fn blockhash(self: FrameType, dispatch: Dispatch) Error!Success {
            const block_number = try self.stack.pop();
            const block_hash_opt = self.host.get_block_hash(block_number);

            // Push hash or zero if not available
            if (block_hash_opt) |hash| {
                // Convert [32]u8 to u256
                var hash_value: u256 = 0;
                for (hash) |byte| {
                    hash_value = (hash_value << 8) | @as(u256, byte);
                }
                const hash_word = @as(WordType, @truncate(hash_value));
                try self.stack.push(hash_word);
            } else {
                try self.stack.push(0);
            }

            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// COINBASE opcode (0x41) - Get the current block's beneficiary address.
        /// Stack: [] → [coinbase]
        pub fn coinbase(self: FrameType, dispatch: Dispatch) Error!Success {
            const block_info = self.host.get_block_info();
            const coinbase_u256 = to_u256(block_info.coinbase);
            const coinbase_word = @as(WordType, @truncate(coinbase_u256));
            try self.stack.push(coinbase_word);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// TIMESTAMP opcode (0x42) - Get the current block's timestamp.
        /// Stack: [] → [timestamp]
        pub fn timestamp(self: FrameType, dispatch: Dispatch) Error!Success {
            const block_info = self.host.get_block_info();
            const timestamp_word = @as(WordType, @truncate(@as(u256, @intCast(block_info.timestamp))));
            try self.stack.push(timestamp_word);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// NUMBER opcode (0x43) - Get the current block's number.
        /// Stack: [] → [number]
        pub fn number(self: FrameType, dispatch: Dispatch) Error!Success {
            const block_info = self.host.get_block_info();
            const block_number_word = @as(WordType, @truncate(@as(u256, @intCast(block_info.number))));
            try self.stack.push(block_number_word);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// DIFFICULTY opcode (0x44) - Get the current block's difficulty.
        /// Stack: [] → [difficulty]
        pub fn difficulty(self: FrameType, dispatch: Dispatch) Error!Success {
            const block_info = self.host.get_block_info();
            const difficulty_word = @as(WordType, @truncate(block_info.difficulty));
            try self.stack.push(difficulty_word);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// PREVRANDAO opcode - Alias for DIFFICULTY post-merge.
        /// Stack: [] → [prevrandao]
        pub fn prevrandao(self: FrameType, dispatch: Dispatch) Error!Success {
            return difficulty(self, dispatch);
        }

        /// GASLIMIT opcode (0x45) - Get the current block's gas limit.
        /// Stack: [] → [gas_limit]
        pub fn gaslimit(self: FrameType, dispatch: Dispatch) Error!Success {
            const block_info = self.host.get_block_info();
            const gas_limit_word = @as(WordType, @truncate(@as(u256, @intCast(block_info.gas_limit))));
            try self.stack.push(gas_limit_word);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// CHAINID opcode (0x46) - Get the chain ID.
        /// Stack: [] → [chain_id]
        pub fn chainid(self: FrameType, dispatch: Dispatch) Error!Success {
            const chain_id = self.host.get_chain_id();
            const chain_id_word = @as(WordType, @truncate(@as(u256, chain_id)));
            try self.stack.push(chain_id_word);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// SELFBALANCE opcode (0x47) - Get balance of currently executing account.
        /// Stack: [] → [balance]
        pub fn selfbalance(self: FrameType, dispatch: Dispatch) Error!Success {
            const bal = self.host.get_balance(self.contract_address);
            const balance_word = @as(WordType, @truncate(bal));
            try self.stack.push(balance_word);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// BASEFEE opcode (0x48) - Get the current block's base fee.
        /// Stack: [] → [base_fee]
        pub fn basefee(self: FrameType, dispatch: Dispatch) Error!Success {
            const block_info = self.host.get_block_info();
            const base_fee_word = @as(WordType, @truncate(block_info.base_fee));
            try self.stack.push(base_fee_word);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// BLOBHASH opcode (0x49) - Get versioned hashes of blob transactions.
        /// Stack: [index] → [hash]
        pub fn blobhash(self: FrameType, dispatch: Dispatch) Error!Success {
            const index = try self.stack.pop();
            // Convert u256 to usize for array access
            if (index > std.math.maxInt(usize)) {
                try self.stack.push(0);
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }
            const blob_hash_opt = self.host.get_blob_hash(index);
            // Push hash or zero if not available
            if (blob_hash_opt) |hash| {
                // Convert [32]u8 to u256
                var hash_value: u256 = 0;
                for (hash) |byte| {
                    hash_value = (hash_value << 8) | @as(u256, byte);
                }
                const hash_word = @as(WordType, @truncate(hash_value));
                try self.stack.push(hash_word);
            } else {
                try self.stack.push(0);
            }
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// BLOBBASEFEE opcode (0x4a) - Get the current block's blob base fee.
        /// Stack: [] → [blob_base_fee]
        pub fn blobbasefee(self: FrameType, dispatch: Dispatch) Error!Success {
            const blob_base_fee = self.host.get_blob_base_fee();
            const blob_base_fee_word = @as(WordType, @truncate(blob_base_fee));
            try self.stack.push(blob_base_fee_word);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// GAS opcode (0x5A) - Get the amount of available gas.
        /// Stack: [] → [gas]
        pub fn gas(self: FrameType, dispatch: Dispatch) Error!Success {
            const gas_value = @as(WordType, @max(self.gas_remaining, 0));
            try self.stack.push(gas_value);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// PC opcode (0x58) - Get the value of the program counter prior to the increment.
        /// Stack: [] → [pc]
        pub fn pc(self: FrameType, dispatch: Dispatch) Error!Success {
            // Get PC value from metadata
            const metadata = dispatch.getPcMetadata();
            try self.stack.push(metadata.value);
            const next = dispatch.skipMetadata();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
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
const block_info_mod = @import("block_info.zig");
const memory_mod = @import("memory.zig");

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
    contract_address: Address,
    caller_address: Address,
    origin_address: Address,
    call_value: u256,
    gas_price: u256,
    chain_id: u64,
    input_data: []const u8,
    return_data: []const u8,
    block_info: block_info_mod.BlockInfo,
    code_map: std.AutoHashMap(Address, []const u8),

    pub fn init(allocator: std.mem.Allocator) MockHost {
        return .{
            .allocator = allocator,
            .contract_address = Address.zero(),
            .caller_address = Address.zero(),
            .origin_address = Address.zero(),
            .call_value = 0,
            .gas_price = 20_000_000_000, // 20 gwei
            .chain_id = 1,
            .input_data = &.{},
            .return_data = &.{},
            .block_info = .{
                .coinbase = Address.zero(),
                .timestamp = 1625097600,
                .number = 12345678,
                .difficulty = 1000000,
                .gas_limit = 30_000_000,
                .base_fee = 1_000_000_000,
            },
            .code_map = std.AutoHashMap(Address, []const u8).init(allocator),
        };
    }

    pub fn deinit(self: *MockHost) void {
        self.code_map.deinit();
    }

    pub fn get_tx_origin(self: *const MockHost) Address {
        return self.origin_address;
    }

    pub fn get_caller(self: *const MockHost) Address {
        return self.caller_address;
    }

    pub fn get_call_value(self: *const MockHost) u256 {
        return self.call_value;
    }

    pub fn get_input(self: *const MockHost) []const u8 {
        return self.input_data;
    }

    pub fn get_gas_price(self: *const MockHost) u256 {
        return self.gas_price;
    }

    pub fn get_balance(self: *const MockHost, address: Address) u256 {
        _ = self;
        _ = address;
        return 1_000_000_000_000_000_000; // 1 ETH
    }

    pub fn access_address(self: *const MockHost, _: Address) !u64 {
        _ = self;
        return 100; // Mock gas cost
    }

    pub fn get_code(self: *const MockHost, address: Address) []const u8 {
        return self.code_map.get(address) orelse &.{};
    }

    pub fn get_return_data(self: *const MockHost) []const u8 {
        return self.return_data;
    }

    pub fn get_block_hash(self: *const MockHost, block_number: u256) ?[32]u8 {
        _ = self;
        // Mock: return a hash for blocks within 256 of current
        const current_block = 12345678;
        if (block_number < current_block and current_block - block_number <= 256) {
            var hash: [32]u8 = undefined;
            @memset(&hash, @intCast(block_number & 0xFF));
            return hash;
        }
        return null;
    }

    pub fn get_block_info(self: *const MockHost) block_info_mod.BlockInfo {
        return self.block_info;
    }

    pub fn get_chain_id(self: *const MockHost) u64 {
        return self.chain_id;
    }

    pub fn get_blob_hash(self: *const MockHost, index: u256) ?[32]u8 {
        _ = self;
        // Mock: return hash for first 3 blob indices
        if (index < 3) {
            var hash: [32]u8 = undefined;
            @memset(&hash, @intCast(0xAA + index));
            return hash;
        }
        return null;
    }

    pub fn get_blob_base_fee(self: *const MockHost) u256 {
        _ = self;
        return 1; // Mock blob base fee
    }

    pub fn to_host(self: *MockHost) host_mod.Host {
        return .{
            .ptr = self,
            .vtable = &.{
                .get_tx_origin = @ptrCast(&get_tx_origin),
                .get_caller = @ptrCast(&get_caller),
                .get_call_value = @ptrCast(&get_call_value),
                .get_input = @ptrCast(&get_input),
                .get_gas_price = @ptrCast(&get_gas_price),
                .get_balance = @ptrCast(&get_balance),
                .access_address = @ptrCast(&access_address),
                .get_code = @ptrCast(&get_code),
                .get_return_data = @ptrCast(&get_return_data),
                .get_block_hash = @ptrCast(&get_block_hash),
                .get_block_info = @ptrCast(&get_block_info),
                .get_chain_id = @ptrCast(&get_chain_id),
                .get_blob_hash = @ptrCast(&get_blob_hash),
                .get_blob_base_fee = @ptrCast(&get_blob_base_fee),
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

// Mock dispatch with PC metadata for PC opcode
fn createMockDispatchWithPc(pc_value: u256) TestFrame.Dispatch {
    const mock_handler = struct {
        fn handler(frame: TestFrame, dispatch: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = frame;
            _ = dispatch;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    var schedule: [2]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    schedule[0] = .{ .metadata = .{ .pc = .{ .value = pc_value } } };
    schedule[1] = .{ .opcode_handler = &mock_handler };
    
    return TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
}

test "ADDRESS opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const test_address = Address.fromBytes([_]u8{0x12} ++ [_]u8{0} ** 19) catch unreachable;
    mock_host.contract_address = test_address;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);
    frame.contract_address = test_address;

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.address(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 0x12), result);
}

test "BALANCE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Test: get balance of address 0x1234
    try frame.stack.push(0x1234);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.balance(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 1_000_000_000_000_000_000), result);
}

test "ORIGIN opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const origin = Address.fromBytes([_]u8{0xAB} ++ [_]u8{0} ** 19) catch unreachable;
    mock_host.origin_address = origin;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.origin(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 0xAB), result);
}

test "CALLER opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const caller = Address.fromBytes([_]u8{0xCD} ++ [_]u8{0} ** 19) catch unreachable;
    mock_host.caller_address = caller;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.caller(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 0xCD), result);
}

test "CALLVALUE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    mock_host.call_value = 123456789;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.callvalue(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 123456789), result);
}

test "CALLDATALOAD opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const calldata = [_]u8{0xFF, 0xEE, 0xDD, 0xCC} ++ [_]u8{0} ** 28;
    mock_host.input_data = &calldata;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Load from offset 0
    try frame.stack.push(0);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.calldataload(frame, dispatch);
    
    const result = try frame.stack.pop();
    // First 4 bytes: 0xFFEEDDCC followed by 28 zeros
    const expected = @as(u256, 0xFFEEDDCC) << (28 * 8);
    try testing.expectEqual(expected, result);
}

test "CALLDATASIZE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const calldata = [_]u8{1, 2, 3, 4, 5, 6, 7, 8};
    mock_host.input_data = &calldata;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.calldatasize(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 8), result);
}

test "CALLDATACOPY opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const calldata = [_]u8{0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF};
    mock_host.input_data = &calldata;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Copy 4 bytes from offset 1 to memory offset 0
    try frame.stack.push(0);  // destOffset
    try frame.stack.push(1);  // offset
    try frame.stack.push(4);  // length

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.calldatacopy(frame, dispatch);
    
    // Check memory contents
    const mem_slice = try frame.memory.get_slice(0, 4);
    try testing.expectEqualSlices(u8, &[_]u8{0xBB, 0xCC, 0xDD, 0xEE}, mem_slice);
}

test "CODESIZE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    
    // Create bytecode with some data
    var bytecode = TestBytecode.initEmpty();
    try bytecode.appendSlice(&[_]u8{0x60, 0x00, 0x60, 0x00});
    
    var frame = try TestFrame.init(testing.allocator, bytecode, 1_000_000, null, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.codesize(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 4), result);
}

test "CODECOPY opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    
    // Create bytecode with some data
    var bytecode = TestBytecode.initEmpty();
    const code_data = [_]u8{0x60, 0x40, 0x60, 0x80};
    try bytecode.appendSlice(&code_data);
    
    var frame = try TestFrame.init(testing.allocator, bytecode, 1_000_000, null, host);
    defer frame.deinit(testing.allocator);

    // Copy all 4 bytes to memory offset 0
    try frame.stack.push(0);  // destOffset
    try frame.stack.push(0);  // offset
    try frame.stack.push(4);  // length

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.codecopy(frame, dispatch);
    
    // Check memory contents
    const mem_slice = try frame.memory.get_slice(0, 4);
    try testing.expectEqualSlices(u8, &code_data, mem_slice);
}

test "GASPRICE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    mock_host.gas_price = 25_000_000_000; // 25 gwei
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.gasprice(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 25_000_000_000), result);
}

test "EXTCODESIZE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const test_code = [_]u8{0x60, 0x00, 0x60, 0x00, 0x50};
    const test_address = Address.fromBytes([_]u8{0x99} ++ [_]u8{0} ** 19) catch unreachable;
    try mock_host.code_map.put(test_address, &test_code);
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Get code size of test address
    try frame.stack.push(0x99);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.extcodesize(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 5), result);
}

test "EXTCODECOPY opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const test_code = [_]u8{0xDE, 0xAD, 0xBE, 0xEF, 0xCA, 0xFE};
    const test_address = Address.fromBytes([_]u8{0x88} ++ [_]u8{0} ** 19) catch unreachable;
    try mock_host.code_map.put(test_address, &test_code);
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Copy 4 bytes from offset 1 of external code to memory offset 0
    try frame.stack.push(0x88);  // address
    try frame.stack.push(0);     // destOffset
    try frame.stack.push(1);     // offset
    try frame.stack.push(4);     // length

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.extcodecopy(frame, dispatch);
    
    // Check memory contents
    const mem_slice = try frame.memory.get_slice(0, 4);
    try testing.expectEqualSlices(u8, &[_]u8{0xAD, 0xBE, 0xEF, 0xCA}, mem_slice);
}

test "RETURNDATASIZE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const return_data = [_]u8{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    mock_host.return_data = &return_data;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.returndatasize(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 10), result);
}

test "RETURNDATACOPY opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const return_data = [_]u8{0x11, 0x22, 0x33, 0x44, 0x55, 0x66};
    mock_host.return_data = &return_data;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Copy 3 bytes from offset 2 to memory offset 0
    try frame.stack.push(0);  // destOffset
    try frame.stack.push(2);  // offset
    try frame.stack.push(3);  // length

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.returndatacopy(frame, dispatch);
    
    // Check memory contents
    const mem_slice = try frame.memory.get_slice(0, 3);
    try testing.expectEqualSlices(u8, &[_]u8{0x33, 0x44, 0x55}, mem_slice);
}

test "BLOCKHASH opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Test: get hash of recent block
    try frame.stack.push(12345677); // Current block - 1

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.blockhash(frame, dispatch);
    
    const result = try frame.stack.pop();
    // Mock returns hash filled with (block_number & 0xFF)
    const expected_byte = @as(u8, @intCast(12345677 & 0xFF));
    var expected: u256 = 0;
    var i: u32 = 0;
    while (i < 32) : (i += 1) {
        expected = (expected << 8) | expected_byte;
    }
    try testing.expectEqual(expected, result);
}

test "COINBASE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const coinbase = Address.fromBytes([_]u8{0xF0} ++ [_]u8{0} ** 19) catch unreachable;
    mock_host.block_info.coinbase = coinbase;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.coinbase(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 0xF0), result);
}

test "TIMESTAMP opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    mock_host.block_info.timestamp = 1234567890;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.timestamp(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 1234567890), result);
}

test "NUMBER opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.number(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 12345678), result);
}

test "DIFFICULTY opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    mock_host.block_info.difficulty = 999999999;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.difficulty(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 999999999), result);
}

test "GASLIMIT opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.gaslimit(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 30_000_000), result);
}

test "CHAINID opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    mock_host.chain_id = 56; // BSC mainnet
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.chainid(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 56), result);
}

test "SELFBALANCE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.selfbalance(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 1_000_000_000_000_000_000), result);
}

test "BASEFEE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    mock_host.block_info.base_fee = 15_000_000_000; // 15 gwei
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.basefee(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 15_000_000_000), result);
}

test "BLOBHASH opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Test: get blob hash at index 1
    try frame.stack.push(1);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.blobhash(frame, dispatch);
    
    const result = try frame.stack.pop();
    // Mock returns hash filled with (0xAA + index)
    const expected_byte = 0xAB; // 0xAA + 1
    var expected: u256 = 0;
    var i: u32 = 0;
    while (i < 32) : (i += 1) {
        expected = (expected << 8) | expected_byte;
    }
    try testing.expectEqual(expected, result);
}

test "BLOBBASEFEE opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.blobbasefee(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 1), result);
}

test "GAS opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);
    
    frame.gas_remaining = 500000;

    const dispatch = createMockDispatch();
    _ = try TestFrame.ContextHandlers.gas(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 500000), result);
}

test "PC opcode" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatchWithPc(42);
    _ = try TestFrame.ContextHandlers.pc(frame, dispatch);
    
    const result = try frame.stack.pop();
    try testing.expectEqual(@as(u256, 42), result);
}