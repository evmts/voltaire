/**
 * @fileoverview PrivateKey module for Effect-based cryptographic key handling.
 * Provides Effect-wrapped operations for working with secp256k1 private keys.
 * Handles 32-byte keys for Ethereum signing operations.
 *
 * @description
 * This module exposes both Effect-wrapped constructors (from, fromBytes) and
 * Effect Schemas (PrivateKeySchema, PrivateKeyFromBytesSchema) for working
 * with Ethereum private keys in a type-safe, functional manner.
 *
 * Private keys are 32-byte values used for:
 * - Signing transactions
 * - Deriving public keys and addresses
 * - Creating digital signatures
 *
 * @example
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import * as Effect from 'effect/Effect'
 * import * as S from 'effect/Schema'
 *
 * // Using Effect-wrapped constructors
 * const program = Effect.gen(function* () {
 *   // From hex string
 *   const pk1 = yield* PrivateKey.from('0x0123456789abcdef...')
 *
 *   // From bytes
 *   const pk2 = yield* PrivateKey.fromBytes(new Uint8Array(32))
 *
 *   // Derive address
 *   const addr = yield* PrivateKey.toAddress(pk1)
 *
 *   return pk1
 * })
 *
 * // Using Schemas for validation
 * const parsed = S.decodeSync(PrivateKey.PrivateKeySchema)('0x...')
 * ```
 *
 * @module PrivateKey
 * @since 0.0.1
 * @see {@link PrivateKeySchema} for schema-based validation
 * @see {@link from} for Effect-wrapped hex string parsing
 * @see {@link fromBytes} for Effect-wrapped byte array parsing
 */
export { PrivateKeySchema, PrivateKeyFromBytesSchema } from './PrivateKeySchema.js'
export { from, fromBytes } from './from.js'
export { fromHex } from './fromHex.js'
export { random } from './random.js'
export { toHex } from './toHex.js'
export { toBytes } from './toBytes.js'
export { toPublicKey } from './toPublicKey.js'
export { toAddress } from './toAddress.js'
export { sign } from './sign.js'
export { isValid } from './isValid.js'
