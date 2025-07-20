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
