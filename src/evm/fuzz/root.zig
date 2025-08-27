//! EVM Fuzz Testing Module
//! 
//! This module provides fuzz testing infrastructure for the EVM implementation.
//! All fuzz tests use Zig's built-in fuzzer via std.testing.fuzzInput(.{})
//!
//! Note: Fuzz tests currently only work on macOS due to platform limitations.

const std = @import("std");

// Re-export fuzz test modules
pub const bytecode_fuzz = @import("bytecode_fuzz.zig");

// Run all fuzz tests
test {
    _ = bytecode_fuzz;
}