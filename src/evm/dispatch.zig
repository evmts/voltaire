const std = @import("std");
const opcode_mod = @import("opcode.zig");
const Opcode = @import("opcode_data.zig").Opcode;
const OpcodeSynthetic = @import("opcode_synthetic.zig").OpcodeSynthetic;
const bytecode_mod = @import("bytecode.zig");
const ArrayList = std.ArrayListAligned;
const dispatch_metadata = @import("dispatch_metadata.zig");
const dispatch_item = @import("dispatch_item.zig");
const dispatch_jump_table = @import("dispatch_jump_table.zig");
const dispatch_jump_table_builder = @import("dispatch_jump_table_builder.zig");
const dispatch_allocated_memory = @import("dispatch_allocated_memory.zig");
const dispatch_opcode_data = @import("dispatch_opcode_data.zig");
const dispatch_pretty_print = @import("dispatch_pretty_print.zig");

pub fn Dispatch(comptime FrameType: type) type {
    return struct {
        const Self = @This();

        const Metadata = dispatch_metadata.DispatchMetadata(FrameType);

        const OpcodeHandler = *const fn (frame: *FrameType, cursor: [*]const Item) FrameType.Error!noreturn;

        pub const Item = union {
            opcode_handler: OpcodeHandler,
            jump_dest: Metadata.JumpDestMetadata,
            push_inline: Metadata.PushInlineMetadata,
            push_pointer: Metadata.PushPointerMetadata,
            pc: Metadata.PcMetadata,
            jump_static: Metadata.JumpStaticMetadata,
            first_block_gas: Metadata.FirstBlockMetadata,
        };

        const AllocatedMemory = dispatch_allocated_memory.AllocatedMemory(FrameType.WordType);

        fn processRegularOpcode(
            schedule_items: *ArrayList(Self.Item, null),
            allocator: std.mem.Allocator,
            opcode_handlers: *const [256]OpcodeHandler,
            data: anytype,
            instr_pc: anytype,
        ) !void {
            const handler = opcode_handlers.*[data.opcode];
            try schedule_items.append(allocator, .{ .opcode_handler = handler });

            if (data.opcode == @intFromEnum(Opcode.PC)) {
                try schedule_items.append(allocator, .{ .pc = .{ .value = @intCast(instr_pc) } });
            } else if (data.opcode == @intFromEnum(Opcode.JUMP) or data.opcode == @intFromEnum(Opcode.JUMPI)) {
                    try schedule_items.append(allocator, .{ .jump_dest = .{ .gas = 0, .min_stack = 0, .max_stack = 0 } });
            }
        }

        fn processPushOpcode(
            schedule_items: anytype,
            allocator: std.mem.Allocator,
            allocated_memory: *AllocatedMemory,
            opcode_handlers: *const [256]OpcodeHandler,
            data: anytype,
        ) !void {
            const push_opcode = 0x60 + data.size - 1;

            try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[push_opcode] });

            if (data.size <= 8 and data.value <= std.math.maxInt(u64)) {
                const inline_value: u64 = @intCast(data.value);
                try schedule_items.append(allocator, .{ .push_inline = .{ .value = inline_value } });
            } else {
                const value_ptr = try allocator.create(FrameType.WordType);
                errdefer allocator.destroy(value_ptr);
                value_ptr.* = data.value;
                try allocated_memory.pointers.append(allocator, value_ptr);
                try schedule_items.append(allocator, .{ .push_pointer = .{ .value = value_ptr } });
            }
        }

        cursor: [*]const Item,

        pub const JumpDestMetadata = Metadata.JumpDestMetadata;
        pub const FirstBlockMetadata = Metadata.FirstBlockMetadata;
        pub const PushInlineMetadata = Metadata.PushInlineMetadata;
        pub const PushPointerMetadata = Metadata.PushPointerMetadata;
        pub const PcMetadata = Metadata.PcMetadata;
        pub const JumpStaticMetadata = Metadata.JumpStaticMetadata;

        pub const JumpTable = dispatch_jump_table.JumpTable(FrameType, Self);

        pub const UnifiedOpcode = opcode_mod.UnifiedOpcode;

        fn GetOpDataReturnType(comptime opcode: UnifiedOpcode) type {
            return dispatch_opcode_data.GetOpDataReturnType(
                opcode,
                Self,
                PcMetadata,
                PushInlineMetadata,
                PushPointerMetadata,
                JumpDestMetadata,
            );
        }

        pub inline fn getOpData(self: Self, comptime opcode: UnifiedOpcode) GetOpDataReturnType(opcode) {
            return dispatch_opcode_data.getOpData(opcode, Self, Item, self.cursor);
        }

        pub fn getFirstBlockGas(self: Self) @TypeOf(@as(Self.Item, undefined).first_block_gas) {
            return self.cursor[0].first_block_gas;
        }

        pub fn calculateFirstBlockGas(bytecode: anytype) u64 {
            var gas: u64 = 0;
            var iter = bytecode.createIterator();
            const opcode_info = @import("opcode_data.zig").OPCODE_INFO;

            var op_count: u32 = 0;

            while (true) {
                const maybe = iter.next();
                if (maybe == null) break;
                const op_data = maybe.?;
                op_count += 1;

                switch (op_data) {
                    .regular => |data| {
                        const gas_to_add = @as(u64, opcode_info[data.opcode].gas_cost);
                        const new_gas = std.math.add(u64, gas, gas_to_add) catch gas;
                        gas = new_gas;
                        switch (data.opcode) {
                            0x56, 0x57, 0x00, 0xf3, 0xfd, 0xfe, 0xff => {
                                if (data.opcode == 0x57) {
                                }
                                return gas;
                            },
                            else => {},
                        }
                    },
                    .push => |data| {
                        const push_opcode = 0x60 + data.size - 1;
                        const gas_to_add = @as(u64, opcode_info[push_opcode].gas_cost);
                        const new_gas = std.math.add(u64, gas, gas_to_add) catch gas;
                        gas = new_gas;
                    },
                    .jumpdest => {
                        return gas;
                    },
                    .stop, .invalid => {
                        const gas_to_add = @as(u64, opcode_info[0x00].gas_cost);
                        gas = std.math.add(u64, gas, gas_to_add) catch gas;
                        return gas;
                    },
                    else => {
                        const new_gas = std.math.add(u64, gas, 6) catch gas;
                        gas = new_gas;
                    },
                }
            }

            return gas;
        }

        pub fn init(
            allocator: std.mem.Allocator,
            bytecode: anytype,
            opcode_handlers: *const [256]OpcodeHandler,
        ) ![]Self.Item {
            const ScheduleList = ArrayList(Self.Item, null);
            var schedule_items = ScheduleList{};
            errdefer schedule_items.deinit(allocator);

            var allocated_memory = AllocatedMemory.init();
            errdefer allocated_memory.deinit(allocator);

            var iter = bytecode.createIterator();

            const first_block_gas = calculateFirstBlockGas(bytecode);

            if (first_block_gas > 0) try schedule_items.append(allocator, .{ .first_block_gas = .{ .gas = @intCast(first_block_gas) } });

            var opcode_count: usize = 0;
            while (true) {
                const instr_pc = iter.pc;
                const maybe = iter.next();
                if (maybe == null) break;
                const op_data = maybe.?;
                opcode_count += 1;

                switch (op_data) {
                    .regular => |data| {
                        try processRegularOpcode(&schedule_items, allocator, opcode_handlers, data, instr_pc);
                    },
                    .push => |data| {
                        try processPushOpcode(&schedule_items, allocator, &allocated_memory, opcode_handlers, data);
                    },
                    .jumpdest => |data| {
                        try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.JUMPDEST)] });
                        try schedule_items.append(allocator, .{ .jump_dest = .{ .gas = data.gas_cost } });
                    },
                    .push_add_fusion => |data| {
                        try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_add);
                    },
                    .push_mul_fusion => |data| {
                        try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_mul);
                    },
                    .push_sub_fusion => |data| {
                        try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_sub);
                    },
                    .push_div_fusion => |data| {
                        try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_div);
                    },
                    .push_and_fusion => |data| {
                        try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_and);
                    },
                    .push_or_fusion => |data| {
                        try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_or);
                    },
                    .push_xor_fusion => |data| {
                        try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_xor);
                    },
                    .push_jump_fusion => |data| {
                        try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_jump);
                    },
                    .push_jumpi_fusion => |data| {
                        try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_jumpi);
                    },
                    .stop => {
                        try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.STOP)] });
                    },
                    .invalid => {
                        try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.INVALID)] });
                    },
                }
            }

            try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.STOP)] });
            try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.STOP)] });

            const final_schedule = try schedule_items.toOwnedSlice(allocator);
            return final_schedule;
        }

        pub const BuildOwned = struct {
            items: []Self.Item,
            push_pointers: []*FrameType.WordType,
        };

        pub fn initWithOwnership(
            allocator: std.mem.Allocator,
            bytecode: anytype,
            opcode_handlers: *const [256]OpcodeHandler,
        ) !BuildOwned {
            const ScheduleList = ArrayList(Self.Item, null);
            var schedule_items = ScheduleList{};
            errdefer schedule_items.deinit(allocator);

            var allocated_memory = AllocatedMemory.init();
            errdefer allocated_memory.deinit(allocator);

            var iter = bytecode.createIterator();
            const first_block_gas = calculateFirstBlockGas(bytecode);
            if (first_block_gas > 0) try schedule_items.append(allocator, .{ .first_block_gas = .{ .gas = @intCast(first_block_gas) } });

            var opcode_count: usize = 0;
            while (true) {
                const instr_pc = iter.pc;
                const maybe = iter.next();
                if (maybe == null) break;
                const op_data = maybe.?;
                opcode_count += 1;

                switch (op_data) {
                    .regular => |data| try processRegularOpcode(&schedule_items, allocator, opcode_handlers, data, instr_pc),
                    .push => |data| try processPushOpcode(&schedule_items, allocator, &allocated_memory, opcode_handlers, data),
                    .jumpdest => |data| {
                        try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.JUMPDEST)] });
                        try schedule_items.append(allocator, .{ .jump_dest = .{ .gas = data.gas_cost } });
                    },
                    .push_add_fusion => |data| try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_add),
                    .push_mul_fusion => |data| try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_mul),
                    .push_sub_fusion => |data| try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_sub),
                    .push_div_fusion => |data| try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_div),
                    .push_and_fusion => |data| try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_and),
                    .push_or_fusion => |data| try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_or),
                    .push_xor_fusion => |data| try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_xor),
                    .push_jump_fusion => |data| try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_jump),
                    .push_jumpi_fusion => |data| try Self.handleFusionOperation(&schedule_items, allocator, &allocated_memory, data.value, .push_jumpi),
                    .stop => try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.STOP)] }),
                    .invalid => try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.INVALID)] }),
                }
            }

            try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.STOP)] });
            try schedule_items.append(allocator, .{ .opcode_handler = opcode_handlers.*[@intFromEnum(Opcode.STOP)] });

            const items = try schedule_items.toOwnedSlice(allocator);
            const push_ptrs = try allocated_memory.pointers.toOwnedSlice(allocator);
            allocated_memory = AllocatedMemory.init();
            return BuildOwned{ .items = items, .push_pointers = push_ptrs };
        }

        fn handleFusionOperation(
            schedule_items: anytype,
            allocator: std.mem.Allocator,
            allocated_memory: *AllocatedMemory,
            value: FrameType.WordType,
            fusion_type: FusionType,
        ) !void {
            const synthetic_opcode = getSyntheticOpcode(fusion_type, value <= std.math.maxInt(u64));
            const frame_handlers = @import("frame_handlers.zig");
            const synthetic_handler = frame_handlers.getSyntheticHandler(FrameType, synthetic_opcode);
            try schedule_items.append(allocator, .{ .opcode_handler = synthetic_handler });

            if (value <= std.math.maxInt(u64)) {
                const inline_val: u64 = @intCast(value);
                try schedule_items.append(allocator, .{ .push_inline = .{ .value = inline_val } });
            } else {
                const value_ptr = try allocator.create(FrameType.WordType);
                errdefer allocator.destroy(value_ptr);
                value_ptr.* = value;
                try allocated_memory.pointers.append(allocator, value_ptr);
                try schedule_items.append(allocator, .{ .push_pointer = .{ .value = value_ptr } });
            }
        }

        const FusionType = enum {
            push_add,
            push_mul,
            push_sub,
            push_div,
            push_and,
            push_or,
            push_xor,
            push_jump,
            push_jumpi,
        };

        fn getSyntheticOpcode(fusion_type: FusionType, is_inline: bool) u8 {
            return switch (fusion_type) {
                .push_add => if (is_inline) @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE) else @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER),
                .push_mul => if (is_inline) @intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE) else @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER),
                .push_sub => if (is_inline) @intFromEnum(OpcodeSynthetic.PUSH_SUB_INLINE) else @intFromEnum(OpcodeSynthetic.PUSH_SUB_POINTER),
                .push_div => if (is_inline) @intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE) else @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER),
                .push_and => if (is_inline) @intFromEnum(OpcodeSynthetic.PUSH_AND_INLINE) else @intFromEnum(OpcodeSynthetic.PUSH_AND_POINTER),
                .push_or => if (is_inline) @intFromEnum(OpcodeSynthetic.PUSH_OR_INLINE) else @intFromEnum(OpcodeSynthetic.PUSH_OR_POINTER),
                .push_xor => if (is_inline) @intFromEnum(OpcodeSynthetic.PUSH_XOR_INLINE) else @intFromEnum(OpcodeSynthetic.PUSH_XOR_POINTER),
                .push_jump => if (is_inline) @intFromEnum(OpcodeSynthetic.PUSH_JUMP_INLINE) else @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER),
                .push_jumpi => if (is_inline) @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_INLINE) else @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER),
            };
        }

        pub fn createJumpTable(
            allocator: std.mem.Allocator,
            schedule: []const Item,
            bytecode: anytype,
        ) !JumpTable {
            var builder = JumpTableBuilder.init(allocator);
            defer builder.deinit();

            try builder.buildFromSchedule(schedule, bytecode);

            const jump_table = try builder.finalizeWithSchedule(schedule);

            if (std.debug.runtime_safety and jump_table.entries.len > 1) {
                for (jump_table.entries[0..jump_table.entries.len -| 1], jump_table.entries[1..]) |current, next| {
                    if (current.pc >= next.pc) {
                        std.debug.panic("JumpTable not properly sorted: PC {} >= {}", .{ current.pc, next.pc });
                    }
                }
            }

            return jump_table;
        }

        pub fn deinitSchedule(allocator: std.mem.Allocator, schedule: []const Item) void {
            allocator.free(schedule);
        }

        pub const DispatchSchedule = struct {
            items: []Item,
            allocator: std.mem.Allocator,
            push_pointers: []const *FrameType.WordType = &.{},

            pub fn init(allocator: std.mem.Allocator, bytecode: anytype, opcode_handlers: *const [256]OpcodeHandler) !DispatchSchedule {
                const owned = try Self.initWithOwnership(allocator, bytecode, opcode_handlers);
                return DispatchSchedule{
                    .items = owned.items,
                    .allocator = allocator,
                    .push_pointers = owned.push_pointers,
                };
            }

            pub fn deinit(self: *DispatchSchedule) void {
                for (self.push_pointers) |ptr| {
                    self.allocator.destroy(ptr);
                }
                if (self.push_pointers.len > 0) self.allocator.free(self.push_pointers);

                Self.deinitSchedule(self.allocator, self.items);
            }

            pub fn getDispatch(self: *const DispatchSchedule) Self {
                return Self{
                    .cursor = self.items.ptr,
                };
            }
        };

        pub const ScheduleIterator = struct {
            schedule: []const Item,
            bytecode: *const anyopaque,
            pc: FrameType.PcType = 0,
            schedule_index: usize = 0,

            pub const Entry = struct {
                pc: FrameType.PcType,
                schedule_index: usize,
                op_data: enum { regular, push, jumpdest, stop, invalid, fusion },
            };

            pub fn init(schedule: []const Item, bytecode: anytype) ScheduleIterator {
                return .{
                    .schedule = schedule,
                    .bytecode = bytecode,
                    .pc = 0,
                    .schedule_index = 0,
                };
            }

            pub fn next(self: *ScheduleIterator) ?Entry {
                if (self.schedule_index >= self.schedule.len) return null;

                if (self.schedule_index == 0) {
                    const first_block_gas = calculateFirstBlockGas(self.bytecode);
                    if (first_block_gas > 0) {
                        self.schedule_index = 1;
                        if (self.schedule_index >= self.schedule.len) return null;
                    }
                }

                const current_pc = self.pc;
                const current_index = self.schedule_index;

                const item = self.schedule[self.schedule_index];
                const op_type: Entry.op_data = switch (item) {
                    .opcode_handler => blk: {
                        break :blk .regular;
                    },
                    .jump_dest => .jumpdest,
                    .push_inline, .push_pointer => .push,
                    else => .regular,
                };

                self.schedule_index += 1;

                if (self.schedule_index < self.schedule.len) {
                    switch (self.schedule[self.schedule_index]) {
                        .jump_dest, .push_inline, .push_pointer, .pc => {
                            self.schedule_index += 1;
                        },
                        else => {},
                    }
                }

                self.pc += 1;

                return Entry{
                    .pc = current_pc,
                    .schedule_index = current_index,
                    .op_data = op_type,
                };
            }
        };

        pub const JumpTableBuilder = dispatch_jump_table_builder.JumpTableBuilder(FrameType, Self);

        pub fn pretty_print(allocator: std.mem.Allocator, schedule: []const Item, bytecode: anytype) ![]u8 {
            return dispatch_pretty_print.pretty_print(allocator, schedule, bytecode, FrameType, Item);
        }
    };
}

pub fn ScheduleElement(comptime FrameType: type) type {
    const DispatchType = Dispatch(FrameType);
    return DispatchType.Item;
}
