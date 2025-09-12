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
    comptime OpcodeHandler: type,
    comptime Self: type,
    comptime Item: type,
    comptime PcMetadata: type,
    comptime PushInlineMetadata: type,
    comptime PushPointerMetadata: type,
    comptime JumpDestMetadata: type,
) type {
    return switch (opcode) {
        .PC => struct { metadata: PcMetadata, next_handler: OpcodeHandler, next_cursor: Self },
        .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8 => struct { metadata: PushInlineMetadata, next_handler: OpcodeHandler, next_cursor: Self },
        .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => struct { metadata: PushPointerMetadata, next_handler: OpcodeHandler, next_cursor: Self },
        .JUMPDEST => struct { metadata: JumpDestMetadata, next_handler: OpcodeHandler, next_cursor: Self },
        .PUSH_ADD_INLINE, .PUSH_MUL_INLINE, .PUSH_DIV_INLINE, .PUSH_SUB_INLINE, .PUSH_AND_INLINE, .PUSH_OR_INLINE, .PUSH_XOR_INLINE, .PUSH_JUMP_INLINE, .PUSH_JUMPI_INLINE, .PUSH_MLOAD_INLINE, .PUSH_MSTORE_INLINE, .PUSH_MSTORE8_INLINE => struct { metadata: PushInlineMetadata, next_handler: OpcodeHandler, next_cursor: Self },
        .PUSH_ADD_POINTER, .PUSH_MUL_POINTER, .PUSH_DIV_POINTER, .PUSH_SUB_POINTER, .PUSH_AND_POINTER, .PUSH_OR_POINTER, .PUSH_XOR_POINTER, .PUSH_JUMP_POINTER, .PUSH_JUMPI_POINTER, .PUSH_MLOAD_POINTER, .PUSH_MSTORE_POINTER, .PUSH_MSTORE8_POINTER => struct { metadata: PushPointerMetadata, next_handler: OpcodeHandler, next_cursor: Self },
        // Advanced synthetic opcodes with special metadata requirements
        .MULTI_PUSH_2 => struct { items: [*]const Item, next_handler: OpcodeHandler, next_cursor: Self }, // Points to 2 push items
        .MULTI_PUSH_3 => struct { items: [*]const Item, next_handler: OpcodeHandler, next_cursor: Self }, // Points to 3 push items
        .MULTI_POP_2, .MULTI_POP_3 => struct { next_handler: OpcodeHandler, next_cursor: Self }, // No metadata
        .ISZERO_JUMPI => struct { items: [*]const Item, next_handler: OpcodeHandler, next_cursor: Self }, // Jump target item
        .DUP2_MSTORE_PUSH => struct { items: [*]const Item, next_handler: OpcodeHandler, next_cursor: Self }, // Push value item
        else => struct { next_handler: OpcodeHandler, next_cursor: Self },
    };
}

/// Get opcode data including metadata and next dispatch position.
/// This is a comptime-optimized method for specific opcodes.
/// 
/// The cursor parameter is expected to point to the NEXT slot after the current opcode handler.
/// For opcodes with metadata, the metadata is at cursor[0].
/// Returns the next handler to call and the cursor to pass to it.
pub inline fn getOpData(
    comptime opcode: UnifiedOpcode,
    comptime Self: type,
    comptime Item: type,
    cursor: [*]const Item,
) GetOpDataReturnType(
    opcode,
    @TypeOf(@as(Item, undefined).opcode_handler),
    Self,
    Item,
    @TypeOf(@as(Item, undefined).pc),
    @TypeOf(@as(Item, undefined).push_inline),
    @TypeOf(@as(Item, undefined).push_pointer),
    @TypeOf(@as(Item, undefined).jump_dest),
) {
    return switch (opcode) {
        .PC => .{
            .metadata = cursor[0].pc,
            .next_handler = cursor[1].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 2 },
        },
        .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8 => .{
            .metadata = cursor[0].push_inline,
            .next_handler = cursor[1].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 2 },
        },
        .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => .{
            .metadata = cursor[0].push_pointer,
            .next_handler = cursor[1].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 2 },
        },
        .JUMPDEST => .{
            .metadata = cursor[0].jump_dest,
            .next_handler = cursor[1].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 2 },
        },
        .PUSH_ADD_INLINE, .PUSH_MUL_INLINE, .PUSH_DIV_INLINE, .PUSH_SUB_INLINE, .PUSH_AND_INLINE, .PUSH_OR_INLINE, .PUSH_XOR_INLINE, .PUSH_JUMP_INLINE, .PUSH_JUMPI_INLINE, .PUSH_MLOAD_INLINE, .PUSH_MSTORE_INLINE, .PUSH_MSTORE8_INLINE => .{
            .metadata = cursor[0].push_inline,
            .next_handler = cursor[1].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 2 },
        },
        .PUSH_ADD_POINTER, .PUSH_MUL_POINTER, .PUSH_DIV_POINTER, .PUSH_SUB_POINTER, .PUSH_AND_POINTER, .PUSH_OR_POINTER, .PUSH_XOR_POINTER, .PUSH_JUMP_POINTER, .PUSH_JUMPI_POINTER, .PUSH_MLOAD_POINTER, .PUSH_MSTORE_POINTER, .PUSH_MSTORE8_POINTER => .{
            .metadata = cursor[0].push_pointer,
            .next_handler = cursor[1].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 2 },
        },
        // Advanced synthetic opcodes
        .MULTI_PUSH_2 => .{
            .items = cursor, // Points to the 2 push items
            .next_handler = cursor[2].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 3 },
        },
        .MULTI_PUSH_3 => .{
            .items = cursor, // Points to the 3 push items
            .next_handler = cursor[3].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 4 },
        },
        .MULTI_POP_2, .MULTI_POP_3 => .{
            .next_handler = cursor[0].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 1 },
        },
        .ISZERO_JUMPI => .{
            .items = cursor, // Points to jump target item
            .next_handler = cursor[1].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 2 },
        },
        .DUP2_MSTORE_PUSH => .{
            .items = cursor, // Points to push value item
            .next_handler = cursor[1].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 2 },
        },
        // All other opcodes have no metadata
        else => .{
            .next_handler = cursor[0].opcode_handler,
            .next_cursor = Self{ .cursor = cursor + 1 },
        },
    };
}