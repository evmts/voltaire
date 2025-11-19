/// EVM opcodes enumeration with comprehensive utilities
const std = @import("std");

/// Instruction represents a parsed opcode with its position and immediate data
pub const Instruction = struct {
    offset: usize,
    opcode: Opcode,
    immediate: ?[]const u8 = null,
};

/// EVM opcodes enumeration
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
    // 0x80s: DUP1-DUP16
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
    // 0x90s: SWAP1-SWAP16
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
    // 0xa0s: LOG0-LOG4
    LOG0 = 0xa0,
    LOG1 = 0xa1,
    LOG2 = 0xa2,
    LOG3 = 0xa3,
    LOG4 = 0xa4,
    // 0xf0s: System Operations
    CREATE = 0xf0,
    CALL = 0xf1,
    CALLCODE = 0xf2,
    RETURN = 0xf3,
    DELEGATECALL = 0xf4,
    CREATE2 = 0xf5,
    AUTH = 0xf6, // EIP-3074
    AUTHCALL = 0xf7, // EIP-3074
    STATICCALL = 0xfa,
    REVERT = 0xfd,
    INVALID = 0xfe,
    SELFDESTRUCT = 0xff,

    /// Check if opcode is a PUSH operation
    pub fn isPush(self: Opcode) bool {
        const value = @intFromEnum(self);
        return value >= 0x5f and value <= 0x7f; // PUSH0 through PUSH32
    }

    /// Get the number of bytes pushed for PUSH operations (0-32)
    pub fn pushSize(self: Opcode) u8 {
        if (!self.isPush()) return 0;

        const value = @intFromEnum(self);
        if (value == 0x5f) return 0; // PUSH0
        return value - 0x5f; // PUSH1=1, PUSH2=2, ..., PUSH32=32
    }

    /// Check if opcode is a DUP operation
    pub fn isDup(self: Opcode) bool {
        const value = @intFromEnum(self);
        return value >= 0x80 and value <= 0x8f; // DUP1 through DUP16
    }

    /// Get the DUP position (1-16)
    pub fn dupPosition(self: Opcode) u8 {
        if (!self.isDup()) return 0;
        const value = @intFromEnum(self);
        return value - 0x7f; // DUP1=1, DUP2=2, ..., DUP16=16
    }

    /// Check if opcode is a SWAP operation
    pub fn isSwap(self: Opcode) bool {
        const value = @intFromEnum(self);
        return value >= 0x90 and value <= 0x9f; // SWAP1 through SWAP16
    }

    /// Get the SWAP position (1-16)
    pub fn swapPosition(self: Opcode) u8 {
        if (!self.isSwap()) return 0;
        const value = @intFromEnum(self);
        return value - 0x8f; // SWAP1=1, SWAP2=2, ..., SWAP16=16
    }

    /// Check if opcode is a LOG operation
    pub fn isLog(self: Opcode) bool {
        const value = @intFromEnum(self);
        return value >= 0xa0 and value <= 0xa4; // LOG0 through LOG4
    }

    /// Get the number of topics for LOG operations (0-4)
    pub fn logTopics(self: Opcode) u8 {
        if (!self.isLog()) return 0;
        const value = @intFromEnum(self);
        return value - 0xa0; // LOG0=0, LOG1=1, ..., LOG4=4
    }

    /// Check if opcode terminates execution
    pub fn isTerminating(self: Opcode) bool {
        return switch (self) {
            .STOP, .RETURN, .REVERT, .INVALID, .SELFDESTRUCT => true,
            else => false,
        };
    }

    /// Check if opcode can modify state
    pub fn isStateModifying(self: Opcode) bool {
        return switch (self) {
            .SSTORE, .TSTORE, .LOG0, .LOG1, .LOG2, .LOG3, .LOG4, .CREATE, .CREATE2, .CALL, .CALLCODE, .DELEGATECALL, .AUTHCALL, .SELFDESTRUCT => true,
            else => false,
        };
    }

    /// Check if opcode is arithmetic
    pub fn isArithmetic(self: Opcode) bool {
        return switch (self) {
            .ADD, .MUL, .SUB, .DIV, .SDIV, .MOD, .SMOD, .ADDMOD, .MULMOD, .EXP, .SIGNEXTEND => true,
            else => false,
        };
    }

    /// Check if opcode is comparison
    pub fn isComparison(self: Opcode) bool {
        return switch (self) {
            .LT, .GT, .SLT, .SGT, .EQ, .ISZERO => true,
            else => false,
        };
    }

    /// Check if opcode is bitwise
    pub fn isBitwise(self: Opcode) bool {
        return switch (self) {
            .AND, .OR, .XOR, .NOT, .BYTE, .SHL, .SHR, .SAR => true,
            else => false,
        };
    }

    /// Check if byte is a valid opcode
    pub fn isValid(byte: u8) bool {
        return switch (byte) {
            // 0x00s: Stop and Arithmetic Operations
            0x00...0x0b => true,
            // 0x10s: Comparison & Bitwise Logic Operations
            0x10...0x1d => true,
            // 0x20s: Crypto
            0x20 => true,
            // 0x30s: Environmental Information
            0x30...0x3f => true,
            // 0x40s: Block Information
            0x40...0x4a => true,
            // 0x50s: Stack, Memory, Storage and Flow Operations
            0x50...0x5f => true,
            // 0x60-0x7f: PUSH1-PUSH32
            0x60...0x7f => true,
            // 0x80-0x8f: DUP1-DUP16
            0x80...0x8f => true,
            // 0x90-0x9f: SWAP1-SWAP16
            0x90...0x9f => true,
            // 0xa0-0xa4: LOG0-LOG4
            0xa0...0xa4 => true,
            // 0xf0s: System Operations
            0xf0...0xf7, 0xfa, 0xfd, 0xfe, 0xff => true,
            else => false,
        };
    }

    /// Check if opcode is a JUMP or JUMPI operation
    pub fn isJump(self: Opcode) bool {
        return self == .JUMP or self == .JUMPI;
    }

    /// Check if opcode is a JUMPDEST operation
    pub fn isJumpDestination(self: Opcode) bool {
        return self == .JUMPDEST;
    }

    /// Get the PUSH opcode for a given byte count (0-32)
    pub fn pushOpcode(bytes: u8) !Opcode {
        if (bytes > 32) return error.InvalidPushSize;
        if (bytes == 0) return .PUSH0;
        return @enumFromInt(0x5f + bytes);
    }

    /// Get opcode name as string
    pub fn name(self: Opcode) []const u8 {
        return switch (self) {
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
            .DIFFICULTY => "DIFFICULTY",
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
        };
    }
};

test "opcode enum values" {
    try std.testing.expectEqual(@as(u8, 0x00), @intFromEnum(Opcode.STOP));
    try std.testing.expectEqual(@as(u8, 0x01), @intFromEnum(Opcode.ADD));
    try std.testing.expectEqual(@as(u8, 0x5f), @intFromEnum(Opcode.PUSH0));
    try std.testing.expectEqual(@as(u8, 0x60), @intFromEnum(Opcode.PUSH1));
    try std.testing.expectEqual(@as(u8, 0x7f), @intFromEnum(Opcode.PUSH32));
    try std.testing.expectEqual(@as(u8, 0xff), @intFromEnum(Opcode.SELFDESTRUCT));
}

test "opcode push detection" {
    try std.testing.expect(Opcode.PUSH0.isPush());
    try std.testing.expect(Opcode.PUSH1.isPush());
    try std.testing.expect(Opcode.PUSH16.isPush());
    try std.testing.expect(Opcode.PUSH32.isPush());

    try std.testing.expect(!Opcode.ADD.isPush());
    try std.testing.expect(!Opcode.DUP1.isPush());
    try std.testing.expect(!Opcode.STOP.isPush());
}

test "opcode push size calculation" {
    try std.testing.expectEqual(@as(u8, 0), Opcode.PUSH0.pushSize());
    try std.testing.expectEqual(@as(u8, 1), Opcode.PUSH1.pushSize());
    try std.testing.expectEqual(@as(u8, 16), Opcode.PUSH16.pushSize());
    try std.testing.expectEqual(@as(u8, 32), Opcode.PUSH32.pushSize());

    try std.testing.expectEqual(@as(u8, 0), Opcode.ADD.pushSize());
    try std.testing.expectEqual(@as(u8, 0), Opcode.DUP1.pushSize());
}

test "opcode dup detection" {
    try std.testing.expect(Opcode.DUP1.isDup());
    try std.testing.expect(Opcode.DUP8.isDup());
    try std.testing.expect(Opcode.DUP16.isDup());

    try std.testing.expect(!Opcode.PUSH1.isDup());
    try std.testing.expect(!Opcode.SWAP1.isDup());
    try std.testing.expect(!Opcode.ADD.isDup());
}

test "opcode dup position calculation" {
    try std.testing.expectEqual(@as(u8, 1), Opcode.DUP1.dupPosition());
    try std.testing.expectEqual(@as(u8, 8), Opcode.DUP8.dupPosition());
    try std.testing.expectEqual(@as(u8, 16), Opcode.DUP16.dupPosition());

    try std.testing.expectEqual(@as(u8, 0), Opcode.PUSH1.dupPosition());
    try std.testing.expectEqual(@as(u8, 0), Opcode.ADD.dupPosition());
}

test "opcode swap detection" {
    try std.testing.expect(Opcode.SWAP1.isSwap());
    try std.testing.expect(Opcode.SWAP8.isSwap());
    try std.testing.expect(Opcode.SWAP16.isSwap());

    try std.testing.expect(!Opcode.DUP1.isSwap());
    try std.testing.expect(!Opcode.PUSH1.isSwap());
    try std.testing.expect(!Opcode.ADD.isSwap());
}

test "opcode swap position calculation" {
    try std.testing.expectEqual(@as(u8, 1), Opcode.SWAP1.swapPosition());
    try std.testing.expectEqual(@as(u8, 8), Opcode.SWAP8.swapPosition());
    try std.testing.expectEqual(@as(u8, 16), Opcode.SWAP16.swapPosition());

    try std.testing.expectEqual(@as(u8, 0), Opcode.DUP1.swapPosition());
    try std.testing.expectEqual(@as(u8, 0), Opcode.ADD.swapPosition());
}

test "opcode log detection" {
    try std.testing.expect(Opcode.LOG0.isLog());
    try std.testing.expect(Opcode.LOG1.isLog());
    try std.testing.expect(Opcode.LOG4.isLog());

    try std.testing.expect(!Opcode.ADD.isLog());
    try std.testing.expect(!Opcode.SSTORE.isLog());
    try std.testing.expect(!Opcode.CALL.isLog());
}

test "opcode log topics calculation" {
    try std.testing.expectEqual(@as(u8, 0), Opcode.LOG0.logTopics());
    try std.testing.expectEqual(@as(u8, 1), Opcode.LOG1.logTopics());
    try std.testing.expectEqual(@as(u8, 4), Opcode.LOG4.logTopics());

    try std.testing.expectEqual(@as(u8, 0), Opcode.ADD.logTopics());
    try std.testing.expectEqual(@as(u8, 0), Opcode.SSTORE.logTopics());
}

test "opcode terminating detection" {
    try std.testing.expect(Opcode.STOP.isTerminating());
    try std.testing.expect(Opcode.RETURN.isTerminating());
    try std.testing.expect(Opcode.REVERT.isTerminating());
    try std.testing.expect(Opcode.INVALID.isTerminating());
    try std.testing.expect(Opcode.SELFDESTRUCT.isTerminating());

    try std.testing.expect(!Opcode.ADD.isTerminating());
    try std.testing.expect(!Opcode.JUMP.isTerminating());
    try std.testing.expect(!Opcode.CALL.isTerminating());
}

test "opcode state modifying detection" {
    try std.testing.expect(Opcode.SSTORE.isStateModifying());
    try std.testing.expect(Opcode.TSTORE.isStateModifying());
    try std.testing.expect(Opcode.LOG0.isStateModifying());
    try std.testing.expect(Opcode.LOG4.isStateModifying());
    try std.testing.expect(Opcode.CREATE.isStateModifying());
    try std.testing.expect(Opcode.CALL.isStateModifying());
    try std.testing.expect(Opcode.SELFDESTRUCT.isStateModifying());

    try std.testing.expect(!Opcode.ADD.isStateModifying());
    try std.testing.expect(!Opcode.SLOAD.isStateModifying());
    try std.testing.expect(!Opcode.STATICCALL.isStateModifying());
}

test "opcode arithmetic detection" {
    try std.testing.expect(Opcode.ADD.isArithmetic());
    try std.testing.expect(Opcode.MUL.isArithmetic());
    try std.testing.expect(Opcode.DIV.isArithmetic());
    try std.testing.expect(Opcode.MOD.isArithmetic());
    try std.testing.expect(Opcode.EXP.isArithmetic());
    try std.testing.expect(Opcode.SIGNEXTEND.isArithmetic());

    try std.testing.expect(!Opcode.LT.isArithmetic());
    try std.testing.expect(!Opcode.AND.isArithmetic());
    try std.testing.expect(!Opcode.PUSH1.isArithmetic());
}

test "opcode comparison detection" {
    try std.testing.expect(Opcode.LT.isComparison());
    try std.testing.expect(Opcode.GT.isComparison());
    try std.testing.expect(Opcode.EQ.isComparison());
    try std.testing.expect(Opcode.ISZERO.isComparison());

    try std.testing.expect(!Opcode.ADD.isComparison());
    try std.testing.expect(!Opcode.AND.isComparison());
    try std.testing.expect(!Opcode.PUSH1.isComparison());
}

test "opcode bitwise detection" {
    try std.testing.expect(Opcode.AND.isBitwise());
    try std.testing.expect(Opcode.OR.isBitwise());
    try std.testing.expect(Opcode.XOR.isBitwise());
    try std.testing.expect(Opcode.NOT.isBitwise());
    try std.testing.expect(Opcode.SHL.isBitwise());
    try std.testing.expect(Opcode.SHR.isBitwise());

    try std.testing.expect(!Opcode.ADD.isBitwise());
    try std.testing.expect(!Opcode.LT.isBitwise());
    try std.testing.expect(!Opcode.PUSH1.isBitwise());
}

test "opcode names" {
    try std.testing.expectEqualStrings("ADD", Opcode.ADD.name());
    try std.testing.expectEqualStrings("PUSH1", Opcode.PUSH1.name());
    try std.testing.expectEqualStrings("DUP1", Opcode.DUP1.name());
    try std.testing.expectEqualStrings("SWAP16", Opcode.SWAP16.name());
    try std.testing.expectEqualStrings("LOG4", Opcode.LOG4.name());
    try std.testing.expectEqualStrings("SELFDESTRUCT", Opcode.SELFDESTRUCT.name());
}

test "opcode isValid detection" {
    // Valid opcodes
    try std.testing.expect(Opcode.isValid(0x01)); // ADD
    try std.testing.expect(Opcode.isValid(0x60)); // PUSH1
    try std.testing.expect(Opcode.isValid(0xff)); // SELFDESTRUCT
    try std.testing.expect(Opcode.isValid(0x00)); // STOP
    try std.testing.expect(Opcode.isValid(0x5f)); // PUSH0
    try std.testing.expect(Opcode.isValid(0x80)); // DUP1
    try std.testing.expect(Opcode.isValid(0x90)); // SWAP1
    try std.testing.expect(Opcode.isValid(0xa0)); // LOG0

    // Invalid opcodes
    try std.testing.expect(!Opcode.isValid(0x0c));
    try std.testing.expect(!Opcode.isValid(0x0d));
    try std.testing.expect(!Opcode.isValid(0x21));
    try std.testing.expect(!Opcode.isValid(0xf8));
    try std.testing.expect(!Opcode.isValid(0xfb));
}

test "opcode isJump detection" {
    try std.testing.expect(Opcode.JUMP.isJump());
    try std.testing.expect(Opcode.JUMPI.isJump());

    try std.testing.expect(!Opcode.JUMPDEST.isJump());
    try std.testing.expect(!Opcode.ADD.isJump());
    try std.testing.expect(!Opcode.PUSH1.isJump());
}

test "opcode isJumpDestination detection" {
    try std.testing.expect(Opcode.JUMPDEST.isJumpDestination());

    try std.testing.expect(!Opcode.JUMP.isJumpDestination());
    try std.testing.expect(!Opcode.JUMPI.isJumpDestination());
    try std.testing.expect(!Opcode.ADD.isJumpDestination());
}

test "opcode pushOpcode function" {
    try std.testing.expectEqual(Opcode.PUSH0, try Opcode.pushOpcode(0));
    try std.testing.expectEqual(Opcode.PUSH1, try Opcode.pushOpcode(1));
    try std.testing.expectEqual(Opcode.PUSH2, try Opcode.pushOpcode(2));
    try std.testing.expectEqual(Opcode.PUSH16, try Opcode.pushOpcode(16));
    try std.testing.expectEqual(Opcode.PUSH32, try Opcode.pushOpcode(32));

    // Invalid sizes should error
    try std.testing.expectError(error.InvalidPushSize, Opcode.pushOpcode(33));
    try std.testing.expectError(error.InvalidPushSize, Opcode.pushOpcode(255));
}

/// Parse bytecode into instructions
/// Caller owns returned slice and must free it
pub fn parse(allocator: std.mem.Allocator, bytecode: []const u8) ![]Instruction {
    var instructions = std.ArrayList(Instruction){};
    defer instructions.deinit(allocator);

    var offset: usize = 0;
    while (offset < bytecode.len) {
        const byte = bytecode[offset];
        const opcode: Opcode = @enumFromInt(byte);
        const push_size = opcode.pushSize();

        if (push_size > 0) {
            const immediate_end = @min(offset + 1 + push_size, bytecode.len);
            const immediate = bytecode[offset + 1 .. immediate_end];
            try instructions.append(allocator, .{
                .offset = offset,
                .opcode = opcode,
                .immediate = immediate,
            });
            offset = immediate_end;
        } else {
            try instructions.append(allocator, .{
                .offset = offset,
                .opcode = opcode,
            });
            offset += 1;
        }
    }

    return instructions.toOwnedSlice(allocator);
}

/// Find all valid JUMPDEST locations
/// Caller owns returned slice and must free it
pub fn jumpDests(allocator: std.mem.Allocator, bytecode: []const u8) ![]usize {
    const instructions = try parse(allocator, bytecode);
    defer allocator.free(instructions);

    var dests = std.ArrayList(usize){};
    defer dests.deinit(allocator);

    for (instructions) |inst| {
        if (inst.opcode == .JUMPDEST) {
            try dests.append(allocator, inst.offset);
        }
    }

    return dests.toOwnedSlice(allocator);
}

/// Check if offset is a valid jump destination
pub fn isValidJumpDest(allocator: std.mem.Allocator, bytecode: []const u8, offset: usize) !bool {
    const dests = try jumpDests(allocator, bytecode);
    defer allocator.free(dests);

    for (dests) |dest| {
        if (dest == offset) return true;
    }
    return false;
}

/// Format instruction to human-readable string
/// Caller owns returned slice and must free it
pub fn formatInstruction(allocator: std.mem.Allocator, inst: Instruction) ![]u8 {
    const opcode_name = inst.opcode.name();

    if (inst.immediate) |imm| {
        // Calculate size needed: "0xXXXX: NAME 0xDATA"
        const offset_str_len = 6; // "0x0000"
        const hex_data_len = 2 + imm.len * 2; // "0x" + 2 chars per byte
        const total_len = offset_str_len + 2 + opcode_name.len + 1 + hex_data_len;

        var buf = try allocator.alloc(u8, total_len);
        errdefer allocator.free(buf);

        // Format offset
        _ = try std.fmt.bufPrint(buf[0..6], "0x{x:0>4}", .{inst.offset});
        buf[6] = ':';
        buf[7] = ' ';

        // Copy opcode name
        var pos: usize = 8;
        @memcpy(buf[pos .. pos + opcode_name.len], opcode_name);
        pos += opcode_name.len;

        buf[pos] = ' ';
        pos += 1;

        // Format immediate data as hex
        buf[pos] = '0';
        buf[pos + 1] = 'x';
        pos += 2;

        for (imm) |byte| {
            _ = try std.fmt.bufPrint(buf[pos .. pos + 2], "{x:0>2}", .{byte});
            pos += 2;
        }

        return buf;
    } else {
        // Calculate size needed: "0xXXXX: NAME"
        const offset_str_len = 6; // "0x0000"
        const total_len = offset_str_len + 2 + opcode_name.len;

        var buf = try allocator.alloc(u8, total_len);
        errdefer allocator.free(buf);

        // Format offset
        _ = try std.fmt.bufPrint(buf[0..6], "0x{x:0>4}", .{inst.offset});
        buf[6] = ':';
        buf[7] = ' ';

        // Copy opcode name
        @memcpy(buf[8 .. 8 + opcode_name.len], opcode_name);

        return buf;
    }
}

/// Disassemble bytecode to human-readable strings
/// Caller owns returned slice and inner strings, must free each string and the slice
pub fn disassemble(allocator: std.mem.Allocator, bytecode: []const u8) ![][]u8 {
    const instructions = try parse(allocator, bytecode);
    defer allocator.free(instructions);

    var asm_lines = try allocator.alloc([]u8, instructions.len);
    errdefer {
        for (asm_lines, 0..) |line, i| {
            if (i < instructions.len) allocator.free(line);
        }
        allocator.free(asm_lines);
    }

    for (instructions, 0..) |inst, i| {
        asm_lines[i] = try formatInstruction(allocator, inst);
    }

    return asm_lines;
}

test "parse simple bytecode" {
    const allocator = std.testing.allocator;

    // PUSH1 0x01, PUSH1 0x02, ADD
    const bytecode = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01 };
    const instructions = try parse(allocator, &bytecode);
    defer allocator.free(instructions);

    try std.testing.expectEqual(@as(usize, 3), instructions.len);

    try std.testing.expectEqual(Opcode.PUSH1, instructions[0].opcode);
    try std.testing.expectEqual(@as(usize, 0), instructions[0].offset);
    try std.testing.expect(instructions[0].immediate != null);
    try std.testing.expectEqualSlices(u8, &[_]u8{0x01}, instructions[0].immediate.?);

    try std.testing.expectEqual(Opcode.PUSH1, instructions[1].opcode);
    try std.testing.expectEqual(@as(usize, 2), instructions[1].offset);
    try std.testing.expectEqualSlices(u8, &[_]u8{0x02}, instructions[1].immediate.?);

    try std.testing.expectEqual(Opcode.ADD, instructions[2].opcode);
    try std.testing.expectEqual(@as(usize, 4), instructions[2].offset);
    try std.testing.expect(instructions[2].immediate == null);
}

test "parse PUSH0" {
    const allocator = std.testing.allocator;

    const bytecode = [_]u8{ 0x5f, 0x01 };
    const instructions = try parse(allocator, &bytecode);
    defer allocator.free(instructions);

    try std.testing.expectEqual(@as(usize, 2), instructions.len);
    try std.testing.expectEqual(Opcode.PUSH0, instructions[0].opcode);
    try std.testing.expect(instructions[0].immediate == null);
}

test "parse PUSH32" {
    const allocator = std.testing.allocator;

    var bytecode: [33]u8 = undefined;
    bytecode[0] = 0x7f; // PUSH32
    @memset(bytecode[1..], 0xff);

    const instructions = try parse(allocator, &bytecode);
    defer allocator.free(instructions);

    try std.testing.expectEqual(@as(usize, 1), instructions.len);
    try std.testing.expectEqual(Opcode.PUSH32, instructions[0].opcode);
    try std.testing.expect(instructions[0].immediate != null);
    try std.testing.expectEqual(@as(usize, 32), instructions[0].immediate.?.len);
}

test "parse truncated PUSH data" {
    const allocator = std.testing.allocator;

    const bytecode = [_]u8{0x60}; // PUSH1 without data
    const instructions = try parse(allocator, &bytecode);
    defer allocator.free(instructions);

    try std.testing.expectEqual(@as(usize, 1), instructions.len);
    try std.testing.expectEqual(Opcode.PUSH1, instructions[0].opcode);
    try std.testing.expect(instructions[0].immediate != null);
    try std.testing.expectEqual(@as(usize, 0), instructions[0].immediate.?.len);
}

test "parse empty bytecode" {
    const allocator = std.testing.allocator;

    const bytecode = [_]u8{};
    const instructions = try parse(allocator, &bytecode);
    defer allocator.free(instructions);

    try std.testing.expectEqual(@as(usize, 0), instructions.len);
}

test "jumpDests finds JUMPDEST opcodes" {
    const allocator = std.testing.allocator;

    const bytecode = [_]u8{ 0x5b, 0x60, 0x01, 0x5b };
    const dests = try jumpDests(allocator, &bytecode);
    defer allocator.free(dests);

    try std.testing.expectEqual(@as(usize, 2), dests.len);
    try std.testing.expectEqual(@as(usize, 0), dests[0]);
    try std.testing.expectEqual(@as(usize, 3), dests[1]);
}

test "jumpDests ignores JUMPDEST in immediate data" {
    const allocator = std.testing.allocator;

    const bytecode = [_]u8{ 0x60, 0x5b, 0x5b }; // PUSH1 0x5b, JUMPDEST
    const dests = try jumpDests(allocator, &bytecode);
    defer allocator.free(dests);

    try std.testing.expectEqual(@as(usize, 1), dests.len);
    try std.testing.expectEqual(@as(usize, 2), dests[0]);
}

test "jumpDests handles bytecode with no JUMPDESTs" {
    const allocator = std.testing.allocator;

    const bytecode = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01 };
    const dests = try jumpDests(allocator, &bytecode);
    defer allocator.free(dests);

    try std.testing.expectEqual(@as(usize, 0), dests.len);
}

test "isValidJumpDest validates JUMPDEST locations" {
    const allocator = std.testing.allocator;

    const bytecode = [_]u8{ 0x5b, 0x60, 0x01, 0x5b };

    try std.testing.expect(try isValidJumpDest(allocator, &bytecode, 0));
    try std.testing.expect(try isValidJumpDest(allocator, &bytecode, 3));
}

test "isValidJumpDest rejects non-JUMPDEST locations" {
    const allocator = std.testing.allocator;

    const bytecode = [_]u8{ 0x5b, 0x60, 0x01, 0x5b };

    try std.testing.expect(!try isValidJumpDest(allocator, &bytecode, 1));
    try std.testing.expect(!try isValidJumpDest(allocator, &bytecode, 2));
}

test "isValidJumpDest rejects JUMPDEST in immediate data" {
    const allocator = std.testing.allocator;

    const bytecode = [_]u8{ 0x60, 0x5b };
    try std.testing.expect(!try isValidJumpDest(allocator, &bytecode, 1));
}

test "formatInstruction formats simple opcodes" {
    const allocator = std.testing.allocator;

    const inst = Instruction{
        .offset = 0,
        .opcode = Opcode.ADD,
    };

    const formatted = try formatInstruction(allocator, inst);
    defer allocator.free(formatted);

    try std.testing.expectEqualStrings("0x0000: ADD", formatted);
}

test "formatInstruction formats PUSH with immediate data" {
    const allocator = std.testing.allocator;

    const immediate = [_]u8{0x42};
    const inst = Instruction{
        .offset = 10,
        .opcode = Opcode.PUSH1,
        .immediate = &immediate,
    };

    const formatted = try formatInstruction(allocator, inst);
    defer allocator.free(formatted);

    try std.testing.expectEqualStrings("0x000a: PUSH1 0x42", formatted);
}

test "disassemble bytecode to strings" {
    const allocator = std.testing.allocator;

    const bytecode = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01 };
    const asm_lines = try disassemble(allocator, &bytecode);
    defer {
        for (asm_lines) |line| allocator.free(line);
        allocator.free(asm_lines);
    }

    try std.testing.expectEqual(@as(usize, 3), asm_lines.len);
    try std.testing.expectEqualStrings("0x0000: PUSH1 0x01", asm_lines[0]);
    try std.testing.expectEqualStrings("0x0002: PUSH1 0x02", asm_lines[1]);
    try std.testing.expectEqualStrings("0x0004: ADD", asm_lines[2]);
}
