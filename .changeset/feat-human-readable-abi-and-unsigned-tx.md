---
"@tevm/voltaire": minor
---

Accept human-readable signatures in `Abi()` and `Abi.from()`, alone or mixed
with JSON items (`"function transfer(address to, uint256 amount) returns (bool)"`).
`Abi.parseHumanReadable` and the `parseHumanReadable` export parse signatures,
including `struct` declarations, into JSON ABI items; malformed input throws
`AbiParseError`. `Abi.from()` now returns a typed `Abi` instead of `any`. (#320)

Add `Transaction.serializeUnsigned` and `Transaction.deserializeUnsigned` for the
signing payload of legacy (with EIP-155 chain ID) and typed 1, 2, 3 and 4
transactions. Signature fields on the input are ignored, so a signed transaction
yields its unsigned envelope. (#292)
