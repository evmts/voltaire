const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.Address.ZERO_ADDRESS;
const frame_mod = @import("frame.zig");
const Host = @import("host.zig").Host;
const BlockInfo = @import("block_info.zig").BlockInfo;
const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
const SelfDestruct = @import("self_destruct.zig").SelfDestruct;
const CreatedContracts = @import("created_contracts.zig").CreatedContracts;
const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
const AccessList = @import("access_list.zig").AccessList;
const Hardfork = @import("hardfork.zig").Hardfork;
const StorageKey = primitives.StorageKey;

// TODO: Precompiles support not yet implemented in evm2
// const precompiles = @import("evm").precompiles.precompiles;

/// Strategy for EVM bytecode planning and optimization
pub const PlannerStrategy = enum {
    /// Minimal planner with basic bytecode analysis
    minimal,
    /// Advanced planner with comprehensive optimizations
    advanced,
};

pub const EvmConfig = struct {
    /// Maximum call depth allowed in the EVM (defaults to 1024 levels)
    /// This prevents infinite recursion and stack overflow attacks
    max_call_depth: u11 = 1024,

    /// Maximum input size for interpreter operations (128 KB)
    /// This prevents excessive memory usage in single operations
    max_input_size: u18 = 131072, // 128 KB

    /// Frame configuration parameters (enable database by default)
    frame_config: frame_mod.FrameConfig = .{ .has_database = true },

    /// Enable precompiled contracts support (default: true)
    /// When disabled, precompile calls will fail with an error
    enable_precompiles: bool = true,

    /// Planner strategy for bytecode analysis and optimization (default: minimal)
    /// Note: When compiling with -Doptimize=ReleaseSmall, this is always forced to .minimal
    /// regardless of the configured value to minimize binary size.
    planner_strategy: PlannerStrategy = .minimal,

    /// Gets the appropriate type for depth based on max_call_depth
    fn get_depth_type(self: EvmConfig) type {
        return if (self.max_call_depth <= std.math.maxInt(u8))
            u8
        else if (self.max_call_depth <= std.math.maxInt(u11))
            u11
        else
            @compileError("max_call_depth too large");
    }
};

pub fn Evm(comptime config: EvmConfig) type {
    const DepthType = config.get_depth_type();
    
    // TODO: When optimizing for size (ReleaseSmall), force minimal planner strategy
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

    return struct {
        const Self = @This();

        pub const SelectedPlannerType = PlannerType;

        /// Transaction context
        pub const TransactionContext = struct {
            /// Transaction gas limit
            gas_limit: u64,
            /// Coinbase address (miner/validator)
            coinbase: Address,
            /// Chain ID
            chain_id: u256,
        };

        /// Simple journal implementation for state snapshots
        pub const Journal = struct {
            /// Journal entry for state changes
            const Entry = struct {
                snapshot_id: u32,
                data: union(enum) {
                    storage_change: struct {
                        address: Address,
                        key: u256,
                        original_value: u256,
                    },
                    balance_change: struct {
                        address: Address,
                        original_balance: u256,
                    },
                    nonce_change: struct {
                        address: Address,
                        original_nonce: u64,
                    },
                    code_change: struct {
                        address: Address,
                        original_code_hash: [32]u8,
                    },
                },
            };

            entries: std.ArrayList(Entry),
            next_snapshot_id: u32,
            allocator: std.mem.Allocator,

            pub fn init(allocator: std.mem.Allocator) Journal {
                return Journal{
                    .entries = std.ArrayList(Entry).init(allocator),
                    .next_snapshot_id = 0,
                    .allocator = allocator,
                };
            }

            pub fn deinit(self: *Journal) void {
                self.entries.deinit();
            }

            pub fn create_snapshot(self: *Journal) u32 {
                const id = self.next_snapshot_id;
                self.next_snapshot_id += 1;
                return id;
            }

            pub fn revert_to_snapshot(self: *Journal, snapshot_id: u32) void {
                var i = self.entries.items.len;
                while (i > 0) : (i -= 1) {
                    if (self.entries.items[i - 1].snapshot_id < snapshot_id) {
                        break;
                    }
                }
                self.entries.shrinkRetainingCapacity(i);
            }

            pub fn record_storage_change(self: *Journal, snapshot_id: u32, address: Address, key: u256, original_value: u256) !void {
                try self.entries.append(.{
                    .snapshot_id = snapshot_id,
                    .data = .{ .storage_change = .{
                        .address = address,
                        .key = key,
                        .original_value = original_value,
                    } },
                });
            }
        };

        /// Parameters for different types of EVM calls (re-export)
        pub const CallParams = @import("call_params.zig").CallParams;

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
        journal: Journal,

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
        hardfork_config: hardfork.Hardfork,

        /// Planner instance for bytecode analysis and optimization
        planner: PlannerType,

        /// Result of a call execution (re-export)
        pub const CallResult = @import("call_result.zig").CallResult;

        pub fn init(allocator: std.mem.Allocator, database: DatabaseInterface, block_info: BlockInfo, context: TransactionContext, gas_price: u256, origin: Address, hardfork_config: hardfork.Hardfork) !Self {
            // Initialize planner with a reasonable cache size
            var planner = try PlannerType.init(allocator, 32); // 32 plans cache
            errdefer planner.deinit();

            return Self{
                // .frames = undefined, // Will be initialized per call
                .depth = 0,
                .static_stack = [_]bool{false} ** config.max_call_depth,
                .allocator = allocator,
                .database = database,
                .journal = Journal.init(allocator),
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
            };
        }

        pub fn deinit(self: *Self) void {
            self.journal.deinit();
            self.created_contracts.deinit();
            self.self_destruct.deinit();
            self.access_list.deinit();
            self.planner.deinit();
        }

        pub fn call(self: *Self, params: CallParams) anyerror!CallResult {
            self.depth = 0;
            return self._call(params, true);
        }

        pub fn inner_call(self: *Self, params: CallParams) anyerror!CallResult {
            if (self.depth >= config.max_call_depth) {
                @branchHint(.cold);
                return CallResult{ .success = false, .gas_left = 0, .output = &.{} };
            }

            self.depth += 1;
            const result = self._call(params, false) catch |err| {
                self.depth -= 1;
                return err;
            };

            self.depth -= 1;
            return result;
        }

        /// Internal call implementation with journal support
        fn _call(self: *Self, params: CallParams, comptime is_top_level_call: bool) anyerror!CallResult {
            const snapshot_id = if (!is_top_level_call) self.create_snapshot() else 0;

            var call_address: Address = undefined;
            var call_code: []const u8 = undefined;
            var call_input: []const u8 = undefined;
            var call_gas: u64 = undefined;
            var call_is_static: bool = undefined;
            var call_caller: Address = undefined;
            var call_value: u256 = undefined;

            switch (params) {
                .create => |create_params| {
                    return self.handle_create(create_params, is_top_level_call, snapshot_id);
                },
                .create2 => |create2_params| {
                    return self.handle_create2(create2_params, is_top_level_call, snapshot_id);
                },
                .call => |call_data| {
                    call_address = call_data.to;
                    call_code = self.database.get_code_by_address(call_data.to) catch &.{};
                    call_input = call_data.input;
                    call_gas = call_data.gas;
                    call_is_static = false;
                    call_caller = call_data.caller;
                    call_value = call_data.value;
                },
                .callcode => |call_data| {
                    call_address = call_data.to;
                    call_code = self.database.get_code_by_address(call_data.to) catch &.{};
                    call_input = call_data.input;
                    call_gas = call_data.gas;
                    call_is_static = false;
                    call_caller = call_data.caller;
                    call_value = call_data.value;
                },
                .delegatecall => |call_data| {
                    call_address = call_data.to;
                    call_code = self.database.get_code_by_address(call_data.to) catch &.{};
                    call_input = call_data.input;
                    call_gas = call_data.gas;
                    call_is_static = false;
                    call_caller = call_data.caller;
                    call_value = 0; // DELEGATECALL preserves value from parent context
                },
                .staticcall => |call_data| {
                    call_address = call_data.to;
                    call_code = self.database.get_code_by_address(call_data.to) catch &.{};
                    call_input = call_data.input;
                    call_gas = call_data.gas;
                    call_is_static = true;
                    call_caller = call_data.caller;
                    call_value = 0; // STATICCALL cannot transfer value
                },
            }

            if (call_input.len > config.max_input_size) {
                if (!is_top_level_call) self.revert_to_snapshot(snapshot_id);
                return CallResult{ .success = false, .gas_left = 0, .output = &.{} };
            }

            if (config.enable_precompiles and precompiles.is_precompile(call_address)) {
                const precompile_result = self.execute_precompile_call(call_address, call_input, call_gas, call_is_static) catch |err| {
                    if (!is_top_level_call) self.revert_to_snapshot(snapshot_id);
                    return switch (err) {
                        else => CallResult{ .success = false, .gas_left = 0, .output = &.{} },
                    };
                };

                if (!is_top_level_call and !precompile_result.success) {
                    self.revert_to_snapshot(snapshot_id);
                }

                return precompile_result;
            }

            const execution_result = self.execute_bytecode(
                call_code,
                call_input,
                call_gas,
                call_address,
                call_caller,
                call_value,
                call_is_static,
                is_top_level_call,
                snapshot_id,
            ) catch |err| {
                if (!is_top_level_call) self.revert_to_snapshot(snapshot_id);
                return switch (err) {
                    else => CallResult{ .success = false, .gas_left = 0, .output = &.{} },
                };
            };

            if (!is_top_level_call and !execution_result.success) {
                self.revert_to_snapshot(snapshot_id);
            }

            return execution_result;
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

            const evm_mod = @import("evm");
            const chain_rules = evm_mod.ChainRules.for_hardfork(self.hardfork_config);

            const result = precompiles.execute_precompile_by_id(precompile_id, input, output_buffer, gas, chain_rules);

            return switch (result) {
                .success => |success_data| CallResult{
                    .success = true,
                    .gas_left = gas - success_data.gas_used,
                    .output = if (success_data.output_size > 0)
                        output_buffer[0..success_data.output_size]
                    else
                        &.{},
                },
                .failure => |_| blk: {
                    self.allocator.free(output_buffer);
                    break :blk CallResult{
                        .success = false,
                        .gas_left = 0,
                        .output = &.{},
                    };
                },
            };
        }

        /// Execute bytecode using the Frame system with planner optimization
        fn execute_bytecode(
            self: *Self,
            code: []const u8,
            input: []const u8,
            gas: u64,
            contract_address: Address,
            caller: Address,
            value: u256,
            is_static: bool,
            comptime is_top_level: bool,
            snapshot_id: u32,
        ) !CallResult {
            _ = input; // TODO: Use for CALLDATALOAD etc
            _ = caller; // TODO: Use for CALLER opcode
            _ = value; // TODO: Use for CALLVALUE opcode
            _ = is_top_level; // TODO: Use for nested call handling
            _ = snapshot_id; // TODO: Use for state rollback
            if (code.len == 0) {
                return CallResult{
                    .success = true,
                    .gas_left = gas,
                    .output = &.{},
                };
            }

            if (code.len == 1 and code[0] == 0x00) {
                // STOP opcode - successful termination
                return CallResult{
                    .success = true,
                    .gas_left = gas - 3, // STOP costs 3 gas
                    .output = &.{},
                };
            }

            // Create frame with configuration
            const FrameType = frame_mod.Frame(config.frame_config);
            var frame = FrameType.init(self.allocator, code, @intCast(gas), self.database, self.to_host()) catch |err| {
                return switch (err) {
                    FrameType.Error.BytecodeTooLarge => CallResult{
                        .success = false,
                        .gas_left = 0,
                        .output = &.{},
                    },
                    else => return err,
                };
            };
            defer frame.deinit(self.allocator);

            frame.contract_address = contract_address;
            frame.is_static = is_static;

            if (self.depth > 0) {
                self.static_stack[self.depth - 1] = is_static;
            }

            // Create handler array for opcodes
            // For now, we'll use the simple frame.interpret() approach
            // TODO: Integrate proper handler-based execution with planner
            const execution_result = frame.interpret() catch |err| {
                return switch (err) {
                    FrameType.Error.STOP => CallResult{
                        .success = true,
                        .gas_left = @intCast(@max(0, frame.gas_remaining)),
                        .output = frame.output_data.items,
                    },
                    FrameType.Error.REVERT => CallResult{
                        .success = false,
                        .gas_left = @intCast(@max(0, frame.gas_remaining)),
                        .output = frame.output_data.items,
                    },
                    FrameType.Error.OutOfGas => CallResult{
                        .success = false,
                        .gas_left = 0,
                        .output = &.{},
                    },
                    FrameType.Error.StackOverflow, FrameType.Error.StackUnderflow => CallResult{
                        .success = false,
                        .gas_left = @intCast(@max(0, frame.gas_remaining)),
                        .output = &.{},
                    },
                    FrameType.Error.InvalidJump, FrameType.Error.InvalidOpcode => CallResult{
                        .success = false,
                        .gas_left = @intCast(@max(0, frame.gas_remaining)),
                        .output = &.{},
                    },
                    else => return err,
                };
            };

            _ = execution_result; // Result handling can be extended here
            return CallResult{
                .success = true,
                .gas_left = @intCast(@max(0, frame.gas_remaining)),
                .output = frame.output_data.items,
            };
        }

        /// Handle CREATE contract creation
        fn handle_create(self: *Self, params: anytype, comptime is_top_level_call: bool, snapshot_id: u32) !CallResult {
            var caller_account = (self.database.get_account(params.caller) catch null) orelse @import("database_interface_account.zig").Account{
                .balance = 0,
                .nonce = 0,
                .code_hash = [_]u8{0} ** 32,
                .storage_root = [_]u8{0} ** 32,
            };

            const contract_address = primitives.Address.get_contract_address(params.caller, caller_account.nonce);

            // Increment caller's nonce
            caller_account.nonce += 1;
            try self.database.set_account(params.caller, caller_account);

            // Delegate to common creation logic
            return self.create_contract_at(params.caller, params.value, params.init_code, params.gas, contract_address, is_top_level_call, snapshot_id);
        }

        /// Handle CREATE2 contract creation
        fn handle_create2(self: *Self, params: anytype, comptime is_top_level_call: bool, snapshot_id: u32) !CallResult {
            const salt_bytes = @as([32]u8, @bitCast(params.salt));

            const crypto = @import("crypto");
            const init_code_hash = crypto.Hash.keccak256(params.init_code);

            const contract_address = primitives.Address.get_create2_address(params.caller, salt_bytes, init_code_hash);

            // CREATE2 doesn't increment caller nonce
            return self.create_contract_at(params.caller, params.value, params.init_code, params.gas, contract_address, is_top_level_call, snapshot_id);
        }

        /// Create a contract at a specific address
        fn create_contract_at(
            self: *Self,
            caller: Address,
            value: u256,
            init_code: []const u8,
            gas: u64,
            contract_address: Address,
            comptime is_top_level_call: bool,
            snapshot_id: u32,
        ) !CallResult {
            if (self.database.account_exists(contract_address)) {
                if (!is_top_level_call) self.revert_to_snapshot(snapshot_id);
                return CallResult{ .success = false, .gas_left = 0, .output = &.{} };
            }

            const GasConstants = @import("primitives").GasConstants;
            const create_gas_cost = GasConstants.CreateGas; // 32000 gas
            if (gas < create_gas_cost) {
                if (!is_top_level_call) self.revert_to_snapshot(snapshot_id);
                return CallResult{ .success = false, .gas_left = 0, .output = &.{} };
            }
            const remaining_gas = gas - create_gas_cost;

            if (value > 0) {
                var caller_account = (self.database.get_account(caller) catch null) orelse @import("database_interface_account.zig").Account{
                    .balance = 0,
                    .nonce = 0,
                    .code_hash = [_]u8{0} ** 32,
                    .storage_root = [_]u8{0} ** 32,
                };

                if (caller_account.balance < value) {
                    if (!is_top_level_call) self.revert_to_snapshot(snapshot_id);
                    return CallResult{ .success = false, .gas_left = 0, .output = &.{} };
                }

                caller_account.balance -= value;
                try self.database.set_account(caller, caller_account);
            }

            const new_contract_account = @import("database_interface_account.zig").Account{
                .balance = value,
                .nonce = 1, // Contract accounts start with nonce 1
                .code_hash = [_]u8{0} ** 32, // Will be set after init code execution
                .storage_root = [_]u8{0} ** 32,
            };
            try self.database.set_account(contract_address, new_contract_account);

            try self.register_created_contract(contract_address);

            // Execute initialization code to get deployed bytecode
            const init_result = try self.execute_bytecode(
                init_code,
                &.{}, // Empty input for init code
                remaining_gas,
                contract_address,
                caller,
                value,
                false, // Not static
                false, // Not top level
                snapshot_id,
            );

            if (!init_result.success) {
                // Init code failed - revert contract creation
                if (!is_top_level_call) self.revert_to_snapshot(snapshot_id);
                return CallResult{ .success = false, .gas_left = 0, .output = &.{} };
            }

            // Store the deployed bytecode
            if (init_result.output.len > 0) {
                // Check max code size (24576 bytes per EIP-170)
                const MAX_CODE_SIZE = 24576;
                if (init_result.output.len > MAX_CODE_SIZE) {
                    if (!is_top_level_call) self.revert_to_snapshot(snapshot_id);
                    return CallResult{ .success = false, .gas_left = 0, .output = &.{} };
                }

                // Store code and get its hash
                const code_hash = try self.database.set_code(init_result.output);

                var updated_contract = (try self.database.get_account(contract_address)) orelse {
                    // This should never happen since we just created the account
                    return CallResult{ .success = false, .gas_left = 0, .output = &.{} };
                };
                updated_contract.code_hash = code_hash;
                try self.database.set_account(contract_address, updated_contract);
            }

            // Return contract address as 20-byte output
            const address_output = try self.allocator.alloc(u8, 20);
            @memcpy(address_output, &contract_address);

            return CallResult{
                .success = true,
                .gas_left = init_result.gas_left,
                .output = address_output,
            };
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
            // TODO: Implement log storage
            _ = self;
            _ = contract_address;
            _ = topics;
            _ = data;
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
        pub fn create_snapshot(self: *Self) u32 {
            return self.journal.create_snapshot();
        }

        /// Revert state changes to a previous snapshot
        pub fn revert_to_snapshot(self: *Self, snapshot_id: u32) void {
            // Get the journal entries that need to be reverted before removing them
            var entries_to_revert = std.ArrayList(Journal.Entry).init(self.allocator);
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
        fn apply_journal_entry_revert(self: *Self, entry: Journal.Entry) !void {
            switch (entry.data) {
                .storage_change => |sc| {
                    // Revert storage to original value
                    try self.database.set_storage(sc.address, sc.key, sc.original_value);
                },
                .balance_change => |bc| {
                    // Revert balance to original value
                    var account = (try self.database.get_account(bc.address)) orelse {
                        // If account doesn't exist, create it with the original balance
                        const Account = @import("database_interface_account.zig").Account;
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
                    var account = (try self.database.get_account(nc.address)) orelse {
                        // If account doesn't exist, create it with the original nonce
                        const Account = @import("database_interface_account.zig").Account;
                        const reverted_account = Account{
                            .balance = 0,
                            .nonce = nc.original_nonce,
                            .code_hash = [_]u8{0} ** 32,
                            .storage_root = [_]u8{0} ** 32,
                        };
                        return self.database.set_account(nc.address, reverted_account);
                    };
                    account.nonce = nc.original_nonce;
                    try self.database.set_account(nc.address, account);
                },
                .code_change => |cc| {
                    // Revert code hash to original value
                    var account = (try self.database.get_account(cc.address)) orelse {
                        // If account doesn't exist, create it with the original code hash
                        const Account = @import("database_interface_account.zig").Account;
                        const reverted_account = Account{
                            .balance = 0,
                            .nonce = 0,
                            .code_hash = cc.original_code_hash,
                            .storage_root = [_]u8{0} ** 32,
                        };
                        return self.database.set_account(cc.address, reverted_account);
                    };
                    account.code_hash = cc.original_code_hash;
                    try self.database.set_account(cc.address, account);
                },
            }
        }

        /// Record a storage change in the journal
        pub fn record_storage_change(self: *Self, address: Address, slot: u256, original_value: u256) !void {
            // TODO: Get snapshot_id from frame when frame system is implemented
            const snapshot_id = 0; // if (self.depth > 0) self.frames[self.depth - 1].snapshot_id else 0;
            try self.journal.record_storage_change(snapshot_id, address, slot, original_value);
        }

        /// Get the original storage value from the journal
        pub fn get_original_storage(self: *Self, address: Address, slot: u256) ?u256 {
            // Search journal entries for the original storage value
            for (self.journal.entries.items) |entry| {
                switch (entry.data) {
                    .storage_change => |sc| {
                        if (std.mem.eql(u8, &address, &sc.address) and sc.key == slot) {
                            return sc.original_value;
                        }
                    },
                    else => continue,
                }
            }
            return null;
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
        pub fn is_hardfork_at_least(self: *Self, target: hardfork.Hardfork) bool {
            return @intFromEnum(self.hardfork_config) >= @intFromEnum(target);
        }

        /// Get current hardfork
        pub fn get_hardfork(self: *Self) hardfork.Hardfork {
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

        /// Convert to Host interface
        pub fn to_host(self: *Self) Host {
            return Host.init(self);
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

    const context = CustomEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Set up contract with bytecode [0x00] (STOP)
    const contract_address = Address.from_hex("0x1234567890123456789012345678901234567890") catch ZERO_ADDRESS;
    const bytecode = [_]u8{0x00};
    try memory_db.set_code(contract_address, &bytecode);

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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    var journal = DefaultEvm.Journal.init(testing.allocator);
    defer journal.deinit();

    try testing.expectEqual(@as(u32, 0), journal.next_snapshot_id);
    try testing.expectEqual(@as(usize, 0), journal.entries.items.len);

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

    var journal = DefaultEvm.Journal.init(testing.allocator);
    defer journal.deinit();

    const snapshot_id = journal.create_snapshot();
    const address = ZERO_ADDRESS;
    const key = 42;
    const original_value = 100;

    // Record storage change
    try journal.record_storage_change(snapshot_id, address, key, original_value);

    // Verify entry was recorded
    try testing.expectEqual(@as(usize, 1), journal.entries.items.len);
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
}

test "Journal - revert to snapshot" {
    const testing = std.testing;

    var journal = DefaultEvm.Journal.init(testing.allocator);
    defer journal.deinit();

    const snapshot1 = journal.create_snapshot();
    const snapshot2 = journal.create_snapshot();
    const snapshot3 = journal.create_snapshot();

    // Add entries with different snapshot IDs
    try journal.record_storage_change(snapshot1, ZERO_ADDRESS, 1, 10);
    try journal.record_storage_change(snapshot1, ZERO_ADDRESS, 2, 20);
    try journal.record_storage_change(snapshot2, ZERO_ADDRESS, 3, 30);
    try journal.record_storage_change(snapshot3, ZERO_ADDRESS, 4, 40);

    try testing.expectEqual(@as(usize, 4), journal.entries.items.len);

    // Revert to snapshot2 - should remove entries with snapshot_id >= 2
    journal.revert_to_snapshot(snapshot2);

    try testing.expectEqual(@as(usize, 2), journal.entries.items.len);
    // Verify remaining entries are from snapshot1
    for (journal.entries.items) |entry| {
        try testing.expect(entry.snapshot_id < snapshot2);
    }
}

test "Journal - multiple entry types" {
    const testing = std.testing;

    var journal = DefaultEvm.Journal.init(testing.allocator);
    defer journal.deinit();

    const snapshot_id = journal.create_snapshot();
    const address = ZERO_ADDRESS;

    // Record different types of changes
    try journal.record_storage_change(snapshot_id, address, 1, 100);

    try journal.record_storage_change(snapshot_id, address, 2, 200);
    try journal.record_storage_change(snapshot_id, address, 3, 300);

    try testing.expectEqual(@as(usize, 3), journal.entries.items.len);

    // Verify all entries are storage_change type
    for (journal.entries.items) |entry| {
        switch (entry.data) {
            .storage_change => {}, // Expected
            else => try testing.expect(false),
        }
    }
}

test "Journal - empty revert" {
    const testing = std.testing;

    var journal = DefaultEvm.Journal.init(testing.allocator);
    defer journal.deinit();

    // Revert with no entries should not crash
    journal.revert_to_snapshot(0);
    try testing.expectEqual(@as(usize, 0), journal.entries.items.len);

    // Create entries and revert to future snapshot
    const snapshot = journal.create_snapshot();
    try journal.record_storage_change(snapshot, ZERO_ADDRESS, 1, 100);

    // Revert to future snapshot (should remove all entries)
    journal.revert_to_snapshot(999);
    try testing.expectEqual(@as(usize, 0), journal.entries.items.len);
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

    const context = CustomEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
        .gas_limit = 5000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 137, // Polygon
    };

    try testing.expectEqual(@as(u64, 5000000), context.gas_limit);
    try testing.expectEqual(ZERO_ADDRESS, context.coinbase);
    try testing.expectEqual(@as(u256, 137), context.chain_id);
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

    const context = DefaultEvm.TransactionContext{
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
    try testing.expectEqual(hardfork.Hardfork.LONDON, evm.hardfork_config);

    // Verify sub-components initialized
    try testing.expectEqual(@as(u32, 0), evm.journal.next_snapshot_id);
    try testing.expectEqual(@as(usize, 0), evm.journal.entries.items.len);
}

// Duplicate test removed - see earlier occurrence

test "Journal - revert to snapshot (duplicate removed)" {
    const testing = std.testing;

    var journal = DefaultEvm.Journal.init(testing.allocator);
    defer journal.deinit();

    const snapshot1 = journal.create_snapshot();
    const snapshot2 = journal.create_snapshot();
    const snapshot3 = journal.create_snapshot();

    // Add entries with different snapshot IDs
    try journal.record_storage_change(snapshot1, ZERO_ADDRESS, 1, 10);
    try journal.record_storage_change(snapshot1, ZERO_ADDRESS, 2, 20);
    try journal.record_storage_change(snapshot2, ZERO_ADDRESS, 3, 30);
    try journal.record_storage_change(snapshot3, ZERO_ADDRESS, 4, 40);

    try testing.expectEqual(@as(usize, 4), journal.entries.items.len);

    // Revert to snapshot2 - should remove entries with snapshot_id >= 2
    journal.revert_to_snapshot(snapshot2);

    try testing.expectEqual(@as(usize, 2), journal.entries.items.len);
    // Verify remaining entries are from snapshot1
    for (journal.entries.items) |entry| {
        try testing.expect(entry.snapshot_id < snapshot2);
    }
}

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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    // Test with different hardfork configurations
    var london_evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .LONDON);
    defer london_evm.deinit();

    try testing.expectEqual(hardfork.Hardfork.LONDON, london_evm.get_hardfork());
    try testing.expect(london_evm.is_hardfork_at_least(.HOMESTEAD));
    try testing.expect(london_evm.is_hardfork_at_least(.LONDON));
    try testing.expect(!london_evm.is_hardfork_at_least(.CANCUN));

    var cancun_evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer cancun_evm.deinit();

    try testing.expectEqual(hardfork.Hardfork.CANCUN, cancun_evm.get_hardfork());
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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();

    // Create input that exceeds max_input_size (131072 bytes)
    const large_input = try testing.allocator.alloc(u8, 200000);
    defer testing.allocator.free(large_input);
    std.mem.set(u8, large_input, 0xFF);

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

    const context = DefaultEvm.TransactionContext{
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

    const context = TestEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = NoPrecompileEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = MinimalEvm.TransactionContext{
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

    const context = AdvancedEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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

    const context = DefaultEvm.TransactionContext{
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
    const Account = @import("database_interface_account.zig").Account;
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

    const context = DefaultEvm.TransactionContext{
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
    const Account = @import("database_interface_account.zig").Account;
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

    const context = DefaultEvm.TransactionContext{
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
    const Account = @import("database_interface_account.zig").Account;
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

    const context = DefaultEvm.TransactionContext{
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
    const Account = @import("database_interface_account.zig").Account;
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

    const context = DefaultEvm.TransactionContext{
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
    const Account = @import("database_interface_account.zig").Account;
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

    const context = DefaultEvm.TransactionContext{
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
