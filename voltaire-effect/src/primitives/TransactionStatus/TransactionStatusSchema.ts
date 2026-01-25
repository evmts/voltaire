import { TransactionStatus } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Type representing the status of a transaction (pending, success, or failed).
 * @since 0.0.1
 */
export type TransactionStatusType = ReturnType<typeof TransactionStatus.pending>

/**
 * Internal schema declaration for TransactionStatus type validation.
 * @since 0.0.1
 */
const TransactionStatusTypeSchema = S.declare<TransactionStatusType>(
  (u): u is TransactionStatusType => {
    if (typeof u !== 'object' || u === null) return false
    return 'type' in u && (u.type === 'pending' || u.type === 'success' || u.type === 'failed')
  },
  { identifier: 'TransactionStatus' }
)

/**
 * Effect Schema for validating and transforming transaction status objects.
 * 
 * Transaction status can be 'pending', 'success', or 'failed'.
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { Schema as TransactionStatusSchema } from './TransactionStatusSchema.js'
 * 
 * const status = Schema.decodeSync(TransactionStatusSchema)({ type: 'success', gasUsed: 21000n })
 * ```
 * 
 * @since 0.0.1
 */
export const Schema = S.transformOrFail(
  S.Any,
  TransactionStatusTypeSchema,
  {
    strict: true,
    decode: (value, _options, ast) => {
      if (typeof value === 'object' && value !== null && 'type' in value) {
        const v = value as { type: string }
        if (v.type === 'pending' || v.type === 'success' || v.type === 'failed') {
          return ParseResult.succeed(value as TransactionStatusType)
        }
      }
      return ParseResult.fail(new ParseResult.Type(ast, value, `Expected TransactionStatus object`))
    },
    encode: (i) => ParseResult.succeed(i)
  }
).annotations({ identifier: 'TransactionStatusSchema' })
