import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing Ether (10^18 Wei).
 * @since 0.0.1
 */
export type EtherType = bigint & { readonly __tag: 'Ether' }

const EtherTypeSchema = S.declare<EtherType>(
  (u): u is EtherType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'Ether' }
)

/**
 * Effect Schema for validating Ether values.
 * Accepts bigint, number, or string and returns branded EtherType.
 *
 * @example
 * ```typescript
 * import * as Denomination from 'voltaire-effect/Denomination'
 * import * as Schema from 'effect/Schema'
 *
 * const eth = Schema.decodeSync(Denomination.EtherSchema)(1n) // 1 ETH
 * ```
 * @since 0.0.1
 */
export const EtherSchema: S.Schema<EtherType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  EtherTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as EtherType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (ether) => ParseResult.succeed(ether)
  }
).annotations({ identifier: 'EtherSchema' })
