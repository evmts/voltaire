//! Lightweight execution context for EVM operations.
//!
//! StackFrame handles direct opcode execution including stack manipulation,
//! arithmetic, memory access, and storage operations. It does NOT handle:
//! - PC tracking and jumps (managed by Plan)
//! - CALL/CREATE operations (managed by Host/EVM)
//! - Environment queries (provided by Host)
//!
//! The StackFrame is designed for efficient opcode dispatch with configurable
//! components for stack size, memory limits, and gas tracking.
const std = @import("std");
const builtin = @import("builtin");
const log = @import("log.zig");
const memory_mod = @import("memory.zig");
const stack_mod = @import("stack.zig");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;
const OpcodeSynthetic = @import("opcode_synthetic.zig").OpcodeSynthetic;
pub const FrameConfig = @import("frame_config.zig").FrameConfig;
const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
const Account = @import("database_interface.zig").Account;
const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
const bytecode_mod = @import("bytecode.zig");
const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;
const primitives = @import("primitives");
const GasConstants = primitives.GasConstants;
const Address = primitives.Address.Address;
const to_u256 = primitives.Address.to_u256;
const from_u256 = primitives.Address.from_u256;
const keccak_asm = @import("keccak_asm.zig");
const stack_frame_arithmetic = @import("stack_frame_arithmetic.zig");
const stack_frame_comparison = @import("stack_frame_comparison.zig");
const SelfDestruct = @import("self_destruct.zig").SelfDestruct;
const Host = @import("host.zig").Host;
const CallParams = @import("call_params.zig").CallParams;
const CallResult = @import("call_result.zig").CallResult;
const logs = @import("logs.zig");
const Log = logs.Log;
const dispatch_mod = @import("stack_frame_dispatch.zig");

/// Creates a configured StackFrame type for EVM execution.
///
/// The StackFrame is parameterized by compile-time configuration to enable
/// optimal code generation and platform-specific optimizations.
pub fn StackFrame(comptime config: FrameConfig) type {
    comptime config.validate();

    return struct {
        pub const WordType = config.WordType;
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
        pub const Bytecode = bytecode_mod.Bytecode(.{
            .max_bytecode_size = config.max_bytecode_size,

            .vector_length = config.vector_length,
            .max_initcode_size = config.max_initcode_size,
        });

        /// The dispatch mechanism that controls opcode execution flow.
        /// This is now implemented in a separate module for better modularity.
        const Dispatch = dispatch_mod.Dispatch(Self);
        const Schedule = Dispatch; // Alias for backward compatibility
        pub const Success = enum {
            Stop,
            Return,
            SelfDestruct,
        };
        pub const Error = error{
            StackOverflow,
            StackUnderflow,
            REVERT,
            BytecodeTooLarge,
            AllocationError,
            InvalidJump,
            InvalidOpcode,
            OutOfBounds,
            OutOfGas,
            GasOverflow,
            InvalidAmount,
            WriteProtection,
        };

        fn generatePushHandler(comptime push_n: u8) *const Schedule.OpcodeHandler {
            if (push_n > 32) @compileError("Only PUSH0 to PUSH32 is supported");
            if (push_n == 0) @compileError("Push0 is handled as it's own opcode not via generatePushHandler");
            return struct {
                pub fn pushHandler(self: Self, schedule: Schedule) Error!Success {
                    if (push_n <= 8) {
                        const meta = schedule.getInlineMetadata();
                        try self.stack.push(meta.value);
                    } else {
                        const meta = schedule.getPointerMetadata();
                        try self.stack.push(meta.value.*);
                    }
                    const next = schedule.skipMetadata();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                }
            }.pushHandler;
        }

        /// Generate a dup handler for DUP1-DUP16
        fn generateDupHandler(comptime dup_n: u8) *const Schedule.OpcodeHandler {
            return struct {
                pub fn dupHandler(self: Self, schedule: Schedule) Error!Success {
                    const value = try self.stack.peek_n(dup_n);
                    try self.stack.push(value);
                    const next = schedule.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                }
            }.dupHandler;
        }

        /// Generate a swap handler for SWAP1-SWAP16
        fn generateSwapHandler(comptime swap_n: u8) *const Schedule.OpcodeHandler {
            return struct {
                pub fn swapHandler(self: Self, schedule: Schedule) Error!Success {
                    try self.stack.swap_n(swap_n);
                    const next = schedule.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                }
            }.swapHandler;
        }

        pub const opcode_handlers = blk: {
            @setEvalBranchQuota(10000);
            var h: [256]*const Schedule.OpcodeHandler = undefined;
            for (&h) |*handler| handler.* = &invalid;
            h[@intFromEnum(Opcode.STOP)] = &stop;
            h[@intFromEnum(Opcode.ADD)] = &add;
            h[@intFromEnum(Opcode.MUL)] = &mul;
            h[@intFromEnum(Opcode.SUB)] = &sub;
            h[@intFromEnum(Opcode.DIV)] = &div;
            h[@intFromEnum(Opcode.SDIV)] = &sdiv;
            h[@intFromEnum(Opcode.MOD)] = &mod;
            h[@intFromEnum(Opcode.SMOD)] = &smod;
            h[@intFromEnum(Opcode.ADDMOD)] = &addmod;
            h[@intFromEnum(Opcode.MULMOD)] = &mulmod;
            h[@intFromEnum(Opcode.EXP)] = &exp;
            h[@intFromEnum(Opcode.SIGNEXTEND)] = &signextend;
            h[@intFromEnum(Opcode.LT)] = &lt;
            h[@intFromEnum(Opcode.GT)] = &gt;
            h[@intFromEnum(Opcode.SLT)] = &slt;
            h[@intFromEnum(Opcode.SGT)] = &sgt;
            h[@intFromEnum(Opcode.EQ)] = &eq;
            h[@intFromEnum(Opcode.ISZERO)] = &iszero;
            h[@intFromEnum(Opcode.AND)] = &@"and";
            h[@intFromEnum(Opcode.OR)] = &@"or";
            h[@intFromEnum(Opcode.XOR)] = &xor;
            h[@intFromEnum(Opcode.NOT)] = &not;
            h[@intFromEnum(Opcode.BYTE)] = &byte;
            h[@intFromEnum(Opcode.SHL)] = &shl;
            h[@intFromEnum(Opcode.SHR)] = &shr;
            h[@intFromEnum(Opcode.SAR)] = &sar;
            h[@intFromEnum(Opcode.KECCAK256)] = &keccak256;
            h[@intFromEnum(Opcode.ADDRESS)] = &address;
            h[@intFromEnum(Opcode.BALANCE)] = &balance;
            h[@intFromEnum(Opcode.ORIGIN)] = &origin;
            h[@intFromEnum(Opcode.CALLER)] = &caller;
            h[@intFromEnum(Opcode.CALLVALUE)] = &callvalue;
            h[@intFromEnum(Opcode.CALLDATALOAD)] = &calldataload;
            h[@intFromEnum(Opcode.CALLDATASIZE)] = &calldatasize;
            h[@intFromEnum(Opcode.CALLDATACOPY)] = &calldatacopy;
            h[@intFromEnum(Opcode.CODESIZE)] = &codesize;
            h[@intFromEnum(Opcode.CODECOPY)] = &codecopy;
            h[@intFromEnum(Opcode.GASPRICE)] = &gasprice;
            h[@intFromEnum(Opcode.EXTCODESIZE)] = &extcodesize;
            h[@intFromEnum(Opcode.EXTCODECOPY)] = &extcodecopy;
            h[@intFromEnum(Opcode.RETURNDATASIZE)] = &returndatasize;
            h[@intFromEnum(Opcode.RETURNDATACOPY)] = &returndatacopy;
            h[@intFromEnum(Opcode.EXTCODEHASH)] = &extcodehash;
            h[@intFromEnum(Opcode.BLOCKHASH)] = &blockhash;
            h[@intFromEnum(Opcode.COINBASE)] = &coinbase;
            h[@intFromEnum(Opcode.TIMESTAMP)] = &timestamp;
            h[@intFromEnum(Opcode.NUMBER)] = &number;
            h[@intFromEnum(Opcode.DIFFICULTY)] = &difficulty;
            h[@intFromEnum(Opcode.GASLIMIT)] = &gaslimit;
            h[@intFromEnum(Opcode.CHAINID)] = &chainid;
            h[@intFromEnum(Opcode.SELFBALANCE)] = &selfbalance;
            h[@intFromEnum(Opcode.BASEFEE)] = &basefee;
            h[@intFromEnum(Opcode.BLOBHASH)] = &blobhash;
            h[@intFromEnum(Opcode.BLOBBASEFEE)] = &blobbasefee;
            h[@intFromEnum(Opcode.POP)] = &pop;
            h[@intFromEnum(Opcode.MLOAD)] = &mload;
            h[@intFromEnum(Opcode.MSTORE)] = &mstore;
            h[@intFromEnum(Opcode.MSTORE8)] = &mstore8;
            h[@intFromEnum(Opcode.SLOAD)] = &sload;
            h[@intFromEnum(Opcode.SSTORE)] = &sstore;
            h[@intFromEnum(Opcode.JUMP)] = &jump;
            h[@intFromEnum(Opcode.JUMPI)] = &jumpi;
            h[@intFromEnum(Opcode.PC)] = &pc;
            h[@intFromEnum(Opcode.MSIZE)] = &msize;
            h[@intFromEnum(Opcode.GAS)] = &gas;
            h[@intFromEnum(Opcode.JUMPDEST)] = &jumpdest;
            h[@intFromEnum(Opcode.TLOAD)] = &tload;
            h[@intFromEnum(Opcode.TSTORE)] = &tstore;
            h[@intFromEnum(Opcode.MCOPY)] = &mcopy;
            // PUSH
            for (0..33) |i| {
                const push_n = @as(u8, @intCast(i));
                const opcode = @as(Opcode, @enumFromInt(@intFromEnum(Opcode.PUSH0) + push_n));
                h[@intFromEnum(opcode)] = generatePushHandler(push_n);
            }
            // DUP
            for (1..17) |i| {
                const dup_n = @as(u8, @intCast(i));
                const opcode = @as(Opcode, @enumFromInt(@intFromEnum(Opcode.DUP1) + dup_n - 1));
                h[@intFromEnum(opcode)] = generateDupHandler(dup_n);
            }
            // SWAP
            for (1..17) |i| {
                const swap_n = @as(u8, @intCast(i));
                const opcode = @as(Opcode, @enumFromInt(@intFromEnum(Opcode.SWAP1) + swap_n - 1));
                h[@intFromEnum(opcode)] = generateSwapHandler(swap_n);
            }
            h[@intFromEnum(Opcode.LOG0)] = &log0;
            h[@intFromEnum(Opcode.LOG1)] = &log1;
            h[@intFromEnum(Opcode.LOG2)] = &log2;
            h[@intFromEnum(Opcode.LOG3)] = &log3;
            h[@intFromEnum(Opcode.LOG4)] = &log4;
            h[@intFromEnum(Opcode.CREATE)] = &create;
            h[@intFromEnum(Opcode.CALL)] = &call;
            h[@intFromEnum(Opcode.CALLCODE)] = &invalid; // Deprecated
            h[@intFromEnum(Opcode.RETURN)] = &@"return";
            h[@intFromEnum(Opcode.DELEGATECALL)] = &delegatecall;
            h[@intFromEnum(Opcode.STATICCALL)] = &staticcall;
            h[@intFromEnum(Opcode.REVERT)] = &revert;
            h[@intFromEnum(Opcode.INVALID)] = &invalid;
            h[@intFromEnum(Opcode.SELFDESTRUCT)] = &selfdestruct; // Delegate to Frame
            h[@intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE)] = &push_add_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER)] = &push_add_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE)] = &push_mul_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER)] = &push_mul_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE)] = &push_div_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER)] = &push_div_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_SUB_INLINE)] = &push_sub_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_SUB_POINTER)] = &push_sub_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_JUMP_INLINE)] = &push_jump_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER)] = &push_jump_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_JUMPI_INLINE)] = &push_jumpi_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER)] = &push_jumpi_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_MLOAD_INLINE)] = &push_mload_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_MLOAD_POINTER)] = &push_mload_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_MSTORE_INLINE)] = &push_mstore_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_MSTORE_POINTER)] = &push_mstore_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_AND_INLINE)] = &push_and_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_AND_POINTER)] = &push_and_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_OR_INLINE)] = &push_or_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_OR_POINTER)] = &push_or_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_XOR_INLINE)] = &push_xor_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_XOR_POINTER)] = &push_xor_pointer;
            h[@intFromEnum(OpcodeSynthetic.PUSH_MSTORE8_INLINE)] = &push_mstore8_inline;
            h[@intFromEnum(OpcodeSynthetic.PUSH_MSTORE8_POINTER)] = &push_mstore8_pointer;
            break :blk h;
        };
        pub const max_bytecode_size = config.max_bytecode_size;

        const Self = @This();

        // Cacheline 1
        stack: Stack,
        bytecode: Bytecode, // Use Bytecode type for optimized access
        gas_remaining: GasType, // Direct gas tracking
        /// Initial gas at frame start for refund cap calculation
        initial_gas: GasType = 0,
        tracer: if (config.TracerType) |T| T else void,
        memory: Memory,
        database: if (config.has_database) ?DatabaseInterface else void,
        // Contract execution context
        contract_address: Address = Address.ZERO_ADDRESS,
        self_destruct: ?*SelfDestruct = null,
        host: Host,
        // Cold data - less frequently accessed during execution
        logs: std.ArrayList(Log),
        output_data: std.ArrayList(u8),
        allocator: std.mem.Allocator,
        /// Initialize a new execution frame.
        ///
        /// Creates stack, memory, and other execution components. Validates
        /// bytecode size and allocates resources with proper cleanup on failure.
        pub fn init(allocator: std.mem.Allocator, bytecode_raw: []const u8, gas_remaining: GasType, database: if (config.has_database) ?DatabaseInterface else void, host: Host) Error!Self {
            if (bytecode_raw.len > max_bytecode_size) {
                @branchHint(.unlikely);
                return Error.BytecodeTooLarge;
            }

            // Create Bytecode instance with validation and optimization
            var bytecode = Bytecode.init(allocator, bytecode_raw) catch |e| {
                @branchHint(.unlikely);
                return switch (e) {
                    error.BytecodeTooLarge => Error.BytecodeTooLarge,
                    error.InvalidOpcode => Error.InvalidOpcode,
                    error.OutOfMemory => Error.AllocationError,
                    else => Error.AllocationError,
                };
            };
            errdefer bytecode.deinit();

            var stack = Stack.init(allocator) catch {
                @branchHint(.cold);
                return Error.AllocationError;
            };
            errdefer stack.deinit(allocator);
            var memory = Memory.init(allocator) catch {
                @branchHint(.cold);
                return Error.AllocationError;
            };
            errdefer memory.deinit();
            var frame_logs = std.ArrayList(Log){};
            errdefer frame_logs.deinit(allocator);
            var output_data = std.ArrayList(u8){};
            errdefer output_data.deinit();
            return Self{
                .stack = stack,
                .bytecode = bytecode,
                .gas_remaining = @as(GasType, @intCast(@max(gas_remaining, 0))),
                .initial_gas = @as(GasType, @intCast(@max(gas_remaining, 0))),
                .tracer = if (config.TracerType) |T| T.init() else {},
                .memory = memory,
                .database = database,
                .logs = frame_logs,
                .output_data = output_data,
                .host = host,
                .allocator = allocator,
            };
        }
        /// Clean up all frame resources.
        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            self.stack.deinit(allocator);
            self.memory.deinit();
            self.bytecode.deinit();
            // Free log data
            for (self.logs.items) |log_entry| {
                allocator.free(log_entry.topics);
                allocator.free(log_entry.data);
            }
            self.logs.deinit(allocator);
            self.output_data.deinit(allocator);
        }
        /// Helper function to call tracer beforeOp if tracer is configured
        pub inline fn traceBeforeOp(self: *Self, pc_val: u32, opcode: u8) void {
            if (comptime config.TracerType != null) {
                self.tracer.beforeOp(pc_val, opcode, Self, self);
            }
        }
        /// Helper function to call tracer afterOp if tracer is configured
        pub inline fn traceAfterOp(self: *Self, pc_val: u32, opcode: u8) void {
            if (comptime config.TracerType != null) {
                self.tracer.afterOp(pc_val, opcode, Self, self);
            }
        }
        /// Helper function to call tracer onError if tracer is configured
        pub inline fn traceOnError(self: *Self, pc_val: u32, err: anyerror) void {
            if (comptime config.TracerType != null) {
                self.tracer.onError(pc_val, err, Self, self);
            }
        }
        /// Create a deep copy of the frame.
        /// This is used by DebugPlan to create a sidecar frame for validation.
        pub fn copy(self: *const Self, allocator: std.mem.Allocator) Error!Self {
            // Copy stack using public API
            var new_stack = Stack.init(allocator) catch {
                return Error.AllocationError;
            };
            errdefer new_stack.deinit(allocator);
            const src_stack_slice = self.stack.get_slice();
            if (src_stack_slice.len > 0) {
                // Reconstruct by pushing from bottom to top so top matches exactly
                var i: usize = src_stack_slice.len;
                while (i > 0) {
                    i -= 1;
                    try new_stack.push(src_stack_slice[i]);
                }
            }

            // Copy memory using current API
            var new_memory = Memory.init(allocator) catch {
                return Error.AllocationError;
            };
            errdefer new_memory.deinit();
            const mem_size = self.memory.size();
            if (mem_size > 0) {
                const bytes = self.memory.get_slice(0, mem_size) catch unreachable;
                try new_memory.set_data(0, bytes);
            }

            // Copy logs
            var new_logs = std.ArrayList(Log){};
            errdefer new_logs.deinit(allocator);
            for (self.logs.items) |log_entry| {
                // Allocate and copy topics
                const topics_copy = allocator.alloc(u256, log_entry.topics.len) catch {
                    return Error.AllocationError;
                };
                @memcpy(topics_copy, log_entry.topics);
                // Allocate and copy data
                const data_copy = allocator.alloc(u8, log_entry.data.len) catch {
                    allocator.free(topics_copy);
                    return Error.AllocationError;
                };
                @memcpy(data_copy, log_entry.data);
                new_logs.append(allocator, Log{
                    .address = log_entry.address,
                    .topics = topics_copy,
                    .data = data_copy,
                }) catch {
                    allocator.free(topics_copy);
                    allocator.free(data_copy);
                    return Error.AllocationError;
                };
            }

            // Copy output data buffer
            var new_output_data = std.ArrayList(u8){};
            errdefer new_output_data.deinit(allocator);
            new_output_data.appendSlice(allocator, self.output_data.items) catch {
                return Error.AllocationError;
            };

            return Self{
                .stack = new_stack,
                .bytecode = self.bytecode, // Note: Bytecode is shared, not copied
                .gas_remaining = self.gas_remaining,
                .initial_gas = self.initial_gas,
                .tracer = if (config.TracerType) |_| self.tracer else {},
                .memory = new_memory,
                .database = self.database,
                .contract_address = self.contract_address,
                .self_destruct = self.self_destruct,
                .logs = new_logs,
                .output_data = new_output_data,
                .host = self.host,
                .allocator = allocator,
            };
        }

        pub fn pop(self: Self, schedule: Schedule) Error!Success {
            _ = try self.stack.pop();
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn stop(self: *Self) Error!Success {
            _ = self;
            // TODO: Apply EIP-3529 refund cap: at most 1/5th of gas used
            // MOve this to EIP-3529 and figure out best way to handle it
            // if (self.gas_refund > 0) {
            //                 const start: u64 = @max(self.initial_gas, 0);
            //               const remain: u64 = @max(self.gas_remaining, 0);
            //             const used: u64 = if (start > remain) start - remain else 0;
            //           const cap: u64 = used / 5; // 20% cap
            //         const credit: u64 = if (self.gas_refund > cap) cap else self.gas_refund;
            //       const new_remaining: u128 = @as(u128, @intCast(remain)) + credit;
            //     self.gas_remaining = @as(GasType, @intCast(@min(new_remaining, @as(u128, @intCast(std.math.maxInt(GasType))))));
            //   self.gas_refund = 0;
            //             }
            return Success.Stop;
        }

        pub fn @"and"(self: Self, schedule: Schedule) Error!Success {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top & top_minus_1);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn @"or"(self: Self, schedule: Schedule) Error!Success {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top | top_minus_1);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn xor(self: Self, schedule: Schedule) Error!Success {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top ^ top_minus_1);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn not(self: Self, schedule: Schedule) Error!Success {
            const top = try self.stack.peek();
            try self.stack.set_top(~top);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn byte(self: Self, schedule: Schedule) Error!Success {
            const byte_index = try self.stack.pop();
            const value = try self.stack.peek();
            const result = if (byte_index >= 32) 0 else blk: {
                const index_usize = @as(usize, @intCast(byte_index));
                const shift_amount = (31 - index_usize) * 8;
                const ShiftType = std.math.Log2Int(WordType);
                break :blk (value >> @as(ShiftType, @intCast(shift_amount))) & 0xFF;
            };
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn shl(self: Self, schedule: Schedule) Error!Success {
            const shift = try self.stack.pop();
            const value = try self.stack.peek();
            const ShiftType = std.math.Log2Int(WordType);
            const result = if (shift >= @bitSizeOf(WordType)) 0 else value << @as(ShiftType, @intCast(shift));
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn shr(self: Self, schedule: Schedule) Error!Success {
            const shift = try self.stack.pop();
            const value = try self.stack.peek();
            const ShiftType = std.math.Log2Int(WordType);
            const result = if (shift >= @bitSizeOf(WordType)) 0 else value >> @as(ShiftType, @intCast(shift));
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn sar(self: Self, schedule: Schedule) Error!Success {
            const shift = try self.stack.pop();
            const value = try self.stack.peek();
            const word_bits = @bitSizeOf(WordType);
            const result = if (shift >= word_bits) blk: {
                const sign_bit = value >> (word_bits - 1);
                break :blk if (sign_bit == 1) @as(WordType, std.math.maxInt(WordType)) else @as(WordType, 0);
            } else blk: {
                const ShiftType = std.math.Log2Int(WordType);
                const shift_amount = @as(ShiftType, @intCast(shift));
                // https://ziglang.org/documentation/master/std/#std.meta.Int
                // std.meta.Int creates an integer type with specified signedness and bit width
                const value_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(value));
                const result_signed = value_signed >> shift_amount;
                break :blk @as(WordType, @bitCast(result_signed));
            };
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        // Arithmetic operations
        /// ADD opcode (0x01) - Addition with overflow wrapping.
        pub fn add(self: Self, schedule: Schedule) Error!Success {
            // Static gas consumption handled at upper layer
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top +% top_minus_1);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        /// MUL opcode (0x02) - Multiplication with overflow wrapping.
        pub fn mul(self: Self, schedule: Schedule) Error!Success {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top *% top_minus_1);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn sub(self: Self, schedule: Schedule) Error!Success {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top -% top_minus_1);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        /// DIV opcode (0x04) - Integer division. Division by zero returns 0.
        pub fn div(self: Self, schedule: Schedule) Error!Success {
            const denominator = try self.stack.pop();
            const numerator = try self.stack.peek();
            const result = if (denominator == 0) 0 else numerator / denominator;
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn sdiv(self: Self, schedule: Schedule) Error!Success {
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
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn mod(self: Self, schedule: Schedule) Error!Success {
            const denominator = try self.stack.pop();
            const numerator = try self.stack.peek();
            const result = if (denominator == 0) 0 else numerator % denominator;
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn smod(self: Self, schedule: Schedule) Error!Success {
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
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn addmod(self: Self, schedule: Schedule) Error!Success {
            const modulus = try self.stack.pop();
            const addend2 = try self.stack.pop();
            const addend1 = try self.stack.peek();
            var result: WordType = 0;
            if (modulus == 0) {
                result = 0;
            } else {
                const a = addend1 % modulus;
                const b = addend2 % modulus;
                const sum = @addWithOverflow(a, b);
                var r = sum[0];
                // If overflow occurred or r >= modulus, subtract once
                if (sum[1] == 1 or r >= modulus) {
                    r -%= modulus;
                }
                result = r;
            }
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn mulmod(self: Self, schedule: Schedule) Error!Success {
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
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn exp(self: Self, schedule: Schedule) Error!Success {
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
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        pub fn signextend(self: Self, schedule: Schedule) Error!Success {
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
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
        /// Consume gas without checking (for use after static analysis)
        pub fn consumeGasUnchecked(self: *Self, amount: u64) void {
            self.gas_remaining -= @as(GasType, @intCast(amount));
        }
        /// Consume gas with bounds checking and safe casting
        pub fn consumeGasChecked(self: *Self, amount: u64) Error!void {
            const amt = std.math.cast(GasType, amount) orelse return Error.OutOfGas;
            self.gas_remaining -= amt;
            if (self.gas_remaining < 0) return Error.OutOfGas;
        }
        /// Check if we're out of gas at end of execution
        pub fn checkGas(self: *Self) Error!void {
            if (self.gas_remaining <= 0) {
                @branchHint(.cold);
                return Error.OutOfGas;
            }
        }
        pub fn gas(self: *Self) Error!void {
            const gas_value = @as(WordType, @max(self.gas_remaining, 0));
            return self.stack.push(gas_value);
        }
        /// Test helper: KECCAK256 hash function for direct data hashing
        /// Pushes the hash result onto the stack.
        pub fn keccak256_data(self: *Self, data: []const u8) Error!void {
            var hash_bytes: [32]u8 = undefined;
            keccak_asm.keccak256(data, &hash_bytes) catch |err| switch (err) {
                keccak_asm.KeccakError.InvalidInput => return Error.OutOfBounds,
                keccak_asm.KeccakError.MemoryError => return Error.AllocationError,
                else => return Error.AllocationError,
            };
            var hash_u256: u256 = 0;
            for (hash_bytes) |b| {
                hash_u256 = (hash_u256 << 8) | @as(u256, b);
            }
            try self.stack.push(@as(WordType, @truncate(hash_u256)));
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
            // Use the optimized bitmap lookup from Bytecode
            return self.bytecode.isValidJumpDest(@intCast(pc_value));
        }
        pub fn jumpdest(self: Self, schedule: Schedule) Error!Success {
            // JUMPDEST consumes gas for the entire basic block (static + dynamic)
            const metadata = schedule.getJumpDestMetadata();
            const gas_cost = metadata.gas;
            
            // Check and consume gas
            if (self.gas_remaining < gas_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= gas_cost;
            
            // Continue to next operation
            const next = schedule.skipMetadata();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn jump(self: Self, schedule: Schedule) Error!Success {
            _ = schedule; // JUMP changes control flow, doesn't continue to next
            const dest = try self.stack.pop();
            // TODO: Implement proper jump logic with schedule lookup
            // For now, just return stop
            _ = dest;
            return Success.Stop;
        }

        pub fn jumpi(self: Self, schedule: Schedule) Error!Success {
            const dest = try self.stack.pop();
            const condition = try self.stack.pop();

            if (condition != 0) {
                // TODO: Implement conditional jump logic with schedule lookup
                _ = dest;
                return Success.Stop;
            } else {
                // Continue to next instruction
                const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }
        }

        pub fn pc(self: Self, schedule: Schedule) Error!Success {
            // Get PC value from metadata
            const metadata = schedule.getPcMetadata();
            try self.stack.push(metadata.value);
            const next = schedule.skipMetadata();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn invalid(self: *Self) Error!void {
            _ = self;
            return Error.InvalidOpcode;
        }
        // Cryptographic operations
        /// KECCAK256 opcode (0x20) - Compute keccak256 hash
        /// Pops offset and size from stack, reads data from memory, and pushes hash.
        /// Stack: [offset, size] → [hash]
        pub fn keccak256(self: *Self) Error!void {
            const size = try self.stack.pop();
            const offset = try self.stack.pop();
            // Check bounds
            if (offset > std.math.maxInt(usize) or size > std.math.maxInt(usize)) {
                @branchHint(.unlikely);
                return Error.OutOfBounds;
            }
            // Handle empty data case
            if (size == 0) {
                @branchHint(.unlikely);
                // Hash of empty data = keccak256("")
                if (WordType == u256) {
                    const empty_hash: u256 = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
                    try self.stack.push(empty_hash);
                } else {
                    // For smaller word types, we can't represent the full hash
                    // This is a limitation when using non-u256 word types
                    try self.stack.push(0);
                }
                return;
            }
            const offset_usize = @as(usize, @intCast(offset));
            const size_usize = @as(usize, @intCast(size));
            // Check for overflow
            const end = std.math.add(usize, offset_usize, size_usize) catch {
                @branchHint(.unlikely);
                return Error.OutOfBounds;
            };
            // Ensure memory is available
            self.memory.ensure_capacity(end) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            // Get data from memory
            const data = self.memory.get_slice(offset_usize, size_usize) catch return Error.OutOfBounds;
            // Compute keccak256 hash and convert to big-endian u256
            var hash_bytes: [32]u8 = undefined;
            keccak_asm.keccak256(data, &hash_bytes) catch |err| switch (err) {
                keccak_asm.KeccakError.InvalidInput => return Error.OutOfBounds,
                keccak_asm.KeccakError.MemoryError => return Error.AllocationError,
                else => return Error.AllocationError,
            };
            var hash_u256: u256 = 0;
            for (hash_bytes) |b| {
                hash_u256 = (hash_u256 << 8) | @as(u256, b);
            }
            const result_word = @as(WordType, @truncate(hash_u256));
            try self.stack.push(result_word);
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
            const value_u256 = self.memory.get_u256_evm(offset_usize) catch |err| switch (err) {
                memory_mod.MemoryError.OutOfBounds => return Error.OutOfBounds,
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            // Convert to WordType (truncate if necessary for smaller word types)
            const value = @as(WordType, @truncate(value_u256));
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
                @branchHint(.unlikely);
                return Error.OutOfGas;
            }
            if (self.gas_remaining < @as(GasType, @intCast(copy_gas))) {
                @branchHint(.unlikely);
                return Error.OutOfGas;
            }
            self.gas_remaining -= @as(GasType, @intCast(copy_gas));
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
            // Use the currently executing contract's address
            const contract_addr = self.contract_address;
            // Access the storage slot for warm/cold accounting (EIP-2929)
            _ = self.host.access_storage_slot(contract_addr, slot) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
            // Load value from storage
            const value = self.host.get_storage(contract_addr, slot);
            try self.stack.push(value);
        }
        pub fn sstore(self: *Self) Error!void {
            // SSTORE stores a value to storage
            if (comptime !config.has_database) {
                return Error.InvalidOpcode;
            }

            // Check if we're in static context
            if (self.host.get_is_static()) {
                return Error.WriteProtection;
            }
            // Stack order for SSTORE: [key, value] -> [] with top being value
            const value = try self.stack.pop();
            const slot = try self.stack.pop();
            // Use the currently executing contract's address
            const addr = self.contract_address;
            // Access the storage slot for warm/cold accounting (EIP-2929)
            _ = self.host.access_storage_slot(addr, slot) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
            // Use host interface for journaling
            self.host.set_storage(addr, slot, value) catch |err| switch (err) {
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
            // Use the currently executing contract's address
            const addr = self.contract_address;
            // Load value from transient storage
            const value = db.get_transient_storage(addr.bytes, slot) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
            try self.stack.push(value);
        }
        pub fn tstore(self: *Self) Error!void {
            // TSTORE stores a value to transient storage
            if (comptime !config.has_database) {
                return Error.InvalidOpcode;
            }

            // Check if we're in static context
            if (self.host.get_is_static()) {
                return Error.WriteProtection;
            }
            const slot = try self.stack.pop();
            const value = try self.stack.pop();
            // Get database interface
            const db = self.database orelse return Error.InvalidOpcode;
            // Use the currently executing contract's address
            const addr = self.contract_address;
            // Store value to transient storage
            db.set_transient_storage(addr.bytes, slot, value) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
        }
        // Environment/Context opcodes
        /// ADDRESS opcode (0x30) - Get address of currently executing account
        /// Pushes the address of the currently executing contract.
        /// Stack: [] → [address]
        pub fn address(self: *Self) Error!void {
            const addr_u256 = to_u256(self.contract_address);
            try self.stack.push(addr_u256);
        }
        /// BALANCE opcode (0x31) - Get balance of an account
        /// Pops an address and pushes the balance of that account in wei.
        /// Stack: [address] → [balance]
        pub fn balance(self: *Self) Error!void {
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
        }
        /// ORIGIN opcode (0x32) - Get execution origination address
        /// Pushes the address of the account that initiated the transaction.
        /// Stack: [] → [origin]
        pub fn origin(self: *Self) Error!void {
            const tx_origin = self.host.get_tx_origin();
            const origin_u256 = to_u256(tx_origin);
            try self.stack.push(origin_u256);
        }
        /// CALLER opcode (0x33) - Get caller address
        /// Pushes the address of the account that directly called this contract.
        /// Stack: [] → [caller]
        pub fn caller(self: *Self) Error!void {
            const caller_addr = self.host.get_caller();
            const caller_u256 = to_u256(caller_addr);
            try self.stack.push(caller_u256);
        }
        /// CALLVALUE opcode (0x34) - Get deposited value by instruction/transaction
        /// Pushes the value in wei sent with the current call.
        /// Stack: [] → [value]
        pub fn callvalue(self: *Self) Error!void {
            const value = self.host.get_call_value();
            try self.stack.push(value);
        }
        /// CALLDATALOAD opcode (0x35) - Load word from input data
        /// Pops an offset and pushes a 32-byte word from the input data starting at that offset.
        /// Stack: [offset] → [data]
        pub fn calldataload(self: *Self) Error!void {
            const offset = try self.stack.pop();
            // Convert u256 to usize, checking for overflow
            if (offset > std.math.maxInt(usize)) {
                try self.stack.push(0);
                return;
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
            const result = @as(WordType, @truncate(word));
            try self.stack.push(result);
        }
        /// CALLDATASIZE opcode (0x36) - Get size of input data
        /// Pushes the size of the input data in bytes.
        /// Stack: [] → [size]
        pub fn calldatasize(self: *Self) Error!void {
            const calldata = self.host.get_input();
            const calldata_len = @as(WordType, @truncate(@as(u256, @intCast(calldata.len))));
            try self.stack.push(calldata_len);
        }
        /// CALLDATACOPY opcode (0x37) - Copy input data to memory
        /// Copies input data to memory.
        /// Stack: [destOffset, offset, length] → []
        pub fn calldatacopy(self: *Self) Error!void {
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
            if (length_usize == 0) return;
            // Ensure memory capacity
            const new_size = dest_offset_usize + length_usize;
            self.memory.ensure_capacity(new_size) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            const calldata = self.host.get_input();
            // Copy available bytes as a single slice copy
            var copied: usize = 0;
            if (offset_usize < calldata.len) {
                const available = calldata.len - offset_usize;
                const copy_len = @min(length_usize, available);
                if (copy_len > 0) {
                    const src_slice = calldata[offset_usize .. offset_usize + copy_len];
                    self.memory.set_data(dest_offset_usize, src_slice) catch return Error.OutOfBounds;
                    copied = copy_len;
                }
            }
            // Zero-fill remaining bytes if any
            if (copied < length_usize) {
                var i: usize = 0;
                const zero_start = dest_offset_usize + copied;
                while (i < (length_usize - copied)) : (i += 1) {
                    self.memory.set_byte(zero_start + i, 0) catch return Error.OutOfBounds;
                }
            }
        }
        /// CODESIZE opcode (0x38) - Get size of executing contract code
        /// Pushes the size of the currently executing contract's code.
        /// Stack: [] → [size]
        pub fn codesize(self: *Self) Error!void {
            const bytecode_len = @as(WordType, @truncate(@as(u256, @intCast(self.bytecode.len()))));
            try self.stack.push(bytecode_len);
        }
        /// CODECOPY opcode (0x39) - Copy executing contract code to memory
        /// Copies contract code to memory.
        /// Stack: [destOffset, offset, length] → []
        pub fn codecopy(self: *Self) Error!void {
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
            if (length_usize == 0) return;
            // Ensure memory capacity
            const new_size = dest_offset_usize + length_usize;
            self.memory.ensure_capacity(new_size) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            // Copy contract code to memory with bounds checking
            var copied: usize = 0;
            const bytecode_len = self.bytecode.len();
            if (offset_usize < bytecode_len) {
                const available = bytecode_len - offset_usize;
                const copy_len = @min(length_usize, available);
                if (copy_len > 0) {
                    const src_slice = self.bytecode.raw()[offset_usize .. offset_usize + copy_len];
                    self.memory.set_data(dest_offset_usize, src_slice) catch return Error.OutOfBounds;
                    copied = copy_len;
                }
            }
            if (copied < length_usize) {
                var i: usize = 0;
                const zero_start = dest_offset_usize + copied;
                while (i < (length_usize - copied)) : (i += 1) {
                    self.memory.set_byte(zero_start + i, 0) catch return Error.OutOfBounds;
                }
            }
        }
        /// GASPRICE opcode (0x3A) - Get price of gas in current transaction
        /// Pushes the gas price of the current transaction.
        /// Stack: [] → [gas_price]
        pub fn gasprice(self: *Self) Error!void {
            const gas_price = self.host.get_gas_price();
            const gas_price_truncated = @as(WordType, @truncate(gas_price));
            try self.stack.push(gas_price_truncated);
        }
        /// EXTCODESIZE opcode (0x3B) - Get size of account's code
        /// Pops an address and pushes the size of that account's code in bytes.
        /// Stack: [address] → [size]
        pub fn extcodesize(self: *Self) Error!void {
            const address_u256 = try self.stack.pop();
            const addr = from_u256(address_u256);
            const code = self.host.get_code(addr);
            const code_len = @as(WordType, @truncate(@as(u256, @intCast(code.len))));
            try self.stack.push(code_len);
        }
        /// EXTCODECOPY opcode (0x3C) - Copy account's code to memory
        /// Copies code from an external account to memory.
        /// Stack: [address, destOffset, offset, length] → []
        pub fn extcodecopy(self: *Self) Error!void {
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
            if (length_usize == 0) return;
            // Ensure memory capacity
            const new_size = dest_offset_usize + length_usize;
            self.memory.ensure_capacity(new_size) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            const code = self.host.get_code(addr);
            // Copy external code to memory with bounds checking
            var copied: usize = 0;
            if (offset_usize < code.len) {
                const available = code.len - offset_usize;
                const copy_len = @min(length_usize, available);
                if (copy_len > 0) {
                    const src_slice = code[offset_usize .. offset_usize + copy_len];
                    self.memory.set_data(dest_offset_usize, src_slice) catch return Error.OutOfBounds;
                    copied = copy_len;
                }
            }
            if (copied < length_usize) {
                var i: usize = 0;
                const zero_start = dest_offset_usize + copied;
                while (i < (length_usize - copied)) : (i += 1) {
                    self.memory.set_byte(zero_start + i, 0) catch return Error.OutOfBounds;
                }
            }
        }
        /// RETURNDATASIZE opcode (0x3D) - Get size of output data from previous call
        /// Pushes the size of the return data from the last call.
        /// Stack: [] → [size]
        pub fn returndatasize(self: *Self) Error!void {
            const return_data = self.host.get_return_data();
            const return_data_len = @as(WordType, @truncate(@as(u256, @intCast(return_data.len))));
            try self.stack.push(return_data_len);
        }
        /// RETURNDATACOPY opcode (0x3E) - Copy output data from previous call to memory
        /// Copies return data from the last call to memory.
        /// Stack: [destOffset, offset, length] → []
        pub fn returndatacopy(self: *Self) Error!void {
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
            if (length_usize == 0) return;
            const return_data = self.host.get_return_data();
            // Check if we're reading beyond the return data
            if (offset_usize > return_data.len or
                (offset_usize + length_usize) > return_data.len)
            {
                return Error.OutOfBounds;
            }
            // Ensure memory capacity
            const new_size = dest_offset_usize + length_usize;
            self.memory.ensure_capacity(new_size) catch |err| switch (err) {
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            // Copy return data to memory
            for (0..length_usize) |i| {
                const src_index = offset_usize + i;
                const dest_index = dest_offset_usize + i;
                const byte_val = return_data[src_index];
                self.memory.set_byte(dest_index, byte_val) catch return Error.OutOfBounds;
            }
        }
        /// EXTCODEHASH opcode (0x3F) - Get hash of account's code
        /// Pops an address and pushes the keccak256 hash of that account's code.
        /// Stack: [address] → [hash]
        pub fn extcodehash(self: *Self) Error!void {
            const address_u256 = try self.stack.pop();
            const addr = from_u256(address_u256);
            if (!self.host.account_exists(addr)) {
                // Non-existent account returns 0 per EIP-1052
                try self.stack.push(0);
                return;
            }
            const code = self.host.get_code(addr);
            if (code.len == 0) {
                // Existing account with empty code returns keccak256("") constant
                const empty_hash_u256: u256 = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
                const empty_hash_word = @as(WordType, @truncate(empty_hash_u256));
                try self.stack.push(empty_hash_word);
                return;
            }
            // Compute keccak256 hash of the code
            var hash: [32]u8 = undefined;
            keccak_asm.keccak256(code, &hash) catch return Error.OutOfBounds;
            // Convert hash to u256 (big-endian)
            var hash_u256: u256 = 0;
            for (hash) |b| {
                hash_u256 = (hash_u256 << 8) | @as(u256, b);
            }
            const hash_word = @as(WordType, @truncate(hash_u256));
            try self.stack.push(hash_word);
        }
        /// CHAINID opcode (0x46) - Get chain ID
        /// Pushes the chain ID of the current network.
        /// Stack: [] → [chain_id]
        pub fn chainid(self: *Self) Error!void {
            const chain_id = self.host.get_chain_id();
            const chain_id_word = @as(WordType, @truncate(@as(u256, chain_id)));
            try self.stack.push(chain_id_word);
        }
        /// SELFBALANCE opcode (0x47) - Get balance of currently executing account
        /// Pushes the balance of the currently executing contract.
        /// Stack: [] → [balance]
        pub fn selfbalance(self: *Self) Error!void {
            const bal = self.host.get_balance(self.contract_address);
            const balance_word = @as(WordType, @truncate(bal));
            try self.stack.push(balance_word);
        }
        // Block information opcodes
        /// BLOCKHASH opcode (0x40) - Get hash of specific block
        /// Returns the hash of one of the 256 most recent blocks.
        /// Stack: [block_number] → [hash]
        pub fn blockhash(self: *Self) Error!void {
            const block_number = try self.stack.pop();
            const block_info = self.host.get_block_info();
            const current_block = block_info.number;
            // Check bounds: not current or future blocks, and within 256 recent blocks
            if (block_number >= current_block or
                current_block > block_number + 256 or
                block_number == 0)
            {
                try self.stack.push(0);
                return;
            }
            // Get block hash from host
            // Note: block_number is u256 but get_block_hash expects u64
            const block_number_u64 = @as(u64, @intCast(block_number));
            const hash_opt = self.host.get_block_hash(block_number_u64);
            // Push hash or zero if not available
            if (hash_opt) |hash| {
                // Convert [32]u8 to u256
                var hash_u256: u256 = 0;
                for (hash) |b| {
                    hash_u256 = (hash_u256 << 8) | @as(u256, b);
                }
                const hash_word = @as(WordType, @truncate(hash_u256));
                try self.stack.push(hash_word);
            } else {
                try self.stack.push(0);
            }
        }
        /// COINBASE opcode (0x41) - Get current block miner's address
        /// Pushes the address of the miner who produced the current block.
        /// Stack: [] → [coinbase_address]
        pub fn coinbase(self: *Self) Error!void {
            const block_info = self.host.get_block_info();
            const coinbase_u256 = to_u256(block_info.coinbase);
            const coinbase_word = @as(WordType, @truncate(coinbase_u256));
            try self.stack.push(coinbase_word);
        }
        /// TIMESTAMP opcode (0x42) - Get current block timestamp
        /// Pushes the Unix timestamp of the current block.
        /// Stack: [] → [timestamp]
        pub fn timestamp(self: *Self) Error!void {
            const block_info = self.host.get_block_info();
            const timestamp_word = @as(WordType, @truncate(@as(u256, @intCast(block_info.timestamp))));
            try self.stack.push(timestamp_word);
        }
        /// NUMBER opcode (0x43) - Get current block number
        /// Pushes the number of the current block.
        /// Stack: [] → [block_number]
        pub fn number(self: *Self) Error!void {
            const block_info = self.host.get_block_info();
            const block_number_word = @as(WordType, @truncate(@as(u256, @intCast(block_info.number))));
            try self.stack.push(block_number_word);
        }
        /// DIFFICULTY opcode (0x44) - Get block difficulty or prevrandao
        /// Pre-merge: Returns difficulty. Post-merge: Returns prevrandao.
        /// Stack: [] → [difficulty/prevrandao]
        pub fn difficulty(self: *Self) Error!void {
            const block_info = self.host.get_block_info();
            const difficulty_word = @as(WordType, @truncate(block_info.difficulty));
            try self.stack.push(difficulty_word);
        }
        /// PREVRANDAO opcode - Alias for DIFFICULTY post-merge
        /// Returns the prevrandao value from the beacon chain.
        /// Stack: [] → [prevrandao]
        pub fn prevrandao(self: *Self) Error!void {
            return self.difficulty();
        }
        /// GASLIMIT opcode (0x45) - Get current block gas limit
        /// Pushes the gas limit of the current block.
        /// Stack: [] → [gas_limit]
        pub fn gaslimit(self: *Self) Error!void {
            const block_info = self.host.get_block_info();
            const gas_limit_word = @as(WordType, @truncate(@as(u256, @intCast(block_info.gas_limit))));
            try self.stack.push(gas_limit_word);
        }
        /// BASEFEE opcode (0x48) - Get current block base fee
        /// Returns the base fee per gas of the current block (EIP-3198).
        /// Stack: [] → [base_fee]
        pub fn basefee(self: *Self) Error!void {
            const block_info = self.host.get_block_info();
            const base_fee_word = @as(WordType, @truncate(block_info.base_fee));
            try self.stack.push(base_fee_word);
        }
        /// BLOBHASH opcode (0x49) - Get versioned hash of blob
        /// Returns the versioned hash of the blob at the given index (EIP-4844).
        /// Stack: [index] → [blob_hash]
        pub fn blobhash(self: *Self) Error!void {
            const index = try self.stack.pop();
            // Convert u256 to usize for array access
            if (index > std.math.maxInt(usize)) {
                try self.stack.push(0);
                return;
            }
            const blob_hash_opt = self.host.get_blob_hash(index);
            // Push hash or zero if not available
            if (blob_hash_opt) |hash| {
                // Convert [32]u8 to u256
                var hash_u256: u256 = 0;
                for (hash) |b| {
                    hash_u256 = (hash_u256 << 8) | @as(u256, b);
                }
                const hash_word = @as(WordType, @truncate(hash_u256));
                try self.stack.push(hash_word);
            } else {
                try self.stack.push(0);
            }
        }
        /// BLOBBASEFEE opcode (0x4A) - Get current blob base fee
        /// Returns the base fee per blob gas of the current block (EIP-4844).
        /// Stack: [] → [blob_base_fee]
        pub fn blobbasefee(self: *Self) Error!void {
            const blob_base_fee = self.host.get_blob_base_fee();
            const blob_base_fee_word = @as(WordType, @truncate(blob_base_fee));
            try self.stack.push(blob_base_fee_word);
        }
        // ========== LOG opcodes (0xA0-0xA4) ==========
        /// LOG0 opcode (0xA0) - Emit log with no topics
        /// Emits a log event with data but no topics.
        /// Stack: [offset, length] → []
        pub fn log0(self: *Self) Error!void {
            // Check if we're in static context
            if (self.host.get_is_static()) {
                return Error.WriteProtection;
            }
            const length = try self.stack.pop();
            const offset = try self.stack.pop();
            const data_size = @as(usize, @intCast(length));
            // Base/topic/data gas via centralized constants
            const log_gas = GasConstants.log_gas_cost(0, data_size);
            try self.consumeGasChecked(log_gas);
            // Memory expansion cost (word-aligned)
            if (offset > std.math.maxInt(usize) or length > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }
            const offset_usize = @as(usize, @intCast(offset));
            const end_unaligned = offset_usize + data_size;
            const word_aligned_end = ((end_unaligned + 31) >> 5) << 5;
            const mem_expansion_cost = self.memory.get_expansion_cost(@as(u64, @intCast(word_aligned_end)));
            const total_cost: u64 = log_gas + mem_expansion_cost;
            try self.consumeGasChecked(total_cost);
            // Ensure memory is expanded to read safely
            self.memory.ensure_capacity(word_aligned_end) catch return Error.OutOfBounds;
            const data = self.memory.get_slice(offset_usize, data_size) catch return Error.OutOfBounds;
            // Create log entry
            const allocator = self.allocator;
            const data_copy = allocator.dupe(u8, data) catch return Error.AllocationError;
            const topics_array = allocator.alloc(u256, 0) catch return Error.AllocationError;
            const log_entry = Log{
                .address = self.contract_address,
                .topics = topics_array,
                .data = data_copy,
            };
            self.logs.append(self.allocator, log_entry) catch {
                allocator.free(data_copy);
                allocator.free(topics_array);
                return Error.AllocationError;
            };
        }

        /// LOG1 opcode (0xA1) - Emit log with one topic
        /// Emits a log event with data and one topic.
        /// Stack: [offset, length, topic1] → []
        pub fn log1(self: *Self) Error!void {
            if (self.host.get_is_static()) {
                return Error.WriteProtection;
            }
            const topic1 = try self.stack.pop();
            const length = try self.stack.pop();
            const offset = try self.stack.pop();
            const data_size = @as(usize, @intCast(length));
            const log_gas = GasConstants.log_gas_cost(1, data_size);
            try self.consumeGasChecked(log_gas);
            if (offset > std.math.maxInt(usize) or length > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }
            const offset_usize = @as(usize, @intCast(offset));
            const end_unaligned = offset_usize + data_size;
            const word_aligned_end = ((end_unaligned + 31) >> 5) << 5;
            const mem_expansion_cost = self.memory.get_expansion_cost(@as(u64, @intCast(word_aligned_end)));
            const total_cost: u64 = log_gas + mem_expansion_cost;
            try self.consumeGasChecked(total_cost);
            self.memory.ensure_capacity(word_aligned_end) catch return Error.OutOfBounds;
            const data = self.memory.get_slice(offset_usize, data_size) catch return Error.OutOfBounds;
            // Create log entry
            const allocator = self.allocator;
            const data_copy = allocator.dupe(u8, data) catch return Error.AllocationError;
            const topics_array = allocator.alloc(u256, 1) catch {
                allocator.free(data_copy);
                return Error.AllocationError;
            };
            topics_array[0] = topic1;
            const log_entry = Log{
                .address = self.contract_address,
                .topics = topics_array,
                .data = data_copy,
            };
            self.logs.append(self.allocator, log_entry) catch {
                allocator.free(data_copy);
                allocator.free(topics_array);
                return Error.AllocationError;
            };
        }
        /// LOG2 opcode (0xA2) - Emit log with two topics
        /// Stack: [offset, length, topic1, topic2] → []
        pub fn log2(self: *Self) Error!void {
            if (self.host.get_is_static()) {
                return Error.WriteProtection;
            }
            const topic2 = try self.stack.pop();
            const topic1 = try self.stack.pop();
            const length = try self.stack.pop();
            const offset = try self.stack.pop();
            const data_size = @as(usize, @intCast(length));
            const log_gas = GasConstants.log_gas_cost(2, data_size);
            try self.consumeGasChecked(log_gas);
            if (offset > std.math.maxInt(usize) or length > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }
            const offset_usize = @as(usize, @intCast(offset));
            const end_unaligned = offset_usize + data_size;
            const word_aligned_end = ((end_unaligned + 31) >> 5) << 5;
            const mem_expansion_cost = self.memory.get_expansion_cost(@as(u64, @intCast(word_aligned_end)));
            const total_cost: u64 = log_gas + mem_expansion_cost;
            try self.consumeGasChecked(total_cost);
            self.memory.ensure_capacity(word_aligned_end) catch return Error.OutOfBounds;
            const data = self.memory.get_slice(offset_usize, data_size) catch return Error.OutOfBounds;
            const allocator = self.allocator;
            const data_copy = allocator.dupe(u8, data) catch return Error.AllocationError;
            const topics_array = allocator.alloc(u256, 2) catch {
                allocator.free(data_copy);
                return Error.AllocationError;
            };
            topics_array[0] = topic1;
            topics_array[1] = topic2;
            const log_entry = Log{
                .address = self.contract_address,
                .topics = topics_array,
                .data = data_copy,
            };
            self.logs.append(self.allocator, log_entry) catch {
                allocator.free(data_copy);
                allocator.free(topics_array);
                return Error.AllocationError;
            };
        }
        /// LOG3 opcode (0xA3) - Emit log with three topics
        /// Stack: [offset, length, topic1, topic2, topic3] → []
        pub fn log3(self: *Self) Error!void {
            if (self.host.get_is_static()) {
                return Error.WriteProtection;
            }
            const topic3 = try self.stack.pop();
            const topic2 = try self.stack.pop();
            const topic1 = try self.stack.pop();
            const length = try self.stack.pop();
            const offset = try self.stack.pop();
            const data_size = @as(usize, @intCast(length));
            const log_gas = GasConstants.log_gas_cost(3, data_size);
            try self.consumeGasChecked(log_gas);
            if (offset > std.math.maxInt(usize) or length > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }
            const offset_usize = @as(usize, @intCast(offset));
            const end_unaligned = offset_usize + data_size;
            const word_aligned_end = ((end_unaligned + 31) >> 5) << 5;
            const mem_expansion_cost = self.memory.get_expansion_cost(@as(u64, @intCast(word_aligned_end)));
            const total_cost: u64 = log_gas + mem_expansion_cost;
            try self.consumeGasChecked(total_cost);
            self.memory.ensure_capacity(word_aligned_end) catch return Error.OutOfBounds;
            const data = self.memory.get_slice(offset_usize, data_size) catch return Error.OutOfBounds;
            const allocator = self.allocator;
            const data_copy = allocator.dupe(u8, data) catch return Error.AllocationError;
            const topics_array = allocator.alloc(u256, 3) catch {
                allocator.free(data_copy);
                return Error.AllocationError;
            };
            topics_array[0] = topic1;
            topics_array[1] = topic2;
            topics_array[2] = topic3;
            const log_entry = Log{
                .address = self.contract_address,
                .topics = topics_array,
                .data = data_copy,
            };
            self.logs.append(self.allocator, log_entry) catch {
                allocator.free(data_copy);
                allocator.free(topics_array);
                return Error.AllocationError;
            };
        }
        /// LOG4 opcode (0xA4) - Emit log with four topics
        /// Stack: [offset, length, topic1, topic2, topic3, topic4] → []
        pub fn log4(self: *Self) Error!void {
            if (self.host.get_is_static()) {
                return Error.WriteProtection;
            }
            const topic4 = try self.stack.pop();
            const topic3 = try self.stack.pop();
            const topic2 = try self.stack.pop();
            const topic1 = try self.stack.pop();
            const length = try self.stack.pop();
            const offset = try self.stack.pop();
            const data_size = @as(usize, @intCast(length));
            const log_gas = GasConstants.log_gas_cost(4, data_size);
            try self.consumeGasChecked(log_gas);
            if (offset > std.math.maxInt(usize) or length > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }
            const offset_usize = @as(usize, @intCast(offset));
            const end_unaligned = offset_usize + data_size;
            const word_aligned_end = ((end_unaligned + 31) >> 5) << 5;
            const mem_expansion_cost = self.memory.get_expansion_cost(@as(u64, @intCast(word_aligned_end)));
            const total_cost: u64 = log_gas + mem_expansion_cost;
            try self.consumeGasChecked(total_cost);
            self.memory.ensure_capacity(word_aligned_end) catch return Error.OutOfBounds;
            const data = self.memory.get_slice(offset_usize, data_size) catch return Error.OutOfBounds;
            const allocator = self.allocator;
            const data_copy = allocator.dupe(u8, data) catch return Error.AllocationError;
            const topics_array = allocator.alloc(u256, 4) catch {
                allocator.free(data_copy);
                return Error.AllocationError;
            };
            topics_array[0] = topic1;
            topics_array[1] = topic2;
            topics_array[2] = topic3;
            topics_array[3] = topic4;
            const log_entry = Log{
                .address = self.contract_address,
                .topics = topics_array,
                .data = data_copy,
            };
            self.logs.append(self.allocator, log_entry) catch {
                allocator.free(data_copy);
                allocator.free(topics_array);
                return Error.AllocationError;
            };
        }
        // ========== COMPREHENSIVE ETHEREUM TESTS INTEGRATION ==========
        // Based on official Ethereum tests: https://github.com/ethereum/tests
        // These tests follow the patterns from VMTests, GeneralStateTests, etc.
        // System transaction opcodes
        /// Calculate gas cost for CALL operations based on EIP-150 and EIP-2929
        ///
        /// ## Parameters
        /// - `target_address`: Target contract address
        /// - `value`: Value being transferred (0 for no value transfer)
        /// - `is_static`: Whether this is a static call context
        ///
        /// ## Returns
        /// - Gas cost for the call operation before gas forwarding
        fn _calculate_call_gas(self: *Self, target_address: Address, value: u256, is_static: bool) u64 {
            // Check if target account exists using database interface
            const new_account = blk: {
                if (config.has_database) {
                    if (self.database) |db| {
                        // Try to get the account from the database
                        const account_result = db.get_account(target_address.bytes) catch {
                            // On database error, assume account doesn't exist (conservative approach)
                            break :blk true;
                        };
                        if (account_result) |account| {
                            // Account exists if it has any of: non-zero nonce, non-zero balance, or non-empty code
                            const exists = account.nonce > 0 or
                                account.balance > 0 or
                                !std.mem.eql(u8, &account.code_hash, &primitives.EMPTY_CODE_HASH);
                            break :blk !exists;
                        } else {
                            // Account not found in database
                            break :blk true;
                        }
                    } else {
                        // No database available, assume account doesn't exist
                        break :blk true;
                    }
                } else {
                    // No database configured, assume account doesn't exist
                    break :blk true;
                }
            };
            // Check if this is a cold access using the Host's access list (EIP-2929)
            // Cold/warm access costs were introduced in the Berlin hardfork
            const cold_access = blk: {
                // Check if we're at least at Berlin hardfork (EIP-2929)
                const is_berlin_or_later = self.host.vtable.is_hardfork_at_least(self.host.ptr, .BERLIN);
                if (!is_berlin_or_later) {
                    // Pre-Berlin hardforks don't have cold/warm access distinction
                    break :blk false;
                }
                // Access the address and get the gas cost
                const access_cost = self.host.vtable.access_address(self.host.ptr, target_address) catch {
                    // On error, assume cold access (conservative approach for gas costs)
                    break :blk true;
                };
                // If access cost equals cold access cost, it was a cold access
                break :blk access_cost == primitives.GasConstants.ColdAccountAccessCost;
            };
            // Value transfer check
            const value_transfer = value > 0 and !is_static;
            // Check if target is a precompile contract
            const is_precompile = self.is_precompile_address(target_address);
            // Precompile calls are considered existing accounts (never new)
            const effective_new_account = new_account and !is_precompile;
            // Calculate base call cost using the centralized gas calculation function
            return GasConstants.call_gas_cost(value_transfer, effective_new_account, cold_access);
        }
        /// Check if an address is a precompile contract
        ///
        /// Precompiles are special contracts at addresses 0x01 through 0x0A that provide
        /// cryptographic functions and utilities with deterministic gas costs.
        ///
        /// ## Parameters
        /// - `address`: The address to check
        ///
        /// ## Returns
        /// - `true` if the address is a precompile, `false` otherwise
        fn is_precompile_address(self: *Self, addr: Address) bool {
            _ = self; // Not used but kept for consistency with method signature
            // Check if all bytes except the last one are zero
            for (addr.bytes[0..19]) |addr_byte| {
                if (addr_byte != 0) return false;
            }
            // Check if the last byte is between 1 and 10 (0x01 to 0x0A)
            return addr.bytes[19] >= 1 and addr.bytes[19] <= 10;
        }
        /// CALL opcode (0xF1) - Call another contract
        /// Calls the contract at the given address with the provided value, input data, and gas.
        /// Stack: [gas, address, value, input_offset, input_size, output_offset, output_size] → [success]
        pub fn call(self: *Self) Error!void {
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
                return;
            }
            const gas_u64 = @as(u64, @intCast(gas_param));
            // Bounds checking for memory offsets and sizes
            if (input_offset > std.math.maxInt(usize) or
                input_size > std.math.maxInt(usize) or
                output_offset > std.math.maxInt(usize) or
                output_size > std.math.maxInt(usize))
            {
                try self.stack.push(0);
                return;
            }
            const input_offset_usize = @as(usize, @intCast(input_offset));
            const input_size_usize = @as(usize, @intCast(input_size));
            const output_offset_usize = @as(usize, @intCast(output_offset));
            const output_size_usize = @as(usize, @intCast(output_size));
            // Ensure memory capacity for both input and output
            const input_end = input_offset_usize + input_size_usize;
            const output_end = output_offset_usize + output_size_usize;
            const max_memory_needed = @max(input_end, output_end);
            self.memory.ensure_capacity(max_memory_needed) catch {
                try self.stack.push(0);
                return;
            };
            // Extract input data from memory
            const input_data = if (input_size_usize == 0)
                &[_]u8{}
            else
                self.memory.get_slice(input_offset_usize, input_size_usize) catch &[_]u8{};
            // Calculate base call gas cost (EIP-150 & EIP-2929)
            const base_call_gas = self._calculate_call_gas(addr, value, self.host.get_is_static());
            // Check if we have enough gas for the base call cost
            if (self.gas_remaining < @as(GasType, @intCast(base_call_gas))) {
                try self.stack.push(0);
                return;
            }
            // Consume base call gas
            self.gas_remaining -= @as(GasType, @intCast(base_call_gas));
            // Apply EIP-150 gas forwarding rule: 63/64 of available gas
            const gas_stipend = if (value > 0) @as(u64, 2300) else 0; // Gas stipend for value transfer
            const remaining_gas = @as(u64, @intCast(@max(self.gas_remaining, 0)));
            const max_forward_gas = remaining_gas - (remaining_gas / 64);
            const forwarded_gas = @min(gas_u64, max_forward_gas) + gas_stipend;
            // Create snapshot for potential revert
            const snapshot_id = self.host.create_snapshot();
            // Execute the call
            const call_params = CallParams{ .call = .{
                .caller = self.contract_address,
                .to = addr,
                .value = value,
                .input = input_data,
                .gas = forwarded_gas,
            } };
            const result = self.host.inner_call(call_params) catch {
                self.host.revert_to_snapshot(snapshot_id);
                try self.stack.push(0);
                return;
            };
            // Handle the result
            if (result.success) {
                // Copy return data to output memory if it fits
                const copy_size = @min(output_size_usize, result.output.len);
                if (copy_size > 0) {
                    self.memory.set_data(output_offset_usize, result.output[0..copy_size]) catch {};
                }
                try self.stack.push(1); // Success
            } else {
                self.host.revert_to_snapshot(snapshot_id);
                try self.stack.push(0); // Failure
            }
            // Update gas accounting
            const gas_cost = forwarded_gas - result.gas_left;
            if (self.gas_remaining >= @as(GasType, @intCast(gas_cost))) {
                self.gas_remaining -= @as(GasType, @intCast(gas_cost));
            } else {
                // If gas cost exceeds remaining, consume all remaining gas
                self.gas_remaining = 0;
            }
        }
        /// DELEGATECALL opcode (0xF4) - Call another contract preserving caller context
        /// Calls the contract at the given address, but preserves the caller and value from the current context.
        /// Stack: [gas, address, input_offset, input_size, output_offset, output_size] → [success]
        pub fn delegatecall(self: *Self) Error!void {
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
                return;
            }
            const gas_u64 = @as(u64, @intCast(gas_param));
            // Bounds checking for memory offsets and sizes
            if (input_offset > std.math.maxInt(usize) or
                input_size > std.math.maxInt(usize) or
                output_offset > std.math.maxInt(usize) or
                output_size > std.math.maxInt(usize))
            {
                try self.stack.push(0);
                return;
            }
            const input_offset_usize = @as(usize, @intCast(input_offset));
            const input_size_usize = @as(usize, @intCast(input_size));
            const output_offset_usize = @as(usize, @intCast(output_offset));
            const output_size_usize = @as(usize, @intCast(output_size));
            // Ensure memory capacity
            const input_end = input_offset_usize + input_size_usize;
            const output_end = output_offset_usize + output_size_usize;
            const max_memory_needed = @max(input_end, output_end);
            self.memory.ensure_capacity(max_memory_needed) catch {
                try self.stack.push(0);
                return;
            };
            // Extract input data from memory
            const input_data = if (input_size_usize == 0)
                &[_]u8{}
            else
                self.memory.get_slice(input_offset_usize, input_size_usize) catch &[_]u8{};
            // Calculate base call gas cost (EIP-150 & EIP-2929) - DELEGATECALL never transfers value
            // is_static flag now retrieved via host; default to false in this older test path
            const base_call_gas = self._calculate_call_gas(addr, 0, false);
            // Check if we have enough gas for the base call cost
            if (self.gas_remaining < @as(GasType, @intCast(base_call_gas))) {
                try self.stack.push(0);
                return;
            }
            // Consume base call gas
            self.gas_remaining -= @as(GasType, @intCast(base_call_gas));
            // Apply EIP-150 gas forwarding rule: 63/64 of available gas
            const remaining_gas = @as(u64, @intCast(@max(self.gas_remaining, 0)));
            const max_forward_gas = remaining_gas - (remaining_gas / 64);
            const forwarded_gas = @min(gas_u64, max_forward_gas);
            // Create snapshot for potential revert
            const snapshot_id = self.host.create_snapshot();
            // Execute the delegatecall - note: caller context is preserved by the host
            const call_params = CallParams{
                .delegatecall = .{
                    .caller = self.contract_address, // Preserve original caller context
                    .to = addr,
                    .input = input_data,
                    .gas = forwarded_gas,
                },
            };
            const result = self.host.inner_call(call_params) catch {
                self.host.revert_to_snapshot(snapshot_id);
                try self.stack.push(0);
                return;
            };
            // Handle the result
            if (result.success) {
                // Copy return data to output memory if it fits
                const copy_size = @min(output_size_usize, result.output.len);
                if (copy_size > 0) {
                    self.memory.set_data(output_offset_usize, result.output[0..copy_size]) catch {};
                }
                try self.stack.push(1); // Success
            } else {
                self.host.revert_to_snapshot(snapshot_id);
                try self.stack.push(0); // Failure
            }
            // Update gas accounting
            const gas_cost = forwarded_gas - result.gas_left;
            if (self.gas_remaining >= @as(GasType, @intCast(gas_cost))) {
                self.gas_remaining -= @as(GasType, @intCast(gas_cost));
            } else {
                // If gas cost exceeds remaining, consume all remaining gas
                self.gas_remaining = 0;
            }
        }
        /// STATICCALL opcode (0xFA) - Call another contract in read-only mode
        /// Calls the contract at the given address without allowing any state changes.
        /// Stack: [gas, address, input_offset, input_size, output_offset, output_size] → [success]
        pub fn staticcall(self: *Self) Error!void {
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
                return;
            }
            const gas_u64 = @as(u64, @intCast(gas_param));
            // Bounds checking for memory offsets and sizes
            if (input_offset > std.math.maxInt(usize) or
                input_size > std.math.maxInt(usize) or
                output_offset > std.math.maxInt(usize) or
                output_size > std.math.maxInt(usize))
            {
                try self.stack.push(0);
                return;
            }
            const input_offset_usize = @as(usize, @intCast(input_offset));
            const input_size_usize = @as(usize, @intCast(input_size));
            const output_offset_usize = @as(usize, @intCast(output_offset));
            const output_size_usize = @as(usize, @intCast(output_size));
            // Ensure memory capacity
            const input_end = input_offset_usize + input_size_usize;
            const output_end = output_offset_usize + output_size_usize;
            const max_memory_needed = @max(input_end, output_end);
            self.memory.ensure_capacity(max_memory_needed) catch {
                try self.stack.push(0);
                return;
            };
            // Extract input data from memory
            const input_data = if (input_size_usize == 0)
                &[_]u8{}
            else
                self.memory.get_slice(input_offset_usize, input_size_usize) catch &[_]u8{};
            // Calculate base call gas cost (EIP-150 & EIP-2929) - STATICCALL never transfers value
            const base_call_gas = self._calculate_call_gas(addr, 0, true);
            // Check if we have enough gas for the base call cost
            if (self.gas_remaining < @as(GasType, @intCast(base_call_gas))) {
                try self.stack.push(0);
                return;
            }
            // Consume base call gas
            self.gas_remaining -= @as(GasType, @intCast(base_call_gas));
            // Apply EIP-150 gas forwarding rule: 63/64 of available gas
            const remaining_gas = @as(u64, @intCast(@max(self.gas_remaining, 0)));
            const max_forward_gas = remaining_gas - (remaining_gas / 64);
            const forwarded_gas = @min(gas_u64, max_forward_gas);
            // Execute the staticcall
            const call_params = CallParams{ .staticcall = .{
                .caller = self.contract_address,
                .to = addr,
                .input = input_data,
                .gas = forwarded_gas,
            } };
            const result = self.host.inner_call(call_params) catch {
                try self.stack.push(0);
                return;
            };
            // Handle the result - no state changes can be made in staticcall
            if (result.success) {
                // Copy return data to output memory if it fits
                const copy_size = @min(output_size_usize, result.output.len);
                if (copy_size > 0) {
                    self.memory.set_data(output_offset_usize, result.output[0..copy_size]) catch {};
                }
                try self.stack.push(1); // Success
            } else {
                try self.stack.push(0); // Failure
            }
            // Update gas accounting
            const gas_cost = forwarded_gas - result.gas_left;
            if (self.gas_remaining >= @as(GasType, @intCast(gas_cost))) {
                self.gas_remaining -= @as(GasType, @intCast(gas_cost));
            } else {
                // If gas cost exceeds remaining, consume all remaining gas
                self.gas_remaining = 0;
            }
        }
        /// CREATE opcode (0xF0) - Create a new contract
        /// Creates a new contract using the provided initialization code and value.
        /// Stack: [value, offset, size] → [address]
        pub fn create(self: *Self) Error!void {
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
                return;
            }
            const offset_usize = @as(usize, @intCast(offset));
            const size_usize = @as(usize, @intCast(size));
            // Ensure memory capacity
            const memory_end = offset_usize + size_usize;
            self.memory.ensure_capacity(memory_end) catch {
                try self.stack.push(0);
                return;
            };
            // Extract init code from memory
            const input_data = if (size_usize == 0)
                &[_]u8{}
            else
                self.memory.get_slice(offset_usize, size_usize) catch &[_]u8{};
            // Apply EIP-150 gas forwarding rule: 63/64 of available gas
            const remaining_gas = @as(u64, @intCast(@max(self.gas_remaining, 0)));
            const max_forward_gas = remaining_gas - (remaining_gas / 64);
            const forwarded_gas = max_forward_gas;
            // Create snapshot for potential revert
            const snapshot_id = self.host.create_snapshot();
            // Execute the create
            const call_params = CallParams{ .create = .{
                .caller = self.contract_address,
                .value = value,
                .init_code = input_data,
                .gas = forwarded_gas,
            } };
            const result = self.host.inner_call(call_params) catch {
                self.host.revert_to_snapshot(snapshot_id);
                try self.stack.push(0);
                return;
            };
            // Handle the result
            if (result.success and result.output.len >= 20) {
                // Extract the created contract address from output
                var address_bytes: [20]u8 = undefined;
                @memcpy(&address_bytes, result.output[0..20]);
                const addr: Address = address_bytes;
                const address_u256 = to_u256(addr);
                try self.stack.push(address_u256);
            } else {
                self.host.revert_to_snapshot(snapshot_id);
                try self.stack.push(0); // Failure
            }
            // Update gas accounting
            const gas_cost = forwarded_gas - result.gas_left;
            if (self.gas_remaining >= @as(GasType, @intCast(gas_cost))) {
                self.gas_remaining -= @as(GasType, @intCast(gas_cost));
            } else {
                // If gas cost exceeds remaining, consume all remaining gas
                self.gas_remaining = 0;
            }
        }

        /// CREATE2 opcode (0xF5) - Create a new contract with deterministic address
        /// Creates a new contract with an address determined by the salt and init code hash.
        /// Stack: [value, offset, size, salt] → [address]
        pub fn create2(self: *Self) Error!void {
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
                return;
            }
            const offset_usize = @as(usize, @intCast(offset));
            const size_usize = @as(usize, @intCast(size));
            // Ensure memory capacity
            const memory_end = offset_usize + size_usize;
            self.memory.ensure_capacity(memory_end) catch {
                try self.stack.push(0);
                return;
            };
            // Extract init code from memory
            const input_data = if (size_usize == 0)
                &[_]u8{}
            else
                self.memory.get_slice(offset_usize, size_usize) catch &[_]u8{};
            // Apply EIP-150 gas forwarding rule: 63/64 of available gas
            const remaining_gas = @as(u64, @intCast(@max(self.gas_remaining, 0)));
            const max_forward_gas = remaining_gas - (remaining_gas / 64);
            const forwarded_gas = max_forward_gas;
            // Create snapshot for potential revert
            const snapshot_id = self.host.create_snapshot();
            // Execute the create2
            const call_params = CallParams{ .create2 = .{
                .caller = self.contract_address,
                .value = value,
                .init_code = input_data,
                .salt = salt,
                .gas = forwarded_gas,
            } };
            const result = self.host.inner_call(call_params) catch {
                self.host.revert_to_snapshot(snapshot_id);
                try self.stack.push(0);
                return;
            };
            // Handle the result
            if (result.success and result.output.len >= 20) {
                // Extract the created contract address from output
                var address_bytes: [20]u8 = undefined;
                @memcpy(&address_bytes, result.output[0..20]);
                const addr: Address = address_bytes;
                const address_u256 = to_u256(addr);
                try self.stack.push(address_u256);
            } else {
                self.host.revert_to_snapshot(snapshot_id);
                try self.stack.push(0); // Failure
            }
            // Update gas accounting
            const gas_cost = forwarded_gas - result.gas_left;
            if (self.gas_remaining >= @as(GasType, @intCast(gas_cost))) {
                self.gas_remaining -= @as(GasType, @intCast(gas_cost));
            } else {
                // If gas cost exceeds remaining, consume all remaining gas
                self.gas_remaining = 0;
            }
        }
        /// RETURN opcode (0xF3) - Halt execution returning data
        /// Halts execution and returns data from memory.
        /// Stack: [offset, size] → []
        pub fn @"return"(self: *Self) Error!Success {
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
            // Apply EIP-3529 refund cap at return
            if (self.gas_refund > 0) {
                const start: u64 = @max(self.initial_gas, 0);
                const remain: u64 = @max(self.gas_remaining, 0);
                const used: u64 = if (start > remain) start - remain else 0;
                const cap: u64 = used / 5;
                const credit: u64 = if (self.gas_refund > cap) cap else self.gas_refund;
                const new_remaining: u128 = @as(u128, @intCast(remain)) + credit;
                self.gas_remaining = @as(GasType, @intCast(@min(new_remaining, @as(u128, @intCast(std.math.maxInt(GasType))))));
                self.gas_refund = 0;
            }
            return Success.Return;
        }
        /// REVERT opcode (0xFD) - Halt execution reverting state changes
        /// Halts execution, reverts state changes, and returns data from memory.
        /// Stack: [offset, size] → []
        pub fn revert(self: *Self) Error!void {
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
            return Error.REVERT;
        }
        /// SELFDESTRUCT opcode (0xFF) - Mark contract for destruction
        /// Marks the current contract for destruction and transfers its balance to the recipient.
        /// Stack: [recipient] → []
        pub fn selfdestruct(self: *Self) Error!Success {
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

        fn dup_bulk_simd(self: *Self, comptime L: comptime_int, indices: []const u8) Error!void {
            if (config.vector_length == 0 or L == 0) {
                // Fallback to scalar operations
                for (indices) |n| {
                    try self.stack.dup_n(n);
                }
                return;
            }
            // Bounds check: ensure we have enough stack items for all operations
            const stack_slice = self.stack.get_slice();
            for (indices) |n| {
                if (n == 0 or n > stack_slice.len) {
                    return Error.StackUnderflow;
                }
            }
            // Check if we have room for all the new items
            if (stack_slice.len + indices.len > Stack.stack_capacity) {
                return Error.StackOverflow;
            }
            // Perform SIMD-optimized bulk duplication
            // Process in chunks of L
            var i: usize = 0;
            while (i < indices.len) : (i += L) {
                const chunk_size = @min(L, indices.len - i);
                const chunk = indices[i .. i + chunk_size];
                // Load vector of values to duplicate
                var values: @Vector(L, WordType) = @splat(0);
                for (chunk, 0..) |n, j| {
                    values[j] = stack_slice[n - 1]; // n-1 because stack is 1-indexed for DUP
                }
                // Push values to stack
                for (0..chunk_size) |j| {
                    try self.stack.push(values[j]);
                }
            }
        }
        /// SIMD-accelerated bulk SWAP operations for sequential exchange operations
        ///
        /// Optimizes execution when multiple SWAP operations are performed in sequence by using
        /// vector operations to coordinate multiple exchanges simultaneously. This reduces the
        /// overhead of individual stack manipulations for bytecode with many consecutive swaps.
        ///
        /// ## How SIMD Optimization Works
        ///
        /// Traditional scalar approach processes each SWAP individually:
        /// ```
        /// SWAP1: exchange stack[0] ↔ stack[1]
        /// SWAP2: exchange stack[0] ↔ stack[2]
        /// SWAP4: exchange stack[0] ↔ stack[4]
        /// ```
        ///
        /// SIMD approach optimizes the coordination:
        /// ```
        /// Load vectors: top_vals = [stack[0], stack[0], stack[0]]
        ///              target_vals = [stack[1], stack[2], stack[4]]
        /// Coordinate swaps with reduced overhead and better cache usage
        /// ```
        ///
        /// ## Performance Benefits
        /// - Reduces overhead from repeated stack API calls
        /// - Better instruction-level parallelism for swap coordination
        /// - Improved cache locality when accessing nearby stack elements
        /// - Automatic fallback to scalar when SIMD unavailable
        ///
        /// @param L: Vector length (compile-time known, from config.vector_length)
        /// @param indices: Array of SWAP indices (1-16, positions to swap with top)
        fn swap_bulk_simd(self: *Self, indices: []const u8, L: usize) !void {
            if (config.vector_length == 0 or L == 0) {
                // Fallback to scalar operations
                for (indices) |n| {
                    try self.stack.swap_n(n);
                }
                return;
            }
            // Bounds check: ensure we have enough stack items for all operations
            const stack_slice = self.stack.get_slice();
            for (indices) |n| {
                if (n + 1 > stack_slice.len) { // SWAP needs n+1 items
                    return Error.StackUnderflow;
                }
            }
            // SIMD optimization: collect all values to swap in vectors first
            // Process in chunks of L
            var i: usize = 0;
            while (i < indices.len) : (i += L) {
                const chunk_size = @min(L, indices.len - i);
                const chunk = indices[i .. i + chunk_size];
                // Load vectors of values to swap using current slice state
                var top_values: @Vector(L, WordType) = @splat(0);
                var target_values: @Vector(L, WordType) = @splat(0);
                for (chunk, 0..) |n, j| {
                    const current_slice = self.stack.get_slice();
                    top_values[j] = current_slice[0]; // Top of stack
                    target_values[j] = current_slice[n]; // nth item from top
                }
                // Perform individual swaps using stack API
                for (chunk) |n| {
                    try self.stack.swap_n(n);
                }
            }
        }
        /// Enhanced DUP operation with automatic SIMD optimization
        ///
        /// Intelligently chooses between SIMD and scalar implementations based on the configured
        /// vector length. When SIMD is available and beneficial (vector_length >= 4), uses the
        /// vectorized path for potential performance improvements. Otherwise, falls back to the
        /// proven scalar implementation.
        ///
        /// ## When SIMD is Used
        /// - Vector length configured > 0 (SIMD support detected)
        /// - Vector length >= 4 (sufficient width for meaningful optimization)
        /// - Single operation can benefit from vector coordination
        ///
        /// ## Automatic Fallback
        /// - SIMD unsupported: Falls back to stack.dup_n()
        /// - Vector length too small: Uses scalar path
        /// - Runtime errors: Propagated normally
        ///
        /// @param n: DUP index (1-16, which stack position to duplicate)
        pub fn dup_simd(self: *Self, n: u8) Error!void {
            if (comptime config.vector_length > 0 and config.vector_length >= 4) {
                // Use SIMD for single DUP if vector length supports it
                const indices = [_]u8{n};
                return self.dup_bulk_simd(&indices, config.vector_length);
            } else {
                // Fallback to existing implementation
                return self.stack.dup_n(n);
            }
        }
        /// Enhanced SWAP operation with automatic SIMD optimization
        ///
        /// Intelligently chooses between SIMD and scalar implementations based on the configured
        /// vector length. When SIMD is available and beneficial, uses the vectorized path for
        /// coordinating exchanges more efficiently than individual scalar swaps.
        ///
        /// ## When SIMD is Used
        /// - Vector length configured > 0 (SIMD support detected)
        /// - Vector length >= 4 (sufficient width for coordination benefits)
        /// - Can leverage vector registers for improved instruction scheduling
        ///
        /// ## Automatic Fallback
        /// - SIMD unsupported: Falls back to stack.swap_n()
        /// - Vector length too small: Uses scalar path
        /// - Maintains identical semantics and error handling
        ///
        /// @param n: SWAP index (1-16, which stack position to exchange with top)
        pub fn swap_simd(self: *Self, n: u8) Error!void {
            if (comptime config.vector_length > 0 and config.vector_length >= 4) {
                // Use SIMD for single SWAP if vector length supports it
                const indices = [_]u8{n};
                return self.swap_bulk_simd(&indices, config.vector_length);
            } else {
                // Fallback to existing implementation
                return self.stack.swap_n(n);
            }
        }

        // Synthetic opcode handlers for optimized operations (placeholder implementations)
        pub fn push_add_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline value from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const push_value = metadata.value;

            // Pop top value and add the pushed value
            const a = try self.stack.pop();
            const result = a +% push_value;
            try self.stack.push(result);

            // Continue to next operation (skip metadata)
            const next = schedule.skipMetadata();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_add_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to u256 value from schedule metadata
            const metadata = schedule.getPointerMetadata();
            const push_value = metadata.value.*;

            // Pop top value and add the pushed value
            const a = try self.stack.pop();
            const result = a +% push_value;
            try self.stack.push(result);

            // Continue to next operation (skip metadata)
            const next = schedule.skipMetadata();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_mul_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline value from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const push_value = metadata.value;

            // Pop top value and multiply with the pushed value
            const a = try self.stack.pop();
            const result = a *% push_value;
            try self.stack.push(result);

            // Continue to next operation (skip metadata)
            const next = schedule.skipMetadata();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_mul_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to u256 value from schedule metadata
            const metadata = schedule.getPointerMetadata();
            const push_value = metadata.value.*;

            // Pop top value and multiply with the pushed value
            const a = try self.stack.pop();
            const result = a *% push_value;
            try self.stack.push(result);

            // Continue to next operation (skip metadata)
            const next = schedule.skipMetadata();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_div_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline divisor from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const divisor = metadata.value;

            // Pop dividend and perform division
            const a = try self.stack.pop();
            const result = if (divisor == 0) 0 else a / divisor;
            try self.stack.push(result);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_div_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to divisor value from schedule metadata
            const metadata = schedule.getPointerMetadata();
            const divisor = metadata.value.*;

            // Pop dividend and perform division
            const a = try self.stack.pop();
            const result = if (divisor == 0) 0 else a / divisor;
            try self.stack.push(result);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_sub_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline value from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const push_value = metadata.value;

            // Pop top value and subtract the pushed value
            const a = try self.stack.pop();
            const result = a -% push_value;
            try self.stack.push(result);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_sub_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to value from schedule metadata
            const metadata = schedule.getPointerMetadata();
            const push_value = metadata.value.*;

            // Pop top value and subtract the pushed value
            const a = try self.stack.pop();
            const result = a -% push_value;
            try self.stack.push(result);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_jump_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline jump target from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const target = metadata.value;

            // Validate jump destination
            if (!self.is_valid_jump_dest(@intCast(target))) {
                return Error.InvalidJump;
            }

            // Push target to stack for upper layer to handle
            try self.stack.push(@intCast(target));
            return Success.Jump;
        }

        pub fn push_jump_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to jump target from schedule metadata
            const metadata_ptr: *const Schedule.PushPointerMetadata = @ptrCast(&schedule.schedule[1]);
            const target_value = metadata_ptr.value.*;
            const target: usize = @intCast(target_value);

            // Validate jump destination
            if (!self.is_valid_jump_dest(target)) {
                return Error.InvalidJump;
            }

            // Push target to stack for upper layer to handle
            try self.stack.push(target_value);
            return Success.Jump;
        }

        pub fn push_jumpi_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline jump target from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const target = metadata.value;

            // Pop condition
            const condition = try self.stack.pop();

            if (condition != 0) {
                // Validate jump destination
                if (!self.is_valid_jump_dest(@intCast(target))) {
                    return Error.InvalidJump;
                }
                // Push target for upper layer to handle
                try self.stack.push(@intCast(target));
                return Success.Jump;
            } else {
                // No jump - continue to next instruction
                const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }
        }

        pub fn push_jumpi_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to jump target from schedule metadata
            const metadata_ptr: *const Schedule.PushPointerMetadata = @ptrCast(&schedule.schedule[1]);
            const target_value = metadata_ptr.value.*;
            const target: usize = @intCast(target_value);

            // Pop condition
            const condition = try self.stack.pop();

            if (condition != 0) {
                // Validate jump destination
                if (!self.is_valid_jump_dest(target)) {
                    return Error.InvalidJump;
                }
                // Push target for upper layer to handle
                try self.stack.push(target_value);
                return Success.Jump;
            } else {
                // No jump - continue to next instruction
                const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }
        }

        // Memory operation synthetic handlers
        pub fn push_mload_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline offset from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const offset = metadata.value;

            // Calculate memory expansion cost
            const memory_expansion_cost = try self.memory.expansion_cost(@intCast(offset), 32);
            // Only consume dynamic memory expansion cost (static gas handled at upper layer)
            if (self.gas_remaining < memory_expansion_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(memory_expansion_cost);

            // Load value from memory and push to stack
            const value = self.memory.get_u256_evm(@intCast(offset));
            try self.stack.push(value);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_mload_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to offset value from schedule metadata
            const metadata = schedule.getPointerMetadata();
            const offset_value = metadata.value.*;
            const offset: u32 = @intCast(offset_value);

            // Calculate memory expansion cost
            const memory_expansion_cost = try self.memory.expansion_cost(offset, 32);
            // Only consume dynamic memory expansion cost (static gas handled at upper layer)
            if (self.gas_remaining < memory_expansion_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(memory_expansion_cost);

            // Load value from memory and push to stack
            const value = self.memory.get_u256_evm(offset);
            try self.stack.push(value);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_mstore_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline offset from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const offset = metadata.value;

            // Pop value from stack and store at the pushed offset
            const value = try self.stack.pop();

            // Calculate memory expansion cost if needed
            const memory_expansion_cost = try self.memory.expansion_cost(@intCast(offset), 32);
            // Only consume dynamic memory expansion cost (static gas handled at upper layer)
            if (self.gas_remaining < memory_expansion_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(memory_expansion_cost);

            // Perform memory write
            try self.memory.set_u256_evm(@intCast(offset), value);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_mstore_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to offset value from schedule metadata
            const metadata = schedule.getPointerMetadata();
            const offset_value = metadata.value.*;
            const offset: u32 = @intCast(offset_value); // Truncate to reasonable memory offset

            // Pop value from stack and store at the pushed offset
            const value = try self.stack.pop();

            // Calculate memory expansion cost if needed
            const memory_expansion_cost = try self.memory.expansion_cost(offset, 32);
            // Only consume dynamic memory expansion cost (static gas handled at upper layer)
            if (self.gas_remaining < memory_expansion_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(memory_expansion_cost);

            // Perform memory write
            try self.memory.set_u256_evm(offset, value);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        // Bitwise operation synthetic handlers
        pub fn push_and_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline value from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const push_value = metadata.value;

            // Pop top value and perform bitwise AND
            const a = try self.stack.pop();
            const result = a & push_value;
            try self.stack.push(result);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_and_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to value from schedule metadata
            const metadata = schedule.getPointerMetadata();
            const push_value = metadata.value.*;

            // Pop top value and perform bitwise AND
            const a = try self.stack.pop();
            const result = a & push_value;
            try self.stack.push(result);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_or_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline value from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const push_value = metadata.value;

            // Pop top value and perform bitwise OR
            const a = try self.stack.pop();
            const result = a | push_value;
            try self.stack.push(result);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_or_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to value from schedule metadata
            const metadata = schedule.getPointerMetadata();
            const push_value = metadata.value.*;

            // Pop top value and perform bitwise OR
            const a = try self.stack.pop();
            const result = a | push_value;
            try self.stack.push(result);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_xor_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline value from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const push_value = metadata.value;

            // Pop top value and perform bitwise XOR
            const a = try self.stack.pop();
            const result = a ^ push_value;
            try self.stack.push(result);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_xor_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to value from schedule metadata
            const metadata = schedule.getPointerMetadata();
            const push_value = metadata.value.*;

            // Pop top value and perform bitwise XOR
            const a = try self.stack.pop();
            const result = a ^ push_value;
            try self.stack.push(result);

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_mstore8_inline(self: Self, schedule: Schedule) Error!Success {
            // Extract inline offset from schedule metadata
            const metadata = schedule.getInlineMetadata();
            const offset = metadata.value;

            // Pop value from stack
            const value = try self.stack.pop();

            // Calculate memory expansion cost if needed
            const memory_expansion_cost = try self.memory.expansion_cost(@intCast(offset), 1);
            // Only consume dynamic memory expansion cost (static gas handled at upper layer)
            if (self.gas_remaining < memory_expansion_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(memory_expansion_cost);

            // Store byte to memory
            try self.memory.set_byte_evm(@intCast(offset), @intCast(value & 0xFF));

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        pub fn push_mstore8_pointer(self: Self, schedule: Schedule) Error!Success {
            // Extract pointer to offset value from schedule metadata
            const metadata = schedule.getPointerMetadata();
            const offset_value = metadata.value.*;
            const offset: u32 = @intCast(offset_value);

            // Pop value from stack
            const value = try self.stack.pop();

            // Calculate memory expansion cost if needed
            const memory_expansion_cost = try self.memory.expansion_cost(offset, 1);
            // Only consume dynamic memory expansion cost (static gas handled at upper layer)
            if (self.gas_remaining < memory_expansion_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(memory_expansion_cost);

            // Store byte to memory
            try self.memory.set_byte_evm(offset, @intCast(value & 0xFF));

            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
    };
}

