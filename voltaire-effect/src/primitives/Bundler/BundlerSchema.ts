import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Address } from '@tevm/voltaire'

export type BundlerType = Uint8Array & { readonly __tag: 'Bundler' }

const BundlerTypeSchema = S.declare<BundlerType>(
  (u): u is BundlerType => u instanceof Uint8Array && u.length === 20,
  { identifier: 'Bundler' }
)

export const BundlerSchema: S.Schema<BundlerType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  BundlerTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        if (typeof value === 'string') {
          return ParseResult.succeed(Address(value) as unknown as BundlerType)
        }
        if (value.length !== 20) {
          throw new Error('Bundler address must be exactly 20 bytes')
        }
        return ParseResult.succeed(value as unknown as BundlerType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (bundler) => ParseResult.succeed(Address.toHex(bundler as any))
  }
).annotations({ identifier: 'BundlerSchema' })
