//! TraceResult - Complete execution trace result
//!
//! Returned by debug_traceTransaction and debug_traceCall.
//! Contains gas usage, success/failure status, and trace data.

const std = @import("std");
const testing = std.testing;
const json = std.json;
const Allocator = std.mem.Allocator;
const Hex = @import("../Hex/Hex.zig");
const StructLog = @import("../StructLog/struct_log.zig").StructLog;
const CallTrace = @import("../CallTrace/call_trace.zig").CallTrace;

/// Complete execution trace result
pub const TraceResult = struct {
    /// Total gas used by the execution
    gas: u64,
    /// Whether execution failed
    failed: bool,
    /// Return value or revert data
    return_value: []const u8,
    /// Opcode-level execution trace (when using default tracer)
    struct_logs: ?[]const StructLog = null,
    /// Call tree (when using callTracer)
    call_trace: ?CallTrace = null,

    const Self = @This();

    /// Create TraceResult from basic components
    pub fn from(
        gas: u64,
        failed: bool,
        return_value: []const u8,
    ) Self {
        return .{
            .gas = gas,
            .failed = failed,
            .return_value = return_value,
        };
    }

    /// Create TraceResult with struct logs
    pub fn fromStructLogs(
        gas: u64,
        failed: bool,
        return_value: []const u8,
        struct_logs: []const StructLog,
    ) Self {
        return .{
            .gas = gas,
            .failed = failed,
            .return_value = return_value,
            .struct_logs = struct_logs,
        };
    }

    /// Create TraceResult with call trace
    pub fn fromCallTrace(
        gas: u64,
        failed: bool,
        return_value: []const u8,
        call_trace: CallTrace,
    ) Self {
        return .{
            .gas = gas,
            .failed = failed,
            .return_value = return_value,
            .call_trace = call_trace,
        };
    }

    /// Check equality (shallow comparison)
    pub fn equals(self: Self, other: Self) bool {
        if (self.gas != other.gas) return false;
        if (self.failed != other.failed) return false;
        if (!std.mem.eql(u8, self.return_value, other.return_value)) return false;

        // Check presence of struct_logs and call_trace
        if ((self.struct_logs != null) != (other.struct_logs != null)) return false;
        if ((self.call_trace != null) != (other.call_trace != null)) return false;

        return true;
    }

    /// Check if execution succeeded
    pub fn succeeded(self: Self) bool {
        return !self.failed;
    }

    /// Get number of struct logs
    pub fn structLogCount(self: Self) usize {
        return if (self.struct_logs) |logs| logs.len else 0;
    }

    /// Check if has struct logs
    pub fn hasStructLogs(self: Self) bool {
        return self.struct_logs != null;
    }

    /// Check if has call trace
    pub fn hasCallTrace(self: Self) bool {
        return self.call_trace != null;
    }

    /// Get struct logs (or empty slice)
    pub fn getStructLogs(self: Self) []const StructLog {
        return self.struct_logs orelse &[_]StructLog{};
    }

    /// Get call trace (or null)
    pub fn getCallTrace(self: Self) ?CallTrace {
        return self.call_trace;
    }

    /// Encode to JSON
    pub fn toJson(self: Self, allocator: Allocator) ![]u8 {
        var buf = std.ArrayList(u8){};
        defer buf.deinit(allocator);

        try buf.appendSlice(allocator, "{\"gas\":");
        var gas_buf: [20]u8 = undefined;
        const gas_str = try std.fmt.bufPrint(&gas_buf, "{d}", .{self.gas});
        try buf.appendSlice(allocator, gas_str);

        try buf.appendSlice(allocator, ",\"failed\":");
        try buf.appendSlice(allocator, if (self.failed) "true" else "false");

        try buf.appendSlice(allocator, ",\"returnValue\":\"");
        const return_hex = try Hex.bytesToHex(allocator, self.return_value);
        defer allocator.free(return_hex);
        try buf.appendSlice(allocator, return_hex);
        try buf.append(allocator, '"');

        if (self.struct_logs) |logs| {
            try buf.appendSlice(allocator, ",\"structLogs\":[");
            for (logs, 0..) |log, i| {
                if (i > 0) try buf.append(allocator, ',');
                const log_json = try log.toJson(allocator);
                defer allocator.free(log_json);
                try buf.appendSlice(allocator, log_json);
            }
            try buf.append(allocator, ']');
        }

        if (self.call_trace) |trace| {
            try buf.appendSlice(allocator, ",\"callTrace\":");
            const trace_json = try trace.toJson(allocator);
            defer allocator.free(trace_json);
            try buf.appendSlice(allocator, trace_json);
        }

        try buf.append(allocator, '}');

        return buf.toOwnedSlice(allocator);
    }
};

// Tests
test "TraceResult: basic creation" {
    const return_value = [_]u8{ 0x00, 0x00, 0x00, 0x01 };
    const result = TraceResult.from(50000, false, &return_value);

    try testing.expectEqual(@as(u64, 50000), result.gas);
    try testing.expect(!result.failed);
    try testing.expect(result.succeeded());
    try testing.expectEqualSlices(u8, &return_value, result.return_value);
    try testing.expect(result.struct_logs == null);
    try testing.expect(result.call_trace == null);
}

test "TraceResult: with struct logs" {
    const return_value = [_]u8{};

    const logs = [_]StructLog{
        StructLog.from(0, .PUSH1, 1000000, 3, 0),
        StructLog.from(2, .ADD, 999997, 3, 0),
    };

    const result = TraceResult.fromStructLogs(50000, false, &return_value, &logs);

    try testing.expect(result.hasStructLogs());
    try testing.expect(!result.hasCallTrace());
    try testing.expectEqual(@as(usize, 2), result.structLogCount());
    try testing.expectEqual(@as(usize, 2), result.getStructLogs().len);
}

test "TraceResult: with call trace" {
    const return_value = [_]u8{};

    var from_addr: [20]u8 = undefined;
    @memset(&from_addr, 0xaa);
    const input = [_]u8{};
    const output = [_]u8{};

    const trace = CallTrace.from(.CALL, from_addr, 100000, 50000, &input, &output);
    const result = TraceResult.fromCallTrace(50000, false, &return_value, trace);

    try testing.expect(!result.hasStructLogs());
    try testing.expect(result.hasCallTrace());
    try testing.expectEqual(@as(usize, 0), result.structLogCount());
}

test "TraceResult: equality" {
    const return_value = [_]u8{0x01};
    const result1 = TraceResult.from(50000, false, &return_value);
    const result2 = TraceResult.from(50000, false, &return_value);
    const result3 = TraceResult.from(60000, false, &return_value);

    try testing.expect(result1.equals(result2));
    try testing.expect(!result1.equals(result3));
}

test "TraceResult: failed execution" {
    const return_value = [_]u8{ 0x08, 0xc3, 0x79, 0xa0 }; // Error(string) selector
    const result = TraceResult.from(21000, true, &return_value);

    try testing.expect(result.failed);
    try testing.expect(!result.succeeded());
}

test "TraceResult: JSON encode basic" {
    const allocator = testing.allocator;
    const return_value = [_]u8{0x01};
    const result = TraceResult.from(50000, false, &return_value);

    const json_str = try result.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expect(std.mem.indexOf(u8, json_str, "\"gas\":50000") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"failed\":false") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"returnValue\":\"0x01\"") != null);
}

test "TraceResult: JSON encode with struct logs" {
    const allocator = testing.allocator;
    const return_value = [_]u8{};

    const logs = [_]StructLog{
        StructLog.from(0, .PUSH1, 1000000, 3, 0),
    };

    const result = TraceResult.fromStructLogs(50000, false, &return_value, &logs);

    const json_str = try result.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expect(std.mem.indexOf(u8, json_str, "\"structLogs\":[") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"op\":\"PUSH1\"") != null);
}

test "TraceResult: JSON encode failed with revert" {
    const allocator = testing.allocator;
    const return_value = [_]u8{ 0x08, 0xc3, 0x79, 0xa0 };
    const result = TraceResult.from(21000, true, &return_value);

    const json_str = try result.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expect(std.mem.indexOf(u8, json_str, "\"failed\":true") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"returnValue\":\"0x08c379a0\"") != null);
}
