# EVM Devtool Integration Design Document

## Overview

This document outlines the complete integration plan for connecting our Zig EVM implementation with the devtool's web-based debugger interface. The goal is to enable step-by-step execution debugging with full visibility into EVM state.

## Current Architecture Analysis

### EVM Core Components

#### 1. **Evm** (`src/evm/evm.zig`)
- Main VM instance managing global state
- Fields: `depth`, `read_only`, `state`, `access_list`, `context`, `return_data`
- Provides contract execution and state management

#### 2. **Frame** (`src/evm/frame/frame.zig`)
- Execution context for individual calls
- Critical debugging fields:
  - `pc: usize` - Program counter
  - `gas_remaining: u64` - Available gas
  - `stack: Stack` - Operand stack
  - `memory: Memory` - Call memory
  - `contract: *Contract` - Executing contract
  - `input: []const u8` - Call data
  - `output: []const u8` - Return data
  - `stop: bool` - Halt flag
  - `err: ?ExecutionError.Error` - Execution error
  - `depth: u32` - Call depth
  - `is_static: bool` - Static call flag

#### 3. **Contract** (`src/evm/frame/contract.zig`)
- Contains bytecode and contract metadata
- Provides access to instruction stream

#### 4. **EvmState** (`src/evm/state/state.zig`)
- Account balances, storage, logs
- Database interface for persistence

### Current Execution Model

The `interpret` function (`src/evm/evm/interpret.zig`) demonstrates current execution:

```zig
while (pc < contract.code_size) {
    const opcode = contract.get_op(pc);
    frame.pc = pc;
    const result = self.table.execute(pc, interpreter, state, opcode);
    // Update PC and continue
}
```

### Frontend Interface (`src/devtool/solid/components/evm-debugger/`)

**Expected Functions:**
- `loadBytecode(bytecodeHex: string)` - Load contract bytecode
- `resetEvm()` - Reset to initial state
- `stepEvm()` - Execute single instruction
- `toggleRunPause()` - Toggle continuous execution
- `getEvmState()` - Get current debug state

**Expected State Format:**
```typescript
interface EvmState {
    pc: number
    opcode: string
    gasLeft: number
    depth: number
    stack: string[]
    memory: string
    storage: Record<string, string>
    logs: string[]
    returnData: string
}
```

## Integration Architecture

### 1. Debug-Enabled EVM Wrapper

Create a new `DevtoolEvm` wrapper that extends the existing `DevtoolEvm` in `src/devtool/evm.zig`:

```zig
pub const DevtoolEvm = struct {
    allocator: std.mem.Allocator,
    database: MemoryDatabase,
    evm: Evm.Evm,
    
    // Debug state
    bytecode: []u8,
    current_frame: ?*Frame,
    execution_trace: std.ArrayList(DebugStep),
    is_paused: bool,
    auto_run: bool,
    
    // Debug step information
    pub const DebugStep = struct {
        pc: usize,
        opcode: u8,
        opcode_name: []const u8,
        gas_before: u64,
        gas_after: u64,
        stack_before: []u256,
        stack_after: []u256,
        memory_changes: []MemoryChange,
        storage_changes: []StorageChange,
        logs_emitted: []EvmLog,
    };
};
```

### 2. Step-by-Step Execution Engine

Implement a modified interpreter that can pause between instructions:

```zig
pub fn stepExecute(self: *DevtoolEvm) !DebugStepResult {
    if (self.current_frame == null) return error.NoActiveExecution;
    
    const frame = self.current_frame.?;
    const opcode = frame.contract.get_op(frame.pc);
    
    // Capture pre-execution state
    const pre_state = try self.captureFrameState(frame);
    
    // Execute single instruction
    const result = try self.evm.table.execute(
        frame.pc, 
        &self.evm, 
        frame, 
        opcode
    );
    
    // Update PC
    if (frame.pc == pre_state.pc) {
        frame.pc += result.bytes_consumed;
    }
    
    // Capture post-execution state and create debug step
    const post_state = try self.captureFrameState(frame);
    const debug_step = try self.createDebugStep(pre_state, post_state, opcode);
    
    try self.execution_trace.append(debug_step);
    
    return DebugStepResult{
        .step = debug_step,
        .completed = frame.stop or frame.pc >= frame.contract.code_size,
        .error_occurred = frame.err != null,
    };
}
```

### 3. State Serialization Layer

Create functions to convert EVM state to the frontend format:

```zig
pub fn serializeEvmState(self: *DevtoolEvm) ![]u8 {
    if (self.current_frame == null) return try self.serializeEmptyState();
    
    const frame = self.current_frame.?;
    const opcode = if (frame.pc < frame.contract.code_size) 
        frame.contract.get_op(frame.pc) else 0;
    
    const state = EvmStateJson{
        .pc = frame.pc,
        .opcode = try self.opcodeToString(opcode),
        .gasLeft = frame.gas_remaining,
        .depth = frame.depth,
        .stack = try self.serializeStack(&frame.stack),
        .memory = try self.serializeMemory(&frame.memory),
        .storage = try self.serializeStorage(),
        .logs = try self.serializeLogs(),
        .returnData = try self.serializeReturnData(frame.output),
    };
    
    return try std.json.stringifyAlloc(self.allocator, state, .{});
}
```

### 4. WebUI Binding Functions

Implement the JavaScript-callable functions:

```zig
// WebUI binding functions
fn loadBytecode(bytecode_hex: [:0]const u8, e: *webui.Event) void {
    const result = devtool_evm.loadBytecode(bytecode_hex) catch |err| {
        e.returnString(try formatError(err));
        return;
    };
    e.returnString("success");
}

fn resetEvm(e: *webui.Event) void {
    devtool_evm.reset() catch |err| {
        e.returnString(try formatError(err));
        return;
    };
    const state_json = devtool_evm.serializeEvmState() catch |err| {
        e.returnString(try formatError(err));
        return;
    };
    e.returnString(state_json);
}

fn stepEvm(e: *webui.Event) void {
    const result = devtool_evm.stepExecute() catch |err| {
        e.returnString(try formatError(err));
        return;
    };
    const state_json = devtool_evm.serializeEvmState() catch |err| {
        e.returnString(try formatError(err));
        return;
    };
    e.returnString(state_json);
}

fn getEvmState(e: *webui.Event) void {
    const state_json = devtool_evm.serializeEvmState() catch |err| {
        e.returnString(try formatError(err));
        return;
    };
    e.returnString(state_json);
}
```

## Implementation Tasks

### Phase 1: Core Debug Infrastructure

#### Task 1.1: Enhanced DevtoolEvm Structure
- **File**: `src/devtool/evm.zig`
- **Description**: Extend existing DevtoolEvm with debug-specific fields
- **Implementation**:
  - Add execution trace storage
  - Add pause/resume state management
  - Add current frame tracking
  - Add bytecode storage with hex parsing
- **Acceptance Criteria**: 
  - DevtoolEvm can store bytecode and maintain execution state
  - Memory management works correctly (no leaks)
  - All fields properly initialized and cleaned up

#### Task 1.2: State Capture System
- **File**: `src/devtool/debug_state.zig` (new)
- **Description**: Create state capture and serialization utilities
- **Implementation**:
  - `captureFrameState()` - Snapshot frame at any point
  - `serializeStack()` - Stack to hex string array
  - `serializeMemory()` - Memory to hex string
  - `serializeStorage()` - Storage map to JSON
  - `serializeLogs()` - Event logs to JSON
- **Acceptance Criteria**:
  - All EVM state can be captured without affecting execution
  - Serialization produces frontend-compatible JSON
  - Error handling for memory allocation failures

### Phase 2: Step-by-Step Execution

#### Task 2.1: Debug Interpreter
- **File**: `src/devtool/debug_interpreter.zig` (new)
- **Description**: Create step-by-step execution engine
- **Implementation**:
  - `initExecution()` - Set up frame for debugging
  - `stepExecute()` - Execute single opcode with state capture
  - `continueExecution()` - Run until completion or breakpoint
  - `resetExecution()` - Return to initial state
- **Acceptance Criteria**:
  - Can execute opcodes one at a time
  - State is properly maintained between steps
  - Execution can be paused and resumed
  - All opcodes work correctly in step mode

#### Task 2.2: Execution Trace Management
- **File**: `src/devtool/execution_trace.zig` (new)
- **Description**: Track execution history for debugging
- **Implementation**:
  - `DebugStep` structure with before/after state
  - `ExecutionTrace` with step history
  - Gas consumption tracking per step
  - Memory/storage change tracking
- **Acceptance Criteria**:
  - Complete execution history is maintained
  - Can replay execution from any point
  - Memory efficient (don't store redundant data)
  - Traces can be exported/imported

### Phase 3: WebUI Integration

#### Task 3.1: WebUI Binding Implementation
- **File**: `src/devtool/webui_bindings.zig` (new)
- **Description**: Implement JavaScript-callable functions
- **Implementation**:
  - `loadBytecode()` - Parse hex and initialize execution
  - `resetEvm()` - Reset state and return initial snapshot
  - `stepEvm()` - Execute one step and return new state
  - `toggleRunPause()` - Toggle continuous execution
  - `getEvmState()` - Return current state snapshot
- **Acceptance Criteria**:
  - All frontend functions work correctly
  - Error handling returns meaningful messages
  - JSON serialization is correct and complete
  - Performance is acceptable (< 100ms per operation)

#### Task 3.2: App Integration
- **File**: `src/devtool/app.zig`
- **Description**: Wire up WebUI bindings to the application
- **Implementation**:
  - Initialize global DevtoolEvm instance
  - Register WebUI binding functions
  - Set up proper error handling and cleanup
- **Acceptance Criteria**:
  - Web interface can call all debug functions
  - Memory management is correct
  - Application starts up without errors

### Phase 4: Frontend Updates

#### Task 4.1: Replace Stub Functions
- **File**: `src/devtool/solid/components/evm-debugger/utils.ts`
- **Description**: Replace console.log stubs with actual WebUI calls
- **Implementation**:
  - `loadBytecode()` calls `webui.loadBytecode()`
  - `resetEvm()` calls `webui.resetEvm()`
  - `stepEvm()` calls `webui.stepEvm()`
  - `getEvmState()` calls `webui.getEvmState()`
  - Proper error handling and loading states
- **Acceptance Criteria**:
  - All functions make actual backend calls
  - UI shows loading states during operations
  - Error messages are displayed to user
  - State updates correctly trigger UI refreshes

#### Task 4.2: Enhanced State Display
- **File**: Multiple component files
- **Description**: Improve state visualization components
- **Implementation**:
  - Better stack visualization with hex/decimal toggle
  - Memory viewer with address highlighting
  - Storage viewer with key/value pairs
  - Logs viewer with event decoding
  - Opcode highlighting in bytecode view
- **Acceptance Criteria**:
  - All EVM state is clearly visible
  - Data formats are user-friendly
  - Performance is good with large state
  - UI is responsive and intuitive

### Phase 5: Advanced Features

#### Task 5.1: Execution Control
- **File**: Various
- **Description**: Advanced debugging features
- **Implementation**:
  - Breakpoints on specific opcodes/addresses
  - Step over/into for CALL operations
  - Execution speed control
  - Jump to specific PC
- **Acceptance Criteria**:
  - Complex debugging workflows are supported
  - Breakpoints work reliably
  - UI provides good debugging experience

#### Task 5.2: Trace Export/Import
- **File**: Various  
- **Description**: Save and load execution traces
- **Implementation**:
  - Export traces to JSON format
  - Import traces for analysis
  - Trace comparison tools
  - Performance metrics
- **Acceptance Criteria**:
  - Traces can be saved and loaded
  - Useful for regression testing
  - Performance data is accurate

## Error Handling Strategy

### EVM Execution Errors
- Out of gas → Display gas exhaustion state
- Stack underflow/overflow → Highlight stack issues
- Invalid jump → Show jump target validation
- Revert → Display revert data

### System Errors
- Memory allocation failures → Graceful degradation
- JSON parsing errors → User-friendly error messages
- WebUI communication errors → Retry mechanisms

### Debug-Specific Errors
- Invalid bytecode → Validation error display
- State serialization failures → Fallback representations
- Trace corruption → Recovery mechanisms

## Testing Strategy

### Unit Tests
- DevtoolEvm state management
- State serialization/deserialization
- Step execution correctness
- WebUI binding functions

### Integration Tests  
- Complete debugging workflows
- Frontend-backend communication
- Error handling paths
- Memory leak detection

### Performance Tests
- Large contract debugging
- Deep call stack handling
- Memory usage optimization
- UI responsiveness

## Performance Considerations

### Memory Management
- Efficient state snapshots
- Trace size limitations
- Garbage collection of old traces
- Stack/memory diff compression

### Execution Speed
- Optimized state capture
- Lazy serialization
- Minimal copying
- Fast JSON generation

### UI Responsiveness
- Chunked state updates
- Virtual scrolling for large data
- Debounced user input
- Background processing

## Security Considerations

### Input Validation
- Bytecode hex string validation
- Length limits on inputs
- Sanitization of user data

### Resource Limits
- Maximum execution steps
- Memory usage caps
- Timeout protections
- Stack depth limits

## Future Enhancements

### Advanced Debugging
- Call tree visualization  
- Gas usage analysis
- State diff visualization
- Contract interaction flow

### Developer Experience
- Keyboard shortcuts
- Command palette
- Plugin system
- Configuration management

### Integration Features
- Test framework integration
- CI/CD pipeline support
- Automated debugging
- Remote debugging capabilities

---

This design provides a comprehensive roadmap for integrating the Zig EVM with the devtool debugger, enabling powerful step-by-step execution debugging with full state visibility.