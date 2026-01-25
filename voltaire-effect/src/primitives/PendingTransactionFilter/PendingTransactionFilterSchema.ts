import { PendingTransactionFilter, FilterId } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing a pending transaction filter subscription.
 * @since 0.0.1
 */
export type PendingTransactionFilterType = PendingTransactionFilter.PendingTransactionFilterType

const PendingTransactionFilterTypeSchema = S.declare<PendingTransactionFilterType>(
  (u): u is PendingTransactionFilterType => {
    if (typeof u !== 'object' || u === null) return false
    const obj = u as Record<string, unknown>
    return obj.type === 'pendingTransaction' && typeof obj.filterId === 'string'
  },
  { identifier: 'PendingTransactionFilter' }
)

/**
 * Effect Schema for validating and transforming pending transaction filters.
 *
 * Creates a filter for receiving notifications of pending transactions.
 * Used with eth_newPendingTransactionFilter and eth_getFilterChanges.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/PendingTransactionFilter'
 *
 * const filter = S.decodeSync(Schema)('0x1')
 * console.log(filter.type) // 'pendingTransaction'
 * console.log(filter.filterId) // '0x1'
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<PendingTransactionFilterType, string> = S.transformOrFail(
  S.String,
  PendingTransactionFilterTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        const filterId = FilterId.from(s)
        return ParseResult.succeed(PendingTransactionFilter.from(filterId))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (f) => ParseResult.succeed(f.filterId as string)
  }
).annotations({ identifier: 'PendingTransactionFilterSchema' })
