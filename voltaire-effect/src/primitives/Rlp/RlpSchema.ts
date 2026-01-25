import { Rlp as VoltaireRlp, type BrandedRlp, RlpDecodingError, RlpEncodingError } from '@tevm/voltaire/Rlp'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

const RlpTypeSchema = S.declare<BrandedRlp>(
  (u): u is BrandedRlp => VoltaireRlp.isData(u),
  { identifier: 'BrandedRlp' }
)

/**
 * Effect Schema for validating and transforming RLP-encoded data.
 *
 * Validates data as proper RLP (Recursive Length Prefix) encoded bytes.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/Rlp'
 *
 * const rlp = S.decodeSync(Schema)(rlpBytes)
 * ```
 *
 * @since 0.0.1
 */
export const Schema = S.transformOrFail(
  S.Union(S.Uint8ArrayFromSelf, S.Unknown),
  RlpTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(VoltaireRlp(s as Uint8Array | BrandedRlp | BrandedRlp[]))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (r) => ParseResult.succeed(r as unknown)
  }
).annotations({ identifier: 'RlpSchema' })

export { RlpDecodingError, RlpEncodingError }
