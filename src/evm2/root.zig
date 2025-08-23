const std = @import("std");

// Import main modules
pub const FrameConfig = @import("frame_config.zig").FrameConfig;
pub const createFrame = @import("frame.zig").createFrame;
pub const StackConfig = @import("stack_config.zig").StackConfig;
pub const createStack = @import("stack.zig").createStack;
pub const MemoryConfig = @import("memory_config.zig").MemoryConfig;
pub const createPlanner = @import("planner.zig").createPlanner;
pub const PlannerConfig = @import("planner_config.zig").PlannerConfig;
pub const createPlan = @import("plan.zig").createPlan;
pub const PlanConfig = @import("plan_config.zig").PlanConfig;
// pub const Interpreter = @import("interpreter.zig").Interpreter; // TODO: Add when interpreter.zig is created
pub const Evm = @import("evm.zig").Evm;
pub const Tracer = @import("tracer.zig").Tracer;
pub const DetailedStructLog = @import("tracer.zig").DetailedStructLog;
pub const TracerConfig = @import("tracer.zig").TracerConfig;
pub const MemoryCaptureMode = @import("tracer.zig").MemoryCaptureMode;
pub const LoggingTracer = @import("tracer.zig").LoggingTracer;
pub const FileTracer = @import("tracer.zig").FileTracer;
pub const NoOpTracer = @import("tracer.zig").NoOpTracer;
pub const DebuggingTracer = @import("tracer.zig").DebuggingTracer;

// Export opcode data
pub const opcode_data = @import("opcode_data.zig");

// Run all tests
test {
    // Test main modules
    _ = FrameConfig;
    _ = createFrame;
    _ = StackConfig;
    _ = createStack;
    _ = createPlanner;
    // _ = Interpreter;
    _ = Evm;
    _ = Tracer;
    _ = DetailedStructLog;
}
