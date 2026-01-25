import { RevertReason } from '@tevm/voltaire'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

/**
 * Union type representing all revert reason variants.
 * @since 0.0.1
 */
export type RevertReasonType = RevertReason.RevertReasonType

/**
 * Standard Error(string) revert reason.
 * @since 0.0.1
 */
export type ErrorRevertReason = RevertReason.ErrorRevertReason

/**
 * Panic(uint256) revert with panic code.
 * @since 0.0.1
 */
export type PanicRevertReason = RevertReason.PanicRevertReason

/**
 * Custom error revert with selector and data.
 * @since 0.0.1
 */
export type CustomRevertReason = RevertReason.CustomRevertReason

/**
 * Unknown revert with raw data.
 * @since 0.0.1
 */
export type UnknownRevertReason = RevertReason.UnknownRevertReason

const ErrorRevertSchema = S.Struct({
  type: S.Literal('Error'),
  message: S.String,
})

const PanicRevertSchema = S.Struct({
  type: S.Literal('Panic'),
  code: S.Number,
  description: S.String,
})

const CustomRevertSchema = S.Struct({
  type: S.Literal('Custom'),
  selector: S.String,
  data: S.Uint8ArrayFromSelf,
})

const UnknownRevertSchema = S.Struct({
  type: S.Literal('Unknown'),
  data: S.Uint8ArrayFromSelf,
})

/**
 * Effect Schema for RevertReasonType union validation.
 *
 * Validates one of: Error, Panic, Custom, or Unknown revert types.
 *
 * @since 0.0.1
 */
export const RevertReasonTypeSchema = S.Union(
  ErrorRevertSchema,
  PanicRevertSchema,
  CustomRevertSchema,
  UnknownRevertSchema
).annotations({ identifier: 'RevertReasonType' })

/**
 * Effect Schema for parsing revert reasons from raw data.
 *
 * Parses revert data into typed revert reasons (Error, Panic, Custom, Unknown).
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Schema } from 'voltaire-effect/primitives/RevertReason'
 *
 * const reason = S.decodeSync(Schema)('0x08c379a0...')
 * if (reason.type === 'Error') {
 *   console.log(reason.message) // 'Insufficient balance'
 * }
 * ```
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<RevertReasonType, string | Uint8Array> = S.transformOrFail(
  S.Union(S.String, S.Uint8ArrayFromSelf),
  RevertReasonTypeSchema as S.Schema<RevertReasonType, RevertReasonType>,
  {
    strict: true,
    decode: (value, _options, ast) => {
      try {
        return ParseResult.succeed(RevertReason.from(value as string | Uint8Array))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, value, (e as Error).message))
      }
    },
    encode: (rr) => ParseResult.succeed(RevertReason.toString(rr))
  }
).annotations({ identifier: 'RevertReasonSchema' })
