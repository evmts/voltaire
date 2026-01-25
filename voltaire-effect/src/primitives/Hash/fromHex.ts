/**
 * @fileoverview Creates Hash values from hex strings with Effect error handling.
 *
 * @module Hash/fromHex
 * @since 0.0.1
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'
import * as Effect from 'effect/Effect'

/**
 * Creates a Hash from a 66-character hex string (0x + 64 hex chars).
 *
 * @description Parses a hex-encoded string and validates it represents
 * exactly 32 bytes. The string must be 0x-prefixed. Returns an Effect
 * that fails with an Error if the input is not valid.
 *
 * @param {string} hex - Hex string representing 32 bytes (must be 0x-prefixed)
 * @returns {Effect.Effect<HashType, Error>} Effect containing HashType on success,
 *   or Error if the input is not a valid 32-byte hex string
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * // Parse a transaction hash
 * const program = Hash.fromHex(
 *   '0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b'
 * )
 * const hash = await Effect.runPromise(program)
 *
 * // Chain with other operations
 * const bytes = await Effect.runPromise(
 *   program.pipe(Effect.map(Hash.toBytes))
 * )
 * ```
 *
 * @throws {Error} When hex string is not 66 characters or contains invalid hex characters
 *
 * @see {@link fromBytes} - Create Hash from Uint8Array
 * @see {@link toHex} - Convert Hash back to hex string
 * @see {@link HashSchema} - Schema-based validation alternative
 *
 * @since 0.0.1
 */
export const fromHex = (hex: string): Effect.Effect<HashType, Error> =>
  Effect.try({
    try: () => Hash.fromHex(hex),
    catch: (e) => e as Error
  })
