/// Trace collector that streams TraceEvent structs and provides lazy serialization
/// This is more efficient than serializing to JSON during execution
const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

/// Trace event representing a single execution event (same as before but in separate file)
pub const TraceEvent = struct {
    pub const EventType = enum {
        execution_start,
        execution_end,
        step,
        call,
        call_return,
        create,
        create_return,
        revert,
        selfdestruct,
        log,
        storage_change,
        balance_change,
        code_change,
    };

    pub const StepData = struct {
        pc: u32,
        op: u8,
        op_name: []const u8,
        gas: i64,
        gas_cost: u64,
        stack: []u256,  // Note: not const, we own this memory
        memory: []u8,   // Optional memory snapshot
        memory_size: u32,
        depth: u16,
        return_data: []u8,
        error_msg: ?[]const u8,
    };

    pub const CallData = struct {
        call_type: enum { call, callcode, delegatecall, staticcall },
        from: Address,
        to: Address,
        gas: u64,
        value: u256,
        input: []u8,
        output: []u8,
        error_msg: ?[]const u8,
    };

    timestamp: u64,
    event_type: EventType,
    data: union(EventType) {
        execution_start: struct {
            from: Address,
            to: Address,
            value: u256,
            input: []u8,
            gas: u64,
        },
        execution_end: struct {
            output: []u8,
            gas_used: u64,
            error_msg: ?[]const u8,
        },
        step: StepData,
        call: CallData,
        call_return: CallData,
        create: struct {
            creator: Address,
            value: u256,
            init_code: []u8,
            gas: u64,
        },
        create_return: struct {
            address: Address,
            code: []u8,
            gas_left: u64,
        },
        revert: struct {
            reason: []u8,
            gas_left: u64,
        },
        selfdestruct: struct {
            address: Address,
            beneficiary: Address,
            balance: u256,
        },
        log: struct {
            address: Address,
            topics: []u256,
            data: []u8,
        },
        storage_change: struct {
            address: Address,
            slot: u256,
            old_value: u256,
            new_value: u256,
        },
        balance_change: struct {
            address: Address,
            old_balance: u256,
            new_balance: u256,
        },
        code_change: struct {
            address: Address,
            old_code: []u8,
            new_code: []u8,
        },
    },

    /// Free memory allocated for this event
    pub fn deinit(self: *TraceEvent, allocator: std.mem.Allocator) void {
        switch (self.data) {
            .step => |*step| {
                if (step.stack.len > 0) allocator.free(step.stack);
                if (step.memory.len > 0) allocator.free(step.memory);
                if (step.return_data.len > 0) allocator.free(step.return_data);
            },
            .execution_start => |*start| {
                if (start.input.len > 0) allocator.free(start.input);
            },
            .execution_end => |*end| {
                if (end.output.len > 0) allocator.free(end.output);
            },
            .call, .call_return => |*call| {
                if (call.input.len > 0) allocator.free(call.input);
                if (call.output.len > 0) allocator.free(call.output);
            },
            .create => |*create| {
                if (create.init_code.len > 0) allocator.free(create.init_code);
            },
            .create_return => |*ret| {
                if (ret.code.len > 0) allocator.free(ret.code);
            },
            .revert => |*rev| {
                if (rev.reason.len > 0) allocator.free(rev.reason);
            },
            .log => |*log| {
                if (log.topics.len > 0) allocator.free(log.topics);
                if (log.data.len > 0) allocator.free(log.data);
            },
            .code_change => |*change| {
                if (change.old_code.len > 0) allocator.free(change.old_code);
                if (change.new_code.len > 0) allocator.free(change.new_code);
            },
            else => {},
        }
    }
};

/// Event collector that stores TraceEvents in memory
pub const EventCollector = struct {
    const Self = @This();
    
    events: std.ArrayList(TraceEvent),
    allocator: std.mem.Allocator,
    config: Config,
    
    pub const Config = struct {
        max_events: ?usize = null,  // Limit number of events
        include_memory: bool = true,
        include_stack: bool = true,
        include_storage: bool = true,
        max_memory_size: ?usize = null,
        max_stack_items: ?usize = null,
    };
    
    pub fn init(allocator: std.mem.Allocator, config: Config) Self {
        return .{
            .events = std.ArrayList(TraceEvent){},
            .allocator = allocator,
            .config = config,
        };
    }
    
    pub fn deinit(self: *Self) void {
        // Free all events
        for (self.events.items) |*event| {
            event.deinit(self.allocator);
        }
        self.events.deinit(self.allocator);
    }
    
    pub fn addEvent(self: *Self, event: TraceEvent) !void {
        // Check if we've hit the event limit
        if (self.config.max_events) |max| {
            if (self.events.items.len >= max) {
                return; // Silently drop events beyond limit
            }
        }
        
        try self.events.append(self.allocator, event);
    }
    
    /// Create a step event with owned copies of data
    pub fn createStepEvent(
        self: *Self,
        pc: u32,
        op: u8,
        op_name: []const u8,
        gas: i64,
        gas_cost: u64,
        stack: []const u256,
        memory_size: u32,
        depth: u16,
    ) !TraceEvent {
        // Copy stack data if included
        var stack_copy: []u256 = &.{};
        if (self.config.include_stack and stack.len > 0) {
            const max_items = self.config.max_stack_items orelse stack.len;
            const items_to_copy = @min(max_items, stack.len);
            stack_copy = try self.allocator.alloc(u256, items_to_copy);
            @memcpy(stack_copy, stack[0..items_to_copy]);
        }
        
        return TraceEvent{
            .timestamp = @intCast(std.time.timestamp()),
            .event_type = .step,
            .data = .{
                .step = .{
                    .pc = pc,
                    .op = op,
                    .op_name = op_name,
                    .gas = gas,
                    .gas_cost = gas_cost,
                    .stack = stack_copy,
                    .memory = &.{},  // Memory snapshot optional
                    .memory_size = memory_size,
                    .depth = depth,
                    .return_data = &.{},
                    .error_msg = null,
                },
            },
        };
    }
    
    /// Serialize all events to JSON
    pub fn toJson(self: *const Self, writer: anytype) !void {
        for (self.events.items) |event| {
            try self.serializeEvent(writer, event);
            try writer.writeByte('\n');
        }
    }
    
    /// Serialize a single event to JSON
    fn serializeEvent(self: *const Self, writer: anytype, event: TraceEvent) !void {
        _ = self;
        
        try writer.writeByte('{');
        try std.fmt.format(writer, "\"timestamp\":{d},", .{event.timestamp});
        try std.fmt.format(writer, "\"type\":\"{s}\",", .{@tagName(event.event_type)});
        try writer.writeAll("\"data\":");
        
        switch (event.data) {
            .step => |step| {
                try writer.writeByte('{');
                try std.fmt.format(writer, "\"pc\":{d},", .{step.pc});
                try std.fmt.format(writer, "\"op\":{d},", .{step.op});
                try std.fmt.format(writer, "\"opName\":\"{s}\",", .{step.op_name});
                try std.fmt.format(writer, "\"gas\":\"{x}\",", .{step.gas});
                try std.fmt.format(writer, "\"gasCost\":\"{x}\",", .{step.gas_cost});
                
                // Stack
                try writer.writeAll("\"stack\":[");
                for (step.stack, 0..) |item, i| {
                    if (i > 0) try writer.writeByte(',');
                    try std.fmt.format(writer, "\"0x{x:0>64}\"", .{item});
                }
                try writer.writeAll("],");
                
                try std.fmt.format(writer, "\"memSize\":{d},", .{step.memory_size});
                try std.fmt.format(writer, "\"depth\":{d}", .{step.depth});
                try writer.writeByte('}');
            },
            
            .execution_start => |data| {
                try writer.writeByte('{');
                try std.fmt.format(writer, "\"from\":\"0x{x:0>40}\",", .{primitives.Address.to_u256(data.from) & (((@as(u256, 1) << 160) - 1))});
                try std.fmt.format(writer, "\"to\":\"0x{x:0>40}\",", .{primitives.Address.to_u256(data.to) & (((@as(u256, 1) << 160) - 1))});
                try std.fmt.format(writer, "\"value\":\"0x{x}\",", .{data.value});
                try std.fmt.format(writer, "\"gas\":\"0x{x}\",", .{data.gas});
                try writer.writeAll("\"input\":\"0x");
                for (data.input) |byte| {
                    try std.fmt.format(writer, "{x:0>2}", .{byte});
                }
                try writer.writeAll("\"");
                try writer.writeByte('}');
            },
            
            .execution_end => |data| {
                try writer.writeByte('{');
                try std.fmt.format(writer, "\"gasUsed\":\"0x{x}\",", .{data.gas_used});
                try writer.writeAll("\"output\":\"0x");
                for (data.output) |byte| {
                    try std.fmt.format(writer, "{x:0>2}", .{byte});
                }
                try writer.writeAll("\",");
                if (data.error_msg) |err| {
                    try std.fmt.format(writer, "\"error\":\"{s}\"", .{err});
                } else {
                    try writer.writeAll("\"error\":null");
                }
                try writer.writeByte('}');
            },
            
            .storage_change => |data| {
                try writer.writeByte('{');
                try std.fmt.format(writer, "\"address\":\"0x{x:0>40}\",", .{primitives.Address.to_u256(data.address) & (((@as(u256, 1) << 160) - 1))});
                try std.fmt.format(writer, "\"slot\":\"0x{x:0>64}\",", .{data.slot});
                try std.fmt.format(writer, "\"oldValue\":\"0x{x:0>64}\",", .{data.old_value});
                try std.fmt.format(writer, "\"newValue\":\"0x{x:0>64}\"", .{data.new_value});
                try writer.writeByte('}');
            },
            
            else => {
                try writer.writeAll("{}");
            },
        }
        
        try writer.writeByte('}');
    }
    
    /// Get events as a slice
    pub fn getEvents(self: *const Self) []const TraceEvent {
        return self.events.items;
    }
    
    /// Clear all events
    pub fn clear(self: *Self) void {
        for (self.events.items) |*event| {
            event.deinit(self.allocator);
        }
        self.events.clearRetainingCapacity();
    }
};

/// Streaming event writer that can write to any destination
pub const StreamingEventWriter = struct {
    const Self = @This();
    
    writer: std.io.AnyWriter,
    format: Format,
    allocator: std.mem.Allocator,
    
    pub const Format = enum {
        json,
        binary,
        cbor,
    };
    
    pub fn init(allocator: std.mem.Allocator, writer: std.io.AnyWriter, format: Format) Self {
        return .{
            .writer = writer,
            .format = format,
            .allocator = allocator,
        };
    }
    
    pub fn writeEvent(self: *Self, event: TraceEvent) !void {
        switch (self.format) {
            .json => {
                var collector = EventCollector.init(self.allocator, .{});
                defer collector.deinit();
                try collector.serializeEvent(self.writer, event);
                try self.writer.writeByte('\n');
            },
            .binary => {
                // Write binary format (could use std.io.Writer.writeStruct)
                return error.NotImplemented;
            },
            .cbor => {
                return error.NotImplemented;
            },
        }
    }
};