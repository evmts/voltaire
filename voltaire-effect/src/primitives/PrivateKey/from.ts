import { PrivateKey, type PrivateKeyType } from '@tevm/voltaire/PrivateKey'
import { InvalidFormatError, InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Creates a PrivateKey from a hex string using Effect for error handling.
 *
 * @param hex - 64-character hex string (with or without 0x prefix)
 * @returns Effect that succeeds with PrivateKeyType or fails with InvalidFormatError/InvalidLengthError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { from } from 'voltaire-effect/primitives/PrivateKey'
 *
 * const privateKey = from('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
 * Effect.runSync(privateKey)
 * ```
 *
 * @since 0.0.1
 */
export const from = (hex: string): Effect.Effect<PrivateKeyType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => PrivateKey.from(hex),
    catch: (e) => e as InvalidFormatError | InvalidLengthError
  })

/**
 * Creates a PrivateKey from raw bytes using Effect for error handling.
 *
 * @param bytes - 32-byte Uint8Array
 * @returns Effect that succeeds with PrivateKeyType or fails with InvalidFormatError/InvalidLengthError
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import { fromBytes } from 'voltaire-effect/primitives/PrivateKey'
 *
 * const bytes = new Uint8Array(32).fill(1)
 * const privateKey = fromBytes(bytes)
 * Effect.runSync(privateKey)
 * ```
 *
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<PrivateKeyType, InvalidFormatError | InvalidLengthError> =>
  Effect.try({
    try: () => PrivateKey.fromBytes(bytes),
    catch: (e) => e as InvalidFormatError | InvalidLengthError
  })
