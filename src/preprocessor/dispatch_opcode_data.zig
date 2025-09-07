const std = @import("std");
const opcode_mod = @import("../opcodes/opcode.zig");
const UnifiedOpcode = opcode_mod.UnifiedOpcode;

/// Generic functions for handling opcode data retrieval from the dispatch instruction stream.
/// These functions map opcodes to their expected metadata types and provide efficient
/// access patterns for the dispatch system.

/// A generic type that casts the 64 byte value to the correct type depending on the opcode.
/// NOTE: The metadata is not tagged (to save cacheline space) so this working safely depends on us always
/// constructing the instruction stream correctly with the expected metadata consistently in the expected spots based on opcode!
/// We also assume every opcode will correctly pass in the correct enum type for their opcode.
pub fn GetOpDataReturnType(
    comptime opcode: UnifiedOpcode,
    comptime Self: type,
    comptime PcMetadata: type,
    comptime PushInlineMetadata: type,
    comptime PushPointerMetadata: type,
    comptime JumpDestMetadata: type,
) type {
    return switch (opcode) {
        .PC => struct { metadata: PcMetadata, next: Self },
        .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8 => struct { metadata: PushInlineMetadata, next: Self },
        .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => struct { metadata: PushPointerMetadata, next: Self },
        .JUMPDEST => struct { metadata: JumpDestMetadata, next: Self },
        .PUSH_ADD_INLINE, .PUSH_MUL_INLINE, .PUSH_DIV_INLINE, .PUSH_SUB_INLINE, .PUSH_AND_INLINE, .PUSH_OR_INLINE, .PUSH_XOR_INLINE, .PUSH_JUMP_INLINE, .PUSH_JUMPI_INLINE, .PUSH_MLOAD_INLINE, .PUSH_MSTORE_INLINE, .PUSH_MSTORE8_INLINE => struct { metadata: PushInlineMetadata, next: Self },
        .PUSH_ADD_POINTER, .PUSH_MUL_POINTER, .PUSH_DIV_POINTER, .PUSH_SUB_POINTER, .PUSH_AND_POINTER, .PUSH_OR_POINTER, .PUSH_XOR_POINTER, .PUSH_JUMP_POINTER, .PUSH_JUMPI_POINTER, .PUSH_MLOAD_POINTER, .PUSH_MSTORE_POINTER, .PUSH_MSTORE8_POINTER => struct { metadata: PushPointerMetadata, next: Self },
        else => struct { next: Self },
    };
}

/// Get opcode data including metadata and next dispatch position.
/// This is a comptime-optimized method for specific opcodes.
/// 
/// The cursor parameter is expected to point to the current opcode handler in the instruction stream.
/// For opcodes with metadata, the metadata is always at cursor[1].
pub fn getOpData(
    comptime opcode: UnifiedOpcode,
    comptime Self: type,
    comptime Item: type,
    cursor: [*]const Item,
) GetOpDataReturnType(
    opcode,
    Self,
    @TypeOf(@as(Item, undefined).pc),
    @TypeOf(@as(Item, undefined).push_inline),
    @TypeOf(@as(Item, undefined).push_pointer),
    @TypeOf(@as(Item, undefined).jump_dest),
) {
    return switch (opcode) {
        .PC => .{
            .metadata = cursor[1].pc,
            .next = Self{ .cursor = cursor + 2 },
        },
        .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8 => .{
            .metadata = cursor[1].push_inline,
            .next = Self{ .cursor = cursor + 2 },
        },
        .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => .{
            .metadata = cursor[1].push_pointer,
            .next = Self{ .cursor = cursor + 2 },
        },
        .JUMPDEST => .{
            .metadata = cursor[1].jump_dest,
            .next = Self{ .cursor = cursor + 2 },
        },
        .PUSH_ADD_INLINE, .PUSH_MUL_INLINE, .PUSH_DIV_INLINE, .PUSH_SUB_INLINE, .PUSH_AND_INLINE, .PUSH_OR_INLINE, .PUSH_XOR_INLINE, .PUSH_JUMP_INLINE, .PUSH_JUMPI_INLINE, .PUSH_MLOAD_INLINE, .PUSH_MSTORE_INLINE, .PUSH_MSTORE8_INLINE => .{
            .metadata = cursor[1].push_inline,
            .next = Self{ .cursor = cursor + 2 },
        },
        .PUSH_ADD_POINTER, .PUSH_MUL_POINTER, .PUSH_DIV_POINTER, .PUSH_SUB_POINTER, .PUSH_AND_POINTER, .PUSH_OR_POINTER, .PUSH_XOR_POINTER, .PUSH_JUMP_POINTER, .PUSH_JUMPI_POINTER, .PUSH_MLOAD_POINTER, .PUSH_MSTORE_POINTER, .PUSH_MSTORE8_POINTER => .{
            .metadata = cursor[1].push_pointer,
            .next = Self{ .cursor = cursor + 2 },
        },
        else => .{
            .next = Self{ .cursor = cursor + 1 },
        },
    };
}