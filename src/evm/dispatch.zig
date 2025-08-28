const std = @import("std");
const Opcode = @import("opcode_data.zig").Opcode;
const bytecode_mod = @import("bytecode.zig");


/// Dispatch manages the execution flow of EVM opcodes through an optimized instruction stream.
/// It converts bytecode into a cache-efficient array of function pointers and metadata,
/// enabling high-performance execution with minimal branch misprediction.
/// 
/// The dispatch mechanism uses tail-call optimization to jump between opcode handlers,
/// keeping hot data in CPU cache and maintaining predictable memory access patterns.
/// 
/// @param FrameType - The stack frame type that will execute the opcodes
/// @return A struct type containing dispatch functionality for the given frame type
pub fn Dispatch(comptime FrameType: type) type {
    return struct {
        /// The optimized instruction stream containing opcode handlers and their metadata.
        /// Each item is exactly 64 bits for optimal cache line usage.
        /// 
        /// Layout example: [handler_ptr, metadata, handler_ptr, metadata, ...]
        /// 
        /// Safety: Always terminated with 2 STOP handlers so accessing schedule[n+1] 
        /// or schedule[n+2] is safe without bounds checking.
        schedule: [*]const Item,

        // ========================
        // Metadata Types
        // ========================

        /// Metadata for JUMPDEST operations containing pre-calculated gas and stack requirements.
        /// This enables efficient block-level gas accounting and stack validation.
        pub const JumpDestMetadata = packed struct(u64) {
            /// Total gas cost for the entire basic block starting at this JUMPDEST
            gas: u32 = 0,
            min_stack: i16 = 0,
            max_stack: i16 = 0,
        };
        /// Metadata for PUSH operations with values that fit in 64 bits.
        /// Stored inline in the dispatch array for cache efficiency.
        pub const PushInlineMetadata = packed struct(u64) { value: u64 };
        /// Metadata for PUSH operations with values larger than 64 bits.
        /// Contains a pointer to the heap-allocated u256 value.
        pub const PushPointerMetadata = packed struct(u64) { value: *u256 };
        /// Metadata for PC opcode containing the program counter value.
        pub const PcMetadata = packed struct { value: FrameType.PcType };
        /// Function pointer type for opcode handlers.
        /// Each handler receives the frame and current dispatch position.
        pub const OpcodeHandler = *const fn (frame: FrameType, dispatch: Self) FrameType.Error!FrameType.Success;
        /// A single item in the dispatch array, either a handler or metadata.
        pub const Item = union {
            jump_dest: JumpDestMetadata,
            push_inline: PushInlineMetadata,
            push_pointer: PushPointerMetadata,
            pc: PcMetadata,
            opcode_handler: OpcodeHandler,
        };
        const Self = @This();

        // ========================
        // Metadata Access Methods
        // ========================

        /// Get opcode data including metadata and next dispatch position.
        /// This is a comptime-optimized method for specific opcodes.
        pub fn getOpData(self: Self, comptime opcode: Opcode) switch (opcode) {
            .PC => struct { metadata: PcMetadata, next: Self },
            .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8 => struct { metadata: PushInlineMetadata, next: Self },
            .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => struct { metadata: PushPointerMetadata, next: Self },
            .JUMPDEST => struct { metadata: JumpDestMetadata, next: Self },
            else => struct { next: Self },
        } {
            return switch (opcode) {
                .PC => .{
                    .metadata = self.schedule[0].pc,
                    .next = Self{ .schedule = self.schedule + 2 },
                },
                .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8 => .{
                    .metadata = self.schedule[0].push_inline,
                    .next = Self{ .schedule = self.schedule + 2 },
                },
                .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => .{
                    .metadata = self.schedule[0].push_pointer,
                    .next = Self{ .schedule = self.schedule + 2 },
                },
                .JUMPDEST => .{
                    .metadata = self.schedule[0].jump_dest,
                    .next = Self{ .schedule = self.schedule + 2 },
                },
                else => .{
                    .next = Self{ .schedule = self.schedule + 1 },
                },
            };
        }

        /// Advance to the next handler in the dispatch array.
        /// Used for opcodes without metadata.
        pub fn getNext(self: Self) Self {
            return Self{ .schedule = self.schedule + 1 };
        }

        /// Skip the current handler's metadata and advance to the next handler.
        /// Used for opcodes that have associated metadata.
        pub fn skipMetadata(self: Self) Self {
            return Self{ .schedule = self.schedule + 2 };
        }

        /// Get inline push metadata from the next position.
        /// Assumes the caller verified this is a push with inline metadata.
        pub fn getInlineMetadata(self: Self) PushInlineMetadata {
            return self.schedule[1].push_inline;
        }

        /// Get pointer push metadata from the next position.
        /// Assumes the caller verified this is a push with pointer metadata.
        pub fn getPointerMetadata(self: Self) PushPointerMetadata {
            return self.schedule[1].push_pointer;
        }

        /// Get PC metadata from the next position.
        /// Assumes the caller verified this is a PC opcode.
        pub fn getPcMetadata(self: Self) PcMetadata {
            return self.schedule[1].pc;
        }

        /// Get JUMPDEST metadata from the next position.
        /// Assumes the caller verified this is a JUMPDEST opcode.
        pub fn getJumpDestMetadata(self: Self) JumpDestMetadata {
            return self.schedule[1].jump_dest;
        }

        // ========================
        // Initialization
        // ========================

        /// Create an optimized dispatch array from bytecode.
        /// 
        /// This function analyzes the bytecode and generates an efficient instruction
        /// stream with inline metadata, leveraging opcode fusion opportunities.
        /// 
        /// @param allocator - Memory allocator for the dispatch array
        /// @param bytecode - The bytecode to convert
        /// @param opcode_handlers - Array of 256 opcode handler function pointers
        /// @return Owned slice containing the dispatch array
        pub fn init(
            allocator: std.mem.Allocator,
            bytecode: *const bytecode_mod.Bytecode(FrameType.BytecodeConfig),
            opcode_handlers: *const [256]*const OpcodeHandler,
        ) ![]Item {
            var schedule_items = std.ArrayList(Item).init(allocator);
            errdefer schedule_items.deinit();

            // Create iterator to traverse bytecode
            var iter = bytecode.createIterator();

            while (true) {
                const instr_pc = iter.pc;
                const maybe = iter.next();
                if (maybe == null) break;
                const op_data = maybe.?;
                switch (op_data) {
                    .regular => |data| {
                        // Regular opcode - add handler first, then metadata for PC
                        const handler = opcode_handlers.*[data.opcode];
                        try schedule_items.append(.{ .opcode_handler = handler });
                        if (data.opcode == @intFromEnum(Opcode.PC)) {
                            try schedule_items.append(.{ .pc = .{ .value = @intCast(instr_pc) } });
                        }
                    },
                    .push => |data| {
                        // PUSH operation - add handler first, then metadata
                        const push_opcode = 0x60 + data.size - 1; // PUSH1 = 0x60, PUSH2 = 0x61, etc.
                        try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[push_opcode] });
                        if (data.size <= 8) {
                            // Inline value for small pushes
                            const inline_value: u64 = if (data.value > std.math.maxInt(u64)) std.math.maxInt(u64) else @intCast(data.value);
                            try schedule_items.append(.{ .push_inline = .{ .value = inline_value } });
                        } else {
                            // Pointer to value for large pushes
                            const value_ptr = try allocator.create(FrameType.WordType);
                            value_ptr.* = data.value;
                            try schedule_items.append(.{ .push_pointer = .{ .value = value_ptr } });
                        }
                    },
                    .jumpdest => |data| {
                        // JUMPDEST - add handler first, then metadata
                        try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.JUMPDEST)] });
                        try schedule_items.append(.{ .jump_dest = .{ .gas = data.gas_cost } });
                    },
                    .push_add_fusion => |data| {
                        // Fused PUSH+ADD operation - handler first, then metadata
                        if (data.value <= std.math.maxInt(u64)) {
                            const inline_val: u64 = @intCast(data.value);
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_inline = .{ .value = inline_val } });
                        } else {
                            const value_ptr = try allocator.create(FrameType.WordType);
                            value_ptr.* = data.value;
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_pointer = .{ .value = value_ptr } });
                        }
                    },
                    .push_mul_fusion => |data| {
                        // Fused PUSH+MUL operation - handler first, then metadata
                        if (data.value <= std.math.maxInt(u64)) {
                            const inline_val: u64 = @intCast(data.value);
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_inline = .{ .value = inline_val } });
                        } else {
                            const value_ptr = try allocator.create(FrameType.WordType);
                            value_ptr.* = data.value;
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_pointer = .{ .value = value_ptr } });
                        }
                    },
                    // Additional fusions (SUB/DIV/AND/OR/XOR/JUMP/JUMPI) - handler first, then metadata
                    .push_sub_fusion => |data| {
                        if (data.value <= std.math.maxInt(u64)) {
                            const inline_val: u64 = @intCast(data.value);
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_inline = .{ .value = inline_val } });
                        } else {
                            const value_ptr = try allocator.create(FrameType.WordType);
                            value_ptr.* = data.value;
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_pointer = .{ .value = value_ptr } });
                        }
                    },
                    .push_div_fusion => |data| {
                        if (data.value <= std.math.maxInt(u64)) {
                            const inline_val: u64 = @intCast(data.value);
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_inline = .{ .value = inline_val } });
                        } else {
                            const value_ptr = try allocator.create(FrameType.WordType);
                            value_ptr.* = data.value;
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_pointer = .{ .value = value_ptr } });
                        }
                    },
                    .push_and_fusion => |data| {
                        if (data.value <= std.math.maxInt(u64)) {
                            const inline_val: u64 = @intCast(data.value);
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_inline = .{ .value = inline_val } });
                        } else {
                            const value_ptr = try allocator.create(FrameType.WordType);
                            value_ptr.* = data.value;
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_pointer = .{ .value = value_ptr } });
                        }
                    },
                    .push_or_fusion => |data| {
                        if (data.value <= std.math.maxInt(u64)) {
                            const inline_val: u64 = @intCast(data.value);
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_inline = .{ .value = inline_val } });
                        } else {
                            const value_ptr = try allocator.create(FrameType.WordType);
                            value_ptr.* = data.value;
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_pointer = .{ .value = value_ptr } });
                        }
                    },
                    .push_xor_fusion => |data| {
                        if (data.value <= std.math.maxInt(u64)) {
                            const inline_val: u64 = @intCast(data.value);
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_inline = .{ .value = inline_val } });
                        } else {
                            const value_ptr = try allocator.create(FrameType.WordType);
                            value_ptr.* = data.value;
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_pointer = .{ .value = value_ptr } });
                        }
                    },
                    .push_jump_fusion => |data| {
                        if (data.value <= std.math.maxInt(u64)) {
                            const inline_val: u64 = @intCast(data.value);
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_inline = .{ .value = inline_val } });
                        } else {
                            const value_ptr = try allocator.create(FrameType.WordType);
                            value_ptr.* = data.value;
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_pointer = .{ .value = value_ptr } });
                        }
                    },
                    .push_jumpi_fusion => |data| {
                        if (data.value <= std.math.maxInt(u64)) {
                            const inline_val: u64 = @intCast(data.value);
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_inline = .{ .value = inline_val } });
                        } else {
                            const value_ptr = try allocator.create(FrameType.WordType);
                            value_ptr.* = data.value;
                            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.PUSH1)] }); // TODO: Add synthetic opcodes to handler array
                            try schedule_items.append(.{ .push_pointer = .{ .value = value_ptr } });
                        }
                    },
                    .stop => {
                        try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.STOP)] });
                    },
                    .invalid => {
                        try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.INVALID)] });
                    },
                }
            }

            // Safety: Append two STOP handlers as terminators.
            // This ensures accessing schedule[n+1] or schedule[n+2] is always safe
            // without bounds checking, improving performance.
            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.STOP)] });
            try schedule_items.append(.{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.STOP)] });

            return schedule_items.toOwnedSlice();
        }
    };
}

