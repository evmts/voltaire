/**
 * @fileoverview Bytes32 creation function with Effect error handling.
 * Converts various input formats to branded 32-byte type with proper validation.
 * @module voltaire-effect/primitives/Bytes32/from
 * @since 0.0.1
 */

import { Bytes32, type Bytes32Type } from '@tevm/voltaire/Bytes'
import { InvalidLengthError } from '@tevm/voltaire/errors'
import * as Effect from 'effect/Effect'

/**
 * Input types accepted for Bytes32 construction.
 *
 * @description
 * Union of types that can be converted to Bytes32:
 * - `Bytes32Type`: Already a Bytes32 (passthrough)
 * - `string`: Hex string (must be 66 chars: 0x + 64 hex chars)
 * - `Uint8Array`: Must be exactly 32 bytes
 * - `bigint`: Will be left-padded to 32 bytes
 * - `number`: Will be left-padded to 32 bytes
 *
 * @since 0.0.1
 */
type Bytes32Like = Bytes32Type | string | Uint8Array | bigint | number

/**
 * Creates a Bytes32 from various input formats.
 *
 * @description
 * Converts input to a branded Bytes32Type (Uint8Array with exactly 32 bytes).
 * Validates that the result is exactly 32 bytes. Returns an Effect that fails
 * with InvalidLengthError if the input doesn't produce 32 bytes.
 *
 * This is the primary constructor for Bytes32 values in the Effect-based API.
 * Never throws - all errors are captured in the Effect error channel.
 *
 * 32-byte values are fundamental in Ethereum for:
 * - Keccak256 hashes
 * - Storage slot keys
 * - Private keys
 * - Block and transaction hashes
 *
 * @param {Bytes32Like} value - Input to convert:
 *   - `string`: Hex string (66 chars: 0x + 64 hex chars)
 *   - `Uint8Array`: Must be exactly 32 bytes
 *   - `bigint`: Left-padded to 32 bytes
 *   - `number`: Left-padded to 32 bytes
 * @returns {Effect.Effect<Bytes32Type, InvalidLengthError | Error>} Effect yielding
 *   the branded Bytes32Type on success, or failing with:
 *   - InvalidLengthError if input doesn't produce 32 bytes
 *   - Error for other validation failures
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as Bytes32 from 'voltaire-effect/primitives/Bytes32'
 *
 * // From 64-char hex string
 * const hash = await Effect.runPromise(
 *   Bytes32.from('0x' + 'ab'.repeat(32))
 * )
 * // Bytes32Type (32 bytes)
 *
 * // From bigint (left-padded)
 * const slot = await Effect.runPromise(Bytes32.from(1n))
 * // 0x0000000000000000000000000000000000000000000000000000000000000001
 *
 * // From number (left-padded)
 * const index = await Effect.runPromise(Bytes32.from(42))
 * // 0x000000000000000000000000000000000000000000000000000000000000002a
 *
 * // Handle errors with Effect
 * const result = await Effect.runPromise(
 *   Bytes32.from('0xdeadbeef').pipe( // Only 4 bytes - will fail
 *     Effect.catchTag('InvalidLengthError', (e) =>
 *       Effect.succeed(new Uint8Array(32) as Bytes32Type)
 *     )
 *   )
 * )
 *
 * // Use in Effect pipeline
 * const pipeline = Effect.gen(function* () {
 *   const hash = yield* Bytes32.from('0x' + 'ff'.repeat(32))
 *   console.log(hash.length) // 32
 *   return hash
 * })
 * ```
 *
 * @throws {InvalidLengthError} When input doesn't produce exactly 32 bytes
 * @throws {Error} For other validation failures (invalid hex, etc.)
 *
 * @see {@link Schema} - Effect Schema for validation/parsing
 * @see Bytes32Type - The branded output type
 * @see Bytes32Like - Accepted input types
 *
 * @since 0.0.1
 */
export const from = (value: Bytes32Like): Effect.Effect<Bytes32Type, InvalidLengthError | Error> =>
  Effect.try({
    try: () => Bytes32.Bytes32(value),
    catch: (e) => e as InvalidLengthError | Error
  })
