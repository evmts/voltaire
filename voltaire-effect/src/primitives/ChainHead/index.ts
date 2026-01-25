/**
 * @fileoverview ChainHead module for working with blockchain head information.
 * Provides Effect-based operations for creating and validating chain head data.
 *
 * @description
 * This module provides tools for working with blockchain head information,
 * which represents the latest block in a chain. Chain heads are essential for:
 * - Tracking blockchain progress
 * - Determining confirmation depth
 * - Syncing with the network
 * - Validating new blocks
 *
 * @example
 * ```typescript
 * import * as ChainHead from 'voltaire-effect/primitives/ChainHead'
 * import * as Effect from 'effect/Effect'
 *
 * // Create a chain head from block data
 * const head = Effect.runSync(ChainHead.from({
 *   number: 19000000n,
 *   hash: '0xabc123...',
 *   timestamp: 1700000000n
 * }))
 *
 * // Using Schema for validation
 * import * as S from 'effect/Schema'
 * const parsed = S.decodeSync(ChainHead.ChainHeadSchema)({
 *   number: 19000000n,
 *   hash: '0x...',
 *   timestamp: 1700000000n
 * })
 * ```
 *
 * @module ChainHead
 * @since 0.0.1
 * @see {@link ChainHeadSchema} for schema-based validation
 * @see {@link from} for Effect-wrapped creation
 */
export { ChainHeadSchema, type ChainHeadType, type ChainHeadInput } from './ChainHeadSchema.js'
export { from, ChainHeadError } from './from.js'
