/**
 * @fileoverview Balance module for working with Ethereum account balances in Effect.
 * Provides Effect-based operations for creating and validating account balances in Wei.
 *
 * @description
 * This module provides both Effect-wrapped constructors and Effect Schemas for
 * working with Ethereum account balances. Balances are represented in Wei
 * (the smallest unit of Ether, where 1 ETH = 10^18 Wei).
 *
 * @example
 * ```typescript
 * import * as Balance from 'voltaire-effect/primitives/Balance'
 * import * as Effect from 'effect/Effect'
 * import * as S from 'effect/Schema'
 *
 * // Using Effect-wrapped constructor
 * const balance = Effect.runSync(Balance.from(1000000000000000000n)) // 1 ETH
 *
 * // Using Schema for validation
 * const parsed = S.decodeSync(Balance.BalanceSchema)('1000000000000000000')
 * ```
 *
 * @module Balance
 * @since 0.0.1
 * @see {@link BalanceSchema} for schema-based validation
 * @see {@link from} for Effect-wrapped creation
 */
export { BalanceSchema, type BalanceType } from './BalanceSchema.js'
export { from } from './from.js'
