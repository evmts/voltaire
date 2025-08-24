/// Centralized Gas Management for EVM Operations
///
/// Provides safe, efficient gas tracking with overflow protection, branch prediction
/// optimization, and comprehensive error handling. Replaces scattered gas_remaining
/// logic throughout the EVM with a centralized, well-tested component.
///
/// Key features:
/// - Type-safe gas consumption with overflow detection
/// - Branch prediction hints for performance
/// - Comprehensive error handling and validation
/// - Debug logging support for gas analysis
/// - Compatible with existing EVM gas patterns
const std = @import("std");
const builtin = @import("builtin");
pub const GasManagerConfig = @import("gas_manager_config.zig").GasManagerConfig;

pub const GasError = error{
    OutOfGas,
    GasOverflow,
    InvalidAmount,
};

/// Factory function to create a GasManager type with the given configuration
pub fn GasManager(comptime config: GasManagerConfig) type {
    comptime config.validate();
    
    return struct {
        pub const GasType = config.GasType();
        pub const Config = config;
        
        const Self = @This();
        
        /// Current gas remaining - can be negative to detect out-of-gas
        remaining: GasType,
        
        /// Initialize gas manager with starting gas amount
        pub fn init(starting_gas: u64) !Self {
            if (starting_gas > config.maxGas()) {
                return GasError.GasOverflow;
            }
            
            return Self{
                .remaining = @intCast(starting_gas),
            };
        }
        
        /// Get current gas remaining (never negative in public API)
        pub fn gasRemaining(self: *const Self) u64 {
            return if (self.remaining < 0) 0 else @intCast(self.remaining);
        }
        
        /// Check if we have sufficient gas for an operation
        pub fn hasGas(self: *const Self, amount: u64) bool {
            if (amount > std.math.maxInt(GasType)) return false;
            return self.remaining >= @as(GasType, @intCast(amount));
        }
        
        /// Check if we're out of gas (remaining <= 0)
        pub fn isOutOfGas(self: *const Self) bool {
            return self.remaining <= 0;
        }
        
        /// Get raw remaining gas (can be negative for internal use)
        pub fn rawRemaining(self: *const Self) GasType {
            return self.remaining;
        }
        
        /// Consume gas with safety checks - preferred method for gas consumption
        pub fn consume(self: *Self, amount: u64) GasError!void {
            // Validate input amount can fit in our gas type
            if (amount > std.math.maxInt(GasType)) {
                if (comptime config.enable_branch_hints) @branchHint(.cold);
                return GasError.InvalidAmount;
            }
            
            const amount_typed = @as(GasType, @intCast(amount));
            
            // Check if we have sufficient gas
            if (self.remaining < amount_typed) {
                if (comptime config.enable_branch_hints) @branchHint(.cold);
                return GasError.OutOfGas;
            }
            
            // Consume the gas
            self.remaining -= amount_typed;
            
            // Optional debug logging
            if (comptime config.enable_gas_logging and builtin.mode == .Debug) {
                std.log.debug("Gas consumed: {}, remaining: {}", .{ amount, self.remaining });
            }
        }
        
        /// Unsafe gas consumption without checks - for performance-critical paths
        /// Only use when gas availability has been pre-verified
        pub fn consumeUnchecked(self: *Self, amount: u64) void {
            if (comptime config.enable_branch_hints) @branchHint(.likely);
            
            if (comptime builtin.mode == .Debug and config.enable_overflow_checks) {
                // In debug mode, still do basic validation
                std.debug.assert(amount <= std.math.maxInt(GasType));
                std.debug.assert(self.remaining >= @as(GasType, @intCast(amount)));
            }
            
            self.remaining -= @as(GasType, @intCast(amount));
            
            if (comptime config.enable_gas_logging and builtin.mode == .Debug) {
                std.log.debug("Gas consumed (unchecked): {}, remaining: {}", .{ amount, self.remaining });
            }
        }
        
        /// Try to consume gas, returns true if successful, false if insufficient
        pub fn tryConsume(self: *Self, amount: u64) bool {
            if (self.hasGas(amount)) {
                self.consumeUnchecked(amount);
                return true;
            }
            return false;
        }
        
        /// Add gas back (for gas refunds)
        pub fn refund(self: *Self, amount: u64) GasError!void {
            if (amount > std.math.maxInt(GasType)) {
                if (comptime config.enable_branch_hints) @branchHint(.cold);
                return GasError.InvalidAmount;
            }
            
            const amount_typed = @as(GasType, @intCast(amount));
            
            // Check for overflow
            if (self.remaining > config.maxGas() - amount_typed) {
                if (comptime config.enable_branch_hints) @branchHint(.cold);
                return GasError.GasOverflow;
            }
            
            self.remaining += amount_typed;
            
            if (comptime config.enable_gas_logging and builtin.mode == .Debug) {
                std.log.debug("Gas refunded: {}, remaining: {}", .{ amount, self.remaining });
            }
        }
    };
}

// Default GasManager type using default configuration
pub const DefaultGasManager = GasManager(GasManagerConfig{});

test "GasManager initialization" {
    const TestGasManager = GasManager(.{});
    
    // Test successful initialization
    var gas_mgr = try TestGasManager.init(1000);
    try std.testing.expectEqual(@as(u64, 1000), gas_mgr.gasRemaining());
    try std.testing.expectEqual(@as(TestGasManager.GasType, 1000), gas_mgr.rawRemaining());
    try std.testing.expect(!gas_mgr.isOutOfGas());
    
    // Test zero gas initialization
    var zero_gas = try TestGasManager.init(0);
    try std.testing.expectEqual(@as(u64, 0), zero_gas.gasRemaining());
    try std.testing.expect(zero_gas.isOutOfGas());
    
    // Test maximum safe gas
    const max_safe = std.math.maxInt(i32);
    var max_gas = try TestGasManager.init(@intCast(max_safe));
    try std.testing.expectEqual(@as(u64, @intCast(max_safe)), max_gas.gasRemaining());
    try std.testing.expect(!max_gas.isOutOfGas());
}

test "GasManager gas overflow detection" {
    const TestGasManager = GasManager(.{ .block_gas_limit = 1000 });
    
    // Should fail when trying to initialize with too much gas
    try std.testing.expectError(GasError.GasOverflow, TestGasManager.init(std.math.maxInt(u64)));
    
    // Should succeed with valid amount
    var gas_mgr = try TestGasManager.init(500);
    try std.testing.expectEqual(@as(u64, 500), gas_mgr.gasRemaining());
}

test "GasManager gas checking methods" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(100);
    
    // Test hasGas method
    try std.testing.expect(gas_mgr.hasGas(50));
    try std.testing.expect(gas_mgr.hasGas(100));
    try std.testing.expect(!gas_mgr.hasGas(101));
    try std.testing.expect(!gas_mgr.hasGas(std.math.maxInt(u64))); // Overflow case
    
    // Test with zero gas
    var zero_gas = try TestGasManager.init(0);
    try std.testing.expect(!zero_gas.hasGas(1));
    try std.testing.expect(zero_gas.hasGas(0));
    try std.testing.expect(zero_gas.isOutOfGas());
}

test "GasManager configuration variations" {
    // Test different configurations
    const SmallGasManager = GasManager(.{ .block_gas_limit = 1000 });
    const LargeGasManager = GasManager(.{ .block_gas_limit = 5_000_000_000 });
    
    try std.testing.expectEqual(i32, SmallGasManager.GasType);
    try std.testing.expectEqual(i64, LargeGasManager.GasType);
    
    // Both should work with appropriate gas amounts
    var small_mgr = try SmallGasManager.init(500);
    var large_mgr = try LargeGasManager.init(1_000_000_000);
    
    try std.testing.expectEqual(@as(u64, 500), small_mgr.gasRemaining());
    try std.testing.expectEqual(@as(u64, 1_000_000_000), large_mgr.gasRemaining());
}

test "GasManager default type usage" {
    // Test using the default type alias
    var default_mgr = try DefaultGasManager.init(50000);
    try std.testing.expectEqual(@as(u64, 50000), default_mgr.gasRemaining());
    try std.testing.expect(!default_mgr.isOutOfGas());
    try std.testing.expect(default_mgr.hasGas(30000));
}