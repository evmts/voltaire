# Fusion Feature Debugging Context

## Overview

The Guillotine EVM implementation has an advanced performance optimization feature called "fusions" that combines multiple opcodes into single synthetic opcodes for better cache efficiency and reduced dispatch overhead. The EVM works correctly without fusions enabled, but breaks when fusions are turned on.

## Current Status

- ✅ EVM working without fusions (`enable_fusion: false` in `evm_config.zig`)
- ❌ EVM broken with fusions enabled (`enable_fusion: true` in `evm_config.zig`)
- 🎯 Goal: Fix fusion implementation and ensure differential tests pass with fusions enabled

## Architecture Overview

### How the EVM Works

1. **Bytecode Analysis** (`src/evm/bytecode.zig`): 
   - Analyzes raw EVM bytecode
   - Detects fusion opportunities (PUSH+ADD, PUSH+MUL, etc.)
   - Returns an iterator with fusion metadata

2. **Dispatch System** (`src/evm/dispatch.zig`):
   - Converts bytecode into optimized instruction stream
   - Creates array of function pointers and metadata
   - Handles both regular and synthetic opcodes
   - Key method: `Dispatch.init()` creates the instruction stream

3. **Frame Execution** (`src/evm/frame.zig`):
   - Executes the instruction stream using tail-call recursion
   - Method: `Frame.interpret()` starts execution
   - Each handler executes and tail-calls the next

4. **Opcode Handlers**:
   - Regular handlers in `handlers_*.zig` files
   - Synthetic handlers in `handlers_*_synthetic.zig` files

## Fusion System Components

### Configuration

**File**: `src/evm/evm_config.zig`
```zig
pub const EvmConfig = struct {
    enable_fusion: bool = true,  // Toggle fusion on/off
    // ... other config
}
```

### Synthetic Opcodes

**File**: `src/evm/opcode_synthetic.zig`

Defines synthetic opcodes in range 0xA5-0xBC:
- `PUSH_ADD_INLINE` (0xA5) - PUSH small value + ADD
- `PUSH_ADD_POINTER` (0xA6) - PUSH large value + ADD
- `PUSH_MUL_INLINE` (0xA7) - PUSH small value + MUL
- `PUSH_JUMP_INLINE` (0xAB) - PUSH target + JUMP
- `PUSH_JUMPI_INLINE` (0xAD) - PUSH target + JUMPI
- ... and more

### Fusion Detection

**File**: `src/evm/bytecode_analyze.zig`

Key functions:
- `bytecodeAnalyze()` - Main analysis function
- `checkConstantFoldingPatternWithFusion()` - Detects PUSH+PUSH+OP patterns
- `checkNPushPattern()` - Detects multiple consecutive PUSHes
- `checkIszeroJumpiFusion()` - Detects ISZERO+PUSH+JUMPI pattern

### Dispatch Integration

**File**: `src/evm/dispatch.zig`

Key components:
```zig
// Process fusion operations (lines 587-626)
.push_add_fusion => handleFusionOperation(...)
.push_mul_fusion => handleFusionOperation(...)

// Helper to handle fusion operations (lines 701-724)
fn handleFusionOperation(...) {
    // Gets synthetic handler
    // Adds handler + metadata to instruction stream
}

// Get synthetic opcode mapping (lines 739-751)
fn getSyntheticOpcode(fusion_type, is_inline) {
    // Maps fusion type to correct synthetic opcode
}
```

### Synthetic Handlers

**Arithmetic Fusions** (`handlers_arithmetic_synthetic.zig`):
```zig
pub fn push_add_inline(self, cursor) {
    const push_value = cursor[1].push_inline.value;
    const top = self.stack.pop_unsafe();
    const result = top +% push_value;
    self.stack.push_unsafe(result);
    // Tail-call next handler at cursor[2]
}
```

**Jump Fusions** (`handlers_jump_synthetic.zig`):
```zig
pub fn push_jump_inline(self, cursor) {
    const dest = cursor[1].push_inline.value;
    // Validate and perform jump using jump table
}
```

### Handler Registration

**File**: `src/evm/frame_handlers.zig`

- `getOpcodeHandlers()` - Returns array of 256 regular opcode handlers
- `getSyntheticHandler()` - Maps synthetic opcodes to their handlers (lines 173-205)

## Key Data Structures

### Dispatch Item Union
```zig
pub const Item = union {
    opcode_handler: *const fn(...),
    jump_dest: JumpDestMetadata,
    push_inline: PushInlineMetadata,
    push_pointer: PushPointerMetadata,
    pc: PcMetadata,
    first_block_gas: FirstBlockMetadata,
};
```

### Metadata Cursor Pattern
The instruction stream follows pattern:
```
[handler_ptr, metadata, handler_ptr, metadata, ...]
```

For synthetic opcodes:
- `cursor[0]` = synthetic handler function pointer
- `cursor[1]` = metadata (inline value or pointer)
- `cursor[2]` = next handler

## Testing Infrastructure

### Differential Testing

**File**: `test/differential/differential_testor.zig`

Key capabilities:
- Runs bytecode on both REVM (Rust reference) and Guillotine
- Compares execution results and traces
- Method: `test_bytecode_with_tracing_and_calldata_and_gas()`

**Enhancement Needed**: Update to test three configurations:
1. REVM execution
2. Guillotine without fusions
3. Guillotine with fusions

### Test Commands

```bash
# Run all opcode differential tests
zig build test-opcodes

# Run specific opcode test
zig build test-opcodes-0x01

# Build and run tests
zig build test
```

### Test Files

- `test/fusions.zig` - Basic fusion tests
- `test/fusions_dispatch.zig` - Dispatch-specific fusion tests
- `test/differential/synthetic_toggle_test.zig` - Toggle fusion testing
- `test/evm/opcodes/*_test.zig` - Per-opcode differential tests

## Debugging Strategy

### 1. Enable Detailed Logging

Key log locations:
- `dispatch.zig:524-576` - Bytecode parsing and fusion detection
- `handlers_*_synthetic.zig` - Synthetic handler execution
- `differential_testor.zig` - Test execution comparison

### 2. Create Minimal Test Cases

Start with simple fusion patterns:
```zig
// PUSH1 5 + ADD
const bytecode = [_]u8{
    0x60, 0x0A,  // PUSH1 10
    0x60, 0x05,  // PUSH1 5  } Should fuse
    0x01,        // ADD      } to PUSH_ADD_INLINE
};
```

### 3. Trace Execution Flow

1. Set breakpoints in:
   - `bytecode_analyze.zig` fusion detection
   - `dispatch.zig:handleFusionOperation()`
   - Synthetic handlers in `handlers_*_synthetic.zig`

2. Verify:
   - Fusion correctly detected
   - Synthetic handler properly registered
   - Metadata correctly embedded
   - Handler executes with correct cursor position

### 4. Common Issues to Check

1. **Cursor Advancement**: Synthetic handlers must advance cursor correctly (usually `cursor + 2`)
2. **Metadata Access**: Ensure `cursor[1]` contains expected metadata
3. **Stack State**: Verify stack operations match non-fused behavior
4. **Jump Table**: For jump fusions, ensure jump table lookup works
5. **Gas Accounting**: Verify gas consumption matches expected values

## Important Methods and Constants

### Key Methods

- `bytecode.createIterator()` - Creates iterator that detects fusions
- `Dispatch.init()` - Creates optimized instruction stream
- `Dispatch.handleFusionOperation()` - Processes fusion operations
- `Frame.interpret()` - Main execution entry point
- `getSyntheticHandler()` - Maps synthetic opcodes to handlers
- `differential_testor.test_bytecode()` - Main test entry point

### Key Constants

- Synthetic opcode range: `0xA5` - `0xBC`
- Inline value threshold: 8 bytes (fits in u64)
- Fusion types: `push_add`, `push_mul`, `push_sub`, `push_div`, `push_jump`, `push_jumpi`, etc.

## Next Steps

1. **Update Differential Tester**:
   - Modify to test REVM vs Guillotine-no-fusion vs Guillotine-with-fusion
   - Add clear logging for fusion vs non-fusion execution paths

2. **Create Fusion-Specific Tests**:
   - Unit tests for each synthetic opcode
   - Tests for cursor advancement
   - Tests for metadata access

3. **Add Debug Logging**:
   - Log when fusions are detected
   - Log synthetic handler execution
   - Log cursor positions and metadata values

4. **Fix Issues**:
   - Start with simplest fusion (PUSH_ADD_INLINE)
   - Verify cursor advancement
   - Check metadata embedding and access
   - Ensure proper tail-call continuation

5. **Reduce Log Noise**:
   - Create custom log scopes for fusion debugging
   - Filter out unrelated logs
   - Add pretty_print methods for dispatch items

## Files to Focus On

Priority files for debugging:
1. `src/evm/dispatch.zig` - Fusion integration point
2. `src/evm/handlers_arithmetic_synthetic.zig` - Simplest synthetic handlers
3. `src/evm/bytecode_analyze.zig` - Fusion detection logic
4. `src/evm/frame_handlers.zig` - Handler registration
5. `test/differential/differential_testor.zig` - Test framework

## Known Issues

- Fusions break execution when enabled
- Differential tests fail with fusions
- Need better test isolation for fusion vs non-fusion
- Log noise makes debugging difficult
- Missing unit tests for individual synthetic opcodes