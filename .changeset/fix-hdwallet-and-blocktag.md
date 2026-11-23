---
"@tevm/voltaire": patch
"voltaire-effect": patch
---

Expose the JavaScript HDWallet API from `@tevm/voltaire` and include its live
service in `CryptoLive`. Keep libwally mnemonic operations available through
`@tevm/voltaire/native`. Verify that Zig's blockchain module re-exports
`Blockchain.BlockTag`.
