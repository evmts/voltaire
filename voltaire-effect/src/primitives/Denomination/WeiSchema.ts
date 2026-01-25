import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing Wei (smallest Ether unit, 10^-18 ETH).
 * @since 0.0.1
 */
export type WeiType = bigint & { readonly __tag: 'Wei' }

const WeiTypeSchema = S.declare<WeiType>(
  (u): u is WeiType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'Wei' }
)

/**
 * Effect Schema for validating Wei values.
 * Accepts bigint, number, or string and returns branded WeiType.
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/Denomination'
 * import * as Schema from 'effect/Schema'
 *
 * const wei = Schema.decodeSync(Denomination.WeiSchema)(1000000000000000000n)
 * ```
 * @since 0.0.1
 */
export const WeiSchema: S.Schema<WeiType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  WeiTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as WeiType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (wei) => ParseResult.succeed(wei)
  }
).annotations({ identifier: 'WeiSchema' })
