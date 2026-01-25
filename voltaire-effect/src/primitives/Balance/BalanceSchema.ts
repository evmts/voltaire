/**
 * @fileoverview Effect Schema definitions for Ethereum account balance validation.
 * Provides type-safe schemas for parsing and validating account balances in Wei.
 * @module Balance/BalanceSchema
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing an Ethereum account balance in Wei.
 *
 * @description
 * Balances are non-negative bigint values representing the amount of Wei
 * held by an account. 1 ETH = 10^18 Wei.
 *
 * @example
 * ```typescript
 * import type { BalanceType } from 'voltaire-effect/primitives/Balance'
 *
 * const balance: BalanceType = 1000000000000000000n as BalanceType // 1 ETH
 * ```
 *
 * @since 0.0.1
 */
export type BalanceType = bigint & { readonly __tag: 'Balance' }

/**
 * Internal schema declaration for validating BalanceType instances.
 * Ensures the value is a non-negative bigint.
 *
 * @internal
 */
const BalanceTypeSchema = S.declare<BalanceType>(
  (u): u is BalanceType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'Balance' }
)

/**
 * Effect Schema for validating and parsing Ethereum account balances.
 *
 * @description
 * Transforms bigint, number, or string inputs into branded BalanceType values.
 * Balances must be non-negative and represent Wei amounts.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { BalanceSchema } from 'voltaire-effect/primitives/Balance'
 *
 * // Parse from bigint (1 ETH in Wei)
 * const balance1 = S.decodeSync(BalanceSchema)(1000000000000000000n)
 *
 * // Parse from number
 * const balance2 = S.decodeSync(BalanceSchema)(1000000)
 *
 * // Parse from string
 * const balance3 = S.decodeSync(BalanceSchema)('1000000000000000000')
 *
 * // Encode back to bigint
 * const encoded = S.encodeSync(BalanceSchema)(balance1)
 * ```
 *
 * @throws ParseResult.Type - When the input is negative or cannot be converted
 * @see {@link from} for Effect-wrapped balance creation
 * @since 0.0.1
 */
export const BalanceSchema: S.Schema<BalanceType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  BalanceTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as BalanceType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (balance) => ParseResult.succeed(balance)
  }
).annotations({ identifier: 'BalanceSchema' })
