/**
 * @fileoverview Effect-based module for Ethereum account state management.
 * @module AccountState
 *
 * @description
 * This module provides Effect-based utilities for working with Ethereum account state.
 * Account state represents the fundamental unit of state in the Ethereum state trie,
 * containing nonce, balance, code hash, and storage root for each account.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as AccountState from 'voltaire-effect/primitives/AccountState'
 *
 * function processAccount(state: AccountState.AccountStateType) {
 *   // ...
 * }
 * ```
 *
 * Key features:
 * - Type-safe account state creation with Effect error handling
 * - Schema-based validation using Effect Schema
 * - Helper functions for checking contract status and empty accounts
 * - Constants for empty code hash and storage root
 *
 * @example
 * ```typescript
 * import { AccountState } from 'voltaire-effect/primitives'
 * import { Effect } from 'effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create account state from input
 *   const state = yield* AccountState.from({
 *     nonce: 5n,
 *     balance: 1000000000000000000n // 1 ETH
 *   })
 *
 *   // Check account properties
 *   if (AccountState.isContract(state)) {
 *     console.log('Contract account')
 *   }
 *
 *   if (AccountState.isEmpty(state)) {
 *     console.log('Empty account')
 *   }
 *
 *   return state
 * })
 * ```
 *
 * @see {@link https://ethereum.org/en/developers/docs/accounts/} Ethereum Accounts
 *
 * @since 0.0.1
 */
export {
	AccountStateSchema,
	type AccountStateType,
	EMPTY_CODE_HASH,
	EMPTY_STORAGE_ROOT,
} from "./Struct.js";
