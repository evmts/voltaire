/**
 * @fileoverview PublicKey module for Effect-based cryptographic public key handling.
 * Provides Effect-wrapped operations for working with secp256k1 public keys,
 * including derivation from private keys and compression/decompression.
 *
 * @description
 * This module exposes both Effect-wrapped functions and Effect Schemas for
 * working with Ethereum public keys. Public keys are 64-byte values (uncompressed)
 * or 33-byte values (compressed) derived from private keys using secp256k1.
 *
 * Key features:
 * - Derive public keys from private keys
 * - Compress/decompress between 33-byte and 64-byte formats
 * - Parse from hex strings or raw bytes
 * - Full Effect integration for error handling
 *
 * @example
 * ```typescript
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create private key
 *   const privKey = yield* PrivateKey.from('0x...')
 *
 *   // Derive public key from private key
 *   const pk = yield* PublicKey.fromPrivateKey(privKey)
 *
 *   // Compress to 33 bytes for storage
 *   const compressed = yield* PublicKey.compress(pk)
 *
 *   // Decompress back to 64 bytes when needed
 *   const uncompressed = yield* PublicKey.decompress(compressed)
 *
 *   return pk
 * })
 * ```
 *
 * @module PublicKey
 * @since 0.0.1
 * @see {@link PublicKeySchema} for schema-based validation
 * @see {@link fromPrivateKey} for deriving from private keys
 * @see {@link compress} and {@link decompress} for format conversion
 */
export { PublicKeySchema, PublicKeyFromBytesSchema, CompressedPublicKeySchema } from './PublicKeySchema.js'
export { from, fromPrivateKey, compress, decompress } from './from.js'
export { fromHex } from './fromHex.js'
export { fromBytes } from './fromBytes.js'
export { toHex } from './toHex.js'
export { toBytes } from './toBytes.js'
export { toAddress } from './toAddress.js'
export { isCompressed } from './isCompressed.js'
export { equals } from './equals.js'
export { isValid } from './isValid.js'
export { verify } from './verify.js'
