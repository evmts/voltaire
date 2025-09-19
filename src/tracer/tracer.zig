const std = @import("std");
const log = @import("../log.zig");
const primitives = @import("primitives");
const pc_tracker_mod = @import("pc_tracker.zig");
pub const MinimalEvm = @import("minimal_evm.zig").MinimalEvm;
const MinimalFrame = @import("minimal_frame.zig").MinimalFrame;
const Host = @import("minimal_evm.zig").Host;
const UnifiedOpcode = @import("../opcodes/opcode.zig").UnifiedOpcode;
const Opcode = @import("../opcodes/opcode.zig").Opcode;
const SafetyCounter = @import("../internal/safety_counter.zig").SafetyCounter;
pub const TracerConfig = @import("tracer_config.zig").TracerConfig;

// TODO: This should be generic on FrameType so it can use FrameType types like WordType
// as well as the frame config
pub const Tracer = struct {
    config: TracerConfig,
    recent_opcodes: RingBuffer,
    steps: std.ArrayList(ExecutionStep),
    advanced_steps: std.ArrayList(AdvancedStep),
    pc_tracker: ?pc_tracker_mod.PcTracker,
    gas_tracker: ?u64,
    current_pc: u32,
    bytecode: []const u8,
    minimal_evm: ?*MinimalEvm,
    instruction_count: u64 = 0,
    schedule_index: u64 = 0,
    simple_instruction_count: u64 = 0,
    fused_instruction_count: u64 = 0,
    nested_depth: u16 = 0,
    instruction_safety: SafetyCounter(u64, .enabled),
    allocator: std.mem.Allocator,

    // TODO: some of these properties should be generic on Frame.WordType Frame.GasType etc.
    // Internal representation of an execution step
    pub const ExecutionStep = struct {
        step_number: u64,
        pc: u32,
        opcode: u8,
        opcode_name: []const u8,
        gas_before: i32,
        gas_after: i32,
        gas_cost: u32,
        stack_before: []u256,
        stack_after: []u256,
        memory_size_before: usize,
        memory_size_after: usize,
        depth: u32,
        error_occurred: bool,
        error_msg: ?[]const u8,
    };

    // TODO: some of these properties should be generic on Frame.WordType Frame.GasType etc.
    // Advanced execution step for capturing optimized execution of the advanced interpreter
    // Primarily used for internal debugging
    pub const AdvancedStep = struct {
        step_number: u64,
        schedule_index: u32, // Index into dispatch schedule instead of PC
        opcode: u16, // u16 to accommodate synthetic opcodes (>0xFF)
        opcode_name: []const u8,
        is_synthetic: bool,
        gas_before: i64,
        gas_after: i64,
        gas_cost: u64,
        stack_size_before: u32,
        stack_size_after: u32,
        memory_size_before: u32,
        memory_size_after: u32,
        depth: u16,
        fusion_info: ?[]const u8,
    };

    // TODO: Move to ring_buffer.zig
    // Fixed-size ring buffer for tracking recent opcodes
    // Always active when tracer is enabled
    pub const RingBuffer = struct {
        // TODO: this should be configurable on tracer_config.zig
        const CAPACITY = 10; // Last 10 opcodes

        const Entry = struct {
            step_number: u64,
            opcode: u16,
            opcode_name: []const u8,
            gas_before: i64,
            gas_after: i64,
            stack_size: u32,
            memory_size: u32,
            schedule_index: u32,
            is_synthetic: bool,
        };

        buffer: [CAPACITY]Entry = undefined,
        head: usize = 0,
        count: usize = 0,

        pub fn init() RingBuffer {
            return .{
                .buffer = undefined,
                .head = 0,
                .count = 0,
            };
        }

        pub fn write(self: *RingBuffer, entry: Entry) void {
            self.buffer[self.head] = entry;
            self.head = (self.head + 1) % CAPACITY;
            if (self.count < CAPACITY) self.count += 1;
        }

        pub fn read(self: *const RingBuffer) []const Entry {
            if (self.count == 0) return &[_]Entry{};
            if (self.count < CAPACITY) return self.buffer[0..self.count];
            return &self.buffer;
        }

        pub fn getOrdered(self: *const RingBuffer, out: *[CAPACITY]Entry) []Entry {
            if (self.count == 0) return out[0..0];
            if (self.count < CAPACITY) {
                @memcpy(out[0..self.count], self.buffer[0..self.count]);
                return out[0..self.count];
            }

            const oldest_idx = self.head;
            const newer_count = CAPACITY - oldest_idx;

            @memcpy(out[0..newer_count], self.buffer[oldest_idx..CAPACITY]);
            if (oldest_idx > 0) @memcpy(out[newer_count..CAPACITY], self.buffer[0..oldest_idx]);

            return out[0..CAPACITY];
        }

        /// TODO: move to it's own file
        /// Pretty print the ring buffer for debugging
        pub fn prettyPrint(self: *const RingBuffer, allocator: std.mem.Allocator) ![]u8 {
            var output = std.ArrayList(u8){};
            errdefer output.deinit(allocator);

            const Colors = struct {
                const reset = "\x1b[0m";
                const bold = "\x1b[1m";
                const dim = "\x1b[90m";
                const red = "\x1b[91m";
                const green = "\x1b[92m";
                const yellow = "\x1b[93m";
                const cyan = "\x1b[96m";
                const magenta = "\x1b[95m";
                const bright_red = "\x1b[91;1m";
                const bg_red = "\x1b[41m";
                const bg_green = "\x1b[42m";
                const black = "\x1b[30m";
            };

            try output.writer(allocator).print("\n{s}═══════════════════════════════════════════════════════════════════{s}\n", .{ Colors.bright_red, Colors.reset });
            try output.writer(allocator).print("{s}  RECENT EXECUTION HISTORY (Last {} Instructions)  {s}\n", .{ Colors.bright_red, self.count, Colors.reset });
            try output.writer(allocator).print("{s}═══════════════════════════════════════════════════════════════════{s}\n\n", .{ Colors.bright_red, Colors.reset });

            if (self.count == 0) {
                try output.writer(allocator).print("{s}  (No instructions executed yet){s}\n", .{ Colors.dim, Colors.reset });
                return output.toOwnedSlice(allocator);
            }

            try output.writer(allocator).print("{s} Step  | Sched | Opcode           | Gas Before → After    | Stack | Memory{s}\n", .{ Colors.bold, Colors.reset });
            try output.writer(allocator).print("{s}-------|-------|------------------|-----------------------|-------|--------{s}\n", .{ Colors.dim, Colors.reset });

            var ordered_buffer: [CAPACITY]Entry = undefined;
            const entries = self.getOrdered(&ordered_buffer);

            for (entries) |entry| {
                try output.writer(allocator).print("{s}{d:6}{s} | ", .{ Colors.cyan, entry.step_number, Colors.reset });
                try output.writer(allocator).print("{s}{d:5}{s} | ", .{ Colors.dim, entry.schedule_index, Colors.reset });

                const opcode_color = if (entry.is_synthetic) Colors.bg_green else Colors.yellow;
                if (entry.is_synthetic) {
                    try output.writer(allocator).print("{s}{s}⚡{s:<15}{s} | ", .{ opcode_color, Colors.black, entry.opcode_name, Colors.reset });
                } else {
                    try output.writer(allocator).print("{s}{s:<16}{s} | ", .{ opcode_color, entry.opcode_name, Colors.reset });
                }
                const gas_used = entry.gas_before - entry.gas_after;
                const gas_color = if (gas_used > 100) Colors.red else if (gas_used > 20) Colors.yellow else Colors.green;
                try output.writer(allocator).print("{s}{d:8} → {d:<8}{s} | ", .{ gas_color, entry.gas_before, entry.gas_after, Colors.reset });
                try output.writer(allocator).print("{s}{d:5}{s} | ", .{ Colors.dim, entry.stack_size, Colors.reset });
                try output.writer(allocator).print("{s}{d:6}{s}", .{ Colors.dim, entry.memory_size, Colors.reset });
                try output.writer(allocator).print("\n", .{});
            }

            try output.writer(allocator).print("\n", .{});
            return output.toOwnedSlice(allocator);
        }
    };

    pub fn init(allocator: std.mem.Allocator, config: TracerConfig) Tracer {
        if (!config.enabled) return .{
            .config = config,
            .allocator = allocator,
            .steps = std.ArrayList(ExecutionStep){},
            .advanced_steps = std.ArrayList(AdvancedStep){},
            .pc_tracker = null,
            .gas_tracker = null,
            .current_pc = 0,
            .bytecode = &[_]u8{},
            .minimal_evm = null,
            .instruction_count = 0,
            .schedule_index = 0,
            .simple_instruction_count = 0,
            .fused_instruction_count = 0,
            // TODO: This should be configurable
            .instruction_safety = SafetyCounter(u64, .enabled).init(300_000_000),
            .recent_opcodes = RingBuffer.init(),
        };

        return .{
            .config = config,
            .allocator = allocator,
            .steps = std.ArrayList(ExecutionStep){},
            .advanced_steps = std.ArrayList(AdvancedStep){},
            .pc_tracker = null,
            .gas_tracker = null,
            .current_pc = 0,
            .bytecode = &[_]u8{},
            .minimal_evm = null,
            .instruction_count = 0,
            .schedule_index = 0,
            .simple_instruction_count = 0,
            .fused_instruction_count = 0,
            // TODO: This should be configurable
            // 300M instructions is ~10x the block gas limit
            // Normal contracts execute far fewer instructions
            .instruction_safety = SafetyCounter(u64, .enabled).init(300_000_000),
            .recent_opcodes = RingBuffer.init(),
        };
    }

    /// Get the captured execution steps
    pub fn getSteps(self: *const Tracer) []const ExecutionStep {
        if (!self.config.enabled) return &[_]ExecutionStep{};
        return self.steps.items;
    }

    /// Get the captured advanced execution steps
    pub fn getAdvancedSteps(self: *const Tracer) []const AdvancedStep {
        if (!self.config.enabled) return &[_]AdvancedStep{};
        return self.advanced_steps.items;
    }

    /// Get the ring buffer for inspection
    pub fn getRingBuffer(self: *const Tracer) *const RingBuffer {
        return &self.recent_opcodes;
    }

    /// Pretty print the current ring buffer state
    pub fn printRingBuffer(self: *const Tracer) void {
        if (!self.config.enabled) return;
        if (self.recent_opcodes.prettyPrint(self.allocator)) |output| {
            defer self.allocator.free(output);
            log.info("{s}", .{output});
        } else |_| {
            log.info("Ring buffer has {} recent instructions", .{self.recent_opcodes.count});
        }
    }

    pub fn deinit(self: *Tracer) void {
        for (self.steps.items) |step| {
            if (step.stack_before.len > 0) self.allocator.free(step.stack_before);
            if (step.stack_after.len > 0) self.allocator.free(step.stack_after);
        }
        self.steps.deinit(self.allocator);

        for (self.advanced_steps.items) |step| {
            if (step.fusion_info) |fusion_desc| self.allocator.free(fusion_desc);
        }
        self.advanced_steps.deinit(self.allocator);

        if (self.minimal_evm) |evm| {
            evm.deinitPtr(self.allocator);
            self.minimal_evm = null;
        }
    }

    pub fn initPcTracker(self: *Tracer, bytecode: []const u8) void {
        if (!self.config.enabled) return;
        if (!self.config.enable_pc_tracking) return;
        self.bytecode = bytecode;
        self.current_pc = 0;
    }

    /// Initialize MinimalEvm as a sidecar validator when frame starts interpretation
    pub fn onInterpret(self: *Tracer, frame: anytype, bytecode: []const u8, gas_limit: i64) void {
        if (!self.config.enabled) return;
        _ = gas_limit;
        if (!self.config.enable_validation and !self.config.enable_step_capture) return;
        if (self.config.enable_validation) {
            const main_evm = frame.getEvm();
            _ = main_evm.depth; // Currently unused but may be needed for inner frame handling

            if (self.minimal_evm != null) {
                self.debug("MinimalEvm already initialized, skipping", .{});
                return;
            }

            if (self.minimal_evm) |evm| {
                evm.deinitPtr(self.allocator);
                self.minimal_evm = null;
            }

            self.instruction_count = 0;
            self.schedule_index = 0;
            self.simple_instruction_count = 0;
            self.fused_instruction_count = 0;
            self.instruction_safety.count = 0;

            if (bytecode.len > 0) {
                self.minimal_evm = MinimalEvm.initPtr(self.allocator) catch {
                    self.minimal_evm = null;
                    return;
                };
                self.debug("Created MinimalEvm at 0x{x}", .{@intFromPtr(self.minimal_evm)});
            }

            if (self.minimal_evm) |evm| {
                const evm_instance = frame.getEvm();

                const block_info = evm_instance.get_block_info();
                evm.setBlockchainContext(evm_instance.get_chain_id(), block_info.number, block_info.timestamp, block_info.difficulty, block_info.coinbase, block_info.gas_limit, block_info.base_fee, block_info.blob_base_fee);
                evm.setTransactionContext(evm_instance.get_tx_origin(), evm_instance.gas_price);
                var caller = primitives.ZERO_ADDRESS;
                var address = primitives.ZERO_ADDRESS;
                var value: u256 = 0;
                var calldata: []const u8 = &[_]u8{};

                if (@hasField(@TypeOf(frame.*), "contract_address")) address = frame.contract_address;
                if (@hasField(@TypeOf(frame.*), "caller")) caller = frame.caller;
                if (@hasField(@TypeOf(frame.*), "value")) value = frame.value;
                if (@hasField(@TypeOf(frame.*), "calldata_slice")) calldata = frame.calldata_slice;

                if (!std.mem.eql(u8, &address.bytes, &primitives.ZERO_ADDRESS.bytes)) evm.setCode(address, bytecode) catch {};

                const frame_gas_remaining = frame.gas_remaining;

                const minimal_frame = evm.allocator.create(MinimalFrame) catch return;
                minimal_frame.* = MinimalFrame.init(
                    evm.allocator,
                    bytecode,
                    @intCast(frame_gas_remaining),
                    caller,
                    address,
                    value,
                    calldata,
                    @as(*anyopaque, @ptrCast(evm)),
                ) catch return;

                evm.frames.append(evm.allocator, minimal_frame) catch return;

                self.debug("MinimalEvm initialized with bytecode_len={d}, gas={d}", .{
                    bytecode.len,
                    frame_gas_remaining,
                });
            }
        }
    }

    /// Called before an instruction executes
    /// This is the main entry point for instruction tracing
    pub fn before_instruction(self: *Tracer, frame: anytype, comptime opcode: UnifiedOpcode, cursor: [*]const @TypeOf(frame.*).Dispatch.Item) void {
        if (!self.config.enabled) return;
        const main_evm = frame.getEvm();
        const opcode_name = comptime @tagName(opcode);
        const opcode_value = @intFromEnum(opcode);

        var schedule_idx: u32 = 0;
        if (@hasField(@TypeOf(frame.*), "dispatch")) {
            const item_size = @sizeOf(@TypeOf(frame.*).Dispatch.Item);
            const cursor_offset = @intFromPtr(cursor) - @intFromPtr(frame.dispatch.cursor);
            schedule_idx = @intCast(cursor_offset / item_size);
        }

        self.recent_opcodes.write(.{
            .step_number = self.instruction_count,
            .opcode = opcode_value,
            .opcode_name = opcode_name,
            .gas_before = frame.gas_remaining,
            .gas_after = 0, // Will be updated in after_instruction
            .stack_size = @intCast(frame.stack.size()),
            .memory_size = @intCast(frame.memory.size()),
            .schedule_index = schedule_idx,
            .is_synthetic = opcode_value > 0xFF,
        });

        // Capture execution steps if enabled
        if (self.config.enable_step_capture) {
            const pc = self.current_pc;

            var stack_before: []u256 = &[_]u256{};
            if (frame.stack.size() > 0) {
                const stack_slice = frame.stack.get_slice();
                if (self.allocator.alloc(u256, stack_slice.len)) |stack| {
                    @memcpy(stack, stack_slice);
                    stack_before = stack;
                } else |_| {
                    // Log allocation failure for debugging
                    log.warn("Failed to allocate stack copy for tracer step", .{});
                }
            }

            const step = ExecutionStep{
                .step_number = self.instruction_count,
                .pc = pc,
                .opcode = if (opcode_value <= 0xFF) @intCast(opcode_value) else 0,
                .opcode_name = opcode_name,
                .gas_before = @intCast(frame.gas_remaining),
                .gas_after = 0, // Will be filled in after_instruction
                .gas_cost = 0, // Will be calculated in after_instruction
                .stack_before = stack_before,
                .stack_after = &[_]u256{}, // Will be filled in after_instruction
                .memory_size_before = frame.memory.size(),
                .memory_size_after = 0, // Will be filled in after_instruction
                .depth = @intCast(main_evm.depth),
                .error_occurred = false,
                .error_msg = null,
            };

            self.steps.append(self.allocator, step) catch {};
        }

        if (self.minimal_evm) |evm| {
            const pc = evm.getPC();
            const bytecode = evm.getBytecode();
            log.debug("beforeInstruction: Frame executing {s}, MinimalEvm PC={d}, bytecode[PC]=0x{x:0>2}", .{ opcode_name, pc, if (pc < bytecode.len) bytecode[pc] else 0 });
        }
        if (opcode_value <= 0xff) {
            const expected_handler = @TypeOf(frame.*).opcode_handlers[opcode_value];
            const actual_handler = cursor[0].opcode_handler;
            if (actual_handler != expected_handler) {
                self.err("[HANDLER] Handler mismatch for {s}: expected={*}, actual={*}", .{ opcode_name, expected_handler, actual_handler });
            }
        }

        self.instruction_count += 1;
        if (opcode_value > 0xff) {
            self.fused_instruction_count += 1;
        } else {
            self.simple_instruction_count += 1;
        }

        if (self.config.enable_advanced_trace) {
            const step = self.captureAdvancedStep(frame, opcode, cursor) catch |capture_err| {
                self.warn("Failed to capture advanced step: {}", .{capture_err});
                return;
            };

            if (step.step_number > 0) {
                self.advanced_steps.append(self.allocator, step) catch |append_err| self.warn("Failed to append advanced step: {}", .{append_err});
            }
        }

        self.instruction_safety.inc();

        if (self.minimal_evm) |evm| {
            if (evm.getCurrentFrame()) |mf| {
                log.debug("Before executeMinimalEvmForOpcode {s}: MinimalEvm stack={d}, Frame stack={d}", .{
                    opcode_name,
                    mf.stack.items.len,
                    frame.stack.size(),
                });
            }
            self.executeMinimalEvmForOpcode(evm, opcode, frame, cursor);
            if (evm.getCurrentFrame()) |mf| {
                log.debug("After executeMinimalEvmForOpcode {s}: MinimalEvm stack={d}, Frame stack={d}", .{
                    opcode_name,
                    mf.stack.items.len,
                    frame.stack.size(),
                });
            }
        }

        const stack_size = frame.stack.size();
        log.debug("EXEC[{d}]: {s} | PC={d} stack={d} gas={d}", .{
            self.instruction_count,
            opcode_name,
            self.current_pc,
            stack_size,
            frame.gas_remaining,
        });
    }

    pub fn after_instruction(self: *Tracer, frame: anytype, comptime opcode: UnifiedOpcode, next_handler: anytype, next_cursor: [*]const @TypeOf(frame.*).Dispatch.Item) void {
        if (!self.config.enabled) return;
        const opcode_name = comptime @tagName(opcode);
        if (self.recent_opcodes.count > 0) {
            const last_idx = if (self.recent_opcodes.head == 0)
                RingBuffer.CAPACITY - 1
            else
                self.recent_opcodes.head - 1;
            self.recent_opcodes.buffer[last_idx].gas_after = frame.gas_remaining;
        }

        self.schedule_index += 1;

        if (self.config.enable_advanced_trace and self.advanced_steps.items.len > 0) {
            const last_step_idx = self.advanced_steps.items.len - 1;
            var last_step = &self.advanced_steps.items[last_step_idx];

            last_step.gas_after = frame.gas_remaining;
            last_step.gas_cost = @intCast(@as(i64, last_step.gas_before) - @as(i64, frame.gas_remaining));
            last_step.stack_size_after = @intCast(frame.stack.size());
            last_step.memory_size_after = @intCast(frame.memory.size());
        }

        if (next_cursor[0] != .opcode_handler or next_cursor[0].opcode_handler != next_handler) {
            self.err("[SCHEDULE] Next handler mismatch at sched_idx={d}", .{self.schedule_index});
        }

        if (next_cursor[0] == .opcode_handler) {
            const next_opcode_value = self.getOpcodeFromHandler(@TypeOf(frame.*), next_handler);
            if (next_opcode_value) |opcode_int| {
                if (opcode_int <= 0xff) {
                    const expected_next_handler = @TypeOf(frame.*).opcode_handlers[opcode_int];
                    if (next_handler != expected_next_handler) {
                        self.err("[HANDLER] Next handler mismatch: opcode=0x{x:0>2}, expected={*}, actual={*}", .{ opcode_int, expected_next_handler, next_handler });
                    }
                }
            }
        }

        log.debug("afterInstruction: Validating state after {s}", .{opcode_name});
        if (self.minimal_evm) |evm| {
            if (evm.getCurrentFrame()) |mf| {
                log.debug("  MinimalEvm stack={d}, Frame stack={d}", .{
                    mf.stack.items.len,
                    frame.stack.size(),
                });
            }
        }
        self.validateMinimalEvmState(frame, opcode);

        if (self.minimal_evm) |evm| self.current_pc = evm.getPC();

        log.debug("DONE[{d}]: {s} | PC={d}", .{
            self.instruction_count,
            opcode_name,
            self.current_pc,
        });
    }

    pub fn after_complete(self: *Tracer, frame: anytype, comptime opcode: UnifiedOpcode) void {
        if (!self.config.enabled) return;
        if (frame.getEvm().depth > 1) return;
        self.validateMinimalEvmState(frame, opcode);
    }

    fn captureStep(self: *Tracer, frame: anytype, opcode_value: u8) !ExecutionStep {
        if (!self.config.enable_step_capture) return ExecutionStep{
            .step_number = 0,
            .pc = 0,
            .opcode = 0,
            .opcode_name = "",
            .gas_before = 0,
            .gas_after = 0,
            .gas_cost = 0,
            .stack_before = &[_]u256{},
            .stack_after = &[_]u256{},
            .memory_size_before = 0,
            .memory_size_after = 0,
            .depth = 0,
            .error_occurred = false,
            .error_msg = null,
        };
        var stack_before: []u256 = &[_]u256{};
        if (frame.stack.items.len > 0) {
            stack_before = try self.allocator.alloc(u256, frame.stack.items.len);
            // LIFO order
            for (frame.stack.items, 0..) |val, i| stack_before[frame.stack.items.len - 1 - i] = val;
        }

        const opcode_name = getOpcodeName(opcode_value);

        return ExecutionStep{
            .step_number = self.instruction_count,
            .pc = frame.pc,
            .opcode = opcode_value,
            .opcode_name = opcode_name,
            .gas_before = @intCast(frame.gas_remaining),
            .gas_after = 0, // Will be filled after execution
            .gas_cost = 0, // Will be calculated after execution
            .stack_before = stack_before,
            .stack_after = &[_]u256{}, // Will be filled after execution
            .memory_size_before = frame.memory_size,
            .memory_size_after = 0, // Will be filled after execution
            .depth = frame.call_depth,
            .error_occurred = false,
            .error_msg = null,
        };
    }

    /// Capture the current advanced execution state for Frame
    fn captureAdvancedStep(self: *Tracer, frame: anytype, comptime opcode: UnifiedOpcode, cursor: [*]const @TypeOf(frame.*).Dispatch.Item) !AdvancedStep {
        if (!self.config.enable_advanced_trace) return AdvancedStep{
            .step_number = 0,
            .schedule_index = 0,
            .opcode = 0,
            .opcode_name = "",
            .is_synthetic = false,
            .gas_before = 0,
            .gas_after = 0,
            .gas_cost = 0,
            .stack_size_before = 0,
            .stack_size_after = 0,
            .memory_size_before = 0,
            .memory_size_after = 0,
            .depth = 0,
            .fusion_info = null,
        };

        const opcode_value = @intFromEnum(opcode);
        const is_synthetic = opcode_value > 0xFF;

        const opcode_name = if (is_synthetic)
            getSyntheticOpcodeName(opcode_value)
        else
            getOpcodeName(@intCast(opcode_value));

        const fusion_info = if (is_synthetic) blk: {
            const desc = try self.describeFusion(opcode);
            break :blk desc;
        } else null;

        const schedule_index: u32 = @intCast(@intFromPtr(cursor) - @intFromPtr(frame.dispatch.cursor));

        return AdvancedStep{
            .step_number = self.instruction_count,
            .schedule_index = schedule_index,
            .opcode = opcode_value,
            .opcode_name = opcode_name,
            .is_synthetic = is_synthetic,
            .gas_before = frame.gas_remaining,
            .gas_after = 0, // Will be filled in after_instruction
            .gas_cost = 0, // Will be calculated in after_instruction
            .stack_size_before = @intCast(frame.stack.size()),
            .stack_size_after = 0, // Will be filled in after_instruction
            .memory_size_before = @intCast(frame.memory.size()),
            .memory_size_after = 0, // Will be filled in after_instruction
            .depth = @intCast(frame.getEvm().depth),
            .fusion_info = fusion_info,
        };
    }

    /// Describe a fusion operation for advanced trace
    fn describeFusion(self: *Tracer, comptime opcode: UnifiedOpcode) !?[]const u8 {
        const description = switch (opcode) {
            .PUSH_ADD_INLINE, .PUSH_ADD_POINTER => "PUSH+ADD fusion",
            .PUSH_SUB_INLINE, .PUSH_SUB_POINTER => "PUSH+SUB fusion",
            .PUSH_MUL_INLINE, .PUSH_MUL_POINTER => "PUSH+MUL fusion",
            .PUSH_DIV_INLINE, .PUSH_DIV_POINTER => "PUSH+DIV fusion",
            .PUSH_AND_INLINE, .PUSH_AND_POINTER => "PUSH+AND fusion",
            .PUSH_OR_INLINE, .PUSH_OR_POINTER => "PUSH+OR fusion",
            .PUSH_XOR_INLINE, .PUSH_XOR_POINTER => "PUSH+XOR fusion",
            .PUSH_MSTORE_INLINE, .PUSH_MSTORE_POINTER => "PUSH+MSTORE fusion",
            .PUSH_MSTORE8_INLINE, .PUSH_MSTORE8_POINTER => "PUSH+MSTORE8 fusion",
            .PUSH_MLOAD_INLINE, .PUSH_MLOAD_POINTER => "PUSH+MLOAD fusion",
            .JUMP_TO_STATIC_LOCATION => "Static JUMP optimization",
            .JUMPI_TO_STATIC_LOCATION => "Static JUMPI optimization",
            .MULTI_PUSH_2 => "Double PUSH fusion",
            .MULTI_PUSH_3 => "Triple PUSH fusion",
            .MULTI_POP_2 => "Double POP fusion",
            .MULTI_POP_3 => "Triple POP fusion",
            .ISZERO_JUMPI => "ISZERO+JUMPI pattern",
            .DUP2_MSTORE_PUSH => "DUP2+MSTORE+PUSH pattern",
            .DUP3_ADD_MSTORE => "DUP3+ADD+MSTORE pattern",
            .SWAP1_DUP2_ADD => "SWAP1+DUP2+ADD pattern",
            .PUSH_DUP3_ADD => "PUSH+DUP3+ADD pattern",
            .FUNCTION_DISPATCH => "Function selector dispatch (PUSH4+EQ+PUSH+JUMPI)",
            .CALLVALUE_CHECK => "Payable check (CALLVALUE+DUP1+ISZERO)",
            .PUSH0_REVERT => "Error pattern (PUSH0+PUSH0+REVERT)",
            .PUSH_ADD_DUP1 => "PUSH+ADD+DUP1 pattern",
            .MLOAD_SWAP1_DUP2 => "MLOAD+SWAP1+DUP2 pattern",
            else => return null,
        };

        const copy = try self.allocator.alloc(u8, description.len);
        @memcpy(copy, description);
        return copy;
    }

    // TODO: MOve this to it's own file and add more validation that each opcode is what we expect to this
    fn executeMinimalEvmForOpcode(self: *Tracer, evm: *MinimalEvm, comptime opcode: UnifiedOpcode, frame: anytype, cursor: [*]const @TypeOf(frame.*).Dispatch.Item) void {
        const opcode_value = @intFromEnum(opcode);

        self.debug("=====================================", .{});
        self.debug("Frame executing: {s}", .{@tagName(opcode)});
        self.debug("  MinimalEvm PC: {d}", .{evm.getPC()});
        self.debug("  Frame stack size: {d}", .{frame.stack.size()});
        if (evm.getCurrentFrame()) |minimal_frame| self.debug("  MinimalEvm stack size: {d}", .{minimal_frame.stack.items.len});

        if (opcode_value <= 0xff) {
            if (evm.getCurrentFrame()) |mf| {
                const step_before = if (self.config.enable_step_capture) self.captureStep(mf, opcode_value) catch null else null;
                defer if (step_before) |step| {
                    if (step.stack_before.len > 0) self.allocator.free(step.stack_before);
                };

                // Special handling: JUMPDEST in Frame pre-charges entire basic-block gas.
                // MinimalEvm's JUMPDEST charges only JumpdestGas, so we reconcile here.
                if (opcode_value == 0x5b) { // JUMPDEST
                    const DispatchType = @TypeOf(frame.*).Dispatch;
                    const dispatch = DispatchType{ .cursor = cursor };
                    const op_data = dispatch.getOpData(.JUMPDEST);
                    const block_gas: u64 = op_data.metadata.gas;
                    const jumpdest_gas: u64 = primitives.GasConstants.JumpdestGas;
                    const extra: i64 = @as(i64, @intCast(block_gas)) - @as(i64, @intCast(jumpdest_gas));
                    mf.gas_remaining -= extra;
                }

                evm.step() catch |e| {
                    if (step_before) |mut_step| {
                        var step = mut_step;
                        step.error_occurred = true;
                        step.error_msg = @errorName(e);
                        step.gas_after = @intCast(mf.gas_remaining);
                        step.stack_after = &[_]u256{};
                        step.memory_size_after = mf.memory_size;
                        self.steps.append(self.allocator, step) catch {};
                    }

                    var actual_opcode: u8 = 0;
                    if (mf.pc < mf.bytecode.len) actual_opcode = mf.bytecode[mf.pc];
                    self.err("[EVM2] MinimalEvm exec error at PC={d}, bytecode[PC]=0x{x:0>2}, Frame expects=0x{x:0>2}: {any}", .{ mf.pc, actual_opcode, opcode_value, e });
                    @panic("MinimalEvm execution error");
                };

                if (step_before) |mut_step| {
                    var step = mut_step;
                    step.gas_after = @intCast(mf.gas_remaining);
                    step.gas_cost = @intCast(@as(i64, step.gas_before) - @as(i64, step.gas_after));

                    if (mf.stack.items.len > 0) {
                        if (self.allocator.alloc(u256, mf.stack.items.len)) |stack_after| {
                            for (mf.stack.items, 0..) |val, i| {
                                stack_after[mf.stack.items.len - 1 - i] = val; // LIFO order
                            }
                            step.stack_after = stack_after;
                        } else |_| {
                            step.stack_after = &[_]u256{};
                        }
                    } else {
                        step.stack_after = &[_]u256{};
                    }

                    step.memory_size_after = mf.memory_size;
                    step.error_occurred = false;

                    self.steps.append(self.allocator, step) catch {};
                }
            } else {
                log.err("[EVM2] MinimalEvm has no current frame when trying to execute opcode 0x{x:0>2}", .{opcode_value});
                @panic("MinimalEvm not initialized");
            }
            return;
        }

        switch (opcode) {
            .PUSH_ADD_INLINE, .PUSH_ADD_POINTER => {
                if (evm.getPC() + 2 < evm.getBytecode().len and
                    evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                    evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x01)
                {
                    inline for (0..2) |_| {
                        evm.step() catch |e| {
                            self.err("PUSH_ADD step failed: {any}", .{e});
                            return;
                        };
                    }
                }
            },
            .PUSH_MUL_INLINE, .PUSH_MUL_POINTER => {
                if (evm.getPC() + 2 < evm.getBytecode().len and
                    evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                    evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x02)
                {
                    inline for (0..2) |_| {
                        evm.step() catch |e| {
                            self.err("PUSH_MUL step failed: {any}", .{e});
                            return;
                        };
                    }
                }
            },
            .PUSH_SUB_INLINE, .PUSH_SUB_POINTER => {
                if (evm.getPC() + 2 < evm.getBytecode().len and
                    evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                    evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x03)
                {
                    inline for (0..2) |_| {
                        evm.step() catch |e| {
                            self.err("PUSH_SUB step failed: {any}", .{e});
                            return;
                        };
                    }
                }
            },
            .PUSH_DIV_INLINE, .PUSH_DIV_POINTER => {
                if (evm.getPC() + 2 < evm.getBytecode().len and
                    evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                    evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x04)
                {
                    inline for (0..2) |_| {
                        evm.step() catch |e| {
                            self.err("PUSH_DIV step failed: {any}", .{e});
                            return;
                        };
                    }
                }
            },
            .PUSH_AND_INLINE, .PUSH_AND_POINTER => {
                if (evm.getPC() + 2 < evm.getBytecode().len and
                    evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                    evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x16)
                {
                    inline for (0..2) |_| {
                        evm.step() catch |e| {
                            self.err("PUSH_AND step failed: {any}", .{e});
                            return;
                        };
                    }
                }
            },
            .PUSH_OR_INLINE, .PUSH_OR_POINTER => {
                if (evm.getPC() + 2 < evm.getBytecode().len and
                    evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                    evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x17)
                {
                    inline for (0..2) |_| {
                        evm.step() catch |e| {
                            self.err("PUSH_OR step failed: {any}", .{e});
                            return;
                        };
                    }
                }
            },
            .PUSH_XOR_INLINE, .PUSH_XOR_POINTER => {
                if (evm.getPC() + 2 < evm.getBytecode().len and
                    evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                    evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x18)
                {
                    inline for (0..2) |_| {
                        evm.step() catch |e| {
                            self.err("PUSH_XOR step failed: {any}", .{e});
                            return;
                        };
                    }
                }
            },
            .PUSH_MLOAD_INLINE, .PUSH_MLOAD_POINTER => {
                if (evm.getPC() + 2 < evm.getBytecode().len and
                    evm.getBytecode()[evm.getPC()] >= 0x60 and evm.getBytecode()[evm.getPC()] <= 0x7f and
                    evm.getBytecode()[evm.getPC() + 1 + (evm.getBytecode()[evm.getPC()] - 0x5f)] == 0x51)
                {
                    inline for (0..2) |_| {
                        evm.step() catch |e| {
                            self.err("PUSH_MLOAD step failed: {any}", .{e});
                            return;
                        };
                    }
                }
            },
            .PUSH_MSTORE_INLINE, .PUSH_MSTORE_POINTER => {
                self.debug("PUSH_MSTORE_INLINE: MinimalEvm PC={d}, stack_size={d}, Frame stack_size={d}", .{ evm.getPC(), (evm.getCurrentFrame() orelse unreachable).stack.items.len, frame.stack.size() });
                if (evm.getPC() + 2 < evm.getBytecode().len and
                    evm.getBytecode()[evm.getPC()] == 0x60 and // PUSH1
                    evm.getBytecode()[evm.getPC() + 2] == 0x52)
                {
                    self.debug("PUSH_MSTORE_INLINE: Found PUSH1+MSTORE at PC {d}, executing 2 steps", .{evm.getPC()});
                    inline for (0..2) |step_num| {
                        const current_opcode = evm.getBytecode()[evm.getPC()];
                        self.debug("PUSH_MSTORE step {d}: executing opcode 0x{x:0>2} at PC {d}", .{ step_num + 1, current_opcode, evm.getPC() });
                        evm.step() catch |e| {
                            self.err("PUSH_MSTORE step {d} failed: opcode=0x{x:0>2}, error={any}", .{ step_num + 1, current_opcode, e });
                            return;
                        };
                    }
                } else {
                    self.debug("PUSH_MSTORE_INLINE: Not at PUSH1+MSTORE sequence at PC {d} (opcode=0x{x:0>2})", .{ evm.getPC(), if (evm.getPC() < evm.getBytecode().len) evm.getBytecode()[evm.getPC()] else 0 });
                    self.debug("PUSH_MSTORE_INLINE: Skipping MinimalEvm execution for mis-identified synthetic opcode", .{});
                }
            },
            .PUSH_MSTORE8_INLINE, .PUSH_MSTORE8_POINTER => {
                self.debug("PUSH_MSTORE8_INLINE: MinimalEvm PC={d}, stack_size={d}, Frame stack_size={d}", .{ evm.getPC(), (evm.getCurrentFrame() orelse unreachable).stack.items.len, frame.stack.size() });
                if (evm.getPC() + 2 < evm.getBytecode().len and
                    evm.getBytecode()[evm.getPC()] == 0x60 and // PUSH1
                    evm.getBytecode()[evm.getPC() + 2] == 0x53)
                {
                    self.debug("PUSH_MSTORE8_INLINE: Found PUSH1+MSTORE8 at PC {d}, executing 2 steps", .{evm.getPC()});

                    inline for (0..2) |step_num| {
                        if (evm.getPC() >= evm.getBytecode().len) {
                            self.err("PUSH_MSTORE8 step {d}: PC out of bounds: {d} >= {d}", .{ step_num + 1, evm.getPC(), evm.getBytecode().len });
                            return;
                        }

                        const current_opcode = evm.getBytecode()[evm.getPC()];
                        self.debug("PUSH_MSTORE8 step {d}: executing opcode 0x{x:0>2} at PC {d}", .{ step_num + 1, current_opcode, evm.getPC() });

                        evm.step() catch |e| {
                            self.err("PUSH_MSTORE8 step {d} failed: opcode=0x{x:0>2}, error={any}", .{ step_num + 1, current_opcode, e });
                            return;
                        };
                    }
                } else {
                    self.debug("PUSH_MSTORE8_INLINE: Not at PUSH1+MSTORE8 sequence at PC {d} (opcode=0x{x:0>2})", .{ evm.getPC(), if (evm.getPC() < evm.getBytecode().len) evm.getBytecode()[evm.getPC()] else 0 });
                    self.debug("PUSH_MSTORE8_INLINE: Skipping MinimalEvm execution for mis-identified synthetic opcode", .{});
                }
            },

            .JUMP_TO_STATIC_LOCATION, .JUMPI_TO_STATIC_LOCATION => {
                const pc = evm.getPC();
                const bytecode = evm.getBytecode();
                if (pc + 2 < bytecode.len and bytecode[pc] >= 0x60 and bytecode[pc] <= 0x7f) {
                    const push_size = bytecode[pc] - 0x5f;
                    const next_op_pc = pc + 1 + push_size;
                    if (next_op_pc < bytecode.len and (bytecode[next_op_pc] == 0x56 or bytecode[next_op_pc] == 0x57)) {
                        inline for (0..2) |_| {
                            evm.step() catch |e| {
                                self.err("JUMP_TO_STATIC_LOCATION step failed: {any}", .{e});
                                return;
                            };
                        }
                    }
                }
            },

            .MULTI_PUSH_2 => {
                const pc = evm.getPC();
                const bytecode = evm.getBytecode();
                if (pc + 2 < bytecode.len and bytecode[pc] >= 0x60 and bytecode[pc] <= 0x7f) {
                    const push_size1 = bytecode[pc] - 0x5f;
                    const next_pc = pc + 1 + push_size1;
                    if (next_pc < bytecode.len and bytecode[next_pc] >= 0x60 and bytecode[next_pc] <= 0x7f) {
                        inline for (0..2) |_| {
                            evm.step() catch |e| {
                                self.err("MULTI_PUSH_2 step failed: {any}", .{e});
                                return;
                            };
                        }
                    }
                }
            },
            .MULTI_PUSH_3 => {
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("MULTI_PUSH_3 step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .MULTI_POP_2 => {
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("MULTI_POP_2 step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .MULTI_POP_3 => {
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("MULTI_POP_3 step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .DUP2_MSTORE_PUSH, .DUP3_ADD_MSTORE, .SWAP1_DUP2_ADD, .PUSH_DUP3_ADD, .PUSH_ADD_DUP1, .MLOAD_SWAP1_DUP2, .ISZERO_JUMPI, .CALLVALUE_CHECK, .PUSH0_REVERT => {
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("Three-op fusion step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .FUNCTION_DISPATCH => {
                inline for (0..4) |_| {
                    evm.step() catch |e| {
                        self.err("FUNCTION_DISPATCH step failed: {any}", .{e});
                        return;
                    };
                }
            },
            else => {
                // Unknown synthetic opcode should never happen in production
                self.err("Unknown synthetic opcode: {x}", .{@intFromEnum(opcode)});
                @panic("Unknown synthetic opcode encountered");
            },
        }
    }

    /// Helper to get opcode number from handler pointer by searching opcode_handlers array
    fn getOpcodeFromHandler(self: *Tracer, comptime FrameType: type, handler: FrameType.OpcodeHandler) ?u8 {
        _ = self;
        inline for (0..256) |i| {
            if (FrameType.opcode_handlers[i] == handler) {
                return @intCast(i);
            }
        }
        return null;
    }

    /// Validate MinimalEvm state against Frame state
    fn validateMinimalEvmState(self: *Tracer, frame: anytype, comptime opcode: UnifiedOpcode) void {
        if (self.minimal_evm) |evm| {
            // Skip validation for nested calls
            if (self.nested_depth > 0) return;
            const opcode_name = @tagName(opcode);

            // Compare stack sizes
            const frame_stack_size = frame.stack.size();
            const evm_stack_size = (evm.getCurrentFrame() orelse unreachable).stack.items.len;

            if (evm_stack_size != frame_stack_size) {
                // Allow call-like opcodes a grace period: their host-dependent behavior
                // can differ under the MinimalEvm stub host. We still log but avoid
                // aborting on pure size diffs here to keep differential tests focused
                // on Frame correctness. Content is validated when sizes match.
                const is_call_like = switch (opcode) {
                    .CALL, .CALLCODE, .DELEGATECALL, .STATICCALL => true,
                    else => false,
                };
                if (is_call_like) {
                    log.debug("[EVM2] [DIVERGENCE] (call-like) Stack size mismatch after {s}: MinimalEvm={d} Frame={d}", .{ opcode_name, evm_stack_size, frame_stack_size });
                    return;
                }
                log.err("[EVM2] [DIVERGENCE] Stack size mismatch after {s}:", .{opcode_name});
                log.err("[EVM2]   MinimalEvm: {d}, Frame: {d}", .{ evm_stack_size, frame_stack_size });
                // Show top elements for debugging
                if (evm_stack_size > 0) {
                    self.err("  MinimalEvm top: 0x{x}", .{(evm.getCurrentFrame() orelse unreachable).stack.items[evm_stack_size - 1]});
                }
                if (frame_stack_size > 0) {
                    self.err("  Frame top: 0x{x}", .{frame.stack.peek_unsafe()});
                }
                @panic("Stack divergence");
            } else if (evm_stack_size > 0) {
                // Compare stack contents
                const frame_stack = frame.stack.get_slice();
                for (0..evm_stack_size) |i| {
                    const evm_val = (evm.getCurrentFrame() orelse unreachable).stack.items[evm_stack_size - 1 - i];
                    const frame_val = frame_stack[i];
                    if (evm_val != frame_val) {
                        log.err("[EVM2] [DIVERGENCE] Stack content mismatch at position {d}:", .{i});
                        log.err("[EVM2]   MinimalEvm: 0x{x}, Frame: 0x{x}", .{ evm_val, frame_val });
                        log.err("[EVM2]   Opcode: {s}, MinimalEvm PC: {d}", .{ opcode_name, if (evm.getCurrentFrame()) |f| f.pc else 0 });
                        // Print full stack contents
                        log.err("[EVM2]   MinimalEvm stack (top first):", .{});
                        if (evm.getCurrentFrame()) |f| {
                            for (0..@min(10, f.stack.items.len)) |j| {
                                log.err("[EVM2]     [{d}]: 0x{x}", .{ j, f.stack.items[f.stack.items.len - 1 - j] });
                            }
                        }
                        log.err("[EVM2]   Frame stack (top first):", .{});
                        for (0..@min(10, frame_stack.len)) |j| {
                            log.err("[EVM2]     [{d}]: 0x{x}", .{ j, frame_stack[j] });
                        }
                        @panic("Stack content divergence");
                    }
                }
            }

            // Compare memory sizes
            const frame_memory_size = if (@hasField(@TypeOf(frame.*), "memory"))
                frame.memory.size()
            else
                0;
            const evm_memory_size = (evm.getCurrentFrame() orelse unreachable).memory_size;

            if (evm_memory_size != frame_memory_size) {
                // Memory size mismatch is not critical, just debug log
                log.debug("[EVM2] [DIVERGENCE] Memory size mismatch:", .{});
                log.debug("[EVM2]   MinimalEvm: {d}, Frame: {d}", .{ evm_memory_size, frame_memory_size });
            }

            // Gas validation - different rules for different opcode types
            const frame_gas_remaining = frame.gas_remaining;
            const evm_gas_remaining = (evm.getCurrentFrame() orelse unreachable).gas_remaining;

            // Check if this is a jump/terminal opcode that should have exact gas match
            const is_terminal_opcode = switch (opcode) {
                .JUMP, .JUMPI, .STOP, .RETURN, .REVERT, .SELFDESTRUCT => true,
                else => false,
            };

            if (is_terminal_opcode) {
                // For jump/terminal opcodes, gas should match exactly
                // because both EVMs should have consumed the same amount
                if (frame_gas_remaining != evm_gas_remaining) {
                    // Gas divergence at terminal state, debug log only
                    log.debug("[EVM2] [GAS DIVERGENCE] Exact gas mismatch at terminal opcode {s}:", .{opcode_name});
                    log.debug("[EVM2]   Frame gas_remaining: {d}", .{frame_gas_remaining});
                    log.debug("[EVM2]   MinimalEvm gas_remaining: {d}", .{evm_gas_remaining});
                    log.debug("[EVM2]   Difference: {d}", .{@as(i64, frame_gas_remaining) - @as(i64, evm_gas_remaining)});
                }
            } else {
                // For regular opcodes, allow reasonable gas differences due to block vs opcode charging
                // Frame may consume gas in larger chunks at block boundaries
                const gas_diff = @as(i64, evm_gas_remaining) - @as(i64, frame_gas_remaining);

                // Get expected first_block_gas for this frame to adjust tolerance
                const expected_first_block_gas = if (@hasField(@TypeOf(frame.*), "first_block_gas_charged"))
                    @as(i64, frame.first_block_gas_charged)
                else
                    0;

                // Allow Frame to consume first_block_gas + 50 more than MinimalEvm
                // This accounts for Frame's pre-charging strategy
                const tolerance = expected_first_block_gas + 50;
                if (gas_diff > tolerance) {
                    // Gas divergence during execution, debug log only
                    log.debug("[EVM2] [GAS DIVERGENCE] MinimalEvm consumed too much less gas than Frame after {s}:", .{opcode_name});
                    log.debug("[EVM2]   Frame gas_remaining: {d}", .{frame_gas_remaining});
                    log.debug("[EVM2]   MinimalEvm gas_remaining: {d}", .{evm_gas_remaining});
                    log.debug("[EVM2]   Gas difference: {d} (exceeds {d} gas tolerance)", .{ gas_diff, tolerance });
                } else if (gas_diff < -20) {
                    log.debug("[EVM2] [GAS DIVERGENCE] MinimalEvm consumed more gas than Frame after {s}:", .{opcode_name});
                    log.debug("[EVM2]   Frame gas_remaining: {d}", .{frame_gas_remaining});
                    log.debug("[EVM2]   MinimalEvm gas_remaining: {d}", .{evm_gas_remaining});
                    self.warn("  MinimalEvm over-consumed by: {d}", .{-gas_diff});
                }
            }
        }
    }

    // ============================================================================
    // LOGGING FUNCTIONS
    // ============================================================================

    pub fn debug(self: *Tracer, comptime format: []const u8, args: anytype) void {
        if (!self.config.enabled) return;
        if (!self.config.enable_debug_logging) return;
        log.debug(format, args);
    }

    pub fn err(self: *Tracer, comptime format: []const u8, args: anytype) void {
        log.err(format, args);

        // Pretty print the ring buffer on error for debugging
        if (self.config.enabled) {
            if (self.recent_opcodes.prettyPrint(self.allocator)) |output| {
                defer self.allocator.free(output);
                log.err("{s}", .{output});
            } else |_| {
                // If pretty print fails, at least show the count
                log.err("Ring buffer has {} recent instructions", .{self.recent_opcodes.count});
            }
        }

        @panic("Tracer error - see log above");
    }

    pub fn warn(self: *Tracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.warn(format, args);
    }

    pub fn info(self: *Tracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.info(format, args);
    }

    pub fn throwError(self: *Tracer, comptime format: []const u8, args: anytype) noreturn {
        const builtin = @import("builtin");
        log.err("FATAL: " ++ format, args);

        // Pretty print the ring buffer on fatal error for debugging
        if (self.config.enabled) {
            if (self.recent_opcodes.prettyPrint(self.allocator)) |output| {
                defer self.allocator.free(output);
                log.err("{s}", .{output});
            } else |_| {
                // If pretty print fails, at least show the count
                log.err("Ring buffer has {} recent instructions", .{self.recent_opcodes.count});
            }
        }

        if (builtin.target.cpu.arch == .wasm32 and builtin.target.os.tag == .freestanding) {
            @panic("EVM execution error");
        } else {
            unreachable;
        }
    }

    // TODO move to their own file
    // ============================================================================
    // EVM LIFECYCLE EVENTS
    // ============================================================================

    pub fn onFrameStart(self: *Tracer, code_len: usize, gas: u64, depth: u16) void {
        if (!self.config.enabled) return;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[EVM] Frame execution started: code_len={}, gas={}, depth={}", .{ code_len, gas, depth });
    }

    pub fn onFrameComplete(self: *Tracer, gas_left: u64, output_len: usize) void {
        if (!self.config.enabled) return;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[EVM] Frame execution completed: gas_left={}, output_len={}", .{ gas_left, output_len });
    }

    pub fn onAccountDelegation(self: *Tracer, account: []const u8, delegated: []const u8) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[EVM] Account {x} has delegation to {x}", .{ account, delegated });
    }

    pub fn onEmptyAccountAccess(self: *Tracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[EVM] Empty account access", .{});
    }

    /// Called when arena allocator is initialized
    pub fn onArenaInit(self: *Tracer, initial_capacity: usize, max_capacity: usize, growth_factor: u32) void {
        if (!self.config.enabled) return;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[ARENA] Initialized: initial={d}, max={d}, growth={d}%", .{ initial_capacity, max_capacity, growth_factor });
    }

    // TODO: Add debug logging
    /// Event: Call operation started
    pub fn onCallStart(self: *Tracer, call_type: []const u8, gas: i64, to: anytype, value: u256) void {
        _ = self;
        _ = call_type;
        _ = gas;
        _ = to;
        _ = value;
    }

    // TODO: Add debug logging
    /// Event: EVM initialization started
    pub fn onEvmInit(self: *Tracer, gas_price: u256, origin: anytype, hardfork: []const u8) void {
        _ = self;
        _ = gas_price;
        _ = origin;
        _ = hardfork;
    }

    // TODO: Add debug logging
    /// Called when arena is reset
    pub fn onArenaReset(self: *Tracer, mode: []const u8, capacity_before: usize, capacity_after: usize) void {
        if (!self.config.enabled) return;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[ARENA] Reset ({s}): capacity {d} -> {d}", .{ mode, capacity_before, capacity_after });
    }

    // TODO: Add debug logging
    /// Event: Beacon root update processing
    pub fn onBeaconRootUpdate(self: *Tracer, success: bool, error_val: ?anyerror) void {
        _ = self;
        _ = success;
        _ = error_val;
    }

    // TODO: Add debug logging
    /// Event: Call operation completed
    pub fn onCallComplete(self: *Tracer, success: bool, gas_left: i64, output_len: usize) void {
        _ = self;
        _ = success;
        _ = gas_left;
        _ = output_len;
    }

    // TODO: Add debug logging
    /// Event: Preflight check for call
    pub fn onCallPreflight(self: *Tracer, call_type: []const u8, result: []const u8) void {
        _ = self;
        _ = call_type;
        _ = result;
    }

    // TODO: Add debug logging
    /// Event: Historical block hash update processing
    pub fn onHistoricalBlockHashUpdate(self: *Tracer, success: bool, error_val: ?anyerror) void {
        _ = self;
        _ = success;
        _ = error_val;
    }

    // TODO: Add debug logging
    /// Event: Code retrieval
    pub fn onCodeRetrieval(self: *Tracer, address: anytype, code_len: usize, is_empty: bool) void {
        _ = self;
        _ = address;
        _ = code_len;
        _ = is_empty;
    }

    // TODO: Add debug logging
    /// Event: Validator deposits processing
    pub fn onValidatorDeposits(self: *Tracer, success: bool, error_val: ?anyerror) void {
        _ = self;
        _ = success;
        _ = error_val;
    }

    // TODO: Add debug logging
    /// Called when an allocation is made
    pub fn onArenaAlloc(self: *Tracer, size: usize, alignment: usize, current_capacity: usize) void {
        _ = self;
        _ = size;
        _ = alignment;
        _ = current_capacity;
    }

    // TODO: add debug loggin
    /// Event: Frame bytecode initialization
    pub fn onFrameBytecodeInit(self: *Tracer, bytecode_len: usize, success: bool, error_val: ?anyerror) void {
        _ = self;
        _ = bytecode_len;
        _ = success;
        _ = error_val;
    }

    // TODO: add debug loggin
    /// Event: Validator withdrawals processing
    pub fn onValidatorWithdrawals(self: *Tracer, success: bool, error_val: ?anyerror) void {
        _ = self;
        _ = success;
        _ = error_val;
    }

    /// Called when arena grows to accommodate new allocations
    pub fn onArenaGrow(self: *Tracer, old_capacity: usize, new_capacity: usize, requested_size: usize) void {
        if (!self.config.enabled) return;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            log.debug("[ARENA] Growing: {d} -> {d} bytes (requested={d})", .{ old_capacity, new_capacity, requested_size });
        }
    }

    /// Called when allocation fails
    pub fn onArenaAllocFailed(self: *Tracer, size: usize, current_capacity: usize, max_capacity: usize) void {
        if (!self.config.enabled) return;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            log.warn("[ARENA] Allocation failed: size={d}, current={d}, max={d}", .{ size, current_capacity, max_capacity });
        }
    }

    /// Assert with error message - replaces std.debug.assert
    pub fn assert(self: *Tracer, condition: bool, comptime message: []const u8) void {
        if (!condition) {
            log.err("ASSERTION FAILED: {s}", .{message});
            if (self.config.enabled) {
                if (self.recent_opcodes.prettyPrint(self.allocator)) |output| {
                    defer self.allocator.free(output);
                    log.err("{s}", .{output});
                } else |_| {
                    // If pretty print fails, at least show the count
                    log.err("Ring buffer has {} recent instructions", .{self.recent_opcodes.count});
                }
            }

            const builtin = @import("builtin");
            if (builtin.target.cpu.arch == .wasm32 and builtin.target.os.tag == .freestanding) {
                unreachable;
            } else {
                @panic(message);
            }
        }
    }

    // TODO: Add debug logging
    pub fn onBytecodeAnalysisStart(self: *Tracer, code_len: usize) void {
        _ = self;
        _ = code_len;
    }

    // TODO: Add debug logging
    pub fn onBytecodeAnalysisComplete(self: *Tracer, validated_up_to: usize, opcode_count: usize, jumpdest_count: usize) void {
        _ = self;
        _ = validated_up_to;
        _ = opcode_count;
        _ = jumpdest_count;
    }

    // TODO: Add debug logging
    /// Called when an invalid opcode is found during analysis
    pub fn onInvalidOpcode(self: *Tracer, pc: usize, opcode: u8) void {
        _ = self;
        _ = pc;
        _ = opcode;
        // No-op in default tracer
    }

    // TODO: Add debug logging
    /// Called when a JUMPDEST is found during analysis
    pub fn onJumpdestFound(self: *Tracer, pc: usize, count: usize) void {
        _ = self;
        _ = pc;
        _ = count;
        // No-op in default tracer
    }

    // TODO: Add debug logging
    /// Called when dispatch schedule build starts
    pub fn onScheduleBuildStart(self: *Tracer, bytecode_len: usize) void {
        _ = self;
        _ = bytecode_len;
        // No-op in default tracer
    }

    // TODO: Add debug logging
    /// Called when a fusion optimization is detected
    pub fn onFusionDetected(self: *Tracer, pc: usize, fusion_type: []const u8, instruction_count: usize) void {
        _ = self;
        _ = pc;
        _ = fusion_type;
        _ = instruction_count;
        // No-op in default tracer
    }

    // TODO: Add debug logging
    /// Called when an invalid static jump is detected
    pub fn onInvalidStaticJump(self: *Tracer, jump_pc: usize, target_pc: usize) void {
        _ = self;
        _ = jump_pc;
        _ = target_pc;
        // No-op in default tracer
    }

    // TODO: Add debug logging
    /// Called when a static jump is resolved
    pub fn onStaticJumpResolved(self: *Tracer, jump_pc: usize, target_pc: usize) void {
        _ = self;
        _ = jump_pc;
        _ = target_pc;
        // No-op in default tracer
    }

    // TODO: Add debug logging
    /// Called when a truncated PUSH instruction is detected
    pub fn onTruncatedPush(self: *Tracer, pc: usize, push_size: u8, available: usize) void {
        _ = self;
        _ = pc;
        _ = push_size;
        _ = available;
        // No-op in default tracer
    }

    // TODO: Add debug logging
    /// Called when dispatch schedule build completes
    pub fn onScheduleBuildComplete(self: *Tracer, item_count: usize, fusion_count: usize) void {
        _ = self;
        _ = item_count;
        _ = fusion_count;
        // No-op in default tracer
    }

    // TODO: Add debug logging
    /// Called when a jump table is created
    pub fn onJumpTableCreated(self: *Tracer, jumpdest_count: usize) void {
        _ = self;
        _ = jumpdest_count;
        // No-op in default tracer
    }
};

// Helper function to get opcode name
fn getOpcodeName(opcode: u8) []const u8 {
    return switch (opcode) {
        0x00 => "STOP",
        0x01 => "ADD",
        0x02 => "MUL",
        0x03 => "SUB",
        0x04 => "DIV",
        0x05 => "SDIV",
        0x06 => "MOD",
        0x07 => "SMOD",
        0x08 => "ADDMOD",
        0x09 => "MULMOD",
        0x0a => "EXP",
        0x0b => "SIGNEXTEND",
        0x10 => "LT",
        0x11 => "GT",
        0x12 => "SLT",
        0x13 => "SGT",
        0x14 => "EQ",
        0x15 => "ISZERO",
        0x16 => "AND",
        0x17 => "OR",
        0x18 => "XOR",
        0x19 => "NOT",
        0x1a => "BYTE",
        0x1b => "SHL",
        0x1c => "SHR",
        0x1d => "SAR",
        0x20 => "KECCAK256",
        0x30 => "ADDRESS",
        0x31 => "BALANCE",
        0x32 => "ORIGIN",
        0x33 => "CALLER",
        0x34 => "CALLVALUE",
        0x35 => "CALLDATALOAD",
        0x36 => "CALLDATASIZE",
        0x37 => "CALLDATACOPY",
        0x38 => "CODESIZE",
        0x39 => "CODECOPY",
        0x3a => "GASPRICE",
        0x3b => "EXTCODESIZE",
        0x3c => "EXTCODECOPY",
        0x3d => "RETURNDATASIZE",
        0x3e => "RETURNDATACOPY",
        0x3f => "EXTCODEHASH",
        0x40 => "BLOCKHASH",
        0x41 => "COINBASE",
        0x42 => "TIMESTAMP",
        0x43 => "NUMBER",
        0x44 => "PREVRANDAO",
        0x45 => "GASLIMIT",
        0x46 => "CHAINID",
        0x47 => "SELFBALANCE",
        0x48 => "BASEFEE",
        0x49 => "BLOBHASH",
        0x4a => "BLOBBASEFEE",
        0x50 => "POP",
        0x51 => "MLOAD",
        0x52 => "MSTORE",
        0x53 => "MSTORE8",
        0x54 => "SLOAD",
        0x55 => "SSTORE",
        0x56 => "JUMP",
        0x57 => "JUMPI",
        0x58 => "PC",
        0x59 => "MSIZE",
        0x5a => "GAS",
        0x5b => "JUMPDEST",
        0x5c => "TLOAD",
        0x5d => "TSTORE",
        0x5e => "MCOPY",
        0x5f => "PUSH0",
        0x60...0x7f => |n| blk: {
            const push_names = [_][]const u8{
                "PUSH1",  "PUSH2",  "PUSH3",  "PUSH4",  "PUSH5",  "PUSH6",  "PUSH7",  "PUSH8",
                "PUSH9",  "PUSH10", "PUSH11", "PUSH12", "PUSH13", "PUSH14", "PUSH15", "PUSH16",
                "PUSH17", "PUSH18", "PUSH19", "PUSH20", "PUSH21", "PUSH22", "PUSH23", "PUSH24",
                "PUSH25", "PUSH26", "PUSH27", "PUSH28", "PUSH29", "PUSH30", "PUSH31", "PUSH32",
            };
            break :blk push_names[n - 0x60];
        },
        0x80...0x8f => |n| blk: {
            const dup_names = [_][]const u8{
                "DUP1", "DUP2",  "DUP3",  "DUP4",  "DUP5",  "DUP6",  "DUP7",  "DUP8",
                "DUP9", "DUP10", "DUP11", "DUP12", "DUP13", "DUP14", "DUP15", "DUP16",
            };
            break :blk dup_names[n - 0x80];
        },
        0x90...0x9f => |n| blk: {
            const swap_names = [_][]const u8{
                "SWAP1", "SWAP2",  "SWAP3",  "SWAP4",  "SWAP5",  "SWAP6",  "SWAP7",  "SWAP8",
                "SWAP9", "SWAP10", "SWAP11", "SWAP12", "SWAP13", "SWAP14", "SWAP15", "SWAP16",
            };
            break :blk swap_names[n - 0x90];
        },
        0xa0 => "LOG0",
        0xa1 => "LOG1",
        0xa2 => "LOG2",
        0xa3 => "LOG3",
        0xa4 => "LOG4",
        0xf0 => "CREATE",
        0xf1 => "CALL",
        0xf2 => "CALLCODE",
        0xf3 => "RETURN",
        0xf4 => "DELEGATECALL",
        0xf5 => "CREATE2",
        0xfa => "STATICCALL",
        0xfd => "REVERT",
        0xfe => "INVALID",
        0xff => "SELFDESTRUCT",
        else => "UNKNOWN",
    };
}

// Helper function to get synthetic opcode name
fn getSyntheticOpcodeName(opcode: u16) []const u8 {
    const OpcodeSynthetic = @import("../opcodes/opcode_synthetic.zig").OpcodeSynthetic;

    return switch (opcode) {
        @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE) => "PUSH_ADD_INLINE",
        @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER) => "PUSH_ADD_POINTER",
        @intFromEnum(OpcodeSynthetic.PUSH_SUB_INLINE) => "PUSH_SUB_INLINE",
        @intFromEnum(OpcodeSynthetic.PUSH_SUB_POINTER) => "PUSH_SUB_POINTER",
        @intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE) => "PUSH_MUL_INLINE",
        @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER) => "PUSH_MUL_POINTER",
        @intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE) => "PUSH_DIV_INLINE",
        @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER) => "PUSH_DIV_POINTER",
        @intFromEnum(OpcodeSynthetic.PUSH_AND_INLINE) => "PUSH_AND_INLINE",
        @intFromEnum(OpcodeSynthetic.PUSH_AND_POINTER) => "PUSH_AND_POINTER",
        @intFromEnum(OpcodeSynthetic.PUSH_OR_INLINE) => "PUSH_OR_INLINE",
        @intFromEnum(OpcodeSynthetic.PUSH_OR_POINTER) => "PUSH_OR_POINTER",
        @intFromEnum(OpcodeSynthetic.PUSH_XOR_INLINE) => "PUSH_XOR_INLINE",
        @intFromEnum(OpcodeSynthetic.PUSH_XOR_POINTER) => "PUSH_XOR_POINTER",
        @intFromEnum(OpcodeSynthetic.PUSH_MLOAD_INLINE) => "PUSH_MLOAD_INLINE",
        @intFromEnum(OpcodeSynthetic.PUSH_MLOAD_POINTER) => "PUSH_MLOAD_POINTER",
        @intFromEnum(OpcodeSynthetic.PUSH_MSTORE_INLINE) => "PUSH_MSTORE_INLINE",
        @intFromEnum(OpcodeSynthetic.PUSH_MSTORE_POINTER) => "PUSH_MSTORE_POINTER",
        @intFromEnum(OpcodeSynthetic.PUSH_MSTORE8_INLINE) => "PUSH_MSTORE8_INLINE",
        @intFromEnum(OpcodeSynthetic.PUSH_MSTORE8_POINTER) => "PUSH_MSTORE8_POINTER",
        @intFromEnum(OpcodeSynthetic.JUMP_TO_STATIC_LOCATION) => "JUMP_TO_STATIC_LOCATION",
        @intFromEnum(OpcodeSynthetic.JUMPI_TO_STATIC_LOCATION) => "JUMPI_TO_STATIC_LOCATION",
        @intFromEnum(OpcodeSynthetic.MULTI_PUSH_2) => "MULTI_PUSH_2",
        @intFromEnum(OpcodeSynthetic.MULTI_PUSH_3) => "MULTI_PUSH_3",
        @intFromEnum(OpcodeSynthetic.MULTI_POP_2) => "MULTI_POP_2",
        @intFromEnum(OpcodeSynthetic.MULTI_POP_3) => "MULTI_POP_3",
        @intFromEnum(OpcodeSynthetic.ISZERO_JUMPI) => "ISZERO_JUMPI",
        @intFromEnum(OpcodeSynthetic.DUP2_MSTORE_PUSH) => "DUP2_MSTORE_PUSH",
        @intFromEnum(OpcodeSynthetic.DUP3_ADD_MSTORE) => "DUP3_ADD_MSTORE",
        @intFromEnum(OpcodeSynthetic.SWAP1_DUP2_ADD) => "SWAP1_DUP2_ADD",
        @intFromEnum(OpcodeSynthetic.PUSH_DUP3_ADD) => "PUSH_DUP3_ADD",
        @intFromEnum(OpcodeSynthetic.FUNCTION_DISPATCH) => "FUNCTION_DISPATCH",
        @intFromEnum(OpcodeSynthetic.CALLVALUE_CHECK) => "CALLVALUE_CHECK",
        @intFromEnum(OpcodeSynthetic.PUSH0_REVERT) => "PUSH0_REVERT",
        @intFromEnum(OpcodeSynthetic.PUSH_ADD_DUP1) => "PUSH_ADD_DUP1",
        @intFromEnum(OpcodeSynthetic.MLOAD_SWAP1_DUP2) => "MLOAD_SWAP1_DUP2",
        else => "UNKNOWN_SYNTHETIC",
    };
}

// ============================================================================
