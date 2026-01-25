/**
 * @module StateDiff
 *
 * Effect-based module for working with Ethereum state diffs.
 * State diffs track changes to account balances, nonces, and code.
 *
 * @example
 * ```typescript
 * import { StateDiff } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const diff = yield* StateDiff.from(new Map([...]))
 *   const addresses = StateDiff.getAddresses(diff)
 *   return addresses
 * })
 * ```
 *
 * @since 0.0.1
 */
export { Schema, AccountDiffSchema, BalanceChangeSchema, NonceChangeSchema, CodeChangeSchema, type StateDiffType, type AccountDiff, type BalanceChange, type NonceChange, type CodeChange } from './StateDiffSchema.js'
export { from, getAccount, getAddresses, isEmpty, StateDiffError } from './from.js'
