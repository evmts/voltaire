/**
 * @fileoverview Converts Hash values to hex string representation.
 *
 * @module Hash/toHex
 * @since 0.0.1
 */
import * as Hash from '@tevm/voltaire/Hash'
import type { HashType } from '@tevm/voltaire/Hash'

/**
 * Converts a Hash to a hex string representation.
 *
 * @description Encodes a HashType value as a 0x-prefixed hexadecimal string.
 * The output is always 66 characters (0x + 64 hex characters).
 * This is a pure synchronous function that never fails.
 *
 * @param {HashType} hash - Hash value to convert
 * @returns {string} 66-character hex string (0x-prefixed, lowercase)
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * // Convert hash to hex string
 * const hex = Hash.toHex(hash)
 * console.log(hex) // '0xabababab...'
 *
 * // Use in a pipeline
 * const hex = await Effect.runPromise(
 *   Hash.fromBytes(bytes).pipe(
 *     Effect.map(Hash.toHex)
 *   )
 * )
 *
 * // Display transaction hash
 * console.log(`Transaction: ${Hash.toHex(txHash)}`)
 * ```
 *
 * @see {@link toBytes} - Convert Hash to Uint8Array
 * @see {@link fromHex} - Create Hash from hex string
 *
 * @since 0.0.1
 */
export const toHex = (hash: HashType): string => Hash.toHex(hash)
