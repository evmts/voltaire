/**
 * @fileoverview Creates Hash values from strings or bytes with Effect error handling.
 *
 * @module Hash/from
 * @since 0.0.1
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'
import * as Effect from 'effect/Effect'

/**
 * Creates a Hash from a hex string or 32-byte Uint8Array.
 *
 * @description Accepts either a hex-encoded string (with or without 0x prefix)
 * or a 32-byte Uint8Array and returns a branded HashType. This is the primary
 * constructor for Hash values.
 *
 * @param {string | Uint8Array} value - Hex string or 32-byte array
 * @returns {Effect.Effect<HashType, Error>} Effect containing HashType on success,
 *   or Error if the input is invalid
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * // From hex string
 * const hash1 = await Effect.runPromise(
 *   Hash.from('0x' + 'ab'.repeat(32))
 * )
 *
 * // From Uint8Array
 * const hash2 = await Effect.runPromise(
 *   Hash.from(new Uint8Array(32))
 * )
 * ```
 *
 * @throws {Error} When input is invalid or wrong length
 *
 * @see {@link fromHex} - Create from hex string only
 * @see {@link fromBytes} - Create from bytes only
 *
 * @since 0.0.1
 */
export const from = (value: string | Uint8Array): Effect.Effect<HashType, Error> =>
  Effect.try({
    try: () => Hash.from(value),
    catch: (e) => e as Error
  })
