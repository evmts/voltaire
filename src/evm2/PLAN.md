# TDD Plan for create_instruction_stream Implementation

## Overview
Transform the `run` method in analysis.zig to `create_instruction_stream` that builds an instruction stream with metadata using the handler array passed from Frame.

## Development Steps

### 1. Update Analysis struct signature (RED → GREEN)
- [ ] Remove allocator from init
- [ ] Remove deinit method
- [ ] Write test that calls `Analysis.init(bytecode)` without allocator
- [ ] Run `zig build test-evm2` - should fail
- [ ] Update init signature
- [ ] Run `zig build test-evm2` - should pass

### 2. Define synthetic opcode constants (RED → GREEN)
- [ ] Write test that references synthetic opcodes (PUSH_ADD_INLINE, etc.)
- [ ] Run `zig build test-evm2` - should fail (undefined)
- [ ] Add synthetic opcode constants starting at 0xF5 (avoiding Arbitrum/Optimism)
- [ ] Run `zig build test-evm2` - should pass

### 3. Define metadata structs (RED → GREEN)
- [ ] Write test that creates metadata structs with proper sizing
- [ ] Run `zig build test-evm2` - should fail
- [ ] Define metadata structs:
  - `PushInlineMetadata = struct { value: usize }`
  - `PushPointerMetadata = struct { ptr: usize }`
  - `JumpMetadata = struct { dest_idx: PcType, _padding: [padding_size]u8 }`
  - `JumpDestMetadata = struct { gas: u32, min_stack: i16, max_stack: i16 }`
- [ ] Run `zig build test-evm2` - should pass

### 4. Update AnalyzerPlan structure (RED → GREEN)
- [ ] Write test expecting new Plan fields (instructionStream, u256_constants, jump_table)
- [ ] Run `zig build test-evm2` - should fail
- [ ] Update Plan to include:
  - `instructionStream: []usize`
  - `u256_constants: []WordType`
  - `jump_table: []struct { pc: PcType, instruction_idx: PcType }`
  - Remove `bytecodeLen`
  - Rename `blocks` to `jumpDestMetadata`
- [ ] Add `getMetadata` and `getNextInstruction` methods
- [ ] Run `zig build test-evm2` - should pass

### 5. Create handler array type and basic create_instruction_stream (RED → GREEN)
- [ ] Write test that calls `create_instruction_stream` with handler array
- [ ] Run `zig build test-evm2` - should fail
- [ ] Change `run` to `create_instruction_stream(self: *Self, allocator: Allocator, handlers: [256]*const HandlerFn)`
- [ ] Implement basic stream building (no fusions yet)
- [ ] Run `zig build test-evm2` - should pass

### 6. Implement PUSH inline vs pointer logic (RED → GREEN)
- [ ] Write test for PUSH1 (inline) and PUSH32 (pointer)
- [ ] Run `zig build test-evm2` - should fail
- [ ] Implement logic to:
  - Store values ≤ maxInt(usize) inline
  - Store larger values in u256_constants array
- [ ] Run `zig build test-evm2` - should pass

### 7. Implement fusion detection for PUSH+ADD (RED → GREEN)
- [ ] Write test for `PUSH1 5; ADD` expecting PUSH_ADD_INLINE opcode
- [ ] Run `zig build test-evm2` - should fail
- [ ] Implement lookahead for PUSH followed by ADD
- [ ] Use synthetic opcode in stream
- [ ] Run `zig build test-evm2` - should pass

### 8. Implement fusion detection for PUSH+JUMP (RED → GREEN)
- [ ] Write test for `PUSH1 4; JUMP` expecting PUSH_JUMP_INLINE opcode
- [ ] Run `zig build test-evm2` - should fail
- [ ] Implement PUSH+JUMP fusion with pre-validated destination
- [ ] Run `zig build test-evm2` - should pass

### 9. Implement JumpDestMetadata handling (RED → GREEN)
- [ ] Write test checking JUMPDEST instructions have metadata
- [ ] Run `zig build test-evm2` - should fail
- [ ] On 64-bit: pack JumpDestMetadata into usize
- [ ] On 32-bit: store in constants array and use pointer
- [ ] Run `zig build test-evm2` - should pass

### 10. Implement dynamic jump table (RED → GREEN)
- [ ] Write test for dynamic JUMP (not fused)
- [ ] Run `zig build test-evm2` - should fail
- [ ] Build sorted jump_table array
- [ ] Implement binary search in lookupInstructionIdx
- [ ] Run `zig build test-evm2` - should pass

### 11. Add remaining fusions (RED → GREEN)
- [ ] Write tests for PUSH+MUL, PUSH+DIV, etc.
- [ ] Run `zig build test-evm2` - should fail
- [ ] Implement remaining fusion detection
- [ ] Run `zig build test-evm2` - should pass

### 12. Integration test (RED → GREEN)
- [ ] Write comprehensive test with complex bytecode including:
  - Multiple fusions
  - Dynamic jumps
  - Large PUSH values
  - JUMPDEST blocks
- [ ] Run `zig build test-evm2` - should fail
- [ ] Fix any integration issues
- [ ] Run `zig build test-evm2` - should pass

## Build Commands
After each code change:
```bash
zig build evm2      # Ensure compilation
zig build test-evm2 # Run tests
```

## Success Criteria
- All tests pass
- No memory leaks (proper allocation/deallocation)
- Instruction stream is optimally packed
- Fusions are correctly detected and applied
- Jump destinations are pre-validated