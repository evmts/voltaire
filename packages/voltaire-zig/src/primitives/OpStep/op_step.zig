//! OpStep - Single EVM operation step
//!
//! Represents EVM state at a specific instruction execution.
//! Uses typed Opcode enum and Uint256 for stack values.

const std = @import("std");
const testing = std.testing;
const json = std.json;
const Allocator = std.mem.Allocator;
const Opcode = @import("../Opcode/opcode.zig").Opcode;
const StructLog = @import("../StructLog/struct_log.zig").StructLog;
const Hex = @import("../Hex/Hex.zig");

/// Storage map: 32-byte key -> 32-byte value
pub const StorageMap = std.AutoHashMap([32]u8, [32]u8);

/// Single opcode execution step
pub const OpStep = struct {
    /// Program counter (bytecode offset)
    pc: u64,
    /// Opcode number (0x00-0xFF)
    op: Opcode,
    /// Remaining gas before executing this operation
    gas: u64,
    /// Gas cost for this operation
    gas_cost: u64,
    /// Call depth (0 for top-level call)
    depth: u32,
    /// Stack state (top to bottom), each 32 bytes
    stack: ?[]const [32]u8 = null,
    /// Memory state (raw bytes)
    memory: ?[]const u8 = null,
    /// Storage changes in this step (key -> value)
    storage: ?StorageMap = null,
    /// Error message if step failed
    err: ?[]const u8 = null,

    const Self = @This();

    /// Create OpStep from basic components
    pub fn from(
        pc: u64,
        op: Opcode,
        gas: u64,
        gas_cost: u64,
        depth: u32,
    ) Self {
        return .{
            .pc = pc,
            .op = op,
            .gas = gas,
            .gas_cost = gas_cost,
            .depth = depth,
        };
    }

    /// Create OpStep with all fields
    pub fn fromFull(
        pc: u64,
        op: Opcode,
        gas: u64,
        gas_cost: u64,
        depth: u32,
        stack: ?[]const [32]u8,
        memory: ?[]const u8,
        storage: ?StorageMap,
        err: ?[]const u8,
    ) Self {
        return .{
            .pc = pc,
            .op = op,
            .gas = gas,
            .gas_cost = gas_cost,
            .depth = depth,
            .stack = stack,
            .memory = memory,
            .storage = storage,
            .err = err,
        };
    }

    /// Create OpStep from a StructLog
    /// Note: StructLog has a refund field that OpStep doesn't have (dropped in conversion)
    pub fn fromStructLog(log: StructLog) Self {
        return log.toOpStep();
    }

    /// Check equality with another OpStep
    pub fn equals(self: Self, other: Self) bool {
        if (self.pc != other.pc) return false;
        if (self.op != other.op) return false;
        if (self.gas != other.gas) return false;
        if (self.gas_cost != other.gas_cost) return false;
        if (self.depth != other.depth) return false;

        // Compare error strings
        if (self.err) |e1| {
            if (other.err) |e2| {
                if (!std.mem.eql(u8, e1, e2)) return false;
            } else return false;
        } else if (other.err != null) return false;

        // Compare stack
        if (self.stack) |s1| {
            if (other.stack) |s2| {
                if (s1.len != s2.len) return false;
                for (s1, s2) |a, b| {
                    if (!std.mem.eql(u8, &a, &b)) return false;
                }
            } else return false;
        } else if (other.stack != null) return false;

        // Compare memory
        if (self.memory) |m1| {
            if (other.memory) |m2| {
                if (!std.mem.eql(u8, m1, m2)) return false;
            } else return false;
        } else if (other.memory != null) return false;

        return true;
    }

    /// Check if this step has an error
    pub fn hasError(self: Self) bool {
        return self.err != null;
    }

    /// Get opcode name
    pub fn opName(self: Self) []const u8 {
        return self.op.name();
    }

    /// Get opcode byte value
    pub fn opByte(self: Self) u8 {
        return @intFromEnum(self.op);
    }

    /// Check if this is a PUSH operation
    pub fn isPush(self: Self) bool {
        return self.op.isPush();
    }

    /// Check if this is a terminating operation
    pub fn isTerminating(self: Self) bool {
        return self.op.isTerminating();
    }

    /// Check if this operation modifies state
    pub fn isStateModifying(self: Self) bool {
        return self.op.isStateModifying();
    }

    /// Get stack depth (number of items)
    pub fn stackDepth(self: Self) usize {
        return if (self.stack) |s| s.len else 0;
    }

    /// Get memory size in bytes
    pub fn memorySize(self: Self) usize {
        return if (self.memory) |m| m.len else 0;
    }

    /// Encode to JSON
    pub fn toJson(self: Self, allocator: Allocator) ![]u8 {
        var buf = std.ArrayList(u8){};
        defer buf.deinit(allocator);

        try buf.appendSlice(allocator, "{\"pc\":");
        var pc_buf: [20]u8 = undefined;
        const pc_str = try std.fmt.bufPrint(&pc_buf, "{d}", .{self.pc});
        try buf.appendSlice(allocator, pc_str);

        try buf.appendSlice(allocator, ",\"op\":");
        var op_buf: [5]u8 = undefined;
        const op_str = try std.fmt.bufPrint(&op_buf, "{d}", .{self.opByte()});
        try buf.appendSlice(allocator, op_str);

        try buf.appendSlice(allocator, ",\"gas\":");
        var gas_buf: [20]u8 = undefined;
        const gas_str = try std.fmt.bufPrint(&gas_buf, "{d}", .{self.gas});
        try buf.appendSlice(allocator, gas_str);

        try buf.appendSlice(allocator, ",\"gasCost\":");
        var gas_cost_buf: [20]u8 = undefined;
        const gas_cost_str = try std.fmt.bufPrint(&gas_cost_buf, "{d}", .{self.gas_cost});
        try buf.appendSlice(allocator, gas_cost_str);

        try buf.appendSlice(allocator, ",\"depth\":");
        var depth_buf: [10]u8 = undefined;
        const depth_str = try std.fmt.bufPrint(&depth_buf, "{d}", .{self.depth});
        try buf.appendSlice(allocator, depth_str);

        if (self.stack) |stack| {
            try buf.appendSlice(allocator, ",\"stack\":[");
            for (stack, 0..) |item, i| {
                if (i > 0) try buf.append(allocator, ',');
                try buf.append(allocator, '"');
                const hex = Hex.bytesToHexFixed(32, item);
                try buf.appendSlice(allocator, &hex);
                try buf.append(allocator, '"');
            }
            try buf.append(allocator, ']');
        }

        if (self.memory) |memory| {
            try buf.appendSlice(allocator, ",\"memory\":\"");
            const hex = try Hex.bytesToHex(allocator, memory);
            defer allocator.free(hex);
            try buf.appendSlice(allocator, hex);
            try buf.append(allocator, '"');
        }

        if (self.err) |err| {
            try buf.appendSlice(allocator, ",\"error\":\"");
            try buf.appendSlice(allocator, err);
            try buf.append(allocator, '"');
        }

        try buf.append(allocator, '}');

        return buf.toOwnedSlice(allocator);
    }

    /// Decode from JSON
    pub fn fromJson(allocator: Allocator, json_str: []const u8) !Self {
        const parsed = try json.parseFromSlice(json.Value, allocator, json_str, .{});
        defer parsed.deinit();

        const obj = parsed.value.object;

        const pc: u64 = @intCast(obj.get("pc").?.integer);
        const op_byte: u8 = @intCast(obj.get("op").?.integer);
        const op: Opcode = @enumFromInt(op_byte);
        const gas: u64 = @intCast(obj.get("gas").?.integer);
        const gas_cost: u64 = @intCast(obj.get("gasCost").?.integer);
        const depth: u32 = @intCast(obj.get("depth").?.integer);

        var result = Self.from(pc, op, gas, gas_cost, depth);

        if (obj.get("error")) |err_val| {
            if (err_val != .null) {
                result.err = try allocator.dupe(u8, err_val.string);
            }
        }

        return result;
    }
};

// Tests
test "OpStep: basic creation" {
    const step = OpStep.from(0, .PUSH1, 1000000, 3, 0);

    try testing.expectEqual(@as(u64, 0), step.pc);
    try testing.expectEqual(Opcode.PUSH1, step.op);
    try testing.expectEqual(@as(u64, 1000000), step.gas);
    try testing.expectEqual(@as(u64, 3), step.gas_cost);
    try testing.expectEqual(@as(u32, 0), step.depth);
    try testing.expect(step.stack == null);
    try testing.expect(step.memory == null);
    try testing.expect(step.err == null);
}

test "OpStep: equality" {
    const step1 = OpStep.from(0, .ADD, 1000, 3, 1);
    const step2 = OpStep.from(0, .ADD, 1000, 3, 1);
    const step3 = OpStep.from(1, .ADD, 1000, 3, 1);

    try testing.expect(step1.equals(step2));
    try testing.expect(!step1.equals(step3));
}

test "OpStep: hasError" {
    var step = OpStep.from(10, .SSTORE, 500, 5000, 0);
    try testing.expect(!step.hasError());

    step.err = "stack underflow";
    try testing.expect(step.hasError());
}

test "OpStep: opcode utilities" {
    const push_step = OpStep.from(0, .PUSH1, 1000, 3, 0);
    try testing.expect(push_step.isPush());
    try testing.expect(!push_step.isTerminating());
    try testing.expect(!push_step.isStateModifying());
    try testing.expectEqual(@as(u8, 0x60), push_step.opByte());
    try testing.expectEqualStrings("PUSH1", push_step.opName());

    const stop_step = OpStep.from(100, .STOP, 0, 0, 0);
    try testing.expect(stop_step.isTerminating());
    try testing.expect(!stop_step.isPush());

    const sstore_step = OpStep.from(50, .SSTORE, 1000, 5000, 0);
    try testing.expect(sstore_step.isStateModifying());
}

test "OpStep: stack and memory depth" {
    const step1 = OpStep.from(0, .ADD, 1000, 3, 0);
    try testing.expectEqual(@as(usize, 0), step1.stackDepth());
    try testing.expectEqual(@as(usize, 0), step1.memorySize());

    var stack: [3][32]u8 = undefined;
    @memset(&stack[0], 0);
    @memset(&stack[1], 0);
    @memset(&stack[2], 0);

    var memory = [_]u8{ 0x00, 0x01, 0x02, 0x03 };

    const step2 = OpStep.fromFull(0, .ADD, 1000, 3, 0, &stack, &memory, null, null);
    try testing.expectEqual(@as(usize, 3), step2.stackDepth());
    try testing.expectEqual(@as(usize, 4), step2.memorySize());
}

test "OpStep: JSON encode" {
    const allocator = testing.allocator;
    const step = OpStep.from(42, .ADD, 999, 3, 1);

    const json_str = try step.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expect(std.mem.indexOf(u8, json_str, "\"pc\":42") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"op\":1") != null); // ADD = 0x01
    try testing.expect(std.mem.indexOf(u8, json_str, "\"gas\":999") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"gasCost\":3") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"depth\":1") != null);
}

test "OpStep: JSON roundtrip" {
    const allocator = testing.allocator;
    const step = OpStep.from(42, .MUL, 999, 5, 2);

    const json_str = try step.toJson(allocator);
    defer allocator.free(json_str);

    const decoded = try OpStep.fromJson(allocator, json_str);

    try testing.expectEqual(step.pc, decoded.pc);
    try testing.expectEqual(step.op, decoded.op);
    try testing.expectEqual(step.gas, decoded.gas);
    try testing.expectEqual(step.gas_cost, decoded.gas_cost);
    try testing.expectEqual(step.depth, decoded.depth);
}
