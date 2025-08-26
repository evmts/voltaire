const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

/// Success types for EVM execution
pub const Success = enum {
    Stop,
    Return,
    SelfDestruct,
};

/// Error types for EVM execution
pub const Error = error{
    InvalidJump,
    OutOfGas,
    StackUnderflow,
    StackOverflow,
    ContractNotFound,
    PrecompileError,
    MemoryError,
    StorageError,
    CallDepthExceeded,
    InsufficientBalance,
    ContractCollision,
    InvalidBytecode,
    StaticCallViolation,
    InvalidOpcode,
    RevertExecution,
    OutOfMemory,
};

/// Log entry structure for EVM events
pub const Log = struct {
    address: Address,
    topics: []const u256,
    data: []const u8,
};

/// Tagged union for call results
pub const CallResult = union(enum) {
    success: SuccessResult,
    revert: RevertResult,
    failure: FailureResult,

    pub const SuccessResult = struct {
        reason: Success,
        gas_left: u64,
        output: []const u8,
        logs: []const Log,
    };

    pub const RevertResult = struct {
        gas_left: u64,
        output: []const u8,
    };

    pub const FailureResult = struct {
        reason: Error,
        gas_left: u64,
    };

    /// Create a successful stop result
    pub fn success_stop(gas_left: u64) CallResult {
        return .{ .success = .{
            .reason = .Stop,
            .gas_left = gas_left,
            .output = &[_]u8{},
            .logs = &.{},
        } };
    }

    /// Create a successful return result
    pub fn success_return(gas_left: u64, output: []const u8) CallResult {
        return .{ .success = .{
            .reason = .Return,
            .gas_left = gas_left,
            .output = output,
            .logs = &.{},
        } };
    }

    /// Create a successful self-destruct result
    pub fn success_selfdestruct(gas_left: u64) CallResult {
        return .{ .success = .{
            .reason = .SelfDestruct,
            .gas_left = gas_left,
            .output = &[_]u8{},
            .logs = &.{},
        } };
    }

    /// Create a successful result with logs
    pub fn success_with_logs(reason: Success, gas_left: u64, output: []const u8, logs: []const Log) CallResult {
        return .{ .success = .{
            .reason = reason,
            .gas_left = gas_left,
            .output = output,
            .logs = logs,
        } };
    }

    /// Create a revert result
    pub fn revert(gas_left: u64, output: []const u8) CallResult {
        return .{ .revert = .{
            .gas_left = gas_left,
            .output = output,
        } };
    }

    /// Create a failure result
    pub fn failure(reason: Error, gas_left: u64) CallResult {
        return .{ .failure = .{
            .reason = reason,
            .gas_left = gas_left,
        } };
    }

    /// Check if the result is a success
    pub fn is_success(self: CallResult) bool {
        return switch (self) {
            .success => true,
            .revert, .failure => false,
        };
    }

    /// Check if the result is a revert
    pub fn is_revert(self: CallResult) bool {
        return switch (self) {
            .revert => true,
            .success, .failure => false,
        };
    }

    /// Check if the result is a failure
    pub fn is_failure(self: CallResult) bool {
        return switch (self) {
            .failure => true,
            .success, .revert => false,
        };
    }

    /// Get gas left from any result type
    pub fn gas_left(self: CallResult) u64 {
        return switch (self) {
            .success => |s| s.gas_left,
            .revert => |r| r.gas_left,
            .failure => |f| f.gas_left,
        };
    }

    /// Get output data if available
    pub fn output(self: CallResult) ?[]const u8 {
        return switch (self) {
            .success => |s| if (s.output.len > 0) s.output else null,
            .revert => |r| if (r.output.len > 0) r.output else null,
            .failure => null,
        };
    }

    /// Get logs if this is a success
    pub fn logs(self: CallResult) ?[]const Log {
        return switch (self) {
            .success => |s| if (s.logs.len > 0) s.logs else null,
            .revert, .failure => null,
        };
    }

    /// Calculate gas consumed
    pub fn gas_consumed(self: CallResult, original_gas: u64) u64 {
        const left = self.gas_left();
        if (left > original_gas) return 0;
        return original_gas - left;
    }

    /// Get success reason if this is a success
    pub fn success_reason(self: CallResult) ?Success {
        return switch (self) {
            .success => |s| s.reason,
            .revert, .failure => null,
        };
    }

    /// Get error reason if this is a failure
    pub fn failure_reason(self: CallResult) ?Error {
        return switch (self) {
            .failure => |f| f.reason,
            .success, .revert => null,
        };
    }

    /// Clean up all memory associated with logs
    pub fn deinit_logs(self: *CallResult, allocator: std.mem.Allocator) void {
        switch (self.*) {
            .success => |*s| {
                for (s.logs) |log| {
                    allocator.free(log.topics);
                    allocator.free(log.data);
                }
                allocator.free(s.logs);
                s.logs = &.{};
            },
            .revert, .failure => {},
        }
    }
};

test "success results" {
    const testing = std.testing;

    const stop = CallResult.success_stop(1000);
    try testing.expect(stop.is_success());
    try testing.expect(!stop.is_revert());
    try testing.expect(!stop.is_failure());
    try testing.expectEqual(@as(u64, 1000), stop.gas_left());
    try testing.expectEqual(Success.Stop, stop.success_reason().?);
    try testing.expectEqual(@as(?[]const u8, null), stop.output());

    const data = &[_]u8{ 0x01, 0x02, 0x03 };
    const ret = CallResult.success_return(2000, data);
    try testing.expect(ret.is_success());
    try testing.expectEqual(@as(u64, 2000), ret.gas_left());
    try testing.expectEqual(Success.Return, ret.success_reason().?);
    try testing.expectEqualSlices(u8, data, ret.output().?);

    const selfdestruct = CallResult.success_selfdestruct(500);
    try testing.expect(selfdestruct.is_success());
    try testing.expectEqual(Success.SelfDestruct, selfdestruct.success_reason().?);
}

test "revert results" {
    const testing = std.testing;

    const revert_data = "Error: insufficient funds";
    const rev = CallResult.revert(3000, revert_data);
    
    try testing.expect(!rev.is_success());
    try testing.expect(rev.is_revert());
    try testing.expect(!rev.is_failure());
    try testing.expectEqual(@as(u64, 3000), rev.gas_left());
    try testing.expectEqualSlices(u8, revert_data, rev.output().?);
    try testing.expectEqual(@as(?Success, null), rev.success_reason());
    try testing.expectEqual(@as(?Error, null), rev.failure_reason());
}

test "failure results" {
    const testing = std.testing;

    const oog = CallResult.failure(Error.OutOfGas, 0);
    try testing.expect(!oog.is_success());
    try testing.expect(!oog.is_revert());
    try testing.expect(oog.is_failure());
    try testing.expectEqual(@as(u64, 0), oog.gas_left());
    try testing.expectEqual(Error.OutOfGas, oog.failure_reason().?);
    try testing.expectEqual(@as(?[]const u8, null), oog.output());

    const stack_err = CallResult.failure(Error.StackOverflow, 100);
    try testing.expectEqual(Error.StackOverflow, stack_err.failure_reason().?);
    try testing.expectEqual(@as(u64, 100), stack_err.gas_left());
}

test "gas consumption" {
    const testing = std.testing;
    const original: u64 = 21000;

    const success = CallResult.success_stop(18000);
    try testing.expectEqual(@as(u64, 3000), success.gas_consumed(original));

    const revert = CallResult.revert(5000, "");
    try testing.expectEqual(@as(u64, 16000), revert.gas_consumed(original));

    const failure = CallResult.failure(Error.OutOfGas, 0);
    try testing.expectEqual(@as(u64, 21000), failure.gas_consumed(original));

    const no_consumption = CallResult.success_stop(original);
    try testing.expectEqual(@as(u64, 0), no_consumption.gas_consumed(original));
}

test "logs handling" {
    const testing = std.testing;
    const ZERO_ADDRESS = primitives.ZERO_ADDRESS;
    
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const topics = try allocator.dupe(u256, &[_]u256{ 0x1234, 0x5678 });
    const data = try allocator.dupe(u8, "event data");
    const logs = try allocator.alloc(Log, 1);
    logs[0] = Log{
        .address = ZERO_ADDRESS,
        .topics = topics,
        .data = data,
    };

    var result = CallResult.success_with_logs(.Return, 10000, &[_]u8{}, logs);
    try testing.expect(result.is_success());
    try testing.expectEqual(@as(usize, 1), result.logs().?.len);

    result.deinit_logs(allocator);
    try testing.expectEqual(@as(usize, 0), result.switch(.success).logs.len);
}

test "edge cases" {
    const testing = std.testing;

    const max_gas = CallResult.success_stop(std.math.maxInt(u64));
    try testing.expectEqual(std.math.maxInt(u64), max_gas.gas_left());
    try testing.expectEqual(@as(u64, 0), max_gas.gas_consumed(std.math.maxInt(u64)));

    const invalid_gas = CallResult.success_stop(30000);
    try testing.expectEqual(@as(u64, 0), invalid_gas.gas_consumed(20000));

    const empty_revert = CallResult.revert(1000, &[_]u8{});
    try testing.expect(empty_revert.is_revert());
    try testing.expectEqual(@as(?[]const u8, null), empty_revert.output());

    const all_errors = [_]Error{
        Error.InvalidJump,
        Error.OutOfGas,
        Error.StackUnderflow,
        Error.StackOverflow,
        Error.ContractNotFound,
        Error.PrecompileError,
        Error.MemoryError,
        Error.StorageError,
        Error.CallDepthExceeded,
        Error.InsufficientBalance,
        Error.ContractCollision,
        Error.InvalidBytecode,
        Error.StaticCallViolation,
        Error.InvalidOpcode,
        Error.RevertExecution,
        Error.OutOfMemory,
    };

    for (all_errors) |err| {
        const result = CallResult.failure(err, 500);
        try testing.expect(result.is_failure());
        try testing.expectEqual(err, result.failure_reason().?);
    }
}