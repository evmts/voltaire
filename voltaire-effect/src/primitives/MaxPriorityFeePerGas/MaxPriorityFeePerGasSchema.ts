/**
 * @fileoverview Effect Schema definitions for MaxPriorityFeePerGas primitive type.
 * Provides validation for EIP-1559 priority fee (tip) values.
 * @module MaxPriorityFeePerGas/MaxPriorityFeePerGasSchema
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing EIP-1559 max priority fee per gas in wei.
 *
 * @description
 * The priority fee (tip) is paid to validators to incentivize transaction
 * inclusion. Higher tips during congestion lead to faster inclusion.
 *
 * Typical values:
 * - Low priority: 1-2 gwei
 * - Medium priority: 2-3 gwei
 * - High priority: 5+ gwei
 *
 * @example
 * ```typescript
 * import * as MaxPriorityFeePerGas from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 * import { Effect } from 'effect'
 *
 * // Standard 2 gwei tip
 * const tip = Effect.runSync(MaxPriorityFeePerGas.fromGwei(2))
 *
 * // Higher tip for urgent transaction
 * const urgentTip = Effect.runSync(MaxPriorityFeePerGas.fromGwei(10))
 * ```
 *
 * @see {@link BaseFeePerGas} for protocol base fee
 * @see {@link MaxFeePerGas} for total fee cap
 * @since 0.0.1
 */
export type MaxPriorityFeePerGasType = bigint & { readonly __tag: 'MaxPriorityFeePerGas' }

const MaxPriorityFeePerGasTypeSchema = S.declare<MaxPriorityFeePerGasType>(
  (u): u is MaxPriorityFeePerGasType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'MaxPriorityFeePerGas' }
)

/**
 * Effect Schema for validating priority fee values in wei.
 *
 * @description
 * Validates and transforms input to a branded MaxPriorityFeePerGasType in wei.
 *
 * @param value - Priority fee in wei as bigint, number, or string
 * @returns Branded MaxPriorityFeePerGasType value in wei
 *
 * @throws {ParseError} When input cannot be parsed
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { MaxPriorityFeePerGasSchema } from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 *
 * // 2 gwei in wei
 * const tip = S.decodeSync(MaxPriorityFeePerGasSchema)(2000000000n)
 * ```
 *
 * @see {@link MaxPriorityFeePerGasFromGweiSchema} for gwei input
 * @since 0.0.1
 */
export const MaxPriorityFeePerGasSchema: S.Schema<MaxPriorityFeePerGasType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  MaxPriorityFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as MaxPriorityFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (maxPriorityFee) => ParseResult.succeed(maxPriorityFee)
  }
).annotations({ identifier: 'MaxPriorityFeePerGasSchema' })

const GWEI = 1_000_000_000n

/**
 * Effect Schema for validating priority fee values from gwei.
 *
 * @description
 * Converts gwei input to wei. Preferred for user interfaces.
 *
 * @param value - Priority fee in gwei as number or bigint
 * @returns Branded MaxPriorityFeePerGasType value in wei
 *
 * @throws {ParseError} When input cannot be parsed
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { MaxPriorityFeePerGasFromGweiSchema } from 'voltaire-effect/primitives/MaxPriorityFeePerGas'
 *
 * // 2 gwei tip
 * const tip = S.decodeSync(MaxPriorityFeePerGasFromGweiSchema)(2)
 * ```
 *
 * @see {@link MaxPriorityFeePerGasSchema} for wei input
 * @since 0.0.1
 */
export const MaxPriorityFeePerGasFromGweiSchema: S.Schema<MaxPriorityFeePerGasType, number | bigint> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf),
  MaxPriorityFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        const gwei = typeof value === 'number' ? BigInt(value) : value
        if (gwei < 0n) {
          return ParseResult.fail(new ParseResult.Type(ast, value, 'MaxPriorityFeePerGas cannot be negative'))
        }
        return ParseResult.succeed((gwei * GWEI) as unknown as MaxPriorityFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (maxPriorityFee) => ParseResult.succeed(maxPriorityFee / GWEI)
  }
).annotations({ identifier: 'MaxPriorityFeePerGasFromGweiSchema' })
