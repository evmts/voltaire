//! CallTrace - Call tree structure from callTracer
//!
//! Represents a single call (or create) and its nested subcalls.
//! Used by debug_traceTransaction with callTracer.

const std = @import("std");
const testing = std.testing;
const json = std.json;
const Allocator = std.mem.Allocator;
const Hex = @import("../Hex/Hex.zig");

/// Call type enumeration
pub const CallType = enum {
    CALL,
    STATICCALL,
    DELEGATECALL,
    CALLCODE,
    CREATE,
    CREATE2,
    SELFDESTRUCT,

    pub fn toString(self: CallType) []const u8 {
        return switch (self) {
            .CALL => "CALL",
            .STATICCALL => "STATICCALL",
            .DELEGATECALL => "DELEGATECALL",
            .CALLCODE => "CALLCODE",
            .CREATE => "CREATE",
            .CREATE2 => "CREATE2",
            .SELFDESTRUCT => "SELFDESTRUCT",
        };
    }

    pub fn fromString(s: []const u8) ?CallType {
        if (std.mem.eql(u8, s, "CALL")) return .CALL;
        if (std.mem.eql(u8, s, "STATICCALL")) return .STATICCALL;
        if (std.mem.eql(u8, s, "DELEGATECALL")) return .DELEGATECALL;
        if (std.mem.eql(u8, s, "CALLCODE")) return .CALLCODE;
        if (std.mem.eql(u8, s, "CREATE")) return .CREATE;
        if (std.mem.eql(u8, s, "CREATE2")) return .CREATE2;
        if (std.mem.eql(u8, s, "SELFDESTRUCT")) return .SELFDESTRUCT;
        return null;
    }
};

/// Call tree structure from callTracer
pub const CallTrace = struct {
    /// Call type
    call_type: CallType,
    /// Caller address (20 bytes)
    from_addr: [20]u8,
    /// Callee address (20 bytes, optional for CREATE/CREATE2 before completion)
    to: ?[20]u8 = null,
    /// Call value in wei (32 bytes)
    value: ?[32]u8 = null,
    /// Gas provided to this call
    gas: u64,
    /// Gas actually used by this call
    gas_used: u64,
    /// Input data (calldata or init code)
    input: []const u8,
    /// Return data or deployed code
    output: []const u8,
    /// Error message if call failed
    err: ?[]const u8 = null,
    /// Decoded revert reason
    revert_reason: ?[]const u8 = null,
    /// Nested calls made by this call
    calls: ?[]const CallTrace = null,

    const Self = @This();

    /// Create CallTrace from basic components
    pub fn from(
        call_type: CallType,
        caller: [20]u8,
        gas: u64,
        gas_used: u64,
        input: []const u8,
        output: []const u8,
    ) Self {
        return .{
            .call_type = call_type,
            .from_addr = caller,
            .gas = gas,
            .gas_used = gas_used,
            .input = input,
            .output = output,
        };
    }

    /// Create CallTrace with all fields
    pub fn fromFull(
        call_type: CallType,
        caller: [20]u8,
        to_addr: ?[20]u8,
        value: ?[32]u8,
        gas: u64,
        gas_used: u64,
        input: []const u8,
        output: []const u8,
        err: ?[]const u8,
        revert_reason: ?[]const u8,
        calls: ?[]const CallTrace,
    ) Self {
        return .{
            .call_type = call_type,
            .from_addr = caller,
            .to = to_addr,
            .value = value,
            .gas = gas,
            .gas_used = gas_used,
            .input = input,
            .output = output,
            .err = err,
            .revert_reason = revert_reason,
            .calls = calls,
        };
    }

    /// Check equality (shallow, does not compare nested calls)
    pub fn equals(self: Self, other: Self) bool {
        if (self.call_type != other.call_type) return false;
        if (!std.mem.eql(u8, &self.from_addr, &other.from_addr)) return false;
        if (self.gas != other.gas) return false;
        if (self.gas_used != other.gas_used) return false;

        // Compare optional to
        if (self.to) |t1| {
            if (other.to) |t2| {
                if (!std.mem.eql(u8, &t1, &t2)) return false;
            } else return false;
        } else if (other.to != null) return false;

        // Compare optional value
        if (self.value) |v1| {
            if (other.value) |v2| {
                if (!std.mem.eql(u8, &v1, &v2)) return false;
            } else return false;
        } else if (other.value != null) return false;

        // Compare input/output
        if (!std.mem.eql(u8, self.input, other.input)) return false;
        if (!std.mem.eql(u8, self.output, other.output)) return false;

        // Compare error
        if (self.err) |e1| {
            if (other.err) |e2| {
                if (!std.mem.eql(u8, e1, e2)) return false;
            } else return false;
        } else if (other.err != null) return false;

        return true;
    }

    /// Check if call has an error
    pub fn hasError(self: Self) bool {
        return self.err != null;
    }

    /// Check if call is a create operation
    pub fn isCreate(self: Self) bool {
        return self.call_type == .CREATE or self.call_type == .CREATE2;
    }

    /// Check if call is a delegate call
    pub fn isDelegate(self: Self) bool {
        return self.call_type == .DELEGATECALL or self.call_type == .CALLCODE;
    }

    /// Check if call is a static call
    pub fn isStatic(self: Self) bool {
        return self.call_type == .STATICCALL;
    }

    /// Get number of nested calls
    pub fn callCount(self: Self) usize {
        return if (self.calls) |c| c.len else 0;
    }

    /// Get all calls (including nested) flattened
    pub fn flatten(self: Self, allocator: Allocator) ![]const CallTrace {
        var result = std.ArrayList(CallTrace){};
        defer result.deinit(allocator);

        try self.flattenInto(&result, allocator);

        return result.toOwnedSlice(allocator);
    }

    fn flattenInto(self: Self, list: *std.ArrayList(CallTrace), allocator: Allocator) !void {
        try list.append(allocator, self);
        if (self.calls) |calls| {
            for (calls) |call| {
                try call.flattenInto(list, allocator);
            }
        }
    }

    /// Get total gas used (including nested calls)
    pub fn totalGasUsed(self: Self) u64 {
        var total = self.gas_used;
        if (self.calls) |calls| {
            for (calls) |call| {
                total += call.totalGasUsed();
            }
        }
        return total;
    }

    /// Encode to JSON
    pub fn toJson(self: Self, allocator: Allocator) ![]u8 {
        var buf = std.ArrayList(u8){};
        defer buf.deinit(allocator);

        try buf.appendSlice(allocator, "{\"type\":\"");
        try buf.appendSlice(allocator, self.call_type.toString());
        try buf.append(allocator, '"');

        try buf.appendSlice(allocator, ",\"from\":\"");
        const from_hex = Hex.bytesToHexFixed(20, self.from_addr);
        try buf.appendSlice(allocator, &from_hex);
        try buf.append(allocator, '"');

        if (self.to) |to_addr| {
            try buf.appendSlice(allocator, ",\"to\":\"");
            const to_hex = Hex.bytesToHexFixed(20, to_addr);
            try buf.appendSlice(allocator, &to_hex);
            try buf.append(allocator, '"');
        }

        if (self.value) |val| {
            try buf.appendSlice(allocator, ",\"value\":\"");
            const val_hex = Hex.bytesToHexFixed(32, val);
            try buf.appendSlice(allocator, &val_hex);
            try buf.append(allocator, '"');
        }

        try buf.appendSlice(allocator, ",\"gas\":");
        var gas_buf: [20]u8 = undefined;
        const gas_str = try std.fmt.bufPrint(&gas_buf, "{d}", .{self.gas});
        try buf.appendSlice(allocator, gas_str);

        try buf.appendSlice(allocator, ",\"gasUsed\":");
        var gas_used_buf: [20]u8 = undefined;
        const gas_used_str = try std.fmt.bufPrint(&gas_used_buf, "{d}", .{self.gas_used});
        try buf.appendSlice(allocator, gas_used_str);

        try buf.appendSlice(allocator, ",\"input\":\"");
        const input_hex = try Hex.bytesToHex(allocator, self.input);
        defer allocator.free(input_hex);
        try buf.appendSlice(allocator, input_hex);
        try buf.append(allocator, '"');

        try buf.appendSlice(allocator, ",\"output\":\"");
        const output_hex = try Hex.bytesToHex(allocator, self.output);
        defer allocator.free(output_hex);
        try buf.appendSlice(allocator, output_hex);
        try buf.append(allocator, '"');

        if (self.err) |err| {
            try buf.appendSlice(allocator, ",\"error\":\"");
            try buf.appendSlice(allocator, err);
            try buf.append(allocator, '"');
        }

        if (self.revert_reason) |reason| {
            try buf.appendSlice(allocator, ",\"revertReason\":\"");
            try buf.appendSlice(allocator, reason);
            try buf.append(allocator, '"');
        }

        if (self.calls) |calls| {
            try buf.appendSlice(allocator, ",\"calls\":[");
            for (calls, 0..) |call, i| {
                if (i > 0) try buf.append(allocator, ',');
                const call_json = try call.toJson(allocator);
                defer allocator.free(call_json);
                try buf.appendSlice(allocator, call_json);
            }
            try buf.append(allocator, ']');
        }

        try buf.append(allocator, '}');

        return buf.toOwnedSlice(allocator);
    }
};

// Tests
test "CallTrace: basic creation" {
    var from_addr: [20]u8 = undefined;
    @memset(&from_addr, 0xaa);

    const input = [_]u8{ 0x12, 0x34 };
    const output = [_]u8{};

    const trace = CallTrace.from(.CALL, from_addr, 100000, 50000, &input, &output);

    try testing.expectEqual(CallType.CALL, trace.call_type);
    try testing.expectEqual(@as(u64, 100000), trace.gas);
    try testing.expectEqual(@as(u64, 50000), trace.gas_used);
    try testing.expect(trace.to == null);
    try testing.expect(trace.value == null);
    try testing.expect(trace.err == null);
}

test "CallTrace: equality" {
    var from1: [20]u8 = undefined;
    @memset(&from1, 0xaa);
    var from2: [20]u8 = undefined;
    @memset(&from2, 0xaa);
    var from3: [20]u8 = undefined;
    @memset(&from3, 0xbb);

    const input = [_]u8{};
    const output = [_]u8{};

    const trace1 = CallTrace.from(.CALL, from1, 100000, 50000, &input, &output);
    const trace2 = CallTrace.from(.CALL, from2, 100000, 50000, &input, &output);
    const trace3 = CallTrace.from(.CALL, from3, 100000, 50000, &input, &output);

    try testing.expect(trace1.equals(trace2));
    try testing.expect(!trace1.equals(trace3));
}

test "CallTrace: hasError" {
    var from_addr: [20]u8 = undefined;
    @memset(&from_addr, 0xaa);
    const input = [_]u8{};
    const output = [_]u8{};

    var trace = CallTrace.from(.CALL, from_addr, 100000, 50000, &input, &output);
    try testing.expect(!trace.hasError());

    trace.err = "execution reverted";
    try testing.expect(trace.hasError());
}

test "CallTrace: call type checks" {
    var from_addr: [20]u8 = undefined;
    @memset(&from_addr, 0xaa);
    const input = [_]u8{};
    const output = [_]u8{};

    const call = CallTrace.from(.CALL, from_addr, 100000, 50000, &input, &output);
    try testing.expect(!call.isCreate());
    try testing.expect(!call.isDelegate());
    try testing.expect(!call.isStatic());

    const create = CallTrace.from(.CREATE, from_addr, 100000, 50000, &input, &output);
    try testing.expect(create.isCreate());

    const delegate = CallTrace.from(.DELEGATECALL, from_addr, 100000, 50000, &input, &output);
    try testing.expect(delegate.isDelegate());

    const static = CallTrace.from(.STATICCALL, from_addr, 100000, 50000, &input, &output);
    try testing.expect(static.isStatic());
}

test "CallTrace: callCount" {
    var from_addr: [20]u8 = undefined;
    @memset(&from_addr, 0xaa);
    const input = [_]u8{};
    const output = [_]u8{};

    const trace1 = CallTrace.from(.CALL, from_addr, 100000, 50000, &input, &output);
    try testing.expectEqual(@as(usize, 0), trace1.callCount());

    var nested_calls = [_]CallTrace{
        CallTrace.from(.CALL, from_addr, 50000, 25000, &input, &output),
        CallTrace.from(.STATICCALL, from_addr, 30000, 15000, &input, &output),
    };

    var trace2 = CallTrace.from(.CALL, from_addr, 100000, 50000, &input, &output);
    trace2.calls = &nested_calls;
    try testing.expectEqual(@as(usize, 2), trace2.callCount());
}

test "CallTrace: flatten" {
    const allocator = testing.allocator;

    var from_addr: [20]u8 = undefined;
    @memset(&from_addr, 0xaa);
    const input = [_]u8{};
    const output = [_]u8{};

    var nested_calls = [_]CallTrace{
        CallTrace.from(.CALL, from_addr, 50000, 25000, &input, &output),
        CallTrace.from(.STATICCALL, from_addr, 30000, 15000, &input, &output),
    };

    var root = CallTrace.from(.CALL, from_addr, 100000, 50000, &input, &output);
    root.calls = &nested_calls;

    const flat = try root.flatten(allocator);
    defer allocator.free(flat);

    try testing.expectEqual(@as(usize, 3), flat.len);
    try testing.expectEqual(CallType.CALL, flat[0].call_type);
    try testing.expectEqual(@as(u64, 100000), flat[0].gas);
    try testing.expectEqual(CallType.CALL, flat[1].call_type);
    try testing.expectEqual(@as(u64, 50000), flat[1].gas);
    try testing.expectEqual(CallType.STATICCALL, flat[2].call_type);
}

test "CallTrace: totalGasUsed" {
    var from_addr: [20]u8 = undefined;
    @memset(&from_addr, 0xaa);
    const input = [_]u8{};
    const output = [_]u8{};

    var nested_calls = [_]CallTrace{
        CallTrace.from(.CALL, from_addr, 50000, 10000, &input, &output),
        CallTrace.from(.STATICCALL, from_addr, 30000, 5000, &input, &output),
    };

    var root = CallTrace.from(.CALL, from_addr, 100000, 20000, &input, &output);
    root.calls = &nested_calls;

    try testing.expectEqual(@as(u64, 35000), root.totalGasUsed());
}

test "CallTrace: JSON encode" {
    const allocator = testing.allocator;

    var from_addr: [20]u8 = undefined;
    @memset(&from_addr, 0xaa);
    const input = [_]u8{ 0x12, 0x34 };
    const output = [_]u8{};

    const trace = CallTrace.from(.CALL, from_addr, 100000, 50000, &input, &output);

    const json_str = try trace.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expect(std.mem.indexOf(u8, json_str, "\"type\":\"CALL\"") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"gas\":100000") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"gasUsed\":50000") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"input\":\"0x1234\"") != null);
}

test "CallType: string conversion" {
    try testing.expectEqualStrings("CALL", CallType.CALL.toString());
    try testing.expectEqualStrings("CREATE", CallType.CREATE.toString());
    try testing.expectEqualStrings("DELEGATECALL", CallType.DELEGATECALL.toString());

    try testing.expectEqual(CallType.CALL, CallType.fromString("CALL").?);
    try testing.expectEqual(CallType.CREATE2, CallType.fromString("CREATE2").?);
    try testing.expect(CallType.fromString("INVALID") == null);
}
