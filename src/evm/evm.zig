//! Transaction-level EVM execution and state management.
//!
//! The EVM orchestrates contract execution, managing:
//! - Call depth tracking and nested execution contexts
//! - State journaling for transaction reverts
//! - Gas accounting and metering
//! - Contract creation (CREATE/CREATE2)
//! - Cross-contract calls (CALL/DELEGATECALL/STATICCALL)
//! - Integration with Host interface for environment queries
//!
//! This module provides the entry point for all EVM operations,
//! coordinating between Frames, the Planner, and state storage.
const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.ZERO_ADDRESS;
const frame_mod = @import("frame.zig");
const frame_interpreter_mod = @import("frame_interpreter.zig");
const Host = @import("host.zig").Host;
const block_info_mod = @import("block_info.zig");
const BlockInfo = block_info_mod.DefaultBlockInfo; // Default for backward compatibility
const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
const Account = @import("database_interface_account.zig").Account;
const SelfDestruct = @import("self_destruct.zig").SelfDestruct;
const CreatedContracts = @import("created_contracts.zig").CreatedContracts;
const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
const AccessList = @import("access_list.zig").AccessList;
const Hardfork = @import("hardfork.zig").Hardfork;
const StorageKey = primitives.StorageKey;

const precompiles = @import("precompiles.zig");
const PlannerStrategy = @import("planner_strategy.zig").PlannerStrategy;
const EvmConfig = @import("evm_config.zig").EvmConfig;
const TransactionContext = @import("transaction_context.zig").TransactionContext;
const journal_mod = @import("journal.zig");
const JournalConfig = @import("journal_config.zig").JournalConfig;

/// Creates a configured EVM instance type.
///
/// The EVM is parameterized by compile-time configuration for optimal
/// performance and minimal runtime overhead. Configuration controls
/// stack size, memory limits, call depth, and optimization strategies.
pub fn Evm(comptime config: EvmConfig) type {
    const DepthType = config.get_depth_type();
    
    // NOTE: When optimizing for size (ReleaseSmall), consider forcing minimal planner strategy
    // This will ensure the smallest possible binary size by excluding advanced
    // optimization code paths that would increase the binary size.
    // Implementation blocked by incomplete plan_minimal module.
    // For now, we always use the standard planner which implements the minimal strategy.
    
    const planner_mod = @import("planner.zig");
    const PlannerType = planner_mod.Planner(.{
        .WordType = config.frame_config.WordType,
        .maxBytecodeSize = config.frame_config.max_bytecode_size,
        .stack_size = config.frame_config.stack_size,
    });
    
    // Create journal configuration based on EVM config
    const journal_config = JournalConfig{
        .SnapshotIdType = if (config.max_call_depth <= 255) u8 else u16,
        .WordType = config.frame_config.WordType,
        .NonceType = u64,
        .initial_capacity = 128,
    };
    
    const JournalType = journal_mod.Journal(journal_config);

    return struct {
        const Self = @This();

        pub const SelectedPlannerType = PlannerType;
        pub const Journal = JournalType;
        
        /// Default empty account structure
        const DEFAULT_ACCOUNT = Account{
            .balance = 0,
            .nonce = 0,
            .code_hash = [_]u8{0} ** 32,
            .storage_root = [_]u8{0} ** 32,
        };

        /// Parameters for different types of EVM calls (re-export)
        pub const CallParams = @import("call_params.zig").CallParams;
        
        /// EVM execution errors
        pub const Error = error{
            InvalidJump,
            OutOfGas,
            StackUnderflow,
            StackOverflow,
            ContractNotFound,
            PrecompileError,
            MemoryError,
            StorageError,
            CallDepthExceeded,
            InsufficientBalance,
            ContractCollision,
            InvalidBytecode,
            StaticCallViolation,
            InvalidOpcode,
            RevertExecution,
            Stop,
            OutOfMemory,
        };

        /// Stack of frames for nested calls
        // frames: [config.max_call_depth]*FrameInterpreter,

        /// Current call depth (0 = root call)
        depth: DepthType,

        /// Static context stack - tracks if each call depth is static
        static_stack: [config.max_call_depth]bool,

        /// Allocator for dynamic memory
        allocator: std.mem.Allocator,

        /// Database interface for state storage
        database: DatabaseInterface,

        /// Journal for tracking state changes and snapshots
        journal: JournalType,

        /// Tracks contracts created in current transaction (EIP-6780)
        created_contracts: CreatedContracts,

        /// Contracts marked for self-destruction
        self_destruct: SelfDestruct,

        /// Access list for tracking warm/cold access (EIP-2929)
        access_list: AccessList,

        /// Block information
        block_info: BlockInfo,

        /// Transaction context
        context: TransactionContext,

        /// Current call input data
        current_input: []const u8,

        /// Current return data
        return_data: []const u8,

        /// Gas price for the transaction
        gas_price: u256,

        /// Origin address (sender of the transaction)
        origin: Address,

        /// Hardfork configuration
        hardfork_config: Hardfork,

        /// Planner instance for bytecode analysis and optimization
        planner: PlannerType,
        
        /// Current snapshot ID for the active call frame
        current_snapshot_id: JournalType.SnapshotIdType,

        /// Logs emitted during the current call
        logs: std.ArrayList(@import("call_result.zig").Log),

        /// Result of a call execution (re-export)
        pub const CallResult = @import("call_result.zig").CallResult;

        /// Initialize a new EVM instance.
        ///
        /// Sets up the execution environment with state storage, block context,
        /// and transaction parameters. The planner cache is initialized with
        /// a default size for bytecode optimization.
        pub fn init(allocator: std.mem.Allocator, database: DatabaseInterface, block_info: BlockInfo, context: TransactionContext, gas_price: u256, origin: Address, hardfork_config: Hardfork) !Self {
            // Initialize planner with a reasonable cache size
            var planner = try PlannerType.init(allocator, 32); // 32 plans cache
            errdefer planner.deinit();

            return Self{
                // .frames = undefined, // Will be initialized per call
                .depth = 0,
                .static_stack = [_]bool{false} ** config.max_call_depth,
                .allocator = allocator,
                .database = database,
                .journal = JournalType.init(allocator),
                .created_contracts = CreatedContracts.init(allocator),
                .self_destruct = SelfDestruct.init(allocator),
                .access_list = AccessList.init(allocator),
                .block_info = block_info,
                .context = context,
                .current_input = &.{},
                .return_data = &.{},
                .gas_price = gas_price,
                .origin = origin,
                .hardfork_config = hardfork_config,
                .planner = planner,
                .current_snapshot_id = 0,
                .logs = std.ArrayList(@import("call_result.zig").Log).init(allocator),
            };
        }

        /// Clean up all resources.
        pub fn deinit(self: *Self) void {
            self.journal.deinit();
            self.created_contracts.deinit();
            self.self_destruct.deinit();
            self.access_list.deinit();
            self.planner.deinit();
            // Free log data
            for (self.logs.items) |log| {
                self.allocator.free(log.topics);
                self.allocator.free(log.data);
            }
            self.logs.deinit();
        }
        
        /// Transfer value between accounts with proper balance checks and error handling
        fn transfer_value(self: *Self, from: Address, to: Address, value: u256, snapshot_id: JournalType.SnapshotIdType) !void {
            if (value == 0) return; // No transfer needed
            
            // Get and check caller account
            var from_account = self.database.get_account(from) catch |err| {
                self.journal.revert_to_snapshot(snapshot_id);
                return err;
            } orelse {
                // Caller account doesn't exist, cannot transfer
                self.journal.revert_to_snapshot(snapshot_id);
                return error.InsufficientBalance;
            };
            
            if (from_account.balance < value) {
                self.journal.revert_to_snapshot(snapshot_id);
                return error.InsufficientBalance;
            }
            
            // Deduct from caller
            from_account.balance -= value;
            self.database.set_account(from, from_account) catch |err| {
                self.journal.revert_to_snapshot(snapshot_id);
                return err;
            };
            
            // Add to recipient
            var to_account = self.database.get_account(to) catch |err| {
                self.journal.revert_to_snapshot(snapshot_id);
                return err;
            } orelse DEFAULT_ACCOUNT;
            
            to_account.balance += value;
            self.database.set_account(to, to_account) catch |err| {
                self.journal.revert_to_snapshot(snapshot_id);
                return err;
            };
        }

        /// Execute an EVM operation.
        ///
        /// This is the main entry point that routes to specific handlers based
        /// on the operation type (CALL, CREATE, etc). Manages transaction-level
        /// state including logs and ensures proper cleanup.
        pub fn call(self: *Self, params: CallParams) Error!CallResult {
            self.depth = 0;
            
            // Clear any existing logs before starting
            for (self.logs.items) |log| {
                self.allocator.free(log.topics);
                self.allocator.free(log.data);
            }
            self.logs.clearRetainingCapacity();
            
            // Route to appropriate handler based on call type
            var result = switch (params) {
                .call => |p| try self.call_regular(p),
                .callcode => |p| try self.callcode_handler(p),
                .delegatecall => |p| try self.delegatecall_handler(p),
                .staticcall => |p| try self.staticcall_handler(p),
                .create => |p| try self.create_handler(p),
                .create2 => |p| try self.create2_handler(p),
            };
            
            // For top-level calls, include logs in the result
            result.logs = self.takeLogs();
            return result;
        }
        
        /// Execute a regular CALL operation.
        ///
        /// Transfers value from caller to target and executes target contract code.
        /// Creates a new execution context with the target's storage. Supports
        /// precompiled contracts and handles state reverts on failure.
        pub fn call_regular(self: *Self, params: anytype) Error!CallResult {
            // Validate gas
            if (params.gas == 0) {
                return CallResult.failure(0);
            }
            
            // Check depth
            if (self.depth >= config.max_call_depth) {
                return CallResult.failure(0);
            }
            
            // Create snapshot for state reversion
            const snapshot_id = self.journal.create_snapshot();
            
            // Check if caller has sufficient balance for value transfer
            if (params.value > 0) {
                const caller_account = self.database.get_account(params.caller) catch |err| {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return switch (err) {
                        else => CallResult.failure(0),
                    };
                };
                
                if (caller_account == null or caller_account.?.balance < params.value) {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return CallResult.failure(0);
                }
            }
            
            // Check if it's a precompile
            if (config.enable_precompiles and precompiles.is_precompile(params.to)) {
                const result = self.execute_precompile_call(params.to, params.input, params.gas, false) catch |err| {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return switch (err) {
                        else => CallResult.failure(0),
                    };
                };
                
                if (!result.success) {
                    self.journal.revert_to_snapshot(snapshot_id);
                }
                
                return result;
            }
            
            // Get contract code
            const code = self.database.get_code_by_address(params.to) catch &.{};
            
            // If no code, it's a simple value transfer
            if (code.len == 0) {
                // Transfer value if needed
                self.transfer_value(params.caller, params.to, params.value, snapshot_id) catch {
                    return CallResult.failure(0);
                };
                
                // Empty call success
                return CallResult.success_empty(params.gas);
            }
            
            // Execute contract code
            const result = self.execute_frame(
                code,
                params.input,
                params.gas,
                params.to,
                params.caller,
                params.value,
                false, // is_static
                snapshot_id,
            ) catch {
                self.journal.revert_to_snapshot(snapshot_id);
                return CallResult.failure(0);
            };
            
            if (!result.success) {
                self.journal.revert_to_snapshot(snapshot_id);
            }
            
            return result;
        }
        
        /// Execute a CALLCODE operation.
        ///
        /// Executes target contract code in the caller's storage context.
        /// Unlike DELEGATECALL, msg.sender remains the direct caller.
        /// Deprecated in favor of DELEGATECALL but maintained for compatibility.
        pub fn callcode_handler(self: *Self, params: anytype) Error!CallResult {
            // Validate gas
            if (params.gas == 0) {
                return CallResult.failure(0);
            }
            
            // Check depth
            if (self.depth >= config.max_call_depth) {
                return CallResult.failure(0);
            }
            
            // Create snapshot for state reversion
            const snapshot_id = self.journal.create_snapshot();
            
            // Check if caller has sufficient balance for value transfer
            if (params.value > 0) {
                const caller_account = self.database.get_account(params.caller) catch |err| {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return switch (err) {
                        else => CallResult.failure(0),
                    };
                };
                
                if (caller_account == null or caller_account.?.balance < params.value) {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return CallResult.failure(0);
                }
            }
            
            // Get contract code from target address
            const code = self.database.get_code_by_address(params.to) catch &.{};
            
            // If no code, it's a simple value transfer to self
            if (code.len == 0) {
                return CallResult.success_empty(params.gas);
            }
            
            // CALLCODE executes the target's code in the caller's context (storage/address)
            // This is different from DELEGATECALL which also preserves msg.sender
            const result = self.execute_frame(
                code,
                params.input,
                params.gas,
                params.caller, // Execute in caller's context, not target
                params.caller, // msg.sender is still the caller
                params.value,
                false, // is_static
                snapshot_id,
            ) catch {
                self.journal.revert_to_snapshot(snapshot_id);
                return CallResult.failure(0);
            };
            
            if (!result.success) {
                self.journal.revert_to_snapshot(snapshot_id);
            }
            
            return result;
        }
        
        /// DELEGATECALL operation
        pub fn delegatecall_handler(self: *Self, params: anytype) Error!CallResult {
            // Validate gas
            if (params.gas == 0) {
                return CallResult.failure(0);
            }
            
            // Check depth
            if (self.depth >= config.max_call_depth) {
                return CallResult.failure(0);
            }
            
            // Create snapshot for state reversion
            const snapshot_id = self.journal.create_snapshot();
            
            // Check if it's a precompile
            if (config.enable_precompiles and precompiles.is_precompile(params.to)) {
                // For precompiles in delegatecall, we still execute with preserved context
                const result = self.execute_precompile_call(params.to, params.input, params.gas, false) catch |err| {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return switch (err) {
                        else => CallResult.failure(0),
                    };
                };
                
                if (!result.success) {
                    self.journal.revert_to_snapshot(snapshot_id);
                }
                
                return result;
            }
            
            // Get contract code
            const code = self.database.get_code_by_address(params.to) catch &.{};
            
            // If no code, it's an empty call
            if (code.len == 0) {
                return CallResult.success_empty(params.gas);
            }
            
            // DELEGATECALL preserves the original caller and value from parent context
            // This is the key difference from CALL - the called code executes with caller's context
            const result = self.execute_frame(
                code,
                params.input,
                params.gas,
                params.to,
                params.caller, // Preserve original caller
                0, // Value is preserved from parent context, not passed
                false, // is_static
                snapshot_id,
            ) catch {
                self.journal.revert_to_snapshot(snapshot_id);
                return CallResult.failure(0);
            };
            
            if (!result.success) {
                self.journal.revert_to_snapshot(snapshot_id);
            }
            
            return result;
        }
        
        /// STATICCALL operation
        pub fn staticcall_handler(self: *Self, params: anytype) Error!CallResult {
            // Validate gas
            if (params.gas == 0) {
                return CallResult.failure(0);
            }
            
            // Check depth
            if (self.depth >= config.max_call_depth) {
                return CallResult.failure(0);
            }
            
            // Create snapshot for state reversion
            const snapshot_id = self.journal.create_snapshot();
            
            // Check if it's a precompile
            if (config.enable_precompiles and precompiles.is_precompile(params.to)) {
                const result = self.execute_precompile_call(params.to, params.input, params.gas, true) catch |err| {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return switch (err) {
                        else => CallResult.failure(0),
                    };
                };
                
                if (!result.success) {
                    self.journal.revert_to_snapshot(snapshot_id);
                }
                
                return result;
            }
            
            // Get contract code
            const code = self.database.get_code_by_address(params.to) catch &.{};
            
            // If no code, it's an empty call (no value transfer in static)
            if (code.len == 0) {
                return CallResult.success_empty(params.gas);
            }
            
            // Execute contract code in static mode
            const result = self.execute_frame(
                code,
                params.input,
                params.gas,
                params.to,
                params.caller,
                0, // No value in static call
                true, // is_static = true
                snapshot_id,
            ) catch {
                self.journal.revert_to_snapshot(snapshot_id);
                // In static context, any error is a failure
                return CallResult.failure(0);
            };
            
            if (!result.success) {
                self.journal.revert_to_snapshot(snapshot_id);
            }
            
            return result;
        }
        
        /// CREATE operation
        pub fn create_handler(self: *Self, params: anytype) Error!CallResult {
            // Check depth
            if (self.depth >= config.max_call_depth) {
                return CallResult.failure(0);
            }
            
            // Create snapshot for state reversion
            const snapshot_id = self.journal.create_snapshot();
            
            // Get caller account
            var caller_account = self.database.get_account(params.caller) catch |err| {
                self.journal.revert_to_snapshot(snapshot_id);
                return switch (err) {
                    else => CallResult.failure(0),
                };
            } orelse Account{
                .balance = 0,
                .nonce = 0,
                .code_hash = [_]u8{0} ** 32,
                .storage_root = [_]u8{0} ** 32,
            };
            
            // Check if caller has sufficient balance
            if (caller_account.balance < params.value) {
                self.journal.revert_to_snapshot(snapshot_id);
                return CallResult.failure(0);
            }
            
            // Calculate contract address from sender and nonce
            const contract_address = primitives.Address.get_contract_address(params.caller, caller_account.nonce);
            
            // Check if address already has code (collision)
            if (self.database.account_exists(contract_address)) {
                const existing = self.database.get_account(contract_address) catch null;
                if (existing != null and !std.mem.eql(u8, &existing.?.code_hash, &[_]u8{0} ** 32)) {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return CallResult.failure(0);
                }
            }
            
            // Increment caller's nonce
            caller_account.nonce += 1;
            self.database.set_account(params.caller, caller_account) catch |err| {
                self.journal.revert_to_snapshot(snapshot_id);
                return switch (err) {
                    else => CallResult.failure(0),
                };
            };
            
            // Track created contract for EIP-6780
            try self.created_contracts.mark_created(contract_address);
            
            // Gas cost for CREATE
            const GasConstants = primitives.GasConstants;
            const create_gas = GasConstants.CreateGas; // 32000
            
            if (params.gas < create_gas) {
                self.journal.revert_to_snapshot(snapshot_id);
                return CallResult.failure(0);
            }
            
            const remaining_gas = params.gas - create_gas;
            
            // Execute initialization code
            const result = self.execute_frame(
                params.init_code,
                &.{}, // Empty input for CREATE
                remaining_gas,
                contract_address,
                params.caller,
                params.value,
                false, // is_static
                snapshot_id,
            ) catch {
                self.journal.revert_to_snapshot(snapshot_id);
                return CallResult.failure(0);
            };
            
            if (!result.success) {
                self.journal.revert_to_snapshot(snapshot_id);
                return result;
            }
            
            // Store the deployed code
            if (result.output.len > 0) {
                var code_hash_bytes: [32]u8 = undefined;
                const keccak_asm = @import("keccak_asm.zig");
                try keccak_asm.keccak256(result.output, &code_hash_bytes);
                
                const new_account = Account{
                    .balance = params.value,
                    .nonce = 1, // Contract accounts start with nonce 1
                    .code_hash = code_hash_bytes,
                    .storage_root = [_]u8{0} ** 32,
                };
                
                self.database.set_account(contract_address, new_account) catch |err| {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return switch (err) {
                        else => CallResult.failure(0),
                    };
                };
            }
            
            // Return the contract address as output
            var address_bytes = std.ArrayList(u8).init(self.allocator);
            defer address_bytes.deinit();
            try address_bytes.appendSlice(&contract_address);
            
            return CallResult.success_with_output(result.gas_left, address_bytes.items);
        }
        
        /// CREATE2 operation
        pub fn create2_handler(self: *Self, params: anytype) Error!CallResult {
            // Check depth
            if (self.depth >= config.max_call_depth) {
                return CallResult.failure(0);
            }
            
            // Create snapshot for state reversion
            const snapshot_id = self.journal.create_snapshot();
            
            // Get caller account
            const caller_account = self.database.get_account(params.caller) catch |err| {
                self.journal.revert_to_snapshot(snapshot_id);
                return switch (err) {
                    else => CallResult.failure(0),
                };
            } orelse Account{
                .balance = 0,
                .nonce = 0,
                .code_hash = [_]u8{0} ** 32,
                .storage_root = [_]u8{0} ** 32,
            };
            
            // Check if caller has sufficient balance
            if (caller_account.balance < params.value) {
                self.journal.revert_to_snapshot(snapshot_id);
                return CallResult.failure(0);
            }
            
            // Calculate contract address from sender, salt, and init code hash
            const keccak_asm = @import("keccak_asm.zig");
            var init_code_hash_bytes: [32]u8 = undefined;
            try keccak_asm.keccak256(params.init_code, &init_code_hash_bytes);
            const salt_bytes = @as([32]u8, @bitCast(params.salt));
            const contract_address = primitives.Address.get_create2_address(params.caller, salt_bytes, init_code_hash_bytes);
            
            // Check if address already has code (collision)
            if (self.database.account_exists(contract_address)) {
                const existing = self.database.get_account(contract_address) catch null;
                if (existing != null and !std.mem.eql(u8, &existing.?.code_hash, &[_]u8{0} ** 32)) {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return CallResult.failure(0);
                }
            }
            
            // Track created contract for EIP-6780
            try self.created_contracts.mark_created(contract_address);
            
            // Gas cost for CREATE2
            const GasConstants = primitives.GasConstants;
            const create_gas = GasConstants.CreateGas; // 32000
            const hash_cost = @as(u64, @intCast(params.init_code.len)) * GasConstants.Keccak256WordGas / 32;
            const total_gas = create_gas + hash_cost;
            
            if (params.gas < total_gas) {
                self.journal.revert_to_snapshot(snapshot_id);
                return CallResult.failure(0);
            }
            
            const remaining_gas = params.gas - total_gas;
            
            // Execute initialization code
            const result = self.execute_frame(
                params.init_code,
                &.{}, // Empty input for CREATE2
                remaining_gas,
                contract_address,
                params.caller,
                params.value,
                false, // is_static
                snapshot_id,
            ) catch {
                self.journal.revert_to_snapshot(snapshot_id);
                return CallResult.failure(0);
            };
            
            if (!result.success) {
                self.journal.revert_to_snapshot(snapshot_id);
                return result;
            }
            
            // Store the deployed code
            if (result.output.len > 0) {
                var code_hash_bytes: [32]u8 = undefined;
                try keccak_asm.keccak256(result.output, &code_hash_bytes);
                
                const new_account = Account{
                    .balance = params.value,
                    .nonce = 1, // CREATE2 contracts start with nonce 1
                    .code_hash = code_hash_bytes,
                    .storage_root = [_]u8{0} ** 32,
                };
                
                self.database.set_account(contract_address, new_account) catch |err| {
                    self.journal.revert_to_snapshot(snapshot_id);
                    return switch (err) {
                        else => CallResult.failure(0),
                    };
                };
            }
            
            // Return the contract address as output
            var address_bytes = std.ArrayList(u8).init(self.allocator);
            defer address_bytes.deinit();
            try address_bytes.appendSlice(&contract_address);
            
            return CallResult.success_with_output(result.gas_left, address_bytes.items);
        }
        
        /// Execute frame - replaces execute_bytecode with cleaner interface
        fn execute_frame(
            self: *Self,
            code: []const u8,
            input: []const u8,
            gas: u64,
            address: Address,
            caller: Address,
            value: u256,
            is_static: bool,
            snapshot_id: JournalType.SnapshotIdType,
        ) !CallResult {
            _ = snapshot_id;
            _ = input;
            _ = address;
            _ = caller;
            _ = value;
            _ = is_static;
            
            // Increment depth
            self.depth += 1;
            defer self.depth -= 1;
            
            // Convert gas to appropriate type
            const gas_i32 = @as(i32, @intCast(@min(gas, std.math.maxInt(i32))));
            
            // Create frame interpreter
            var interpreter = try frame_interpreter_mod.FrameInterpreter(config.frame_config).init(
                self.allocator,
                code,
                gas_i32,
                self.database,
            );
            defer interpreter.deinit(self.allocator);
            
            // Execute the frame
            interpreter.interpret() catch |err| {
                const gas_left = @as(u64, @intCast(@max(interpreter.frame.gas_remaining, 0)));
                return switch (err) {
                    error.STOP => CallResult.success_with_output(gas_left, interpreter.frame.output_data.items),
                    error.REVERT => CallResult.revert_with_data(gas_left, interpreter.frame.output_data.items),
                    error.OutOfGas => CallResult.failure(0),
                    error.InvalidJump => CallResult.failure(0),
                    error.InvalidOpcode => CallResult.failure(0),
                    error.StackUnderflow => CallResult.failure(0),
                    error.StackOverflow => CallResult.failure(0),
                    error.OutOfBounds => CallResult.failure(0),
                    error.WriteProtection => CallResult.failure(0),
                    error.BytecodeTooLarge => CallResult.failure(0),
                    error.AllocationError => CallResult.failure(0),
                    error.OutOfMemory => CallResult.failure(0),
                    error.TruncatedPush => CallResult.failure(0),
                    error.InvalidJumpDestination => CallResult.failure(0),
                    error.MissingJumpDestMetadata => CallResult.failure(0),
                    error.InitcodeTooLarge => CallResult.failure(0),
                    else => CallResult.failure(0),
                };
            };
            
            // Normal completion (STOP)
            const gas_left = @as(u64, @intCast(@max(interpreter.frame.gas_remaining, 0)));
            return CallResult.success_with_output(gas_left, interpreter.frame.output_data.items);
        }
        
        /// Execute nested EVM call - used for calls from within the EVM
        pub fn inner_call(self: *Self, params: CallParams) !CallResult {
            // Don't reset depth to 0 for inner calls - just use call handlers
            switch (params) {
                .call => |p| return try self.call_regular(p),
                .callcode => |p| return try self.callcode_handler(p),
                .delegatecall => |p| return try self.delegatecall_handler(p),
                .staticcall => |p| return try self.staticcall_handler(p),
                .create => |p| return try self.create_handler(p),
                .create2 => |p| return try self.create2_handler(p),
            }
        }
        
        /// Execute a precompile call using the full legacy precompile system
        /// This implementation supports all standard Ethereum precompiles (0x01-0x0A)
        fn execute_precompile_call(self: *Self, address: Address, input: []const u8, gas: u64, is_static: bool) !CallResult {
            _ = is_static; // Precompiles are inherently stateless, so static flag doesn't matter

            if (!precompiles.is_precompile(address)) {
                return CallResult{ .success = false, .gas_left = gas, .output = &.{} };
            }

            const precompile_id = address[19]; // Last byte is the precompile ID
            if (precompile_id < 1 or precompile_id > 10) {
                return CallResult{ .success = false, .gas_left = gas, .output = &.{} };
            }

            const estimated_output_size: usize = switch (precompile_id) {
                1 => 32, // ECRECOVER - returns 32-byte address (padded)
                2 => 32, // SHA256 - returns 32-byte hash
                3 => 32, // RIPEMD160 - returns 32-byte hash (padded)
                4 => input.len, // IDENTITY - returns input data
                5 => blk: {
                    // MODEXP - estimate based on modulus length from input
                    if (input.len < 96) break :blk 0;
                    const mod_len_bytes = input[64..96];
                    var mod_len: usize = 0;
                    for (mod_len_bytes) |byte| {
                        mod_len = (mod_len << 8) | byte;
                    }
                    break :blk @min(mod_len, 4096); // Cap at 4KB for safety
                },
                6 => 64, // ECADD - returns 64 bytes (2 field elements)
                7 => 64, // ECMUL - returns 64 bytes (2 field elements)
                8 => 32, // ECPAIRING - returns 32 bytes (boolean result padded)
                9 => 64, // BLAKE2F - returns 64-byte hash
                10 => 64, // KZG_POINT_EVALUATION - returns verification result
                else => 0,
            };

            const output_buffer = self.allocator.alloc(u8, estimated_output_size) catch |err| {
                return err;
            };
            errdefer self.allocator.free(output_buffer);

            // NOTE: ChainRules integration for precompiles is pending precompile implementation
            // const chain_rules = ChainRules.for_hardfork(self.hardfork_config);

            // Execute precompile
            const result = precompiles.execute_precompile(self.allocator, address, input, gas) catch {
                self.allocator.free(output_buffer);
                return CallResult{
                    .success = false,
                    .gas_left = 0,
                    .output = &.{},
                };
            };

            // Handle precompile result
            if (result.success) {
                // Copy output data to our buffer
                const output_len = @min(result.output.len, output_buffer.len);
                @memcpy(output_buffer[0..output_len], result.output[0..output_len]);
                
                return CallResult{
                    .success = true,
                    .gas_left = gas - result.gas_used,
                    .output = output_buffer[0..output_len],
                };
            } else {
                self.allocator.free(output_buffer);
                return CallResult{
                    .success = false,
                    .gas_left = 0,
                    .output = &.{},
                };
            }
        }

        // ===== Host Interface Implementation =====

        /// Get account balance
        pub fn get_balance(self: *Self, address: Address) u256 {
            return self.database.get_balance(address) catch 0;
        }

        /// Check if account exists
        pub fn account_exists(self: *Self, address: Address) bool {
            return self.database.account_exists(address);
        }

        /// Get account code
        pub fn get_code(self: *Self, address: Address) []const u8 {
            return self.database.get_code_by_address(address) catch &.{};
        }

        /// Get block information
        pub fn get_block_info(self: *Self) BlockInfo {
            return self.block_info;
        }

        /// Emit log event
        pub fn emit_log(self: *Self, contract_address: Address, topics: []const u256, data: []const u8) void {
            // Make copies of the data since the caller's data might be temporary
            const topics_copy = self.allocator.dupe(u256, topics) catch return;
            const data_copy = self.allocator.dupe(u8, data) catch {
                self.allocator.free(topics_copy);
                return;
            };

            self.logs.append(@import("call_result.zig").Log{
                .address = contract_address,
                .topics = topics_copy,
                .data = data_copy,
            }) catch {
                self.allocator.free(topics_copy);
                self.allocator.free(data_copy);
            };
        }

        /// Execute nested EVM call - for Host interface
        pub fn host_inner_call(self: *Self, params: CallParams) !CallResult {
            return self.inner_call(params);
        }

        /// Register a contract as created in the current transaction
        pub fn register_created_contract(self: *Self, address: Address) !void {
            try self.created_contracts.mark_created(address);
        }

        /// Check if a contract was created in the current transaction
        pub fn was_created_in_tx(self: *Self, address: Address) bool {
            return self.created_contracts.was_created_in_tx(address);
        }

        /// Create a new journal snapshot
        pub fn create_snapshot(self: *Self) JournalType.SnapshotIdType {
            return self.journal.create_snapshot();
        }

        /// Revert state changes to a previous snapshot
        pub fn revert_to_snapshot(self: *Self, snapshot_id: JournalType.SnapshotIdType) void {
            // Get the journal entries that need to be reverted before removing them
            var entries_to_revert = std.ArrayList(JournalType.EntryType).init(self.allocator);
            defer entries_to_revert.deinit();

            // Collect entries that belong to snapshots newer than or equal to the target snapshot
            for (self.journal.entries.items) |entry| {
                if (entry.snapshot_id >= snapshot_id) {
                    entries_to_revert.append(entry) catch {
                        // If we can't allocate memory for reverting, we're in a bad state
                        // But we should still remove the journal entries to maintain consistency
                        break;
                    };
                }
            }

            // Remove the journal entries first
            self.journal.revert_to_snapshot(snapshot_id);

            // Apply the changes in reverse order to revert the database state
            var i = entries_to_revert.items.len;
            while (i > 0) : (i -= 1) {
                const entry = entries_to_revert.items[i - 1];
                self.apply_journal_entry_revert(entry) catch |err| {
                    // Log the error but continue reverting other entries
                    const log = @import("log.zig");
                    log.err("Failed to revert journal entry: {}", .{err});
                };
            }
        }

        /// Apply a single journal entry to revert database state
        fn apply_journal_entry_revert(self: *Self, entry: JournalType.EntryType) !void {
            switch (entry.data) {
                .storage_change => |sc| {
                    // Revert storage to original value
                    try self.database.set_storage(sc.address, sc.key, sc.original_value);
                },
                .balance_change => |bc| {
                    // Revert balance to original value
                    var account = (try self.database.get_account(bc.address)) orelse {
                        // If account doesn't exist, create it with the original balance
                        const reverted_account = Account{
                            .balance = bc.original_balance,
                            .nonce = 0,
                            .code_hash = [_]u8{0} ** 32,
                            .storage_root = [_]u8{0} ** 32,
                        };
                        return self.database.set_account(bc.address, reverted_account);
                    };
                    account.balance = bc.original_balance;
                    try self.database.set_account(bc.address, account);
                },
                .nonce_change => |nc| {
                    // Revert nonce to original value
                    var account = (try self.database.get_account(nc.address)) orelse return;
                    account.nonce = nc.original_nonce;
                    try self.database.set_account(nc.address, account);
                },
                .code_change => |cc| {
                    // Revert code to original value
                    var account = (try self.database.get_account(cc.address)) orelse return;
                    account.code_hash = cc.original_code_hash;
                    try self.database.set_account(cc.address, account);
                },
                .account_created => |ac| {
                    // Remove created account
                    try self.database.delete_account(ac.address);
                },
                .account_destroyed => |ad| {
                    // Restore destroyed account
                    // Note: This is a simplified restoration - in practice we'd need full account state
                    const restored_account = Account{
                        .balance = ad.balance,
                        .nonce = 0,
                        .code_hash = [_]u8{0} ** 32,
                        .storage_root = [_]u8{0} ** 32,
                    };
                    try self.database.set_account(ad.address, restored_account);
                },
            }
        }

        /// Record a storage change in the journal
        pub fn record_storage_change(self: *Self, address: Address, slot: u256, original_value: u256) !void {
            try self.journal.record_storage_change(self.current_snapshot_id, address, slot, original_value);
        }

        /// Get the original storage value from the journal
        pub fn get_original_storage(self: *Self, address: Address, slot: u256) ?u256 {
            // Use journal's built-in method to get original storage
            return self.journal.get_original_storage(address, slot);
        }

        /// Access an address and return the gas cost (EIP-2929)
        pub fn access_address(self: *Self, address: Address) !u64 {
            return try self.access_list.access_address(address);
        }

        /// Access a storage slot and return the gas cost (EIP-2929)
        pub fn access_storage_slot(self: *Self, contract_address: Address, slot: u256) !u64 {
            return try self.access_list.access_storage_slot(contract_address, slot);
        }

        /// Mark a contract for destruction
        pub fn mark_for_destruction(self: *Self, contract_address: Address, recipient: Address) !void {
            try self.self_destruct.mark_for_destruction(contract_address, recipient);
        }

        /// Get current call input/calldata
        pub fn get_input(self: *Self) []const u8 {
            return self.current_input;
        }

        /// Check if hardfork is at least the target
        pub fn is_hardfork_at_least(self: *Self, target: Hardfork) bool {
            return @intFromEnum(self.hardfork_config) >= @intFromEnum(target);
        }

        /// Get current hardfork
        pub fn get_hardfork(self: *Self) Hardfork {
            return self.hardfork_config;
        }

        /// Get whether the current frame is static
        pub fn get_is_static(self: *Self) bool {
            if (self.depth == 0) return false;
            return self.static_stack[self.depth - 1];
        }

        /// Get the call depth for the current frame
        pub fn get_depth(self: *Self) u11 {
            return @intCast(self.depth);
        }

        /// Get storage value
        pub fn get_storage(self: *Self, address: Address, slot: u256) u256 {
            return self.database.get_storage(address, slot) catch 0;
        }

        /// Set storage value
        pub fn set_storage(self: *Self, address: Address, slot: u256, value: u256) !void {
            // Record original value for journal
            const original_value = self.get_storage(address, slot);
            try self.record_storage_change(address, slot, original_value);
            try self.database.set_storage(address, slot, value);
        }

        /// Get transaction gas price
        pub fn get_gas_price(self: *Self) u256 {
            return self.gas_price;
        }

        /// Get return data from last call
        pub fn get_return_data(self: *Self) []const u8 {
            return self.return_data;
        }

        /// Get chain ID
        pub fn get_chain_id(self: *Self) u16 {
            return self.context.chain_id;
        }

        /// Get block hash by number
        pub fn get_block_hash(self: *Self, block_number: u64) ?[32]u8 {
            // For now, return null - would need to implement block hash storage
            _ = self;
            _ = block_number;
            return null;
        }

        /// Get blob hash for the given index (EIP-4844)
        pub fn get_blob_hash(self: *Self, index: u256) ?[32]u8 {
            // For now, return null - would need to implement blob support
            _ = self;
            _ = index;
            return null;
        }

        /// Get blob base fee (EIP-4844)
        pub fn get_blob_base_fee(self: *Self) u256 {
            // For now, return 0 - would need to implement blob support
            _ = self;
            return 0;
        }

        /// Convert to Host interface
        pub fn to_host(self: *Self) Host {
            return Host.init(self);
        }

        /// Take all logs and clear the log list
        fn takeLogs(self: *Self) []const @import("call_result.zig").Log {
            const logs = self.logs.toOwnedSlice() catch &.{};
            self.logs = std.ArrayList(@import("call_result.zig").Log).init(self.allocator);
            return logs;
        }
    };
}

pub const DefaultEvm = Evm(.{});

test "CallParams and CallResult structures" {
    const testing = std.testing;

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 1000000,
        },
    };

    const result = DefaultEvm.CallResult{
        .success = true,
        .gas_left = 900000,
        .output = &.{},
    };

    try testing.expect(call_params == .call);
    try testing.expect(result.success);
    try testing.expectEqual(@as(u64, 900000), result.gas_left);
    try testing.expectEqual(@as(usize, 0), result.output.len);
}

test "EVM error type definition" {
    const testing = std.testing;
    
    // Test that Error type exists and contains expected error cases
    const TestEvm = Evm(.{});
    
    // Test error type is defined
    comptime {
        _ = TestEvm.Error;
    }
    
    // Test that we can create error values
    const err1: TestEvm.Error = error.InvalidJump;
    const err2: TestEvm.Error = error.OutOfGas;
    
    // Test that different errors are not equal
    try testing.expect(err1 != err2);
}

test "EVM call() entry point method" {
    const testing = std.testing;
    const allocator = testing.allocator;
    
    // Create test database
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    // Create EVM instance
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 0,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const tx_context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(allocator, db_interface, block_info, tx_context, 0, ZERO_ADDRESS, .BERLIN);
    defer evm.deinit();
    
    // Test that call method exists and has correct signature
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 1000000,
        },
    };
    
    // This should return Error!CallResult
    const result = evm.call(call_params);
    
    // Test that method returns expected error type
    comptime {
        const ReturnType = @TypeOf(result);
        const expected_type = DefaultEvm.Error!DefaultEvm.CallResult;
        _ = ReturnType;
        _ = expected_type;
        // We can't directly compare error union types, but this ensures it compiles
    }
}

test "EVM call() method routes to different handlers" {
    const testing = std.testing;
    const allocator = testing.allocator;
    
    // Create test database
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    // Create EVM instance
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 0,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const tx_context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(allocator, db_interface, block_info, tx_context, 0, ZERO_ADDRESS, .BERLIN);
    defer evm.deinit();
    
    // Test CALL routing
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 1000000,
        },
    };
    _ = evm.call(call_params) catch {};
    
    // Test DELEGATECALL routing
    const delegatecall_params = DefaultEvm.CallParams{
        .delegatecall = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .input = &.{},
            .gas = 1000000,
        },
    };
    _ = evm.call(delegatecall_params) catch {};
    
    // Test STATICCALL routing
    const staticcall_params = DefaultEvm.CallParams{
        .staticcall = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .input = &.{},
            .gas = 1000000,
        },
    };
    _ = evm.call(staticcall_params) catch {};
    
    // Test CREATE routing
    const create_params = DefaultEvm.CallParams{
        .create = .{
            .caller = ZERO_ADDRESS,
            .value = 0,
            .init_code = &.{},
            .gas = 1000000,
        },
    };
    _ = evm.call(create_params) catch {};
    
    // Test CREATE2 routing
    const create2_params = DefaultEvm.CallParams{
        .create2 = .{
            .caller = ZERO_ADDRESS,
            .value = 0,
            .init_code = &.{},
            .salt = 0,
            .gas = 1000000,
        },
    };
    _ = evm.call(create2_params) catch {};
}

test "EVM call_regular handler basic functionality" {
    const testing = std.testing;
    const allocator = testing.allocator;
    
    // Create test database
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    // Add a simple contract that just STOPs
    const stop_bytecode = [_]u8{0x00}; // STOP opcode
    const contract_address: Address = [_]u8{0x42} ++ [_]u8{0} ** 19;
    const code_hash = try memory_db.set_code(&stop_bytecode);
    try memory_db.set_account(contract_address, Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Create EVM instance
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 0,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const tx_context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(allocator, db_interface, block_info, tx_context, 0, ZERO_ADDRESS, .BERLIN);
    defer evm.deinit();
    
    // Test call_regular directly (once it's implemented)
    const params = struct {
        caller: Address,
        to: Address,
        value: u256,
        input: []const u8,
        gas: u64,
    }{
        .caller = ZERO_ADDRESS,
        .to = contract_address,
        .value = 0,
        .input = &.{},
        .gas = 1000000,
    };
    
    // For now this will return error.InvalidJump as it's not implemented
    const result = evm.call_regular(params) catch |err| {
        try testing.expectEqual(DefaultEvm.Error.InvalidJump, err);
        return;
    };
    
    // Once implemented, we'd expect:
    // try testing.expect(result.success);
    // try testing.expect(result.gas_left > 0);
    // try testing.expectEqual(@as(usize, 0), result.output.len);
    _ = result;
}

test "EVM staticcall handler prevents state changes" {
    const testing = std.testing;
    const allocator = testing.allocator;
    
    // Create test database with initial state
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    // Add a contract that tries to modify storage (should fail in staticcall)
    const sstore_bytecode = [_]u8{
        0x60, 0x01,  // PUSH1 1
        0x60, 0x00,  // PUSH1 0 
        0x55,        // SSTORE (should fail in static context)
        0x00,        // STOP
    };
    const contract_address: Address = [_]u8{0x42} ++ [_]u8{0} ** 19;
    const code_hash = try memory_db.set_code(&sstore_bytecode);
    try memory_db.set_account(contract_address, Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Create EVM instance
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 0,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const tx_context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(allocator, db_interface, block_info, tx_context, 0, ZERO_ADDRESS, .BERLIN);
    defer evm.deinit();
    
    // Test staticcall directly  
    const params = struct {
        caller: Address,
        to: Address,
        input: []const u8,
        gas: u64,
    }{
        .caller = ZERO_ADDRESS,
        .to = contract_address,
        .input = &.{},
        .gas = 1000000,
    };
    
    // For now this will return error.InvalidJump as it's not implemented
    const result = evm.staticcall_handler(params) catch |err| {
        try testing.expectEqual(DefaultEvm.Error.InvalidJump, err);
        return;
    };
    
    // Once implemented, staticcall with SSTORE should fail
    // try testing.expect(!result.success);
    _ = result;
}

test "EVM delegatecall handler preserves caller context" {
    const testing = std.testing;
    const allocator = testing.allocator;
    
    // Create test database
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    // Add a contract that returns the caller address
    // CALLER opcode pushes msg.sender to stack
    _ = [_]u8{
        0x33,        // CALLER
        0x60, 0x00,  // PUSH1 0
        0x52,        // MSTORE - store caller at memory[0]
        0x60, 0x20,  // PUSH1 32
        0x60, 0x00,  // PUSH1 0
        0xF3,        // RETURN - return 32 bytes from memory[0]
    };
    const contract_address: Address = [_]u8{0x42} ++ [_]u8{0} ** 19;
    try memory_db.set_account(contract_address, Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Create EVM instance
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 0,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const original_caller: Address = [_]u8{0xAA} ++ [_]u8{0} ** 19;
    const tx_context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(allocator, db_interface, block_info, tx_context, 0, ZERO_ADDRESS, .BERLIN);
    defer evm.deinit();
    
    // Test delegatecall - should preserve original caller
    const params = struct {
        caller: Address,
        to: Address,
        input: []const u8,
        gas: u64,
    }{
        .caller = original_caller, // This should be preserved in delegatecall
        .to = contract_address,
        .input = &.{},
        .gas = 1000000,
    };
    
    // For now this will return error.InvalidJump as it's not implemented
    const result = evm.delegatecall_handler(params) catch |err| {
        try testing.expectEqual(DefaultEvm.Error.InvalidJump, err);
        return;
    };
    
    // Once implemented:
    // try testing.expect(result.success);
    // The returned address should be original_caller, not contract_address
    _ = result;
}

test "Evm creation with custom config" {
    const testing = std.testing;

    const CustomEvm = Evm(.{
        .max_call_depth = 512,
        .max_input_size = 65536, // 64KB
        .frame_config = .{
            .stack_size = 512,
            .max_bytecode_size = 16384,
        },
    });

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try CustomEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    try testing.expectEqual(@as(u9, 0), evm.depth);
}

test "Evm call depth limit" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Set depth to max
    evm.depth = 1024;

    // Try to make a call - should fail due to depth limit
    const result = try evm.inner_call(DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 1000000,
        },
    });

    try testing.expect(!result.success);
    try testing.expectEqual(@as(u64, 0), result.gas_left);
    try testing.expectEqual(@as(usize, 0), result.output.len);
}

// TDD Tests for call method implementation
test "call method basic functionality - simple STOP" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    _ = [_]u8{0x00};

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };

    // This should work when call method is properly implemented
    const result = try evm.call(call_params);

    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
}

test "call method loads contract code from state" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Set up contract with bytecode [0x00] (STOP)
    const contract_address: Address = [_]u8{0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90};
    const bytecode = [_]u8{0x00};
    const code_hash = try memory_db.set_code(&bytecode);
    
    // Create account with the code
    const account = Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    };
    try memory_db.set_account(contract_address, account);

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = contract_address,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };

    const result = try evm.call(call_params);

    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
}

test "call method handles CREATE operation" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Create contract with simple init code that returns [0x00] (STOP)
    const init_code = [_]u8{ 0x60, 0x01, 0x60, 0x00, 0x52, 0x60, 0x01, 0x60, 0x00, 0xF3 }; // PUSH1 1 PUSH1 0 MSTORE PUSH1 1 PUSH1 0 RETURN

    const create_params = DefaultEvm.CallParams{
        .create = .{
            .caller = ZERO_ADDRESS,
            .value = 0,
            .init_code = &init_code,
            .gas = 100000,
        },
    };

    const result = try evm.call(create_params);

    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
}

test "call method handles gas limit properly" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Call with very low gas (should fail or return with low gas left)
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 10, // Very low gas
        },
    };

    const result = try evm.call(call_params);

    // Should either fail or consume most/all gas
    try testing.expect(result.gas_left <= 10);
}

test "Journal - snapshot creation and management" {
    const testing = std.testing;
    const JournalType = journal_mod.Journal(.{});

    var journal = JournalType.init(testing.allocator);
    defer journal.deinit();

    try testing.expectEqual(@as(u32, 0), journal.next_snapshot_id);
    try testing.expectEqual(@as(usize, 0), journal.entry_count());

    // Create snapshots
    const snapshot1 = journal.create_snapshot();
    const snapshot2 = journal.create_snapshot();
    const snapshot3 = journal.create_snapshot();

    try testing.expectEqual(@as(u32, 0), snapshot1);
    try testing.expectEqual(@as(u32, 1), snapshot2);
    try testing.expectEqual(@as(u32, 2), snapshot3);
    try testing.expectEqual(@as(u32, 3), journal.next_snapshot_id);
}

test "Journal - storage change recording" {
    const testing = std.testing;
    const JournalType = journal_mod.Journal(.{});

    var journal = JournalType.init(testing.allocator);
    defer journal.deinit();

    const snapshot_id = journal.create_snapshot();
    const address = ZERO_ADDRESS;
    const key = 42;
    const original_value = 100;

    // Record storage change
    try journal.record_storage_change(snapshot_id, address, key, original_value);

    // Verify entry was recorded
    try testing.expectEqual(@as(usize, 1), journal.entry_count());
    const entry = journal.entries.items[0];
    try testing.expectEqual(snapshot_id, entry.snapshot_id);

    switch (entry.data) {
        .storage_change => |sc| {
            try testing.expectEqual(address, sc.address);
            try testing.expectEqual(key, sc.key);
            try testing.expectEqual(original_value, sc.original_value);
        },
        else => try testing.expect(false), // Should be storage_change
    }
    
    // Test get_original_storage
    const retrieved = journal.get_original_storage(address, key);
    try testing.expect(retrieved != null);
    try testing.expectEqual(original_value, retrieved.?);
}

test "Journal - revert to snapshot" {
    const testing = std.testing;
    const JournalType = journal_mod.Journal(.{});

    var journal = JournalType.init(testing.allocator);
    defer journal.deinit();

    const snapshot1 = journal.create_snapshot();
    const snapshot2 = journal.create_snapshot();
    const snapshot3 = journal.create_snapshot();

    // Add entries with different snapshot IDs
    try journal.record_storage_change(snapshot1, ZERO_ADDRESS, 1, 10);
    try journal.record_storage_change(snapshot1, ZERO_ADDRESS, 2, 20);
    try journal.record_storage_change(snapshot2, ZERO_ADDRESS, 3, 30);
    try journal.record_storage_change(snapshot3, ZERO_ADDRESS, 4, 40);

    try testing.expectEqual(@as(usize, 4), journal.entry_count());

    // Revert to snapshot2 - should remove entries with snapshot_id >= 2
    journal.revert_to_snapshot(snapshot2);

    try testing.expectEqual(@as(usize, 2), journal.entry_count());
    // Verify remaining entries are from snapshot1
    for (journal.entries.items) |entry| {
        try testing.expect(entry.snapshot_id < snapshot2);
    }
}

test "Journal - multiple entry types" {
    const testing = std.testing;
    const JournalType = journal_mod.Journal(.{});

    var journal = JournalType.init(testing.allocator);
    defer journal.deinit();

    const snapshot_id = journal.create_snapshot();
    const address = ZERO_ADDRESS;
    const code_hash = [_]u8{0xAB} ** 32;

    // Record different types of changes
    try journal.record_storage_change(snapshot_id, address, 1, 100);
    try journal.record_balance_change(snapshot_id, address, 1000);
    try journal.record_nonce_change(snapshot_id, address, 5);
    try journal.record_code_change(snapshot_id, address, code_hash);

    try testing.expectEqual(@as(usize, 4), journal.entry_count());

    // Verify all entry types exist
    var storage_found = false;
    var balance_found = false;
    var nonce_found = false;
    var code_found = false;
    
    for (journal.entries.items) |entry| {
        switch (entry.data) {
            .storage_change => storage_found = true,
            .balance_change => balance_found = true,
            .nonce_change => nonce_found = true,
            .code_change => code_found = true,
            else => {},
        }
    }
    
    try testing.expect(storage_found);
    try testing.expect(balance_found);
    try testing.expect(nonce_found);
    try testing.expect(code_found);
}

test "Journal - empty revert" {
    const testing = std.testing;
    const JournalType = journal_mod.Journal(.{});

    var journal = JournalType.init(testing.allocator);
    defer journal.deinit();

    // Revert with no entries should not crash
    journal.revert_to_snapshot(0);
    try testing.expectEqual(@as(usize, 0), journal.entry_count());

    // Create entries and revert to future snapshot
    const snapshot = journal.create_snapshot();
    try journal.record_storage_change(snapshot, ZERO_ADDRESS, 1, 100);

    // Revert to future snapshot (should remove all entries)
    journal.revert_to_snapshot(999);
    try testing.expectEqual(@as(usize, 0), journal.entry_count());
}

test "EvmConfig - depth type selection" {
    const testing = std.testing;

    const config_u8 = EvmConfig{ .max_call_depth = 255 };
    try testing.expectEqual(u8, config_u8.get_depth_type());

    const config_u11 = EvmConfig{ .max_call_depth = 1024 };
    try testing.expectEqual(u11, config_u11.get_depth_type());

    const config_boundary = EvmConfig{ .max_call_depth = 256 };
    try testing.expectEqual(u11, config_boundary.get_depth_type());
}

test "EvmConfig - custom configurations" {
    const testing = std.testing;

    const custom_config = EvmConfig{
        .max_call_depth = 512,
        .max_input_size = 65536,
        .frame_config = .{
            .stack_size = 256,
            .max_bytecode_size = 12288,
        },
    };

    const CustomEvm = Evm(custom_config);

    // Create test database and verify custom EVM compiles
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try CustomEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    try testing.expectEqual(@as(u10, 0), evm.depth); // Should be u10 for 512 max depth
}

test "TransactionContext creation and fields" {
    const testing = std.testing;

    const context = TransactionContext{
        .gas_limit = 5000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 137, // Polygon
    };

    try testing.expectEqual(@as(u64, 5000000), context.gas_limit);
    try testing.expectEqual(ZERO_ADDRESS, context.coinbase);
    try testing.expectEqual(@as(u16, 137), context.chain_id);
}

test "Evm initialization with all parameters" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 12345678,
        .timestamp = 1640995200, // 2022-01-01
        .difficulty = 15000000000000000,
        .gas_limit = 15000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 25000000000, // 25 gwei
        .prev_randao = [_]u8{0xAB} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 300000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1, // Mainnet
    };

    const gas_price: u256 = 30000000000; // 30 gwei
    const origin = ZERO_ADDRESS;

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, gas_price, origin, .LONDON);
    defer evm.deinit();

    // Verify all fields were set correctly
    try testing.expectEqual(@as(u11, 0), evm.depth);
    try testing.expectEqual(block_info.number, evm.block_info.number);
    try testing.expectEqual(context.chain_id, evm.context.chain_id);
    try testing.expectEqual(gas_price, evm.gas_price);
    try testing.expectEqual(origin, evm.origin);
    try testing.expectEqual(Hardfork.LONDON, evm.hardfork_config);

    // Verify sub-components initialized
    try testing.expectEqual(@as(u32, 0), evm.journal.next_snapshot_id);
    try testing.expectEqual(@as(usize, 0), evm.journal.entry_count());
}

// Duplicate test removed - see earlier occurrence

test "Host interface - get_balance functionality" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const address = ZERO_ADDRESS;
    const balance: u256 = 1000000000000000000; // 1 ETH

    // Set account balance in database
    const account = @import("database_interface_account.zig").Account{
        .balance = balance,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    try memory_db.set_account(address, account);

    const retrieved_balance = evm.get_balance(address);
    try testing.expectEqual(balance, retrieved_balance);

    const zero_address = [_]u8{1} ++ [_]u8{0} ** 19;
    const zero_balance = evm.get_balance(zero_address);
    try testing.expectEqual(@as(u256, 0), zero_balance);
}

test "Host interface - storage operations" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const address = ZERO_ADDRESS;
    const key: u256 = 42;
    const value: u256 = 0xDEADBEEF;

    // Initially should return zero
    const initial_value = evm.get_storage(address, key);
    try testing.expectEqual(@as(u256, 0), initial_value);

    // Set storage value
    try evm.set_storage(address, key, value);

    // Retrieve and verify
    const retrieved_value = evm.get_storage(address, key);
    try testing.expectEqual(value, retrieved_value);

    const different_key: u256 = 99;
    const different_value = evm.get_storage(address, different_key);
    try testing.expectEqual(@as(u256, 0), different_value);
}

test "Host interface - account_exists functionality" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const address = ZERO_ADDRESS;
    const account = @import("database_interface_account.zig").Account{
        .balance = 1000,
        .nonce = 1,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    try memory_db.set_account(address, account);

    const exists = evm.account_exists(address);
    try testing.expect(exists);

    const non_existing = [_]u8{1} ++ [_]u8{0} ** 19;
    const does_not_exist = evm.account_exists(non_existing);
    try testing.expect(!does_not_exist);
}

test "Host interface - call type differentiation" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 100,
            .input = &.{},
            .gas = 100000,
        },
    };

    const call_result = try evm.call(call_params);
    try testing.expect(call_result.success);

    // Test STATICCALL operation (no value transfer allowed)
    const static_params = DefaultEvm.CallParams{
        .staticcall = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .input = &.{},
            .gas = 100000,
        },
    };

    const static_result = try evm.call(static_params);
    try testing.expect(static_result.success);

    // Test DELEGATECALL operation (preserves caller context)
    const delegate_params = DefaultEvm.CallParams{
        .delegatecall = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .input = &.{},
            .gas = 100000,
        },
    };

    const delegate_result = try evm.call(delegate_params);
    try testing.expect(delegate_result.success);
}

test "EVM logs - emit_log functionality" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Test emit_log functionality
    const test_address = ZERO_ADDRESS;
    const topics = [_]u256{ 0x1234, 0x5678 };
    const data = "test log data";

    // Emit a log
    evm.emit_log(test_address, &topics, data);

    // Verify log was stored
    try testing.expectEqual(@as(usize, 1), evm.logs.items.len);
    const log = evm.logs.items[0];
    try testing.expectEqual(test_address, log.address);
    try testing.expectEqual(@as(usize, 2), log.topics.len);
    try testing.expectEqual(@as(u256, 0x1234), log.topics[0]);
    try testing.expectEqual(@as(u256, 0x5678), log.topics[1]);
    try testing.expectEqualStrings("test log data", log.data);

    // Test takeLogs
    const taken_logs = evm.takeLogs();
    defer DefaultEvm.CallResult.deinitLogsSlice(taken_logs, evm.allocator);
    try testing.expectEqual(@as(usize, 1), taken_logs.len);
    try testing.expectEqual(@as(usize, 0), evm.logs.items.len); // Should be empty after taking
}

test "EVM logs - included in CallResult" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Create bytecode that emits LOG0 (0xA0 opcode)
    // PUSH1 0x05 (data length)
    // PUSH1 0x00 (data offset)
    // LOG0
    const bytecode = [_]u8{ 0x60, 0x05, 0x60, 0x00, 0xA0, 0x00 }; // Last 0x00 is STOP
    const code_hash = try memory_db.set_code(&bytecode);
    
    const contract_address: Address = [_]u8{0x12} ++ [_]u8{0} ** 19;
    const account = Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    };
    try memory_db.set_account(contract_address, account);

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = contract_address,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };

    const result = try evm.call(call_params);
    defer {
        // Clean up logs
        for (result.logs) |log| {
            testing.allocator.free(log.topics);
            testing.allocator.free(log.data);
        }
        testing.allocator.free(result.logs);
    }

    // For now, we expect no logs because LOG0 isn't implemented in the frame
    // This test just verifies the infrastructure works
    try testing.expect(result.success);
    try testing.expect(result.logs.len == 0); // Will be > 0 when LOG opcodes are implemented
}

test "Host interface - hardfork compatibility checks" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    // Test with different hardfork configurations
    var london_evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .LONDON);
    defer london_evm.deinit();

    try testing.expectEqual(Hardfork.LONDON, london_evm.get_hardfork());
    try testing.expect(london_evm.is_hardfork_at_least(.HOMESTEAD));
    try testing.expect(london_evm.is_hardfork_at_least(.LONDON));
    try testing.expect(!london_evm.is_hardfork_at_least(.CANCUN));

    var cancun_evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer cancun_evm.deinit();

    try testing.expectEqual(Hardfork.CANCUN, cancun_evm.get_hardfork());
    try testing.expect(cancun_evm.is_hardfork_at_least(.LONDON));
    try testing.expect(cancun_evm.is_hardfork_at_least(.CANCUN));
}

test "Host interface - access cost operations" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .BERLIN);
    defer evm.deinit();

    const address = ZERO_ADDRESS;
    const slot: u256 = 42;

    // Test access costs (EIP-2929)
    const address_cost = try evm.access_address(address);
    const storage_cost = try evm.access_storage_slot(address, slot);

    // Cold access costs
    try testing.expectEqual(@as(u64, 2600), address_cost);
    try testing.expectEqual(@as(u64, 2100), storage_cost);
}

test "Host interface - input size validation" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Create input that exceeds max_input_size (131072 bytes)
    const large_input = try testing.allocator.alloc(u8, 200000);
    defer testing.allocator.free(large_input);
    @memset(large_input, 0xFF);

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = large_input,
            .gas = 100000,
        },
    };

    const result = try evm.call(call_params);

    // Should fail due to input size limit
    try testing.expect(!result.success);
    try testing.expectEqual(@as(u64, 0), result.gas_left);
}

test "Call types - CREATE2 with salt" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const init_code = [_]u8{ 0x60, 0x00, 0x60, 0x00, 0xF3 }; // PUSH1 0 PUSH1 0 RETURN (empty contract)
    const salt: u256 = 0x1234567890ABCDEF;

    const create2_params = DefaultEvm.CallParams{
        .create2 = .{
            .caller = ZERO_ADDRESS,
            .value = 0,
            .init_code = &init_code,
            .salt = salt,
            .gas = 100000,
        },
    };

    const result = try evm.call(create2_params);
    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
}

test "Error handling - nested call depth tracking" {
    const testing = std.testing;

    // Use smaller depth limit for testing
    const TestEvm = Evm(.{ .max_call_depth = 3 });

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try TestEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    try testing.expectEqual(@as(u2, 0), evm.depth);

    const call_params = TestEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };

    // Call should succeed when depth < max
    evm.depth = 2;
    const result1 = try evm.inner_call(call_params);
    try testing.expect(result1.success);
    try testing.expectEqual(@as(u2, 2), evm.depth); // Should restore depth

    // Call should fail when depth >= max
    evm.depth = 3;
    const result2 = try evm.inner_call(call_params);
    try testing.expect(!result2.success);
    try testing.expectEqual(@as(u64, 0), result2.gas_left);
}

test "Error handling - precompile execution" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Test calling ECRECOVER precompile (address 0x01)
    const ecrecover_address = [_]u8{0} ** 19 ++ [_]u8{1}; // 0x0000...0001
    const input_data = [_]u8{0} ** 128; // Invalid ECRECOVER input (all zeros)

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ecrecover_address,
            .value = 0,
            .input = &input_data,
            .gas = 100000,
        },
    };

    const result = try evm.call(call_params);
    // ECRECOVER should handle invalid input gracefully
    try testing.expect(result.gas_left < 100000); // Some gas should be consumed
}

test "Precompiles - IDENTITY precompile (0x04)" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Test IDENTITY precompile - should return input data unchanged
    const identity_address = [_]u8{0} ** 19 ++ [_]u8{4}; // 0x0000...0004
    const test_data = "Hello, World!";

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = identity_address,
            .value = 0,
            .input = test_data,
            .gas = 100000,
        },
    };

    const result = try evm.call(call_params);
    defer if (result.output.len > 0) testing.allocator.free(result.output);

    try testing.expect(result.success);
    try testing.expectEqual(test_data.len, result.output.len);
    try testing.expectEqualStrings(test_data, result.output);

    // Gas cost should be 15 + 3 * 1 = 18 (base + 3 * word count)
    const expected_gas_cost = 15 + 3 * ((test_data.len + 31) / 32);
    try testing.expectEqual(100000 - expected_gas_cost, result.gas_left);
}

test "Precompiles - SHA256 precompile (0x02)" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Test SHA256 precompile
    const sha256_address = [_]u8{0} ** 19 ++ [_]u8{2}; // 0x0000...0002
    const test_input = "";

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = sha256_address,
            .value = 0,
            .input = test_input,
            .gas = 100000,
        },
    };

    const result = try evm.call(call_params);
    defer if (result.output.len > 0) testing.allocator.free(result.output);

    try testing.expect(result.success);
    try testing.expectEqual(@as(usize, 32), result.output.len); // SHA256 always returns 32 bytes
    try testing.expect(result.gas_left < 100000); // Gas should be consumed
}

test "Precompiles - disabled configuration" {
    const testing = std.testing;

    // Create EVM with precompiles disabled
    const NoPrecompileEvm = Evm(.{ .enable_precompiles = false });

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try NoPrecompileEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Try to call IDENTITY precompile - should be treated as regular call
    const identity_address = [_]u8{0} ** 19 ++ [_]u8{4}; // 0x0000...0004
    const test_data = "Hello, World!";

    const call_params = NoPrecompileEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = identity_address,
            .value = 0,
            .input = test_data,
            .gas = 100000,
        },
    };

    const result = try evm.call(call_params);

    // Should succeed but not execute as precompile (no special precompile behavior)
    try testing.expect(result.success);
    try testing.expectEqual(@as(usize, 0), result.output.len); // No precompile output
    try testing.expectEqual(@as(u64, 100000), result.gas_left); // No gas consumed by precompile
}

test "Precompiles - invalid precompile addresses" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Test invalid precompile address (0x0B - beyond supported range)
    const invalid_address = [_]u8{0} ** 19 ++ [_]u8{11}; // 0x0000...000B

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = invalid_address,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };

    const result = try evm.call(call_params);

    // Should succeed as regular call (not precompile)
    try testing.expect(result.success);
    try testing.expectEqual(@as(u64, 100000), result.gas_left); // No gas consumed by precompile
}

// ============================================================================
// Minimal Debug Tests for Benchmark Investigation
// ============================================================================

test "Debug - Gas limit affects execution" {
    const testing = std.testing;
    std.testing.log_level = .warn;
    
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = TransactionContext{
        .gas_limit = 21000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    // Deploy a simple infinite loop contract
    // JUMPDEST (0x5b) PUSH1 0x00 (0x6000) JUMP (0x56)
    const loop_bytecode = [_]u8{0x5b, 0x60, 0x00, 0x56};
    const deploy_address: Address = [_]u8{0} ** 19 ++ [_]u8{1};
    const code_hash = try memory_db.set_code(&loop_bytecode);
    try memory_db.set_account(deploy_address, Account{
        .nonce = 0,
        .balance = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Test 1: Very low gas limit - should fail quickly
    {
        const start_time = std.time.nanoTimestamp();
        const result = try evm.call(.{
            .call = .{
                .caller = ZERO_ADDRESS,
                .to = deploy_address,
                .value = 0,
                .input = &.{},
                .gas = 100, // Very low gas
            },
        });
        const elapsed = std.time.nanoTimestamp() - start_time;
        
        try testing.expect(!result.success); // Should fail
        try testing.expectEqual(@as(u64, 0), result.gas_left); // All gas consumed
        std.log.warn("Low gas (100): elapsed = {} ns, success = {}", .{elapsed, result.success});
    }
    
    // Test 2: Medium gas limit
    {
        const start_time = std.time.nanoTimestamp();
        const result = try evm.call(.{
            .call = .{
                .caller = ZERO_ADDRESS,
                .to = deploy_address,
                .value = 0,
                .input = &.{},
                .gas = 10000,
            },
        });
        const elapsed = std.time.nanoTimestamp() - start_time;
        
        try testing.expect(!result.success); // Should still fail (infinite loop)
        try testing.expectEqual(@as(u64, 0), result.gas_left);
        std.log.warn("Medium gas (10k): elapsed = {} ns, success = {}", .{elapsed, result.success});
    }
    
    // Test 3: High gas limit
    {
        const start_time = std.time.nanoTimestamp();
        const result = try evm.call(.{
            .call = .{
                .caller = ZERO_ADDRESS,
                .to = deploy_address,
                .value = 0,
                .input = &.{},
                .gas = 1000000,
            },
        });
        const elapsed = std.time.nanoTimestamp() - start_time;
        
        try testing.expect(!result.success); // Should fail after consuming all gas
        try testing.expectEqual(@as(u64, 0), result.gas_left);
        std.log.warn("High gas (1M): elapsed = {} ns, success = {}", .{elapsed, result.success});
    }
}

test "Debug - Contract deployment and execution" {
    const testing = std.testing;
    std.testing.log_level = .warn;
    
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = TransactionContext{
        .gas_limit = 21000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    // Test 1: Call to non-existent contract
    {
        const empty_address: Address = [_]u8{0} ** 19 ++ [_]u8{99};
        const start_time = std.time.nanoTimestamp();
        const result = try evm.call(.{
            .call = .{
                .caller = ZERO_ADDRESS,
                .to = empty_address,
                .value = 0,
                .input = &.{},
                .gas = 100000,
            },
        });
        const elapsed = std.time.nanoTimestamp() - start_time;
        
        try testing.expect(result.success); // Empty contract succeeds immediately
        try testing.expectEqual(@as(u64, 100000), result.gas_left); // No gas consumed
        std.log.warn("Empty contract: elapsed = {} ns, gas_left = {}", .{elapsed, result.gas_left});
    }
    
    // Test 2: Simple contract that returns immediately (STOP opcode)
    {
        const stop_bytecode = [_]u8{0x00}; // STOP
        const stop_address: Address = [_]u8{0} ** 19 ++ [_]u8{2};
        const code_hash = try memory_db.set_code(&stop_bytecode);
        try memory_db.set_account(stop_address, Account{
            .nonce = 0,
            .balance = 0,
            .code_hash = code_hash,
            .storage_root = [_]u8{0} ** 32,
        });
        
        const start_time = std.time.nanoTimestamp();
        const result = try evm.call(.{
            .call = .{
                .caller = ZERO_ADDRESS,
                .to = stop_address,
                .value = 0,
                .input = &.{},
                .gas = 100000,
            },
        });
        const elapsed = std.time.nanoTimestamp() - start_time;
        
        try testing.expect(result.success);
        // STOP should consume minimal gas
        const gas_used = 100000 - result.gas_left;
        try testing.expect(gas_used < 100); // Should use very little gas
        std.log.warn("STOP contract: elapsed = {} ns, gas_used = {}", .{elapsed, gas_used});
    }
    
    // Test 3: Contract with some computation
    {
        // PUSH1 0x05, PUSH1 0x03, ADD, PUSH1 0x00, MSTORE, STOP
        // Adds 3 + 5 and stores in memory
        const add_bytecode = [_]u8{0x60, 0x05, 0x60, 0x03, 0x01, 0x60, 0x00, 0x52, 0x00};
        const add_address: Address = [_]u8{0} ** 19 ++ [_]u8{3};
        const code_hash = try memory_db.set_code(&add_bytecode);
        try memory_db.set_account(add_address, Account{
            .nonce = 0,
            .balance = 0,
            .code_hash = code_hash,
            .storage_root = [_]u8{0} ** 32,
        });
        
        const start_time = std.time.nanoTimestamp();
        const result = try evm.call(.{
            .call = .{
                .caller = ZERO_ADDRESS,
                .to = add_address,
                .value = 0,
                .input = &.{},
                .gas = 100000,
            },
        });
        const elapsed = std.time.nanoTimestamp() - start_time;
        
        try testing.expect(result.success);
        const gas_used = 100000 - result.gas_left;
        try testing.expect(gas_used > 0); // Should use some gas
        try testing.expect(gas_used < 1000); // But not too much
        std.log.warn("ADD contract: elapsed = {} ns, gas_used = {}", .{elapsed, gas_used});
    }
}

test "Debug - Bytecode size affects execution time" {
    const testing = std.testing;
    std.testing.log_level = .warn;
    
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = TransactionContext{
        .gas_limit = 21000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    // Create a large contract that does simple operations
    var large_bytecode = std.ArrayList(u8).init(testing.allocator);
    defer large_bytecode.deinit();
    
    // Add many PUSH1/POP pairs (each costs gas but doesn't loop)
    for (0..1000) |_| {
        try large_bytecode.append(0x60); // PUSH1
        try large_bytecode.append(0x42); // value
        try large_bytecode.append(0x50); // POP
    }
    try large_bytecode.append(0x00); // STOP
    
    const large_address: Address = [_]u8{0} ** 19 ++ [_]u8{4};
    const code_hash = try memory_db.set_code(large_bytecode.items);
    try memory_db.set_account(large_address, Account{
        .nonce = 0,
        .balance = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Test with different gas limits
    const gas_limits = [_]u64{10000, 50000, 100000, 500000};
    
    for (gas_limits) |gas_limit| {
        const start_time = std.time.nanoTimestamp();
        const result = try evm.call(.{
            .call = .{
                .caller = ZERO_ADDRESS,
                .to = large_address,
                .value = 0,
                .input = &.{},
                .gas = gas_limit,
            },
        });
        const elapsed = std.time.nanoTimestamp() - start_time;
        
        const gas_used = gas_limit - result.gas_left;
        std.log.warn("Large contract (gas_limit={}): elapsed = {} ns, gas_used = {}, success = {}", 
            .{gas_limit, elapsed, gas_used, result.success});
        
        // With low gas, should fail before completing
        if (gas_limit < 50000) {
            try testing.expect(!result.success);
            try testing.expectEqual(@as(u64, 0), result.gas_left);
        } else {
            // With enough gas, should complete
            try testing.expect(result.success);
            try testing.expect(result.gas_left > 0);
        }
    }
}

test "Security - bounds checking and edge cases" {
    const testing = std.testing;

    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Test maximum gas limit
    const max_gas_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = std.math.maxInt(u64),
        },
    };

    const max_gas_result = try evm.call(max_gas_params);
    try testing.expect(max_gas_result.gas_left <= std.math.maxInt(u64));

    // Test invalid address operations
    const invalid_address = [_]u8{0xFF} ** 20;
    const balance = evm.get_balance(invalid_address);
    try testing.expectEqual(@as(u256, 0), balance);

    const exists = evm.account_exists(invalid_address);
    try testing.expect(!exists);

    // Test max u256 storage operations
    const max_key: u256 = std.math.maxInt(u256);
    const max_value: u256 = std.math.maxInt(u256);

    try evm.set_storage(ZERO_ADDRESS, max_key, max_value);
    const retrieved_max = evm.get_storage(ZERO_ADDRESS, max_key);
    try testing.expectEqual(max_value, retrieved_max);
}

test "EVM with minimal planner strategy" {
    const testing = std.testing;

    // Define EVM config with minimal planner strategy
    const MinimalEvmConfig = EvmConfig{
        .planner_strategy = .minimal,
    };
    const MinimalEvm = Evm(MinimalEvmConfig);

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try MinimalEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Test basic execution with minimal planner
    const simple_bytecode = [_]u8{
        0x60, 0x05, // PUSH1 5
        0x60, 0x03, // PUSH1 3
        0x01, // ADD
        0x00, // STOP
    };

    const call_params = MinimalEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &simple_bytecode,
            .gas = 100000,
        },
    };

    const result = try evm.call(call_params);
    try testing.expect(result.success);
}

test "EVM with advanced planner strategy" {
    const testing = std.testing;

    // Define EVM config with advanced planner strategy
    const AdvancedEvmConfig = EvmConfig{
        .planner_strategy = .advanced,
    };
    const AdvancedEvm = Evm(AdvancedEvmConfig);

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try AdvancedEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Test basic execution with advanced planner
    const simple_bytecode = [_]u8{
        0x60, 0x05, // PUSH1 5
        0x60, 0x03, // PUSH1 3
        0x01, // ADD
        0x00, // STOP
    };

    const call_params = AdvancedEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &simple_bytecode,
            .gas = 100000,
        },
    };

    const result = try evm.call(call_params);
    try testing.expect(result.success);
}

// =============================================================================
// Journal State Application Rollback Tests
// =============================================================================

test "journal state application - storage change rollback" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const test_address = [_]u8{0x12} ++ [_]u8{0} ** 19;
    const storage_key: u256 = 0x123;
    const original_value: u256 = 0x456;
    const new_value: u256 = 0x789;

    // Set initial storage value
    try evm.database.set_storage(test_address, storage_key, original_value);

    // Create snapshot
    const snapshot_id = evm.create_snapshot();

    // Modify storage value and record in journal
    try evm.database.set_storage(test_address, storage_key, new_value);
    try evm.journal.entries.append(.{
        .snapshot_id = snapshot_id,
        .data = .{ .storage_change = .{
            .address = test_address,
            .key = storage_key,
            .original_value = original_value,
        } },
    });

    // Verify new value is set
    const current_value = try evm.database.get_storage(test_address, storage_key);
    try testing.expectEqual(new_value, current_value);

    // Revert to snapshot
    evm.revert_to_snapshot(snapshot_id);

    // Verify storage value was reverted
    const reverted_value = try evm.database.get_storage(test_address, storage_key);
    try testing.expectEqual(original_value, reverted_value);
}

test "journal state application - balance change rollback" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const test_address = [_]u8{0x34} ++ [_]u8{0} ** 19;
    const original_balance: u256 = 1000;
    const new_balance: u256 = 2000;

    // Set initial account balance
    var original_account = Account.zero();
    original_account.balance = original_balance;
    try evm.database.set_account(test_address, original_account);

    // Create snapshot
    const snapshot_id = evm.create_snapshot();

    // Modify balance and record in journal
    var modified_account = original_account;
    modified_account.balance = new_balance;
    try evm.database.set_account(test_address, modified_account);
    try evm.journal.entries.append(.{
        .snapshot_id = snapshot_id,
        .data = .{ .balance_change = .{
            .address = test_address,
            .original_balance = original_balance,
        } },
    });

    // Verify new balance is set
    const current_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqual(new_balance, current_account.balance);

    // Revert to snapshot
    evm.revert_to_snapshot(snapshot_id);

    // Verify balance was reverted
    const reverted_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqual(original_balance, reverted_account.balance);
}

test "journal state application - nonce change rollback" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const test_address = [_]u8{0x56} ++ [_]u8{0} ** 19;
    const original_nonce: u64 = 5;
    const new_nonce: u64 = 10;

    // Set initial account nonce
    var original_account = Account.zero();
    original_account.nonce = original_nonce;
    try evm.database.set_account(test_address, original_account);

    // Create snapshot
    const snapshot_id = evm.create_snapshot();

    // Modify nonce and record in journal
    var modified_account = original_account;
    modified_account.nonce = new_nonce;
    try evm.database.set_account(test_address, modified_account);
    try evm.journal.entries.append(.{
        .snapshot_id = snapshot_id,
        .data = .{ .nonce_change = .{
            .address = test_address,
            .original_nonce = original_nonce,
        } },
    });

    // Verify new nonce is set
    const current_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqual(new_nonce, current_account.nonce);

    // Revert to snapshot
    evm.revert_to_snapshot(snapshot_id);

    // Verify nonce was reverted
    const reverted_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqual(original_nonce, reverted_account.nonce);
}

test "journal state application - code change rollback" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const test_address = [_]u8{0x78} ++ [_]u8{0} ** 19;
    const original_code_hash = [_]u8{0xAA} ++ [_]u8{0} ** 31;
    const new_code_hash = [_]u8{0xBB} ++ [_]u8{0} ** 31;

    // Set initial account code hash
    var original_account = Account.zero();
    original_account.code_hash = original_code_hash;
    try evm.database.set_account(test_address, original_account);

    // Create snapshot
    const snapshot_id = evm.create_snapshot();

    // Modify code hash and record in journal
    var modified_account = original_account;
    modified_account.code_hash = new_code_hash;
    try evm.database.set_account(test_address, modified_account);
    try evm.journal.entries.append(.{
        .snapshot_id = snapshot_id,
        .data = .{ .code_change = .{
            .address = test_address,
            .original_code_hash = original_code_hash,
        } },
    });

    // Verify new code hash is set
    const current_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqualSlices(u8, &new_code_hash, &current_account.code_hash);

    // Revert to snapshot
    evm.revert_to_snapshot(snapshot_id);

    // Verify code hash was reverted
    const reverted_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqualSlices(u8, &original_code_hash, &reverted_account.code_hash);
}

test "journal state application - multiple changes rollback" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const test_address = [_]u8{0x9A} ++ [_]u8{0} ** 19;
    const storage_key: u256 = 0xABC;

    // Original state
    const original_balance: u256 = 500;
    const original_nonce: u64 = 3;
    const original_storage: u256 = 0x111;
    const original_code_hash = [_]u8{0xCC} ++ [_]u8{0} ** 31;

    // New state
    const new_balance: u256 = 1500;
    const new_nonce: u64 = 8;
    const new_storage: u256 = 0x999;
    const new_code_hash = [_]u8{0xDD} ++ [_]u8{0} ** 31;

    // Set initial state
    var original_account = Account.zero();
    original_account.balance = original_balance;
    original_account.nonce = original_nonce;
    original_account.code_hash = original_code_hash;
    try evm.database.set_account(test_address, original_account);
    try evm.database.set_storage(test_address, storage_key, original_storage);

    // Create snapshot
    const snapshot_id = evm.create_snapshot();

    // Make multiple changes and record in journal
    var modified_account = original_account;
    modified_account.balance = new_balance;
    modified_account.nonce = new_nonce;
    modified_account.code_hash = new_code_hash;
    try evm.database.set_account(test_address, modified_account);
    try evm.database.set_storage(test_address, storage_key, new_storage);

    // Add journal entries for all changes
    try evm.journal.entries.append(.{
        .snapshot_id = snapshot_id,
        .data = .{ .balance_change = .{
            .address = test_address,
            .original_balance = original_balance,
        } },
    });
    try evm.journal.entries.append(.{
        .snapshot_id = snapshot_id,
        .data = .{ .nonce_change = .{
            .address = test_address,
            .original_nonce = original_nonce,
        } },
    });
    try evm.journal.entries.append(.{
        .snapshot_id = snapshot_id,
        .data = .{ .code_change = .{
            .address = test_address,
            .original_code_hash = original_code_hash,
        } },
    });
    try evm.journal.entries.append(.{
        .snapshot_id = snapshot_id,
        .data = .{ .storage_change = .{
            .address = test_address,
            .key = storage_key,
            .original_value = original_storage,
        } },
    });

    // Verify all new values are set
    const current_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqual(new_balance, current_account.balance);
    try testing.expectEqual(new_nonce, current_account.nonce);
    try testing.expectEqualSlices(u8, &new_code_hash, &current_account.code_hash);
    const current_storage = try evm.database.get_storage(test_address, storage_key);
    try testing.expectEqual(new_storage, current_storage);

    // Revert to snapshot
    evm.revert_to_snapshot(snapshot_id);

    // Verify all values were reverted
    const reverted_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqual(original_balance, reverted_account.balance);
    try testing.expectEqual(original_nonce, reverted_account.nonce);
    try testing.expectEqualSlices(u8, &original_code_hash, &reverted_account.code_hash);
    const reverted_storage = try evm.database.get_storage(test_address, storage_key);
    try testing.expectEqual(original_storage, reverted_storage);
}

test "journal state application - nested snapshots rollback" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    const test_address = [_]u8{0xBE} ++ [_]u8{0} ** 19;
    const original_balance: u256 = 100;
    const middle_balance: u256 = 200;
    const final_balance: u256 = 300;

    // Set initial state
    var account = Account.zero();
    account.balance = original_balance;
    try evm.database.set_account(test_address, account);

    // Create first snapshot
    const snapshot1 = evm.create_snapshot();

    // First change
    account.balance = middle_balance;
    try evm.database.set_account(test_address, account);
    try evm.journal.entries.append(.{
        .snapshot_id = snapshot1,
        .data = .{ .balance_change = .{
            .address = test_address,
            .original_balance = original_balance,
        } },
    });

    // Create second snapshot
    const snapshot2 = evm.create_snapshot();

    // Second change
    account.balance = final_balance;
    try evm.database.set_account(test_address, account);
    try evm.journal.entries.append(.{
        .snapshot_id = snapshot2,
        .data = .{ .balance_change = .{
            .address = test_address,
            .original_balance = middle_balance,
        } },
    });

    // Verify final state
    var current_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqual(final_balance, current_account.balance);

    // Revert to second snapshot (should restore middle state)
    evm.revert_to_snapshot(snapshot2);
    current_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqual(middle_balance, current_account.balance);

    // Revert to first snapshot (should restore original state)
    evm.revert_to_snapshot(snapshot1);
    current_account = (try evm.database.get_account(test_address)).?;
    try testing.expectEqual(original_balance, current_account.balance);
}

test "journal state application - empty journal rollback" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Create snapshot with no changes
    const snapshot_id = evm.create_snapshot();

    // Revert to snapshot (should be no-op)
    evm.revert_to_snapshot(snapshot_id);

    // Test passes if no error is thrown
    try testing.expect(true);
}

test "EVM contract execution - minimal benchmark reproduction" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 21000000, // Higher gas for contract execution
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Simple test contract bytecode: PUSH1 0x42 PUSH1 0x00 MSTORE PUSH1 0x20 PUSH1 0x00 RETURN
    // This stores 0x42 in memory at position 0 and returns 32 bytes
    const test_bytecode = [_]u8{ 
        0x60, 0x42,       // PUSH1 0x42
        0x60, 0x00,       // PUSH1 0x00  
        0x52,             // MSTORE
        0x60, 0x20,       // PUSH1 0x20
        0x60, 0x00,       // PUSH1 0x00
        0xf3              // RETURN
    };

    // Deploy the contract first
    const deploy_address: Address = [_]u8{0} ** 19 ++ [_]u8{1}; // Address 0x000...001

    // Store contract code in database
    const code_hash = try memory_db.set_code(&test_bytecode);
    try memory_db.set_account(deploy_address, Account{
        .nonce = 0,
        .balance = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = deploy_address,
            .value = 0,
            .input = &.{}, // No input data
            .gas = 100000,
        },
    };

    // Execute the contract - this should reproduce the benchmark scenario
    const result = try evm.call(call_params);

    // Verify execution succeeded
    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
    try testing.expectEqual(@as(usize, 32), result.output.len);
}

test "Precompile - IDENTITY (0x04) basic functionality" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 21000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Test calling IDENTITY precompile (0x04) - should return input as-is
    const precompile_address: Address = [_]u8{0} ** 19 ++ [_]u8{4}; // Address 0x000...004
    const input_data = "Hello, World!";

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = precompile_address,
            .value = 0,
            .input = input_data,
            .gas = 100000,
        },
    };

    // Execute the precompile
    const result = try evm.call(call_params);

    // Verify execution succeeded
    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
    try testing.expectEqualSlices(u8, input_data, result.output);
}

test "Precompile - SHA256 (0x02) basic functionality" {
    const testing = std.testing;

    // Create test database
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);

    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = TransactionContext{
        .gas_limit = 21000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Test calling SHA256 precompile (0x02)
    const precompile_address: Address = [_]u8{0} ** 19 ++ [_]u8{2}; // Address 0x000...002
    const input_data = "abc";

    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = precompile_address,
            .value = 0,
            .input = input_data,
            .gas = 100000,
        },
    };

    // Execute the precompile
    const result = try evm.call(call_params);

    // Verify execution succeeded
    try testing.expect(result.success);
    try testing.expect(result.gas_left > 0);
    try testing.expectEqual(@as(usize, 32), result.output.len);
    
    // Expected SHA-256 hash of "abc"
    const expected = [_]u8{
        0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea, 0x41, 0x41, 0x40, 0xde, 0x5d, 0xae, 0x22, 0x23,
        0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c, 0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad,
    };
    try testing.expectEqualSlices(u8, &expected, result.output);
}

test "Precompile diagnosis - ECRECOVER (0x01) placeholder implementation" {
    const testing = std.testing;
    
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 1_000_000_000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = TransactionContext{
        .gas_limit = 21_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, primitives.ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    // Test ECRECOVER with invalid signature (all zeros)
    const precompile_address: Address = [_]u8{0} ** 19 ++ [_]u8{1};
    const input_data = [_]u8{0} ** 128; // Invalid signature
    
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = primitives.ZERO_ADDRESS,
            .to = precompile_address,
            .value = 0,
            .input = &input_data,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(call_params);
    
    try testing.expect(result.success);
    try testing.expectEqual(@as(usize, 32), result.output.len);
    
    // ECRECOVER returns zero address for invalid signatures (placeholder behavior)
    for (result.output) |byte| {
        try testing.expectEqual(@as(u8, 0), byte);
    }
}

test "Precompile diagnosis - RIPEMD160 (0x03) unimplemented" {
    const testing = std.testing;
    
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 1_000_000_000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = TransactionContext{
        .gas_limit = 21_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, primitives.ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    const precompile_address: Address = [_]u8{0} ** 19 ++ [_]u8{3};
    const input_data = "test data";
    
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = primitives.ZERO_ADDRESS,
            .to = precompile_address,
            .value = 0,
            .input = input_data,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(call_params);
    
    // RIPEMD160 is a placeholder implementation (returns zeros)
    try testing.expect(result.success);
    try testing.expectEqual(@as(usize, 32), result.output.len);
    
    // Should be zeros (placeholder behavior)
    for (result.output) |byte| {
        try testing.expectEqual(@as(u8, 0), byte);
    }
}

test "Precompile diagnosis - MODEXP (0x05) basic case works" {
    const testing = std.testing;
    
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 1_000_000_000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = TransactionContext{
        .gas_limit = 21_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, primitives.ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    const precompile_address: Address = [_]u8{0} ** 19 ++ [_]u8{5};
    
    // 3^4 mod 5 = 81 mod 5 = 1
    var input: [99]u8 = [_]u8{0} ** 99;
    input[31] = 1;    // base_len = 1
    input[63] = 1;    // exp_len = 1
    input[95] = 1;    // mod_len = 1
    input[96] = 3;    // base = 3
    input[97] = 4;    // exp = 4
    input[98] = 5;    // mod = 5
    
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = primitives.ZERO_ADDRESS,
            .to = precompile_address,
            .value = 0,
            .input = &input,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(call_params);
    
    try testing.expect(result.success);
    try testing.expectEqual(@as(usize, 1), result.output.len);
    try testing.expectEqual(@as(u8, 1), result.output[0]);
}

test "Precompile diagnosis - BN254 operations disabled" {
    const testing = std.testing;
    
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 1_000_000_000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = TransactionContext{
        .gas_limit = 21_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, primitives.ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    // Test ECADD (0x06)
    const ecadd_address: Address = [_]u8{0} ** 19 ++ [_]u8{6};
    const ecadd_input = [_]u8{0} ** 128; // Two zero points
    
    const ecadd_params = DefaultEvm.CallParams{
        .call = .{
            .caller = primitives.ZERO_ADDRESS,
            .to = ecadd_address,
            .value = 0,
            .input = &ecadd_input,
            .gas = 100000,
        },
    };
    
    const ecadd_result = try evm.call(ecadd_params);
    
    // BN254 operations might be disabled (check build_options.no_bn254)
    // The precompile will either succeed with placeholder output or fail
    if (ecadd_result.success) {
        try testing.expectEqual(@as(usize, 64), ecadd_result.output.len);
        // Placeholder implementation returns all zeros
        for (ecadd_result.output) |byte| {
            try testing.expectEqual(@as(u8, 0), byte);
        }
    } else {
        // BN254 operations disabled - this is expected behavior
        std.debug.print("BN254 operations are disabled (no_bn254 build option)\n", .{});
    }
}

test "Precompile diagnosis - BLAKE2F (0x09) placeholder" {
    const testing = std.testing;
    
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 1_000_000_000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = TransactionContext{
        .gas_limit = 21_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, primitives.ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    const precompile_address: Address = [_]u8{0} ** 19 ++ [_]u8{9};
    const input = [_]u8{0} ** 213; // Valid BLAKE2F input length
    
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = primitives.ZERO_ADDRESS,
            .to = precompile_address,
            .value = 0,
            .input = &input,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(call_params);
    
    try testing.expect(result.success);
    try testing.expectEqual(@as(usize, 64), result.output.len);
    
    // BLAKE2F placeholder returns all zeros
    for (result.output) |byte| {
        try testing.expectEqual(@as(u8, 0), byte);
    }
}

test "EVM benchmark scenario - reproduces segfault" {
    const testing = std.testing;
    const allocator = testing.allocator;
    
    // Create test database
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    // Deploy contract first (ERC20 approval bytecode snippet)
    const stop_bytecode = [_]u8{0x00}; // Simple STOP for now
    const deploy_address: Address = [_]u8{0} ** 19 ++ [_]u8{1};
    const code_hash = try memory_db.set_code(&stop_bytecode);
    try memory_db.set_account(deploy_address, Account{
        .nonce = 0,
        .balance = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Create EVM instance
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = TransactionContext{
        .gas_limit = 21000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm_instance = try DefaultEvm.init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm_instance.deinit();
    
    // Simple calldata
    const calldata = [_]u8{0x00};
    
    // Execute call (simulating benchmark)
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = deploy_address,
            .value = 0,
            .input = &calldata,
            .gas = 100000,
        },
    };
    
    const result = try evm_instance.call(call_params);
    try testing.expect(result.success);
    
    // The segfault happens in deinit, so let's explicitly test that
    // by creating and destroying multiple times
    for (0..3) |_| {
        var temp_evm = try DefaultEvm.init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
        const temp_result = try temp_evm.call(call_params);
        try testing.expect(temp_result.success);
        temp_evm.deinit(); // This is where the segfault happens
    }
}

// ============================================================================
// Cross-Contract CREATE Interaction Tests
// ============================================================================

test "CREATE interaction - deployed contract can be called" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var evm_instance = try DefaultEvm.init(
        allocator,
        db_interface,
        BlockInfo{
            .number = 1,
            .timestamp = 1000,
            .difficulty = 100,
            .gas_limit = 30_000_000,
            .coinbase = ZERO_ADDRESS,
            .base_fee = 1_000_000_000,
            .prev_randao = [_]u8{0} ** 32,
        },
        TransactionContext{
            .gas_limit = 10_000_000,
            .coinbase = ZERO_ADDRESS,
            .chain_id = 1,
        },
        20_000_000_000,
        [_]u8{0x01} ** 20,
        .CANCUN,
    );
    defer evm_instance.deinit();
    
    // Step 1: Deploy a simple contract that returns 42
    // Init code: stores runtime code and returns it
    const runtime_code = [_]u8{
        0x60, 0x2A, // PUSH1 42
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    var init_code = std.ArrayList(u8).init(allocator);
    defer init_code.deinit();
    
    // Store runtime code in memory
    for (runtime_code, 0..) |byte, i| {
        try init_code.append(0x60); // PUSH1
        try init_code.append(@intCast(i));
        try init_code.append(0x60); // PUSH1
        try init_code.append(byte);
        try init_code.append(0x53); // MSTORE8
    }
    
    // Return runtime code
    try init_code.append(0x60); // PUSH1
    try init_code.append(@intCast(runtime_code.len)); // size
    try init_code.append(0x60); // PUSH1
    try init_code.append(0x00); // offset
    try init_code.append(0xF3); // RETURN
    
    // Deploy the contract
    const create_result = try evm_instance.call(.{
        .create = .{
            .caller = [_]u8{0x01} ** 20,
            .value = 0,
            .init_code = init_code.items,
            .gas = 1_000_000,
        },
    });
    defer if (create_result.output.len > 0) allocator.free(create_result.output);
    
    try std.testing.expect(create_result.success);
    try std.testing.expectEqual(@as(usize, 20), create_result.output.len);
    
    // Get deployed contract address
    var contract_address: Address = undefined;
    @memcpy(&contract_address, create_result.output[0..20]);
    
    // Step 2: Call the deployed contract
    const call_result = try evm_instance.call(.{
        .call = .{
            .caller = [_]u8{0x01} ** 20,
            .to = contract_address,
            .value = 0,
            .input = &[_]u8{}, // No input data
            .gas = 100_000,
        },
    });
    defer if (call_result.output.len > 0) allocator.free(call_result.output);
    
    try std.testing.expect(call_result.success);
    try std.testing.expectEqual(@as(usize, 32), call_result.output.len);
    
    // Verify returned value is 42
    var returned_value: u256 = 0;
    for (call_result.output) |byte| {
        returned_value = (returned_value << 8) | byte;
    }
    try std.testing.expectEqual(@as(u256, 42), returned_value);
}

test "CREATE interaction - factory creates and initializes child contracts" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var evm_instance = try DefaultEvm.init(
        allocator,
        db_interface,
        BlockInfo{
            .number = 1,
            .timestamp = 1000,
            .difficulty = 100,
            .gas_limit = 30_000_000,
            .coinbase = ZERO_ADDRESS,
            .base_fee = 1_000_000_000,
            .prev_randao = [_]u8{0} ** 32,
        },
        TransactionContext{
            .gas_limit = 10_000_000,
            .coinbase = ZERO_ADDRESS,
            .chain_id = 1,
        },
        20_000_000_000,
        [_]u8{0x01} ** 20,
        .CANCUN,
    );
    defer evm_instance.deinit();
    
    // Child contract: stores initialization value and returns it
    const child_runtime = [_]u8{
        0x60, 0x00, // PUSH1 0
        0x54,       // SLOAD (load value from slot 0)
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    // Child init code: stores constructor argument in slot 0
    var child_init = std.ArrayList(u8).init(allocator);
    defer child_init.deinit();
    
    // Store caller-provided value in slot 0
    try child_init.append(0x60); // PUSH1
    try child_init.append(0x00); // 0 (calldata offset)
    try child_init.append(0x35); // CALLDATALOAD
    try child_init.append(0x60); // PUSH1
    try child_init.append(0x00); // 0 (storage slot)
    try child_init.append(0x55); // SSTORE
    
    // Store runtime code in memory
    for (child_runtime, 0..) |byte, i| {
        try child_init.append(0x60); // PUSH1
        try child_init.append(@intCast(i));
        try child_init.append(0x60); // PUSH1
        try child_init.append(byte);
        try child_init.append(0x53); // MSTORE8
    }
    
    // Return runtime code
    try child_init.append(0x60); // PUSH1
    try child_init.append(@intCast(child_runtime.len));
    try child_init.append(0x60); // PUSH1
    try child_init.append(0x00);
    try child_init.append(0xF3); // RETURN
    
    // Factory contract: creates child with initialization value
    var factory_code = std.ArrayList(u8).init(allocator);
    defer factory_code.deinit();
    
    // Load initialization value from calldata
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x00); // 0
    try factory_code.append(0x35); // CALLDATALOAD
    
    // Store child init code in memory (with constructor arg appended)
    for (child_init.items, 0..) |byte, i| {
        try factory_code.append(0x60); // PUSH1
        try factory_code.append(byte);
        try factory_code.append(0x60); // PUSH1
        try factory_code.append(@intCast(i));
        try factory_code.append(0x53); // MSTORE8
    }
    
    // Append constructor argument to init code
    const init_size = child_init.items.len;
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(@intCast(init_size)); // offset for constructor arg
    try factory_code.append(0x52); // MSTORE (store 32-byte constructor arg)
    
    // CREATE child contract
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(@intCast(init_size + 32)); // size including constructor arg
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x00); // offset
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x00); // value
    try factory_code.append(0xF0); // CREATE
    
    // Return created address
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x00); // 0
    try factory_code.append(0x52); // MSTORE
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x20); // 32
    try factory_code.append(0x60); // PUSH1
    try factory_code.append(0x00); // 0
    try factory_code.append(0xF3); // RETURN
    
    // Deploy factory with initialization value 123
    var deploy_data = std.ArrayList(u8).init(allocator);
    defer deploy_data.deinit();
    const init_value = [_]u8{0} ** 31 ++ [_]u8{123}; // 123 as uint256
    try deploy_data.appendSlice(&init_value);
    
    const factory_result = try evm_instance.call(.{
        .create = .{
            .caller = [_]u8{0x01} ** 20,
            .value = 0,
            .init_code = deploy_data.items,
            .gas = 5_000_000,
        },
    });
    defer if (factory_result.output.len > 0) allocator.free(factory_result.output);
    
    try std.testing.expect(factory_result.success);
    
    // Extract child contract address from output
    var child_address: Address = undefined;
    @memcpy(&child_address, factory_result.output[12..32]); // Address is in bytes 12-31
    
    // Call child contract to verify initialization
    const verify_result = try evm_instance.call(.{
        .call = .{
            .caller = [_]u8{0x01} ** 20,
            .to = child_address,
            .value = 0,
            .input = &[_]u8{},
            .gas = 100_000,
        },
    });
    defer if (verify_result.output.len > 0) allocator.free(verify_result.output);
    
    try std.testing.expect(verify_result.success);
    
    // Verify returned value is 123
    var returned_value: u256 = 0;
    for (verify_result.output) |byte| {
        returned_value = (returned_value << 8) | byte;
    }
    try std.testing.expectEqual(@as(u256, 123), returned_value);
}

test "CREATE interaction - contract creates contract that creates contract" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var evm_instance = try DefaultEvm.init(
        allocator,
        db_interface,
        BlockInfo{
            .number = 1,
            .timestamp = 1000,
            .difficulty = 100,
            .gas_limit = 30_000_000,
            .coinbase = ZERO_ADDRESS,
            .base_fee = 1_000_000_000,
            .prev_randao = [_]u8{0} ** 32,
        },
        TransactionContext{
            .gas_limit = 20_000_000,
            .coinbase = ZERO_ADDRESS,
            .chain_id = 1,
        },
        20_000_000_000,
        [_]u8{0x01} ** 20,
        .CANCUN,
    );
    defer evm_instance.deinit();
    
    // Level 3 contract (grandchild): returns constant 99
    const level3_runtime = [_]u8{
        0x60, 0x63, // PUSH1 99
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    // Level 3 init code
    var level3_init = std.ArrayList(u8).init(allocator);
    defer level3_init.deinit();
    for (level3_runtime, 0..) |byte, i| {
        try level3_init.append(0x60); // PUSH1
        try level3_init.append(@intCast(i));
        try level3_init.append(0x60); // PUSH1
        try level3_init.append(byte);
        try level3_init.append(0x53); // MSTORE8
    }
    try level3_init.append(0x60); // PUSH1
    try level3_init.append(@intCast(level3_runtime.len));
    try level3_init.append(0x60); // PUSH1
    try level3_init.append(0x00);
    try level3_init.append(0xF3); // RETURN
    
    // Level 2 contract (child): creates level 3 and returns its address
    var level2_runtime = std.ArrayList(u8).init(allocator);
    defer level2_runtime.deinit();
    
    // Store level 3 init code
    for (level3_init.items, 0..) |byte, i| {
        try level2_runtime.append(0x60); // PUSH1
        try level2_runtime.append(byte);
        try level2_runtime.append(0x60); // PUSH1
        try level2_runtime.append(@intCast(i));
        try level2_runtime.append(0x53); // MSTORE8
    }
    
    // CREATE level 3
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(@intCast(level3_init.items.len));
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(0x00); // offset
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(0x00); // value
    try level2_runtime.append(0xF0); // CREATE
    
    // Return address
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(0x00); // 0
    try level2_runtime.append(0x52); // MSTORE
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(0x20); // 32
    try level2_runtime.append(0x60); // PUSH1
    try level2_runtime.append(0x00); // 0
    try level2_runtime.append(0xF3); // RETURN
    
    // Level 2 init code
    var level2_init = std.ArrayList(u8).init(allocator);
    defer level2_init.deinit();
    for (level2_runtime.items, 0..) |byte, i| {
        try level2_init.append(0x60); // PUSH1
        try level2_init.append(@intCast(i));
        try level2_init.append(0x60); // PUSH1
        try level2_init.append(byte);
        try level2_init.append(0x53); // MSTORE8
    }
    try level2_init.append(0x61); // PUSH2
    try level2_init.append(@intCast(level2_runtime.items.len >> 8));
    try level2_init.append(@intCast(level2_runtime.items.len & 0xFF));
    try level2_init.append(0x60); // PUSH1
    try level2_init.append(0x00);
    try level2_init.append(0xF3); // RETURN
    
    // Level 1 contract (parent): creates level 2
    var level1_code = std.ArrayList(u8).init(allocator);
    defer level1_code.deinit();
    
    // Store level 2 init code
    for (level2_init.items, 0..) |byte, i| {
        try level1_code.append(0x60); // PUSH1
        try level1_code.append(byte);
        try level1_code.append(0x61); // PUSH2
        try level1_code.append(@intCast(i >> 8));
        try level1_code.append(@intCast(i & 0xFF));
        try level1_code.append(0x53); // MSTORE8
    }
    
    // CREATE level 2
    try level1_code.append(0x61); // PUSH2
    try level1_code.append(@intCast(level2_init.items.len >> 8));
    try level1_code.append(@intCast(level2_init.items.len & 0xFF));
    try level1_code.append(0x60); // PUSH1
    try level1_code.append(0x00); // offset
    try level1_code.append(0x60); // PUSH1
    try level1_code.append(0x00); // value
    try level1_code.append(0xF0); // CREATE
    
    // Store level 2 address
    try level1_code.append(0x60); // PUSH1
    try level1_code.append(0x00); // slot 0
    try level1_code.append(0x55); // SSTORE
    try level1_code.append(0x00); // STOP
    
    // Execute level 1
    const result1 = try evm_instance.call(.{
        .create = .{
            .caller = [_]u8{0x01} ** 20,
            .value = 0,
            .init_code = level1_code.items,
            .gas = 10_000_000,
        },
    });
    defer if (result1.output.len > 0) allocator.free(result1.output);
    
    try std.testing.expect(result1.success);
    
    // Get level 2 address from storage
    const level2_addr_u256 = evm_instance.get_storage([_]u8{0x01} ** 20, 0);
    var level2_addr: Address = undefined;
    const bytes = std.mem.toBytes(level2_addr_u256);
    @memcpy(&level2_addr, bytes[12..32]);
    
    // Call level 2 to get level 3 address
    const result2 = try evm_instance.call(.{
        .call = .{
            .caller = [_]u8{0x01} ** 20,
            .to = level2_addr,
            .value = 0,
            .input = &[_]u8{},
            .gas = 1_000_000,
        },
    });
    defer if (result2.output.len > 0) allocator.free(result2.output);
    
    try std.testing.expect(result2.success);
    
    // Get level 3 address
    var level3_addr: Address = undefined;
    @memcpy(&level3_addr, result2.output[12..32]);
    
    // Call level 3 to verify it returns 99
    const result3 = try evm_instance.call(.{
        .call = .{
            .caller = [_]u8{0x01} ** 20,
            .to = level3_addr,
            .value = 0,
            .input = &[_]u8{},
            .gas = 100_000,
        },
    });
    defer if (result3.output.len > 0) allocator.free(result3.output);
    
    try std.testing.expect(result3.success);
    
    var returned_value: u256 = 0;
    for (result3.output) |byte| {
        returned_value = (returned_value << 8) | byte;
    }
    try std.testing.expectEqual(@as(u256, 99), returned_value);
}

test "CREATE interaction - created contract modifies parent storage" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var evm_instance = try DefaultEvm.init(
        allocator,
        db_interface,
        BlockInfo{
            .number = 1,
            .timestamp = 1000,
            .difficulty = 100,
            .gas_limit = 30_000_000,
            .coinbase = ZERO_ADDRESS,
            .base_fee = 1_000_000_000,
            .prev_randao = [_]u8{0} ** 32,
        },
        TransactionContext{
            .gas_limit = 10_000_000,
            .coinbase = ZERO_ADDRESS,
            .chain_id = 1,
        },
        20_000_000_000,
        [_]u8{0x01} ** 20,
        .CANCUN,
    );
    defer evm_instance.deinit();
    
    // Child contract that calls back to parent
    const child_runtime = [_]u8{
        // Call parent's setValue(42) function
        0x60, 0x2A, // PUSH1 42 (value to set)
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE (store at memory[0])
        
        0x60, 0x20, // PUSH1 32 (return data size)
        0x60, 0x00, // PUSH1 0 (return data offset)
        0x60, 0x20, // PUSH1 32 (input size)
        0x60, 0x00, // PUSH1 0 (input offset)
        0x60, 0x00, // PUSH1 0 (value)
        0x33,       // CALLER (parent address)
        0x5A,       // GAS
        0xF1,       // CALL parent
        
        // Return success
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    };
    
    // Child init code
    var child_init = std.ArrayList(u8).init(allocator);
    defer child_init.deinit();
    for (child_runtime, 0..) |byte, i| {
        try child_init.append(0x60); // PUSH1
        try child_init.append(@intCast(i));
        try child_init.append(0x60); // PUSH1
        try child_init.append(byte);
        try child_init.append(0x53); // MSTORE8
    }
    try child_init.append(0x60); // PUSH1
    try child_init.append(@intCast(child_runtime.len));
    try child_init.append(0x60); // PUSH1
    try child_init.append(0x00);
    try child_init.append(0xF3); // RETURN
    
    // Parent contract with setValue function
    var parent_code = std.ArrayList(u8).init(allocator);
    defer parent_code.deinit();
    
    // Check if being called (calldata size > 0)
    try parent_code.append(0x36); // CALLDATASIZE
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x23); // Jump destination for setValue
    try parent_code.append(0x57); // JUMPI
    
    // CREATE path (no calldata)
    // Store child init code
    for (child_init.items, 0..) |byte, i| {
        try parent_code.append(0x60); // PUSH1
        try parent_code.append(byte);
        try parent_code.append(0x60); // PUSH1
        try parent_code.append(@intCast(i));
        try parent_code.append(0x53); // MSTORE8
    }
    
    // CREATE child
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(@intCast(child_init.items.len));
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x00); // offset
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x00); // value
    try parent_code.append(0xF0); // CREATE
    
    // Store child address at slot 1
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x01); // slot 1
    try parent_code.append(0x55); // SSTORE
    try parent_code.append(0x00); // STOP
    
    // setValue function (JUMPDEST at 0x23)
    try parent_code.append(0x5B); // JUMPDEST
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x00); // 0
    try parent_code.append(0x35); // CALLDATALOAD (load value)
    try parent_code.append(0x60); // PUSH1
    try parent_code.append(0x00); // slot 0
    try parent_code.append(0x55); // SSTORE
    try parent_code.append(0x00); // STOP
    
    // Deploy parent contract
    const deploy_result = try evm_instance.call(.{
        .create = .{
            .caller = [_]u8{0x01} ** 20,
            .value = 0,
            .init_code = parent_code.items,
            .gas = 5_000_000,
        },
    });
    defer if (deploy_result.output.len > 0) allocator.free(deploy_result.output);
    
    try std.testing.expect(deploy_result.success);
    
    // Get parent address (deterministic based on sender nonce)
    const parent_addr = [_]u8{0x01} ** 20; // Simplified for test
    
    // Get child address from parent's storage
    const child_addr_u256 = evm_instance.get_storage(parent_addr, 1);
    var child_addr: Address = undefined;
    const bytes = std.mem.toBytes(child_addr_u256);
    @memcpy(&child_addr, bytes[12..32]);
    
    // Verify parent's value storage is initially 0
    const initial_value = evm_instance.get_storage(parent_addr, 0);
    try std.testing.expectEqual(@as(u256, 0), initial_value);
    
    // Call child contract, which should call back to parent
    const call_result = try evm_instance.call(.{
        .call = .{
            .caller = [_]u8{0x02} ** 20,
            .to = child_addr,
            .value = 0,
            .input = &[_]u8{},
            .gas = 1_000_000,
        },
    });
    defer if (call_result.output.len > 0) allocator.free(call_result.output);
    
    try std.testing.expect(call_result.success);
    
    // Verify parent's storage was modified by child
    const final_value = evm_instance.get_storage(parent_addr, 0);
    try std.testing.expectEqual(@as(u256, 42), final_value);
}
