const std = @import("std");
const Tag = @import("instruction.zig").Tag;
const InstructionType = @import("instruction.zig").InstructionType;

// Aligned bucket element types for size-based instruction storage
pub const Bucket8 = extern struct { bytes: [8]u8 align(8) };
pub const Bucket16 = extern struct { bytes: [16]u8 align(8) };
pub const Bucket24 = extern struct { bytes: [24]u8 align(8) };

// Shared count types to keep struct identity stable
pub const Size8Counts = struct {
    noop: u24 = 0,
    jump_pc: u24 = 0,
    conditional_jump_unresolved: u24 = 0,
    conditional_jump_invalid: u24 = 0,
};
pub const Size16Counts = struct {
    exec: u24 = 0,
    conditional_jump_pc: u24 = 0,
    pc: u24 = 0,
    block_info: u24 = 0,
};
pub const Size24Counts = struct {
    word: u24 = 0,
    dynamic_gas: u24 = 0,
};

/// Generic function to get instruction parameters from size-based arrays
pub fn getInstructionParams(
    size8_instructions: []Bucket8,
    size16_instructions: []Bucket16,
    size24_instructions: []Bucket24,
    comptime tag: Tag,
    id: u24,
) InstructionType(tag) {
    const InstType = InstructionType(tag);
    const size = comptime @sizeOf(InstType);
    return switch (size) {
        8 => blk: {
            const base_ptr: *const u8 = &size8_instructions[id].bytes[0];
            break :blk (@as(*const InstType, @ptrCast(@alignCast(base_ptr)))).*;
        },
        16 => blk: {
            const base_ptr: *const u8 = &size16_instructions[id].bytes[0];
            break :blk (@as(*const InstType, @ptrCast(@alignCast(base_ptr)))).*;
        },
        24 => blk: {
            const base_ptr: *const u8 = &size24_instructions[id].bytes[0];
            break :blk (@as(*const InstType, @ptrCast(@alignCast(base_ptr)))).*;
        },
        else => unreachable,
    };
}