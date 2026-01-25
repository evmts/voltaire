/**
 * @fileoverview Effect-wrapped functions for creating and manipulating PublicKey instances.
 * Provides safe constructors and operations that return Effect types for error handling.
 * @module PublicKey/from
 * @since 0.0.1
 */

import { PublicKey, type PublicKeyType } from '@tevm/voltaire/PublicKey'
import { PrivateKey, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a PublicKey from a hex string using Effect for error handling.
 *
 * @description
 * Parses and validates a hexadecimal string representation of a public key.
 * The hex string should represent the uncompressed public key (64 bytes / 128 hex chars).
 *
 * @param hex - 128-character hex string (64 bytes uncompressed public key)
 * @returns Effect that succeeds with PublicKeyType or fails with validation error
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 *
 * // Parse from hex string
 * const publicKey = PublicKey.from('0x04...')
 * const result = Effect.runSync(publicKey)
 *
 * // Use in Effect pipeline
 * const program = Effect.gen(function* () {
 *   const pk = yield* PublicKey.from('0x04...')
 *   const compressed = yield* PublicKey.compress(pk)
 *   return compressed
 * })
 * ```
 *
 * @throws InvalidFormatError - When the hex string contains invalid characters
 * @throws InvalidLengthError - When the hex string is not the correct length
 * @see {@link fromPrivateKey} for deriving from a private key
 * @since 0.0.1
 */
export const from = (hex: string): Effect.Effect<PublicKeyType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => PublicKey.from(hex),
    catch: (e) => e as InvalidFormatError | InvalidLengthError
  })

/**
 * Derives a public key from a private key using Effect for error handling.
 *
 * @description
 * Uses secp256k1 elliptic curve multiplication to derive the corresponding
 * public key from a private key. This is the standard method for generating
 * Ethereum public keys from private keys.
 *
 * @param privateKey - Private key as PrivateKeyType or hex string
 * @returns Effect that succeeds with derived PublicKeyType (64 bytes uncompressed)
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 *
 * // From hex string
 * const pk1 = PublicKey.fromPrivateKey('0x0123456789abcdef...')
 *
 * // From PrivateKeyType
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 *
 * const program = Effect.gen(function* () {
 *   const privKey = yield* PrivateKey.from('0x...')
 *   const pubKey = yield* PublicKey.fromPrivateKey(privKey)
 *   return pubKey
 * })
 * ```
 *
 * @throws Error - When the private key is invalid or derivation fails
 * @see {@link from} for creating from hex string directly
 * @since 0.0.1
 */
export const fromPrivateKey = (privateKey: PrivateKeyType | string): Effect.Effect<PublicKeyType, Error> =>
  Effect.try({
    try: () => {
      const pk = typeof privateKey === 'string' ? PrivateKey.from(privateKey) : privateKey
      return PublicKey.fromPrivateKey(pk)
    },
    catch: (e) => e as Error
  })

/**
 * Compresses an uncompressed public key to 33 bytes.
 *
 * @description
 * Converts a 64-byte uncompressed public key to its 33-byte compressed form
 * using SEC1 encoding. The compressed format uses the first byte to indicate
 * the parity of the y-coordinate (0x02 for even, 0x03 for odd), followed by
 * the 32-byte x-coordinate.
 *
 * @param publicKey - 64-byte uncompressed public key (PublicKeyType)
 * @returns Effect that succeeds with 33-byte compressed public key as Uint8Array
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 *
 * const program = Effect.gen(function* () {
 *   const pk = yield* PublicKey.from('0x04...')
 *   const compressed = yield* PublicKey.compress(pk)
 *   // compressed is 33 bytes: [parity, x0, x1, ..., x31]
 *   return compressed
 * })
 * ```
 *
 * @throws Error - When compression fails (e.g., invalid public key)
 * @see {@link decompress} for the reverse operation
 * @since 0.0.1
 */
export const compress = (publicKey: PublicKeyType): Effect.Effect<Uint8Array, Error> =>
  Effect.try({
    try: () => PublicKey.compress(publicKey),
    catch: (e) => e as Error
  })

/**
 * Decompresses a compressed public key to 64 bytes.
 *
 * @description
 * Recovers the full 64-byte uncompressed public key from a 33-byte compressed
 * representation. Uses the secp256k1 curve equation to derive the y-coordinate
 * from the x-coordinate and parity byte.
 *
 * @param compressed - 33-byte compressed public key (parity byte + x-coordinate)
 * @returns Effect that succeeds with 64-byte uncompressed public key (PublicKeyType)
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 *
 * // Decompress a compressed key
 * const publicKey = PublicKey.decompress(compressedBytes)
 * const result = Effect.runSync(publicKey)
 * // result is 64 bytes: [x0, ..., x31, y0, ..., y31]
 *
 * // Round-trip example
 * const program = Effect.gen(function* () {
 *   const pk = yield* PublicKey.from('0x04...')
 *   const compressed = yield* PublicKey.compress(pk)
 *   const decompressed = yield* PublicKey.decompress(compressed)
 *   // pk and decompressed are equal
 *   return decompressed
 * })
 * ```
 *
 * @throws Error - When decompression fails (e.g., invalid compressed key)
 * @see {@link compress} for the reverse operation
 * @since 0.0.1
 */
export const decompress = (compressed: Uint8Array): Effect.Effect<PublicKeyType, Error> =>
  Effect.try({
    try: () => PublicKey.decompress(compressed),
    catch: (e) => e as Error
  })
