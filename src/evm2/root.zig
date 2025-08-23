const std = @import("std");

// Import main modules
pub const FrameConfig = @import("frame.zig").FrameConfig;
pub const createFrame = @import("frame.zig").createFrame;
pub const StackConfig = @import("stack.zig").StackConfig;
pub const createStack = @import("stack.zig").createStack;
pub const createAnalyzer = @import("analysis.zig").createAnalyzer;
pub const createAnalyzerCache = @import("analysis_cache.zig").createAnalyzerCache;
pub const Interpreter = @import("interpreter.zig").Interpreter;
pub const Dispatcher = @import("dispatcher.zig").Dispatcher;
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
    _ = createAnalyzer;
    _ = Interpreter;
    _ = Dispatcher;
    _ = Evm;
    _ = Tracer;
    _ = DetailedStructLog;
}
