import { RuntimeCode } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing deployed contract runtime bytecode.
 * @since 0.0.1
 */
export type RuntimeCodeType = RuntimeCode.RuntimeCodeType

const RuntimeCodeTypeSchema = S.declare<RuntimeCodeType>(
  (u): u is RuntimeCodeType => u instanceof Uint8Array,
  { identifier: 'RuntimeCode' }
)

/**
 * Effect Schema for validating and transforming runtime code.
 *
 * Transforms hex strings or byte arrays into validated RuntimeCodeType.
 * Runtime code is the bytecode stored at a contract address after deployment.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/RuntimeCode'
 *
 * const code = S.decodeSync(Schema)('0x6080604052...')
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<RuntimeCodeType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  RuntimeCodeTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(RuntimeCode.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (rc) => ParseResult.succeed(RuntimeCode.toHex(rc))
  }
).annotations({ identifier: 'RuntimeCodeSchema' })
