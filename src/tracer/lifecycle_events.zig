const std = @import("std");
const log = @import("../log.zig");
const primitives = @import("primitives");

/// Lifecycle event handlers for the Tracer.
/// These handle all EVM lifecycle events like frame starts, call operations, arena management, etc.
pub fn Handlers(comptime TracerType: type) type {
    return struct {
        const builtin = @import("builtin");

        pub fn onFrameStart(self: *TracerType, code_len: usize, gas: u64, depth: u16) void {
            if (!self.config.enabled) return;
            if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[EVM] Frame execution started: code_len={}, gas={}, depth={}", .{ code_len, gas, depth });
        }

        pub fn onFrameComplete(self: *TracerType, gas_left: u64, output_len: usize) void {
            if (!self.config.enabled) return;
            if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[EVM] Frame execution completed: gas_left={}, output_len={}", .{ gas_left, output_len });
        }

        pub fn onAccountDelegation(self: *TracerType, account: []const u8, delegated: []const u8) void {
            _ = self;
            if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[EVM] Account {x} has delegation to {x}", .{ account, delegated });
        }

        pub fn onEmptyAccountAccess(self: *TracerType) void {
            _ = self;
            if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[EVM] Empty account access", .{});
        }

        /// Called when arena allocator is initialized
        pub fn onArenaInit(self: *TracerType, initial_capacity: usize, max_capacity: usize, growth_factor: u32) void {
            if (!self.config.enabled) return;
            if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[ARENA] Initialized: initial={d}, max={d}, growth={d}%", .{ initial_capacity, max_capacity, growth_factor });
        }

        /// Event: Call operation started
        pub fn onCallStart(self: *TracerType, call_type: []const u8, gas: i64, to: anytype, value: u256) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Call started: type={s} gas={d} value={d}", .{ call_type, gas, value });
            _ = to;
        }

        /// Event: EVM initialization started
        pub fn onEvmInit(self: *TracerType, gas_price: u256, origin: anytype, hardfork: []const u8) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] EVM init: gas_price={d} hardfork={s}", .{ gas_price, hardfork });
            _ = origin;
        }

        /// Called when arena is reset
        pub fn onArenaReset(self: *TracerType, mode: []const u8, capacity_before: usize, capacity_after: usize) void {
            if (!self.config.enabled) return;
            if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) log.debug("[ARENA] Reset ({s}): capacity {d} -> {d}", .{ mode, capacity_before, capacity_after });
        }

        /// Event: Beacon root update processing
        pub fn onBeaconRootUpdate(self: *TracerType, success: bool, error_val: ?anyerror) void {
            if (!self.config.enabled) return;
            if (error_val) |e| {
                log.debug("[TRACER] Beacon root update failed: {}", .{e});
            } else {
                log.debug("[TRACER] Beacon root update: success={}", .{success});
            }
        }

        /// Event: Call operation completed
        pub fn onCallComplete(self: *TracerType, success: bool, gas_left: i64, output_len: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Call complete: success={} gas_left={d} output_len={d}", .{ success, gas_left, output_len });
        }

        /// Event: Preflight check for call
        pub fn onCallPreflight(self: *TracerType, call_type: []const u8, result: []const u8) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Call preflight: type={s} result={s}", .{ call_type, result });
        }

        /// Event: Historical block hash update processing
        pub fn onHistoricalBlockHashUpdate(self: *TracerType, success: bool, error_val: ?anyerror) void {
            if (!self.config.enabled) return;
            if (error_val) |e| {
                log.debug("[TRACER] Historical block hash update failed: {}", .{e});
            } else {
                log.debug("[TRACER] Historical block hash update: success={}", .{success});
            }
        }

        /// Event: Code retrieval
        pub fn onCodeRetrieval(self: *TracerType, address: anytype, code_len: usize, is_empty: bool) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Code retrieval: len={d} empty={}", .{ code_len, is_empty });
            _ = address;
        }

        /// Event: Validator deposits processing
        pub fn onValidatorDeposits(self: *TracerType, success: bool, error_val: ?anyerror) void {
            if (!self.config.enabled) return;
            if (error_val) |e| {
                log.debug("[TRACER] Validator deposits failed: {}", .{e});
            } else {
                log.debug("[TRACER] Validator deposits: success={}", .{success});
            }
        }

        /// Called when an allocation is made
        pub fn onArenaAlloc(self: *TracerType, size: usize, alignment: usize, current_capacity: usize) void {
            if (!self.config.enabled) return;
            if (comptime (builtin.mode == .Debug)) {
                log.debug("[ARENA] Alloc: size={d} align={d} capacity={d}", .{ size, alignment, current_capacity });
            }
        }

        /// Event: Frame bytecode initialization
        pub fn onFrameBytecodeInit(self: *TracerType, bytecode_len: usize, success: bool, error_val: ?anyerror) void {
            if (!self.config.enabled) return;
            if (error_val) |e| {
                log.debug("[TRACER] Frame bytecode init failed: len={d} error={}", .{ bytecode_len, e });
            } else {
                log.debug("[TRACER] Frame bytecode init: len={d} success={}", .{ bytecode_len, success });
            }
        }

        /// Event: Validator withdrawals processing
        pub fn onValidatorWithdrawals(self: *TracerType, success: bool, error_val: ?anyerror) void {
            if (!self.config.enabled) return;
            if (error_val) |e| {
                log.debug("[TRACER] Validator withdrawals failed: {}", .{e});
            } else {
                log.debug("[TRACER] Validator withdrawals: success={}", .{success});
            }
        }

        /// Called when arena grows to accommodate new allocations
        pub fn onArenaGrow(self: *TracerType, old_capacity: usize, new_capacity: usize, requested_size: usize) void {
            if (!self.config.enabled) return;
            if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
                log.debug("[ARENA] Growing: {d} -> {d} bytes (requested={d})", .{ old_capacity, new_capacity, requested_size });
            }
        }

        /// Called when allocation fails
        pub fn onArenaAllocFailed(self: *TracerType, size: usize, current_capacity: usize, max_capacity: usize) void {
            if (!self.config.enabled) return;
            if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
                log.warn("[ARENA] Allocation failed: size={d}, current={d}, max={d}", .{ size, current_capacity, max_capacity });
            }
        }

        pub fn onBytecodeAnalysisStart(self: *TracerType, code_len: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Bytecode analysis start: len={d}", .{code_len});
        }

        pub fn onBytecodeAnalysisComplete(self: *TracerType, validated_up_to: usize, opcode_count: usize, jumpdest_count: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Bytecode analysis complete: validated={d} opcodes={d} jumpdests={d}", .{ validated_up_to, opcode_count, jumpdest_count });
        }

        /// Called when an invalid opcode is found during analysis
        pub fn onInvalidOpcode(self: *TracerType, pc: usize, opcode: u8) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Invalid opcode: pc={d} opcode=0x{x:0>2}", .{ pc, opcode });
        }

        /// Called when a JUMPDEST is found during analysis
        pub fn onJumpdestFound(self: *TracerType, pc: usize, count: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] JUMPDEST found: pc={d} total={d}", .{ pc, count });
        }

        /// Called when dispatch schedule build starts
        pub fn onScheduleBuildStart(self: *TracerType, bytecode_len: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Schedule build start: bytecode_len={d}", .{bytecode_len});
        }

        /// Called when a fusion optimization is detected
        pub fn onFusionDetected(self: *TracerType, pc: usize, fusion_type: []const u8, instruction_count: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Fusion detected: pc={d} type={s} count={d}", .{ pc, fusion_type, instruction_count });
        }

        /// Called when an invalid static jump is detected
        pub fn onInvalidStaticJump(self: *TracerType, jump_pc: usize, target_pc: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Invalid static jump: from={d} to={d}", .{ jump_pc, target_pc });
        }

        /// Called when a static jump is resolved
        pub fn onStaticJumpResolved(self: *TracerType, jump_pc: usize, target_pc: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Static jump resolved: from={d} to={d}", .{ jump_pc, target_pc });
        }

        /// Called when a truncated PUSH instruction is detected
        pub fn onTruncatedPush(self: *TracerType, pc: usize, push_size: u8, available: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Truncated PUSH: pc={d} size={d} available={d}", .{ pc, push_size, available });
        }

        /// Called when dispatch schedule build completes
        pub fn onScheduleBuildComplete(self: *TracerType, item_count: usize, fusion_count: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Schedule build complete: items={d} fusions={d}", .{ item_count, fusion_count });
        }

        /// Called when a jump table is created
        pub fn onJumpTableCreated(self: *TracerType, jumpdest_count: usize) void {
            if (!self.config.enabled) return;
            log.debug("[TRACER] Jump table created: jumpdest_count={d}", .{jumpdest_count});
        }
    };
}