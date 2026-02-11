---
"@tevm/voltaire": patch
"voltaire-effect": patch
---

Fix type soundness bugs in public API: all toHex() returns HexType, brand symbol exported from main entrypoint, ABI bytes mapped to Uint8Array, dead bun:ffi NativeExports removed, Domain chainId unified on ChainIdType
