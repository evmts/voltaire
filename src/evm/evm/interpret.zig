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

inline fn pre_step(self: *Evm, frame: *Frame, inst: *const Instruction, loop_iterations: *usize) void {
    if (comptime SAFE) {
        loop_iterations.* += 1;
        if (loop_iterations.* > MAX_ITERATIONS) {
            unreachable;
        }
    }

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
}

inline fn exec_and_advance(frame: *Frame, inst: *const Instruction) ExecutionError.Error!*const Instruction {
    try inst.opcode_fn(frame);
    return inst.next_instruction;
}

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
pub fn interpret(self: *Evm, frame: *Frame) ExecutionError.Error!void {
    {
        // The interpreter currently depends on frame.host which is a pointer back
        // to self. Because of this state on self should only ever be modified
        // by a single evm run at a time
        self.require_one_thread();
    }

    var instruction: *const Instruction = &frame.analysis.instructions[0];
    var loop_iterations: usize = 0;

    dispatch: switch (instruction.arg) {
        .none => {
            @branchHint(.likely);
            pre_step(self, frame, instruction, &loop_iterations);
            instruction = try exec_and_advance(frame, instruction);
            continue :dispatch instruction.arg;
        },
        // Analysis will batch calculate stack requirements and gas requirements for series of bytecode
        .block_info => |block| {
            pre_step(self, frame, instruction, &loop_iterations);
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
            instruction = try exec_and_advance(frame, instruction);
            continue :dispatch instruction.arg;
        },
        .dynamic_gas => |dyn_gas| {
            pre_step(self, frame, instruction, &loop_iterations);
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
            instruction = try exec_and_advance(frame, instruction);
            continue :dispatch instruction.arg;
        },
        // no more pc-based fused conditional jumps; analysis always resolves or marks invalid
        .conditional_jump_invalid => {
            pre_step(self, frame, instruction, &loop_iterations);
            // If condition is true, this is an invalid jump; otherwise fall through
            const condition = frame.stack.pop_unsafe();
            if (condition != 0) {
                return ExecutionError.Error.InvalidJump;
            }
            instruction = try exec_and_advance(frame, instruction);
            continue :dispatch instruction.arg;
        },
        .conditional_jump => |true_target| {
            pre_step(self, frame, instruction, &loop_iterations);
            const condition = frame.stack.pop_unsafe();
            if (condition != 0) {
                @branchHint(.unlikely);
                instruction = true_target;
                continue :dispatch instruction.arg;
            }
            instruction = try exec_and_advance(frame, instruction);
            continue :dispatch instruction.arg;
        },
        // Many jumps have a known jump destination and we handle that here.
        .jump => {
            pre_step(self, frame, instruction, &loop_iterations);
            // Analysis resolved the target by wiring next_instruction to the block start.
            // In fused immediate JUMP, analysis removed the PUSH entirely,
            // so there is no destination on the stack to pop here.
            const next_inst = instruction.next_instruction;
            instruction = next_inst;
            continue :dispatch instruction.arg;
        },
        // This is a jump that is not known until compile time because
        // it is pushed to stack dynamically
        .jump_unresolved => {
            @branchHint(.unlikely);
            pre_step(self, frame, instruction, &loop_iterations);
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
            continue :dispatch instruction.arg;
        },
        // Some conditional jumps are not known until runtime because the value is a dynamic value
        .conditional_jump_unresolved => {
            pre_step(self, frame, instruction, &loop_iterations);
            // EVM stack order: [dest, cond] with cond on top. Pop condition first, then destination.
            const condition = frame.stack.pop_unsafe();
            const dest = frame.stack.pop_unsafe();
            Log.warn("[INTERPRET] JUMPI(cond,dest) cond={}, dest={} ", .{ condition, dest });
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
                continue :dispatch instruction.arg;
            }
            instruction = try exec_and_advance(frame, instruction);
            continue :dispatch instruction.arg;
        },
        // A common pattern is to push a constant value to the stack and then execute
        // An instruction. So we combine the push and the instruction into a single instruction.
        .word => |value| {
            pre_step(self, frame, instruction, &loop_iterations);
            frame.stack.append_unsafe(value);
            instruction = try exec_and_advance(frame, instruction);
            continue :dispatch instruction.arg;
        },
        // Generically Kekkak just runs as a .none instruction but when possible
        // we can run it as a .keccak instruction to avoid the extra stack pop/push
        .keccak => |params| {
            pre_step(self, frame, instruction, &loop_iterations);
            if (frame.gas_remaining < params.gas_cost) {
                @branchHint(.cold);
                frame.gas_remaining = 0;
                return ExecutionError.Error.OutOfGas;
            }
            frame.gas_remaining -= params.gas_cost;
            // Safely downsize operands to host usize; fail if they don't fit
            const size_usize: usize = if (params.size) |imm| @intCast(imm) else blk: {
                const s = frame.stack.pop_unsafe();
                if (s > std.math.maxInt(usize)) {
                    @branchHint(.unlikely);
                    return ExecutionError.Error.OutOfOffset;
                }
                break :blk @as(usize, @intCast(s));
            };
            const offset_usize: usize = blk2: {
                const off = frame.stack.pop_unsafe();
                if (off > std.math.maxInt(usize)) {
                    @branchHint(.unlikely);
                    return ExecutionError.Error.OutOfOffset;
                }
                break :blk2 @as(usize, @intCast(off));
            };
            const data = try frame.memory.get_slice(offset_usize, size_usize);
            var hash: [32]u8 = undefined;
            std.crypto.hash.sha3.Keccak256.hash(data, &hash, .{});
            const result = std.mem.readInt(u256, &hash, .big);
            frame.stack.append_unsafe(result);
            instruction = try exec_and_advance(frame, instruction);
            continue :dispatch instruction.arg;
        },
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
    defer frame.deinit(allocator);

    const result = interpret(&vm, &frame);
    try std.testing.expectError(ExecutionError.Error.OutOfGas, result);
}

test "interpret: keccak+pop+JUMPDEST+STOP fragment halts with STOP" {
    const allocator = std.testing.allocator;
    const OpcodeMetadata = @import("../opcode_metadata/opcode_metadata.zig");
    const Analysis = @import("../analysis.zig");
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const Host = @import("../host.zig").Host;
    const Address = @import("primitives").Address.Address;

    const code = &[_]u8{
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0x20, // KECCAK256
        0x50, // POP
        0x5b, // JUMPDEST
        0x00, // STOP
    };

    var analysis = try Analysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();

    const host = Host.init(&vm);

    var frame = try Frame.init(
        100000, // gas_remaining
        false, // static
        0, // depth
        Address.ZERO, // contract
        Address.ZERO, // caller
        0, // value
        &analysis,
        host,
        db_interface,
        allocator,
    );
    defer frame.deinit(allocator);

    try std.testing.expectError(ExecutionError.Error.STOP, interpret(&vm, &frame));
}

test "interpret: fused PUSH+JUMP to forward JUMPDEST halts with STOP" {
    const allocator = std.testing.allocator;
    const OpcodeMetadata = @import("../opcode_metadata/opcode_metadata.zig");
    const Analysis = @import("../analysis.zig");
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const Host = @import("../host.zig").Host;
    const Address = @import("primitives").Address.Address;

    const code = &[_]u8{ 0x60, 0x03, 0x56, 0x5b, 0x00 }; // PUSH1 3; JUMP; JUMPDEST; STOP
    var analysis = try Analysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();

    const host = Host.init(&vm);
    var frame = try Frame.init(
        100000,
        false,
        0,
        Address.ZERO,
        Address.ZERO,
        0,
        &analysis,
        host,
        db_interface,
        allocator,
    );
    defer frame.deinit(allocator);

    try std.testing.expectError(ExecutionError.Error.STOP, interpret(&vm, &frame));
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
    defer frame.deinit(allocator);

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
    defer frame.deinit(allocator);

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
    defer frame.deinit(allocator);

    try interpret(&vm, &frame);
    const output = host.get_output();
    try std.testing.expect(output.len == 32);
    try std.testing.expect(output[31] == 1);
}

test "interpret: minimal dispatcher executes selected branch and returns 32 bytes" {
    const allocator = std.testing.allocator;
    const OpcodeMetadata = @import("../opcode_metadata/opcode_metadata.zig");
    const Analysis = @import("../analysis.zig");
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const Host = @import("../host.zig").Host;
    const Address = @import("primitives").Address.Address;

    // Build minimal dispatcher that checks for selector 0x11223344 and returns 32-byte 0x01 on match
    // Layout:
    // 00: PUSH1 0x00; 02: CALLDATALOAD; 03: PUSH1 0xe0; 05: SHR; 06: PUSH4 0x11223344; 0b: EQ
    // 0c: PUSH1 0x16; 0e: JUMPI; fallback: 0f: PUSH1 0x00; 11: PUSH1 0x00; 13: REVERT
    // 14: JUMPDEST; 15: PUSH1 0x01; 17: PUSH1 0x1f; 19: MSTORE; 1a: PUSH1 0x20; 1c: PUSH1 0x00; 1e: RETURN
    const code = &[_]u8{
        0x60, 0x00,
        0x35, 0x60,
        0xe0, 0x1c,
        0x63, 0x11,
        0x22, 0x33,
        0x44, 0x14,
        0x60, 0x16,
        0x57, 0x60,
        0x00, 0x60,
        0x00, 0xfd,
        0x5b, 0x60,
        0x01, 0x60,
        0x1f, 0x52,
        0x60, 0x20,
        0x60, 0x00,
        0xf3,
    };

    var analysis = try Analysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();

    const host = Host.init(&vm);

    // Case 1: matching selector 0x11223344
    var frame1 = try Frame.init(
        1_000_000,
        false,
        0,
        Address.ZERO,
        Address.ZERO,
        0,
        &analysis,
        host,
        db_interface,
        allocator,
    );
    defer frame1.deinit(allocator);

    const calldata_match = [_]u8{ 0x11, 0x22, 0x33, 0x44 };
    vm.current_input = &calldata_match;

    try interpret(&vm, &frame1);
    const out1 = host.get_output();
    try std.testing.expect(out1.len == 32);
    try std.testing.expect(out1[31] == 1);

    // Case 2: non-matching selector -> fallback REVERT with empty output
    var frame2 = try Frame.init(
        1_000_000,
        false,
        0,
        Address.ZERO,
        Address.ZERO,
        0,
        &analysis,
        host,
        db_interface,
        allocator,
    );
    defer frame2.deinit(allocator);

    const calldata_nomatch = [_]u8{ 0xaa, 0xbb, 0xcc, 0xdd };
    vm.current_input = &calldata_nomatch;
    const err2 = interpret(&vm, &frame2);
    try std.testing.expectError(ExecutionError.Error.REVERT, err2);
}

test "interpret: dispatcher using AND 0xffffffff extracts selector and returns 32 bytes" {
    const allocator = std.testing.allocator;
    const OpcodeMetadata = @import("../opcode_metadata/opcode_metadata.zig");
    const Analysis = @import("../analysis.zig");
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const Host = @import("../host.zig").Host;
    const Address = @import("primitives").Address.Address;

    // Bytecode that masks selector with AND 0xffffffff instead of SHR
    const code = &[_]u8{
        0x60, 0x00, // PUSH1 0
        0x35, // CALLDATALOAD
        0x63, 0xff, 0xff, 0xff, 0xff, // PUSH4 0xffffffff
        0x16, // AND
        0x63, 0x30, 0x62, 0x7b, 0x7c, // PUSH4 0x30627b7c
        0x14, // EQ
        0x60, 0x16, // PUSH1 0x16
        0x57, // JUMPI
        0x60, 0x00, // PUSH1 0
        0x60, 0x00, // PUSH1 0
        0xfd, // REVERT
        0x5b, // JUMPDEST @ 0x16
        0x60, 0x01, // PUSH1 1
        0x60, 0x1f, // PUSH1 31
        0x52, // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3, // RETURN
    };

    var analysis = try Analysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();

    const host = Host.init(&vm);

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
        allocator,
    );
    defer frame.deinit(allocator);

    const selector = [_]u8{ 0x30, 0x62, 0x7b, 0x7c };
    vm.current_input = &selector;

    try interpret(&vm, &frame);
    const out = host.get_output();
    try std.testing.expect(out.len == 32);
    try std.testing.expect(out[31] == 1);
}

test "interpret: ERC20 bench dispatcher returns 32 bytes for 0x30627b7c selector under direct interpret" {
    const allocator = std.testing.allocator;
    const MemoryDatabase = @import("../state/memory_database.zig").MemoryDatabase;
    const OpcodeMetadata = @import("../opcode_metadata/opcode_metadata.zig");
    const Analysis = @import("../analysis.zig");
    const Address = @import("primitives").Address.Address;

    // Read initcode and calldata from official bench files
    const initcode_hex_path = "/Users/williamcory/guillotine/bench/official/cases/erc20-transfer/bytecode.txt";
    const calldata_hex_path = "/Users/williamcory/guillotine/bench/official/cases/erc20-transfer/calldata.txt";

    const init_f = try std.fs.openFileAbsolute(initcode_hex_path, .{});
    defer init_f.close();
    const init_hex = try init_f.readToEndAlloc(allocator, 64 * 1024);
    defer allocator.free(init_hex);
    const init_bytes = try allocator.alloc(u8, init_hex.len / 2);
    defer allocator.free(init_bytes);
    _ = try std.fmt.hexToBytes(init_bytes, std.mem.trim(u8, init_hex, " \t\n\r"));

    const cal_f = try std.fs.openFileAbsolute(calldata_hex_path, .{});
    defer cal_f.close();
    const cal_hex = try cal_f.readToEndAlloc(allocator, 1024);
    defer allocator.free(cal_hex);
    const cal_bytes = try allocator.alloc(u8, std.mem.trim(u8, cal_hex, " \t\n\r").len / 2);
    defer allocator.free(cal_bytes);
    _ = try std.fmt.hexToBytes(cal_bytes, std.mem.trim(u8, cal_hex, " \t\n\r"));

    // Setup VM and deploy to get runtime code
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();

    const deployer = Address.ZERO;
    const create_res = try vm.create_contract(deployer, 0, init_bytes, 50_000_000);
    try std.testing.expect(create_res.success);
    const contract_addr = create_res.address;

    // Fetch deployed runtime code
    const runtime = vm.state.get_code(contract_addr);
    try std.testing.expect(runtime.len > 100);

    // Analyze and execute directly with interpreter, bypassing call()
    var analysis = try Analysis.from_code(allocator, runtime, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    const host = @import("../host.zig").Host.init(&vm);
    var frame = try Frame.init(
        5_000_000,
        false,
        0,
        contract_addr,
        deployer,
        0,
        &analysis,
        host,
        db_interface,
        allocator,
    );
    defer frame.deinit(allocator);

    // Set calldata to the 4-byte selector used by the bench
    vm.current_input = cal_bytes;

    // Run interpreter
    try interpret(&vm, &frame);
    const out = host.get_output();
    try std.testing.expect(out.len >= 32);
    try std.testing.expect(out[out.len - 1] == 1);
}
