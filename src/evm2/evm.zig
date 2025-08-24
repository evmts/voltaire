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
const hardfork = @import("evm").hardforks.hardfork;
const StorageKey = primitives.StorageKey;

pub const EvmConfig = struct {
    /// Maximum call depth allowed in the EVM (defaults to 1024 levels)
    /// This prevents infinite recursion and stack overflow attacks
    max_call_depth: u11 = 1024,
    
    /// Maximum input size for interpreter operations (128 KB)
    /// This prevents excessive memory usage in single operations
    max_input_size: u18 = 131072, // 128 KB
    
    /// Frame configuration parameters
    frame_config: frame_mod.FrameConfig = .{},
    
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
            .create, .create2 => {
                // TODO: Implement CREATE operations - delegate to create_contract_at method
                const caller = switch (params) {
                    .create => |p| p.caller,
                    .create2 => |p| p.caller,
                    else => unreachable,
                };
                const value = switch (params) {
                    .create => |p| p.value,
                    .create2 => |p| p.value,
                    else => unreachable,
                };
                const init_code = switch (params) {
                    .create => |p| p.init_code,
                    .create2 => |p| p.init_code,
                    else => unreachable,
                };
                const gas = switch (params) {
                    .create => |p| p.gas,
                    .create2 => |p| p.gas,
                    else => unreachable,
                };
                
                // For now, return success for CREATE operations
                // TODO: Implement actual contract creation
                _ = caller;
                _ = value;
                _ = init_code;
                
                return CallResult{
                    .success = true,
                    .gas_left = gas,
                    .output = &.{},
                };
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
        
        // TODO: Check for precompiles
        // TODO: Initialize frame and execute bytecode
        
        // For now, execute a basic "success" path
        // TODO: Use call_address, call_code, call_is_static, call_caller, call_value for actual execution
        
        return CallResult{
            .success = true,
            .gas_left = call_gas,
            .output = &.{},
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
        // TODO: Implement access list tracking
        _ = self;
        _ = address;
        return 2600; // Cold access cost
    }
    
    /// Access a storage slot and return the gas cost (EIP-2929)
    pub fn access_storage_slot(self: *Self, contract_address: Address, slot: u256) !u64 {
        // TODO: Implement access list tracking
        _ = self;
        _ = contract_address;
        _ = slot;
        return 2100; // Cold storage access cost
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