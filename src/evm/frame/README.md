# Execution Frame Management

Core execution context and contract management for the EVM. This folder contains the frame system that manages execution state, bytecode analysis, and storage tracking for each contract call.

## Purpose

The frame system provides:
- Execution context for each contract call (stack, memory, PC, gas)
- Contract representation with bytecode and metadata
- Static code analysis for jump validation
- Storage access tracking and pooling
- Efficient bit vectors for code/data segmentation

## Architecture

Each contract call creates a new Frame that encapsulates:
- Execution state (PC, gas remaining, stack, memory)
- Contract being executed (code, address, context)
- Return data management
- Storage access tracking

The system uses several optimizations:
- Hot/cold field separation for cache efficiency
- Object pooling to reduce allocations
- Global code analysis cache
- Bit vectors for efficient jump validation

## Files

### `frame.zig`
The execution frame that maintains all state for a single contract call.

**Structure**:
```zig
Frame = struct {
    // Hot fields (frequently accessed)
    pc: u64              // Program counter
    gas_remaining: u64   // Gas left for execution
    stack: Stack         // Operand stack (max 1024 items)
    memory: Memory       // Byte-addressable memory
    
    // Cold fields
    vm: *Vm             // Parent VM reference
    contract: Contract  // Contract being executed
    return_data: []u8   // Data from last call
    call_depth: u16     // Current call depth
    is_static: bool     // Read-only execution flag
}
```

**Key Methods**:
- `init()`: Creates new frame with specified gas and contract
- `consumeGas()`: Deducts gas with overflow protection
- `refundGas()`: Returns unused gas
- `resize_return_data()`: Manages return data buffer

**Builder Pattern**:
```zig
const frame = try Frame.Builder.init(allocator, vm)
    .withGas(1000000)
    .withContract(contract)
    .withCallDepth(1)
    .build();
```

**Performance**:
- Hot fields grouped for cache locality
- Stack and memory are embedded (not pointers)
- Return data uses dynamic allocation only when needed

**Used By**: All contract execution paths (calls, creates)

### `contract.zig`
Represents a contract being executed with its code and context.

**Types**:
- `Identity`: Core contract info (address, caller, code_address, value)
- `Contract`: Full execution context with bytecode and analysis

**Features**:
- Lazy code analysis (computed on first jump)
- Storage access tracking for EIP-2929
- Support for regular calls and delegate calls
- Bytecode caching and sharing

**Key Methods**:
- `init()`: Creates contract from bytecode
- `analyze()`: Performs static code analysis
- `isValidJump()`: Checks if PC is valid JUMPDEST
- `first_cold_access()`: Tracks storage slot access

**Memory Management**:
- Bytecode is reference-counted or owned
- Analysis results are cached globally
- Storage maps use pooling for efficiency

**Used By**: Frame initialization, EXTCODECOPY, jump validation

### `code_analysis.zig`
Static bytecode analyzer that identifies valid jump destinations.

**Process**:
1. Scan bytecode sequentially
2. Mark JUMPDEST locations
3. Track PUSH data regions (not valid jumps)
4. Build bit vector of valid destinations

**Optimizations**:
- Global LRU cache for analysis results
- SIMD scanning (currently disabled)
- Efficient bit packing

**Key Functions**:
- `analyzeCode()`: Main analysis entry point
- `isValidJump()`: Quick lookup for jump validation
- `CodeIterator`: Efficient bytecode traversal

**Cache Strategy**:
- 16 entry LRU cache
- Hash-based lookup
- Thread-safe with mutex

**Performance**: O(n) analysis, O(1) lookup

**Used By**: Contract initialization, JUMP/JUMPI opcodes

### `bitvec.zig`
Generic bit vector implementation for efficient boolean arrays.

**Features**:
- Generic over storage type (u8, u16, u32, u64)
- Bit-level get/set operations
- Iterator support
- Memory efficient (1 bit per boolean)

**Operations**:
- `init()`: Create with specific bit count
- `set()`: Set bit at index
- `isSet()`: Check bit at index
- `setRangeValue()`: Bulk operations

**Optimizations**:
- Word-aligned operations
- Vectorizable loops
- Minimal memory overhead

**Used By**: Code analysis for jump destination tracking

### `storage_pool.zig`
Object pool for HashMap instances to reduce allocation pressure.

**Purpose**: Reuse HashMap allocations across contract calls

**Pooled Types**:
- Access maps: Track accessed addresses
- Storage maps: Track accessed storage slots

**Benefits**:
- Reduces allocator pressure
- Retains capacity between uses
- Improves cache locality

**Operations**:
- `borrow()`: Get maps from pool
- `return()`: Return maps to pool
- Automatic capacity retention

**Used By**: Contract storage access tracking

### `analysis_lru_cache.zig`
LRU cache for code analysis results.

**Features**:
- 16 entry capacity
- Hash-based lookup
- Thread-safe operations
- Least-recently-used eviction

**Performance Impact**:
- Avoids repeated analysis of same bytecode
- Critical for contracts called multiple times
- Typical hit rate >90% in production

**Used By**: Code analysis system

### `eip_7702_bytecode.zig`
Support for EIP-7702 delegation designator bytecode.

**Format**: `0xef0100 || address` (23 bytes)

**Purpose**: Allows EOAs to delegate to contract code

**Features**:
- Parse delegation bytecode
- Extract target address
- Validation of format

**Used By**: Contract initialization for delegated EOAs

## Usage Patterns

### Frame Lifecycle
```zig
// 1. Create frame
var frame = try Frame.init(allocator, vm, gas_limit, contract, sender, input);
defer frame.deinit();

// 2. Execute operations
while (frame.pc < contract.code.len) {
    const opcode = contract.code[frame.pc];
    try frame.consumeGas(getOpGas(opcode));
    // ... execute opcode
    frame.pc += 1;
}

// 3. Return unused gas
caller.gas_remaining += frame.gas_remaining;
```

### Jump Validation
```zig
// During JUMP/JUMPI execution
const dest = try frame.stack.pop();
if (!frame.contract.isValidJump(dest)) {
    return error.InvalidJump;
}
frame.pc = dest;
```

### Storage Access Tracking
```zig
// During SLOAD/SSTORE
const slot = try frame.stack.pop();
const is_cold = try frame.contract.first_cold_access(address, slot);
const gas_cost = if (is_cold) cold_cost else warm_cost;
```

## Memory Management

**Ownership Rules**:
- Frame owns its stack and memory
- Contract may own or reference bytecode
- Analysis results are globally cached
- Return data is dynamically allocated

**Cleanup**:
- Always call `frame.deinit()`
- Return storage pools when done
- Contract handles bytecode cleanup

## Performance Considerations

1. **Hot Path Optimization**:
   - PC, gas, stack are accessed every instruction
   - Grouped in same cache line
   - Embedded to avoid indirection

2. **Analysis Caching**:
   - One-time O(n) analysis per unique bytecode
   - Cached results shared across calls
   - Critical for frequently called contracts

3. **Memory Pooling**:
   - Storage maps reused between calls
   - Reduces GC pressure
   - Maintains warmed capacity

4. **Bit Vector Efficiency**:
   - 1 bit per bytecode byte overhead
   - Word-aligned operations
   - Cache-friendly sequential access

## Testing

The module includes:
- Unit tests for each component
- Integration tests for frame lifecycle
- Fuzz tests for code analysis edge cases
- Benchmark tests for performance validation
- Property-based tests for bit vectors

## Security Considerations

- Jump validation prevents arbitrary code execution
- Gas tracking prevents infinite loops
- Call depth tracking prevents stack overflow
- Static flag prevents unauthorized modifications
- Bytecode analysis is deterministic and cached