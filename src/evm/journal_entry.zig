/// Journal entry types for tracking EVM state changes
const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const JournalConfig = @import("journal_config.zig").JournalConfig;

/// Create a journal entry type based on configuration
pub fn JournalEntry(comptime config: JournalConfig) type {
    config.validate();
    
    return struct {
        const Self = @This();
        
        pub const SnapshotIdType = config.SnapshotIdType;
        pub const WordType = config.WordType;
        pub const NonceType = config.NonceType;
        
        snapshot_id: SnapshotIdType,
        data: Data,
        
        /// Union of possible state changes
        pub const Data = union(enum) {
            storage_change: StorageChange,
            balance_change: BalanceChange,
            nonce_change: NonceChange,
            code_change: CodeChange,
            account_created: AccountCreated,
            account_destroyed: AccountDestroyed,
        };
        
        /// Storage slot change
        pub const StorageChange = struct {
            address: Address,
            key: WordType,
            original_value: WordType,
        };
        
        /// Balance change
        pub const BalanceChange = struct {
            address: Address,
            original_balance: WordType,
        };
        
        /// Nonce change
        pub const NonceChange = struct {
            address: Address,
            original_nonce: NonceType,
        };
        
        /// Code change
        pub const CodeChange = struct {
            address: Address,
            original_code_hash: [32]u8,
        };
        
        /// Account creation
        pub const AccountCreated = struct {
            address: Address,
        };
        
        /// Account destruction (self-destruct)
        pub const AccountDestroyed = struct {
            address: Address,
            beneficiary: Address,
            balance: WordType,
        };
        
        /// Create a storage change entry
        pub fn storage_change(snapshot_id: SnapshotIdType, address: Address, key: WordType, original_value: WordType) Self {
            return Self{
                .snapshot_id = snapshot_id,
                .data = .{ .storage_change = .{
                    .address = address,
                    .key = key,
                    .original_value = original_value,
                } },
            };
        }
        
        /// Create a balance change entry
        pub fn balance_change(snapshot_id: SnapshotIdType, address: Address, original_balance: WordType) Self {
            return Self{
                .snapshot_id = snapshot_id,
                .data = .{ .balance_change = .{
                    .address = address,
                    .original_balance = original_balance,
                } },
            };
        }
        
        /// Create a nonce change entry
        pub fn nonce_change(snapshot_id: SnapshotIdType, address: Address, original_nonce: NonceType) Self {
            return Self{
                .snapshot_id = snapshot_id,
                .data = .{ .nonce_change = .{
                    .address = address,
                    .original_nonce = original_nonce,
                } },
            };
        }
        
        /// Create a code change entry
        pub fn code_change(snapshot_id: SnapshotIdType, address: Address, original_code_hash: [32]u8) Self {
            return Self{
                .snapshot_id = snapshot_id,
                .data = .{ .code_change = .{
                    .address = address,
                    .original_code_hash = original_code_hash,
                } },
            };
        }
        
        /// Create an account created entry
        pub fn account_created(snapshot_id: SnapshotIdType, address: Address) Self {
            return Self{
                .snapshot_id = snapshot_id,
                .data = .{ .account_created = .{
                    .address = address,
                } },
            };
        }
        
        /// Create an account destroyed entry
        pub fn account_destroyed(snapshot_id: SnapshotIdType, address: Address, beneficiary: Address, balance: WordType) Self {
            return Self{
                .snapshot_id = snapshot_id,
                .data = .{ .account_destroyed = .{
                    .address = address,
                    .beneficiary = beneficiary,
                    .balance = balance,
                } },
            };
        }
    };
}

/// Default journal entry type
pub const DefaultJournalEntry = JournalEntry(.{});

test "JournalEntry creation and field access" {
    const testing = std.testing;
    const config = JournalConfig{
        .SnapshotIdType = u16,
        .WordType = u128,
        .NonceType = u32,
    };
    const Entry = JournalEntry(config);
    
    const addr = Address.from_hex("0x1234567890123456789012345678901234567890") catch unreachable;
    const key: u128 = 42;
    const value: u128 = 100;
    
    // Test storage change
    const storage_entry = Entry.storage_change(1, addr, key, value);
    try testing.expectEqual(@as(u16, 1), storage_entry.snapshot_id);
    switch (storage_entry.data) {
        .storage_change => |sc| {
            try testing.expectEqual(addr, sc.address);
            try testing.expectEqual(key, sc.key);
            try testing.expectEqual(value, sc.original_value);
        },
        else => try testing.expect(false),
    }
    
    // Test balance change
    const balance_entry = Entry.balance_change(2, addr, 1000);
    try testing.expectEqual(@as(u16, 2), balance_entry.snapshot_id);
    switch (balance_entry.data) {
        .balance_change => |bc| {
            try testing.expectEqual(addr, bc.address);
            try testing.expectEqual(@as(u128, 1000), bc.original_balance);
        },
        else => try testing.expect(false),
    }
    
    // Test nonce change
    const nonce_entry = Entry.nonce_change(3, addr, 5);
    try testing.expectEqual(@as(u16, 3), nonce_entry.snapshot_id);
    switch (nonce_entry.data) {
        .nonce_change => |nc| {
            try testing.expectEqual(addr, nc.address);
            try testing.expectEqual(@as(u32, 5), nc.original_nonce);
        },
        else => try testing.expect(false),
    }
    
    // Test code change
    const code_hash = [_]u8{0xAB} ** 32;
    const code_entry = Entry.code_change(4, addr, code_hash);
    try testing.expectEqual(@as(u16, 4), code_entry.snapshot_id);
    switch (code_entry.data) {
        .code_change => |cc| {
            try testing.expectEqual(addr, cc.address);
            try testing.expectEqualSlices(u8, &code_hash, &cc.original_code_hash);
        },
        else => try testing.expect(false),
    }
    
    // Test account created
    const created_entry = Entry.account_created(5, addr);
    try testing.expectEqual(@as(u16, 5), created_entry.snapshot_id);
    switch (created_entry.data) {
        .account_created => |ac| {
            try testing.expectEqual(addr, ac.address);
        },
        else => try testing.expect(false),
    }
    
    // Test account destroyed
    const beneficiary = Address.from_hex("0x9876543210987654321098765432109876543210") catch unreachable;
    const destroyed_entry = Entry.account_destroyed(6, addr, beneficiary, 50000);
    try testing.expectEqual(@as(u16, 6), destroyed_entry.snapshot_id);
    switch (destroyed_entry.data) {
        .account_destroyed => |ad| {
            try testing.expectEqual(addr, ad.address);
            try testing.expectEqual(beneficiary, ad.beneficiary);
            try testing.expectEqual(@as(u128, 50000), ad.balance);
        },
        else => try testing.expect(false),
    }
}

test "JournalEntry with minimal config" {
    const testing = std.testing;
    const config = JournalConfig{
        .SnapshotIdType = u8,
        .WordType = u64,
        .NonceType = u16,
    };
    const Entry = JournalEntry(config);
    
    const addr = [_]u8{0} ** 20;
    
    // Test with minimal types
    const entry = Entry.storage_change(255, addr, std.math.maxInt(u64), 0);
    try testing.expectEqual(@as(u8, 255), entry.snapshot_id);
    switch (entry.data) {
        .storage_change => |sc| {
            try testing.expectEqual(@as(u64, std.math.maxInt(u64)), sc.key);
            try testing.expectEqual(@as(u64, 0), sc.original_value);
        },
        else => try testing.expect(false),
    }
}