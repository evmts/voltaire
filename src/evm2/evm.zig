const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.Address.ZERO_ADDRESS;
const ExecutionError = @import("evm").ExecutionError;
const frame_mod = @import("frame.zig");
const frame_interpreter_mod = @import("frame_interpreter.zig");
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
    const FrameInterpreter = frame_interpreter_mod.createFrameInterpreter(config.frame_config);
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
        frames: [config.max_call_depth]*FrameInterpreter,
        
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
            .frames = undefined, // Will be initialized per call
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
        
        // TODO: Initialize journal for state tracking
        // TODO: Charge base fee for the transaction
        // TODO: Initialize access list
        // TODO: Initialize trace if needed
        
        // Allocate and initialize the root frame
        const gas = switch (params) {
            inline else => |p| p.gas,
        };
        
        const bytecode = switch (params) {
            .call, .callcode, .delegatecall, .staticcall => blk: {
                // TODO: Load contract code from state for address to
                break :blk &[_]u8{}; // Placeholder
            },
            .create, .create2 => |p| p.init_code,
        };
        
        // Allocate root frame
        var frame = try FrameInterpreter.init(self.allocator, bytecode, @intCast(gas), {});
        self.frames[0] = &frame;
        defer {
            frame.deinit(self.allocator);
            // TODO: Clean up any allocated memory
        }
        
        // Call inner_call_impl with initialized frame
        return self.inner_call_impl(params);
    }

    pub fn inner_call_impl(self: *Self, params: CallParams) ExecutionError.Error!CallResult {
        // Check depth limit first (branch hint: cold - this rarely fails)
        if (self.depth >= config.max_call_depth) {
            @branchHint(.cold);
            return CallResult{
                .success = false,
                .gas_left = 0,
                .output = null,
            };
        }
        
        // TODO: Take journal snapshot for potential revert
        // TODO: Validate inputs (gas limits, value transfers, etc.)
        // TODO: Handle precompiled contracts
        // TODO: Handle is_berlin pre-warm address
        // TODO: Initialize correct frame type based on call type
        // TODO: Pass static opcode handlers for STATICCALL
        
        // Get current frame
        const frame = self.frames[self.depth];
        
        // Handle different call types
        switch (params) {
            .call => |p| {
                // TODO: Set up CALL context
                _ = p;
            },
            .callcode => |p| {
                // TODO: Set up CALLCODE context (execute at target but keep storage)
                _ = p;
            },
            .delegatecall => |p| {
                // TODO: Set up DELEGATECALL context (preserve original caller/value)
                _ = p;
            },
            .staticcall => |p| {
                // TODO: Set up STATICCALL context (read-only execution)
                // TODO: Use static opcode handlers that prevent state changes
                _ = p;
            },
            .create => |p| {
                // TODO: Handle CREATE operation
                // TODO: Generate new contract address
                // TODO: Initialize contract
                _ = p;
            },
            .create2 => |p| {
                // TODO: Handle CREATE2 operation  
                // TODO: Generate deterministic contract address using salt
                // TODO: Initialize contract
                _ = p;
            },
        }
        
        // Execute the frame
        frame.interpret() catch |err| {
            // TODO: Handle errors appropriately
            // TODO: Revert journal on failure
            // TODO: Return appropriate gas_left based on error type
            switch (err) {
                else => {
                    return CallResult{
                        .success = false,
                        .gas_left = 0,
                        .output = null,
                    };
                }
            }
        };
        
        // TODO: Handle success case
        // TODO: Commit journal changes
        // TODO: Process return data
        // TODO: Handle nested calls from CALL/CREATE opcodes
        
        return CallResult{
            .success = true,
            .gas_left = @intCast(frame.frame.gas_remaining),
            .output = null, // TODO: Get from frame output
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
    pub fn inner_call(self: *Self, params: CallParams) !CallResult {
        return self.inner_call_impl(params);
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
        const snapshot_id = if (self.depth > 0) self.frames[self.depth - 1].snapshot_id else 0;
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