/**
 * @fileoverview ChainId module for working with Ethereum network identifiers.
 * Provides Effect-based operations for creating and validating chain IDs.
 *
 * @description
 * Chain IDs uniquely identify Ethereum networks and are defined in EIP-155.
 * They are used to prevent replay attacks by ensuring transactions are
 * only valid on the intended network.
 *
 * Common chain IDs:
 * - 1: Ethereum Mainnet
 * - 11155111: Sepolia Testnet
 * - 17000: Holesky Testnet
 * - 137: Polygon
 * - 42161: Arbitrum One
 * - 10: Optimism
 *
 * @example
 * ```typescript
 * import * as ChainId from 'voltaire-effect/primitives/ChainId'
 * import * as Effect from 'effect/Effect'
 *
 * // Create chain IDs
 * const mainnet = Effect.runSync(ChainId.from(1))
 * const sepolia = Effect.runSync(ChainId.from(11155111))
 *
 * // Using Schema for validation
 * import * as S from 'effect/Schema'
 * const parsed = S.decodeSync(ChainId.ChainIdSchema)(137)
 * ```
 *
 * @module ChainId
 * @since 0.0.1
 * @see {@link ChainIdSchema} for schema-based validation
 * @see {@link from} for Effect-wrapped creation
 */
export { ChainIdSchema, ChainIdSchema as Schema, type ChainIdType } from './ChainIdSchema.js'
export { from, InvalidChainIdError } from './from.js'
