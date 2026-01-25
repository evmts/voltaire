import { from as voltaireFrom, type ContractCodeType } from '@tevm/voltaire/ContractCode'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

const ContractCodeTypeSchema = S.declare<ContractCodeType>(
  (u): u is ContractCodeType => u instanceof Uint8Array,
  { identifier: 'ContractCodeType' }
)

/**
 * Effect Schema for validating contract bytecode.
 * Accepts hex strings or Uint8Array and returns branded ContractCodeType.
 *
 * @example
 * ```typescript
 * import * as ContractCode from 'voltaire-effect/ContractCode'
 * import * as Schema from 'effect/Schema'
 *
 * const code = Schema.decodeSync(ContractCode.Schema)('0x608060405234801561001057600080fd5b50...')
 * ```
 * @since 0.0.1
 */
export const Schema: S.Schema<ContractCodeType, Uint8Array | string> = S.transformOrFail(
  S.Union(S.Uint8ArrayFromSelf, S.String),
  ContractCodeTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(voltaireFrom(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (b) => ParseResult.succeed(b as Uint8Array)
  }
).annotations({ identifier: "ContractCodeSchema" })
