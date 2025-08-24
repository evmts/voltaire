/// Configuration options for the Journal implementation
const std = @import("std");

pub const JournalConfig = struct {
    /// Type used for snapshot IDs
    SnapshotIdType: type = u32,
    
    /// Type used for word-sized values (balances, storage values, etc.)
    WordType: type = u256,
    
    /// Type used for nonces
    NonceType: type = u64,
    
    /// Initial capacity for journal entries
    initial_capacity: usize = 128,
    
    /// Whether to use data-oriented design for entries
    use_soa: bool = false,
    
    pub fn validate(comptime self: JournalConfig) void {
        // Validate SnapshotIdType is an unsigned integer
        const snapshot_info = @typeInfo(self.SnapshotIdType);
        if (snapshot_info != .int or snapshot_info.int.signedness != .unsigned) {
            @compileError("SnapshotIdType must be an unsigned integer");
        }
        
        // Validate WordType is an unsigned integer
        const word_info = @typeInfo(self.WordType);
        if (word_info != .int or word_info.int.signedness != .unsigned) {
            @compileError("WordType must be an unsigned integer");
        }
        
        // Validate NonceType is an unsigned integer
        const nonce_info = @typeInfo(self.NonceType);
        if (nonce_info != .int or nonce_info.int.signedness != .unsigned) {
            @compileError("NonceType must be an unsigned integer");
        }
        
        // Validate initial capacity
        if (self.initial_capacity == 0) {
            @compileError("initial_capacity must be greater than 0");
        }
    }
    
    /// Returns the optimal snapshot ID type based on maximum expected snapshots
    pub fn get_optimal_snapshot_type(max_snapshots: usize) type {
        if (max_snapshots <= std.math.maxInt(u8)) return u8;
        if (max_snapshots <= std.math.maxInt(u16)) return u16;
        if (max_snapshots <= std.math.maxInt(u32)) return u32;
        return u64;
    }
};

/// Default configuration for EVM journal
pub const default_config = JournalConfig{};

/// Minimal configuration for testing
pub const minimal_config = JournalConfig{
    .SnapshotIdType = u8,
    .WordType = u64,
    .NonceType = u32,
    .initial_capacity = 16,
};

/// Configuration for maximum performance with data-oriented design
pub const performance_config = JournalConfig{
    .SnapshotIdType = u16,
    .WordType = u256,
    .NonceType = u64,
    .initial_capacity = 256,
    .use_soa = true,
};

test "JournalConfig validation" {
    const testing = std.testing;
    
    // Test default config
    default_config.validate();
    
    // Test minimal config
    minimal_config.validate();
    
    // Test performance config
    performance_config.validate();
    
    // Test optimal snapshot type selection
    try testing.expectEqual(u8, JournalConfig.get_optimal_snapshot_type(100));
    try testing.expectEqual(u16, JournalConfig.get_optimal_snapshot_type(1000));
    try testing.expectEqual(u32, JournalConfig.get_optimal_snapshot_type(100000));
    try testing.expectEqual(u64, JournalConfig.get_optimal_snapshot_type(std.math.maxInt(u64)));
}