/**
 * @module PublicKey
 * @description Effect Schemas for secp256k1 public keys with compression support.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 *
 * function verifySignature(key: PublicKey.PublicKeyType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `PublicKey.Hex` | hex string | PublicKeyType |
 * | `PublicKey.Bytes` | Uint8Array | PublicKeyType |
 * | `PublicKey.Compressed` | compressed hex | PublicKeyType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const pk = S.decodeSync(PublicKey.Hex)('0x04...')
 *
 * // Encode (format output)
 * const hex = S.encodeSync(PublicKey.Hex)(pk)
 * const compressed = S.encodeSync(PublicKey.Compressed)(pk)
 * const bytes = S.encodeSync(PublicKey.Bytes)(pk)
 * ```
 *
 * ## Cryptographic Operations
 *
 * ```typescript
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const address = PublicKey.toAddress(pk)
 *   const isValid = yield* PublicKey.verify(pk, hash, signature)
 *   return { address, isValid }
 * })
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * PublicKey.equals(a, b)       // Effect<boolean>
 * PublicKey.isValid(value)     // Effect<boolean>
 * PublicKey.isCompressed(bytes) // Effect<boolean>
 * PublicKey.toBytes(pk)        // Uint8Array (sync)
 * ```
 *
 * @since 0.1.0
 */

export { Bytes } from "./Bytes.js";
export { Compressed } from "./Compressed.js";
export { equals } from "./equals.js";
export { Hex } from "./Hex.js";
export { isCompressed } from "./isCompressed.js";
export { isValid } from "./isValid.js";
export { toAddress } from "./toAddress.js";
export { toBytes } from "./toBytes.js";
export { verify } from "./verify.js";
