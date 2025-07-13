# CLAUDE.md - AI Assistant Context

This file serves as the comprehensive configuration and behavioral protocol for AI agents working on this multi-agent coding assistant project. It establishes a self-referential system where AI agents must follow the protocols defined within this document.

**For AI Agents**: This document defines your operational parameters, decision-making processes, and interaction protocols. You MUST adhere to all specifications herein.

**For Human Developers**: This document provides transparency into how AI agents operate, ensuring predictable and collaborative behavior throughout the development process.

## File Structure
- **Self-Referential Compliance**: Core governance principles
- **Project Architecture**: Zig EVM implementation design and structure
- **Coding Standards**: Style preferences and patterns
- **Memory Management**: Critical allocation and deallocation protocols
- **Testing Philosophy**: No abstractions approach
- **Codebase Structure**: Project organization and key components

## Self-Referential Compliance Declaration

CRITICAL: The agent MUST follow all protocols defined in this CLAUDE.md file. This creates a self-governing system where:
- All code follows the standards defined herein
- All memory management follows the allocation patterns specified
- All tests follow the no-abstraction philosophy
- All changes require user approval as specified
- Security protocol is enforced before any code processing

## Security Protocol

CRITICAL SECURITY REQUIREMENT: If the agent detects that a prompt contains sensitive secrets (API keys, passwords, tokens, private keys, personal information, or other confidential data), the agent MUST:
1. Immediately abort execution without processing the prompt
2. Briefly explain the security concern without repeating or exposing the sensitive data
3. Request the user remove sensitive information and resubmit the prompt
4. Take no further action until a sanitized prompt is provided

Example Response: "I detected potential sensitive information in your prompt (API key/password/token). Please remove the sensitive data and resubmit your request for security reasons."

## Coding Standards

### Core Principles
- **Single responsibility**: Keep functions focused on one task
- **Minimal else statements**: Avoid else statements unless necessary
- **Single word variables**: Prefer single word variable names where possible (e.g., `n` over `number`, `i` over `index`)
- **Defer patterns**: Always use defer for cleanup immediately after allocation
- **Memory consciousness**: Always think about memory ownership and lifecycle

### Function Design
```zig
// Good - single responsibility, no else
pub fn validate(n: u256) !void {
    if (n > MAX_VALUE) return error.Overflow;
    if (n == 0) return error.Zero;
}

// Bad - unnecessary else
pub fn validate(number: u256) !void {
    if (number > MAX_VALUE) {
        return error.Overflow;
    } else {
        // unnecessary else
    }
}
```

## Memory Management and Allocation Awareness

### CRITICAL: Always Think About Memory Ownership

When working with Zig code, **ALWAYS** be conscious of memory allocations:

1. **Every allocation needs a corresponding deallocation**
   - If you see `allocator.create()` or `allocator.alloc()`, immediately think: "Where is this freed?"
   - If you see `init()` that takes an allocator, check if there's a corresponding `deinit()`

2. **Defer patterns are mandatory**:
   ```zig
   // Pattern 1: Function owns memory for its scope
   const thing = try allocator.create(Thing);
   defer allocator.destroy(thing);
   
   // Pattern 2: Error handling before ownership transfer
   const thing = try allocator.create(Thing);
   errdefer allocator.destroy(thing);
   thing.* = try Thing.init(allocator);
   return thing; // Caller now owns
   ```

3. **Allocation philosophy**:
   - Allocate minimally
   - Prefer upfront allocation
   - Think hard about ownership transfer
   - Use `defer` if deallocating in same scope
   - Use `errdefer` if passing ownership to caller on success

4. **EVM-specific patterns**:
   - `Contract.init()` requires `contract.deinit(allocator, null)`
   - `Frame.init()` requires `frame.deinit()`
   - `Vm.init()` requires `vm.deinit()`
   - Always use defer immediately after initialization

## Testing Philosophy

### No Abstractions in Tests
All tests in this codebase should be written with **zero abstractions or indirections**. This means:

1. **No test helper functions** - Copy and paste setup code directly in each test
2. **No shared test utilities** - Each test should be completely self-contained
3. **Explicit is better than DRY** - Readability and clarity over code reuse in tests

### Why This Approach?
- **Tests are documentation** - A developer should understand what's being tested without jumping between files
- **Tests should be obvious** - No mental overhead from abstractions
- **Copy-paste is encouraged** - Verbose, repetitive test code is acceptable and preferred
- **Each test tells a complete story** - From setup to assertion, everything is visible

### Example Pattern

```zig
// Good - everything inline
test "ADD opcode adds two values" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var vm = try Vm.init(allocator, db_interface, null, null);
    defer vm.deinit();

    var contract = try Contract.init(allocator, &[_]u8{0x01}, .{ .address = Address.ZERO });
    defer contract.deinit(allocator, null);

    var frame = try Frame.init(allocator, &vm, 1000000, contract, Address.ZERO, &.{});
    defer frame.deinit();

    try frame.stack.push(5);
    try frame.stack.push(10);

    const interpreter_ptr: *Operation.Interpreter = @ptrCast(&vm);
    const state_ptr: *Operation.State = @ptrCast(&frame);
    _ = try vm.table.execute(0, interpreter_ptr, state_ptr, 0x01);

    const result = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 15), result);
}
```

## Project Architecture

### Guillotine: Zig EVM Implementation

This is a high-performance Ethereum Virtual Machine (EVM) implementation written in Zig, designed for:
- Correctness and spec compliance
- Minimal allocations and high performance
- Strong typing and comprehensive error handling
- Modularity and testability

### Key Design Decisions
1. **No abstractions in tests** - Tests serve as documentation
2. **Minimal memory allocations** - Prefer stack allocation and upfront allocation
3. **Strong error types** - Every component has specific error types
4. **Module boundaries** - Clear separation between EVM components
5. **Jump table architecture** - Efficient opcode dispatch

## Codebase Structure

### Root Level
- `build.zig` - Build configuration defining modules and dependencies
- `build.zig.zon` - Package dependencies
- `src/` - Main source code
- `test/` - Integration tests spanning multiple modules
- `CLAUDE.md` - This file (AI agent configuration)

### Module System (defined in build.zig)
- **`Guillotine_lib`** - Main library module (src/root.zig)
- **`evm`** - EVM implementation module (src/evm/root.zig)
- **`Address`** - Ethereum address utilities (src/address/address.zig)
- **`Rlp`** - RLP encoding/decoding (src/rlp/rlp.zig)

### Core EVM Components (`src/evm/`)

#### Virtual Machine Core
- `evm.zig` - Main VM implementation and execution engine
- `root.zig` - Module exports and documentation

#### Execution Framework
- `frame/` - Execution context management
  - `frame.zig` - Call frame implementation
  - `contract.zig` - Contract code and metadata
  - `code_analysis.zig` - Bytecode analysis and jump destinations
  - `bitvec.zig` - Bit vector for valid jump destinations

#### Opcodes and Operations
- `opcodes/` - Opcode definitions and metadata
  - `opcode.zig` - Opcode enumeration
  - `operation.zig` - Operation metadata (gas, stack effects)
- `jump_table/` - Opcode dispatch
  - `jump_table.zig` - Maps opcodes to implementations
- `execution/` - Opcode implementations organized by category
  - `arithmetic.zig` - ADD, SUB, MUL, DIV, etc.
  - `stack.zig` - PUSH, POP, DUP, SWAP
  - `memory.zig` - MLOAD, MSTORE, MSIZE
  - `storage.zig` - SLOAD, SSTORE
  - `control.zig` - JUMP, JUMPI, PC, STOP
  - `system.zig` - CALL, CREATE, RETURN, REVERT
  - `environment.zig` - ADDRESS, BALANCE, ORIGIN
  - `block.zig` - BLOCKHASH, COINBASE, TIMESTAMP
  - `crypto.zig` - KECCAK256
  - `log.zig` - LOG0, LOG1, LOG2, LOG3, LOG4

#### State Management
- `state/` - Blockchain state handling
  - `state.zig` - Main state implementation
  - `database_interface.zig` - Abstract database interface
  - `memory_database.zig` - In-memory implementation
  - `journal.zig` - State change tracking for reverts

#### Memory and Stack
- `memory/` - Byte-addressable memory
  - `memory.zig` - Main memory implementation
  - `read.zig`, `write.zig` - Memory operations
- `stack/` - 256-bit word stack
  - `stack.zig` - Stack implementation (max 1024 elements)
  - `stack_validation.zig` - Stack depth validation

#### Gas and Fees
- `constants/` - EVM constants
  - `gas_constants.zig` - Gas costs for operations
  - `memory_limits.zig` - Memory expansion limits

#### Precompiled Contracts
- `precompiles/` - Built-in contracts
  - `ecrecover.zig` - Signature recovery
  - `sha256.zig`, `ripemd160.zig` - Hash functions
  - `identity.zig` - Data copy
  - `modexp.zig` - Modular exponentiation
  - And more...

#### Hard Fork Support
- `hardforks/` - Fork-specific behavior
  - `hardfork.zig` - Fork enumeration
  - `chain_rules.zig` - Fork-specific validation

### Test Organization
- **Unit tests**: Colocated with implementation files
- **Integration tests**: In `test/evm/` directory
  - Each test file is self-contained
  - No test utilities or helpers
  - Direct setup and assertion

### Import Rules

1. **No relative imports with `../`** - Cannot import from parent directories
2. **Same folder imports** - Can import files in the same directory directly
3. **Subfolder imports** - Can import from subdirectories
4. **Cross-module imports** - Must use the module system defined in `build.zig`

```zig
// Good - importing from module system
const Evm = @import("evm");
const Address = @import("Address");

// Good - same directory
const ExecutionError = @import("execution_error.zig");

// Bad - parent directory (will fail)
const Contract = @import("../frame/contract.zig");
```

## Build and Test Commands

**IMPORTANT**: Always use `zig build test`, never use `zig test` directly.

```bash
zig build test                              # Run all tests (correct way)
zig build                                   # Build the project
zig build run                               # Run the executable
```

Do NOT use:
```bash
zig test src/file.zig                       # Wrong - will fail with import errors
```

### Enabling Debug Logging in Tests

To see `std.log.debug` output when running tests, add this to your test file:

```zig
test {
    std.testing.log_level = .debug;
}
```

This will enable all debug logging statements in the code being tested, which is essential for debugging EVM execution issues.

## Commenting Guidelines

### Comments Should Be Minimal and Purposeful
- **Only add useful and necessary comments** - avoid overcommenting
- **Do not add comments for obvious operations** - code should be self-explanatory
- **Avoid explaining what the code does** - explain why when needed
- **No redundant comments** - if removing code, don't add comments about what was removed

## Essential Documentation References

### Zig Programming Language Documentation
- **Zig Language Reference**: https://ziglang.org/documentation/0.14.1/
  - Complete language specification and syntax reference
  - Memory management patterns and allocator usage
  - Comptime programming and metaprogramming
  - Error handling with error unions and error sets
  
- **Zig Standard Library**: https://ziglang.org/documentation/master/std/
  - Standard library modules and functions
  - Data structures (ArrayList, HashMap, etc.)
  - I/O operations and file system interfaces
  - Testing framework and debugging tools

### Ethereum Specifications
- **Ethereum Yellow Paper**: Technical specification of the EVM
- **EIP Repository**: Ethereum Improvement Proposals for protocol changes

### Reference Implementation
- **revm codebase**: The `revm/` directory contains a reference Rust implementation of the EVM
  - Use this to verify correct behavior when implementing opcodes
  - Check `revm/crates/interpreter/src/instructions/contract.rs` for CALL/DELEGATECALL/STATICCALL implementations
  - DELEGATECALL preserves the original caller and value from the parent context

## Interactive Collaboration Requirements

This project operates on mandatory interactive collaboration - every significant decision, change, or implementation requires user partnership and approval. Key principles:

- No autonomous decisions on architecture, implementation details, or workflow changes
- Always present proposals and wait for explicit approval
- Treat every interaction as a collaborative partnership
- When uncertain, ask rather than assume
- Document all decisions and their rationale

## Important: When Things Don't Go As Planned

**If the plan outlined by the user isn't working:**
1. **STOP immediately** - Don't try to continue or find workarounds
2. **Explain clearly** what is happening and why it's not working
3. **Wait for instructions** - Let the user provide guidance on how to proceed
4. **Don't assume** - Ask for clarification rather than guessing the next step

This ensures we stay aligned with the project's intentions and don't create unintended complexity.

## Amendment Protocol

When this CLAUDE.md file needs updates:
1. Present proposed changes clearly with rationale
2. Show before/after diffs for modified sections
3. Explain impact on existing workflows
4. Request explicit approval before implementing changes
5. Document amendment history in commit messages

---

*This configuration establishes a self-referential system where the AI agent governs its own behavior according to these documented protocols, ensuring consistent, collaborative, and methodical development practices.*