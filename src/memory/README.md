# Memory

EVM‑compliant memory with lazy growth, word alignment, and nested context isolation.

## Overview

The `Memory(comptime config)` type implements byte‑addressable memory that grows on demand and always expands to 32‑byte word boundaries as required by the EVM. Child contexts (e.g., CALL frames) can share the same backing buffer using checkpoints, avoiding copies.

Defaults (see `memory_config.zig`):
- `initial_capacity = 4096`
- `memory_limit = 0xFFFFFF` (~16 MiB, typical EVM limit)
- `owned = true`

## Files

- `memory.zig` — Core implementation and EVM‑style helpers
- `memory_config.zig` — Compile‑time configuration and validation
- `memory_c.zig`, `memory_bench.zig` — FFI and benchmarks

## API Highlights

- `init(allocator)` / `deinit(allocator)` — create/destroy owned memory
- `init_child()` — borrow the same buffer with a new checkpoint
- `ensure_capacity(allocator, new_size: u24)` — zero‑extends up to size
- `set_data(allocator, off, bytes)` / `get_slice(off, len)` — raw ops
- `set_data_evm(allocator, off, bytes)` — expands to next 32‑byte word
- `get_u256(off)` / `set_u256(allocator, off, value)` — word helpers
- `get_u256_evm(allocator, off)` — read with EVM expansion semantics
- `get_expansion_cost(new_size)` — EVM gas delta for memory growth

## Examples

```zig
const Memory = @import("memory.zig").Memory(.{ .owned = true });
var mem = try Memory.init(allocator);
defer mem.deinit(allocator);

// Write a u256 at offset 0 (no implicit EVM expansion)
try mem.set_u256(allocator, 0, 1234);
try std.testing.expectEqual(@as(u256, 1234), try mem.get_u256(0));

// EVM‑compliant write grows to next 32‑byte boundary
const data = [_]u8{0xAA} ** 20;
try mem.set_data_evm(allocator, 40, &data);
```

Checkpointed child memory:

```zig
var child = try mem.init_child();
defer child.deinit(allocator); // no‑op for borrowed
try child.set_data(allocator, 0, &[_]u8{1,2,3});
```

Gas cost (EVM formula):

```zig
const before = mem.get_expansion_cost(0);   // 0
const after  = mem.get_expansion_cost(256); // 3*8 + 8*8/512
```

## Notes

- All newly allocated bytes are zero‑initialized.
- Owned and borrowed variants have identical layout; ownership only affects init/deinit.
- The public API requires an allocator for any operation that may grow memory.
    const new_cost = memory_gas_cost(new_size);
    return new_cost - old_cost;
}

fn memory_gas_cost(size: u64) u64 {
    const size_word = (size + 31) / 32;
    return GasConstants.MEMORY * size_word + size_word * size_word / 512;
}
```

### Integration with Frame
```zig
// Frame integration for gas accounting
pub fn expand_to_with_gas(
    self: *Self, 
    offset: u64, 
    gas_tracker: *GasTracker
) !void {
    const old_size = self.size();
    const new_size = offset + 32;
    const gas_cost = expansion_gas_cost(old_size, new_size);
    
    try gas_tracker.consume(gas_cost);
    try self.expand_to(offset);
}
```

## Checkpoint System

Memory supports hierarchical checkpoints for nested execution contexts:

### Checkpoint Creation
```zig
pub const Checkpoint = struct {
    size: u32,
    timestamp: u64,
};

pub fn create_checkpoint(self: *Self) Checkpoint {
    return Checkpoint{
        .size = @intCast(self.buffer_ptr.items.len),
        .timestamp = std.time.timestamp(),
    };
}
```

### Checkpoint Reversion
```zig
pub fn revert_to_checkpoint(self: *Self, checkpoint: Checkpoint) void {
    if (checkpoint.size < self.buffer_ptr.items.len) {
        self.buffer_ptr.shrinkAndFree(checkpoint.size);
        // Memory beyond checkpoint is automatically freed
    }
}
```

## Integration Notes

### With Frame Module
Memory integrates with Frame for:
- Gas cost accounting during expansion
- Opcode-specific memory operations (MLOAD, MSTORE, etc.)
- Context isolation during CALL operations

### With Instructions Module  
Memory handlers provide:
- Word-aligned load/store operations
- Byte-level access for MSTORE8
- Size queries for MSIZE opcode
- Data copying for CALLDATACOPY, CODECOPY

### With Stack Module
Coordination with stack for:
- Offset validation from stack values
- Word size validation for operations
- Error propagation patterns

## Error Handling

Memory operations use comprehensive error handling:
- `OutOfMemory` - System allocation failure
- `MemoryOverflow` - Size exceeds configured limits  
- `OutOfBounds` - Access beyond valid memory range

All errors propagate cleanly through the execution chain with proper resource cleanup via defer patterns.
