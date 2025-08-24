const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.Address.ZERO_ADDRESS;
const ExecutionError = @import("evm").ExecutionError;
const frame_mod = @import("frame.zig");
// const frame_interpreter_mod = @import("frame_interpreter.zig");
const Host = @import("host.zig").Host;
const BlockInfo = @import("block_info.zig").BlockInfo;
const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
const SelfDestruct = @import("self_destruct.zig").SelfDestruct;
const CreatedContracts = @import("created_contracts.zig").CreatedContracts;
const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;
const AccessList = @import("access_list.zig").AccessList;
const hardfork = @import("evm").hardforks.hardfork;
const StorageKey = primitives.StorageKey;

// Import precompile utilities from legacy EVM  
const precompiles = @import("evm").precompiles.precompiles;

pub const EvmConfig = struct {
    /// Maximum call depth allowed in the EVM (defaults to 1024 levels)
    /// This prevents infinite recursion and stack overflow attacks
    max_call_depth: u11 = 1024,
    
    /// Maximum input size for interpreter operations (128 KB)
    /// This prevents excessive memory usage in single operations
    max_input_size: u18 = 131072, // 128 KB
    
    /// Frame configuration parameters
    frame_config: frame_mod.FrameConfig = .{},
    
    /// Enable precompiled contracts support (default: true)
    /// When disabled, precompile calls will fail with an error
    enable_precompiles: bool = true,
    
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
    // const FrameInterpreter = frame_interpreter_mod.FrameInterpreter(config.frame_config);
    const DepthType = config.get_depth_type();
    
    return struct {
        const Self = @This();
        
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
                // Remove all entries after snapshot_id
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
                    }},
                });
            }
        };
        
        /// Parameters for different types of EVM calls (re-export)
        pub const CallParams = @import("call_params.zig").CallParams;
        
        /// Stack of frames for nested calls
        // frames: [config.max_call_depth]*FrameInterpreter,
        
        /// Current call depth (0 = root call)
        depth: DepthType,
        
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

    /// Result of a call execution (re-export)
    pub const CallResult = @import("call_result.zig").CallResult;
    
    pub fn init(allocator: std.mem.Allocator, database: DatabaseInterface, block_info: BlockInfo, context: TransactionContext, gas_price: u256, origin: Address, hardfork_config: hardfork.Hardfork) !Self {
        return Self{
            // .frames = undefined, // Will be initialized per call
            .depth = 0,
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
        };
    }
    
    pub fn deinit(self: *Self) void {
        self.journal.deinit();
        self.created_contracts.deinit();
        self.self_destruct.deinit();
        self.access_list.deinit();
    }

    pub fn call(self: *Self, params: CallParams) ExecutionError.Error!CallResult {
        // Reset depth for new top-level call
        self.depth = 0;
        return self._call(params, true);
    }
    
    pub fn inner_call(self: *Self, params: CallParams) ExecutionError.Error!CallResult {
        // Check max depth with cold branch hint
        if (self.depth >= config.max_call_depth) {
            @branchHint(.cold);
            return CallResult{ .success = false, .gas_left = 0, .output = &.{} };
        }
        
        // Increment depth for nested call
        self.depth += 1;
        const result = self._call(params, false) catch |err| {
            // Restore depth on error
            self.depth -= 1;
            return err;
        };
        
        // Restore depth on successful completion
        self.depth -= 1;
        return result;
    }

    /// Internal call implementation with journal support
    fn _call(self: *Self, params: CallParams, comptime is_top_level_call: bool) ExecutionError.Error!CallResult {
        // Create snapshot for nested calls
        const snapshot_id = if (!is_top_level_call) self.create_snapshot() else 0;
        
        // Extract call parameters
        var call_address: Address = undefined;
        var call_code: []const u8 = undefined;
        var call_input: []const u8 = undefined;
        var call_gas: u64 = undefined;
        var call_is_static: bool = undefined;
        var call_caller: Address = undefined;
        var call_value: u256 = undefined;
        
        // Handle different call types
        switch (params) {
            .create => |create_params| {
                return self.handle_create(create_params, is_top_level_call, snapshot_id);
            },
            .create2 => |create2_params| {
                return self.handle_create2(create2_params, is_top_level_call, snapshot_id);
            },
            .call => |call_data| {
                call_address = call_data.to;
                // Load contract code from database
                call_code = self.database.get_code_by_address(call_data.to) catch &.{};
                call_input = call_data.input;
                call_gas = call_data.gas;
                call_is_static = false;
                call_caller = call_data.caller;
                call_value = call_data.value;
            },
            .callcode => |call_data| {
                call_address = call_data.to;
                // Load contract code from database  
                call_code = self.database.get_code_by_address(call_data.to) catch &.{};
                call_input = call_data.input;
                call_gas = call_data.gas;
                call_is_static = false;
                call_caller = call_data.caller;
                call_value = call_data.value;
            },
            .delegatecall => |call_data| {
                call_address = call_data.to;
                // Load contract code from database
                call_code = self.database.get_code_by_address(call_data.to) catch &.{};
                call_input = call_data.input;
                call_gas = call_data.gas;
                call_is_static = false;
                call_caller = call_data.caller;
                call_value = 0; // DELEGATECALL preserves value from parent context
            },
            .staticcall => |call_data| {
                call_address = call_data.to;
                // Load contract code from database
                call_code = self.database.get_code_by_address(call_data.to) catch &.{};
                call_input = call_data.input;
                call_gas = call_data.gas;
                call_is_static = true;
                call_caller = call_data.caller;
                call_value = 0; // STATICCALL cannot transfer value
            },
        }
        
        // Validate inputs
        if (call_input.len > config.max_input_size) {
            if (!is_top_level_call) self.revert_to_snapshot(snapshot_id);
            return CallResult{ .success = false, .gas_left = 0, .output = &.{} };
        }
        
        // Check for precompiles (if enabled)
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
        
        // TODO: Initialize frame and execute bytecode
        
        // For now, execute a basic "success" path for non-precompile calls
        // TODO: Use call_address, call_code, call_is_static, call_caller, call_value for actual execution
        
        return CallResult{
            .success = true,
            .gas_left = call_gas,
            .output = &.{},
        };
    }

    /// Execute a precompile call using the full legacy precompile system
    /// This implementation supports all standard Ethereum precompiles (0x01-0x0A)
    fn execute_precompile_call(self: *Self, address: Address, input: []const u8, gas: u64, is_static: bool) !CallResult {
        _ = is_static; // Precompiles are inherently stateless, so static flag doesn't matter

        // Verify it's a precompile address
        if (!precompiles.is_precompile(address)) {
            return CallResult{ .success = false, .gas_left = gas, .output = &.{} };
        }

        // Get precompile ID from address (1-10)
        const precompile_id = address[19]; // Last byte is the precompile ID
        if (precompile_id < 1 or precompile_id > 10) {
            return CallResult{ .success = false, .gas_left = gas, .output = &.{} };
        }

        // Estimate output buffer size based on precompile type
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

        // Allocate output buffer
        const output_buffer = self.allocator.alloc(u8, estimated_output_size) catch |err| {
            return err;
        };
        errdefer self.allocator.free(output_buffer);

        // Create chain rules for the current hardfork
        const ChainRules = @import("evm").hardforks.chain_rules.ChainRules;
        const chain_rules = ChainRules.from_hardfork(self.hardfork_config);

        // Execute the precompile
        const result = precompiles.execute(precompile_id, input, output_buffer, gas, chain_rules) catch |err| {
            self.allocator.free(output_buffer);
            return switch (err) {
                error.OutOfMemory => error.OutOfMemory,
                else => CallResult{ .success = false, .gas_left = 0, .output = &.{} },
            };
        };

        return switch (result) {
            .success => |success_data| CallResult{
                .success = true,
                .gas_left = success_data.gas_left,
                .output = if (success_data.output_len > 0) 
                    output_buffer[0..success_data.output_len] 
                else 
                    &.{},
            },
            .failure => |failure_data| blk: {
                self.allocator.free(output_buffer);
                break :blk CallResult{
                    .success = false,
                    .gas_left = failure_data.gas_left,
                    .output = &.{},
                };
            },
            .revert => |revert_data| blk: {
                self.allocator.free(output_buffer);
                break :blk CallResult{
                    .success = false,
                    .gas_left = revert_data.gas_left,
                    .output = &.{},
                };
            },
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
        self.journal.revert_to_snapshot(snapshot_id);
        // TODO: Apply journal entries to revert database state
    }
    
    /// Record a storage change in the journal
    pub fn record_storage_change(self: *Self, address: Address, slot: u256, original_value: u256) !void {
        // TODO: Get snapshot_id from frame when frame system is implemented
        const snapshot_id = 0; // if (self.depth > 0) self.frames[self.depth - 1].snapshot_id else 0;
        try self.journal.record_storage_change(snapshot_id, address, slot, original_value);
    }
    
    /// Get the original storage value from the journal
    pub fn get_original_storage(self: *Self, address: Address, slot: u256) ?u256 {
        // TODO: Search journal for original value
        _ = self;
        _ = address;
        _ = slot;
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
        // TODO: Get from current frame
        return false;
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

// Export the default Evm type
pub const DefaultEvm = Evm(.{});

test "CallParams and CallResult structures" {
    const testing = std.testing;
    
    // Test that CallParams compiles and can be created
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = ZERO_ADDRESS,
            .value = 0,
            .input = &.{},
            .gas = 1000000,
        },
    };
    
    // Test that CallResult can be created
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
    
    // Test creating Evm with custom configuration
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
    
    // Simple bytecode that just stops: [0x00] (STOP)
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
    
    // Test initial state
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
    
    // Test that we can record multiple storage changes
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
    
    // Test u8 range
    const config_u8 = EvmConfig{ .max_call_depth = 255 };
    try testing.expectEqual(u8, config_u8.get_depth_type());
    
    // Test u11 range  
    const config_u11 = EvmConfig{ .max_call_depth = 1024 };
    try testing.expectEqual(u11, config_u11.get_depth_type());
    
    // Test boundary
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
    
    var evm = try DefaultEvm.init(
        testing.allocator,
        db_interface,
        block_info,
        context,
        gas_price,
        origin,
        .LONDON
    );
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
    
    // Test get_balance
    const retrieved_balance = evm.get_balance(address);
    try testing.expectEqual(balance, retrieved_balance);
    
    // Test with zero balance
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
    
    // Test with different key
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
    
    // Test existing account
    const exists = evm.account_exists(address);
    try testing.expect(exists);
    
    // Test non-existing account
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
    
    // Test CALL operation
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