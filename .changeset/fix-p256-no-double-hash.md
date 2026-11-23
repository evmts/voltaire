---
"@tevm/voltaire": patch
---

Fix `P256.sign` and `P256.verify` hashing `messageHash` a second time. Both now pass `prehash: false` to `@noble/curves`, so `P256.sign(sha256(msg), key)` produces the standard ECDSA signature over `sha256(msg)`. Signatures now verify under EIP-7951 `P256VERIFY`, WebAuthn, and the Zig implementation, and match RFC 6979 A.2.5 test vectors.

- `P256.sign` rejects private keys outside `[1, n-1]` with `InvalidPrivateKeyError` (constant-time check). Callers cannot re-enable prehashing through `options`.
- `P256.verify` accepts high-S signatures (`lowS: false`), matching EIP-7951 and WebAuthn. P-256 has no low-S rule.

**Breaking for stored signatures:** a signature produced by an earlier `P256.sign` signed `sha256(messageHash)` and no longer verifies against `messageHash`. Re-sign, or verify it against `sha256(messageHash)`.
