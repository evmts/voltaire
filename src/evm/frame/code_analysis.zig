const std = @import("std");
const bitvec = @import("bitvec.zig");
const BitVec64 = bitvec.BitVec64;
const Operation = @import("../opcodes/operation.zig");

/// Pre-computed operation info including stack validation data
pub const PcToOpEntry = struct {
    operation: *const Operation.Operation,
    opcode_byte: u8,
    // Pre-computed validation info to avoid re-fetching from operation
    min_stack: u32,
    max_stack: u32,
    constant_gas: u64,
    undefined: bool,
};

/// Advanced code analysis for EVM bytecode optimization.
pub const AdvancedCodeAnalysis = struct {
    /// Optional stack costs for each PC
    stack_costs: ?[]u32 = null,
    /// Optional operation entries for each PC
    pc_to_op_entries: ?[]PcToOpEntry = null,
    /// Optional JUMPDEST analysis
    jumpdest_analysis: ?BitVec64 = null,

    pub fn init() AdvancedCodeAnalysis {
        return .{};
    }

    pub fn toOwnedAllocation(self: *const AdvancedCodeAnalysis, allocator: std.mem.Allocator) !*AdvancedCodeAnalysis {
        var ptr = try allocator.create(AdvancedCodeAnalysis);
        ptr.* = self.*;
        return ptr;
    }

    pub fn deinit(self: *AdvancedCodeAnalysis, allocator: std.mem.Allocator) void {
        // Nothing to free as we don't own the data
        _ = self;
        _ = allocator;
    }
};

/// Complete analysis output including advanced analysis
pub const CodeAnalysisResult = struct {
    stack_costs: []u32,
    extended: ?AdvancedCodeAnalysis = null,
};

/// Entry point for bytecode analysis with all optimizations.
pub fn analyze(
    allocator: std.mem.Allocator,
    code: []const u8,
    jump_table: *const @import("../jump_table/jump_table.zig").JumpTable,
) !CodeAnalysisResult {
    // Pre-allocate based on code size
    const stack_costs = try allocator.alloc(u32, code.len);
    errdefer allocator.free(stack_costs);

    // Pre-allocate PC-to-operation mapping
    const pc_to_op_entries = try allocator.alloc(PcToOpEntry, code.len);
    errdefer allocator.free(pc_to_op_entries);

    // Initialize all entries to default/invalid
    for (0..code.len) |i| {
        stack_costs[i] = 0;
        pc_to_op_entries[i] = .{
            .operation = &jump_table.operations[0xFE], // INVALID
            .opcode_byte = 0xFE,
            .min_stack = 0,
            .max_stack = 0,
            .constant_gas = 0,
            .undefined = true,
        };
    }

    // Create jumpdest bitvec
    var jumpdest_bitvec = BitVec64.init(allocator);
    defer jumpdest_bitvec.deinit(allocator);

    var i: usize = 0;
    var max_stack_height: u32 = 0;

    while (i < code.len) {
        const op_byte = code[i];
        const op = &jump_table.operations[op_byte];

        // Mark valid JUMPDEST
        if (op.id == .JUMPDEST) {
            jumpdest_bitvec.set(i);
        }

        // Update PC-to-operation mapping
        pc_to_op_entries[i] = .{
            .operation = op,
            .opcode_byte = op_byte,
            .min_stack = op.min_stack,
            .max_stack = op.max_stack,
            .constant_gas = op.constant_gas,
            .undefined = op.undefined,
        };

        // Calculate stack cost
        const current_cost = (op.min_stack - op.max_stack);
        stack_costs[i] = current_cost;

        // Track max stack for validation
        if (op.min_stack > max_stack_height) {
            max_stack_height = op.min_stack;
        }

        // Advance PC based on opcode
        if (op.isPush()) {
            const push_size = op.pushSize();
            // Mark push data bytes as invalid
            for (1..@min(push_size + 1, code.len - i)) |j| {
                stack_costs[i + j] = 0;
                pc_to_op_entries[i + j] = .{
                    .operation = &jump_table.operations[0xFE], // INVALID
                    .opcode_byte = 0xFE,
                    .min_stack = 0,
                    .max_stack = 0,
                    .constant_gas = 0,
                    .undefined = true,
                };
            }
            i += push_size + 1;
        } else {
            i += 1;
        }
    }

    // Return results
    return .{
        .stack_costs = stack_costs,
        .extended = .{
            .stack_costs = stack_costs,
            .pc_to_op_entries = pc_to_op_entries,
            .jumpdest_analysis = jumpdest_bitvec,
        },
    };
}

pub fn deinit(self: *const AdvancedCodeAnalysis, allocator: std.mem.Allocator) void {
    if (self.stack_costs) |costs| {
        allocator.free(costs);
    }
    if (self.pc_to_op_entries) |entries| {
        allocator.free(entries);
    }
}