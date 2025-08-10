# EVM Memory Allocation Report

This document provides a comprehensive analysis of all heap and stack allocations in the Guillotine EVM implementation. Each allocation is documented with its lifetime, size, and frequency.

## Table of Contents
1. [Core EVM Allocations](#core-evm-allocations)
2. [Frame and Execution Context](#frame-and-execution-context)
3. [Code Analysis](#code-analysis)
4. [Stack Implementation](#stack-implementation)
5. [Memory Implementation](#memory-implementation)
6. [State Management](#state-management)
7. [Access List](#access-list)
8. [Analysis Cache](#analysis-cache)
9. [Summary Statistics](#summary-statistics)

---

## Core EVM Allocations

### `Evm` struct (src/evm/evm.zig)

#### Heap Allocations:

1. **Internal Arena Allocator**
   - **Location**: Line 166
   - **Size**: Initial capacity 256KB (ARENA_INITIAL_CAPACITY)
   - **Lifetime**: Per EVM instance (freed on deinit)
   - **Frequency**: Once per EVM creation
   - **Purpose**: Temporary allocations reset between executions

2. **Frame Stack Array**
   - **Location**: Line 141 (lazy allocation)
   - **Size**: Initially 16 * sizeof(Frame) ≈ 16 * ~500 bytes = ~8KB
   - **Lifetime**: Per call execution (freed after call completes)
   - **Frequency**: Once per top-level call, grows on demand for nested calls
   - **Growth**: Doubles up to MAX_CALL_DEPTH (1024)

3. **Analysis Cache**
   - **Location**: Line 210
   - **Size**: 128 cache entries * (analysis data + overhead) ≈ 50-100KB
   - **Lifetime**: Per EVM instance
   - **Frequency**: Once per EVM creation

4. **Self Destruct Tracker**
   - **Location**: Lines 205, 132
   - **Size**: HashMap overhead + entries ≈ 1-5KB typical
   - **Lifetime**: Per transaction
   - **Frequency**: Once per top-level call

5. **Created Contracts Tracker**
   - **Location**: Lines 209, 133
   - **Size**: HashMap overhead + entries ≈ 1-5KB typical
   - **Lifetime**: Per transaction
   - **Frequency**: Once per top-level call

6. **Call Journal**
   - **Location**: Line 207
   - **Size**: Varies with call depth and state changes ≈ 10-100KB
   - **Lifetime**: Per transaction
   - **Frequency**: Once per EVM instance

#### Stack Allocations:

1. **Analysis Stack Buffer**
   - **Location**: Line 100
   - **Size**: 43,008 bytes (MAX_STACK_BUFFER_SIZE)
   - **Lifetime**: Per EVM instance (reused across calls)
   - **Frequency**: Once per EVM instance
   - **Note**: Stack-allocated optimization for small contracts

---

## Frame and Execution Context

### `Frame` struct (src/evm/frame.zig)

#### Heap Allocations (per frame):

1. **Stack**
   - **Location**: Lines 184-187
   - **Size**: 1024 * 32 bytes = 32KB
   - **Lifetime**: Per frame (freed on frame.deinit)
   - **Frequency**: Once per call frame
   - **Purpose**: EVM execution stack

2. **Memory**
   - **Location**: Lines 193-196
   - **Size**: Initial capacity varies, grows on demand
   - **Lifetime**: Per frame
   - **Frequency**: Once per call frame
   - **Purpose**: EVM memory for MLOAD/MSTORE operations

---

## Code Analysis

### `CodeAnalysis` struct (src/evm/analysis.zig)

#### Heap Allocations:

1. **Instructions Array**
   - **Location**: Line 340
   - **Size**: (MAX_INSTRUCTIONS + 1) * sizeof(Instruction) ≈ 3-5MB max
   - **Details**: 65537 instructions * ~48 bytes = ~3.1MB
   - **Lifetime**: Per analysis (cached or per-call)
   - **Frequency**: Once per unique contract bytecode

2. **PC to Block Start Mapping**
   - **Location**: Line 628
   - **Size**: code_len * 2 bytes
   - **Lifetime**: Per analysis
   - **Frequency**: Once per unique contract bytecode

3. **Jump Type Array**
   - **Location**: Line 374
   - **Size**: (MAX_INSTRUCTIONS + 1) * sizeof(JumpType) ≈ 65KB
   - **Details**: 65537 * 1 byte enum = ~64KB
   - **Lifetime**: Per analysis
   - **Frequency**: Once per unique contract bytecode

4. **Jumpdest Bitmap**
   - **Location**: Line 137
   - **Size**: code_len bits (rounded up)
   - **Lifetime**: Per analysis
   - **Frequency**: Once per unique contract bytecode

5. **Temporary Code Bitmap**
   - **Location**: Line 279 (temporary)
   - **Size**: code_len bits
   - **Lifetime**: During analysis only (freed immediately)
   - **Frequency**: Once per analysis

6. **PC to Instruction Mapping**
   - **Location**: Line 321 (temporary)
   - **Size**: code_len * 2 bytes
   - **Lifetime**: During analysis only (freed immediately)
   - **Frequency**: Once per analysis

---

## Stack Implementation

### `Stack` struct (src/evm/stack/stack.zig)

#### Heap Allocations:

1. **Stack Data Array**
   - **Location**: Line 104
   - **Size**: 1024 * 32 bytes = 32KB exactly
   - **Lifetime**: Per Stack instance
   - **Frequency**: Once per frame
   - **Purpose**: Storage for stack values

---

## Memory Implementation

### `Memory` struct (src/evm/memory/memory.zig)

#### Heap Allocations:

1. **Shared Buffer (ArrayList)**
   - **Location**: Lines 53-58
   - **Size**: Initial INITIAL_CAPACITY (4KB default), grows on demand
   - **Lifetime**: Per root Memory instance
   - **Frequency**: Once per frame (shared among child memories)
   - **Growth**: Doubles when capacity exceeded, up to memory_limit

2. **ArrayList Structure**
   - **Location**: Line 53
   - **Size**: sizeof(ArrayList) ≈ 24 bytes
   - **Lifetime**: Per root Memory instance
   - **Frequency**: Once per frame

---

## State Management

### `EvmState` struct (src/evm/state/state.zig)

#### Heap Allocations:

1. **Transient Storage HashMap**
   - **Location**: Line 97
   - **Size**: HashMap overhead + entries * (32 + 32 bytes)
   - **Lifetime**: Per EVM instance
   - **Frequency**: Once per EVM instance
   - **Growth**: Dynamic based on TSTORE usage

2. **Logs ArrayList**
   - **Location**: Line 98
   - **Size**: ArrayList overhead + log entries
   - **Lifetime**: Per transaction
   - **Frequency**: Once per EVM instance
   - **Growth**: Append on LOG opcodes

3. **Selfdestructs HashMap**
   - **Location**: Line 99
   - **Size**: HashMap overhead + entries * (20 + 20 bytes)
   - **Lifetime**: Per transaction
   - **Frequency**: Once per EVM instance

---

## Access List

### `AccessList` struct (src/evm/access_list/access_list.zig)

#### Heap Allocations:

1. **Addresses HashMap**
   - **Location**: Line 50
   - **Size**: HashMap overhead + warm addresses * 20 bytes
   - **Lifetime**: Per transaction
   - **Frequency**: Once per EVM instance
   - **Growth**: On address access

2. **Storage Slots HashMap**
   - **Location**: Line 51
   - **Size**: HashMap overhead + warm slots * (20 + 32 bytes)
   - **Lifetime**: Per transaction
   - **Frequency**: Once per EVM instance
   - **Growth**: On storage slot access

---

## Analysis Cache

### `AnalysisCache` struct (src/evm/analysis_cache.zig)

#### Heap Allocations:

1. **Cache Entries HashMap**
   - **Location**: Line 81
   - **Size**: HashMap overhead + entries * sizeof(CacheEntry)
   - **Lifetime**: Per EVM instance
   - **Frequency**: Once per EVM instance
   - **Max Entries**: 128 (DEFAULT_CACHE_SIZE)

2. **Individual Cache Entries**
   - **Location**: Per cache miss
   - **Size**: sizeof(CacheEntry) + CodeAnalysis data
   - **Lifetime**: Until evicted from cache
   - **Frequency**: Once per unique contract bytecode

---

## Summary Statistics

### Per-Transaction Memory Profile:

| Component | Typical Size | Maximum Size | Allocation Frequency |
|-----------|-------------|--------------|---------------------|
| **Frame Stack** | 8KB initial | 512KB (1024 frames) | Once per top-level call |
| **Per-Frame Stack** | 32KB | 32KB | Once per call frame |
| **Per-Frame Memory** | 4KB initial | Variable (gas limited) | Once per call frame |
| **Code Analysis** | ~100KB typical | ~3-5MB max | Once per unique contract |
| **Analysis Cache** | 50-100KB | ~200KB | Once per EVM instance |
| **Arena Allocator** | 256KB | Variable | Once per EVM instance |
| **Access List** | 5-10KB | ~50KB | Once per transaction |
| **State (transient)** | 1-5KB | Variable | Once per EVM instance |
| **Call Journal** | 10-100KB | Variable | Once per transaction |

### Allocation Patterns:

1. **One-time allocations** (per EVM instance):
   - Arena allocator: 256KB (verified by assertion)
   - Analysis cache: 50-100KB
   - Call journal: Variable

2. **Per-transaction allocations**:
   - Access list: 5-50KB
   - Self-destruct tracker: 1-5KB
   - Created contracts: 1-5KB
   - Logs: Variable

3. **Per-call allocations**:
   - Frame: ~200-500 bytes structure
   - Stack: 32KB exactly (1024 * 32 bytes, verified by assertion)
   - Memory: 4KB initial (verified by assertion, grows on demand)

4. **Lazy allocations**:
   - Frame stack: Allocated on first call, grows on nested calls
   - Analysis: Cached after first analysis

### Memory Optimization Notes:

1. **Stack Buffer Optimization**: Contracts ≤12.8KB use stack-allocated buffer instead of heap
2. **Arena Allocator**: Reduces allocation overhead for temporary data
3. **Analysis Cache**: Prevents redundant analysis of the same bytecode
4. **Lazy Frame Stack**: Only allocates frames as needed for call depth
5. **Memory Sharing**: Child memories share buffer with parent to reduce allocations

### Peak Memory Usage Estimate:

- **Minimal contract**: ~300KB (EVM overhead + 1 frame)
- **Typical contract**: ~500KB-1MB
- **Complex contract with deep calls**: 2-5MB
- **Worst case (max depth, all features)**: ~10-20MB