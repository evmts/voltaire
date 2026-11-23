---
"@tevm/voltaire": minor
"@tevm/zig": minor
---

Add `ReceiptManager`, an in-memory receipt store for Tevm and ZEVM dev nodes (#390). It saves receipts per block hash, looks receipts up by transaction hash (`{ receipt, blockHash, txIndex }`), and filters logs with eth_getLogs semantics: `blockHashes`, single or OR-list `address`, and positional `topics` with `null` wildcards and OR-arrays. `deleteReceipts` removes a block's receipts, logs, and transaction index entries together for reorgs, and keeps the index entry of a transaction re-included in another block.

TypeScript: `Receipt.ReceiptManager()`. Zig: `state-manager.ReceiptManager` with allocator-owned, leak-tested storage.
