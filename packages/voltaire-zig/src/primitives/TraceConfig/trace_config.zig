//! TraceConfig - Configuration options for debug_traceTransaction
//!
//! Controls what data is captured during EVM execution tracing.

const std = @import("std");
const testing = std.testing;
const json = std.json;
const Allocator = std.mem.Allocator;

/// Configuration for trace execution
pub const TraceConfig = struct {
    /// Don't track storage changes (reduces overhead)
    disable_storage: bool = false,
    /// Don't track stack (reduces overhead)
    disable_stack: bool = false,
    /// Don't track memory (reduces overhead)
    disable_memory: bool = false,
    /// Track memory (conflicts with disable_memory)
    enable_memory: bool = false,
    /// Track return data
    enable_return_data: bool = false,
    /// Tracer name: "callTracer", "prestateTracer", "4byteTracer", etc
    tracer: ?[]const u8 = null,
    /// Timeout for trace execution (e.g., "5s", "30s")
    timeout: ?[]const u8 = null,

    const Self = @This();

    /// Create default TraceConfig
    pub fn from() Self {
        return .{};
    }

    /// Create TraceConfig with all options enabled
    pub fn enableAll() Self {
        return .{
            .disable_storage = false,
            .disable_stack = false,
            .disable_memory = false,
            .enable_memory = true,
            .enable_return_data = true,
        };
    }

    /// Create TraceConfig with all tracking disabled (minimal overhead)
    pub fn disableAll() Self {
        return .{
            .disable_storage = true,
            .disable_stack = true,
            .disable_memory = true,
            .enable_memory = false,
            .enable_return_data = false,
        };
    }

    /// Create TraceConfig with a specific tracer
    pub fn withTracer(tracer_name: []const u8) Self {
        return .{
            .tracer = tracer_name,
        };
    }

    /// Create TraceConfig for callTracer
    pub fn callTracer() Self {
        return Self.withTracer("callTracer");
    }

    /// Create TraceConfig for prestateTracer
    pub fn prestateTracer() Self {
        return Self.withTracer("prestateTracer");
    }

    /// Create TraceConfig for 4byteTracer
    pub fn fourByteTracer() Self {
        return Self.withTracer("4byteTracer");
    }

    /// Check equality
    pub fn equals(self: Self, other: Self) bool {
        if (self.disable_storage != other.disable_storage) return false;
        if (self.disable_stack != other.disable_stack) return false;
        if (self.disable_memory != other.disable_memory) return false;
        if (self.enable_memory != other.enable_memory) return false;
        if (self.enable_return_data != other.enable_return_data) return false;

        // Compare tracer
        if (self.tracer) |t1| {
            if (other.tracer) |t2| {
                if (!std.mem.eql(u8, t1, t2)) return false;
            } else return false;
        } else if (other.tracer != null) return false;

        // Compare timeout
        if (self.timeout) |t1| {
            if (other.timeout) |t2| {
                if (!std.mem.eql(u8, t1, t2)) return false;
            } else return false;
        } else if (other.timeout != null) return false;

        return true;
    }

    /// Check if using a custom tracer
    pub fn hasTracer(self: Self) bool {
        return self.tracer != null;
    }

    /// Check if storage tracking is enabled
    pub fn tracksStorage(self: Self) bool {
        return !self.disable_storage;
    }

    /// Check if stack tracking is enabled
    pub fn tracksStack(self: Self) bool {
        return !self.disable_stack;
    }

    /// Check if memory tracking is enabled
    pub fn tracksMemory(self: Self) bool {
        return !self.disable_memory or self.enable_memory;
    }

    /// Encode to JSON
    pub fn toJson(self: Self, allocator: Allocator) ![]u8 {
        var buf = std.ArrayList(u8){};
        defer buf.deinit(allocator);

        try buf.append(allocator, '{');

        var first = true;

        if (self.disable_storage) {
            if (!first) try buf.append(allocator, ',');
            try buf.appendSlice(allocator, "\"disableStorage\":true");
            first = false;
        }

        if (self.disable_stack) {
            if (!first) try buf.append(allocator, ',');
            try buf.appendSlice(allocator, "\"disableStack\":true");
            first = false;
        }

        if (self.disable_memory) {
            if (!first) try buf.append(allocator, ',');
            try buf.appendSlice(allocator, "\"disableMemory\":true");
            first = false;
        }

        if (self.enable_memory) {
            if (!first) try buf.append(allocator, ',');
            try buf.appendSlice(allocator, "\"enableMemory\":true");
            first = false;
        }

        if (self.enable_return_data) {
            if (!first) try buf.append(allocator, ',');
            try buf.appendSlice(allocator, "\"enableReturnData\":true");
            first = false;
        }

        if (self.tracer) |tracer| {
            if (!first) try buf.append(allocator, ',');
            try buf.appendSlice(allocator, "\"tracer\":\"");
            try buf.appendSlice(allocator, tracer);
            try buf.append(allocator, '"');
            first = false;
        }

        if (self.timeout) |timeout| {
            if (!first) try buf.append(allocator, ',');
            try buf.appendSlice(allocator, "\"timeout\":\"");
            try buf.appendSlice(allocator, timeout);
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

        var result = Self.from();

        if (obj.get("disableStorage")) |val| {
            if (val == .bool) result.disable_storage = val.bool;
        }
        if (obj.get("disableStack")) |val| {
            if (val == .bool) result.disable_stack = val.bool;
        }
        if (obj.get("disableMemory")) |val| {
            if (val == .bool) result.disable_memory = val.bool;
        }
        if (obj.get("enableMemory")) |val| {
            if (val == .bool) result.enable_memory = val.bool;
        }
        if (obj.get("enableReturnData")) |val| {
            if (val == .bool) result.enable_return_data = val.bool;
        }
        if (obj.get("tracer")) |val| {
            if (val == .string) result.tracer = try allocator.dupe(u8, val.string);
        }
        if (obj.get("timeout")) |val| {
            if (val == .string) result.timeout = try allocator.dupe(u8, val.string);
        }

        return result;
    }
};

// Tests
test "TraceConfig: default creation" {
    const config = TraceConfig.from();

    try testing.expect(!config.disable_storage);
    try testing.expect(!config.disable_stack);
    try testing.expect(!config.disable_memory);
    try testing.expect(!config.enable_memory);
    try testing.expect(!config.enable_return_data);
    try testing.expect(config.tracer == null);
    try testing.expect(config.timeout == null);
}

test "TraceConfig: enableAll" {
    const config = TraceConfig.enableAll();

    try testing.expect(!config.disable_storage);
    try testing.expect(!config.disable_stack);
    try testing.expect(!config.disable_memory);
    try testing.expect(config.enable_memory);
    try testing.expect(config.enable_return_data);
}

test "TraceConfig: disableAll" {
    const config = TraceConfig.disableAll();

    try testing.expect(config.disable_storage);
    try testing.expect(config.disable_stack);
    try testing.expect(config.disable_memory);
    try testing.expect(!config.enable_memory);
    try testing.expect(!config.enable_return_data);
}

test "TraceConfig: withTracer" {
    const config = TraceConfig.withTracer("callTracer");

    try testing.expect(config.tracer != null);
    try testing.expectEqualStrings("callTracer", config.tracer.?);
}

test "TraceConfig: preset tracers" {
    const call = TraceConfig.callTracer();
    try testing.expectEqualStrings("callTracer", call.tracer.?);

    const prestate = TraceConfig.prestateTracer();
    try testing.expectEqualStrings("prestateTracer", prestate.tracer.?);

    const four_byte = TraceConfig.fourByteTracer();
    try testing.expectEqualStrings("4byteTracer", four_byte.tracer.?);
}

test "TraceConfig: equality" {
    const config1 = TraceConfig.from();
    const config2 = TraceConfig.from();
    const config3 = TraceConfig.disableAll();

    try testing.expect(config1.equals(config2));
    try testing.expect(!config1.equals(config3));
}

test "TraceConfig: tracking checks" {
    const default_config = TraceConfig.from();
    try testing.expect(default_config.tracksStorage());
    try testing.expect(default_config.tracksStack());
    try testing.expect(!default_config.tracksMemory()); // false by default

    const disabled = TraceConfig.disableAll();
    try testing.expect(!disabled.tracksStorage());
    try testing.expect(!disabled.tracksStack());
    try testing.expect(!disabled.tracksMemory());

    const enabled = TraceConfig.enableAll();
    try testing.expect(enabled.tracksStorage());
    try testing.expect(enabled.tracksStack());
    try testing.expect(enabled.tracksMemory());
}

test "TraceConfig: hasTracer" {
    const default_config = TraceConfig.from();
    try testing.expect(!default_config.hasTracer());

    const with_tracer = TraceConfig.callTracer();
    try testing.expect(with_tracer.hasTracer());
}

test "TraceConfig: JSON encode default" {
    const allocator = testing.allocator;
    const config = TraceConfig.from();

    const json_str = try config.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expectEqualStrings("{}", json_str);
}

test "TraceConfig: JSON encode with options" {
    const allocator = testing.allocator;
    const config = TraceConfig.disableAll();

    const json_str = try config.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expect(std.mem.indexOf(u8, json_str, "\"disableStorage\":true") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"disableStack\":true") != null);
    try testing.expect(std.mem.indexOf(u8, json_str, "\"disableMemory\":true") != null);
}

test "TraceConfig: JSON encode with tracer" {
    const allocator = testing.allocator;
    const config = TraceConfig.callTracer();

    const json_str = try config.toJson(allocator);
    defer allocator.free(json_str);

    try testing.expect(std.mem.indexOf(u8, json_str, "\"tracer\":\"callTracer\"") != null);
}

test "TraceConfig: JSON roundtrip" {
    const allocator = testing.allocator;

    var config = TraceConfig.disableAll();
    config.tracer = "callTracer";
    config.timeout = "30s";

    const json_str = try config.toJson(allocator);
    defer allocator.free(json_str);

    const decoded = try TraceConfig.fromJson(allocator, json_str);
    defer if (decoded.tracer) |t| allocator.free(t);
    defer if (decoded.timeout) |t| allocator.free(t);

    try testing.expectEqual(config.disable_storage, decoded.disable_storage);
    try testing.expectEqual(config.disable_stack, decoded.disable_stack);
    try testing.expectEqual(config.disable_memory, decoded.disable_memory);
    try testing.expectEqualStrings("callTracer", decoded.tracer.?);
    try testing.expectEqualStrings("30s", decoded.timeout.?);
}
