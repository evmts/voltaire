const std = @import("std");
const DynamicBitSet = std.DynamicBitSet;
const Instruction = @import("instruction.zig").Instruction;
const limits = @import("constants/code_analysis_limits.zig");

/// Resolve jump targets in the instruction stream.
/// This creates direct pointers from JUMP/JUMPI instructions to their target BEGINBLOCK.
/// Uses the pre-built PC to instruction mapping to correctly handle injected BEGINBLOCK instructions.
pub fn resolveJumpTargets(code: []const u8, instructions: []Instruction, jumpdest_bitmap: *const DynamicBitSet, pc_to_instruction: []const u16) !void {
    // Find the BEGINBLOCK instruction that starts the block containing each JUMPDEST
    // We need to map from PC -> BEGINBLOCK instruction index
    var pc_to_block_start = [_]u16{std.math.maxInt(u16)} ** limits.MAX_CONTRACT_SIZE;

    // Walk through instructions to find BEGINBLOCKs and their corresponding PCs
    var current_block_start: ?u16 = null;
    for (instructions, 0..) |inst, idx| {
        if (inst.tag == .block_info) {
            // This is a BEGINBLOCK instruction
            current_block_start = @intCast(idx);
        }
    }

    // Now map each PC to its containing BEGINBLOCK by looking at pc_to_instruction
    for (pc_to_instruction, 0..) |inst_idx, pc| {
        if (inst_idx == std.math.maxInt(u16)) continue; // Skip unmapped PCs

        // Find the BEGINBLOCK for this instruction by searching backwards
        var search_idx = inst_idx;
        while (search_idx > 0) : (search_idx -= 1) {
            if (instructions[search_idx].tag == .block_info) {
                pc_to_block_start[pc] = @intCast(search_idx);
                break;
            }
        }
    }

    // Now resolve JUMP and JUMPI targets (including fused immediate variants)
    for (instructions, 0..) |_, idx| {
        // Determine original bytecode opcode for this instruction index
        var original_pc: ?usize = null;
        for (pc_to_instruction, 0..) |mapped_idx, pc| {
            if (mapped_idx == idx) {
                original_pc = pc;
                break;
            }
        }

        if (original_pc) |pc| {
            const opcode_byte = code[pc];
            if (opcode_byte == 0x56 or opcode_byte == 0x57) { // JUMP or JUMPI
                const target_pc_opt: ?u256 = null;
                // Only resolve from preceding PUSH if present in header form
                if (idx > 0 and instructions[idx - 1].tag == .word) {
                    const wr = instructions[idx - 1];
                    _ = wr; // header only; resolution is handled earlier in SoA path
                }

                if (target_pc_opt) |target_pc| {
                    if (target_pc < code.len and jumpdest_bitmap.isSet(@intCast(target_pc))) {
                        const block_idx = pc_to_block_start[@intCast(target_pc)];
                        if (block_idx != std.math.maxInt(u16) and block_idx < instructions.len) {
                            // no in-place modification in SoA version
                        }
                    }
                }
            }
        }
    }
}