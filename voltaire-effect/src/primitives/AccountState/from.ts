/**
 * @fileoverview Functions for creating and querying Ethereum account state.
 * Provides Effect-based constructors and utility functions for AccountState.
 * @module AccountState/from
 * @since 0.0.1
 */

import { Uint } from '@tevm/voltaire'
import { Bytes32, type Bytes32Type } from '@tevm/voltaire/Bytes'
import type { AccountStateType } from './AccountStateSchema.js'
import { EMPTY_CODE_HASH, EMPTY_STORAGE_ROOT } from './AccountStateSchema.js'
import * as Effect from 'effect/Effect'

/**
 * Input format for creating an AccountState.
 * Accepts flexible input types with optional codeHash and storageRoot.
 *
 * @description
 * When codeHash or storageRoot are omitted, they default to the empty
 * values (EMPTY_CODE_HASH and EMPTY_STORAGE_ROOT respectively).
 *
 * @example
 * ```typescript
 * const input: AccountStateInput = {
 *   nonce: 0n,
 *   balance: 1000000000000000000n
 *   // codeHash and storageRoot default to empty values
 * }
 * ```
 *
 * @since 0.0.1
 */
export interface AccountStateInput {
  nonce: bigint | number | string
  balance: bigint | number | string
  codeHash?: string | Uint8Array | bigint | number
  storageRoot?: string | Uint8Array | bigint | number
}

/**
 * Creates an AccountState from flexible input formats.
 *
 * @description
 * This function wraps account state creation in an Effect, providing
 * type-safe error handling. It normalizes various input formats
 * (strings, numbers, bigints) into the canonical AccountStateType.
 *
 * @param {AccountStateInput} input - The account state data
 * @returns {Effect.Effect<AccountStateType, Error>} Effect containing the AccountState or an error
 *
 * @example
 * ```typescript
 * import { AccountState } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* AccountState.from({
 *     nonce: 5n,
 *     balance: '1000000000000000000' // 1 ETH in wei
 *   })
 *   console.log(state.balance) // 1000000000000000000n
 *   return state
 * })
 *
 * Effect.runPromise(program)
 * ```
 *
 * @throws {Error} When nonce or balance values are invalid
 * @throws {Error} When codeHash or storageRoot cannot be parsed as Bytes32
 *
 * @see {@link empty} for creating an empty account state
 * @see {@link AccountStateSchema} for schema-based validation
 *
 * @since 0.0.1
 */
export const from = (input: AccountStateInput): Effect.Effect<AccountStateType, Error> =>
  Effect.try({
    try: () => {
      const nonce = Uint.from(input.nonce)
      const balance = Uint.from(input.balance)
      const codeHash = input.codeHash
        ? Bytes32.Bytes32(input.codeHash as string | Uint8Array | bigint | number)
        : EMPTY_CODE_HASH
      const storageRoot = input.storageRoot
        ? Bytes32.Bytes32(input.storageRoot as string | Uint8Array | bigint | number)
        : EMPTY_STORAGE_ROOT
      return {
        nonce,
        balance,
        codeHash,
        storageRoot,
        __tag: 'AccountState'
      } as AccountStateType
    },
    catch: (e) => e as Error
  })

/**
 * Creates an empty AccountState with zero values.
 *
 * @description
 * Returns an account state representing a non-existent or newly created account:
 * - nonce: 0n
 * - balance: 0n
 * - codeHash: EMPTY_CODE_HASH (keccak256 of empty bytes)
 * - storageRoot: EMPTY_STORAGE_ROOT (root of empty trie)
 *
 * @returns {AccountStateType} An empty account state
 *
 * @example
 * ```typescript
 * import { AccountState } from 'voltaire-effect/primitives'
 *
 * const emptyState = AccountState.empty()
 * console.log(emptyState.nonce)   // 0n
 * console.log(emptyState.balance) // 0n
 * console.log(AccountState.isEmpty(emptyState)) // true
 * ```
 *
 * @see {@link isEmpty} to check if an account state is empty
 *
 * @since 0.0.1
 */
export const empty = (): AccountStateType => ({
  nonce: 0n,
  balance: 0n,
  codeHash: EMPTY_CODE_HASH,
  storageRoot: EMPTY_STORAGE_ROOT,
  __tag: 'AccountState'
} as AccountStateType)

/**
 * Checks if an account is a contract (has non-empty code).
 *
 * @description
 * A contract account has a codeHash that differs from EMPTY_CODE_HASH.
 * Externally owned accounts (EOAs) always have the empty code hash.
 *
 * @param {AccountStateType} state - The account state to check
 * @returns {boolean} True if the account has contract code
 *
 * @example
 * ```typescript
 * import { AccountState } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   const state = yield* AccountState.from({
 *     nonce: 1n,
 *     balance: 0n,
 *     codeHash: '0x...' // Non-empty code hash
 *   })
 *   if (AccountState.isContract(state)) {
 *     console.log('This is a contract account')
 *   }
 * })
 * ```
 *
 * @see {@link isEmpty} to check if an account is empty
 *
 * @since 0.0.1
 */
export const isContract = (state: AccountStateType): boolean =>
  !isEmptyCodeHash(state.codeHash)

/**
 * Checks if an account state represents an empty/non-existent account.
 *
 * @description
 * An account is considered empty if:
 * - nonce is 0
 * - balance is 0
 * - codeHash equals EMPTY_CODE_HASH
 *
 * Empty accounts can be deleted from the state trie (EIP-158).
 *
 * @param {AccountStateType} state - The account state to check
 * @returns {boolean} True if the account is empty
 *
 * @example
 * ```typescript
 * import { AccountState } from 'voltaire-effect/primitives'
 *
 * const state = AccountState.empty()
 * console.log(AccountState.isEmpty(state)) // true
 *
 * // An account with balance is not empty
 * const funded = { ...state, balance: 1n }
 * console.log(AccountState.isEmpty(funded)) // false
 * ```
 *
 * @see {@link empty} to create an empty account state
 * @see {@link isContract} to check if account is a contract
 *
 * @since 0.0.1
 */
export const isEmpty = (state: AccountStateType): boolean =>
  state.nonce === 0n &&
  state.balance === 0n &&
  isEmptyCodeHash(state.codeHash)

/**
 * Compares a code hash to the empty code hash constant.
 * @internal
 */
const isEmptyCodeHash = (codeHash: Bytes32Type): boolean => {
  for (let i = 0; i < 32; i++) {
    if (codeHash[i] !== EMPTY_CODE_HASH[i]) return false
  }
  return true
}
