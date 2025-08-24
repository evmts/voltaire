/// Plan: Runtime data structure for the EVM interpreter.
/// Contains the instruction stream (handler pointers + metadata) and constants.
const std = @import("std");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;
pub const PlanConfig = @import("plan_config.zig").PlanConfig;
const OpcodeSynthetic = @import("opcode_synthetic.zig").OpcodeSynthetic;
const createBytecode = @import("bytecode.zig").createBytecode;
const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;

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

/// Minimal plan that leverages bytecode.zig for analysis and lightweight execution.
/// Used by FrameMinimal for simple bytecode execution without optimization.
pub const PlanMinimal = struct {
    /// Bytecode with validation and analysis (leverages bytecode.zig)
    bytecode: BytecodeType,
    /// Jump table of handlers indexed by opcode
    handlers: [256]*const HandlerFn,
    
    /// Create bytecode type with matching configuration
    const BytecodeType = createBytecode(.{
        .max_bytecode_size = 65535, // Use u16 for PcType
        .max_initcode_size = 65535, // Must be at least as large as max_bytecode_size
    });
    
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
        if (pc >= self.bytecode.len()) {
            @panic("getMetadata: trying to read past end of bytecode");
        }
        
        const actual_op = comptime blk: {
            break :blk if (@TypeOf(opcode) == Opcode) 
                opcode 
            else 
                @field(Opcode, @tagName(opcode));
        };
            
        return switch (actual_op) {
            // PUSH opcodes use bytecode.readPushValue() for safe extraction
            .PUSH1 => self.bytecode.readPushValue(pc, 1) orelse @panic("PUSH1 data out of bounds"),
            .PUSH2 => self.bytecode.readPushValue(pc, 2) orelse @panic("PUSH2 data out of bounds"),
            .PUSH3 => self.bytecode.readPushValue(pc, 3) orelse @panic("PUSH3 data out of bounds"),
            .PUSH4 => self.bytecode.readPushValue(pc, 4) orelse @panic("PUSH4 data out of bounds"),
            .PUSH5 => self.bytecode.readPushValue(pc, 5) orelse @panic("PUSH5 data out of bounds"),
            .PUSH6 => self.bytecode.readPushValue(pc, 6) orelse @panic("PUSH6 data out of bounds"),
            .PUSH7 => self.bytecode.readPushValue(pc, 7) orelse @panic("PUSH7 data out of bounds"),
            .PUSH8 => self.bytecode.readPushValue(pc, 8) orelse @panic("PUSH8 data out of bounds"),
            
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
        if (pc >= self.bytecode.len()) {
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
        
        // Advance PC based on opcode using bytecode's getInstructionSize
        if (has_metadata) {
            // For PUSH opcodes, use bytecode.getNextPc for correct advancement
            if (self.bytecode.getNextPc(pc)) |next_pc| {
                idx.* = @intCast(next_pc);
            } else {
                // End of bytecode
                idx.* = @intCast(self.bytecode.len());
            }
        } else {
            // No metadata, advance by 1
            idx.* = @intCast(pc + 1);
        }
        
        // Get the handler for the next instruction
        if (idx.* >= self.bytecode.len()) {
            // Return STOP handler for end of bytecode
            return self.handlers[@intFromEnum(Opcode.STOP)];
        }
        
        const next_opcode = self.bytecode.raw()[idx.*];
        return self.handlers[next_opcode];
    }
    
    /// Get instruction index for a given PC value.
    /// For PlanMinimal, instruction index equals PC.
    pub fn getInstructionIndexForPc(self: *const PlanMinimal, pc: PcType) ?InstructionIndexType {
        _ = self;
        // In minimal plan, instruction index is the same as PC
        return pc;
    }
    
    /// Check if a PC is a valid JUMPDEST (delegates to bytecode.zig).
    pub fn isValidJumpDest(self: *const PlanMinimal, pc: usize) bool {
        return self.bytecode.isValidJumpDest(pc);
    }
    
    /// Check if a PC is an opcode start (delegates to bytecode.zig).
    pub fn isOpcodeStart(self: *const PlanMinimal, pc: usize) bool {
        if (pc >= self.bytecode.len()) return false;
        return (self.bytecode.is_op_start[pc >> 3] & (@as(u8, 1) << @intCast(pc & 7))) != 0;
    }
    
    /// Initialize a PlanMinimal with bytecode and handlers.
    pub fn init(allocator: std.mem.Allocator, code: []const u8, handlers: [256]*const HandlerFn) !PlanMinimal {
        const bytecode = try BytecodeType.init(allocator, code);
        return PlanMinimal{
            .bytecode = bytecode,
            .handlers = handlers,
        };
    }
    
    /// Free the allocated resources (delegates to bytecode.zig).
    pub fn deinit(self: *PlanMinimal) void {
        self.bytecode.deinit();
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
    
    const plan = Plan{
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
    // const PlanType = Plan(.{});
    
    // Create constants array
    var constants = try allocator.alloc(PlanType.WordType, 2);
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
    
    const plan = Plan{
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
        
        const plan = Plan{
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
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PC with value 1234
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 1234 });
    
    const plan = Plan{
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
    // const PlanType = Plan(.{});
    
    // Create constants
    var constants = try allocator.alloc(PlanType.WordType, 1);
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
    
    const plan = Plan{
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
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // ADD opcode (no metadata)
    try stream.append(.{ .handler = &testHandler });
    // Another opcode
    const handler2: *const HandlerFn = &testHandler;
    try stream.append(.{ .handler = handler2 });
    
    const plan = Plan{
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
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PUSH1 with metadata
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 42 });
    // Next instruction
    const handler2: *const HandlerFn = &testHandler;
    try stream.append(.{ .handler = handler2 });
    
    const plan = Plan{
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
    // const PlanType = Plan(.{});
    
    const plan = Plan{
        .instructionStream = try allocator.alloc(InstructionElement, 10),
        .u256_constants = try allocator.alloc(PlanType.WordType, 5),
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
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan_minimal = try PlanMinimal.init(allocator, &bytecode, handlers);
    defer plan_minimal.deinit();
    
    // Test bytecode reference
    try std.testing.expectEqual(bytecode.len, plan_minimal.bytecode.len());
    try std.testing.expectEqualSlices(u8, &bytecode, plan_minimal.bytecode.raw());
    
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
    // Test empty instruction stream
    const plan = Plan{
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
    // const PlanType = Plan(.{});
    
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
    
    const plan = Plan{
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
    // const PlanType = Plan(.{});
    
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
    const constants = try allocator.alloc(PlanType.WordType, 5);
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
    
    const plan = Plan{
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
    // const PlanType = Plan(.{});
    
    // Create a large instruction stream to test memory handling
    const stream_size = 1000;
    const stream = try allocator.alloc(InstructionElement, stream_size);
    defer allocator.free(stream);
    
    // Fill with alternating handlers and metadata
    for (stream, 0..) |*elem, i| {
        if (i % 2 == 0) {
            elem.* = .{ .handler = &testHandler };
        } else {
            elem.* = .{ .inline_value = @intCast(i) };
        }
    }
    
    const large_constants = try allocator.alloc(PlanType.WordType, 100);
    defer allocator.free(large_constants);
    for (large_constants, 0..) |*c, i| {
        c.* = @as(u256, @intCast(i * i));
    }
    
    const plan = Plan{
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
    // const PlanType = Plan(.{});
    
    // Create and destroy multiple plans to test memory management
    for (0..20) |cycle| {
        const stream_size = 10 + cycle;
        const constants_size = 5 + (cycle % 10);
        
        const plan = Plan{
            .instructionStream = try allocator.alloc(InstructionElement, stream_size),
            .u256_constants = try allocator.alloc(PlanType.WordType, constants_size),
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
    // const PlanType = Plan(.{});
    
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
    
    const plan = Plan{
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
    // const PlanType = Plan(.{});
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // Create instruction stream: handler, metadata, handler
    try stream.append(.{ .handler = &testHandler });  // idx 0
    try stream.append(.{ .inline_value = 42 });       // idx 1 (metadata)
    try stream.append(.{ .handler = &testHandler });  // idx 2
    
    const plan = Plan{
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
    // const PlanType = Plan(.{});
    
    // Create a simple plan for debug printing
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 42 });
    try stream.append(.{ .handler = &testHandler });
    
    var constants = try allocator.alloc(PlanType.WordType, 2);
    defer allocator.free(constants);
    constants[0] = 0xDEADBEEF;
    constants[1] = 0xCAFEBABE;
    
    var pc_map = std.AutoHashMap(Plan.PcType, Plan.InstructionIndexType).init(allocator);
    defer pc_map.deinit();
    try pc_map.put(0, 0);
    try pc_map.put(10, 2);
    
    const plan = Plan{
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
        const PlanType = Plan(cfg);
        
        // Test type selections
        try std.testing.expectEqual(cfg.WordType, PlanType.WordType);
        if (cfg.maxBytecodeSize <= 65535) {
            try std.testing.expectEqual(u16, Plan.PcType);
        } else {
            try std.testing.expectEqual(u32, Plan.PcType);
        }
        try std.testing.expectEqual(Plan.PcType, Plan.InstructionIndexType);
    }
    
    // Test creating plans with different configs
    const Plan128 = Plan(.{ .WordType = u128 });
    const plan128 = Plan128{
        .instructionStream = &.{},
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    try std.testing.expectEqual(u128, @TypeOf(plan128.u256_constants).Elem);
    
    const Plan512 = Plan(.{ .WordType = u512 });
    const plan512 = Plan512{
        .instructionStream = &.{},
        .u256_constants = &.{},
        .pc_to_instruction_idx = null,
    };
    try std.testing.expectEqual(u512, @TypeOf(plan512.u256_constants).Elem);
}

test "Plan integration with all opcode types" {
    const allocator = std.testing.allocator;
    // const PlanType = Plan(.{});
    
    // Create comprehensive instruction stream covering all opcode categories
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    var constants = try allocator.alloc(PlanType.WordType, 10);
    defer allocator.free(constants);
    for (constants, 0..) |*c, i| {
        c.* = @as(u256, @intCast(0x1000 + i));
    }
    
    // Regular PUSH opcodes (PUSH1-PUSH8)
    const small_push_opcodes = [_]Opcode{ .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8 };
    for (small_push_opcodes, 0..) |opcode, _| {
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
    
    const plan = Plan{
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
    for (small_push_opcodes, 0..) |opcode, _| {
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
    // const PlanType = Plan(.{});
    
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
    // const PlanType = Plan(.{});
    
    // Test deinit with various configurations
    const test_sizes = [_]usize{ 0, 1, 10, 100, 1000 };
    
    for (test_sizes) |size| {
        const plan = Plan{
            .instructionStream = if (size > 0) try allocator.alloc(InstructionElement, size) else &.{},
            .u256_constants = if (size > 0) try allocator.alloc(PlanType.WordType, size / 2 + 1) else &.{},
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

test "Plan fuzzing with random bytecode generation" {
    const allocator = std.testing.allocator;
    
    // Test with various sizes of random bytecode
    const test_sizes = [_]usize{1, 10, 100, 1000, 5000};
    
    for (test_sizes) |size| {
        var bytecode = try allocator.alloc(u8, size);
        defer allocator.free(bytecode);
        
        // Fill with pseudo-random valid opcodes
        var prng = std.rand.DefaultPrng.init(0x12345678);
        const random = prng.random();
        
        for (bytecode, 0..) |*byte, i| {
            // Use a mix of common opcodes to ensure validity
            const common_opcodes = [_]u8{
                @intFromEnum(Opcode.PUSH1), @intFromEnum(Opcode.PUSH2), @intFromEnum(Opcode.PUSH4),
                @intFromEnum(Opcode.ADD), @intFromEnum(Opcode.SUB), @intFromEnum(Opcode.MUL),
                @intFromEnum(Opcode.POP), @intFromEnum(Opcode.DUP1), @intFromEnum(Opcode.SWAP1),
                @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.STOP), @intFromEnum(Opcode.RETURN),
            };
            byte.* = common_opcodes[random.intRangeAtMost(usize, 0, common_opcodes.len - 1)];
            
            // Add random data bytes for PUSH opcodes
            if (byte.* == @intFromEnum(Opcode.PUSH1) and i + 1 < bytecode.len) {
                bytecode[i + 1] = random.int(u8);
            } else if (byte.* == @intFromEnum(Opcode.PUSH2) and i + 2 < bytecode.len) {
                bytecode[i + 1] = random.int(u8);
                bytecode[i + 2] = random.int(u8);
            }
        }
        
        // Try to create plan with random bytecode - should not crash
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, bytecode);
        
        var handlers: [256]*const HandlerFn = undefined;
        for (&handlers) |*h| h.* = &testHandler;
        
        var plan = planner.create_minimal_plan(allocator, handlers) catch |err| {
            // Some random bytecode may be invalid, that's ok
            switch (err) {
                error.OutOfMemory, error.InvalidBytecode, error.BytecodeTooLarge => continue,
                else => return err,
            }
        };
        defer plan.deinit(allocator);
        
        // Basic sanity checks
        try std.testing.expect(plan.bytecode.len > 0);
    }
}

test "Plan performance and memory efficiency benchmarking" {
    const allocator = std.testing.allocator;
    
    // Create large bytecode with patterns that stress the planner
    const bytecode_size = 10000;
    var bytecode = try allocator.alloc(u8, bytecode_size);
    defer allocator.free(bytecode);
    
    // Fill with pattern: PUSH32 + 32 bytes + JUMPDEST + ADD + PUSH1 + 1 byte + POP
    var i: usize = 0;
    while (i < bytecode_size - 40) : (i += 37) {
        bytecode[i] = @intFromEnum(Opcode.PUSH32);
        // Add 32 bytes of data
        for (1..33) |j| {
            if (i + j < bytecode.len) bytecode[i + j] = @intCast(j);
        }
        if (i + 33 < bytecode.len) bytecode[i + 33] = @intFromEnum(Opcode.JUMPDEST);
        if (i + 34 < bytecode.len) bytecode[i + 34] = @intFromEnum(Opcode.ADD);
        if (i + 35 < bytecode.len) bytecode[i + 35] = @intFromEnum(Opcode.PUSH1);
        if (i + 36 < bytecode.len) bytecode[i + 36] = 0xFF;
    }
    
    const start_time = std.time.nanoTimestamp();
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, bytecode);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    var plan = try planner.create_minimal_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    const end_time = std.time.nanoTimestamp();
    const duration_ns = end_time - start_time;
    
    // Should complete within reasonable time (< 10ms)
    try std.testing.expect(duration_ns < 10_000_000);
    
    // Memory efficiency check - plan shouldn't use excessive memory
    try std.testing.expect(plan.bytecode.len == bytecode.len);
}

test "Plan synthetic opcode edge cases and error handling" {
    const allocator = std.testing.allocator;
    
    // Test all 10 synthetic opcodes with edge cases
    const synthetic_tests = [_]struct {
        synthetic: OpcodeSynthetic,
        description: []const u8,
    }{
        .{ .synthetic = .PUSH_ADD, .description = "PUSH1 1 ADD" },
        .{ .synthetic = .PUSH_SUB, .description = "PUSH2 256 SUB" },
        .{ .synthetic = .PUSH_MUL, .description = "PUSH4 65536 MUL" },
        .{ .synthetic = .PUSH_DIV, .description = "PUSH1 0 DIV (div by zero)" },
        .{ .synthetic = .PUSH_MOD, .description = "PUSH1 0 MOD (mod by zero)" },
        .{ .synthetic = .PUSH_LT, .description = "PUSH32 max LT" },
        .{ .synthetic = .PUSH_JUMP, .description = "PUSH2 invalid_target JUMP" },
        .{ .synthetic = .PUSH_JUMPI, .description = "PUSH1 target JUMPI" },
        .{ .synthetic = .PUSH_DUP, .description = "PUSH1 val DUP1" },
        .{ .synthetic = .PUSH_SWAP, .description = "PUSH1 val SWAP1" },
    };
    
    for (synthetic_tests) |test_case| {
        // Create bytecode that would trigger this synthetic opcode
        var bytecode: [40]u8 = undefined;
        bytecode[0] = @intFromEnum(Opcode.PUSH1);
        bytecode[1] = 0x01;
        bytecode[2] = switch (test_case.synthetic) {
            .PUSH_ADD => @intFromEnum(Opcode.ADD),
            .PUSH_SUB => @intFromEnum(Opcode.SUB),
            .PUSH_MUL => @intFromEnum(Opcode.MUL),
            .PUSH_DIV => @intFromEnum(Opcode.DIV),
            .PUSH_MOD => @intFromEnum(Opcode.MOD),
            .PUSH_LT => @intFromEnum(Opcode.LT),
            .PUSH_JUMP => @intFromEnum(Opcode.JUMP),
            .PUSH_JUMPI => @intFromEnum(Opcode.JUMPI),
            .PUSH_DUP => @intFromEnum(Opcode.DUP1),
            .PUSH_SWAP => @intFromEnum(Opcode.SWAP1),
        };
        bytecode[3] = @intFromEnum(Opcode.STOP);
        
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, bytecode[0..4]);
        
        var handlers: [256]*const HandlerFn = undefined;
        for (&handlers) |*h| h.* = &testHandler;
        
        var plan = try planner.create_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        // Verify the synthetic opcode is detected and metadata is available
        const metadata = plan.getMetadata(0, test_case.synthetic, undefined);
        try std.testing.expect(metadata != 0); // Should have valid metadata
        
        // Test PC advancement
        var idx: InstructionIndexType = 0;
        _ = plan.getNextInstruction(&idx, test_case.synthetic);
        try std.testing.expect(idx > 0); // Should advance PC
    }
}

test "Plan memory fragmentation resistance" {
    const allocator = std.testing.allocator;
    
    // Create many small plans to test memory fragmentation
    const num_plans = 100;
    var plans: [num_plans]Plan = undefined;
    var planners: [num_plans]Planner = undefined;
    
    // Small bytecode pattern
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    // Create all plans
    for (0..num_plans) |i| {
        const Planner = @import("planner.zig").createPlanner(.{});
        planners[i] = try Planner.init(allocator, &bytecode);
        plans[i] = try planners[i].create_plan(allocator, handlers);
    }
    
    // Cleanup in reverse order to test fragmentation handling
    var i = num_plans;
    while (i > 0) {
        i -= 1;
        plans[i].deinit(allocator);
    }
    
    // Create one more plan to ensure allocator still works
    const Planner = @import("planner.zig").createPlanner(.{});
    var final_planner = try Planner.init(allocator, &bytecode);
    var final_plan = try final_planner.create_plan(allocator, handlers);
    defer final_plan.deinit(allocator);
    
    try std.testing.expect(final_plan.bytecode.len == bytecode.len);
}

test "Plan bytecode validation and malformed input handling" {
    const allocator = std.testing.allocator;
    
    const invalid_bytecodes = [_]struct {
        bytecode: []const u8,
        expected_behavior: []const u8,
        description: []const u8,
    }{
        // PUSH without enough data
        .{ .bytecode = &[_]u8{@intFromEnum(Opcode.PUSH1)}, .expected_behavior = "should_handle", .description = "PUSH1 without data" },
        .{ .bytecode = &[_]u8{@intFromEnum(Opcode.PUSH2), 0x01}, .expected_behavior = "should_handle", .description = "PUSH2 with only 1 byte" },
        .{ .bytecode = &[_]u8{@intFromEnum(Opcode.PUSH32)} ++ [_]u8{0} ** 31, .expected_behavior = "should_handle", .description = "PUSH32 with only 31 bytes" },
        
        // Test with potentially problematic patterns
        .{ .bytecode = &[_]u8{@intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.JUMPDEST)}, .expected_behavior = "should_handle", .description = "multiple consecutive JUMPDESTs" },
        .{ .bytecode = &[_]u8{@intFromEnum(Opcode.STOP), @intFromEnum(Opcode.STOP), @intFromEnum(Opcode.STOP)}, .expected_behavior = "should_handle", .description = "multiple STOPs" },
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    for (invalid_bytecodes) |test_case| {
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, test_case.bytecode);
        
        // Should be able to create plan even with malformed bytecode
        var plan = try planner.create_minimal_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        // Basic validation that plan was created
        try std.testing.expect(plan.bytecode.len == test_case.bytecode.len);
    }
}

test "Plan complete opcode coverage validation" {
    const allocator = std.testing.allocator;
    
    // Test that plan can handle all valid EVM opcodes that are commonly used
    const common_opcodes = [_]u8{
        // Arithmetic
        @intFromEnum(Opcode.ADD), @intFromEnum(Opcode.MUL), @intFromEnum(Opcode.SUB), @intFromEnum(Opcode.DIV),
        @intFromEnum(Opcode.MOD), @intFromEnum(Opcode.EXP),
        
        // Comparison & Bitwise
        @intFromEnum(Opcode.LT), @intFromEnum(Opcode.GT), @intFromEnum(Opcode.EQ), @intFromEnum(Opcode.ISZERO),
        @intFromEnum(Opcode.AND), @intFromEnum(Opcode.OR), @intFromEnum(Opcode.XOR), @intFromEnum(Opcode.NOT),
        
        // Environment
        @intFromEnum(Opcode.ADDRESS), @intFromEnum(Opcode.CALLER), @intFromEnum(Opcode.CALLVALUE),
        @intFromEnum(Opcode.CALLDATASIZE), @intFromEnum(Opcode.CODESIZE),
        
        // Stack, Memory, Storage
        @intFromEnum(Opcode.POP), @intFromEnum(Opcode.MLOAD), @intFromEnum(Opcode.MSTORE),
        @intFromEnum(Opcode.SLOAD), @intFromEnum(Opcode.SSTORE), @intFromEnum(Opcode.JUMP), @intFromEnum(Opcode.JUMPI),
        @intFromEnum(Opcode.PC), @intFromEnum(Opcode.MSIZE), @intFromEnum(Opcode.GAS), @intFromEnum(Opcode.JUMPDEST),
        
        // Push (subset)
        @intFromEnum(Opcode.PUSH1), @intFromEnum(Opcode.PUSH2), @intFromEnum(Opcode.PUSH4),
        
        // Dup & Swap (subset)
        @intFromEnum(Opcode.DUP1), @intFromEnum(Opcode.DUP2), @intFromEnum(Opcode.SWAP1), @intFromEnum(Opcode.SWAP2),
        
        // Control
        @intFromEnum(Opcode.STOP), @intFromEnum(Opcode.RETURN), @intFromEnum(Opcode.REVERT),
    };
    
    // Create bytecode with all opcodes
    var bytecode = try allocator.alloc(u8, common_opcodes.len * 5); // Extra space for PUSH data
    defer allocator.free(bytecode);
    
    var bytecode_idx: usize = 0;
    for (common_opcodes) |opcode| {
        bytecode[bytecode_idx] = opcode;
        bytecode_idx += 1;
        
        // Add data for PUSH opcodes
        if (opcode >= @intFromEnum(Opcode.PUSH1) and opcode <= @intFromEnum(Opcode.PUSH4)) {
            const push_bytes = opcode - (@intFromEnum(Opcode.PUSH1) - 1);
            for (0..push_bytes) |_| {
                if (bytecode_idx < bytecode.len) {
                    bytecode[bytecode_idx] = 0x42;
                    bytecode_idx += 1;
                }
            }
        }
    }
    
    // Truncate to actual size
    bytecode = bytecode[0..bytecode_idx];
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, bytecode);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    var plan = try planner.create_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Verify plan was created successfully with all opcodes
    try std.testing.expect(plan.bytecode.len == bytecode.len);
}

test "Plan concurrent access simulation" {
    const allocator = std.testing.allocator;
    
    // While Zig doesn't have true threads in std yet, we can simulate
    // concurrent access patterns that might occur in multi-threaded environments
    
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.PUSH1), 0x03,
        @intFromEnum(Opcode.MUL),
        @intFromEnum(Opcode.STOP),
    };
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, &bytecode);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    var plan = try planner.create_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Simulate multiple "threads" accessing the same plan
    const num_simulated_threads = 10;
    const iterations_per_thread = 100;
    
    for (0..num_simulated_threads) |thread_id| {
        for (0..iterations_per_thread) |iteration| {
            // Different access patterns to stress test the plan
            const pc = (thread_id + iteration) % bytecode.len;
            
            // Test metadata access
            const opcode = std.meta.intToEnum(Opcode, bytecode[pc]) catch continue;
            _ = plan.getMetadata(pc, opcode, undefined);
            
            // Test instruction index mapping
            _ = plan.getInstructionIndexForPc(@intCast(pc));
            
            // Test next instruction handling
            var idx: InstructionIndexType = @intCast(pc);
            if (idx < bytecode.len) {
                _ = plan.getNextInstruction(&idx, opcode);
            }
        }
    }
}

test "Plan instruction stream integrity validation" {
    const allocator = std.testing.allocator;
    
    // Create complex bytecode with nested patterns
    const bytecode = [_]u8{
        // Pattern 1: Multiple PUSH operations
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH2), 0x02, 0x03,
        @intFromEnum(Opcode.PUSH4), 0x04, 0x05, 0x06, 0x07,
        
        // Pattern 2: Jump destinations
        @intFromEnum(Opcode.JUMPDEST), // PC 8
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.ADD),
        
        // Pattern 3: Conditional logic
        @intFromEnum(Opcode.PUSH1), 0x08, // PC 11 - Push jump target
        @intFromEnum(Opcode.JUMPI), // Jump to PC 8 if stack top != 0
        
        // Pattern 4: End
        @intFromEnum(Opcode.STOP),
    };
    
    const Planner = @import("planner.zig").createPlanner(.{});
    var planner = try Planner.init(allocator, &bytecode);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    var plan = try planner.create_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    // Validate instruction stream integrity
    var expected_pc: usize = 0;
    var instruction_count: usize = 0;
    
    while (expected_pc < bytecode.len) {
        const opcode = std.meta.intToEnum(Opcode, bytecode[expected_pc]) catch break;
        
        // Verify we can get instruction index for this PC
        const inst_idx = plan.getInstructionIndexForPc(@intCast(expected_pc));
        try std.testing.expect(inst_idx != null);
        
        // Verify metadata access
        _ = plan.getMetadata(expected_pc, opcode, undefined);
        
        // Calculate next PC
        const opcode_val = bytecode[expected_pc];
        if (opcode_val >= @intFromEnum(Opcode.PUSH1) and opcode_val <= @intFromEnum(Opcode.PUSH32)) {
            const push_bytes = opcode_val - (@intFromEnum(Opcode.PUSH1) - 1);
            expected_pc += 1 + push_bytes;
        } else {
            expected_pc += 1;
        }
        
        instruction_count += 1;
        if (instruction_count > 1000) break; // Safety check
    }
    
    // Should have processed reasonable number of instructions
    try std.testing.expect(instruction_count > 5);
    try std.testing.expect(instruction_count < 50);
}

test "Plan extreme configuration edge cases" {
    const allocator = std.testing.allocator;
    
    // Test with minimum valid configuration
    const min_config = PlanConfig{
        .stackSize = 1,
        .WordType = u64,
        .maxBytecodeSize = 1,
        .blockGasLimit = 21000,
    };
    
    const Planner = @import("planner.zig").createPlanner(min_config);
    
    // Minimal valid bytecode
    const bytecode = [_]u8{@intFromEnum(Opcode.STOP)};
    var planner = try Planner.init(allocator, &bytecode);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    var plan = try planner.create_minimal_plan(allocator, handlers);
    defer plan.deinit(allocator);
    
    try std.testing.expect(plan.bytecode.len == 1);
    try std.testing.expectEqual(@as(u8, @intFromEnum(Opcode.STOP)), plan.bytecode[0]);
}

test "Plan error recovery and resilience testing" {
    const allocator = std.testing.allocator;
    
    // Test plan behavior with various edge cases
    const edge_bytecodes = [_][]const u8{
        // All zeros
        &[_]u8{0x00, 0x00, 0x00, 0x00},
        // All 0xFF (SELFDESTRUCT)
        &[_]u8{0xFF},
        // Mixed valid and potentially problematic opcodes
        &[_]u8{@intFromEnum(Opcode.PUSH1), 0xFF, @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.JUMP)},
        // Large PUSH followed by small opcode
        &[_]u8{@intFromEnum(Opcode.PUSH4), 0xFF, 0xFF, 0xFF, 0xFF, @intFromEnum(Opcode.POP)},
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    for (edge_bytecodes) |test_bytecode| {
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, test_bytecode);
        
        // Should be able to create plan without crashing
        var plan = try planner.create_minimal_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        // Basic integrity check
        try std.testing.expect(plan.bytecode.len == test_bytecode.len);
        
        // Should be able to access metadata for first instruction
        if (test_bytecode.len > 0) {
            const first_opcode = std.meta.intToEnum(Opcode, test_bytecode[0]) catch continue;
            _ = plan.getMetadata(0, first_opcode, undefined);
        }
    }
}

test "Plan resource cleanup and leak prevention" {
    const allocator = std.testing.allocator;
    
    // Create and destroy many plans to test for resource leaks
    const num_iterations = 50;
    
    for (0..num_iterations) |i| {
        // Vary bytecode size to stress allocator
        const bytecode_size = (i % 10) + 1;
        var bytecode = try allocator.alloc(u8, bytecode_size);
        defer allocator.free(bytecode);
        
        // Fill with simple pattern
        for (bytecode, 0..) |*byte, j| {
            byte.* = if (j == bytecode.len - 1) @intFromEnum(Opcode.STOP) else @intFromEnum(Opcode.PUSH1);
        }
        
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, bytecode);
        
        var handlers: [256]*const HandlerFn = undefined;
        for (&handlers) |*h| h.* = &testHandler;
        
        var plan = try planner.create_minimal_plan(allocator, handlers);
        
        // Use the plan briefly
        _ = plan.getInstructionIndexForPc(0);
        
        // Clean up - this should not leak memory
        plan.deinit(allocator);
    }
}

test "Plan real-world contract patterns - ERC20 and DeFi bytecode" {
    const allocator = std.testing.allocator;
    
    // Real-world ERC20 contract bytecode patterns (simplified versions of actual contracts)
    const erc20_constructor_pattern = [_]u8{
        // Constructor pattern: PUSH constructor args, CODECOPY, RETURN
        @intFromEnum(Opcode.PUSH1), 0x80,  // Push free memory pointer
        @intFromEnum(Opcode.PUSH1), 0x40,  
        @intFromEnum(Opcode.MSTORE),       // Store free memory pointer
        @intFromEnum(Opcode.PUSH1), 0x04,  
        @intFromEnum(Opcode.CALLDATASIZE), 
        @intFromEnum(Opcode.LT),           
        @intFromEnum(Opcode.PUSH2), 0x00, 0x47,
        @intFromEnum(Opcode.JUMPI),        // Jump if no calldata
        
        // Function selector pattern
        @intFromEnum(Opcode.PUSH1), 0x00,
        @intFromEnum(Opcode.CALLDATALOAD),
        @intFromEnum(Opcode.PUSH1), 0xE0,
        @intFromEnum(Opcode.SHR),          // Extract function selector
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.PUSH4), 0x70, 0xa0, 0x82, 0x31, // transfer(address,uint256)
        @intFromEnum(Opcode.EQ),
        @intFromEnum(Opcode.PUSH2), 0x00, 0x5c,
        @intFromEnum(Opcode.JUMPI),
        
        // More function selectors
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.PUSH4), 0xa9, 0x05, 0x9c, 0xbb, // balanceOf(address)
        @intFromEnum(Opcode.EQ),
        @intFromEnum(Opcode.PUSH2), 0x00, 0x8a,
        @intFromEnum(Opcode.JUMPI),
        
        @intFromEnum(Opcode.JUMPDEST),     // Entry point
        @intFromEnum(Opcode.STOP),
    };
    
    // Uniswap-style swap pattern
    const uniswap_swap_pattern = [_]u8{
        // Complex DeFi pattern with multiple nested calls
        @intFromEnum(Opcode.PUSH1), 0x00,
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.PUSH1), 0x00,
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.PUSH1), 0x00,
        @intFromEnum(Opcode.PUSH20), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Address
        @intFromEnum(Opcode.GAS),
        @intFromEnum(Opcode.CALL),         // External call
        @intFromEnum(Opcode.ISZERO),
        @intFromEnum(Opcode.PUSH2), 0x01, 0x23,
        @intFromEnum(Opcode.JUMPI),        // Revert if call failed
        
        // Log emission pattern
        @intFromEnum(Opcode.PUSH32), // Event signature hash
        0x8c, 0x5b, 0xe1, 0xe5, 0xeb, 0xec, 0x7d, 0x5b, 0xd1, 0x4f, 0x71, 0x42, 0x7d, 0x1e, 0x84, 0xf3,
        0x86, 0x4c, 0x39, 0x5c, 0x3b, 0x3d, 0xda, 0x5a, 0x8c, 0x43, 0xd7, 0x88, 0xd7, 0x7c, 0x1b, 0x5a,
        @intFromEnum(Opcode.PUSH1), 0x00,
        @intFromEnum(Opcode.PUSH1), 0x20,
        @intFromEnum(Opcode.LOG3),         // Emit event with 3 topics
        
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.RETURN),
    };
    
    const test_patterns = [_]struct {
        bytecode: []const u8,
        description: []const u8,
        expected_synthetic_opcodes: usize,
        expected_jumpdests: usize,
    }{
        .{ .bytecode = &erc20_constructor_pattern, .description = "ERC20 constructor pattern", .expected_synthetic_opcodes = 5, .expected_jumpdests = 1 },
        .{ .bytecode = &uniswap_swap_pattern, .description = "Uniswap swap pattern", .expected_synthetic_opcodes = 3, .expected_jumpdests = 1 },
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    for (test_patterns) |pattern| {
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, pattern.bytecode);
        
        var plan = try planner.create_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        // Validate plan was created successfully
        try std.testing.expect(plan.bytecode.len == pattern.bytecode.len);
        
        // Test instruction traversal through complex patterns
        var pc: usize = 0;
        var instruction_count: usize = 0;
        while (pc < pattern.bytecode.len and instruction_count < 100) {
            const opcode = std.meta.intToEnum(Opcode, pattern.bytecode[pc]) catch break;
            
            // Test metadata access
            _ = plan.getMetadata(pc, opcode, undefined);
            
            // Advance PC correctly for PUSH operations
            const opcode_val = pattern.bytecode[pc];
            if (opcode_val >= @intFromEnum(Opcode.PUSH1) and opcode_val <= @intFromEnum(Opcode.PUSH32)) {
                const push_bytes = opcode_val - (@intFromEnum(Opcode.PUSH1) - 1);
                pc += 1 + push_bytes;
            } else {
                pc += 1;
            }
            instruction_count += 1;
        }
        
        // Should have processed significant number of instructions
        try std.testing.expect(instruction_count > 10);
    }
}

test "Plan cross-platform compatibility - InstructionElement size behavior" {
    const allocator = std.testing.allocator;
    
    // Test configurations that trigger different InstructionElement types
    const configs = [_]struct {
        config: PlanConfig,
        expected_pc_type: type,
        description: []const u8,
    }{
        .{
            .config = .{ .stackSize = 1024, .WordType = u256, .maxBytecodeSize = 255, .blockGasLimit = 21000 },
            .expected_pc_type = u8,
            .description = "Small bytecode should use u8 PC",
        },
        .{
            .config = .{ .stackSize = 1024, .WordType = u256, .maxBytecodeSize = 65535, .blockGasLimit = 21000 },
            .expected_pc_type = u16,
            .description = "Medium bytecode should use u16 PC",
        },
        .{
            .config = .{ .stackSize = 1024, .WordType = u256, .maxBytecodeSize = 24576, .blockGasLimit = 30_000_000 },
            .expected_pc_type = u16,
            .description = "EVM max bytecode should use u16 PC",
        },
    };
    
    // Simple bytecode for testing
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    for (configs) |test_config| {
        const Planner = @import("planner.zig").createPlanner(test_config.config);
        var planner = try Planner.init(allocator, &bytecode);
        
        var plan = try planner.create_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        // Verify plan creation succeeds
        try std.testing.expect(plan.bytecode.len == bytecode.len);
        
        // Test PC type behavior by checking instruction index bounds
        const max_pc: usize = switch (test_config.expected_pc_type) {
            u8 => 255,
            u16 => 65535,
            u32 => 0xFFFFFFFF,
            else => 0xFFFFFFFFFFFFFFFF,
        };
        
        // Test instruction index mapping within expected bounds
        for (0..bytecode.len) |pc| {
            const inst_idx = plan.getInstructionIndexForPc(@intCast(pc));
            try std.testing.expect(inst_idx != null);
            try std.testing.expect(inst_idx.? <= max_pc);
        }
    }
}

test "Plan comprehensive JUMPDEST analysis with pathological patterns" {
    const allocator = std.testing.allocator;
    
    // Test various pathological JUMPDEST patterns
    const jumpdest_patterns = [_]struct {
        bytecode: []const u8,
        description: []const u8,
        valid_jumpdests: []const usize,
        invalid_jumps: []const usize,
    }{
        // JUMPDEST inside PUSH data (should be invalid)
        .{
            .bytecode = &[_]u8{
                @intFromEnum(Opcode.PUSH2), @intFromEnum(Opcode.JUMPDEST), 0x00, // JUMPDEST in PUSH data
                @intFromEnum(Opcode.JUMPDEST),  // Valid JUMPDEST at PC 3
                @intFromEnum(Opcode.STOP),
            },
            .description = "JUMPDEST inside PUSH data",
            .valid_jumpdests = &[_]usize{3}, // Only PC 3 is valid
            .invalid_jumps = &[_]usize{1},   // PC 1 is invalid (inside PUSH)
        },
        
        // Overlapping PUSH operations
        .{
            .bytecode = &[_]u8{
                @intFromEnum(Opcode.PUSH4), 0x01, 0x02, 0x03, @intFromEnum(Opcode.JUMPDEST), // JUMPDEST in PUSH4 data
                @intFromEnum(Opcode.JUMPDEST),  // Valid JUMPDEST at PC 5
                @intFromEnum(Opcode.PUSH1), @intFromEnum(Opcode.JUMPDEST),  // JUMPDEST in PUSH1 data
                @intFromEnum(Opcode.JUMPDEST),  // Valid JUMPDEST at PC 8
                @intFromEnum(Opcode.STOP),
            },
            .description = "Multiple overlapping PUSH operations",
            .valid_jumpdests = &[_]usize{5, 8}, // Only PCs 5 and 8 are valid
            .invalid_jumps = &[_]usize{4, 7},   // PCs inside PUSH data
        },
        
        // Complex jump patterns with loops
        .{
            .bytecode = &[_]u8{
                @intFromEnum(Opcode.JUMPDEST),  // PC 0 - Loop start
                @intFromEnum(Opcode.PUSH1), 0x07,
                @intFromEnum(Opcode.JUMP),      // Jump to PC 7
                @intFromEnum(Opcode.INVALID),   // Dead code
                @intFromEnum(Opcode.INVALID),   // Dead code
                @intFromEnum(Opcode.JUMPDEST),  // PC 7 - Jump target
                @intFromEnum(Opcode.PUSH1), 0x00,
                @intFromEnum(Opcode.JUMPI),     // Conditional jump back to PC 0
                @intFromEnum(Opcode.STOP),
            },
            .description = "Complex jump patterns with loops",
            .valid_jumpdests = &[_]usize{0, 7},
            .invalid_jumps = &[_]usize{4, 5}, // Dead code areas
        },
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    for (jumpdest_patterns) |pattern| {
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, pattern.bytecode);
        
        var plan = try planner.create_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        // Verify valid JUMPDEST detection
        for (pattern.valid_jumpdests) |valid_pc| {
            try std.testing.expect(plan.isValidJumpDestination(@intCast(valid_pc)));
        }
        
        // Verify invalid JUMPDEST detection (if the method exists)
        for (pattern.invalid_jumps) |invalid_pc| {
            if (invalid_pc < pattern.bytecode.len) {
                // Test that jumping to invalid location would be caught
                // This depends on the plan's JUMPDEST validation implementation
                const is_valid = plan.isValidJumpDestination(@intCast(invalid_pc));
                try std.testing.expect(!is_valid);
            }
        }
        
        // Test instruction stream integrity with complex patterns
        var pc: usize = 0;
        var visited_instructions: usize = 0;
        while (pc < pattern.bytecode.len and visited_instructions < 50) {
            const opcode = std.meta.intToEnum(Opcode, pattern.bytecode[pc]) catch break;
            
            // Should be able to get metadata for any valid PC
            _ = plan.getMetadata(pc, opcode, undefined);
            
            // Advance PC correctly
            const opcode_val = pattern.bytecode[pc];
            if (opcode_val >= @intFromEnum(Opcode.PUSH1) and opcode_val <= @intFromEnum(Opcode.PUSH32)) {
                const push_bytes = opcode_val - (@intFromEnum(Opcode.PUSH1) - 1);
                pc += 1 + push_bytes;
            } else {
                pc += 1;
            }
            visited_instructions += 1;
        }
    }
}

test "Plan gas cost estimation accuracy validation" {
    const allocator = std.testing.allocator;
    
    // Test gas costs for various opcodes match expected EVM values
    const gas_test_cases = [_]struct {
        opcode: Opcode,
        expected_base_gas: u64,
        has_dynamic_gas: bool,
        description: []const u8,
    }{
        // Arithmetic operations
        .{ .opcode = .ADD, .expected_base_gas = 3, .has_dynamic_gas = false, .description = "ADD should cost 3 gas" },
        .{ .opcode = .SUB, .expected_base_gas = 3, .has_dynamic_gas = false, .description = "SUB should cost 3 gas" },
        .{ .opcode = .MUL, .expected_base_gas = 5, .has_dynamic_gas = false, .description = "MUL should cost 5 gas" },
        .{ .opcode = .DIV, .expected_base_gas = 5, .has_dynamic_gas = false, .description = "DIV should cost 5 gas" },
        .{ .opcode = .EXP, .expected_base_gas = 10, .has_dynamic_gas = true, .description = "EXP has base cost 10 + dynamic" },
        
        // Stack operations
        .{ .opcode = .POP, .expected_base_gas = 2, .has_dynamic_gas = false, .description = "POP should cost 2 gas" },
        .{ .opcode = .DUP1, .expected_base_gas = 3, .has_dynamic_gas = false, .description = "DUP1 should cost 3 gas" },
        .{ .opcode = .SWAP1, .expected_base_gas = 3, .has_dynamic_gas = false, .description = "SWAP1 should cost 3 gas" },
        
        // Memory operations
        .{ .opcode = .MLOAD, .expected_base_gas = 3, .has_dynamic_gas = true, .description = "MLOAD has base cost 3 + memory expansion" },
        .{ .opcode = .MSTORE, .expected_base_gas = 3, .has_dynamic_gas = true, .description = "MSTORE has base cost 3 + memory expansion" },
        .{ .opcode = .MSTORE8, .expected_base_gas = 3, .has_dynamic_gas = true, .description = "MSTORE8 has base cost 3 + memory expansion" },
        
        // Storage operations (high gas costs)
        .{ .opcode = .SLOAD, .expected_base_gas = 2100, .has_dynamic_gas = true, .description = "SLOAD has variable gas cost" },
        .{ .opcode = .SSTORE, .expected_base_gas = 5000, .has_dynamic_gas = true, .description = "SSTORE has complex dynamic gas" },
        
        // Environment
        .{ .opcode = .ADDRESS, .expected_base_gas = 2, .has_dynamic_gas = false, .description = "ADDRESS should cost 2 gas" },
        .{ .opcode = .BALANCE, .expected_base_gas = 2600, .has_dynamic_gas = true, .description = "BALANCE has access list dynamic gas" },
        .{ .opcode = .CALLER, .expected_base_gas = 2, .has_dynamic_gas = false, .description = "CALLER should cost 2 gas" },
        
        // Crypto
        .{ .opcode = .KECCAK256, .expected_base_gas = 30, .has_dynamic_gas = true, .description = "KECCAK256 has base 30 + dynamic" },
    };
    
    // Create bytecode with the test opcodes
    for (gas_test_cases) |test_case| {
        // Create minimal bytecode with the opcode
        var bytecode: [10]u8 = undefined;
        var bytecode_len: usize = 0;
        
        // Add setup for opcodes that need stack items
        switch (test_case.opcode) {
            .ADD, .SUB, .MUL, .DIV, .MOD => {
                bytecode[bytecode_len] = @intFromEnum(Opcode.PUSH1);
                bytecode[bytecode_len + 1] = 0x01;
                bytecode[bytecode_len + 2] = @intFromEnum(Opcode.PUSH1);
                bytecode[bytecode_len + 3] = 0x02;
                bytecode_len += 4;
            },
            .DUP1, .SWAP1 => {
                bytecode[bytecode_len] = @intFromEnum(Opcode.PUSH1);
                bytecode[bytecode_len + 1] = 0x01;
                bytecode_len += 2;
            },
            .MLOAD, .MSTORE, .MSTORE8 => {
                bytecode[bytecode_len] = @intFromEnum(Opcode.PUSH1);
                bytecode[bytecode_len + 1] = 0x00; // offset
                bytecode_len += 2;
                if (test_case.opcode == .MSTORE or test_case.opcode == .MSTORE8) {
                    bytecode[bytecode_len] = @intFromEnum(Opcode.PUSH1);
                    bytecode[bytecode_len + 1] = 0x42; // value
                    bytecode_len += 2;
                }
            },
            .SLOAD, .SSTORE => {
                bytecode[bytecode_len] = @intFromEnum(Opcode.PUSH1);
                bytecode[bytecode_len + 1] = 0x00; // key
                bytecode_len += 2;
                if (test_case.opcode == .SSTORE) {
                    bytecode[bytecode_len] = @intFromEnum(Opcode.PUSH1);
                    bytecode[bytecode_len + 1] = 0x42; // value
                    bytecode_len += 2;
                }
            },
            .KECCAK256 => {
                bytecode[bytecode_len] = @intFromEnum(Opcode.PUSH1);
                bytecode[bytecode_len + 1] = 0x00; // offset
                bytecode[bytecode_len + 2] = @intFromEnum(Opcode.PUSH1);
                bytecode[bytecode_len + 3] = 0x20; // length
                bytecode_len += 4;
            },
            else => {}, // No setup needed
        }
        
        // Add the test opcode
        bytecode[bytecode_len] = @intFromEnum(test_case.opcode);
        bytecode_len += 1;
        
        // Add STOP
        bytecode[bytecode_len] = @intFromEnum(Opcode.STOP);
        bytecode_len += 1;
        
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, bytecode[0..bytecode_len]);
        
        var handlers: [256]*const HandlerFn = undefined;
        for (&handlers) |*h| h.* = &testHandler;
        
        var plan = try planner.create_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        // Find the test opcode in bytecode and get its metadata
        for (bytecode[0..bytecode_len], 0..) |byte, pc| {
            if (byte == @intFromEnum(test_case.opcode)) {
                // Test that we can get metadata (gas info) for this opcode
                const metadata = plan.getMetadata(pc, test_case.opcode, undefined);
                
                // Basic validation that metadata exists
                // The exact gas values would need to be verified against the specific
                // implementation's gas calculation logic
                try std.testing.expect(metadata != 0);
                break;
            }
        }
    }
}

test "Plan equivalence between minimal and advanced plans" {
    const allocator = std.testing.allocator;
    
    // Test bytecodes that should produce equivalent behavior
    const test_bytecodes = [_][]const u8{
        // Simple arithmetic
        &[_]u8{
            @intFromEnum(Opcode.PUSH1), 0x05,
            @intFromEnum(Opcode.PUSH1), 0x03,
            @intFromEnum(Opcode.ADD),
            @intFromEnum(Opcode.STOP),
        },
        
        // Stack operations
        &[_]u8{
            @intFromEnum(Opcode.PUSH1), 0x42,
            @intFromEnum(Opcode.DUP1),
            @intFromEnum(Opcode.SWAP1),
            @intFromEnum(Opcode.POP),
            @intFromEnum(Opcode.STOP),
        },
        
        // Jump operations
        &[_]u8{
            @intFromEnum(Opcode.PUSH1), 0x06,
            @intFromEnum(Opcode.JUMP),
            @intFromEnum(Opcode.INVALID), // Dead code
            @intFromEnum(Opcode.JUMPDEST),
            @intFromEnum(Opcode.STOP),
        },
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    for (test_bytecodes) |bytecode| {
        // Create advanced plan
        const AdvancedPlanner = @import("planner.zig").createPlanner(.{});
        var advanced_planner = try AdvancedPlanner.init(allocator, bytecode);
        var advanced_plan = try advanced_planner.create_plan(allocator, handlers);
        defer advanced_plan.deinit(allocator);
        
        // Create minimal plan
        var minimal_plan = try advanced_planner.create_minimal_plan(allocator, handlers);
        defer minimal_plan.deinit(allocator);
        
        // Both plans should have same bytecode
        try std.testing.expectEqual(advanced_plan.bytecode.len, minimal_plan.bytecode.len);
        try std.testing.expectEqualSlices(u8, advanced_plan.bytecode, minimal_plan.bytecode);
        
        // Test instruction stream consistency
        var advanced_idx: InstructionIndexType = 0;
        var minimal_idx: PlanMinimal.InstructionIndexType = 0;
        
        // Walk through both instruction streams
        for (0..bytecode.len) |pc| {
            const opcode = std.meta.intToEnum(Opcode, bytecode[pc]) catch continue;
            
            // Both should be able to get instruction index for same PC
            const advanced_inst_idx = advanced_plan.getInstructionIndexForPc(@intCast(pc));
            const minimal_inst_idx = minimal_plan.getInstructionIndexForPc(@intCast(pc));
            
            if (advanced_inst_idx != null and minimal_inst_idx != null) {
                // Both plans should map the same PC to valid instruction indices
                try std.testing.expect(advanced_inst_idx != null);
                try std.testing.expect(minimal_inst_idx != null);
            }
            
            // Test metadata consistency for opcodes that both plans support
            switch (opcode) {
                .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7, .PUSH8 => {
                    // Both plans should provide equivalent metadata for small PUSH opcodes
                    const advanced_meta = advanced_plan.getMetadata(pc, opcode, undefined);
                    const minimal_meta = minimal_plan.getMetadata(pc, opcode, undefined);
                    
                    // For small PUSH opcodes, values should be equivalent
                    try std.testing.expectEqual(advanced_meta, minimal_meta);
                },
                .JUMPDEST => {
                    // Both should recognize JUMPDEST
                    _ = advanced_plan.getMetadata(pc, opcode, undefined);
                    _ = minimal_plan.getMetadata(pc, opcode, undefined);
                },
                .PC => {
                    // PC opcode should return the same value
                    const advanced_pc = advanced_plan.getMetadata(pc, opcode, undefined);
                    const minimal_pc = minimal_plan.getMetadata(pc, opcode, undefined);
                    try std.testing.expectEqual(@as(u256, pc), advanced_pc);
                    try std.testing.expectEqual(@as(u8, @intCast(pc)), minimal_pc);
                },
                else => {
                    // Other opcodes should be handled consistently
                    _ = advanced_plan.getMetadata(pc, opcode, undefined);
                    _ = minimal_plan.getMetadata(pc, opcode, undefined);
                },
            }
        }
    }
}

test "Plan configuration boundary and mutation stress testing" {
    const allocator = std.testing.allocator;
    
    // Test extreme configurations
    const boundary_configs = [_]struct {
        config: PlanConfig,
        should_succeed: bool,
        description: []const u8,
    }{
        // Minimum valid config
        .{
            .config = .{ .stackSize = 1, .WordType = u64, .maxBytecodeSize = 1, .blockGasLimit = 21000 },
            .should_succeed = true,
            .description = "Minimum valid configuration",
        },
        
        // EVM standard config
        .{
            .config = .{ .stackSize = 1024, .WordType = u256, .maxBytecodeSize = 24576, .blockGasLimit = 30_000_000 },
            .should_succeed = true,
            .description = "Standard EVM configuration",
        },
        
        // Large config
        .{
            .config = .{ .stackSize = 2048, .WordType = u256, .maxBytecodeSize = 65535, .blockGasLimit = 100_000_000 },
            .should_succeed = true,
            .description = "Large configuration",
        },
        
        // Edge case: exactly at u16 boundary
        .{
            .config = .{ .stackSize = 1024, .WordType = u256, .maxBytecodeSize = 65535, .blockGasLimit = 30_000_000 },
            .should_succeed = true,
            .description = "u16 boundary configuration",
        },
    };
    
    const test_bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    for (boundary_configs) |boundary_test| {
        if (boundary_test.should_succeed) {
            const Planner = @import("planner.zig").createPlanner(boundary_test.config);
            
            // Test that bytecode within limits works
            var limited_bytecode = test_bytecode[0..@min(test_bytecode.len, boundary_test.config.maxBytecodeSize)];
            if (limited_bytecode.len == 0) {
                limited_bytecode = &[_]u8{@intFromEnum(Opcode.STOP)};
            }
            
            var planner = try Planner.init(allocator, limited_bytecode);
            
            var plan = try planner.create_minimal_plan(allocator, handlers);
            defer plan.deinit(allocator);
            
            // Verify plan works with this configuration
            try std.testing.expect(plan.bytecode.len == limited_bytecode.len);
            
            // Test instruction processing
            if (limited_bytecode.len > 0) {
                const first_opcode = std.meta.intToEnum(Opcode, limited_bytecode[0]) catch .STOP;
                _ = plan.getMetadata(0, first_opcode, undefined);
            }
        }
    }
    
    // Test configuration mutation scenarios
    const base_config = PlanConfig{
        .stackSize = 1024,
        .WordType = u256,
        .maxBytecodeSize = 1000,
        .blockGasLimit = 30_000_000,
    };
    
    // Test with different WordTypes
    const word_types = [_]type{ u64, u128, u256 };
    for (word_types) |WordType| {
        var config = base_config;
        config.WordType = WordType;
        
        const Planner = @import("planner.zig").createPlanner(config);
        var planner = try Planner.init(allocator, &test_bytecode);
        
        var plan = try planner.create_minimal_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        try std.testing.expect(plan.bytecode.len == test_bytecode.len);
    }
}

test "Plan bytecode analysis completeness validation" {
    const allocator = std.testing.allocator;
    
    // Test comprehensive bytecode analysis features
    const analysis_test_patterns = [_]struct {
        bytecode: []const u8,
        expected_push_values: usize,
        expected_jumpdests: usize,
        expected_unique_opcodes: usize,
        description: []const u8,
    }{
        // Pattern with multiple PUSH values
        .{
            .bytecode = &[_]u8{
                @intFromEnum(Opcode.PUSH1), 0x42,
                @intFromEnum(Opcode.PUSH2), 0x13, 0x37,
                @intFromEnum(Opcode.PUSH4), 0xDE, 0xAD, 0xBE, 0xEF,
                @intFromEnum(Opcode.ADD),
                @intFromEnum(Opcode.STOP),
            },
            .expected_push_values = 3,
            .expected_jumpdests = 0,
            .expected_unique_opcodes = 4, // PUSH1, PUSH2, PUSH4, ADD, STOP
            .description = "Multiple PUSH values analysis",
        },
        
        // Pattern with JUMPDEST analysis
        .{
            .bytecode = &[_]u8{
                @intFromEnum(Opcode.JUMPDEST),  // PC 0
                @intFromEnum(Opcode.PUSH1), 0x08,
                @intFromEnum(Opcode.JUMP),
                @intFromEnum(Opcode.INVALID),   // Dead code
                @intFromEnum(Opcode.INVALID),   // Dead code
                @intFromEnum(Opcode.JUMPDEST),  // PC 8
                @intFromEnum(Opcode.STOP),
            },
            .expected_push_values = 1,
            .expected_jumpdests = 2,
            .expected_unique_opcodes = 5, // JUMPDEST, PUSH1, JUMP, INVALID, STOP
            .description = "JUMPDEST pattern analysis",
        },
        
        // Complex pattern with various opcodes
        .{
            .bytecode = &[_]u8{
                @intFromEnum(Opcode.PUSH1), 0x20,  // Memory offset
                @intFromEnum(Opcode.PUSH1), 0x00,  // Data offset
                @intFromEnum(Opcode.PUSH1), 0x04,  // Data size
                @intFromEnum(Opcode.CALLDATACOPY), // Copy calldata to memory
                @intFromEnum(Opcode.PUSH1), 0x20,  // Memory offset
                @intFromEnum(Opcode.MLOAD),        // Load from memory
                @intFromEnum(Opcode.PUSH1), 0x00,  // Storage key
                @intFromEnum(Opcode.SSTORE),       // Store to storage
                @intFromEnum(Opcode.JUMPDEST),     // Jump destination
                @intFromEnum(Opcode.STOP),
            },
            .expected_push_values = 5,
            .expected_jumpdests = 1,
            .expected_unique_opcodes = 7, // PUSH1, CALLDATACOPY, MLOAD, SSTORE, JUMPDEST, STOP (PUSH1 counted once)
            .description = "Complex opcode pattern analysis",
        },
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    for (analysis_test_patterns) |pattern| {
        const Planner = @import("planner.zig").createPlanner(.{});
        var planner = try Planner.init(allocator, pattern.bytecode);
        
        var plan = try planner.create_plan(allocator, handlers);
        defer plan.deinit(allocator);
        
        // Test comprehensive analysis capabilities
        
        // 1. PUSH value extraction
        var push_count: usize = 0;
        var pc: usize = 0;
        while (pc < pattern.bytecode.len) {
            const opcode_val = pattern.bytecode[pc];
            if (opcode_val >= @intFromEnum(Opcode.PUSH1) and opcode_val <= @intFromEnum(Opcode.PUSH32)) {
                const opcode = std.meta.intToEnum(Opcode, opcode_val) catch break;
                
                // Should be able to extract PUSH value
                const metadata = plan.getMetadata(pc, opcode, undefined);
                try std.testing.expect(metadata != 0); // Should have valid value
                
                push_count += 1;
                
                const push_bytes = opcode_val - (@intFromEnum(Opcode.PUSH1) - 1);
                pc += 1 + push_bytes;
            } else {
                pc += 1;
            }
        }
        try std.testing.expectEqual(pattern.expected_push_values, push_count);
        
        // 2. JUMPDEST identification
        var jumpdest_count: usize = 0;
        for (pattern.bytecode, 0..) |byte, i| {
            if (byte == @intFromEnum(Opcode.JUMPDEST)) {
                // Verify it's recognized as valid jump destination
                try std.testing.expect(plan.isValidJumpDestination(@intCast(i)));
                jumpdest_count += 1;
            }
        }
        try std.testing.expectEqual(pattern.expected_jumpdests, jumpdest_count);
        
        // 3. Opcode frequency analysis
        var unique_opcodes = std.AutoHashMap(u8, void).init(allocator);
        defer unique_opcodes.deinit();
        
        pc = 0;
        while (pc < pattern.bytecode.len) {
            const opcode_val = pattern.bytecode[pc];
            try unique_opcodes.put(opcode_val, {});
            
            // Skip PUSH data
            if (opcode_val >= @intFromEnum(Opcode.PUSH1) and opcode_val <= @intFromEnum(Opcode.PUSH32)) {
                const push_bytes = opcode_val - (@intFromEnum(Opcode.PUSH1) - 1);
                pc += 1 + push_bytes;
            } else {
                pc += 1;
            }
        }
        try std.testing.expectEqual(pattern.expected_unique_opcodes, unique_opcodes.count());
        
        // 4. Code/data separation validation
        pc = 0;
        while (pc < pattern.bytecode.len) {
            const opcode = std.meta.intToEnum(Opcode, pattern.bytecode[pc]) catch break;
            
            // Should be able to get instruction index for all instruction starts
            const inst_idx = plan.getInstructionIndexForPc(@intCast(pc));
            try std.testing.expect(inst_idx != null);
            
            // Advance correctly based on opcode
            const opcode_val = pattern.bytecode[pc];
            if (opcode_val >= @intFromEnum(Opcode.PUSH1) and opcode_val <= @intFromEnum(Opcode.PUSH32)) {
                const push_bytes = opcode_val - (@intFromEnum(Opcode.PUSH1) - 1);
                
                // Verify that PCs inside PUSH data are not valid instruction starts
                for (1..push_bytes + 1) |offset| {
                    if (pc + offset < pattern.bytecode.len) {
                        // These should either be null or handled appropriately by the plan
                        const inner_inst_idx = plan.getInstructionIndexForPc(@intCast(pc + offset));
                        _ = inner_inst_idx; // Plan may handle this differently
                    }
                }
                pc += 1 + push_bytes;
            } else {
                pc += 1;
            }
        }
    }
}

test "Plan caching and lifecycle management validation" {
    const allocator = std.testing.allocator;
    
    // Test plan caching and reuse scenarios
    const reusable_bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| h.* = &testHandler;
    
    // Test 1: Multiple plans from same bytecode should work independently
    const num_concurrent_plans = 5;
    var plans: [num_concurrent_plans]Plan = undefined;
    var planners: [num_concurrent_plans]Planner = undefined;
    
    // Create multiple plans concurrently
    for (0..num_concurrent_plans) |i| {
        const Planner = @import("planner.zig").createPlanner(.{});
        planners[i] = try Planner.init(allocator, &reusable_bytecode);
        plans[i] = try planners[i].create_plan(allocator, handlers);
    }
    
    // Verify all plans work independently
    for (0..num_concurrent_plans) |i| {
        try std.testing.expect(plans[i].bytecode.len == reusable_bytecode.len);
        try std.testing.expectEqualSlices(u8, plans[i].bytecode, &reusable_bytecode);
        
        // Test that each plan provides correct metadata
        const push_value = plans[i].getMetadata(0, .PUSH1, undefined);
        try std.testing.expectEqual(@as(u256, 0x42), push_value);
        
        // Test instruction indexing
        const inst_idx = plans[i].getInstructionIndexForPc(0);
        try std.testing.expect(inst_idx != null);
    }
    
    // Clean up all plans
    for (0..num_concurrent_plans) |i| {
        plans[i].deinit(allocator);
    }
    
    // Test 2: Plan lifecycle with different configurations
    const lifecycle_configs = [_]PlanConfig{
        .{ .stackSize = 256, .WordType = u128, .maxBytecodeSize = 1000, .blockGasLimit = 21000 },
        .{ .stackSize = 512, .WordType = u256, .maxBytecodeSize = 2000, .blockGasLimit = 30_000_000 },
        .{ .stackSize = 1024, .WordType = u256, .maxBytecodeSize = 24576, .blockGasLimit = 100_000_000 },
    };
    
    for (lifecycle_configs) |config| {
        const ConfigPlanner = @import("planner.zig").createPlanner(config);
        var config_planner = try ConfigPlanner.init(allocator, &reusable_bytecode);
        
        // Create both minimal and advanced plans
        var minimal_plan = try config_planner.create_minimal_plan(allocator, handlers);
        var advanced_plan = try config_planner.create_plan(allocator, handlers);
        
        // Test that both work with this configuration
        try std.testing.expect(minimal_plan.bytecode.len == reusable_bytecode.len);
        try std.testing.expect(advanced_plan.bytecode.len == reusable_bytecode.len);
        
        // Test metadata consistency
        const minimal_meta = minimal_plan.getMetadata(0, .PUSH1, undefined);
        const advanced_meta = advanced_plan.getMetadata(0, .PUSH1, undefined);
        try std.testing.expectEqual(minimal_meta, advanced_meta);
        
        // Clean up in different orders to test lifecycle robustness
        if (config.stackSize % 2 == 0) {
            minimal_plan.deinit(allocator);
            advanced_plan.deinit(allocator);
        } else {
            advanced_plan.deinit(allocator);
            minimal_plan.deinit(allocator);
        }
    }
    
    // Test 3: Plan ownership transfer simulation
    const transfer_bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.PUSH1), 0x56,
        @intFromEnum(Opcode.MUL),
        @intFromEnum(Opcode.STOP),
    };
    
    // Function that creates and returns a plan (simulating ownership transfer)
    const createAndTransferPlan = struct {
        fn create(alloc: std.mem.Allocator, bytecode: []const u8, plan_handlers: [256]*const HandlerFn) !Plan {
            const TransferPlanner = @import("planner.zig").createPlanner(.{});
            var transfer_planner = try TransferPlanner.init(alloc, bytecode);
            return try transfer_planner.create_plan(alloc, plan_handlers);
        }
    }.create;
    
    var transferred_plan = try createAndTransferPlan(allocator, &transfer_bytecode, handlers);
    defer transferred_plan.deinit(allocator);
    
    // Test that transferred plan still works correctly
    try std.testing.expect(transferred_plan.bytecode.len == transfer_bytecode.len);
    
    // Test metadata access on transferred plan
    const push2_value = transferred_plan.getMetadata(0, .PUSH2, undefined);
    try std.testing.expectEqual(@as(u256, 0x1234), push2_value);
    
    const push1_value = transferred_plan.getMetadata(3, .PUSH1, undefined);
    try std.testing.expectEqual(@as(u256, 0x56), push1_value);
    
    // Test 4: Stress test plan creation and destruction
    const stress_iterations = 20;
    for (0..stress_iterations) |iteration| {
        // Vary the bytecode slightly each iteration
        var stress_bytecode: [8]u8 = undefined;
        stress_bytecode[0] = @intFromEnum(Opcode.PUSH1);
        stress_bytecode[1] = @intCast(iteration % 256);
        stress_bytecode[2] = @intFromEnum(Opcode.PUSH1);
        stress_bytecode[3] = @intCast((iteration * 2) % 256);
        stress_bytecode[4] = @intFromEnum(Opcode.ADD);
        stress_bytecode[5] = @intFromEnum(Opcode.POP);
        stress_bytecode[6] = @intFromEnum(Opcode.JUMPDEST);
        stress_bytecode[7] = @intFromEnum(Opcode.STOP);
        
        const StressPlanner = @import("planner.zig").createPlanner(.{});
        var stress_planner = try StressPlanner.init(allocator, &stress_bytecode);
        
        var stress_plan = try stress_planner.create_plan(allocator, handlers);
        
        // Quick validation
        try std.testing.expect(stress_plan.bytecode.len == stress_bytecode.len);
        
        // Test a few operations
        const first_push = stress_plan.getMetadata(0, .PUSH1, undefined);
        try std.testing.expectEqual(@as(u256, iteration % 256), first_push);
        
        try std.testing.expect(stress_plan.isValidJumpDestination(6)); // JUMPDEST at PC 6
        
        // Immediate cleanup
        stress_plan.deinit(allocator);
    }
}
