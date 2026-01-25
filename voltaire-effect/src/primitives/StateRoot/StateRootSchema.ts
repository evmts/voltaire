import { Bytes32, type Bytes32Type } from '@tevm/voltaire/Bytes'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

export type StateRootType = Bytes32Type & { readonly __tag: 'StateRoot' }

const StateRootTypeSchema = S.declare<StateRootType>(
  (u): u is StateRootType => {
    if (!(u instanceof Uint8Array)) return false
    return u.length === 32
  },
  { identifier: 'StateRoot' }
)

export const StateRootSchema: S.Schema<StateRootType, string | Uint8Array | bigint | number> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf, S.BigIntFromSelf, S.Number),
  StateRootTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Bytes32.Bytes32(s as string | Uint8Array | bigint | number) as StateRootType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (b) => ParseResult.succeed(b)
  }
).annotations({ identifier: 'StateRootSchema' })
