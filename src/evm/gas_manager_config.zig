/// Gas Manager configuration for optimal gas tracking and management
/// 
/// Provides compile-time configuration for gas tracking precision, branch prediction
/// optimization, and safety checks. The configuration automatically selects optimal
/// integer types based on block gas limits for memory efficiency.
///
/// Key features:
/// - Smart type selection: i32 vs i64 based on gas limits
/// - Branch prediction hints for performance
/// - Overflow protection and safety validation
/// - Compatibility with existing FrameConfig patterns
const std = @import("std");

pub const GasManagerConfig = struct {
    const Self = @This();

    /// Maximum gas limit for a block - determines gas tracking integer type
    block_gas_limit: u64 = 30_000_000,
    
    /// Enable overflow checking in debug builds
    enable_overflow_checks: bool = true,
    
    /// Enable branch prediction hints for performance optimization
    enable_branch_hints: bool = true,
    
    /// Enable gas consumption logging for debugging (debug builds only)
    enable_gas_logging: bool = false,

    /// Automatically select optimal signed integer type for gas tracking
    /// i32 for most blocks, i64 for very large gas limits
    pub fn GasType(comptime self: Self) type {
        return if (self.block_gas_limit <= std.math.maxInt(i32))
            i32
        else
            i64;
    }

    /// Get the maximum safe gas value that can be represented
    pub fn maxGas(comptime self: Self) comptime_int {
        return std.math.maxInt(self.GasType());
    }

    /// Validate configuration at compile time
    pub fn validate(comptime self: Self) void {
        if (self.block_gas_limit == 0) {
            @compileError("block_gas_limit cannot be zero");
        }
        if (self.block_gas_limit > std.math.maxInt(u64) / 2) {
            @compileError("block_gas_limit too large - could cause overflow");
        }
    }
};

// Default configuration matching existing EVM settings
pub const DEFAULT_CONFIG = GasManagerConfig{};

test "GasManagerConfig type selection" {
    // Test i32 selection for normal gas limits
    const config_i32 = GasManagerConfig{ .block_gas_limit = 30_000_000 };
    comptime config_i32.validate();
    try std.testing.expectEqual(i32, config_i32.GasType());
    try std.testing.expectEqual(@as(comptime_int, std.math.maxInt(i32)), config_i32.maxGas());

    // Test i64 selection for large gas limits
    const config_i64 = GasManagerConfig{ .block_gas_limit = 5_000_000_000 };
    comptime config_i64.validate();
    try std.testing.expectEqual(i64, config_i64.GasType());
    try std.testing.expectEqual(@as(comptime_int, std.math.maxInt(i64)), config_i64.maxGas());

    // Test edge case at i32 boundary
    const config_edge = GasManagerConfig{ .block_gas_limit = std.math.maxInt(i32) };
    comptime config_edge.validate();
    try std.testing.expectEqual(i32, config_edge.GasType());
}

test "GasManagerConfig validation" {
    // Test valid default configuration
    comptime DEFAULT_CONFIG.validate();
    try std.testing.expect(DEFAULT_CONFIG.block_gas_limit > 0);
    try std.testing.expect(DEFAULT_CONFIG.block_gas_limit <= std.math.maxInt(u64) / 2);

    // Test various configuration options
    const custom_config = GasManagerConfig{
        .block_gas_limit = 100_000_000,
        .enable_overflow_checks = false,
        .enable_branch_hints = false,
        .enable_gas_logging = true,
    };
    comptime custom_config.validate();
    try std.testing.expectEqual(i64, custom_config.GasType());
}

test "GasManagerConfig default values" {
    try std.testing.expectEqual(@as(u64, 30_000_000), DEFAULT_CONFIG.block_gas_limit);
    try std.testing.expectEqual(true, DEFAULT_CONFIG.enable_overflow_checks);
    try std.testing.expectEqual(true, DEFAULT_CONFIG.enable_branch_hints);
    try std.testing.expectEqual(false, DEFAULT_CONFIG.enable_gas_logging);
}