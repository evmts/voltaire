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

// ============================================================================
// Fuzz Tests for Gas Calculation Edge Cases and Overflow Scenarios (Issue #234)
// ============================================================================

test "fuzz_gas_calculation_boundary_conditions" {
    var prng = std.Random.DefaultPrng.init(0);
    const random = prng.random();
    
    for (0..1000) |_| {
        const initial_gas = random.int(u64);
        const gas_consumed = random.intRangeAtMost(u64, 0, initial_gas);
        const gas_left = initial_gas - gas_consumed;
        
        const status_variants = [_]Status{ Status.Success, Status.Revert, Status.Invalid, Status.OutOfGas };
        const status = status_variants[random.intRangeLessThan(usize, 0, status_variants.len)];
        
        const result = init(initial_gas, gas_left, status, null, null);
        
        try testing.expectEqual(initial_gas, result.gas_left + result.gas_used);
        try testing.expectEqual(gas_left, result.gas_left);
        try testing.expectEqual(gas_consumed, result.gas_used);
        try testing.expectEqual(status, result.status);
    }
}

test "fuzz_gas_limit_boundary_testing" {
    var prng = std.Random.DefaultPrng.init(42);
    const random = prng.random();
    
    const boundary_values = [_]u64{
        0,
        1,
        255,
        256,
        65535,
        65536,
        21000,
        100000,
        1000000,
        10000000,
        std.math.maxInt(u32),
        std.math.maxInt(u32) + 1,
        std.math.maxInt(u64) - 1,
        std.math.maxInt(u64),
    };
    
    for (0..500) |_| {
        const boundary_idx = random.intRangeLessThan(usize, 0, boundary_values.len);
        const initial_gas = boundary_values[boundary_idx];
        
        const gas_consumption_percent = random.intRangeAtMost(u8, 0, 100);
        const gas_consumed = (initial_gas * gas_consumption_percent) / 100;
        const gas_left = initial_gas - gas_consumed;
        
        const status = if (gas_consumed >= initial_gas) Status.OutOfGas else Status.Success;
        
        const result = init(initial_gas, gas_left, status, null, null);
        
        try testing.expect(result.gas_left <= initial_gas);
        try testing.expect(result.gas_used <= initial_gas);
        try testing.expect(result.gas_left + result.gas_used == initial_gas);
        
        if (status == Status.OutOfGas) {
            try testing.expect(result.gas_left == 0 or result.gas_used == initial_gas);
        }
    }
}

test "fuzz_gas_cost_accumulation_overflow_scenarios" {
    var prng = std.Random.DefaultPrng.init(123);
    const random = prng.random();
    
    for (0..300) |_| {
        const max_safe_gas = std.math.maxInt(u64) - 10000;
        const initial_gas = random.intRangeAtMost(u64, max_safe_gas, std.math.maxInt(u64));
        
        const gas_left = random.intRangeAtMost(u64, 0, initial_gas);
        const expected_gas_used = initial_gas - gas_left;
        
        const result = init(initial_gas, gas_left, Status.Success, null, null);
        
        try testing.expectEqual(gas_left, result.gas_left);
        try testing.expectEqual(expected_gas_used, result.gas_used);
        
        const overflow_test = result.gas_left +| result.gas_used;
        try testing.expectEqual(initial_gas, overflow_test);
        
        try testing.expect(result.gas_left <= initial_gas);
        try testing.expect(result.gas_used <= initial_gas);
    }
}

test "fuzz_invalid_gas_values_in_transaction_contexts" {
    var prng = std.Random.DefaultPrng.init(456);
    const random = prng.random();
    
    const invalid_scenarios = [_]struct {
        description: []const u8,
        generator: fn (std.Random) struct { initial: u64, left: u64, valid: bool },
    }{
        .{
            .description = "gas_left > initial_gas",
            .generator = struct {
                fn generate(rnd: std.Random) struct { initial: u64, left: u64, valid: bool } {
                    const initial = rnd.intRangeAtMost(u64, 0, std.math.maxInt(u64) / 2);
                    const left = initial + rnd.intRangeAtMost(u64, 1, 1000);
                    return .{ .initial = initial, .left = left, .valid = false };
                }
            }.generate,
        },
        .{
            .description = "zero initial gas with non-zero left",
            .generator = struct {
                fn generate(rnd: std.Random) struct { initial: u64, left: u64, valid: bool } {
                    const initial: u64 = 0;
                    const left = rnd.intRangeAtMost(u64, 1, 1000);
                    return .{ .initial = initial, .left = left, .valid = false };
                }
            }.generate,
        },
        .{
            .description = "valid gas scenarios",
            .generator = struct {
                fn generate(rnd: std.Random) struct { initial: u64, left: u64, valid: bool } {
                    const initial = rnd.intRangeAtMost(u64, 1, 1000000);
                    const left = rnd.intRangeAtMost(u64, 0, initial);
                    return .{ .initial = initial, .left = left, .valid = true };
                }
            }.generate,
        },
    };
    
    for (0..200) |_| {
        for (invalid_scenarios) |scenario| {
            const gas_data = scenario.generator(random);
            
            const result = init(gas_data.initial, gas_data.left, Status.Success, null, null);
            
            if (gas_data.valid) {
                try testing.expectEqual(gas_data.left, result.gas_left);
                try testing.expect(result.gas_used == gas_data.initial - gas_data.left);
                try testing.expect(result.gas_left + result.gas_used == gas_data.initial);
            } else {
                if (gas_data.left > gas_data.initial) {
                    const underflow_result = gas_data.initial -% gas_data.left;
                    try testing.expectEqual(underflow_result, result.gas_used);
                }
            }
        }
    }
}

test "fuzz_status_error_consistency_validation" {
    var prng = std.Random.DefaultPrng.init(789);
    const random = prng.random();
    
    const test_cases = [_]struct {
        status: Status,
        should_have_error: bool,
        valid_errors: []const ExecutionError.Error,
    }{
        .{
            .status = Status.Success,
            .should_have_error = false,
            .valid_errors = &[_]ExecutionError.Error{},
        },
        .{
            .status = Status.Revert,
            .should_have_error = false,
            .valid_errors = &[_]ExecutionError.Error{ExecutionError.Error.REVERT},
        },
        .{
            .status = Status.Invalid,
            .should_have_error = true,
            .valid_errors = &[_]ExecutionError.Error{
                ExecutionError.Error.InvalidOpcode,
                ExecutionError.Error.StackOverflow,
                ExecutionError.Error.StackUnderflow,
                ExecutionError.Error.InvalidJump,
                ExecutionError.Error.StaticStateChange,
                ExecutionError.Error.WriteProtection,
            },
        },
        .{
            .status = Status.OutOfGas,
            .should_have_error = true,
            .valid_errors = &[_]ExecutionError.Error{ExecutionError.Error.OutOfGas},
        },
    };
    
    for (0..400) |_| {
        const test_case = test_cases[random.intRangeLessThan(usize, 0, test_cases.len)];
        
        const initial_gas = random.intRangeAtMost(u64, 1000, 1000000);
        const gas_left = random.intRangeAtMost(u64, 0, initial_gas);
        
        const error_to_use = if (test_case.valid_errors.len > 0)
            test_case.valid_errors[random.intRangeLessThan(usize, 0, test_case.valid_errors.len)]
        else
            null;
        
        const result = init(initial_gas, gas_left, test_case.status, error_to_use, null);
        
        try testing.expectEqual(test_case.status, result.status);
        try testing.expectEqual(gas_left, result.gas_left);
        try testing.expectEqual(initial_gas - gas_left, result.gas_used);
        
        if (test_case.should_have_error and error_to_use != null) {
            try testing.expect(result.err != null);
            try testing.expectEqual(error_to_use.?, result.err.?);
        } else if (!test_case.should_have_error) {
            if (error_to_use == null) {
                try testing.expect(result.err == null);
            }
        }
    }
}

test "fuzz_output_data_variations_with_gas_tracking" {
    var prng = std.Random.DefaultPrng.init(101112);
    const random = prng.random();
    
    const output_scenarios = [_]?[]const u8{
        null,
        "",
        "0x",
        "revert reason",
        "Error: insufficient funds",
        "very long error message that exceeds typical buffer sizes and includes special characters !@#$%^&*()",
        &([_]u8{0xFF} ** 1024),
        &([_]u8{0x00} ** 256),
        "ABI encoded data with multiple parameters",
        "Short",
        "0x1234567890abcdef",
    };
    
    for (0..300) |_| {
        const initial_gas = random.intRangeAtMost(u64, 21000, 10000000);
        const gas_consumed = random.intRangeAtMost(u64, 0, initial_gas);
        const gas_left = initial_gas - gas_consumed;
        
        const status_variants = [_]Status{ Status.Success, Status.Revert, Status.Invalid, Status.OutOfGas };
        const status = status_variants[random.intRangeLessThan(usize, 0, status_variants.len)];
        
        const output = output_scenarios[random.intRangeLessThan(usize, 0, output_scenarios.len)];
        
        const result = init(initial_gas, gas_left, status, null, output);
        
        try testing.expectEqual(status, result.status);
        try testing.expectEqual(gas_left, result.gas_left);
        try testing.expectEqual(gas_consumed, result.gas_used);
        
        if (output) |expected_output| {
            if (result.output) |actual_output| {
                try testing.expectEqualStrings(expected_output, actual_output);
            } else {
                return testing.expect(false);
            }
        } else {
            try testing.expect(result.output == null);
        }
        
        try testing.expect(result.gas_left <= initial_gas);
        try testing.expect(result.gas_used <= initial_gas);
    }
}

test "fuzz_random_gas_boundary_property_validation" {
    var prng = std.Random.DefaultPrng.init(131415);
    const random = prng.random();
    
    const iterations = 1000;
    var valid_results: u32 = 0;
    var boundary_violations: u32 = 0;
    var overflow_cases: u32 = 0;
    
    for (0..iterations) |_| {
        const initial_gas = random.int(u64);
        const gas_left = if (initial_gas > 0) random.intRangeAtMost(u64, 0, initial_gas) else 0;
        
        const status_variants = [_]Status{ Status.Success, Status.Revert, Status.Invalid, Status.OutOfGas };
        const status = status_variants[random.intRangeLessThan(usize, 0, status_variants.len)];
        
        const result = init(initial_gas, gas_left, status, null, null);
        
        const gas_calculation_valid = result.gas_left + result.gas_used == initial_gas;
        const gas_left_valid = result.gas_left <= initial_gas;
        const gas_used_valid = result.gas_used <= initial_gas;
        
        if (gas_calculation_valid and gas_left_valid and gas_used_valid) {
            valid_results += 1;
        } else {
            if (!gas_left_valid or !gas_used_valid) {
                boundary_violations += 1;
            }
            if (!gas_calculation_valid) {
                overflow_cases += 1;
            }
        }
        
        try testing.expectEqual(gas_left, result.gas_left);
        try testing.expectEqual(initial_gas - gas_left, result.gas_used);
        try testing.expectEqual(status, result.status);
    }
    
    const success_rate = (valid_results * 100) / iterations;
    try testing.expect(success_rate >= 95);
    try testing.expect(boundary_violations <= iterations / 20);
}

test "fuzz_extreme_gas_scenarios_stress_testing" {
    var prng = std.Random.DefaultPrng.init(161718);
    const random = prng.random();
    
    const extreme_scenarios = [_]struct {
        name: []const u8,
        initial_gas: u64,
        gas_left_generator: fn (u64, std.Random) u64,
    }{
        .{
            .name = "maximum gas values",
            .initial_gas = std.math.maxInt(u64),
            .gas_left_generator = struct {
                fn generate(initial: u64, rnd: std.Random) u64 {
                    return rnd.intRangeAtMost(u64, initial / 2, initial);
                }
            }.generate,
        },
        .{
            .name = "minimum gas values",
            .initial_gas = 1,
            .gas_left_generator = struct {
                fn generate(initial: u64, _: std.Random) u64 {
                    return if (initial > 0) 0 else 0;
                }
            }.generate,
        },
        .{
            .name = "block gas limit scenarios",
            .initial_gas = 30000000,
            .gas_left_generator = struct {
                fn generate(initial: u64, rnd: std.Random) u64 {
                    return rnd.intRangeAtMost(u64, 0, initial);
                }
            }.generate,
        },
        .{
            .name = "transaction gas limit scenarios",
            .initial_gas = 21000,
            .gas_left_generator = struct {
                fn generate(initial: u64, rnd: std.Random) u64 {
                    return rnd.intRangeAtMost(u64, 0, initial);
                }
            }.generate,
        },
    };
    
    for (extreme_scenarios) |scenario| {
        for (0..100) |_| {
            const initial_gas = scenario.initial_gas;
            const gas_left = scenario.gas_left_generator(initial_gas, random);
            
            const status_variants = [_]Status{ Status.Success, Status.Revert, Status.Invalid, Status.OutOfGas };
            const status = status_variants[random.intRangeLessThan(usize, 0, status_variants.len)];
            
            const result = init(initial_gas, gas_left, status, null, null);
            
            try testing.expectEqual(initial_gas, result.gas_left + result.gas_used);
            try testing.expectEqual(gas_left, result.gas_left);
            try testing.expectEqual(initial_gas - gas_left, result.gas_used);
            try testing.expectEqual(status, result.status);
            
            try testing.expect(result.gas_left <= initial_gas);
            try testing.expect(result.gas_used <= initial_gas);
            
            if (status == Status.OutOfGas) {
                try testing.expect(gas_left <= initial_gas / 10);
            }
        }
    }
}
