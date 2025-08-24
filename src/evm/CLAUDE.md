# CLAUDE.md - EVM2 Module Development Guide

This document provides comprehensive development guidelines for the EVM2 module, a high-performance implementation of the Ethereum Virtual Machine in Zig designed for production use and research.

## EVM2 Architecture Overview

EVM2 is a ground-up reimplementation of the EVM with the following design goals:
- **High Performance**: Tail call optimization, cache-conscious data structures, and optimized bytecode planning
- **Modularity**: Pluggable components (database, tracer, planner) with clear interfaces
- **Type Safety**: Compile-time configuration validation and platform-specific optimizations
- **Correctness**: Comprehensive test coverage and EVM specification compliance
- **Research-Friendly**: Easy to extend with new opcodes, optimizations, and execution strategies

### Key Architectural Components

1. **Frame**: Lightweight execution context with stack, memory, and gas tracking
2. **Planner**: Analyzes bytecode and produces optimized execution plans  
3. **Stack**: Cache-aligned, pointer-based stack with downward growth
4. **Memory**: EVM-compliant memory with word-boundary expansion
5. **Database Interface**: Pluggable vtable-based state storage abstraction
6. **Tracer**: Configurable execution tracing (no-op, debugging, file output)
7. **Host**: External operations interface (calls, creates, environment queries)

## Test-Driven Development (TDD) Workflow

**MANDATORY**: Always follow Test-Driven Development when working on the EVM2 module:

1. **Write tests first** - Create tests that define the expected behavior before implementing
2. **Run tests to see them fail** - Ensure tests fail for the right reasons
3. **Implement minimal code** - Write just enough code to make tests pass
4. **Refactor** - Clean up code while keeping tests green

### Build and Test Commands

```bash
# Build the EVM2 module
zig build evm2

# Run EVM2 tests
zig build test-evm2
```

**IMPORTANT**: After every code change, run both commands to ensure:
- Code compiles without errors
- All tests continue to pass
- No regressions are introduced

## Core Module Architecture

### Frame: Execution Context

The Frame is the central execution context for EVM operations, designed with multiple configurable implementations:

**Key Design Features**:
- **Generic Configuration**: Parameterized by `FrameConfig` for stack size, word type, memory limits, gas tracking
- **Component Integration**: Contains stack, memory, database interface, tracer, and host
- **Smart Type Selection**: Automatically chooses optimal integer types based on configuration limits
- **Cache-Conscious Layout**: Hot fields (stack, gas) grouped for optimal memory access patterns

**Supported Operations**:
- Stack operations (PUSH, POP, DUP, SWAP)
- Arithmetic operations (ADD, SUB, MUL, DIV, EXP, etc.)
- Bitwise operations (AND, OR, XOR, NOT, SHL, SHR, SAR)
- Comparison operations (LT, GT, EQ, ISZERO, etc.)
- Memory operations (MLOAD, MSTORE, MSIZE, MCOPY)
- Storage operations (SLOAD, SSTORE, TLOAD, TSTORE) with database
- Hashing operations (KECCAK256)
- LOG operations (LOG0-LOG4)

**Operations NOT Supported** (handled by upper layers):
- PC tracking and JUMP operations (managed by Plan)
- CALL/CREATE operations (handled by Host or EVM)
- Environment operations (BLOCKHASH, COINBASE, etc. via Host)
- Block operations requiring external context

### Stack: High-Performance EVM Stack

**Architecture**: Pointer-based downward-growing stack with cache alignment
- **Downward Growth**: `stack_ptr` points to next empty slot, grows toward lower addresses
- **Cache Aligned**: 64-byte alignment for optimal CPU cache performance
- **Bounds Checking**: Both safe and unsafe variants for performance-critical paths
- **Smart Sizing**: Stack index type automatically selected based on configured stack size

```zig
// Stack growth pattern:
// Push: stack_ptr -= 1; *stack_ptr = value;
// Pop:  value = *stack_ptr; stack_ptr += 1;
```

**Performance Features**:
- Branch hints for common paths (`@branchHint(.likely)` for success)
- Unsafe variants when bounds are pre-validated
- Direct pointer arithmetic for minimal overhead

### Memory: EVM-Compliant Memory Management

**Design Philosophy**: Hierarchical memory with lazy expansion and word-boundary alignment
- **Initial Capacity**: Configurable starting size (default 4KB)
- **Lazy Expansion**: Only allocates when needed, with zero-initialization
- **Word Alignment**: Expands to 32-byte boundaries for EVM compliance
- **Child Memory**: Support for nested execution contexts with checkpoints
- **Gas Integration**: Cached expansion cost calculation for gas metering

**Key Features**:
- EVM-compliant operations (`set_data_evm`, `set_u256_evm`, `get_slice_evm`)
- Memory limit enforcement (default 16MB)
- Checkpoint system for nested calls
- Efficient copying and zeroing operations

### Database Interface: Pluggable State Management

**Architecture**: Type-safe vtable-based polymorphism for different storage backends
- **Zero Runtime Cost**: Function pointers eliminate virtual dispatch overhead  
- **Type Safety**: Compile-time interface validation with clear error types
- **Backend Agnostic**: Memory, file, network, or custom storage implementations
- **Rich Error Model**: Comprehensive error types for different failure modes

**Supported Operations**:
```zig
pub const VTable = struct {
    get_account: *const fn (ptr: *anyopaque, address: [20]u8) Error!?Account,
    set_account: *const fn (ptr: *anyopaque, address: [20]u8, account: Account) Error!void,
    get_storage: *const fn (ptr: *anyopaque, address: [20]u8, key: u256) Error!u256,
    set_storage: *const fn (ptr: *anyopaque, address: [20]u8, key: u256, value: u256) Error!void,
    get_transient_storage: *const fn (ptr: *anyopaque, address: [20]u8, key: u256) Error!u256,
    // ... complete interface in database_interface.zig
};
```

**Usage Pattern**:
```zig
// Create backend
var memory_db = MemoryDatabase.init(allocator);
defer memory_db.deinit();

// Convert to interface
const db_interface = memory_db.to_database_interface();

// Use through interface (zero overhead)
const account = try db_interface.get_account(address);
```

### Tracer System: Configurable Execution Tracing

**Design**: Compile-time tracer selection for zero-cost abstractions
- **NoOpTracer**: Zero runtime overhead (default)
- **DebuggingTracer**: Step-by-step debugging with breakpoints and history
- **LoggingTracer**: Structured logging to stdout
- **FileTracer**: High-performance file output
- **Custom Tracers**: Easy to implement custom tracing logic

**Tracer Interface**:
```zig
pub fn beforeOp(self: *Self, comptime FrameType: type, frame: *const FrameType) void;
pub fn afterOp(self: *Self, comptime FrameType: type, frame: *const FrameType) void;
pub fn onError(self: *Self, comptime FrameType: type, frame: *const FrameType, err: anyerror) void;
```

**Configuration**:
```zig
const Frame = frame_mod.Frame(.{
    .TracerType = DebuggingTracer,  // Enable full debugging
    .has_database = true,
    // ... other config
});
```

### Module Dependencies

Currently imported modules:
- `primitives` - Basic types and utilities (Address, GasConstants, etc.)
- `evm` - EVM implementation reference for compatibility
- `build_options` - Build configuration options
- `crypto` - Cryptographic functions (KECCAK256 implementation)

When adding new features that require external modules, update `build.zig`:
```zig
// Add to both main module and test module
evm2_mod.addImport("new_module", new_module_mod);
test_evm2.root_module.addImport("new_module", new_module_mod);
```

### Importing Common Types

```zig
// Importing from primitives module
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const GasConstants = primitives.GasConstants;

// Direct import pattern
const Address = @import("primitives").Address.Address;
```

### Frame Configuration and Creation

```zig
const FrameConfig = @import("frame_config.zig").FrameConfig;
const Frame = @import("frame.zig").Frame;

// Configure frame
const config = FrameConfig{
    .stack_size = 1024,          
    .WordType = u256,            
    .max_bytecode_size = 24576,  
    .block_gas_limit = 30_000_000,
    .has_database = true,        // Enable storage operations
    .TracerType = NoOpTracer,    // Minimal overhead
    .memory_initial_capacity = 4096,
    .memory_limit = 0xFFFFFF,
};

// Create frame type and instantiate
const FrameType = Frame(config);
var frame = try FrameType.init(allocator, bytecode, gas_remaining, database, host);
defer frame.deinit(allocator);
```

## Advanced Architecture: Planner and Optimization System

### Planner: Bytecode Analysis and Optimization

**Core Concept**: The Planner transforms raw EVM bytecode into an optimized execution plan with inline metadata and constants.

**Key Features**:
- **Jump Destination Analysis**: Identifies valid JUMPDEST targets during bytecode scan
- **Opcode Fusion**: Combines common patterns (PUSH + ADD → PUSH_ADD_INLINE)
- **Constant Inlining**: Embeds small constants directly in instruction stream
- **Gas Pre-calculation**: Pre-computes gas costs where possible
- **Platform Optimization**: Different strategies for 32-bit vs 64-bit platforms

**Plan Structure**:
```zig
pub const Plan = struct {
    instructionStream: []InstructionElement,    // Handler pointers + inline data
    u256_constants: []WordType,                 // Large constants array
    pc_to_instruction_idx: ?HashMap(PcType, InstructionIndexType), // Jump mapping
};
```

**Instruction Stream Elements**:
- **64-bit platforms**: Inline JumpDestMetadata, larger constants, more fusion opportunities
- **32-bit platforms**: Pointer-based metadata, smaller inline constants
- **Handler Pointers**: Direct function pointers for zero-overhead dispatch
- **Inline Values**: Small constants embedded directly in instruction stream
- **Metadata**: Jump destinations, PC values, and opcode-specific data

### Synthetic Opcodes: Advanced Optimization

**Opcode Fusion**: Common bytecode patterns are detected and fused into synthetic opcodes:
```zig
pub const OpcodeSynthetic = enum(u8) {
    PUSH_ADD_INLINE = 0xB0,     // PUSH small_value + ADD
    PUSH_ADD_POINTER = 0xB1,    // PUSH large_value + ADD  
    PUSH_MUL_INLINE = 0xB2,     // PUSH small_value + MUL
    PUSH_JUMP_INLINE = 0xB6,    // PUSH jump_target + JUMP
    // ... complete list in opcode_synthetic.zig
};
```

**Benefits**:
- Reduced instruction stream length
- Fewer memory accesses during execution
- Better CPU cache utilization
- Elimination of intermediate stack operations

### Opcode Data and Gas Model

**Structured Opcode Metadata**:
```zig
pub const OpcodeInfo = struct {
    gas_cost: u16,        // Base gas cost
    stack_inputs: u4,     // Stack items consumed
    stack_outputs: u4,    // Stack items produced
};
```

**Gas Calculation Strategy**:
- **Static Costs**: Pre-calculated for most opcodes (ADD, MUL, etc.)
- **Dynamic Costs**: Runtime calculation for memory expansion, storage access
- **Warm/Cold Access**: EIP-2929 access list integration
- **Smart Type Selection**: i32 vs i64 gas tracking based on block gas limit

## Opcode Implementation Pattern

### Basic Opcode Structure

When implementing new opcodes, follow this pattern:

```zig
pub fn op_example(self: *Self) Error!void {
    // 1. Pop operands from stack (use unsafe if bounds pre-checked)
    const b = try self.stack.pop();
    const a = try self.stack.peek();  // Keep 'a' on stack for result
    
    // 2. Perform operation with overflow handling
    const result = a +% b;  // Wrapping arithmetic for EVM semantics
    
    // 3. Update stack top with result
    try self.stack.set_top(result);
}
```

### Advanced Opcode Patterns

**Gas Consumption**:
```zig
pub fn op_expensive_operation(self: *Self) Error!void {
    // Check gas before operation
    const gas_cost = calculate_dynamic_gas_cost(self);
    if (self.gas_remaining < gas_cost) return Error.OutOfGas;
    
    // Consume gas
    self.gas_remaining -= gas_cost;
    
    // Perform operation
    // ...
}
```

**Memory Operations**:
```zig
pub fn op_mstore(self: *Self) Error!void {
    const offset = try self.stack.pop();
    const value = try self.stack.pop();
    
    // Expand memory if needed and calculate gas
    const memory_expansion_cost = try self.memory.expansion_cost(offset, 32);
    if (self.gas_remaining < GasConstants.GasFastestStep + memory_expansion_cost) {
        return Error.OutOfGas;
    }
    self.gas_remaining -= @intCast(GasConstants.GasFastestStep + memory_expansion_cost);
    
    // Perform memory write
    try self.memory.set_u256_evm(@intCast(offset), value);
}
```

## Stack and Memory Operations

### Stack Management

**Safe vs Unsafe Operations**:
```zig
// Safe operations (bounds checking)
const value = try frame.stack.pop();           // Returns error on underflow
try frame.stack.push(result);                  // Returns error on overflow

// Unsafe operations (assumes bounds pre-checked)
const value = frame.stack.pop_unsafe();        // No bounds checking
frame.stack.push_unsafe(result);               // No bounds checking
frame.stack.set_top_unsafe(result);            // Modify top element
```

**When to Use Unsafe Operations**:
- Opcode handlers where stack effects are pre-validated by the planner
- Inner loops where performance is critical
- Operations guaranteed to be within bounds by the EVM specification

### Memory Management

**EVM-Compliant Operations**:
```zig
// Word-aligned expansion (EVM requirement)
try memory.set_data_evm(offset, data);         // Expands to 32-byte boundary
const value = memory.get_u256_evm(offset);     // Reads 32 bytes
try memory.set_byte_evm(offset, byte);         // Single byte write
```

**Child Memory for Nested Calls**:
```zig
var child_memory = try parent_memory.init_child();
defer child_memory.deinit();
// Child inherits parent state at checkpoint, modifications isolated
```

## Gas Management and Type System

**Smart Gas Type Selection**:
- **i32**: For block gas limits ≤ 2^31 (most common)
- **i64**: For larger block gas limits or custom configurations
- **Negative Values**: Indicate out-of-gas condition

**Gas Tracking Pattern**:
```zig
// Check gas availability
if (frame.gas_remaining < required_gas) return Error.OutOfGas;

// Consume gas (signed arithmetic detects underflow)
frame.gas_remaining -= required_gas;
if (frame.gas_remaining < 0) return Error.OutOfGas;
```

## Error Handling and EVM Semantics

### Frame Error Types

```zig
pub const Error = error{
    StackOverflow,      // Stack exceeds 1024 elements
    StackUnderflow,     // Stack has insufficient elements
    OutOfGas,           // Insufficient gas for operation
    InvalidJump,        // JUMP to invalid destination
    InvalidOpcode,      // Undefined opcode encountered
    OutOfBounds,        // Memory or calldata access out of bounds
    WriteProtection,    // State modification in static context
    STOP,               // Normal execution termination (not really an error)
    BytecodeTooLarge,   // Contract bytecode exceeds size limit
    AllocationError,    // Memory allocation failure
};
```

### EVM Specification Compliance

**Comparison Operations**:
- All comparisons return `1` for true, `0` for false
- No boolean type - everything is u256

**Arithmetic Semantics**:
- **Wrapping arithmetic**: Use `+%`, `-%`, `*%` for overflow behavior
- **Division by zero**: Returns 0 (not an error)
- **Modulo by zero**: Returns 0 (not an error)
- **Signed operations**: Use proper two's complement handling

## Development Best Practices

### Code Quality and Testing

1. **Always run tests** - Use `zig build test-evm2` frequently during development
2. **Check compilation** - Use `zig build evm2` after every significant change  
3. **Follow TDD** - Write tests first, implement minimal functionality, refactor
4. **Study references** - Check `src/evm/` for canonical implementations before implementing
5. **Use clear names** - Prefer descriptive names (`numerator`/`denominator` over `a`/`b`)

### Performance Considerations

1. **Cache-Conscious Design** - Group frequently accessed fields together
2. **Branch Hints** - Use `@branchHint(.likely/.cold)` for predictable branches
3. **Unsafe Operations** - Use unsafe variants when bounds are pre-validated
4. **Memory Alignment** - Use `align(64)` for cache line alignment where beneficial
5. **Comptime Optimization** - Leverage Zig's comptime for zero-cost abstractions

### Architecture Guidelines  

1. **Configuration-Driven** - Use comptime configuration for type selection and feature flags
2. **Interface Segregation** - Keep interfaces minimal and focused (Database, Tracer, Host)
3. **Zero-Cost Abstractions** - Ensure abstractions compile away to optimal code
4. **Platform Awareness** - Consider 32-bit vs 64-bit implications in design
5. **Error Propagation** - Use Zig's error handling consistently throughout

### Debugging and Profiling

1. **Use Tracers** - Enable debugging tracers for step-by-step execution analysis
2. **Gas Tracking** - Monitor gas consumption patterns for optimization opportunities  
3. **Memory Profiling** - Track memory allocations and deallocations carefully
4. **Benchmark Critical Paths** - Use `zig build bench` to measure performance impact
5. **Documentation** - Document complex optimizations and their rationale

## EVM2 Module Structure Reference

### File Organization

```
src/evm2/
├── root.zig                    # Module exports and documentation
├── evm.zig                     # Main EVM implementation with transaction context
├── frame.zig                   # Execution context (~2000 lines - see navigation guide)
├── frame_config.zig           # Frame configuration parameters
├── frame_interpreter.zig      # Frame-based interpreter implementation
├── stack.zig                   # High-performance EVM stack
├── stack_config.zig           # Stack configuration
├── memory.zig                  # EVM-compliant memory management  
├── memory_config.zig          # Memory configuration
├── database_interface.zig     # Pluggable storage interface
├── database_interface_account.zig # Account data structures
├── memory_database.zig        # In-memory database implementation
├── tracer.zig                 # Execution tracing system
├── host.zig                   # External operations interface
├── planner.zig                # Bytecode analysis and optimization
├── planner_config.zig         # Planner configuration  
├── plan.zig                   # Runtime execution plan structure
├── plan_config.zig            # Plan configuration
├── plan_advanced.zig          # Advanced planning strategies
├── plan_minimal.zig           # Minimal planning implementation
├── plan_debug.zig             # Debug planning with validation
├── bytecode.zig               # Bytecode representation
├── bytecode_config.zig        # Bytecode configuration
├── bytecode_stats.zig         # Bytecode analysis statistics
├── opcode.zig                 # EVM opcode enumeration
├── opcode_data.zig            # Opcode metadata and gas costs
├── opcode_synthetic.zig       # Synthetic fused opcodes
├── hardfork.zig               # Ethereum hard fork support
├── access_list.zig            # EIP-2929 access list implementation
├── self_destruct.zig          # SELFDESTRUCT tracking
├── created_contracts.zig      # Contract creation tracking
├── call_params.zig            # Call operation parameters
├── call_result.zig            # Call operation results
├── block_info.zig             # Block information context
├── keccak_asm.zig             # Optimized Keccak-256 implementation
└── bench/                     # Performance benchmarks
    ├── comprehensive_evm_bench.zig
    ├── evm_zbench.zig
    └── evm_zbench_simple.zig
```

### Key Type Relationships

```
Evm
├── Frame (configured)
│   ├── Stack (high-performance, pointer-based)
│   ├── Memory (hierarchical, lazy expansion)
│   ├── DatabaseInterface (vtable-based polymorphism)
│   ├── Tracer (compile-time selected)
│   └── Host (external operations)
├── Planner (bytecode → optimized plan)
│   ├── Plan (instruction stream + constants)
│   └── Cache (LRU cached plans)
└── BlockInfo (execution environment)
```

## Future Development Roadmap

### Near-term Improvements
- **Tail Call Interpreter**: Full tail call optimization for zero stack growth
- **Advanced Fusion**: More sophisticated opcode combination patterns
- **SIMD Optimization**: Vector operations for bulk memory/storage operations
- **JIT Compilation**: Dynamic compilation of hot execution paths
- **Size-Optimized Build**: Complete implementation of plan_minimal module to enable ReleaseSmall builds that exclude advanced optimization code paths

### Long-term Research Directions
- **Execution Strategies**: Different execution models (threaded code, subroutining)
- **Memory Models**: Alternative memory management strategies
- **Gas Optimization**: More sophisticated gas calculation and pre-payment
- **State Trie Integration**: Direct integration with Merkle Patricia Trie implementations
- **Parallel Execution**: Multi-threaded execution for independent transactions

### Integration Points
- **Network Layer**: Integration with p2p networking for state synchronization
- **Consensus Engine**: Integration with proof-of-stake consensus mechanisms
- **State Storage**: Integration with high-performance storage backends
- **Monitoring**: Comprehensive metrics and observability integration

---

*This comprehensive guide ensures consistent, high-performance development of the EVM2 module with deep architectural understanding.*