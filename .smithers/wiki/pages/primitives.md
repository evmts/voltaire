---
title: "Ethereum Primitives"
tags: [primitives, typescript, zig, branded-types]
kind: current
owner: evmts
---

# Ethereum Primitives

Voltaire represents Ethereum values as zero-overhead branded `Uint8Array` types in TypeScript (`packages/voltaire-ts/src/primitives/`) and stack-friendly fixed-size structs in Zig (`packages/voltaire-zig/src/primitives/`).

## Branded Types and Namespace Pattern

- Every primitive exposes a nominal brand (`packages/voltaire-ts/src/brand.ts`) so `AddressType`, `HashType`, and `HexType` cannot be accidentally swapped at compile time while compiling down to plain bytes at runtime.
- Operations are tree-shakeable functions grouped under namespaces (`Address.toChecksummed`, `Abi.encodeFunctionData`, `Rlp.encode`, `Transaction.serialize`) so bundlers include only the exact functions imported.

## Core Primitive Surfaces

- **Identity & Bytes:** `Address` (EIP-55 checksums, CREATE/CREATE2), `Hex`, `Bytes`, `Base64`, `Hash`
- **Numeric & Units:** `Uint` (`Uint8`–`Uint256`), `Int256`, `Wei`, `Gwei`, `Ether`, `FeeMarket`
- **Encoding & Wire Formats:** `Abi`, `Rlp`, `Bytecode`, `AccessList`, `Authorization` (EIP-7702), `Blob` (EIP-4844), `BlockAccessList`
- **Execution Structures:** `Transaction` (Legacy, EIP-2930, EIP-1559, EIP-4844, EIP-7702), `BlockHeader`, `Receipt`, `Log`, `Proof` (EIP-1186), `Trie`
- **Hardforks:** Osaka default (`EIP-7951` P256VERIFY, blob schedules, block size limits)

## Performance & Footprint

Flagship primitive gzipped source budgets are tracked continuously in `.agents/uphill/metrics/footprint.ts` and reported in the Lighthouse audit report ([[backpressure-and-audits]]).

## Related Pages

- [[architecture]]
- [[cryptography]]
- [[evm-and-state]]
- [[wasm-and-ffi]]
