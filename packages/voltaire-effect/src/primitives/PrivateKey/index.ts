/**
 * @module PrivateKey
 * @description Effect Schemas for secp256k1 private keys with cryptographic operations.
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Use Case |
 * |--------|-------|--------|----------|
 * | `PrivateKey.Hex` | hex string | PrivateKeyType | Development |
 * | `PrivateKey.Bytes` | Uint8Array | PrivateKeyType | Development |
 * | `PrivateKey.RedactedHex` | hex string | Redacted<PrivateKeyType> | **Production** |
 * | `PrivateKey.RedactedBytes` | Uint8Array | Redacted<PrivateKeyType> | **Production** |
 *
 * ## Redacted Schemas (Recommended)
 *
 * Use `RedactedHex` or `RedactedBytes` in production to prevent accidental logging:
 *
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import { Redacted } from 'effect'
 * import * as S from 'effect/Schema'
 *
 * const pk = S.decodeSync(PrivateKey.RedactedHex)('0x0123...')
 * console.log(pk)  // Redacted(<redacted>)
 *
 * // Explicit unwrap for crypto operations
 * const unwrapped = Redacted.value(pk)
 * const sig = Secp256k1.sign(hash, unwrapped)
 * ```
 *
 * ## Standard Usage
 *
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import * as S from 'effect/Schema'
 *
 * const pk = S.decodeSync(PrivateKey.Hex)('0x0123456789abcdef...')
 * const hex = S.encodeSync(PrivateKey.Hex)(pk)
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * PrivateKey.isValid(value)  // Effect<boolean>
 * PrivateKey.random()        // Effect<PrivateKeyType>
 * ```
 *
 * @since 0.1.0
 */

export { Bytes, RedactedBytes } from "./Bytes.js";
export { Hex, RedactedHex } from "./Hex.js";
export { isValid } from "./isValid.js";
export { random } from "./random.js";
