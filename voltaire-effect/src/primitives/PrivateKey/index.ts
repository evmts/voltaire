/**
 * @module PrivateKey
 * @description Effect Schemas for secp256k1 private keys with cryptographic operations.
 *
 * ## Schemas
 *
 * | Schema | Input | Output |
 * |--------|-------|--------|
 * | `PrivateKey.Hex` | hex string | PrivateKeyType |
 * | `PrivateKey.Bytes` | Uint8Array | PrivateKeyType |
 *
 * ## Usage
 *
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import * as S from 'effect/Schema'
 *
 * // Decode (parse input)
 * const pk = S.decodeSync(PrivateKey.Hex)('0x0123456789abcdef...')
 *
 * // Encode (format output)
 * const hex = S.encodeSync(PrivateKey.Hex)(pk)
 * const bytes = S.encodeSync(PrivateKey.Bytes)(pk)
 * ```
 *
 * ## Cryptographic Operations
 *
 * ```typescript
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const pk = yield* PrivateKey.random()
 *   const publicKey = yield* PrivateKey.toPublicKey(pk)
 *   const address = yield* PrivateKey.toAddress(pk)
 *   const signature = yield* PrivateKey.sign(pk, messageHash)
 *   return { publicKey, address, signature }
 * })
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * PrivateKey.isValid(value)  // Effect<boolean>
 * ```
 *
 * @since 0.1.0
 */

export { Bytes } from "./Bytes.js";
export { Hex } from "./Hex.js";
export { isValid } from "./isValid.js";
export { random } from "./random.js";
