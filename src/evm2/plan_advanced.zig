/// Plan: Runtime data structure for the EVM interpreter.
/// Contains the instruction stream (handler pointers + metadata) and constants.
const std = @import("std");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;
pub const PlanConfig = @import("plan_config.zig").PlanConfig;
const OpcodeSynthetic = @import("opcode_synthetic.zig").OpcodeSynthetic;

/// Metadata for JUMPDEST instructions.
/// On 64-bit systems this fits in usize, on 32-bit it requires pointer.
pub const JumpDestMetadata = packed struct {
    gas: u32,
    min_stack: i16,
    max_stack: i16,
};

/// Handler function type for instruction execution.
/// Takes frame and plan. Uses tail call recursion.
pub const HandlerFn = fn (frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn;

/// Instruction stream element for 32-bit platforms.
pub const InstructionElement32 = packed union {
    handler: *const HandlerFn,
    jumpdest_pointer: *const JumpDestMetadata,
    inline_value: u32,
    pointer_index: u32,
};

/// Instruction stream element for 64-bit platforms.
pub const InstructionElement64 = packed union {
    handler: *const HandlerFn,
    jumpdest_metadata: JumpDestMetadata,
    inline_value: u64,
    pointer_index: u64,
};

/// Platform-specific instruction element selection.
pub const InstructionElement = if (@sizeOf(usize) == 8)
    InstructionElement64
else if (@sizeOf(usize) == 4)
    InstructionElement32
else
    @compileError("Unsupported platform: usize must be 32 or 64 bits");

// Compile-time verification
comptime {
    if (@sizeOf(InstructionElement) != @sizeOf(usize)) {
        @compileError("InstructionElement must be exactly usize-sized");
    }
}


/// Factory function to create a Plan type with the given configuration.
pub fn Plan(comptime cfg: PlanConfig) type {
    comptime cfg.validate();
    
    return struct {
        pub const PcType = cfg.PcType();
        pub const InstructionIndexType = PcType; // Can only have as many instructions as PCs
        pub const WordType = cfg.WordType;

        const Self = @This();
        
        /// The instruction stream - mostly handler pointers with inline metadata.
        instructionStream: []InstructionElement,
        /// Constants array for values too large to fit inline.
        u256_constants: []WordType,
        /// PC to instruction index mapping for jump operations.
        /// Key is PC value, value is instruction stream index.
        pc_to_instruction_idx: ?std.AutoHashMap(PcType, InstructionIndexType),
        
        /// Get metadata for opcodes that have it, properly typed based on the opcode.
        /// Returns the metadata at idx+1 and advances idx by 2.
        pub fn getMetadata(
            self: *const Self,
            idx: *InstructionIndexType,
            comptime opcode: anytype,
        ) blk: {
            // Convert opcode to u8 value for uniform handling
            const opcode_value = if (@TypeOf(opcode) == u8)
                opcode
            else if (@TypeOf(opcode) == Opcode)
                @intFromEnum(opcode)
            else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                @intFromEnum(@field(Opcode, @tagName(opcode)))
            else
                @compileError("Invalid opcode type");
                
            // Determine metadata type based on opcode value
            const MetadataType = switch (opcode_value) {
                // PUSH opcodes return granular types
                @intFromEnum(Opcode.PUSH1) => u8,
                @intFromEnum(Opcode.PUSH2) => u16,
                @intFromEnum(Opcode.PUSH3) => u24,
                @intFromEnum(Opcode.PUSH4) => u32,
                @intFromEnum(Opcode.PUSH5) => u40,
                @intFromEnum(Opcode.PUSH6) => u48,
                @intFromEnum(Opcode.PUSH7) => u56,
                @intFromEnum(Opcode.PUSH8) => u64,
                // Larger PUSH opcodes return pointer to u256 or inline based on platform
                @intFromEnum(Opcode.PUSH9), @intFromEnum(Opcode.PUSH10), @intFromEnum(Opcode.PUSH11), @intFromEnum(Opcode.PUSH12), 
                @intFromEnum(Opcode.PUSH13), @intFromEnum(Opcode.PUSH14), @intFromEnum(Opcode.PUSH15), @intFromEnum(Opcode.PUSH16) => 
                    if (@sizeOf(usize) >= 16) u128 else *const WordType,
                @intFromEnum(Opcode.PUSH17), @intFromEnum(Opcode.PUSH18), @intFromEnum(Opcode.PUSH19), @intFromEnum(Opcode.PUSH20), 
                @intFromEnum(Opcode.PUSH21), @intFromEnum(Opcode.PUSH22), @intFromEnum(Opcode.PUSH23), @intFromEnum(Opcode.PUSH24),
                @intFromEnum(Opcode.PUSH25), @intFromEnum(Opcode.PUSH26), @intFromEnum(Opcode.PUSH27), @intFromEnum(Opcode.PUSH28), 
                @intFromEnum(Opcode.PUSH29), @intFromEnum(Opcode.PUSH30), @intFromEnum(Opcode.PUSH31), @intFromEnum(Opcode.PUSH32) => 
                    *const WordType,
                
                // Synthetic fusion opcodes
                @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE), @intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE), 
                @intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE), @intFromEnum(OpcodeSynthetic.PUSH_JUMP_INLINE), 
                @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_INLINE) => usize,
                @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER), @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER), 
                @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER), @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER), 
                @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER) => *const WordType,
                
                // JUMPDEST returns metadata struct or pointer
                @intFromEnum(Opcode.JUMPDEST) => if (@sizeOf(usize) >= @sizeOf(JumpDestMetadata))
                    JumpDestMetadata
                else
                    *const JumpDestMetadata,
                
                // PC returns the original PC value
                @intFromEnum(Opcode.PC) => PcType,
                
                // All other opcodes have no metadata
                else => @compileError("Opcode has no metadata"),
            };
            break :blk MetadataType;
        } {
            const current_idx = idx.*;
            if (current_idx + 1 >= self.instructionStream.len) {
                @panic("getMetadata: trying to read metadata past end of instruction stream");
            }
            const metadata_elem = self.instructionStream[current_idx + 1];
            // DO NOT advance idx here - only getNextInstruction should advance
            
            // Convert opcode to u8 value for uniform handling
            const opcode_value = comptime blk: {
                break :blk if (@TypeOf(opcode) == u8)
                    opcode
                else if (@TypeOf(opcode) == Opcode)
                    @intFromEnum(opcode)
                else
                    @intFromEnum(@field(Opcode, @tagName(opcode)));
            };
                
            return switch (opcode_value) {
                // PUSH opcodes return the inline value with correct type
                @intFromEnum(Opcode.PUSH1) => @as(u8, @truncate(metadata_elem.inline_value)),
                @intFromEnum(Opcode.PUSH2) => @as(u16, @truncate(metadata_elem.inline_value)),
                @intFromEnum(Opcode.PUSH3) => @as(u24, @truncate(metadata_elem.inline_value)),
                @intFromEnum(Opcode.PUSH4) => @as(u32, @truncate(metadata_elem.inline_value)),
                @intFromEnum(Opcode.PUSH5) => @as(u40, @truncate(metadata_elem.inline_value)),
                @intFromEnum(Opcode.PUSH6) => @as(u48, @truncate(metadata_elem.inline_value)),
                @intFromEnum(Opcode.PUSH7) => @as(u56, @truncate(metadata_elem.inline_value)),
                @intFromEnum(Opcode.PUSH8) => @as(u64, @truncate(metadata_elem.inline_value)),
                
                // Larger PUSH opcodes
                @intFromEnum(Opcode.PUSH9), @intFromEnum(Opcode.PUSH10), @intFromEnum(Opcode.PUSH11), @intFromEnum(Opcode.PUSH12),
                @intFromEnum(Opcode.PUSH13), @intFromEnum(Opcode.PUSH14), @intFromEnum(Opcode.PUSH15), @intFromEnum(Opcode.PUSH16) => {
                    if (@sizeOf(usize) >= 16) {
                        return @as(u128, @truncate(metadata_elem.inline_value));
                    } else {
                        const idx_val = metadata_elem.pointer_index;
                        return &self.u256_constants[idx_val];
                    }
                },
                @intFromEnum(Opcode.PUSH17), @intFromEnum(Opcode.PUSH18), @intFromEnum(Opcode.PUSH19), @intFromEnum(Opcode.PUSH20),
                @intFromEnum(Opcode.PUSH21), @intFromEnum(Opcode.PUSH22), @intFromEnum(Opcode.PUSH23), @intFromEnum(Opcode.PUSH24),
                @intFromEnum(Opcode.PUSH25), @intFromEnum(Opcode.PUSH26), @intFromEnum(Opcode.PUSH27), @intFromEnum(Opcode.PUSH28),
                @intFromEnum(Opcode.PUSH29), @intFromEnum(Opcode.PUSH30), @intFromEnum(Opcode.PUSH31), @intFromEnum(Opcode.PUSH32) => blk: {
                    const idx_val = metadata_elem.pointer_index;
                    break :blk &self.u256_constants[idx_val];
                },
                
                // Synthetic fusion opcodes - inline values
                @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE), @intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE), 
                @intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE), @intFromEnum(OpcodeSynthetic.PUSH_JUMP_INLINE), 
                @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_INLINE) => metadata_elem.inline_value,
                
                // Synthetic fusion opcodes - pointer values
                @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER), @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER), 
                @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER), @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER), 
                @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER) => blk: {
                    const idx_val = metadata_elem.pointer_index;
                    break :blk &self.u256_constants[idx_val];
                },
                
                // JUMPDEST returns the metadata directly or via pointer
                @intFromEnum(Opcode.JUMPDEST) => if (@sizeOf(usize) >= @sizeOf(JumpDestMetadata))
                    metadata_elem.jumpdest_metadata
                else
                    metadata_elem.jumpdest_pointer,
                
                // PC returns the PC value
                @intFromEnum(Opcode.PC) => @as(PcType, @truncate(metadata_elem.inline_value)),
                
                else => unreachable, // Compile error already prevents this
            };
        }
        
        /// Get the next instruction handler and advance the instruction pointer.
        /// Advances by 1 or 2 based on whether the opcode has metadata.
        pub fn getNextInstruction(
            self: *const Self,
            idx: *InstructionIndexType,
            comptime opcode: anytype,
        ) *const HandlerFn {
            // Convert opcode to u8 value for uniform handling
            const opcode_value = comptime blk: {
                break :blk if (@TypeOf(opcode) == u8)
                    opcode
                else if (@TypeOf(opcode) == Opcode)
                    @intFromEnum(opcode)
                else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                    @intFromEnum(@field(Opcode, @tagName(opcode)))
                else
                    @compileError("Invalid opcode type");
            };
                
            // Check if opcode has metadata
            const has_metadata = comptime switch (opcode_value) {
                // PUSH opcodes have metadata (except PUSH0)
                @intFromEnum(Opcode.PUSH1), @intFromEnum(Opcode.PUSH2), @intFromEnum(Opcode.PUSH3), @intFromEnum(Opcode.PUSH4),
                @intFromEnum(Opcode.PUSH5), @intFromEnum(Opcode.PUSH6), @intFromEnum(Opcode.PUSH7), @intFromEnum(Opcode.PUSH8),
                @intFromEnum(Opcode.PUSH9), @intFromEnum(Opcode.PUSH10), @intFromEnum(Opcode.PUSH11), @intFromEnum(Opcode.PUSH12),
                @intFromEnum(Opcode.PUSH13), @intFromEnum(Opcode.PUSH14), @intFromEnum(Opcode.PUSH15), @intFromEnum(Opcode.PUSH16),
                @intFromEnum(Opcode.PUSH17), @intFromEnum(Opcode.PUSH18), @intFromEnum(Opcode.PUSH19), @intFromEnum(Opcode.PUSH20),
                @intFromEnum(Opcode.PUSH21), @intFromEnum(Opcode.PUSH22), @intFromEnum(Opcode.PUSH23), @intFromEnum(Opcode.PUSH24),
                @intFromEnum(Opcode.PUSH25), @intFromEnum(Opcode.PUSH26), @intFromEnum(Opcode.PUSH27), @intFromEnum(Opcode.PUSH28),
                @intFromEnum(Opcode.PUSH29), @intFromEnum(Opcode.PUSH30), @intFromEnum(Opcode.PUSH31), @intFromEnum(Opcode.PUSH32),
                // Synthetic fusion opcodes all have metadata
                @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE), @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER),
                @intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE), @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER),
                @intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE), @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER),
                @intFromEnum(OpcodeSynthetic.PUSH_JUMP_INLINE), @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER),
                @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_INLINE), @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER),
                // JUMPDEST has metadata
                @intFromEnum(Opcode.JUMPDEST),
                // PC has metadata (the original PC value)
                @intFromEnum(Opcode.PC) => true,
                // All other opcodes including PUSH0 have no metadata
                else => false,
            };

            // Get the current handler before advancing
            const handler = self.instructionStream[idx.*].handler;
            
            // Advance index
            idx.* += 1;
            if (has_metadata) idx.* += 1;
            
            // Return the handler
            return handler;
        }
        
        /// Get instruction index for a given PC value.
        /// Returns null if PC is not a valid instruction start.
        pub fn getInstructionIndexForPc(self: *const Self, pc: PcType) ?InstructionIndexType {
            return if (self.pc_to_instruction_idx) |map| return map.get(pc) else null;
        }
        
        /// Pretty print the plan for debugging.
        pub fn debugPrint(self: *const Self) void {
            std.debug.print("\n=== Plan Debug Visualization ===\n", .{});
            std.debug.print("Instruction Stream Length: {}\n", .{self.instructionStream.len});
            std.debug.print("Constants Length: {}\n", .{self.u256_constants.len});
            if (self.pc_to_instruction_idx) |map| {
                std.debug.print("PC Mappings: {} entries\n", .{map.count()});
            } else {
                std.debug.print("PC Mappings: none\n", .{});
            }
            std.debug.print("\nInstruction Stream:\n", .{});
            var i: InstructionIndexType = 0;
            while (i < self.instructionStream.len) : (i += 1) {
                const elem = self.instructionStream[i];
                if (@intFromPtr(elem.handler) > 0x10000) {
                    std.debug.print("  [{d:4}] Handler: ", .{i});
                    std.debug.print("0x{x}\n", .{@intFromPtr(elem.handler)});
                } else {
                    std.debug.print("  [{d:4}] Metadata: ", .{i});
                    if (@sizeOf(usize) == 8) {
                        const as_u64 = elem.inline_value;
                        if (as_u64 <= 0xFFFFFFFF) {
                            std.debug.print("inline_value = 0x{x} ({})", .{ as_u64, as_u64 });
                        } else {
                            const as_jumpdest = elem.jumpdest_metadata;
                            std.debug.print("jumpdest {{ gas: {}, min_stack: {}, max_stack: {} }}", .{
                                as_jumpdest.gas,
                                as_jumpdest.min_stack,
                                as_jumpdest.max_stack,
                            });
                        }
                    } else {
                        if (elem.pointer_index < self.u256_constants.len) {
                            std.debug.print("pointer_index = {} -> 0x{x}", .{ 
                                elem.pointer_index, 
                                self.u256_constants[elem.pointer_index] 
                            });
                        } else {
                            std.debug.print("inline_value = 0x{x} ({})", .{ 
                                elem.inline_value, 
                                elem.inline_value 
                            });
                        }
                    }
                    std.debug.print("\n", .{});
                }
            }
            
            if (self.u256_constants.len > 0) {
                std.debug.print("\nConstants Array:\n", .{});
                for (self.u256_constants, 0..) |constant, idx| {
                    std.debug.print("  [{}] = 0x{x}\n", .{ idx, constant });
                }
            }
            
            if (self.pc_to_instruction_idx) |map| {
                std.debug.print("\nPC to Instruction Mappings:\n", .{});
                var iter = map.iterator();
                var entries = std.ArrayList(struct { pc: PcType, idx: InstructionIndexType }).init(std.heap.page_allocator);
                defer entries.deinit();
                
                // Collect entries for sorting
                while (iter.next()) |entry| {
                    entries.append(.{ .pc = entry.key_ptr.*, .idx = entry.value_ptr.* }) catch {};
                }
                
                // Sort by PC
                const Entry = @TypeOf(entries.items[0]);
                std.sort.block(Entry, entries.items, {}, struct {
                    fn lessThan(_: void, a: Entry, b: Entry) bool {
                        return a.pc < b.pc;
                    }
                }.lessThan);
                
                // Print sorted entries
                for (entries.items) |entry| {
                    std.debug.print("  PC {d:4} -> Instruction {d:4}\n", .{ entry.pc, entry.idx });
                }
            }
            
            std.debug.print("=================================\n\n", .{});
        }
        
        /// Free Plan-owned slices.
        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            if (self.instructionStream.len > 0) allocator.free(self.instructionStream);
            if (self.u256_constants.len > 0) allocator.free(self.u256_constants);
            if (self.pc_to_instruction_idx) |*map| {
                map.deinit();
                self.pc_to_instruction_idx = null;
            }
            self.instructionStream = &.{};
            self.u256_constants = &.{};
        }
    };
}

/// Minimal plan that only contains bitmap analysis for lightweight execution.
/// Used by FrameMinimal for simple bytecode execution without optimization.
pub const PlanMinimal = struct {
    /// Raw bytecode reference
    bytecode: []const u8,
    /// Bitmap marking which bytes are push data (not opcodes)
    is_push_data: []u8,
    /// Bitmap marking which bytes are opcode starts
    is_op_start: []u8,
    /// Bitmap marking which bytes are JUMPDEST opcodes
    is_jumpdest: []u8,
    /// Jump table of handlers indexed by opcode
    handlers: [256]*const HandlerFn,
    
    /// Type aliases for compatibility with advanced plan
    pub const PcType = u16;
    pub const InstructionIndexType = u16;
    pub const WordType = u256;
    
    /// Get metadata for opcodes that have it, reading directly from bytecode.
    /// For PlanMinimal, idx is the PC value, not an instruction index.
    pub fn getMetadata(
        self: *const PlanMinimal,
        idx: *InstructionIndexType,
        comptime opcode: anytype,
    ) blk: {
        // Determine metadata type based on opcode
        const MetadataType = if (@TypeOf(opcode) == u8) {
            // For PlanMinimal, we don't support synthetic opcodes
            @compileError("PlanMinimal does not support synthetic opcodes");
        } else blk2: {
            const op = if (@TypeOf(opcode) == Opcode) 
                opcode 
            else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                @field(Opcode, @tagName(opcode))
            else 
                @compileError("Invalid opcode type");
            const MetadataType2 = switch (op) {
                // PUSH opcodes return granular types
                .PUSH1 => u8,
                .PUSH2 => u16,
                .PUSH3 => u24,
                .PUSH4 => u32,
                .PUSH5 => u40,
                .PUSH6 => u48,
                .PUSH7 => u56,
                .PUSH8 => u64,
                // Larger PUSH opcodes always return pointer for PlanMinimal
                .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16,
                .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24,
                .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => *const u256,
                
                // JUMPDEST returns a dummy metadata struct for compatibility
                .JUMPDEST => JumpDestMetadata,
                
                // PC returns the current PC value
                .PC => PcType,
                
                // All other opcodes have no metadata
                else => @compileError("Opcode has no metadata"),
            };
            break :blk2 MetadataType2;
        };
        break :blk MetadataType;
    } {
        const pc = idx.*;
        if (pc >= self.bytecode.len) {
            @panic("getMetadata: trying to read past end of bytecode");
        }
        
        const actual_op = comptime blk: {
            break :blk if (@TypeOf(opcode) == Opcode) 
                opcode 
            else 
                @field(Opcode, @tagName(opcode));
        };
            
        return switch (actual_op) {
            // PUSH opcodes read directly from bytecode
            .PUSH1 => blk: {
                if (pc + 1 >= self.bytecode.len) @panic("PUSH1 data out of bounds");
                break :blk self.bytecode[pc + 1];
            },
            .PUSH2 => blk: {
                if (pc + 2 >= self.bytecode.len) @panic("PUSH2 data out of bounds");
                var value: u16 = 0;
                value = (@as(u16, self.bytecode[pc + 1]) << 8) | self.bytecode[pc + 2];
                break :blk value;
            },
            .PUSH3 => blk: {
                if (pc + 3 >= self.bytecode.len) @panic("PUSH3 data out of bounds");
                var value: u24 = 0;
                value = (@as(u24, self.bytecode[pc + 1]) << 16) | 
                        (@as(u24, self.bytecode[pc + 2]) << 8) | 
                        self.bytecode[pc + 3];
                break :blk value;
            },
            .PUSH4 => blk: {
                if (pc + 4 >= self.bytecode.len) @panic("PUSH4 data out of bounds");
                var value: u32 = 0;
                var i: u8 = 0;
                while (i < 4) : (i += 1) {
                    value = (value << 8) | self.bytecode[pc + 1 + i];
                }
                break :blk value;
            },
            .PUSH5 => blk: {
                if (pc + 5 >= self.bytecode.len) @panic("PUSH5 data out of bounds");
                var value: u40 = 0;
                var i: u8 = 0;
                while (i < 5) : (i += 1) {
                    value = (value << 8) | self.bytecode[pc + 1 + i];
                }
                break :blk value;
            },
            .PUSH6 => blk: {
                if (pc + 6 >= self.bytecode.len) @panic("PUSH6 data out of bounds");
                var value: u48 = 0;
                var i: u8 = 0;
                while (i < 6) : (i += 1) {
                    value = (value << 8) | self.bytecode[pc + 1 + i];
                }
                break :blk value;
            },
            .PUSH7 => blk: {
                if (pc + 7 >= self.bytecode.len) @panic("PUSH7 data out of bounds");
                var value: u56 = 0;
                var i: u8 = 0;
                while (i < 7) : (i += 1) {
                    value = (value << 8) | self.bytecode[pc + 1 + i];
                }
                break :blk value;
            },
            .PUSH8 => blk: {
                if (pc + 8 >= self.bytecode.len) @panic("PUSH8 data out of bounds");
                var value: u64 = 0;
                var i: u8 = 0;
                while (i < 8) : (i += 1) {
                    value = (value << 8) | self.bytecode[pc + 1 + i];
                }
                break :blk value;
            },
            // Larger PUSH opcodes return pointer to static value
            .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16,
            .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24,
            .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => {
                // For simplicity in minimal plan, we panic on large pushes
                // Real implementation would need to store these values somewhere
                @panic("PlanMinimal does not support large PUSH opcodes");
            },
            
            // JUMPDEST returns dummy metadata
            .JUMPDEST => JumpDestMetadata{ .gas = 0, .min_stack = 0, .max_stack = 0 },
            
            // PC returns the current PC value
            .PC => @as(PcType, @intCast(pc)),
            
            else => unreachable, // Compile error already prevents this
        };
    }
    
    /// Get the next instruction handler and advance the PC.
    /// For PlanMinimal, this reads the opcode at current PC and returns handler.
    pub fn getNextInstruction(
        self: *const PlanMinimal,
        idx: *InstructionIndexType,
        comptime opcode: anytype,
    ) *const HandlerFn {
        const pc = idx.*;
        if (pc >= self.bytecode.len) {
            @panic("getNextInstruction: PC out of bounds");
        }
        
        // Determine if opcode has metadata to skip
        const has_metadata = comptime blk: {
            break :blk if (@TypeOf(opcode) == u8)
                // PlanMinimal doesn't support synthetic opcodes
                false
            else blk2: {
                const op = if (@TypeOf(opcode) == Opcode) 
                    opcode 
                else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                    @field(Opcode, @tagName(opcode))
                else 
                    @compileError("Invalid opcode type");
                const result = switch (op) {
                // PUSH opcodes have metadata
                .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7,
                .PUSH8, .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15,
                .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23,
                .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31,
                .PUSH32,
                // JUMPDEST has metadata
                .JUMPDEST,
                // PC has metadata
                .PC => true,
                // All other opcodes have no metadata
                else => false,
                };
                break :blk2 result;
            };
        };
        
        // Advance PC based on opcode
        if (has_metadata) {
            // For PUSH opcodes, skip the data bytes
            const op_value = self.bytecode[pc];
            if (op_value >= @intFromEnum(Opcode.PUSH1) and op_value <= @intFromEnum(Opcode.PUSH32)) {
                const push_bytes = op_value - (@intFromEnum(Opcode.PUSH1) - 1);
                idx.* = @intCast(pc + 1 + push_bytes);
            } else {
                // JUMPDEST and PC just advance by 1
                idx.* = @intCast(pc + 1);
            }
        } else {
            // No metadata, advance by 1
            idx.* = @intCast(pc + 1);
        }
        
        // Get the handler for the next instruction
        if (idx.* >= self.bytecode.len) {
            // Return STOP handler for end of bytecode
            return self.handlers[@intFromEnum(Opcode.STOP)];
        }
        
        const next_opcode = self.bytecode[idx.*];
        return self.handlers[next_opcode];
    }
    
    /// Get instruction index for a given PC value.
    /// For PlanMinimal, instruction index equals PC.
    pub fn getInstructionIndexForPc(self: *const PlanMinimal, pc: PcType) ?InstructionIndexType {
        _ = self;
        // In minimal plan, instruction index is the same as PC
        return pc;
    }
    
    /// Check if a PC is a valid JUMPDEST.
    pub fn isValidJumpDest(self: *const PlanMinimal, pc: usize) bool {
        if (pc >= self.bytecode.len) return false;
        return (self.is_jumpdest[pc >> 3] & (@as(u8, 1) << @intCast(pc & 7))) != 0;
    }
    
    /// Check if a PC is an opcode start (not push data).
    pub fn isOpcodeStart(self: *const PlanMinimal, pc: usize) bool {
        if (pc >= self.bytecode.len) return false;
        return (self.is_op_start[pc >> 3] & (@as(u8, 1) << @intCast(pc & 7))) != 0;
    }
    
    /// Free the allocated bitmaps.
    pub fn deinit(self: *PlanMinimal, allocator: std.mem.Allocator) void {
        if (self.is_push_data.len > 0) allocator.free(self.is_push_data);
        if (self.is_op_start.len > 0) allocator.free(self.is_op_start);
        if (self.is_jumpdest.len > 0) allocator.free(self.is_jumpdest);
        self.is_push_data = &.{};
        self.is_op_start = &.{};
        self.is_jumpdest = &.{};
    }
};

// Test handler function that does nothing (for testing)
fn testHandler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
    _ = frame;
    _ = plan;
    unreachable; // Test handlers don't actually execute
}


test "JumpDestMetadata size and alignment" {
    // Test that JumpDestMetadata is properly packed
    try std.testing.expectEqual(@as(usize, 8), @sizeOf(JumpDestMetadata));
    // On some platforms, packed structs might have larger alignment than expected
    // Just verify it's a power of 2 and reasonable
    const align_val = @alignOf(JumpDestMetadata);
    try std.testing.expect(align_val >= 1 and align_val <= 8);
    // Check if it's a power of 2
    try std.testing.expect((align_val & (align_val - 1)) == 0);
    
    // Test field offsets
    try std.testing.expectEqual(@as(usize, 0), @offsetOf(JumpDestMetadata, "gas"));
    try std.testing.expectEqual(@as(usize, 4), @offsetOf(JumpDestMetadata, "min_stack"));
    try std.testing.expectEqual(@as(usize, 6), @offsetOf(JumpDestMetadata, "max_stack"));
}

test "InstructionElement size equals usize" {
    try std.testing.expectEqual(@sizeOf(usize), @sizeOf(InstructionElement));
    
    if (@sizeOf(usize) == 8) {
        try std.testing.expectEqual(@sizeOf(InstructionElement64), @sizeOf(InstructionElement));
    } else if (@sizeOf(usize) == 4) {
        try std.testing.expectEqual(@sizeOf(InstructionElement32), @sizeOf(InstructionElement));
    }
}

test "PlanConfig validation" {
    // Valid configs should not cause compile errors
    const valid_cfg = PlanConfig{
        .WordType = u256,
        .maxBytecodeSize = 24_576,
    };
    comptime valid_cfg.validate();
    
    // Test PcType selection
    const small_cfg = PlanConfig{
        .maxBytecodeSize = 100,
    };
    try std.testing.expectEqual(u16, small_cfg.PcType());
    
    const large_cfg = PlanConfig{
        .maxBytecodeSize = 65_535,
    };
    try std.testing.expectEqual(u16, large_cfg.PcType());
}

test "Plan getMetadata for PUSH opcodes" {
    const allocator = std.testing.allocator;
    const PlanType = Plan(.{});
    
    // Create a plan with test data
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PUSH1 with value 42
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 42 });
    
    // PUSH2 with value 0x1234
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 0x1234 });
    
    // PUSH8 with max value
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = std.math.maxInt(u64) });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    defer plan.deinit(allocator);
    
    // Test PUSH1
    var idx: Plan.InstructionIndexType = 0;
    const push1_val = plan.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 42), push1_val);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 0), idx); // getMetadata doesn't advance idx
    
    // Test PUSH2
    idx = 2; // Move to PUSH2 handler position
    const push2_val = plan.getMetadata(&idx, .PUSH2);
    try std.testing.expectEqual(@as(u16, 0x1234), push2_val);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 2), idx);
    
    // Test PUSH8
    idx = 4; // Move to PUSH8 handler position
    const push8_val = plan.getMetadata(&idx, .PUSH8);
    try std.testing.expectEqual(@as(u64, std.math.maxInt(u64)), push8_val);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 4), idx);
}

test "Plan getMetadata for large PUSH opcodes" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Create constants array
    var constants = try allocator.alloc(Plan.WordType, 2);
    defer allocator.free(constants);
    constants[0] = 0x123456789ABCDEF0123456789ABCDEF0;
    constants[1] = std.math.maxInt(u256);
    
    // Create instruction stream
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PUSH32 pointing to constants[0]
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .pointer_index = 0 });
    
    // PUSH32 pointing to constants[1]
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .pointer_index = 1 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = constants,
        .pc_to_instruction_idx = null,
    };
    defer {
        allocator.free(plan.instructionStream);
        plan.instructionStream = &.{};
        plan.u256_constants = &.{};
    }
    
    // Test PUSH32
    var idx: Plan.InstructionIndexType = 0;
    const push32_ptr = plan.getMetadata(&idx, .PUSH32);
    try std.testing.expectEqual(@as(u256, 0x123456789ABCDEF0123456789ABCDEF0), push32_ptr.*);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 0), idx); // getMetadata doesn't advance idx
    
    // Test another PUSH32
    idx = 2; // Move to next PUSH32 handler position
    const push32_ptr2 = plan.getMetadata(&idx, .PUSH32);
    try std.testing.expectEqual(std.math.maxInt(u256), push32_ptr2.*);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 2), idx);
}

test "Plan getMetadata for JUMPDEST" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    const metadata = JumpDestMetadata{
        .gas = 100,
        .min_stack = 2,
        .max_stack = 5,
    };
    
    // On 64-bit platforms, metadata fits inline
    if (@sizeOf(usize) >= @sizeOf(JumpDestMetadata)) {
        try stream.append(.{ .handler = &testHandler });
        try stream.append(.{ .jumpdest_metadata = metadata });
        
        var plan = Plan{
            .instructionStream = try stream.toOwnedSlice(),
            .u256_constants = &.{},
            .pc_to_instruction_idx = null,
        };
        defer plan.deinit(allocator);
        
        var idx: Plan.InstructionIndexType = 0;
        const jumpdest_meta = plan.getMetadata(&idx, .JUMPDEST);
        try std.testing.expectEqual(metadata.gas, jumpdest_meta.gas);
        try std.testing.expectEqual(metadata.min_stack, jumpdest_meta.min_stack);
        try std.testing.expectEqual(metadata.max_stack, jumpdest_meta.max_stack);
        try std.testing.expectEqual(@as(Plan.InstructionIndexType, 0), idx); // getMetadata doesn't advance idx
    }
}

test "Plan getMetadata for PC opcode" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PC with value 1234
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 1234 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    defer plan.deinit(allocator);
    
    var idx: Plan.InstructionIndexType = 0;
    const pc_val = plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(Plan.PcType, 1234), pc_val);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 0), idx); // getMetadata doesn't advance idx
}

test "Plan getMetadata for synthetic opcodes" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Create constants
    var constants = try allocator.alloc(Plan.WordType, 1);
    defer allocator.free(constants);
    constants[0] = 0xDEADBEEF;
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PUSH_ADD_INLINE with inline value
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 999 });
    
    // PUSH_MUL_POINTER pointing to constant
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .pointer_index = 0 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = constants,
        .pc_to_instruction_idx = null,
    };
    defer {
        allocator.free(plan.instructionStream);
        plan.instructionStream = &.{};
        plan.u256_constants = &.{};
    }
    
    // Test PUSH_ADD_INLINE
    var idx: Plan.InstructionIndexType = 0;
    const inline_val = plan.getMetadata(&idx, @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE));
    try std.testing.expectEqual(@as(usize, 999), inline_val);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 0), idx); // getMetadata doesn't advance idx
    
    // Test PUSH_MUL_POINTER
    idx = 2; // Move to next handler position
    const ptr_val = plan.getMetadata(&idx, @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER));
    try std.testing.expectEqual(@as(u256, 0xDEADBEEF), ptr_val.*);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 2), idx);
}

test "Plan getNextInstruction without metadata" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // ADD opcode (no metadata)
    try stream.append(.{ .handler = &testHandler });
    // Another opcode
    const handler2: *const HandlerFn = &testHandler;
    try stream.append(.{ .handler = handler2 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    defer plan.deinit(allocator);
    
    // Test opcode without metadata
    var idx: Plan.InstructionIndexType = 0;
    const handler = plan.getNextInstruction(&idx, .ADD);
    try std.testing.expectEqual(&testHandler, handler);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 1), idx);
}

test "Plan getNextInstruction with metadata" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PUSH1 with metadata
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 42 });
    // Next instruction
    const handler2: *const HandlerFn = &testHandler;
    try stream.append(.{ .handler = handler2 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    defer plan.deinit(allocator);
    
    // Test opcode with metadata
    var idx: Plan.InstructionIndexType = 0;
    const handler = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(&testHandler, handler);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 2), idx);
}

test "Plan deinit" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    var plan = Plan{
        .instructionStream = try allocator.alloc(InstructionElement, 10),
        .u256_constants = try allocator.alloc(Plan.WordType, 5),
        .pc_to_instruction_idx = null,
    };
    
    // Fill with dummy data
    for (plan.instructionStream) |*elem| {
        elem.* = .{ .handler = &testHandler };
    }
    for (plan.u256_constants) |*val| {
        val.* = 0;
    }
    
    // Deinit should free both arrays
    plan.deinit(allocator);
    try std.testing.expectEqual(@as(usize, 0), plan.instructionStream.len);
    try std.testing.expectEqual(@as(usize, 0), plan.u256_constants.len);
}

test "Plan with different WordType" {
    const Plan128 = Plan(.{ .WordType = u128 });
    try std.testing.expectEqual(u128, Plan128.WordType);
    
    const Plan512 = Plan(.{ .WordType = u512 });
    try std.testing.expectEqual(u512, Plan512.WordType);
}

test "Plan PcType selection based on maxBytecodeSize" {
    const SmallPlan = Plan(.{ .maxBytecodeSize = 1000 });
    try std.testing.expectEqual(u16, SmallPlan.PcType);
    try std.testing.expectEqual(u16, SmallPlan.InstructionIndexType);
    
    const LargePlan = Plan(.{ .maxBytecodeSize = 65535 });
    try std.testing.expectEqual(u16, LargePlan.PcType);
    try std.testing.expectEqual(u16, LargePlan.InstructionIndexType);
}

test "PlanMinimal basic functionality" {
    const allocator = std.testing.allocator;
    
    // Test bytecode: PUSH1 0x42, JUMPDEST, PUSH2 0x1234, STOP
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.STOP),
    };
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, &bytecode);
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan_minimal = try planner.create_minimal_plan(allocator, handlers);
    defer plan_minimal.deinit(allocator);
    
    // Test bytecode reference
    try std.testing.expectEqual(bytecode.len, plan_minimal.bytecode.len);
    try std.testing.expectEqualSlices(u8, &bytecode, plan_minimal.bytecode);
    
    // Test opcode starts
    try std.testing.expect(plan_minimal.isOpcodeStart(0)); // PUSH1
    try std.testing.expect(!plan_minimal.isOpcodeStart(1)); // PUSH data
    try std.testing.expect(plan_minimal.isOpcodeStart(2)); // JUMPDEST
    try std.testing.expect(plan_minimal.isOpcodeStart(3)); // PUSH2
    try std.testing.expect(!plan_minimal.isOpcodeStart(4)); // PUSH data
    try std.testing.expect(!plan_minimal.isOpcodeStart(5)); // PUSH data
    try std.testing.expect(plan_minimal.isOpcodeStart(6)); // STOP
    
    // Test JUMPDEST detection
    try std.testing.expect(!plan_minimal.isValidJumpDest(0)); // PUSH1
    try std.testing.expect(!plan_minimal.isValidJumpDest(1)); // data
    try std.testing.expect(plan_minimal.isValidJumpDest(2)); // JUMPDEST
    try std.testing.expect(!plan_minimal.isValidJumpDest(3)); // PUSH2
    
    // Test getMetadata
    var idx: PlanMinimal.InstructionIndexType = 0;
    const push1_val = plan_minimal.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 0x42), push1_val);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 0), idx); // getMetadata doesn't advance
    
    idx = 3; // PUSH2 position
    const push2_val = plan_minimal.getMetadata(&idx, .PUSH2);
    try std.testing.expectEqual(@as(u16, 0x1234), push2_val);
    
    // Test getNextInstruction
    idx = 0; // PUSH1
    const next_handler = plan_minimal.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 2), idx); // Should advance past PUSH1 data
    try std.testing.expectEqual(&testHandler, next_handler); // Should return handler for JUMPDEST
    
    // Test PC opcode metadata
    idx = 2; // Any valid PC
    const pc_val = plan_minimal.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimal.PcType, 2), pc_val);
    
    // Test getInstructionIndexForPc
    const inst_idx = plan_minimal.getInstructionIndexForPc(5);
    try std.testing.expectEqual(@as(?PlanMinimal.InstructionIndexType, 5), inst_idx);
}

test "PlanMinimal getMetadata for all PUSH opcodes" {
    const allocator = std.testing.allocator;
    
    // Test PUSH1 through PUSH8 (values that fit inline)
    {
        const bytecode = [_]u8{
            @intFromEnum(Opcode.PUSH1), 0xFF,
            @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
            @intFromEnum(Opcode.PUSH3), 0xAB, 0xCD, 0xEF,
            @intFromEnum(Opcode.PUSH4), 0x11, 0x22, 0x33, 0x44,
            @intFromEnum(Opcode.PUSH5), 0xAA, 0xBB, 0xCC, 0xDD, 0xEE,
            @intFromEnum(Opcode.PUSH6), 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB,
            @intFromEnum(Opcode.PUSH7), 0xFE, 0xDC, 0xBA, 0x98, 0x76, 0x54, 0x32,
            @intFromEnum(Opcode.PUSH8), 0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0,
            @intFromEnum(Opcode.STOP),
        };
        
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, &bytecode);
        defer planner.deinit();
        
        var handlers: [256]*const HandlerFn = undefined;
        for (&handlers) |*h| h.* = &testHandler;
        
        var plan = try planner.create_minimal_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        // Test PUSH1
        var idx: PlanMinimal.InstructionIndexType = 0;
        try std.testing.expectEqual(@as(u8, 0xFF), plan.getMetadata(&idx, .PUSH1));
        
        // Test PUSH2
        idx = 2;
        try std.testing.expectEqual(@as(u16, 0x1234), plan.getMetadata(&idx, .PUSH2));
        
        // Test PUSH3
        idx = 5;
        try std.testing.expectEqual(@as(u24, 0xABCDEF), plan.getMetadata(&idx, .PUSH3));
        
        // Test PUSH4
        idx = 9;
        try std.testing.expectEqual(@as(u32, 0x11223344), plan.getMetadata(&idx, .PUSH4));
        
        // Test PUSH5
        idx = 14;
        try std.testing.expectEqual(@as(u40, 0xAABBCCDDEE), plan.getMetadata(&idx, .PUSH5));
        
        // Test PUSH6
        idx = 20;
        try std.testing.expectEqual(@as(u48, 0x0123456789AB), plan.getMetadata(&idx, .PUSH6));
        
        // Test PUSH7
        idx = 27;
        try std.testing.expectEqual(@as(u56, 0xFEDCBA98765432), plan.getMetadata(&idx, .PUSH7));
        
        // Test PUSH8
        idx = 35;
        try std.testing.expectEqual(@as(u64, 0x123456789ABCDEF0), plan.getMetadata(&idx, .PUSH8));
    }
}

test "PlanMinimal getNextInstruction advances correctly" {
    const allocator = std.testing.allocator;
    
    const bytecode = [_]u8{
        @intFromEnum(Opcode.ADD),          // PC 0: no metadata
        @intFromEnum(Opcode.PUSH1), 0x42,  // PC 1: 1 byte metadata
        @intFromEnum(Opcode.MUL),          // PC 3: no metadata
        @intFromEnum(Opcode.PUSH3), 0x11, 0x22, 0x33, // PC 4: 3 byte metadata
        @intFromEnum(Opcode.JUMPDEST),     // PC 8: has metadata but advances by 1
        @intFromEnum(Opcode.PC),           // PC 9: has metadata but advances by 1
        @intFromEnum(Opcode.STOP),         // PC 10: no metadata
    };
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, &bytecode);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    var plan = try planner.create_minimal_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    var idx: PlanMinimal.InstructionIndexType = 0;
    
    // ADD advances by 1
    _ = plan.getNextInstruction(&idx, .ADD);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 1), idx);
    
    // PUSH1 advances by 2 (opcode + 1 data byte)
    _ = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 3), idx);
    
    // MUL advances by 1
    _ = plan.getNextInstruction(&idx, .MUL);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 4), idx);
    
    // PUSH3 advances by 4 (opcode + 3 data bytes)
    _ = plan.getNextInstruction(&idx, .PUSH3);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 8), idx);
    
    // JUMPDEST advances by 1
    _ = plan.getNextInstruction(&idx, .JUMPDEST);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 9), idx);
    
    // PC advances by 1
    _ = plan.getNextInstruction(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 10), idx);
    
    // STOP advances by 1
    _ = plan.getNextInstruction(&idx, .STOP);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 11), idx);
}

test "PlanMinimal JUMPDEST detection with PUSH data" {
    const allocator = std.testing.allocator;
    
    // Test that 0x5B inside PUSH data is not detected as JUMPDEST
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH2), 0x5B, 0x5B, // 0x5B bytes should not be JUMPDEST
        @intFromEnum(Opcode.JUMPDEST),          // This should be detected
        @intFromEnum(Opcode.PUSH1), 0x5B,        // This 0x5B should not be JUMPDEST
        @intFromEnum(Opcode.JUMPDEST),          // This should be detected
        @intFromEnum(Opcode.STOP),
    };
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, &bytecode);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    var plan = try planner.create_minimal_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Check JUMPDEST detection
    try std.testing.expect(!plan.isValidJumpDest(0)); // PUSH2
    try std.testing.expect(!plan.isValidJumpDest(1)); // PUSH data (0x5B)
    try std.testing.expect(!plan.isValidJumpDest(2)); // PUSH data (0x5B)
    try std.testing.expect(plan.isValidJumpDest(3));  // Real JUMPDEST
    try std.testing.expect(!plan.isValidJumpDest(4)); // PUSH1
    try std.testing.expect(!plan.isValidJumpDest(5)); // PUSH data (0x5B)
    try std.testing.expect(plan.isValidJumpDest(6));  // Real JUMPDEST
    try std.testing.expect(!plan.isValidJumpDest(7)); // STOP
}

test "PlanMinimal edge cases" {
    const allocator = std.testing.allocator;
    
    // Test empty bytecode
    {
        const bytecode = [_]u8{};
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, &bytecode);
        defer planner.deinit();
        
        var handlers: [256]*const HandlerFn = undefined;
        for (&handlers) |*h| h.* = &testHandler;
        
        var plan = try planner.create_minimal_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        try std.testing.expectEqual(@as(usize, 0), plan.bytecode.len);
    }
    
    // Test single opcode
    {
        const bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, &bytecode);
        defer planner.deinit();
        
        var handlers: [256]*const HandlerFn = undefined;
        for (&handlers) |*h| h.* = &testHandler;
        
        var plan = try planner.create_minimal_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        try std.testing.expect(plan.isOpcodeStart(0));
        try std.testing.expect(!plan.isValidJumpDest(0));
        
        var idx: PlanMinimal.InstructionIndexType = 0;
        const handler = plan.getNextInstruction(&idx, .STOP);
        try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 1), idx);
        try std.testing.expectEqual(&testHandler, handler); // Should return STOP handler
    }
    
    // Test truncated PUSH
    {
        const bytecode = [_]u8{
            @intFromEnum(Opcode.PUSH3), 0xAB, // Missing 2 bytes
        };
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, &bytecode);
        defer planner.deinit();
        
        var handlers: [256]*const HandlerFn = undefined;
        for (&handlers) |*h| h.* = &testHandler;
        
        var plan = try planner.create_minimal_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        // Should mark available bytes as push data
        try std.testing.expect(plan.isOpcodeStart(0));  // PUSH3
        try std.testing.expect(!plan.isOpcodeStart(1)); // push data
        // No more bytes, so no more marking
    }
}

test "PlanMinimal getNextInstruction returns correct handlers" {
    const allocator = std.testing.allocator;
    
    // Create different handler functions
    const addHandler = struct {
        fn handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            _ = frame; _ = plan;
            unreachable;
        }
    }.handler;
    
    const mulHandler = struct {
        fn handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            _ = frame; _ = plan;
            unreachable;
        }
    }.handler;
    
    const stopHandler = struct {
        fn handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            _ = frame; _ = plan;
            unreachable;
        }
    }.handler;
    
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.MUL),
        @intFromEnum(Opcode.STOP),
    };
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, &bytecode);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    handlers[@intFromEnum(Opcode.ADD)] = &addHandler;
    handlers[@intFromEnum(Opcode.MUL)] = &mulHandler;
    handlers[@intFromEnum(Opcode.STOP)] = &stopHandler;
    
    var plan = try planner.create_minimal_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    var idx: PlanMinimal.InstructionIndexType = 0;
    
    // PUSH1 should return handler for next opcode (ADD)
    var handler = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 2), idx);
    try std.testing.expectEqual(&addHandler, handler);
    
    // ADD should return handler for next opcode (MUL)
    handler = plan.getNextInstruction(&idx, .ADD);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 3), idx);
    try std.testing.expectEqual(&mulHandler, handler);
    
    // MUL should return handler for next opcode (STOP)
    handler = plan.getNextInstruction(&idx, .MUL);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 4), idx);
    try std.testing.expectEqual(&stopHandler, handler);
    
    // STOP at end should return STOP handler (for safety)
    handler = plan.getNextInstruction(&idx, .STOP);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 5), idx);
    try std.testing.expectEqual(&stopHandler, handler);
}

test "PlanMinimal PC opcode returns correct value" {
    const allocator = std.testing.allocator;
    
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,  // PC 0
        @intFromEnum(Opcode.PC),           // PC 2
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34, // PC 3
        @intFromEnum(Opcode.PC),           // PC 6
        @intFromEnum(Opcode.STOP),         // PC 7
    };
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, &bytecode);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    var plan = try planner.create_minimal_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Test PC at position 2
    var idx: PlanMinimal.InstructionIndexType = 2;
    const pc1 = plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimal.PcType, 2), pc1);
    
    // Test PC at position 6
    idx = 6;
    const pc2 = plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimal.PcType, 6), pc2);
}

test "Plan error boundary conditions" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Test empty instruction stream
    var plan = Plan{
        .instructionStream = &.{},
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    
    // Should handle empty stream gracefully
    try std.testing.expectEqual(@as(usize, 0), plan.instructionStream.len);
    try std.testing.expectEqual(@as(usize, 0), plan.u256_constants.len);
    
    // getInstructionIndexForPc with no mapping
    const inst_idx = plan.getInstructionIndexForPc(5);
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, null), inst_idx);
}

test "Plan PC to instruction mapping" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Create PC mapping
    var pc_map = std.AutoHashMap(Plan.PcType, Plan.InstructionIndexType).init(allocator);
    defer pc_map.deinit();
    
    try pc_map.put(0, 0);   // PC 0 -> Instruction 0
    try pc_map.put(1, 2);   // PC 1 -> Instruction 2 
    try pc_map.put(5, 4);   // PC 5 -> Instruction 4
    try pc_map.put(10, 8);  // PC 10 -> Instruction 8
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    try stream.resize(10); // Make sure we have enough instructions
    
    var plan = Plan{
        .instructionStream = stream.items,
        .u256_constants = &.{},
        .pc_to_instruction_idx = pc_map,
    };
    // Don't call deinit since we're borrowing the HashMap
    
    // Test mappings
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, 0), plan.getInstructionIndexForPc(0));
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, 2), plan.getInstructionIndexForPc(1));
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, 4), plan.getInstructionIndexForPc(5));
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, 8), plan.getInstructionIndexForPc(10));
    
    // Test non-existent mapping
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, null), plan.getInstructionIndexForPc(99));
}

test "Plan synthetic opcodes comprehensive" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Test all synthetic opcode variants
    const synthetic_opcodes = [_]u8{
        @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE),
        @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER),
        @intFromEnum(OpcodeSynthetic.PUSH_MUL_INLINE),
        @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER),
        @intFromEnum(OpcodeSynthetic.PUSH_DIV_INLINE),
        @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER),
        @intFromEnum(OpcodeSynthetic.PUSH_JUMP_INLINE),
        @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER),
        @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_INLINE),
        @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER),
    };
    
    // Create constants array
    var constants = try allocator.alloc(Plan.WordType, 5);
    defer allocator.free(constants);
    for (constants, 0..) |*c, i| {
        c.* = @as(u256, @intCast(1000 + i));
    }
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // Add handler+metadata pairs for each synthetic opcode
    for (synthetic_opcodes, 0..) |opcode, i| {
        try stream.append(.{ .handler = &testHandler });
        
        const is_pointer = (opcode == @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER) or
                           opcode == @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER) or
                           opcode == @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER) or
                           opcode == @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER) or
                           opcode == @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER));
        
        if (is_pointer) {
            try stream.append(.{ .pointer_index = @intCast(i % constants.len) });
        } else {
            try stream.append(.{ .inline_value = 500 + i });
        }
    }
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = constants,
        .pc_to_instruction_idx = null,
    };
    defer {
        allocator.free(plan.instructionStream);
        plan.instructionStream = &.{};
        plan.u256_constants = &.{};
    }
    
    // Test each synthetic opcode
    var idx: Plan.InstructionIndexType = 0;
    for (synthetic_opcodes) |opcode| {
        const is_pointer = (opcode == @intFromEnum(OpcodeSynthetic.PUSH_ADD_POINTER) or
                           opcode == @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER) or
                           opcode == @intFromEnum(OpcodeSynthetic.PUSH_DIV_POINTER) or
                           opcode == @intFromEnum(OpcodeSynthetic.PUSH_JUMP_POINTER) or
                           opcode == @intFromEnum(OpcodeSynthetic.PUSH_JUMPI_POINTER));
        
        if (is_pointer) {
            const ptr_val = plan.getMetadata(&idx, opcode);
            try std.testing.expect(ptr_val.* >= 1000 and ptr_val.* < 1005);
        } else {
            const inline_val = plan.getMetadata(&idx, opcode);
            try std.testing.expect(inline_val >= 500 and inline_val < 520);
        }
        
        // Test getNextInstruction advances correctly
        const start_idx = idx;
        _ = plan.getNextInstruction(&idx, opcode);
        try std.testing.expectEqual(start_idx + 2, idx); // Should advance by 2 (handler + metadata)
    }
}

test "Plan large instruction stream" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Create a large instruction stream to test memory handling
    const stream_size = 1000;
    var stream = try allocator.alloc(InstructionElement, stream_size);
    defer allocator.free(stream);
    
    // Fill with alternating handlers and metadata
    for (stream, 0..) |*elem, i| {
        if (i % 2 == 0) {
            elem.* = .{ .handler = &testHandler };
        } else {
            elem.* = .{ .inline_value = @intCast(i) };
        }
    }
    
    var large_constants = try allocator.alloc(Plan.WordType, 100);
    defer allocator.free(large_constants);
    for (large_constants, 0..) |*c, i| {
        c.* = @as(u256, @intCast(i * i));
    }
    
    var plan = Plan{
        .instructionStream = stream,
        .u256_constants = large_constants,
        .pc_to_instruction_idx = null,
    };
    // Don't call deinit since we're borrowing the slices
    
    // Test accessing different parts of the large stream
    const test_indices = [_]usize{ 0, 100, 500, 900, 998 };
    for (test_indices) |i| {
        if (i % 2 == 0) {
            // Handler element
            try std.testing.expectEqual(&testHandler, plan.instructionStream[i].handler);
        } else {
            // Metadata element
            try std.testing.expectEqual(@as(usize, i), plan.instructionStream[i].inline_value);
        }
    }
    
    // Test constants access
    for (0..10) |i| {
        try std.testing.expectEqual(@as(u256, @intCast(i * i)), plan.u256_constants[i]);
    }
}

test "Plan memory management stress test" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Create and destroy multiple plans to test memory management
    for (0..20) |cycle| {
        const stream_size = 10 + cycle;
        const constants_size = 5 + (cycle % 10);
        
        var plan = Plan{
            .instructionStream = try allocator.alloc(InstructionElement, stream_size),
            .u256_constants = try allocator.alloc(Plan.WordType, constants_size),
            .pc_to_instruction_idx = std.AutoHashMap(Plan.PcType, Plan.InstructionIndexType).init(allocator),
        };
        
        // Fill with test data
        for (plan.instructionStream, 0..) |*elem, i| {
            elem.* = if (i % 2 == 0) 
                .{ .handler = &testHandler } 
            else 
                .{ .inline_value = @intCast(cycle * 100 + i) };
        }
        
        for (plan.u256_constants, 0..) |*c, i| {
            c.* = @as(u256, @intCast(cycle * 1000 + i));
        }
        
        // Add some PC mappings
        try plan.pc_to_instruction_idx.?.put(@intCast(cycle), @intCast(cycle % stream_size));
        try plan.pc_to_instruction_idx.?.put(@intCast(cycle + 100), @intCast((cycle + 1) % stream_size));
        
        // Test basic functionality
        try std.testing.expectEqual(stream_size, plan.instructionStream.len);
        try std.testing.expectEqual(constants_size, plan.u256_constants.len);
        try std.testing.expectEqual(@as(u32, 2), plan.pc_to_instruction_idx.?.count());
        
        // Verify data integrity
        try std.testing.expectEqual(&testHandler, plan.instructionStream[0].handler);
        if (stream_size > 1) {
            try std.testing.expectEqual(@as(usize, cycle * 100 + 1), plan.instructionStream[1].inline_value);
        }
        try std.testing.expectEqual(@as(u256, @intCast(cycle * 1000)), plan.u256_constants[0]);
        
        // Clean up
        plan.deinit(allocator);
        
        // Verify cleanup
        try std.testing.expectEqual(@as(usize, 0), plan.instructionStream.len);
        try std.testing.expectEqual(@as(usize, 0), plan.u256_constants.len);
        try std.testing.expectEqual(@as(?std.AutoHashMap(Plan.PcType, Plan.InstructionIndexType), null), plan.pc_to_instruction_idx);
    }
}

test "Plan platform-specific InstructionElement handling" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Test that InstructionElement behaves correctly on current platform
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // Test different element types
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = if (@sizeOf(usize) == 8) 0x123456789ABCDEF0 else 0x12345678 });
    try stream.append(.{ .pointer_index = 42 });
    
    if (@sizeOf(usize) >= @sizeOf(JumpDestMetadata)) {
        const metadata = JumpDestMetadata{ .gas = 1000, .min_stack = -5, .max_stack = 10 };
        try stream.append(.{ .jumpdest_metadata = metadata });
    } else {
        // On 32-bit platforms, we'd store a pointer to metadata
        const metadata = try allocator.create(JumpDestMetadata);
        defer allocator.destroy(metadata);
        metadata.* = JumpDestMetadata{ .gas = 1000, .min_stack = -5, .max_stack = 10 };
        try stream.append(.{ .jumpdest_pointer = metadata });
    }
    
    var plan = Plan{
        .instructionStream = stream.items,
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    
    // Test element access
    try std.testing.expectEqual(&testHandler, plan.instructionStream[0].handler);
    
    const expected_inline = if (@sizeOf(usize) == 8) 0x123456789ABCDEF0 else 0x12345678;
    try std.testing.expectEqual(expected_inline, plan.instructionStream[1].inline_value);
    
    try std.testing.expectEqual(@as(usize, 42), plan.instructionStream[2].pointer_index);
    
    // Test metadata access
    if (@sizeOf(usize) >= @sizeOf(JumpDestMetadata)) {
        const metadata = plan.instructionStream[3].jumpdest_metadata;
        try std.testing.expectEqual(@as(u32, 1000), metadata.gas);
        try std.testing.expectEqual(@as(i16, -5), metadata.min_stack);
        try std.testing.expectEqual(@as(i16, 10), metadata.max_stack);
    } else {
        const metadata_ptr = plan.instructionStream[3].jumpdest_pointer;
        try std.testing.expectEqual(@as(u32, 1000), metadata_ptr.gas);
        try std.testing.expectEqual(@as(i16, -5), metadata_ptr.min_stack);
        try std.testing.expectEqual(@as(i16, 10), metadata_ptr.max_stack);
    }
}

test "Plan getNextInstruction edge cases" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // Create instruction stream: handler, metadata, handler
    try stream.append(.{ .handler = &testHandler });  // idx 0
    try stream.append(.{ .inline_value = 42 });       // idx 1 (metadata)
    try stream.append(.{ .handler = &testHandler });  // idx 2
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    defer plan.deinit(allocator);
    
    // Test getNextInstruction with metadata opcode
    var idx: Plan.InstructionIndexType = 0;
    const handler1 = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(&testHandler, handler1);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 2), idx); // Should skip metadata
    
    // Test getNextInstruction without metadata opcode
    idx = 2;
    const handler2 = plan.getNextInstruction(&idx, .ADD);
    try std.testing.expectEqual(&testHandler, handler2);
    try std.testing.expectEqual(@as(Plan.InstructionIndexType, 3), idx); // Should advance by 1
}

test "Plan debugPrint functionality" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Create a simple plan for debug printing
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 42 });
    try stream.append(.{ .handler = &testHandler });
    
    var constants = try allocator.alloc(Plan.WordType, 2);
    defer allocator.free(constants);
    constants[0] = 0xDEADBEEF;
    constants[1] = 0xCAFEBABE;
    
    var pc_map = std.AutoHashMap(Plan.PcType, Plan.InstructionIndexType).init(allocator);
    defer pc_map.deinit();
    try pc_map.put(0, 0);
    try pc_map.put(10, 2);
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = constants,
        .pc_to_instruction_idx = pc_map,
    };
    defer {
        allocator.free(plan.instructionStream);
        plan.instructionStream = &.{};
        plan.u256_constants = &.{};
        plan.pc_to_instruction_idx = null;
    }
    
    // debugPrint should not crash and should handle all data types
    // We can't easily test the output, but we can ensure it doesn't crash
    plan.debugPrint();
    
    // Verify the plan is still valid after debug printing
    try std.testing.expectEqual(@as(usize, 3), plan.instructionStream.len);
    try std.testing.expectEqual(@as(usize, 2), plan.u256_constants.len);
    try std.testing.expectEqual(@as(u32, 2), plan.pc_to_instruction_idx.?.count());
}

test "Plan configuration validation comprehensive" {
    const allocator = std.testing.allocator;
    
    // Test all valid configuration combinations
    const valid_configs = [_]PlanConfig{
        .{}, // Default
        .{ .WordType = u128 },
        .{ .WordType = u512 },
        .{ .maxBytecodeSize = 1000 },
        .{ .maxBytecodeSize = 65535 },
        .{ .maxBytecodeSize = 100000 },
        .{ .WordType = u128, .maxBytecodeSize = 10000 },
        .{ .WordType = u512, .maxBytecodeSize = 50000 },
    };
    
    inline for (valid_configs) |cfg| {
        comptime cfg.validate();
        const Plan = Plan(cfg);
        
        // Test type selections
        try std.testing.expectEqual(cfg.WordType, Plan.WordType);
        if (cfg.maxBytecodeSize <= 65535) {
            try std.testing.expectEqual(u16, Plan.PcType);
        } else {
            try std.testing.expectEqual(u32, Plan.PcType);
        }
        try std.testing.expectEqual(Plan.PcType, Plan.InstructionIndexType);
    }
    
    // Test creating plans with different configs
    const Plan128 = Plan(.{ .WordType = u128 });
    var plan128 = Plan128{
        .instructionStream = &.{},
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    try std.testing.expectEqual(u128, @TypeOf(plan128.u256_constants).Elem);
    
    const Plan512 = Plan(.{ .WordType = u512 });
    var plan512 = Plan512{
        .instructionStream = &.{},
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    try std.testing.expectEqual(u512, @TypeOf(plan512.u256_constants).Elem);
}

test "Plan integration with all opcode types" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Create comprehensive instruction stream covering all opcode categories
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    var constants = try allocator.alloc(Plan.WordType, 10);
    defer allocator.free(constants);
    for (constants, 0..) |*c, i| {
        c.* = @as(u256, @intCast(0x1000 + i));
    }
    
    // Regular PUSH opcodes (PUSH1-PUSH8)
    const small_push_opcodes = [_]Opcode{ .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8 };
    for (small_push_opcodes, 0..) |opcode, i| {
        try stream.append(.{ .handler = &testHandler });
        try stream.append(.{ .inline_value = @as(usize, 10 + i) });
    }
    
    // Large PUSH opcodes (pointer-based)
    const large_push_opcodes = [_]Opcode{ .PUSH9, .PUSH16, .PUSH32 };
    for (large_push_opcodes, 0..) |_, i| {
        try stream.append(.{ .handler = &testHandler });
        try stream.append(.{ .pointer_index = @intCast(i % constants.len) });
    }
    
    // JUMPDEST with metadata
    try stream.append(.{ .handler = &testHandler });
    if (@sizeOf(usize) >= @sizeOf(JumpDestMetadata)) {
        try stream.append(.{ .jumpdest_metadata = JumpDestMetadata{ .gas = 500, .min_stack = 1, .max_stack = 3 } });
    } else {
        const metadata = try allocator.create(JumpDestMetadata);
        defer allocator.destroy(metadata);
        metadata.* = JumpDestMetadata{ .gas = 500, .min_stack = 1, .max_stack = 3 };
        try stream.append(.{ .jumpdest_pointer = metadata });
    }
    
    // PC opcode
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 1234 });
    
    // Synthetic opcodes
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 999 });
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .pointer_index = 5 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = constants,
        .pc_to_instruction_idx = null,
    };
    defer {
        allocator.free(plan.instructionStream);
        plan.instructionStream = &.{};
        plan.u256_constants = &.{};
    }
    
    // Test all small PUSH opcodes
    var idx: Plan.InstructionIndexType = 0;
    for (small_push_opcodes, 0..) |opcode, i| {
        const metadata = plan.getMetadata(&idx, opcode);
        const expected: usize = 10 + i;
        
        switch (opcode) {
            .PUSH1 => try std.testing.expectEqual(@as(u8, @intCast(expected)), metadata),
            .PUSH2 => try std.testing.expectEqual(@as(u16, @intCast(expected)), metadata),
            .PUSH3 => try std.testing.expectEqual(@as(u24, @intCast(expected)), metadata),
            .PUSH4 => try std.testing.expectEqual(@as(u32, @intCast(expected)), metadata),
            .PUSH5 => try std.testing.expectEqual(@as(u40, @intCast(expected)), metadata),
            .PUSH6 => try std.testing.expectEqual(@as(u48, @intCast(expected)), metadata),
            .PUSH7 => try std.testing.expectEqual(@as(u56, @intCast(expected)), metadata),
            .PUSH8 => try std.testing.expectEqual(@as(u64, @intCast(expected)), metadata),
            else => unreachable,
        }
        
        _ = plan.getNextInstruction(&idx, opcode);
    }
    
    // Test large PUSH opcodes
    for (large_push_opcodes, 0..) |opcode, i| {
        const metadata = plan.getMetadata(&idx, opcode);
        const expected_value = constants[i % constants.len];
        try std.testing.expectEqual(expected_value, metadata.*);
        _ = plan.getNextInstruction(&idx, opcode);
    }
    
    // Test JUMPDEST
    const jumpdest_metadata = plan.getMetadata(&idx, .JUMPDEST);
    try std.testing.expectEqual(@as(u32, 500), jumpdest_metadata.gas);
    try std.testing.expectEqual(@as(i16, 1), jumpdest_metadata.min_stack);
    try std.testing.expectEqual(@as(i16, 3), jumpdest_metadata.max_stack);
    _ = plan.getNextInstruction(&idx, .JUMPDEST);
    
    // Test PC
    const pc_metadata = plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(Plan.PcType, 1234), pc_metadata);
    _ = plan.getNextInstruction(&idx, .PC);
    
    // Test synthetic opcodes
    const synthetic_inline = plan.getMetadata(&idx, @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE));
    try std.testing.expectEqual(@as(usize, 999), synthetic_inline);
    _ = plan.getNextInstruction(&idx, @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE));
    
    const synthetic_pointer = plan.getMetadata(&idx, @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER));
    try std.testing.expectEqual(constants[5], synthetic_pointer.*);
    _ = plan.getNextInstruction(&idx, @intFromEnum(OpcodeSynthetic.PUSH_MUL_POINTER));
}

test "Plan and PlanMinimal interoperability" {
    const allocator = std.testing.allocator;
    
    // Test that both plan types handle the same bytecode correctly
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PC),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    // Create PlanMinimal
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, &bytecode);
    defer planner.deinit();
    
    var minimal_plan = try planner.create_minimal_plan(allocator, handlers);
    defer minimal_plan.deinit(allocator);
    
    // Test that both plans identify the same opcode starts
    const expected_opcode_positions = [_]usize{ 0, 2, 5, 6, 7 };
    for (0..bytecode.len) |pc| {
        const should_be_opcode = for (expected_opcode_positions) |pos| {
            if (pc == pos) break true;
        } else false;
        
        try std.testing.expectEqual(should_be_opcode, minimal_plan.isOpcodeStart(pc));
    }
    
    // Test that both plans identify the same JUMPDESTs
    for (0..bytecode.len) |pc| {
        const should_be_jumpdest = (pc == 5); // Only PC 5 is JUMPDEST
        try std.testing.expectEqual(should_be_jumpdest, minimal_plan.isValidJumpDest(pc));
    }
    
    // Test metadata consistency for supported opcodes
    var idx: PlanMinimal.InstructionIndexType = 0;
    const push1_val = minimal_plan.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 0x42), push1_val);
    
    idx = 2;
    const push2_val = minimal_plan.getMetadata(&idx, .PUSH2);
    try std.testing.expectEqual(@as(u16, 0x1234), push2_val);
    
    idx = 6;
    const pc_val = minimal_plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimal.PcType, 6), pc_val);
    
    // Test navigation consistency
    idx = 0;
    _ = minimal_plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 2), idx);
    
    _ = minimal_plan.getNextInstruction(&idx, .PUSH2);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 5), idx);
    
    _ = minimal_plan.getNextInstruction(&idx, .JUMPDEST);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 6), idx);
}

test "Plan extreme edge cases and error resilience" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Test with zero-size arrays
    var empty_plan = Plan{
        .instructionStream = &.{},
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    
    // Should handle empty plan gracefully
    try std.testing.expectEqual(@as(usize, 0), empty_plan.instructionStream.len);
    try std.testing.expectEqual(@as(usize, 0), empty_plan.u256_constants.len);
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, null), empty_plan.getInstructionIndexForPc(0));
    
    // Test with HashMap but empty instruction stream
    var pc_map = std.AutoHashMap(Plan.PcType, Plan.InstructionIndexType).init(allocator);
    defer pc_map.deinit();
    try pc_map.put(0, 0);
    try pc_map.put(100, 50);
    
    empty_plan.pc_to_instruction_idx = pc_map;
    
    // Should return mappings even with empty instruction stream
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, 0), empty_plan.getInstructionIndexForPc(0));
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, 50), empty_plan.getInstructionIndexForPc(100));
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, null), empty_plan.getInstructionIndexForPc(999));
    
    // Test with extremely large numbers
    const large_pc: Plan.PcType = if (@sizeOf(Plan.PcType) == 2) 65535 else 4294967295;
    try pc_map.put(large_pc, large_pc / 2);
    try std.testing.expectEqual(@as(?Plan.InstructionIndexType, large_pc / 2), empty_plan.getInstructionIndexForPc(large_pc));
}

test "Plan comprehensive deinit behavior" {
    const allocator = std.testing.allocator;
    const Plan = Plan(.{});
    
    // Test deinit with various configurations
    const test_sizes = [_]usize{ 0, 1, 10, 100, 1000 };
    
    for (test_sizes) |size| {
        var plan = Plan{
            .instructionStream = if (size > 0) try allocator.alloc(InstructionElement, size) else &.{},
            .u256_constants = if (size > 0) try allocator.alloc(Plan.WordType, size / 2 + 1) else &.{},
            .pc_to_instruction_idx = if (size > 10) std.AutoHashMap(Plan.PcType, Plan.InstructionIndexType).init(allocator) else null,
        };
        
        // Initialize data
        for (plan.instructionStream, 0..) |*elem, i| {
            elem.* = if (i % 2 == 0) 
                .{ .handler = &testHandler } 
            else 
                .{ .inline_value = @intCast(i) };
        }
        
        for (plan.u256_constants, 0..) |*c, i| {
            c.* = @as(u256, @intCast(i * i));
        }
        
        if (plan.pc_to_instruction_idx) |*map| {
            try map.put(@intCast(size), @intCast(size / 3));
            try map.put(@intCast(size + 10), @intCast(size / 2));
        }
        
        // Verify initial state
        try std.testing.expectEqual(size, plan.instructionStream.len);
        if (size > 0) {
            try std.testing.expectEqual(size / 2 + 1, plan.u256_constants.len);
        }
        
        // Deinit should clean up everything
        plan.deinit(allocator);
        
        // Verify cleanup
        try std.testing.expectEqual(@as(usize, 0), plan.instructionStream.len);
        try std.testing.expectEqual(@as(usize, 0), plan.u256_constants.len);
        try std.testing.expectEqual(@as(?std.AutoHashMap(Plan.PcType, Plan.InstructionIndexType), null), plan.pc_to_instruction_idx);
    }
}

test "PlanMinimal JUMPDEST metadata" {
    const allocator = std.testing.allocator;
    
    const bytecode = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),     // PC 0
        @intFromEnum(Opcode.PUSH1), 0x05,  // PC 1
        @intFromEnum(Opcode.JUMP),         // PC 3
        @intFromEnum(Opcode.INVALID),      // PC 4
        @intFromEnum(Opcode.JUMPDEST),     // PC 5
        @intFromEnum(Opcode.STOP),         // PC 6
    };
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, &bytecode);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    var plan = try planner.create_minimal_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Test JUMPDEST metadata (should be dummy values)
    var idx: PlanMinimal.InstructionIndexType = 0;
    const meta1 = plan.getMetadata(&idx, .JUMPDEST);
    try std.testing.expectEqual(@as(u32, 0), meta1.gas);
    try std.testing.expectEqual(@as(i16, 0), meta1.min_stack);
    try std.testing.expectEqual(@as(i16, 0), meta1.max_stack);
    
    idx = 5;
    const meta2 = plan.getMetadata(&idx, .JUMPDEST);
    try std.testing.expectEqual(@as(u32, 0), meta2.gas);
    try std.testing.expectEqual(@as(i16, 0), meta2.min_stack);
    try std.testing.expectEqual(@as(i16, 0), meta2.max_stack);
}

test "PlanMinimal simulated execution flow" {
    const allocator = std.testing.allocator;
    
    // Simulate execution: PUSH1 42, PUSH1 10, ADD, STOP
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x2A,  // Push 42
        @intFromEnum(Opcode.PUSH1), 0x0A,  // Push 10
        @intFromEnum(Opcode.ADD),          // Add them
        @intFromEnum(Opcode.STOP),         // Stop
    };
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, &bytecode);
    
    // Create handler tracking array
    var handler_calls = std.ArrayList(u8).init(allocator);
    defer handler_calls.deinit();
    
    // Create mock handlers that track execution
    const push1Handler = struct {
        fn handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            _ = frame; _ = plan;
            unreachable;
        }
    }.handler;
    
    const addHandler = struct {
        fn handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            _ = frame; _ = plan;
            unreachable;
        }
    }.handler;
    
    const stopHandler = struct {
        fn handler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
            _ = frame; _ = plan;
            unreachable;
        }
    }.handler;
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    handlers[@intFromEnum(Opcode.PUSH1)] = &push1Handler;
    handlers[@intFromEnum(Opcode.ADD)] = &addHandler;
    handlers[@intFromEnum(Opcode.STOP)] = &stopHandler;
    
    var plan = try planner.create_minimal_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Simulate execution flow
    var idx: PlanMinimal.InstructionIndexType = 0;
    
    // Execute first PUSH1
    try std.testing.expectEqual(@as(u8, @intFromEnum(Opcode.PUSH1)), bytecode[idx]);
    const value1 = plan.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 0x2A), value1);
    const handler1 = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 2), idx);
    try std.testing.expectEqual(&push1Handler, handler1); // Next is PUSH1
    
    // Execute second PUSH1
    try std.testing.expectEqual(@as(u8, @intFromEnum(Opcode.PUSH1)), bytecode[idx]);
    const value2 = plan.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 0x0A), value2);
    const handler2 = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 4), idx);
    try std.testing.expectEqual(&addHandler, handler2); // Next is ADD
    
    // Execute ADD
    try std.testing.expectEqual(@as(u8, @intFromEnum(Opcode.ADD)), bytecode[idx]);
    const handler3 = plan.getNextInstruction(&idx, .ADD);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 5), idx);
    try std.testing.expectEqual(&stopHandler, handler3); // Next is STOP
    
    // Execute STOP
    try std.testing.expectEqual(@as(u8, @intFromEnum(Opcode.STOP)), bytecode[idx]);
    const handler4 = plan.getNextInstruction(&idx, .STOP);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 6), idx);
    try std.testing.expectEqual(&stopHandler, handler4); // End returns STOP handler
}
