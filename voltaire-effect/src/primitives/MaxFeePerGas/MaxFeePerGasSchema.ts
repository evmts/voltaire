/**
 * @fileoverview Effect Schema definitions for MaxFeePerGas primitive type.
 * Provides validation for EIP-1559 maximum fee values.
 * @module MaxFeePerGas/MaxFeePerGasSchema
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing EIP-1559 max fee per gas in wei.
 *
 * @description
 * The maximum fee per gas the sender is willing to pay. This caps the
 * total cost per gas unit (baseFee + priorityFee). Setting this value
 * protects against base fee spikes between transaction creation and
 * inclusion.
 *
 * Best practice: Set maxFeePerGas = 2 × currentBaseFee + priorityFee
 * to survive one full block of maximum base fee increases.
 *
 * @example
 * ```typescript
 * import * as MaxFeePerGas from 'voltaire-effect/primitives/MaxFeePerGas'
 * import { Effect } from 'effect'
 *
 * // Set max fee as 2x current base fee + priority
 * const currentBaseFee = 20n // gwei
 * const priorityFee = 2n     // gwei
 * const maxFee = Effect.runSync(MaxFeePerGas.fromGwei(currentBaseFee * 2n + priorityFee))
 * // maxFee = 42 gwei in wei
 * ```
 *
 * @see {@link BaseFeePerGas} for current base fee
 * @see {@link MaxPriorityFeePerGas} for validator tip
 * @since 0.0.1
 */
export type MaxFeePerGasType = bigint & { readonly __tag: 'MaxFeePerGas' }

const MaxFeePerGasTypeSchema = S.declare<MaxFeePerGasType>(
  (u): u is MaxFeePerGasType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'MaxFeePerGas' }
)

/**
 * Effect Schema for validating max fee values in wei.
 *
 * @description
 * Validates and transforms input to a branded MaxFeePerGasType in wei.
 *
 * @param value - Max fee in wei as bigint, number, or string
 * @returns Branded MaxFeePerGasType value in wei
 *
 * @throws {ParseError} When input cannot be parsed
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { MaxFeePerGasSchema } from 'voltaire-effect/primitives/MaxFeePerGas'
 *
 * // From transaction parameters (wei)
 * const maxFee = S.decodeSync(MaxFeePerGasSchema)(50000000000n) // 50 gwei
 * ```
 *
 * @see {@link MaxFeePerGasFromGweiSchema} for gwei input
 * @since 0.0.1
 */
export const MaxFeePerGasSchema: S.Schema<MaxFeePerGasType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  MaxFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as MaxFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (maxFee) => ParseResult.succeed(maxFee)
  }
).annotations({ identifier: 'MaxFeePerGasSchema' })

const GWEI = 1_000_000_000n

/**
 * Effect Schema for validating max fee values from gwei.
 *
 * @description
 * Converts gwei input to wei representation. Preferred for user interfaces.
 *
 * @param value - Max fee in gwei as number or bigint
 * @returns Branded MaxFeePerGasType value in wei
 *
 * @throws {ParseError} When input cannot be parsed
 * @throws {ParseError} When input is negative
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { MaxFeePerGasFromGweiSchema } from 'voltaire-effect/primitives/MaxFeePerGas'
 *
 * // 50 gwei max fee
 * const maxFee = S.decodeSync(MaxFeePerGasFromGweiSchema)(50)
 * ```
 *
 * @see {@link MaxFeePerGasSchema} for wei input
 * @since 0.0.1
 */
export const MaxFeePerGasFromGweiSchema: S.Schema<MaxFeePerGasType, number | bigint> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf),
  MaxFeePerGasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        const gwei = typeof value === 'number' ? BigInt(value) : value
        if (gwei < 0n) {
          return ParseResult.fail(new ParseResult.Type(ast, value, 'MaxFeePerGas cannot be negative'))
        }
        return ParseResult.succeed((gwei * GWEI) as unknown as MaxFeePerGasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (maxFee) => ParseResult.succeed(maxFee / GWEI)
  }
).annotations({ identifier: 'MaxFeePerGasFromGweiSchema' })
