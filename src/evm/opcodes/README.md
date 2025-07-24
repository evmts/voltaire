# Opcode Definitions and Metadata

Core opcode definitions, metadata structures, and validation utilities for the EVM instruction set. This folder provides the foundational types and constants used throughout the execution engine.

## Purpose

The opcodes module provides:
- Complete enumeration of all EVM opcodes (0x00-0xFF)
- Operation metadata including gas costs and stack effects
- Pre-computed stack validation tables for performance
- Memory size calculation utilities
- Type-safe opcode categorization and utilities

## Architecture

The module separates concerns into:
1. **Opcode Definition**: Static enumeration with utility methods
2. **Operation Metadata**: Runtime configuration per opcode
3. **Stack Validation**: Pre-computed height change table
4. **Memory Requirements**: Size calculation for expansion

## Files

### `opcode.zig`
Complete enumeration of EVM opcodes with extensive utilities.

**Opcode Categories**:
```zig
// Arithmetic (0x01-0x0B)
ADD, MUL, SUB, DIV, SDIV, MOD, SMOD, ADDMOD, MULMOD, EXP, SIGNEXTEND

// Comparison & Bitwise (0x10-0x1D)
LT, GT, SLT, SGT, EQ, ISZERO, AND, OR, XOR, NOT, BYTE, SHL, SHR, SAR

// SHA3 (0x20)
KECCAK256

// Environmental (0x30-0x3F)
ADDRESS, BALANCE, ORIGIN, CALLER, CALLVALUE, CALLDATALOAD, 
CALLDATASIZE, CALLDATACOPY, CODESIZE, CODECOPY, GASPRICE, 
EXTCODESIZE, EXTCODECOPY, RETURNDATASIZE, RETURNDATACOPY, EXTCODEHASH

// Block Information (0x40-0x48)
BLOCKHASH, COINBASE, TIMESTAMP, NUMBER, DIFFICULTY/PREVRANDAO, 
GASLIMIT, CHAINID, SELFBALANCE, BASEFEE

// Stack, Memory, Storage (0x50-0x5F)
POP, MLOAD, MSTORE, MSTORE8, SLOAD, SSTORE, JUMP, JUMPI, 
PC, MSIZE, GAS, JUMPDEST, TLOAD, TSTORE, MCOPY, PUSH0

// Push Operations (0x60-0x7F)
PUSH1 through PUSH32

// Duplication (0x80-0x8F)
DUP1 through DUP16

// Exchange (0x90-0x9F)
SWAP1 through SWAP16

// Logging (0xA0-0xA4)
LOG0 through LOG4

// System (0xF0-0xFF)
CREATE, CALL, CALLCODE, RETURN, DELEGATECALL, CREATE2, 
STATICCALL, REVERT, INVALID, SELFDESTRUCT
```

**Utility Methods**:
- `to_u8()`: Convert to byte value
- `get_name()`: Get mnemonic string
- `is_push()`: Check if PUSH opcode
- `is_dup()`: Check if DUP opcode
- `is_swap()`: Check if SWAP opcode
- `is_log()`: Check if LOG opcode
- `get_push_size()`: Extract push byte count (1-32)
- `get_dup_position()`: Extract dup position (1-16)
- `get_swap_position()`: Extract swap position (1-16)
- `get_log_topics()`: Extract topic count (0-4)
- `is_terminating()`: Check if ends execution
- `modifies_state()`: Check if modifies blockchain

**Design**: Tagged union enum with exhaustive matching

**Used By**: Entire EVM for opcode identification

### `operation.zig`
Runtime metadata for opcode execution.

**Operation Structure**:
```zig
Operation = struct {
    // Core execution
    execute: ExecutionFunc,      // Implementation function
    
    // Gas costs
    constant_gas: u64,          // Base gas cost
    dynamic_gas: ?GasFunc,      // Dynamic gas calculation
    
    // Stack requirements
    min_stack: u32,             // Required stack items
    max_stack: u32,             // Max allowed after execution
    
    // Memory requirements
    memory_size: ?MemorySizeFunc, // Memory expansion needed
    
    // Validity
    undefined: bool,            // Is opcode invalid?
}
```

**Function Types**:
- `ExecutionFunc`: `fn(Frame, PC) !RunAction`
- `GasFunc`: `fn(Frame) !u64`
- `MemorySizeFunc`: `fn(Frame) !?MemorySize`

**Key Features**:
- Hot fields first for cache optimization
- Function pointers for hardfork flexibility
- NULL_OPERATION singleton for undefined ops
- Compile-time validation of stack effects

**Used By**: Jump table for dispatch configuration

### `stack_height_changes.zig`
Pre-computed table of stack height changes.

**Lookup Table**:
```zig
STACK_HEIGHT_CHANGES: [256]i8 = .{
    0,   // 0x00 STOP
    -1,  // 0x01 ADD (pop 2, push 1)
    -1,  // 0x02 MUL (pop 2, push 1)
    // ... all 256 opcodes
}
```

**Stack Effect Patterns**:
- Binary ops: -1 (consume 2, produce 1)
- Ternary ops: -2 (consume 3, produce 1)
- Unary ops: 0 (consume 1, produce 1)
- Push ops: +1 (produce 1)
- Pop op: -1 (consume 1)
- DUP ops: +1 (duplicate existing)
- SWAP ops: 0 (rearrange only)

**Validation Function**:
```zig
validate_stack_requirements_fast(
    current_height: u16,
    opcode: u8,
    min_stack: u32,
    max_stack: u32
) !void
```

**Performance**: O(1) lookup eliminates computation

**Used By**: Jump table for stack validation

### `memory_size.zig`
Memory requirement calculation utilities.

**Structure**:
```zig
MemorySize = struct {
    offset: u64,  // Starting memory offset
    size: u64,    // Number of bytes needed
}
```

**Key Concepts**:
- Represents memory access requirements
- Used for gas cost pre-calculation
- Zero size means no memory expansion
- Overflow-safe addition required

**Usage Pattern**:
```zig
// Calculate memory needed for operation
const mem_size = try calculateMemorySize(offset, size);
if (mem_size) |ms| {
    const expansion_cost = memory.expansionCost(ms.offset + ms.size);
    try consumeGas(expansion_cost);
}
```

**Used By**: Operations that access memory

## Design Principles

### 1. **Separation of Concerns**
- Static data (opcodes) vs runtime data (operations)
- Validation separate from execution
- Gas calculation separate from logic

### 2. **Performance Optimization**
- Pre-computed lookup tables
- Hot field optimization
- O(1) validation checks
- Zero allocation design

### 3. **Type Safety**
- Strong enum types
- Explicit error handling
- No implicit conversions
- Exhaustive matching

### 4. **Flexibility**
- Function pointers for hardfork changes
- Optional dynamic behaviors
- Extensible metadata structure

## Usage Examples

### Opcode Identification
```zig
const opcode = Opcode.ADD;
const byte_value = opcode.to_u8(); // 0x01
const name = opcode.get_name();    // "ADD"
```

### Stack Validation
```zig
const current_stack = 5;
const opcode_byte = 0x01; // ADD
try validate_stack_requirements_fast(
    current_stack, 
    opcode_byte,
    2,    // min_stack for ADD
    1024  // max_stack
);
```

### State Modification Check
```zig
if (opcode.modifies_state()) {
    if (is_static_call) return error.StateModificationInStaticCall;
}
```

### Push Size Extraction
```zig
if (opcode.is_push()) {
    const push_size = opcode.get_push_size();
    const data = bytecode[pc+1..pc+1+push_size];
}
```

## Performance Characteristics

- **Opcode lookup**: O(1) enum access
- **Stack validation**: O(1) table lookup
- **Name resolution**: O(1) switch statement
- **Category checks**: O(1) range comparison
- **Memory overhead**: ~2KB for tables

## Testing

The module includes tests for:
- Opcode byte value correctness
- Stack height change accuracy
- Utility function validation
- Edge case handling
- Table generation verification

## Future Considerations

- EOF format will add new validation rules
- Static jumps may require metadata updates
- New opcodes need table regeneration
- SIMD operations may batch simple opcodes