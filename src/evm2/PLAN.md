# TDD Plan for create_instruction_stream Implementation

## Overview
Transform the `run` method in analysis.zig to `create_instruction_stream` that builds an instruction stream with metadata using the handler array passed from Frame.

## Handler Dispatch Pattern
The dispatch method remains unchanged from the previous EVM implementation, using tail call recursion:
1. Each handler receives `(frame: *Frame, plan: *const Plan, idx: *InstructionIndexType)`
2. Handler executes its operation (no gas consumption - JUMPDEST handles block gas)
3. Handler calls `plan.getMetadataAndNextInstruction(idx, comptime_opcode)` which:
   - Returns metadata (if any) and next handler pointer
   - Advances idx by 1 or 2 based on opcode
   - Encapsulates all unsafe casting
4. Handler tail calls next: `@call(.always_tail, result.next_handler, .{frame, plan, idx})`
5. Never returns (Error!noreturn) - maintains call stack at constant depth

Example handler for PUSH1 using Plan abstraction:
```zig
fn push1_handler(frame: *Frame, plan: *const Plan, idx: *InstructionIndexType) Error!noreturn {
    const result = plan.getMetadataAndNextInstruction(idx, .PUSH1);
    try frame.stack.push(result.metadata);
    // idx already advanced by getMetadataAndNextInstruction
    @call(.always_tail, result.next_handler, .{frame, plan, idx});
}
```

Or for opcodes without metadata:
```zig
fn add_handler(frame: *Frame, plan: *const Plan, idx: *InstructionIndexType) Error!noreturn {
    const b = try frame.stack.pop();
    const a = try frame.stack.pop();
    try frame.stack.push(a + b);
    // Get next handler and advance idx
    const result = plan.getMetadataAndNextInstruction(idx, .ADD);
    @call(.always_tail, result.next_handler, .{frame, plan, idx});
}
```

Note: Frame no longer has `pc` field - only tracks instruction index. Gas is consumed by JUMPDEST at block start.

## Development Steps

### 1. Update Analysis struct with cache (RED → GREEN)
- [ ] Remove allocator from init
- [ ] Remove deinit method
- [ ] Add LRU cache to Analysis struct (similar to analysis_cache.zig but simpler)
- [ ] Cache stores Plan structs keyed by bytecode hash
- [ ] Delete analysis_cache.zig file - Analysis handles its own caching
- [ ] Write test that calls `Analysis.init(bytecode)` without allocator
- [ ] Run `zig build test-evm2` - should fail
- [ ] Update init signature
- [ ] Run `zig build test-evm2` - should pass

### 2. Define synthetic opcode constants (RED → GREEN)
- [ ] Write test that references synthetic opcodes (PUSH_ADD_INLINE, etc.)
- [ ] Run `zig build test-evm2` - should fail (undefined)
- [ ] Add synthetic opcode constants starting at 0xF5 (avoiding Arbitrum/Optimism)
- [ ] Run `zig build test-evm2` - should pass

### 3. Define metadata structs and types (RED → GREEN)
- [ ] Write test that creates metadata structs with proper sizing
- [ ] Run `zig build test-evm2` - should fail
- [ ] Define InstructionIndexType:
  - `pub const InstructionIndexType = PcType` - we can only have as many instructions as PCs but usually less
  - Use InstructionIndexType throughout instead of raw PcType for clarity
- [ ] Define metadata approach:
  - For PUSH/fusion opcodes: metadata is the value itself (usize) or pointer to u256_constants
  - Replace AnalyzerBlock with `JumpDestMetadata = struct { gas: u32, min_stack: i16, max_stack: i16 }`
  - On 64-bit: JumpDestMetadata fits in usize (8 bytes)
  - On 32-bit: Store JumpDestMetadata in u256_constants and use pointer
- [ ] Add `start: JumpDestMetadata` to Analysis - metadata for entry block (measure only up to first JUMPDEST if it exists at PC 0)
- [ ] Run `zig build test-evm2` - should pass

### 4. Update AnalyzerPlan structure (RED → GREEN)
- [ ] Write test expecting new Plan fields (instructionStream, u256_constants, jump_table)
- [ ] Run `zig build test-evm2` - should fail
- [ ] Update Plan to include:
  - `instructionStream: []usize` - contains handler pointers and metadata
  - `u256_constants: []WordType` - for values that don't fit in usize
  - Remove `jump_table` - only used during generation, not at runtime
  - Remove `bytecodeLen`
  - Remove `jumpDestMetadata` array - JUMPDEST metadata is stored inline or in u256_constants
- [ ] Add abstraction method to Plan:
  - `getMetadataAndNextInstruction(self: *const Plan, idx: *InstructionIndexType, comptime opcode: Opcode) struct { metadata: usize, next_handler: *const HandlerFn }`
  - Advances instruction pointer by 1 or 2 based on opcode
  - Handles casting metadata based on opcode type
  - Encapsulates all unsafe pointer operations
- [ ] Run `zig build test-evm2` - should pass

### 5. Create handler array type and basic create_instruction_stream (RED → GREEN)
- [ ] Write test that calls `create_instruction_stream` with handler array
- [ ] Run `zig build test-evm2` - should fail
- [ ] Define handler function type:
  - `pub const HandlerFn = fn (frame: *Frame, plan: *const Plan, idx: *InstructionIndexType) Error!noreturn`
  - Handlers use tail call recursion: `@call(.always_tail, next_handler, .{frame, plan, idx})`
  - Plan.getMetadataAndNextInstruction handles idx advancement
  - All unsafe casting is encapsulated in Plan methods
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