import { GasRefund } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing gas refund amounts.
 * Refunds are accumulated during EVM execution for storage clearing.
 * @since 0.0.1
 */
export type GasRefundType = ReturnType<typeof GasRefund.from>

const GasRefundTypeSchema = S.declare<GasRefundType>(
  (u): u is GasRefundType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'GasRefund' }
)

/**
 * Effect Schema for validating gas refund values.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/GasRefund'
 *
 * const refund = S.decodeSync(Schema)(15000n)
 * ```
 * @since 0.0.1
 */
export const Schema: S.Schema<GasRefundType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GasRefundTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(GasRefund.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (g) => ParseResult.succeed(g)
  }
).annotations({ identifier: 'GasRefundSchema' })
