import { MultiTokenId } from '@tevm/voltaire'
type MultiTokenIdType = MultiTokenId.MultiTokenIdType
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

const MultiTokenIdTypeSchema = S.declare<MultiTokenIdType>(
  (u): u is MultiTokenIdType => typeof u === 'bigint' && u >= 0n && u < 2n ** 256n,
  { identifier: 'MultiTokenId' }
)

export const Schema: S.Schema<MultiTokenIdType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  MultiTokenIdTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(MultiTokenId.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (tokenId) => ParseResult.succeed(MultiTokenId.toBigInt(tokenId))
  }
).annotations({ identifier: 'MultiTokenIdSchema' })

export const FromHexSchema: S.Schema<MultiTokenIdType, string> = S.transformOrFail(
  S.String,
  MultiTokenIdTypeSchema,
  {
    strict: true,
    decode: (hex, _options, ast) => {
      try {
        return ParseResult.succeed(MultiTokenId.from(hex))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, hex, (e as Error).message))
      }
    },
    encode: (tokenId) => ParseResult.succeed(MultiTokenId.toHex(tokenId))
  }
).annotations({ identifier: 'MultiTokenIdFromHexSchema' })

export type { MultiTokenIdType }
