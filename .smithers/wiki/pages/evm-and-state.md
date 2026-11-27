---
title: "EVM, State Manager, and Blockchain"
tags: [evm, state-manager, blockchain, trie, precompiles]
kind: current
owner: evmts
---

# EVM, State Manager, and Blockchain

Beyond standalone primitives, Voltaire provides foundational execution and state building blocks shared downstream with ZEVM and Guillotine.

## Core Subsystems

- **EVM (`packages/voltaire-zig/src/evm/`, `packages/voltaire-ts/src/evm/`):** Opcode metadata, frame/stack/memory models, arithmetic/bitwise/system handlers, and EVM precompiles (ECRECOVER, SHA256, RIPEMD160, IDENTITY, MODEXP, ECADD, ECMUL, ECPAIRING, BLAKE2F, KZG Point Evaluation, BLS12-381, P256VERIFY).
- **State Manager (`packages/voltaire-zig/src/state-manager/`, `packages/voltaire-ts/src/state-manager/`):** O(1) `StateCache`, atomic snapshots and reverts, and `ForkBackend` for remote RPC state hydration.
- **Blockchain (`packages/voltaire-zig/src/blockchain/`, `packages/voltaire-ts/src/blockchain/`):** O(1) `BlockStore`, `ForkBlockCache`, single-pass `BlockHeader` RLP decoding, and canonical EIP-1186 Merkle Patricia Trie proofs (`primitives/trie.zig`).
- **JSON-RPC (`packages/voltaire-zig/src/jsonrpc/`, `packages/voltaire-ts/src/jsonrpc/`):** Typed Ethereum JSON-RPC request/response schemas and transport abstractions.

## Downstream Consumers

Voltaire is consumed directly by `evmts/zevm` (embeddable Zig Ethereum node) and `evmts/guillotine` (EVM execution engine). Changes to C ABI exports or EVM precompile semantics must keep cross-repo contracts backward-compatible or ship coordinated changesets.

## Related Pages

- [[primitives]]
- [[cryptography]]
- [[wasm-and-ffi]]
- [[mythical-history]]
