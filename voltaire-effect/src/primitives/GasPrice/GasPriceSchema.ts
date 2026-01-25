import { Gas } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing a gas price in wei.
 * @since 0.0.1
 */
export type GasPriceType = Gas.GasPriceType

const GasPriceTypeSchema = S.declare<GasPriceType>(
  (u): u is GasPriceType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'GasPrice' }
)

/**
 * Effect Schema for validating gas price values in wei.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { GasPriceSchema } from 'voltaire-effect/primitives/GasPrice'
 *
 * const price = S.decodeSync(GasPriceSchema)(1000000000n) // 1 gwei
 * ```
 * @since 0.0.1
 */
export const GasPriceSchema: S.Schema<GasPriceType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GasPriceTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Gas.GasPrice.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (gasPrice) => ParseResult.succeed(gasPrice)
  }
).annotations({ identifier: 'GasPriceSchema' })

/**
 * Effect Schema for validating gas price values from gwei.
 * Converts gwei input to wei representation.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { GasPriceFromGweiSchema } from 'voltaire-effect/primitives/GasPrice'
 *
 * const price = S.decodeSync(GasPriceFromGweiSchema)(20) // 20 gwei -> wei
 * ```
 * @since 0.0.1
 */
export const GasPriceFromGweiSchema: S.Schema<GasPriceType, number | bigint> = S.transformOrFail(
  S.Union(S.Number, S.BigIntFromSelf),
  GasPriceTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Gas.GasPrice.fromGwei(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (gasPrice) => ParseResult.succeed(Gas.GasPrice.toGwei(gasPrice))
  }
).annotations({ identifier: 'GasPriceFromGweiSchema' })
