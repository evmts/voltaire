# LIFETIMES.md - Complete Memory Allocation Lifecycle in Guillotine EVM

## Executive Summary

This document provides a comprehensive analysis of every memory allocation in the Guillotine EVM (`src/evm.zig` and its dependencies). It covers when allocations occur, which allocator is used, when memory is freed, and how error cases are handled.

## Allocator Types

The EVM uses two distinct allocators with different lifetimes:

1. **Main Allocator** (`self.allocator`) - Persistent allocations that outlive individual calls
2. **Call Arena Allocator** (`self.call_arena`) - Temporary allocations reset after each root call

## 1. EVM Initialization (`Evm.init`)

### Main Allocator Allocations

| Allocation | Location | When | Freed | Error Handling |
|------------|----------|------|-------|----------------|
| `AccessList` | evm.zig:144 | `AccessList.init(allocator)` | `deinit()` at evm.zig:221 | `errdefer` cleanup |
| `GrowingArenaAllocator` | evm.zig:147 | `GrowingArenaAllocator.initWithMaxCapacity()` | `deinit()` at evm.zig:239 | Returns error |
| `Journal` | evm.zig:163 | `Journal.init(allocator)` | `deinit()` at evm.zig:218 | Owned by EVM |
| `Logs ArrayList` | evm.zig:164 | `ArrayList(Log).empty` | `deinit()` at evm.zig:231 | Owned by EVM |
| `CreatedContracts` | evm.zig:165 | `CreatedContracts.init(allocator)` | `deinit()` at evm.zig:219 | Owned by EVM |
| `SelfDestruct` | evm.zig:171 | `SelfDestruct.init(allocator)` | `deinit()` at evm.zig:220 | Owned by EVM |
| `touched_addresses HashMap` | evm.zig:172 | `AutoHashMap.init(allocator)` | `deinit()` at evm.zig:232 | Owned by EVM |
| `touched_storage HashMap` | evm.zig:173 | `AutoHashMap.init(allocator)` | `deinit()` at evm.zig:238 | Owned by EVM |

**Lifetime**: These allocations persist for the entire EVM instance lifetime (multiple transactions).

## 2. Transaction-Level Allocations (`Evm.call`)

### During Transaction Execution

| Allocation | Location | When | Freed | Error Handling |
|------------|----------|------|-------|----------------|
| Log topics | evm.zig:1461 | `arena.dupe(u256, topics)` | Never - arena allocated | Returns on error |
| Log data | evm.zig:1462 | `arena.dupe(u8, data)` | Never - arena allocated | Returns on error |
| Return data | evm.zig:1331,1360 | `arena.alloc(u8, len)` | Never - arena allocated | Returns failure |
| Output buffer | evm.zig:713,743 | `arena.alloc(u8, len)` | Never - arena allocated | Returns failure |
| Logs ArrayList | evm.zig:1464 | `logs.append()` stores arena refs | Arena reset | Returns on error |

### Transaction Result Allocations

| Allocation | Location | When | Freed | Error Handling |
|------------|----------|------|-------|----------------|
| `result.logs` | evm.zig:595-627 | Deep copy from arena to main | Caller responsibility | Returns failure |
| Log topics (final) | evm.zig:608 | `allocator.dupe()` from arena | Caller via CallResult.deinit() | Cleanup on error |
| Log data (final) | evm.zig:618 | `allocator.dupe()` from arena | Caller via CallResult.deinit() | Cleanup on error |
| `result.selfdestructs` | evm.zig:607 | `self_destruct.toOwnedSlice()` | Caller responsibility | Returns failure |
| `result.accessed_addresses` | evm.zig:617 | `allocator.dupe(addresses)` | Caller responsibility | Returns failure |
| `result.accessed_storage` | evm.zig:624 | `allocator.alloc(StorageAccess)` | Caller responsibility | Returns failure |

**Cleanup**: The `defer` block at evm.zig:396-443 ensures all transaction-level state is reset:
- Arena allocator reset at line 431 (`resetRetainCapacity()`)
- Logs cleared at line 417 (no individual frees needed - arena allocated)
- Journal cleared at line 403
- Access list cleared at line 401

## 3. Frame Execution (`execute_frame`)

### Arena Allocations

| Allocation | Location | When | Freed | Error Handling |
|------------|----------|------|-------|----------------|
| `Frame` | evm.zig:1264 | `Frame.init(arena_allocator)` | `defer frame.deinit()` at 1266 | Returns error |
| `Bytecode` | evm.zig:1278,1288 | `Bytecode.init(arena_allocator)` | Arena reset | Returns error |
| `DispatchSchedule` | evm.zig:1301 | `DispatchSchedule.init(arena_allocator)` | `defer deinit()` at 1304 | Returns error |
| `JumpTable` | evm.zig:1307 | `createJumpTable(arena_allocator)` | `defer free()` at 1310 | Returns error |
| `JumpTable wrapper` | evm.zig:1313 | `arena_allocator.create(JumpTable)` | `defer destroy()` at 1314 | Returns error |

**Lifetime**: All frame allocations use the arena allocator and are cleaned up when the frame completes.

## 4. CREATE/CREATE2 Operations

### Contract Creation

| Allocation | Location | When | Freed | Error Handling |
|------------|----------|------|-------|----------------|
| Contract tracking | evm.zig:1128 | `created_contracts.mark_created()` | Transaction end | Revert on error |
| Code storage | evm.zig:1167 | `database.set_code()` | Never (persistent) | Revert snapshot |

## 5. State Dump (`dumpState`)

### Main Allocator Allocations

| Allocation | Location | When | Freed | Error Handling |
|------------|----------|------|-------|----------------|
| Address hex string | evm.zig:324 | `allocator.dupe(u8, &addr_hex)` | Caller via `StateDump.deinit()` | `errdefer` cleanup |
| Code copy | evm.zig:330 | `allocator.dupe(u8, db_code)` | Caller via `StateDump.deinit()` | `errdefer` cleanup |
| Storage HashMap | evm.zig:334 | `AutoHashMap.init(allocator)` | Caller via `StateDump.deinit()` | `errdefer` cleanup |

## 6. Journal System

### Journal Entry Allocations

| Allocation | Location | When | Freed | Error Handling |
|------------|----------|------|-------|----------------|
| Journal entries | journal.zig:70-95 | `entries.append()` for each change | `journal.deinit()` or `clear()` | Propagates error |
| Entry ArrayList | journal.zig:33 | `ArrayList.init()` with pre-allocation | `deinit()` at journal.zig:45 | Best-effort capacity |

**Lifetime**: Journal entries persist until transaction completes or reverts.

## 7. Access List (EIP-2929)

### HashMap Allocations

| Allocation | Location | When | Freed | Error Handling |
|------------|----------|------|-------|----------------|
| Address HashMap | access_list.zig | `HashMap.init()` | `deinit()` | Owned by AccessList |
| Storage HashMap | access_list.zig | `HashMap.init()` | `deinit()` | Owned by AccessList |

## 8. Database Operations

### Code Storage

| Allocation | Location | When | Freed | Error Handling |
|------------|----------|------|-------|----------------|
| Code storage | database.zig:311 | `allocator.alloc(u8, code.len)` | Never (persistent) | Returns OutOfMemory |
| Code hash map | database.zig | HashMap for code storage | Database `deinit()` | Owned by Database |

## 9. CallResult Structure

### Result Allocations

| Allocation | Location | When | Freed | Error Handling |
|------------|----------|------|-------|----------------|
| Output data | call_result.zig:23 | `allocator.dupe(u8, output)` | `CallResult.deinit()` | Try/catch |
| Logs array | call_result.zig:24 | `allocator.alloc(Log, n)` | `CallResult.deinit()` | Try/catch |
| Log topics | call_result.zig:90 | `allocator.dupe(u256, topics)` | `CallResult.deinit()` | Try/catch |
| Log data | call_result.zig:91 | `allocator.dupe(u8, data)` | `CallResult.deinit()` | Try/catch |

**Cleanup**: CallResult has a comprehensive `deinit()` at call_result.zig:150-180 that frees all allocations.

## 10. Error Handling Patterns

### Successful Patterns

1. **Errdefer Pattern** (evm.zig:145)
   ```zig
   var access_list = AccessList.init(allocator);
   errdefer access_list.deinit();
   ```

2. **Defer Pattern** (evm.zig:1266)
   ```zig
   var frame = try Frame.init(arena_allocator, ...);
   defer frame.deinit(arena_allocator);
   ```

3. **Arena Reset on Error** (evm.zig:429)
   ```zig
   self.call_arena.resetRetainCapacity() catch |err| {
       log.warn("Arena reset failed: {s}", .{@errorName(err)});
   };
   ```

### Critical Safety Rules

1. **Arena Allocator**: Used ONLY for single-frame lifetime data
2. **Main Allocator**: Used for cross-frame or transaction-level data
3. **Never Mix**: Arena-allocated data must never be stored in persistent structures
4. **Ownership Transfer**: CallResult takes ownership of logs, output, etc.
5. **Snapshot Revert**: All state changes are journaled and revertable

## 11. Memory Leaks Analysis

### Potential Leak Points

1. **~~Log Allocations~~**: Fixed - now arena allocated, copied to main only at transaction end
2. **Touched Storage**: ArrayList entries freed in deinit (evm.zig:234-238)
3. **CallResult**: Caller must call `deinit()` or memory leaks
4. **Database Operations**: See issue #832 for proposed caching improvements

### Verified Safe Patterns

1. **Arena Reset**: Automatically frees all frame allocations
2. **Journal Clear**: Resets without freeing (retains capacity)
3. **Access List Clear**: Clears but retains capacity
4. **Return Data**: Arena allocated, no explicit free needed

## 12. Performance Optimizations

### Memory Reuse Strategies

1. **Arena Capacity Retention** (evm.zig:429): `resetRetainCapacity()` keeps grown capacity
2. **Journal Capacity** (journal.zig:34): Pre-allocates 128 entries
3. **ArrayList Clear** (evm.zig:415): `clearRetainingCapacity()` avoids reallocation
4. **Return Data Reuse** (evm.zig:1726-1737): Reuses buffer if large enough

### Growth Strategies

1. **Arena Growth** (evm_arena_allocator.zig): 50% growth factor by default
2. **Journal Growth**: Dynamic ArrayList growth
3. **Logs Growth**: Dynamic ArrayList growth

## 13. Critical Invariants

1. **No Arena Data Escape**: Arena allocations NEVER escape frame boundaries
2. **Snapshot Consistency**: Every state change is recorded in journal
3. **Defer Cleanup**: Every allocation has corresponding cleanup
4. **Error Propagation**: Allocation failures properly propagated
5. **Transaction Atomicity**: All or nothing - complete rollback on failure

## 14. Testing Requirements

To verify memory safety:

1. Run with valgrind/AddressSanitizer
2. Test deep call stacks (1024 depth)
3. Test large state operations
4. Test OOM conditions
5. Test transaction reverts at various depths
6. Verify no leaks after millions of transactions

## Recent Improvements (2025-09-28)

### Fixed Memory Allocator Mismatch
- **Issue**: Log topics/data were arena-allocated but freed with main allocator
- **Fix**: Logs now consistently use arena during execution, copied to main only at transaction end
- **Impact**: Eliminates allocator mismatch bug, improves memory locality

### Optimized Log Handling
- Logs remain arena-allocated throughout transaction execution
- Deep copy to main allocator only when building final CallResult
- Proper error cleanup if copy fails partway through

### Future Improvements
- Database caching optimization tracked in issue #832
- Consider moving more transaction-scoped data to arena

## Conclusion

The Guillotine EVM implements a two-tier allocation strategy:
- **Persistent allocations** via main allocator for cross-transaction state
- **Temporary allocations** via arena allocator for per-frame and per-transaction data

This design ensures:
- Zero memory leaks through systematic cleanup
- Optimal performance through arena allocation
- Complete rollback capability through journaling
- Memory safety through clear ownership rules
- Efficient memory usage by deferring copies until necessary

Every allocation has a defined lifetime, cleanup path, and error handling strategy, making the system robust against memory-related vulnerabilities.