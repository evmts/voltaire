import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Gas } from '@tevm/voltaire'

/**
 * Branded type representing effective gas price (EIP-1559).
 * The actual price paid per gas unit after base fee and priority fee calculation.
 * @since 0.0.1
 */
export type EffectiveGasPriceType = bigint & { readonly __tag: 'EffectiveGasPrice' }

const EffectiveGasPriceTypeSchema = S.declare<EffectiveGasPriceType>(
  (u): u is EffectiveGasPriceType => typeof u === 'bigint',
  { identifier: 'EffectiveGasPrice' }
)

/**
 * Effect Schema for validating effective gas prices.
 * Accepts bigint, number, or string and returns branded EffectiveGasPriceType.
 *
 * @example
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/EffectiveGasPrice'
 * import * as Schema from 'effect/Schema'
 *
 * const price = Schema.decodeSync(EffectiveGasPrice.EffectiveGasPriceSchema)(30000000000n)
 * ```
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
