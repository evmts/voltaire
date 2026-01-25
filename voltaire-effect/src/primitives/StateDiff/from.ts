import { StateDiff, Address } from '@tevm/voltaire'
import type { StateDiffType, AccountDiff } from './StateDiffSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when state diff operations fail.
 *
 * @example
 * ```typescript
 * import { StateDiff } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * Effect.runPromise(StateDiff.from([])).catch(e => {
 *   if (e._tag === 'StateDiffError') {
 *     console.error('StateDiff error:', e.message)
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export class StateDiffError {
  readonly _tag = 'StateDiffError'
  constructor(readonly message: string) {}
}

type AddressType = ReturnType<typeof Address>

/**
 * Creates a StateDiff from various input formats.
 *
 * @param {Map<AddressType, AccountDiff> | Array<[AddressType, AccountDiff]> | { accounts: Map<AddressType, AccountDiff> }} value - The state diff data
 * @returns {Effect.Effect<StateDiffType, StateDiffError>} Effect containing the StateDiff or an error
 *
 * @example
 * ```typescript
 * import { StateDiff, Address } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const diff = yield* StateDiff.from(new Map([
 *     [Address('0x...'), { balance: { from: 100n, to: 200n } }]
 *   ]))
 *   return diff
 * })
 * ```
 *
 * @since 0.0.1
 */
export const from = (
  value: Map<AddressType, AccountDiff> | Array<[AddressType, AccountDiff]> | { accounts: Map<AddressType, AccountDiff> }
): Effect.Effect<StateDiffType, StateDiffError> =>
  Effect.try({
    try: () => StateDiff.from(value as Parameters<typeof StateDiff.from>[0]),
    catch: (e) => new StateDiffError((e as Error).message)
  })

/**
 * Gets the account diff for a specific address.
 *
 * @param {StateDiffType} diff - The state diff
 * @param {Uint8Array} address - The address to look up
 * @returns {AccountDiff | undefined} The account diff, or undefined if not found
 *
 * @example
 * ```typescript
 * import { StateDiff } from 'voltaire-effect/primitives'
 *
 * const accountDiff = StateDiff.getAccount(diff, addressBytes)
 * if (accountDiff?.balance) {
 *   console.log('Balance changed:', accountDiff.balance)
 * }
 * ```
 *
 * @since 0.0.1
 */
export const getAccount = (diff: StateDiffType, address: Uint8Array): AccountDiff | undefined =>
  StateDiff.getAccount(diff, address as Parameters<typeof StateDiff.getAccount>[1])

/**
 * Gets all addresses that have changes in the state diff.
 *
 * @param {StateDiffType} diff - The state diff
 * @returns {Uint8Array[]} Array of addresses with changes
 *
 * @example
 * ```typescript
 * import { StateDiff } from 'voltaire-effect/primitives'
 *
 * const addresses = StateDiff.getAddresses(diff)
 * console.log(`${addresses.length} accounts changed`)
 * ```
 *
 * @since 0.0.1
 */
export const getAddresses = (diff: StateDiffType): Uint8Array[] =>
  StateDiff.getAddresses(diff) as Uint8Array[]

/**
 * Checks if a state diff is empty (no changes).
 *
 * @param {StateDiffType} diff - The state diff to check
 * @returns {boolean} True if the diff has no changes
 *
 * @example
 * ```typescript
 * import { StateDiff } from 'voltaire-effect/primitives'
 *
 * if (StateDiff.isEmpty(diff)) {
 *   console.log('No state changes')
 * }
 * ```
 *
 * @since 0.0.1
 */
export const isEmpty = (diff: StateDiffType): boolean =>
  StateDiff.isEmpty(diff)
