const std = @import("std");

// Simple assembler to compile basic assembly code for tests
pub fn compileAssembly(allocator: std.mem.Allocator, asm_code: []const u8) ![]u8 {
    var code = asm_code;

    // Handle :asm prefix - simple assembly format
    if (std.mem.startsWith(u8, code, ":asm ")) {
        code = code[5..]; // Remove ":asm " prefix
        // :asm format is typically simple space-separated opcodes
        return compileSingleExpression(allocator, code);
    }

    // Handle :yul prefix - Yul assembly language
    // For now, we'll return an error since Yul is too complex to parse here
    // In the future, we could integrate a proper Yul compiler
    if (std.mem.startsWith(u8, code, ":yul ")) {
        // Yul has complex syntax with functions, if statements, etc.
        // Example: ":yul berlin { mstore8(0x1f, 0x42) calldatacopy(0x1f, 0, 0x0103) ... }"
        // This would require a full Yul parser/compiler
        return error.YulNotSupported;
    }

    // Handle { ... } format (may contain multiple expressions)
    if (std.mem.startsWith(u8, code, "{") and std.mem.endsWith(u8, code, "}")) {
        code = std.mem.trim(u8, code[1..code.len-1], " \t\n\r");

        // Process multiple parenthesized expressions
        var bytecode = std.ArrayList(u8){};
        defer bytecode.deinit(allocator);

        var pos: usize = 0;
        while (pos < code.len) {
            // Skip whitespace
            while (pos < code.len and std.ascii.isWhitespace(code[pos])) {
                pos += 1;
            }
            if (pos >= code.len) break;

            // Find next expression
            if (code[pos] == '(') {
                // Find matching closing paren
                var depth: usize = 1;
                var end = pos + 1;
                while (end < code.len and depth > 0) {
                    if (code[end] == '(') depth += 1;
                    if (code[end] == ')') depth -= 1;
                    end += 1;
                }

                // Compile this expression
                const expr = code[pos+1..end-1];
                const expr_bytecode = try compileSingleExpression(allocator, expr);
                defer allocator.free(expr_bytecode);
                try bytecode.appendSlice(allocator, expr_bytecode);

                pos = end;
            } else {
                return error.InvalidFormat;
            }
        }

        return bytecode.toOwnedSlice(allocator);
    }

    // Remove (asm ... ) wrapper if present
    if (std.mem.startsWith(u8, code, "(asm ")) {
        code = code[5..];
        if (std.mem.endsWith(u8, code, ")")) {
            code = code[0..code.len - 1];
        }
    }

    return compileSingleExpression(allocator, code);
}

// Compile a single expression (no wrapper)
fn compileSingleExpression(allocator: std.mem.Allocator, code: []const u8) ![]u8 {
    // Tokenize the assembly code
    var tokens = std.ArrayList([]const u8){};
    defer tokens.deinit(allocator);

    var it = std.mem.tokenizeAny(u8, code, " \t\n\r()");
    while (it.next()) |token| {
        try tokens.append(allocator, token);
    }

    // Compile tokens to bytecode
    var bytecode = std.ArrayList(u8){};
    defer bytecode.deinit(allocator);

    var i: usize = 0;
    while (i < tokens.items.len) : (i += 1) {
        const token = tokens.items[i];

        // Check for PUSH opcodes that need immediate values
        if (std.mem.startsWith(u8, token, "PUSH")) {
            const opcode = try getOpcode(token);
            try bytecode.append(allocator, opcode);

            // If it's a PUSH opcode (not PUSH0), get the immediate value
            if (opcode >= 0x60 and opcode <= 0x7f and i + 1 < tokens.items.len) {
                const push_size = opcode - 0x5f;
                i += 1;
                const value_token = tokens.items[i];
                const value = try parseNumber(value_token);

                // Write the value bytes in big-endian order
                var bytes_written: u8 = 0;
                while (bytes_written < push_size) : (bytes_written += 1) {
                    const shift: u8 = @intCast((push_size - 1 - bytes_written) * 8);
                    try bytecode.append(allocator, @intCast((value >> shift) & 0xFF));
                }
            }
        } else if (isNumber(token)) {
            // It's a standalone number (auto-select PUSH size)
            const value = try parseNumber(token);
            if (value <= 0xFF) {
                try bytecode.append(allocator, 0x60); // PUSH1
                try bytecode.append(allocator, @intCast(value));
            } else if (value <= 0xFFFF) {
                try bytecode.append(allocator, 0x61); // PUSH2
                try bytecode.append(allocator, @intCast(value >> 8));
                try bytecode.append(allocator, @intCast(value & 0xFF));
            } else if (value <= 0xFFFFFF) {
                try bytecode.append(allocator, 0x62); // PUSH3
                try bytecode.append(allocator, @intCast(value >> 16));
                try bytecode.append(allocator, @intCast((value >> 8) & 0xFF));
                try bytecode.append(allocator, @intCast(value & 0xFF));
            } else if (value <= 0xFFFFFFFF) {
                try bytecode.append(allocator, 0x63); // PUSH4
                try bytecode.append(allocator, @intCast(value >> 24));
                try bytecode.append(allocator, @intCast((value >> 16) & 0xFF));
                try bytecode.append(allocator, @intCast((value >> 8) & 0xFF));
                try bytecode.append(allocator, @intCast(value & 0xFF));
            } else {
                // For larger values, use PUSH32
                try bytecode.append(allocator, 0x7f); // PUSH32
                var j: u8 = 31;
                while (true) : (j -= 1) {
                    try bytecode.append(allocator, @intCast((value >> @intCast(j * 8)) & 0xFF));
                    if (j == 0) break;
                }
            }
        } else {
            // It's a regular opcode
            const opcode = try getOpcode(token);
            try bytecode.append(allocator, opcode);
        }
    }

    return bytecode.toOwnedSlice(allocator);
}

fn isNumber(token: []const u8) bool {
    if (token.len == 0) return false;

    // Check for hex prefix
    if (std.mem.startsWith(u8, token, "0x") or std.mem.startsWith(u8, token, "0X")) {
        if (token.len <= 2) return false;
        for (token[2..]) |c| {
            if (!std.ascii.isHex(c)) return false;
        }
        return true;
    }

    // Check decimal
    for (token) |c| {
        if (!std.ascii.isDigit(c)) return false;
    }
    return true;
}

fn parseNumber(token: []const u8) !u256 {
    if (std.mem.startsWith(u8, token, "0x") or std.mem.startsWith(u8, token, "0X")) {
        return try std.fmt.parseInt(u256, token[2..], 16);
    }
    return try std.fmt.parseInt(u256, token, 10);
}

fn getOpcode(name: []const u8) !u8 {
    // Stack operations
    if (std.mem.eql(u8, name, "STOP")) return 0x00;
    if (std.mem.eql(u8, name, "ADD")) return 0x01;
    if (std.mem.eql(u8, name, "MUL")) return 0x02;
    if (std.mem.eql(u8, name, "SUB")) return 0x03;
    if (std.mem.eql(u8, name, "DIV")) return 0x04;
    if (std.mem.eql(u8, name, "SDIV")) return 0x05;
    if (std.mem.eql(u8, name, "MOD")) return 0x06;
    if (std.mem.eql(u8, name, "SMOD")) return 0x07;
    if (std.mem.eql(u8, name, "ADDMOD")) return 0x08;
    if (std.mem.eql(u8, name, "MULMOD")) return 0x09;
    if (std.mem.eql(u8, name, "EXP")) return 0x0a;
    if (std.mem.eql(u8, name, "SIGNEXTEND")) return 0x0b;

    // Comparison
    if (std.mem.eql(u8, name, "LT")) return 0x10;
    if (std.mem.eql(u8, name, "GT")) return 0x11;
    if (std.mem.eql(u8, name, "SLT")) return 0x12;
    if (std.mem.eql(u8, name, "SGT")) return 0x13;
    if (std.mem.eql(u8, name, "EQ")) return 0x14;
    if (std.mem.eql(u8, name, "ISZERO")) return 0x15;

    // Bitwise
    if (std.mem.eql(u8, name, "AND")) return 0x16;
    if (std.mem.eql(u8, name, "OR")) return 0x17;
    if (std.mem.eql(u8, name, "XOR")) return 0x18;
    if (std.mem.eql(u8, name, "NOT")) return 0x19;
    if (std.mem.eql(u8, name, "BYTE")) return 0x1a;
    if (std.mem.eql(u8, name, "SHL")) return 0x1b;
    if (std.mem.eql(u8, name, "SHR")) return 0x1c;
    if (std.mem.eql(u8, name, "SAR")) return 0x1d;

    // SHA3
    if (std.mem.eql(u8, name, "SHA3") or std.mem.eql(u8, name, "KECCAK256")) return 0x20;

    // Environment
    if (std.mem.eql(u8, name, "ADDRESS")) return 0x30;
    if (std.mem.eql(u8, name, "BALANCE")) return 0x31;
    if (std.mem.eql(u8, name, "ORIGIN")) return 0x32;
    if (std.mem.eql(u8, name, "CALLER")) return 0x33;
    if (std.mem.eql(u8, name, "CALLVALUE")) return 0x34;
    if (std.mem.eql(u8, name, "CALLDATALOAD")) return 0x35;
    if (std.mem.eql(u8, name, "CALLDATASIZE")) return 0x36;
    if (std.mem.eql(u8, name, "CALLDATACOPY")) return 0x37;
    if (std.mem.eql(u8, name, "CODESIZE")) return 0x38;
    if (std.mem.eql(u8, name, "CODECOPY")) return 0x39;
    if (std.mem.eql(u8, name, "GASPRICE")) return 0x3a;
    if (std.mem.eql(u8, name, "EXTCODESIZE")) return 0x3b;
    if (std.mem.eql(u8, name, "EXTCODECOPY")) return 0x3c;
    if (std.mem.eql(u8, name, "RETURNDATASIZE")) return 0x3d;
    if (std.mem.eql(u8, name, "RETURNDATACOPY")) return 0x3e;
    if (std.mem.eql(u8, name, "EXTCODEHASH")) return 0x3f;

    // Block
    if (std.mem.eql(u8, name, "BLOCKHASH")) return 0x40;
    if (std.mem.eql(u8, name, "COINBASE")) return 0x41;
    if (std.mem.eql(u8, name, "TIMESTAMP")) return 0x42;
    if (std.mem.eql(u8, name, "NUMBER")) return 0x43;
    if (std.mem.eql(u8, name, "DIFFICULTY") or std.mem.eql(u8, name, "PREVRANDAO")) return 0x44;
    if (std.mem.eql(u8, name, "GASLIMIT")) return 0x45;
    if (std.mem.eql(u8, name, "CHAINID")) return 0x46;
    if (std.mem.eql(u8, name, "SELFBALANCE")) return 0x47;
    if (std.mem.eql(u8, name, "BASEFEE")) return 0x48;

    // Memory
    if (std.mem.eql(u8, name, "POP")) return 0x50;
    if (std.mem.eql(u8, name, "MLOAD")) return 0x51;
    if (std.mem.eql(u8, name, "MSTORE")) return 0x52;
    if (std.mem.eql(u8, name, "MSTORE8")) return 0x53;
    if (std.mem.eql(u8, name, "SLOAD")) return 0x54;
    if (std.mem.eql(u8, name, "SSTORE")) return 0x55;
    if (std.mem.eql(u8, name, "JUMP")) return 0x56;
    if (std.mem.eql(u8, name, "JUMPI")) return 0x57;
    if (std.mem.eql(u8, name, "PC")) return 0x58;
    if (std.mem.eql(u8, name, "MSIZE")) return 0x59;
    if (std.mem.eql(u8, name, "GAS")) return 0x5a;
    if (std.mem.eql(u8, name, "JUMPDEST")) return 0x5b;

    // Push operations
    if (std.mem.eql(u8, name, "PUSH0")) return 0x5f;
    if (std.mem.eql(u8, name, "PUSH1")) return 0x60;
    if (std.mem.eql(u8, name, "PUSH2")) return 0x61;
    if (std.mem.eql(u8, name, "PUSH3")) return 0x62;
    if (std.mem.eql(u8, name, "PUSH4")) return 0x63;
    if (std.mem.eql(u8, name, "PUSH5")) return 0x64;
    if (std.mem.eql(u8, name, "PUSH32")) return 0x7f;

    // Dup operations
    if (std.mem.eql(u8, name, "DUP1")) return 0x80;
    if (std.mem.eql(u8, name, "DUP2")) return 0x81;
    if (std.mem.eql(u8, name, "DUP3")) return 0x82;
    if (std.mem.eql(u8, name, "DUP4")) return 0x83;
    if (std.mem.eql(u8, name, "DUP5")) return 0x84;
    if (std.mem.eql(u8, name, "DUP6")) return 0x85;
    if (std.mem.eql(u8, name, "DUP7")) return 0x86;
    if (std.mem.eql(u8, name, "DUP8")) return 0x87;
    if (std.mem.eql(u8, name, "DUP9")) return 0x88;
    if (std.mem.eql(u8, name, "DUP10")) return 0x89;
    if (std.mem.eql(u8, name, "DUP11")) return 0x8a;
    if (std.mem.eql(u8, name, "DUP12")) return 0x8b;
    if (std.mem.eql(u8, name, "DUP13")) return 0x8c;
    if (std.mem.eql(u8, name, "DUP14")) return 0x8d;
    if (std.mem.eql(u8, name, "DUP15")) return 0x8e;
    if (std.mem.eql(u8, name, "DUP16")) return 0x8f;

    // Swap operations
    if (std.mem.eql(u8, name, "SWAP1")) return 0x90;
    if (std.mem.eql(u8, name, "SWAP2")) return 0x91;
    if (std.mem.eql(u8, name, "SWAP3")) return 0x92;
    if (std.mem.eql(u8, name, "SWAP4")) return 0x93;
    if (std.mem.eql(u8, name, "SWAP5")) return 0x94;
    if (std.mem.eql(u8, name, "SWAP6")) return 0x95;
    if (std.mem.eql(u8, name, "SWAP7")) return 0x96;
    if (std.mem.eql(u8, name, "SWAP8")) return 0x97;
    if (std.mem.eql(u8, name, "SWAP9")) return 0x98;
    if (std.mem.eql(u8, name, "SWAP10")) return 0x99;
    if (std.mem.eql(u8, name, "SWAP11")) return 0x9a;
    if (std.mem.eql(u8, name, "SWAP12")) return 0x9b;
    if (std.mem.eql(u8, name, "SWAP13")) return 0x9c;
    if (std.mem.eql(u8, name, "SWAP14")) return 0x9d;
    if (std.mem.eql(u8, name, "SWAP15")) return 0x9e;
    if (std.mem.eql(u8, name, "SWAP16")) return 0x9f;

    // Log operations
    if (std.mem.eql(u8, name, "LOG0")) return 0xa0;
    if (std.mem.eql(u8, name, "LOG1")) return 0xa1;
    if (std.mem.eql(u8, name, "LOG2")) return 0xa2;
    if (std.mem.eql(u8, name, "LOG3")) return 0xa3;
    if (std.mem.eql(u8, name, "LOG4")) return 0xa4;

    // System operations
    if (std.mem.eql(u8, name, "CREATE")) return 0xf0;
    if (std.mem.eql(u8, name, "CALL")) return 0xf1;
    if (std.mem.eql(u8, name, "CALLCODE")) return 0xf2;
    if (std.mem.eql(u8, name, "RETURN")) return 0xf3;
    if (std.mem.eql(u8, name, "DELEGATECALL")) return 0xf4;
    if (std.mem.eql(u8, name, "CREATE2")) return 0xf5;
    if (std.mem.eql(u8, name, "STATICCALL")) return 0xfa;
    if (std.mem.eql(u8, name, "REVERT")) return 0xfd;
    if (std.mem.eql(u8, name, "INVALID")) return 0xfe;
    if (std.mem.eql(u8, name, "SELFDESTRUCT")) return 0xff;

    return error.UnknownOpcode;
}

test "compile simple assembly" {
    const allocator = std.testing.allocator;

    // Test SLOAD gas cost assembly
    const asm1 = "(asm GAS DUP1 SLOAD GAS SWAP1 POP SWAP1 SUB 5 SWAP1 SUB 0x01 SSTORE)";
    const bytecode1 = try compileAssembly(allocator, asm1);
    defer allocator.free(bytecode1);

    // Expected: GAS(5a) DUP1(80) SLOAD(54) GAS(5a) SWAP1(90) POP(50) SWAP1(90) SUB(03) PUSH1(60) 05 SWAP1(90) SUB(03) PUSH1(60) 01 SSTORE(55)
    const expected1 = [_]u8{ 0x5a, 0x80, 0x54, 0x5a, 0x90, 0x50, 0x90, 0x03, 0x60, 0x05, 0x90, 0x03, 0x60, 0x01, 0x55 };
    try std.testing.expectEqualSlices(u8, &expected1, bytecode1);

    // Test SELFBALANCE gas cost assembly
    const asm2 = "(asm GAS SELFBALANCE GAS SWAP1 POP SWAP1 SUB 2 SWAP1 SUB 0x01 SSTORE)";
    const bytecode2 = try compileAssembly(allocator, asm2);
    defer allocator.free(bytecode2);

    // Expected: GAS(5a) SELFBALANCE(47) GAS(5a) SWAP1(90) POP(50) SWAP1(90) SUB(03) PUSH1(60) 02 SWAP1(90) SUB(03) PUSH1(60) 01 SSTORE(55)
    const expected2 = [_]u8{ 0x5a, 0x47, 0x5a, 0x90, 0x50, 0x90, 0x03, 0x60, 0x02, 0x90, 0x03, 0x60, 0x01, 0x55 };
    try std.testing.expectEqualSlices(u8, &expected2, bytecode2);
}

test "compile { } format assembly" {
    const allocator = std.testing.allocator;

    // Test simple { } format
    const asm1 = "{ (PUSH1 0x01) (PUSH1 0x02) (ADD) }";
    const bytecode1 = try compileAssembly(allocator, asm1);
    defer allocator.free(bytecode1);

    // Expected: PUSH1 0x01=0x60 0x01, PUSH1 0x02=0x60 0x02, ADD=0x01
    const expected1 = [_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01 };
    try std.testing.expectEqualSlices(u8, &expected1, bytecode1);
}