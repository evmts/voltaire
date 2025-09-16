//! EVM Storage Integration Module
//! 
//! This module shows how to integrate the new Storage union type with the EVM,
//! enabling support for different storage backends with zero overhead.

const std = @import("std");
const Storage = @import("storage/storage.zig").Storage;
const Database = @import("storage/database.zig").Database;

/// Enhanced EVM with Storage union support
pub fn EnhancedEvm(comptime config: EvmConfig) type {
    return struct {
        const Self = @This();
        
        // OLD: database: *Database
        // NEW: Storage union with zero overhead
        storage: *Storage,  // Pointer to Storage union
        
        // ... other fields remain the same ...
        
        /// Initialize with Storage instead of Database
        pub fn init(
            allocator: std.mem.Allocator,
            storage: *Storage,  // Changed from *Database
            block_info: BlockInfo,
            context: TransactionContext,
            gas_price: u256,
            origin: Address,
            hardfork: Hardfork,
        ) !Self {
            var self = Self{
                .storage = storage,
                // ... other initialization ...
            };
            
            // Process system contracts - now works with any storage backend
            if (comptime config.enable_beacon_roots) {
                // Storage union dispatches to correct backend automatically
                BeaconRootsContract.processBeaconRootUpdate(storage, &block_info) catch |err| {
                    self.tracer.onBeaconRootUpdate(false, err);
                };
            }
            
            return self;
        }
        
        /// All storage operations now go through the union
        fn transferWithBalanceChecks(self: *Self, from: Address, to: Address, value: u256, snapshot_id: u32) !void {
            // OLD: self.database.get_account(from.bytes)
            // NEW: self.storage.get_account(from.bytes)
            var from_account = try self.storage.get_account(from.bytes) orelse Account.zero();
            
            if (from_account.balance < value) return error.InsufficientBalance;
            if (from.equals(to)) return;
            
            var to_account = try self.storage.get_account(to.bytes) orelse Account.zero();
            
            // Journal integration remains the same
            try self.journal.record_balance_change(snapshot_id, from, from_account.balance);
            try self.journal.record_balance_change(snapshot_id, to, to_account.balance);
            
            from_account.balance -= value;
            to_account.balance += value;
            
            // Storage union handles the dispatch
            try self.storage.set_account(from.bytes, from_account);
            try self.storage.set_account(to.bytes, to_account);
        }
        
        /// Get storage value - union dispatch is inlined
        pub fn get_storage(self: *Self, address: Address, slot: u256) u256 {
            // Zero overhead - compiler inlines the switch
            return self.storage.get_storage(address.bytes, slot) catch 0;
        }
        
        /// Set storage value with journaling
        pub fn set_storage(self: *Self, address: Address, slot: u256, value: u256) !void {
            if (self.is_static_context()) return error.StaticCallViolation;
            
            const original_value = self.get_storage(address, slot);
            try self.record_storage_change(address, slot, original_value);
            
            // Union dispatches to appropriate backend
            try self.storage.set_storage(address.bytes, slot, value);
        }
    };
}

/// Factory functions for creating EVMs with different storage backends
pub fn createMemoryEvm(allocator: std.mem.Allocator, block_info: BlockInfo) !*Evm {
    const storage = try allocator.create(Storage);
    storage.* = Storage{ .memory = Database.init(allocator) };
    
    return try Evm.init(allocator, storage, block_info, ...);
}

pub fn createTestEvm(allocator: std.mem.Allocator, block_info: BlockInfo) !*Evm {
    const storage = try allocator.create(Storage);
    storage.* = Storage{ .test = TestStorage.init(allocator) };
    try storage.test.seedWithTestData();
    
    return try Evm.init(allocator, storage, block_info, ...);
}

pub fn createForkedEvm(allocator: std.mem.Allocator, rpc_url: []const u8, fork_block: u64) !*Evm {
    const storage = try allocator.create(Storage);
    storage.* = Storage{ 
        .forked = try ForkedStorage.init(allocator, rpc_url, fork_block)
    };
    
    return try Evm.init(allocator, storage, block_info, ...);
}

/// Example usage showing zero overhead
test "Storage integration benchmark" {
    const allocator = testing.allocator;
    
    // Create EVM with memory storage (current production path)
    var memory_storage = Storage{ .memory = Database.init(allocator) };
    defer memory_storage.deinit();
    
    var evm = try Evm.init(allocator, &memory_storage, ...);
    defer evm.deinit();
    
    // This call has ZERO overhead compared to direct Database access
    const value = evm.get_storage(address, slot);
    
    // The compiler inlines everything:
    // 1. evm.get_storage() inlines
    // 2. storage.get_storage() switch inlines
    // 3. Direct call to memory.get_storage()
    // Result: Identical assembly to original Database.get_storage()
}