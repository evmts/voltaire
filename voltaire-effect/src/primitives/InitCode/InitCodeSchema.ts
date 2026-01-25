import { from as voltaireFrom, type InitCodeType } from '@tevm/voltaire/InitCode'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Internal schema declaration for InitCode type validation.
 * @internal
 */
const InitCodeTypeSchema = S.declare<InitCodeType>(
  (u): u is InitCodeType => u instanceof Uint8Array,
  { identifier: 'InitCodeType' }
)

/**
 * Effect Schema for validating and parsing contract initialization code (init code).
 * Init code is the bytecode used to deploy a smart contract, typically consisting
 * of constructor logic followed by the runtime bytecode.
 *
 * @param input - A Uint8Array containing raw bytes or a hex string
 * @returns The validated InitCodeType
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/InitCode'
 *
 * // Parse from hex string
 * const initCode = S.decodeSync(Schema)('0x608060405234801561001057600080fd5b50')
 *
 * // Parse from Uint8Array
 * const bytes = new Uint8Array([0x60, 0x80, 0x60, 0x40])
 * const parsed = S.decodeSync(Schema)(bytes)
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<InitCodeType, Uint8Array | string> = S.transformOrFail(
  S.Union(S.Uint8ArrayFromSelf, S.String),
  InitCodeTypeSchema,
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
).annotations({ identifier: "InitCodeSchema" })
