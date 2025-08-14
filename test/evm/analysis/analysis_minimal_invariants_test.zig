const std = @import("std");
const OpcodeMetadata = @import("evm/opcode_metadata/opcode_metadata.zig");
const analysis_mod = @import("evm/analysis.zig");
const CodeAnalysis = analysis_mod.CodeAnalysis;

test "analysis: fused PUSH+JUMP removes PUSH and leaves no trailing .word before jump" {
    const allocator = std.testing.allocator;
    // 0: 60 03 (PUSH1 3)
    // 2: 56    (JUMP)
    // 3: 5b    (JUMPDEST)
    // 4: 00    (STOP)
    const code = &[_]u8{ 0x60, 0x03, 0x56, 0x5b, 0x00 };
    var analysis = try CodeAnalysis.from_code(allocator, code, &OpcodeMetadata.DEFAULT);
    defer analysis.deinit();

    // Ensure there is no instruction with .word immediately before the jump representation
    var found_word_before_jump = false;
    for (analysis.instructions, 0..) |inst, idx| {
        switch (inst.arg) {
            .jump, .jump_unresolved, .jump_pc => {
                if (idx > 0 and analysis.instructions[idx - 1].arg == .word) {
                    found_word_before_jump = true;
                }
            },
            else => {},
        }
    }
    try std.testing.expect(!found_word_before_jump);
}


