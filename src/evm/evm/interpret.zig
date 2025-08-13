const std = @import("std");
const ExecutionError = @import("../execution/execution_error.zig");
const build_options = @import("build_options");
const Tracer = @import("../tracer.zig").Tracer;
const Frame = @import("../frame.zig").Frame;
const Log = @import("../log.zig");
const Evm = @import("../evm.zig");
const builtin = @import("builtin");
const UnreachableHandler = @import("../analysis.zig").UnreachableHandler;
const Instruction = @import("../instruction.zig").Instruction;

// Hoist U256 type alias used by fused arithmetic ops
const U256 = @import("primitives").Uint(256, 4);

const SAFE = builtin.mode == .Debug or builtin.mode == .ReleaseSafe;
const MAX_ITERATIONS = 10_000_000; // TODO set this to a real problem

/// Internal method to execute contract bytecode using block-based execution.
/// This loop is highly optimized for performance.
///
/// This version translates bytecode to an instruction stream before execution,
/// enabling better branch prediction and cache locality.
///
/// Time complexity: O(n) where n is the number of opcodes executed.
/// Memory: Uses provided Frame, no internal allocations.
///
/// The caller is responsible for creating and managing the Frame and its components.
pub inline fn interpret(self: *Evm, frame: *Frame) ExecutionError.Error!void {
    {
        // The interpreter currently depends on frame.host which is a pointer back
        // to self. Because of this state on self should only ever be modified
        // by a single evm run at a time
        self.require_one_thread();
    }

    // This interpreter follows a common practice of interpreters is to use a while true loop and throw errors
    // to exit from the loop including an expected stop.
    var instruction: *const Instruction = &frame.analysis.instructions[0];
    var loop_iterations: usize = 0;
    while (true) {
        // In Debug and OptimizeSafe we count and limit iterations
        if (comptime SAFE) {
            loop_iterations += 1;
            if (loop_iterations > MAX_ITERATIONS) {
                unreachable;
            }
        }

        const inst: *const Instruction = instruction;
        const next_inst = inst.next_instruction;
        const op_fn = inst.opcode_fn;

        if (comptime build_options.enable_tracing) {
            if (self.tracer) |writer| {
                // Derive index of current instruction for tracing
                const base: [*]const @TypeOf(inst.*) = frame.analysis.instructions.ptr;
                const idx = (@intFromPtr(inst) - @intFromPtr(base)) / @sizeOf(@TypeOf(inst.*));
                if (idx < frame.analysis.inst_to_pc.len) {
                    const pc_u16 = frame.analysis.inst_to_pc[idx];
                    if (pc_u16 != std.math.maxInt(u16)) {
                        const pc: usize = pc_u16;
                        const opcode: u8 = if (pc < frame.analysis.code_len) frame.analysis.code[pc] else 0x00;
                        const stack_len: usize = frame.stack.size();
                        const stack_view: []const u256 = frame.stack.data[0..stack_len];
                        const gas_cost: u64 = 0; // Block-based validation; per-op gas not tracked here
                        const mem_size: usize = frame.memory.size();
                        var tr = Tracer.init(writer);
                        _ = tr.trace(pc, opcode, stack_view, frame.gas_remaining, gas_cost, mem_size, @intCast(frame.depth)) catch {};
                    }
                }
            }
        }

        // Analysis puts any metadata we need to process on Inst.arg
        switch (inst.arg) {
            // Most instructions
            .none => {
                @branchHint(.likely);
            },
            // Analysis will batch calculate stack requirements and gas requirements for series of bytecode
            .block_info => |block| {
                const current_stack_size: u16 = @intCast(frame.stack.size());
                if (frame.gas_remaining < block.gas_cost) {
                    @branchHint(.unlikely);
                    frame.gas_remaining = 0;
                    return ExecutionError.Error.OutOfGas;
                }
                frame.gas_remaining -= block.gas_cost;
                if (current_stack_size < block.stack_req) {
                    @branchHint(.cold);
                    return ExecutionError.Error.StackUnderflow;
                }
                if (current_stack_size + block.stack_max_growth > 1024) {
                    @branchHint(.cold);
                    return ExecutionError.Error.StackOverflow;
                }
            },
            .dynamic_gas => |dyn_gas| {
                if (frame.gas_remaining < dyn_gas.static_cost) {
                    @branchHint(.cold);
                    frame.gas_remaining = 0;
                    return ExecutionError.Error.OutOfGas;
                }
                frame.gas_remaining -= dyn_gas.static_cost;

                if (dyn_gas.gas_fn) |gas_fn| {
                    const additional_gas = gas_fn(frame) catch |err| {
                        if (err == ExecutionError.Error.OutOfOffset) {
                            return err;
                        }
                        frame.gas_remaining = 0;
                        return ExecutionError.Error.OutOfGas;
                    };

                    if (frame.gas_remaining < additional_gas) {
                        @branchHint(.cold);
                        frame.gas_remaining = 0;
                        return ExecutionError.Error.OutOfGas;
                    }
                    frame.gas_remaining -= additional_gas;
                }
            },
            .jump_pc => |pc| {
                // Fused PUSH+JUMP (PUSH removed). No pops required.
                if (!frame.valid_jumpdest(pc)) return ExecutionError.Error.InvalidJump;
                const dest_usize: usize = @intCast(pc);
                const idx = frame.analysis.pc_to_block_start[dest_usize];
                if (idx == std.math.maxInt(u16) or idx >= frame.analysis.instructions.len) return ExecutionError.Error.InvalidJump;
                instruction = &frame.analysis.instructions[idx];
                continue;
            },
            .conditional_jump_pc => |pc| {
                // Fused PUSH+JUMPI (PUSH removed). Pop only condition.
                const condition = frame.stack.pop_unsafe();
                if (condition != 0) {
                    if (!frame.valid_jumpdest(pc)) return ExecutionError.Error.InvalidJump;
                    const dest_usize: usize = @intCast(pc);
                    const idx = frame.analysis.pc_to_block_start[dest_usize];
                    if (idx == std.math.maxInt(u16) or idx >= frame.analysis.instructions.len) return ExecutionError.Error.InvalidJump;
                    instruction = &frame.analysis.instructions[idx];
                    continue;
                }
            },
            .conditional_jump => |true_target| {
                const condition = frame.stack.pop_unsafe();
                if (condition != 0) {
                    @branchHint(.unlikely);
                    instruction = true_target;
                    continue;
                }
            },
            .jump => {
                // Analysis resolved the target by wiring next_instruction to the block start.
                // Pop destination to maintain correct stack behavior (already validated by block checks).
                _ = frame.stack.pop_unsafe();
                instruction = next_inst;
                continue;
            },
            // This is a jump that is not known until compile time because
            // it is pushed to stack dynamically
            .jump_unresolved => {
                @branchHint(.unlikely);
                // Compute target from popped PC and validate jumpdest on the fly
                const dest = frame.stack.pop_unsafe();
                if (!frame.valid_jumpdest(dest)) {
                    @branchHint(.cold);
                    return ExecutionError.Error.InvalidJump;
                }
                const dest_usize: usize = @intCast(dest);
                const idx = frame.analysis.pc_to_block_start[dest_usize];
                if (idx == std.math.maxInt(u16) or idx >= frame.analysis.instructions.len) {
                    @branchHint(.cold);
                    return ExecutionError.Error.InvalidJump;
                }
                instruction = &frame.analysis.instructions[idx];
                continue;
            },
            .conditional_jump_unresolved => {
                // Pop condition and destination; jump only if condition != 0
                const dest = frame.stack.pop_unsafe();
                const condition = frame.stack.pop_unsafe();
                if (condition != 0) {
                    if (!frame.valid_jumpdest(dest)) {
                        return ExecutionError.Error.InvalidJump;
                    }
                    const dest_usize: usize = @intCast(dest);
                    const idx = frame.analysis.pc_to_block_start[dest_usize];
                    if (idx == std.math.maxInt(u16) or idx >= frame.analysis.instructions.len) {
                        return ExecutionError.Error.InvalidJump;
                    }
                    instruction = &frame.analysis.instructions[idx];
                    continue;
                }
            },
            .word => |value| {
                frame.stack.append_unsafe(value);
            },
            .keccak => |params| {
                if (frame.gas_remaining < params.gas_cost) {
                    @branchHint(.cold);
                    frame.gas_remaining = 0;
                    return ExecutionError.Error.OutOfGas;
                }
                frame.gas_remaining -= params.gas_cost;
                const size = if (params.size) |imm| @as(u256, @intCast(imm)) else frame.stack.pop_unsafe();
                const offset = frame.stack.pop_unsafe();

                if (offset > std.math.maxInt(usize) or size > std.math.maxInt(usize)) {
                    @branchHint(.unlikely);
                    return ExecutionError.Error.OutOfOffset;
                }

                const offset_usize = @as(usize, @intCast(offset));
                const size_usize = @as(usize, @intCast(size));

                const data = try frame.memory.get_slice(offset_usize, size_usize);

                var hash: [32]u8 = undefined;
                std.crypto.hash.sha3.Keccak256.hash(data, &hash, .{});

                const result = std.mem.readInt(u256, &hash, .big);
                frame.stack.append_unsafe(result);
            },
        }

        try op_fn(frame);
        instruction = next_inst;
    }
}

test "BEGINBLOCK: upfront OutOfGas when gas < block base cost" {
    const allocator = std.testing.allocator;
    const OpcodeMetadata = @import("../opcode_metadata/opcode_metadata.zig");
    const Analysis = @import("../analysis.zig");
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const AccessList = @import("../access_list/access_list.zig").AccessList;
    const CallJournal = @import("../call_frame_stack.zig").CallJournal;
    const Host = @import("../host.zig").Host;
    const SelfDestruct = @import("../self_destruct.zig").SelfDestruct;
    const CreatedContracts = @import("../created_contracts.zig").CreatedContracts;
    const Address = @import("primitives").Address.Address;

    // Simple block with 5 x PUSH1 (5*3 gas) then STOP
    const code = &[_]u8{ 0x60, 0x01, 0x60, 0x02, 0x60, 0x03, 0x60, 0x04, 0x60, 0x05, 0x00 };
    var analysis = try Analysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    // Setup VM and environment
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();

    var access_list = AccessList.init(allocator, @import("../access_list/context.zig").Context.init());
    defer access_list.deinit();
    var journal = CallJournal.init(allocator);
    defer journal.deinit();
    var self_destruct = SelfDestruct.init(allocator);
    defer self_destruct.deinit();
    var created_contracts = CreatedContracts.init(allocator);
    defer created_contracts.deinit();

    // Evm implements Host interface
    const host = Host.init(vm);

    // Gas is less than block base cost (5*3 = 15)
    var frame = try Frame.init(
        10, // gas_remaining
        false, // static
        0, // depth
        Address.ZERO, // contract
        Address.ZERO, // caller
        0, // value
        &analysis,
        &access_list,
        &journal,
        host,
        0, // snapshot_id
        db_interface,
        Frame.ChainRules.DEFAULT,
        &self_destruct,
        &created_contracts,
        &[_]u8{}, // input
        allocator,
        null,
        false,
        false,
    );
    defer frame.deinit();

    const result = interpret(&vm, &frame);
    try std.testing.expectError(ExecutionError.Error.OutOfGas, result);
}

test "BEGINBLOCK: stack underflow detected at block entry" {
    const allocator = std.testing.allocator;
    const OpcodeMetadata = @import("../opcode_metadata/opcode_metadata.zig");
    const Analysis = @import("../analysis.zig");
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const AccessList = @import("../access_list/access_list.zig").AccessList;
    const CallJournal = @import("../call_frame_stack.zig").CallJournal;
    const Host = @import("../host.zig").Host;
    const SelfDestruct = @import("../self_destruct.zig").SelfDestruct;
    const CreatedContracts = @import("../created_contracts.zig").CreatedContracts;
    const Address = @import("primitives").Address.Address;

    // Block with ADD (requires 2 stack items) then STOP
    const code = &[_]u8{ 0x01, 0x00 };
    var analysis = try Analysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    var vm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();

    var access_list = AccessList.init(allocator, @import("../access_list/context.zig").Context.init());
    defer access_list.deinit();
    var journal = CallJournal.init(allocator);
    defer journal.deinit();
    var self_destruct = SelfDestruct.init(allocator);
    defer self_destruct.deinit();
    var created_contracts = CreatedContracts.init(allocator);
    defer created_contracts.deinit();

    const host = Host.init(vm);

    var frame = try Frame.init(
        1000,
        false,
        0,
        Address.ZERO,
        Address.ZERO,
        0,
        &analysis,
        &access_list,
        &journal,
        host,
        0,
        db_interface,
        Frame.ChainRules.DEFAULT,
        &self_destruct,
        &created_contracts,
        &[_]u8{},
        allocator,
        null,
        false,
        false,
    );
    defer frame.deinit();

    // Stack is empty -> should fail at BEGINBLOCK
    const result = interpret(&vm, &frame);
    try std.testing.expectError(ExecutionError.Error.StackUnderflow, result);
}

test "BEGINBLOCK: stack overflow detected from max growth" {
    const allocator = std.testing.allocator;
    const OpcodeMetadata = @import("../opcode_metadata/opcode_metadata.zig");
    const Analysis = @import("../analysis.zig");
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const AccessList = @import("../access_list/access_list.zig").AccessList;
    const CallJournal = @import("../call_frame_stack.zig").CallJournal;
    const Host = @import("../host.zig").Host;
    const SelfDestruct = @import("../self_destruct.zig").SelfDestruct;
    const CreatedContracts = @import("../created_contracts.zig").CreatedContracts;
    const Address = @import("primitives").Address.Address;
    const Stack = @import("../stack/stack.zig");

    // Block with PUSH1 then STOP (max_growth = +1)
    const code = &[_]u8{ 0x60, 0x01, 0x00 };
    var analysis = try Analysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    var vm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();

    var access_list = AccessList.init(allocator, @import("../access_list/context.zig").Context.init());
    defer access_list.deinit();
    var journal = CallJournal.init(allocator);
    defer journal.deinit();
    var self_destruct = SelfDestruct.init(allocator);
    defer self_destruct.deinit();
    var created_contracts = CreatedContracts.init(allocator);
    defer created_contracts.deinit();

    const host = Host.init(vm);

    var frame = try Frame.init(
        1000,
        false,
        0,
        Address.ZERO,
        Address.ZERO,
        0,
        &analysis,
        &access_list,
        &journal,
        host,
        0,
        db_interface,
        Frame.ChainRules.DEFAULT,
        &self_destruct,
        &created_contracts,
        &[_]u8{},
        allocator,
        null,
        false,
        false,
    );
    defer frame.deinit();

    // Fill stack to capacity
    var i: usize = 0;
    while (i < Stack.CAPACITY) : (i += 1) {
        frame.stack.append_unsafe(0);
    }

    const result = interpret(&vm, &frame);
    try std.testing.expectError(ExecutionError.Error.StackOverflow, result);
}

test "dynamic jump returns 32-byte true" {
    const allocator = std.testing.allocator;
    const OpcodeMetadata = @import("../opcode_metadata/opcode_metadata.zig");
    const Analysis = @import("../analysis.zig");
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const AccessList = @import("../access_list/access_list.zig").AccessList;
    const CallJournal = @import("../call_frame_stack.zig").CallJournal;
    const Host = @import("../host.zig").Host;
    const SelfDestruct = @import("../self_destruct.zig").SelfDestruct;
    const CreatedContracts = @import("../created_contracts.zig").CreatedContracts;
    const Address = @import("primitives").Address.Address;

    // Bytecode:
    // 00: PUSH1 0x05
    // 02: JUMP              -> to 0x05
    // 03: STOP              (not executed)
    // 04: PUSH1 0x00        (padding)
    // 05: JUMPDEST
    // 06: PUSH1 0x01        (value true)
    // 08: PUSH1 0x1f        (offset 31)
    // 0a: MSTORE            (store true at [31..63])
    // 0b: PUSH1 0x20        (size 32)
    // 0d: PUSH1 0x00        (offset 0)
    // 0f: RETURN
    const code = &[_]u8{
        0x60, 0x05, // PUSH1 0x05
        0x56, // JUMP
        0x00, // STOP
        0x60, 0x00, // PUSH1 0x00 (padding)
        0x5B, // JUMPDEST @ 0x05
        0x60, 0x01, // PUSH1 0x01
        0x60, 0x1F, // PUSH1 0x1f
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 0x20
        0x60, 0x00, // PUSH1 0x00
        0xF3, // RETURN
    };

    var analysis = try Analysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();

    var access_list = AccessList.init(allocator, @import("../access_list/context.zig").Context.init());
    defer access_list.deinit();
    var journal = CallJournal.init(allocator);
    defer journal.deinit();
    var self_destruct = SelfDestruct.init(allocator);
    defer self_destruct.deinit();
    var created_contracts = CreatedContracts.init(allocator);
    defer created_contracts.deinit();

    // Evm implements Host
    const host = Host.init(vm);

    var frame = try Frame.init(
        1_000_000,
        false,
        0,
        Address.ZERO,
        Address.ZERO,
        0,
        &analysis,
        host,
        db_interface,
        Frame.ChainRules.DEFAULT,
        &self_destruct,
        &[_]u8{},
        allocator,
        false,
        false,
    );
    defer frame.deinit();

    try interpret(&vm, &frame);
    const output = host.get_output();
    try std.testing.expect(output.len == 32);
    try std.testing.expect(output[31] == 1);
}
