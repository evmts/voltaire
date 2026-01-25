/**
 * PublicKey module for Effect-based cryptographic public key handling.
 *
 * Provides Effect-wrapped operations for working with secp256k1 public keys,
 * including derivation from private keys and compression/decompression.
 *
 * @example
 * ```typescript
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   // Derive from private key
 *   const pk = yield* PublicKey.fromPrivateKey(privateKey)
 *
 *   // Compress to 33 bytes
 *   const compressed = yield* PublicKey.compress(pk)
 *
 *   // Decompress back to 64 bytes
 *   const uncompressed = yield* PublicKey.decompress(compressed)
 * })
 * ```
 *
 * @module
 * @since 0.0.1
 */
export { PublicKeySchema, PublicKeyFromBytesSchema, CompressedPublicKeySchema } from './PublicKeySchema.js'
export { from, fromPrivateKey, compress, decompress } from './from.js'
