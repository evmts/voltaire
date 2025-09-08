# Block Context

Execution-time block and transaction context for the EVM.

## Overview

This module does not implement blockchain consensus or block validation. It provides the data structures the EVM reads via environment opcodes (e.g., NUMBER, TIMESTAMP, COINBASE, GASLIMIT, CHAINID, PREVRANDAO) and EIPs such as 1559 and 4844.

## Files

- `block_info.zig` — Compile-time configurable BlockInfo type exposed to the EVM.
- `transaction_context.zig` — Per-transaction context (gas limit, coinbase, chain id, blob fields).

## BlockInfo

`BlockInfo` is a generic factory that produces a struct with the correct field types for the current hardfork. Two presets are exposed:
- `DefaultBlockInfo` — Spec-compliant (u256 for difficulty/prevrandao and base_fee).
- `CompactBlockInfo` — Practical u64 types for performance-sensitive usage.

Key fields:
- `number: u64`, `timestamp: u64`, `gas_limit: u64`
- `coinbase: primitives.Address.Address`
- `difficulty | prev_randao: {u64|u128|u256}` (configurable)
- `base_fee: {u64|u96|u256}` (configurable, EIP-1559)
- `blob_base_fee: {u64|u96|u256}`, `blob_versioned_hashes: []const [32]u8` (EIP-4844)
- `beacon_root: ?[32]u8` (EIP-4788)

Helpers:
- `init()` — Zero/neutral defaults with mainnet chain_id=1.
- `hasBaseFee()` — Convenience check for 1559-style blocks.
- `validate()` — Basic sanity checks (timestamp boundary, gas limit range).

Example:
```zig
const std = @import("std");
const primitives = @import("primitives");
const Block = @import("block_info.zig").DefaultBlockInfo;

test "configure block info" {
    const b = Block{
        .number = 123,
        .timestamp = 1700000000,
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 1_000_000_000, // 1 gwei
    };
    try std.testing.expect(b.validate());
    try std.testing.expect(b.hasBaseFee());
}
```

## TransactionContext

`TransactionContext` holds immutable, per-transaction parameters used during execution:
- `gas_limit: u64`, `coinbase: Address`, `chain_id: u16`
- `blob_versioned_hashes: []const [32]u8`, `blob_base_fee: u256`

Example:
```zig
const Ctx = @import("transaction_context.zig").TransactionContext;
const coinbase = [_]u8{1} ++ [_]u8{0} ** 19;
const ctx = Ctx{ .gas_limit = 21_000, .coinbase = coinbase, .chain_id = 1 };
```

## Notes

- This module is intentionally decoupled from block validation/consensus. It focuses solely on the EVM’s view of the block and transaction.
- Extensive tests live next to the implementations to validate type choices, boundary conditions, and EIP-specific fields.
