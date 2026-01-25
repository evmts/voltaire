import { PublicKey, type PublicKeyType } from '@tevm/voltaire/PublicKey'
import { PrivateKey, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a PublicKey from a hex string using Effect for error handling.
 *
 * @param hex - 128-character hex string (64 bytes uncompressed public key)
 * @returns Effect that succeeds with PublicKeyType or fails with validation error
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/PublicKey'
 *
 * const publicKey = from('0x04...')
 * Effect.runSync(publicKey)
 * ```
 *
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
 * @param privateKey - Private key as PrivateKeyType or hex string
 * @returns Effect that succeeds with derived PublicKeyType
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromPrivateKey } from 'voltaire-effect/primitives/PublicKey'
 *
 * const publicKey = fromPrivateKey('0x0123456789abcdef...')
 * Effect.runSync(publicKey)
 * ```
 *
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
 * @param publicKey - 64-byte uncompressed public key
 * @returns Effect that succeeds with 33-byte compressed public key
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { compress, from } from 'voltaire-effect/primitives/PublicKey'
 *
 * const program = Effect.gen(function* () {
 *   const pk = yield* from('0x04...')
 *   const compressed = yield* compress(pk)
 *   return compressed // 33 bytes
 * })
 * ```
 *
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
 * @param compressed - 33-byte compressed public key
 * @returns Effect that succeeds with 64-byte uncompressed public key
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { decompress } from 'voltaire-effect/primitives/PublicKey'
 *
 * const publicKey = decompress(compressedBytes)
 * Effect.runSync(publicKey) // 64 bytes
 * ```
 *
 * @since 0.0.1
 */
export const decompress = (compressed: Uint8Array): Effect.Effect<PublicKeyType, Error> =>
  Effect.try({
    try: () => PublicKey.decompress(compressed),
    catch: (e) => e as Error
  })
