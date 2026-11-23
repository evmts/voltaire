---
"@tevm/zig": patch
---

Harden Zig signing, constant-time helpers, and the KZG trusted setup lifecycle:

- `unaudited_signHash` computes `s = k^-1 (e + r d) mod n` with constant-time `std.crypto.ecc.Secp256k1.scalar.Scalar` arithmetic instead of variable-time `mulmod`/`addmod`/`invmod`. RFC 6979 nonce generation reduces the hash mod `n` (`bits2octets`) and wipes `data`, `k`, `v`, `t`, and `candidate_k`.
- `constantTimeEqBytes` and `constantTimeIsZeroBytes` use a volatile accumulator so the optimizer cannot add an early exit. P-256 `ecdh` wipes the secret scalar and shared point. BIP-39 word lookup compares fixed 9-byte padded buffers, so dictionary word length no longer affects timing.
- c-kzg bindings: `loadTrustedSetupFile` returns `BadArgs` for paths of 256+ bytes or with an embedded NUL. `verifyKZGProof`, `computeBlobKZGProof`, and `verifyBlobKZGProof` return `TrustedSetupNotLoaded` instead of panicking. A binding-owned `RwLock` is held exclusively across load and free and shared across every C call, so freeing the setup waits for in-flight computations and verifications (including PeerDAS).
