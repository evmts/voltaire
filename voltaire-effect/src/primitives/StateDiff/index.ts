/**
 * @fileoverview Effect-based module for Ethereum state diff management.
 * @module StateDiff
 *
 * @description
 * This module provides Effect-based utilities for working with Ethereum state diffs.
 * State diffs track changes to account balances, nonces, and code that occur during
 * transaction execution.
 *
 * Key features:
 * - Type-safe state diff creation with Effect error handling
 * - Schema-based validation using Effect Schema
 * - Query functions for accessing account changes
 * - Support for balance, nonce, and code changes
 *
 * State diffs are essential for:
 * - Transaction simulation and analysis
 * - State synchronization
 * - Debugging and tracing
 * - Gas estimation
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
 *   // Create state diff tracking account changes
 *   const diff = yield* StateDiff.from(new Map([
 *     [addr, {
 *       balance: { from: 1000000000000000000n, to: 500000000000000000n },
 *       nonce: { from: 5n, to: 6n }
 *     }]
 *   ]))
 *
 *   // Check if any changes occurred
 *   if (!StateDiff.isEmpty(diff)) {
 *     // Get all changed addresses
 *     const addresses = StateDiff.getAddresses(diff)
 *
 *     // Get specific account changes
 *     const changes = StateDiff.getAccount(diff, addr)
 *     if (changes?.balance) {
 *       console.log('Balance changed:', changes.balance.from, '->', changes.balance.to)
 *     }
 *   }
 *
 *   return diff
 * })
 * ```
 *
 * @see {@link https://ethereum.org/en/developers/docs/evm/} EVM Documentation
 *
 * @since 0.0.1
 */
export { Schema, AccountDiffSchema, BalanceChangeSchema, NonceChangeSchema, CodeChangeSchema, type StateDiffType, type AccountDiff, type BalanceChange, type NonceChange, type CodeChange } from './StateDiffSchema.js'
export { from, getAccount, getAddresses, isEmpty, StateDiffError } from './from.js'
