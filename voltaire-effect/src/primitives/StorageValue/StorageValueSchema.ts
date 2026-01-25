import { Bytes32, type Bytes32Type } from '@tevm/voltaire/Bytes'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

export type StorageValueType = Bytes32Type & { readonly __tag: 'StorageValue' }

const StorageValueTypeSchema = S.declare<StorageValueType>(
  (u): u is StorageValueType => {
    if (!(u instanceof Uint8Array)) return false
    return u.length === 32
  },
  { identifier: 'StorageValue' }
)

export const StorageValueSchema: S.Schema<StorageValueType, string | Uint8Array | bigint | number> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf, S.BigIntFromSelf, S.Number),
  StorageValueTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Bytes32.Bytes32(s as string | Uint8Array | bigint | number) as StorageValueType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (b) => ParseResult.succeed(b)
  }
).annotations({ identifier: 'StorageValueSchema' })
