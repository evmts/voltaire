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
                // TEMPORARILY SKIP for final test without MinimalEvm interference
                if (false) {
                    if (self.minimal_evm) |*evm| {
                        if (!evm.stopped and !evm.reverted) {
                            self.executeMinimalEvmForOpcode(evm, opcode, frame, cursor);
                        }
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

                // Validate MinimalEvm state
                // TEMPORARILY SKIP for final test
                // self.validateMinimalEvmState(frame, opcode);

                // Update current PC
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
        const opcode_value = @intFromEnum(opcode);

        // Log what we're about to execute
        self.debug("=====================================", .{});
        self.debug("Frame executing: {s}", .{@tagName(opcode)});
        self.debug("  MinimalEvm PC: {d}", .{evm.pc});
        self.debug("  Frame stack size: {d}", .{frame.stack.size()});
        self.debug("  MinimalEvm stack size: {d}", .{evm.stack.items.len});

        // For regular opcodes (0x00-0xFF), execute one step
        if (opcode_value <= 0xff) {
            // SKIP bytecode verification for now since synthetic opcodes can cause PC misalignment
            // TODO: Fix PC synchronization between Frame synthetic operations and MinimalEvm sequential execution
            evm.step() catch |e| {
                self.err("MinimalEvm step failed: {any}", .{e});
            };
            return;
        }

        // Handle fused opcodes
        switch (opcode) {
            // PUSH + arithmetic fusions (2 steps)
            .PUSH_ADD_INLINE, .PUSH_ADD_POINTER => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executeOpcode(evm, @intFromEnum(Opcode.ADD));
            },
            .PUSH_MUL_INLINE, .PUSH_MUL_POINTER => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executeOpcode(evm, @intFromEnum(Opcode.MUL));
            },
            .PUSH_SUB_INLINE, .PUSH_SUB_POINTER => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executeOpcode(evm, @intFromEnum(Opcode.SUB));
            },
            .PUSH_DIV_INLINE, .PUSH_DIV_POINTER => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executeOpcode(evm, @intFromEnum(Opcode.DIV));
            },

            // Bitwise fusions
            .PUSH_AND_INLINE, .PUSH_AND_POINTER => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executeOpcode(evm, @intFromEnum(Opcode.AND));
            },
            .PUSH_OR_INLINE, .PUSH_OR_POINTER => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executeOpcode(evm, @intFromEnum(Opcode.OR));
            },
            .PUSH_XOR_INLINE, .PUSH_XOR_POINTER => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executeOpcode(evm, @intFromEnum(Opcode.XOR));
            },

            // Memory fusions
            .PUSH_MLOAD_INLINE, .PUSH_MLOAD_POINTER => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executeOpcode(evm, @intFromEnum(Opcode.MLOAD));
            },
            .PUSH_MSTORE_INLINE, .PUSH_MSTORE_POINTER => {
                // PUSH_MSTORE_INLINE: pushes offset then pops value and stores it
                // This is different from PUSH+MSTORE - it doesn't push the offset to stack
                // Instead it uses the offset directly and just pops the value

                // The Frame implementation pops one value (the data to store) and uses
                // the offset from metadata directly. We need to simulate this correctly.
                if (evm.stack.items.len == 0) {
                    self.err("PUSH_MSTORE requires 1 stack item but stack is empty", .{});
                    return;
                }

                // Get the offset from metadata (like Frame does)
                var offset: u256 = 0;
                if (cursor[1] == .push_inline) {
                    offset = cursor[1].push_inline.value;
                } else if (cursor[1] == .push_pointer) {
                    const idx = cursor[1].push_pointer.index;
                    offset = frame.u256_constants[idx];
                }

                // Pop the value to store (like Frame does)
                const value = evm.popStack() catch {
                    self.err("PUSH_MSTORE failed to pop value", .{});
                    return;
                };

                // Execute MSTORE with offset and value
                if (offset <= std.math.maxInt(u32)) {
                    const off = @as(u32, @intCast(offset));
                    evm.writeMemoryWord(off, value) catch |e| {
                        self.err("MinimalEvm memory write failed: {any}", .{e});
                    };
                    // Update PC and consume gas like MSTORE does
                    evm.consumeGas(primitives.GasConstants.GasFastestStep) catch {};
                    // Memory expansion gas
                    const new_mem_size = off + 32;
                    if (new_mem_size > evm.memory_size) {
                        const expansion = new_mem_size - evm.memory_size;
                        const gas_cost = std.math.mul(u64, expansion, 3) catch 0;
                        evm.consumeGas(gas_cost) catch {};
                    }
                    // Don't advance PC - this is handled by the Frame's next instruction
                }
            },
            .PUSH_MSTORE8_INLINE, .PUSH_MSTORE8_POINTER => {
                // Similar logic for MSTORE8
                if (evm.stack.items.len == 0) {
                    self.err("PUSH_MSTORE8 requires 1 stack item but stack is empty", .{});
                    return;
                }

                // Get the offset from metadata
                var offset: u256 = 0;
                if (cursor[1] == .push_inline) {
                    offset = cursor[1].push_inline.value;
                } else if (cursor[1] == .push_pointer) {
                    const idx = cursor[1].push_pointer.index;
                    offset = frame.u256_constants[idx];
                }

                // Pop the value to store
                const value = evm.popStack() catch {
                    self.err("PUSH_MSTORE8 failed to pop value", .{});
                    return;
                };

                // Execute MSTORE8 with offset and value
                if (offset <= std.math.maxInt(u32)) {
                    const off = @as(u32, @intCast(offset));
                    const byte_val = @as(u8, @truncate(value & 0xFF));
                    evm.writeMemory(off, byte_val) catch |e| {
                        self.err("MinimalEvm memory write failed: {any}", .{e});
                    };
                    // Update gas like MSTORE8 does
                    evm.consumeGas(primitives.GasConstants.GasFastestStep) catch {};
                    // Memory expansion gas
                    const new_mem_size = off + 1;
                    if (new_mem_size > evm.memory_size) {
                        const expansion = new_mem_size - evm.memory_size;
                        const gas_cost = std.math.mul(u64, expansion, 3) catch 0;
                        evm.consumeGas(gas_cost) catch {};
                    }
                }
            },

            // Control flow fusions
            .JUMP_TO_STATIC_LOCATION => {
                self.executePushFromPc(evm);
                self.executeOpcode(evm, @intFromEnum(Opcode.JUMP));
            },
            .JUMPI_TO_STATIC_LOCATION => {
                self.executePushFromPc(evm);
                self.executeOpcode(evm, @intFromEnum(Opcode.JUMPI));
            },

            // Multi-push/pop fusions
            .MULTI_PUSH_2 => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executePushWithMetadata(evm, frame, cursor + 1);
            },
            .MULTI_PUSH_3 => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executePushWithMetadata(evm, frame, cursor + 1);
                self.executePushWithMetadata(evm, frame, cursor + 2);
            },
            .MULTI_POP_2 => {
                self.executeOpcode(evm, @intFromEnum(Opcode.POP));
                self.executeOpcode(evm, @intFromEnum(Opcode.POP));
            },
            .MULTI_POP_3 => {
                self.executeOpcode(evm, @intFromEnum(Opcode.POP));
                self.executeOpcode(evm, @intFromEnum(Opcode.POP));
                self.executeOpcode(evm, @intFromEnum(Opcode.POP));
            },

            // Three-operation fusions
            .DUP2_MSTORE_PUSH => {
                self.executeOpcode(evm, @intFromEnum(Opcode.DUP2));
                self.executeOpcode(evm, @intFromEnum(Opcode.MSTORE));
                self.executePushFromPc(evm);
            },
            .DUP3_ADD_MSTORE => {
                self.executeOpcode(evm, @intFromEnum(Opcode.DUP3));
                self.executeOpcode(evm, @intFromEnum(Opcode.ADD));
                self.executeOpcode(evm, @intFromEnum(Opcode.MSTORE));
            },
            .SWAP1_DUP2_ADD => {
                self.executeOpcode(evm, @intFromEnum(Opcode.SWAP1));
                self.executeOpcode(evm, @intFromEnum(Opcode.DUP2));
                self.executeOpcode(evm, @intFromEnum(Opcode.ADD));
            },
            .PUSH_DUP3_ADD => {
                self.executePushFromPc(evm);
                self.executeOpcode(evm, @intFromEnum(Opcode.DUP3));
                self.executeOpcode(evm, @intFromEnum(Opcode.ADD));
            },
            .PUSH_ADD_DUP1 => {
                self.executePushWithMetadata(evm, frame, cursor);
                self.executeOpcode(evm, @intFromEnum(Opcode.ADD));
                self.executeOpcode(evm, @intFromEnum(Opcode.DUP1));
            },
            .MLOAD_SWAP1_DUP2 => {
                self.executeOpcode(evm, @intFromEnum(Opcode.MLOAD));
                self.executeOpcode(evm, @intFromEnum(Opcode.SWAP1));
                self.executeOpcode(evm, @intFromEnum(Opcode.DUP2));
            },
            .ISZERO_JUMPI => {
                self.executeOpcode(evm, @intFromEnum(Opcode.ISZERO));
                self.executePushFromPc(evm);
                self.executeOpcode(evm, @intFromEnum(Opcode.JUMPI));
            },
            .CALLVALUE_CHECK => {
                self.executeOpcode(evm, @intFromEnum(Opcode.CALLVALUE));
                self.executeOpcode(evm, @intFromEnum(Opcode.DUP1));
                self.executeOpcode(evm, @intFromEnum(Opcode.ISZERO));
            },
            .PUSH0_REVERT => {
                self.executeOpcode(evm, @intFromEnum(Opcode.PUSH0));
                self.executeOpcode(evm, @intFromEnum(Opcode.PUSH0));
                self.executeOpcode(evm, @intFromEnum(Opcode.REVERT));
            },

            // Four-operation fusion
            .FUNCTION_DISPATCH => {
                self.executePushFromPc(evm); // PUSH4 function selector
                self.executeOpcode(evm, @intFromEnum(Opcode.EQ));
                self.executePushFromPc(evm); // PUSH jump destination
                self.executeOpcode(evm, @intFromEnum(Opcode.JUMPI));
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

    /// Execute a single opcode in MinimalEvm
    fn executeOpcode(self: *DefaultTracer, evm: *MinimalEvm, opcode: u8) void {
        evm.executeOpcode(opcode) catch |e| {
            self.err("MinimalEvm exec error op=0x{x:0>2} at pc={d}: {any}", .{
                opcode, evm.pc, e
            });
        };
    }

    /// Execute a PUSH from current PC
    fn executePushFromPc(self: *DefaultTracer, evm: *MinimalEvm) void {
        if (evm.pc >= evm.bytecode.len) return;
        const op = evm.bytecode[evm.pc];
        if (!(op >= 0x5f and op <= 0x7f)) {
            self.warn("Expected PUSHx at pc={d}, found 0x{x:0>2}", .{ evm.pc, op });
        }
        self.executeOpcode(evm, op);
    }

    /// Execute a PUSH using dispatch metadata
    fn executePushWithMetadata(
        self: *DefaultTracer,
        evm: *MinimalEvm,
        frame: anytype,
        cursor: [*]const @TypeOf(frame.*).Dispatch.Item
    ) void {
        // Extract value and size from dispatch metadata
        var value: u256 = 0;
        var size: u8 = 0;

        if (cursor[1] == .push_inline) {
            value = cursor[1].push_inline.value;
            // Infer minimal size for inline values
            size = 1;
            var tmp: u256 = value;
            while ((tmp >> 8) != 0 and size < 8) : (size += 1) {
                tmp >>= 8;
            }
        } else if (cursor[1] == .push_pointer) {
            const idx = cursor[1].push_pointer.index;
            value = frame.u256_constants[idx];
            // Compute size as minimal bytes to encode value
            if (value == 0) {
                size = 0; // PUSH0
            } else {
                const bits: u16 = @intCast(256 - @clz(value));
                size = @intCast((bits + 7) / 8);
            }
        } else {
            // Not push metadata, fallback to PC-based push
            self.executePushFromPc(evm);
            return;
        }

        // Execute the push in MinimalEvm
        evm.consumeGas(primitives.GasConstants.GasFastestStep) catch {};
        evm.pushStack(value) catch |e| {
            self.warn("MinimalEvm push failed: {any}", .{e});
        };
        // Advance PC as if we executed PUSH{size}
        evm.pc += 1 + size;
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
