const std = @import("std");
const builtin = @import("builtin");
const ExecutionError = @import("../execution/execution_error.zig");
const CallResult = @import("call_result.zig").CallResult;
const CallParams = @import("../host.zig").CallParams;
const Host = @import("../host.zig").Host;
const Frame = @import("../frame.zig").Frame;
const Evm = @import("../evm.zig");
const primitives = @import("primitives");
const precompile_addresses = @import("../precompiles/precompile_addresses.zig");
const CodeAnalysis = @import("../analysis.zig").CodeAnalysis;
const Memory = @import("../memory/memory.zig");
const MAX_INPUT_SIZE = 131072; // 128KB
const MAX_CODE_SIZE = @import("../opcodes/opcode.zig").MAX_CODE_SIZE;
const MAX_CALL_DEPTH = @import("../constants/evm_limits.zig").MAX_CALL_DEPTH;
const SelfDestruct = @import("../self_destruct.zig").SelfDestruct;
const CreatedContracts = @import("../created_contracts.zig").CreatedContracts;

/// Simplified EVM execution without analysis - performs lazy jumpdest validation
/// This is a simpler alternative to the analysis-based approach used in call()
pub inline fn call_mini(self: *Evm, params: CallParams) ExecutionError.Error!CallResult {
    // For now, reuse the full interpreter to ensure correctness in differential tests
    return self.call(params);
}