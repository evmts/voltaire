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
                @branchHint(.cold);
                return GasError.InvalidAmount;
            }
            
            const amount_typed = @as(GasType, @intCast(amount));
            
            // Check if we have sufficient gas
            if (self.remaining < amount_typed) {
                @branchHint(.cold);
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
            @branchHint(.likely);
            
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
                @branchHint(.cold);
                return GasError.InvalidAmount;
            }
            
            const amount_typed = @as(GasType, @intCast(amount));
            
            // Check for overflow - prevent adding more than max allowed
            const max_gas = @as(GasType, @intCast(config.maxGas()));
            if (amount_typed > max_gas - self.remaining) {
                @branchHint(.cold);
                return GasError.GasOverflow;
            }
            
            self.remaining += amount_typed;
            
            if (comptime config.enable_gas_logging and builtin.mode == .Debug) {
                std.log.debug("Gas refunded: {}, remaining: {}", .{ amount, self.remaining });
            }
        }
        
        /// Check if we have sufficient gas and consume it atomically
        /// Returns true if successful, false if insufficient gas (no consumption)
        pub fn checkAndConsume(self: *Self, amount: u64) bool {
            if (self.hasGas(amount)) {
                self.consumeUnchecked(amount);
                return true;
            }
            return false;
        }
        
        /// Consume gas with custom error handling - throws OutOfGas immediately
        pub fn mustConsume(self: *Self, amount: u64) GasError!void {
            if (!self.hasGas(amount)) {
                @branchHint(.cold);
                return GasError.OutOfGas;
            }
            self.consumeUnchecked(amount);
        }
        
        /// Calculate total gas that would be consumed by multiple operations
        pub fn wouldConsumeTotal(amounts: []const u64) ?u64 {
            var total: u64 = 0;
            for (amounts) |amount| {
                const new_total = total +% amount; // Wrapping addition
                if (new_total < total and amount > 0) return null; // Overflow detection
                total = new_total;
            }
            return total;
        }
        
        /// Batch consume multiple gas amounts atomically (all or nothing)
        pub fn consumeBatch(self: *Self, amounts: []const u64) GasError!void {
            // Calculate total first
            const total = Self.wouldConsumeTotal(amounts) orelse return GasError.GasOverflow;
            
            // Check if we have enough for the entire batch
            if (!self.hasGas(total)) {
                @branchHint(.cold);
                return GasError.OutOfGas;
            }
            
            // Consume the total amount
            self.consumeUnchecked(total);
        }
        
        /// Get gas consumption statistics for debugging
        pub fn getStats(self: *const Self) GasStats {
            const remaining = self.gasRemaining();
            const max_gas = @as(u64, @intCast(config.maxGas()));
            const consumed = max_gas - remaining;
            
            return GasStats{
                .remaining = remaining,
                .consumed = consumed,
                .max_gas = max_gas,
                .utilization_percent = if (max_gas > 0) (consumed * 100) / max_gas else 0,
                .is_low = remaining < (max_gas / 10), // Less than 10% remaining
            };
        }
    };
}

/// Gas usage statistics for debugging and analysis
pub const GasStats = struct {
    remaining: u64,
    consumed: u64,
    max_gas: u64,
    utilization_percent: u64,
    is_low: bool,
};

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
    
    // Test maximum block gas limit
    const max_block_gas = TestGasManager.Config.maxGas();
    var max_gas = try TestGasManager.init(@intCast(max_block_gas));
    try std.testing.expectEqual(@as(u64, @intCast(max_block_gas)), max_gas.gasRemaining());
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

test "GasManager consume method" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(1000);
    
    // Test successful consumption
    try gas_mgr.consume(100);
    try std.testing.expectEqual(@as(u64, 900), gas_mgr.gasRemaining());
    try std.testing.expect(!gas_mgr.isOutOfGas());
    
    // Test consuming exact remaining amount
    try gas_mgr.consume(900);
    try std.testing.expectEqual(@as(u64, 0), gas_mgr.gasRemaining());
    try std.testing.expect(gas_mgr.isOutOfGas());
    
    // Test out of gas error
    try std.testing.expectError(GasError.OutOfGas, gas_mgr.consume(1));
    try std.testing.expectEqual(@as(u64, 0), gas_mgr.gasRemaining()); // Should remain unchanged
}

test "GasManager consume edge cases" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(500);
    
    // Test consuming zero gas
    try gas_mgr.consume(0);
    try std.testing.expectEqual(@as(u64, 500), gas_mgr.gasRemaining());
    
    // Test consuming more than available
    try std.testing.expectError(GasError.OutOfGas, gas_mgr.consume(501));
    try std.testing.expectEqual(@as(u64, 500), gas_mgr.gasRemaining()); // Should remain unchanged
    
    // Test invalid amount (too large for gas type)
    try std.testing.expectError(GasError.InvalidAmount, gas_mgr.consume(std.math.maxInt(u64)));
}

test "GasManager consumeUnchecked method" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(1000);
    
    // Test unchecked consumption
    gas_mgr.consumeUnchecked(250);
    try std.testing.expectEqual(@as(u64, 750), gas_mgr.gasRemaining());
    
    // Test consuming all remaining gas
    gas_mgr.consumeUnchecked(750);
    try std.testing.expectEqual(@as(u64, 0), gas_mgr.gasRemaining());
    try std.testing.expect(gas_mgr.isOutOfGas());
    
    // Test consuming zero
    var gas_mgr2 = try TestGasManager.init(100);
    gas_mgr2.consumeUnchecked(0);
    try std.testing.expectEqual(@as(u64, 100), gas_mgr2.gasRemaining());
}

test "GasManager tryConsume method" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(500);
    
    // Test successful try consume
    try std.testing.expect(gas_mgr.tryConsume(200));
    try std.testing.expectEqual(@as(u64, 300), gas_mgr.gasRemaining());
    
    // Test failed try consume
    try std.testing.expect(!gas_mgr.tryConsume(400));
    try std.testing.expectEqual(@as(u64, 300), gas_mgr.gasRemaining()); // Should remain unchanged
    
    // Test exact amount
    try std.testing.expect(gas_mgr.tryConsume(300));
    try std.testing.expectEqual(@as(u64, 0), gas_mgr.gasRemaining());
    try std.testing.expect(gas_mgr.isOutOfGas());
    
    // Test when out of gas
    try std.testing.expect(!gas_mgr.tryConsume(1));
    try std.testing.expectEqual(@as(u64, 0), gas_mgr.gasRemaining());
}

test "GasManager refund method" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(500);
    
    // Consume some gas first
    try gas_mgr.consume(200);
    try std.testing.expectEqual(@as(u64, 300), gas_mgr.gasRemaining());
    
    // Test refund
    try gas_mgr.refund(100);
    try std.testing.expectEqual(@as(u64, 400), gas_mgr.gasRemaining());
    
    // Test zero refund
    try gas_mgr.refund(0);
    try std.testing.expectEqual(@as(u64, 400), gas_mgr.gasRemaining());
    
    // Test refund back to original amount
    try gas_mgr.refund(100);
    try std.testing.expectEqual(@as(u64, 500), gas_mgr.gasRemaining());
}

test "GasManager refund edge cases" {
    const SmallGasManager = GasManager(.{ .block_gas_limit = 1000 });
    var gas_mgr = try SmallGasManager.init(800);
    
    // Debug the values
    try std.testing.expectEqual(@as(comptime_int, 1000), SmallGasManager.Config.maxGas());
    
    // Test refund that would cause overflow (800 + 300 = 1100 > 1000)
    try std.testing.expectError(GasError.GasOverflow, gas_mgr.refund(300));
    try std.testing.expectEqual(@as(u64, 800), gas_mgr.gasRemaining()); // Should remain unchanged
    
    // Test valid refund at edge
    try gas_mgr.refund(200); // 800 + 200 = 1000, should be exactly at limit
    try std.testing.expectEqual(@as(u64, 1000), gas_mgr.gasRemaining());
    
    // Test invalid amount (too large for gas type)
    try std.testing.expectError(GasError.InvalidAmount, gas_mgr.refund(std.math.maxInt(u64)));
}

test "GasManager with different configurations" {
    // Test with branch hints disabled
    const NoBranchHints = GasManager(.{ .enable_branch_hints = false });
    var mgr1 = try NoBranchHints.init(100);
    try mgr1.consume(50);
    try std.testing.expectEqual(@as(u64, 50), mgr1.gasRemaining());
    
    // Test with overflow checks disabled
    const NoOverflowChecks = GasManager(.{ .enable_overflow_checks = false });
    var mgr2 = try NoOverflowChecks.init(200);
    mgr2.consumeUnchecked(75);
    try std.testing.expectEqual(@as(u64, 125), mgr2.gasRemaining());
    
    // Test with gas logging enabled (won't see output in tests, but should not crash)
    const WithLogging = GasManager(.{ .enable_gas_logging = true });
    var mgr3 = try WithLogging.init(150);
    try mgr3.consume(25);
    try mgr3.refund(10);
    try std.testing.expectEqual(@as(u64, 135), mgr3.gasRemaining());
}

test "GasManager checkAndConsume method" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(500);
    
    // Test successful check and consume
    try std.testing.expect(gas_mgr.checkAndConsume(200));
    try std.testing.expectEqual(@as(u64, 300), gas_mgr.gasRemaining());
    
    // Test failed check and consume (no gas consumed)
    try std.testing.expect(!gas_mgr.checkAndConsume(400));
    try std.testing.expectEqual(@as(u64, 300), gas_mgr.gasRemaining());
    
    // Test exact amount
    try std.testing.expect(gas_mgr.checkAndConsume(300));
    try std.testing.expectEqual(@as(u64, 0), gas_mgr.gasRemaining());
    try std.testing.expect(gas_mgr.isOutOfGas());
    
    // Test when out of gas
    try std.testing.expect(!gas_mgr.checkAndConsume(1));
    try std.testing.expectEqual(@as(u64, 0), gas_mgr.gasRemaining());
}

test "GasManager mustConsume method" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(1000);
    
    // Test successful must consume
    try gas_mgr.mustConsume(300);
    try std.testing.expectEqual(@as(u64, 700), gas_mgr.gasRemaining());
    
    // Test successful exact consume
    try gas_mgr.mustConsume(700);
    try std.testing.expectEqual(@as(u64, 0), gas_mgr.gasRemaining());
    try std.testing.expect(gas_mgr.isOutOfGas());
    
    // Test failed must consume
    try std.testing.expectError(GasError.OutOfGas, gas_mgr.mustConsume(1));
    try std.testing.expectEqual(@as(u64, 0), gas_mgr.gasRemaining()); // Should remain unchanged
}

test "GasManager wouldConsumeTotal static method" {
    // Test empty array
    try std.testing.expectEqual(@as(u64, 0), DefaultGasManager.wouldConsumeTotal(&.{}).?);
    
    // Test single amount
    try std.testing.expectEqual(@as(u64, 100), DefaultGasManager.wouldConsumeTotal(&.{100}).?);
    
    // Test multiple amounts
    try std.testing.expectEqual(@as(u64, 600), DefaultGasManager.wouldConsumeTotal(&.{ 100, 200, 300 }).?);
    
    // Test overflow detection
    const large_amounts = [_]u64{ std.math.maxInt(u64) - 100, 200 };
    try std.testing.expectEqual(@as(?u64, null), DefaultGasManager.wouldConsumeTotal(&large_amounts));
    
    // Test zero values
    try std.testing.expectEqual(@as(u64, 500), DefaultGasManager.wouldConsumeTotal(&.{ 100, 0, 200, 0, 200 }).?);
}

test "GasManager consumeBatch method" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(1000);
    
    // Test successful batch consume
    try gas_mgr.consumeBatch(&.{ 100, 200, 150 });
    try std.testing.expectEqual(@as(u64, 550), gas_mgr.gasRemaining());
    
    // Test batch with zero values
    try gas_mgr.consumeBatch(&.{ 50, 0, 100, 0 });
    try std.testing.expectEqual(@as(u64, 400), gas_mgr.gasRemaining());
    
    // Test empty batch
    try gas_mgr.consumeBatch(&.{});
    try std.testing.expectEqual(@as(u64, 400), gas_mgr.gasRemaining());
    
    // Test failed batch (insufficient gas) - should not consume anything
    try std.testing.expectError(GasError.OutOfGas, gas_mgr.consumeBatch(&.{ 200, 250 })); // Total 450 > 400 available
    try std.testing.expectEqual(@as(u64, 400), gas_mgr.gasRemaining()); // Should remain unchanged
    
    // Test successful consume of remaining
    try gas_mgr.consumeBatch(&.{ 200, 200 });
    try std.testing.expectEqual(@as(u64, 0), gas_mgr.gasRemaining());
    try std.testing.expect(gas_mgr.isOutOfGas());
}

test "GasManager batch overflow detection" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(1000);
    
    // Test batch that would overflow total calculation
    const large_amounts = [_]u64{ std.math.maxInt(u64) - 100, 200 };
    try std.testing.expectError(GasError.GasOverflow, gas_mgr.consumeBatch(&large_amounts));
    try std.testing.expectEqual(@as(u64, 1000), gas_mgr.gasRemaining()); // Should remain unchanged
}

test "GasManager getStats method" {
    const TestGasManager = GasManager(.{});
    var gas_mgr = try TestGasManager.init(1000);
    
    // Test initial stats
    var stats = gas_mgr.getStats();
    try std.testing.expectEqual(@as(u64, 1000), stats.remaining);
    try std.testing.expectEqual(@as(u64, 0), stats.consumed);
    try std.testing.expectEqual(@as(u64, 30_000_000), stats.max_gas); // Default config
    try std.testing.expectEqual(@as(u64, 0), stats.utilization_percent);
    try std.testing.expect(!stats.is_low);
    
    // Test after consumption
    try gas_mgr.consume(600);
    stats = gas_mgr.getStats();
    try std.testing.expectEqual(@as(u64, 400), stats.remaining);
    try std.testing.expectEqual(@as(u64, 600), stats.consumed);
    try std.testing.expect(!stats.is_low); // Still above 10%
    
    // Test low gas condition with smaller manager
    const SmallGasManager = GasManager(.{ .block_gas_limit = 1000 });
    var small_mgr = try SmallGasManager.init(1000);
    try small_mgr.consume(950); // Leave only 50, which is 5% of 1000
    stats = small_mgr.getStats();
    try std.testing.expectEqual(@as(u64, 50), stats.remaining);
    try std.testing.expectEqual(@as(u64, 950), stats.consumed);
    try std.testing.expectEqual(@as(u64, 1000), stats.max_gas);
    try std.testing.expectEqual(@as(u64, 95), stats.utilization_percent);
    try std.testing.expect(stats.is_low); // Less than 10% remaining
}