---
"@tevm/voltaire": patch
---

Preserve EIP-7685 execution-requests hashes in Prague and Osaka block headers,
RPC conversion, hashing, and Zig RLP encoding/decoding. Verify the public
TypeScript hash against an execution-specs tests@v20.0.2 Osaka fixture.

Zig header decoding now preserves `extra_data`. The caller owns this returned
slice and must free it with the allocator passed to `rlpDecode`.
