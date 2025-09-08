# Bytecode

Validated EVM bytecode representation with fast iteration, metadata parsing, and fusion hints.

## Overview

`bytecode.zig` exposes a `Bytecode(comptime cfg)` factory that builds a strongly-typed bytecode object with:
- Safe validation and bitmap generation in a single pass
- JUMPDEST lookups in O(1) via bitmaps
- Optional PUSH+OP fusion hints for dispatch optimization
- Solidity metadata parsing/stripping (runtime code only)
- EIP-170 code size enforcement and EIP-3860 initcode gas helpers

EOF (EIP-3540/3670/4750/5450) is not supported yet.

## Files

- `bytecode.zig` — Core type, iterator, validation, fusion hints, metadata parsing
- `bytecode_analyze.zig` — Standalone analyzer used by tooling/benchmarks
- `bytecode_stats.zig` — Opcode statistics and fusion opportunity reporting

## Validation Model

During `init(...)` we treat input as untrusted and build three bitmaps plus a packed per-byte view:
- `is_op_start`, `is_push_data`, `is_jumpdest` (byte-addressed bitmaps)
- `packed_bitmap` (4 bits/byte): op-start, push-data, jumpdest, fusion-candidate

Rules enforced:
- Truncated PUSH detection (no read past end of code)
- Invalid opcodes are treated as `INVALID (0xFE)` for safety
- Jumpdest bits are set only for true opcode starts
- EIP-170: runtime bytecode must not exceed configured max

For deployment bytecode with Solidity metadata, validation excludes the metadata suffix while preserving the full input slice for consumers that need it.

## Iterator and Queries

The `Iterator` walks instructions efficiently and yields a compact tagged union:
- PUSH (value + size), regular opcode, JUMPDEST, STOP, INVALID
- When fusion hints are enabled, the iterator can emit fused PUSH+OP forms (e.g., PUSH+ADD/JUMP/JUMPI) with the decoded immediate value.

Common helpers:
- `len()` — runtime code length
- `raw()` / `rawWithoutMetadata()` — underlying slices
- `isValidJumpDest(pc)` — O(1) validity check
- `calculateInitcodeGas(len)` — EIP-3860 cost

## Stats

`getStats()` collects:
- Opcode histogram
- PUSH immediates and simple PUSH+OP fusion candidates
- JUMP/JUMPI targets and backwards-jump count
- Heuristics like “looks like create code” (e.g., presence of CODECOPY)

## Example

```zig
const Bytecode = @import("bytecode.zig").Bytecode(.{});

const bc = try Bytecode.init(allocator, raw);
defer bc.deinit();

var it = bc.createIterator();
while (it.next()) |op| switch (op) {
    .push => |p| { _ = p.value; },
    .jumpdest => {},
    .regular => |r| { _ = r.opcode; },
    else => {},
} 

const ok = bc.isValidJumpDest(0x42);
```

## Performance Notes

- Single-pass validation builds all bitmaps with cache-friendly writes
- Packed per-byte metadata avoids re-scanning for common queries
- Iterator prefetches ahead on large bytecode to improve locality
- Fusion hints are purely optional; correctness never depends on them
