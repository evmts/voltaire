/**
 * PrivateKey module for Effect-based cryptographic key handling.
 *
 * Provides Effect-wrapped operations for working with secp256k1 private keys.
 * Handles 32-byte keys for Ethereum signing operations.
 *
 * @example
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import * as Effect from 'effect/Effect'
 *
 * // From hex string
 * const pk1 = PrivateKey.from('0x0123456789abcdef...')
 *
 * // From bytes
 * const pk2 = PrivateKey.fromBytes(new Uint8Array(32))
 *
 * Effect.runSync(pk1)
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { PrivateKeySchema, PrivateKeyFromBytesSchema } from './PrivateKeySchema.js'
export { from, fromBytes } from './from.js'
