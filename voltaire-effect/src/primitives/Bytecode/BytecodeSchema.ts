import { Bytecode } from '@tevm/voltaire/Bytecode'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type for EVM bytecode as Uint8Array.
 * 
 * @since 0.0.1
 */
export type BytecodeType = ReturnType<typeof Bytecode.from>

const BytecodeTypeSchema = S.declare<BytecodeType>(
  (u): u is BytecodeType => u instanceof Uint8Array,
  { identifier: 'BytecodeType' }
)

/**
 * Effect Schema for validating and parsing EVM bytecode.
 * Accepts hex string or Uint8Array, decodes to BytecodeType.
 * 
 * @example
 * ```typescript
 * import { Schema } from 'voltaire-effect/primitives/Bytecode'
 * import * as S from 'effect/Schema'
 * 
 * const code = S.decodeSync(Schema)('0x6080604052...')
 * ```
 * 
 * @since 0.0.1
 */
export const Schema: S.Schema<BytecodeType, Uint8Array | string> = S.transformOrFail(
  S.Union(S.Uint8ArrayFromSelf, S.String),
  BytecodeTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Bytecode.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (b) => ParseResult.succeed(b as Uint8Array)
  }
).annotations({ identifier: "BytecodeSchema" })
