import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing a gas amount.
 * Ensures type safety when working with gas values in EVM operations.
 * @since 0.0.1
 */
export type GasType = bigint & { readonly __tag: 'Gas' }

const GasTypeSchema = S.declare<GasType>(
  (u): u is GasType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'Gas' }
)

/**
 * Effect Schema for validating and transforming gas values.
 * Accepts bigint, number, or string input.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { GasSchema } from 'voltaire-effect/primitives/Gas'
 *
 * const gas = S.decodeSync(GasSchema)(21000n)
 * ```
 * @since 0.0.1
 */
export const GasSchema: S.Schema<GasType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GasTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as GasType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (gas) => ParseResult.succeed(gas)
  }
).annotations({ identifier: 'GasSchema' })
