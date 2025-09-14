/// Configurable execution tracing system for EVM debugging and analysis
///
/// Provides multiple tracer implementations with compile-time selection:
/// - `DefaultTracer`: Zero runtime overhead (default for production)
/// - `DebuggingTracer`: Step-by-step debugging with breakpoints
/// - `LoggingTracer`: Structured logging to stdout
/// - `FileTracer`: High-performance file output
/// - Custom tracers can be implemented by following the interface
///
/// Tracers are selected at compile time for zero-cost abstractions.
/// Enable tracing by configuring the Frame with a specific TracerType.
const std = @import("std");
const log = @import("../log.zig");
const frame_mod = @import("../frame/frame_c.zig");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.ZERO_ADDRESS;
const block_info_mod = @import("../block/block_info.zig");
const call_params_mod = @import("../frame/call_params.zig");
const call_result_mod = @import("../frame/call_result.zig");
const hardfork_mod = @import("../eips_and_hardforks/hardfork.zig");
const pc_tracker_mod = @import("pc_tracker.zig");
const MinimalEvm = @import("MinimalEvm.zig").MinimalEvm;
// const Host = @import("host.zig").Host; // Only needed for tests which are commented out

// ============================================================================
// NO-OP TRACER
// ============================================================================

// Default tracer does not do anything in release modes but does extensive defensive validation 
// In debug and safe mode. In a debug mode the tracer can be thought of as unit tests that run in
// real time as the evm is executing and we are expected to have similar levels of coverage.
// For this reason, the tracer is intentionally decoupled from the EVM and is expected to share
// minimal code with it.
pub const DefaultTracer = struct {
    // Empty steps list to satisfy EVM interface
    steps: std.ArrayList(ExecutionStep),
    // PC tracker for validation (only in debug/safe builds)
    // Our EVM does not execute via pc indexing into the bytecode
    // Our EVM instead executes as an array of function pointers to
    // opcode handlers that recursively call the next opcode at the
    // end of their instruction. We track pc internally here so we can provide
    // - Better tracing
    // - Unfuze, easily break down what is happening whenever our evm efficiently fuzed multiple instructions
    //   Into a single instruction, does a JIT, or any other potential optimization
    // - Validate the efficient opcode handler data structure is executing in order we expect in debug/safe modes
    pc_tracker: ?pc_tracker_mod.PcTracker,

    // To validate that gas is being tracked as expected we internally implement a simple independent gas tracking
    // system. This helps provide simpler and better traces when tracing is turned on, allows us to internally
    // test our gas is working as expected with unit tests as it executes in safe mode and debug mode, and
    // allows us to validate the gas is correct at the end of the execution.
    gas_tracker: ?u64,

    // Current PC for tracking instruction pointer movement
    current_pc: u32,
    // Bytecode being executed for PC validation
    bytecode: []const u8,

    // Minimal EVM for parallel execution tracking and validation
    minimal_evm: ?MinimalEvm,

    // Execution tracking
    instruction_count: u64 = 0,  // Total instructions executed
    simple_instruction_count: u64 = 0,  // Instructions in simple interpreter
    fused_instruction_count: u64 = 0,  // Instructions in fused interpreter

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
        _ = allocator; // DefaultTracer doesn't use allocator
        return .{
            .steps = std.ArrayList(ExecutionStep){},
            .pc_tracker = null, // Will be initialized when bytecode is available
            .gas_tracker = null,
            .current_pc = 0,
            .bytecode = &[_]u8{},
            .minimal_evm = null, // Will be initialized when bytecode is available
            .instruction_count = 0,
            .simple_instruction_count = 0,
            .fused_instruction_count = 0,
        };
    }

    pub fn deinit(self: *DefaultTracer) void {
        self.steps.deinit(std.heap.c_allocator);
        if (self.minimal_evm) |*evm| {
            evm.deinit();
        }
    }

    /// Initialize PC tracker with bytecode (called when frame starts interpretation)
    pub fn initPcTracker(self: *DefaultTracer, bytecode: []const u8) void {
        // Store bytecode for PC validation
        self.bytecode = bytecode;
        self.current_pc = 0;

        // Disable PC tracking for now - it needs more work to handle the dispatch model correctly
        // The issue is that dispatch pre-processes some instructions (like PUSH) and the PC tracker
        // doesn't see them, causing mismatches. This needs a deeper integration with dispatch.
        // TODO: Re-enable once we properly integrate with dispatch
        // const builtin = @import("builtin");
        // if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
        //     // Only initialize if not already initialized or if bytecode is non-empty
        //     if (bytecode.len > 0) {
        //         self.pc_tracker = pc_tracker_mod.PcTracker.init(bytecode);
        //     }
        // }
    }

    /// Initialize MinimalEvm as a sidecar validator when frame starts interpretation
    /// This is called by Frame.interpret_with_tracer after bytecode is validated
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
            self.simple_instruction_count = 0;
            self.fused_instruction_count = 0;

            if (bytecode.len > 0) {
                // Initialize MinimalEvm with the same bytecode and gas
                self.minimal_evm = MinimalEvm.init(std.heap.c_allocator, bytecode, gas_limit) catch null;

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

    pub fn beforeOp(self: *DefaultTracer, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        _ = self; // Will be used when PC validation is re-enabled
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            // TODO: Re-enable PC validation once we properly integrate with dispatch
            // The issue is that dispatch pre-processes PUSH instructions and changes the execution order
            // making our simple PC tracking incorrect. This needs deeper integration.
            //
            // // Validate PC matches our tracked PC
            // if (self.bytecode.len > 0) {
            //     if (pc != self.current_pc) {
            //         self.throwError(
            //             "PC tracking error: expected PC={d} but got PC={d} for opcode 0x{x:0>2}",
            //             .{ self.current_pc, pc, opcode }
            //         );
            //     }
            //
            //     // Validate opcode at this PC
            //     if (self.current_pc < self.bytecode.len) {
            //         const expected_opcode = self.bytecode[self.current_pc];
            //         if (expected_opcode != opcode) {
            //             self.throwError(
            //                 "Opcode mismatch at PC={d}: expected 0x{x:0>2} but got 0x{x:0>2}",
            //                 .{ pc, expected_opcode, opcode }
            //             );
            //         }
            //     }
            // }

            // Log execution
            const stack_size = frame.stack.size();
            std.log.debug("[EVM2] beforeOp: opcode=0x{x:0>2} PC={d} stack={d}", .{
                opcode,
                pc,
                stack_size,
            });
        }
    }

    pub fn afterOp(self: *DefaultTracer, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            // Update PC based on the opcode that just executed
            // We need to determine the UnifiedOpcode from the u8 value
            const next_pc = switch (opcode) {
                0x56 => blk: { // JUMP
                    if (frame.stack.size() > 0) {
                        const dest = frame.stack.peek_unsafe();
                        break :blk @as(u32, @intCast(dest & 0xFFFFFFFF));
                    }
                    break :blk self.current_pc + 1;
                },
                0x57 => blk: { // JUMPI
                    if (frame.stack.size() >= 2) {
                        const stack_slice = frame.stack.get_slice();
                        const dest = stack_slice[stack_slice.len - 1];
                        const condition = stack_slice[stack_slice.len - 2];
                        if (condition != 0) {
                            break :blk @as(u32, @intCast(dest & 0xFFFFFFFF));
                        }
                    }
                    break :blk self.current_pc + 1;
                },
                0x60...0x7f => blk: { // PUSH1-PUSH32
                    const push_size = (opcode - 0x5f);
                    break :blk self.current_pc + 1 + push_size;
                },
                0x5f => self.current_pc + 1, // PUSH0
                else => self.current_pc + 1,
            };

            std.log.debug("[EVM2] afterOp: opcode=0x{x:0>2} PC: {d} -> {d}", .{
                opcode,
                pc,
                next_pc,
            });

            self.current_pc = next_pc;
        }
    }

    pub fn onError(self: *DefaultTracer, pc: u32, opcode: u8, error_val: anyerror, comptime FrameType: type, frame: *const FrameType) void {
        _ = self;
        _ = pc;
        _ = opcode;
        _ = frame;
        std.debug.assert(error_val != error.OutOfMemory); // Suppress error set discard warning
        // FrameType is comptime, no need to discard
    }

    // Logging functions from log.zig
    pub fn debug(self: *DefaultTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
                std.log.debug("[EVM2] " ++ format, args);
            }
        }
    }

    pub fn err(self: *DefaultTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        const builtin = @import("builtin");
        if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
            std.log.err("[EVM2] " ++ format, args);
        }
    }

    pub fn warn(self: *DefaultTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        const builtin = @import("builtin");
        if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
            std.log.warn("[EVM2] " ++ format, args);
        }
    }

    pub fn info(self: *DefaultTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        const builtin = @import("builtin");
        if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
            std.log.info("[EVM2] " ++ format, args);
        }
    }

    /// Throw an error with a message, either panicking (in wasm) or unreachable (native)
    pub fn throwError(self: *DefaultTracer, comptime format: []const u8, args: anytype) noreturn {
        _ = self;
        const builtin = @import("builtin");

        // Always log the error first
        std.log.err("[EVM2] FATAL: " ++ format, args);

        // In wasm, use panic to provide better debugging
        if (builtin.target.cpu.arch == .wasm32 and builtin.target.os.tag == .freestanding) {
            @panic("EVM execution error");
        } else {
            unreachable;
        }
    }

    // ============================================================================
    // EVM LIFECYCLE EVENTS
    // ============================================================================

    /// Called when EVM starts executing a call
    pub fn onCallStart(self: *DefaultTracer, params: anytype, gas: u64) void {
        _ = self;
        _ = params;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Call started: gas={}", .{gas});
        }
    }

    /// Called when EVM completes a call
    pub fn onCallComplete(self: *DefaultTracer, success: bool, gas_left: u64) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Call completed: success={}, gas_left={}", .{ success, gas_left });
        }
    }

    /// Called when frame execution starts
    pub fn onFrameStart(self: *DefaultTracer, code_len: usize, gas: u64, depth: u16) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Frame execution started: code_len={}, gas={}, depth={}", .{ code_len, gas, depth });
        }
    }

    /// Called when frame execution completes
    pub fn onFrameComplete(self: *DefaultTracer, gas_left: u64, output_len: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Frame execution completed: gas_left={}, output_len={}", .{ gas_left, output_len });
        }
    }

    // ============================================================================
    // CONTRACT EVENTS
    // ============================================================================







    // ============================================================================
    // DELEGATION AND ACCOUNT EVENTS
    // ============================================================================

    /// Called when account has delegation
    pub fn onAccountDelegation(self: *DefaultTracer, account: []const u8, delegated: []const u8) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Account {x} has delegation to {x}", .{ account, delegated });
        }
    }


    /// Called when empty account is accessed
    pub fn onEmptyAccountAccess(self: *DefaultTracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Code is empty, returning empty account result", .{});
        }
    }

    // ============================================================================
    // TRANSFER AND VALUE EVENTS
    // ============================================================================


    // ============================================================================
    // CALL TYPE EVENTS
    // ============================================================================



    // ============================================================================
    // CREATE CONTRACT EVENTS
    // ============================================================================

    /// Called when CREATE2 starts
    pub fn onCreate2Start(self: *DefaultTracer, gas: u64, init_len: usize, value: u256) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] CREATE2: gas={}, init_len={}, value={}", .{ gas, init_len, value });
        }
    }

    /// Called when CREATE2 depth exceeded
    pub fn onCreate2DepthExceeded(self: *DefaultTracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] CREATE2: depth exceeded", .{});
        }
    }

    /// Called when CREATE2 fails to get account
    pub fn onCreate2GetAccountFailed(self: *DefaultTracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] CREATE2: get_account failed", .{});
        }
    }

    /// Called when CREATE2 has insufficient balance
    pub fn onCreate2InsufficientBalance(self: *DefaultTracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] CREATE2: insufficient balance", .{});
        }
    }

    /// Called when CREATE2 has address collision
    pub fn onCreate2Collision(self: *DefaultTracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] CREATE2: collision at address", .{});
        }
    }

    /// Called when CREATE2 has insufficient gas
    pub fn onCreate2InsufficientGas(self: *DefaultTracer, need: u64, have: u64) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] CREATE2: insufficient gas for overhead: need={}, have={}", .{ need, have });
        }
    }

    /// Called when init code execution fails

    /// Called when init code fails (success=false)
    pub fn onInitCodeFailed(self: *DefaultTracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Init code execution failed, success=false", .{});
        }
    }

    /// Called when init code is too large (EIP-3860)
    pub fn onInitCodeTooLarge(self: *DefaultTracer, size: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Init code too large: {} > 49152", .{size});
        }
    }

    // ============================================================================
    // FRAME INITIALIZATION EVENTS
    // ============================================================================

    /// Called when stack initialization fails
    pub fn onStackInitFailed(self: *DefaultTracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.err("[EVM] Frame.init: Failed to initialize stack", .{});
        }
    }

    /// Called when memory initialization fails
    pub fn onMemoryInitFailed(self: *DefaultTracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.err("[EVM] Frame.init: Failed to initialize memory", .{});
        }
    }

    /// Called when bytecode initialization fails

    // ============================================================================
    // BLOCK HASH EVENTS
    // ============================================================================

    /// Called when getting block hash from history contract fails

    // ============================================================================
    // JUMP AND CONTROL FLOW EVENTS
    // ============================================================================

    /// Called when JUMP destination is out of range
    pub fn onJumpDestinationOutOfRange(self: *DefaultTracer, dest: u256) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[EVM] JUMP: Invalid destination out of range: 0x{x}", .{dest});
        }
    }

    /// Called when JUMP destination is not a JUMPDEST
    pub fn onJumpInvalidDestination(self: *DefaultTracer, dest_pc: u32) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[EVM] JUMP: Invalid jump destination PC=0x{x} - not a JUMPDEST", .{dest_pc});
        }
    }

    /// Called when JUMPI destination is out of range
    pub fn onJumpiDestinationOutOfRange(self: *DefaultTracer, dest: u256) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[EVM] JUMPI: Invalid destination out of range: 0x{x}", .{dest});
        }
    }

    /// Called when JUMPI destination is not a JUMPDEST
    pub fn onJumpiInvalidDestination(self: *DefaultTracer, dest_pc: u32) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[EVM] JUMPI: Invalid jump destination PC=0x{x} - not a JUMPDEST", .{dest_pc});
        }
    }

    /// Called when JUMPDEST runs out of gas
    pub fn onJumpdestOutOfGas(self: *DefaultTracer, required: u64, available: i64) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[EVM] JUMPDEST: Out of gas - required={}, available={}", .{ required, available });
        }
    }

    /// Called when JUMPDEST has stack underflow
    pub fn onJumpdestStackUnderflow(self: *DefaultTracer, required: u16, current: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[EVM] JUMPDEST: Stack underflow - required min={}, current={}", .{ required, current });
        }
    }

    /// Called when JUMPDEST has stack overflow
    pub fn onJumpdestStackOverflow(self: *DefaultTracer, current: usize, max_change: i16, capacity: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[EVM] JUMPDEST: Stack overflow - current={}, max_change={}, capacity={}", .{ current, max_change, capacity });
        }
    }

    // ============================================================================
    // MEMORY OPERATION EVENTS
    // ============================================================================

    /// Called when MSTORE operation is performed
    pub fn onMstore(self: *DefaultTracer, offset: u256, value: u256) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] MSTORE: offset={x}, value={x}", .{ offset, value });
        }
    }

    // ============================================================================
    // STORAGE OPERATION EVENTS
    // ============================================================================

    /// Called when SSTORE metering is calculated
    pub fn onSstoreMetering(self: *DefaultTracer, slot: u256, original: u256, current: u256, new: u256, is_cold: bool, total: u64) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug(
                "[EVM] SSTORE metering: slot={}, original={}, current={}, new={}, is_cold={}, total={}",
                .{ slot, original, current, new, is_cold, total },
            );
        }
    }

    // ============================================================================
    // SYSTEM OPERATION EVENTS
    // ============================================================================

    /// Called when SELFDESTRUCT fails

    // ============================================================================
    // BYTECODE ANALYSIS EVENTS
    // ============================================================================

    /// Called when iterator PC exceeds packed bitmap length
    pub fn onIteratorPcExceedsBitmap(self: *DefaultTracer, pc: usize, bitmap_len: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.err("[EVM] Iterator PC {} exceeds packed_bitmap len {}", .{ pc, bitmap_len });
        }
    }

    /// Called when Solidity metadata is detected and bytecode is trimmed
    pub fn onSolidityMetadataDetected(self: *DefaultTracer, original_len: usize, trimmed_len: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Detected Solidity metadata, trimming bytecode from {} to {} bytes", .{ original_len, trimmed_len });
        }
    }

    /// Called when PUSH + JUMP fusion opportunity is detected
    pub fn onPushJumpFusionDetected(self: *DefaultTracer, pc: usize, push_value: u256, next_op: u8) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Detected PUSH + JUMP fusion opportunity at pc={}, push_value={}, next_op={x}", .{ pc, push_value, next_op });
        }
    }

    /// Called when PUSH + PUSH + JUMPI fusion opportunity is detected
    pub fn onPushPushJumpiFusionDetected(self: *DefaultTracer, pc: usize, jump_dest: u256, next_op: u8) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Detected PUSH + PUSH + JUMPI fusion opportunity at pc={}, jump_dest={}, next_op={x}", .{ pc, jump_dest, next_op });
        }
    }

    // ============================================================================
    // DISPATCH EVENTS
    // ============================================================================

    /// Called when dispatch starts bytecode analysis
    pub fn onDispatchBytecodeAnalysisStart(self: *DefaultTracer) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Dispatch.init: Starting bytecode analysis", .{});
        }
    }

    /// Called when dispatch completes schedule creation
    pub fn onDispatchScheduleComplete(self: *DefaultTracer, items: usize, jumpdests: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[EVM] Dispatch.init: Created schedule with {} items, {} jumpdests", .{ items, jumpdests });
        }
    }

    // ============================================================================
    // PRE-ANALYSIS TRACING EVENTS
    // ============================================================================
    // These methods provide visibility into bytecode analysis and schedule building
    // They are specific events that make it easy to audit what the EVM is doing

    /// Called when bytecode analysis starts
    pub fn onBytecodeAnalysisStart(self: *DefaultTracer, bytecode_len: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[ANALYSIS] Starting bytecode analysis: len={d}", .{bytecode_len});
        }
    }

    /// Called when bytecode analysis completes
    pub fn onBytecodeAnalysisComplete(self: *DefaultTracer, bytecode_len: usize, opcode_count: usize, jumpdest_count: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[ANALYSIS] Bytecode analysis complete: len={d}, opcodes={d}, jumpdests={d}", .{
                bytecode_len,
                opcode_count,
                jumpdest_count,
            });
        }
    }

    /// Called when an invalid opcode is encountered during analysis
    pub fn onInvalidOpcode(self: *DefaultTracer, pc: u32, opcode: u8) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[ANALYSIS] Invalid opcode at PC={d}: 0x{x:0>2}", .{ pc, opcode });
        }
    }

    /// Called when a truncated PUSH instruction is detected
    pub fn onTruncatedPush(self: *DefaultTracer, pc: u32, push_size: u8, available: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[ANALYSIS] Truncated PUSH at PC={d}: expected {d} bytes, only {d} available", .{
                pc,
                push_size,
                available,
            });
        }
    }

    /// Called when a valid JUMPDEST is found
    pub fn onJumpdestFound(self: *DefaultTracer, pc: u32, gas_cost: u32) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[ANALYSIS] JUMPDEST found at PC={d}, gas_cost={d}", .{ pc, gas_cost });
        }
    }

    /// Called when schedule building starts
    pub fn onScheduleBuildStart(self: *DefaultTracer, bytecode_len: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[SCHEDULE] Starting schedule build: bytecode_len={d}", .{bytecode_len});
        }
    }

    /// Called when schedule building completes
    pub fn onScheduleBuildComplete(self: *DefaultTracer, schedule_items: usize, u256_values: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[SCHEDULE] Schedule build complete: items={d}, u256_values={d}", .{
                schedule_items,
                u256_values,
            });
        }
    }

    /// Called when a bytecode fusion is detected
    pub fn onFusionDetected(self: *DefaultTracer, pc: u32, fusion_type: []const u8, original_length: u32) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[SCHEDULE] Fusion detected at PC={d}: type={s}, original_length={d}", .{
                pc,
                fusion_type,
                original_length,
            });
        }
    }

    /// Called when a static jump is resolved
    pub fn onStaticJumpResolved(self: *DefaultTracer, jump_pc: u32, target_pc: u32) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[SCHEDULE] Static jump resolved: PC={d} -> PC={d}", .{ jump_pc, target_pc });
        }
    }

    /// Called when an invalid static jump is detected
    pub fn onInvalidStaticJump(self: *DefaultTracer, pc: u32, target_pc: u32) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[SCHEDULE] Invalid static jump at PC={d}: target PC={d} is not a JUMPDEST", .{
                pc,
                target_pc,
            });
        }
    }

    /// Called when a jump table is created
    pub fn onJumpTableCreated(self: *DefaultTracer, entry_count: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[SCHEDULE] Jump table created with {d} entries", .{entry_count});
        }
    }

    /// Called for each schedule item added (detailed logging)
    pub fn onScheduleItem(self: *DefaultTracer, index: usize, item_type: []const u8, metadata: ?[]const u8) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            if (metadata) |meta| {
                std.log.debug("[SCHEDULE] Item[{d}]: {s} - {s}", .{ index, item_type, meta });
            } else {
                std.log.debug("[SCHEDULE] Item[{d}]: {s}", .{ index, item_type });
            }
        }
    }

    // ============================================================================
    // MEMORY ALLOCATION TRACING EVENTS
    // ============================================================================
    // These methods provide visibility into arena allocator operations

    /// Called when arena allocator is initialized
    pub fn onArenaInit(self: *DefaultTracer, initial_capacity: usize, max_capacity: usize, growth_factor: u32) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[ARENA] Initialized: initial={d}, max={d}, growth={d}%", .{
                initial_capacity,
                max_capacity,
                growth_factor,
            });
        }
    }

    /// Called when an allocation is made
    pub fn onArenaAlloc(self: *DefaultTracer, size: usize, alignment: usize, current_capacity: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[ARENA] Allocation: size={d}, align={d}, capacity={d}", .{
                size,
                alignment,
                current_capacity,
            });
        }
    }

    /// Called when arena grows to accommodate new allocations
    pub fn onArenaGrow(self: *DefaultTracer, old_capacity: usize, new_capacity: usize, requested_size: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[ARENA] Growing: {d} -> {d} bytes (requested={d})", .{
                old_capacity,
                new_capacity,
                requested_size,
            });
        }
    }

    /// Called when arena is reset
    pub fn onArenaReset(self: *DefaultTracer, mode: []const u8, capacity_before: usize, capacity_after: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.debug("[ARENA] Reset ({s}): capacity {d} -> {d}", .{
                mode,
                capacity_before,
                capacity_after,
            });
        }
    }

    /// Called when allocation fails
    pub fn onArenaAllocFailed(self: *DefaultTracer, size: usize, current_capacity: usize, max_capacity: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            std.log.warn("[ARENA] Allocation failed: size={d}, current={d}, max={d}", .{
                size,
                current_capacity,
                max_capacity,
            });
        }
    }

    /// Called when arena queries its capacity
    pub fn onArenaQuery(self: *DefaultTracer, capacity: usize, used_estimate: usize) void {
        _ = self;
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            // Only log detailed queries in very verbose debugging
            if (comptime false) {
                std.log.debug("[ARENA] Query: capacity={d}, estimated_used={d}", .{
                    capacity,
                    used_estimate,
                });
            }
        }
    }

    // === EVM-level Named Events ===

    /// Event: EVM initialization started
    pub fn onEvmInit(self: *DefaultTracer, gas_price: u256, origin: anytype, hardfork: []const u8) void {
        if (self.config.trace_preanalysis) {
            self.debug("[EVM] Initializing: gas_price={}, origin={x}, hardfork={s}", .{ gas_price, origin.bytes, hardfork });
        }
    }

    /// Event: Beacon root update processing
    pub fn onBeaconRootUpdate(self: *DefaultTracer, success: bool, error_val: ?anyerror) void {
        if (!success and error_val != null) {
            self.warn("[EVM] Failed to process beacon root update: {}", .{error_val.?});
        }
    }

    /// Event: Historical block hash update processing
    pub fn onHistoricalBlockHashUpdate(self: *DefaultTracer, success: bool, error_val: ?anyerror) void {
        if (!success and error_val != null) {
            self.warn("[EVM] Failed to process historical block hash update: {}", .{error_val.?});
        }
    }

    /// Event: Validator deposits processing
    pub fn onValidatorDeposits(self: *DefaultTracer, success: bool, error_val: ?anyerror) void {
        if (!success and error_val != null) {
            self.warn("[EVM] Failed to process validator deposits: {}", .{error_val.?});
        }
    }

    /// Event: Validator withdrawals processing
    pub fn onValidatorWithdrawals(self: *DefaultTracer, success: bool, error_val: ?anyerror) void {
        if (!success and error_val != null) {
            self.warn("[EVM] Failed to process validator withdrawals: {}", .{error_val.?});
        }
    }

    /// Event: Call operation started
    pub fn onCallStart(self: *DefaultTracer, call_type: []const u8, gas: i64, to: anytype, value: u256) void {
        if (self.config.trace_preanalysis) {
            self.debug("[EVM] Starting {s}: gas={}, to={x}, value={}", .{ call_type, gas, to.bytes, value });
        }
    }

    /// Event: Call operation completed
    pub fn onCallComplete(self: *DefaultTracer, success: bool, gas_left: i64, output_len: usize) void {
        if (self.config.trace_preanalysis) {
            self.debug("[EVM] Call complete: success={}, gas_left={}, output_len={}", .{ success, gas_left, output_len });
        }
    }

    /// Event: Call value transfer
    pub fn onCallValueTransfer(self: *DefaultTracer, from: anytype, to: anytype, value: u256, success: bool) void {
        if (!success) {
            self.debug("[EVM] Call value transfer failed: from={x}, to={x}, value={}", .{ from.bytes, to.bytes, value });
        }
    }

    /// Event: Preflight check for call
    pub fn onCallPreflight(self: *DefaultTracer, call_type: []const u8, result: []const u8) void {
        if (self.config.trace_preanalysis) {
            self.debug("[EVM] {s} preflight: {s}", .{ call_type, result });
        }
    }

    /// Event: Account lookup
    pub fn onAccountLookup(self: *DefaultTracer, address: anytype, found: bool, has_delegation: bool) void {
        _ = found;
        if (self.config.trace_preanalysis and has_delegation) {
            self.debug("[EVM] Account {x} has delegation", .{address.bytes});
        }
    }

    /// Event: Code retrieval
    pub fn onCodeRetrieval(self: *DefaultTracer, address: anytype, code_len: usize, is_empty: bool) void {
        if (self.config.trace_preanalysis) {
            if (is_empty) {
                self.debug("[EVM] Code is empty for address {x}", .{address.bytes});
            } else {
                self.debug("[EVM] Retrieved code: address={x}, length={}", .{ address.bytes, code_len });
            }
        }
    }

    /// Event: CREATE/CREATE2 operation started
    pub fn onCreateStart(self: *DefaultTracer, create_type: []const u8, gas: i64, init_len: usize, value: u256) void {
        self.debug("[EVM] {s}: gas={}, init_len={}, value={}", .{ create_type, gas, init_len, value });
    }

    /// Event: CREATE depth check
    pub fn onCreateDepthExceeded(self: *DefaultTracer, depth: usize, max_depth: usize) void {
        self.debug("[EVM] CREATE depth exceeded: depth={}, max={}", .{ depth, max_depth });
    }

    /// Event: CREATE insufficient balance
    pub fn onCreateInsufficientBalance(self: *DefaultTracer, balance: u256, required: u256) void {
        self.debug("[EVM] CREATE insufficient balance: have={}, need={}", .{ balance, required });
    }

    /// Event: CREATE collision detected
    pub fn onCreateCollision(self: *DefaultTracer, address: anytype) void {
        self.debug("[EVM] CREATE collision at address {x}", .{address.bytes});
    }

    /// Event: CREATE gas overhead check
    pub fn onCreateGasOverhead(self: *DefaultTracer, required: i64, available: i64) void {
        if (required > available) {
            self.debug("[EVM] CREATE insufficient gas for overhead: need={}, have={}", .{ required, available });
        }
    }

    /// Event: Init code execution
    pub fn onInitCodeExecution(self: *DefaultTracer, code_len: usize, gas: i64) void {
        if (self.config.trace_preanalysis) {
            self.debug("[EVM] Executing init code: len={}, gas={}", .{ code_len, gas });
        }
    }

    /// Event: Init code result
    pub fn onInitCodeResult(self: *DefaultTracer, success: bool, output_len: usize, error_val: ?anyerror) void {
        if (!success) {
            if (error_val) |e| {
                self.debug("[EVM] Init code execution failed: {}", .{e});
            } else {
                self.debug("[EVM] Init code execution failed, success=false", .{});
            }
        } else if (self.config.trace_preanalysis) {
            self.debug("[EVM] Init code succeeded: output_len={}", .{output_len});
        }
    }

    /// Event: Init code size check
    pub fn onInitCodeSizeCheck(self: *DefaultTracer, code_len: usize, max_len: usize) void {
        if (code_len > max_len) {
            self.debug("[EVM] Init code too large: {} > {}", .{ code_len, max_len });
        }
    }

    /// Event: Frame execution started
    pub fn onFrameExecutionStart(self: *DefaultTracer, code_len: usize, gas: i64, depth: usize) void {
        self.debug("[EVM] Starting frame: code_len={}, gas={}, depth={}", .{ code_len, gas, depth });
    }

    /// Event: Frame execution completed
    pub fn onFrameExecutionComplete(self: *DefaultTracer, gas_remaining: i64, output_len: usize, termination: []const u8) void {
        if (self.config.trace_preanalysis) {
            self.debug("[EVM] Frame complete: gas_remaining={}, output_len={}, termination={s}", .{ gas_remaining, output_len, termination });
        }
    }

    /// Event: Frame execution error
    pub fn onFrameExecutionError(self: *DefaultTracer, error_val: anyerror) void {
        self.debug("[EVM] Frame execution failed: {}", .{error_val});
    }

    /// Event: Journal operation
    pub fn onJournalOperation(self: *DefaultTracer, operation: []const u8, snapshot_id: anytype) void {
        if (self.config.trace_preanalysis) {
            self.debug("[EVM] Journal {s}: snapshot_id={}", .{ operation, snapshot_id });
        }
    }

    /// Event: Journal revert error
    pub fn onJournalRevertError(self: *DefaultTracer, error_val: anyerror) void {
        self.err("[EVM] Failed to revert journal entry: {}", .{error_val});
    }

    /// Event: Block hash lookup
    pub fn onBlockHashLookup(self: *DefaultTracer, block_number: u64, found: bool, error_val: ?anyerror) void {
        _ = block_number;
        if (!found and error_val != null) {
            self.debug("[EVM] Failed to get block hash from history contract: {}", .{error_val.?});
        }
    }

    // === Frame-level Named Events ===

    /// Event: Frame initialization
    pub fn onFrameInit(self: *DefaultTracer, gas: i64, caller: anytype, value: u256, calldata_len: usize) void {
        if (self.config.trace_preanalysis) {
            self.debug("[Frame] Init: gas={}, caller={x}, value={}, calldata_len={}", .{ gas, caller.bytes, value, calldata_len });
        }
    }

    /// Event: Frame initialization error
    pub fn onFrameInitError(self: *DefaultTracer, component: []const u8, error_val: anyerror) void {
        self.err("[Frame] Failed to initialize {s}: {}", .{ component, error_val });
    }

    /// Event: Frame bytecode initialization
    pub fn onFrameBytecodeInit(self: *DefaultTracer, bytecode_len: usize, success: bool, error_val: ?anyerror) void {
        _ = bytecode_len;
        if (!success and error_val != null) {
            self.err("[Frame] Bytecode init failed: {}", .{error_val.?});
        }
    }

    /// Event: Dispatch cache lookup
    pub fn onDispatchCacheLookup(self: *DefaultTracer, bytecode_len: usize, hit: bool) void {
        if (self.config.trace_preanalysis) {
            const result = if (hit) "hit" else "miss";
            self.debug("[Frame] Dispatch cache {s}: bytecode_len={}", .{ result, bytecode_len });
        }
    }

    /// Event: Dispatch cache store
    pub fn onDispatchCacheStore(self: *DefaultTracer, bytecode_len: usize, evicted: bool) void {
        if (self.config.trace_preanalysis and evicted) {
            self.debug("[Frame] Dispatch cache store with eviction: bytecode_len={}", .{bytecode_len});
        } else {
            _ = self;
            _ = bytecode_len;
        }
    }

    /// Event: Performance warning
    pub fn onPerformanceWarning(self: *DefaultTracer, operation: []const u8, elapsed_ns: u64, threshold_ns: u64) void {
        self.warn("[PERF] {s}: elapsed={} ns (threshold={} ns)", .{ operation, elapsed_ns, threshold_ns });
    }

    /// Validate MinimalEvm state against main EVM with detailed diffs
    fn validateMinimalEvmState(self: *DefaultTracer, frame: anytype, comptime opcode: @import("../opcodes/opcode.zig").UnifiedOpcode) void {
        if (self.minimal_evm) |*evm| {
            const builtin = @import("builtin");
            if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
                const opcode_name = comptime @tagName(opcode);
                var has_mismatch = false;

                // Validate stack
                if (@hasField(@TypeOf(frame.*), "stack")) {
                    const frame_stack = frame.stack.get_slice();
                    const evm_stack = evm.stack.items;

                    if (evm_stack.len != frame_stack.len) {
                        has_mismatch = true;
                        self.err(
                            "[DIVERGENCE] Stack size mismatch at instruction #{d} ({s} @ PC={d}):\n" ++
                            "  MinimalEvm stack size: {d}\n" ++
                            "  Frame stack size: {d}\n" ++
                            "  Difference: {d}",
                            .{
                                self.instruction_count,
                                opcode_name,
                                self.current_pc,
                                evm_stack.len,
                                frame_stack.len,
                                @as(i64, @intCast(evm_stack.len)) - @as(i64, @intCast(frame_stack.len))
                            },
                        );

                        // Show stack contents for debugging
                        if (evm_stack.len > 0) {
                            self.err("  MinimalEvm stack top: 0x{x}", .{evm_stack[evm_stack.len - 1]});
                        }
                        if (frame_stack.len > 0) {
                            self.err("  Frame stack top: 0x{x}", .{frame_stack[frame_stack.len - 1]});
                        }
                    } else {
                        // Check stack values match
                        for (evm_stack, 0..) |evm_val, i| {
                            const frame_val = frame_stack[i];
                            if (evm_val != frame_val) {
                                has_mismatch = true;
                                self.err(
                                    "[DIVERGENCE] Stack value mismatch at position {d} (instruction #{d}, {s} @ PC={d}):\n" ++
                                    "  MinimalEvm: 0x{x}\n" ++
                                    "  Frame: 0x{x}",
                                    .{ i, self.instruction_count, opcode_name, self.current_pc, evm_val, frame_val },
                                );
                            }
                        }
                    }
                }

                // Validate gas
                if (@hasField(@TypeOf(frame.*), "gas_remaining")) {
                    const gas_diff = if (evm.gas_remaining > frame.gas_remaining)
                        evm.gas_remaining - frame.gas_remaining
                    else
                        frame.gas_remaining - evm.gas_remaining;

                    if (gas_diff > 100) { // Allow small differences due to different gas models
                        has_mismatch = true;
                        self.err(
                            "[DIVERGENCE] Gas mismatch at instruction #{d} ({s} @ PC={d}):\n" ++
                            "  MinimalEvm gas: {d}\n" ++
                            "  Frame gas: {d}\n" ++
                            "  Difference: {d}",
                            .{
                                self.instruction_count,
                                opcode_name,
                                self.current_pc,
                                evm.gas_remaining,
                                frame.gas_remaining,
                                gas_diff
                            },
                        );
                    }
                }

                // Validate memory size
                if (@hasField(@TypeOf(frame.*), "memory")) {
                    const frame_mem_size = frame.memory.size();
                    if (evm.memory_size != frame_mem_size) {
                        has_mismatch = true;
                        self.err(
                            "[DIVERGENCE] Memory size mismatch at instruction #{d} ({s} @ PC={d}):\n" ++
                            "  MinimalEvm memory: {d} bytes\n" ++
                            "  Frame memory: {d} bytes",
                            .{
                                self.instruction_count,
                                opcode_name,
                                self.current_pc,
                                evm.memory_size,
                                frame_mem_size
                            },
                        );
                    }
                }

                if (has_mismatch) {
                    self.err(
                        "[DIVERGENCE SUMMARY] Execution diverged at:\n" ++
                        "  Instruction count: {d} (simple: {d}, fused: {d})\n" ++
                        "  Opcode: {s}\n" ++
                        "  PC: {d}",
                        .{
                            self.instruction_count,
                            self.simple_instruction_count,
                            self.fused_instruction_count,
                            opcode_name,
                            self.current_pc,
                        },
                    );
                }
            }
        }
    }

    /// Calculate the next PC based on the current opcode
    /// Most opcodes increment PC by 1, but JUMP/JUMPI read from stack
    fn calculateNextPc(self: *const DefaultTracer, frame: anytype, comptime opcode: @import("../opcodes/opcode.zig").UnifiedOpcode) u32 {
        const opcode_value = @intFromEnum(opcode);

        // Handle different opcode categories
        return switch (opcode) {
            // JUMP - unconditional jump, PC comes from stack
            .JUMP => blk: {
                if (frame.stack.size() > 0) {
                    const dest = frame.stack.peek_unsafe();
                    // Truncate to u32 for PC
                    break :blk @as(u32, @intCast(dest & 0xFFFFFFFF));
                }
                // If stack is empty (shouldn't happen), just increment
                break :blk self.current_pc + 1;
            },

            // JUMPI - conditional jump, PC comes from stack if condition is true
            .JUMPI => blk: {
                if (frame.stack.size() >= 2) {
                    // Get destination and condition (don't pop, just peek)
                    const stack_slice = frame.stack.get_slice();
                    const dest = stack_slice[stack_slice.len - 1]; // Top is destination
                    const condition = stack_slice[stack_slice.len - 2]; // Second is condition

                    if (condition != 0) {
                        // Jump taken
                        break :blk @as(u32, @intCast(dest & 0xFFFFFFFF));
                    }
                }
                // Jump not taken or stack underflow, continue to next instruction
                // For JUMPI, we need to account for the fact it's 1 byte
                break :blk self.current_pc + 1;
            },

            // PUSH instructions - skip over the push data
            .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8,
            .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16,
            .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24,
            .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => blk: {
                // PUSH opcodes skip the data bytes
                const push_size = (opcode_value - 0x5f); // PUSH1 is 0x60, so size = opcode - 0x5f
                break :blk self.current_pc + 1 + push_size;
            },

            // PUSH0 is special - just 1 byte
            .PUSH0 => self.current_pc + 1,

            // PC opcode - doesn't affect PC calculation but returns current PC
            .PC => self.current_pc + 1,

            // All other opcodes increment by 1
            else => self.current_pc + 1,
        };
    }

    pub fn before_instruction(self: *DefaultTracer, frame: anytype, comptime opcode: @import("../opcodes/opcode.zig").UnifiedOpcode) void {
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
                // Get opcode name at compile time
                const opcode_name = comptime @tagName(opcode);
                const opcode_value = @intFromEnum(opcode);

                // Increment instruction counts
                self.instruction_count += 1;
                if (opcode_value > 0xff) {
                    // Synthetic/fused opcode
                    self.fused_instruction_count += 1;
                } else {
                    // Simple opcode
                    self.simple_instruction_count += 1;
                }

                // Sync state from Frame to MinimalEvm BEFORE execution
                if (self.minimal_evm) |*evm| {
                    // Sync stack state
                    if (@hasField(@TypeOf(frame.*), "stack")) {
                        evm.stack.clearRetainingCapacity();
                        const stack_slice = frame.stack.get_slice();
                        for (stack_slice) |value| {
                            evm.stack.append(evm.allocator, value) catch break;
                        }
                    }

                    // Sync gas
                    if (@hasField(@TypeOf(frame.*), "gas_remaining")) {
                        evm.gas_remaining = @intCast(frame.gas_remaining);
                    }

                    // Sync memory size
                    if (@hasField(@TypeOf(frame.*), "memory")) {
                        evm.memory_size = @as(u32, @intCast(frame.memory.size()));
                    }

                    // Now execute the opcode in MinimalEvm
                    if (opcode_value <= 0xff and evm.pc < evm.bytecode.len) {
                        const minimal_opcode = evm.bytecode[evm.pc];

                        // Execute the opcode in MinimalEvm
                        evm.executeOpcode(@intCast(minimal_opcode)) catch |exec_err| {
                            self.warn("MinimalEvm execution failed at PC={d}: {any}", .{ evm.pc, exec_err });
                        };
                    }
                }

                // TODO: Re-enable PC validation once we properly integrate with dispatch
                // The issue is that dispatch pre-processes PUSH instructions and changes the execution order
                // making our simple PC tracking incorrect. This needs deeper integration.
                //
                // // Validate that the current PC points to the expected opcode
                // if (self.bytecode.len > 0 and self.current_pc < self.bytecode.len) {
                //     const expected_opcode = self.bytecode[self.current_pc];
                //
                //     // Only validate for regular opcodes (not synthetic ones)
                //     if (opcode_value <= 0xff) {
                //         if (expected_opcode != opcode_value) {
                //             self.throwError(
                //                 "PC mismatch at {d}: expected opcode 0x{x:0>2} but executing {s} (0x{x:0>2})",
                //                 .{ self.current_pc, expected_opcode, opcode_name, opcode_value }
                //             );
                //         }
                //     }
                // }

                // Execute PC tracking if available and we have valid bytecode
                // Skip PC tracking if frame.code is empty (unit tests with direct opcode execution)
                if (self.pc_tracker) |*tracker| {
                    // Only track when we have real bytecode and regular opcodes
                    if (opcode_value <= 0xff and tracker.bytecode.len > 0) {
                        tracker.execute(frame, @as(u8, @intCast(opcode_value)));

                        // If tracker detected an error, log it
                        if (!tracker.isValid()) {
                            std.log.err("[EVM2] PC tracking validation failed at opcode {s}", .{opcode_name});
                        }
                    }
                }

                // For operations that need stack values, we'll log them
                const stack_size = frame.stack.size();

                // Basic logging for now - can be expanded to match log.zig's detailed implementation
                std.log.debug("[EVM2] EXEC[{d}]: {s} | PC={d} stack={d} gas={d}", .{
                    self.instruction_count,
                    opcode_name,
                    self.current_pc,
                    stack_size,
                    frame.gas_remaining,
                });
            }
        }
    }

    pub fn after_instruction(self: *DefaultTracer, frame: anytype, comptime opcode: @import("../opcodes/opcode.zig").UnifiedOpcode) void {
        const builtin = @import("builtin");
        if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
            if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
                const opcode_name = comptime @tagName(opcode);

                // NOW validate MinimalEvm state AFTER both have executed
                self.validateMinimalEvmState(frame, opcode);

                // Calculate what the next PC should be based on the opcode
                const next_pc = self.calculateNextPc(frame, opcode);

                // Log the instruction completion with PC update
                std.log.debug("[EVM2] DONE[{d}]: {s} | PC: {d} -> {d}", .{
                    self.instruction_count,
                    opcode_name,
                    self.current_pc,
                    next_pc,
                });

                // Update the current PC for the next instruction
                self.current_pc = next_pc;

                // Update MinimalEvm PC for next instruction if not stopped
                if (self.minimal_evm) |*evm| {
                    if (!evm.stopped and !evm.reverted) {
                        evm.pc = next_pc;
                    }
                }
            }
        }
    }
};

// ============================================================================
// DEBUGGING TRACER
// ============================================================================

/// DebuggingTracer provides comprehensive debugging capabilities for the Go CLI debugger
/// Features:
/// - Step-by-step execution control
/// - Breakpoint support
/// - State capture at each instruction
/// - Memory/stack/gas tracking
/// - Error reporting
pub const DebuggingTracer = struct {
    const Self = @This();

    allocator: std.mem.Allocator,

    // Control state
    step_mode: bool = false, // true = step through each instruction
    paused: bool = false, // true = execution is paused
    breakpoints: std.AutoHashMap(u32, void), // Set of PC values to break on

    // Execution history
    steps: std.ArrayList(ExecutionStep),
    max_history: usize = 10000, // Limit history to prevent memory issues

    // State snapshots for debugging
    state_snapshots: std.ArrayList(StateSnapshot),

    // Statistics
    total_instructions: u64 = 0,
    total_gas_used: u64 = 0,

    pub const ExecutionStep = struct {
        step_number: u64,
        pc: u32,
        opcode: u8,
        opcode_name: []const u8,
        gas_before: i32,
        gas_after: i32,
        gas_cost: u32,
        stack_before: []u256, // Owned slice
        stack_after: []u256, // Owned slice
        memory_size_before: usize,
        memory_size_after: usize,
        depth: u32,
        error_occurred: bool,
        error_msg: ?[]const u8,
    };

    pub const StateSnapshot = struct {
        pc: u32,
        gas_remaining: u64,
        stack: []u256, // Owned slice
        memory_size: usize,
        depth: u32,
        timestamp: i64,
    };

    pub fn init(allocator: std.mem.Allocator) Self {
        return .{
            .allocator = allocator,
            .breakpoints = std.AutoHashMap(u32, void).init(allocator),
            .steps = std.ArrayList(ExecutionStep){},
            .state_snapshots = std.ArrayList(StateSnapshot){},
        };
    }

    pub fn deinit(self: *Self) void {
        // Free execution step memory
        for (self.steps.items) |*step| {
            self.allocator.free(step.stack_before);
            self.allocator.free(step.stack_after);
            if (step.error_msg) |msg| {
                self.allocator.free(msg);
            }
        }
        self.steps.deinit(self.allocator);

        // Free state snapshots
        for (self.state_snapshots.items) |*snapshot| {
            self.allocator.free(snapshot.stack);
        }
        self.state_snapshots.deinit(self.allocator);

        self.breakpoints.deinit();
    }

    /// Enable or disable step-by-step execution mode
    pub fn setStepMode(self: *Self, enabled: bool) void {
        self.step_mode = enabled;
    }

    /// Check if execution should pause (breakpoint or step mode)
    pub fn shouldPause(self: *Self, pc: u32) bool {
        return self.step_mode or self.breakpoints.get(pc) != null;
    }

    /// Pause execution
    pub fn pause(self: *Self) void {
        self.paused = true;
    }

    /// Resume execution
    pub fn resumeExecution(self: *Self) void {
        self.paused = false;
    }

    /// Add a breakpoint at the given PC
    pub fn addBreakpoint(self: *Self, pc: u32) !void {
        try self.breakpoints.put(pc, {});
    }

    /// Remove a breakpoint at the given PC
    pub fn removeBreakpoint(self: *Self, pc: u32) bool {
        return self.breakpoints.remove(pc);
    }

    /// Check if there's a breakpoint at the given PC
    pub fn hasBreakpoint(self: *Self, pc: u32) bool {
        return self.breakpoints.get(pc) != null;
    }

    /// Clear all breakpoints
    pub fn clearBreakpoints(self: *Self) void {
        self.breakpoints.clearRetainingCapacity();
    }

    /// Get the current execution step count
    pub fn getStepCount(self: *Self) u64 {
        return self.total_instructions;
    }

    /// Get the most recent execution steps
    pub fn getRecentSteps(self: *Self, count: usize) []const ExecutionStep {
        const start = if (self.steps.items.len > count) self.steps.items.len - count else 0;
        return self.steps.items[start..];
    }

    /// Get a specific execution step by index
    pub fn getStep(self: *Self, index: usize) ?*const ExecutionStep {
        if (index >= self.steps.items.len) return null;
        return &self.steps.items[index];
    }

    /// Create a snapshot of the current state
    pub fn captureState(self: *Self, pc: u32, comptime FrameType: type, frame: *const FrameType) !void {
        // Get current stack contents
        const stack_slice = @constCast(&frame.stack).get_slice();
        const stack_copy = try self.allocator.alloc(u256, stack_slice.len);
        @memcpy(stack_copy, stack_slice);

        const snapshot = StateSnapshot{
            .pc = pc,
            .gas_remaining = @max(frame.gas_remaining, 0),
            .stack = stack_copy,
            .memory_size = if (@hasField(FrameType, "memory")) @constCast(&frame.memory).size() else 0,
            .depth = if (@hasField(FrameType, "depth")) frame.depth else 0,
            .timestamp = std.time.milliTimestamp(),
        };

        try self.state_snapshots.append(self.allocator, snapshot);

        // Limit snapshots to prevent memory growth
        if (self.state_snapshots.items.len > self.max_history) {
            const old = self.state_snapshots.orderedRemove(0);
            self.allocator.free(old.stack);
        }
    }

    /// Required tracer interface: called before each operation
    pub fn beforeOp(self: *Self, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        // Update instruction counter to verify tracer is working
        self.total_instructions += 1;

        // Check if we should pause execution
        if (self.shouldPause(pc)) {
            self.paused = true;
        }

        // While paused, we would need to implement a mechanism to wait
        // In the C API, this could be handled by returning a "paused" status
        // and requiring explicit resume calls

        // Capture state before operation for step recording
        self.captureStateForStep(pc, opcode, FrameType, frame, true) catch |e| {
            log.debug("Failed to capture before state: {}", .{e});
        };
    }

    /// Required tracer interface: called after each operation
    pub fn afterOp(self: *Self, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        // Update statistics
        self.total_instructions += 1;

        // Capture state after operation to complete the step record
        self.captureStateForStep(pc, opcode, FrameType, frame, false) catch |e| {
            log.debug("Failed to capture after state: {}", .{e});
        };

        // Create state snapshot if configured
        self.captureState(pc, FrameType, frame) catch |e| {
            log.debug("Failed to capture state snapshot: {}", .{e});
        };
    }

    /// Required tracer interface: called when an error occurs
    pub fn onError(self: *Self, pc: u32, opcode: u8, error_val: anyerror, comptime FrameType: type, frame: *const FrameType) void {
        _ = frame;
        _ = pc;
        _ = opcode;
        // Record error in current step if we have one
        if (self.steps.items.len > 0) {
            const current_step = &self.steps.items[self.steps.items.len - 1];
            current_step.error_occurred = true;

            // Store error message
            const error_name = @errorName(error_val);
            current_step.error_msg = self.allocator.dupe(u8, error_name) catch null;
        }

        // Always pause on error for debugging
        self.paused = true;

        log.debug("DebuggingTracer: Error occurred in frame type {s}: {}", .{ @typeName(FrameType), error_val });
    }

    // Logging functions
    pub fn debug(self: *Self, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.debug(format, args);
    }

    pub fn err(self: *Self, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.err(format, args);
    }

    pub fn warn(self: *Self, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.warn(format, args);
    }

    pub fn info(self: *Self, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.info(format, args);
    }

    pub fn before_instruction(self: *Self, frame: anytype, comptime opcode: @import("../opcodes/opcode.zig").UnifiedOpcode) void {
        _ = self;
        log.before_instruction(frame, opcode);
    }

    /// Helper function to capture state for step recording
    fn captureStateForStep(self: *Self, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType, is_before: bool) !void {
        const gas = @max(frame.gas_remaining, 0);

        // Create stack copy
        const stack_slice = @constCast(&frame.stack).get_slice();
        const stack_copy = try self.allocator.alloc(u256, stack_slice.len);
        @memcpy(stack_copy, stack_slice);

        if (is_before) {
            // Start a new execution step
            const step = ExecutionStep{
                .step_number = self.total_instructions,
                .pc = pc,
                .opcode = opcode,
                .opcode_name = getOpcodeName(opcode),
                .gas_before = @as(i32, @intCast(@min(gas, std.math.maxInt(i32)))),
                .gas_after = @as(i32, @intCast(@min(gas, std.math.maxInt(i32)))), // Will be updated in afterOp
                .gas_cost = 0, // Will be calculated in afterOp
                .stack_before = stack_copy,
                .stack_after = &[_]u256{}, // Will be updated in afterOp
                .memory_size_before = if (@hasField(FrameType, "memory")) @constCast(&frame.memory).size() else 0,
                .memory_size_after = 0, // Will be updated in afterOp
                .depth = if (@hasField(FrameType, "depth")) frame.depth else 0,
                .error_occurred = false,
                .error_msg = null,
            };

            try self.steps.append(self.allocator, step);

            // Limit history size
            if (self.steps.items.len > self.max_history) {
                const old = self.steps.orderedRemove(0);
                self.allocator.free(old.stack_before);
                self.allocator.free(old.stack_after);
                if (old.error_msg) |msg| {
                    self.allocator.free(msg);
                }
            }
        } else {
            // Update the current step with after state
            if (self.steps.items.len > 0) {
                const current_step = &self.steps.items[self.steps.items.len - 1];
                current_step.gas_after = @as(i32, @intCast(@min(gas, std.math.maxInt(i32))));
                current_step.gas_cost = @intCast(@max(0, current_step.gas_before - @as(i32, @intCast(@min(gas, std.math.maxInt(i32))))));
                current_step.stack_after = stack_copy;
                current_step.memory_size_after = if (@hasField(FrameType, "memory")) @constCast(&frame.memory).size() else 0;
            } else {
                // No current step, free the stack copy
                self.allocator.free(stack_copy);
            }
        }
    }

    /// Reset all debugging state
    pub fn reset(self: *Self) void {
        // Clear execution history
        for (self.steps.items) |*step| {
            self.allocator.free(step.stack_before);
            self.allocator.free(step.stack_after);
            if (step.error_msg) |msg| {
                self.allocator.free(msg);
            }
        }
        self.steps.clearRetainingCapacity();

        // Clear state snapshots
        for (self.state_snapshots.items) |*snapshot| {
            self.allocator.free(snapshot.stack);
        }
        self.state_snapshots.clearRetainingCapacity();

        // Reset statistics
        self.total_instructions = 0;
        self.total_gas_used = 0;

        // Keep breakpoints but reset execution state
        self.paused = false;
    }

    /// Get debugging statistics
    pub fn getStats(self: *Self) struct {
        total_instructions: u64,
        total_gas_used: u64,
        breakpoint_count: usize,
        history_size: usize,
        snapshot_count: usize,
    } {
        return .{
            .total_instructions = self.total_instructions,
            .total_gas_used = self.total_gas_used,
            .breakpoint_count = self.breakpoints.count(),
            .history_size = self.steps.items.len,
            .snapshot_count = self.state_snapshots.items.len,
        };
    }
};

// ============================================================================
// JSON-RPC TRACING
// ============================================================================

/// JSON-RPC compatible tracer that produces geth-style debug_traceTransaction output
/// Collects execution traces and produces them in a format compatible with Ethereum JSON-RPC
pub const JSONRPCTracer = struct {
    const Self = @This();

    allocator: std.mem.Allocator,
    trace_steps: std.ArrayList(JSONRPCStep),
    current_depth: u32 = 0,
    gas_used: u64 = 0,
    current_pc: u32 = 0,
    jump_table: ?*const anyopaque = null, // Pointer to jump table for PC lookups
    last_opcode: u8 = 0, // Track last opcode to detect jumps

    pub const JSONRPCStep = struct {
        op: []const u8,
        opcode: u8, // Add the actual opcode byte
        pc: u64,
        gas: u64,
        gasCost: u64,
        depth: u32,
        stack: []const u256,
        memory: ?[]const u8 = null,
        memSize: u32 = 0,
        storage: ?std.hash_map.HashMap(u256, u256, std.hash_map.AutoContext(u256), 80) = null,
        returnData: ?[]const u8 = null,

        pub fn deinit(self: *JSONRPCStep, allocator: std.mem.Allocator) void {
            allocator.free(self.op);
            allocator.free(self.stack);
            if (self.memory) |mem| {
                allocator.free(mem);
            }
            if (self.storage) |*storage| {
                storage.deinit();
            }
            if (self.returnData) |ret_data| {
                allocator.free(ret_data);
            }
        }
    };

    pub fn init(allocator: std.mem.Allocator) Self {
        return .{
            .allocator = allocator,
            .trace_steps = std.ArrayList(JSONRPCStep){},
        };
    }

    pub fn deinit(self: *Self) void {
        for (self.trace_steps.items) |*step| {
            step.deinit(self.allocator);
        }
        self.trace_steps.deinit(self.allocator);
    }

    /// Called before frame execution begins
    pub fn beforeExecute(self: *Self, comptime FrameType: type, frame: *const FrameType) void {
        _ = self;
        _ = frame;
        // Initialize any execution-level state
    }

    /// Called after frame execution completes
    pub fn afterExecute(self: *Self, comptime FrameType: type, frame: *const FrameType) void {
        _ = self;
        _ = frame;
        // Finalize any execution-level state
    }

    /// Called before each opcode operation
    pub fn beforeOp(self: *Self, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        // Update our PC tracking based on the last opcode
        if (self.trace_steps.items.len > 0) {
            // Check if we just did a JUMP/JUMPI and need to update PC from jump table
            if (self.last_opcode == 0x56 or self.last_opcode == 0x57) { // JUMP or JUMPI
                // For jumps, the PC passed in should be the jump destination
                self.current_pc = pc;
            } else if (self.last_opcode >= 0x60 and self.last_opcode <= 0x7f) {
                // PUSH instruction - skip the push data bytes
                const push_size = self.last_opcode - 0x5f;
                self.current_pc += push_size + 1;
            } else {
                // Regular instruction - increment by 1
                self.current_pc += 1;
            }
        } else {
            // First instruction, use PC 0
            self.current_pc = 0;
        }

        // Capture pre-execution state for the step
        const gas_before: u64 = @max(frame.gas_remaining, 0);

        // Create stack copy
        const stack_size = @constCast(&frame.stack).size();
        const stack_copy = self.allocator.alloc(u256, stack_size) catch return; // Return on allocation failure
        const stack_slice = @constCast(&frame.stack).get_slice();
        @memcpy(stack_copy, stack_slice);

        const op_name = getOpcodeName(opcode);
        const op_name_copy = self.allocator.dupe(u8, op_name) catch {
            self.allocator.free(stack_copy);
            return;
        };

        // Get depth if available
        const depth_val: u32 = if (comptime @hasField(FrameType, "depth")) @intCast(frame.depth) else self.current_depth;

        // Create the step (gas cost will be calculated in afterOp)
        const step = JSONRPCStep{
            .op = op_name_copy,
            .opcode = opcode, // Store the actual opcode byte
            .pc = @intCast(self.current_pc),
            .gas = gas_before,
            .gasCost = 0, // Will be updated in afterOp
            .depth = depth_val,
            .stack = stack_copy,
            .memSize = if (comptime @hasField(FrameType, "memory")) @intCast(@constCast(&frame.memory).size()) else 0,
        };

        self.trace_steps.append(self.allocator, step) catch return; // Return on allocation failure

        // Update last opcode for next iteration
        self.last_opcode = opcode;
    }

    /// Called after each opcode operation
    pub fn afterOp(self: *Self, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        _ = pc;
        _ = opcode;

        // Update the last step with post-execution state
        if (self.trace_steps.items.len == 0) return;

        const current_step = &self.trace_steps.items[self.trace_steps.items.len - 1];
        const gas_after: u64 = @max(frame.gas_remaining, 0);

        // Calculate gas cost
        current_step.gasCost = if (current_step.gas >= gas_after)
            current_step.gas - gas_after
        else
            0;

        // Update memory size if available
        if (comptime @hasField(FrameType, "memory")) {
            current_step.memSize = @intCast(@constCast(&frame.memory).size());
        }
    }

    /// Called when an error occurs during execution
    pub fn onError(self: *Self, pc: u32, opcode: u8, error_val: anyerror, comptime FrameType: type, frame: *const FrameType) void {
        _ = self;
        _ = pc;
        _ = opcode;
        _ = error_val;
        _ = frame;
        // Could add error information to the current step if needed
    }

    // Logging functions
    pub fn debug(self: *Self, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.debug(format, args);
    }

    pub fn err(self: *Self, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.err(format, args);
    }

    pub fn warn(self: *Self, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.warn(format, args);
    }

    pub fn info(self: *Self, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.info(format, args);
    }

    pub fn before_instruction(self: *Self, frame: anytype, comptime opcode: @import("../opcodes/opcode.zig").UnifiedOpcode) void {
        _ = self;
        log.before_instruction(frame, opcode);
    }

    /// Get the collected trace steps
    pub fn getTraceSteps(self: *const Self) []const JSONRPCStep {
        return self.trace_steps.items;
    }

    /// Export trace in JSON format compatible with geth debug_traceTransaction
    pub fn toJSON(self: *const Self, writer: anytype) !void {
        try writer.writeAll("{\"structLogs\":[");

        for (self.trace_steps.items, 0..) |step, i| {
            if (i > 0) try writer.writeAll(",");

            try writer.writeAll("{");
            try writer.print("\"pc\":{},", .{step.pc});
            try writer.print("\"op\":\"{s}\",", .{step.op});
            try writer.print("\"gas\":{},", .{step.gas});
            try writer.print("\"gasCost\":{},", .{step.gasCost});
            try writer.print("\"depth\":{},", .{step.depth});

            // Write stack
            try writer.writeAll("\"stack\":[");
            for (step.stack, 0..) |val, j| {
                if (j > 0) try writer.writeAll(",");
                try writer.print("\"0x{x}\"", .{val});
            }
            try writer.writeAll("],");

            try writer.print("\"memSize\":{}", .{step.memSize});

            // Write memory if present
            if (step.memory) |mem| {
                try writer.writeAll(",\"memory\":[");
                for (mem, 0..) |b, k| {
                    if (k > 0) try writer.writeAll(",");
                    try writer.print("\"0x{x:0>2}\"", .{b});
                }
                try writer.writeAll("]");
            }

            // Write storage if present
            if (step.storage) |storage| {
                try writer.writeAll(",\"storage\":{");
                var first = true;
                var iter = storage.iterator();
                while (iter.next()) |entry| {
                    if (!first) try writer.writeAll(",");
                    first = false;
                    try writer.print("\"0x{x}\":\"0x{x}\"", .{ entry.key_ptr.*, entry.value_ptr.* });
                }
                try writer.writeByte('}');
            }

            // Write return data if present
            if (step.returnData) |ret_data| {
                try writer.writeAll(",\"returnData\":\"0x");
                for (ret_data) |byte| {
                    try writer.print("{x:0>2}", .{byte});
                }
                try writer.writeByte('"');
            }

            try writer.writeAll("}");
        }

        try writer.writeAll("]}");
    }
};

// ============================================================================
// WRITER-BASED TRACERS
// ============================================================================

// Configuration for tracing behavior
pub const MemoryCaptureMode = enum { none, prefix, full };

pub const TracerConfig = struct {
    capture_memory: MemoryCaptureMode = .none,
    memory_prefix: usize = 0, // bytes to capture when mode is .prefix
    compute_gas_cost: bool = false, // compute per-step gas deltas
    capture_each_op: bool = false, // capture snapshot after each operation
    trace_preanalysis: bool = true, // trace bytecode analysis and schedule building (enabled by default)
};

pub const DetailedStructLog = struct {
    pc: u64,
    op: []const u8,
    gas: u64,
    gasCost: u64,
    depth: u32,
    stack: []const u256,
    memory: ?[]const u8,
    memSize: u32,
    storage: ?std.hash_map.HashMap(u256, u256, std.hash_map.AutoContext(u256), 80),
    returnData: ?[]const u8,
    refund: u64,
    @"error": ?[]const u8,

    pub fn deinit(self: *DetailedStructLog, allocator: std.mem.Allocator) void {
        allocator.free(self.stack);
        if (self.memory) |mem| {
            allocator.free(mem);
        }
        if (self.storage) |*storage| {
            storage.deinit();
        }
        if (self.returnData) |ret_data| {
            allocator.free(ret_data);
        }
    }
};

// Generic tracer that can work with any writer (enhanced version)
pub fn GenericTracer(comptime Writer: type) type {
    return struct {
        allocator: std.mem.Allocator,
        writer: Writer,
        cfg: TracerConfig = .{},
        prev_gas: ?u64 = null,

        const Self = @This();

        pub fn init(allocator: std.mem.Allocator, writer: Writer) Self {
            return .{
                .allocator = allocator,
                .writer = writer,
                .cfg = .{},
            };
        }

        pub fn initWithConfig(allocator: std.mem.Allocator, writer: Writer, cfg: TracerConfig) Self {
            return .{
                .allocator = allocator,
                .writer = writer,
                .cfg = cfg,
            };
        }

        pub fn snapshot(self: *Self, pc: u32, opcode: u8, comptime FrameType: type, frame_instance: *const FrameType) !DetailedStructLog {
            // Capture stack
            const stack_size = frame_instance.stack.size();
            const stack_copy = try self.allocator.alloc(u256, stack_size);
            const stack_slice = frame_instance.stack.get_slice();
            @memcpy(stack_copy, stack_slice);

            const op_name = getOpcodeName(opcode);

            // Gas calculation
            const gas_now: u64 = @max(frame_instance.gas_remaining, 0);
            var gas_cost: u64 = 0;
            if (self.cfg.compute_gas_cost) {
                if (self.prev_gas) |prev| {
                    gas_cost = if (prev > gas_now) (prev - gas_now) else 0;
                }
                self.prev_gas = gas_now;
            }

            // Depth (if frame provides it)
            const depth_val: u32 = blk: {
                if (comptime @hasField(FrameType, "depth")) {
                    break :blk @intCast(frame_instance.depth);
                } else if (comptime @hasField(FrameType, "call_depth")) {
                    break :blk @intCast(frame_instance.call_depth);
                }
                break :blk 1;
            };

            // Refund (if frame provides it)
            const refund_val: u64 = blk: {
                if (comptime @hasField(FrameType, "gas_refund")) {
                    break :blk @intCast(frame_instance.gas_refund);
                }
                break :blk 0;
            };

            // Memory capture
            var mem_size: u32 = 0;
            const mem_copy = try self.captureMemory(FrameType, frame_instance, &mem_size);

            // Storage capture
            const storage_map = try self.captureStorage(FrameType, frame_instance);

            // Return data capture
            const return_data = try self.captureReturnData(FrameType, frame_instance);

            // Error capture
            const err_str = getFrameError(FrameType, frame_instance);

            return DetailedStructLog{
                .pc = @as(u64, pc),
                .op = op_name,
                .gas = gas_now,
                .gasCost = gas_cost,
                .depth = depth_val,
                .stack = stack_copy,
                .memory = mem_copy,
                .memSize = mem_size,
                .storage = storage_map,
                .returnData = return_data,
                .refund = refund_val,
                .@"error" = err_str,
            };
        }

        pub fn writeSnapshot(self: *Self, pc: u32, opcode: u8, comptime FrameType: type, frame_instance: *const FrameType) !void {
            const snapshot_entry = try self.snapshot(pc, opcode, FrameType, frame_instance);
            defer snapshot_entry.deinit(self.allocator);

            try self.writeJson(&snapshot_entry);
        }

        pub fn beforeOp(self: *Self, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
            _ = self;
            _ = pc;
            _ = opcode;
            _ = frame;
            // Generic tracer doesn't do anything on beforeOp by default
        }

        pub fn afterOp(self: *Self, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
            // Optionally capture snapshot after each operation
            if (self.cfg.capture_each_op) {
                self.writeSnapshot(pc, opcode, FrameType, frame) catch |e| {
                    log.debug("Failed to write snapshot: {}", .{e});
                };
            }
        }

        pub fn onError(self: *Self, pc: u32, opcode: u8, error_val: anyerror, comptime FrameType: type, frame: *const FrameType) void {
            _ = self;
            _ = pc;
            _ = opcode;
            _ = error_val;
            _ = frame;
            // Generic tracer doesn't do anything on error by default
        }

        pub fn writeJson(self: *Self, log_entry: *const DetailedStructLog) !void {
            try self.writer.print(
                "{{\"pc\":{},\"op\":\"{s}\",\"gas\":{},\"gasCost\":{},\"depth\":{},\"stack\":[",
                .{ log_entry.pc, log_entry.op, log_entry.gas, log_entry.gasCost, log_entry.depth },
            );

            // Write stack array
            for (log_entry.stack, 0..) |val, i| {
                if (i > 0) try self.writer.writeAll(",");
                try self.writer.print("\"0x{x}\"", .{val});
            }

            try self.writer.print("],\"memSize\":{},\"refund\":{}", .{ log_entry.memSize, log_entry.refund });

            // Write memory if captured
            if (log_entry.memory) |mem| {
                try self.writer.writeAll(",\"memory\":\"0x");
                for (mem) |byte| {
                    try self.writer.print("{x:0>2}", .{byte});
                }
                try self.writer.writeByte('"');
            }

            // Write storage if captured
            if (log_entry.storage) |storage| {
                try self.writer.writeAll(",\"storage\":{");
                var first = true;
                var iter = storage.iterator();
                while (iter.next()) |entry| {
                    if (!first) try self.writer.writeAll(",");
                    first = false;
                    try self.writer.print("\"0x{x}\":\"0x{x}\"", .{ entry.key_ptr.*, entry.value_ptr.* });
                }
                try self.writer.writeByte('}');
            }

            // Write return data if captured
            if (log_entry.returnData) |ret_data| {
                try self.writer.writeAll(",\"returnData\":\"0x");
                for (ret_data) |byte| {
                    try self.writer.print("{x:0>2}", .{byte});
                }
                try self.writer.writeByte('"');
            }

            // Write error if present
            if (log_entry.@"error") |err| {
                try self.writer.print(",\"error\":\"{s}\"", .{err});
            }

            try self.writer.writeAll("}}\n");
        }

        fn captureMemory(
            self: *Self,
            comptime FrameType: type,
            frame_instance: *const FrameType,
            mem_size: *u32,
        ) !?[]const u8 {
            if (self.cfg.capture_memory == .none) {
                mem_size.* = 0;
                return null;
            }

            if (comptime @hasField(FrameType, "memory")) {
                const memory_ref = @constCast(&frame_instance.memory);
                const mem_len = memory_ref.size();
                mem_size.* = @intCast(mem_len);

                const to_copy = switch (self.cfg.capture_memory) {
                    .full => mem_len,
                    .prefix => @min(mem_len, self.cfg.memory_prefix),
                    .none => 0,
                };

                if (to_copy == 0) return null;

                // Get memory data as slice and copy it
                const memory_data = memory_ref.get_slice_evm(0, to_copy) catch return null;
                return try self.allocator.dupe(u8, memory_data);
            }

            mem_size.* = 0;
            return null;
        }

        fn captureStorage(
            self: *Self,
            comptime FrameType: type,
            frame_instance: *const FrameType,
        ) !?std.hash_map.HashMap(u256, u256, std.hash_map.AutoContext(u256), 80) {
            _ = self;
            _ = frame_instance;

            // For now, storage tracking would need to be implemented at the EVM level
            // This is a placeholder for storage state changes during execution
            // In practice, this would track SLOAD/SSTORE operations and their state changes

            // TODO: Implement storage state tracking by:
            // 1. Adding storage change tracking to the frame or EVM
            // 2. Collecting changed storage slots during execution
            // 3. Returning the map of slot -> value pairs

            // Example implementation when storage tracking is available:
            // if (comptime @hasField(FrameType, "storage_changes")) {
            //     var storage_map = std.hash_map.HashMap(u256, u256, std.hash_map.AutoContext(u256), 80).init(self.allocator);
            //     for (frame_instance.storage_changes.items) |change| {
            //         try storage_map.put(change.slot, change.value);
            //     }
            //     return storage_map;
            // }

            return null;
        }

        fn captureReturnData(
            self: *Self,
            comptime FrameType: type,
            frame_instance: *const FrameType,
        ) !?[]const u8 {
            // Check if the frame has return data field
            if (comptime @hasField(FrameType, "return_data")) {
                const return_data = frame_instance.return_data;
                if (return_data.len > 0) {
                    return try self.allocator.dupe(u8, return_data);
                }
            }

            // Check if frame has access to EVM context with return data
            if (comptime @hasField(FrameType, "host")) {
                // Try to get return data from host/EVM context
                const host_ptr: *anyopaque = @constCast(frame_instance.host);

                // This would need to be implemented based on the actual host interface
                // For now, we return null as the interface varies
                _ = host_ptr;
            }

            return null;
        }
    };
}

// Convenient type alias for the old Tracer name
pub fn Tracer(comptime Writer: type) type {
    return GenericTracer(Writer);
}

// File tracer that writes to a file using the generic writer interface
pub const FileTracer = struct {
    base: GenericTracer(std.fs.File.Writer),
    file: std.fs.File,

    pub fn init(allocator: std.mem.Allocator, path: []const u8) !FileTracer {
        const file = try std.fs.cwd().createFile(path, .{});
        return .{
            .base = GenericTracer(std.fs.File.Writer).init(allocator, file.writer()),
            .file = file,
        };
    }

    pub fn initWithConfig(allocator: std.mem.Allocator, path: []const u8, cfg: TracerConfig) !FileTracer {
        const file = try std.fs.cwd().createFile(path, .{});
        return .{
            .base = GenericTracer(std.fs.File.Writer).initWithConfig(allocator, file.writer(), cfg),
            .file = file,
        };
    }

    pub fn deinit(self: *FileTracer) void {
        self.file.close();
    }

    pub fn snapshot(self: *FileTracer, pc: u32, opcode: u8, comptime FrameType: type, frame_instance: *const FrameType) !DetailedStructLog {
        return self.base.snapshot(pc, opcode, FrameType, frame_instance);
    }

    pub fn writeSnapshot(self: *FileTracer, pc: u32, opcode: u8, comptime FrameType: type, frame_instance: *const FrameType) !void {
        return self.base.writeSnapshot(pc, opcode, FrameType, frame_instance);
    }

    pub fn beforeOp(self: *FileTracer, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        self.base.beforeOp(pc, opcode, FrameType, frame);
    }

    pub fn afterOp(self: *FileTracer, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        self.base.afterOp(pc, opcode, FrameType, frame);
    }

    pub fn onError(self: *FileTracer, pc: u32, opcode: u8, error_val: anyerror, comptime FrameType: type, frame: *const FrameType) void {
        self.base.onError(pc, opcode, error_val, FrameType, frame);
    }

    // Logging functions
    pub fn debug(self: *FileTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.debug(format, args);
    }

    pub fn err(self: *FileTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.err(format, args);
    }

    pub fn warn(self: *FileTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.warn(format, args);
    }

    pub fn info(self: *FileTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.info(format, args);
    }

    pub fn before_instruction(self: *FileTracer, frame: anytype, comptime opcode: @import("../opcodes/opcode.zig").UnifiedOpcode) void {
        _ = self;
        log.before_instruction(frame, opcode);
    }

    /// Write JSON trace to file with enhanced features
    pub fn writeJSONTrace(self: *FileTracer, pc: u32, opcode: u8, comptime FrameType: type, frame_instance: *const FrameType) !void {
        const log_entry = try self.base.snapshot(pc, opcode, FrameType, frame_instance);
        defer log_entry.deinit(self.base.allocator);
        try self.base.writeJson(&log_entry);
    }
};

// Logging tracer that writes to stdout
pub const LoggingTracer = struct {
    base: GenericTracer(std.fs.File.Writer),

    pub fn init(allocator: std.mem.Allocator) LoggingTracer {
        const stdout = std.io.getStdOut().writer();
        return .{
            .base = GenericTracer(std.fs.File.Writer).init(allocator, stdout),
        };
    }

    pub fn initWithConfig(allocator: std.mem.Allocator, cfg: TracerConfig) LoggingTracer {
        const stdout = std.io.getStdOut().writer();
        return .{
            .base = GenericTracer(std.fs.File.Writer).initWithConfig(allocator, stdout, cfg),
        };
    }

    pub fn snapshot(self: *LoggingTracer, pc: u32, opcode: u8, comptime FrameType: type, frame_instance: *const FrameType) !DetailedStructLog {
        return self.base.snapshot(pc, opcode, FrameType, frame_instance);
    }

    pub fn writeSnapshot(self: *LoggingTracer, pc: u32, opcode: u8, comptime FrameType: type, frame_instance: *const FrameType) !void {
        return self.base.writeSnapshot(pc, opcode, FrameType, frame_instance);
    }

    pub fn beforeOp(self: *LoggingTracer, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        self.base.beforeOp(pc, opcode, FrameType, frame);
    }

    pub fn afterOp(self: *LoggingTracer, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        self.base.afterOp(pc, opcode, FrameType, frame);
    }

    pub fn onError(self: *LoggingTracer, pc: u32, opcode: u8, error_val: anyerror, comptime FrameType: type, frame: *const FrameType) void {
        self.base.onError(pc, opcode, error_val, FrameType, frame);
    }

    // Logging functions
    pub fn debug(self: *LoggingTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.debug(format, args);
    }

    pub fn err(self: *LoggingTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.err(format, args);
    }

    pub fn warn(self: *LoggingTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.warn(format, args);
    }

    pub fn info(self: *LoggingTracer, comptime format: []const u8, args: anytype) void {
        _ = self;
        log.info(format, args);
    }

    pub fn before_instruction(self: *LoggingTracer, frame: anytype, comptime opcode: @import("../opcodes/opcode.zig").UnifiedOpcode) void {
        _ = self;
        log.before_instruction(frame, opcode);
    }
};

fn getFrameError(comptime FrameType: type, frame_instance: *const FrameType) ?[]const u8 {
    _ = frame_instance;

    // TODO: When frame has error fields, access them like:
    // if (comptime @hasField(FrameType, "last_error_str")) {
    //     return frame_instance.last_error_str;
    // }

    return null;
}

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
        // Context and environmental opcodes
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
        0x44 => "DIFFICULTY",
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
        0x5f => "PUSH0",
        0x60 => "PUSH1",
        0x61 => "PUSH2",
        0x62 => "PUSH3",
        0x63 => "PUSH4",
        0x64 => "PUSH5",
        0x65 => "PUSH6",
        0x66 => "PUSH7",
        0x67 => "PUSH8",
        0x68 => "PUSH9",
        0x69 => "PUSH10",
        0x6a => "PUSH11",
        0x6b => "PUSH12",
        0x6c => "PUSH13",
        0x6d => "PUSH14",
        0x6e => "PUSH15",
        0x6f => "PUSH16",
        0x70 => "PUSH17",
        0x71 => "PUSH18",
        0x72 => "PUSH19",
        0x73 => "PUSH20",
        0x74 => "PUSH21",
        0x75 => "PUSH22",
        0x76 => "PUSH23",
        0x77 => "PUSH24",
        0x78 => "PUSH25",
        0x79 => "PUSH26",
        0x7a => "PUSH27",
        0x7b => "PUSH28",
        0x7c => "PUSH29",
        0x7d => "PUSH30",
        0x7e => "PUSH31",
        0x7f => "PUSH32",
        0x80 => "DUP1",
        0x81 => "DUP2",
        0x82 => "DUP3",
        0x83 => "DUP4",
        0x84 => "DUP5",
        0x85 => "DUP6",
        0x86 => "DUP7",
        0x87 => "DUP8",
        0x88 => "DUP9",
        0x89 => "DUP10",
        0x8a => "DUP11",
        0x8b => "DUP12",
        0x8c => "DUP13",
        0x8d => "DUP14",
        0x8e => "DUP15",
        0x8f => "DUP16",
        0x90 => "SWAP1",
        0x91 => "SWAP2",
        0x92 => "SWAP3",
        0x93 => "SWAP4",
        0x94 => "SWAP5",
        0x95 => "SWAP6",
        0x96 => "SWAP7",
        0x97 => "SWAP8",
        0x98 => "SWAP9",
        0x99 => "SWAP10",
        0x9a => "SWAP11",
        0x9b => "SWAP12",
        0x9c => "SWAP13",
        0x9d => "SWAP14",
        0x9e => "SWAP15",
        0x9f => "SWAP16",
        // System opcodes
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

// Tests
// TODO: Update this test to work without Host
// test "tracer captures basic frame state with writer" {
//     const allocator = std.testing.allocator;
//
//     // Create a frame with some state
//     const Frame = frame_mod.Frame(.{
//         .stack_size = 10,
//         .block_gas_limit = 1000,
//     });
//
//     // var test_frame = try Frame.init(allocator, &[_]u8{ 0x60, 0x05, 0x60, 0x03, 0x01 }, 1000, {}, undefined // createTestHost());
//     defer test_frame.deinit(allocator);
//
//     // Push some values onto the stack
//     try test_frame.stack.push(3);
//     try test_frame.stack.push(5);
//     // PC is now managed by plan, not frame
//     const gas_to_consume1 = @as(u64, @intCast(test_frame.gas_remaining - 950));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume1))) {
//         return error.OutOfGas;
//     }
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume1));
//
//     // Create tracer with array list writer
//     var output = std.ArrayList(u8).init(allocator);
//     defer output.deinit();
//
//     var tracer = Tracer(std.ArrayList(u8).Writer).init(allocator, output.writer());
//     const log = try tracer.snapshot(4, 0x01, Frame, &test_frame); // PC=4, opcode=ADD
//     defer allocator.free(log.stack);
//
//     // Verify snapshot
//     try std.testing.expectEqual(@as(u64, 4), log.pc);
//     try std.testing.expectEqualStrings("ADD", log.op);
//     try std.testing.expectEqual(@as(u64, 950), log.gas);
//     try std.testing.expectEqual(@as(u32, 1), log.depth);
//     try std.testing.expectEqual(@as(usize, 2), log.stack.len);
//     try std.testing.expectEqual(@as(u256, 3), log.stack[0]);
//     try std.testing.expectEqual(@as(u256, 5), log.stack[1]);
// }

// TODO: Update this test to work without Host
// test "tracer writes JSON to writer" {
//     const allocator = std.testing.allocator;
//
//     const Frame = frame_mod.Frame(.{});
//     // var test_frame = try Frame.init(allocator, &[_]u8{ 0x60, 0x05, 0x60, 0x03, 0x01 }, 1000, {}, undefined // createTestHost());
//     defer test_frame.deinit(allocator);
//
//     try test_frame.stack.push(3);
//     try test_frame.stack.push(5);
//     // PC is now managed by plan, not frame
//     const gas_to_consume2 = @as(u64, @intCast(test_frame.gas_remaining - 950));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume2))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume2));
//
//     // Create tracer with array list writer
//     var output = std.ArrayList(u8).init(allocator);
//     defer output.deinit();
//
//     var tracer = Tracer(std.ArrayList(u8).Writer).init(allocator, output.writer());
//     try tracer.writeSnapshot(4, 0x01, Frame, &test_frame); // PC=4, opcode=ADD
//
//     const json = output.items;
//     try std.testing.expect(std.mem.indexOf(u8, json, "\"pc\":4") != null);
//     try std.testing.expect(std.mem.indexOf(u8, json, "\"op\":\"ADD\"") != null);
//     try std.testing.expect(std.mem.indexOf(u8, json, "\"gas\":950") != null);
//     try std.testing.expect(std.mem.indexOf(u8, json, "\"stack\":[\"0x3\",\"0x5\"]") != null);
// }

// TODO: Update this test to work without Host
// test "logging tracer writes to stdout" {
//     const allocator = std.testing.allocator;
//
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{0x00}, 1000, {}, undefined // createTestHost());
//     defer test_frame.deinit(allocator);
//
//     var tracer = LoggingTracer.init(allocator);
//     const log = try tracer.snapshot(0, 0x00, Frame, &test_frame); // PC=0, opcode=STOP
//     defer allocator.free(log.stack);
//
//     try std.testing.expectEqual(@as(u64, 0), log.pc);
//     try std.testing.expectEqualStrings("STOP", log.op);
// }

// TODO: Update this test to work without Host
// test "file tracer writes to file" {
//     const allocator = std.testing.allocator;
//
//     // Create temp dir and file
//     var tmp_dir = std.testing.tmpDir(.{});
//     defer tmp_dir.cleanup();
//
//     // Create file in the temp directory
//     const file = try tmp_dir.dir.createFile("trace.json", .{});
//     file.close();
//
//     // Get the full path
//     const file_path = try tmp_dir.dir.realpathAlloc(allocator, "trace.json");
//     defer allocator.free(file_path);
//
//     // Create frame
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{ 0x60, 0x42 }, 1000, {}, undefined // createTestHost());
//     defer test_frame.deinit(allocator);
//
//     // PC is now managed by plan, not frame
//     const gas_to_consume3 = @as(u64, @intCast(test_frame.gas_remaining - 997));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume3))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume3));
//
//     // Create file tracer and write
//     var tracer = try FileTracer.init(allocator, file_path);
//     defer tracer.deinit();
//
//     try tracer.writeSnapshot(0, 0x60, Frame, &test_frame); // PC=0, opcode=PUSH1
//
//     // Read file and verify
//     const contents = try tmp_dir.dir.readFileAlloc(allocator, "trace.json", 1024);
//     defer allocator.free(contents);
//
//     try std.testing.expect(std.mem.indexOf(u8, contents, "\"pc\":0") != null);
//     try std.testing.expect(std.mem.indexOf(u8, contents, "\"op\":\"PUSH1\"") != null);
//     try std.testing.expect(std.mem.indexOf(u8, contents, "\"gas\":997") != null);
// }

// TODO: Update this test to work without Host
// test "tracer with gas cost computation" {
//     const allocator = std.testing.allocator;
//
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{ 0x60, 0x05, 0x01 }, 1000, {}, undefined // createTestHost());
//     defer test_frame.deinit(allocator);
//
//     var output = std.ArrayList(u8).init(allocator);
//     defer output.deinit();
//
//     var tracer = Tracer(std.ArrayList(u8).Writer).initWithConfig(
//         allocator,
//         output.writer(),
//         .{ .compute_gas_cost = true },
//     );
//
//     // First snapshot - no previous gas, so cost should be 0
//     const gas_to_consume4 = @as(u64, @intCast(test_frame.gas_remaining - 1000));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume4))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume4));
//     const log1 = try tracer.snapshot(0, 0x60, Frame, &test_frame); // PUSH1
//     defer allocator.free(log1.stack);
//     try std.testing.expectEqual(@as(u64, 0), log1.gasCost);
//
//     // Second snapshot - gas decreased by 3
//     const gas_to_consume5 = @as(u64, @intCast(test_frame.gas_remaining - 997));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume5))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume5));
//     const log2 = try tracer.snapshot(1, 0x60, Frame, &test_frame); // PUSH1
//     defer allocator.free(log2.stack);
//     try std.testing.expectEqual(@as(u64, 3), log2.gasCost);
//
//     // Third snapshot - gas decreased by 21
//     const gas_to_consume6 = @as(u64, @intCast(test_frame.gas_remaining - 976));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume6))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume6));
//     const log3 = try tracer.snapshot(2, 0x01, Frame, &test_frame); // ADD
//     defer allocator.free(log3.stack);
//     try std.testing.expectEqual(@as(u64, 21), log3.gasCost);
// }

// TODO: Update this test to work without Host
// test "tracer handles empty stack with JSON output" {
//     const allocator = std.testing.allocator;
//
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{0x00}, 1000, {}, undefined // createTestHost());
//     defer test_frame.deinit(allocator);
//
//     var output = std.ArrayList(u8).init(allocator);
//     defer output.deinit();
//
//     var tracer = Tracer(std.ArrayList(u8).Writer).init(allocator, output.writer());
//     try tracer.writeSnapshot(0, 0x00, Frame, &test_frame); // STOP
//
//     const json = output.items;
//     try std.testing.expect(std.mem.indexOf(u8, json, "\"stack\":[]") != null);
// }

// TODO: Update this test to work without Host
// test "tracer handles large stack values in JSON" {
//     const allocator = std.testing.allocator;
//
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{0x00}, 1000, {}, undefined // createTestHost());
//     defer test_frame.deinit(allocator);
//
//     try test_frame.stack.push(std.math.maxInt(u256));
//     try test_frame.stack.push(0xdeadbeef);
//
//     var output = std.ArrayList(u8).init(allocator);
//     defer output.deinit();
//
//     var tracer = Tracer(std.ArrayList(u8).Writer).init(allocator, output.writer());
//     try tracer.writeSnapshot(0, 0x00, Frame, &test_frame); // STOP
//
//     const json = output.items;
//     try std.testing.expect(std.mem.indexOf(u8, json, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") != null);
//     try std.testing.expect(std.mem.indexOf(u8, json, "0xdeadbeef") != null);
// }

// Tests from main branch (commented out as they use Frame instead of Frame)
// // test "tracer captures basic frame state with writer" {
//     const allocator = std.testing.allocator;
//
//     // Create a frame with some state
//     const Frame = frame_mod.Frame(.{
//         .stack_size = 10,
//         .block_gas_limit = 1000,
//     });
//
//     const host = createTestHost();
//     var test_frame = try Frame.init(allocator, &[_]u8{ 0x60, 0x05, 0x60, 0x03, 0x01 }, 1000, {}, host);
//     defer test_frame.deinit(allocator);
//
//     // Push some values onto the stack
//     try test_frame.stack.push(3);
//     try test_frame.stack.push(5);
//     // PC is now managed by plan, not frame
//     const gas_to_consume1 = @as(u64, @intCast(test_frame.gas_remaining - 950));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume1))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume1));
//
//     // Create tracer with array list writer
//     var output = std.ArrayList(u8).init(allocator);
//     defer output.deinit();
//
//     var tracer = Tracer(std.ArrayList(u8).Writer).init(allocator, output.writer());
//     const log = try tracer.snapshot(4, 0x01, Frame, &test_frame); // PC=4, opcode=ADD
//     defer allocator.free(log.stack);
//
//     // Verify snapshot
//     try std.testing.expectEqual(@as(u64, 4), log.pc);
//     try std.testing.expectEqualStrings("ADD", log.op);
//     try std.testing.expectEqual(@as(u64, 950), log.gas);
//     try std.testing.expectEqual(@as(u32, 1), log.depth);
//     try std.testing.expectEqual(@as(usize, 2), log.stack.len);
//     try std.testing.expectEqual(@as(u256, 3), log.stack[0]);
//     try std.testing.expectEqual(@as(u256, 5), log.stack[1]);
// }
//
// test "tracer writes JSON to writer" {
//     const allocator = std.testing.allocator;
//
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{ 0x60, 0x05, 0x60, 0x03, 0x01 }, 1000, {}, createTestHost());
//     defer test_frame.deinit(allocator);
//
//     try test_frame.stack.push(3);
//     try test_frame.stack.push(5);
//     // PC is now managed by plan, not frame
//     const gas_to_consume2 = @as(u64, @intCast(test_frame.gas_remaining - 950));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume2))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume2));
//
//     // Create tracer with array list writer
//     var output = std.ArrayList(u8).init(allocator);
//     defer output.deinit();
//
//     var tracer = Tracer(std.ArrayList(u8).Writer).init(allocator, output.writer());
//     try tracer.writeSnapshot(4, 0x01, Frame, &test_frame); // PC=4, opcode=ADD
//
//     const json = output.items;
//     try std.testing.expect(std.mem.indexOf(u8, json, "\"pc\":4") != null);
//     try std.testing.expect(std.mem.indexOf(u8, json, "\"op\":\"ADD\"") != null);
//     try std.testing.expect(std.mem.indexOf(u8, json, "\"gas\":950") != null);
//     try std.testing.expect(std.mem.indexOf(u8, json, "\"stack\":[\"0x3\",\"0x5\"]") != null);
// }
//
// test "logging tracer writes to stdout" {
//     const allocator = std.testing.allocator;
//
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{0x00}, 1000, {}, createTestHost());
//     defer test_frame.deinit(allocator);
//
//     var tracer = LoggingTracer.init(allocator);
//     const log = try tracer.snapshot(0, 0x00, Frame, &test_frame); // PC=0, opcode=STOP
//     defer allocator.free(log.stack);
//
//     try std.testing.expectEqual(@as(u64, 0), log.pc);
//     try std.testing.expectEqualStrings("STOP", log.op);
// }
//
// test "file tracer writes to file" {
//     const allocator = std.testing.allocator;
//
//     // Create temp dir and file
//     var tmp_dir = std.testing.tmpDir(.{});
//     defer tmp_dir.cleanup();
//
//     // Create file in the temp directory
//     const file = try tmp_dir.dir.createFile("trace.json", .{});
//     file.close();
//
//     // Get the full path
//     const file_path = try tmp_dir.dir.realpathAlloc(allocator, "trace.json");
//     defer allocator.free(file_path);
//
//     // Create frame
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{ 0x60, 0x42 }, 1000, {}, createTestHost());
//     defer test_frame.deinit(allocator);
//
//     // PC is now managed by plan, not frame
//     const gas_to_consume3 = @as(u64, @intCast(test_frame.gas_remaining - 997));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume3))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume3));
//
//     // Create file tracer and write
//     var tracer = try FileTracer.init(allocator, file_path);
//     defer tracer.deinit();
//
//     try tracer.writeSnapshot(0, 0x60, Frame, &test_frame); // PC=0, opcode=PUSH1
//
//     // Read file and verify
//     const contents = try tmp_dir.dir.readFileAlloc(allocator, "trace.json", 1024);
//     defer allocator.free(contents);
//
//     try std.testing.expect(std.mem.indexOf(u8, contents, "\"pc\":0") != null);
//     try std.testing.expect(std.mem.indexOf(u8, contents, "\"op\":\"PUSH1\"") != null);
//     try std.testing.expect(std.mem.indexOf(u8, contents, "\"gas\":997") != null);
// }
//
// test "tracer with gas cost computation" {
//     const allocator = std.testing.allocator;
//
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{ 0x60, 0x05, 0x01 }, 1000, {}, createTestHost());
//     defer test_frame.deinit(allocator);
//
//     var output = std.ArrayList(u8).init(allocator);
//     defer output.deinit();
//
//     var tracer = Tracer(std.ArrayList(u8).Writer).initWithConfig(
//         allocator,
//         output.writer(),
//         .{ .compute_gas_cost = true },
//     );
//
//     // First snapshot - no previous gas, so cost should be 0
//     const gas_to_consume4 = @as(u64, @intCast(test_frame.gas_remaining - 1000));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume4))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume4));
//     const log1 = try tracer.snapshot(0, 0x60, Frame, &test_frame); // PUSH1
//     defer allocator.free(log1.stack);
//     try std.testing.expectEqual(@as(u64, 0), log1.gasCost);
//
//     // Second snapshot - gas decreased by 3
//     const gas_to_consume5 = @as(u64, @intCast(test_frame.gas_remaining - 997));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume5))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume5));
//     const log2 = try tracer.snapshot(1, 0x60, Frame, &test_frame); // PUSH1
//     defer allocator.free(log2.stack);
//     try std.testing.expectEqual(@as(u64, 3), log2.gasCost);
//
//     // Third snapshot - gas decreased by 21
//     const gas_to_consume6 = @as(u64, @intCast(test_frame.gas_remaining - 976));
//     if (test_frame.gas_remaining < @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume6))) return error.OutOfGas;
//     test_frame.gas_remaining -= @as(@TypeOf(test_frame.gas_remaining), @intCast(gas_to_consume6));
//     const log3 = try tracer.snapshot(2, 0x01, Frame, &test_frame); // ADD
//     defer allocator.free(log3.stack);
//     try std.testing.expectEqual(@as(u64, 21), log3.gasCost);
// }
//
// test "tracer handles empty stack with JSON output" {
//     const allocator = std.testing.allocator;
//
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{0x00}, 1000, {}, createTestHost());
//     defer test_frame.deinit(allocator);
//
//     var output = std.ArrayList(u8).init(allocator);
//     defer output.deinit();
//
//     var tracer = Tracer(std.ArrayList(u8).Writer).init(allocator, output.writer());
//     try tracer.writeSnapshot(0, 0x00, Frame, &test_frame); // STOP
//
//     const json = output.items;
//     try std.testing.expect(std.mem.indexOf(u8, json, "\"stack\":[]") != null);
// }
//
// test "tracer handles large stack values in JSON" {
//     const allocator = std.testing.allocator;
//
//     const Frame = frame_mod.Frame(.{});
//     var test_frame = try Frame.init(allocator, &[_]u8{0x00}, 1000, {}, createTestHost());
//     defer test_frame.deinit(allocator);
//
//     try test_frame.stack.push(std.math.maxInt(u256));
//     try test_frame.stack.push(0xdeadbeef);
//
//     var output = std.ArrayList(u8).init(allocator);
//     defer output.deinit();
//
//     var tracer = Tracer(std.ArrayList(u8).Writer).init(allocator, output.writer());
//     try tracer.writeSnapshot(0, 0x00, Frame, &test_frame); // STOP
//
//     const json = output.items;
//     try std.testing.expect(std.mem.indexOf(u8, json, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") != null);
//     try std.testing.expect(std.mem.indexOf(u8, json, "0xdeadbeef") != null);
// }

// ============================================================================
// TRACER TESTS
// ============================================================================

// Test that DefaultTracer has zero cost
test "DefaultTracer has zero runtime cost" {
    var tracer = DefaultTracer.init(std.testing.allocator);

    const TestFrame = struct {
        gas: i32,
    };

    const test_frame = TestFrame{ .gas = 1000 };

    // These should compile to nothing
    tracer.beforeOp(0, 0x00, TestFrame, &test_frame);
    tracer.afterOp(0, 0x00, TestFrame, &test_frame);
    tracer.onError(0, 0x00, error.TestError, TestFrame, &test_frame);
}

// Minimal test host for tracer tests
const TestHost = struct {
    const Self = @This();

    pub fn get_balance(self: *Self, address: Address) u256 {
        _ = self;
        _ = address;
        return 0;
    }

    pub fn account_exists(self: *Self, address: Address) bool {
        _ = self;
        _ = address;
        return false;
    }

    pub fn get_code(self: *Self, address: Address) []const u8 {
        _ = self;
        _ = address;
        return &[_]u8{};
    }

    pub fn get_block_info(self: *Self) block_info_mod.DefaultBlockInfo {
        _ = self;
        return .{};
    }

    pub fn emit_log(self: *Self, contract_address: Address, topics: []const u256, data: []const u8) void {
        _ = self;
        _ = contract_address;
        _ = topics;
        _ = data;
    }

    pub fn inner_call(self: *Self, params: call_params_mod.CallParams) !call_result_mod.CallResult {
        _ = self;
        _ = params;
        return error.NotImplemented;
    }

    pub fn register_created_contract(self: *Self, address: Address) !void {
        _ = self;
        _ = address;
    }

    pub fn was_created_in_tx(self: *Self, address: Address) bool {
        _ = self;
        _ = address;
        return false;
    }

    pub fn create_snapshot(self: *Self) u32 {
        _ = self;
        return 0;
    }

    pub fn revert_to_snapshot(self: *Self, snapshot_id: u32) void {
        _ = self;
        _ = snapshot_id;
    }

    pub fn get_storage(self: *Self, address: Address, slot: u256) u256 {
        _ = self;
        _ = address;
        _ = slot;
        return 0;
    }

    pub fn set_storage(self: *Self, address: Address, slot: u256, value: u256) !void {
        _ = self;
        _ = address;
        _ = slot;
        _ = value;
    }

    pub fn record_storage_change(self: *Self, address: Address, slot: u256, original_value: u256) !void {
        _ = self;
        _ = address;
        _ = slot;
        _ = original_value;
    }

    pub fn get_original_storage(self: *Self, address: Address, slot: u256) ?u256 {
        _ = self;
        _ = address;
        _ = slot;
        return null;
    }

    pub fn access_address(self: *Self, address: Address) !u64 {
        _ = self;
        _ = address;
        return 0;
    }

    pub fn access_storage_slot(self: *Self, contract_address: Address, slot: u256) !u64 {
        _ = self;
        _ = contract_address;
        _ = slot;
        return 0;
    }

    pub fn mark_for_destruction(self: *Self, contract_address: Address, recipient: Address) !void {
        _ = self;
        _ = contract_address;
        _ = recipient;
    }

    pub fn get_input(self: *Self) []const u8 {
        _ = self;
        return &[_]u8{};
    }

    pub fn is_hardfork_at_least(self: *Self, target: hardfork_mod.Hardfork) bool {
        _ = self;
        _ = target;
        return true;
    }

    pub fn get_hardfork(self: *Self) hardfork_mod.Hardfork {
        _ = self;
        return .latest;
    }

    pub fn get_is_static(self: *Self) bool {
        _ = self;
        return false;
    }

    pub fn get_depth(self: *Self) u11 {
        _ = self;
        return 0;
    }

    pub fn get_gas_price(self: *Self) u256 {
        _ = self;
        return 0;
    }

    pub fn get_return_data(self: *Self) []const u8 {
        _ = self;
        return &[_]u8{};
    }

    pub fn get_chain_id(self: *Self) u64 {
        _ = self;
        return 1;
    }

    pub fn get_block_hash(self: *Self, block_number: u64) ?[32]u8 {
        _ = self;
        _ = block_number;
        return null;
    }

    pub fn get_blob_hash(self: *Self, index: u256) ?[32]u8 {
        _ = self;
        _ = index;
        return null;
    }

    pub fn get_blob_base_fee(self: *Self) u256 {
        _ = self;
        return 0;
    }

    pub fn get_tx_origin(self: *Self) Address {
        _ = self;
        return ZERO_ADDRESS;
    }

    pub fn get_caller(self: *Self) Address {
        _ = self;
        return ZERO_ADDRESS;
    }

    pub fn get_call_value(self: *Self) u256 {
        _ = self;
        return 0;
    }
};

// Helper function to create a test host for tracer tests
// fn createTestHost() Host {
//     const holder = struct {
//         var instance: TestHost = .{};
//     };
//     return Host.init(&holder.instance);
// }

test "DebuggingTracer basic functionality" {
    var tracer = DebuggingTracer.init(std.testing.allocator);
    defer tracer.deinit();

    // Test breakpoint management
    try tracer.addBreakpoint(10);
    try tracer.addBreakpoint(20);

    try std.testing.expect(tracer.hasBreakpoint(10));
    try std.testing.expect(tracer.hasBreakpoint(20));
    try std.testing.expect(!tracer.hasBreakpoint(15));

    // Test step mode
    tracer.setStepMode(true);
    try std.testing.expect(tracer.shouldPause(5)); // Should pause in step mode

    tracer.setStepMode(false);
    try std.testing.expect(tracer.shouldPause(10)); // Should pause on breakpoint
    try std.testing.expect(!tracer.shouldPause(5)); // Should not pause on regular instruction

    // Test removal
    try std.testing.expect(tracer.removeBreakpoint(10));
    try std.testing.expect(!tracer.hasBreakpoint(10));
    try std.testing.expect(!tracer.removeBreakpoint(10)); // Already removed

    // Test clear
    tracer.clearBreakpoints();
    try std.testing.expect(!tracer.hasBreakpoint(20));
}

test "DebuggingTracer memory management" {
    var tracer = DebuggingTracer.init(std.testing.allocator);
    defer tracer.deinit();

    // This test verifies that the tracer properly manages memory
    // when used with a mock frame
    const MockFrame = struct {
        gas_remaining: i64 = 1000,
        bytecode: []const u8,
        next_stack_index: usize,
        stack: [16]u256,

        fn init() @This() {
            return .{
                .gas_remaining = 1000,
                .bytecode = &[_]u8{ 0x60, 0x05 }, // PUSH1 5
                .next_stack_index = 0,
                .stack = [_]u256{0} ** 16,
            };
        }
    };

    var mock_frame = MockFrame.init();

    // Test beforeOp and afterOp
    tracer.beforeOp(0, 0x60, MockFrame, &mock_frame); // PC=0, PUSH1
    tracer.afterOp(0, 0x60, MockFrame, &mock_frame);

    // Verify step was recorded
    try std.testing.expectEqual(@as(usize, 1), tracer.steps.items.len);
    try std.testing.expectEqual(@as(u64, 1), tracer.total_instructions);

    const step = &tracer.steps.items[0];
    try std.testing.expectEqual(@as(u32, 0), step.pc);
    try std.testing.expectEqual(@as(u8, 0x60), step.opcode);
    try std.testing.expectEqualStrings("PUSH1", step.opcode_name);
}

test "GenericTracer with enhanced features" {
    const allocator = std.testing.allocator;

    // Create a test frame with memory and return data
    const TestFrame = struct {
        gas_remaining: i64 = 1000,
        stack: MockStack = .{},
        memory: MockMemory = .{},
        return_data: []const u8 = "test return data",
        depth: u32 = 1,

        const MockStack = struct {
            data: [3]u256 = [_]u256{ 0x123, 0x456, 0x789 },

            pub fn get_slice(self: *const MockStack) []const u256 {
                return &self.data;
            }

            pub fn size(self: *const MockStack) usize {
                return self.data.len;
            }
        };

        const MockMemory = struct {
            data: [32]u8 = [_]u8{ 0xDE, 0xAD, 0xBE, 0xEF } ++ [_]u8{0} ** 28,

            pub fn size(self: *const MockMemory) usize {
                return self.data.len;
            }

            pub fn get_slice_evm(self: *const MockMemory, offset: usize, len: usize) ![]const u8 {
                if (offset + len > self.data.len) return error.OutOfBounds;
                return self.data[offset .. offset + len];
            }
        };
    };

    var test_frame = TestFrame{};

    // Test with ArrayList writer (memory buffer)
    var output = std.array_list.AlignedManaged(u8, null).init(allocator);
    defer output.deinit();

    var tracer = GenericTracer(std.ArrayList(u8).Writer).initWithConfig(allocator, output.writer(), .{
        .capture_memory = .full,
        .compute_gas_cost = true,
        .capture_each_op = false,
    });

    // Take a snapshot with enhanced features
    const trace_log = try tracer.snapshot(5, 0x51, TestFrame, &test_frame); // PC=5, MLOAD
    defer trace_log.deinit(allocator);

    // Verify enhanced log capture
    try std.testing.expectEqual(@as(u64, 5), trace_log.pc);
    try std.testing.expectEqualStrings("MLOAD", trace_log.op);
    try std.testing.expectEqual(@as(u64, 1000), trace_log.gas);
    try std.testing.expectEqual(@as(u32, 1), trace_log.depth);
    try std.testing.expectEqual(@as(usize, 3), trace_log.stack.len);
    try std.testing.expectEqual(@as(u32, 32), trace_log.memSize);

    // Verify memory was captured
    try std.testing.expect(trace_log.memory != null);
    if (trace_log.memory) |mem| {
        try std.testing.expectEqual(@as(usize, 32), mem.len);
        try std.testing.expectEqual(@as(u8, 0xDE), mem[0]);
        try std.testing.expectEqual(@as(u8, 0xAD), mem[1]);
    }

    // Verify return data was captured
    try std.testing.expect(trace_log.returnData != null);
    if (trace_log.returnData) |ret_data| {
        try std.testing.expectEqualStrings("test return data", ret_data);
    }

    // Write JSON and verify output includes new fields
    try tracer.writeJson(&trace_log);
    const json = output.items;

    // Should include new fields
    try std.testing.expect(std.mem.indexOf(u8, json, "returnData") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "0xdead") != null); // memory content
}

test "FileTracer with generic writer interface" {
    const allocator = std.testing.allocator;

    // Create temp directory for test file
    var tmp_dir = std.testing.tmpDir(.{});
    defer tmp_dir.cleanup();

    const test_file_path = "test_trace.json";
    const file = try tmp_dir.dir.createFile(test_file_path, .{});
    file.close();

    // Get absolute path for FileTracer
    const abs_path = try tmp_dir.dir.realpathAlloc(allocator, test_file_path);
    defer allocator.free(abs_path);

    // Test frame
    const TestFrame = struct {
        gas_remaining: i64 = 500,
        stack: MockStack = .{},
        depth: u32 = 2,

        const MockStack = struct {
            data: [1]u256 = [_]u256{0x42},

            pub fn get_slice(self: *const MockStack) []const u256 {
                return &self.data;
            }

            pub fn size(self: *const MockStack) usize {
                return self.data.len;
            }
        };
    };

    var test_frame = TestFrame{};

    // Create FileTracer with enhanced config
    var tracer = try FileTracer.initWithConfig(allocator, abs_path, .{
        .capture_memory = .prefix,
        .memory_prefix = 64,
        .compute_gas_cost = true,
        .capture_each_op = true,
    });
    defer tracer.deinit();

    // Write enhanced trace
    try tracer.writeJSONTrace(0, 0x60, TestFrame, &test_frame); // PUSH1

    // Verify file was written
    const contents = try tmp_dir.dir.readFileAlloc(allocator, test_file_path, 4096);
    defer allocator.free(contents);

    try std.testing.expect(contents.len > 0);
    try std.testing.expect(std.mem.indexOf(u8, contents, "\"op\":\"PUSH1\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, contents, "\"depth\":2") != null);
}

test "JSONRPCTracer with enhanced output" {
    const allocator = std.testing.allocator;

    var tracer = JSONRPCTracer.init(allocator);
    defer tracer.deinit();

    // Simple test frame
    const TestFrame = struct {
        gas_remaining: i64 = 800,
        stack: MockStack = .{},

        const MockStack = struct {
            data: [2]u256 = [_]u256{ 0x100, 0x200 },

            pub fn get_slice(self: *const MockStack) []const u256 {
                return &self.data;
            }

            pub fn size(self: *const MockStack) usize {
                return self.data.len;
            }
        };
    };

    var test_frame = TestFrame{};

    // Capture step
    tracer.beforeOp(10, 0x01, TestFrame, &test_frame); // ADD at PC=10
    tracer.afterOp(10, 0x01, TestFrame, &test_frame);

    // Export to JSON and verify enhanced format
    var output = std.array_list.AlignedManaged(u8, null).init(allocator);
    defer output.deinit();

    try tracer.toJSON(output.writer());
    const json = output.items;

    // Verify basic structure
    try std.testing.expect(std.mem.indexOf(u8, json, "\"structLogs\":[") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"pc\":10") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"op\":\"ADD\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"gas\":800") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "\"stack\":[\"0x100\",\"0x200\"]") != null);
}
