import { FilterId } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Branded type representing an Ethereum JSON-RPC filter identifier.
 * Used for tracking event logs, pending transactions, and block filters.
 * @since 0.0.1
 */
export type FilterIdType = ReturnType<typeof FilterId.from>

const FilterIdTypeSchema = S.declare<FilterIdType>(
  (u): u is FilterIdType => {
    if (typeof u !== 'string') return false
    try {
      FilterId.from(u)
      return true
    } catch {
      return false
    }
  },
  { identifier: 'FilterId' }
)

/**
 * Effect Schema for validating and transforming filter IDs.
 * @example
 * ```ts
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/FilterId'
 *
 * const filterId = S.decodeSync(Schema)('0x1')
 * ```
 * @since 0.0.1
 */
export const Schema: S.Schema<FilterIdType, string> = S.transformOrFail(
  S.String,
  FilterIdTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(FilterId.from(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (f) => ParseResult.succeed(f as string)
  }
).annotations({ identifier: 'FilterIdSchema' })
