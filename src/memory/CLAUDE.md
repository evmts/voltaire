# CLAUDE.md - Memory Module

## MISSION CRITICAL: EVM Memory Semantics

**Memory deviations cause consensus failures and fund loss.** Must expand correctly, maintain byte-addressability, calculate gas precisely.

### EVM Memory Specs

- **Word Size**: 32 bytes (256 bits)
- **Growth**: 32-byte word boundaries only
- **Addressing**: Byte-addressable from 0
- **Initialization**: Zero-initialized on expansion
- **Gas**: Quadratic expansion cost (EIP-150)

### Core Files

- **`memory.zig`** - Main implementation, lazy expansion, MLOAD/MSTORE/MSTORE8
- **`memory_config.zig`** - Configuration/validation
- **`memory_c.zig`** - C FFI interface
- **`memory_bench.zig`** - Performance benchmarks

## Key Operations

- **Word-aligned expansion**: Always 32-byte boundaries
- **MLOAD/MSTORE**: 32-byte word operations
- **MSTORE8**: Single byte operations
- **Gas formula**: `words * 3 + words² / 512` (EIP-150)

## Safety & Performance

- **Bounds checking**: Always validate before access
- **Zero initialization**: Expanded memory must be zeroed
- **Checkpoints**: Save/restore for nested calls
- **Lazy allocation**: Only allocate when accessed
- **Word-aligned growth**: Reduces fragmentation

## Critical Errors

- **Memory overflow**: Check against MEMORY_LIMIT
- **Out of bounds**: Validate all access
- **Allocation failure**: Handle OutOfMemory gracefully

**EVM memory semantics are sacred.** Any deviation causes consensus failures.