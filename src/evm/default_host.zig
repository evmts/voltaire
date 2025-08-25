//! Default host implementation with stub methods for all operations.
//!
//! This host provides minimal implementations that allow Frame to function
//! without requiring external blockchain context. Useful for testing isolated
//! opcode execution or when full host functionality isn't needed.

const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const Hardfork = @import("hardfork.zig").Hardfork;
const CallResult = @import("call_result.zig").CallResult;
const CallParams = @import("call_params.zig").CallParams;
const BlockInfo = @import("block_info.zig").DefaultBlockInfo;
const Host = @import("host.zig").Host;

/// Default host implementation with stub methods.
pub const DefaultHost = struct {
    /// Create a default host interface
    pub fn init() Host {
        const implementation = &default_host_instance;
        return Host.init(implementation);
    }
};

/// Static instance of default host
var default_host_instance = DefaultHostImpl{};

const DefaultHostImpl = struct {
    /// Get account balance - returns 0
    pub fn get_balance(self: *DefaultHostImpl, address: Address) u256 {
        _ = self;
        _ = address;
        return 0;
    }

    /// Check if account exists - returns false
    pub fn account_exists(self: *DefaultHostImpl, address: Address) bool {
        _ = self;
        _ = address;
        return false;
    }

    /// Get account code - returns empty slice
    pub fn get_code(self: *DefaultHostImpl, address: Address) []const u8 {
        _ = self;
        _ = address;
        return &.{};
    }

    /// Get block information - returns default block
    pub fn get_block_info(self: *DefaultHostImpl) BlockInfo {
        _ = self;
        return BlockInfo{};
    }

    /// Emit log event - no-op
    pub fn emit_log(self: *DefaultHostImpl, contract_address: Address, topics: []const u256, data: []const u8) void {
        _ = self;
        _ = contract_address;
        _ = topics;
        _ = data;
    }

    /// Execute EVM call - returns failure
    pub fn inner_call(self: *DefaultHostImpl, params: CallParams) anyerror!CallResult {
        _ = self;
        _ = params;
        return error.NotImplemented;
    }

    /// Register a contract as created - no-op
    pub fn register_created_contract(self: *DefaultHostImpl, address: Address) anyerror!void {
        _ = self;
        _ = address;
    }

    /// Check if contract was created in tx - returns false
    pub fn was_created_in_tx(self: *DefaultHostImpl, address: Address) bool {
        _ = self;
        _ = address;
        return false;
    }

    /// Create a new journal snapshot - returns 0
    pub fn create_snapshot(self: *DefaultHostImpl) u32 {
        _ = self;
        return 0;
    }

    /// Revert state changes - no-op
    pub fn revert_to_snapshot(self: *DefaultHostImpl, snapshot_id: u32) void {
        _ = self;
        _ = snapshot_id;
    }

    /// Get storage value - returns 0
    pub fn get_storage(self: *DefaultHostImpl, address: Address, slot: u256) u256 {
        _ = self;
        _ = address;
        _ = slot;
        return 0;
    }

    /// Set storage value - no-op
    pub fn set_storage(self: *DefaultHostImpl, address: Address, slot: u256, value: u256) anyerror!void {
        _ = self;
        _ = address;
        _ = slot;
        _ = value;
    }

    /// Record storage change - no-op
    pub fn record_storage_change(self: *DefaultHostImpl, address: Address, slot: u256, original_value: u256) anyerror!void {
        _ = self;
        _ = address;
        _ = slot;
        _ = original_value;
    }

    /// Get original storage value - returns null
    pub fn get_original_storage(self: *DefaultHostImpl, address: Address, slot: u256) ?u256 {
        _ = self;
        _ = address;
        _ = slot;
        return null;
    }

    /// Access address - returns 0 gas cost
    pub fn access_address(self: *DefaultHostImpl, address: Address) anyerror!u64 {
        _ = self;
        _ = address;
        return 0;
    }

    /// Access storage slot - returns 0 gas cost
    pub fn access_storage_slot(self: *DefaultHostImpl, contract_address: Address, slot: u256) anyerror!u64 {
        _ = self;
        _ = contract_address;
        _ = slot;
        return 0;
    }

    /// Mark for destruction - no-op
    pub fn mark_for_destruction(self: *DefaultHostImpl, contract_address: Address, recipient: Address) anyerror!void {
        _ = self;
        _ = contract_address;
        _ = recipient;
    }

    /// Get current call input - returns empty slice
    pub fn get_input(self: *DefaultHostImpl) []const u8 {
        _ = self;
        return &.{};
    }

    /// Check hardfork level - returns false
    pub fn is_hardfork_at_least(self: *DefaultHostImpl, target: Hardfork) bool {
        _ = self;
        _ = target;
        return false;
    }

    /// Get current hardfork - returns Frontier
    pub fn get_hardfork(self: *DefaultHostImpl) Hardfork {
        _ = self;
        return .frontier;
    }

    /// Get static call flag - returns false
    pub fn get_is_static(self: *DefaultHostImpl) bool {
        _ = self;
        return false;
    }

    /// Get call depth - returns 0
    pub fn get_depth(self: *DefaultHostImpl) u11 {
        _ = self;
        return 0;
    }

    /// Get transaction gas price - returns 0
    pub fn get_gas_price(self: *DefaultHostImpl) u256 {
        _ = self;
        return 0;
    }

    /// Get return data - returns empty slice
    pub fn get_return_data(self: *DefaultHostImpl) []const u8 {
        _ = self;
        return &.{};
    }

    /// Get chain ID - returns 1 (Ethereum mainnet)
    pub fn get_chain_id(self: *DefaultHostImpl) u16 {
        _ = self;
        return 1;
    }

    /// Get block hash - returns null
    pub fn get_block_hash(self: *DefaultHostImpl, block_number: u64) ?[32]u8 {
        _ = self;
        _ = block_number;
        return null;
    }

    /// Get blob hash - returns null
    pub fn get_blob_hash(self: *DefaultHostImpl, index: u256) ?[32]u8 {
        _ = self;
        _ = index;
        return null;
    }

    /// Get blob base fee - returns 0
    pub fn get_blob_base_fee(self: *DefaultHostImpl) u256 {
        _ = self;
        return 0;
    }

    /// Get transaction origin - returns zero address
    pub fn get_tx_origin(self: *DefaultHostImpl) Address {
        _ = self;
        return Address.ZERO;
    }

    /// Get caller - returns zero address
    pub fn get_caller(self: *DefaultHostImpl) Address {
        _ = self;
        return Address.ZERO;
    }

    /// Get call value - returns 0
    pub fn get_call_value(self: *DefaultHostImpl) u256 {
        _ = self;
        return 0;
    }
};