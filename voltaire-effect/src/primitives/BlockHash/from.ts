/**
 * @fileoverview Factory function for creating BlockHash values.
 * Provides Effect-based construction with typed error handling.
 *
 * @module BlockHash/from
 * @since 0.0.1
 */

import { BlockHash } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Type alias for the branded BlockHash type.
 * @internal
 */
type BlockHashType = BlockHash.BlockHashType

/**
 * Error type for invalid hex format.
 * @internal
 */
type InvalidBlockHashFormatError = BlockHash.InvalidBlockHashFormatError

/**
 * Error type for invalid length.
 * @internal
 */
type InvalidBlockHashLengthError = BlockHash.InvalidBlockHashLengthError

/**
 * Creates a BlockHash from hex string or bytes.
 *
 * @description
 * Constructs a branded `BlockHashType` from either a hex string or raw bytes.
 * Validates that the input represents exactly 32 bytes (256 bits).
 *
 * This function never throws exceptions. Instead, it returns an Effect
 * that may fail with typed errors describing what went wrong.
 *
 * @param {string | Uint8Array} value - The block hash value.
 *   - As string: Must be 66 characters ('0x' + 64 hex chars)
 *   - As Uint8Array: Must be exactly 32 bytes
 *
 * @returns {Effect.Effect<BlockHashType, InvalidBlockHashFormatError | InvalidBlockHashLengthError>}
 *   Effect yielding `BlockHashType` on success, or failing with:
 *   - `InvalidBlockHashFormatError`: Invalid hex format
 *   - `InvalidBlockHashLengthError`: Wrong number of bytes (not 32)
 *
 * @throws {InvalidBlockHashFormatError} When hex string has invalid format.
 * @throws {InvalidBlockHashLengthError} When input is not exactly 32 bytes.
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BlockHash from 'voltaire-effect/primitives/BlockHash'
 *
 * // From hex string
 * const hash = await Effect.runPromise(BlockHash.from(
 *   '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3'
 * ))
 * ```
 *
 * @example
 * ```typescript
 * // From Uint8Array
 * const hashBytes = new Uint8Array(32)
 * const hash = await Effect.runPromise(BlockHash.from(hashBytes))
 * ```
 *
 * @example
 * ```typescript
 * // Handle errors
 * const hash = await Effect.runPromise(
 *   BlockHash.from(userInput).pipe(
 *     Effect.catchTags({
 *       InvalidBlockHashFormatError: () => Effect.fail(new Error('Bad format')),
 *       InvalidBlockHashLengthError: () => Effect.fail(new Error('Wrong length'))
 *     })
 *   )
 * )
 * ```
 *
 * @since 0.0.1
 * @see {@link toHex} for converting back to hex string
 * @see {@link BlockHashSchema} for schema-based validation
 */
export const from = (value: string | Uint8Array): Effect.Effect<BlockHashType, InvalidBlockHashFormatError | InvalidBlockHashLengthError> =>
  Effect.try({
    try: () => BlockHash.from(value),
    catch: (e) => e as InvalidBlockHashFormatError | InvalidBlockHashLengthError
  })
