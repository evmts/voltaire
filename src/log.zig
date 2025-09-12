const std = @import("std");
const builtin = @import("builtin");

/// Professional isomorphic logger for the EVM2 that works across all target architectures
/// including native platforms, WASI, and WASM environments. Uses the std_options.logFn
/// system for automatic platform adaptation.
///
/// Provides debug, error, and warning logging with EVM2-specific prefixing.
/// Debug logs are optimized away in release builds for performance.
/// Debug log for development and troubleshooting
/// Compile-time no-op in ReleaseFast/ReleaseSmall for performance
pub fn debug(comptime format: []const u8, args: anytype) void {
    if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
        if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
            std.log.debug("[EVM2] " ++ format, args);
        }
    }
}

/// Error log for critical issues that require attention
pub fn err(comptime format: []const u8, args: anytype) void {
    if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
        std.log.err("[EVM2] " ++ format, args);
    }
}

/// Warning log for non-critical issues and unexpected conditions
pub fn warn(comptime format: []const u8, args: anytype) void {
    if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
        std.log.warn("[EVM2] " ++ format, args);
    }
}

/// Info log for general information (use sparingly for performance)
pub fn info(comptime format: []const u8, args: anytype) void {
    if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
        std.log.info("[EVM2] " ++ format, args);
    }
}

/// Debug instruction execution for development and troubleshooting
/// Logs opcode execution with frame context information
/// @param frame The execution frame containing stack, memory, and gas information
/// @param opcode The UnifiedOpcode being executed (comptime known for optimization)
pub fn debug_instruction(frame: anytype, comptime opcode: @import("opcodes/opcode.zig").UnifiedOpcode) void {
    if (comptime (builtin.mode == .Debug or builtin.mode == .ReleaseSafe)) {
        if (builtin.target.cpu.arch != .wasm32 or builtin.target.os.tag != .freestanding) {
            // Get opcode name at compile time
            const opcode_name = comptime switch (opcode) {
                // Regular opcodes
                .STOP => "STOP",
                .ADD => "ADD",
                .MUL => "MUL",
                .SUB => "SUB",
                .DIV => "DIV",
                .SDIV => "SDIV",
                .MOD => "MOD",
                .SMOD => "SMOD",
                .ADDMOD => "ADDMOD",
                .MULMOD => "MULMOD",
                .EXP => "EXP",
                .SIGNEXTEND => "SIGNEXTEND",
                .LT => "LT",
                .GT => "GT",
                .SLT => "SLT",
                .SGT => "SGT",
                .EQ => "EQ",
                .ISZERO => "ISZERO",
                .AND => "AND",
                .OR => "OR",
                .XOR => "XOR",
                .NOT => "NOT",
                .BYTE => "BYTE",
                .SHL => "SHL",
                .SHR => "SHR",
                .SAR => "SAR",
                .KECCAK256 => "KECCAK256",
                .ADDRESS => "ADDRESS",
                .BALANCE => "BALANCE",
                .ORIGIN => "ORIGIN",
                .CALLER => "CALLER",
                .CALLVALUE => "CALLVALUE",
                .CALLDATALOAD => "CALLDATALOAD",
                .CALLDATASIZE => "CALLDATASIZE",
                .CALLDATACOPY => "CALLDATACOPY",
                .CODESIZE => "CODESIZE",
                .CODECOPY => "CODECOPY",
                .GASPRICE => "GASPRICE",
                .EXTCODESIZE => "EXTCODESIZE",
                .EXTCODECOPY => "EXTCODECOPY",
                .RETURNDATASIZE => "RETURNDATASIZE",
                .RETURNDATACOPY => "RETURNDATACOPY",
                .EXTCODEHASH => "EXTCODEHASH",
                .BLOCKHASH => "BLOCKHASH",
                .COINBASE => "COINBASE",
                .TIMESTAMP => "TIMESTAMP",
                .NUMBER => "NUMBER",
                .PREVRANDAO => "PREVRANDAO",
                .GASLIMIT => "GASLIMIT",
                .CHAINID => "CHAINID",
                .SELFBALANCE => "SELFBALANCE",
                .BASEFEE => "BASEFEE",
                .BLOBHASH => "BLOBHASH",
                .BLOBBASEFEE => "BLOBBASEFEE",
                .POP => "POP",
                .MLOAD => "MLOAD",
                .MSTORE => "MSTORE",
                .MSTORE8 => "MSTORE8",
                .SLOAD => "SLOAD",
                .SSTORE => "SSTORE",
                .JUMP => "JUMP",
                .JUMPI => "JUMPI",
                .PC => "PC",
                .MSIZE => "MSIZE",
                .GAS => "GAS",
                .JUMPDEST => "JUMPDEST",
                .TLOAD => "TLOAD",
                .TSTORE => "TSTORE",
                .MCOPY => "MCOPY",
                .PUSH0 => "PUSH0",
                .PUSH1 => "PUSH1",
                .PUSH2 => "PUSH2",
                .PUSH3 => "PUSH3",
                .PUSH4 => "PUSH4",
                .PUSH5 => "PUSH5",
                .PUSH6 => "PUSH6",
                .PUSH7 => "PUSH7",
                .PUSH8 => "PUSH8",
                .PUSH9 => "PUSH9",
                .PUSH10 => "PUSH10",
                .PUSH11 => "PUSH11",
                .PUSH12 => "PUSH12",
                .PUSH13 => "PUSH13",
                .PUSH14 => "PUSH14",
                .PUSH15 => "PUSH15",
                .PUSH16 => "PUSH16",
                .PUSH17 => "PUSH17",
                .PUSH18 => "PUSH18",
                .PUSH19 => "PUSH19",
                .PUSH20 => "PUSH20",
                .PUSH21 => "PUSH21",
                .PUSH22 => "PUSH22",
                .PUSH23 => "PUSH23",
                .PUSH24 => "PUSH24",
                .PUSH25 => "PUSH25",
                .PUSH26 => "PUSH26",
                .PUSH27 => "PUSH27",
                .PUSH28 => "PUSH28",
                .PUSH29 => "PUSH29",
                .PUSH30 => "PUSH30",
                .PUSH31 => "PUSH31",
                .PUSH32 => "PUSH32",
                .DUP1 => "DUP1",
                .DUP2 => "DUP2",
                .DUP3 => "DUP3",
                .DUP4 => "DUP4",
                .DUP5 => "DUP5",
                .DUP6 => "DUP6",
                .DUP7 => "DUP7",
                .DUP8 => "DUP8",
                .DUP9 => "DUP9",
                .DUP10 => "DUP10",
                .DUP11 => "DUP11",
                .DUP12 => "DUP12",
                .DUP13 => "DUP13",
                .DUP14 => "DUP14",
                .DUP15 => "DUP15",
                .DUP16 => "DUP16",
                .SWAP1 => "SWAP1",
                .SWAP2 => "SWAP2",
                .SWAP3 => "SWAP3",
                .SWAP4 => "SWAP4",
                .SWAP5 => "SWAP5",
                .SWAP6 => "SWAP6",
                .SWAP7 => "SWAP7",
                .SWAP8 => "SWAP8",
                .SWAP9 => "SWAP9",
                .SWAP10 => "SWAP10",
                .SWAP11 => "SWAP11",
                .SWAP12 => "SWAP12",
                .SWAP13 => "SWAP13",
                .SWAP14 => "SWAP14",
                .SWAP15 => "SWAP15",
                .SWAP16 => "SWAP16",
                .LOG0 => "LOG0",
                .LOG1 => "LOG1",
                .LOG2 => "LOG2",
                .LOG3 => "LOG3",
                .LOG4 => "LOG4",
                .CREATE => "CREATE",
                .CALL => "CALL",
                .CALLCODE => "CALLCODE",
                .RETURN => "RETURN",
                .DELEGATECALL => "DELEGATECALL",
                .CREATE2 => "CREATE2",
                .AUTH => "AUTH",
                .AUTHCALL => "AUTHCALL",
                .STATICCALL => "STATICCALL",
                .REVERT => "REVERT",
                .INVALID => "INVALID",
                .SELFDESTRUCT => "SELFDESTRUCT",
                // Synthetic opcodes
                .PUSH_ADD_INLINE => "PUSH_ADD_INLINE",
                .PUSH_ADD_POINTER => "PUSH_ADD_POINTER",
                .PUSH_MUL_INLINE => "PUSH_MUL_INLINE",
                .PUSH_MUL_POINTER => "PUSH_MUL_POINTER",
                .PUSH_DIV_INLINE => "PUSH_DIV_INLINE",
                .PUSH_DIV_POINTER => "PUSH_DIV_POINTER",
                .PUSH_SUB_INLINE => "PUSH_SUB_INLINE",
                .PUSH_SUB_POINTER => "PUSH_SUB_POINTER",
                .PUSH_MLOAD_INLINE => "PUSH_MLOAD_INLINE",
                .PUSH_MLOAD_POINTER => "PUSH_MLOAD_POINTER",
                .PUSH_MSTORE_INLINE => "PUSH_MSTORE_INLINE",
                .PUSH_MSTORE_POINTER => "PUSH_MSTORE_POINTER",
                .PUSH_AND_INLINE => "PUSH_AND_INLINE",
                .PUSH_AND_POINTER => "PUSH_AND_POINTER",
                .PUSH_OR_INLINE => "PUSH_OR_INLINE",
                .PUSH_OR_POINTER => "PUSH_OR_POINTER",
                .PUSH_XOR_INLINE => "PUSH_XOR_INLINE",
                .PUSH_XOR_POINTER => "PUSH_XOR_POINTER",
                .PUSH_MSTORE8_INLINE => "PUSH_MSTORE8_INLINE",
                .PUSH_MSTORE8_POINTER => "PUSH_MSTORE8_POINTER",
                .JUMP_TO_STATIC_LOCATION => "JUMP_TO_STATIC_LOCATION",
                .JUMPI_TO_STATIC_LOCATION => "JUMPI_TO_STATIC_LOCATION",
                .MULTI_PUSH_2 => "MULTI_PUSH_2",
                .MULTI_PUSH_3 => "MULTI_PUSH_3",
                .MULTI_POP_2 => "MULTI_POP_2",
                .MULTI_POP_3 => "MULTI_POP_3",
                .ISZERO_JUMPI => "ISZERO_JUMPI",
                .DUP2_MSTORE_PUSH => "DUP2_MSTORE_PUSH",
                .DUP3_ADD_MSTORE => "DUP3_ADD_MSTORE",
                .SWAP1_DUP2_ADD => "SWAP1_DUP2_ADD",
                .PUSH_DUP3_ADD => "PUSH_DUP3_ADD",
                .FUNCTION_DISPATCH => "FUNCTION_DISPATCH",
                .CALLVALUE_CHECK => "CALLVALUE_CHECK",
                .PUSH0_REVERT => "PUSH0_REVERT",
                .PUSH_ADD_DUP1 => "PUSH_ADD_DUP1",
                .MLOAD_SWAP1_DUP2 => "MLOAD_SWAP1_DUP2",
            };
            
            // Get opcode-specific details at compile time
            const details = comptime switch (opcode) {
                // Arithmetic operations - show type of operation
                .ADD, .MUL, .SUB, .DIV, .MOD => " | op=binary_arithmetic",
                .SDIV, .SMOD => " | op=signed_arithmetic",
                .ADDMOD, .MULMOD => " | op=modular_arithmetic",
                .EXP => " | op=exponentiation",
                .SIGNEXTEND => " | op=sign_extension",
                
                // Comparison operations
                .LT, .GT, .SLT, .SGT, .EQ => " | op=comparison",
                .ISZERO => " | op=zero_check",
                
                // Bitwise operations
                .AND, .OR, .XOR => " | op=bitwise_binary",
                .NOT => " | op=bitwise_unary",
                .BYTE => " | op=byte_extraction",
                .SHL, .SHR, .SAR => " | op=bit_shift",
                
                // Stack operations
                .POP => " | op=pop",
                .PUSH0, .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7,
                .PUSH8, .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15,
                .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23,
                .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => " | op=push",
                .DUP1, .DUP2, .DUP3, .DUP4, .DUP5, .DUP6, .DUP7, .DUP8,
                .DUP9, .DUP10, .DUP11, .DUP12, .DUP13, .DUP14, .DUP15, .DUP16 => " | op=duplicate",
                .SWAP1, .SWAP2, .SWAP3, .SWAP4, .SWAP5, .SWAP6, .SWAP7, .SWAP8,
                .SWAP9, .SWAP10, .SWAP11, .SWAP12, .SWAP13, .SWAP14, .SWAP15, .SWAP16 => " | op=swap",
                
                // Memory operations
                .MLOAD => " | op=memory_load",
                .MSTORE => " | op=memory_store",
                .MSTORE8 => " | op=memory_store_byte",
                .MSIZE => " | op=memory_size",
                .MCOPY => " | op=memory_copy",
                
                // Storage operations
                .SLOAD => " | op=storage_load",
                .SSTORE => " | op=storage_store",
                .TLOAD => " | op=transient_load",
                .TSTORE => " | op=transient_store",
                
                // Context operations
                .ADDRESS, .ORIGIN, .CALLER, .COINBASE => " | op=address_info",
                .BALANCE, .SELFBALANCE => " | op=balance_query",
                .CALLVALUE, .GASPRICE, .BASEFEE, .BLOBBASEFEE => " | op=value_info",
                .CALLDATALOAD => " | op=calldata_load",
                .CALLDATASIZE, .CODESIZE, .RETURNDATASIZE => " | op=size_query",
                .CALLDATACOPY, .CODECOPY, .RETURNDATACOPY => " | op=data_copy",
                .EXTCODESIZE, .EXTCODEHASH => " | op=external_code_info",
                .EXTCODECOPY => " | op=external_code_copy",
                .BLOCKHASH => " | op=block_hash",
                .TIMESTAMP, .NUMBER, .PREVRANDAO, .GASLIMIT, .CHAINID => " | op=block_info",
                .BLOBHASH => " | op=blob_hash",
                .PC => " | op=program_counter",
                .GAS => " | op=gas_query",
                
                // Jump operations
                .JUMP => " | op=jump",
                .JUMPI => " | op=conditional_jump",
                .JUMPDEST => " | op=jump_destination",
                
                // System operations
                .CREATE => " | op=create_contract",
                .CREATE2 => " | op=create2_contract",
                .CALL, .CALLCODE, .DELEGATECALL, .STATICCALL => " | op=call",
                .AUTHCALL => " | op=auth_call",
                .AUTH => " | op=authorize",
                .RETURN => " | op=return",
                .REVERT => " | op=revert",
                .SELFDESTRUCT => " | op=self_destruct",
                .STOP => " | op=stop",
                .INVALID => " | op=invalid",
                
                // Crypto operations
                .KECCAK256 => " | op=hash",
                
                // Log operations
                .LOG0, .LOG1, .LOG2, .LOG3, .LOG4 => " | op=log_event",
                
                // Synthetic operations
                .PUSH_ADD_INLINE, .PUSH_ADD_POINTER => " | op=fused_push_add",
                .PUSH_MUL_INLINE, .PUSH_MUL_POINTER => " | op=fused_push_mul",
                .PUSH_DIV_INLINE, .PUSH_DIV_POINTER => " | op=fused_push_div",
                .PUSH_SUB_INLINE, .PUSH_SUB_POINTER => " | op=fused_push_sub",
                .PUSH_AND_INLINE, .PUSH_AND_POINTER => " | op=fused_push_and",
                .PUSH_OR_INLINE, .PUSH_OR_POINTER => " | op=fused_push_or",
                .PUSH_XOR_INLINE, .PUSH_XOR_POINTER => " | op=fused_push_xor",
                .PUSH_MLOAD_INLINE, .PUSH_MLOAD_POINTER => " | op=fused_push_mload",
                .PUSH_MSTORE_INLINE, .PUSH_MSTORE_POINTER => " | op=fused_push_mstore",
                .PUSH_MSTORE8_INLINE, .PUSH_MSTORE8_POINTER => " | op=fused_push_mstore8",
                .JUMP_TO_STATIC_LOCATION => " | op=static_jump",
                .JUMPI_TO_STATIC_LOCATION => " | op=static_conditional_jump",
                .MULTI_PUSH_2, .MULTI_PUSH_3 => " | op=multi_push",
                .MULTI_POP_2, .MULTI_POP_3 => " | op=multi_pop",
                .ISZERO_JUMPI => " | op=fused_iszero_jumpi",
                .DUP2_MSTORE_PUSH => " | op=fused_dup2_mstore_push",
                .DUP3_ADD_MSTORE => " | op=fused_dup3_add_mstore",
                .SWAP1_DUP2_ADD => " | op=fused_swap1_dup2_add",
                .PUSH_DUP3_ADD => " | op=fused_push_dup3_add",
                .FUNCTION_DISPATCH => " | op=function_dispatch",
                .CALLVALUE_CHECK => " | op=callvalue_check",
                .PUSH0_REVERT => " | op=fused_push0_revert",
                .PUSH_ADD_DUP1 => " | op=fused_push_add_dup1",
                .MLOAD_SWAP1_DUP2 => " | op=fused_mload_swap1_dup2",
            };
            
            std.log.debug("[EVM2] EXEC: {s} | stack_size={d} gas_left={d}" ++ details, .{
                opcode_name,
                frame.stack.size(),
                frame.gas_remaining,
            });
        }
    }
}

test "log functions compile and execute without error" {
    debug("test debug message: {}", .{42});
    err("test error message: {s}", .{"error"});
    warn("test warning message: {d:.2}", .{3.14});
    info("test info message: {any}", .{true});
}

test "log functions handle different argument types" {
    debug("string: {s}, number: {d}, hex: {x}", .{ "test", 123, 0xABC });
    err("boolean: {}, float: {d:.3}", .{ false, 2.718 });
    warn("array: {any}", .{[_]u32{ 1, 2, 3 }});
    info("no args: {s}", .{""});
}