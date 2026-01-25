import { GasEstimate as VoltaireGasEstimate } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing an estimated gas amount.
 * Used for gas estimation results before actual execution.
 * @since 0.0.1
 */
export type GasEstimateType = VoltaireGasEstimate.GasEstimateType

const GasEstimateTypeSchema = S.declare<GasEstimateType>(
  (u): u is GasEstimateType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'GasEstimate' }
)

/**
 * Effect Schema for validating gas estimate values.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { GasEstimateSchema } from 'voltaire-effect/primitives/GasEstimate'
 *
 * const estimate = S.decodeSync(GasEstimateSchema)(21000n)
 * ```
 * @since 0.0.1
 */
export const GasEstimateSchema: S.Schema<GasEstimateType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GasEstimateTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(VoltaireGasEstimate.GasEstimate.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (gasEstimate) => ParseResult.succeed(gasEstimate)
  }
).annotations({ identifier: 'GasEstimateSchema' })
