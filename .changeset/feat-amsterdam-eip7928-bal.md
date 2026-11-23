---
"@tevm/voltaire": minor
---

Add Amsterdam (Glamsterdam) primitives in TypeScript and Zig.

- `BlockAccessList` implements EIP-7928 block-level access lists:
  `AccountChanges`, `SlotChanges`, `StorageChange`, `BalanceChange`,
  `NonceChange`, and `CodeChange`, with canonical RLP encoding, strict RLP
  decoding, validation of ordering and uniqueness, and the
  `keccak256(rlp(list))` header commitment. TypeScript and Zig assert the same
  byte vector and hash.
- `BlockHeader` accepts an optional `blockAccessListHash`
  (`block_access_list_hash` in Zig) and hashes it as the 22nd RLP field, after
  `requestsHash`. Headers without the field encode and hash as before.
- `GasConstants` exports the EIP-8037 state gas and EIP-8038 state access
  parameters under an `Amsterdam` prefix. Both EIPs were in Last Call when
  recorded; existing constants are unchanged.
- `ExecutionPayloadBid` adds the EIP-7732 (ePBS) `ExecutionPayloadBid` and
  `SignedExecutionPayloadBid` types with length- and range-checking
  constructors (TypeScript only).
