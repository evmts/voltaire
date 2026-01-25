import { Uint } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

export type BalanceType = bigint & { readonly __tag: 'Balance' }

const BalanceTypeSchema = S.declare<BalanceType>(
  (u): u is BalanceType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'Balance' }
)

export const BalanceSchema: S.Schema<BalanceType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  BalanceTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(Uint.from(value) as unknown as BalanceType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (balance) => ParseResult.succeed(balance)
  }
).annotations({ identifier: 'BalanceSchema' })
