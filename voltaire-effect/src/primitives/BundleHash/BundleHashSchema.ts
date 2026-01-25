import { Bytes32, type Bytes32Type } from '@tevm/voltaire/Bytes'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

export type BundleHashType = Bytes32Type & { readonly __tag: 'BundleHash' }

const BundleHashTypeSchema = S.declare<BundleHashType>(
  (u): u is BundleHashType => {
    if (!(u instanceof Uint8Array)) return false
    return u.length === 32
  },
  { identifier: 'BundleHash' }
)

export const BundleHashSchema: S.Schema<BundleHashType, string | Uint8Array | bigint | number> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf, S.BigIntFromSelf, S.Number),
  BundleHashTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Bytes32.Bytes32(s as string | Uint8Array | bigint | number) as BundleHashType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (b) => ParseResult.succeed(b)
  }
).annotations({ identifier: 'BundleHashSchema' })
