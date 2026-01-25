/**
 * @fileoverview Functions for creating and querying Ethereum state diffs.
 * Provides Effect-based constructors and utility functions for StateDiff.
 * @module StateDiff/from
 * @since 0.0.1
 */

import { StateDiff, Address } from '@tevm/voltaire'
import type { StateDiffType, AccountDiff } from './StateDiffSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when state diff operations fail.
 *
 * @description
 * This error is thrown when state diff creation or manipulation fails,
 * typically due to invalid address formats or malformed diff data.
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
 * @description
 * Constructs a StateDiff that maps account addresses to their changes.
 * Accepts Maps, arrays of tuples, or objects with an accounts property.
 *
 * @param {Map<AddressType, AccountDiff> | Array<[AddressType, AccountDiff]> | { accounts: Map<AddressType, AccountDiff> }} value - The state diff data
 * @returns {Effect.Effect<StateDiffType, StateDiffError>} Effect containing the StateDiff or an error
 *
 * @example
 * ```typescript
 * import { StateDiff } from 'voltaire-effect/primitives'
 * import { Address } from '@tevm/voltaire'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const addr = Address('0x1234567890123456789012345678901234567890')
 *
 *   // Create from Map
 *   const diff = yield* StateDiff.from(new Map([
 *     [addr, { balance: { from: 100n, to: 200n } }]
 *   ]))
 *
 *   console.log(StateDiff.getAddresses(diff).length) // 1
 *   return diff
 * })
 * ```
 *
 * @example
 * ```typescript
 * // Create from array of tuples
 * const diff = yield* StateDiff.from([
 *   [addr1, { balance: { from: 100n, to: 200n } }],
 *   [addr2, { nonce: { from: 0n, to: 1n } }]
 * ])
 * ```
 *
 * @throws {StateDiffError} When the input format is invalid
 *
 * @see {@link getAccount} for retrieving account diffs
 * @see {@link getAddresses} for listing changed accounts
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
 * @description
 * Retrieves the changes for a specific account from the state diff.
 * Returns undefined if the address has no changes in this diff.
 *
 * @param {StateDiffType} diff - The state diff
 * @param {Uint8Array} address - The address to look up
 * @returns {AccountDiff | undefined} The account diff, or undefined if not found
 *
 * @example
 * ```typescript
 * import { StateDiff } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const diff = yield* StateDiff.from(new Map([...]))
 *
 *   const accountDiff = StateDiff.getAccount(diff, addressBytes)
 *   if (accountDiff?.balance) {
 *     console.log('Balance change:', accountDiff.balance.from, '->', accountDiff.balance.to)
 *   }
 * })
 * ```
 *
 * @see {@link getAddresses} for listing all changed accounts
 *
 * @since 0.0.1
 */
export const getAccount = (diff: StateDiffType, address: Uint8Array): AccountDiff | undefined =>
  StateDiff.getAccount(diff, address as Parameters<typeof StateDiff.getAccount>[1])

/**
 * Gets all addresses that have changes in the state diff.
 *
 * @description
 * Returns an array of all account addresses that have at least one
 * change recorded in this state diff.
 *
 * @param {StateDiffType} diff - The state diff
 * @returns {Uint8Array[]} Array of addresses with changes
 *
 * @example
 * ```typescript
 * import { StateDiff, Address } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const diff = yield* StateDiff.from(new Map([...]))
 *
 *   const addresses = StateDiff.getAddresses(diff)
 *   console.log(`${addresses.length} accounts changed`)
 *
 *   for (const addr of addresses) {
 *     const changes = StateDiff.getAccount(diff, addr)
 *     console.log('Changes:', changes)
 *   }
 * })
 * ```
 *
 * @see {@link getAccount} for retrieving specific account changes
 *
 * @since 0.0.1
 */
export const getAddresses = (diff: StateDiffType): Uint8Array[] =>
  StateDiff.getAddresses(diff) as Uint8Array[]

/**
 * Checks if a state diff is empty (no changes).
 *
 * @description
 * Returns true if the state diff contains no account changes.
 * Useful for optimization when processing transaction results.
 *
 * @param {StateDiffType} diff - The state diff to check
 * @returns {boolean} True if the diff has no changes
 *
 * @example
 * ```typescript
 * import { StateDiff } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const diff = yield* StateDiff.from(new Map())
 *
 *   if (StateDiff.isEmpty(diff)) {
 *     console.log('No state changes occurred')
 *   } else {
 *     console.log('State was modified')
 *   }
 * })
 * ```
 *
 * @since 0.0.1
 */
export const isEmpty = (diff: StateDiffType): boolean =>
  StateDiff.isEmpty(diff)
