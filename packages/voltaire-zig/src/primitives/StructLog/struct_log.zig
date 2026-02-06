//! StructLog - Geth-style structured execution log entry
//!
//! Represents a single opcode execution with EVM state at that point.
//! Used by debug_traceTransaction with default tracer.

const std = @import("std");
const testing = std.testing;
const json = std.json;
const Allocator = std.mem.Allocator;
const Opcode = @import("../Opcode/opcode.zig").Opcode;
const OpStep = @import("../OpStep/op_step.zig").OpStep;
const Uint = @import("../Uint/Uint.zig").Uint;
const Hex = @import("../Hex/Hex.zig");

/// Storage map: 32-byte key -> 32-byte value
pub const StorageMap = std.AutoHashMap([32]u8, [32]u8);

/// Geth-style structured execution log entry
pub const StructLog = struct {
    /// Program counter (bytecode offset)
    pc: u64,
    /// Opcode at this position
    op: Opcode,
    /// Remaining gas before this operation
    gas: u64,
    /// Gas cost for this operation
    gas_cost: u64,
    /// Call depth (0 for top-level call)
    depth: u32,
    /// Stack contents (top to bottom), each 32 bytes
    stack: ?[]const [32]u8 = null,
    /// Memory contents as raw bytes
    memory: ?[]const u8 = null,
    /// Storage changes (key -> value)
    storage: ?StorageMap = null,
    /// Gas refund counter
    refund: ?u64 = null,
    /// Error message if operation failed
    err: ?[]const u8 = null,

    const Self = @This();

    /// Create StructLog from components
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

    /// Create StructLog with all fields
    pub fn fromFull(
        pc: u64,
        op: Opcode,
        gas: u64,
        gas_cost: u64,
        depth: u32,
        stack: ?[]const [32]u8,
        memory: ?[]const u8,
        storage: ?StorageMap,
        refund: ?u64,
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
            .refund = refund,
            .err = err,
        };
    }

    /// Check equality with another StructLog
    pub fn equals(self: Self, other: Self) bool {
        if (self.pc != other.pc) return false;
        if (self.op != other.op) return false;
        if (self.gas != other.gas) return false;
        if (self.gas_cost != other.gas_cost) return false;
        if (self.depth != other.depth) return false;
        if (self.refund != other.refund) return false;

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

        // Note: storage comparison skipped for simplicity (requires iteration)
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

    /// Convert to OpStep
    /// StructLog uses opcode name string, OpStep uses typed Opcode enum
    pub fn toOpStep(self: Self) OpStep {
        return OpStep.fromFull(
            self.pc,
            self.op,
            self.gas,
            self.gas_cost,
            self.depth,
            self.stack,
            self.memory,
            self.storage,
            self.err,
        );
    }

    /// Encode to JSON
    pub fn toJson(self: Self, allocator: Allocator) ![]u8 {
        var buf = std.ArrayList(u8){};
        defer buf.deinit(allocator);

        try buf.appendSlice(allocator, "{\"pc\":");
        var pc_buf: [20]u8 = undefined;
        const pc_str = try std.fmt.bufPrint(&pc_buf, "{d}", .{self.pc});
        try buf.appendSlice(allocator, pc_str);

        try buf.appendSlice(allocator, ",\"op\":\"");
        try buf.appendSlice(allocator, self.op.name());
        try buf.appendSlice(allocator, "\"");

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

        if (self.refund) |refund| {
            try buf.appendSlice(allocator, ",\"refund\":");
            var refund_buf: [20]u8 = undefined;
            const refund_str = try std.fmt.bufPrint(&refund_buf, "{d}", .{refund});
            try buf.appendSlice(allocator, refund_str);
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
        const gas: u64 = @intCast(obj.get("gas").?.integer);
        const gas_cost: u64 = @intCast(obj.get("gasCost").?.integer);
        const depth: u32 = @intCast(obj.get("depth").?.integer);

        // Parse opcode from name
        const op_name = obj.get("op").?.string;
        var op: Opcode = .STOP;
        inline for (std.meta.fields(Opcode)) |field| {
            if (std.mem.eql(u8, field.name, op_name)) {
                op = @enumFromInt(field.value);
                break;
            }
        }

        var result = Self.from(pc, op, gas, gas_cost, depth);

        if (obj.get("refund")) |refund_val| {
            if (refund_val != .null) {
                result.refund = @intCast(refund_val.integer);
            }
        }

        if (obj.get("error")) |err_val| {
            if (err_val != .null) {
                result.err = try allocator.dupe(u8, err_val.string);
            }
        }

        return result;
    }
};

// Tests
test "StructLog: basic creation" {
    const log = StructLog.from(0, .PUSH1, 1000000, 3, 0);

    try testing.expectEqual(@as(u64, 0), log.pc);
    try testing.expectEqual(Opcode.PUSH1, log.op);
    try testing.expectEqual(@as(u64, 1000000), log.gas);
    try testing.expectEqual(@as(u64, 3), log.gas_cost);
    try testing.expectEqual(@as(u32, 0), log.depth);
    try testing.expect(log.stack == null);
    try testing.expect(log.memory == null);
    try testing.expect(log.err == null);
}

test "StructLog: equality" {
    const log1 = StructLog.from(0, .ADD, 1000, 3, 1);
    const log2 = StructLog.from(0, .ADD, 1000, 3, 1);
    const log3 = StructLog.from(1, .ADD, 1000, 3, 1);

    try testing.expect(log1.equals(log2));
    try testing.expect(!log1.equals(log3));
}

test "StructLog: with error" {
    var log = StructLog.from(10, .SSTORE, 500, 5000, 0);
    log.err = "out of gas";

    try testing.expect(log.hasError());
    try testing.expectEqualStrings("out of gas", log.err.?);
}

test "StructLog: opcode name" {
    const log = StructLog.from(0, .KECCAK256, 1000, 30, 0);
    try testing.expectEqualStrings("KECCAK256", log.opName());
}

test "StructLog: with stack" {
    var stack: [2][32]u8 = undefined;
    @memset(&stack[0], 0);
    stack[0][31] = 0x01;
    @memset(&stack[1], 0);
    stack[1][31] = 0x02;

    const log = StructLog.fromFull(0, .ADD, 1000, 3, 0, &stack, null, null, null, null);

    try testing.expect(log.stack != null);
    try testing.expectEqual(@as(usize, 2), log.stack.?.len);
    try testing.expectEqual(@as(u8, 0x01), log.stack.?[0][31]);
    try testing.expectEqual(@as(u8, 0x02), log.stack.?[1][31]);
}

test "StructLog: JSON encode" {
    const allocator = testing.allocator;
    const log = StructLog.from(0, .PUSH1, 1000000, 3, 0);

    const json_str = try log.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expect(std.mem.indexOf(u8, json_str, "\"pc\":0") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"op\":\"PUSH1\"") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"gas\":1000000") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"gasCost\":3") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"depth\":0") != null);
}

test "StructLog: JSON encode with error" {
    const allocator = testing.allocator;
    var log = StructLog.from(10, .SSTORE, 500, 5000, 0);
    log.err = "out of gas";

    const json_str = try log.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expect(std.mem.indexOf(u8, json_str, "\"error\":\"out of gas\"") != null);
}

test "StructLog: JSON roundtrip" {
    const allocator = testing.allocator;
    const log = StructLog.from(42, .ADD, 999, 3, 1);

    const json_str = try log.toJson(allocator);
    defer allocator.free(json_str);

    const decoded = try StructLog.fromJson(allocator, json_str);

    try testing.expectEqual(log.pc, decoded.pc);
    try testing.expectEqual(log.op, decoded.op);
    try testing.expectEqual(log.gas, decoded.gas);
    try testing.expectEqual(log.gas_cost, decoded.gas_cost);
    try testing.expectEqual(log.depth, decoded.depth);
}

test "StructLog: toOpStep conversion" {
    const log = StructLog.from(42, .MUL, 1000, 5, 2);
    const step = log.toOpStep();

    try testing.expectEqual(log.pc, step.pc);
    try testing.expectEqual(log.op, step.op);
    try testing.expectEqual(log.gas, step.gas);
    try testing.expectEqual(log.gas_cost, step.gas_cost);
    try testing.expectEqual(log.depth, step.depth);
}

test "StructLog: toOpStep with stack and memory" {
    var stack: [2][32]u8 = undefined;
    @memset(&stack[0], 0);
    stack[0][31] = 0x01;
    @memset(&stack[1], 0);
    stack[1][31] = 0x02;

    var memory = [_]u8{ 0x00, 0x01, 0x02, 0x03 };

    const log = StructLog.fromFull(10, .ADD, 500, 3, 1, &stack, &memory, null, null, null);
    const step = log.toOpStep();

    try testing.expectEqual(log.pc, step.pc);
    try testing.expect(step.stack != null);
    try testing.expectEqual(@as(usize, 2), step.stack.?.len);
    try testing.expect(step.memory != null);
    try testing.expectEqual(@as(usize, 4), step.memory.?.len);
}
