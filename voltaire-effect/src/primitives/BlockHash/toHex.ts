/**
 * @fileoverview Hex conversion utility for BlockHash values.
 * Provides pure function for converting block hashes to hex strings.
 *
 * @module BlockHash/toHex
 * @since 0.0.1
 */

import { BlockHash } from '@tevm/voltaire'

/**
 * Type alias for the branded BlockHash type.
 * @internal
 */
type BlockHashType = BlockHash.BlockHashType

/**
 * Converts a BlockHash to hex string.
 *
 * @description
 * Transforms a 32-byte `BlockHashType` into its hexadecimal string representation.
 * This is a pure synchronous function that never throws or fails.
 *
 * The output format is:
 * - Prefixed with '0x'
 * - 64 lowercase hexadecimal characters
 * - Total length: 66 characters
 *
 * @param {BlockHashType} hash - The block hash to convert.
 *   Must be a valid 32-byte BlockHashType.
 *
 * @returns {string} 66-character hex string ('0x' + 64 hex chars).
 *
 * @example
 * ```typescript
 * import * as BlockHash from 'voltaire-effect/primitives/BlockHash'
 * import * as Effect from 'effect/Effect'
 *
 * const hash = await Effect.runPromise(BlockHash.from('0x...'))
 * const hex = BlockHash.toHex(hash)
 * console.log(hex) // '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3'
 * ```
 *
 * @example
 * ```typescript
 * // Use in Effect pipeline
 * const hexHash = await Effect.runPromise(
 *   BlockHash.from(input).pipe(
 *     Effect.map(BlockHash.toHex)
 *   )
 * )
 * ```
 *
 * @example
 * ```typescript
 * // Round-trip conversion
 * const original = '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3'
 * const hash = await Effect.runPromise(BlockHash.from(original))
 * const hex = BlockHash.toHex(hash)
 * console.log(original === hex) // true
 * ```
 *
 * @since 0.0.1
 * @see {@link from} for creating BlockHash from hex string
 */
export const toHex = (hash: BlockHashType): string => BlockHash.toHex(hash)
