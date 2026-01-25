import { StateDiff } from '@tevm/voltaire'
import * as S from 'effect/Schema'

/**
 * Type representing a complete state diff across multiple accounts.
 *
 * @since 0.0.1
 */
export type StateDiffType = StateDiff.StateDiffType

/**
 * Type representing changes to a single account.
 *
 * @since 0.0.1
 */
export type AccountDiff = StateDiff.AccountDiff

/**
 * Type representing a balance change (from/to values).
 *
 * @since 0.0.1
 */
export type BalanceChange = StateDiff.BalanceChange

/**
 * Type representing a nonce change (from/to values).
 *
 * @since 0.0.1
 */
export type NonceChange = StateDiff.NonceChange

/**
 * Type representing a code change (from/to bytecode).
 *
 * @since 0.0.1
 */
export type CodeChange = StateDiff.CodeChange

/**
 * Effect Schema for validating balance changes.
 * Tracks the before and after balance values.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { BalanceChangeSchema } from 'voltaire-effect/primitives/StateDiff'
 *
 * const validate = S.is(BalanceChangeSchema)
 * const isValid = validate({ from: 100n, to: 200n })
 * ```
 *
 * @since 0.0.1
 */
export const BalanceChangeSchema = S.Struct({
  from: S.NullOr(S.BigIntFromSelf),
  to: S.NullOr(S.BigIntFromSelf),
}).annotations({ identifier: 'BalanceChange' })

/**
 * Effect Schema for validating nonce changes.
 * Tracks the before and after nonce values.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { NonceChangeSchema } from 'voltaire-effect/primitives/StateDiff'
 *
 * const validate = S.is(NonceChangeSchema)
 * const isValid = validate({ from: 1n, to: 2n })
 * ```
 *
 * @since 0.0.1
 */
export const NonceChangeSchema = S.Struct({
  from: S.NullOr(S.BigIntFromSelf),
  to: S.NullOr(S.BigIntFromSelf),
}).annotations({ identifier: 'NonceChange' })

/**
 * Effect Schema for validating code changes.
 * Tracks the before and after bytecode.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { CodeChangeSchema } from 'voltaire-effect/primitives/StateDiff'
 *
 * const validate = S.is(CodeChangeSchema)
 * const isValid = validate({ from: null, to: new Uint8Array([0x60, 0x00]) })
 * ```
 *
 * @since 0.0.1
 */
export const CodeChangeSchema = S.Struct({
  from: S.NullOr(S.Uint8ArrayFromSelf),
  to: S.NullOr(S.Uint8ArrayFromSelf),
}).annotations({ identifier: 'CodeChange' })

/**
 * Effect Schema for validating account diff structure.
 * Contains optional balance, nonce, and code changes.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { AccountDiffSchema } from 'voltaire-effect/primitives/StateDiff'
 *
 * const validate = S.is(AccountDiffSchema)
 * const isValid = validate({
 *   balance: { from: 100n, to: 200n },
 *   nonce: { from: 1n, to: 2n }
 * })
 * ```
 *
 * @since 0.0.1
 */
export const AccountDiffSchema = S.Struct({
  balance: S.optional(BalanceChangeSchema),
  nonce: S.optional(NonceChangeSchema),
  code: S.optional(CodeChangeSchema),
}).annotations({ identifier: 'AccountDiff' })

/**
 * Effect Schema for validating account diffs.
 * Alias for AccountDiffSchema.
 *
 * @since 0.0.1
 */
export const Schema = AccountDiffSchema
