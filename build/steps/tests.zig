const std = @import("std");

// Test configuration structures
pub const TestInfo = struct {
    name: []const u8,
    source_file: []const u8,
    step_name: ?[]const u8 = null,
    step_desc: ?[]const u8 = null,
};

// Fuzz test configurations
// Note: Only includes working fuzz tests to prevent build failures
pub const fuzz_tests = [_]TestInfo{
    .{
        .name = "fuzz-evm-bytecode-test",
        .source_file = "src/evm/fuzz/root.zig",
        .step_name = "fuzz-evm-bytecode",
        .step_desc = "Run EVM bytecode analysis fuzz tests",
    },
};