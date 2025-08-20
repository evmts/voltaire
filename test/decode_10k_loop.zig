const std = @import("std");

test "decode 10k hashes loop" {
    // The main loop part of the runtime code
    const loop_hex = "5f5b614e20811015605e5760408051602081018390520160408051601f19818403019052526001016034565b5056fe";
    
    std.debug.print("\n=== Decoding 10k hashes loop ===\n", .{});
    
    // Convert hex to bytes for analysis
    var loop_bytes: [100]u8 = undefined;
    _ = try std.fmt.hexToBytes(&loop_bytes, loop_hex);
    const code = loop_bytes[0..loop_hex.len / 2];
    
    std.debug.print("Loop bytecode ({} bytes):\n", .{code.len});
    
    var pc: usize = 0;
    while (pc < code.len) {
        const op = code[pc];
        std.debug.print("{x:0>4}: ", .{pc});
        
        switch (op) {
            0x5f => {
                std.debug.print("PUSH0\n", .{});
                pc += 1;
            },
            0x5b => {
                std.debug.print("JUMPDEST (loop start)\n", .{});
                pc += 1;
            },
            0x61 => {
                const value = (@as(u16, code[pc + 1]) << 8) | code[pc + 2];
                std.debug.print("PUSH2 0x{x} ({})\n", .{value, value});
                pc += 3;
            },
            0x81 => {
                std.debug.print("DUP2\n", .{});
                pc += 1;
            },
            0x10 => {
                std.debug.print("LT\n", .{});
                pc += 1;
            },
            0x15 => {
                std.debug.print("ISZERO\n", .{});
                pc += 1;
            },
            0x60 => {
                std.debug.print("PUSH1 0x{x}\n", .{code[pc + 1]});
                pc += 2;
            },
            0x57 => {
                std.debug.print("JUMPI (conditional jump)\n", .{});
                pc += 1;
            },
            0x40 => {
                std.debug.print("BLOCKHASH\n", .{});
                pc += 1;
            },
            0x80 => {
                std.debug.print("DUP1\n", .{});
                pc += 1;
            },
            0x51 => {
                std.debug.print("MLOAD\n", .{});
                pc += 1;
            },
            0x52 => {
                std.debug.print("MSTORE\n", .{});
                pc += 1;
            },
            0x20 => {
                std.debug.print("KECCAK256\n", .{});
                pc += 1;
            },
            0x83 => {
                std.debug.print("DUP4\n", .{});
                pc += 1;
            },
            0x90 => {
                std.debug.print("SWAP1\n", .{});
                pc += 1;
            },
            0x01 => {
                std.debug.print("ADD\n", .{});
                pc += 1;
            },
            0x19 => {
                std.debug.print("NOT\n", .{});
                pc += 1;
            },
            0x84 => {
                std.debug.print("DUP5\n", .{});
                pc += 1;
            },
            0x03 => {
                std.debug.print("SUB\n", .{});
                pc += 1;
            },
            0x1f => {
                std.debug.print("SAR (shift arithmetic right)\n", .{});
                pc += 1;
            },
            0x56 => {
                std.debug.print("JUMP\n", .{});
                pc += 1;
            },
            0x5e => {
                std.debug.print("JUMPDEST (loop exit)\n", .{});
                pc += 1;
            },
            0x50 => {
                std.debug.print("POP\n", .{});
                pc += 1;
            },
            0xfe => {
                std.debug.print("INVALID\n", .{});
                pc += 1;
            },
            else => {
                std.debug.print("UNKNOWN OPCODE: 0x{x}\n", .{op});
                pc += 1;
            },
        }
    }
    
    std.debug.print("\n=== Analysis ===\n", .{});
    std.debug.print("Loop count: 0x4e20 = 20,000 (not 10,000!)\n", .{});
    std.debug.print("The loop body appears to be doing complex operations including KECCAK256\n", .{});
    std.debug.print("Each iteration should consume significant gas\n", .{});
}