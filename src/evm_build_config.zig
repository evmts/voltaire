//! Build-time EVM configuration generator
//! This module generates an EvmConfig based on build options

const std = @import("std");
const build_options = @import("build_options");
const EvmConfig = @import("evm_config.zig").EvmConfig;
const Eips = @import("eips_and_hardforks/eips.zig").Eips;
const Hardfork = @import("eips_and_hardforks/hardfork.zig").Hardfork;

/// Get the hardfork enum from the build option string
fn getHardfork() Hardfork {
    const hardfork_str = build_options.hardfork;
    
    if (std.mem.eql(u8, hardfork_str, "FRONTIER")) return .FRONTIER;
    if (std.mem.eql(u8, hardfork_str, "HOMESTEAD")) return .HOMESTEAD;
    if (std.mem.eql(u8, hardfork_str, "BYZANTIUM")) return .BYZANTIUM;
    if (std.mem.eql(u8, hardfork_str, "ISTANBUL")) return .ISTANBUL;
    if (std.mem.eql(u8, hardfork_str, "BERLIN")) return .BERLIN;
    if (std.mem.eql(u8, hardfork_str, "LONDON")) return .LONDON;
    if (std.mem.eql(u8, hardfork_str, "SHANGHAI")) return .SHANGHAI;
    if (std.mem.eql(u8, hardfork_str, "CANCUN")) return .CANCUN;
    
    // Default to CANCUN if unknown
    return .CANCUN;
}

/// Generate the EVM configuration based on build options
pub fn getBuildConfig() EvmConfig {
    const optimize_str = build_options.optimize_strategy;
    
    // Base configuration from optimization strategy
    var config = if (std.mem.eql(u8, optimize_str, "fast"))
        EvmConfig.optimizeFast()
    else if (std.mem.eql(u8, optimize_str, "small"))
        EvmConfig.optimizeSmall()
    else
        EvmConfig{}; // safe/default
    
    // Apply build options
    config.eips = Eips{ .hardfork = getHardfork() };
    config.max_call_depth = build_options.max_call_depth;
    config.stack_size = build_options.stack_size;
    config.max_bytecode_size = build_options.max_bytecode_size;
    config.max_initcode_size = build_options.max_initcode_size;
    config.block_gas_limit = build_options.block_gas_limit;
    config.memory_initial_capacity = build_options.memory_initial_capacity;
    config.memory_limit = build_options.memory_limit;
    config.arena_capacity_limit = build_options.arena_capacity_limit;
    config.enable_fusion = build_options.enable_fusion and !build_options.disable_fusion;
    config.enable_precompiles = !build_options.no_precompiles;
    config.disable_gas_checks = build_options.disable_gas_checks;
    config.disable_balance_checks = build_options.disable_balance_checks;
    config.disable_fusion = build_options.disable_fusion;
    
    // Set tracer if enabled
    if (build_options.enable_tracing) {
        // For now, we'll leave TracerType as null since it requires more complex setup
        // Users can still set up their own tracer through the configuration
        config.TracerType = null;
    }
    
    return config;
}

/// The build-configured EVM type
pub const BuildConfiguredEvm = @import("evm.zig").Evm(getBuildConfig());