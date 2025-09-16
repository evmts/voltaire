# JSON-RPC Tracer Design Document

## Overview

This document outlines the design for implementing a JSON-RPC tracer that streams EVM execution traces using Zig 0.15's new Reader/Writer interfaces. The tracer will wrap the existing `DefaultTracer` while providing streaming trace output compatible with Ethereum JSON-RPC standards.

## Architecture

### Core Components

1. **JsonRpcTracer** - Main tracer implementation that wraps DefaultTracer
2. **TraceEventWriter** - Custom Writer implementation for streaming trace events
3. **TraceEvent** - Structured representation of execution events
4. **JsonSerializer** - Efficient JSON serialization for trace events

### Design Principles

- **Minimal Overhead**: The tracer should add minimal performance impact
- **Streaming First**: Events are streamed as they occur, not buffered
- **Compatible API**: Exact same interface as DefaultTracer
- **Configurable Output**: Support multiple output formats and filters

## Implementation Plan

### Phase 1: Core Infrastructure

#### 1.1 TraceEvent Structure

```zig
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
        opName: []const u8,
        gas: i64,
        gasCost: u64,
        stack: []const u256,
        memory: []const u8,
        memorySize: u32,
        storage: ?std.AutoHashMap(u256, u256),
        depth: u16,
        returnData: []const u8,
        error: ?[]const u8,
    };

    pub const CallData = struct {
        call_type: enum { call, callcode, delegatecall, staticcall },
        from: Address,
        to: Address,
        gas: u64,
        value: u256,
        input: []const u8,
        output: []const u8,
        error: ?[]const u8,
    };

    timestamp: u64,
    event_type: EventType,
    data: union(EventType) {
        execution_start: struct {
            from: Address,
            to: Address,
            value: u256,
            input: []const u8,
            gas: u64,
        },
        execution_end: struct {
            output: []const u8,
            gas_used: u64,
            error: ?[]const u8,
        },
        step: StepData,
        call: CallData,
        call_return: CallData,
        create: struct {
            creator: Address,
            value: u256,
            init_code: []const u8,
            gas: u64,
        },
        create_return: struct {
            address: Address,
            code: []const u8,
            gas_left: u64,
        },
        revert: struct {
            reason: []const u8,
            gas_left: u64,
        },
        selfdestruct: struct {
            address: Address,
            beneficiary: Address,
            balance: u256,
        },
        log: struct {
            address: Address,
            topics: []const u256,
            data: []const u8,
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
            old_code: []const u8,
            new_code: []const u8,
        },
    },
};
```

#### 1.2 TraceEventWriter Implementation

```zig
pub const TraceEventWriter = struct {
    const Self = @This();
    
    // Configuration
    pub const Config = struct {
        format: enum { json, binary, cbor } = .json,
        filter: struct {
            include_memory: bool = true,
            include_stack: bool = true,
            include_storage: bool = true,
            include_return_data: bool = true,
            max_memory_size: ?usize = null,
            max_stack_items: ?usize = null,
        } = .{},
        buffer_size: usize = 4096,
    };
    
    // The Writer interface
    writer: std.io.Writer,
    config: Config,
    allocator: std.mem.Allocator,
    
    // Statistics
    events_written: u64,
    bytes_written: u64,
    
    // Event queue for buffering (optional)
    event_buffer: ?std.ArrayList(TraceEvent),
    
    pub fn init(allocator: std.mem.Allocator, underlying_writer: anytype, config: Config) !Self {
        const buffer = try allocator.alloc(u8, config.buffer_size);
        
        return Self{
            .writer = std.io.Writer{
                .buffer = buffer,
                .vtable = &.{ .drain = Self.drain },
            },
            .config = config,
            .allocator = allocator,
            .events_written = 0,
            .bytes_written = 0,
            .event_buffer = if (config.buffer_size > 0) 
                std.ArrayList(TraceEvent).init(allocator) 
            else 
                null,
        };
    }
    
    pub fn writeEvent(self: *Self, event: TraceEvent) !void {
        switch (self.config.format) {
            .json => try self.writeJsonEvent(event),
            .binary => try self.writeBinaryEvent(event),
            .cbor => try self.writeCborEvent(event),
        }
        self.events_written += 1;
    }
    
    fn writeJsonEvent(self: *Self, event: TraceEvent) !void {
        // Serialize to JSON and write to underlying writer
        var json_buffer = std.ArrayList(u8).init(self.allocator);
        defer json_buffer.deinit();
        
        try serializeEventToJson(&json_buffer, event, self.config.filter);
        
        // Write JSON line
        try self.writer.writeAll(json_buffer.items);
        try self.writer.writeByte('\n');
        
        self.bytes_written += json_buffer.items.len + 1;
    }
    
    fn drain(w: *std.io.Writer, data: []const []const u8, splat: usize) std.io.Writer.Error!usize {
        _ = splat;
        const self = @fieldParentPtr(Self, "writer", w);
        
        // Write the first data slice to underlying output
        const slice = data[0];
        
        // In real implementation, write to actual destination
        // For now, just count bytes
        self.bytes_written += slice.len;
        
        return slice.len;
    }
};
```

### Phase 2: JsonRpcTracer Implementation

#### 2.1 Main Tracer Structure

```zig
pub const JsonRpcTracer = struct {
    const Self = @This();
    
    // Underlying default tracer for validation
    default_tracer: DefaultTracer,
    
    // Output writer for trace events
    trace_writer: ?*TraceEventWriter,
    
    // Configuration
    config: struct {
        enable_validation: bool = true,
        enable_streaming: bool = true,
        include_minimal_evm: bool = false,
        trace_format: TraceEventWriter.Config.format = .json,
    },
    
    // Allocator for this tracer
    allocator: std.mem.Allocator,
    
    // Current execution context
    current_depth: u16,
    execution_stack: std.ArrayList(ExecutionContext),
    
    // Temporary event buffer for atomic operations
    pending_events: std.ArrayList(TraceEvent),
    
    const ExecutionContext = struct {
        caller: Address,
        address: Address,
        value: u256,
        input: []const u8,
        gas_start: i64,
        depth: u16,
        call_type: ?TraceEvent.CallData.call_type,
    };
    
    pub fn init(allocator: std.mem.Allocator, output_writer: ?*std.io.Writer) !Self {
        var self = Self{
            .default_tracer = DefaultTracer.init(allocator),
            .trace_writer = null,
            .config = .{},
            .allocator = allocator,
            .current_depth = 0,
            .execution_stack = std.ArrayList(ExecutionContext).init(allocator),
            .pending_events = std.ArrayList(TraceEvent).init(allocator),
        };
        
        // Set up trace writer if output provided
        if (output_writer) |writer| {
            self.trace_writer = try allocator.create(TraceEventWriter);
            self.trace_writer.* = try TraceEventWriter.init(
                allocator,
                writer,
                .{ .format = self.config.trace_format }
            );
        }
        
        return self;
    }
    
    pub fn deinit(self: *Self) void {
        // Clean up trace writer
        if (self.trace_writer) |writer| {
            writer.writer.flush() catch {};
            self.allocator.destroy(writer);
        }
        
        // Clean up default tracer
        self.default_tracer.deinit();
        
        // Clean up buffers
        self.execution_stack.deinit();
        self.pending_events.deinit();
    }
    
    // ========================================================================
    // DefaultTracer API Implementation (delegates to default_tracer)
    // ========================================================================
    
    pub fn initPcTracker(self: *Self, bytecode: []const u8) void {
        self.default_tracer.initPcTracker(bytecode);
    }
    
    pub fn onInterpret(self: *Self, frame: anytype, bytecode: []const u8, gas_limit: i64) void {
        // Delegate to default tracer for validation
        if (self.config.enable_validation) {
            self.default_tracer.onInterpret(frame, bytecode, gas_limit);
        }
        
        // Record execution start event
        if (self.trace_writer) |writer| {
            const main_evm = frame.getEvm();
            const event = TraceEvent{
                .timestamp = std.time.timestamp(),
                .event_type = .execution_start,
                .data = .{
                    .execution_start = .{
                        .from = if (@hasField(@TypeOf(frame.*), "caller")) frame.caller else primitives.ZERO_ADDRESS,
                        .to = if (@hasField(@TypeOf(frame.*), "contract_address")) frame.contract_address else primitives.ZERO_ADDRESS,
                        .value = if (@hasField(@TypeOf(frame.*), "value")) frame.value else 0,
                        .input = if (@hasField(@TypeOf(frame.*), "calldata_slice")) frame.calldata_slice else &.{},
                        .gas = @intCast(gas_limit),
                    },
                },
            };
            
            writer.writeEvent(event) catch |err| {
                log.warn("Failed to write execution_start event: {any}", .{err});
            };
        }
        
        // Track execution context
        const ctx = ExecutionContext{
            .caller = if (@hasField(@TypeOf(frame.*), "caller")) frame.caller else primitives.ZERO_ADDRESS,
            .address = if (@hasField(@TypeOf(frame.*), "contract_address")) frame.contract_address else primitives.ZERO_ADDRESS,
            .value = if (@hasField(@TypeOf(frame.*), "value")) frame.value else 0,
            .input = if (@hasField(@TypeOf(frame.*), "calldata_slice")) frame.calldata_slice else &.{},
            .gas_start = gas_limit,
            .depth = self.current_depth,
            .call_type = null,
        };
        self.execution_stack.append(ctx) catch {};
    }
    
    pub fn before_instruction(
        self: *Self,
        frame: anytype,
        comptime opcode: UnifiedOpcode,
        cursor: [*]const @TypeOf(frame.*).Dispatch.Item
    ) void {
        // Always delegate to default tracer for validation
        if (self.config.enable_validation) {
            self.default_tracer.before_instruction(frame, opcode, cursor);
        }
        
        // Record step event if streaming
        if (self.config.enable_streaming and self.trace_writer != null) {
            self.recordStepEvent(frame, opcode) catch |err| {
                log.warn("Failed to record step event: {any}", .{err});
            };
        }
    }
    
    pub fn after_instruction(
        self: *Self,
        frame: anytype,
        comptime opcode: UnifiedOpcode,
        next_handler: anytype,
        next_cursor: [*]const @TypeOf(frame.*).Dispatch.Item
    ) void {
        // Delegate to default tracer
        if (self.config.enable_validation) {
            self.default_tracer.after_instruction(frame, opcode, next_handler, next_cursor);
        }
        
        // Check for special opcodes that generate events
        switch (opcode) {
            .CALL, .CALLCODE, .DELEGATECALL, .STATICCALL => {
                self.recordCallEvent(frame, opcode) catch {};
            },
            .CREATE, .CREATE2 => {
                self.recordCreateEvent(frame, opcode) catch {};
            },
            .LOG0, .LOG1, .LOG2, .LOG3, .LOG4 => {
                self.recordLogEvent(frame, opcode) catch {};
            },
            .SSTORE => {
                self.recordStorageEvent(frame, opcode) catch {};
            },
            .SELFDESTRUCT => {
                self.recordSelfdestructEvent(frame, opcode) catch {};
            },
            else => {},
        }
    }
    
    pub fn after_complete(
        self: *Self,
        frame: anytype,
        comptime opcode: UnifiedOpcode
    ) void {
        // Delegate to default tracer
        if (self.config.enable_validation) {
            self.default_tracer.after_complete(frame, opcode);
        }
        
        // Record completion events
        switch (opcode) {
            .STOP, .RETURN => {
                self.recordExecutionEnd(frame, false) catch {};
            },
            .REVERT => {
                self.recordExecutionEnd(frame, true) catch {};
            },
            else => {},
        }
    }
    
    // ========================================================================
    // Event Recording Functions
    // ========================================================================
    
    fn recordStepEvent(self: *Self, frame: anytype, comptime opcode: UnifiedOpcode) !void {
        if (self.trace_writer == null) return;
        
        const opcode_value = @intFromEnum(opcode);
        const opcode_name = @tagName(opcode);
        
        // Capture current state
        const stack_slice = frame.stack.get_slice();
        var stack_copy = try self.allocator.alloc(u256, stack_slice.len);
        @memcpy(stack_copy, stack_slice);
        
        const event = TraceEvent{
            .timestamp = std.time.timestamp(),
            .event_type = .step,
            .data = .{
                .step = .{
                    .pc = if (self.default_tracer.minimal_evm) |evm| evm.getPC() else 0,
                    .op = @intCast(opcode_value & 0xFF),
                    .opName = opcode_name,
                    .gas = frame.gas_remaining,
                    .gasCost = 0, // Will be calculated by comparing before/after
                    .stack = stack_copy,
                    .memory = &.{}, // TODO: Add memory capture
                    .memorySize = if (@hasField(@TypeOf(frame.*), "memory")) frame.memory.size() else 0,
                    .storage = null,
                    .depth = self.current_depth,
                    .returnData = &.{},
                    .error = null,
                },
            },
        };
        
        try self.trace_writer.?.writeEvent(event);
    }
    
    fn recordCallEvent(self: *Self, frame: anytype, comptime opcode: UnifiedOpcode) !void {
        _ = frame;
        _ = opcode;
        // TODO: Implement call event recording
    }
    
    fn recordCreateEvent(self: *Self, frame: anytype, comptime opcode: UnifiedOpcode) !void {
        _ = frame;
        _ = opcode;
        // TODO: Implement create event recording
    }
    
    fn recordLogEvent(self: *Self, frame: anytype, comptime opcode: UnifiedOpcode) !void {
        _ = frame;
        _ = opcode;
        // TODO: Implement log event recording
    }
    
    fn recordStorageEvent(self: *Self, frame: anytype, comptime opcode: UnifiedOpcode) !void {
        _ = frame;
        _ = opcode;
        // TODO: Implement storage event recording
    }
    
    fn recordSelfdestructEvent(self: *Self, frame: anytype, comptime opcode: UnifiedOpcode) !void {
        _ = frame;
        _ = opcode;
        // TODO: Implement selfdestruct event recording
    }
    
    fn recordExecutionEnd(self: *Self, frame: anytype, reverted: bool) !void {
        if (self.trace_writer == null) return;
        
        const event = TraceEvent{
            .timestamp = std.time.timestamp(),
            .event_type = .execution_end,
            .data = .{
                .execution_end = .{
                    .output = if (@hasField(@TypeOf(frame.*), "output")) frame.output else &.{},
                    .gas_used = if (self.execution_stack.items.len > 0) 
                        @intCast(self.execution_stack.items[self.execution_stack.items.len - 1].gas_start - frame.gas_remaining)
                    else 
                        0,
                    .error = if (reverted) "execution reverted" else null,
                },
            },
        };
        
        try self.trace_writer.?.writeEvent(event);
        
        // Pop execution context
        if (self.execution_stack.items.len > 0) {
            _ = self.execution_stack.pop();
        }
    }
    
    // ========================================================================
    // Delegated DefaultTracer Methods
    // ========================================================================
    
    pub fn debug(self: *Self, comptime format: []const u8, args: anytype) void {
        self.default_tracer.debug(format, args);
    }
    
    pub fn err(self: *Self, comptime format: []const u8, args: anytype) void {
        self.default_tracer.err(format, args);
    }
    
    pub fn warn(self: *Self, comptime format: []const u8, args: anytype) void {
        self.default_tracer.warn(format, args);
    }
    
    pub fn info(self: *Self, comptime format: []const u8, args: anytype) void {
        self.default_tracer.info(format, args);
    }
    
    pub fn assert(self: *Self, condition: bool, comptime message: []const u8) void {
        self.default_tracer.assert(condition, message);
    }
    
    // ... (delegate all other DefaultTracer methods)
};
```

### Phase 3: JSON Serialization

#### 3.1 Efficient JSON Serialization

```zig
fn serializeEventToJson(
    buffer: *std.ArrayList(u8),
    event: TraceEvent,
    filter: TraceEventWriter.Config.filter
) !void {
    const writer = buffer.writer();
    
    try writer.writeByte('{');
    
    // Write timestamp
    try std.fmt.format(writer, "\"timestamp\":{d},", .{event.timestamp});
    
    // Write event type
    try std.fmt.format(writer, "\"type\":\"{s}\",", .{@tagName(event.event_type)});
    
    // Write event-specific data
    switch (event.data) {
        .step => |step| {
            try writer.writeAll("\"data\":{");
            try std.fmt.format(writer, "\"pc\":{d},", .{step.pc});
            try std.fmt.format(writer, "\"op\":{d},", .{step.op});
            try std.fmt.format(writer, "\"opName\":\"{s}\",", .{step.opName});
            try std.fmt.format(writer, "\"gas\":\"{x}\",", .{step.gas});
            try std.fmt.format(writer, "\"gasCost\":\"{x}\",", .{step.gasCost});
            
            if (filter.include_stack) {
                try writer.writeAll("\"stack\":[");
                const max_items = filter.max_stack_items orelse step.stack.len;
                for (step.stack[0..@min(max_items, step.stack.len)], 0..) |item, i| {
                    if (i > 0) try writer.writeByte(',');
                    try std.fmt.format(writer, "\"{x:0>64}\"", .{item});
                }
                try writer.writeAll("],");
            }
            
            if (filter.include_memory) {
                try writer.writeAll("\"memorySize\":");
                try std.fmt.format(writer, "{d},", .{step.memorySize});
            }
            
            try std.fmt.format(writer, "\"depth\":{d}", .{step.depth});
            try writer.writeByte('}');
        },
        
        .execution_start => |data| {
            try writer.writeAll("\"data\":{");
            try std.fmt.format(writer, "\"from\":\"{x:0>40}\",", .{primitives.Address.to_u256(data.from)});
            try std.fmt.format(writer, "\"to\":\"{x:0>40}\",", .{primitives.Address.to_u256(data.to)});
            try std.fmt.format(writer, "\"value\":\"{x}\",", .{data.value});
            try std.fmt.format(writer, "\"gas\":\"{x}\"", .{data.gas});
            try writer.writeByte('}');
        },
        
        .execution_end => |data| {
            try writer.writeAll("\"data\":{");
            try std.fmt.format(writer, "\"gasUsed\":\"{x}\",", .{data.gas_used});
            if (data.error) |err_msg| {
                try std.fmt.format(writer, "\"error\":\"{s}\"", .{err_msg});
            } else {
                try writer.writeAll("\"error\":null");
            }
            try writer.writeByte('}');
        },
        
        // ... handle other event types
        else => {
            try writer.writeAll("\"data\":{}");
        },
    }
    
    try writer.writeByte('}');
}
```

### Phase 4: Integration with Existing System

#### 4.1 Frame Integration

The Frame will need minimal changes:
1. Add a configuration option to select tracer type
2. Initialize JsonRpcTracer instead of DefaultTracer when configured
3. Provide Writer interface for output destination

#### 4.2 Tracer Factory

```zig
pub const TracerType = enum {
    default,
    json_rpc,
    debugging,
    logging,
    file,
};

pub fn createTracer(
    tracer_type: TracerType,
    allocator: std.mem.Allocator,
    output: ?*std.io.Writer
) !*anyopaque {
    return switch (tracer_type) {
        .default => {
            const tracer = try allocator.create(DefaultTracer);
            tracer.* = DefaultTracer.init(allocator);
            return tracer;
        },
        .json_rpc => {
            const tracer = try allocator.create(JsonRpcTracer);
            tracer.* = try JsonRpcTracer.init(allocator, output);
            return tracer;
        },
        // ... other tracer types
    };
}
```

## Testing Strategy

### Unit Tests
1. Test TraceEvent serialization/deserialization
2. Test Writer implementation with mock outputs
3. Test event filtering and buffering
4. Test MinimalEvm synchronization

### Integration Tests
1. Run existing opcode tests with JsonRpcTracer
2. Verify output compatibility with Ethereum tools
3. Performance benchmarks vs DefaultTracer
4. Memory usage analysis

### Differential Tests
1. Compare JsonRpcTracer output with revm traces
2. Validate against known transaction traces
3. Test edge cases (reverts, OOG, nested calls)

## Performance Considerations

### Optimizations
1. **Zero-Copy Streaming**: Events written directly to output without intermediate buffers
2. **Selective Tracing**: Filter events at source to reduce overhead
3. **Compact Binary Format**: Optional binary output for reduced bandwidth
4. **Async Writing**: Option to write events asynchronously

### Benchmarks
- Target: < 5% overhead vs DefaultTracer
- Memory: Constant memory usage regardless of trace size
- Throughput: > 100K events/second

## Compatibility

### JSON-RPC Standards
- Compatible with `debug_traceTransaction` format
- Support for custom trace formats
- Extensible for future EIPs

### Output Formats
1. **Standard JSON-RPC**: Ethereum-compatible format
2. **Compact JSON**: Reduced size for performance
3. **Binary**: Custom efficient format
4. **CBOR**: Standard binary JSON alternative

## Migration Path

### Phase 1: Parallel Implementation
- Implement JsonRpcTracer alongside DefaultTracer
- No breaking changes to existing code
- Optional opt-in via configuration

### Phase 2: Testing and Validation
- Run both tracers in parallel for validation
- Compare outputs and performance
- Fix any discrepancies

### Phase 3: Default Switch
- Make JsonRpcTracer the default
- Keep DefaultTracer for debugging
- Deprecate old tracing methods

## Open Questions

1. **Buffer Management**: Should we pool buffers for event serialization?
2. **Compression**: Should we support compressed output (gzip/zstd)?
3. **Filtering**: What level of filtering granularity is needed?
4. **State Diffs**: Should we track state changes between steps?
5. **Gas Metering**: How detailed should gas tracking be?

## Next Steps

1. Review and approve design
2. Implement Phase 1 (Core Infrastructure)
3. Create unit tests for TraceEvent and Writer
4. Implement Phase 2 (JsonRpcTracer)
5. Integration testing with existing tests
6. Performance benchmarking
7. Documentation and examples

## References

- [Zig 0.15 I/O Documentation](https://ziglang.org/documentation/0.15.1/)
- [Ethereum JSON-RPC Specification](https://ethereum.github.io/execution-apis/api-documentation/)
- [EIP-3155: EVM Trace Specification](https://eips.ethereum.org/EIPS/eip-3155)
- [go-ethereum Tracer Implementation](https://github.com/ethereum/go-ethereum/tree/master/eth/tracers)