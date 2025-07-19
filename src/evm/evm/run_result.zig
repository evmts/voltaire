const ExecutionError = @import("../execution/execution_error.zig");

/// Result of an EVM execution run.
///
/// RunResult encapsulates the outcome of executing EVM bytecode, including
/// success/failure status, gas consumption, and any output data. This is
/// the primary return type for VM execution functions.
///
/// ## Design Rationale
/// The result combines multiple pieces of information needed after execution:
/// - Status indicates how execution ended (success, revert, error)
/// - Gas tracking for accounting and refunds
/// - Output data for return values or revert messages
/// - Optional error details for debugging
///
/// ## Status Types
/// - Success: Execution completed normally
/// - Revert: Explicit revert (REVERT opcode or require failure)
/// - Invalid: Invalid operation (bad opcode, stack error, etc.)
/// - OutOfGas: Execution ran out of gas
///
/// ## Usage
/// ```zig
/// const result = vm.run(bytecode, gas_limit);
/// switch (result.status) {
///     .Success => {
///         // Process output data
///         const return_data = result.output orelse &[_]u8{};
///     },
///     .Revert => {
///         // Handle revert with reason
///         const revert_reason = result.output orelse &[_]u8{};
///     },
///     .Invalid => {
///         // Handle error
///         std.log.err("Execution failed: {?}", .{result.err});
///     },
///     .OutOfGas => {
///         // Handle out of gas
///     },
/// }
/// ```
pub const RunResult = @This();

/// Execution completion status.
///
/// Indicates how the execution ended. This maps to EVM execution outcomes:
/// - Success: Normal completion (STOP, RETURN, or end of code)
/// - Revert: Explicit revert (REVERT opcode)
/// - Invalid: Execution error (invalid opcode, stack error, etc.)
/// - OutOfGas: Gas exhausted during execution
pub const Status = enum {
    /// Execution completed successfully
    Success,
    /// Execution was explicitly reverted
    Revert,
    /// Execution failed due to invalid operation
    Invalid,
    /// Execution ran out of gas
    OutOfGas,
};
status: Status,

/// Optional execution error details.
///
/// Present when status is Invalid, providing specific error information
/// for debugging and error reporting.
err: ?ExecutionError.Error,

/// Remaining gas after execution.
///
/// For successful execution, this is refunded to the caller.
/// For failed execution, this may be zero or partially consumed.
gas_left: u64,

/// Total gas consumed during execution.
///
/// Calculated as: initial_gas - gas_left
/// Used for:
/// - Transaction receipts
/// - Gas accounting
/// - Performance monitoring
gas_used: u64,

/// Output data from execution.
///
/// Contents depend on execution status:
/// - Success: Return data from RETURN opcode
/// - Revert: Revert reason from REVERT opcode
/// - Invalid/OutOfGas: Usually null
///
/// Note: Empty output is different from null output.
/// Empty means explicit empty return, null means no return.
output: ?[]const u8,

pub fn init(
    initial_gas: u64,
    gas_left: u64,
    status: Status,
    err: ?ExecutionError.Error,
    output: ?[]const u8,
) RunResult {
    return RunResult{
        .status = status,
        .err = err,
        .gas_left = gas_left,
        .gas_used = initial_gas - gas_left,
        .output = output,
    };
}

// Tests

const std = @import("std");
const testing = std.testing;

test "init creates RunResult with Success status" {
    const result = init(1000, 300, Status.Success, null, null);
    try testing.expectEqual(Status.Success, result.status);
    try testing.expectEqual(@as(?ExecutionError.Error, null), result.err);
    try testing.expectEqual(@as(u64, 300), result.gas_left);
    try testing.expectEqual(@as(u64, 700), result.gas_used);
    try testing.expectEqual(@as(?[]const u8, null), result.output);
}

test "init creates RunResult with Revert status and output data" {
    const revert_reason = "require failed";
    const result = init(2000, 500, Status.Revert, null, revert_reason);
    try testing.expectEqual(Status.Revert, result.status);
    try testing.expectEqual(@as(?ExecutionError.Error, null), result.err);
    try testing.expectEqual(@as(u64, 500), result.gas_left);
    try testing.expectEqual(@as(u64, 1500), result.gas_used);
    try testing.expectEqualStrings(revert_reason, result.output.?);
}

test "init creates RunResult with Invalid status and error" {
    const result = init(5000, 1000, Status.Invalid, ExecutionError.Error.StackUnderflow, null);
    try testing.expectEqual(Status.Invalid, result.status);
    try testing.expectEqual(ExecutionError.Error.StackUnderflow, result.err.?);
    try testing.expectEqual(@as(u64, 1000), result.gas_left);
    try testing.expectEqual(@as(u64, 4000), result.gas_used);
    try testing.expectEqual(@as(?[]const u8, null), result.output);
}

test "init creates RunResult with OutOfGas status" {
    const result = init(10000, 0, Status.OutOfGas, ExecutionError.Error.OutOfGas, null);
    try testing.expectEqual(Status.OutOfGas, result.status);
    try testing.expectEqual(ExecutionError.Error.OutOfGas, result.err.?);
    try testing.expectEqual(@as(u64, 0), result.gas_left);
    try testing.expectEqual(@as(u64, 10000), result.gas_used);
    try testing.expectEqual(@as(?[]const u8, null), result.output);
}

test "init calculates gas_used correctly when all gas consumed" {
    const result = init(1000, 0, Status.Success, null, null);
    try testing.expectEqual(@as(u64, 0), result.gas_left);
    try testing.expectEqual(@as(u64, 1000), result.gas_used);
}

test "init calculates gas_used correctly when no gas consumed" {
    const result = init(1000, 1000, Status.Success, null, null);
    try testing.expectEqual(@as(u64, 1000), result.gas_left);
    try testing.expectEqual(@as(u64, 0), result.gas_used);
}

test "init handles empty output data correctly" {
    const empty_data = "";
    const result = init(1500, 750, Status.Success, null, empty_data);
    try testing.expectEqual(Status.Success, result.status);
    try testing.expectEqual(@as(u64, 750), result.gas_left);
    try testing.expectEqual(@as(u64, 750), result.gas_used);
    try testing.expectEqualStrings("", result.output.?);
}

test "init handles maximum gas values" {
    const max_gas = std.math.maxInt(u64);
    const result = init(max_gas, max_gas / 2, Status.Success, null, null);
    try testing.expectEqual(@as(u64, max_gas / 2), result.gas_left);
    try testing.expectEqual(@as(u64, max_gas / 2), result.gas_used);
}

test "init handles zero gas scenario" {
    const result = init(0, 0, Status.OutOfGas, ExecutionError.Error.OutOfGas, null);
    try testing.expectEqual(Status.OutOfGas, result.status);
    try testing.expectEqual(@as(u64, 0), result.gas_left);
    try testing.expectEqual(@as(u64, 0), result.gas_used);
}

test "init preserves all provided parameters" {
    const output_data = "return data";
    const result = init(3000, 800, Status.Success, null, output_data);
    
    try testing.expectEqual(Status.Success, result.status);
    try testing.expectEqual(@as(?ExecutionError.Error, null), result.err);
    try testing.expectEqual(@as(u64, 800), result.gas_left);
    try testing.expectEqual(@as(u64, 2200), result.gas_used);
    try testing.expectEqualStrings(output_data, result.output.?);
}

test "init handles all Status variants correctly" {
    const statuses = [_]Status{ Status.Success, Status.Revert, Status.Invalid, Status.OutOfGas };
    
    for (statuses) |status| {
        const result = init(1000, 500, status, null, null);
        try testing.expectEqual(status, result.status);
        try testing.expectEqual(@as(u64, 500), result.gas_left);
        try testing.expectEqual(@as(u64, 500), result.gas_used);
    }
}

test "init handles various ExecutionError types" {
    const errors = [_]ExecutionError.Error{
        ExecutionError.Error.STOP,
        ExecutionError.Error.REVERT,
        ExecutionError.Error.InvalidOpcode,
        ExecutionError.Error.StackOverflow,
        ExecutionError.Error.OutOfGas,
        ExecutionError.Error.InvalidJump,
    };
    
    for (errors) |error_type| {
        const result = init(1000, 400, Status.Invalid, error_type, null);
        try testing.expectEqual(Status.Invalid, result.status);
        try testing.expectEqual(error_type, result.err.?);
        try testing.expectEqual(@as(u64, 400), result.gas_left);
        try testing.expectEqual(@as(u64, 600), result.gas_used);
    }
}

test "RunResult basic initialization" {
    const result = RunResult.init(1000, 200, .Success, null, null);
    
    try testing.expectEqual(Status.Success, result.status);
    try testing.expectEqual(@as(?ExecutionError.Error, null), result.err);
    try testing.expectEqual(@as(u64, 200), result.gas_left);
    try testing.expectEqual(@as(u64, 800), result.gas_used);
    try testing.expectEqual(@as(?[]const u8, null), result.output);
}

test "RunResult with output data" {
    const output_data = "Hello, World!";
    const result = RunResult.init(5000, 1000, .Revert, ExecutionError.Error.Revert, output_data);
    
    try testing.expectEqual(Status.Revert, result.status);
    try testing.expectEqual(@as(?ExecutionError.Error, ExecutionError.Error.Revert), result.err);
    try testing.expectEqual(@as(u64, 1000), result.gas_left);
    try testing.expectEqual(@as(u64, 4000), result.gas_used);
    try testing.expect(result.output != null);
    try testing.expectEqualStrings(output_data, result.output.?);
}

test "fuzz_run_result_gas_calculations" {
    var prng = std.Random.DefaultPrng.init(42);
    const random = prng.random();
    
    for (0..1000) |_| {
        const initial_gas = random.int(u64);
        const gas_left = random.intRangeAtMost(u64, 0, initial_gas);
        
        const result = RunResult.init(initial_gas, gas_left, .Success, null, null);
        
        // Verify gas calculation invariants
        try testing.expectEqual(gas_left, result.gas_left);
        try testing.expectEqual(initial_gas - gas_left, result.gas_used);
        try testing.expect(result.gas_used <= initial_gas);
    }
}

test "fuzz_run_result_gas_boundary_conditions" {
    const test_cases = [_]struct { initial: u64, left: u64 }{
        // Edge cases for gas calculations
        .{ .initial = 0, .left = 0 },                    // Zero gas
        .{ .initial = 1, .left = 0 },                    // Minimal gas usage
        .{ .initial = 1, .left = 1 },                    // No gas used
        .{ .initial = std.math.maxInt(u64), .left = 0 }, // Maximum gas usage
        .{ .initial = std.math.maxInt(u64), .left = std.math.maxInt(u64) }, // No gas used (max)
        .{ .initial = std.math.maxInt(u64), .left = 1 }, // Near-maximum gas usage
        .{ .initial = 21000, .left = 0 },               // Standard transaction gas limit
        .{ .initial = 30000000, .left = 0 },            // Block gas limit
    };
    
    for (test_cases) |case| {
        const result = RunResult.init(case.initial, case.left, .Success, null, null);
        
        // Verify gas calculations are correct
        try testing.expectEqual(case.left, result.gas_left);
        try testing.expectEqual(case.initial - case.left, result.gas_used);
        
        // Verify invariants
        try testing.expect(result.gas_used <= case.initial);
        try testing.expect(result.gas_left <= case.initial);
        try testing.expectEqual(case.initial, result.gas_left + result.gas_used);
    }
}

test "fuzz_run_result_all_status_combinations" {
    var prng = std.Random.DefaultPrng.init(123);
    const random = prng.random();
    
    const statuses = [_]Status{ .Success, .Revert, .Invalid, .OutOfGas };
    const errors = [_]?ExecutionError.Error{
        null,
        ExecutionError.Error.StackUnderflow,
        ExecutionError.Error.StackOverflow,
        ExecutionError.Error.InvalidOpcode,
        ExecutionError.Error.OutOfGas,
        ExecutionError.Error.Revert,
        ExecutionError.Error.JumpToInvalidDestination,
        ExecutionError.Error.InvalidJump,
    };
    
    for (0..500) |_| {
        const status = statuses[random.intRangeAtMost(usize, 0, statuses.len - 1)];
        const err = errors[random.intRangeAtMost(usize, 0, errors.len - 1)];
        const initial_gas = random.intRangeAtMost(u64, 0, 50000000);
        const gas_left = random.intRangeAtMost(u64, 0, initial_gas);
        
        // Create random output data (sometimes null)
        var output: ?[]const u8 = null;
        var allocated_data: ?[]u8 = null;
        defer if (allocated_data) |data| std.testing.allocator.free(data);
        
        if (random.boolean()) {
            const data_len = random.intRangeAtMost(usize, 0, 1000);
            allocated_data = try std.testing.allocator.alloc(u8, data_len);
            random.bytes(allocated_data.?);
            output = allocated_data.?;
        }
        
        const result = RunResult.init(initial_gas, gas_left, status, err, output);
        
        // Verify all fields are set correctly
        try testing.expectEqual(status, result.status);
        try testing.expectEqual(err, result.err);
        try testing.expectEqual(gas_left, result.gas_left);
        try testing.expectEqual(initial_gas - gas_left, result.gas_used);
        
        // Verify output handling
        if (output != null and output.?.len > 0) {
            try testing.expect(result.output != null);
            try testing.expectEqual(output.?.len, result.output.?.len);
        }
    }
}

test "fuzz_run_result_gas_overflow_edge_cases" {
    // Test potential overflow scenarios in gas calculations
    const test_cases = [_]struct { initial: u64, left: u64, should_pass: bool }{
        // Valid cases
        .{ .initial = 100, .left = 50, .should_pass = true },
        .{ .initial = std.math.maxInt(u64), .left = 0, .should_pass = true },
        .{ .initial = 0, .left = 0, .should_pass = true },
        
        // Edge cases that should still work due to Zig's overflow behavior
        .{ .initial = std.math.maxInt(u64) - 1, .left = std.math.maxInt(u64) - 2, .should_pass = true },
        .{ .initial = 1000000, .left = 999999, .should_pass = true },
    };
    
    for (test_cases) |case| {
        if (case.should_pass) {
            const result = RunResult.init(case.initial, case.left, .Success, null, null);
            
            // Basic sanity checks
            try testing.expectEqual(case.left, result.gas_left);
            try testing.expectEqual(case.initial - case.left, result.gas_used);
        }
    }
}

test "fuzz_run_result_output_data_variations" {
    var prng = std.Random.DefaultPrng.init(456);
    const random = prng.random();
    
    const allocator = std.testing.allocator;
    
    for (0..100) |_| {
        // Test various output data scenarios
        const scenario = random.intRangeAtMost(usize, 0, 4);
        var output: ?[]const u8 = null;
        var allocated_data: ?[]u8 = null;
        
        defer if (allocated_data) |data| allocator.free(data);
        
        switch (scenario) {
            0 => output = null, // No output
            1 => output = "", // Empty output
            2 => { // Small random output
                allocated_data = try allocator.alloc(u8, random.intRangeAtMost(usize, 1, 100));
                random.bytes(allocated_data.?);
                output = allocated_data.?;
            },
            3 => { // Large output
                allocated_data = try allocator.alloc(u8, random.intRangeAtMost(usize, 1000, 5000));
                random.bytes(allocated_data.?);
                output = allocated_data.?;
            },
            4 => { // Specific patterns
                const patterns = [_][]const u8{
                    "Error: insufficient balance",
                    "require(false)",
                    "\x08\xc3\x79\xa0", // Error(string) selector
                    "0x", // Hex prefix
                    std.mem.zeroes([32]u8)[0..], // Zero bytes
                };
                output = patterns[random.intRangeAtMost(usize, 0, patterns.len - 1)];
            },
            else => unreachable,
        }
        
        const initial_gas = random.intRangeAtMost(u64, 0, 1000000);
        const gas_left = random.intRangeAtMost(u64, 0, initial_gas);
        const status_array = [_]Status{ .Success, .Revert, .Invalid, .OutOfGas };
        const status = status_array[random.intRangeAtMost(usize, 0, 3)];
        
        const result = RunResult.init(initial_gas, gas_left, status, null, output);
        
        // Verify output is preserved correctly
        if (output == null) {
            try testing.expectEqual(@as(?[]const u8, null), result.output);
        } else {
            try testing.expect(result.output != null);
            if (output.?.len > 0) {
                try testing.expectEqualStrings(output.?, result.output.?);
            }
        }
        
        // Verify gas calculations remain correct regardless of output
        try testing.expectEqual(gas_left, result.gas_left);
        try testing.expectEqual(initial_gas - gas_left, result.gas_used);
    }
}

test "fuzz_run_result_status_error_consistency" {
    var prng = std.Random.DefaultPrng.init(789);
    const random = prng.random();
    
    for (0..200) |_| {
        const status_array = [_]Status{ .Success, .Revert, .Invalid, .OutOfGas };
        const status = status_array[random.intRangeAtMost(usize, 0, 3)];
        const initial_gas = random.intRangeAtMost(u64, 0, 100000);
        const gas_left = random.intRangeAtMost(u64, 0, initial_gas);
        
        // Generate appropriate error for status
        var err: ?ExecutionError.Error = null;
        switch (status) {
            .Success => err = null, // Success should have no error
            .Revert => err = ExecutionError.Error.Revert,
            .Invalid => {
                const invalid_errors = [_]ExecutionError.Error{
                    ExecutionError.Error.StackUnderflow,
                    ExecutionError.Error.StackOverflow,
                    ExecutionError.Error.InvalidOpcode,
                    ExecutionError.Error.JumpToInvalidDestination,
                    ExecutionError.Error.InvalidJump,
                };
                err = invalid_errors[random.intRangeAtMost(usize, 0, invalid_errors.len - 1)];
            },
            .OutOfGas => err = ExecutionError.Error.OutOfGas,
        }
        
        const result = RunResult.init(initial_gas, gas_left, status, err, null);
        
        // Verify status and error consistency
        try testing.expectEqual(status, result.status);
        try testing.expectEqual(err, result.err);
        
        // Verify specific consistency rules
        switch (result.status) {
            .Success => try testing.expectEqual(@as(?ExecutionError.Error, null), result.err),
            .Revert => try testing.expectEqual(@as(?ExecutionError.Error, ExecutionError.Error.Revert), result.err),
            .Invalid => try testing.expect(result.err != null and result.err != ExecutionError.Error.OutOfGas),
            .OutOfGas => try testing.expectEqual(@as(?ExecutionError.Error, ExecutionError.Error.OutOfGas), result.err),
        }
    }
}
    }
}
