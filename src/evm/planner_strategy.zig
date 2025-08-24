const std = @import("std");

/// Strategy for EVM bytecode planning and optimization
pub const PlannerStrategy = enum {
    /// Minimal planner with basic bytecode analysis
    minimal,
    /// Advanced planner with comprehensive optimizations
    advanced,
};

test "PlannerStrategy enum values" {
    try std.testing.expectEqual(PlannerStrategy.minimal, .minimal);
    try std.testing.expectEqual(PlannerStrategy.advanced, .advanced);
}

test "PlannerStrategy ordinal values" {
    try std.testing.expectEqual(@intFromEnum(PlannerStrategy.minimal), 0);
    try std.testing.expectEqual(@intFromEnum(PlannerStrategy.advanced), 1);
}

test "PlannerStrategy from ordinal" {
    try std.testing.expectEqual(@as(PlannerStrategy, @enumFromInt(0)), .minimal);
    try std.testing.expectEqual(@as(PlannerStrategy, @enumFromInt(1)), .advanced);
}