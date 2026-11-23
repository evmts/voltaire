---
"@tevm/voltaire": minor
---

Make Uint overflow behavior explicit across sizes and add a viem-compatible ABI parameter decoder.

**Uint overflow (#67).** Every Uint size (`Uint8`, `Uint16`, `Uint32`, `Uint64`, `Uint128`, `Uint`/`Uint256`) now exports the same six functions:

- `plusChecked`, `minusChecked`, `timesChecked`: throw a subclass of `IntegerOverflowError` or `IntegerUnderflowError` when the exact result does not fit.
- `plusWrapping`, `minusWrapping`, `timesWrapping`: return the result modulo 2^bits and never throw.

`plus`, `minus`, and `times` are unchanged: Uint8 and Uint16 throw, Uint32 and wider wrap. Their JSDoc and the Uint256 docs now state the mode. Use the explicit functions in code that handles more than one Uint size.

**ABI decoding (#300).** `Abi.decodeParameters` is unchanged and its Voltaire-native output is now pinned by regression tests: always an array with one entry per parameter (including one output and empty inputs), lowercase address strings, `Uint8Array` bytes, `bigint` integers, and arrays for tuples.

New `Abi.decodeAbiParameters(params, data)` returns what viem's `decodeAbiParameters` returns: EIP-55 checksummed addresses, hex strings for `bytes`/`bytesN`, `number` for integers up to 48 bits and `bigint` above, objects for tuples whose components are all named, and arrays for tuples with any unnamed component. It accepts `Uint8Array` or hex input. `Abi.DecodeAbiParameters({ keccak256 })` is the factory form. Errors remain Voltaire's `AbiDecodingError`, not viem's error classes.
