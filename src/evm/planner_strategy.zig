/// Strategy for EVM bytecode planning and optimization
pub const PlannerStrategy = enum {
    /// Minimal planner with basic bytecode analysis
    minimal,
    /// Advanced planner with comprehensive optimizations
    advanced,
};