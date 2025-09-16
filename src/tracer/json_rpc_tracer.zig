/// JSON-RPC Tracer implementation that wraps DefaultTracer and provides streaming trace output
/// Compatible with Ethereum JSON-RPC standards for transaction tracing
const std = @import("std");
const log = @import("../log.zig");
const primitives = @import("primitives");
const DefaultTracer = @import("tracer.zig").DefaultTracer;
const UnifiedOpcode = @import("../opcodes/opcode.zig").UnifiedOpcode;
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.ZERO_ADDRESS;

/// Trace event representing a single execution event
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
        stack: []const u256,
        memory: []const u8,
        memory_size: u32,
        depth: u16,
        return_data: []const u8,
        error_msg: ?[]const u8,
    };

    pub const CallData = struct {
        call_type: enum { call, callcode, delegatecall, staticcall },
        from: Address,
        to: Address,
        gas: u64,
        value: u256,
        input: []const u8,
        output: []const u8,
        error_msg: ?[]const u8,
    };

    pub const CreateData = struct {
        creator: Address,
        value: u256,
        init_code: []const u8,
        gas: u64,
    };

    pub const CreateReturnData = struct {
        address: Address,
        code: []const u8,
        gas_left: u64,
    };

    pub const LogData = struct {
        address: Address,
        topics: []const u256,
        data: []const u8,
    };

    pub const StorageChangeData = struct {
        address: Address,
        slot: u256,
        old_value: u256,
        new_value: u256,
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
            error_msg: ?[]const u8,
        },
        step: StepData,
        call: CallData,
        call_return: CallData,
        create: CreateData,
        create_return: CreateReturnData,
        revert: struct {
            reason: []const u8,
            gas_left: u64,
        },
        selfdestruct: struct {
            address: Address,
            beneficiary: Address,
            balance: u256,
        },
        log: LogData,
        storage_change: StorageChangeData,
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

/// Writer implementation for streaming trace events
pub const TraceEventWriter = struct {
    const Self = @This();
    
    /// Configuration for the trace writer
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
    
    /// The underlying writer we write to
    underlying: std.io.AnyWriter,
    config: Config,
    allocator: std.mem.Allocator,
    
    /// Statistics
    events_written: u64,
    bytes_written: u64,
    
    /// Internal buffer for JSON formatting
    json_buffer: std.ArrayList(u8),
    
    pub fn init(allocator: std.mem.Allocator, writer: std.io.AnyWriter, config: Config) !Self {
        return Self{
            .underlying = writer,
            .config = config,
            .allocator = allocator,
            .events_written = 0,
            .bytes_written = 0,
            .json_buffer = std.ArrayList(u8).init(allocator),
        };
    }
    
    pub fn deinit(self: *Self) void {
        self.json_buffer.deinit();
    }
    
    pub fn writeEvent(self: *Self, event: TraceEvent) !void {
        switch (self.config.format) {
            .json => try self.writeJsonEvent(event),
            .binary => try self.writeBinaryEvent(event),
            .cbor => return error.NotImplemented,
        }
        self.events_written += 1;
    }
    
    fn writeJsonEvent(self: *Self, event: TraceEvent) !void {
        // Clear buffer for new event
        self.json_buffer.clearRetainingCapacity();
        
        try self.serializeEventToJson(event);
        
        // Write JSON line to underlying writer
        try self.underlying.writeAll(self.json_buffer.items);
        try self.underlying.writeByte('\n');
        
        self.bytes_written += self.json_buffer.items.len + 1;
    }
    
    fn writeBinaryEvent(self: *Self, event: TraceEvent) !void {
        _ = self;
        _ = event;
        return error.NotImplemented;
    }
    
    fn serializeEventToJson(self: *Self, event: TraceEvent) !void {
        const writer = self.json_buffer.writer();
        
        try writer.writeByte('{');
        
        // Write timestamp
        try std.fmt.format(writer, "\"timestamp\":{d},", .{event.timestamp});
        
        // Write event type
        try std.fmt.format(writer, "\"type\":\"{s}\",", .{@tagName(event.event_type)});
        
        // Write event-specific data
        try writer.writeAll("\"data\":");
        switch (event.data) {
            .step => |step| {
                try writer.writeByte('{');
                try std.fmt.format(writer, "\"pc\":{d},", .{step.pc});
                try std.fmt.format(writer, "\"op\":{d},", .{step.op});
                try std.fmt.format(writer, "\"opName\":\"{s}\",", .{step.op_name});
                try std.fmt.format(writer, "\"gas\":\"{x}\",", .{step.gas});
                try std.fmt.format(writer, "\"gasCost\":\"{x}\",", .{step.gas_cost});
                
                if (self.config.filter.include_stack) {
                    try writer.writeAll("\"stack\":[");
                    const max_items = self.config.filter.max_stack_items orelse step.stack.len;
                    for (step.stack[0..@min(max_items, step.stack.len)], 0..) |item, i| {
                        if (i > 0) try writer.writeByte(',');
                        try std.fmt.format(writer, "\"0x{x:0>64}\"", .{item});
                    }
                    try writer.writeAll("],");
                }
                
                if (self.config.filter.include_memory) {
                    try writer.writeAll("\"memSize\":");
                    try std.fmt.format(writer, "{d},", .{step.memory_size});
                }
                
                try std.fmt.format(writer, "\"depth\":{d}", .{step.depth});
                try writer.writeByte('}');
            },
            
            .execution_start => |data| {
                try writer.writeByte('{');
                try std.fmt.format(writer, "\"from\":\"0x{x:0>40}\",", .{primitives.Address.to_u256(data.from) & (((@as(u256, 1) << 160) - 1))});
                try std.fmt.format(writer, "\"to\":\"0x{x:0>40}\",", .{primitives.Address.to_u256(data.to) & (((@as(u256, 1) << 160) - 1))});
                try std.fmt.format(writer, "\"value\":\"0x{x}\",", .{data.value});
                try std.fmt.format(writer, "\"gas\":\"0x{x}\",", .{data.gas});
                
                // Include input data as hex string
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
                
                // Include output data as hex string
                try writer.writeAll("\"output\":\"0x");
                for (data.output) |byte| {
                    try std.fmt.format(writer, "{x:0>2}", .{byte});
                }
                try writer.writeAll("\",");
                
                if (data.error_msg) |err_msg| {
                    try std.fmt.format(writer, "\"error\":\"{s}\"", .{err_msg});
                } else {
                    try writer.writeAll("\"error\":null");
                }
                try writer.writeByte('}');
            },
            
            .call => |data| {
                try writer.writeByte('{');
                try std.fmt.format(writer, "\"type\":\"{s}\",", .{@tagName(data.call_type)});
                try std.fmt.format(writer, "\"from\":\"0x{x:0>40}\",", .{primitives.Address.to_u256(data.from) & (((@as(u256, 1) << 160) - 1))});
                try std.fmt.format(writer, "\"to\":\"0x{x:0>40}\",", .{primitives.Address.to_u256(data.to) & (((@as(u256, 1) << 160) - 1))});
                try std.fmt.format(writer, "\"gas\":\"0x{x}\",", .{data.gas});
                try std.fmt.format(writer, "\"value\":\"0x{x}\"", .{data.value});
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
};

/// JSON-RPC Tracer that wraps DefaultTracer and provides streaming output
pub const JsonRpcTracer = struct {
    const Self = @This();
    
    /// Underlying default tracer for validation
    default_tracer: DefaultTracer,
    
    /// Output writer for trace events
    trace_writer: ?*TraceEventWriter,
    
    /// Configuration
    config: struct {
        enable_validation: bool = true,
        enable_streaming: bool = true,
        include_minimal_evm: bool = false,
    },
    
    /// Allocator for this tracer
    allocator: std.mem.Allocator,
    
    /// Current execution context
    current_depth: u16,
    execution_stack: std.ArrayList(ExecutionContext),
    
    /// Track gas before instruction for cost calculation
    last_gas: i64,
    
    const ExecutionContext = struct {
        caller: Address,
        address: Address,
        value: u256,
        input: []const u8,
        gas_start: i64,
        depth: u16,
    };
    
    pub fn init(allocator: std.mem.Allocator) Self {
        return .{
            .default_tracer = DefaultTracer.init(allocator),
            .trace_writer = null,
            .config = .{},
            .allocator = allocator,
            .current_depth = 0,
            .execution_stack = std.ArrayList(ExecutionContext).init(allocator),
            .last_gas = 0,
        };
    }
    
    pub fn initWithWriter(allocator: std.mem.Allocator, writer: std.io.AnyWriter) !Self {
        var self = init(allocator);
        
        // Create trace writer
        self.trace_writer = try allocator.create(TraceEventWriter);
        self.trace_writer.* = try TraceEventWriter.init(
            allocator,
            writer,
            .{ .format = .json }
        );
        
        return self;
    }
    
    pub fn deinit(self: *Self) void {
        // Clean up trace writer
        if (self.trace_writer) |writer| {
            writer.deinit();
            self.allocator.destroy(writer);
        }
        
        // Clean up default tracer
        self.default_tracer.deinit();
        
        // Clean up buffers
        self.execution_stack.deinit();
    }
    
    // ========================================================================
    // DefaultTracer API Implementation
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
            const event = TraceEvent{
                .timestamp = @intCast(std.time.timestamp()),
                .event_type = .execution_start,
                .data = .{
                    .execution_start = .{
                        .from = if (@hasField(@TypeOf(frame.*), "caller")) frame.caller else ZERO_ADDRESS,
                        .to = if (@hasField(@TypeOf(frame.*), "contract_address")) frame.contract_address else ZERO_ADDRESS,
                        .value = if (@hasField(@TypeOf(frame.*), "value")) frame.value else 0,
                        .input = if (@hasField(@TypeOf(frame.*), "calldata_slice")) frame.calldata_slice else &.{},
                        .gas = @intCast(gas_limit),
                    },
                },
            };
            
            writer.writeEvent(event) catch |e| {
                log.warn("Failed to write execution_start event: {any}", .{e});
            };
        }
        
        // Track execution context
        const ctx = ExecutionContext{
            .caller = if (@hasField(@TypeOf(frame.*), "caller")) frame.caller else ZERO_ADDRESS,
            .address = if (@hasField(@TypeOf(frame.*), "contract_address")) frame.contract_address else ZERO_ADDRESS,
            .value = if (@hasField(@TypeOf(frame.*), "value")) frame.value else 0,
            .input = if (@hasField(@TypeOf(frame.*), "calldata_slice")) frame.calldata_slice else &.{},
            .gas_start = gas_limit,
            .depth = self.current_depth,
        };
        self.execution_stack.append(ctx) catch {};
        
        self.last_gas = gas_limit;
    }
    
    pub fn before_instruction(
        self: *Self,
        frame: anytype,
        comptime opcode: UnifiedOpcode,
        cursor: [*]const @TypeOf(frame.*).Dispatch.Item
    ) void {
        // Store gas before for cost calculation
        self.last_gas = frame.gas_remaining;
        
        // Always delegate to default tracer for validation
        if (self.config.enable_validation) {
            self.default_tracer.before_instruction(frame, opcode, cursor);
        }
        
        // Record step event if streaming
        if (self.config.enable_streaming and self.trace_writer != null) {
            self.recordStepEvent(frame, opcode, true) catch |e| {
                log.warn("Failed to record step event: {any}", .{e});
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
        
        // Record step completion with gas cost
        if (self.config.enable_streaming and self.trace_writer != null) {
            self.recordStepEvent(frame, opcode, false) catch |e| {
                log.warn("Failed to record step completion: {any}", .{e});
            };
        }
        
        // Check for special opcodes that generate events
        switch (opcode) {
            .SSTORE => {
                self.recordStorageEvent(frame) catch {};
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
    
    fn recordStepEvent(self: *Self, frame: anytype, comptime opcode: UnifiedOpcode, is_before: bool) !void {
        if (self.trace_writer == null) return;
        
        const opcode_value = @intFromEnum(opcode);
        const opcode_name = @tagName(opcode);
        
        // Only record on before for now to avoid duplicates
        if (!is_before) return;
        
        // Skip synthetic opcodes > 0xFF
        if (opcode_value > 0xFF) return;
        
        // Capture current state
        const stack_slice = frame.stack.get_slice();
        const stack_copy = try self.allocator.alloc(u256, stack_slice.len);
        defer self.allocator.free(stack_copy);
        @memcpy(stack_copy, stack_slice);
        
        // Calculate gas cost
        const gas_cost: u64 = if (self.last_gas > frame.gas_remaining)
            @intCast(self.last_gas - frame.gas_remaining)
        else
            0;
        
        const event = TraceEvent{
            .timestamp = @intCast(std.time.timestamp()),
            .event_type = .step,
            .data = .{
                .step = .{
                    .pc = if (self.default_tracer.minimal_evm) |evm| evm.getPC() else 0,
                    .op = @intCast(opcode_value & 0xFF),
                    .op_name = opcode_name,
                    .gas = frame.gas_remaining,
                    .gas_cost = gas_cost,
                    .stack = stack_copy,
                    .memory = &.{},
                    .memory_size = if (@hasField(@TypeOf(frame.*), "memory")) frame.memory.size() else 0,
                    .depth = self.current_depth,
                    .return_data = &.{},
                    .error_msg = null,
                },
            },
        };
        
        try self.trace_writer.?.writeEvent(event);
    }
    
    fn recordStorageEvent(self: *Self, frame: anytype) !void {
        _ = self;
        _ = frame;
        // TODO: Implement storage event recording
    }
    
    fn recordExecutionEnd(self: *Self, frame: anytype, reverted: bool) !void {
        if (self.trace_writer == null) return;
        
        const event = TraceEvent{
            .timestamp = @intCast(std.time.timestamp()),
            .event_type = .execution_end,
            .data = .{
                .execution_end = .{
                    .output = if (@hasField(@TypeOf(frame.*), "output")) frame.output else &.{},
                    .gas_used = if (self.execution_stack.items.len > 0) 
                        @intCast(self.execution_stack.items[self.execution_stack.items.len - 1].gas_start - frame.gas_remaining)
                    else 
                        0,
                    .error_msg = if (reverted) "execution reverted" else null,
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
    
    pub fn throwError(self: *Self, comptime format: []const u8, args: anytype) noreturn {
        self.default_tracer.throwError(format, args);
    }
    
    pub fn assert(self: *Self, condition: bool, comptime message: []const u8) void {
        self.default_tracer.assert(condition, message);
    }
    
    // EVM lifecycle events
    pub fn onFrameStart(self: *Self, code_len: usize, gas: u64, depth: u16) void {
        self.default_tracer.onFrameStart(code_len, gas, depth);
        self.current_depth = depth;
    }
    
    pub fn onFrameComplete(self: *Self, gas_left: u64, output_len: usize) void {
        self.default_tracer.onFrameComplete(gas_left, output_len);
    }
    
    pub fn onFrameReturn(self: *Self) void {
        self.default_tracer.onFrameReturn();
        if (self.current_depth > 0) self.current_depth -= 1;
    }
    
    pub fn onAccountDelegation(self: *Self, account: []const u8, delegated: []const u8) void {
        self.default_tracer.onAccountDelegation(account, delegated);
    }
    
    pub fn onEmptyAccountAccess(self: *Self) void {
        self.default_tracer.onEmptyAccountAccess();
    }
    
    pub fn onArenaInit(self: *Self, initial_capacity: usize, max_capacity: usize, growth_factor: u32) void {
        self.default_tracer.onArenaInit(initial_capacity, max_capacity, growth_factor);
    }
    
    pub fn onCallStart(self: *Self, call_type: []const u8, gas: i64, to: anytype, value: u256) void {
        self.default_tracer.onCallStart(call_type, gas, to, value);
    }
    
    pub fn onEvmInit(self: *Self, gas_price: u256, origin: anytype, hardfork: []const u8) void {
        self.default_tracer.onEvmInit(gas_price, origin, hardfork);
    }
    
    pub fn onArenaReset(self: *Self, mode: []const u8, capacity_before: usize, capacity_after: usize) void {
        self.default_tracer.onArenaReset(mode, capacity_before, capacity_after);
    }
    
    pub fn onBeaconRootUpdate(self: *Self, success: bool, error_val: ?anyerror) void {
        self.default_tracer.onBeaconRootUpdate(success, error_val);
    }
    
    pub fn onCallComplete(self: *Self, success: bool, gas_left: i64, output_len: usize) void {
        self.default_tracer.onCallComplete(success, gas_left, output_len);
    }
    
    pub fn onCallPreflight(self: *Self, call_type: []const u8, result: []const u8) void {
        self.default_tracer.onCallPreflight(call_type, result);
    }
    
    pub fn onHistoricalBlockHashUpdate(self: *Self, success: bool, error_val: ?anyerror) void {
        self.default_tracer.onHistoricalBlockHashUpdate(success, error_val);
    }
    
    pub fn onCodeRetrieval(self: *Self, address: anytype, code_len: usize, is_empty: bool) void {
        self.default_tracer.onCodeRetrieval(address, code_len, is_empty);
    }
    
    pub fn onValidatorDeposits(self: *Self, success: bool, error_val: ?anyerror) void {
        self.default_tracer.onValidatorDeposits(success, error_val);
    }
    
    pub fn onArenaAlloc(self: *Self, size: usize, alignment: usize, current_capacity: usize) void {
        self.default_tracer.onArenaAlloc(size, alignment, current_capacity);
    }
    
    pub fn onFrameBytecodeInit(self: *Self, bytecode_len: usize, success: bool, error_val: ?anyerror) void {
        self.default_tracer.onFrameBytecodeInit(bytecode_len, success, error_val);
    }
    
    pub fn onValidatorWithdrawals(self: *Self, success: bool, error_val: ?anyerror) void {
        self.default_tracer.onValidatorWithdrawals(success, error_val);
    }
    
    pub fn onArenaGrow(self: *Self, old_capacity: usize, new_capacity: usize, requested_size: usize) void {
        self.default_tracer.onArenaGrow(old_capacity, new_capacity, requested_size);
    }
    
    pub fn onArenaAllocFailed(self: *Self, size: usize, current_capacity: usize, max_capacity: usize) void {
        self.default_tracer.onArenaAllocFailed(size, current_capacity, max_capacity);
    }
    
    pub fn onBytecodeAnalysisStart(self: *Self, code_len: usize) void {
        self.default_tracer.onBytecodeAnalysisStart(code_len);
    }
    
    pub fn onBytecodeAnalysisComplete(self: *Self, validated_up_to: usize, opcode_count: usize, jumpdest_count: usize) void {
        self.default_tracer.onBytecodeAnalysisComplete(validated_up_to, opcode_count, jumpdest_count);
    }
    
    pub fn onInvalidOpcode(self: *Self, pc: usize, opcode: u8) void {
        self.default_tracer.onInvalidOpcode(pc, opcode);
    }
    
    pub fn onJumpdestFound(self: *Self, pc: usize, count: usize) void {
        self.default_tracer.onJumpdestFound(pc, count);
    }
    
    pub fn onScheduleBuildStart(self: *Self, bytecode_len: usize) void {
        self.default_tracer.onScheduleBuildStart(bytecode_len);
    }
    
    pub fn onFusionDetected(self: *Self, pc: usize, fusion_type: []const u8, instruction_count: usize) void {
        self.default_tracer.onFusionDetected(pc, fusion_type, instruction_count);
    }
    
    pub fn onInvalidStaticJump(self: *Self, jump_pc: usize, target_pc: usize) void {
        self.default_tracer.onInvalidStaticJump(jump_pc, target_pc);
    }
    
    pub fn onStaticJumpResolved(self: *Self, jump_pc: usize, target_pc: usize) void {
        self.default_tracer.onStaticJumpResolved(jump_pc, target_pc);
    }
    
    pub fn onTruncatedPush(self: *Self, pc: usize, push_size: u8, available: usize) void {
        self.default_tracer.onTruncatedPush(pc, push_size, available);
    }
    
    pub fn onScheduleBuildComplete(self: *Self, item_count: usize, fusion_count: usize) void {
        self.default_tracer.onScheduleBuildComplete(item_count, fusion_count);
    }
    
    pub fn onJumpTableCreated(self: *Self, jumpdest_count: usize) void {
        self.default_tracer.onJumpTableCreated(jumpdest_count);
    }
};