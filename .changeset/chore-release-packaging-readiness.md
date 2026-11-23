---
"@tevm/voltaire": patch
"voltaire-effect": patch
"@tevm/zig": patch
---

Ship complete npm metadata, a README and a LICENSE in every published package, and stop publishing test, benchmark and stale build files.

- `@tevm/voltaire`: add `homepage` and `bugs`; add `typesVersions` fallbacks for the 17 subpaths that lacked them (`ContractCode`, `InitCode`, `LogFilter`, `PrivateKey`, `PublicKey`, `signers`, `block`, `contract`, `transaction`, `stream`, `AesGcm`, `Bls12381`, `BN254`, `HMAC`, `Keystore`, `ModExp`, `X25519`); block `@tevm/voltaire/evm/system/lib`, which had types but no runtime module; drop compiled test declarations and stray `.js` files from `types/`.
- `voltaire-effect`: build the `voltaire-effect/jsonrpc` entry point, which the `exports` map declared but the build never emitted; correct `repository.directory` and `homepage`; stop publishing test and benchmark sources.
- `@tevm/zig`: add `homepage` and `bugs`; remove `files` entries that matched nothing; stop publishing benchmark sources.
