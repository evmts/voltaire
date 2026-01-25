/**
 * @fileoverview Block module for complete Ethereum blocks.
 * Provides Effect-based schema for block validation and type-safe handling.
 *
 * An Ethereum block contains:
 * - Block header with metadata (number, timestamp, parent hash, etc.)
 * - Block body with transactions and uncles
 * - Block hash (computed from header)
 * - Size in bytes
 *
 * This module provides schema-based validation for blocks received from
 * RPC responses or other sources.
 *
 * @module Block
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as Block from 'voltaire-effect/primitives/Block'
 * import * as Schema from 'effect/Schema'
 *
 * // Validate a block from RPC response
 * const validated = Schema.decodeSync(Block.Schema)(blockData)
 * console.log(validated.header.number)  // Block number
 * console.log(validated.hash)           // Block hash
 * ```
 *
 * @example
 * ```typescript
 * // Use with Effect for error handling
 * import * as Effect from 'effect/Effect'
 *
 * const block = await Effect.runPromise(
 *   Schema.decodeUnknown(Block.BlockSchema)(rpcResponse).pipe(
 *     Effect.catchAll((e) => Effect.fail(new Error('Invalid block')))
 *   )
 * )
 * ```
 *
 * @see {@link BlockSchema} for the validation schema
 */

export { BlockSchema, BlockSchema as Schema } from './BlockSchema.js'
