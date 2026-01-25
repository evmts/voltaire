/**
 * @fileoverview Creates Hash values from raw byte arrays with Effect error handling.
 *
 * @module Hash/fromBytes
 * @since 0.0.1
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'
import * as Effect from 'effect/Effect'

/**
 * Creates a Hash from a 32-byte Uint8Array.
 *
 * @description Validates that the input is exactly 32 bytes and wraps it
 * as a branded HashType. Returns an Effect that fails with an Error if
 * the input is not valid.
 *
 * @param {Uint8Array} bytes - 32-byte array to convert to Hash
 * @returns {Effect.Effect<HashType, Error>} Effect containing HashType on success,
 *   or Error if the input is not exactly 32 bytes
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * // Create hash from 32 zero bytes
 * const program = Hash.fromBytes(new Uint8Array(32))
 * const hash = await Effect.runPromise(program)
 *
 * // Handle potential errors
 * const result = await Effect.runPromise(
 *   Effect.either(Hash.fromBytes(invalidBytes))
 * )
 * ```
 *
 * @throws {Error} When bytes is not exactly 32 bytes in length
 *
 * @see {@link fromHex} - Create Hash from hex string
 * @see {@link toBytes} - Convert Hash back to Uint8Array
 * @see {@link HashSchema} - Schema-based validation alternative
 *
 * @since 0.0.1
 */
export const fromBytes = (bytes: Uint8Array): Effect.Effect<HashType, Error> =>
  Effect.try({
    try: () => Hash.fromBytes(bytes),
    catch: (e) => e as Error
  })
