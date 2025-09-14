# CLAUDE.md - Bytecode Module AI Context

## MISSION CRITICAL: Bytecode Analysis and Optimization

The bytecode module handles EVM bytecode analysis, validation, and optimization. **ANY error in bytecode parsing or analysis can cause incorrect execution or enable exploits.** Bytecode processing must maintain perfect EVM specification compliance.

## Critical Implementation Details

### EVM Bytecode Specifications (IMMUTABLE REQUIREMENTS)

**Instruction Encoding**: Single-byte opcodes (0x00-0xFF)
**PUSH Instructions**: Immediate data follows opcode (PUSH1-PUSH32)
**Jump Destinations**: Only JUMPDEST (0x5B) opcodes are valid targets
**Code Size Limits**: Maximum 24,576 bytes per contract
**Init Code Limits**: Maximum 49,152 bytes during creation

### Core Responsibilities

**Bytecode Parsing**: Extract opcodes and immediate values
**Jump Analysis**: Identify valid JUMPDEST locations
**Pattern Recognition**: Detect optimization opportunities
**Validation**: Ensure bytecode follows EVM rules
**Fusion Optimization**: Combine common instruction patterns

## Bytecode Parsing and Validation

### Instruction Stream Processing
```zig
pub fn parse_bytecode(code: []const u8) !BytecodeAnalysis {
    var analysis = BytecodeAnalysis.init();
    var pc: usize = 0;

    while (pc < code.len) {
        const opcode = code[pc];

        // Record instruction position
        try analysis.instructions.append(.{
            .opcode = opcode,
            .pc = pc,
            .gas_cost = get_base_gas_cost(opcode),
        });

        // Handle PUSH instructions with immediate data
        if (opcode >= 0x60 and opcode <= 0x7F) { // PUSH1-PUSH32
            const push_size = opcode - 0x5F; // PUSH1 = 1 byte, etc.

            if (pc + push_size >= code.len) {
                return BytecodeError.TruncatedPushData;
            }

            // Skip immediate data
            pc += push_size;
        }

        pc += 1;
    }

    return analysis;
}
```

### JUMPDEST Validation (CONSENSUS CRITICAL)
```zig
pub fn analyze_jump_destinations(code: []const u8) !JumpTable {
    var jump_table = JumpTable.init();
    var pc: usize = 0;

    while (pc < code.len) {
        const opcode = code[pc];

        // Mark valid jump destinations
        if (opcode == 0x5B) { // JUMPDEST
            try jump_table.add_destination(pc);
        }

        // Skip PUSH immediate data (not valid jump targets)
        if (opcode >= 0x60 and opcode <= 0x7F) {
            const push_size = opcode - 0x5F;
            pc += push_size;
        }

        pc += 1;
    }

    return jump_table;
}

pub fn is_valid_jump_destination(jump_table: *const JumpTable, pc: usize) bool {
    return jump_table.contains(pc);
}
```

## Bytecode Optimization Engine

### Pattern Detection and Fusion
```zig
pub const FusionPattern = struct {
    pattern: []const u8,  // Sequence of opcodes to match
    replacement: OpcodeSynthetic, // Synthetic opcode to replace with
    gas_saving: u32,      // Gas saved per execution
    stack_effect: i8,     // Net stack change
};

pub const COMMON_PATTERNS = [_]FusionPattern{
    // PUSH1 x + ADD -> PUSH_ADD_INLINE x
    .{
        .pattern = &[_]u8{ 0x60, 0x01 }, // PUSH1 1, ADD
        .replacement = .PUSH_ADD_INLINE,
        .gas_saving = 2, // Save dispatch overhead
        .stack_effect = -1,
    },
    // PUSH1 x + MUL -> PUSH_MUL_INLINE x
    .{
        .pattern = &[_]u8{ 0x60, 0x02 }, // PUSH1 1, MUL
        .replacement = .PUSH_MUL_INLINE,
        .gas_saving = 2,
        .stack_effect = -1,
    },
};
```

### Fusion Safety Validation
```zig
pub fn validate_fusion_safety(
    original_ops: []const Instruction,
    fused_op: OpcodeSynthetic,
) !void {
    // CRITICAL: Verify gas costs match exactly
    var original_gas: u32 = 0;
    for (original_ops) |op| {
        original_gas += op.gas_cost;
    }

    const fused_gas = get_synthetic_gas_cost(fused_op);
    if (original_gas != fused_gas) {
        return BytecodeError.FusionGasMismatch;
    }

    // CRITICAL: Verify stack effects match exactly
    var original_stack_effect: i8 = 0;
    for (original_ops) |op| {
        original_stack_effect += get_stack_effect(op.opcode);
    }

    const fused_stack_effect = get_synthetic_stack_effect(fused_op);
    if (original_stack_effect != fused_stack_effect) {
        return BytecodeError.FusionStackMismatch;
    }
}
```

## Static Analysis Framework

### Control Flow Analysis
```zig
pub const BasicBlock = struct {
    start_pc: usize,
    end_pc: usize,
    instructions: []Instruction,
    successors: []usize, // PC values of next blocks
    predecessors: []usize, // PC values of incoming blocks
};

pub fn build_control_flow_graph(analysis: *const BytecodeAnalysis) ![]BasicBlock {
    var blocks = std.ArrayList(BasicBlock).init(allocator);
    var current_block_start: usize = 0;

    for (analysis.instructions.items, 0..) |inst, i| {
        const is_jump = inst.opcode == 0x56 or inst.opcode == 0x57; // JUMP/JUMPI
        const is_stop = inst.opcode == 0x00 or inst.opcode == 0xF3 or inst.opcode == 0xFD; // STOP/RETURN/REVERT
        const next_is_jumpdest = (i + 1 < analysis.instructions.items.len and
                                 analysis.instructions.items[i + 1].opcode == 0x5B);

        if (is_jump or is_stop or next_is_jumpdest) {
            // End current basic block
            try blocks.append(BasicBlock{
                .start_pc = current_block_start,
                .end_pc = inst.pc,
                .instructions = analysis.instructions.items[current_block_start..i+1],
                .successors = &.{}, // Filled in later pass
                .predecessors = &.{},
            });

            current_block_start = i + 1;
        }
    }

    return blocks.toOwnedSlice();
}
```

### Gas Cost Estimation
```zig
pub fn estimate_execution_gas(bytecode: []const u8, input_data: []const u8) !u64 {
    const analysis = try parse_bytecode(bytecode);
    var total_gas: u64 = 0;

    for (analysis.instructions.items) |inst| {
        total_gas += switch (inst.opcode) {
            // Dynamic gas costs require runtime context
            0x20 => calculate_keccak256_gas(input_data.len), // KECCAK256
            0x37 => calculate_calldatacopy_gas(input_data.len), // CALLDATACOPY
            0x51, 0x52, 0x53 => calculate_memory_gas(inst), // MLOAD/MSTORE/MSTORE8
            else => inst.gas_cost,
        };
    }

    return total_gas;
}
```

## Bytecode Security Analysis

### Dangerous Pattern Detection
```zig
pub const SecurityIssue = struct {
    type: enum {
        UnreachableCode,
        InfiniteLoop,
        StackUnderflow,
        InvalidJump,
        GasExhaustion,
    },
    location: usize,
    severity: enum { Low, Medium, High, Critical },
    description: []const u8,
};

pub fn analyze_security_issues(analysis: *const BytecodeAnalysis) ![]SecurityIssue {
    var issues = std.ArrayList(SecurityIssue).init(allocator);

    // Check for unreachable code after unconditional jumps
    try detect_unreachable_code(&issues, analysis);

    // Check for potential infinite loops
    try detect_infinite_loops(&issues, analysis);

    // Check for stack underflow conditions
    try detect_stack_underflow(&issues, analysis);

    return issues.toOwnedSlice();
}
```

### Code Size Validation
```zig
pub fn validate_code_size(code: []const u8, is_init_code: bool) !void {
    const limit = if (is_init_code) MAX_INITCODE_SIZE else MAX_CODE_SIZE;

    if (code.len > limit) {
        return BytecodeError.CodeTooLarge;
    }
}

// EIP-170 and EIP-3860 limits
pub const MAX_CODE_SIZE = 24_576; // 24KB
pub const MAX_INITCODE_SIZE = 49_152; // 48KB
```

## Performance Optimization

### Bytecode Caching
```zig
pub const BytecodeCache = struct {
    analyses: std.HashMap([32]u8, *BytecodeAnalysis, std.hash_map.HashMap.Context([32]u8)),

    pub fn get_or_analyze(self: *Self, code: []const u8) !*BytecodeAnalysis {
        const code_hash = crypto.keccak256(code);

        if (self.analyses.get(code_hash)) |cached| {
            return cached;
        }

        const analysis = try parse_bytecode(code);
        try self.analyses.put(code_hash, analysis);
        return analysis;
    }
};
```

### Jump Table Optimization
```zig
// Binary search for large jump tables
pub fn find_jump_destination(jump_table: *const JumpTable, target: usize) bool {
    var left: usize = 0;
    var right: usize = jump_table.destinations.len;

    while (left < right) {
        const mid = (left + right) / 2;
        const dest = jump_table.destinations[mid];

        if (dest == target) return true;
        if (dest < target) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    return false;
}
```

## Testing Requirements

### Unit Tests MUST Cover
- Bytecode parsing with all opcode types
- JUMPDEST validation in complex control flows
- Pattern matching and fusion correctness
- Security issue detection accuracy
- Code size limit enforcement

### Property-Based Testing
- Random bytecode generation and parsing
- Fusion equivalence verification
- Jump table consistency checks
- Gas estimation accuracy bounds

### Integration Tests
- Real contract bytecode analysis
- Performance regression testing
- Cache effectiveness measurement
- Cross-reference with other analyzers

## Critical Error Conditions

### Parse Failures
```zig
pub const BytecodeError = error{
    TruncatedPushData,    // PUSH instruction extends beyond code end
    InvalidOpcode,        // Undefined opcode encountered
    CodeTooLarge,        // Exceeds size limits
    JumpTableOverflow,   // Too many jump destinations
    FusionGasMismatch,   // Optimization changes gas costs
    FusionStackMismatch, // Optimization changes stack effects
};
```

### Recovery Strategies
```zig
// Fallback to safe mode on analysis failure
pub fn safe_mode_analysis(code: []const u8) BytecodeAnalysis {
    return BytecodeAnalysis{
        .instructions = parse_instructions_basic(code),
        .jump_destinations = find_all_jumpdests(code),
        .optimizations_applied = false, // No fusion in safe mode
        .security_issues = &.{}, // No security analysis
    };
}
```

## Emergency Procedures

### Bytecode Analysis Failure
1. **Fallback Mode**: Disable optimizations, use basic analysis
2. **Code Validation**: Verify bytecode follows EVM specification
3. **Reference Check**: Compare analysis with other tools
4. **Safe Execution**: Execute without optimizations

### Fusion Bug Discovery
1. **Immediate Disable**: Turn off affected fusion patterns
2. **Rollback Analysis**: Re-analyze all cached bytecode
3. **Verification**: Ensure original semantics preserved
4. **Gradual Re-enable**: Test thoroughly before re-activating

Remember: **Bytecode analysis affects every contract execution.** Any error in parsing or optimization can cause widespread consensus failures. Always prioritize correctness over performance and maintain comprehensive validation of all transformations.