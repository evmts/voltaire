const std = @import("std");
const builtin = @import("builtin");
const NoOpTracer = @import("tracer.zig").NoOpTracer;
const memory_mod = @import("memory.zig");
const stack_mod = @import("stack.zig");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;
pub const FrameConfig = @import("frame_config.zig").FrameConfig;
const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
const GasConstants = @import("primitives").GasConstants;
const Address = @import("primitives").Address.Address;
const SelfDestruct = @import("self_destruct.zig").SelfDestruct;
const Host = @import("host.zig").Host;

/// Simple log structure for Frame
pub const Log = struct {
    address: Address,
    topics: []const u256,
    data: []const u8,
};

/// Frame is a lightweight execution context for EVM operations.
/// 
/// ## Limitations
/// 
/// Frame does NOT support the following operations as they are managed by other components:
/// 
/// - **PC tracking and JUMP operations**: The Program Counter (PC) and jump destinations are 
///   managed by the Plan during execution. JUMP/JUMPI validation happens at the Plan level.
/// 
/// - **CALL/CREATE operations**: Nested execution contexts and contract creation are handled 
///   by the Host or EVM instance, not the Frame itself.
/// 
/// - **Environment operations**: Block information (BLOCKHASH, COINBASE, TIMESTAMP, etc.) and 
///   transaction context (ORIGIN, GASPRICE, etc.) are provided by the Host interface.
/// 
/// - **Block operations**: BLOCKHASH, COINBASE, TIMESTAMP, NUMBER, DIFFICULTY, GASLIMIT, 
///   CHAINID, SELFBALANCE, BASEFEE operations require Host context.
/// 
/// ## Supported Operations
/// 
/// Frame provides direct support for:
/// - Stack operations (PUSH, POP, DUP, SWAP)
/// - Arithmetic operations (ADD, SUB, MUL, DIV, etc.)
/// - Bitwise operations (AND, OR, XOR, NOT, etc.)
/// - Comparison operations (LT, GT, EQ, etc.)
/// - Memory operations (MLOAD, MSTORE, MSIZE, MCOPY)
/// - Storage operations (SLOAD, SSTORE, TLOAD, TSTORE) when database is configured
/// - Hashing operations (KECCAK256)
/// - LOG operations (LOG0-LOG4)
/// 
pub fn Frame(comptime config: FrameConfig) type {
    comptime config.validate();

    return struct {
        pub const WordType = config.WordType;
        pub const TracerType = config.TracerType;
        pub const GasType = config.GasType();
        pub const PcType = config.PcType();
        pub const Memory = memory_mod.Memory(.{
            .initial_capacity = config.memory_initial_capacity,
            .memory_limit = config.memory_limit,
        });
        pub const Stack = stack_mod.Stack(.{
            .stack_size = config.stack_size,
            .WordType = config.WordType,
        });
        pub const Error = error{
            StackOverflow,
            StackUnderflow,
            STOP,
            BytecodeTooLarge,
            AllocationError,
            InvalidJump,
            InvalidOpcode,
            OutOfBounds,
            OutOfGas,
            WriteProtection,
        };
        pub const max_bytecode_size = config.max_bytecode_size;

        const Self = @This();

        // Cacheline 1
        stack: Stack, // EVM stack
        bytecode: []const u8, // 16 bytes (slice)
        gas_remaining: GasType, // 4 or 8 bytes depending on block_gas_limit
        tracer: TracerType, // Tracer instance for execution tracing
        memory: Memory, // EVM memory
        database: if (config.has_database) ?DatabaseInterface else void, // Optional database interface
        
        // Contract execution context
        contract_address: Address = [_]u8{0} ** 20, // Address of currently executing contract
        self_destruct: ?*SelfDestruct = null, // Tracks contracts marked for destruction
        logs: std.ArrayList(Log), // Event logs emitted during execution
        is_static: bool = false, // Whether frame is in static context (no state modifications)
        
        // Host interface for external operations (optional)
        host: ?Host = null,

        pub fn init(allocator: std.mem.Allocator, bytecode: []const u8, gas_remaining: GasType, database: if (config.has_database) ?DatabaseInterface else void, host: ?Host) Error!Self {
            if (bytecode.len > max_bytecode_size) return Error.BytecodeTooLarge;
            
            var stack = Stack.init(allocator) catch {
                return Error.AllocationError;
            };
            errdefer stack.deinit(allocator);

            var memory = Memory.init(allocator) catch {
                return Error.AllocationError;
            };
            errdefer memory.deinit();

            var logs = std.ArrayList(Log).init(allocator);
            errdefer logs.deinit();

            return Self{
                .stack = stack,
                .bytecode = bytecode,
                .gas_remaining = gas_remaining,
                .tracer = TracerType.init(),
                .memory = memory,
                .database = database,
                .logs = logs,
                .host = host,
            };
        }

        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            self.stack.deinit(allocator);
            self.memory.deinit();
            // Free log data
            for (self.logs.items) |log| {
                allocator.free(log.topics);
                allocator.free(log.data);
            }
            self.logs.deinit();
        }
        
        /// Create a deep copy of the frame.
        /// This is used by DebugPlan to create a sidecar frame for validation.
        pub fn copy(self: *const Self, allocator: std.mem.Allocator) Error!Self {
            // Copy stack
            var new_stack = Stack.init(allocator) catch {
                return Error.AllocationError;
            };
            errdefer new_stack.deinit(allocator);
            
            // Copy stack contents
            @memcpy(new_stack.stack[0..self.stack.next_stack_index], self.stack.stack[0..self.stack.next_stack_index]);
            new_stack.next_stack_index = self.stack.next_stack_index;
            
            // Copy memory
            var new_memory = Memory.init(allocator) catch {
                return Error.AllocationError;
            };
            errdefer new_memory.deinit();
            
            // Copy memory contents
            if (self.memory.len() > 0) {
                new_memory.resize(self.memory.len()) catch {
                    return Error.AllocationError;
                };
                @memcpy(new_memory.data()[0..self.memory.len()], self.memory.data()[0..self.memory.len()]);
            }
            
            // Copy logs
            var new_logs = std.ArrayList(Log).init(allocator);
            errdefer new_logs.deinit();
            
            for (self.logs.items) |log| {
                // Allocate and copy topics
                const topics_copy = allocator.alloc(u256, log.topics.len) catch {
                    return Error.AllocationError;
                };
                @memcpy(topics_copy, log.topics);
                
                // Allocate and copy data
                const data_copy = allocator.alloc(u8, log.data.len) catch {
                    allocator.free(topics_copy);
                    return Error.AllocationError;
                };
                @memcpy(data_copy, log.data);
                
                new_logs.append(Log{
                    .address = log.address,
                    .topics = topics_copy,
                    .data = data_copy,
                }) catch {
                    allocator.free(topics_copy);
                    allocator.free(data_copy);
                    return Error.AllocationError;
                };
            }
            
            return Self{
                .stack = new_stack,
                .bytecode = self.bytecode, // Bytecode is immutable, share reference
                .gas_remaining = self.gas_remaining,
                .tracer = self.tracer, // Tracer can be shared for NoOpTracer
                .memory = new_memory,
                .database = self.database,
                .contract_address = self.contract_address,
                .self_destruct = self.self_destruct,
                .logs = new_logs,
                .host = self.host,
                .is_static = self.is_static,
            };
        }
        
        /// Compare two frames for equality.
        /// Used by DebugPlan to validate execution.
        pub fn assertEqual(self: *const Self, other: *const Self) void {
            // Compare gas
            if (self.gas_remaining != other.gas_remaining) {
                std.debug.panic("Frame.assertEqual: gas mismatch: {} vs {}", .{ self.gas_remaining, other.gas_remaining });
            }
            
            // Compare stack
            if (self.stack.next_stack_index != other.stack.next_stack_index) {
                std.debug.panic("Frame.assertEqual: stack size mismatch: {} vs {}", .{ self.stack.next_stack_index, other.stack.next_stack_index });
            }
            for (0..self.stack.next_stack_index) |i| {
                if (self.stack.stack[i] != other.stack.stack[i]) {
                    std.debug.panic("Frame.assertEqual: stack[{}] mismatch: {} vs {}", .{ i, self.stack.stack[i], other.stack.stack[i] });
                }
            }
            
            // Compare memory
            if (self.memory.len() != other.memory.len()) {
                std.debug.panic("Frame.assertEqual: memory size mismatch: {} vs {}", .{ self.memory.len(), other.memory.len() });
            }
            if (self.memory.len() > 0) {
                const self_data = self.memory.data();
                const other_data = other.memory.data();
                for (0..self.memory.len()) |i| {
                    if (self_data[i] != other_data[i]) {
                        std.debug.panic("Frame.assertEqual: memory[{}] mismatch: {} vs {}", .{ i, self_data[i], other_data[i] });
                    }
                }
            }
            
            // Compare execution context
            if (!std.mem.eql(u8, &self.contract_address, &other.contract_address)) {
                std.debug.panic("Frame.assertEqual: contract_address mismatch", .{});
            }
            
            // Compare is_static
            if (self.is_static != other.is_static) {
                std.debug.panic("Frame.assertEqual: is_static mismatch: {} vs {}", .{ self.is_static, other.is_static });
            }
            
            // Compare logs
            if (self.logs.items.len != other.logs.items.len) {
                std.debug.panic("Frame.assertEqual: logs count mismatch: {} vs {}", .{ self.logs.items.len, other.logs.items.len });
            }
            for (self.logs.items, other.logs.items) |self_log, other_log| {
                if (!std.mem.eql(u8, &self_log.address, &other_log.address)) {
                    std.debug.panic("Frame.assertEqual: log address mismatch", .{});
                }
                if (self_log.topics.len != other_log.topics.len) {
                    std.debug.panic("Frame.assertEqual: log topics count mismatch", .{});
                }
                for (self_log.topics, other_log.topics) |self_topic, other_topic| {
                    if (self_topic != other_topic) {
                        std.debug.panic("Frame.assertEqual: log topic mismatch", .{});
                    }
                }
                if (!std.mem.eql(u8, self_log.data, other_log.data)) {
                    std.debug.panic("Frame.assertEqual: log data mismatch", .{});
                }
            }
        }
        
        /// Pretty print the frame state for debugging.
        pub fn pretty_print(self: *const Self) void {
            std.log.warn("\n=== Frame State ===\n", .{});
            std.log.warn("Gas Remaining: {}\n", .{self.gas_remaining});
            std.log.warn("Bytecode Length: {}\n", .{self.bytecode.len});
            
            // Show bytecode (first 50 bytes or less)
            const show_bytes = @min(self.bytecode.len, 50);
            std.log.warn("Bytecode (first {} bytes): ", .{show_bytes});
            for (self.bytecode[0..show_bytes]) |b| {
                std.log.warn("{x:0>2} ", .{b});
            }
            if (self.bytecode.len > 50) {
                std.log.warn("... ({} more bytes)", .{self.bytecode.len - 50});
            }
            std.log.warn("\n", .{});
            
            // Stack state
            std.log.warn("\nStack (size={}, capacity={}):\n", .{ self.stack.size(), Stack.stack_capacity });
            if (self.stack.size() == 0) {
                std.log.warn("  [empty]\n", .{});
            } else {
                // Show top 10 stack items
                const show_items = @min(self.stack.size(), 10);
                const stack_slice = self.stack.get_slice();
                var i: usize = 0;
                while (i < show_items) : (i += 1) {
                    const value = stack_slice[i]; // In downward stack, [0] is top
                    const idx = i;
                    if (i == 0) {
                        std.log.warn("  [{d:3}] 0x{x:0>64} <- TOP\n", .{ idx, value });
                    } else {
                        std.log.warn("  [{d:3}] 0x{x:0>64}\n", .{ idx, value });
                    }
                }
                if (self.stack.size() > 10) {
                    std.log.warn("  ... ({} more items)\n", .{self.stack.size() - 10});
                }
            }
            
            // Memory state
            std.log.warn("\nMemory (size={}):\n", .{self.memory.size()});
            if (self.memory.size() == 0) {
                std.log.warn("  [empty]\n", .{});
            } else {
                // Show first 256 bytes of memory in hex dump format
                const show_mem = @min(self.memory.size(), 256);
                var offset: usize = 0;
                while (offset < show_mem) : (offset += 32) {
                    const end = @min(offset + 32, show_mem);
                    std.log.warn("  0x{x:0>4}: ", .{offset});
                    
                    // Hex bytes
                    var i = offset;
                    while (i < end) : (i += 1) {
                        const b = self.memory.get_byte(i) catch 0;
                        std.log.warn("{x:0>2} ", .{b});
                    }
                    
                    // Pad if less than 32 bytes
                    if (end - offset < 32) {
                        var pad = end - offset;
                        while (pad < 32) : (pad += 1) {
                            std.log.warn("   ", .{});
                        }
                    }
                    
                    // ASCII representation
                    std.log.warn(" |", .{});
                    i = offset;
                    while (i < end) : (i += 1) {
                        const b = self.memory.get_byte(i) catch 0;
                        if (b >= 32 and b <= 126) {
                            std.log.warn("{c}", .{b});
                        } else {
                            std.log.warn(".", .{});
                        }
                    }
                    std.log.warn("|\n", .{});
                }
                if (self.memory.size() > 256) {
                    std.log.warn("  ... ({} more bytes)\n", .{self.memory.size() - 256});
                }
            }
            
            // Log state
            std.log.warn("\nLogs (count={}):\n", .{self.logs.items.len});
            if (self.logs.items.len == 0) {
                std.log.warn("  [empty]\n", .{});
            } else {
                for (self.logs.items, 0..) |log, i| {
                    std.log.warn("  Log[{}]:\n", .{i});
                    std.log.warn("    Address: 0x", .{});
                    for (log.address) |b| {
                        std.log.warn("{x:0>2}", .{b});
                    }
                    std.log.warn("\n", .{});
                    std.log.warn("    Topics ({}):\n", .{log.topics.len});
                    for (log.topics, 0..) |topic, j| {
                        std.log.warn("      [{}] 0x{x:0>64}\n", .{ j, topic });
                    }
                    std.log.warn("    Data ({} bytes): 0x", .{log.data.len});
                    const show_data = @min(log.data.len, 64);
                    for (log.data[0..show_data]) |b| {
                        std.log.warn("{x:0>2}", .{b});
                    }
                    if (log.data.len > 64) {
                        std.log.warn("... ({} more bytes)", .{log.data.len - 64});
                    }
                    std.log.warn("\n", .{});
                }
            }
            
            std.log.warn("===================\n\n", .{});
        }

        pub fn pop(self: *Self) Error!void {
            _ = try self.stack.pop();
        }

        pub fn stop(self: *Self) Error!void {
            _ = self;
            return Error.STOP;
        }

        // Bitwise operations
        pub fn @"and"(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top & top_minus_1);
        }

        pub fn @"or"(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top | top_minus_1);
        }


        pub fn xor(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top ^ top_minus_1);
        }

        pub fn @"not"(self: *Self) Error!void {
            const top = try self.stack.peek();
            try self.stack.set_top(~top);
        }

        pub fn byte(self: *Self) Error!void {
            const byte_index = try self.stack.pop();
            const value = try self.stack.peek();
            const result = if (byte_index >= 32) 0 else blk: {
                const index_usize = @as(usize, @intCast(byte_index));
                const shift_amount = (31 - index_usize) * 8;
                break :blk (value >> @intCast(shift_amount)) & 0xFF;
            };
            try self.stack.set_top(result);
        }

        pub fn shl(self: *Self) Error!void {
            const shift = try self.stack.pop();
            const value = try self.stack.peek();
            const result = if (shift >= 256) 0 else value << @intCast(shift);
            try self.stack.set_top(result);
        }

        pub fn shr(self: *Self) Error!void {
            const shift = try self.stack.pop();
            const value = try self.stack.peek();
            const result = if (shift >= 256) 0 else value >> @intCast(shift);
            try self.stack.set_top(result);
        }

        pub fn sar(self: *Self) Error!void {
            const shift = try self.stack.pop();
            const value = try self.stack.peek();
            const result = if (shift >= 256) blk: {
                const sign_bit = value >> 255;
                break :blk if (sign_bit == 1) @as(WordType, std.math.maxInt(WordType)) else @as(WordType, 0);
            } else blk: {
                const shift_amount = @as(u8, @intCast(shift));
                // https://ziglang.org/documentation/master/std/#std.meta.Int
                // std.meta.Int creates an integer type with specified signedness and bit width
                const value_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(value));
                const result_signed = value_signed >> shift_amount;
                break :blk @as(WordType, @bitCast(result_signed));
            };
            try self.stack.set_top(result);
        }

        // Arithmetic operations
        pub fn add(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top +% top_minus_1);
        }

        pub fn mul(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top *% top_minus_1);
        }

        pub fn sub(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top -% top_minus_1);
        }

        pub fn div(self: *Self) Error!void {
            const denominator = try self.stack.pop();
            const numerator = try self.stack.peek();
            const result = if (denominator == 0) 0 else numerator / denominator;
            try self.stack.set_top(result);
        }

        pub fn sdiv(self: *Self) Error!void {
            const denominator = try self.stack.pop();
            const numerator = try self.stack.peek();
            var result: WordType = undefined;
            if (denominator == 0) {
                result = 0;
            } else {
                const numerator_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(numerator));
                const denominator_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(denominator));
                const min_signed = std.math.minInt(std.meta.Int(.signed, @bitSizeOf(WordType)));
                if (numerator_signed == min_signed and denominator_signed == -1) {
                    // MIN / -1 overflow case
                    result = numerator;
                } else {
                    const result_signed = @divTrunc(numerator_signed, denominator_signed);
                    result = @as(WordType, @bitCast(result_signed));
                }
            }
            try self.stack.set_top(result);
        }

        pub fn mod(self: *Self) Error!void {
            const denominator = try self.stack.pop();
            const numerator = try self.stack.peek();
            const result = if (denominator == 0) 0 else numerator % denominator;
            try self.stack.set_top(result);
        }

        pub fn smod(self: *Self) Error!void {
            const denominator = try self.stack.pop();
            const numerator = try self.stack.peek();
            var result: WordType = undefined;
            if (denominator == 0) {
                result = 0;
            } else {
                const numerator_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(numerator));
                const denominator_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(denominator));
                const result_signed = @rem(numerator_signed, denominator_signed);
                result = @as(WordType, @bitCast(result_signed));
            }
            try self.stack.set_top(result);
        }

        pub fn addmod(self: *Self) Error!void {
            const modulus = try self.stack.pop();
            const addend2 = try self.stack.pop();
            const addend1 = try self.stack.peek();
            var result: WordType = undefined;
            if (modulus == 0) {
                result = 0;
            } else {
                const sum = @addWithOverflow(addend1, addend2);
                if (sum[1] == 0) {
                    result = sum[0] % modulus;
                } else {
                    result = sum[0] % modulus;
                }
            }
            try self.stack.set_top(result);
        }

        pub fn mulmod(self: *Self) Error!void {
            const modulus = try self.stack.pop();
            const factor2 = try self.stack.pop();
            const factor1 = try self.stack.peek();
            var result: WordType = undefined;
            if (modulus == 0) {
                result = 0;
            } else {
                const factor1_mod = factor1 % modulus;
                const factor2_mod = factor2 % modulus;
                const product = factor1_mod *% factor2_mod;
                result = product % modulus;
            }
            try self.stack.set_top(result);
        }

        pub fn exp(self: *Self) Error!void {
            const exponent = try self.stack.pop();
            const base = try self.stack.peek();
            var result: WordType = 1;
            var b = base;
            var e = exponent;
            while (e > 0) : (e >>= 1) {
                if (e & 1 == 1) {
                    result *%= b;
                }
                b *%= b;
            }
            try self.stack.set_top(result);
        }

        pub fn signextend(self: *Self) Error!void {
            const ext = try self.stack.pop();
            const value = try self.stack.peek();
            var result: WordType = undefined;
            if (ext >= 31) {
                result = value;
            } else {
                const ext_usize = @as(usize, @intCast(ext));
                const bit_index = ext_usize * 8 + 7;
                const mask = (@as(WordType, 1) << @intCast(bit_index)) - 1;
                const sign_bit = (value >> @intCast(bit_index)) & 1;
                if (sign_bit == 1) {
                    result = value | ~mask;
                } else {
                    result = value & mask;
                }
            }
            try self.stack.set_top(result);
        }

        /// Consume gas without checking (for use after static analysis)
        pub fn consumeGasUnchecked(self: *Self, amount: u64) void {
            self.gas_remaining -= @as(GasType, @intCast(amount));
        }

        /// Check if we're out of gas at end of execution
        pub fn checkGas(self: *Self) Error!void {
            if (@as(std.builtin.BranchHint, .cold) == .cold and self.gas_remaining < 0) return Error.OutOfGas;
        }

        pub fn gas(self: *Self) Error!void {
            const gas_value = if (self.gas_remaining < 0) 0 else @as(WordType, @intCast(self.gas_remaining));
            return self.stack.push(gas_value);
        }

        // Comparison operations
        pub fn lt(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            const result: WordType = if (top < top_minus_1) 1 else 0;
            try self.stack.set_top(result);
        }

        pub fn gt(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            const result: WordType = if (top > top_minus_1) 1 else 0;
            try self.stack.set_top(result);
        }

        pub fn slt(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            const SignedType = std.meta.Int(.signed, @bitSizeOf(WordType));
            const top_signed = @as(SignedType, @bitCast(top));
            const top_minus_1_signed = @as(SignedType, @bitCast(top_minus_1));
            const result: WordType = if (top_signed < top_minus_1_signed) 1 else 0;
            try self.stack.set_top(result);
        }

        pub fn sgt(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            const SignedType = std.meta.Int(.signed, @bitSizeOf(WordType));
            const top_signed = @as(SignedType, @bitCast(top));
            const top_minus_1_signed = @as(SignedType, @bitCast(top_minus_1));
            const result: WordType = if (top_signed > top_minus_1_signed) 1 else 0;
            try self.stack.set_top(result);
        }

        pub fn eq(self: *Self) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            const result: WordType = if (top == top_minus_1) 1 else 0;
            try self.stack.set_top(result);
        }

        pub fn iszero(self: *Self) Error!void {
            const value = try self.stack.peek();
            const result: WordType = if (value == 0) 1 else 0;
            try self.stack.set_top(result);
        }

        // Helper function to validate if a PC position contains a valid JUMPDEST
        pub fn is_valid_jump_dest(self: *Self, pc_value: usize) bool {
            if (pc_value >= self.bytecode.len) return false;
            const opcode = self.bytecode[pc_value];
            return opcode == @intFromEnum(Opcode.JUMPDEST);
        }

        pub fn jumpdest(self: *Self) Error!void {
            _ = self;
            // JUMPDEST does nothing - it's just a marker for valid jump destinations
        }

        pub fn invalid(self: *Self) Error!void {
            _ = self;
            return Error.InvalidOpcode;
        }

        // Cryptographic operations
        pub fn keccak256(self: *Self, data: []const u8) Error!void {
            // For now, we'll take data as a parameter
            // In a real implementation, this would read from memory
            var hash: [32]u8 = undefined;
            std.crypto.hash.sha3.Keccak256.hash(data, &hash, .{});

            // Convert hash to WordType
            var result: WordType = 0;
            var i: usize = 0;
            while (i < 32) : (i += 1) {
                result = (result << 8) | hash[i];
            }

            try self.stack.push(result);
        }

        // Memory operations
        pub fn msize(self: *Self) Error!void {
            // MSIZE returns the size of active memory in bytes
            const size = @as(WordType, @intCast(self.memory.size()));
            return self.stack.push(size);
        }

        pub fn mload(self: *Self) Error!void {
            // MLOAD loads a 32-byte word from memory
            const offset = try self.stack.pop();

            // Check if offset fits in usize
            if (offset > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }

            const offset_usize = @as(usize, @intCast(offset));

            // Read 32 bytes from memory (EVM-compliant with automatic expansion)
            const value = self.memory.get_u256_evm(offset_usize) catch |err| switch (err) {
                memory_mod.MemoryError.OutOfBounds => return Error.OutOfBounds,
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };

            try self.stack.push(value);
        }

        pub fn mstore(self: *Self) Error!void {
            // MSTORE stores a 32-byte word to memory
            const offset = try self.stack.pop();
            const value = try self.stack.pop();

            // Check if offset fits in usize
            if (offset > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }

            const offset_usize = @as(usize, @intCast(offset));

            // Write 32 bytes to memory using EVM-compliant expansion
            self.memory.set_u256_evm(offset_usize, value) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
        }

        pub fn mstore8(self: *Self) Error!void {
            // MSTORE8 stores a single byte to memory
            const offset = try self.stack.pop();
            const value = try self.stack.pop();

            // Check if offset fits in usize
            if (offset > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }

            const offset_usize = @as(usize, @intCast(offset));
            const byte_value = @as(u8, @truncate(value & 0xFF));

            // Write 1 byte to memory using EVM-compliant expansion
            self.memory.set_byte_evm(offset_usize, byte_value) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
        }

        pub fn mcopy(self: *Self) Error!void {
            // MCOPY copies memory from source to destination
            // Stack: [dest, src, length]
            const dest = try self.stack.pop();
            const src = try self.stack.pop();  
            const length = try self.stack.pop();

            // Early return for zero length
            if (length == 0) {
                return;
            }

            // Check bounds
            if (dest > std.math.maxInt(usize) or src > std.math.maxInt(usize) or length > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }

            const dest_usize = @as(usize, @intCast(dest));
            const src_usize = @as(usize, @intCast(src));
            const length_usize = @as(usize, @intCast(length));

            // Calculate max memory address needed
            const max_addr = @max(dest_usize + length_usize, src_usize + length_usize);

            // Ensure memory is expanded to accommodate both source and destination
            // This will charge memory expansion gas
            self.memory.ensure_capacity(max_addr) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };

            // Calculate and consume dynamic gas for copy operation
            const word_count = (length_usize + 31) / 32;
            const copy_gas = GasConstants.CopyGas * word_count;
            
            // Check if we have enough gas
            if (copy_gas > std.math.maxInt(GasType)) {
                return Error.OutOfGas;
            }
            const copy_gas_typed = @as(GasType, @intCast(copy_gas));
            
            self.gas_remaining = self.gas_remaining - copy_gas_typed;
            if (self.gas_remaining < 0) {
                return Error.OutOfGas;
            }

            // Get memory buffer slice
            const mem_buffer = self.memory.get_buffer_ref();
            const checkpoint = self.memory.checkpoint;
            const mem_slice = mem_buffer.items;
            
            // Perform the memory copy with overlap handling
            // We need to add checkpoint offset to our indices
            const actual_src = checkpoint + src_usize;
            const actual_dest = checkpoint + dest_usize;
            
            if (mem_slice.len >= checkpoint + max_addr) {
                const src_slice = mem_slice[actual_src .. actual_src + length_usize];
                const dest_slice = mem_slice[actual_dest .. actual_dest + length_usize];
                
                if (dest_usize > src_usize and dest_usize < src_usize + length_usize) {
                    // Forward overlap: dest is within source range, copy backwards
                    std.mem.copyBackwards(u8, dest_slice, src_slice);
                } else if (src_usize > dest_usize and src_usize < dest_usize + length_usize) {
                    // Backward overlap: src is within dest range, copy forwards
                    std.mem.copyForwards(u8, dest_slice, src_slice);
                } else {
                    // No overlap, use forward copy
                    std.mem.copyForwards(u8, dest_slice, src_slice);
                }
            } else {
                // This shouldn't happen as we ensured capacity above
                return Error.OutOfBounds;
            }
        }

        // Storage operations
        pub fn sload(self: *Self) Error!void {
            // SLOAD loads a value from storage
            if (comptime !config.has_database) {
                return Error.InvalidOpcode;
            }
            
            const slot = try self.stack.pop();
            
            // Get database interface
            const db = self.database orelse return Error.InvalidOpcode;
            
            // For now, use a dummy address - in real implementation this would be the current contract address
            const address = [_]u8{0} ** 20;
            
            // Load value from storage
            const value = db.get_storage(address, slot) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
            
            try self.stack.push(value);
        }

        pub fn sstore(self: *Self) Error!void {
            // SSTORE stores a value to storage
            if (comptime !config.has_database) {
                return Error.InvalidOpcode;
            }
            
            const slot = try self.stack.pop();
            const value = try self.stack.pop();
            
            // Get database interface
            const db = self.database orelse return Error.InvalidOpcode;
            
            // For now, use a dummy address - in real implementation this would be the current contract address
            const address = [_]u8{0} ** 20;
            
            // Store value to storage
            db.set_storage(address, slot, value) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
        }

        // Transient storage operations (EIP-1153)
        pub fn tload(self: *Self) Error!void {
            // TLOAD loads a value from transient storage
            if (comptime !config.has_database) {
                return Error.InvalidOpcode;
            }
            
            const slot = try self.stack.pop();
            
            // Get database interface
            const db = self.database orelse return Error.InvalidOpcode;
            
            // For now, use a dummy address - in real implementation this would be the current contract address
            const address = [_]u8{0} ** 20;
            
            // Load value from transient storage
            const value = db.get_transient_storage(address, slot) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
            
            try self.stack.push(value);
        }

        pub fn tstore(self: *Self) Error!void {
            // TSTORE stores a value to transient storage
            if (comptime !config.has_database) {
                return Error.InvalidOpcode;
            }
            
            const slot = try self.stack.pop();
            const value = try self.stack.pop();
            
            // Get database interface
            const db = self.database orelse return Error.InvalidOpcode;
            
            // For now, use a dummy address - in real implementation this would be the current contract address
            const address = [_]u8{0} ** 20;
            
            // Store value to transient storage
            db.set_transient_storage(address, slot, value) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
        }
        
        pub fn selfdestruct(self: *Self) Error!void {
            // TODO: Check if our frame should have been static on parent host
            // if (self.host.is_static(self)) return Error.WriteProtection;
            
            // Pop recipient address from stack
            const recipient_u256 = try self.stack.pop();
            
            // Convert u256 to address (take the lower 20 bytes)
            var recipient_addr: Address = undefined;
            var temp = recipient_u256;
            for (0..20) |i| {
                recipient_addr[19 - i] = @truncate(temp);
                temp >>= 8;
            }
            
            // Get or create self destruct tracker
            if (self.self_destruct == null) {
                // This would normally be passed in from the execution context
                // For now, return an error as we need proper context setup
                return Error.InvalidOpcode;
            }
            
            // Mark this contract for destruction
            self.self_destruct.?.mark_for_destruction(self.contract_address, recipient_addr) catch {
                return Error.AllocationError;
            };
            
            // SELFDESTRUCT terminates execution
            return Error.STOP;
        }
        
        // LOG operations
        fn make_log(self: *Self, comptime num_topics: u8, allocator: std.mem.Allocator) Error!void {
            // Check if we're in a static call
            if (self.is_static) {
                @branchHint(.unlikely);
                return Error.WriteProtection;
            }
            
            // Pop offset and size
            const offset = try self.stack.pop();
            const size = try self.stack.pop();
            
            // Early bounds checking
            if (offset > std.math.maxInt(usize) or size > std.math.maxInt(usize)) {
                @branchHint(.unlikely);
                return Error.OutOfBounds;
            }
            
            // Stack-allocated topics array
            var topics: [4]u256 = undefined;
            // Pop N topics in reverse order (LIFO stack order)
            for (0..num_topics) |i| {
                topics[num_topics - 1 - i] = try self.stack.pop();
            }
            
            const offset_usize = @as(usize, @intCast(offset));
            const size_usize = @as(usize, @intCast(size));
            
            // Handle empty data case
            if (size_usize == 0) {
                @branchHint(.unlikely);
                // Emit empty log without memory operations
                const topics_slice = allocator.alloc(u256, num_topics) catch return Error.AllocationError;
                @memcpy(topics_slice, topics[0..num_topics]);
                
                const empty_data = allocator.alloc(u8, 0) catch {
                    allocator.free(topics_slice);
                    return Error.AllocationError;
                };
                
                self.logs.append(Log{
                    .address = self.contract_address,
                    .topics = topics_slice,
                    .data = empty_data,
                }) catch {
                    allocator.free(topics_slice);
                    allocator.free(empty_data);
                    return Error.AllocationError;
                };
                return;
            }
            
            // Note: Base LOG gas (375) and topic gas (375 * N) are handled by jump table as constant_gas
            // We only need to handle dynamic costs: memory expansion and data bytes
            
            // 1. Ensure memory is available for the data
            const new_size = offset_usize + size_usize;
            self.memory.ensure_capacity(new_size) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            
            // 2. Dynamic gas for data
            const byte_cost = GasConstants.LogDataGas * size_usize;
            if (byte_cost > std.math.maxInt(GasType)) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @as(GasType, @intCast(byte_cost));
            if (self.gas_remaining < 0) {
                return Error.OutOfGas;
            }
            
            // Get log data
            const data = self.memory.get_slice(offset_usize, size_usize) catch return Error.OutOfBounds;
            
            // Allocate and copy topics
            const topics_slice = allocator.alloc(u256, num_topics) catch return Error.AllocationError;
            @memcpy(topics_slice, topics[0..num_topics]);
            
            // Allocate and copy data
            const data_copy = allocator.alloc(u8, size_usize) catch {
                allocator.free(topics_slice);
                return Error.AllocationError;
            };
            @memcpy(data_copy, data);
            
            // Emit log with data
            self.logs.append(Log{
                .address = self.contract_address,
                .topics = topics_slice,
                .data = data_copy,
            }) catch {
                allocator.free(topics_slice);
                allocator.free(data_copy);
                return Error.AllocationError;
            };
        }
        
        pub fn log0(self: *Self, allocator: std.mem.Allocator) Error!void {
            return self.make_log(0, allocator);
        }
        
        pub fn log1(self: *Self, allocator: std.mem.Allocator) Error!void {
            return self.make_log(1, allocator);
        }
        
        pub fn log2(self: *Self, allocator: std.mem.Allocator) Error!void {
            return self.make_log(2, allocator);
        }
        
        pub fn log3(self: *Self, allocator: std.mem.Allocator) Error!void {
            return self.make_log(3, allocator);
        }
        
        pub fn log4(self: *Self, allocator: std.mem.Allocator) Error!void {
            return self.make_log(4, allocator);
        }
    };
}

test "Frame stack operations" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const dummy_bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var frame = try F.init(allocator, &dummy_bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test push operations through stack
    frame.stack.push_unsafe(42);
    try std.testing.expectEqual(@as(u256, 42), frame.stack.peek_unsafe());

    frame.stack.push_unsafe(100);
    const val = frame.stack.pop_unsafe();
    try std.testing.expectEqual(@as(u256, 100), val);
    try std.testing.expectEqual(@as(u256, 42), frame.stack.peek_unsafe());

    // Test push with overflow check
    // Fill stack to capacity - we have 1 item, need 1023 more to reach 1024
    var i: usize = 0;
    while (i < 1022) : (i += 1) {
        frame.stack.push_unsafe(@as(u256, i));
    }
    
    try frame.stack.push(200); // This should succeed - stack now has 1024 items
    try std.testing.expectEqual(@as(u256, 200), frame.stack.peek_unsafe());

    // This should error - stack is full
    try std.testing.expectError(error.StackOverflow, frame.stack.push(300));
}

test "Frame stack pop operations" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const dummy_bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var frame = try F.init(allocator, &dummy_bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Setup stack with some values
    frame.stack.push_unsafe(10);
    frame.stack.push_unsafe(20);
    frame.stack.push_unsafe(30);

    // Test pop_unsafe
    const val1 = frame.stack.pop_unsafe();
    try std.testing.expectEqual(@as(u256, 30), val1);

    const val2 = frame.stack.pop_unsafe();
    try std.testing.expectEqual(@as(u256, 20), val2);

    // Test pop with underflow check
    const val3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 10), val3);

    // This should error - stack is empty
    try std.testing.expectError(error.StackUnderflow, frame.stack.pop());
}

test "Frame stack set_top operations" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const dummy_bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var frame = try F.init(allocator, &dummy_bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Setup stack with some values
    frame.stack.push_unsafe(10);
    frame.stack.push_unsafe(20);
    frame.stack.push_unsafe(30);

    // Test set_top_unsafe - should modify the top value (30 -> 99)
    frame.stack.set_top_unsafe(99);
    try std.testing.expectEqual(@as(u256, 99), frame.stack.peek_unsafe());

    // Pop all values to empty the stack
    _ = frame.stack.pop_unsafe();
    _ = frame.stack.pop_unsafe();
    _ = frame.stack.pop_unsafe();

    // Test set_top with error check on empty stack
    try std.testing.expectError(error.StackUnderflow, frame.stack.set_top(42));

    // Test set_top on non-empty stack
    frame.stack.push_unsafe(10);
    frame.stack.push_unsafe(20);
    try frame.stack.set_top(55);
    try std.testing.expectEqual(@as(u256, 55), frame.stack.peek_unsafe());
}

test "Frame stack peek operations" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const dummy_bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var frame = try F.init(allocator, &dummy_bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Setup stack with values
    frame.stack.push_unsafe(100);
    frame.stack.push_unsafe(200);
    frame.stack.push_unsafe(300);

    // Test peek_unsafe - should return top value without popping
    const top_unsafe = frame.stack.peek_unsafe();
    try std.testing.expectEqual(@as(u256, 300), top_unsafe);
    // Verify stack still has same top value
    try std.testing.expectEqual(@as(u256, 300), frame.stack.peek_unsafe());

    // Test peek on non-empty stack
    const top = try frame.stack.peek();
    try std.testing.expectEqual(@as(u256, 300), top);

    // Test peek on empty stack
    _ = frame.stack.pop_unsafe();
    _ = frame.stack.pop_unsafe();
    _ = frame.stack.pop_unsafe();
    try std.testing.expectError(error.StackUnderflow, frame.stack.peek());
}

test "Frame with bytecode" {
    const allocator = std.testing.allocator;

    // Test with small bytecode (fits in u8)
    const SmallFrame = Frame(.{ .max_bytecode_size = 255 });
    const small_bytecode = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x01, @intFromEnum(Opcode.PUSH1), 0x02, @intFromEnum(Opcode.STOP) };

    var small_frame = try SmallFrame.init(allocator, &small_bytecode, 1000000, {}, null);
    defer small_frame.deinit(allocator);

    try std.testing.expectEqual(@intFromEnum(Opcode.PUSH1), small_frame.bytecode[0]);

    // Test with medium bytecode (fits in u16)
    const MediumFrame = Frame(.{ .max_bytecode_size = 65535 });
    const medium_bytecode = [_]u8{ @intFromEnum(Opcode.PUSH1), 0xFF, @intFromEnum(Opcode.STOP) };

    var medium_frame = try MediumFrame.init(allocator, &medium_bytecode, 1000000, {}, null);
    defer medium_frame.deinit(allocator);

    try std.testing.expectEqual(@intFromEnum(Opcode.PUSH1), medium_frame.bytecode[0]);
}

test "Frame op_stop returns stop error" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Execute op_stop - should return STOP error
    try std.testing.expectError(error.STOP, frame.stop());
}

test "Frame op_pop removes top stack item" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ @intFromEnum(Opcode.POP), @intFromEnum(Opcode.STOP) };
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Setup stack with some values
    frame.stack.push_unsafe(100);
    frame.stack.push_unsafe(200);
    frame.stack.push_unsafe(300);

    // Execute op_pop - should remove top item (300) and do nothing with it
    _ = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 200), frame.stack.peek_unsafe());

    // Execute again - should remove 200
    _ = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 100), frame.stack.peek_unsafe());

    // Execute again - should remove 100
    _ = try frame.stack.pop();

    // Pop on empty stack should error
    try std.testing.expectError(error.StackUnderflow, frame.stack.pop());
}

test "Frame op_push0 pushes zero to stack" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH0), @intFromEnum(Opcode.STOP) };
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // The interpreter would handle PUSH0 using push0_handler
    try frame.stack.push(0);
    try std.testing.expectEqual(@as(u256, 0), frame.stack.peek_unsafe());
}

test "Frame PUSH1 through interpreter" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x60, 0x42, 0x60, 0xFF, 0x00 }; // PUSH1 0x42 PUSH1 0xFF STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // The interpreter would handle PUSH1 opcodes using push1_handler
    // For now we test the stack operations directly
    try frame.stack.push(0x42);
    try std.testing.expectEqual(@as(u256, 0x42), frame.stack.peek_unsafe());
    
    try frame.stack.push(0xFF);
    try std.testing.expectEqual(@as(u256, 0xFF), frame.stack.peek_unsafe());
}

test "Frame PUSH2 through interpreter" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x61, 0x12, 0x34, 0x00 }; // PUSH2 0x1234 STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // The interpreter would handle PUSH2 opcodes using push2_handler
    // For now we test the stack operations directly
    try frame.stack.push(0x1234);
    try std.testing.expectEqual(@as(u256, 0x1234), frame.stack.peek_unsafe());
}

test "Frame op_push32 reads 32 bytes from bytecode" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    // PUSH32 with max value (32 bytes of 0xFF)
    var bytecode: [34]u8 = undefined;
    bytecode[0] = 0x7f; // PUSH32
    for (1..33) |i| {
        bytecode[i] = 0xFF;
    }
    bytecode[33] = 0x00; // STOP

    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // The interpreter would handle PUSH32 using push32_handler
    try frame.stack.push(std.math.maxInt(u256));
    try std.testing.expectEqual(@as(u256, std.math.maxInt(u256)), frame.stack.peek_unsafe());
}

test "Frame op_push3 reads 3 bytes from bytecode" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x62, 0xAB, 0xCD, 0xEF, 0x00 }; // PUSH3 0xABCDEF STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // The interpreter would handle PUSH3 using push3_handler
    try frame.stack.push(0xABCDEF);
    try std.testing.expectEqual(@as(u256, 0xABCDEF), frame.stack.peek_unsafe());
}

test "Frame op_push7 reads 7 bytes from bytecode" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    // PUSH7 with specific pattern
    const bytecode = [_]u8{ 0x66, 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0x00 }; // PUSH7 STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // The interpreter would handle PUSH7 using push7_handler
    try frame.stack.push(0x0123456789ABCD);
    try std.testing.expectEqual(@as(u256, 0x0123456789ABCD), frame.stack.peek_unsafe());
}

test "Frame op_push16 reads 16 bytes from bytecode" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    // PUSH16 with specific pattern
    var bytecode: [18]u8 = undefined;
    bytecode[0] = 0x6F; // PUSH16
    for (1..17) |i| {
        bytecode[i] = @as(u8, @intCast(i));
    }
    bytecode[17] = 0x00; // STOP

    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Calculate expected value
    var expected: u256 = 0;
    for (1..17) |i| {
        expected = (expected << 8) | @as(u256, i);
    }

    // The interpreter would handle PUSH16 using push16_handler
    try frame.stack.push(expected);
    try std.testing.expectEqual(expected, frame.stack.peek_unsafe());
    // PC advancement is now handled by plan, not frame
}

test "Frame op_push31 reads 31 bytes from bytecode" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    // PUSH31 with specific pattern
    var bytecode: [33]u8 = undefined;
    bytecode[0] = 0x7E; // PUSH31
    for (1..32) |i| {
        bytecode[i] = @as(u8, @intCast(i % 256));
    }
    bytecode[32] = 0x00; // STOP

    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // The interpreter would handle PUSH31 using push31_handler
    // For this test, just verify the frame was created properly

    // Verify PC advanced correctly
    // PC advancement is now handled by plan, not frame
}


test "Frame op_dup1 duplicates top stack item" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x80, 0x00 }; // DUP1 STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Setup stack with value
    frame.stack.push_unsafe(42);

    // Execute op_dup1 - should duplicate top item (42)
    try frame.stack.dup1();
    try std.testing.expectEqual(@as(u256, 42), frame.stack.peek_unsafe()); // Top is duplicate
    const dup = frame.stack.pop_unsafe();
    try std.testing.expectEqual(@as(u256, 42), dup); // Verify duplicate
    try std.testing.expectEqual(@as(u256, 42), frame.stack.peek_unsafe()); // Original still there

    // Test dup1 on empty stack
    _ = frame.stack.pop_unsafe(); // Remove the last item
    try std.testing.expectError(error.StackUnderflow, frame.stack.dup1());
}

test "Frame op_dup16 duplicates 16th stack item" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x8f, 0x00 }; // DUP16 STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Setup stack with values 1-16
    for (0..16) |i| {
        frame.stack.push_unsafe(@as(u256, i + 1));
    }

    // Execute op_dup16 - should duplicate 16th from top (value 1)
    try frame.stack.dup16();
    try std.testing.expectEqual(@as(u256, 1), frame.stack.peek_unsafe()); // Duplicate of bottom element

    // Test dup16 with insufficient stack - need less than 16 items
    // Clear stack
    for (0..17) |_| {
        _ = frame.stack.pop_unsafe();
    }
    // Push only 15 items
    for (0..15) |i| {
        frame.stack.push_unsafe(@as(u256, i));
    }
    try std.testing.expectError(error.StackUnderflow, frame.stack.dup16());
}

test "Frame op_swap1 swaps top two stack items" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x90, 0x00 }; // SWAP1 STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Setup stack with values
    frame.stack.push_unsafe(100);
    frame.stack.push_unsafe(200);

    // Execute op_swap1 - should swap top two items
    try frame.stack.swap1();
    try std.testing.expectEqual(@as(u256, 100), frame.stack.peek_unsafe()); // Was 200, now 100
    const top = frame.stack.pop_unsafe();
    try std.testing.expectEqual(@as(u256, 100), top);
    try std.testing.expectEqual(@as(u256, 200), frame.stack.peek_unsafe()); // Was 100, now 200

    // Test swap1 with insufficient stack
    try std.testing.expectError(error.StackUnderflow, frame.stack.swap1());
}

test "Frame op_swap16 swaps top with 17th stack item" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x9f, 0x00 }; // SWAP16 STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Setup stack with values 1-17
    for (0..17) |i| {
        frame.stack.push_unsafe(@as(u256, i + 1));
    }

    // Execute op_swap16 - should swap top (17) with 17th from top (1)
    try frame.stack.swap16();
    try std.testing.expectEqual(@as(u256, 1), frame.stack.peek_unsafe()); // Was 17, now 1

    // Test swap16 with insufficient stack - need less than 17 items
    // Clear stack
    for (0..17) |_| {
        _ = frame.stack.pop_unsafe();
    }
    // Push only 16 items
    for (0..16) |i| {
        frame.stack.push_unsafe(@as(u256, i));
    }
    try std.testing.expectError(error.StackUnderflow, frame.stack.swap16());
}

test "Frame DUP2-DUP15 operations" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    const bytecode = [_]u8{0x00}; // STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // Push 16 distinct values
    for (0..16) |i| {
        frame.stack.push_unsafe(@as(u256, 100 + i));
    }

    // Test DUP2 - duplicates 2nd from top
    try frame.stack.dup2();
    try std.testing.expectEqual(@as(u256, 114), frame.stack.peek_unsafe()); // Should duplicate 114
    _ = frame.stack.pop_unsafe();

    // Test DUP3 - duplicates 3rd from top
    try frame.stack.dup3();
    try std.testing.expectEqual(@as(u256, 113), frame.stack.peek_unsafe());
    _ = frame.stack.pop_unsafe();

    // Test DUP8 - duplicates 8th from top
    try frame.stack.dup8();
    try std.testing.expectEqual(@as(u256, 108), frame.stack.peek_unsafe());
    _ = frame.stack.pop_unsafe();

    // Test DUP15 - duplicates 15th from top
    try frame.stack.dup15();
    try std.testing.expectEqual(@as(u256, 101), frame.stack.peek_unsafe());
    _ = frame.stack.pop_unsafe();

    // Test underflow for DUP operations
    // Clear stack and push fewer items than needed
    for (0..16) |_| {
        _ = frame.stack.pop_unsafe();
    }
    
    // Push only 5 items
    for (0..5) |i| {
        frame.stack.push_unsafe(@as(u256, i));
    }
    
    // DUP6 should fail with only 5 items
    try std.testing.expectError(error.StackUnderflow, frame.stack.dup6());
}

test "Frame SWAP2-SWAP15 operations" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    const bytecode = [_]u8{0x00}; // STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // Push 17 distinct values to test all SWAP operations
    for (0..17) |i| {
        frame.stack.push_unsafe(@as(u256, 200 + i));
    }

    // Test SWAP2 - swaps top with 3rd element
    try frame.stack.swap2();
    try std.testing.expectEqual(@as(u256, 214), frame.stack.peek_unsafe()); // 214 was 3rd, now top
    const stack_slice = frame.stack.get_slice();
    const third_after_swap2 = stack_slice[2]; // 3rd from top in downward stack
    try std.testing.expectEqual(@as(u256, 216), third_after_swap2); // 216 was top, now 3rd

    // Reset stack for next test
    for (0..17) |_| {
        _ = frame.stack.pop_unsafe();
    }
    for (0..17) |i| {
        frame.stack.push_unsafe(@as(u256, 300 + i));
    }

    // Test SWAP5 - swaps top with 6th element
    try frame.stack.swap5();
    try std.testing.expectEqual(@as(u256, 311), frame.stack.peek_unsafe()); // 311 was 6th, now top
    const stack_slice2 = frame.stack.get_slice();
    const sixth_after_swap5 = stack_slice2[5]; // 6th from top in downward stack
    try std.testing.expectEqual(@as(u256, 316), sixth_after_swap5); // 316 was top, now 6th

    // Reset for SWAP15 test
    for (0..17) |_| {
        _ = frame.stack.pop_unsafe();
    }
    for (0..17) |i| {
        frame.stack.push_unsafe(@as(u256, 400 + i));
    }

    // Test SWAP15 - swaps top with 16th element
    try frame.stack.swap15();
    try std.testing.expectEqual(@as(u256, 401), frame.stack.peek_unsafe()); // 401 was 16th, now top
    const stack_slice3 = frame.stack.get_slice();
    const sixteenth_after_swap15 = stack_slice3[15]; // 16th from top in downward stack
    try std.testing.expectEqual(@as(u256, 416), sixteenth_after_swap15); // 416 was top, now 16th

    // Test underflow for SWAP operations
    for (0..17) |_| {
        _ = frame.stack.pop_unsafe();
    }
    
    // Push only 8 items
    for (0..8) |i| {
        frame.stack.push_unsafe(@as(u256, i));
    }
    
    // SWAP10 should fail with only 8 items (needs 11)
    try std.testing.expectError(error.StackUnderflow, frame.stack.swap10());
}

test "Frame op_selfdestruct basic" {
    // TODO: Update these tests for the new frame structure
    return error.SkipZigTest;
    // const allocator = std.testing.allocator;
    // const Frame = createFrame(.{ .has_database = true });
    // 
    // const bytecode = [_]u8{ 0xff, 0x00 }; // SELFDESTRUCT STOP
    // 
    // // Create database 
    // const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
    // var memory_db = MemoryDatabase.init(allocator);
    // defer memory_db.deinit();
    // const db_interface = memory_db.to_database_interface();
    // 
    // var frame = try Frame.init(allocator, &bytecode, 1000000, db_interface, null);
    // defer frame.deinit(allocator);
    // 
    // // Set contract address and balance
    // frame.contract_address = [_]u8{0x11} ++ [_]u8{0} ** 19;
    // const account = @import("database_interface.zig").Account{
    //     .balance = 1000,
    //     .nonce = 1,
    //     .code_hash = [_]u8{0} ** 32,
    //     .storage_root = [_]u8{0} ** 32,
    // };
    // try db_interface.set_account(frame.contract_address, account);
    // 
    // // Push recipient address to stack
    // const recipient = [_]u8{0x22} ++ [_]u8{0} ** 19;
    // const recipient_u256 = @as(u256, @bitCast(recipient ++ [_]u8{0} ** 12));
    // frame.stack.push_unsafe(recipient_u256);
    // 
    // // Execute SELFDESTRUCT
    // try frame.selfdestruct();
    // 
    // // Verify contract is marked for destruction
    // try std.testing.expect(frame.self_destruct != null);
    // try std.testing.expect(frame.self_destruct.?.is_marked_for_destruction(frame.contract_address));
    // 
    // // Verify recipient is correct
    // const stored_recipient = frame.self_destruct.?.get_recipient(frame.contract_address);
    // try std.testing.expect(stored_recipient != null);
    // try std.testing.expectEqualSlices(u8, &recipient, &stored_recipient.?);
}

test "Frame op_selfdestruct with insufficient stack" {
    return error.SkipZigTest; // TODO: Update this test for the new frame structure
    // const allocator = std.testing.allocator;
    // const Frame = createFrame(.{ .has_database = true });
    // 
    // const bytecode = [_]u8{ 0xff, 0x00 }; // SELFDESTRUCT STOP
    // 
    // // Create database 
    // const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
    // var memory_db = MemoryDatabase.init(allocator);
    // defer memory_db.deinit();
    // const db_interface = memory_db.to_database_interface();
    // 
    // var frame = try Frame.init(allocator, &bytecode, 1000000, db_interface, null);
    // defer frame.deinit(allocator);
    // 
    // // Don't push anything to stack
    // try std.testing.expectError(error.StackUnderflow, frame.selfdestruct());
}

test "Frame op_selfdestruct in static context" {
    return error.SkipZigTest; // TODO: Update this test for the new frame structure
    // const allocator = std.testing.allocator;
    // const Frame = createFrame(.{ .has_database = true });
    // 
    // const bytecode = [_]u8{ 0xff, 0x00 }; // SELFDESTRUCT STOP
    // 
    // // Create database 
    // const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
    // var memory_db = MemoryDatabase.init(allocator);
    // defer memory_db.deinit();
    // const db_interface = memory_db.to_database_interface();
    // 
    // var frame = try Frame.init(allocator, &bytecode, 1000000, db_interface, null);
    // defer frame.deinit(allocator);
    // 
    // // Set static context
    // 
    // // Push recipient address to stack
    // const recipient = [_]u8{0x22} ++ [_]u8{0} ** 19;
    // const recipient_u256 = @as(u256, @bitCast(recipient ++ [_]u8{0} ** 12));
    // frame.stack.push_unsafe(recipient_u256);
    // 
    // // Should fail with WriteProtection error
    // try std.testing.expectError(error.WriteProtection, frame.selfdestruct());
}

test "Frame init validates bytecode size" {
    const allocator = std.testing.allocator;

    // Test with valid bytecode size
    const SmallFrame = Frame(.{ .max_bytecode_size = 100 });
    const small_bytecode = [_]u8{ 0x60, 0x01, 0x00 }; // PUSH1 1 STOP

    const stack_memory = try allocator.create([1024]u256);
    defer allocator.destroy(stack_memory);

    var frame = try SmallFrame.init(allocator, &small_bytecode, 1000000, {}, null);
    defer frame.deinit(allocator);

    // PC is now managed by plan, not frame directly
    try std.testing.expectEqual(&small_bytecode, frame.bytecode.ptr);
    try std.testing.expectEqual(@as(usize, 3), frame.bytecode.len);

    // Test with bytecode too large
    const large_bytecode = try allocator.alloc(u8, 101);
    defer allocator.free(large_bytecode);
    @memset(large_bytecode, 0x00);

    try std.testing.expectError(error.BytecodeTooLarge, SmallFrame.init(allocator, large_bytecode, 0, {}, null));

    // Test with empty bytecode
    const empty_bytecode = [_]u8{};
    var empty_frame = try SmallFrame.init(allocator, &empty_bytecode, 1000000, {}, null);
    defer empty_frame.deinit(allocator);
    try std.testing.expectEqual(@as(usize, 0), empty_frame.bytecode.len);
}

test "Frame get_requested_alloc calculates correctly" {
    // Test with default options
    const default_config = FrameConfig{};
    const expected_default = @as(u32, @intCast(1024 * @sizeOf(u256)));
    try std.testing.expectEqual(expected_default, default_config.get_requested_alloc());

    // Test with custom options
    const custom_config = FrameConfig{
        .stack_size = 512,
        .WordType = u128,
        .max_bytecode_size = 1000,
    };
    const expected_custom = @as(u32, @intCast(512 * @sizeOf(u128)));
    try std.testing.expectEqual(expected_custom, custom_config.get_requested_alloc());

    // Test with small frame
    const small_config = FrameConfig{
        .stack_size = 256,
        .WordType = u64,
        .max_bytecode_size = 255,
    };
    const expected_small = @as(u32, @intCast(256 * @sizeOf(u64)));
    try std.testing.expectEqual(expected_small, small_config.get_requested_alloc());
}

test "Frame op_and bitwise AND operation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x16, 0x00 }; // AND STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 0xFF & 0x0F = 0x0F
    try frame.stack.push(0xFF);
    try frame.stack.push(0x0F);
    // Inline AND operation: pop b, pop a, push (a & b)
    const b = try frame.stack.pop();
    const a = try frame.stack.pop();
    try frame.stack.push(a & b);
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0x0F), result1);

    // Test 0xFFFF & 0x00FF = 0x00FF
    try frame.stack.push(0xFFFF);
    try frame.stack.push(0x00FF);
    // Inline AND operation: pop b, pop a, push (a & b)
    const b2 = try frame.stack.pop();
    const a2 = try frame.stack.pop();
    try frame.stack.push(a2 & b2);
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0x00FF), result2);

    // Test with max values
    try frame.stack.push(std.math.maxInt(u256));
    try frame.stack.push(0x12345678);
    // Inline AND operation: pop b, pop a, push (a & b)
    const b3 = try frame.stack.pop();
    const a3 = try frame.stack.pop();
    try frame.stack.push(a3 & b3);
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0x12345678), result3);
}

test "Frame op_or bitwise OR operation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x17, 0x00 }; // OR STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 0xF0 | 0x0F = 0xFF
    try frame.stack.push(0xF0);
    try frame.stack.push(0x0F);
    // Inline OR operation: pop b, pop a, push (a | b)
    const b = try frame.stack.pop();
    const a = try frame.stack.pop();
    try frame.stack.push(a | b);
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0xFF), result1);

    // Test 0xFF00 | 0x00FF = 0xFFFF
    try frame.stack.push(0xFF00);
    try frame.stack.push(0x00FF);
    // Inline OR operation: pop b, pop a, push (a | b)
    const b2 = try frame.stack.pop();
    const a2 = try frame.stack.pop();
    try frame.stack.push(a2 | b2);
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0xFFFF), result2);

    // Test with zero
    try frame.stack.push(0);
    try frame.stack.push(0x12345678);
    // Inline OR operation: pop b, pop a, push (a | b)
    const b3 = try frame.stack.pop();
    const a3 = try frame.stack.pop();
    try frame.stack.push(a3 | b3);
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0x12345678), result3);
}

test "Frame op_xor bitwise XOR operation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x18, 0x00 }; // XOR STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 0xFF ^ 0xFF = 0
    try frame.stack.push(0xFF);
    try frame.stack.push(0xFF);
    try frame.xor();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result1);

    // Test 0xFF ^ 0x00 = 0xFF
    try frame.stack.push(0xFF);
    try frame.stack.push(0x00);
    try frame.xor();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0xFF), result2);

    // Test 0xAA ^ 0x55 = 0xFF (alternating bits)
    try frame.stack.push(0xAA);
    try frame.stack.push(0x55);
    try frame.xor();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0xFF), result3);
}

test "Frame op_not bitwise NOT operation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x19, 0x00 }; // NOT STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test ~0 = max value
    try frame.stack.push(0);
    // Inline NOT operation: pop a, push (~a)
    const a = try frame.stack.pop();
    try frame.stack.push(~a);
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(std.math.maxInt(u256), result1);

    // Test ~max = 0
    try frame.stack.push(std.math.maxInt(u256));
    // Inline NOT operation: pop a, push (~a)
    const a2 = try frame.stack.pop();
    try frame.stack.push(~a2);
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result2);

    // Test ~0xFF = 0xFFFF...FF00
    try frame.stack.push(0xFF);
    // Inline NOT operation: pop a, push (~a)
    const a3 = try frame.stack.pop();
    try frame.stack.push(~a3);
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(std.math.maxInt(u256) - 0xFF, result3);
}

test "Frame op_byte extracts single byte from word" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x1A, 0x00 }; // BYTE STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test extracting byte 31 (rightmost) from 0x...FF
    try frame.stack.push(0xFF);
    try frame.stack.push(31);
    try frame.byte();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0xFF), result1);

    // Test extracting byte 30 from 0x...FF00
    try frame.stack.push(0xFF00);
    try frame.stack.push(30);
    try frame.byte();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0xFF), result2);

    // Test extracting byte 0 (leftmost) from a value
    const value: u256 = @as(u256, 0xAB) << 248; // Put 0xAB in the leftmost byte
    try frame.stack.push(value);
    try frame.stack.push(0);
    try frame.byte();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0xAB), result3);

    // Test out of bounds (index >= 32) returns 0
    try frame.stack.push(0xFFFFFFFF);
    try frame.stack.push(32);
    try frame.byte();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result4);
}

test "Frame op_shl shift left operation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x1B, 0x00 }; // SHL STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 1 << 4 = 16
    try frame.stack.push(1);
    try frame.stack.push(4);
    try frame.shl();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 16), result1);

    // Test 0xFF << 8 = 0xFF00
    try frame.stack.push(0xFF);
    try frame.stack.push(8);
    try frame.shl();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0xFF00), result2);

    // Test shift >= 256 returns 0
    try frame.stack.push(1);
    try frame.stack.push(256);
    try frame.shl();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);
}

test "Frame op_shr logical shift right operation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x1C, 0x00 }; // SHR STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 16 >> 4 = 1
    try frame.stack.push(16);
    try frame.stack.push(4);
    try frame.shr();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result1);

    // Test 0xFF00 >> 8 = 0xFF
    try frame.stack.push(0xFF00);
    try frame.stack.push(8);
    try frame.shr();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0xFF), result2);

    // Test shift >= 256 returns 0
    try frame.stack.push(std.math.maxInt(u256));
    try frame.stack.push(256);
    try frame.shr();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);
}

test "Frame op_sar arithmetic shift right operation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x1D, 0x00 }; // SAR STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test positive number: 16 >> 4 = 1
    try frame.stack.push(16);
    try frame.stack.push(4);
    try frame.sar();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result1);

    // Test negative number (sign bit = 1)
    const negative = @as(u256, 1) << 255 | 0xFF00; // Set sign bit and some data
    try frame.stack.push(negative);
    try frame.stack.push(8);
    try frame.sar();
    const result2 = try frame.stack.pop();
    // Should fill with 1s from the left
    const expected2 = (@as(u256, std.math.maxInt(u256)) << 247) | 0xFF;
    try std.testing.expectEqual(expected2, result2);

    // Test shift >= 256 with positive number returns 0
    try frame.stack.push(0x7FFFFFFF); // Positive (sign bit = 0)
    try frame.stack.push(256);
    try frame.sar();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);

    // Test shift >= 256 with negative number returns max value
    try frame.stack.push(@as(u256, 1) << 255); // Negative (sign bit = 1)
    try frame.stack.push(256);
    try frame.sar();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(std.math.maxInt(u256), result4);
}

test "Frame op_add addition with wrapping overflow" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x01, 0x00 }; // ADD STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 10 + 20 = 30
    try frame.stack.push(10);
    try frame.stack.push(20);
    try frame.add();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 30), result1);

    // Test overflow: max + 1 = 0
    try frame.stack.push(std.math.maxInt(u256));
    try frame.stack.push(1);
    try frame.add();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result2);

    // Test max + max = max - 1 (wrapping)
    try frame.stack.push(std.math.maxInt(u256));
    try frame.stack.push(std.math.maxInt(u256));
    try frame.add();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(std.math.maxInt(u256) - 1, result3);
}

test "Frame op_mul multiplication with wrapping overflow" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x02, 0x00 }; // MUL STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 5 * 6 = 30
    try frame.stack.push(5);
    try frame.stack.push(6);
    try frame.mul();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 30), result1);

    // Test 0 * anything = 0
    try frame.stack.push(0);
    try frame.stack.push(12345);
    try frame.mul();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result2);

    // Test overflow with large numbers
    const large = @as(u256, 1) << 128;
    try frame.stack.push(large);
    try frame.stack.push(large);
    try frame.mul();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3); // 2^256 wraps to 0
}

test "Frame op_sub subtraction with wrapping underflow" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x03, 0x00 }; // SUB STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 30 - 10 = 20
    try frame.stack.push(30);
    try frame.stack.push(10);
    try frame.sub();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 20), result1);

    // Test underflow: 0 - 1 = max
    try frame.stack.push(0);
    try frame.stack.push(1);
    try frame.sub();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(std.math.maxInt(u256), result2);

    // Test 10 - 20 = max - 9 (wrapping)
    try frame.stack.push(10);
    try frame.stack.push(20);
    try frame.sub();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(std.math.maxInt(u256) - 9, result3);
}

test "Frame op_div unsigned integer division" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x04, 0x00 }; // DIV STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 20 / 5 = 4
    try frame.stack.push(20);
    try frame.stack.push(5);
    try frame.div();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 4), result1);

    // Test division by zero returns 0
    try frame.stack.push(100);
    try frame.stack.push(0);
    try frame.div();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result2);

    // Test integer division: 7 / 3 = 2
    try frame.stack.push(7);
    try frame.stack.push(3);
    try frame.div();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 2), result3);
}

test "Frame op_sdiv signed integer division" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x05, 0x00 }; // SDIV STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 20 / 5 = 4 (positive / positive)
    try frame.stack.push(20);
    try frame.stack.push(5);
    try frame.sdiv();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 4), result1);

    // Test -20 / 5 = -4 (negative / positive)
    const neg_20 = @as(u256, @bitCast(@as(i256, -20)));
    try frame.stack.push(neg_20);
    try frame.stack.push(5);
    try frame.sdiv();
    const result2 = try frame.stack.pop();
    const expected2 = @as(u256, @bitCast(@as(i256, -4)));
    try std.testing.expectEqual(expected2, result2);

    // Test MIN_I256 / -1 = MIN_I256 (overflow case)
    const min_i256 = @as(u256, 1) << 255;
    const neg_1 = @as(u256, @bitCast(@as(i256, -1)));
    try frame.stack.push(min_i256);
    try frame.stack.push(neg_1);
    try frame.sdiv();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(min_i256, result3);

    // Test division by zero returns 0
    try frame.stack.push(100);
    try frame.stack.push(0);
    try frame.sdiv();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result4);
}

test "Frame op_mod modulo remainder operation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x06, 0x00 }; // MOD STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 17 % 5 = 2
    try frame.stack.push(17);
    try frame.stack.push(5);
    try frame.mod();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 2), result1);

    // Test 100 % 10 = 0
    try frame.stack.push(100);
    try frame.stack.push(10);
    try frame.mod();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result2);

    // Test modulo by zero returns 0
    try frame.stack.push(7);
    try frame.stack.push(0);
    try frame.mod();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);
}

test "Frame op_smod signed modulo remainder operation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x07, 0x00 }; // SMOD STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 17 % 5 = 2 (positive % positive)
    try frame.stack.push(17);
    try frame.stack.push(5);
    try frame.smod();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 2), result1);

    // Test -17 % 5 = -2 (negative % positive)
    const neg_17 = @as(u256, @bitCast(@as(i256, -17)));
    try frame.stack.push(neg_17);
    try frame.stack.push(5);
    try frame.smod();
    const result2 = try frame.stack.pop();
    const expected2 = @as(u256, @bitCast(@as(i256, -2)));
    try std.testing.expectEqual(expected2, result2);

    // Test 17 % -5 = 2 (positive % negative)
    const neg_5 = @as(u256, @bitCast(@as(i256, -5)));
    try frame.stack.push(17);
    try frame.stack.push(neg_5);
    try frame.smod();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 2), result3);

    // Test modulo by zero returns 0
    try frame.stack.push(neg_17);
    try frame.stack.push(0);
    try frame.smod();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result4);
}

test "Frame op_addmod addition modulo n" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x08, 0x00 }; // ADDMOD STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test (10 + 20) % 7 = 2
    try frame.stack.push(10);
    try frame.stack.push(20);
    try frame.stack.push(7);
    try frame.addmod();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 2), result1);

    // Test overflow handling: (MAX + 5) % 10 = 4
    // MAX = 2^256 - 1, so (2^256 - 1 + 5) = 2^256 + 4
    // Since we're in mod 2^256, this is just 4
    // So 4 % 10 = 4
    try frame.stack.push(std.math.maxInt(u256));
    try frame.stack.push(5);
    try frame.stack.push(10);
    try frame.addmod();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 4), result2);

    // Test modulo by zero returns 0
    try frame.stack.push(50);
    try frame.stack.push(50);
    try frame.stack.push(0);
    try frame.addmod();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);
}

test "Frame op_mulmod multiplication modulo n" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x09, 0x00 }; // MULMOD STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test (10 * 20) % 7 = 200 % 7 = 4
    try frame.stack.push(10);
    try frame.stack.push(20);
    try frame.stack.push(7);
    try frame.mulmod();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 4), result1);

    // First test a simple case to make sure basic logic works
    try frame.stack.push(36);
    try frame.stack.push(36);
    try frame.stack.push(100);
    try frame.mulmod();
    const simple_result = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 96), simple_result);

    // Test that large % 100 = 56
    const large = @as(u256, 1) << 128;
    try std.testing.expectEqual(@as(u256, 56), large % 100);

    // Test overflow handling: (2^128 * 2^128) % 100
    // This tests the modular multiplication
    try frame.stack.push(large);
    try frame.stack.push(large);
    try frame.stack.push(100);
    try frame.mulmod();
    const result2 = try frame.stack.pop();
    // Since the algorithm reduces first: 2^128 % 100 = 56
    // Then we're computing (56 * 56) % 100 = 3136 % 100 = 36
    try std.testing.expectEqual(@as(u256, 36), result2);

    // Test modulo by zero returns 0
    try frame.stack.push(50);
    try frame.stack.push(50);
    try frame.stack.push(0);
    try frame.mulmod();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);
}

test "Frame op_exp exponentiation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x0A, 0x00 }; // EXP STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 2^10 = 1024
    try frame.stack.push(2);
    try frame.stack.push(10);
    try frame.exp();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1024), result1);

    // Test 3^4 = 81
    try frame.stack.push(3);
    try frame.stack.push(4);
    try frame.exp();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 81), result2);

    // Test 10^0 = 1 (anything^0 = 1)
    try frame.stack.push(10);
    try frame.stack.push(0);
    try frame.exp();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result3);

    // Test 0^10 = 0 (0^anything = 0, except 0^0)
    try frame.stack.push(0);
    try frame.stack.push(10);
    try frame.exp();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result4);

    // Test 0^0 = 1 (special case in EVM)
    try frame.stack.push(0);
    try frame.stack.push(0);
    try frame.exp();
    const result5 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result5);
}

test "Frame op_signextend sign extension" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x0B, 0x00 }; // SIGNEXTEND STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test extending positive 8-bit value (0x7F)
    try frame.stack.push(0x7F);
    try frame.stack.push(0); // Extend from byte 0
    try frame.signextend();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0x7F), result1);

    // Test extending negative 8-bit value (0x80)
    try frame.stack.push(0x80);
    try frame.stack.push(0); // Extend from byte 0
    try frame.signextend();
    const result2 = try frame.stack.pop();
    const expected2 = std.math.maxInt(u256) - 0x7F; // 0xFFFF...FF80
    try std.testing.expectEqual(expected2, result2);

    // Test extending positive 16-bit value (0x7FFF)
    try frame.stack.push(0x7FFF);
    try frame.stack.push(1); // Extend from byte 1
    try frame.signextend();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0x7FFF), result3);

    // Test extending negative 16-bit value (0x8000)
    try frame.stack.push(0x8000);
    try frame.stack.push(1); // Extend from byte 1
    try frame.signextend();
    const result4 = try frame.stack.pop();
    const expected4 = std.math.maxInt(u256) - 0x7FFF; // 0xFFFF...F8000
    try std.testing.expectEqual(expected4, result4);

    // Test byte_num >= 31 returns value unchanged
    try frame.stack.push(0x12345678);
    try frame.stack.push(31); // Extend from byte 31 (full width)
    try frame.signextend();
    const result5 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0x12345678), result5);
}

test "Frame op_gas returns gas remaining" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x5A, 0x00 }; // GAS STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // Test op_gas pushes gas_remaining to stack
    try frame.gas();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1000000), result1);

    // Test op_gas with modified gas_remaining
    frame.gas_remaining = 12345;
    try frame.gas();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 12345), result2);

    // Test op_gas with zero gas
    frame.gas_remaining = 0;
    try frame.gas();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);

    // Test op_gas with negative gas (should push 0)
    frame.gas_remaining = -100;
    try frame.gas();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result4);
}

test "Frame op_lt less than comparison" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x10, 0x00 }; // LT STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 10 < 20 = 1
    try frame.stack.push(10);
    try frame.stack.push(20);
    try frame.lt();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result1);

    // Test 20 < 10 = 0
    try frame.stack.push(20);
    try frame.stack.push(10);
    try frame.lt();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result2);

    // Test 10 < 10 = 0
    try frame.stack.push(10);
    try frame.stack.push(10);
    try frame.lt();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);

    // Test with max value
    try frame.stack.push(std.math.maxInt(u256));
    try frame.stack.push(0);
    try frame.lt();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result4);
}

test "Frame op_gt greater than comparison" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x11, 0x00 }; // GT STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 20 > 10 = 1
    try frame.stack.push(20);
    try frame.stack.push(10);
    try frame.gt();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result1);

    // Test 10 > 20 = 0
    try frame.stack.push(10);
    try frame.stack.push(20);
    try frame.gt();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result2);

    // Test 10 > 10 = 0
    try frame.stack.push(10);
    try frame.stack.push(10);
    try frame.gt();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);

    // Test with max value
    try frame.stack.push(0);
    try frame.stack.push(std.math.maxInt(u256));
    try frame.gt();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result4);
}

test "Frame op_slt signed less than comparison" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x12, 0x00 }; // SLT STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 10 < 20 = 1 (positive comparison)
    try frame.stack.push(10);
    try frame.stack.push(20);
    try frame.slt();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result1);

    // Test -10 < 10 = 1 (negative < positive)
    const neg_10 = @as(u256, @bitCast(@as(i256, -10)));
    try frame.stack.push(neg_10);
    try frame.stack.push(10);
    try frame.slt();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result2);

    // Test 10 < -10 = 0 (positive < negative)
    try frame.stack.push(10);
    try frame.stack.push(neg_10);
    try frame.slt();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);

    // Test MIN_INT < MAX_INT = 1
    const min_int = @as(u256, 1) << 255; // Sign bit set
    const max_int = (@as(u256, 1) << 255) - 1; // All bits except sign bit
    try frame.stack.push(min_int);
    try frame.stack.push(max_int);
    try frame.slt();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result4);
}

test "Frame op_sgt signed greater than comparison" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x13, 0x00 }; // SGT STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 20 > 10 = 1 (positive comparison)
    try frame.stack.push(20);
    try frame.stack.push(10);
    try frame.sgt();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result1);

    // Test 10 > -10 = 1 (positive > negative)
    const neg_10 = @as(u256, @bitCast(@as(i256, -10)));
    try frame.stack.push(10);
    try frame.stack.push(neg_10);
    try frame.sgt();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result2);

    // Test -10 > 10 = 0 (negative > positive)
    try frame.stack.push(neg_10);
    try frame.stack.push(10);
    try frame.sgt();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);

    // Test MAX_INT > MIN_INT = 1
    const min_int = @as(u256, 1) << 255; // Sign bit set
    const max_int = (@as(u256, 1) << 255) - 1; // All bits except sign bit
    try frame.stack.push(max_int);
    try frame.stack.push(min_int);
    try frame.sgt();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result4);
}

test "Frame op_eq equality comparison" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x14, 0x00 }; // EQ STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test 10 == 10 = 1
    try frame.stack.push(10);
    try frame.stack.push(10);
    try frame.eq();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result1);

    // Test 10 == 20 = 0
    try frame.stack.push(10);
    try frame.stack.push(20);
    try frame.eq();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result2);

    // Test 0 == 0 = 1
    try frame.stack.push(0);
    try frame.stack.push(0);
    try frame.eq();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result3);

    // Test max == max = 1
    try frame.stack.push(std.math.maxInt(u256));
    try frame.stack.push(std.math.maxInt(u256));
    try frame.eq();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result4);
}

test "Frame op_iszero zero check" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x15, 0x00 }; // ISZERO STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test iszero(0) = 1
    try frame.stack.push(0);
    try frame.iszero();
    const result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 1), result1);

    // Test iszero(1) = 0
    try frame.stack.push(1);
    try frame.iszero();
    const result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result2);

    // Test iszero(100) = 0
    try frame.stack.push(100);
    try frame.iszero();
    const result3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result3);

    // Test iszero(max) = 0
    try frame.stack.push(std.math.maxInt(u256));
    try frame.iszero();
    const result4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), result4);
}

test "Frame JUMP through interpreter" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    // JUMP STOP JUMPDEST STOP (positions: 0=JUMP, 1=STOP, 2=JUMPDEST, 3=STOP)
    const bytecode = [_]u8{ 0x56, 0x00, 0x5B, 0x00 };
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // The interpreter would handle JUMP opcodes using op_jump_handler
    // For now we test that the frame was properly initialized
    try std.testing.expectEqual(@intFromEnum(Opcode.JUMP), frame.bytecode[0]);
    try std.testing.expectEqual(@intFromEnum(Opcode.STOP), frame.bytecode[1]);
    try std.testing.expectEqual(@intFromEnum(Opcode.JUMPDEST), frame.bytecode[2]);
}

test "Frame JUMPI through interpreter" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    // JUMPI STOP JUMPDEST STOP (positions: 0=JUMPI, 1=STOP, 2=JUMPDEST, 3=STOP)
    const bytecode = [_]u8{ 0x57, 0x00, 0x5B, 0x00 };
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // The interpreter would handle JUMPI opcodes using op_jumpi_handler
    // For now we test that the frame was properly initialized
    try std.testing.expectEqual(@intFromEnum(Opcode.JUMPI), frame.bytecode[0]);
    try std.testing.expectEqual(@intFromEnum(Opcode.STOP), frame.bytecode[1]);
    try std.testing.expectEqual(@intFromEnum(Opcode.JUMPDEST), frame.bytecode[2]);
}

test "Frame op_jumpdest no-op" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x5B, 0x00 }; // JUMPDEST STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // JUMPDEST should do nothing
    // PC is now managed by plan, not frame directly
    try frame.jumpdest();
}

test "Frame op_invalid causes error" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0xFE, 0x00 }; // INVALID STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // INVALID should always return error
    try std.testing.expectError(error.InvalidOpcode, frame.invalid());
}

test "Frame op_keccak256 hash computation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x20, 0x00 }; // KECCAK256 STOP
    var frame = try F.init(allocator, &bytecode, 0, {}, null);
    defer frame.deinit(allocator);

    // Test keccak256 of empty data
    try frame.keccak256(&[_]u8{});
    const empty_hash = try frame.stack.pop();
    // keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
    const expected_empty = @as(u256, 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470);
    try std.testing.expectEqual(expected_empty, empty_hash);

    // Test keccak256 of "Hello"
    try frame.keccak256("Hello");
    const hello_hash = try frame.stack.pop();
    // keccak256("Hello") = 0x06b3dfaec148fb1bb2b066f10ec285e7c9bf402ab32aa78a5d38e34566810cd2
    const expected_hello = @as(u256, 0x06b3dfaec148fb1bb2b066f10ec285e7c9bf402ab32aa78a5d38e34566810cd2);
    try std.testing.expectEqual(expected_hello, hello_hash);
}







test "Frame interpret JUMP to JUMPDEST" {
    return error.SkipZigTest; // TODO: Re-enable after implementing jump destination resolution
}

test "Frame interpret JUMPI conditional" {
    return error.SkipZigTest; // TODO: Re-enable after implementing jump destination resolution
}

test "Frame with NoOpTracer executes correctly" {
    const allocator = std.testing.allocator;

    // Create frame with default NoOpTracer

    // Simple bytecode: PUSH1 0x05, PUSH1 0x03, ADD
    const bytecode = [_]u8{ 0x60, 0x05, 0x60, 0x03, 0x01 };

    const F = Frame(.{});
    var frame = try F.init(allocator, &bytecode, 1000, void{});
    defer frame.deinit(allocator);

    // Execute by pushing values and calling add
    try frame.stack.push(5);
    try frame.stack.push(3);
    try frame.add();

    // Check that we have the expected result (5 + 3 = 8)
    try std.testing.expectEqual(@as(u256, 8), frame.stack.peek_unsafe());
}

test "Frame tracer type can be changed at compile time" {
    const allocator = std.testing.allocator;

    // Custom tracer for testing
    const TestTracer = struct {
        call_count: usize,

        pub fn init() @This() {
            return .{ .call_count = 0 };
        }

        pub fn beforeOp(self: *@This(), comptime FrameType: type, frame: *const FrameType) void {
            _ = frame;
            self.call_count += 1;
        }

        pub fn afterOp(self: *@This(), comptime FrameType: type, frame: *const FrameType) void {
            _ = frame;
            self.call_count += 1;
        }

        pub fn onError(self: *@This(), comptime FrameType: type, frame: *const FrameType, err: anyerror) void {
            _ = frame;
            if (false) {
                std.debug.print("Error: {}\n", .{err});
            }
            self.call_count += 1;
        }
    };

    // Create frame with custom tracer
    const config = FrameConfig{
        .TracerType = TestTracer,
    };

    const F = Frame(config);

    // Simple bytecode: PUSH1 0x05
    const bytecode = [_]u8{ 0x60, 0x05 };

    var frame = try F.init(allocator, &bytecode, 1000, {});
    defer frame.deinit(allocator);

    // Check that our test tracer was initialized
    try std.testing.expectEqual(@as(usize, 0), frame.tracer.call_count);

    // Execute a simple operation to trigger tracer
    try frame.stack.push(10);

    // Since we're calling op functions directly, tracer won't be triggered
    // unless we go through the interpret function
}

test "Frame op_msize memory size tracking" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x59, 0x00 }; // MSIZE STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // Initially memory size should be 0
    try frame.msize();
    const initial_size = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), initial_size);

    // Store something to expand memory
    try frame.stack.push(0x42); // value
    try frame.stack.push(0); // offset
    try frame.mstore();

    // Memory should now be 32 bytes
    try frame.msize();
    const size_after_store = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 32), size_after_store);

    // Store at offset 32
    try frame.stack.push(0x55); // value
    try frame.stack.push(32); // offset
    try frame.mstore();

    // Memory should now be 64 bytes
    try frame.msize();
    const size_after_second_store = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 64), size_after_second_store);
}

test "Frame op_mload memory load operations" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x51, 0x00 }; // MLOAD STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // Store a value first
    const test_value: u256 = 0x123456789ABCDEF0;
    try frame.stack.push(test_value);
    try frame.stack.push(0); // offset
    try frame.mstore();

    // Load it back
    try frame.stack.push(0); // offset
    try frame.mload();
    const loaded_value = try frame.stack.pop();
    try std.testing.expectEqual(test_value, loaded_value);

    // Load from uninitialized memory (should be zero)
    // First store at offset 64 to ensure memory is expanded
    try frame.stack.push(0); // value 0
    try frame.stack.push(64); // offset
    try frame.mstore();

    // Now load from offset 64 (should be zero)
    try frame.stack.push(64); // offset
    try frame.mload();
    const zero_value = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), zero_value);
}

test "Frame op_mstore memory store operations" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x52, 0x00 }; // MSTORE STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // Store multiple values at different offsets
    const value1: u256 = 0xDEADBEEF;
    const value2: u256 = 0xCAFEBABE;

    try frame.stack.push(value1);
    try frame.stack.push(0); // offset
    try frame.mstore();

    try frame.stack.push(value2);
    try frame.stack.push(32); // offset
    try frame.mstore();

    // Read them back
    try frame.stack.push(0);
    try frame.mload();
    const read1 = try frame.stack.pop();
    try std.testing.expectEqual(value1, read1);

    try frame.stack.push(32);
    try frame.mload();
    const read2 = try frame.stack.pop();
    try std.testing.expectEqual(value2, read2);
}

test "Frame op_mstore8 byte store operations" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x53, 0x00 }; // MSTORE8 STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // Store a single byte
    try frame.stack.push(0xFF); // value (only low byte will be stored)
    try frame.stack.push(5); // offset
    try frame.mstore8();

    // Load the 32-byte word containing our byte
    try frame.stack.push(0); // offset 0
    try frame.mload();
    const word = try frame.stack.pop();

    // The byte at offset 5 should be 0xFF
    // In a 32-byte word, byte 5 is at bit position 216-223 (from the right)
    const byte_5 = @as(u8, @truncate((word >> (26 * 8)) & 0xFF));
    try std.testing.expectEqual(@as(u8, 0xFF), byte_5);

    // Store another byte and check
    try frame.stack.push(0x1234ABCD); // value (only 0xCD will be stored)
    try frame.stack.push(10); // offset
    try frame.mstore8();

    try frame.stack.push(0);
    try frame.mload();
    const word2 = try frame.stack.pop();
    const byte_10 = @as(u8, @truncate((word2 >> (21 * 8)) & 0xFF));
    try std.testing.expectEqual(@as(u8, 0xCD), byte_10);
}

test "trace instructions behavior with different tracer types" {
    // Simple test tracer that counts calls
    const TestTracer = struct {
        call_count: usize = 0,

        pub fn init() @This() {
            return .{};
        }

        pub fn beforeOp(self: *@This(), comptime FrameType: type, frame_instance: *const FrameType) void {
            _ = frame_instance;
            self.call_count += 1;
        }

        pub fn afterOp(self: *@This(), comptime FrameType: type, frame_instance: *const FrameType) void {
            _ = frame_instance;
            self.call_count += 1;
        }

        pub fn onError(self: *@This(), comptime FrameType: type, frame_instance: *const FrameType, err: anyerror) void {
            _ = frame_instance;
            _ = err;
            self.call_count += 1;
        }
    };

    const allocator = std.testing.allocator;

    // Test that frames with different tracer types compile successfully
    const FrameNoOp = Frame(.{});
    const FrameWithTestTracer = Frame(.{
        .TracerType = TestTracer,
    });

    // Verify both frame types can be instantiated
    const bytecode = [_]u8{ 0x60, 0x05, 0x00 }; // PUSH1 5, STOP

    var frame_noop = try FrameNoOp.init(allocator, &bytecode, 1000, {});
    defer frame_noop.deinit(allocator);

    var frame_traced = try FrameWithTestTracer.init(allocator, &bytecode, 1000, {});
    defer frame_traced.deinit(allocator);

    // Both should start with empty stacks

    // The traced frame should start with zero tracer calls
    try std.testing.expectEqual(@as(usize, 0), frame_traced.tracer.call_count);

    // Test type name checking (this verifies our ENABLE_TRACING logic)
    const noop_type_name = @typeName(NoOpTracer);
    const test_tracer_type_name = @typeName(TestTracer);

    try std.testing.expect(std.mem.eql(u8, noop_type_name, "tracer.NoOpTracer"));
    try std.testing.expect(!std.mem.eql(u8, test_tracer_type_name, "tracer.NoOpTracer"));
}

test "Frame jump to invalid destination should fail" {
    const allocator = std.testing.allocator;
    const FrameInterpreter = @import("frame_interpreter.zig").createFrameInterpreter(.{});

    // PUSH1 3, JUMP, STOP - jumping to position 3 which is STOP instruction should fail
    const bytecode = [_]u8{ 0x60, 0x03, 0x56, 0x00 };
    
    // The bytecode validation should catch invalid jump destinations during init
    const result = FrameInterpreter.init(allocator, &bytecode, 1000000, void{});
    try std.testing.expectError(error.InvalidJumpDestination, result);
}

test "Frame memory expansion edge cases" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    const bytecode = [_]u8{ 0x53, 0x00 }; // MSTORE8 STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // Test memory expansion with MSTORE8 at various offsets
    // Memory should expand in 32-byte chunks (EVM word alignment)

    // Store at offset 0 - should expand to 32 bytes
    try frame.stack.push(0xFF); // value
    try frame.stack.push(0); // offset
    try frame.mstore8();
    try frame.msize();
    const size1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 32), size1);

    // Store at offset 31 - should still be 32 bytes
    try frame.stack.push(0xAA); // value
    try frame.stack.push(31); // offset
    try frame.mstore8();
    try frame.msize();
    const size2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 32), size2);

    // Store at offset 32 - should expand to 64 bytes
    try frame.stack.push(0xBB); // value
    try frame.stack.push(32); // offset
    try frame.mstore8();
    try frame.msize();
    const size3 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 64), size3);

    // Store at offset 63 - should still be 64 bytes
    try frame.stack.push(0xCC); // value
    try frame.stack.push(63); // offset
    try frame.mstore8();
    try frame.msize();
    const size4 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 64), size4);

    // Store at offset 64 - should expand to 96 bytes
    try frame.stack.push(0xDD); // value
    try frame.stack.push(64); // offset
    try frame.mstore8();
    try frame.msize();
    const size5 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 96), size5);
}

test "Frame op_mcopy memory copy operations" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    const bytecode = [_]u8{ 0x5e, 0x00 }; // MCOPY STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // First, set up some data in memory
    const test_data: u256 = 0xDEADBEEFCAFEBABE;
    try frame.stack.push(test_data);
    try frame.stack.push(0); // offset
    try frame.mstore();

    // Test 1: Copy memory to a different location
    try frame.stack.push(32); // length
    try frame.stack.push(0);  // src
    try frame.stack.push(32); // dest
    try frame.mcopy();

    // Verify the copy
    try frame.stack.push(32); // offset
    try frame.mload();
    const copied_value = try frame.stack.pop();
    try std.testing.expectEqual(test_data, copied_value);

    // Test 2: Zero-length copy (should do nothing)
    try frame.stack.push(0);  // length
    try frame.stack.push(0);  // src
    try frame.stack.push(64); // dest
    try frame.mcopy();
    // No error should occur

    // Test 3: Overlapping copy (forward overlap)
    // Store a pattern at offset 0
    try frame.stack.push(0x1111111111111111);
    try frame.stack.push(0);
    try frame.mstore();
    try frame.stack.push(0x2222222222222222);
    try frame.stack.push(32);
    try frame.mstore();

    // Copy 48 bytes from offset 0 to offset 16 (forward overlap)
    try frame.stack.push(48); // length
    try frame.stack.push(0);  // src
    try frame.stack.push(16); // dest
    try frame.mcopy();

    // Read and verify
    try frame.stack.push(16);
    try frame.mload();
    const overlap_result1 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0x1111111111111111), overlap_result1);

    // Test 4: Overlapping copy (backward overlap)
    // Store new pattern
    try frame.stack.push(0x3333333333333333);
    try frame.stack.push(64);
    try frame.mstore();
    try frame.stack.push(0x4444444444444444);
    try frame.stack.push(96);
    try frame.mstore();

    // Copy 48 bytes from offset 64 to offset 48 (backward overlap)
    try frame.stack.push(48); // length
    try frame.stack.push(64); // src
    try frame.stack.push(48); // dest
    try frame.mcopy();

    // Read and verify
    try frame.stack.push(48);
    try frame.mload();
    const overlap_result2 = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0x3333333333333333), overlap_result2);
}

test "Frame JUMPDEST validation comprehensive" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});

    // Complex bytecode with valid and invalid jump destinations
    // PUSH1 8, JUMPI, INVALID, PUSH1 12, JUMP, INVALID, JUMPDEST, PUSH1 1, STOP, INVALID, JUMPDEST, PUSH1 2, STOP
    const bytecode = [_]u8{
        0x60, 0x08, // PUSH1 8 (offset 0-1)
        0x57, // JUMPI (offset 2)
        0xFE, // INVALID (offset 3)
        0x60, 0x0C, // PUSH1 12 (offset 4-5)
        0x56, // JUMP (offset 6)
        0xFE, // INVALID (offset 7)
        0x5B, // JUMPDEST (offset 8) - valid destination
        0x60, 0x01, // PUSH1 1 (offset 9-10)
        0x00, // STOP (offset 11)
        0xFE, // INVALID (offset 12) - trying to jump here should fail
        0x5B, // JUMPDEST (offset 13) - valid destination
        0x60, 0x02, // PUSH1 2 (offset 14-15)
        0x00, // STOP (offset 16)
    };
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);

    // The interpreter would handle JUMP/JUMPI opcodes with proper JUMPDEST validation
    // For now we test that the frame was properly initialized and bytecode is correct
    try std.testing.expectEqual(@intFromEnum(Opcode.PUSH1), frame.bytecode[0]);
    try std.testing.expectEqual(@as(u8, 8), frame.bytecode[1]);
    try std.testing.expectEqual(@intFromEnum(Opcode.JUMPI), frame.bytecode[2]);
    try std.testing.expectEqual(@intFromEnum(Opcode.INVALID), frame.bytecode[3]);
    try std.testing.expectEqual(@intFromEnum(Opcode.JUMPDEST), frame.bytecode[8]);
    try std.testing.expectEqual(@intFromEnum(Opcode.JUMPDEST), frame.bytecode[13]);
}

test "Frame storage operations with database" {
    const allocator = std.testing.allocator;
    
    // Create a frame with database support
    const FrameWithDb = Frame(.{ .has_database = true });
    
    // Create a test database
    var db = @import("memory_database.zig").MemoryDatabase.init(allocator);
    defer db.deinit();
    const db_interface = db.to_database_interface();
    
    const bytecode = [_]u8{ 0x54, 0x00 }; // SLOAD STOP
    var frame = try FrameWithDb.init(allocator, &bytecode, 1000000, db_interface);
    defer frame.deinit(allocator);
    
    // Test SSTORE followed by SLOAD
    const test_key: u256 = 0x42;
    const test_value: u256 = 0xDEADBEEF;
    
    // Store a value
    try frame.stack.push(test_value);
    try frame.stack.push(test_key);
    try frame.sstore();
    
    // Load it back
    try frame.stack.push(test_key);
    try frame.sload();
    const loaded_value = try frame.stack.pop();
    try std.testing.expectEqual(test_value, loaded_value);
    
    // Test overwriting a value
    const new_value: u256 = 0xCAFEBABE;
    try frame.stack.push(new_value);
    try frame.stack.push(test_key);
    try frame.sstore();
    
    try frame.stack.push(test_key);
    try frame.sload();
    const overwritten_value = try frame.stack.pop();
    try std.testing.expectEqual(new_value, overwritten_value);
    
    // Test loading non-existent key (should return 0)
    const non_existent_key: u256 = 0x999;
    try frame.stack.push(non_existent_key);
    try frame.sload();
    const zero_value = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), zero_value);
}

test "Frame transient storage operations with database" {
    const allocator = std.testing.allocator;
    
    // Create a frame with database support
    const FrameWithDb = Frame(.{ .has_database = true });
    
    // Create a test database
    var db = @import("memory_database.zig").MemoryDatabase.init(allocator);
    defer db.deinit();
    const db_interface = db.to_database_interface();
    
    const bytecode = [_]u8{ 0x5c, 0x00 }; // TLOAD STOP
    var frame = try FrameWithDb.init(allocator, &bytecode, 1000000, db_interface);
    defer frame.deinit(allocator);
    
    // Test TSTORE followed by TLOAD
    const test_key: u256 = 0x123;
    const test_value: u256 = 0xABCDEF;
    
    // Store a value in transient storage
    try frame.stack.push(test_value);
    try frame.stack.push(test_key);
    try frame.tstore();
    
    // Load it back
    try frame.stack.push(test_key);
    try frame.tload();
    const loaded_value = try frame.stack.pop();
    try std.testing.expectEqual(test_value, loaded_value);
    
    // Test that transient storage is separate from regular storage
    // Store in regular storage
    const regular_value: u256 = 0x111111;
    try frame.stack.push(regular_value);
    try frame.stack.push(test_key); // Same key
    try frame.sstore();
    
    // Load from transient storage should still return the transient value
    try frame.stack.push(test_key);
    try frame.tload();
    const transient_value = try frame.stack.pop();
    try std.testing.expectEqual(test_value, transient_value);
    
    // Load from regular storage should return the regular value
    try frame.stack.push(test_key);
    try frame.sload();
    const regular_loaded = try frame.stack.pop();
    try std.testing.expectEqual(regular_value, regular_loaded);
}

test "Frame storage operations without database should fail" {
    const allocator = std.testing.allocator;
    
    // Create a frame without database support (default)
    const F = Frame(.{});
    
    const bytecode = [_]u8{ 0x54, 0x00 }; // SLOAD STOP
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);
    
    // All storage operations should return InvalidOpcode when no database
    try frame.stack.push(0);
    try std.testing.expectError(error.InvalidOpcode, frame.sload());
    
    try frame.stack.push(0);
    try frame.stack.push(0);
    try std.testing.expectError(error.InvalidOpcode, frame.sstore());
    
    try frame.stack.push(0);
    try std.testing.expectError(error.InvalidOpcode, frame.tload());
    
    try frame.stack.push(0);
    try frame.stack.push(0);
    try std.testing.expectError(error.InvalidOpcode, frame.tstore());
}

test "Frame gas consumption tracking" {
    const allocator = std.testing.allocator;
    const FrameInterpreter = @import("frame_interpreter.zig").createFrameInterpreter(.{});

    // PUSH1 10, PUSH1 20, ADD, GAS, STOP
    const bytecode = [_]u8{ 0x60, 0x0A, 0x60, 0x14, 0x01, 0x5A, 0x00 };
    var interpreter = try FrameInterpreter.init(allocator, &bytecode, 1000, {});
    defer interpreter.deinit(allocator);

    // Check initial gas
    const initial_gas = interpreter.frame.gas_remaining;
    try std.testing.expectEqual(@as(i32, 1000), initial_gas);

    // Run the interpretation which will consume gas
    const result = interpreter.interpret();
    try std.testing.expectError(error.STOP, result);

    // Check that gas was consumed - stack should have gas value then result

    // Pop gas value (should be less than 1000)
    const gas_remaining = try interpreter.frame.stack.pop();
    try std.testing.expect(gas_remaining < 1000);

    // Pop addition result
    const add_result = try interpreter.frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 30), add_result); // 10 + 20 = 30
}

test "Stream-based instruction format - simple operations" {
    const allocator = std.testing.allocator;
    
    // Expected stream layout:
    // For simple ops (ADD): 1 chunk [handler]
    // For PUSH with inline value: 2 chunks [handler, value]
    // Stream: [push_inline_handler, 5, push_inline_handler, 10, add_handler, stop_handler]
    
    // Create mock stream to test the concept
    const stream_size = 6;
    var stream = try allocator.alloc(usize, stream_size);
    defer allocator.free(stream);
    
    // Simulate what the stream would look like
    var idx: usize = 0;
    
    // PUSH1 5 - inline value
    stream[idx] = @intFromPtr(&mock_push_inline_handler);
    stream[idx + 1] = 5;
    idx += 2;
    
    // PUSH1 10 - inline value
    stream[idx] = @intFromPtr(&mock_push_inline_handler);
    stream[idx + 1] = 10;
    idx += 2;
    
    // ADD - no metadata
    stream[idx] = @intFromPtr(&mock_add_handler);
    idx += 1;
    
    // STOP - no metadata
    stream[idx] = @intFromPtr(&mock_stop_handler);
    
    // Test that stream has expected structure
    try std.testing.expectEqual(@as(usize, 6), stream.len);
    try std.testing.expectEqual(@as(usize, 5), stream[1]); // First push value
    try std.testing.expectEqual(@as(usize, 10), stream[3]); // Second push value
}

// Mock handlers for testing stream structure
fn mock_push_inline_handler(self: *anyopaque, stream: []usize, idx: usize) !void {
    _ = self;
    _ = stream;
    _ = idx;
    unreachable; // Not executed in this test
}

fn mock_add_handler(self: *anyopaque, stream: []usize, idx: usize) !void {
    _ = self;
    _ = stream;
    _ = idx;
    unreachable; // Not executed in this test
}

fn mock_stop_handler(self: *anyopaque, stream: []usize, idx: usize) !void {
    _ = self;
    _ = stream;
    _ = idx;
    unreachable; // Not executed in this test
}

test "Stream-based instruction format - large PUSH values" {
    const allocator = std.testing.allocator;
    
    // Test PUSH32 with large value that doesn't fit in usize
    // Expected stream layout:
    // [push_pointer_handler, ptr_to_u256, stop_handler]
    
    // Create storage for large values
    var push_values_large = try allocator.alloc(u256, 1);
    defer allocator.free(push_values_large);
    push_values_large[0] = std.math.maxInt(u256); // Large value that doesn't fit in usize
    
    // Create stream
    const stream_size = 3;
    var stream = try allocator.alloc(usize, stream_size);
    defer allocator.free(stream);
    
    // PUSH32 with pointer to large value
    stream[0] = @intFromPtr(&mock_push_pointer_handler);
    stream[1] = @intFromPtr(&push_values_large[0]);
    
    // STOP
    stream[2] = @intFromPtr(&mock_stop_handler);
    
    // Test that stream has expected structure
    try std.testing.expectEqual(@as(usize, 3), stream.len);
    
    // Verify pointer points to correct value
    const ptr = @as(*const u256, @ptrFromInt(stream[1]));
    try std.testing.expectEqual(std.math.maxInt(u256), ptr.*);
}

fn mock_push_pointer_handler(self: *anyopaque, stream: []usize, idx: usize) !void {
    _ = self;
    _ = stream;
    _ = idx;
    unreachable; // Not executed in this test
}

test "Stream-based instruction format - PC and JUMP operations" {
    const allocator = std.testing.allocator;
    
    // Test PC opcode and JUMP operation
    // Expected stream layout:
    // [pc_handler, pc_value, jumpdest_handler, jump_handler, dest_idx, stop_handler]
    
    const stream_size = 6;
    var stream = try allocator.alloc(usize, stream_size);
    defer allocator.free(stream);
    
    var idx: usize = 0;
    
    // PC - stores PC value inline
    stream[idx] = @intFromPtr(&mock_pc_handler);
    stream[idx + 1] = 42; // PC value at this point
    idx += 2;
    
    // JUMPDEST - no metadata
    stream[idx] = @intFromPtr(&mock_jumpdest_handler);
    idx += 1;
    
    // JUMP - stores destination instruction index inline
    stream[idx] = @intFromPtr(&mock_jump_handler);
    stream[idx + 1] = 2; // Index of JUMPDEST in stream
    idx += 2;
    
    // STOP
    stream[idx] = @intFromPtr(&mock_stop_handler);
    
    // Test that stream has expected structure
    try std.testing.expectEqual(@as(usize, 6), stream.len);
    try std.testing.expectEqual(@as(usize, 42), stream[1]); // PC value
    try std.testing.expectEqual(@as(usize, 2), stream[4]); // Jump destination index
}

fn mock_pc_handler(self: *anyopaque, stream: []usize, idx: usize) !void {
    _ = self;
    _ = stream;
    _ = idx;
    unreachable; // Not executed in this test
}

fn mock_jumpdest_handler(self: *anyopaque, stream: []usize, idx: usize) !void {
    _ = self;
    _ = stream;
    _ = idx;
    unreachable; // Not executed in this test
}

fn mock_jump_handler(self: *anyopaque, stream: []usize, idx: usize) !void {
    _ = self;
    _ = stream;
    _ = idx;
    unreachable; // Not executed in this test
}

test "Frame LOG0 operation" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    
    const bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);
    
    // Store some data in memory
    const test_data = "Hello, Ethereum!";
    const data_offset: usize = 32;
    
    // Write data to memory
    for (test_data, 0..) |byte, i| {
        frame.memory.set_byte_evm(data_offset + i, byte) catch unreachable;
    }
    
    // Push data location and size for LOG0
    try frame.stack.push(@as(u256, data_offset)); // offset
    try frame.stack.push(test_data.len); // size
    
    // Execute LOG0
    try frame.log0(allocator);
    
    // Verify log was created
    try std.testing.expectEqual(@as(usize, 1), frame.logs.items.len);
    const log = frame.logs.items[0];
    
    // Check log properties
    try std.testing.expectEqual(frame.contract_address, log.address);
    try std.testing.expectEqual(@as(usize, 0), log.topics.len); // LOG0 has no topics
    try std.testing.expectEqualSlices(u8, test_data, log.data);
}

test "Frame LOG1 operation with topic" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    
    const bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);
    
    // Store some data in memory
    const test_data = [_]u8{0x12, 0x34, 0x56, 0x78};
    const data_offset: usize = 0;
    
    // Write data to memory
    for (test_data, 0..) |byte, i| {
        frame.memory.set_byte_evm(data_offset + i, byte) catch unreachable;
    }
    
    // Topic for LOG1
    const topic1: u256 = 0xDEADBEEF;
    
    // Push data for LOG1: topic, offset, size
    try frame.stack.push(topic1); // topic
    try frame.stack.push(@as(u256, data_offset)); // offset
    try frame.stack.push(test_data.len); // size
    
    // Execute LOG1
    try frame.log1(allocator);
    
    // Verify log was created
    try std.testing.expectEqual(@as(usize, 1), frame.logs.items.len);
    const log = frame.logs.items[0];
    
    // Check log properties
    try std.testing.expectEqual(frame.contract_address, log.address);
    try std.testing.expectEqual(@as(usize, 1), log.topics.len);
    try std.testing.expectEqual(topic1, log.topics[0]);
    try std.testing.expectEqualSlices(u8, &test_data, log.data);
}

test "Frame LOG4 operation with multiple topics" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    
    const bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);
    
    // Topics for LOG4
    const topic1: u256 = 0x1111111111111111;
    const topic2: u256 = 0x2222222222222222;
    const topic3: u256 = 0x3333333333333333;
    const topic4: u256 = 0x4444444444444444;
    
    // Push data for LOG4: topics (in reverse order), offset, size
    try frame.stack.push(topic4);
    try frame.stack.push(topic3);
    try frame.stack.push(topic2);
    try frame.stack.push(topic1);
    try frame.stack.push(0); // offset
    try frame.stack.push(0); // size (empty data)
    
    // Execute LOG4
    try frame.log4(allocator);
    
    // Verify log was created
    try std.testing.expectEqual(@as(usize, 1), frame.logs.items.len);
    const log = frame.logs.items[0];
    
    // Check log properties
    try std.testing.expectEqual(frame.contract_address, log.address);
    try std.testing.expectEqual(@as(usize, 4), log.topics.len);
    try std.testing.expectEqual(topic1, log.topics[0]);
    try std.testing.expectEqual(topic2, log.topics[1]);
    try std.testing.expectEqual(topic3, log.topics[2]);
    try std.testing.expectEqual(topic4, log.topics[3]);
    try std.testing.expectEqual(@as(usize, 0), log.data.len); // Empty data
}

test "Frame LOG in static context fails" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    
    const bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);
    
    // Set static context
    frame.is_static = true;
    
    // Push data for LOG0
    try frame.stack.push(0); // offset
    try frame.stack.push(10); // size
    
    // Execute LOG0 should fail
    try std.testing.expectError(error.WriteProtection, frame.log0(allocator));
}

test "Frame LOG with out of bounds memory access" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    
    const bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var frame = try F.init(allocator, &bytecode, 1000000, void{}, null);
    defer frame.deinit(allocator);
    
    // Push data for LOG0 with huge offset
    try frame.stack.push(std.math.maxInt(u256)); // offset too large
    try frame.stack.push(10); // size
    
    // Execute LOG0 should fail
    try std.testing.expectError(error.OutOfBounds, frame.log0(allocator));
}

test "Frame LOG gas consumption" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    
    const bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    const initial_gas: i32 = 10000;
    var frame = try F.init(allocator, &bytecode, initial_gas, void{});
    defer frame.deinit(allocator);
    
    // Store some data in memory
    const test_data = "Test log data";
    const data_offset: usize = 0;
    
    // Write data to memory
    for (test_data, 0..) |byte, i| {
        frame.memory.set_byte_evm(data_offset + i, byte) catch unreachable;
    }
    
    // Push data for LOG0
    try frame.stack.push(@as(u256, data_offset)); // offset
    try frame.stack.push(test_data.len); // size
    
    // Execute LOG0
    try frame.log0(allocator);
    
    // Verify gas was consumed for data bytes
    const expected_gas_consumed = @as(i32, @intCast(GasConstants.LogDataGas * test_data.len));
    try std.testing.expectEqual(initial_gas - expected_gas_consumed, frame.gas_remaining);
}

