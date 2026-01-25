/**
 * @fileoverview Effect Schema definitions for EffectiveGasPrice primitive type.
 * Provides validation for calculated effective gas prices in EIP-1559 transactions.
 * @module EffectiveGasPrice/EffectiveGasPriceSchema
 * @since 0.0.1
 */

import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Gas } from '@tevm/voltaire'

/**
 * Branded type representing effective gas price (EIP-1559).
 *
 * @description
 * The effective gas price is what's actually paid per gas unit. It's the
 * minimum of (baseFee + priorityFee) and maxFeePerGas. This value appears
 * in transaction receipts and determines the actual cost.
 *
 * Formula: effectiveGasPrice = min(baseFee + priorityFee, maxFeePerGas)
 *
 * The difference between effectiveGasPrice and baseFee goes to the validator.
 *
 * @example
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/primitives/EffectiveGasPrice'
 * import { Effect } from 'effect'
 *
 * // Calculate effective price from EIP-1559 parameters
 * const baseFee = 20n * 10n**9n        // 20 gwei
 * const priorityFee = 2n * 10n**9n     // 2 gwei
 * const maxFee = 30n * 10n**9n         // 30 gwei
 *
 * const effective = Effect.runSync(
 *   EffectiveGasPrice.calculate(baseFee, priorityFee, maxFee)
 * )
 * // effective = 22 gwei (baseFee + priorityFee < maxFee)
 * ```
 *
 * @see {@link calculate} for computing from EIP-1559 params
 * @see {@link GasUsed} to calculate total fee
 * @since 0.0.1
 */
export type EffectiveGasPriceType = bigint & { readonly __tag: 'EffectiveGasPrice' }

const EffectiveGasPriceTypeSchema = S.declare<EffectiveGasPriceType>(
  (u): u is EffectiveGasPriceType => typeof u === 'bigint',
  { identifier: 'EffectiveGasPrice' }
)

/**
 * Effect Schema for validating effective gas prices.
 *
 * @description
 * Validates and transforms input to a branded EffectiveGasPriceType.
 * Use when parsing effective gas prices from transaction receipts.
 *
 * @param value - Effective gas price in wei as bigint, number, or string
 * @returns Branded EffectiveGasPriceType value in wei
 *
 * @throws {ParseError} When input cannot be parsed
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { EffectiveGasPriceSchema } from 'voltaire-effect/primitives/EffectiveGasPrice'
 *
 * // From transaction receipt
 * const effectivePrice = S.decodeSync(EffectiveGasPriceSchema)(22000000000n)
 * ```
 *
 * @see {@link calculate} to compute from EIP-1559 parameters
 * @since 0.0.1
 */
export const EffectiveGasPriceSchema: S.Schema<EffectiveGasPriceType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  EffectiveGasPriceTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(BigInt(value) as EffectiveGasPriceType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (price) => ParseResult.succeed(price as bigint)
  }
).annotations({ identifier: 'EffectiveGasPriceSchema' })
