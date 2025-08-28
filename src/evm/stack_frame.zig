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
const stack_frame_bitwise = @import("stack_frame_bitwise.zig");
const stack_frame_stack = @import("stack_frame_stack.zig");
const stack_frame_memory = @import("stack_frame_memory.zig");
const stack_frame_storage = @import("stack_frame_storage.zig");
const stack_frame_jump = @import("stack_frame_jump.zig");
const stack_frame_system = @import("stack_frame_system.zig");
const stack_frame_context = @import("stack_frame_context.zig");
const stack_frame_keccak = @import("stack_frame_keccak.zig");
const stack_frame_log = @import("stack_frame_log.zig");
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

        fn generatePushHandler(comptime push_n: u8) *const Dispatch.OpcodeHandler {
            if (push_n > 32) @compileError("Only PUSH0 to PUSH32 is supported");
            if (push_n == 0) @compileError("Push0 is handled as it's own opcode not via generatePushHandler");
            return struct {
                pub fn pushHandler(self: Self, schedule: Dispatch) Error!Success {
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
        fn generateDupHandler(comptime dup_n: u8) *const Dispatch.OpcodeHandler {
            return struct {
                pub fn dupHandler(self: Self, schedule: Dispatch) Error!Success {
                    const value = try self.stack.peek_n(dup_n);
                    try self.stack.push(value);
                    const next = schedule.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                }
            }.dupHandler;
        }

        /// Generate a swap handler for SWAP1-SWAP16
        fn generateSwapHandler(comptime swap_n: u8) *const Dispatch.OpcodeHandler {
            return struct {
                pub fn swapHandler(self: Self, schedule: Dispatch) Error!Success {
                    try self.stack.swap_n(swap_n);
                    const next = schedule.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                }
            }.swapHandler;
        }

        pub const opcode_handlers = blk: {
            @setEvalBranchQuota(10000);
            var h: [256]*const Dispatch.OpcodeHandler = undefined;
            for (&h) |*handler| handler.* = &invalid;
            h[@intFromEnum(Opcode.STOP)] = &SystemHandlers.stop;
            h[@intFromEnum(Opcode.ADD)] = &ArithmeticHandlers.add;
            h[@intFromEnum(Opcode.MUL)] = &ArithmeticHandlers.mul;
            h[@intFromEnum(Opcode.SUB)] = &ArithmeticHandlers.sub;
            h[@intFromEnum(Opcode.DIV)] = &ArithmeticHandlers.div;
            h[@intFromEnum(Opcode.SDIV)] = &ArithmeticHandlers.sdiv;
            h[@intFromEnum(Opcode.MOD)] = &ArithmeticHandlers.mod;
            h[@intFromEnum(Opcode.SMOD)] = &ArithmeticHandlers.smod;
            h[@intFromEnum(Opcode.ADDMOD)] = &ArithmeticHandlers.addmod;
            h[@intFromEnum(Opcode.MULMOD)] = &ArithmeticHandlers.mulmod;
            h[@intFromEnum(Opcode.EXP)] = &ArithmeticHandlers.exp;
            h[@intFromEnum(Opcode.SIGNEXTEND)] = &ArithmeticHandlers.signextend;
            h[@intFromEnum(Opcode.LT)] = &ComparisonHandlers.lt;
            h[@intFromEnum(Opcode.GT)] = &ComparisonHandlers.gt;
            h[@intFromEnum(Opcode.SLT)] = &ComparisonHandlers.slt;
            h[@intFromEnum(Opcode.SGT)] = &ComparisonHandlers.sgt;
            h[@intFromEnum(Opcode.EQ)] = &ComparisonHandlers.eq;
            h[@intFromEnum(Opcode.ISZERO)] = &ComparisonHandlers.iszero;
            h[@intFromEnum(Opcode.AND)] = &BitwiseHandlers.@"and";
            h[@intFromEnum(Opcode.OR)] = &BitwiseHandlers.@"or";
            h[@intFromEnum(Opcode.XOR)] = &BitwiseHandlers.xor;
            h[@intFromEnum(Opcode.NOT)] = &BitwiseHandlers.not;
            h[@intFromEnum(Opcode.BYTE)] = &BitwiseHandlers.byte;
            h[@intFromEnum(Opcode.SHL)] = &BitwiseHandlers.shl;
            h[@intFromEnum(Opcode.SHR)] = &BitwiseHandlers.shr;
            h[@intFromEnum(Opcode.SAR)] = &BitwiseHandlers.sar;
            h[@intFromEnum(Opcode.KECCAK256)] = &KeccakHandlers.keccak256;
            h[@intFromEnum(Opcode.ADDRESS)] = &ContextHandlers.address;
            h[@intFromEnum(Opcode.BALANCE)] = &ContextHandlers.balance;
            h[@intFromEnum(Opcode.ORIGIN)] = &ContextHandlers.origin;
            h[@intFromEnum(Opcode.CALLER)] = &ContextHandlers.caller;
            h[@intFromEnum(Opcode.CALLVALUE)] = &ContextHandlers.callvalue;
            h[@intFromEnum(Opcode.CALLDATALOAD)] = &ContextHandlers.calldataload;
            h[@intFromEnum(Opcode.CALLDATASIZE)] = &ContextHandlers.calldatasize;
            h[@intFromEnum(Opcode.CALLDATACOPY)] = &ContextHandlers.calldatacopy;
            h[@intFromEnum(Opcode.CODESIZE)] = &ContextHandlers.codesize;
            h[@intFromEnum(Opcode.CODECOPY)] = &ContextHandlers.codecopy;
            h[@intFromEnum(Opcode.GASPRICE)] = &ContextHandlers.gasprice;
            h[@intFromEnum(Opcode.EXTCODESIZE)] = &ContextHandlers.extcodesize;
            h[@intFromEnum(Opcode.EXTCODECOPY)] = &ContextHandlers.extcodecopy;
            h[@intFromEnum(Opcode.RETURNDATASIZE)] = &ContextHandlers.returndatasize;
            h[@intFromEnum(Opcode.RETURNDATACOPY)] = &ContextHandlers.returndatacopy;
            h[@intFromEnum(Opcode.EXTCODEHASH)] = &ContextHandlers.extcodehash;
            h[@intFromEnum(Opcode.BLOCKHASH)] = &ContextHandlers.blockhash;
            h[@intFromEnum(Opcode.COINBASE)] = &ContextHandlers.coinbase;
            h[@intFromEnum(Opcode.TIMESTAMP)] = &ContextHandlers.timestamp;
            h[@intFromEnum(Opcode.NUMBER)] = &ContextHandlers.number;
            h[@intFromEnum(Opcode.DIFFICULTY)] = &ContextHandlers.difficulty;
            h[@intFromEnum(Opcode.GASLIMIT)] = &ContextHandlers.gaslimit;
            h[@intFromEnum(Opcode.CHAINID)] = &ContextHandlers.chainid;
            h[@intFromEnum(Opcode.SELFBALANCE)] = &ContextHandlers.selfbalance;
            h[@intFromEnum(Opcode.BASEFEE)] = &ContextHandlers.basefee;
            h[@intFromEnum(Opcode.BLOBHASH)] = &ContextHandlers.blobhash;
            h[@intFromEnum(Opcode.BLOBBASEFEE)] = &ContextHandlers.blobbasefee;
            h[@intFromEnum(Opcode.POP)] = &StackHandlers.pop;
            h[@intFromEnum(Opcode.MLOAD)] = &MemoryHandlers.mload;
            h[@intFromEnum(Opcode.MSTORE)] = &MemoryHandlers.mstore;
            h[@intFromEnum(Opcode.MSTORE8)] = &MemoryHandlers.mstore8;
            h[@intFromEnum(Opcode.SLOAD)] = &StorageHandlers.sload;
            h[@intFromEnum(Opcode.SSTORE)] = &StorageHandlers.sstore;
            h[@intFromEnum(Opcode.JUMP)] = &JumpHandlers.jump;
            h[@intFromEnum(Opcode.JUMPI)] = &JumpHandlers.jumpi;
            h[@intFromEnum(Opcode.PC)] = &JumpHandlers.pc;
            h[@intFromEnum(Opcode.MSIZE)] = &MemoryHandlers.msize;
            h[@intFromEnum(Opcode.GAS)] = &ContextHandlers.gas;
            h[@intFromEnum(Opcode.JUMPDEST)] = &JumpHandlers.jumpdest;
            h[@intFromEnum(Opcode.TLOAD)] = &StorageHandlers.tload;
            h[@intFromEnum(Opcode.TSTORE)] = &StorageHandlers.tstore;
            h[@intFromEnum(Opcode.MCOPY)] = &MemoryHandlers.mcopy;
            // PUSH
            h[@intFromEnum(Opcode.PUSH0)] = &StackHandlers.push0;
            for (1..33) |i| {
                const push_n = @as(u8, @intCast(i));
                const opcode = @as(Opcode, @enumFromInt(@intFromEnum(Opcode.PUSH0) + push_n));
                h[@intFromEnum(opcode)] = StackHandlers.generatePushHandler(push_n);
            }
            // DUP
            for (1..17) |i| {
                const dup_n = @as(u8, @intCast(i));
                const opcode = @as(Opcode, @enumFromInt(@intFromEnum(Opcode.DUP1) + dup_n - 1));
                h[@intFromEnum(opcode)] = StackHandlers.generateDupHandler(dup_n);
            }
            // SWAP
            for (1..17) |i| {
                const swap_n = @as(u8, @intCast(i));
                const opcode = @as(Opcode, @enumFromInt(@intFromEnum(Opcode.SWAP1) + swap_n - 1));
                h[@intFromEnum(opcode)] = StackHandlers.generateSwapHandler(swap_n);
            }
            h[@intFromEnum(Opcode.LOG0)] = LogHandlers.log0;
            h[@intFromEnum(Opcode.LOG1)] = LogHandlers.log1;
            h[@intFromEnum(Opcode.LOG2)] = LogHandlers.log2;
            h[@intFromEnum(Opcode.LOG3)] = LogHandlers.log3;
            h[@intFromEnum(Opcode.LOG4)] = LogHandlers.log4;
            h[@intFromEnum(Opcode.CREATE)] = &SystemHandlers.create;
            h[@intFromEnum(Opcode.CALL)] = &SystemHandlers.call;
            h[@intFromEnum(Opcode.CREATE2)] = &SystemHandlers.create2;
            h[@intFromEnum(Opcode.CALLCODE)] = &invalid; // Deprecated
            h[@intFromEnum(Opcode.RETURN)] = &SystemHandlers.@"return";
            h[@intFromEnum(Opcode.DELEGATECALL)] = &SystemHandlers.delegatecall;
            h[@intFromEnum(Opcode.STATICCALL)] = &SystemHandlers.staticcall;
            h[@intFromEnum(Opcode.REVERT)] = &SystemHandlers.revert;
            h[@intFromEnum(Opcode.INVALID)] = &invalid;
            h[@intFromEnum(Opcode.SELFDESTRUCT)] = &SystemHandlers.selfdestruct;
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
        
        // Import handler modules
        const ArithmeticHandlers = stack_frame_arithmetic.Handlers(Self);
        const ComparisonHandlers = stack_frame_comparison.Handlers(Self);
        const BitwiseHandlers = stack_frame_bitwise.Handlers(Self);
        const StackHandlers = stack_frame_stack.Handlers(Self);
        const MemoryHandlers = stack_frame_memory.Handlers(Self);
        const StorageHandlers = stack_frame_storage.Handlers(Self);
        const JumpHandlers = stack_frame_jump.Handlers(Self);
        const SystemHandlers = stack_frame_system.Handlers(Self);
        const ContextHandlers = stack_frame_context.Handlers(Self);
        const KeccakHandlers = stack_frame_keccak.Handlers(Self);
        const LogHandlers = stack_frame_log.Handlers(Self);

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

        // Helper function to validate if a PC position contains a valid JUMPDEST
        pub fn is_valid_jump_dest(self: *Self, pc_value: usize) bool {
            // Use the optimized bitmap lookup from Bytecode
            return self.bytecode.isValidJumpDest(@intCast(pc_value));
        }

        pub fn invalid(self: *Self) Error!void {
            _ = self;
            return Error.InvalidOpcode;
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


        // Synthetic opcode handlers for optimized operations (placeholder implementations)
        pub fn push_add_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_add_pointer(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_mul_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_mul_pointer(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_div_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_div_pointer(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_sub_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_sub_pointer(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_jump_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_jump_pointer(self: Self, schedule: Dispatch) Error!Success {
            // Extract pointer to jump target from schedule metadata
            const metadata_ptr: *const Dispatch.PushPointerMetadata = @ptrCast(&schedule.schedule[1]);
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

        pub fn push_jumpi_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_jumpi_pointer(self: Self, schedule: Dispatch) Error!Success {
            // Extract pointer to jump target from schedule metadata
            const metadata_ptr: *const Dispatch.PushPointerMetadata = @ptrCast(&schedule.schedule[1]);
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
        pub fn push_mload_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_mload_pointer(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_mstore_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_mstore_pointer(self: Self, schedule: Dispatch) Error!Success {
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
        pub fn push_and_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_and_pointer(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_or_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_or_pointer(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_xor_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_xor_pointer(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_mstore8_inline(self: Self, schedule: Dispatch) Error!Success {
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

        pub fn push_mstore8_pointer(self: Self, schedule: Dispatch) Error!Success {
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

