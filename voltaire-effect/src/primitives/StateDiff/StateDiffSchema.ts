/**
 * @fileoverview Effect Schema definitions for Ethereum state diffs.
 * Provides validation schemas for tracking state changes across transactions.
 * @module StateDiff/StateDiffSchema
 * @since 0.0.1
 */

import { StateDiff } from '@tevm/voltaire'
import * as S from 'effect/Schema'

/**
 * Type representing a complete state diff across multiple accounts.
 *
 * @description
 * A StateDiff captures all state changes that occurred during transaction
 * execution, organized by account address. It maps addresses to their
 * respective AccountDiff objects.
 *
 * @example
 * ```typescript
 * import { StateDiff } from 'voltaire-effect/primitives'
 *
 * // StateDiff maps addresses to their changes
 * const diff: StateDiffType = new Map([
 *   [addressBytes, { balance: { from: 100n, to: 200n } }]
 * ])
 * ```
 *
 * @since 0.0.1
 */
export type StateDiffType = StateDiff.StateDiffType

/**
 * Type representing changes to a single account.
 *
 * @description
 * An AccountDiff contains optional changes to the account's balance,
 * nonce, and code. Each field is only present if that aspect of the
 * account was modified.
 *
 * @example
 * ```typescript
 * const accountDiff: AccountDiff = {
 *   balance: { from: 100n, to: 200n },
 *   nonce: { from: 1n, to: 2n }
 *   // code is undefined - no code change
 * }
 * ```
 *
 * @since 0.0.1
 */
export type AccountDiff = StateDiff.AccountDiff

/**
 * Type representing a balance change (from/to values).
 *
 * @description
 * Tracks the before and after balance values for an account.
 * Either value can be null if the account was created or deleted.
 *
 * @example
 * ```typescript
 * // Balance increased
 * const increase: BalanceChange = { from: 100n, to: 200n }
 *
 * // Account created (no previous balance)
 * const created: BalanceChange = { from: null, to: 100n }
 *
 * // Account deleted (no remaining balance)
 * const deleted: BalanceChange = { from: 100n, to: null }
 * ```
 *
 * @since 0.0.1
 */
export type BalanceChange = StateDiff.BalanceChange

/**
 * Type representing a nonce change (from/to values).
 *
 * @description
 * Tracks the before and after nonce values for an account.
 * The nonce increments with each transaction sent by an EOA.
 *
 * @example
 * ```typescript
 * const change: NonceChange = { from: 5n, to: 6n }
 * ```
 *
 * @since 0.0.1
 */
export type NonceChange = StateDiff.NonceChange

/**
 * Type representing a code change (from/to bytecode).
 *
 * @description
 * Tracks changes to contract bytecode. This typically happens during
 * contract deployment (from: null) or self-destruct (to: null).
 *
 * @example
 * ```typescript
 * // Contract deployed
 * const deployed: CodeChange = {
 *   from: null,
 *   to: new Uint8Array([0x60, 0x80, 0x60, 0x40])
 * }
 * ```
 *
 * @since 0.0.1
 */
export type CodeChange = StateDiff.CodeChange

/**
 * Effect Schema for validating balance changes.
 * Tracks the before and after balance values.
 *
 * @description
 * Validates that balance change objects have the correct structure
 * with from/to fields that are either bigints or null.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { BalanceChangeSchema } from 'voltaire-effect/primitives/StateDiff'
 *
 * const validate = S.is(BalanceChangeSchema)
 * const isValid = validate({ from: 100n, to: 200n })
 * console.log(isValid) // true
 * ```
 *
 * @throws {ParseError} When the input doesn't match the expected structure
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
 * @description
 * Validates that nonce change objects have the correct structure
 * with from/to fields that are either bigints or null.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { NonceChangeSchema } from 'voltaire-effect/primitives/StateDiff'
 *
 * const validate = S.is(NonceChangeSchema)
 * const isValid = validate({ from: 1n, to: 2n })
 * console.log(isValid) // true
 * ```
 *
 * @throws {ParseError} When the input doesn't match the expected structure
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
 * @description
 * Validates that code change objects have the correct structure
 * with from/to fields that are either Uint8Arrays or null.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { CodeChangeSchema } from 'voltaire-effect/primitives/StateDiff'
 *
 * const validate = S.is(CodeChangeSchema)
 * const isValid = validate({
 *   from: null,
 *   to: new Uint8Array([0x60, 0x00])
 * })
 * console.log(isValid) // true
 * ```
 *
 * @throws {ParseError} When the input doesn't match the expected structure
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
 * @description
 * Validates the structure of an account diff. All fields are optional
 * since an account may only have some of its properties modified.
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
 * console.log(isValid) // true
 * ```
 *
 * @throws {ParseError} When the input doesn't match the expected structure
 *
 * @see {@link BalanceChangeSchema} for balance change validation
 * @see {@link NonceChangeSchema} for nonce change validation
 * @see {@link CodeChangeSchema} for code change validation
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
 * Alias for AccountDiffSchema for consistent API.
 *
 * @description
 * This is an alias export that provides a consistent naming pattern
 * across all primitive modules.
 *
 * @example
 * ```typescript
 * import { Schema } from 'voltaire-effect/primitives/StateDiff'
 * import * as S from 'effect/Schema'
 *
 * const parse = S.decodeSync(Schema)
 * const diff = parse({ balance: { from: 100n, to: 200n } })
 * ```
 *
 * @since 0.0.1
 */
export const Schema = AccountDiffSchema
