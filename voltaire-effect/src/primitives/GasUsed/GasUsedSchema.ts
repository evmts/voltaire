import { GasUsed } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded bigint type representing gas consumed during execution.
 * @since 0.0.1
 */
export type GasUsedType = ReturnType<typeof GasUsed.from>

const GasUsedTypeSchema = S.declare<GasUsedType>(
  (u): u is GasUsedType => typeof u === 'bigint' && u >= 0n,
  { identifier: 'GasUsed' }
)

/**
 * Effect Schema for validating gas used values.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/GasUsed'
 *
 * const used = S.decodeSync(Schema)(21000n)
 * ```
 * @since 0.0.1
 */
export const Schema: S.Schema<GasUsedType, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  GasUsedTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(GasUsed.from(value))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (g) => ParseResult.succeed(g)
  }
).annotations({ identifier: 'GasUsedSchema' })
