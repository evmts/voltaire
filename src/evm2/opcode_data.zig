const std = @import("std");
const primitives = @import("primitives");
const GasConstants = primitives.GasConstants;

pub const Opcode = enum(u8) {
    // 0x00s: Stop and Arithmetic Operations
    STOP = 0x00,
    ADD = 0x01,
    MUL = 0x02,
    SUB = 0x03,
    DIV = 0x04,
    SDIV = 0x05,
    MOD = 0x06,
    SMOD = 0x07,
    ADDMOD = 0x08,
    MULMOD = 0x09,
    EXP = 0x0a,
    SIGNEXTEND = 0x0b,
    // 0x10s: Comparison & Bitwise Logic Operations
    LT = 0x10,
    GT = 0x11,
    SLT = 0x12,
    SGT = 0x13,
    EQ = 0x14,
    ISZERO = 0x15,
    AND = 0x16,
    OR = 0x17,
    XOR = 0x18,
    NOT = 0x19,
    BYTE = 0x1a,
    SHL = 0x1b,
    SHR = 0x1c,
    SAR = 0x1d,
    // 0x20s: Crypto
    KECCAK256 = 0x20,
    // 0x30s: Environmental Information
    ADDRESS = 0x30,
    BALANCE = 0x31,
    ORIGIN = 0x32,
    CALLER = 0x33,
    CALLVALUE = 0x34,
    CALLDATALOAD = 0x35,
    CALLDATASIZE = 0x36,
    CALLDATACOPY = 0x37,
    CODESIZE = 0x38,
    CODECOPY = 0x39,
    GASPRICE = 0x3a,
    EXTCODESIZE = 0x3b,
    EXTCODECOPY = 0x3c,
    RETURNDATASIZE = 0x3d,
    RETURNDATACOPY = 0x3e,
    EXTCODEHASH = 0x3f,
    // 0x40s: Block Information
    BLOCKHASH = 0x40,
    COINBASE = 0x41,
    TIMESTAMP = 0x42,
    NUMBER = 0x43,
    DIFFICULTY = 0x44,
    GASLIMIT = 0x45,
    CHAINID = 0x46,
    SELFBALANCE = 0x47,
    BASEFEE = 0x48,
    BLOBHASH = 0x49,
    BLOBBASEFEE = 0x4a,
    // 0x50s: Stack, Memory, Storage and Flow Operations
    POP = 0x50,
    MLOAD = 0x51,
    MSTORE = 0x52,
    MSTORE8 = 0x53,
    SLOAD = 0x54,
    SSTORE = 0x55,
    JUMP = 0x56,
    JUMPI = 0x57,
    PC = 0x58,
    MSIZE = 0x59,
    GAS = 0x5a,
    JUMPDEST = 0x5b,
    TLOAD = 0x5c,
    TSTORE = 0x5d,
    MCOPY = 0x5e,
    PUSH0 = 0x5f,
    // 0x60-0x7f: PUSH1-PUSH32
    PUSH1 = 0x60,
    PUSH2 = 0x61,
    PUSH3 = 0x62,
    PUSH4 = 0x63,
    PUSH5 = 0x64,
    PUSH6 = 0x65,
    PUSH7 = 0x66,
    PUSH8 = 0x67,
    PUSH9 = 0x68,
    PUSH10 = 0x69,
    PUSH11 = 0x6a,
    PUSH12 = 0x6b,
    PUSH13 = 0x6c,
    PUSH14 = 0x6d,
    PUSH15 = 0x6e,
    PUSH16 = 0x6f,
    PUSH17 = 0x70,
    PUSH18 = 0x71,
    PUSH19 = 0x72,
    PUSH20 = 0x73,
    PUSH21 = 0x74,
    PUSH22 = 0x75,
    PUSH23 = 0x76,
    PUSH24 = 0x77,
    PUSH25 = 0x78,
    PUSH26 = 0x79,
    PUSH27 = 0x7a,
    PUSH28 = 0x7b,
    PUSH29 = 0x7c,
    PUSH30 = 0x7d,
    PUSH31 = 0x7e,
    PUSH32 = 0x7f,
    // 0x80-0x8f: DUP1-DUP16
    DUP1 = 0x80,
    DUP2 = 0x81,
    DUP3 = 0x82,
    DUP4 = 0x83,
    DUP5 = 0x84,
    DUP6 = 0x85,
    DUP7 = 0x86,
    DUP8 = 0x87,
    DUP9 = 0x88,
    DUP10 = 0x89,
    DUP11 = 0x8a,
    DUP12 = 0x8b,
    DUP13 = 0x8c,
    DUP14 = 0x8d,
    DUP15 = 0x8e,
    DUP16 = 0x8f,
    // 0x90-0x9f: SWAP1-SWAP16
    SWAP1 = 0x90,
    SWAP2 = 0x91,
    SWAP3 = 0x92,
    SWAP4 = 0x93,
    SWAP5 = 0x94,
    SWAP6 = 0x95,
    SWAP7 = 0x96,
    SWAP8 = 0x97,
    SWAP9 = 0x98,
    SWAP10 = 0x99,
    SWAP11 = 0x9a,
    SWAP12 = 0x9b,
    SWAP13 = 0x9c,
    SWAP14 = 0x9d,
    SWAP15 = 0x9e,
    SWAP16 = 0x9f,
    // 0xa0-0xa4: LOG0-LOG4
    LOG0 = 0xa0,
    LOG1 = 0xa1,
    LOG2 = 0xa2,
    LOG3 = 0xa3,
    LOG4 = 0xa4,
    // 0xf0s: System operations
    CREATE = 0xf0,
    CALL = 0xf1,
    CALLCODE = 0xf2,
    RETURN = 0xf3,
    DELEGATECALL = 0xf4,
    CREATE2 = 0xf5,
    STATICCALL = 0xfa,
    REVERT = 0xfd,
    INVALID = 0xfe,
    SELFDESTRUCT = 0xff,
};

/// Combined opcode metadata for better cache efficiency
pub const OpcodeInfo = struct {
    gas_cost: u16,
    stack_inputs: u4,
    stack_outputs: u4,
};

/// Undefined opcodes - opcodes that are not implemented in the EVM
pub const UNDEFINED_OPCODES = blk: {
    // Start with all opcodes as potentially undefined
    var undefined_list: [256]u8 = undefined;
    var count: u8 = 0;

    // Track which opcodes are defined
    var defined: [256]bool = [_]bool{false} ** 256;

    // Mark all defined opcodes
    // 0x00s: Stop and Arithmetic Operations
    defined[0x00] = true; // STOP
    defined[0x01] = true; // ADD
    defined[0x02] = true; // MUL
    defined[0x03] = true; // SUB
    defined[0x04] = true; // DIV
    defined[0x05] = true; // SDIV
    defined[0x06] = true; // MOD
    defined[0x07] = true; // SMOD
    defined[0x08] = true; // ADDMOD
    defined[0x09] = true; // MULMOD
    defined[0x0a] = true; // EXP
    defined[0x0b] = true; // SIGNEXTEND

    // 0x10s: Comparison & Bitwise Logic Operations
    defined[0x10] = true; // LT
    defined[0x11] = true; // GT
    defined[0x12] = true; // SLT
    defined[0x13] = true; // SGT
    defined[0x14] = true; // EQ
    defined[0x15] = true; // ISZERO
    defined[0x16] = true; // AND
    defined[0x17] = true; // OR
    defined[0x18] = true; // XOR
    defined[0x19] = true; // NOT
    defined[0x1a] = true; // BYTE
    defined[0x1b] = true; // SHL
    defined[0x1c] = true; // SHR
    defined[0x1d] = true; // SAR

    // 0x20s: Crypto
    defined[0x20] = true; // KECCAK256

    // 0x30s: Environmental Information
    defined[0x30] = true; // ADDRESS
    defined[0x31] = true; // BALANCE
    defined[0x32] = true; // ORIGIN
    defined[0x33] = true; // CALLER
    defined[0x34] = true; // CALLVALUE
    defined[0x35] = true; // CALLDATALOAD
    defined[0x36] = true; // CALLDATASIZE
    defined[0x37] = true; // CALLDATACOPY
    defined[0x38] = true; // CODESIZE
    defined[0x39] = true; // CODECOPY
    defined[0x3a] = true; // GASPRICE
    defined[0x3b] = true; // EXTCODESIZE
    defined[0x3c] = true; // EXTCODECOPY
    defined[0x3d] = true; // RETURNDATASIZE
    defined[0x3e] = true; // RETURNDATACOPY
    defined[0x3f] = true; // EXTCODEHASH

    // 0x40s: Block Information
    defined[0x40] = true; // BLOCKHASH
    defined[0x41] = true; // COINBASE
    defined[0x42] = true; // TIMESTAMP
    defined[0x43] = true; // NUMBER
    defined[0x44] = true; // DIFFICULTY
    defined[0x45] = true; // GASLIMIT
    defined[0x46] = true; // CHAINID
    defined[0x47] = true; // SELFBALANCE
    defined[0x48] = true; // BASEFEE
    defined[0x49] = true; // BLOBHASH
    defined[0x4a] = true; // BLOBBASEFEE

    // 0x50s: Stack, Memory, Storage and Flow Operations
    defined[0x50] = true; // POP
    defined[0x51] = true; // MLOAD
    defined[0x52] = true; // MSTORE
    defined[0x53] = true; // MSTORE8
    defined[0x54] = true; // SLOAD
    defined[0x55] = true; // SSTORE
    defined[0x56] = true; // JUMP
    defined[0x57] = true; // JUMPI
    defined[0x58] = true; // PC
    defined[0x59] = true; // MSIZE
    defined[0x5a] = true; // GAS
    defined[0x5b] = true; // JUMPDEST
    defined[0x5c] = true; // TLOAD
    defined[0x5d] = true; // TSTORE
    defined[0x5e] = true; // MCOPY
    defined[0x5f] = true; // PUSH0

    // 0x60-0x7f: PUSH1-PUSH32
    var i: u8 = 0;
    while (i < 32) : (i += 1) {
        defined[0x60 + i] = true;
    }

    // 0x80-0x8f: DUP1-DUP16
    i = 0;
    while (i < 16) : (i += 1) {
        defined[0x80 + i] = true;
    }

    // 0x90-0x9f: SWAP1-SWAP16
    i = 0;
    while (i < 16) : (i += 1) {
        defined[0x90 + i] = true;
    }

    // 0xa0-0xa4: LOG0-LOG4
    i = 0;
    while (i <= 4) : (i += 1) {
        defined[0xa0 + i] = true;
    }

    // 0xf0s: System operations
    defined[0xf0] = true; // CREATE
    defined[0xf1] = true; // CALL
    defined[0xf2] = true; // CALLCODE
    defined[0xf3] = true; // RETURN
    defined[0xf4] = true; // DELEGATECALL
    defined[0xf5] = true; // CREATE2
    defined[0xfa] = true; // STATICCALL
    defined[0xfd] = true; // REVERT
    defined[0xfe] = true; // INVALID
    defined[0xff] = true; // SELFDESTRUCT

    // Collect all undefined opcodes
    var j: u16 = 0;
    while (j < 256) : (j += 1) {
        if (!defined[j]) {
            undefined_list[count] = @intCast(j);
            count += 1;
        }
    }

    // Return slice of actual undefined opcodes
    break :blk undefined_list[0..count].*;
};

/// Static opcode information for all 256 opcodes
pub const OPCODE_INFO = blk: {
    var info: [256]OpcodeInfo = [_]OpcodeInfo{.{ .gas_cost = 0, .stack_inputs = 0, .stack_outputs = 0 }} ** 256;

    // 0x00s: Stop and Arithmetic Operations
    info[@intFromEnum(Opcode.STOP)] = .{ .gas_cost = 0, .stack_inputs = 0, .stack_outputs = 0 };
    info[@intFromEnum(Opcode.ADD)] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 };
    info[@intFromEnum(Opcode.MUL)] = .{ .gas_cost = GasConstants.GasFastStep, .stack_inputs = 2, .stack_outputs = 1 };
    info[@intFromEnum(Opcode.SUB)] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 };
    info[0x04] = .{ .gas_cost = GasConstants.GasFastStep, .stack_inputs = 2, .stack_outputs = 1 }; // DIV
    info[0x05] = .{ .gas_cost = GasConstants.GasFastStep, .stack_inputs = 2, .stack_outputs = 1 }; // SDIV
    info[0x06] = .{ .gas_cost = GasConstants.GasFastStep, .stack_inputs = 2, .stack_outputs = 1 }; // MOD
    info[0x07] = .{ .gas_cost = GasConstants.GasFastStep, .stack_inputs = 2, .stack_outputs = 1 }; // SMOD
    info[0x08] = .{ .gas_cost = GasConstants.GasMidStep, .stack_inputs = 3, .stack_outputs = 1 }; // ADDMOD
    info[0x09] = .{ .gas_cost = GasConstants.GasMidStep, .stack_inputs = 3, .stack_outputs = 1 }; // MULMOD
    info[0x0a] = .{ .gas_cost = 10, .stack_inputs = 2, .stack_outputs = 1 }; // EXP (dynamic, base cost)
    info[0x0b] = .{ .gas_cost = GasConstants.GasFastStep, .stack_inputs = 2, .stack_outputs = 1 }; // SIGNEXTEND

    // 0x10s: Comparison & Bitwise Logic Operations
    info[0x10] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // LT
    info[0x11] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // GT
    info[0x12] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // SLT
    info[0x13] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // SGT
    info[0x14] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // EQ
    info[0x15] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 1, .stack_outputs = 1 }; // ISZERO
    info[0x16] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // AND
    info[0x17] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // OR
    info[0x18] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // XOR
    info[0x19] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 1, .stack_outputs = 1 }; // NOT
    info[0x1a] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // BYTE
    info[0x1b] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // SHL
    info[0x1c] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // SHR
    info[0x1d] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 1 }; // SAR

    // 0x20s: Crypto
    info[0x20] = .{ .gas_cost = 30, .stack_inputs = 2, .stack_outputs = 1 }; // SHA3/KECCAK256 (dynamic, base cost)

    // 0x30s: Environmental Information
    info[0x30] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // ADDRESS
    info[0x31] = .{ .gas_cost = 100, .stack_inputs = 1, .stack_outputs = 1 }; // BALANCE (warm access)
    info[0x32] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // ORIGIN
    info[0x33] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // CALLER
    info[0x34] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // CALLVALUE
    info[0x35] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 1, .stack_outputs = 1 }; // CALLDATALOAD
    info[0x36] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // CALLDATASIZE
    info[0x37] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 3, .stack_outputs = 0 }; // CALLDATACOPY (dynamic, base cost)
    info[0x38] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // CODESIZE
    info[0x39] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 3, .stack_outputs = 0 }; // CODECOPY (dynamic, base cost)
    info[0x3a] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // GASPRICE
    info[0x3b] = .{ .gas_cost = 100, .stack_inputs = 1, .stack_outputs = 1 }; // EXTCODESIZE (warm access)
    info[0x3c] = .{ .gas_cost = 100, .stack_inputs = 4, .stack_outputs = 0 }; // EXTCODECOPY (warm access, dynamic)
    info[0x3d] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // RETURNDATASIZE
    info[0x3e] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 3, .stack_outputs = 0 }; // RETURNDATACOPY (dynamic, base cost)
    info[0x3f] = .{ .gas_cost = 100, .stack_inputs = 1, .stack_outputs = 1 }; // EXTCODEHASH (warm access)

    // 0x40s: Block Information
    info[0x40] = .{ .gas_cost = 20, .stack_inputs = 1, .stack_outputs = 1 }; // BLOCKHASH
    info[0x41] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // COINBASE
    info[0x42] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // TIMESTAMP
    info[0x43] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // NUMBER
    info[0x44] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // DIFFICULTY/PREVRANDAO
    info[0x45] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // GASLIMIT
    info[0x46] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // CHAINID
    info[0x47] = .{ .gas_cost = GasConstants.GasFastStep, .stack_inputs = 0, .stack_outputs = 1 }; // SELFBALANCE
    info[0x48] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // BASEFEE
    info[0x49] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 1, .stack_outputs = 1 }; // BLOBHASH
    info[0x4a] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // BLOBBASEFEE

    // 0x50s: Stack, Memory, Storage and Flow Operations
    info[@intFromEnum(Opcode.POP)] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 1, .stack_outputs = 0 };
    info[0x51] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 1, .stack_outputs = 1 }; // MLOAD (dynamic)
    info[0x52] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 0 }; // MSTORE (dynamic)
    info[0x53] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 2, .stack_outputs = 0 }; // MSTORE8 (dynamic)
    info[0x54] = .{ .gas_cost = 100, .stack_inputs = 1, .stack_outputs = 1 }; // SLOAD (warm access)
    info[0x55] = .{ .gas_cost = 100, .stack_inputs = 2, .stack_outputs = 0 }; // SSTORE (warm access, dynamic)
    info[0x56] = .{ .gas_cost = GasConstants.GasMidStep, .stack_inputs = 1, .stack_outputs = 0 }; // JUMP
    info[0x57] = .{ .gas_cost = 10, .stack_inputs = 2, .stack_outputs = 0 }; // JUMPI
    info[0x58] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // PC
    info[0x59] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // MSIZE
    info[0x5a] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 }; // GAS
    info[0x5b] = .{ .gas_cost = 1, .stack_inputs = 0, .stack_outputs = 0 }; // JUMPDEST
    info[0x5c] = .{ .gas_cost = 100, .stack_inputs = 1, .stack_outputs = 1 }; // TLOAD (warm access)
    info[0x5d] = .{ .gas_cost = 100, .stack_inputs = 2, .stack_outputs = 0 }; // TSTORE (warm access)
    info[0x5e] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 3, .stack_outputs = 0 }; // MCOPY (dynamic, base cost)
    info[@intFromEnum(Opcode.PUSH0)] = .{ .gas_cost = GasConstants.GasQuickStep, .stack_inputs = 0, .stack_outputs = 1 };

    // 0x60-0x7f: PUSH1-PUSH32
    var i: u8 = 0;
    while (i < 32) : (i += 1) {
        info[0x60 + i] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 0, .stack_outputs = 1 };
    }

    // 0x80-0x8f: DUP1-DUP16
    i = 0;
    while (i < 16) : (i += 1) {
        info[0x80 + i] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 0, .stack_outputs = 1 };
    }

    // 0x90-0x9f: SWAP1-SWAP16
    i = 0;
    while (i < 16) : (i += 1) {
        info[0x90 + i] = .{ .gas_cost = GasConstants.GasFastestStep, .stack_inputs = 0, .stack_outputs = 0 };
    }

    // 0xa0-0xa4: LOG0-LOG4
    i = 0;
    while (i <= 4) : (i += 1) {
        info[0xa0 + i] = .{ .gas_cost = GasConstants.LogGas + i * GasConstants.LogTopicGas, .stack_inputs = @as(u8, 2 + i), .stack_outputs = 0 };
    }

    // 0xf0s: System operations
    info[0xf0] = .{ .gas_cost = 32000, .stack_inputs = 3, .stack_outputs = 1 }; // CREATE
    info[0xf1] = .{ .gas_cost = 100, .stack_inputs = 7, .stack_outputs = 1 }; // CALL (warm access, dynamic)
    info[0xf2] = .{ .gas_cost = 100, .stack_inputs = 7, .stack_outputs = 1 }; // CALLCODE (warm access, dynamic)
    info[0xf3] = .{ .gas_cost = 0, .stack_inputs = 2, .stack_outputs = 0 }; // RETURN (dynamic)
    info[0xf4] = .{ .gas_cost = 100, .stack_inputs = 6, .stack_outputs = 1 }; // DELEGATECALL (warm access, dynamic)
    info[0xf5] = .{ .gas_cost = 32000, .stack_inputs = 4, .stack_outputs = 1 }; // CREATE2
    info[0xfa] = .{ .gas_cost = 100, .stack_inputs = 6, .stack_outputs = 1 }; // STATICCALL (warm access, dynamic)
    info[0xfd] = .{ .gas_cost = 0, .stack_inputs = 2, .stack_outputs = 0 }; // REVERT (dynamic)
    info[0xfe] = .{ .gas_cost = 0, .stack_inputs = 0, .stack_outputs = 0 }; // INVALID
    info[0xff] = .{ .gas_cost = 5000, .stack_inputs = 1, .stack_outputs = 0 }; // SELFDESTRUCT (dynamic)

    break :blk info;
};

// Hardfork-specific opcode availability
pub const HARDFORK_OPCODES = struct {
    // EIP-3855: PUSH0 opcode (Shanghai)
    pub const SHANGHAI_OPCODES = [_]u8{0x5f};

    // EIP-3198: BASEFEE opcode (London)
    pub const LONDON_OPCODES = [_]u8{0x48};

    // EIP-1344: ChainID opcode (Istanbul)
    pub const ISTANBUL_OPCODES = [_]u8{ 0x46, 0x47 }; // CHAINID, SELFBALANCE

    // EIP-1014: Skinny CREATE2 (Constantinople)
    // EIP-145: Bitwise shifting instructions
    // EIP-1052: EXTCODEHASH
    pub const CONSTANTINOPLE_OPCODES = [_]u8{ 0xf5, 0x1b, 0x1c, 0x1d, 0x3f };

    // EIP-140: REVERT instruction
    // EIP-211: New opcodes RETURNDATASIZE and RETURNDATACOPY
    // EIP-214: New opcode STATICCALL
    pub const BYZANTIUM_OPCODES = [_]u8{ 0xfd, 0x3d, 0x3e, 0xfa };

    // EIP-2200: Structured Definitions for Net Gas Metering (Istanbul)
    // Changes SSTORE pricing

    // EIP-1153: Transient storage opcodes (Cancun)
    // EIP-4844: Shard Blob Transactions
    // EIP-5656: MCOPY - Memory copying instruction
    // EIP-7516: BLOBBASEFEE opcode
    pub const CANCUN_OPCODES = [_]u8{ 0x5c, 0x5d, 0x49, 0x5e, 0x4a };
};

// Helper functions for calculating min/max stack requirements
pub fn getMinStackRequired(opcode: u8) u16 {
    const info = OPCODE_INFO[opcode];

    // For DUP operations, need at least N items on stack
    if (opcode >= 0x80 and opcode <= 0x8f) {
        return (opcode - 0x80) + 1;
    }

    // For SWAP operations, need at least N+1 items on stack
    if (opcode >= 0x90 and opcode <= 0x9f) {
        return (opcode - 0x90) + 2;
    }

    // For all other operations, minimum is the number of inputs
    return info.stack_inputs;
}

pub fn getMaxStackAfter(opcode: u8) u16 {
    const info = OPCODE_INFO[opcode];

    // Operations that produce output need room on stack
    if (info.stack_outputs > 0) {
        return 1023; // Stack size - 1
    }

    return 1024; // Full stack size
}

/// Check if an opcode is undefined
pub fn isUndefined(opcode: u8) bool {
    for (UNDEFINED_OPCODES) |undefined_opcode| {
        if (undefined_opcode == opcode) {
            return true;
        }
    }
    return false;
}

test "opcode info array has correct size" {
    try std.testing.expectEqual(@as(usize, 256), OPCODE_INFO.len);
}

test "common opcodes have expected values" {
    // Test ADD
    const add_info = OPCODE_INFO[@intFromEnum(Opcode.ADD)];
    try std.testing.expectEqual(@as(u64, GasConstants.GasFastestStep), add_info.gas_cost);
    try std.testing.expectEqual(@as(u8, 2), add_info.stack_inputs);
    try std.testing.expectEqual(@as(u8, 1), add_info.stack_outputs);
    try std.testing.expectEqual(false, isUndefined(@intFromEnum(Opcode.ADD)));

    // Test PUSH1
    const push1_info = OPCODE_INFO[@intFromEnum(Opcode.PUSH1)];
    try std.testing.expectEqual(@as(u64, GasConstants.GasFastestStep), push1_info.gas_cost);
    try std.testing.expectEqual(@as(u8, 0), push1_info.stack_inputs);
    try std.testing.expectEqual(@as(u8, 1), push1_info.stack_outputs);
    try std.testing.expectEqual(false, isUndefined(@intFromEnum(Opcode.PUSH1)));

    // Test undefined opcode (0x0c should be undefined)
    try std.testing.expectEqual(true, isUndefined(0x0c));
}

test "min stack calculation" {
    // Test DUP5
    try std.testing.expectEqual(@as(u16, 5), getMinStackRequired(0x84));

    // Test SWAP3
    try std.testing.expectEqual(@as(u16, 4), getMinStackRequired(0x92));

    // Test ADD
    try std.testing.expectEqual(@as(u16, 2), getMinStackRequired(0x01));
}

test "undefined opcodes" {
    // Test that UNDEFINED_OPCODES contains expected undefined opcodes
    try std.testing.expect(isUndefined(0x0c)); // Between SIGNEXTEND and LT
    try std.testing.expect(isUndefined(0x0d));
    try std.testing.expect(isUndefined(0x0e));
    try std.testing.expect(isUndefined(0x0f));
    try std.testing.expect(isUndefined(0x1e)); // Between SAR and KECCAK256
    try std.testing.expect(isUndefined(0x1f));
    try std.testing.expect(isUndefined(0x21)); // After KECCAK256

    // Test that defined opcodes are not in undefined list
    try std.testing.expect(!isUndefined(@intFromEnum(Opcode.ADD)));
    try std.testing.expect(!isUndefined(@intFromEnum(Opcode.PUSH1)));
    try std.testing.expect(!isUndefined(@intFromEnum(Opcode.DUP1)));
    try std.testing.expect(!isUndefined(@intFromEnum(Opcode.SWAP1)));

    // Test that UNDEFINED_OPCODES has reasonable size (there should be many undefined opcodes)
    try std.testing.expect(UNDEFINED_OPCODES.len > 50);
    try std.testing.expect(UNDEFINED_OPCODES.len < 200);
}

test "opcode enum values" {
    // Test some key opcodes have correct hex values
    try std.testing.expectEqual(@as(u8, 0x00), @intFromEnum(Opcode.STOP));
    try std.testing.expectEqual(@as(u8, 0x01), @intFromEnum(Opcode.ADD));
    try std.testing.expectEqual(@as(u8, 0x20), @intFromEnum(Opcode.KECCAK256));
    try std.testing.expectEqual(@as(u8, 0x60), @intFromEnum(Opcode.PUSH1));
    try std.testing.expectEqual(@as(u8, 0x7f), @intFromEnum(Opcode.PUSH32));
    try std.testing.expectEqual(@as(u8, 0x80), @intFromEnum(Opcode.DUP1));
    try std.testing.expectEqual(@as(u8, 0x8f), @intFromEnum(Opcode.DUP16));
    try std.testing.expectEqual(@as(u8, 0x90), @intFromEnum(Opcode.SWAP1));
    try std.testing.expectEqual(@as(u8, 0x9f), @intFromEnum(Opcode.SWAP16));
    try std.testing.expectEqual(@as(u8, 0xff), @intFromEnum(Opcode.SELFDESTRUCT));
}
