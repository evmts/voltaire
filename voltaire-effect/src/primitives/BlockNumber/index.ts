/**
 * @fileoverview BlockNumber module for non-negative block numbers.
 * Provides Effect-based schemas and functions for block number handling.
 *
 * Block numbers are non-negative integers that identify blocks sequentially
 * in the Ethereum blockchain. They are used for:
 * - Referencing blocks in RPC calls (eth_getBlockByNumber)
 * - Tracking chain progress and synchronization
 * - Specifying block ranges for log queries
 * - Historical state access
 *
 * This module provides:
 * - Schema validation for block numbers
 * - Effect-based constructors with error handling
 * - Type-safe branded BlockNumberType
 *
 * @module BlockNumber
 * @since 0.0.1
 *
 * @example
 * ```typescript
 * import * as BlockNumber from 'voltaire-effect/primitives/BlockNumber'
 * import * as Effect from 'effect/Effect'
 *
 * // Create from number
 * const blockNum = await Effect.runPromise(BlockNumber.from(12345))
 *
 * // Create from bigint
 * const blockNumBig = await Effect.runPromise(BlockNumber.from(12345n))
 *
 * // Schema validation
 * import * as Schema from 'effect/Schema'
 * const validated = Schema.decodeSync(BlockNumber.Schema)(12345)
 * ```
 *
 * @see {@link BlockNumberSchema} for schema-based validation
 * @see {@link from} for Effect-based construction
 */

export { BlockNumberSchema, BlockNumberSchema as Schema } from './BlockNumberSchema.js'
export { from } from './from.js'
