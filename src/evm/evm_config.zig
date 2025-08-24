const std = @import("std");
const PlannerStrategy = @import("planner_strategy.zig").PlannerStrategy;
const frame_mod = @import("frame.zig");
const BlockInfoConfig = @import("block_info_config.zig").BlockInfoConfig;

pub const EvmConfig = struct {
    /// Maximum call depth allowed in the EVM (defaults to 1024 levels)
    /// This prevents infinite recursion and stack overflow attacks
    max_call_depth: u11 = 1024,

    /// Maximum input size for interpreter operations (128 KB)
    /// This prevents excessive memory usage in single operations
    max_input_size: u18 = 131072, // 128 KB

    /// Frame configuration parameters (enable database by default)
    frame_config: frame_mod.FrameConfig = .{ .has_database = true },

    /// Enable precompiled contracts support (default: true)
    /// When disabled, precompile calls will fail with an error
    enable_precompiles: bool = true,

    /// Planner strategy for bytecode analysis and optimization (default: minimal)
    /// Note: When compiling with -Doptimize=ReleaseSmall, this is always forced to .minimal
    /// regardless of the configured value to minimize binary size.
    planner_strategy: PlannerStrategy = .minimal,

    /// Block information configuration
    /// Controls the types used for difficulty and base_fee fields
    block_info_config: BlockInfoConfig = .{},

    /// Gets the appropriate type for depth based on max_call_depth
    pub fn get_depth_type(self: EvmConfig) type {
        return if (self.max_call_depth <= std.math.maxInt(u8))
            u8
        else if (self.max_call_depth <= std.math.maxInt(u11))
            u11
        else
            @compileError("max_call_depth too large");
    }
};