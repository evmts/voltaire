/**
 * @fileoverview Converts Hash values to raw byte arrays.
 *
 * @module Hash/toBytes
 * @since 0.0.1
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";

/**
 * Converts a Hash to its underlying Uint8Array representation.
 *
 * @description Extracts the raw 32-byte array from a HashType value.
 * This is a pure synchronous function that never fails since HashType
 * is already validated to be a proper 32-byte array.
 *
 * @param {HashType} hash - Hash value to convert
 * @returns {Uint8Array} 32-byte Uint8Array containing the hash bytes
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as Effect from 'effect/Effect'
 *
 * // Get bytes from a hash
 * const bytes = Hash.toBytes(hash) // Uint8Array(32)
 *
 * // Use in a pipeline
 * const bytes = await Effect.runPromise(
 *   Hash.fromHex('0x' + 'ab'.repeat(32)).pipe(
 *     Effect.map(Hash.toBytes)
 *   )
 * )
 * console.log(bytes.length) // 32
 * ```
 *
 * @see {@link toHex} - Convert Hash to hex string
 * @see {@link fromBytes} - Create Hash from Uint8Array
 *
 * @since 0.0.1
 */
export const toBytes = (hash: HashType): Uint8Array => Hash.toBytes(hash);
