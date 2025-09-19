//! Rust-like API wrapper for the Guillotine EVM
//!
//! This module provides a Rust-inspired API that wraps the core EVM implementation.
//! It follows patterns from revm including:
//! - Builder pattern for configuration
//! - Trait-like interfaces via Zig's comptime
//! - Result types for error handling
//! - Inspector/tracer support

const std = @import("std");
const primitives = @import("primitives");
const Evm = @import("evm.zig").Evm;
const EvmConfig = @import("evm_config.zig").EvmConfig;
const Database = @import("storage/database.zig").Database;
const Hardfork = @import("eips_and_hardforks/eips.zig").Hardfork;
const BlockInfo = @import("block/block_info.zig").DefaultBlockInfo;
const TransactionContext = @import("block/transaction_context.zig").TransactionContext;
const CallParams = @import("frame/call_params.zig").CallParams;
const CallResult = @import("frame/call_result.zig").CallResult;
const GrowingArenaAllocator = @import("evm_arena_allocator.zig").GrowingArenaAllocator;
const Account = @import("storage/database_interface_account.zig").Account;

/// Result type similar to Rust's Result<T, E>
pub fn Result(comptime T: type, comptime E: type) type {
    return union(enum) {
        ok: T,
        err: E,

        pub fn is_ok(self: @This()) bool {
            return self == .ok;
        }

        pub fn is_err(self: @This()) bool {
            return self == .err;
        }

        pub fn unwrap(self: @This()) T {
            return switch (self) {
                .ok => |val| val,
                .err => @panic("called unwrap on an err value"),
            };
        }

        pub fn unwrap_err(self: @This()) E {
            return switch (self) {
                .err => |err| err,
                .ok => @panic("called unwrap_err on an ok value"),
            };
        }

        pub fn map(self: @This(), comptime U: type, f: fn (T) U) Result(U, E) {
            return switch (self) {
                .ok => |val| .{ .ok = f(val) },
                .err => |e| .{ .err = e },
            };
        }
    };
}

/// Transaction type for EVM execution
pub const Transaction = struct {
    /// Transaction type variants
    pub const TxType = enum {
        legacy,
        eip2930,
        eip1559,
        eip4844,
    };

    from: primitives.Address,
    to: ?primitives.Address, // null for contract creation
    value: u256,
    data: []const u8,
    gas_limit: u64,
    gas_price: u256,
    nonce: u64,
    tx_type: TxType = .legacy,
    
    // EIP-1559 fields
    max_fee_per_gas: ?u256 = null,
    max_priority_fee_per_gas: ?u256 = null,
    
    // EIP-2930 access list
    access_list: ?[]const AccessListItem = null,
    
    // EIP-4844 blob fields
    blob_versioned_hashes: ?[]const [32]u8 = null,
    max_fee_per_blob_gas: ?u256 = null,
};

/// Access list item for EIP-2930
pub const AccessListItem = struct {
    address: primitives.Address,
    storage_keys: []const u256,
};

/// Execution result type
pub const ExecutionResult = struct {
    /// Execution status
    pub const Status = enum {
        success,
        revert,
        halt,
    };

    status: Status,
    gas_used: u64,
    gas_refunded: u64,
    output: []const u8,
    logs: []const Log,
    created_address: ?primitives.Address = null,
    state_changes: ?StateChanges = null,
};

/// Log entry
pub const Log = struct {
    address: primitives.Address,
    topics: []const u256,
    data: []const u8,
};

/// State changes from execution
pub const StateChanges = struct {
    accounts: std.hash_map.HashMap(primitives.Address, AccountChange, primitives.Address.HashContext, 80),
    storage: std.hash_map.HashMap(StorageKey, u256, StorageKey.HashContext, 80),
    
    pub const StorageKey = struct {
        address: primitives.Address,
        slot: u256,
        
        pub const HashContext = struct {
            pub fn hash(_: @This(), key: StorageKey) u64 {
                return std.hash.Wyhash.hash(0, std.mem.asBytes(&key));
            }
            pub fn eql(_: @This(), a: StorageKey, b: StorageKey) bool {
                return a.address.eql(b.address) and a.slot == b.slot;
            }
        };
    };
    
    pub const AccountChange = struct {
        balance: ?u256 = null,
        nonce: ?u64 = null,
        code: ?[]const u8 = null,
        destroyed: bool = false,
    };
};

/// Inspector trait-like interface
pub const Inspector = struct {
    ptr: *anyopaque,
    vtable: *const VTable,
    
    pub const VTable = struct {
        step: *const fn (ptr: *anyopaque, pc: usize, opcode: u8, gas: u64, stack: []const u256) void,
        call: *const fn (ptr: *anyopaque, depth: usize, from: primitives.Address, to: primitives.Address, value: u256) void,
        return_fn: *const fn (ptr: *anyopaque, depth: usize, output: []const u8) void,
        log: *const fn (ptr: *anyopaque, address: primitives.Address, topics: []const u256, data: []const u8) void,
    };
    
    pub fn step(self: Inspector, pc: usize, opcode: u8, gas: u64, stack: []const u256) void {
        self.vtable.step(self.ptr, pc, opcode, gas, stack);
    }
    
    pub fn call(self: Inspector, depth: usize, from: primitives.Address, to: primitives.Address, value: u256) void {
        self.vtable.call(self.ptr, depth, from, to, value);
    }
    
    pub fn return_fn(self: Inspector, depth: usize, output: []const u8) void {
        self.vtable.return_fn(self.ptr, depth, output);
    }
    
    pub fn log(self: Inspector, address: primitives.Address, topics: []const u256, data: []const u8) void {
        self.vtable.log(self.ptr, address, topics, data);
    }
};

/// Builder for configuring EVM instances
pub fn EvmBuilder(comptime config: EvmConfig) type {
    return struct {
        const Self = @This();
        const EvmType = Evm(config);
        
        allocator: std.mem.Allocator,
        database: *Database,
        block_info: ?BlockInfo = null,
        tx_context: ?TransactionContext = null,
        hardfork: Hardfork = .CANCUN,
        gas_price: u256 = 0,
        origin: primitives.Address = primitives.ZERO_ADDRESS,
        inspector: ?Inspector = null,
        
        /// Create a new builder with required parameters
        pub fn new(allocator: std.mem.Allocator, database: *Database) Self {
            return Self{
                .allocator = allocator,
                .database = database,
            };
        }
        
        /// Set the hardfork
        pub fn with_hardfork(self: Self, hardfork: Hardfork) Self {
            var result = self;
            result.hardfork = hardfork;
            return result;
        }
        
        /// Set block information
        pub fn with_block(self: Self, block_info: BlockInfo) Self {
            var result = self;
            result.block_info = block_info;
            return result;
        }
        
        /// Set transaction context
        pub fn with_tx_context(self: Self, context: TransactionContext) Self {
            var result = self;
            result.tx_context = context;
            return result;
        }
        
        /// Set gas price
        pub fn with_gas_price(self: Self, price: u256) Self {
            var result = self;
            result.gas_price = price;
            return result;
        }
        
        /// Set transaction origin
        pub fn with_origin(self: Self, origin: primitives.Address) Self {
            var result = self;
            result.origin = origin;
            return result;
        }
        
        /// Set inspector for tracing
        pub fn with_inspector(self: Self, inspector: Inspector) Self {
            var result = self;
            result.inspector = inspector;
            return result;
        }
        
        /// Build the EVM instance
        pub fn build(self: Self) !*EvmWrapper(config) {
            const block = self.block_info orelse BlockInfo{
                .number = 1,
                .timestamp = 0,
                .difficulty = 0,
                .gas_limit = 30_000_000,
                .coinbase = primitives.ZERO_ADDRESS,
                .base_fee = 0,
                .prev_randao = [_]u8{0} ** 32,
            };
            
            const context = self.tx_context orelse TransactionContext{
                .gas_limit = 30_000_000,
                .coinbase = primitives.ZERO_ADDRESS,
                .chain_id = 1,
            };
            
            const wrapper = try self.allocator.create(EvmWrapper(config));
            errdefer self.allocator.destroy(wrapper);
            
            wrapper.* = EvmWrapper(config){
                .allocator = self.allocator,
                .evm = try EvmType.init(
                    self.allocator,
                    self.database,
                    block,
                    context,
                    self.gas_price,
                    self.origin,
                    self.hardfork,
                ),
                .inspector = self.inspector,
            };
            
            return wrapper;
        }
        
        /// Build with mainnet defaults
        pub fn build_mainnet(self: Self) !*EvmWrapper(config) {
            return self
                .with_hardfork(.CANCUN)
                .build();
        }
    };
}

/// Main EVM wrapper providing Rust-like API
pub fn EvmWrapper(comptime config: EvmConfig) type {
    return struct {
        const Self = @This();
        const EvmType = Evm(config);
        
        allocator: std.mem.Allocator,
        evm: EvmType,
        inspector: ?Inspector = null,
        commit_changes: bool = true,
        
        /// Deinitialize the EVM wrapper
        pub fn deinit(self: *Self) void {
            self.evm.deinit();
            self.allocator.destroy(self);
        }
        
        /// Execute a transaction
        pub fn transact(self: *Self, tx: Transaction) Result(ExecutionResult, EvmType.Error) {
            const params = self.txToCallParams(tx) catch |err| {
                return .{ .err = err };
            };
            
            const result = self.evm.call(params);
            
            if (!result.success) {
                return .{ .err = error.RevertExecution };
            }
            
            return .{ .ok = self.resultToExecution(result, tx) };
        }
        
        /// Execute and commit transaction
        pub fn transact_commit(self: *Self, tx: Transaction) Result(ExecutionResult, EvmType.Error) {
            const exec_result = self.transact(tx);
            
            if (exec_result.is_ok() and self.commit_changes) {
                // State changes are already committed in the underlying EVM
                // This is here for API compatibility
            }
            
            return exec_result;
        }
        
        /// Execute with inspection/tracing
        pub fn inspect(self: *Self, tx: Transaction) Result(ExecutionResult, EvmType.Error) {
            // If we have an inspector, the underlying EVM should use it
            // This requires TracerType to be set in config
            return self.transact(tx);
        }
        
        /// Simulate a transaction without committing
        pub fn simulate(self: *Self, tx: Transaction) Result(ExecutionResult, EvmType.Error) {
            const params = self.txToCallParams(tx) catch |err| {
                return .{ .err = err };
            };
            
            const result = self.evm.simulate(params);
            
            if (!result.success) {
                return .{ .err = error.RevertExecution };
            }
            
            return .{ .ok = self.resultToExecution(result, tx) };
        }
        
        /// Get account information
        pub fn get_account(self: *Self, address: primitives.Address) ?Account {
            return self.evm.database.get_account(address.bytes) catch null;
        }
        
        /// Get storage value
        pub fn get_storage(self: *Self, address: primitives.Address, slot: u256) u256 {
            return self.evm.get_storage(address, slot);
        }
        
        /// Get contract code
        pub fn get_code(self: *Self, address: primitives.Address) []const u8 {
            return self.evm.get_code(address);
        }
        
        /// Set block context
        pub fn set_block(self: *Self, block_info: BlockInfo) void {
            self.evm.block_info = block_info;
        }
        
        /// Set transaction context
        pub fn set_tx_context(self: *Self, context: TransactionContext) void {
            self.evm.context = context;
        }
        
        // Helper functions
        
        fn txToCallParams(self: *Self, tx: Transaction) !EvmType.CallParams {
            if (tx.to) |to| {
                return EvmType.CallParams{
                    .call = .{
                        .caller = tx.from,
                        .to = to,
                        .value = tx.value,
                        .input = tx.data,
                        .gas = tx.gas_limit,
                    },
                };
            } else {
                // Contract creation
                return EvmType.CallParams{
                    .create = .{
                        .caller = tx.from,
                        .value = tx.value,
                        .init_code = tx.data,
                        .gas = tx.gas_limit,
                    },
                };
            }
        }
        
        fn resultToExecution(self: *Self, result: EvmType.CallResult, tx: Transaction) ExecutionResult {
            const gas_used = tx.gas_limit - result.gas_left;
            
            const status: ExecutionResult.Status = if (result.success)
                .success
            else if (result.is_revert)
                .revert
            else
                .halt;
            
            // Convert logs format
            var logs = self.allocator.alloc(Log, result.logs.len) catch &.{};
            for (result.logs, 0..) |log, i| {
                logs[i] = Log{
                    .address = log.address,
                    .topics = log.topics,
                    .data = log.data,
                };
            }
            
            return ExecutionResult{
                .status = status,
                .gas_used = gas_used,
                .gas_refunded = 0, // TODO: get from EVM
                .output = result.output,
                .logs = logs,
                .created_address = result.created_address,
                .state_changes = null, // TODO: implement state change tracking
            };
        }
    };
}

/// Context builder for mainnet configuration
pub const Context = struct {
    /// Create a mainnet context
    pub fn mainnet() EvmBuilder(EvmConfig{}) {
        // This would be initialized with actual mainnet parameters
        return EvmBuilder(EvmConfig{}).new(
            std.heap.page_allocator,
            undefined, // Database must be provided
        );
    }
    
    /// Create a context with custom configuration
    pub fn custom(comptime config: EvmConfig) type {
        return EvmBuilder(config);
    }
};

/// Type alias for standard Ethereum mainnet EVM
pub const MainnetEvm = EvmWrapper(EvmConfig{});

/// Inspector implementation example
pub const NoOpInspector = struct {
    const Self = @This();
    
    pub fn init() Inspector {
        return Inspector{
            .ptr = undefined,
            .vtable = &.{
                .step = step,
                .call = call,
                .return_fn = return_fn,
                .log = log,
            },
        };
    }
    
    fn step(_: *anyopaque, _: usize, _: u8, _: u64, _: []const u256) void {}
    fn call(_: *anyopaque, _: usize, _: primitives.Address, _: primitives.Address, _: u256) void {}
    fn return_fn(_: *anyopaque, _: usize, _: []const u8) void {}
    fn log(_: *anyopaque, _: primitives.Address, _: []const u256, _: []const u8) void {}
};

// Basic smoke tests - comprehensive tests are in rust_api_tests.zig
test "rust_api basic smoke test" {
    var db = Database.init(std.testing.allocator);
    defer db.deinit();
    
    const evm = try EvmBuilder(EvmConfig{})
        .new(std.testing.allocator, &db)
        .build();
    defer evm.deinit();
    
    // Just verify the API compiles and initializes
    try std.testing.expect(evm.evm.depth == 0);
}

// Import comprehensive tests
test {
    _ = @import("rust_api_tests.zig");
}