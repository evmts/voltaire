const std = @import("std");

pub const OptimizeStrategy = enum {
    fast,    // Maximum performance
    small,   // Minimum binary size
    safe,    // Default balanced approach
};

pub const BuildOptions = struct {
    no_precompiles: bool,
    force_bn254: bool,
    no_bn254: bool,
    enable_tracing: bool,
    disable_tailcall_dispatch: bool,
    // EVM configuration options
    optimize_strategy: OptimizeStrategy,
    max_call_depth: u11,
    stack_size: u12,
    max_bytecode_size: u32,
    max_initcode_size: u32,
    block_gas_limit: u64,
    memory_initial_capacity: usize,
    memory_limit: u64,
    arena_capacity_limit: usize,
    enable_fusion: bool,
    hardfork: []const u8,
    // Testing/debugging options
    disable_gas_checks: bool,
    disable_balance_checks: bool,
    disable_fusion: bool,
};

pub fn createBuildOptions(b: *std.Build, target: std.Build.ResolvedTarget) struct {
    options: BuildOptions,
    options_mod: *std.Build.Module,
} {
    const no_precompiles = b.option(bool, "no_precompiles", "Disable all EVM precompiles for minimal build") orelse false;
    const force_bn254 = b.option(bool, "force_bn254", "Force BN254 even on Ubuntu") orelse false;
    const is_ubuntu_native = target.result.os.tag == .linux and target.result.cpu.arch == .x86_64 and !force_bn254;
    // Always build BN254 library - dead code elimination will remove unused symbols
    const no_bn254 = is_ubuntu_native;

    const build_options = b.addOptions();
    build_options.addOption(bool, "no_precompiles", no_precompiles);
    build_options.addOption(bool, "no_bn254", no_bn254);
    
    const enable_tracing = b.option(bool, "enable-tracing", "Enable EVM instruction tracing (compile-time)") orelse false;
    build_options.addOption(bool, "enable_tracing", enable_tracing);
    
    const disable_tailcall_dispatch = b.option(bool, "disable-tailcall-dispatch", "Disable tailcall-based interpreter dispatch (use switch instead)") orelse true;
    build_options.addOption(bool, "disable_tailcall_dispatch", disable_tailcall_dispatch);

    // EVM optimization strategy
    const optimize_strategy_str = b.option([]const u8, "evm-optimize", "EVM optimization strategy: fast, small, or safe (default: safe)") orelse "safe";
    const optimize_strategy = std.meta.stringToEnum(OptimizeStrategy, optimize_strategy_str) orelse .safe;
    build_options.addOption([]const u8, "optimize_strategy", optimize_strategy_str);
    
    // EVM configuration options
    const max_call_depth = b.option(u11, "evm-max-call-depth", "Maximum EVM call depth (default: 1024)") orelse 1024;
    build_options.addOption(u11, "max_call_depth", max_call_depth);
    
    const stack_size = b.option(u12, "evm-stack-size", "EVM stack size (default: 1024)") orelse 1024;
    build_options.addOption(u12, "stack_size", stack_size);
    
    const max_bytecode_size = b.option(u32, "evm-max-bytecode", "Maximum bytecode size in bytes (default: 24576)") orelse 24576;
    build_options.addOption(u32, "max_bytecode_size", max_bytecode_size);
    
    const max_initcode_size = b.option(u32, "evm-max-initcode", "Maximum initcode size in bytes (default: 49152)") orelse 49152;
    build_options.addOption(u32, "max_initcode_size", max_initcode_size);
    
    const block_gas_limit = b.option(u64, "evm-block-gas-limit", "Block gas limit (default: 30000000)") orelse 30_000_000;
    build_options.addOption(u64, "block_gas_limit", block_gas_limit);
    
    const memory_initial_capacity = b.option(usize, "evm-memory-init", "Initial memory capacity in bytes (default: 4096)") orelse 4096;
    build_options.addOption(usize, "memory_initial_capacity", memory_initial_capacity);
    
    const memory_limit = b.option(u64, "evm-memory-limit", "Memory limit in bytes (default: 16777215)") orelse 0xFFFFFF;
    build_options.addOption(u64, "memory_limit", memory_limit);
    
    const arena_capacity_limit = b.option(usize, "evm-arena-capacity", "Arena allocator capacity in bytes (default: 67108864)") orelse (64 * 1024 * 1024);
    build_options.addOption(usize, "arena_capacity_limit", arena_capacity_limit);
    
    const enable_fusion = b.option(bool, "evm-enable-fusion", "Enable bytecode fusion optimizations (default: true)") orelse true;
    build_options.addOption(bool, "enable_fusion", enable_fusion);
    
    const hardfork = b.option([]const u8, "evm-hardfork", "EVM hardfork: FRONTIER, HOMESTEAD, BYZANTIUM, BERLIN, LONDON, SHANGHAI, CANCUN (default: CANCUN)") orelse "CANCUN";
    build_options.addOption([]const u8, "hardfork", hardfork);
    
    // Testing/debugging options
    const disable_gas_checks = b.option(bool, "evm-disable-gas", "Disable gas checks for testing (WARNING: Never use in production)") orelse false;
    build_options.addOption(bool, "disable_gas_checks", disable_gas_checks);
    
    const disable_balance_checks = b.option(bool, "evm-disable-balance", "Disable balance checks for testing (WARNING: Never use in production)") orelse false;
    build_options.addOption(bool, "disable_balance_checks", disable_balance_checks);
    
    const disable_fusion = b.option(bool, "evm-disable-fusion", "Disable bytecode fusion optimizations for debugging") orelse false;
    build_options.addOption(bool, "disable_fusion", disable_fusion);

    return .{
        .options = BuildOptions{
            .no_precompiles = no_precompiles,
            .force_bn254 = force_bn254,
            .no_bn254 = no_bn254,
            .enable_tracing = enable_tracing,
            .disable_tailcall_dispatch = disable_tailcall_dispatch,
            .optimize_strategy = optimize_strategy,
            .max_call_depth = max_call_depth,
            .stack_size = stack_size,
            .max_bytecode_size = max_bytecode_size,
            .max_initcode_size = max_initcode_size,
            .block_gas_limit = block_gas_limit,
            .memory_initial_capacity = memory_initial_capacity,
            .memory_limit = memory_limit,
            .arena_capacity_limit = arena_capacity_limit,
            .enable_fusion = enable_fusion,
            .hardfork = hardfork,
            .disable_gas_checks = disable_gas_checks,
            .disable_balance_checks = disable_balance_checks,
            .disable_fusion = disable_fusion,
        },
        .options_mod = build_options.createModule(),
    };
}

pub fn getRustTarget(target: std.Build.ResolvedTarget) ?[]const u8 {
    return switch (target.result.os.tag) {
        .linux => switch (target.result.cpu.arch) {
            .x86_64 => "x86_64-unknown-linux-gnu",
            .aarch64 => "aarch64-unknown-linux-gnu",
            else => null,
        },
        .macos => switch (target.result.cpu.arch) {
            .x86_64 => "x86_64-apple-darwin",
            .aarch64 => "aarch64-apple-darwin",
            else => null,
        },
        else => null,
    };
}