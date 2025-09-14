/// Configurable execution tracing system for EVM debugging and analysis
///
/// Provides multiple tracer implementations with compile-time selection:
/// - `DefaultTracer`: Validates execution in debug/safe builds
/// - `DebuggingTracer`: Step-by-step debugging (no-op implementation)
/// - `LoggingTracer`: Structured logging to stdout (minimal)
/// - `FileTracer`: File output (skeleton)
///
/// Tracers are selected at compile time for zero-cost abstractions.
/// Enable tracing by configuring the Frame with a specific TracerType.
const std = @import("std");
const log = @import("../log.zig");
const primitives = @import("primitives");
const pc_tracker_mod = @import("pc_tracker.zig");
const MinimalEvm = @import("MinimalEvm.zig").MinimalEvm;
const UnifiedOpcode = @import("../opcodes/opcode.zig").UnifiedOpcode;
const Opcode = @import("../opcodes/opcode.zig").Opcode;
const SafetyCounter = @import("../internal/safety_counter.zig").SafetyCounter;

// ============================================================================
// DEFAULT TRACER
// ============================================================================

// Default tracer does not do anything in release modes but does extensive defensive validation
// In debug and safe mode. In a debug mode the tracer can be thought of as unit tests that run in
// real time as the evm is executing and we are expected to have similar levels of coverage.
// For this reason, the tracer is intentionally decoupled from the EVM and is expected to share
// minimal code with it.
pub const DefaultTracer = struct {
    allocator: std.mem.Allocator,
    // Empty steps list to satisfy EVM interface
    steps: std.ArrayList(ExecutionStep),

    // PC tracker for validation (only in debug/safe builds)
    pc_tracker: ?pc_tracker_mod.PcTracker,

    // Gas tracking for validation
    gas_tracker: ?u64,

    // Current PC for tracking instruction pointer movement
    current_pc: u32,

    // Bytecode being executed for PC validation
    bytecode: []const u8,

    // Minimal EVM for parallel execution tracking and validation
    minimal_evm: ?MinimalEvm,

    // Execution tracking
    instruction_count: u64 = 0,  // Total instructions executed
    schedule_index: u64 = 0,     // Current dispatch schedule index
    simple_instruction_count: u64 = 0,  // Instructions in simple interpreter
    fused_instruction_count: u64 = 0,  // Instructions in fused interpreter

    // Safety counter to prevent infinite loops
    // Limit is 10x the block gas limit (30M gas * 10 = 300M instructions)
    // This is very generous - normal contracts execute far fewer instructions
    instruction_safety: SafetyCounter(u64, .enabled),

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

    pub fn init(allocator: std.mem.Allocator) DefaultTracer {
        return .{
            .allocator = allocator,
            .steps = std.ArrayList(ExecutionStep){
                .items = &.{},
                .capacity = 0,
            },
            .pc_tracker = null,
            .gas_tracker = null,
            .current_pc = 0,
            .bytecode = &[_]u8{},
            .minimal_evm = null,
            .instruction_count = 0,
            .schedule_index = 0,
            .simple_instruction_count = 0,
            .fused_instruction_count = 0,
            // 300M instructions is ~10x the block gas limit
            // Normal contracts execute far fewer instructions
            .instruction_safety = SafetyCounter(u64, .enabled).init(300_000_000),
        };
    }

    pub fn deinit(self: *DefaultTracer) void {
        // ArrayList in this case is just a view since we init with empty items
        // No need to deinit as we didn't allocate anything
        if (self.minimal_evm) |*evm| {
            evm.deinit();
        }
    }

    /// Initialize PC tracker with bytecode (called when frame starts interpretation)
    pub fn initPcTracker(self: *DefaultTracer, bytecode: []const u8) void {
        self.bytecode = bytecode;
        self.current_pc = 0;
    }

    /// Initialize MinimalEvm as a sidecar validator when frame starts interpretation
    pub fn onInterpret(self: *DefaultTracer, frame: anytype, bytecode: []const u8, gas_limit: i64) void {
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            // Cleanup any existing MinimalEvm
            if (self.minimal_evm) |*evm| {
                evm.deinit();
                self.minimal_evm = null;
            }

            // Reset execution counters
            self.instruction_count = 0;
            self.schedule_index = 0;
            self.simple_instruction_count = 0;
            self.fused_instruction_count = 0;

            // Reset the instruction safety counter for the new frame
            self.instruction_safety.count = 0;

            if (bytecode.len > 0) {
                // Initialize MinimalEvm with the same bytecode and gas
                self.minimal_evm = MinimalEvm.init(self.allocator, bytecode, gas_limit) catch null;

                if (self.minimal_evm) |*evm| {
                    // Sync initial state from frame
                    if (@hasField(@TypeOf(frame.*), "contract_address")) {
                        evm.address = frame.contract_address;
                    }
                    if (@hasField(@TypeOf(frame.*), "caller")) {
                        evm.caller = frame.caller;
                    }
                    if (@hasField(@TypeOf(frame.*), "value")) {
                        evm.value = frame.value;
                    }
                    if (@hasField(@TypeOf(frame.*), "calldata_slice")) {
                        evm.calldata = frame.calldata_slice;
                    }

                    self.debug("MinimalEvm initialized: bytecode_len={d}, gas={d}, address={any}", .{
                        bytecode.len,
                        gas_limit,
                        evm.address,
                    });
                    self.debug("MinimalEvm bytecode: {x}", .{bytecode});
                }
            }
        }
    }

    /// Called before an instruction executes
    /// This is the main entry point for instruction tracing
    pub fn before_instruction(
        self: *DefaultTracer,
        frame: anytype,
        comptime opcode: UnifiedOpcode,
        cursor: [*]const @TypeOf(frame.*).Dispatch.Item
    ) void {
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
                const opcode_name = comptime @tagName(opcode);
                const opcode_value = @intFromEnum(opcode);

                // Validate cursor points to expected handler for regular opcodes
                if (opcode_value <= 0xff) {
                    const expected_handler = @TypeOf(frame.*).opcode_handlers[opcode_value];
                    const actual_handler = cursor[0].opcode_handler;
                    if (actual_handler != expected_handler) {
                        self.err("[HANDLER] Handler mismatch for {s}: expected={*}, actual={*}", .{
                            opcode_name, expected_handler, actual_handler
                        });
                    }
                }

                // Increment instruction counts
                self.instruction_count += 1;
                if (opcode_value > 0xff) {
                    self.fused_instruction_count += 1;
                } else {
                    self.simple_instruction_count += 1;
                }

                // Increment safety counter - will panic if limit exceeded
                // with message about potential infinite loop or excessive instructions
                self.instruction_safety.inc();

                // Execute MinimalEvm steps for validation
                if (self.minimal_evm) |*evm| {
                    if (!evm.stopped and !evm.reverted) {
                        self.executeMinimalEvmForOpcode(evm, opcode, frame, cursor);
                    }
                }

                // Log execution
                const stack_size = frame.stack.size();
                log.debug("EXEC[{d}]: {s} | PC={d} stack={d} gas={d}", .{
                    self.instruction_count,
                    opcode_name,
                    self.current_pc,
                    stack_size,
                    frame.gas_remaining,
                });
            }
        }
    }

    /// Called after an instruction completes successfully
    pub fn after_instruction(
        self: *DefaultTracer,
        frame: anytype,
        comptime opcode: UnifiedOpcode,
        next_handler: anytype,
        next_cursor: [*]const @TypeOf(frame.*).Dispatch.Item
    ) void {
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
                const opcode_name = comptime @tagName(opcode);

                // Advance schedule index
                self.schedule_index += 1;

                // Validate next handler consistency
                if (next_cursor[0] != .opcode_handler or next_cursor[0].opcode_handler != next_handler) {
                    self.err("[SCHEDULE] Next handler mismatch at sched_idx={d}", .{self.schedule_index});
                }

                // Validate next handler points to expected handler for regular opcodes
                if (next_cursor[0] == .opcode_handler) {
                    // Extract the opcode from the next handler if it's a regular opcode
                    const next_opcode_value = self.getOpcodeFromHandler(@TypeOf(frame.*), next_handler);
                    if (next_opcode_value) |opcode_int| {
                        if (opcode_int <= 0xff) {
                            const expected_next_handler = @TypeOf(frame.*).opcode_handlers[opcode_int];
                            if (next_handler != expected_next_handler) {
                                self.err("[HANDLER] Next handler mismatch: opcode=0x{x:0>2}, expected={*}, actual={*}", .{
                                    opcode_int, expected_next_handler, next_handler
                                });
                            }
                        }
                    }
                }

                // Validate MinimalEvm state
                self.validateMinimalEvmState(frame, opcode);

                // Update current PC tracking
                // Note: PC synchronization between Frame dispatch and MinimalEvm sequential
                // execution is complex due to synthetic opcodes, so we track separately
                if (self.minimal_evm) |*evm| {
                    self.current_pc = evm.pc;
                }

                // Log completion
                log.debug("DONE[{d}]: {s} | PC={d}", .{
                    self.instruction_count,
                    opcode_name,
                    self.current_pc,
                });
            }
        }
    }

    /// Called when an instruction completes with a terminal state
    pub fn after_complete(
        self: *DefaultTracer,
        frame: anytype,
        comptime opcode: UnifiedOpcode
    ) void {
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            // Final validation for terminal states
            self.validateMinimalEvmState(frame, opcode);
        }
    }

    // ============================================================================
    // MINIMAL EVM EXECUTION
    // ============================================================================

    /// Execute MinimalEvm for the given UnifiedOpcode
    fn executeMinimalEvmForOpcode(
        self: *DefaultTracer,
        evm: *MinimalEvm,
        comptime opcode: UnifiedOpcode,
        frame: anytype,
        cursor: [*]const @TypeOf(frame.*).Dispatch.Item
    ) void {
        _ = cursor;
        const opcode_value = @intFromEnum(opcode);

        // Log what we're about to execute
        self.debug("=====================================", .{});
        self.debug("Frame executing: {s}", .{@tagName(opcode)});
        self.debug("  MinimalEvm PC: {d}", .{evm.pc});
        self.debug("  Frame stack size: {d}", .{frame.stack.size()});
        self.debug("  MinimalEvm stack size: {d}", .{evm.stack.items.len});

        // For regular opcodes (0x00-0xFF), execute exactly 1 opcode in MinimalEvm
        if (opcode_value <= 0xff) {
            // Execute the same opcode the Frame just executed
            evm.executeOpcode(@intCast(opcode_value)) catch |e| {
                self.err("MinimalEvm exec error op=0x{x:0>2}: {any}", .{ opcode_value, e });
            };
            return;
        }

        // Handle fused opcodes by validating bytecode and stepping
        switch (opcode) {
            // PUSH + arithmetic fusions (2 steps)
            .PUSH_ADD_INLINE, .PUSH_ADD_POINTER => {
                // Validate: should be PUSHn followed by ADD
                if (evm.pc >= evm.bytecode.len) {
                    self.err("PUSH_ADD: PC beyond bytecode", .{});
                    return;
                }
                const push_op = evm.bytecode[evm.pc];
                if (!(push_op >= 0x5f and push_op <= 0x7f)) {
                    self.err("PUSH_ADD: Expected PUSHx at PC={d}, found 0x{x:0>2}", .{ evm.pc, push_op });
                    return;
                }

                // Step twice: PUSH + ADD
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_ADD step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .PUSH_MUL_INLINE, .PUSH_MUL_POINTER => {
                // Validate: should be PUSHn followed by MUL
                if (evm.pc >= evm.bytecode.len) {
                    self.err("PUSH_MUL: PC beyond bytecode", .{});
                    return;
                }
                const push_op = evm.bytecode[evm.pc];
                if (!(push_op >= 0x5f and push_op <= 0x7f)) {
                    self.err("PUSH_MUL: Expected PUSHx at PC={d}, found 0x{x:0>2}", .{ evm.pc, push_op });
                    return;
                }

                // Step twice: PUSH + MUL
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_MUL step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .PUSH_SUB_INLINE, .PUSH_SUB_POINTER => {
                // Validate: should be PUSHn followed by SUB
                if (evm.pc >= evm.bytecode.len) {
                    self.err("PUSH_SUB: PC beyond bytecode", .{});
                    return;
                }
                const push_op = evm.bytecode[evm.pc];
                if (!(push_op >= 0x5f and push_op <= 0x7f)) {
                    self.err("PUSH_SUB: Expected PUSHx at PC={d}, found 0x{x:0>2}", .{ evm.pc, push_op });
                    return;
                }

                // Step twice: PUSH + SUB
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_SUB step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .PUSH_DIV_INLINE, .PUSH_DIV_POINTER => {
                // Validate: should be PUSHn followed by DIV
                if (evm.pc >= evm.bytecode.len) {
                    self.err("PUSH_DIV: PC beyond bytecode", .{});
                    return;
                }
                const push_op = evm.bytecode[evm.pc];
                if (!(push_op >= 0x5f and push_op <= 0x7f)) {
                    self.err("PUSH_DIV: Expected PUSHx at PC={d}, found 0x{x:0>2}", .{ evm.pc, push_op });
                    return;
                }

                // Step twice: PUSH + DIV
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_DIV step failed: {any}", .{e});
                        return;
                    };
                }
            },

            // Bitwise fusions
            .PUSH_AND_INLINE, .PUSH_AND_POINTER => {
                // Validate: should be PUSHn followed by AND
                if (evm.pc >= evm.bytecode.len) {
                    self.err("PUSH_AND: PC beyond bytecode", .{});
                    return;
                }
                const push_op = evm.bytecode[evm.pc];
                if (!(push_op >= 0x5f and push_op <= 0x7f)) {
                    self.err("PUSH_AND: Expected PUSHx at PC={d}, found 0x{x:0>2}", .{ evm.pc, push_op });
                    return;
                }

                // Step twice: PUSH + AND
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_AND step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .PUSH_OR_INLINE, .PUSH_OR_POINTER => {
                // Validate: should be PUSHn followed by OR
                if (evm.pc >= evm.bytecode.len) {
                    self.err("PUSH_OR: PC beyond bytecode", .{});
                    return;
                }
                const push_op = evm.bytecode[evm.pc];
                if (!(push_op >= 0x5f and push_op <= 0x7f)) {
                    self.err("PUSH_OR: Expected PUSHx at PC={d}, found 0x{x:0>2}", .{ evm.pc, push_op });
                    return;
                }

                // Step twice: PUSH + OR
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_OR step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .PUSH_XOR_INLINE, .PUSH_XOR_POINTER => {
                // Validate: should be PUSHn followed by XOR
                if (evm.pc >= evm.bytecode.len) {
                    self.err("PUSH_XOR: PC beyond bytecode", .{});
                    return;
                }
                const push_op = evm.bytecode[evm.pc];
                if (!(push_op >= 0x5f and push_op <= 0x7f)) {
                    self.err("PUSH_XOR: Expected PUSHx at PC={d}, found 0x{x:0>2}", .{ evm.pc, push_op });
                    return;
                }

                // Step twice: PUSH + XOR
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_XOR step failed: {any}", .{e});
                        return;
                    };
                }
            },

            // Memory fusions
            .PUSH_MLOAD_INLINE, .PUSH_MLOAD_POINTER => {
                // Validate: should be PUSHn followed by MLOAD
                if (evm.pc >= evm.bytecode.len) {
                    self.err("PUSH_MLOAD: PC beyond bytecode", .{});
                    return;
                }
                const push_op = evm.bytecode[evm.pc];
                if (!(push_op >= 0x5f and push_op <= 0x7f)) {
                    self.err("PUSH_MLOAD: Expected PUSHx at PC={d}, found 0x{x:0>2}", .{ evm.pc, push_op });
                    return;
                }

                // Step twice: PUSH + MLOAD
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_MLOAD step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .PUSH_MSTORE_INLINE, .PUSH_MSTORE_POINTER => {
                // Validate: should be PUSHn followed by MSTORE
                if (evm.pc >= evm.bytecode.len) {
                    self.err("PUSH_MSTORE: PC beyond bytecode", .{});
                    return;
                }
                const push_op = evm.bytecode[evm.pc];
                if (!(push_op >= 0x5f and push_op <= 0x7f)) {
                    self.err("PUSH_MSTORE: Expected PUSHx at PC={d}, found 0x{x:0>2}", .{ evm.pc, push_op });
                    return;
                }

                // Step twice: PUSH + MSTORE
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_MSTORE step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .PUSH_MSTORE8_INLINE, .PUSH_MSTORE8_POINTER => {
                // Validate: should be PUSHn followed by MSTORE8
                if (evm.pc >= evm.bytecode.len) {
                    self.err("PUSH_MSTORE8: PC beyond bytecode", .{});
                    return;
                }
                const push_op = evm.bytecode[evm.pc];
                if (!(push_op >= 0x5f and push_op <= 0x7f)) {
                    self.err("PUSH_MSTORE8: Expected PUSHx at PC={d}, found 0x{x:0>2}", .{ evm.pc, push_op });
                    return;
                }

                // Step twice: PUSH + MSTORE8
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_MSTORE8 step failed: {any}", .{e});
                        return;
                    };
                }
            },

            // Control flow fusions
            .JUMP_TO_STATIC_LOCATION => {
                // Step twice: PUSH + JUMP
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("JUMP_TO_STATIC_LOCATION step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .JUMPI_TO_STATIC_LOCATION => {
                // Step twice: PUSH + JUMPI
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("JUMPI_TO_STATIC_LOCATION step failed: {any}", .{e});
                        return;
                    };
                }
            },

            // Multi-push/pop fusions
            .MULTI_PUSH_2 => {
                // Step twice: PUSH + PUSH
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("MULTI_PUSH_2 step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .MULTI_PUSH_3 => {
                // Step 3 times: PUSH + PUSH + PUSH
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("MULTI_PUSH_3 step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .MULTI_POP_2 => {
                // Step twice: POP + POP
                inline for (0..2) |_| {
                    evm.step() catch |e| {
                        self.err("MULTI_POP_2 step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .MULTI_POP_3 => {
                // Step 3 times: POP + POP + POP
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("MULTI_POP_3 step failed: {any}", .{e});
                        return;
                    };
                }
            },

            // Three-operation fusions
            .DUP2_MSTORE_PUSH => {
                // Step 3 times: DUP2 + MSTORE + PUSH
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("DUP2_MSTORE_PUSH step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .DUP3_ADD_MSTORE => {
                // Step 3 times: DUP3 + ADD + MSTORE
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("DUP3_ADD_MSTORE step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .SWAP1_DUP2_ADD => {
                // Step 3 times: SWAP1 + DUP2 + ADD
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("SWAP1_DUP2_ADD step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .PUSH_DUP3_ADD => {
                // Step 3 times: PUSH + DUP3 + ADD
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_DUP3_ADD step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .PUSH_ADD_DUP1 => {
                // Step 3 times: PUSH + ADD + DUP1
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH_ADD_DUP1 step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .MLOAD_SWAP1_DUP2 => {
                // Step 3 times: MLOAD + SWAP1 + DUP2
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("MLOAD_SWAP1_DUP2 step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .ISZERO_JUMPI => {
                // Step 3 times: ISZERO + PUSH + JUMPI
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("ISZERO_JUMPI step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .CALLVALUE_CHECK => {
                // Step 3 times: CALLVALUE + DUP1 + ISZERO
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("CALLVALUE_CHECK step failed: {any}", .{e});
                        return;
                    };
                }
            },
            .PUSH0_REVERT => {
                // Step 3 times: PUSH0 + PUSH0 + REVERT
                inline for (0..3) |_| {
                    evm.step() catch |e| {
                        self.err("PUSH0_REVERT step failed: {any}", .{e});
                        return;
                    };
                }
            },

            // Four-operation fusion
            .FUNCTION_DISPATCH => {
                // Step 4 times: PUSH4 + EQ + PUSH + JUMPI
                inline for (0..4) |_| {
                    evm.step() catch |e| {
                        self.err("FUNCTION_DISPATCH step failed: {any}", .{e});
                        return;
                    };
                }
            },

            else => {
                // Unknown synthetic opcode - just step once
                if (evm.pc < evm.bytecode.len) {
                    evm.step() catch |e| {
                        self.err("MinimalEvm step failed for synthetic opcode: {any}", .{e});
                    };
                }
            },
        }
    }


    /// Helper to get opcode number from handler pointer by searching opcode_handlers array
    fn getOpcodeFromHandler(self: *DefaultTracer, comptime FrameType: type, handler: FrameType.OpcodeHandler) ?u8 {
        _ = self;
        inline for (0..256) |i| {
            if (FrameType.opcode_handlers[i] == handler) {
                return @intCast(i);
            }
        }
        return null;
    }

    /// Validate MinimalEvm state against Frame state
    fn validateMinimalEvmState(
        self: *DefaultTracer,
        frame: anytype,
        comptime opcode: UnifiedOpcode
    ) void {
        if (self.minimal_evm) |*evm| {
            const opcode_name = @tagName(opcode);

            // Compare stack sizes
            const frame_stack_size = frame.stack.size();
            const evm_stack_size = evm.stack.items.len;

            if (evm_stack_size != frame_stack_size) {
                self.err("[DIVERGENCE] Stack size mismatch after {s}:", .{opcode_name});
                self.err("  MinimalEvm: {d}, Frame: {d}", .{evm_stack_size, frame_stack_size});

                // Show top elements for debugging
                if (evm_stack_size > 0) {
                    self.err("  MinimalEvm top: 0x{x}", .{
                        evm.stack.items[evm_stack_size - 1]
                    });
                }
                if (frame_stack_size > 0) {
                    self.err("  Frame top: 0x{x}", .{frame.stack.peek_unsafe()});
                }
            } else if (evm_stack_size > 0) {
                // Compare stack contents
                const frame_stack = frame.stack.get_slice();
                for (0..evm_stack_size) |i| {
                    const evm_val = evm.stack.items[evm_stack_size - 1 - i];
                    const frame_val = frame_stack[i];
                    if (evm_val != frame_val) {
                        self.err("[DIVERGENCE] Stack content mismatch at position {d}:", .{i});
                        self.err("  MinimalEvm: 0x{x}, Frame: 0x{x}", .{evm_val, frame_val});
                    }
                }
            }

            // Compare memory sizes
            const frame_memory_size = if (@hasField(@TypeOf(frame.*), "memory"))
                frame.memory.size() else 0;
            const evm_memory_size = evm.memory_size;

            if (evm_memory_size != frame_memory_size) {
                self.warn("[DIVERGENCE] Memory size mismatch:", .{});
                self.warn("  MinimalEvm: {d}, Frame: {d}", .{ evm_memory_size, frame_memory_size });
            }

            // Compare gas (allow small differences)
            const frame_gas_i64 = frame.gas_remaining;
            const evm_gas_i64 = evm.gas_remaining;

            // Calculate difference safely
            const diff_abs = @abs(frame_gas_i64 - evm_gas_i64);

            if (diff_abs > 100) {
                self.warn("[DIVERGENCE] Gas mismatch:", .{});
                const diff = frame_gas_i64 - evm_gas_i64;
                self.warn("  MinimalEvm: {d}, Frame: {d}, Diff: {d}", .{ evm_gas_i64, frame_gas_i64, diff });
            }
        }
    }

    // ============================================================================
    // LOGGING FUNCTIONS
    // ============================================================================

    pub fn debug(self: *DefaultTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.debug(format, args);
    }

    pub fn err(self: *DefaultTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.err(format, args);
    }

    pub fn warn(self: *DefaultTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.warn(format, args);
    }

    pub fn info(self: *DefaultTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.info(format, args);
    }

    pub fn throwError(self: *DefaultTracer, comptime format: []const u8, args: anytype) noreturn {
        _ = self;
        const builtin = @import("builtin");
        log.err("FATAL: " ++ format, args);
        if (builtin.target.cpu.arch == .wasm32 and builtin.target.os.tag == .freestanding) {
            @panic("EVM execution error");
        } else {
            unreachable;
        }
    }

    // ============================================================================
    // EVM LIFECYCLE EVENTS
    // ============================================================================

    pub fn onFrameStart(self: *DefaultTracer, code_len: usize, gas: u64, depth: u16) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            log.debug("[EVM] Frame execution started: code_len={}, gas={}, depth={}", .{ code_len, gas, depth });
        }
    }

    pub fn onFrameComplete(self: *DefaultTracer, gas_left: u64, output_len: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            log.debug("[EVM] Frame execution completed: gas_left={}, output_len={}", .{ gas_left, output_len });
        }
    }

    pub fn onAccountDelegation(self: *DefaultTracer, account: []const u8, delegated: []const u8) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            log.debug("[EVM] Account {x} has delegation to {x}", .{ account, delegated });
        }
    }

    pub fn onEmptyAccountAccess(self: *DefaultTracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            log.debug("[EVM] Empty account access", .{});
        }
    }

    /// Called when arena allocator is initialized
    pub fn onArenaInit(self: *DefaultTracer, initial_capacity: usize, max_capacity: usize, growth_factor: u32) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            log.debug("[ARENA] Initialized: initial={d}, max={d}, growth={d}%", .{ initial_capacity, max_capacity, growth_factor });
        }
    }

    /// Event: Call operation started
    pub fn onCallStart(self: *DefaultTracer, call_type: []const u8, gas: i64, to: anytype, value: u256) void {
        _ = self;
        _ = call_type;
        _ = gas;
        _ = to;
        _ = value;
    }

    /// Event: EVM initialization started
    pub fn onEvmInit(self: *DefaultTracer, gas_price: u256, origin: anytype, hardfork: []const u8) void {
        _ = self;
        _ = gas_price;
        _ = origin;
        _ = hardfork;
    }

    /// Called when arena is reset
    pub fn onArenaReset(self: *DefaultTracer, mode: []const u8, capacity_before: usize, capacity_after: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            log.debug("[ARENA] Reset ({s}): capacity {d} -> {d}", .{ mode, capacity_before, capacity_after });
        }
    }

    /// Event: Beacon root update processing
    pub fn onBeaconRootUpdate(self: *DefaultTracer, success: bool, error_val: ?anyerror) void {
        _ = self;
        _ = success;
        _ = error_val;
    }

    /// Event: Call operation completed
    pub fn onCallComplete(self: *DefaultTracer, success: bool, gas_left: i64, output_len: usize) void {
        _ = self;
        _ = success;
        _ = gas_left;
        _ = output_len;
    }

    /// Event: Preflight check for call
    pub fn onCallPreflight(self: *DefaultTracer, call_type: []const u8, result: []const u8) void {
        _ = self;
        _ = call_type;
        _ = result;
    }

    /// Event: Historical block hash update processing
    pub fn onHistoricalBlockHashUpdate(self: *DefaultTracer, success: bool, error_val: ?anyerror) void {
        _ = self;
        _ = success;
        _ = error_val;
    }

    /// Event: Code retrieval
    pub fn onCodeRetrieval(self: *DefaultTracer, address: anytype, code_len: usize, is_empty: bool) void {
        _ = self;
        _ = address;
        _ = code_len;
        _ = is_empty;
    }

    /// Event: Validator deposits processing
    pub fn onValidatorDeposits(self: *DefaultTracer, success: bool, error_val: ?anyerror) void {
        _ = self;
        _ = success;
        _ = error_val;
    }

    /// Called when an allocation is made
    pub fn onArenaAlloc(self: *DefaultTracer, size: usize, alignment: usize, current_capacity: usize) void {
        _ = self;
        _ = size;
        _ = alignment;
        _ = current_capacity;
    }

    /// Event: Frame bytecode initialization
    pub fn onFrameBytecodeInit(self: *DefaultTracer, bytecode_len: usize, success: bool, error_val: ?anyerror) void {
        _ = self;
        _ = bytecode_len;
        _ = success;
        _ = error_val;
    }

    /// Event: Validator withdrawals processing
    pub fn onValidatorWithdrawals(self: *DefaultTracer, success: bool, error_val: ?anyerror) void {
        _ = self;
        _ = success;
        _ = error_val;
    }

    /// Called when arena grows to accommodate new allocations
    pub fn onArenaGrow(self: *DefaultTracer, old_capacity: usize, new_capacity: usize, requested_size: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            log.debug("[ARENA] Growing: {d} -> {d} bytes (requested={d})", .{ old_capacity, new_capacity, requested_size });
        }
    }

    /// Called when allocation fails
    pub fn onArenaAllocFailed(self: *DefaultTracer, size: usize, current_capacity: usize, max_capacity: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            log.warn("[ARENA] Allocation failed: size={d}, current={d}, max={d}", .{ size, current_capacity, max_capacity });
        }
    }

    /// Assert with error message - replaces std.debug.assert
    pub fn assert(self: *DefaultTracer, condition: bool, comptime message: []const u8) void {
        if (!condition) {
            self.err("ASSERTION FAILED: {s}", .{ message });
            const builtin = @import("builtin");
            if (builtin.target.cpu.arch == .wasm32 and builtin.target.os.tag == .freestanding) {
                unreachable;
            } else {
                @panic(message);
            }
        }
    }

    /// Called when bytecode analysis starts
    pub fn onBytecodeAnalysisStart(self: *DefaultTracer, code_len: usize) void {
        _ = self;
        _ = code_len;
        // No-op in default tracer
    }

    /// Called when bytecode analysis completes
    pub fn onBytecodeAnalysisComplete(self: *DefaultTracer, validated_up_to: usize, opcode_count: usize, jumpdest_count: usize) void {
        _ = self;
        _ = validated_up_to;
        _ = opcode_count;
        _ = jumpdest_count;
        // No-op in default tracer
    }

    /// Called when an invalid opcode is found during analysis
    pub fn onInvalidOpcode(self: *DefaultTracer, pc: usize, opcode: u8) void {
        _ = self;
        _ = pc;
        _ = opcode;
        // No-op in default tracer
    }

    /// Called when a JUMPDEST is found during analysis
    pub fn onJumpdestFound(self: *DefaultTracer, pc: usize, count: usize) void {
        _ = self;
        _ = pc;
        _ = count;
        // No-op in default tracer
    }

    /// Called when dispatch schedule build starts
    pub fn onScheduleBuildStart(self: *DefaultTracer, bytecode_len: usize) void {
        _ = self;
        _ = bytecode_len;
        // No-op in default tracer
    }

    /// Called when a fusion optimization is detected
    pub fn onFusionDetected(self: *DefaultTracer, pc: usize, fusion_type: []const u8, instruction_count: usize) void {
        _ = self;
        _ = pc;
        _ = fusion_type;
        _ = instruction_count;
        // No-op in default tracer
    }

    /// Called when an invalid static jump is detected
    pub fn onInvalidStaticJump(self: *DefaultTracer, jump_pc: usize, target_pc: usize) void {
        _ = self;
        _ = jump_pc;
        _ = target_pc;
        // No-op in default tracer
    }

    /// Called when a static jump is resolved
    pub fn onStaticJumpResolved(self: *DefaultTracer, jump_pc: usize, target_pc: usize) void {
        _ = self;
        _ = jump_pc;
        _ = target_pc;
        // No-op in default tracer
    }

    /// Called when a truncated PUSH instruction is detected
    pub fn onTruncatedPush(self: *DefaultTracer, pc: usize, push_size: u8, available: usize) void {
        _ = self;
        _ = pc;
        _ = push_size;
        _ = available;
        // No-op in default tracer
    }

    /// Called when dispatch schedule build completes
    pub fn onScheduleBuildComplete(self: *DefaultTracer, item_count: usize, fusion_count: usize) void {
        _ = self;
        _ = item_count;
        _ = fusion_count;
        // No-op in default tracer
    }

    /// Called when a jump table is created
    pub fn onJumpTableCreated(self: *DefaultTracer, jumpdest_count: usize) void {
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
                "DUP1",  "DUP2",  "DUP3",  "DUP4",  "DUP5",  "DUP6",  "DUP7",  "DUP8",
                "DUP9",  "DUP10", "DUP11", "DUP12", "DUP13", "DUP14", "DUP15", "DUP16",
            };
            break :blk dup_names[n - 0x80];
        },
        0x90...0x9f => |n| blk: {
            const swap_names = [_][]const u8{
                "SWAP1",  "SWAP2",  "SWAP3",  "SWAP4",  "SWAP5",  "SWAP6",  "SWAP7",  "SWAP8",
                "SWAP9",  "SWAP10", "SWAP11", "SWAP12", "SWAP13", "SWAP14", "SWAP15", "SWAP16",
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

// ============================================================================
// OTHER TRACER IMPLEMENTATIONS (STUBS FOR NOW)
// ============================================================================

pub const DebuggingTracer = struct {
    pub fn init(allocator: std.mem.Allocator) DebuggingTracer {
        _ = allocator;
        return .{};
    }

    pub fn deinit(self: *DebuggingTracer) void {
        _ = self;
    }

    pub fn before_instruction(self: *DebuggingTracer, _: anytype, comptime _: UnifiedOpcode, _: anytype) void {
        _ = self;
    }

    pub fn after_instruction(self: *DebuggingTracer, frame: anytype, comptime opcode: UnifiedOpcode, next_handler: anytype, next_cursor: anytype) void {
        _ = self;
        _ = frame;
        _ = opcode;
        _ = next_handler;
        _ = next_cursor;
    }

    pub fn after_complete(self: *DebuggingTracer, frame: anytype, comptime opcode: UnifiedOpcode) void {
        _ = self;
        _ = frame;
        _ = opcode;
    }

    /// Assert with error message - replaces std.debug.assert
    pub fn assert(self: *DebuggingTracer, condition: bool, comptime message: []const u8) void {
        _ = self;
        if (!condition) {
            log.err("ASSERTION FAILED: {s}", .{ message });
            const builtin = @import("builtin");
            if (builtin.target.cpu.arch == .wasm32 and builtin.target.os.tag == .freestanding) {
                unreachable;
            } else {
                @panic(message);
            }
        }
    }
};

pub const LoggingTracer = struct {
    pub fn init(allocator: std.mem.Allocator) LoggingTracer {
        _ = allocator;
        return .{};
    }

    pub fn deinit(self: *LoggingTracer) void {
        _ = self;
    }

    pub fn before_instruction(self: *LoggingTracer, _: anytype, comptime opcode: UnifiedOpcode, _: anytype) void {
        _ = self;
        log.info("[LOG] Executing {s}", .{ @tagName(opcode) });
    }

    pub fn after_instruction(self: *LoggingTracer, frame: anytype, comptime opcode: UnifiedOpcode, next_handler: anytype, next_cursor: anytype) void {
        _ = self;
        _ = frame;
        _ = next_handler;
        _ = next_cursor;
        log.info("[LOG] Completed {s}", .{ @tagName(opcode) });
    }

    pub fn after_complete(self: *LoggingTracer, frame: anytype, comptime opcode: UnifiedOpcode) void {
        _ = self;
        _ = frame;
        log.info("[LOG] Terminal {s}", .{ @tagName(opcode) });
    }

    /// Assert with error message - replaces std.debug.assert
    pub fn assert(self: *LoggingTracer, condition: bool, comptime message: []const u8) void {
        _ = self;
        if (!condition) {
            log.err("ASSERTION FAILED: {s}", .{ message });
            const builtin = @import("builtin");
            if (builtin.target.cpu.arch == .wasm32 and builtin.target.os.tag == .freestanding) {
                unreachable;
            } else {
                @panic(message);
            }
        }
    }
};

pub const FileTracer = struct {
    pub fn init(allocator: std.mem.Allocator) FileTracer {
        _ = allocator;
        return .{};
    }

    pub fn deinit(self: *FileTracer) void {
        _ = self;
    }

    pub fn before_instruction(self: *FileTracer, _: anytype, comptime _: UnifiedOpcode, _: anytype) void {
        _ = self;
    }

    pub fn after_instruction(self: *FileTracer, frame: anytype, comptime opcode: UnifiedOpcode, next_handler: anytype, next_cursor: anytype) void {
        _ = self;
        _ = frame;
        _ = opcode;
        _ = next_handler;
        _ = next_cursor;
    }

    pub fn after_complete(self: *FileTracer, frame: anytype, comptime opcode: UnifiedOpcode) void {
        _ = self;
        _ = frame;
        _ = opcode;
    }

    /// Assert with error message - replaces std.debug.assert
    pub fn assert(self: *FileTracer, condition: bool, comptime message: []const u8) void {
        _ = self;
        if (!condition) {
            log.err("ASSERTION FAILED: {s}", .{ message });
            const builtin = @import("builtin");
            if (builtin.target.cpu.arch == .wasm32 and builtin.target.os.tag == .freestanding) {
                unreachable;
            } else {
                @panic(message);
            }
        }
    }
};
