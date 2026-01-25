import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing Gwei (10^9 Wei, commonly used for gas prices).
 * @since 0.0.1
 */
export type GweiType = bigint & { readonly __tag: 'Gwei' }

const GweiTypeSchema = S.declare<GweiType>(
  (u): u is GweiType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'Gwei' }
)

/**
 * Effect Schema for validating Gwei values.
 * Accepts bigint, number, or string and returns branded GweiType.
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/Denomination'
 * import * as Schema from 'effect/Schema'
 *
 * const gwei = Schema.decodeSync(Denomination.GweiSchema)(30n) // 30 gwei
 * ```
 * @since 0.0.1
 */
export const GweiSchema: S.Schema<GweiType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GweiTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as GweiType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (gwei) => ParseResult.succeed(gwei)
  }
).annotations({ identifier: 'GweiSchema' })
