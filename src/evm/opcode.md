# Opcode

Comprehensive EVM opcode support with optimization extensions.

## Synopsis

```zig
const is_push = opcode.isPush();
const size = opcode.pushSize();
const info = OPCODE_INFO[@intFromEnum(opcode)];
```

## Description

Provides standard EVM opcodes, synthetic fusion opcodes for optimization, and detailed metadata for gas calculation and stack validation. Supports all EVM opcodes through latest hard forks with performance-oriented extensions.

## Architecture & Design

### Core Components

1. **Standard Opcodes**: Complete EVM opcode enumeration with utility methods
2. **Synthetic Opcodes**: Fused operations for bytecode optimization  
3. **Opcode Metadata**: Gas costs, stack requirements, and execution properties
4. **Hard Fork Support**: Opcode availability across different network upgrades

### Design Principles

1. **EVM Specification Compliance**: All opcodes follow official Ethereum specifications
2. **Performance Optimization**: Synthetic opcodes combine common patterns
3. **Type Safety**: Strong typing with compile-time validation
4. **Extensibility**: Easy addition of new opcodes and metadata

## Standard Opcodes (opcode.zig)

### Opcode Enumeration

```zig
pub const Opcode = enum(u8) {
    // 0x00s: Stop and Arithmetic Operations
    STOP = 0x00,        ADD = 0x01,         MUL = 0x02,         SUB = 0x03,
    DIV = 0x04,         SDIV = 0x05,        MOD = 0x06,         SMOD = 0x07,
    ADDMOD = 0x08,      MULMOD = 0x09,      EXP = 0x0a,         SIGNEXTEND = 0x0b,
    
    // 0x10s: Comparison & Bitwise Logic Operations  
    LT = 0x10,          GT = 0x11,          SLT = 0x12,         SGT = 0x13,
    EQ = 0x14,          ISZERO = 0x15,      AND = 0x16,         OR = 0x17,
    XOR = 0x18,         NOT = 0x19,         BYTE = 0x1a,        SHL = 0x1b,
    SHR = 0x1c,         SAR = 0x1d,
    
    // 0x20s: Crypto
    KECCAK256 = 0x20,
    
    // 0x30s: Environmental Information
    ADDRESS = 0x30,     BALANCE = 0x31,     ORIGIN = 0x32,      CALLER = 0x33,
    CALLVALUE = 0x34,   CALLDATALOAD = 0x35, CALLDATASIZE = 0x36, CALLDATACOPY = 0x37,
    CODESIZE = 0x38,    CODECOPY = 0x39,    GASPRICE = 0x3a,    EXTCODESIZE = 0x3b,
    EXTCODECOPY = 0x3c, RETURNDATASIZE = 0x3d, RETURNDATACOPY = 0x3e, EXTCODEHASH = 0x3f,
    
    // 0x40s: Block Information
    BLOCKHASH = 0x40,   COINBASE = 0x41,    TIMESTAMP = 0x42,   NUMBER = 0x43,
    DIFFICULTY = 0x44,  GASLIMIT = 0x45,    CHAINID = 0x46,     SELFBALANCE = 0x47,
    BASEFEE = 0x48,     BLOBHASH = 0x49,    BLOBBASEFEE = 0x4a,
    
    // 0x50s: Stack, Memory, Storage and Flow Operations
    POP = 0x50,         MLOAD = 0x51,       MSTORE = 0x52,      MSTORE8 = 0x53,
    SLOAD = 0x54,       SSTORE = 0x55,      JUMP = 0x56,        JUMPI = 0x57,
    PC = 0x58,          MSIZE = 0x59,       GAS = 0x5a,         JUMPDEST = 0x5b,
    TLOAD = 0x5c,       TSTORE = 0x5d,      MCOPY = 0x5e,       PUSH0 = 0x5f,
    
    // 0x60-0x7f: PUSH1-PUSH32
    PUSH1 = 0x60, PUSH2 = 0x61, PUSH3 = 0x62, PUSH4 = 0x63, ... PUSH32 = 0x7f,
    
    // 0x80-0x8f: DUP1-DUP16  
    DUP1 = 0x80, DUP2 = 0x81, DUP3 = 0x82, DUP4 = 0x83, ... DUP16 = 0x8f,
    
    // 0x90-0x9f: SWAP1-SWAP16
    SWAP1 = 0x90, SWAP2 = 0x91, SWAP3 = 0x92, SWAP4 = 0x93, ... SWAP16 = 0x9f,
    
    // 0xa0-0xa4: LOG0-LOG4
    LOG0 = 0xa0,        LOG1 = 0xa1,        LOG2 = 0xa2,       LOG3 = 0xa3,       LOG4 = 0xa4,
    
    // 0xf0s: System Operations
    CREATE = 0xf0,      CALL = 0xf1,        CALLCODE = 0xf2,    RETURN = 0xf3,
    DELEGATECALL = 0xf4, CREATE2 = 0xf5,    STATICCALL = 0xfa,  REVERT = 0xfd,
    INVALID = 0xfe,     SELFDESTRUCT = 0xff,
};
```

### Opcode Utility Methods

#### PUSH Operation Detection

```zig
// Check if opcode is any PUSH operation (PUSH0-PUSH32)
pub fn isPush(self: Opcode) bool

// Get number of bytes pushed (0-32)
pub fn pushSize(self: Opcode) u8

// Examples:
try std.testing.expect(Opcode.PUSH1.isPush());              // true
try std.testing.expectEqual(@as(u8, 1), Opcode.PUSH1.pushSize());  // 1 byte
try std.testing.expectEqual(@as(u8, 32), Opcode.PUSH32.pushSize()); // 32 bytes
try std.testing.expectEqual(@as(u8, 0), Opcode.PUSH0.pushSize());   // 0 bytes
```

#### DUP Operation Detection

```zig  
// Check if opcode is any DUP operation (DUP1-DUP16)
pub fn isDup(self: Opcode) bool

// Get DUP position (1-16)
pub fn dupPosition(self: Opcode) u8

// Examples:
try std.testing.expect(Opcode.DUP5.isDup());                // true
try std.testing.expectEqual(@as(u8, 5), Opcode.DUP5.dupPosition()); // position 5
```

#### SWAP Operation Detection

```zig
// Check if opcode is any SWAP operation (SWAP1-SWAP16)
pub fn isSwap(self: Opcode) bool

// Get SWAP position (1-16)
pub fn swapPosition(self: Opcode) u8

// Examples:
try std.testing.expect(Opcode.SWAP3.isSwap());              // true
try std.testing.expectEqual(@as(u8, 3), Opcode.SWAP3.swapPosition()); // position 3
```

#### LOG Operation Detection

```zig
// Check if opcode is any LOG operation (LOG0-LOG4)
pub fn isLog(self: Opcode) bool

// Get number of topics (0-4)
pub fn logTopics(self: Opcode) u8

// Examples:
try std.testing.expect(Opcode.LOG2.isLog());                // true
try std.testing.expectEqual(@as(u8, 2), Opcode.LOG2.logTopics()); // 2 topics
```

#### Opcode Categorization

```zig
// Execution flow control
pub fn isTerminating(self: Opcode) bool      // STOP, RETURN, REVERT, etc.

// State modification capability  
pub fn isStateModifying(self: Opcode) bool   // SSTORE, LOG*, CREATE, CALL, etc.

// Operation categories
pub fn isArithmetic(self: Opcode) bool       // ADD, MUL, SUB, DIV, etc.
pub fn isComparison(self: Opcode) bool       // LT, GT, EQ, ISZERO, etc.  
pub fn isBitwise(self: Opcode) bool          // AND, OR, XOR, NOT, SHL, etc.

// String representation
pub fn name(self: Opcode) []const u8         // Returns opcode name
```

## Synthetic Opcodes (opcode_synthetic.zig)

### Fusion Opcodes for Optimization

Synthetic opcodes combine common bytecode patterns for better performance:

```zig
pub const OpcodeSynthetic = enum(u8) {
    // PUSH + Arithmetic fusion
    PUSH_ADD_INLINE = 0xB0,     // PUSH small_value + ADD
    PUSH_ADD_POINTER = 0xB1,    // PUSH large_value + ADD
    PUSH_MUL_INLINE = 0xB2,     // PUSH small_value + MUL  
    PUSH_MUL_POINTER = 0xB3,    // PUSH large_value + MUL
    PUSH_DIV_INLINE = 0xB4,     // PUSH small_value + DIV
    PUSH_DIV_POINTER = 0xB5,    // PUSH large_value + DIV
    PUSH_SUB_INLINE = 0xBA,     // PUSH small_value + SUB
    PUSH_SUB_POINTER = 0xBB,    // PUSH large_value + SUB
    
    // PUSH + Jump fusion  
    PUSH_JUMP_INLINE = 0xB6,    // PUSH jump_target + JUMP
    PUSH_JUMP_POINTER = 0xB7,   // PUSH large_target + JUMP
    PUSH_JUMPI_INLINE = 0xB8,   // PUSH jump_target + JUMPI
    PUSH_JUMPI_POINTER = 0xB9,  // PUSH large_target + JUMPI
};
```

### Conflict Detection

Compile-time validation ensures synthetic opcodes don't conflict with standard opcodes:

```zig
comptime {
    // Automatically detects conflicts between synthetic and standard opcodes
    for (@typeInfo(OpcodeSynthetic).@"enum".fields) |syn_field| {
        if (std.meta.intToEnum(Opcode, syn_field.value) catch null) |conflicting| {
            @compileError("Synthetic opcode conflicts with standard opcode");
        }
    }
}
```

### Performance Benefits

1. **Reduced Instruction Stream**: Two operations become one handler call
2. **Fewer Memory Accesses**: Combined operation requires fewer instruction fetches
3. **Better Cache Utilization**: Less instruction stream data to load
4. **Stack Operation Elimination**: No intermediate push/pop between fused operations

## Opcode Metadata (opcode_data.zig)

### OpcodeInfo Structure

```zig
pub const OpcodeInfo = struct {
    gas_cost: u16,          // Base gas cost (some opcodes have dynamic costs)
    stack_inputs: u4,       // Number of stack items consumed
    stack_outputs: u4,      // Number of stack items produced
};
```

### Static Opcode Information Table

```zig
pub const OPCODE_INFO = [256]OpcodeInfo{
    // Pre-calculated at compile time for all 256 possible opcodes
    // Examples:
    [@intFromEnum(Opcode.ADD)] = .{ .gas_cost = 3, .stack_inputs = 2, .stack_outputs = 1 },
    [@intFromEnum(Opcode.PUSH1)] = .{ .gas_cost = 3, .stack_inputs = 0, .stack_outputs = 1 },
    [@intFromEnum(Opcode.SSTORE)] = .{ .gas_cost = 100, .stack_inputs = 2, .stack_outputs = 0 },
    // ... all opcodes
};
```

### Gas Cost Categories

Gas costs are derived from EVM specification constants:

```zig
// From primitives.GasConstants
GasFastestStep = 3,     // Simple operations (ADD, PUSH, etc.)
GasFastStep = 5,        // Fast operations (MUL, DIV, etc.) 
GasMidStep = 8,         // Medium operations (ADDMOD, MULMOD, etc.)
GasSlowStep = 10,       // Slow operations (EXP base cost)
LogGas = 375,           // Base LOG cost
LogTopicGas = 375,      // Per topic LOG cost
```

### Stack Requirement Calculation

```zig
// Calculate minimum stack items required before execution
pub fn getMinStackRequired(opcode: u8) u16

// Calculate maximum stack size after execution  
pub fn getMaxStackAfter(opcode: u8) u16

// Special handling for DUP/SWAP operations:
// DUPn requires n items on stack
// SWAPn requires n+1 items on stack
```

### Hard Fork Support

```zig
pub const HARDFORK_OPCODES = struct {
    pub const CANCUN_OPCODES = [_]u8{ 0x5c, 0x5d, 0x49, 0x5e, 0x4a }; // TLOAD, TSTORE, BLOBHASH, MCOPY, BLOBBASEFEE
    pub const SHANGHAI_OPCODES = [_]u8{0x5f};                           // PUSH0
    pub const LONDON_OPCODES = [_]u8{0x48};                            // BASEFEE
    pub const ISTANBUL_OPCODES = [_]u8{ 0x46, 0x47 };                  // CHAINID, SELFBALANCE
    pub const CONSTANTINOPLE_OPCODES = [_]u8{ 0xf5, 0x1b, 0x1c, 0x1d, 0x3f }; // CREATE2, SHL, SHR, SAR, EXTCODEHASH
    pub const BYZANTIUM_OPCODES = [_]u8{ 0xfd, 0x3d, 0x3e, 0xfa };     // REVERT, RETURNDATASIZE, RETURNDATACOPY, STATICCALL
};
```

## Testing

### Comprehensive Test Coverage

The opcode system includes extensive tests covering:

1. **Enum Values**: All opcodes have correct hex values per EVM specification
2. **Detection Methods**: PUSH/DUP/SWAP/LOG detection works correctly for all variants
3. **Utility Functions**: Position calculations and size queries return correct values
4. **Categorization**: Arithmetic, comparison, bitwise, and state-modifying detection
5. **Boundary Cases**: Edge cases and invalid inputs handled properly
6. **Synthetic Opcodes**: No conflicts with standard opcodes, unique values
7. **Metadata Accuracy**: Gas costs and stack requirements match EVM specification

### Test Execution

```bash
# Run all opcode tests
zig build test

# Run opcode-specific tests  
zig build test -- --test-filter "opcode"
```

### Critical Test Scenarios

1. **EVM Specification Compliance**: All standard opcodes have correct values
2. **Stack Requirements**: Min/max calculations handle DUP/SWAP special cases
3. **Gas Cost Accuracy**: Costs match official EVM gas schedule
4. **Synthetic Safety**: No conflicts between synthetic and standard opcodes

## Context within EVM

### Integration with Frame

Opcodes are executed by Frame opcode handlers:

```zig
// Example opcode handler in Frame
pub fn op_add(self: *Self) Error!void {
    const b = self.stack.pop_unsafe();  // Pre-validated by planner
    const a = self.stack.peek_unsafe(); 
    const result = a +% b;              // EVM wrapping arithmetic
    self.stack.set_top_unsafe(result);
}
```

### Integration with Planner

The Planner uses opcode metadata for analysis:

```zig
// Planner analyzes stack requirements
const info = opcode_data.OPCODE_INFO[op];
static_gas_accum += info.gas_cost;
stack_height += @as(i32, info.stack_outputs) - @as(i32, info.stack_inputs);

// Planner detects fusion opportunities
if (next_op == @intFromEnum(Opcode.ADD)) {
    handler_op = @intFromEnum(OpcodeSynthetic.PUSH_ADD_INLINE);
    fused = true;
}
```

### Integration with Jump Table

Opcodes are dispatched via jump table in the EVM:

```zig
// Jump table dispatch
const handler = table.execute_funcs[opcode];
try handler(frame, plan);
```

### EVM Specification Compliance

The implementation maintains strict EVM compliance:

1. **Stack Semantics**: All operations follow EVM stack behavior (LIFO)
2. **Gas Costs**: Base costs match EVM specification (dynamic costs calculated at runtime)
3. **Error Conditions**: Proper handling of stack underflow/overflow, invalid jumps
4. **Hard Fork Support**: Opcodes available only in appropriate network upgrades
5. **Arithmetic Behavior**: Wrapping arithmetic for overflow, division by zero returns 0

## Performance Considerations

### Jump Table Dispatch

Opcodes are dispatched via direct function pointers for minimal overhead:

```zig
// O(1) dispatch without branch prediction penalties
const handler = handlers[opcode];
try handler(frame, plan);
```

### Synthetic Opcode Benefits

Fusion opcodes provide measurable performance improvements:

- **Instruction Stream Reduction**: ~20-30% fewer elements for common patterns
- **Cache Efficiency**: Fewer memory accesses improve cache hit rates  
- **Branch Prediction**: Consistent handler patterns improve prediction accuracy
- **Stack Pressure**: Elimination of intermediate stack operations

### Metadata Caching

Static metadata enables fast analysis:

- **Compile-time Calculation**: All costs and requirements pre-computed
- **Array Lookup**: O(1) metadata access by opcode value
- **Cache-Friendly**: Metadata structure optimized for cache line utilization

The opcode system forms the foundation of EVM execution, providing both specification compliance and performance optimization through intelligent fusion and comprehensive metadata support.